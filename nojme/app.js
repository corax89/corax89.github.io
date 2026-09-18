/* nojme Web — фронтенд (загрузка ядра, ввод, видео, аудио, UI).
 * Требует: nojme.js (NojmeCore, MODULARIZE), coi-serviceworker.js для
 * cross-origin isolation (SharedArrayBuffer для Java-потоков).
 */
'use strict';

/* ------------------------------------------------------------------ */
/* DOM                                                                  */
/* ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const canvas = $('screen'), ctx = canvas.getContext('2d');
const overlay = $('overlay');

/* ------------------------------------------------------------------ */
/* Состояние                                                            */
/* ------------------------------------------------------------------ */
let Module = null;            // экземпляр emscripten-модуля
let running = false;          // игра загружена и цикл активен
let paused = false;
let frameCounter = 0;
let timing = { fps: 30, rate: 22050 };
let gameBytes = null;         // байты текущего jar (для перезагрузки)
let gameName = 'game.jar';
let needReboot = false;       // опция, применимая только при загрузке

/* аудио */
let audioCtx = null, audioNode = null;
let audioQueue = [];          // [{l: Float32Array, r: Float32Array}]
let audioQueueLen = 0;
let soundOn = true;

/* FPS-счётчик */
let fpsT0 = performance.now(), fpsFrames = 0, fpsShown = 0;
/* аккумулятор темпа кадров */
let lastT = 0, acc = 0;

/* ------------------------------------------------------------------ */
/* Лог и статус                                                         */
/* ------------------------------------------------------------------ */
const logEl = $('log');
const LOG_MAX_LINES = 300;
let logBuf = [];
let logRenderTimer = 0;
function renderLog() {
    logRenderTimer = 0;
    // рендерим только если панель лога раскрыта
    const open = logEl.closest('details') && logEl.closest('details').open;
    if (open) {
        logEl.textContent = logBuf.join('');
        logEl.scrollTop = logEl.scrollHeight;
    }
}
function coreLog(level, text) {
    logBuf.push(text);
    if (logBuf.length > LOG_MAX_LINES)
        logBuf.splice(0, logBuf.length - LOG_MAX_LINES);
    if (!logRenderTimer)
        logRenderTimer = setTimeout(renderLog, 300);
}
function log(msg) { coreLog(0, '[web] ' + msg + '\n'); }
function setState(s) { $('st-state').textContent = s; }
function showOverlay(html, isError) {
    overlay.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('error', !!isError);
}
function hideOverlay() { overlay.classList.add('hidden'); }

/* ------------------------------------------------------------------ */
/* Cross-origin isolation (SharedArrayBuffer)                           */
/* ------------------------------------------------------------------ */
function sabState() { return typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated; }
function updateSabBadge() {
    const b = $('sab-badge');
    if (sabState()) { b.textContent = 'потоки: OK'; b.className = 'sab ok'; }
    else { b.textContent = 'потоки: нет'; b.className = 'sab bad'; }
}

/* ------------------------------------------------------------------ */
/* Core-опции                                                           */
/* ------------------------------------------------------------------ */
function setVar(key, value) {
    if (Module) Module.ccall('nojme_set_variable', 'number', ['string', 'string'], [key, value]);
}
function resolutionValue() {
    const sel = $('opt-resolution').value;
    if (sel === '__custom') {
        const m = $('opt-wh').value.trim().match(/^(\d{1,4})\s*[x×]\s*(\d{1,4})$/);
        if (!m) return '240x320';
        const w = +m[1], h = +m[2];
        if (w < 96 || w > 1024 || h < 96 || h > 1024) return '240x320';
        return w + 'x' + h;
    }
    return sel;
}
function applyLiveOptions() {
    if (!Module) return;
    setVar('j2me_fps', $('opt-fps').value);
    setVar('j2me_vm_speed', $('opt-speed').value);
    setVar('j2me_rotation', $('opt-rotation').value);
    setVar('j2me_pixel_format', $('opt-pixfmt').value);
    Module.ccall('nojme_variables_updated', 'number', [], []);
    // fps меняет темп фронтенда немедленно
    timing.fps = +$('opt-fps').value;
    acc = 0;
}

/* ------------------------------------------------------------------ */
/* Аудио                                                                */
/* ------------------------------------------------------------------ */
function ensureAudio() {
    if (audioCtx || !soundOn) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: timing.rate });
    } catch (e) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e2) { audioCtx = null; return; }
    }
    const node = audioCtx.createScriptProcessor(2048, 0, 2);
    node.onaudioprocess = (ev) => {
        const L = ev.outputBuffer.getChannelData(0);
        const R = ev.outputBuffer.getChannelData(1);
        let need = L.length;
        let idx = 0;
        while (need > 0 && audioQueue.length) {
            const q = audioQueue[0];
            const take = Math.min(need, q.l.length - q.pos);
            for (let i = 0; i < take; i++) {
                L[idx + i] = q.l[q.pos + i];
                R[idx + i] = q.r[q.pos + i];
            }
            q.pos += take; idx += take; need -= take;
            if (q.pos >= q.l.length) { audioQueue.shift(); audioQueueLen -= q.l.length; }
        }
        while (need-- > 0) { L[idx] = 0; R[idx] = 0; idx++; }
    };
    node.connect(audioCtx.destination);
    audioNode = node;
}
function pushAudio(ptr, frames) {
    if (!soundOn || !audioCtx) return;
    if (audioQueueLen > timing.rate * 0.4) return;  // защита от отставания
    const src = new Int16Array(Module.HEAP16.buffer, ptr, frames * 2);
    const l = new Float32Array(frames), r = new Float32Array(frames);
    const k = audioCtx.sampleRate === timing.rate ? 1.0 : timing.rate / audioCtx.sampleRate;
    if (k === 1.0) {
        for (let i = 0; i < frames; i++) {
            l[i] = src[i * 2] / 32768; r[i] = src[i * 2 + 1] / 32768;
        }
    } else {
        // линейная ресемплировка (обычно не нужна: AudioContext создаётся на rate ядра)
        const outN = Math.max(1, Math.floor(frames * (audioCtx.sampleRate / timing.rate)));
        const lo = new Float32Array(outN), ro = new Float32Array(outN);
        for (let i = 0; i < outN; i++) {
            const j = Math.min(frames - 1, Math.floor(i * k));
            const f = i * k - j;
            const j2 = Math.min(frames - 1, j + 1);
            lo[i] = ((src[j * 2] * (1 - f) + src[j2 * 2] * f)) / 32768;
            ro[i] = ((src[j * 2 + 1] * (1 - f) + src[j2 * 2 + 1] * f)) / 32768;
        }
        audioQueue.push({ l: lo, r: ro, pos: 0 });
        audioQueueLen += outN;
        return;
    }
    audioQueue.push({ l, r, pos: 0 });
    audioQueueLen += frames;
}

/* ------------------------------------------------------------------ */
/* Загрузка ядра                                                        */
/* ------------------------------------------------------------------ */
function bootCore() {
    log('загрузка ядра (nojme.js + nojme.wasm)…');
    Promise.resolve(NojmeCore({
        locateFile: (p) => p,
        print: (t) => coreLog(0, t + '\n'),
        printErr: (t) => coreLog(1, t + '\n'),
        onLog: (level, text) => coreLog(level, text),
        onReady: (fps, rate, w, h) => {
            timing = { fps: fps, rate: rate };
            $('st-size').textContent = w + 'x' + h;
            log(`ядро готово: ${fps} fps, ${rate} Гц, ${w}x${h}`);
        },
        onFrame: (ptr, w, h) => {
            frameCounter++;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w; canvas.height = h;
                $('st-size').textContent = w + 'x' + h;
            }
            const view = new Uint8Array(Module.HEAPU8.buffer, ptr, w * h * 4);
            const img = ctx.createImageData(w, h);
            img.data.set(view);
            ctx.putImageData(img, 0, 0);
        },
        onAudio: (ptr, frames) => pushAudio(ptr, frames),
        onGeometry: (w, h) => {
            canvas.width = w; canvas.height = h;
            $('st-size').textContent = w + 'x' + h;
        },
        onTiming: (fps, rate) => { timing = { fps: fps, rate: rate }; },
        onShutdown: () => { stopGame('мидлет завершился'); },
    })).then((m) => {
        Module = m;
        log('ядро загружено (WebAssembly)');
        try {
            Module.FS.mkdir('/nojme-saves');
            Module.FS.mkdir('/content');
            // RMS-сохранения в IndexedDB (переживают перезагрузку страницы)
            const IDBFS = Module.IDBFS ||
                (Module.FS.filesystems && Module.FS.filesystems.IDBFS);
            if (IDBFS && !location.search.includes('no-idbfs')) {
                Module.FS.mount(IDBFS, {}, '/nojme-saves');
                Module.FS.syncfs(true, (e) => { if (!e) log('RMS-сохранения подключены (IndexedDB)'); });
            } else {
                log('IDBFS недоступен: RMS-сохранения только на время сессии');
            }
        } catch (e) { log('FS init: ' + e); }
        setInterval(() => {   // периодическая запись RMS
            if (Module && running) {
                try { Module.FS.syncfs(false, () => {}); } catch (e) {}
            }
        }, 5000);
        $('btn-m3g').disabled = false;
        // ?debug — подробный лог ядра (все LOG_SAFE в консоль страницы)
        if (location.search.includes('debug')) {
            try { Module.ccall('nojme_set_debug', null, ['number'], [1]); } catch (e) {}
            log('debug-лог ядра включён');
        }
    }).catch((e) => {
        showOverlay('Ошибка загрузки ядра:<br><code>' + (e && e.message || e) + '</code>' +
            '<br><br>Убедитесь, что страница открыта через http(s)-сервер ' +
            '(не file://) и файлы nojme.js/nojme.wasm на месте.', true);
    });
}

/* ------------------------------------------------------------------ */
/* Загрузка игры                                                        */
/* ------------------------------------------------------------------ */
async function startGame(bytes, name) {
    if (!Module) return;
    gameBytes = bytes;
    gameName = name || 'game.jar';
    await userGesture();                    // AudioContext требует жеста

    try {
        Module.FS.mkdir('/content');
    } catch (e) {}
    const path = '/content/' + gameName.replace(/[^\w.\- ]+/g, '_');
    Module.FS.writeFile(path, bytes);

    setVar('j2me_resolution', resolutionValue());
    setVar('j2me_fps', $('opt-fps').value);
    setVar('j2me_vm_speed', $('opt-speed').value);
    setVar('j2me_pixel_format', $('opt-pixfmt').value);
    setVar('j2me_rotation', $('opt-rotation').value);

    showOverlay('Загрузка <b>' + gameName + '</b>…');
    await new Promise(r => setTimeout(r, 30));   // пусть overlay отрисуется

    const ok = Module.ccall('nojme_boot', 'number', ['string'], [path]);
    if (!ok) {
        showOverlay('Не удалось запустить <b>' + gameName + '</b>.<br>' +
            'Подробности — в «Логе ядра» (обычно: повреждённый JAR или нет MIDlet-1 в манифесте).', true);
        running = false;
        return;
    }
    hideOverlay();
    running = true; paused = false;
    frameCounter = 0; acc = 0; lastT = performance.now();
    ensureAudio();
    setState('играет');
    for (const id of ['btn-pause', 'btn-reset', 'btn-stop']) $(id).disabled = false;
    $('btn-pause').textContent = '⏸ Пауза';
}

function stopGame(reason) {
    running = false; paused = false;
    if (Module) { try { Module.ccall('nojme_shutdown', null, [], []); } catch (e) {} }
    for (const id of ['btn-pause', 'btn-reset', 'btn-stop']) $(id).disabled = true;
    setState(reason || 'остановлено');
    showOverlay('<div class="big">' + (reason || 'Остановлено') + '</div>' +
        '<div>Запустите M3GTest.jar или выберите другой .jar</div>');
}

function userGesture() {
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        // жест мог быть синтетическим (автотесты): не ждём resume() вечно —
        // звук включится при первом реальном клике (см. разблокировку ниже)
        return Promise.race([
            audioCtx.resume().catch(() => {}),
            new Promise((r) => setTimeout(r, 250)),
        ]);
    }
    return Promise.resolve();
}

/* разблокировка звука при первом реальном взаимодействии */
window.addEventListener('pointerdown', function unlock() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}, { once: false });

/* ------------------------------------------------------------------ */
/* Главный цикл (rAF, темп = fps ядра)                                  */
/* ------------------------------------------------------------------ */
function loop(t) {
    requestAnimationFrame(loop);
    if (!Module || !running || paused) return;

    if (!lastT) lastT = t;
    let dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 0.25) dt = 0.25;

    acc += dt * timing.fps;
    let steps = Math.min(4, Math.floor(acc));   // ≤4 кадра за rAF (догоняем)
    acc -= steps;
    while (steps-- > 0) {
        if (Module.ccall('nojme_step', 'number', [], []) !== 1) break;
    }

    pollGamepad();

    fpsFrames++;
    const now = performance.now();
    if (now - fpsT0 >= 1000) {
        fpsShown = fpsFrames * 1000 / (now - fpsT0);
        $('st-fps').textContent = fpsShown.toFixed(1);
        $('st-frames').textContent = frameCounter;
        fpsT0 = now; fpsFrames = 0;
    }
}

/* ------------------------------------------------------------------ */
/* Клавиатура                                                           */
/* ------------------------------------------------------------------ */
/* joypad id: 0=B 1=Y 2=SELECT 3=START 4=UP 5=DOWN 6=LEFT 7=RIGHT
 *            8=A 9=X 10=L 11=R 12=L2 13=R2 */
const KEYMAP = {
    ArrowUp: 4, ArrowDown: 5, ArrowLeft: 6, ArrowRight: 7,
    KeyX: 8, KeyZ: 0, KeyA: 9, KeyS: 1,
    KeyQ: 10, KeyW: 11, KeyE: 12, KeyR: 13,
    ShiftLeft: 2, ShiftRight: 2, Enter: 3,
};
/* клавиатурные доп. клавиши ядра (RETROK): '0','6'..'9','*','#' */
const KBMAP = {
    Digit0: 48, Digit6: 54, Digit7: 55, Digit8: 56, Digit9: 57,
    Numpad0: 48, Numpad6: 54, Numpad7: 55, Numpad8: 56, Numpad9: 57,
    Asterisk: 42, Hash: 35, Backquote: 35, Digit3: 51, Digit2: 50, Digit1: 49, Digit4: 52, Digit5: 53,
};
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyP' && running) { togglePause(); e.preventDefault(); return; }
    const j = KEYMAP[e.code];
    if (j !== undefined && Module) {
        Module.ccall('nojme_set_button', null, ['number', 'number'], [j, 1]);
        e.preventDefault();
    }
    const k = KBMAP[e.code];
    if (k !== undefined && Module) {
        Module.ccall('nojme_set_key', null, ['number', 'number'], [k, 1]);
        e.preventDefault();
    }
});
window.addEventListener('keyup', (e) => {
    const j = KEYMAP[e.code];
    if (j !== undefined && Module) {
        Module.ccall('nojme_set_button', null, ['number', 'number'], [j, 0]);
        e.preventDefault();
    }
    const k = KBMAP[e.code];
    if (k !== undefined && Module) {
        Module.ccall('nojme_set_key', null, ['number', 'number'], [k, 0]);
        e.preventDefault();
    }
});

/* ------------------------------------------------------------------ */
/* Геймпад (стандартный маппинг)                                        */
/* ------------------------------------------------------------------ */
const PADMAP = { 0: 8, 1: 0, 2: 9, 3: 1, 4: 10, 5: 11, 6: 12, 7: 13, 8: 2, 9: 3, 12: 4, 13: 5, 14: 6, 15: 7 };
let padState = {};
function pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let state = {};
    for (const p of pads) {
        if (!p) continue;
        for (const [b, id] of Object.entries(PADMAP)) {
            if (p.buttons[b] && p.buttons[b].pressed) state[id] = 1;
        }
    }
    for (const idStr of new Set([...Object.keys(padState), ...Object.keys(state)])) {
        const id = +idStr;
        const was = padState[idStr] || 0, now = state[idStr] || 0;
        if (was !== now) Module.ccall('nojme_set_button', null, ['number', 'number'], [id, now]);
    }
    padState = state;
}

/* ------------------------------------------------------------------ */
/* Тач/мышь на канвасе (pointer-ввод, диапазон [-32768..32767])          */
/* ------------------------------------------------------------------ */
let ptrActive = false;
function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;    // 0..1
    const y = (e.clientY - r.top) / r.height;
    return [Math.round(x * 65535 - 32768), Math.round(y * 65535 - 32768)];
}
canvas.addEventListener('pointerdown', (e) => {
    if (!Module) return;
    ptrActive = true;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = canvasPoint(e);
    Module.ccall('nojme_set_pointer', null, ['number', 'number', 'number'], [x, y, 1]);
    e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
    if (!Module || !ptrActive) return;
    const [x, y] = canvasPoint(e);
    Module.ccall('nojme_set_pointer', null, ['number', 'number', 'number'], [x, y, 1]);
});
const ptrUp = (e) => {
    if (!Module || !ptrActive) return;
    ptrActive = false;
    const [x, y] = canvasPoint(e);
    Module.ccall('nojme_set_pointer', null, ['number', 'number', 'number'], [x, y, 0]);
};
canvas.addEventListener('pointerup', ptrUp);
canvas.addEventListener('pointercancel', ptrUp);

/* экранные кнопки */
document.querySelectorAll('.tbtn').forEach((el) => {
    const id = +el.dataset.btn;
    const down = (e) => { if (Module) Module.ccall('nojme_set_button', null, ['number', 'number'], [id, 1]); el.classList.add('held'); e.preventDefault(); };
    const up = (e) => { if (Module) Module.ccall('nojme_set_button', null, ['number', 'number'], [id, 0]); el.classList.remove('held'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
});

/* ------------------------------------------------------------------ */
/* UI-обработчики                                                       */
/* ------------------------------------------------------------------ */
$('btn-m3g').addEventListener('click', async () => {
    $('btn-m3g').disabled = true;
    try {
        const r = await fetch('M3GTest.jar');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = await r.arrayBuffer();
        await startGame(new Uint8Array(buf), 'M3GTest.jar');
    } catch (e) {
        showOverlay('M3GTest.jar не загрузился: ' + e.message +
            '<br>Файл должен лежать рядом с index.html (сервер без http — откройте через serve.py).', true);
    }
    $('btn-m3g').disabled = false;
});

$('file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    await startGame(new Uint8Array(buf), f.name);
    e.target.value = '';
});

function togglePause() {
    if (!running) return;
    paused = !paused;
    $('btn-pause').textContent = paused ? '▶ Дальше' : '⏸ Пауза';
    setState(paused ? 'пауза' : 'играет');
    lastT = 0;
}
$('btn-pause').addEventListener('click', togglePause);
$('btn-reset').addEventListener('click', () => {
    if (Module && running) Module.ccall('nojme_reset', null, [], []);
});
$('btn-stop').addEventListener('click', () => stopGame());

$('opt-resolution').addEventListener('change', async () => {
    $('opt-wh').disabled = $('opt-resolution').value !== '__custom';
    if (running && gameBytes) {
        // разрешение применяется при загрузке: мягкая перезагрузка той же игры
        log('смена разрешения → перезапуск мидлета');
        Module.ccall('nojme_shutdown', null, [], []);
        running = false;
        await startGame(gameBytes, gameName);
    }
});
$('opt-wh').addEventListener('change', () => {
    if (running && gameBytes && $('opt-resolution').value === '__custom') {
        Module.ccall('nojme_shutdown', null, [], []);
        running = false;
        startGame(gameBytes, gameName);
    }
});
$('opt-fps').addEventListener('change', applyLiveOptions);
$('opt-speed').addEventListener('change', applyLiveOptions);
$('opt-rotation').addEventListener('change', applyLiveOptions);
$('opt-pixfmt').addEventListener('change', () => {
    if (running && gameBytes) {  // применяется при следующей загрузке
        Module.ccall('nojme_shutdown', null, [], []);
        running = false;
        startGame(gameBytes, gameName);
    } else applyLiveOptions();
});
$('opt-sound').addEventListener('change', () => {
    soundOn = $('opt-sound').value === 'on';
    if (!soundOn && audioCtx) { audioQueue = []; audioQueueLen = 0; }
    if (soundOn) ensureAudio();
});
$('opt-touch').addEventListener('change', () => {
    $('touch').classList.toggle('on', $('opt-touch').value === 'on');
});

window.addEventListener('pagehide', () => {
    if (Module) { try { Module.FS.syncfs(false, () => {}); } catch (e) {} }
});

/* ------------------------------------------------------------------ */
/* Старт                                                                */
/* ------------------------------------------------------------------ */
updateSabBadge();
if (!sabState()) {
    showOverlay('<div class="big">Включаю изоляцию для Java-потоков…</div>' +
        '<div>страница перезагрузится один раз (service worker)</div>');
}
bootCore();
requestAnimationFrame(loop);

/* после перезагрузки coi-serviceworker проверяем снова */
window.addEventListener('load', () => {
    updateSabBadge();
    if (!sabState() && !window.coiSwFailed) {
        const b = $('banner');
        b.style.display = 'block';
        b.innerHTML = '⚠ SharedArrayBuffer недоступен: игры с <b>Java-потоками</b> (звук, загрузочные экраны) ' +
            'могут работать нестабильно. Раздавайте страницу с заголовками ' +
            '<code>COOP: same-origin</code> и <code>COEP: require-corp</code> (см. serve.py) — или обновите страницу.';
    }
});
