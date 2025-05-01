/**
 * 赛博流麻 - 主控制脚本
 * 处理用户交互和应用程序初始化
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const loadingOverlay = document.getElementById('loadingOverlay');
  const sceneContainer = document.getElementById('sceneContainer');
  const controlsPanel = document.getElementById('controlsPanel');
  const toggleControlsBtn = document.getElementById('toggleControlsBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const imageUpload = document.getElementById('imageUpload');
  const resetBtn = document.getElementById('resetBtn');
  const shareBtn = document.getElementById('shareBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const exportGifBtn = document.getElementById('exportGifBtn');
  const tipsContainer = document.getElementById('tipsContainer');
  const closeTipsBtn = document.getElementById('closeTipsBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = shareModal.querySelector('.close-modal');
  const permissionModal = document.getElementById('permissionModal');
  const grantPermissionBtn = document.getElementById('grantPermissionBtn');
  const skipPermissionBtn = document.getElementById('skipPermissionBtn');

  // GIF导出相关元素
  const gifModal = document.getElementById('gifModal');
  const closeGifModal = document.getElementById('closeGifModal');
  const gifDuration = document.getElementById('gifDuration');
  const gifQuality = document.getElementById('gifQuality');
  const gifSize = document.getElementById('gifSize');
  const gifPreviewContainer = document.getElementById('gifPreviewContainer');
  const gifProgress = document.getElementById('gifProgress');
  const gifProgressBar = document.getElementById('gifProgressBar');
  const gifProgressText = document.getElementById('gifProgressText');
  const startGifRecordingBtn = document.getElementById('startGifRecordingBtn');
  const downloadGifBtn = document.getElementById('downloadGifBtn');

  // 滑块控制器
  const sliders = {
    fluidViscosity: document.getElementById('fluidViscosity'),
    fluidSpeed: document.getElementById('fluidSpeed'),
    particleDensity: document.getElementById('particleDensity'),
    particleSize: document.getElementById('particleSize')
  };

  // 颜色选择器
  const colorInputs = {
    fluidColor: document.getElementById('fluidColor'),
    particleColor: document.getElementById('particleColor')
  };

  // 应用程序状态
  const appState = {
    isMobile: window.innerWidth <= 767,
    isLoading: true,
    controlsExpanded: false,
    hasDeviceMotion: false,
    currentImage: null,
    currentPreset: 'default',
    touchInteraction: {
      isPressed: false,
      pressTimer: null,
      pressPosition: { x: 0, y: 0 },
      pressStartTime: 0,
      longPressThreshold: 500 // 长按阈值（毫秒）
    },
    gifExport: {
      exporter: null,
      isRecording: false,
      recordingStartTime: 0,
      currentBlob: null,
      frameCount: 0
    }
  };

  // 初始化场景管理器
  const sceneManager = new SceneManager(sceneContainer);

  // 初始化流体模拟器
  const fluidSimulator = new FluidSimulator();

  // 初始化粒子系统
  const particleSystem = new ParticleSystem();

  // 初始化图像处理器
  const imageProcessor = new ImageProcessor();

  /**
   * 初始化应用程序
   */
  async function init() {
    try {
      // 显示加载指示器
      showLoading();

      // 初始化场景
      await sceneManager.init();

      // 初始化流体模拟器
      await fluidSimulator.init();

      // 初始化粒子系统
      await particleSystem.init();

      // 添加到场景
      sceneManager.addToScene(fluidSimulator.getMesh());
      sceneManager.addToScene(particleSystem.getMesh());

      // 加载默认图像
      await loadDefaultImage();

      // 设置默认参数
      updateParametersFromUI();

      // 检查设备方向传感器
      checkDeviceMotion();

      // 开始渲染循环
      sceneManager.startRenderLoop(() => {
        fluidSimulator.update();
        particleSystem.update();
      });

      // 隐藏加载指示器
      hideLoading();

      // 显示使用提示
      setTimeout(() => {
        tipsContainer.style.opacity = '1';
        tipsContainer.style.transform = 'translateY(0)';
      }, 1000);
    } catch (error) {
      console.error('初始化错误:', error);
      alert('初始化失败，请刷新页面重试');
    }
  }

  /**
   * 显示加载指示器
   */
  function showLoading() {
    appState.isLoading = true;
    loadingOverlay.style.display = 'flex';
  }

  /**
   * 隐藏加载指示器
   */
  function hideLoading() {
    appState.isLoading = false;
    loadingOverlay.style.display = 'none';
  }

  /**
   * 加载默认图像
   */
  async function loadDefaultImage() {
    try {
      const defaultImage = 'assets/presets/default.jpg';
      const imageTexture = await imageProcessor.loadImage(defaultImage);

      // 设置为当前图像
      appState.currentImage = defaultImage;

      // 应用到流体和粒子系统
      fluidSimulator.setBaseTexture(imageTexture);

      // 高亮默认图像预设
      document.querySelector('.preset-image[data-image="default"]').classList.add('active');
    } catch (error) {
      console.error('加载默认图像失败:', error);
    }
  }

  /**
   * 从UI更新参数
   */
  function updateParametersFromUI() {
    // 获取滑块值并转换为0-1范围
    const params = {};
    Object.keys(sliders).forEach(key => {
      params[key] = sliders[key].value / 100;

      // 更新显示的值
      const display = sliders[key].nextElementSibling;
      if (display) {
        display.textContent = `${sliders[key].value}%`;
      }
    });

    // 获取颜色值
    const colors = {};
    Object.keys(colorInputs).forEach(key => {
      colors[key] = colorInputs[key].value;
    });

    // 应用参数
    fluidSimulator.updateParams({
      viscosity: params.fluidViscosity,
      speed: params.fluidSpeed,
      color: colors.fluidColor
    });

    particleSystem.updateParams({
      density: params.particleDensity,
      size: params.particleSize,
      color: colors.particleColor
    });
  }

  /**
   * 应用预设效果
   */
  function applyPreset(presetName) {
    // 预设参数配置
    const presets = {
      default: {
        fluidViscosity: 50,
        fluidSpeed: 40,
        particleDensity: 60,
        particleSize: 30,
        fluidColor: '#00a0ff',
        particleColor: '#ffffff'
      },
      ocean: {
        fluidViscosity: 70,
        fluidSpeed: 30,
        particleDensity: 80,
        particleSize: 20,
        fluidColor: '#0066cc',
        particleColor: '#00ffff'
      },
      galaxy: {
        fluidViscosity: 40,
        fluidSpeed: 50,
        particleDensity: 90,
        particleSize: 15,
        fluidColor: '#330066',
        particleColor: '#ff00ff'
      },
      lava: {
        fluidViscosity: 80,
        fluidSpeed: 20,
        particleDensity: 50,
        particleSize: 40,
        fluidColor: '#cc3300',
        particleColor: '#ffcc00'
      }
    };

    if (!presets[presetName]) return;

    const preset = presets[presetName];

    // 更新滑块值
    Object.keys(sliders).forEach(key => {
      if (preset[key] !== undefined) {
        sliders[key].value = preset[key];

        // 更新显示的值
        const display = sliders[key].nextElementSibling;
        if (display) {
          display.textContent = `${preset[key]}%`;
        }
      }
    });

    // 更新颜色选择器
    Object.keys(colorInputs).forEach(key => {
      if (preset[key] !== undefined) {
        colorInputs[key].value = preset[key];
      }
    });

    // 应用参数
    updateParametersFromUI();

    // 更新当前预设
    appState.currentPreset = presetName;

    // 高亮当前预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetName);
    });
  }

  /**
   * 处理图片上传
   */
  async function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择有效的图片文件');
      return;
    }

    try {
      showLoading();

      // 加载图像
      const imageTexture = await imageProcessor.loadImageFromFile(file);

      // 应用到流体和粒子系统
      fluidSimulator.setBaseTexture(imageTexture);

      // 清除预设图像的选中状态
      document.querySelectorAll('.preset-image').forEach(el => {
        el.classList.remove('active');
      });

      hideLoading();
    } catch (error) {
      console.error('图像处理错误:', error);
      alert('图像处理失败，请尝试其他图片');
      hideLoading();
    }
  }

  /**
   * 切换控制面板展开/收起
   */
  function toggleControlsPanel() {
    controlsPanel.classList.toggle('expanded');
    toggleControlsBtn.classList.toggle('active');
    appState.controlsExpanded = controlsPanel.classList.contains('expanded');
  }

  /**
   * 检查设备方向传感器
   */
  function checkDeviceMotion() {
    if (window.DeviceMotionEvent) {
      // iOS 13+ 需要请求权限
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // 显示权限请求模态框
        permissionModal.style.display = 'block';
      } else {
        // 其他设备直接添加监听器
        setupDeviceMotion();
      }
    } else {
      console.log('设备不支持方向传感器');
      // 继续使用鼠标/触摸控制
    }
  }

  /**
   * 设置设备方向监听
   */
  function setupDeviceMotion() {
    window.addEventListener('devicemotion', handleDeviceMotion);
    appState.hasDeviceMotion = true;
  }

  /**
   * 处理设备方向变化
   */
  function handleDeviceMotion(event) {
    const accelerationX = event.accelerationIncludingGravity.x || 0;
    const accelerationY = event.accelerationIncludingGravity.y || 0;
    const accelerationZ = event.accelerationIncludingGravity.z || 0;

    // 将加速度传递给流体模拟器
    fluidSimulator.applyForce(accelerationX, accelerationY, accelerationZ);

    // 将加速度传递给粒子系统
    particleSystem.applyForce(accelerationX, accelerationY, accelerationZ);
  }

  /**
   * 分享功能
   */
  function shareContent(platform) {
    // 获取当前场景的截图
    const screenshot = sceneManager.takeScreenshot();

    switch (platform) {
      case 'wechat':
        // 生成二维码
        // 实际实现需要后端支持
        alert('请截图后在微信中分享');
        break;
      case 'weibo':
        // 打开微博分享
        // 实际实现需要微博API
        alert('请截图后在微博中分享');
        break;
      case 'qq':
        // 打开QQ分享
        // 实际实现需要QQ API
        alert('请截图后在QQ中分享');
        break;
      case 'download':
        // 下载截图
        const link = document.createElement('a');
        link.href = screenshot;
        link.download = `cyberpunk-liquid-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
    }

    // 关闭分享模态框
    shareModal.style.display = 'none';
  }

  /**
   * 进入全屏模式
   */
  function enterFullscreen() {
    const element = document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }

  /**
   * 重置应用
   */
  function resetApp() {
    // 重置流体模拟器
    fluidSimulator.reset();

    // 重置粒子系统
    particleSystem.reset();

    // 应用默认预设
    applyPreset('default');

    // 重新加载默认图像
    loadDefaultImage();
  }

  /**
   * 处理窗口大小变化
   */
  function handleResize() {
    const wasMobile = appState.isMobile;
    appState.isMobile = window.innerWidth <= 767;

    // 更新场景尺寸
    sceneManager.updateSize();

    // 如果设备类型发生变化，更新界面
    if (wasMobile !== appState.isMobile) {
      if (!appState.isMobile) {
        controlsPanel.classList.remove('expanded');
        toggleControlsBtn.classList.remove('active');
      }
    }
  }

  // 事件监听器

  // 控制面板切换
  toggleControlsBtn.addEventListener('click', toggleControlsPanel);

  // 上传图片
  uploadBtn.addEventListener('click', () => {
    imageUpload.click();
  });

  imageUpload.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0]);
  });

  // 预设图像选择
  document.querySelectorAll('.preset-image').forEach(el => {
    el.addEventListener('click', () => {
      const imageName = el.dataset.image;

      // 清除其他选中状态
      document.querySelectorAll('.preset-image').forEach(img => {
        img.classList.remove('active');
      });

      // 添加选中状态
      el.classList.add('active');

      // 加载预设图像
      const imagePath = `assets/presets/${imageName}.svg`;
      imageProcessor.loadImage(imagePath).then(texture => {
        fluidSimulator.setBaseTexture(texture);
        appState.currentImage = imagePath;
      });
    });
  });

  // 预设效果按钮
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.dataset.preset;
      applyPreset(presetName);
    });
  });

  // 滑块控制
  Object.values(sliders).forEach(slider => {
    slider.addEventListener('input', updateParametersFromUI);
  });

  // 颜色选择器
  Object.values(colorInputs).forEach(input => {
    input.addEventListener('input', updateParametersFromUI);
  });

  // 按钮事件
  resetBtn.addEventListener('click', resetApp);
  shareBtn.addEventListener('click', () => {
    shareModal.style.display = 'block';
  });
  fullscreenBtn.addEventListener('click', enterFullscreen);

  // 关闭提示
  closeTipsBtn.addEventListener('click', () => {
    tipsContainer.style.opacity = '0';
    tipsContainer.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      tipsContainer.style.display = 'none';
    }, 300);
  });

  // 关闭分享模态框
  closeShareModal.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  // 分享按钮
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      shareContent(platform);
    });
  });

  // 权限请求
  grantPermissionBtn.addEventListener('click', () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            setupDeviceMotion();
          }
        })
        .catch(console.error);
    }
    permissionModal.style.display = 'none';
  });

  skipPermissionBtn.addEventListener('click', () => {
    permissionModal.style.display = 'none';
  });

  // GIF导出相关事件
  exportGifBtn.addEventListener('click', () => {
    // 显示GIF导出模态框
    gifModal.style.display = 'block';

    // 重置GIF导出状态
    resetGifExportState();
  });

  closeGifModal.addEventListener('click', () => {
    gifModal.style.display = 'none';

    // 如果正在录制，取消录制
    if (appState.gifExport.isRecording) {
      cancelGifRecording();
    }
  });

  // GIF持续时间滑块
  gifDuration.addEventListener('input', () => {
    const duration = gifDuration.value;
    gifDuration.nextElementSibling.textContent = `${duration}秒`;
  });

  // 开始GIF录制
  startGifRecordingBtn.addEventListener('click', () => {
    if (appState.gifExport.isRecording) {
      // 如果正在录制，停止录制
      stopGifRecording();
      startGifRecordingBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> 开始录制';
    } else {
      // 开始录制
      startGifRecording();
      startGifRecordingBtn.innerHTML = '<i class="fas fa-stop"></i> 停止录制';
    }
  });

  // 下载GIF
  downloadGifBtn.addEventListener('click', () => {
    if (appState.gifExport.currentBlob) {
      // 下载GIF
      GifExporter.downloadGif(appState.gifExport.currentBlob, `cyber-light-flow-${Date.now()}.gif`);
    }
  });

  /**
   * 开始GIF录制
   */
  async function startGifRecording() {
    // 获取GIF设置
    const duration = parseInt(gifDuration.value);
    const quality = gifQuality.value;
    const size = gifSize.value;

    // 设置GIF尺寸
    let width, height;
    switch (size) {
      case 'small':
        width = height = 200;
        break;
      case 'medium':
        width = height = 300;
        break;
      case 'large':
        width = height = 500;
        break;
      default:
        width = height = 300;
    }

    // 设置GIF质量
    let qualityValue;
    switch (quality) {
      case 'low':
        qualityValue = 20;
        break;
      case 'medium':
        qualityValue = 10;
        break;
      case 'high':
        qualityValue = 5;
        break;
      default:
        qualityValue = 10;
    }

    // 创建GIF导出器
    appState.gifExport.exporter = new GifExporter({
      quality: qualityValue,
      width: width,
      height: height,
      fps: 15,
      duration: duration
    });

    // 设置进度回调
    appState.gifExport.exporter.setProgressCallback((progress) => {
      // 更新进度条
      gifProgressBar.style.width = `${progress * 100}%`;
      gifProgressText.textContent = `处理中... ${Math.round(progress * 100)}%`;
    });

    // 设置完成回调
    appState.gifExport.exporter.setFinishedCallback((blob) => {
      // 保存GIF Blob
      appState.gifExport.currentBlob = blob;

      // 创建预览
      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = url;

      // 清空预览容器
      gifPreviewContainer.innerHTML = '';
      gifPreviewContainer.appendChild(img);

      // 更新UI
      gifProgressText.textContent = `完成! 大小: ${(blob.size / 1024).toFixed(1)} KB`;
      downloadGifBtn.disabled = false;
      startGifRecordingBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> 重新录制';
      appState.gifExport.isRecording = false;
    });

    // 开始录制
    const success = await appState.gifExport.exporter.startRecording();

    if (success) {
      // 更新状态
      appState.gifExport.isRecording = true;
      appState.gifExport.recordingStartTime = Date.now();
      appState.gifExport.frameCount = 0;

      // 更新UI
      gifProgressBar.style.width = '0%';
      gifProgressText.textContent = '录制中...';
      downloadGifBtn.disabled = true;

      // 开始捕获帧
      captureGifFrame();
    } else {
      alert('GIF录制初始化失败，请重试');
    }
  }

  /**
   * 捕获GIF帧
   */
  function captureGifFrame() {
    if (!appState.gifExport.isRecording) return;

    // 获取当前帧
    const screenshot = sceneManager.takeScreenshot();

    // 创建图像对象
    const img = new Image();
    img.onload = () => {
      // 添加帧
      appState.gifExport.exporter.addFrame(img);

      // 更新帧计数
      appState.gifExport.frameCount++;

      // 更新进度文本
      const elapsedTime = (Date.now() - appState.gifExport.recordingStartTime) / 1000;
      const duration = parseInt(gifDuration.value);
      const progress = Math.min(1, elapsedTime / duration);

      gifProgressBar.style.width = `${progress * 100}%`;
      gifProgressText.textContent = `录制中... ${Math.round(progress * 100)}%`;

      // 检查是否需要继续捕获
      if (elapsedTime < duration) {
        // 继续捕获
        requestAnimationFrame(captureGifFrame);
      } else {
        // 停止录制
        stopGifRecording();
        startGifRecordingBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> 开始录制';
      }
    };

    img.src = screenshot;
  }

  /**
   * 停止GIF录制
   */
  function stopGifRecording() {
    if (!appState.gifExport.isRecording) return;

    // 停止录制
    appState.gifExport.exporter.stopRecording();

    // 更新状态
    appState.gifExport.isRecording = false;

    // 更新UI
    gifProgressText.textContent = '处理中...';
  }

  /**
   * 取消GIF录制
   */
  function cancelGifRecording() {
    if (!appState.gifExport.isRecording) return;

    // 取消录制
    appState.gifExport.exporter.cancelRecording();

    // 更新状态
    appState.gifExport.isRecording = false;

    // 更新UI
    startGifRecordingBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> 开始录制';
    gifProgressBar.style.width = '0%';
    gifProgressText.textContent = '已取消';
  }

  /**
   * 重置GIF导出状态
   */
  function resetGifExportState() {
    // 重置状态
    appState.gifExport.isRecording = false;
    appState.gifExport.currentBlob = null;

    // 重置UI
    startGifRecordingBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> 开始录制';
    downloadGifBtn.disabled = true;
    gifProgressBar.style.width = '0%';
    gifProgressText.textContent = '准备中...';

    // 重置预览
    gifPreviewContainer.innerHTML = `
      <div class="gif-placeholder">
        <i class="fas fa-film"></i>
        <span>GIF预览</span>
      </div>
    `;
  }

  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === shareModal) {
      shareModal.style.display = 'none';
    }
    if (e.target === permissionModal) {
      permissionModal.style.display = 'none';
    }
    if (e.target === gifModal) {
      gifModal.style.display = 'none';

      // 如果正在录制，取消录制
      if (appState.gifExport.isRecording) {
        cancelGifRecording();
      }
    }
  });

  // 窗口大小变化
  window.addEventListener('resize', handleResize);

  // 设置触摸交互
  setupTouchInteractions();

  // 初始化应用
  init();

  /**
   * 设置触摸交互
   */
  function setupTouchInteractions() {
    // 触摸开始
    sceneContainer.addEventListener('touchstart', handleTouchStart);
    sceneContainer.addEventListener('mousedown', handleTouchStart);

    // 触摸移动
    sceneContainer.addEventListener('touchmove', handleTouchMove);
    sceneContainer.addEventListener('mousemove', handleTouchMove);

    // 触摸结束
    sceneContainer.addEventListener('touchend', handleTouchEnd);
    sceneContainer.addEventListener('mouseup', handleTouchEnd);
    sceneContainer.addEventListener('mouseleave', handleTouchEnd);
  }

  /**
   * 处理触摸开始
   */
  function handleTouchStart(event) {
    // 如果控制面板展开，则不处理触摸事件
    if (appState.controlsExpanded) return;

    // 获取触摸位置
    const position = getTouchPosition(event);

    // 记录触摸状态
    appState.touchInteraction.isPressed = true;
    appState.touchInteraction.pressPosition = position;
    appState.touchInteraction.pressStartTime = Date.now();

    // 设置长按定时器
    appState.touchInteraction.pressTimer = setTimeout(() => {
      // 长按触发波纹效果
      createRippleEffect(position.x, position.y);
    }, appState.touchInteraction.longPressThreshold);
  }

  /**
   * 处理触摸移动
   */
  function handleTouchMove(event) {
    // 如果没有按下或控制面板展开，则不处理
    if (!appState.touchInteraction.isPressed || appState.controlsExpanded) return;

    // 获取当前触摸位置
    const position = getTouchPosition(event);

    // 计算移动距离
    const dx = position.x - appState.touchInteraction.pressPosition.x;
    const dy = position.y - appState.touchInteraction.pressPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果移动距离超过阈值，取消长按定时器
    if (distance > 10) {
      clearTimeout(appState.touchInteraction.pressTimer);

      // 创建拖动波纹效果
      createDragEffect(position.x, position.y, dx, dy);

      // 更新位置
      appState.touchInteraction.pressPosition = position;
    }
  }

  /**
   * 处理触摸结束
   */
  function handleTouchEnd(event) {
    // 如果没有按下或控制面板展开，则不处理
    if (!appState.touchInteraction.isPressed || appState.controlsExpanded) return;

    // 清除长按定时器
    clearTimeout(appState.touchInteraction.pressTimer);

    // 计算按下时长
    const pressDuration = Date.now() - appState.touchInteraction.pressStartTime;

    // 如果是短按（轻点），创建闪片爆发效果
    if (pressDuration < appState.touchInteraction.longPressThreshold) {
      const position = getTouchPosition(event);
      createParticleBurst(position.x, position.y);
    }

    // 重置触摸状态
    appState.touchInteraction.isPressed = false;
  }

  /**
   * 获取触摸位置
   */
  function getTouchPosition(event) {
    let x, y;

    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }

    // 转换为场景坐标 (-1 到 1)
    const rect = sceneContainer.getBoundingClientRect();
    const sceneX = ((x - rect.left) / rect.width) * 2 - 1;
    const sceneY = -((y - rect.top) / rect.height) * 2 + 1;

    return { x: sceneX, y: sceneY, clientX: x, clientY: y };
  }

  /**
   * 创建波纹效果（长按）
   */
  function createRippleEffect(x, y) {
    // 将屏幕坐标转换为场景坐标
    const strength = 0.5; // 波纹强度

    // 应用到流体模拟器
    fluidSimulator.createRipple(x, y, strength);
  }

  /**
   * 创建拖动效果
   */
  function createDragEffect(x, y, dx, dy) {
    // 计算拖动强度
    const dragStrength = Math.min(0.2, Math.sqrt(dx * dx + dy * dy) * 0.1);

    // 应用到流体模拟器
    fluidSimulator.applyForce(dx * 0.2, dy * 0.2, 0);

    // 创建小波纹
    fluidSimulator.createRipple(x, y, dragStrength * 0.3);
  }

  /**
   * 创建闪片爆发效果（轻点）
   */
  function createParticleBurst(x, y) {
    // 应用到粒子系统
    particleSystem.createBurst(x, y, 30); // 创建30个粒子的爆发
  }
});
