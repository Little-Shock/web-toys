/**
 * 量子弹球 - 输入处理器
 * 统一处理鼠标和触摸事件
 * 优化版本：增强移动设备支持
 */
class InputHandler {
  constructor(gameCore) {
    this.gameCore = gameCore;
    this.canvas = gameCore.canvas;

    // 输入状态
    this.pointerDown = false;
    this.pointerPosition = { x: 0, y: 0 };
    this.pointerStartPosition = { x: 0, y: 0 };
    this.lastTapTime = 0; // 用于检测双击/双触
    this.multiTouchActive = false; // 多点触控状态
    this.touchPoints = []; // 多点触控点

    // 移动设备优化
    this.isMobile = gameCore.state.isMobile;
    this.touchSensitivity = this.isMobile ? 1.2 : 1.0; // 移动设备增加触摸灵敏度

    // 绑定方法
    this._handlePointerDown = this.handlePointerDown.bind(this);
    this._handlePointerMove = this.handlePointerMove.bind(this);
    this._handlePointerUp = this.handlePointerUp.bind(this);
    this._handleContextMenu = this.handleContextMenu.bind(this);
    this._handleTouchStart = this.handleTouchStart.bind(this);
    this._handleTouchMove = this.handleTouchMove.bind(this);
    this._handleTouchEnd = this.handleTouchEnd.bind(this);

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (this.isMobile) {
      // 移动设备：使用专门的触摸事件处理
      this.canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
      this.canvas.addEventListener('touchmove', this._handleTouchMove, { passive: false });
      this.canvas.addEventListener('touchend', this._handleTouchEnd, { passive: false });
      this.canvas.addEventListener('touchcancel', this._handleTouchEnd, { passive: false });
    } else {
      // 桌面设备：使用鼠标事件
      this.canvas.addEventListener('mousedown', this._handlePointerDown);
      this.canvas.addEventListener('mousemove', this._handlePointerMove);
      this.canvas.addEventListener('mouseup', this._handlePointerUp);
      this.canvas.addEventListener('mouseleave', this._handlePointerUp);
    }

    // 阻止右键菜单
    this.canvas.addEventListener('contextmenu', this._handleContextMenu);

    // 阻止双击缩放 (移动设备)
    if (this.isMobile) {
      document.addEventListener('dblclick', (e) => {
        e.preventDefault();
      });
    }
  }

  /**
   * 处理触摸开始事件 (移动设备专用)
   */
  handleTouchStart(e) {
    e.preventDefault(); // 阻止默认行为

    // 记录所有触摸点
    this.touchPoints = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));

    // 检测多点触控
    this.multiTouchActive = this.touchPoints.length > 1;

    if (this.touchPoints.length === 1) {
      // 单点触控：正常处理
      const touch = this.touchPoints[0];
      this.pointerDown = true;
      this.pointerPosition = { x: touch.x, y: touch.y };
      this.pointerStartPosition = { x: touch.x, y: touch.y };

      // 检测双击/双触
      const now = performance.now();
      const doubleTapDelay = 300; // 毫秒

      if (now - this.lastTapTime < doubleTapDelay) {
        // 双击/双触：特殊操作 (例如添加多个弹球)
        if (this.gameCore.state.isDrawing) {
          // 绘制模式下的双击操作
        } else {
          // 游戏模式下的双击操作：添加多个弹球
          this.handleMultiBallAdd(touch.x, touch.y);
        }
      } else {
        // 单击：正常处理
        if (this.gameCore.state.isDrawing) {
          this.handleDrawingPointerDown({ x: touch.x, y: touch.y });
        } else {
          this.handleGamePointerDown({ x: touch.x, y: touch.y });
        }
      }

      this.lastTapTime = now;
    } else if (this.touchPoints.length === 2) {
      // 双指触控：特殊操作 (例如缩放或旋转)
      // 在移动设备上可以实现更丰富的交互
    }
  }

  /**
   * 处理触摸移动事件 (移动设备专用)
   */
  handleTouchMove(e) {
    e.preventDefault(); // 阻止默认行为

    // 更新触摸点
    const currentTouches = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));

    if (currentTouches.length === 1 && this.pointerDown) {
      // 单点触控移动
      const touch = currentTouches[0];
      this.pointerPosition = { x: touch.x, y: touch.y };

      if (this.gameCore.state.isDrawing) {
        this.handleDrawingPointerMove({ x: touch.x, y: touch.y });
      }
    } else if (currentTouches.length === 2) {
      // 双指触控移动：特殊操作
      // 例如调整物理参数或创建特殊效果
    }

    // 更新触摸点记录
    this.touchPoints = currentTouches;
  }

  /**
   * 处理触摸结束事件 (移动设备专用)
   */
  handleTouchEnd(e) {
    e.preventDefault(); // 阻止默认行为

    // 检查是否所有触摸都结束了
    if (e.touches.length === 0) {
      this.pointerDown = false;

      if (this.gameCore.state.isDrawing) {
        this.handleDrawingPointerUp();
      }

      this.multiTouchActive = false;
      this.touchPoints = [];
    } else {
      // 更新剩余的触摸点
      this.touchPoints = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      }));
    }
  }

  /**
   * 处理多球添加 (双击/双触功能)
   */
  handleMultiBallAdd(x, y) {
    // 添加多个弹球，形成爆发效果
    const ballCount = 5; // 一次添加5个球
    const spreadFactor = this.isMobile ? 3 : 5; // 移动设备减小扩散范围

    for (let i = 0; i < ballCount; i++) {
      this.gameCore.ballManager.addBall(x, y, {
        velocityX: (Math.random() - 0.5) * spreadFactor,
        velocityY: (Math.random() - 0.5) * spreadFactor
      });
    }
  }

  /**
   * 处理指针按下事件
   */
  handlePointerDown(e) {
    // 统一处理鼠标和触摸事件
    const point = this.getPointerPosition(e);
    if (!point) return;

    this.pointerDown = true;
    this.pointerPosition = point;
    this.pointerStartPosition = { ...point };

    // 根据游戏状态处理事件
    if (this.gameCore.state.isDrawing) {
      this.handleDrawingPointerDown(point);
    } else {
      this.handleGamePointerDown(point);
    }
  }

  /**
   * 处理指针移动事件
   */
  handlePointerMove(e) {
    const point = this.getPointerPosition(e);
    if (!point) return;

    this.pointerPosition = point;

    // 只有在指针按下时才处理移动
    if (this.pointerDown) {
      if (this.gameCore.state.isDrawing) {
        this.handleDrawingPointerMove(point);
      } else {
        // 游戏模式下的移动处理（如果需要）
      }
    }
  }

  /**
   * 处理指针抬起事件
   */
  handlePointerUp(e) {
    if (!this.pointerDown) return;

    this.pointerDown = false;

    // 根据游戏状态处理事件
    if (this.gameCore.state.isDrawing) {
      this.handleDrawingPointerUp();
    } else {
      // 游戏模式下的抬起处理（如果需要）
    }
  }

  /**
   * 处理右键菜单事件
   */
  handleContextMenu(e) {
    e.preventDefault();
    return false;
  }

  /**
   * 获取指针位置
   */
  getPointerPosition(e) {
    let x, y;

    // 处理触摸事件
    if (e.touches) {
      if (e.touches.length === 0) return null;
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
    // 处理鼠标事件
    else {
      x = e.clientX;
      y = e.clientY;
    }

    // 返回坐标
    return { x, y };
  }

  /**
   * 处理绘制模式下的指针按下
   */
  handleDrawingPointerDown(point) {
    const { x, y } = point;
    const tool = this.gameCore.state.currentTool;

    if (tool === 'eraser') {
      // 橡皮擦模式：查找并删除障碍物
      const obstacle = this.gameCore.obstacleManager.findObstacleAt(x, y);
      if (obstacle) {
        this.gameCore.obstacleManager.removeObstacle(obstacle);
      }
    } else if (tool === 'wall') {
      // 墙壁模式：开始绘制墙壁
      this.gameCore.state.drawPoints = [{ x, y }];
    } else if (tool === 'bumper') {
      // 弹射器模式：创建弹射器
      this.gameCore.obstacleManager.createBumper(x, y, {
        color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`
      });
    } else if (tool === 'gravity') {
      // 重力井模式：创建重力井
      this.gameCore.obstacleManager.createGravityWell(x, y);
    } else if (tool === 'portal') {
      // 传送门模式：创建传送门
      this.gameCore.obstacleManager.createPortal(x, y);
    }
  }

  /**
   * 处理绘制模式下的指针移动
   */
  handleDrawingPointerMove(point) {
    const { x, y } = point;
    const tool = this.gameCore.state.currentTool;

    if (tool === 'wall' && this.gameCore.state.drawPoints.length > 0) {
      // 墙壁模式：添加点
      const lastPoint = this.gameCore.state.drawPoints[this.gameCore.state.drawPoints.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 只有当距离足够远时才添加新点
      if (distance > 10) {
        this.gameCore.state.drawPoints.push({ x, y });
      }
    } else if (tool === 'eraser') {
      // 橡皮擦模式：持续删除障碍物
      const obstacle = this.gameCore.obstacleManager.findObstacleAt(x, y);
      if (obstacle) {
        this.gameCore.obstacleManager.removeObstacle(obstacle);
      }
    }
  }

  /**
   * 处理绘制模式下的指针抬起
   */
  handleDrawingPointerUp() {
    const tool = this.gameCore.state.currentTool;

    if (tool === 'wall' && this.gameCore.state.drawPoints.length > 1) {
      // 墙壁模式：完成墙壁绘制
      this.gameCore.obstacleManager.createWall(this.gameCore.state.drawPoints);
      this.gameCore.state.drawPoints = [];
    }
  }

  /**
   * 处理游戏模式下的指针按下
   */
  handleGamePointerDown(point) {
    const { x, y } = point;

    // 添加弹球
    this.gameCore.ballManager.addBall(x, y, {
      velocityX: (Math.random() - 0.5) * 5, // 降低初始速度
      velocityY: (Math.random() - 0.5) * 5
    });
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 移除事件监听器
    this.canvas.removeEventListener('mousedown', this._handlePointerDown);
    this.canvas.removeEventListener('mousemove', this._handlePointerMove);
    this.canvas.removeEventListener('mouseup', this._handlePointerUp);
    this.canvas.removeEventListener('mouseleave', this._handlePointerUp);

    this.canvas.removeEventListener('touchstart', this._handlePointerDown);
    this.canvas.removeEventListener('touchmove', this._handlePointerMove);
    this.canvas.removeEventListener('touchend', this._handlePointerUp);
    this.canvas.removeEventListener('touchcancel', this._handlePointerUp);

    this.canvas.removeEventListener('contextmenu', this._handleContextMenu);
  }
}
