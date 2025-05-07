/**
 * 电子木鱼 - 主程序
 */
document.addEventListener('DOMContentLoaded', () => {
  // 应用状态 - 使用window对象使其全局可访问
  window.appState = {
    meritCount: 0,
    isInitialized: false,
    isLoading: true,
    settings: {
      volume: 0.7,
      soundEnabled: true,
      particleEnabled: true,
      textEnabled: true,
      vibrationEnabled: true,
      soundStyle: 0,       // 0=传统, 1=现代, 2=电子
      particleStyle: 1,    // 0=简约, 1=标准, 2=华丽
      textStyle: 0,        // 0=传统, 1=现代, 2=游戏
      qualityLevel: 1      // 0=低, 1=中, 2=高
    }
  };

  // DOM元素
  const elements = {
    tapArea: document.getElementById('tapArea'),
    fishImage: document.querySelector('.fish-image'),
    fishWrapper: document.querySelector('.fish-wrapper'),
    characterImage: document.querySelector('.character-image'),
    meritCounter: document.getElementById('meritCounter'),
    comboDisplay: document.getElementById('comboDisplay'),
    comboCounter: document.getElementById('comboCounter'),
    comboLabel: document.getElementById('comboLabel'),
    textAnimationContainer: document.getElementById('textAnimationContainer'),
    particleCanvas: document.getElementById('particleCanvas'),
    settingsPanel: document.getElementById('settingsPanel'),
    uploadPanel: document.getElementById('uploadPanel'),
    overlay: document.getElementById('overlay'),
    uploadArea: document.getElementById('uploadArea'),
    imagePreview: document.getElementById('imagePreview'),
    imageInput: document.getElementById('imageInput')
  };

  // 按钮元素
  const buttons = {
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    closeUploadBtn: document.getElementById('closeUploadBtn'),
    confirmUploadBtn: document.getElementById('confirmUploadBtn'),
    cancelUploadBtn: document.getElementById('cancelUploadBtn'),
    resetBtn: document.getElementById('resetBtn')
  };

  // 设置控件
  const controls = {
    volumeSlider: document.getElementById('volumeSlider'),
    soundToggle: document.getElementById('soundToggle'),
    particleToggle: document.getElementById('particleToggle'),
    textToggle: document.getElementById('textToggle'),
    vibrationToggle: document.getElementById('vibrationToggle'),
    soundStyleSelect: document.getElementById('soundStyleSelect'),
    particleStyleSelect: document.getElementById('particleStyleSelect'),
    textStyleSelect: document.getElementById('textStyleSelect'),
    qualitySelect: document.getElementById('qualitySelect')
  };

  // 核心组件
  let audioManager;
  let particleSystem;
  let comboSystem;
  let imageProcessor;

  // 检测设备类型和性能
  const { isMobile, isIOS, isLowEndDevice } = detectDevice();

  // 初始化应用
  async function initApp() {
    try {
      // 初始化音频管理器
      audioManager = new AudioManager();

      // 初始化粒子系统
      particleSystem = new ParticleSystem(elements.particleCanvas);

      // 初始化连击系统
      comboSystem = new ComboSystem();

      // 初始化图像处理器
      imageProcessor = new ImageProcessor();

      // 设置连击系统回调
      comboSystem.setOnComboChange(handleComboChange);
      comboSystem.setOnComboEnd(handleComboEnd);
      comboSystem.setOnComboMilestone(handleComboMilestone);

      // 加载设置
      loadSettings();

      // 应用设置
      applySettings();

      // 加载默认角色图像
      await loadDefaultCharacterImage();

      // 设置事件监听器
      setupEventListeners();

      // 初始化完成
      appState.isInitialized = true;
      appState.isLoading = false;

      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  }

  /**
   * 加载默认角色图像
   */
  async function loadDefaultCharacterImage() {
    try {
      // 等待图像处理器初始化完成
      while (!imageProcessor.getDefaultImage()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 设置默认图像
      const defaultImage = imageProcessor.getDefaultImage();
      elements.characterImage.style.backgroundImage = `url(${defaultImage})`;
    } catch (error) {
      console.error('加载默认角色图像失败:', error);
    }
  }

  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 敲击区域事件
    elements.tapArea.addEventListener('click', handleTap);
    elements.tapArea.addEventListener('touchstart', handleTap, { passive: true });

    // 设置按钮事件
    buttons.settingsBtn.addEventListener('click', openSettingsPanel);
    buttons.closeSettingsBtn.addEventListener('click', closeSettingsPanel);

    // 上传按钮事件
    buttons.uploadBtn.addEventListener('click', openUploadPanel);
    buttons.closeUploadBtn.addEventListener('click', closeUploadPanel);
    buttons.confirmUploadBtn.addEventListener('click', confirmUpload);
    buttons.cancelUploadBtn.addEventListener('click', closeUploadPanel);

    // 重置按钮事件
    buttons.resetBtn.addEventListener('click', resetApp);

    // 上传区域事件
    elements.uploadArea.addEventListener('click', triggerFileInput);
    elements.imageInput.addEventListener('change', handleImageSelect);

    // 拖放事件
    setupDragAndDrop();

    // 设置控件事件
    controls.volumeSlider.addEventListener('input', handleVolumeChange);
    controls.soundToggle.addEventListener('change', handleSoundToggle);
    controls.particleToggle.addEventListener('change', handleParticleToggle);
    controls.textToggle.addEventListener('change', handleTextToggle);
    controls.vibrationToggle.addEventListener('change', handleVibrationToggle);
    controls.soundStyleSelect.addEventListener('change', handleSoundStyleChange);
    controls.particleStyleSelect.addEventListener('change', handleParticleStyleChange);
    controls.textStyleSelect.addEventListener('change', handleTextStyleChange);
    controls.qualitySelect.addEventListener('change', handleQualityChange);

    // 遮罩层点击事件
    elements.overlay.addEventListener('click', closeAllPanels);
  }

  /**
   * 设置拖放功能
   */
  function setupDragAndDrop() {
    const uploadArea = elements.uploadArea;

    // 阻止默认拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 高亮拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      uploadArea.classList.add('highlight');
    }

    function unhighlight() {
      uploadArea.classList.remove('highlight');
    }

    // 处理拖放
    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        handleFiles(files);
      }
    }
  }

  /**
   * 处理敲击事件
   * @param {Event} e - 事件对象
   */
  function handleTap(e) {
    if (!appState.isInitialized || appState.isLoading) return;

    // 阻止默认行为
    if (e.type === 'touchstart') {
      // 对于触摸事件，不阻止默认行为，以保持滚动功能
      // 但我们需要防止多次触发
      if (e.touches.length > 1) return;
    } else {
      e.preventDefault();
    }

    // 获取点击/触摸位置
    let x, y;
    if (e.type === 'touchstart') {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }

    // 计算相对于窗口的位置 (0-1)
    const relX = x / window.innerWidth;
    const relY = y / window.innerHeight;

    // 计算敲击强度 (随机化以增加变化)
    const baseIntensity = 0.7;
    const randomFactor = 0.3;
    const intensity = baseIntensity + Math.random() * randomFactor;

    // 播放敲击音效
    if (appState.settings.soundEnabled) {
      audioManager.playTapSound(relX, relY, intensity);
    }

    // 添加敲击动画
    animateTap(intensity);

    // 创建粒子效果
    if (appState.settings.particleEnabled) {
      particleSystem.createTapEffect(relX, relY, intensity);
    }

    // 增加功德计数
    incrementMeritCount();

    // 记录连击
    const tapResult = comboSystem.recordTap(intensity);

    // 显示文字动画
    if (appState.settings.textEnabled) {
      showTextAnimation(relX, relY);
    }

    // 处理连击效果
    if (tapResult.isCombo) {
      // 播放连击音效
      if (appState.settings.soundEnabled) {
        audioManager.playComboSound(tapResult.combo, relX, relY);
      }

      // 创建连击粒子效果
      if (appState.settings.particleEnabled) {
        particleSystem.createComboEffect(relX, relY, tapResult.combo);
      }

      // 显示连击文本
      if (appState.settings.textEnabled) {
        showComboText(relX, relY, tapResult.combo);
      }
    }

    // 处理里程碑
    if (tapResult.milestone) {
      // 播放里程碑音效
      if (appState.settings.soundEnabled) {
        const milestoneLevel = getMilestoneLevelFromValue(tapResult.milestone);
        audioManager.playMilestoneSound(milestoneLevel);
      }

      // 创建里程碑粒子效果
      if (appState.settings.particleEnabled) {
        const milestoneLevel = getMilestoneLevelFromValue(tapResult.milestone);
        particleSystem.createMilestoneEffect(relX, relY, milestoneLevel);
      }

      // 显示里程碑文本
      if (appState.settings.textEnabled) {
        showMilestoneText(relX, relY, tapResult.milestone);
      }

      // 振动反馈
      if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
        const pattern = [30, 50, 30];
        navigator.vibrate(pattern);
      }
    } else if (tapResult.isCombo && tapResult.combo % 10 === 0) {
      // 每10次连击提供振动反馈
      if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  }

  /**
   * 增加功德计数
   */
  function incrementMeritCount() {
    // 基础增加值
    let increment = 1;

    // 根据连击数增加奖励
    const combo = comboSystem.combo;
    if (combo > 1) {
      // 连击奖励公式：基础值 + 连击数的平方根
      increment += Math.floor(Math.sqrt(combo));
    }

    // 增加功德计数
    appState.meritCount += increment;

    // 更新显示
    updateMeritCounter();

    // 保存状态
    saveAppState();

    return increment;
  }

  /**
   * 更新功德计数器显示
   */
  function updateMeritCounter() {
    elements.meritCounter.textContent = formatNumber(appState.meritCount);

    // 添加动画效果
    elements.meritCounter.classList.remove('pulse');
    void elements.meritCounter.offsetWidth; // 触发重排
    elements.meritCounter.classList.add('pulse');
  }

  /**
   * 处理连击变化
   * @param {number} combo - 当前连击数
   */
  function handleComboChange(combo) {
    // 更新连击显示
    elements.comboCounter.textContent = combo;

    // 显示/隐藏连击显示
    if (combo > 1) {
      elements.comboDisplay.classList.add('active');

      // 获取连击等级
      const rank = comboSystem.getComboRank();

      // 更新连击标签
      elements.comboLabel.textContent = rank.rank;
      elements.comboLabel.style.color = rank.color;
    } else {
      elements.comboDisplay.classList.remove('active');
    }
  }

  /**
   * 处理连击结束
   * @param {number} finalCombo - 最终连击数
   */
  function handleComboEnd(finalCombo) {
    console.log(`连击结束: ${finalCombo}`);
  }

  /**
   * 处理连击里程碑
   * @param {number} milestone - 里程碑值
   */
  function handleComboMilestone(milestone) {
    console.log(`达成里程碑: ${milestone}`);
  }

  /**
   * 从里程碑值获取级别
   * @param {number} value - 里程碑值
   * @returns {number} 里程碑级别 (0-2)
   */
  function getMilestoneLevelFromValue(value) {
    if (value >= 100) return 2;
    if (value >= 50) return 1;
    return 0;
  }

  /**
   * 显示文字动画
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   */
  function showTextAnimation(x, y) {
    // 获取文本内容
    const text = getRandomPositiveText();

    // 根据文字风格选择不同的显示方式
    switch (appState.settings.textStyle) {
      case 0: // 传统风格
        showTraditionalText(x, y, text);
        break;
      case 1: // 现代风格
        showModernText(x, y, text);
        break;
      case 2: // 游戏风格
        showGameText(x, y, text);
        break;
      default:
        showTraditionalText(x, y, text);
    }
  }

  /**
   * 显示传统风格文字
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {string} text - 文字内容
   */
  function showTraditionalText(x, y, text) {
    // 创建文字元素
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;

    // 设置位置
    const posX = x * window.innerWidth;
    const posY = y * window.innerHeight;
    textElement.style.left = `${posX}px`;
    textElement.style.top = `${posY}px`;

    // 随机化大小和颜色
    const size = 16 + Math.random() * 8;
    textElement.style.fontSize = `${size}px`;

    // 传统金黄色
    const hue = 40 + Math.random() * 20;
    const saturation = 80 + Math.random() * 20;
    const lightness = 70 + Math.random() * 20;
    textElement.style.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // 添加到容器
    elements.textAnimationContainer.appendChild(textElement);

    // 设置自动移除
    setTimeout(() => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
    }, 2000);
  }

  /**
   * 显示现代风格文字
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {string} text - 文字内容
   */
  function showModernText(x, y, text) {
    // 创建文字元素
    const textElement = document.createElement('div');
    textElement.className = 'floating-text modern-text';
    textElement.textContent = text;

    // 设置位置 - 随机偏移
    const offsetX = random(-20, 20);
    const offsetY = random(-10, 10);
    const posX = x * window.innerWidth + offsetX;
    const posY = y * window.innerHeight + offsetY;
    textElement.style.left = `${posX}px`;
    textElement.style.top = `${posY}px`;

    // 现代风格 - 更大的字体，白色带阴影
    const size = 18 + Math.random() * 10;
    textElement.style.fontSize = `${size}px`;
    textElement.style.color = 'white';
    textElement.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
    textElement.style.fontWeight = '300';

    // 添加到容器
    elements.textAnimationContainer.appendChild(textElement);

    // 设置自动移除
    setTimeout(() => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
    }, 2000);
  }

  /**
   * 显示游戏风格文字
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {string} text - 文字内容
   */
  function showGameText(x, y, text) {
    // 创建文字元素
    const textElement = document.createElement('div');
    textElement.className = 'floating-text game-text';

    // 添加+1效果
    const valueElement = document.createElement('span');
    valueElement.className = 'game-value';
    valueElement.textContent = '+1';

    // 添加文本
    const textSpan = document.createElement('span');
    textSpan.className = 'game-label';
    textSpan.textContent = text;

    textElement.appendChild(valueElement);
    textElement.appendChild(textSpan);

    // 设置位置 - 随机偏移
    const offsetX = random(-30, 30);
    const posX = x * window.innerWidth + offsetX;
    const posY = y * window.innerHeight - 20;
    textElement.style.left = `${posX}px`;
    textElement.style.top = `${posY}px`;

    // 游戏风格 - 鲜艳的颜色
    const colors = [
      '#ff7675', // 粉红
      '#74b9ff', // 蓝色
      '#55efc4', // 绿色
      '#ffeaa7', // 黄色
      '#a29bfe'  // 紫色
    ];
    const color = randomChoice(colors);
    valueElement.style.color = color;
    valueElement.style.textShadow = `0 0 5px ${color}`;

    // 添加到容器
    elements.textAnimationContainer.appendChild(textElement);

    // 设置自动移除
    setTimeout(() => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
    }, 2000);
  }

  /**
   * 显示连击文本
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} combo - 连击数
   */
  function showComboText(x, y, combo) {
    // 获取连击文本
    const comboText = comboSystem.getComboText();
    if (!comboText) return;

    // 创建文字元素
    const textElement = document.createElement('div');
    textElement.className = 'dmc-combo combo-text';
    textElement.textContent = comboText;

    // 设置位置 - 随机偏移以避免重叠
    const offsetX = random(-30, 30);
    const offsetY = random(-20, 0);
    const posX = x * window.innerWidth + offsetX;
    const posY = y * window.innerHeight - 30 + offsetY;
    textElement.style.left = `${posX}px`;
    textElement.style.top = `${posY}px`;

    // 设置大小和颜色
    const size = 18 + Math.min(8, combo / 10);
    textElement.style.fontSize = `${size}px`;

    // 获取连击等级
    const rank = comboSystem.getComboRank();
    textElement.style.color = rank.color;

    // 添加到容器
    elements.textAnimationContainer.appendChild(textElement);

    // 设置自动移除
    setTimeout(() => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
    }, 2000);
  }

  /**
   * 显示里程碑文本
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} milestone - 里程碑值
   */
  function showMilestoneText(x, y, milestone) {
    // 创建DMC风格的连击效果
    const dmcElement = document.createElement('div');
    dmcElement.className = 'dmc-combo milestone-text';

    // 获取连击等级
    const rank = comboSystem.getComboRank();

    // 设置文本和样式
    dmcElement.innerHTML = `<span class="rank-text">${rank.rank}</span><span class="rank-label">RANK!</span>`;
    dmcElement.style.color = rank.color;
    dmcElement.style.fontSize = `${36 + Math.min(24, milestone / 20)}px`;

    // 添加特殊效果
    if (milestone >= 100) {
      dmcElement.style.textShadow = `3px 3px 0 rgba(0, 0, 0, 0.7),
                                     0 0 10px ${rank.color},
                                     0 0 20px ${rank.color},
                                     0 0 30px ${rank.color}`;
    }

    // 设置位置 - 居中显示
    const posX = window.innerWidth / 2;
    const posY = window.innerHeight / 2 - 50;
    dmcElement.style.left = `${posX}px`;
    dmcElement.style.top = `${posY}px`;
    dmcElement.style.transform = 'translate(-50%, -50%)';

    // 添加到容器
    elements.textAnimationContainer.appendChild(dmcElement);

    // 设置自动移除
    setTimeout(() => {
      if (dmcElement.parentNode) {
        dmcElement.parentNode.removeChild(dmcElement);
      }
    }, 2500);
  }

  /**
   * 动画敲击效果
   * @param {number} intensity - 敲击强度
   */
  function animateTap(intensity) {
    // 移除之前的动画类
    elements.fishWrapper.classList.remove('tap-animation');

    // 触发重排
    void elements.fishWrapper.offsetWidth;

    // 添加动画类
    elements.fishWrapper.classList.add('tap-animation');

    // 根据强度调整动画
    elements.fishWrapper.style.transform = `scale(${1 - intensity * 0.05})`;

    // 重置变换
    setTimeout(() => {
      elements.fishWrapper.style.transform = '';
    }, 200);
  }

  /**
   * 打开设置面板
   */
  function openSettingsPanel() {
    elements.settingsPanel.classList.add('active');
    elements.overlay.classList.add('active');

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('click');
    }
  }

  /**
   * 关闭设置面板
   */
  function closeSettingsPanel() {
    elements.settingsPanel.classList.remove('active');
    elements.overlay.classList.remove('active');

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('click');
    }

    // 保存设置
    saveSettings();
  }

  /**
   * 打开上传面板
   */
  function openUploadPanel() {
    elements.uploadPanel.classList.add('active');
    elements.overlay.classList.add('active');

    // 重置预览
    elements.imagePreview.style.backgroundImage = '';
    elements.imagePreview.classList.remove('active');
    elements.uploadArea.classList.remove('has-image');

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('click');
    }
  }

  /**
   * 关闭上传面板
   */
  function closeUploadPanel() {
    elements.uploadPanel.classList.remove('active');
    elements.overlay.classList.remove('active');

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('click');
    }
  }

  /**
   * 关闭所有面板
   */
  function closeAllPanels() {
    elements.settingsPanel.classList.remove('active');
    elements.uploadPanel.classList.remove('active');
    elements.overlay.classList.remove('active');
  }

  /**
   * 触发文件输入
   */
  function triggerFileInput() {
    elements.imageInput.click();
  }

  /**
   * 处理图像选择
   * @param {Event} e - 事件对象
   */
  function handleImageSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  /**
   * 处理文件
   * @param {FileList} files - 文件列表
   */
  async function handleFiles(files) {
    const file = files[0];

    // 检查文件类型
    if (!file.type.match('image.*')) {
      alert('请选择图片文件');
      return;
    }

    try {
      console.log('开始处理图像...');

      // 显示加载状态
      elements.uploadArea.classList.add('loading');
      elements.uploadArea.innerHTML += '<div class="upload-loading">处理中...</div>';

      // 处理图像
      const processedImage = await imageProcessor.processImageFile(file);
      console.log('图像处理完成');

      // 移除加载状态
      elements.uploadArea.classList.remove('loading');
      const loadingEl = elements.uploadArea.querySelector('.upload-loading');
      if (loadingEl) loadingEl.remove();

      // 显示预览
      elements.imagePreview.style.backgroundImage = `url(${processedImage})`;
      elements.imagePreview.classList.add('active');
      elements.uploadArea.classList.add('has-image');

      // 保存到临时变量，以便确认时使用
      window.tempProcessedImage = processedImage;

      console.log('预览已更新');
    } catch (error) {
      console.error('处理图像失败:', error);
      alert('处理图像失败，请重试');

      // 移除加载状态
      elements.uploadArea.classList.remove('loading');
      const loadingEl = elements.uploadArea.querySelector('.upload-loading');
      if (loadingEl) loadingEl.remove();
    }
  }

  /**
   * 确认上传
   */
  function confirmUpload() {
    try {
      // 检查是否有预览图像
      if (!elements.imagePreview.classList.contains('active')) {
        alert('请先选择一张图片');
        return;
      }

      // 使用临时存储的处理后图像
      const processedImage = window.tempProcessedImage;

      if (processedImage) {
        console.log('确认上传图像');

        // 设置角色图像
        elements.characterImage.style.backgroundImage = `url(${processedImage})`;

        // 更新图像处理器中的当前图像
        imageProcessor.processedImage = processedImage;

        // 关闭上传面板
        closeUploadPanel();

        // 播放UI音效
        if (appState.settings.soundEnabled) {
          audioManager.playUISound('click');
        }

        // 振动反馈
        if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
          navigator.vibrate(20);
        }

        // 保存应用状态
        saveAppState();

        console.log('角色图片已更新');
      } else {
        console.error('未找到处理后的图像');
        alert('图像处理失败，请重试');
      }
    } catch (error) {
      console.error('确认上传失败:', error);
      alert('上传失败，请重试');
    }
  }

  /**
   * 重置应用
   */
  function resetApp() {
    // 确认重置
    if (confirm('确定要重置应用吗？这将清除所有功德计数和设置。')) {
      // 重置功德计数
      appState.meritCount = 0;
      updateMeritCounter();

      // 重置连击
      comboSystem.resetCombo();

      // 重置角色图像
      const defaultImage = imageProcessor.resetToDefault();
      elements.characterImage.style.backgroundImage = `url(${defaultImage})`;

      // 播放UI音效
      if (appState.settings.soundEnabled) {
        audioManager.playUISound('click');
      }

      // 保存应用状态
      saveAppState();

      // 振动反馈
      if (appState.settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
    }
  }

  /**
   * 处理音量变化
   */
  function handleVolumeChange() {
    const volume = controls.volumeSlider.value / 100;
    appState.settings.volume = volume;

    // 设置音频管理器音量
    if (audioManager) {
      audioManager.setVolume(volume);
    }
  }

  /**
   * 处理音效开关
   */
  function handleSoundToggle() {
    const enabled = controls.soundToggle.checked;
    appState.settings.soundEnabled = enabled;

    // 设置音频管理器启用状态
    if (audioManager) {
      audioManager.setEnabled(enabled);
    }
  }

  /**
   * 处理粒子效果开关
   */
  function handleParticleToggle() {
    const enabled = controls.particleToggle.checked;
    appState.settings.particleEnabled = enabled;

    // 设置粒子系统启用状态
    if (particleSystem) {
      particleSystem.setEnabled(enabled);
    }
  }

  /**
   * 处理文字动画开关
   */
  function handleTextToggle() {
    const enabled = controls.textToggle.checked;
    appState.settings.textEnabled = enabled;
  }

  /**
   * 处理振动反馈开关
   */
  function handleVibrationToggle() {
    const enabled = controls.vibrationToggle.checked;
    appState.settings.vibrationEnabled = enabled;
  }

  /**
   * 处理音效风格变化
   */
  function handleSoundStyleChange() {
    const style = parseInt(controls.soundStyleSelect.value);
    appState.settings.soundStyle = style;

    // 更新音频管理器的音效风格
    if (audioManager) {
      audioManager.soundStyle = style;
    }

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('toggle');
    }
  }

  /**
   * 处理粒子风格变化
   */
  function handleParticleStyleChange() {
    const style = parseInt(controls.particleStyleSelect.value);
    appState.settings.particleStyle = style;

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('toggle');
    }
  }

  /**
   * 处理文字风格变化
   */
  function handleTextStyleChange() {
    const style = parseInt(controls.textStyleSelect.value);
    appState.settings.textStyle = style;

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('toggle');
    }
  }

  /**
   * 处理画面质量变化
   */
  function handleQualityChange() {
    const quality = parseInt(controls.qualitySelect.value);
    appState.settings.qualityLevel = quality;

    // 更新粒子系统的质量级别
    if (particleSystem) {
      particleSystem.params.qualityLevel = quality;
    }

    // 播放UI音效
    if (appState.settings.soundEnabled) {
      audioManager.playUISound('toggle');
    }
  }

  /**
   * 加载设置
   */
  function loadSettings() {
    try {
      // 从本地存储加载设置
      const savedSettings = loadFromLocalStorage('woodenFishSettings');
      if (savedSettings) {
        appState.settings = { ...appState.settings, ...savedSettings };
      }

      // 从本地存储加载应用状态
      const savedState = loadFromLocalStorage('woodenFishState');
      if (savedState && savedState.meritCount !== undefined) {
        appState.meritCount = savedState.meritCount;
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  /**
   * 保存设置
   */
  function saveSettings() {
    try {
      // 保存到本地存储
      saveToLocalStorage('woodenFishSettings', appState.settings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  /**
   * 保存应用状态
   */
  function saveAppState() {
    try {
      // 保存到本地存储
      saveToLocalStorage('woodenFishState', {
        meritCount: appState.meritCount
      });
    } catch (error) {
      console.error('保存应用状态失败:', error);
    }
  }

  /**
   * 应用设置
   */
  function applySettings() {
    // 设置控件值
    controls.volumeSlider.value = appState.settings.volume * 100;
    controls.soundToggle.checked = appState.settings.soundEnabled;
    controls.particleToggle.checked = appState.settings.particleEnabled;
    controls.textToggle.checked = appState.settings.textEnabled;
    controls.vibrationToggle.checked = appState.settings.vibrationEnabled;
    controls.soundStyleSelect.value = appState.settings.soundStyle;
    controls.particleStyleSelect.value = appState.settings.particleStyle;
    controls.textStyleSelect.value = appState.settings.textStyle;
    controls.qualitySelect.value = appState.settings.qualityLevel;

    // 应用音频设置
    if (audioManager) {
      audioManager.setVolume(appState.settings.volume);
      audioManager.setEnabled(appState.settings.soundEnabled);
      audioManager.soundStyle = appState.settings.soundStyle;
    }

    // 应用粒子设置
    if (particleSystem) {
      particleSystem.setEnabled(appState.settings.particleEnabled);
      particleSystem.params.qualityLevel = appState.settings.qualityLevel;
    }

    // 更新功德计数显示
    updateMeritCounter();
  }

  // 初始化应用
  initApp();
});
