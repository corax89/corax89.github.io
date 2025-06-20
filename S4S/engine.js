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
    // Флаги для управления вводом и отрисовкой
    enableDrawing: false,
    enableTouchInput: false,
	helper:{}
};

// Основной объект Game
Game.init = function() {
    // Инициализация массива изображений
    for (let i = 0; i < 1024; i++) {
        image_array[i] = 0;
    }

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
        }
        inputState.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        inputState.keys[e.code] = false;
    });

    // Функция для получения позиции касания/клика
    function getPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = 1280 / rect.width;    // Масштаб по X (логический/физический)
		const scaleY = 720 / rect.height;   // Масштаб по Y (логический/физический)
		
		let clientX, clientY;
		
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
		}
		
		// Масштабируем координаты к логическому размеру 1280x720
		return {
			x: clientX * scaleX,
			y: clientY * scaleY
		};
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
                Game.getTouch.y = pos.y;
            }
        }
    }

    function handleMove(event) {
         event.preventDefault();
        const pos = getPosition(event);
        if (pos && Game.getTouch.istouch) {
            Game.getTouch.x = pos.x;
            Game.getTouch.y = pos.y;
        }
    }

    function handleEnd(event) {
        event.preventDefault();
        // Проверяем, было ли это отпускание кнопки
        const pos = getPosition(event);
        if (pos) {
            checkTouchButtons(pos.x, pos.y, false);
        }
        Game.getTouch.istouch = 0;
    }

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
		}
		
		static rotate(v, angle, result = new Vector2(0, 0)) {
			const cos_a = Math.cos(angle);
			const sin_a = Math.sin(angle);
			const x = v.x * cos_a - v.y * sin_a;
			const y = v.x * sin_a + v.y * cos_a;
			result.x = x;
			result.y = y;
			return result;
		}
		
		normalize() {
			const len_sq = this.x * this.x + this.y * this.y;
			if (len_sq > 0) {
				const inv_len = 1 / Math.sqrt(len_sq);
				this.x *= inv_len;
				this.y *= inv_len;
			}
			return this;
		}
		
		static dot(v1, v2) {
			return v1.x * v2.x + v1.y * v2.y;
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
            axes.push(normal);
        }
        return axes;
    }

    function projectPolygon(axis, points) {
        let min = Vector2.dot(axis, points[0]);
        let max = min;
        
        for (let i = 1; i < points.length; i++) {
            const projection = Vector2.dot(axis, points[i]);
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }
        
        return { min, max };
    }

    // Функции проверки и разрешения коллизий
    Game.checkCollision = function(a, b) {
		const angle_a = a.angle * Math.PI / 180;
		const angle_b = b.angle * Math.PI / 180;
		
		// Используем boundingWidth и boundingHeight для расчета центра и размеров
		const center_a = new Vector2(a.x + a.width/2, a.y + a.height/2); // Центр остается тем же
		const center_b = new Vector2(b.x + b.width/2, b.y + b.height/2); // Центр остается тем же
		
		const half_size_a = new Vector2(a.boundingWidth/2, a.boundingHeight/2); // Используем bounding размеры
		const half_size_b = new Vector2(b.boundingWidth/2, b.boundingHeight/2); // Используем bounding размеры
		
		const a_points = [
			new Vector2(-half_size_a.x, -half_size_a.y),
			new Vector2( half_size_a.x, -half_size_a.y),
			new Vector2( half_size_a.x,  half_size_a.y),
			new Vector2(-half_size_a.x,  half_size_a.y)
		];
		
		const b_points = [
			new Vector2(-half_size_b.x, -half_size_b.y),
			new Vector2( half_size_b.x, -half_size_b.y),
			new Vector2( half_size_b.x,  half_size_b.y),
			new Vector2(-half_size_b.x,  half_size_b.y)
		];
		
		// Поворот и смещение точек
		for (let i = 0; i < 4; i++) {
			a_points[i] = Vector2.rotate(a_points[i], angle_a);
			a_points[i].x += center_a.x;
			a_points[i].y += center_a.y;
			
			b_points[i] = Vector2.rotate(b_points[i], angle_b);
			b_points[i].x += center_b.x;
			b_points[i].y += center_b.y;
		}
		
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
				return { collides: false };
			}
			
			const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
			
			if (overlap < minOverlap) {
				minOverlap = overlap;
				smallestAxis = axis;
			}
		}
		
		// Определение направления нормали
		const centerDiff = new Vector2(center_b.x - center_a.x, center_b.y - center_a.y);
		if (Vector2.dot(centerDiff, smallestAxis) < 0) {
			smallestAxis = new Vector2(-smallestAxis.x, -smallestAxis.y);
		}
		
		return {
			collides: true,
			normal: smallestAxis,
			overlap: minOverlap
		};
	};

    Game.addObjectsFromArray = function(objectsArray) {
      for (var arrIndex = 0; arrIndex < objectsArray.length; arrIndex++) {
        var obj = objectsArray[arrIndex];
        var xyArray = obj.xy;
        var objectRef = obj.id;
        
        // Проверяем, существует ли объект с таким id
        if (!objectRef) {
          console.error('Object with id "' + objectRef + '" not found in window scope');
          continue;  // вместо return, так как это цикл
        }
        
        // Проверяем, что xyArray является массивом и имеет четное количество элементов
        if (!Array.isArray(xyArray)) {
          console.error('xy property for object "' + objectRef + '" is not an array');
          continue;
        }
        
        if (xyArray.length % 2 !== 0) {
          console.error('xy array for object "' + objectRef + '" has odd number of elements');
          continue;
        }
        
        // Добавляем объекты
        for (var i = 0; i < xyArray.length; i += 2) {
          var x = xyArray[i];
          var y = xyArray[i + 1];
          
          // Проверяем, что координаты являются числами
          if (typeof x !== 'number' || typeof y !== 'number') {
            console.error('Invalid coordinates at position ' + i + ' for object "' + objectRef + '"');
            continue;
          }
          
          // Вызываем метод addObject с нужными параметрами
          var o = Game.addObject(
            objectRef.name,x,y,0,0,0
          );
		  for (var key in objectRef) {
			  if (objectRef.hasOwnProperty(key)) {
				o[key] = objectRef[key];
			  }
			}
			o.x = x;
			o.y = y;
        }
      }
    };

    Game.resolveCollision = function(a, b, collisionInfo) {
        if (a.isStatic && b.isStatic) return;
        
        const { normal, overlap } = collisionInfo;

        if (normal.y > 0.5) {
            a.isOnGround = 1;
        }
        
        // Коррекция позиции
        const correction = new Vector2(
            normal.x * overlap,
            normal.y * overlap
        );
        
        // Распределение коррекции по массам
        const totalMass = a.isStatic ? b.mass : (b.isStatic ? a.mass : a.mass + b.mass);
        const aRatio = b.isStatic ? 1 : (a.isStatic ? 0 : b.mass / totalMass);
        const bRatio = a.isStatic ? 1 : (b.isStatic ? 0 : a.mass / totalMass);
        
        if (!a.isStatic) {
            a.x -= correction.x * aRatio;
            a.y -= correction.y * aRatio;
        }
        
        if (!b.isStatic) {
            b.x += correction.x * bRatio;
            b.y += correction.y * bRatio;
        }
        
        // Расчет относительной скорости
        const relativeVelocity = new Vector2(
            b.speedx - a.speedx,
            b.speedy - a.speedy
        );
        
        // Скорость вдоль нормали
        const velocityAlongNormal = Vector2.dot(relativeVelocity, normal);
        
        if (velocityAlongNormal > 0) return;
        
        // Коэффициент упругости
        const restitution = Math.min(a.restitution, b.restitution);
        
        // Импульс столкновения
        let j = -(1 + restitution) * velocityAlongNormal;
        j /= (a.isStatic ? 0 : 1/a.mass) + (b.isStatic ? 0 : 1/b.mass);
        
        // Применение импульса
        const impulse = new Vector2(normal.x * j, normal.y * j);
        
        if (!a.isStatic) {
            a.speedx -= impulse.x / a.mass;
            a.speedy -= impulse.y / a.mass;
        }
        
        if (!b.isStatic) {
            b.speedx += impulse.x / b.mass;
            b.speedy += impulse.y / b.mass;
        }
    };
};

// Функция для проверки нажатия на сенсорные кнопки
function checkTouchButtons(x, y, isPressed) {
    // Проверяем, включена ли обработка сенсорного ввода
    if (!Game.enableTouchInput) return false;
    
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
            }
            return true; // Прерываем обработку, так как нажатие было на кнопку
        }
    }
    return false;
}

// Функция для добавления сенсорной кнопки
Game.addTouchButton = function(id, x, y, width, height, keyCode) {
    inputState.touchButtons[id] = {
        x: x,
        y: y,
        width: width,
        height: height,
        keyCode: keyCode,
        isPressed: false
    };
};

// Функция для удаления сенсорной кнопки
Game.removeTouchButton = function(id) {
    if (inputState.touchButtons[id]) {
        // Сбрасываем состояние кнопки, если она была нажата
        if (inputState.touchButtons[id].isPressed) {
            inputState.keys[inputState.touchButtons[id].keyCode] = false;
        }
        delete inputState.touchButtons[id];
    }
};

// Функции для работы с изображениями
Draw.loadImage = function(n, str) {
    if(n < 1024){
        let img = new Image();
        img.src = str;
        image_array[n] = 1;
        img.onload = function() {
            image_array[n] = img;
        };
        return n;
    }
    return 0;
};

Draw.text = function(x, y, size, colour, str) {
    function hexToRgb(hex) {
		return [
			parseInt(hex.slice(1, 3), 16),
			parseInt(hex.slice(3, 5), 16),
			parseInt(hex.slice(5, 7), 16)
		];
	}
    const baseFontSize = 24;
    const scale = Math.max(1, Math.floor(size / baseFontSize));
    const finalSize = baseFontSize * scale;

    // Создаем временный холст (если ещё нет)
    if (!this._tempCanvas) {
        this._tempCanvas = document.createElement('canvas');
        // Пробуем получить контекст (без willReadFrequently для максимальной совместимости)
        this._tempCanvasCtx = this._tempCanvas.getContext('2d');
    }

    var tempCtx = this._tempCanvasCtx; // Важно: везде используем tempCtx (без опечаток!)

    // Устанавливаем шрифт и измеряем ширину текста
    tempCtx.font = `${baseFontSize}px 'Courier New', monospace`;
	if (!tempCtx.measureText) {
        this._tempCanvas = document.createElement('canvas');
        this._tempCanvasCtx = this._tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCtx = this._tempCanvasCtx;
		tempCtx.font = `${baseFontSize}px 'Courier New', monospace`;
    }
    const textWidth = Math.ceil(tempCtx.measureText(str).width);

    // Настраиваем размеры временного холста
    this._tempCanvas.width = textWidth;
    this._tempCanvas.height = baseFontSize;
    tempCtx.clearRect(0, 0, this._tempCanvas.width, this._tempCanvas.height);

    // Рисуем текст
    tempCtx.fillStyle = colour;
    tempCtx.textBaseline = "top";
    tempCtx.font = `${baseFontSize}px 'Courier New', monospace`;
    tempCtx.fillText(str, 0, 0);

    // Убираем полутона, если текст крупный (>24px)
    if (finalSize > 24) {
        const imageData = tempCtx.getImageData(0, 0, this._tempCanvas.width, this._tempCanvas.height);
        const data = imageData.data;
        const [r, g, b] = hexToRgb(colour);

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Если пиксель не прозрачный
                data[i] = r;     // R
                data[i + 1] = g; // G
                data[i + 2] = b; // B
                data[i + 3] = 255; // Делаем полностью непрозрачным
            }
        }
        tempCtx.putImageData(imageData, 0, 0);
    }

    // Рисуем на основном холсте
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        this._tempCanvas,
        0, 0, textWidth, baseFontSize,
        x - Game.screenx, y - Game.screeny, textWidth * scale, finalSize
    );
};

// Вспомогательная функция: конвертация hex в RGB
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

Draw.plot = function(x, y, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(x - Game.screenx, y - Game.screeny, 1, 1);
};

Draw.line = function(x, y, x1, y1, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
};

Draw.sprite = function(sprite, x, y, size, colour) {
    ctx.fillStyle = colour;
    if (size && size < 1) {
        size = 1;
    }
    for (let i = 0; i < sprite.length; i++) {
        for (let j = 0; j < sprite[i].length; j++) {
            if (sprite[i][j] != 0) {
                ctx.fillRect(x + j * size - Game.screenx, y + i * size - Game.screeny, size, size);
            }
        }
    }
};

Draw.image = function(n, x, y, width, height) {
    let img = image_array[n];
    if (img != 1 && img != 0) {
        ctx.drawImage(img, x, y, width, height);
    }
};

Draw.clear_screen = function(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1280, 720);
};

// Объект для работы с касаниями
Game.getTouch = {istouch: 0, x: 0, y: 0};

// Функции управления игрой
Game.setGravity = function(v) {
    gravitation = v;
};

Game.collision = function g_collision(x1, y1, width1, height1, x2, y2, width2, height2) {
    return (Math.max(x1, x2) <= Math.min(x1 + width1, x2 + width2) && 
           (Math.max(y1, y2) <= Math.min(y1 + height1, y2 + height2)));
};

Game.getKey = function(key) {
    return !!inputState.keys[key];
};

Game.getKeyPress = function(key) {
    return !!inputState.pressKeys[key];
};

Game.getAxes = function(n) {
    return inputState.axes ? inputState.axes[n] : 0;
};

Game.setScreenX = function(x) {
    Game.screenx = x;
};

Game.setScreenY = function(y) {
    Game.screeny = y;
};

Game.setTimeout = function(callback, delayMs) {
    var targetTime = Date.now() + delayMs;
    game_helper_timers.push({ callback, targetTime });
};

// Функции работы с игровыми объектами
Game.addObject = function(name, x, y, width, height, sprite) {
    var obj = {
        name: name,
        x: x,
        y: y,
        width: width,
        height: height,
        sprite: sprite,
        speedx: 0,
        speedy: 0,
        onCollision: function(){},
        onStep: function(){},
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
        local: {}
    };
    Game.allObject.push(obj);
    return obj;
};

Game.removeObject = function(obj) {
    function findObjectIndex(arr, obj) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }
    const index = findObjectIndex(Game.allObject, obj);
    if (index !== -1) {
        Game.allObject.splice(index, 1);
    }
};

Game.mirrorObject = function(o) {
    var no = JSON.parse(JSON.stringify(o));
    no.onCollision = o.onCollision;
    no.onStep = o.onStep;
    Game.allObject.push(no);
    return no;
};

Game.setVelocityTowards = function(obj1, x, y, speed) {
    const dx = x - obj1.x;
    const dy = y - obj1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        obj1.speedx = (dx / distance) * speed;
        obj1.speedy = (dy / distance) * speed;
    } else {
        obj1.speedx = 0;
        obj1.speedy = 0;
    }
};

Game.exitScreen = function(o) {
    return ((o.x + o.width - Game.screenx < 0) || 
            (o.y + o.height - Game.screeny < 0) || 
            (o.x - Game.screenx > 1280) || 
            (o.y - Game.screeny > 720));
};

Game.distance = function(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

// Функция воспроизведения музыки
const globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Очередь и активные мелодии
const MAX_CONCURRENT_MELODIES = 8;
let activeMelodies = 0;
const melodyQueue = [];

Game.play_music = function(melodyString, bpm = 120) {
    // Если уже играет максимум, ставим в очередь
    if (activeMelodies >= MAX_CONCURRENT_MELODIES) {
        melodyQueue.push({ melodyString, bpm });
        return;
    }

    // Запускаем новую мелодию
    activeMelodies++;
    Game._playMelody(melodyString, bpm);
};

Game.play_sound = function(id){
	const audio = new Audio(Game.sound_array[id].data);
	audio.play();
}

// Внутренняя функция для реального воспроизведения
Game._playMelody = function(melodyString, bpm) {
    // Проверка формата (как в исходном коде)
    if (typeof melodyString !== 'string' || !/^(\d+,)*\d+$/.test(melodyString)) {
        console.error("Invalid melody string format");
        activeMelodies--;
        Game._checkQueue(); // Проверяем очередь, если была ошибка
        return;
    }

    const steps = melodyString.split(',').map(Number);
    const totalSteps = steps.length;
    if (totalSteps === 0) {
        activeMelodies--;
        Game._checkQueue();
        return;
    }

    const instruments = [
        {name: 'C4', freq: 261.63, type: 'square'},
        {name: 'D4', freq: 293.66, type: 'square'},
        {name: 'E4', freq: 329.63, type: 'square'},
        {name: 'F4', freq: 349.23, type: 'square'},
        {name: 'G4', freq: 392.00, type: 'square'},
        {name: 'A4', freq: 440.00, type: 'square'},
        {name: 'B4', freq: 493.88, type: 'square'},
        {name: 'C5', freq: 523.25, type: 'square'},
        {name: 'Kick', type: 'drum', drumType: 'kick'},
        {name: 'Snare', type: 'drum', drumType: 'snare'},
        {name: 'HiHat', type: 'drum', drumType: 'hihat'},
        {name: 'Clap', type: 'drum', drumType: 'clap'},
        {name: 'Tom', type: 'drum', drumType: 'tom'}
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
                }
            }
        }
        
        currentTime += stepDuration;
    }

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
    }

    function playDrum(type, startTime) {
        const bufferSource = globalAudioCtx.createBufferSource();
        const gainNode = globalAudioCtx.createGain();
        const duration = 0.2;
        
        const buffer = globalAudioCtx.createBuffer(1, globalAudioCtx.sampleRate * duration, globalAudioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        switch(type) {
            case 'kick':
                for (let i = 0; i < data.length; i++) {
                    const t = i / globalAudioCtx.sampleRate;
                    data[i] = Math.sin(t * 50 * Math.PI * 2) * Math.exp(-t * 10);
                }
                break;
            case 'snare':
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * 0.1));
                }
                break;
            case 'hihat':
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * 0.02));
                }
                break;
            case 'clap':
                for (let i = 0; i < data.length; i++) {
                    const t = i / globalAudioCtx.sampleRate;
                    if (t < 0.02 || (t > 0.03 && t < 0.05) || (t > 0.06 && t < 0.08)) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
                    }
                }
                break;
            case 'tom':
                for (let i = 0; i < data.length; i++) {
                    const t = i / globalAudioCtx.sampleRate;
                    data[i] = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 5);
                }
                break;
        }
        
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
    }
}

// Проверка очереди и запуск следующей мелодии
Game._checkQueue = function() {
    if (melodyQueue.length > 0 && activeMelodies < MAX_CONCURRENT_MELODIES) {
        const nextMelody = melodyQueue.shift();
        Game._playMelody(nextMelody.melodyString, nextMelody.bpm);
    }
}

// Вспомогательные функции
function getApproximateMemoryUsage(obj) {
    const jsonString = JSON.stringify(obj);
    return jsonString.length * 2;
}

Game.getMemory = function() {
    return getApproximateMemoryUsage(Game.allObject) + 
           getApproximateMemoryUsage(image_array) + 
           (Blockly.JavaScript.workspaceToCode(workspace)?.length * 2 || 0);
};

function reset_game() {
    for (var i = 0; i < game_helper_timers.length; i++) {
        game_helper_timers.splice(i, 1);  
        i--;
    }
    for (var i = 0; i < Game.allObject.length; i++) {
        Game.allObject.splice(i, 1);  
        i--;
    }
    for (let i = 0; i < 1024; i++)
        image_array[i] = 0;
    Game.screenx = 0;
    Game.screeny = 0;
    Game.gravitation = 0;
}

// Виртуальный геймпад (стиль Nintendo Switch)
Game.virtualGamepad = {
    buttons: [
        { id: 'KeyB', x: 1150, y: 500, r: 30, color: '#e61919', text: 'B', active: false }, // Красный (правая верхняя)
        { id: 'KeyA', x: 1200, y: 550, r: 30, color: '#2dcd2d', text: 'A', active: false }, // Зеленый (правая нижняя)
        { id: 'KeyY', x: 1100, y: 550, r: 30, color: '#f5f518', text: 'Y', active: false }, // Желтый (левая нижняя)
        { id: 'KeyX', x: 1150, y: 600, r: 30, color: '#3a3aff', text: 'X', active: false }  // Синий (левая верхняя)
    ],
    dpad: {
        x: 100, y: 550, size: 100,
        buttons: [
            { id: 'ArrowUp', x: 0, y: -35, w: 30, h: 35, active: false },
            { id: 'ArrowDown', x: 0, y: 35, w: 30, h: 35, active: false },
            { id: 'ArrowLeft', x: -35, y: 0, w: 35, h: 30, active: false },
            { id: 'ArrowRight', x: 35, y: 0, w: 35, h: 30, active: false }
        ]
    },
    joystick: {
        x: 300, y: 550, r: 50,
        handle: { x: 0, y: 0, r: 25 },
        active: false, touchId: null
    },
    touches: {}
};

// Функция обновления состояния сенсорного ввода
Game.updateSensorKey = function() {
    // Отрисовка виртуального геймпада
    function drawGamepad() {
        if (!Game.enableDrawing || !Game.enableTouchInput) return;
        
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
            ctx.lineTo(btn.x - btn.w/2, btn.y - btn.h/2);
            ctx.lineTo(btn.x + btn.w/2, btn.y - btn.h/2);
            ctx.lineTo(btn.x + btn.w/2, btn.y + btn.h/2);
            ctx.lineTo(btn.x - btn.w/2, btn.y + btn.h/2);
            ctx.closePath();
            ctx.fill();
            
            // Стрелки
            ctx.fillStyle = btn.active ? '#000' : '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let arrow = '';
            if (btn.id === 'ArrowUp') arrow = '↑';
            if (btn.id === 'ArrowDown') arrow = '↓';
            if (btn.id === 'ArrowLeft') arrow = '←';
            if (btn.id === 'ArrowRight') arrow = '→';
            ctx.fillText(arrow, btn.x, btn.y);
        });
        ctx.restore();

        // Джойстик (стиль Switch)
        ctx.beginPath();
        ctx.arc(Game.virtualGamepad.joystick.x, Game.virtualGamepad.joystick.y, Game.virtualGamepad.joystick.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ручка джойстика
        ctx.beginPath();
        ctx.arc(
            Game.virtualGamepad.joystick.x + Game.virtualGamepad.joystick.handle.x,
            Game.virtualGamepad.joystick.y + Game.virtualGamepad.joystick.handle.y,
            Game.virtualGamepad.joystick.handle.r, 0, Math.PI * 2
        );
        ctx.fillStyle = Game.virtualGamepad.joystick.active ? '#e60012' : '#e61919';
        ctx.fill();
        ctx.strokeStyle = '#c00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Отрисовка сенсорных кнопок
    function drawTouchButtons() {
        if (!Game.enableDrawing || !Game.enableTouchInput) return;
        
        for (const btnId in inputState.touchButtons) {
            const btn = inputState.touchButtons[btnId];
            ctx.fillStyle = btn.isPressed ? '#4CAF50' : '#8BC34A';
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.keyCode, btn.x + btn.width/2, btn.y + btn.height/2);
        }
    }

    // Отрисовка геймпада и сенсорных кнопок
    drawGamepad();
    drawTouchButtons();
};

// Инициализация сенсорного ввода
Game.initSensorInput = function() {
    // Проверка попадания в треугольную кнопку D-Pad
    function checkDPadHit(x, y, btn) {
        const centerX = Game.virtualGamepad.dpad.x;
        const centerY = Game.virtualGamepad.dpad.y;
        const btnX = centerX + btn.x;
        const btnY = centerY + btn.y;
        
        if (btn.id === 'ArrowUp') {
            return x >= btnX - btn.w/2 && x <= btnX + btn.w/2 && 
                   y <= btnY + btn.h/2 && y >= centerY - Game.virtualGamepad.dpad.size/2;
        }
        if (btn.id === 'ArrowDown') {
            return x >= btnX - btn.w/2 && x <= btnX + btn.w/2 && 
                   y >= btnY - btn.h/2 && y <= centerY + Game.virtualGamepad.dpad.size/2;
        }
        if (btn.id === 'ArrowLeft') {
            return y >= btnY - btn.h/2 && y <= btnY + btn.h/2 && 
                   x <= btnX + btn.w/2 && x >= centerX - Game.virtualGamepad.dpad.size/2;
        }
        if (btn.id === 'ArrowRight') {
            return y >= btnY - btn.h/2 && y <= btnY + btn.h/2 && 
                   x >= btnX - btn.w/2 && x <= centerX + Game.virtualGamepad.dpad.size/2;
        }
        return false;
    }

    // Обновление состояния кнопки
    function updateButtonState(button, active) {
        if (button.active !== active) {
            button.active = active;
            inputState.pressKeys[button.id] = active && !inputState.keys[button.id] ? 1 : 0;
            inputState.keys[button.id] = active;
        }
    }

    // Обновление положения джойстика
    function updateJoystick(x, y) {
        let dx = x - Game.virtualGamepad.joystick.x;
        let dy = y - Game.virtualGamepad.joystick.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > Game.virtualGamepad.joystick.r) {
            dx = dx * Game.virtualGamepad.joystick.r / distance;
            dy = dy * Game.virtualGamepad.joystick.r / distance;
        }
        
        Game.virtualGamepad.joystick.handle.x = dx;
        Game.virtualGamepad.joystick.handle.y = dy;
        inputState.axes[0] = dx / Game.virtualGamepad.joystick.r;
        inputState.axes[1] = dy / Game.virtualGamepad.joystick.r;
    }
    // Получение координат с учетом масштабирования canvas
    function getCanvasCoordinates(clientX, clientY) {
		if(!Game.enableTouchInput) return {x:0,y:0};
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    // Обработка начала касания
    function handleStart(x, y, id) {
        // Проверка кнопок ABXY
        for (const btn of Game.virtualGamepad.buttons) {
            if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
                updateButtonState(btn, true);
                Game.virtualGamepad.touches[id] = { type: 'button', button: btn };
                return;
            }
        }

        // Проверка D-Pad
        for (const btn of Game.virtualGamepad.dpad.buttons) {
            if (checkDPadHit(x, y, btn)) {
                updateButtonState(btn, true);
                Game.virtualGamepad.touches[id] = { type: 'dpad', button: btn };
                return;
            }
        }

        // Проверка джойстика
        if (Math.sqrt((x - Game.virtualGamepad.joystick.x) ** 2 + (y - Game.virtualGamepad.joystick.y) ** 2) <= Game.virtualGamepad.joystick.r) {
            Game.virtualGamepad.joystick.active = true;
            Game.virtualGamepad.joystick.touchId = id;
            updateJoystick(x, y);
            Game.virtualGamepad.touches[id] = { type: 'joystick' };
        }
    }
    // Обработчики мыши
    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
        handleStart(x, y, 'mouse');
    });

    canvas.addEventListener('mousemove', (e) => {
        if (Game.virtualGamepad.joystick.touchId === 'mouse') {
            const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
            updateJoystick(x, y);
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (Game.virtualGamepad.touches['mouse']) {
            const touch = Game.virtualGamepad.touches['mouse'];
            if (touch.type === 'button' || touch.type === 'dpad') {
                updateButtonState(touch.button, false);
            } else if (touch.type === 'joystick') {
                Game.virtualGamepad.joystick.active = false;
                Game.virtualGamepad.joystick.touchId = null;
                Game.virtualGamepad.joystick.handle.x = 0;
                Game.virtualGamepad.joystick.handle.y = 0;
                inputState.axes[0] = 0;
                inputState.axes[1] = 0;
            }
            delete Game.virtualGamepad.touches['mouse'];
        }
    });

    // Обработчики касаний
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
            handleStart(x, y, touch.identifier);
        });
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            if (Game.virtualGamepad.touches[touch.identifier]?.type === 'joystick') {
                const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
                updateJoystick(x, y);
            }
        });
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            if (Game.virtualGamepad.touches[touch.identifier]) {
                const touchData = Game.virtualGamepad.touches[touch.identifier];
                if (touchData.type === 'button' || touchData.type === 'dpad') {
                    updateButtonState(touchData.button, false);
                } else if (touchData.type === 'joystick') {
                    Game.virtualGamepad.joystick.active = false;
                    Game.virtualGamepad.joystick.touchId = null;
                    Game.virtualGamepad.joystick.handle.x = 0;
                    Game.virtualGamepad.joystick.handle.y = 0;
                    inputState.axes[0] = 0;
                    inputState.axes[1] = 0;
                }
                delete Game.virtualGamepad.touches[touch.identifier];
            }
        });
    });
	
	Game.helper.isTouchOnGamepad = function(x, y) {
		// Проверка кнопок ABXY
		for (const btn of Game.virtualGamepad.buttons) {
			if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
				return true;
			}
		}

		// Проверка D-Pad
		for (const btn of Game.virtualGamepad.dpad.buttons) {
			if (checkDPadHit(x, y, btn)) {
				return true;
			}
		}

		// Проверка джойстика
		if (Math.sqrt((x - Game.virtualGamepad.joystick.x) ** 2 + (y - Game.virtualGamepad.joystick.y) ** 2) <= Game.virtualGamepad.joystick.r) {
			return true;
		}

		return false;
	}
};

Game.helper.error = function(err){
	showSwitchModal('error', err, false, 'ok');
	reset_game();
	Game.gameLoop = function(){};
}

// Инициализация сенсорного ввода при запуске игры
Game.initSensorInput();

Game.updateGamepadKey = function(){
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
    }
}

// Основной игровой цикл
function game_loop() {
    
    function sortObjectsByY() {
        if (!Game.allObject || !Array.isArray(Game.allObject)) {
            return [];
        }

        const sortedObjects = [...Game.allObject];
        sortedObjects.sort((a, b) => {
            const aSum = (Number(a.y) || 0) + (Number(a.zIndex) || 0);
            const bSum = (Number(b.y) || 0) + (Number(b.zIndex) || 0);
            return aSum - bSum;
        });

        return sortedObjects;
    }
    
    requestAnimationFrame(game_loop);
    
    if (Game.gameLoop) {
        if(typeof objectsDebugPanel !== 'undefined')
            objectsDebugPanel.update();
        
        Game.updateGamepadKey();
        Game.gameLoop();
        
        Object.keys(inputState.keys).forEach(key => {
            inputState.pressKeys[key] = 0;
        });
        
        var now = Date.now();
        for (var i = 0; i < game_helper_timers.length; i++) {
            if (now >= game_helper_timers[i].targetTime) {
                game_helper_timers[i].callback(); 
                game_helper_timers.splice(i, 1);  
                i--;                  
            }
        }
        
        for (var i = 0; i < Game.allObject.length; i++) {
            var o = Game.allObject[i];
            if (o.isStatic == 0) {
                o.speedy += gravitation;
            }
            o.x += o.speedx;
            o.y += o.speedy;
            o.isOnGround = 0;
            
            for (var j = i + 1; j < Game.allObject.length; j++) {
                var b = Game.allObject[j];
                if (o.solid && b.solid) {
                    const resolution = Game.checkCollision(o, b);
                    if (resolution.collides) {
                        Game.resolveCollision(o, b, resolution);
                        if (o.onCollision) o.onCollision(b);
                        if (b.onCollision) b.onCollision(o);
                    }
                }
            }
        }
        
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
					const offsetX = flipHorz ? o.width / 2 : -o.width / 2;
					const offsetY = flipVert ? o.height / 2 : -o.height / 2;

					ctx.scale(scaleX, scaleY);
					Draw.image(o.sprite, offsetX, offsetY, o.width, o.height);
				} else {
					Draw.image(o.sprite, -o.width / 2, -o.height / 2, o.width, o.height);
				}
				
				if (draw_bounding_box) {
					ctx.save();
					ctx.strokeStyle = '#0ff';
					ctx.lineWidth = 2;                
					ctx.beginPath();
					// Используем boundingWidth и boundingHeight вместо width и height
					ctx.rect(-o.boundingWidth / 2, -o.boundingHeight / 2, o.boundingWidth, o.boundingHeight);
					ctx.stroke();
					ctx.restore();
				}
				
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
				}

				ctx.restore();
				
				if(o.onStep)
					o.onStep();
			}
		}
        
        if (Game.enableTouchInput) {
            Game.updateSensorKey();
        }
    }
}

// Инициализация игры
Game.init();
game_loop();

function initObjectsDebugPanel() {
    const container = document.getElementById('objectsList');
    if (!container) {
        console.error('Элемент с id="objectsList" не найден');
        return;
    }

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
            obj.__debugId = `obj_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        }
        return obj.__debugId;
    }

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
        nameSpan.textContent = obj.name || `Object ${id.split('_')[1]}`;

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
            }
            
            arrowSpan.textContent = newState ? '▼' : '▶';
            e.stopPropagation();
        });

        return element;
    }

    function updateObjectDetails(detailsElement, obj) {
        detailsElement.innerHTML = Object.entries(obj)
            .filter(([key]) => typeof obj[key] !== 'function')
            .map(([key, value]) => {
                let valueStr;
                try {
                    valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    if (valueStr.length > 100) valueStr = valueStr.substring(0, 100) + '...';
                } catch {
                    valueStr = '[Complex Data]';
                }

                const displayName = PARAM_TRANSLATIONS[key] || key;

                return `
                    <div style="display: flex; margin-bottom: 4px; line-height: 1.3;">
                        <span style="color: #aaf; min-width: 120px;">${displayName}:</span>
                        <span style="
                            ${typeof value === 'number' ? 'color: #8f8;' : ''}
                            ${typeof value === 'boolean' ? `color: ${value ? '#8f8' : '#f88'};` : ''}
                            ${typeof value === 'string' ? 'color: #f8f;' : ''}
                            ${value === null ? 'color: #888;' : ''}
                            word-break: break-all;
                        ">
                            ${valueStr}
                        </span>
                    </div>
                `;
            })
            .join('');
    }

    function updateObjectsList() {
        if (!Game.allObject) return;
        if (!Game.helper.debug) return;

        const currentObjects = Game.allObject;
        const currentCount = currentObjects.length;

        // Обновляем счетчик объектов
        counterElement.textContent = `Objects: ${currentCount}`;

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
                    const nameSpan = element.querySelector('.debug-object-header span:first-child');
                    if (nameSpan) nameSpan.textContent = obj.name || `Object ${index}`;
                    
                    const details = element.querySelector('.debug-object-details');
                    if (details && expandedStates.get(id)) {
                        updateObjectDetails(details, obj);
                    }
                }
            });
            return;
        }

        // Полная перерисовка при изменении количества объектов
        // Сохраняем счетчик и очищаем остальное содержимое
        const children = Array.from(container.children);
        children.forEach(child => {
            if (child !== counterElement) {
                container.removeChild(child);
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
                const details = element.querySelector('.debug-object-details');
                details.classList.add('expanded');
                const arrow = element.querySelector('.debug-object-arrow');
                if (arrow) arrow.textContent = '▼';
            }
        });

        lastObjectCount = currentCount;
    }

    function isObjectExpanded(obj) {
        const id = obj.__debugId;
        return id ? expandedStates.get(id) : false;
    }
    
    Game.helper.debug = false;
    updateObjectsList();

    return {
        update: updateObjectsList,
        isObjectExpanded: isObjectExpanded,
        getExpandedStates: () => expandedStates,
        getObjectElements: () => objectElements
    };
}

const objectsDebugPanel = initObjectsDebugPanel();