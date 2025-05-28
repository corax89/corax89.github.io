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
let gamepads = {};
var inputState = {};
var local = {};
var Draw = {};
var Game = {
    allObject: [],
    screenx: 0,
    screeny: 0,
    gravitation: 0
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
        mouseButtons: {}
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
        
        // Для событий мыши
        if (event.clientX !== undefined) {
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
        // Для событий касания
        else if (event.touches && event.touches[0]) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }
        return null;
    }

    // Обработчики касаний/кликов
    function handleInteraction(event) {
        event.preventDefault();
        const pos = getPosition(event);
        if (pos) {
            Game.getTouch.istouch = 1;
            Game.getTouch.x = pos.x;
            Game.getTouch.y = pos.y;
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
        
        static rotate(v, angle) {
            const cos_a = Math.cos(angle);
            const sin_a = Math.sin(angle);
            return new Vector2(
                v.x * cos_a - v.y * sin_a,
                v.x * sin_a + v.y * cos_a
            );
        }
        
        normalize() {
            const len = Math.sqrt(this.x * this.x + this.y * this.y);
            if (len > 0) {
                this.x /= len;
                this.y /= len;
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
        
        const center_a = new Vector2(a.x + a.width/2, a.y + a.height/2);
        const center_b = new Vector2(b.x + b.width/2, b.y + b.height/2);
        
        const half_size_a = new Vector2(a.width/2, a.height/2);
        const half_size_b = new Vector2(b.width/2, b.height/2);
        
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

// Функции для работы с изображениями
Draw.loadImage = function(str) {
    for (let i = 0; i < 1024; i++) {
        if (image_array[i] == 0) {
            let img = new Image();
            img.src = str;
            image_array[i] = 1;
            img.onload = function() {
                image_array[i] = img;
            };
            return i;
        }
    }
    return 0;
};

// Функции отрисовки
Draw.text = function(x, y, size, colour, str) {
    ctx.fillStyle = colour;
    ctx.textBaseline = "top";
    ctx.font = size + "px serif";
    ctx.fillText(str, x - Game.screenx, y - Game.screeny);
};

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
    _playMelody(melodyString, bpm);
};

// Внутренняя функция для реального воспроизведения
function _playMelody(melodyString, bpm) {
    // Проверка формата (как в исходном коде)
    if (typeof melodyString !== 'string' || !/^(\d+,)*\d+$/.test(melodyString)) {
        console.error("Invalid melody string format");
        activeMelodies--;
        _checkQueue(); // Проверяем очередь, если была ошибка
        return;
    }

    const steps = melodyString.split(',').map(Number);
    const totalSteps = steps.length;
    if (totalSteps === 0) {
        activeMelodies--;
        _checkQueue();
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
        _checkQueue(); // Проверяем очередь на наличие ожидающих мелодий
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
function _checkQueue() {
    if (melodyQueue.length > 0 && activeMelodies < MAX_CONCURRENT_MELODIES) {
        const nextMelody = melodyQueue.shift();
        _playMelody(nextMelody.melodyString, nextMelody.bpm);
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
    Game.screenx = 0;
    Game.screeny = 0;
    Game.gravitation = 0;
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
        // Обработка геймпада
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
        
        // Вызов основного игрового цикла
        Game.gameLoop();
        
        // Сброс состояний нажатий
        Object.keys(inputState.keys).forEach(key => {
            inputState.pressKeys[key] = 0;
        });
        
        // Обработка таймеров
        var now = Date.now();
        for (var i = 0; i < game_helper_timers.length; i++) {
            if (now >= game_helper_timers[i].targetTime) {
                game_helper_timers[i].callback(); 
                game_helper_timers.splice(i, 1);  
                i--;                  
            }
        }
        
        // Обновление объектов
        for (var i = 0; i < Game.allObject.length; i++) {
            var o = Game.allObject[i];
            if (o.isStatic == 0) {
                o.speedy += gravitation;
            }
            o.x += o.speedx;
            o.y += o.speedy;
            o.isOnGround = 0;
            
            // Проверка коллизий
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
        
        // Отрисовка объектов
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

                ctx.restore();
				if(o.onStep)
					o.onStep();
            }
        }
    }
}

// Инициализация игры
Game.init();
game_loop();