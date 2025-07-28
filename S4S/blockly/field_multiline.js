/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Multiline text input field with syntax highlighting and code completion for Game object.
 */
class FieldMultilineInput extends Blockly.FieldTextInput {
    constructor(value, validator, config) {
        super(Blockly.Field.SKIP_SETUP);
        this.textGroup = null;
        this.maxLines_ = Infinity;
        this.isOverflowedY_ = false;
        this.highlightEnabled_ = true;
        this.completionEnabled_ = true;
        this.completionPopup_ = null;
        this.completionItems_ = [];
        this.currentCompletionIndex_ = -1;
		this.onFocusOutBound_ = this.onFocusOut_.bind(this);

        if (value === Blockly.Field.SKIP_SETUP) return;
        if (config) {
            this.configure_(config);
        }
        this.setValue(value);
        if (validator) {
            this.setValidator(validator);
        }
		
		this.completionItems_ = Blockly.Msg["LOCALE"] === "EN" ? [
			{ name: 'addObject', args: ['name: string', 'x: number', 'y: number', 'width: number', 'height: number', 'sprite: number'], description: 'Creates a new game object' },
			{ name: 'addObjectsFromArray', args: ['objectsArray: array'], description: 'Adds objects from array' },
			{ name: 'addTouchButton', args: ['id: string', 'x: number', 'y: number', 'width: number', 'height: number', 'keyCode: string'], description: 'Adds a touch button' },
			{ name: 'alert', args: ['message: string', 'title: string', 'showCancel: boolean', 'primaryBtnText: string'], description: 'Shows a modal dialog' },
			{ name: 'changeTileInXY', args: ['x: number', 'y: number', 'tileId: number', 'isSolid: boolean'], description: 'Changes tile at grid coordinates' },
			{ name: 'checkCollision', args: ['obj1: object', 'obj2: object'], description: 'Checks collision between objects' },
			{ name: 'checkTileCollision', args: ['obj: object'], description: 'Checks collision between object and tiles' },
			{ name: 'clearInterval', args: ['timerId: number'], description: 'Clears interval' },
			{ name: 'clearTimeout', args: ['timerId: number'], description: 'Clears timeout' },
			{ name: 'collision', args: ['x1: number', 'y1: number', 'width1: number', 'height1: number', 'x2: number', 'y2: number', 'width2: number', 'height2: number'], description: 'Checks rectangle collision' },
			{ name: 'copyState', args: ['source: object', 'target: object'], description: 'Copies object state' },
			{ name: 'debug', args: ['obj: any'], description: 'Logs object to console' },
			{ name: 'distance', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number'], description: 'Calculates distance between points' },
			{ name: 'exitScreen', args: ['obj: object'], description: 'Checks if object exited screen bounds' },
			{ name: 'getAxes', args: ['axis: number', 'deviceId: number'], description: 'Returns gamepad axis state' },
			{ name: 'getJoystickCount', args: [], description: 'Returns number of connected gamepads' },
			{ name: 'getKey', args: ['key: string', 'deviceId: number'], description: 'Checks key press' },
			{ name: 'getKeyPress', args: ['key: string', 'deviceId: number'], description: 'Checks single key press' },
			{ name: 'getMemory', args: [], description: 'Returns approximate memory usage' },
			{ name: 'getScreenX', args: [], description: 'Returns camera X position' },
			{ name: 'getScreenY', args: [], description: 'Returns camera Y position' },
			{ name: 'getTileAt', args: ['x: number', 'y: number'], description: 'Returns tile at coordinates' },
			{ name: 'getTileInXY', args: ['x: number', 'y: number'], description: 'Returns tile at grid coordinates' },
			{ name: 'isPaused', args: [], description: 'Checks if game is paused' },
			{ name: 'isTileSolid', args: ['x: number', 'y: number'], description: 'Checks if tile is solid' },
			{ name: 'load', args: ['name: string'], description: 'Loads data from localStorage' },
			{ name: 'mirrorObject', args: ['obj: object'], description: 'Creates object copy' },
			{ name: 'objectDeserialize', args: ['value: any', 'target: object', 'seenObjects: array', 'seenValues: array'], description: 'Deserializes object' },
			{ name: 'objectSerialize', args: ['obj: object', 'depth: number'], description: 'Serializes object' },
			{ name: 'pause', args: [], description: 'Pauses the game' },
			{ name: 'play_music', args: ['melodyString: string', 'bpm: number'], description: 'Plays melody' },
			{ name: 'play_sound', args: ['id: number'], description: 'Plays sound' },
			{ name: 'removeObject', args: ['obj: object'], description: 'Removes game object' },
			{ name: 'reset', args: [], description: 'Resets game state' },
			{ name: 'resume', args: [], description: 'Resumes the game' },
			{ name: 'save', args: ['name: string', 'value: string'], description: 'Saves data to localStorage' },
			{ name: 'setBackground', args: ['sprite: number', 'mode: number'], description: 'Sets background image' },
			{ name: 'setBackgroundXY', args: ['x: number', 'y: number'], description: 'Sets background position' },
			{ name: 'setGravity', args: ['value: number'], description: 'Sets gravity' },
			{ name: 'setInterval', args: ['callback: function', 'interval: number'], description: 'Sets interval' },
			{ name: 'setScreenX', args: ['x: number'], description: 'Sets camera X position' },
			{ name: 'setScreenY', args: ['y: number'], description: 'Sets camera Y position' },
			{ name: 'setTimeout', args: ['callback: function', 'delay: number'], description: 'Sets timeout' },
			{ name: 'setTileFromArray', args: ['tileArray: array'], description: 'Loads tiles from array' },
			{ name: 'setTileImage', args: ['spriteNumber: number'], description: 'Sets image for tiles' },
			{ name: 'setVelocityTowards', args: ['obj: object', 'x: number', 'y: number', 'speed: number'], description: 'Moves object towards point with given speed' },
			{ name: 'vibrate', args: ['duration: number', 'weakMagnitude: number', 'strongMagnitude: number'], description: 'Triggers vibration' }
		].sort((a, b) => a.name.localeCompare(b.name)) : [
			{ name: 'addObject', args: ['name: string', 'x: number', 'y: number', 'width: number', 'height: number', 'sprite: number'], description: 'Создает новый игровой объект' },
			{ name: 'addObjectsFromArray', args: ['objectsArray: array'], description: 'Добавляет объекты из массива' },
			{ name: 'addTouchButton', args: ['id: string', 'x: number', 'y: number', 'width: number', 'height: number', 'keyCode: string'], description: 'Добавляет сенсорную кнопку' },
			{ name: 'alert', args: ['message: string', 'title: string', 'showCancel: boolean', 'primaryBtnText: string'], description: 'Показывает модальное окно' },
			{ name: 'changeTileInXY', args: ['x: number', 'y: number', 'tileId: number', 'isSolid: boolean'], description: 'Изменяет тайл в координатах сетки' },
			{ name: 'checkCollision', args: ['obj1: object', 'obj2: object'], description: 'Проверяет столкновение объектов' },
			{ name: 'checkTileCollision', args: ['obj: object'], description: 'Проверяет столкновение объекта с тайлами' },
			{ name: 'clearInterval', args: ['timerId: number'], description: 'Очищает интервал' },
			{ name: 'clearTimeout', args: ['timerId: number'], description: 'Очищает таймер' },
			{ name: 'collision', args: ['x1: number', 'y1: number', 'width1: number', 'height1: number', 'x2: number', 'y2: number', 'width2: number', 'height2: number'], description: 'Проверяет столкновение прямоугольников' },
			{ name: 'copyState', args: ['source: object', 'target: object'], description: 'Копирует состояние объекта' },
			{ name: 'debug', args: ['obj: any'], description: 'Выводит объект в консоль' },
			{ name: 'distance', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number'], description: 'Вычисляет расстояние между точками' },
			{ name: 'exitScreen', args: ['obj: object'], description: 'Проверяет, вышел ли объект за границы экрана' },
			{ name: 'getAxes', args: ['axis: number', 'deviceId: number'], description: 'Возвращает состояние осей геймпада' },
			{ name: 'getJoystickCount', args: [], description: 'Возвращает количество подключенных геймпадов' },
			{ name: 'getKey', args: ['key: string', 'deviceId: number'], description: 'Проверяет нажатие клавиши' },
			{ name: 'getKeyPress', args: ['key: string', 'deviceId: number'], description: 'Проверяет однократное нажатие клавиши' },
			{ name: 'getMemory', args: [], description: 'Возвращает примерное использование памяти' },
			{ name: 'getScreenX', args: [], description: 'Возвращает позицию камеры по X' },
			{ name: 'getScreenY', args: [], description: 'Возвращает позицию камеры по Y' },
			{ name: 'getTileAt', args: ['x: number', 'y: number'], description: 'Возвращает тайл по координатам' },
			{ name: 'getTileInXY', args: ['x: number', 'y: number'], description: 'Возвращает тайл по координатам сетки' },
			{ name: 'isPaused', args: [], description: 'Проверяет, находится ли игра в состоянии паузы' },
			{ name: 'isTileSolid', args: ['x: number', 'y: number'], description: 'Проверяет, является ли тайл твердым' },
			{ name: 'load', args: ['name: string'], description: 'Загружает данные из localStorage' },
			{ name: 'mirrorObject', args: ['obj: object'], description: 'Создает копию объекта' },
			{ name: 'objectDeserialize', args: ['value: any', 'target: object', 'seenObjects: array', 'seenValues: array'], description: 'Десериализует объект' },
			{ name: 'objectSerialize', args: ['obj: object', 'depth: number'], description: 'Сериализует объект' },
			{ name: 'pause', args: [], description: 'Приостанавливает игру' },
			{ name: 'play_music', args: ['melodyString: string', 'bpm: number'], description: 'Воспроизводит мелодию' },
			{ name: 'play_sound', args: ['id: number'], description: 'Воспроизводит звук' },
			{ name: 'removeObject', args: ['obj: object'], description: 'Удаляет игровой объект' },
			{ name: 'reset', args: [], description: 'Сбрасывает состояние игры' },
			{ name: 'resume', args: [], description: 'Возобновляет игру' },
			{ name: 'save', args: ['name: string', 'value: string'], description: 'Сохраняет данные в localStorage' },
			{ name: 'setBackground', args: ['sprite: number', 'mode: number'], description: 'Устанавливает фоновое изображение' },
			{ name: 'setBackgroundXY', args: ['x: number', 'y: number'], description: 'Устанавливает позицию фона' },
			{ name: 'setGravity', args: ['value: number'], description: 'Устанавливает гравитацию' },
			{ name: 'setInterval', args: ['callback: function', 'interval: number'], description: 'Устанавливает интервал' },
			{ name: 'setScreenX', args: ['x: number'], description: 'Устанавливает позицию камеры по X' },
			{ name: 'setScreenY', args: ['y: number'], description: 'Устанавливает позицию камеры по Y' },
			{ name: 'setTimeout', args: ['callback: function', 'delay: number'], description: 'Устанавливает таймер' },
			{ name: 'setTileFromArray', args: ['tileArray: array'], description: 'Загружает тайлы из массива' },
			{ name: 'setTileImage', args: ['spriteNumber: number'], description: 'Устанавливает изображение для тайлов' },
			{ name: 'setVelocityTowards', args: ['obj: object', 'x: number', 'y: number', 'speed: number'], description: 'Направляет объект к точке с заданной скоростью' },
			{ name: 'vibrate', args: ['duration: number', 'weakMagnitude: number', 'strongMagnitude: number'], description: 'Запускает вибрацию' }
		].sort((a, b) => a.name.localeCompare(b.name));

		this.drawCompletionItems_ = Blockly.Msg["LOCALE"] === "EN" ? [
			{ name: 'loadImage', args: ['index: number', 'url: string'], description: 'Loads image at specified index' },
			{ name: 'text', args: ['x: number', 'y: number', 'size: number', 'color: string', 'text: string'], description: 'Draws text on screen' },
			{ name: 'plot', args: ['x: number', 'y: number', 'color: string'], description: 'Draws a point (1 pixel)' },
			{ name: 'line', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'color: string'], description: 'Draws a line' },
			{ name: 'triangle', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'x3: number', 'y3: number', 'color: string'], description: 'Draws triangle outline' },
			{ name: 'filledTriangle', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'x3: number', 'y3: number', 'color: string'], description: 'Draws filled triangle' },
			{ name: 'rect', args: ['x: number', 'y: number', 'width: number', 'height: number', 'color: string'], description: 'Draws rectangle outline' },
			{ name: 'filledRect', args: ['x: number', 'y: number', 'width: number', 'height: number', 'color: string'], description: 'Draws filled rectangle' },
			{ name: 'sprite', args: ['sprite: array', 'x: number', 'y: number', 'size: number', 'color: string'], description: 'Draws sprite from array' },
			{ name: 'clear_screen', args: ['color: string'], description: 'Clears screen with specified color' }
		].sort((a, b) => a.name.localeCompare(b.name)) : [
			{ name: 'loadImage', args: ['index: number', 'url: string'], description: 'Загружает изображение по указанному индексу' },
			{ name: 'text', args: ['x: number', 'y: number', 'size: number', 'color: string', 'text: string'], description: 'Рисует текст на экране' },
			{ name: 'plot', args: ['x: number', 'y: number', 'color: string'], description: 'Рисует точку (1 пиксель)' },
			{ name: 'line', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'color: string'], description: 'Рисует линию' },
			{ name: 'triangle', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'x3: number', 'y3: number', 'color: string'], description: 'Рисует контур треугольника' },
			{ name: 'filledTriangle', args: ['x1: number', 'y1: number', 'x2: number', 'y2: number', 'x3: number', 'y3: number', 'color: string'], description: 'Рисует закрашенный треугольник' },
			{ name: 'rect', args: ['x: number', 'y: number', 'width: number', 'height: number', 'color: string'], description: 'Рисует контур прямоугольника' },
			{ name: 'filledRect', args: ['x: number', 'y: number', 'width: number', 'height: number', 'color: string'], description: 'Рисует закрашенный прямоугольник' },
			{ name: 'sprite', args: ['sprite: array', 'x: number', 'y: number', 'size: number', 'color: string'], description: 'Рисует спрайт из массива' },
			{ name: 'clear_screen', args: ['color: string'], description: 'Очищает экран указанным цветом' }
		].sort((a, b) => a.name.localeCompare(b.name));
    }

    configure_(config) {
        super.configure_(config);
        if (config.maxLines) this.setMaxLines(config.maxLines);
        if (config.highlightEnabled !== undefined) {
            this.setHighlightEnabled(config.highlightEnabled);
        }
        if (config.completionEnabled !== undefined) {
            this.setCompletionEnabled(config.completionEnabled);
        }
    }

    setHighlightEnabled(enabled) {
        if (this.highlightEnabled_ === enabled) return;
        this.highlightEnabled_ = enabled;
        this.forceRerender();
    }

    isHighlightEnabled() {
        return this.highlightEnabled_;
    }

    setCompletionEnabled(enabled) {
        if (this.completionEnabled_ === enabled) return;
        this.completionEnabled_ = enabled;
    }

    isCompletionEnabled() {
        return this.completionEnabled_;
    }

    initView() {
        this.createBorderRect_();
        this.textGroup = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {
            class: 'blocklyEditableText',
        }, this.fieldGroup_);
    }

    getDisplayText_() {
        const block = this.getSourceBlock();
        if (!block) {
            throw new Error('The field has not yet been attached to its input.');
        }

        let textLines = this.getText();
        if (!textLines) {
            return Blockly.Field.NBSP;
        }

        const lines = textLines.split('\n');
        textLines = '';
        const displayLinesNumber = this.isOverflowedY_ ? this.maxLines_ : lines.length;

        for (let i = 0; i < displayLinesNumber; i++) {
            let text = lines[i];
            if (text.length > this.maxDisplayLength) {
                text = text.substring(0, this.maxDisplayLength - 4) + '...';
            } else if (this.isOverflowedY_ && i === displayLinesNumber - 1) {
                text = text.substring(0, text.length - 3) + '...';
            }
            textLines += text;
            if (i !== displayLinesNumber - 1) {
                textLines += '\n';
            }
        }

        if (block.RTL) {
            textLines += '\u200F';
        }
        return textLines;
    }

    doValueUpdate_(newValue) {
        super.doValueUpdate_(newValue);
        if (this.value_ !== null) {
            this.isOverflowedY_ = this.value_.split('\n').length > this.maxLines_;
        }
    }

    render_() {
        const block = this.getSourceBlock();
        if (!block) {
            throw new Error('The field has not yet been attached to its input.');
        }

        while (this.textGroup.firstChild) {
            this.textGroup.removeChild(this.textGroup.firstChild);
        }

        const constants = this.getConstants();
        if (!constants) throw Error('Constants not found');

        const displayText = this.getDisplayText_() || '';
        const lines = displayText.split('\n');
        let y = 0;

        if (this.highlightEnabled_ && !this.isBeingEdited_) {
            for (let i = 0; i < lines.length; i++) {
                const lineHeight = constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
                const textElement = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.TEXT, {
                    class: 'blocklyText blocklyMultilineText',
                    x: constants.FIELD_BORDER_RECT_X_PADDING,
                    y: y + constants.FIELD_BORDER_RECT_Y_PADDING,
                    dy: constants.FIELD_TEXT_BASELINE,
                }, this.textGroup);

                if (lines[i]) {
                    const fragments = this.highlightCode(lines[i]);
                    this.renderHighlightedLine(textElement, fragments);
                }
                y += lineHeight;
            }
        } else {
            for (let i = 0; i < lines.length; i++) {
                const lineHeight = constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
                const textElement = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.TEXT, {
                    class: 'blocklyText blocklyMultilineText',
                    x: constants.FIELD_BORDER_RECT_X_PADDING,
                    y: y + constants.FIELD_BORDER_RECT_Y_PADDING,
                    dy: constants.FIELD_TEXT_BASELINE,
                }, this.textGroup);

                if (lines[i]) {
                    textElement.appendChild(document.createTextNode(lines[i]));
                }
                y += lineHeight;
            }
        }

        this.updateSize_();
    }

    highlightCode(code) {
        const tokenStyles = {
            'comment': 'fill:#5a7d4a;font-style:italic;',
            'string': 'fill:#b35730;',
            'keyword': 'fill:#3a6ea5;font-weight:bold;',
            'number': 'fill:#7a9c6a;',
            'operator': 'fill:#5e5e5e;',
            'default': 'fill:#333333;',
            'object': 'fill:#6a3da5;font-weight:bold;',
            'method': 'fill:#3a6ea5;'
        };

        const tokenTypes = [
            { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g },
            { type: 'string', regex: /("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)/g },
            { type: 'keyword', regex: /\b(function|if|else|for|while|return|var|let|const|new|this|true|false|null|undefined|try|catch|finally|throw|class|extends|export|import|default)\b/g },
            { type: 'number', regex: /\b\d+\.?\d*\b/g },
            { type: 'operator', regex: /([{}()[\];,.:=<>+\-*/%&|^~!?])/g },
            { type: 'object', regex: /\b(Game|Draw|Math)\b/g },
            { type: 'method', regex: /\.(\w+)\b/g }
        ];

        const tokens = [];
        let lastIndex = 0;

        tokenTypes.forEach(({ type, regex }) => {
            let match;
            regex.lastIndex = 0;
            while ((match = regex.exec(code)) !== null) {
                if (match.index >= lastIndex) {
                    tokens.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        type,
                        text: match[0],
                        style: tokenStyles[type]
                    });
                }
            }
        });

        tokens.sort((a, b) => a.start - b.start);

        const fragments = [];
        let currentPos = 0;

        for (const token of tokens) {
            if (token.start > currentPos) {
                fragments.push({
                    text: code.substring(currentPos, token.start),
                    style: null
                });
            }
            if (token.start < currentPos) continue;
            
            fragments.push({
                text: token.text,
                style: token.style
            });
            currentPos = token.end;
        }

        if (currentPos < code.length) {
            fragments.push({
                text: code.substring(currentPos),
                style: null
            });
        }

        return fragments;
    }

    renderHighlightedLine(parentElement, fragments) {
        parentElement.setAttribute('style', 'fill:#333333;');
        
        fragments.forEach(fragment => {
            if (fragment.style) {
                const tspan = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.TSPAN, {
                    'style': fragment.style
                }, parentElement);
                tspan.appendChild(document.createTextNode(fragment.text));
            } else {
                parentElement.appendChild(document.createTextNode(fragment.text));
            }
        });
    }

    updateSize_() {
        const constants = this.getConstants();
        if (!constants) throw Error('Constants not found');

        const nodes = this.textGroup.childNodes;
        const fontSize = constants.FIELD_TEXT_FONTSIZE;
        const fontWeight = constants.FIELD_TEXT_FONTWEIGHT;
        const fontFamily = constants.FIELD_TEXT_FONTFAMILY;

        let totalWidth = 0;
        let totalHeight = 0;

        for (let i = 0; i < nodes.length; i++) {
            const tspan = nodes[i];
            const textWidth = Blockly.utils.dom.getFastTextWidth(tspan, fontSize, fontWeight, fontFamily);
            if (textWidth > totalWidth) {
                totalWidth = textWidth;
            }
            totalHeight += constants.FIELD_TEXT_HEIGHT + 
                (i > 0 ? constants.FIELD_BORDER_RECT_Y_PADDING : 0);
        }

        if (this.isBeingEdited_) {
            const actualLines = String(this.value_).split('\n');
            const dummyText = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.TEXT, {
                class: 'blocklyText blocklyMultilineText'
            });

            for (let i = 0; i < actualLines.length; i++) {
                const line = actualLines[i].length > this.maxDisplayLength ? 
                    actualLines[i].substring(0, this.maxDisplayLength) : actualLines[i];
                dummyText.textContent = line;
                const lineWidth = Blockly.utils.dom.getFastTextWidth(dummyText, fontSize, fontWeight, fontFamily);
                if (lineWidth > totalWidth) {
                    totalWidth = lineWidth;
                }
            }

            if (this.htmlInput_) {
                const scrollbarWidth = this.htmlInput_.offsetWidth - this.htmlInput_.clientWidth;
                totalWidth += scrollbarWidth;
            }
        }

        if (this.borderRect_) {
            totalHeight += constants.FIELD_BORDER_RECT_Y_PADDING * 2;
            totalWidth += constants.FIELD_BORDER_RECT_X_PADDING * 2 + 1;
            this.borderRect_.setAttribute('width', `${totalWidth}`);
            this.borderRect_.setAttribute('height', `${totalHeight}`);
        }

        this.size_.width = totalWidth;
        this.size_.height = totalHeight;
        this.positionBorderRect_();
    }

    widgetCreate_(quietInput) {
        const div = Blockly.WidgetDiv.getDiv();
        const scale = this.workspace_.getScale();
        const constants = this.getConstants();
        if (!constants) throw Error('Constants not found');

        const htmlInput = document.createElement('textarea');
        htmlInput.className = 'blocklyHtmlInput blocklyHtmlTextAreaInput';
        htmlInput.setAttribute('spellcheck', String(this.spellcheck_));

        const fontSize = constants.FIELD_TEXT_FONTSIZE * scale + 'pt';
        const lineHeight = constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
        const borderRadius = Blockly.FieldTextInput.BORDERRADIUS * scale + 'px';
        const paddingX = constants.FIELD_BORDER_RECT_X_PADDING * scale;
        const paddingY = (constants.FIELD_BORDER_RECT_Y_PADDING * scale) / 2;

        htmlInput.style.fontSize = fontSize;
        htmlInput.style.width = '100%';
        htmlInput.style.height = '100%';
        htmlInput.style.borderRadius = borderRadius;
        htmlInput.style.padding = `${paddingY}px ${paddingX}px ${paddingY}px ${paddingX}px`;
        htmlInput.style.lineHeight = lineHeight * scale + 'px';
        htmlInput.style.overflowX = 'hidden';
        htmlInput.style.overflowY = 'hidden';
        htmlInput.style.whiteSpace = 'pre-wrap';
        htmlInput.style.wordWrap = 'break-word';

        this.fiveLinesHeight_ = lineHeight * scale * 5;

        const editorText = this.getEditorText_(this.value_);
        htmlInput.value = htmlInput.defaultValue = editorText;
        htmlInput.setAttribute('data-untyped-default-value', String(this.value_));
        htmlInput.setAttribute('data-old-value', '');

        const checkScrollNeeded = () => {
            const needScroll = htmlInput.scrollHeight > this.fiveLinesHeight_;
            htmlInput.style.overflowY = needScroll ? 'auto' : 'hidden';
            
            if (!needScroll) {
                htmlInput.style.height = '100%';
            }
        };

        htmlInput.addEventListener('input', checkScrollNeeded);
        htmlInput.addEventListener('focus', checkScrollNeeded);

        setTimeout(checkScrollNeeded, 0);

        div.appendChild(htmlInput);

        if (!quietInput) {
            htmlInput.focus();
            htmlInput.select();
        }

        this.bindInputEvents_(htmlInput);
        
        // Добавляем обработчики для автозавершения кода
        if (this.completionEnabled_) {
            htmlInput.addEventListener('input', this.handleInput_.bind(this));
            htmlInput.addEventListener('keydown', this.handleKeyDown_.bind(this));
            // Добавляем обработчик потери фокуса
            htmlInput.addEventListener('blur', this.onFocusOutBound_);
        }
        
        return htmlInput;
    }
	
	onFocusOut_() {
        // Убираем меню подсказок при потере фокуса
        this.hideCompletionPopup();
    }
	
	dispose() {
        // Убираем обработчики при уничтожении поля
        if (this.htmlInput_) {
            this.htmlInput_.removeEventListener('blur', this.onFocusOutBound_);
        }
        super.dispose();
    }

    handleInput_(e) {
		if (!this.htmlInput_) return;
		
		const input = this.htmlInput_;
		const cursorPos = input.selectionStart;
		const textBeforeCursor = input.value.substring(0, cursorPos);
		
		// Проверяем, нужно ли показать автозавершение для Game
		if (textBeforeCursor.endsWith('Game.')) {
			this.showCompletionPopup(input, cursorPos, this.completionItems_); // Changed from gameCompletionItems_
		} 
		// Проверяем, нужно ли показать автозавершение для Draw
		else if (textBeforeCursor.endsWith('Draw.')) {
			this.showCompletionPopup(input, cursorPos, this.drawCompletionItems_);
		}
		// Если вводится Game. + буква (например Game.r)
		else if (textBeforeCursor.match(/Game\.\w$/)) {
			const lastChar = textBeforeCursor.slice(-1).toLowerCase();
			const filteredItems = this.completionItems_.filter(item => // Changed from gameCompletionItems_
				item.name.toLowerCase().startsWith(lastChar)
			);
			this.showCompletionPopup(input, cursorPos, filteredItems);
		}
		// Если вводится Draw. + буква (например Draw.r)
		else if (textBeforeCursor.match(/Draw\.\w$/)) {
			const lastChar = textBeforeCursor.slice(-1).toLowerCase();
			const filteredItems = this.drawCompletionItems_.filter(item => 
				item.name.toLowerCase().startsWith(lastChar)
			);
			this.showCompletionPopup(input, cursorPos, filteredItems);
		}
		else if (this.completionPopup_) {
			this.hideCompletionPopup();
		}
	}

    handleKeyDown_(e) {
        if (!this.completionPopup_) return;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.navigateCompletion(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateCompletion(1);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.applyCompletion();
                break;
            case 'Escape':
                this.hideCompletionPopup();
                break;
        }
    }

    showCompletionPopup(input, cursorPos, itemsToShow = null) {
		this.hideCompletionPopup();
    
		const items = itemsToShow || this.completionItems_;
		if (items.length === 0) return;
		
		// Сохраняем, какие подсказки показываем
		this.currentCompletionSource_ = items === this.drawCompletionItems_ ? 'draw' : 'game';
        
        // Создаем popup
        this.completionPopup_ = document.createElement('div');
        this.completionPopup_.className = 'blocklyCompletionPopup';
        
        // Добавляем элементы автозавершения
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'blocklyCompletionItem';
            if (index === 0) itemElement.classList.add('blocklyCompletionItemSelected');
            
            itemElement.innerHTML = `
                <span class="blocklyCompletionMethod">${item.name}</span>
                <span class="blocklyCompletionArgs">(${item.args.join(', ')})</span>
                <span class="blocklyCompletionDescription"> - ${item.description}</span>
            `;
            
            itemElement.addEventListener('click', () => {
                this.currentCompletionIndex_ = index;
                this.applyCompletion();
            });
            
            this.completionPopup_.appendChild(itemElement);
        });
        
        // Позиционируем popup
        const rect = input.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        this.completionPopup_.style.position = 'absolute';
        this.completionPopup_.style.left = `${rect.left + scrollLeft}px`;
        this.completionPopup_.style.top = `${rect.bottom + scrollTop}px`;
        this.completionPopup_.style.zIndex = '1000';
        this.completionPopup_.style.maxHeight = '200px';
        this.completionPopup_.style.overflowY = 'auto';
        this.completionPopup_.style.backgroundColor = '#fff';
        this.completionPopup_.style.border = '1px solid #ccc';
        this.completionPopup_.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        this.completionPopup_.style.padding = '4px 0';
        
        document.body.appendChild(this.completionPopup_);
        this.currentCompletionIndex_ = 0;
    }

    hideCompletionPopup() {
        if (this.completionPopup_) {
            document.body.removeChild(this.completionPopup_);
            this.completionPopup_ = null;
            this.currentCompletionIndex_ = -1;
        }
    }

    navigateCompletion(direction) {
        if (!this.completionPopup_ || this.completionItems_.length === 0) return;
        
        const items = this.completionPopup_.querySelectorAll('.blocklyCompletionItem');
        items[this.currentCompletionIndex_].classList.remove('blocklyCompletionItemSelected');
        
        this.currentCompletionIndex_ += direction;
        
        if (this.currentCompletionIndex_ < 0) {
            this.currentCompletionIndex_ = items.length - 1;
        } else if (this.currentCompletionIndex_ >= items.length) {
            this.currentCompletionIndex_ = 0;
        }
        
        items[this.currentCompletionIndex_].classList.add('blocklyCompletionItemSelected');
        items[this.currentCompletionIndex_].scrollIntoView({ block: 'nearest' });
    }

    applyCompletion() {
		if (!this.completionPopup_ || this.currentCompletionIndex_ === -1) return;
		
		const input = this.htmlInput_;
		const cursorPos = input.selectionStart;
		const textBeforeCursor = input.value.substring(0, cursorPos);
		
		// Определяем, какой массив использовать (Game или Draw)
		let itemsArray;
		let prefix;
		
		if (textBeforeCursor.includes('Draw.')) {
			itemsArray = this.drawCompletionItems_;
			prefix = 'Draw.';
		} else {
			itemsArray = this.completionItems_;
			prefix = 'Game.';
		}
		
		// Проверяем, что itemsArray существует и содержит элементы
		if (!itemsArray || itemsArray.length === 0) {
			this.hideCompletionPopup();
			return;
		}
		
		// Получаем выбранный элемент
		const selectedItem = itemsArray[this.currentCompletionIndex_];
		if (!selectedItem) {
			this.hideCompletionPopup();
			return;
		}
		
		// Находим позицию после префикса (Game. или Draw.)
		const prefixPos = textBeforeCursor.lastIndexOf(prefix);
		if (prefixPos === -1) {
			this.hideCompletionPopup();
			return;
		}
		
		const insertPos = prefixPos + prefix.length;
		
		// Заменяем текст
		input.value = 
			input.value.substring(0, insertPos) + 
			selectedItem.name + 
			(selectedItem.args.length > 0 ? '()' : '') + 
			input.value.substring(cursorPos);
			
		// Устанавливаем курсор внутри скобок, если есть аргументы
		const newCursorPos = insertPos + selectedItem.name.length + 
			(selectedItem.args.length > 0 ? 1 : 0);
		
		input.setSelectionRange(newCursorPos, newCursorPos);
		this.hideCompletionPopup();
		
		// Триггерим событие input для обновления
		const event = new Event('input', { bubbles: true });
		input.dispatchEvent(event);
	}

    showEditor_(e, quietInput) {
        super.showEditor_(e, quietInput);
        this.forceRerender();
    }

    onHtmlInputKeyDown_(e) {
        if (e.key !== 'Enter') {
            super.onHtmlInputKeyDown_(e);
        }
    }

    setMaxLines(maxLines) {
        if (typeof maxLines === 'number' && maxLines > 0 && maxLines !== this.maxLines_) {
            this.maxLines_ = maxLines;
            this.forceRerender();
        }
    }

    getMaxLines() {
        return this.maxLines_;
    }

    static fromJson(options) {
        const text = Blockly.utils.parsing.replaceMessageReferences(options.text);
        return new this(text, undefined, options);
    }
}

Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput);

Blockly.Css.register(`
.blocklyHtmlTextAreaInput {
  font-family: monospace;
  resize: none;
  min-height: 100%;
  box-sizing: border-box;
  text-align: left;
}

.blocklyHtmlTextAreaInput:focus {
  outline: none;
  border: 1px solid #5c9eff;
}

.blocklyText.blocklyMultilineText {
  font-family: monospace;
  white-space: pre;
}

.blocklyCompletionPopup {
  font-family: monospace;
  font-size: 12px;
}

.blocklyCompletionItem {
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
}

.blocklyCompletionItemSelected {
  background-color: #e0e0e0;
}

.blocklyCompletionMethod {
  color: #3a6ea5;
  font-weight: bold;
}

.blocklyCompletionArgs {
  color: #5e5e5e;
}

.blocklyCompletionDescription {
  color: #666;
}
`);