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
var inputState = {};
var local = {};
var Draw = {};
var Game = {
	allObject: [],
	sound_array: [],
	screenx: 0,
	screeny: 0,
	gravitation: 0,
	enableDrawing: false,
	enableTouchInput: false,
	helper: {
		pause: false
	}
};

// Основной объект Game
Game.init = function () {
	// Инициализация массива изображений
	for (let i = 0; i < 1024; i++) {
		image_array[i] = -1; // Используем -1 для отсутствия изображения
	};

	Game.helper.tiles = {
		grid: [],
		cols: 0,
		rows: 0,
		tileSize: 32,
		sprite: -1, // Используем -1 для отсутствия тайлсета
		tilesData: {}
		// Объект для хранения данных о тайлах (solid и других параметров)
	};

	// Инициализация состояния ввода
	inputState = {
		keys: {},
		pressKeys: {},
		mouseButtons: {},
		axes: [],
		// Новое поле для хранения состояния касаний кнопок
		touchButtons: {}
	};

	// Обработчики событий клавиатуры
	document.addEventListener('keydown', (e) => {
		if (!inputState.keys[e.code]) {
			inputState.pressKeys[e.code] = true;
		};
		inputState.keys[e.code] = true;
	});

	document.addEventListener('keyup', (e) => {
		inputState.keys[e.code] = false;
	});

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
					Draw.image(
						sprite,
						x,
						y,
						tileSize,
						tileSize,
						(tileValue - 1) % (image_array[sprite].width / tileSize) * tileSize,
						Math.floor((tileValue - 1) / (image_array[sprite].width / tileSize)) * tileSize,
						tileSize,
						tileSize);
				};
			};
		};
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
		const bgColor = 'rgb(50, 50, 50)';
		const borderColor = 'rgb(100, 100, 100)';
		const textColor = 'rgb(255, 255, 255)';
		const btnColor = 'rgb(70, 130, 200)';
		const btnPressedColor = 'rgb(40, 90, 150)';
		const btnCancelColor = 'rgb(80, 80, 80)';
		const dimColor = 'rgba(0, 0, 0, 0.7)';
		const scrollbarColor = 'rgb(120, 120, 120)';
		const scrollbarHandleColor = 'rgb(180, 180, 180)';

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

		// Устанавливаем шрифт PressStart2P
		const fontStyle = `${fontSize}px PressStart2P`;
		const titleFontStyle = `${titleFontSize}px PressStart2P`;

		// Функция для измерения ширины текста
		function measureTextWidth(text, font) {
			ctx.save();
			ctx.font = font;
			const width = ctx.measureText(text).width;
			ctx.restore();
			return width;
		};

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
			const cancelText = "Отмена";
			const cancelBtnWidth = Math.max(100, measureTextWidth(cancelText, fontStyle) + btnPadding);
			const cancelBtnX = primaryBtnX - btnSpacing - cancelBtnWidth;
			cancelBtnRect = {
				x: cancelBtnX,
				y: modalY + modalHeight - padding - btnHeight,
				w: cancelBtnWidth,
				h: btnHeight
			};
		};

		// Функция для переноса текста
		function wrapText(text, maxWidth) {
			const words = text ? text.toString().split(' ') : [];
			const lines = [];
			let currentLine = words[0] || '';

			for (let i = 1; i < words.length; i++) {
				const word = words[i];
				const testLine = currentLine + ' ' + word;
				const testWidth = measureTextWidth(testLine, fontStyle);

				if (testWidth <= maxWidth) {
					currentLine = testLine;
				} else {
					lines.push(currentLine);
					currentLine = word;
				};
			};

			if (currentLine) {
				lines.push(currentLine);
			};

			return lines;
		};

		// Рассчитываем максимальный скролл
		const messageAreaWidth = modalWidth - 2 * padding - 10; // -10 для скроллбара
		const messageLines = wrapText(message, messageAreaWidth);
		const messageAreaHeight = modalHeight - 3 * padding - titleFontSize - btnHeight - 10;
		maxScrollOffset = Math.max(0, messageLines.length * lineHeight - messageAreaHeight);

		// Функция отрисовки модального окна
		function renderModal() {
			// Очищаем канвас (рисуем полупрозрачный оверлей)
			ctx.fillStyle = dimColor;
			ctx.fillRect(0, 0, 1280, 720);

			// Рисуем модальное окно (без закруглений)
			ctx.fillStyle = bgColor;
			ctx.strokeStyle = borderColor;
			ctx.lineWidth = 2;
			ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
			ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

			// Рисуем заголовок
			ctx.fillStyle = 'rgb(40, 40, 40)';
			ctx.fillRect(modalX, modalY, modalWidth, titleFontSize + padding * 2);

			ctx.fillStyle = textColor;
			ctx.font = titleFontStyle;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(title, modalX + modalWidth / 2, modalY + padding + titleFontSize / 2);

			// Область сообщения с обрезкой
			ctx.save();
			ctx.beginPath();
			ctx.rect(modalX + padding, modalY + titleFontSize + padding * 2, messageAreaWidth, messageAreaHeight);
			ctx.clip();

			// Рисуем текст сообщения
			ctx.fillStyle = textColor;
			ctx.font = fontStyle;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			let y = modalY + titleFontSize + padding * 2 - scrollOffset;
			for (const line of messageLines) {
				ctx.fillText(line, modalX + padding, y);
				y += lineHeight;
			};

			ctx.restore();

			// Рисуем скроллбар если нужно
			if (maxScrollOffset > 0) {
				const scrollbarX = modalX + modalWidth - padding - 6;
				const scrollbarY = modalY + titleFontSize + padding * 2;

				// Трек скроллбара
				ctx.fillStyle = scrollbarColor;
				ctx.fillRect(scrollbarX, scrollbarY, 6, messageAreaHeight);

				// Ползунок
				const scrollRatio = scrollOffset / maxScrollOffset;
				const handleHeight = Math.max(20, messageAreaHeight * (messageAreaHeight / (maxScrollOffset + messageAreaHeight)));
				const handleY = scrollbarY + scrollRatio * (messageAreaHeight - handleHeight);

				ctx.fillStyle = scrollbarHandleColor;
				ctx.fillRect(scrollbarX + 1, handleY, 4, handleHeight);
			};

			// Рисуем кнопки
			function drawButton(rect, text, isPressed, isCancel = false) {
				ctx.fillStyle = isCancel ?
					(isPressed ? 'rgb(60, 60, 60)' : btnCancelColor) :
					(isPressed ? btnPressedColor : btnColor);

				// Кнопка без закруглений
				ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

				ctx.fillStyle = textColor;
				ctx.font = fontStyle;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2);
			};

			if (showCancel) {
				drawButton(cancelBtnRect, "Отмена", cancelBtnPressed, true);
			};
			drawButton(primaryBtnRect, primaryBtnText, primaryBtnPressed);
		};

		// Функция для преобразования координат мыши в координаты канваса
		function getCanvasCoordinates(clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			return {
				x: (clientX - rect.left) * scaleX,
				y: (clientY - rect.top) * scaleY
			};
		}

		// Обработка событий
		function handleMouseDown(clientX, clientY) {
			const pos = getCanvasCoordinates(clientX, clientY);
			const x = pos.x;
			const y = pos.y;

			// Проверяем скроллбар
			if (maxScrollOffset > 0) {
				const scrollbarX = modalX + modalWidth - padding - 6;
				const scrollbarY = modalY + titleFontSize + padding * 2;
				if (x >= scrollbarX && x <= scrollbarX + 6 &&
					y >= scrollbarY && y <= scrollbarY + messageAreaHeight) {
					isDragging = true;
					dragStartY = y;
					startScrollOffset = scrollOffset;
					return;
				};
			};

			// Проверяем кнопки
			if (showCancel && isPointInRect(x, y, cancelBtnRect)) {
				cancelBtnPressed = true;
				return;
			};

			if (isPointInRect(x, y, primaryBtnRect)) {
				primaryBtnPressed = true;
			};
		};

		function handleMouseUp(clientX, clientY) {
			if (isDragging) {
				isDragging = false;
				return;
			};

			const pos = getCanvasCoordinates(clientX, clientY);
			const x = pos.x;
			const y = pos.y;

			if (primaryBtnPressed && isPointInRect(x, y, primaryBtnRect)) {
				modalClosed = true;
				modalResult = true;
			};

			if (cancelBtnPressed && showCancel && isPointInRect(x, y, cancelBtnRect)) {
				modalClosed = true;
				modalResult = false;
			};

			primaryBtnPressed = false;
			cancelBtnPressed = false;
		};

		function handleMouseMove(clientX, clientY) {
			if (isDragging) {
				const pos = getCanvasCoordinates(clientX, clientY);
				const y = pos.y;

				const dy = y - dragStartY;
				const scrollableHeight = messageAreaHeight * (1 - messageAreaHeight / (maxScrollOffset + messageAreaHeight));
				scrollOffset = startScrollOffset + (dy / scrollableHeight) * maxScrollOffset;
				scrollOffset = Math.max(0, Math.min(scrollOffset, maxScrollOffset));
				dragStartY = y;
			}
		};

		function isPointInRect(x, y, rect) {
			return x >= rect.x && x <= rect.x + rect.w &&
			y >= rect.y && y <= rect.y + rect.h;
		};

		// Основной цикл модального окна
		let modalPromise;
		let resolvePromise;

		modalPromise = new Promise((resolve) => {
			resolvePromise = resolve;

			function modalLoop() {
				if (modalClosed) {
					// Удаляем обработчики событий
					canvas.removeEventListener('mousedown', mouseDownHandler);
					canvas.removeEventListener('mouseup', mouseUpHandler);
					canvas.removeEventListener('mousemove', mouseMoveHandler);

					// Восстанавливаем состояние канваса
					ctx.restore();
					resolve(modalResult);
					Game.helper.pause = false;
					return;
				};

				renderModal();
				requestAnimationFrame(modalLoop);
			};

			// Обработчики событий
			function mouseDownHandler(e) {
				handleMouseDown(e.clientX, e.clientY);
			};

			function mouseUpHandler(e) {
				handleMouseUp(e.clientX, e.clientY);
			};

			function mouseMoveHandler(e) {
				handleMouseMove(e.clientX, e.clientY);
			};

			// Добавляем обработчики событий
			canvas.addEventListener('mousedown', mouseDownHandler);
			canvas.addEventListener('mouseup', mouseUpHandler);
			canvas.addEventListener('mousemove', mouseMoveHandler);

			// Запускаем цикл
			modalLoop();
		});

		// Добавляем метод для закрытия окна
		Game.alert.close = function (result = false) {
			if (!modalClosed) {
				modalClosed = true;
				modalResult = result;
				if (resolvePromise) {
					resolvePromise(result);
				}
			}
		};

		return modalPromise;
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
			clientY = event.clientY - rect.top;
		}
		// Для событий касания
		else if (event.touches && event.touches[0]) {
			clientX = event.touches[0].clientX - rect.left;
			clientY = event.touches[0].clientY - rect.top;
		} else {
			return null;
		};

		// Масштабируем координаты к логическому размеру 1280x720
		return {
			x: clientX * scaleX,
			y: clientY * scaleY
		};
	};

	// Обработчики касаний/кликов
	function handleInteraction(event) {
		event.preventDefault();
		const pos = getPosition(event);
		if (pos) {
			// Проверка нажатия на сенсорные кнопки перед обработкой обычного касания
			if (!Game.helper.isTouchOnGamepad(pos.x, pos.y)) {
				Game.getTouch.istouch = 1;
				Game.getTouch.x = pos.x;
				Game.getTouch.y = pos.y;
			};
		};
	};

	function handleMove(event) {
		event.preventDefault();
		const pos = getPosition(event);
		if (pos && Game.getTouch.istouch) {
			Game.getTouch.x = pos.x;
			Game.getTouch.y = pos.y;
		};
	};

	function handleEnd(event) {
		event.preventDefault();
		// Проверяем, было ли это отпускание кнопки
		const pos = getPosition(event);
		if (pos) {
			checkTouchButtons(pos.x, pos.y, false);
		};
		Game.getTouch.istouch = 0;
	};

	// Добавление обработчиков событий
	canvas.addEventListener('mousedown', handleInteraction);
	canvas.addEventListener('mousemove', handleMove);
	canvas.addEventListener('mouseup', handleEnd);
	canvas.addEventListener('mouseleave', handleEnd);
	canvas.addEventListener('touchstart', handleInteraction);
	canvas.addEventListener('touchmove', handleInteraction);
	canvas.addEventListener('touchend', handleEnd);
	canvas.addEventListener('touchcancel', handleEnd);

	// Обработчики геймпада
	window.addEventListener('gamepadconnected', (event) => {
		console.log('✅ 🎮 A gamepad was connected:', event.gamepad);
	});

	window.addEventListener('gamepaddisconnected', (event) => {
		console.log('❌ 🎮 A gamepad was disconnected:', event.gamepad);
	});

	// Класс Vector2 для работы с 2D векторами
	class Vector2 {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		};

		static rotate(v, angle, result = new Vector2(0, 0)) {
			const cos_a = Math.cos(angle);
			const sin_a = Math.sin(angle);
			const x = v.x * cos_a - v.y * sin_a;
			const y = v.x * sin_a + v.y * cos_a;
			result.x = x;
			result.y = y;
			return result;
		};

		normalize() {
			const len_sq = this.x * this.x + this.y * this.y;
			if (len_sq > 0) {
				const inv_len = 1 / Math.sqrt(len_sq);
				this.x *= inv_len;
				this.y *= inv_len;
			};
			return this;
		};

		static dot(v1, v2) {
			return v1.x * v2.x + v1.y * v2.y;
		};

		add(other) {
			return new Vector2(this.x + other.x, this.y + other.y);
		};

		static add(v1, v2) {
			return new Vector2(v1.x + v2.x, v1.y + v2.y);
		};

		sub(other) {
			return new Vector2(this.x - other.x, this.y - other.y);
		};

		multiply(scalar) {
			return new Vector2(this.x * scalar, this.y * scalar);
		};
	};

	function getCornersBounds(corners) {
		let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
		for (const v of corners) {
			minX = Math.min(minX, v.x);
			maxX = Math.max(maxX, v.x);
			minY = Math.min(minY, v.y);
			maxY = Math.max(maxY, v.y);
		};
		return {
			minX,
			maxX,
			minY,
			maxY
		};
	};

	function checkAABBTileCollision(obj, col, row) {
		if (row < 0 || row >= Game.helper.tiles.rows ||
			col < 0 || col >= Game.helper.tiles.cols) {
			return false;
		};

		const tileValue = Game.helper.tiles.grid[row][col];
		if (tileValue <= 0) {
			return false;
		}

		// Проверяем твердость тайла через новую систему
		const isSolid = Game.isTileSolid(col, row);
		if (!isSolid) {
			return false;
		};

		const tileSize = Game.helper.tiles.tileSize;
		const tileX = col * tileSize;
		const tileY = row * tileSize;

		// Рассчитываем проникновение по каждой оси
		const penetrationX = Math.min(
				obj.x + obj.width - tileX,
				tileX + tileSize - obj.x);
		const penetrationY = Math.min(
				obj.y + obj.height - tileY,
				tileY + tileSize - obj.y);

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
				ctx.strokeStyle = 'rgba(255,0,0,0.7)';
				ctx.lineWidth = 3;
				ctx.strokeRect(tileX - Game.screenx, tileY - Game.screeny, tileSize, tileSize);
				ctx.stroke();
				ctx.restore();
			};

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
				};
			} else {
				// Коллизия по Y оси
				if (obj.y + obj.height / 2 < tileY + tileSize / 2) {
					// Столкновение с верхней стороной тайла
					obj.y = tileY - obj.height;
					obj.speedy = Math.min(obj.speedy, 0); // Гасим скорость внутрь тайла
					obj.isOnGround = true;
				} else {
					// Столкновение с нижней стороной тайла
					obj.y = tileY + tileSize;
					obj.speedy = Math.max(obj.speedy, 0); // Гасим скорость внутрь тайла
				};
			};
			return true;
		};
		return false;
	};

	function checkOBBSATTileCollision(obj, objCorners, col, row) {
		if (row < 0 || row >= Game.helper.tiles.rows ||
			col < 0 || col >= Game.helper.tiles.cols) {
			return false;
		};

		const tileValue = Game.helper.tiles.grid[row][col];
		if (tileValue <= 0) {
			return false;
		}

		// Проверяем, является ли тайл твердым
		if (!Game.isTileSolid(col, row)) {
			return false;
		};

		const tileSize = Game.helper.tiles.tileSize;
		const tileX = col * tileSize;
		const tileY = row * tileSize;

		// Углы тайла
		const tileCorners = [
			new Vector2(tileX, tileY),
			new Vector2(tileX + tileSize, tileY),
			new Vector2(tileX + tileSize, tileY + tileSize),
			new Vector2(tileX, tileY + tileSize)
		];

		// Оси для SAT (нормали ребер объекта + нормали ребер тайла)
		const axes = [];

		// Добавляем нормали объекта
		for (let i = 0; i < objCorners.length; i++) {
			const p1 = objCorners[i];
			const p2 = objCorners[(i + 1) % objCorners.length];
			const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
			const normal = new Vector2(-edge.y, edge.x).normalize();
			axes.push(normal);
		};

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
			};

			const overlap = Math.min(projObj.max, projTile.max) - Math.max(projObj.min, projTile.min);

			if (overlap < minOverlap) {
				minOverlap = overlap;
				smallestAxis = axis;
			};
		};

		// Определение направления нормали
		const centerObj = new Vector2(
				(objCorners[0].x + objCorners[2].x) / 2,
				(objCorners[0].y + objCorners[2].y) / 2);
		const centerTile = new Vector2(tileX + tileSize / 2, tileY + tileSize / 2);

		if (Vector2.dot(
				new Vector2(centerTile.x - centerObj.x, centerTile.y - centerObj.y),
				smallestAxis) < 0) {
			smallestAxis.x *= -1;
			smallestAxis.y *= -1;
		};

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
			ctx.save();
			ctx.strokeStyle = 'rgba(255,0,0,0.7)';
			ctx.strokeRect(tileX - Game.screenx, tileY - Game.screeny, tileSize, tileSize);

			// Рисуем контур объекта
			ctx.beginPath();
			ctx.moveTo(objCorners[0].x - Game.screenx, objCorners[0].y - Game.screeny);
			for (let i = 1; i <= objCorners.length; i++) {
				const p = objCorners[i % objCorners.length];
				ctx.lineTo(p.x - Game.screenx, p.y - Game.screeny);
			};
			ctx.strokeStyle = 'rgba(255,255,0,0.5)';
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.restore();
		};

		return {
			collides: true,
			normal: smallestAxis,
			overlap: minOverlap
		};
	};

	function getEdgeNormal(p1, p2) {
		const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
		return new Vector2(-edge.y, edge.x).normalize();
	};

	function resolveTileCollision(obj, collision) {
		const {
			normal,
			overlap
		} = collision;

		// Добавляем небольшой "буфер" чтобы избежать повторных коллизий
		const buffer = 0.1;

		// Коррекция позиции с буфером
		obj.x -= normal.x * (overlap + buffer);
		obj.y -= normal.y * (overlap + buffer);

		// Коррекция скорости только если объект движется в направлении тайла
		const dot = obj.speedx * normal.x + obj.speedy * normal.y;
		if (dot < 0) {
			obj.speedx -= dot * normal.x * obj.restitution;
			obj.speedy -= dot * normal.y * obj.restitution;

			// Гасим микроскорости чтобы избежать дрожания
			if (Math.abs(obj.speedx) < 0.01)
				obj.speedx = 0;
			if (Math.abs(obj.speedy) < 0.01)
				obj.speedy = 0;
		};

		// Проверка "на земле" с учетом нормали
		if (normal.y < -0.7) { // Более строгий порог
			obj.isOnGround = true;
		};
	};
	// Функции для работы с полигонами и коллизиями
	function getPolygonAxes(points) {
		const axes = [];
		for (let i = 0; i < points.length; i++) {
			const p1 = points[i];
			const p2 = points[(i + 1) % points.length];
			const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
			const normal = new Vector2(-edge.y, edge.x).normalize();
			axes.push(normal);
		};
		return axes;
	};

	function projectPolygon(axis, points) {
		let min = Vector2.dot(axis, points[0]);
		let max = min;

		for (let i = 1; i < points.length; i++) {
			const projection = Vector2.dot(axis, points[i]);
			if (projection < min)
				min = projection;
			if (projection > max)
				max = projection;
		};

		return {
			min,
			max
		};
	};

	// Функция для загрузки тайлов из массива
	Game.setTileFromArray = function (tileArray) {
		if (!Array.isArray(tileArray) || tileArray.length < 2) {
			console.error("Invalid tile array format");
			return;
		};
		
		Game.helper.tiles.tileSize = tileArray[0];
		Game.helper.tiles.cols = tileArray[1];
		Game.helper.tiles.rows = tileArray[2];
		Game.helper.tiles.grid = Array(Game.helper.tiles.rows).fill().map(() => 
			Array(Game.helper.tiles.cols).fill(0));
		Game.helper.tiles.tilesData = {}; // Для хранения дополнительных данных
		Game.helper.tiles.solidMap = {};  // Отдельная карта твердости

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
						if (row >= Game.helper.tiles.rows) break;
					};

					if (tileValue >= 16383 && tileValue <= 32765) {
						const originalId = tileValue - 16383;
						Game.helper.tiles.grid[row][col] = originalId;
						// По умолчанию тайлы с ID 16383-32765 - твердые
						Game.helper.tiles.solidMap[`${row}_${col}`] = true;
					} else {
						Game.helper.tiles.grid[row][col] = tileValue;
						// По умолчанию обычные тайлы - мягкие
						Game.helper.tiles.solidMap[`${row}_${col}`] = false;
					};
					col++;
				};
			} else {
				if (col >= Game.helper.tiles.cols) {
					col = 0;
					row++;
					if (row >= Game.helper.tiles.rows) break;
				};

				if (value >= 16383 && value <= 32765) {
					const originalId = value - 16383;
					Game.helper.tiles.grid[row][col] = originalId;
					// Тайлы с ID 16383-32765 - твердые по умолчанию
					Game.helper.tiles.solidMap[`${row}_${col}`] = true;
				} else {
					Game.helper.tiles.grid[row][col] = value;
					// Обычные тайлы - мягкие по умолчанию
					Game.helper.tiles.solidMap[`${row}_${col}`] = false;
				};
				col++;
				index++;
			};
		};
	};

	// Функция для установки спрайта тайлов
	Game.setTileImage = function (spriteNumber) {
		Game.helper.tiles.sprite = spriteNumber;
	};

	Game.isTileSolid = function (tileX, tileY) {
		if (!Game.helper.tiles.grid ||
			tileY < 0 || tileY >= Game.helper.tiles.rows ||
			tileX < 0 || tileX >= Game.helper.tiles.cols) {
			return false;
		};

		const tileValue = Game.helper.tiles.grid[tileY][tileX];
		if (tileValue <= 0) return false;

		// Проверяем карту твердости
		return Game.helper.tiles.solidMap[`${tileY}_${tileX}`] || false;
	};

	// Добавляем функцию для получения тайла в координатах
	Game.getTileAt = function (pixelX, pixelY) {
		if (!Game.helper.tiles.grid)
			return 0;

		const tileX = Math.floor(pixelX / Game.helper.tiles.tileSize);
		const tileY = Math.floor(pixelY / Game.helper.tiles.tileSize);

		if (tileY < 0 || tileY >= Game.helper.tiles.rows ||
			tileX < 0 || tileX >= Game.helper.tiles.cols) {
			return 0;
		};

		return Game.helper.tiles.grid[tileY][tileX];
	};

	// Предрасчитанные нормали для тайлов (верх, право, низ, лево)
	const TILE_NORMALS = [
		new Vector2(0, -1), // Верх
		new Vector2(1, 0), // Право
		new Vector2(0, 1), // Низ
		new Vector2(-1, 0) // Лево
	];

	Game.checkTileCollision = function (obj) {
		if (!Game.helper.tiles.grid || Game.helper.tiles.sprite === -1 || !obj.solid)
			return false;

		obj.collidingTiles = [];

		const tileSize = Game.helper.tiles.tileSize;
		let collided = false;

		if (draw_bounding_box) {
			ctx.save();
			ctx.strokeStyle = 'rgba(0,255,255,0.3)';
			ctx.lineWidth = 2;
			ctx.strokeRect(obj.x - Game.screenx, obj.y - Game.screeny, obj.width, obj.height);
			ctx.restore();
		};

		if (!obj.angle || Math.abs(obj.angle % 360) < 0.1) {
			// Оптимизированный путь для AABB
			const left = Math.floor(obj.x / tileSize);
			const right = Math.floor((obj.x + obj.width) / tileSize);
			const top = Math.floor(obj.y / tileSize);
			const bottom = Math.floor((obj.y + obj.height) / tileSize);

			for (let row = top; row <= bottom; row++) {
				for (let col = left; col <= right; col++) {
					if (checkAABBTileCollision(obj, col, row)) {
						collided = true;
					};
				};
			};
		} else {
			// Полноценная проверка для вращающихся объектов
			const angleRad = obj.angle * Math.PI / 180;
			const halfW = obj.boundingWidth / 2;
			const halfH = obj.boundingHeight / 2;
			const center = new Vector2(obj.x + obj.width / 2, obj.y + obj.height / 2); // Используем реальный центр объекта

			// Углы bounding box с учетом вращения
			const corners = [
				Vector2.add(Vector2.rotate(new Vector2(-halfW, -halfH), angleRad), center),
				Vector2.add(Vector2.rotate(new Vector2(halfW, -halfH), angleRad), center),
				Vector2.add(Vector2.rotate(new Vector2(halfW, halfH), angleRad), center),
				Vector2.add(Vector2.rotate(new Vector2(-halfW, halfH), angleRad), center)
			];

			// Определяем охватывающий прямоугольник для оптимизации
			const bounds = getCornersBounds(corners);
			const leftCol = Math.floor(bounds.minX / tileSize);
			const rightCol = Math.floor(bounds.maxX / tileSize);
			const topRow = Math.floor(bounds.minY / tileSize);
			const bottomRow = Math.floor(bounds.maxY / tileSize);

			for (let row = topRow; row <= bottomRow; row++) {
				for (let col = leftCol; col <= rightCol; col++) {
					const collision = checkOBBSATTileCollision(obj, corners, col, row);
					if (collision.collides) {
						Game.tileResolveCollision(obj, collision);
						collided = true;
					};
				};
			};
		};

		return collided;
	};

	// Функции проверки и разрешения коллизий
	Game.checkCollision = function (a, b) {
		const angle_a = a.angle * Math.PI / 180;
		const angle_b = b.angle * Math.PI / 180;

		// Используем boundingWidth и boundingHeight для расчета центра и размеров
		const center_a = new Vector2(a.x + a.width / 2, a.y + a.height / 2); // Центр остается тем же
		const center_b = new Vector2(b.x + b.width / 2, b.y + b.height / 2); // Центр остается тем же

		const half_size_a = new Vector2(a.boundingWidth / 2, a.boundingHeight / 2); // Используем bounding размеры
		const half_size_b = new Vector2(b.boundingWidth / 2, b.boundingHeight / 2); // Используем bounding размеры

		const a_points = [
			new Vector2(-half_size_a.x, -half_size_a.y),
			new Vector2(half_size_a.x, -half_size_a.y),
			new Vector2(half_size_a.x, half_size_a.y),
			new Vector2(-half_size_a.x, half_size_a.y)
		];

		const b_points = [
			new Vector2(-half_size_b.x, -half_size_b.y),
			new Vector2(half_size_b.x, -half_size_b.y),
			new Vector2(half_size_b.x, half_size_b.y),
			new Vector2(-half_size_b.x, half_size_b.y)
		];

		// Поворот и смещение точек
		for (let i = 0; i < 4; i++) {
			a_points[i] = Vector2.rotate(a_points[i], angle_a);
			a_points[i].x += center_a.x;
			a_points[i].y += center_a.y;

			b_points[i] = Vector2.rotate(b_points[i], angle_b);
			b_points[i].x += center_b.x;
			b_points[i].y += center_b.y;
		};

		// Получение осей для SAT
		const axes = [
			...getPolygonAxes(a_points),
			...getPolygonAxes(b_points)
		];

		let minOverlap = Infinity;
		let smallestAxis = new Vector2(0, 0);

		// Проверка коллизий по осям
		for (const axis of axes) {
			const projA = projectPolygon(axis, a_points);
			const projB = projectPolygon(axis, b_points);

			if (projA.max < projB.min || projB.max < projA.min) {
				return {
					collides: false
				};
			};

			const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);

			if (overlap < minOverlap) {
				minOverlap = overlap;
				smallestAxis = axis;
			};
		};

		// Определение направления нормали
		const centerDiff = new Vector2(center_b.x - center_a.x, center_b.y - center_a.y);
		if (Vector2.dot(centerDiff, smallestAxis) < 0) {
			smallestAxis = new Vector2(-smallestAxis.x, -smallestAxis.y);
		};

		return {
			collides: true,
			normal: smallestAxis,
			overlap: minOverlap
		};
	};

	Game.addObjectsFromArray = function (objectsArray) {
		for (var arrIndex = 0; arrIndex < objectsArray.length; arrIndex++) {
			var obj = objectsArray[arrIndex];
			var xyArray = obj.xy;
			var objectRef = obj.id;

			// Проверяем, существует ли объект с таким id
			if (!objectRef) {
				console.error('Object with id "' + objectRef + '" not found in window scope');
				continue; // вместо return, так как это цикл
			};

			// Проверяем, что xyArray является массивом и имеет четное количество элементов
			if (!Array.isArray(xyArray)) {
				console.error('xy property for object "' + objectRef + '" is not an array');
				continue;
			};

			if (xyArray.length % 2 !== 0) {
				console.error('xy array for object "' + objectRef + '" has odd number of elements');
				continue;
			};

			// Добавляем объекты
			for (var i = 0; i < xyArray.length; i += 2) {
				var x = xyArray[i];
				var y = xyArray[i + 1];

				// Проверяем, что координаты являются числами
				if (typeof x !== 'number' || typeof y !== 'number') {
					console.error('Invalid coordinates at position ' + i + ' for object "' + objectRef + '"');
					continue;
				};

				// Вызываем метод addObject с нужными параметрами
				var o = Game.addObject(
						objectRef.name, x, y, objectRef.width, objectRef.height, objectRef.sprite);
				for (var key in objectRef) {
					if (objectRef.hasOwnProperty(key)) {
						o[key] = objectRef[key];
					};
				};
				o.x = x;
				o.y = y;
			};
		};
	};

	Game.tileResolveCollision = function (obj, collision) {
		const {
			normal,
			overlap
		} = collision;

		// Коррекция позиции с небольшим буфером
		const buffer = 0.1;
		obj.x -= normal.x * (overlap + buffer);
		obj.y -= normal.y * (overlap + buffer);

		// Коррекция скорости
		const dot = obj.speedx * normal.x + obj.speedy * normal.y;
		if (dot < 0) {
			obj.speedx -= dot * normal.x * obj.restitution;
			obj.speedy -= dot * normal.y * obj.restitution;
		};

		// Гасим микроскорости
		if (Math.abs(obj.speedx) < 0.01)
			obj.speedx = 0;
		if (Math.abs(obj.speedy) < 0.01)
			obj.speedy = 0;

		// Проверка "на земле"
		if (normal.y < -0.7) {
			obj.isOnGround = true;
		};
	};

	Game.resolveCollision = function (a, b, collisionInfo) {
		if (a.isStatic && b.isStatic)
			return;

		const {
			normal,
			overlap
		} = collisionInfo;

		if (normal.y > 0.5) {
			a.isOnGround = 1;
		};

		// Коррекция позиции
		const correction = new Vector2(
				normal.x * overlap,
				normal.y * overlap);

		// Распределение коррекции по массам
		const totalMass = a.isStatic ? b.mass : (b.isStatic ? a.mass : a.mass + b.mass);
		const aRatio = b.isStatic ? 1 : (a.isStatic ? 0 : b.mass / totalMass);
		const bRatio = a.isStatic ? 1 : (b.isStatic ? 0 : a.mass / totalMass);

		if (!a.isStatic) {
			a.x -= correction.x * aRatio;
			a.y -= correction.y * aRatio;
		};

		if (!b.isStatic) {
			b.x += correction.x * bRatio;
			b.y += correction.y * bRatio;
		};

		// Расчет относительной скорости
		const relativeVelocity = new Vector2(
				b.speedx - a.speedx,
				b.speedy - a.speedy);

		// Скорость вдоль нормали
		const velocityAlongNormal = Vector2.dot(relativeVelocity, normal);

		if (velocityAlongNormal > 0)
			return;

		// Коэффициент упругости
		const restitution = Math.min(a.restitution, b.restitution);

		// Импульс столкновения
		let j =  - (1 + restitution) * velocityAlongNormal;
		j /= (a.isStatic ? 0 : 1 / a.mass) + (b.isStatic ? 0 : 1 / b.mass);

		// Применение импульса
		const impulse = new Vector2(normal.x * j, normal.y * j);

		if (!a.isStatic) {
			a.speedx -= impulse.x / a.mass;
			a.speedy -= impulse.y / a.mass;
		};

		if (!b.isStatic) {
			b.speedx += impulse.x / b.mass;
			b.speedy += impulse.y / b.mass;
		};
	};
};

// Функция для проверки нажатия на сенсорные кнопки
function checkTouchButtons(x, y, isPressed) {
	// Проверяем, включена ли обработка сенсорного ввода
	if (!Game.enableTouchInput)
		return false;

	// Проверяем все сенсорные кнопки
	for (const btnId in inputState.touchButtons) {
		const btn = inputState.touchButtons[btnId];
		if (x >= btn.x && x <= btn.x + btn.width &&
			y >= btn.y && y <= btn.y + btn.height) {
			// Обновляем состояние кнопки
			btn.isPressed = isPressed;
			inputState.keys[btn.keyCode] = isPressed;
			if (isPressed) {
				inputState.pressKeys[btn.keyCode] = true;
			};
			return true; // Прерываем обработку, так как нажатие было на кнопку
		};
	};
	return false;
};

// Функция для добавления сенсорной кнопки
Game.addTouchButton = function (id, x, y, width, height, keyCode) {
	inputState.touchButtons[id] = {
		x: x,
		y: y,
		width: width,
		height: height,
		keyCode: keyCode,
		isPressed: false
	};
};

/**
 * Получает номер тайла по координатам в тайловой сетке
 * @param {number} x Координата X в тайлах (не в пикселях)
 * @param {number} y Координата Y в тайлах (не в пикселях)
 * @returns {number} Номер тайла или 0, если координаты вне сетки или тайл отсутствует
 */
Game.getTileInXY = function (x, y) {
	// Проверяем, инициализирована ли тайловая система
	if (!Game.helper.tiles.grid ||
		y < 0 || y >= Game.helper.tiles.rows ||
		x < 0 || x >= Game.helper.tiles.cols) {
		return 0;
	}

	return Game.helper.tiles.grid[y][x] || 0;
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
	if (!Game.helper.tiles.grid ||
		y < 0 || y >= Game.helper.tiles.rows ||
		x < 0 || x >= Game.helper.tiles.cols) {
		return;
	}

	// Устанавливаем новый тайл
	Game.helper.tiles.grid[y][x] = tileId;

	// Обновляем данные о тайле
	if (tileId > 0) {
		if (!Game.helper.tiles.tilesData[tileId]) {
			Game.helper.tiles.tilesData[tileId] = {};
		}
		Game.helper.tiles.tilesData[tileId].solid = isSolid;
	}
};

// Функция для удаления сенсорной кнопки
Game.removeTouchButton = function (id) {
	if (inputState.touchButtons[id]) {
		// Сбрасываем состояние кнопки, если она была нажата
		if (inputState.touchButtons[id].isPressed) {
			inputState.keys[inputState.touchButtons[id].keyCode] = false;
		};
		delete inputState.touchButtons[id];
	};
};

// Функции для работы с изображениями
Draw.loadImage = function (n, str) {
	if (n < 1024) {
		let img = new Image();
		img.src = str;
		image_array[n] = -1; // Устанавливаем -1 для изображения в процессе загрузки
		img.onload = function () {
			image_array[n] = img;
		};
		return n;
	};
	return -1; // Возвращаем -1 при ошибке
};

Draw.text = function (x, y, size, colour, str) {
	// Настраиваем стиль текста
	ctx.font = `${size}px PressStart2P, monospace`;
	ctx.fillStyle = colour;
	ctx.textAlign = 'left';
	ctx.textBaseline = "top"; // выравнивание по верхнему краю
	ctx.imageSmoothingEnabled = false; // отключаем сглаживание (если поддерживается)

	// Смещение на 0.5 пикселя для резкости (убирает размытие)
	const pixelPerfectX = Math.floor(x - Game.screenx) + 0.5;
	const pixelPerfectY = Math.floor(y - Game.screeny) + 0.5;

	// Рисуем текст
	ctx.fillText(str, pixelPerfectX, pixelPerfectY);
};

// Вспомогательная функция: конвертация hex в RGB
function hexToRgb(hex) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return [r, g, b];
};

Draw.plot = function (x, y, colour) {
	ctx.fillStyle = colour;
	ctx.fillRect(x - Game.screenx, y - Game.screeny, 1, 1);
};

Draw.line = function (x, y, x1, y1, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x1, y1);
	ctx.stroke();
};

Draw.sprite = function (sprite, x, y, size, colour) {
	ctx.fillStyle = colour;
	if (size && size < 1) {
		size = 1;
	};
	for (let i = 0; i < sprite.length; i++) {
		for (let j = 0; j < sprite[i].length; j++) {
			if (sprite[i][j] != 0) {
				ctx.fillRect(x + j * size - Game.screenx, y + i * size - Game.screeny, size, size);
			};
		};
	};
};

Draw.image = function (n, x, y, width, height, srcX, srcY, srcWidth, srcHeight) {
	let img = image_array[n];
	if (img !== -1 && img !== 0) { // Проверяем на -1 вместо 0
		if (srcX !== undefined && srcY !== undefined && srcWidth !== undefined && srcHeight !== undefined) {
			// Рисуем часть изображения
			ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
		} else {
			// Рисуем все изображение
			ctx.drawImage(img, x, y, width, height);
		};
	};
};

Draw.clear_screen = function (color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1280, 720);
};

// Объект для работы с касаниями
Game.getTouch = {
	istouch: 0,
	x: 0,
	y: 0
};

// Функции управления игрой
Game.setGravity = function (v) {
	gravitation = v;
};

Game.collision = function g_collision(x1, y1, width1, height1, x2, y2, width2, height2) {
	return (Math.max(x1, x2) <= Math.min(x1 + width1, x2 + width2) &&
		(Math.max(y1, y2) <= Math.min(y1 + height1, y2 + height2)));
};

Game.getKey = function (key) {
	return !!inputState.keys[key];
};

Game.getKeyPress = function (key) {
	return !!inputState.pressKeys[key];
};

Game.getAxes = function (n) {
	return inputState.axes ? inputState.axes[n] : 0;
};

Game.setScreenX = function (x) {
	Game.screenx = x;
};

Game.setScreenY = function (y) {
	Game.screeny = y;
};

Game.getScreenX = function () {
	return Game.screenx;
};

Game.getScreenY = function () {
	return Game.screeny;
};

Game.setTimeout = function (callback, delayMs) {
	var targetTime = Date.now() + delayMs;
	game_helper_timers.push({
		callback,
		targetTime
	});
};

// Функции работы с игровыми объектами
Game.addObject = function (name, x, y, width, height, sprite) {
	var obj = {
		name: name,
		x: x,
		y: y,
		width: width,
		height: height,
		sprite: sprite,
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
		restitution: 0.5,
		isStatic: 0,
		isOnGround: 0,
		zIndex: 0,
		collidingTiles: [],
		local: {}
	};
	Game.allObject.push(obj);
	return obj;
};

Game.removeObject = function (obj) {
	function findObjectIndex(arr, obj) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === obj) {
				return i;
			};
		};
		return -1;
	};
	const index = findObjectIndex(Game.allObject, obj);
	if (index !== -1) {
		Game.allObject.splice(index, 1);
	};
};

Game.mirrorObject = function (o) {
	var no = JSON.parse(JSON.stringify(o));
	no.onCollision = o.onCollision;
	no.onStep = o.onStep;
	Game.allObject.push(no);
	return no;
};

Game.setVelocityTowards = function (obj1, x, y, speed) {
	const dx = x - obj1.x;
	const dy = y - obj1.y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	if (distance > 0) {
		obj1.speedx = (dx / distance) * speed;
		obj1.speedy = (dy / distance) * speed;
	} else {
		obj1.speedx = 0;
		obj1.speedy = 0;
	};
};

Game.exitScreen = function (o) {
	return ((o.x + o.width - Game.screenx < 0) ||
		(o.y + o.height - Game.screeny < 0) ||
		(o.x - Game.screenx > 1280) ||
		(o.y - Game.screeny > 720));
};

Game.distance = function (x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy);
};

// Функция воспроизведения музыки
var globalAudioCtx = new(window.AudioContext || window.webkitAudioContext)();

// Очередь и активные мелодии
const MAX_CONCURRENT_MELODIES = 8;
let activeMelodies = 0;
const melodyQueue = [];

Game.play_music = function (melodyString, bpm = 120) {  
    if (!melodyString || typeof melodyString !== 'string') {
        console.error('Invalid melodyString:', melodyString);
        return;
    }

    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().then(() => {
            _continuePlayMusic(melodyString, bpm);
        });
    } else {
        _continuePlayMusic(melodyString, bpm);
    }
};

function _continuePlayMusic(melodyString, bpm) {
    if (activeMelodies >= MAX_CONCURRENT_MELODIES) {
        melodyQueue.push({ melodyString, bpm });
        return;
    }

    activeMelodies++;
    Game._playMelody(melodyString, bpm);
}

Game.play_sound = function (id) {
	const audio = new Audio(Game.sound_array[id].data);
	audio.play();
};

// Внутренняя функция для реального воспроизведения
Game._playMelody = function (melodyString, bpm) {
    // Проверяем, не закрыт ли контекст
    if (globalAudioCtx.state === 'closed') {
        globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Проверяем, не приостановлен ли контекст
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume().then(() => {
            _continueMelodyPlayback();
        });
    } else {
        _continueMelodyPlayback();
    };
	if (typeof melodyString !== 'string' || !/^(\d+,)*\d+$/.test(melodyString)) {
		console.error("Invalid melody string format");
		activeMelodies--;
		Game._checkQueue(); // Проверяем очередь, если была ошибка
		return;
	};
	function _continueMelodyPlayback() {
		const steps = melodyString.split(',').map(Number);
		const totalSteps = steps.length;
		if (totalSteps === 0) {
			activeMelodies--;
			Game._checkQueue();
			return;
		};

		const instruments = [{
				name: 'C4',
				freq: 261.63,
				type: 'square'
			}, {
				name: 'D4',
				freq: 293.66,
				type: 'square'
			}, {
				name: 'E4',
				freq: 329.63,
				type: 'square'
			}, {
				name: 'F4',
				freq: 349.23,
				type: 'square'
			}, {
				name: 'G4',
				freq: 392.00,
				type: 'square'
			}, {
				name: 'A4',
				freq: 440.00,
				type: 'square'
			}, {
				name: 'B4',
				freq: 493.88,
				type: 'square'
			}, {
				name: 'C5',
				freq: 523.25,
				type: 'square'
			}, {
				name: 'Kick',
				type: 'drum',
				drumType: 'kick'
			}, {
				name: 'Snare',
				type: 'drum',
				drumType: 'snare'
			}, {
				name: 'HiHat',
				type: 'drum',
				drumType: 'hihat'
			}, {
				name: 'Clap',
				type: 'drum',
				drumType: 'clap'
			}, {
				name: 'Tom',
				type: 'drum',
				drumType: 'tom'
			}
		];

		const stepDuration = 60 / bpm / 2;
		let currentTime = globalAudioCtx.currentTime + 0.1;

		// Воспроизведение нот и ударных (как в исходном коде)
		for (let step = 0; step < totalSteps; step++) {
			const stepValue = steps[step];

			for (let i = 0; i < instruments.length; i++) {
				if (stepValue & (1 << i)) {
					const instrument = instruments[i];

					if (instrument.type === 'drum') {
						playDrum(instrument.drumType, currentTime);
					} else {
						playNote(instrument.freq, currentTime, instrument.type);
					};
				};
			};

			currentTime += stepDuration;
		};

		// После завершения всей мелодии освобождаем слот
		const totalDuration = stepDuration * totalSteps;
		setTimeout(() => {
			activeMelodies--;
			Game._checkQueue(); // Проверяем очередь на наличие ожидающих мелодий
		}, totalDuration * 1000 + 100);

		// Функции playNote и playDrum (с очисткой!)
		function playNote(freq, startTime, waveType) {
			const oscillator = globalAudioCtx.createOscillator();
			const gainNode = globalAudioCtx.createGain();

			oscillator.type = waveType || 'square';
			oscillator.frequency.value = freq;

			gainNode.gain.setValueAtTime(0.1, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration * 0.9);

			oscillator.connect(gainNode);
			gainNode.connect(globalAudioCtx.destination);

			oscillator.start(startTime);
			oscillator.stop(startTime + stepDuration);

			// Очистка после завершения
			oscillator.onended = () => {
				oscillator.disconnect();
				gainNode.disconnect();
			};
		};

		function playDrum(type, startTime) {
			const bufferSource = globalAudioCtx.createBufferSource();
			const gainNode = globalAudioCtx.createGain();
			const duration = 0.2;

			const buffer = globalAudioCtx.createBuffer(1, globalAudioCtx.sampleRate * duration, globalAudioCtx.sampleRate);
			const data = buffer.getChannelData(0);

			switch (type) {
			case 'kick':
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					data[i] = Math.sin(t * 50 * Math.PI * 2) * Math.exp(-t * 10);
				};
				break;
			case 'snare':
				for (let i = 0; i < data.length; i++) {
					data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * 0.1));
				};
				break;
			case 'hihat':
				for (let i = 0; i < data.length; i++) {
					data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * 0.02));
				};
				break;
			case 'clap':
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					if (t < 0.02 || (t > 0.03 && t < 0.05) || (t > 0.06 && t < 0.08)) {
						data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
					};
				};
				break;
			case 'tom':
				for (let i = 0; i < data.length; i++) {
					const t = i / globalAudioCtx.sampleRate;
					data[i] = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 5);
				};
				break;
			};

			gainNode.gain.setValueAtTime(0.5, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

			bufferSource.buffer = buffer;
			bufferSource.connect(gainNode);
			gainNode.connect(globalAudioCtx.destination);

			bufferSource.start(startTime);
			bufferSource.stop(startTime + duration);

			// Очистка после завершения
			bufferSource.onended = () => {
				bufferSource.disconnect();
				gainNode.disconnect();
			};
		};
	};
};

// Проверка очереди и запуск следующей мелодии
Game._checkQueue = function () {
	if (melodyQueue.length > 0 && activeMelodies < MAX_CONCURRENT_MELODIES) {
		const nextMelody = melodyQueue.shift();
		Game._playMelody(nextMelody.melodyString, nextMelody.bpm);
	};
};

// Вспомогательные функции
function getApproximateMemoryUsage(obj) {
	const jsonString = JSON.stringify(obj);
	return jsonString.length * 2;
};

Game.getMemory = function () {
	return getApproximateMemoryUsage(Game.allObject) +
	getApproximateMemoryUsage(image_array) +
	(Blockly.JavaScript.workspaceToCode(workspace)?.length * 2 || 0);
};

function reset_game() {
	// Очистка таймеров
	game_helper_timers.length = 0;

	// Очистка всех игровых объектов
	Game.allObject.length = 0;

	// Сброс изображений (но сохраняем загруженные)
	for (let i = 0; i < image_array.length; i++) {
		if (image_array[i] === -1) { // Если изображение в процессе загрузки
			image_array[i] = -1; // Сбрасываем
		}
		// Загруженные изображения (объекты Image) не сбрасываем
	}

	// Сброс состояния ввода
	inputState = {
		keys: {},
		pressKeys: {},
		mouseButtons: {},
		axes: [],
		touchButtons: {}
	};

	// Сброс виртуального геймпада
	//Game.virtualGamepad.joystick.active = false;
	//Game.virtualGamepad.joystick.touchId = null;
	//Game.virtualGamepad.joystick.handle.x = 0;
	//Game.virtualGamepad.joystick.handle.y = 0;

	// Сброс состояния касаний
	Game.virtualGamepad.touches = {};

	// Сброс кнопок геймпада
	Game.virtualGamepad.buttons.forEach(btn => {
		btn.active = false;
	});

	Game.virtualGamepad.dpad.buttons.forEach(btn => {
		btn.active = false;
	});

	// Сброс тайловой системы
	if (Game.helper.tiles) {
		Game.helper.tiles.grid = [];
		Game.helper.tiles.cols = 0;
		Game.helper.tiles.rows = 0;
		Game.helper.tiles.tilesData = {};
	}
	if (Game.alert.close)
		Game.alert.close();

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
	if (globalAudioCtx.state !== 'closed') {
		globalAudioCtx.close().catch(e => console.error('Error closing audio context:', e));
	}

	// Очистка очереди мелодий
	melodyQueue.length = 0;
	activeMelodies = 0;

	// Сброс отладочной панели
	if (objectsDebugPanel) {
		objectsDebugPanel.update();
	}

	// Сброс флагов отладки
	draw_bounding_box = false;
	debugShowExpandedObjectsBorder = true;

	// Сброс игрового цикла
	Game.gameLoop = function () {};
}

// Виртуальный геймпад (стиль Nintendo Switch)
Game.virtualGamepad = {
	buttons: [{
			id: 'KeyB',
			x: 1150,
			y: 500,
			r: 30,
			color: '#e61919',
			text: 'B',
			active: false
		}, // Красный (правая верхняя)
		{
			id: 'KeyA',
			x: 1200,
			y: 550,
			r: 30,
			color: '#2dcd2d',
			text: 'A',
			active: false
		}, // Зеленый (правая нижняя)
		{
			id: 'KeyY',
			x: 1100,
			y: 550,
			r: 30,
			color: '#f5f518',
			text: 'Y',
			active: false
		}, // Желтый (левая нижняя)
		{
			id: 'KeyX',
			x: 1150,
			y: 600,
			r: 30,
			color: '#3a3aff',
			text: 'X',
			active: false
		} // Синий (левая верхняя)
	],
	dpad: {
		x: 100,
		y: 550,
		size: 100,
		buttons: [{
				id: 'ArrowUp',
				x: 0,
				y: -35,
				w: 30,
				h: 35,
				active: false
			}, {
				id: 'ArrowDown',
				x: 0,
				y: 35,
				w: 30,
				h: 35,
				active: false
			}, {
				id: 'ArrowLeft',
				x: -35,
				y: 0,
				w: 35,
				h: 30,
				active: false
			}, {
				id: 'ArrowRight',
				x: 35,
				y: 0,
				w: 35,
				h: 30,
				active: false
			}
		]
	},
	joystickLeft: {
        x: 100,  // Adjust position as needed
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
        x: 1150,  // Adjust position as needed
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
	// Отрисовка виртуального геймпада
	function drawGamepad() {
		if (!Game.enableDrawing || !Game.enableTouchInput)
			return;

		// Кнопки ABXY (раскладка Switch)
		Game.virtualGamepad.buttons.forEach(btn => {
			// Внешний круг
			ctx.beginPath();
			ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
			ctx.fillStyle = btn.active ? '#fff' : btn.color;
			ctx.fill();

			// Внутренний круг
			ctx.beginPath();
			ctx.arc(btn.x, btn.y, btn.r - 8, 0, Math.PI * 2);
			ctx.fillStyle = btn.active ? btn.color : '#fff';
			ctx.fill();

			// Буква кнопки
			ctx.fillStyle = btn.active ? '#fff' : btn.color;
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(btn.text, btn.x, btn.y);
		});

		// D-Pad
		ctx.save();
		ctx.translate(Game.virtualGamepad.dpad.x, Game.virtualGamepad.dpad.y);

		// Центр D-Pad
		ctx.beginPath();
		ctx.arc(0, 0, 15, 0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.dpad.buttons.some(b => b.active) ? '#fff' : '#777';
		ctx.fill();

		// Кнопки D-Pad
		Game.virtualGamepad.dpad.buttons.forEach(btn => {
			ctx.fillStyle = btn.active ? '#fff' : '#777';

			ctx.beginPath();
			ctx.lineTo(btn.x - btn.w / 2, btn.y - btn.h / 2);
			ctx.lineTo(btn.x + btn.w / 2, btn.y - btn.h / 2);
			ctx.lineTo(btn.x + btn.w / 2, btn.y + btn.h / 2);
			ctx.lineTo(btn.x - btn.w / 2, btn.y + btn.h / 2);
			ctx.closePath();
			ctx.fill();

			// Стрелки
			ctx.fillStyle = btn.active ? '#000' : '#fff';
			ctx.font = '20px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			let arrow = '';
			if (btn.id === 'ArrowUp')
				arrow = '↑';
			if (btn.id === 'ArrowDown')
				arrow = '↓';
			if (btn.id === 'ArrowLeft')
				arrow = '←';
			if (btn.id === 'ArrowRight')
				arrow = '→';
			ctx.fillText(arrow, btn.x, btn.y);
		});
		ctx.restore();

		ctx.beginPath();
		ctx.arc(Game.virtualGamepad.joystickLeft.x, Game.virtualGamepad.joystickLeft.y, 
				Game.virtualGamepad.joystickLeft.r, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
		ctx.fill();
		ctx.strokeStyle = '#aaa';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Left joystick handle
		ctx.beginPath();
		ctx.arc(
			Game.virtualGamepad.joystickLeft.x + Game.virtualGamepad.joystickLeft.handle.x,
			Game.virtualGamepad.joystickLeft.y + Game.virtualGamepad.joystickLeft.handle.y,
			Game.virtualGamepad.joystickLeft.handle.r, 0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.joystickLeft.active ? '#e60012' : '#e61919';
		ctx.fill();
		ctx.strokeStyle = '#c00';
		ctx.lineWidth = 2;
		ctx.stroke();
		
		// Right joystick
		ctx.beginPath();
		ctx.arc(Game.virtualGamepad.joystickRight.x, Game.virtualGamepad.joystickRight.y, 
				Game.virtualGamepad.joystickRight.r, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
		ctx.fill();
		ctx.strokeStyle = '#aaa';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Right joystick handle
		ctx.beginPath();
		ctx.arc(
			Game.virtualGamepad.joystickRight.x + Game.virtualGamepad.joystickRight.handle.x,
			Game.virtualGamepad.joystickRight.y + Game.virtualGamepad.joystickRight.handle.y,
			Game.virtualGamepad.joystickRight.handle.r, 0, Math.PI * 2);
		ctx.fillStyle = Game.virtualGamepad.joystickRight.active ? '#e60012' : '#e61919';
		ctx.fill();
		ctx.strokeStyle = '#c00';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	// Отрисовка сенсорных кнопок
	function drawTouchButtons() {
		if (!Game.enableDrawing || !Game.enableTouchInput)
			return;

		for (const btnId in inputState.touchButtons) {
			const btn = inputState.touchButtons[btnId];
			ctx.fillStyle = btn.isPressed ? '#4CAF50' : '#8BC34A';
			ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

			ctx.fillStyle = '#fff';
			ctx.font = '16px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(btn.keyCode, btn.x + btn.width / 2, btn.y + btn.height / 2);
		};
	};

	// Отрисовка геймпада и сенсорных кнопок
	drawGamepad();
	drawTouchButtons();
};

// Инициализация сенсорного ввода
Game.initSensorInput = function () {
	// Проверка попадания в треугольную кнопку D-Pad
	function checkDPadHit(x, y, btn) {
		const centerX = Game.virtualGamepad.dpad.x;
		const centerY = Game.virtualGamepad.dpad.y;
		const btnX = centerX + btn.x;
		const btnY = centerY + btn.y;

		if (btn.id === 'ArrowUp') {
			return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
			y <= btnY + btn.h / 2 && y >= centerY - Game.virtualGamepad.dpad.size / 2;
		};
		if (btn.id === 'ArrowDown') {
			return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
			y >= btnY - btn.h / 2 && y <= centerY + Game.virtualGamepad.dpad.size / 2;
		};
		if (btn.id === 'ArrowLeft') {
			return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
			x <= btnX + btn.w / 2 && x >= centerX - Game.virtualGamepad.dpad.size / 2;
		};
		if (btn.id === 'ArrowRight') {
			return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
			x >= btnX - btn.w / 2 && x <= centerX + Game.virtualGamepad.dpad.size / 2;
		};
		return false;
	};

	// Обновление состояния кнопки
	function updateButtonState(button, active) {
		if (button.active !== active) {
			button.active = active;
			inputState.pressKeys[button.id] = active && !inputState.keys[button.id] ? 1 : 0;
			inputState.keys[button.id] = active;
		};
	};

	// Обновление положения джойстика
	function updateJoystick(joystick, x, y, axisXIndex, axisYIndex) {
		let dx = x - joystick.x;
		let dy = y - joystick.y;

		const distance = Math.sqrt(dx * dx + dy * dy);
		if (distance > joystick.r) {
			dx = dx * joystick.r / distance;
			dy = dy * joystick.r / distance;
		};

		joystick.handle.x = dx;
		joystick.handle.y = dy;
		inputState.axes[axisXIndex] = dx / joystick.r;
		inputState.axes[axisYIndex] = dy / joystick.r;
	};
	
	// Получение координат с учетом масштабирования canvas
	function getCanvasCoordinates(clientX, clientY) {
		if (!Game.enableTouchInput)
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
		};
	};
	
	// Обработка начала касания
	function handleStart(x, y, id) {
		// Проверка кнопок ABXY
		for (const btn of Game.virtualGamepad.buttons) {
			if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
				updateButtonState(btn, true);
				Game.virtualGamepad.touches[id] = {
					type: 'button',
					button: btn
				};
				return;
			};
		};

		// Проверка D-Pad
		for (const btn of Game.virtualGamepad.dpad.buttons) {
			if (checkDPadHit(x, y, btn)) {
				updateButtonState(btn, true);
				Game.virtualGamepad.touches[id] = {
					type: 'dpad',
					button: btn
				};
				return;
			};
		};

		// Проверка левого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
			Game.virtualGamepad.joystickLeft.active = true;
			Game.virtualGamepad.joystickLeft.touchId = id;
			updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1);
			Game.virtualGamepad.touches[id] = {
				type: 'joystickLeft'
			};
			return;
		};
		
		// Проверка правого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
			Game.virtualGamepad.joystickRight.active = true;
			Game.virtualGamepad.joystickRight.touchId = id;
			updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3);
			Game.virtualGamepad.touches[id] = {
				type: 'joystickRight'
			};
			return;
		};
	};
	
	// Обработчики мыши
	canvas.addEventListener('mousedown', (e) => {
		const {
			x,
			y
		} = getCanvasCoordinates(e.clientX, e.clientY);
		handleStart(x, y, 'mouse');
	});

	canvas.addEventListener('mousemove', (e) => {
		if (Game.virtualGamepad.joystickLeft.touchId === 'mouse') {
			const {
				x,
				y
			} = getCanvasCoordinates(e.clientX, e.clientY);
			updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1);
		} else if (Game.virtualGamepad.joystickRight.touchId === 'mouse') {
			const {
				x,
				y
			} = getCanvasCoordinates(e.clientX, e.clientY);
			updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3);
		};
	});

	canvas.addEventListener('mouseup', () => {
		if (Game.virtualGamepad.touches['mouse']) {
			const touch = Game.virtualGamepad.touches['mouse'];
			if (touch.type === 'button' || touch.type === 'dpad') {
				updateButtonState(touch.button, false);
			} else if (touch.type === 'joystickLeft') {
				Game.virtualGamepad.joystickLeft.active = false;
				Game.virtualGamepad.joystickLeft.touchId = null;
				Game.virtualGamepad.joystickLeft.handle.x = 0;
				Game.virtualGamepad.joystickLeft.handle.y = 0;
				inputState.axes[0] = 0;
				inputState.axes[1] = 0;
			} else if (touch.type === 'joystickRight') {
				Game.virtualGamepad.joystickRight.active = false;
				Game.virtualGamepad.joystickRight.touchId = null;
				Game.virtualGamepad.joystickRight.handle.x = 0;
				Game.virtualGamepad.joystickRight.handle.y = 0;
				inputState.axes[2] = 0;
				inputState.axes[3] = 0;
			};
			delete Game.virtualGamepad.touches['mouse'];
		};
	});

	// Обработчики касаний
	canvas.addEventListener('touchstart', (e) => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			const {
				x,
				y
			} = getCanvasCoordinates(touch.clientX, touch.clientY);
			handleStart(x, y, touch.identifier);
		});
	});

	canvas.addEventListener('touchmove', (e) => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			if (Game.virtualGamepad.touches[touch.identifier]?.type === 'joystickLeft') {
				const {
					x,
					y
				} = getCanvasCoordinates(touch.clientX, touch.clientY);
				updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1);
			} else if (Game.virtualGamepad.touches[touch.identifier]?.type === 'joystickRight') {
				const {
					x,
					y
				} = getCanvasCoordinates(touch.clientX, touch.clientY);
				updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3);
			};
		});
	});

	canvas.addEventListener('touchend', (e) => {
		e.preventDefault();
		Array.from(e.changedTouches).forEach(touch => {
			if (Game.virtualGamepad.touches[touch.identifier]) {
				const touchData = Game.virtualGamepad.touches[touch.identifier];
				if (touchData.type === 'button' || touchData.type === 'dpad') {
					updateButtonState(touchData.button, false);
				} else if (touchData.type === 'joystickLeft') {
					Game.virtualGamepad.joystickLeft.active = false;
					Game.virtualGamepad.joystickLeft.touchId = null;
					Game.virtualGamepad.joystickLeft.handle.x = 0;
					Game.virtualGamepad.joystickLeft.handle.y = 0;
					inputState.axes[0] = 0;
					inputState.axes[1] = 0;
				} else if (touchData.type === 'joystickRight') {
					Game.virtualGamepad.joystickRight.active = false;
					Game.virtualGamepad.joystickRight.touchId = null;
					Game.virtualGamepad.joystickRight.handle.x = 0;
					Game.virtualGamepad.joystickRight.handle.y = 0;
					inputState.axes[2] = 0;
					inputState.axes[3] = 0;
				};
				delete Game.virtualGamepad.touches[touch.identifier];
			};
		});
	});

	Game.helper.isTouchOnGamepad = function (x, y) {
		// Проверка кнопок ABXY
		for (const btn of Game.virtualGamepad.buttons) {
			if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
				return true;
			};
		};

		// Проверка D-Pad
		for (const btn of Game.virtualGamepad.dpad.buttons) {
			if (checkDPadHit(x, y, btn)) {
				return true;
			};
		};

		// Проверка левого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
			return true;
		};
		
		// Проверка правого джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
			return true;
		};

		return false;
	};
};

Game.helper.error = function (err) {
	showSwitchModal('error', err, false, 'ok');
	reset_game();
	Game.gameLoop = function () {};
};

// Инициализация сенсорного ввода при запуске игры
Game.initSensorInput();

Game.updateGamepadKey = function () {
	const gamepads = navigator.getGamepads();
	if (gamepads[0]) {
		// Обработка кнопок геймпада
		inputState.pressKeys['KeyA'] = !inputState.keys['KeyA'] && gamepads[0].buttons[1].pressed ? 1 : 0;
		inputState.pressKeys['KeyB'] = !inputState.keys['KeyB'] && gamepads[0].buttons[0].pressed ? 1 : 0;
		inputState.pressKeys['KeyX'] = !inputState.keys['KeyX'] && gamepads[0].buttons[3].pressed ? 1 : 0;
		inputState.pressKeys['KeyY'] = !inputState.keys['KeyY'] && gamepads[0].buttons[2].pressed ? 1 : 0;
		inputState.pressKeys['ArrowUp'] = !inputState.keys['ArrowUp'] && gamepads[0].buttons[12].pressed ? 1 : 0;
		inputState.pressKeys['ArrowDown'] = !inputState.keys['ArrowDown'] && gamepads[0].buttons[13].pressed ? 1 : 0;
		inputState.pressKeys['ArrowLeft'] = !inputState.keys['ArrowLeft'] && gamepads[0].buttons[14].pressed ? 1 : 0;
		inputState.pressKeys['ArrowRight'] = !inputState.keys['ArrowRight'] && gamepads[0].buttons[15].pressed ? 1 : 0;

		inputState.keys['KeyA'] = gamepads[0].buttons[1].pressed;
		inputState.keys['KeyB'] = gamepads[0].buttons[0].pressed;
		inputState.keys['KeyX'] = gamepads[0].buttons[3].pressed;
		inputState.keys['KeyY'] = gamepads[0].buttons[2].pressed;
		inputState.keys['ArrowUp'] = gamepads[0].buttons[12].pressed;
		inputState.keys['ArrowDown'] = gamepads[0].buttons[13].pressed;
		inputState.keys['ArrowLeft'] = gamepads[0].buttons[14].pressed;
		inputState.keys['ArrowRight'] = gamepads[0].buttons[15].pressed;

		inputState.axes = [gamepads[0].axes[0], gamepads[0].axes[1], gamepads[0].axes[2], gamepads[0].axes[3]];
	};
};

// Основной игровой цикл
function game_loop() {

	function sortObjectsByY() {
		if (!Game.allObject || !Array.isArray(Game.allObject)) {
			return [];
		};

		const sortedObjects = [...Game.allObject];
		sortedObjects.sort((a, b) => {
			const aSum = (Number(a.y) || 0) + (Number(a.zIndex) || 0);
			const bSum = (Number(b.y) || 0) + (Number(b.zIndex) || 0);
			return aSum - bSum;
		});

		return sortedObjects;
	};

	requestAnimationFrame(game_loop);

	if (Game.gameLoop && !Game.helper.pause) {
		if (typeof objectsDebugPanel !== 'undefined')
			objectsDebugPanel.update();

		Game.updateGamepadKey();
		Game.gameLoop();
		Game.helper.drawTiles();

		Object.keys(inputState.keys).forEach(key => {
			inputState.pressKeys[key] = 0;
		});

		var now = Date.now();
		for (var i = 0; i < game_helper_timers.length; i++) {
			if (now >= game_helper_timers[i].targetTime) {
				game_helper_timers[i].callback();
				game_helper_timers.splice(i, 1);
				i--;
			};
		};

		for (var i = 0; i < Game.allObject.length; i++) {
			var o = Game.allObject[i];
			if (o.isStatic == 0) {
				o.speedy += gravitation;
			};
			o.x += o.speedx;
			o.y += o.speedy;
			o.isOnGround = 0;
			if (o.solid) {
				Game.checkTileCollision(o);
			};
			for (var j = i + 1; j < Game.allObject.length; j++) {
				var b = Game.allObject[j];
				
				const resolution = Game.checkCollision(o, b);
				if (resolution.collides) {
					if (o.solid != 0 && b.solid != 0) {
						//console.log(`Resolving collision: ${o.name} (solid=${o.solid}) vs ${b.name} (solid=${b.solid})`);
						Game.resolveCollision(o, b, resolution);
					};
					if (o.onCollision)
						o.onCollision(b);
					if (b.onCollision)
						b.onCollision(o);
				};
			};
		};

		const sortedArray = sortObjectsByY();
		for (var i = 0; i < sortedArray.length; i++) {
			var o = sortedArray[i];
			if (o.visible) {
				ctx.save();
				ctx.translate(o.x + o.width / 2 - Game.screenx, o.y + o.height / 2 - Game.screeny);
				ctx.rotate(o.angle * Math.PI / 180);

				const SDL_FLIP_NONE = 0x00000000;
				const SDL_FLIP_HORIZONTAL = 0x00000001;
				const SDL_FLIP_VERTICAL = 0x00000002;
				const flipHorz = (o.flip & SDL_FLIP_HORIZONTAL) !== 0;
				const flipVert = (o.flip & SDL_FLIP_VERTICAL) !== 0;

				if (flipHorz || flipVert) {
					const scaleX = flipHorz ? -1 : 1;
					const scaleY = flipVert ? -1 : 1;
					ctx.scale(scaleX, scaleY);
				};
				Draw.image(o.sprite, -o.width / 2, -o.height / 2, o.width, o.height);

				if (draw_bounding_box) {
					ctx.save();
					ctx.strokeStyle = '#0ff';
					ctx.lineWidth = 2;
					ctx.beginPath();
					// Используем boundingWidth и boundingHeight вместо width и height
					ctx.rect(-o.boundingWidth / 2, -o.boundingHeight / 2, o.boundingWidth, o.boundingHeight);
					ctx.stroke();
					ctx.restore();
				};

				// Отрисовка зеленой рамки для раскрытых объектов
				if (debugShowExpandedObjectsBorder && objectsDebugPanel &&
					objectsDebugPanel.isObjectExpanded(o)) {
					ctx.save();
					ctx.strokeStyle = '#0f0';
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.rect(-o.width / 2, -o.height / 2, o.width, o.height);
					ctx.stroke();
					ctx.fillStyle = '#0f0';
					ctx.font = '12px Arial';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(o.name || 'Unnamed', 0, 0);
					ctx.restore();
				};

				ctx.restore();

				if (o.onStep)
					o.onStep();
			};
		};

		if (Game.enableTouchInput) {
			Game.updateSensorKey();
		};
	};
};

// Инициализация игры
Game.init();
game_loop();

function initObjectsDebugPanel() {
	const container = document.getElementById('objectsList');
	if (!container) {
		console.error('Элемент с id="objectsList" не найден');
		return;
	};

	container.style.overflowY = 'auto';
	container.style.backgroundColor = 'rgba(40, 40, 40, 0.9)';
	container.style.color = '#e0e0e0';
	container.style.fontFamily = 'monospace';
	container.style.fontSize = '13px';
	container.style.width = 0;
	container.style.opacity = 0;

	const expandedStates = new Map();
	const objectElements = new Map();
	let lastObjectCount = 0;

	// Создаем элемент для отображения счетчика
	const counterElement = document.createElement('div');
	counterElement.style.padding = '6px 8px';
	counterElement.style.background = '#222';
	counterElement.style.borderBottom = '1px solid #444';
	counterElement.style.fontWeight = 'bold';
	counterElement.style.position = 'sticky';
	counterElement.style.top = '0';
	counterElement.style.zIndex = '1';
	container.appendChild(counterElement);

	// Маппинг стандартных параметров объекта на переводы
	const PARAM_TRANSLATIONS = {
		'x': Blockly.Msg['OBJECT_PARAM_X'],
		'y': Blockly.Msg['OBJECT_PARAM_Y'],
		'width': Blockly.Msg['OBJECT_PARAM_WIDTH'],
		'height': Blockly.Msg['OBJECT_PARAM_HEIGHT'],
		'speedx': Blockly.Msg['OBJECT_PARAM_SPEEDX'],
		'speedy': Blockly.Msg['OBJECT_PARAM_SPEEDY'],
		'visible': Blockly.Msg['OBJECT_PARAM_VISIBLE'],
		'name': Blockly.Msg['OBJECT_PARAM_NAME'],
		'solid': Blockly.Msg['OBJECT_PARAM_SOLID'],
		'angle': Blockly.Msg['OBJECT_PARAM_ANGLE'],
		'flip': Blockly.Msg['OBJECT_PARAM_FLIP'],
		'mass': Blockly.Msg['OBJECT_PARAM_MASS'],
		'restitution': Blockly.Msg['OBJECT_PARAM_RESTITUTION'],
		'isStatic': Blockly.Msg['OBJECT_PARAM_ISSTATIC'],
		'zIndex': Blockly.Msg['OBJECT_PARAM_ZINDEX'],
		'isOnGround': Blockly.Msg['OBJECT_PARAM_ISONGROUND']
	};

	function getObjectId(obj, index) {
		if (!obj.__debugId) {
			obj.__debugId = `obj_${index};_${Date.now()};_${Math.random().toString(36).substr(2, 6)};`;
		};
		return obj.__debugId;
	};

	function createObjectElement(obj, id) {
		const element = document.createElement('div');
		element.className = 'debug-object';
		element.dataset.objId = id;
		element.style.marginBottom = '8px';
		element.style.border = '1px solid #444';
		element.style.overflow = 'hidden';

		const isExpanded = expandedStates.get(id) || false;

		const header = document.createElement('div');
		header.className = 'debug-object-header';
		header.style.padding = '6px 8px';
		header.style.background = '#333';
		header.style.display = 'flex';
		header.style.justifyContent = 'space-between';
		header.style.alignItems = 'center';
		header.style.cursor = 'pointer';
		header.style.userSelect = 'none';

		const nameSpan = document.createElement('span');
		nameSpan.style.color = '#6af';
		nameSpan.textContent = obj.name || `Object ${id.split('_')[1]};`;

		const arrowSpan = document.createElement('span');
		arrowSpan.className = 'debug-object-arrow';
		arrowSpan.style.fontSize = '10px';
		arrowSpan.textContent = isExpanded ? '▼' : '▶';

		header.appendChild(nameSpan);
		header.appendChild(arrowSpan);

		const details = document.createElement('div');
		details.className = 'debug-object-details';
		details.style.padding = '8px';
		details.style.background = '#2a2a2a';
		details.style.borderTop = '1px solid #444';

		updateObjectDetails(details, obj);

		element.appendChild(header);
		element.appendChild(details);

		header.addEventListener('click', (e) => {
			const newState = !(expandedStates.get(id) || false);
			expandedStates.set(id, newState);

			if (newState) {
				details.classList.add('expanded');
			} else {
				details.classList.remove('expanded');
			};

			arrowSpan.textContent = newState ? '▼' : '▶';
			e.stopPropagation();
		});

		return element;
	};

	function updateObjectDetails(detailsElement, obj) {
		detailsElement.innerHTML = Object.entries(obj)
			.filter(([key]) => typeof obj[key] !== 'function')
			.map(([key, value]) => {
				let valueStr;
				try {
					valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
					if (valueStr.length > 100)
						valueStr = valueStr.substring(0, 100) + '...';
				} catch {
					valueStr = '[Complex Data]';
				};

				const displayName = PARAM_TRANSLATIONS[key] || key;

				return `
								                    <div style="display: flex; margin-bottom: 4px; line-height: 1.3;">
								                        <span style="color: #aaf; min-width: 120px;">${displayName};:</span>
								                        <span style="
								                            ${typeof value === 'number' ? 'color: #8f8;' : ''};
								                            ${typeof value === 'boolean' ? ` color: $ {
					value ? '#8f8' : '#f88'
				};
				` : ''};
                            ${typeof value === 'string' ? 'color: #f8f;' : ''};
                            ${value === null ? 'color: #888;' : ''};
                            word-break: break-all;
                        ">
                            ${valueStr};
                        </span>
                    </div>
                `;
			})
			.join('');
	};

	function updateObjectsList() {
		if (!Game.allObject)
			return;
		if (!Game.helper.debug)
			return;

		const currentObjects = Game.allObject;
		const currentCount = currentObjects.length;

		// Обновляем счетчик объектов
		counterElement.textContent = `Objects: ${currentCount};`;

		// Очищаем expandedStates от удаленных объектов
		const currentIds = new Set();
		currentObjects.forEach((obj, index) => {
			const id = getObjectId(obj, index);
			currentIds.add(id);
		});

		// Удаляем состояния для объектов, которых больше нет
		expandedStates.forEach((_, id) => {
			if (!currentIds.has(id)) {
				expandedStates.delete(id);
			};
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
					const nameSpan = element.querySelector('.debug-object-header span:first-child');
					if (nameSpan)
						nameSpan.textContent = obj.name || `Object ${index};`;

					const details = element.querySelector('.debug-object-details');
					if (details && expandedStates.get(id)) {
						updateObjectDetails(details, obj);
					};
				};
			});
			return;
		};

		// Полная перерисовка при изменении количества объектов
		// Сохраняем счетчик и очищаем остальное содержимое
		const children = Array.from(container.children);
		children.forEach(child => {
			if (child !== counterElement) {
				container.removeChild(child);
			};
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
				const details = element.querySelector('.debug-object-details');
				details.classList.add('expanded');
				const arrow = element.querySelector('.debug-object-arrow');
				if (arrow)
					arrow.textContent = '▼';
			};
		});

		lastObjectCount = currentCount;
	};

	function isObjectExpanded(obj) {
		const id = obj.__debugId;
		return id ? expandedStates.get(id) : false;
	};

	Game.helper.debug = false;
	updateObjectsList();

	return {
		update: updateObjectsList,
		isObjectExpanded: isObjectExpanded,
		getExpandedStates: () => expandedStates,
		getObjectElements: () => objectElements
	};
};

const objectsDebugPanel = initObjectsDebugPanel();
