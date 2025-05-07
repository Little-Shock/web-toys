/**
 * 墨韵 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const canvas = document.getElementById('inkCanvas');
  const inkOptions = document.querySelectorAll('.ink-option');
  const brushOptions = document.querySelectorAll('.brush-option');
  const paperOptions = document.querySelectorAll('.paper-option');
  const clearButton = document.getElementById('clearButton');
  const saveButton = document.getElementById('saveButton');
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const inkDensitySlider = document.getElementById('inkDensity');
  const inkDiffusionSlider = document.getElementById('inkDiffusion');
  const brushSizeSlider = document.getElementById('brushSize');
  const paperAbsorptionSlider = document.getElementById('paperAbsorption');
  const motionEnabledCheckbox = document.getElementById('motionEnabled');
  const soundEnabledCheckbox = document.getElementById('soundEnabled');
  
  // 值显示元素
  const valueDisplays = document.querySelectorAll('.value-display');
  
  // 创建流体模拟器
  const fluidSimulation = new FluidSimulation(
    Math.floor(window.innerWidth / 2),
    Math.floor(window.innerHeight / 2)
  );
  
  // 创建墨水渲染器
  const inkRenderer = new InkRenderer(canvas, fluidSimulation);
  
  // 创建音频管理器
  const audioManager = new AudioManager();
  
  // 应用状态
  const state = {
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    currentInk: 'black',
    currentBrush: 'soft',
    currentPaper: 'rice',
    brushSize: 30,
    motionEnabled: true,
    settingsOpen: false,
    deviceOrientation: { beta: 0, gamma: 0 },
    lastStrokeTime: 0
  };
  
  /**
   * 初始化应用
   */
  function init() {
    // 设置事件监听器
    setupEventListeners();
    
    // 开始动画循环
    requestAnimationFrame(animate);
    
    // 更新设置值显示
    updateValueDisplays();
  }
  
  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 画布交互事件
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // 墨水选择
    inkOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentInk(option.dataset.ink);
      });
    });
    
    // 笔触选择
    brushOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentBrush(option.dataset.brush);
      });
    });
    
    // 纸张选择
    paperOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentPaper(option.dataset.paper);
      });
    });
    
    // 控制按钮
    clearButton.addEventListener('click', clearCanvas);
    saveButton.addEventListener('click', saveCanvas);
    settingsButton.addEventListener('click', toggleSettings);
    closeSettings.addEventListener('click', toggleSettings);
    
    // 设置滑块
    inkDensitySlider.addEventListener('input', updateSettings);
    inkDiffusionSlider.addEventListener('input', updateSettings);
    brushSizeSlider.addEventListener('input', updateBrushSize);
    paperAbsorptionSlider.addEventListener('input', updateSettings);
    
    // 复选框
    motionEnabledCheckbox.addEventListener('change', () => {
      state.motionEnabled = motionEnabledCheckbox.checked;
    });
    
    soundEnabledCheckbox.addEventListener('change', () => {
      audioManager.setEnabled(soundEnabledCheckbox.checked);
    });
    
    // 窗口大小调整
    window.addEventListener('resize', handleResize);
    
    // 设备方向
    window.addEventListener('deviceorientation', handleDeviceOrientation);
  }
  
  /**
   * 处理指针按下事件
   */
  function handlePointerDown(e) {
    e.preventDefault();
    
    state.isDrawing = true;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    state.lastX = x;
    state.lastY = y;
    
    // 根据笔触类型添加墨水
    addInkAtPosition(x, y, 0, 0);
  }
  
  /**
   * 处理指针移动事件
   */
  function handlePointerMove(e) {
    if (!state.isDrawing) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    
    // 计算速度
    const dx = x - state.lastX;
    const dy = y - state.lastY;
    
    // 添加墨水
    addInkAtPosition(x, y, dx * 100, dy * 100);
    
    state.lastX = x;
    state.lastY = y;
  }
  
  /**
   * 处理指针抬起事件
   */
  function handlePointerUp(e) {
    state.isDrawing = false;
  }
  
  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {}
      });
    }
  }
  
  /**
   * 处理触摸移动事件
   */
  function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {}
      });
    }
  }
  
  /**
   * 处理触摸结束事件
   */
  function handleTouchEnd(e) {
    e.preventDefault();
    handlePointerUp(e);
  }
  
  /**
   * 处理设备方向变化
   */
  function handleDeviceOrientation(e) {
    if (!state.motionEnabled) return;
    
    // 获取设备倾斜角度
    const beta = e.beta;  // 前后倾斜 (-180 到 180)
    const gamma = e.gamma; // 左右倾斜 (-90 到 90)
    
    if (beta !== null && gamma !== null) {
      // 将角度转换为重力方向
      const normalizedBeta = Math.max(-45, Math.min(45, beta)) / 45;
      const normalizedGamma = Math.max(-45, Math.min(45, gamma)) / 45;
      
      state.deviceOrientation = {
        beta: normalizedBeta,
        gamma: normalizedGamma
      };
      
      // 设置流体重力
      fluidSimulation.setGravity(normalizedGamma, normalizedBeta);
    }
  }
  
  /**
   * 处理窗口大小调整
   */
  function handleResize() {
    // 调整画布大小
    inkRenderer.resize();
  }
  
  /**
   * 在指定位置添加墨水
   */
  function addInkAtPosition(x, y, velocityX, velocityY) {
    // 将归一化坐标转换为流体模拟坐标
    const simX = x * fluidSimulation.width;
    const simY = y * fluidSimulation.height;
    
    // 计算笔刷大小
    const size = state.brushSize / 100 * 20 + 5; // 5-25范围
    
    // 计算强度
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    const intensity = Math.min(1, 0.3 + speed * 0.1);
    
    // 根据笔触类型添加墨水
    switch (state.currentBrush) {
      case 'soft':
        fluidSimulation.addInk(simX, simY, intensity, velocityX, velocityY, size);
        playBrushSound(x, y, intensity, 'soft');
        break;
      case 'hard':
        fluidSimulation.addInk(simX, simY, intensity * 1.5, velocityX * 1.2, velocityY * 1.2, size * 0.7);
        playBrushSound(x, y, intensity, 'hard');
        break;
      case 'splash':
        // 计算方向
        const angle = Math.atan2(velocityY, velocityX);
        fluidSimulation.splashInk(simX, simY, intensity * 2, angle, 60);
        playBrushSound(x, y, intensity, 'splash');
        break;
      case 'water':
        fluidSimulation.addWaterDrop(simX, simY, size * 1.5);
        playBrushSound(x, y, intensity, 'water');
        break;
    }
  }
  
  /**
   * 播放笔刷音效
   */
  function playBrushSound(x, y, intensity, brushType) {
    // 限制音效频率
    const now = Date.now();
    if (now - state.lastStrokeTime < 50) return;
    state.lastStrokeTime = now;
    
    // 根据笔触类型播放不同音效
    switch (brushType) {
      case 'soft':
        audioManager.playSound('brush', x, y, intensity, 0.1);
        break;
      case 'hard':
        audioManager.playSound('brush', x, y, intensity * 1.2, 0.2);
        break;
      case 'splash':
        audioManager.playSound('splash', x, y, intensity, 0.3);
        break;
      case 'water':
        audioManager.playSound('water', x, y, intensity, 0.2);
        break;
    }
  }
  
  /**
   * 设置当前墨水
   */
  function setCurrentInk(ink) {
    state.currentInk = ink;
    fluidSimulation.setParameters({ inkType: ink });
    
    // 更新UI
    inkOptions.forEach(option => {
      if (option.dataset.ink === ink) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  /**
   * 设置当前笔触
   */
  function setCurrentBrush(brush) {
    state.currentBrush = brush;
    
    // 更新UI
    brushOptions.forEach(option => {
      if (option.dataset.brush === brush) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  /**
   * 设置当前纸张
   */
  function setCurrentPaper(paper) {
    state.currentPaper = paper;
    inkRenderer.setPaper(paper);
    
    // 更新UI
    paperOptions.forEach(option => {
      if (option.dataset.paper === paper) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // 播放纸张音效
    audioManager.playSound('paper', 0.5, 0.5, 0.7, 0.1);
  }
  
  /**
   * 更新笔刷大小
   */
  function updateBrushSize() {
    state.brushSize = parseInt(brushSizeSlider.value);
    updateValueDisplays();
  }
  
  /**
   * 更新设置
   */
  function updateSettings() {
    // 获取滑块值
    const density = parseInt(inkDensitySlider.value) / 100;
    const diffusion = parseInt(inkDiffusionSlider.value) / 100;
    const absorption = parseInt(paperAbsorptionSlider.value) / 100;
    
    // 更新流体模拟参数
    fluidSimulation.setParameters({
      density,
      diffusion,
      absorption
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
        display.textContent = `${slider.value}%`;
      }
    });
  }
  
  /**
   * 清除画布
   */
  function clearCanvas() {
    inkRenderer.clear();
    
    // 播放纸张音效
    audioManager.playSound('paper', 0.5, 0.5, 0.5, 0.3);
  }
  
  /**
   * 保存画布
   */
  function saveCanvas() {
    const dataUrl = inkRenderer.saveAsImage();
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `墨韵作品_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 播放纸张音效
    audioManager.playSound('paper', 0.5, 0.5, 0.8, 0.1);
  }
  
  /**
   * 切换设置面板
   */
  function toggleSettings() {
    state.settingsOpen = !state.settingsOpen;
    
    if (state.settingsOpen) {
      settingsPanel.classList.remove('hidden');
    } else {
      settingsPanel.classList.add('hidden');
    }
  }
  
  /**
   * 动画循环
   */
  function animate() {
    // 更新流体模拟
    fluidSimulation.update();
    
    // 渲染流体
    inkRenderer.render();
    
    // 继续动画循环
    requestAnimationFrame(animate);
  }
  
  // 初始化应用
  init();
});
