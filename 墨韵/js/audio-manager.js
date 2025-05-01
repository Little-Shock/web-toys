/**
 * 音频管理器
 * 负责处理所有与音频相关的功能
 */
class AudioManager {
  constructor() {
    // 初始化Web Audio API
    this.audioContext = null;
    this.masterGain = null;
    this.initialized = false;
    this.enabled = true;
    
    // 音效缓存
    this.soundBuffers = {
      brush: [],
      splash: [],
      water: [],
      paper: []
    };
    
    // 当前播放的音效
    this.activeSounds = [];
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化音频系统
   */
  async init() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);
      
      // 生成音效
      this.generateSounds();
      
      this.initialized = true;
      console.log('音频系统初始化完成');
      return true;
    } catch (error) {
      console.error('音频系统初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 生成合成音效
   */
  generateSounds() {
    // 为每种事件生成多个变体的合成音效
    // 笔刷音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.brush.push(this.createBrushSound(0.8 + i * 0.1));
    }
    
    // 泼墨音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.splash.push(this.createSplashSound(0.7 + i * 0.2));
    }
    
    // 水滴音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.water.push(this.createWaterSound(0.6 + i * 0.2));
    }
    
    // 纸张音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.paper.push(this.createPaperSound(0.9 + i * 0.1));
    }
  }
  
  /**
   * 创建笔刷音效
   */
  createBrushSound(pitch = 1.0) {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成笔刷音效 - 柔和的摩擦声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 噪声成分
      const noise = (Math.random() * 2 - 1) * 0.15 * Math.exp(-8 * t);
      
      // 添加一些低频成分
      const lowFreq = 100 * pitch;
      const lowComp = 0.05 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-5 * t);
      
      const sample = noise + lowComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建泼墨音效
   */
  createSplashSound(pitch = 1.0) {
    const duration = 0.6;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成泼墨音效 - 水花声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 主要噪声
      let noise = (Math.random() * 2 - 1) * 0.3 * Math.exp(-5 * t);
      
      // 添加一些水滴声
      if (Math.random() < 0.05) {
        noise *= 2;
      }
      
      // 添加一些低频成分
      const lowFreq = 80 * pitch;
      const lowComp = 0.1 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-10 * t);
      
      const sample = noise + lowComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建水滴音效
   */
  createWaterSound(pitch = 1.0) {
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成水滴音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 水滴的主要频率
      const dropFreq = 800 * pitch * Math.exp(-15 * t);
      const dropAmp = 0.3 * Math.exp(-12 * t);
      
      // 添加一些涟漪效果
      const rippleFreq = 400 * pitch * Math.exp(-8 * t);
      const rippleAmp = 0.1 * Math.exp(-5 * t) * (1 - Math.exp(-20 * t));
      
      const sample = 
        dropAmp * Math.sin(2 * Math.PI * dropFreq * t) +
        rippleAmp * Math.sin(2 * Math.PI * rippleFreq * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建纸张音效
   */
  createPaperSound(pitch = 1.0) {
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成纸张音效 - 轻微的摩擦声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 噪声成分
      const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-20 * t);
      
      // 添加一些纸张特性
      const paperFreq = 200 * pitch;
      const paperComp = 0.05 * Math.sin(2 * Math.PI * paperFreq * t) * Math.exp(-30 * t);
      
      const sample = noise + paperComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 播放音效
   * @param {string} type - 音效类型 (brush, splash, water, paper)
   * @param {number} x - 事件位置的X坐标 (0-1)
   * @param {number} y - 事件位置的Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   * @param {number} variation - 变化程度 (0-1)
   */
  playSound(type, x, y, intensity = 0.5, variation = 0.2) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 获取对应类型的音效缓冲区
    const buffers = this.soundBuffers[type];
    if (!buffers || buffers.length === 0) return;
    
    // 随机选择一个变体
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    
    // 创建音源
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // 根据强度和变化程度调整音高
    const pitchVariation = 0.8 + (intensity * 0.4) + (Math.random() * variation - variation/2);
    source.playbackRate.value = pitchVariation;
    
    // 创建声像控制
    const panner = this.audioContext.createStereoPanner();
    // 将x坐标(0-1)映射到声像(-1到1)
    panner.pan.value = (x * 2 - 1) * 0.8;
    
    // 创建音量控制
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = Math.min(0.7, 0.3 + intensity * 0.5);
    
    // 连接节点
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);
    
    // 播放音效
    source.start();
    
    // 跟踪活动音效
    const soundObj = { source, gainNode, startTime: this.audioContext.currentTime };
    this.activeSounds.push(soundObj);
    
    // 设置自动清理
    source.onended = () => {
      const index = this.activeSounds.indexOf(soundObj);
      if (index !== -1) {
        this.activeSounds.splice(index, 1);
      }
    };
    
    // 防止同时播放太多音效
    this.limitActiveSounds();
  }
  
  /**
   * 限制同时播放的音效数量
   */
  limitActiveSounds() {
    const maxSounds = 8;
    
    if (this.activeSounds.length > maxSounds) {
      // 按开始时间排序，停止最早的音效
      this.activeSounds.sort((a, b) => a.startTime - b.startTime);
      
      while (this.activeSounds.length > maxSounds) {
        const oldest = this.activeSounds.shift();
        oldest.source.stop();
      }
    }
  }
  
  /**
   * 设置主音量
   * @param {number} value - 音量值 (0-1)
   */
  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }
  
  /**
   * 启用/禁用音效
   * @param {boolean} enabled - 是否启用音效
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      this.stopAllSounds();
    }
  }
  
  /**
   * 停止所有音效
   */
  stopAllSounds() {
    if (!this.initialized) return;
    
    this.activeSounds.forEach(sound => {
      sound.source.stop();
    });
    
    this.activeSounds = [];
  }
}
