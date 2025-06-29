/**
 * Level Editor Field for Blockly with object placement and tile editing
 */
class FieldLevelEditor extends Blockly.Field {
	constructor(value, validator, config) {
		// 1. Сначала вызываем конструктор родительского класса
		super(value, validator, config);

		// 2. Инициализируем editorConfig как первое свойство
		this.editorConfig = {
			gridSize: 32,
			tileSize: 32,
			maxCanvasWidth: 10000,
			maxCanvasHeight: 10000,
			minZoom: 0.1,
			maxZoom: 10,
			zoomStep: 0.1,
			checkerboardSize: 16,
			gridColor: 'rgba(0, 0, 0, 0.2)',
			minTileIndex: 1
		};

		// 3. Инициализируем остальные свойства
		this.objects_ = [];
		this.tileMap_ = []; // 2D массив для тайлов [y][x]
		this.width_ = 800;
		this.height_ = 600;
		this.imageCache = {};
		this.tileCache = {};
		this.firstRender = true;

		// 4. Устанавливаем начальное значение через защищенный метод
		this.doValueUpdate_(value);
		this.addStyles_();
	}

	safeSetValue(value) {
		// Сначала убедимся, что editorConfig существует
		if (!this.editorConfig) {
			this.editorConfig = {
				gridSize: 32,
				tileSize: 32
			};
		}

		try {
			const validated = this.doClassValidation_(value);
			const parsed = JSON.parse(validated);

			// Устанавливаем значения с проверкой на существование editorConfig
			this.objects_ = Array.isArray(parsed.objects) ? parsed.objects : [];
			this.width_ = typeof parsed.width === 'number' ? parsed.width : 800;
			this.height_ = typeof parsed.height === 'number' ? parsed.height : 600;

			// Инициализируем карту тайлов (конвертируем из плоского массива при необходимости)
			this.initializeTileMap(parsed.tiles, this.width_, this.height_);

			if (typeof parsed.gridSize === 'number') {
				this.editorConfig.gridSize = parsed.gridSize;
				this.editorConfig.tileSize = parsed.gridSize;
			}

			super.setValue(validated);
		} catch (e) {
			console.error('Failed to initialize field value:', e);
			this.resetToDefaults();
		}
	}

	doValueUpdate_(newValue) {
		super.doValueUpdate_(newValue);

		// Parse the value and initialize all properties
		try {
			const parsed = JSON.parse(this.getValue());
			this.width_ = parsed.width || 800;
			this.height_ = parsed.height || 600;
			this.objects_ = Array.isArray(parsed.objects) ? parsed.objects : [];

			// Initialize tile map
			const tileSize = this.editorConfig.tileSize;
			const cols = Math.ceil(this.width_ / tileSize);
			const rows = Math.ceil(this.height_ / tileSize);

			this.tileMap_ = [];
			for (let y = 0; y < rows; y++) {
				this.tileMap_[y] = new Array(cols).fill(0);
			}

			// Fill with existing tiles if available
			if (Array.isArray(parsed.tiles)) {
				if (parsed.tiles.length === cols * rows) {
					// Flat array format
					for (let y = 0; y < rows; y++) {
						for (let x = 0; x < cols; x++) {
							this.tileMap_[y][x] = parsed.tiles[y * cols + x] || 0;
						}
					}
				} else if (Array.isArray(parsed.tiles[0])) {
					// 2D array format
					this.tileMap_ = parsed.tiles;
				}
			}

			if (parsed.gridSize) {
				this.editorConfig.gridSize = parsed.gridSize;
				this.editorConfig.tileSize = parsed.gridSize;
			}
		} catch (e) {
			console.error('Error parsing initial value:', e);
			// Fall back to defaults
			this.resetToDefaults();
		}
	}

	// Инициализация карты тайлов из сохраненных данных
	initializeTileMap(tiles, width, height) {
		const tileSize = this.editorConfig.tileSize;
		const cols = Math.ceil(width / tileSize);
		const rows = Math.ceil(height / tileSize);

		this.tileMap_ = [];

		// Создаем пустой 2D массив
		for (let y = 0; y < rows; y++) {
			this.tileMap_[y] = new Array(cols).fill(0);
		}

		// Заполняем сохраненными данными, если они есть
		if (Array.isArray(tiles)) {
			if (tiles.length === cols * rows) {
				// Конвертируем из плоского массива в 2D
				for (let y = 0; y < rows; y++) {
					for (let x = 0; x < cols; x++) {
						this.tileMap_[y][x] = tiles[y * cols + x];
					}
				}
			} else if (Array.isArray(tiles[0])) {
				// Уже в 2D формате
				this.tileMap_ = tiles;
			}
		}
	}

	// Конвертируем 2D массив тайлов в плоский для сохранения
	getTileMapAsFlatArray() {
		const flatArray = [];
		for (let y = 0; y < this.tileMap_.length; y++) {
			flatArray.push(...this.tileMap_[y]);
		}
		return flatArray;
	}
	
	updatePrototypeSprites() {
  // Очищаем кеш изображений
  this.imageCache = {};
  
  // Перезагружаем все спрайты прототипов
  proto_object_array.forEach((proto, index) => {
    const img = new Image();
    img.onerror = () => {
      console.error(`Failed to load image: ${proto.sprite}`);
      // Запасное изображение при ошибке загрузки
      img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="red"/><text x="16" y="16" font-family="Arial" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="white">ERR</text></svg>';
    };
    img.src = proto.sprite;
    this.imageCache[index] = img;
  });
}

	resetToDefaults() {
		this.width_ = 800;
		this.height_ = 600;
		this.objects_ = [];

		// Initialize tile map with default size
		const tileSize = this.editorConfig.tileSize;
		const cols = Math.ceil(this.width_ / tileSize);
		const rows = Math.ceil(this.height_ / tileSize);

		this.tileMap_ = [];
		for (let y = 0; y < rows; y++) {
			this.tileMap_[y] = new Array(cols).fill(0);
		}

		super.setValue(this.getDefaultValue());
	}

	getDefaultValue() {
		return JSON.stringify({
			objects: [],
			tiles: this.getTileMapAsFlatArray(), // Конвертируем в плоский массив для сохранения
			width: 800,
			height: 600,
			gridSize: this.editorConfig ? this.editorConfig.gridSize : 32
		});
	}

	doClassValidation_(newValue) {
	  if (!newValue) return this.getDefaultValue();

	  try {
		const parsed = JSON.parse(newValue);
		// Конвертируем старые объекты (с protoName) в новые (с protoName)
		const objects = Array.isArray(parsed.objects) ? parsed.objects.map(obj => {
		  if (obj.protoName) {
			return obj; // Уже новый формат
		  } else if (obj.protoName !== undefined) {
			// Конвертируем старый формат в новый
			const proto = proto_object_array[obj.protoName];
			return proto ? {
			  protoName: workspace.getVariableById(proto.name).name,
			  x: obj.x,
			  y: obj.y
			} : null;
		  }
		  return null;
		}).filter(Boolean) : [];

		return JSON.stringify({
		  objects: objects,
		  tiles: Array.isArray(parsed.tiles) ? parsed.tiles : this.getTileMapAsFlatArray(),
		  width: typeof parsed.width === 'number' ? parsed.width : 800,
		  height: typeof parsed.height === 'number' ? parsed.height : 600,
		  gridSize: typeof parsed.gridSize === 'number' ? parsed.gridSize : (this.editorConfig ? this.editorConfig.gridSize : 32)
		});
	  } catch (e) {
		return this.getDefaultValue();
	  }
	}

	setValue(newValue) {
		this.safeSetValue(newValue);
		return this;
	}

	getValue() {
		// Ensure tileMap_ is initialized
		if (!this.tileMap_ || this.tileMap_.length === 0) {
			const tileSize = this.editorConfig.tileSize;
			const cols = Math.ceil(this.width_ / tileSize);
			const rows = Math.ceil(this.height_ / tileSize);

			this.tileMap_ = [];
			for (let y = 0; y < rows; y++) {
				this.tileMap_[y] = new Array(cols).fill(0);
			}
		}

		// Ensure objects_ is initialized
		if (!this.objects_) {
			this.objects_ = [];
		}

		return JSON.stringify({
			objects: this.objects_,
			tiles: this.getTileMapAsFlatArray(),
			width: this.width_,
			height: this.height_,
			gridSize: this.editorConfig.gridSize
		});
	}

	rescaleTileMap(oldWidth, oldHeight, oldTileSize, newWidth, newHeight, newTileSize) {
		// 1. Валидация параметров
		if ([oldWidth, oldHeight, oldTileSize, newWidth, newHeight, newTileSize].some(v => v <= 0)) {
			console.error("Invalid parameters - all values must be positive", {
				oldWidth,
				oldHeight,
				oldTileSize,
				newWidth,
				newHeight,
				newTileSize
			});
			return this.tileMap_;
		}

		// 2. Рассчитываем размеры сетки
		const oldCols = Math.ceil(oldWidth / oldTileSize);
		const oldRows = Math.ceil(oldHeight / oldTileSize);
		const newCols = Math.ceil(newWidth / newTileSize);
		const newRows = Math.ceil(newHeight / newTileSize);

		// 3. Проверка на максимальный размер
		const MAX_TILES = 2_000_000; // Лимит для производительности
		if (newCols * newRows > MAX_TILES) {
			console.error(`Tilemap too large: ${newCols * newRows} tiles (max ${MAX_TILES})`);
			return this.tileMap_;
		}

		// 4. Создаем новую карту (2D массив) и копируем старые тайлы
		const newTileMap = [];
		for (let y = 0; y < newRows; y++) {
			newTileMap[y] = new Array(newCols).fill(0);

			// Копируем тайлы из старой карты, если они попадают в новые границы
			if (y < oldRows) {
				for (let x = 0; x < Math.min(oldCols, newCols); x++) {
					if (x < this.tileMap_[y].length) {
						newTileMap[y][x] = this.tileMap_[y][x];
					}
				}
			}
		}

		return newTileMap;
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
        gap: 3px;
        margin-right: 10px;
      }

      .tool-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #eee !important;
        border-color: #ccc !important;
        color: #999 !important;
      }

      .tool-btn {
        padding: 9px 8px;
        border: 2px solid hsl(210, 11%, 85%);
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 15px;
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
        padding: 10px 6px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
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

      /* Tile editor styles */
      .tile-tools {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .tile-layer-toggle {
        display: flex;
        gap: 5px;
        align-items: center;
      }

      .tile-palette {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
        gap: 5px;
        margin-bottom: 10px;
        padding: 10px;
        background: hsl(210, 11%, 98%);
        border-radius: 6px;
        max-height: 100px;
        overflow-y: auto;
      }

      .tile-item {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 2px;
        border: 1px solid #ddd;
        overflow: hidden;
      }

      .tile-item img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .tile-index {
        position: absolute;
        bottom: 2px;
        right: 2px;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        border-radius: 2px;
      }

      .tile-solid-toggle {
        position: absolute;
        top: 2px;
        right: 2px;
        background: rgba(255,0,0,0.7);
        color: white;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        cursor: pointer;
      }

      .tile-solid-toggle.active {
        background: rgba(0,255,0,0.7);
      }

      .tile-warning {
        background: rgba(255, 0, 0, 0.1);
        border: 1px dashed red;
        border-radius: 4px;
        margin-bottom: 5px;
        text-align: center;
        font-size: 12px;
      }

      .tile-item {
        min-width: 32px;
        min-height: 32px;
        position: relative;
        overflow: hidden;
      }
      
      .tile-item.selected {
        border: 2px solid hsl(217, 89%, 61%);
        transform: scale(1.05);
      }

      .tile-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        image-rendering: pixelated;
      }
	  
	  /* Заменяем иконки в кнопках */
    #select-btn i:before { content: '\\e810'; } /* cursor */
    #hand-btn i:before { content: '\\e804'; } /* up-hand */
    #delete-btn i:before { content: '\\e83d'; } /* trash */
    #clear-btn i:before { content: '\\e824'; } /* cancel-circled2 */
    #tile-mode-btn i:before { content: '\\e80a'; } /* brush-1 */
    
    /* Иконки для инструментов тайлов */
    #tile-draw-btn i:before { content: '\\e818'; } /* pencil */
    #tile-erase-btn i:before { content: '\\e824'; } /* cancel-circled2 */
    #tile-fill-btn i:before { content: '\\e813'; } /* tint */
    #tile-rect-btn i:before { content: '\\e80c'; } /* resize-full */
    
    /* Иконки управления */
    #zoom-out-btn i:before { content: '\\e81b'; } /* zoom-out */
    #zoom-in-btn i:before { content: '\\e81a'; } /* zoom-in */
    #reset-view-btn i:before { content: '\\e80d'; } /* resize-full-alt */
    #grid-toggle + span i:before { content: '\\e80e'; } /* resize-small */
    .grid-size-controls i:before { content: '\\e80f'; } /* resize-small-alt */
    .size-controls i:before { content: '\\e80c'; } /* resize-full */
    
    /* Иконки для кнопок действий */
    #close-editor-btn i:before { content: '\\e823'; } /* cancel-circled */

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

	// Добавляем в метод render_() класса FieldLevelEditor
	render_() {
		this.updateSize_();
		this.createBorderRect_();
		this.createTextElement_();

		if (!this.fieldGroup_) {
			this.fieldGroup_ = Blockly.utils.dom.createSvgElement(
					'g', {},
					null);
		} else {
			this.fieldGroup_.innerHTML = '';
		}

		const container = Blockly.utils.dom.createSvgElement(
				'svg', {
				'width': this.size_.width,
				'height': this.size_.height,
				'viewBox': `0 0 ${this.size_.width} ${this.size_.height}`
			},
				this.fieldGroup_);

		// Background with white color
		const background = Blockly.utils.dom.createSvgElement(
				'rect', {
				'width': '100%',
				'height': '100%',
				'fill': 'white',
				'stroke': '#000',
				'stroke-width': '1'
			},
				container);

		// Create level preview (64x64 tiles as pixels)
		if (this.tileMap_ && this.tileMap_.length > 0) {
			const previewSize = 64;
			const tileSize = this.editorConfig.tileSize;
			const cols = this.tileMap_[0].length;
			const rows = this.tileMap_.length;

			const scaleX = cols > 16 ? 16 / cols : 1;
			const scaleY = rows > 16 ? 16 / rows : 1;
			const scale = Math.min(scaleX, scaleY);

			const preview = Blockly.utils.dom.createSvgElement(
					'svg', {
					'x': '0',
					'y': '0',
					'width': previewSize,
					'height': previewSize,
					'viewBox': `0 0 52 52`,
					'preserveAspectRatio': 'none'
				},
					container);

			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = 1;
			tempCanvas.height = 1;
			const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

			const startX = Math.max(0, Math.floor((cols - 16) / 2));
			const startY = Math.max(0, Math.floor((rows - 16) / 2));

			for (let y = 0; y < 16; y++) {
				const levelY = startY + Math.floor(y / scale);
				if (levelY >= rows)
					continue;

				for (let x = 0; x < 16; x++) {
					const levelX = startX + Math.floor(x / scale);
					if (levelX >= cols)
						continue;

					const tileValue = this.tileMap_[levelY][levelX];
					if (tileValue === 0)
						continue;

					const tileIndex = tileValue >= 1000 ? tileValue - 1000 : tileValue;
					const tileImg = this.tileCache[tileIndex];
					if (!tileImg)
						continue;

					tempCtx.clearRect(0, 0, 1, 1);
					tempCtx.drawImage(tileImg,
						Math.floor(tileSize / 2), Math.floor(tileSize / 2), 1, 1,
						0, 0, 1, 1);
					const pixelData = tempCtx.getImageData(0, 0, 1, 1).data;

					const pixel = Blockly.utils.dom.createSvgElement(
							'rect', {
							'x': x * 4,
							'y': y * 4,
							'width': 4,
							'height': 4,
							'fill': `rgb(${pixelData[0]},${pixelData[1]},${pixelData[2]})`
						},
							preview);

					if (tileValue >= 1000) {
						pixel.setAttribute('stroke', 'red');
						pixel.setAttribute('stroke-width', '0.5');
					}
				}
			}
		}

		// Текст с белой обводкой поверх превью
		const textElement = Blockly.utils.dom.createSvgElement(
				'text', {
				'x': '32',
				'y': '32',
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				'font-size': '10px',
				'fill': '#555',
				'stroke': 'white',
				'stroke-width': '3',
				'stroke-linejoin': 'round',
				'paint-order': 'stroke'
			},
				container);

		try {
			const data = JSON.parse(this.value_);
			const objects = data.objects || [];
			textElement.textContent = objects.length > 0 ?
`${objects.length}\n${Blockly.Msg['OBJECT_NAME_LABEL_ONE']}` :
				Blockly.Msg['CLICK_TO_EDIT'];
		} catch (e) {
			textElement.textContent = Blockly.Msg['CLICK_TO_EDIT'];
		}

		this.updateSize_();
	}

	updateSize_() {
		this.size_.width = 64;
		this.size_.height = 64;
	}

	showEditor_() {
	  // Обновляем спрайты перед открытием редактора
	  this.updatePrototypeSprites();
	  
	  const modal = this.createEditorModal_();
	  document.body.appendChild(modal);
	  this.initializeEditor_(modal);
	}

	getTilesetFromBlock() {
		const block = this.getSourceBlock();
		if (!block)
			return null;

		const input = block.getInput('TILESET');
		if (!input || !input.connection)
			return null;

		const tilesetBlock = input.connection.targetBlock();
		if (!tilesetBlock || tilesetBlock.type !== 'field_png')
			return null;

		const imageField = tilesetBlock.getField('IMAGE');
		return imageField ? imageField.getValue() : null;
	}

	createEditorModal_() {
		const modal = document.createElement('div');
		modal.className = 'level-editor-modal';

		const editorContainer = document.createElement('div');
		editorContainer.className = 'editor-container';
		const hasTileset = !!this.getTilesetFromBlock();

		editorContainer.innerHTML = `
 <div class="tools">
  <div class="tool-buttons">
    <button id="select-btn" class="tool-btn active" title="${Blockly.Msg['TOOL_SELECT_TITLE']}"><i class="icon-cursor"></i></button>
    <button id="hand-btn" class="tool-btn" title="${Blockly.Msg['TOOL_HAND_TITLE']}"><i class="icon-up-hand"></i></button>
    <button id="delete-btn" class="tool-btn" title="${Blockly.Msg['TOOL_DELETE_TITLE']}"><i class="icon-cancel-circled2"></i></button>
    <button id="clear-btn" class="tool-btn" title="${Blockly.Msg['TOOL_CLEAR_TITLE']}"><i class="icon-trash"></i></button>
    <button id="tile-mode-btn" class="tool-btn" ${!hasTileset ? 'disabled' : ''} title="${hasTileset ? Blockly.Msg['TOOL_TILEMODE_TITLE'] : Blockly.Msg['TOOL_NOTILESET_WARNING']}">
      <i class="icon-brush-1"></i>
    </button>
  </div>
  
  <label class="grid-toggle checkbox-container">
    <input type="checkbox" id="grid-toggle" checked>
    <span class="checkbox-custom"></span>
    <label for="grid-toggle"><span><i class="icon-resize-small"></i> </span>${Blockly.Msg['TOOL_GRID_LABEL']}</label>
  </label>
  
  <div class="grid-size-controls">
    <input type="number" id="grid-size-input" class="size-input" min="1" max="128" value="${this.editorConfig.gridSize}" placeholder="${Blockly.Msg['TOOL_GRIDSIZE_PLACEHOLDER']}">
    <button id="grid-size-btn" class="tool-btn" title="${Blockly.Msg['TOOL_SETGRIDSIZE_TITLE']}"><i class="icon-cancel-circled"></i></button>
  </div>
  
  <div class="size-controls">
    <input type="number" id="width-input" class="size-input" min="1" max="10000" placeholder="${Blockly.Msg['TOOL_WIDTH_PLACEHOLDER']}">
    <span>x</span>
    <input type="number" id="height-input" class="size-input" min="1" max="10000" placeholder="${Blockly.Msg['TOOL_HEIGHT_PLACEHOLDER']}">
    <button id="resize-btn" class="tool-btn" title="${Blockly.Msg['TOOL_RESIZE_TITLE']}"><i class="icon-cancel-circled"></i></button>
  </div>
  
  <div class="editor-controls">
    <div class="zoom-controls">
      <button id="zoom-out-btn" class="tool-btn" title="${Blockly.Msg['TOOL_ZOOMOUT_TITLE']}"><i class="icon-zoom-out"></i></button>
      <span class="zoom-value">100%</span>
      <button id="zoom-in-btn" class="tool-btn" title="${Blockly.Msg['TOOL_ZOOMIN_TITLE']}"><i class="icon-zoom-in"></i></button>
      <button id="reset-view-btn" class="tool-btn" title="${Blockly.Msg['TOOL_RESETVIEW_TITLE']}"><i class="icon-resize-full-alt"></i></button>
    </div>
  </div>
  
  <button id="close-editor-btn" class="action-btn btn-warning"><i class="icon-cancel-circled"></i>${Blockly.Msg['TOOL_CLOSE_BUTTON']}</button>
</div>

<div id="tile-tools" class="tile-tools" style="display: none;">
  <div class="tile-layer-toggle">
    <button id="tile-draw-btn" class="tool-btn active"><i class="icon-pencil"></i>${Blockly.Msg['TILE_DRAW_BUTTON']}</button>
    <button id="tile-erase-btn" class="tool-btn"><i class="icon-cancel-circled2"></i>${Blockly.Msg['TILE_ERASE_BUTTON']}</button>
    <button id="tile-fill-btn" class="tool-btn"><i class="icon-tint"></i>${Blockly.Msg['TILE_FILL_BUTTON']}</button>
    <button id="tile-rect-btn" class="tool-btn"><i class="icon-resize-full"></i>${Blockly.Msg['TILE_RECT_BUTTON']}</button>
  </div>
  <div>
    <label class="checkbox-container">
      <input type="checkbox" id="tile-solid-toggle">
      <span class="checkbox-custom"></span>
      <label for="tile-solid-toggle">${Blockly.Msg['TILE_SOLID_LABEL']}</label>
    </label>
  </div>
</div>
  
<div id="tile-palette" class="tile-palette" style="display: none;"></div>
  
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
		const MODES = {
			SELECT: 'select',
			HAND: 'hand',
			DELETE: 'delete',
			PLACE_OBJECT: 'place_object',
			TILE_DRAW: 'tile_draw',
			TILE_ERASE: 'tile_erase',
			TILE_FILL: 'tile_fill',
			TILE_RECT: 'tile_rect'
		};

		const savedData = this.value_ ? JSON.parse(this.value_) : {};
		this.editorConfig.gridSize = savedData.gridSize || 32;
		this.width_ = savedData.width || 800;
		this.height_ = savedData.height || 600;
		this.objects_ = Array.isArray(savedData.objects) ? savedData.objects : [];
		this.selectedTileSolid = false;
		const solidToggle = modal.querySelector('#tile-solid-toggle');
		solidToggle.checked = false;

		// Initialize tile map (convert from flat array to 2D if needed)
		this.initializeTileMap(savedData.tiles, this.width_, this.height_);

		rebuildProtoObjectArray();
		if (proto_object_array.length == 0) {
			showSwitchModal('error', Blockly.Msg['ERROR_NO_PROTOTYPES'], false, 'ok');
		}

		const self = this;
		const canvasContainer = modal.querySelector('#editor-canvas-container');
		const canvas = modal.querySelector('#editor-canvas');
		const ctx = canvas.getContext('2d', {
			willReadFrequently: true
		});
		const widthInput = modal.querySelector('#width-input');
		const heightInput = modal.querySelector('#height-input');
		const gridToggle = modal.querySelector('#grid-toggle');
		const gridSizeInput = modal.querySelector('#grid-size-input');
		const tileModeBtn = modal.querySelector('#tile-mode-btn');
		const tileTools = modal.querySelector('#tile-tools');
		const tilePalette = modal.querySelector('#tile-palette');
		const objectPalette = modal.querySelector('#object-palette');
		const zoomValue = modal.querySelector('.zoom-value');
		const MIN_TILE_SIZE = 8;

		// Add cursor coordinates display to modal
		const coordsDisplay = document.createElement('div');
		coordsDisplay.className = 'cursor-coordinates';
		coordsDisplay.textContent = '0, 0';
		modal.appendChild(coordsDisplay);
		let isMouseDown = false;

		// Global mouse up handler
		const globalMouseUpHandler = () => {
			isPanning = false;
			isDragging = false;
			isMouseDown = false;
			canvas.style.cursor = currentTool === MODES.HAND ? 'grab' : 'crosshair';
		};

		document.addEventListener('mouseup', globalMouseUpHandler);
		document.addEventListener('touchend', globalMouseUpHandler);

		// Editor state
		let currentTool = MODES.SELECT;
		let isDragging = false;
		let dragStartX,
		dragStartY;
		let selectedObjectIndex = -1;
		let selectedProtoIndex = -1;
		let selectedProtoName = '';
		let objects = [];
		let showGrid = true;
		let tempRect = null;

		// Tile editor state
		let isTileMode = false;
		let selectedTileIndex = -1;
		let selectedTileSolid = false;
		let tileBrush = MODES.TILE_DRAW;
		let tileStartX,
		tileStartY;
		let lastPlacedTile = {
			x: -1,
			y: -1
		};

		// View state
		let zoom = 1;
		let offsetX = 0;
		let offsetY = 0;
		let isPanning = false;
		let lastX,
		lastY;
		let isTilesetLoaded = false;
		let rectStartX,
		rectStartY;
		let isDrawingRect = false;
		objects = this.objects_;

		const createFallbackTileset = () => {
			const size = 64;
			const tileSize = 16;
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = size;
			tempCanvas.height = size;
			const tempCtx = tempCanvas.getContext('2d');

			tempCtx.fillStyle = '#f0f0f0';
			tempCtx.fillRect(0, 0, size, size);

			const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc'];
			colors.forEach((color, i) => {
				tempCtx.fillStyle = color;
				tempCtx.fillRect(i * tileSize, 0, tileSize, tileSize);
				tempCtx.strokeStyle = '#999';
				tempCtx.strokeRect(i * tileSize, 0, tileSize, tileSize);
			});

			const tilesetImg = new Image();
			tilesetImg.onload = () => {
				self.tileCache.tileset = tilesetImg;
				isTilesetLoaded = true;
				self.editorConfig.tileSize = tileSize;
				updateTilePalette();
				drawCanvas();
			};
			tilesetImg.src = tempCanvas.toDataURL();
		};

		// Load tileset function
		const loadTileset = () => {
			const tilesetData = this.getTilesetFromBlock();

			if (tilesetData) {
				// Очищаем кеш тайлов при каждом открытии редактора
				self.tileCache = {};

				const tilesetImg = new Image();

				tilesetImg.crossOrigin = "Anonymous";

				tilesetImg.onload = () => {
					self.tileCache.tileset = tilesetImg;
					isTilesetLoaded = true;
					updateTilePalette();
					drawCanvas();
				};

				tilesetImg.onerror = (e) => {
					console.error("❌ Tileset failed to load!", e);
					createFallbackTileset();
				};

				tilesetImg.src = tilesetData;
			} else {
				console.warn("No tileset data found in block!");
				createFallbackTileset();
			}
		};

		loadTileset();

		function resetAllSelections() {
			modal.querySelectorAll('.tool-btn').forEach(btn => {
				btn.classList.remove('active');
			});

			objectPalette.querySelectorAll('.object-item').forEach(item => {
				item.classList.remove('selected');
			});

			tilePalette.querySelectorAll('.tile-item').forEach(item => {
				item.classList.remove('selected');
			});
		}

		const tilesetData = this.getTilesetFromBlock();
		if (tilesetData) {
			const tilesetImg = new Image();
			tilesetImg.onload = () => {
				this.tileCache.tileset = tilesetImg;
				tileModeBtn.disabled = false;
				tileModeBtn.title = Blockly.Msg['LEVEL_TILE_MODE'];
			};
			tilesetImg.onerror = () => {
				tileModeBtn.disabled = true;
				tileModeBtn.title = Blockly.Msg['NO_TILESET_WARNING'];
			};
			tilesetImg.src = tilesetData;
		} else {
			tileModeBtn.disabled = true;
			tileModeBtn.title = Blockly.Msg['NO_TILESET_WARNING'];
		}

		// Preload images
		const preloadImages = () => {
			const tilesetData = this.getTilesetFromBlock();
			self.updatePrototypeSprites();
			if (tilesetData) {
				if (!self.tileCache.tileset || self.tileCache.tileset.src !== tilesetData) {
					const tilesetImg = new Image();
					tilesetImg.onload = () => {
						self.tileCache.tileset = tilesetImg;
						updateTilePalette();
						drawCanvas();
					};
					tilesetImg.onerror = () => {
						console.error('Failed to load tileset image');
					};
					tilesetImg.src = tilesetData;
				}
			}

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

		// Update tile palette with tiles from the tileset
		const updateTilePalette = () => {
			const tileset = self.tileCache.tileset;

			if (!tileset || !tileset.complete || tileset.naturalWidth === 0) {
				return;
			}

			tilePalette.innerHTML = '';
			const tileSize = self.editorConfig.tileSize;

			if (tileSize < 8) {
				const warning = document.createElement('div');
				warning.className = 'tile-warning';
				warning.textContent = 'Tile size too small (min 8px)';
				tilePalette.appendChild(warning);
				return;
			}

			const tilesPerRow = Math.floor(tileset.width / tileSize);
			const tilesPerCol = Math.floor(tileset.height / tileSize);
			const tileCount = tilesPerRow * tilesPerCol;
			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = tileSize;
			tempCanvas.height = tileSize;
			const tempCtx = tempCanvas.getContext('2d');
			const displaySize = Math.max(32, self.editorConfig.tileSize);

			for (let i = 1; i <= tileCount; i++) {
				const tileX = ((i - 1) % tilesPerRow) * tileSize;
				const tileY = Math.floor((i - 1) / tilesPerRow) * tileSize;

				tempCtx.clearRect(0, 0, tileSize, tileSize);
				tempCtx.drawImage(
					tileset,
					tileX, tileY, tileSize, tileSize,
					0, 0, tileSize, tileSize);

				const tileDataUrl = tempCanvas.toDataURL();

				const tileItem = document.createElement('div');
				tileItem.className = 'tile-item';
				tileItem.style.width = `${displaySize}px`;
				tileItem.style.height = `${displaySize}px`;
				tileItem.dataset.index = i;
				tileItem.addEventListener('click', function () {
					const solidToggle = modal.querySelector('#tile-solid-toggle');
					// Просто синхронизируем с текущим состоянием selectedTileSolid
					solidToggle.checked = selectedTileSolid;
				});

				const tileImg = document.createElement('img');
				tileImg.src = tileDataUrl;
				tileImg.style.width = '100%';
				tileImg.style.height = '100%';
				tileImg.style.objectFit = 'cover';

				const tileIndex = document.createElement('div');
				tileIndex.className = 'tile-index';
				tileIndex.textContent = i;

				tileItem.appendChild(tileImg);
				tileItem.appendChild(tileIndex);
				tilePalette.appendChild(tileItem);

				if (!self.tileCache[i]) {
					const img = new Image();
					img.src = tileDataUrl;
					self.tileCache[i] = img;
				}
			}
		};

		const updateTilePaletteWithWarning = () => {
			if (!self.tileCache.tileset)
				return;

			const tileSize = self.editorConfig.tileSize;
			const tileset = self.tileCache.tileset;

			if (tileSize < MIN_TILE_SIZE) {
				showSwitchModal('!', `Tile size (${tileSize}px) is smaller than recommended minimum (${MIN_TILE_SIZE}px). Some tiles may display incorrectly.`, false, 'ok');
			}

			if (tileset.width < tileSize || tileset.height < tileSize) {
				showSwitchModal('!', `Warning: Tileset size (${tileset.width}x${tileset.height}px) is smaller than tile size (${tileSize}px).
               Cannot create tiles of this size.`, false, 'ok');
				return;
			}

			updateTilePalette();
		};

		// Helper function to remove objects outside bounds
		const removeOutOfBoundsObjects = (newWidth, newHeight) => {
			const keptObjects = [];
			let removedCount = 0;

			objects.forEach(obj => {
				const proto = proto_object_array[obj.protoName];
				if (proto) {
					if (obj.x + proto.width <= newWidth && obj.y + proto.height <= newHeight) {
						keptObjects.push(obj);
					} else {
						removedCount++;
					}
				} else {
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
			canvas.style.width = `${this.width_ * zoom}px`;
			canvas.style.height = `${this.height_ * zoom}px`;
			canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
			zoomValue.textContent = `${Math.round(zoom * 100)}%`;

			widthInput.value = this.width_;
			heightInput.value = this.height_;

			canvasContainer.scrollLeft = -offsetX;
			canvasContainer.scrollTop = -offsetY;

			drawCanvas();
		};

		const centerView = () => {
			const containerWidth = canvasContainer.clientWidth;
			const containerHeight = canvasContainer.clientHeight;
			const scaledWidth = this.width_ * zoom;
			const scaledHeight = this.height_ * zoom;

			// Устанавливаем смещение так, чтобы верхний левый угол был виден
			offsetX = 0;  // Начинаем с левого края
			offsetY = 0;   // Начинаем с верхнего края

			// Если уровень меньше контейнера, центрируем (опционально)
			if (scaledWidth < containerWidth) {
				offsetX = (containerWidth - scaledWidth) / 2;
			}
			if (scaledHeight < containerHeight) {
				offsetY = (containerHeight - scaledHeight) / 2;
			}

			canvasContainer.scrollLeft = -offsetX;
			canvasContainer.scrollTop = -offsetY;

			updateView();
		};

		const getPixelCoordinates = (clientX, clientY) => {
			const rect = canvasContainer.getBoundingClientRect();
			const scrollLeft = canvasContainer.scrollLeft;
			const scrollTop = canvasContainer.scrollTop;

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

		// Буферные холсты и кэшированные значения
		const bufferCanvas = document.createElement('canvas');
		const bufferCtx = bufferCanvas.getContext('2d');
		let isBufferDirty = true;

		// Кэшированные значения для оптимизации
		let cachedTileSize = 0;
		let cachedGridSize = 0;
		let cachedGridColor = '';
		let cachedWidth = 0;
		let cachedHeight = 0;

		const drawCanvasWithTempRect = () => {
			// Перерисовываем буфер только если нужно
			if (isBufferDirty) {
				drawBaseCanvasContent(bufferCanvas, bufferCtx);
				isBufferDirty = false;

				// Обновляем кэшированные размеры
				cachedWidth = bufferCanvas.width;
				cachedHeight = bufferCanvas.height;
			}

			// Быстрое копирование буфера
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(bufferCanvas, 0, 0);

			// Рисуем только временный прямоугольник поверх
			if (tempRect) {
				ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
				ctx.fillRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);

				ctx.strokeStyle = '#00FF00';
				ctx.lineWidth = 2;
				ctx.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
			}
		};

		const drawBaseCanvasContent = (targetCanvas = canvas, targetCtx = ctx) => {
			// Оптимизация: проверяем, изменились ли размеры
			const needsResize = targetCanvas.width !== this.width_ || targetCanvas.height !== this.height_;
			if (needsResize) {
				targetCanvas.width = this.width_;
				targetCanvas.height = this.height_;
			}

			targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

			// Рисуем тайлы
			if (isTilesetLoaded) {
				const tileSize = self.editorConfig.tileSize;
				cachedTileSize = tileSize;

				const visibleStartX = 0;
				const visibleStartY = 0;
				const visibleEndX = Math.ceil(this.width_ / tileSize);
				const visibleEndY = Math.ceil(this.height_ / tileSize);

				for (let y = visibleStartY; y < Math.min(self.tileMap_.length, visibleEndY); y++) {
					const row = self.tileMap_[y];
					for (let x = visibleStartX; x < Math.min(row.length, visibleEndX); x++) {
						const tileValue = row[x];
						if (tileValue === 0)
							continue;

						const isSolid = tileValue >= 1000;
						const tileIndex = isSolid ? tileValue - 1000 : tileValue;

						if (tileIndex >= self.editorConfig.minTileIndex && self.tileCache[tileIndex]) {
							const drawX = x * tileSize;
							const drawY = y * tileSize;

							targetCtx.drawImage(
								self.tileCache[tileIndex],
								drawX,
								drawY,
								tileSize,
								tileSize);

							if (isSolid) {
								targetCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
								targetCtx.lineWidth = 2;
								targetCtx.strokeRect(drawX, drawY, tileSize, tileSize);
							}
						}
					}
				}
			}

			// Исправленное рисование сетки - всегда рисуем заново
			if (showGrid) {
				const gridSize = self.editorConfig.gridSize;
				const gridColor = self.editorConfig.gridColor;
				
				// Не рисуем сетку если она слишком мелкая (меньше 2px между линиями)
				const gridScreenSize = gridSize * zoom;
				if (gridScreenSize >= 2) {
					targetCtx.strokeStyle = gridColor;
					targetCtx.lineWidth = 1;
					
					// Оптимизация: вычисляем только видимые линии
					const startX = Math.floor(0 / gridSize) * gridSize;
					const startY = Math.floor(0 / gridSize) * gridSize;
					const endX = Math.ceil(this.width_ / gridSize) * gridSize;
					const endY = Math.ceil(this.height_ / gridSize) * gridSize;
					
					targetCtx.beginPath();
					
					// Вертикальные линии (только видимые)
					for (let x = startX; x <= endX; x += gridSize) {
						targetCtx.moveTo(x, 0);
						targetCtx.lineTo(x, this.height_);
					}
					
					// Горизонтальные линии (только видимые)
					for (let y = startY; y <= endY; y += gridSize) {
						targetCtx.moveTo(0, y);
						targetCtx.lineTo(this.width_, y);
					}
					
					targetCtx.stroke();
				}
				
				// Сохраняем параметры для других оптимизаций
				cachedGridSize = gridSize;
				cachedGridColor = gridColor;
			}

			// Оптимизация рисования объектов
			const objectAlpha = isTileMode ? 0.5 : 1.0;
			if (this.objects_.length > 0) {
				if (!isTileMode) {
					targetCtx.globalAlpha = 1.0;
					drawObjects(targetCtx, false);
				}

				if (isTileMode) {
					targetCtx.globalAlpha = 0.5;
					drawObjects(targetCtx, true);
				}

				targetCtx.globalAlpha = 1.0;
			}
		};

		// Вынесенная функция для рисования объектов
		const drawObjects = (targetCtx, includeSelection = true) => {
		  this.objects_.forEach((obj, index) => {
			// Находим прототип по имени переменной
			const proto = proto_object_array.find(p => 
			  workspace.getVariableById(p.name).name === obj.protoName);
			if (!proto) return;

			const img = this.imageCache[proto_object_array.indexOf(proto)];
			if (img) {
			  targetCtx.drawImage(img, obj.x, obj.y, proto.width, proto.height);

			  if (index === selectedObjectIndex && index === selectedObjectIndex) {
				targetCtx.strokeStyle = '#00f';
				targetCtx.lineWidth = 2;
				targetCtx.strokeRect(obj.x, obj.y, proto.width, proto.height);
			  }
			}
		  });
		};

		const drawCanvas = () => {
		  if (!isTilesetLoaded) {
			// Режим загрузки: рисуем напрямую на canvas
			drawBaseCanvasContent(canvas, ctx);
		  } else {
			// Режим буферизации: рисуем через bufferCanvas
			if (isBufferDirty) {
			  drawBaseCanvasContent(bufferCanvas, bufferCtx);
			  isBufferDirty = false;
			}
			// Копируем буфер на основной холст
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(bufferCanvas, 0, 0);
		  }

		  // Дорисовываем временные элементы (выделение, рамки)
		  if (tempRect) {
			ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
			ctx.fillRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
			ctx.strokeStyle = '#00FF00';
			ctx.lineWidth = 2;
			ctx.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
		  }
		};

		// Функция для пометки буфера как устаревшего
		const markBufferDirty = () => {
			isBufferDirty = true;
		};

		// Оптимизация: обновляем кэшированные значения при изменении конфигурации
		const updateCachedValues = () => {
			cachedTileSize = self.editorConfig.tileSize;
			cachedGridSize = self.editorConfig.gridSize;
			cachedGridColor = self.editorConfig.gridColor;
			cachedWidth = this.width_;
			cachedHeight = this.height_;
			isBufferDirty = true;
		};

		const findObjectAt = (x, y) => {
		  for (let i = this.objects_.length - 1; i >= 0; i--) {
			const obj = this.objects_[i];
			const proto = proto_object_array.find(p => 
			  workspace.getVariableById(p.name).name === obj.protoName);
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
				showSwitchModal('!', 'Invalid dimensions', false, 'ok');
				return;
			}

			const oldWidth = this.width_;
			const oldHeight = this.height_;

			// Обновляем размеры
			this.width_ = newWidth;
			this.height_ = newHeight;

			// Масштабируем тайлмап (если нужно)
			const tileSize = self.editorConfig.tileSize;
			this.tileMap_ = this.rescaleTileMap(
				oldWidth, oldHeight, tileSize,
				newWidth, newHeight, tileSize
			);

			// Удаляем объекты за пределами нового размера
			removeOutOfBoundsObjects(newWidth, newHeight);

			// Обновляем размеры canvas
			canvas.width = newWidth;
			canvas.height = newHeight;

			// Перерисовываем (без сброса масштаба/позиции)
			isBufferDirty = true;
			drawCanvas();
		};

		const setGridSize = (size) => {
			const newSize = parseInt(size);
			if (newSize < 1 || newSize > 256) {
				showSwitchModal('!', 'Grid size must be between 1 and 256', false, 'ok');
				return;
			}

			const oldSize = self.editorConfig.gridSize;
			self.editorConfig.gridSize = newSize;
			self.editorConfig.tileSize = newSize; // Если тайлы привязаны к сетке

			// Масштабируем тайлмап (если нужно)
			this.tileMap_ = this.rescaleTileMap(
				this.width_, this.height_, oldSize,
				this.width_, this.height_, newSize
			);

			// Обновляем палитру тайлов (если она зависит от размера)
			updateTilePalette();

			// Перерисовываем
			isBufferDirty = true;
			drawCanvas();
		};

		// Tile editor functions
		const getTileAt = (x, y) => {
			const tileSize = self.editorConfig.tileSize;
			const tileX = Math.floor(x / tileSize);
			const tileY = Math.floor(y / tileSize);

			if (tileY < 0 || tileY >= self.tileMap_.length ||
				tileX < 0 || tileX >= self.tileMap_[tileY].length) {
				return null;
			}

			return {
				x: tileX,
				y: tileY,
				value: self.tileMap_[tileY][tileX]
			};
		};

		const setTileAt = (x, y, value) => {
			const tileSize = self.editorConfig.tileSize;
			const tileX = Math.floor(x / tileSize);
			const tileY = Math.floor(y / tileSize);

			if (tileY < 0 || tileY >= self.tileMap_.length ||
				tileX < 0 || tileX >= self.tileMap_[tileY].length) {
				return false;
			}

			if (lastPlacedTile.x === tileX && lastPlacedTile.y === tileY) {
				return false;
			}

			lastPlacedTile = {
				x: tileX,
				y: tileY
			};

			// Новый код: value уже содержит правильный индекс (либо обычный, либо +1000)
			self.tileMap_[tileY][tileX] = value;
			markBufferDirty();
			return true;
		};

		const drawTileRect = (startX, startY, endX, endY, value) => {
			const tileSize = self.editorConfig.tileSize;
			const startTileX = Math.floor(Math.min(startX, endX) / tileSize);
			const startTileY = Math.floor(Math.min(startY, endY) / tileSize);
			const endTileX = Math.floor(Math.max(startX, endX) / tileSize);
			const endTileY = Math.floor(Math.max(startY, endY) / tileSize);

			for (let y = startTileY; y <= endTileY; y++) {
				if (y < 0 || y >= self.tileMap_.length)
					continue;

				for (let x = startTileX; x <= endTileX; x++) {
					if (x < 0 || x >= self.tileMap_[y].length)
						continue;

					self.tileMap_[y][x] = value;
				}
			}
		};

		const fillTiles = (startX, startY, targetValue, newValue) => {
			const tileSize = self.editorConfig.tileSize;
			const startTileX = Math.floor(startX / tileSize);
			const startTileY = Math.floor(startY / tileSize);

			if (startTileY < 0 || startTileY >= self.tileMap_.length ||
				startTileX < 0 || startTileX >= self.tileMap_[startTileY].length ||
				self.tileMap_[startTileY][startTileX] !== targetValue) {
				return;
			}

			const visited = new Array(self.tileMap_.length)
				.fill()
				.map(() => new Array(self.tileMap_[0].length).fill(false));

			const stack = [{
					x: startTileX,
					y: startTileY
				}
			];
			while (stack.length > 0) {
				const {
					x,
					y
				} = stack.pop();

				if (y < 0 || y >= self.tileMap_.length ||
					x < 0 || x >= self.tileMap_[y].length ||
					visited[y][x] || self.tileMap_[y][x] !== targetValue) {
					continue;
				}

				self.tileMap_[y][x] = newValue;
				visited[y][x] = true;

				stack.push({
					x: x + 1,
					y
				});
				stack.push({
					x: x - 1,
					y
				});
				stack.push({
					x,
					y: y + 1
				});
				stack.push({
					x,
					y: y - 1
				});
			}
		};

		// Initialize object palette
		proto_object_array.forEach((proto) => {
		  const protoName = workspace.getVariableById(proto.name).name;
		  const item = document.createElement('div');
		  item.className = 'object-item';
		  item.dataset.name = protoName; // Используем имя вместо индекса

		  const preview = document.createElement('div');
		  preview.className = 'object-preview';
		  preview.style.backgroundImage = `url(${proto.sprite})`;

		  const name = document.createElement('div');
		  name.className = 'object-name';
		  name.textContent = protoName + '(h' + proto.width + 'w' + proto.height + ')';

		  item.appendChild(preview);
		  item.appendChild(name);
		  objectPalette.appendChild(item);
		});

		// Set initial canvas size from stored value
		widthInput.value = this.width_;
		heightInput.value = this.height_;

		// Initialize canvas
		preloadImages();
		drawCanvas();
		centerView();

		// Reset selections
		const resetSelections = () => {
		  objectPalette.querySelectorAll('.object-item').forEach(item => {
			item.classList.remove('selected');
		  });
		  tilePalette.querySelectorAll('.tile-item').forEach(item => {
			item.classList.remove('selected');
		  });
		  selectedProtoIndex = -1;
		  selectedProtoName = ''; // Добавляем сброс имени
		};

		// Activate tool
		const activateTool = (tool, button) => {
			currentTool = tool;
			modal.querySelectorAll('.tool-btn').forEach(btn => {
				btn.classList.remove('active');
			});
			if (button) {
				button.classList.add('active');
			}
		};

		// Handle scroll events
		canvasContainer.addEventListener('scroll', () => {
			drawCanvas();
		});

		// Mouse move handler for cursor coordinates
		const handleMouseMove = (e) => {
			if (!isMouseDown)
				return;
			const coords = getPixelCoordinates(e.clientX, e.clientY);
			updateCursorCoordinates(coords.x, coords.y);

			if (isDragging && selectedObjectIndex !== -1 && currentTool === MODES.SELECT) {
				const obj = this.objects_[selectedObjectIndex];
				const proto = proto_object_array.find(p => 
					workspace.getVariableById(p.name).name === obj.protoName
				  );

				if (proto) {
					let newX = coords.x - dragStartX;
					let newY = coords.y - dragStartY;

					if (showGrid) {
						newX = snapToGrid(newX);
						newY = snapToGrid(newY);
					}

					// Ограничиваем позицию в пределах холста
					obj.x = Math.max(0, Math.min(this.width_ - proto.width, newX));
					obj.y = Math.max(0, Math.min(this.height_ - proto.height, newY));
					isBufferDirty = true;
					drawCanvas();
				}
				return;
			}

			if (isDrawingRect && tileBrush === MODES.TILE_RECT) {
				const coords = getPixelCoordinates(e.clientX, e.clientY);
				tempRect.width = coords.x - rectStartX;
				tempRect.height = coords.y - rectStartY;

				// Перерисовываем канвас с временным прямоугольником
				isBufferDirty = true;
				drawCanvasWithTempRect();
				return;
			}

			if (isTileMode && isDragging) {
				if (tileBrush === MODES.TILE_DRAW && selectedTileIndex !== -1) {
					const value = selectedTileSolid ? selectedTileIndex + 1000 : selectedTileIndex;
					if (setTileAt(coords.x, coords.y, value)) {
						isBufferDirty = true;
						drawCanvas();
					}
				} else if (tileBrush === MODES.TILE_ERASE) {
					if (setTileAt(coords.x, coords.y, 0)) {
						isBufferDirty = true;
						drawCanvas();
					}
				}
				return;
			}

			if (isPanning) {
				const dx = e.clientX - lastX;
				const dy = e.clientY - lastY;
				lastX = e.clientX;
				lastY = e.clientY;

				offsetX += dx;
				offsetY += dy;

				canvasContainer.scrollLeft = -offsetX;
				canvasContainer.scrollTop = -offsetY;
				updateView();
				return;
			}

			if (isDragging && selectedObjectIndex !== -1) {
				const coords = getPixelCoordinates(e.clientX, e.clientY);
				const obj = this.objects_[selectedObjectIndex];

				if (showGrid) {
					obj.x = snapToGrid(coords.x - dragStartX);
					obj.y = snapToGrid(coords.y - dragStartY);
				} else {
					obj.x = coords.x - dragStartX;
					obj.y = coords.y - dragStartY;
				}

				const proto = proto_object_array[obj.protoName];
				if (proto) {
					obj.x = Math.max(0, Math.min(this.width_ - proto.width, obj.x));
					obj.y = Math.max(0, Math.min(this.height_ - proto.height, obj.y));
				}
				isBufferDirty = true;
				requestAnimationFrame(drawCanvasWithTempRect);
			}
		};

		// Add mouse move listener
		document.addEventListener('mousemove', handleMouseMove);

		modal.querySelector('#tile-solid-toggle').addEventListener('change', function () {
			selectedTileSolid = this.checked;
		});
		// Tool selection event listeners
		modal.querySelectorAll('.tool-btn').forEach(btn => {
			btn.addEventListener('click', function () {
				if (this.id === 'clear-btn') {
					if (isTileMode) {
						let modal = showSwitchModal('!', Blockly.Msg['TILESET_CLEAR'], true, Blockly.Msg['YES']);
						modal.onConfirm(() => {
							for (let y = 0; y < self.tileMap_.length; y++) {
								self.tileMap_[y].fill(0);
							}
							drawCanvas();
						});
					} else {
						let modal = showSwitchModal('!', Blockly.Msg['OBJECT_CLEAR'], true, Blockly.Msg['YES']);
						modal.onConfirm(() => {
							self.objects_ = [];
							selectedObjectIndex = -1;
							selectedProtoIndex = -1;
							objectPalette.querySelectorAll('.object-item').forEach(i => i.classList.remove('selected'));
							drawCanvas();
						});
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

				if (this.id === 'tile-mode-btn') {
					resetSelections();
					activateTool(MODES.TILE_DRAW, this);
					isTileMode = !isTileMode;
					tileTools.style.display = isTileMode ? 'flex' : 'none';
					tilePalette.style.display = isTileMode ? 'grid' : 'none';
					objectPalette.style.display = isTileMode ? 'none' : 'grid';
					drawCanvas();
					return;
				}

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

				if (this.id === 'select-btn' || this.id === 'hand-btn' || this.id === 'delete-btn') {
					isTileMode = false;
					tileModeBtn.classList.remove('active');
					tileTools.style.display = 'none';
					tilePalette.style.display = 'none';
					objectPalette.style.display = 'grid';
				}
			});
		});

		// Tool handlers
		modal.querySelector('#select-btn').addEventListener('click', function () {
			resetSelections();
			activateTool(MODES.SELECT, this);
			isTileMode = false;
			tileTools.style.display = 'none';
			tilePalette.style.display = 'none';
			objectPalette.style.display = 'grid';
			canvas.style.cursor = 'crosshair';
			isBufferDirty = true;
			drawCanvas(); // Перерисовываем с нормальной прозрачностью
		});

		modal.querySelector('#hand-btn').addEventListener('click', function () {
			resetSelections();
			activateTool(MODES.HAND, this);
			isTileMode = false;
			tileTools.style.display = 'none';
			tilePalette.style.display = 'none';
			objectPalette.style.display = 'grid';
			canvas.style.cursor = 'grab';
		});

		modal.querySelector('#delete-btn').addEventListener('click', function () {
			resetSelections();
			activateTool(MODES.DELETE, this);
			isTileMode = false;
			tileTools.style.display = 'none';
			tilePalette.style.display = 'none';
			objectPalette.style.display = 'grid';
			canvas.style.cursor = 'not-allowed';
		});

		modal.querySelector('#tile-mode-btn').addEventListener('click', function () {
			resetSelections();
			activateTool(MODES.TILE_DRAW);
			isTileMode = true;
			tileTools.style.display = 'flex';
			tilePalette.style.display = 'grid';
			objectPalette.style.display = 'none';
			canvas.style.cursor = 'crosshair';
			modal.querySelector('#tile-draw-btn').classList.add('active');
			isBufferDirty = true;
			drawCanvas(); // Перерисовываем с новой прозрачностью
		});

		// Tile tool handlers
		modal.querySelector('#tile-draw-btn').addEventListener('click', function () {
			activateTool(MODES.TILE_DRAW, this);
			tileBrush = MODES.TILE_DRAW;
			canvas.style.cursor = 'crosshair';
		});

		modal.querySelector('#tile-erase-btn').addEventListener('click', function () {
			activateTool(MODES.TILE_ERASE, this);
			tileBrush = MODES.TILE_ERASE;
			canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"%23ff0000\" d=\"M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z\"/></svg>') 12 12, auto";
		});

		modal.querySelector('#tile-fill-btn').addEventListener('click', function () {
			activateTool(MODES.TILE_FILL, this);
			tileBrush = MODES.TILE_FILL;
			canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='%2300ff00' d='M10 4v4h4V4h-4m0 6v4h4v-4h-4m0 6v4h4v-4h-4m-6-8v4h4V8h-4m0 6v4h4v-4h-4m0 6v4h4v-4h-4'/></svg>') 12 12, auto";
		});

		modal.querySelector('#tile-rect-btn').addEventListener('click', function () {
			activateTool(MODES.TILE_RECT, this);
			tileBrush = MODES.TILE_RECT;
			canvas.style.cursor = "crosshair";
		});

		// Grid toggle
		gridToggle.addEventListener('change', function () {
			showGrid = this.checked;
			isBufferDirty = true;
			drawCanvas();
		});

		// Object palette event listeners
		tilePalette.addEventListener('click', function (e) {
			const item = e.target.closest('.tile-item');
			if (item) {
				tilePalette.querySelectorAll('.tile-item').forEach(i => i.classList.remove('selected'));
				item.classList.add('selected');
				selectedTileIndex = parseInt(item.dataset.index);
				const solidToggle = modal.querySelector('#tile-solid-toggle');
				solidToggle.checked = selectedTileSolid;
				solidToggle.addEventListener('change', function () {
					selectedTileSolid = this.checked;
				});
			}
		});

		// Canvas container event listeners for panning
		canvasContainer.addEventListener('mousedown', (e) => {
			isMouseDown = true;
			lastPlacedTile = {
				x: -1,
				y: -1
			};

			if ((e.button === 0 && currentTool === MODES.HAND) || e.button === 1) {
				isPanning = true;
				lastX = e.clientX;
				lastY = e.clientY;
				canvas.style.cursor = 'grabbing';
				e.preventDefault();
				return;
			}

			const coords = getPixelCoordinates(e.clientX, e.clientY);
			updateCursorCoordinates(coords.x, coords.y);

			if (isTileMode) {
				isDragging = true;
				const coords = getPixelCoordinates(e.clientX, e.clientY);

				if (tileBrush === MODES.TILE_DRAW && selectedTileIndex !== -1) {
					const value = selectedTileSolid ? selectedTileIndex + 1000 : selectedTileIndex;
					if (setTileAt(coords.x, coords.y, value)) {
						isBufferDirty = true;
						drawCanvas();
					}
				} else if (tileBrush === MODES.TILE_FILL && selectedTileIndex !== -1) {
					const tile = getTileAt(coords.x, coords.y);
					if (tile) {
						const targetValue = tile.value;
						const newValue = selectedTileSolid ? selectedTileIndex + 1000 : selectedTileIndex;

						if (targetValue !== newValue) {
							fillTiles(coords.x, coords.y, targetValue, newValue);
							isBufferDirty = true;
							drawCanvas();
						}
					}
				} else if (tileBrush === MODES.TILE_FILL && selectedTileIndex !== -1) {
					const tile = getTileAt(coords.x, coords.y);
					if (tile) {
						const targetValue = tile.value;
						const newValue = selectedTileSolid ? selectedTileIndex + 1000 : selectedTileIndex;

						if (targetValue !== newValue) {
							fillTiles(coords.x, coords.y, targetValue, newValue);
							isBufferDirty = true;
							drawCanvas();
						}
					}
				} else if (tileBrush === MODES.TILE_RECT) {
					const coords = getPixelCoordinates(e.clientX, e.clientY);
					rectStartX = coords.x;
					rectStartY = coords.y;
					isDrawingRect = true;
					tempRect = {
						x: rectStartX,
						y: rectStartY,
						width: 0,
						height: 0
					};
					return;
				}
				return;
			}

			if (currentTool === MODES.PLACE_OBJECT && selectedProtoName) {
			  const proto = proto_object_array.find(p => 
				workspace.getVariableById(p.name).name === selectedProtoName);
			  if (!proto) return;

			  let x = showGrid ? snapToGrid(coords.x) : coords.x;
			  let y = showGrid ? snapToGrid(coords.y) : coords.y;

			  x = Math.max(0, Math.min(this.width_ - proto.width, x));
			  y = Math.max(0, Math.min(this.height_ - proto.height, y));

			  this.objects_.push({
				protoName: selectedProtoName,
				x: x,
				y: y
			  });
			  isBufferDirty = true;

			  drawCanvas();
			  return;
			}

			if (currentTool === MODES.SELECT || currentTool === MODES.DELETE) {
				const index = findObjectAt(coords.x, coords.y);

				if (currentTool === MODES.DELETE && index !== -1) {
					this.objects_.splice(index, 1);
					if (selectedObjectIndex === index)
						selectedObjectIndex = -1;
					isBufferDirty = true;
					drawCanvas();
					return;
				}

				if (index !== -1) {
					selectedObjectIndex = index;
					isDragging = true;
					dragStartX = coords.x - this.objects_[index].x;
					dragStartY = coords.y - this.objects_[index].y;
				} else {
					selectedObjectIndex = -1;
				}
				isBufferDirty = true;
				drawCanvas();
			}
		});

		document.addEventListener('mouseup', (e) => {
			isMouseDown = false;
			if (isDrawingRect && tileBrush === MODES.TILE_RECT) {
				const coords = getPixelCoordinates(e.clientX, e.clientY);
				const value = selectedTileSolid ? selectedTileIndex + 1000 : selectedTileIndex;

				drawTileRect(
					rectStartX,
					rectStartY,
					coords.x,
					coords.y,
					value);

				isDrawingRect = false;
				tempRect = null;
				isBufferDirty = true;
				drawCanvas(); // Перерисовываем без временного прямоугольника
			}

			isPanning = false;
			isDragging = false;
			isMouseDown = false;

			if (currentTool === MODES.HAND) {
				canvas.style.cursor = 'grab';
			} else {
				canvas.style.cursor = 'crosshair';
			}
		});

		// Touch events
		canvasContainer.addEventListener('touchstart', function (e) {
			if (e.touches.length === 1) {
				if (currentTool === MODES.HAND) {
					isPanning = true;
					lastX = e.touches[0].clientX;
					lastY = e.touches[0].clientY;
					e.preventDefault();
				}
				const touch = e.touches[0];
				const mouseEvent = new MouseEvent('mousedown', {
					clientX: touch.clientX,
					clientY: touch.clientY,
					button: 0
				});
				this.dispatchEvent(mouseEvent);
				e.preventDefault();
			} else if (e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				lastX = (touch1.clientX + touch2.clientX) / 2;
				lastY = (touch1.clientY + touch2.clientY) / 2;
				e.preventDefault();
			}
		});

		canvasContainer.addEventListener('touchmove', function (e) {
			if (isPanning && e.touches.length === 1) {
				const dx = e.touches[0].clientX - lastX;
				const dy = e.touches[0].clientY - lastY;
				lastX = e.touches[0].clientX;
				lastY = e.touches[0].clientY;

				offsetX += dx;
				offsetY += dy;

				canvasContainer.scrollLeft = -offsetX;
				canvasContainer.scrollTop = -offsetY;
				updateView();
				e.preventDefault();
			} else if (e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				const currentX = (touch1.clientX + touch2.clientX) / 2;
				const currentY = (touch1.clientY + touch2.clientY) / 2;

				const dx = currentX - lastX;
				const dy = currentY - lastY;

				offsetX += dx;
				offsetY += dy;

				canvasContainer.scrollLeft = -offsetX;
				canvasContainer.scrollTop = -offsetY;

				updateView();

				lastX = currentX;
				lastY = currentY;
				e.preventDefault();
			}
		});

		canvasContainer.addEventListener('mouseleave', function () {
			if (isPanning) {
				const continuePan = (e) => {
					if (isPanning) {
						const dx = e.clientX - lastX;
						const dy = e.clientY - lastY;
						lastX = e.clientX;
						lastY = e.clientY;

						offsetX += dx;
						offsetY += dy;

						canvasContainer.scrollLeft = -offsetX;
						canvasContainer.scrollTop = -offsetY;
						updateView();
					}
				};

				document.addEventListener('mousemove', continuePan);

				const stopPan = () => {
					isPanning = false;
					isDragging = false;
					isMouseDown = false;
					document.removeEventListener('mousemove', continuePan);
					document.removeEventListener('mouseup', stopPan);
				};

				document.addEventListener('mouseup', stopPan);
			}
		});

		canvasContainer.addEventListener('touchend', function (e) {
			const mouseEvent = new MouseEvent('mouseup');
			this.dispatchEvent(mouseEvent);
			e.preventDefault();
		});

		// Handle mouse wheel for zooming
		canvasContainer.addEventListener('wheel', function (e) {
			e.preventDefault();

			const delta = -Math.sign(e.deltaY);
			const oldZoom = zoom;

			zoom = Math.max(
					self.editorConfig.minZoom,
					Math.min(self.editorConfig.maxZoom, zoom + delta * self.editorConfig.zoomStep));

			if (zoom !== oldZoom) {
				const rect = canvasContainer.getBoundingClientRect();
				const mouseX = e.clientX - rect.left;
				const mouseY = e.clientY - rect.top;

				const canvasX = (mouseX - offsetX) / oldZoom;
				const canvasY = (mouseY - offsetY) / oldZoom;

				offsetX = mouseX - canvasX * zoom;
				offsetY = mouseY - canvasY * zoom;

				canvasContainer.scrollLeft = -offsetX;
				canvasContainer.scrollTop = -offsetY;

				updateView();
			}
		});

		objectPalette.addEventListener('click', function(e) {
		  const item = e.target.closest('.object-item');
		  if (item) {
			resetSelections();
			item.classList.add('selected');
			selectedProtoName = item.dataset.name;
			selectedProtoIndex = -1; // Сбрасываем индекс, так как работаем с именем
			activateTool(MODES.PLACE_OBJECT);
			isTileMode = false;
			tileTools.style.display = 'none';
			tilePalette.style.display = 'none';
			objectPalette.style.display = 'grid';
			canvas.style.cursor = 'crosshair';
		  }
		});

		// Close editor and save
		modal.querySelector('#close-editor-btn').addEventListener('click', () => {
			this.value_ = JSON.stringify({
				objects: this.objects_,
				width: this.width_,
				height: this.height_,
				tiles: this.getTileMapAsFlatArray(),
				gridSize: self.editorConfig.gridSize
			});

			this.forceRerender();
			document.removeEventListener('mousemove', handleMouseMove);
			document.body.removeChild(modal);
		});
		setTimeout(() => {
			isBufferDirty = true;
			drawCanvas();
		}, 1000);
	}
}

// Register the field
Blockly.fieldRegistry.register('field_level_editor', FieldLevelEditor);
