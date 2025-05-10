/**
 * 光影沙盘 WebGL - 主程序
 * 版本: 1.1.0
 * 创建日期: 2023-07-15
 * 使用Three.js实现高性能WebGL渲染
 */

// 应用状态
const appState = {
  isLoading: true,
  isInitialized: false,
  isMobile: isMobileDevice(),
  hasOrientationPermission: false,
  settings: {
    particleCount: 5000,
    particleSize: 2.5,
    glowIntensity: 0.8,
    gravity: 0.5,
    motionControlEnabled: true,
    vibrationEnabled: true,
    bloomEnabled: true,
    quality: 'medium'
  }
};

// 主要组件
let sandCanvas;
let particleSystem;
let sandRenderer;
let toolManager;

// DOM元素
let loadingOverlay;
let settingsPanel;
let permissionModal;
let saveModal;
let savePreviewImage;

// 动画帧ID
let animationFrameId;

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

/**
 * 初始化应用
 */
async function initApp() {
  console.log('初始化光影沙盘 WebGL v1.1.0');

  // 获取DOM元素
  sandCanvas = document.getElementById('sandCanvas');
  loadingOverlay = document.getElementById('loadingOverlay');
  settingsPanel = document.getElementById('settingsPanel');
  permissionModal = document.getElementById('permissionModal');
  saveModal = document.getElementById('saveModal');
  savePreviewImage = document.getElementById('savePreviewImage');

  // 检查设备类型
  if (appState.isMobile) {
    document.body.classList.add('mobile');
  }

  try {
    // 初始化粒子系统
    particleSystem = new SandParticleSystem({
      maxParticles: appState.settings.particleCount,
      particleSize: appState.settings.particleSize,
      gravity: appState.settings.gravity,
      width: window.innerWidth,
      height: window.innerHeight
    });

    // 初始化渲染器
    sandRenderer = new SandRenderer(sandCanvas, particleSystem, {
      quality: appState.settings.quality,
      glowIntensity: appState.settings.glowIntensity,
      bloomEnabled: appState.settings.bloomEnabled
    });

    // 初始化工具管理器
    toolManager = new ToolManager(particleSystem, document.body, {
      vibrationEnabled: appState.settings.vibrationEnabled
    });

    // 设置事件监听器
    setupEventListeners();

    // 请求设备方向权限（如果需要）
    if (supportsDeviceOrientation() && appState.settings.motionControlEnabled) {
      if (requiresOrientationPermission()) {
        showPermissionModal();
      } else {
        appState.hasOrientationPermission = true;
        setupOrientationControl();
      }
    }

    // 开始渲染循环
    sandRenderer.start();
    startAnimationLoop();

    // 创建初始沙粒
    createInitialSand();

    // 设置窗口大小调整处理
    window.addEventListener('resize', handleResize);

    // 标记初始化完成
    appState.isInitialized = true;

    // 隐藏加载界面
    setTimeout(() => {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        appState.isLoading = false;
      }, 500);
    }, 1000);

    console.log('光影沙盘 WebGL v1.1.0 初始化完成');
  } catch (error) {
    console.error('初始化应用失败:', error);
    showToast('初始化应用失败，请刷新页面重试');
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 设置面板
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', toggleSettings);
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', toggleSettings);
  }

  // 设置滑块
  setupSettingsControls();

  // 权限模态框
  const grantPermissionBtn = document.getElementById('grantPermissionBtn');
  const skipPermissionBtn = document.getElementById('skipPermissionBtn');

  if (grantPermissionBtn) {
    grantPermissionBtn.addEventListener('click', requestMotionPermission);
  }

  if (skipPermissionBtn) {
    skipPermissionBtn.addEventListener('click', () => {
      hidePermissionModal();
    });
  }

  // 保存模态框
  const saveBtn = document.getElementById('saveBtn');
  const closeSaveModalBtn = document.getElementById('closeSaveModalBtn');
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  const shareImageBtn = document.getElementById('shareImageBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', showSaveModal);
  }

  if (closeSaveModalBtn) {
    closeSaveModalBtn.addEventListener('click', hideSaveModal);
  }

  if (downloadImageBtn) {
    downloadImageBtn.addEventListener('click', downloadSandboxImage);
  }

  if (shareImageBtn) {
    shareImageBtn.addEventListener('click', shareSandboxImage);
  }
}

/**
 * 设置设置控件
 */
function setupSettingsControls() {
  // 粒子数量滑块
  const particleCountSlider = document.getElementById('particleCountSlider');
  const particleCountValue = document.getElementById('particleCountValue');

  if (particleCountSlider && particleCountValue) {
    particleCountSlider.value = appState.settings.particleCount;
    particleCountValue.textContent = appState.settings.particleCount;

    particleCountSlider.addEventListener('input', () => {
      const value = parseInt(particleCountSlider.value);
      particleCountValue.textContent = value;
      appState.settings.particleCount = value;
      particleSystem.setMaxParticles(value);
    });
  }

  // 粒子大小滑块
  const particleSizeSlider = document.getElementById('particleSizeSlider');
  const particleSizeValue = document.getElementById('particleSizeValue');

  if (particleSizeSlider && particleSizeValue) {
    particleSizeSlider.value = appState.settings.particleSize;
    particleSizeValue.textContent = appState.settings.particleSize;

    particleSizeSlider.addEventListener('input', () => {
      const value = parseFloat(particleSizeSlider.value);
      particleSizeValue.textContent = value;
      appState.settings.particleSize = value;
      particleSystem.setParticleSize(value);
    });
  }

  // 发光强度滑块
  const glowIntensitySlider = document.getElementById('glowIntensitySlider');
  const glowIntensityValue = document.getElementById('glowIntensityValue');

  if (glowIntensitySlider && glowIntensityValue) {
    glowIntensitySlider.value = appState.settings.glowIntensity * 100;
    glowIntensityValue.textContent = `${Math.round(appState.settings.glowIntensity * 100)}%`;

    glowIntensitySlider.addEventListener('input', () => {
      const value = parseInt(glowIntensitySlider.value) / 100;
      glowIntensityValue.textContent = `${Math.round(value * 100)}%`;
      appState.settings.glowIntensity = value;
      sandRenderer.setGlowIntensity(value);
    });
  }

  // 重力强度滑块
  const gravitySlider = document.getElementById('gravitySlider');
  const gravityValue = document.getElementById('gravityValue');

  if (gravitySlider && gravityValue) {
    gravitySlider.value = appState.settings.gravity * 100;
    gravityValue.textContent = `${Math.round(appState.settings.gravity * 100)}%`;

    gravitySlider.addEventListener('input', () => {
      const value = parseInt(gravitySlider.value) / 100;
      gravityValue.textContent = `${Math.round(value * 100)}%`;
      appState.settings.gravity = value;
      particleSystem.setGravityStrength(value);
    });
  }

  // 设备倾斜控制开关
  const motionControlToggle = document.getElementById('motionControlToggle');

  if (motionControlToggle) {
    motionControlToggle.checked = appState.settings.motionControlEnabled;

    motionControlToggle.addEventListener('change', () => {
      appState.settings.motionControlEnabled = motionControlToggle.checked;

      if (motionControlToggle.checked) {
        if (appState.hasOrientationPermission) {
          setupOrientationControl();
        } else if (requiresOrientationPermission()) {
          showPermissionModal();
        } else {
          appState.hasOrientationPermission = true;
          setupOrientationControl();
        }
      } else {
        removeOrientationControl();
      }
    });
  }

  // 振动反馈开关
  const vibrationToggle = document.getElementById('vibrationToggle');

  if (vibrationToggle) {
    vibrationToggle.checked = appState.settings.vibrationEnabled;

    vibrationToggle.addEventListener('change', () => {
      appState.settings.vibrationEnabled = vibrationToggle.checked;
      toolManager.setVibration(vibrationToggle.checked);
    });
  }

  // 高级光晕效果开关
  const bloomToggle = document.getElementById('bloomToggle');

  if (bloomToggle) {
    bloomToggle.checked = appState.settings.bloomEnabled;

    bloomToggle.addEventListener('change', () => {
      appState.settings.bloomEnabled = bloomToggle.checked;
      sandRenderer.setBloomEnabled(bloomToggle.checked);
    });
  }

  // 渲染质量选择
  const qualitySelect = document.getElementById('qualitySelect');

  if (qualitySelect) {
    qualitySelect.value = appState.settings.quality;

    qualitySelect.addEventListener('change', () => {
      appState.settings.quality = qualitySelect.value;
      sandRenderer.setQuality(qualitySelect.value);
    });
  }
}

/**
 * 创建初始沙粒
 */
function createInitialSand() {
  // 创建一些随机沙粒
  const { width, height } = particleSystem.bounds;
  const count = Math.min(500, appState.settings.particleCount / 2);

  for (let i = 0; i < count; i++) {
    const x = random(width * 0.1, width * 0.9);
    const y = random(height * 0.1, height * 0.9);
    const colorName = ['gold', 'blue', 'purple', 'green', 'red'][Math.floor(Math.random() * 5)];
    const colorInfo = toolManager.getColorInfo(colorName);

    // 添加一些随机的粒子类型
    const particleType = Math.random() < 0.2 ?
                        ['light', 'glowing', 'bouncy'][Math.floor(Math.random() * 3)] :
                        'normal';

    particleSystem.createParticle(x, y, {
      color: colorInfo.color,
      vx: random(-2, 2),
      vy: random(-2, 2),
      type: particleType
    });
  }
}

/**
 * 开始动画循环
 */
function startAnimationLoop() {
  const animate = (timestamp) => {
    if (!appState.isInitialized) return;

    // 计算时间步长
    const dt = Math.min(1 / 30, 1 / 1000 * 16.67); // 限制最大时间步长

    // 更新物理
    particleSystem.update(dt);

    // 渲染场景
    sandRenderer.render(timestamp);

    // 请求下一帧
    animationFrameId = requestAnimationFrame(animate);
  };

  // 开始动画循环
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * 停止动画循环
 */
function stopAnimationLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * 处理窗口大小调整
 */
function handleResize() {
  if (!appState.isInitialized) return;

  // 调整粒子系统边界
  particleSystem.resize(window.innerWidth, window.innerHeight);

  // 调整渲染器大小
  sandRenderer.resize();

  // 显示提示消息
  showToast('已调整沙盘大小');
}

/**
 * 切换设置面板
 */
function toggleSettings() {
  if (!settingsPanel) return;

  settingsPanel.classList.toggle('active');

  // 触发振动反馈
  if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
    navigator.vibrate(20);
  }
}

/**
 * 显示权限请求模态框
 */
function showPermissionModal() {
  if (!permissionModal) return;

  permissionModal.classList.add('active');
}

/**
 * 隐藏权限请求模态框
 */
function hidePermissionModal() {
  if (!permissionModal) return;

  permissionModal.classList.remove('active');
}

/**
 * 请求设备方向权限
 */
async function requestMotionPermission() {
  try {
    const granted = await requestOrientationPermission();

    if (granted) {
      appState.hasOrientationPermission = true;
      setupOrientationControl();
      hidePermissionModal();
      showToast('已获得设备方向权限');
    } else {
      showToast('未能获得设备方向权限');
    }
  } catch (error) {
    console.error('请求设备方向权限失败:', error);
    showToast('请求权限失败，请重试');
  }
}

/**
 * 设置设备方向控制
 */
function setupOrientationControl() {
  if (!appState.settings.motionControlEnabled) return;

  // 添加设备方向事件监听器
  window.addEventListener('deviceorientation', handleDeviceOrientation);

  // 显示提示消息
  showToast('已启用设备倾斜控制');
}

/**
 * 移除设备方向控制
 */
function removeOrientationControl() {
  // 移除设备方向事件监听器
  window.removeEventListener('deviceorientation', handleDeviceOrientation);

  // 重置重力方向
  particleSystem.setGravity(0, 1);

  // 显示提示消息
  showToast('已禁用设备倾斜控制');
}

/**
 * 处理设备方向变化
 * @param {DeviceOrientationEvent} event - 设备方向事件
 */
function handleDeviceOrientation(event) {
  if (!appState.isInitialized || !appState.settings.motionControlEnabled) return;

  // 获取设备倾斜角度
  const beta = event.beta;  // 前后倾斜 (-180 到 180)
  const gamma = event.gamma; // 左右倾斜 (-90 到 90)

  if (beta === null || gamma === null) return;

  // 将角度转换为重力方向
  const normalizedBeta = Math.max(-45, Math.min(45, beta)) / 45;
  const normalizedGamma = Math.max(-45, Math.min(45, gamma)) / 45;

  // 设置重力方向
  particleSystem.setGravity(normalizedGamma, normalizedBeta);
}

/**
 * 显示保存模态框
 */
function showSaveModal() {
  if (!saveModal || !sandRenderer || !savePreviewImage) return;

  // 创建快照
  const dataUrl = sandRenderer.createSnapshot();

  // 设置预览图像
  savePreviewImage.src = dataUrl;

  // 显示模态框
  saveModal.classList.add('active');
}

/**
 * 隐藏保存模态框
 */
function hideSaveModal() {
  if (!saveModal) return;

  saveModal.classList.remove('active');
}

/**
 * 下载沙盘图像
 */
function downloadSandboxImage() {
  if (!savePreviewImage) return;

  // 下载图像
  downloadImage(savePreviewImage.src, `微光沙盘_${new Date().toISOString().slice(0, 10)}.png`);

  // 显示提示消息
  showToast('图像已保存');
}

/**
 * 分享沙盘图像
 */
async function shareSandboxImage() {
  if (!savePreviewImage) return;

  try {
    // 将图像URL转换为Blob
    const response = await fetch(savePreviewImage.src);
    const blob = await response.blob();

    // 分享图像
    const success = await shareImage(
      blob,
      `微光沙盘_${new Date().toISOString().slice(0, 10)}.png`,
      '我在微光沙盘创作的作品'
    );

    if (success) {
      showToast('分享成功');
    }
  } catch (error) {
    console.error('分享失败:', error);
    showToast('分享失败，请重试');
  }
}
