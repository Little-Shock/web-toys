/**
 * 工具管理器
 * 管理用户交互工具
 */
class ToolManager {
  /**
   * 创建工具管理器
   * @param {SandPhysics} physics - 沙粒物理系统
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 配置选项
   */
  constructor(physics, container, options = {}) {
    this.physics = physics;
    this.container = container;

    // 配置参数
    this.params = {
      defaultTool: options.defaultTool || 'pour',
      defaultColor: options.defaultColor || 'gold',
      pourRate: options.pourRate || 15, // 增加每帧倾倒的粒子数量
      digRadius: options.digRadius || 40, // 增大挖掘半径
      digStrength: options.digStrength || 1.2, // 增强挖掘强度
      smoothRadius: options.smoothRadius || 50, // 增大平滑半径
      smoothStrength: options.smoothStrength || 0.8,
      shakeRadius: options.shakeRadius || 60, // 增大震动半径
      shakeStrength: options.shakeStrength || 0.8, // 增强震动强度
      vibrationEnabled: options.vibrationEnabled !== undefined ? options.vibrationEnabled : true,
      soundEnabled: options.soundEnabled !== undefined ? options.soundEnabled : true
    };

    // 工具状态
    this.currentTool = this.params.defaultTool;
    this.currentColor = this.params.defaultColor;
    this.isActive = false;
    this.lastPosition = { x: 0, y: 0 };
    this.pointerPosition = { x: 0, y: 0 };
    this.pointerDown = false;
    this.lastPourTime = 0;
    this.pourInterval = 50; // 倾倒间隔（毫秒）

    // 颜色映射 - 更鲜艳的颜色
    this.colorMap = {
      gold: { color: '#ffea00', glow: 1.2 },  // 更亮的金色
      blue: { color: '#00a2ff', glow: 1.4 },  // 更鲜艳的蓝色
      green: { color: '#00ff9d', glow: 1.1 }, // 更鲜艳的绿色
      purple: { color: '#d400ff', glow: 1.5 }, // 更鲜艳的紫色
      red: { color: '#ff3a3a', glow: 1.3 }    // 更鲜艳的红色
    };

    // 工具元素
    this.toolButtons = container.querySelectorAll('.tool-btn');
    this.colorButtons = container.querySelectorAll('.color-btn');
    this.clearButton = container.querySelector('#clearBtn');

    // 初始化
    this._init();
  }

  /**
   * 初始化工具管理器
   * @private
   */
  _init() {
    // 设置默认工具
    this.setTool(this.params.defaultTool);

    // 设置默认颜色
    this.setColor(this.params.defaultColor);

    // 添加工具按钮事件监听器
    this.toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.setTool(button.dataset.tool);
      });
    });

    // 添加颜色按钮事件监听器
    this.colorButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.setColor(button.dataset.color);
      });
    });

    // 添加清除按钮事件监听器
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => {
        this.clearSand();
      });
    }

    // 添加容器交互事件
    this._setupInteractions();
  }

  /**
   * 设置交互事件
   * @private
   */
  _setupInteractions() {
    const canvas = this.container.querySelector('#sandCanvas');
    if (!canvas) return;

    // 获取画布相对于视口的位置
    const getCanvasPosition = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    // 鼠标/触摸事件处理
    const handlePointerDown = (e) => {
      e.preventDefault();

      const position = getCanvasPosition(
        e.touches ? e.touches[0].clientX : e.clientX,
        e.touches ? e.touches[0].clientY : e.clientY
      );

      this.pointerDown = true;
      this.pointerPosition = position;
      this.lastPosition = position;

      // 立即应用工具
      this._applyTool(position.x, position.y);

      // 触发振动反馈
      this._triggerVibration('start');
    };

    const handlePointerMove = (e) => {
      e.preventDefault();

      if (!this.pointerDown) return;

      const position = getCanvasPosition(
        e.touches ? e.touches[0].clientX : e.clientX,
        e.touches ? e.touches[0].clientY : e.clientY
      );

      this.pointerPosition = position;

      // 计算移动距离
      const dx = position.x - this.lastPosition.x;
      const dy = position.y - this.lastPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 如果移动距离足够大，应用工具
      if (distance > 5) {
        this._applyTool(position.x, position.y);
        this.lastPosition = position;
      }
    };

    const handlePointerUp = (e) => {
      e.preventDefault();

      this.pointerDown = false;

      // 触发振动反馈
      this._triggerVibration('end');
    };

    // 添加事件监听器
    if (isTouchDevice()) {
      canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
      canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
      canvas.addEventListener('touchend', handlePointerUp, { passive: false });
      canvas.addEventListener('touchcancel', handlePointerUp, { passive: false });
    } else {
      canvas.addEventListener('mousedown', handlePointerDown);
      canvas.addEventListener('mousemove', handlePointerMove);
      canvas.addEventListener('mouseup', handlePointerUp);
      canvas.addEventListener('mouseleave', handlePointerUp);
    }
  }

  /**
   * 应用当前工具
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @private
   */
  _applyTool(x, y) {
    const colorInfo = this.colorMap[this.currentColor] || this.colorMap.gold;

    switch (this.currentTool) {
      case 'pour':
        this._pourSand(x, y, colorInfo);
        break;
      case 'dig':
        this._digSand(x, y);
        break;
      case 'smooth':
        this._smoothSand(x, y);
        break;
      case 'shake':
        this._shakeSand(x, y);
        break;
    }
  }

  /**
   * 倾倒沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {Object} colorInfo - 颜色信息
   * @private
   */
  _pourSand(x, y, colorInfo) {
    const now = Date.now();

    // 限制倾倒频率
    if (now - this.lastPourTime < this.pourInterval) return;

    this.lastPourTime = now;

    // 创建沙粒
    const count = this.params.pourRate;

    // 随机选择粒子类型，有小概率创建特殊粒子
    const particleType = Math.random() < 0.2 ?
                        ['light', 'glowing', 'bouncy'][Math.floor(Math.random() * 3)] :
                        'normal';

    const options = {
      color: colorInfo.color,
      glow: colorInfo.glow * 1.2, // 增强发光效果
      radius: this.physics.params.particleSize * random(0.9, 1.1), // 随机化粒子大小
      initialSpeed: random(1.5, 2.5), // 增加初始速度
      type: particleType
    };

    this.physics.pourSand(x, y, count, options);

    // 触发振动反馈
    this._triggerVibration('pour');
  }

  /**
   * 挖掘沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @private
   */
  _digSand(x, y) {
    const radius = this.params.digRadius;
    const strength = this.params.digStrength;

    const affectedCount = this.physics.digSand(x, y, radius, strength);

    // 只有当有粒子受影响时才触发振动
    if (affectedCount > 0) {
      this._triggerVibration('dig');
    }
  }

  /**
   * 平滑沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @private
   */
  _smoothSand(x, y) {
    const radius = this.params.smoothRadius;
    const strength = this.params.smoothStrength;

    const affectedCount = this.physics.smoothSand(x, y, radius, strength);

    // 只有当有粒子受影响时才触发振动
    if (affectedCount > 0) {
      this._triggerVibration('smooth');
    }
  }

  /**
   * 震动沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @private
   */
  _shakeSand(x, y) {
    const radius = this.params.shakeRadius;
    const strength = this.params.shakeStrength;

    const affectedCount = this.physics.shakeSand(x, y, radius, strength);

    // 只有当有粒子受影响时才触发振动
    if (affectedCount > 0) {
      this._triggerVibration('shake');
    }
  }

  /**
   * 触发振动反馈
   * @param {string} type - 振动类型
   * @private
   */
  _triggerVibration(type) {
    if (!this.params.vibrationEnabled || !('vibrate' in navigator)) return;

    switch (type) {
      case 'start':
        navigator.vibrate(20);
        break;
      case 'end':
        navigator.vibrate(10);
        break;
      case 'pour':
        navigator.vibrate(5);
        break;
      case 'dig':
        navigator.vibrate([10, 10, 10]);
        break;
      case 'smooth':
        navigator.vibrate(15);
        break;
      case 'shake':
        navigator.vibrate([5, 10, 5, 10, 5]);
        break;
    }
  }

  /**
   * 设置当前工具
   * @param {string} tool - 工具名称
   */
  setTool(tool) {
    if (this.currentTool === tool) return;

    this.currentTool = tool;

    // 更新工具按钮状态
    this.toolButtons.forEach(button => {
      if (button.dataset.tool === tool) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // 更新指令面板
    const instructionsPanel = document.getElementById('instructionsPanel');
    if (instructionsPanel) {
      let instruction = '';

      switch (tool) {
        case 'pour':
          instruction = '触摸屏幕倾倒发光沙粒';
          break;
        case 'dig':
          instruction = '触摸屏幕挖掘沙粒';
          break;
        case 'smooth':
          instruction = '触摸屏幕平滑沙粒';
          break;
        case 'shake':
          instruction = '触摸屏幕震动沙粒';
          break;
      }

      instructionsPanel.querySelector('p').textContent = instruction;
    }

    // 触发振动反馈
    this._triggerVibration('start');
  }

  /**
   * 设置当前颜色
   * @param {string} color - 颜色名称
   */
  setColor(color) {
    if (this.currentColor === color) return;

    this.currentColor = color;

    // 更新颜色按钮状态
    this.colorButtons.forEach(button => {
      if (button.dataset.color === color) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // 触发振动反馈
    this._triggerVibration('start');
  }

  /**
   * 清除所有沙粒
   */
  clearSand() {
    this.physics.clear();

    // 触发振动反馈
    if (this.params.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([20, 30, 20]);
    }

    // 显示提示消息
    showToast('已清空沙盘');
  }

  /**
   * 设置工具参数
   * @param {string} param - 参数名称
   * @param {any} value - 参数值
   */
  setParam(param, value) {
    if (param in this.params) {
      this.params[param] = value;
    }
  }

  /**
   * 启用或禁用振动反馈
   * @param {boolean} enabled - 是否启用
   */
  setVibration(enabled) {
    this.params.vibrationEnabled = enabled;
  }

  /**
   * 启用或禁用音效
   * @param {boolean} enabled - 是否启用
   */
  setSound(enabled) {
    this.params.soundEnabled = enabled;
  }

  /**
   * 获取当前工具
   * @returns {string} 当前工具名称
   */
  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * 获取当前颜色
   * @returns {string} 当前颜色名称
   */
  getCurrentColor() {
    return this.currentColor;
  }

  /**
   * 获取颜色信息
   * @param {string} colorName - 颜色名称
   * @returns {Object} 颜色信息
   */
  getColorInfo(colorName) {
    return this.colorMap[colorName] || this.colorMap.gold;
  }
}
