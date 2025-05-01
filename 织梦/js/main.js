/**
 * 织梦 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const canvas = document.getElementById('fabricCanvas');
  const fabricOptions = document.querySelectorAll('.fabric-option');
  const textureOptions = document.querySelectorAll('.texture-option');
  const colorOptions = document.querySelectorAll('.color-option');
  const modeOptions = document.querySelectorAll('.mode-option');
  const resetButton = document.getElementById('resetButton');
  const saveButton = document.getElementById('saveButton');
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const gravitySlider = document.getElementById('gravitySlider');
  const stiffnessSlider = document.getElementById('stiffnessSlider');
  const dampingSlider = document.getElementById('dampingSlider');
  const massSlider = document.getElementById('massSlider');
  const resolutionSlider = document.getElementById('resolutionSlider');
  const shadowToggle = document.getElementById('shadowToggle');
  const soundToggle = document.getElementById('soundToggle');
  const textureUpload = document.getElementById('textureUpload');
  const instructionsPanel = document.getElementById('instructionsPanel');
  const currentMode = document.getElementById('currentMode');
  
  // 值显示元素
  const valueDisplays = document.querySelectorAll('.value-display');
  
  // 创建织物物理引擎
  const fabricPhysics = new FabricPhysics();
  
  // 创建织物渲染器
  const fabricRenderer = new FabricRenderer(canvas, fabricPhysics);
  
  // 创建音频管理器
  const audioManager = new AudioManager();
  
  // 应用状态
  const state = {
    isPointerDown: false,
    lastX: 0,
    lastY: 0,
    currentFabricType: 'silk',
    currentTexture: 'plain',
    currentColor: '#3498db',
    currentMode: 'drag',
    settingsOpen: false,
    lastInteractionTime: 0,
    customTextureLoaded: false
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
    
    // 织物类型选择
    fabricOptions.forEach(option => {
      option.addEventListener('click', () => {
        setFabricType(option.dataset.fabric);
        audioManager.playUISound('click');
      });
    });
    
    // 纹理选择
    textureOptions.forEach(option => {
      option.addEventListener('click', () => {
        if (option.dataset.texture === 'custom') {
          textureUpload.click();
        } else {
          setTexture(option.dataset.texture);
        }
        audioManager.playUISound('click');
      });
    });
    
    // 纹理上传
    textureUpload.addEventListener('change', handleTextureUpload);
    
    // 颜色选择
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        setColor(option.dataset.color);
        audioManager.playUISound('click');
      });
    });
    
    // 交互模式选择
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        setInteractionMode(option.dataset.mode);
        audioManager.playUISound('click');
      });
    });
    
    // 控制按钮
    resetButton.addEventListener('click', () => {
      resetFabric();
      audioManager.playUISound('click');
    });
    
    saveButton.addEventListener('click', () => {
      saveCanvas();
      audioManager.playUISound('success');
    });
    
    settingsButton.addEventListener('click', () => {
      toggleSettings();
      audioManager.playUISound('toggle');
    });
    
    closeSettings.addEventListener('click', () => {
      toggleSettings();
      audioManager.playUISound('toggle');
    });
    
    // 设置滑块
    gravitySlider.addEventListener('input', updatePhysicsParams);
    stiffnessSlider.addEventListener('input', updatePhysicsParams);
    dampingSlider.addEventListener('input', updatePhysicsParams);
    massSlider.addEventListener('input', updatePhysicsParams);
    resolutionSlider.addEventListener('input', updatePhysicsParams);
    
    // 复选框
    shadowToggle.addEventListener('change', () => {
      fabricRenderer.updateParams({
        showShadow: shadowToggle.checked
      });
      audioManager.playUISound('toggle');
    });
    
    soundToggle.addEventListener('change', () => {
      audioManager.setEnabled(soundToggle.checked);
      if (soundToggle.checked) {
        audioManager.playUISound('toggle');
      }
    });
    
    // 窗口大小调整
    window.addEventListener('resize', handleResize);
    
    // 设备方向变化
    window.addEventListener('deviceorientation', handleDeviceOrientation);
  }
  
  /**
   * 处理指针按下事件
   */
  function handlePointerDown(e) {
    e.preventDefault();
    
    state.isPointerDown = true;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    state.lastX = x;
    state.lastY = y;
    
    // 根据当前交互模式处理
    switch (state.currentMode) {
      case 'drag':
        // 开始拖动织物
        fabricPhysics.startDragging(x, y);
        
        // 播放织物音效
        if (fabricPhysics.draggedPoint) {
          audioManager.playFabricSound(
            state.currentFabricType,
            x / canvas.width,
            y / canvas.height,
            0.5
          );
        }
        break;
      
      case 'pin':
        // 查找最近的点并固定/取消固定
        const point = fabricPhysics.findNearestPoint(x, y);
        if (point) {
          if (point.pinned) {
            fabricPhysics.unpinPoint(point.index);
          } else {
            fabricPhysics.pinPoint(point.index);
            
            // 播放固定点音效
            audioManager.playPinSound(x / canvas.width, y / canvas.height);
          }
        }
        break;
      
      case 'cut':
        // 开始剪裁模式
        fabricPhysics.cutMode = true;
        
        // 执行剪裁
        const cutRadius = 20;
        const didCut = fabricPhysics.cut(x, y, cutRadius);
        
        // 播放剪裁音效
        if (didCut) {
          audioManager.playCutSound(x / canvas.width, y / canvas.height, 0.7);
        }
        break;
      
      case 'wind':
        // 开始风力模式
        fabricPhysics.windMode = true;
        state.windStartX = x;
        state.windStartY = y;
        break;
    }
  }
  
  /**
   * 处理指针移动事件
   */
  function handlePointerMove(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 计算移动距离
    const dx = x - state.lastX;
    const dy = y - state.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 限制交互频率
    const now = Date.now();
    const timeSinceLastInteraction = now - state.lastInteractionTime;
    
    if (state.isPointerDown && timeSinceLastInteraction > 16) { // 约60fps
      state.lastInteractionTime = now;
      
      // 根据当前交互模式处理
      switch (state.currentMode) {
        case 'drag':
          // 拖动织物
          if (fabricPhysics.draggedPoint) {
            fabricPhysics.dragTo(x, y);
            
            // 如果移动足够远，播放织物音效
            if (distance > 10) {
              audioManager.playFabricSound(
                state.currentFabricType,
                x / canvas.width,
                y / canvas.height,
                Math.min(1, distance / 50)
              );
            }
          }
          break;
        
        case 'cut':
          // 继续剪裁
          if (fabricPhysics.cutMode && distance > 5) {
            const cutRadius = 20;
            const didCut = fabricPhysics.cut(x, y, cutRadius);
            
            // 播放剪裁音效
            if (didCut) {
              audioManager.playCutSound(x / canvas.width, y / canvas.height, 0.5);
            }
          }
          break;
        
        case 'wind':
          // 更新风力方向和强度
          if (fabricPhysics.windMode) {
            const dirX = x - state.windStartX;
            const dirY = y - state.windStartY;
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            
            if (length > 0) {
              const normalizedDirX = dirX / length;
              const normalizedDirY = dirY / length;
              const strength = Math.min(1, length / 100);
              
              fabricPhysics.applyWind(normalizedDirX, normalizedDirY, strength);
              
              // 播放风力音效
              if (distance > 10) {
                audioManager.playWindSound(
                  x / canvas.width,
                  y / canvas.height,
                  strength
                );
              }
            }
          }
          break;
      }
    }
    
    state.lastX = x;
    state.lastY = y;
  }
  
  /**
   * 处理指针抬起事件
   */
  function handlePointerUp(e) {
    e.preventDefault();
    
    // 根据当前交互模式处理
    switch (state.currentMode) {
      case 'drag':
        // 结束拖动
        fabricPhysics.endDragging();
        break;
      
      case 'cut':
        // 结束剪裁
        fabricPhysics.cutMode = false;
        break;
      
      case 'wind':
        // 结束风力
        fabricPhysics.stopWind();
        break;
    }
    
    state.isPointerDown = false;
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
    // 获取设备倾斜角度
    const beta = e.beta;  // 前后倾斜 (-180 到 180)
    const gamma = e.gamma; // 左右倾斜 (-90 到 90)
    
    if (beta !== null && gamma !== null) {
      // 将角度转换为重力方向
      const normalizedBeta = Math.max(-45, Math.min(45, beta)) / 45;
      const normalizedGamma = Math.max(-45, Math.min(45, gamma)) / 45;
      
      // 更新重力方向
      const gravityScale = fabricPhysics.params.gravity;
      fabricPhysics.params.gravityX = normalizedGamma * gravityScale;
      fabricPhysics.params.gravityY = normalizedBeta * gravityScale;
    }
  }
  
  /**
   * 处理窗口大小调整
   */
  function handleResize() {
    // 调整画布大小
    fabricRenderer.resize();
  }
  
  /**
   * 处理纹理上传
   */
  function handleTextureUpload(e) {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          // 设置自定义纹理
          fabricRenderer.setCustomTexture(img);
          state.customTextureLoaded = true;
          
          // 更新UI
          setTexture('custom');
          
          // 播放成功音效
          audioManager.playUISound('success');
        };
        img.src = event.target.result;
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * 设置织物类型
   * @param {string} type - 织物类型
   */
  function setFabricType(type) {
    state.currentFabricType = type;
    fabricPhysics.setFabricType(type);
    
    // 更新UI
    fabricOptions.forEach(option => {
      if (option.dataset.fabric === type) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  /**
   * 设置纹理
   * @param {string} texture - 纹理名称
   */
  function setTexture(texture) {
    if (texture === 'custom' && !state.customTextureLoaded) {
      // 如果选择自定义纹理但尚未上传，打开文件选择器
      textureUpload.click();
      return;
    }
    
    state.currentTexture = texture;
    fabricRenderer.setTexture(texture);
    
    // 更新UI
    textureOptions.forEach(option => {
      if (option.dataset.texture === texture) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  /**
   * 设置颜色
   * @param {string} color - 颜色值
   */
  function setColor(color) {
    state.currentColor = color;
    fabricRenderer.setColor(color);
    
    // 更新UI
    colorOptions.forEach(option => {
      if (option.dataset.color === color) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  /**
   * 设置交互模式
   * @param {string} mode - 交互模式
   */
  function setInteractionMode(mode) {
    state.currentMode = mode;
    
    // 更新UI
    modeOptions.forEach(option => {
      if (option.dataset.mode === mode) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // 更新提示文本
    const modeNames = {
      drag: '拖拽',
      pin: '固定点',
      cut: '剪裁',
      wind: '风力'
    };
    currentMode.textContent = modeNames[mode] || mode;
    
    // 更新鼠标样式
    switch (mode) {
      case 'drag':
        canvas.style.cursor = 'grab';
        break;
      case 'pin':
        canvas.style.cursor = 'pointer';
        break;
      case 'cut':
        canvas.style.cursor = 'crosshair';
        break;
      case 'wind':
        canvas.style.cursor = 'move';
        break;
    }
  }
  
  /**
   * 更新物理参数
   */
  function updatePhysicsParams() {
    // 获取滑块值
    const gravity = parseInt(gravitySlider.value) / 100;
    const stiffness = parseInt(stiffnessSlider.value) / 100;
    const damping = parseInt(dampingSlider.value) / 100;
    const mass = parseInt(massSlider.value) / 100;
    const resolution = parseInt(resolutionSlider.value);
    
    // 更新物理引擎参数
    fabricPhysics.updateParams({
      gravity,
      stiffness,
      damping,
      mass,
      resolution
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
        if (slider.id === 'resolutionSlider') {
          display.textContent = slider.value;
        } else {
          display.textContent = `${slider.value}%`;
        }
      }
    });
  }
  
  /**
   * 重置织物
   */
  function resetFabric() {
    fabricPhysics.reset();
    
    // 播放织物音效
    audioManager.playFabricSound(state.currentFabricType, 0.5, 0.5, 0.8);
  }
  
  /**
   * 保存画布
   */
  function saveCanvas() {
    const dataUrl = fabricRenderer.saveAsImage();
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `织梦作品_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
   * 开始动画循环
   */
  function startAnimationLoop() {
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      // 计算时间增量（秒）
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // 更新物理模拟
      fabricPhysics.update(deltaTime);
      
      // 渲染织物
      fabricRenderer.render();
      
      // 渲染特殊效果
      renderEffects();
      
      // 继续动画循环
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * 渲染特殊效果
   */
  function renderEffects() {
    // 根据当前交互模式渲染特殊效果
    if (state.isPointerDown) {
      switch (state.currentMode) {
        case 'cut':
          // 渲染剪刀效果
          fabricRenderer.renderCutEffect(state.lastX, state.lastY, 20);
          break;
        
        case 'wind':
          // 渲染风力效果
          if (fabricPhysics.windMode) {
            fabricRenderer.renderWindEffect(
              state.windStartX,
              state.windStartY,
              fabricPhysics.windDirection.x,
              fabricPhysics.windDirection.y,
              fabricPhysics.windStrength
            );
          }
          break;
      }
    }
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
    audioManager.stopAllSounds();
  });
});
