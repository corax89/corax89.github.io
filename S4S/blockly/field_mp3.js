Blockly.Msg['BUTTON_LABEL_UPLOAD_MP3'] = 'Загрузить MP3';
const DEFAULT_WIDTH_MP3 = 200;
const DEFAULT_HEIGHT_MP3 = 60;

class FieldMp3 extends Blockly.Field {
    constructor(value, validator, config) {
        super(value, validator, config);
        this.SERIALIZABLE = true;
        this.CURSOR = 'pointer';
        this.value_ = value || null;
        this.audioElement = null;
        this.isPlaying = false;
        this.size_ = new Blockly.utils.Size(DEFAULT_WIDTH_MP3, DEFAULT_HEIGHT_MP3);
    }

    static fromJson(options) {
        return new this(options.value || null, undefined, options);
    }

    doClassValidation_(newValue) {
        if (!newValue) return null;
        if (typeof newValue !== 'string') return null;
        if (!newValue.startsWith('data:audio')) return null;
        return newValue;
    }

    render_() {
        super.render_();
        
        // Полностью очищаем содержимое
        this.fieldGroup_.innerHTML = '';
        
        // Создаем основную группу
        const group = Blockly.utils.dom.createSvgElement('g', {}, this.fieldGroup_);
        
        // Фоновый прямоугольник с фиксированными размерами
        Blockly.utils.dom.createSvgElement('rect', {
            'width': DEFAULT_WIDTH_MP3,
            'height': DEFAULT_HEIGHT_MP3,
            'fill': '#f5f5f5',
            'stroke': '#ccc',
            'stroke-width': 1,
            'rx': 4,
            'ry': 4
        }, group);

        if (this.value_) {
            // Кнопка воспроизведения (40x40 для лучшего клика)
            const btnSize = 40;
            const btnX = 10;
            const btnY = (DEFAULT_HEIGHT_MP3 - btnSize) / 2;
            
            // Группа для кнопки
            const btnGroup = Blockly.utils.dom.createSvgElement('g', {
                'cursor': 'pointer',
                'transform': `translate(${btnX}, ${btnY})`
            }, group);
            
            // Фон кнопки
            Blockly.utils.dom.createSvgElement('rect', {
                'width': btnSize,
                'height': btnSize,
                'fill': '#4285f4',
                'rx': 4,
                'ry': 4
            }, btnGroup);
            
            // Иконка play/pause
            if (this.isPlaying) {
                // Пауза (две вертикальные линии)
                Blockly.utils.dom.createSvgElement('rect', {
                    'x': 10,
                    'y': 10,
                    'width': 6,
                    'height': 20,
                    'fill': '#fff'
                }, btnGroup);
                
                Blockly.utils.dom.createSvgElement('rect', {
                    'x': 24,
                    'y': 10,
                    'width': 6,
                    'height': 20,
                    'fill': '#fff'
                }, btnGroup);
            } else {
                // Play (треугольник)
                Blockly.utils.dom.createSvgElement('path', {
                    'd': 'M 15 10 L 35 20 L 15 30 Z',
                    'fill': '#fff'
                }, btnGroup);
            }
            
            // Текст "Аудио"
            Blockly.utils.dom.createSvgElement('text', {
                'x': btnX + btnSize + 15,
                'y': btnY + btnSize/2 + 7,
                'fill': '#333',
                'font-family': 'sans-serif',
                'font-size': '14px',
                'dominant-baseline': 'middle'
            }, group).textContent = 'Аудио';
            
            // Обработчик клика
            Blockly.browserEvents.bind(btnGroup, 'click', (e) => {
                this.togglePlay();
                e.stopPropagation();
            });
        } else {
            // Текст для загрузки
            Blockly.utils.dom.createSvgElement('text', {
                'x': DEFAULT_WIDTH_MP3 / 2,
                'y': DEFAULT_HEIGHT_MP3 / 2,
                'fill': '#888',
                'font-family': 'sans-serif',
                'font-size': '14px',
                'text-anchor': 'middle',
                'dominant-baseline': 'middle'
            }, group).textContent = Blockly.Msg['BUTTON_LABEL_UPLOAD_MP3'];
        }
        
        // Принудительно обновляем размеры
        this.updateSize_();
    }

    showEditor_() {
        const div = Blockly.DropDownDiv.getContentDiv();
        div.innerHTML = `
            <button class="blocklyMp3UploadButton">
                ${Blockly.Msg['BUTTON_LABEL_UPLOAD_MP3']}
            </button>
            <input type="file" accept="audio/mp3" style="display:none">
        `;
        
        const button = div.querySelector('button');
        const fileInput = div.querySelector('input');
        
        button.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.setValue(e.target.result);
                Blockly.DropDownDiv.hide();
            };
            reader.readAsDataURL(file);
        };
        
        Blockly.DropDownDiv.setColour('#fff', '#ddd');
        Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_, () => {});
    }

    togglePlay() {
        if (!this.audioElement && this.value_) {
            this.audioElement = new Audio(this.value_);
            this.audioElement.onended = () => {
                this.isPlaying = false;
                this.render_();
            };
        }
        
        if (this.audioElement) {
            if (this.isPlaying) {
                this.audioElement.pause();
            } else {
                this.audioElement.play().catch(e => console.error(e));
            }
            this.isPlaying = !this.isPlaying;
            this.render_();
        }
    }
    
    updateSize_() {
        // Явно устанавливаем фиксированные размеры
        this.size_.width = DEFAULT_WIDTH_MP3;
        this.size_.height = DEFAULT_HEIGHT_MP3;
        
        // Принудительно обновляем блок
        if (this.sourceBlock_ && this.sourceBlock_.rendered) {
            this.sourceBlock_.queueRender();
        }
    }
}

Blockly.fieldRegistry.register('field_mp3', FieldMp3);

Blockly.Css.register(`
.blocklyMp3UploadButton {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: sans-serif;
  font-size: 14px;
  margin: 10px;
}

.blocklyMp3UploadButton:hover {
  background-color: #3367d6;
}
`);