/**
 * 量子弹球 - 输入处理器
 * 统一处理鼠标和触摸事件
 */
class InputHandler {
  constructor(gameCore) {
    this.gameCore = gameCore;
    this.canvas = gameCore.canvas;
    
    // 输入状态
    this.pointerDown = false;
    this.pointerPosition = { x: 0, y: 0 };
    this.pointerStartPosition = { x: 0, y: 0 };
    
    // 绑定方法
    this._handlePointerDown = this.handlePointerDown.bind(this);
    this._handlePointerMove = this.handlePointerMove.bind(this);
    this._handlePointerUp = this.handlePointerUp.bind(this);
    this._handleContextMenu = this.handleContextMenu.bind(this);
    
    // 设置事件监听器
    this.setupEventListeners();
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this._handlePointerDown);
    this.canvas.addEventListener('mousemove', this._handlePointerMove);
    this.canvas.addEventListener('mouseup', this._handlePointerUp);
    this.canvas.addEventListener('mouseleave', this._handlePointerUp);
    
    // 触摸事件 - 使用 passive 为 true 以提高性能
    this.canvas.addEventListener('touchstart', this._handlePointerDown, { passive: true });
    this.canvas.addEventListener('touchmove', this._handlePointerMove, { passive: true });
    this.canvas.addEventListener('touchend', this._handlePointerUp, { passive: true });
    this.canvas.addEventListener('touchcancel', this._handlePointerUp, { passive: true });
    
    // 阻止右键菜单
    this.canvas.addEventListener('contextmenu', this._handleContextMenu);
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
      this.gameCore.obstacleManager.createBumper(x, y);
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
