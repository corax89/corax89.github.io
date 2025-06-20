
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
  [Blockly.Msg['OBJECT_PARAM_ISONGROUND'], 'isOnGround']
];

var ObjectType = [
  [Blockly.Msg['OBJECT_TYPE_COLLIDED'], 'object'],
  [Blockly.Msg['OBJECT_TYPE_THIS'], 'this'],
  [Blockly.Msg['OBJECT_TYPE_ITERATED'], 'object']
];

// ========= Вспомогательные функции ========

var proto_object_array = [];
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

// Блок проверки нажатия клавиши
Blockly.Blocks['get_key_down'] = {
  init: function() {
    this.setColour(60);
    this.appendDummyInput("KEY")
        .appendField(Blockly.Msg['KEY_DOWN_LABEL'])
        .appendField(new Blockly.FieldDropdown([
          ["🡅", "ArrowUp"],
          ["🡇", "ArrowDown"],
          ["🡆", "ArrowLeft"],
          ["🡄", "ArrowRight"],
          ["🅐", "KeyA"],
          ["🅑", "KeyB"],
          ["🅧", "KeyX"],
          ["🅨", "KeyY"]
        ]), "KEY");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
	this.setHelpUrl(Blockly.Msg['HELP_A'] + '#control');
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
          ["🡆", "ArrowLeft"],
          ["🡄", "ArrowRight"],
		  ["🅐", "KeyA"],
          ["🅑", "KeyB"],
          ["🅧", "KeyX"],
          ["🅨", "KeyY"]
        ]), "KEY");
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
	this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#control');
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
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
	this.setHelpUrl(Blockly.Msg['HELP_A'] + 'html#control');
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
    shadowBlockSize.initSvg();
    shadowBlockSize.render();
    sizeInput.connection.connect(shadowBlockSize.outputConnection);
    shadowBlockSize.setShadow(true);
    
    // Цвет текста (используем ваш field_colour как shadow block)
    const colourInput = this.appendValueInput("Colour")
        .setCheck("Colour")
        .appendField(Blockly.Msg['COLOR_LABEL']);
    
    // Создаем теневой блок на основе field_colour
    const shadowBlockColour = this.workspace.newBlock('field_colour');
    shadowBlockColour.setFieldValue('#FFFFFF', 'FIELDCOLOUR'); // Используем ваш ID поля
    shadowBlockColour.initSvg();
    shadowBlockColour.render();
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
    this.setColour(60);
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
    shadowBlockColour.initSvg();
    shadowBlockColour.render();
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
    this.setColour(60);
    this.appendDummyInput()
        .appendField(Blockly.Msg['PLAY_MUSIC_LABEL']);
    this.appendValueInput("String")
        .setCheck("String")
        .appendField(Blockly.Msg['MUSIC_LABEL']);
    const durationInput = this.appendValueInput("Number")
        .setCheck("Number")
        .appendField(Blockly.Msg['DURATION_LABEL']);
		
	const shadowBlockSize = this.workspace.newBlock('math_number');
    shadowBlockSize.setFieldValue('120', 'NUM');
    shadowBlockSize.initSvg();
    shadowBlockSize.render();
    durationInput.connection.connect(shadowBlockSize.outputConnection);
    shadowBlockSize.setShadow(true);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
  }
};

// Блок воспроизведения музыки
Blockly.Blocks['play_sound'] = {
  init: function() {
    this.setColour(60);
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
      .appendField(new FieldLevelEditor('[]', null, {}), 'LEVEL_DATA');
    this.setColour(60);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
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

// Блок таймера
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
    // 1. Очищаем массив
    proto_object_array = [];

    // 2. Находим все блоки типа 'new_proto_object'
    const blocks = workspace.getAllBlocks();
    const protoBlocks = blocks.filter(block => block.type === 'new_proto_object');

    // 3. Заполняем массив заново с проверкой дубликатов
    const usedNames = new Set(); // Для отслеживания уже использованных имен
    
    for (const block of protoBlocks) {
      const objectName = block.getFieldValue('Object');
      if (!objectName || objectName === 'null') continue; // Пропускаем невалидные

      // Проверяем, не существует ли уже такое имя
      if (usedNames.has(objectName)) {
        showSwitchModal('error', 'Внимание:%1 дублируется'.replace('%1', workspace.getVariableById(objectName).name), false, 'ok');
      }
      usedNames.add(objectName);

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
    //console.log('Массив перестроен. Текущие объекты:', proto_object_array);
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
    shadowBlockWidth.initSvg();
    shadowBlockWidth.render();
    widthInput.connection.connect(shadowBlockWidth.outputConnection);
    shadowBlockWidth.setShadow(true);
	
    const heightInput = this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
	const shadowBlockHeight = this.workspace.newBlock('math_number');
    shadowBlockHeight.setFieldValue('32', 'NUM');
    shadowBlockHeight.initSvg();
    shadowBlockHeight.render();
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
    shadowBlockWidth.initSvg();
    shadowBlockWidth.render();
    widthInput.connection.connect(shadowBlockWidth.outputConnection);
    shadowBlockWidth.setShadow(true);
	
    const heightInput = this.appendValueInput("Height")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT']);
	const shadowBlockHeight = this.workspace.newBlock('math_number');
    shadowBlockHeight.setFieldValue('32', 'NUM');
    shadowBlockHeight.initSvg();
    shadowBlockHeight.render();
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

    // Перерисовываем блок
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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
        .appendField(new Blockly.FieldVariable(
          Blockly.Msg['DEFAULT_VARIABLE_NAME'] || 'obj1',
          null, null, 'Object'), 'VAR_NAME')
        .appendField(Blockly.Msg['OBJECT_NAME_LABEL'] || 'Объект:')
        .setVisible(false);

    // Поле для выбора параметра
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(ObjectParam), 'NAME');

    this.setOutput(true, 'Number');
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

    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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

    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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
    // Основное поле с выбором режима
	this.setInputsInline(true);
    this.appendDummyInput()
        .appendField(Blockly.Msg['CHANGE_BOUNDING_LABEL'] || 'Изменить параметр:')
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

    // Поле для значения
    this.appendValueInput("WIDTH")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_WIDTH'] || 'Width');
	this.appendValueInput("HEIGHT")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_HEIGHT'] || 'Height');

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

    // Перерисовываем блок
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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

    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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
    this.setColour(340);
    
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
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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
    this.setColour(340);
    
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
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
  },
  
  saveExtraState: function() {
    return { mode: this.getFieldValue('MODE') };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode);
    this.setFieldValue(state.mode, 'MODE');
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
          [Blockly.Msg['STICK1_LABEL'], 'stick1']
        ]), 'type');
    this.appendValueInput("ValueX")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_SPEEDX']);
    this.appendValueInput("ValueY")
        .setCheck("Number")
        .appendField(Blockly.Msg['OBJECT_PARAM_SPEEDY']);
    this.setPreviousStatement(true, "Array");
    this.setNextStatement(true, "Array");
    this.setColour(340);
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
    this.setColour(340);
    
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
    
    // Перерисовка
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
  },
  
  saveExtraState: function() {
    return { mode: this.getFieldValue('MODE') };
  },
  
  loadExtraState: function(state) {
    this.updateShape_(state.mode);
    this.setFieldValue(state.mode, 'MODE');
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
    this.setColour(340);
    
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
    Blockly.Events.disable();
    this.render();
    Blockly.Events.enable();
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
    this.setColour(60);
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
    this.setColour(60);
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
	// Добавляем обработчик изменения поля
    this.getField('VAR_NAME').setValidator(this.validateVarName_.bind(this));
  },
  
  // Валидатор имени переменной
  validateVarName_: function(newName) {
    // Удаляем старую переменную (если имя меняется)
    const oldName = this.getFieldValue('VAR_NAME');
    if (oldName && oldName !== newName) {
      Blockly.Variables.removeVar(oldName);
    }
    
    // Добавляем новую переменную
    if (newName) {
      Blockly.Variables.addVar(newName);
    }
    
    return newName; // Принимаем новое имя
  }
};

Blockly.Blocks['addto_local_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg['ADDTO_LOCAL_VAR_LABEL'])
        .appendField(new Blockly.FieldDropdown(() => this.getVarOptions()), "VAR_NAME");
    this.appendValueInput("VAR_VALUE")
        .setCheck(null)
        .appendField(Blockly.Msg['WITH_VALUE_LABEL']);
	this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  },
  
  // Возвращает актуальный список переменных
  getVarOptions: function() {
    const options = Blockly.Variables.localVars.map(name => [name, name]);
    return options.length ? options : [[Blockly.Msg['NO_VARS_LABEL'], ""]];
  },
  
  updateVarDropdown: function(v) {
    const dropdown = this.getField('VAR_NAME');
    if (dropdown) {
      dropdown.selectedOptions = v;
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
  },
  
  // Возвращает актуальный список переменных
  getVarOptions: function() {
    const options = Blockly.Variables.localVars.map(name => [name, name]);
    return options.length ? options : [[Blockly.Msg['NO_VARS_LABEL'], ""]];
  },
  
  updateVarDropdown: function(v) {
    const dropdown = this.getField('VAR_NAME');
    if (dropdown) {
      dropdown.selectedOptions = v;
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

// Генератор для проверки нажатия клавиши
javascript.javascriptGenerator.forBlock['get_key_down'] = function(block, generator) {
  const button = block.getFieldValue('KEY');
  return [`Game.getKey("${button}")`, generator.ORDER_ATOMIC];
};

// Генератор для проверки нажатия клавиши
javascript.javascriptGenerator.forBlock['get_key_pressed'] = function(block, generator) {
  const button = block.getFieldValue('KEY');
  return [`Game.getKeyPress("${button}")`, generator.ORDER_ATOMIC];
};

// Генератор для получения значения оси
javascript.javascriptGenerator.forBlock['get_axes'] = function(block, generator) {
  const axis = block.getFieldValue('KEY');
  return [`Game.getAxes(${axis})`, generator.ORDER_ATOMIC];
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
javascript.javascriptGenerator.forBlock['level_editor'] = function(block, generator) {
  // Получаем значение поля (JSON строку)
  const levelData = JSON.parse(block.getFieldValue('LEVEL_DATA'));
  
  // Проверяем, что у нас есть массив objects
  const originalArray = levelData.objects;
  
  const grouped = {};

  originalArray.forEach(item => {
    if (!grouped[item.protoIndex]) {
      grouped[item.protoIndex] = [];
    }
    grouped[item.protoIndex].push(item.x, item.y);
  });

  // Преобразуем объект в массив
  const resultArray = Object.keys(grouped).map(protoIndex => ({
    id: generator.getVariableName(proto_object_array[parseInt(protoIndex)].name),
    xy: grouped[protoIndex]
  }));

  return 'Game.addObjectsFromArray(' + JSON.stringify(resultArray).replace(/"id"\s*:\s*"([a-zA-Z_][a-zA-Z0-9_]*)"/g,'"id": $1') + ');';
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

  return !es6Keywords.some(keyword => code.includes(keyword));
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

// Генератор для таймера
javascript.javascriptGenerator.forBlock['set_timer'] = function(block, generator) {
  const body = generator.statementToCode(block, 'BODY');
  const time = generator.valueToCode(block, 'time', generator.ORDER_ATOMIC) || 0;
  return `Game.setTimeout(function(){${body}},${time});\n`;
};

// Генератор для создания прототипа объекта
javascript.javascriptGenerator.forBlock['new_proto_object'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const w = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC) || 0;
  const h = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC) || 0;
  const sprite = generator.valueToCode(block, 'Sprite', generator.ORDER_ATOMIC) || 0;
  const oncreate = generator.statementToCode(block, 'ONCREATE');
  
  let code = `${obj}={name:"${obj}",x:0,y:0,width:${w},height:${h},sprite:${sprite},local:{}};\n`;
  if(oncreate.length > 1) {
    code += `${obj}.onCreate=function(){\n${oncreate}};\n`;
  }
  return code;
};

// Генератор для создания объекта
javascript.javascriptGenerator.forBlock['new_object'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const x = generator.valueToCode(block, 'X', generator.ORDER_ATOMIC) || 0;
  const y = generator.valueToCode(block, 'Y', generator.ORDER_ATOMIC) || 0;
  const w = generator.valueToCode(block, 'Width', generator.ORDER_ATOMIC) || 0;
  const h = generator.valueToCode(block, 'Height', generator.ORDER_ATOMIC) || 0;
  const sprite = generator.valueToCode(block, 'Sprite', generator.ORDER_ATOMIC) || 0;
  const oncreate = generator.statementToCode(block, 'ONCREATE');
  
  let code = `${obj}=Game.addObject("${obj}",${x},${y},${w},${h},${sprite});\n`;
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
  const param = block.getFieldValue('NAME');
  const width = generator.valueToCode(block, 'WIDTH', javascript.Order.ATOMIC) || '0';
  const height = generator.valueToCode(block, 'HEIGHT', javascript.Order.ATOMIC) || '0';
  
  let code;
  if (mode === 'VAR') {
    const varName = generator.getVariableName(block.getFieldValue('VAR_NAME')) || 'obj1';
    code = `${varName}.boundingWidth = ${width};\n${varName}.boundingHeight = ${height};\n`;
  } else {
    // Для режимов object/this/iterated
    code = `${mode}.boundingWidth = ${width};\n${mode}.boundingHeight = ${height};\n`;
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

// Генератор для управления объектом
javascript.javascriptGenerator.forBlock['object_control'] = function(block, generator) {
  const obj = generator.getVariableName(block.getFieldValue('Object'));
  const type = block.getFieldValue('type');
  const speedx = generator.valueToCode(block, 'ValueX', generator.ORDER_ATOMIC) || 0;
  const speedy = generator.valueToCode(block, 'ValueY', generator.ORDER_ATOMIC) || 0;
  
  let code = `${obj}.speedx=0;${obj}.speedy=0;\n`;
  
  if(type === 'key') {
    code += `if(Game.getKey("ArrowLeft")){${obj}.speedx=-${speedx};}
if(Game.getKey("ArrowRight")){${obj}.speedx=${speedx};}
if(Game.getKey("ArrowUp")){${obj}.speedy=-${speedy};}
if(Game.getKey("ArrowDown")){${obj}.speedy=${speedy};}\n`;
  } 
  else if(type === 'stick0') {
    code += `if(Game.getAxes(0)<-0.3){${obj}.speedx=${speedx}*Game.getAxes(0);}
if(Game.getAxes(0)>0.3){${obj}.speedx=${speedx}*Game.getAxes(0);}
if(Game.getAxes(1)<-0.3){${obj}.speedy=${speedy}*Game.getAxes(1);}
if(Game.getAxes(1)>0.3){${obj}.speedy=${speedy}*Game.getAxes(1);}\n`;
  }
  else {
    code += `if(Game.getAxes(2)<-0.3){${obj}.speedx=${speedx}*Game.getAxes(2);}
if(Game.getAxes(2)>0.3){${obj}.speedx=${speedx}*Game.getAxes(2);}
if(Game.getAxes(3)<-0.3){${obj}.speedy=${speedy}*Game.getAxes(3);}
if(Game.getAxes(3)>0.3){${obj}.speedy=${speedy}*Game.getAxes(3);}\n`;
  }
  
  return code;
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

// Генератор для получения времени
javascript.javascriptGenerator.forBlock['get_time'] = function(block, generator) {
  return ["Date.now()", generator.ORDER_ATOMIC];
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