/**
 * 元素波纹 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const startScreen = document.getElementById('startScreen');
  const startButton = document.getElementById('startButton');
  const backgroundUpload = document.getElementById('backgroundUpload');
  const rippleCanvas = document.getElementById('rippleCanvas');
  const controlPanel = document.getElementById('controlPanel');
  const elementButtons = document.querySelectorAll('.element-btn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsMenu = document.getElementById('settingsMenu');
  const intensitySlider = document.getElementById('intensitySlider');
  const sizeSlider = document.getElementById('sizeSlider');
  const decaySlider = document.getElementById('decaySlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const multiElementToggle = document.getElementById('multiElementToggle');
  const resetButton = document.getElementById('resetButton');
  const uploadNewButton = document.getElementById('uploadNewButton');
  
  // 创建波纹渲染器
  const rippleRenderer = new RippleRenderer(rippleCanvas);
  
  // 创建音频管理器
  const audioManager = new AudioManager();
  
  // 触摸跟踪
  const touches = new Map();
  
  // 当前选中的元素
  let currentElement = 'water';
  
  // 应用程序状态
  let appState = {
    started: false,
    settingsOpen: false
  };
  
  /**
   * 初始化应用
   */
  async function init() {
    // 初始化音频系统
    await audioManager.init();
    
    // 开始渲染循环
    rippleRenderer.startAnimation();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始隐藏控制面板
    controlPanel.style.display = 'none';
  }
  
  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 开始按钮
    startButton.addEventListener('click', startApp);
    
    // 背景上传
    backgroundUpload.addEventListener('change', handleBackgroundUpload);
    
    // 元素选择按钮
    elementButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setCurrentElement(btn.dataset.element);
      });
    });
    
    // 设置菜单切换
    settingsToggle.addEventListener('click', toggleSettings);
    
    // 滑块控制
    intensitySlider.addEventListener('input', updateSettings);
    sizeSlider.addEventListener('input', updateSettings);
    decaySlider.addEventListener('input', updateSettings);
    volumeSlider.addEventListener('input', () => {
      audioManager.setVolume(volumeSlider.value / 100);
    });
    
    // 多元素切换
    multiElementToggle.addEventListener('change', updateSettings);
    
    // 重置按钮
    resetButton.addEventListener('click', () => {
      rippleRenderer.clearRipples();
    });
    
    // 上传新背景按钮
    uploadNewButton.addEventListener('click', () => {
      backgroundUpload.click();
    });
    
    // 触摸/鼠标事件
    setupTouchEvents();
    
    // 窗口失焦时暂停音频
    window.addEventListener('blur', () => {
      if (audioManager.audioContext) {
        audioManager.audioContext.suspend();
      }
    });
    
    // 窗口获得焦点时恢复音频
    window.addEventListener('focus', () => {
      if (audioManager.audioContext && appState.started) {
        audioManager.audioContext.resume();
      }
    });
  }
  
  /**
   * 设置触摸和鼠标事件
   */
  function setupTouchEvents() {
    // 触摸事件
    rippleCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    rippleCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    rippleCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    rippleCanvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // 鼠标事件
    rippleCanvas.addEventListener('mousedown', handleMouseDown);
    rippleCanvas.addEventListener('mousemove', handleMouseMove);
    rippleCanvas.addEventListener('mouseup', handleMouseUp);
    rippleCanvas.addEventListener('mouseleave', handleMouseUp);
    
    // 阻止默认行为
    rippleCanvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  
  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(e) {
    e.preventDefault();
    
    if (!appState.started) return;
    
    const rect = rippleCanvas.getBoundingClientRect();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 确定元素类型
      let element = currentElement;
      
      // 如果启用了多元素模式，随机选择不同元素
      if (rippleRenderer.params.multiElement && Math.random() < 0.3) {
        const elements = Object.keys(rippleRenderer.elementColors);
        element = elements[Math.floor(Math.random() * elements.length)];
      }
      
      // 添加波纹
      rippleRenderer.addRipple(x, y, element, 1.0);
      
      // 播放音效
      audioManager.playElementSound(
        element,
        x / rippleCanvas.width,
        y / rippleCanvas.height,
        1.0
      );
      
      // 记录触摸
      touches.set(touch.identifier, {
        id: touch.identifier,
        x,
        y,
        element,
        lastRipple: Date.now()
      });
    }
  }
  
  /**
   * 处理触摸移动事件
   */
  function handleTouchMove(e) {
    e.preventDefault();
    
    if (!appState.started) return;
    
    const rect = rippleCanvas.getBoundingClientRect();
    const now = Date.now();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = touches.get(touch.identifier);
      
      if (touchData) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // 计算移动距离
        const dx = x - touchData.x;
        const dy = y - touchData.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 更新位置
        touchData.x = x;
        touchData.y = y;
        
        // 如果移动足够远且时间间隔足够，添加新波纹
        if (distance > 20 && now - touchData.lastRipple > 100) {
          // 确定元素类型
          let element = touchData.element;
          
          // 如果启用了多元素模式，有机会改变元素
          if (rippleRenderer.params.multiElement && Math.random() < 0.1) {
            const elements = Object.keys(rippleRenderer.elementColors);
            element = elements[Math.floor(Math.random() * elements.length)];
            touchData.element = element;
          }
          
          // 计算强度 (基于移动速度)
          const timeDelta = now - touchData.lastRipple;
          const speed = distance / timeDelta;
          const intensity = Math.min(1.0, 0.3 + speed * 0.05);
          
          // 添加波纹
          rippleRenderer.addRipple(x, y, element, intensity);
          
          // 播放音效
          audioManager.playElementSound(
            element,
            x / rippleCanvas.width,
            y / rippleCanvas.height,
            intensity
          );
          
          // 更新最后波纹时间
          touchData.lastRipple = now;
        }
      }
    }
  }
  
  /**
   * 处理触摸结束事件
   */
  function handleTouchEnd(e) {
    e.preventDefault();
    
    if (!appState.started) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      touches.delete(touch.identifier);
    }
  }
  
  /**
   * 处理鼠标按下事件
   */
  function handleMouseDown(e) {
    if (!appState.started) return;
    
    const rect = rippleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 确定元素类型
    let element = currentElement;
    
    // 如果启用了多元素模式且按下右键，随机选择不同元素
    if (e.button === 2 || (rippleRenderer.params.multiElement && Math.random() < 0.3)) {
      const elements = Object.keys(rippleRenderer.elementColors);
      element = elements[Math.floor(Math.random() * elements.length)];
    }
    
    // 添加波纹
    rippleRenderer.addRipple(x, y, element, 1.0);
    
    // 播放音效
    audioManager.playElementSound(
      element,
      x / rippleCanvas.width,
      y / rippleCanvas.height,
      1.0
    );
    
    // 记录鼠标状态
    touches.set('mouse', {
      id: 'mouse',
      x,
      y,
      element,
      lastRipple: Date.now(),
      isDown: true
    });
  }
  
  /**
   * 处理鼠标移动事件
   */
  function handleMouseMove(e) {
    if (!appState.started) return;
    
    const mouseData = touches.get('mouse');
    
    if (mouseData && mouseData.isDown) {
      const rect = rippleCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = Date.now();
      
      // 计算移动距离
      const dx = x - mouseData.x;
      const dy = y - mouseData.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 更新位置
      mouseData.x = x;
      mouseData.y = y;
      
      // 如果移动足够远且时间间隔足够，添加新波纹
      if (distance > 20 && now - mouseData.lastRipple > 50) {
        // 确定元素类型
        let element = mouseData.element;
        
        // 如果启用了多元素模式，有机会改变元素
        if (rippleRenderer.params.multiElement && Math.random() < 0.1) {
          const elements = Object.keys(rippleRenderer.elementColors);
          element = elements[Math.floor(Math.random() * elements.length)];
          mouseData.element = element;
        }
        
        // 计算强度 (基于移动速度)
        const timeDelta = now - mouseData.lastRipple;
        const speed = distance / timeDelta;
        const intensity = Math.min(1.0, 0.3 + speed * 0.05);
        
        // 添加波纹
        rippleRenderer.addRipple(x, y, element, intensity);
        
        // 播放音效
        audioManager.playElementSound(
          element,
          x / rippleCanvas.width,
          y / rippleCanvas.height,
          intensity
        );
        
        // 更新最后波纹时间
        mouseData.lastRipple = now;
      }
    }
  }
  
  /**
   * 处理鼠标松开事件
   */
  function handleMouseUp() {
    if (!appState.started) return;
    
    const mouseData = touches.get('mouse');
    
    if (mouseData) {
      mouseData.isDown = false;
    }
  }
  
  /**
   * 处理背景图片上传
   */
  function handleBackgroundUpload(e) {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        rippleRenderer.setBackground(event.target.result)
          .then(() => {
            console.log('背景图片设置成功');
          })
          .catch(error => {
            console.error('背景图片设置失败:', error);
          });
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * 设置当前元素
   */
  function setCurrentElement(element) {
    currentElement = element;
    rippleRenderer.setCurrentElement(element);
    
    // 更新UI
    elementButtons.forEach(btn => {
      if (btn.dataset.element === element) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  /**
   * 切换设置菜单
   */
  function toggleSettings() {
    appState.settingsOpen = !appState.settingsOpen;
    
    if (appState.settingsOpen) {
      settingsMenu.classList.remove('hidden');
    } else {
      settingsMenu.classList.add('hidden');
    }
  }
  
  /**
   * 更新设置
   */
  function updateSettings() {
    const params = {
      intensity: intensitySlider.value / 100,
      size: sizeSlider.value / 100,
      decay: decaySlider.value / 100,
      multiElement: multiElementToggle.checked
    };
    
    rippleRenderer.updateParams(params);
  }
  
  /**
   * 启动应用
   */
  function startApp() {
    appState.started = true;
    
    // 隐藏开始屏幕
    startScreen.style.display = 'none';
    
    // 显示控制面板
    controlPanel.style.display = 'flex';
    
    // 确保音频上下文已启动
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
      audioManager.audioContext.resume();
    }
  }
  
  // 初始化应用
  init();
});
