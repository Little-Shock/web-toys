/**
 * 沙粒粒子类
 * 表示单个沙粒，具有物理属性和渲染属性
 */
class SandParticle {
  /**
   * 创建一个沙粒粒子
   * @param {number} x - 初始x坐标
   * @param {number} y - 初始y坐标
   * @param {Object} options - 配置选项
   */
  constructor(x, y, options = {}) {
    // 位置和速度
    this.x = x;
    this.y = y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;

    // 物理属性
    this.mass = options.mass || random(0.8, 1.2);
    this.radius = options.radius || random(2.5, 3.5); // 增大粒子半径
    this.friction = options.friction || 0.97;
    this.restitution = options.restitution || 0.3; // 弹性系数

    // 渲染属性
    this.baseColor = options.color || '#ffdc73';
    this.color = this.baseColor;
    this.opacity = options.opacity || random(0.8, 1.0);
    this.glow = options.glow || random(0.5, 1.0);

    // 特殊属性
    this.type = options.type || 'normal'; // normal, light, heavy, bouncy
    this.energy = options.energy || random(0.5, 1.0); // 用于发光效果
    this.lifespan = options.lifespan || Infinity;
    this.age = 0;

    // 状态标志
    this.isActive = true;
    this.isStatic = false;
    this.isResting = false;
    this.restTime = 0;
    this.lastX = x;
    this.lastY = y;

    // 根据类型设置特性
    this._initializeByType();
  }

  /**
   * 根据粒子类型初始化特性
   * @private
   */
  _initializeByType() {
    switch (this.type) {
      case 'light':
        this.mass *= 0.7;
        this.friction = 0.98;
        this.glow *= 1.5;
        break;
      case 'heavy':
        this.mass *= 1.5;
        this.friction = 0.95;
        this.glow *= 0.7;
        break;
      case 'bouncy':
        this.restitution = 0.7;
        this.friction = 0.98;
        break;
      case 'glowing':
        this.glow *= 2.0;
        this.energy *= 1.5;
        break;
    }
  }

  /**
   * 更新粒子状态
   * @param {number} dt - 时间步长
   * @param {Object} bounds - 边界 {width, height}
   * @param {Object} gravity - 重力向量 {x, y}
   */
  update(dt, bounds, gravity) {
    if (!this.isActive || this.isStatic) return;

    // 保存上一帧位置
    this.lastX = this.x;
    this.lastY = this.y;

    // 应用重力
    this.vx += gravity.x * this.mass * dt;
    this.vy += gravity.y * this.mass * dt;

    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 更新位置
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 边界碰撞检测
    this._handleBoundaryCollisions(bounds);

    // 检查是否静止
    this._checkIfResting();

    // 更新生命周期
    this.age += dt;
    if (this.age >= this.lifespan) {
      this.isActive = false;
    }

    // 更新发光效果
    this._updateGlowEffect();
  }

  /**
   * 处理边界碰撞
   * @param {Object} bounds - 边界 {width, height}
   * @private
   */
  _handleBoundaryCollisions(bounds) {
    // 左边界
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * this.restitution;
    }
    // 右边界
    else if (this.x + this.radius > bounds.width) {
      this.x = bounds.width - this.radius;
      this.vx = -Math.abs(this.vx) * this.restitution;
    }

    // 上边界
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy) * this.restitution;
    }
    // 下边界
    else if (this.y + this.radius > bounds.height) {
      this.y = bounds.height - this.radius;
      this.vy = -Math.abs(this.vy) * this.restitution;
    }
  }

  /**
   * 检查粒子是否静止
   * @private
   */
  _checkIfResting() {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    if (speed < 0.05) {
      this.restTime++;
      if (this.restTime > 10) {
        this.isResting = true;
      }
    } else {
      this.isResting = false;
      this.restTime = 0;
    }
  }

  /**
   * 更新发光效果
   * @private
   */
  _updateGlowEffect() {
    // 根据能量和速度更新发光强度
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const energyFactor = this.energy * (0.5 + 0.5 * Math.sin(this.age * 0.1));
    this.glow = clamp(this.glow * 0.95 + speed * 0.05 + energyFactor * 0.1, 0.5, 2.0);
  }

  /**
   * 应用力
   * @param {number} fx - x方向力
   * @param {number} fy - y方向力
   */
  applyForce(fx, fy) {
    if (this.isStatic) return;

    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
    this.isResting = false;
    this.restTime = 0;
  }

  /**
   * 应用冲击力
   * @param {number} x - 冲击点x坐标
   * @param {number} y - 冲击点y坐标
   * @param {number} strength - 冲击强度
   */
  applyImpulse(x, y, strength) {
    if (this.isStatic) return;

    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const impact = strength / (dist * dist + 1) / this.mass;

    this.vx += nx * impact;
    this.vy += ny * impact;
    this.isResting = false;
    this.restTime = 0;
  }

  /**
   * 设置粒子颜色
   * @param {string} color - 颜色值
   */
  setColor(color) {
    this.baseColor = color;
    this.color = color;
  }

  /**
   * 设置粒子类型
   * @param {string} type - 粒子类型
   */
  setType(type) {
    this.type = type;
    this._initializeByType();
  }

  /**
   * 设置粒子为静态
   * @param {boolean} isStatic - 是否静态
   */
  setStatic(isStatic) {
    this.isStatic = isStatic;
    if (isStatic) {
      this.vx = 0;
      this.vy = 0;
    }
  }

  /**
   * 检查是否与另一个粒子碰撞
   * @param {SandParticle} other - 另一个粒子
   * @returns {boolean} 是否碰撞
   */
  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + other.radius;
  }

  /**
   * 解决与另一个粒子的碰撞
   * @param {SandParticle} other - 另一个粒子
   */
  resolveCollision(other) {
    if (this.isStatic && other.isStatic) return;

    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0 || dist > this.radius + other.radius) return;

    // 碰撞法线
    const nx = dx / dist;
    const ny = dy / dist;

    // 重叠距离
    const overlap = (this.radius + other.radius) - dist;

    // 分离粒子
    const totalMass = this.mass + other.mass;
    const ratio1 = this.isStatic ? 0 : other.mass / totalMass;
    const ratio2 = other.isStatic ? 0 : this.mass / totalMass;

    this.x -= nx * overlap * ratio1;
    this.y -= ny * overlap * ratio1;
    other.x += nx * overlap * ratio2;
    other.y += ny * overlap * ratio2;

    // 计算相对速度
    const vrx = other.vx - this.vx;
    const vry = other.vy - this.vy;

    // 计算相对速度在碰撞法线上的投影
    const vrDotN = vrx * nx + vry * ny;

    // 如果粒子正在分离，不需要计算冲量
    if (vrDotN > 0) return;

    // 计算冲量
    const restitution = Math.min(this.restitution, other.restitution);
    const j = -(1 + restitution) * vrDotN;
    const impulse1 = this.isStatic ? 0 : j / totalMass;
    const impulse2 = other.isStatic ? 0 : j / totalMass;

    // 应用冲量
    this.vx -= nx * impulse1 * other.mass;
    this.vy -= ny * impulse1 * other.mass;
    other.vx += nx * impulse2 * this.mass;
    other.vy += ny * impulse2 * this.mass;

    // 重置静止状态
    this.isResting = false;
    other.isResting = false;
    this.restTime = 0;
    other.restTime = 0;
  }

  /**
   * 绘制粒子
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {Object} options - 渲染选项
   */
  draw(ctx, options = {}) {
    if (!this.isActive) return;

    const { showGlow = true, quality = 'medium' } = options;

    // 保存上下文
    ctx.save();

    // 设置合成模式
    ctx.globalCompositeOperation = 'lighter';

    // 绘制发光效果
    if (showGlow && this.glow > 0.1) {
      // 增强发光效果
      const glowSize = this.radius * (1 + this.glow * 3); // 增大发光范围
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.3, // 更小的内圈
        this.x, this.y, glowSize
      );

      // 解析颜色
      const r = parseInt(this.color.substring(1, 3), 16);
      const g = parseInt(this.color.substring(3, 5), 16);
      const b = parseInt(this.color.substring(5, 7), 16);

      // 创建更亮的渐变
      const innerOpacity = Math.min(1.0, this.opacity * 1.2); // 增强内部亮度
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${innerOpacity})`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // 添加额外的高光点
      if (quality !== 'low') {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 绘制粒子主体 - 使用更清晰的边缘
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 添加边缘高光，使粒子看起来更清晰
    if (quality !== 'low') {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 恢复上下文
    ctx.restore();
  }
}
