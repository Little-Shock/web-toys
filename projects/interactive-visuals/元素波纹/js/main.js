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

  // 设备和浏览器检测
  const deviceInfo = detectDevice();
  const isMobile = deviceInfo.isMobile;
  const isIOS = deviceInfo.isIOS;
  const isLowEndDevice = deviceInfo.isLowEndDevice;
  const hasTouchSupport = deviceInfo.hasTouchSupport;

  // 创建波纹渲染器
  const rippleCanvas2d = rippleCanvas.getContext('2d', {
    alpha: false,
    desynchronized: true, // 启用非同步渲染以减少延迟
    powerPreference: 'high-performance' // 请求高性能模式
  });
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
    lastOrientationTime: 0,
    isScrolling: false,
    scrollTimeout: null,
    // 根据设备类型和性能调整节流值
    interactionThrottle: isLowEndDevice ? 24 : (isMobile ? 16 : 8),
    // 性能监控
    fps: 0,
    lastFpsUpdate: 0,
    frameCount: 0,
    // 设备信息
    deviceInfo: deviceInfo,
    // 错误恢复
    errorCount: 0,
    maxErrorRetries: 3
  };

  /**
   * 检测设备类型和性能
   * @returns {Object} 设备信息对象
   */
  function detectDevice() {
    const info = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
      isAndroid: /Android/i.test(navigator.userAgent),
      hasTouchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isLowEndDevice: false,
      browserInfo: getBrowserInfo(),
      screenSize: Math.min(window.screen.width, window.screen.height),
      pixelRatio: window.devicePixelRatio || 1
    };

    // 检测低端设备 - 移动设备使用更严格的标准
    if (info.isMobile) {
      // 移动设备上默认将更多设备视为低端设备

      // 检查设备内存 (如果可用)
      if (navigator.deviceMemory) {
        if (navigator.deviceMemory < 4) {
          info.isLowEndDevice = true;
        }
      } else {
        // 如果无法检测内存，使用屏幕尺寸作为参考
        if (info.screenSize < 400) {
          info.isLowEndDevice = true;
        }
      }

      // 检查处理器核心数 (如果可用)
      if (navigator.hardwareConcurrency) {
        if (navigator.hardwareConcurrency < 4) {
          info.isLowEndDevice = true;
        }
      }

      // 检查是否为省电模式 (如果可用)
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        info.isLowEndDevice = true;
      }

      // 检查是否为旧版iOS设备
      if (info.isIOS) {
        const match = navigator.userAgent.match(/OS (\d+)_/);
        if (match) {
          const version = parseInt(match[1], 10);
          if (version < 14) { // iOS 14以下视为低端设备
            info.isLowEndDevice = true;
          }
        }
      }

      // 检查是否为旧版Android设备
      if (info.isAndroid) {
        const match = navigator.userAgent.match(/Android (\d+)\.(\d+)/);
        if (match) {
          const version = parseFloat(match[1] + '.' + match[2]);
          if (version < 9.0) { // Android 9.0以下视为低端设备
            info.isLowEndDevice = true;
          }
        }
      }

      // 检查像素比 - 某些低端设备有较低的像素比
      if (info.pixelRatio < 2) {
        info.isLowEndDevice = true;
      }
    } else {
      // 桌面设备使用更宽松的标准

      // 检查设备内存 (如果可用)
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        info.isLowEndDevice = true;
      }

      // 检查处理器核心数 (如果可用)
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
        info.isLowEndDevice = true;
      }

      // 检查是否为省电模式 (如果可用)
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        info.isLowEndDevice = true;
      }
    }

    // 添加性能测试结果
    try {
      // 简单的性能测试 - 测量1000次数学运算的时间
      const startTime = performance.now();
      let result = 0;
      for (let i = 0; i < 10000; i++) {
        result += Math.sin(i) * Math.cos(i);
      }
      const endTime = performance.now();
      const testTime = endTime - startTime;

      // 如果性能测试时间过长，标记为低端设备
      if (testTime > 50) { // 50ms以上视为低端设备
        info.isLowEndDevice = true;
      }

      info.performanceTestTime = testTime;
    } catch (e) {
      console.warn('性能测试失败:', e);
    }

    return info;
  }

  /**
   * 获取浏览器信息
   * @returns {Object} 浏览器信息对象
   */
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "Unknown";

    // 检测常见浏览器
    if (ua.indexOf("Firefox") > -1) {
      browserName = "Firefox";
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Chrome") > -1) {
      browserName = "Chrome";
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Safari";
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
      browserName = "Edge";
      browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || ua.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
    }

    return {
      name: browserName,
      version: browserVersion,
      userAgent: ua
    };
  }

  /**
   * 初始化应用
   */
  async function init() {
    try {
      // 显示加载指示器
      showLoadingIndicator();

      // 记录启动时间
      const startTime = performance.now();

      // 记录设备信息
      console.log('设备信息:', appState.deviceInfo);

      // 根据设备性能调整初始质量设置
      if (isLowEndDevice) {
        rippleRenderer.updateParams({
          quality: 'low',
          maxRipples: 20,
          useSimplifiedEffects: true
        });
        console.log('检测到低端设备，使用低质量设置');
      }

      // 并行初始化各个组件
      const initPromises = [
        // 初始化音频系统
        audioManager.init().catch(error => {
          console.warn('音频初始化失败，将以静音模式运行:', error);
          return false; // 允许应用继续运行，即使音频初始化失败
        }),

        // 预加载UI资源
        new Promise(resolve => {
          // 预加载图标字体
          const fontLoader = document.createElement('div');
          fontLoader.style.opacity = '0';
          fontLoader.style.position = 'absolute';
          fontLoader.style.fontFamily = 'Material Icons';
          fontLoader.textContent = 'water fire electric light settings';
          document.body.appendChild(fontLoader);

          // 预热渲染器
          rippleRenderer.resize();

          // 模拟短暂延迟以确保UI资源加载
          setTimeout(() => {
            document.body.removeChild(fontLoader);
            resolve(true);
          }, 100);
        })
      ];

      // 等待所有初始化完成
      await Promise.all(initPromises);

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

      // 添加性能监控
      setupPerformanceMonitoring();

      // 添加调试模式切换
      setupDebugMode();

      // 添加错误恢复机制
      setupErrorRecovery();

      // 记录初始化时间
      const initTime = performance.now() - startTime;
      console.log(`应用初始化完成，耗时: ${initTime.toFixed(2)}ms`);

      // 隐藏加载指示器
      hideLoadingIndicator();
    } catch (error) {
      console.error('初始化应用失败:', error);
      showErrorMessage('初始化应用时出错，请刷新页面重试。');
    }
  }

  /**
   * 设置性能监控
   */
  function setupPerformanceMonitoring() {
    // 使用requestAnimationFrame监控帧率
    let lastFrameTime = performance.now();

    function checkFPS() {
      const now = performance.now();
      const delta = now - lastFrameTime;
      lastFrameTime = now;

      appState.frameCount++;

      if (now - appState.lastFpsUpdate > 1000) { // 每秒更新一次
        appState.fps = Math.round((appState.frameCount * 1000) / (now - appState.lastFpsUpdate));
        appState.lastFpsUpdate = now;
        appState.frameCount = 0;

        // 如果帧率过低，自动降低质量
        if (appState.started && appState.fps < 30 && rippleRenderer.params.quality !== 'low') {
          console.log(`检测到低帧率 (${appState.fps}FPS)，降低质量设置`);
          rippleRenderer.updateParams({
            quality: 'low',
            useSimplifiedEffects: true
          });
        }
      }

      // 继续监控
      requestAnimationFrame(checkFPS);
    }

    // 开始监控
    requestAnimationFrame(checkFPS);
  }

  /**
   * 设置错误恢复机制
   */
  function setupErrorRecovery() {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      console.error('捕获到全局错误:', event.error);
      appState.errorCount++;

      // 如果错误次数超过阈值，尝试恢复
      if (appState.errorCount > appState.maxErrorRetries) {
        console.warn('错误次数过多，尝试恢复应用状态');

        try {
          // 重置渲染器
          rippleRenderer.clearRipples();
          rippleRenderer.updateParams({
            quality: 'low',
            useSimplifiedEffects: true
          });

          // 重置音频系统
          audioManager.stopAllSounds();

          // 清空触摸数据
          touches.clear();

          // 重置错误计数
          appState.errorCount = 0;

          showToast('应用已恢复', 2000);
        } catch (recoveryError) {
          console.error('恢复失败:', recoveryError);
          showErrorMessage('应用遇到问题，请刷新页面');
        }
      }
    });
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

    // 音频开关按钮
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', toggleAudio);
    }

    // 音频启用切换
    const audioEnabledToggle = document.getElementById('audioEnabledToggle');
    if (audioEnabledToggle) {
      audioEnabledToggle.addEventListener('change', () => {
        audioManager.setAudioEnabled(audioEnabledToggle.checked);
        // 同步更新音频按钮状态
        updateAudioToggleState();
      });
    }

    // 质量切换
    const qualityToggle = document.getElementById('qualityToggle');
    if (qualityToggle) {
      // 根据设备性能设置初始状态
      qualityToggle.checked = rippleRenderer.params.quality !== 'low';

      qualityToggle.addEventListener('change', () => {
        const quality = qualityToggle.checked ?
                      (isLowEndDevice ? 'medium' : 'high') :
                      'low';
        rippleRenderer.updateParams({
          quality: quality,
          useSimplifiedEffects: quality === 'low'
        });
        showToast(`已切换到${quality === 'low' ? '低' : (quality === 'medium' ? '中' : '高')}质量模式`, 1500);
      });
    }

    // 滑块控制 - 使用节流函数减少更新频率
    intensitySlider.addEventListener('input', throttle(updateSettings, 100));
    sizeSlider.addEventListener('input', throttle(updateSettings, 100));
    decaySlider.addEventListener('input', throttle(updateSettings, 100));
    volumeSlider.addEventListener('input', throttle(() => {
      audioManager.setVolume(volumeSlider.value / 100);
      // 同步更新音频按钮状态
      updateAudioToggleState();
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
    // 检测设备是否支持触摸事件
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 触摸事件 - 使用passive: true提高滚动性能
    if (hasTouchSupport) {
      // 在移动设备上，只阻止touchstart的默认行为，允许其他事件的默认行为以提高性能
      rippleCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      rippleCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });
      rippleCanvas.addEventListener('touchend', handleTouchEnd, { passive: true });
      rippleCanvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

      // 在移动设备上，添加额外的性能优化
      window.addEventListener('scroll', () => {
        // 滚动时暂停波纹生成，减少性能消耗
        appState.isScrolling = true;
        clearTimeout(appState.scrollTimeout);
        appState.scrollTimeout = setTimeout(() => {
          appState.isScrolling = false;
        }, 100);
      }, { passive: true });
    }

    // 鼠标事件 - 在非触摸设备上使用，或作为触摸设备的后备
    rippleCanvas.addEventListener('mousedown', handleMouseDown);
    rippleCanvas.addEventListener('mousemove', handleMouseMove);
    rippleCanvas.addEventListener('mouseup', handleMouseUp);
    rippleCanvas.addEventListener('mouseleave', handleMouseUp);

    // 阻止右键菜单
    rippleCanvas.addEventListener('contextmenu', e => e.preventDefault());

    // 添加指针事件作为统一接口 (如果支持)
    if (window.PointerEvent) {
      rippleCanvas.addEventListener('pointerdown', handlePointerDown);
    }

    // 添加设备方向变化处理
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }
  }

  /**
   * 处理指针按下事件 (统一触摸和鼠标)
   * @param {PointerEvent} e - 指针事件对象
   */
  function handlePointerDown(e) {
    // 如果是触摸事件，让touchstart处理
    if (e.pointerType === 'touch') return;

    // 如果是鼠标事件，模拟mousedown
    if (e.pointerType === 'mouse') {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button
      });
      handleMouseDown(mouseEvent);
    }
  }

  /**
   * 处理设备方向变化
   * @param {DeviceOrientationEvent} e - 设备方向事件
   */
  function handleDeviceOrientation(e) {
    // 如果应用未启动或正在滚动，不处理
    if (!appState.started || appState.isScrolling) return;

    // 节流控制
    const now = Date.now();
    if (now - appState.lastOrientationTime < 500) return; // 每500ms最多处理一次
    appState.lastOrientationTime = now;

    // 只有在倾斜角度足够大时才触发效果
    if (e.beta && e.gamma && (Math.abs(e.beta) > 25 || Math.abs(e.gamma) > 25)) {
      // 计算倾斜强度 (0-1)
      const tiltIntensity = Math.min(1.0, (Math.abs(e.beta) + Math.abs(e.gamma)) / 90);

      // 在屏幕中心添加波纹
      const centerX = rippleCanvas.width / 2 / rippleRenderer.scaleFactor;
      const centerY = rippleCanvas.height / 2 / rippleRenderer.scaleFactor;

      // 根据倾斜方向选择元素
      let element = currentElement;
      if (rippleRenderer.params.multiElement) {
        if (e.beta > 20) element = 'fire';      // 向前倾斜 = 火
        else if (e.beta < -20) element = 'water'; // 向后倾斜 = 水
        else if (e.gamma > 20) element = 'electric'; // 向右倾斜 = 电
        else if (e.gamma < -20) element = 'light';   // 向左倾斜 = 光
      }

      // 添加波纹
      rippleRenderer.addRipple(centerX, centerY, element, tiltIntensity);

      // 播放音效
      audioManager.playElementSound(element, 0.5, 0.5, tiltIntensity);
    }
  }

  /**
   * 处理触摸开始事件
   * @param {TouchEvent} e - 触摸事件对象
   */
  function handleTouchStart(e) {
    // 只在画布区域阻止默认行为，允许控制面板的正常交互
    if (!isClickOnControlPanel(e)) {
      e.preventDefault(); // 阻止默认行为，如滚动
    }

    if (!appState.started || appState.isScrolling) return;

    // 检查是否点击了控制面板
    if (isClickOnControlPanel(e)) return;

    // 节流控制，防止过于频繁的触发
    const now = Date.now();
    if (now - appState.lastInteractionTime < appState.interactionThrottle) return;
    appState.lastInteractionTime = now;

    const rect = rippleCanvas.getBoundingClientRect();

    // 限制同时处理的触摸点数量，提高性能
    // 移动设备上进一步限制触摸点数量
    const maxTouchesToProcess = isMobile ?
                               (isLowEndDevice ? 1 : 2) :
                               (isLowEndDevice ? 2 : 4);
    const touchesToProcess = Math.min(e.changedTouches.length, maxTouchesToProcess);

    // 使用requestAnimationFrame批量处理波纹生成，避免阻塞UI
    requestAnimationFrame(() => {
      for (let i = 0; i < touchesToProcess; i++) {
        const touch = e.changedTouches[i];
        // 计算相对于画布的坐标
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 确定元素类型
        let element = currentElement;

        // 如果启用了多元素模式，随机选择不同元素
        // 移动设备上减少随机性以提高性能
        if (rippleRenderer.params.multiElement && Math.random() < (isMobile ? 0.2 : 0.3)) {
          const elements = Object.keys(rippleRenderer.elementColors);
          element = elements[Math.floor(Math.random() * elements.length)];
        }

        // 添加波纹
        rippleRenderer.addRipple(x, y, element, 1.0);

        // 播放音效 - 使用异步方式避免阻塞UI
        // 移动设备上减少音频处理以提高性能
        if (!isLowEndDevice) {
          setTimeout(() => {
            audioManager.playElementSound(
              element,
              x / rect.width,
              y / rect.height,
              1.0
            );
          }, 0);
        }

        // 记录触摸 - 简化触摸数据以减少内存使用
        touches.set(touch.identifier, {
          id: touch.identifier,
          x,
          y,
          element,
          lastRipple: now,
          lastX: x,
          lastY: y,
          velocityX: 0,
          velocityY: 0,
          // 只在支持压力感应的设备上使用
          pressure: touch.force !== undefined ? touch.force : 1.0
        });
      }
    });
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
    // 不阻止默认行为，以提高滚动性能

    if (!appState.started || appState.isScrolling) return;

    // 节流控制，防止过于频繁的触发 - 移动设备上增加节流时间
    const now = Date.now();
    const throttleTime = isMobile ?
                        (isLowEndDevice ? appState.interactionThrottle * 2 : appState.interactionThrottle * 1.5) :
                        appState.interactionThrottle;

    if (now - appState.lastInteractionTime < throttleTime) return;
    appState.lastInteractionTime = now;

    const rect = rippleCanvas.getBoundingClientRect();

    // 限制同时处理的触摸点数量，提高性能
    // 移动设备上进一步限制触摸点数量
    const maxTouchesToProcess = isMobile ?
                               (isLowEndDevice ? 1 : 2) :
                               (isLowEndDevice ? 2 : 3);
    const touchesToProcess = Math.min(e.changedTouches.length, maxTouchesToProcess);

    // 使用requestAnimationFrame批量处理波纹生成，避免阻塞UI
    requestAnimationFrame(() => {
      for (let i = 0; i < touchesToProcess; i++) {
        const touch = e.changedTouches[i];
        const touchData = touches.get(touch.identifier);

        if (touchData) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          // 计算移动距离
          const dx = x - touchData.x;
          const dy = y - touchData.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 计算速度 - 简化计算以提高性能
          const timeDelta = now - touchData.lastRipple;
          if (timeDelta > 0) {
            // 移动设备上使用更简单的速度计算
            if (isMobile && isLowEndDevice) {
              touchData.velocityX = dx / timeDelta;
              touchData.velocityY = dy / timeDelta;
            } else {
              // 使用指数移动平均值平滑速度计算
              const alpha = 0.3; // 平滑因子
              touchData.velocityX = alpha * (dx / timeDelta) + (1 - alpha) * (touchData.velocityX || 0);
              touchData.velocityY = alpha * (dy / timeDelta) + (1 - alpha) * (touchData.velocityY || 0);
            }
          }

          // 更新位置
          touchData.lastX = touchData.x;
          touchData.lastY = touchData.y;
          touchData.x = x;
          touchData.y = y;

          // 获取触摸压力 (如果可用)
          if (touch.force !== undefined) {
            touchData.pressure = touch.force;
          }

          // 根据设备类型和性能调整触发阈值
          // 移动设备上增加阈值以减少波纹生成频率
          const distanceThreshold = isMobile ?
            (isLowEndDevice ? 35 : (rippleRenderer.params.quality === 'low' ? 30 : 20)) :
            (rippleRenderer.params.quality === 'low' ? 20 : 12);

          const timeThreshold = isMobile ?
            (isLowEndDevice ? 150 : (rippleRenderer.params.quality === 'low' ? 120 : 80)) :
            (rippleRenderer.params.quality === 'low' ? 100 : 60);

          // 如果移动足够远且时间间隔足够，添加新波纹
          if (distance > distanceThreshold && now - touchData.lastRipple > timeThreshold) {
            // 确定元素类型
            let element = touchData.element;

            // 如果启用了多元素模式，有机会改变元素
            // 移动设备上减少随机性以提高性能
            if (rippleRenderer.params.multiElement && Math.random() < (isMobile ? 0.05 : 0.1)) {
              const elements = Object.keys(rippleRenderer.elementColors);
              element = elements[Math.floor(Math.random() * elements.length)];
              touchData.element = element;
            }

            // 计算强度 (基于移动速度和压力)
            const speed = distance / Math.max(1, timeDelta);
            const pressureFactor = touchData.pressure !== undefined ? touchData.pressure : 1.0;
            const intensity = Math.min(1.0, 0.3 + speed * 0.05 + pressureFactor * 0.2);

            // 添加波纹
            rippleRenderer.addRipple(x, y, element, intensity);

            // 播放音效 - 使用异步方式避免阻塞UI
            // 移动设备上减少音频处理以提高性能
            if (!isLowEndDevice) {
              setTimeout(() => {
                audioManager.playElementSound(
                  element,
                  x / rect.width,
                  y / rect.height,
                  intensity
                );
              }, 0);
            }

            // 更新最后波纹时间
            touchData.lastRipple = now;
          }
        }
      }
    });
  }

  /**
   * 处理触摸结束事件
   * @param {TouchEvent} e - 触摸事件对象
   */
  function handleTouchEnd(e) {
    // 不阻止默认行为，以提高滚动性能

    if (!appState.started || appState.isScrolling) return;

    // 使用requestAnimationFrame批量处理，避免阻塞UI
    requestAnimationFrame(() => {
      // 限制同时处理的触摸点数量，提高性能
      const maxTouchesToProcess = isMobile ?
                                (isLowEndDevice ? 1 : 2) :
                                (isLowEndDevice ? 2 : 3);
      const touchesToProcess = Math.min(e.changedTouches.length, maxTouchesToProcess);

      for (let i = 0; i < touchesToProcess; i++) {
        const touch = e.changedTouches[i];
        const touchData = touches.get(touch.identifier);

        if (touchData) {
          // 计算触摸持续时间
          const touchDuration = Date.now() - touchData.lastRipple;
          const isLongPress = touchDuration > 500; // 500ms以上视为长按

          // 添加最后一个波纹，使用当前速度和压力作为强度
          const velocity = Math.sqrt(
            touchData.velocityX * touchData.velocityX +
            touchData.velocityY * touchData.velocityY
          );

          // 根据触摸类型决定最终波纹效果
          if (isLongPress) {
            // 长按结束时添加更大的波纹
            const intensity = Math.min(1.0, 0.6 + touchDuration / 5000); // 最大强度为1.0

            // 添加多个波纹创造爆发效果 - 移动设备上减少波纹数量
            const burstCount = isMobile ?
                             (isLowEndDevice ? 1 : 2) : 3;

            for (let j = 0; j < burstCount; j++) {
              // 移动设备上减少延迟以提高响应性
              const delay = isMobile ? j * 30 : j * 50;

              setTimeout(() => {
                rippleRenderer.addRipple(
                  touchData.x,
                  touchData.y,
                  touchData.element,
                  intensity * (1 - j * 0.2)
                );
              }, delay);
            }

            // 播放音效 - 移动设备上减少音频处理以提高性能
            if (!isLowEndDevice) {
              audioManager.playElementSound(
                touchData.element,
                touchData.x / rippleCanvas.width,
                touchData.y / rippleCanvas.height,
                intensity
              );
            }
          }
          // 快速滑动结束
          else if (velocity > 0.2) {
            const intensity = Math.min(1.0, 0.3 + velocity * 0.1);
            rippleRenderer.addRipple(touchData.x, touchData.y, touchData.element, intensity);

            // 播放音效 - 移动设备上减少音频处理以提高性能
            if (!isLowEndDevice) {
              setTimeout(() => {
                audioManager.playElementSound(
                  touchData.element,
                  touchData.x / rippleCanvas.width,
                  touchData.y / rippleCanvas.height,
                  intensity
                );
              }, 0);
            }
          }

          // 删除触摸数据
          touches.delete(touch.identifier);
        }
      }
    });
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
   * 切换音频状态
   */
  function toggleAudio() {
    const audioToggle = document.getElementById('audioToggle');
    const audioEnabledToggle = document.getElementById('audioEnabledToggle');

    if (!audioManager.initialized) return;

    // 切换静音状态
    const newMutedState = !audioManager.muted;
    audioManager.setMuted(newMutedState);

    // 更新UI
    audioToggle.classList.toggle('muted', newMutedState);
    audioToggle.querySelector('.audio-icon').textContent = newMutedState ? '🔇' : '🔊';

    // 同步复选框状态
    if (audioEnabledToggle) {
      audioEnabledToggle.checked = !newMutedState && audioManager.audioEnabled;
    }

    // 添加触觉反馈（如果支持）
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // 显示提示
    showToast(newMutedState ? '已静音' : '已开启声音', 1000);
  }

  /**
   * 更新音频按钮状态
   */
  function updateAudioToggleState() {
    const audioToggle = document.getElementById('audioToggle');
    const audioEnabledToggle = document.getElementById('audioEnabledToggle');

    if (!audioManager.initialized || !audioToggle) return;

    // 更新音频按钮状态
    const isMuted = audioManager.muted || !audioManager.audioEnabled || audioManager.volume === 0;
    audioToggle.classList.toggle('muted', isMuted);
    audioToggle.querySelector('.audio-icon').textContent = isMuted ? '🔇' : '🔊';

    // 同步复选框状态
    if (audioEnabledToggle) {
      audioEnabledToggle.checked = audioManager.audioEnabled && !audioManager.muted;
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
      // 记录启动时间
      const startTime = performance.now();

      // 更新应用状态
      appState.started = true;

      // 使用淡出动画隐藏开始屏幕
      startScreen.classList.add('fade-out');
      setTimeout(() => {
        startScreen.style.display = 'none';
      }, 500);

      // 使用淡入动画显示控制面板
      controlPanel.style.opacity = '0';
      controlPanel.style.display = 'flex';
      setTimeout(() => {
        controlPanel.style.opacity = '1';
      }, 100);

      // 确保音频上下文已启动
      if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume().catch(err => {
          console.warn('无法恢复音频上下文:', err);
        });
      }

      // 根据设备性能调整初始设置
      if (isLowEndDevice) {
        // 低端设备使用更保守的设置
        rippleRenderer.updateParams({
          intensity: 0.4,
          size: 0.4,
          decay: 0.6
        });
      } else if (isMobile) {
        // 移动设备使用中等设置
        rippleRenderer.updateParams({
          intensity: 0.5,
          size: 0.5,
          decay: 0.5
        });
      }

      // 更新UI以反映当前设置
      intensitySlider.value = rippleRenderer.params.intensity * 100;
      sizeSlider.value = rippleRenderer.params.size * 100;
      decaySlider.value = rippleRenderer.params.decay * 100;
      multiElementToggle.checked = rippleRenderer.params.multiElement;

      // 初始化音频按钮状态
      const audioEnabledToggle = document.getElementById('audioEnabledToggle');
      if (audioEnabledToggle) {
        // 低端移动设备默认关闭音频以提高性能
        if (isMobile && isLowEndDevice) {
          audioManager.setAudioEnabled(false);
          audioManager.setMuted(true);
          audioEnabledToggle.checked = false;
        } else {
          audioEnabledToggle.checked = audioManager.audioEnabled && !audioManager.muted;
        }
      }

      // 更新音频按钮状态
      updateAudioToggleState();

      // 添加欢迎波纹效果
      addWelcomeEffect();

      // 添加CSS样式
      addDynamicStyles();

      // 添加移动端特定优化
      if (isMobile) {
        // 添加触觉反馈（如果支持）
        if (window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }

        // 添加全屏模式支持
        setupFullscreenSupport();
      }

      // 记录启动时间
      const launchTime = performance.now() - startTime;
      console.log(`应用启动完成，耗时: ${launchTime.toFixed(2)}ms`);

      // 显示欢迎提示
      showToast('欢迎使用元素波纹！', 2000);
    } catch (error) {
      console.error('启动应用失败:', error);
      showToast('启动应用失败，请刷新页面重试');
    }
  }

  /**
   * 设置全屏支持
   */
  function setupFullscreenSupport() {
    // 检查是否支持全屏API
    if (document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||
        document.documentElement.mozRequestFullScreen ||
        document.documentElement.msRequestFullscreen) {

      // 创建全屏按钮
      const fullscreenButton = document.createElement('button');
      fullscreenButton.className = 'fullscreen-button';
      fullscreenButton.innerHTML = '<i class="material-icons">fullscreen</i>';
      fullscreenButton.title = '全屏模式';

      // 添加到控制面板
      controlPanel.appendChild(fullscreenButton);

      // 添加点击事件
      fullscreenButton.addEventListener('click', () => {
        toggleFullscreen();
      });

      // 监听全屏状态变化
      document.addEventListener('fullscreenchange', updateFullscreenButton);
      document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
      document.addEventListener('mozfullscreenchange', updateFullscreenButton);
      document.addEventListener('MSFullscreenChange', updateFullscreenButton);

      // 更新全屏按钮图标
      function updateFullscreenButton() {
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement) {
          fullscreenButton.innerHTML = '<i class="material-icons">fullscreen_exit</i>';
          fullscreenButton.title = '退出全屏';
        } else {
          fullscreenButton.innerHTML = '<i class="material-icons">fullscreen</i>';
          fullscreenButton.title = '全屏模式';
        }
      }

      // 切换全屏状态
      function toggleFullscreen() {
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement) {
          // 退出全屏
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        } else {
          // 进入全屏
          const docElm = document.documentElement;
          if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
          } else if (docElm.webkitRequestFullscreen) {
            docElm.webkitRequestFullscreen();
          } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
          } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
          }
        }

        // 添加触觉反馈
        if (window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      }

      // 添加全屏按钮样式
      const style = document.createElement('style');
      style.textContent = `
        .fullscreen-button {
          background: rgba(0, 0, 0, 0.3);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          margin-left: 10px;
          backdrop-filter: blur(5px);
          transition: background 0.3s;
        }

        .fullscreen-button:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        .fullscreen-button i {
          font-size: 24px;
        }
      `;
      document.head.appendChild(style);
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
   * 显示提示信息
   * @param {string} message - 提示信息
   * @param {number} duration - 显示时间（毫秒）
   */
  function showToast(message, duration = 2000) {
    // 移除现有的提示
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // 创建新提示
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 显示提示
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 设置定时器移除提示
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
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
