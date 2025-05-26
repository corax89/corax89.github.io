
const DEFAULT_SIZE = 100; // Фиксированный размер 100x100 пикселей

class FieldPng extends Blockly.Field {
    constructor(value, validator, config) {
        super(value, validator, config);
        
        this.SERIALIZABLE = true;
        this.CURSOR = 'pointer';
        this.value_ = value || null;
        this.boundEvents = [];
        
        // Фиксированные размеры поля
        this.size_ = new Blockly.utils.Size(DEFAULT_SIZE, DEFAULT_SIZE);
    }

    static fromJson(options) {
        return new this(options.value || null, undefined, options);
    }

    doClassValidation_(newValue) {
        if (!newValue) return null;
        if (typeof newValue !== 'string') return null;
        if (!newValue.startsWith('data:image')) return null;
        return newValue;
    }

    render_() {
        super.render_();
        
        // Очищаем SVG элемент
        while (this.fieldGroup_.firstChild) {
            this.fieldGroup_.removeChild(this.fieldGroup_.firstChild);
        }
        
        if (this.value_) {
            // Отображаем изображение
            Blockly.utils.dom.createSvgElement('image', {
                'width': DEFAULT_SIZE,
                'height': DEFAULT_SIZE,
                'href': this.value_,
                'preserveAspectRatio': 'xMidYMid meet'
            }, this.fieldGroup_);
        } else {
            // Отображаем пустое поле
            Blockly.utils.dom.createSvgElement('rect', {
                'width': DEFAULT_SIZE,
                'height': DEFAULT_SIZE,
                'fill': '#fff',
                'stroke': '#000',
                'stroke-width': 1
            }, this.fieldGroup_);
        }
    }

    showEditor_() {
        const div = Blockly.DropDownDiv.getContentDiv();
        div.style.padding = '20px';
        div.innerHTML = ''; // Очищаем содержимое
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png';
        fileInput.style.display = 'none';
        
        const button = document.createElement('button');
        button.textContent = Blockly.Msg['BUTTON_LABEL_UPLOAD'];
        button.className = 'blocklyPngUploadButton';
        
        button.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        div.appendChild(button);
        div.appendChild(fileInput);
        
        Blockly.DropDownDiv.setColour('#fff', '#ddd');
        Blockly.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_, this.disposeUploader.bind(this));
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.setValue(e.target.result);
                Blockly.DropDownDiv.hide();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    disposeUploader() {
        // Очищаем обработчики событий
        for (const event of this.boundEvents) {
            Blockly.browserEvents.unbind(event);
        }
        this.boundEvents = [];
    }

    updateSize_() {
        // Всегда возвращаем фиксированный размер
        this.size_.width = DEFAULT_SIZE;
        this.size_.height = DEFAULT_SIZE;
    }
}

Blockly.fieldRegistry.register('field_png', FieldPng);

Blockly.Css.register(`
.blocklyPngUploadButton {
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: sans-serif;
  font-size: 14px;
}

.blocklyPngUploadButton:hover {
  background-color: #3367d6;
}
`);