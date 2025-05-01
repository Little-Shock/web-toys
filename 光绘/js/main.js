/**
 * 光绘 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const canvas = document.getElementById('shadowCanvas');
  const lightOptions = document.querySelectorAll('.light-option');
  const objectOptions = document.querySelectorAll('.object-option');
  const colorOptions = document.querySelectorAll('.color-option');
  const clearButton = document.getElementById('clearButton');
  const saveButton = document.getElementById('saveButton');
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const lightIntensitySlider = document.getElementById('lightIntensity');
  const shadowSoftnessSlider = document.getElementById('shadowSoftness');
  const objectOpacitySlider = document.getElementById('objectOpacity');
  const backgroundDarknessSlider = document.getElementById('backgroundDarkness');
  const animationEnabledCheckbox = document.getElementById('animationEnabled');
  const soundEnabledCheckbox = document.getElementById('soundEnabled');
  const instructionsPanel = document.getElementById('instructionsPanel');
  const currentTool = document.getElementById('currentTool');
  
  // 值显示元素
  const valueDisplays = document.querySelectorAll('.value-display');
  
  // 创建光源引擎
  const lightEngine = new LightEngine();
  
  // 创建阴影渲染器
  const shadowRenderer = new ShadowRenderer(canvas, lightEngine);
  
  // 创建音频管理器
  const audioManager = new AudioManager();
  
  // 应用状态
  const state = {
    isDrawing: false,
    isDragging: false,
    draggedObject: null,
    draggedLight: null,
    dragStartX: 0,
    dragStartY: 0,
    currentLightType: 'point',
    currentObjectType: 'rectangle',
    currentColor: '#FFFFFF',
    customPoints: [],
    settingsOpen: false,
    lastX: 0,
    lastY: 0
  };
  
  /**
   * 初始化应用
   */
  function init() {
    // 设置事件监听器
    setupEventListeners();
    
    // 开始光源引擎
    lightEngine.start();
    
    // 开始渲染循环
    requestAnimationFrame(animate);
    
    // 更新设置值显示
    updateValueDisplays();
    
    // 创建初始光源和物体
    createDefaultScene();
  }
  
  /**
   * 创建默认场景
   */
  function createDefaultScene() {
    // 创建一个环境光
    lightEngine.createLight('ambient', 0, 0, '#333333', {
      strength: 0.2
    });
    
    // 创建一个点光源
    lightEngine.createLight('point', canvas.width / 2, canvas.height / 3, '#FFFFFF', {
      radius: 200
    });
    
    // 创建一些物体
    lightEngine.createObject('rectangle', canvas.width / 2, canvas.height / 2 + 100, {
      width: 200,
      height: 50
    });
    
    lightEngine.createObject('circle', canvas.width / 2 - 150, canvas.height / 2, {
      radius: 50
    });
    
    // 创建一个三角形
    const trianglePoints = [
      { x: 0, y: -60 },
      { x: -50, y: 40 },
      { x: 50, y: 40 }
    ];
    
    lightEngine.createObject('triangle', canvas.width / 2 + 150, canvas.height / 2, {
      points: trianglePoints
    });
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
    
    // 光源选择
    lightOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentLightType(option.dataset.light);
        audioManager.playUISound('click');
      });
    });
    
    // 物体选择
    objectOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentObjectType(option.dataset.object);
        audioManager.playUISound('click');
      });
    });
    
    // 颜色选择
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        setCurrentColor(option.dataset.color);
        audioManager.playUISound('click');
      });
    });
    
    // 控制按钮
    clearButton.addEventListener('click', () => {
      clearScene();
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
    lightIntensitySlider.addEventListener('input', updateSettings);
    shadowSoftnessSlider.addEventListener('input', updateSettings);
    objectOpacitySlider.addEventListener('input', updateSettings);
    backgroundDarknessSlider.addEventListener('input', updateSettings);
    
    // 复选框
    animationEnabledCheckbox.addEventListener('change', () => {
      lightEngine.updateParams({
        animationEnabled: animationEnabledCheckbox.checked
      });
      audioManager.playUISound('toggle');
    });
    
    soundEnabledCheckbox.addEventListener('change', () => {
      audioManager.setEnabled(soundEnabledCheckbox.checked);
      if (soundEnabledCheckbox.checked) {
        audioManager.playUISound('toggle');
      }
    });
    
    // 窗口大小调整
    window.addEventListener('resize', handleResize);
  }
  
  /**
   * 处理指针按下事件
   */
  function handlePointerDown(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    state.lastX = x;
    state.lastY = y;
    
    // 检查是否点击了现有的光源或物体
    const clickedLight = findLightAtPosition(x, y);
    const clickedObject = findObjectAtPosition(x, y);
    
    if (clickedLight) {
      // 开始拖动光源
      state.isDragging = true;
      state.draggedLight = clickedLight;
      state.draggedObject = null;
      state.dragStartX = x - clickedLight.x;
      state.dragStartY = y - clickedLight.y;
      
      // 播放光源音效
      audioManager.playLightSound(clickedLight.type, x / canvas.width, y / canvas.height, clickedLight.intensity);
    } else if (clickedObject) {
      // 开始拖动物体
      state.isDragging = true;
      state.draggedObject = clickedObject;
      state.draggedLight = null;
      state.dragStartX = x - clickedObject.x;
      state.dragStartY = y - clickedObject.y;
      
      // 播放物体音效
      const size = getObjectSize(clickedObject);
      audioManager.playObjectSound(clickedObject.type, x / canvas.width, y / canvas.height, size);
    } else {
      // 开始创建新对象
      state.isDrawing = true;
      
      if (state.currentObjectType === 'custom') {
        // 如果是自定义形状，开始收集点
        state.customPoints = [{ x, y }];
      } else {
        // 创建新的光源或物体
        createNewElement(x, y);
      }
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
    
    if (state.isDragging) {
      // 拖动现有元素
      if (state.draggedLight) {
        // 更新光源位置
        lightEngine.updateLightPosition(
          state.draggedLight,
          x - state.dragStartX,
          y - state.dragStartY
        );
      } else if (state.draggedObject) {
        // 更新物体位置
        lightEngine.updateObjectPosition(
          state.draggedObject,
          x - state.dragStartX,
          y - state.dragStartY
        );
      }
    } else if (state.isDrawing) {
      if (state.currentObjectType === 'custom') {
        // 如果是自定义形状，添加点
        // 只有当移动足够远时才添加点，以避免点过多
        const lastPoint = state.customPoints[state.customPoints.length - 1];
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
          state.customPoints.push({ x, y });
        }
      } else if (state.currentObjectType !== 'custom') {
        // 调整物体大小
        resizeCurrentObject(x, y);
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
    
    if (state.isDrawing && state.currentObjectType === 'custom' && state.customPoints.length > 2) {
      // 完成自定义形状
      finishCustomShape();
    }
    
    // 重置状态
    state.isDrawing = false;
    state.isDragging = false;
    state.draggedLight = null;
    state.draggedObject = null;
    state.customPoints = [];
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
   * 处理窗口大小调整
   */
  function handleResize() {
    // 调整画布大小
    shadowRenderer.resize();
  }
  
  /**
   * 在指定位置查找光源
   */
  function findLightAtPosition(x, y) {
    // 检查每个光源
    for (const light of lightEngine.lights) {
      if (light.type === 'ambient') continue; // 跳过环境光
      
      const pos = lightEngine.getLightPosition(light);
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 检查是否在光源范围内
      const hitRadius = light.type === 'point' || light.type === 'spot' ? light.radius * 0.3 : 30;
      
      if (distance <= hitRadius) {
        return light;
      }
    }
    
    return null;
  }
  
  /**
   * 在指定位置查找物体
   */
  function findObjectAtPosition(x, y) {
    // 检查每个物体
    for (const object of lightEngine.objects) {
      let isHit = false;
      
      switch (object.type) {
        case 'rectangle':
          // 检查点是否在矩形内
          const halfWidth = object.width / 2;
          const halfHeight = object.height / 2;
          
          isHit = (
            x >= object.x - halfWidth &&
            x <= object.x + halfWidth &&
            y >= object.y - halfHeight &&
            y <= object.y + halfHeight
          );
          break;
        
        case 'circle':
          // 检查点是否在圆内
          const dx = x - object.x;
          const dy = y - object.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          isHit = distance <= object.radius;
          break;
        
        case 'triangle':
        case 'custom':
          // 检查点是否在多边形内
          if (object.points && object.points.length > 2) {
            isHit = isPointInPolygon(
              x, y,
              object.points.map(p => ({
                x: object.x + p.x,
                y: object.y + p.y
              }))
            );
          }
          break;
      }
      
      if (isHit) {
        return object;
      }
    }
    
    return null;
  }
  
  /**
   * 检查点是否在多边形内
   */
  function isPointInPolygon(x, y, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  /**
   * 创建新元素（光源或物体）
   */
  function createNewElement(x, y) {
    // 检查当前工具类型
    if (state.currentLightType && state.currentLightType !== 'none') {
      // 创建新光源
      const light = lightEngine.createLight(
        state.currentLightType,
        x, y,
        state.currentColor
      );
      
      // 播放光源音效
      audioManager.playLightSound(
        state.currentLightType,
        x / canvas.width,
        y / canvas.height,
        light.intensity
      );
      
      // 如果是方向性光源，设置拖动状态以调整方向
      if (state.currentLightType === 'directional' || state.currentLightType === 'spot') {
        state.isDragging = true;
        state.draggedLight = light;
        state.dragStartX = 0;
        state.dragStartY = 0;
      }
    } else if (state.currentObjectType && state.currentObjectType !== 'none') {
      // 创建新物体
      let dimensions;
      
      switch (state.currentObjectType) {
        case 'rectangle':
          dimensions = { width: 10, height: 10 };
          break;
        case 'circle':
          dimensions = { radius: 10 };
          break;
        case 'triangle':
          dimensions = {
            points: [
              { x: 0, y: -10 },
              { x: -8, y: 5 },
              { x: 8, y: 5 }
            ]
          };
          break;
        case 'custom':
          // 自定义形状在鼠标抬起时创建
          return;
      }
      
      const object = lightEngine.createObject(
        state.currentObjectType,
        x, y,
        dimensions
      );
      
      // 设置拖动状态以调整大小
      state.draggedObject = object;
      state.isDragging = false; // 不是拖动，而是调整大小
    }
  }
  
  /**
   * 调整当前物体大小
   */
  function resizeCurrentObject(x, y) {
    if (!state.draggedObject) return;
    
    const object = state.draggedObject;
    const dx = x - object.x;
    const dy = y - object.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    switch (object.type) {
      case 'rectangle':
        // 调整矩形大小
        const width = Math.abs(dx) * 2;
        const height = Math.abs(dy) * 2;
        
        lightEngine.updateObjectDimensions(object, {
          width: Math.max(10, width),
          height: Math.max(10, height)
        });
        break;
      
      case 'circle':
        // 调整圆形半径
        lightEngine.updateObjectDimensions(object, {
          radius: Math.max(5, distance)
        });
        break;
      
      case 'triangle':
        // 调整三角形大小
        const scale = Math.max(0.5, distance / 10);
        const newPoints = [
          { x: 0, y: -10 * scale },
          { x: -8 * scale, y: 5 * scale },
          { x: 8 * scale, y: 5 * scale }
        ];
        
        lightEngine.updateObjectDimensions(object, {
          points: newPoints
        });
        break;
    }
  }
  
  /**
   * 完成自定义形状
   */
  function finishCustomShape() {
    if (state.customPoints.length < 3) return;
    
    // 计算中心点
    let sumX = 0, sumY = 0;
    
    state.customPoints.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    
    const centerX = sumX / state.customPoints.length;
    const centerY = sumY / state.customPoints.length;
    
    // 创建相对于中心点的点数组
    const relativePoints = state.customPoints.map(point => ({
      x: point.x - centerX,
      y: point.y - centerY
    }));
    
    // 创建自定义形状
    const object = lightEngine.createObject(
      'custom',
      centerX, centerY,
      { points: relativePoints }
    );
    
    // 播放物体音效
    audioManager.playObjectSound(
      'custom',
      centerX / canvas.width,
      centerY / canvas.height,
      0.7
    );
  }
  
  /**
   * 获取物体大小（归一化到0-1）
   */
  function getObjectSize(object) {
    switch (object.type) {
      case 'rectangle':
        return Math.min(1, (object.width * object.height) / (canvas.width * canvas.height) * 10);
      case 'circle':
        return Math.min(1, (object.radius * object.radius * Math.PI) / (canvas.width * canvas.height) * 20);
      case 'triangle':
      case 'custom':
        if (!object.points || object.points.length === 0) return 0.5;
        
        // 计算多边形面积的近似值
        let area = 0;
        for (let i = 0; i < object.points.length; i++) {
          const j = (i + 1) % object.points.length;
          area += Math.abs(object.points[i].x * object.points[j].y - object.points[j].x * object.points[i].y);
        }
        area /= 2;
        
        return Math.min(1, area / (canvas.width * canvas.height) * 50);
      default:
        return 0.5;
    }
  }
  
  /**
   * 设置当前光源类型
   */
  function setCurrentLightType(type) {
    state.currentLightType = type;
    state.currentObjectType = 'none';
    
    // 更新UI
    lightOptions.forEach(option => {
      if (option.dataset.light === type) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    objectOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // 更新提示文本
    updateInstructionsText();
  }
  
  /**
   * 设置当前物体类型
   */
  function setCurrentObjectType(type) {
    state.currentObjectType = type;
    state.currentLightType = 'none';
    
    // 更新UI
    objectOptions.forEach(option => {
      if (option.dataset.object === type) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    lightOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // 更新提示文本
    updateInstructionsText();
  }
  
  /**
   * 设置当前颜色
   */
  function setCurrentColor(color) {
    state.currentColor = color;
    
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
   * 更新提示文本
   */
  function updateInstructionsText() {
    let toolText = '';
    
    if (state.currentLightType !== 'none') {
      const lightType = lightEngine.lightTypes[state.currentLightType];
      toolText = lightType ? lightType.name : '光源';
    } else if (state.currentObjectType !== 'none') {
      const objectType = lightEngine.objectTypes[state.currentObjectType];
      toolText = objectType ? objectType.name : '物体';
    } else {
      toolText = '光源和物体';
    }
    
    currentTool.textContent = toolText;
  }
  
  /**
   * 更新设置
   */
  function updateSettings() {
    // 获取滑块值
    const lightIntensity = parseInt(lightIntensitySlider.value) / 100;
    const shadowSoftness = parseInt(shadowSoftnessSlider.value) / 100;
    const objectOpacity = parseInt(objectOpacitySlider.value) / 100;
    const backgroundDarkness = parseInt(backgroundDarknessSlider.value) / 100;
    
    // 更新引擎参数
    lightEngine.updateParams({
      lightIntensity,
      shadowSoftness,
      objectOpacity,
      backgroundDarkness
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
   * 清除场景
   */
  function clearScene() {
    lightEngine.clear();
    
    // 添加默认环境光
    lightEngine.createLight('ambient', 0, 0, '#333333', {
      strength: 0.2
    });
    
    // 播放环境音效
    audioManager.playAmbientSound(0.3);
  }
  
  /**
   * 保存画布
   */
  function saveCanvas() {
    const dataUrl = shadowRenderer.saveAsImage();
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `光绘作品_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.png`;
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
   * 动画循环
   */
  function animate() {
    // 渲染场景
    shadowRenderer.render();
    
    // 继续动画循环
    requestAnimationFrame(animate);
  }
  
  // 初始化应用
  init();
});
