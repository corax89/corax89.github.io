/**
 * WAV Audio Editor Field for Blockly
 */
class FieldWAVEditor extends Blockly.Field {
  constructor(value, validator, config) {
    super(value, validator, config);
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
    this.value_ = value || '';
    this.size_ = new Blockly.utils.Size(64, 24); // Увеличиваем размер для превью
    
    // Add styles to the document head
    this.addStyles_();
    this.updateSize_();
  }
  
  doValueUpdate_(newValue) {
    if (newValue === this.value_) {
      return;
    }
    this.value_ = newValue;
    super.doValueUpdate_(newValue);
    
    if (this.sourceBlock_ && this.sourceBlock_.workspace) {
      Blockly.Events.fire(new Blockly.Events.BlockChange(
        this.sourceBlock_, 'WAV', null, this.value_
      ));
    }
  }

  addStyles_() {
    const style = document.createElement('style');
    style.textContent = `
      .wav-editor-modal {
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

      .wav-editor-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 95vh;
        overflow: auto;
        box-shadow: 0 10px 30px hsla(0, 0%, 0%, 0.3);
      }

      .waveform-container {
        position: relative;
        height: 150px;
        border: 1px solid #ccc;
        overflow: hidden;
        margin-bottom: 15px;
        user-select: none;
      }

      .wav-editor-canvas {
        width: 100%;
        height: 100%;
        cursor: pointer;
      }

      .playhead {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: red;
        z-index: 10;
        display: none;
      }

      .selection-area {
        position: absolute;
        top: 0;
        bottom: 0;
        background-color: rgba(0, 0, 255, 0.2);
        z-index: 5;
        display: none;
      }

      .wav-controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 15px;
      }

      .wav-btn {
        padding: 8px 16px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        background-color: #4285f4;
        color: white;
      }

      .wav-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }

      .wav-btn-record {
        background-color: #f44336;
      }

      .wav-btn-record.active {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { background-color: #f44336; }
        50% { background-color: #ff7961; }
        100% { background-color: #f44336; }
      }

      .time-display {
        text-align: center;
        font-size: 14px;
        margin-bottom: 15px;
      }

      .range-control {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }

      .range-control label {
        display: block;
        margin-right: 10px;
        min-width: 80px;
      }

      .range-control input[type="range"] {
        flex-grow: 1;
      }

      .range-control input[type="number"] {
        width: 80px;
        margin-left: 10px;
      }

      .effect-controls {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
        margin-top: 15px;
        padding: 15px;
        border: 1px solid #eee;
        border-radius: 5px;
      }

      .effect-control {
        display: flex;
        flex-direction: column;
      }

      .effect-control label {
        margin-bottom: 5px;
        font-weight: bold;
      }

      @media (max-width: 600px) {
        .effect-controls {
          grid-template-columns: 1fr;
        }
        
        .wav-editor-container {
          width: 95%;
          padding: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  static fromJson(options) {
    return new FieldWAVEditor(options['value'], undefined, options);
  }

  doClassValidation_(newValue) {
    if (newValue === null || newValue === '') return '';
    if (typeof newValue !== 'string') return null;
    if (!newValue.startsWith('data:audio/wav')) return null;
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
        'fill': '#f5f5f5',
        'stroke': '#000',
        'stroke-width': '1'
      },
      container
    );
    
    if (this.value_) {
      // Создаем превью звука
      const previewSize = this.size_.width - 10;
      const previewHeight = this.size_.height - 10;
      
      const preview = Blockly.utils.dom.createSvgElement(
        'svg',
        {
          'x': '5',
          'y': '5',
          'width': previewSize,
          'height': previewHeight,
          'viewBox': `0 0 ${previewSize} ${previewHeight}`,
          'preserveAspectRatio': 'none'
        },
        container
      );
      
      // Загружаем и декодируем аудио для превью
      this.loadAudioForPreview(this.value_).then(audioBuffer => {
        if (!audioBuffer) return;
        
        const channelData = audioBuffer.getChannelData(0);
        const step = Math.ceil(channelData.length / previewSize);
        const amp = previewHeight / 2;
        
        // Рисуем упрощенную волновую форму
        for (let i = 0; i < previewSize; i++) {
          let min = 1.0;
          let max = -1.0;
          
          for (let j = 0; j < step; j++) {
            const idx = (i * step) + j;
            if (idx >= channelData.length) break;
            
            const datum = channelData[idx];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          
          Blockly.utils.dom.createSvgElement(
            'rect',
            {
              'x': i,
              'y': (1 + min) * amp,
              'width': 1,
              'height': Math.max(1, (max - min) * amp),
              'fill': '#4285f4'
            },
            preview
          );
        }
      }).catch(() => {
        // Если не удалось загрузить, показываем иконку
        this.showFallbackIcon(container);
      });
      
      // Текст с количеством секунд
      const text = Blockly.utils.dom.createSvgElement(
        'text',
        {
          'x': '50%',
          'y': '70%',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-size': '8',
          'fill': '#555',
          'stroke': 'white',
          'stroke-width': '2',
          'stroke-linejoin': 'round',
          'paint-order': 'stroke'
        },
        container
      );
      
      this.loadAudioForPreview(this.value_).then(audioBuffer => {
        if (audioBuffer) {
          text.textContent = `${audioBuffer.duration.toFixed(1)}s`;
        } else {
          text.textContent = '🔊';
        }
      }).catch(() => {
        text.textContent = '🔊';
      });
    } else {
      // Пустое состояние
      const text = Blockly.utils.dom.createSvgElement(
        'text',
        {
          'x': '50%',
          'y': '50%',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'fill': '#888',
          'font-size': '10'
        },
        container
      );
      text.textContent = Blockly.Msg['WAV_CLICK_TO_EDIT'];
    }
    
    this.updateSize_();
  }
  
  async loadAudioForPreview(dataURL) {
    try {
      const response = await fetch(dataURL);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error('Error loading audio for preview:', err);
      return null;
    }
  }
  
  showFallbackIcon(container) {
    const icon = Blockly.utils.dom.createSvgElement(
      'text',
      {
        'x': '50%',
        'y': '50%',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'fill': '#4285f4',
        'font-size': '12'
      },
      container
    );
    icon.textContent = '🔊 WAV';
  }

  updateSize_() {
    this.size_.width = 64;
    this.size_.height = 32;
  }

  showEditor_() {
    const modal = this.createEditorModal_();
    document.body.appendChild(modal);
    this.initializeEditor_(modal);
  }

  createEditorModal_() {
    const modal = document.createElement('div');
    modal.className = 'wav-editor-modal';
    
    const editorContainer = document.createElement('div');
    editorContainer.className = 'wav-editor-container';
    
    editorContainer.innerHTML = `
      <div class="wav-controls">
        <input type="file" style="display:none" id="wav-file-input" accept=".wav,.wave,.mp3" />
        <button id="wav-load-btn" class="wav-btn"><i class="icon-folder"></i>${Blockly.Msg['WAV_LOAD_FILE']}</button>
        <button id="wav-record-btn" class="wav-btn wav-btn-record"><i class="icon-mic"></i>${Blockly.Msg['WAV_RECORD']}</button>
        <button id="wav-play-btn" class="wav-btn" disabled><i class="icon-forward-1"></i>${Blockly.Msg['WAV_PLAY']}</button>
        <button id="wav-stop-btn" class="wav-btn" disabled><i class="icon-pause-1"></i>${Blockly.Msg['WAV_STOP']}</button>
        <button id="wav-download-btn" class="wav-btn" disabled><i class="icon-download"></i>${Blockly.Msg['WAV_DOWNLOAD']}</button>
      </div>
      
      <div class="waveform-container">
        <canvas id="wav-editor-canvas" class="wav-editor-canvas"></canvas>
        <div id="wav-playhead" class="playhead"></div>
        <div id="wav-selection" class="selection-area"></div>
      </div>
      
      <div class="time-display">
        <span id="wav-current-time">0:00</span> / <span id="wav-duration">0:00</span>
      </div>
      
      <div class="range-control">
        <label for="wav-start-range">${Blockly.Msg['WAV_START_SEC']}</label>
        <input type="range" id="wav-start-range" min="0" max="100" value="0" step="0.01" disabled>
        <input type="number" id="wav-start-time" min="0" value="0" step="0.01" disabled>
      </div>
      
      <div class="range-control">
        <label for="wav-end-range">${Blockly.Msg['WAV_END_SEC']}</label>
        <input type="range" id="wav-end-range" min="0" max="100" value="100" step="0.01" disabled>
        <input type="number" id="wav-end-time" min="0" value="0" step="0.01" disabled>
      </div>
      
      <div class="effect-controls">
        <h3 style="grid-column: 1 / -1;">${Blockly.Msg['WAV_EFFECTS_TITLE']}</h3>
        
        <div class="effect-control">
          <label for="wav-volume">${Blockly.Msg['WAV_VOLUME']}: <span id="wav-volume-value">100</span>%</label>
          <input type="range" id="wav-volume" min="0" max="200" value="100" disabled>
        </div>
        
        <div class="effect-control">
          <label for="wav-fade-in">${Blockly.Msg['WAV_FADE_IN']}: <span id="wav-fade-in-value">0.0</span></label>
          <input type="range" id="wav-fade-in" min="0" max="5" value="0" step="0.1" disabled>
        </div>
        
        <div class="effect-control">
          <label for="wav-fade-out">${Blockly.Msg['WAV_FADE_OUT']}: <span id="wav-fade-out-value">0.0</span></label>
          <input type="range" id="wav-fade-out" min="0" max="5" value="0" step="0.1" disabled>
        </div>
      </div>
      
      <div class="effect-control">
        <label for="wav-speed">${Blockly.Msg['WAV_SPEED']}: <span id="wav-speed-value">1.0</span>x</label>
        <input type="range" id="wav-speed" min="0.5" max="2" value="1" step="0.1" disabled>
      </div>
      
      <div class="wav-controls" style="margin-top: 15px; justify-content: flex-end;">
        <button id="wav-close-btn" class="wav-btn">${Blockly.Msg['WAV_APPLY_CLOSE']}</button>
      </div>
    `;
    
    modal.appendChild(editorContainer);
    return modal;
  }

  async initializeEditor_(modal) {
    const self = this;
    const canvas = modal.querySelector('#wav-editor-canvas');
    const ctx = canvas.getContext('2d');
    const playhead = modal.querySelector('#wav-playhead');
    const selectionArea = modal.querySelector('#wav-selection');
    const currentTimeEl = modal.querySelector('#wav-current-time');
    const durationEl = modal.querySelector('#wav-duration');
    const startRange = modal.querySelector('#wav-start-range');
    const endRange = modal.querySelector('#wav-end-range');
    const startTimeInput = modal.querySelector('#wav-start-time');
    const endTimeInput = modal.querySelector('#wav-end-time');
    const volumeControl = modal.querySelector('#wav-volume');
    const fadeInControl = modal.querySelector('#wav-fade-in');
    const fadeOutControl = modal.querySelector('#wav-fade-out');
    const speedControl = modal.querySelector('#wav-speed');
    const volumeValue = modal.querySelector('#wav-volume-value');
    const fadeInValue = modal.querySelector('#wav-fade-in-value');
    const fadeOutValue = modal.querySelector('#wav-fade-out-value');
    const speedValue = modal.querySelector('#wav-speed-value');
    const playBtn = modal.querySelector('#wav-play-btn');
    const stopBtn = modal.querySelector('#wav-stop-btn');
    const downloadBtn = modal.querySelector('#wav-download-btn');
    const loadBtn = modal.querySelector('#wav-load-btn');
    const recordBtn = modal.querySelector('#wav-record-btn');
    const fileInput = modal.querySelector('#wav-file-input');
    const closeBtn = modal.querySelector('#wav-close-btn');
    
    // Audio context and variables
    let audioContext;
    let originalBuffer = null;
    let audioBuffer = null;
    let sourceNode = null;
    let gainNode = null;
    let startTime = 0;
    let pausedTime = 0;
    let isPlaying = false;
    let animationId = null;
    let isTrimmed = false;
    let isSelecting = false;
    let selectionStart = 0;
    
    // Recording variables
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    let recordingStartTime = 0;
    let recordingTimer = null;
    
    // Initialize audio context
    function initAudioContext() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    
    // Load file from ArrayBuffer
    async function loadFromArrayBuffer(arrayBuffer) {
      initAudioContext();
      
      try {
        originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffer = originalBuffer;
        drawWaveform();
        enableControls();
        updateDurationDisplay(audioBuffer.duration);
        
        // Set max values for sliders
        startRange.max = audioBuffer.duration;
        endRange.max = audioBuffer.duration;
        endRange.value = audioBuffer.duration;
        endTimeInput.max = audioBuffer.duration;
        endTimeInput.value = audioBuffer.duration.toFixed(2);
        isTrimmed = false;
      } catch (err) {
        console.error('Error loading audio data:', err);
        alert(Blockly.Msg['WAV_LOAD_ERROR']);
      }
    }
    
    // Load file from data URL (base64)
    async function loadFromDataURL(dataURL) {
      try {
        const response = await fetch(dataURL);
        const arrayBuffer = await response.arrayBuffer();
        await loadFromArrayBuffer(arrayBuffer);
      } catch (err) {
        console.error('Error loading from data URL:', err);
        alert(Blockly.Msg['WAV_LOAD_DATA_ERROR']);
      }
    }
    
    // Load file from File object
    async function loadFromFile(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Check if it's an MP3 file
        if (file.name.toLowerCase().endsWith('.mp3')) {
          // Use the MP3 decoder to convert to WAV
          await decodeMP3(arrayBuffer);
        } else {
          // Directly load WAV files
          await loadFromArrayBuffer(arrayBuffer);
        }
      } catch (err) {
        console.error('Error loading file:', err);
        alert(Blockly.Msg['WAV_LOAD_FILE_ERROR']);
      }
    }
    
    // Decode MP3 using the Web Audio API (or fallback to external library)
    async function decodeMP3(arrayBuffer) {
      try {
        initAudioContext();
        
        // First try using the browser's native decoder
        try {
          originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffer = originalBuffer;
          drawWaveform();
          enableControls();
          updateDurationDisplay(audioBuffer.duration);
          return;
        } catch (nativeError) {
          console.log('Native MP3 decoder failed, trying fallback...');
        }
        
        // If native decoder fails, try using mp3-decoder library if available
        if (typeof window.Mp3Decoder !== 'undefined') {
          const decoder = new window.Mp3Decoder();
          const decoded = decoder.decode(arrayBuffer);
          
          if (decoded) {
            // Create AudioBuffer from decoded data
            const audioBuffer = audioContext.createBuffer(
              decoded.numberOfChannels,
              decoded.length,
              decoded.sampleRate
            );
            
            for (let i = 0; i < decoded.numberOfChannels; i++) {
              audioBuffer.getChannelData(i).set(decoded.channelData[i]);
            }
            
            originalBuffer = audioBuffer;
            audioBuffer = originalBuffer;
            drawWaveform();
            enableControls();
            updateDurationDisplay(audioBuffer.duration);
            return;
          }
        }
        
        // If all else fails, show error
        throw new Error('MP3 decoding failed. Try converting to WAV first.');
      } catch (err) {
        console.error('Error decoding MP3:', err);
        alert(Blockly.Msg['WAV_MP3_DECODE_ERROR'] || 'Failed to decode MP3 file. Try converting to WAV first.');
      }
    }
    
    // Draw waveform
    function drawWaveform() {
      if (!audioBuffer) return;
      
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      const channelData = audioBuffer.getChannelData(0);
      const step = Math.ceil(channelData.length / width);
      const amp = height / 2;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Draw entire waveform in gray 
      ctx.fillStyle = '#ddd';
      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
          const idx = (i * step) + j;
          if (idx >= channelData.length) break;
          
          const datum = channelData[idx];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }
      
      // Draw selected area in blue
      const startX = (parseFloat(startRange.value) / audioBuffer.duration) * width;
      const endX = (parseFloat(endRange.value) / audioBuffer.duration) * width;
      
      ctx.fillStyle = 'blue';
      for (let i = Math.floor(startX); i < Math.ceil(endX); i++) {
        if (i >= width) break;
        
        let min = 1.0;
        let max = -1.0;
        const startSample = Math.floor((i / width) * channelData.length);
        const endSample = Math.floor(((i + 1) / width) * channelData.length);
        
        for (let j = startSample; j < endSample; j++) {
          if (j >= channelData.length) break;
          
          const datum = channelData[j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }
      
      // Draw selection boundaries
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }
    
    // Enable controls
    function enableControls() {
      playBtn.disabled = false;
      stopBtn.disabled = false;
      downloadBtn.disabled = false;
      startRange.disabled = false;
      endRange.disabled = false;
      startTimeInput.disabled = false;
      endTimeInput.disabled = false;
      volumeControl.disabled = false;
      fadeInControl.disabled = false;
      fadeOutControl.disabled = false;
      speedControl.disabled = false;
    }
    
    // Handle mouse/touch events for selection
    function handleSelectionStart(e) {
      if (!audioBuffer) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const time = (x / rect.width) * audioBuffer.duration;
      
      isSelecting = true;
      selectionStart = time;
      
      selectionArea.style.left = `${x}px`;
      selectionArea.style.width = '0px';
      selectionArea.style.display = 'block';
      
      startRange.value = time;
      startTimeInput.value = time.toFixed(2);
      endRange.value = time;
      endTimeInput.value = time.toFixed(2);
      
      drawWaveform();
      applyEffects();
    }
    
    function handleSelectionMove(e) {
      if (!isSelecting || !audioBuffer) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const time = (x / rect.width) * audioBuffer.duration;
      
      const startTime = Math.min(selectionStart, time);
      const endTime = Math.max(selectionStart, time);
      
      const startX = (startTime / audioBuffer.duration) * rect.width;
      const endX = (endTime / audioBuffer.duration) * rect.width;
      
      selectionArea.style.left = `${startX}px`;
      selectionArea.style.width = `${endX - startX}px`;
      
      startRange.value = startTime;
      startTimeInput.value = startTime.toFixed(2);
      endRange.value = endTime;
      endTimeInput.value = endTime.toFixed(2);
      
      drawWaveform();
      applyEffects();
    }
    
    function handleSelectionEnd() {
      isSelecting = false;
      selectionArea.style.display = 'none';
    }
    
    // Set up event listeners for selection
    canvas.addEventListener('mousedown', handleSelectionStart);
    canvas.addEventListener('mousemove', handleSelectionMove);
    canvas.addEventListener('mouseup', handleSelectionEnd);
    canvas.addEventListener('mouseleave', handleSelectionEnd);
    
    canvas.addEventListener('touchstart', handleSelectionStart);
    canvas.addEventListener('touchmove', handleSelectionMove);
    canvas.addEventListener('touchend', handleSelectionEnd);
    
    // Play audio
    playBtn.addEventListener('click', function() {
      if (!audioBuffer) return;
      
      if (isPlaying) {
        pauseAudio();
        playBtn.textContent = Blockly.Msg['WAV_PLAY'];
      } else {
        playAudio();
        playBtn.textContent = Blockly.Msg['WAV_PAUSE'];
      }
    });
    
    function playAudio() {
      if (isPlaying) return;
      
      initAudioContext();
      
      sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      
      // Apply speed effect
      const speed = parseFloat(speedControl.value);
      sourceNode.playbackRate.value = speed;
      
      gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const startPos = parseFloat(startRange.value);
      const endPos = Math.min(parseFloat(endRange.value), audioBuffer.duration);
      
      sourceNode.start(0, startPos, (endPos - startPos) / speed);
      startTime = audioContext.currentTime - (startPos / speed); // Adjust for speed
      isPlaying = true;
      
      playhead.style.display = 'block';
      
      sourceNode.onended = function() {
        stopAudio();
        playBtn.textContent = Blockly.Msg['WAV_PLAY'];
      };
      
      animatePlayback();
    }
    
    function pauseAudio() {
      if (!isPlaying) return;
      
      pausedTime = audioContext.currentTime - startTime;
      sourceNode.stop();
      sourceNode.disconnect();
      if (gainNode) gainNode.disconnect();
      isPlaying = false;
      
      playhead.style.display = 'none';
      cancelAnimationFrame(animationId);
    }
    
    // Stop audio
    stopBtn.addEventListener('click', stopAudio);
    
    function stopAudio() {
      if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
      }
      if (gainNode) {
        gainNode.disconnect();
      }
      
      isPlaying = false;
      pausedTime = 0;
      playBtn.textContent = Blockly.Msg['WAV_PLAY'];
      playhead.style.display = 'none';
      cancelAnimationFrame(animationId);
      updateCurrentTimeDisplay(0);
    }
    
    // Playback animation
    function animatePlayback() {
      if (!isPlaying) return;
      
      const speed = parseFloat(speedControl.value);
      const currentRealTime = audioContext.currentTime - startTime;
      const currentAudioTime = currentRealTime * speed;
      
      updateCurrentTimeDisplay(currentAudioTime);
      
      // Update playhead position with speed adjustment
      if (audioBuffer) {
        const playheadPos = (currentAudioTime / audioBuffer.duration) * canvas.offsetWidth;
        playhead.style.left = `${Math.min(playheadPos, canvas.offsetWidth)}px`;
      }
      
      animationId = requestAnimationFrame(animatePlayback);
    }
    
    // Time display
    function updateDurationDisplay(duration) {
      const speed = parseFloat(speedControl.value);
      const scaledDuration = duration / speed;
      durationEl.textContent = `${formatTime(duration)} (${formatTime(scaledDuration)} at ${speed}x)`;
    }

    function updateCurrentTimeDisplay(time) {
      const speed = parseFloat(speedControl.value);
      const scaledTime = time / speed;
      currentTimeEl.textContent = `${formatTime(time)} (${formatTime(scaledTime)} at ${speed}x)`;
    }
    
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
    }
    
    // Apply effects to selected area
    function applyEffects() {
      if (!originalBuffer) return;
      
      // Create copy of original buffer
      audioBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
      );
      
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const newData = audioBuffer.getChannelData(channel);
        
        // Copy original data
        for (let i = 0; i < originalData.length; i++) {
          newData[i] = originalData[i];
        }
        
        // Apply effects to selected area
        const startPos = parseFloat(startRange.value);
        const endPos = Math.min(parseFloat(endRange.value), originalBuffer.duration);
        const volume = parseFloat(volumeControl.value) / 100;
        const fadeIn = parseFloat(fadeInControl.value);
        const fadeOut = parseFloat(fadeOutControl.value);
        
        if (startPos >= endPos) continue;
        
        const startOffset = Math.floor(startPos * originalBuffer.sampleRate);
        const endOffset = Math.floor(endPos * originalBuffer.sampleRate);
        
        for (let i = startOffset; i < endOffset && i < newData.length; i++) {
          const posInEffect = (i - startOffset) / originalBuffer.sampleRate;
          const effectDuration = endPos - startPos;
          
          // Apply fade in/out
          let gain = volume;
          
          if (fadeIn > 0 && posInEffect < fadeIn) {
            gain *= posInEffect / fadeIn;
          }
          
          if (fadeOut > 0 && posInEffect > (effectDuration - fadeOut)) {
            gain *= 1 - ((posInEffect - (effectDuration - fadeOut)) / fadeOut);
          }
          
          newData[i] = originalData[i] * gain;
        }
      }
      
      drawWaveform();
    }
    
    // Download file
    downloadBtn.addEventListener('click', function() {
      if (!audioBuffer) return;
      
      // Create WAV file from audio buffer
      const wavBuffer = encodeWAV(audioBuffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_audio.wav';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
    
    // WAV encoding (simplified version)
    function encodeWAV(buffer) {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * bitsPerSample / 8;
      const blockAlign = numChannels * bitsPerSample / 8;
      const dataSize = buffer.length * numChannels * 2;
      
      const bufferSize = 44 + dataSize;
      const buf = new ArrayBuffer(bufferSize);
      const view = new DataView(buf);
      
      // Write WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(view, 36, 'data');
      view.setUint32(40, dataSize, true);
      
      // Write audio data
      let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      return buf;
    }
    
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    // Slider controls
    speedControl.addEventListener('input', function() {
      speedValue.textContent = speedControl.value;
      
      if (isPlaying) {
        // Recalculate current position with new speed
        const speed = parseFloat(speedControl.value);
        const currentRealTime = audioContext.currentTime - startTime;
        const currentAudioTime = currentRealTime * speed;
        
        // Update playhead position immediately
        if (audioBuffer) {
          const playheadPos = (currentAudioTime / audioBuffer.duration) * canvas.offsetWidth;
          playhead.style.left = `${Math.min(playheadPos, canvas.offsetWidth)}px`;
        }
      }
    });
    
    // Fix for wav-start-range slider
    startRange.addEventListener('input', function() {
      const value = parseFloat(startRange.value);
      startTimeInput.value = value.toFixed(2);
      if (value >= parseFloat(endRange.value)) {
        const newValue = parseFloat(endRange.value) - 0.01;
        startRange.value = newValue;
        startTimeInput.value = newValue.toFixed(2);
      }
      drawWaveform();
      applyEffects();
    });
    
    endRange.addEventListener('input', function() {
      const value = parseFloat(endRange.value);
      endTimeInput.value = value.toFixed(2);
      if (value <= parseFloat(startRange.value)) {
        const newValue = parseFloat(startRange.value) + 0.01;
        endRange.value = newValue;
        endTimeInput.value = newValue.toFixed(2);
      }
      drawWaveform();
      applyEffects();
    });
    
    startTimeInput.addEventListener('input', function() {
      const value = parseFloat(startTimeInput.value);
      if (!isNaN(value) && value >= 0 && value <= audioBuffer.duration) {
        startRange.value = value;
        if (value >= parseFloat(endRange.value)) {
          const newValue = parseFloat(endRange.value) - 0.01;
          startRange.value = newValue;
          startTimeInput.value = newValue.toFixed(2);
        }
        drawWaveform();
        applyEffects();
      }
    });
    
    endTimeInput.addEventListener('input', function() {
      const value = parseFloat(endTimeInput.value);
      if (!isNaN(value) && value >= 0 && value <= audioBuffer.duration) {
        endRange.value = value;
        if (value <= parseFloat(startRange.value)) {
          const newValue = parseFloat(startRange.value) + 0.01;
          endRange.value = newValue;
          endTimeInput.value = newValue.toFixed(2);
        }
        drawWaveform();
        applyEffects();
      }
    });
    
    // Effect controls
    volumeControl.addEventListener('input', function() {
      volumeValue.textContent = volumeControl.value;
      applyEffects();
    });
    
    fadeInControl.addEventListener('input', function() {
      fadeInValue.textContent = fadeInControl.value;
      applyEffects();
    });
    
    fadeOutControl.addEventListener('input', function() {
      fadeOutValue.textContent = fadeOutControl.value;
      applyEffects();
    });
    
    speedControl.addEventListener('input', function() {
      speedValue.textContent = speedControl.value;
      if (audioBuffer) {
        updateDurationDisplay(audioBuffer.duration);
        if (isPlaying) {
          const currentTime = (audioContext.currentTime - startTime) * parseFloat(speedControl.value);
          updateCurrentTimeDisplay(currentTime);
        }
      }
    });
    
    // File input handler
    loadBtn.addEventListener('click', function() {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        loadFromFile(file);
      }
    });
    
    // Record audio from microphone
    recordBtn.addEventListener('click', async function() {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    });
    
    async function startRecording() {
		try {
			initAudioContext();
			
			// Stop any playback
			stopAudio();
			
			// Check permission state first
			let permissionState = 'prompt';
			if (navigator.permissions && navigator.permissions.query) {
				try {
					const permission = await navigator.permissions.query({ name: 'microphone' });
					permissionState = permission.state;
					
					// Show appropriate message based on permission state
					if (permissionState === 'granted') {
						showStatusMessage(Blockly.Msg['WAV_RECORDING_STARTING'] || 'Starting recording...');
					} else if (permissionState === 'denied') {
						showStatusMessage(Blockly.Msg['WAV_MIC_DENIED'] || 'Microphone access was previously denied. Please reset permissions in your browser settings.');
						return;
					}
				} catch (e) {
					console.warn('Permissions API not fully supported', e);
				}
			}

			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			
			// Create MediaRecorder
			mediaRecorder = new MediaRecorder(stream);
			recordedChunks = [];
			
			// Set up event handlers
			mediaRecorder.ondataavailable = function(e) {
				if (e.data.size > 0) {
					recordedChunks.push(e.data);
				}
			};
			
			mediaRecorder.onstop = async function() {
				// Combine recorded chunks into a Blob
				const blob = new Blob(recordedChunks, { type: 'audio/wav' });
				
				// Convert Blob to ArrayBuffer
				const arrayBuffer = await blob.arrayBuffer();
				
				// Load the recorded audio
				await loadFromArrayBuffer(arrayBuffer);
				
				// Clean up
				stream.getTracks().forEach(track => track.stop());
			};
			
			// Start recording
			mediaRecorder.start(100); // Collect data every 100ms
			
			// Update UI
			isRecording = true;
			recordBtn.classList.add('active');
			recordBtn.textContent = Blockly.Msg['WAV_STOP_RECORDING'] || 'Stop Recording';
			showStatusMessage(Blockly.Msg['WAV_RECORDING_IN_PROGRESS'] || 'Recording in progress...');
			
			// Start timer
			recordingStartTime = Date.now();
			updateRecordingTime();
			
		} catch (err) {
			console.error('Error starting recording:', err);
			
			// Handle specific error cases
			if (err.name === 'NotAllowedError') {
				showStatusMessage(Blockly.Msg['WAV_MIC_BLOCKED'] || 'Microphone access was blocked. Please allow microphone access to record.');
			} else if (err.name === 'NotFoundError') {
				showStatusMessage(Blockly.Msg['WAV_NO_MIC'] || 'No microphone found. Please connect a microphone and try again.');
			} else {
				showStatusMessage(Blockly.Msg['WAV_RECORD_ERROR'] || 'Error accessing microphone: ' + err.message);
			}
			
			// Reset recording state
			isRecording = false;
			recordBtn.classList.remove('active');
			recordBtn.textContent = Blockly.Msg['WAV_RECORD'];
		}
	}

	// Helper function to show status messages
	function showStatusMessage(message) {
		const statusElement = document.getElementById('wav-status-message') || createStatusMessageElement();
		statusElement.textContent = message;
		setTimeout(() => statusElement.textContent = '', 5000);
	}

	function createStatusMessageElement() {
		const container = document.querySelector('.wav-editor-container');
		const statusElement = document.createElement('div');
		statusElement.id = 'wav-status-message';
		statusElement.style.margin = '10px 0';
		statusElement.style.color = '#666';
		container.insertBefore(statusElement, container.firstChild);
		return statusElement;
	}
    
    function stopRecording() {
      if (!mediaRecorder || !isRecording) return;
      
      // Stop recording
      mediaRecorder.stop();
      
      // Update UI
      isRecording = false;
      recordBtn.classList.remove('active');
      recordBtn.textContent = Blockly.Msg['WAV_RECORD'];
      
      // Clear timer
      clearInterval(recordingTimer);
      currentTimeEl.textContent = '0:00';
    }
    
    function updateRecordingTime() {
      recordingTimer = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        currentTimeEl.textContent = formatTime(elapsed);
      }, 100);
    }
    
    // Close editor
    closeBtn.addEventListener('click', function() {
      if (audioBuffer) {
        // Create a new buffer with speed effect
        const speed = parseFloat(speedControl.value);
        const sampleRate = audioBuffer.sampleRate * speed;
        
        const offlineCtx = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length / speed,
          sampleRate
        );
        
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speed;
        
        source.connect(offlineCtx.destination);
        source.start();
        
        offlineCtx.startRendering().then(function(renderedBuffer) {
          // Convert rendered buffer to data URL
          const wavBuffer = encodeWAV(renderedBuffer);
          const blob = new Blob([wavBuffer], { type: 'audio/wav' });
          const reader = new FileReader();
          
          reader.onload = function() {
            self.setValue(reader.result);
            document.body.removeChild(modal);
          };
          
          reader.readAsDataURL(blob);
        });
      } else {
        document.body.removeChild(modal);
      }
    });
    
    // Load existing audio if available
    if (this.value_) {
      loadFromDataURL(this.value_);
    }
  }
}

// Register the field
Blockly.fieldRegistry.register('field_wav_editor', FieldWAVEditor);