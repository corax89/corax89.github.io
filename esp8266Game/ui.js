"use strict";
var sourceArea = document.getElementById('input');
var memoryArea = document.getElementById('ram');
var alertArea = document.getElementById("alert");
var debugArea = document.getElementById("debug");
var debugVarArea = document.getElementById("debugVariable");
var debugSprArea = document.getElementById("debugSprite");
var canvas = document.getElementById("screen");
var shadowcanvas = document.getElementById("copyscreen");
var shadowctx = document.getElementById("copyscreen").getContext('2d');
var memoryPage = 0; //указывает на одну из 255 страниц памяти по 255 байт для отображения
var cpuSpeed = 8000; //количество операций, выполняемых процессором за 16 миллисекунд
var cpuLostCycle = 0; //сколько циклов должно быть потеряно из-за операций рисования
var timerId; //таймер для вызова выполнения процессора
var asmSource; //код, полученный при компиляции
var debugVar = []; //таблица данных о именах и расположении в памяти переменных
var debugVarArr = [];
var numberDebugString = []; //таблица, указывающая соответствие строк кода исполняемым инструкциям
var numberLine = 0; //количество линий исходного кода
var thisDebugString = 0; //строка, которая в данный момент выполняется процессором
var globalJKey = 0; //массив кнопок геймпада
var globalKey = 0; //текущая нажатая на клавиатуре кнопка
var obj_wind; //переменные, используемые для перемещения окон
var soundTimer = 100; //время проигрывания ноты
var obj_drag_wind;
var delta_x = 0;
var delta_y = 0;
var file = '';
var isDebug = false;
var isRun = false;
var viewDebugV = false;
var debugCallCount = 0;
var tickCount = 0;
var isRedraw = true;
var language = 'eng';
var fileName = '';
var fileAuthor = '';
var fileIco = '';
var selectedArray = '';
var selectedLeft;
var selectedRight;
var colorHighliteTimer;
var isHighliteColor = true;
var timerstart = new Date().getTime(),
timertime = 0;
var screenTimeout;
var lineCountTimer;
var fontSizeInEditor = 13;
var timeForRedraw = 48;
var saveGifFrame = 0;
var gif;
var memoryType = 0;
var snapshots = [];
var secondWindow;
var serialBuffer = [];
var serialviewtype = 1;
var serialarray1 = [];
var serialarray2 = [];

sourceArea.addEventListener("click", testForImageArray, true);
sourceArea.onscroll = function (ev) {
	clearTimeout(lineCountTimer);
	lineCountTimer = requestAnimationFrame(lineCount);
};
sourceArea.onmousedown = function (ev) {
	this.mouseisdown = true;
}
sourceArea.onmouseup = function (ev) {
	this.mouseisdown = false;
	lineCount()
};
sourceArea.onmousemove = function (ev) {
	if (this.mouseisdown)
		lineCount()
};
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
window.addEventListener("resize", pixelColorHighlight);
setup_mouse("div_wind1", "drag_wind1");
sourceArea.onkeydown = sourceArea.onkeyup = sourceArea.onkeypress = sourceArea.oncut = sourceArea.onpaste = inputOnKey;
window.addEventListener('load', function () {
	var c = canvas;
	var detecttouch = !!('ontouchstart' in window) || !!('ontouchstart' in document.documentElement) || !!window.ontouchstart || !!window.Touch || !!window.onmsgesturechange || (window.DocumentTouch && window.document instanceof window.DocumentTouch);
	var ismousedown = false;
	var coordinate = [24, 130, 24, 156, 8, 143, 40, 143, 90, 150, 110, 135];

	function ontouch(e) {
		var rect = e.target.getBoundingClientRect();
		var touchobj = e.targetTouches; // reference first touch point (ie: first finger)
		globalJKey = 0;
		for (var i = 0; i < touchobj.length; i++) {
			var touchx = parseInt((touchobj[i].clientX - rect.left) * 128 / c.clientWidth);
			var touchy = parseInt((touchobj[i].clientY - rect.left) * 256 / c.clientHeight) - 40;
			//console.log(touchx, touchy);
			for (var j = 0; j < 8; j++) {
				if (touchx > coordinate[j * 2] && touchx < coordinate[j * 2] + 10 && touchy > coordinate[j * 2 + 1] - 10 && touchy < coordinate[j * 2 + 1]) {
					globalJKey |= 1 << j;
				}
				if (touchy < 120) {
					fullScr();
				}
			}
		}
		e.preventDefault();
	}

	c.addEventListener('touchstart', ontouch, false);
	c.addEventListener('touchend', ontouch, false);

}, false);

function saveAsGif() {
	gif = new GIF({
			workers: 2,
			quality: 30,
			repeat: 0,
			width: 256,
			height: 256
		});
	gif.on('finished', function (blob) {
		saveAs(blob, fileName + '.gif');
	});
	saveGifFrame = 80;
}

function addFontSize(isBig) {
	var ih = document.getElementById('inputImgHighlite');
	if (isBig >= 8 && isBig <= 30) {
		fontSizeInEditor = isBig;
	} else if (isBig && fontSizeInEditor < 28) {
		fontSizeInEditor += 2;
	} else if ((!isBig) && fontSizeInEditor > 11) {
		fontSizeInEditor -= 2;
	}
	sourceArea.style.fontSize = fontSizeInEditor + 'px';
	sourceArea.style.lineHeight = (fontSizeInEditor + 3) + 'px';
	ih.style.fontSize = fontSizeInEditor + 'px';
	ih.style.lineHeight = (fontSizeInEditor + 3) + 'px';
	lineCount();
}

function fullScr() {
	var el = document.getElementById('cont');
	if (el.webkitRequestFullScreen) {
		el.webkitRequestFullScreen();
	} else {
		el.mozRequestFullScreen();
	}
	startButton();
	display.redraw();
}

(function () {
	var url = window.location.href.toString();
	if (url.indexOf('?src=') > -1) {
		input.value = 'loading data from gist, please wait';
		var src = url.split('?src=');
		fetch('https://api.github.com/gists/' + src[1])
		.then(function (results) {
			return results.json();
		})
		.then(function (data) {
			var file = '';
			for (var i in data.files) {
				file = data.files[i].content;
				break;
			}
			input.value = file;
			pixelColorHighlight();
			setTimeout(lineCount, 300);
		});
	}
})();
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
			 || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function (callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function () {
					callback(currTime + timeToCall);
				},
					timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
}
	());

if (typeof document.getElementById("inputImgHighlite").scrollTo !== 'function') {
	isHighliteColor = false;
	document.getElementById("highliteColorCheckbox").style.display = 'none';
}

window.addEventListener("unload", function () {
	localStorage.setItem('save_source_code', sourceArea.value);
	localStorage.setItem('save_font_size', fontSizeInEditor);
});

function snapshotTable() {
	var sdiv = document.getElementById("snapshots");
	var s;
	try {
		s = JSON.parse(localStorage.getItem('save_snapshots'));
		if (s && s.length > 0)
			snapshots = s;
	} catch (e) {
		localStorage.setItem('save_snapshots', '');
		snapshots = [];
	}
	sdiv.innerHTML = '<button onclick="addSnapshotManually()">save snapshot</button><br>';
	if (s && s.length > 0) {
		for (var i = 0; i < s.length; i++) {
			sdiv.innerHTML += s[i].date + '<br>' + s[i].name +
			' <button onclick="loadSnapshot(' + i + ')">load</button> <button onclick="deliteSnapshot(' + i + ')">delite</button><br>';
		}
	}
}

function addSnapshotManually() {
	snapshots.push({
		date: new Date().toUTCString(),
		name: 'Manually',
		source: sourceArea.value
	});
	localStorage.setItem('save_snapshots', JSON.stringify(snapshots));
	snapshotTable();
}

function loadSnapshot(n) {
	sourceArea.value = snapshots[n].source;
	pixelColorHighlight();
}

function deliteSnapshot(n) {
	snapshots.splice(n, 1);
	localStorage.setItem('save_snapshots', JSON.stringify(snapshots));
	snapshotTable();
}

document.addEventListener("DOMContentLoaded", function () {
	var s = localStorage.getItem('save_source_code');
	var f = parseInt(localStorage.getItem('save_font_size'), 10);
	if (f >= 8 && f <= 30)
		addFontSize(f);
	if (s && s.length > 2) {
		sourceArea.value = s;
		pixelColorHighlight();
	}
	snapshotTable();
});

function useSpriteAsIcon() {
	document.getElementById('spriteWidthChoice').value = '24';
	document.getElementById('spriteHeightChoice').value = '16';
	spriteEditor.setSize();
	document.getElementById("fileIco").value = document.getElementById('spriteArea').value;
	fileIco = saveIco(document.getElementById('spriteArea').value);
	saveSettings();
}

function saveSpriteAsPng() {
	var c = document.getElementById("pixelimgshadow");
	c.toBlob(function (blob) {
		saveAs(blob, "sprite.png");
	});
}

function saveIco(a) {
	var i = 0;
	var out = [];
	var c = document.getElementById("icon").getContext('2d');
	var palette = [
		"#000000", "#EDE3C7", "#BE3746", "#7FB8B5",
		"#4A3E4F", "#6EA76C", "#273F68", "#DEBB59",
		"#B48D6C", "#42595A", "#C0624D", "#333333",
		"#777777", "#8FAB62", "#3ABFD1", "#bbbbbb"
	];
	a = a.replace(/[{}]/g, '');
	a = a.split(',');
	for (var y = 0; y < 16; y++) {
		for (var x = 0; x < 24; x++) {
			out.push(parseInt(a[i]) & 0xff);
			c.fillStyle = palette[(parseInt(a[i]) & 0xf0) >> 4];
			c.fillRect(x, y, 1, 1);
			x++;
			c.fillStyle = palette[parseInt(a[i]) & 0xf];
			c.fillRect(x, y, 1, 1);
			i++;
			if (i >= a.length)
				return out;
		}
	}
	return out;
}

function saveSettings() {
	var s = sourceArea.value;
	fileName = document.getElementById("fileName").value;
	fileAuthor = document.getElementById("fileAuthor").value;
	fileIco = saveIco(document.getElementById("fileIco").value);
	var settings = {};
	settings.name = fileName;
	settings.author = fileAuthor;
	settings.image = fileIco;
	var sourceSettings = JSON.stringify(settings);
	if (s.search(/\/\*settings\*([\s\S]*?)\*\//i) > -1) {
		sourceArea.value = s.replace(/\/\*settings\*([\s\S]*?)\*\//i, '/*settings*' + sourceSettings + '*/');
	} else
		sourceArea.value = '/*settings*' + sourceSettings + '*/\n' + s;
}

function loadSettings() {
	var s = sourceArea.value;
	var fs = s.match(/\/\*settings\*([\s\S]*?)\*\//i);
	if (fs) {
		var sourceSettings = fs[1];
		if (sourceSettings.length > 5) {
			try {
				var settings = JSON.parse(sourceSettings);
				fileName = settings.name;
				fileAuthor = settings.author;
				fileIco = saveIco(settings.image.join(','));
				document.getElementById("fileName").value = fileName;
				document.getElementById("fileAuthor").value = fileAuthor;
				document.getElementById("fileIco").value = fileIco;
			} catch (e) {
				info("settings loading error");
			}
		}
	}
}

function viewDebugPanel() {
	if (viewDebugV) {
		document.getElementById("ram").style.display = "none";
		document.getElementById("memoryPreview").style.width = "0";
		document.getElementById("cpuPreview").style.width = "0";
		document.getElementById("wrap-left").style.width = "256px";
		document.getElementById("viewKeyboard").style.left = "6em";
		document.getElementById("clone").style.display = "none";
		viewDebugV = false;
	} else {
		document.getElementById("ram").style.display = "block";
		document.getElementById("memoryPreview").style.width = "21em";
		document.getElementById("cpuPreview").style.width = "11em";
		document.getElementById("wrap-left").style.width = "54em";
		document.getElementById("viewKeyboard").style.left = "27em";
		document.getElementById("clone").style.display = "inline-block";
		viewDebugV = true;
	}
	pixelColorHighlight();
}

function clone() {
	var newByteArr = [];
	loadSettings();
	main();
	if (file.length > 1) {
		var newFile = saveAsHtml(compress(file), fileIco);
		if (secondWindow == null || secondWindow.closed)
			secondWindow = window.open('', '', 'left=0,top=0,width=450,height=370,toolbar=0,scrollbars=1,status=0');
		if (secondWindow != null) {
			secondWindow.document.write(newFile);
			secondWindow.document.close();
			secondWindow.focus();
			secondWindow.serialBuffer = [];
		}
	}
}

function updateSerial1() {
	if (serialarray1.length > 512)
		serialarray1.shift();
	if (serialviewtype == 0) {
		document.getElementById('serial1text').value = serialarray1;
	} else {
		document.getElementById('serial1text').value = '';
		for (var i = 0; i < serialarray1.length; i++) {
			document.getElementById('serial1text').value += String.fromCharCode(serialarray1[i]);
		}
	}
}

function updateSerial2() {
	if (serialarray2.length > 512)
		serialarray2.shift();
	if (serialviewtype == 0) {
		document.getElementById('serial2text').value = serialarray2;
	} else {
		document.getElementById('serial2text').value = '';
		for (var i = 0; i < serialarray2.length; i++) {
			document.getElementById('serial2text').value += String.fromCharCode(serialarray2[i]);
		}
	}
}

function serialviewsettype(t) {
	serialviewtype = t;
	updateSerial1();
	updateSerial2();
}

function popFromWindow() {
	var s;
	if (secondWindow != null && !secondWindow.closed) {
		if (secondWindow.serialBuffer1 && secondWindow.serialBuffer1.length > 0) {
			s = secondWindow.serialBuffer1.pop();
			serialBuffer.push(s);
			serialarray2.push(s);
			updateSerial2();
		}
	}
}

function pushToWindow(n) {
	if (secondWindow != null && !secondWindow.closed)
		secondWindow.serialBuffer.unshift(n);
	serialarray1.push(n);
	updateSerial1();
}

function sendToSerialManual(n) {
	var s = document.getElementById('serialInput').value;
	document.getElementById('serialInput').value = '';
	if (n == 1) {
		if (serialviewtype == 0) {
			var n = parseInt(s);
			if (!isNaN(n)) {
				serialBuffer.unshift();
				serialarray2.push(n);
			} else
				document.getElementById('serialInput').value = 'isNaN';
		} else {
			for (var i = 0; i < s.length; i++) {
				serialBuffer.unshift(s.charCodeAt(i));
				serialarray2.push(parseInt(s.charCodeAt(i)));
			}
		}
		updateSerial2();
	} else if (secondWindow != null && !secondWindow.closed) {
		if (serialviewtype == 0) {
			var n = parseInt(s);
			if (!isNaN(n)) {
				secondWindow.serialBuffer.unshift();
				serialarray1.push(n);
			} else
				document.getElementById('serialInput').value = 'isNaN';
		} else {
			for (var i = 0; i < s.length; i++) {
				secondWindow.serialBuffer.unshift(s.charCodeAt(i));
				serialarray1.push(parseInt(s.charCodeAt(i)));
			}
		}
		updateSerial1();
	}
}

function setup_mouse(id_div_wind, id_div_drag) {
	if (obj_wind)
		obj_wind.style.zIndex = '2';
	obj_wind = document.getElementById(id_div_wind);
	obj_wind.style.zIndex = '3';
	obj_drag_wind = document.getElementById(id_div_drag);
	obj_drag_wind.onmousedown = save_delta_koor;
	document.onmouseup = clear_delta_koor;
}

function save_delta_koor(obj_evt) {
	var x,
	y;
	if (obj_evt) {
		x = obj_evt.pageX;
		y = obj_evt.pageY;
	} else {
		x = window.event.clientX;
		y = window.event.clientY;

	}
	delta_x = obj_wind.offsetLeft - x;
	delta_y = obj_wind.offsetTop - y;
	document.onmousemove = motion_wind;
}

function clear_delta_koor() {
	obj_wind.style.opacity = '1';
	document.onmousemove = null;
}

function motion_wind(obj_event) {
	var x,
	y;
	if (obj_event) {
		x = obj_event.pageX;
		y = obj_event.pageY;
	} else {
		x = window.event.clientX;
		y = window.event.clientY;
	}
	if (delta_y + y < 0)
		obj_wind.style.top = "0px";
	else
		obj_wind.style.top = (delta_y + y) + "px";
	obj_wind.style.left = (delta_x + x) + "px";
	obj_wind.style.opacity = '.9';
	window.getSelection().removeAllRanges();
}

function viewDebug(id) {
	var i;
	var x = document.getElementsByClassName("debug");
	for (i = 0; i < x.length; i++) {
		x[i].style.display = "none";
	}
	document.getElementById(id).style.display = "block";
}

function keyDownHandler(e) {
	switch (e.keyCode) {
	case 38:
	case 87:
		globalJKey |= 1;
		break;
	case 40:
	case 83:
		globalJKey |= 2;
		break;
	case 37:
	case 65:
		globalJKey |= 4;
		break;
	case 39:
	case 68:
		globalJKey |= 8;
		break;
	case 88:
	case 32: //B - space,x
		globalJKey |= 32;
		break;
	case 90: //A - Z
		globalJKey |= 16;
		break;
	case 67: //select - c
	case 16:
		globalJKey |= 64;
		break;
	case 86: //start - enter
	case 13:
		globalJKey |= 128;
		break;
	}
	globalKey = e.keyCode;
	if (globalKey == 13)
		globalKey = 0xA;
}

function keyUpHandler(e) {
	switch (e.keyCode) {
	case 38:
	case 87:
		globalJKey &= ~1;
		break;
	case 40:
	case 83:
		globalJKey &= ~2;
		break;
	case 37:
	case 65:
		globalJKey &= ~4;
		break;
	case 39:
	case 68:
		globalJKey &= ~8;
		break;
	case 88:
	case 32: //B - space,x
		globalJKey &= ~32;
		break;
	case 90: //A - Z
		globalJKey &= ~16;
		break;
	case 67: //select - c
	case 16: //select - shift
		globalJKey &= ~64;
		break;
	case 86: //start - enter
	case 13: //start - enter
		globalJKey &= ~128;
		break;
	}
}

function testForImageArray(e) {
	var b = document.getElementById("floatButton");
	var position = getCaretPos(sourceArea);
	var str = sourceArea.value;
	var left = 0;
	var right = str.length;
	var word;
	b.style.left = (sourceArea.getBoundingClientRect().left - 50) + 'px';
	b.style.top = (e.clientY - 10) + 'px';
	b.style.display = 'none';
	selectedLeft = 0;
	selectedRight = 0;
	for (var i = position; i >= 0; i--) {
		if ('{};'.indexOf(str[i]) > -1) {
			left = i + 1;
			if (str[i] == ';')
				return;
			break;
		}
	}
	for (i = position; i < str.length; i++) {
		if ('{};'.indexOf(str[i]) > -1) {
			right = i;
			if (str[i] == ';')
				return;
			break;
		}
	}
	if (left < right) {
		word = str.substring(left, right);
		selectedLeft = left;
		selectedRight = right;
		if (word.match(/0x/)) {
			selectedArray = word;
			b.style.display = 'block';
		}
	}
}

function getCaretPos(obj) {
	obj.focus();
	if (document.selection) { // IE
		var sel = document.selection.createRange();
		var clone = sel.duplicate();
		sel.collapse(true);
		clone.moveToElementText(obj);
		clone.setEndPoint('EndToEnd', sel);
		return clone.text.length;
	} else if (obj.selectionStart !== false)
		return obj.selectionStart; // Gecko
	else
		return 0;
}

function loadArrayAsImage() {
	var sc = selectedArray.split('\n');
	document.getElementById("floatButton").style.display = "none";
	document.getElementById("spriteLoadArea").value = selectedArray;
	if (sc.length > 1) {
		var w = sc[1].split(',').length * 2 - 2;
		document.getElementById("spriteLoadWidth").value = w;
	}
	spriteEditor.edit(selectedLeft - 1, selectedRight);
	spriteEditor.load();
}

function highliteasm(code) {
	//подсветка от etcdema
	var comments = []; // Тут собираем все каменты
	var strings = []; // Тут собираем все строки
	var res = []; // Тут собираем все RegExp
	var all = {
		'C': comments,
		'S': strings,
		'R': res
	};

	return code
	// Убираем каменты
	.replace(/([^;]);[^\n]*/g, function (m, f) {
		var l = comments.length;
		comments.push(m);
		return f + '~~~C' + l + '~~~';
	})
	// Убираем строки
	.replace(/([^\\])((?:'(?:\\'|[^'])*')|(?:"(?:\\"|[^"])*"))/g, function (m, f, s) {
		var l = strings.length;
		strings.push(s);
		return f + '~~~S' + l + '~~~';
	})
	// Выделяем ключевые слова
	.replace(/(mov|ldi|ldial|ldc|sti|stial|stc|pop|popn|push|pushn|jmp|jz|jnz|jc|jnc|call|ret|add|and|sub|mul|div|cmp|inc|dec|ldf|hlt|ftoi|itof)([^a-z0-9\$_])/gi,
		'<span class="kwrd">$1</span>$2')
	// Выделяем скобки
	.replace(/(\(|\))/gi,
		'<span class="gly">$1</span>')
	// Возвращаем на место каменты, строки
	.replace(/~~~([CSR])(\d+)~~~/g, function (m, t, i) {
		return '<span class="' + t + '">' + all[t][i] + '</span>';
	})
	// Выставляем переводы строк
	.replace(/\n/g, '<br/>')
}

function highlitec() {
	//подсветка от etcdema
	var code = document.getElementById("help_hl").innerHTML;
	var comments = []; // Тут собираем все каменты
	var strings = []; // Тут собираем все строки
	var res = []; // Тут собираем все RegExp
	var all = {
		'C': comments,
		'S': strings,
		'R': res
	};

	document.getElementById("help_hl").innerHTML = code
		// Убираем каменты
		.replace(/([^\/])\/\/[^\n]*/g, function (m, f) {
			var l = comments.length;
			comments.push(m);
			return f + '~~~C' + l + '~~~';
		})
		// Убираем строки
		.replace(/()(\/\*[\S\s]*?\*\/)/g, function (m, f, s) {
			var l = strings.length;
			strings.push(s);
			return f + '~~~S' + l + '~~~';
		})
		// Выделяем ключевые слова
		.replace(/(fixed|int|char|void)([^a-z0-9\$_])/gi,
			'<span class="kwrd">$1</span>$2')
		// Выделяем скобки
		.replace(/(\(|\))/gi,
			'<span class="gly">$1</span>')
		.replace(/(@[a-z]*)/g,
			'<span class="R"> $1</span>()')
		// Возвращаем на место каменты, строки
		.replace(/~~~([CSR])(\d+)~~~/g, function (m, t, i) {
			return '<span class="' + t + '">' + all[t][i] + '</span>';
		})
		// Выставляем переводы строк
		.replace(/\n/g, '<br/>')
		.replace(/\t/g, '');
}

highlitec();

function findInTextarea(str){
	var pos = sourceArea.value.indexOf(str);
	while (pos >= 0) {
		input.setSelectionRange(pos, pos + str.length);
		pos = sourceArea.value.indexOf(str, pos + 1);
	}
	input.focus();
}

//компиляция ассемблерного кода из поля ввода
function onlyAsm() {
	var s = document.getElementById('input').value;
	var n = s.split('\n').length;
	numberDebugString = [];
	for (var i = 0; i < n; i++)
		numberDebugString.push([i, i, 0]);
	file = asm(s);
	document.getElementById('ram').value = toHexA(file);
}
//компиляция си кода из поля ввода
function main() {
	sound.rtttl.play = 0;
	document.getElementById("alert").innerHTML = '';
	var src = document.getElementById('input').value;
	var t = tokenize(src);
	//console.log(t);
	var c = compile(t);
	asmSource = '\n' + c.join('\n') + '\n';
	file = asm(asmSource);
	compress(file);
	document.getElementById('disasm').innerHTML = highliteasm(asmSource);
	if (memoryType == 1)
		document.getElementById('ram').value = toHexC(file);
	else
		document.getElementById('ram').value = toHexA(file);
	timeForRedraw = 48;
}
//вывод информации о ходе сборки
function info(s) {
	var out = document.getElementById("alert");
	out.innerHTML += '<b>' + s + '</b><br>';
}

function lineCount() {
	var canvas = document.getElementById("inputCanvas");
	if (canvas.height != sourceArea.clientHeight)
		canvas.height = sourceArea.clientHeight; // on resize
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "#343434";
	ctx.fillRect(0, 0, 52, sourceArea.scrollHeight + 1);
	ctx.font = fontSizeInEditor + "px monospace"; // NOTICE: must match TextArea font-size(13px) and lineheight(16) !!!
	var startIndex = Math.floor(sourceArea.scrollTop / (fontSizeInEditor + 3), 0);
	var endIndex = startIndex + Math.ceil(sourceArea.clientHeight / (fontSizeInEditor + 3), 0);
	for (var i = startIndex; i <= endIndex; i++) {
		if (i == thisDebugString) {
			ctx.fillStyle = "#0f0";
		} else {
			ctx.fillStyle = "#fff";
		}
		var ph = fontSizeInEditor - 1 - sourceArea.scrollTop + (i * (fontSizeInEditor + 3));
		var text = '' + (0 + i); // line number
		ctx.fillText(text, 48 - (text.length * (fontSizeInEditor / 2)), ph);
	}
	handleScroll();
};

function inputOnKey(e) {
	if (e.keyCode === 9) { // была нажата клавиша TAB
		if (e.type == 'keyup')
			return false;
		// получим позицию каретки
		var val = this.value,
		start = this.selectionStart,
		end = this.selectionEnd;
		// установим значение textarea в: текст до каретки + tab + текст после каретки
		var txt = val.substring(start, end);
		if (e.shiftKey) {
			txt = txt.replace(/\n\s/g, '\n');
			if (txt[0] == '\t' || txt[0] == ' ')
				txt = txt.substring(1);
			this.value = val.substring(0, start) + txt + val.substring(end);
			this.selectionStart = start;
			this.selectionEnd = start + txt.length;
		} else {
			if (txt.length == 0) {
				this.value = val.substring(0, start) + '\t' + val.substring(end);
				// переместим каретку
				this.selectionStart = start + 1;
				this.selectionEnd = start + 1;
			} else {
				txt = txt.replace(/[\n]/g, '\n\t');
				this.value = val.substring(0, start) + '\t' + txt + val.substring(end);
				this.selectionStart = start;
				this.selectionEnd = start + txt.length + 1;
			}

		}
		setTimeout(lineCount, 300);
		pixelColorHighlight();
		// предотвратим потерю фокуса
		return false;
	} else if (e.keyCode === 13) {
		if (e.type == 'keyup')
			return false;
		// получим позицию каретки
		var val = this.value,
		start = this.selectionStart,
		end = this.selectionEnd;
		var spc = 0;
		var tb = 0;
		this.value = val.substring(0, start) + '\n' + val.substring(end);
		if (end < val.length && val[end] == '\t')
			end++;
		for (var i = start; i >= 0; i--) {
			if (val[i] == '\n') {
				if (spc > 0 || tb > 0)
					break;
			} else if (val[i] == '\t')
				tb++;
			else if (val[i] == ' ')
				spc++;
			else if (val[i] == '{') {
				tb++;
			}
			spc++;
		}
		var txt = '';
		for (var i = 0; i < tb; i++)
			txt += '\t';
		// переместим каретку
		this.value = val.substring(0, start) + '\n' + txt + val.substring(end);
		this.selectionStart = start + txt.length + 1;
		this.selectionEnd = start + txt.length + 1;
		pixelColorHighlight();
		return false;
	} else if (e.keyCode === 125) {
		if (e.type == 'keyup')
			return false;
		// получим позицию каретки
		var val = this.value,
		start = this.selectionStart,
		end = this.selectionEnd;
		if (start > 0 && val[start - 1] == '\t')
			start--;
		this.value = val.substring(0, start) + '}' + val.substring(end);
		this.selectionStart = start + 1;
		this.selectionEnd = start + 1;
		pixelColorHighlight();
		return false;
	}
	pixelColorHighlight();
	e.stopPropagation();
}

function handleScroll() {
	if (isHighliteColor) {
		var h = document.getElementById("inputImgHighlite");
		h.scrollTo(sourceArea.scrollLeft, sourceArea.scrollTop);
	}
}

function pixelColorHighlight() {
	var h = document.getElementById("inputImgHighlite");
	clearTimeout(colorHighliteTimer);
	if (isHighliteColor) {
		h.style.display = "block";
		colorHighliteTimer = setTimeout(function () {
				var h = document.getElementById("inputImgHighlite");
				h.style.width = sourceArea.offsetWidth + 'px';
				h.style.height = sourceArea.offsetHeight + 'px';
				var s = sourceArea.value.replace(/</g, '>');
				h.innerHTML = s.replace(/0x([0-9a-fA-F]{1,2})( *)[,}]*( *)/g, function (str, c, a, b, offset, s) {
						if (c.length == 1) {
							return '<pc class="pc' + parseInt(c, 16) + '">0x0,</pc>';
						} else {
							c = parseInt(c, 16);
							return '<pc class="pc' + (c >> 4) + '">0x0</pc><pc class="pc' + (c & 0xf) + '">0' + a + ',' + b + '</pc>';
						}
					});
			}, 400);
		h.style.width = sourceArea.offsetWidth + 'px';
		h.style.height = sourceArea.offsetHeight + 'px';
	} else
		h.style.display = "none";
}

function changeHighlightColors(check) {
	isHighliteColor = check;
	pixelColorHighlight();
}

function listing() {
	var d = document.getElementById("div_wind1");
	d.value = asmSource;
	d.style.display = "block";
	d.style.left = "1em";
	d.style.top = "3em";
	var d = document.getElementById("disasm");
	d.value = asmSource;
	d.scrollIntoView(false);
}

function debugVars() {
	var d = document.getElementById("div_wind3");
	d.style.display = "block";
	d.style.left = window.innerWidth / 7 * 2 + 'px';
	d.style.top = "3em";
	isDebug = true;
	d.scrollIntoView(false);
}

function viewHelp() {
	var d = document.getElementById("div_wind4");
	d.style.display = "block";
	d.style.left = window.innerWidth / 7 * 3 + 'px';
	d.style.top = "3em";
	d.scrollIntoView(false);
}

function viewSettings() {
	var d = document.getElementById("div_wind5");
	d.style.display = "block";
	d.style.left = window.innerWidth / 7 * 4 + 'px';
	d.style.top = "3em";
	loadSettings();
	d.scrollIntoView(false);
}

function viewAbout() {
	var d = document.getElementById("div_wind6");
	d.style.display = "block";
	d.style.left = (window.innerWidth / 2 - 40) + 'px';
	d.style.top = "5em";
	d.scrollIntoView(false);
}

function viewSnapshots() {
	var d = document.getElementById("div_wind7");
	d.style.display = "block";
	d.style.left = (window.innerWidth / 2 - 60) + 'px';
	d.style.top = "5em";
	d.scrollIntoView(false);
}

function closewindow(id) {
	var d = document.getElementById(id);
	if (id == "div_wind3")
		isDebug = false;
	d.style.display = "none";
}

var bpalette = [
	"#000000", "#EDE3C7", "#BE3746", "#7FB8B5",
	"#4A3E4F", "#6EA76C", "#273F68", "#DEBB59",
	"#B48D6C", "#42595A", "#C0624D", "#333333",
	"#777777", "#8FAB62", "#3ABFD1", "#bbbbbb"
];

var palette = [];
var sprtpalette = [];

function viewMemory() {
	var s = '     0 1 2 3 4 5 6 7 8 9 A B C D E F';
	for (var i = 0; i < 256; i++) {
		if (i % 16 == 0)
			s += '\n' + toHex2(memoryPage) + toHex2(Math.floor(i)) + ':';
		s += toHex2(cpu.readMem(memoryPage * 256 + i)) + '';
	}
	document.getElementById('areaMemoryPrewiew').value = s;
}

function setMemoryPage(n) {
	if (n == 'p')
		memoryPage++;
	else if (n == 'm')
		memoryPage--;
	else if (!isNaN(parseInt(n, 16)))
		memoryPage = parseInt(n, 16);
	if (memoryPage > 255)
		memoryPage = 255;
	if (memoryPage < 0)
		memoryPage = 0;
	document.getElementById('memoryPage').value = toHex2(memoryPage);
	viewMemory();
}

function startButton() {
	if (!asmSource)
		main();
	isRun = true;
	timerstart = new Date().getTime();
	timertime = 0;
	soundTimer = 0;
	redraw();
	run();
}

function run() {
	//звук инициализируется только при нажатии на кнопку
	sound.initAudio();
	//уменьшаем значение таймеров
	for (var i = 0; i < 8; i++) {
		timers[i] -= 16;
		if (timers[i] <= 0)
			timers[i] = 0;
	}
	soundTimer -= 16;
	if (soundTimer <= 30)
		soundTimer = sound.playRtttl();
	if (soundTimer > 2000)
		soundTimer = 2000;
	//обрабатываем команды процессора
	for (var i = 0; i < cpuSpeed; i++) {
		cpu.step();
		i += cpuLostCycle;
		cpuLostCycle = 0;
	}
	//обработка спрайтов
	if (isRedraw) {
		display.clearSprite();
		cpu.redrawSprite();
		cpu.testSpriteCollision(isDebug);
		isRedraw = false;
		//выводим отладочную информацию
		debugCallCount++;
		if (debugCallCount >= 10 && (viewDebugV || isDebug)) {
			document.getElementById('debug').value = cpu.debug();
			debugCallCount = 0;
		}
	}
	timertime += 16;
	var diff = (new Date().getTime() - timerstart) - timertime;
	if (diff > 12)
		diff = 12;
	clearTimeout(timerId);
	timerId = setTimeout(function () {
			run()
		}, 16 - diff);
}

function stopCpu() {
	isRun = false;
	clearTimeout(timerId);
	document.getElementById('debug').value = cpu.debug();
}
//функция вывода на экран
function Display() {
	var displayArray = [];
	var spriteArray = [];
	var spriteArray2 = [];
	var canvasArray = [];
	var canvasArray2 = [];
	var ctx;
	var width;
	var height;
	var pixelSize = 2;
	var isDebug = false;
	var isDrawKeyboard = false;
	var isChangePalette = false;
	var clipx0,
	clipx1,
	clipy0,
	clipy1;

	function init() {
		width = canvas.getBoundingClientRect().width;
		height = canvas.getBoundingClientRect().height;
		ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		reset();
		canvas.addEventListener('mousemove', function (e) {
			position(e);
		});
	}

	function position(e) {
		var rect = canvas.getBoundingClientRect();
		var x = Math.floor((e.offsetX == undefined ? e.layerX : e.offsetX) / (rect.width / 128));
		var y = Math.floor((e.offsetY == undefined ? e.layerY : e.offsetY) / (rect.height / 256)) - 16;
		ctx.fillStyle = "#516399";
		ctx.fillRect(0, 0, pixelSize * 128, pixelSize * 8);
		ctx.fillStyle = "#111";
		ctx.fillText('x ' + x + ';y ' + y + ';charX ' + Math.floor(x / 6) + ';charY ' + Math.floor(y / 8), 1, 1);
	}

	function reset() {
		clipx0 = 0;
		clipx1 = 128;
		clipy0 = 0;
		clipy1 = 128;
		ctx.textAlign = "start";
		ctx.textBaseline = "hanging";
		ctx.font = pixelSize * 8 + "px monospace";
		ctx.fillStyle = "#516399";
		ctx.fillRect(0, 0, width + 20, height + 20);
		for (var i = 0; i < 20480; i++) {
			displayArray[i] = 0;
			canvasArray[i] = 0;
			canvasArray2[i] = 0;
		}
		cpuLostCycle += 2000;
		ctx.fillStyle = "#516399";
		ctx.fillRect(0, (128 + 16) * pixelSize, pixelSize * 128, pixelSize * 16);
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 16 * pixelSize, pixelSize * 128, pixelSize * 128);
		for (var i = 0; i < 16; i++) {
			palette[i] = bpalette[i];
			sprtpalette[i] = bpalette[i];
		}
	}

	function clearScreen(color) {
		if (color === undefined || color === null)
			color = 0;
		for (var i = 0; i < 20480; i++) {
			displayArray[i] = color;
			canvasArray[i] = color;
		}
	}

	function clearSprite() {
		for (var i = 0; i < 20480; i++) {
			spriteArray[i] = 0;
		}
	}

	function drawLed(color) {
		var r = ((((color >> 11) & 0x1F) * 527) + 23) >> 6;
		var g = ((((color >> 5) & 0x3F) * 259) + 33) >> 6;
		var b = (((color & 0x1F) * 527) + 23) >> 6;
		ctx.fillStyle = fullColorHex(r, g, b);
		ctx.fillRect(0, 0, pixelSize * 128, pixelSize * 16);
		ctx.fillRect(0, (128 + 16) * pixelSize, pixelSize * 128, pixelSize * 16);
	}

	function char(chr, x, y, color, bgcolor) {
		var c = chr.charCodeAt(0);
		for (var i = 0; i < 5; i++) { // Char bitmap = 5 columns
			var line = font[c * 5 + i];
			for (var j = 0; j < 8; j++, line >>= 1) {
				if (line & 1)
					drawPixel(color, x + i, y + j);
				else
					drawPixel(bgcolor, x + i, y + j);
			}
		}
	}

	function drawTestRect(x, y, w, h, c) {
		if (c == 0)
			ctx.strokeStyle = "pink";
		else
			ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.rect(x * pixelSize, (y + 16) * pixelSize, w * pixelSize, h * pixelSize);
		ctx.stroke();
		isDebug = true;
	}

	function setClip(x0, y0, x1, y1) {
		if (x0 > 0x7fff)
			x0 -= 0x10000;
		if (y0 > 0x7fff)
			y0 -= 0x10000;
		clipx0 = (x0 >= 0 && x0 < 127) ? x0 : 0;
		clipy0 = (y0 >= 0 && y0 < 127) ? y0 : 0;
		clipx1 = (x0 + x1 > 0 && x0 + x1 <= 128) ? x0 + x1 : 128;
		clipy1 = (y0 + y1 > 0 && y0 + y1 <= 128) ? y0 + y1 : 128;
	}

	function updatePixel(x, y) {
		canvasArray[x * 128 + y] = displayArray[x * 128 + y];
	}

	function drawPixel(color, x, y) {
		cpuLostCycle += 0.1;
		if (x >= clipx0 && x < clipx1 && y >= clipy0 && y < clipy1)
			canvasArray[x * 128 + y] = color;
	}

	function drawSpritePixel(color, x, y) {
		if (x >= 0 && x < 128 && y >= 0 && y < 128)
			spriteArray[x * 128 + y] = color;
	}

	function plot(color, x, y) {
		if (x >= clipx0 && x < clipx1 && y >= clipy0 && y < clipy1) {
			drawPixel(color, x, y);
			displayArray[x * 128 + y] = color & 0x0f;
		}
	}

	function largeplot(color, x, y, s) {
		var x1,
		y1;
		for (x1 = 0; x1 < s; x1++)
			for (y1 = 0; y1 < s; y1++) {
				drawPixel(color, x + x1, y + y1);
				displayArray[(x + x1) * 128 + y + y1] = color & 0x0f;
			}
	}

	function getPixel(x, y) {
		if (x >= 0 && x <= 127 && y >= 0 && y <= 127)
			return displayArray[x * 128 + y];
		return 0;
	}

	function viewKeyboard(pos) {
		isDrawKeyboard = true;
	}

	function drawJoy() {
		var coordinate = [8, 143, 24, 130, 24, 156, 40, 143, 90, 150, 110, 135];

		ctx.fillStyle = '#8FAA63';
		for (var i = 0; i < 8; i++) {
			ctx.beginPath();
			ctx.arc((5 + coordinate[i * 2]) * pixelSize, 30 * pixelSize + (5 + coordinate[i * 2 + 1] * pixelSize), 7 * pixelSize, 0, 2 * Math.PI, false);
			ctx.fill();
		}
	}

	function redraw() {
		var color,
		x,
		y;
		if (isDrawKeyboard) {
			document.getElementById("viewKeyboard").style.display = "block";
			isDrawKeyboard = 0;
		} else {
			document.getElementById("viewKeyboard").style.display = "none";
		}
		drawJoy();
		for (x = 0; x < 128; x++)
			for (y = 0; y < 128; y++) {
				if (spriteArray[x * 128 + y] > 0) {
					color = spriteArray[x * 128 + y];
					canvasArray2[x * 128 + y] = color;
					ctx.fillStyle = sprtpalette[color & 0x0f];
					ctx.fillRect(x * pixelSize, (y + 16) * pixelSize, pixelSize, pixelSize);
				} else if (canvasArray[x * 128 + y] != canvasArray2[x * 128 + y] || isDebug || isChangePalette || spriteArray2[x * 128 + y] > 0) {
					canvasArray2[x * 128 + y] = canvasArray[x * 128 + y];
					color = canvasArray[x * 128 + y];
					ctx.fillStyle = palette[color & 0x0f];
					ctx.fillRect(x * pixelSize, (y + 16) * pixelSize, pixelSize, pixelSize);
				}
			}
		for (var i = 0; i < 128 * 128; i++) {
			spriteArray2[i] = spriteArray[i];
		}
		isDebug = false;
		isChangePalette = false;
		if (saveGifFrame > 1) {
			ctx.fillStyle = "#516399";
			ctx.fillRect(80 * pixelSize, 8 * pixelSize, pixelSize * 45, pixelSize * 8);
			ctx.fillStyle = "#ADFF2F";
			ctx.fillText('save GIF ' + Math.floor((saveGifFrame + 15) / 20), 80 * pixelSize, 8 * pixelSize);
			gif.addFrame(ctx.getImageData(0, 32, 256, 256), 1);
			saveGifFrame--;
		} else if (saveGifFrame == 1) {
			ctx.fillStyle = "#516399";
			ctx.fillRect(80 * pixelSize, 8 * pixelSize, pixelSize * 45, pixelSize * 8);
			saveGifFrame = 0;
			gif.render();
		}
	}

	function rgbToHex(rgb) {
		var hex = Number(rgb).toString(16);
		if (hex.length < 2) {
			hex = "0" + hex;
		}
		return hex;
	}

	function fullColorHex(r, g, b) {
		var red = rgbToHex(r);
		var green = rgbToHex(g);
		var blue = rgbToHex(b);
		return '#' + red + green + blue;
	}

	function changePalette(n, color) {
		var r = ((((color >> 11) & 0x1F) * 527) + 23) >> 6;
		var g = ((((color >> 5) & 0x3F) * 259) + 33) >> 6;
		var b = (((color & 0x1F) * 527) + 23) >> 6;
		isChangePalette = true;
		if (n < 16)
			palette[n] = fullColorHex(r, g, b);
		else if (n < 32)
			sprtpalette[n - 16] = fullColorHex(r, g, b);
	}

	return {
		init: init,
		reset: reset,
		clearScreen: clearScreen,
		drawLed: drawLed,
		char: char,
		setClip: setClip,
		updatePixel: updatePixel,
		drawPixel: drawPixel,
		drawSpritePixel: drawSpritePixel,
		plot: plot,
		largeplot: largeplot,
		getPixel: getPixel,
		viewKeyboard: viewKeyboard,
		redraw: redraw,
		changePalette: changePalette,
		clearSprite: clearSprite,
		drawTestRect: drawTestRect
	};
}

function redraw() {
	clearTimeout(screenTimeout);
	screenTimeout = setTimeout(function () {
			requestAnimationFrame(redraw);
			if (isRun) {
				cpu.redrawParticle();
				display.redraw();
				cpu.setRedraw();
			}
			isRedraw = true;
		}, timeForRedraw);
}

function saveAsH(file, im, name) {
	var s = '#define ROM_NAME " ';
	if (name)
		s += name + '"';
	else
		s += 'rom"';
	s += '\n\nconst uint8_t romImage[] PROGMEM = {\n';
	if (im)
		s += toHexC(im);
	else
		s += '0x0, 0x0, 0x0';
	s += '\n};\n\nconst uint8_t rom[] PROGMEM = {\n';
	s += toHexC(file);
	s += '\n};\n';
	return s;
}

function savebin(type) {
	var newByteArr = [];
	loadSettings();
	main();
	if (type == 3) { //.h
		if (file.length > 1) {
			var newFile = saveAsH(file, fileIco, fileName);
			var blob = new Blob([newFile], {
					type: "text/plain;charset=utf-8"
				});
			if (fileName.length > 0)
				saveAs(blob, 'rom.h');
		}
	} else if (type == 2) { //lge
		if (file.length > 1) {
			var cfile = compress(file);
			if (cfile == false) {
				cfile = file;
				newByteArr = [0x6C, 0x67, 0x65, 0x0, 0x5];
			} else
				newByteArr = [0x6C, 0x67, 0x65, 0x1, 0x5];
			if (fileIco && fileIco.length > 0) {
				newByteArr[3] += 2;
				newByteArr[4] += 192;
				for (var i = 0; i < 192; i++) {
					if (i < fileIco.length)
						newByteArr.push(fileIco[i] & 0xFF);
					else
						newByteArr.push(0);
				}
			}
			if (fileAuthor && fileAuthor.length > 0) {
				newByteArr[3] += 4;
				newByteArr[4] += fileAuthor.length;
				for (var i = 0; i < fileAuthor.length; i++)
					newByteArr.push(fileAuthor[i] & 0xFF);
			}
			for (var i = 0; i < cfile.length; i++) {
				newByteArr.push(cfile[i] & 0xFF);
			}
			var newFile = new Uint8Array(newByteArr);
			var blob = new Blob([newFile], {
					type: "charset=iso-8859-1"
				});
			if (fileName.length > 0)
				saveAs(blob, fileName + '.lge');
			else
				saveAs(blob, 'rom.lge');
		}
	} else if (type == 1) { //html
		if (file.length > 1) {
			var newFile = saveAsHtml(compress(file), fileIco);
			var blob = new Blob([newFile], {
					type: "text/plain;charset=utf-8"
				});
			if (fileName.length > 0)
				saveAs(blob, fileName + '.html');
			else
				saveAs(blob, 'game.html');
		}
	} else {
		if (file.length > 1) {
			for (var i = 0; i < file.length; i++) {
				newByteArr.push(file[i] & 0xFF);
			}
			var newFile = new Uint8Array(newByteArr);
			var blob = new Blob([newFile], {
					type: "charset=iso-8859-1"
				});
			saveAs(blob, "rom.bin");
		}
	}
}

function compress(file) {
	var fpos = 0,
	epos = 0,
	lopos = 0,
	len = 0;
	var out = [];
	var find = function (array, pos) {
		for (var j = Math.max(0, pos - 511); j < pos; j++) {
			if ((array[j] === array[pos]) && (array[j + 1] === array[pos + 1]) && (array[j + 2] === array[pos + 2]) && (array[j + 3] === array[pos + 3]))
				return j;
		}
		return -1;
	}

	out = file.slice(0, 3);
	out.splice(0, 0, 0, 3);
	lopos = 0;
	for (var i = 3; i < file.length; i++) {
		fpos = find(file, i);
		epos = i;
		if (fpos > -1) {
			while (i < file.length && file[fpos + len] === file[i] && len < 63) {
				len++;
				i++;
			}
			out.push(128 + (len << 1) + ((epos - fpos) >> 8));
			out.push((epos - fpos) & 0xff);
			lopos = out.length;
			out.push(0);
			out.push(0);
			len = 0;
			i--;
		} else {
			out.push(file[i]);
			out[lopos + 1]++;
			if (out[lopos + 1] > 255) {
				out[lopos + 1] = 0;
				out[lopos]++;
			}
		}
	}
	info("<i>compress rate " + Math.round(100 - out.length / file.length * 100) + "%</i>");
	if (!compressTest(file, decompress(out))) {
		console.log("error compress");
		console.log(out);
		console.log(file);
		console.log(decompress(out));
		return false;
	}
	return out;
}

function decompress(file) {
	var out = [];
	var i = 0,
	length,
	position,
	point;
	while (i < file.length) {
		if ((file[i] & 128) == 0) {
			length = ((file[i] & 127) << 8) + file[i + 1];
			i += 2;
			for (var j = 0; j < length; j++) {
				out.push(file[i]);
				i++;
			}
		} else {
			length = (file[i] & 127) >> 1;
			position = (((file[i] & 1) << 8) + file[i + 1]);
			i += 2;
			point = out.length - position;
			for (var j = 0; j < length; j++) {
				out.push(out[point + j]);
			}
		}
	}
	return out;
}

function compressTest(f1, f2) {
	if (f1.length != f2.length) {
		return false;
	}
	for (var i = 0; i < f1.length; i++) {
		if (f1[i] != f2[i]) {
			console.log(i, f1[i], f2[i]);
			return false;
		}
	}
	return true;
}

var display = new Display();
display.init();
var sound = new Sound();
var spriteEditor = new SpriteEditor();
spriteEditor.init();
lineCount();
redraw();
