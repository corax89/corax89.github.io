// Основные переменные игры
const canvas = document.getElementById("cnv");
const ctx = canvas.getContext("2d");
// Инициализация графики
ctx.fillStyle = "rgb(0 0 0)";
ctx.fillRect(0, 0, 1280, 720);
// Глобальные переменные
var image_array = [];
var game_helper_timers = [];
var gravitation = 0;
var draw_bounding_box = false;
var debugShowExpandedObjectsBorder = true;
let gamepads = {};
var inputState = {
	devices: [{ // Устройство 0 (геймпад или клавиатура)
			keys: {},
			pressKeys: {}, // Пресс-клавиши только для этого устройства
			pressButton: [],
			axes: []
		}, { // Устройство 1 (клавиатура, если есть геймпад)
			keys: {},
			pressKeys: {}, // Пресс-клавиши только для этого устройства
			pressButton: [],
			axes: []
		}
	],
	hasGamepad: false
};
var local = {};
var Draw = {};
var Game = {
	allObject: [],
	sound_array: [],
	screenx: 0,
	screeny: 0,
	gravitation: 0,
	helper: {
		pause: false,
		enableDrawing: false,
		enableTouchInput: false,
		lastFrameTime: 0,
		deltaTime: 0,
	}
};

Game.helper.keyRemapping = {
	// Стандартные назначения (соответствуют оригинальным)
	"KeyA": "KeyA",
	"KeyB": "KeyS",
	"KeyX": "KeyX",
	"KeyY": "KeyZ",
	"KeyL": "KeyW",
	"KeyR": "KeyE",
	"KeyZL": "KeyQ",
	"KeyZR": "KeyR",
	"KeyPlus": "Enter",
	"KeyMinus": "Backspace",
	"ArrowLeft": "ArrowLeft",
	"ArrowUp": "ArrowUp",
	"ArrowRight": "ArrowRight",
	"ArrowDown": "ArrowDown",
	"KeyLStickLeft": "KeyJ",
	"KeyLStickUp": "KeyI",
	"KeyLStickRight": "KeyL",
	"KeyLStickDown": "KeyK",
	"KeyRStickLeft": "Numpad4",
	"KeyRStickUp": "Numpad8",
	"KeyRStickRight": "Numpad6",
	"KeyRStickDown": "Numpad2"
};

function drawGamepadButtonsPreview() {
    if (!Game.helper.showGamepadButtons) return;

    const buttonSize = 3;
    const stickRadius = 6;
    const thumbRadius = 2;
    const colors = {
        pressed: "#00fff0",
        unpressed: "#333333",
        background: "#00000066",
        stickBase: "#444444",
        stickThumb: "#ffffff"
    };

    // === НАСТРОЙКИ СМЕЩЕНИЯ СТИКОВ ===
    const stickOffsetX = -14;
    const stickOffsetY = 20; //

    // === ЛЕВЫЙ ГЕЙМПАД (устройство 0) ===
    ctx.fillStyle = colors.background;
    ctx.fillRect(10, 10, 60, 25);

    // --- D-Pad ---
    const dpadUpY = 8;
    const dpadDownY = 18;
    const dpadLeftX = 7;
    const dpadRightX = 17;
    const dpadCenterY = 13;

    const dpadLeft = [
        { x: 12, y: 8,  key: "ArrowUp" },
        { x: 12, y: 18, key: "ArrowDown" },
        { x: 7,  y: 13, key: "ArrowLeft" },
        { x: 17, y: 13, key: "ArrowRight" }
    ];

    dpadLeft.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 0);
        ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- ABXY Кнопки ---
    const centerX = 38;
    const leftButtons = [
        { x: dpadRightX + 26, y: dpadCenterY, key: "KeyA", color: "#2dcd2d" },
        { x: dpadLeftX + 26,  y: dpadCenterY, key: "KeyY", color: "#f5f518" },
        { x: centerX, y: dpadUpY,       key: "KeyX", color: "#3a3aff" },
        { x: centerX, y: dpadDownY,    key: "KeyB", color: "#e61919" }
    ];

    leftButtons.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 0);
        ctx.fillStyle = isPressed ? colors.pressed : btn.color;
        ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Левые триггеры ---
    const leftTriggers = [
        { x: 20, y: 2, key: "KeyL", device: 0 },
        { x: 20, y: 0, key: "KeyZL", device: 0 },
        { x: 32, y: 2, key: "KeyR", device: 0 },
        { x: 32, y: 0, key: "KeyZR", device: 0 }
    ];

    leftTriggers.forEach(trigger => {
        const isPressed = Game.getKey(trigger.key, trigger.device);
        ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        ctx.fillRect(trigger.x, trigger.y, buttonSize * 2, buttonSize);
    });

    // === СТИКИ ЛЕВОГО ГЕЙМПАДА (устройство 0) ===
    const leftStickX = Game.getAxes(0, 0);
    const leftStickY = Game.getAxes(1, 0);
    const rightStickX = Game.getAxes(2, 0);
    const rightStickY = Game.getAxes(3, 0);

    // Базовые координаты стиков — смещены относительно левого угла
    const leftStickBaseX = 25 + stickOffsetX;
    const leftStickBaseY = 13 + stickOffsetY;
    const rightStickBaseX = 45 + stickOffsetX;
    const rightStickBaseY = 13 + stickOffsetY;

    // Левый стик (L-Stick)
    ctx.strokeStyle = colors.stickBase;
    ctx.fillStyle = colors.stickBase;
    ctx.beginPath();
    ctx.arc(leftStickBaseX, leftStickBaseY, stickRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const leftThumbX = leftStickBaseX + leftStickX * (stickRadius - thumbRadius);
    const leftThumbY = leftStickBaseY + leftStickY * (stickRadius - thumbRadius);

    ctx.fillStyle = colors.stickThumb;
    ctx.beginPath();
    ctx.arc(leftThumbX, leftThumbY, thumbRadius, 0, Math.PI * 2);
    ctx.fill();

    // Правый стик (R-Stick)
    ctx.strokeStyle = colors.stickBase;
    ctx.fillStyle = colors.stickBase;
    ctx.beginPath();
    ctx.arc(rightStickBaseX, rightStickBaseY, stickRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const rightThumbX = rightStickBaseX + rightStickX * (stickRadius - thumbRadius);
    const rightThumbY = rightStickBaseY + rightStickY * (stickRadius - thumbRadius);

    ctx.fillStyle = colors.stickThumb;
    ctx.beginPath();
    ctx.arc(rightThumbX, rightThumbY, thumbRadius, 0, Math.PI * 2);
    ctx.fill();


    // === ПРАВЫЙ ГЕЙМПАД (устройство 1) ===
    const offsetX = 28;

    ctx.fillStyle = colors.background;
    ctx.fillRect(1210 + offsetX, 10, 60, 25);

    // --- Правый D-Pad ---
    const rightDpadUpY = 8;
    const rightDpadDownY = 18;
    const rightDpadLeftX = 1207 + offsetX;
    const rightDpadRightX = 1217 + offsetX;
    const rightDpadCenterY = 13;
    const rightCenterX = 1238 + offsetX;

    const dpadRight = [
        { x: 1212 + offsetX, y: 8,  key: "ArrowUp" },
        { x: 1212 + offsetX, y: 18, key: "ArrowDown" },
        { x: 1207 + offsetX, y: 13, key: "ArrowLeft" },
        { x: 1217 + offsetX, y: 13, key: "ArrowRight" }
    ];

    dpadRight.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 1);
        ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Правые ABXY ---
    const rightButtons = [
        { x: rightDpadRightX + 26, y: rightDpadCenterY, key: "KeyA", color: "#2dcd2d" },
        { x: rightDpadLeftX + 26,  y: rightDpadCenterY, key: "KeyY", color: "#f5f518" },
        { x: rightCenterX,    y: rightDpadUpY,     key: "KeyX", color: "#3a3aff" },
        { x: rightCenterX,    y: rightDpadDownY,   key: "KeyB", color: "#e61919" }
    ];

    rightButtons.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 1);
        ctx.fillStyle = isPressed ? colors.pressed : btn.color;
        ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Правые триггеры ---
    const rightTriggers = [
        { x: 1220 + offsetX, y: 2, key: "KeyL", device: 1 },
        { x: 1220 + offsetX, y: 0, key: "KeyZL", device: 1 },
        { x: 1232 + offsetX, y: 2, key: "KeyR", device: 1 },
        { x: 1232 + offsetX, y: 0, key: "KeyZR", device: 1 }
    ];

    rightTriggers.forEach(trigger => {
        const isPressed = Game.getKey(trigger.key, trigger.device);
        ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        ctx.fillRect(trigger.x, trigger.y, buttonSize * 2, buttonSize);
    });

    // === СТИКИ ПРАВОГО ГЕЙМПАДА (устройство 1) ===
    const leftStickX1 = Game.getAxes(0, 1);
    const leftStickY1 = Game.getAxes(1, 1);
    const rightStickX1 = Game.getAxes(2, 1);
    const rightStickY1 = Game.getAxes(3, 1);

    // База позиции для правого геймпада
    const rightPadBaseX = 1210 + offsetX;

    const rightLeftStickBaseX = rightPadBaseX + 25 + stickOffsetX;
    const rightLeftStickBaseY = 13 + stickOffsetY;
    const rightRightStickBaseX = rightPadBaseX + 45 + stickOffsetX;
    const rightRightStickBaseY = 13 + stickOffsetY;

    // Левый стик (устройство 1)
    ctx.strokeStyle = colors.stickBase;
    ctx.fillStyle = colors.stickBase;
    ctx.beginPath();
    ctx.arc(rightLeftStickBaseX, rightLeftStickBaseY, stickRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const leftThumbX1 = rightLeftStickBaseX + leftStickX1 * (stickRadius - thumbRadius);
    const leftThumbY1 = rightLeftStickBaseY + leftStickY1 * (stickRadius - thumbRadius);

    ctx.fillStyle = colors.stickThumb;
    ctx.beginPath();
    ctx.arc(leftThumbX1, leftThumbY1, thumbRadius, 0, Math.PI * 2);
    ctx.fill();

    // Правый стик (устройство 1)
    ctx.strokeStyle = colors.stickBase;
    ctx.fillStyle = colors.stickBase;
    ctx.beginPath();
    ctx.arc(rightRightStickBaseX, rightRightStickBaseY, stickRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const rightThumbX1 = rightRightStickBaseX + rightStickX1 * (stickRadius - thumbRadius);
    const rightThumbY1 = rightRightStickBaseY + rightStickY1 * (stickRadius - thumbRadius);

    ctx.fillStyle = colors.stickThumb;
    ctx.beginPath();
    ctx.arc(rightThumbX1, rightThumbY1, thumbRadius, 0, Math.PI * 2);
    ctx.fill();
}
// Основной объект Game
Game.initEngine = function () {
	// Инициализация массива изображений
	for (let i = 0; i < 1024; i++) {
		image_array[i] = -1; // Используем -1 для отсутствия изображения
	}
	Game.duc_helper_global_game_timers = {
		nextId: 1,
		timers: {},
		pending: [],
		length: 0,
		lengthAvg: 0,
		timerHistory: [],
		lastSampleTime: 0
	};
	Game.helper.tiles = {
		grid: [],
		cols: 0,
		rows: 0,
		tileSize: 32,
		sprite: -1, // -1 для отсутствия тайлсета
		tilesData: {}
	};
	Game.helper.showGamepadButtons = false;
	Game.debug = function(obj){
		const out = document.getElementById("debug");
		if(out)
			out.innerText = JSON.stringify(obj).replace(/\n/g, '<br>');
	};
	Game.createDefaultKeysState = function (keysSet) {
		const state = {};
		// Используем как оригинальные ключи, так и ремаппированные значения
		for (const key of keysSet) {
			state[key] = false;
		}
		return state;
	};
	Game.resetInputDevices = function () {
		// Получаем все возможные клавиши из keyRemapping
		const allKeys = new Set(Object.values(Game.helper.keyRemapping));

		inputState.devices = [{ // Устройство 0
				keys: this.createDefaultKeysState(allKeys),
				pressKeys: this.createDefaultKeysState(allKeys),
				pressButton: [],
				axes: inputState.hasGamepad ? [0, 0, 0, 0] : [0, 0]
			}, { // Устройство 1
				keys: this.createDefaultKeysState(allKeys),
				pressKeys: this.createDefaultKeysState(allKeys),
				pressButton: [],
				axes: [0, 0]
			}
		];
	};
	this.resetInputDevices();
	Game.helper.deepCopy = function (obj) {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}
		// Создаем копию в зависимости от типа (массив или объект)
		var copy = Array.isArray(obj) ? [] : {};
		// Копируем каждое свойство
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				copy[key] = Game.helper.deepCopy(obj[key]);
			}
		}
		return copy;
	};

	canvas.addEventListener("keypress", function(e) {
		e.preventDefault();
		e.stopPropagation();
	}, false);

	canvas.setAttribute("tabindex", "0");

	canvas.addEventListener("mousedown", function() {
		canvas.focus();
	});

	canvas.addEventListener("touchstart", function() {
		canvas.focus();
	});
	canvas.addEventListener("keydown", e => {
		const deviceIndex = inputState.hasGamepad ? 1 : 0;
		const device = inputState.devices[deviceIndex];

		for (const originalKey in Game.helper.keyRemapping) {
			if (Game.helper.keyRemapping[originalKey] === e.code) {
				if (!device.keys[originalKey]) {
					device.pressKeys[originalKey] = true; // Теперь для конкретного устройства
				}
				device.keys[originalKey] = true;

				// Обработка осей левого стика (для клавиатуры)
				if (originalKey === "KeyLStickLeft") {
					inputState.devices[deviceIndex].axes[0] = -1.0;
				} else if (originalKey === "KeyLStickRight") {
					inputState.devices[deviceIndex].axes[0] = 1.0;
				} else if (originalKey === "KeyLStickUp") {
					inputState.devices[deviceIndex].axes[1] = -1.0;
				} else if (originalKey === "KeyLStickDown") {
					inputState.devices[deviceIndex].axes[1] = 1.0;
				}
			}
		}
		e.stopPropagation();
	});
	canvas.addEventListener("keyup", e => {
		const deviceIndex = inputState.hasGamepad ? 1 : 0;

		for (const originalKey in Game.helper.keyRemapping) {
			if (Game.helper.keyRemapping[originalKey] === e.code) {
				inputState.devices[deviceIndex].keys[originalKey] = false;

				// Сброс осей левого стика при отпускании клавиш
				if (originalKey === "KeyLStickLeft" && inputState.devices[deviceIndex].axes[0] < 0) {
					inputState.devices[deviceIndex].axes[0] = 0;
				} else if (originalKey === "KeyLStickRight" && inputState.devices[deviceIndex].axes[0] > 0) {
					inputState.devices[deviceIndex].axes[0] = 0;
				} else if (originalKey === "KeyLStickUp" && inputState.devices[deviceIndex].axes[1] < 0) {
					inputState.devices[deviceIndex].axes[1] = 0;
				} else if (originalKey === "KeyLStickDown" && inputState.devices[deviceIndex].axes[1] > 0) {
					inputState.devices[deviceIndex].axes[1] = 0;
				}
			}
		}
		e.preventDefault();
		e.stopPropagation();
	});
	function getApproximateMemoryUsage(obj) {
		const jsonString = JSON.stringify(obj);
		return jsonString.length * 2;
	}
	Game.getJoystickCount = function () {
		return 0;
	};
	Game.Particles = {
		list: [],
		maxParticles: 1e3, // Максимальное количество частиц
		// Создание частиц
		create: function (x, y, count, options = {}) {
			// Параметры по умолчанию
			const {
				color = "#ffffff",
				size = 2,
				speed = 1,
				direction = 0, // в градусах (0 - вправо, 90 - вверх)
				spread = 30, // разброс направления
				life = 60, // время жизни в кадрах
				gravity = .05,
				fade = true,
				randomColor = false
			} = options;
			// Создаем указанное количество частиц
			for (let i = 0; i < count && this.list.length < this.maxParticles; i++) {
				// Вычисляем направление с учетом разброса
				const angle = (direction + (Math.random() * spread - spread / 2)) * Math.PI / 180;
				// Вычисляем скорость
				const particleSpeed = speed * (.8 + Math.random() * .4);
				// Определяем цвет
				let particleColor = color;
				if (randomColor) {
					// Генерация случайного цвета
					particleColor = `hsl(${Math.random()*360}, 100%, 50%)`
				}
				// Добавляем частицу
				this.list.push({
					x: x,
					y: y,
					vx: Math.cos(angle) * particleSpeed,
					vy: Math.sin(angle) * particleSpeed,
					size: size * (.5 + Math.random()),
					color: particleColor,
					life: life * (.5 + Math.random()),
					maxLife: life,
					gravity: gravity,
					fade: fade
				})
			}
		},
		// Обновление частиц
		update: function () {
			for (let i = this.list.length - 1; i >= 0; i--) {
				const p = this.list[i];
				// Движение
				p.x += p.vx;
				p.y += p.vy;
				p.vy += p.gravity;
				// Уменьшение времени жизни
				p.life--;
				// Удаление "мертвых" частиц
				if (p.life <= 0) {
					this.list.splice(i, 1)
				}
			}
		},
		// Отрисовка частиц
		draw: function () {
			for (const p of this.list) {
				// Прозрачность, если включено затухание
				let alpha = 1;
				if (p.fade) {
					alpha = p.life / p.maxLife
				}
				ctx.fillStyle = p.color;
				ctx.globalAlpha = alpha;
				ctx.fillRect(p.x - p.size / 2 - Game.screenx, p.y - p.size / 2 - Game.screeny, p.size, p.size)
			}
			ctx.globalAlpha = 1
		},
		// Очистка всех частиц
		clear: function () {
			this.list = []
		}
	};
	Game.helper.drawTiles = function () {
		if (!Game.helper.tiles.grid || Game.helper.tiles.sprite === -1)
			return;
		const tileSize = Game.helper.tiles.tileSize;
		const sprite = Game.helper.tiles.sprite;
		const offsetX = 0; //Game.screenx;
		const offsetY = 0; //Game.screeny;
		// Рассчитываем видимую область тайлов с учетом глобальных координат
		const startCol = Math.max(0, Math.floor((Game.screenx - offsetX) / tileSize));
		const startRow = Math.max(0, Math.floor((Game.screeny - offsetY) / tileSize));
		const endCol = Math.min(Game.helper.tiles.cols, Math.ceil((Game.screenx + 1280 - offsetX) / tileSize));
		const endRow = Math.min(Game.helper.tiles.rows, Math.ceil((Game.screeny + 720 - offsetY) / tileSize));
		for (let row = startRow; row < endRow; row++) {
			for (let col = startCol; col < endCol; col++) {
				const tileValue = Game.helper.tiles.grid[row][col];
				if (tileValue > 0) {
					// Рассчитываем экранные координаты с учетом глобального смещения
					const x = offsetX + col * tileSize - Game.screenx;
					const y = offsetY + row * tileSize - Game.screeny;
					// Рисуем тайл
					Draw.image(sprite, x, y, tileSize, tileSize, 1, (tileValue - 1) % (image_array[sprite].width / tileSize) * tileSize, Math.floor((tileValue - 1) / (image_array[sprite].width / tileSize)) * tileSize, tileSize, tileSize)
				}
			}
		}
	};
	Game.save = function (n, s) {
		localStorage.setItem(n, s)
	};
	Game.load = function (n) {
		return localStorage.getItem(n)
	};
	Game.objectSerialize = function (v, depth) {
		if (depth === undefined)
			depth = 0;
		if (depth > 10)
			return null;
		if (v === null)
			return null;
		if (typeof v === "function")
			return undefined;
		if (typeof v !== "object")
			return v;
		if (Array.isArray(v)) {
			var arr = [];
			for (var i = 0; i < v.length; i++) {
				arr[i] = Game.objectSerialize(v[i], depth + 1)
			}
			return arr
		}
		var res = {};
		for (var key in v) {
			if (key !== "id" && key !== "constructor") {
				try {
					var val = v[key];
					if (typeof val !== "function") {
						val = Game.objectSerialize(val, depth + 1);
						if (val !== undefined)
							res[key] = val
					}
				} catch (e) {}
			}
		}
		return res
	};
	Game.objectDeserialize = function (value, target, seenObjects, seenValues) {
		if (value === undefined)
			return undefined;
		if (value === null || typeof value !== "object")
			return value;
		seenObjects = seenObjects || [];
		seenValues = seenValues || [];
		for (var i = 0; i < seenValues.length; i++) {
			if (seenValues[i] === value)
				return seenObjects[i]
		}
		if (value.__type === "Date" && typeof value.value === "string") {
			return new Date(value.value)
		}
		var result = target;
		var needsNewObject = result === undefined || result === null || Array.isArray(value) && !Array.isArray(result) || !Array.isArray(value) && Array.isArray(result);
		if (needsNewObject) {
			if (Array.isArray(value)) {
				result = []
			} else {
				result = {}
			}
		}
		seenObjects.push(result);
		seenValues.push(value);
		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				result[i] = Game.objectDeserialize(value[i], result[i], seenObjects, seenValues)
			}
			return result
		}
		var keys = Object.keys(value);
		for (var j = 0; j < keys.length; j++) {
			var key = keys[j];
			if (key === "__type")
				continue;
			try {
				var newVal = Game.objectDeserialize(value[key], result[key], seenObjects, seenValues);
				result[key] = newVal
			} catch (e) {
				console.log("Error " + key + ":", e)
			}
		}
		return result
	};
	Game.copyState = function (source, target) {
		// Сериализуем исходный объект
		const serialized = dukSerialize(source);
		// Десериализуем в целевой объект
		return deserializeValue(serialized, target)
	};
	Game.alert = function (message, title, showCancel = false, primaryBtnText) {
		// Сохраняем текущее состояние канваса
		Game.helper.pause = true;
		ctx.save();
		// Проверка и установка значений по умолчанию
		title = title || "!";
		message = message || "";
		primaryBtnText = primaryBtnText || "OK";
		// Параметры модального окна
		const modalWidth = 700;
		const modalHeight = 400;
		const modalX = (1280 - modalWidth) / 2;
		const modalY = (720 - modalHeight) / 2;
		const padding = 20;
		const btnHeight = 40;
		const btnPadding = 30;
		const btnSpacing = 15;
		const fontSize = 16;
		const titleFontSize = 20;
		const lineHeight = fontSize * 1.5;
		// Цвета
		const bgColor = "rgb(50, 50, 50)";
		const borderColor = "rgb(100, 100, 100)";
		const textColor = "rgb(255, 255, 255)";
		const btnColor = "rgb(70, 130, 200)";
		const btnPressedColor = "rgb(40, 90, 150)";
		const btnCancelColor = "rgb(80, 80, 80)";
		const dimColor = "rgba(0, 0, 0, 0.7)";
		const scrollbarColor = "rgb(120, 120, 120)";
		const scrollbarHandleColor = "rgb(180, 180, 180)";
		// Состояние модального окна
		let scrollOffset = 0;
		let maxScrollOffset = 0;
		let isDragging = false;
		let dragStartY = 0;
		let startScrollOffset = 0;
		let primaryBtnPressed = false;
		let cancelBtnPressed = false;
		let modalClosed = false;
		let modalResult = null;
		const fontStyle = `${fontSize}px PressStart2P`;
		const titleFontStyle = `${titleFontSize}px PressStart2P`;
		function measureTextWidth(text, font) {
			ctx.save();
			ctx.font = font;
			const width = ctx.measureText(text).width;
			ctx.restore();
			return width
		}
		// Кнопки
		const primaryBtnWidth = Math.max(100, measureTextWidth(primaryBtnText, fontStyle) + btnPadding);
		const primaryBtnX = modalX + modalWidth - padding - primaryBtnWidth;
		const primaryBtnRect = {
			x: primaryBtnX,
			y: modalY + modalHeight - padding - btnHeight,
			w: primaryBtnWidth,
			h: btnHeight
		};
		let cancelBtnRect = null;
		if (showCancel) {
			const cancelText = "Cancel";
			const cancelBtnWidth = Math.max(100, measureTextWidth(cancelText, fontStyle) + btnPadding);
			const cancelBtnX = primaryBtnX - btnSpacing - cancelBtnWidth;
			cancelBtnRect = {
				x: cancelBtnX,
				y: modalY + modalHeight - padding - btnHeight,
				w: cancelBtnWidth,
				h: btnHeight
			}
		}
		// Функция для переноса текста
		function wrapText(text, maxWidth) {
			const words = text ? text.toString().split(" ") : [];
			const lines = [];
			let currentLine = words[0] || "";
			for (let i = 1; i < words.length; i++) {
				const word = words[i];
				const testLine = currentLine + " " + word;
				const testWidth = measureTextWidth(testLine, fontStyle);
				if (testWidth <= maxWidth) {
					currentLine = testLine
				} else {
					lines.push(currentLine);
					currentLine = word
				}
			}
			if (currentLine) {
				lines.push(currentLine)
			}
			return lines
		}
		// Рассчитываем максимальный скролл
		const messageAreaWidth = modalWidth - 2 * padding - 10; // -10 для скроллбара
		const messageLines = wrapText(message, messageAreaWidth);
		const messageAreaHeight = modalHeight - 3 * padding - titleFontSize - btnHeight - 10;
		maxScrollOffset = Math.max(0, messageLines.length * lineHeight - messageAreaHeight);
		// Функция отрисовки модального окна
		function renderModal() {
			ctx.fillStyle = dimColor;
			ctx.fillRect(0, 0, 1280, 720);
			ctx.fillStyle = bgColor;
			ctx.strokeStyle = borderColor;
			ctx.lineWidth = 2;
			ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
			ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
			ctx.fillStyle = "rgb(40, 40, 40)";
			ctx.fillRect(modalX, modalY, modalWidth, titleFontSize + padding * 2);
			ctx.fillStyle = textColor;
			ctx.font = titleFontStyle;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(title, modalX + modalWidth / 2, modalY + padding + titleFontSize / 2);
			ctx.save();
			ctx.beginPath();
			ctx.rect(modalX + padding, modalY + titleFontSize + padding * 2, messageAreaWidth, messageAreaHeight);
			ctx.clip();
			ctx.fillStyle = textColor;
			ctx.font = fontStyle;
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			let y = modalY + titleFontSize + padding * 2 - scrollOffset;
			for (const line of messageLines) {
				ctx.fillText(line, modalX + padding, y);
				y += lineHeight
			}
			ctx.restore();
			if (maxScrollOffset > 0) {
				const scrollbarX = modalX + modalWidth - padding - 6;
				const scrollbarY = modalY + titleFontSize + padding * 2;
				ctx.fillStyle = scrollbarColor;
				ctx.fillRect(scrollbarX, scrollbarY, 6, messageAreaHeight);
				const scrollRatio = scrollOffset / maxScrollOffset;
				const handleHeight = Math.max(20, messageAreaHeight * (messageAreaHeight / (maxScrollOffset + messageAreaHeight)));
				const handleY = scrollbarY + scrollRatio * (messageAreaHeight - handleHeight);
				ctx.fillStyle = scrollbarHandleColor;
				ctx.fillRect(scrollbarX + 1, handleY, 4, handleHeight)
			}
			function drawButton(rect, text, isPressed, isCancel = false) {
				ctx.fillStyle = isCancel ? isPressed ? "rgb(60, 60, 60)" : btnCancelColor : isPressed ? btnPressedColor : btnColor;
				ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
				ctx.fillStyle = textColor;
				ctx.font = fontStyle;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2)
			}
			if (showCancel) {
				drawButton(cancelBtnRect, Blockly.Msg["DIALOG_CANCEL"], cancelBtnPressed, true)
			}
			drawButton(primaryBtnRect, primaryBtnText, primaryBtnPressed)
		}
		function getCanvasCoordinates(clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;
			return {
				x: (clientX - rect.left) * scaleX,
				y: (clientY - rect.top) * scaleY
			}
		}
		function handleMouseDown(clientX, clientY) {
			const pos = getCanvasCoordinates(clientX, clientY);
			const x = pos.x;
			const y = pos.y;
			if (maxScrollOffset > 0) {
				const scrollbarX = modalX + modalWidth - padding - 6;
				const scrollbarY = modalY + titleFontSize + padding * 2;
				if (x >= scrollbarX && x <= scrollbarX + 6 && y >= scrollbarY && y <= scrollbarY + messageAreaHeight) {
					isDragging = true;
					dragStartY = y;
					startScrollOffset = scrollOffset;
					return
				}
			}
			if (showCancel && isPointInRect(x, y, cancelBtnRect)) {
				cancelBtnPressed = true;
				return
			}
			if (isPointInRect(x, y, primaryBtnRect)) {
				primaryBtnPressed = true
			}
		}
		function handleMouseUp(clientX, clientY) {
			if (isDragging) {
				isDragging = false;
				return
			}
			const pos = getCanvasCoordinates(clientX, clientY);
			const x = pos.x;
			const y = pos.y;
			if (primaryBtnPressed && isPointInRect(x, y, primaryBtnRect)) {
				modalClosed = true;
				modalResult = true
			}
			if (cancelBtnPressed && showCancel && isPointInRect(x, y, cancelBtnRect)) {
				modalClosed = true;
				modalResult = false
			}
			primaryBtnPressed = false;
			cancelBtnPressed = false
		}
		function handleMouseMove(clientX, clientY) {
			if (isDragging) {
				const pos = getCanvasCoordinates(clientX, clientY);
				const y = pos.y;
				const dy = y - dragStartY;
				const scrollableHeight = messageAreaHeight * (1 - messageAreaHeight / (maxScrollOffset + messageAreaHeight));
				scrollOffset = startScrollOffset + dy / scrollableHeight * maxScrollOffset;
				scrollOffset = Math.max(0, Math.min(scrollOffset, maxScrollOffset));
				dragStartY = y
			}
		}
		function isPointInRect(x, y, rect) {
			return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
		}
		let modalPromise;
		let resolvePromise;
		modalPromise = new Promise(resolve => {
			resolvePromise = resolve;
			function modalLoop() {
				if (Game.getKeyPress("KeyA", 0) || Game.getKeyPress("KeyA", 1)) {
					modalClosed = true;
					modalResult = true;
				}
				if (modalClosed) {
					canvas.removeEventListener("mousedown", mouseDownHandler);
					canvas.removeEventListener("mouseup", mouseUpHandler);
					canvas.removeEventListener("mousemove", mouseMoveHandler);
					ctx.restore();
					resolve(modalResult);
					Game.helper.pause = false;
					return
				}
				renderModal();
				requestAnimationFrame(modalLoop)
			}
			function mouseDownHandler(e) {
				handleMouseDown(e.clientX, e.clientY)
			}
			function mouseUpHandler(e) {
				handleMouseUp(e.clientX, e.clientY)
			}
			function mouseMoveHandler(e) {
				handleMouseMove(e.clientX, e.clientY)
			}
			canvas.addEventListener("mousedown", mouseDownHandler);
			canvas.addEventListener("mouseup", mouseUpHandler);
			canvas.addEventListener("mousemove", mouseMoveHandler);
			modalLoop()
		});
		Game.alert.close = function (result = false) {
			if (!modalClosed) {
				modalClosed = true;
				modalResult = result;
				if (resolvePromise) {
					resolvePromise(result)
				}
			}
		};
		return modalPromise
	};
	
	const originalAlert = Game.alert;
	Game.alert = function(message, title, showCancel = false, primaryBtnText) {
		Game.alert.isOpen = true;
		const promise = originalAlert.call(this, message, title, showCancel, primaryBtnText);
		
		promise.finally(() => {
			Game.alert.isOpen = false;
			// Вызываем обработчик закрытия, если он установлен
			if (Game.alert.onClose) {
				Game.alert.onClose();
			}
		});
		
		return promise;
	};
	// Добавляем флаг isOpen в Game.alert
	Game.alert.isOpen = false;

	// Модифицируем метод close
	Game.alert.close = function(result = false) {
		if (this.isOpen) {
			this.isOpen = false;
			// Вызываем обработчик закрытия, если он установлен
			if (this.onClose) {
				this.onClose();
			}
		}
		// Вызываем оригинальный close
		if (originalAlert.close) {
			originalAlert.close(result);
		}
	};
	// Функция для получения позиции касания/клика
	function getPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = 1280 / rect.width; // Масштаб по X (логический/физический)
		const scaleY = 720 / rect.height; // Масштаб по Y (логический/физический)
		let clientX,
		clientY;
		// Для событий мыши
		if (event.clientX !== undefined) {
			clientX = event.clientX - rect.left;
			clientY = event.clientY - rect.top
		}
		// Для событий касания
		else if (event.touches && event.touches[0]) {
			clientX = event.touches[0].clientX - rect.left;
			clientY = event.touches[0].clientY - rect.top
		} else {
			return null
		}
		// Масштабируем координаты к логическому размеру 1280x720
		return {
			x: clientX * scaleX,
			y: clientY * scaleY
		}
	}
	// Обработчики касаний/кликов
	function handleInteraction(event) {
		event.preventDefault();
		const pos = getPosition(event);
		if (pos) {
			// Проверка нажатия на сенсорные кнопки перед обработкой обычного касания
			if (!Game.helper.isTouchOnGamepad(pos.x, pos.y)) {
				Game.getTouch.istouch = 1;
				Game.getTouch.x = pos.x;
				Game.getTouch.y = pos.y
			}
		}
	}
	function handleMove(event) {
		event.preventDefault();
		const pos = getPosition(event);
		if (pos && Game.getTouch.istouch) {
			Game.getTouch.x = pos.x;
			Game.getTouch.y = pos.y
		}
	}
	function handleEnd(event) {
		event.preventDefault();
		// Проверяем, было ли это отпускание кнопки
		const pos = getPosition(event);
		if (pos) {
			checkTouchButtons(pos.x, pos.y, false)
		}
		Game.getTouch.istouch = 0
	}
	// Добавление обработчиков событий
	canvas.addEventListener("mousedown", handleInteraction);
	canvas.addEventListener("mousemove", handleMove);
	canvas.addEventListener("mouseup", handleEnd);
	canvas.addEventListener("mouseleave", handleEnd);
	canvas.addEventListener("touchstart", handleInteraction);
	canvas.addEventListener("touchmove", handleInteraction);
	canvas.addEventListener("touchend", handleEnd);
	canvas.addEventListener("touchcancel", handleEnd);
	// Обработчики геймпада
	window.addEventListener("gamepadconnected", event => {
		console.log("✅ 🎮 Геймпад подключен (устройство 0):", event.gamepad);
		inputState.hasGamepad = true;
		this.resetInputDevices();
	});
	window.addEventListener("gamepaddisconnected", event => {
		console.log("❌ 🎮 Геймпад отключен:", event.gamepad);
		inputState.hasGamepad = false;
		this.resetInputDevices();
	});

	// Класс Vector2 для работы с 2D векторами
	class Vector2 {
		constructor(x, y) {
			this.x = x;
			this.y = y
		}
		static rotate(v, angle, result = new Vector2(0, 0)) {
			const cos_a = Math.cos(angle);
			const sin_a = Math.sin(angle);
			const x = v.x * cos_a - v.y * sin_a;
			const y = v.x * sin_a + v.y * cos_a;
			result.x = x;
			result.y = y;
			return result
		}
		normalize() {
			const len_sq = this.x * this.x + this.y * this.y;
			if (len_sq > 0) {
				const inv_len = 1 / Math.sqrt(len_sq);
				this.x *= inv_len;
				this.y *= inv_len
			}
			return this
		}
		static dot(v1, v2) {
			return v1.x * v2.x + v1.y * v2.y
		}
		add(other) {
			return new Vector2(this.x + other.x, this.y + other.y)
		}
		static add(v1, v2) {
			return new Vector2(v1.x + v2.x, v1.y + v2.y)
		}
		sub(other) {
			return new Vector2(this.x - other.x, this.y - other.y)
		}
		multiply(scalar) {
			return new Vector2(this.x * scalar, this.y * scalar)
		}
	}
	function getPolygonAxes(points) {
		const axes = [];
		for (let i = 0; i < points.length; i++) {
			const p1 = points[i];
			const p2 = points[(i + 1) % points.length];
			const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
			const normal = new Vector2(-edge.y, edge.x).normalize();
			axes.push(normal);
		}
		return axes;
	}

	function projectPolygon(axis, points) {
		let min = Vector2.dot(axis, points[0]);
		let max = min;
		for (let i = 1; i < points.length; i++) {
			const projection = Vector2.dot(axis, points[i]);
			if (projection < min)
				min = projection;
			if (projection > max)
				max = projection;
		}
		return {
			min,
			max
		};
	}
	const TILE_NORMALS = [
		new Vector2(0, -1), // Верх
		new Vector2(1, 0), // Право
		new Vector2(0, 1), // Низ
		new Vector2(-1, 0) // Лево
	];
	function getPolygonBounds(points) {
		let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;

		for (const v of points) {
			minX = Math.min(minX, v.x);
			maxX = Math.max(maxX, v.x);
			minY = Math.min(minY, v.y);
			maxY = Math.max(maxY, v.y);
		}

		return {
			minX,
			maxX,
			minY,
			maxY
		};
	}
	function getCornersBounds(obj) {
		const shape = Game.getCollisionShape(obj);

		if (shape.type === 'rectangle') {
			if (shape.angle === 0) {
				return {
					minX: shape.x,
					maxX: shape.x + shape.width,
					minY: shape.y,
					maxY: shape.y + shape.height
				};
			} else {
				const angleRad = shape.angle * Math.PI / 180;
				const halfW = shape.width / 2;
				const halfH = shape.height / 2;
				const center = new Vector2(shape.x + halfW, shape.y + halfH);

				const corners = [
					Vector2.add(Vector2.rotate(new Vector2(-halfW, -halfH), angleRad), center),
					Vector2.add(Vector2.rotate(new Vector2(halfW, -halfH), angleRad), center),
					Vector2.add(Vector2.rotate(new Vector2(halfW, halfH), angleRad), center),
					Vector2.add(Vector2.rotate(new Vector2(-halfW, halfH), angleRad), center)
				];

				return getPolygonBounds(corners);
			}
		} else if (shape.type === 'circle') {
			return {
				minX: shape.x - shape.radius,
				maxX: shape.x + shape.radius,
				minY: shape.y - shape.radius,
				maxY: shape.y + shape.radius
			};
		}

		// По умолчанию возвращаем AABB объекта
		return {
			minX: obj.x,
			maxX: obj.x + obj.width,
			minY: obj.y,
			maxY: obj.y + obj.height
		};
	}
	function checkAABBTileCollision(obj, col, row) {
		if (row < 0 || row >= Game.helper.tiles.rows || col < 0 || col >= Game.helper.tiles.cols) {
			return false
		}
		const tileValue = Game.helper.tiles.grid[row][col];
		if (tileValue <= 0) {
			return false
		}
		// Проверяем твердость тайла через новую систему
		const isSolid = Game.isTileSolid(col, row);
		if (!isSolid) {
			return false
		}
		const tileSize = Game.helper.tiles.tileSize;
		const tileX = col * tileSize;
		const tileY = row * tileSize;
		// Рассчитываем проникновение по каждой оси
		const penetrationX = Math.min(obj.x + obj.width - tileX, tileX + tileSize - obj.x);
		const penetrationY = Math.min(obj.y + obj.height - tileY, tileY + tileSize - obj.y);
		if (penetrationX > 0 && penetrationY > 0) {
			// Добавляем информацию о столкнувшемся тайле
			obj.collidingTiles.push({
				col: col,
				row: row,
				tileId: tileValue,
				tileX: tileX,
				tileY: tileY,
				penetrationX: penetrationX,
				penetrationY: penetrationY
			});
			if (draw_bounding_box) {
				ctx.save();
				ctx.strokeStyle = "rgba(255,0,0,0.7)";
				ctx.lineWidth = 3;
				ctx.strokeRect(tileX - Game.screenx, tileY - Game.screeny, tileSize, tileSize);
				ctx.stroke();
				ctx.restore()
			}
			// Определяем главную ось коллизии (по минимальному проникновению)
			if (penetrationX < penetrationY) {
				// Коллизия по X оси
				if (obj.x + obj.width / 2 < tileX + tileSize / 2) {
					// Столкновение с левой стороной тайла
					obj.x = tileX - obj.width;
					obj.speedx = Math.min(obj.speedx, 0); // Гасим скорость внутрь тайла
				} else {
					// Столкновение с правой стороной тайла
					obj.x = tileX + tileSize;
					obj.speedx = Math.max(obj.speedx, 0); // Гасим скорость внутрь тайла
				}
			} else {
				// Коллизия по Y оси
				if (obj.y + obj.height / 2 < tileY + tileSize / 2) {
					// Столкновение с верхней стороной тайла
					obj.y = tileY - obj.height;
					obj.speedy = Math.min(obj.speedy, 0); // Гасим скорость внутрь тайла
					obj.isOnGround = true
				} else {
					// Столкновение с нижней стороной тайла
					obj.y = tileY + tileSize;
					obj.speedy = Math.max(obj.speedy, 0); // Гасим скорость внутрь тайла
				}
			}
			return true
		}
		return false
	}

	function checkOBBSATTileCollision(obj, objCorners, col, row) {
		if (row < 0 || row >= Game.helper.tiles.rows || col < 0 || col >= Game.helper.tiles.cols) {
			return false
		}
		const tileValue = Game.helper.tiles.grid[row][col];
		if (tileValue <= 0) {
			return false
		}
		// Проверяем, является ли тайл твердым
		if (!Game.isTileSolid(col, row)) {
			return false
		}
		const tileSize = Game.helper.tiles.tileSize;
		const tileX = col * tileSize;
		const tileY = row * tileSize;
		// Углы тайла
		const tileCorners = [new Vector2(tileX, tileY), new Vector2(tileX + tileSize, tileY), new Vector2(tileX + tileSize, tileY + tileSize), new Vector2(tileX, tileY + tileSize)];
		// Оси для SAT (нормали ребер объекта + нормали ребер тайла)
		const axes = [];
		// Добавляем нормали объекта
		for (let i = 0; i < objCorners.length; i++) {
			const p1 = objCorners[i];
			const p2 = objCorners[(i + 1) % objCorners.length];
			const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
			const normal = new Vector2(-edge.y, edge.x).normalize();
			axes.push(normal)
		}
		// Добавляем нормали тайла (горизонтальные и вертикальные)
		axes.push(new Vector2(1, 0));
		axes.push(new Vector2(0, 1));
		let minOverlap = Infinity;
		let smallestAxis = new Vector2(0, 0);
		for (const axis of axes) {
			const projObj = projectPolygon(axis, objCorners);
			const projTile = projectPolygon(axis, tileCorners);
			if (projObj.max < projTile.min || projTile.max < projObj.min) {
				return false; // Нет коллизии
			}
			const overlap = Math.min(projObj.max, projTile.max) - Math.max(projObj.min, projTile.min);
			if (overlap < minOverlap) {
				minOverlap = overlap;
				smallestAxis = axis
			}
		}
		// Определение направления нормали
		const centerObj = new Vector2((objCorners[0].x + objCorners[2].x) / 2, (objCorners[0].y + objCorners[2].y) / 2);
		const centerTile = new Vector2(tileX + tileSize / 2, tileY + tileSize / 2);
		if (Vector2.dot(new Vector2(centerTile.x - centerObj.x, centerTile.y - centerObj.y), smallestAxis) < 0) {
			smallestAxis.x *= -1;
			smallestAxis.y *= -1
		}
		// Добавляем информацию о столкнувшемся тайле
		obj.collidingTiles.push({
			col: col,
			row: row,
			tileId: tileValue,
			tileX: tileX,
			tileY: tileY,
			normalX: smallestAxis.x,
			normalY: smallestAxis.y,
			overlap: minOverlap
		});
		if (draw_bounding_box) {
			ctx.beginPath();
			ctx.moveTo(tileX + tileSize / 2 - Game.screenx, tileY + tileSize / 2 - Game.screeny);
			ctx.lineTo(
				(tileX + tileSize / 2 + collision.normal.x * 30) - Game.screenx,
				(tileY + tileSize / 2 + collision.normal.y * 30) - Game.screeny);
			ctx.strokeStyle = "red";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		return {
			collides: true,
			normal: smallestAxis,
			overlap: minOverlap
		}
	}
	function getEdgeNormal(p1, p2) {
		const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
		return new Vector2(-edge.y, edge.x).normalize()
	}
	function updatePersistentContacts(obj, col, row, normal = null) {
		const tileX = col * Game.helper.tiles.tileSize;
		const tileY = row * Game.helper.tiles.tileSize;
		const tileSize = Game.helper.tiles.tileSize;

		// Если нормаль не предоставлена (AABB коллизия), вычисляем ее
		if (!normal) {
			const objCenterX = obj.x + obj.width / 2;
			const objCenterY = obj.y + obj.height / 2;
			const tileCenterX = tileX + tileSize / 2;
			const tileCenterY = tileY + tileSize / 2;

			// Вычисляем направление от центра тайла к центру объекта
			const dx = objCenterX - tileCenterX;
			const dy = objCenterY - tileCenterY;

			// Определяем главную ось столкновения
			if (Math.abs(dx) > Math.abs(dy)) {
				normal = new Vector2(dx > 0 ? 1 : -1, 0);
			} else {
				normal = new Vector2(0, dy > 0 ? 1 : -1);
			}
		}

		// Определяем сторону столкновения на основе нормали
		let side = null;
		if (normal.y < -0.7)
			side = 'top'; // Столкновение с низом тайла (верх объекта)
		else if (normal.y > 0.7)
			side = 'bottom'; // Столкновение с верхом тайла (низ объекта)
		else if (normal.x < -0.7)
			side = 'left'; // Столкновение с правом тайла (лево объекта)
		else if (normal.x > 0.7)
			side = 'right'; // Столкновение с левом тайла (право объекта)

		if (side) {
			obj.persistentContacts[side].count++;
			obj.persistentContacts[side].tile = {
				col,
				row
			};
		}
	}

	function checkPersistentContacts(obj) {
		let isStuck = false;

		// Проверяем все стороны на длительный контакт
		for (let side in obj.persistentContacts) {
			const contact = obj.persistentContacts[side];

			if (contact.count >= obj.minPersistentFrames) {
				isStuck = true;

				// Можно добавить специальные эффекты для разных сторон
				if (side === 'bottom') {
					obj.isOnGround = true;
					// Дополнительные эффекты при длительном контакте с землей
				}
			}
		}

		obj.isStuck = isStuck;

		// Дополнительная логика при "залипании"
		if (obj.isStuck) {
			// Например, уменьшение скорости или другие эффекты
			obj.speedx *= 0.9;
			obj.speedy *= 0.9;
		}
	}
	function resolveTileCollision(obj, collision) {
		const {
			normal,
			overlap
		} = collision;
		// Добавляем небольшой "буфер" чтобы избежать повторных коллизий
		const buffer = .1;
		// Коррекция позиции с буфером
		obj.x -= normal.x * (overlap + buffer);
		obj.y -= normal.y * (overlap + buffer);
		// Коррекция скорости только если объект движется в направлении тайла
		const dot = obj.speedx * normal.x + obj.speedy * normal.y;
		if (dot < 0) {
			obj.speedx -= dot * normal.x * obj.restitution;
			obj.speedy -= dot * normal.y * obj.restitution;
			// Гасим микроскорости чтобы избежать дрожания
			if (Math.abs(obj.speedx) < .01)
				obj.speedx = 0;
			if (Math.abs(obj.speedy) < .01)
				obj.speedy = 0
		}
		// Проверка "на земле" с учетом нормали
		if (normal.y <  - .7) { // Более строгий порог
			obj.isOnGround = true
		}
	}
	// Функции для работы с полигонами и коллизиями
	function getPolygonAxes(points) {
		const axes = [];
		for (let i = 0; i < points.length; i++) {
			const p1 = points[i];
			const p2 = points[(i + 1) % points.length];
			const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
			const normal = new Vector2(-edge.y, edge.x).normalize();
			axes.push(normal)
		}
		return axes
	}
	function projectPolygon(axis, points) {
		let min = Vector2.dot(axis, points[0]);
		let max = min;
		for (let i = 1; i < points.length; i++) {
			const projection = Vector2.dot(axis, points[i]);
			if (projection < min)
				min = projection;
			if (projection > max)
				max = projection
		}
		return {
			min: min,
			max: max
		}
	}
	// Функция для загрузки тайлов из массива
	Game.setTileFromArray = function (tileArray) {
		if (!Array.isArray(tileArray) || tileArray.length < 2) {
			console.error("Invalid tile array format");
			return
		}
		Game.helper.tiles.tileSize = tileArray[0];
		Game.helper.tiles.cols = tileArray[1];
		Game.helper.tiles.rows = tileArray[2];
		Game.helper.tiles.grid = Array(Game.helper.tiles.rows).fill().map(() => Array(Game.helper.tiles.cols).fill(0));
		Game.helper.tiles.tilesData = {}; // Для хранения дополнительных данных
		Game.helper.tiles.solidMap = {}; // Отдельная карта твердости
		let index = 3;
		let row = 0;
		let col = 0;
		while (index < tileArray.length && row < Game.helper.tiles.rows) {
			const value = tileArray[index];
			if (value >= 32768) {
				// RLE-сжатие
				const repeatCount = value - 32768;
				const tileValue = tileArray[index + 1];
				index += 2;
				for (let i = 0; i < repeatCount; i++) {
					if (col >= Game.helper.tiles.cols) {
						col = 0;
						row++;
						if (row >= Game.helper.tiles.rows)
							break
					}
					if (tileValue >= 16383 && tileValue <= 32765) {
						const originalId = tileValue - 16383;
						Game.helper.tiles.grid[row][col] = originalId;
						// По умолчанию тайлы с ID 16383-32765 - твердые
						Game.helper.tiles.solidMap[`${row}_${col}`] = true
					} else {
						Game.helper.tiles.grid[row][col] = tileValue;
						// По умолчанию обычные тайлы - мягкие
						Game.helper.tiles.solidMap[`${row}_${col}`] = false
					}
					col++
				}
			} else {
				if (col >= Game.helper.tiles.cols) {
					col = 0;
					row++;
					if (row >= Game.helper.tiles.rows)
						break
				}
				if (value >= 16383 && value <= 32765) {
					const originalId = value - 16383;
					Game.helper.tiles.grid[row][col] = originalId;
					// Тайлы с ID 16383-32765 - твердые по умолчанию
					Game.helper.tiles.solidMap[`${row}_${col}`] = true
				} else {
					Game.helper.tiles.grid[row][col] = value;
					// Обычные тайлы - мягкие по умолчанию
					Game.helper.tiles.solidMap[`${row}_${col}`] = false
				}
				col++;
				index++
			}
		}
	};
	// Функция для установки спрайта тайлов
	Game.setTileImage = function (spriteNumber) {
		Game.helper.tiles.sprite = spriteNumber
	};
	Game.isTileSolid = function (tileX, tileY) {
		if (!Game.helper.tiles.grid || tileY < 0 || tileY >= Game.helper.tiles.rows || tileX < 0 || tileX >= Game.helper.tiles.cols) {
			return false
		}
		const tileValue = Game.helper.tiles.grid[tileY][tileX];
		if (tileValue <= 0)
			return false;
		// Проверяем карту твердости
		return Game.helper.tiles.solidMap[`${tileY}_${tileX}`] || false
	};
	// Добавляем функцию для получения тайла в координатах
	Game.getTileAt = function (pixelX, pixelY) {
		if (!Game.helper.tiles.grid)
			return 0;
		const tileX = Math.floor(pixelX / Game.helper.tiles.tileSize);
		const tileY = Math.floor(pixelY / Game.helper.tiles.tileSize);
		if (tileY < 0 || tileY >= Game.helper.tiles.rows || tileX < 0 || tileX >= Game.helper.tiles.cols) {
			return 0
		}
		return Game.helper.tiles.grid[tileY][tileX]
	};
	Game.checkTileCollision = function (obj) {
		if (!Game.helper.tiles.grid || Game.helper.tiles.sprite === -1 || !obj.solid) {
			return false;
		}

		// Сброс временных данных о столкновениях
		obj.collidingTiles = [];
		let collided = false;

		// Сброс счетчиков контактов
		for (let side in obj.persistentContacts) {
			obj.persistentContacts[side].count = 0;
		}

		const shape = Game.getCollisionShape(obj);
		const tileSize = Game.helper.tiles.tileSize;

		// Определяем количество проверок в зависимости от скорости объекта
		const speed = Math.sqrt(obj.speedx * obj.speedx + obj.speedy * obj.speedy);
		const checks = Math.max(1, Math.min(Math.ceil(speed / tileSize), 5)); // От 1 до 5 проверок

		// Если скорость высокая, выполняем несколько проверок вдоль пути
		for (let i = 1; i <= checks; i++) {
			const fraction = i / checks;

			// Временное смещение для проверки
			const offsetX = obj.speedx * fraction;
			const offsetY = obj.speedy * fraction;

			// Создаем временную форму коллизии со смещением
			let tempShape;
			if (shape.type === 'rectangle') {
				tempShape = {
					type: 'rectangle',
					x: shape.x + offsetX,
					y: shape.y + offsetY,
					width: shape.width,
					height: shape.height,
					angle: shape.angle
				};
			} else if (shape.type === 'circle') {
				tempShape = {
					type: 'circle',
					x: shape.x + offsetX,
					y: shape.y + offsetY,
					radius: shape.radius
				};
			}

			if (tempShape.type === 'rectangle') {
				if (!tempShape.angle || Math.abs(tempShape.angle % 360) < 0.1) {
					// AABB коллизия
					const left = Math.floor(tempShape.x / tileSize);
					const right = Math.floor((tempShape.x + tempShape.width) / tileSize);
					const top = Math.floor(tempShape.y / tileSize);
					const bottom = Math.floor((tempShape.y + tempShape.height) / tileSize);

					for (let row = top; row <= bottom; row++) {
						for (let col = left; col <= right; col++) {
							if (checkAABBTileCollision(obj, col, row)) {
								collided = true;
								updatePersistentContacts(obj, col, row);
							}
						}
					}
				} else {
					// OBB коллизия
					const angleRad = tempShape.angle * Math.PI / 180;
					const halfW = tempShape.width / 2;
					const halfH = tempShape.height / 2;
					const center = new Vector2(tempShape.x + halfW, tempShape.y + halfH);

					const objCorners = [
						Vector2.add(Vector2.rotate(new Vector2(-halfW, -halfH), angleRad), center),
						Vector2.add(Vector2.rotate(new Vector2(halfW, -halfH), angleRad), center),
						Vector2.add(Vector2.rotate(new Vector2(halfW, halfH), angleRad), center),
						Vector2.add(Vector2.rotate(new Vector2(-halfW, halfH), angleRad), center)
					];

					const bounds = getPolygonBounds(objCorners);
					const leftCol = Math.floor(bounds.minX / tileSize);
					const rightCol = Math.floor(bounds.maxX / tileSize);
					const topRow = Math.floor(bounds.minY / tileSize);
					const bottomRow = Math.floor(bounds.maxY / tileSize);

					for (let row = topRow; row <= bottomRow; row++) {
						for (let col = leftCol; col <= rightCol; col++) {
							const collision = checkOBBSATTileCollision(obj, objCorners, col, row);
							if (collision.collides) {
								Game.tileResolveCollision(obj, collision);
								updatePersistentContacts(obj, col, row, collision.normal);
								collided = true;
							}
						}
					}
				}
			} else if (tempShape.type === 'circle') {
				// Обработка круговых коллизий
				const leftCol = Math.floor((tempShape.x - tempShape.radius) / tileSize);
				const rightCol = Math.floor((tempShape.x + tempShape.radius) / tileSize);
				const topRow = Math.floor((tempShape.y - tempShape.radius) / tileSize);
				const bottomRow = Math.floor((tempShape.y + tempShape.radius) / tileSize);

				for (let row = topRow; row <= bottomRow; row++) {
					for (let col = leftCol; col <= rightCol; col++) {
						if (Game.checkCircleTileCollision(obj, tempShape, col, row)) {
							updatePersistentContacts(obj, col, row);
							collided = true;
						}
					}
				}
			}

			// Если обнаружено столкновение, прерываем дальнейшие проверки
			if (collided)
				break;
		}

		// Проверка длительных контактов
		checkPersistentContacts(obj);

		return collided;
	};
	Game.checkCollision = function (a, b) {
		const shapeA = Game.getCollisionShape(a);
		const shapeB = Game.getCollisionShape(b);

		if (shapeA.type === 'rectangle' && shapeB.type === 'rectangle') {
			return Game.checkRectRectCollision(a, b, shapeA, shapeB);
		} else if (shapeA.type === 'circle' && shapeB.type === 'circle') {
			return Game.checkCircleCircleCollision(a, b, shapeA, shapeB);
		} else if (shapeA.type === 'rectangle' && shapeB.type === 'circle') {
			return Game.checkRectCircleCollision(a, b, shapeA, shapeB);
		} else if (shapeA.type === 'circle' && shapeB.type === 'rectangle') {
			const result = Game.checkRectCircleCollision(b, a, shapeB, shapeA);
			if (result.collides) {
				result.normal.x = -result.normal.x;
				result.normal.y = -result.normal.y;
			}
			return result;
		}

		return {
			collides: false
		};
	};
	Game.checkRectRectCollision = function(a, b, rect1, rect2) {
		// Fast AABB check first
		if (rect1.x + rect1.width < rect2.x || 
			rect2.x + rect2.width < rect1.x || 
			rect1.y + rect1.height < rect2.y || 
			rect2.y + rect2.height < rect1.y) {
			return { collides: false };
		}

		// Cache centers and half-sizes
		const cx1 = rect1.x + rect1.width/2, cy1 = rect1.y + rect1.height/2;
		const cx2 = rect2.x + rect2.width/2, cy2 = rect2.y + rect2.height/2;
		const hw1 = rect1.width/2, hh1 = rect1.height/2;
		const hw2 = rect2.width/2, hh2 = rect2.height/2;

		// Cache rotation values
		const a1 = rect1.angle * Math.PI/180, cos1 = Math.cos(a1), sin1 = Math.sin(a1);
		const a2 = rect2.angle * Math.PI/180, cos2 = Math.cos(a2), sin2 = Math.sin(a2);

		// Get rotated points for both rectangles
		const getPoints = (cx, cy, hw, hh, cos, sin) => [
			{x: cx + (-hw*cos + hh*sin), y: cy + (-hw*sin - hh*cos)}, // TL
			{x: cx + ( hw*cos + hh*sin), y: cy + ( hw*sin - hh*cos)}, // TR
			{x: cx + ( hw*cos - hh*sin), y: cy + ( hw*sin + hh*cos)}, // BR
			{x: cx + (-hw*cos - hh*sin), y: cy + (-hw*sin + hh*cos)}  // BL
		];

		const pts1 = getPoints(cx1, cy1, hw1, hh1, cos1, sin1);
		const pts2 = getPoints(cx2, cy2, hw2, hh2, cos2, sin2);

		// Get all axes for SAT
		const axes = [];
		const getAxes = (points, axes) => {
			for (let i = 0; i < points.length; i++) {
				const p1 = points[i], p2 = points[(i+1)%4];
				const dx = p2.x - p1.x, dy = p2.y - p1.y;
				const len = Math.sqrt(dx*dx + dy*dy);
				axes.push({x: -dy/len, y: dx/len}); // normalized normal
			}
		};
		getAxes(pts1, axes);
		getAxes(pts2, axes);

		// Check all axes for overlap
		let minOverlap = Infinity, normal = {x: 0, y: 0};
		
		const project = (axis, points) => {
			let min = Infinity, max = -Infinity;
			for (const p of points) {
				const dot = p.x*axis.x + p.y*axis.y;
				min = Math.min(min, dot);
				max = Math.max(max, dot);
			}
			return {min, max};
		};

		for (const axis of axes) {
			const p1 = project(axis, pts1);
			const p2 = project(axis, pts2);
			
			if (p1.max < p2.min || p2.max < p1.min) {
				return {collides: false};
			}
			
			const overlap = Math.min(p1.max, p2.max) - Math.max(p1.min, p2.min);
			if (overlap < minOverlap) {
				minOverlap = overlap;
				normal = axis;
			}
		}

		// Ensure normal points from rect1 to rect2
		const dx = cx2 - cx1, dy = cy2 - cy1;
		if (dx*normal.x + dy*normal.y < 0) {
			normal = {x: -normal.x, y: -normal.y};
		}

		return {
			collides: true,
			normal: normal,
			overlap: minOverlap
		};
	};
	// Вспомогательная функция для определения формы коллизии
	Game.getCollisionShape = function (obj) {
		// Предварительно вычисляем общие значения
		const offsetX = (obj.width - obj.boundingWidth) / 2;
		const offsetY = (obj.height - obj.boundingHeight) / 2;
		const centerX = offsetX + obj.boundingWidth / 2;
		const centerY = offsetY + obj.boundingHeight / 2;

		// Обрабатываем разные типы коллизий
		const shape = obj.collisionShape;
		if (shape === undefined || shape === 0 || shape === 1) {
			return {
				type: 'rectangle',
				x: obj.x + offsetX,
				y: obj.y + offsetY,
				width: obj.boundingWidth,
				height: obj.boundingHeight,
				angle: obj.angle || 0
			};
		} 
		else if (shape === 2) {
			return {
				type: 'circle',
				x: obj.x + centerX,
				y: obj.y + centerY,
				radius: Math.min(obj.boundingWidth, obj.boundingHeight) / 2
			};
		} 
		else if (shape && typeof shape === 'object' && shape.radius !== undefined) {
			return {
				type: 'circle',
				x: obj.x + centerX,
				y: obj.y + centerY,
				radius: shape.radius
			};
		}

		// По умолчанию — прямоугольник
		return {
			type: 'rectangle',
			x: obj.x + offsetX,
			y: obj.y + offsetY,
			width: obj.boundingWidth,
			height: obj.boundingHeight,
			angle: obj.angle || 0
		};
	};

	Game.checkCircleCircleCollision = function (a, b, shapeA, shapeB) {
		const dx = shapeB.x - shapeA.x;
		const dy = shapeB.y - shapeA.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const minDistance = shapeA.radius + shapeB.radius;

		if (distance < minDistance) {
			return {
				collides: true,
				normal: {
					x: dx / distance,
					y: dy / distance
				},
				overlap: minDistance - distance
			};
		}
		return {
			collides: false
		};
	};
	Game.checkCircleTileCollision = function (obj, circleShape, col, row) {
		if (row < 0 || row >= Game.helper.tiles.rows || col < 0 || col >= Game.helper.tiles.cols) {
			return false;
		}

		const tileValue = Game.helper.tiles.grid[row][col];
		if (tileValue <= 0 || !Game.isTileSolid(col, row)) {
			return false;
		}

		const tileSize = Game.helper.tiles.tileSize;
		const tileX = col * tileSize;
		const tileY = row * tileSize;

		// Находим ближайшую точку на тайле к центру круга
		let closestX = Math.max(tileX, Math.min(circleShape.x, tileX + tileSize));
		let closestY = Math.max(tileY, Math.min(circleShape.y, tileY + tileSize));

		// Если центр круга внутри тайла, корректируем ближайшую точку
		let circleInside = false;
		if (circleShape.x >= tileX && circleShape.x <= tileX + tileSize &&
			circleShape.y >= tileY && circleShape.y <= tileY + tileSize) {
			circleInside = true;

			// Находим направление ближайшего выхода
			const distLeft = circleShape.x - tileX;
			const distRight = tileX + tileSize - circleShape.x;
			const distTop = circleShape.y - tileY;
			const distBottom = tileY + tileSize - circleShape.y;

			const minDist = Math.min(distLeft, distRight, distTop, distBottom);

			if (minDist === distLeft) {
				closestX = tileX;
				closestY = circleShape.y;
			} else if (minDist === distRight) {
				closestX = tileX + tileSize;
				closestY = circleShape.y;
			} else if (minDist === distTop) {
				closestX = circleShape.x;
				closestY = tileY;
			} else {
				closestX = circleShape.x;
				closestY = tileY + tileSize;
			}
		}

		const distanceX = circleShape.x - closestX;
		const distanceY = circleShape.y - closestY;
		const distanceSquared = distanceX * distanceX + distanceY * distanceY;

		if (circleInside || distanceSquared < circleShape.radius * circleShape.radius) {
			const distance = Math.sqrt(distanceSquared);
			let overlap = circleShape.radius - (circleInside ? -distance : distance);

			// Нормаль коллизии (направлена от тайла к кругу)
			let normalX,
			normalY;
			if (distance === 0) {
				// Случай, когда круг точно в углу
				normalX = circleShape.x < tileX + tileSize / 2 ? -1 : 1;
				normalY = circleShape.y < tileY + tileSize / 2 ? -1 : 1;
				// Нормализуем
				const len = Math.sqrt(normalX * normalX + normalY * normalY);
				normalX /= len;
				normalY /= len;
			} else {
				normalX = distanceX / distance;
				normalY = distanceY / distance;
			}

			// Коррекция позиции (более агрессивная)
			const correctionX = normalX * overlap * 1.05; // Небольшой дополнительный толчок
			const correctionY = normalY * overlap * 1.05;

			// Применяем коррекцию
			circleShape.x += correctionX;
			circleShape.y += correctionY;
			obj.x += correctionX;
			obj.y += correctionY;

			// Коррекция скорости
			const dot = obj.speedx * normalX + obj.speedy * normalY;
			if (dot < 0) {
				obj.speedx -= dot * normalX * (obj.restitution || 0.5);
				obj.speedy -= dot * normalY * (obj.restitution || 0.5);
			}

			// Добавляем информацию о коллизии
			obj.collidingTiles.push({
				col: col,
				row: row,
				tileId: tileValue,
				tileX: tileX,
				tileY: tileY,
				normalX: normalX,
				normalY: normalY,
				overlap: overlap
			});

			return true;
		}

		return false;
	};

	// Проверка столкновения прямоугольник-круг
	Game.checkRectCircleCollision = function (rect, circle, shapeRect, shapeCircle) {
		const angle = -shapeRect.angle * Math.PI / 180;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		const rectCenterX = shapeRect.x + shapeRect.width / 2;
		const rectCenterY = shapeRect.y + shapeRect.height / 2;

		// Координаты круга относительно центра прямоугольника
		const dx = shapeCircle.x - rectCenterX;
		const dy = shapeCircle.y - rectCenterY;

		// Поворачиваем координаты круга
		const rotatedX = dx * cos - dy * sin;
		const rotatedY = dx * sin + dy * cos;

		// Ближайшая точка на прямоугольнике к кругу
		let closestX = Math.max(-shapeRect.width / 2, Math.min(rotatedX, shapeRect.width / 2));
		let closestY = Math.max(-shapeRect.height / 2, Math.min(rotatedY, shapeRect.height / 2));

		// Проверяем, находится ли центр круга внутри прямоугольника
		const circleInside = (rotatedX >= -shapeRect.width / 2 && rotatedX <= shapeRect.width / 2 &&
			rotatedY >= -shapeRect.height / 2 && rotatedY <= shapeRect.height / 2);

		let distanceX,
		distanceY;
		if (circleInside) {
			// Находим ближайшую грань
			const distLeft = rotatedX - (-shapeRect.width / 2);
			const distRight = shapeRect.width / 2 - rotatedX;
			const distTop = rotatedY - (-shapeRect.height / 2);
			const distBottom = shapeRect.height / 2 - rotatedY;

			const minDist = Math.min(distLeft, distRight, distTop, distBottom);

			if (minDist === distLeft) {
				closestX = -shapeRect.width / 2;
				closestY = rotatedY;
			} else if (minDist === distRight) {
				closestX = shapeRect.width / 2;
				closestY = rotatedY;
			} else if (minDist === distTop) {
				closestX = rotatedX;
				closestY = -shapeRect.height / 2;
			} else {
				closestX = rotatedX;
				closestY = shapeRect.height / 2;
			}

			distanceX = rotatedX - closestX;
			distanceY = rotatedY - closestY;
		} else {
			distanceX = rotatedX - closestX;
			distanceY = rotatedY - closestY;
		}

		const distanceSquared = distanceX * distanceX + distanceY * distanceY;
		const radiusSquared = shapeCircle.radius * shapeCircle.radius;

		if (circleInside || distanceSquared < radiusSquared) {
			const distance = Math.sqrt(distanceSquared);
			const overlap = shapeCircle.radius - (circleInside ? -distance : distance);

			// Поворачиваем нормаль обратно в глобальные координаты
			const globalNormalX = (distanceX / distance) * cos + (distanceY / distance) * sin;
			const globalNormalY =  - (distanceX / distance) * sin + (distanceY / distance) * cos;

			return {
				collides: true,
				normal: {
					x: globalNormalX,
					y: globalNormalY
				},
				overlap: overlap * 1.2 // Увеличиваем перекрытие для гарантированного разделения
			};
		}

		return {
			collides: false
		};
	};
	Game.addObjectsFromArray = function (objectsArray) {
		for (var arrIndex = 0; arrIndex < objectsArray.length; arrIndex++) {
			var obj = objectsArray[arrIndex];
			var xyArray = obj.xy;
			var objectRef = obj.id;

			// Check if object with such id exists
			if (!objectRef) {
				console.error('Object with id "' + objectRef + '" not found in window scope');
				continue;
			}

			// Check that xyArray is an array and has correct number of elements (multiple of 3: x, y, angle)
			if (!Array.isArray(xyArray)) {
				console.error('xy property for object "' + objectRef + '" is not an array');
				continue;
			}
			if (xyArray.length % 3 !== 0) {
				console.error('xy array for object "' + objectRef + '" should have elements in triplets (x, y, angle)');
				continue;
			}

			// Add objects
			for (var i = 0; i < xyArray.length; i += 3) {
				var x = xyArray[i];
				var y = xyArray[i + 1];
				var angle = xyArray[i + 2];

				// Check that coordinates and angle are numbers
				if (typeof x !== "number" || typeof y !== "number" || typeof angle !== "number") {
					console.error("Invalid coordinates or angle at position " + i + ' for object "' + objectRef + '"');
					continue;
				}

				// Call addObject method with parameters
				var o = Game.addObject(objectRef.name, x, y, objectRef.width, objectRef.height, objectRef.sprite);

				// Copy all properties from objectRef to the new object
				for (var key in objectRef) {
					if (objectRef.hasOwnProperty(key)) {
						o[key] = Game.helper.deepCopy(objectRef[key]);
					}
				}

				// Set position and angle
				o.x = x;
				o.y = y;
				o.angle = angle;

				// Call onCreate if it exists
				if (o.onCreate)
					o.onCreate();
			}
		}
	};
	Game.tileResolveCollision = function (obj, collision) {
		const {
			normal,
			overlap
		} = collision;
		const buffer = 0.1;

		// Коррекция позиции
		obj.x -= normal.x * (overlap + buffer);
		obj.y -= normal.y * (overlap + buffer);

		// Проверка "на земле" с учетом угла объекта
		if (gravitation > 0) {
			if (normal.y > 0.7) { // Если нормаль вверх (y близко к 1)
				obj.isOnGround = true;
				obj.speedy = Math.max(0, obj.speedy);
			}
		} else {
			if (normal.y < -0.7) { // Если нормаль вверх (y близко к 1)
				obj.isOnGround = true;
				obj.speedy = Math.max(0, obj.speedy);
			}
		}
		// Гашение микроскоростей
		if (Math.abs(obj.speedx) < 0.01)
			obj.speedx = 0;
		if (Math.abs(obj.speedy) < 0.01)
			obj.speedy = 0;
		//console.log("downDot:", downDot, "normal:", normal, "objDown:", {x: objDownX, y: objDownY});
	};
	// Проверяет, находится ли объект в длительном контакте с указанной стороной
	Game.isPersistentContact = function (obj, side) {
		return obj.persistentContacts[side].count >= obj.minPersistentFrames;
	};

	// Возвращает тайл, с которым есть длительный контакт
	Game.getPersistentContactTile = function (obj, side) {
		if (obj.persistentContacts[side].count >= obj.minPersistentFrames) {
			return obj.persistentContacts[side].tile;
		}
		return null;
	};

	// Проверяет, "залип" ли объект к поверхностям
	Game.isObjectStuck = function (obj) {
		return obj.isStuck;
	};
	Game.resolveCollision = function (a, b, collisionInfo) {
		if (a.isStatic && b.isStatic)
			return;
		const {
			normal,
			overlap
		} = collisionInfo;

		// Особый случай: если нормаль указывает на угол (обе компоненты значительны)
		const isCornerCollision = Math.abs(normal.x) > 0.5 && Math.abs(normal.y) > 0.5;
		if (a.isStatic || b.isStatic) {
			const staticObj = a.isStatic ? a : b;
			const dynamicObj = a.isStatic ? b : a;

			// Увеличиваем overlap для статических объектов
			const enhancedOverlap = overlap * 1.5;

			// Применяем коррекцию только к динамическому объекту
			dynamicObj.x -= normal.x * enhancedOverlap;
			dynamicObj.y -= normal.y * enhancedOverlap;

			// Коррекция скорости
			const velocityAlongNormal = dynamicObj.speedx * normal.x + dynamicObj.speedy * normal.y;
			if (velocityAlongNormal < 0) {
				dynamicObj.speedx -= velocityAlongNormal * normal.x * dynamicObj.restitution;
				dynamicObj.speedy -= velocityAlongNormal * normal.y * dynamicObj.restitution;
			}

			return;
		}

		if (isCornerCollision) {
			// Для угловых столкновений увеличиваем overlap и применяем коррекцию по обеим осям
			const buffer = 0.5; // Увеличиваем буфер для углов
			const correction = new Vector2(
					normal.x * (overlap + buffer),
					normal.y * (overlap + buffer));

			if (!a.isStatic) {
				a.x -= correction.x;
				a.y -= correction.y;
			}
			if (!b.isStatic) {
				b.x += correction.x;
				b.y += correction.y;
			}

			// Дополнительная коррекция скорости
			const dot = (b.speedx - a.speedx) * normal.x + (b.speedy - a.speedy) * normal.y;
			if (dot < 0) {
				const restitution = Math.min(a.restitution, b.restitution);
				const j =  - (1 + restitution) * dot;

				if (!a.isStatic) {
					a.speedx -= j * normal.x / a.mass;
					a.speedy -= j * normal.y / a.mass;
				}
				if (!b.isStatic) {
					b.speedx += j * normal.x / b.mass;
					b.speedy += j * normal.y / b.mass;
				}
			}

			return;
		}
		const maxSpeed = 30.0; // Лимит скорости

		// Защита от некорректных данных
		if (Math.abs(overlap) < 0.1)
			return;
		if (Math.abs(normal.x) + Math.abs(normal.y) < 0.001)
			return;

		// Усиленная коррекция позиции с увеличенным буфером
		const buffer = 0.2;
		const correction = new Vector2(
				normal.x * (overlap + buffer),
				normal.y * (overlap + buffer));

		const totalMass = a.isStatic ? b.mass : b.isStatic ? a.mass : a.mass + b.mass;
		const aRatio = b.isStatic ? 1 : a.isStatic ? 0 : b.mass / totalMass;
		const bRatio = a.isStatic ? 1 : b.isStatic ? 0 : a.mass / totalMass;

		if (!a.isStatic) {
			a.x -= correction.x * aRatio;
			a.y -= correction.y * aRatio;
			if (a.updateCollisionShape)
				a.updateCollisionShape();
		}
		if (!b.isStatic) {
			b.x += correction.x * bRatio;
			b.y += correction.y * bRatio;
			if (b.updateCollisionShape)
				b.updateCollisionShape();
		}

		// Импульс
		const relativeVelocity = new Vector2(b.speedx - a.speedx, b.speedy - a.speedy);
		const velocityAlongNormal = Vector2.dot(relativeVelocity, normal);
		if (velocityAlongNormal > 0)
			return;

		const restitution = Math.min(a.restitution, b.restitution);
		let j =  - (1 + restitution) * velocityAlongNormal;
		j /= (a.isStatic ? 0 : 1 / Math.max(a.mass, 0.1)) + (b.isStatic ? 0 : 1 / Math.max(b.mass, 0.1));

		const impulse = new Vector2(normal.x * j, normal.y * j);

		// Функция применения импульса с ограничением скорости
		const clampSpeed = (obj) => {
			const speed = Math.sqrt(obj.speedx * obj.speedx + obj.speedy * obj.speedy);
			if (speed > maxSpeed) {
				const ratio = maxSpeed / speed;
				obj.speedx *= ratio;
				obj.speedy *= ratio;
			}

			// Гасим микроскорости
			if (Math.abs(obj.speedx) < 0.01)
				obj.speedx = 0;
			if (Math.abs(obj.speedy) < 0.01)
				obj.speedy = 0;
		};

		if (!a.isStatic) {
			a.speedx += -impulse.x / Math.max(a.mass, 0.1);
			a.speedy += -impulse.y / Math.max(a.mass, 0.1);
			clampSpeed(a);
		}

		if (!b.isStatic) {
			b.speedx += impulse.x / Math.max(b.mass, 0.1);
			b.speedy += impulse.y / Math.max(b.mass, 0.1);
			clampSpeed(b);
		}

		// Обновляем состояние "на земле"
		if (normal.y > 0.5) {
			a.isOnGround = true;
		}
		if (normal.y < -0.5) {
			b.isOnGround = true;
		}
	};
};
// Функция для проверки нажатия на сенсорные кнопки
function checkTouchButtons(x, y, isPressed) {
	// Проверяем, включена ли обработка сенсорного ввода
	if (!Game.helper.enableTouchInput || !Game.helper.enableDrawing)
		return false;
	// Проверяем все сенсорные кнопки
	for (const btnId in inputState.devices[0].touchButtons) {
		const btn = inputState.devices[0].touchButtons[btnId];
		if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
			// Обновляем состояние кнопки
			btn.isPressed = isPressed;
			inputState.devices[0].keys[btn.keyCode] = isPressed;
			if (isPressed) {
				inputState.devices[0].pressKeys[btn.keyCode] = true
			}
			return true; // Прерываем обработку, так как нажатие было на кнопку
		}
	}
	return false
}
// Функция для добавления сенсорной кнопки
Game.addTouchButton = function (id, x, y, width, height, keyCode) {
	inputState.devices[0].touchButtons[id] = {
		x: x,
		y: y,
		width: width,
		height: height,
		keyCode: keyCode,
		isPressed: false
	}
};
/**
 * Получает номер тайла по координатам в тайловой сетке
 * @param {number} x Координата X в тайлах (не в пикселях)
 * @param {number} y Координата Y в тайлах (не в пикселях)
 * @returns {number} Номер тайла или 0, если координаты вне сетки или тайл отсутствует
 */
Game.getTileInXY = function (x, y) {
	// Проверяем, инициализирована ли тайловая система
	if (!Game.helper.tiles.grid || y < 0 || y >= Game.helper.tiles.rows || x < 0 || x >= Game.helper.tiles.cols) {
		return 0
	}
	return Game.helper.tiles.grid[y][x] || 0
};
/**
 * Изменяет тайл в указанных координатах тайловой сетки
 * @param {number} x Координата X в тайлах (не в пикселях)
 * @param {number} y Координата Y в тайлах (не в пикселях)
 * @param {number} tileId Номер нового тайла (0 для удаления тайла)
 * @param {boolean} isSolid Определяет, должен ли тайл быть твердым
 */
Game.changeTileInXY = function (x, y, tileId, isSolid) {
	// Проверяем, инициализирована ли тайловая система
	if (!Game.helper.tiles.grid || y < 0 || y >= Game.helper.tiles.rows || x < 0 || x >= Game.helper.tiles.cols) {
		return
	}
	// Устанавливаем новый тайл
	Game.helper.tiles.grid[y][x] = tileId;
	// Обновляем данные о тайле
	if (tileId > 0) {
		if (!Game.helper.tiles.tilesData[tileId]) {
			Game.helper.tiles.tilesData[tileId] = {}
		}
		Game.helper.tiles.tilesData[tileId].solid = isSolid
	}
};
// Функция для удаления сенсорной кнопки
Game.removeTouchButton = function (id) {
	if (inputState.devices[0].touchButtons[id]) {
		// Сбрасываем состояние кнопки, если она была нажата
		if (inputState.devices[0].touchButtons[id].isPressed) {
			inputState.devices[0].keys[inputState.devices[0].touchButtons[id].keyCode] = false
		}
		delete inputState.devices[0].touchButtons[id]
	}
};
// Функции для работы с изображениями
Draw.loadImage = function (n, str) {
	if (n < 1024) {
		let img = new Image;
		img.src = str;
		image_array[n] = -1; // Устанавливаем -1 для изображения в процессе загрузки
		img.onload = function () {
			image_array[n] = img
		};
		return n
	}
	return -1; // Возвращаем -1 при ошибке
};
Draw.text = function (x, y, size, colour, str) {
	// Настраиваем стиль текста
	ctx.font = `${size}px PressStart2P, monospace`;
	ctx.fillStyle = colour;
	ctx.textAlign = "left";
	ctx.textBaseline = "top"; // выравнивание по верхнему краю
	ctx.imageSmoothingEnabled = false; // отключаем сглаживание (если поддерживается)
	// Смещение на 0.5 пикселя для резкости (убирает размытие)
	const pixelPerfectX = Math.floor(x - Game.screenx) + .5;
	const pixelPerfectY = Math.floor(y - Game.screeny) + .5;
	// Рисуем текст
	ctx.fillText(str, pixelPerfectX, pixelPerfectY)
};
// Вспомогательная функция: конвертация hex в RGB
function hexToRgb(hex) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return [r, g, b]
}
Draw.plot = function (x, y, colour) {
	ctx.fillStyle = colour;
	ctx.fillRect(x - Game.screenx, y - Game.screeny, 1, 1)
};
Draw.line = function (x1, y1, x2, y2, color) {
	ctx.beginPath();
	ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
	ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
	ctx.strokeStyle = color;
	ctx.stroke()
};
Draw.triangle = function (x1, y1, x2, y2, x3, y3, color) {
	ctx.beginPath();
	ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
	ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
	ctx.lineTo(x3 - Game.screenx, y3 - Game.screeny);
	ctx.closePath();
	ctx.strokeStyle = color;
	ctx.stroke()
};
Draw.filledTriangle = function (x1, y1, x2, y2, x3, y3, color) {
	ctx.beginPath();
	ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
	ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
	ctx.lineTo(x3 - Game.screenx, y3 - Game.screeny);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill()
};
Draw.rect = function (x, y, width, height, color) {
	ctx.strokeStyle = color;
	ctx.strokeRect(x - Game.screenx, y - Game.screeny, width, height)
};
Draw.filledRect = function (x, y, width, height, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x - Game.screenx, y - Game.screeny, width, height)
};
Draw.sprite = function (sprite, x, y, size, colour) {
	ctx.fillStyle = colour;
	if (size && size < 1) {
		size = 1
	}
	for (let i = 0; i < sprite.length; i++) {
		for (let j = 0; j < sprite[i].length; j++) {
			if (sprite[i][j] != 0) {
				ctx.fillRect(x + j * size - Game.screenx, y + i * size - Game.screeny, size, size)
			}
		}
	}
};
Draw.image = function (n, x, y, width, height, alpha, srcX, srcY, srcWidth, srcHeight) {
    let img = image_array[n];
    if (img !== -1 && img !== 0) {
        // Сохраняем текущее состояние контекста
        ctx.save();
        
        // Устанавливаем прозрачность, если параметр alpha задан
        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }
        
        if (srcX !== undefined && srcY !== undefined && srcWidth !== undefined && srcHeight !== undefined) {
            // Рисуем часть изображения
            ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
        } else {
            // Рисуем все изображение
            ctx.drawImage(img, x, y, width, height);
        }
        
        // Восстанавливаем состояние контекста
        ctx.restore();
    }
};
Draw.clear_screen = function (color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1280, 720)
};
// Объект для работы с касаниями
Game.getTouch = {
	istouch: 0,
	x: 0,
	y: 0
};
// Функции управления игрой
Game.setGravity = function (v) {
	gravitation = v
};
Game.collision = function g_collision(x1, y1, width1, height1, x2, y2, width2, height2) {
	return Math.max(x1, x2) <= Math.min(x1 + width1, x2 + width2) && Math.max(y1, y2) <= Math.min(y1 + height1, y2 + height2)
};
Game.getKey = function (key, id) {
	// Проверяем корректность id устройства
	if (id !== 0 && id !== 1)
		return false;

	// Проверяем существование устройства и его keys
	if (!inputState.devices[id] || !inputState.devices[id].keys)
		return false;

	// Возвращаем состояние или false если ключа нет (но его всегда должно быть благодаря инициализации)
	return !!inputState.devices[id].keys[key];
};
Game.getKeyPress = function (key, id) {
	if (id !== 0 && id !== 1)
		return false;
	if (!inputState.devices[id] || !inputState.devices[id].pressKeys)
		return false;

	const pressed = !!inputState.devices[id].pressKeys[key];
	if (pressed) {
		inputState.devices[id].pressKeys[key] = false;
	}
	return pressed;
};
Game.getAxes = function (n, id) {
	if (inputState.hasGamepad) {
		// С геймпадом
		if (id === 0 && inputState.devices[0].axes && n >= 0 && n < inputState.devices[0].axes.length) {
			return inputState.devices[0].axes[n] || 0; // Геймпад
		}
		if (id === 1 && inputState.devices[1].axes && n >= 0 && n < inputState.devices[1].axes.length) {
			return inputState.devices[1].axes[n] || 0; // Клавиатура
		}
	} else {
		// Без геймпада
		if (id === 0 && inputState.devices[0].axes && n >= 0 && n < inputState.devices[0].axes.length) {
			return inputState.devices[0].axes[n] || 0; // Клавиатура
		}
	}
	return 0;
};
Game.setScreenX = function (x) {
	Game.screenx = x
};
Game.setScreenY = function (y) {
	Game.screeny = y
};
Game.getScreenX = function () {
	return Game.screenx
};
Game.getScreenY = function () {
	return Game.screeny
};
Game.setTimeout = function (callback, delay) {
	if (delay < 0)
		delay = 0;
	var timerId = Game.duc_helper_global_game_timers.nextId++;
	var triggerTime = Date.now() + delay;
	Game.duc_helper_global_game_timers.timers[timerId] = {
		callback: callback,
		time: triggerTime,
		isInterval: false
	};
	return timerId
};
// Улучшенный setInterval
Game.setInterval = function (callback, interval) {
	if (interval < 0)
		interval = 0;
	var timerId = Game.duc_helper_global_game_timers.nextId++;
	var nextTime = Date.now() + interval;
	var wrappedCallback = function () {
		callback();
		if (interval > 0) { // Не планируем следующий вызов для interval=0
			Game.duc_helper_global_game_timers.timers[timerId].time = Date.now() + interval
		}
	};
	Game.duc_helper_global_game_timers.timers[timerId] = {
		callback: wrappedCallback,
		time: nextTime,
		isInterval: true,
		interval: interval
	};
	return timerId
};
// Функции очистки
Game.clearTimeout = Game.clearInterval = function (timerId) {
	if (Game.duc_helper_global_game_timers[timerId]) {
		delete Game.duc_helper_global_game_timers.timers[timerId]
	}
};
Game.clearInterval = function (timerId) {
	if (Game.duc_helper_global_game_timers[timerId]) {
		delete Game.duc_helper_global_game_timers.timers[timerId]
	}
};
Game.Background = {
	sprite: -1,
	mode: 0, // 0 - stretch, 1 - tile
	x: 0,
	y: 0
};
// Функции для работы с фоном
Game.setBackground = function (sprite, mode) {
	Game.Background.sprite = sprite;
	Game.Background.mode = mode || 0
};
Game.setBackgroundXY = function (x, y) {
	Game.Background.x = x;
	Game.Background.y = y
};
// Функция отрисовки фона
Game.drawBackground = function () {
	if (Game.Background.sprite < 0 || Game.Background.sprite >= 1024 || !image_array[Game.Background.sprite])
		return;
	const bgImage = image_array[Game.Background.sprite];
	if (Game.Background.mode === 0) {
		// Режим растяжения
		ctx.drawImage(bgImage, 0, 0, 1280, 720)
	} else {
		// Режим плитки
		const startX = Game.Background.x % bgImage.width;
		const startY = Game.Background.y % bgImage.height;
		for (let y = -bgImage.height; y < 720; y += bgImage.height) {
			for (let x = -bgImage.width; x < 1280; x += bgImage.width) {
				ctx.drawImage(bgImage, x - startX, y - startY, bgImage.width, bgImage.height)
			}
		}
	}
}
// Функции работы с игровыми объектами;
Game.addObject = function (name, x, y, width, height, sprite) {
	var obj = {
		name: name,
		x: x,
		y: y,
		width: width,
		height: height,
		// Свойства анимации
		_sprite: null, // внутреннее хранилище для спрайта
		currentFrame: 0,
		frameTime: 0,
		animationSpeed: 10, // кадров в секунду
		animationLoop: true,
		isAnimationPlaying: false,
		isAnimationEnd: false,
		// Остальные свойства...
		speedx: 0,
		speedy: 0,
		onCollision: function () {},
		onStep: function () {},
		boundingWidth: width,
		boundingHeight: height,
		visible: 1,
		solid: 1,
		angle: 0,
		flip: 0,
		mass: 1,
		restitution: .5,
		isStatic: 0,
		isOnGround: 0,
		zIndex: 0,
		collisionShape: 0,
		collidingTiles: [],
		local: {},
		persistentContacts: {
			top: {
				count: 0,
				tile: null
			},
			right: {
				count: 0,
				tile: null
			},
			bottom: {
				count: 0,
				tile: null
			},
			left: {
				count: 0,
				tile: null
			}
		},
		minPersistentFrames: 3, // Минимальное количество кадров для "устойчивого" контакта
		isStuck: false // Флаг "залипания" к поверхности
	};
	// Добавляем методы анимации
	obj.playAnimation = function () {
		if (Array.isArray(this._sprite)) {
			this.isAnimationPlaying = true;
			this.currentFrame = 0;
			this.frameTime = 0;
			this.isAnimationEnd = false;
		}
	};
	obj.stopAnimation = function () {
		this.isAnimationPlaying = false;
		this.isAnimationEnd = true;
	};
	obj.setAnimationFrame = function (frameIndex) {
		if (Array.isArray(this._sprite)) {
			this.currentFrame = Math.max(0, Math.min(frameIndex, this._sprite.length - 1))
		}
	};
	// Сеттер для свойства sprite
	Object.defineProperty(obj, "sprite", {
		get: function () {
			return this._sprite
		},
		set: function (value) {
			this._sprite = value;
			if (Array.isArray(value)) {
				this.playAnimation(); // Автоматический запуск анимации
			} else {
				this.stopAnimation(); // Остановка анимации для статичного спрайта
			}
		},
		enumerable: true,
		configurable: true
	});
	// Устанавливаем начальный спрайт (вызовет сеттер)
	obj.sprite = sprite;
	Game.allObject.push(obj);
	return obj
};
Game.removeObject = function (obj) {
	function findObjectIndex(arr, obj) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === obj) {
				return i
			}
		}
		return -1
	}
	const index = findObjectIndex(Game.allObject, obj);
	if (index !== -1) {
		Game.allObject.splice(index, 1)
	}
};
Game.mirrorObject = function (o) {
	var no = JSON.parse(JSON.stringify(o));
	no.onCollision = o.onCollision;
	no.onStep = o.onStep;
	Game.allObject.push(no);
	return no
};
Game.setVelocityTowards = function (obj1, x, y, speed) {
	const dx = x - obj1.x;
	const dy = y - obj1.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance > 0) {
		obj1.speedx = dx / distance * speed;
		obj1.speedy = dy / distance * speed
	} else {
		obj1.speedx = 0;
		obj1.speedy = 0
	}
};
Game.exitScreen = function (o) {
	return o.x + o.width - Game.screenx < 0 || o.y + o.height - Game.screeny < 0 || o.x - Game.screenx > 1280 || o.y - Game.screeny > 720
};
Game.distance = function (x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy)
};
// Функция воспроизведения музыки
var globalAudioCtx = new(window.AudioContext || window.webkitAudioContext);
// Очередь и активные мелодии
const MAX_CONCURRENT_MELODIES = 8;
let activeMelodies = 0;
const melodyQueue = [];
Game.play_music = function (melodyString, bpm = 120) {
	if (!melodyString || typeof melodyString !== "string") {
		console.error("Invalid melodyString:", melodyString);
		return
	}
	if (globalAudioCtx.state === "suspended") {
		globalAudioCtx.resume().then(() => {
			Game._continuePlayMusic(melodyString, bpm)
		})
	} else {
		Game._continuePlayMusic(melodyString, bpm)
	}
};
Game._continuePlayMusic = function (melodyString, bpm) {
	if (activeMelodies >= MAX_CONCURRENT_MELODIES) {
		melodyQueue.push({
			melodyString: melodyString,
			bpm: bpm
		});
		return
	}
	activeMelodies++;
	Game._playMelody(melodyString, bpm)
};
Game.play_sound = function (id) {
	const audio = new Audio(Game.sound_array[id].data);
	audio.play()
};
// Внутренняя функция для реального воспроизведения
Game._playMelody = function (melodyString, bpm) {
	// Проверяем, не закрыт ли контекст
	if (globalAudioCtx.state === "closed") {
		globalAudioCtx = new(window.AudioContext || window.webkitAudioContext)
	}
	// Проверяем, не приостановлен ли контекст
	if (globalAudioCtx.state === "suspended") {
		globalAudioCtx.resume().then(() => {
			_continueMelodyPlayback()
		})
	} else {
		_continueMelodyPlayback()
	}
	if (typeof melodyString !== "string" || !/^(\d+,)*\d+$/.test(melodyString)) {
		console.error("Invalid melody string format");
		activeMelodies--;
		Game._checkQueue(); // Проверяем очередь, если была ошибка
		return
	}
	function _continueMelodyPlayback() {
		const steps = melodyString.split(",").map(Number);
		const totalSteps = steps.length;
		if (totalSteps === 0) {
			activeMelodies--;
			Game._checkQueue();
			return
		}
		const instruments = [{
				name: "C4",
				freq: 261.63,
				type: "square"
			}, {
				name: "D4",
				freq: 293.66,
				type: "square"
			}, {
				name: "E4",
				freq: 329.63,
				type: "square"
			}, {
				name: "F4",
				freq: 349.23,
				type: "square"
			}, {
				name: "G4",
				freq: 392,
				type: "square"
			}, {
				name: "A4",
				freq: 440,
				type: "square"
			}, {
				name: "B4",
				freq: 493.88,
				type: "square"
			}, {
				name: "C5",
				freq: 523.25,
				type: "square"
			}, {
				name: "Kick",
				type: "drum",
				drumType: "kick"
			}, {
				name: "Snare",
				type: "drum",
				drumType: "snare"
			}, {
				name: "HiHat",
				type: "drum",
				drumType: "hihat"
			}, {
				name: "Clap",
				type: "drum",
				drumType: "clap"
			}, {
				name: "Tom",
				type: "drum",
				drumType: "tom"
			}
		];
		const stepDuration = 60 / bpm / 2;
		let currentTime = globalAudioCtx.currentTime + .1;
		// Воспроизведение нот и ударных (как в исходном коде)
		for (let step = 0; step < totalSteps; step++) {
			const stepValue = steps[step];
			for (let i = 0; i < instruments.length; i++) {
				if (stepValue & 1 << i) {
					const instrument = instruments[i];
					if (instrument.type === "drum") {
						playDrum(instrument.drumType, currentTime)
					} else {
						playNote(instrument.freq, currentTime, instrument.type)
					}
				}
			}
			currentTime += stepDuration
		}
		// После завершения всей мелодии освобождаем слот
		const totalDuration = stepDuration * totalSteps;
		setTimeout(() => {
			activeMelodies--;
			Game._checkQueue(); // Проверяем очередь на наличие ожидающих мелодий
		}, totalDuration * 1e3 + 100);
		// Функции playNote и playDrum (с очисткой!)
		function playNote(freq, startTime, waveType) {
			const oscillator = globalAudioCtx.createOscillator();
			const gainNode = globalAudioCtx.createGain();
			oscillator.type = waveType || "square";
			oscillator.frequency.value = freq;
			gainNode.gain.setValueAtTime(.1, startTime);
			gainNode.gain.exponentialRampToValueAtTime(.001, startTime + stepDuration * .9);
			oscillator.connect(gainNode);
			gainNode.connect(globalAudioCtx.destination);
			oscillator.start(startTime);
			oscillator.stop(startTime + stepDuration);
			// Очистка после завершения
			oscillator.onended = () => {
				oscillator.disconnect();
				gainNode.disconnect()
			}
		}
		function playDrum(type, startTime) {
			const bufferSource = globalAudioCtx.createBufferSource();
			const gainNode = globalAudioCtx.createGain();
			const duration = .2;
			const buffer = globalAudioCtx.createBuffer(1, globalAudioCtx.sampleRate * duration, globalAudioCtx.sampleRate);
			const data = buffer.getChannelData(0);
			switch (type) {
			case "kick":
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					data[i] = Math.sin(t * 50 * Math.PI * 2) * Math.exp(-t * 10)
				};
				break;
			case "snare":
				for (let i = 0; i < data.length; i++) {
					data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * .1))
				};
				break;
			case "hihat":
				for (let i = 0; i < data.length; i++) {
					data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * .02))
				};
				break;
			case "clap":
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					if (t < .02 || t > .03 && t < .05 || t > .06 && t < .08) {
						data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20)
					}
				};
				break;
			case "tom":
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					data[i] = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 5)
				};
				break
			}
			gainNode.gain.setValueAtTime(.5, startTime);
			gainNode.gain.exponentialRampToValueAtTime(.001, startTime + duration);
			bufferSource.buffer = buffer;
			bufferSource.connect(gainNode);
			gainNode.connect(globalAudioCtx.destination);
			bufferSource.start(startTime);
			bufferSource.stop(startTime + duration);
			// Очистка после завершения
			bufferSource.onended = () => {
				bufferSource.disconnect();
				gainNode.disconnect()
			}
		}
	}
};
// Проверка очереди и запуск следующей мелодии
Game._checkQueue = function () {
	if (melodyQueue.length > 0 && activeMelodies < MAX_CONCURRENT_MELODIES) {
		const nextMelody = melodyQueue.shift();
		Game._playMelody(nextMelody.melodyString, nextMelody.bpm)
	}
};
Game.getMemory = function () {
	return getApproximateMemoryUsage(Game.allObject) + getApproximateMemoryUsage(image_array) + (Blockly.JavaScript.workspaceToCode(workspace)?.length * 2 || 0)
};
Game.reset = function() {
    // Проверяем, открыто ли окно Game.alert
    if (Game.alert.isOpen) {
        // Если открыто, устанавливаем обработчик на закрытие
        Game.alert.onClose = function() {
            // Удаляем обработчик
            delete Game.alert.onClose;
            // Вызываем сброс после закрытия
            Game._resetInternal();
			Game.init();
        };
        return;
    }
    
    // Если alert не открыт, сбрасываем сразу
    Game._resetInternal();
	Game.init();
};

// Внутренняя функция сброса
Game._resetInternal = function() {
    // Очистка таймеров
    game_helper_timers.length = 0;
    
    // Очистка всех игровых объектов
    Game.allObject.length = 0;
    Game._isPaused = false;
    Game.pauseTime = 0;
    Game.pausedTimers = {};
    Game.Particles.clear();
    
    // Сброс изображений (но сохраняем загруженные)
    for (let i = 0; i < image_array.length; i++) {
        if (image_array[i] === -1) { // Если изображение в процессе загрузки
            image_array[i] = -1; // Сбрасываем
        }
        // Загруженные изображения (объекты Image) не сбрасываем
    }
    
    // Сброс состояния ввода
    Game.resetInputDevices();
    Game.duc_helper_global_game_timers = {
        nextId: 1,
        timers: {},
        pending: [],
        length: 0,
        lengthAvg: 0,
        timerHistory: [],
        lastSampleTime: 0
    };
    
    // Сброс состояния касаний
    Game.virtualGamepad.touches = {};
    
    // Сброс кнопок геймпада
    Game.virtualGamepad.buttons.forEach(btn => {
        btn.active = false
    });
    Game.virtualGamepad.dpad.buttons.forEach(btn => {
        btn.active = false
    });
    
    // Сброс тайловой системы
    if (Game.helper.tiles) {
        Game.helper.tiles.grid = [];
        Game.helper.tiles.cols = 0;
        Game.helper.tiles.rows = 0;
        Game.helper.tiles.tilesData = {}
    }
    
    // Сброс звуков
    Game.sound_array.length = 0;
    
    // Сброс позиции камеры
    Game.screenx = 0;
    Game.screeny = 0;
    
    // Сброс гравитации
    gravitation = 0;
    
    // Сброс состояния касаний
    Game.getTouch.istouch = 0;
    Game.getTouch.x = 0;
    Game.getTouch.y = 0;
    
    // Остановка всей музыки
    if (globalAudioCtx.state !== "closed") {
        globalAudioCtx.close().catch(e => console.error("Error closing audio context:", e))
    }
    
    // Очистка очереди мелодий
    melodyQueue.length = 0;
    activeMelodies = 0;
    
    // Сброс отладочной панели
    if (objectsDebugPanel) {
        objectsDebugPanel.update()
    }
    
    // Сброс флагов отладки
    draw_bounding_box = false;
    debugShowExpandedObjectsBorder = true;
	Game.alert.close();
	Game.alert.isOpen = false;
	Game.loop = {};
};
// Виртуальный геймпад (стиль Nintendo Switch)
Game.virtualGamepad = {
	buttons: [{
			id: "KeyB",
			x: 1150,
			y: 600,
			r: 30,
			color: "#e61919",
			text: "B",
			active: false
		}, // Красный (правая верхняя)
		{
			id: "KeyA",
			x: 1200,
			y: 550,
			r: 30,
			color: "#2dcd2d",
			text: "A",
			active: false
		}, // Зеленый (правая нижняя)
		{
			id: "KeyY",
			x: 1100,
			y: 550,
			r: 30,
			color: "#f5f518",
			text: "Y",
			active: false
		}, // Желтый (левая нижняя)
		{
			id: "KeyX",
			x: 1150,
			y: 500,
			r: 30,
			color: "#3a3aff",
			text: "X",
			active: false
		}
	],
	dpad: {
		x: 100,
		y: 550,
		size: 100,
		buttons: [{
				id: "ArrowUp",
				x: 0,
				y: -35,
				w: 30,
				h: 35,
				active: false
			}, {
				id: "ArrowDown",
				x: 0,
				y: 35,
				w: 30,
				h: 35,
				active: false
			}, {
				id: "ArrowLeft",
				x: -35,
				y: 0,
				w: 35,
				h: 30,
				active: false
			}, {
				id: "ArrowRight",
				x: 35,
				y: 0,
				w: 35,
				h: 30,
				active: false
			}
		]
	},
	joystickLeft: {
		x: 100, // Adjust position as needed
		y: 300,
		r: 50,
		active: false,
		touchId: null,
		handle: {
			x: 0,
			y: 0,
			r: 20
		}
	},
	joystickRight: {
		x: 1150, // Adjust position as needed
		y: 300,
		r: 50,
		active: false,
		touchId: null,
		handle: {
			x: 0,
			y: 0,
			r: 20
		}
	},
	touches: {}
};
// Функция обновления состояния сенсорного ввода
Game.updateSensorKey = function () {
	if (!Game.helper.enableDrawing || !Game.helper.enableTouchInput)
		return;
	// Функция для обновления состояния кнопки с учетом ремаппинга
	function updateButtonState(button, active) {
		if (button.active !== active) {
			button.active = active;

			// Обновляем состояние оригинальной и ремаппированной клавиши
			if (active && !inputState.devices[0].keys[button.id])
				inputState.devices[0].pressKeys[button.id] = true;
			inputState.devices[0].keys[button.id] = active;
		}
	}

	// Отрисовка виртуального геймпада
	function drawGamepad() {
		// Кнопки ABXY (раскладка Switch)
		Game.virtualGamepad.buttons.forEach(btn => {
			// Внешний круг
			ctx.beginPath();
			ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
			ctx.fillStyle = btn.active ? "#fff" : btn.color;
			ctx.fill();
			// Внутренний круг
			ctx.beginPath();
			ctx.arc(btn.x, btn.y, btn.r - 8, 0, Math.PI * 2);
			ctx.fillStyle = btn.active ? btn.color : "#fff";
			ctx.fill();
			// Буква кнопки
			ctx.fillStyle = btn.active ? "#fff" : btn.color;
			ctx.font = "bold 20px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(btn.text, btn.x, btn.y);
		});

		// D-Pad
		ctx.save();
		ctx.translate(Game.virtualGamepad.dpad.x, Game.virtualGamepad.dpad.y);
		// Центр D-Pad
		ctx.beginPath();
		ctx.arc(0, 0, 15, 0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.dpad.buttons.some(b => b.active) ? "#fff" : "#777";
		ctx.fill();
		// Кнопки D-Pad
		Game.virtualGamepad.dpad.buttons.forEach(btn => {
			ctx.fillStyle = btn.active ? "#fff" : "#777";
			ctx.beginPath();
			ctx.lineTo(btn.x - btn.w / 2, btn.y - btn.h / 2);
			ctx.lineTo(btn.x + btn.w / 2, btn.y - btn.h / 2);
			ctx.lineTo(btn.x + btn.w / 2, btn.y + btn.h / 2);
			ctx.lineTo(btn.x - btn.w / 2, btn.y + btn.h / 2);
			ctx.closePath();
			ctx.fill();
			// Стрелки
			ctx.fillStyle = btn.active ? "#000" : "#fff";
			ctx.font = "20px Arial";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			let arrow = "";
			if (btn.id === "ArrowUp")
				arrow = "↑";
			if (btn.id === "ArrowDown")
				arrow = "↓";
			if (btn.id === "ArrowLeft")
				arrow = "←";
			if (btn.id === "ArrowRight")
				arrow = "→";
			ctx.fillText(arrow, btn.x, btn.y);
		});
		ctx.restore();

		// Left joystick
		ctx.beginPath();
		ctx.arc(Game.virtualGamepad.joystickLeft.x, Game.virtualGamepad.joystickLeft.y, Game.virtualGamepad.joystickLeft.r, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
		ctx.fill();
		ctx.strokeStyle = "#aaa";
		ctx.lineWidth = 2;
		ctx.stroke();
		// Left joystick handle
		ctx.beginPath();
		ctx.arc(
			Game.virtualGamepad.joystickLeft.x + Game.virtualGamepad.joystickLeft.handle.x,
			Game.virtualGamepad.joystickLeft.y + Game.virtualGamepad.joystickLeft.handle.y,
			Game.virtualGamepad.joystickLeft.handle.r,
			0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.joystickLeft.active ? "#e60012" : "#e61919";
		ctx.fill();
		ctx.strokeStyle = "#c00";
		ctx.lineWidth = 2;
		ctx.stroke();

		// Right joystick
		ctx.beginPath();
		ctx.arc(Game.virtualGamepad.joystickRight.x, Game.virtualGamepad.joystickRight.y, Game.virtualGamepad.joystickRight.r, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
		ctx.fill();
		ctx.strokeStyle = "#aaa";
		ctx.lineWidth = 2;
		ctx.stroke();
		// Right joystick handle
		ctx.beginPath();
		ctx.arc(
			Game.virtualGamepad.joystickRight.x + Game.virtualGamepad.joystickRight.handle.x,
			Game.virtualGamepad.joystickRight.y + Game.virtualGamepad.joystickRight.handle.y,
			Game.virtualGamepad.joystickRight.handle.r,
			0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.joystickRight.active ? "#e60012" : "#e61919";
		ctx.fill();
		ctx.strokeStyle = "#c00";
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	// Обновление состояния осей стиков с учетом ремаппинга
	function updateStickAxes(joystick, axisXIndex, axisYIndex, prefix) {
		const x = joystick.handle.x / joystick.r;
		const y = joystick.handle.y / joystick.r;

		inputState.devices[0].axes[axisXIndex] = x;
		inputState.devices[0].axes[axisYIndex] = y;

		// Обновляем состояния клавиш для стиков с учетом ремаппинга
		const stickKeys = {
			Left: `Key${prefix}StickLeft`,
			Right: `Key${prefix}StickRight`,
			Up: `Key${prefix}StickUp`,
			Down: `Key${prefix}StickDown`
		};

		// Очищаем предыдущие состояния
		for (const key in stickKeys) {
			const originalKey = stickKeys[key];

			inputState.devices[0].keys[originalKey] = false;
		}

		// Обновляем текущие состояния
		if (x < -0.5) {
			const originalKey = stickKeys.Left;
			inputState.devices[0].keys[originalKey] = true;
		} else if (x > 0.5) {
			const originalKey = stickKeys.Right;
			inputState.devices[0].keys[originalKey] = true;
		}

		if (y < -0.5) {
			const originalKey = stickKeys.Up;
			inputState.devices[0].keys[originalKey] = true;
		} else if (y > 0.5) {
			const originalKey = stickKeys.Down;
			inputState.devices[0].keys[originalKey] = true;
		}
	}

	// Обновляем состояния осей для джойстиков
	if (Game.virtualGamepad.joystickLeft.active) {
		updateStickAxes(Game.virtualGamepad.joystickLeft, 0, 1, "L");
	}

	if (Game.virtualGamepad.joystickRight.active) {
		updateStickAxes(Game.virtualGamepad.joystickRight, 2, 3, "R");
	}

	// Отрисовка геймпада
	drawGamepad();
};
Game.drawDebugCollisionShape = function (obj) {
	const shape = Game.getCollisionShape(obj);
	ctx.save();
	ctx.strokeStyle = "#0ff";
	ctx.lineWidth = 2;

	if (shape.type === 'rectangle') {
		if (shape.angle === 0) {
			// Простой прямоугольник без вращения
			ctx.strokeRect(
				shape.x - Game.screenx,
				shape.y - Game.screeny,
				shape.width,
				shape.height);
		} else {
			// Повернутый прямоугольник
			const centerX = shape.x + shape.width / 2 - Game.screenx;
			const centerY = shape.y + shape.height / 2 - Game.screeny;

			ctx.translate(centerX, centerY);
			ctx.rotate(shape.angle * Math.PI / 180);
			ctx.strokeRect(
				-shape.width / 2,
				-shape.height / 2,
				shape.width,
				shape.height);
		}
	} else if (shape.type === 'circle') {
		ctx.beginPath();
		ctx.arc(
			shape.x - Game.screenx,
			shape.y - Game.screeny,
			shape.radius,
			0,
			Math.PI * 2);
		ctx.stroke();

		// Линия к центру объекта для ориентации
		ctx.beginPath();
		ctx.moveTo(shape.x - Game.screenx, shape.y - Game.screeny);
		ctx.lineTo(
			obj.x + obj.width / 2 - Game.screenx,
			obj.y + obj.height / 2 - Game.screeny);
		ctx.stroke();
	}

	ctx.restore();
};
// Инициализация сенсорного ввода
Game.initSensorInput = function () {
	// Проверка попадания в треугольную кнопку D-Pad
	function checkDPadHit(x, y, btn) {
		const centerX = Game.virtualGamepad.dpad.x;
		const centerY = Game.virtualGamepad.dpad.y;
		const btnX = centerX + btn.x;
		const btnY = centerY + btn.y;
		if (btn.id === "ArrowUp") {
			return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
			y <= btnY + btn.h / 2 && y >= centerY - Game.virtualGamepad.dpad.size / 2;
		}
		if (btn.id === "ArrowDown") {
			return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
			y >= btnY - btn.h / 2 && y <= centerY + Game.virtualGamepad.dpad.size / 2;
		}
		if (btn.id === "ArrowLeft") {
			return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
			x <= btnX + btn.w / 2 && x >= centerX - Game.virtualGamepad.dpad.size / 2;
		}
		if (btn.id === "ArrowRight") {
			return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
			x >= btnX - btn.w / 2 && x <= centerX + Game.virtualGamepad.dpad.size / 2;
		}
		return false;
	}

	// Обновленная функция для обновления состояния кнопки с учетом ремаппинга
	function updateButtonState(button, active) {
		if (button.active !== active) {
			button.active = active;

			// Получаем ремаппированную клавишу
			const mappedKey = Game.helper.keyRemapping[button.id] || button.id;

			// Обновляем состояние оригинальной клавиши
			if (active && !inputState.devices[0].keys[button.id])
				inputState.devices[0].pressKeys[button.id] = true;
			inputState.devices[0].keys[button.id] = active;

		}
	}

	// Обновление положения джойстика с учетом ремаппинга
	function updateJoystick(joystick, x, y, axisXIndex, axisYIndex, prefix) {
		let dx = x - joystick.x;
		let dy = y - joystick.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance > joystick.r) {
			dx = dx * joystick.r / distance;
			dy = dy * joystick.r / distance;
		}

		joystick.handle.x = dx;
		joystick.handle.y = dy;

		// Обновляем оси
		inputState.devices[0].axes[axisXIndex] = dx / joystick.r;
		inputState.devices[0].axes[axisYIndex] = dy / joystick.r;

		// Обновляем состояния клавиш для стиков с учетом ремаппинга
		const stickKeys = {
			Left: `Key${prefix}StickLeft`,
			Right: `Key${prefix}StickRight`,
			Up: `Key${prefix}StickUp`,
			Down: `Key${prefix}StickDown`
		};

		// Очищаем предыдущие состояния
		for (const key in stickKeys) {
			const originalKey = stickKeys[key];

			inputState.devices[0].keys[originalKey] = false;
		}

		// Обновляем текущие состояния
		if (dx < -joystick.r * 0.5) {
			const originalKey = stickKeys.Left;
			inputState.devices[0].keys[originalKey] = true;
		} else if (dx > joystick.r * 0.5) {
			const originalKey = stickKeys.Right;
			inputState.devices[0].keys[originalKey] = true;
		}

		if (dy < -joystick.r * 0.5) {
			const originalKey = stickKeys.Up;
			inputState.devices[0].keys[originalKey] = true;
		} else if (dy > joystick.r * 0.5) {
			const originalKey = stickKeys.Down;
			inputState.devices[0].keys[originalKey] = true;
		}
	}
	// Получение координат с учетом масштабирования canvas
	function getCanvasCoordinates(clientX, clientY) {
		if (!Game.helper.enableTouchInput)
			return {
				x: 0,
				y: 0
			};
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (clientX - rect.left) * scaleX,
			y: (clientY - rect.top) * scaleY
		}
	}
	// Обработка начала касания
	function handleStart(x, y, id) {
		// Проверка кнопок ABXY
		for (const btn of Game.virtualGamepad.buttons) {
			if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
				updateButtonState(btn, true);
				Game.virtualGamepad.touches[id] = {
					type: "button",
					button: btn
				};
				return
			}
		}
		// Проверка D-Pad
		for (const btn of Game.virtualGamepad.dpad.buttons) {
			if (checkDPadHit(x, y, btn)) {
				updateButtonState(btn, true);
				Game.virtualGamepad.touches[id] = {
					type: "dpad",
					button: btn
				};
				return
			}
		}
		// Проверка левого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
			Game.virtualGamepad.joystickLeft.active = true;
			Game.virtualGamepad.joystickLeft.touchId = id;
			updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1);
			Game.virtualGamepad.touches[id] = {
				type: "joystickLeft"
			};
			return
		}
		// Проверка правого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
			Game.virtualGamepad.joystickRight.active = true;
			Game.virtualGamepad.joystickRight.touchId = id;
			updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3);
			Game.virtualGamepad.touches[id] = {
				type: "joystickRight"
			};
			return
		}
	}
	// Обработчики мыши
	canvas.addEventListener("mousedown", e => {
		const {
			x,
			y
		} = getCanvasCoordinates(e.clientX, e.clientY);
		handleStart(x, y, "mouse")
	});
	canvas.addEventListener("mousemove", e => {
		if (Game.virtualGamepad.joystickLeft.touchId === "mouse") {
			const {
				x,
				y
			} = getCanvasCoordinates(e.clientX, e.clientY);
			updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1)
		} else if (Game.virtualGamepad.joystickRight.touchId === "mouse") {
			const {
				x,
				y
			} = getCanvasCoordinates(e.clientX, e.clientY);
			updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3)
		}
	});
	canvas.addEventListener("mouseup", () => {
		if (Game.virtualGamepad.touches["mouse"]) {
			const touch = Game.virtualGamepad.touches["mouse"];
			if (touch.type === "button" || touch.type === "dpad") {
				updateButtonState(touch.button, false)
			} else if (touch.type === "joystickLeft") {
				Game.virtualGamepad.joystickLeft.active = false;
				Game.virtualGamepad.joystickLeft.touchId = null;
				Game.virtualGamepad.joystickLeft.handle.x = 0;
				Game.virtualGamepad.joystickLeft.handle.y = 0;
				inputState.devices[0].axes[0] = 0;
				inputState.devices[0].axes[1] = 0
			} else if (touch.type === "joystickRight") {
				Game.virtualGamepad.joystickRight.active = false;
				Game.virtualGamepad.joystickRight.touchId = null;
				Game.virtualGamepad.joystickRight.handle.x = 0;
				Game.virtualGamepad.joystickRight.handle.y = 0;
				inputState.devices[0].axes[2] = 0;
				inputState.devices[0].axes[3] = 0
			}
			delete Game.virtualGamepad.touches["mouse"]
		}
	});
	// Обработчики касаний
	canvas.addEventListener("touchstart", e => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			const {
				x,
				y
			} = getCanvasCoordinates(touch.clientX, touch.clientY);
			handleStart(x, y, touch.identifier)
		})
	});
	canvas.addEventListener("touchmove", e => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			if (Game.virtualGamepad.touches[touch.identifier]?.type === "joystickLeft") {
				const {
					x,
					y
				} = getCanvasCoordinates(touch.clientX, touch.clientY);
				updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1)
			} else if (Game.virtualGamepad.touches[touch.identifier]?.type === "joystickRight") {
				const {
					x,
					y
				} = getCanvasCoordinates(touch.clientX, touch.clientY);
				updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3)
			}
		})
	});
	canvas.addEventListener("touchend", e => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			if (Game.virtualGamepad.touches[touch.identifier]) {
				const touchData = Game.virtualGamepad.touches[touch.identifier];
				if (touchData.type === "button" || touchData.type === "dpad") {
					updateButtonState(touchData.button, false)
				} else if (touchData.type === "joystickLeft") {
					Game.virtualGamepad.joystickLeft.active = false;
					Game.virtualGamepad.joystickLeft.touchId = null;
					Game.virtualGamepad.joystickLeft.handle.x = 0;
					Game.virtualGamepad.joystickLeft.handle.y = 0;
					inputState.devices[0].axes[0] = 0;
					inputState.devices[0].axes[1] = 0
				} else if (touchData.type === "joystickRight") {
					Game.virtualGamepad.joystickRight.active = false;
					Game.virtualGamepad.joystickRight.touchId = null;
					Game.virtualGamepad.joystickRight.handle.x = 0;
					Game.virtualGamepad.joystickRight.handle.y = 0;
					inputState.devices[0].axes[2] = 0;
					inputState.devices[0].axes[3] = 0
				}
				delete Game.virtualGamepad.touches[touch.identifier]
			}
		})
	});
	Game.helper.isTouchOnGamepad = function (x, y) {
		// Проверка кнопок ABXY
		for (const btn of Game.virtualGamepad.buttons) {
			if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
				return true
			}
		}
		// Проверка D-Pad
		for (const btn of Game.virtualGamepad.dpad.buttons) {
			if (checkDPadHit(x, y, btn)) {
				return true
			}
		}
		// Проверка левого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
			return true
		}
		// Проверка правого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
			return true
		}
		return false
	}
};
Game.helper.error = function (err) {
	showSwitchModal("error", err, false, "ok");
	Game.reset();
	Game.gameLoop = function () {}
};
Game.pause = function () {
	if (this._isPaused)
		return;
	this._isPaused = true;
	this.pauseTime = Date.now();
	// Запоминаем оставшееся время для всех активных таймеров
	this.pausedTimers = {};
	for (const id in this.duc_helper_global_game_timers.timers) {
		const timer = this.duc_helper_global_game_timers.timers[id];
		this.pausedTimers[id] = {
			callback: timer.callback,
			remaining: timer.time - this.pauseTime,
			isInterval: timer.isInterval,
			interval: timer.interval
		}
	}
};
Game.resume = function () {
	if (!this._isPaused)
		return;
	this._isPaused = false;
	const resumeTime = Date.now();
	const pauseDuration = resumeTime - this.pauseTime;
	// Восстанавливаем таймеры с корректировкой времени
	for (const id in this.pausedTimers) {
		const timer = this.pausedTimers[id];
		this.duc_helper_global_game_timers.timers[id] = {
			callback: timer.callback,
			time: resumeTime + timer.remaining,
			isInterval: timer.isInterval,
			interval: timer.interval
		}
	}
	this.pausedTimers = {}
};
Game.isPaused = function () {
	return Game._isPaused != 0
}
// Инициализируем свойства паузы;
Game._isPaused = false;
Game.pauseTime = 0;
Game.pausedTimers = {};
// Инициализация сенсорного ввода при запуске игры
Game.initSensorInput();
Game.vibrate = function(duration, weakMagnitude = 0.5, strongMagnitude = 0.5) {
    // 1. Базовая вибрация (для телефонов/тач-устройств)
    if (navigator.vibrate) {
        navigator.vibrate(duration); // Просто передаем длительность
    }

    // 2. Вибрация через Gamepad API (если есть геймпад)
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (gamepad?.vibrationActuator) {
            gamepad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: Math.min(1.0, Math.max(0, weakMagnitude)), // Ограничиваем 0-1
                strongMagnitude: Math.min(1.0, Math.max(0, strongMagnitude)) // Ограничиваем 0-1
            });
        }
    }
};
Game.updateGamepadKey = function () {
	if (!inputState.hasGamepad)
		return;
	const device = inputState.devices[0]; // Геймпад всегда device 0
	const gamepads = navigator.getGamepads();
	const gamepad = gamepads[0];
	const buttonMappings = {
		0: "KeyB",
		1: "KeyA",
		2: "KeyY",
		3: "KeyX",
		4: "KeyZL",
		5: "KeyZR",
		6: "KeyL",
		7: "KeyR",
		8: "KeyMinus",
		9: "KeyPlus",
		10: "KeyLStick",
		11: "KeyRStick",
		12: "ArrowUp",
		13: "ArrowDown",
		14: "ArrowLeft",
		15: "ArrowRight"
	};

	// Обработка кнопок
	for (const[buttonIndex, originalKey]of Object.entries(buttonMappings)) {
		if (gamepad.buttons[buttonIndex]) {
			const pressed = gamepad.buttons[buttonIndex].pressed;

			if (pressed && !device.keys[originalKey]) {
				device.pressKeys[originalKey] = true; // Пресс-клавиши для геймпада
			}

			device.keys[originalKey] = pressed;
			device.pressButton[buttonIndex] = pressed;
		}
	}

	// Обработка осей стиков (устройство 0)
	if (gamepad.axes.length >= 4) {
		const deadZone = 0.1;
		inputState.devices[0].axes[0] = Math.abs(gamepad.axes[0]) > deadZone ? gamepad.axes[0] : 0;
		inputState.devices[0].axes[1] = Math.abs(gamepad.axes[1]) > deadZone ? gamepad.axes[1] : 0;
		inputState.devices[0].axes[2] = Math.abs(gamepad.axes[2]) > deadZone ? gamepad.axes[2] : 0;
		inputState.devices[0].axes[3] = Math.abs(gamepad.axes[3]) > deadZone ? gamepad.axes[3] : 0;
	}
};
// Основной игровой цикл
function game_loop(timestamp) {
	requestAnimationFrame(game_loop);
	document.getElementById("debug").innerText = '';

	// Рассчитываем helper.deltaTime (в секундах)
	if (!Game.helper.lastFrameTime)
		Game.helper.lastFrameTime = timestamp;
	Game.helper.deltaTime = (timestamp - Game.helper.lastFrameTime) / 1000;
	Game.helper.lastFrameTime = timestamp;

	// Ограничиваем helper.deltaTime для избежания "прыжков" при долгих паузах
	if (Game.helper.deltaTime > 0.1 || isNaN(Game.helper.deltaTime))
		Game.helper.deltaTime = 0.1;
	// Всегда обновляем ввод, даже во время паузы
	Game.updateGamepadKey();
	if (Game._isPaused) {
		Game.updateGamepadKey();
		if (Game.gameLoop) {
			Game.gameLoop(); // Для отрисовки меню паузы
		}
		if (Game.helper.enableTouchInput && Game.helper.enableDrawing) {
			Game.updateSensorKey(); // Обработка сенсорных кнопок
		}
		return; // Пропускаем всю остальную логику
	}
	function sortObjectsByY() {
		if (!Game.allObject || !Array.isArray(Game.allObject)) {
			return []
		}
		const sortedObjects = [...Game.allObject];
		sortedObjects.sort((a, b) => {
			const aSum = (Number(a.y) || 0) + (Number(a.zIndex) || 0);
			const bSum = (Number(b.y) || 0) + (Number(b.zIndex) || 0);
			return aSum - bSum
		});
		return sortedObjects
	}
	if (Game.gameLoop && !Game.helper.pause) {
		if (typeof objectsDebugPanel !== "undefined")
			objectsDebugPanel.update();
		Game.updateGamepadKey();
		Game.gameLoop();
		Game.drawBackground();
		Game.helper.drawTiles();
		Game.Particles.update();
		//твймеры
		var now = Date.now();
		var timers = Game.duc_helper_global_game_timers.timers;
		var pending = Game.duc_helper_global_game_timers.pending;
		// 1. Собираем таймеры для выполнения
		for (var id in timers) {
			if (timers.hasOwnProperty(id) && now >= timers[id].time) {
				pending.push({
					id: parseInt(id),
					callback: timers[id].callback,
					isInterval: timers[id].isInterval
				});
				// Удаляем одноразовые таймеры
				if (!timers[id].isInterval) {
					delete timers[id]
				}
			}
		}
		Game.duc_helper_global_game_timers.length = pending.length;
		// Обновляем историю для вычисления среднего значения
		if (now - Game.duc_helper_global_game_timers.lastSampleTime >= 100) { // Обновляем каждые 100мс
			Game.duc_helper_global_game_timers.timerHistory.push({
				time: now,
				count: Object.keys(timers).length + pending.length
			});
			Game.duc_helper_global_game_timers.lastSampleTime = now;
			// Удаляем старые записи (старше 1 секунды)
			while (Game.duc_helper_global_game_timers.timerHistory.length > 0 && now - Game.duc_helper_global_game_timers.timerHistory[0].time > 1e3) {
				Game.duc_helper_global_game_timers.timerHistory.shift()
			}
			// Вычисляем среднее значение
			if (Game.duc_helper_global_game_timers.timerHistory.length > 0) {
				var total = Game.duc_helper_global_game_timers.timerHistory.reduce(function (sum, entry) {
					return sum + entry.count
				}, 0);
				Game.duc_helper_global_game_timers.lengthAvg = Math.round(total / Game.duc_helper_global_game_timers.timerHistory.length)
			}
		}
		// 2. Выполняем собранные колбэки
		for (var i = 0; i < pending.length; i++) {
			try {
				pending[i].callback()
			} catch (e) {
				console.error("Timer error:", e)
			}
			// Удаляем интервалы с interval=0 (чтобы не росли бесконечно)
			if (pending[i].isInterval) {
				var id = pending[i].id;
				if (timers[id] && timers[id].interval === 0) {
					delete timers[id]
				}
			}
		}
		// 3. Очищаем очередь выполненных
		pending.length = 0;
		//конец таймеров
		for (var i = 0; i < Game.allObject.length; i++) {
			var o = Game.allObject[i];
			if (o.isStatic == 0 && !o.isOnGround) {
				o.speedy += gravitation * Game.helper.deltaTime * 60;
			}

			// Применяем helper.deltaTime к движению
			o.x += o.speedx * Game.helper.deltaTime * 60;
			o.y += o.speedy * Game.helper.deltaTime * 60;

			o.isOnGround = 0;
			if (o.solid) {
				Game.checkTileCollision(o)
			}
			if (o.speedx > 30)
				o.speedx = 30;
			else if (o.speedx < -30)
				o.speedx = -30;
			if (o.speedy > 30)
				o.speedy = 30;
			else if (o.speedy < -30)
				o.speedy = -30;
			for (var j = i + 1; j < Game.allObject.length; j++) {
				var b = Game.allObject[j];
				const resolution = Game.checkCollision(o, b);
				if (resolution.collides) {
					if (o.solid != 0 && b.solid != 0) {
						//console.log(`Resolving collision: ${o.name} (solid=${o.solid}) vs ${b.name} (solid=${b.solid})`);
						Game.resolveCollision(o, b, resolution)
					}
					if (o.onCollision)
						o.onCollision(b);
					if (b.onCollision)
						b.onCollision(o)
				}
			}
		}
		const sortedArray = sortObjectsByY();
		for (var i = 0; i < sortedArray.length; i++) {
			var o = sortedArray[i];
			if (o.visible && o.isAnimationPlaying && Array.isArray(o.sprite)) {
				o.frameTime += Game.helper.deltaTime; // Используем helper.deltaTime вместо фиксированного значения
				const frameDuration = 1 / o.animationSpeed;
				while (o.frameTime >= frameDuration) {
					o.frameTime -= frameDuration;
					o.currentFrame++;
					if (o.currentFrame >= o.sprite.length) {
						if (o.animationLoop) {
							o.currentFrame = 0;
						} else {
							o.currentFrame = o.sprite.length - 1;
							o.isAnimationPlaying = false;
							o.isAnimationEnd = true;
						}
					}
				}
			}
			if (o.visible) {
				ctx.save();
				ctx.translate(o.x + o.width / 2 - Game.screenx, o.y + o.height / 2 - Game.screeny);
				ctx.rotate(o.angle * Math.PI / 180);
				const SDL_FLIP_NONE = 0;
				const SDL_FLIP_HORIZONTAL = 1;
				const SDL_FLIP_VERTICAL = 2;
				const flipHorz = (o.flip & SDL_FLIP_HORIZONTAL) !== 0;
				const flipVert = (o.flip & SDL_FLIP_VERTICAL) !== 0;
				if (flipHorz || flipVert) {
					const scaleX = flipHorz ? -1 : 1;
					const scaleY = flipVert ? -1 : 1;
					ctx.scale(scaleX, scaleY)
				}
				const spriteToDraw = Array.isArray(o.sprite) ? o.sprite[o.currentFrame] : o.sprite;
				Draw.image(spriteToDraw, -o.width / 2, -o.height / 2, o.width, o.height, o.visible);
				// Отрисовка зеленой рамки для раскрытых объектов
				if (debugShowExpandedObjectsBorder && objectsDebugPanel && objectsDebugPanel.isObjectExpanded(o)) {
					ctx.save();
					ctx.strokeStyle = "#0f0";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.rect(-o.width / 2, -o.height / 2, o.width, o.height);
					ctx.stroke();
					ctx.fillStyle = "#0f0";
					ctx.font = "12px Arial";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(o.name || "Unnamed", 0, 0);
					ctx.restore()
				}
				ctx.restore();
				if (draw_bounding_box) {
					Game.drawDebugCollisionShape(o);
				}
				if (o.onStep)
					o.onStep()
			}
		}
		Game.Particles.draw();
		if (Game.helper.enableTouchInput) {
			Game.updateSensorKey()
		}
	}
	const allKeys = new Set([
				...Object.keys(Game.helper.keyRemapping),
				...Object.values(Game.helper.keyRemapping)
			]);

	for (let i = 0; i < inputState.devices.length; i++) {
		if (!inputState.devices[i] || !inputState.devices[i].pressKeys)
			continue;

		for (const key of allKeys) {
			if (key in inputState.devices[i].pressKeys) {
				inputState.devices[i].pressKeys[key] = false;
			}
		}
	}
	if (Game.helper.showGamepadButtons) {
        drawGamepadButtonsPreview();
    }
}
// Инициализация игры
Game.initEngine();
game_loop();
function initObjectsDebugPanel() {
	const container = document.getElementById("objectsList");
	if (!container) {
		console.error('Элемент с id="objectsList" не найден');
		return
	}
	container.style.overflowY = "auto";
	container.style.backgroundColor = "rgba(40, 40, 40, 0.9)";
	container.style.color = "#e0e0e0";
	container.style.fontFamily = "monospace";
	container.style.fontSize = "13px";
	container.style.width = 0;
	container.style.opacity = 0;
	const expandedStates = new Map;
	const objectElements = new Map;
	let lastObjectCount = 0;
	// Создаем элемент для отображения счетчика
	const counterElement = document.createElement("div");
	counterElement.style.padding = "6px 8px";
	counterElement.style.background = "#222";
	counterElement.style.borderBottom = "1px solid #444";
	counterElement.style.fontWeight = "bold";
	counterElement.style.position = "sticky";
	counterElement.style.top = "0";
	counterElement.style.zIndex = "1";
	container.appendChild(counterElement);
	// Маппинг стандартных параметров объекта на переводы
	const PARAM_TRANSLATIONS = {
		x: Blockly.Msg["OBJECT_PARAM_X"],
		y: Blockly.Msg["OBJECT_PARAM_Y"],
		width: Blockly.Msg["OBJECT_PARAM_WIDTH"],
		height: Blockly.Msg["OBJECT_PARAM_HEIGHT"],
		speedx: Blockly.Msg["OBJECT_PARAM_SPEEDX"],
		speedy: Blockly.Msg["OBJECT_PARAM_SPEEDY"],
		visible: Blockly.Msg["OBJECT_PARAM_VISIBLE"],
		name: Blockly.Msg["OBJECT_PARAM_NAME"],
		local: Blockly.Msg["OBJECT_PARAM_LOCAL"],
		solid: Blockly.Msg["OBJECT_PARAM_SOLID"],
		angle: Blockly.Msg["OBJECT_PARAM_ANGLE"],
		flip: Blockly.Msg["OBJECT_PARAM_FLIP"],
		mass: Blockly.Msg["OBJECT_PARAM_MASS"],
		restitution: Blockly.Msg["OBJECT_PARAM_RESTITUTION"],
		isStatic: Blockly.Msg["OBJECT_PARAM_ISSTATIC"],
		zIndex: Blockly.Msg["OBJECT_PARAM_ZINDEX"],
		isOnGround: Blockly.Msg["OBJECT_PARAM_ISONGROUND"],
		currentFrame: Blockly.Msg['OBJECT_PARAM_FRAME'],
		isAnimationEnd: Blockly.Msg['OBJECT_PARAM_ANIMATION_PLAY']
	};
	function getObjectId(obj, index) {
		if (!obj.__debugId) {
			obj.__debugId = `obj_${index};_${Date.now()};_${Math.random().toString(36).substr(2,6)};`
		}
		return obj.__debugId
	}
	function createObjectElement(obj, id) {
		const element = document.createElement("div");
		element.className = "debug-object";
		element.dataset.objId = id;
		element.style.marginBottom = "8px";
		element.style.border = "1px solid #444";
		element.style.overflow = "hidden";
		const isExpanded = expandedStates.get(id) || false;
		const header = document.createElement("div");
		header.className = "debug-object-header";
		header.style.padding = "6px 8px";
		header.style.background = "#333";
		header.style.display = "flex";
		header.style.justifyContent = "space-between";
		header.style.alignItems = "center";
		header.style.cursor = "pointer";
		header.style.userSelect = "none";
		const nameSpan = document.createElement("span");
		nameSpan.style.color = "#6af";
		nameSpan.textContent = obj.name || `Object ${id.split("_")[1]};`;
		const arrowSpan = document.createElement("span");
		arrowSpan.className = "debug-object-arrow";
		arrowSpan.style.fontSize = "10px";
		arrowSpan.textContent = isExpanded ? "▼" : "▶";
		header.appendChild(nameSpan);
		header.appendChild(arrowSpan);
		const details = document.createElement("div");
		details.className = "debug-object-details";
		details.style.padding = "8px";
		details.style.background = "#2a2a2a";
		details.style.borderTop = "1px solid #444";
		updateObjectDetails(details, obj);
		element.appendChild(header);
		element.appendChild(details);
		header.addEventListener("click", e => {
			const newState = !(expandedStates.get(id) || false);
			expandedStates.set(id, newState);
			if (newState) {
				details.classList.add("expanded")
			} else {
				details.classList.remove("expanded")
			}
			arrowSpan.textContent = newState ? "▼" : "▶";
			e.stopPropagation()
		});
		return element
	}
	function updateObjectDetails(container, obj) {
		container.innerHTML = ''; // Очищаем содержимое контейнера

		// Получаем список разрешённых ключей из PARAM_TRANSLATIONS
		const allowedKeys = Object.keys(PARAM_TRANSLATIONS);

		// Фильтруем и сортируем пары [ключ, значение]
		const filteredAndSortedEntries = Object.entries(obj)
			.filter(([key]) => allowedKeys.includes(key)) // Оставляем только разрешённые
			.sort(([a], [b]) => a.localeCompare(b));       // Сортируем по ключу

		filteredAndSortedEntries.forEach(([key, value]) => {
			const paramDiv = document.createElement('div');
			paramDiv.style.padding = '2px 0';
			paramDiv.style.fontSize = '12px';
			paramDiv.style.borderBottom = '1px solid #555';

			// Определяем цвет в зависимости от типа значения (как в оригинале)
			let color = '#ffffff'; // По умолчанию белый
			if (typeof value === 'number') {
				color = '#4caf50'; // Зеленый для чисел
			} else if (typeof value === 'boolean') {
				color = '#2196f3'; // Синий для булевых
			} else if (typeof value === 'string') {
				color = '#ff9800'; // Оранжевый для строк
			} else if (typeof value === 'function') {
				color = '#9c27b0'; // Фиолетовый для функций
			} else if (value === null) {
				color = '#9e9e9e'; // Серый для null
			} else if (Array.isArray(value)) {
				color = '#e91e63'; // Розовый для массивов
			}

			// Получаем переведенное имя параметра из PARAM_TRANSLATIONS
			// key - это оригинальное имя (например, "x"), displayName - переведенное
			const displayName = PARAM_TRANSLATIONS[key] || key; // На случай, если перевод отсутствует

			// Имя параметра (светло-серый)
			const keySpan = document.createElement('span');
			keySpan.textContent = displayName + ': '; // Используем переведенное имя
			keySpan.style.color = '#bbbbbb';

			// Значение параметра (с цветом по типу)
			const valueSpan = document.createElement('span');
			valueSpan.style.color = color;
			// Для функций показываем упрощенное представление
			if (typeof value === 'function') {
				valueSpan.textContent = '[Function]';
			} else {
				// Используем JSON.stringify для красивого отображения объектов и массивов
				try {
					valueSpan.textContent = JSON.stringify(value);
				} catch (e) {
					// Если stringify не удался, показываем toString
					valueSpan.textContent = String(value);
				}
			}

			paramDiv.appendChild(keySpan);
			paramDiv.appendChild(valueSpan);
			container.appendChild(paramDiv);
		});
	}
	function updateObjectsList() {
		if (!Game.allObject)
			return;
		if (!Game.helper.debug)
			return;
		const currentObjects = Game.allObject;
		const currentCount = currentObjects.length;
		// Обновляем счетчик объектов
		counterElement.textContent = `Objects: ${currentCount}; Timers: ${Game.duc_helper_global_game_timers.length} (avg: ${Game.duc_helper_global_game_timers.lengthAvg})`;
		// Очищаем expandedStates от удаленных объектов
		const currentIds = new Set;
		currentObjects.forEach((obj, index) => {
			const id = getObjectId(obj, index);
			currentIds.add(id)
		});
		// Удаляем состояния для объектов, которых больше нет
		expandedStates.forEach((_, id) => {
			if (!currentIds.has(id)) {
				expandedStates.delete(id)
			}
		});
		// Сохраняем текущие состояния перед обновлением
		const prevExpandedStates = new Map(expandedStates);
		const prevObjectElements = new Map(objectElements);
		if (currentCount === lastObjectCount) {
			// Обновляем только существующие элементы
			currentObjects.forEach((obj, index) => {
				const id = getObjectId(obj, index);
				const element = objectElements.get(id);
				if (element) {
					const nameSpan = element.querySelector(".debug-object-header span:first-child");
					if (nameSpan)
						nameSpan.textContent = obj.name || `Object ${index};`;
					const details = element.querySelector(".debug-object-details");
					if (details && expandedStates.get(id)) {
						updateObjectDetails(details, obj)
					}
				}
			});
			return
		}
		// Полная перерисовка при изменении количества объектов
		// Сохраняем счетчик и очищаем остальное содержимое
		const children = Array.from(container.children);
		children.forEach(child => {
			if (child !== counterElement) {
				container.removeChild(child)
			}
		});
		objectElements.clear();
		currentObjects.forEach((obj, index) => {
			const id = getObjectId(obj, index);
			const wasExpanded = prevExpandedStates.get(id) || false;
			expandedStates.set(id, wasExpanded);
			const element = createObjectElement(obj, id);
			container.appendChild(element);
			objectElements.set(id, element);
			// Восстанавливаем состояние раскрытия
			if (wasExpanded) {
				const details = element.querySelector(".debug-object-details");
				details.classList.add("expanded");
				const arrow = element.querySelector(".debug-object-arrow");
				if (arrow)
					arrow.textContent = "▼"
			}
		});
		lastObjectCount = currentCount
	}
	function isObjectExpanded(obj) {
		const id = obj.__debugId;
		return id ? expandedStates.get(id) : false
	}
	Game.helper.debug = false;
	updateObjectsList();
	return {
		update: updateObjectsList,
		isObjectExpanded: isObjectExpanded,
		getExpandedStates: () => expandedStates,
		getObjectElements: () => objectElements
	}
}
const objectsDebugPanel = initObjectsDebugPanel();
