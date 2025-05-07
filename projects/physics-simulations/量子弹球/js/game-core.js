/**
 * 量子弹球 - 游戏核心
 * 负责整合物理引擎、渲染和游戏逻辑的核心模块
 * 优化版本：针对移动设备性能优化
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
      drawPoints: [],
      isMobile: this.detectMobile()
    };

    // 检测设备类型并调整物理参数
    const isMobile = this.state.isMobile;

    // 初始化物理引擎 (针对移动设备优化)
    this.engine = this.Engine.create({
      gravity: {
        x: 0,
        y: 1,
        scale: isMobile ? 0.0003 : 0.0005 // 移动设备降低重力
      },
      positionIterations: isMobile ? 4 : 6, // 移动设备降低迭代次数以提高性能
      velocityIterations: isMobile ? 2 : 4  // 移动设备降低迭代次数以提高性能
    });

    // 获取画布元素
    this.canvas = document.getElementById('gameCanvas');

    // 初始化渲染器 (针对移动设备优化)
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
        pixelRatio: isMobile ? 1 : window.devicePixelRatio // 移动设备降低渲染分辨率
      }
    });

    // 初始化运行器 (针对移动设备优化)
    this.runner = this.Runner.create({
      isFixed: true,
      delta: isMobile ? 1000 / 30 : 1000 / 60 // 移动设备降低目标帧率
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

    // 性能监控
    this.fpsCounter = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
  }

  /**
   * 检测是否为移动设备
   * @returns {boolean} 是否为移动设备
   */
  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      // 开始渲染
      this.Render.run(this.render);

      // 设置性能监控
      if (this.debug) {
        this.setupPerformanceMonitoring();
      }

      console.log('游戏核心初始化完成');
      console.log('设备类型:', this.state.isMobile ? '移动设备' : '桌面设备');
      return true;
    } catch (error) {
      console.error('游戏核心初始化失败:', error);
      return false;
    }
  }

  /**
   * 设置性能监控和游戏循环
   */
  setupPerformanceMonitoring() {
    this.Events.on(this.runner, 'afterTick', () => {
      this.fpsCounter++;

      const now = performance.now();

      // 更新障碍物效果
      if (this.obstacleManager) {
        this.obstacleManager.updateObstacleEffects();
      }

      // 每秒更新FPS计数
      if (now - this.lastFpsUpdate > 1000) {
        this.currentFps = Math.round(this.fpsCounter * 1000 / (now - this.lastFpsUpdate));
        this.fpsCounter = 0;
        this.lastFpsUpdate = now;

        if (this.debug) {
          console.log(`当前FPS: ${this.currentFps}`);
        }
      }
    });
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
    const isMobile = this.state.isMobile;

    // 更新重力 (移动设备使用更小的系数)
    if (params.gravity !== undefined) {
      this.engine.gravity.y = params.gravity * (isMobile ? 0.0007 : 0.001);
    }

    // 更新弹球物理属性 (移动设备优化)
    if (this.ballManager) {
      this.ballManager.updatePhysicsParams({
        restitution: params.bounce,
        friction: params.friction * (isMobile ? 0.8 : 1.0), // 移动设备降低摩擦力
        frictionAir: params.friction * (isMobile ? 0.003 : 0.005) // 移动设备调整空气摩擦
      });
    }

    // 更新引擎参数 (移动设备优化)
    if (isMobile) {
      // 降低迭代次数以提高性能
      this.engine.positionIterations = 4;
      this.engine.velocityIterations = 2;
    } else {
      this.engine.positionIterations = 6;
      this.engine.velocityIterations = 4;
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
