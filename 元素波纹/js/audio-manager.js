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
    
    // 音效缓存
    this.soundBuffers = {
      water: [],
      fire: [],
      electric: [],
      light: []
    };
    
    // 当前播放的音效
    this.activeSounds = [];
    
    // 音效变化参数
    this.pitchRange = 0.5;  // 音高变化范围
    this.panRange = 0.8;    // 声像变化范围
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
      
      // 加载音效
      await this.loadSounds();
      
      this.initialized = true;
      console.log('音频系统初始化完成');
      return true;
    } catch (error) {
      console.error('音频系统初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载所有音效
   */
  async loadSounds() {
    // 使用合成音效代替加载外部文件
    // 这样可以减少依赖并确保项目完全自包含
    this.generateSynthSounds();
  }

  /**
   * 生成合成音效
   */
  generateSynthSounds() {
    // 为每种元素生成多个变体的合成音效
    // 水元素音效 - 柔和的水滴声
    for (let i = 0; i < 5; i++) {
      this.soundBuffers.water.push(this.createWaterSound(0.8 + i * 0.1));
    }
    
    // 火元素音效 - 噼啪声
    for (let i = 0; i < 5; i++) {
      this.soundBuffers.fire.push(this.createFireSound(0.7 + i * 0.15));
    }
    
    // 电元素音效 - 电流声
    for (let i = 0; i < 5; i++) {
      this.soundBuffers.electric.push(this.createElectricSound(0.6 + i * 0.2));
    }
    
    // 光元素音效 - 明亮的音调
    for (let i = 0; i < 5; i++) {
      this.soundBuffers.light.push(this.createLightSound(0.5 + i * 0.25));
    }
  }

  /**
   * 创建水元素音效
   */
  createWaterSound(pitch = 1.0) {
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成水滴声音效
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const frequency = 1000 * pitch * Math.exp(-10 * t);
      const amplitude = 0.5 * Math.exp(-15 * t);
      
      // 添加一些随机噪声模拟水滴声
      const noise = (Math.random() * 2 - 1) * 0.05 * Math.exp(-20 * t);
      
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * t) + noise;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建火元素音效
   */
  createFireSound(pitch = 1.0) {
    const duration = 0.6;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成火焰噼啪声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 基础噪声
      let noise = (Math.random() * 2 - 1) * 0.3 * Math.exp(-3 * t);
      
      // 添加一些爆裂声
      if (Math.random() < 0.01) {
        noise *= 3;
      }
      
      // 添加低频成分
      const lowFreq = 100 * pitch;
      const lowComp = 0.2 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-5 * t);
      
      const sample = noise + lowComp;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建电元素音效
   */
  createElectricSound(pitch = 1.0) {
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成电流声
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // 高频噪声
      const noise = (Math.random() * 2 - 1) * 0.4 * Math.exp(-10 * t);
      
      // 添加电流嗡嗡声
      const buzz = 0.3 * Math.sin(2 * Math.PI * 60 * t) * 
                  Math.sin(2 * Math.PI * 1000 * pitch * t) * 
                  Math.exp(-5 * t);
      
      const sample = noise + buzz;
      
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return buffer;
  }

  /**
   * 创建光元素音效
   */
  createLightSound(pitch = 1.0) {
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // 生成明亮的音调
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
   * 播放元素音效
   * @param {string} element - 元素类型 (water, fire, electric, light)
   * @param {number} x - 触摸位置的X坐标 (0-1)
   * @param {number} y - 触摸位置的Y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  playElementSound(element, x, y, intensity) {
    if (!this.initialized) return;
    
    // 确保音频上下文已启动
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 获取对应元素的音效缓冲区
    const buffers = this.soundBuffers[element];
    if (!buffers || buffers.length === 0) return;
    
    // 随机选择一个变体
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    
    // 创建音源
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    // 根据强度调整音高
    const pitchVariation = 0.8 + (intensity * 0.4) + (Math.random() * this.pitchRange - this.pitchRange/2);
    source.playbackRate.value = pitchVariation;
    
    // 创建声像控制
    const panner = this.audioContext.createStereoPanner();
    // 将x坐标(0-1)映射到声像(-1到1)
    panner.pan.value = (x * 2 - 1) * this.panRange;
    
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
