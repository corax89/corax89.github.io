# nojme Web — J2ME-эмулятор в браузере (WebAssembly)

Полноценная веб-версия ядра nojme (J2ME/KVM + JSR-184 M3G, libretro-интерфейс,
C) скомпилирована в WebAssembly через emscripten. JAR-файлы обрабатываются
локально в браузере — никуда не отправляются.

## Состав

| Файл                   | Назначение                                        |
|------------------------|---------------------------------------------------|
| `index.html`           | страница эмулятора (UI, настройки, справка)       |
| `app.js`               | фронтенд: ввод (клава/тач/геймпад), видео, аудио  |
| `nojme.js` + `nojme.wasm` | ядро nojme v34.80 → WebAssembly (-pthread)      |
| `coi-serviceworker.js` | включает cross-origin isolation на хостинге без заголовков |
| `M3GTest.jar`          | встроенное 3D-демо JSR-184 (5 сцен)               |
| `serve.py`             | локальный сервер с нужными заголовками            |

## Запуск локально

```bash
python3 serve.py          # http://localhost:8080/
```

Откройте адрес в Chrome/Edge/Firefox (Safari 16.4+), нажмите
«Запустить M3GTest.jar» или выберите свой `.jar`.

## Хостинг

Требуются заголовки (нужны для SharedArrayBuffer → Java-потоки
`Thread.start()` работают как настоящие воркеры):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

* nginx / Apache / Cloudflare — добавьте заголовки + отдавайте `.wasm` как
  `application/wasm`.
* GitHub Pages / Netlify — заголовков нет: `coi-serviceworker.js` включит
  изоляцию сам (первый заход перезагрузит страницу один раз).
* Все ресурсы — same-origin, внешних зависимостей нет.

## Управление

| Клавиши                | Действие                                   |
|------------------------|--------------------------------------------|
| ← ↑ → ↓                | джойстик                                   |
| X                      | FIRE                                       |
| Z / A / S              | B / X / Y (клавиша 1)                      |
| Q W E R                | клавиши 2 / 3 / 4 / 5                      |
| Shift / Enter          | левая / правая софт-клавиша                |
| 0 6 7 8 9 * #          | цифровые клавиши телефона                  |
| мышь/палец на канвасе  | тач-ввод (стилусные игры)                  |
| геймпад                | автоматически (standard mapping)           |
| P                      | пауза                                      |

Настройки: разрешение экрана (auto = из манифеста JAR, любое WxH 96–1024),
FPS (15–60), скорость VM (original/normal/fast/turbo), формат пикселей,
поворот, звук, экранные тач-кнопки.

## Возможности ядра

* Интерпретатор CLDC/MIDP + JSR-184 (M3G) программный рендер, Nokia UI/Sound,
  RMS-сохранения (IndexedDB), AMR/WAV/MIDI-звук, реальные Java-потоки.

## Известные ограничения (первая веб-сборка)

* `Stalker.jar` падает на старте в браузере (гонка потоков при буте;
  в node-WASM та же сборка работает). Расследование — FIXES.txt, сессия 81.
* Отдельные тяжёлые мидлеты (Nescube) стартуют с предупреждениями.
* `render(World)` в ядре кэширует трансформации узлов (retained-сцены
  статичны) — найдено при подготовке M3GTest, задокументировано.

## Сборка из исходников

```bash
source /home/z/my-project/emsdk/emsdk_env.sh
cd nojme-j2me-v34.76-fixed
./scripts/web/build_web.sh          # web + node
./scripts/web/build_web.sh web      # только браузер
node scripts/web/node_run.js scripts/m3gtest/M3GTest.jar 600 /tmp/out 150
```

M3GTest.jar пересобирается: `./scripts/m3gtest/build.sh` (ecj + стабы).
