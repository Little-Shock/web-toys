/**
 * 音频管理器
 * 负责处理所有与音频相关的功能
 */
class AudioManager {
  /**
   * 创建音频管理器
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 配置参数
    this.params = {
      volume: options.volume || 0.7,
      muted: options.muted || false,
      bpm: options.bpm || 120,
      noteScale: options.noteScale || 'pentatonic', // 音阶类型：pentatonic, major, minor
      vibrationEnabled: options.vibrationEnabled !== undefined ? options.vibrationEnabled : true
    };
    
    // 初始化状态
    this.initialized = false;
    this.initializationAttempted = false;
    this.errorCount = 0;
    this.maxErrorCount = 3;
    
    // 检测设备类型和性能
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isLowEndDevice = this.detectLowEndDevice();
    
    // Web Audio API 组件
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    
    // 音符频率表（基于不同音阶）
    this.noteFrequencies = {
      // 五声音阶（C, D, E, G, A）
      pentatonic: [
        261.63, 293.66, 329.63, 392.00, 440.00,
        523.25, 587.33, 659.25, 783.99, 880.00,
        1046.50, 1174.66, 1318.51, 1567.98, 1760.00
      ],
      // 大调音阶（C, D, E, F, G, A, B）
      major: [
        261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88,
        523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77,
        1046.50, 1174.66, 1318.51, 1396.91, 1567.98, 1760.00, 1975.53
      ],
      // 小调音阶（C, D, Eb, F, G, Ab, Bb）
      minor: [
        261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16,
        523.25, 587.33, 622.25, 698.46, 783.99, 830.61, 932.33,
        1046.50, 1174.66, 1244.51, 1396.91, 1567.98, 1661.22, 1864.66
      ]
    };
    
    // 音色类型
    this.waveforms = ['sine', 'triangle', 'square', 'sawtooth'];
    
    // 活跃的音频源
    this.activeSounds = [];
    
    // 节奏层
    this.rhythmLayers = [];
    
    // 初始化
    this.init();
  }
  
  /**
   * 检测低端设备
   * @returns {boolean} 是否为低端设备
   */
  detectLowEndDevice() {
    // 简单检测：移动设备或低内存设备
    return this.isMobile || (navigator.deviceMemory && navigator.deviceMemory < 4);
  }
  
  /**
   * 初始化音频管理器
   */
  async init() {
    if (this.initialized || this.initializationAttempted) return;
    
    this.initializationAttempted = true;
    
    try {
      // 创建音频上下文
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.params.volume;
      
      // 创建动态压缩器（防止音频过载）
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      
      // 连接节点
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);
      
      // 初始化节奏层
      this.initRhythmLayers();
      
      this.initialized = true;
      console.log('音频管理器初始化成功');
      
      // 在iOS上，需要用户交互才能启动音频上下文
      if (this.isIOS && this.audioContext.state === 'suspended') {
        console.log('iOS设备需要用户交互才能启动音频');
      }
    } catch (error) {
      console.error('初始化音频管理器失败:', error);
      this.errorCount++;
    }
  }
  
  /**
   * 初始化节奏层
   */
  initRhythmLayers() {
    // 创建4个节奏层，每层有不同的音色和特性
    this.rhythmLayers = [
      {
        id: 0,
        name: '层 1',
        active: true,
        muted: false,
        waveform: 'sine',
        octave: 0,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
        notes: [],
        color: '#5E9DFF'
      },
      {
        id: 1,
        name: '层 2',
        active: false,
        muted: false,
        waveform: 'triangle',
        octave: -1,
        attack: 0.02,
        decay: 0.2,
        sustain: 0.4,
        release: 0.6,
        notes: [],
        color: '#FF5E9D'
      },
      {
        id: 2,
        name: '层 3',
        active: false,
        muted: false,
        waveform: 'square',
        octave: 1,
        attack: 0.005,
        decay: 0.05,
        sustain: 0.2,
        release: 0.4,
        notes: [],
        color: '#5EFF9D'
      },
      {
        id: 3,
        name: '层 4',
        active: false,
        muted: false,
        waveform: 'sawtooth',
        octave: 0,
        attack: 0.01,
        decay: 0.3,
        sustain: 0.3,
        release: 0.7,
        notes: [],
        color: '#9D5EFF'
      }
    ];
  }
  
  /**
   * 确保音频上下文已启动
   * @returns {Promise} 音频上下文状态
   */
  async ensureAudioContext() {
    if (!this.initialized) {
      await this.init();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('音频上下文已恢复');
      } catch (error) {
        console.error('恢复音频上下文失败:', error);
        this.errorCount++;
      }
    }
    
    return this.audioContext && this.audioContext.state === 'running';
  }
  
  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.params.volume = clamp(volume, 0, 1);
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.params.volume;
    }
  }
  
  /**
   * 设置静音状态
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.params.muted = muted;
    
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.params.volume;
    }
  }
  
  /**
   * 设置BPM（每分钟节拍数）
   * @param {number} bpm - BPM值
   */
  setBPM(bpm) {
    this.params.bpm = clamp(bpm, 60, 180);
  }
  
  /**
   * 设置音阶类型
   * @param {string} scale - 音阶类型 ('pentatonic', 'major', 'minor')
   */
  setNoteScale(scale) {
    if (this.noteFrequencies[scale]) {
      this.params.noteScale = scale;
    }
  }
  
  /**
   * 设置振动反馈
   * @param {boolean} enabled - 是否启用振动
   */
  setVibration(enabled) {
    this.params.vibrationEnabled = enabled;
  }
  
  /**
   * 设置当前活跃层
   * @param {number} layerId - 层ID
   */
  setActiveLayer(layerId) {
    for (const layer of this.rhythmLayers) {
      layer.active = layer.id === layerId;
    }
  }
  
  /**
   * 获取当前活跃层
   * @returns {Object} 活跃层
   */
  getActiveLayer() {
    return this.rhythmLayers.find(layer => layer.active) || this.rhythmLayers[0];
  }
  
  /**
   * 设置层静音状态
   * @param {number} layerId - 层ID
   * @param {boolean} muted - 是否静音
   */
  setLayerMuted(layerId, muted) {
    const layer = this.rhythmLayers.find(l => l.id === layerId);
    if (layer) {
      layer.muted = muted;
    }
  }
  
  /**
   * 清除层的音符
   * @param {number} layerId - 层ID
   */
  clearLayerNotes(layerId) {
    const layer = this.rhythmLayers.find(l => l.id === layerId);
    if (layer) {
      layer.notes = [];
    }
  }
  
  /**
   * 清除所有层的音符
   */
  clearAllNotes() {
    for (const layer of this.rhythmLayers) {
      layer.notes = [];
    }
  }
  
  /**
   * 播放音符
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 选项
   * @returns {Object} 音符信息
   */
  async playNote(x, y, options = {}) {
    if (this.params.muted) return null;
    
    // 确保音频上下文已启动
    const contextReady = await this.ensureAudioContext();
    if (!contextReady) return null;
    
    try {
      // 获取当前活跃层
      const layer = options.layer || this.getActiveLayer();
      if (layer.muted) return null;
      
      // 映射坐标到音符索引
      const noteIndex = this.mapPositionToNoteIndex(x, y);
      
      // 获取音符频率
      const baseFreq = this.noteFrequencies[this.params.noteScale][noteIndex];
      const octaveShift = layer.octave;
      const frequency = baseFreq * Math.pow(2, octaveShift);
      
      // 创建振荡器
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = options.waveform || layer.waveform;
      oscillator.frequency.value = frequency;
      
      // 创建增益节点（音量包络）
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0;
      
      // 连接节点
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 当前时间
      const now = this.audioContext.currentTime;
      
      // 设置音量包络
      const attack = options.attack || layer.attack;
      const decay = options.decay || layer.decay;
      const sustain = options.sustain || layer.sustain;
      const release = options.release || layer.release;
      
      // 音符持续时间
      const duration = options.duration || 0.5;
      
      // 应用音量包络
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + attack);
      gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
      gainNode.gain.setValueAtTime(sustain, now + duration);
      gainNode.gain.linearRampToValueAtTime(0, now + duration + release);
      
      // 开始振荡器
      oscillator.start(now);
      oscillator.stop(now + duration + release);
      
      // 振动反馈
      if (this.params.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(options.vibration || 20);
      }
      
      // 创建音符对象
      const note = {
        id: generateId(),
        layerId: layer.id,
        x,
        y,
        frequency,
        noteIndex,
        time: Date.now(),
        duration,
        oscillator,
        gainNode
      };
      
      // 添加到活跃音频源
      this.activeSounds.push(note);
      
      // 清理已完成的音频源
      setTimeout(() => {
        this.cleanupSound(note);
      }, (duration + release) * 1000 + 100);
      
      // 如果需要记录音符，添加到层的音符列表
      if (options.record !== false) {
        layer.notes.push({
          id: note.id,
          x,
          y,
          frequency,
          noteIndex,
          time: note.time,
          duration
        });
      }
      
      return note;
    } catch (error) {
      console.error('播放音符失败:', error);
      this.errorCount++;
      return null;
    }
  }
  
  /**
   * 映射位置到音符索引
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @returns {number} 音符索引
   */
  mapPositionToNoteIndex(x, y) {
    // 使用y坐标映射到音符索引（屏幕上方为高音，下方为低音）
    const noteCount = this.noteFrequencies[this.params.noteScale].length;
    const index = Math.floor((1 - y) * noteCount);
    return clamp(index, 0, noteCount - 1);
  }
  
  /**
   * 播放节奏层
   * @param {number} layerId - 层ID
   * @param {number} startTime - 开始时间（毫秒）
   */
  async playRhythmLayer(layerId, startTime = Date.now()) {
    const layer = this.rhythmLayers.find(l => l.id === layerId);
    if (!layer || layer.muted || layer.notes.length === 0) return;
    
    // 确保音频上下文已启动
    const contextReady = await this.ensureAudioContext();
    if (!contextReady) return;
    
    // 计算循环持续时间（基于最后一个音符的时间）
    const lastNoteTime = Math.max(...layer.notes.map(note => note.time));
    const loopDuration = lastNoteTime - layer.notes[0].time + 2000; // 添加2秒缓冲
    
    // 播放所有音符
    for (const note of layer.notes) {
      // 计算相对时间
      const relativeTime = note.time - layer.notes[0].time;
      
      // 计算当前循环中的播放时间
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const loopPosition = elapsedTime % loopDuration;
      
      // 如果即将播放或刚错过，则播放音符
      const timeUntilNote = relativeTime - loopPosition;
      
      if (timeUntilNote >= 0 && timeUntilNote < 100) {
        // 立即播放
        this.playNote(note.x, note.y, {
          layer,
          duration: note.duration,
          record: false
        });
      } else if (timeUntilNote < 0 && timeUntilNote > -100) {
        // 刚错过，也播放
        this.playNote(note.x, note.y, {
          layer,
          duration: note.duration,
          record: false
        });
      }
    }
    
    // 继续循环播放
    setTimeout(() => {
      this.playRhythmLayer(layerId, startTime);
    }, 100); // 每100毫秒检查一次
  }
  
  /**
   * 播放所有节奏层
   */
  async playAllRhythmLayers() {
    const startTime = Date.now();
    
    for (const layer of this.rhythmLayers) {
      if (layer.notes.length > 0) {
        this.playRhythmLayer(layer.id, startTime);
      }
    }
  }
  
  /**
   * 播放环境音效
   * @param {string} type - 音效类型
   * @param {Object} options - 选项
   */
  async playAmbientSound(type, options = {}) {
    if (this.params.muted) return;
    
    // 确保音频上下文已启动
    const contextReady = await this.ensureAudioContext();
    if (!contextReady) return;
    
    try {
      // 创建噪声源
      const bufferSize = 2 * this.audioContext.sampleRate;
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // 生成噪声
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      // 创建缓冲源
      const source = this.audioContext.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      
      // 创建滤波器
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = options.frequency || 400;
      filter.Q.value = options.resonance || 10;
      
      // 创建增益节点
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume || 0.05;
      
      // 连接节点
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 开始播放
      source.start();
      
      // 创建环境音效对象
      const ambientSound = {
        id: generateId(),
        type,
        source,
        filter,
        gainNode
      };
      
      // 添加到活跃音频源
      this.activeSounds.push(ambientSound);
      
      return ambientSound;
    } catch (error) {
      console.error('播放环境音效失败:', error);
      return null;
    }
  }
  
  /**
   * 清理音频源
   * @param {Object} sound - 音频源
   */
  cleanupSound(sound) {
    try {
      const index = this.activeSounds.indexOf(sound);
      if (index !== -1) {
        this.activeSounds.splice(index, 1);
      }
      
      // 断开连接以释放资源
      if (sound.gainNode) {
        sound.gainNode.disconnect();
      }
      
      if (sound.oscillator) {
        sound.oscillator.disconnect();
      }
      
      if (sound.filter) {
        sound.filter.disconnect();
      }
      
      if (sound.source) {
        sound.source.disconnect();
      }
    } catch (error) {
      console.error('清理音频源失败:', error);
    }
  }
  
  /**
   * 停止所有音频
   */
  stopAllSounds() {
    // 复制数组，因为在循环中会修改原数组
    const sounds = [...this.activeSounds];
    
    for (const sound of sounds) {
      this.cleanupSound(sound);
    }
    
    this.activeSounds = [];
  }
  
  /**
   * 释放资源
   */
  dispose() {
    this.stopAllSounds();
    
    if (this.audioContext) {
      this.audioContext.close().catch(error => {
        console.error('关闭音频上下文失败:', error);
      });
    }
    
    this.initialized = false;
    this.initializationAttempted = false;
  }
}
