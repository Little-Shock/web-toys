/**
 * 天体类
 * 表示一个具有质量、位置和速度的天体
 */
class CelestialBody {
  /**
   * 创建一个天体
   * @param {Object} options - 配置选项
   * @param {number} options.mass - 天体质量
   * @param {Object} options.position - 初始位置 {x, y, z}
   * @param {Object} options.velocity - 初始速度 {x, y, z}
   * @param {string} options.color - 天体颜色
   * @param {number} options.temperature - 天体温度（可选）
   * @param {string} options.name - 天体名称（可选）
   */
  constructor(options) {
    this.mass = options.mass || 1.0;
    this.position = { ...options.position } || { x: 0, y: 0, z: 0 };
    this.velocity = { ...options.velocity } || { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.force = { x: 0, y: 0, z: 0 };
    
    // 视觉属性
    this.baseColor = options.color || '#ffffff';
    this.temperature = options.temperature || 5778 * Math.pow(this.mass, 0.5); // 基于质量估算温度
    this.name = options.name || '';
    
    // 计算颜色（如果没有提供）
    if (!options.color) {
      const colorInfo = getStarColor(this.mass, this.temperature);
      this.baseColor = colorInfo.hex;
    }
    
    // 计算视觉大小（基于质量）
    this.radius = Math.pow(this.mass, 1/3) * 0.5; // 简化的质量-半径关系
    
    // 轨迹相关
    this.trail = [];
    this.maxTrailLength = 500; // 默认轨迹长度
    this.trailUpdateInterval = 5; // 每隔多少帧更新一次轨迹
    this.frameCount = 0;
    
    // 3D对象引用（由SceneManager设置）
    this.object3D = null;
    
    // 历史状态（用于数值积分）
    this.previousPosition = { ...this.position };
    this.previousVelocity = { ...this.velocity };
    
    // 粒子效果
    this.particleEmissionRate = Math.pow(this.mass, 0.5) * 0.5; // 基于质量的粒子发射率
    this.particleLifetime = 1.0; // 粒子生命周期（秒）
    
    // 状态标志
    this.isActive = true;
    this.isColliding = false;
  }
  
  /**
   * 重置力和加速度
   */
  resetForce() {
    this.force.x = 0;
    this.force.y = 0;
    this.force.z = 0;
    
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;
  }
  
  /**
   * 应用力
   * @param {Object} force - 力向量 {x, y, z}
   */
  applyForce(force) {
    this.force.x += force.x;
    this.force.y += force.y;
    this.force.z += force.z;
  }
  
  /**
   * 计算加速度
   */
  calculateAcceleration() {
    this.acceleration.x = this.force.x / this.mass;
    this.acceleration.y = this.force.y / this.mass;
    this.acceleration.z = this.force.z / this.mass;
  }
  
  /**
   * 更新速度（使用欧拉积分）
   * @param {number} dt - 时间步长
   */
  updateVelocity(dt) {
    this.previousVelocity = { ...this.velocity };
    
    this.velocity.x += this.acceleration.x * dt;
    this.velocity.y += this.acceleration.y * dt;
    this.velocity.z += this.acceleration.z * dt;
  }
  
  /**
   * 更新位置（使用欧拉积分）
   * @param {number} dt - 时间步长
   */
  updatePosition(dt) {
    // 保存当前位置用于轨迹
    this.previousPosition = { ...this.position };
    
    // 更新位置
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    
    // 更新轨迹（每隔一定帧数更新一次，以优化性能）
    this.frameCount++;
    if (this.frameCount >= this.trailUpdateInterval) {
      this.updateTrail(this.previousPosition);
      this.frameCount = 0;
    }
  }
  
  /**
   * 使用Runge-Kutta方法更新状态
   * @param {Function} accelerationFn - 加速度计算函数
   * @param {number} dt - 时间步长
   */
  updateRK4(accelerationFn, dt) {
    // 保存当前状态
    const x0 = { ...this.position };
    const v0 = { ...this.velocity };
    
    // 第一步
    const a0 = accelerationFn(this);
    const k1v = { x: a0.x * dt, y: a0.y * dt, z: a0.z * dt };
    const k1x = { x: v0.x * dt, y: v0.y * dt, z: v0.z * dt };
    
    // 第二步
    this.position = {
      x: x0.x + k1x.x / 2,
      y: x0.y + k1x.y / 2,
      z: x0.z + k1x.z / 2
    };
    this.velocity = {
      x: v0.x + k1v.x / 2,
      y: v0.y + k1v.y / 2,
      z: v0.z + k1v.z / 2
    };
    
    const a1 = accelerationFn(this);
    const k2v = { x: a1.x * dt, y: a1.y * dt, z: a1.z * dt };
    const k2x = {
      x: (v0.x + k1v.x / 2) * dt,
      y: (v0.y + k1v.y / 2) * dt,
      z: (v0.z + k1v.z / 2) * dt
    };
    
    // 第三步
    this.position = {
      x: x0.x + k2x.x / 2,
      y: x0.y + k2x.y / 2,
      z: x0.z + k2x.z / 2
    };
    this.velocity = {
      x: v0.x + k2v.x / 2,
      y: v0.y + k2v.y / 2,
      z: v0.z + k2v.z / 2
    };
    
    const a2 = accelerationFn(this);
    const k3v = { x: a2.x * dt, y: a2.y * dt, z: a2.z * dt };
    const k3x = {
      x: (v0.x + k2v.x / 2) * dt,
      y: (v0.y + k2v.y / 2) * dt,
      z: (v0.z + k2v.z / 2) * dt
    };
    
    // 第四步
    this.position = {
      x: x0.x + k3x.x,
      y: x0.y + k3x.y,
      z: x0.z + k3x.z
    };
    this.velocity = {
      x: v0.x + k3v.x,
      y: v0.y + k3v.y,
      z: v0.z + k3v.z
    };
    
    const a3 = accelerationFn(this);
    const k4v = { x: a3.x * dt, y: a3.y * dt, z: a3.z * dt };
    const k4x = {
      x: (v0.x + k3v.x) * dt,
      y: (v0.y + k3v.y) * dt,
      z: (v0.z + k3v.z) * dt
    };
    
    // 保存当前位置用于轨迹
    this.previousPosition = { ...this.position };
    this.previousVelocity = { ...this.velocity };
    
    // 更新位置和速度
    this.position = {
      x: x0.x + (k1x.x + 2 * k2x.x + 2 * k3x.x + k4x.x) / 6,
      y: x0.y + (k1x.y + 2 * k2x.y + 2 * k3x.y + k4x.y) / 6,
      z: x0.z + (k1x.z + 2 * k2x.z + 2 * k3x.z + k4x.z) / 6
    };
    
    this.velocity = {
      x: v0.x + (k1v.x + 2 * k2v.x + 2 * k3v.x + k4v.x) / 6,
      y: v0.y + (k1v.y + 2 * k2v.y + 2 * k3v.y + k4v.y) / 6,
      z: v0.z + (k1v.z + 2 * k2v.z + 2 * k3v.z + k4v.z) / 6
    };
    
    // 更新轨迹（每隔一定帧数更新一次，以优化性能）
    this.frameCount++;
    if (this.frameCount >= this.trailUpdateInterval) {
      this.updateTrail(x0);
      this.frameCount = 0;
    }
  }
  
  /**
   * 更新轨迹
   * @param {Object} position - 要添加到轨迹的位置
   */
  updateTrail(position) {
    // 只有当位置变化足够大时才添加到轨迹
    if (this.trail.length === 0 || distance(position, this.trail[this.trail.length - 1]) > 0.01) {
      this.trail.push({ ...position });
      
      // 限制轨迹长度
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
  }
  
  /**
   * 设置轨迹最大长度
   * @param {number} length - 轨迹最大长度
   */
  setMaxTrailLength(length) {
    this.maxTrailLength = length;
    
    // 如果当前轨迹超过新的最大长度，则裁剪
    if (this.trail.length > length) {
      this.trail = this.trail.slice(this.trail.length - length);
    }
  }
  
  /**
   * 清除轨迹
   */
  clearTrail() {
    this.trail = [];
  }
  
  /**
   * 获取速度大小
   * @returns {number} 速度大小
   */
  getSpeed() {
    return Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
  }
  
  /**
   * 获取动能
   * @returns {number} 动能
   */
  getKineticEnergy() {
    const speed = this.getSpeed();
    return 0.5 * this.mass * speed * speed;
  }
  
  /**
   * 更新3D对象位置
   */
  updateObject3D() {
    if (this.object3D) {
      this.object3D.position.set(this.position.x, this.position.y, this.position.z);
    }
  }
  
  /**
   * 设置天体质量
   * @param {number} mass - 新质量
   */
  setMass(mass) {
    this.mass = mass;
    
    // 更新半径
    this.radius = Math.pow(mass, 1/3) * 0.5;
    
    // 更新温度
    this.temperature = 5778 * Math.pow(this.mass, 0.5);
    
    // 更新粒子发射率
    this.particleEmissionRate = Math.pow(this.mass, 0.5) * 0.5;
  }
  
  /**
   * 克隆天体
   * @returns {CelestialBody} 克隆的天体
   */
  clone() {
    return new CelestialBody({
      mass: this.mass,
      position: { ...this.position },
      velocity: { ...this.velocity },
      color: this.baseColor,
      temperature: this.temperature,
      name: this.name
    });
  }
}
