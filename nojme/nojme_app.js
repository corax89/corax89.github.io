/*
 * nojme_app.js — фронтенд web-сборки nojme (сессия 82, редизайн «интернет-2000»).
 *
 * Главный JS-поток НЕ вызывает retro_run (это делает web_glue.c на своём
 * pthread-воркере — Atomics.wait на main thread запрещён). Здесь только:
 *   - загрузка модуля, IDBFS (/rms — персистентность RecordStore);
 *   - АВТОЗАПУСК M3GTest при загрузке страницы;
 *   - надёжный перезапуск: launchGame() ставит игру в очередь, если старая
 *     ещё останавливается; как только раннер умирает (терминальный статус
 *     от web_glue, v34.82 публикует статус ПОСЛЕ чистки ядра) — стартуем.
 *     Лечит «после остановки следующий мидлет не всегда запускается»;
 *   - вывод кадров на canvas (requestAnimationFrame);
 *   - аудио — ОДИН AudioContext на всё время жизни страницы (создание нового
 *     на каждый старт упиралось в лимит браузера ~6 контекстов);
 *   - ввод (клавиатура/мышь/тач/геймпад -> атомарные маски web_glue);
 *   - лог ядра НЕ отображается: кольцо web_log_take читается в скрытый
 *     буфер только для версии ядра и хвоста сообщений при ошибке.
 */
"use strict";

(function () {

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const canvas = $("screen");
const ctx2d = canvas.getContext("2d");
const stStatus = $("stStatus");   /* сегменты статус-бара */
const stFps = $("stFps");
const stRes = $("stRes");
const stFrames = $("stFrames");
const navBuild = $("navBuild");
const navState = $("navState");
const btnStop = $("btnStop");
const btnRestart = $("btnRestart");
const addrBar = $("addrBar");

/* ---------- статусы web_glue ---------- */
const ST = {
  0: "ожидание",
  1: "загрузка игры…",
  2: "РАБОТАЕТ",
  3: "мидлет завершён",
  4: "ошибка загрузки",
  5: "остановлено",
  6: "ошибка ядра",
};

/* ---------- state ---------- */
let Module = null;
let running = false;        /* запущено (в т.ч. останавливается сейчас) */
let stopRequested = false;  /* web_stop() уже отправлен */
let stopRequestedAt = 0;
let pendingStart = null;    /* { path } — стартовать сразу после смерти раннера */
let startRetryTimer = null;
let moduleReady = false;

let imgData = null, imgPixels = null, lastW = 0, lastH = 0;
let audioCtx = null, scriptNode = null, audioScratch = null;
let audioFrac = 0;
let blitFrames = 0, lastFpsT = performance.now(), lastFpsFrames = 0;

/* скрытый буфер лога — только для ошибок и версии ядра */

/* отладочная ручка: window.__nojmeDebug.logTail() — последние строки лога
 * ядра (для поддержки/диагностики из консоли, в UI лог не показывается) */
window.__nojmeDebug = {
  logTail: () => logTail.slice(-80).join("\n"),
  state: () => ({
    running: running, stopRequested: stopRequested,
    pendingStart: pendingStart && pendingStart.path,
    status: Module ? Module._web_get_status() : null,
    frames: Module ? Module._web_get_frames() : 0,
  }),
  events: () => dbgEvents.slice(-40).join("\n"),
};
const dbgEvents = [];
const dbgEv = (msg) => {
  dbgEvents.push(performance.now().toFixed(0) + "мс " + msg +
    " [running=" + running + " stop=" + stopRequested +
    " pend=" + (pendingStart && pendingStart.path) +
    " st=" + (Module ? Module._web_get_status() : "-") +
    " fr=" + (Module ? Module._web_get_frames() : 0) + "]");
  if (dbgEvents.length > 200) dbgEvents.shift();
};
let logScratch = null;
const logDecoder = new TextDecoder("utf-8", { fatal: false });
let logTail = [];           /* последние строки */
let logPending = "";

const DEFAULT_JAR = "/games/M3GTest.jar";

/* ---------- утилиты ---------- */
function statusText() {
  if (running && stopRequested) return "останавливаю…";
  const st = Module ? Module._web_get_status() : 0;
  return ST[st] || "?";
}
function refreshStatus() {
  const t = statusText();
  stStatus.textContent = t;
  navState.textContent = t;
  btnStop.disabled = !(running && !stopRequested);
}
function showError(title, text, withLog) {
  $("errTitle").textContent = title;
  $("errMsg").textContent = text;
  $("errLogWrap").style.display = withLog ? "block" : "none";
  if (withLog) $("errLog").textContent = logTail.slice(-40).join("\n");
  $("errBox").style.display = "block";
}
function hideError() { $("errBox").style.display = "none"; }

/* ---------- запуск/остановка (ядро надёжного перезапуска) ---------- */

let lastPath = DEFAULT_JAR;

function applyOptions() {
  /* параметры читаются ядром при retro_load_game — применяются к СЛЕДУЮЩЕМУ запуску */
  let res = $("selRes").value;
  if (res === "__custom") {
    res = $("customRes").value.trim();
    if (!/^[0-9]{1,4}x[0-9]{1,4}$/.test(res)) res = "auto";
  }
  const set = Module.cwrap("web_set_option", "number", ["string", "string"]);
  const setEnv = Module.cwrap("web_set_envvar", "number", ["string", "string"]);
  set("j2me_resolution", res);
  set("j2me_vm_speed", $("selSpeed").value);
  set("j2me_fps", $("selFps").value);
  set("j2me_audio_rate", $("selAudio").value);
  set("j2me_pixel_format", "RGB565");
  set("j2me_rotation", "off");
  set("j2me_touch_input", "on");
  set("j2me_neon", "on");
  set("j2me_scaling", "Aspect");
  setEnv("NOJME_HEAP_MB", $("selHeap").value);
}

/* Запустить игру. Если старая ещё работает/останавливается — сначала
 * остановим её и поставим новую в очередь (старый код молча терял клик). */
function launchGame(path) {
  if (!moduleReady) return;
  lastPath = path || DEFAULT_JAR;
  dbgEv("launchGame(" + lastPath + ")");
  hideError();
  if (running) {
    pendingStart = { path: path };
    if (!stopRequested) {
      stopRequested = true;
      stopRequestedAt = performance.now();
      Module._web_stop();
    }
    refreshStatus();
    return;
  }
  tryStart(path, 0);
}

/* web_start с ретраями: -2 = раннер прошлого запуска ещё не умер
 * (окно в пару инструкций; при v34.82 практически исключено, но
 * подстрахуемся — ретрай раз в 250 мс до 10 с). */
function tryStart(path, attempt) {
  if (!moduleReady) return;
  applyOptions();
  ensureAudio(parseInt($("selAudio").value, 10) || 22050);

  const start = Module.cwrap("web_start", "number", ["string"]);
  TRACE.enter("web_start " + path);
  const rc = start(path);
  TRACE.exit("web_start rc=" + rc);
  dbgEv("web_start rc=" + rc);
  if (rc === 0) {
    running = true;
    stopRequested = false;
    pendingStart = null;
    refreshStatus();
    return;
  }
  if (rc === -2 && attempt < 40) {
    startRetryTimer = setTimeout(() => tryStart(path, attempt + 1), 250);
    return;
  }
  const err = Module.UTF8ToString(Module._web_get_error());
  showError("Ошибка запуска",
    "Не удалось запустить мидлет (код " + rc + (err ? ": " + err : "") + ").", true);
}

function stopGame() {
  if (!running || stopRequested) return;
  dbgEv("stopGame (кнопка)");
  stopRequested = true;
  stopRequestedAt = performance.now();
  pendingStart = null;      /* явный «Стоп» отменяет отложенный запуск */
  Module._web_stop();
  refreshStatus();
}

/* ---------- модуль ---------- */

function initModuleApi() {
  window.__nojme = Module; /* debug/testing handle */
  Module.ccall("web_boot");

  /* /rms — персистентные RecordStore (IDBFS) */
  try {
    Module.FS.mkdir("/rms");
    Module.FS.mount(Module.IDBFS, {}, "/rms");
    Module.FS.syncfs(true, (err) => {
      if (err) logTail.push("[web] syncfs(load): " + err);
    });
  } catch (e) { /* повторный mount при перезагрузке страницы — не страшно */ }

  logScratch = Module._malloc(65536);
  audioScratch = Module._malloc(4096 * 4);

  moduleReady = true;

  /* автозапуск: обычный — встроенный M3GTest; тестовый (?autostart=1) —
   * параметры и jar из URL (для автотестов и проверки других игр) */
  if (TEST_MODE) {
    if (params.get("res")) $("selRes").value = params.get("res");
    if (params.get("speed")) $("selSpeed").value = params.get("speed");
    if (params.get("heap")) $("selHeap").value = params.get("heap");
  }
  /* ?diag=1 — диагностика ядра в браузере: TLAB выкл + GC debug
   * (разбор проблем кучи; сильно медленнее, только для отладки) */
  if (params.get("diag")) {
    Module.ccall("web_set_option", "number", ["string", "string"],
                 ["j2me_diag", "1"]);
  }
  setTimeout(() => launchGame(AUTO_JAR), 300);
}

async function boot() {
  const isolated = typeof SharedArrayBuffer !== "undefined" && crossOriginIsolated;
  const isoSeg = $("isoSeg");
  if (isolated) {
    if (isoSeg) isoSeg.textContent = "cross-origin isolated";
  } else if (window.__coiPending) {
    /* coi-serviceworker.js прямо сейчас включает изоляцию и перезагрузит
     * страницу; стартовать модуль нельзя — postMessage(SAB) без изоляции
     * бросит DataCloneError ещё в preRun. */
    if (isoSeg) isoSeg.textContent = "включаю изоляцию…";
    setTimeout(boot, 1500);
    return;
  } else {
    if (isoSeg) isoSeg.textContent = "БЕЗ изоляции — потоки не стартуют";
    const note = $("isoNote");
    if (note) note.style.display = "block";
  }
  try {
    const factory = window.NojmeFactory;
    Module = await factory({
      locateFile: (p) => p,
      print: () => {},
      printErr: (t) => {
        if (String(t).indexOf("wasm streaming") >= 0) return;
      },
    });
    initModuleApi();
  } catch (e) {
    navState.textContent = "модуль не загрузился";
    showError("Ошибка",
      "Не удалось загрузить ядро nojme: " + e +
      (isolated ? "" : " (нет cross-origin isolation — см. подсказку внизу страницы)"), false);
  }
}

/* ---------- вывод кадров ---------- */

function blit() {
  if (Module && running) {
    const idx = traceSync("frame_index", () => Module._web_get_frame_index());
    if (idx >= 0) {
      const w = Module._web_get_frame_w(idx), h = Module._web_get_frame_h(idx);
      if (w > 0 && h > 0) {
        if (w !== lastW || h !== lastH) {
          lastW = w; lastH = h;
          canvas.width = w; canvas.height = h;
          imgData = ctx2d.createImageData(w, h);
          imgPixels = new Uint32Array(imgData.data.buffer);
          stRes.textContent = w + "×" + h;
          applyScale();
        }
        const buf = Module._web_get_frame_buf(idx);
        if (buf) {
          imgPixels.set(new Uint32Array(Module.HEAPU32.buffer, buf, w * h));
          ctx2d.putImageData(imgData, 0, 0);
          blitFrames++;
        }
      }
    }
  }
  requestAnimationFrame(blit);
}
requestAnimationFrame(blit);

/* масштаб канваса (чистый CSS, перезапуск не нужен) */
function applyScale() {
  const s = $("selScale").value;
  if (s === "fit") {
    canvas.style.width = "";
    canvas.style.height = "";
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "70vh";
  } else {
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    canvas.style.width = Math.round(lastW * parseFloat(s)) + "px";
    canvas.style.height = "";
  }
}

/* ---------- аудио (один AudioContext на страницу) ---------- */

function ensureAudio(wantedRate) {
  if (audioCtx && audioCtx.sampleRate === wantedRate) {
    audioCtx.resume();
    return;
  }
  if (audioCtx) {
    try { scriptNode.disconnect(); } catch (e) {}
    try { audioCtx.close(); } catch (e) {}
  }
  try {
    audioCtx = new AudioContext({ sampleRate: wantedRate });
  } catch (e) {
    audioCtx = new AudioContext();
  }
  audioFrac = 0;
  scriptNode = audioCtx.createScriptProcessor(2048, 0, 2);
  scriptNode.onaudioprocess = onAudio;
  scriptNode.connect(audioCtx.destination);
  audioCtx.resume();
}

/* политика автовоспроизведения: контекст, созданный без жеста, спит —
 * будим его первым кликом/клавишей */
function wakeAudio() {
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}
window.addEventListener("pointerdown", wakeAudio);
window.addEventListener("keydown", wakeAudio);

function onAudio(ev) {
  const L = ev.outputBuffer.getChannelData(0);
  const R = ev.outputBuffer.getChannelData(1);
  const n = L.length;
  if (!Module || !running) { L.fill(0); R.fill(0); return; }
  const coreRate = traceSync("get_sample_rate", () => Module._web_get_sample_rate());
  const outRate = audioCtx.sampleRate;
  const need = Math.ceil(n * coreRate / outRate) + 4;
  const got = traceSync("audio_pull", () => Module._web_audio_pull(audioScratch, Math.min(need, 2048)));
  const src = new Int16Array(Module.HEAPU16.buffer, audioScratch, got * 2);
  if (outRate === coreRate) {
    for (let i = 0; i < n; i++) {
      if (i < got) { L[i] = src[i * 2] / 32768; R[i] = src[i * 2 + 1] / 32768; }
      else { L[i] = 0; R[i] = 0; }
    }
  } else {
    /* линейная интерполяция с непрерывной фазой между блоками */
    for (let i = 0; i < n; i++) {
      const pos = audioFrac + i * coreRate / outRate;
      const i0 = Math.floor(pos), i1 = i0 + 1;
      const t = pos - i0;
      if (i1 < got) {
        L[i] = (src[i0 * 2] + (src[i1 * 2] - src[i0 * 2]) * t) / 32768;
        R[i] = (src[i0 * 2 + 1] + (src[i1 * 2 + 1] - src[i0 * 2 + 1]) * t) / 32768;
      } else if (i0 < got) {
        L[i] = src[i0 * 2] / 32768; R[i] = src[i0 * 2 + 1] / 32768;
      } else { L[i] = 0; R[i] = 0; }
    }
    audioFrac += n * coreRate / outRate - got;
    if (audioFrac < 0) audioFrac = 0;
  }
}

/* ---------- лог (скрытый): версия ядра + хвост для диалога ошибок ---------- */

/* ---------- служебная трассировка: кольцевой буфер маркеров wasm-вызовов.
 * В UI не показывается. window.__nojmeTrace.dump() из консоли — последние
 * 60 событий (последний «>» без «<» = вызов завис); !SLOW — дольше 150 мс. ---------- */
const TRACE = window.__nojmeTrace = {
  buf: [],
  enter: (name) => { TRACE.buf.push(performance.now().toFixed(0) + " >" + name); if (TRACE.buf.length > 400) TRACE.buf.shift(); },
  exit: (name) => { TRACE.buf.push(performance.now().toFixed(0) + " <" + name); if (TRACE.buf.length > 400) TRACE.buf.shift(); },
  slow: (name, dt) => { TRACE.buf.push("!SLOW " + name + " " + dt.toFixed(0) + "ms"); },
  dump: () => TRACE.buf.slice(-60).join("\n"),
};
const traceSync = (name, fn) => {
  const t0 = performance.now();
  TRACE.enter(name);
  try { return fn(); }
  finally {
    TRACE.exit(name);
    const dt = performance.now() - t0;
    if (dt > 150) TRACE.slow(name, dt);
  }
};

function pollLog() {
  if (!Module || !logScratch) return;
  const n = traceSync("log_take", () => Module._web_log_take(logScratch, 65536 - 1));
  if (n > 0) {
    /* HEAPU8 — view на SharedArrayBuffer; TextDecoder такое не декодирует */
    const copy = new Uint8Array(n);
    copy.set(new Uint8Array(Module.HEAPU8.buffer, logScratch, n));
    const text = logPending + logDecoder.decode(copy);
    const lines = text.split("\n");
    logPending = lines.pop() || "";
    for (const ln of lines) {
      if (ln.length) {
        logTail.push(ln);
        const m = ln.match(/core BUILD: (v[\d.]+)/);
        if (m) navBuild.textContent = m[1];
      }
    }
    if (logTail.length > 200) logTail.splice(0, logTail.length - 200);
  }
}
setInterval(pollLog, 350);

/* ---------- статус: авто-продолжение очереди ---------- */

const TERMINAL = { 3: 1, 4: 1, 5: 1, 6: 1 };
let lastStatT = performance.now(), lastStatFrames = 0;

function pollStatus() {
  if (!Module) return;
  const st = traceSync("get_status", () => Module._web_get_status());

  if (running && TERMINAL[st]) {
    /* раннер мёртв (v34.82: терминальный статус гарантирует это) */
    dbgEv("terminal st=" + st);
    running = false;
    const wasStopping = stopRequested;
    stopRequested = false;
    Module._web_input_clear();
    try { Module.FS.syncfs(false, () => {}); } catch (e) {}
    refreshStatus();

    if (wasStopping && pendingStart) {
      /* отложенный запуск следующего мидлета */
      const p = pendingStart;
      pendingStart = null;
      dbgEv("auto-continue -> " + p.path);
      setTimeout(() => tryStart(p.path, 0), 150);
    }
  } else if (running && stopRequested) {
    /* сторожевой таймер: ядро обязано остановиться (jvm_destroy ждёт
     * Java-потоки до 3 с; 15 с — запас на самый тяжёлый случай) */
    if (performance.now() - stopRequestedAt > 15000) {
      stopRequested = false;
      refreshStatus();
      showError("Ядро не остановилось",
        "Мидлет не ответил на команду остановки за 15 секунд " +
        "(вероятно, завис в нативном коде). Нажмите «Перезагрузить страницу».", true);
    }
  }

  const frames = Module._web_get_frames();
  const now = performance.now();
  const dt = (now - lastStatT) / 1000;
  if (dt >= 1.0) {
    /* при перезапуске счётчик кадров ядра сбрасывается в 0 — не даём
     * отрицательного FPS в статус-баре */
    if (frames < lastStatFrames) lastStatFrames = frames;
    const coreFps = Math.round((frames - lastStatFrames) / dt);
    lastStatT = now; lastStatFrames = frames;
    stFrames.textContent = String(frames);
    stFps.textContent = coreFps + " к/с";
    const blitFps = Math.round((blitFrames - lastFpsFrames) / ((now - lastFpsT) / 1000));
    lastFpsT = now; lastFpsFrames = blitFrames;
  }
  refreshStatus();
}
setInterval(pollStatus, 300);

/* периодическое сохранение RMS */
setInterval(() => {
  if (Module && running) {
    try { Module.FS.syncfs(false, () => {}); } catch (e) {}
  }
}, 15000);

/* ---------- ввод ---------- */

const JOY = {
  B: 0, Y: 1, SELECT: 2, START: 3, UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7,
  A: 8, X: 9, L: 10, R: 11, L2: 12, R2: 13,
};

const KEYMAP = {
  ArrowUp: ["j", JOY.UP], ArrowDown: ["j", JOY.DOWN],
  ArrowLeft: ["j", JOY.LEFT], ArrowRight: ["j", JOY.RIGHT],
  Enter: ["j", JOY.A], " ": ["j", JOY.A], KeyZ: ["j", JOY.A],
  KeyX: ["j", JOY.B], KeyC: ["j", JOY.X],
  KeyQ: ["j", JOY.SELECT], KeyE: ["j", JOY.START],
  Digit1: ["j", JOY.Y], Digit2: ["j", JOY.L], Digit3: ["j", JOY.R],
  Digit4: ["j", JOY.L2], Digit5: ["j", JOY.R2],
  Digit0: ["k", 48], Digit6: ["k", 54], Digit7: ["k", 55],
  Digit8: ["k", 56], Digit9: ["k", 57],
  "*": ["k", 42], "#": ["k", 35],
  Numpad0: ["k", 48], Numpad6: ["k", 54], Numpad7: ["k", 55],
  Numpad8: ["k", 56], Numpad9: ["k", 57],
  NumpadEnter: ["j", JOY.A],
};

function keyEvent(e, down) {
  if (!Module) return;
  let m = KEYMAP[e.key];
  if (!m && e.code) m = KEYMAP[e.code];
  if (!m) {
    if (/^[0-9]$/.test(e.key)) m = ["k", e.key.charCodeAt(0)];
    else if (e.key === "*" || e.key === "#") m = ["k", e.key.charCodeAt(0)];
  }
  if (!m) return;
  e.preventDefault();
  if (m[0] === "j") Module._web_key_joypad(m[1], down ? 1 : 0);
  else Module._web_key_keyboard(m[1], down ? 1 : 0);
}

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  keyEvent(e, true);
}, { passive: false });
window.addEventListener("keyup", (e) => keyEvent(e, false));
window.addEventListener("blur", () => { if (Module) Module._web_input_clear(); });

/* --- тач/мышь --- */

function canvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;
  const y = (ev.clientY - r.top) / r.height;
  return [x, y];
}
function toRange(v) {
  let n = Math.round(v * 65536) - 32768;
  if (n > 32767) n = 32767; if (n < -32768) n = -32768;
  return n;
}
canvas.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  canvas.setPointerCapture(ev.pointerId);
  const [x, y] = canvasPos(ev);
  Module && Module._web_pointer(toRange(x), toRange(y), 1);
});
canvas.addEventListener("pointermove", (ev) => {
  if (!Module) return;
  if (ev.buttons & 1) {
    const [x, y] = canvasPos(ev);
    Module._web_pointer(toRange(x), toRange(y), 1);
  }
  if (ev.pointerType === "mouse") {
    Module._web_mouse_delta(ev.movementX | 0, ev.movementY | 0, (ev.buttons & 1) ? 1 : 0);
  }
});
window.addEventListener("pointerup", (ev) => {
  if (!Module) return;
  Module._web_pointer(0, 0, 0);
  if (ev.pointerType === "mouse") Module._web_mouse_delta(0, 0, 0);
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

/* --- геймпад --- */

const PADMAP = {
  0: JOY.A, 1: JOY.B, 2: JOY.X, 3: JOY.Y,
  4: JOY.L, 5: JOY.R, 6: JOY.L2, 7: JOY.R2,
  8: JOY.SELECT, 9: JOY.START,
  12: JOY.UP, 13: JOY.DOWN, 14: JOY.LEFT, 15: JOY.RIGHT,
};
const padPrev = {};
function pollGamepad() {
  if (!Module || !navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  for (const p of pads) {
    if (!p) continue;
    for (const idxStr in PADMAP) {
      const idx = parseInt(idxStr, 10);
      const pressed = p.buttons[idx] && p.buttons[idx].pressed;
      const was = padPrev[p.index + ":" + idx] || false;
      if (pressed !== was) {
        Module._web_key_joypad(PADMAP[idx], pressed ? 1 : 0);
        padPrev[p.index + ":" + idx] = pressed;
      }
    }
  }
}
setInterval(pollGamepad, 50);

/* ---------- обработчики UI ---------- */

btnStop.addEventListener("click", stopGame);
btnRestart.addEventListener("click", () => launchGame(DEFAULT_JAR));

$("fileInput").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (!f || !moduleReady) return;
  const buf = new Uint8Array(await f.arrayBuffer());
  try {
    Module.FS.mkdir("/upload");
  } catch (e) { /* уже есть */ }
  Module.FS.writeFile("/upload/game.jar", buf);
  addrBar.value = "file://C:/Мои документы/" + f.name;
  launchGame("/upload/game.jar");
  ev.target.value = "";
});

$("selRes").addEventListener("change", () => {
  const custom = $("selRes").value === "__custom";
  $("customRes").style.display = custom ? "inline-block" : "none";
  if (custom) $("customRes").focus();
});
$("selScale").addEventListener("change", applyScale);

$("btnApply").addEventListener("click", () => {
  /* параметры читаются при загрузке — перезапускаем текущую игру */
  launchGame(lastPath);
});

$("errOk").addEventListener("click", hideError);
$("errReload").addEventListener("click", () => location.reload());

/* ---------- параметры URL (?autostart=1&jar=… — для автотестов) ---------- */

const params = new URLSearchParams(location.search);
const TEST_MODE = !!params.get("autostart");
const AUTO_JAR = TEST_MODE ? (params.get("jar") || DEFAULT_JAR) : DEFAULT_JAR;

/* ---------- дата и счётчик посещений (дух 2000-х) ---------- */
(function retroExtras() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const el = $("todayLine");
  if (el) el.textContent = "Сегодня: " + dd + "." + mm + "." + d.getFullYear();
  const cEl = $("counter");
  if (cEl) {
    /* «счётчик посещений»: дни с 01.01.2001, умноженные на 3, плюс 1024 */
    const days = Math.floor((d - new Date(2001, 0, 1)) / 86400000);
    const n = String(1024 + days * 3).padStart(8, "0");
    cEl.innerHTML = "";
    for (const ch of n) {
      const s = document.createElement("span");
      s.className = "digit";
      s.textContent = ch;
      cEl.appendChild(s);
    }
  }
})();

/* ---------- поехали ---------- */
boot();
})();
