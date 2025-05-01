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

  // 创建游戏核心
  const gameCore = new GameCore();

  // 创建子系统
  const audioManager = new AudioManager();
  const ballManager = new BallManager(gameCore);
  const obstacleManager = new ObstacleManager(gameCore);
  const inputHandler = new InputHandler(gameCore);

  // 设置子系统
  gameCore.setManagers(ballManager, obstacleManager, audioManager, inputHandler);

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
    try {
      // 初始化游戏核心
      await gameCore.init();

      // 初始化音频系统
      await audioManager.init();

      // 设置事件监听器
      setupEventListeners();

      // 初始隐藏游戏控制面板
      gameControls.style.display = 'none';
      drawingInstructions.style.display = 'none';
      drawTools.style.display = 'none';

      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
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
    confirmBallBtn.addEventListener('click', async () => {
      if (appState.customBallImage) {
        confirmBallBtn.textContent = '处理中...';
        confirmBallBtn.disabled = true;
        try {
          await ballManager.setCustomBallImage(appState.customBallImage);
          console.log("自定义弹球设置成功");
        } catch (error) {
          console.error("设置自定义弹球失败:", error);
        } finally {
          confirmBallBtn.textContent = '确认使用';
          confirmBallBtn.disabled = false;
        }
      } else {
        console.log("没有选择自定义弹球图片");
      }
    });

    // 添加弹球按钮
    addBallBtn.addEventListener('click', () => {
      const canvas = document.getElementById('gameCanvas');
      ballManager.addBall(
        canvas.width / 2,
        canvas.height / 2,
        {
          velocityX: (Math.random() - 0.5) * 5, // 降低初始速度
          velocityY: (Math.random() - 0.5) * 5
        }
      );

      // 确保音频上下文已启动（用户交互后）
      audioManager.ensureAudioContext();
    });

    // 绘制模式按钮
    drawModeBtn.addEventListener('click', toggleDrawMode);

    // 清除按钮
    clearBtn.addEventListener('click', () => {
      obstacleManager.removeAllObstacles();
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
      audioManager.setVolume(volumeSlider.value / 100);
    });

    // 音效切换
    soundToggle.addEventListener('change', () => {
      audioManager.setEnabled(soundToggle.checked);
    });

    // 重置按钮
    resetButton.addEventListener('click', () => {
      gameCore.reset();
    });

    // 更换弹球按钮
    changeBallButton.addEventListener('click', () => {
      ballImageUpload.click();
    });

    // 窗口失焦时暂停游戏
    window.addEventListener('blur', () => {
      if (appState.started) {
        gameCore.pause();
      }
    });

    // 窗口获得焦点时恢复游戏
    window.addEventListener('focus', () => {
      if (appState.started) {
        gameCore.start();
      }
    });

    // 页面关闭或刷新前清理资源
    window.addEventListener('beforeunload', () => {
      if (gameCore) {
        gameCore.cleanup();
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
    const isDrawing = !gameCore.state.isDrawing;
    gameCore.setDrawingMode(isDrawing);

    // 更新UI
    if (isDrawing) {
      drawModeBtn.textContent = '游戏模式';
      drawTools.style.display = 'flex';
      drawingInstructions.style.display = 'flex';
      setCurrentTool(gameCore.state.currentTool);
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
    gameCore.setCurrentTool(tool);

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

    gameCore.updatePhysics(params);
  }

  /**
   * 启动游戏
   */
  async function startGame() {
    appState.started = true;

    // 隐藏开始屏幕
    startScreen.style.display = 'none';

    // 显示游戏控制面板
    gameControls.style.display = 'flex';

    // 等待纹理就绪
    try {
      await ballManager.awaitTexture();
      console.log("纹理已就绪");
    } catch (error) {
      console.error("等待纹理时出错:", error);
    }

    // 开始游戏引擎运行
    gameCore.start();

    // 确保音频上下文已启动（用户交互后）
    audioManager.ensureAudioContext();

    // 添加初始弹球
    const canvas = document.getElementById('gameCanvas');
    const initialBall = ballManager.addBall(
      canvas.width / 2,
      canvas.height / 2,
      {
        velocityX: (Math.random() - 0.5) * 5,
        velocityY: (Math.random() - 0.5) * 5
      }
    );

    if (!initialBall) {
      console.error("无法添加初始弹球");
    }

    // 应用初始物理参数
    updatePhysics();
  }

  // 初始化应用
  init();
});
