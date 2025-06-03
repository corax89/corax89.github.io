const TARGET_STRING = "==MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM==";
const ico="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";
const replacementTextInput = document.getElementById('Name');
document.getElementById("icon").src = "data:image/jpeg;base64," + ico;

function replaceBetweenMarkers(data, startMarker, endMarker, newContent, isbytes) {
	const textDecoder = new TextDecoder('utf-8');
	const textEncoder = new TextEncoder();
	
	// Convert markers and content to binary
	const startMarkerBytes = textEncoder.encode(startMarker);
	const endMarkerBytes = textEncoder.encode(endMarker);
	if(isbytes){
		// Создаем Uint8Array
		var newContentBytes = new Uint8Array(newContent.length);
		
		// Заполняем массив значениями
		for (let i = 0; i < newContent.length; i++) {
			newContentBytes[i] = newContent.charCodeAt(i);
		}
	}
	else
		var newContentBytes = textEncoder.encode(newContent);
	
	// Find start marker
	let startPos = -1;
	outer: for (let i = 0; i < data.length - startMarkerBytes.length; i++) {
		for (let j = 0; j < startMarkerBytes.length; j++) {
			if (data[i + j] !== startMarkerBytes[j]) {
				continue outer;
			}
		}
		startPos = i;
		break;
	}
	
	if (startPos === -1) {
		throw new Error('Start marker not found');
	}
	
	// Find end marker
	let endPos = -1;
	outer: for (let i = startPos; i < data.length - endMarkerBytes.length; i++) {
		for (let j = 0; j < endMarkerBytes.length; j++) {
			if (data[i + j] !== endMarkerBytes[j]) {
				continue outer;
			}
		}
		endPos = i + endMarkerBytes.length;
		break;
	}
	
	if (endPos === -1) {
		throw new Error('End marker not found');
	}
	
	// Calculate block size
	const oldBlockSize = endPos - startPos;
	
	// Create new buffer with same size
	const newBuffer = new Uint8Array(data.length);
	newBuffer.set(data);
	
	// Replace content
	if (newContentBytes.length <= oldBlockSize) {
		// New content fits - copy and pad with zeros
		newBuffer.set(newContentBytes, startPos);
		newBuffer.fill(0, startPos + newContentBytes.length, endPos);
	} else {
		// New content is too long - truncate it
		const truncatedContent = newContentBytes.slice(0, oldBlockSize);
		newBuffer.set(truncatedContent, startPos);
	}
	
	return newBuffer;
}

/**
 * Replaces ALL occurrences of a binary string with replacement text,
 * padding with zeros to maintain original length
 * 
 * @param {Uint8Array} originalData - Original binary data
 * @param {string} targetString - String to find and replace
 * @param {string} replacementText - Replacement text
 * @returns {Uint8Array} New data with replacements
 */
function replaceAllBinaryStrings(originalData, targetString, replacementText) {
    // Validate input
    if (!replacementText || replacementText.trim() === '') {
        throw new Error('Replacement text cannot be empty');
    }
    if (!targetString || targetString.trim() === '') {
        throw new Error('Target string cannot be empty');
    }

    // Convert strings to binary
    const encoder = new TextEncoder();
    const targetBytes = encoder.encode(targetString);
    let replacementBytes = encoder.encode(replacementText);

    // Validate replacement length
    if (replacementBytes.length > targetBytes.length) {
        replacementBytes = replacementBytes.slice(0, targetBytes.length);
        console.warn(`Replacement text truncated to ${targetBytes.length} bytes`);
    }

    // Create padded replacement (filled with zeros)
    const paddedReplacement = new Uint8Array(targetBytes.length);
    paddedReplacement.set(replacementBytes); // Rest will be zeros

    // Create copy of original data
    const newData = new Uint8Array(originalData);
    
    // Find and replace ALL occurrences
    let position = 0;
    let replacementsCount = 0;
    
    while (position !== -1) {
        position = findSequence(newData, targetBytes, position);
        
        if (position !== -1) {
            newData.set(paddedReplacement, position);
            position += targetBytes.length;
            replacementsCount++;
        }
    }

    if (replacementsCount === 0) {
        throw new Error('Target string not found in file');
    }

    console.log(`Replaced ${replacementsCount} occurrences`);
    return newData;
}

/**
 * Improved sequence finder with start position
 */
function findSequence(array, sequence, startPos = 0) {
    outer: for (let i = startPos; i <= array.length - sequence.length; i++) {
        for (let j = 0; j < sequence.length; j++) {
            if (array[i + j] !== sequence[j]) {
                continue outer;
            } 
        }
        return i;
    }
    return -1;
}

function getJScode(){
	rebuildProtoObjectArray();
	store_image_array = [];
	Blockly.JavaScript.lastError = false;
	var script = Blockly.JavaScript.workspaceToCode(workspace);
	var loadImage = '';
	for(var i = 0; i < store_image_array.length; i++){
		loadImage += `Draw.loadImage(${i},"${store_image_array[i].data}");\n`
	}
	return loadImage + script;
}

function buildSwitch(){
		// Заменяем контент между метками
	const state = getJScode();
	const replacementText = replacementTextInput.value.trim();
	if(newIco)
		var img = atob(newIco);
	else
		var img = atob(ico);
	// Validate input
	if (!replacementText) {
		showSwitchModal('error', Blockly.Msg['ENTER_NAME'], false, 'ok');
		throw new Error('Please enter replacement text');
	}
	var modifiedFile = replaceAllBinaryStrings(fileData_bytes, TARGET_STRING, replacementText);
	modifiedFile = replaceBetweenMarkers(modifiedFile
		,
		"+ICONFORCHANGE+",
		"+ENDICONFORCHANGE+",
		img, true
	);
	modifiedFile = replaceBetweenMarkers(modifiedFile
		,
		"/*====================START=======================*/",
		"/*====================END=======================*/",
		state, false
	);
	
	// Сохраняем результат
	const blob = new Blob([modifiedFile], {type: 'application/octet-stream'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = replacementText + '.nro';
	a.click();
}

function compressJS(code) {
    // 1. Удаляем все комментарии
    let noComments = code
        .replace(/\/\/.*$/gm, '')              // Однострочные
        .replace(/\/\*[\s\S]*?\*\//g, '');     // Многострочные
    
    // 2. Удаляем лишние пробелы и переносы строк
    return noComments
        .replace(/\s+/g, ' ')                  // Все пробелы -> один пробел
        .replace(/\s*([=+\-*\/%&|^~!<>?:;,{}()[\]])\s*/g, '$1') // Удаляем пробелы вокруг операторов
        .trim();
}

function buildHTML() {
	reset_game();
	
	function serializeObject(obj) {
        const props = [];
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'function') {
                props.push(`${key}: ${value.toString()}`);
            } else {
                props.push(`${key}: ${JSON.stringify(value)}`);
            }
        }
        return `{\n${props.map(p => `        ${p}`).join(',\n')}\n    }`;
    }
	
	const customScript = getJScode();
	// Формируем содержимое HTML-документа
	// Получаем исходный код существующих объектов
    const drawCode = compressJS(serializeObject(Draw));
    const gameCode = compressJS(serializeObject(Game));
    const gameLoopCode = compressJS(game_loop.toString());

    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${replacementTextInput.value}</title></head>
<body style="margin:0;padding:0;overflow:hidden;background-color:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;">
<canvas width="1280" height="720" id="cnv" style="background-color:black;box-shadow:0 0 10px rgba(0,0,0,0.5);width:100vw;height:56.25vw;max-height:100vh;max-width:177.78vh;object-fit:contain;"></canvas>
<script>var image_array = [];var game_helper_timers = [];var gravitation = 0;var gamepads = {};var inputState = {};var local = {};var draw_bounding_box = false;
const canvas = document.getElementById("cnv");const ctx = canvas.getContext("2d");const Draw = ${drawCode};const Game = ${gameCode};var debugShowExpandedObjectsBorder = false;
const globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();const MAX_CONCURRENT_MELODIES = 8;let activeMelodies = 0;const melodyQueue = [];
function checkTouchButtons(x,y,isPressed){if(!Game.enableTouchInput)return!1;for(const btnId in inputState.touchButtons){const btn=inputState.touchButtons[btnId];
if(x>=btn.x&&x<=btn.x+btn.width&&y>=btn.y&&y<=btn.y+btn.height){btn.isPressed=isPressed;inputState.keys[btn.keyCode]=isPressed;if(isPressed){inputState.pressKeys[btn.keyCode]=!0};return!0}}return!1}
${gameLoopCode}
Game.initSensorInput();Game.init();Game.enableTouchInput='ontouchstart' in window||(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)||(navigator.maxTouchPoints>0)||(navigator.msMaxTouchPoints>0);
${customScript}
game_loop();</script></body></html>`;

    // Создаем и скачиваем файл
    const blob = new Blob([htmlContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
	if(replacementTextInput.value.trim().length > 0)
		a.download = replacementTextInput.value.trim() + '.html';
	else
		a.download = 'game.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Пример использования:
// exportGamePage();
// Или с дополнительным скриптом:
// exportGamePage('console.log("Custom initialization");');