/**
 * 量子弹球 - 游戏核心
 * 负责整合物理引擎、渲染和游戏逻辑的核心模块
 */
class GameCore {
  constructor() {
    // Matter.js 模块
    this.Engine = Matter.Engine;
    this.Render = Matter.Render;
    this.Runner = Matter.Runner;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.Events = Matter.Events;
    
    // 游戏状态
    this.state = {
      isRunning: false,
      isDrawing: false,
      currentTool: 'wall',
      drawPoints: []
    };
    
    // 初始化物理引擎 (使用更保守的默认值)
    this.engine = this.Engine.create({
      gravity: {
        x: 0,
        y: 1,
        scale: 0.0005 // 降低默认重力
      },
      positionIterations: 6, // 增加位置迭代次数以提高稳定性
      velocityIterations: 4  // 增加速度迭代次数以提高稳定性
    });
    
    // 获取画布元素
    this.canvas = document.getElementById('gameCanvas');
    
    // 初始化渲染器
    this.render = this.Render.create({
      element: this.canvas.parentElement,
      engine: this.engine,
      canvas: this.canvas,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        showSleeping: false,
        showDebug: false,
        pixelRatio: window.devicePixelRatio // 适应高DPI屏幕
      }
    });
    
    // 初始化运行器
    this.runner = this.Runner.create({
      isFixed: true, // 使用固定时间步长以提高稳定性
      delta: 1000 / 60 // 目标60FPS
    });
    
    // 子系统引用
    this.ballManager = null;
    this.obstacleManager = null;
    this.audioManager = null;
    this.inputHandler = null;
    
    // 窗口大小调整处理
    this._resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
    
    // 可视化调试标志
    this.debug = false;
  }
  
  /**
   * 初始化游戏
   */
  async init() {
    try {
      // 开始渲染
      this.Render.run(this.render);
      
      console.log('游戏核心初始化完成');
      return true;
    } catch (error) {
      console.error('游戏核心初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 设置子系统
   */
  setManagers(ballManager, obstacleManager, audioManager, inputHandler) {
    this.ballManager = ballManager;
    this.obstacleManager = obstacleManager;
    this.audioManager = audioManager;
    this.inputHandler = inputHandler;
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
    if (this.obstacleManager) {
      this.obstacleManager.updateBoundaries();
    }
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
    if (this.ballManager) {
      this.ballManager.removeAllBalls();
    }
    
    // 移除所有障碍物
    if (this.obstacleManager) {
      this.obstacleManager.removeAllObstacles();
    }
    
    // 重置绘制状态
    this.state.drawPoints = [];
  }
  
  /**
   * 设置绘制模式
   * @param {boolean} isDrawing - 是否进入绘制模式
   */
  setDrawingMode(isDrawing) {
    this.state.isDrawing = isDrawing;
    
    // 重置绘制状态
    this.state.drawPoints = [];
  }
  
  /**
   * 设置当前绘制工具
   * @param {string} tool - 工具名称 (wall, bumper)
   */
  setCurrentTool(tool) {
    this.state.currentTool = tool;
    
    // 重置绘制状态
    this.state.drawPoints = [];
  }
  
  /**
   * 更新物理参数
   * @param {Object} params - 物理参数
   */
  updatePhysics(params) {
    // 更新重力
    if (params.gravity !== undefined) {
      this.engine.gravity.y = params.gravity * 0.001; // 降低重力系数
    }
    
    // 更新弹球物理属性
    if (this.ballManager) {
      this.ballManager.updatePhysicsParams({
        restitution: params.bounce,
        friction: params.friction,
        frictionAir: params.friction * 0.005 // 降低空气摩擦系数
      });
    }
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 移除事件监听器
    window.removeEventListener('resize', this._resizeHandler);
    
    // 停止渲染和物理模拟
    this.Render.stop(this.render);
    this.Runner.stop(this.runner);
    
    // 清理子系统
    if (this.inputHandler) {
      this.inputHandler.cleanup();
    }
    
    if (this.audioManager) {
      this.audioManager.stopAllSounds();
    }
    
    // 清理 Matter.js 世界
    this.World.clear(this.engine.world);
    this.Engine.clear(this.engine);
  }
}
