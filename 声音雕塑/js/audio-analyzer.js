/**
 * 音频分析器
 * 负责处理音频输入、分析和处理
 */
class AudioAnalyzer {
  constructor() {
    // 音频上下文
    this.audioContext = null;

    // 音频源
    this.audioSource = null;
    this.sourceType = null;

    // 音频节点
    this.analyserNode = null;
    this.gainNode = null;

    // 音频元素（用于文件播放）
    this.audioElement = null;

    // 振荡器（用于合成音频）
    this.oscillator = null;
    this.modulatorOsc = null;

    // 分析数据
    this.frequencyData = null;
    this.timeData = null;

    // 参数
    this.params = {
      fftSize: 2048,
      smoothingTimeConstant: 0.7,
      sensitivity: 0.5,
      volume: 0.7
    };

    // 状态
    this.isInitialized = false;
    this.isPlaying = false;

    // 合成器参数
    this.synthParams = {
      waveform: 'sine',
      frequency: 440,
      modulation: 0.3
    };

    // 初始化
    this.init();
  }

  /**
   * 初始化音频分析器
   */
  async init() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 创建分析器节点
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.params.fftSize;
      this.analyserNode.smoothingTimeConstant = this.params.smoothingTimeConstant;

      // 创建增益节点
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.params.volume;

      // 连接节点
      this.gainNode.connect(this.audioContext.destination);
      this.analyserNode.connect(this.gainNode);

      // 创建数据数组
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyserNode.fftSize);

      // 创建音频元素
      this.audioElement = document.createElement('audio');
      this.audioElement.crossOrigin = 'anonymous';

      // 添加音频元素事件监听器
      this.setupAudioElementListeners();

      this.isInitialized = true;
      console.log('音频分析器初始化完成');
      return true;
    } catch (error) {
      console.error('音频分析器初始化失败:', error);
      return false;
    }
  }

  /**
   * 设置音频元素事件监听器
   */
  setupAudioElementListeners() {
    // 播放开始事件
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;

      // 如果音频上下文被挂起，恢复它
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // 触发播放事件
      this.dispatchEvent('play');
    });

    // 播放暂停事件
    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;

      // 触发暂停事件
      this.dispatchEvent('pause');
    });

    // 播放结束事件
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;

      // 触发结束事件
      this.dispatchEvent('ended');
    });

    // 时间更新事件
    this.audioElement.addEventListener('timeupdate', () => {
      // 触发时间更新事件
      this.dispatchEvent('timeupdate', {
        currentTime: this.audioElement.currentTime,
        duration: this.audioElement.duration,
        progress: this.audioElement.currentTime / this.audioElement.duration
      });
    });

    // 加载元数据事件
    this.audioElement.addEventListener('loadedmetadata', () => {
      // 触发元数据加载事件
      this.dispatchEvent('loadedmetadata', {
        duration: this.audioElement.duration
      });
    });

    // 错误事件
    this.audioElement.addEventListener('error', (error) => {
      console.error('音频元素错误:', error);

      // 触发错误事件
      this.dispatchEvent('error', { error });
    });
  }

  /**
   * 触发自定义事件
   * @param {string} eventName - 事件名称
   * @param {Object} data - 事件数据
   */
  dispatchEvent(eventName, data = {}) {
    const event = new CustomEvent(`audio-${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * 初始化麦克风输入
   */
  async initMicrophone() {
    return this.setMicrophoneSource();
  }

  /**
   * 加载音频文件
   * @param {File|string} file - 文件对象或URL
   */
  async loadAudioFile(file) {
    return this.setFileSource(file);
  }

  /**
   * 初始化振荡器
   */
  async initOscillator() {
    return this.setOscillatorSource();
  }

  /**
   * 设置音频源为麦克风
   */
  async setMicrophoneSource() {
    if (!this.isInitialized) await this.init();

    try {
      // 停止当前音频源
      this.stopCurrentSource();

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建媒体流音频源
      this.audioSource = this.audioContext.createMediaStreamSource(stream);

      // 连接到分析器
      this.audioSource.connect(this.analyserNode);

      // 设置源类型
      this.sourceType = 'microphone';
      this.isPlaying = true;

      // 触发源改变事件
      this.dispatchEvent('sourcechange', { type: 'microphone' });

      return true;
    } catch (error) {
      console.error('设置麦克风音频源失败:', error);
      return false;
    }
  }

  /**
   * 设置音频源为文件
   * @param {File|string} file - 文件对象或URL
   */
  async setFileSource(file) {
    if (!this.isInitialized) await this.init();

    try {
      // 停止当前音频源
      this.stopCurrentSource();

      // 设置音频元素源
      if (typeof file === 'string') {
        // URL
        this.audioElement.src = file;
      } else if (file instanceof File) {
        // 文件对象
        const url = URL.createObjectURL(file);
        this.audioElement.src = url;
      } else {
        throw new Error('无效的文件源');
      }

      // 创建媒体元素音频源
      this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);

      // 连接到分析器
      this.audioSource.connect(this.analyserNode);

      // 设置源类型
      this.sourceType = 'file';

      // 触发源改变事件
      this.dispatchEvent('sourcechange', { type: 'file' });

      return true;
    } catch (error) {
      console.error('设置文件音频源失败:', error);
      return false;
    }
  }

  /**
   * 设置音频源为示例音乐
   * @param {string} url - 示例音乐URL
   */
  async setDemoSource(url = 'assets/sounds/demo.mp3') {
    return this.setFileSource(url);
  }

  /**
   * 设置音频源为振荡器（合成音频）
   */
  async setOscillatorSource() {
    if (!this.isInitialized) await this.init();

    try {
      // 停止当前音频源
      this.stopCurrentSource();

      // 创建振荡器
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = this.synthParams.waveform;
      this.oscillator.frequency.value = this.synthParams.frequency;

      // 创建调制振荡器
      this.modulatorOsc = this.audioContext.createOscillator();
      this.modulatorOsc.type = 'sine';
      this.modulatorOsc.frequency.value = 5; // 5Hz调制

      // 创建调制增益节点
      this.modulationGain = this.audioContext.createGain();
      this.modulationGain.gain.value = this.synthParams.frequency * this.synthParams.modulation;

      // 连接调制
      this.modulatorOsc.connect(this.modulationGain);
      this.modulationGain.connect(this.oscillator.frequency);

      // 连接到分析器
      this.oscillator.connect(this.analyserNode);

      // 开始振荡器
      this.oscillator.start();
      this.modulatorOsc.start();

      // 设置源类型
      this.sourceType = 'oscillator';
      this.isPlaying = true;

      // 触发源改变事件
      this.dispatchEvent('sourcechange', { type: 'oscillator' });

      return true;
    } catch (error) {
      console.error('设置振荡器音频源失败:', error);
      return false;
    }
  }

  /**
   * 停止当前音频源
   */
  stopCurrentSource() {
    // 停止音频元素
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    // 停止振荡器
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {}
      this.oscillator = null;
    }

    if (this.modulatorOsc) {
      try {
        this.modulatorOsc.stop();
        this.modulatorOsc.disconnect();
      } catch (e) {}
      this.modulatorOsc = null;
    }

    // 断开音频源
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch (e) {}
      this.audioSource = null;
    }

    this.isPlaying = false;
  }

  /**
   * 播放音频
   */
  play() {
    if (!this.isInitialized) return false;

    // 恢复音频上下文
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 根据源类型播放
    switch (this.sourceType) {
      case 'file':
        if (this.audioElement) {
          this.audioElement.play();
        }
        break;

      case 'oscillator':
        if (!this.oscillator) {
          this.setOscillatorSource();
        }
        break;

      case 'microphone':
        // 麦克风已经在录制，无需额外操作
        this.isPlaying = true;
        break;
    }

    return true;
  }

  /**
   * 暂停音频
   */
  pause() {
    if (!this.isInitialized) return false;

    // 根据源类型暂停
    switch (this.sourceType) {
      case 'file':
        if (this.audioElement) {
          this.audioElement.pause();
        }
        break;

      case 'oscillator':
        if (this.oscillator) {
          this.stopCurrentSource();
        }
        break;

      case 'microphone':
        // 麦克风无法暂停，只能停止
        this.isPlaying = false;
        break;
    }

    return true;
  }

  /**
   * 切换播放/暂停状态
   */
  togglePlayPause() {
    if (this.isPlaying) {
      return this.pause();
    } else {
      return this.play();
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    if (!this.isInitialized) return false;

    // 限制音量范围
    volume = Math.max(0, Math.min(1, volume));

    // 设置增益节点音量
    this.gainNode.gain.value = volume;
    this.params.volume = volume;

    // 同时设置音频元素音量
    if (this.audioElement) {
      this.audioElement.volume = volume;
    }

    return true;
  }

  /**
   * 设置播放位置
   * @param {number} position - 播放位置 (0-1)
   */
  setPlaybackPosition(position) {
    if (!this.isInitialized || this.sourceType !== 'file') return false;

    // 限制位置范围
    position = Math.max(0, Math.min(1, position));

    // 设置音频元素当前时间
    if (this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = position * this.audioElement.duration;
      return true;
    }

    return false;
  }

  /**
   * 更新分析器参数
   * @param {Object} params - 参数对象
   */
  updateParams(params) {
    if (!this.isInitialized) return false;

    // 更新FFT大小
    if (params.fftSize !== undefined && params.fftSize !== this.params.fftSize) {
      this.analyserNode.fftSize = params.fftSize;
      this.params.fftSize = params.fftSize;

      // 重新创建数据数组
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyserNode.fftSize);
    }

    // 更新平滑时间常数
    if (params.smoothingTimeConstant !== undefined) {
      this.analyserNode.smoothingTimeConstant = params.smoothingTimeConstant;
      this.params.smoothingTimeConstant = params.smoothingTimeConstant;
    }

    // 更新灵敏度
    if (params.sensitivity !== undefined) {
      this.params.sensitivity = params.sensitivity;
    }

    // 更新音量
    if (params.volume !== undefined) {
      this.setVolume(params.volume);
    }

    return true;
  }

  /**
   * 更新合成器参数
   * @param {Object} params - 合成器参数对象
   */
  updateSynthParams(params) {
    if (!this.isInitialized || this.sourceType !== 'oscillator') return false;

    // 更新波形类型
    if (params.waveform !== undefined && this.oscillator) {
      this.oscillator.type = params.waveform;
      this.synthParams.waveform = params.waveform;
    }

    // 更新频率
    if (params.frequency !== undefined && this.oscillator) {
      this.oscillator.frequency.value = params.frequency;
      this.synthParams.frequency = params.frequency;

      // 同时更新调制深度
      if (this.modulationGain) {
        this.modulationGain.gain.value = params.frequency * this.synthParams.modulation;
      }
    }

    // 更新调制深度
    if (params.modulation !== undefined && this.modulationGain) {
      this.synthParams.modulation = params.modulation;
      this.modulationGain.gain.value = this.synthParams.frequency * params.modulation;
    }

    return true;
  }

  /**
   * 获取频率数据
   * @returns {Uint8Array} 频率数据数组
   */
  getFrequencyData() {
    if (!this.isInitialized) return null;

    // 获取频率数据
    this.analyserNode.getByteFrequencyData(this.frequencyData);

    return this.frequencyData;
  }

  /**
   * 获取时域数据
   * @returns {Uint8Array} 时域数据数组
   */
  getTimeData() {
    if (!this.isInitialized) return null;

    // 获取时域数据
    this.analyserNode.getByteTimeDomainData(this.timeData);

    return this.timeData;
  }

  /**
   * 获取音频分析数据
   * @returns {Object} 包含频率和时域数据的对象
   */
  getAnalysisData() {
    return {
      frequency: this.getFrequencyData(),
      time: this.getTimeData(),
      binCount: this.analyserNode ? this.analyserNode.frequencyBinCount : 0,
      fftSize: this.params.fftSize,
      sampleRate: this.audioContext ? this.audioContext.sampleRate : 0,
      sensitivity: this.params.sensitivity
    };
  }

  /**
   * 获取音频信息
   * @returns {Object} 音频信息对象
   */
  getAudioInfo() {
    if (!this.isInitialized) return null;

    return {
      sourceType: this.sourceType,
      isPlaying: this.isPlaying,
      volume: this.params.volume,
      currentTime: this.audioElement ? this.audioElement.currentTime : 0,
      duration: this.audioElement ? this.audioElement.duration : 0,
      progress: this.audioElement && this.audioElement.duration ?
        this.audioElement.currentTime / this.audioElement.duration : 0
    };
  }

  /**
   * 获取播放信息
   * @returns {Object} 播放信息对象
   */
  getPlaybackInfo() {
    return {
      currentTime: this.audioElement ? this.audioElement.currentTime : 0,
      duration: this.audioElement ? this.audioElement.duration : 0,
      isPlaying: this.isPlaying
    };
  }

  /**
   * 释放资源
   */
  dispose() {
    // 停止当前音频源
    this.stopCurrentSource();

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isInitialized = false;
  }
}
