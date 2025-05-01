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
      fabric: [],
      pin: [],
      cut: [],
      wind: [],
      ui: []
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
    // 织物音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.fabric.push(this.createFabricSound(0.8 + i * 0.1));
    }
    
    // 固定点音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.pin.push(this.createPinSound(0.9 + i * 0.1));
    }
    
    // 剪裁音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.cut.push(this.createCutSound(0.8 + i * 0.2));
    }
    
    // 风力音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.wind.push(this.createWindSound(0.7 + i * 0.3));
    }
    
    // UI音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.ui.push(this.createUISound(0.9 + i * 0.1));
    }
  }
  
  /**
   * 创建织物音效
   */
  createFabricSound(pitch = 1.0) {
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成织物音效 - 柔和的摩擦声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 噪声成分
      const noise = (Math.random() * 2 - 1) * 0.2 * Math.exp(-10 * t);
      
      // 添加一些低频成分
      const lowFreq = 200 * pitch;
      const lowComp = 0.1 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-5 * t);
      
      const sample = noise + lowComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建固定点音效
   */
  createPinSound(pitch = 1.0) {
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成固定点音效 - 短促的点击声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 高频成分
      const highFreq = 1000 * pitch;
      const highComp = 0.5 * Math.sin(2 * Math.PI * highFreq * t) * Math.exp(-30 * t);
      
      // 添加一些噪声
      const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-40 * t);
      
      const sample = highComp + noise;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建剪裁音效
   */
  createCutSound(pitch = 1.0) {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成剪裁音效 - 剪刀声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 金属摩擦声
      const freq1 = 2000 * pitch;
      const freq2 = 3000 * pitch;
      
      let sample = 0;
      
      // 两次剪切声
      if (t < 0.15) {
        sample = 0.3 * Math.sin(2 * Math.PI * freq1 * t) * Math.exp(-20 * t);
      } else {
        sample = 0.3 * Math.sin(2 * Math.PI * freq2 * (t - 0.15)) * Math.exp(-20 * (t - 0.15));
      }
      
      // 添加一些噪声
      const noise = (Math.random() * 2 - 1) * 0.2 * Math.exp(-10 * t);
      
      sample += noise;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建风力音效
   */
  createWindSound(pitch = 1.0) {
    const duration = 1.0;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成风力音效 - 呼呼声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 使用滤波噪声模拟风声
      let noise = (Math.random() * 2 - 1) * 0.3;
      
      // 应用低通滤波
      const filterFreq = 500 * pitch;
      const filterQ = 1.0;
      const filterGain = 0.8;
      
      // 简单的一阶低通滤波
      if (i > 0) {
        noise = noise * filterGain + leftChannel[i - 1] * (1 - filterGain);
      }
      
      // 添加风的起伏
      const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t);
      
      const sample = noise * envelope * Math.exp(-1 * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建UI音效
   */
  createUISound(pitch = 1.0) {
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成UI音效 - 简短的点击声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 快速衰减的高频音调
      const freq = 800 * pitch;
      const amp = 0.5 * Math.exp(-30 * t);
      
      const tone = amp * Math.sin(2 * Math.PI * freq * t);
      
      // 添加一些噪声
      const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-50 * t);
      
      const sample = tone + noise;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 播放织物音效
   * @param {string} fabricType - 织物类型
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  playFabricSound(fabricType, x, y, intensity = 0.5) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据织物类型调整音高
    let pitch = 1.0;
    switch (fabricType) {
      case 'silk':
        pitch = 1.2;
        break;
      case 'cotton':
        pitch = 1.0;
        break;
      case 'wool':
        pitch = 0.8;
        break;
      case 'denim':
        pitch = 0.7;
        break;
    }
    
    // 播放音效
    this.playSound('fabric', x, y, intensity, pitch);
  }
  
  /**
   * 播放固定点音效
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   */
  playPinSound(x, y) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 播放音效
    this.playSound('pin', x, y, 0.7, 1.0);
  }
  
  /**
   * 播放剪裁音效
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} size - 剪裁大小 (0-1)
   */
  playCutSound(x, y, size = 0.5) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据剪裁大小调整音高
    const pitch = 1.0 - size * 0.5;
    
    // 播放音效
    this.playSound('cut', x, y, 0.8, pitch);
  }
  
  /**
   * 播放风力音效
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} strength - 风力强度 (0-1)
   */
  playWindSound(x, y, strength = 0.5) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据风力强度调整音高和音量
    const pitch = 0.8 + strength * 0.4;
    
    // 播放音效
    this.playSound('wind', x, y, strength, pitch);
  }
  
  /**
   * 播放UI音效
   * @param {string} action - 操作类型 (click, toggle, etc.)
   */
  playUISound(action = 'click') {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据操作类型调整音高
    let pitch = 1.0;
    switch (action) {
      case 'click':
        pitch = 1.0;
        break;
      case 'toggle':
        pitch = 1.2;
        break;
      case 'error':
        pitch = 0.8;
        break;
      case 'success':
        pitch = 1.5;
        break;
    }
    
    // 播放音效
    this.playSound('ui', 0.5, 0.5, 0.7, pitch);
  }
  
  /**
   * 播放音效
   * @param {string} type - 音效类型 (fabric, pin, cut, wind, ui)
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   * @param {number} pitch - 音高 (0.5-2.0)
   */
  playSound(type, x, y, intensity = 0.7, pitch = 1.0) {
    if (!this.initialized || !this.enabled) return;
    
    // 获取对应类型的音效缓冲区
    const buffers = this.soundBuffers[type];
    if (!buffers || buffers.length === 0) return;
    
    // 随机选择一个变体
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    
    // 创建音源
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // 设置音高
    source.playbackRate.value = pitch;
    
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
