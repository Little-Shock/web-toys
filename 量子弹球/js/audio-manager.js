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
    this.volume = 0.7; // 默认音量
    this.enabled = true; // 是否启用音效
    
    // 音效缓存
    this.soundBuffers = {
      bounce: [],
      bumper: [],
      portal: [],
      gravity: [],
      wall: []
    };
    
    // 当前播放的音效
    this.activeSounds = [];
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
      this.masterGain.gain.value = this.volume;
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
    // 弹跳音效
    for (let i = 0; i < 5; i++) {
      this.soundBuffers.bounce.push(this.createBounceSound(0.8 + i * 0.1));
    }
    
    // 弹射器音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.bumper.push(this.createBumperSound(0.7 + i * 0.2));
    }
    
    // 传送门音效
    for (let i = 0; i < 2; i++) {
      this.soundBuffers.portal.push(this.createPortalSound(0.9 + i * 0.2));
    }
    
    // 重力井音效
    for (let i = 0; i < 3; i++) {
      this.soundBuffers.gravity.push(this.createGravitySound(0.6 + i * 0.2));
    }
    
    // 墙壁碰撞音效
    for (let i = 0; i < 4; i++) {
      this.soundBuffers.wall.push(this.createWallSound(0.7 + i * 0.1));
    }
  }

  /**
   * 创建弹跳音效
   */
  createBounceSound(pitch = 1.0) {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成弹跳音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const frequency = 400 * pitch * Math.exp(-10 * t);
      const amplitude = 0.5 * Math.exp(-15 * t);
      
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建弹射器音效
   */
  createBumperSound(pitch = 1.0) {
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成弹射器音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 上升音调
      const frequency = 300 * pitch * (1 + t * 4);
      const amplitude = 0.6 * Math.exp(-8 * t);
      
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建传送门音效
   */
  createPortalSound(pitch = 1.0) {
    const duration = 0.6;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成传送门音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 扫频音效
      const frequency = 500 * pitch * Math.sin(2 * Math.PI * 5 * t);
      const amplitude = 0.5 * (0.1 + Math.sin(2 * Math.PI * 2 * t) * 0.4);
      
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建重力井音效
   */
  createGravitySound(pitch = 1.0) {
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成重力井音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 下降音调
      const frequency = 600 * pitch * Math.exp(-3 * t);
      const amplitude = 0.4 * (1 - Math.exp(-5 * t));
      
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建墙壁碰撞音效
   */
  createWallSound(pitch = 1.0) {
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成墙壁碰撞音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 短促的噪声
      const noise = (Math.random() * 2 - 1) * 0.3 * Math.exp(-30 * t);
      
      // 添加一些低频成分
      const lowFreq = 100 * pitch;
      const lowComp = 0.3 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-20 * t);
      
      const sample = noise + lowComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 播放音效
   * @param {string} type - 音效类型 (bounce, bumper, portal, gravity, wall)
   * @param {number} x - 事件位置的X坐标 (0-1)
   * @param {number} y - 事件位置的Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  playSound(type, x, y, intensity = 0.5) {
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
    
    // 根据强度调整音高
    const pitchVariation = 0.8 + (intensity * 0.4) + (Math.random() * 0.2 - 0.1);
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
    const maxSounds = 10;
    
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
    this.volume = Math.max(0, Math.min(1, value));
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
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
