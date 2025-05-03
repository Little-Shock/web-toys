/**
 * 音频管理器
 * 负责处理所有与音频相关的功能
 * 优化版本2.0：大幅提高移动端性能，改善音频体验和兼容性
 */
class AudioManager {
  constructor() {
    // 初始化状态
    this.initialized = false;
    this.initializationAttempted = false;
    this.volume = 0.7; // 默认音量
    this.muted = false; // 静音状态
    this.audioEnabled = true; // 全局音频启用状态

    // 检测设备类型和性能
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isLowEndDevice = this.detectLowEndDevice();

    // Web Audio API 组件
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;

    // 音效缓存
    this.soundBuffers = {
      water: [],
      fire: [],
      electric: [],
      light: []
    };

    // 当前播放的音效
    this.activeSounds = [];

    // 音效变化参数 - 根据设备类型调整
    this.pitchRange = this.isMobile ? 0.3 : 0.5;  // 音高变化范围
    this.panRange = this.isMobile ? 0.6 : 0.8;    // 声像变化范围

    // 性能相关参数
    this.lastPlayTime = 0;
    this.playThrottleTime = this.isMobile ? 120 : 50; // 限制音效播放频率（毫秒）

    // 低端设备进一步优化
    if (this.isLowEndDevice) {
      this.playThrottleTime = 200; // 更严格的节流
      this.pitchRange = 0.2; // 更小的音高变化
    }

    // 音频上下文恢复处理
    this.setupAudioContextResume();

    // 错误恢复机制
    this.errorCount = 0;
    this.maxErrorCount = 3; // 最大错误次数，超过后禁用音频
  }

  /**
   * 检测是否为低端设备
   * @returns {boolean} 是否为低端设备
   */
  detectLowEndDevice() {
    // 检查设备内存 (如果可用)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }

    // 检查处理器核心数 (如果可用)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }

    // 检查是否为省电模式 (如果可用)
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    // 检查是否为旧版iOS设备
    if (this.isIOS) {
      const match = navigator.userAgent.match(/OS (\d+)_/);
      if (match && parseInt(match[1], 10) < 13) { // iOS 13以下视为低端设备
        return true;
      }
    }

    return false;
  }

  /**
   * 设置音频上下文恢复处理
   * 解决移动设备上的自动播放限制问题
   */
  setupAudioContextResume() {
    // 创建一个防抖版本的恢复函数
    const resumeAudio = this.debounce(() => {
      if (!this.audioEnabled) return;

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
          .then(() => {
            console.log('音频上下文已恢复');
          })
          .catch(error => {
            console.error('恢复音频上下文失败:', error);
            this.errorCount++;

            // 如果多次尝试失败，禁用音频以节省资源
            if (this.errorCount > this.maxErrorCount) {
              console.warn('多次恢复音频失败，禁用音频功能');
              this.audioEnabled = false;
            }
          });
      }

      // 如果尚未初始化，尝试初始化
      if (!this.initialized && !this.initializationAttempted && this.audioEnabled) {
        this.init().catch(err => console.warn('用户交互后初始化音频失败:', err));
      }
    }, 300);

    // 添加用户交互事件监听器
    const events = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];

    // 使用捕获阶段以确保尽早处理事件
    events.forEach(event => {
      document.addEventListener(event, resumeAudio, { capture: true });
    });

    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.audioContext && this.initialized) {
        resumeAudio();
      }
    });
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  /**
   * 初始化音频系统
   */
  async init() {
    try {
      // 如果已经初始化或禁用音频，直接返回
      if (this.initialized || !this.audioEnabled) {
        return this.initialized;
      }

      this.initializationAttempted = true;

      // 创建音频上下文 - 使用更安全的方式
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          throw new Error('浏览器不支持Web Audio API');
        }

        // 对于iOS设备，使用特殊处理
        if (this.isIOS) {
          // iOS需要在用户交互时创建AudioContext
          this.audioContext = new AudioContext();
        } else {
          this.audioContext = new AudioContext();
        }
      } catch (error) {
        console.error('创建音频上下文失败:', error);
        this.audioEnabled = false;
        return false;
      }

      // 创建音频处理图
      try {
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
      } catch (error) {
        console.error('创建音频处理图失败:', error);
        // 尝试简化音频图
        try {
          this.masterGain = this.audioContext.createGain();
          this.masterGain.gain.value = this.volume;
          this.masterGain.connect(this.audioContext.destination);
        } catch (fallbackError) {
          console.error('创建简化音频图也失败:', fallbackError);
          this.audioEnabled = false;
          return false;
        }
      }

      // 加载音效
      await this.loadSounds();

      this.initialized = true;
      console.log('音频系统初始化完成');
      return true;
    } catch (error) {
      console.error('音频系统初始化失败:', error);
      // 设置静默模式，防止后续错误
      this.muted = true;
      this.errorCount++;

      // 如果多次尝试失败，禁用音频
      if (this.errorCount > this.maxErrorCount) {
        this.audioEnabled = false;
      }

      return false;
    }
  }

  /**
   * 加载所有音效
   */
  async loadSounds() {
    return new Promise((resolve) => {
      // 如果音频被禁用，直接返回
      if (!this.audioEnabled) {
        resolve();
        return;
      }

      // 使用合成音效代替加载外部文件
      // 这样可以减少依赖并确保项目完全自包含
      try {
        // 使用Web Worker生成音效以避免阻塞主线程
        if (window.Worker && !this.isLowEndDevice) {
          this.generateSynthSoundsAsync().then(resolve).catch(error => {
            console.error('异步生成音效失败，回退到同步方式:', error);
            this.generateSynthSounds();
            resolve();
          });
        } else {
          // 低端设备使用同步方式，但减少变体数量
          this.generateSynthSounds();
          resolve();
        }
      } catch (error) {
        console.error('生成音效失败:', error);
        // 即使生成失败也继续，不阻止应用程序运行
        resolve();
      }
    });
  }

  /**
   * 异步生成合成音效 (使用Promise)
   */
  async generateSynthSoundsAsync() {
    return new Promise((resolve, reject) => {
      try {
        // 在下一个微任务中执行以避免阻塞UI
        setTimeout(() => {
          try {
            this.generateSynthSounds();
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 0);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 生成合成音效
   */
  generateSynthSounds() {
    // 根据设备类型调整音效数量
    const variantCount = this.isLowEndDevice ? 2 : (this.isMobile ? 3 : 4);

    try {
      // 清空现有缓冲区
      for (const element in this.soundBuffers) {
        this.soundBuffers[element] = [];
      }

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

      console.log(`为每种元素生成了${variantCount}个音效变体`);
    } catch (error) {
      console.error('生成音效时出错:', error);
      // 增加错误计数
      this.errorCount++;

      // 如果多次失败，禁用音频
      if (this.errorCount > this.maxErrorCount) {
        this.audioEnabled = false;
      }

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
   * @returns {boolean} 是否成功播放
   */
  playElementSound(element, x, y, intensity = 1) {
    // 如果未初始化、静音或禁用音频，不播放音效
    if (!this.initialized || this.muted || !this.audioEnabled) {
      return false;
    }

    // 节流控制，防止音效播放过于频繁
    const now = performance.now();
    if (now - this.lastPlayTime < this.playThrottleTime) {
      return false;
    }
    this.lastPlayTime = now;

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
          this.errorCount++;

          // 如果多次尝试失败，禁用音频
          if (this.errorCount > this.maxErrorCount) {
            console.warn('多次恢复音频失败，禁用音频功能');
            this.audioEnabled = false;
          }
        });
      }

      // 获取对应元素的音效缓冲区
      const buffers = this.soundBuffers[element];
      if (!buffers || buffers.length === 0) {
        return false;
      }

      // 随机选择一个变体
      const buffer = buffers[Math.floor(Math.random() * buffers.length)];
      if (!buffer) return false;

      // 创建音源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // 根据强度和位置调整音高，但限制范围以避免极端值
      const pitchVariation = Math.max(0.7, Math.min(1.5,
        0.8 + (intensity * 0.4) + ((1 - y) * this.pitchRange * 0.5) +
        (Math.random() * this.pitchRange * 0.5 - this.pitchRange * 0.25)
      ));
      source.playbackRate.value = pitchVariation;

      // 创建音量控制
      const gainNode = this.audioContext.createGain();
      // 根据强度调整音量，并确保不会过大
      const volumeLevel = Math.min(0.7, 0.3 + intensity * 0.5);
      gainNode.gain.value = volumeLevel;

      // 根据设备性能选择不同的处理链
      let panner = null;

      if (this.isLowEndDevice) {
        // 低端设备使用简化的音频处理链
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
      } else {
        try {
          // 创建声像控制
          panner = this.audioContext.createStereoPanner();
          // 将x坐标(0-1)映射到声像(-1到1)，但限制范围以避免极端值
          const panValue = Math.max(-0.8, Math.min(0.8, (x * 2 - 1) * this.panRange));
          panner.pan.value = panValue;

          // 连接节点
          source.connect(gainNode);
          gainNode.connect(panner);
          panner.connect(this.masterGain);
        } catch (panError) {
          // 如果立体声声像创建失败，使用简化连接
          console.warn('创建立体声声像失败，使用简化连接:', panError);
          source.connect(gainNode);
          gainNode.connect(this.masterGain);
        }
      }

      // 跟踪活动音效 - 在开始播放前添加，以便在出错时可以清理
      const soundObj = {
        source,
        gainNode,
        panner,
        startTime: this.audioContext.currentTime,
        element,
        intensity,
        duration: buffer.duration
      };

      this.activeSounds.push(soundObj);

      // 播放音效
      source.start();

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      // 防止同时播放太多音效
      this.limitActiveSounds();

      return true;
    } catch (error) {
      console.error('播放音效失败:', error);
      this.errorCount++;

      // 出错时设置静默模式，防止继续尝试播放
      if (error.name === 'NotAllowedError') {
        console.warn('浏览器不允许自动播放音频，请等待用户交互');
      } else if (this.errorCount > this.maxErrorCount) {
        console.warn('多次播放音效失败，禁用音频功能');
        this.audioEnabled = false;
      } else {
        this.muted = true;
      }

      return false;
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
    try {
      // 根据设备类型和性能调整最大同时播放的音效数量
      const maxSounds = this.isLowEndDevice ? 3 : (this.isMobile ? 5 : 8);

      if (this.activeSounds.length > maxSounds) {
        // 按优先级排序：保留强度高的和最近播放的音效
        this.activeSounds.sort((a, b) => {
          // 首先按强度排序
          const intensityDiff = b.intensity - a.intensity;
          if (Math.abs(intensityDiff) > 0.2) {
            return intensityDiff;
          }
          // 强度相近时按时间排序
          return a.startTime - b.startTime;
        });

        // 淡出多余的音效
        const soundsToRemove = this.activeSounds.splice(maxSounds);

        // 批量处理需要移除的音效
        soundsToRemove.forEach(sound => {
          try {
            // 淡出音效
            if (sound.gainNode && sound.gainNode.gain) {
              const now = this.audioContext.currentTime;
              const fadeOutTime = 0.1; // 100毫秒淡出

              sound.gainNode.gain.setValueAtTime(sound.gainNode.gain.value, now);
              sound.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

              // 设置定时器在淡出后停止音源
              setTimeout(() => {
                try {
                  sound.source.stop();
                  // 断开连接以释放资源
                  if (sound.gainNode) sound.gainNode.disconnect();
                  if (sound.panner) sound.panner.disconnect();
                } catch (e) {
                  // 忽略已停止的音源错误
                }
              }, fadeOutTime * 1000);
            } else {
              // 如果没有增益节点，直接停止
              sound.source.stop();
              // 断开连接以释放资源
              if (sound.gainNode) sound.gainNode.disconnect();
              if (sound.panner) sound.panner.disconnect();
            }
          } catch (error) {
            console.warn('停止音效失败:', error);
          }
        });
      }
    } catch (error) {
      console.error('限制音效数量失败:', error);
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
