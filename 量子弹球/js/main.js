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
      // 启用调试模式以激活性能监控
      gameCore.debug = true;

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

      // 添加一些默认的障碍物，让游戏更有趣
      addDefaultObstacles();

      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  }

  /**
   * 添加默认障碍物
   */
  function addDefaultObstacles() {
    // 获取画布尺寸
    const canvas = document.getElementById('gameCanvas');
    const width = canvas.width;
    const height = canvas.height;

    // 添加几个弹射器
    obstacleManager.createBumper(width * 0.25, height * 0.25, { color: '#FF5252' });
    obstacleManager.createBumper(width * 0.75, height * 0.25, { color: '#448AFF' });
    obstacleManager.createBumper(width * 0.25, height * 0.75, { color: '#69F0AE' });
    obstacleManager.createBumper(width * 0.75, height * 0.75, { color: '#FFEA00' });

    // 添加一个重力井
    obstacleManager.createGravityWell(width * 0.5, height * 0.5);

    // 添加两个传送门
    obstacleManager.createPortal(width * 0.2, height * 0.5);
    obstacleManager.createPortal(width * 0.8, height * 0.5);
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
      // 隐藏预览容器
      previewContainer.style.display = 'none';

      // 显示提示
      alert('已应用纯色弹球样式');

      // 更新所有现有弹球的颜色
      ballManager.updateBallTextures();
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
      // 显示预览
      previewContainer.style.display = 'flex';

      // 使用纯色圆形作为预览
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      // 绘制渐变圆形
      const gradient = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
      gradient.addColorStop(0, '#6200ea');
      gradient.addColorStop(0.7, '#00b0ff');
      gradient.addColorStop(1, '#ff4081');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2);
      ctx.fill();

      // 设置预览图像
      ballPreview.src = canvas.toDataURL();

      // 显示提示
      alert('为提高性能，当前版本使用纯色弹球，不支持自定义图像');
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
   * 创建分数显示
   */
  function createScoreDisplay() {
    // 创建分数容器
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'scoreContainer';
    scoreContainer.style.position = 'absolute';
    scoreContainer.style.top = '10px';
    scoreContainer.style.left = '10px';
    scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    scoreContainer.style.color = 'white';
    scoreContainer.style.padding = '10px 15px';
    scoreContainer.style.borderRadius = '20px';
    scoreContainer.style.fontSize = '18px';
    scoreContainer.style.fontWeight = 'bold';
    scoreContainer.style.zIndex = '100';
    scoreContainer.style.display = 'flex';
    scoreContainer.style.flexDirection = 'column';
    scoreContainer.style.gap = '5px';

    // 分数显示
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.textContent = '分数: 0';

    // 连击显示
    const comboDisplay = document.createElement('div');
    comboDisplay.id = 'comboDisplay';
    comboDisplay.textContent = '连击: 0';
    comboDisplay.style.fontSize = '14px';
    comboDisplay.style.opacity = '0.8';

    // 添加到容器
    scoreContainer.appendChild(scoreDisplay);
    scoreContainer.appendChild(comboDisplay);

    // 添加到页面
    document.body.appendChild(scoreContainer);

    // 初始化分数
    window.gameScore = {
      score: 0,
      combo: 0,
      lastHitTime: 0,

      // 增加分数
      addScore: function(points) {
        const now = performance.now();
        const timeSinceLastHit = now - this.lastHitTime;

        // 如果在1秒内连续得分，增加连击
        if (timeSinceLastHit < 1000) {
          this.combo++;
        } else {
          this.combo = 1;
        }

        // 根据连击计算分数
        const comboBonus = Math.min(5, this.combo); // 最高5倍
        const finalPoints = points * comboBonus;

        this.score += finalPoints;
        this.lastHitTime = now;

        // 更新显示
        this.updateDisplay();

        // 显示得分动画
        this.showScoreAnimation(finalPoints, comboBonus > 1);
      },

      // 更新显示
      updateDisplay: function() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const comboDisplay = document.getElementById('comboDisplay');

        if (scoreDisplay) {
          scoreDisplay.textContent = `分数: ${this.score}`;
        }

        if (comboDisplay) {
          comboDisplay.textContent = `连击: ${this.combo}`;

          // 连击高亮
          if (this.combo > 1) {
            comboDisplay.style.color = '#FFEA00';
            comboDisplay.style.fontSize = '16px';
            comboDisplay.style.opacity = '1';
          } else {
            comboDisplay.style.color = 'white';
            comboDisplay.style.fontSize = '14px';
            comboDisplay.style.opacity = '0.8';
          }
        }
      },

      // 显示得分动画
      showScoreAnimation: function(points, isCombo) {
        // 创建浮动分数元素
        const floatingScore = document.createElement('div');
        floatingScore.textContent = `+${points}`;
        floatingScore.style.position = 'absolute';
        floatingScore.style.left = `${Math.random() * 50 + 25}%`;
        floatingScore.style.top = `${Math.random() * 30 + 35}%`;
        floatingScore.style.color = isCombo ? '#FFEA00' : 'white';
        floatingScore.style.fontSize = isCombo ? '24px' : '20px';
        floatingScore.style.fontWeight = 'bold';
        floatingScore.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
        floatingScore.style.zIndex = '200';
        floatingScore.style.opacity = '1';
        floatingScore.style.transition = 'all 1s ease-out';

        // 添加到页面
        document.body.appendChild(floatingScore);

        // 动画效果
        setTimeout(() => {
          floatingScore.style.transform = 'translateY(-50px)';
          floatingScore.style.opacity = '0';
        }, 10);

        // 移除元素
        setTimeout(() => {
          document.body.removeChild(floatingScore);
        }, 1000);
      }
    };
  }

  /**
   * 添加特殊障碍物按钮
   */
  function addSpecialObstacleButton() {
    // 创建特殊障碍物按钮
    const addSpecialBtn = document.createElement('button');
    addSpecialBtn.className = 'control-btn special-btn';
    addSpecialBtn.textContent = '添加特殊障碍';
    addSpecialBtn.style.backgroundColor = '#7C4DFF';
    addSpecialBtn.style.marginTop = '10px';
    addSpecialBtn.style.padding = '8px 15px';
    addSpecialBtn.style.borderRadius = '20px';
    addSpecialBtn.style.border = 'none';
    addSpecialBtn.style.color = 'white';
    addSpecialBtn.style.fontWeight = 'bold';
    addSpecialBtn.style.cursor = 'pointer';

    // 添加到控制面板
    const controlPanel = document.querySelector('.game-controls');
    controlPanel.appendChild(addSpecialBtn);

    // 添加点击事件
    addSpecialBtn.addEventListener('click', () => {
      // 随机选择要添加的障碍物类型
      const obstacleTypes = ['bumper', 'gravity', 'portal'];
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

      // 获取画布尺寸
      const canvas = document.getElementById('gameCanvas');

      // 随机位置
      const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1; // 避开边缘
      const y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1; // 避开边缘

      // 根据类型添加不同的障碍物
      if (type === 'bumper') {
        obstacleManager.createBumper(x, y, {
          color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`
        });
      } else if (type === 'gravity') {
        obstacleManager.createGravityWell(x, y);
      } else if (type === 'portal') {
        obstacleManager.createPortal(x, y);
      }
    });
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

    // 添加特殊障碍物按钮
    addSpecialObstacleButton();

    // 创建分数显示
    createScoreDisplay();

    // 不再等待纹理，直接使用纯色渲染
    console.log("使用纯色渲染，无需等待纹理");

    // 开始游戏引擎运行
    gameCore.start();

    // 确保音频上下文已启动（用户交互后）
    audioManager.ensureAudioContext();

    // 添加初始弹球
    const canvas = document.getElementById('gameCanvas');

    // 检测是否为移动设备
    const isMobile = gameCore.state.isMobile;
    console.log(`设备类型: ${isMobile ? '移动设备' : '桌面设备'}`);

    // 更高的初始速度，扩大随机区间
    const minSpeedFactor = isMobile ? 8 : 12;
    const maxSpeedFactor = isMobile ? 15 : 20;

    // 添加更多初始弹球，增加游戏趣味性
    const ballCount = isMobile ? 8 : 12;

    // 创建弹球的函数
    const createBall = (x, y, vx, vy) => {
      return ballManager.addBall(x, y, {
        velocityX: vx,
        velocityY: vy
      });
    };

    // 添加随机位置的弹球
    for (let i = 0; i < ballCount; i++) {
      // 随机位置 - 分散在整个画布上
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;

      // 随机速度 - 更快更有活力，扩大随机区间
      const angle = Math.random() * Math.PI * 2;
      // 在最小和最大速度因子之间随机选择
      const randomSpeedFactor = minSpeedFactor + Math.random() * (maxSpeedFactor - minSpeedFactor);
      const speed = randomSpeedFactor;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const ball = createBall(x, y, vx, vy);

      if (!ball && i === 0) {
        console.error("无法添加初始弹球");
      }
    }

    // 添加一些特殊的弹球组合
    // 1. 对撞的两个球 - 使用最大速度
    createBall(canvas.width * 0.3, canvas.height * 0.5, maxSpeedFactor, 0);
    createBall(canvas.width * 0.7, canvas.height * 0.5, -maxSpeedFactor, 0);

    // 2. 从上方落下的球 - 使用最大速度
    createBall(canvas.width * 0.5, canvas.height * 0.1, 0, maxSpeedFactor);

    // 应用初始物理参数
    updatePhysics();

    // 显示移动设备提示 (如果是移动设备)
    if (isMobile) {
      // 创建提示元素
      const mobileHint = document.createElement('div');
      mobileHint.className = 'mobile-hint';
      mobileHint.textContent = '提示: 双击屏幕可以一次添加多个弹球';
      mobileHint.style.position = 'absolute';
      mobileHint.style.top = '70px';
      mobileHint.style.left = '50%';
      mobileHint.style.transform = 'translateX(-50%)';
      mobileHint.style.background = 'rgba(0, 0, 0, 0.7)';
      mobileHint.style.color = '#fff';
      mobileHint.style.padding = '8px 15px';
      mobileHint.style.borderRadius = '20px';
      mobileHint.style.fontSize = '0.85rem';
      mobileHint.style.zIndex = '100';
      document.body.appendChild(mobileHint);

      // 3秒后自动隐藏
      setTimeout(() => {
        mobileHint.style.opacity = '0';
        mobileHint.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          document.body.removeChild(mobileHint);
        }, 500);
      }, 3000);
    }
  }

  // 初始化应用
  init();
});
