/**
 * 微光沙盘 - 主程序
 */

// 应用状态
const appState = {
  isLoading: true,
  isInitialized: false,
  isMobile: isMobileDevice(),
  hasOrientationPermission: false,
  settings: {
    particleCount: 10000,
    particleSize: 3, // 增大默认粒子大小
    glowIntensity: 0.9, // 增强发光效果
    gravity: 0.5,
    motionControlEnabled: true,
    vibrationEnabled: true,
    soundEnabled: true,
    quality: 'high' // 默认使用高质量渲染
  }
};

// 主要组件
let sandCanvas;
let sandPhysics;
let sandRenderer;
let toolManager;
let audioManager;
let templateManager;

// DOM元素
let loadingOverlay;
let settingsPanel;
let permissionModal;
let saveModal;
let savePreviewCanvas;

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

/**
 * 初始化应用
 */
async function initApp() {
  console.log('初始化微光沙盘应用');

  // 获取DOM元素
  sandCanvas = document.getElementById('sandCanvas');
  loadingOverlay = document.getElementById('loadingOverlay');
  settingsPanel = document.getElementById('settingsPanel');
  permissionModal = document.getElementById('permissionModal');
  saveModal = document.getElementById('saveModal');
  savePreviewCanvas = document.getElementById('savePreviewCanvas');

  // 检查设备类型
  if (appState.isMobile) {
    document.body.classList.add('mobile');
  }

  try {
    // 初始化物理系统
    sandPhysics = new SandPhysics({
      maxParticles: appState.settings.particleCount,
      particleSize: appState.settings.particleSize,
      gravity: appState.settings.gravity
    });

    // 初始化渲染器
    sandRenderer = new SandRenderer(sandCanvas, sandPhysics, {
      quality: appState.settings.quality,
      glowIntensity: appState.settings.glowIntensity
    });

    // 初始化音频管理器
    audioManager = new AudioManager({
      enabled: appState.settings.soundEnabled
    });

    // 初始化工具管理器
    toolManager = new ToolManager(sandPhysics, document.body, {
      vibrationEnabled: appState.settings.vibrationEnabled,
      soundEnabled: appState.settings.soundEnabled
    });

    // 初始化模板管理器
    templateManager = new TemplateManager(sandPhysics);

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

    // 播放环境音效
    if (appState.settings.soundEnabled) {
      audioManager.playAmbientSound(true);
    }

    console.log('应用初始化完成');
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
    downloadImageBtn.addEventListener('click', downloadImage);
  }

  if (shareImageBtn) {
    shareImageBtn.addEventListener('click', shareImage);
  }

  // 模板按钮
  const templateButtons = document.querySelectorAll('.template-btn');
  templateButtons.forEach(button => {
    button.addEventListener('click', () => {
      const templateName = button.dataset.template;
      applyTemplate(templateName);
    });
  });
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
      sandPhysics.setMaxParticles(value);
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
      sandPhysics.setParticleSize(value);
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
      sandPhysics.setGravityStrength(value);
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

  // 音效开关
  const soundToggle = document.getElementById('soundToggle');

  if (soundToggle) {
    soundToggle.checked = appState.settings.soundEnabled;

    soundToggle.addEventListener('change', () => {
      appState.settings.soundEnabled = soundToggle.checked;
      audioManager.setEnabled(soundToggle.checked);
      toolManager.setSound(soundToggle.checked);

      if (soundToggle.checked) {
        audioManager.playAmbientSound(true);
      } else {
        audioManager.playAmbientSound(false);
      }
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
  const { width, height } = sandPhysics.bounds;
  const count = Math.min(1000, appState.settings.particleCount / 2); // 增加初始粒子数量

  for (let i = 0; i < count; i++) {
    const x = random(width * 0.1, width * 0.9); // 扩大分布范围
    const y = random(height * 0.1, height * 0.9); // 扩大分布范围
    const colorName = ['gold', 'blue', 'purple', 'green', 'red'][Math.floor(Math.random() * 5)];
    const colorInfo = toolManager.getColorInfo(colorName);

    // 添加一些随机的粒子类型
    const particleType = Math.random() < 0.2 ?
                        ['light', 'glowing', 'bouncy'][Math.floor(Math.random() * 3)] :
                        'normal';

    sandPhysics.createParticle(x, y, {
      color: colorInfo.color,
      glow: colorInfo.glow * 1.2, // 增强发光效果
      vx: random(-2, 2), // 增加初始速度
      vy: random(-2, 2), // 增加初始速度
      type: particleType
    });
  }
}

/**
 * 处理窗口大小调整
 */
function handleResize() {
  if (!appState.isInitialized) return;

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

  // 播放音效
  if (appState.settings.soundEnabled) {
    audioManager.playUISound('switch');
  }

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
  addDeviceOrientationListener(handleDeviceOrientation);

  // 显示提示消息
  showToast('已启用设备倾斜控制');
}

/**
 * 移除设备方向控制
 */
function removeOrientationControl() {
  // 移除设备方向事件监听器
  removeDeviceOrientationListener(handleDeviceOrientation);

  // 重置重力方向
  sandPhysics.setGravity(0, 1);

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
  sandPhysics.setGravity(normalizedGamma, normalizedBeta);
}

/**
 * 应用模板
 * @param {string} templateName - 模板名称
 */
function applyTemplate(templateName) {
  if (!templateManager) return;

  // 应用模板
  const particleCount = templateManager.applyTemplate(templateName);

  // 播放音效
  if (appState.settings.soundEnabled) {
    audioManager.playUISound('confirm');
  }

  // 触发振动反馈
  if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
    navigator.vibrate([20, 30, 20]);
  }

  // 显示提示消息
  const templateInfo = templateManager.getTemplateInfo(templateName);
  showToast(`已应用${templateInfo ? templateInfo.name : templateName}模板，创建了${particleCount}个粒子`);
}

/**
 * 显示保存模态框
 */
function showSaveModal() {
  if (!saveModal || !sandRenderer || !savePreviewCanvas) return;

  // 创建快照
  const snapshot = sandRenderer.createSnapshot();

  // 设置预览画布大小
  savePreviewCanvas.width = snapshot.width;
  savePreviewCanvas.height = snapshot.height;

  // 绘制快照到预览画布
  const ctx = savePreviewCanvas.getContext('2d');
  ctx.drawImage(snapshot, 0, 0);

  // 显示模态框
  saveModal.classList.add('active');

  // 播放音效
  if (appState.settings.soundEnabled) {
    audioManager.playUISound('confirm');
  }
}

/**
 * 隐藏保存模态框
 */
function hideSaveModal() {
  if (!saveModal) return;

  saveModal.classList.remove('active');

  // 播放音效
  if (appState.settings.soundEnabled) {
    audioManager.playUISound('click');
  }
}

/**
 * 下载图像
 */
function downloadImage() {
  if (!savePreviewCanvas) return;

  // 创建下载链接
  const dataUrl = savePreviewCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `微光沙盘_${new Date().toISOString().slice(0, 10)}.png`;

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 播放音效
  if (appState.settings.soundEnabled) {
    audioManager.playUISound('confirm');
  }

  // 显示提示消息
  showToast('图像已保存');
}

/**
 * 分享图像
 */
async function shareImage() {
  if (!savePreviewCanvas || !navigator.share) {
    showToast('您的浏览器不支持分享功能');
    return;
  }

  try {
    // 将画布转换为Blob
    const blob = await new Promise(resolve => {
      savePreviewCanvas.toBlob(resolve, 'image/png');
    });

    // 创建文件对象
    const file = new File([blob], `微光沙盘_${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' });

    // 分享文件
    await navigator.share({
      title: '微光沙盘作品',
      text: '我在微光沙盘创作的作品',
      files: [file]
    });

    // 显示提示消息
    showToast('分享成功');
  } catch (error) {
    console.error('分享失败:', error);
    showToast('分享失败，请重试');
  }
}

/**
 * 主循环
 * 每帧更新物理和渲染
 * @param {number} timestamp - 时间戳
 */
function mainLoop(timestamp) {
  if (!appState.isInitialized) return;

  // 计算时间步长
  const dt = Math.min(1 / 30, 1 / 1000 * 16.67); // 限制最大时间步长

  // 更新物理
  sandPhysics.update(dt);

  // 请求下一帧
  requestAnimationFrame(mainLoop);
}

// 启动主循环
requestAnimationFrame(mainLoop);
