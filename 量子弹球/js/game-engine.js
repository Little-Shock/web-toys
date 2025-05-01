/**
 * 游戏引擎
 * 负责整合物理引擎、渲染器和游戏逻辑
 */
class GameEngine {
  constructor() {
    // Matter.js模块
    this.Engine = Matter.Engine;
    this.Render = Matter.Render;
    this.Runner = Matter.Runner;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    
    // 游戏状态
    this.state = {
      isRunning: false,
      isDrawing: false,
      currentTool: 'wall',
      drawPoints: []
    };
    
    // 初始化物理引擎
    this.engine = this.Engine.create({
      // 默认重力
      gravity: {
        x: 0,
        y: 1,
        scale: 0.001
      }
    });
    
    // 初始化渲染器
    this.render = this.Render.create({
      element: document.getElementById('gameCanvas').parentElement,
      engine: this.engine,
      canvas: document.getElementById('gameCanvas'),
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        showSleeping: false,
        showDebug: false,
        showBroadphase: false,
        showBounds: false,
        showVelocity: false,
        showCollisions: false,
        showAxes: false,
        showPositions: false,
        showAngleIndicator: false,
        showIds: false,
        showShadows: false
      }
    });
    
    // 初始化运行器
    this.runner = this.Runner.create();
    
    // 初始化音频管理器
    this.audioManager = new AudioManager();
    
    // 初始化弹球管理器
    this.ballManager = new BallManager(this.engine, this.render, this.audioManager);
    
    // 初始化障碍物管理器
    this.obstacleManager = new ObstacleManager(this.engine, this.render);
    
    // 绑定事件处理
    this.setupEventListeners();
    
    // 窗口大小调整处理
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * 初始化游戏
   */
  async init() {
    // 初始化音频系统
    await this.audioManager.init();
    
    // 开始渲染
    this.Render.run(this.render);
    
    console.log('游戏引擎初始化完成');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    const canvas = this.render.canvas;
    
    // 鼠标/触摸事件
    canvas.addEventListener('mousedown', e => this.handlePointerDown(e));
    canvas.addEventListener('mousemove', e => this.handlePointerMove(e));
    canvas.addEventListener('mouseup', e => this.handlePointerUp(e));
    canvas.addEventListener('mouseleave', e => this.handlePointerUp(e));
    
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.handlePointerDown({
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY,
          button: 0
        });
      }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.handlePointerMove({
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
      }
    }, { passive: false });
    
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this.handlePointerUp({});
    }, { passive: false });
    
    // 阻止右键菜单
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * 处理指针按下事件
   */
  handlePointerDown(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    if (this.state.isDrawing) {
      // 绘制模式
      if (this.state.currentTool === 'eraser') {
        // 橡皮擦模式：查找并删除障碍物
        const obstacle = this.obstacleManager.findObstacleAt(x, y);
        if (obstacle) {
          this.obstacleManager.removeObstacle(obstacle);
        }
      } else if (this.state.currentTool === 'wall') {
        // 墙壁模式：开始绘制墙壁
        this.state.drawPoints = [{ x, y }];
      } else if (this.state.currentTool === 'bumper') {
        // 弹射器模式：创建弹射器
        this.obstacleManager.createBumper(x, y);
      } else if (this.state.currentTool === 'gravity') {
        // 重力井模式：创建重力井
        this.obstacleManager.createGravityWell(x, y);
      } else if (this.state.currentTool === 'portal') {
        // 传送门模式：创建传送门对
        if (!this.state.portalStart) {
          // 记录第一个传送门位置
          this.state.portalStart = { x, y };
        } else {
          // 创建传送门对
          this.obstacleManager.createPortalPair(
            this.state.portalStart.x,
            this.state.portalStart.y,
            x, y
          );
          // 重置传送门起点
          this.state.portalStart = null;
        }
      }
    } else {
      // 游戏模式：添加弹球
      this.ballManager.addBall(x, y, {
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: (Math.random() - 0.5) * 10
      });
    }
  }

  /**
   * 处理指针移动事件
   */
  handlePointerMove(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    if (this.state.isDrawing && this.state.drawPoints.length > 0) {
      if (this.state.currentTool === 'wall') {
        // 墙壁模式：添加点
        const lastPoint = this.state.drawPoints[this.state.drawPoints.length - 1];
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 只有当距离足够远时才添加新点
        if (distance > 10) {
          this.state.drawPoints.push({ x, y });
        }
      } else if (this.state.currentTool === 'eraser') {
        // 橡皮擦模式：持续删除障碍物
        const obstacle = this.obstacleManager.findObstacleAt(x, y);
        if (obstacle) {
          this.obstacleManager.removeObstacle(obstacle);
        }
      }
    }
  }

  /**
   * 处理指针抬起事件
   */
  handlePointerUp(e) {
    if (this.state.isDrawing && this.state.currentTool === 'wall' && this.state.drawPoints.length > 1) {
      // 墙壁模式：完成墙壁绘制
      this.obstacleManager.createWall(this.state.drawPoints);
      this.state.drawPoints = [];
    }
  }

  /**
   * 处理窗口大小调整
   */
  handleResize() {
    // 更新渲染器尺寸
    this.render.options.width = window.innerWidth;
    this.render.options.height = window.innerHeight;
    this.render.canvas.width = window.innerWidth;
    this.render.canvas.height = window.innerHeight;
    
    // 更新边界墙
    this.obstacleManager.updateBoundaries();
  }

  /**
   * 开始游戏
   */
  start() {
    if (!this.state.isRunning) {
      this.Runner.run(this.runner, this.engine);
      this.state.isRunning = true;
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (this.state.isRunning) {
      this.Runner.stop(this.runner);
      this.state.isRunning = false;
    }
  }

  /**
   * 重置游戏
   */
  reset() {
    // 移除所有弹球
    this.ballManager.removeAllBalls();
    
    // 移除所有障碍物
    this.obstacleManager.removeAllObstacles();
    
    // 重置绘制状态
    this.state.drawPoints = [];
    this.state.portalStart = null;
  }

  /**
   * 设置绘制模式
   * @param {boolean} isDrawing - 是否进入绘制模式
   */
  setDrawingMode(isDrawing) {
    this.state.isDrawing = isDrawing;
    
    // 重置绘制状态
    this.state.drawPoints = [];
    this.state.portalStart = null;
  }

  /**
   * 设置当前绘制工具
   * @param {string} tool - 工具名称 (wall, bumper, gravity, portal, eraser)
   */
  setCurrentTool(tool) {
    this.state.currentTool = tool;
    
    // 重置绘制状态
    this.state.drawPoints = [];
    this.state.portalStart = null;
  }

  /**
   * 更新物理参数
   * @param {Object} params - 物理参数
   */
  updatePhysics(params) {
    // 更新重力
    if (params.gravity !== undefined) {
      this.engine.gravity.y = params.gravity * 0.002;
    }
    
    // 更新弹球物理属性
    this.ballManager.updatePhysicsParams({
      restitution: params.bounce,
      friction: params.friction,
      frictionAir: params.friction * 0.01
    });
  }

  /**
   * 设置自定义弹球图像
   * @param {string|Image} image - 图像源
   */
  async setCustomBallImage(image) {
    await this.ballManager.setCustomBallImage(image);
    this.ballManager.updateBallTextures();
  }
}
