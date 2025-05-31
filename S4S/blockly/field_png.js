/**
 * Advanced Image Editor Field for Blockly with support for any image size
 */
class FieldImageEditor extends Blockly.Field {
  constructor(value, validator, config) {
    super(value, validator, config);
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
    this.value_ = value || '';
    this.size_ = new Blockly.utils.Size(32, 32);
    
    // Editor configuration
    this.editorConfig = {
      maxCanvasWidth: 1280,
      maxCanvasHeight: 1280,
      minZoom: 0.1,
      maxZoom: 10,
      zoomStep: 0.1,
      checkerboardSize: 16,
      colors: [
        '#2c0000', '#580000', '#850000', '#b10000', '#de0000', '#ff0000', '#ff4d4d', '#ff9999',
        '#331900', '#663300', '#994d00', '#cc6600', '#ff8000', '#ff9933', '#ffb366', '#ffcc99',
        '#332500', '#664b00', '#997200', '#cc9900', '#ffbf00', '#ffcc33', '#ffd966', '#ffe599',
        '#002c00', '#005800', '#008500', '#00b100', '#00de00', '#00ff00', '#4dff4d', '#99ff99',
        '#002c2c', '#005858', '#008585', '#00b1b1', '#00dede', '#00ffff', '#4dffff', '#99ffff',
        '#00002c', '#000058', '#000085', '#0000b1', '#0000de', '#0000ff', '#4d4dff', '#9999ff',
        '#1a002c', '#330058', '#4d0085', '#6600b1', '#8000de', '#9900ff', '#b34dff', '#cc99ff',
        '#2c001a', '#580033', '#85004d', '#b10066', '#de0080', '#ff0099', '#ff4db3', '#ff99cc',
        '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#b3b3b3', '#ffffff',
        'transparent'
      ]
    };

    // Add styles to the document head
    this.addStyles_();
    this.updateSize_();
  }
  
  doValueUpdate_(newValue) {
	  if (newValue === this.value_) {
		return; // Ничего не изменилось
	  }
	  this.value_ = newValue; // Явное обновление значения
	  super.doValueUpdate_(newValue);
	  
	  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
		Blockly.Events.fire(new Blockly.Events.BlockChange(
		  this.sourceBlock_, 'IMAGE', null, this.value_
		));
	  }
	}

  addStyles_() {
    const style = document.createElement('style');
    style.textContent = `
      .checkerboard {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%);
        background-size: ${this.editorConfig.checkerboardSize}px ${this.editorConfig.checkerboardSize}px;
        background-position: 0 0, 0 ${this.editorConfig.checkerboardSize/2}px, ${this.editorConfig.checkerboardSize/2}px -${this.editorConfig.checkerboardSize/2}px, -${this.editorConfig.checkerboardSize/2}px 0;
        pointer-events: none;
        z-index: 0;
      }
      
      #editor-canvas {
        border: 2px solid #111;
        position: relative;
        z-index: 1;
        background-color: transparent !important;
      }
	  #editor-canvas-container {
		touch-action: pan-y; /* Разрешаем вертикальную прокрутку */
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	  }
      .image-editor-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: hsla(0, 0%, 0%, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .editor-container {
        background: white;
        padding: 5px;
        border-radius: 12px;
        width: 90%;
        max-width: 1200px;
        max-height: 95vh;
        overflow: auto;
        box-shadow: 0 10px 30px hsla(0, 0%, 0%, 0.3);
		overscroll-behavior: contain; /* Предотвращает "подпрыгивание" при прокрутке */
		scrollbar-width: thin; /* Для Firefox */
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
      }
	 .editor-container::-webkit-scrollbar {
		width: 5px;
	  }
	  
	  .editor-container::-webkit-scrollbar-thumb {
		background-color: rgba(0,0,0,0.2);
		border-radius: 10px;
	  }
      .editor-title {
        text-align: center;
        margin-bottom: 2px;
        color: hsl(210, 11%, 20%);
      }

      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .editor-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .zoom-controls {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .zoom-value {
        min-width: 40px;
        text-align: center;
      }

      .tools {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 2px;
        align-items: center;
		justify-content: space-around;
      }

      .tool-buttons {
        display: flex;
        gap: 5px;
        margin-right: 10px;
      }

      .tool-btn {
        padding: 8px 12px;
        border: 2px solid hsl(210, 11%, 85%);
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tool-btn i {
        font-size: 16px;
      }

      .tool-btn.active {
        background: hsl(217, 89%, 61%);
        color: white;
        border-color: hsl(217, 89%, 61%);
      }

      .tool-btn:hover:not(.active) {
        background: hsl(210, 11%, 95%);
      }

      .brush-size {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .brush-size input[type="range"] {
        width: 80px;
      }

      .size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .size-input {
        width: 50px;
        text-align: center;
      }

      .palette {
        display: grid;
        grid-template-columns: repeat(28, 1fr);
        gap: 0px;
        margin-bottom: 2px;
        padding: 10px;
        background: hsl(210, 11%, 98%);
        border-radius: 6px;
      }

      .color {
        width: 24px;
        height: 24px;
        border: 2px solid hsl(210, 11%, 85%);
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.2s ease;
      }

      .color:hover {
        transform: scale(1.1);
        border-color: hsl(210, 11%, 60%);
      }

      .color.selected {
        border-color: hsl(217, 89%, 61%);
        transform: scale(1.1);
      }

      .canvas-wrapper {
        position: relative;
        overflow: hidden;
        border: 2px solid hsl(210, 11%, 85%);
        border-radius: 8px;
        margin-bottom: 2px;
      }

      #editor-canvas-container {
        position: relative;
        width: 100%;
        height: 600px;
        overflow: hidden;
      }

      #editor-canvas {
        position: absolute;
        top: 0;
        left: 0;
        cursor: crosshair;
        image-rendering: pixelated;
        background: white;
      }

      .action-buttons {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .button-group {
        display: flex;
        gap: 10px;
      }

      .action-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: hsl(217, 89%, 61%);
        color: white;
      }

      .btn-primary:hover {
        background: hsl(217, 89%, 55%);
      }

      .btn-success {
        background: hsl(122, 39%, 49%);
        color: white;
      }

      .btn-success:hover {
        background: hsl(122, 39%, 43%);
      }

      .btn-warning {
        background: hsl(45, 100%, 51%);
        color: hsl(0, 0%, 20%);
      }

      .btn-warning:hover {
        background: hsl(45, 100%, 45%);
      }

      .btn-secondary {
        background: hsl(210, 11%, 71%);
        color: hsl(0, 0%, 20%);
      }

      .btn-secondary:hover {
        background: hsl(210, 11%, 65%);
      }

	  .history-buttons{
		display: contents;
	  }

      .history-buttons button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 768px) {
        .editor-container {
          width: 95%;
          padding: 5px;
        }
        
        .editor-header {
          flex-direction: column;
          align-items: stretch;
        }
        
        .tools {
          justify-content: center;
        }
        
        .action-buttons {
          justify-content: center;
        }
        
        .palette {
          grid-template-columns: repeat(8, 1fr);
        }
        
        .tool-btn {
		  padding: 12px 16px;
		  font-size: 16px;
		}
		
		.action-btn {
		  padding: 12px 24px;
		  font-size: 16px;
		}
		
		.editor-container {
		  max-height: 85vh;
		  overflow-y: auto;
		}
		
		#editor-canvas-container {
		  height: 60vh;
		}
		
		.brush-size input[type="range"] {
		  width: 100px;
		}
      }
    `;
    document.head.appendChild(style);
  }

  static fromJson(options) {
    return new FieldImageEditor(options['value'], undefined, options);
  }

  doClassValidation_(newValue) {
    if (newValue === null || newValue === '') return '';
    if (typeof newValue !== 'string') return null;
    if (!newValue.startsWith('data:image')) return null;
    return newValue;
  }

  render_() {
    this.createBorderRect_();
    this.createTextElement_();
    
    if (!this.fieldGroup_) {
      this.fieldGroup_ = Blockly.utils.dom.createSvgElement(
        'g',
        {},
        null
      );
    } else {
      this.fieldGroup_.innerHTML = '';
    }
    
    // Create checkerboard pattern for transparency
    const defs = Blockly.utils.dom.createSvgElement(
      'defs',
      {},
      this.fieldGroup_
    );
    
    const patternId = 'checkerboard-' + Math.random().toString(36).substr(2, 9);
    const pattern = Blockly.utils.dom.createSvgElement(
      'pattern',
      {
        'id': patternId,
        'x': '0',
        'y': '0',
        'width': '10',
        'height': '10',
        'patternUnits': 'userSpaceOnUse'
      },
      defs
    );
    
    const rect1 = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'x': '0',
        'y': '0',
        'width': '5',
        'height': '5',
        'fill': '#fff'
      },
      pattern
    );
    
    const rect2 = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'x': '5',
        'y': '5',
        'width': '5',
        'height': '5',
        'fill': '#fff'
      },
      pattern
    );
    
    const rect3 = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'x': '0',
        'y': '5',
        'width': '5',
        'height': '5',
        'fill': '#ddd'
      },
      pattern
    );
    
    const rect4 = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'x': '5',
        'y': '0',
        'width': '5',
        'height': '5',
        'fill': '#ddd'
      },
      pattern
    );
    
    const container = Blockly.utils.dom.createSvgElement(
      'svg',
      {
        'width': this.size_.width,
        'height': this.size_.height,
        'viewBox': `0 0 ${this.size_.width} ${this.size_.height}`
      },
      this.fieldGroup_
    );
    
    // Background with checkerboard pattern
    const background = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'width': '100%',
        'height': '100%',
        'fill': `url(#${patternId})`,
        'stroke': '#000',
        'stroke-width': '1'
      },
      container
    );
    
    if (this.value_) {
      const image = Blockly.utils.dom.createSvgElement(
        'image',
        {
          'width': this.size_.width,
          'height': this.size_.height,
          'href': this.value_,
          'preserveAspectRatio': 'none'
        },
        container
      );
    } else {
      const text = Blockly.utils.dom.createSvgElement(
        'text',
        {
          'x': '50%',
          'y': '50%',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'fill': '#888',
          'font-size': '12'
        },
        container
      );
      text.textContent = Blockly.Msg['CLICK_TO_EDIT'];
    }
    
    this.updateSize_();
  }

  updateSize_() {
    this.size_.width = 64;
    this.size_.height = 64;
  }

  showEditor_() {
    const modal = this.createEditorModal_();
    document.body.appendChild(modal);
    this.initializeEditor_(modal);
  }

  createEditorModal_() {
    const modal = document.createElement('div');
    modal.className = 'image-editor-modal';
    
    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    
    // Add Font Awesome for icons
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
    
    editorContainer.innerHTML = `
      <div class="tools">
        <div class="tool-buttons">
          <button id="brush-btn" class="tool-btn active" title="${Blockly.Msg['IMAGE_BRUSH']}"><i class="fas fa-paint-brush"></i></button>
          <button id="line-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_LINE']}"><i class="fas fa-slash"></i></button>
          <button id="eraser-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_ERASER']}"><i class="fas fa-eraser"></i></button>
          <button id="fill-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_FILL']}"><i class="fas fa-fill-drip"></i></button>
          <button id="clear-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_CLEAR']}"><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="brush-size">
          <span><i class="fas fa-ruler-horizontal"></i></span>
          <input type="range" id="brush-size" min="1" max="16" value="1">
          <span id="brush-size-value">1</span>
        </div>
        <div class="size-controls">
          <span><i class="fas fa-expand"></i></span>
          <input type="number" id="width-input" class="size-input" min="1" max="1280" placeholder="Width">
          <span>x</span>
          <input type="number" id="height-input" class="size-input" min="1" max="1280" placeholder="Height">
          <button id="resize-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_RESIZE']}"><i class="fas fa-check"></i></button>
        </div>
        <div class="history-buttons">
          <button id="undo-btn" class="tool-btn" disabled title="${Blockly.Msg['IMAGE_UNDO']}"><i class="fas fa-undo"></i></button>
          <button id="redo-btn" class="tool-btn" disabled title="${Blockly.Msg['IMAGE_REDO']}"><i class="fas fa-redo"></i></button>
        </div>
        <div class="editor-controls">
          <div class="zoom-controls">
            <button id="zoom-out-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_ZOOM_OUT']}"><i class="fas fa-search-minus"></i></button>
            <span class="zoom-value">100%</span>
            <button id="zoom-in-btn" class="tool-btn" title="${Blockly.Msg['ZOOM_IN']}"><i class="fas fa-search-plus"></i></button>
            <button id="reset-view-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_RESET_VIEW']}"><i class="fas fa-expand-arrows-alt"></i></button>
          </div>
        </div>
      </div>
      
      <div id="palette" class="palette"></div>
      
      <div class="canvas-wrapper">
        <div id="editor-canvas-container">
          <canvas id="editor-canvas"></canvas>
        </div>
      </div>
      
      <div class="action-buttons">
        <div class="button-group">
          <button id="load-image-btn" class="action-btn btn-primary"><i class="fas fa-folder-open"></i>${Blockly.Msg['LOAD_IMAGE']}</button>
          <button id="save-image-btn" class="action-btn btn-success"><i class="fas fa-save"></i>${Blockly.Msg['SAVE_IMAGE']}</button>
        </div>
        <button id="close-editor-btn" class="action-btn btn-warning"><i class="fas fa-check-circle"></i>${Blockly.Msg['APPLY_AND_CLOSE']}</button>
      </div>
      
      <input type="file" id="file-input" style="display: none;" accept="image/*">
    `;
	editorContainer.innerHTML += `
	  <div id="resize-indicator" style="
		position: absolute;
		bottom: 5px;
		right: 5px;
		width: 20px;
		height: 20px;
		background-color: rgba(0,0,0,0.5);
		border-radius: 50%;
		pointer-events: none;
		display: none;
		z-index: 10;
	  "></div>
	`;
    
    modal.appendChild(editorContainer);
    return modal;
  }

  initializeEditor_(modal) {
    const self = this;
    const canvasContainer = modal.querySelector('#editor-canvas-container');
    const canvas = modal.querySelector('#editor-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const widthInput = modal.querySelector('#width-input');
    const heightInput = modal.querySelector('#height-input');
    
    // Add checkerboard background for transparency
    const checkerboard = document.createElement('div');
    checkerboard.className = 'checkerboard';
    canvasContainer.insertBefore(checkerboard, canvas);

    const palette = modal.querySelector('#palette');
    const fileInput = modal.querySelector('#file-input');
    const zoomValue = modal.querySelector('.zoom-value');
    
    // Editor state
	let isScrolling = false;
	let scrollStartX = 0;
	let scrollStartY = 0;
	let editorContainer = modal.querySelector('.editor-container');
	let initialTouchDistance = 0;
	let initialCanvasWidth = 0;
	let initialCanvasHeight = 0;
	let isResizingWithTouch = false;
	let lastDist = 0;
    let currentColor = self.editorConfig.colors[0];
    let isDrawing = false;
    let brushSize = parseInt(modal.querySelector('#brush-size').value);
    let startX, startY;
    let currentTool = 'brush';
    let history = [];
    let historyIndex = -1;
    let tempCanvas = null;
	let touchStartTime = 0;
	let isTouchScroll = false;
	const SCROLL_THRESHOLD = 10; // пикселей для определения прокрутки
	const TAP_THRESHOLD = 300; // мс для определения тапа
    const HISTORY_LIMIT = 50;
    
    // View state
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPanning = false;
    let lastX, lastY;
    let originalWidth = 64;
    let originalHeight = 64;
    
    // Helper functions
    const updateView = () => {
      canvas.style.width = `${originalWidth * zoom}px`;
      canvas.style.height = `${originalHeight * zoom}px`;
      canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      
      // Update size inputs
      widthInput.value = originalWidth;
      heightInput.value = originalHeight;
    };
    
    const centerView = () => {
      const containerWidth = canvasContainer.clientWidth;
      const containerHeight = canvasContainer.clientHeight;
      const canvasWidth = originalWidth * zoom;
      const canvasHeight = originalHeight * zoom;
      
      offsetX = (containerWidth - canvasWidth) / 2;
      offsetY = (containerHeight - canvasHeight) / 2;
      updateView();
    };
    
    const saveState = () => {
      if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
      }
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      history.push(imageData);
      historyIndex++;
      
      if (history.length > HISTORY_LIMIT) {
        history.shift();
        historyIndex--;
      }
      
      updateUndoRedoButtons();
    };
    
    const updateUndoRedoButtons = () => {
      modal.querySelector('#undo-btn').disabled = historyIndex <= 0;
      modal.querySelector('#redo-btn').disabled = historyIndex >= history.length - 1;
    };
    
    const getPixelCoordinates = (clientX, clientY) => {
      const rect = canvasContainer.getBoundingClientRect();
      const x = (clientX - rect.left - offsetX) / zoom;
      const y = (clientY - rect.top - offsetY) / zoom;
      
      return {
        x: Math.floor(x),
        y: Math.floor(y)
      };
    };
    
    const drawSquare = (x, y) => {
      const offset = Math.floor(brushSize / 2);
      const startX = Math.max(0, x - offset);
      const startY = Math.max(0, y - offset);
      const endX = Math.min(canvas.width, x - offset + brushSize);
      const endY = Math.min(canvas.height, y - offset + brushSize);
      const size = Math.min(brushSize, endX - startX, endY - startY);
      
      if (currentColor === 'transparent') {
        ctx.clearRect(startX, startY, size, size);
      } else {
        ctx.fillStyle = currentColor;
        ctx.fillRect(startX, startY, size, size);
      }
    };
    
    const drawLine = (x1, y1, x2, y2) => {
      const dx = Math.abs(x2 - x1);
      const dy = -Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx + dy;
      let e2;
      
      while (true) {
        drawSquare(x1, y1);
        if (x1 === x2 && y1 === y2) break;
        e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x1 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y1 += sy;
        }
      }
    };
    
    const floodFill = (startX, startY, replacementColor) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const stack = [[startX, startY]];
      
      const getColorAt = (x, y) => {
        const index = (y * canvas.width + x) * 4;
        return [data[index], data[index + 1], data[index + 2], data[index + 3]];
      };
      
      const setColorAt = (x, y, color) => {
        const index = (y * canvas.width + x) * 4;
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = color[3];
      };
      
      const colorsMatch = (a, b) => {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
      };
      
      const hexToRgba = (hex) => {
        if (hex === 'transparent') return [0, 0, 0, 0];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 255];
      };
      
      const targetRgba = getColorAt(startX, startY);
      const replacementRgba = hexToRgba(replacementColor);
      
      if (colorsMatch(targetRgba, replacementRgba)) return;
      
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        
        const currentColorPixel = getColorAt(x, y);
        if (!colorsMatch(currentColorPixel, targetRgba)) continue;
        
        setColorAt(x, y, replacementRgba);
        
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    // Load existing image or create blank canvas
    const loadImage = (src) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Auto-fit to container
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;
        
        // Calculate zoom to fit image in container
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        zoom = Math.min(scaleX, scaleY, 10);
        
        // Limit maximum dimensions
        if (width > self.editorConfig.maxCanvasWidth || height > self.editorConfig.maxCanvasHeight) {
          const ratio = Math.min(
            self.editorConfig.maxCanvasWidth / width,
            self.editorConfig.maxCanvasHeight / height
          );
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        originalWidth = width;
        originalHeight = height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Center image
        offsetX = (containerWidth - width * zoom) / 2;
        offsetY = (containerHeight - height * zoom) / 2;
        updateView();
        saveState();
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        canvas.width = 64;
        canvas.height = 64;
        originalWidth = 64;
        originalHeight = 64;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        centerView();
        saveState();
      };
      
      img.src = src;
    };

    // Resize canvas function
    const resizeCanvas = (newWidth, newHeight) => {
      if (!newWidth || !newHeight || newWidth < 1 || newHeight < 1) {
        alert('Please enter valid dimensions (minimum 1x1)');
        return;
      }
      
      if (newWidth > self.editorConfig.maxCanvasWidth || newHeight > self.editorConfig.maxCanvasHeight) {
        alert(`Maximum size is ${self.editorConfig.maxCanvasWidth}x${self.editorConfig.maxCanvasHeight} pixels`);
        return;
      }
      
      // Create temporary canvas to store current image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      
      // Resize main canvas
      canvas.width = newWidth;
      canvas.height = newHeight;
      originalWidth = newWidth;
      originalHeight = newHeight;
      
      // Clear and redraw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
      
      // Update view
      centerView();
      saveState();
    };

    if (this.value_) {
      loadImage(this.value_);
    } else {
      // Create blank canvas with default size
      canvas.width = 64;
      canvas.height = 64;
      originalWidth = 64;
      originalHeight = 64;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      centerView();
      saveState();
    }
    
    // Initialize palette
    self.editorConfig.colors.forEach((color, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'color';
      colorDiv.dataset.color = color;
      
      if (color === 'transparent') {
        colorDiv.style.background = `
          repeating-conic-gradient(#999 0% 25%, #ccc 0% 50%) 50% / 10px 10px
        `;
        colorDiv.title = 'Transparent';
        
        const alphaSymbol = document.createElement('div');
        alphaSymbol.textContent = 'α';
        alphaSymbol.style.cssText = `
          position: relative;
          top: 50%;
          transform: translateY(-50%);
          text-align: center;
          font-weight: bold;
          color: #333;
          font-size: 12px;
          pointer-events: none;
        `;
        colorDiv.appendChild(alphaSymbol);
      } else {
        colorDiv.style.backgroundColor = color;
      }
      
      // Set first color as selected
      if (index === 0) {
        colorDiv.classList.add('selected');
      }
      
      palette.appendChild(colorDiv);
    });
    
    // Tool selection event listeners
    modal.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (this.id === 'clear-btn') {
          if (confirm('Clear canvas?')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveState();
          }
          return;
        }
        
        if (this.id === 'zoom-out-btn') {
          zoom = Math.max(self.editorConfig.minZoom, zoom - self.editorConfig.zoomStep);
          updateView();
          return;
        }
        
        if (this.id === 'zoom-in-btn') {
          zoom = Math.min(self.editorConfig.maxZoom, zoom + self.editorConfig.zoomStep);
          updateView();
          return;
        }
        
        if (this.id === 'reset-view-btn') {
          zoom = 1;
          centerView();
          return;
        }
        
        if (this.id === 'resize-btn') {
          const newWidth = parseInt(widthInput.value);
          const newHeight = parseInt(heightInput.value);
          resizeCanvas(newWidth, newHeight);
          return;
        }
        
        modal.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        switch (this.id) {
          case 'brush-btn':
            currentTool = 'brush';
            break;
          case 'line-btn':
            currentTool = 'line';
            break;
          case 'eraser-btn':
            currentTool = 'eraser';
            break;
          case 'fill-btn':
            currentTool = 'fill';
            break;
        }
      });
    });
    
    // Color palette event listeners
    palette.addEventListener('click', function(e) {
      if (e.target.classList.contains('color')) {
        palette.querySelectorAll('.color').forEach(c => c.classList.remove('selected'));
        e.target.classList.add('selected');
        currentColor = e.target.dataset.color;
      }
    });
    
    // Brush size event listener
    modal.querySelector('#brush-size').addEventListener('input', function() {
      brushSize = parseInt(this.value);
      modal.querySelector('#brush-size-value').textContent = brushSize;
    });
    
    // Undo/Redo event listeners
    modal.querySelector('#undo-btn').addEventListener('click', function() {
      if (historyIndex > 0) {
        historyIndex--;
        ctx.putImageData(history[historyIndex], 0, 0);
        updateUndoRedoButtons();
      }
    });
    
    modal.querySelector('#redo-btn').addEventListener('click', function() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        ctx.putImageData(history[historyIndex], 0, 0);
        updateUndoRedoButtons();
      }
    });
    
    // Canvas container event listeners for panning
    canvasContainer.addEventListener('mousedown', function(e) {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvasContainer.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        
        offsetX += dx;
        offsetY += dy;
        updateView();
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isPanning) {
        isPanning = false;
        canvasContainer.style.cursor = '';
      }
    });
    
    // Canvas event listeners
    canvasContainer.addEventListener('mousedown', function(e) {
      if (e.button === 0 && !isPanning && !e.ctrlKey) {
        const coords = getPixelCoordinates(e.clientX, e.clientY);
        if (coords.x < 0 || coords.y < 0 || coords.x >= canvas.width || coords.y >= canvas.height) {
          return;
        }
        
        isDrawing = true;
        startX = coords.x;
        startY = coords.y;
        
        if (currentTool === 'brush' || currentTool === 'eraser') {
          const color = currentTool === 'eraser' ? 'transparent' : currentColor;
          const oldColor = currentColor;
          currentColor = color;
          drawSquare(coords.x, coords.y);
          currentColor = oldColor;
        } else if (currentTool === 'fill') {
          floodFill(coords.x, coords.y, currentColor);
          saveState();
        } else if (currentTool === 'line') {
          // Store current canvas state for line preview
          tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(canvas, 0, 0);
        }
      }
    });
    
    canvasContainer.addEventListener('mousemove', function(e) {
      if (!isDrawing) return;
      
      const coords = getPixelCoordinates(e.clientX, e.clientY);
      if (coords.x < 0 || coords.y < 0 || coords.x >= canvas.width || coords.y >= canvas.height) {
        return;
      }
      
      if (currentTool === 'brush' || currentTool === 'eraser') {
        const color = currentTool === 'eraser' ? 'transparent' : currentColor;
        const oldColor = currentColor;
        currentColor = color;
        drawSquare(coords.x, coords.y);
        currentColor = oldColor;
      } else if (currentTool === 'line') {
        // Show line preview
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        drawLine(startX, startY, coords.x, coords.y);
      }
    });
    
    canvasContainer.addEventListener('mouseup', function(e) {
      if (!isDrawing) return;
      isDrawing = false;
      
      if (currentTool === 'line') {
        const coords = getPixelCoordinates(e.clientX, e.clientY);
        if (coords.x >= 0 && coords.y >= 0 && coords.x < canvas.width && coords.y < canvas.height) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
          drawLine(startX, startY, coords.x, coords.y);
        }
        tempCanvas = null;
      }
      
      saveState();
    });
	
	canvasContainer.addEventListener('touchstart', function(e) {
	  e.preventDefault();
	  
	  if (e.touches.length === 1) {
		const touch = e.touches[0];
		scrollStartX = touch.clientX;
		scrollStartY = touch.clientY;
		touchStartTime = Date.now();
		
		// Пока не знаем, будет ли это прокрутка или рисование
		isTouchScroll = false;
		
		// Инициируем событие mousedown сразу
		const mouseEvent = new MouseEvent('mousedown', {
		  clientX: touch.clientX,
		  clientY: touch.clientY,
		  button: 0
		});
		this.dispatchEvent(mouseEvent);
	  } else if (e.touches.length === 2) {
		// Двойное касание - масштабирование/прокрутка
		const touch1 = e.touches[0];
		const touch2 = e.touches[1];
		
		// Рассчитываем начальное расстояние между пальцами
		initialTouchDistance = Math.hypot(
		  touch2.clientX - touch1.clientX,
		  touch2.clientY - touch1.clientY
		);
		
		// Запоминаем начальные размеры
		initialCanvasWidth = originalWidth;
		initialCanvasHeight = originalHeight;
		
		// Определяем, делаем ли мы resize (касаемся угла) или scroll
		const rect = canvasContainer.getBoundingClientRect();
		const cornerThreshold = 50; // область в пикселях, считающаяся углом
		
		// Проверяем, находится ли хотя бы один палец в угловой области
		const inBottomRight = 
		  (touch1.clientX > rect.right - cornerThreshold && 
		   touch1.clientY > rect.bottom - cornerThreshold) ||
		  (touch2.clientX > rect.right - cornerThreshold && 
		   touch2.clientY > rect.bottom - cornerThreshold);
		
		isResizingWithTouch = inBottomRight;
	  }
	});

	canvasContainer.addEventListener('touchmove', function(e) {
	  e.preventDefault();
	  
	  if (e.touches.length === 1) {
		const touch = e.touches[0];
		
		// Определяем, это прокрутка или рисование
		if (!isTouchScroll) {
		  const deltaX = Math.abs(touch.clientX - scrollStartX);
		  const deltaY = Math.abs(touch.clientY - scrollStartY);
		  
		  // Если движение преимущественно вертикальное и контейнер можно прокрутить
		  if (deltaY > SCROLL_THRESHOLD && deltaY > deltaX && 
			  editorContainer.scrollHeight > editorContainer.clientHeight) {
			isTouchScroll = true;
			
			// Отменяем рисование
			const mouseEvent = new MouseEvent('mouseup');
			this.dispatchEvent(mouseEvent);
		  }
		}
		
		if (isTouchScroll) {
		  // Прокрутка контейнера
		  const deltaY = scrollStartY - touch.clientY;
		  editorContainer.scrollTop += deltaY;
		  scrollStartY = touch.clientY;
		} else {
		  // Продолжаем рисование
		  const mouseEvent = new MouseEvent('mousemove', {
			clientX: touch.clientX,
			clientY: touch.clientY
		  });
		  this.dispatchEvent(mouseEvent);
		}
	  } else if (e.touches.length === 2) {
		// Двойное касание - масштабирование или прокрутка
		const touch1 = e.touches[0];
		const touch2 = e.touches[1];
		
		// Текущее расстояние между пальцами
		const currentDistance = Math.hypot(
		  touch2.clientX - touch1.clientX,
		  touch2.clientY - touch1.clientY
		);
		
		if (isResizingWithTouch) {
		  // Режим изменения размера (касание угла)
		  if (initialTouchDistance > 0) {
			const scale = currentDistance / initialTouchDistance;
			
			// Рассчитываем новые размеры
			let newWidth = Math.floor(initialCanvasWidth * scale);
			let newHeight = Math.floor(initialCanvasHeight * scale);
			
			// Ограничиваем минимальный и максимальный размер
			newWidth = Math.max(16, Math.min(self.editorConfig.maxCanvasWidth, newWidth));
			newHeight = Math.max(16, Math.min(self.editorConfig.maxCanvasHeight, newHeight));
			
			// Применяем новые размеры
			if (newWidth !== originalWidth || newHeight !== originalHeight) {
			  resizeCanvas(newWidth, newHeight);
			}
		  }
		} else {
		  // Режим прокрутки/масштабирования
		  const rect = canvasContainer.getBoundingClientRect();
		  const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
		  const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
		  
		  if (initialTouchDistance > 0) {
			const scale = currentDistance / initialTouchDistance;
			const oldZoom = zoom;
			
			zoom = Math.max(
			  self.editorConfig.minZoom,
			  Math.min(self.editorConfig.maxZoom, zoom * scale)
			);
			
			if (zoom !== oldZoom) {
			  const canvasX = (centerX - offsetX) / oldZoom;
			  const canvasY = (centerY - offsetY) / oldZoom;
			  
			  offsetX = centerX - canvasX * zoom;
			  offsetY = centerY - canvasY * zoom;
			  
			  updateView();
			}
		  }
		  
		  // Прокрутка двумя пальцами
		  const newCenterX = (touch1.clientX + touch2.clientX) / 2;
		  const newCenterY = (touch1.clientY + touch2.clientY) / 2;
		  const lastCenterX = (e.previousTouches[0].clientX + e.previousTouches[1].clientX) / 2;
		  const lastCenterY = (e.previousTouches[0].clientY + e.previousTouches[1].clientY) / 2;
		  
		  const dx = newCenterX - lastCenterX;
		  const dy = newCenterY - lastCenterY;
		  
		  offsetX += dx;
		  offsetY += dy;
		  updateView();
		}
		
		initialTouchDistance = currentDistance;
	  }
	});

	canvasContainer.addEventListener('touchend', function(e) {
	  e.preventDefault();
	  
	  if (e.touches.length === 0) {
		if (!isTouchScroll && Date.now() - touchStartTime < TAP_THRESHOLD) {
		  // Обработка короткого тапа (если нужно)
		}
		
		// Завершаем текущее действие
		const mouseEvent = new MouseEvent('mouseup');
		this.dispatchEvent(mouseEvent);
		isPanning = false;
		initialTouchDistance = 0;
		isResizingWithTouch = false;
		isTouchScroll = false;
	  } else if (e.touches.length === 1) {
		// Переход от двух пальцев к одному
		isPanning = false;
		initialTouchDistance = 0;
		isResizingWithTouch = false;
	  }
	});
    
    // File input and other button event listeners
    modal.querySelector('#load-image-btn').addEventListener('click', function() {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          loadImage(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    
    modal.querySelector('#save-image-btn').addEventListener('click', function() {
      const link = document.createElement('a');
      link.download = 'pixel-art.png';
      link.href = canvas.toDataURL();
      link.click();
    });
    
    modal.querySelector('#close-editor-btn').addEventListener('click', () => {
	  const newValue = canvas.toDataURL();
	  this.setValue(newValue); // Вместо this.value_ = canvas.toDataURL();
	  document.body.removeChild(modal);
	});
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Handle mouse wheel for zooming
    canvasContainer.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      const delta = -Math.sign(e.deltaY);
      const oldZoom = zoom;
      
      zoom = Math.max(
        self.editorConfig.minZoom,
        Math.min(self.editorConfig.maxZoom, zoom + delta * self.editorConfig.zoomStep)
      );
      
      if (zoom !== oldZoom) {
        // Adjust offset to zoom toward mouse position
        const rect = canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const canvasX = (mouseX - offsetX) / oldZoom;
        const canvasY = (mouseY - offsetY) / oldZoom;
        
        offsetX = mouseX - canvasX * zoom;
        offsetY = mouseY - canvasY * zoom;
        
        updateView();
      }
    });
  }
}