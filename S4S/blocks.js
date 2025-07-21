
var ObjectParam = [
  [Blockly.Msg['OBJECT_PARAM_X'], 'x'],
  [Blockly.Msg['OBJECT_PARAM_Y'], 'y'],
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
  [Blockly.Msg['OBJECT_PARAM_ZINDEX'], 'zIndex'],
  [Blockly.Msg['OBJECT_PARAM_ISONGROUND'], 'isOnGround'],
  [Blockly.Msg['OBJECT_PARAM_COLLIDING_TILES'], 'collidingTiles'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_SPEED'], 'animationSpeed'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_LOOP'], 'animationLoop'],
  [Blockly.Msg['OBJECT_PARAM_ANIMATION_PLAY'], 'isAnimationEnd']
];

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
    this.setHelpUrl('');
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
    this.setHelpUrl('');
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
    this.setHelpUrl('');
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
        .appendField("Переменные для сохранения");
    this.appendStatementInput('STACK')
        .setCheck(null);
    this.setColour(60);
    this.setTooltip("Контейнер для переменных");
    this.contextMenu = false;
  }
};

Blockly.Blocks['variables_get_item'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("переменная");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
    this.setTooltip("Элемент переменной");
    this.contextMenu = false;
  }
};

// 2. Основной блок для сохранения переменных
Blockly.Blocks['save_vars_with_values'] = {
  init: function() {
    this.itemCount_ = 1;
    this.setHelpUrl('');
    this.setColour(60);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Сохраняет переменные и их значения в localStorage");
    
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
        input.appendField("Сохранить переменные:");
      }
    }
    
    if (this.itemCount_ === 0) {
      this.appendDummyInput('EMPTY')
        .appendField("Нет переменных для сохранения");
    }
  }
};

// 3. Блок для загрузки переменных
Blockly.Blocks['load_vars_with_values'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Загрузить переменные и их значения");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.setTooltip("Загружает переменные и их значения из localStorage");
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
          ["3", "3"],
          ["4", "4"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + '#control');
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
          ["3", "3"],
          ["4", "4"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#control');
    this.setFieldValue("0", "JOY_ID");
  }
};

Blockly.Blocks['game_vibrate'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['VIBRATE_TITLE'])
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['VIBRATE_TYPE_SIMPLE'], "SIMPLE"],
          [Blockly.Msg['VIBRATE_TYPE_PATTERN'], "PATTERN"]
        ]), "TYPE");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField(Blockly.Msg['VIBRATE_DURATION']);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.setTooltip(Blockly.Msg['VIBRATE_TITLE']);
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
          ["3", "3"],
          ["4", "4"]
        ]), "JOY_ID");
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#control');
    this.setFieldValue("0", "JOY_ID");
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
    this.setTooltip("Заставляет камеру плавно следовать за указанным объектом");
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
	this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
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
	this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
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
    this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
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
    this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
  }
};

// Блок выбора цвета
Blockly.Blocks['field_colour'] = {
  init: function() {
    this.setOutput(true, 'Colour');
    this.setColour(30);
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
    this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
    
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
	this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#draw');
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
    this.setHelpUrl("");
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
    this.setHelpUrl("");
  }
};

// Блок ввода JS кода
Blockly.Blocks['field_multilineinput'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg['JS_CODE_LABEL'])
      .appendField(new FieldMultilineInput('"some code";'), 'FIELDSCRIPT');
    this.setColour(60);
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
            showSwitchModal('error', 'Внимание:%1 дублируется'.replace('%1', workspace.getVariableById(objectName).name), false, 'ok');
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
            showSwitchModal('error', 'Внимание:%1 дублируется'.replace('%1', workspace.getVariableById(objectName).name), false, 'ok');
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
    this.setHelpUrl("");
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

    // Поле для выбора параметра
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(ObjectParam), 'NAME');

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
    }
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
        .appendField(Blockly.Msg['ADD_TO_PARAM_LABEL'] || 'Добавить к параметру:')
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

    // Поле для выбора параметра
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(ObjectParam), 'NAME');

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
        .appendField(Blockly.Msg['DELETE_OBJECT_LABEL'] || 'Удалить объект:');

    // Переключатель режима (VAR/TYPE)
    this.appendDummyInput('MODE_INPUT')
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg['OBJECT_BY_VAR_LABEL'] || 'По переменной', 'VAR'],
          [Blockly.Msg['OBJECT_TYPE_COLLIDED'] || 'Столкнувшийся объект', ' object'],
          [Blockly.Msg['OBJECT_TYPE_THIS'] || 'Этот объект', 'this'],
          [Blockly.Msg['OBJECT_TYPE_ITERATED'] || 'Итерируемый объект', 'object']
        ], this.updateShape_.bind(this)), 'MODE');

    // Поле для выбора переменной
    this.appendDummyInput('VAR_INPUT')
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'] || 'Объект:')
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
          ["3", "3"],
          ["4", "4"]
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
    this.setTooltip("Мгновенно перемещает объект в указанную точку или к другому объекту");
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
    this.setTooltip("Возвращает объект в зависимости от выбранного типа");
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
  }
};

Blockly.Blocks['get_joy_count'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_JOY_COUNT_LABEL']);
    this.setOutput(true, 'Number');
    this.setColour(60);
  }
};

Blockly.Blocks['get_memory'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['GET_MEMORY_LABEL']);
    this.setOutput(true, 'Number');
    this.setColour(60);
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
  var projectName = (typeof projectSettings !== 'undefined' && projectSettings.name) 
                  ? projectSettings.name : 'myProject';

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
  return '  var savedData = Game.load("' + (projectSettings ? projectSettings.name : 'myProject') + '");\n' +
      '  if (savedData) {\n' +
      '    var parsedData = JSON.parse(savedData);\n' +
      '    for (var varName in parsedData) {\n' +
      '      if (parsedData.hasOwnProperty(varName)) {\n' +
      '        try {\n' +
      '          var existing = (typeof eval(varName) !== "undefined") \n' +
      '                       ? eval(varName) \n' +
      '                       : undefined;\n' +
      '          var newValue = Game.objectDeserialize(parsedData[varName], existing);\n' +
      '          if (existing === undefined) {\n' +
      '            eval(varName + " = newValue");\n' +
      '          }\n' +
      '        } catch (e) {\n' +
      '          console.log("Load error " + varName + ": " + e);\n' +
      '        }\n' +
      '      }\n' +
      '    }\n' +
      '  }\n';
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
  // Получаем значение длительности вибрации
  const duration = generator.valueToCode(block, 'DURATION', javascript.Order.ATOMIC) || '0';
  
  // Поддержка двух вариантов:
  // 1. Простая вибрация (число)
  // 2. Паттерн вибрации (массив)
  const isPattern = block.getFieldValue('TYPE') === 'PATTERN';
  
  if (isPattern) {
    // Для паттерна генерируем массив
    return `Game.vibrate([${duration}]);\n`;
  } else {
    // Для простой вибрации передаем число
    return `Game.vibrate(${duration});\n`;
  }
};

// Генератор для получения значения оси
javascript.javascriptGenerator.forBlock['get_axes'] = function(block, generator) {
  const axis = block.getFieldValue('KEY');
  const joyId = block.getFieldValue('JOY_ID');
  return [`Game.getAxes(${axis}, ${joyId})`, generator.ORDER_ATOMIC];
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
  if (!Blockly.JavaScript.definitions_['getTileAt']) {
    Blockly.JavaScript.definitions_['getTileAt'] = 
      `function getTileAt(x, y, solidOnly) {
        var tileId = Game.getTileInXY(x, y);
        return solidOnly ? (Game.helper.tiles.solidTiles.has(tileId) ? tileId : 0) : tileId;
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
  
  let code = `${obj2}=Game.addObject(${obj1}.name,0,0,${obj1}.width,${obj1}.height,0);\nfor(var key in ${obj1}){if(${obj1}.hasOwnProperty(key)){${obj2}[key]=${obj1}[key];}};${obj2}.x=${x};${obj2}.y=${y};\nif(${obj2}.onCreate)${obj2}.onCreate();\n`;
  return code;
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

// Генератор для изменения параметра объекта (объединенный)
javascript.javascriptGenerator.forBlock['change_object_var'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const param = block.getFieldValue('NAME');
  const value = generator.valueToCode(block, 'Value', generator.ORDER_ATOMIC) || 0;
  
  if (mode === 'VAR') {
    const obj = generator.getVariableName(block.getFieldValue('Object'));
    return `${obj}.${param}=${value};\n`;
  } else {
    const type = block.getFieldValue('TYPE');
    return `${type}.${param}=${value};\n`;
  }
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
javascript.javascriptGenerator.forBlock['change_object_var'] = function(block, generator) {
  const mode = block.getFieldValue('MODE');
  const param = block.getFieldValue('NAME');
  const value = generator.valueToCode(block, 'VALUE', javascript.Order.ATOMIC) || '0';
  
  let code;
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    code = `${varName}.${param} = ${value};\n`;
  } else {
    // Для режимов object/this/iterated
    code = `${mode}.${param} = ${value};\n`;
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
  const controlType = block.getFieldValue('type');
  const speedX = generator.valueToCode(block, 'ValueX', generator.ORDER_ATOMIC) || 0;
  const speedY = generator.valueToCode(block, 'ValueY', generator.ORDER_ATOMIC) || 0;
  const gameType = block.getFieldValue('game');
  const jumpButton = block.getFieldValue('jump_button') || 'ArrowUp';
  const doubleJumpEnabled = block.getFieldValue('double_jump') === 'TRUE';
  const joyId = block.getFieldValue('JOY_ID');
  const acceleration = 0.2;

  const controlFuncName = `${obj}_control`;
  
  if (!Blockly.JavaScript.definitions_[controlFuncName]) {
    let funcCode = '';
    const stateVars = [];
    
    if (gameType === 'platform') {
      stateVars.push(`${obj}_jumpReady = true`);
      if (doubleJumpEnabled) {
        stateVars.push(`${obj}_jumpCount = 0`);
        stateVars.push(`${obj}_hasDoubleJump = false`);
      }
    }
    
    if (stateVars.length) {
      funcCode += `var ${stateVars.join(', ')};\n`;
    }
    
    funcCode += `function ${controlFuncName}(obj) {\n`;
    
    // Base physics
    if (gameType !== 'platform') {
      funcCode += '  obj.speedx *= 0.95;\n';
      funcCode += '  obj.speedy *= 0.95;\n';
    }
    
    switch(controlType) {
      case 'key': {
        funcCode += '  // Keyboard controls\n';
        funcCode += '  var getKey = Game.getKey;\n';
        funcCode += `  obj.speedx = obj.speedx * (1 - ${acceleration}) + ` +
                   `(getKey("ArrowRight", ${joyId}) ? ${speedX} : getKey("ArrowLeft", ${joyId}) ? -${speedX} : 0) * ${acceleration};\n`;
        
        if (gameType === 'platform') {
          if (doubleJumpEnabled) {
            // Сбрасываем счетчик прыжков при приземлении
            funcCode += `  if(obj.isOnGround) {\n`;
            funcCode += `    ${obj}_jumpCount = 0;\n`;
            funcCode += `    ${obj}_hasDoubleJump = true;\n`;
            funcCode += `  }\n`;
            
            // Обработка нажатия кнопки прыжка
            funcCode += `  if(getKey("${jumpButton}", ${joyId}) && ${obj}_jumpReady) {\n`;
            funcCode += `    if(${obj}_jumpCount === 0 || (${obj}_jumpCount === 1 && ${obj}_hasDoubleJump)) {\n`;
            funcCode += `      obj.speedy = -${speedY};\n`;
            funcCode += `      ${obj}_jumpCount++;\n`;
            funcCode += `      ${obj}_jumpReady = false;\n`;
            funcCode += `      if(${obj}_jumpCount === 2) ${obj}_hasDoubleJump = false;\n`;
            funcCode += `    }\n`;
            funcCode += `  }\n`;
            // Сбрасываем jumpReady при отпускании кнопки
            funcCode += `  if(!getKey("${jumpButton}"), ${joyId}) {\n`;
            funcCode += `    ${obj}_jumpReady = true;\n`;
            funcCode += `  }\n`;
          } else {
            // Обычный прыжок без двойного
            funcCode += `  if(getKey("${jumpButton}", ${joyId}) && obj.isOnGround && ${obj}_jumpReady) {\n`;
            funcCode += `    obj.speedy = -${speedY};\n`;
            funcCode += `    ${obj}_jumpReady = false;\n`;
            funcCode += `  }\n`;
            funcCode += `  if(!getKey("${jumpButton}", ${joyId})) ${obj}_jumpReady = true;\n`;
          }
          funcCode += `  if(getKey("ArrowDown", ${joyId})) obj.speedx *= 0.7;\n`;
        } else {
          funcCode += `  if(getKey("ArrowUp", ${joyId})) obj.speedy = -${speedY};\n`;
          funcCode += `  if(getKey("ArrowDown", ${joyId})) obj.speedy = ${speedY};\n`;
        }
        break;
      }
      
      // Аналогичные изменения для других типов управления (stick0, stick1, both)
      case 'stick0': 
      case 'stick1': {
        const stickIndex = controlType === 'stick0' ? 0 : 2;
        const axisIndex = controlType === 'stick0' ? 1 : 3;
        
        funcCode += `  // Gamepad controls\n`;
        funcCode += `  var getAxes = Game.getAxes;\n`;
        funcCode += `  var stickX = getAxes(${stickIndex}, ${joyId});\n`;
        funcCode += `  if(Math.abs(stickX) > 0.3) {\n`;
        funcCode += `    obj.speedx = obj.speedx * (1 - ${acceleration}) + ${speedX} * stickX * ${acceleration};\n`;
        funcCode += `  }\n`;
        
        if (gameType === 'platform') {
          if (doubleJumpEnabled) {
            funcCode += `  if(obj.isOnGround) {\n`;
            funcCode += `    ${obj}_jumpCount = 0;\n`;
            funcCode += `    ${obj}_hasDoubleJump = true;\n`;
            funcCode += `  }\n`;
            
            funcCode += `  var stickY = getAxes(${axisIndex}, ${joyId});\n`;
            funcCode += `  if(stickY < -0.3 && ${obj}_jumpReady) {\n`;
            funcCode += `    if(${obj}_jumpCount === 0 || (${obj}_jumpCount === 1 && ${obj}_hasDoubleJump)) {\n`;
            funcCode += `      obj.speedy = -${speedY};\n`;
            funcCode += `      ${obj}_jumpCount++;\n`;
            funcCode += `      ${obj}_jumpReady = false;\n`;
            funcCode += `      if(${obj}_jumpCount === 2) ${obj}_hasDoubleJump = false;\n`;
            funcCode += `    }\n`;
            funcCode += `  }\n`;
            funcCode += `  if(stickY >= -0.3) ${obj}_jumpReady = true;\n`;
          } else {
            funcCode += `  var stickY = getAxes(${axisIndex}, ${joyId});\n`;
            funcCode += `  if(stickY < -0.3 && obj.isOnGround && ${obj}_jumpReady) {\n`;
            funcCode += `    obj.speedy = -${speedY};\n`;
            funcCode += `    ${obj}_jumpReady = false;\n`;
            funcCode += `  }\n`;
            funcCode += `  if(stickY >= -0.3) ${obj}_jumpReady = true;\n`;
          }
        } else {
          funcCode += `  var stickY = getAxes(${axisIndex}, ${joyId});\n`;
          funcCode += `  if(stickY < -0.3) obj.speedy = -${speedY};\n`;
          funcCode += `  if(stickY > 0.3) obj.speedy = ${speedY};\n`;
        }
        break;
      }
      
      case 'both': {
        funcCode += '  // Combined controls\n';
        funcCode += '  var getKey = Game.getKey, getAxes = Game.getAxes;\n';
        funcCode += `  var targetSpeedX = getKey("ArrowLeft", ${joyId}) ? -${speedX} : ` +
                   `getKey("ArrowRight", ${joyId}) ? ${speedX} : 0;\n`;
        funcCode += `  var stickX = getAxes(0, ${joyId});\n`;
        funcCode += `  if(targetSpeedX === 0 && Math.abs(stickX) > 0.3) {\n`;
        funcCode += `    targetSpeedX = ${speedX} * stickX;\n`;
        funcCode += `  }\n`;
        funcCode += `  obj.speedx = obj.speedx * (1 - ${acceleration}) + targetSpeedX * ${acceleration};\n`;
        
        if (gameType === 'platform') {
          if (doubleJumpEnabled) {
            funcCode += `  if(obj.isOnGround) {\n`;
            funcCode += `    ${obj}_jumpCount = 0;\n`;
            funcCode += `    ${obj}_hasDoubleJump = true;\n`;
            funcCode += `  }\n`;
            
            funcCode += `  var stickY = getAxes(1, ${joyId});\n`;
            funcCode += `  if((getKey("${jumpButton}", ${joyId}) || stickY < -0.3) && ${obj}_jumpReady) {\n`;
            funcCode += `    if(${obj}_jumpCount === 0 || (${obj}_jumpCount === 1 && ${obj}_hasDoubleJump)) {\n`;
            funcCode += `      obj.speedy = -${speedY};\n`;
            funcCode += `      ${obj}_jumpCount++;\n`;
            funcCode += `      ${obj}_jumpReady = false;\n`;
            funcCode += `      if(${obj}_jumpCount === 2) ${obj}_hasDoubleJump = false;\n`;
            funcCode += `    }\n`;
            funcCode += `  }\n`;
            funcCode += `  if(!(getKey("${jumpButton}", ${joyId}) || stickY < -0.3)) ${obj}_jumpReady = true;\n`;
          } else {
            funcCode += `  var stickY = getAxes(1, ${joyId});\n`;
            funcCode += `  if((getKey("${jumpButton}", ${joyId}) || stickY < -0.3) && obj.isOnGround && ${obj}_jumpReady) {\n`;
            funcCode += `    obj.speedy = -${speedY};\n`;
            funcCode += `    ${obj}_jumpReady = false;\n`;
            funcCode += `  }\n`;
            funcCode += `  if(!(getKey("${jumpButton}", ${joyId}) || stickY < -0.3)) ${obj}_jumpReady = true;\n`;
          }
        } else {
          funcCode += `  if(getKey("ArrowUp", ${joyId})) obj.speedy = -${speedY};\n`;
          funcCode += `  if(getKey("ArrowDown", ${joyId})) obj.speedy = ${speedY};\n`;
          funcCode += `  var stickY = getAxes(1, ${joyId});\n`;
          funcCode += `  if(stickY < -0.3) obj.speedy = -${speedY};\n`;
          funcCode += `  if(stickY > 0.3) obj.speedy = ${speedY};\n`;
        }
        break;
      }
    }
    
    funcCode += '}\n';
    Blockly.JavaScript.definitions_[controlFuncName] = funcCode;
  }
  
  return `${controlFuncName}(${obj});\n`;
};

// Генератор кода для блока перемещения
javascript.javascriptGenerator.forBlock['object_teleport'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('OBJECT'));
  const mode = block.getFieldValue('MODE');
  
  if (mode === 'COORDS') {
    // Режим перемещения по координатам
    const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || '0';
    const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || '0';
    return `${obj}.x = ${x};\n${obj}.y = ${y};\n`;
  } else {
    // Режим перемещения к другому объекту
    const targetObj = generator.getVariableName(block.getFieldValue('TARGET_OBJECT'));
    return `${obj}.x = ${targetObj}.x;\n${obj}.y = ${targetObj}.y;\n`;
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

// Генератор кода для блока проверки имени объекта
javascript.javascriptGenerator.forBlock['if_object_name_equals'] = function(block, generator) {
  const objectType = block.getFieldValue('OBJECT_TYPE');
  const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || '""';
  
  return [`(${objectType}.name === ${name})`, javascript.Order.ATOMIC];
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