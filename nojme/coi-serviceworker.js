/*
 * coi-serviceworker.js — cross-origin isolation на хостингах без
 * настраиваемых HTTP-заголовков (GitHub Pages, gitlab.io и т.п.).
 *
 * Зачем: ядро nojme собрано с настоящими pthreads (Java-потоки =
 * WebAssembly workers), и Emscripten передаёт воркерам общую память
 * через postMessage(SharedArrayBuffer). С 2021 года браузеры дают SAB
 * только cross-origin isolated страницам, для чего ЛЮБОЙ сервер обязан
 * прислать вместе с index.html два заголовка:
 *
 *     Cross-Origin-Opener-Policy: same-origin
 *     Cross-Origin-Embedder-Policy: require-corp
 *
 * GitHub Pages свои заголовки задать не позволяет — но есть обход:
 * Service Worker перехватывает навигационный запрос и ДОБАВЛЯЕТ оба
 * заголовка к ответу. Браузер (Chrome/Edge/Firefox) уважает заголовки
 * SW-ответа при вычислении изоляции.
 *
 * Как работает этот файл (одна и та же роль файла — двойная):
 *   1) На странице: регистрирует САМОГО СЕБЯ как Service Worker и после
 *      активации один раз перезагружает страницу (первая загрузка была
 *      без заголовков — изоляцию дают только заголовки при загрузке
 *      документа). До перезагрузки выставляет window.__coiPending,
 *      чтобы nojme_app.js не стартовал модуль в заведомо падком
 *      окружении (DataCloneError на postMessage).
 *   2) В роли Service Worker: ко всем HTML-навигациям дописывает
 *      COOP/COEP. Остальные запросы (wasm/data/js) не трогает — они
 *      same-origin и COEP их пропускает.
 *
 * Ограничения:
 *   - Safari не применяет изоляцию по SW-заголовкам (после перезагрузки
 *     страница всё равно не изолирована; nojme_app.js покажет баннер).
 *   - Нужен HTTPS или localhost (условие Service Worker).
 *   - Первое открытие сайта = одна автоматическая перезагрузка.
 *
 * Оригинальная идея: https://github.com/gzuidhof/coi-serviceworker
 * (здесь — переработанная версия с защитой от цикла перезагрузок
 * через sessionStorage и уведомлением приложения о состоянии).
 */
(function () {
  "use strict";

  /* ==================== РОЛЬ 1: Service Worker ==================== */
  if (typeof window === "undefined" &&
      typeof self !== "undefined" &&
      typeof self.skipWaiting === "function") {

    self.addEventListener("install", function () {
      self.skipWaiting();               /* не ждём закрытия старых вкладок */
    });

    self.addEventListener("activate", function (event) {
      event.waitUntil(self.clients.claim());  /* берём вкладки под контроль сразу */
    });

    self.addEventListener("fetch", function (event) {
      var req = event.request;

      if (req.method !== "GET") return;
      /* обход старого бага Chrome (only-if-cached + no-cors) */
      if (req.cache === "only-if-cached" && req.mode === "no-cors") return;

      /* 1) Навигации: HTML-документ получает COOP/COEP — страница
            становится cross-origin isolated. */
      var isNavigate = req.mode === "navigate";
      /* 2) Скрипты воркеров: Emscripten-pthreads создаёт воркеры как
            new Worker("nojme.js"). По спецификации, если у страницы
            COEP=require-corp, то ответ скрипта воркера САМ обязан нести
            COEP — иначе загрузка молча блокируется и пул потоков висит
            навсегда (именно это ломало запуск без патча). */
      var isWorkerScript = req.destination === "worker" ||
                           req.destination === "sharedworker";
      /* 3) AudioWorklet-модули — на всякий случай, тем же правилом. */
      var isAudioWorklet = req.destination === "audioworklet";

      if (!isNavigate && !isWorkerScript && !isAudioWorklet) return;

      event.respondWith(
        fetch(req).then(function (response) {
          if (!response || response.type === "opaqueredirect") return response;
          var headers = new Headers(response.headers);
          headers.set("Cross-Origin-Opener-Policy", "same-origin");
          headers.set("Cross-Origin-Embedder-Policy", "require-corp");
          headers.set("Cross-Origin-Resource-Policy", "same-origin");
          /* HTML не должен застревать в кеше без заголовков изоляции */
          if (isNavigate) headers.set("Cache-Control", "no-cache");
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        })
      );
    });
    return;
  }

  /* ==================== РОЛЬ 2: скрипт на странице ==================== */

  /* Страница уже изолирована (сервер сам прислал COOP/COEP) — не мешаем. */
  if (window.crossOriginIsolated) return;

  var swSupported = "serviceWorker" in navigator;
  var secure = window.isSecureContext;

  if (!swSupported || !secure) {
    window.__coiFailed = true;
    if (!swSupported) {
      console.warn("[coi] Service Worker не поддерживается — изоляцию " +
                   "включить нельзя (Safari или очень старый браузер).");
    } else {
      console.warn("[coi] Требуется HTTPS (или localhost) — Service " +
                   "Worker недоступен, изоляция не включится.");
    }
    return;
  }

  /* sessionStorage в приватных режимах может кидать исключение —
     без него перезагрузку не делаем (иначе риск бесконечного цикла) */
  var canPersist = true;
  try { sessionStorage.setItem("nojme-coi-probe", "1"); sessionStorage.removeItem("nojme-coi-probe"); }
  catch (e) { canPersist = false; }

  /* Сигнал для nojme_app.js: сейчас включаем изоляцию — модуль не стартовать */
  window.__coiPending = true;

  var RELOAD_KEY = "nojme-coi-reloaded";
  var swUrl = (document.currentScript && document.currentScript.src) ||
              "coi-serviceworker.js";

  function fail(msg, err) {
    window.__coiPending = false;
    window.__coiFailed = true;
    console.error("[coi] " + msg + (err ? (": " + err) : ""));
  }

  navigator.serviceWorker.register(swUrl, { updateViaCache: "none" }).then(function () {
    /* ждём, пока SW станет активным для области видимости */
    return navigator.serviceWorker.ready;
  }).then(function () {
    if (window.crossOriginIsolated) {
      /* неожиданно всё уже хорошо — перезагрузка не нужна */
      window.__coiPending = false;
      return;
    }
    var alreadyReloaded = false;
    try { alreadyReloaded = !!sessionStorage.getItem(RELOAD_KEY); } catch (e) {}
    if (alreadyReloaded || !canPersist) {
      fail("Страница не стала cross-origin isolated даже через Service " +
           "Worker. Откройте сайт в Chrome, Edge или Firefox.");
      return;
    }
    try { sessionStorage.setItem(RELOAD_KEY, "1"); } catch (e) {}
    location.reload();          /* теперь HTML придёт с COOP/COEP */
  }).catch(function (err) {
    fail("Не удалось зарегистрировать Service Worker", err);
  });
})();
