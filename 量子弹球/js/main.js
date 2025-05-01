/**
 * 量子弹球 - 主控制脚本
 * 处理用户交互和界面控制
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素
  const startScreen = document.getElementById('startScreen');
  const startButton = document.getElementById('startButton');
  const ballImageUpload = document.getElementById('ballImageUpload');
  const ballPreview = document.getElementById('ballPreview');
  const previewContainer = document.getElementById('previewContainer');
  const confirmBallBtn = document.getElementById('confirmBallBtn');
  const gameControls = document.getElementById('gameControls');
  const addBallBtn = document.getElementById('addBallBtn');
  const drawModeBtn = document.getElementById('drawModeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const drawTools = document.getElementById('drawTools');
  const toolButtons = document.querySelectorAll('.tool-btn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsMenu = document.getElementById('settingsMenu');
  const gravitySlider = document.getElementById('gravitySlider');
  const bounceSlider = document.getElementById('bounceSlider');
  const frictionSlider = document.getElementById('frictionSlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const soundToggle = document.getElementById('soundToggle');
  const resetButton = document.getElementById('resetButton');
  const changeBallButton = document.getElementById('changeBallButton');
  const drawingInstructions = document.getElementById('drawingInstructions');
  const currentToolText = document.getElementById('currentTool');
  const doneDrawingBtn = document.getElementById('doneDrawingBtn');
  
  // 创建游戏引擎
  const gameEngine = new GameEngine();
  
  // 应用程序状态
  let appState = {
    started: false,
    settingsOpen: false,
    customBallImage: null
  };
  
  /**
   * 初始化应用
   */
  async function init() {
    // 初始化游戏引擎
    await gameEngine.init();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始隐藏游戏控制面板
    gameControls.style.display = 'none';
    drawingInstructions.style.display = 'none';
    drawTools.style.display = 'none';
  }
  
  /**
   * 设置事件监听器
   */
  function setupEventListeners() {
    // 开始按钮
    startButton.addEventListener('click', startGame);
    
    // 弹球图片上传
    ballImageUpload.addEventListener('change', handleBallImageUpload);
    
    // 确认弹球按钮
    confirmBallBtn.addEventListener('click', () => {
      if (appState.customBallImage) {
        gameEngine.setCustomBallImage(appState.customBallImage);
      }
    });
    
    // 添加弹球按钮
    addBallBtn.addEventListener('click', () => {
      const canvas = document.getElementById('gameCanvas');
      gameEngine.ballManager.addBall(
        canvas.width / 2,
        canvas.height / 2,
        {
          velocityX: (Math.random() - 0.5) * 10,
          velocityY: (Math.random() - 0.5) * 10
        }
      );
    });
    
    // 绘制模式按钮
    drawModeBtn.addEventListener('click', toggleDrawMode);
    
    // 清除按钮
    clearBtn.addEventListener('click', () => {
      gameEngine.obstacleManager.removeAllObstacles();
    });
    
    // 工具按钮
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setCurrentTool(btn.dataset.tool);
      });
    });
    
    // 完成绘制按钮
    doneDrawingBtn.addEventListener('click', toggleDrawMode);
    
    // 设置菜单切换
    settingsToggle.addEventListener('click', toggleSettings);
    
    // 滑块控制
    gravitySlider.addEventListener('input', updatePhysics);
    bounceSlider.addEventListener('input', updatePhysics);
    frictionSlider.addEventListener('input', updatePhysics);
    volumeSlider.addEventListener('input', () => {
      gameEngine.audioManager.setVolume(volumeSlider.value / 100);
    });
    
    // 音效切换
    soundToggle.addEventListener('change', () => {
      gameEngine.audioManager.setEnabled(soundToggle.checked);
    });
    
    // 重置按钮
    resetButton.addEventListener('click', () => {
      gameEngine.reset();
    });
    
    // 更换弹球按钮
    changeBallButton.addEventListener('click', () => {
      ballImageUpload.click();
    });
    
    // 窗口失焦时暂停游戏
    window.addEventListener('blur', () => {
      if (appState.started) {
        gameEngine.pause();
      }
    });
    
    // 窗口获得焦点时恢复游戏
    window.addEventListener('focus', () => {
      if (appState.started) {
        gameEngine.start();
      }
    });
  }
  
  /**
   * 处理弹球图片上传
   */
  function handleBallImageUpload(e) {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        // 显示预览
        ballPreview.src = event.target.result;
        previewContainer.style.display = 'flex';
        
        // 保存图像
        appState.customBallImage = event.target.result;
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * 切换绘制模式
   */
  function toggleDrawMode() {
    const isDrawing = !gameEngine.state.isDrawing;
    gameEngine.setDrawingMode(isDrawing);
    
    // 更新UI
    if (isDrawing) {
      drawModeBtn.textContent = '游戏模式';
      drawTools.style.display = 'flex';
      drawingInstructions.style.display = 'flex';
      setCurrentTool(gameEngine.state.currentTool);
    } else {
      drawModeBtn.textContent = '绘制模式';
      drawTools.style.display = 'none';
      drawingInstructions.style.display = 'none';
    }
  }
  
  /**
   * 设置当前工具
   */
  function setCurrentTool(tool) {
    gameEngine.setCurrentTool(tool);
    
    // 更新UI
    toolButtons.forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // 更新提示文本
    const toolNames = {
      wall: '墙壁',
      bumper: '弹射器',
      gravity: '重力井',
      portal: '传送门',
      eraser: '橡皮擦'
    };
    currentToolText.textContent = toolNames[tool] || tool;
  }
  
  /**
   * 切换设置菜单
   */
  function toggleSettings() {
    appState.settingsOpen = !appState.settingsOpen;
    
    if (appState.settingsOpen) {
      settingsMenu.classList.remove('hidden');
    } else {
      settingsMenu.classList.add('hidden');
    }
  }
  
  /**
   * 更新物理参数
   */
  function updatePhysics() {
    const params = {
      gravity: gravitySlider.value / 100,
      bounce: bounceSlider.value / 100,
      friction: frictionSlider.value / 100
    };
    
    gameEngine.updatePhysics(params);
  }
  
  /**
   * 启动游戏
   */
  function startGame() {
    appState.started = true;
    
    // 隐藏开始屏幕
    startScreen.style.display = 'none';
    
    // 显示游戏控制面板
    gameControls.style.display = 'flex';
    
    // 设置自定义弹球图像
    if (appState.customBallImage) {
      gameEngine.setCustomBallImage(appState.customBallImage);
    }
    
    // 开始游戏
    gameEngine.start();
    
    // 添加初始弹球
    const canvas = document.getElementById('gameCanvas');
    gameEngine.ballManager.addBall(
      canvas.width / 2,
      canvas.height / 2,
      {
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: (Math.random() - 0.5) * 10
      }
    );
    
    // 应用初始物理参数
    updatePhysics();
  }
  
  // 初始化应用
  init();
});
