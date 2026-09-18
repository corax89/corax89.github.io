/*
 * nojme_app.js — фронтенд web-сборки nojme (сессия 81).
 *
 * Главный JS-поток НЕ вызывает retro_run (это делает web_glue.c на своём
 * pthread-воркере — Atomics.wait на main thread запрещён). Здесь только:
 *   - загрузка модуля, IDBFS (/rms — персистентность RecordStore);
 *   - старт/стоп + опции ядра (web_set_option / NOJME_HEAP_MB);
 *   - вывод кадров на canvas (requestAnimationFrame);
 *   - аудио (ScriptProcessorNode тянет из wasm-кольца web_audio_pull);
 *   - ввод (клавиатура/мышь/тач/геймпад -> атомарные маски web_glue);
 *   - опрос лога ядра (web_log_take) в панель на странице.
 */
"use strict";

(function () {

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const canvas = $("screen");
const ctx2d = canvas.getContext("2d");
const statusChip = $("statusChip");
const coreFramesEl = $("coreFrames");
const fpsOutEl = $("fpsOut");
const resOutEl = $("resOut");
const thrOutEl = $("thrOut");
const logEl = $("log");
const buildEl = $("buildId");
const btnStart = $("btnStart");
const btnStop = $("btnStop");

/* ---------- статусы web_glue ---------- */
const ST = {
  0: ["ожидание", "#8b95a7"],
  1: ["загрузка игры…", "#ffb44d"],
  2: ["работает", "#3fd68f"],
  3: ["мидлет завершён", "#4da3ff"],
  4: ["ошибка загрузки (см. лог)", "#ff6b6b"],
  5: ["остановлено", "#8b95a7"],
  6: ["ошибка", "#ff6b6b"],
};

/* ---------- state ---------- */
let Module = null;
let running = false;
let cSetOption = null, cSetEnv = null, cStart = null;
let imgData = null, imgPixels = null, lastW = 0, lastH = 0;
let audioCtx = null, scriptNode = null, audioScratch = null, audioCoreRate = 22050;
let audioFrac = 0, audioPrev = null;
let logScratch = null;
let blitFrames = 0, lastFpsT = performance.now(), lastFpsFrames = 0;
let logShown = 0;

const logDecoder = new TextDecoder("utf-8", { fatal: false });
const logLines = [];
let logPending = "";   /* хвост неполной строки между чанками кольца */

/* ---------- утилиты ---------- */
function log(msg) {
  logLines.push(msg);
  if (logLines.length > 500) logLines.splice(0, logLines.length - 500);
  renderLog();
}
function renderLog() {
  logEl.textContent = logLines.join("\n");
  logEl.scrollTop = logEl.scrollHeight;
}
function setStatus(code) {
  const s = ST[code] || ["?", "#8b95a7"];
  statusChip.textContent = s[0];
  statusChip.style.color = s[1];
}

/* ---------- изоляция ---------- */
const isolated = typeof SharedArrayBuffer !== "undefined" && crossOriginIsolated;
{
  const badge = $("isoBadge");
  if (isolated) {
    badge.textContent = "cross-origin isolated ✓";
    badge.className = "ok";
  } else {
    badge.textContent = "БЕЗ изоляции — потоки не заработают";
    badge.className = "bad";
    $("isoWarn").style.display = "block";
  }
}

/* ---------- запуск/остановка ---------- */

function applyOptions() {
  /* разрешение */
  let res = $("selRes").value;
  if (res === "__custom") {
    res = $("customRes").value.trim();
    if (!/^[0-9]{1,4}x[0-9]{1,4}$/.test(res)) {
      log("[web] свой формат разрешения должен быть WxH (например 352x416), подставляю auto");
      res = "auto";
    }
  }
  cSetOption("j2me_resolution", res);
  cSetOption("j2me_vm_speed", $("selSpeed").value);
  cSetOption("j2me_fps", $("selFps").value);
  cSetOption("j2me_audio_rate", $("selAudio").value);
  cSetOption("j2me_pixel_format", "RGB565");
  cSetOption("j2me_rotation", "off");
  cSetOption("j2me_touch_input", "on");
  cSetOption("j2me_neon", "on");
  cSetOption("j2me_scaling", "Aspect");
  cSetEnv("NOJME_HEAP_MB", $("selHeap").value);
  log("[web] опции: res=" + res + " vm=" + $("selSpeed").value +
      " fps=" + $("selFps").value + " audio=" + $("selAudio").value +
      " heap=" + $("selHeap").value + "MB");
}

async function startGame(path) {
  if (running || !Module) return;
  applyOptions();
  try { initAudio(); } catch (e) { log("[web] аудио недоступно: " + e); }
  const rc = cStart(path);
  if (rc !== 0) {
    log("[web] web_start вернул " + rc + " (" + Module.UTF8ToString(Module._web_get_error()) + ")");
    setStatus(6);
    return;
  }
  running = true;
  btnStart.disabled = true;
  btnStop.disabled = false;
}

async function stopGame() {
  if (!running) return;
  Module._web_stop();
  log("[web] запрошена остановка…");
  /* статус дойдёт до STOPPED через поллинг; там же syncfs */
}

/* ---------- модуль ---------- */

function initModuleApi() {
  window.__nojme = Module; /* debug/testing handle */
  cSetOption = Module.cwrap("web_set_option", "number", ["string", "string"]);
  cSetEnv = Module.cwrap("web_set_envvar", "number", ["string", "string"]);
  cStart = Module.cwrap("web_start", "number", ["string"]);
  Module.ccall("web_boot");

  /* /rms — персистентные RecordStore (IDBFS) */
  try {
    Module.FS.mkdir("/rms");
    Module.FS.mount(Module.IDBFS, {}, "/rms");
    Module.FS.syncfs(true, (err) => {
      if (err) log("[web] syncfs(load): " + err);
      else log("[web] /rms (RecordStore) подключён к IndexedDB");
    });
  } catch (e) {
    log("[web] IDBFS: " + e);
  }

  logScratch = Module._malloc(65536);
  audioScratch = Module._malloc(4096 * 4); /* int16 стерео-кадры */

  setStatus(0);
  btnStart.disabled = false;
  log("[web] ядро готово к запуску");
}

async function boot() {
  try {
    const factory = window.NojmeFactory;
    Module = await factory({
      locateFile: (p) => p,
      print: (t) => { /* stdout ядра дублируется в лог-кольце web_glue */ },
      printErr: (t) => {
        if (String(t).indexOf("wasm streaming") >= 0) return;
      },
    });
    initModuleApi();
  } catch (e) {
    statusChip.textContent = "не удалось загрузить модуль";
    statusChip.style.color = "#ff6b6b";
    log("[web] ОШИБКА загрузки модуля: " + e + (isolated ? "" :
        " — вероятно, нет cross-origin isolation (см. предупреждение выше)"));
  }
}

/* ---------- вывод кадров ---------- */

function blit() {
  if (Module && running) {
    const idx = Module._web_get_frame_index();
    if (idx >= 0) {
      const w = Module._web_get_frame_w(idx), h = Module._web_get_frame_h(idx);
      if (w > 0 && h > 0) {
        if (w !== lastW || h !== lastH) {
          lastW = w; lastH = h;
          canvas.width = w; canvas.height = h;
          imgData = ctx2d.createImageData(w, h);
          imgPixels = new Uint32Array(imgData.data.buffer);
          resOutEl.textContent = w + "×" + h;
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

/* ---------- аудио ---------- */

function initAudio() {
  const wanted = parseInt($("selAudio").value, 10) || 22050;
  try {
    audioCtx = new AudioContext({ sampleRate: wanted });
  } catch (e) {
    audioCtx = new AudioContext();
  }
  audioCtx.resume();
  audioCoreRate = wanted;
  audioFrac = 0;
  audioPrev = null;
  if (scriptNode) { try { scriptNode.disconnect(); } catch (e) {} }
  scriptNode = audioCtx.createScriptProcessor(2048, 0, 2);
  scriptNode.onaudioprocess = (ev) => {
    const L = ev.outputBuffer.getChannelData(0);
    const R = ev.outputBuffer.getChannelData(1);
    const n = L.length;
    if (!Module || !running) { L.fill(0); R.fill(0); return; }
    const coreRate = Module._web_get_sample_rate();
    if (coreRate !== audioCoreRate) audioCoreRate = coreRate;
    const outRate = audioCtx.sampleRate;
    /* тянем из wasm-кольца с учётом ресемплинга coreRate -> outRate */
    const need = Math.ceil(n * audioCoreRate / outRate) + 4;
    const got = Module._web_audio_pull(audioScratch, Math.min(need, 2048));
    const src = new Int16Array(Module.HEAPU16.buffer, audioScratch, got * 2);
    if (outRate === audioCoreRate) {
      for (let i = 0; i < n; i++) {
        if (i < got) { L[i] = src[i * 2] / 32768; R[i] = src[i * 2 + 1] / 32768; }
        else { L[i] = 0; R[i] = 0; }
      }
    } else {
      /* линейная интерполяция с непрерывной фазой между блоками */
      for (let i = 0; i < n; i++) {
        const pos = audioFrac + i * audioCoreRate / outRate;
        const i0 = Math.floor(pos), i1 = i0 + 1;
        const t = pos - i0;
        if (i1 < got) {
          L[i] = (src[i0 * 2] + (src[i1 * 2] - src[i0 * 2]) * t) / 32768;
          R[i] = (src[i0 * 2 + 1] + (src[i1 * 2 + 1] - src[i0 * 2 + 1]) * t) / 32768;
        } else if (i0 < got) {
          L[i] = src[i0 * 2] / 32768; R[i] = src[i0 * 2 + 1] / 32768;
        } else { L[i] = 0; R[i] = 0; }
      }
      audioFrac += n * audioCoreRate / outRate - got; /* сколько не дотянули */
      if (audioFrac < 0) audioFrac = 0;
    }
  };
  scriptNode.connect(audioCtx.destination);
}

/* ---------- лог ---------- */

function pollLog() {
  if (!Module || !logScratch) return;
  const n = Module._web_log_take(logScratch, 65536 - 1);
  if (n > 0) {
    /* HEAPU8 в браузере — view на SharedArrayBuffer; TextDecoder
     * отказывается декодировать shared-память — копируем в обычный буфер */
    const copy = new Uint8Array(n);
    copy.set(new Uint8Array(Module.HEAPU8.buffer, logScratch, n));
    /* склеиваем с хвостом прошлого чанка — обрабатываем строки целиком */
    const text = logPending + logDecoder.decode(copy);
    const lines = text.split("\n");
    logPending = lines.pop() || "";   /* последний элемент — неполная строка */
    for (const ln of lines) {
      if (ln.length) {
        logLines.push(ln);
        /* версия ядра из баннера */
        const m = ln.match(/core BUILD: (v[\d.]+)/);
        if (m) buildEl.textContent = "ядро " + m[1];
      }
    }
    if (logLines.length > 500) logLines.splice(0, logLines.length - 500);
    renderLog();
  }
}
setInterval(pollLog, 350);

/* ---------- статус ---------- */

let lastStatT = performance.now(), lastStatFrames = 0;
function pollStatus() {
  if (!Module) return;
  const st = Module._web_get_status();
  setStatus(st);
  if (running && (st === 5 || st === 3 || st === 4 || st === 6)) {
    /* STOPPED / FINISHED / LOAD_FAILED / ERROR — цикл завершён */
    running = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    Module._web_input_clear();
    try { Module.FS.syncfs(false, (e) => { if (e) log("[web] syncfs(save): " + e); }); }
    catch (e) { /* noop */ }
  }
  const frames = Module._web_get_frames();
  const now = performance.now();
  const dt = (now - lastStatT) / 1000;
  if (dt >= 1.0) {
    const coreFps = Math.round((frames - lastStatFrames) / dt);
    const blitFps = Math.round((blitFrames - lastFpsFrames) /
        ((now - lastFpsT) / 1000));
    lastStatT = now; lastStatFrames = frames;
    lastFpsT = now; lastFpsFrames = blitFrames;
    coreFramesEl.textContent = String(frames);
    fpsOutEl.textContent = coreFps + " / " + blitFps;
    /* число Java-потоков — из лога THREAD-строк не надёжно; считаем по [THREAD] стартам */
  }
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

/* клавиша -> [joypad id] или [retrok ascii] */
const KEYMAP = {
  ArrowUp: ["j", JOY.UP], ArrowDown: ["j", JOY.DOWN],
  ArrowLeft: ["j", JOY.LEFT], ArrowRight: ["j", JOY.RIGHT],
  Enter: ["j", JOY.A], " ": ["j", JOY.A], KeyZ: ["j", JOY.A],
  KeyX: ["j", JOY.B], KeyC: ["j", JOY.X],
  KeyQ: ["j", JOY.SELECT], KeyE: ["j", JOY.START],
  Digit1: ["j", JOY.Y], Digit2: ["j", JOY.L], Digit3: ["j", JOY.R],
  Digit4: ["j", JOY.L2], Digit5: ["j", JOY.R2],
  /* 0,6,7,8,9,*,# — напрямую как RETROK (ascii-коды) */
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
    /* запасной путь по e.key для цифр */
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

/* --- тач/мышь: абсолютный указатель + дельты мыши --- */

function canvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width;   /* 0..1 */
  const y = (ev.clientY - r.top) / r.height;
  return [x, y];
}
function toRange(v) { /* 0..1 -> int16 диапазон libretro POINTER */
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

btnStart.addEventListener("click", () => {
  const sel = $("selSource").value;
  if (sel === "__upload") { $("fileInput").click(); return; }
  startGame(sel);
});
btnStop.addEventListener("click", stopGame);

$("fileInput").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (!f || !Module) return;
  log("[web] читаю " + f.name + " (" + f.size + " байт)…");
  const buf = new Uint8Array(await f.arrayBuffer());
  try {
    Module.FS.mkdir("/upload");
  } catch (e) { /* уже есть */ }
  Module.FS.writeFile("/upload/game.jar", buf);
  startGame("/upload/game.jar");
  ev.target.value = "";
});

$("selRes").addEventListener("change", () => {
  const custom = $("selRes").value === "__custom";
  $("customRes").style.display = custom ? "inline-block" : "none";
  if (custom) $("customRes").focus();
});

$("btnLogClear").addEventListener("click", () => { logLines.length = 0; renderLog(); });
$("btnLogCopy").addEventListener("click", () => {
  const blob = new Blob([logLines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nojme-web-log.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------- автозапуск (для автоматизированных тестов) ---------- */

const params = new URLSearchParams(location.search);
if (params.get("autostart")) {
  const jar = params.get("jar") || "/games/M3GTest.jar";
  const res = params.get("res");
  const speed = params.get("speed");
  const boot = () => {
    if (Module) {
      if (res) $("selRes").value = res;
      if (speed) $("selSpeed").value = speed;
      if (params.get("heap")) $("selHeap").value = params.get("heap");
      startGame(jar);
    } else setTimeout(boot, 200);
  };
  setTimeout(boot, 400);
}

/* ---------- поехали ---------- */
boot();
})();
