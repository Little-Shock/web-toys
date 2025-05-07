/**
 * 音频管理器
 * 管理应用中的所有音频效果
 */
class AudioManager {
  /**
   * 创建音频管理器
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 配置参数
    this.params = {
      enabled: options.enabled !== undefined ? options.enabled : true,
      volume: options.volume !== undefined ? options.volume : 0.7,
      muted: options.muted !== undefined ? options.muted : false,
      preload: options.preload !== undefined ? options.preload : true
    };
    
    // 音频上下文
    this.audioContext = null;
    
    // 音频缓存
    this.sounds = {};
    
    // 当前播放的音频
    this.currentSounds = {};
    
    // 音频定义
    this.soundDefs = {
      // UI音效
      uiClick: { url: 'assets/sounds/ui_click.mp3', volume: 0.5 },
      uiSwitch: { url: 'assets/sounds/ui_switch.mp3', volume: 0.5 },
      uiConfirm: { url: 'assets/sounds/ui_confirm.mp3', volume: 0.6 },
      
      // 工具音效
      pourSand: { url: 'assets/sounds/pour_sand.mp3', volume: 0.6 },
      digSand: { url: 'assets/sounds/dig_sand.mp3', volume: 0.7 },
      smoothSand: { url: 'assets/sounds/smooth_sand.mp3', volume: 0.5 },
      shakeSand: { url: 'assets/sounds/shake_sand.mp3', volume: 0.8 },
      
      // 环境音效
      ambientGlow: { url: 'assets/sounds/ambient_glow.mp3', volume: 0.3, loop: true }
    };
    
    // 初始化
    this._init();
  }
  
  /**
   * 初始化音频管理器
   * @private
   */
  _init() {
    // 创建音频上下文
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // 创建主音量控制
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.params.volume;
      this.masterGain.connect(this.audioContext.destination);
      
      // 如果静音，将音量设为0
      if (this.params.muted) {
        this.masterGain.gain.value = 0;
      }
      
      // 预加载音频
      if (this.params.preload) {
        this._preloadSounds();
      }
    } catch (e) {
      console.error('Web Audio API不受支持:', e);
      this.params.enabled = false;
    }
  }
  
  /**
   * 预加载音频
   * @private
   */
  _preloadSounds() {
    // 为了减少初始加载时间，只预加载UI音效
    const uiSounds = ['uiClick', 'uiSwitch', 'uiConfirm'];
    
    for (const soundId of uiSounds) {
      this.loadSound(soundId);
    }
  }
  
  /**
   * 加载音频
   * @param {string} soundId - 音频ID
   * @returns {Promise} 加载完成的Promise
   */
  loadSound(soundId) {
    if (!this.params.enabled || this.sounds[soundId]) return Promise.resolve();
    
    const soundDef = this.soundDefs[soundId];
    if (!soundDef) return Promise.reject(new Error(`未定义的音频: ${soundId}`));
    
    return fetch(soundDef.url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.sounds[soundId] = audioBuffer;
        return audioBuffer;
      })
      .catch(error => {
        console.error(`加载音频失败 ${soundId}:`, error);
      });
  }
  
  /**
   * 播放音频
   * @param {string} soundId - 音频ID
   * @param {Object} options - 播放选项
   * @returns {Object|null} 音频控制对象或null
   */
  playSound(soundId, options = {}) {
    if (!this.params.enabled || this.params.muted) return null;
    
    // 如果音频上下文被暂停，恢复它
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 如果音频未加载，先加载
    if (!this.sounds[soundId]) {
      this.loadSound(soundId)
        .then(() => this._playSound(soundId, options))
        .catch(error => console.error(`播放音频失败 ${soundId}:`, error));
      return null;
    }
    
    return this._playSound(soundId, options);
  }
  
  /**
   * 内部播放音频方法
   * @param {string} soundId - 音频ID
   * @param {Object} options - 播放选项
   * @returns {Object|null} 音频控制对象或null
   * @private
   */
  _playSound(soundId, options = {}) {
    const soundDef = this.soundDefs[soundId];
    if (!soundDef) return null;
    
    const audioBuffer = this.sounds[soundId];
    if (!audioBuffer) return null;
    
    // 创建音频源
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // 设置循环
    source.loop = options.loop !== undefined ? options.loop : (soundDef.loop || false);
    
    // 创建音量控制
    const gainNode = this.audioContext.createGain();
    const volume = options.volume !== undefined ? options.volume : soundDef.volume;
    gainNode.gain.value = volume;
    
    // 连接节点
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // 开始播放
    const startTime = options.delay ? this.audioContext.currentTime + options.delay : this.audioContext.currentTime;
    source.start(startTime);
    
    // 创建音频控制对象
    const soundControl = {
      source,
      gainNode,
      stop: () => {
        try {
          source.stop();
        } catch (e) {
          // 忽略已停止的音频
        }
      },
      setVolume: (vol) => {
        gainNode.gain.value = vol;
      }
    };
    
    // 保存当前播放的音频
    if (!this.currentSounds[soundId]) {
      this.currentSounds[soundId] = [];
    }
    this.currentSounds[soundId].push(soundControl);
    
    // 如果不是循环音频，在播放结束后清理
    if (!source.loop) {
      source.onended = () => {
        const index = this.currentSounds[soundId].indexOf(soundControl);
        if (index !== -1) {
          this.currentSounds[soundId].splice(index, 1);
        }
      };
    }
    
    return soundControl;
  }
  
  /**
   * 停止音频
   * @param {string} soundId - 音频ID
   */
  stopSound(soundId) {
    if (!this.currentSounds[soundId]) return;
    
    for (const sound of this.currentSounds[soundId]) {
      sound.stop();
    }
    
    this.currentSounds[soundId] = [];
  }
  
  /**
   * 停止所有音频
   */
  stopAllSounds() {
    for (const soundId in this.currentSounds) {
      this.stopSound(soundId);
    }
  }
  
  /**
   * 设置主音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    this.params.volume = clamp(volume, 0, 1);
    
    if (this.masterGain && !this.params.muted) {
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
   * 切换静音状态
   * @returns {boolean} 当前是否静音
   */
  toggleMute() {
    this.setMuted(!this.params.muted);
    return this.params.muted;
  }
  
  /**
   * 启用或禁用音频
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    if (this.params.enabled === enabled) return;
    
    this.params.enabled = enabled;
    
    if (!enabled) {
      this.stopAllSounds();
    } else if (!this.audioContext) {
      this._init();
    }
  }
  
  /**
   * 播放UI音效
   * @param {string} type - 音效类型 (click, switch, confirm)
   */
  playUISound(type) {
    switch (type) {
      case 'click':
        this.playSound('uiClick');
        break;
      case 'switch':
        this.playSound('uiSwitch');
        break;
      case 'confirm':
        this.playSound('uiConfirm');
        break;
    }
  }
  
  /**
   * 播放工具音效
   * @param {string} tool - 工具类型 (pour, dig, smooth, shake)
   * @param {Object} options - 播放选项
   */
  playToolSound(tool, options = {}) {
    switch (tool) {
      case 'pour':
        this.playSound('pourSand', options);
        break;
      case 'dig':
        this.playSound('digSand', options);
        break;
      case 'smooth':
        this.playSound('smoothSand', options);
        break;
      case 'shake':
        this.playSound('shakeSand', options);
        break;
    }
  }
  
  /**
   * 播放环境音效
   * @param {boolean} play - 是否播放
   */
  playAmbientSound(play = true) {
    if (play) {
      // 如果已经在播放，不重复播放
      if (this.currentSounds.ambientGlow && this.currentSounds.ambientGlow.length > 0) {
        return;
      }
      
      this.playSound('ambientGlow', { loop: true });
    } else {
      this.stopSound('ambientGlow');
    }
  }
  
  /**
   * 创建简单的合成音效
   * @param {string} type - 音效类型 (sine, square, sawtooth, triangle)
   * @param {number} frequency - 频率
   * @param {number} duration - 持续时间（秒）
   * @param {Object} options - 其他选项
   */
  playSynth(type, frequency, duration, options = {}) {
    if (!this.params.enabled || this.params.muted) return null;
    
    // 如果音频上下文被暂停，恢复它
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // 创建振荡器
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // 创建音量控制
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.volume || 0.5;
    
    // 设置音量包络
    const now = this.audioContext.currentTime;
    const attackTime = options.attack || 0.01;
    const releaseTime = options.release || 0.1;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(options.volume || 0.5, now + attackTime);
    gainNode.gain.setValueAtTime(options.volume || 0.5, now + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // 开始播放
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return {
      oscillator,
      gainNode
    };
  }
  
  /**
   * 播放沙粒碰撞音效
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} velocity - 碰撞速度
   */
  playSandCollision(x, y, velocity) {
    if (!this.params.enabled || this.params.muted) return;
    
    // 根据位置和速度计算音效参数
    const baseFreq = 200 + x * 1000;
    const duration = 0.05 + velocity * 0.1;
    const volume = Math.min(0.3, velocity * 0.5);
    
    // 播放合成音效
    this.playSynth('sine', baseFreq, duration, {
      volume,
      attack: 0.001,
      release: 0.03
    });
  }
}
