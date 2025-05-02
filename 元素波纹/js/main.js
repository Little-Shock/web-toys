/**
 * 元素波纹 - 主控制脚本
 * 处理用户交互和界面控制
 * 优化版本：提高移动端性能和用户体验
 */

// 调试模式开关
window.DEBUG_MODE = false;

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

  // 检测设备类型
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    settingsOpen: false,
    lastInteractionTime: 0,
    interactionThrottle: isMobile ? 16 : 8 // 移动设备上使用更高的节流值
  };

  /**
   * 初始化应用
   */
  async function init() {
    try {
      // 显示加载指示器
      showLoadingIndicator();

      // 初始化音频系统
      await audioManager.init();

      // 开始渲染循环
      rippleRenderer.startAnimation();

      // 设置事件监听器
      setupEventListeners();

      // 初始隐藏控制面板
      controlPanel.style.display = 'none';

      // 根据设备类型调整UI
      if (isMobile) {
        adjustUIForMobile();
      }

      // 隐藏加载指示器
      hideLoadingIndicator();

      // 添加调试模式切换
      setupDebugMode();
    } catch (error) {
      console.error('初始化应用失败:', error);
      showErrorMessage('初始化应用时出错，请刷新页面重试。');
    }
  }

  /**
   * 显示加载指示器
   */
  function showLoadingIndicator() {
    // 创建加载指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载元素波纹...</div>
    `;
    document.body.appendChild(loadingIndicator);
  }

  /**
   * 隐藏加载指示器
   */
  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.classList.add('fade-out');
      setTimeout(() => {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      }, 500);
    }
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;

    // 添加重试按钮
    const retryButton = document.createElement('button');
    retryButton.textContent = '重试';
    retryButton.className = 'retry-button';
    retryButton.addEventListener('click', () => {
      window.location.reload();
    });

    errorMessage.appendChild(document.createElement('br'));
    errorMessage.appendChild(retryButton);

    document.body.appendChild(errorMessage);

    // 隐藏加载指示器
    hideLoadingIndicator();
  }

  /**
   * 为移动设备调整UI
   */
  function adjustUIForMobile() {
    // 调整控制面板大小和位置
    controlPanel.classList.add('mobile');

    // 减小元素按钮大小
    elementButtons.forEach(btn => {
      btn.classList.add('mobile');
    });

    // 调整设置菜单位置
    settingsMenu.classList.add('mobile');

    // 添加移动设备专用样式
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
      .element-btn.mobile {
        padding: 6px 10px;
      }
      .element-icon {
        font-size: 1.2rem;
      }
      .settings-menu.mobile {
        max-width: 250px;
      }
      .control-panel.mobile {
        bottom: 10px;
      }
    `;
    document.head.appendChild(mobileStyle);
  }

  /**
   * 设置调试模式
   */
  function setupDebugMode() {
    // 添加调试模式切换快捷键
    document.addEventListener('keydown', (e) => {
      // 按下 Ctrl+D 切换调试模式
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log(`调试模式: ${window.DEBUG_MODE ? '开启' : '关闭'}`);
      }
    });
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

    // 滑块控制 - 使用节流函数减少更新频率
    intensitySlider.addEventListener('input', throttle(updateSettings, 100));
    sizeSlider.addEventListener('input', throttle(updateSettings, 100));
    decaySlider.addEventListener('input', throttle(updateSettings, 100));
    volumeSlider.addEventListener('input', throttle(() => {
      audioManager.setVolume(volumeSlider.value / 100);
    }, 100));

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

    // 窗口失焦时暂停音频和动画
    window.addEventListener('blur', () => {
      if (audioManager.audioContext) {
        audioManager.audioContext.suspend();
      }
      // 降低动画帧率以节省电池
      if (appState.started) {
        rippleRenderer.params.quality = 'low';
      }
    });

    // 窗口获得焦点时恢复音频和动画
    window.addEventListener('focus', () => {
      if (audioManager.audioContext && appState.started) {
        audioManager.audioContext.resume();
      }
      // 恢复动画质量
      if (appState.started) {
        rippleRenderer.params.quality = rippleRenderer.detectPerformance();
      }
    });

    // 处理页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面不可见时暂停音频
        if (audioManager.audioContext) {
          audioManager.audioContext.suspend();
        }
      } else {
        // 页面可见时恢复音频
        if (audioManager.audioContext && appState.started) {
          audioManager.audioContext.resume();
        }
      }
    });

    // 处理设备方向变化
    window.addEventListener('orientationchange', () => {
      // 延迟执行以确保新尺寸已应用
      setTimeout(() => {
        if (rippleRenderer) {
          rippleRenderer.resize();
        }
      }, 300);
    });
  }

  /**
   * 节流函数 - 限制函数调用频率
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} 节流后的函数
   */
  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  /**
   * 设置触摸和鼠标事件
   */
  function setupTouchEvents() {
    // 触摸事件 - 使用passive: true提高滚动性能，除了touchstart
    rippleCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    rippleCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    rippleCanvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    rippleCanvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

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
   * @param {TouchEvent} e - 触摸事件对象
   */
  function handleTouchStart(e) {
    e.preventDefault(); // 阻止默认行为，如滚动

    if (!appState.started) return;

    // 检查是否点击了控制面板
    if (isClickOnControlPanel(e)) return;

    // 节流控制，防止过于频繁的触发
    const now = Date.now();
    if (now - appState.lastInteractionTime < appState.interactionThrottle) return;
    appState.lastInteractionTime = now;

    const rect = rippleCanvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // 计算相对于画布的坐标
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
        x / rect.width,
        y / rect.height,
        1.0
      );

      // 记录触摸
      touches.set(touch.identifier, {
        id: touch.identifier,
        x,
        y,
        element,
        lastRipple: now,
        lastX: x,
        lastY: y,
        velocityX: 0,
        velocityY: 0
      });
    }
  }

  /**
   * 检查是否点击了控制面板
   * @param {Event} e - 事件对象
   * @returns {boolean} 是否点击了控制面板
   */
  function isClickOnControlPanel(e) {
    // 获取控制面板的位置
    const controlPanelRect = controlPanel.getBoundingClientRect();

    // 检查是否是触摸事件
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (
          touch.clientX >= controlPanelRect.left &&
          touch.clientX <= controlPanelRect.right &&
          touch.clientY >= controlPanelRect.top &&
          touch.clientY <= controlPanelRect.bottom
        ) {
          return true;
        }
      }
    } else {
      // 鼠标事件
      if (
        e.clientX >= controlPanelRect.left &&
        e.clientX <= controlPanelRect.right &&
        e.clientY >= controlPanelRect.top &&
        e.clientY <= controlPanelRect.bottom
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 处理触摸移动事件
   * @param {TouchEvent} e - 触摸事件对象
   */
  function handleTouchMove(e) {
    // 注意：不再阻止默认行为，以提高滚动性能

    if (!appState.started) return;

    // 节流控制，防止过于频繁的触发
    const now = Date.now();
    if (now - appState.lastInteractionTime < appState.interactionThrottle) return;
    appState.lastInteractionTime = now;

    const rect = rippleCanvas.getBoundingClientRect();

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

        // 计算速度
        const timeDelta = now - touchData.lastRipple;
        if (timeDelta > 0) {
          touchData.velocityX = dx / timeDelta;
          touchData.velocityY = dy / timeDelta;
        }

        // 更新位置
        touchData.lastX = touchData.x;
        touchData.lastY = touchData.y;
        touchData.x = x;
        touchData.y = y;

        // 根据设备类型调整触发阈值
        const distanceThreshold = isMobile ? 15 : 20;
        const timeThreshold = isMobile ? 80 : 100;

        // 如果移动足够远且时间间隔足够，添加新波纹
        if (distance > distanceThreshold && now - touchData.lastRipple > timeThreshold) {
          // 确定元素类型
          let element = touchData.element;

          // 如果启用了多元素模式，有机会改变元素
          if (rippleRenderer.params.multiElement && Math.random() < 0.1) {
            const elements = Object.keys(rippleRenderer.elementColors);
            element = elements[Math.floor(Math.random() * elements.length)];
            touchData.element = element;
          }

          // 计算强度 (基于移动速度)
          const speed = distance / Math.max(1, timeDelta);
          const intensity = Math.min(1.0, 0.3 + speed * 0.05);

          // 添加波纹
          rippleRenderer.addRipple(x, y, element, intensity);

          // 播放音效
          audioManager.playElementSound(
            element,
            x / rect.width,
            y / rect.height,
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
   * @param {TouchEvent} e - 触摸事件对象
   */
  function handleTouchEnd(e) {
    // 注意：不再阻止默认行为，以提高滚动性能

    if (!appState.started) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = touches.get(touch.identifier);

      if (touchData) {
        // 添加最后一个波纹，使用当前速度作为强度
        const velocity = Math.sqrt(
          touchData.velocityX * touchData.velocityX +
          touchData.velocityY * touchData.velocityY
        );

        // 只有在有明显速度的情况下才添加结束波纹
        if (velocity > 0.1) {
          const intensity = Math.min(1.0, 0.3 + velocity * 0.1);
          rippleRenderer.addRipple(touchData.x, touchData.y, touchData.element, intensity);
        }

        // 删除触摸数据
        touches.delete(touch.identifier);
      }
    }
  }

  /**
   * 处理鼠标按下事件
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseDown(e) {
    if (!appState.started) return;

    // 检查是否点击了控制面板
    if (isClickOnControlPanel(e)) return;

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
      x / rect.width,
      y / rect.height,
      1.0
    );

    // 记录鼠标状态
    touches.set('mouse', {
      id: 'mouse',
      x,
      y,
      lastX: x,
      lastY: y,
      element,
      lastRipple: Date.now(),
      isDown: true,
      velocityX: 0,
      velocityY: 0
    });
  }

  /**
   * 处理鼠标移动事件
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseMove(e) {
    if (!appState.started) return;

    const mouseData = touches.get('mouse');

    if (mouseData && mouseData.isDown) {
      // 节流控制，防止过于频繁的触发
      const now = Date.now();
      if (now - appState.lastInteractionTime < appState.interactionThrottle) return;
      appState.lastInteractionTime = now;

      const rect = rippleCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 计算移动距离
      const dx = x - mouseData.x;
      const dy = y - mouseData.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 计算速度
      const timeDelta = now - mouseData.lastRipple;
      if (timeDelta > 0) {
        mouseData.velocityX = dx / timeDelta;
        mouseData.velocityY = dy / timeDelta;
      }

      // 更新位置
      mouseData.lastX = mouseData.x;
      mouseData.lastY = mouseData.y;
      mouseData.x = x;
      mouseData.y = y;

      // 如果移动足够远且时间间隔足够，添加新波纹
      if (distance > 15 && now - mouseData.lastRipple > 50) {
        // 确定元素类型
        let element = mouseData.element;

        // 如果启用了多元素模式，有机会改变元素
        if (rippleRenderer.params.multiElement && Math.random() < 0.1) {
          const elements = Object.keys(rippleRenderer.elementColors);
          element = elements[Math.floor(Math.random() * elements.length)];
          mouseData.element = element;
        }

        // 计算强度 (基于移动速度)
        const speed = distance / Math.max(1, timeDelta);
        const intensity = Math.min(1.0, 0.3 + speed * 0.05);

        // 添加波纹
        rippleRenderer.addRipple(x, y, element, intensity);

        // 播放音效
        audioManager.playElementSound(
          element,
          x / rect.width,
          y / rect.height,
          intensity
        );

        // 更新最后波纹时间
        mouseData.lastRipple = now;
      }
    }
  }

  /**
   * 处理鼠标松开事件
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function handleMouseUp(e) {
    if (!appState.started) return;

    const mouseData = touches.get('mouse');

    if (mouseData && mouseData.isDown) {
      // 添加最后一个波纹，使用当前速度作为强度
      const velocity = Math.sqrt(
        mouseData.velocityX * mouseData.velocityX +
        mouseData.velocityY * mouseData.velocityY
      );

      // 只有在有明显速度的情况下才添加结束波纹
      if (velocity > 0.1) {
        const intensity = Math.min(1.0, 0.3 + velocity * 0.1);
        rippleRenderer.addRipple(mouseData.x, mouseData.y, mouseData.element, intensity);
      }

      mouseData.isDown = false;
    }
  }

  /**
   * 处理背景图片上传
   * @param {Event} e - 事件对象
   */
  function handleBackgroundUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件');
      return;
    }

    // 检查文件大小
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('图片文件过大，请选择小于5MB的图片');
      return;
    }

    // 显示加载指示器
    showLoadingIndicator();

    const reader = new FileReader();

    reader.onload = function(event) {
      // 预加载图像以获取尺寸
      const img = new Image();
      img.onload = function() {
        // 检查图像尺寸
        if (img.width < 100 || img.height < 100) {
          hideLoadingIndicator();
          showToast('图片尺寸太小，请选择更大的图片');
          return;
        }

        // 设置背景
        rippleRenderer.setBackground(event.target.result)
          .then(() => {
            console.log('背景图片设置成功');
            hideLoadingIndicator();
            showToast('背景图片设置成功');
          })
          .catch(error => {
            console.error('背景图片设置失败:', error);
            hideLoadingIndicator();
            showToast('背景图片设置失败，请重试');
          });
      };

      img.onerror = function() {
        hideLoadingIndicator();
        showToast('图片加载失败，请选择其他图片');
      };

      img.src = event.target.result;
    };

    reader.onerror = function() {
      hideLoadingIndicator();
      showToast('读取文件失败，请重试');
    };

    reader.readAsDataURL(file);

    // 重置文件输入，以便可以再次选择同一文件
    e.target.value = '';
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   */
  function showToast(message, duration = 3000) {
    // 移除现有的提示
    const existingToast = document.getElementById('toast');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }

    // 创建新提示
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // 显示提示
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 隐藏提示
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * 设置当前元素
   * @param {string} element - 元素类型
   */
  function setCurrentElement(element) {
    if (currentElement === element) return;

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

    // 添加触觉反馈（如果支持）
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // 显示元素名称提示
    const elementNames = {
      water: '水元素',
      fire: '火元素',
      electric: '电元素',
      light: '光元素'
    };

    showToast(elementNames[element] || element, 1000);
  }

  /**
   * 切换设置菜单
   */
  function toggleSettings() {
    appState.settingsOpen = !appState.settingsOpen;

    if (appState.settingsOpen) {
      settingsMenu.classList.remove('hidden');
      settingsToggle.classList.add('active');

      // 添加触觉反馈（如果支持）
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    } else {
      settingsMenu.classList.add('hidden');
      settingsToggle.classList.remove('active');
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
    try {
      appState.started = true;

      // 隐藏开始屏幕
      startScreen.style.display = 'none';

      // 显示控制面板
      controlPanel.style.display = 'flex';

      // 确保音频上下文已启动
      if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }

      // 添加欢迎波纹效果
      addWelcomeEffect();

      // 添加CSS样式
      addDynamicStyles();
    } catch (error) {
      console.error('启动应用失败:', error);
      showToast('启动应用失败，请刷新页面重试');
    }
  }

  /**
   * 添加欢迎波纹效果
   */
  function addWelcomeEffect() {
    // 在屏幕中心添加所有四种元素的波纹
    const centerX = rippleCanvas.width / 2 / rippleRenderer.scaleFactor;
    const centerY = rippleCanvas.height / 2 / rippleRenderer.scaleFactor;
    const elements = Object.keys(rippleRenderer.elementColors);

    // 依次添加四种元素的波纹
    elements.forEach((element, index) => {
      setTimeout(() => {
        rippleRenderer.addRipple(centerX, centerY, element, 1.0);
      }, index * 200);
    });
  }

  /**
   * 添加动态样式
   */
  function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-weight: bold;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        opacity: 1;
        transition: opacity 0.5s;
      }

      .loading-indicator.fade-out {
        opacity: 0;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      .loading-text {
        color: white;
        font-size: 1.2rem;
      }

      .error-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 0, 0, 0.2);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 2000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 0, 0, 0.5);
        max-width: 80%;
      }

      .retry-button {
        margin-top: 15px;
        padding: 8px 20px;
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .retry-button:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 清理资源
   * 在页面卸载时调用，防止内存泄漏
   */
  function cleanup() {
    // 停止动画
    if (rippleRenderer) {
      rippleRenderer.dispose();
    }

    // 清理音频资源
    if (audioManager) {
      audioManager.dispose();
    }

    // 移除事件监听器
    window.removeEventListener('beforeunload', cleanup);
  }

  // 添加页面卸载事件监听器
  window.addEventListener('beforeunload', cleanup);

  // 初始化应用
  init();
});
