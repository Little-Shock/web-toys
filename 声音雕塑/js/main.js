/**
 * 声音雕塑 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const canvas = document.getElementById('visualizerCanvas');
  const sourceOptions = document.querySelectorAll('.source-option');
  const visualOptions = document.querySelectorAll('.visual-option');
  const themeOptions = document.querySelectorAll('.theme-option');
  const audioControls = document.getElementById('audioControls');
  const synthControls = document.getElementById('synthControls');
  const playPauseButton = document.getElementById('playPauseButton');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const progressFill = document.getElementById('progressFill');
  const currentTimeDisplay = document.getElementById('currentTime');
  const totalTimeDisplay = document.getElementById('totalTime');
  const audioFileInput = document.getElementById('audioFileInput');
  const instructionsPanel = document.getElementById('instructionsPanel');
  const currentSourceDisplay = document.getElementById('currentSource');

  // 设置面板元素
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const sensitivitySlider = document.getElementById('sensitivitySlider');
  const smoothingSlider = document.getElementById('smoothingSlider');
  const fftSizeSelect = document.getElementById('fftSizeSelect');
  const qualitySlider = document.getElementById('qualitySlider');
  const showFpsToggle = document.getElementById('showFpsToggle');
  const autoRotateToggle = document.getElementById('autoRotateToggle');
  const responsiveToggle = document.getElementById('responsiveToggle');
  const saveButton = document.getElementById('saveButton');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const valueDisplays = document.querySelectorAll('.value-display');

  // 移动端元素
  const toolsPanel = document.querySelector('.tools-panel');
  const panelToggle = document.getElementById('panelToggle');
  const loadingIndicator = document.getElementById('loadingIndicator');

  // 创建音频分析器
  const audioAnalyzer = new AudioAnalyzer();

  // 创建可视化渲染器
  const visualizer = new Visualizer(canvas, audioAnalyzer);

  // 应用状态
  const state = {
    currentSource: 'microphone',
    currentVisual: 'waveform',
    currentTheme: 'spectrum',
    isDragging: false,
    isZooming: false,
    lastX: 0,
    lastY: 0,
    touchStartTime: 0,
    initialDistance: 0,
    initialZoom: 1.0,
    isPlaying: false,
    isPanelVisible: true, // 移动端工具面板状态
    isMobile: window.innerWidth <= 768 // 是否为移动设备
  };

  // 动画帧ID
  let animationFrameId = null;

  /**
   * 初始化应用
   */
  function init() {
    // 设置事件监听器
    setupEventListeners();

    // 开始动画循环
    startAnimationLoop();

    // 更新指令面板
    updateInstructionsPanel();

    // 初始化移动端界面
    initMobileUI();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
  }

  /**
   * 初始化移动端界面
   */
  function initMobileUI() {
    // 检测是否为移动设备
    state.isMobile = window.innerWidth <= 768;

    // 设置面板切换按钮的显示状态
    panelToggle.style.display = state.isMobile ? 'flex' : 'none';

    // 在移动端默认隐藏工具面板
    if (state.isMobile && window.innerWidth <= 480) {
      toolsPanel.classList.add('hidden');
      state.isPanelVisible = false;
    }
  }

  /**
   * 处理窗口大小变化
   */
  function handleResize() {
    // 更新移动设备状态
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth <= 768;

    // 如果设备类型发生变化，更新界面
    if (wasMobile !== state.isMobile) {
      initMobileUI();
    }

    // 调整可视化器大小
    visualizer.resize();
  }

  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 音频源选择
    sourceOptions.forEach(option => {
      option.addEventListener('click', () => {
        setAudioSource(option.dataset.source);
      });
    });

    // 可视化类型选择
    visualOptions.forEach(option => {
      option.addEventListener('click', () => {
        setVisualType(option.dataset.visual);
      });
    });

    // 颜色主题选择
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        setColorTheme(option.dataset.theme);
      });
    });

    // 播放/暂停按钮
    playPauseButton.addEventListener('click', togglePlayPause);

    // 音量滑块
    volumeSlider.addEventListener('input', () => {
      setVolume(volumeSlider.value / 100);
    });

    // 进度条点击
    document.querySelector('.progress-bar').addEventListener('click', (e) => {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      setPlaybackPosition(position);
    });

    // 文件输入
    audioFileInput.addEventListener('change', handleFileInput);

    // 画布交互
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleCanvasMouseUp);

    // 触摸事件
    canvas.addEventListener('touchstart', handleCanvasTouchStart);
    canvas.addEventListener('touchmove', handleCanvasTouchMove);
    canvas.addEventListener('touchend', handleCanvasTouchEnd);

    // 合成器控制
    document.getElementById('waveformType').addEventListener('change', updateSynthParams);
    document.getElementById('frequencySlider').addEventListener('input', updateSynthParams);
    document.getElementById('modulationSlider').addEventListener('input', updateSynthParams);

    // 设置面板控制
    settingsButton.addEventListener('click', toggleSettingsPanel);
    closeSettings.addEventListener('click', toggleSettingsPanel);

    // 设置滑块
    sensitivitySlider.addEventListener('input', updateSettings);
    smoothingSlider.addEventListener('input', updateSettings);
    fftSizeSelect.addEventListener('change', updateSettings);
    qualitySlider.addEventListener('input', updateSettings);
    showFpsToggle.addEventListener('change', updateSettings);
    autoRotateToggle.addEventListener('change', updateSettings);
    responsiveToggle.addEventListener('change', updateSettings);

    // 保存按钮
    saveButton.addEventListener('click', saveVisualization);

    // 全屏按钮
    fullscreenButton.addEventListener('click', toggleFullscreen);

    // 移动端工具面板切换按钮
    panelToggle.addEventListener('click', toggleToolsPanel);

    // 更新值显示
    updateValueDisplays();
  }

  /**
   * 设置音频源
   * @param {string} source - 音频源类型
   */
  function setAudioSource(source) {
    // 更新当前源
    state.currentSource = source;

    // 更新UI
    sourceOptions.forEach(option => {
      if (option.dataset.source === source) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // 显示/隐藏相关控制面板
    if (source === 'oscillator') {
      audioControls.classList.add('hidden');
      synthControls.classList.remove('hidden');
    } else {
      audioControls.classList.remove('hidden');
      synthControls.classList.add('hidden');
    }

    // 初始化音频源
    switch (source) {
      case 'microphone':
        // 显示加载指示器
        showLoading('正在请求麦克风权限...');

        audioAnalyzer.initMicrophone()
          .then(success => {
            // 隐藏加载指示器
            hideLoading();

            if (!success) {
              alert('无法访问麦克风，请检查权限设置。');
            }
          })
          .catch(error => {
            hideLoading();
            alert('麦克风初始化失败: ' + error.message);
          });
        break;

      case 'file':
        audioFileInput.click();
        break;

      case 'demo':
        // 显示加载指示器
        showLoading('正在加载示例音频...');

        // 加载示例音频
        audioAnalyzer.loadAudioFile('https://cdn.freesound.org/previews/328/328857_230356-lq.mp3')
          .then(success => {
            hideLoading();
            if (!success) {
              alert('示例音频加载失败，请稍后再试。');
            }
          })
          .catch(error => {
            hideLoading();
            alert('示例音频加载失败: ' + error.message);
          });
        break;

      case 'oscillator':
        audioAnalyzer.initOscillator();
        break;
    }

    // 更新指令面板
    updateInstructionsPanel();
  }

  /**
   * 显示加载指示器
   * @param {string} message - 加载消息
   */
  function showLoading(message = '加载中...') {
    loadingIndicator.querySelector('div:last-child').textContent = message;
    loadingIndicator.classList.remove('hidden');
  }

  /**
   * 隐藏加载指示器
   */
  function hideLoading() {
    loadingIndicator.classList.add('hidden');
  }

  /**
   * 设置可视化类型
   * @param {string} type - 可视化类型
   */
  function setVisualType(type) {
    // 更新当前类型
    state.currentVisual = type;

    // 更新UI
    visualOptions.forEach(option => {
      if (option.dataset.visual === type) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // 设置可视化器类型
    visualizer.setVisualType(type);
  }

  /**
   * 设置颜色主题
   * @param {string} theme - 颜色主题
   */
  function setColorTheme(theme) {
    // 更新当前主题
    state.currentTheme = theme;

    // 更新UI
    themeOptions.forEach(option => {
      if (option.dataset.theme === theme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // 设置可视化器主题
    visualizer.setColorTheme(theme);
  }

  /**
   * 切换播放/暂停
   */
  function togglePlayPause() {
    if (state.currentSource === 'file' || state.currentSource === 'demo') {
      if (state.isPlaying) {
        audioAnalyzer.pause();
        playPauseIcon.textContent = '▶️';
      } else {
        audioAnalyzer.play();
        playPauseIcon.textContent = '⏸️';
      }
      state.isPlaying = !state.isPlaying;
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值（0-1）
   */
  function setVolume(volume) {
    audioAnalyzer.setVolume(volume);
  }

  /**
   * 设置播放位置
   * @param {number} position - 位置（0-1）
   */
  function setPlaybackPosition(position) {
    if (state.currentSource === 'file' || state.currentSource === 'demo') {
      audioAnalyzer.setPlaybackPosition(position);
    }
  }

  /**
   * 处理文件输入
   * @param {Event} event - 事件对象
   */
  function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
      // 显示加载指示器
      showLoading(`正在加载音频文件: ${file.name}...`);

      audioAnalyzer.loadAudioFile(file)
        .then(success => {
          hideLoading();

          if (success) {
            state.isPlaying = true;
            playPauseIcon.textContent = '⏸️';
          } else {
            alert('音频文件加载失败，请尝试其他文件。');
          }
        })
        .catch(error => {
          hideLoading();
          alert('音频文件加载失败: ' + error.message);
        });
    }
  }

  /**
   * 更新合成器参数
   */
  function updateSynthParams() {
    const waveform = document.getElementById('waveformType').value;
    const frequency = parseInt(document.getElementById('frequencySlider').value);
    const modulation = parseInt(document.getElementById('modulationSlider').value) / 100;

    // 更新显示值
    document.getElementById('frequencySlider').nextElementSibling.textContent = frequency;
    document.getElementById('modulationSlider').nextElementSibling.textContent = `${modulation * 100}%`;

    // 更新合成器
    audioAnalyzer.updateSynthParams({
      waveform,
      frequency,
      modulation
    });
  }

  /**
   * 处理画布鼠标按下
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleCanvasMouseDown(event) {
    state.isDragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
  }

  /**
   * 处理画布鼠标移动
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleCanvasMouseMove(event) {
    if (state.isDragging) {
      const deltaX = event.clientX - state.lastX;
      const deltaY = event.clientY - state.lastY;

      // 更新3D场景旋转
      visualizer.updateScene({
        rotationY: visualizer.scene.rotationY + deltaX * 0.01,
        rotationX: visualizer.scene.rotationX + deltaY * 0.01
      });

      state.lastX = event.clientX;
      state.lastY = event.clientY;
    }
  }

  /**
   * 处理画布鼠标释放
   */
  function handleCanvasMouseUp() {
    state.isDragging = false;
  }

  /**
   * 处理画布触摸开始
   * @param {TouchEvent} event - 触摸事件
   */
  function handleCanvasTouchStart(event) {
    event.preventDefault(); // 防止页面滚动

    // 隐藏指令面板，提供更好的视觉体验
    if (state.isMobile) {
      instructionsPanel.classList.add('hidden');
    }

    if (event.touches.length === 1) {
      // 单指拖动（旋转）
      state.isDragging = true;
      state.lastX = event.touches[0].clientX;
      state.lastY = event.touches[0].clientY;
      state.touchStartTime = Date.now();
    } else if (event.touches.length === 2) {
      // 双指缩放
      state.isZooming = true;
      state.initialDistance = getTouchDistance(event.touches[0], event.touches[1]);
      state.initialZoom = visualizer.params.zoom;
    }
  }

  /**
   * 处理画布触摸移动
   * @param {TouchEvent} event - 触摸事件
   */
  function handleCanvasTouchMove(event) {
    event.preventDefault(); // 防止页面滚动

    if (state.isDragging && event.touches.length === 1) {
      // 单指拖动（旋转）
      const deltaX = event.touches[0].clientX - state.lastX;
      const deltaY = event.touches[0].clientY - state.lastY;

      // 更新3D场景旋转
      visualizer.updateScene({
        rotationY: visualizer.scene.rotationY + deltaX * 0.01,
        rotationX: visualizer.scene.rotationX + deltaY * 0.01
      });

      state.lastX = event.touches[0].clientX;
      state.lastY = event.touches[0].clientY;
    } else if (state.isZooming && event.touches.length === 2) {
      // 双指缩放
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const zoomFactor = currentDistance / state.initialDistance;

      // 计算新的缩放值
      let newZoom = state.initialZoom * zoomFactor;

      // 限制缩放范围
      newZoom = Math.max(0.5, Math.min(2.0, newZoom));

      // 更新可视化器缩放
      visualizer.updateParams({
        zoom: newZoom
      });
    }
  }

  /**
   * 处理画布触摸结束
   * @param {TouchEvent} event - 触摸事件
   */
  function handleCanvasTouchEnd(event) {
    // 检测是否是点击操作
    if (state.isDragging && Date.now() - state.touchStartTime < 300 &&
        Math.abs(event.changedTouches[0].clientX - state.lastX) < 10 &&
        Math.abs(event.changedTouches[0].clientY - state.lastY) < 10) {
      // 触发点击事件，例如切换设置面板
      toggleSettingsPanel();
    }

    state.isDragging = false;
    state.isZooming = false;
  }

  /**
   * 获取两个触摸点之间的距离
   * @param {Touch} touch1 - 第一个触摸点
   * @param {Touch} touch2 - 第二个触摸点
   * @returns {number} 距离
   */
  function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 更新音频播放信息
   */
  function updateAudioInfo() {
    if (state.currentSource === 'file' || state.currentSource === 'demo') {
      const info = audioAnalyzer.getPlaybackInfo();

      // 更新时间显示
      currentTimeDisplay.textContent = formatTime(info.currentTime);
      totalTimeDisplay.textContent = formatTime(info.duration);

      // 更新进度条
      const progress = info.duration > 0 ? (info.currentTime / info.duration) * 100 : 0;
      progressFill.style.width = `${progress}%`;
    }
  }

  /**
   * 格式化时间
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串
   */
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 更新设置
   */
  function updateSettings() {
    // 获取设置值
    const sensitivity = sensitivitySlider.value / 100;
    const smoothing = smoothingSlider.value / 100;
    const fftSize = parseInt(fftSizeSelect.value);
    const quality = qualitySlider.value / 100;
    const showFps = showFpsToggle.checked;
    const autoRotate = autoRotateToggle.checked;
    const responsive = responsiveToggle.checked;

    // 更新音频分析器参数
    audioAnalyzer.updateParams({
      sensitivity,
      smoothingTimeConstant: smoothing,
      fftSize
    });

    // 更新可视化器参数
    visualizer.updateParams({
      quality,
      autoRotate,
      responsive,
      showFps
    });

    // 更新值显示
    updateValueDisplays();
  }

  /**
   * 更新值显示
   */
  function updateValueDisplays() {
    // 更新所有滑块旁边的值显示
    valueDisplays.forEach(display => {
      const slider = display.previousElementSibling;
      if (slider && slider.type === 'range') {
        if (slider.id === 'frequencySlider') {
          display.textContent = slider.value;
        } else {
          display.textContent = `${slider.value}%`;
        }
      }
    });
  }

  /**
   * 切换设置面板
   */
  function toggleSettingsPanel() {
    settingsPanel.classList.toggle('hidden');
  }

  /**
   * 保存可视化效果为图像
   */
  function saveVisualization() {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `声音雕塑_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 切换全屏模式
   */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      // 进入全屏
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  /**
   * 切换工具面板显示/隐藏
   */
  function toggleToolsPanel() {
    state.isPanelVisible = !state.isPanelVisible;

    if (state.isPanelVisible) {
      toolsPanel.classList.remove('hidden');
      panelToggle.textContent = '❌';
    } else {
      toolsPanel.classList.add('hidden');
      panelToggle.textContent = '⚙️';
    }
  }

  /**
   * 更新指令面板
   */
  function updateInstructionsPanel() {
    currentSourceDisplay.textContent = {
      'microphone': '麦克风',
      'file': '音频文件',
      'demo': '示例音乐',
      'oscillator': '音频合成器'
    }[state.currentSource] || '麦克风';
  }

  /**
   * 开始动画循环
   */
  function startAnimationLoop() {
    // 停止之前的动画循环
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // 动画函数
    function animate() {
      // 更新音频信息
      updateAudioInfo();

      // 渲染可视化效果
      visualizer.render();

      // 继续动画循环
      animationFrameId = requestAnimationFrame(animate);
    }

    // 开始动画
    animate();
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

  // 初始化应用
  init();

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    stopAnimationLoop();
    audioAnalyzer.dispose();
  });
});
