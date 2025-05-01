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
      light: [],
      object: [],
      ambient: [],
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
    // 光源音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.light.push(this.createLightSound(0.8 + i * 0.1));
    }
    
    // 物体音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.object.push(this.createObjectSound(0.7 + i * 0.2));
    }
    
    // 环境音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.ambient.push(this.createAmbientSound(0.9 + i * 0.1));
    }
    
    // UI音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.ui.push(this.createUISound(0.8 + i * 0.2));
    }
  }
  
  /**
   * 创建光源音效
   */
  createLightSound(pitch = 1.0) {
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成光源音效 - 明亮的音调
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 基础频率
      const baseFreq = 440 * pitch;
      
      // 和声
      const harmonic1 = 0.5 * Math.sin(2 * Math.PI * baseFreq * t) * Math.exp(-3 * t);
      const harmonic2 = 0.3 * Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * Math.exp(-4 * t);
      const harmonic3 = 0.2 * Math.sin(2 * Math.PI * baseFreq * 2 * t) * Math.exp(-5 * t);
      
      const sample = harmonic1 + harmonic2 + harmonic3;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建物体音效
   */
  createObjectSound(pitch = 1.0) {
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成物体音效 - 低沉的音调
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 低频成分
      const lowFreq = 150 * pitch;
      const lowComp = 0.5 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-5 * t);
      
      // 添加一些噪声
      const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-10 * t);
      
      const sample = lowComp + noise;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }
  
  /**
   * 创建环境音效
   */
  createAmbientSound(pitch = 1.0) {
    const duration = 1.0;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成环境音效 - 柔和的背景音
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 多个频率的叠加
      const freq1 = 100 * pitch;
      const freq2 = 150 * pitch;
      const freq3 = 200 * pitch;
      
      const amp1 = 0.3 * Math.sin(2 * Math.PI * 0.5 * t) * Math.exp(-1 * t);
      const amp2 = 0.2 * Math.sin(2 * Math.PI * 0.7 * t) * Math.exp(-1 * t);
      const amp3 = 0.1 * Math.sin(2 * Math.PI * 0.9 * t) * Math.exp(-1 * t);
      
      const tone1 = amp1 * Math.sin(2 * Math.PI * freq1 * t);
      const tone2 = amp2 * Math.sin(2 * Math.PI * freq2 * t);
      const tone3 = amp3 * Math.sin(2 * Math.PI * freq3 * t);
      
      const sample = tone1 + tone2 + tone3;
      
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
   * 播放光源音效
   * @param {string} type - 光源类型 (point, spot, directional, ambient)
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  playLightSound(type, x, y, intensity = 0.7) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据光源类型调整音高
    let pitch = 1.0;
    switch (type) {
      case 'point':
        pitch = 1.0;
        break;
      case 'spot':
        pitch = 1.2;
        break;
      case 'directional':
        pitch = 0.8;
        break;
      case 'ambient':
        pitch = 0.6;
        break;
    }
    
    // 播放音效
    this.playSound('light', x, y, intensity, pitch);
  }
  
  /**
   * 播放物体音效
   * @param {string} type - 物体类型 (rectangle, circle, triangle, custom)
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @param {number} size - 物体大小 (0-1)
   */
  playObjectSound(type, x, y, size = 0.5) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 根据物体类型调整音高
    let pitch = 1.0;
    switch (type) {
      case 'rectangle':
        pitch = 1.0;
        break;
      case 'circle':
        pitch = 1.2;
        break;
      case 'triangle':
        pitch = 0.9;
        break;
      case 'custom':
        pitch = 0.8;
        break;
    }
    
    // 播放音效
    this.playSound('object', x, y, size, pitch);
  }
  
  /**
   * 播放环境音效
   * @param {number} intensity - 强度 (0-1)
   */
  playAmbientSound(intensity = 0.5) {
    if (!this.initialized || !this.enabled) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 播放音效
    this.playSound('ambient', 0.5, 0.5, intensity, 1.0);
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
   * @param {string} type - 音效类型 (light, object, ambient, ui)
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
