
class FieldMusicEditor extends Blockly.Field {
  constructor(value, validator, config) {
    // First call super() with default values
    super(null, validator, config);
    
    // Now we can safely use this
    const parsedValue = typeof value === 'string' ? value : this.getEmptyPattern();
    
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
    
    this.noteList = [
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
      'Kick', 'Snare', 'HiHat', 'Clap', 'Tom'
    ];
    this.timeSteps = 32;
    this.tempo = 120;
    this.audioContext = null;
    this.currentStep = -1; // Текущий шаг воспроизведения
    this.playbackInterval = null; // Интервал воспроизведения
    
    // Set the parsed value
    this.value_ = parsedValue;
    
    this.defaultWidth_ = 144;
    this.defaultHeight_ = 16;
  }

  static fromJson(options) {
    // options['value'] will be passed to the constructor
    return new this(options['value'], undefined, options);
  }

  // Преобразует строку "0,1,3,0,..." в объект паттерна {note: [steps]}
  parsePatternString(patternStr) {
    const pattern = this.getEmptyObjectPattern();
    const steps = patternStr.split(',');
    
    steps.forEach((stepValue, stepIndex) => {
      const bits = parseInt(stepValue);
      if (isNaN(bits)) return;
      
      this.noteList.forEach((note, noteIndex) => {
        if (bits & (1 << noteIndex)) {
          if (!pattern[note]) pattern[note] = Array(this.timeSteps).fill(false);
          pattern[note][stepIndex] = true;
        }
      });
    });
    
    return pattern;
  }

  // Преобразует объект паттерна в строку "0,1,3,0,..."
  serializePattern(patternObj) {
    const steps = [];
    
    for (let step = 0; step < this.timeSteps; step++) {
      let bits = 0;
      this.noteList.forEach((note, noteIndex) => {
        if (patternObj[note] && patternObj[note][step]) {
          bits |= (1 << noteIndex);
        }
      });
      steps.push(bits.toString());
    }
    
    return steps.join(',');
  }

  // Создает пустой паттерн в формате строки
  getEmptyPattern() {
    return Array(this.timeSteps).fill('0').join(',');
  }

  // Создает пустой паттерн в объектном формате
  getEmptyObjectPattern() {
    const pattern = {};
    this.noteList.forEach(note => {
      pattern[note] = Array(this.timeSteps).fill(false);
    });
    return pattern;
  }

  initView() {
    this.createBorderRect_();
    this.createTextElement_();
    this.updateEditable();
    this.render_();
  }

  render_() {
    super.render_();
    if (this.borderRect_) {
      this.borderRect_.setAttribute('width', this.defaultWidth_.toString());
      this.borderRect_.setAttribute('height', this.defaultHeight_.toString());
      this.borderRect_.setAttribute('rx', '8');
      this.borderRect_.setAttribute('ry', '8');
      this.borderRect_.setAttribute('stroke', '#aaa');
      this.borderRect_.setAttribute('stroke-width', '1');
      this.borderRect_.setAttribute('fill', '#f8f8f8');
    }
    if (this.textElement_) {
      this.textElement_.textContent = Blockly.Msg['MUSIC_EDITOR_LABEL'];
      this.textElement_.setAttribute('y', (this.defaultHeight_ / 2).toString());
      this.textElement_.setAttribute('x', '8');
      this.textElement_.style.fontSize = '14px';
      this.textElement_.style.fontWeight = 'bold';
    }
  }

  showEditor_(e) {
    const editor = this.createEditor_();
    Blockly.DropDownDiv.getContentDiv().appendChild(editor);
    Blockly.DropDownDiv.showPositionedByField(this, this.disposeEditor_.bind(this));
  }

  createEditor_() {
    const div = document.createElement('div');
    div.className = 'music-editor';
    div.style.width = '900px';
    div.style.height = '440px';
    div.style.fontSize = '14px';
    
    const scrollContainer = document.createElement('div');
    scrollContainer.style.overflowX = 'auto';
    scrollContainer.style.width = '100%';
    
    const table = document.createElement('table');
    table.className = 'music-grid';
    table.style.margin = '15px auto';
    table.style.fontSize = '14px';
    
    // Парсим текущее значение в объектный формат для редактора
    const currentPattern = this.parsePatternString(this.value_);
    
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    
    for (let i = 0; i < this.timeSteps; i++) {
      const th = document.createElement('th');
      th.textContent = i + 1;
      th.style.padding = '4px 4px';
      th.style.fontSize = '12px';
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    
    this.editorCells = [];
    for (let note of this.noteList) {
      const row = document.createElement('tr');
      const noteCell = document.createElement('td');
      noteCell.className = 'note-label';
      noteCell.textContent = note;
      noteCell.style.padding = '4px 4px';
      noteCell.style.fontWeight = 'bold';
      noteCell.style.fontSize = '12px';
      row.appendChild(noteCell);
      
      const rowCells = [];
      for (let i = 0; i < this.timeSteps; i++) {
        const cell = document.createElement('td');
        cell.className = 'music-cell';
        cell.dataset.note = note;
        cell.dataset.step = i;
        cell.style.width = '20px';
        cell.style.height = '15px';
        
        if (currentPattern[note] && currentPattern[note][i]) {
          cell.classList.add('active');
        }
        
        cell.addEventListener('click', () => this.toggleCell_(cell));
        row.appendChild(cell);
        rowCells.push(cell);
      }
      table.appendChild(row);
      this.editorCells.push(rowCells);
    }
    
    scrollContainer.appendChild(table);
    div.appendChild(scrollContainer);
    
    const controls = document.createElement('div');
    controls.className = 'music-controls';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'center';
    controls.style.gap = '20px';
    
    const playBtn = document.createElement('button');
    playBtn.textContent = Blockly.Msg['MUSIC_PLAY_BTN'];
    playBtn.style.padding = '10px 20px';
    playBtn.style.fontSize = '15px';
    playBtn.style.minWidth = '100px';
    playBtn.addEventListener('click', () => this.playSequence_());
    controls.appendChild(playBtn);
    
    const stopBtn = document.createElement('button');
    stopBtn.textContent = Blockly.Msg['MUSIC_STOP_BTN'];
    stopBtn.style.padding = '10px 20px';
    stopBtn.style.fontSize = '15px';
    stopBtn.style.minWidth = '100px';
    stopBtn.addEventListener('click', () => this.stopPlayback_());
    controls.appendChild(stopBtn);
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = Blockly.Msg['MUSIC_CLEAR_BTN'];
    clearBtn.style.padding = '10px 20px';
    clearBtn.style.fontSize = '15px';
    clearBtn.style.minWidth = '100px';
    clearBtn.addEventListener('click', () => this.clearPattern_());
    controls.appendChild(clearBtn);
    
    div.appendChild(controls);
    
    return div;
  }

  toggleCell_(cell) {
    cell.classList.toggle('active');
    
    // Сначала парсим текущее значение
    const currentPattern = this.parsePatternString(this.value_);
    const note = cell.dataset.note;
    const step = parseInt(cell.dataset.step);
    
    if (!currentPattern[note]) {
      currentPattern[note] = Array(this.timeSteps).fill(false);
    }
    
    currentPattern[note][step] = cell.classList.contains('active');
    
    // Сериализуем обратно в строку и сохраняем
    this.value_ = this.serializePattern(currentPattern);
    this.setValue(this.value_);
  }

  playSequence_() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Остановить предыдущее воспроизведение, если оно есть
    this.stopPlayback_();
    
    const currentPattern = this.parsePatternString(this.value_);
    const stepDuration = 60 / this.tempo / 2;
    let currentStep = 0;
    
    // Сбросить выделение всех шагов
    this.resetHighlight_();
    
    // Запустить интервал для воспроизведения и подсветки
    this.playbackInterval = setInterval(() => {
      // Подсветить текущий шаг
      this.highlightStep_(currentStep);
      
      // Воспроизвести ноты для текущего шага
      for (let note of this.noteList) {
        if (currentPattern[note] && currentPattern[note][currentStep]) {
          if (['Kick', 'Snare', 'HiHat', 'Clap', 'Tom'].includes(note)) {
            this.playDrum_(note, this.audioContext.currentTime);
          } else {
            this.playNote_(note, this.audioContext.currentTime);
          }
        }
      }
      
      // Перейти к следующему шагу
      currentStep = (currentStep + 1) % this.timeSteps;
    }, stepDuration * 1000);
  }

  // Подсветить текущий шаг
  highlightStep_(step) {
    // Сбросить предыдущее выделение
    if (this.currentStep >= 0) {
      for (let row of this.editorCells) {
        row[this.currentStep].classList.remove('current-step');
      }
    }
    
    // Установить новое выделение
    this.currentStep = step;
    for (let row of this.editorCells) {
      row[step].classList.add('current-step');
    }
  }

  // Сбросить все выделения шагов
  resetHighlight_() {
    if (this.currentStep >= 0) {
      for (let row of this.editorCells) {
        row[this.currentStep].classList.remove('current-step');
      }
      this.currentStep = -1;
    }
  }

  playNote_(note, time) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = this.getNoteFrequency_(note);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    gainNode.gain.setValueAtTime(0, time + 0.31);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(time);
    oscillator.stop(time + 0.3);
  }

  playDrum_(drumType, time) {
    const bufferSource = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    const duration = 0.2;
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    if (drumType === 'Kick') {
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        data[i] = Math.sin(t * 50 * Math.PI * 2) * Math.exp(-t * 10);
      }
    } else if (drumType === 'Snare') {
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.1));
      }
    } else if (drumType === 'HiHat') {
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.02));
      }
    } else if (drumType === 'Clap') {
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        if (t < 0.02 || (t > 0.03 && t < 0.05) || (t > 0.06 && t < 0.08)) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
        } else {
          data[i] = 0;
        }
      }
    } else if (drumType === 'Tom') {
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        data[i] = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 5);
      }
    }
    
    gainNode.gain.setValueAtTime(0.5, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    bufferSource.buffer = buffer;
    bufferSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    bufferSource.start(time);
    bufferSource.stop(time + duration);
  }

  getNoteFrequency_(note) {
    const frequencies = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
      'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
      'B4': 493.88, 'C5': 523.25
    };
    return frequencies[note] || 440;
  }

  stopPlayback_() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    if (this.audioContext) {
      this.audioContext.suspend();
      this.audioContext.resume();
    }
    
    this.resetHighlight_();
  }

  clearPattern_() {
    this.value_ = this.getEmptyPattern();
    this.setValue(this.value_);
    
    for (let row of this.editorCells) {
      for (let cell of row) {
        cell.classList.remove('active');
      }
    }
  }

  disposeEditor_() {
    this.stopPlayback_();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  doClassValidation_(value) {
    // Проверяем, что значение - строка с числами через запятую
    if (typeof value === 'string' && /^(\d+,)*\d+$/.test(value)) {
      const steps = value.split(',');
      if (steps.length === this.timeSteps) {
        return value;
      }
    }
    return this.getEmptyPattern();
  }

  getText() {
    // Просто возвращаем сохраненное значение
    return this.value_;
  }
}

Blockly.fieldRegistry.register('field_music', FieldMusicEditor);

Blockly.Css.register(`
.music-editor-dropdown {
  max-height: none !important;
  padding: 0 !important;
}

.music-editor {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  font-family: Arial, sans-serif;
}

.music-grid {
  border-collapse: separate;
  border-spacing: 2px;
  margin: 8px auto;
}

.music-grid th, .music-grid td {
  border: 1px solid #ddd;
  text-align: center;
  transition: all 0.2s ease;
}

.music-grid th {
  background-color: #f2f2f2;
  padding: 10px 8px;
  font-size: 12px;
  font-weight: bold;
}

.note-label {
  font-weight: bold;
  background-color: #f9f9f9;
  padding: 10px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.music-cell {
  width: 20px;
  height: 25px;
  min-width: 20px;
  cursor: pointer;
  background-color: #fff;
  transition: all 0.2s ease;
  position: relative;
}

.music-cell:hover {
  background-color: #e6e6e6;
  transform: scale(1.05);
  z-index: 1;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.music-cell.active {
  background-color: #4CAF50;
  box-shadow: inset 0 0 0 1px #fff;
}

.music-cell.active[data-note^="Kick"] {
  background-color: #FF5722;
}

.music-cell.active[data-note^="Snare"] {
  background-color: #2196F3;
}

.music-cell.active[data-note^="HiHat"] {
  background-color: #FFC107;
}

.music-cell.active[data-note^="Clap"] {
  background-color: #9C27B0;
}

.music-cell.active[data-note^="Tom"] {
  background-color: #607D8B;
}

.music-cell.active:hover {
  opacity: 0.9;
}

/* Стиль для текущего шага воспроизведения */
.music-cell.current-step {
  position: relative;
  z-index: 2;
}

.music-cell.current-step:after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #FF5722;
  border-radius: 3px;
  animation: pulse 0.5s ease-out;
}

/* Для активных ячеек текущего шага */
.music-cell.active.current-step:after {
  border-color: white;
  animation: pulse-active 0.5s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes pulse-active {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

.music-controls button {
  padding: 10px 20px;
  font-size: 15px;
  min-width: 100px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.music-controls button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.music-controls button:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0,0,0,0.1);
}

#music-stopBtn {
  background-color: #f44336;
}

#music-stopBtn:hover {
  background-color: #d32f2f;
}

#music-clearBtn {
  background-color: #2196F3;
}

#music-clearBtn:hover {
  background-color: #0b7dda;
}
`);