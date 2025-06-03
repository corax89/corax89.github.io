/**
 * Level Editor Field for Blockly with object placement
 */
class FieldLevelEditor extends Blockly.Field {
  constructor(value, validator, config) {
    super(value, validator, config);
    
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
    this.value_ = value || '{"objects":[],"width":800,"height":600}';
    this.size_ = new Blockly.utils.Size(32, 32);
    
    // Editor configuration
    this.editorConfig = {
      maxCanvasWidth: 10000,
      maxCanvasHeight: 10000,
      minZoom: 0.1,
      maxZoom: 10,
      zoomStep: 0.1,
      checkerboardSize: 16,
      gridSize: 32,
      gridColor: 'rgba(0, 0, 0, 0.2)'
    };

    // Add styles to the document head
    this.addStyles_();
    this.updateSize_();
  }

  addStyles_() {
    const style = document.createElement('style');
    style.textContent = `
      #editor-canvas {
        border: 2px solid #111;
        position: absolute;
        z-index: 1;
        background-color: white !important;
      }
      #editor-canvas-container {
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        position: relative;
        overflow: auto;
        width: 100%;
        height: 600px;
      }
      .level-editor-modal {
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
        overscroll-behavior: contain;
        scrollbar-width: thin;
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

      .size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .size-input {
        width: 50px;
        text-align: center;
      }

      .grid-size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .object-palette {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
        margin-bottom: 10px;
        padding: 10px;
        background: hsl(210, 11%, 98%);
        border-radius: 6px;
        max-height: 200px;
        overflow-y: auto;
      }

      .object-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 5px;
        border: 2px solid hsl(210, 11%, 85%);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .object-item:hover {
        transform: scale(1.05);
        border-color: hsl(210, 11%, 60%);
      }

      .object-item.selected {
        border-color: hsl(217, 89%, 61%);
        transform: scale(1.05);
      }

      .object-preview {
        width: 48px;
        height: 48px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        margin-bottom: 5px;
      }

      .object-name {
        font-size: 12px;
        text-align: center;
        word-break: break-word;
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
        overflow: auto;
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

      .grid-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* Cursor coordinates display */
      .cursor-coordinates {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 14px;
        pointer-events: none;
        z-index: 1001;
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
        
        .object-palette {
          grid-template-columns: repeat(3, 1fr);
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
      }
    `;
    document.head.appendChild(style);
  }

  static fromJson(options) {
    return new FieldLevelEditor(options['value'], undefined, options);
  }

  doClassValidation_(newValue) {
    if (newValue === null || newValue === '') return '{"objects":[],"width":800,"height":600}';
    try {
      const parsed = JSON.parse(newValue);
      if (parsed && typeof parsed === 'object') {
        if (!Array.isArray(parsed.objects)) parsed.objects = [];
        if (typeof parsed.width !== 'number') parsed.width = 800;
        if (typeof parsed.height !== 'number') parsed.height = 600;
        return JSON.stringify(parsed);
      }
      return '{"objects":[],"width":800,"height":600}';
    } catch (e) {
      return '{"objects":[],"width":800,"height":600}';
    }
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
    
    const container = Blockly.utils.dom.createSvgElement(
      'svg',
      {
        'width': this.size_.width,
        'height': this.size_.height,
        'viewBox': `0 0 ${this.size_.width} ${this.size_.height}`
      },
      this.fieldGroup_
    );
    
    // Background with white color
    const background = Blockly.utils.dom.createSvgElement(
      'rect',
      {
        'width': '100%',
        'height': '100%',
        'fill': 'white',
        'stroke': '#000',
        'stroke-width': '1'
      },
      container
    );
    
    // Create text element with foreignObject for multi-line text
    const foreignObject = Blockly.utils.dom.createSvgElement(
      'foreignObject',
      {
        'x': '0',
        'y': '0',
        'width': this.size_.width,
        'height': this.size_.height
      },
      container
    );
    
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.textAlign = 'center';
    div.style.fontSize = '10px';
    div.style.color = '#888';
    div.style.wordBreak = 'break-word';
    div.style.padding = '2px';
    div.style.boxSizing = 'border-box';
    
    try {
      const data = JSON.parse(this.value_);
      const objects = data.objects || [];
      div.textContent = objects.length > 0 ? 
        `${objects.length} ${Blockly.Msg['OBJECT_NAME_LABEL_ONE']}\n(${data.width}x${data.height})` : 
        Blockly.Msg['CLICK_TO_EDIT'];
    } catch (e) {
      div.textContent = Blockly.Msg['CLICK_TO_EDIT'];
    }
    
    foreignObject.appendChild(div);
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
    modal.className = 'level-editor-modal';
    
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
          <button id="select-btn" class="tool-btn active" title="${Blockly.Msg['LEVEL_SELECT_MOVE']}"><i class="fas fa-mouse-pointer"></i></button>
          <button id="hand-btn" class="tool-btn" title="${Blockly.Msg['LEVEL_HAND_TOOL']}"><i class="fas fa-hand-paper"></i></button>
          <button id="delete-btn" class="tool-btn" title="${Blockly.Msg["LISTS_GET_INDEX_REMOVE"]}"><i class="fas fa-trash-alt"></i></button>
          <button id="clear-btn" class="tool-btn" title="${Blockly.Msg['LEVEL_CLEAR_ALL']}"><i class="fas fa-broom"></i></button>
        </div>
        <label class="grid-toggle checkbox-container">
          <input type="checkbox" id="grid-toggle" checked>
		  <span class="checkbox-custom"></span>
		  <label for="grid-toggle"><span><i class="fas fa-th"></i> </span>${Blockly.Msg['LEVEL_GRID'] } </label>
        </label>
        <div class="grid-size-controls">
          <span><i class="fas fa-border-all"></i></span>
          <input type="number" id="grid-size-input" class="size-input" min="1" max="128" value="${this.editorConfig.gridSize}" placeholder="Grid size">
          <button id="grid-size-btn" class="tool-btn" title="${Blockly.Msg['LEVEL_SET_GRID_SIZE']}"><i class="fas fa-check"></i></button>
        </div>
        <div class="size-controls">
          <span><i class="fas fa-expand"></i></span>
          <input type="number" id="width-input" class="size-input" min="1" max="10000" placeholder="Width">
          <span>x</span>
          <input type="number" id="height-input" class="size-input" min="1" max="10000" placeholder="Height">
          <button id="resize-btn" class="tool-btn" title="${Blockly.Msg['LEVEL_RESIZE']}"><i class="fas fa-check"></i></button>
        </div>
        <div class="editor-controls">
          <div class="zoom-controls">
            <button id="zoom-out-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_ZOOM_OUT']}"><i class="fas fa-search-minus"></i></button>
            <span class="zoom-value">100%</span>
            <button id="zoom-in-btn" class="tool-btn" title="${Blockly.Msg['ZOOM_IN']}"><i class="fas fa-search-plus"></i></button>
            <button id="reset-view-btn" class="tool-btn" title="${Blockly.Msg['IMAGE_RESET_VIEW']}"><i class="fas fa-expand-arrows-alt"></i></button>
          </div>
        </div>
        <button id="close-editor-btn" class="action-btn btn-warning"><i class="fas fa-check-circle"></i>${Blockly.Msg['APPLY_AND_CLOSE']}</button>
      </div>
      
      <div id="object-palette" class="object-palette"></div>
      
      <div class="canvas-wrapper">
        <div id="editor-canvas-container">
          <canvas id="editor-canvas"></canvas>
        </div>
      </div>
    `;
    
    modal.appendChild(editorContainer);
    return modal;
  }

  initializeEditor_(modal) {
    rebuildProtoObjectArray();
    if(proto_object_array.length == 0){
      showSwitchModal('error', Blockly.Msg['ERROR_NO_PROTOTYPES'], false, 'ok');
    }
    const self = this;
    const canvasContainer = modal.querySelector('#editor-canvas-container');
    const canvas = modal.querySelector('#editor-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const widthInput = modal.querySelector('#width-input');
    const heightInput = modal.querySelector('#height-input');
    const gridToggle = modal.querySelector('#grid-toggle');
    const gridSizeInput = modal.querySelector('#grid-size-input');

    const objectPalette = modal.querySelector('#object-palette');
    const zoomValue = modal.querySelector('.zoom-value');
    
    // Add cursor coordinates display to modal
    const coordsDisplay = document.createElement('div');
    coordsDisplay.className = 'cursor-coordinates';
    coordsDisplay.textContent = '0, 0';
    modal.appendChild(coordsDisplay);
    
    // Editor state
    let currentTool = 'select';
    let isDragging = false;
    let dragStartX, dragStartY;
    let selectedObjectIndex = -1;
    let selectedProtoIndex = -1;
    let objects = [];
    let showGrid = true;
    
    // View state
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isPanning = false;
    let lastX, lastY;
    
    // Parse initial value with size information
    let parsedValue;
    try {
      parsedValue = JSON.parse(this.value_);
      if (!parsedValue || typeof parsedValue !== 'object') {
        parsedValue = {objects: [], width: 800, height: 600};
      }
    } catch (e) {
      parsedValue = {objects: [], width: 800, height: 600};
    }
    
    let canvasWidth = parsedValue.width || 800;
    let canvasHeight = parsedValue.height || 600;
    objects = Array.isArray(parsedValue.objects) ? parsedValue.objects : [];
    
    // Image cache
    this.imageCache = {};
    
    // Preload all images
    const preloadImages = () => {
      proto_object_array.forEach((proto, index) => {
        if (!self.imageCache[index]) {
          const img = new Image();
          img.onerror = () => {
            console.error(`Failed to load image: ${proto.sprite}`);
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="red"/><text x="16" y="16" font-family="Arial" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="white">ERR</text></svg>';
          };
          img.src = proto.sprite;
          self.imageCache[index] = img;
        }
      });
    };
    
    preloadImages();
    
    // Helper function to remove objects outside bounds
    const removeOutOfBoundsObjects = (newWidth, newHeight) => {
      const keptObjects = [];
      let removedCount = 0;
      
      objects.forEach(obj => {
        const proto = proto_object_array[obj.protoIndex];
        if (proto) {
          if (obj.x + proto.width <= newWidth && obj.y + proto.height <= newHeight) {
            keptObjects.push(obj);
          } else {
            removedCount++;
          }
        } else {
          // Remove objects with invalid prototypes
          removedCount++;
        }
      });
      
      if (removedCount > 0) {
        showSwitchModal('info', `${removedCount} objects were removed because they were outside the new level boundaries.`, false, 'ok');
      }
      
      objects = keptObjects;
      if (selectedObjectIndex >= objects.length) {
        selectedObjectIndex = -1;
      }
    };
    
    // Helper functions
    const updateView = () => {
      canvas.style.width = `${canvasWidth * zoom}px`;
      canvas.style.height = `${canvasHeight * zoom}px`;
      canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      
      // Update size inputs
      widthInput.value = canvasWidth;
      heightInput.value = canvasHeight;
      
      // Update scrollbars
      canvasContainer.scrollLeft = -offsetX;
      canvasContainer.scrollTop = -offsetY;
      
      // Redraw everything
      drawCanvas();
    };
    
    const centerView = () => {
	  const containerWidth = canvasContainer.clientWidth;
	  const containerHeight = canvasContainer.clientHeight;
	  const scaledWidth = canvasWidth * zoom;
	  const scaledHeight = canvasHeight * zoom;
	  
	  offsetX = (containerWidth - scaledWidth) / 2;
	  offsetY = (containerHeight - scaledHeight) / 2;
	  
	  // Обновляем положение скролла
	  canvasContainer.scrollLeft = -offsetX;
	  canvasContainer.scrollTop = -offsetY;
	  
	  updateView();
	};
    
    const getPixelCoordinates = (clientX, clientY) => {
		const rect = canvasContainer.getBoundingClientRect();
		
		// Получаем положение скролла
		const scrollLeft = canvasContainer.scrollLeft;
		const scrollTop = canvasContainer.scrollTop;
		
		// Рассчитываем координаты с учетом скролла и трансформации
		const x = (clientX - rect.left + scrollLeft - offsetX) / zoom;
		const y = (clientY - rect.top + scrollTop - offsetY) / zoom;
		
		return {
			x: Math.floor(x),
			y: Math.floor(y),
			canvasX: x,
			canvasY: y
		};
	};
    
    const updateCursorCoordinates = (x, y) => {
      coordsDisplay.textContent = `${x}, ${y}`;
    };
    
    const drawCanvas = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set canvas size
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Draw grid if enabled
      if (showGrid) {
        ctx.strokeStyle = self.editorConfig.gridColor;
        ctx.lineWidth = 1;
        
        const gridSize = self.editorConfig.gridSize;
        
        // Vertical lines
        for (let x = 0; x <= canvasWidth; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= canvasHeight; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }
      }
      
      // Draw objects
      objects.forEach((obj, index) => {
        const proto = proto_object_array[obj.protoIndex];
        if (!proto) return;
        
        const img = self.imageCache[obj.protoIndex];
        if (img) {
          ctx.drawImage(img, obj.x, obj.y, proto.width, proto.height);
          
          // Draw selection rectangle if selected
          if (index === selectedObjectIndex) {
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
            ctx.strokeRect(obj.x, obj.y, proto.width, proto.height);
          }
        }
      });
    };
    
    const findObjectAt = (x, y) => {
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const proto = proto_object_array[obj.protoIndex];
        if (!proto) continue;
        
        if (x >= obj.x && x <= obj.x + proto.width &&
            y >= obj.y && y <= obj.y + proto.height) {
          return i;
        }
      }
      return -1;
    };
    
    const snapToGrid = (value) => {
      const gridSize = self.editorConfig.gridSize;
      return Math.floor(value / gridSize) * gridSize;
    };
    
    const resizeCanvas = (newWidth, newHeight) => {
      if (!newWidth || !newHeight || newWidth < 1 || newHeight < 1) {
        alert('Please enter valid dimensions (minimum 1x1)');
        return;
      }
      
      if (newWidth > self.editorConfig.maxCanvasWidth || newHeight > self.editorConfig.maxCanvasHeight) {
        alert(`Maximum size is ${self.editorConfig.maxCanvasWidth}x${self.editorConfig.maxCanvasHeight} pixels`);
        return;
      }
      
      // Remove objects that would be outside the new bounds
      removeOutOfBoundsObjects(newWidth, newHeight);
      
      canvasWidth = newWidth;
      canvasHeight = newHeight;
      
      // Update view
      updateView();
    };
    
    // Set grid size function
    const setGridSize = (size) => {
      if (!size || size < 1 || size > 128) {
        alert('Please enter a valid grid size (1-128)');
        return;
      }
      
      self.editorConfig.gridSize = parseInt(size);
      drawCanvas();
    };
    
    // Initialize object palette
    proto_object_array.forEach((proto, index) => {
      const item = document.createElement('div');
      item.className = 'object-item';
      item.dataset.index = index;
      
      const preview = document.createElement('div');
      preview.className = 'object-preview';
      preview.style.backgroundImage = `url(${proto.sprite})`;
      
      const name = document.createElement('div');
      name.className = 'object-name';
      name.textContent = workspace.getVariableById(proto.name).name + '(h' + proto.width + 'w' + proto.height + ')';
      
      item.appendChild(preview);
      item.appendChild(name);
      objectPalette.appendChild(item);
    });
    
    // Set initial canvas size from stored value
    widthInput.value = canvasWidth;
    heightInput.value = canvasHeight;
    
    // Initialize canvas
    drawCanvas();
    centerView();
    
    // Handle scroll events
    canvasContainer.addEventListener('scroll', () => {
		// Не нужно обновлять offsetX/Y здесь, так как они уже учитываются в getPixelCoordinates
		drawCanvas(); // Просто перерисовываем
	});
    
    // Mouse move handler for cursor coordinates
    const handleMouseMove = (e) => {
      const coords = getPixelCoordinates(e.clientX, e.clientY);
      updateCursorCoordinates(coords.x, coords.y);
      
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        
        offsetX += dx;
        offsetY += dy;
        
        // Update scroll position
        canvasContainer.scrollLeft = -offsetX;
        canvasContainer.scrollTop = -offsetY;
        
        updateView();
        return;
      }
      
      if (isDragging && selectedObjectIndex !== -1) {
        const coords = getPixelCoordinates(e.clientX, e.clientY);
        const obj = objects[selectedObjectIndex];
        
        if (showGrid) {
          obj.x = snapToGrid(coords.x - dragStartX);
          obj.y = snapToGrid(coords.y - dragStartY);
        } else {
          obj.x = coords.x - dragStartX;
          obj.y = coords.y - dragStartY;
        }
        
        // Keep object within canvas bounds
        const proto = proto_object_array[obj.protoIndex];
        if (proto) {
          obj.x = Math.max(0, Math.min(canvasWidth - proto.width, obj.x));
          obj.y = Math.max(0, Math.min(canvasHeight - proto.height, obj.y));
        }
        
        drawCanvas();
      }
    };
    
    // Add mouse move listener
    document.addEventListener('mousemove', handleMouseMove);
    
    // Tool selection event listeners
    modal.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (this.id === 'clear-btn') {
          if (confirm('Clear all objects?')) {
            objects = [];
            selectedObjectIndex = -1;
            selectedProtoIndex = -1;
            objectPalette.querySelectorAll('.object-item').forEach(i => i.classList.remove('selected'));
            drawCanvas();
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
        
        if (this.id === 'grid-size-btn') {
          const newSize = parseInt(gridSizeInput.value);
          setGridSize(newSize);
          return;
        }
        
        // Deselect any selected prototype when selecting a tool
        selectedProtoIndex = -1;
        objectPalette.querySelectorAll('.object-item').forEach(i => i.classList.remove('selected'));
        
        modal.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        switch (this.id) {
          case 'select-btn':
            currentTool = 'select';
            canvas.style.cursor = 'crosshair';
            break;
          case 'hand-btn':
            currentTool = 'hand';
            canvas.style.cursor = 'grab';
            break;
          case 'delete-btn':
            currentTool = 'delete';
            canvas.style.cursor = 'not-allowed';
            break;
        }
      });
    });
    
    // Grid toggle
    gridToggle.addEventListener('change', function() {
      showGrid = this.checked;
      drawCanvas();
    });
    
    // Object palette event listeners
    objectPalette.addEventListener('click', function(e) {
      const item = e.target.closest('.object-item');
      if (item) {
        // Deselect any selected tool when selecting an object
        modal.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        selectedObjectIndex = -1;
        
        objectPalette.querySelectorAll('.object-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedProtoIndex = parseInt(item.dataset.index);
        currentTool = 'place';
        canvas.style.cursor = 'crosshair';
      }
    });
    
    // Canvas container event listeners for panning
    canvasContainer.addEventListener('mousedown', function(e) {
      if (e.button === 1 || (e.button === 0 && currentTool === 'hand')) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }
      
      const coords = getPixelCoordinates(e.clientX, e.clientY);
      
      if (currentTool === 'select' || currentTool === 'delete') {
        const index = findObjectAt(coords.x, coords.y);
        
        if (currentTool === 'delete' && index !== -1) {
          objects.splice(index, 1);
          if (selectedObjectIndex === index) selectedObjectIndex = -1;
          drawCanvas();
          return;
        }
        
        if (index !== -1) {
          selectedObjectIndex = index;
          isDragging = true;
          dragStartX = coords.x - objects[index].x;
          dragStartY = coords.y - objects[index].y;
          drawCanvas();
        } else {
          selectedObjectIndex = -1;
          drawCanvas();
        }
      } else if (currentTool === 'place' && selectedProtoIndex !== -1) {
        const proto = proto_object_array[selectedProtoIndex];
        if (!proto) return;
        
        const x = showGrid ? snapToGrid(coords.x) : coords.x;
        const y = showGrid ? snapToGrid(coords.y) : coords.y;
        
        objects.push({
          protoIndex: selectedProtoIndex,
          x: x,
          y: y
        });
        
        drawCanvas();
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isPanning) {
        isPanning = false;
        if (currentTool === 'hand') {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'crosshair';
        }
      }
      
      if (isDragging) {
        isDragging = false;
      }
    });
    
    // Touch events
    canvasContainer.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0
        });
        this.dispatchEvent(mouseEvent);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastX = (touch1.clientX + touch2.clientX) / 2;
        lastY = (touch1.clientY + touch2.clientY) / 2;
        e.preventDefault();
      }
    });
    
    canvasContainer.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        this.dispatchEvent(mouseEvent);
        e.preventDefault();
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentX = (touch1.clientX + touch2.clientX) / 2;
        const currentY = (touch1.clientY + touch2.clientY) / 2;
        
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        
        offsetX += dx;
        offsetY += dy;
        
        // Update scroll position
        canvasContainer.scrollLeft = -offsetX;
        canvasContainer.scrollTop = -offsetY;
        
        updateView();
        
        lastX = currentX;
        lastY = currentY;
        e.preventDefault();
      }
    });
    
    canvasContainer.addEventListener('touchend', function(e) {
      const mouseEvent = new MouseEvent('mouseup');
      this.dispatchEvent(mouseEvent);
      e.preventDefault();
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
        
        // Update scroll position
        canvasContainer.scrollLeft = -offsetX;
        canvasContainer.scrollTop = -offsetY;
        
        updateView();
      }
    });
    
    // Close editor and save
    modal.querySelector('#close-editor-btn').addEventListener('click', () => {
      // Store both objects and dimensions
      this.value_ = JSON.stringify({
        objects: objects,
        width: canvasWidth,
        height: canvasHeight
      });
      this.forceRerender();
      
      // Clean up
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.removeChild(modal);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.body.removeChild(modal);
      }
    });
  }
}

// Register the field
Blockly.fieldRegistry.register('field_level_editor', FieldLevelEditor);