/**
 * 音频管理器
 * 负责处理所有与音频相关的功能
 * 优化版本：提高移动端性能，改善音频体验
 */
class AudioManager {
  constructor() {
    // 初始化Web Audio API
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    this.initialized = false;
    this.volume = 0.7; // 默认音量
    this.muted = false; // 静音状态

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

    // 性能相关参数
    this.lastPlayTime = 0;
    this.playThrottleTime = 50; // 限制音效播放频率（毫秒）
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 如果是移动设备，增加节流时间
    if (this.isMobile) {
      this.playThrottleTime = 100;
      this.pitchRange = 0.3; // 减小移动设备上的音高变化范围
    }

    // 音频上下文恢复处理
    this.setupAudioContextResume();
  }

  /**
   * 设置音频上下文恢复处理
   * 解决移动设备上的自动播放限制问题
   */
  setupAudioContextResume() {
    const resumeAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('音频上下文已恢复');
        }).catch(error => {
          console.error('恢复音频上下文失败:', error);
        });
      }
    };

    // 添加用户交互事件监听器
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resumeAudio, { once: true });
    });
  }

  /**
   * 初始化音频系统
   */
  async init() {
    try {
      // 如果已经初始化，直接返回
      if (this.initialized) {
        return true;
      }

      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 创建动态压缩器以防止音频过载
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.compressor.connect(this.audioContext.destination);

      // 创建主音量控制
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.compressor);

      // 加载音效
      await this.loadSounds();

      this.initialized = true;
      console.log('音频系统初始化完成');
      return true;
    } catch (error) {
      console.error('音频系统初始化失败:', error);
      // 设置静默模式，防止后续错误
      this.muted = true;
      return false;
    }
  }

  /**
   * 加载所有音效
   */
  async loadSounds() {
    return new Promise((resolve) => {
      // 使用合成音效代替加载外部文件
      // 这样可以减少依赖并确保项目完全自包含
      try {
        this.generateSynthSounds();
        resolve();
      } catch (error) {
        console.error('生成音效失败:', error);
        // 即使生成失败也继续，不阻止应用程序运行
        resolve();
      }
    });
  }

  /**
   * 生成合成音效
   */
  generateSynthSounds() {
    // 根据设备类型调整音效数量
    const variantCount = this.isMobile ? 3 : 5;

    try {
      // 为每种元素生成多个变体的合成音效
      // 水元素音效 - 柔和的水滴声
      for (let i = 0; i < variantCount; i++) {
        this.soundBuffers.water.push(this.createWaterSound(0.8 + i * 0.1));
      }

      // 火元素音效 - 噼啪声
      for (let i = 0; i < variantCount; i++) {
        this.soundBuffers.fire.push(this.createFireSound(0.7 + i * 0.15));
      }

      // 电元素音效 - 电流声
      for (let i = 0; i < variantCount; i++) {
        this.soundBuffers.electric.push(this.createElectricSound(0.6 + i * 0.2));
      }

      // 光元素音效 - 明亮的音调
      for (let i = 0; i < variantCount; i++) {
        this.soundBuffers.light.push(this.createLightSound(0.5 + i * 0.25));
      }
    } catch (error) {
      console.error('生成音效时出错:', error);
      throw error;
    }
  }

  /**
   * 创建水元素音效
   * @param {number} pitch - 音高
   * @returns {AudioBuffer} 音频缓冲区
   */
  createWaterSound(pitch = 1.0) {
    // 根据设备类型调整音效时长
    const duration = this.isMobile ? 0.3 : 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    try {
      // 生成水滴声音效
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        const frequency = 1000 * pitch * Math.exp(-10 * t);
        const amplitude = 0.5 * Math.exp(-15 * t);

        // 添加一些随机噪声模拟水滴声
        // 使用伪随机数生成器以提高性能
        const noise = (Math.sin(i * 0.1) * 0.5 + 0.5) * 0.05 * Math.exp(-20 * t);

        const sample = amplitude * Math.sin(2 * Math.PI * frequency * t) + noise;

        // 应用淡入淡出以防止爆音
        const fadeIn = Math.min(1, t * 10);
        const fadeOut = Math.min(1, (duration - t) * 10);
        const fade = fadeIn * fadeOut;

        leftChannel[i] = sample * fade;
        rightChannel[i] = sample * fade;
      }
    } catch (error) {
      console.error('创建水元素音效失败:', error);
      // 填充静音数据
      for (let i = 0; i < bufferSize; i++) {
        leftChannel[i] = 0;
        rightChannel[i] = 0;
      }
    }

    return buffer;
  }

  /**
   * 创建火元素音效
   * @param {number} pitch - 音高
   * @returns {AudioBuffer} 音频缓冲区
   */
  createFireSound(pitch = 1.0) {
    // 根据设备类型调整音效时长
    const duration = this.isMobile ? 0.4 : 0.6;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    try {
      // 生成火焰噼啪声
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;

        // 基础噪声 - 使用伪随机数以提高性能
        let noise = (Math.sin(i * 0.3) * 0.5 + 0.5) * 0.3 * Math.exp(-3 * t);

        // 添加一些爆裂声
        if (Math.sin(i * 0.7) > 0.95) {
          noise *= 3;
        }

        // 添加低频成分
        const lowFreq = 100 * pitch;
        const lowComp = 0.2 * Math.sin(2 * Math.PI * lowFreq * t) * Math.exp(-5 * t);

        const sample = noise + lowComp;

        // 应用淡入淡出
        const fadeIn = Math.min(1, t * 10);
        const fadeOut = Math.min(1, (duration - t) * 8);
        const fade = fadeIn * fadeOut;

        leftChannel[i] = sample * fade;
        rightChannel[i] = sample * fade;
      }
    } catch (error) {
      console.error('创建火元素音效失败:', error);
      // 填充静音数据
      for (let i = 0; i < bufferSize; i++) {
        leftChannel[i] = 0;
        rightChannel[i] = 0;
      }
    }

    return buffer;
  }

  /**
   * 创建电元素音效
   * @param {number} pitch - 音高
   * @returns {AudioBuffer} 音频缓冲区
   */
  createElectricSound(pitch = 1.0) {
    // 根据设备类型调整音效时长
    const duration = this.isMobile ? 0.2 : 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    try {
      // 生成电流声
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;

        // 高频噪声 - 使用伪随机数以提高性能
        const noise = (Math.sin(i * 0.5) * 0.5 + 0.5) * 0.4 * Math.exp(-10 * t);

        // 添加电流嗡嗡声
        const buzz = 0.3 * Math.sin(2 * Math.PI * 60 * t) *
                    Math.sin(2 * Math.PI * 1000 * pitch * t) *
                    Math.exp(-5 * t);

        const sample = noise + buzz;

        // 应用淡入淡出
        const fadeIn = Math.min(1, t * 20);
        const fadeOut = Math.min(1, (duration - t) * 10);
        const fade = fadeIn * fadeOut;

        leftChannel[i] = sample * fade;
        rightChannel[i] = sample * fade;
      }
    } catch (error) {
      console.error('创建电元素音效失败:', error);
      // 填充静音数据
      for (let i = 0; i < bufferSize; i++) {
        leftChannel[i] = 0;
        rightChannel[i] = 0;
      }
    }

    return buffer;
  }

  /**
   * 创建光元素音效
   * @param {number} pitch - 音高
   * @returns {AudioBuffer} 音频缓冲区
   */
  createLightSound(pitch = 1.0) {
    // 根据设备类型调整音效时长
    const duration = this.isMobile ? 0.3 : 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.floor(duration * sampleRate);
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    try {
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

        // 应用淡入淡出
        const fadeIn = Math.min(1, t * 15);
        const fadeOut = Math.min(1, (duration - t) * 8);
        const fade = fadeIn * fadeOut;

        leftChannel[i] = sample * fade;
        rightChannel[i] = sample * fade;
      }
    } catch (error) {
      console.error('创建光元素音效失败:', error);
      // 填充静音数据
      for (let i = 0; i < bufferSize; i++) {
        leftChannel[i] = 0;
        rightChannel[i] = 0;
      }
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
    // 如果未初始化或静音，直接返回
    if (!this.initialized || this.muted) return;

    // 节流控制，防止音效播放过于频繁
    const now = performance.now();
    if (now - this.lastPlayTime < this.playThrottleTime) return;
    this.lastPlayTime = now;

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
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
      const soundObj = {
        source,
        gainNode,
        panner,
        startTime: this.audioContext.currentTime,
        element,
        intensity
      };
      this.activeSounds.push(soundObj);

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      // 防止同时播放太多音效
      this.limitActiveSounds();
    } catch (error) {
      console.error('播放音效失败:', error);
      // 出错时设置静默模式，防止继续尝试播放
      if (error.name === 'NotAllowedError') {
        console.warn('浏览器不允许自动播放音频，请等待用户交互');
      } else {
        this.muted = true;
      }
    }
  }

  /**
   * 清理单个音效
   * @param {Object} soundObj - 音效对象
   */
  cleanupSound(soundObj) {
    try {
      const index = this.activeSounds.indexOf(soundObj);
      if (index !== -1) {
        this.activeSounds.splice(index, 1);
      }

      // 断开连接以释放资源
      if (soundObj.gainNode) {
        soundObj.gainNode.disconnect();
      }
      if (soundObj.panner) {
        soundObj.panner.disconnect();
      }
    } catch (error) {
      console.error('清理音效失败:', error);
    }
  }

  /**
   * 限制同时播放的音效数量
   */
  limitActiveSounds() {
    // 根据设备类型调整最大同时播放的音效数量
    const maxSounds = this.isMobile ? 6 : 10;

    if (this.activeSounds.length > maxSounds) {
      // 按开始时间排序，停止最早的音效
      this.activeSounds.sort((a, b) => a.startTime - b.startTime);

      // 淡出最早的音效
      while (this.activeSounds.length > maxSounds) {
        const oldest = this.activeSounds.shift();
        try {
          // 淡出音效
          if (oldest.gainNode && oldest.gainNode.gain) {
            oldest.gainNode.gain.setValueAtTime(oldest.gainNode.gain.value, this.audioContext.currentTime);
            oldest.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            setTimeout(() => {
              try {
                oldest.source.stop();
              } catch (e) {
                // 忽略已停止的音源错误
              }
            }, 100);
          } else {
            oldest.source.stop();
          }
        } catch (error) {
          console.warn('停止音效失败:', error);
        }
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
      // 平滑过渡到新音量
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
    }

    // 如果音量为0，设置为静音状态
    this.muted = (this.volume === 0);
  }

  /**
   * 设置静音状态
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.muted = muted;

    if (this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.1);
    }
  }

  /**
   * 停止所有音效
   */
  stopAllSounds() {
    if (!this.initialized) return;

    try {
      // 复制数组，因为在循环中会修改原数组
      const sounds = [...this.activeSounds];

      sounds.forEach(sound => {
        try {
          sound.source.stop();
        } catch (error) {
          // 忽略已停止的音源错误
        }
      });

      this.activeSounds = [];
    } catch (error) {
      console.error('停止所有音效失败:', error);
    }
  }

  /**
   * 清理资源
   * 在组件卸载时调用，防止内存泄漏
   */
  dispose() {
    // 停止所有音效
    this.stopAllSounds();

    // 关闭音频上下文
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(err => {
        console.warn('关闭音频上下文失败:', err);
      });
    }

    // 清空缓冲区
    this.soundBuffers = {
      water: [],
      fire: [],
      electric: [],
      light: []
    };

    this.initialized = false;
    console.log('AudioManager 资源已清理');
  }
}
