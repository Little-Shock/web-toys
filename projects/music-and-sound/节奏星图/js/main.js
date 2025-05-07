/**
 * 节奏星图 - 主程序
 * 将音乐节奏转化为星空图案的互动体验
 */

// 全局状态
const appState = {
  // 应用状态
  isInitialized: false,
  isLoading: true,

  // 当前主题
  currentTheme: 'cosmic',

  // 设置
  settings: {
    volume: 0.7,
    tempo: 120,
    vibrationEnabled: true,
    autoConnectEnabled: true
  },

  // 触摸状态
  touchActive: false,
  lastTouchPosition: { x: 0, y: 0 },

  // 设备方向
  deviceOrientation: { alpha: 0, beta: 0, gamma: 0 },

  // 动画状态
  time: 0,
  deltaTime: 0,
  lastTime: 0,

  // 调试模式
  debugMode: false
};

// DOM元素
let starCanvas;
let loadingOverlay;
let controlsToggle;
let controlsContent;
let infoToggle;
let infoContent;
let layerButtons;
let themeButtons;
let volumeSlider;
let tempoSlider;
let vibrationToggle;
let autoConnectToggle;
let clearButton;
let saveButton;
let shareButton;

// 核心组件
let audioManager;
let rhythmTracker;
let starField;
let particleSystem;
let constellationDrawer;

// 动画帧请求ID
let animationFrameId;

/**
 * 初始化应用
 */
async function initApp() {
  if (appState.isInitialized) return;

  console.log('初始化应用...');

  // 获取DOM元素
  starCanvas = document.getElementById('starCanvas');
  loadingOverlay = document.querySelector('.loading-overlay');
  controlsToggle = document.querySelector('.controls-toggle');
  controlsContent = document.querySelector('.controls-content');
  infoToggle = document.querySelector('.info-toggle');
  infoContent = document.querySelector('.info-content');
  layerButtons = document.querySelectorAll('.layer-btn');
  themeButtons = document.querySelectorAll('.theme-btn');
  volumeSlider = document.getElementById('volumeSlider');
  tempoSlider = document.getElementById('tempoSlider');
  vibrationToggle = document.getElementById('vibrationToggle');
  autoConnectToggle = document.getElementById('autoConnectToggle');
  clearButton = document.getElementById('clearBtn');
  saveButton = document.getElementById('saveBtn');
  shareButton = document.getElementById('shareBtn');

  // 初始化核心组件
  try {
    // 初始化音频管理器
    audioManager = new AudioManager({
      volume: appState.settings.volume,
      bpm: appState.settings.tempo,
      vibrationEnabled: appState.settings.vibrationEnabled
    });

    // 初始化节奏跟踪器
    rhythmTracker = new RhythmTracker(audioManager, {
      bpm: appState.settings.tempo,
      autoConnect: appState.settings.autoConnectEnabled,
      onBeat: handleBeat,
      onNoteAdded: handleNoteAdded,
      onConnectionCreated: handleConnectionCreated
    });

    // 初始化星空场景
    starField = new StarField(starCanvas, {
      theme: appState.currentTheme
    });

    // 初始化粒子系统
    particleSystem = new ParticleSystem(starCanvas, {
      maxParticles: 300
    });

    // 初始化星座绘制器
    constellationDrawer = new ConstellationDrawer(starField, {
      autoConnect: appState.settings.autoConnectEnabled
    });

    // 设置事件监听
    setupEventListeners();

    // 开始动画循环
    startAnimationLoop();

    // 标记初始化完成
    appState.isInitialized = true;
    appState.isLoading = false;

    // 隐藏加载界面
    hideLoading();

    console.log('应用初始化完成');
  } catch (error) {
    console.error('初始化应用失败:', error);
    showError('初始化应用失败，请刷新页面重试。');
  }
}

/**
 * 设置事件监听
 */
function setupEventListeners() {
  // 控制面板切换
  controlsToggle.addEventListener('click', () => {
    controlsContent.classList.toggle('active');
  });

  // 信息面板切换
  infoToggle.addEventListener('click', () => {
    infoContent.classList.toggle('active');
  });

  // 层按钮
  layerButtons.forEach(button => {
    button.addEventListener('click', () => {
      const layerId = parseInt(button.dataset.layer);
      setActiveLayer(layerId);

      // 更新按钮状态
      layerButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // 主题按钮
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.dataset.theme;
      setTheme(theme);

      // 更新按钮状态
      themeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // 音量滑块
  volumeSlider.addEventListener('input', () => {
    const volume = volumeSlider.value / 100;
    setVolume(volume);
  });

  // 速度滑块
  tempoSlider.addEventListener('input', () => {
    const tempo = parseInt(tempoSlider.value);
    setTempo(tempo);
  });

  // 振动开关
  vibrationToggle.addEventListener('change', () => {
    setVibration(vibrationToggle.checked);
  });

  // 自动连接开关
  autoConnectToggle.addEventListener('change', () => {
    setAutoConnect(autoConnectToggle.checked);
  });

  // 清除按钮
  clearButton.addEventListener('click', clearCurrentLayer);

  // 保存按钮
  saveButton.addEventListener('click', saveImage);

  // 分享按钮
  shareButton.addEventListener('click', shareCreation);

  // 触摸/点击事件
  setupTouchEvents();

  // 设备方向事件
  setupDeviceOrientationEvents();

  // 设备运动事件
  setupDeviceMotionEvents();
}

/**
 * 设置触摸事件
 */
function setupTouchEvents() {
  // 点击/触摸检测
  addTapDetection(starCanvas, handleTap);

  // 长按检测
  addLongPressDetection(starCanvas, handleLongPress);

  // 拖动检测
  addDragDetection(
    starCanvas,
    handleDrag,
    handleDragStart,
    handleDragEnd
  );

  // 多点触控检测
  addMultiTouchDetection(
    starCanvas,
    handleMultiTouch,
    handleMultiTouchStart,
    handleMultiTouchEnd
  );
}

/**
 * 设置设备方向事件
 */
function setupDeviceOrientationEvents() {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      appState.deviceOrientation = {
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0
      };

      // 更新星空场景
      if (starField) {
        starField.deviceOrientation = appState.deviceOrientation;
      }
    }, { passive: true });

    // 请求权限（iOS 13+）
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // 在用户交互时请求权限
      document.body.addEventListener('click', async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== 'granted') {
            console.log('设备方向权限未授予');
          }
        } catch (error) {
          console.error('请求设备方向权限失败:', error);
        }
      }, { once: true });
    }
  }
}

/**
 * 设置设备运动事件
 */
function setupDeviceMotionEvents() {
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (e) => {
      const acceleration = e.accelerationIncludingGravity;

      if (acceleration) {
        // 检测晃动
        if (detectShake(acceleration, 15)) {
          handleDeviceShake();
        }
      }
    }, { passive: true });

    // 请求权限（iOS 13+）
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      // 在用户交互时请求权限
      document.body.addEventListener('click', async () => {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            console.log('设备运动权限未授予');
          }
        } catch (error) {
          console.error('请求设备运动权限失败:', error);
        }
      }, { once: true });
    }
  }
}

/**
 * 处理点击/触摸
 * @param {Object} position - 位置 {x, y}
 */
function handleTap(position) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 计算相对位置 (0-1)
  const x = position.x / window.innerWidth;
  const y = position.y / window.innerHeight;

  // 播放音符
  const note = audioManager.playNote(x, y);

  if (note) {
    // 添加节奏事件
    const event = rhythmTracker.addRhythmEvent({
      x,
      y,
      layerId: audioManager.getActiveLayer().id,
      noteIndex: note.noteIndex,
      frequency: note.frequency
    });

    // 创建星点
    const star = constellationDrawer.addStar(x, y, {
      size: 4,
      color: audioManager.getActiveLayer().color,
      pulse: true,
      layerId: audioManager.getActiveLayer().id
    });

    // 创建粒子爆发
    particleSystem.createBurst(x, y, 20, {
      color: audioManager.getActiveLayer().color,
      life: 1.5,
      shape: 'star'
    });
  }
}

/**
 * 处理长按
 * @param {Object} position - 位置 {x, y}
 */
function handleLongPress(position) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 计算相对位置 (0-1)
  const x = position.x / window.innerWidth;
  const y = position.y / window.innerHeight;

  // 播放持续音符
  const note = audioManager.playNote(x, y, {
    duration: 2.0
  });

  if (note) {
    // 添加节奏事件
    const event = rhythmTracker.addRhythmEvent({
      x,
      y,
      layerId: audioManager.getActiveLayer().id,
      noteIndex: note.noteIndex,
      frequency: note.frequency,
      duration: 2.0
    });

    // 创建脉冲星点
    const star = constellationDrawer.addStar(x, y, {
      size: 6,
      color: audioManager.getActiveLayer().color,
      pulse: true,
      pulseSize: 30,
      layerId: audioManager.getActiveLayer().id
    });

    // 创建大型粒子爆发
    particleSystem.createBurst(x, y, 50, {
      color: audioManager.getActiveLayer().color,
      life: 3,
      shape: 'star',
      size: 3
    });

    // 创建发射器
    particleSystem.createEmitter(x, y, {
      rate: 10,
      count: 50,
      color: audioManager.getActiveLayer().color,
      life: 2,
      shape: 'circle'
    });
  }
}

/**
 * 处理拖动开始
 * @param {Object} position - 位置 {x, y}
 */
function handleDragStart(position) {
  if (!appState.isInitialized || appState.isLoading) return;

  appState.touchActive = true;

  // 计算相对位置 (0-1)
  const x = position.x / window.innerWidth;
  const y = position.y / window.innerHeight;

  appState.lastTouchPosition = { x, y };

  // 播放音符
  const note = audioManager.playNote(x, y);

  if (note) {
    // 添加节奏事件
    const event = rhythmTracker.addRhythmEvent({
      x,
      y,
      layerId: audioManager.getActiveLayer().id,
      noteIndex: note.noteIndex,
      frequency: note.frequency
    });

    // 创建星点
    const star = constellationDrawer.addStar(x, y, {
      size: 4,
      color: audioManager.getActiveLayer().color,
      pulse: true,
      trail: true,
      layerId: audioManager.getActiveLayer().id
    });
  }
}

/**
 * 处理拖动
 * @param {number} deltaX - X轴移动距离
 * @param {number} deltaY - Y轴移动距离
 * @param {Object} position - 当前位置 {x, y}
 */
function handleDrag(deltaX, deltaY, position) {
  if (!appState.isInitialized || appState.isLoading || !appState.touchActive) return;

  // 计算相对位置 (0-1)
  const x = position.x / window.innerWidth;
  const y = position.y / window.innerHeight;

  // 计算与上一个位置的距离
  const distance = Math.sqrt(
    Math.pow(x - appState.lastTouchPosition.x, 2) +
    Math.pow(y - appState.lastTouchPosition.y, 2)
  );

  // 如果移动距离足够大，创建新的星点
  if (distance > 0.02) {
    // 播放音符
    const note = audioManager.playNote(x, y);

    if (note) {
      // 添加节奏事件
      const event = rhythmTracker.addRhythmEvent({
        x,
        y,
        layerId: audioManager.getActiveLayer().id,
        noteIndex: note.noteIndex,
        frequency: note.frequency
      });

      // 创建星点
      const star = constellationDrawer.addStar(x, y, {
        size: 3,
        color: audioManager.getActiveLayer().color,
        pulse: false,
        trail: true,
        layerId: audioManager.getActiveLayer().id
      });

      // 创建小型粒子爆发
      particleSystem.createBurst(x, y, 5, {
        color: audioManager.getActiveLayer().color,
        life: 1,
        shape: 'circle'
      });

      // 更新上一个位置
      appState.lastTouchPosition = { x, y };
    }
  }
}

/**
 * 处理拖动结束
 * @param {Object} position - 位置 {x, y}
 */
function handleDragEnd(position) {
  if (!appState.isInitialized || appState.isLoading) return;

  appState.touchActive = false;

  // 计算相对位置 (0-1)
  const x = position.x / window.innerWidth;
  const y = position.y / window.innerHeight;

  // 播放音符
  const note = audioManager.playNote(x, y);

  if (note) {
    // 添加节奏事件
    const event = rhythmTracker.addRhythmEvent({
      x,
      y,
      layerId: audioManager.getActiveLayer().id,
      noteIndex: note.noteIndex,
      frequency: note.frequency
    });

    // 创建星点
    const star = constellationDrawer.addStar(x, y, {
      size: 4,
      color: audioManager.getActiveLayer().color,
      pulse: true,
      layerId: audioManager.getActiveLayer().id
    });

    // 创建粒子爆发
    particleSystem.createBurst(x, y, 20, {
      color: audioManager.getActiveLayer().color,
      life: 1.5,
      shape: 'star'
    });
  }
}

/**
 * 处理多点触控开始
 * @param {Array} touches - 触摸点数组
 */
function handleMultiTouchStart(touches) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 对每个触摸点播放音符
  for (const touch of touches) {
    // 计算相对位置 (0-1)
    const x = touch.x / window.innerWidth;
    const y = touch.y / window.innerHeight;

    // 播放音符
    const note = audioManager.playNote(x, y);

    if (note) {
      // 添加节奏事件
      const event = rhythmTracker.addRhythmEvent({
        x,
        y,
        layerId: audioManager.getActiveLayer().id,
        noteIndex: note.noteIndex,
        frequency: note.frequency
      });

      // 创建星点
      const star = constellationDrawer.addStar(x, y, {
        size: 4,
        color: audioManager.getActiveLayer().color,
        pulse: true,
        layerId: audioManager.getActiveLayer().id
      });

      // 创建粒子爆发
      particleSystem.createBurst(x, y, 15, {
        color: audioManager.getActiveLayer().color,
        life: 1.5,
        shape: 'star'
      });
    }
  }
}

/**
 * 处理多点触控
 * @param {Array} touches - 触摸点数组
 */
function handleMultiTouch(touches) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 如果有两个或更多触摸点，创建连接
  if (touches.length >= 2) {
    // 查找最近的两个星点
    const positions = touches.map(touch => ({
      x: touch.x / window.innerWidth,
      y: touch.y / window.innerHeight
    }));

    // 查找这些位置附近的星点
    const nearbyStars = [];

    for (const pos of positions) {
      const star = starField.getStarAtPosition(pos.x, pos.y, 0.05);
      if (star) {
        nearbyStars.push(star);
      }
    }

    // 如果找到至少两个星点，创建连接
    if (nearbyStars.length >= 2) {
      for (let i = 0; i < nearbyStars.length - 1; i++) {
        constellationDrawer.connectStars(nearbyStars[i].id, nearbyStars[i + 1].id, {
          color: audioManager.getActiveLayer().color,
          pulse: true
        });
      }
    }
  }
}

/**
 * 处理多点触控结束
 * @param {Array} touches - 触摸点数组
 */
function handleMultiTouchEnd(touches) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 如果所有触摸点都结束，可以执行一些清理操作
  if (touches.length === 0) {
    // 可以在这里添加一些特殊效果
  }
}

/**
 * 处理设备晃动
 */
function handleDeviceShake() {
  if (!appState.isInitialized || appState.isLoading) return;

  console.log('检测到设备晃动');

  // 应用扰动效果
  starField.applyDisturbance(2.0);

  // 创建多个粒子爆发
  for (let i = 0; i < 5; i++) {
    const x = Math.random();
    const y = Math.random();

    particleSystem.createBurst(x, y, 30, {
      color: '#ffffff',
      life: 2,
      shape: 'star',
      size: 3
    });
  }

  // 播放环境音效
  audioManager.playAmbientSound('shake', {
    frequency: 200,
    volume: 0.2
  });

  // 振动反馈
  if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
    navigator.vibrate([50, 50, 100]);
  }
}

/**
 * 处理节拍
 * @param {number} beat - 节拍计数
 */
function handleBeat(beat) {
  if (!appState.isInitialized || appState.isLoading) return;

  // 每四拍创建一个脉冲效果
  if (beat % 4 === 0) {
    // 获取所有用户星点
    const stars = starField.userStars;

    // 随机选择一个星点
    if (stars.length > 0) {
      const randomStar = stars[Math.floor(Math.random() * stars.length)];

      // 创建脉冲效果
      particleSystem.createBurst(randomStar.x, randomStar.y, 10, {
        color: randomStar.color,
        life: 1,
        shape: 'circle'
      });
    }
  }
}

/**
 * 处理音符添加
 * @param {Object} event - 节奏事件
 */
function handleNoteAdded(event) {
  // 可以在这里添加一些特殊效果
}

/**
 * 处理连接创建
 * @param {Object} connection - 连接对象
 */
function handleConnectionCreated(connection) {
  // 可以在这里添加一些特殊效果
}

/**
 * 设置活跃层
 * @param {number} layerId - 层ID
 */
function setActiveLayer(layerId) {
  audioManager.setActiveLayer(layerId);
}

/**
 * 设置主题
 * @param {string} theme - 主题名称
 */
function setTheme(theme) {
  appState.currentTheme = theme;
  starField.setTheme(theme);
}

/**
 * 设置音量
 * @param {number} volume - 音量值 (0-1)
 */
function setVolume(volume) {
  appState.settings.volume = volume;
  audioManager.setVolume(volume);
}

/**
 * 设置速度
 * @param {number} tempo - 速度值 (BPM)
 */
function setTempo(tempo) {
  appState.settings.tempo = tempo;
  audioManager.setBPM(tempo);
  rhythmTracker.setBPM(tempo);
}

/**
 * 设置振动
 * @param {boolean} enabled - 是否启用
 */
function setVibration(enabled) {
  appState.settings.vibrationEnabled = enabled;
  audioManager.setVibration(enabled);
}

/**
 * 设置自动连接
 * @param {boolean} enabled - 是否启用
 */
function setAutoConnect(enabled) {
  appState.settings.autoConnectEnabled = enabled;
  rhythmTracker.setAutoConnect(enabled);
  constellationDrawer.setAutoConnect(enabled);
}

/**
 * 清除当前层
 */
function clearCurrentLayer() {
  const activeLayer = audioManager.getActiveLayer();

  if (activeLayer) {
    // 清除星点和连接
    starField.clearLayerStars(activeLayer.id);

    // 清除节奏事件
    rhythmTracker.clearEvents();

    // 清除音符
    audioManager.clearLayerNotes(activeLayer.id);
  }
}

/**
 * 保存图像
 */
function saveImage() {
  const imageData = starField.saveImage();

  // 创建下载链接
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `节奏星图_${Date.now()}.png`;
  link.click();
}

/**
 * 分享创作
 */
function shareCreation() {
  // 检查是否支持Web Share API
  if (navigator.share) {
    const imageData = starField.saveImage();

    // 创建Blob
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        // 创建File对象
        const file = new File([blob], '节奏星图.png', { type: 'image/png' });

        // 分享
        navigator.share({
          title: '节奏星图',
          text: '我创建的节奏星图',
          files: [file]
        })
          .then(() => console.log('分享成功'))
          .catch(error => console.error('分享失败:', error));
      });
  } else {
    // 不支持Web Share API，使用保存图像
    saveImage();
    alert('您的设备不支持分享功能，已保存图像到本地。');
  }
}

/**
 * 开始动画循环
 */
function startAnimationLoop() {
  // 停止现有的动画循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // 初始化时间
  appState.lastTime = Date.now();

  // 动画循环函数
  function animate() {
    // 计算时间增量
    const now = Date.now();
    appState.deltaTime = (now - appState.lastTime) / 1000;
    appState.lastTime = now;
    appState.time += appState.deltaTime;

    // 更新组件
    updateComponents();

    // 渲染组件
    renderComponents();

    // 继续动画循环
    animationFrameId = requestAnimationFrame(animate);
  }

  // 开始动画循环
  animate();
}

/**
 * 更新组件
 */
function updateComponents() {
  // 更新星空场景
  if (starField) {
    starField.update();
  }

  // 更新粒子系统
  if (particleSystem) {
    particleSystem.update(appState.deltaTime);
  }
}

/**
 * 渲染组件
 */
function renderComponents() {
  // 清除画布
  const ctx = starCanvas.getContext('2d');
  ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

  // 渲染星空场景
  if (starField) {
    starField.render();
  }

  // 渲染粒子系统
  if (particleSystem) {
    particleSystem.render();
  }
}

/**
 * 显示加载界面
 * @param {string} message - 加载消息
 */
function showLoading(message = '正在初始化星空...') {
  if (loadingOverlay) {
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }

    loadingOverlay.style.display = 'flex';
  }

  appState.isLoading = true;
}

/**
 * 隐藏加载界面
 */
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }

  appState.isLoading = false;
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showError(message) {
  alert(message);
  hideLoading();
}

/**
 * 页面加载完成时初始化应用
 */
document.addEventListener('DOMContentLoaded', () => {
  // 显示加载界面
  showLoading();

  // 初始化应用
  initApp().catch(error => {
    console.error('初始化应用失败:', error);
    showError('初始化应用失败，请刷新页面重试。');
  });
});