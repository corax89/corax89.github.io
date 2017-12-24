"use strict";
var GETC = 0xfff9;
var PUTC = 0xfff8;
var DRAWX = 0xfff7;
var DRAWY = 0xfff6;
var DRAWC = 0xfff5;
var DRAWSPRITE = 0xfff4;
var SETPALETTE = 0xfff3;
var DRAWTILE = 0xfff2;
var CLEARSCREEN = 0xfff1;
var GETTILE = 0xfff0;
var TIMER = 0xfC;
var globalPalitte = 0;
var timerId = 0;
var GlobalVariableName = [];
var globalKey = 0;

if (window.File && window.FileReader && window.FileList && window.Blob) {
    document.getElementById('file').addEventListener('change', function(e) {
      var file = e.target.files[0];       
      var output = document.getElementById('ram');
      var reader = new FileReader();   
      reader.onload = function(e) { 
          var text = e.target.result;
          output.value= '';
		  var out = '';
          for (var i = 0; i < text.length; i++) {
			  if(text.charCodeAt(i)>0xF)
				out +='$' + com.charCodeAt(i).toString(16) + ', ';
			  else
				out +='$0' + com.charCodeAt(i).toString(16) + ', '; 
			}
			out +='$00';
		  output.value = out;
		  load(text);
      };
      reader.readAsBinaryString(file);
    });
} else {
    alert('File API is not supported!');
}

var canvas = document.getElementById("output");
var pixelarea = document.getElementById("pixelearea");
var pixelareactx = pixelarea.getContext('2d');
var input = document.getElementById("input");
var pixelareabgcolor = 0;
var outDebug = document.getElementById("debug");
var codePreviev = document.getElementById("codePreviev");
var arrPrevious = [];
var keypressed = 0;
var consoleBuffer = '';
var com;
var RAM=[];
var palette = [
      "#000000", "#ffffff", "#880000", "#aaffee",
      "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
      "#dd8855", "#664400", "#ff7777", "#333333",
      "#777777", "#aaff66", "#0088ff", "#bbbbbb"
    ];
var thiscolor = 0;
var sprite = [];


function pixelareainit(){
	pixelareactx.fillStyle = "#000000";
	pixelareactx.fillRect(0, 0, 16, 17);	
	thiscolor = 0;
	document.getElementById("selectColor").style.background = palette[thiscolor];
	for(var i = 0; i<17; i++){
		pixelareactx.fillStyle = palette[i];
		pixelareactx.fillRect(i, 16, 1, 1);
		sprite[i] = [];
		for(var j = 0; j<17; j++){
			sprite[i][j] = 0;
		}
	}
	pixelareactx.fillStyle = "#000000";
}

function pixelareaclear(){
	pixelareabgcolor = thiscolor;
	pixelareactx.fillStyle = palette[pixelareabgcolor];
	pixelareactx.fillRect(0, 0, 16, 17);
	document.getElementById("selectColor").style.background = palette[thiscolor];
	for(var i = 0; i<17; i++){
		pixelareactx.fillStyle = palette[i];
		pixelareactx.fillRect(i, 16, 1, 1);
		sprite[i] = [];
		for(var j = 0; j<17; j++){
			sprite[i][j] = pixelareabgcolor;
		}
	}
	pixelareactx.fillStyle = palette[pixelareabgcolor];	
}

function lineCount(){
	var i=0,pos=0,countStr='',l=0,m=0;
	var txt = document.getElementById('input').value;
	for(var j = 0; j < txt.length; j++){
		l++;
		if(txt[j] == '\n'){
			m = Math.max(m, l);
			l = 0;
			countStr += i + '\n';
			i++;
		}
	}
	m = Math.max(m, l);
	countStr+=i+'\n';
	if(i < 10)
		i = 10;
	if(m < 10)
		m = 10;
	i += 5;
	document.getElementById('line-count').innerHTML=countStr;
	document.getElementById('input').style.height=i*1.15+'em';
	document.getElementById('input').style.width=m*1+'em';
	document.getElementById('line-count').style.height=i*1.15+'em';
}

function spriteSelectAll(){
    document.getElementById("spriteArea").focus();
    document.getElementById("spriteArea").select();
}

function loadSprite(){
	var width=parseInt(prompt('input sprite width', '8'));
	if(width > 0 && width < 17){
		var arr = document.getElementById("spriteArea").value.split(',');
		pixelareainit();
		var x = 0;
		var y = 0;
		for(var i = 0; i < arr.length; i++){
			sprite[x][y] = parseInt(arr[i],10);
			pixelareactx.fillStyle = palette[sprite[x][y]];
			pixelareactx.fillRect(x, y, 1, 1);
			x++;
			if(x >= width){
				x = 0;
				if(y<15)
					y++;
			}
		}
		pixelareactx.fillStyle = "#000000";
		thiscolor = 0;
		document.getElementById("selectColor").style.background = palette[thiscolor];
	}
}

pixelarea.addEventListener('mouseup', function (e) {
    var rect = pixelarea.getBoundingClientRect();
	var	x = Math.floor((e.offsetX==undefined?e.layerX:e.offsetX)/(rect.width/16));
    var y = Math.floor((e.offsetY==undefined?e.layerY:e.offsetY)/(rect.height/17));
	if(y == 16){
		thiscolor = x;
		pixelareactx.fillStyle = palette[x];
		document.getElementById("selectColor").style.background = palette[x];
	}
	else{
		pixelareactx.fillRect(x, y, 1, 1);
		sprite[x][y] = thiscolor;	
	}
	var spritewidth = 0;
	var spriteheight = 0; 
	for(var i = 0; i < 16; i++){
		for(var j = 0; j < 16; j++){
			if(sprite[i][j] != pixelareabgcolor){
				if(i > spritewidth)
					spritewidth = i;
				if(j > spriteheight)
					spriteheight = j;
			}
		}
	}
	var spr = '{';
	for(i = 0; i <= spriteheight; i++)
		for(j = 0; j <= spritewidth; j++){
			if(sprite[j][i] != pixelareabgcolor)
				spr += sprite[j][i] + ',';
			else
				spr += pixelareabgcolor + ',';
		}
	spr += '0};';
	spriteheight++;
	spritewidth++;
	document.getElementById("spriteArea").value = spr;
	document.getElementById("spriteInfo").innerHTML = spritewidth + 'x' + spriteheight;
});


function compiletocom(){
	var s=[];
	var str = input.value;
	printError(0);
	s=parser.pars(str)
	com = compiler.compile(s);
	printError(1);
	load(com);
	var out = '';
	for (var i = 0; i < com.length; i++) {
	  if(com.charCodeAt(i)>0xF)
		out +='$' + com.charCodeAt(i).toString(16) + ', ';
	  else
		out +='$0' + com.charCodeAt(i).toString(16) + ', '; 
	}
	out +='$00';
	document.getElementById('ram').value = out;
}

function decompile(buffer) {
	var address = 0x600;
	var i;
	var currentbyte;
	var previousbyte;
	var paramcount = 0;
	var lastpcount = 0;
	var addrmode;
	var opcode;
	var pad;
	var pre;
	var post;
	var out = '';

     // Padding for 1,2 & 3 byte instructions
	var padding = ["       ","    "," "];

     // 57 Instructions + Undefined ("???")
	var instruction = [
     //   0     1     2     3     4     5     6     7     8     9
		"ADC","AND","ASL","BCC","BCS","BEQ","BIT","BMI","BNE","BPL", // 0
		"BRK","BVC","BVS","CLC","CLD","CLI","CLV","CMP","CPX","CPY", // 1
		"DEC","DEX","DEY","EOR","INC","INX","INY","JMP","JSR","LDA", // 2
		"LDX","LDY","LSR","NOP","ORA","PHA","PHP","PLA","PLP","ROL", // 3
		"ROR","ROT","RTI","RTS","SBC","SEC","SED","SEI","STA","STX", // 4
		"STY","TAX","TAY","TSX","TXA","TXS","TYA","???"];            // 5

     // This is a lookup of the text formating required for mode output, plus one entry to distinguish relative mode
	var modes = [["",""],["#",""],["",",X"],["",",Y"],["(",",X)"],["(","),Y"],["(",")"],["A",""],["",""]];

     // Opcode Properties for 256 opcodes {length_in_bytes, mnemonic_lookup, mode_vars_lookup}
	var opcode_props = [
     //     0        1        2        3        4        5        6        7        8        9        A        B        C        D        E        F
     // ******** -------- ******** -------- ******** -------- ******** -------- ******** -------- ******** -------- ******** -------- ******** --------
		[1,10,0],[2,34,4],[1,57,0],[1,57,0],[1,57,0],[2,34,0],[2,2,0], [1,57,0],[1,36,0],[2,34,1],[1,2,7], [1,57,0],[1,57,0],[3,34,0],[3,2,0], [1,57,0], // 0
		[2,9,8], [2,34,5],[1,57,0],[1,57,0],[1,57,0],[2,34,2],[2,2,2], [1,57,0],[1,13,0],[3,34,3],[1,57,0],[1,57,0],[1,57,0],[3,34,2],[3,2,2], [1,57,0], // 1
		[3,28,0],[2,1,4], [1,57,0],[1,57,0],[2,6,0], [2,1,0], [2,39,0],[1,57,0],[1,38,0],[2,1,1], [1,39,7],[1,57,0],[3,6,0], [3,1,0], [3,39,0],[1,57,0], // 2
		[2,7,8], [2,1,5], [1,57,0],[1,57,0],[1,57,0],[2,1,2], [2,39,2],[1,57,0],[1,45,0],[3,1,3], [1,57,0],[1,57,0],[1,57,0],[3,1,2], [3,39,2],[1,57,0], // 3
		[1,42,0],[2,23,4],[1,57,0],[1,57,0],[1,57,0],[2,23,0],[2,32,0],[1,57,0],[1,35,0],[2,23,1],[1,32,7],[1,57,0],[3,27,0],[3,23,0],[3,32,0],[1,57,0], // 4
		[2,11,8],[2,23,5],[1,57,0],[1,57,0],[1,57,0],[2,23,2],[2,32,2],[1,57,0],[1,15,0],[3,23,3],[1,57,0],[1,57,0],[1,57,0],[3,23,2],[3,32,2],[1,57,0], // 5
		[1,43,0],[2,0,4], [1,57,0],[1,57,0],[1,57,0],[2,0,0], [2,40,0],[1,57,0],[1,37,0],[2,0,1], [1,40,7],[1,57,0],[3,27,6],[3,0,0], [3,40,0],[1,57,0], // 6
		[2,12,8],[2,0,5], [1,57,0],[1,57,0],[1,57,0],[2,0,2], [2,40,2],[1,57,0],[1,47,0],[3,0,3], [1,57,0],[1,57,0],[1,57,0],[3,0,2], [3,40,2],[1,57,0], // 7
		[1,57,0],[2,48,4],[1,57,0],[1,57,0],[2,50,0],[2,48,0],[2,49,0],[1,57,0],[1,22,0],[1,57,0],[1,54,0],[1,57,0],[3,50,0],[3,48,0],[3,49,0],[1,57,0], // 8
		[2,3,8], [2,48,5],[1,57,0],[1,57,0],[2,50,2],[2,48,2],[2,49,3],[1,57,0],[1,56,0],[3,48,3],[1,55,0],[1,57,0],[1,57,0],[3,48,2],[1,57,0],[1,57,0], // 9
		[2,31,1],[2,29,4],[2,30,1],[1,57,0],[2,31,0],[2,29,0],[2,30,0],[1,57,0],[1,52,0],[2,29,1],[1,51,0],[1,57,0],[3,31,0],[3,29,0],[3,30,0],[1,57,0], // A
		[2,4,8], [2,29,5],[1,57,0],[1,57,0],[2,31,2],[2,29,2],[2,30,3],[1,57,0],[1,16,0],[3,29,3],[1,53,0],[1,57,0],[3,31,2],[3,29,2],[3,30,3],[1,57,0], // B
		[2,19,1],[2,17,4],[1,57,0],[1,57,0],[2,19,0],[2,17,0],[2,20,0],[1,57,0],[1,26,0],[2,17,1],[1,21,0],[1,57,0],[3,19,0],[3,17,0],[3,20,0],[1,57,0], // C
		[2,8,8], [2,17,5],[1,57,0],[1,57,0],[1,57,0],[2,17,2],[2,20,2],[1,57,0],[1,14,0],[3,17,3],[1,57,0],[1,57,0],[1,57,0],[3,17,2],[3,20,2],[1,57,0], // D
		[2,18,1],[2,44,4],[1,57,0],[1,57,0],[2,18,0],[2,44,0],[2,24,0],[1,57,0],[1,25,0],[2,44,1],[1,33,0],[1,57,0],[3,18,0],[3,44,0],[3,24,0],[1,57,0], // E
		[2,5,8], [2,44,5],[1,57,0],[1,57,0],[1,57,0],[2,44,2],[2,24,2],[1,57,0],[1,46,0],[3,44,3],[1,57,0],[1,57,0],[1,57,0],[3,44,2],[3,24,2],[1,57,0]  // F
	];


	for (i = 0; i < buffer.length; ++i) {                                 //Start proccessing loop.
		previousbyte = currentbyte;
		currentbyte = buffer.charCodeAt(i);
		if (paramcount == 0) {
			out+="$" + address.toString(16) + "  ";                             //Display current address at beginning of line
			paramcount = opcode_props[currentbyte][0];              //Get instruction length
			opcode = instruction[opcode_props[currentbyte][1]];     //Get opcode name
			addrmode = opcode_props[currentbyte][2];                //Get info required to display addressing mode
			pre = modes[addrmode][0];                               //Look up pre-operand formatting text
			post = modes[addrmode][1];                              //Look up post-operand formatting text
			pad = padding[(paramcount - 1)];                        //Calculate correct padding for output alignment
			lastpcount = paramcount - 1;
			address = address + paramcount;                         //Increment address
		}
		if (paramcount != 0)                                        //Keep track of possition within instruction
			paramcount = paramcount - 1;
		out += num2hex(currentbyte) + " ";                               //Display the current byte in HEX
		if (paramcount == 0) {
			out += pad + " " + opcode + " " + pre;                  //Pad text, display instruction name and pre-operand vars
			  if(lastpcount == 1) {                            //Check if single operand instruction
				if (addrmode != 8) {                                //If not using relative addressing ...
					out += "$" + num2hex(currentbyte);                   //...display operand
				} else {                                            //Addressing mode is relative...
					out+="$" + (address + ((currentbyte < 128) ? currentbyte : currentbyte - 256)).toString(16); //...display relative address.
				}
			}
			if(lastpcount == 2)                                   //Check if two operand instruction and if so...
				out+="$" + num2hex(currentbyte) + num2hex(previousbyte);     //...display operand
			out+=post + "\n";                                   //Display post-operand vars
		}
	}
	out+= "$" + address.toString(16) + "             .END\n";                    //Add .END directive to end of output

	return out;                                                       //All done, exit to the OS
}

function disasm(){
	var d = document.getElementById("disasm");
	d.value = decompile(com);
	d.style.display = "block";
	document.getElementById("close").style.display = "block";
}

function closewindow(){
	var d = document.getElementById("disasm");
	d.style.display = "none";
	d = document.getElementById("spriteEditior");
	d.style.display = "none";
	d = document.getElementById("tutorial");
	d.style.display = "none";
	document.getElementById("close").style.display = "none";
}

function spriteEdit(){
	var d = document.getElementById("spriteEditior");
	d.style.display = "block";
	document.getElementById("close").style.display = "block";
}

function openTutorial(){
	var d = document.getElementById("tutorial");
	d.style.display = "block";
	document.getElementById("close").style.display = "block";
}

function savecom(){
	var newByteArr=[];
	if(com.length>1){
		for(var i=0;i<com.length;i++){
			newByteArr.push(com.charCodeAt(i)&0xFF);
		}
		var newFile=new Uint8Array(newByteArr);
		var blob = new Blob([newFile], {type: "charset=iso-8859-1"});
		saveAs(blob, "rom.bin");
	}
}

input.onclick = input.onkeydown = input.onkeyup = input.onkeypress = input.onpaste = inputOnKey;
input.value = sample[0][1];

var functionArray = [
	'cls(<b>byte</b> color); <i>clear screen</i>',
	'plot(<b>byte</b> color,<b>byte</b> x,<b>byte</b> y);',
	'getpixel(<b>byte</b> x,<b>byte</b> y); <i>return <b>byte</b> color</i>',
	'print(<b>byte</b> number,<b>byte</b> x,<b>byte</b> y);',
	'print(<b>array</b> string,<b>byte</b> x,<b>byte</b> y);',
	'printc(<b>char</b>,<b>byte</b> x,<b>byte</b> y);',
	'drawsprite(<b>array</b> image,<b>byte</b> width,<b>byte</b> height,<b>byte</b> x,<b>byte</b> y);',
	'drawsprite(<b>array</b> image,<b>byte</b> width,<b>byte</b> height,<b>byte</b> x,<b>byte</b> y,<b>byte</b> offset);',
	'screentosprite(<b>array</b> image,<b>byte</b> width,<b>byte</b> height,<b>byte</b> x,<b>byte</b> y);<i>save part of screen to array</i>',
	'random(); <i>returns a random number from 1 to 255</i>',
	'max(<b>byte</b> a,<b>byte</b> b); <i>returns a max number</i>',
	'min(<b>byte</b> a,<b>byte</b> b); <i>returns a min number</i>',
	'sqrt(<b>byte</b>); <i>return square root</i>',
	'sqr(<b>byte</b>); <i>return square</i>',
	'return; <i>exit from function</i>',
	'scrollleft(); <i> scroll on 1 pixel left</i>',
	'scrollright(); <i> scroll on 1 pixel right</i>',
	'scrollup(<b>byte</b> pixels); <i> scroll up</i>',
	'getkey(); <i>return</i> <b>byte</b>',
	'output(<b>byte</b>); <i>put char on console</i>',
	'input(); <i>return</i> <b>byte</b> <i>from console</i>',
	'getkey(); <i>return ascii code key pressed</i>',
	'settimer(<b>byte</b>); <i>set timer. Timer decreases by 60 every second. Timer only works on this emulator!</i>',
	'gettimer(); <i>returns the current value of the timer</i>',
	'if(<b>byte</b>){} <i>0 false, else true</i>',
	'function <b>name</b> = function(){}',
	'while(<b>byte</b>){} <i>repeat if true (0 false, else true)</i>',
	'label:',
	'goto(<b>label</b>);'
];

function loadTutorial(){
	var lst = document.getElementById("tutorial");
	var str = '';
	for(var i = 0; i < functionArray.length; i++)
		str += '<p>' + functionArray[i] + '</p>';
	lst.innerHTML += str;
}

function inputOnKey(e){
	var position = getCaretPos(input);
	var str = input.value;
	var left = 0;
	var strCount = 0;
	var right = str.length;
	var word;
	var out = '';
	if (e.keyCode === 9) { // была нажата клавиша TAB
		if(e.type == 'keyup')
			return false;
		// получим позицию каретки
		var val = this.value,
			start = this.selectionStart,
			end = this.selectionEnd;
		// установим значение textarea в: текст до каретки + tab + текст после каретки
		this.value = val.substring(0, start) + '\t' + val.substring(end);
		// переместим каретку
		this.selectionStart = this.selectionEnd = start + 1;
		// предотвратим потерю фокуса
		lineCount();
		return false;
	}
	for(var i = 0; i < position ; i++){
		if(str[i] == '\n'){
			strCount++;
		}
	}
	out += strCount +':';
	for(var i = position; i >= 0 ; i--){
		if(' \n\r\t({[]});='.indexOf(str[i]) > -1){
			left = i + 1;
			break;
		}
	}
	for(i = position; i < str.length; i++){
		if(' \n\r\t({[]});='.indexOf(str[i]) > -1){
			right = i;
			break;
		}
	}
	if(left < right){
		word = str.substring(left,right);
		var oBracket = word.indexOf('(');
		if(oBracket >-1 )
			word = word.substring(0, oBracket);
		for(i = 0; i < functionArray.length; i++){
			if(functionArray[i].indexOf(word) == 0)
				out += functionArray[i] + ' ';
		}
	}
	lineCount();
	document.getElementById("hint").innerHTML = out;
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
  } else if (obj.selectionStart!==false) return obj.selectionStart; // Gecko
  else return 0;
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
	RAM[0xff]=e.keyCode+32;
	globalKey=e.keyCode+32;
}

function keyUpHandler(e) {
	RAM[0xff]=0;
	globalKey=0;
}

function sendToConsole(){
	var inp = document.getElementById("textForConsole");
	consoleBuffer += inp.value + '\n';
	inp.value = '';
}

function Display() {
    var displayArray = [];
    var ctx;
    var width;
    var height;
    var pixelSize = 1;
    var numX = 128;
    var numY = 128;

    function initialize() {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      ctx = canvas.getContext('2d');
	  ctx.imageSmoothingEnabled = false;
      reset();
    }

    function reset() {
	  ctx.textAlign="start";
	  ctx.textBaseline="hanging";
	  ctx.font=pixelSize*8+"px monospace";
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }

    function updatePixel(addr) {
      ctx.fillStyle = r3g3b2ToRGB(RAM[addr])
      var y = Math.floor((addr - 0x9000) / numY );
      var x = (addr - 0x9000) % numX ;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
	
	function updateHighPixel(addr) {
      ctx.fillStyle = palette[RAM[addr] & 0x0f];
      var y = Math.floor((addr - 0x200) / 32);
      var x = (addr - 0x200) % 32;
      ctx.fillRect(x* pixelSize*4, y * pixelSize*4, pixelSize*4, pixelSize*4);
    }

    return {
      initialize: initialize,
      reset: reset,
      updatePixel: updatePixel,
	  updateHighPixel: updateHighPixel
    };
  }
  
var display = new Display();

function num2hex(nr) {
    var str = "0123456789abcdef";
    var hi = ((nr & 0xf0) >> 4);
    var lo = (nr & 15);
    return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
  }

function formatToArray(start, length) {
      var html = '';
      var n;
	  var j = 512;
	  var startVarAdress = GlobalVariableName[0] - start - 1;
      for (var x = 0; x < length; x++) {
		if ((x & 7) === 0) {
          if (x > 0) { 
		    j--;
			html +="|" + num2hex(RAM[j]) + "<br>"; 	
		  }
          n = (start + x);
        }
		if(x > startVarAdress && x < startVarAdress + GlobalVariableName.length)
			html += '<b title="variable\n' + GlobalVariableName[x - startVarAdress] + '\n' + RAM[start + x] + '">' + num2hex(RAM[start + x]) + '</b>';
		else
			html += num2hex(RAM[start + x]);
        html += " ";
      }
	  html += "00";
      return html;
    }

function debug(){
	outDebug.innerHTML = formatToArray(0,151);
	
	var clm1 = '<div class="column">';
	var clm2 = '<div class="column">';
	var clm3 = '<div class="column">';
	var clm4 = '<div class="column">';
	var adr = cpu.PC;
	for(var i=0; i<14; i++){
		var mem = RAM[adr-6+i];
		if(i == 6){
			clm1 += '<div class="thisip">';
			clm2 += '<div class="thisip">';
			clm3 += '<div class="thisip">';
			clm4 += '<div class="thisip">';
		}
		if(mem !== undefined){
			clm1 += (adr - 6 + i).toString(16);
			clm1 += '<br>';
			clm2 += '0x';
			clm2 += num2hex(mem);
			clm2 += '<br>';
			clm3 += mem;
			clm3 += '<br>';
			clm4 += String.fromCharCode(mem);
			clm4 += '<br>';
		}
		if(i == 6){
			clm1 += '</div>';
			clm2 += '</div>';
			clm3 += '</div>';
			clm4 += '</div>';
		}
	}
	codePreviev.innerHTML = cpu.log() + clm1+'</div>'+clm2+'</div>'+clm3+'</div>'+clm4+'</div>';
}

function printError(error, n, lineCount){
	var out = document.getElementById("alert");
	switch(error){
		case 0:
			out.innerHTML = 'start compilation<br>';
			break;
		case 1:
			out.innerHTML += 'end compilation<br>length ' + com.length + ' byte<br>';
			break;
		case 2:
			out.innerHTML += '<b>wrong number of brackets</b><br>';
			break;
		case 3:
			out.innerHTML += '<b>' + lineCount +': variable with name ' + n + ' is not declared</b><br>';
			break;
		case 4:
			out.innerHTML += '<b>wrong number of braces</b><br>';
			break;
		case 5:
			out.innerHTML += 'zero ram use ' + n + ' byte<br>';
			break;
		case 6:
			out.innerHTML += '<b>no quotes after ' + n + '</b><br>';
			break;
		case 7:
			out.innerHTML += '<b>' + lineCount +': invalid number of arguments</b><br>';
			break;
		case 8:
			out.innerHTML += '<b>' + lineCount +': invalid function declaration: ' + n + '</b><br>';
			break;
		case 9:
			out.innerHTML += 'arrays use ' + n + ' byte<br>';
			break;
		case 10:
			out.innerHTML += '6502 Stack filled!<br>';
			break;
	}
}

function outputToConsole(s){
	var out = document.getElementById("alert");
	if(out.innerHTML.length > 320)
		out.innerHTML = out.innerHTML.substring(1);
	s = String.fromCharCode(s);
	out.innerHTML += s;
}

function loadFromTextArea(){
	var ram = document.getElementById('ram').value;
	ram = ram.replace(/ /g,"");
	ram = ram.replace(/\$/g,"");
	ram = ram.replace(/0x/g,"");
	ram = ram.replace(/0X/g,"");
	ram = ram.replace(/\n/g,"");
	var prog = ram.split(',');
	cpu.reset();
	for (var i = 0; i < 65535; i++) {
             RAM[i] = 0x0;
         }
	for(var i = 0;i < prog.length;i++){
		RAM[i + START_ADRESS] = parseInt(prog[i], 16) & 0xFF;
		
	}
	document.getElementById('ram').value = '';
	ram = '';
	  for (var i = 0; i < prog.length; i++) {
		  if(parseInt(prog[i], 16)>0xF)
			ram +='$' + (parseInt(prog[i], 16) & 0xFF) .toString(16)+ ', ';
		  else
			ram +='$0' + (parseInt(prog[i], 16) & 0xFF).toString(16) + ', '; 
	  }
	ram =  ram.substring(0, ram.length - 3);
	document.getElementById('ram').value = ram;
	
}

function load(program){
	cpu.reset();
	var i;
	//clean RAM
	for (i = 0; i < 65535; i++) {
             RAM[i] = 0x0;
         }	
	for (i = 0; i < program.length; i++) {
		RAM[i + START_ADRESS] = program.charCodeAt(i);
	}
}

function globalInit(){
	display.initialize();
	pixelareainit();
	loadTutorial();
	loadSampleList();
	cpu.reset();
	lineCount();
}

document.addEventListener("DOMContentLoaded", globalInit);
