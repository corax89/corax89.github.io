"use strict";

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
            <block type="get_axes"></block>
            <block type="get_time"></block>
            <block type="get_memory"></block>
            <block type="get_touch"></block>
            <block type="get_touchxy"></block>
            <block type="collision_detect"></block>
            <block type="set_screen_xy"></block>
            <block type="set_gravitation"></block>
            <block type="set_timer"></block>
            <block type="music_block"></block>
            <block type="play_music"></block>
			<block type="level_editor"></block>
            <block type="field_multilineinput"></block>
        </category>
        <category name="${Blockly.Msg['OBJECTS']}" colour="340">
			<block type="new_proto_object"></block>
            <block type="new_object"></block>
			<block type="new_object_from_proto"></block>
            <block type="clone_object"></block>
            <block type="delete_object"></block>
            <block type="change_object_var"></block>
            <block type="addto_object_var"></block>
            <block type="get_object_var"></block>
            <block type="object_onstep"></block>
            <block type="object_oncollision"></block>
            <block type="object_exit_screen"></block>
            <block type="object_control"></block>
            <block type="object_velocity"></block>
            <block type="object_distance"></block>
            <block type="object_iterate"></block>
        </category>
        <category name="${Blockly.Msg['LOGIC']}" colour="210">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
            <block type="logic_null"></block>
            <block type="logic_ternary"></block>
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
            <block type="text_print"></block>
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
        </category>
        <category name="${Blockly.Msg['DRAWING']}" colour="30">
            <block type="field_colour"></block>
            <block type="draw_text"></block>
            <block type="draw_point"></block>
            <block type="draw_object"></block>
            <block type="draw_image"></block>
            <block type="clear_screen"></block>
            <block type="field_png"></block>
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
        event.type === Blockly.Events.BLOCK_DELETE
    ) {
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
Blockly.getMainWorkspace().addChangeListener(function(event) {
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
    });
});

const dropdowns = document.querySelectorAll('.dropdown');

// Для устройств с сенсорным экраном
if (window.matchMedia("(hover: none)").matches) {
	dropdowns.forEach(dropdown => {
		const btn = dropdown.querySelector('.dropdown-btn');
		
		btn.addEventListener('click', function() {
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
	document.addEventListener('click', function(e) {
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
    const state = JSON.stringify(Blockly.serialization.workspaces.save(workspace));
    
    // Создаём Blob и скачиваем файл
    const blob = new Blob([state], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.getElementById('Name').value + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadJson(file){
	// 2. Парсим JSON данные
	const data = JSON.parse(file);
	
	// 3. Очищаем текущую рабочую область
	workspace.clear();
	
	Blockly.serialization.workspaces.load(data, workspace);
	
	// 6. Обновляем представление переменных
	if (workspace.refreshToolboxSelectionForVariable) {
		workspace.getAllVariables().forEach(function(variable) {
			workspace.refreshToolboxSelectionForVariable(variable.name);
		});
	}
	
	// 7. Принудительно обновляем рабочую область
	setTimeout(() => {
		workspace.render();
		//workspace.zoomToFit();
		
		// Дополнительная проверка для shadow-блоков
		workspace.getAllBlocks().forEach(block => {
			if (block.isShadow()) {
				block.setShadow(true);
			}
		});
	}, 100);
}

// Обработчик загрузки workspace из файла
document.getElementById('loadFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // 1. Получаем имя файла без расширения
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const fileNameWithoutExtension = lastDotIndex === -1 
                ? fileName 
                : fileName.substring(0, lastDotIndex);

            document.getElementById('Name').value = fileNameWithoutExtension;
            
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
        const workspaceData = Blockly.serialization.workspaces.save(workspace);
        const workspaceJson = JSON.stringify(workspaceData);
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

// Загружаем workspace при старте
loadWorkspace();

// Сохраняем workspace при закрытии страницы
window.addEventListener('beforeunload', saveWorkspace);

function highlightJS(code) {
    const tokenTypes = [
        { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g },
        { type: 'string', regex: /("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)/g },
        { type: 'keyword', regex: /\b(function|if|else|for|while|return|var|let|const|new|this|true|false|null|undefined|try|catch|finally|throw|class|extends|export|import|default)\b/g },
        { type: 'number', regex: /\b\d+\.?\d*\b/g },
        { type: 'operator', regex: /([{}()[\];,.:=<>+\-*/%&|^~!?])/g }
    ];

    let result = '';
    let lastIndex = 0;
    const tokens = [];

    // Собираем все токены, избегая перекрытий
    tokenTypes.forEach(({ type, regex }) => {
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
        if (token.start < lastIndex) continue; // Пропускаем перекрывающиеся токены
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
    const code = getJScode();
    document.getElementById('codeOutput').innerHTML = highlightJS(code);
}

/**
 * Выполняет сгенерированный код
 */
function runJS() {
    reset_game();
    var code = getJScode();
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    try {
        eval(code);
    } catch (e) {
		showSwitchModal('error', 'badCode%1'.replace('%1', e), false, 'ok');
    }
};

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
var newIco = 0;

// Открываем окно выбора файла при клике на изображение
previewImage.addEventListener('click', () => {
    icoFileInput.click();
});

// Обработчик изменения иконки приложения
icoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const base64 = await resizeImageToBase64(file);
        previewImage.src = base64;
        newIco = base64.substring(base64.search(',') + 1);
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
  
  img.onload = function() {
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
	</svg>`
  )));
}
// Добавляем пункт "Скриншот" в контекстное меню Blockly
Blockly.ContextMenuRegistry.registry.register({
  displayText: Blockly.Msg['CREATE_SCREENSHOT'],
  preconditionFn: () => 'enabled', // Всегда активно
  callback: async () => {
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
	currentWindowClickHandler = function(event) {
		if (event.target === modal) {
			closeModal();
		}
	};
	window.addEventListener('click', currentWindowClickHandler);
	
	// Обработчик для клавиши Esc
	currentKeydownHandler = function(event) {
		if (event.key === 'Escape') {
			closeModal();
		}
	};
	document.addEventListener('keydown', currentKeydownHandler);
	
	// Обработчики для перемещения окна
	currentHeaderMouseDownHandler = function(e) {
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
	
	currentDocumentMouseMoveHandler = function(e) {
		if (!isDragging) return;
		
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		
		modalContent.style.left = `${startLeft + dx}px`;
		modalContent.style.top = `${startTop + dy}px`;
	};
	
	currentDocumentMouseUpHandler = function() {
		if (!isDragging) return;
		
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
			currentPrimaryHandler = function() {
				callback();
				closeModal();
			};
			primaryBtn.addEventListener('click', currentPrimaryHandler);
		},
		onCancel: (callback) => {
			if (showCancel) {
				secondaryBtn.removeEventListener('click', currentSecondaryHandler);
				currentSecondaryHandler = function() {
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

// Инициализация мини-карты workspace (должна быть в конце)
const minimap = new PositionedMinimap(workspace);
minimap.init();