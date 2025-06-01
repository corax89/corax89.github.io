/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Multiline text input field with syntax highlighting in block view only.
 */
class FieldMultilineInput extends Blockly.FieldTextInput {
    constructor(value, validator, config) {
        super(Blockly.Field.SKIP_SETUP);
        this.textGroup = null;
        this.maxLines_ = Infinity;
        this.isOverflowedY_ = false;
        this.highlightEnabled_ = true;

        if (value === Blockly.Field.SKIP_SETUP) return;
        if (config) {
            this.configure_(config);
        }
        this.setValue(value);
        if (validator) {
            this.setValidator(validator);
        }
    }

    configure_(config) {
        super.configure_(config);
        if (config.maxLines) this.setMaxLines(config.maxLines);
        if (config.highlightEnabled !== undefined) {
            this.setHighlightEnabled(config.highlightEnabled);
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

		// Добавляем проверку на пустое значение
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

				// Добавляем проверку на пустую строку
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

    /**
     * Улучшенная функция подсветки кода для блока
     */
    highlightCode(code) {
		const tokenStyles = {
			'comment': 'fill:#5a7d4a;font-style:italic;',        // Темно-зеленый
			'string': 'fill:#b35730;',                          // Теплый коричнево-красный
			'keyword': 'fill:#3a6ea5;font-weight:bold;',        // Насыщенный синий
			'number': 'fill:#7a9c6a;',                          // Приглушенный зеленый
			'operator': 'fill:#5e5e5e;',                        // Темно-серый
			'default': 'fill:#333333;'                          // Основной цвет текста
		};

		const tokenTypes = [
			{ type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/)/g },
			{ type: 'string', regex: /("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)/g },
			{ type: 'keyword', regex: /\b(function|if|else|for|while|return|var|let|const|new|this|true|false|null|undefined|try|catch|finally|throw|class|extends|export|import|default)\b/g },
			{ type: 'number', regex: /\b\d+\.?\d*\b/g },
			{ type: 'operator', regex: /([{}()[\];,.:=<>+\-*/%&|^~!?])/g }
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
		// Устанавливаем цвет по умолчанию для основного текста
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

		// Создаем textarea
		const htmlInput = document.createElement('textarea');
		htmlInput.className = 'blocklyHtmlInput blocklyHtmlTextAreaInput';
		htmlInput.setAttribute('spellcheck', String(this.spellcheck_));

		// Настройки стилей
		const fontSize = constants.FIELD_TEXT_FONTSIZE * scale + 'pt';
		const lineHeight = constants.FIELD_TEXT_HEIGHT + constants.FIELD_BORDER_RECT_Y_PADDING;
		const borderRadius = Blockly.FieldTextInput.BORDERRADIUS * scale + 'px';
		const paddingX = constants.FIELD_BORDER_RECT_X_PADDING * scale;
		const paddingY = (constants.FIELD_BORDER_RECT_Y_PADDING * scale) / 2;

		// Основные стили
		htmlInput.style.fontSize = fontSize;
		htmlInput.style.width = '100%';
		htmlInput.style.height = '100%';
		htmlInput.style.borderRadius = borderRadius;
		htmlInput.style.padding = `${paddingY}px ${paddingX}px ${paddingY}px ${paddingX}px`;
		htmlInput.style.lineHeight = lineHeight * scale + 'px';
		
		// Настройки скролла
		htmlInput.style.overflowX = 'hidden';
		htmlInput.style.overflowY = 'hidden'; // По умолчанию скрыт
		htmlInput.style.whiteSpace = 'pre-wrap';
		htmlInput.style.wordWrap = 'break-word';

		// Вычисляем высоту 5 строк
		this.fiveLinesHeight_ = lineHeight * scale * 5;

		// Устанавливаем текст
		const editorText = this.getEditorText_(this.value_);
		htmlInput.value = htmlInput.defaultValue = editorText;
		htmlInput.setAttribute('data-untyped-default-value', String(this.value_));
		htmlInput.setAttribute('data-old-value', '');

		// Функция проверки необходимости скролла
		const checkScrollNeeded = () => {
			const needScroll = htmlInput.scrollHeight > this.fiveLinesHeight_;
			htmlInput.style.overflowY = needScroll ? 'auto' : 'hidden';
			
			// Корректируем высоту если нужно
			if (!needScroll) {
				htmlInput.style.height = '100%';
			}
		};

		// Обработчики событий
		htmlInput.addEventListener('input', checkScrollNeeded);
		htmlInput.addEventListener('focus', checkScrollNeeded);

		// Инициализация при создании
		setTimeout(checkScrollNeeded, 0);

		// Добавляем в DOM
		div.appendChild(htmlInput);

		if (!quietInput) {
			htmlInput.focus();
			htmlInput.select();
		}

		this.bindInputEvents_(htmlInput);
		return htmlInput;
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

// Регистрируем поле
Blockly.fieldRegistry.register('field_multilinetext', FieldMultilineInput);

// Добавляем CSS стили
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
`);