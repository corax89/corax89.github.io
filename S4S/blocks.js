
var ObjectParam = [
  [Blockly.Msg['OBJECT_PARAM_X'], 'x'],
  [Blockly.Msg['OBJECT_PARAM_Y'], 'y'],
  [Blockly.Msg['OBJECT_PARAM_PREV_X'] || 'prev X', 'prev_x'],
  [Blockly.Msg['OBJECT_PARAM_PREV_Y'] || 'prev Y', 'prev_y'],
  [Blockly.Msg['OBJECT_PARAM_WIDTH'], 'width'],
  [Blockly.Msg['OBJECT_PARAM_HEIGHT'], 'height'],
  [Blockly.Msg['OBJECT_PARAM_SPEEDX'], 'speedx'],
  [Blockly.Msg['OBJECT_PARAM_SPEEDY'], 'speedy'],
  [Blockly.Msg['OBJECT_PARAM_NAME'], 'name'],
  [Blockly.Msg['OBJECT_PARAM_SPRITE'], 'sprite'],
  [Blockly.Msg['OBJECT_PARAM_VISIBLE'], 'visible'],
  [Blockly.Msg['OBJECT_PARAM_SOLID'], 'solid'],
  [Blockly.Msg['OBJECT_PARAM_ANGLE'], 'angle'],
  [Blockly.Msg['OBJECT_PARAM_FLIP'], 'flip'],
  [Blockly.Msg['OBJECT_PARAM_MASS'], 'mass'],
  [Blockly.Msg['OBJECT_PARAM_RESTITUTION'], 'restitution'],
  [Blockly.Msg['OBJECT_PARAM_ISSTATIC'], 'isStatic'],
  [Blockly.Msg['OBJECT_PARAM_LADDER'] || 'ladder', 'ladder'],
  [Blockly.Msg['OBJECT_PARAM_LOCK_ROTATION'] || 'lock rotation', 'lockRotation'],
  [Blockly.Msg['OBJECT_PARAM_ROTATION_SPEED'] || 'rotation speed', 'rotationSpeed'],
  [Blockly.Msg['OBJECT_PARAM_ZINDEX'], 'zIndex'],
  [Blockly.Msg['OBJECT_PARAM_ISONGROUND'], 'isOnGround'],
  [Blockly.Msg['OBJECT_PARAM_COLLIDING_TILES'], 'collidingTiles'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_SPEED'], 'animationSpeed'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_LOOP'], 'animationLoop'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_PLAY'], 'isAnimationEnd']
];

// Read-only object properties — managed by the engine, must NOT be set
// from user code. These are excluded from the setter ("change_object_var")
// and add-to ("addto_object_var") blocks to prevent users from corrupting
// engine-internal state.
//
// • prev_x / prev_y  — position at end of previous frame; used by the
//   physics engine's displacement-aware push-out (anti-tunneling).
//   Engine overwrites them every frame, so any user write is silently
//   lost in the next frame anyway — better to hide them from the setter.
// • name              — set at object creation, mutating it post-create
//   breaks name-based lookups in JS.
// • collidingTiles    — read-only array, computed by the engine.
// • isOnGround        — set by physics step; user override is meaningless.
// • isAnimationEnd    — set by the animation system.
var _ReadOnlyObjectParams = {
  'prev_x': true,
  'prev_y': true,
  'name': true,
  'collidingTiles': true,
  'isOnGround': true,
  'isAnimationEnd': true
};
var ObjectParamWritable = ObjectParam.filter(function(p) {
  return !_ReadOnlyObjectParams[p[1]];
});

// Карта типов свойств объекта.
// Используется блоком change_object_var, чтобы подобрать подходящий
// shadow-блок и тип подключения (setCheck) для значения в зависимости
// от выбранного свойства:
//   'boolean' → logic_boolean_yesno (Да/Нет, генерирует 1/0)
//   'number'  → math_number
//   'string'  → text
//   'sprite'  → field_png (выбор изображения из хранилища)
//   'any'     → без setCheck (любой тип) — запасной вариант.
//
// Типы проставлены исходя из того, как движок (engine.js) читает каждое
// свойство:
//   • visible / solid / flip / isStatic / ladder / lockRotation —
//     сравниваются с 0/1, поэтому логический блок Да/Нет подходит идеально.
//   • animationLoop — в движке хранится как true/false, но if(value)
//     корректно отрабатывает и 1/0, поэтому тоже Да/Нет.
//   • sprite — числовой индекс в image_array, но выбирается через
//     field_png, поэтому тип 'sprite'.
//   • все остальные (x, y, width, height, speedx, speedy, angle, mass,
//     restitution, rotationSpeed, zIndex, animationSpeed) — числа.
var ObjectParamTypes = {
  // Числовые
  x: 'number',
  y: 'number',
  width: 'number',
  height: 'number',
  speedx: 'number',
  speedy: 'number',
  angle: 'number',
  mass: 'number',
  restitution: 'number',
  rotationSpeed: 'number',
  zIndex: 'number',
  animationSpeed: 'number',
  // Логические (0/1) — используются с блоком Да/Нет
  visible: 'boolean',
  solid: 'boolean',
  flip: 'boolean',
  isStatic: 'boolean',
  ladder: 'boolean',
  lockRotation: 'boolean',
  animationLoop: 'boolean',
  // Спрайт — индекс в image_array, выбирается через field_png
  sprite: 'sprite'
};

// Значения по умолчанию для генератора, когда к входу VALUE
// ничего не подключено. Используется в generator.valueToCode(...) || fallback.
var ObjectParamDefaults = {
  boolean: '0',
  number: '0',
  string: '""',
  sprite: '0',
  any: '0'
};

// Возвращает тип свойства по его внутреннему имени (x, y, speedx, ...).
// Если свойство не описано — возвращает 'any'.
function getObjectParamType(paramName) {
  return ObjectParamTypes[paramName] || 'any';
}

// Подсказки (tooltips) для блока change_object_var.
// Для каждого writable-свойства объекта описано, что оно делает и в каком
// диапазоне ожидается значение. Подсказка показывается при наведении на блок
// и автоматически меняется при смене выбранного свойства в dropdown NAME.
//
// Каждая запись содержит два варианта текста: ru и en. Выбор языка
// определяется глобальной переменной savedLanguage (так же, как в остальных
// местах движка).
//
// Диапазоны проставлены исходя из того, как движок (engine.js) использует
// каждое свойство:
//   • x, y            — координаты в пикселях, экран 1280×720.
//   • width, height   — размеры в пикселях, должны быть > 0.
//   • speedx, speedy  — скорость в пикселях/кадр, любое число.
//   • sprite          — индекс в image_array, выбирается через field_png.
//   • visible/solid/isStatic/ladder/lockRotation/animationLoop — 0 или 1.
//   • flip            — битовая маска SDL: 0/1/2/3.
//   • angle           — градусы, обычно 0–360.
//   • mass            — масса, > 0 (движок использует Math.max(mass, 0.1)).
//   • restitution     — упругость, 0–1.
//   • rotationSpeed   — градусы/кадр, любое число.
//   • zIndex          — целое, глубина отрисовки.
//   • animationSpeed  — кадров/сек, должно быть > 0 (иначе деление на 0).
var ObjectParamTooltips = {
  x: {
    ru: 'Координата X объекта в пикселях. Любое число (экран 0–1280).',
    en: 'Object X coordinate in pixels. Any number (screen 0–1280).'
  },
  y: {
    ru: 'Координата Y объекта в пикселях. Любое число (экран 0–720).',
    en: 'Object Y coordinate in pixels. Any number (screen 0–720).'
  },
  width: {
    ru: 'Ширина объекта в пикселях. Положительное число (> 0).',
    en: 'Object width in pixels. Positive number (> 0).'
  },
  height: {
    ru: 'Высота объекта в пикселях. Положительное число (> 0).',
    en: 'Object height in pixels. Positive number (> 0).'
  },
  speedx: {
    ru: 'Скорость по X в пикселях/кадр. Любое число (отрицательное — влево).',
    en: 'X velocity in pixels/frame. Any number (negative = left).'
  },
  speedy: {
    ru: 'Скорость по Y в пикселях/кадр. Любое число (отрицательное — вверх).',
    en: 'Y velocity in pixels/frame. Any number (negative = up).'
  },
  sprite: {
    ru: 'Индекс спрайта в хранилище изображений (0 и выше). Выбирается через field_png.',
    en: 'Sprite index in the image store (0+). Selected via field_png.'
  },
  visible: {
    ru: 'Видимость объекта: 1 (Да) — видимый, 0 (Нет) — скрытый.',
    en: 'Object visibility: 1 (Yes) — visible, 0 (No) — hidden.'
  },
  solid: {
    ru: 'Твёрдость: 1 (Да) — объект сталкивается, 0 (Нет) — сквозной.',
    en: 'Solidity: 1 (Yes) — collides, 0 (No) — pass-through.'
  },
  angle: {
    ru: 'Угол поворота в градусах. Любое число (обычно 0–360).',
    en: 'Rotation angle in degrees. Any number (typically 0–360).'
  },
  flip: {
    ru: 'Отражение спрайта (битовая маска): 0 — нет, 1 — по горизонтали, 2 — по вертикали, 3 — оба.',
    en: 'Sprite flip (bitmask): 0 — none, 1 — horizontal, 2 — vertical, 3 — both.'
  },
  mass: {
    ru: 'Масса объекта. Положительное число (> 0). Движок использует минимум 0.1.',
    en: 'Object mass. Positive number (> 0). Engine clamps to minimum 0.1.'
  },
  restitution: {
    ru: 'Упругость (bounciness): 0 — нет отскока, 1 — полный отскок. Диапазон 0–1.',
    en: 'Restitution (bounciness): 0 — no bounce, 1 — full bounce. Range 0–1.'
  },
  isStatic: {
    ru: 'Статичность: 1 (Да) — объект неподвижен, 0 (Нет) — подвержен физике.',
    en: 'Static: 1 (Yes) — immovable, 0 (No) — affected by physics.'
  },
  ladder: {
    ru: 'Лестница: 1 (Да) — объект является лестницей, 0 (Нет) — обычный объект.',
    en: 'Ladder: 1 (Yes) — object is a ladder, 0 (No) — normal object.'
  },
  lockRotation: {
    ru: 'Блокировка вращения: 1 (Да) — вращение заблокировано, 0 (Нет) — объект может вращаться.',
    en: 'Lock rotation: 1 (Yes) — rotation locked, 0 (No) — free rotation.'
  },
  rotationSpeed: {
    ru: 'Скорость вращения в градусах/кадр. Любое число (положительное — по часовой стрелке).',
    en: 'Rotation speed in degrees/frame. Any number (positive = clockwise).'
  },
  zIndex: {
    ru: 'Глубина отрисовки (z-index). Любое целое число (больше — поверх других).',
    en: 'Drawing depth (z-index). Any integer (higher = drawn on top).'
  },
  animationSpeed: {
    ru: 'Скорость анимации в кадрах/сек. Положительное число (> 0).',
    en: 'Animation speed in frames/sec. Positive number (> 0).'
  },
  animationLoop: {
    ru: 'Зацикливание анимации: 1 (Да) — повторять, 0 (Нет) — остановить в конце.',
    en: 'Animation loop: 1 (Yes) — repeat, 0 (No) — stop at end.'
  }
};

// Возвращает текст подсказки для свойства с учётом текущего языка.
// Используется блоком change_object_var как динамическая подсказка.
function getObjectParamTooltip(paramName) {
  var tip = ObjectParamTooltips[paramName];
  if (!tip) return '';
  var ru = typeof savedLanguage !== 'undefined' && savedLanguage === 'ru';
  return ru ? tip.ru : tip.en;
}

var ObjectType = [
  [Blockly.Msg['OBJECT_TYPE_COLLIDED'], 'object'],
  [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
  [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
];

// ========= Вспомогательные функции ========

var proto_object_array = [];
var object_array = [];
var store_image_array = [];

function add_to_image_array(str) {
    // Создаем хеш строки (используем простой хеш для примера)
    const hash = generateHash(str);
    
    // Проверяем, есть ли уже такой хеш в массиве
    const existingIndex = store_image_array.findIndex(item => item.hash === hash);
    
    if (existingIndex !== -1) {
        // Если хеш уже существует, возвращаем его индекс
        return existingIndex;
    } else {
        // Если хеша нет, добавляем новую запись и возвращаем её индекс
        const newEntry = {
            data: str,
            hash: hash
        };
        store_image_array.push(newEntry);
        return store_image_array.length - 1;
    }
}

 function add_to_sound_array(str) {
    // Создаем хеш строки (используем простой хеш для примера)
    const hash = generateHash(str);
    
    // Проверяем, есть ли уже такой хеш в массиве
    const existingIndex = Game.sound_array.findIndex(item => item.hash === hash);
    
    if (existingIndex !== -1) {
        // Если хеш уже существует, возвращаем его индекс
        return existingIndex;
    } else {
        // Если хеша нет, добавляем новую запись и возвращаем её индекс
        const newEntry = {
            data: str,
            hash: hash
        };
        Game.sound_array.push(newEntry);
        return Game.sound_array.length - 1;
    }
}

function generateHash(str) {
    // Используем простой хеш
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Преобразуем в 32-битное целое число
    }
    return hash.toString();
}

Blockly.Variables = {
  localVars: [],
  
  // Добавляет переменную и обновляет списки
  addVar: function(name) {
    if (!this.localVars.includes(name)) {
      this.localVars.push(name);
      this.updateVarDropdowns();
    }
  },
  
  // Удаляет переменную и обновляет списки
  removeVar: function(name) {
    this.localVars = this.localVars.filter(v => v !== name);
    this.updateVarDropdowns();
  },
  
  // Обновляет все dropdown-списки
  updateVarDropdowns: function() {
    const blocks = Blockly.getMainWorkspace().getAllBlocks();
    blocks.forEach(block => {
      if (block.type === 'get_local_var' && block.updateVarDropdown) {
        block.updateVarDropdown();
      }
    });
  }
};

// Функция для обновления всех dropdown-списков переменных
function updateAllVarDropdowns() {
  const blocks = workspace.getAllBlocks();
  blocks.forEach(block => {
    if (block.type === 'get_local_var' && block.updateVarDropdown) {
      block.updateVarDropdown();
    }
  });
}

// ==================== Блоки ====================

Blockly.Blocks['particles_create'] = {
  init: function() {
        this.appendDummyInput()
        .appendField(Blockly.Msg['PARTICLES_LABEL']);
    this.appendValueInput('X')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_X']);
    this.appendValueInput('Y')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_Y']);
    this.appendValueInput('COUNT')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_COUNT']);
    
    this.appendDummyInput()
        .appendField(Blockly.Msg['PARTICLES_CREATE_OPTIONS']);
    
    this.appendValueInput('COLOR')
        .setCheck('Colour')
        .appendField(Blockly.Msg['PARTICLES_CREATE_COLOR']);
    this.appendValueInput('SIZE')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_SIZE']);
    this.appendValueInput('SPEED')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_SPEED']);
    this.appendValueInput('DIRECTION')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_DIRECTION']);
    this.appendValueInput('SPREAD')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_SPREAD']);
    this.appendValueInput('LIFE')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_CREATE_LIFE']);
    
    this.setInputsInline(false);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(30);
    this.setTooltip(Blockly.Msg['PARTICLES_CREATE_TOOLTIP']);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок с предустановленными эффектами частиц
Blockly.Blocks['particles_preset'] = {
  init: function() {
        this.appendDummyInput()
        .appendField(Blockly.Msg['PARTICLES_PRESET_LABEL']);
    this.appendValueInput('X')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_PRESET_X']);
    this.appendValueInput('Y')
        .setCheck('Number')
        .appendField(Blockly.Msg['PARTICLES_PRESET_Y']);
    
    this.appendDummyInput()
        .appendField(Blockly.Msg['PARTICLES_PRESET_TYPE'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['PARTICLES_PRESET_EXPLOSION'], 'explosion'],
          [Blockly.Msg['PARTICLES_PRESET_FIRE'], 'fire'],
          [Blockly.Msg['PARTICLES_PRESET_SMOKE'], 'smoke'],
          [Blockly.Msg['PARTICLES_PRESET_RAIN'], 'rain'],
          [Blockly.Msg['PARTICLES_PRESET_STARS'], 'stars'],
          [Blockly.Msg['PARTICLES_PRESET_MAGIC'], 'magic']
        ]), 'TYPE');
    
    this.appendValueInput('COLOR')
        .setCheck('Colour')
        .appendField(Blockly.Msg['PARTICLES_PRESET_COLOR']);
    
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(30);
    this.setTooltip(Blockly.Msg['PARTICLES_PRESET_TOOLTIP']);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок очистки частиц
Blockly.Blocks['particles_clear'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['PARTICLES_CLEAR_TITLE']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(30);
    this.setTooltip(Blockly.Msg['PARTICLES_CLEAR_TOOLTIP']);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок игрового цикла
Blockly.Blocks['game_loop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAME_LOOP_LABEL']);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CLEAR_SCREEN_OPTION'])
        .appendField(new Blockly.FieldCheckbox(true), 'CLEAR');
    this.appendStatementInput("LOOP_BODY")
        .setCheck(null)
        .appendField(Blockly.Msg['EXECUTE_LABEL']);
    this.setColour(120);
    this.setTooltip("");
    this.setPreviousStatement(true, "Array");
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#gameloop');
  }
};

// Блок для вывода текста через Game.alert
Blockly.Blocks['text_print_custom'] = {
  init: function() {
    this.setColour(165); // Оранжевый цвет, как у стандартного текстового блока
    this.appendValueInput('TEXT')
        .setCheck('String')
        .appendField(Blockly.Msg['TEXT_PRINT_TITLE'].replace('%1',''));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg["TEXT_PRINT_TOOLTIP"]);
    this.setHelpUrl("");
  }
};

// 1. Сначала определим вспомогательные блоки для мутатора
Blockly.Blocks['variables_container'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['VARIABLES_FOR_SAVE']);
    this.appendStatementInput('STACK')
        .setCheck(null);
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.contextMenu = false;
  }
};

Blockly.Blocks['variables_get_item'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['VARIABLE']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.contextMenu = false;
  }
};

// 2. Основной блок для сохранения переменных
Blockly.Blocks['save_vars_with_values'] = {
  init: function() {
    this.itemCount_ = 1;
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setColour(60);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    
    // Иконка мутатора
    this.setMutator(new Blockly.icons.MutatorIcon(['variables_get_item'], this));
    
    this.updateShape_();
  },

  mutationToDom: function() {
    var container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },

  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 1;
    this.updateShape_();
  },

  saveExtraState: function() {
    return {
      'itemCount': this.itemCount_
    };
  },

  loadExtraState: function(state) {
    this.itemCount_ = state['itemCount'] || 1;
    this.updateShape_();
  },

  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('variables_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    
    for (var i = 0; i < this.itemCount_; i++) {
      var itemBlock = workspace.newBlock('variables_get_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    
    return containerBlock;
  },

  compose: function(containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var connections = [];
    var i = 0;
    
    while (itemBlock) {
      if (!itemBlock.isInsertionMarker()) {
        connections.push({
          connection: itemBlock.valueConnection_,
          varName: itemBlock.getFieldValue('VAR')
        });
      }
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      i++;
    }
    
    this.itemCount_ = connections.length;
    this.updateShape_();
    
    for (var j = 0; j < connections.length; j++) {
      if (connections[j] && connections[j].connection) {
        connections[j].connection.reconnect(this, 'VAR' + j);
      }
    }
  },

  saveConnections: function(containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 0;
    
    while (itemBlock) {
      if (!itemBlock.isInsertionMarker()) {
        var input = this.getInput('VAR' + i);
        if (input && input.connection) {
          itemBlock.valueConnection_ = input.connection.targetConnection;
        }
        i++;
      }
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
  },

  updateShape_: function() {
    for (var i = 0; this.getInput('VAR' + i); i++) {
      this.removeInput('VAR' + i);
    }
    
    for (var j = 0; j < this.itemCount_; j++) {
      var input = this.appendValueInput('VAR' + j)
        .setCheck('Variable')
        .setAlign(Blockly.ALIGN_RIGHT);
      
      if (j === 0) {
        input.appendField(Blockly.Msg['SAVE_VARIABLES']);
      }
    }
    
    if (this.itemCount_ === 0) {
      this.appendDummyInput('EMPTY')
        .appendField("Нет переменных для сохранения");
    }
  }
};

// Блок для загрузки переменных
Blockly.Blocks['load_vars_with_values'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['LOAD_VARIABLES']);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
  }
};

Blockly.Blocks['reset'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['RESET']);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setColour(60);
  }
};

// Блок проверки нажатия клавиши
Blockly.Blocks['get_key_down'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput("KEY")
        .appendField(Blockly.Msg['KEY_DOWN_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          ["🡅", "ArrowUp"],
          ["🡇", "ArrowDown"],
          ["🡄", "ArrowLeft"],
          ["🡆", "ArrowRight"],
          ["🅐", "KeyA"],
          ["🅑", "KeyB"],
          ["🅧", "KeyX"],
          ["🅨", "KeyY"],
          ["🅛", "KeyL"],
          ["🅡", "KeyR"],
          ["🆉🅛", "KeyZL"],
          ["🆉🅡", "KeyZR"],
          ["➕", "KeyPlus"],
          ["➖", "KeyMinus"]
        ]), "KEY");
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAMEPAD_NUM'])
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setFieldValue("ArrowUp", "KEY");
    this.setFieldValue("0", "JOY_ID");
  }
};


// Блок проверки нажатия клавиши
Blockly.Blocks['get_key_pressed'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput("KEY")
        .appendField(Blockly.Msg['KEY_PRESSED_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          ["🡅", "ArrowUp"],
          ["🡇", "ArrowDown"],
          ["🡄", "ArrowLeft"],
          ["🡆", "ArrowRight"],
          ["🅐", "KeyA"],
          ["🅑", "KeyB"],
          ["🅧", "KeyX"],
          ["🅨", "KeyY"],
          ["🅛", "KeyL"],
          ["🅡", "KeyR"],
          ["🆉🅛", "KeyZL"],
          ["🆉🅡", "KeyZR"],
          ["➕", "KeyPlus"],
          ["➖", "KeyMinus"]
        ]), "KEY");
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAMEPAD_NUM'])
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setFieldValue("0", "JOY_ID");
  }
};

Blockly.Blocks['game_vibrate'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['VIBRATE_TITLE']);
    
    // Поле для длительности вибрации
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField(Blockly.Msg['VIBRATE_DURATION']);
        
    // Поле для силы слабого мотора (по умолчанию 0.5)
    this.appendValueInput("WEAK")
        .setCheck("Number")
        .appendField(Blockly.Msg['VIBRATE_WEAK']);
        
    // Поле для силы сильного мотора (по умолчанию 0.5)
    this.appendValueInput("STRONG")
        .setCheck("Number")
        .appendField(Blockly.Msg['VIBRATE_STRONG']);
        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setTooltip(Blockly.Msg['VIBRATE_TOOLTIP']);
  }
};

// Блок получения значения оси

Blockly.Blocks['get_axes'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput("KEY")
        .appendField(Blockly.Msg['GET_AXIS_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          ["ось0", "0"],
          ["ось1", "1"],
          ["ось2", "2"],
          ["ось3", "3"]
        ]), "KEY");
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAMEPAD_NUM'])
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setFieldValue("0", "JOY_ID");
  }
};

// Блок "Движение (наклон)" — датчик движения Joy-Con / геймпада.
Blockly.Blocks['get_motion'] = {
  init: function() {
    this.setColour(60);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.appendDummyInput()
        .appendField(Blockly.Msg['MOTION_LABEL'] || 'движение')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['MOTION_ACCEL_X'] || 'наклон X', '0'],
          [Blockly.Msg['MOTION_ACCEL_Y'] || 'наклон Y', '1'],
          [Blockly.Msg['MOTION_ACCEL_Z'] || 'наклон Z', '2'],
          [Blockly.Msg['MOTION_GYRO_X'] || 'вращение X', '3'],
          [Blockly.Msg['MOTION_GYRO_Y'] || 'вращение Y', '4'],
          [Blockly.Msg['MOTION_GYRO_Z'] || 'вращение Z', '5']
        ]), 'AXIS');
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAMEPAD_NUM'] || 'геймпад')
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]
        ]), "JOY_ID");
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setTooltip(function() {
      var ru = typeof savedLanguage !== 'undefined' && savedLanguage === 'ru';
      return ru ? 'Датчик движения Joy-Con (акселерометр/гироскоп). Наклон: -1 до 1 (1 = земная гравитация).' : 'Joy-Con motion sensor (accelerometer/gyroscope). Tilt: -1 to 1 (1 = Earth gravity).';
    }.bind(this));
  }
};

Blockly.Blocks['camera_follow'] = {
  init: function() {
    this.setInputsInline(true);
    this.setColour(190);
    
    // Основной заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['CAMERA_FOLLOW_LABEL']);
    
    // Поле выбора объекта
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'OBJECT')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    
    // Плавность следования
    const smoothInput = this.appendValueInput("SMOOTH")
        .setCheck("Number")
        .appendField(Blockly.Msg['CAMERA_SMOOTH_LABEL']);
    
    // Теневой блок для значения по умолчанию (0.1)
    const shadowSmooth = this.workspace.newBlock('math_number');
    shadowSmooth.setFieldValue('0.1', 'NUM');
    smoothInput.connection.connect(shadowSmooth.outputConnection);
    shadowSmooth.setShadow(true);
    
    // Смещение камеры по X
    const offsetXInput = this.appendValueInput("OFFSET_X")
        .setCheck("Number")
        .appendField(Blockly.Msg['CAMERA_OFFSET_X']);
    
    // Теневой блок для значения по умолчанию (0)
    const shadowOffsetX = this.workspace.newBlock('math_number');
    shadowOffsetX.setFieldValue('0', 'NUM');
    offsetXInput.connection.connect(shadowOffsetX.outputConnection);
    shadowOffsetX.setShadow(true);
    
    // Смещение камеры по Y
    const offsetYInput = this.appendValueInput("OFFSET_Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['CAMERA_OFFSET_Y']);
    
    // Теневой блок для значения по умолчанию (0)
    const shadowOffsetY = this.workspace.newBlock('math_number');
    shadowOffsetY.setFieldValue('0', 'NUM');
    offsetYInput.connection.connect(shadowOffsetY.outputConnection);
    shadowOffsetY.setShadow(true);
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#camera');
  }
};

Blockly.Blocks['get_window_position'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_WINDOW_POSITION_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_PARAM_X'], 'X'],
          [Blockly.Msg['OBJECT_PARAM_Y'], 'Y']
        ]), 'AXIS');
    this.setOutput(true, 'Number');
    this.setColour(190);
    this.setInputsInline(true);
    this.setTooltip(Blockly.Msg['GET_WINDOW_POSITION_TOOLTIP']);
    this.setHelpUrl("");
  }
};

// Блок рисования точки
Blockly.Blocks['draw_point'] = {
  init: function() {
    this.setColour(30);
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_POINT_LABEL']);
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
    this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок рисования линии
Blockly.Blocks['draw_line'] = {
  init: function() {
    this.setColour(30);
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_LINE_LABEL']);
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
    this.appendValueInput("X1")
        .setCheck("Number")
        .appendField("X1");
    this.appendValueInput("Y1")
        .setCheck("Number")
        .appendField("Y1");
    this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

Blockly.Blocks['draw_triangle'] = {
  init: function() {
    this.setColour(30);
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_TRIANGLE_LABEL']);
    this.appendValueInput("X1")
        .setCheck("Number")
        .appendField("X1");
    this.appendValueInput("Y1")
        .setCheck("Number")
        .appendField("Y1");
    this.appendValueInput("X2")
        .setCheck("Number")
        .appendField("X2");
    this.appendValueInput("Y2")
        .setCheck("Number")
        .appendField("Y2");
    this.appendValueInput("X3")
        .setCheck("Number")
        .appendField("X3");
    this.appendValueInput("Y3")
        .setCheck("Number")
        .appendField("Y3");
    this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldCheckbox("FALSE"), "FILLED")
        .appendField(Blockly.Msg['FILL_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок для прямоугольника (с опцией заливки)
Blockly.Blocks['draw_rect'] = {
  init: function() {
    this.setColour(30);
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_RECT_LABEL']);
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
    this.appendValueInput("Width")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH']);
    this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
    this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldCheckbox("FALSE"), "FILLED")
        .appendField(Blockly.Msg['FILL_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};

// Блок выбора цвета
Blockly.Blocks['field_colour'] = {
  init: function() {
    this.setOutput(true, 'Colour');
    this.setColour(30);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    this.appendDummyInput()
      .appendField(Blockly.Msg['COLOR_LABEL'])
      .appendField(new FieldColour('#000000', null, {
        colourOptions: [
          // Красные оттенки (плавный переход от тёмного к светлому)
          '#2c0000', '#580000', '#850000', '#b10000', '#de0000', '#ff0000', '#ff4d4d', '#ff9999',       
          // Оранжевые оттенки
          '#331900', '#663300', '#994d00', '#cc6600', '#ff8000', '#ff9933', '#ffb366', '#ffcc99',  
          // Жёлтые оттенки
          '#332500', '#664b00', '#997200', '#cc9900', '#ffbf00', '#ffcc33', '#ffd966', '#ffe599',  
          // Зелёные оттенки
          '#002c00', '#005800', '#008500', '#00b100', '#00de00', '#00ff00', '#4dff4d', '#99ff99',
          // Голубые/бирюзовые оттенки
          '#002c2c', '#005858', '#008585', '#00b1b1', '#00dede', '#00ffff', '#4dffff', '#99ffff',
          // Синие оттенки
          '#00002c', '#000058', '#000085', '#0000b1', '#0000de', '#0000ff', '#4d4dff', '#9999ff',
          // Фиолетовые оттенки
          '#1a002c', '#330058', '#4d0085', '#6600b1', '#8000de', '#9900ff', '#b34dff', '#cc99ff',
          // Розовые/пурпурные оттенки
          '#2c001a', '#580033', '#85004d', '#b10066', '#de0080', '#ff0099', '#ff4db3', '#ff99cc',
                  // Градиент от чёрного к белому 
          '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#b3b3b3', '#ffffff'
        ],
        columns: 8
      }), 'FIELDCOLOUR');
  }
};

// Блок рисования текста
Blockly.Blocks['draw_text'] = {
  init: function() {
    this.setColour(30);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    
    // Основные поля
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_TEXT_LABEL']);
    
    this.appendValueInput("Str")
        .setCheck("String")
        .appendField(Blockly.Msg['TEXT_LABEL']);
    
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
    
    // Размер текста (число 24 по умолчанию)
    const sizeInput = this.appendValueInput("Size")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
    
    const shadowBlockSize = this.workspace.newBlock('math_number');
    shadowBlockSize.setFieldValue('24', 'NUM');
    sizeInput.connection.connect(shadowBlockSize.outputConnection);
    shadowBlockSize.setShadow(true);
    
    // Цвет текста (используем ваш field_colour как shadow block)
    const colourInput = this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    
    // Создаем теневой блок на основе field_colour
    const shadowBlockColour = this.workspace.newBlock('field_colour');
    shadowBlockColour.setFieldValue('#FFFFFF', 'FIELDCOLOUR'); // Используем ваш ID поля
    colourInput.connection.connect(shadowBlockColour.outputConnection);
    shadowBlockColour.setShadow(true);
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Блок рисования изображения
Blockly.Blocks['draw_image'] = {
  init: function() {
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    this.setColour(30);
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_IMAGE_LABEL']);
    this.appendValueInput("Image")
        .setCheck("Number")
        .appendField(Blockly.Msg['IMAGE_LABEL']);
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
    this.appendValueInput("Width")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH']);
        this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Блок проверки столкновений
Blockly.Blocks['collision_detect'] = {
  init: function() {
    this.setColour(190);
    this.appendDummyInput()
        .appendField(Blockly.Msg['COLLISION_DETECT_LABEL']);
    this.appendValueInput("X1")
        .setCheck("Number")
        .appendField(Blockly.Msg['SQUARE1_LABEL'] + " x");
    this.appendValueInput("Y1")
        .setCheck("Number")
        .appendField(Blockly.Msg['SQUARE1_LABEL'] + " y");
    this.appendValueInput("Width1")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH'] + " 1");
    this.appendValueInput("Height1")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT'] + " 1");
    this.appendValueInput("X2")
        .setCheck("Number")
        .appendField(Blockly.Msg['SQUARE2_LABEL'] + " x");
    this.appendValueInput("Y2")
        .setCheck("Number")
        .appendField(Blockly.Msg['SQUARE2_LABEL'] + " y");
    this.appendValueInput("Width2")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH'] + " 2");
    this.appendValueInput("Height2")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT'] + " 2");
    this.setOutput(true, 'Boolean');
  }
};

// Блок очистки экрана
Blockly.Blocks['clear_screen'] = {
  init: function() {
    this.setColour(30);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    this.appendDummyInput()
        .appendField(Blockly.Msg['CLEAR_SCREEN_LABEL']);
    const colourInput = this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
        // Создаем теневой блок на основе field_colour
    const shadowBlockColour = this.workspace.newBlock('field_colour');
    shadowBlockColour.setFieldValue('#000000', 'FIELDCOLOUR'); // Используем ваш ID поля
    colourInput.connection.connect(shadowBlockColour.outputConnection);
    shadowBlockColour.setShadow(true);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Блок редактора музыки
Blockly.defineBlocksWithJsonArray([{
  "type": "music_block",
  "message0": Blockly.Msg['MUSIC_EDITOR_LABEL'] + " %1",
  "args0": [{
    "type": "field_music",
    "name": "MUSIC_FIELD"
  }],
  "output": "String",
  "colour": 60
}]);

// Блок редактора звука
Blockly.defineBlocksWithJsonArray([{
  "type": "audio_block",
  "message0": Blockly.Msg['SOUND_EDITOR_LABEL'] + " %1",
  "args0": [
    {
      "type": "field_wav_editor",
      "name": "AUDIO",
      "value": ""
    }
  ],
  "output": "Number",
  "colour": 60
}]);

// Блок воспроизведения музыки
Blockly.Blocks['play_music'] = {
  init: function() {
    // Основная инициализация блока
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['PLAY_MUSIC_LABEL']);
    
    this.appendValueInput("String")
        .setCheck("String")
        .appendField(Blockly.Msg['MUSIC_LABEL']);
    
    // Создаем input для длительности
    const durationInput = this.appendValueInput("Number")
        .setCheck("Number")
        .appendField(Blockly.Msg['DURATION_LABEL']);

    // Создаем теневой блок
    const shadowBlock = this.workspace.newBlock('math_number');
    shadowBlock.setShadow(true);
    shadowBlock.setFieldValue('120', 'NUM');
    
    // Подключаем тень (универсальный способ)
    durationInput.connection.connect(shadowBlock.outputConnection);

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Блок воспроизведения музыки
Blockly.Blocks['play_sound'] = {
  init: function() {
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['PLAY_SOUND_LABEL']);
    this.appendValueInput("Number")
        .setCheck("Number")
        .appendField(Blockly.Msg['MUSIC_LABEL']);

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

//редактор уровней
Blockly.Blocks['level_editor'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg['LEVEL_EDITOR_LABEL'])
      .appendField(new FieldLevelEditor('{"objects": [],"tiles": [],"width": 800,"height": 600,"gridSize": 32}', null, {}), 'LEVEL_DATA');
        this.appendValueInput("TILESET")
        .setCheck("field_png")
        .appendField(Blockly.Msg['LEVEL_EDITOR_TILESET']);
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
        this.setInputsInline(true);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

Blockly.Blocks['set_tile'] = {
  init: function() {
        this.appendValueInput("TILESET")
        .setCheck("field_png")
        .appendField(Blockly.Msg['LEVEL_EDITOR_TILESET']);
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
        this.setInputsInline(true);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Генератор кода для блока проверки столкновения с тайлом
Blockly.Blocks['is_colliding_with_tile'] = {
  init: function() {
    this.setColour(210);
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    
    // Выбор типа объекта
    this.appendDummyInput()
        .appendField(Blockly.Msg['IS_COLLIDING_WITH_TILE_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'], ' object'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
        ]), 'OBJECT_TYPE');
    
    // Поле для ID тайла
    this.appendValueInput("TILE_ID")
        .setCheck("Number");
    
    this.setTooltip(Blockly.Msg['IS_COLLIDING_WITH_TILE_TOOLTIP']);
    this.setHelpUrl("");
  }
};

// Блоки для паузы
Blockly.Blocks['game_pause'] = {
  init: function() {
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.appendDummyInput()
                .appendField(Blockly.Msg['PAUSE_RESUME_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['PAUSE_PAUSE'], 'PAUSE'],
          [Blockly.Msg['PAUSE_RESUME'], 'RESUME']
        ]), 'ACTION');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg['PAUSE_TOOLTIP']);
  }
};

Blockly.Blocks['is_paused'] = {
  init: function() {
    this.setColour(210);
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    
    // Выбор типа объекта
    this.appendDummyInput()
        .appendField(Blockly.Msg['IS_PAUSED_LABEL']);
    this.setHelpUrl("");
  }
};

// Блоки для работы с фоном
Blockly.Blocks['set_background'] = {
  init: function() {
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_BACKGROUND_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['BACKGROUND_MODE_STRETCH'], '0'],
          [Blockly.Msg['BACKGROUND_MODE_TILE'], '1']
        ]), 'MODE');
    this.appendValueInput("SPRITE")
        .setCheck("Number")
        .appendField(Blockly.Msg['SPRITE_LABEL']);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg['SET_BACKGROUND_TOOLTIP']);
  }
};

Blockly.Blocks['set_background_xy'] = {
  init: function() {
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['SET_BACKGROUND_XY_LABEL_X']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['SET_BACKGROUND_XY_LABEL_Y']);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg['SET_BACKGROUND_XY_TOOLTIP']);
  }
};

// Генератор кода для блока получения информации о тайле
Blockly.Blocks['get_colliding_tile_info'] = {
  init: function() {
    this.setColour(340);
    this.setInputsInline(true);
    this.setOutput(true, null);
    
    // Выбор типа объекта
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_COLLIDING_TILE_INFO_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'], 'object'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
        ]), 'OBJECT_TYPE');
    
    // Выбор типа информации
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['TILE_COL_LABEL'], 'col'],
          [Blockly.Msg['TILE_ROW_LABEL'], 'row'],
          [Blockly.Msg['TILE_ID_LABEL'], 'tileId'],
          [Blockly.Msg['TILE_X_LABEL'], 'tileX'],
          [Blockly.Msg['TILE_Y_LABEL'], 'tileY']
        ]), 'INFO_TYPE');
    
    // Индекс тайла (по умолчанию первый)
    this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField(Blockly.Msg['TILE_INDEX_LABEL']);
    
    this.setTooltip(Blockly.Msg['GET_COLLIDING_TILE_INFO_TOOLTIP']);
    this.setHelpUrl("");
  }
};

Blockly.Blocks['get_tile_at'] = {
  init: function() {
    this.setColour(60);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_TILE_AT_LABEL']);
    
    // Координата X
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['COL']);
    
    // Координата Y
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['ROW']);
    
    // Только твердые тайлы
    this.appendDummyInput()
        .appendField(Blockly.Msg['SOLID_ONLY_LABEL'])
        .appendField(new Blockly.FieldCheckbox(false), 'SOLID_ONLY');
    
    this.setTooltip(Blockly.Msg['GET_TILE_AT_TOOLTIP']);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

Blockly.Blocks['set_tile_at'] = {
  init: function() {
    this.setColour(60);
    this.setInputsInline(true);
    
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_TILE_AT_LABEL']);
    
    // Координата X
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['COL']);
    
    // Координата Y
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['ROW']);
    
    // ID тайла
    this.appendValueInput("TILE_ID")
        .setCheck("Number")
        .appendField(Blockly.Msg['TILE_ID_LABEL']);
    
    // Твердость тайла
    this.appendDummyInput()
        .appendField(Blockly.Msg['IS_SOLID_LABEL'])
        .appendField(new Blockly.FieldCheckbox(false), 'IS_SOLID');
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setTooltip(Blockly.Msg['SET_TILE_AT_TOOLTIP']);
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

// Блок ввода JS кода
Blockly.Blocks['field_multilineinput'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg['JS_CODE_LABEL'])
      .appendField(new FieldMultilineInput('"some code";'), 'FIELDSCRIPT');
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// ==================== Блоки таймеров ====================

Blockly.Blocks['set_interval'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_INTERVAL_LABEL']);
    this.appendStatementInput("CALLBACK")
        .setCheck(null)
        .appendField(Blockly.Msg['CALLBACK_LABEL']);
    this.appendValueInput("INTERVAL")
        .setCheck("Number")
        .appendField(Blockly.Msg['INTERVAL_MS_LABEL']);
    this.setOutput(true, "Number");
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setTooltip(Blockly.Msg['SET_INTERVAL_TOOLTIP']);
  }
};

Blockly.Blocks['clear_interval'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CLEAR_INTERVAL_LABEL']);
    this.appendValueInput("TIMER_ID")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setTooltip(Blockly.Msg['CLEAR_INTERVAL_TOOLTIP']);
  }
};

Blockly.Blocks['set_timer'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_TIMER_LABEL']);
    this.appendStatementInput("BODY")
        .setCheck(null)
        .appendField(Blockly.Msg['EXECUTE_LABEL']);
    this.appendValueInput("time")
        .setCheck("Number")
        .appendField(Blockly.Msg['TIMER_TIME_LABEL']);
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================== //
function rebuildProtoObjectArray() {
    // 1. Очищаем массивы
    proto_object_array = [];
    object_array = [];

    // 2. Находим все блоки типа 'new_proto_object' и 'new_object'
    const blocks = workspace.getAllBlocks();
    const protoBlocks = blocks.filter(block => block.type === 'new_proto_object');
    const objectBlocks = blocks.filter(block => block.type === 'new_object');

    // 3. Заполняем массив прототипов с проверкой дубликатов
    const usedProtoNames = new Set();
    for (const block of protoBlocks) {
        const objectName = block.getFieldValue('Object');
        if (!objectName || objectName === 'null') continue;

        if (usedProtoNames.has(objectName)) {
            showSwitchModal('error', Blockly.Msg['ALERT_DUPLICAT'].replace('%1', workspace.getVariableById(objectName).name), false, 'ok');
        }
        usedProtoNames.add(objectName);

        const spriteBlock = block.getInputTargetBlock('Sprite');
        let spriteValue = '';
        if (spriteBlock && spriteBlock.type === 'field_png') {
            spriteValue = spriteBlock.getField('IMAGE').getValue();
        }

        proto_object_array.push({
            name: objectName,
            width: getNumberValue(block, 'Width'),
            height: getNumberValue(block, 'Height'),
            sprite: spriteValue,
            onCreate: getConnectedBlocks(block, 'ONCREATE'),
            blockId: block.id
        });
    }

    // 4. Заполняем массив объектов
    const usedObjectNames = new Set();
    for (const block of objectBlocks) {
        const objectName = block.getFieldValue('Object');
        if (!objectName || objectName === 'null') continue;

        if (usedObjectNames.has(objectName)) {
            showSwitchModal('error', Blockly.Msg['ALERT_DUPLICAT'].replace('%1', workspace.getVariableById(objectName).name), false, 'ok');
        }
        usedObjectNames.add(objectName);

        const x = getNumberValue(block, 'X');
        const y = getNumberValue(block, 'Y');
        const width = getNumberValue(block, 'Width');
        const height = getNumberValue(block, 'Height');
        
        let spriteValue = '';
        if (block.type === 'new_object') {
            const spriteBlock = block.getInputTargetBlock('Sprite');
            if (spriteBlock && spriteBlock.type === 'field_png') {
                spriteValue = spriteBlock.getField('IMAGE').getValue();
            }
        }

        object_array.push({
            name: objectName,
            x: x,
            y: y,
            width: width,
            height: height,
            sprite: spriteValue,
            onCreate: getConnectedBlocks(block, 'ONCREATE'),
            blockId: block.id,
            isProto: block.type === 'new_object_from_proto'
        });
    }
}

function getNumberValue(block, inputName) {
  const inputBlock = block.getInputTargetBlock(inputName);
  if (!inputBlock) return 0;
  return Number(inputBlock.getFieldValue('NUM')) || 0;
}

function getConnectedBlocks(block, inputName) {
  const result = [];
  let currentBlock = block.getInputTargetBlock(inputName);
  
  while (currentBlock) {
    result.push({
      type: currentBlock.type,
      fields: getBlockFields(currentBlock)
    });
    currentBlock = currentBlock.getNextBlock();
  }
  
  return result;
}

function getBlockFields(block) {
  const fields = {};
  for (const fieldName in block.fields_) {
    fields[fieldName] = block.getFieldValue(fieldName);
  }
  return fields;
}

function objectExists(name, excludeBlockId = null) {
  return proto_object_array.some(obj => 
    obj.name === name && (!excludeBlockId || obj.blockId !== excludeBlockId)
  );
}

function generateUniqueName(baseName) {
  let newName = baseName;
  let counter = 1;
  while (objectExists(newName)) {
    newName = `${baseName}_${counter++}`;
  }
  return newName;
}
// ================== ОПРЕДЕЛЕНИЕ БЛОКА ================== //

Blockly.Blocks['new_proto_object'] = {
  init: function() {
        this.variableId = null;
    this.setColour(340);
    this.appendDummyInput()
        .appendField(Blockly.Msg['NEW_PROTO_OBJECT_LABEL']);
    
    // Генерируем уникальное имя переменной
    const varName = this.generateUniqueVarName('prototype');
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable(varName), 'Object');
    
    // Остальные поля блока
    const widthInput = this.appendValueInput("Width")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH']);
    const shadowBlockWidth = this.workspace.newBlock('math_number');
    shadowBlockWidth.setFieldValue('32', 'NUM');
    widthInput.connection.connect(shadowBlockWidth.outputConnection);
    shadowBlockWidth.setShadow(true);
        
    const heightInput = this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
        const shadowBlockHeight = this.workspace.newBlock('math_number');
    shadowBlockHeight.setFieldValue('32', 'NUM');
    heightInput.connection.connect(shadowBlockHeight.outputConnection);
    shadowBlockHeight.setShadow(true);  
        
    this.appendValueInput("Sprite")
        .setCheck("type_sprite")
        .appendField(Blockly.Msg['IMAGE_LABEL']);
    this.appendStatementInput("ONCREATE")
        .setCheck(null)
        .appendField(Blockly.Msg['ON_CREATE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");

    this.originalName = varName;
    
    // Валидатор имени переменной
    this.getField('Object').setValidator(newName => {
      if (!newName) return this.originalName;
      
      const variableField = this.getField('Object');
      const currentVar = variableField.getVariable();
      
      if (currentVar) {
        this.variableId = currentVar.value; // Сохраняем ID переменной
      }
      
      // Проверяем существование переменной с таким именем
      const allVars = this.workspace.getAllVariables();
      const nameExists = allVars.some(v => 
        v.name === newName && 
        (!currentVar || v.getId() !== currentVar.getId())
      );
      
      if (nameExists) {
        console.warn(`Переменная "${newName}" уже существует!`);
        return this.originalName;
      }
      
      this.originalName = newName;
      return newName;
    });
  },

  /**
   * Генерирует уникальное имя переменной
   */
  generateUniqueVarName: function(baseName) {
    const workspace = this.workspace || Blockly.getMainWorkspace();
    let counter = 1;
    let newName = baseName + counter;
    
    // Получаем все существующие переменные
    const allVars = workspace.getAllVariables();
    
    while (allVars.some(v => v.name === newName)) {
      counter++;
      newName = baseName + counter;
    }
    
    return newName;
  },
        
  saveExtraState: function() {
    const variable = this.getField('Object').getVariable();
    return {
      varId: variable ? variable.getId() : null,
      originalName: this.originalName
    };
  },

  loadExtraState: function(state) {
    const workspace = this.workspace;
    let variable;
        this.variableId = state.varId;
    
    // Восстанавливаем переменную
    if (state.varId) {
      variable = workspace.getVariableById(state.varId);
    }
    
    if (!variable) {
      // Создаем новую переменную с уникальным именем
      const varName = state.originalName || this.generateUniqueVarName('prototype');
      variable = workspace.createVariable(varName);
    }
    
    this.originalName = variable.name;
    this.setFieldValue(variable.name, 'Object');
  }
};

Blockly.Blocks['field_png'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['SPRITE_EDITOR_LABEL']);
    this.appendDummyInput()
        .appendField(new FieldImageEditor(
            null,
            null,
            { alt: "Edit Image", tooltip: "Click to edit image" }
        ), "IMAGE");
    this.setOutput(true, null);
    this.setColour(30);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    this.setInputsInline(true);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['object_animation'] = {
  init: function() {
    this.setColour(30);
    this.setInputsInline(false);
    
    // Основной заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['OBJECT_ANIMATION_LABEL'] || 'Анимация объекта');
    
    // Поле выбора объекта
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'OBJECT')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'] || 'Объект:');
    
    // Список кадров анимации
    this.appendValueInput("FRAMES")
        .setCheck("Array")
        .appendField(Blockly.Msg['ANIMATION_FRAMES_LABEL'] || 'Кадры:');
    
    // Скорость анимации
    const speedInput = this.appendValueInput("SPEED")
        .setCheck("Number")
        .appendField(Blockly.Msg['ANIMATION_SPEED_LABEL'] || 'Скорость (кадров/сек):');
    
    // Теневой блок для значения по умолчанию (10)
    const shadowSpeed = this.workspace.newBlock('math_number');
    shadowSpeed.setFieldValue('10', 'NUM');
    speedInput.connection.connect(shadowSpeed.outputConnection);
    shadowSpeed.setShadow(true);
    
    // Опция зацикливания
    this.appendDummyInput()
        .appendField(Blockly.Msg['ANIMATION_LOOP_LABEL'] || 'Зациклить:')
        .appendField(new Blockly.FieldCheckbox("TRUE"), 'LOOP');
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setTooltip(Blockly.Msg['ANIMATION_TOOLTIP'] || 'Управление анимацией объекта');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
  }
};
// ================== ИНТЕГРАЦИОННЫЕ ФУНКЦИИ ================== //

function getProtoObjects() {
  return proto_object_array;
}

function resetProtoObjects() {
  proto_object_array = [];
  console.log('Массив объектов сброшен');
}
// Блок создания объекта
Blockly.Blocks['new_object'] = {
  init: function() {
    this.setColour(340);
    this.appendDummyInput()
        .appendField(Blockly.Msg['NEW_OBJECT_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object');
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['POSITION_X_LABEL']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['POSITION_Y_LABEL']);
    
    const widthInput = this.appendValueInput("Width")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH']);
    const shadowBlockWidth = this.workspace.newBlock('math_number');
    shadowBlockWidth.setFieldValue('32', 'NUM');
    widthInput.connection.connect(shadowBlockWidth.outputConnection);
    shadowBlockWidth.setShadow(true);
    
    const heightInput = this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
    const shadowBlockHeight = this.workspace.newBlock('math_number');
    shadowBlockHeight.setFieldValue('32', 'NUM');
    heightInput.connection.connect(shadowBlockHeight.outputConnection);
    shadowBlockHeight.setShadow(true);    
    
    this.appendValueInput("Sprite")
        .setCheck("type_sprite")
        .appendField(Blockly.Msg['IMAGE_LABEL']);
    this.appendStatementInput("ONCREATE")
        .setCheck(null)
        .appendField(Blockly.Msg['ON_CREATE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    
    // Добавляем обработчик изменений для обновления object_array
    this.setOnChange(function(changeEvent) {
        if (!changeEvent.blockId || changeEvent.blockId === this.id) {
            rebuildProtoObjectArray();
        }
    });
  }
};

Blockly.Blocks['new_object_from_proto'] = {
  init: function() {
    this.setColour(340);
        this.appendDummyInput()
        .appendField(Blockly.Msg['NEW_OBJECT_FROM_PROTO_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('prototype1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CLONE_OBJECT_LABEL2']);
        this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object2');
        this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['POSITION_X_LABEL']);
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['POSITION_Y_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};
// ==================== Блоки объектов ====================

// ─── Joint blocks ───
// Helper: creates the object-selection dropdown used by all joint blocks.
// Mirrors the style of 'set_object_bounding' (FieldVariable with 'Object' type).
function _jointAddObjectInputs(block) {
  block.appendDummyInput('OBJ_INPUT_A')
    .appendField(Blockly.Msg['OBJECT_A'] || 'obj A')
    .appendField(new Blockly.FieldVariable('obj1', null, null, 'Object'), 'OBJ_A');
  block.appendDummyInput('OBJ_INPUT_B')
    .appendField(Blockly.Msg['OBJECT_B'] || 'obj B')
    .appendField(new Blockly.FieldVariable('obj2', null, null, 'Object'), 'OBJ_B');
}

Blockly.Blocks['create_pivot_joint'] = {
  init: function() {
    this.setColour(190);
    this.setInputsInline(true);
    this.appendDummyInput()
      .appendField(Blockly.Msg['CREATE_PIVOT_JOINT'] || 'pivot joint')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg['JOINT_MODE_CENTER'] || 'center', 'CENTER'],
        [Blockly.Msg['JOINT_MODE_MANUAL'] || 'manual', 'MANUAL']
      ], this.updateShape_.bind(this)), 'MODE');
    _jointAddObjectInputs(this);
    this.appendDummyInput('MANUAL_INPUT')
      .appendField(Blockly.Msg['PIVOT_X'] || 'pivot X')
      .appendField(new Blockly.FieldNumber(0), 'PX')
      .appendField(Blockly.Msg['PIVOT_Y'] || 'Y')
      .appendField(new Blockly.FieldNumber(0), 'PY')
      .setVisible(false);
    this.setOutput(true, null);
  },
  updateShape_: function(mode) {
    this.getInput('MANUAL_INPUT').setVisible(mode === 'MANUAL');
    if (this.workspace) this.initSvg();
  },
  mutationToDom: function() {
    var c = document.createElement('mutation');
    c.setAttribute('mode', this.getFieldValue('MODE'));
    return c;
  },
  domToMutation: function(xml) {
    this.updateShape_(xml.getAttribute('mode') || 'CENTER');
  }
};

Blockly.Blocks['create_slide_joint'] = {
  init: function() {
    this.setColour(190);
    this.setInputsInline(true);
    this.appendDummyInput()
      .appendField(Blockly.Msg['CREATE_SLIDE_JOINT'] || 'slide joint')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg['JOINT_MODE_CENTER'] || 'center', 'CENTER'],
        [Blockly.Msg['JOINT_MODE_MANUAL'] || 'manual', 'MANUAL']
      ], this.updateShape_.bind(this)), 'MODE');
    _jointAddObjectInputs(this);
    this.appendDummyInput('MANUAL_INPUT')
      .appendField('AX').appendField(new Blockly.FieldNumber(0), 'AX')
      .appendField('AY').appendField(new Blockly.FieldNumber(0), 'AY')
      .appendField('BX').appendField(new Blockly.FieldNumber(0), 'BX')
      .appendField('BY').appendField(new Blockly.FieldNumber(0), 'BY')
      .setVisible(false);
    this.appendValueInput("MIN").setCheck("Number").appendField(Blockly.Msg['MIN_DIST'] || 'min');
    this.appendValueInput("MAX").setCheck("Number").appendField(Blockly.Msg['MAX_DIST'] || 'max');
    this.setOutput(true, null);
  },
  updateShape_: function(mode) {
    this.getInput('MANUAL_INPUT').setVisible(mode === 'MANUAL');
    if (this.workspace) this.initSvg();
  },
  mutationToDom: function() {
    var c = document.createElement('mutation');
    c.setAttribute('mode', this.getFieldValue('MODE'));
    return c;
  },
  domToMutation: function(xml) {
    this.updateShape_(xml.getAttribute('mode') || 'CENTER');
  }
};

Blockly.Blocks['create_gear_joint'] = {
  init: function() {
    this.setColour(190);
    this.setInputsInline(true);
    this.appendDummyInput().appendField(Blockly.Msg['CREATE_GEAR_JOINT'] || 'gear joint');
    _jointAddObjectInputs(this);
    this.appendValueInput("PHASE").setCheck("Number").appendField(Blockly.Msg['PHASE'] || 'phase');
    this.appendValueInput("RATIO").setCheck("Number").appendField(Blockly.Msg['RATIO'] || 'ratio');
    this.setOutput(true, null);
  }
};

Blockly.Blocks['remove_joint'] = {
  init: function() {
    this.setColour(190);
    this.setInputsInline(true);
    this.appendDummyInput()
      .appendField(Blockly.Msg['REMOVE_JOINT'] || 'remove joint')
      .appendField(new Blockly.FieldVariable('joint1'), 'JOINT');
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// CHAIN — creates a vertical chain of objects from a prototype.
// Mode: LOOSE (hangs vertically from start point, top link is static),
//   or ATTACHED (first link is jointed to an existing object/prototype).
Blockly.Blocks['create_chain'] = {
  init: function() {
    this.setColour(190);
    this.setInputsInline(false);
    this.appendDummyInput()
      .appendField(Blockly.Msg['CREATE_CHAIN'] || 'create chain')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg['CHAIN_MODE_LOOSE'] || 'loose', 'LOOSE'],
        [Blockly.Msg['CHAIN_MODE_ATTACHED'] || 'attached to', 'ATTACHED']
      ], this.updateShape_.bind(this)), 'MODE');
    this.appendDummyInput('PROTO_INPUT')
      .appendField(Blockly.Msg['OBJECT_A'] || 'obj A')
      .appendField(new Blockly.FieldVariable('obj1', null, null, 'Object'), 'OBJ');
    this.appendDummyInput('START_INPUT')
      .appendField(Blockly.Msg['START_X'] || 'start X')
      .appendField(new Blockly.FieldNumber(0), 'SX')
      .appendField('Y')
      .appendField(new Blockly.FieldNumber(0), 'SY');
    this.appendDummyInput('ATTACH_INPUT')
      .appendField(Blockly.Msg['ATTACH_TO'] || 'attach to')
      .appendField(new Blockly.FieldVariable('obj2', null, null, 'Object'), 'ATTACH')
      .setVisible(false);
    this.appendDummyInput('COUNT_INPUT')
      .appendField(Blockly.Msg['COUNT'] || 'count')
      .appendField(new Blockly.FieldNumber(5, 1, 50), 'COUNT');
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  },
  updateShape_: function(mode) {
    this.getInput('START_INPUT').setVisible(mode !== 'ATTACHED');
    this.getInput('ATTACH_INPUT').setVisible(mode === 'ATTACHED');
    if (this.workspace) this.initSvg();
  },
  mutationToDom: function() {
    var c = document.createElement('mutation');
    c.setAttribute('mode', this.getFieldValue('MODE'));
    return c;
  },
  domToMutation: function(xml) {
    this.updateShape_(xml.getAttribute('mode') || 'LOOSE');
  }
};

// Блок "Есть ли тайлы между точками/объектами" — ray cast.
// Проверяет линию между двумя точками (или объектами) на наличие твёрдых тайлов.
// Возвращает: true/false (есть ли стена) или координаты первого тайла-стены.
Blockly.Blocks['raycast_tiles'] = {
  init: function() {
    this.setColour(210);
    this.setInputsInline(true);
    this.setOutput(true, ['Boolean', 'Number']);

    // Режим возврата: булево или координаты
    this.appendDummyInput()
        .appendField(Blockly.Msg['RAYCAST_LABEL'] || 'Тайлы между');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['RAYCAST_MODE_BOOL'] || 'есть ли стена', 'BOOL'],
          [Blockly.Msg['RAYCAST_MODE_X'] || 'X стены', 'X'],
          [Blockly.Msg['RAYCAST_MODE_Y'] || 'Y стены', 'Y']
        ]), 'RETURN_MODE');

    // Точка A: по координатам, объекту или this
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['RAYCAST_POINT'] || 'точка', 'POINT'],
          [Blockly.Msg['RAYCAST_OBJECT'] || 'объект', 'OBJECT'],
          [Blockly.Msg['RAYCAST_THIS'] || 'этот объект', 'THIS']
        ], (newVal) => this.updateShapeA_(newVal)), 'MODE_A');
    this.appendDummyInput('VAR_A_INPUT')
        .appendField(new Blockly.FieldVariable('obj1'), 'OBJ_A')
        .setVisible(false);
    this.appendValueInput("AX")
        .setCheck("Number")
        .appendField('X1');
    this.appendValueInput("AY")
        .setCheck("Number")
        .appendField('Y1');

    this.appendDummyInput()
        .appendField(Blockly.Msg['AND_LABEL'] || 'и');

    // Точка B: по координатам, объекту или this
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['RAYCAST_POINT'] || 'точка', 'POINT'],
          [Blockly.Msg['RAYCAST_OBJECT'] || 'объект', 'OBJECT'],
          [Blockly.Msg['RAYCAST_THIS'] || 'этот объект', 'THIS']
        ], (newVal) => this.updateShapeB_(newVal)), 'MODE_B');
    this.appendDummyInput('VAR_B_INPUT')
        .appendField(new Blockly.FieldVariable('obj2'), 'OBJ_B')
        .setVisible(false);
    this.appendValueInput("BX")
        .setCheck("Number")
        .appendField('X2');
    this.appendValueInput("BY")
        .setCheck("Number")
        .appendField('Y2');

    // Теневые блоки
    var shadowAX = this.workspace.newBlock('math_number');
    shadowAX.setFieldValue('0', 'NUM'); shadowAX.setShadow(true); shadowAX.initSvg();
    this.getInput('AX').connection.connect(shadowAX.outputConnection); shadowAX.render();
    var shadowAY = this.workspace.newBlock('math_number');
    shadowAY.setFieldValue('0', 'NUM'); shadowAY.setShadow(true); shadowAY.initSvg();
    this.getInput('AY').connection.connect(shadowAY.outputConnection); shadowAY.render();
    var shadowBX = this.workspace.newBlock('math_number');
    shadowBX.setFieldValue('100', 'NUM'); shadowBX.setShadow(true); shadowBX.initSvg();
    this.getInput('BX').connection.connect(shadowBX.outputConnection); shadowBX.render();
    var shadowBY = this.workspace.newBlock('math_number');
    shadowBY.setFieldValue('100', 'NUM'); shadowBY.setShadow(true); shadowBY.initSvg();
    this.getInput('BY').connection.connect(shadowBY.outputConnection); shadowBY.render();

    this.setTooltip(function() {
      var ru = typeof savedLanguage !== 'undefined' && savedLanguage === 'ru';
      return ru
        ? 'Проверяет линию между двумя точками/объектами на наличие твёрдых тайлов. Возвращает true/false (есть стена) или X/Y первого тайла-стены.'
        : 'Checks the line between two points/objects for solid tiles. Returns true/false (wall found) or X/Y of the first wall tile.';
    }.bind(this));

    this.updateShapeA_(this.getFieldValue('MODE_A') || 'POINT');
    this.updateShapeB_(this.getFieldValue('MODE_B') || 'POINT');
  },

  updateShapeA_: function(mode) {
    var vi = this.getInput('VAR_A_INPUT');
    var xi = this.getInput('AX'), yi = this.getInput('AY');
    if (vi) vi.setVisible(mode === 'OBJECT');
    if (xi) xi.setVisible(mode === 'POINT');
    if (yi) yi.setVisible(mode === 'POINT');
    // THIS — ни переменная, ни координаты не нужны.
  },

  updateShapeB_: function(mode) {
    var vi = this.getInput('VAR_B_INPUT');
    var xi = this.getInput('BX'), yi = this.getInput('BY');
    if (vi) vi.setVisible(mode === 'OBJECT');
    if (xi) xi.setVisible(mode === 'POINT');
    if (yi) yi.setVisible(mode === 'POINT');
  },

  saveExtraState: function() {
    return { modeA: this.getFieldValue('MODE_A'), modeB: this.getFieldValue('MODE_B') };
  },

  loadExtraState: function(state) {
    if (!state) return;
    if (state.modeA) { this.setFieldValue(state.modeA, 'MODE_A'); this.updateShapeA_(state.modeA); }
    if (state.modeB) { this.setFieldValue(state.modeB, 'MODE_B'); this.updateShapeB_(state.modeB); }
  }
};

// ===== ПАТРУЛИРОВАНИЕ =====
Blockly.Blocks['enemy_patrol'] = {
  init: function() {
    this.setColour(190); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['PATROL_LABEL'] || 'Патрулировать');
    var modeField = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'] || 'конкретного', 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'] || 'этого объекта', 'THIS']
    ], (newMode) => this.updateShape_(newMode));
    this.appendDummyInput('MODE_INPUT').appendField(modeField, 'MODE');
    this.appendDummyInput('VAR_INPUT').appendField(new Blockly.FieldVariable('obj1'), 'Object');
    this.appendValueInput("X1").setCheck("Number").appendField('X1');
    this.appendValueInput("Y1").setCheck("Number").appendField('Y1');
    this.appendValueInput("X2").setCheck("Number").appendField('X2');
    this.appendValueInput("Y2").setCheck("Number").appendField('Y2');
    this.appendValueInput("SPEED").setCheck("Number").appendField(Blockly.Msg['SPEED_LABEL'] || 'скорость');
    var sx = this.workspace.newBlock('math_number'); sx.setFieldValue('0','NUM'); sx.setShadow(true); sx.initSvg();
    this.getInput('X1').connection.connect(sx.outputConnection); sx.render();
    var sy = this.workspace.newBlock('math_number'); sy.setFieldValue('0','NUM'); sy.setShadow(true); sy.initSvg();
    this.getInput('Y1').connection.connect(sy.outputConnection); sy.render();
    var sx2 = this.workspace.newBlock('math_number'); sx2.setFieldValue('100','NUM'); sx2.setShadow(true); sx2.initSvg();
    this.getInput('X2').connection.connect(sx2.outputConnection); sx2.render();
    var sy2 = this.workspace.newBlock('math_number'); sy2.setFieldValue('0','NUM'); sy2.setShadow(true); sy2.initSvg();
    this.getInput('Y2').connection.connect(sy2.outputConnection); sy2.render();
    var ss = this.workspace.newBlock('math_number'); ss.setFieldValue('3','NUM'); ss.setShadow(true); ss.initSvg();
    this.getInput('SPEED').connection.connect(ss.outputConnection); ss.render();
    this.setTooltip(function(){var ru=typeof savedLanguage!=='undefined'&&savedLanguage==='ru';return ru?'Патрулирует между двумя точками с разворотом спрайта.':'Patrols between two points with sprite flip.';}.bind(this));
    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },
  updateShape_: function(newMode) { var vi = this.getInput('VAR_INPUT'); if (vi) vi.setVisible(newMode === 'VAR'); },
  saveExtraState: function() { return { mode: this.getFieldValue('MODE') }; },
  loadExtraState: function(state) { if (state && state.mode) { this.setFieldValue(state.mode, 'MODE'); this.updateShape_(state.mode); } }
};

// ===== ЗДОРОВЬЕ =====
// Общий миксин для выбора объекта (this / object / collided)
var _objSelectDropdown = function(onChange) {
  return new Blockly.FieldDropdown([
    [Blockly.Msg['OBJECT_TYPE_THIS'] || 'этот объект', 'this'],
    [Blockly.Msg['OBJECT_TYPE_COLLIDED'] || 'столкнувшийся объект', ' object'],
    [Blockly.Msg['OBJECT_TYPE_ITERATED'] || 'полученный при переборе', 'object']
  ], onChange);
};

Blockly.Blocks['object_health'] = {
  init: function() {
    this.setColour(340); this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.appendDummyInput().appendField(Blockly.Msg['HEALTH_LABEL'] || 'здоровье')
      .appendField(new Blockly.FieldDropdown([
        [Blockly.Msg['HEALTH_GET'] || 'получить', 'GET'],
        [Blockly.Msg['HEALTH_SET'] || 'установить', 'SET'],
        [Blockly.Msg['HEALTH_ADD'] || 'изменить', 'ADD']
      ], (newMode) => this.updateShape_(newMode)), 'MODE');
    this.appendDummyInput().appendField(_objSelectDropdown(null), 'OBJ_TYPE');
    this.appendValueInput("VALUE").setCheck("Number").appendField(Blockly.Msg['VALUE_LABEL'] || 'значение');
    this.getInput('VALUE').setVisible(false);
  },
  updateShape_: function(mode) { this.getInput('VALUE').setVisible(mode !== 'GET'); },
  saveExtraState: function() { return { mode: this.getFieldValue('MODE'), objType: this.getFieldValue('OBJ_TYPE') }; },
  loadExtraState: function(state) {
    if (!state) return;
    if (state.mode) { this.setFieldValue(state.mode, 'MODE'); this.updateShape_(state.mode); }
    if (state.objType) this.setFieldValue(state.objType, 'OBJ_TYPE');
  }
};
Blockly.Blocks['object_take_damage'] = {
  init: function() {
    this.setColour(340); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['TAKE_DAMAGE_LABEL'] || 'получить урон')
      .appendField(_objSelectDropdown(null), 'OBJ_TYPE');
    this.appendValueInput("DAMAGE").setCheck("Number").appendField(Blockly.Msg['DAMAGE_LABEL'] || 'урон');
    this.appendValueInput("IFRAMES").setCheck("Number").appendField(Blockly.Msg['IFRAMES_LABEL'] || 'неуязвимость');
    var sd = this.workspace.newBlock('math_number'); sd.setFieldValue('10','NUM'); sd.setShadow(true); sd.initSvg();
    this.getInput('DAMAGE').connection.connect(sd.outputConnection); sd.render();
    var si = this.workspace.newBlock('math_number'); si.setFieldValue('30','NUM'); si.setShadow(true); si.initSvg();
    this.getInput('IFRAMES').connection.connect(si.outputConnection); si.render();
  }
};
Blockly.Blocks['object_heal'] = {
  init: function() {
    this.setColour(340); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['HEAL_LABEL'] || 'вылечить')
      .appendField(_objSelectDropdown(null), 'OBJ_TYPE');
    this.appendValueInput("AMOUNT").setCheck("Number").appendField(Blockly.Msg['AMOUNT_LABEL'] || 'количество');
    var sa = this.workspace.newBlock('math_number'); sa.setFieldValue('10','NUM'); sa.setShadow(true); sa.initSvg();
    this.getInput('AMOUNT').connection.connect(sa.outputConnection); sa.render();
  }
};
Blockly.Blocks['object_is_alive'] = {
  init: function() {
    this.setColour(210); this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.appendDummyInput().appendField(Blockly.Msg['IS_ALIVE_LABEL'] || 'жив')
      .appendField(_objSelectDropdown(null), 'OBJ_TYPE');
  }
};

// ===== ДВИГАТЬСЯ В НАПРАВЛЕНИИ =====
Blockly.Blocks['move_in_direction'] = {
  init: function() {
    this.setColour(190); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['MOVE_DIR_LABEL'] || 'двигаться в направлении');
    this.appendDummyInput().appendField(_objSelectDropdown(null), 'OBJ_TYPE');
    this.appendValueInput("ANGLE").setCheck("Number").appendField(Blockly.Msg['ANGLE_LABEL'] || 'угол');
    this.appendValueInput("SPEED").setCheck("Number").appendField(Blockly.Msg['SPEED_LABEL'] || 'скорость');
    var sa = this.workspace.newBlock('math_number'); sa.setFieldValue('0','NUM'); sa.setShadow(true); sa.initSvg();
    this.getInput('ANGLE').connection.connect(sa.outputConnection); sa.render();
    var ss = this.workspace.newBlock('math_number'); ss.setFieldValue('3','NUM'); ss.setShadow(true); ss.initSvg();
    this.getInput('SPEED').connection.connect(ss.outputConnection); ss.render();
  }
};

// ===== МЕНЮ ПАУЗЫ =====
Blockly.Blocks['pause_menu'] = {
  init: function() {
    this.setColour(30); this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.appendDummyInput().appendField(Blockly.Msg['PAUSE_MENU_LABEL'] || 'меню паузы');
    this.appendValueInput("TITLE").setCheck("String").appendField(Blockly.Msg['TITLE_LABEL'] || 'заголовок');
    this.appendValueInput("ITEMS").setCheck(null).appendField(Blockly.Msg['ITEMS_LABEL'] || 'пункты (список)');
    this.appendValueInput("COLOR").setCheck(null).appendField(Blockly.Msg['MENU_COLOR_LABEL'] || 'цвет');
    this.appendValueInput("WIDTH").setCheck("Number").appendField(Blockly.Msg['MENU_WIDTH_LABEL'] || 'ширина');
    this.appendValueInput("FSIZE").setCheck("Number").appendField(Blockly.Msg['MENU_FSIZE_LABEL'] || 'шрифт');
    var st = this.workspace.newBlock('text'); st.setFieldValue('Пауза','TEXT'); st.setShadow(true); st.initSvg();
    this.getInput('TITLE').connection.connect(st.outputConnection); st.render();
    var sc = this.workspace.newBlock('field_colour'); sc.setFieldValue('#1a1a3e','FIELDCOLOUR'); sc.setShadow(true); sc.initSvg();
    this.getInput('COLOR').connection.connect(sc.outputConnection); sc.render();
    var sw = this.workspace.newBlock('math_number'); sw.setFieldValue('400','NUM'); sw.setShadow(true); sw.initSvg();
    this.getInput('WIDTH').connection.connect(sw.outputConnection); sw.render();
    var sf = this.workspace.newBlock('math_number'); sf.setFieldValue('18','NUM'); sf.setShadow(true); sf.initSvg();
    this.getInput('FSIZE').connection.connect(sf.outputConnection); sf.render();
  }
};

// ===== СНАРЯДЫ =====
Blockly.Blocks['spawn_projectile'] = {
  init: function() {
    this.setColour(340); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['PROJECTILE_LABEL'] || 'создать снаряд');
    this.appendDummyInput().appendField(Blockly.Msg['PROJECTILE_PROTO'] || 'прототип')
      .appendField(new Blockly.FieldVariable('proj'), 'PROTO');
    this.appendValueInput("X").setCheck("Number").appendField('X');
    this.appendValueInput("Y").setCheck("Number").appendField('Y');
    this.appendValueInput("ANGLE").setCheck("Number").appendField(Blockly.Msg['ANGLE_LABEL'] || 'угол');
    this.appendValueInput("SPEED").setCheck("Number").appendField(Blockly.Msg['SPEED_LABEL'] || 'скорость');
    this.appendValueInput("DAMAGE").setCheck("Number").appendField(Blockly.Msg['DAMAGE_LABEL'] || 'урон');
    var sx = this.workspace.newBlock('math_number'); sx.setFieldValue('0','NUM'); sx.setShadow(true); sx.initSvg();
    this.getInput('X').connection.connect(sx.outputConnection); sx.render();
    var sy = this.workspace.newBlock('math_number'); sy.setFieldValue('0','NUM'); sy.setShadow(true); sy.initSvg();
    this.getInput('Y').connection.connect(sy.outputConnection); sy.render();
    var sa = this.workspace.newBlock('math_number'); sa.setFieldValue('0','NUM'); sa.setShadow(true); sa.initSvg();
    this.getInput('ANGLE').connection.connect(sa.outputConnection); sa.render();
    var ss = this.workspace.newBlock('math_number'); ss.setFieldValue('5','NUM'); ss.setShadow(true); ss.initSvg();
    this.getInput('SPEED').connection.connect(ss.outputConnection); ss.render();
    var sd = this.workspace.newBlock('math_number'); sd.setFieldValue('10','NUM'); sd.setShadow(true); sd.initSvg();
    this.getInput('DAMAGE').connection.connect(sd.outputConnection); sd.render();
  }
};

// ===== UI =====
Blockly.Blocks['ui_button'] = {
  init: function() {
    this.setColour(30); this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.appendDummyInput().appendField(Blockly.Msg['UI_BUTTON_LABEL'] || 'кнопка');
    this.appendValueInput("TEXT").setCheck("String").appendField(Blockly.Msg['TEXT_LABEL'] || 'текст');
    this.appendValueInput("X").setCheck("Number").appendField('X');
    this.appendValueInput("Y").setCheck("Number").appendField('Y');
    this.appendValueInput("W").setCheck("Number").appendField('W');
    this.appendValueInput("H").setCheck("Number").appendField('H');
    this.appendValueInput("KEY").setCheck("String").appendField(Blockly.Msg['KEY_LABEL'] || 'клавиша');
    var st = this.workspace.newBlock('text'); st.setFieldValue('OK','TEXT'); st.setShadow(true); st.initSvg();
    this.getInput('TEXT').connection.connect(st.outputConnection); st.render();
    var sx = this.workspace.newBlock('math_number'); sx.setFieldValue('100','NUM'); sx.setShadow(true); sx.initSvg();
    this.getInput('X').connection.connect(sx.outputConnection); sx.render();
    var sy = this.workspace.newBlock('math_number'); sy.setFieldValue('100','NUM'); sy.setShadow(true); sy.initSvg();
    this.getInput('Y').connection.connect(sy.outputConnection); sy.render();
    var sw = this.workspace.newBlock('math_number'); sw.setFieldValue('80','NUM'); sw.setShadow(true); sw.initSvg();
    this.getInput('W').connection.connect(sw.outputConnection); sw.render();
    var sh = this.workspace.newBlock('math_number'); sh.setFieldValue('30','NUM'); sh.setShadow(true); sh.initSvg();
    this.getInput('H').connection.connect(sh.outputConnection); sh.render();
    var sk = this.workspace.newBlock('text'); sk.setFieldValue('KeyA','TEXT'); sk.setShadow(true); sk.initSvg();
    this.getInput('KEY').connection.connect(sk.outputConnection); sk.render();
  }
};
Blockly.Blocks['draw_health_bar'] = {
  init: function() {
    this.setColour(30); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['HEALTH_BAR_LABEL'] || 'полоса здоровья');
    this.appendValueInput("X").setCheck("Number").appendField('X');
    this.appendValueInput("Y").setCheck("Number").appendField('Y');
    this.appendValueInput("W").setCheck("Number").appendField('W');
    this.appendValueInput("CURRENT").setCheck("Number").appendField(Blockly.Msg['CURRENT_LABEL'] || 'текущее');
    this.appendValueInput("MAX").setCheck("Number").appendField(Blockly.Msg['MAX_LABEL'] || 'максимум');
    var sx = this.workspace.newBlock('math_number'); sx.setFieldValue('10','NUM'); sx.setShadow(true); sx.initSvg();
    this.getInput('X').connection.connect(sx.outputConnection); sx.render();
    var sy = this.workspace.newBlock('math_number'); sy.setFieldValue('10','NUM'); sy.setShadow(true); sy.initSvg();
    this.getInput('Y').connection.connect(sy.outputConnection); sy.render();
    var sw = this.workspace.newBlock('math_number'); sw.setFieldValue('60','NUM'); sw.setShadow(true); sw.initSvg();
    this.getInput('W').connection.connect(sw.outputConnection); sw.render();
    var sc = this.workspace.newBlock('math_number'); sc.setFieldValue('50','NUM'); sc.setShadow(true); sc.initSvg();
    this.getInput('CURRENT').connection.connect(sc.outputConnection); sc.render();
    var sm = this.workspace.newBlock('math_number'); sm.setFieldValue('100','NUM'); sm.setShadow(true); sm.initSvg();
    this.getInput('MAX').connection.connect(sm.outputConnection); sm.render();
  }
};

// ===== СПЛИТ СКРИН =====
Blockly.Blocks['split_screen'] = {
  init: function() {
    this.setColour(190); this.setInputsInline(true);
    this.setPreviousStatement(true, "Array"); this.setNextStatement(true, "Array");
    this.appendDummyInput().appendField(Blockly.Msg['SPLIT_SCREEN_LABEL'] || 'сплит скрин')
      .appendField(new Blockly.FieldCheckbox("FALSE"), "ENABLE");
    this.appendDummyInput().appendField(Blockly.Msg['PLAYER1_LABEL'] || 'игрок 1');
    this.appendDummyInput().appendField(new Blockly.FieldVariable('obj1'), 'P1');
    this.appendDummyInput().appendField(Blockly.Msg['PLAYER2_LABEL'] || 'игрок 2');
    this.appendDummyInput().appendField(new Blockly.FieldVariable('obj2'), 'P2');
  }
};

Blockly.Blocks['clone_object'] = {
  init: function() {
    this.setColour(340);
        this.setInputsInline(true);
        this.appendDummyInput()
        .appendField(Blockly.Msg['CLONE_OBJECT_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CLONE_OBJECT_LABEL2']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj2'), 'Object2');
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

Blockly.Blocks['game_copy_state'] = {
  init: function() {
    this.setColour(340);
    this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAME_COPY_STATE_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('source'), 'SOURCE')
        .appendField(Blockly.Msg['GAME_COPY_STATE_TO']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('target'), 'TARGET');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  }
};

Blockly.Blocks['draw_object'] = {
  init: function() {
    this.setColour(30);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#drawing');
    this.appendDummyInput()
        .appendField(Blockly.Msg['DRAW_SPRITE_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

Blockly.Blocks['change_object_var'] = {
  init: function() {
    // Основное поле с выбором режима
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CHANGE_PARAM_LABEL'] || 'Изменить параметр:')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'] || 'По переменной', 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'] || 'Столкнувшийся объект', ' object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'] || 'Этот объект', 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'] || 'Итерируемый объект', 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    // Поле для выбора переменной (изначально скрыто)
    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'] || 'Объект:')
        .setVisible(false);

    // Поле для выбора параметра (writable — excludes prev_x/prev_y etc.)
    // Колбэк onChange обновляет тип входа VALUE и shadow-блок при смене
    // выбранного свойства (например, при выборе "видимость" автоматически
    // появится блок "Да/Нет", а при выборе "скорость X" — числовой блок).
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(
          ObjectParamWritable,
          (function(newParam) {
            this.updateValueType_(newParam);
          }).bind(this)
        ), 'NAME');

    // Поле для значения.
    // Изначально создаётся с типом Number — это тип первого свойства
    // в списке ObjectParamWritable (x), но updateValueType_ ниже его
    // сразу подправит под актуальный параметр.
    this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField(Blockly.Msg['VALUE_LABEL'] || 'Значение:');

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);

    // Динамическая подсказка: при наведении на блок показывается описание
    // и диапазон значений для текущего выбранного свойства.
    //
    // ВАЖНО: Blockly вызывает функцию подсказки как a=a() — БЕЗ привязки
    // this к блоку. Поэтому нужно явно привязать this через .bind(this),
    // иначе this будет undefined и this.getFieldValue('NAME') выбросит
    // "this.getFieldValue is not a function". Именно так делает встроенный
    // хелпер Blockly.Extensions.buildTooltipForDropdown (см. ядро Blockly).
    this.setTooltip(function() {
      return getObjectParamTooltip(this.getFieldValue('NAME'));
    }.bind(this));

    // Инициализация видимости
    this.updateShape_(this.getFieldValue('MODE'));
    // Подбираем shadow-блок и тип входа под параметр по умолчанию.
    this.updateValueType_(this.getFieldValue('NAME'));
  },

  // Обновляет тип входа VALUE и подключённый к нему shadow-блок
  // в зависимости от выбранного свойства (paramName).
  // Если к входу уже подключён обычный (не shadow) блок пользователя —
  // не трогаем его, чтобы не разрушать пользовательскую программу.
  updateValueType_: function(paramName) {
    var paramType = getObjectParamType(paramName);
    var valueInput = this.getInput('VALUE');
    if (!valueInput || !valueInput.connection) return;

    // Проверяем, что к входу подключён именно shadow (или ничего).
    // Если подключён реальный блок — оставляем как есть.
    var targetBlock = valueInput.connection.targetBlock();
    if (targetBlock && !targetBlock.isShadow()) {
      // Пользователь сам подключил блок — оставляем его. Только при необходимости
      // расширяем setCheck, чтобы соединение не разорвалось при смене типа.
      // Ничего не делаем: тип valueInput сохранён в saveExtraState/загрузке.
      return;
    }

    // Соответствие типа свойства → имя shadow-блока и его настройки.
    // shadowConfig: { blockType, fieldName, fieldValue, outputCheck }
    //   - blockType: какой блок создать как shadow
    //   - fieldName / fieldValue: какое поле и какое значение выставить
    //   - outputCheck: какой тип подключения требовать от входа VALUE
    //                  (null = принимать любой тип)
    var shadowConfig;
    switch (paramType) {
      case 'boolean':
        // Блок "Да/Нет" генерирует 1/0 — идеально для числовых булевых свойств.
        shadowConfig = {
          blockType: 'logic_boolean_yesno',
          fieldName: 'BOOL',
          fieldValue: 'TRUE',
          outputCheck: ['Boolean', 'Number']
        };
        break;
      case 'number':
        shadowConfig = {
          blockType: 'math_number',
          fieldName: 'NUM',
          fieldValue: '0',
          outputCheck: 'Number'
        };
        break;
      case 'string':
        shadowConfig = {
          blockType: 'text',
          fieldName: 'TEXT',
          fieldValue: '',
          outputCheck: 'String'
        };
        break;
      case 'sprite':
        // Спрайт — это числовой индекс в image_array, но выбирается
        // визуально через field_png. Поэтому shadow = field_png.
        shadowConfig = {
          blockType: 'field_png',
          fieldName: null, // field_png использует поле IMAGE без дефолта
          fieldValue: null,
          outputCheck: ['Number', 'field_png']
        };
        break;
      default:
        // 'any' — без shadow, принимаем любой тип.
        shadowConfig = null;
    }

    // Отключаем и удаляем старый shadow (если был).
    if (targetBlock && targetBlock.isShadow()) {
      targetBlock.dispose(false);
    }

    if (!shadowConfig) {
      // 'any' — снимаем ограничение типа.
      valueInput.setCheck(null);
      return;
    }

    // Устанавливаем ограничение типа для входа VALUE.
    valueInput.setCheck(shadowConfig.outputCheck);

    // Создаём новый shadow-блок и подключаем его к VALUE.
    // Blockly.Workspace.newBlock создаёт блок, но не рендерит его —
    // нужно вызвать initSvg + render после подключения.
    var shadow = this.workspace.newBlock(shadowConfig.blockType);
    if (shadowConfig.fieldName !== null) {
      shadow.setFieldValue(shadowConfig.fieldValue, shadowConfig.fieldName);
    }
    shadow.setShadow(true);
    shadow.initSvg();
    valueInput.connection.connect(shadow.outputConnection);
    shadow.render();
    // Перерисовываем текущий блок, чтобы корректно отобразить новый shadow.
    this.render();
  },

  updateShape_: function(selectedMode) {
    // Получаем поле ввода переменной
    var varInput = this.getInput('VAR_INPUT');

    // Показываем только если выбран режим VAR
    if (varInput) {
      varInput.setVisible(selectedMode === 'VAR');

      // Если нужно, можно обновить список переменных
      if (selectedMode === 'VAR') {
        var varField = this.getField('VAR_NAME');
        if (varField && varField.initModel) {
          varField.initModel();
        }
      }
    }
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      varName: this.getFieldValue('VAR_NAME')
    };
  },

  loadExtraState: function(state) {
    if (state) {
      this.setFieldValue(state.mode || 'VAR', 'MODE');
      if (state.varName) {
        this.setFieldValue(state.varName, 'VAR_NAME');
      }
      this.updateShape_(state.mode || 'VAR');
      // Восстанавливаем тип входа VALUE и shadow под текущий параметр.
      this.updateValueType_(this.getFieldValue('NAME'));
    }
  }
};

// Блок "Да/Нет" — аналог стандартного блока "истина/ложь" (logic_boolean),
// но с подписями "Да/Нет" (Yes/No в английской локали) и генерацией 1/0
// вместо true/false. Полезен для свойств объекта, которые хранят
// булевы значения как числа (flip, visible, solid, animationLoop и т.п.).
Blockly.Blocks['logic_boolean_yesno'] = {
  init: function() {
    // Используем тот же стиль, что и у стандартного logic_boolean —
    // setStyle('logic_blocks') гарантирует точное совпадение цвета
    // (включая border/secondary) с другими блоками категории "Логика"
    // и корректно отрабатывает при смене темы.
    this.setStyle('logic_blocks');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['LOGIC_YESNO_TRUE'] || 'Да', 'TRUE'],
          [Blockly.Msg['LOGIC_YESNO_FALSE'] || 'Нет', 'FALSE']
        ]), 'BOOL');
    // Тот же тип выхода, что и у logic_boolean — может подключаться к любому
    // входу, ожидающему Boolean, Number или Array.
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg['LOGIC_YESNO_TOOLTIP'] || 'Возвращает 1 (Да) или 0 (Нет).');
    this.setHelpUrl(Blockly.Msg['LOGIC_BOOLEAN_HELPURL'] || '');
  }
};

// Блок для проверки имени объекта
Blockly.Blocks['if_object_name_equals'] = {
  init: function() {
    this.setColour(210);
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    
    // Основная структура блока
    this.appendDummyInput()
        .appendField(Blockly.Msg['IF_OBJECT_NAME_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['IF_OBJECT_TYPE_COLLIDED'], ' object'],
          [Blockly.Msg['IF_OBJECT_TYPE_ITERATED'], 'object'],
          [Blockly.Msg['IF_OBJECT_TYPE_THIS'], 'this']
        ]), 'OBJECT_TYPE');
    
    // Вход для имени объекта (вместо текстового поля)
    const nameInput = this.appendValueInput("NAME")
        .setCheck("String")
        .appendField(Blockly.Msg['IF_OBJECT_NAME_EQUALS']);
    
    // Добавляем теневой блок строки по умолчанию
    const shadowBlock = this.workspace.newBlock('text');
    shadowBlock.setFieldValue('prototype1', 'TEXT');
    shadowBlock.setShadow(true);
    nameInput.connection.connect(shadowBlock.outputConnection);
    
    this.setTooltip("Проверяет, совпадает ли имя объекта с указанным");
    this.setHelpUrl("");
  }
};


// Блок для получения значения параметра объекта
Blockly.Blocks['get_object_var'] = {
  init: function() {
        this.setInputsInline(true);
    // Основное поле с выбором режима
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_PARAM_LABEL'] || 'Получить параметр:')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'] || 'По переменной', 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'] || 'Столкнувшийся объект', ' object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'] || 'Этот объект', 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'] || 'Итерируемый объект', 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    // Поле для выбора переменной (изначально скрыто)
    this.appendDummyInput('VAR_INPUT')
                .appendField(Blockly.Msg['OBJECT_NAME_LABEL'] || 'Объект:')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .setVisible(false);

    // Поле для выбора параметра
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(ObjectParam), 'NAME');

    this.setOutput(true, ['Number', 'Boolean', 'String']);
    this.setColour(340);

    // Инициализация видимости
    this.updateShape_(this.getFieldValue('MODE'));
  },

  updateShape_: function(selectedMode) {
    var varInput = this.getInput('VAR_INPUT');
    if (varInput) {
      varInput.setVisible(selectedMode === 'VAR');
      
      if (selectedMode === 'VAR') {
        var varField = this.getField('VAR_NAME');
        if (varField && varField.initModel) {
          varField.initModel();
        }
      }
    }
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      varName: this.getFieldValue('VAR_NAME')
    };
  },

  loadExtraState: function(state) {
    if (state) {
      this.setFieldValue(state.mode || 'VAR', 'MODE');
      if (state.varName) {
        this.setFieldValue(state.varName, 'VAR_NAME');
      }
      this.updateShape_(state.mode || 'VAR');
    }
  }
};

// Блок для добавления значения к параметру объекта
Blockly.Blocks['addto_object_var'] = {
  init: function() {
        this.setInputsInline(true);
    // Основное поле с выбором режима
    this.appendDummyInput()
        .appendField(Blockly.Msg['ADD_TO_PARAM_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'], ' object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    // Поле для выбора переменной (изначально скрыто)
    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'])
        .setVisible(false);

    // Поле для выбора параметра (writable — excludes prev_x/prev_y etc.)
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(ObjectParamWritable), 'NAME');

    // Поле для значения
    this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField(Blockly.Msg['VALUE_LABEL'] || 'Значение:');

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);

    // Инициализация видимости
    this.updateShape_(this.getFieldValue('MODE'));
  },

  updateShape_: function(selectedMode) {
    var varInput = this.getInput('VAR_INPUT');
    if (varInput) {
      varInput.setVisible(selectedMode === 'VAR');
      
      if (selectedMode === 'VAR') {
        var varField = this.getField('VAR_NAME');
        if (varField && varField.initModel) {
          varField.initModel();
        }
      }
    }

    
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      varName: this.getFieldValue('VAR_NAME')
    };
  },

  loadExtraState: function(state) {
    if (state) {
      this.setFieldValue(state.mode || 'VAR', 'MODE');
      if (state.varName) {
        this.setFieldValue(state.varName, 'VAR_NAME');
      }
      this.updateShape_(state.mode || 'VAR');
    }
  }
};

Blockly.Blocks['set_object_bounding'] = {
  init: function() {
    this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CHANGE_BOUNDING_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'], 'object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'],
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'])
        .setVisible(false);

    this.appendDummyInput()
        .appendField(Blockly.Msg['COLLISION_SHAPE_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['COLLISION_AUTO'], '0'],
          [Blockly.Msg['COLLISION_RECTANGLE'], '1'],
          [Blockly.Msg['COLLISION_CIRCLE_AUTO'], '2'],
          [Blockly.Msg['COLLISION_CIRCLE_CUSTOM'], 'CUSTOM']
        ], this.updateCollisionShape_.bind(this)), 'COLLISION_SHAPE');

    this.widthInput = this.appendValueInput("WIDTH")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH']);

    this.heightInput = this.appendValueInput("HEIGHT")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);

    this.radiusInput = this.appendValueInput("CUSTOM_RADIUS")
        .setCheck("Number")
        .appendField(Blockly.Msg['CUSTOM_RADIUS_LABEL'])
        .setVisible(false);

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(190);
    this.updateShape_(this.getFieldValue('MODE'));
    this.updateCollisionShape_(this.getFieldValue('COLLISION_SHAPE'));
  },

  updateShape_: function(selectedMode) {
    this.getInput('VAR_INPUT').setVisible(selectedMode === 'VAR');
    if (selectedMode === 'VAR') {
      this.getField('VAR_NAME').initModel();
    }
  },

  updateCollisionShape_: function(selectedShape) {
    const showDimensions = selectedShape === '0' || selectedShape === '1';
    
    this.getInput('WIDTH').setVisible(showDimensions);
    this.getInput('HEIGHT').setVisible(showDimensions);
    this.getInput('CUSTOM_RADIUS').setVisible(selectedShape === 'CUSTOM');
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      varName: this.getFieldValue('VAR_NAME'),
      collisionShape: this.getFieldValue('COLLISION_SHAPE')
    };
  },

  loadExtraState: function(state) {
    if (state) {
      this.setFieldValue(state.mode || 'VAR', 'MODE');
      if (state.varName) this.setFieldValue(state.varName, 'VAR_NAME');
      this.setFieldValue(state.collisionShape || '0', 'COLLISION_SHAPE');
      this.updateShape_(state.mode || 'VAR');
      this.updateCollisionShape_(state.collisionShape || '0');
    }
  }
};

Blockly.Blocks['object_onstep'] = {
  init: function() {
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['EACH_FRAME_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendStatementInput("BODY")
        .setCheck(null)
        .appendField(Blockly.Msg['EXECUTE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);
  }
};

Blockly.Blocks['object_ondraw'] = {
  init: function() {
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['ON_DRAW_LABEL'] || 'при отрисовке');
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendStatementInput("BODY")
        .setCheck(null)
        .appendField(Blockly.Msg['EXECUTE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);
  }
};

Blockly.Blocks['object_oncollision'] = {
  init: function() {
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['ON_COLLISION_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendStatementInput("BODY")
        .setCheck(null)
        .appendField(Blockly.Msg['EXECUTE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);
  }
};

Blockly.Blocks['delete_object'] = {
  init: function() {
        this.setInputsInline(true);
    // Основной заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['DELETE_OBJECT_LABEL']);

    // Переключатель режима (VAR/TYPE)
    this.appendDummyInput('MODE_INPUT')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'], ' object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    // Поле для выбора переменной
    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'])
        .setVisible(false);

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);

    // Инициализация видимости
    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },

  updateShape_: function(selectedMode) {
    var varInput = this.getInput('VAR_INPUT');
    if (varInput) {
      varInput.setVisible(selectedMode === 'VAR');
      
      // Инициализируем переменные при показе
      if (selectedMode === 'VAR') {
        var varField = this.getField('VAR_NAME');
        if (varField && varField.initModel) {
          varField.initModel();
        }
      }
    }

    
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      varName: this.getFieldValue('VAR_NAME')
    };
  },

  loadExtraState: function(state) {
    if (state) {
      this.setFieldValue(state.mode || 'VAR', 'MODE');
      if (state.varName) {
        this.setFieldValue(state.varName, 'VAR_NAME');
      }
      this.updateShape_(state.mode || 'VAR');
    }
  },

  onchange: function(event) {
    if (!this.workspace || event.type !== Blockly.Events.BLOCK_CHANGE) {
      return;
    }

    // Проверяем изменения переменных
    if (event.type === Blockly.Events.VAR_DELETE || 
        event.type === Blockly.Events.VAR_RENAME) {
      if (this.getFieldValue('MODE') === 'VAR') {
        var currentVar = this.getFieldValue('VAR_NAME');
        var variables = Blockly.Variables.allUsedVarModels(this.workspace) || [];
        var varExists = variables.some(v => v.name === currentVar);
        
        if (!varExists) {
          // Сбрасываем выбор, если переменная удалена
          this.setFieldValue(Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1', 'VAR_NAME');
        }
      }
    }
  }
};

// ==================== Блоки проверки состояния ====================

Blockly.Blocks['object_exit_screen'] = {
  init: function() {
        this.setInputsInline(true);
    // Сохраняем ссылки на все элементы
    this.varHeader = this.appendDummyInput('VAR_HEADER')
        .appendField(Blockly.Msg['OBJECT_OFFSCREEN_LABEL']);
    
    this.thisHeader = this.appendDummyInput('THIS_HEADER')
        .appendField(Blockly.Msg['THIS_OFFSCREEN_LABEL'])
        .setVisible(false);
    
    // Переключатель режима
    var modeField = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'], 'THIS']
    ], (newMode) => this.updateShape_(newMode));
    this.appendDummyInput('MODE_INPUT')
        .appendField(modeField, 'MODE');
    
    // Поле выбора переменной
    this.varField = this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    
    this.setOutput(true, 'Boolean');
    this.setColour(210);
    
    // Инициализация
    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },
  
  updateShape_: function(newMode) {
    // Получаем элементы по их ID
    var varHeader = this.getInput('VAR_HEADER');
    var thisHeader = this.getInput('THIS_HEADER');
    var varField = this.getInput('VAR_INPUT');
    
    // Управляем видимостью
    varHeader.setVisible(newMode === 'VAR');
    thisHeader.setVisible(newMode === 'THIS');
    varField.setVisible(newMode === 'VAR');
    
    // Перерисовка
    
  },
  
  saveExtraState: function() {
    return { mode: this.getFieldValue('MODE') };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode);
    this.setFieldValue(state.mode, 'MODE');
  }
};

Blockly.Blocks['object_tap_screen'] = {
  init: function() {
        this.setInputsInline(true);
    // Сохраняем ссылки на все элементы
    this.varHeader = this.appendDummyInput('VAR_HEADER')
        .appendField(Blockly.Msg['OBJECT_TAPSCREEN_LABEL']);
    
    this.thisHeader = this.appendDummyInput('THIS_HEADER')
        .appendField(Blockly.Msg['OBJECT_TAPSCREEN_LABEL'])
        .setVisible(false);
    
    // Переключатель режима
    var modeField = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'], 'THIS']
    ], (newMode) => this.updateShape_(newMode));
    this.appendDummyInput('MODE_INPUT')
        .appendField(modeField, 'MODE');
    
    // Поле выбора переменной
    this.varField = this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    
    this.setOutput(true, 'Boolean');
    this.setColour(210);
    
    // Инициализация
    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },
  
  updateShape_: function(newMode) {
    // Получаем элементы по их ID
    var varHeader = this.getInput('VAR_HEADER');
    var thisHeader = this.getInput('THIS_HEADER');
    var varField = this.getInput('VAR_INPUT');
    
    // Управляем видимостью
    varHeader.setVisible(newMode === 'VAR');
    thisHeader.setVisible(newMode === 'THIS');
    varField.setVisible(newMode === 'VAR');
    
    // Перерисовка
    
  },
  
  saveExtraState: function() {
    return { mode: this.getFieldValue('MODE') };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode);
    this.setFieldValue(state.mode, 'MODE');
  }
};

Blockly.Blocks['lists_append'] = {
  init: function() {
    this.appendValueInput('LIST')
        .setCheck('Array')
        .appendField(Blockly.Msg['LISTS_APPEND_TITLE']);
    this.appendValueInput('ITEM')
        .appendField(Blockly.Msg['LISTS_APPEND_ITEM']);
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg['LISTS_APPEND_TOOLTIP']);
    this.setHelpUrl('');
        this.setColour(255);
  }
};

Blockly.Blocks['lists_pop_last'] = {
  init: function() {
    this.appendValueInput('LIST')
        .setCheck('Array')
        .appendField(Blockly.Msg['LISTS_POP_LAST_TITLE']);
    this.setInputsInline(true);
    this.setOutput(true);
    this.setTooltip(Blockly.Msg['LISTS_POP_LAST_TOOLTIP']);
    this.setHelpUrl('');
        this.setColour(255);
  }
};
// ==================== Блоки управления объектами ====================

Blockly.Blocks['object_control'] = {
  init: function() {
    this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CONTROL_OBJECT_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'Object')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['ARROWS_LABEL'], 'key'],
          [Blockly.Msg['STICK0_LABEL'], 'stick0'],
          [Blockly.Msg['STICK1_LABEL'], 'stick1'],
          [Blockly.Msg['BOTH_LABEL'], 'both']
        ]), 'type');
    
    // Add gamepad number selection
    this.appendDummyInput()
        .appendField(Blockly.Msg['GAMEPAD_NUM'])
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), 'JOY_ID');

    const gameField = new Blockly.FieldDropdown([
      [Blockly.Msg['TDS_LABEL'], 'tds'],
      [Blockly.Msg['PLATFORMER_LABEL'], 'platform']
    ]);
    
    const gameInput = this.appendDummyInput()
        .appendField(gameField, 'game');
    
    this.jumpButtonInput = this.appendDummyInput()
        .appendField(Blockly.Msg['JUMP_BUTTON'])
        .appendField(new Blockly.FieldDropdown([
          ["🡅", "ArrowUp"],
          ["🅐", "KeyA"],
          ["🅑", "KeyB"],
          ["🅧", "KeyX"],
          ["🅨", "KeyY"]
        ]), 'jump_button');
    
    this.doubleJumpInput = this.appendDummyInput()
        .appendField(Blockly.Msg['DOUBLE_JUMP_LABEL'])
        .appendField(new Blockly.FieldCheckbox("FALSE"), 'double_jump');
    
    this.ladderSpeedInput = this.appendValueInput("ladderSpeed")
        .setCheck("Number")
        .appendField(Blockly.Msg['LADDER_SPEED_LABEL'] || 'ladder speed');
    
    this.appendValueInput("ValueX")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_SPEEDX']);
    this.appendValueInput("ValueY")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_SPEEDY']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(190);
    
    gameField.setValidator((newValue) => {
      this.updatePlatformerControlsVisibility(newValue);
      return newValue;
    });
    
    this.updatePlatformerControlsVisibility(this.getFieldValue('game'));
    this.setFieldValue("0", "JOY_ID");
  },
  
  updatePlatformerControlsVisibility: function(gameType) {
    const isPlatformer = gameType === 'platform';
    this.jumpButtonInput.setVisible(isPlatformer);
    this.doubleJumpInput.setVisible(isPlatformer);
    this.ladderSpeedInput.setVisible(isPlatformer);
    
    // Принудительно обновляем отображение блока
    if (this.workspace) {
      this.initSvg();
    }
  },
  
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('jump_button', this.getFieldValue('jump_button') || 'ArrowUp');
    container.setAttribute('game_type', this.getFieldValue('game'));
    container.setAttribute('double_jump', this.getFieldValue('double_jump'));
    return container;
  },
  
  domToMutation: function(xmlElement) {
    const jumpButton = xmlElement.getAttribute('jump_button');
    const gameType = xmlElement.getAttribute('game_type');
    const doubleJump = xmlElement.getAttribute('double_jump');
    
    if (jumpButton) {
      this.setFieldValue(jumpButton, 'jump_button');
    }
    if (gameType) {
      this.setFieldValue(gameType, 'game');
    }
    if (doubleJump) {
      this.setFieldValue(doubleJump, 'double_jump');
    }
    
    this.updatePlatformerControlsVisibility(this.getFieldValue('game'));
  },
  
  saveExtraState: function() {
    return {
      jump_button: this.getFieldValue('jump_button') || 'ArrowUp',
      game_type: this.getFieldValue('game'),
      double_jump: this.getFieldValue('double_jump')
    };
  },
  
  loadExtraState: function(state) {
    if (state.jump_button) {
      this.setFieldValue(state.jump_button, 'jump_button');
    }
    if (state.game_type) {
      this.setFieldValue(state.game_type, 'game');
    }
    if (state.double_jump) {
      this.setFieldValue(state.double_jump, 'double_jump');
    }
    this.updatePlatformerControlsVisibility(this.getFieldValue('game'));
  }
};

// Блок для мгновенного перемещения объекта
Blockly.Blocks['object_teleport'] = {
  init: function() {
    this.setInputsInline(true);
    this.setColour(190);
    
    // Основной заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['OBJECT_TELEPORT_LABEL']);
    
    // Поле выбора объекта для перемещения
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('obj1'), 'OBJECT');
    
    // Переключатель режима (координаты/объект)
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_TELEPORT_TO'], 'COORDS'],
          [Blockly.Msg['OBJECT_TELEPORT_TO_OBJECT'], 'OBJECT']
        ], this.updateShape_.bind(this)), 'MODE');
    
    // Поля для координат (по умолчанию видимые)
    this.appendValueInput("X")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X'])
        .setVisible(true);
    
    this.appendValueInput("Y")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y'])
        .setVisible(true);
    
    // Поле для целевого объекта (изначально скрытое)
    this.appendDummyInput("TARGET_OBJECT_INPUT")
        .appendField(new Blockly.FieldVariable('obj2'), 'TARGET_OBJECT')
        .setVisible(false);
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  },
  
  updateShape_: function(newMode) {
    // Управляем видимостью полей в зависимости от выбранного режима
    this.getInput('X').setVisible(newMode === 'COORDS');
    this.getInput('Y').setVisible(newMode === 'COORDS');
    this.getInput('TARGET_OBJECT_INPUT').setVisible(newMode === 'OBJECT');
  },
  
  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE')
    };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode || 'COORDS');
    this.setFieldValue(state.mode || 'COORDS', 'MODE');
  }
};

Blockly.Blocks['object_velocity'] = {
  init: function() {
    this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['MOVE_TO_POINT_LABEL']);
    // Заголовки для разных режимов
    this.varHeader = this.appendDummyInput('VAR_HEADER')
        .appendField(Blockly.Msg['OBJECT_VELOCITY_LABEL']);
    
    this.thisHeader = this.appendDummyInput('THIS_HEADER')
        .appendField(Blockly.Msg['THIS_VELOCITY_LABEL'])
        .setVisible(false);
    
    // Переключатель режима
    var modeField = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'], 'THIS']
    ], (newMode) => this.updateShape_(newMode));
    this.appendDummyInput('MODE_INPUT')
        .appendField(modeField, 'MODE');
    
    // Поле выбора переменной
    this.varField = this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable('obj1'), 'Object');
    
    // Остальные поля ввода
    
    
    this.appendValueInput("ValueX")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
        
    this.appendValueInput("ValueY")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);
        
    this.appendValueInput("ValueSpeed")
        .setCheck("Number")
        .appendField(Blockly.Msg['SPEED_LABEL']);
    
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(190);
    
    // Инициализация
    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },
  
  updateShape_: function(newMode) {
    var varHeader = this.getInput('VAR_HEADER');
    var thisHeader = this.getInput('THIS_HEADER');
    var varField = this.getInput('VAR_INPUT');
    
    // Управляем видимостью
    varHeader.setVisible(newMode === 'VAR');
    thisHeader.setVisible(newMode === 'THIS');
    varField.setVisible(newMode === 'VAR');
    
  },
  
  saveExtraState: function() {
    return { mode: this.getFieldValue('MODE') };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode);
    this.setFieldValue(state.mode, 'MODE');
  }
};

// Блок "Идти к цели с обходом тайлов".
// Двигает объект к точке (X, Y) или к другому объекту, огибая твёрдые тайлы.
// Алгоритм — потенциальные поля (steering): seek-вектор к цели +
// вектор отталкивания от ближайших твёрдых тайлов. Без A* и без построения карты.
Blockly.Blocks['object_move_to_target'] = {
  init: function() {
    this.setInputsInline(true);
    this.setColour(190);

    // Заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['MOVE_TO_TARGET_LABEL'] || 'Идти к цели с обходом');

    // Выбор объекта, который двигается: по переменной / this
    var modeField = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'] || 'конкретного', 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'] || 'этого объекта', 'THIS']
    ], (newMode) => this.updateShape_(newMode));
    this.appendDummyInput('MODE_INPUT')
        .appendField(modeField, 'MODE');
    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable('obj1'), 'Object');

    // Выбор типа цели: точка (X, Y) или другой объект (по переменной)
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['MOVE_TO_TARGET_POINT'] || 'к точке', 'POINT'],
          [Blockly.Msg['MOVE_TO_TARGET_OBJ'] || 'к объекту', 'OBJECT']
        ], (newTarget) => this.updateTargetShape_(newTarget)), 'TARGET_MODE');

    // Входы для точки (по умолчанию видны)
    this.appendValueInput("TX")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_X']);
    this.appendValueInput("TY")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_Y']);

    // Вход для целевого объекта (скрыт по умолчанию)
    this.appendDummyInput('TARGET_VAR_INPUT')
        .appendField(new Blockly.FieldVariable('obj2'), 'TargetObject')
        .setVisible(false);

    // Скорость движения
    this.appendValueInput("SPEED")
        .setCheck("Number")
        .appendField(Blockly.Msg['SPEED_LABEL'] || 'скорость');

    // Размер окна поиска пути (сторона квадрата тайлов для локального A*)
    this.appendValueInput("SEARCH_SIZE")
        .setCheck("Number")
        .appendField(Blockly.Msg['MOVE_TO_TARGET_SEARCH'] || 'размер поиска');

    // Чекбокс отладки: если включён — генерирует код с визуализацией
    // пути на canvas. Если выключен — компактный код без отладки.
    this.appendDummyInput()
        .appendField(Blockly.Msg['MOVE_TO_TARGET_DEBUG'] || 'отладка')
        .appendField(new Blockly.FieldCheckbox("FALSE"), "DEBUG");

    // Теневые блоки для значений по умолчанию
    var shadowX = this.workspace.newBlock('math_number');
    shadowX.setFieldValue('640', 'NUM');
    shadowX.setShadow(true); shadowX.initSvg();
    this.getInput('TX').connection.connect(shadowX.outputConnection);
    shadowX.render();

    var shadowY = this.workspace.newBlock('math_number');
    shadowY.setFieldValue('360', 'NUM');
    shadowY.setShadow(true); shadowY.initSvg();
    this.getInput('TY').connection.connect(shadowY.outputConnection);
    shadowY.render();

    var shadowSpeed = this.workspace.newBlock('math_number');
    shadowSpeed.setFieldValue('3', 'NUM');
    shadowSpeed.setShadow(true); shadowSpeed.initSvg();
    this.getInput('SPEED').connection.connect(shadowSpeed.outputConnection);
    shadowSpeed.render();

    var shadowSearch = this.workspace.newBlock('math_number');
    shadowSearch.setFieldValue('15', 'NUM');
    shadowSearch.setShadow(true); shadowSearch.initSvg();
    this.getInput('SEARCH_SIZE').connection.connect(shadowSearch.outputConnection);
    shadowSearch.render();

    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");

    // Динамическая подсказка
    this.setTooltip(function() {
      var ru = typeof savedLanguage !== 'undefined' && savedLanguage === 'ru';
      return ru
        ? 'Двигает объект к цели по центрам тайлов (локальный A*, 4-направленный). Скорость — пикс/кадр, размер поиска — сторона квадрата тайлов (min 3, по умолчанию 15). Отладка — включает визуализацию пути на canvas (увеличивает размер кода).'
        : 'Moves the object toward the target through tile centers (local A*, 4-directional). Speed — px/frame, search size — tile square side (min 3, default 15). Debug — enables path visualization on canvas (increases code size).';
    }.bind(this));

    this.updateShape_(this.getFieldValue('MODE') || 'VAR');
  },

  // Переключение видимости поля переменной объекта (VAR / THIS)
  updateShape_: function(newMode) {
    var varInput = this.getInput('VAR_INPUT');
    if (varInput) varInput.setVisible(newMode === 'VAR');
  },

  // Переключение между целью-точкой и целью-объектом
  updateTargetShape_: function(newTarget) {
    var tx = this.getInput('TX');
    var ty = this.getInput('TY');
    var tvar = this.getInput('TARGET_VAR_INPUT');
    if (newTarget === 'OBJECT') {
      if (tx) tx.setVisible(false);
      if (ty) ty.setVisible(false);
      if (tvar) tvar.setVisible(true);
    } else {
      if (tx) tx.setVisible(true);
      if (ty) ty.setVisible(true);
      if (tvar) tvar.setVisible(false);
    }
  },

  saveExtraState: function() {
    return {
      mode: this.getFieldValue('MODE'),
      targetMode: this.getFieldValue('TARGET_MODE')
    };
  },

  loadExtraState: function(state) {
    if (!state) return;
    if (state.mode) {
      this.setFieldValue(state.mode, 'MODE');
      this.updateShape_(state.mode);
    }
    if (state.targetMode) {
      this.setFieldValue(state.targetMode, 'TARGET_MODE');
      this.updateTargetShape_(state.targetMode);
    }
  }
};

// Блок для получения объекта
Blockly.Blocks['get_object'] = {
  init: function() {
    this.setInputsInline(true);
    this.setColour(340);
    
    // Основной заголовок
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_OBJECT_LABEL']);
    
    // Выбор типа объекта
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['GET_OBJECT_TYPE_ITERATED'], 'object'],
          [Blockly.Msg['GET_OBJECT_TYPE_COLLIDED'], ' object'],
          [Blockly.Msg['GET_OBJECT_TYPE_RANDOM'], 'RANDOM'],
          [Blockly.Msg['GET_OBJECT_TYPE_THIS'], 'this']
        ], this.updateShape_.bind(this)), 'TYPE');
    
    // Поле для имени объекта (только для режима RANDOM)
    this.appendDummyInput("NAME_INPUT")
        .appendField(Blockly.Msg['GET_OBJECT_NAME_LABEL'])
        .appendField(new Blockly.FieldTextInput('prototype1'), 'NAME')
        .setVisible(false);
    
    this.setOutput(true, 'Object');
  },
  
  updateShape_: function(selectedType) {
    // Показываем поле имени только для случайного объекта
    this.getInput('NAME_INPUT').setVisible(selectedType === 'RANDOM');
  },
  
  saveExtraState: function() {
    return {
      type: this.getFieldValue('TYPE')
    };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.type || 'object');
    this.setFieldValue(state.type || 'object', 'TYPE');
  }
};

Blockly.Blocks['object_distance'] = {
  init: function() {
    this.setInputsInline(true);
    
    // Заголовки для разных режимов
    this.varHeader = this.appendDummyInput('VAR_HEADER')
        .appendField(Blockly.Msg['OBJECT_DISTANCE_LABEL']);
    
    this.thisHeader = this.appendDummyInput('THIS_HEADER')
        .appendField(Blockly.Msg['THIS_DISTANCE_LABEL'])
        .setVisible(false);
    
    // Переключатель режима для первого объекта
    var modeField1 = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'], 'THIS']
    ], (newMode) => this.updateShape_(newMode, '1'));
    this.appendDummyInput('MODE_INPUT_1')
        .appendField(modeField1, 'MODE_1');
    
    // Поле выбора переменной для первого объекта
    this.varField1 = this.appendDummyInput('VAR_INPUT_1')
        .appendField(new Blockly.FieldVariable('obj1'), 'Object1');
    
    // Разделитель
    this.appendDummyInput()
        .appendField(Blockly.Msg['AND_LABEL']);
    
    // Переключатель режима для второго объекта
    var modeField2 = new Blockly.FieldDropdown([
      [Blockly.Msg['OBJECT_BY_VAR_LABEL'], 'VAR'],
      [Blockly.Msg['THIS_OBJECT_LABEL'], 'THIS']
    ], (newMode) => this.updateShape_(newMode, '2'));
    this.appendDummyInput('MODE_INPUT_2')
        .appendField(modeField2, 'MODE_2');
    
    // Поле выбора переменной для второго объекта
    this.varField2 = this.appendDummyInput('VAR_INPUT_2')
        .appendField(new Blockly.FieldVariable('obj2'), 'Object2');
    
    this.setOutput(true, 'Number');
    this.setColour(190);
    
    // Инициализация
    this.updateShape_(this.getFieldValue('MODE_1') || 'VAR', '1');
    this.updateShape_(this.getFieldValue('MODE_2') || 'VAR', '2');
  },
  
  updateShape_: function(newMode, objectNum) {
    var varField = this.getInput('VAR_INPUT_' + objectNum);
    var modeInput = this.getInput('MODE_INPUT_' + objectNum);
    
    if (varField) {
      varField.setVisible(newMode === 'VAR');
    }
    
    // Перерисовка
    
  },
  
  saveExtraState: function() {
    return { 
      mode1: this.getFieldValue('MODE_1'),
      mode2: this.getFieldValue('MODE_2')
    };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode1, '1');
    this.updateShape_(state.mode2, '2');
    this.setFieldValue(state.mode1, 'MODE_1');
    this.setFieldValue(state.mode2, 'MODE_2');
  }
};

Blockly.Blocks['object_iterate'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['OBJECT_ITERATE']);
    this.appendStatementInput("BODY")
        .setCheck(null);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);
  }
};

// ==================== Системные блоки ====================

Blockly.Blocks['get_time'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_TIME_LABEL']);
    this.setOutput(true, 'Number');
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

Blockly.Blocks['get_joy_count'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_JOY_COUNT_LABEL']);
    this.setOutput(true, 'Number');
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

Blockly.Blocks['get_memory'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_MEMORY_LABEL']);
    this.setOutput(true, 'Number');
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

Blockly.Blocks['set_screen_xy'] = {
  init: function() {
    this.setColour(190);
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_SCREEN_POS_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_PARAM_X'], 'X'],
          [Blockly.Msg['OBJECT_PARAM_Y'], 'Y']
        ]), 'XY');
    this.appendValueInput("Value")
        .setCheck("Number")
        .appendField(Blockly.Msg['VALUE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

Blockly.Blocks['set_gravitation'] = {
  init: function() {
    this.setColour(190);
        this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['SET_GRAVITY_LABEL']);
    this.appendValueInput("Value")
        .setCheck("Number")
        .appendField(Blockly.Msg['VALUE_LABEL']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

Blockly.Blocks['get_touch'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['HAS_TOUCH_LABEL']);
    this.setOutput(true, 'Boolean');
    this.setColour(60);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

Blockly.Blocks['get_touchxy'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_TOUCH_POS_LABEL']);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['' + Blockly.Msg['OBJECT_PARAM_X'], 'X'],
          ['' + Blockly.Msg['OBJECT_PARAM_Y'], 'Y']
        ]), 'XY');
    this.setOutput(true, 'Number');
    this.setColour(60);
        this.setInputsInline(true);
        this.setHelpUrl(Blockly.Msg['HELP_A'] + '#game');
  }
};

// ==================== Блоки переменных ====================

Blockly.Blocks['create_local_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['CREATE_LOCAL_VAR_LABEL'])
        .appendField(new Blockly.FieldTextInput("x"), "VAR_NAME");
    this.appendValueInput("VAR_VALUE")
        .setCheck(null)
        .appendField(Blockly.Msg['WITH_VALUE_LABEL']);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    
    // Валидатор и обработчик изменений
    this.getField('VAR_NAME').setValidator(this.validateVarName.bind(this));
  },

  validateVarName: function(newName) {
          const oldName = this.getFieldValue('VAR_NAME');
          // Добавляем новую переменную, если её нет
          if (newName && !Blockly.Variables.localVars.includes(newName)) {
                Blockly.Variables.localVars.push(newName);
          }
          return newName;
        },

  // Сохраняем имя переменной в mutation
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('var_name', this.getFieldValue('VAR_NAME'));
    return container;
  },

  // Восстанавливаем переменную из mutation
  domToMutation: function(xmlElement) {
    const varName = xmlElement.getAttribute('var_name');
    if (varName) {
      this.getField('VAR_NAME').setValue(varName);
      if (!Blockly.Variables.localVars.includes(varName)) {
        Blockly.Variables.addVar(varName);
      }
    }
  },

  // При удалении блока - удаляем переменную
  onDestroy: function() {
    const varName = this.getFieldValue('VAR_NAME');
    if (varName) Blockly.Variables.removeVar(varName);
  }
};

Blockly.Blocks['addto_local_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['ADDTO_LOCAL_VAR_LABEL'])
        .appendField(new Blockly.FieldDropdown(() => this.getVarOptions()), "VAR_NAME");
    this.appendValueInput("VAR_VALUE")
        .setCheck(null)
        .appendField('value');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  },

  getVarOptions: function() {
    const options = Blockly.Variables.localVars.map(name => [name, name]);
    return options.length ? options : [["No variables", ""]];
  },

  // Сохраняем выбранную переменную
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('var_name', this.getFieldValue('VAR_NAME'));
    return container;
  },

  // Восстанавливаем переменную
  domToMutation: function(xmlElement) {
    const varName = xmlElement.getAttribute('var_name');
    if (varName) {
      // Отложенное обновление (на случай если переменные ещё не загружены)
      setTimeout(() => {
        const dropdown = this.getField('VAR_NAME');
        if (dropdown) {
          dropdown.menuGenerator_ = () => this.getVarOptions();
          if (Blockly.Variables.localVars.includes(varName)) {
            dropdown.setValue(varName);
          }
        }
      }, 0);
    }
  },

  // Обновляем dropdown при изменении списка переменных
  updateVarDropdown: function() {
    const dropdown = this.getField('VAR_NAME');
    if (dropdown) {
      const currentValue = dropdown.getValue();
      dropdown.menuGenerator_ = () => this.getVarOptions();
      if (currentValue && Blockly.Variables.localVars.includes(currentValue)) {
        dropdown.setValue(currentValue);
      }
    }
  }
};

Blockly.Blocks['get_local_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_LOCAL_VAR_LABEL'])
        .appendField(new Blockly.FieldDropdown(() => this.getVarOptions()), "VAR_NAME");
    this.setOutput(true, null);
    this.setColour(230);
    // При инициализации обновляем dropdown
    this.updateVarDropdown();
  },

  getVarOptions: function() {
    const options = Blockly.Variables.localVars.map(name => [name, name]);
    return options.length ? options : [["No vars", ""]];
  },

  // Сохраняем выбранную переменную в mutation
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    const varName = this.getFieldValue('VAR_NAME');
    if (varName) container.setAttribute('var_name', varName);
    return container;
  },

  // Восстанавливаем переменную из mutation
  domToMutation: function(xmlElement) {
    const varName = xmlElement.getAttribute('var_name');
    if (varName) {
      // Добавляем переменную в массив, даже если её ещё нет
      if (!Blockly.Variables.localVars.includes(varName)) {
        Blockly.Variables.localVars.push(varName);
      }
      this.getField('VAR_NAME').setValue(varName);
    }
  },

  // Обновляем dropdown при изменении списка переменных
  updateVarDropdown: function() {
    const dropdown = this.getField('VAR_NAME');
    if (dropdown) {
      const currentValue = dropdown.getValue();
      dropdown.menuGenerator_ = () => this.getVarOptions();
      // Восстанавливаем текущее значение, если оно допустимо
      if (currentValue && Blockly.Variables.localVars.includes(currentValue)) {
        dropdown.setValue(currentValue);
      }
    }
  }
};

// ==================== Генераторы кода ====================

// Генератор для игрового цикла
javascript.javascriptGenerator.forBlock['game_loop'] = function(block, generator) {
  const body = generator.statementToCode(block, 'LOOP_BODY');
  const checkclear = block.getFieldValue('CLEAR');
  const clearscreen = checkclear == 'TRUE' ? '\nDraw.clear_screen("#000000");' : "";
  return `Game.gameLoop = function() {${clearscreen}\n${body}\n}\n`;
};

javascript.javascriptGenerator.forBlock['text_print_custom'] = function(block, generator) {
  const text = generator.valueToCode(block, 'TEXT', javascript.Order.NONE) || "''";
  return `Game.alert(${text});\n`;
};

javascript.javascriptGenerator.forBlock['save_vars_with_values'] = function(block, generator) {

  // Генерация кода для сохранения переменных
  var varsCode = [];
  for (var i = 0; i < block.itemCount_; i++) {
    var varName = generator.valueToCode(block, 'VAR' + i, javascript.Order.ATOMIC);
    if (varName) {
      varName = varName.replace(/^['"](.*)['"]$/, '$1');
      varsCode.push(
        'try{ if(typeof ' + varName + ' !== "undefined") {\n' +
        '  d[' + JSON.stringify(varName) + '] = Game.objectSerialize(' + varName + ');\n' +
        '} }catch(e){}\n'
      );
    }
  }

  // Определение имени проекта
  var projectName = transliterate((typeof projectSettings !== 'undefined' && projectSettings.name) 
                  ? projectSettings.name : 'myProject');

  // Финальный код
  return 'try{\n' +
         '  var d = {};\n' +
         varsCode.join('') +
         '  var jsonStr = JSON.stringify(d);\n' +
         '  Game.save(' + JSON.stringify(projectName) + ', jsonStr);\n' +
         '}catch(e){\n' +
         '  console.log("Save error:", e);\n' +
         '}';
};

javascript.javascriptGenerator.forBlock['load_vars_with_values'] = function(block, generator) {

  // Генерация кода загрузки
  return '  var savedData = Game.load("' + transliterate(projectSettings ? projectSettings.name : 'myProject') + '");\n' +
      '  if (savedData) {\n' +
      '    var parsedData = JSON.parse(savedData);\n' +
      '    for (var varName in parsedData) {\n' +
      '      if (parsedData.hasOwnProperty(varName)) {\n' +
      '        try {\n' +
      '          var existing = (typeof eval(varName) !== "undefined") \n' +
      '                       ? eval(varName) \n' +
      '                       : undefined;\n' +
      '          var newValue = Game.objectDeserialize(parsedData[varName], existing);\n' +
      '          if (existing !== undefined) {\n' +
      '            eval(varName + " = newValue");\n' +
      '          }\n' +
      '        } catch (e) {\n' +
      '          console.log("Load error " + varName + ": " + e);\n' +
      '        }\n' +
      '      }\n' +
      '    }\n' +
      '  }\n';
};

javascript.javascriptGenerator.forBlock['reset'] = function(block, generator) {
  return '  Game.reset();\n'
};

javascript.javascriptGenerator.forBlock['lists_append'] = function(block, generator) {
  const list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
  const item = generator.valueToCode(block, 'ITEM', generator.ORDER_COMMA) || 'null';
  return `${list}.push(${item});\n`;
};

javascript.javascriptGenerator.forBlock['lists_pop_last'] = function(block, generator) {
  const list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
  return [`${list}.pop()`, generator.ORDER_FUNCTION_CALL];
};

// Генератор для проверки нажатия клавиши
javascript.javascriptGenerator.forBlock['get_key_down'] = function(block, generator) {
  const button = block.getFieldValue('KEY');
  const joyId = block.getFieldValue('JOY_ID');
  return [`Game.getKey("${button}", ${joyId})`, generator.ORDER_ATOMIC];
};

javascript.javascriptGenerator.forBlock['get_key_pressed'] = function(block, generator) {
  const button = block.getFieldValue('KEY');
  const joyId = block.getFieldValue('JOY_ID');
  return [`Game.getKeyPress("${button}", ${joyId})`, generator.ORDER_ATOMIC];
};

javascript.javascriptGenerator.forBlock['game_vibrate'] = function(block, generator) {
  const duration = generator.valueToCode(block, 'DURATION', javascript.Order.ATOMIC) || '0';
  const weak = generator.valueToCode(block, 'WEAK', javascript.Order.ATOMIC) || '0.5';
  const strong = generator.valueToCode(block, 'STRONG', javascript.Order.ATOMIC) || '0.5';
  return `Game.vibrate(${duration}, ${weak}, ${strong});\n`;
};

// Генератор для получения значения оси
javascript.javascriptGenerator.forBlock['get_axes'] = function(block, generator) {
  const axis = block.getFieldValue('KEY');
  const joyId = block.getFieldValue('JOY_ID');
  return [`Game.getAxes(${axis}, ${joyId})`, generator.ORDER_ATOMIC];
};

// Генератор для блока "Движение (наклон)"
javascript.javascriptGenerator.forBlock['get_motion'] = function(block, generator) {
  const axis = block.getFieldValue('AXIS');
  const joyId = block.getFieldValue('JOY_ID');
  return [`Game.getMotion(${joyId}, ${axis})`, generator.ORDER_ATOMIC];
};

// Генератор для рисования точки
javascript.javascriptGenerator.forBlock['draw_point'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC);
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC);
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
  return `Draw.plot(${x}, ${y}, ${color});\n`;
};

// Генератор для рисования линии
javascript.javascriptGenerator.forBlock['draw_line'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC);
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC);
  const x1 = generator.valueToCode(block, 'X1', generator.ORDER_ATOMIC);
  const y1 = generator.valueToCode(block, 'Y1', generator.ORDER_ATOMIC);
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
  return `Draw.line(${x}, ${y}, ${x1}, ${y1}, ${color});\n`;
};

// Генератор для треугольника
javascript.javascriptGenerator.forBlock['draw_triangle'] = function(block, generator) {
  const x1 = generator.valueToCode(block, 'X1', generator.ORDER_ATOMIC);
  const y1 = generator.valueToCode(block, 'Y1', generator.ORDER_ATOMIC);
  const x2 = generator.valueToCode(block, 'X2', generator.ORDER_ATOMIC);
  const y2 = generator.valueToCode(block, 'Y2', generator.ORDER_ATOMIC);
  const x3 = generator.valueToCode(block, 'X3', generator.ORDER_ATOMIC);
  const y3 = generator.valueToCode(block, 'Y3', generator.ORDER_ATOMIC);
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
  const filled = block.getFieldValue('FILLED') === 'TRUE';
  
  const func = filled ? 'Draw.filledTriangle' : 'Draw.triangle';
  return `${func}(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${color});\n`;
};

// Генератор для прямоугольника
javascript.javascriptGenerator.forBlock['draw_rect'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC);
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC);
  const width = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC);
  const height = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC);
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
  const filled = block.getFieldValue('FILLED') === 'TRUE';
  
  const func = filled ? 'Draw.filledRect' : 'Draw.rect';
  return `${func}(${x}, ${y}, ${width}, ${height}, ${color});\n`;
};

// Генератор для рисования текста
javascript.javascriptGenerator.forBlock['draw_text'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC);
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC);
  const size = generator.valueToCode(block, 'Size', generator.ORDER_ATOMIC);
  const text = generator.valueToCode(block, 'Str', generator.ORDER_ATOMIC);
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
return `Draw.text(${x}, ${y}, ${size}, ${color}, ${text});\n`;
};

// Генератор для рисования изображения
javascript.javascriptGenerator.forBlock['draw_image'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC);
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC);
  const sprite = generator.valueToCode(block, 'Image', generator.ORDER_ATOMIC);
  const width = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC);
  const height = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC);
  return `Draw.image(${sprite}, ${x}, ${y}, ${width}, ${height});\n`;
};

// Генератор для проверки столкновений
javascript.javascriptGenerator.forBlock['collision_detect'] = function(block, generator) {
  const x1 = generator.valueToCode(block, 'X1', generator.ORDER_ATOMIC);
  const y1 = generator.valueToCode(block, 'Y1', generator.ORDER_ATOMIC);
  const w1 = generator.valueToCode(block, 'Width1', generator.ORDER_ATOMIC);
  const h1 = generator.valueToCode(block, 'Height1', generator.ORDER_ATOMIC);
  const x2 = generator.valueToCode(block, 'X2', generator.ORDER_ATOMIC);
  const y2 = generator.valueToCode(block, 'Y2', generator.ORDER_ATOMIC);
  const w2 = generator.valueToCode(block, 'Width2', generator.ORDER_ATOMIC);
  const h2 = generator.valueToCode(block, 'Height2', generator.ORDER_ATOMIC);
  return [`Game.collision(${x1},${y1},${w1},${h1},${x2},${y2},${w2},${h2})`, generator.ORDER_ATOMIC];
};

// Генератор для очистки экрана
javascript.javascriptGenerator.forBlock['clear_screen'] = function(block, generator) {
  const color = generator.valueToCode(block, 'Colour', generator.ORDER_ATOMIC);
  return `Draw.clear_screen(${color});\n`;
};

// Генератор для загрузки изображения
javascript.javascriptGenerator.forBlock['field_png'] = function(block, generator) {
  const sprite = block.getFieldValue('IMAGE');
  const id = add_to_image_array(sprite);
  //return [`Draw.loadImage("${sprite}")`, generator.ORDER_ATOMIC];
  return [`${id}`, generator.ORDER_ATOMIC];
};

// Генератор для WAV
javascript.javascriptGenerator.forBlock['audio_block'] = function(block, generator) {
  const wav = block.getFieldValue('AUDIO');
  const id = add_to_sound_array(wav);
  return [`${id}`, generator.ORDER_ATOMIC];
};

// Генератор для музыкального редактора
javascript.javascriptGenerator.forBlock['music_block'] = function(block, generator) {
  const json = block.getFieldValue('MUSIC_FIELD').replace(/(,0)+$/, '');;
  return [`'${json}'`, generator.ORDER_ATOMIC];
};

// Генератор для воспроизведения музыки
javascript.javascriptGenerator.forBlock['play_music'] = function(block, generator) {
  const music = generator.valueToCode(block, 'String', generator.ORDER_ATOMIC);
  const tempo = generator.valueToCode(block, 'Number', generator.ORDER_ATOMIC);
  return `Game.play_music(${music}, ${tempo});\n`;
};
// Генератор для воспроизведения звука
javascript.javascriptGenerator.forBlock['play_sound'] = function(block, generator) {
  const music = generator.valueToCode(block, 'Number', generator.ORDER_ATOMIC);
  return `Game.play_sound(${music});\n`;
};
// Генератор для редактора уровней
/*Формат кодирования тайлов:
    Вторые два числа - размеры сетки (колонки, строки)
    Обычные тайлы: 0-16382
    Твердые тайлы: 16383-32765 (16383 + исходный ID)
    RLE-кодирование:
        Числа ≥32768 указывают на повторение следующего тайла
        Фактическое количество повторений = число - 32768*/
javascript.javascriptGenerator.forBlock['level_editor'] = function(block, generator) {
    const sprite = generator.valueToCode(block, 'TILESET', generator.ORDER_ATOMIC);
    const levelData = JSON.parse(block.getFieldValue('LEVEL_DATA'));
    
    const originalObjects = levelData.objects || [];
    const groupedObjects = {};
    const simpleObjects = [];
    let hasObjects = false;

    originalObjects.forEach(item => {
        let protoIndex = proto_object_array.findIndex(p => 
            workspace.getVariableById(p.name).name === item.protoName);
        
        if (protoIndex !== -1) {
            if (!groupedObjects[protoIndex]) {
                groupedObjects[protoIndex] = [];
            }
            // Добавляем угол поворота после координат
            groupedObjects[protoIndex].push(
                item.x, 
                item.y, 
                item.angle || 0 // По умолчанию 0 градусов
            );
            hasObjects = true;
        } else {
            let objIndex = object_array.findIndex(o => 
                workspace.getVariableById(o.name).name === item.protoName);
            
            if (objIndex !== -1) {
                simpleObjects.push({
                    name: generator.getVariableName(object_array[objIndex].name),
                    x: item.x,
                    y: item.y,
                    angle: item.angle || 0
                });
                hasObjects = true;
            }
        }
    });

    let objectsCode = '';
    if (Object.keys(groupedObjects).length > 0) {
        const objectsArray = Object.keys(groupedObjects).map(protoIndex => ({
            id: generator.getVariableName(proto_object_array[parseInt(protoIndex)].name),
            xy: groupedObjects[protoIndex]
        }));
        objectsCode = 'Game.addObjectsFromArray(' + 
            JSON.stringify(objectsArray).replace(/"id"\s*:\s*"([a-zA-Z_][a-zA-Z0-9_]*)"/g, '"id": $1') + 
            ');\n';
    }

    let simpleObjectsCode = '';
    if (simpleObjects.length > 0) {
        simpleObjectsCode = simpleObjects.map(obj => {
            let code = `${obj.name}.x = ${obj.x}; ${obj.name}.y = ${obj.y};`;
            if (obj.angle) {
                code += ` ${obj.name}.angle = ${obj.angle};`;
            }
            return code;
        }).join('\n') + '\n';
    }

  // Обработка тайлов с RLE-кодированием (остаётся без изменений)
  const tileSize = levelData.gridSize || 32;
  const cols = Math.ceil(levelData.width / tileSize);
  const rows = Math.ceil(levelData.height / tileSize);
  
  let tilesCode = '';
  let hasTiles = false;

  if (levelData.tiles && Array.isArray(levelData.tiles)) {
    const tilesArray = [tileSize, cols, rows]; // Первые два элемента - размеры
    let currentTile = null;
    let count = 0;
    const MAX_TILE_ID = 16383;
    const SOLID_OFFSET = 16383;
    const RLE_THRESHOLD = 32768;
    const MIN_RUN_LENGTH = 4;

    const flushRun = () => {
      if (count > 0) {
        if (count >= MIN_RUN_LENGTH) {
          tilesArray.push(RLE_THRESHOLD + count);
          tilesArray.push(currentTile);
        } else {
          for (let i = 0; i < count; i++) {
            tilesArray.push(currentTile);
          }
        }
        if (currentTile !== 0) hasTiles = true;
        count = 0;
      }
    };

    for (let i = 0; i < levelData.tiles.length; i++) {
      let tileValue = levelData.tiles[i];
      let encodedTile;

      if (tileValue === 0) {
        encodedTile = 0;
      } else {
        const isSolid = tileValue >= 1000;
        const tileId = isSolid ? tileValue - 1000 : tileValue;
        encodedTile = isSolid ? SOLID_OFFSET + tileId : tileId;
        if (tileId > MAX_TILE_ID) {
          console.warn(`Tile ID ${tileId} exceeds maximum allowed value (${MAX_TILE_ID})`);
          encodedTile = 0;
        }
      }

      if (encodedTile === currentTile) {
        count++;
      } else {
        flushRun();
        currentTile = encodedTile;
        count = 1;
      }
    }
    flushRun();

    // Добавляем код для тайлов только если есть ненулевые тайлы
    if (hasTiles) {
      tilesCode = 'Game.setTileImage(' + sprite + ');\n';
      tilesCode += 'Game.setTileFromArray(' + JSON.stringify(tilesArray) + ');\n';
    }
  }

  // Комбинируем результат
  const result = [];
  if (objectsCode) result.push(objectsCode);
  if (tilesCode) result.push(tilesCode);
  if (simpleObjectsCode) result.push(simpleObjectsCode);
  
  return result.join('\n') || '// Уровень не содержит объектов и тайлов\n';
};

javascript.javascriptGenerator.forBlock['set_tile'] = function(block, generator) {
  const sprite = generator.valueToCode(block, 'TILESET', generator.ORDER_ATOMIC);
  return 'Game.setTileImage(' + sprite + ');\n';
};

// Генератор кода для блока проверки столкновения с тайлом
javascript.javascriptGenerator.forBlock['is_colliding_with_tile'] = function(block, generator) {
  const objectType = block.getFieldValue('OBJECT_TYPE');
  const tileId = generator.valueToCode(block, 'TILE_ID', generator.ORDER_ATOMIC) || '0';
  
  // Добавляем функцию проверки столкновения, если она еще не определена
  if (!Blockly.JavaScript.definitions_['isCollidingWithTile']) {
    Blockly.JavaScript.definitions_['isCollidingWithTile'] = 
      `function isCollidingWithTile(obj, tileId) {
        var tiles = obj.collidingTiles;
        if (!tiles || !tiles.length) return false;
        for (var i = 0; i < tiles.length; i++) {
          if (tiles[i].tileId === tileId) return true;
        }
        return false;
      }`;
  }
  
  return [`isCollidingWithTile(${objectType}, ${tileId})`, javascript.Order.ATOMIC];
};

// Генераторы кода для блоков фона
javascript.javascriptGenerator.forBlock['set_background'] = function(block, generator) {
  const sprite = generator.valueToCode(block, 'SPRITE', generator.ORDER_ATOMIC) || '0';
  const mode = block.getFieldValue('MODE');
  return `Game.setBackground(${sprite}, ${mode});\n`;
};

javascript.javascriptGenerator.forBlock['set_background_xy'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  return `Game.setBackgroundXY(${x}, ${y});\n`;
};

javascript.javascriptGenerator.forBlock['is_paused'] = function(block, generator) {
  return [`Game.isPaused()`, javascript.Order.ATOMIC];
};

javascript.javascriptGenerator.forBlock['game_pause'] = function(block, generator) {
  const action = block.getFieldValue('ACTION');
  if (action === 'PAUSE') {
    return 'Game.pause();\n';
  } else {
    return 'Game.resume();\n';
  }
};

// Генератор кода для блока получения информации о тайле
javascript.javascriptGenerator.forBlock['get_colliding_tile_info'] = function(block, generator) {
  const objectType = block.getFieldValue('OBJECT_TYPE');
  const infoType = block.getFieldValue('INFO_TYPE');
  const index = generator.valueToCode(block, 'INDEX', generator.ORDER_ATOMIC) || '0';
  
  // Добавляем функцию получения информации о тайле, если она еще не определена
  if (!Blockly.JavaScript.definitions_['getCollidingTileInfo']) {
    Blockly.JavaScript.definitions_['getCollidingTileInfo'] = 
      `function getCollidingTileInfo(obj, infoType, index) {
        var tiles = obj.collidingTiles;
        if (!tiles || !tiles.length) return 0;
        var idx = Math.min(index, tiles.length - 1);
        return tiles[idx][infoType] || 0;
      }`;
  }
  
  return [`getCollidingTileInfo(${objectType}, '${infoType}', ${index})`, javascript.Order.ATOMIC];
};

javascript.javascriptGenerator.forBlock['get_tile_at'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  const solidOnly = block.getFieldValue('SOLID_ONLY') === 'TRUE';
  
  // Добавляем функцию получения тайла, если она еще не определена
  // Используем Game.isTileSolid для проверки твёрдости — работает и на web,
  // и на Switch (где Game.helper.tiles.solidTiles не существует).
  if (!Blockly.JavaScript.definitions_['getTileAt']) {
    Blockly.JavaScript.definitions_['getTileAt'] =
      `function getTileAt(x, y, solidOnly) {
        var tileId = Game.getTileInXY(x, y);
        if (!solidOnly) return tileId;
        // solidOnly: возвращаем tileId только если тайл твёрдый
        if (typeof Game.isTileSolid === 'function') {
          return Game.isTileSolid(x, y) ? tileId : 0;
        }
        // Fallback: проверяем бит твёрдости (Switch: tileValue < 0)
        return (tileId !== undefined && tileId < 0) ? tileId : 0;
      }`;
  }
  
  return [`getTileAt(${x}, ${y}, ${solidOnly})`, generator.ORDER_ATOMIC];
};

javascript.javascriptGenerator.forBlock['set_tile_at'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  const tileId = generator.valueToCode(block, 'TILE_ID', generator.ORDER_ATOMIC) || '0';
  const isSolid = block.getFieldValue('IS_SOLID') === 'TRUE';
  
  return `Game.changeTileInXY(${x}, ${y}, ${tileId}, ${isSolid});\n`;
};

// Генератор кода для создания частиц
javascript.javascriptGenerator.forBlock['particles_create'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
  const count = generator.valueToCode(block, 'COUNT', javascript.Order.ATOMIC) || '10';
  
  const color = generator.valueToCode(block, 'COLOR', javascript.Order.ATOMIC) || '"#ffffff"';
  const size = generator.valueToCode(block, 'SIZE', javascript.Order.ATOMIC) || '2';
  const speed = generator.valueToCode(block, 'SPEED', javascript.Order.ATOMIC) || '1';
  const direction = generator.valueToCode(block, 'DIRECTION', javascript.Order.ATOMIC) || '0';
  const spread = generator.valueToCode(block, 'SPREAD', javascript.Order.ATOMIC) || '30';
  const life = generator.valueToCode(block, 'LIFE', javascript.Order.ATOMIC) || '60';
  
  return `Game.Particles.create(${x}, ${y}, ${count}, {
    color: ${color},
    size: ${size},
    speed: ${speed},
    direction: ${direction},
    spread: ${spread},
    life: ${life}
  });\n`;
};

// Генератор кода для предустановленных эффектов
javascript.javascriptGenerator.forBlock['particles_preset'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', javascript.Order.ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', javascript.Order.ATOMIC) || '0';
  const type = block.getFieldValue('TYPE');
  const color = generator.valueToCode(block, 'COLOR', javascript.Order.ATOMIC) || getDefaultColor(type);
  
  let code = '';
  switch(type) {
    case 'explosion':
      code = `Game.Particles.create(${x}, ${y}, 50, {
        color: ${color},
        size: 3,
        speed: 3,
        spread: 360,
        life: 60
      });\n`;
      break;
      
    case 'fire':
      code = `Game.Particles.create(${x}, ${y}, 30, {
        color: ${color},
        size: 4,
        speed: 1.5,
        direction: 90,
        spread: 20,
        life: 80,
        gravity: -0.05,
        fade: true
      });\n`;
      break;
      
    case 'smoke':
      code = `Game.Particles.create(${x}, ${y}, 20, {
        color: ${color},
        size: 5,
        speed: 1,
        direction: 90,
        spread: 30,
        life: 120,
        gravity: -0.02,
        fade: true
      });\n`;
      break;
      
    case 'rain':
      code = `Game.Particles.create(${x}, ${y}, 15, {
        color: ${color},
        size: 2,
        speed: 5,
        direction: 90,
        spread: 10,
        life: 100,
        gravity: 0.1
      });\n`;
      break;
      
    case 'stars':
      code = `Game.Particles.create(${x}, ${y}, 25, {
        color: ${color},
        size: 2,
        speed: 2,
        direction: 0,
        spread: 360,
        life: 40,
        randomColor: true
      });\n`;
      break;
      
    case 'magic':
      code = `Game.Particles.create(${x}, ${y}, 40, {
        color: ${color},
        size: 3,
        speed: 1.5,
        direction: 90,
        spread: 180,
        life: 90,
        gravity: -0.03,
        fade: true
      });\n`;
      break;
  }
  
  return code;
  
  function getDefaultColor(type) {
    const colors = {
      explosion: '"#ff6600"',
      fire: '"#ff3300"',
      smoke: '"#555555"',
      rain: '"#6699ff"',
      stars: '"#ffffff"',
      magic: '"#cc00ff"'
    };
    return colors[type] || '"#ffffff"';
  }
};


// Генератор кода для очистки частиц
javascript.javascriptGenerator.forBlock['particles_clear'] = function(block, generator) {
  return 'Game.Particles.clear();\n';
};

// Генератор для выбора цвета
javascript.javascriptGenerator.forBlock['field_colour'] = function(block, generator) {
  const color = block.getFieldValue('FIELDCOLOUR');
  return [`"${color}"`, generator.ORDER_ATOMIC];
};

function isES5Compatible(code) {
  const es6Keywords = [
    'let', 'const',          // Блочная область видимости
    '=>',                    // Стрелочные функции
    'class ', 'extends ',    // Классы
    '...',                   // Оператор расширения
    '`', '${',               // Шаблонные строки
    'for..of',               // Цикл for-of
    'import ', 'export ',    // Модули ES6
    'Promise', 'Map', 'Set'  // Новые встроенные объекты
  ];
  return true;
  //return !es6Keywords.some(keyword => code.includes(keyword));
}

// Генератор для ввода JS кода
javascript.javascriptGenerator.forBlock['field_multilineinput'] = function(block, generator) {
  const code = block.getFieldValue('FIELDSCRIPT');
  if(!isES5Compatible(code)) {
          block.setWarningText(Blockly.Msg['WARNING_ES5']);
          showSwitchModal('warning', Blockly.Msg['WARNING_ES5'], false, 'ok');
          Blockly.JavaScript.lastError = true;
          return null;
        }
  block.setWarningText(null);
  return code;
};

// ==================== Генераторы кода для таймеров ====================

javascript.javascriptGenerator.forBlock['set_interval'] = function(block, generator) {
  const callback = generator.statementToCode(block, 'CALLBACK', generator.ORDER_NONE);
  const interval = generator.valueToCode(block, 'INTERVAL', generator.ORDER_ATOMIC) || 1000;
  
  // Если callback - это многострочный код (например, из блока функций), оборачиваем его
  const callbackCode = callback.includes('\n') ? 
    `function() {\n${callback}\n}` : 
    callback;
  
  return [`Game.setInterval(${callbackCode}, ${interval})`, generator.ORDER_ATOMIC];
};

javascript.javascriptGenerator.forBlock['clear_interval'] = function(block, generator) {
  const timerId = generator.valueToCode(block, 'TIMER_ID', generator.ORDER_ATOMIC);
  return `Game.clearInterval(${timerId});\n`;
};

javascript.javascriptGenerator.forBlock['set_timer'] = function(block, generator) {
  const body = generator.statementToCode(block, 'BODY');
  const time = generator.valueToCode(block, 'time', generator.ORDER_ATOMIC) || 0;
  return `Game.setTimeout(function(){${body}},${time});\n`;
};

// Генератор для создания прототипа объекта
javascript.javascriptGenerator.forBlock['new_proto_object'] = function(block, generator) {
  const name = block.workspace.getVariableById(block.getFieldValue('Object')).name;
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const w = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC) || 0;
  const h = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC) || 0;
  const sprite = generator.valueToCode(block, 'Sprite', generator.ORDER_ATOMIC) || 0;
  const oncreate = generator.statementToCode(block, 'ONCREATE');
  
  let code = `${obj}={name:"${name}",x:0,y:0,width:${w},height:${h},sprite:${sprite},local:{}};\n`;
  if(oncreate.length > 1) {
    code += `${obj}.onCreate=function(){\n${oncreate}};\n`;
  }
  return code;
};

// Генератор для создания объекта
javascript.javascriptGenerator.forBlock['new_object'] = function(block, generator) {
  const name = block.workspace.getVariableById(block.getFieldValue('Object')).name;
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
  const w = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC) || 0;
  const h = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC) || 0;
  const sprite = generator.valueToCode(block, 'Sprite', generator.ORDER_ATOMIC) || 0;
  const oncreate = generator.statementToCode(block, 'ONCREATE');
  
  let code = `${obj}=Game.addObject("${name}",${x},${y},${w},${h},${sprite});\n`;
  if(oncreate.length > 1) {
    code += `${obj}.onCreate=function(){\n${oncreate}};\n${obj}.onCreate();\n`;
  }
  return code;
};

// Генератор для создания объекта из прототипа
javascript.javascriptGenerator.forBlock['new_object_from_proto'] = function(block, generator) {
  const obj1 = generator.getVariableName(block.getFieldValue('Object'));
  const obj2 = generator.getVariableName(block.getFieldValue('Object2'));
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
  
  let code = `${obj2}=Game.addObject(${obj1}.name,0,0,${obj1}.width,${obj1}.height,0);\nfor(var key in ${obj1}){if(${obj1}.hasOwnProperty(key)){${obj2}[key]=Game.helper.deepCopy(${obj1}[key]);}};${obj2}.x=${x};${obj2}.y=${y};\nif(${obj2}.onCreate)${obj2}.onCreate();\n`;
  return code;
};

// ─── Joint code generators ───
javascript.javascriptGenerator.forBlock['create_pivot_joint'] = function(block, generator) {
  var a = generator.getVariableName(block.getFieldValue('OBJ_A'));
  var b = generator.getVariableName(block.getFieldValue('OBJ_B'));
  var mode = block.getFieldValue('MODE');
  if (mode === 'CENTER') {
    return ['Game.physics.createPivotJoint(' + a + ',' + b + ',(' + a + '.x+' + a + '.width/2),(' + a + '.y+' + a + '.height/2))', javascript.Order.ATOMIC];
  } else {
    var px = block.getFieldValue('PX') || '0';
    var py = block.getFieldValue('PY') || '0';
    return ['Game.physics.createPivotJoint(' + a + ',' + b + ',' + px + ',' + py + ')', javascript.Order.ATOMIC];
  }
};
javascript.javascriptGenerator.forBlock['create_slide_joint'] = function(block, generator) {
  var a = generator.getVariableName(block.getFieldValue('OBJ_A'));
  var b = generator.getVariableName(block.getFieldValue('OBJ_B'));
  var mode = block.getFieldValue('MODE');
  var mn = generator.valueToCode(block, 'MIN', generator.ORDER_ATOMIC) || '0';
  var mx = generator.valueToCode(block, 'MAX', generator.ORDER_ATOMIC) || '0';
  if (mode === 'CENTER') {
    var ax = '(' + a + '.x+' + a + '.width/2)';
    var ay = '(' + a + '.y+' + a + '.height/2)';
    var bx = '(' + b + '.x+' + b + '.width/2)';
    var by = '(' + b + '.y+' + b + '.height/2)';
    return ['Game.physics.createSlideJoint(' + a + ',' + b + ',' + ax + ',' + ay + ',' + bx + ',' + by + ',' + mn + ',' + mx + ')', javascript.Order.ATOMIC];
  } else {
    var ax2 = block.getFieldValue('AX') || '0';
    var ay2 = block.getFieldValue('AY') || '0';
    var bx2 = block.getFieldValue('BX') || '0';
    var by2 = block.getFieldValue('BY') || '0';
    return ['Game.physics.createSlideJoint(' + a + ',' + b + ',' + ax2 + ',' + ay2 + ',' + bx2 + ',' + by2 + ',' + mn + ',' + mx + ')', javascript.Order.ATOMIC];
  }
};
javascript.javascriptGenerator.forBlock['create_gear_joint'] = function(block, generator) {
  var a = generator.getVariableName(block.getFieldValue('OBJ_A'));
  var b = generator.getVariableName(block.getFieldValue('OBJ_B'));
  var ph = generator.valueToCode(block, 'PHASE', generator.ORDER_ATOMIC) || '0';
  var rt = generator.valueToCode(block, 'RATIO', generator.ORDER_ATOMIC) || '1';
  return ['Game.physics.createGearJoint(' + a + ',' + b + ',' + ph + ',' + rt + ')', javascript.Order.ATOMIC];
};
javascript.javascriptGenerator.forBlock['remove_joint'] = function(block, generator) {
  var j = generator.getVariableName(block.getFieldValue('JOINT'));
  return 'Game.physics.removeJoint(' + j + ');\n';
};

javascript.javascriptGenerator.forBlock['create_chain'] = function(block, generator) {
  var proto = generator.getVariableName(block.getFieldValue('OBJ'));
  var mode = block.getFieldValue('MODE');
  var count = block.getFieldValue('COUNT') || '5';
  if (mode === 'ATTACHED') {
    var attach = generator.getVariableName(block.getFieldValue('ATTACH'));
    return 'Game.physics.createChain(' + proto + ',0,0,' + count + ',undefined,undefined,' + attach + ');\n';
  } else {
    var sx2 = block.getFieldValue('SX') || '0';
    var sy2 = block.getFieldValue('SY') || '0';
    return 'Game.physics.createChain(' + proto + ',' + sx2 + ',' + sy2 + ',' + count + ');\n';
  }
};

// Генератор для клонирования объекта
javascript.javascriptGenerator.forBlock['clone_object'] = function(block, generator) {
  const obj1 = generator.getVariableName(block.getFieldValue('Object'));
  const obj2 = generator.getVariableName(block.getFieldValue('Object2'));
  return `${obj2}=Game.mirrorObject(${obj1});\n`;
};

javascript.javascriptGenerator.forBlock['game_copy_state'] = function(block, generator) {
  const source = generator.getVariableName(block.getFieldValue('SOURCE'));
  const target = generator.getVariableName(block.getFieldValue('TARGET'));
  return `Game.copyState(${source}, ${target});\n`;
};

// Генератор для рисования объекта
javascript.javascriptGenerator.forBlock['draw_object'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  return `Draw.sprite(${obj}.sprite,${obj}.x,${obj}.y,${obj}.width);\n`;
};

// Генератор для получения параметра объекта
javascript.javascriptGenerator.forBlock['get_object_var'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const param = block.getFieldValue('NAME');
  
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    return [`${varName}.${param}`, javascript.Order.ATOMIC];
  } else {
    // Для режимов object/this/iterated используем значение как есть
    return [`${mode}.${param}`, javascript.Order.ATOMIC];
  }
};

// Генератор для добавления к параметру объекта
javascript.javascriptGenerator.forBlock['addto_object_var'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const param = block.getFieldValue('NAME');
  const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
  
  let code;
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    code = `${varName}.${param} += ${value};\n`;
  } else {
    // Для режимов object/this/iterated
    code = `${mode}.${param} += ${value};\n`;
  }
  
  return code;
};

// Генератор для изменения параметра объекта
//
// Раньше для каждой установки свойства генерировался встроенный блок
//   if(obj===undefined||obj===null){Game.alert(...длинное сообщение...);}else{obj.param = value;}
// что раздувало сгенерированный код и засоряло его одинаковыми проверками.
// Теперь вся логика проверки и показа ошибки вынесена в одну общую функцию
// __sg_setObjectProp, которая регистрируется через definitions_ и попадает
// в сгенерированный код ровно один раз (вместе с другими определениями).
javascript.javascriptGenerator.forBlock['change_object_var'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const param = block.getFieldValue('NAME');
  // Fallback по умолчанию зависит от типа свойства: для boolean — '0',
  // для string — '""', для number/sprite — '0'. Это корректное значение,
  // если пользователь не подключил ничего к входу VALUE.
  const paramType = getObjectParamType(param);
  const fallback = ObjectParamDefaults[paramType] || '0';
  const value = generator.valueToCode(block, 'VALUE', javascript.Order.ATOMIC) || fallback;

  // Регистрируем общую функцию-помощник ровно один раз.
  // definitions_ сбрасывается Blockly перед каждой генерацией кода,
  // поэтому функция всегда определена, когда в ней есть необходимость,
  // и никогда не дублируется.
  if (!Blockly.JavaScript.definitions_['__sg_setObjectProp']) {
    Blockly.JavaScript.definitions_['__sg_setObjectProp'] =
`function __sg_setObjectProp(obj, propName, value, varName) {
  if (obj === undefined || obj === null) {
    var ru = typeof savedLanguage !== 'undefined' && savedLanguage === 'ru';
    var msg;
    if (varName) {
      msg = ru
        ? 'Ошибка: попытка изменить свойство "' + propName + '" у несуществующего объекта (' + varName + '). Проверьте, что объект создан.'
        : 'Error: trying to set property "' + propName + '" on a non-existent object (' + varName + '). Check that the object is created.';
    } else {
      msg = ru
        ? 'Ошибка: попытка изменить свойство "' + propName + '" у несуществующего объекта. Используйте этот блок только внутри обработчика столкновения (onCollision).'
        : 'Error: trying to set property "' + propName + '" on a non-existent object. Use this block only inside a collision handler (onCollision).';
    }
    Game.alert(msg, ru ? 'ошибка' : 'error');
  } else {
    obj[propName] = value;
    if (propName === 'x' || propName === 'y') {
      if (!obj._posOverride) obj._posOverride = {};
      obj._posOverride[propName] = true;
    }
  }
}`;
  }

  let code;
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    // Для именованной переменной передаём её имя — оно попадёт в сообщение об ошибке.
    code = `__sg_setObjectProp(${varName}, ${JSON.stringify(param)}, ${value}, ${JSON.stringify(varName)});\n`;
  } else {
    // Для режимов object/this/iterated передаём null вместо varName,
    // чтобы получить сообщение с подсказкой про onCollision.
    code = `__sg_setObjectProp(${mode}, ${JSON.stringify(param)}, ${value}, null);\n`;
  }

  return code;
};

// Генератор для изменения границ столкновения
javascript.javascriptGenerator.forBlock['set_object_bounding'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const shape = block.getFieldValue('COLLISION_SHAPE');
  const objRef = mode === 'VAR' ? 
    generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1' : 
    mode;

  let code = '';
  
  if (shape === '0' || shape === '1') {
    const width = generator.valueToCode(block, 'WIDTH', generator.ORDER_ATOMIC) || '0';
    const height = generator.valueToCode(block, 'HEIGHT', generator.ORDER_ATOMIC) || '0';
    code += `${objRef}.boundingWidth = ${width};\n${objRef}.boundingHeight = ${height};\n`;
  }

  switch(shape) {
    case '0': code += `${objRef}.collisionShape = 0;\n`; break;
    case '1': code += `${objRef}.collisionShape = 1;\n`; break;
    case '2': code += `${objRef}.collisionShape = 2;\n`; break;
    case 'CUSTOM': 
      const radius = generator.valueToCode(block, 'CUSTOM_RADIUS', generator.ORDER_ATOMIC) || '10';
      code += `${objRef}.collisionShape = { radius: ${radius} };\n`;
      break;
  }

  return code;
};

// Генератор для удаления объекта
javascript.javascriptGenerator.forBlock['delete_object'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    return `Game.removeObject(${varName});\n`;
  } else {
    // Для режимов object/this/iterated
    return `Game.removeObject(${mode});\n`;
  }
};

// Генератор для обработки каждого кадра
javascript.javascriptGenerator.forBlock['object_onstep'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const body = generator.statementToCode(block, 'BODY');
  return `${obj}.onStep=function(){\n${body}};\n`;
};

// Генератор для блока "при отрисовке" (onDraw)
javascript.javascriptGenerator.forBlock['object_ondraw'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  if (!obj || obj === 'undefined' || obj === '') return '';
  const body = generator.statementToCode(block, 'BODY');
  return `if(${obj}){${obj}.onDraw=function(){\n${body}};}\n`;
};

// Генератор для обработки столкновений
javascript.javascriptGenerator.forBlock['object_oncollision'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const body = generator.statementToCode(block, 'BODY');
  return `${obj}.onCollision=function(object){\n${body}};\n`;
};

// Генератор для проверки выхода объекта за экран
javascript.javascriptGenerator.forBlock['object_exit_screen'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  
  if (mode === 'VAR') {
    const obj = generator.getVariableName(block.getFieldValue('Object'));
    return [`Game.exitScreen(${obj})`, generator.ORDER_ATOMIC];
  } else {
    return ['Game.exitScreen(this)', generator.ORDER_ATOMIC];
  }
};

// Генератор для проверки касания объекта
javascript.javascriptGenerator.forBlock['object_tap_screen'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  if (!Blockly.JavaScript.definitions_['isPointInRotatedSquare']) {
    Blockly.JavaScript.definitions_['isPointInRotatedSquare'] = 
                `function isPointInRotatedSquare(obj) {
  if(!Game.getTouch.istouch)
    return false;
  var angleRad = obj.angle * Math.PI / 180;
  var centerX = obj.x + obj.width / 2;
  var centerY = obj.y + obj.height / 2;
  var dx = Game.getTouch.x - centerX;
  var dy = Game.getTouch.y - centerY;
  var cos = Math.cos(-angleRad);
  var sin = Math.sin(-angleRad);
  var rx = dx * cos - dy * sin;
  var ry = dx * sin + dy * cos;
  return Math.abs(rx) <= obj.width / 2 && Math.abs(ry) <= obj.height / 2;
}`
  }
  if (mode === 'VAR') {
    const obj = generator.getVariableName(block.getFieldValue('Object'));
    return [`isPointInRotatedSquare(${obj})`, generator.ORDER_ATOMIC];
  } else {
    return ['isPointInRotatedSquare(this)', generator.ORDER_ATOMIC];
  }
};

javascript.javascriptGenerator.forBlock['camera_follow'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('OBJECT'));
  const smooth = generator.valueToCode(block, 'SMOOTH', generator.ORDER_ATOMIC) || '0.1';
  const offsetX = generator.valueToCode(block, 'OFFSET_X', generator.ORDER_ATOMIC) || '0';
  const offsetY = generator.valueToCode(block, 'OFFSET_Y', generator.ORDER_ATOMIC) || '0';
  
  // Добавляем функцию слежения камеры, если она еще не определена
  if (!Blockly.JavaScript.definitions_['cameraFollow']) {
    Blockly.JavaScript.definitions_['cameraFollow'] = 
      `function cameraFollow(target, smooth, offsetX, offsetY) {
        if (!target) return;
        var targetX = target.x + target.width/2 + offsetX;
        var targetY = target.y + target.height/2 + offsetY;
        var screenX = Game.getScreenX();
        var screenY = Game.getScreenY();
        Game.setScreenX(screenX + (targetX - screenX - 640) * smooth);
        Game.setScreenY(screenY + (targetY - screenY - 360) * smooth);
      }`;
  }
  
  return `cameraFollow(${obj}, ${smooth}, ${offsetX}, ${offsetY});\n`;
};

javascript.javascriptGenerator.forBlock['get_window_position'] = function(block, generator) {
  const axis = block.getFieldValue('AXIS');
  return axis === 'X' 
    ? ["Game.getScreenX()", generator.ORDER_ATOMIC]
    : ["Game.getScreenY()", generator.ORDER_ATOMIC];
};

// Генератор для управления объектом
javascript.javascriptGenerator.forBlock['object_control'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  
  // Преобразуем тип в число для оптимизации
  const typeMap = {'key': 0, 'stick0': 1, 'stick1': 2, 'both': 3};
  const type = typeMap[block.getFieldValue('type')] || 0;
  
  // Преобразуем тип игры в число
  const gameTypeMap = {'topdown': 0, 'platform': 1};
  const gameType = gameTypeMap[block.getFieldValue('game')] || 0;
  
  const speedX = generator.valueToCode(block, 'ValueX', generator.ORDER_ATOMIC) || 0;
  const speedY = generator.valueToCode(block, 'ValueY', generator.ORDER_ATOMIC) || 0;
  const ladderSpeed = generator.valueToCode(block, 'ladderSpeed', generator.ORDER_ATOMIC) || 3;
  const jumpButton = "'" + (block.getFieldValue('jump_button') || 'ArrowUp') + "'";
  const doubleJumpEnabled = block.getFieldValue('double_jump') === 'TRUE' ? 1 : 0;
  const joyId = block.getFieldValue('JOY_ID') || 0;

  // Добавляем функцию управления, если её ещё нет
  if (!Blockly.JavaScript.definitions_['object_control']) {
    const funcCode = `function object_control(obj, type, speedX, speedY, gameType, jumpButton, doubleJumpEnabled, joyId, ladderSpeed) {
  var acceleration = 0.2;
  if (!obj.local) obj.local = {};
  var loc = obj.local;

  // Если объект только что телепортировали (блок object_teleport или
  // change_object_var установил _posOverride), не перезаписываем
  // скорость по геймпаду — иначе физический движок уведёт объект
  // от новой позиции. Флаг будет очищен в syncToBody после обнуления
  // скорости на затронутых осях.
  if (obj._posOverride) return;

  // Базовая физика (только для topdown)
  if (gameType === 0) {
    obj.speedx *= 0.95;
    obj.speedy *= 0.95;
  }

  // Инициализация состояния для платформера
  if (gameType === 1) {
    if (loc.jumpReady === undefined) loc.jumpReady = 1;
    if (doubleJumpEnabled) {
      if (loc.jumpCount === undefined) loc.jumpCount = 0;
      if (loc.hasDoubleJump === undefined) loc.hasDoubleJump = 0;
    }
  }

  // ═══ LADDER CLIMBING ═══
  if (obj._onLadder) {
    var ls = ladderSpeed || 3;
    // JUMP OFF: if jumpButton is pressed, jump off with FULL speedY.
    // This takes priority over climbing — fixes the "small jump" bug where
    // jumpButton=ArrowUp also triggered climbUp, blocking the jump.
    // When jumpButton is ArrowUp, pressing Up = JUMP (not climb up).
    // Climbing up via ArrowUp is sacrificed; user climbs up via stick or
    // by NOT pressing jumpButton (if jumpButton is a different key).
    if (Game.getKey(jumpButton, joyId)) {
      obj.speedy = -speedY;
      obj._onLadder = null;
      loc.jumpReady = 0;
      return;
    }
    var climbUp = 0, climbDown = 0, climbLeft = 0, climbRight = 0;
    // Keyboard — but skip ArrowUp for climbing if it's the jumpButton
    if (type === 0 || type === 3) {
      if (jumpButton !== "ArrowUp" && Game.getKey("ArrowUp", joyId)) climbUp = 1;
      if (Game.getKey("ArrowDown", joyId)) climbDown = 1;
      if (Game.getKey("ArrowLeft", joyId)) climbLeft = 1;
      if (Game.getKey("ArrowRight", joyId)) climbRight = 1;
    }
    // Stick
    if (!climbUp && !climbDown && (type === 1 || type === 2 || type === 3)) {
      var sAxis = type === 2 ? 3 : 1;
      var sY = Game.getAxes(sAxis, joyId);
      if (sY < -0.3) climbUp = 1;
      if (sY > 0.3) climbDown = 1;
    }
    if (!climbLeft && !climbRight && (type === 1 || type === 2 || type === 3)) {
      var sAxisX = type === 2 ? 2 : 0;
      var sX = Game.getAxes(sAxisX, joyId);
      if (sX < -0.3) climbLeft = 1;
      if (sX > 0.3) climbRight = 1;
    }
    obj.speedy = 0;
    if (climbUp) obj.speedy = -ls;
    if (climbDown) obj.speedy = ls;
    obj.speedx = 0;
    if (climbLeft) obj.speedx = -ls * 0.7;
    if (climbRight) obj.speedx = ls * 0.7;
    return;
  }

  // X-axis movement with proper deceleration
  var movingX = 0;
  if (type === 0 || type === 3) {
    var right = Game.getKey("ArrowRight", joyId);
    var left = Game.getKey("ArrowLeft", joyId);
    if (right || left) {
      obj.speedx = obj.speedx * (1 - acceleration) + (right ? speedX : -speedX) * acceleration;
      movingX = 1;
    }
  }
  if ((type === 1 || type === 2 || type === 3) && !movingX) {
    var stickIdx = type === 2 ? 2 : 0;
    var stickX = Game.getAxes(stickIdx, joyId);
    if (Math.abs(stickX) > 0.3) {
      obj.speedx = obj.speedx * (1 - acceleration) + speedX * stickX * acceleration;
      movingX = 1;
    }
  }
  // Apply deceleration when not moving (только для платформера)
  if (!movingX && gameType === 1) {
    obj.speedx *= 0.8;
  }

  // Y-axis movement
  if (gameType === 1) {
    var shouldJump = 0;

    // Проверяем прыжок с клавиатуры
    if ((type === 0 || type === 3) && Game.getKey(jumpButton, joyId)) {
      shouldJump = 1;
    }

    // Проверяем прыжок со стика только если не было прыжка с клавиатуры
    if (!shouldJump && (type === 1 || type === 2 || type === 3)) {
      var axisIdx = type === 2 ? 3 : 1;
      if (Game.getAxes(axisIdx, joyId) < -0.3) {
        shouldJump = 1;
      }
    }

    if (obj.isOnGround) {
      loc.jumpCount = 0;
      if (doubleJumpEnabled) loc.hasDoubleJump = 1;
    }

    if (shouldJump && loc.jumpReady) {
      var canJump = !doubleJumpEnabled ? (loc.jumpCount === 0) : 
        (loc.jumpCount === 0 || (loc.jumpCount === 1 && loc.hasDoubleJump));
      if (canJump) {
        obj.speedy = -speedY;
        loc.jumpCount++;
        loc.jumpReady = 0;
        if (doubleJumpEnabled && loc.jumpCount === 2) loc.hasDoubleJump = 0;
      }
    }
    if (!shouldJump) loc.jumpReady = 1;
    if (Game.getKey("ArrowDown", joyId)) obj.speedx *= 0.7;
  } else {
    // Non-platformer controls with deceleration
    var movingY = 0;
    if (type === 0 || type === 3) {
      if (Game.getKey("ArrowUp", joyId)) {
        obj.speedy = -speedY;
        movingY = 1;
      }
      if (Game.getKey("ArrowDown", joyId)) {
        obj.speedy = speedY;
        movingY = 1;
      }
    }
    if ((type === 1 || type === 2 || type === 3) && !movingY) {
      var axisIdx = type === 2 ? 3 : 1;
      var stickY = Game.getAxes(axisIdx, joyId);
      if (stickY < -0.3) {
        obj.speedy = -speedY;
        movingY = 1;
      }
      if (stickY > 0.3) {
        obj.speedy = speedY;
        movingY = 1;
      }
    }
    // Apply deceleration when not moving (only for non-platformer)
    if (!movingY) {
      obj.speedy *= 0.9;
    }
  }
}`;
    
    Blockly.JavaScript.definitions_['object_control'] = funcCode;
  }
  
  return `object_control(${obj}, ${type}, ${speedX}, ${speedY}, ${gameType}, ${jumpButton}, ${doubleJumpEnabled}, ${joyId}, ${ladderSpeed});\n`;
};
// Генератор кода для блока перемещения
javascript.javascriptGenerator.forBlock['object_teleport'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('OBJECT'));
  const mode = block.getFieldValue('MODE');

  if (mode === 'COORDS') {
    // Режим перемещения по координатам
    const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
    const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
    // Устанавливаем _posOverride, чтобы syncToBody обнулил скорость
    // на обеих осях и физический движок не уводил тело от новой позиции.
    return `${obj}.x = ${x};\n${obj}.y = ${y};\n${obj}._posOverride = {x: true, y: true};\n`;
  } else {
    // Режим перемещения к другому объекту
    const targetObj = generator.getVariableName(block.getFieldValue('TARGET_OBJECT'));
    return `${obj}.x = ${targetObj}.x;\n${obj}.y = ${targetObj}.y;\n${obj}._posOverride = {x: true, y: true};\n`;
  }
};

// Генератор для движения к точке
javascript.javascriptGenerator.forBlock['object_velocity'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const x = generator.valueToCode(block, 'ValueX', generator.ORDER_ATOMIC) || 0;
  const y = generator.valueToCode(block, 'ValueY', generator.ORDER_ATOMIC) || 0;
  const speed = generator.valueToCode(block, 'ValueSpeed', generator.ORDER_ATOMIC) || 0;
  
  let obj;
  if (mode === 'VAR') {
    obj = generator.getVariableName(block.getFieldValue('Object'));
  } else {
    obj = 'this';
  }
  
  return `Game.setVelocityTowards(${obj}, ${x}, ${y}, ${speed});\n`;
};

// Генератор для блока "Идти к цели с обходом тайлов".
// Регистрирует переиспользуемую функцию __sg_moveToward через definitions_
// (попадает в код ровно один раз) и генерирует короткий однострочный вызов.
//
// Алгоритм — локальный A* на окне searchSize × searchSize тайлов вокруг
// объекта. В отличие от whisker/potential fields, A* находит путь ВОКРУГ
// углов и тупиков, а не только на один шаг вперёд.
//
//   1. Берём квадрат searchSize × searchSize тайлов с центром на объекте.
//   2. Цель: тайл цели, если внутри окна; иначе — ближайший крайний тайл
//      окна в направлении цели.
//   3. Запускаем A* (8-направленный, с предотвращением срезания углов)
//      от тайла объекта до тайла цели в пределах окна.
//   4. Если путь найден — берём ПЕРВЫЙ шаг пути и двигаемся к центру
//      этого тайла.
//   5. Если путь не найден (цель за стеной в пределах окна) — движемся
//      напрямую к цели (скольжение вдоль стены).
//
// Производительность: A* на 7×7 = 49 тайлах — микросекунды. Даже 15×15
// (225 тайлов) тривиально. Окно пересчитывается каждый кадр, но это
// допустимо, т.к. окно маленькое.
javascript.javascriptGenerator.forBlock['object_move_to_target'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const targetMode = block.getFieldValue('TARGET_MODE');
  const debugOn = block.getFieldValue('DEBUG') === 'TRUE';

  let obj;
  if (mode === 'VAR') {
    obj = generator.getVariableName(block.getFieldValue('Object'));
  } else {
    obj = 'this';
  }

  let targetX, targetY;
  if (targetMode === 'OBJECT') {
    const targetObj = generator.getVariableName(block.getFieldValue('TargetObject'));
    targetX = '(' + targetObj + '.x + ' + targetObj + '.width / 2)';
    targetY = '(' + targetObj + '.y + ' + targetObj + '.height / 2)';
  } else {
    const tx = generator.valueToCode(block, 'TX', generator.ORDER_ATOMIC) || '0';
    const ty = generator.valueToCode(block, 'TY', generator.ORDER_ATOMIC) || '0';
    targetX = tx;
    targetY = ty;
  }

  const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '0';
  const searchSize = generator.valueToCode(block, 'SEARCH_SIZE', generator.ORDER_ATOMIC) || '15';

  // Регистрируем переиспользуемую функцию ровно один раз.
  // Если хотя бы один блок включил отладку — регистрируем debug-версию.
  // Иначе — компактную.
  if (debugOn && !Blockly.JavaScript.definitions_['__sg_moveToward']) {
    Blockly.JavaScript.definitions_['__sg_moveToward'] = __sg_moveToward_debug_src;
    Blockly.JavaScript.definitions_['__sg_drawDebug'] = __sg_drawDebug_src;
    Blockly.JavaScript.definitions_['__sg_debugEnabled'] = 'var __sg_debugEnabled = true;';
  } else if (!Blockly.JavaScript.definitions_['__sg_moveToward']) {
    Blockly.JavaScript.definitions_['__sg_moveToward'] = __sg_moveToward_compact_src;
  }

  return `__sg_moveToward(${obj}, ${targetX}, ${targetY}, ${speed}, ${searchSize});\n`;
};

// ===== Компактная версия (без отладки) =====
// Нет __dbg, нет __sg_drawDebug, нет BFS, нет console.log.
// Объект двигается строго по центрам тайлов: сначала выравнивается на
// центр текущего тайла, потом идёт к центру следующего тайла пути.
var __sg_moveToward_compact_src =
`function __sg_moveToward(obj, targetX, targetY, speed, searchSize) {
  if (!obj || typeof targetX !== 'number' || typeof targetY !== 'number') return;
  if (!(speed > 0)) return;
  searchSize = Math.max(3, Math.floor(searchSize) || 15);
  if (searchSize % 2 === 0) searchSize++;
  var cx = obj.x + (obj.width || 0) / 2, cy = obj.y + (obj.height || 0) / 2;
  var dx = targetX - cx, dy = targetY - cy, dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.5) { obj.speedx = 0; obj.speedy = 0; obj._sgTarget = null; return; }

  // ===== ПЛАТФОРМО-НЕЗАВИСИМАЯ ПРОВЕРКА ТВЁРДОСТИ ТАЙЛОВ =====
  // Game.isTileSolid(col, row) доступен на обеих платформах:
  //   Web (engine.js): проверяет Game.helper.tiles.solidMap
  //   Switch (main.c): проверяет бит 31 в tileSystem.grid[row][col]
  // Fallback: Game.getTileInXY + проверка бита твёрдости (tv < 0).
  var _ts = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.tileSize) ? Game.helper.tiles.tileSize : 32;
  var _rows = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.rows) ? Game.helper.tiles.rows : 1000;
  var _cols = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.cols) ? Game.helper.tiles.cols : 1000;
  var _hasWebTiles = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.grid && Game.helper.tiles.solidMap);
  var _hasIsTileSolid = (typeof Game !== 'undefined' && typeof Game.isTileSolid === 'function');
  var _hasGetTileInXY = (typeof Game !== 'undefined' && typeof Game.getTileInXY === 'function');
  function isSolid(col, row) {
    if (col < 0 || row < 0 || row >= _rows || col >= _cols) return true;
    if (_hasIsTileSolid) return !!Game.isTileSolid(col, row);
    if (_hasWebTiles) return !!Game.helper.tiles.solidMap[row + '_' + col];
    if (_hasGetTileInXY) { var tv = Game.getTileInXY(col, row); return tv !== undefined && tv !== null && tv < 0; }
    return false;
  }
  // Нет никаких API тайлов — движемся напрямую.
  if (!_hasIsTileSolid && !_hasWebTiles && !_hasGetTileInXY) {
    obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; obj._sgTarget = null; return;
  }
  var ts = _ts;

  // ===== ПАМЯТЬ ТЕКУЩЕЙ ЦЕЛИ ШАГА =====
  // Запоминаем целевой тайл шага на объекте, чтобы A* не пересчитывался
  // каждый кадр (что вызывало колебание).
  //
  // СБРОС ЦЕЛИ происходит когда:
  // 1. Объект достиг центра тайла (tdist <= speed*0.5) → выравниваемся
  // 2. Объект НЕ прогрессирует к цели 3 кадра подряд (застрял) → пересчёт
  // 3. Прошло больше 15 кадров (страховочный тайм-аут) → пересчёт
  //
  // Проверка прогресса: сравниваем tdist с предыдущим кадром. Если tdist
  // не уменьшается — объект застрял (стена блокирует), сбрасываем цель.
  var col0 = Math.floor(cx / ts), row0 = Math.floor(cy / ts);
  var colT = Math.floor(targetX / ts), rowT = Math.floor(targetY / ts);

  if (obj._sgTarget) {
    var tCol = obj._sgTarget.c, tRow = obj._sgTarget.r;
    var tCx = tCol * ts + ts / 2, tCy = tRow * ts + ts / 2;
    var tdx = tCx - cx, tdy = tCy - cy, tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    obj._sgTarget.frames = (obj._sgTarget.frames || 0) + 1;
    // Проверка прогресса: стал ли объект ближе к цели, чем в прошлый кадр?
    var prevDist = obj._sgTarget.prevDist || tdist;
    var stuck = tdist >= prevDist - 0.1;  // не приблизились более чем на 0.1px
    obj._sgTarget.prevDist = tdist;
    obj._sgTarget.stuckCount = stuck ? (obj._sgTarget.stuckCount || 0) + 1 : 0;

    // Сброс если: тайм-аут 15 кадров, ИЛИ застрял 3 кадра подряд
    if (obj._sgTarget.frames > 15 || obj._sgTarget.stuckCount > 3) {
      obj._sgTarget = null;
    } else if (tdist > speed * 0.5) {
      // Ещё не достигли — двигаемся к запомненной цели.
      // ДВИЖЕНИЕ РАЗДЕЛЕНО НА ДВЕ ПОЛОВИНЫ:
      //   obj.x += vx/2  — прямое перемещение (обходит _blocked* флаги,
      //                    предотвращает застревание на углах)
      //   obj.speedx = vx/2 — скорость для физического движка
      // Итого: vx/2 + vx/2 = vx — корректная одинарная скорость.
      var halfVx = (tdx / tdist) * speed * 0.5, halfVy = (tdy / tdist) * speed * 0.5;
      obj.x += halfVx; obj.y += halfVy;
      obj.speedx = halfVx; obj.speedy = halfVy;
      return;
    } else {
      // Достигли запомненной цели. ВЫРАВНИВАЕМ объект точно в центр тайла.
      obj.x = tCol * ts + ts / 2 - (obj.width || 0) / 2;
      obj.y = tRow * ts + ts / 2 - (obj.height || 0) / 2;
      obj.speedx = 0; obj.speedy = 0;
      obj._sgTarget = null;
      cx = obj.x + (obj.width || 0) / 2; cy = obj.y + (obj.height || 0) / 2;
      col0 = Math.floor(cx / ts); row0 = Math.floor(cy / ts);
    }
  }

  // Пересчёт пути через A*
  if (col0 === colT && row0 === rowT) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; return; }
  var half = Math.floor(searchSize / 2);
  var rMin = row0 - half, rMax = row0 + half, cMin = col0 - half, cMax = col0 + half;
  if (rMin < 0) rMin = 0; if (cMin < 0) cMin = 0;
  if (rMax >= _rows) rMax = _rows - 1; if (cMax >= _cols) cMax = _cols - 1;
  var goalR = Math.max(rMin, Math.min(rMax, rowT)), goalC = Math.max(cMin, Math.min(cMax, colT));
  // solid() использует isSolid() (платформо-независимая)
  function solid(r, c) { if (r < rMin || r > rMax || c < cMin || c > cMax) return true; return isSolid(c, r); }
  if (solid(row0, col0)) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; return; }
  if (solid(goalR, goalC)) {
    var bestR = -1, bestC = -1, bestD = Infinity;
    for (var r = rMin; r <= rMax; r++) for (var c = cMin; c <= cMax; c++) {
      if (solid(r, c)) continue;
      var d = (r - goalR) * (r - goalR) + (c - goalC) * (c - goalC);
      if (d < bestD) { bestD = d; bestR = r; bestC = c; }
    }
    if (bestR === -1) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; return; }
    goalR = bestR; goalC = bestC;
  }
  var startKey = row0 + '_' + col0, goalKey = goalR + '_' + goalC;
  var open = [{ r: row0, c: col0, g: 0, f: 0 }], closed = {}, gScore = {}, cameFrom = {};
  gScore[startKey] = 0;
  var dirs = [[-1,0,1],[1,0,1],[0,-1,1],[0,1,1]];
  var found = false, maxIter = searchSize * searchSize * 4;
  for (var iter = 0; iter < maxIter && open.length > 0; iter++) {
    var minIdx = 0;
    for (var i = 1; i < open.length; i++) if (open[i].f < open[minIdx].f) minIdx = i;
    var cur = open.splice(minIdx, 1)[0], curKey = cur.r + '_' + cur.c;
    if (curKey === goalKey) { found = true; break; }
    closed[curKey] = true;
    for (var d = 0; d < dirs.length; d++) {
      var nr = cur.r + dirs[d][0], nc = cur.c + dirs[d][1], cost = dirs[d][2];
      if (solid(nr, nc)) continue;
      var nKey = nr + '_' + nc;
      if (closed[nKey]) continue;
      var tg = cur.g + cost;
      if (gScore[nKey] === undefined || tg < gScore[nKey]) {
        gScore[nKey] = tg; cameFrom[nKey] = curKey;
        var h = Math.abs(nr - goalR) + Math.abs(nc - goalC);
        open.push({ r: nr, c: nc, g: tg, f: tg + h });
      }
    }
  }
  if (!found) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; return; }
  var path = [], key = goalKey;
  for (var pstep = 0; pstep < maxIter && key && key !== startKey; pstep++) {
    var p = key.split('_'); path.unshift({ r: parseInt(p[0], 10), c: parseInt(p[1], 10) }); key = cameFrom[key];
  }
  if (path.length === 0) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; return; }

  // ЗАПОМИНАЕМ первый тайл пути как текущую цель шага.
  var next = path[0];
  obj._sgTarget = { r: next.r, c: next.c, frames: 0, prevDist: 0, stuckCount: 0 };
  var tx2 = next.c * ts + ts / 2, ty2 = next.r * ts + ts / 2;
  var sdx = tx2 - cx, sdy = ty2 - cy, sdist = Math.sqrt(sdx * sdx + sdy * sdy);
  if (sdist < 0.5) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; obj._sgTarget = null; return; }
  // ДВИЖЕНИЕ РАЗДЕЛЕНО НАПОПОЛАМ (см. комментарий выше).
  var halfVx2 = (sdx / sdist) * speed * 0.5, halfVy2 = (sdy / sdist) * speed * 0.5;
  obj.x += halfVx2; obj.y += halfVy2;
  obj.speedx = halfVx2; obj.speedy = halfVy2;
}`;

// ===== Debug-версия (с визуализацией) =====
var __sg_moveToward_debug_src =
`function __sg_moveToward(obj, targetX, targetY, speed, searchSize) {
  var __dbg = { cx: 0, cy: 0, targetX: 0, targetY: 0, path: [], window: null, goal: null, stepTarget: null, found: false, startTile: null, velocity: { x: 0, y: 0 } };
  if (!obj || typeof targetX !== 'number' || typeof targetY !== 'number') { __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  if (!(speed > 0)) { __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  searchSize = Math.max(3, Math.floor(searchSize) || 15);
  if (searchSize % 2 === 0) searchSize++;
  var cx = obj.x + (obj.width || 0) / 2, cy = obj.y + (obj.height || 0) / 2;
  var dx = targetX - cx, dy = targetY - cy, dist = Math.sqrt(dx * dx + dy * dy);
  __dbg.cx = cx; __dbg.cy = cy; __dbg.targetX = targetX; __dbg.targetY = targetY;
  if (dist < 0.5) { obj.speedx = 0; obj.speedy = 0; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  // ПЛАТФОРМО-НЕЗАВИСИМАЯ проверка твёрдости (Web + Switch)
  var _ts = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.tileSize) ? Game.helper.tiles.tileSize : 32;
  var _rows = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.rows) ? Game.helper.tiles.rows : 1000;
  var _cols = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.cols) ? Game.helper.tiles.cols : 1000;
  var _hasIsTileSolid = (typeof Game !== 'undefined' && typeof Game.isTileSolid === 'function');
  var _hasGetTileInXY = (typeof Game !== 'undefined' && typeof Game.getTileInXY === 'function');
  function isSolid(col, row) {
    if (col < 0 || row < 0 || row >= _rows || col >= _cols) return true;
    if (_hasIsTileSolid) return !!Game.isTileSolid(col, row);
    if (_hasGetTileInXY) { var tv = Game.getTileInXY(col, row); return tv !== undefined && tv !== null && tv < 0; }
    return false;
  }
  if (!_hasIsTileSolid && !_hasWebTiles && !_hasGetTileInXY) {
    obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed;
    __dbg.velocity = { x: obj.speedx, y: obj.speedy }; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return;
  }
  var ts = _ts;
  var col0 = Math.floor(cx / ts), row0 = Math.floor(cy / ts);
  var colT = Math.floor(targetX / ts), rowT = Math.floor(targetY / ts);
  __dbg.startTile = { r: row0, c: col0 };

  // ===== ПАМЯТЬ ТЕКУЩЕЙ ЦЕЛИ ШАГА (с прогресс-детекцией) =====
  // При движении к запомненному тайлу используем ПРЕДЫДУЩИЕ отладочные
  // данные (obj._sgDbg) как основу, обновляя только позицию объекта и
  // stepTarget. Это предотвращает мигание отладки между пересчётами A*.
  var _prevDbg = obj._sgDbg || null;
  if (_prevDbg) {
    __dbg.window = _prevDbg.window;
    __dbg.goal = _prevDbg.goal;
    __dbg.closed = _prevDbg.closed;
    __dbg.fScore = _prevDbg.fScore;
    __dbg.bfsDist = _prevDbg.bfsDist;
    __dbg.bfsReached = _prevDbg.bfsReached;
    __dbg.iterations = _prevDbg.iterations;
    __dbg.path = _prevDbg.path;
    __dbg.found = _prevDbg.found;
  }
  if (obj._sgTarget) {
    var tCol = obj._sgTarget.c, tRow = obj._sgTarget.r;
    var tCx = tCol * ts + ts / 2, tCy = tRow * ts + ts / 2;
    var tdx = tCx - cx, tdy = tCy - cy, tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    __dbg.stepTarget = { x: tCx, y: tCy };
    __dbg.found = true;
    obj._sgTarget.frames = (obj._sgTarget.frames || 0) + 1;
    var prevDist = obj._sgTarget.prevDist || tdist;
    var stuck = tdist >= prevDist - 0.1;
    obj._sgTarget.prevDist = tdist;
    obj._sgTarget.stuckCount = stuck ? (obj._sgTarget.stuckCount || 0) + 1 : 0;
    if (obj._sgTarget.frames > 15 || obj._sgTarget.stuckCount > 3) {
      obj._sgTarget = null;
      __dbg.stepTarget = null;
      __dbg.path = [];
    } else if (tdist > speed * 0.5) {
      var dHalfVx = (tdx / tdist) * speed * 0.5, dHalfVy = (tdy / tdist) * speed * 0.5;
      obj.x += dHalfVx; obj.y += dHalfVy;
      obj.speedx = dHalfVx; obj.speedy = dHalfVy;
      __dbg.velocity = { x: obj.speedx, y: obj.speedy }; __sg_drawDebug(__dbg); obj._sgDbg = __dbg;
      return;
    } else {
      obj.x = tCol * ts + ts / 2 - (obj.width || 0) / 2;
      obj.y = tRow * ts + ts / 2 - (obj.height || 0) / 2;
      obj.speedx = 0; obj.speedy = 0;
      obj._sgTarget = null;
      cx = obj.x + (obj.width || 0) / 2; cy = obj.y + (obj.height || 0) / 2;
      col0 = Math.floor(cx / ts); row0 = Math.floor(cy / ts);
      __dbg.startTile = { r: row0, c: col0 };
      __dbg.cx = cx; __dbg.cy = cy;
      __dbg.stepTarget = null;
      __dbg.path = [];
    }
  }

  if (col0 === colT && row0 === rowT) {
    obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed;
    __dbg.velocity = { x: obj.speedx, y: obj.speedy }; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return;
  }
  var half = Math.floor(searchSize / 2);
  var rMin = row0 - half, rMax = row0 + half, cMin = col0 - half, cMax = col0 + half;
  if (rMin < 0) rMin = 0; if (cMin < 0) cMin = 0;
  if (rMax >= _rows) rMax = _rows - 1; if (cMax >= _cols) cMax = _cols - 1;
  __dbg.window = { rMin: rMin, rMax: rMax, cMin: cMin, cMax: cMax, ts: ts };
  var goalR = Math.max(rMin, Math.min(rMax, rowT)), goalC = Math.max(cMin, Math.min(cMax, colT));
  function solid(r, c) { if (r < rMin || r > rMax || c < cMin || c > cMax) return true; return isSolid(c, r); }
  if (solid(row0, col0)) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; __dbg.goal = { r: goalR, c: goalC }; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  if (solid(goalR, goalC)) {
    var bestR = -1, bestC = -1, bestD = Infinity;
    for (var r = rMin; r <= rMax; r++) for (var c = cMin; c <= cMax; c++) {
      if (solid(r, c)) continue;
      var d = (r - goalR) * (r - goalR) + (c - goalC) * (c - goalC);
      if (d < bestD) { bestD = d; bestR = r; bestC = c; }
    }
    if (bestR === -1) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
    goalR = bestR; goalC = bestC;
  }
  __dbg.goal = { r: goalR, c: goalC };
  var startKey = row0 + '_' + col0, goalKey = goalR + '_' + goalC;
  var open = [{ r: row0, c: col0, g: 0, f: 0 }], closed = {}, gScore = {}, fScore = {}, cameFrom = {};
  gScore[startKey] = 0; fScore[startKey] = 0;
  var dirs = [[-1,0,1],[1,0,1],[0,-1,1],[0,1,1]];
  var found = false, maxIter = searchSize * searchSize * 4;
  for (var iter = 0; iter < maxIter && open.length > 0; iter++) {
    var minIdx = 0;
    for (var i = 1; i < open.length; i++) if (open[i].f < open[minIdx].f) minIdx = i;
    var cur = open.splice(minIdx, 1)[0], curKey = cur.r + '_' + cur.c;
    if (curKey === goalKey) { found = true; break; }
    closed[curKey] = true;
    for (var d = 0; d < dirs.length; d++) {
      var nr = cur.r + dirs[d][0], nc = cur.c + dirs[d][1], cost = dirs[d][2];
      if (solid(nr, nc)) continue;
      var nKey = nr + '_' + nc;
      if (closed[nKey]) continue;
      var tg = cur.g + cost;
      if (gScore[nKey] === undefined || tg < gScore[nKey]) {
        gScore[nKey] = tg; cameFrom[nKey] = curKey;
        var h = Math.abs(nr - goalR) + Math.abs(nc - goalC); var tf = tg + h;
        fScore[nKey] = tf; open.push({ r: nr, c: nc, g: tg, f: tf });
      }
    }
  }
  __dbg.closed = closed; __dbg.fScore = fScore; __dbg.openLeft = open.length; __dbg.iterations = iter;
  if (__sg_debugEnabled) {
    var bfsDist = {}, bfsQueue = [{ r: row0, c: col0, d: 0 }]; bfsDist[startKey] = 0;
    var bfsDirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var bi = 0; bi < 1000 && bi < bfsQueue.length; bi++) {
      var bc = bfsQueue[bi];
      for (var bd = 0; bd < 4; bd++) {
        var bnr = bc.r + bfsDirs[bd][0], bnc = bc.c + bfsDirs[bd][1], bnKey = bnr + '_' + bnc;
        if (solid(bnr, bnc)) continue;
        if (bfsDist[bnKey] !== undefined) continue;
        bfsDist[bnKey] = bc.d + 1; bfsQueue.push({ r: bnr, c: bnc, d: bc.d + 1 });
      }
    }
    __dbg.bfsDist = bfsDist; __dbg.bfsReached = Object.keys(bfsDist).length;
  }
  if (!found) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; __dbg.velocity = { x: obj.speedx, y: obj.speedy }; __dbg.found = false; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  var path = [], key = goalKey;
  for (var pstep = 0; pstep < maxIter && key && key !== startKey; pstep++) {
    var p = key.split('_'); path.unshift({ r: parseInt(p[0], 10), c: parseInt(p[1], 10) }); key = cameFrom[key];
  }
  if (path.length === 0) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  __dbg.path = path; __dbg.found = true;
  var next = path[0];
  obj._sgTarget = { r: next.r, c: next.c, frames: 0, prevDist: 0, stuckCount: 0 };
  var tx2 = next.c * ts + ts / 2, ty2 = next.r * ts + ts / 2;
  __dbg.stepTarget = { x: tx2, y: ty2 };
  var sdx = tx2 - cx, sdy = ty2 - cy, sdist = Math.sqrt(sdx * sdx + sdy * sdy);
  if (sdist < 0.5) { obj.speedx = (dx / dist) * speed; obj.speedy = (dy / dist) * speed; obj._sgTarget = null; __sg_drawDebug(__dbg); obj._sgDbg = __dbg; return; }
  var dHalfVx2 = (sdx / sdist) * speed * 0.5, dHalfVy2 = (sdy / sdist) * speed * 0.5;
  obj.x += dHalfVx2; obj.y += dHalfVy2;
  obj.speedx = dHalfVx2; obj.speedy = dHalfVy2;
  __dbg.velocity = { x: obj.speedx, y: obj.speedy }; __sg_drawDebug(__dbg); obj._sgDbg = __dbg;
}`;

// ===== Функция отладочной отрисовки =====
var __sg_drawDebug_src =
`var __sg_debugEnabled = true;
function __sg_drawDebug(dbg) {
  if (!__sg_debugEnabled) return;
  if (typeof Draw === 'undefined') return;
  if (typeof Game === 'undefined' || !Game) return;
  var sx = Game.screenx || 0, sy = Game.screeny || 0;
  var ts = dbg.window ? dbg.window.ts : 32;
  if (dbg.window) {
    var w = dbg.window, wx = w.cMin * ts - sx, wy = w.rMin * ts - sy;
    var ww = (w.cMax - w.cMin + 1) * ts, wh = (w.rMax - w.rMin + 1) * ts;
    Draw.rect(wx, wy, ww, wh, '#ffff00');
    var _t = (Game.helper && Game.helper.tiles) ? Game.helper.tiles : null;
    if (_t && _t.solidMap) for (var r = w.rMin; r <= w.rMax; r++) for (var c = w.cMin; c <= w.cMax; c++) {
      if (_t.solidMap[r + '_' + c]) { var tx = c * ts - sx, ty = r * ts - sy; Draw.filledRect(tx, ty, ts, ts, '#ff0000'); Draw.rect(tx + 2, ty + 2, ts - 4, ts - 4, '#ffff00'); }
    }
    if (dbg.fScore && ts >= 16) { for (var fk in dbg.fScore) { if (!dbg.fScore.hasOwnProperty(fk)) continue; var fp = fk.split('_'), fr = parseInt(fp[0], 10), fc = parseInt(fp[1], 10); Draw.text(fc * ts + ts / 2 - sx - 8, fr * ts + ts / 2 - sy - 4, 8, '#ffffff', dbg.fScore[fk].toFixed(1)); } }
  }
  if (dbg.startTile) { Draw.rect(dbg.startTile.c * ts - sx, dbg.startTile.r * ts - sy, ts, ts, '#00ff00'); }
  if (dbg.goal) { Draw.rect(dbg.goal.c * ts - sx, dbg.goal.r * ts - sy, ts, ts, '#0096ff'); }
  if (dbg.path && dbg.path.length > 0) {
    var px0 = dbg.cx - sx, py0 = dbg.cy - sy;
    for (var pi = 0; pi < dbg.path.length; pi++) {
      var px = dbg.path[pi].c * ts + ts / 2 - sx, py = dbg.path[pi].r * ts + ts / 2 - sy;
      Draw.line(px0, py0, px, py, '#00ff00');
      Draw.filledRect(px - 2, py - 2, 5, 5, '#00ff00');
      px0 = px; py0 = py;
    }
  }
  if (dbg.stepTarget) {
    Draw.filledRect(dbg.stepTarget.x - sx - 3, dbg.stepTarget.y - sy - 3, 7, 7, '#ff00ff');
    Draw.line(dbg.cx - sx, dbg.cy - sy, dbg.stepTarget.x - sx, dbg.stepTarget.y - sy, '#ff00ff');
  }
  Draw.line(dbg.cx - sx, dbg.cy - sy, dbg.targetX - sx, dbg.targetY - sy, '#ffff66');
  if (dbg.velocity && (dbg.velocity.x !== 0 || dbg.velocity.y !== 0)) {
    Draw.line(dbg.cx - sx, dbg.cy - sy, dbg.cx + dbg.velocity.x * 5 - sx, dbg.cy + dbg.velocity.y * 5 - sy, '#ffff00');
  }
  Draw.line(dbg.cx - 6 - sx, dbg.cy - sy, dbg.cx + 6 - sx, dbg.cy - sy, '#ffffff');
  Draw.line(dbg.cx - sx, dbg.cy - 6 - sy, dbg.cx - sx, dbg.cy + 6 - sy, '#ffffff');
  if (dbg.window) {
    var st = dbg.found ? 'PATH FOUND' : 'NO PATH';
    if (dbg.iterations !== undefined) st += ' (iter=' + dbg.iterations + ' bfs=' + (dbg.bfsReached || 0) + ')';
    var col = dbg.found ? '#00ff00' : '#ff6464';
    Draw.text(dbg.cx - sx + 10, dbg.cy - sy - 16, 12, col, st);
  }
}`;


// Генератор кода для блока получения объекта
javascript.javascriptGenerator.forBlock['get_object'] = function(block, generator) {
  const type = block.getFieldValue('TYPE');
  
  switch(type) {
    case 'object':
      return ['object', generator.ORDER_ATOMIC]; // Итерируемый объект
    case ' object':
      return ['object', generator.ORDER_ATOMIC]; // Столкнувшийся объект (тот же идентификатор)
    case 'this':
      return ['this', generator.ORDER_ATOMIC]; // Текущий объект
    case 'RANDOM':
      const name = block.getFieldValue('NAME');
      // Добавляем вспомогательную функцию если ее еще нет
      if (!Blockly.JavaScript.definitions_['getRandomObjectByName']) {
        Blockly.JavaScript.definitions_['getRandomObjectByName'] = 
          `function getRandomObjectByName(name) {
  var objects = [];
  
  // Фильтрация объектов с проверкой на существование и соответствие имени
  for (var i = 0; i < Game.allObject.length; i++) {
    var obj = Game.allObject[i];
    if (obj && obj.name === name) {
      objects.push(obj);
    }
  }
  
  // Возвращаем случайный объект или null, если не найдено
  if (objects.length > 0) {
    var randomIndex = Math.floor(Math.random() * objects.length);
    return objects[randomIndex];
  }
  return null;
};`;
      }
      return [`getRandomObjectByName("${name}")`, generator.ORDER_ATOMIC];
    default:
      return ['null', generator.ORDER_ATOMIC];
  }
};

javascript.javascriptGenerator.forBlock['object_animation'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('OBJECT'));
  const frames = generator.valueToCode(block, 'FRAMES', generator.ORDER_ATOMIC) || '[]';
  const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '10';
  const loop = block.getFieldValue('LOOP') === 'TRUE';
  
  return `${obj}.sprite = ${frames};\n` +
         `${obj}.animationSpeed = ${speed};\n` +
         `${obj}.animationLoop = ${loop};\n`;
};

// Генератор кода для блока "Да/Нет" (logic_boolean_yesno).
// Возвращает 1 для "Да" и 0 для "Нет" — в отличие от стандартного logic_boolean,
// который возвращает true/false. Это удобно для числовых свойств объектов
// (flip, visible, solid, animationLoop и т.п.).
javascript.javascriptGenerator.forBlock['logic_boolean_yesno'] = function(block, generator) {
  const isYes = block.getFieldValue('BOOL') === 'TRUE';
  return [isYes ? '1' : '0', javascript.Order.ATOMIC];
};

// Генератор кода для блока проверки имени объекта
javascript.javascriptGenerator.forBlock['if_object_name_equals'] = function(block, generator) {
  const objectType = block.getFieldValue('OBJECT_TYPE');
  const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || '""';
  
  return [`(${objectType}.name === ${name})`, javascript.Order.ATOMIC];
};

// Генератор для блока "Тайлы между" (ray cast).
// Использует алгоритм Брезенхэма для проверки тайлов вдоль линии.
// Регистрирует переиспользуемую функцию __sg_raycastTiles через definitions_.
javascript.javascriptGenerator.forBlock['raycast_tiles'] = function(block, generator) {
  const returnMode = block.getFieldValue('RETURN_MODE');
  const modeA = block.getFieldValue('MODE_A');
  const modeB = block.getFieldValue('MODE_B');

  // Координаты точки A
  let ax, ay;
  if (modeA === 'OBJECT') {
    const objA = generator.getVariableName(block.getFieldValue('OBJ_A'));
    ax = '(' + objA + '.x + ' + objA + '.width / 2)';
    ay = '(' + objA + '.y + ' + objA + '.height / 2)';
  } else if (modeA === 'THIS') {
    ax = '(this.x + this.width / 2)';
    ay = '(this.y + this.height / 2)';
  } else {
    ax = generator.valueToCode(block, 'AX', generator.ORDER_ATOMIC) || '0';
    ay = generator.valueToCode(block, 'AY', generator.ORDER_ATOMIC) || '0';
  }

  // Координаты точки B
  let bx, by;
  if (modeB === 'OBJECT') {
    const objB = generator.getVariableName(block.getFieldValue('OBJ_B'));
    bx = '(' + objB + '.x + ' + objB + '.width / 2)';
    by = '(' + objB + '.y + ' + objB + '.height / 2)';
  } else if (modeB === 'THIS') {
    bx = '(this.x + this.width / 2)';
    by = '(this.y + this.height / 2)';
  } else {
    bx = generator.valueToCode(block, 'BX', generator.ORDER_ATOMIC) || '0';
    by = generator.valueToCode(block, 'BY', generator.ORDER_ATOMIC) || '0';
  }

  // Регистрируем переиспользуемую функцию ровно один раз.
  if (!Blockly.JavaScript.definitions_['__sg_raycastTiles']) {
    Blockly.JavaScript.definitions_['__sg_raycastTiles'] =
`function __sg_raycastTiles(x1, y1, x2, y2) {
  // Алгоритм Брезенхэма — проходит по всем тайлам на линии от (x1,y1) до (x2,y2).
  // Возвращает: { hit: true/false, x: pixelX, y: pixelY } — первый твёрдый тайл.
  // Платформо-независимая проверка твёрдости: Game.isTileSolid или Game.getTileInXY.
  var _ts = (typeof Game !== 'undefined' && Game.helper && Game.helper.tiles && Game.helper.tiles.tileSize) ? Game.helper.tiles.tileSize : 32;
  var _hasIsTileSolid = (typeof Game !== 'undefined' && typeof Game.isTileSolid === 'function');
  var _hasGetTileInXY = (typeof Game !== 'undefined' && typeof Game.getTileInXY === 'function');
  function _isSolid(col, row) {
    if (col < 0 || row < 0) return false;
    if (_hasIsTileSolid) return !!Game.isTileSolid(col, row);
    if (_hasGetTileInXY) { var tv = Game.getTileInXY(col, row); return tv !== undefined && tv !== null && tv < 0; }
    return false;
  }
  // Конвертируем пиксели в координаты тайлов.
  var c1 = Math.floor(x1 / _ts), r1 = Math.floor(y1 / _ts);
  var c2 = Math.floor(x2 / _ts), r2 = Math.floor(y2 / _ts);
  // Брезенхэм.
  var dc = Math.abs(c2 - c1), dr = Math.abs(r2 - r1);
  var sc = c1 < c2 ? 1 : -1, sr = r1 < r2 ? 1 : -1;
  var err = dc - dr;
  var cc = c1, rr = r1;
  while (true) {
    if (_isSolid(cc, rr)) {
      return { hit: true, x: cc * _ts + _ts / 2, y: rr * _ts + _ts / 2 };
    }
    if (cc === c2 && rr === r2) break;
    var e2 = 2 * err;
    if (e2 > -dr) { err -= dr; cc += sc; }
    if (e2 < dc) { err += dc; rr += sr; }
  }
  return { hit: false, x: 0, y: 0 };
}`;
  }

  // Генерируем вызов в зависимости от режима возврата.
  if (returnMode === 'BOOL') {
    return [`__sg_raycastTiles(${ax}, ${ay}, ${bx}, ${by}).hit`, javascript.Order.ATOMIC];
  } else if (returnMode === 'X') {
    return [`__sg_raycastTiles(${ax}, ${ay}, ${bx}, ${by}).x`, javascript.Order.ATOMIC];
  } else {
    return [`__sg_raycastTiles(${ax}, ${ay}, ${bx}, ${by}).y`, javascript.Order.ATOMIC];
  }
};

// ===== ГЕНЕРАТОРЫ НОВЫХ БЛОКОВ =====

// --- Патрулирование ---
javascript.javascriptGenerator.forBlock['enemy_patrol'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  let obj;
  if (mode === 'VAR') { obj = generator.getVariableName(block.getFieldValue('Object')); } else { obj = 'this'; }
  const x1 = generator.valueToCode(block, 'X1', generator.ORDER_ATOMIC) || '0';
  const y1 = generator.valueToCode(block, 'Y1', generator.ORDER_ATOMIC) || '0';
  const x2 = generator.valueToCode(block, 'X2', generator.ORDER_ATOMIC) || '0';
  const y2 = generator.valueToCode(block, 'Y2', generator.ORDER_ATOMIC) || '0';
  const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '3';
  if (!Blockly.JavaScript.definitions_['__sg_patrol']) {
    Blockly.JavaScript.definitions_['__sg_patrol'] =
`function __sg_patrol(obj,x1,y1,x2,y2,speed){
if(!obj||typeof __sg_moveToward!=='function')return;
if(!obj.local)obj.local={};
var hw=(obj.width||16)/2,hh=(obj.height||16)/2;
var t=obj.local._pt||0;
// Целевые точки — центр тайла + половина объекта (чтобы объект не врезался в стену)
var tx=t===0?x1+hw:x2+hw,ty=t===0?y1+hh:y2+hh;
var cx=obj.x+hw,cy=obj.y+hh;
var dx=tx-cx,dy=ty-cy,d=Math.sqrt(dx*dx+dy*dy);
// Порог переключения: скорость * 1.5 (учитывает погрешность)
if(d<speed*1.5+4){
obj.local._pt=t===0?1:0;
obj._sgTarget=null;
obj.speedx=0;obj.speedy=0;
}else{
__sg_moveToward(obj,tx,ty,speed,15);
if(obj.speedx<0)obj.flip=1;else if(obj.speedx>0)obj.flip=0;
}
}`;
  }
  return `__sg_patrol(${obj},${x1},${y1},${x2},${y2},${speed});\n`;
};

// --- Здоровье ---
javascript.javascriptGenerator.forBlock['object_health'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const obj = block.getFieldValue('OBJ_TYPE');
  const val = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
  if (!Blockly.JavaScript.definitions_['__sg_hp']) {
    Blockly.JavaScript.definitions_['__sg_hp'] =
`function __sg_getHp(o){if(!o)return 0;if(o.hp===undefined)o.hp=100;return o.hp;}
function __sg_setHp(o,v){if(!o)return;if(o.maxHp===undefined)o.maxHp=100;o.hp=Math.max(0,Math.min(v,o.maxHp));}
function __sg_addHp(o,v){if(!o)return;if(o.hp===undefined)o.hp=100;if(o.maxHp===undefined)o.maxHp=100;o.hp=Math.max(0,Math.min(o.hp+v,o.maxHp));}`;
  }
  if (mode === 'GET') return [`__sg_getHp(${obj})`, javascript.Order.ATOMIC];
  if (mode === 'SET') return `__sg_setHp(${obj},${val});\n`;
  return `__sg_addHp(${obj},${val});\n`;
};
javascript.javascriptGenerator.forBlock['object_take_damage'] = function(block, generator) {
  const obj = block.getFieldValue('OBJ_TYPE');
  const dmg = generator.valueToCode(block, 'DAMAGE', generator.ORDER_ATOMIC) || '0';
  const ifr = generator.valueToCode(block, 'IFRAMES', generator.ORDER_ATOMIC) || '30';
  if (!Blockly.JavaScript.definitions_['__sg_dmg']) {
    Blockly.JavaScript.definitions_['__sg_dmg'] =
`function __sg_takeDamage(o,d,if){if(!o)return;if(o.hp===undefined)o.hp=100;if(o.maxHp===undefined)o.maxHp=100;if(o.invuln>0)return;o.hp=Math.max(0,o.hp-d);o.invuln=if||0;}`;
  }
  return `__sg_takeDamage(${obj},${dmg},${ifr});\n`;
};
javascript.javascriptGenerator.forBlock['object_heal'] = function(block, generator) {
  const obj = block.getFieldValue('OBJ_TYPE');
  const amt = generator.valueToCode(block, 'AMOUNT', generator.ORDER_ATOMIC) || '0';
  if (!Blockly.JavaScript.definitions_['__sg_hp']) {
    Blockly.JavaScript.definitions_['__sg_hp'] =
`function __sg_getHp(o){if(!o)return 0;if(o.hp===undefined)o.hp=100;return o.hp;}
function __sg_setHp(o,v){if(!o)return;if(o.maxHp===undefined)o.maxHp=100;o.hp=Math.max(0,Math.min(v,o.maxHp));}
function __sg_addHp(o,v){if(!o)return;if(o.hp===undefined)o.hp=100;if(o.maxHp===undefined)o.maxHp=100;o.hp=Math.max(0,Math.min(o.hp+v,o.maxHp));}`;
  }
  return `__sg_addHp(${obj},${amt});\n`;
};
javascript.javascriptGenerator.forBlock['object_is_alive'] = function(block, generator) {
  const obj = block.getFieldValue('OBJ_TYPE');
  if (!Blockly.JavaScript.definitions_['__sg_hp']) {
    Blockly.JavaScript.definitions_['__sg_hp'] =
`function __sg_getHp(o){if(!o)return 0;if(o.hp===undefined)o.hp=100;return o.hp;}`;
  }
  return [`__sg_getHp(${obj})>0`, javascript.Order.ATOMIC];
};

// --- Двигаться в направлении ---
javascript.javascriptGenerator.forBlock['move_in_direction'] = function(block, generator) {
  const obj = block.getFieldValue('OBJ_TYPE');
  const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_ATOMIC) || '0';
  const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '3';
  if (!Blockly.JavaScript.definitions_['__sg_moveDir']) {
    Blockly.JavaScript.definitions_['__sg_moveDir'] =
`function __sg_moveInDirection(obj,angle,speed){
if(!obj)return;
var rad=angle*Math.PI/180;
obj.speedx=Math.cos(rad)*speed;
obj.speedy=Math.sin(rad)*speed;
}`;
  }
  return `__sg_moveInDirection(${obj},${angle},${speed});\n`;
};

// --- Снаряды ---
javascript.javascriptGenerator.forBlock['spawn_projectile'] = function(block, generator) {
  const protoVar = generator.getVariableName(block.getFieldValue('PROTO'));
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_ATOMIC) || '0';
  const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_ATOMIC) || '5';
  const damage = generator.valueToCode(block, 'DAMAGE', generator.ORDER_ATOMIC) || '10';
  if (!Blockly.JavaScript.definitions_['__sg_proj']) {
    Blockly.JavaScript.definitions_['__sg_proj'] =
`function __sg_spawnProjectile(proto,x,y,angle,speed,damage){
if(!proto)return null;
var w=proto.width||8,h=proto.height||8,sp=proto.sprite||0;
var p=Game.addObject(proto.name||'projectile',x,y,w,h,sp);
p.speedx=Math.cos(angle*Math.PI/180)*speed;
p.speedy=Math.sin(angle*Math.PI/180)*speed;
p._dmg=damage;p.solid=0;
p.onCollision=function(o){
if(!o||o===this||o===proto)return;
if(o.hp!==undefined&&o.hp>0){
if(o.invuln>0)return;
o.hp=Math.max(0,o.hp-this._dmg);o.invuln=30;
}
if(Game.removeObject)Game.removeObject(this);
};
return p;
}`;
  }
  return `__sg_spawnProjectile(${protoVar},${x},${y},${angle},${speed},${damage});\n`;
};

// --- Меню паузы ---
javascript.javascriptGenerator.forBlock['pause_menu'] = function(block, generator) {
  const title = generator.valueToCode(block, 'TITLE', generator.ORDER_ATOMIC) || '"Меню"';
  const items = generator.valueToCode(block, 'ITEMS', generator.ORDER_ATOMIC) || '[]';
  const color = generator.valueToCode(block, 'COLOR', generator.ORDER_ATOMIC) || '"#1a1a3e"';
  const width = generator.valueToCode(block, 'WIDTH', generator.ORDER_ATOMIC) || '400';
  const fsize = generator.valueToCode(block, 'FSIZE', generator.ORDER_ATOMIC) || '18';
  if (!Blockly.JavaScript.definitions_['__sg_pmenu']) {
    Blockly.JavaScript.definitions_['__sg_pmenu'] =
`function __sg_pauseMenu(title,items,bgColor,cw,fs){
if(!Game._pmState)Game._pmState={sel:0,prevUp:false,prevDown:false,prevA:false,prevStickY:0,touchActive:false,result:-1};
var s=Game._pmState;
if(!items||!items.length)return -1;
var lh=fs+16;
var ch=items.length*lh+lh+30;
var cx=Math.floor((1280-cw)/2),cy=Math.floor((720-ch)/2);
var up=false,down=false,a=false;
if(typeof Game!=='undefined'){
if(typeof Game.getKey==='function'){
up=Game.getKey('ArrowUp',0);
down=Game.getKey('ArrowDown',0);
a=Game.getKey('KeyA',0);
}
if(typeof Game.getAxes==='function'){
var sy=Game.getAxes(1,0);
if(sy<-0.4&&!s.prevStickUp){up=true;}
if(sy>0.4&&!s.prevStickDown){down=true;}
s.prevStickUp=sy<-0.4;
s.prevStickDown=sy>0.4;
}
if(Game.getTouch&&Game.getTouch.istouch){
var tx=Game.getTouch.x,ty=Game.getTouch.y;
for(var ti=0;ti<items.length;ti++){
var tiy=cy+fs+30+ti*lh;
if(tx>=cx&&tx<=cx+cw&&ty>=tiy&&ty<=tiy+lh){
if(s.sel!==ti){s.sel=ti;s.touchActive=true;}
if(!s.prevTouch){a=true;s.prevTouch=true;}
break;
}
}
if(!Game.getTouch.istouch){s.prevTouch=false;}
}else{s.prevTouch=false;}
}
var _D=(typeof Draw!=='undefined');
if(_D){
Draw.filledRect(cx-10,cy-10,cw+20,ch+20,'#000000');
Draw.filledRect(cx,cy,cw,ch,bgColor||'#1a1a3e');
Draw.rect(cx,cy,cw,ch,'#6486c8');
Draw.text(cx+cw/2-(title.length*(fs+4)/4),cy+10,fs+4,'#ffffff',title);
for(var i=0;i<items.length;i++){
var isSelected=i===s.sel;
var iy=cy+fs+30+i*lh;
if(isSelected){
Draw.filledRect(cx+10,iy,cw-20,lh,'#5078c8');
Draw.text(cx+cw/2-(items[i].length*fs/4),iy+lh/2-fs/2,fs,'#ffffff',items[i]);
Draw.text(cx+20,iy+lh/2-fs/2,fs,'#ffdd44','>');
}else{
Draw.text(cx+cw/2-(items[i].length*fs/4),iy+lh/2-fs/2,fs,'#b4b4c8',items[i]);
}
}
}
if(up&&!s.prevUp){s.sel=(s.sel-1+items.length)%items.length;}
if(down&&!s.prevDown){s.sel=(s.sel+1)%items.length;}
s.prevUp=up;s.prevDown=down;
if(a&&!s.prevA){
s.prevA=a;
var r=s.sel;
Game._pmState={sel:0,prevUp:false,prevDown:false,prevA:false,prevStickUp:false,prevStickDown:false,prevTouch:false,result:-1};
return r;
}
s.prevA=a;
return -1;
}`;
  }
  return [`__sg_pauseMenu(${title},${items},${color},${width},${fsize})`, javascript.Order.ATOMIC];
};

// --- UI: кнопка ---
javascript.javascriptGenerator.forBlock['ui_button'] = function(block, generator) {
  const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || '"OK"';
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  const w = generator.valueToCode(block, 'W', generator.ORDER_ATOMIC) || '80';
  const h = generator.valueToCode(block, 'H', generator.ORDER_ATOMIC) || '30';
  const key = generator.valueToCode(block, 'KEY', generator.ORDER_ATOMIC) || '"KeyA"';
  if (!Blockly.JavaScript.definitions_['__sg_ui']) {
    Blockly.JavaScript.definitions_['__sg_ui'] =
`function __sg_uiButton(text,x,y,w,h,key){
var pressed=false;
if(key&&typeof Game!=='undefined'&&typeof Game.getKey==='function'&&Game.getKey(key,0))pressed=true;
if(typeof Game!=='undefined'&&Game.getTouch&&Game.getTouch.istouch){
var tx=Game.getTouch.x,ty=Game.getTouch.y;
if(tx>=x&&tx<=x+w&&ty>=y&&ty<=y+h)pressed=true;
}
if(typeof Draw!=='undefined'){
var bg=pressed?'#6464a0':'#323246';
var border=pressed?'#c8c8ff':'#b4b4c8';
Draw.filledRect(x,y,w,h,bg);
Draw.rect(x,y,w,h,border);
Draw.text(x+w/2-(String(text).length*4),y+h/2-7,14,'#ffffff',String(text));
}
return pressed;
}`;
  }
  return [`__sg_uiButton(${text},${x},${y},${w},${h},${key})`, javascript.Order.ATOMIC];
};

// --- UI: полоса здоровья ---
javascript.javascriptGenerator.forBlock['draw_health_bar'] = function(block, generator) {
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
  const w = generator.valueToCode(block, 'W', generator.ORDER_ATOMIC) || '60';
  const cur = generator.valueToCode(block, 'CURRENT', generator.ORDER_ATOMIC) || '50';
  const max = generator.valueToCode(block, 'MAX', generator.ORDER_ATOMIC) || '100';
  if (!Blockly.JavaScript.definitions_['__sg_hb']) {
    Blockly.JavaScript.definitions_['__sg_hb'] =
`function __sg_drawHealthBar(x,y,w,cur,max){
var h=8;
var pct=max>0?Math.max(0,Math.min(1,cur/max)):0;
var col=pct>0.5?'#00dd00':(pct>0.25?'#dddd00':'#dd0000');
if(typeof Draw!=='undefined'){
Draw.filledRect(x-1,y-1,w+2,h+2,'#000000');
Draw.filledRect(x,y,w,h,'#333333');
Draw.filledRect(x,y,Math.ceil(w*pct),h,col);
}
}`;
  }
  return `__sg_drawHealthBar(${x},${y},${w},${cur},${max});\n`;
};

// --- Сплит скрин ---
javascript.javascriptGenerator.forBlock['split_screen'] = function(block, generator) {
  const enable = block.getFieldValue('ENABLE') === 'TRUE';
  const p1 = generator.getVariableName(block.getFieldValue('P1'));
  const p2 = generator.getVariableName(block.getFieldValue('P2'));
  if (!Blockly.JavaScript.definitions_['__sg_split']) {
    Blockly.JavaScript.definitions_['__sg_split'] =
`function __sg_splitScreen(en,p1,p2){
if(en&&p1&&p2){Game._splitP1=p1;Game._splitP2=p2;
if(typeof _duc_helper_native_set_split==='function'){
_duc_helper_native_set_split(p1.x+p1.width/2,p1.y+p1.height/2,p2.x+p2.width/2,p2.y+p2.height/2);
}
}else{Game._splitP1=null;Game._splitP2=null;
if(typeof _duc_helper_native_set_split==='function'){_duc_helper_native_set_split(0,0,0,0);}
}
}`;
  }
  return `__sg_splitScreen(${enable?'true':'false'},${p1},${p2});\n`;
};

// Генератор для получения расстояния
javascript.javascriptGenerator.forBlock['object_distance'] = function(block, generator) {
  const mode1 = block.getFieldValue('MODE_1');
  const mode2 = block.getFieldValue('MODE_2');
  
  let obj1, obj2;
  
  if (mode1 === 'VAR') {
    obj1 = generator.getVariableName(block.getFieldValue('Object1'));
  } else {
    obj1 = 'this';
  }
  
  if (mode2 === 'VAR') {
    obj2 = generator.getVariableName(block.getFieldValue('Object2'));
  } else {
    obj2 = 'this';
  }
  
  return [`Game.distance(${obj1}.x, ${obj1}.y, ${obj2}.x, ${obj2}.y)`, generator.ORDER_ATOMIC];
};

// Генератор для перебора объектов
javascript.javascriptGenerator.forBlock['object_iterate'] = function(block, generator) {
  const body = generator.statementToCode(block, 'BODY');
  return `for(var i=0;i<Game.allObject.length;i++){\nvar object=Game.allObject[i];\nif(object){\n${body}\n}\n};\n`;
};

javascript.javascriptGenerator.forBlock['get_time'] = function(block, generator) {
  return ["Date.now()", generator.ORDER_ATOMIC];
}

// Генератор для получения времени
javascript.javascriptGenerator.forBlock['get_joy_count'] = function(block, generator) {
  return ["Game.getJoystickCount()", generator.ORDER_ATOMIC];
};

// Генератор для получения памяти
javascript.javascriptGenerator.forBlock['get_memory'] = function(block, generator) {
  return ["Game.getMemory()", generator.ORDER_ATOMIC];
};

// Генератор для установки позиции экрана
javascript.javascriptGenerator.forBlock['set_screen_xy'] = function(block, generator) {
  const xy = block.getFieldValue('XY');
  const value = generator.valueToCode(block, 'Value', generator.ORDER_ATOMIC) || 0;
  return xy === 'X' ? `Game.setScreenX(${value});\n` : `Game.setScreenY(${value});\n`;
};

// Генератор для установки гравитации
javascript.javascriptGenerator.forBlock['set_gravitation'] = function(block, generator) {
  const value = generator.valueToCode(block, 'Value', generator.ORDER_ATOMIC) || 0;
  return `Game.setGravity(${value});\n`;
};

// Генератор для проверки касания
javascript.javascriptGenerator.forBlock['get_touch'] = function(block, generator) {
  return ["Game.getTouch.istouch", generator.ORDER_ATOMIC];
};

// Генератор для получения позиции касания
javascript.javascriptGenerator.forBlock['get_touchxy'] = function(block, generator) {
  const xy = block.getFieldValue('XY');
  return xy === 'X' ? ["Game.getTouch.x", generator.ORDER_ATOMIC] : ["Game.getTouch.y", generator.ORDER_ATOMIC];
};

// Генератор для создания локальной переменной
javascript.javascriptGenerator.forBlock['create_local_var'] = function(block, generator) {
  const varName = processText(block.getFieldValue('VAR_NAME'));
  const varValue = generator.valueToCode(block, 'VAR_VALUE', generator.ORDER_ATOMIC) || '0';
  return `this.local.${varName} = ${varValue};\n`;
};

// Генератор для получения локальной переменной
javascript.javascriptGenerator.forBlock['addto_local_var'] = function(block, generator) {
  const varName = processText(block.getFieldValue('VAR_NAME'));
  const varValue = generator.valueToCode(block, 'VAR_VALUE', generator.ORDER_ATOMIC) || '0';
  return `this.local.${varName} += ${varValue};\n`;
};

// Генератор для получения локальной переменной
javascript.javascriptGenerator.forBlock['get_local_var'] = function(block, generator) {
  const varName = processText(block.getFieldValue('VAR_NAME'));
  return [`this.local.${varName}`, generator.ORDER_ATOMIC];
};

// Вспомогательная функция для обработки имен переменных
function processText(input) {
  const nonEnglishRegex = /[^a-zA-Z]/;
  return nonEnglishRegex.test(input) ? 
    encodeURIComponent(input).replace(/%/g, '') : 
    'l' + input;
}