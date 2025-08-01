"use strict";

let projectSettings = {
    name: "Untitled",
    author: "",
    icon: "data:image/jpeg;base64," + ico,
    enableVirtualGamepad: true,
    keyRemapping: { // Дефолтные значения соответствуют оригинальным
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
    },
    code: null
};

const customTheme = Blockly.Theme.defineTheme('transparentTheme', {
	'base': Blockly.Themes.Classic,
	'componentStyles': {
		'workspaceBackgroundColour': 'transparent',
		'flyoutBackgroundColour': '#f5f5f5'
	}
});

// Инициализация Blockly workspace
const workspace = Blockly.inject('blocklyDiv', {
	// Настройка toolbox с категориями блоков
	toolbox: `
    <xml>
        <category name="${Blockly.Msg['GAME']}" colour="60">
            <block type="get_key_pressed"></block>
            <block type="get_key_down"></block>
			<block type="get_joy_count"></block>
            <block type="get_axes"></block>
			<block type="game_pause"></block>
            <block type="get_time"></block>
            <block type="get_memory"></block>
            <block type="get_touch"></block>
            <block type="get_touchxy"></block>
			<block type="game_vibrate"></block>
			<block type="set_timer">
			  <field name="BODY"></field>
			  <value name="time">
				<shadow type="math_number">
				  <field name="NUM">1000</field>
				</shadow>
			  </value>
			</block>
			<block type="set_interval">
			  <field name="CALLBACK"></field>
			  <value name="INTERVAL">
				<shadow type="math_number">
				  <field name="NUM">1000</field>
				</shadow>
			  </value>
			</block>
			<block type="clear_interval"></block>
            <block type="music_block"></block>
            <block type="play_music"></block>
			<block type="audio_block"></block>
			<block type="play_sound"></block>
			<block type="level_editor"></block>
			<block type="set_background"></block>
			<block type="set_background_xy"></block>
			<block type="set_tile"></block>
			<block type="get_tile_at"></block>
			<block type="set_tile_at"></block>
			<block type="save_vars_with_values"></block>
			<block type="load_vars_with_values"></block>
			<block type="reset"></block>
            <block type="field_multilineinput"></block>
        </category>
        <category name="${Blockly.Msg['OBJECTS']}" colour="340">
			<block type="new_proto_object"></block>
            <block type="new_object"></block>
			<block type="new_object_from_proto"></block>
            <block type="clone_object"></block>
			<block type="game_copy_state"></block>
            <block type="delete_object"></block>
            <block type="change_object_var"></block>
            <block type="addto_object_var"></block>
			<block type="get_object"></block>
            <block type="get_object_var"></block>
			<block type="get_colliding_tile_info"></block>
			<block type="object_onstep"></block>
			<block type="object_oncollision"></block>
			<block type="object_iterate"></block>
        </category>
		<category name="${Blockly.Msg['MOVE']}" colour="190">
			<block type="set_gravitation"></block>
			<block type="set_object_bounding"></block>
			<block type="object_control"></block>
            <block type="object_velocity"></block>
			<block type="object_teleport"></block>
            <block type="object_distance"></block>
			<block type="collision_detect"></block>
			<block type="set_screen_xy"></block>
			<block type="get_window_position"></block>
			<block type="camera_follow"></block>
		</category>
        <category name="${Blockly.Msg['LOGIC']}" colour="210">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
            <block type="logic_null"></block>
            <block type="logic_ternary"></block>
			<block type="if_object_name_equals"></block>
			<block type="object_exit_screen"></block>
			<block type="object_tap_screen"></block>
			<block type="is_colliding_with_tile"></block>
			<block type="is_paused"></block>
        </category>
        <category name="${Blockly.Msg['LOOPS']}" colour="120">
            <block type="controls_repeat_ext">
                <value name="TIMES">
                    <block type="math_number">
                        <field name="NUM">10</field>
                    </block>
                </value>
            </block>
            <block type="controls_whileUntil"></block>
            <block type="controls_for">
                <value name="FROM">
                    <block type="math_number">
                        <field name="NUM">1</field>
                    </block>
                </value>
                <value name="TO">
                    <block type="math_number">
                        <field name="NUM">10</field>
                    </block>
                </value>
                <value name="BY">
                    <block type="math_number">
                        <field name="NUM">1</field>
                    </block>
                </value>
            </block>
            <block type="controls_forEach"></block>
            <block type="controls_flow_statements"></block>
        </category>
        <category name="${Blockly.Msg['MATH']}" colour="225">
            <block type="math_number"></block>
            <block type="math_arithmetic"></block>
            <block type="math_single"></block>
            <block type="math_trig"></block>
            <block type="math_constant"></block>
            <block type="math_number_property"></block>
            <block type="math_change">
                <value name="DELTA">
                    <block type="math_number">
                        <field name="NUM">1</field>
                    </block>
                </value>
            </block>
            <block type="math_round"></block>
            <block type="math_on_list"></block>
            <block type="math_modulo"></block>
            <block type="math_constrain">
                <value name="LOW">
                    <block type="math_number">
                        <field name="NUM">1</field>
                    </block>
                </value>
                <value name="HIGH">
                    <block type="math_number">
                        <field name="NUM">100</field>
                    </block>
                </value>
            </block>
            <block type="math_random_int">
                <value name="FROM">
                    <block type="math_number">
                        <field name="NUM">1</field>
                    </block>
                </value>
                <value name="TO">
                    <block type="math_number">
                        <field name="NUM">100</field>
                    </block>
                </value>
            </block>
            <block type="math_random_float"></block>
        </category>
        <category name="${Blockly.Msg['TEXT']}" colour="165">
            <block type="text"></block>
            <block type="text_join"></block>
            <block type="text_append">
                <value name="TEXT">
                    <block type="text"></block>
                </value>
            </block>
            <block type="text_length"></block>
            <block type="text_isEmpty"></block>
            <block type="text_indexOf">
                <value name="VALUE">
                    <block type="variables_get">
                        <field name="VAR" class="textVar">...</field>
                    </block>
                </value>
            </block>
            <block type="text_charAt">
                <value name="VALUE">
                    <block type="variables_get">
                        <field name="VAR" class="textVar">...</field>
                    </block>
                </value>
            </block>
            <block type="text_getSubstring">
                <value name="STRING">
                    <block type="variables_get">
                        <field name="VAR" class="textVar">...</field>
                    </block>
                </value>
            </block>
            <block type="text_changeCase"></block>
            <block type="text_trim"></block>
            <block type="text_print_custom"></block>
            <block type="text_prompt_ext">
                <value name="TEXT">
                    <block type="text"></block>
                </value>
            </block>
        </category>
        <category name="${Blockly.Msg['LISTS']}" colour="255">
            <block type="lists_create_empty"></block>
            <block type="lists_create_with"></block>
            <block type="lists_repeat">
                <value name="NUM">
                    <block type="math_number">
                        <field name="NUM">5</field>
                    </block>
                </value>
            </block>
            <block type="lists_length"></block>
            <block type="lists_isEmpty"></block>
            <block type="lists_indexOf">
                <value name="VALUE">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
            </block>
            <block type="lists_getIndex">
                <value name="VALUE">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
            </block>
            <block type="lists_setIndex">
                <value name="LIST">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
            </block>
            <block type="lists_getSublist">
                <value name="LIST">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
            </block>
            <block type="lists_split">
                <value name="DELIM">
                    <block type="text">
                        <field name="TEXT">,</field>
                    </block>
                </value>
            </block>
			<block type="lists_append">
				<value name="LIST">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
			</block>
			<block type="lists_pop_last">
				<value name="LIST">
                    <block type="variables_get">
                        <field name="VAR" class="listVar">...</field>
                    </block>
                </value>
			</block>
        </category>
        <category name="${Blockly.Msg['DRAWING']}" colour="30">
            <block type="field_colour"></block>
            <block type="draw_text"></block>
            <block type="draw_point"></block>
			<block type="draw_line"></block>
			<block type="draw_triangle"></block>
			<block type="draw_rect"></block>
            <block type="draw_object"></block>
            <block type="draw_image"></block>
            <block type="clear_screen"></block>
            <block type="field_png"></block>
			<block type="object_animation"></block>
			<block type="particles_create"></block>
			<block type="particles_preset"></block>
			<block type="particles_clear"></block>
        </category>
        <sep></sep>
        <category name="${Blockly.Msg['VARIABLES']}" custom="VARIABLE"></category>
        <category name="${Blockly.Msg['LOCAL_VARIABLES']}">
            <block type="create_local_var">
                <field name="VAR_NAME">x</field>
                <value name="VAR_VALUE">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
			<block type="addto_local_var">
                <field name="VAR_NAME">x</field>
                <value name="VAR_VALUE">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
            <block type="get_local_var">
                <field name="VAR_NAME">x</field>
            </block>
        </category>
        <category name="${Blockly.Msg['PROCEDURE']}" custom="PROCEDURE"></category>
    </xml>
    `,
	media: 'media/',
	theme: customTheme,
	renderer: 'thrasos',
	plugins: {
		// Плагины для прокрутки и управления workspace
		blockDragger: ScrollBlockDragger,
		metricsManager: ScrollMetricsManager,
	},
	move: {
		wheel: true, // Включение прокрутки колесиком мыши
	}
});

// Инициализация плагина для прокрутки
const plugin = new ScrollOptions(workspace);
plugin.init();

// Инициализация плагина для копирования/вставки между вкладками
const plugin1 = new CrossTabCopyPaste();
const options = {
	contextMenu: true,
	shortcut: true,
};
plugin1.init(options, () => {
	console.log('Use this error callback to handle TypeError while pasting');
});

// Настройка контекстного меню
Blockly.ContextMenuRegistry.registry.getItem('blockCopyToStorage').weight = 2;
Blockly.ContextMenuRegistry.registry.getItem('blockPasteFromStorage').weight = 3;

// Обработчик изменений в workspace
workspace.addChangeListener((event) => {
	// Обновляем списки переменных при добавлении/изменении блоков
	if (
		event.type === Blockly.Events.BLOCK_CREATE ||
		event.type === Blockly.Events.BLOCK_CHANGE ||
		event.type === Blockly.Events.BLOCK_DELETE) {
		Blockly.Variables.updateVarDropdowns();
	}
});

// Создание стартового блока game_loop
var startBlock = workspace.newBlock('game_loop');
startBlock.initSvg();
startBlock.render();
startBlock.setDeletable(false);
startBlock.setMovable(true);

// Обработчик удаления блоков - гарантируем, что всегда будет хотя бы один блок
Blockly.getMainWorkspace().addChangeListener(function (event) {
	const blocks = workspace.getAllBlocks(false);

	// Если блоков не осталось, добавляем стартовый блок
	if (blocks.length === 0) {
		var startBlock = workspace.newBlock('game_loop');
		startBlock.initSvg();
		startBlock.render();
		startBlock.setDeletable(false);
		startBlock.setMovable(true);
		workspace.variableMap.clear();
	}
});

function toggleBoth(checkbox) {
	// Обновить оба параметра игры
	Game.helper.enableDrawing = checkbox.checked;
	Game.helper.enableTouchInput = checkbox.checked;
}

function keyPreviewToggle(checkbox) {
	Game.helper.showGamepadButtons = checkbox.checked;
}

function toggleBoundingBox(checkbox) {
	draw_bounding_box = checkbox.checked;
}

function toggleDebug(checkbox) {
	const objectsList = document.getElementById("objectsList");
	const canvas = document.getElementById("cnv");

	if (checkbox.checked) {
		// Плавное появление objectsList
		objectsList.style.display = 'block';
		objectsList.style.opacity = '0';
		objectsList.style.width = '0';
		Game.helper.debug = true;

		setTimeout(() => {
			objectsList.style.opacity = '1';
			objectsList.style.width = '25%';
			canvas.style.marginRight = '0';
		}, 10); // Небольшая задержка для запуска анимации
	} else {
		// Плавное скрытие objectsList
		objectsList.style.opacity = '0';
		objectsList.style.width = '0';
		Game.helper.debug = false;

		setTimeout(() => {
			objectsList.style.display = 'none';
			canvas.style.marginLeft = 'auto'; // Центрируем canvas
			canvas.style.marginRight = 'auto';
		}, 300); // Ждем завершения анимации (0.3s)
	}

	// Пересчет размеров после анимации
	setTimeout(resizeCanvas, 310);
}

// Управление вкладками интерфейса
const tabs = document.querySelectorAll('.tabs__btn');
tabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const tabId = tab.getAttribute('data-tab');

		// Убираем активные классы у всех кнопок и контента
		document.querySelectorAll('.tabs__btn').forEach(btn => {
			btn.classList.remove('active');
		});
		document.querySelectorAll('.tabs__item').forEach(item => {
			item.classList.remove('active');
		});

		// Добавляем активные классы к текущей вкладке
		tab.classList.add('active');
		document.getElementById(tabId).classList.add('active');
		resizeCanvas();
	});
});

const dropdowns = document.querySelectorAll('.dropdown');

// Для устройств с сенсорным экраном
if (window.matchMedia("(hover: none)").matches) {
	dropdowns.forEach(dropdown => {
		const btn = dropdown.querySelector('.dropdown-btn');

		btn.addEventListener('click', function () {
			// Закрываем все другие открытые dropdown
			dropdowns.forEach(d => {
				if (d !== dropdown) {
					d.classList.remove('active');
				}
			});

			// Переключаем текущий dropdown
			dropdown.classList.toggle('active');
		});
	});

	// Закрываем dropdown при клике вне его
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.dropdown')) {
			dropdowns.forEach(dropdown => {
				dropdown.classList.remove('active');
			});
		}
	});
}

/**
 * Сохраняет текущий workspace в файл
 */
function saveToFile() {
    // Сохраняем текущее состояние рабочей области в projectSettings
    projectSettings.code = Blockly.serialization.workspaces.save(workspace);
    
    const state = JSON.stringify(projectSettings);
    
    // Создаём Blob и скачиваем файл
    const blob = new Blob([state], {
        type: 'text/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = projectSettings.name + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadJson(file) {
        const data = JSON.parse(file);
        
        // Проверяем, есть ли projectSettings в загружаемом файле
        if (data.code) {
            // Это файл с projectSettings
            Object.assign(projectSettings, data);
            if (projectSettings.name) {
                document.getElementById('projectNameInput').value = projectSettings.name;
            }
            if (projectSettings.author) {
                document.getElementById('projectAuthorInput').value = projectSettings.author;
            }
            if (projectSettings.enableVirtualGamepad !== undefined) {
                document.getElementById('enableVirtualGamepad').checked = projectSettings.enableVirtualGamepad;
            }
            if (projectSettings.icon !== undefined) {
                document.getElementById('icon').src = projectSettings.icon;
            }
			if (data.keyRemapping) {
				applyKeyRemapping();
			}
            // Загружаем рабочую область
            loadWorkspaceData(data.code);
        } else {
            // Это старый файл только с кодом
            loadWorkspaceData(data);
        }
}

// Обработчик загрузки workspace из файла
document.getElementById('loadFile').addEventListener('change', function (e) {
	const file = e.target.files[0];
	if (!file)
		return;

	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			// 1. Получаем имя файла без расширения
			const fileName = file.name;
			const lastDotIndex = fileName.lastIndexOf('.');
			const fileNameWithoutExtension = lastDotIndex === -1
				 ? fileName
				 : fileName.substring(0, lastDotIndex);

			projectSettings.name = fileNameWithoutExtension;

			loadJson(e.target.result);

		} catch (error) {
			console.error("Full error:", error);
			alert(`Ошибка загрузки файла: ${error.message}\nПроверьте консоль для подробностей.`);
		}
	};
	reader.readAsText(file);
});

/**
 * Сохраняет workspace в localStorage
 */
function saveWorkspace() {
    if (typeof Blockly !== 'undefined' && workspace) {
        // Сохраняем текущее состояние рабочей области в projectSettings
        projectSettings.code = Blockly.serialization.workspaces.save(workspace);
        const workspaceJson = JSON.stringify(projectSettings);
        localStorage.setItem('blocklyWorkspace', workspaceJson);
    }
}

/**
 * Загружает workspace из localStorage
 */
function loadWorkspace() {
	const savedData = localStorage.getItem('blocklyWorkspace');
	if (savedData) {
		try {
			loadJson(savedData);
		} catch (e) {
			console.error('Error loading workspace:', e);
		}
	}
}

function loadWorkspaceData(workspaceData) {
    // 1. Очищаем текущую рабочую область
    workspace.clear();
    
    // 2. Сбрасываем массив локальных переменных
    Blockly.Variables.localVars = [];
    
    // 3. Парсим XML/JSON и предварительно собираем ВСЕ переменные
    if (typeof workspaceData === 'string') {
        // Для XML
        const xmlDoc = Blockly.Xml.textToDom(workspaceData);
        const allBlocks = xmlDoc.getElementsByTagName('block');
        
        Array.from(allBlocks).forEach(blockNode => {
            const blockType = blockNode.getAttribute('type');
            const mutation = blockNode.querySelector('mutation');
            
            // Для блоков create_local_var и get_local_var
            if (mutation && (blockType === 'create_local_var' || blockType === 'get_local_var')) {
                const varName = mutation.getAttribute('var_name');
                if (varName && !Blockly.Variables.localVars.includes(varName)) {
                    Blockly.Variables.localVars.push(varName);
                }
            }
            
            // Для стандартных переменных Blockly (если используются)
            const varNodes = blockNode.getElementsByTagName('field[name="VAR"]');
            Array.from(varNodes).forEach(fieldNode => {
                const varName = fieldNode.textContent;
                if (varName && !workspace.getVariable(varName)) {
                    workspace.createVariable(varName);
                }
            });
        });
    } else {
        // Для JSON (если workspaceData - объект)
        // Аналогичный обход блоков для поиска переменных
    }
    
    // 4. Загружаем данные в рабочую область
    Blockly.serialization.workspaces.load(workspaceData, workspace);
    
    // 5. Принудительно обновляем dropdown-ы локальных переменных
    workspace.getAllBlocks().forEach(block => {
        if (block.type === 'get_local_var' && block.updateVarDropdown) {
            block.updateVarDropdown();
        }
    });
    
    // 6. Обновляем стандартные переменные Blockly
    if (workspace.refreshToolboxSelectionForVariable) {
        workspace.getAllVariables().forEach(variable => {
            workspace.refreshToolboxSelectionForVariable(variable.name);
        });
    }
    
    // 7. Финальное обновление UI
    setTimeout(() => {
        workspace.render();
        
        // Фикс для shadow-блоков (если нужно)
        workspace.getAllBlocks().forEach(block => {
            if (block.isShadow()) {
                block.setShadow(true);
            }
        });
    }, 100);
}

// Загружаем workspace при старте
loadWorkspace();

// Сохраняем workspace при закрытии страницы
window.addEventListener('beforeunload', saveWorkspace);

function highlightJS(code) {
	const tokenTypes = [{
			type: 'comment',
			regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g
		}, {
			type: 'string',
			regex: /("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)/g
		}, {
			type: 'keyword',
			regex: /\b(function|if|else|for|while|return|var|let|const|new|this|true|false|null|undefined|try|catch|finally|throw|class|extends|export|import|default)\b/g
		}, {
			type: 'number',
			regex: /\b\d+\.?\d*\b/g
		}, {
			type: 'operator',
			regex: /([{}()[\];,.:=<>+\-*/%&|^~!?])/g
		}
	];

	let result = '';
	let lastIndex = 0;
	const tokens = [];

	// Собираем все токены, избегая перекрытий
	tokenTypes.forEach(({
			type,
			regex
		}) => {
		let match;
		regex.lastIndex = 0; // Сбрасываем lastIndex перед каждым новым поиском
		while (match = regex.exec(code)) {
			if (match.index >= lastIndex) {
				tokens.push({
					start: match.index,
					end: match.index + match[0].length,
					type,
					text: match[0]
				});
			}
		}
	});

	// Сортируем токены по позиции в коде
	tokens.sort((a, b) => a.start - b.start);

	// Строим итоговую строку
	for (const token of tokens) {
		if (token.start < lastIndex)
			continue; // Пропускаем перекрывающиеся токены
		result += code.slice(lastIndex, token.start);
		result += `<span class="js-${token.type}">${token.text}</span>`;
		lastIndex = token.end;
	}

	result += code.slice(lastIndex);
	return result;
}
/**
 * Генерирует и отображает код из блоков
 */
function showCode() {
	const code = getJScode(true);
	document.getElementById('codeOutput').innerHTML = highlightJS(code);
}

function addWatchdogToCode(code) {
	// Watchdog функция
	const watchdogFunc = `
        const __watchdog = () => {
            const __startTime = Date.now();
            return () => {
                if (Date.now() - __startTime > 1000) {
					showSwitchModal('error', "${Blockly.Msg['ERROR_INFINITE_LOOP']}",false,'OK');
                    throw new Error("${Blockly.Msg['ERROR_INFINITE_LOOP']}");
                }
            };
        };
    `;

	const modifiedCode = code
		// Обрабатываем while циклы
		.replace(/while\s*\(([^)]*)\)\s*\{([^}]*)\}/g, (match, condition, body) => {
			return `{
                const __check = __watchdog(); 
                while (${condition}) { 
                    ${body.replace(/\bcontinue\b/g, '__check(); continue')} 
                    __check(); 
                } 
            }`;
		})
		// Обрабатываем do...while циклы
		.replace(/do\s*\{([^}]*)\}\s*while\s*\(([^)]*)\);/g, (match, body, condition) => {
			return `{
                const __check = __watchdog(); 
                do { 
                    ${body.replace(/\bcontinue\b/g, '__check(); continue')} 
                    __check(); 
                } while (${condition}); 
            }`;
		});

	return `${watchdogFunc}\n${modifiedCode}`;
}

function translateError(error) {
	if (typeof error !== 'string') {
		error = error.message || error.toString();
	}

	const errorTranslations = {
		// Синтаксические ошибки
		"Unexpected token": "Неожиданный символ",
		"Unexpected identifier": "Неожиданный идентификатор",
		"Missing \\) after argument list": "Пропущена закрывающая скобка ')' после списка аргументов",
		"Missing \\} after function body": "Пропущена закрывающая скобка '}' после тела функции",
		"Missing \\] after element list": "Пропущена закрывающая скобка ']' после списка элементов",
		"Missing ' after string literal": "Пропущена закрывающая кавычка строки",
		"Unterminated string literal": "Незавершённая строковая константа",
		"Invalid left-hand side in assignment": "Недопустимое выражение в левой части присваивания",
		"Expected '\\)'": "Ожидалась закрывающая скобка ')'",
		"Expected '\\}'": "Ожидалась закрывающая скобка '}'",
		"Expected '\\]'": "Ожидалась закрывающая скобка ']'",
		"Expected ';'": "Ожидалась точка с запятой ';'",

		// Ошибки регулярных выражений
		"Invalid regular expression": "Некорректное регулярное выражение",
		"Unmatched '\\)'": "Непарная закрывающая скобка ')'",
		"Unmatched '\\('": "Непарная открывающая скобка '('",
		"Unmatched '\\]'": "Непарная закрывающая скобка ']'",
		"Unmatched '\\['": "Непарная открывающая скобка '['",
		"Unmatched '\\{'": "Непарная открывающая скобка '{'",
		"Unmatched '\\}'": "Непарная закрывающая скобка '}'",

		// Ошибки доступа к объектам и переменным
		"'.*' is not available in the sandbox": "Объект '.*' недоступен в песочнице",
		"Cannot read property '.*' of undefined": "Нельзя прочитать свойство '.*' у undefined",
		"Cannot read property '.*' of null": "Нельзя прочитать свойство '.*' у null",
		"undefined is not a function": "undefined не является функцией",
		"'.*' is not a function": "'.*' не является функцией",
		"'.*' is not defined": "'.*' не определён",
		"Cannot set property '.*' of undefined": "Нельзя установить свойство '.*' у undefined",
		"Cannot set property '.*' of null": "Нельзя установить свойство '.*' у null",

		// Ошибки выполнения
		"Maximum call stack size exceeded": "Превышен максимальный размер стека вызовов",
		"Invalid array length": "Некорректная длина массива",
		"Failed to fetch": "Ошибка загрузки данных (fetch)",
		"NetworkError when attempting to fetch resource": "Сетевая ошибка при загрузке ресурса",
		"404 Not Found": "404 Не найдено",
		"500 Internal Server Error": "500 Внутренняя ошибка сервера",
		"Script error.": "Ошибка в скрипте (CORS или другой источник)",

		// Ошибки промисов и асинхронности
		"Uncaught \\(in promise\\)": "Необработанная ошибка в промиссе",
		"Unhandled promise rejection": "Необработанный отказ промисса",
	};

	// Сначала проверяем ошибки песочницы
	if (error.includes("is not available in the sandbox")) {
		const objName = error.match(/"([^"]+)"/)?.[1] || "объект";
		return `Объект "${objName}" недоступен в песочнице`;
	}

	// Проверяем ошибки регулярных выражений
	if (error.includes("Invalid regular expression")) {
		const unmatchedCharMatch = error.match(/Unmatched '(.)'/);
		if (unmatchedCharMatch) {
			const char = unmatchedCharMatch[1];
			return `Некорректное регулярное выражение: непарная скобка '${char}'`;
		}
		return "Некорректное регулярное выражение";
	}

	// Проверяем остальные ошибки
	for (const[key, translation]of Object.entries(errorTranslations)) {
		// Escape special regex characters except for our .* patterns
		const escapedKey = key.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1')
			.replace(/\\\.\\\*/g, '(.*?)');
		const regex = new RegExp(escapedKey);
		if (regex.test(error)) {
			const match = error.match(regex);
			if (match && match[1]) {
				return translation.replace('.*', `'${match[1]}'`);
			}
			return translation;
		}
	}

	return `Неизвестная ошибка: ${error}`;
}

function gameEval(code) {
  try {
    eval(code); // Да, eval — но в вашем случае он уже используется
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message, stack: e.stack };
  }
}
/**
 * Выполняет сгенерированный код
 */
function runJS() {
  Game._resetInternal();

  const workspace = Blockly.getMainWorkspace();
  const allVariables = workspace.getAllVariables();
  const localVarIds = new Set(Blockly.Variables.localVars || []);

  // Убедимся, что генератор инициализирован
  if (!Blockly.JavaScript.variableDB_) {
    Blockly.JavaScript.init(workspace);
  }

  // Подготовим массив пар: { originalName, generatedName }
  const globalVarMappings = allVariables
    .filter(variable => !localVarIds.has(variable.id))
    .map(variable => {
      const generatedName = Blockly.JavaScript.getVariableName(variable.id);
      return {
        originalName: variable.name,     // оригинальное имя из блока
        generatedName: generatedName     // имя, которое используется в JS
      };
    })
    .filter(mapping => mapping.generatedName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(mapping.generatedName));

  const userCode = getJScode();

  // Генерируем код для сбора значений по сгенерированным именам,
  // но сохраняем их под оригинальными именами
  const collectionCode = `
  ;!function() {
    Game.helper.globalArray = {};

    const mappings = ${JSON.stringify(globalVarMappings)};

    mappings.forEach(function(mapping) {
      const originalName = mapping.originalName;
      const generatedName = mapping.generatedName;

      Object.defineProperty(Game.helper.globalArray, originalName, {
        enumerable: true,
        configurable: true,
        get: function() {
          try {
            // Способ 1: безопасный доступ через typeof + eval
            return eval(\`typeof \${generatedName} !== 'undefined' ? \${generatedName} : undefined\`);
          } catch (e) {
            // На всякий случай
            return undefined;
          }
        }
      });
    });
  }();
`;

  const initCode = 'Game.init = function () {' + 
    addWatchdogToCode(userCode + collectionCode) + 
    '}';

  Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
  Game.helper.pause = false;

  const result = gameEval(initCode);

  if (!result.success) {
    const userMessage = savedLanguage === 'ru'
      ? 'Программа прервана: ' + translateError(result.error)
      : 'badCode: ' + result.error;

    showSwitchModal(
      savedLanguage === 'ru' ? 'ошибка' : 'error',
      userMessage,
      false,
      'ok'
    );
    return;
  }

  Game.init();
}
/**
 * Изменяет размер изображения и возвращает его в base64
 * @param {File} file - Файл изображения
 * @param {number} maxWidth - Максимальная ширина
 * @param {number} maxHeight - Максимальная высота
 * @returns {Promise<string>} Promise с base64 строкой изображения
 */
async function resizeImageToBase64(file, maxWidth = 256, maxHeight = 256) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				// Рассчитываем новые размеры с сохранением пропорций
				if (width > height) {
					if (width > maxWidth) {
						height *= maxWidth / width;
						width = maxWidth;
					}
				} else {
					if (height > maxHeight) {
						width *= maxHeight / height;
						height = maxHeight;
					}
				}

				canvas.width = maxWidth;
				canvas.height = maxHeight;

				const ctx = canvas.getContext('2d');

				// Рисуем изображение по центру canvas (с padding)
				const offsetX = (maxWidth - width) / 2;
				const offsetY = (maxHeight - height) / 2;
				ctx.drawImage(img, offsetX, offsetY, width, height);

				// Получаем base64
				var base64 = canvas.toDataURL('image/jpeg', 0.90);
				resolve(base64);
			};
			img.onerror = reject;
			img.src = event.target.result;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// Элементы управления иконкой приложения
var icoFileInput = document.getElementById('icoFileInput');
var previewImage = document.getElementById('icon');
var previewImageS = document.getElementById('iconPreview');

// Открываем окно выбора файла при клике на изображение
previewImage.addEventListener('click', () => {
	icoFileInput.click();
});

// Обработчик изменения иконки приложения
icoFileInput.addEventListener('change', async(e) => {
	const file = e.target.files[0];
	if (!file)
		return;

	try {
		const base64 = await resizeImageToBase64(file);
		previewImage.src = base64;
		previewImageS.src = base64;
		projectSettings.icon = base64;
	} catch (error) {
		console.error('Ошибка обработки изображения:', error);
	}
});

function capture() {
	const svg = workspace.getParentSvg();
	const bbox = svg.getBBox();

	// Создаем клон и добавляем стили
	const clone = svg.cloneNode(true);
	const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');

	// Инъекция критически важных стилей
	style.textContent = `
	.blocklyText { fill: #fff !important; }
	.blocklyPath { stroke: none !important; }
	.blocklyBlockBackground { fill-opacity: 1 !important; }
	.blocklyMainBackground { display: none !important; }
  `;
	clone.insertBefore(style, clone.firstChild);

	// Создаем canvas с повышенным DPI
	const scale = 2;
	const canvas = document.createElement('canvas');
	canvas.width = (bbox.width + 40) * scale;
	canvas.height = (bbox.height + 40) * scale;
	const ctx = canvas.getContext('2d');
	ctx.scale(scale, scale);

	// Конвертация
	const svgData = new XMLSerializer().serializeToString(clone);
	const img = new Image();

	img.onload = function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, -bbox.x + 20, -bbox.y + 20);

		// Фикс для черных полос (дополнительное затенение)
		ctx.globalCompositeOperation = 'destination-over';
		ctx.fillStyle = 'rgba(0,0,0,0)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const link = document.createElement('a');
		link.href = canvas.toDataURL('image/png');
		link.download = 'blockly_correct_colors.png';
		link.click();
	};

	img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(
					`<svg xmlns="http://www.w3.org/2000/svg" width="${bbox.width}" height="${bbox.height}" viewBox="0 0 ${bbox.width} ${bbox.height}">
	  ${svgData}
	</svg>`)));
}
// Добавляем пункт "Скриншот" в контекстное меню Blockly
Blockly.ContextMenuRegistry.registry.register({
	displayText: Blockly.Msg['CREATE_SCREENSHOT'],
	preconditionFn: () => 'enabled', // Всегда активно
	callback: async() => {
		try {
			capture();
		} catch (error) {
			console.error('Ошибка:', error);
		}
	},
	scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
	id: 'blockly_screenshot',
	weight: 100, // Позиция в меню (чем меньше, тем выше)
});

let isDragging = false;
let startX, startY;
let startLeft, startTop;
let currentModal = null;
let currentPrimaryHandler = null;
let currentSecondaryHandler = null;
let currentWindowClickHandler = null;
let currentKeydownHandler = null;
let currentHeaderMouseDownHandler = null;
let currentDocumentMouseMoveHandler = null;
let currentDocumentMouseUpHandler = null;

function showSwitchModal(title, message, showCancel = false, primaryBtnText = 'OK') {
	const modal = document.getElementById('switchModal');
	const modalContent = document.getElementById('modalContent');
	const modalTitle = document.getElementById('modalTitle');
	const modalMessage = document.getElementById('modalMessage');
	const primaryBtn = document.getElementById('modalPrimaryBtn');
	const secondaryBtn = document.getElementById('modalSecondaryBtn');
	const closeBtn = document.querySelector('.switch-modal-close');
	const modalHeader = document.querySelector('.switch-modal-header');

	// Удаляем предыдущие обработчики
	removeAllEventListeners();

	// Устанавливаем содержимое
	modalTitle.textContent = title;
	modalMessage.textContent = message;
	primaryBtn.textContent = primaryBtnText;

	// Настраиваем кнопки
	secondaryBtn.style.display = showCancel ? 'block' : 'none';
	secondaryBtn.textContent = Blockly.Msg['NO'];

	// Сбрасываем позиционирование
	modalContent.style.top = '';
	modalContent.style.left = '';
	modalContent.style.transform = '';

	// Показываем модальное окно с анимацией
	modal.style.display = 'flex';
	modalContent.classList.add('modal-show');
	modalContent.classList.remove('modal-hide');

	// Функция закрытия модального окна
	function closeModal() {
		modalContent.classList.add('modal-hide');
		modalContent.classList.remove('modal-show');

		setTimeout(() => {
			modal.style.display = 'none';
			removeAllEventListeners();
		}, 300);
	}

	// Обработчик для основной кнопки
	currentPrimaryHandler = closeModal;
	primaryBtn.addEventListener('click', currentPrimaryHandler);

	// Обработчик для кнопки отмены
	if (showCancel) {
		currentSecondaryHandler = closeModal;
		secondaryBtn.addEventListener('click', currentSecondaryHandler);
	}

	// Обработчик для крестика
	closeBtn.onclick = closeModal;

	// Обработчик для клика вне окна
	currentWindowClickHandler = function (event) {
		if (event.target === modal) {
			closeModal();
		}
	};
	window.addEventListener('click', currentWindowClickHandler);

	// Обработчик для клавиши Esc
	currentKeydownHandler = function (event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	};
	document.addEventListener('keydown', currentKeydownHandler);

	// Обработчики для перемещения окна
	currentHeaderMouseDownHandler = function (e) {
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;

		const rect = modalContent.getBoundingClientRect();
		startLeft = rect.left;
		startTop = rect.top;

		modalContent.style.transition = 'none';
		document.body.style.cursor = 'grabbing';

		e.preventDefault();
	};

	currentDocumentMouseMoveHandler = function (e) {
		if (!isDragging)
			return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		modalContent.style.left = `${startLeft + dx}px`;
		modalContent.style.top = `${startTop + dy}px`;
	};

	currentDocumentMouseUpHandler = function () {
		if (!isDragging)
			return;

		isDragging = false;
		modalContent.style.transition = '';
		document.body.style.cursor = '';
	};

	modalHeader.addEventListener('mousedown', currentHeaderMouseDownHandler);
	document.addEventListener('mousemove', currentDocumentMouseMoveHandler);
	document.addEventListener('mouseup', currentDocumentMouseUpHandler);

	// Возвращаем объект с методами для обработки действий
	return {
		onConfirm: (callback) => {
			primaryBtn.removeEventListener('click', currentPrimaryHandler);
			currentPrimaryHandler = function () {
				callback();
				closeModal();
			};
			primaryBtn.addEventListener('click', currentPrimaryHandler);
		},
		onCancel: (callback) => {
			if (showCancel) {
				secondaryBtn.removeEventListener('click', currentSecondaryHandler);
				currentSecondaryHandler = function () {
					callback();
					closeModal();
				};
				secondaryBtn.addEventListener('click', currentSecondaryHandler);
			}
		}
	};
}

function removeAllEventListeners() {
	const primaryBtn = document.getElementById('modalPrimaryBtn');
	const secondaryBtn = document.getElementById('modalSecondaryBtn');
	const modalHeader = document.querySelector('.switch-modal-header');

	if (currentPrimaryHandler && primaryBtn) {
		primaryBtn.removeEventListener('click', currentPrimaryHandler);
	}
	if (currentSecondaryHandler && secondaryBtn) {
		secondaryBtn.removeEventListener('click', currentSecondaryHandler);
	}
	if (currentWindowClickHandler) {
		window.removeEventListener('click', currentWindowClickHandler);
	}
	if (currentKeydownHandler) {
		document.removeEventListener('keydown', currentKeydownHandler);
	}
	if (currentHeaderMouseDownHandler && modalHeader) {
		modalHeader.removeEventListener('mousedown', currentHeaderMouseDownHandler);
	}
	if (currentDocumentMouseMoveHandler) {
		document.removeEventListener('mousemove', currentDocumentMouseMoveHandler);
	}
	if (currentDocumentMouseUpHandler) {
		document.removeEventListener('mouseup', currentDocumentMouseUpHandler);
	}

	// Сбрасываем состояние перетаскивания
	isDragging = false;
	document.body.style.cursor = '';
}

function resizeCanvas() {
	const container = document.getElementById('screen-container');
	const canvas = document.getElementById('cnv');
	const objectsList = document.getElementById('objectsList');

	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;
	const targetRatio = 16 / 9;

	// Проверяем, виден ли objectsList (учитываем анимацию)
	const isObjectsListVisible =
		objectsList.style.display !== 'none' &&
		window.getComputedStyle(objectsList).display !== 'none';

	// Ширина objectsList (0, если скрыт)
	const listWidth = isObjectsListVisible ?
		parseFloat(window.getComputedStyle(objectsList).width) : 0;

	// Доступная ширина для canvas
	const availableWidth = containerWidth - listWidth;

	// Рассчитываем размер canvas
	let canvasWidth = availableWidth;
	let canvasHeight = canvasWidth / targetRatio;

	// Если высота больше контейнера — уменьшаем
	if (canvasHeight > containerHeight) {
		canvasHeight = containerHeight;
		canvasWidth = canvasHeight * targetRatio;
	}

	// Устанавливаем размеры
	canvas.style.width = `${canvasWidth}px`;
	canvas.style.height = `${canvasHeight}px`;

	// Обновляем внутреннее разрешение (если нужно)
	canvas.width = 1280;
	canvas.height = 720;

	// Синхронизируем высоту objectsList
	if (isObjectsListVisible) {
		objectsList.style.height = `${canvasHeight}px`;
	}
}

// Функция для отображения модального окна настроек
function showSettingsModal() {
    // Заполняем основные поля
    document.getElementById('projectNameInput').value = projectSettings.name;
    document.getElementById('projectAuthorInput').value = projectSettings.author;
    document.getElementById('enableVirtualGamepad').checked = projectSettings.enableVirtualGamepad;
    document.getElementById('iconPreview').src = projectSettings.icon;
    
    // Заполняем таблицу переназначения клавиш
    const keyMappingTable = document.getElementById('keyMappingTable');
    keyMappingTable.innerHTML = ''; // Очищаем таблицу
    
    // Добавляем заголовки
    const headerRow = keyMappingTable.insertRow();
    headerRow.innerHTML = '<th>' + Blockly.Msg['KEY_LABEL'] + '</th><th>' + Blockly.Msg['KEY_LABEL_OLD'] + '</th><th>' + Blockly.Msg['KEY_LABEL_NEW'] + '</th>';
    
    // Добавляем строки для каждой клавиши
    for (const [originalKey, currentMapping] of Object.entries(projectSettings.keyRemapping)) {
        const row = keyMappingTable.insertRow();
        
        // Название кнопки
        const keyNameCell = row.insertCell();
        keyNameCell.textContent = getKeyDisplayName(originalKey);
        
        // Текущее назначение
        const currentCell = row.insertCell();
        currentCell.textContent = getKeyDisplayName(currentMapping);
        
        // Поле для нового назначения
        const newCell = row.insertCell();
        const input = document.createElement('input');
        input.type = "text";
        input.value = currentMapping;
        input.dataset.originalKey = originalKey;
        input.addEventListener('keydown', function(e) {
            e.preventDefault();
            this.value = e.code;
            currentCell.textContent = getKeyDisplayName(e.code);
        });
        newCell.appendChild(input);
    }
    
    // Показываем модальное окно с анимацией
    const modal = document.getElementById('settingsModal');
    const modalContent = document.querySelector('.settings-modal-content');
    
    modal.style.display = 'flex';
    modalContent.classList.add('settings-modal-show');
    modalContent.classList.remove('settings-modal-hide');
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const modalContent = document.querySelector('.settings-modal-content');
    
    modalContent.classList.add('settings-modal-hide');
    modalContent.classList.remove('settings-modal-show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function getKeyDisplayName(code) {
    const keyNames = {
        "KeyA": "A",
        "KeyS": "B",
        "KeyX": "X",
        "KeyZ": "Y",
        "KeyW": "L",
        "KeyE": "R",
        "KeyQ": "ZL",
        "KeyR": "ZR",
        "KeyPlus": "+",
        "KeyMinus": "-",
        "ArrowLeft": "←",
        "ArrowUp": "↑",
        "ArrowRight": "→",
        "ArrowDown": "↓",
        "KeyJ": "LStick ←",
        "KeyI": "LStick ↑",
        "KeyL": "LStick →",
        "KeyK": "LStick ↓",
        "KeyRStickLeft": "RStick ←",
        "KeyRStickUp": "RStick ↑",
        "KeyRStickRight": "RStick →",
        "KeyRStickDown": "RStick ↓",
    };
    
    return keyNames[code] || code;
};

function applyKeyRemapping() {
    if (!projectSettings.keyRemapping) return;

    // Применяем переназначения
    for (const [originalKey, remappedKey] of Object.entries(projectSettings.keyRemapping)) {
        if (originalKey in Game.helper.keyRemapping && remappedKey) {
            Game.helper.keyRemapping[originalKey] = remappedKey;
        }
    }
};

function resetKeyMappings() {
    // Стандартные значения клавиш
    const defaultKeyMappings = {
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

    // Обновляем projectSettings
    projectSettings.keyRemapping = JSON.parse(JSON.stringify(defaultKeyMappings));
    
    // Обновляем таблицу в модальном окне
    const inputs = document.querySelectorAll('#keyMappingTable input');
    inputs.forEach(input => {
        const originalKey = input.dataset.originalKey;
        input.value = defaultKeyMappings[originalKey];
		Game.helper.keyRemapping[originalKey] = defaultKeyMappings[originalKey];
        // Обновляем отображение текущего значения
        input.parentElement.previousElementSibling.textContent = getKeyDisplayName(defaultKeyMappings[originalKey]);
    });

    // Показываем уведомление
    showSwitchModal('!', Blockly.Msg['KEY_RESETED'], false, 'OK');
}

// Функция для сохранения настроек
function saveSettings() {
    projectSettings.name = document.getElementById('projectNameInput').value || "Untitled";
    projectSettings.author = document.getElementById('projectAuthorInput').value || "Corax89";
    projectSettings.enableVirtualGamepad = document.getElementById('enableVirtualGamepad').checked;
    
    // Сохраняем переназначения клавиш
    const inputs = document.querySelectorAll('#keyMappingTable input');
    inputs.forEach(input => {
        const originalKey = input.dataset.originalKey;
        projectSettings.keyRemapping[originalKey] = input.value;
		Game.helper.keyRemapping[originalKey] = input.value;
    });
    
    closeSettingsModal();
}

// Функция для загрузки настроек при старте
function loadSettings() {

}

// Вызываем загрузку настроек при загрузке страницы
window.addEventListener('DOMContentLoaded', loadSettings);

// Вызывать при загрузке и ресайзе
window.addEventListener('resize', resizeCanvas);
// Инициализация мини-карты workspace (должна быть в конце)
const minimap = new Minimap(workspace);
minimap.init();
