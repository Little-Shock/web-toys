/**
 * 音频管理器
 * 负责处理所有与音频相关的功能
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
    const { isMobile, isIOS, isLowEndDevice } = detectDevice();
    this.isMobile = isMobile;
    this.isIOS = isIOS;
    this.isLowEndDevice = isLowEndDevice;

    // Web Audio API 组件
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;

    // 音效缓存
    this.soundBuffers = {
      tap: [], // 敲击音效
      combo: [], // 连击音效
      milestone: [], // 里程碑音效
      ui: [] // UI音效
    };

    // 当前播放的音效
    this.activeSounds = [];

    // 音效变化参数 - 根据设备类型调整
    this.pitchRange = this.isMobile ? 0.2 : 0.4;  // 音高变化范围
    this.panRange = this.isMobile ? 0.4 : 0.6;    // 声像变化范围

    // 性能相关参数
    this.lastPlayTime = 0;
    this.playThrottleTime = this.isMobile ? 150 : 80; // 限制音效播放频率（毫秒）

    // 低端设备进一步优化
    if (this.isLowEndDevice) {
      this.playThrottleTime = 250; // 更严格的节流
      this.pitchRange = 0.1; // 更小的音高变化
    }

    // 音效风格
    this.soundStyle = 0; // 0=传统, 1=现代, 2=电子

    // 音频上下文恢复处理
    this.setupAudioContextResume();

    // 错误恢复机制
    this.errorCount = 0;
    this.maxErrorCount = 3; // 最大错误次数，超过后禁用音频

    // 初始化
    this.init();
  }

  /**
   * 初始化音频系统
   */
  async init() {
    if (this.initialized || this.initializationAttempted || !this.audioEnabled) {
      return;
    }

    this.initializationAttempted = true;

    try {
      // 创建音频上下文
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API不受支持');
        this.audioEnabled = false;
        return false;
      }

      this.audioContext = new AudioContext();

      // 创建动态压缩器 - 防止音频过载
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

      // 生成音效
      await this.generateSounds();

      this.initialized = true;
      console.log('音频系统初始化完成');
      return true;
    } catch (error) {
      console.error('音频系统初始化失败:', error);
      this.audioEnabled = false;
      return false;
    }
  }

  /**
   * 设置音频上下文恢复处理
   */
  setupAudioContextResume() {
    const resumeAudioContext = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }
    };

    // 添加用户交互事件监听器
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resumeAudioContext, { once: true });
    });
  }

  /**
   * 生成所有音效
   */
  async generateSounds() {
    try {
      // 生成木鱼敲击音效
      for (let i = 0; i < 5; i++) {
        const buffer = await this.generateWoodenFishSound(i);
        this.soundBuffers.tap.push(buffer);
      }

      // 生成连击音效
      for (let i = 0; i < 3; i++) {
        const buffer = await this.generateComboSound(i);
        this.soundBuffers.combo.push(buffer);
      }

      // 生成里程碑音效
      for (let i = 0; i < 3; i++) {
        const buffer = await this.generateMilestoneSound(i);
        this.soundBuffers.milestone.push(buffer);
      }

      // 生成UI音效
      for (let i = 0; i < 3; i++) {
        const buffer = await this.generateUISound(i);
        this.soundBuffers.ui.push(buffer);
      }

      return true;
    } catch (error) {
      console.error('生成音效失败:', error);
      return false;
    }
  }

  /**
   * 生成木鱼敲击音效
   * @param {number} variant - 变体索引
   * @returns {AudioBuffer} 音频缓冲区
   */
  async generateWoodenFishSound(variant = 0) {
    const duration = 0.5; // 音效持续时间
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

    // 获取左右声道数据
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // 基础频率和衰减参数
    const baseFreq = 180 + variant * 20; // 基础频率
    const attackTime = 0.005; // 起音时间
    const decayTime = 0.3 + variant * 0.05; // 衰减时间

    // 生成木鱼敲击音效
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate; // 当前时间

      // 计算包络
      let envelope = 0;
      if (t < attackTime) {
        // 起音阶段
        envelope = t / attackTime;
      } else if (t < attackTime + decayTime) {
        // 衰减阶段
        envelope = 1 - ((t - attackTime) / decayTime);
      } else {
        // 静音阶段
        envelope = 0;
      }

      // 添加木鱼的谐波
      let sample = 0;
      sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
      sample += Math.sin(2 * Math.PI * (baseFreq * 2.7) * t) * 0.3;
      sample += Math.sin(2 * Math.PI * (baseFreq * 4.2) * t) * 0.15;

      // 添加噪声模拟敲击声
      if (t < 0.05) {
        sample += (Math.random() * 2 - 1) * 0.3 * (1 - t / 0.05);
      }

      // 应用包络
      sample *= envelope * envelope;

      // 写入声道数据
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return buffer;
  }

  /**
   * 生成连击音效
   * @param {number} variant - 变体索引
   * @returns {AudioBuffer} 音频缓冲区
   */
  async generateComboSound(variant = 0) {
    const duration = 0.4; // 音效持续时间
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

    // 获取左右声道数据
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // 基础频率和参数
    const baseFreq = 300 + variant * 50; // 基础频率
    const sweepRange = 200 + variant * 30; // 扫频范围

    // 生成连击音效 (上升音调)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate; // 当前时间
      const normalizedTime = t / duration; // 归一化时间 (0-1)

      // 计算包络
      const envelope = Math.sin(normalizedTime * Math.PI) * (1 - normalizedTime * 0.5);

      // 计算扫频
      const freq = baseFreq + sweepRange * Math.pow(normalizedTime, 2);

      // 生成音调
      let sample = 0;
      sample += Math.sin(2 * Math.PI * freq * t) * 0.5;
      sample += Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.3;
      sample += Math.sin(2 * Math.PI * (freq * 2.0) * t) * 0.2;

      // 应用包络
      sample *= envelope;

      // 写入声道数据
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return buffer;
  }

  /**
   * 生成里程碑音效
   * @param {number} variant - 变体索引
   * @returns {AudioBuffer} 音频缓冲区
   */
  async generateMilestoneSound(variant = 0) {
    const duration = 0.8; // 音效持续时间
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

    // 获取左右声道数据
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // 基础频率和参数
    const baseFreq = 220 + variant * 30; // 基础频率

    // 生成里程碑音效 (和弦上升)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate; // 当前时间
      const normalizedTime = t / duration; // 归一化时间 (0-1)

      // 计算包络
      let envelope = 0;
      if (normalizedTime < 0.1) {
        envelope = normalizedTime / 0.1; // 起音
      } else if (normalizedTime < 0.6) {
        envelope = 1.0; // 持续
      } else {
        envelope = (1.0 - normalizedTime) / 0.4; // 衰减
      }

      // 生成和弦
      let sample = 0;
      sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
      sample += Math.sin(2 * Math.PI * (baseFreq * 1.25) * t) * 0.3;
      sample += Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.2;
      sample += Math.sin(2 * Math.PI * (baseFreq * 2.0) * t) * 0.1;

      // 添加颤音
      const vibratoFreq = 6 + variant * 2;
      const vibratoDepth = 0.02 + variant * 0.01;
      const vibrato = 1 + Math.sin(2 * Math.PI * vibratoFreq * t) * vibratoDepth;
      sample *= vibrato;

      // 应用包络
      sample *= envelope;

      // 写入声道数据
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return buffer;
  }

  /**
   * 生成UI音效
   * @param {number} variant - 变体索引
   * @returns {AudioBuffer} 音频缓冲区
   */
  async generateUISound(variant = 0) {
    const duration = 0.3; // 音效持续时间
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);

    // 获取左右声道数据
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // 基础频率和参数
    const baseFreq = 400 + variant * 100; // 基础频率

    // 生成UI音效
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate; // 当前时间
      const normalizedTime = t / duration; // 归一化时间 (0-1)

      // 计算包络
      const envelope = Math.pow(1 - normalizedTime, 1.5);

      // 生成音调
      let sample = 0;
      sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
      sample += Math.sin(2 * Math.PI * (baseFreq * 2) * t) * 0.2;

      // 应用包络
      sample *= envelope;

      // 写入声道数据
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return buffer;
  }

  /**
   * 播放木鱼敲击音效
   * @param {number} x - 触摸位置的X坐标 (0-1)
   * @param {number} y - 触摸位置的Y坐标 (0-1)
   * @param {number} intensity - 敲击强度 (0-1)
   * @returns {boolean} 是否成功播放
   */
  playTapSound(x, y, intensity = 1) {
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
        });
      }

      // 获取敲击音效缓冲区
      const buffers = this.soundBuffers.tap;
      if (!buffers || buffers.length === 0) {
        return false;
      }

      // 根据强度选择音效变体
      const intensityIndex = Math.min(Math.floor(intensity * buffers.length), buffers.length - 1);
      const buffer = buffers[intensityIndex];

      // 创建音源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // 根据强度调整音高
      const pitchVariation = 0.9 + intensity * 0.2;
      source.playbackRate.value = pitchVariation;

      // 创建声像控制
      const panner = this.audioContext.createStereoPanner();
      // 将x坐标(0-1)映射到声像(-1到1)
      panner.pan.value = (x * 2 - 1) * this.panRange;

      // 创建音量控制
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = Math.min(0.9, 0.5 + intensity * 0.5);

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
        type: 'tap',
        intensity
      };
      this.activeSounds.push(soundObj);

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      // 防止同时播放太多音效
      this.limitActiveSounds();

      return true;
    } catch (error) {
      console.error('播放敲击音效失败:', error);
      this.errorCount++;

      // 出错时设置静默模式，防止继续尝试播放
      if (this.errorCount > this.maxErrorCount) {
        console.warn('多次播放音效失败，禁用音频功能');
        this.audioEnabled = false;
      }

      return false;
    }
  }

  /**
   * 播放连击音效
   * @param {number} combo - 连击数
   * @param {number} x - 位置X坐标 (0-1)
   * @param {number} y - 位置Y坐标 (0-1)
   * @returns {boolean} 是否成功播放
   */
  playComboSound(combo, x = 0.5, y = 0.5) {
    // 如果未初始化、静音或禁用音频，不播放音效
    if (!this.initialized || this.muted || !this.audioEnabled) {
      return false;
    }

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }

      // 获取连击音效缓冲区
      const buffers = this.soundBuffers.combo;
      if (!buffers || buffers.length === 0) {
        return false;
      }

      // 根据连击数选择音效变体
      let variantIndex = 0;
      if (combo >= 50) {
        variantIndex = 2;
      } else if (combo >= 20) {
        variantIndex = 1;
      }
      const buffer = buffers[variantIndex];

      // 创建音源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // 根据连击数调整音高
      const pitchFactor = 1.0 + Math.min(0.5, combo / 100);
      source.playbackRate.value = pitchFactor;

      // 创建声像控制
      const panner = this.audioContext.createStereoPanner();
      panner.pan.value = (x * 2 - 1) * this.panRange;

      // 创建音量控制
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = Math.min(0.8, 0.5 + (combo / 100));

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
        type: 'combo'
      };
      this.activeSounds.push(soundObj);

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      return true;
    } catch (error) {
      console.error('播放连击音效失败:', error);
      return false;
    }
  }

  /**
   * 播放里程碑音效
   * @param {number} milestone - 里程碑级别 (0-2)
   * @returns {boolean} 是否成功播放
   */
  playMilestoneSound(milestone = 0) {
    // 如果未初始化、静音或禁用音频，不播放音效
    if (!this.initialized || this.muted || !this.audioEnabled) {
      return false;
    }

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }

      // 获取里程碑音效缓冲区
      const buffers = this.soundBuffers.milestone;
      if (!buffers || buffers.length === 0) {
        return false;
      }

      // 选择音效变体
      const variantIndex = Math.min(milestone, buffers.length - 1);
      const buffer = buffers[variantIndex];

      // 创建音源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // 创建音量控制
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.7;

      // 连接节点
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // 播放音效
      source.start();

      // 跟踪活动音效
      const soundObj = {
        source,
        gainNode,
        startTime: this.audioContext.currentTime,
        type: 'milestone'
      };
      this.activeSounds.push(soundObj);

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      return true;
    } catch (error) {
      console.error('播放里程碑音效失败:', error);
      return false;
    }
  }

  /**
   * 播放UI音效
   * @param {string} action - 操作类型 (click, toggle, etc.)
   * @returns {boolean} 是否成功播放
   */
  playUISound(action = 'click') {
    // 如果未初始化、静音或禁用音频，不播放音效
    if (!this.initialized || this.muted || !this.audioEnabled) {
      return false;
    }

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }

      // 获取UI音效缓冲区
      const buffers = this.soundBuffers.ui;
      if (!buffers || buffers.length === 0) {
        return false;
      }

      // 根据操作类型选择音效变体
      let variantIndex = 0;
      switch (action) {
        case 'click':
          variantIndex = 0;
          break;
        case 'toggle':
          variantIndex = 1;
          break;
        case 'error':
          variantIndex = 2;
          break;
        default:
          variantIndex = 0;
      }
      const buffer = buffers[Math.min(variantIndex, buffers.length - 1)];

      // 创建音源
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // 创建音量控制
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5;

      // 连接节点
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // 播放音效
      source.start();

      // 跟踪活动音效
      const soundObj = {
        source,
        gainNode,
        startTime: this.audioContext.currentTime,
        type: 'ui'
      };
      this.activeSounds.push(soundObj);

      // 设置自动清理
      source.onended = () => {
        this.cleanupSound(soundObj);
      };

      return true;
    } catch (error) {
      console.error('播放UI音效失败:', error);
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
    // 如果活动音效数量超过限制，移除最早的非重要音效
    const maxSounds = this.isLowEndDevice ? 4 : (this.isMobile ? 8 : 16);

    if (this.activeSounds.length > maxSounds) {
      // 按优先级排序：milestone > combo > tap > ui
      const priorityOrder = { 'milestone': 0, 'combo': 1, 'tap': 2, 'ui': 3 };

      // 按优先级和时间排序
      this.activeSounds.sort((a, b) => {
        const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        return a.startTime - b.startTime;
      });

      // 移除多余的音效，从低优先级和最早的开始
      while (this.activeSounds.length > maxSounds) {
        const oldestSound = this.activeSounds.pop();
        if (oldestSound && oldestSound.source) {
          oldestSound.source.stop();
          this.cleanupSound(oldestSound);
        }
      }
    }
  }

  /**
   * 停止所有音效
   */
  stopAllSounds() {
    try {
      // 停止所有活动音效
      for (const sound of this.activeSounds) {
        if (sound.source) {
          sound.source.stop();
        }
      }

      // 清空活动音效数组
      this.activeSounds = [];
    } catch (error) {
      console.error('停止所有音效失败:', error);
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = clamp(volume, 0, 1);

    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * 设置静音状态
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.muted = muted;

    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
  }

  /**
   * 切换静音状态
   * @returns {boolean} 当前是否静音
   */
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * 启用或禁用音频
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    if (this.audioEnabled === enabled) return;

    this.audioEnabled = enabled;

    if (!enabled) {
      this.stopAllSounds();
    } else if (!this.initialized && !this.initializationAttempted) {
      this.init();
    }
  }
}
