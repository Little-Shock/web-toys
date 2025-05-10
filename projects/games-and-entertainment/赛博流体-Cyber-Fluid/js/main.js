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
  const tipsContainer = document.getElementById('tipsContainer');
  const closeTipsBtn = document.getElementById('closeTipsBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = shareModal.querySelector('.close-modal');
  const permissionModal = document.getElementById('permissionModal');
  const grantPermissionBtn = document.getElementById('grantPermissionBtn');
  const skipPermissionBtn = document.getElementById('skipPermissionBtn');

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
    isMobile: isMobileDevice(),
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

      // 设置交互事件
      setupInteractions();

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
      // 创建默认纹理
      const imageTexture = imageProcessor.createDefaultTexture();

      // 设置为当前图像
      appState.currentImage = 'default';

      // 应用到流体模拟器
      fluidSimulator.setBaseTexture(imageTexture);

      // 高亮默认图像预设
      document.querySelector('.preset-image[data-image="default"]')?.classList.add('active');
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

      // 应用到流体模拟器
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
   * 设置交互事件
   */
  function setupInteractions() {
    // 添加点击检测
    addTapDetection(sceneContainer, (position) => {
      // 单击 - 创建粒子爆发
      particleSystem.createBurst(position.x, position.y, 50);
    });

    // 添加长按检测
    addLongPressDetection(sceneContainer, (position) => {
      // 长按 - 创建波纹效果
      fluidSimulator.createRipple(position.x, position.y, 0.8);
    });

    // 添加拖动检测
    addDragDetection(
      sceneContainer,
      (deltaX, deltaY, position) => {
        // 拖动中 - 应用力
        fluidSimulator.applyForce(deltaX * 2, deltaY * 2, 0);
        particleSystem.applyForce(deltaX, deltaY, 0);
      },
      (position) => {
        // 开始拖动
        console.log('开始拖动', position);
      },
      (position) => {
        // 结束拖动
        console.log('结束拖动', position);
      }
    );

    // 窗口大小变化
    window.addEventListener('resize', handleResize);
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
    appState.isMobile = isMobileDevice();

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
      const imagePath = `assets/presets/${imageName}.jpg`;
      imageProcessor.loadImage(imagePath).then(texture => {
        fluidSimulator.setBaseTexture(texture);
        appState.currentImage = imagePath;
      }).catch(error => {
        console.error('加载预设图像失败:', error);
        // 使用默认纹理
        const defaultTexture = imageProcessor.createDefaultTexture();
        fluidSimulator.setBaseTexture(defaultTexture);
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
  Object.keys(sliders).forEach(key => {
    sliders[key].addEventListener('input', () => {
      // 更新显示的值
      const display = sliders[key].nextElementSibling;
      if (display) {
        display.textContent = `${sliders[key].value}%`;
      }
    });

    sliders[key].addEventListener('change', updateParametersFromUI);
  });

  // 颜色控制
  Object.keys(colorInputs).forEach(key => {
    colorInputs[key].addEventListener('change', updateParametersFromUI);
  });

  // 重置按钮
  resetBtn.addEventListener('click', resetApp);

  // 分享按钮
  shareBtn.addEventListener('click', () => {
    shareModal.style.display = 'block';
  });

  // 全屏按钮
  fullscreenBtn.addEventListener('click', enterFullscreen);

  // 关闭提示
  closeTipsBtn.addEventListener('click', () => {
    tipsContainer.style.opacity = '0';
    tipsContainer.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      tipsContainer.style.display = 'none';
    }, 500);
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

  // 设备方向权限按钮
  grantPermissionBtn.addEventListener('click', async () => {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission === 'granted') {
        setupDeviceMotion();
      }
    } catch (error) {
      console.error('请求设备方向权限失败:', error);
    }
    permissionModal.style.display = 'none';
  });

  skipPermissionBtn.addEventListener('click', () => {
    permissionModal.style.display = 'none';
  });

  // 点击模态框外部关闭
  window.addEventListener('click', (event) => {
    if (event.target === shareModal) {
      shareModal.style.display = 'none';
    }
    if (event.target === permissionModal) {
      permissionModal.style.display = 'none';
    }
  });

  // 初始化应用
  init();
});
