"use strict";
var parser = new Parser();
var compiler = new Compiler();

var com;


function error(err, n, lineCount){
	printError(err, n, lineCount);
}

function Parser(){
	var lastDefine;
	var functionsList = ['if','while','goto','input','output','delay','getkey','screentosprite','setcolor','setbackgroundcolor','sqr','sqrt',
			'print','printc','cls','max','min','inc','dec','random','sqr','sqrt','plot','getpixel','function','gettimer','settimer','scrollup','drawsprite','drawline'];

	function isNumber(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}

	function getRang(c){
		if(isNumber(c))
			return 1;
		switch(c){
			case '+':case '-':case '&':case '|':case '^':case '<':case '>':case '!':return 3;
			case '*':case '/':case '%':return 4;
			case '(':case '[':return 0;
			case ')':case ']':return 5;
			case ',':return 9;
			case '=':return 6;
			case ' ':case '\t':case '\v':case '\r':return 7;
			case '\n':return 15;
			case ';':case '{':case '}':return 8;
			case ':':return 11;
		} 
		return 2;
	}

	function functionExistInList(f){
		if(functionsList.indexOf(f)>-1)
			return true;
		return false;
	}
	
	function defineReplacer(str, def, repl, offset, s) {
		lastDefine = [def ,repl];
		return ' ';
	}

	function define(s){
		lastDefine=1;
		while(lastDefine != 0){
			lastDefine = 0;
			s = s.replace(/#define *([^\s]*) *([^\n]*)/, defineReplacer);
			if(lastDefine != 0)
				s = s.replace(new RegExp(lastDefine[0], 'g'), lastDefine[1]);
			//console.log(s);
		}
		return s;
	}

	function precalculate(str, a, op, b, offset, s){
		if(op == '*')
			return a*b;
		if(op == '/')
			return Math.floor(a/b);
		return str;
	}
	
	function multiplicationToShift(str, op, b, offset, s){
		var x = '<<';
		if(op == '*')
			x = '<<';
		if(op == '/')
			x = '>>';
		switch(b){
			case '2':
				return x + '1';
			case '4':
				return x + '2';
			case '8':
				return x + '3';
			case '16':
				return x + '4';
			case '32':
				return x + '5';
			case '64':
				return x + '6';
			case '128':
				return x + '7';
		}
		return str;
	}
	
	function optimization(s){
		s = s.replace(/(\d+) *(\*) *(\d+)/g, precalculate);
		s = s.replace(/(\d+) *(\/) *(\d+)/g, precalculate);
		s = s.replace(/([\*\/]) *(\d+)/g, multiplicationToShift);
		return s;
	}

	function pars(s){
		var isFunction = false;
		var token = [];
		var bufer = [];
		var rang = 0;
		var count = 0;
		var nameBuffer = '';
		var addBuffer = '';
		var buferCount = 0;
		var bracketCount = 0;
		token[0] = {};
		token[0].name = '';
		bufer[0] = {};
		bufer[0].name = '';
		s = s.replace(/\/\/.*/g,"");//remove comment
		s = define(s);
		s=s.replace(/(if\(.*\))\s([^{}]*?\;)/g, '$1{$2}');//добавление скобок к if если они отстутствуют
		s=s.replace(/(while\(.*\))\s([^{}]*?\;)/g, '$1{$2}');//добавление скобок к while если они отстутствуют
		s=s.replace(/(\w*\d*) *\+ *=([^;]*)/g, '$1=$1+($2)');//замена сокращенной записи прибавления к переменной
		s=s.replace(/(\w*\d*) *\- *=([^;]*)/g, '$1=$1-($2)');//замена сокращенной записи отнимания от переменной
		s = optimization(s);
		for(var i=0; i<s.length; i++){
			//обработка строки
			if(s[i] == '"'){
				var stringBuffer = '"';
				for(var j = i+1; j < s.length; j++){
					if(s[j] == '"')
						break;
					else if(s[j] == '\\'){
						j++;
						if(s[j] == 'n')
							stringBuffer += '\n';
						else if(s[j] == 'r')
							stringBuffer += '\r';
						else if(s[j] == '\\')
							stringBuffer += '\\';
						else if(s[j] == '"')
							stringBuffer += '"';
					}
					else
						stringBuffer += s[j];
				}
				if(stringBuffer[stringBuffer.length - 1]!='#'){
					stringBuffer += '#';
				}
				i = j;
				rang = -1;
				token[count].name = stringBuffer;
				token[count].rang = 1;
			}
			//обработка данных для массива
			else if(s[i] == '{' && addBuffer != ''){
				if(!isFunction){
					var stringBuffer = '{';
					for(var j = i+1; j < s.length; j++){
						if(s[j] == '}')
							break;
						stringBuffer += s[j];
					}
					stringBuffer += s[j];
					i = j;
					rang = -1;
					token[count].name = stringBuffer;
					token[count].rang = 1;
				}
				else{
					isFunction = false;
					rang = getRang(s[i]);
				}
			}
			else if(s[i] == '\''){
				rang = -1;
				token[count].name = s[i+1].charCodeAt(0);
				token[count].rang = 1;
				i+=2;
				if(s[i]!='\'')
					error(6, s[i-1]);
			}
			else
				rang = getRang(s[i]);
			if(rang == 0){
				bracketCount++;
				bufer[buferCount].name = s[i];
				bufer[buferCount].rang = rang;
				buferCount++;
				bufer[buferCount] = {name:''};
				if(functionExistInList(token[count].name)){
					bufer[buferCount].name = token[count].name;
					bufer[buferCount].rang = 2;
					buferCount++;
					bufer[buferCount] = {name:''};
					if(token[count].name == 'function'){
						isFunction = true;
						//console.log(addBuffer);
						functionsList.push(addBuffer);//добавляем новую функцию в список функций
						token[count] = {name:'@',rang:21};
						count++;
					}
					token[count] = {name:''};
				}
				if(s[i] == '['){
					nameBuffer = token[count].name;
					token[count] = {name:'[',rang:12};
				}
				count++;
				token[count] = {name:''};
			}
			else if(rang == 1){
				token[count].name += s[i];
				token[count].rang = rang;
			}
			else if(rang == 2){
				token[count].name += s[i];
				token[count].rang = rang;
			}
			else if(rang == 5){
				bracketCount--;
				for(var j = buferCount - 1; j >= 0; j--){
					if(bufer[j].rang > 0){
						count++;
						token[count] = {};
						token[count].name = bufer[j].name;
						token[count].rang = bufer[j].rang;
						bufer[j].name = '';
						buferCount--; 
					}
					else{
						bufer[j].name = '';
						buferCount--;
						j = -1;
					} 
				}
				if(s[i] == ']'){
					count++;
					token[count] = {name:']',rang:13};
					count++;
					token[count] = {};
					token[count].rang = 2;
					token[count].name = nameBuffer;
					nameBuffer = '';
				}
				else{
				count++;
				token[count] = {name:'',rang:1};
				}
			}
			else if(rang == 6){
				if(s[i + 1] == '='){
					bufer[buferCount].rang = 3;
					bufer[buferCount].name = s[i];
					bufer[buferCount].name += '=';
					i++;
					buferCount++;
					bufer[buferCount] = {name : ''};
					count++;
					token[count] = {name : ''};
				}
				else{			
					addBuffer = token[count].name;
					token[count]={name:' ',rang:0};
					count++;
					token[count]={name:''};
					for(j = buferCount - 1; j >= 0; j--){
						if(bufer[j].rang > 2){
							count++;
							token[count]={};
							token[count].name = bufer[j].name;
							token[count].rang = bufer[j].rang;
							bufer[j].name = '';
							buferCount--; 
						}
						else{
							j = -1;
							count++;
							token[count] = {name:''};
						} 
					}
				}
			}
			else if(rang == 7){
			// skip space
			}
			else if(rang == 8){
				if(token[count].name != '')
					count++;
				for(var j = bufer.length - 1; j >= 0; j--){
					token[count] = {};
					token[count].name = bufer[j].name;
					token[count].rang = bufer[j].rang;
					bufer[j].name = '';
					count++;
					token[count] = {name : ''};
				}
				buferCount = 0;
				if(addBuffer != ''){
					token[count] = {};
					token[count].name = '=';
					token[count].rang = 6;
					count++;
					token[count] = {};
					token[count].name = addBuffer;
					token[count].rang = 2;
					count++;		
					addBuffer = '';
				}
				token[count]={name : '' , rang : 8};
				token[count].name = s[i];
				count++;
				token[count] = {name : ''};
			}
			else if(rang == 9){
				for(var j = buferCount - 1; j >= 0; j--){
					if(bufer[j].rang > 2){
						count++;
						token[count] = {};
						token[count].name = bufer[j].name;
						token[count].rang = bufer[j].rang;
						bufer[j].name = '';  
						buferCount--; 
					}
					else{
						j = -1;
						count++;
						token[count] = {name : ',', rang : 9};
						count++;
						token[count] = {name : ''};
					} 
				}
			}
			else if(rang == 11){
				token[count].rang = 11;
				count++;
				token[count] = {name : ''};
			}
			else if(rang == 15){
				token[count].rang = 15;
				token[count].name = '\n';
				count++;
				token[count] = {name : ''};
			}
			else if(rang>2){
				if(token[count].rang <= rang){ 
					for(var j = buferCount - 1; j >= 0; j--){
						if(bufer[j].rang >= rang){
							count++;
							token[count] = {};
							token[count].name = bufer[j].name;
							token[count].rang = bufer[j].rang;
							bufer[j].name = '';
							buferCount--; 
						}
						else
							j = -1;
					}
				}
				bufer[buferCount].rang = rang;
				bufer[buferCount].name = s[i];
				if(s[i + 1] == '='){
					bufer[buferCount].name += '=';
					i++;
				}
				else if(s[i + 1] == '+'){
					bufer[buferCount].name += '+';
					i++;
				}
				else if(s[i + 1] == '-'){
					bufer[buferCount].name += '-';
					i++;
				}
				else if(s[i + 1] == '>'){
					bufer[buferCount].name += '>';
					i++;
				}
				else if(s[i + 1] == '<'){
					bufer[buferCount].name += '<';
					i++;
				}
				else if(s[i + 1] == '&'){
					bufer[buferCount].name += '&';
					i++;
				}
				else if(s[i + 1] == '|'){
					bufer[buferCount].name += '|';
					i++;
				}
				buferCount++;
				bufer[buferCount] = {name : ''};
				count++;
				token[count] = {name : ''};
			}
		}
		for(i = 0; i < token.length; i++){
			if(token[i].name.length < 1 || token[i].name == ' '){
				token.splice(i, 1);
				i--;
			}
		}
		if(bracketCount != 0)
			error(2);
		return token;
	}
	
	return {pars:pars};
}

function Compiler(){
	var optimization = true;
	var out = [];
	var OFFSET = 0x600;//for com
	var LDA = 0xA9;
	var STA = 0x85;
	var CLC = 0x18;
	var ADC = 0x65;
	var JUMP = 0x4C;
	var RTS = 0x60;
	var adressTable = 0;
	var fontTable = 0;
	var steckLength = 0;
	var adress = OFFSET;
	var varAdress;
	var lineCount = 0;
	var adressPlotFunction;
	var adressDivideFunction;
	var adressPrintcFunction;
	var adressBinToBCDFunction;
	var adressPrintNumberFunction;
	var adressPrintTextFunction;
	var adressDrawFunction;
	var adressLineFunction;
	var adressReadScreenFunction;
	var adressScrollupFunction;
	var adressSqrFunction;
	var adressSqrtFunction;
	var calcAdressArray = [];
	var variablesArray = [];
	var functionsArray = [];
	var functionsArgumentBuffer;
	var ArrayArray = [];
	var positionArray = [];
	var jumpArray = [];
	var bracketArray = [];
	var lastStringEnd;
		
	function write8(){
		var n;
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] == 'number')
				n = arguments[i];
			else
				n = parseInt(arguments[i],10);
			out.push(String.fromCharCode(n & 0xFF));
			adress += 1;
		}
	}
	
	function write16(){
		var n;
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] == 'number')
				n = arguments[i];
			else
				n = parseInt(arguments[i],10);
			write8(0xFF & n);//устанавливаем младший бит адреса
			write8((0xFF00 & n) >> 8);//устанавливаем старший бит адреса
		}
	}
	
	function write8toAddr(adr, n){
		out[adr - OFFSET] = String.fromCharCode(n & 0xFF);
	}
	
	function write16toAddr(adr, n){
		write8toAddr(adr, 0xFF & n);
		write8toAddr(adr + 1, (0xFF00 & n) >> 8);
	}
	
	function delite8(n){
		for(var i=0; i<n; i++)
			if(out.length > 0){
				out.pop();
				adress--;
			}
	}
	
	function includePrintc(){
		write8(0x4C);
		adressPrintcFunction = adress + 2;
		var newAdr = adressPrintcFunction + 68;
		write16(newAdr);
		write8(0xC9,0x5B,0x30,0x03,0x18,0xe9,0x1F);
		//номер символа переносим из A в Х
		write8(0xAA);
		//загружаем адрес символа по его номеру из таблицы
		write8(0xBD);
		adressTable = adress;
		write16(0);//address table
		write8(0x85,0x0C);//сохраняем вторую часть указателя в 0х0С
		write8(0xA9);
		fontTable = adress;
		write8(0);//сохраняем первую часть указателя, должна указывать на начало страницы
		write8(0x85,0x0D);
		//инициализируем счетчики Х и У нулями
		write8(0xA2,0x00,0xA0,0x00);
		//начало цикла
		write8(0x8A,0xA8);
		write8(0xB1,0x0C);
		write8(0xA0,0x00,0x48,0x29,0x01);
		write8(0xc9, 0x01, 0xf0, 0x04, 0xa5, 0x0f, 0x10, 0x02, 0xa5, 0x0e);
		write8(0x91,0x0A);
		write8(0xC8,0x68,0x6A,0xC0,0x04,0xD0,0xEA);
		write8(0xA9,0x20,0x18,0x65,0x0A,0x85,0x0A);
		write8(0xA9,0x00,0x65,0x0B,0x85,0x0B,0xE8);
		write8(0xE0,0x05,0xD0,0xD2);
		write8(RTS);
	}
	
	function includePrintText(){
		write8(0x4C);
		adressPrintTextFunction = adress + 2;
		var newAdr = adressPrintTextFunction + 34;
		write16(newAdr);
		write8(0xa9, 0x00, 0x85, 0x00);
		write8(0xA4);//ldy
		write8(0x00);
		write8(0xb1, 0x16);
		write8(0xc9, 0x23, 0xf0, 0x15);
		//выводим букву на экран
		write8(0x20);
		write16(adressPrintcFunction);
		write8(0xa5, 0x0a, 0x18, 0xe9, 0x9a, 0x85, 0x0a, 0xa5, 0x0b, 0xe9, 0x00, 0x85, 0x0b, 0xe6, 0x00);
		write8(0x18, 0x90, 0xe3);
		write8(RTS);
	}
	
	function includePrintNumber(){
		write8(0x4C);
		adressPrintNumberFunction = adress + 2;
		var newAdr = adressPrintNumberFunction + 46;
		write16(newAdr);
		//сохраняем вычисленные значения позиции на экране
		write8(0xa5 ,0x0A ,0x85 ,0x13 ,0xa5 ,0x0B ,0x85 ,0x14);
		//выводим букву на экран
		write8(0xA5, 0x10);
		write8(0x20);
		write16(adressPrintcFunction);
		//загружаем значения позиции на экране
		write8(0x18 ,0xA9 ,0x04 ,0x65 ,0x13 ,0x85 ,0x0A ,0xa5 ,0x14 ,0x85 ,0x0B);
		//выводим следующую букву на экран
		write8(0xA5, 0x11);
		write8(0x20);
		write16(adressPrintcFunction);
		//загружаем значения позиции на экране
		write8(0x18 ,0xA9 ,0x08 ,0x65 ,0x13 ,0x85 ,0x0A ,0xa5 ,0x14 ,0x85 ,0x0B);
		//выводим следующую букву на экран
		write8(0xA5, 0x12);
		write8(0x20);
		write16(adressPrintcFunction);
		write8(RTS);
	}
	
	function includePlot(){
		write8(0x4C);
		adressPlotFunction = adress + 2;
		var newAdr = adressPlotFunction + 41;
		write16(newAdr);
		//сохраняем регистр Х как адрес
		write8(0x86, 0x0A, 0xA2, 0x00, 0x86, 0x0B);
		//двигаем байты четыре раза
		write8(0x06, 0x0A, 0x06, 0x0A, 0x06, 0x0A, 0x06, 0x0A);
		//проверяем нет ли переноса
		write8(0x90, 0x02);
		//если есть увеличиваем старший байт на 1
		write8(0xE6, 0x0B);
		//затем сдвигаем еще раз, уже оба байта
		write8(0x06, 0x0B, 0x06, 0x0A);
		//проверяем, нет ли переноса
		write8(0x90, 0x02);
		//если есть увеличиваем старший байт на 1
		write8(0xE6, 0x0B);
		//увеличиваем старший байт еще на два, тк адрес видеопамяти 0x200
		write8(0xE6, 0x0B, 0xE6, 0x0B);
		//выходим из подпрограммы
		write8(0x48, 0x98, 0x18, 0x65, 0x0a, 0x85, 0x0a, 0xa0, 0x00, 0x68);
		write8(RTS);
	}
	
	function includeDraw(){
		write8(0x4C);
		adressDrawFunction = adress + 2;
		var newAdr = adressDrawFunction + 47;
		write16(newAdr);
		write8(0xA4);
		write8(0x00);
		write8(0x88, 0xB1, 0x16, 0xC9, 0xFF, 0xF0, 0x02);// lda ($16),y sta ($0a),y
		write8(0x91, 0x0A, 0xC0, 0x00, 0xD0, 0xF3);
		write8(0xCA, 0x18);
		write8(0xA5);
		write8(0x00);//write8(steckLength);
		write8(0x65, 0x16, 0x85, 0x16);
		write8(0xA9, 0x00, 0x65, 0x17, 0x85, 0x17, 0x18);
		write8(0xA9, 0x20, 0x65, 0x0A, 0x85, 0x0A, 0xA9, 0x00);
		write8(0x65, 0x0B, 0x85, 0x0B, 0xE0, 0x00, 0xD0, 0xD2);
		write8(RTS);
	}
	
	function includeLine(){
		write8(0x4C);
		adressLineFunction = adress + 2;
		var newAdr = adressLineFunction + 212;
		write16(newAdr);
		//if x1 > x2 and y1 > y2
		write8(0xa5, 0x00, 0xc5, 0x02, 0x30, 0x12, 0xaa, 0xa5, 0x02, 0x85, 0x00, 0x8a, 0x85, 0x02, 0xa5, 0x01);
		write8(0xaa, 0xa5, 0x03, 0x85, 0x01, 0x8a, 0x85, 0x03); 
		//setY
		write8(0xA6);
		write8(0x01);
		//setX
		write8(0xA4);
		write8(0x00);
		//plot
		write8(0x20);
		write16(adressPlotFunction);
		write8(0xa5, 0x03, 0xc5, 0x01);
		// if y1 == y2 draw fast line
		write8(0xd0, 0x11, 0x38, 0xa5, 0x02, 0xe5, 0x00, 0xa8, 0xc8, 0xa5, 0x0e, 0x88, 0x91, 0x0a, 0xc0, 0x00, 0xd0, 0xf9);
		write8(RTS);
		write8(0x30, 0x4E);
		write8(0xa9, 0x00, 0x85, 0x13, 0xa8, 0xaa, 0xa5, 0x02, 0x18, 0xe5, 0x00, 0x85, 0x10, 0xa5, 0x03, 0x18);
		write8(0xe5, 0x01, 0x85, 0x11, 0x85, 0x12, 0x18, 0x65, 0x10, 0x85, 0x12, 0xe6, 0x12, 0xa5, 0x0e, 0x91);
		write8(0x0a, 0xe8, 0xa5, 0x13, 0xc9, 0x80, 0x10, 0x17, 0x18, 0xe5, 0x10, 0x85, 0x13, 0xa9, 0x20);
		write8(0x18, 0x65, 0x0a, 0x85, 0x0a, 0xa9, 0x00, 0x65, 0x0b, 0x85, 0x0b, 0xe6, 0x01, 0x18, 0x90, 0x06);
		write8(0x18, 0x65, 0x11, 0x85, 0x13, 0xc8, 0xa5, 0x0e, 0x91, 0x0a, 0xe4, 0x12, 0xd0, 0xd4);
		write8(RTS);
		write8(0xa9, 0x00, 0x85, 0x13, 0xa8, 0xaa, 0xa5, 0x02, 0x18, 0xe5, 0x00, 0x85, 0x10, 0xa5, 0x01, 0x18);
		write8(0xe5, 0x03, 0x85, 0x11, 0x85, 0x12, 0x18, 0x65, 0x10, 0x85, 0x12, 0xe6, 0x12, 0xa5, 0x0e, 0x91);
		write8(0x0a, 0xe8, 0xa5, 0x13, 0xc9, 0x80, 0x10, 0x17, 0x18, 0xe5, 0x10, 0x85, 0x13, 0xa5, 0x0a);
		write8(0x18, 0xe9, 0x1f, 0x85, 0x0a, 0xa5, 0x0b, 0xe9, 0x00, 0x85, 0x0b, 0xe6, 0x01, 0x18, 0x90, 0x06);
		write8(0x18, 0x65, 0x11, 0x85, 0x13, 0xc8, 0xa5, 0x0e, 0x91, 0x0a, 0xe4, 0x12, 0xd0, 0xd4);
		write8(RTS);
	}
	
	function includeReadScreen(){
		write8(0x4C);
		adressReadScreenFunction = adress + 2;
		var newAdr = adressReadScreenFunction + 43;
		write16(newAdr);
		write8(0xA4);
		write8(0x00);
		//выводим точку на экран
		write8(0x88, 0xb1, 0x0a, 0x91, 0x16 , 0xC0, 0x00, 0xD0, 0xF7);
		write8(0xCA, 0x18);
		write8(0xA5);
		write8(0x00);
		write8(0x65, 0x16, 0x85, 0x16);
		write8(0xA9, 0x00, 0x65, 0x17, 0x85, 0x17, 0x18);
		write8(0xA9, 0x20, 0x65, 0x0A, 0x85, 0x0A, 0xA9, 0x00);
		write8(0x65, 0x0B, 0x85, 0x0B, 0xE0, 0x00, 0xD0, 0xD6);
		write8(RTS);
	}
	
	function includeDivide(){
		//перепрыгиваем через функцию, запоминаем где она находится
		write8(0x4C);
		adressDivideFunction = adress + 2;
		var newAdr = adressDivideFunction + 19;
		write16(newAdr);
		//устанавливаем регистр с результатом в 0
		write8(0xA2, 0x00);
		//проверяем равен ли делитель нулю, и если да, то выходим
		write8(0xC9, 0x00, 0xF0, 0x0C);
		//сравниваем число с делителем, если меньше выходим
		write8(0xC5, 0x0A, 0x90, 0x08);
		//отнимаем делитель и увеличиваем результат на один
		write8(0x38, 0xE5, 0x0A, 0xE8);
		//сравниваем число с делителем, если больше возвращаемся
		write8(0xC5, 0x0A, 0xB0, 0xF8);
		//выходим из подпрограммы
		write8(RTS);
	}
	
	function includeSqr(){
		write8(0x4C);
		adressSqrFunction = adress + 2;
		var newAdr = adressSqrFunction + 28;
		write16(newAdr);
		write8(0xC9,0x10,0x90,0x02,0xA9,0x10,0xAA);
		newAdr = adress + 4;
		write8(0xBD);
		write16(newAdr);
		write8(RTS);
		//таблица значений квадрата числа
		write8(0x00,0x01,0x04,0x09,0x10,0x19,0x24,0x31,0x40,0x51,0x64,0x79,0x90,0xA9,0xC4,0xE1,0xFF);
	}
	
	function includeSqrt(){
		write8(0x4C);
		adressSqrtFunction = adress + 2;
		var newAdr = adressSqrtFunction + 26;
		write16(newAdr);
		//проверяем А, если 0 выходим
		write8(0xC9, 0x00, 0xF0, 0x15);
		//берем число из регистра А, его корень возвращаем назад в регистр А
		write8(0x85, 0x0A, 0xA9, 0x01, 0x85, 0x0B, 0xA0, 0x00);
		//прибавляем нечетные числа по одному начиная с 1 пока сумма не сравняется с числом на входе
		//количество нечетных чисел и будет корнем числа, возвращаем его в регистр А
		write8(0x18, 0x65, 0x0B, 0xE6, 0x0B, 0xE6, 0x0B, 0xC8, 0xC5, 0x0A, 0x90, 0xF4, 0x98);
		write8(RTS);
	}
	
	function includeScrollup(){
		write8(0x4C);
		adressScrollupFunction = adress + 2;
		var newAdr = adressScrollupFunction + 64;
		write16(newAdr);
		write8(0xa0 , 0x00 , 0xb9 , 0x20 , 0x02 , 0x99 , 0x00 , 0x02 , 0xc8 , 0xc0 , 0xff , 0xd0 , 0xf5 , 0xa0 , 0x00 , 0xb9 );
		write8(0x20 , 0x03 , 0x99 , 0x00 , 0x03 , 0xc8 , 0xc0 , 0xff , 0xd0 , 0xf5 , 0xb9 , 0x20 , 0x04 , 0x99 , 0x00 , 0x04 );
		write8(0xc8 , 0xc0 , 0xff , 0xd0 , 0xf5 , 0xa0 , 0x00, 0xb9 , 0x20 , 0x05 , 0x99 , 0x00 , 0x05 , 0xc8 , 0xc0 , 0xe0 , 0xd0 , 0xf5 );
		write8(0xa5 , 0x0f , 0xa0 , 0x20 , 0x88 , 0x99 , 0xe0 , 0x05 , 0xc0 , 0x00 , 0xd0 , 0xf8 , 0x60);
		write8(RTS);
	}
	
	function includeBinToBCD(){
		//перепрыгиваем через функцию, запоминаем где она находится
		write8(0x4C);
		adressBinToBCDFunction = adress + 2;
		var newAdr = adressBinToBCDFunction + 94;
		write16(newAdr);
		//устанавливаем счетчики и обнуляем ячейки
		write8(0xAA, 0xA0, 0x05, 0xA9, 0x00, 0x85, 0x10, 0x85, 0x11, 0x85, 0x12, 0x8A);
		//делаем три сдвига из аккумулятора в последнюю ячейку
		write8(0x2A, 0x26, 0x12, 0x2A, 0x26, 0x12, 0x2A, 0x26, 0x12);
		//оставшиеся 5 сдвигов делаем в цикле, проверяя каждый из нибблов и прибавляя 3 если он больше 5
		write8(0x88, 0xAA, 0xA5, 0x12, 0x29, 0x0F, 0xC9, 0x05, 0x30, 0x07, 0xA9, 0x03);
		write8(0x18, 0x65, 0x12, 0x85, 0x12, 0xA5, 0x12, 0x29, 0xF0, 0xC9, 0x50, 0x30);
		write8(0x07, 0xA9, 0x30, 0x18, 0x65, 0x12, 0x85, 0x12, 0x8A, 0x2A, 0x26, 0x12);
		write8(0x26, 0x10, 0xC0, 0x00, 0xD0, 0xD6, 0xA5, 0x12, 0x29, 0xF0, 0x18, 0x6A);
		//раскидываем содержимое одной ячейки по двум, конвертируем в char
		write8(0x6A, 0x6A, 0x6A, 0x18, 0x69, 0x30, 0x85, 0x11, 0xA5, 0x12, 0x29, 0x0F);
		write8(0x18, 0x69, 0x30, 0x85, 0x12, 0xA5, 0x10, 0x18, 0x69, 0x30, 0x85, 0x10);
		write8(RTS);
	}
	
	function loadJmp(n){
		write8(JUMP);
		calcAdressArray.push(['jmp' ,n ,adress]);
		write16(0x0000);
	}
	
	function loadVar(name){
		for (var i = 0; i < functionsArgumentBuffer.length; i++){
			if(functionsArgumentBuffer[i] == name){
				if(steckLength > 0){
					write8(STA);
					write8(steckLength - 1);
				}
				write8(0xba, 0xbd);
				write16(259 + i);
				steckLength++;
				return true;
			}
		}
		for (i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == name){
				if(steckLength > 0){
					write8(STA);
					write8(steckLength - 1);
				}
				write8(0xA5);
				write8(variablesArray[i][1]);
				steckLength++;
				return true;
			}
		}
		return false;
	}
	
	function saveVar(name){
		for (var i = 0; i < functionsArgumentBuffer.length; i++){
			if(functionsArgumentBuffer[i] == name){
				write8(0xba, 0x9d);
				write16(259 + i);
				return true;
			}
		}
		for(var i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == name){
				write8(STA);
				write8(variablesArray[i][1]);
				return true;
			}
		}
		variablesArray.push([name,varAdress]);
		write8(STA);
		write8(varAdress);
		varAdress++;
		return true;
	}
	
	function loadFromArray(name, pname){
		for(var i = 0; i < ArrayArray.length; i++) {
			if(ArrayArray[i][0] == name){
				if(pname == ']'){
					write8(0xAA,0xBD);
					positionArray.push([ArrayArray[i][0],adress]);
					write16(0);
				}
				else{
					write8(0xAD);//lda from adress
					write16(adress+12);
					write8(0x85,0x16);//sta to adress 16
					write8(0xAD);//lda from adress
					write16(adress+8);
					write8(0x85,0x17);//sta to adress 17
					write8(JUMP);//jmp
					write16(adress+4);
					positionArray.push([ArrayArray[i][0],adress]);
					write16(0);
				}
				return true;
			}
		}
		return false;
	}
	
	function saveToArray(name){
		for(var i = 0; i < ArrayArray.length; i++) {
			if(ArrayArray[i][0] == name){
				steckLength--;
				write8(0xA8,0xA5);
				write8(steckLength - 1);
				write8(0xAA,0x98,0x9D);
				positionArray.push([ArrayArray[i][0],adress]);
				write16(0);
				return true;
			}
		}
		return false;
	}
	
	function saveFunction(name, adress, arg){
		bracketArray.push([adress + 1, adress, 'fn']);
		functionsArray.push([name, adress, arg]);
		write8(JUMP);
		write16(0x0000);
	}
	
	function loadFunction(name){
		for(var i = 0; i < functionsArray.length; i++) {
			if(functionsArray[i][0] == name){
				if(functionsArray[i][2].length > 0){
					steckLength--;
					write8(0x48);
					
				}
				for(var j = 1; j < functionsArray[i][2].length; j++){
					steckLength--;
					write8(0xA5);
					write8(steckLength);
					write8(0x48);
				}
				write8(0x20);
				write16(functionsArray[i][1] + 3);
				for(var j = 0; j < functionsArray[i][2].length; j++){
					write8(0x68);
				}
				return true;
			}
		}
		return false;
	}
	
	function getAdress(n){
		for(var i = 0; i < variablesArray.length; i++) {
			if(variablesArray[i][0] == n){
				return variablesArray[i][1];
			}
		}
		for (var i = 0; i < jumpArray.length; i++) {
			if(jumpArray[i][0] == n){
				return jumpArray[i][1];
			}
		}
		error(3, n ,lineCount);
		return 0;
	}
	
	function fontInclude(){
		for(var i = 255 - ((adress + 52) % 256); i >= 0; i--){
			write8(0x00);
		}
		write16toAddr(adressTable,adress - 39);
		write8(0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,50,170,175,180,185,190,45,195,200,205,210,215,220,225,230,235,240,245);
		//    _  (  )  *  +  ,  -  .  /  0  1  2  3  4  5  6  7  8  9  :  ;   <   =   >   ?   @   A   B   C   D   E   F   G   H   I  J   K   L   M   N   O  P   Q   R   S   T   U   V   W   X   Y   Z
		write8toAddr(fontTable,(adress >> 8) & 0xFF);
		write8(0x00,0x00,0x00,0x00,0x00);//
		write8(0x04,0x02,0x02,0x02,0x04);//(
		write8(0x02,0x04,0x04,0x04,0x02);//)
		write8(0x00,0x0A,0x04,0x0A,0x00);//*
		write8(0x00,0x04,0x0E,0x04,0x00);//+
		write8(0x00,0x00,0x00,0x08,0x08);//,
		write8(0x00,0x00,0x0E,0x00,0x00);//-
		write8(0x00,0x00,0x00,0x00,0x08);//.
		write8(0x08,0x04,0x04,0x04,0x02);// /
		write8(0x0E,0x0A,0x0A,0x0A,0x0E);//0
		write8(0x08,0x08,0x08,0x08,0x08);//1
		write8(0x0E,0x08,0x0E,0x02,0x0E);//2
		write8(0x0E,0x08,0x0E,0x08,0x0E);//3
		write8(0x0A,0x0A,0x0E,0x08,0x08);//4
		write8(0x0E,0x02,0x0E,0x08,0x0E);//5
		write8(0x0E,0x02,0x0E,0x0A,0x0E);//6
		write8(0x0E,0x08,0x08,0x08,0x08);//7
		write8(0x0E,0x0A,0x0E,0x0A,0x0E);//8
		write8(0x0E,0x0A,0x0E,0x08,0x0E);//9
		write8(0x00,0x04,0x00,0x04,0x00);//:
		write8(0x00,0x04,0x00,0x04,0x04);//;
		write8(0x00,0x08,0x04,0x08,0x00);//<
		write8(0x00,0x0E,0x00,0x0E,0x00);//=
		write8(0x00,0x04,0x08,0x04,0x00);//>
		write8(0x07,0x04,0x07,0x00,0x01);//?
		write8(0x06,0x09,0x0D,0x01,0x06);//@
		write8(0x04,0x0A,0x0E,0x0A,0x0A);//A
		write8(0x06,0x0A,0x06,0x0A,0x06);//B
		write8(0x04,0x0A,0x02,0x0A,0x04);//C
		write8(0x06,0x0A,0x0A,0x0A,0x06);//D
		write8(0x0E,0x02,0x0E,0x02,0x0E);//E
		write8(0x0E,0x02,0x0E,0x02,0x02);//F
		write8(0x0E,0x01,0x0D,0x09,0x06);//G
		write8(0x0A,0x0A,0x0E,0x0A,0x0A);//H
		write8(0x08,0x08,0x08,0x0A,0x04);//J
		write8(0x0A,0x0A,0x06,0x0A,0x0A);//K
		write8(0x02,0x02,0x02,0x02,0x0E);//L
		write8(0x0F,0x0D,0x09,0x09,0x09);//M
		write8(0x09,0x0B,0x0D,0x09,0x09);//N
		write8(0x0E,0x0A,0x0E,0x02,0x02);//P
		write8(0x06,0x09,0x09,0x05,0x0A);//G
		write8(0x06,0x0A,0x06,0x0A,0x0A);//R
		write8(0x0E,0x01,0x06,0x08,0x07);//S
		write8(0x0E,0x04,0x04,0x04,0x04);//T
		write8(0x09,0x09,0x09,0x09,0x06);//U
		write8(0x0A,0x0A,0x0A,0x04,0x04);//V
		write8(0x09,0x09,0x09,0x0B,0x0F);//W
		write8(0x0A,0x0A,0x04,0x0A,0x0A);//X
		write8(0x0A,0x0A,0x0C,0x08,0x06);//Y
		write8(0x07,0x04,0x02,0x01,0x07);//Z
	}
	
	function calcAddr(){
		var n, i;
		var ramUse = 16;//память для операций
		ramUse += variablesArray.length;
		for(var i = 0; i < variablesArray.length; i++){
			//console.log(variablesArray[i][0] + ':' + variablesArray[i][1]);
			GlobalVariableName.push(variablesArray[i][0]);
		}
		for(i = 0; i < calcAdressArray.length; i++){
			n = getAdress(calcAdressArray[i][1]);
			write16toAddr(calcAdressArray[i][2], n);
		}
		if(adressPrintcFunction > 0){
			fontInclude();
		}
		n = adress;
		//console.log(n);
		//распределяем память для массивов
		for(i = 0;i < ArrayArray.length; i++){
			if(ArrayArray[i][2] == 0)
				ArrayArray[i][2] = n;
			for(var j = 0; j < positionArray.length; j++){
				if(positionArray[j][0] == ArrayArray[i][0])
					write16toAddr(positionArray[j][1], ArrayArray[i][2]);
			}
			if(ArrayArray[i][2] == 0)
				n += ArrayArray[i][1];
		}
		//console.log(GlobalVariableName);
		error(5, ramUse);
		error(9, n - adress);
		//console.log(ArrayArray);
	}
	
	function compile(tokens){
		//console.log(tokens);
		out = [];
		adress = OFFSET;
		adressPlotFunction = 0;
		adressDivideFunction = 0;
		adressPrintcFunction = 0;
		adressBinToBCDFunction = 0;
		adressPrintNumberFunction = 0;
		adressScrollupFunction = 0;
		adressDrawFunction = 0;
		adressLineFunction = 0;
		adressSqrFunction = 0;
		adressSqrtFunction = 0;
		adressReadScreenFunction = 0;
		adressPrintTextFunction = 0;
		calcAdressArray = [];
		variablesArray = [];
		functionsArray = [];
		functionsArgumentBuffer = [];
		varAdress = 0x18;
		lineCount = 0;
		ArrayArray = [];
		positionArray = [];
		jumpArray = [];
		bracketArray = [];
		lastStringEnd = OFFSET;
		steckLength = 0;
		GlobalVariableName = [];
		GlobalVariableName.push(varAdress);
		write8(0xa9, 0x05, 0x85, 0x0e, 0x48, 0xa9, 0xFF, 0x48);//push return adress
		for(var i = 0; i < tokens.length; i++){
			var token = tokens[i];
			switch(token.rang){
				case 1:
					if(token.name[0] == '"'){
						//string
						var newArray = token.name.substring(1, (token.name).length);
						var anonimStringAdress = 0;
						write8(JUMP);
						write16(adress + (newArray.length & 0xFF) + 2);
						if(tokens[i + 1].name == '='){
							ArrayArray.push([tokens[i + 2].name, newArray.length & 0xFF, adress]);
							i += 2;
						}else{
							anonimStringAdress = adress;
						}
						for(var j = 0; j < newArray.length & 0xFF; j++){
							write8(newArray.charCodeAt(j));
						}
						if(anonimStringAdress > 0){
							write8(0xAD);//lda from adress
							write16(adress+12);
							write8(0x85,0x16);//sta to adress 16
							write8(0xAD);//lda from adress
							write16(adress+8);
							write8(0x85,0x17);//sta to adress 17
							write8(JUMP);//jmp
							write16(adress+4);
							write16(anonimStringAdress);
						}
					}
					else if(token.name[0] == '{'){
						var newArray = token.name.substring(1, (token.name).length - 1).split(',');
						write8(JUMP);
						write16(adress + (newArray.length & 0xFF) + 2);
						if(tokens[i + 1].name == '='){
							ArrayArray.push([tokens[i + 2].name, newArray.length & 0xFF, adress]);
							i += 2;
						}
						for(var j = 0; j < newArray.length & 0xFF; j++){
							write8(newArray[j]);
						}
					}
					else{
						//загрузка числа в регистр А
						if(steckLength > 0){
							write8(STA);
							write8(steckLength - 1);
						}
						write8(LDA);
						write8(token.name);
						steckLength++;
					}
					break;
				case 2:
					switch(token.name){
						case 'input':
							if(steckLength > 0){
								write8(STA);
								write8(steckLength - 1);
							}
							write8(0xAD, 0xF9, 0xFF);
							steckLength++;
							break;
						case 'output':
							write8(0x8D, 0xF8, 0xFF);
							steckLength--;
							break;
						case 'gettimer':
							if(steckLength > 0){
								write8(STA);
								write8(steckLength - 1);
							}
							write8(0xA5, 0xFC);
							steckLength++;
							break;
						case 'settimer':
							write8(STA, 0xFC);
							steckLength--;
							break;
						case 'setcolor':
							write8(STA, 0x0e);
							steckLength--;
							break;
						case 'setbackgroundcolor':
							write8(STA, 0x0f);
							steckLength--;
							break;
						case 'delay':
							steckLength--;
							write8(0x85, 0xfc, 0xa5, 0xfc, 0xc9, 0x00, 0xd0, 0xfa);
							break;
						case 'getkey':
							if(steckLength > 0){
								write8(STA);
								write8(steckLength - 1);
							}
							write8(0xA5, 0xFF);
							write8(0xA2, 0x00);
							write8(0x86, 0xFF);
							steckLength++;
							break;
						case 'random':
							if(steckLength > 0){
								write8(STA);
								write8(steckLength - 1);
							}
							write8(0xA5, 0xFE);
							steckLength++;
							break;
						case 'print':
							if(adressPlotFunction == 0)
								includePlot();
							if(adressPrintcFunction == 0)
								includePrintc();
							if(steckLength == 3){
								if(adressBinToBCDFunction == 0)
									includeBinToBCD();
								if(adressPrintNumberFunction == 0)
									includePrintNumber();
								steckLength--;
								write8(0x48, 0xA5);//save x to stack
								steckLength--;
								write8(steckLength);
								write8(0x48, 0xA5);//save y to stack
								steckLength--;
								write8(steckLength);
								write8(0x20);
								write16(adressBinToBCDFunction);
								write8(0x68, 0xA8, 0x68, 0xAA);//load from stack x and y
								write8(0x20);
								write16(adressPlotFunction);
								write8(0x20);
								write16(adressPrintNumberFunction);
							}else{
								if(adressPrintTextFunction == 0)
									includePrintText();
								//setY
								steckLength--;
								write8(0xAA);//tax
								//setX
								steckLength--;
								write8(0xA4);//ldy
								write8(0x00);
								write8(0x20);
								write16(adressPlotFunction);
								write8(0x20);
								write16(adressPrintTextFunction);
							}
							break;
						case 'printc':
							if(adressPlotFunction == 0)
								includePlot();
							if(adressPrintcFunction == 0)
								includePrintc();
							//setY
							steckLength--;
							write8(0xAA);//tax
							//setX
							steckLength--;
							write8(0xA4);//ldy
							write8(steckLength);
							//plot
							steckLength--;
							write8(0xA5);
							write8(steckLength);
							write8(0x20);
							write16(adressPlotFunction);
							//выводим букву на экран
							write8(0x20);
							write16(adressPrintcFunction);
							break;
						case 'plot':
							if(adressPlotFunction == 0)
								includePlot();
							//setY
							steckLength--;
							write8(0xAA);
							//setX
							steckLength--;
							write8(0xA4);
							write8(steckLength);
							//plot
							if(steckLength > 0){
								steckLength--;
								write8(0xA5);
								write8(steckLength);
							}
							else{
								write8(0xA5);
								write8(0x0e);
							}
							write8(0x20);
							write16(adressPlotFunction);
							//выводим точку на экран
							write8(0x91, 0x0A);
							break;
						case 'getpixel':
							if(adressPlotFunction == 0)
								includePlot();
							//setY
							steckLength--;
							write8(0xAA);
							//setX
							steckLength--;
							write8(0xA4);
							write8(steckLength);
							write8(0x20);
							write16(adressPlotFunction);
							//загружаем точку
							write8(0xB1, 0x0A);
							steckLength++;
							break;
						case 'drawsprite':
							if(adressPlotFunction == 0)
								includePlot();
							if(adressDrawFunction == 0)
								includeDraw();
							if(steckLength == 5){
								//set offset
								steckLength--;
								write8(0x18, 0x65, 0x16, 0x85, 0x16, 0xa9, 0x00, 0x65, 0x17, 0x85, 0x17);
								//setY
								steckLength--;
								write8(0xA6);
								write8(steckLength);
							}
							else{
								//setY
								steckLength--;
								write8(0xAA);
							}
							//setX
							steckLength--;
							write8(0xA4);
							write8(steckLength);
							//plot
							write8(0x20);
							write16(adressPlotFunction);
							//setHeight
							steckLength--;
							write8(0xA6);
							write8(steckLength);
							//setWidth
							steckLength--;
							write8(0x20);
							write16(adressDrawFunction);
							break;
						case 'drawline':
							if(adressPlotFunction == 0)
								includePlot();
						    if(adressLineFunction == 0)
								includeLine();
							steckLength-=4;
							write8(STA);
							write8(0x03);
							write8(0x20);
							write16(adressLineFunction);
							break;
						case 'screentosprite':
							if(adressPlotFunction == 0)
								includePlot();
							if(adressReadScreenFunction == 0)
								includeReadScreen();
							//setY
							steckLength--;
							write8(0xAA);
							//setX
							steckLength--;
							write8(0xA4);
							write8(steckLength);
							//plot
							write8(0x20);
							write16(adressPlotFunction);
							//setHeight
							steckLength--;
							write8(0xA6);
							write8(steckLength);
							//setWidth
							steckLength--;
							write8(0x20);
							write16(adressReadScreenFunction);
							break;
						case 'cls':
							if(steckLength > 0)
								steckLength--;
							else
								write8(0xA5,0x0f);
							write8(0xA2,0x00);
							write8(0x9D,0x00,0x02);
							write8(0x9D,0x00,0x03);
							write8(0x9D,0x00,0x04);
							write8(0x9D,0x00,0x05);
							write8(0xE8,0xE0,0x00,0xD0,0xEF);
							break;
						case 'scrollup':
							if(adressScrollupFunction == 0)
								includeScrollup();
							steckLength--;
							write8(0xAA);
							write8(0x20);
							write16(adressScrollupFunction);
							write8(0xCA, 0xE0, 0x00, 0xD0, 0xF8);
							break;
						case 'scrollleft':
							write8(0xa2 ,0x00 ,0xbd ,0x01 ,0x02 ,0x9d ,0x00 ,0x02 ,0xbd ,0x01 ,0x03 ,0x9d ,0x00 ,0x03 ,0xbd ,0x01);
							write8(0x04 ,0x9d ,0x00 ,0x04 ,0xbd ,0x01 ,0x05 ,0x9d ,0x00 ,0x05 ,0xe8 ,0xe0 ,0x00 ,0xd0 ,0xe3);
							write8(0xad ,0xfe ,0x05 ,0x8d ,0xff ,0x05);
							break;
						case 'scrollright':
							write8(0xA2 ,0xFF ,0xbd ,0x00 ,0x02 ,0x9d ,0x01 ,0x02 ,0xbd ,0x00 ,0x03 ,0x9d ,0x01 ,0x03 ,0xbd ,0x00);
							write8(0x04 ,0x9d ,0x01 ,0x04 ,0xbd ,0x00 ,0x05 ,0x9d ,0x01 ,0x05 ,0xCA ,0xe0 ,0x00 ,0xd0 ,0xe3 ,0xad);
							write8(0x01 ,0x02 ,0x8d ,0x00 ,0x02);
							break;
						case 'sqr':
							if(adressSqrFunction == 0)
								includeSqr();
							write8(0x20);
							write16(adressSqrFunction);
							break;
						case 'sqrt':
							if(adressSqrtFunction == 0)
								includeSqrt();
							write8(0x20);
							write16(adressSqrtFunction);
							break;
						case'max':
							steckLength--;
							write8(0xC5);
							write8(steckLength - 1);
							write8(0xB0, 0x02, 0xA5);
							write8(steckLength - 1);
							break;
						case'min':
							steckLength--;
							write8(0xC5);
							write8(steckLength - 1);
							write8(0x90, 0x02, 0xA5);
							write8(steckLength - 1);
							break;
						case 'goto':
							break;
						case 'if':
							steckLength--;
							write8(0xC9, 0x00);//сравниваем с 0
							write8(0xD0, 0x03);//если равно нулю, переходим на 3 шагa вперед
							break;
						case 'while':
							steckLength--;
							write8(0xC9, 0x00);//сравниваем с 0
							write8(0xD0, 0x03);//если равно нулю, переходим на 3 шагa вперед
							break;
						case 'return':
							write8(RTS);
							break;
						case 'function':
							if(tokens[i + 1].name == '=' && tokens[i + 3].name == '{'){
								saveFunction(tokens[i + 2].name, adress, functionsArgumentBuffer);
								i+=3;
							}
							else
								error(8, tokens[i + 2].name ,lineCount);
							break;
						default:
							if(!(loadVar(token.name) || loadFunction(token.name) || loadFromArray(token.name,tokens[i - 1].name))){
								if(tokens[i + 1].name == "goto")
									loadJmp(token.name);
								else
									error(3, token.name ,lineCount);
							}
					}
					break;
				case 3:
					var a = out[out.length -1].charCodeAt(0);
					steckLength--;
					if(token.name == '+'){
						write8(CLC , ADC);
						write8(steckLength-1);
					}
					else if(token.name == '-'){
						write8(STA);
						write8(steckLength);
						write8(0xA5);
						write8(steckLength - 1);
						write8(0x38, 0xE5);
						write8(steckLength);
					}
					else if(token.name == '&'){
						write8(0x25);
						write8(steckLength - 1);
						}
					else if(token.name == '|'){
						write8(0x05);
						write8(steckLength - 1);
						}
					else if(token.name == '^'){
						write8(0x45);
						write8(steckLength - 1);
						}
					else if(token.name == '&&'){
						write8(0xA2,0x01,0xC9,0x00,0xd0,0x02,0xa2,0x00,0xa5);
						write8(steckLength - 1);
						write8(0xc9,0x00,0xd0,0x02,0xA2,0x00,0x8a);
					}
					else if(token.name == '||'){
						write8(0xA2,0x01,0xC9,0x00,0xd0,0x08,0xa5);
						write8(steckLength - 1);
						write8(0xc9,0x00,0xd0,0x02,0xA2,0x00,0x8a);
					}
					else if(token.name == '=='){
						write8(0xA2,0x01,0xC5);
						write8(steckLength - 1);
						write8(0xF0,0x02,0xA2,0x00,0x8A);
					}
					else if(token.name == '!='){
						write8(0xA2,0x01,0xC5);
						write8(steckLength - 1);
						write8(0xD0,0x02,0xA2,0x00,0x8A);
					}
					else if(token.name == '>'){
						write8(0xA2,0x01,0xC5);
						write8(steckLength - 1);
						write8(0x90,0x02,0xA2,0x00,0x8A);
					}
					else if(token.name == '>='){
						write8(0xA2,0x00,0xC5);
						write8(steckLength - 1);
						write8(0xF0,0x02);//если равно
						write8(0x10,0x02,0xA2,0x01,0x8A);
					}
					else if(token.name == '<'){
						write8(0xA2,0x01,0xC5);
						write8(steckLength - 1);
						write8(0xF0,0x02);//если равно
						write8(0x10,0x02,0xA2,0x00,0x8A);
					}
					else if(token.name == '<='){
						write8(0xA2,0x00,0xC5);
						write8(steckLength - 1);
						write8(0x90,0x02,0xA2,0x01,0x8A);
					}
					else if(token.name == '++'){
						if(tokens[i-2].name == ']')
							write8toAddr(adress - 3,0xFE);
						else
							write8toAddr(adress - 2,0xE6);
					}
					else if(token.name == '--'){
						if(tokens[i-2].name == ']')
							write8toAddr(adress - 3,0xDE);
						else
							write8toAddr(adress - 2,0xC6);
					}
					else if(token.name == '<<'){
						write8(0xAA,0xA5);
						write8(steckLength - 1);
						write8(0xE0,0x00,0xF0,0x06,0xCA,0x18,0x2A,0x18,0xD0,0xF6);
					}
					else if(token.name == '>>'){
						write8(0xAA,0xA5);
						write8(steckLength - 1);
						write8(0xE0,0x00,0xF0,0x06,0xCA,0x18,0x6A,0x18,0xD0,0xF6);
					}
					break;
				case 4:
					var a = out[out.length -1].charCodeAt(0);
					steckLength--;
					if(token.name == '*'){
						write8(STA);
						write8(steckLength);
						write8(0xA9, 0x00, 0xF0, 0x05, 0x18, 0x65);
						write8(steckLength - 1);
						write8(0x06);
						write8(steckLength - 1);
						write8(0x46);
						write8(steckLength);
						write8(0xB0, 0xF7, 0xD0, 0xF8);
					}
					else if(token.name == '/'){
						if(adressDivideFunction == 0)
							includeDivide();
						write8(0xC9, 0x00, 0xF0, 0x08);
						//загружаем делимое в А, делитель в #$a
						write8(0x85, 0x0A, 0xA5);
						write8(steckLength - 1);
						//прыгаем в функцию
						write8(0x20);
						write8(0xFF & adressDivideFunction);//устанавливаем младший бит адреса
						write8((0xFF00 & adressDivideFunction) >> 8);//устанавливаем старший бит адреса
						//загружаем результат в регистр А
						write8(0x8A);
					}
					else if(token.name == '%'){
						if(adressDivideFunction == 0)
							includeDivide();
						write8(0xC9, 0x00, 0xF0, 0x08);
						//загружаем делимое в А, делитель в #$a
						write8(0x85, 0x0A, 0xA5);
						write8(steckLength - 1);
						//прыгаем в функцию
						write8(0x20);
						write8(0xFF & adressDivideFunction);//устанавливаем младший бит адреса
						write8((0xFF00 & adressDivideFunction) >> 8);//устанавливаем старший бит адреса
						//загружаем результат в регистр А
						write8(0xA6, 0x0A);
					}
					break;
				case 6:
					if(token.name == '='){
						i++;
						if(!saveToArray(tokens[i].name))
							saveVar(tokens[i].name);
						steckLength--;
					}
					break;
				case 8:
					if(token.name == '{'){
						var op = 'if';
						if(i > 0 && tokens[i - 1].name == 'while')
							op = 'wh';
						write8(JUMP);
						bracketArray.push([adress, lastStringEnd, op]);
						write16(0x00000);
					}else if(token.name == '}'){
						var buf = bracketArray.pop();
						if(buf[2] == 'wh'){
							write8(JUMP);
							write16(buf[1]);							
						}	
						else if(buf[2] == 'fn'){
							write8(RTS);	
						}
						write16toAddr(buf[0], adress);
					}
					if(token.name == ';' || token.name == '{' || token.name == '}'){
						lastStringEnd = adress;
						if(steckLength != 0){
							//console.log(steckLength);
							steckLength = 0;
							error(7,0,lineCount);
						}
					}
					break;
				case 11:
					jumpArray.push([token.name,adress]);
					break;
				case 12:
					if(tokens[i + 2].rang == 13 && tokens[i + 4].rang == 8){
						ArrayArray.push([tokens[i + 3].name, (parseInt(tokens[i + 1].name,10) & 0xFF), 0]);
						i += 4;
					}
					break;
				case 15:
					lineCount++;
					break;
				case 21:
					var j=0;
					functionsArgumentBuffer = [];
					while(tokens[i + j + 1].name != 'function'){
						if(tokens[i + j + 1].name != ',')
							functionsArgumentBuffer.push(tokens[i + j + 1].name);
						j++;
					}
					i = i + j;
					break;
			}
		}
		if(bracketArray.length>0)
			error(4);
		calcAddr();
		return out.join('');
	}
	
	return {compile:compile};
}
