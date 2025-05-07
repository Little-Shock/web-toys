/**
 * 沙粒粒子系统
 * 使用Three.js和WebGL实现高性能粒子模拟
 */
class SandParticleSystem {
  /**
   * 创建沙粒粒子系统
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 配置参数
    this.params = {
      maxParticles: options.maxParticles || 5000,
      particleSize: options.particleSize || 2.5,
      gravity: options.gravity || 0.5,
      gravityX: 0,
      gravityY: 1,
      friction: options.friction || 0.97,
      interactionRadius: options.interactionRadius || 50,
      simulationSpeed: options.simulationSpeed || 1,
      collisionsEnabled: options.collisionsEnabled !== undefined ? options.collisionsEnabled : true,
      restingThreshold: options.restingThreshold || 0.05
    };
    
    // 粒子数据
    this.particles = [];
    this.particlePositions = null; // Float32Array for positions
    this.particleVelocities = null; // Float32Array for velocities
    this.particleColors = null; // Float32Array for colors
    this.particleSizes = null; // Float32Array for sizes
    this.particleOpacities = null; // Float32Array for opacities
    
    // 边界
    this.bounds = {
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight
    };
    
    // 状态
    this.isRunning = false;
    this.isPaused = false;
    this.lastUpdateTime = 0;
    
    // 统计信息
    this.stats = {
      activeParticles: 0,
      fps: 0,
      updateTime: 0
    };
    
    // 初始化
    this._init();
  }
  
  /**
   * 初始化粒子系统
   * @private
   */
  _init() {
    // 创建粒子数据数组
    this._createParticleArrays();
  }
  
  /**
   * 创建粒子数据数组
   * @private
   */
  _createParticleArrays() {
    // 为每个粒子属性创建类型化数组
    this.particlePositions = new Float32Array(this.params.maxParticles * 3); // x, y, z
    this.particleVelocities = new Float32Array(this.params.maxParticles * 3); // vx, vy, vz
    this.particleColors = new Float32Array(this.params.maxParticles * 3); // r, g, b
    this.particleSizes = new Float32Array(this.params.maxParticles); // size
    this.particleOpacities = new Float32Array(this.params.maxParticles); // opacity
    
    // 初始化粒子数组
    this.particles = [];
    for (let i = 0; i < this.params.maxParticles; i++) {
      this.particles.push({
        active: false,
        index: i,
        mass: 1,
        restitution: 0.3,
        type: 'normal',
        resting: false,
        restTime: 0
      });
    }
  }
  
  /**
   * 更新粒子系统
   * @param {number} dt - 时间步长
   */
  update(dt) {
    if (this.isPaused) return;
    
    const startTime = performance.now();
    
    // 调整时间步长
    const adjustedDt = dt * this.params.simulationSpeed;
    
    // 计算重力向量
    const gravity = {
      x: this.params.gravityX * this.params.gravity,
      y: this.params.gravityY * this.params.gravity,
      z: 0
    };
    
    // 更新所有粒子
    let activeCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      activeCount++;
      
      // 获取粒子数据索引
      const idx3 = i * 3;
      
      // 保存上一帧位置
      const lastX = this.particlePositions[idx3];
      const lastY = this.particlePositions[idx3 + 1];
      
      // 应用重力
      this.particleVelocities[idx3] += gravity.x * particle.mass * adjustedDt;
      this.particleVelocities[idx3 + 1] += gravity.y * particle.mass * adjustedDt;
      
      // 应用摩擦力
      this.particleVelocities[idx3] *= this.params.friction;
      this.particleVelocities[idx3 + 1] *= this.params.friction;
      
      // 更新位置
      this.particlePositions[idx3] += this.particleVelocities[idx3] * adjustedDt;
      this.particlePositions[idx3 + 1] += this.particleVelocities[idx3 + 1] * adjustedDt;
      
      // 边界碰撞检测
      this._handleBoundaryCollisions(i);
      
      // 检查是否静止
      this._checkIfResting(i);
    }
    
    // 处理粒子碰撞
    if (this.params.collisionsEnabled) {
      this._handleCollisions();
    }
    
    // 更新统计信息
    this.stats.activeParticles = activeCount;
    this.stats.updateTime = performance.now() - startTime;
  }
  
  /**
   * 处理边界碰撞
   * @param {number} index - 粒子索引
   * @private
   */
  _handleBoundaryCollisions(index) {
    const particle = this.particles[index];
    const idx3 = index * 3;
    
    const size = this.particleSizes[index];
    const x = this.particlePositions[idx3];
    const y = this.particlePositions[idx3 + 1];
    
    // 左边界
    if (x - size < 0) {
      this.particlePositions[idx3] = size;
      this.particleVelocities[idx3] = Math.abs(this.particleVelocities[idx3]) * particle.restitution;
    }
    // 右边界
    else if (x + size > this.bounds.width) {
      this.particlePositions[idx3] = this.bounds.width - size;
      this.particleVelocities[idx3] = -Math.abs(this.particleVelocities[idx3]) * particle.restitution;
    }
    
    // 上边界
    if (y - size < 0) {
      this.particlePositions[idx3 + 1] = size;
      this.particleVelocities[idx3 + 1] = Math.abs(this.particleVelocities[idx3 + 1]) * particle.restitution;
    }
    // 下边界
    else if (y + size > this.bounds.height) {
      this.particlePositions[idx3 + 1] = this.bounds.height - size;
      this.particleVelocities[idx3 + 1] = -Math.abs(this.particleVelocities[idx3 + 1]) * particle.restitution;
    }
  }
  
  /**
   * 检查粒子是否静止
   * @param {number} index - 粒子索引
   * @private
   */
  _checkIfResting(index) {
    const particle = this.particles[index];
    const idx3 = index * 3;
    
    const vx = this.particleVelocities[idx3];
    const vy = this.particleVelocities[idx3 + 1];
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    if (speed < this.params.restingThreshold) {
      particle.restTime++;
      if (particle.restTime > 10) {
        particle.resting = true;
      }
    } else {
      particle.resting = false;
      particle.restTime = 0;
    }
  }
  
  /**
   * 处理粒子碰撞
   * @private
   */
  _handleCollisions() {
    // 简化的碰撞检测 - 只检查活跃粒子
    const activeParticles = this.particles.filter(p => p.active);
    
    for (let i = 0; i < activeParticles.length; i++) {
      const p1 = activeParticles[i];
      const idx1 = p1.index * 3;
      
      for (let j = i + 1; j < activeParticles.length; j++) {
        const p2 = activeParticles[j];
        const idx2 = p2.index * 3;
        
        // 计算距离
        const dx = this.particlePositions[idx2] - this.particlePositions[idx1];
        const dy = this.particlePositions[idx2 + 1] - this.particlePositions[idx1 + 1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检查碰撞
        const minDistance = this.particleSizes[p1.index] + this.particleSizes[p2.index];
        
        if (distance < minDistance) {
          // 计算碰撞法线
          const nx = dx / distance;
          const ny = dy / distance;
          
          // 计算相对速度
          const vx1 = this.particleVelocities[idx1];
          const vy1 = this.particleVelocities[idx1 + 1];
          const vx2 = this.particleVelocities[idx2];
          const vy2 = this.particleVelocities[idx2 + 1];
          
          const relVelX = vx2 - vx1;
          const relVelY = vy2 - vy1;
          
          // 计算相对速度在碰撞法线上的投影
          const relVelDotNormal = relVelX * nx + relVelY * ny;
          
          // 如果粒子正在分离，不需要计算冲量
          if (relVelDotNormal > 0) continue;
          
          // 计算冲量
          const restitution = Math.min(p1.restitution, p2.restitution);
          const m1 = p1.mass;
          const m2 = p2.mass;
          const totalMass = m1 + m2;
          
          const j = -(1 + restitution) * relVelDotNormal;
          const impulse1 = j / totalMass;
          const impulse2 = j / totalMass;
          
          // 应用冲量
          this.particleVelocities[idx1] -= nx * impulse1 * m2;
          this.particleVelocities[idx1 + 1] -= ny * impulse1 * m2;
          this.particleVelocities[idx2] += nx * impulse2 * m1;
          this.particleVelocities[idx2 + 1] += ny * impulse2 * m1;
          
          // 分离粒子
          const overlap = minDistance - distance;
          const separationX = nx * overlap * 0.5;
          const separationY = ny * overlap * 0.5;
          
          this.particlePositions[idx1] -= separationX;
          this.particlePositions[idx1 + 1] -= separationY;
          this.particlePositions[idx2] += separationX;
          this.particlePositions[idx2 + 1] += separationY;
          
          // 重置静止状态
          p1.resting = false;
          p2.resting = false;
          p1.restTime = 0;
          p2.restTime = 0;
        }
      }
    }
  }
  
  /**
   * 调整系统边界
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  resize(width, height) {
    this.bounds.width = width;
    this.bounds.height = height;
  }
  
  /**
   * 设置重力方向
   * @param {number} x - x方向分量 (-1 到 1)
   * @param {number} y - y方向分量 (-1 到 1)
   */
  setGravity(x, y) {
    this.params.gravityX = clamp(x, -1, 1);
    this.params.gravityY = clamp(y, -1, 1);
  }
  
  /**
   * 设置重力强度
   * @param {number} strength - 重力强度 (0 到 1)
   */
  setGravityStrength(strength) {
    this.params.gravity = clamp(strength, 0, 1);
  }
  
  /**
   * 创建粒子
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {Object} options - 粒子选项
   * @returns {number} 粒子索引或-1（如果创建失败）
   */
  createParticle(x, y, options = {}) {
    // 查找未使用的粒子
    const index = this.particles.findIndex(p => !p.active);
    if (index === -1) return -1;
    
    // 激活粒子
    const particle = this.particles[index];
    particle.active = true;
    particle.mass = options.mass || random(0.8, 1.2);
    particle.restitution = options.restitution || 0.3;
    particle.type = options.type || 'normal';
    particle.resting = false;
    particle.restTime = 0;
    
    // 设置粒子属性
    const idx3 = index * 3;
    
    // 位置
    this.particlePositions[idx3] = x;
    this.particlePositions[idx3 + 1] = y;
    this.particlePositions[idx3 + 2] = 0;
    
    // 速度
    this.particleVelocities[idx3] = options.vx || 0;
    this.particleVelocities[idx3 + 1] = options.vy || 0;
    this.particleVelocities[idx3 + 2] = 0;
    
    // 颜色
    const color = options.color ? hexToRgb(options.color) : { r: 255, g: 220, b: 115 };
    this.particleColors[idx3] = color.r / 255;
    this.particleColors[idx3 + 1] = color.g / 255;
    this.particleColors[idx3 + 2] = color.b / 255;
    
    // 大小
    this.particleSizes[index] = options.radius || this.params.particleSize;
    
    // 不透明度
    this.particleOpacities[index] = options.opacity || random(0.8, 1.0);
    
    return index;
  }
  
  /**
   * 在指定区域创建多个粒子
   * @param {number} x - 中心x坐标
   * @param {number} y - 中心y坐标
   * @param {number} radius - 区域半径
   * @param {number} count - 粒子数量
   * @param {Object} options - 粒子选项
   * @returns {Array} 创建的粒子索引数组
   */
  createParticles(x, y, radius, count, options = {}) {
    const indices = [];
    
    for (let i = 0; i < count; i++) {
      // 在圆形区域内随机位置
      const angle = random(0, Math.PI * 2);
      const distance = random(0, radius);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      
      // 随机初始速度
      const speed = options.initialSpeed || 0;
      const vx = options.vx !== undefined ? options.vx : Math.cos(angle) * speed * random(0.5, 1.5);
      const vy = options.vy !== undefined ? options.vy : Math.sin(angle) * speed * random(0.5, 1.5);
      
      const index = this.createParticle(px, py, {
        ...options,
        vx,
        vy
      });
      
      if (index !== -1) {
        indices.push(index);
      }
    }
    
    return indices;
  }
  
  /**
   * 在指定位置创建沙粒爆发效果
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} count - 粒子数量
   * @param {Object} options - 配置选项
   * @returns {Array} 创建的粒子索引数组
   */
  createBurst(x, y, count, options = {}) {
    const burstOptions = {
      initialSpeed: options.speed || random(2, 5),
      color: options.color || '#ffdc73',
      type: options.type || 'normal',
      ...options
    };
    
    return this.createParticles(x, y, options.radius || 10, count, burstOptions);
  }
  
  /**
   * 在指定位置倾倒沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} count - 粒子数量
   * @param {Object} options - 配置选项
   * @returns {Array} 创建的粒子索引数组
   */
  pourSand(x, y, count, options = {}) {
    const pourOptions = {
      initialSpeed: options.initialSpeed || random(0.5, 2),
      color: options.color || '#ffdc73',
      type: options.type || 'normal',
      ...options
    };
    
    // 在小范围内创建粒子，模拟倾倒效果
    return this.createParticles(x, y, options.radius || 5, count, pourOptions);
  }
  
  /**
   * 在指定位置挖掘沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} radius - 挖掘半径
   * @param {number} strength - 挖掘强度
   * @returns {number} 受影响的粒子数量
   */
  digSand(x, y, radius, strength = 1) {
    let affectedCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) continue;
      
      const idx3 = i * 3;
      const px = this.particlePositions[idx3];
      const py = this.particlePositions[idx3 + 1];
      
      // 计算到中心的距离
      const dx = px - x;
      const dy = py - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        // 根据距离计算力的大小
        const forceMagnitude = strength * (1 - dist / radius) * 5;
        
        // 计算力的方向（远离中心）
        const angle = Math.atan2(dy, dx);
        const fx = Math.cos(angle) * forceMagnitude;
        const fy = Math.sin(angle) * forceMagnitude;
        
        // 应用力
        this.particleVelocities[idx3] += fx / this.particles[i].mass;
        this.particleVelocities[idx3 + 1] += fy / this.particles[i].mass;
        
        // 重置静止状态
        this.particles[i].resting = false;
        this.particles[i].restTime = 0;
        
        affectedCount++;
      }
    }
    
    return affectedCount;
  }
  
  /**
   * 在指定位置平滑沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} radius - 平滑半径
   * @param {number} strength - 平滑强度
   * @returns {number} 受影响的粒子数量
   */
  smoothSand(x, y, radius, strength = 1) {
    // 查找区域内的粒子
    const particlesInRange = [];
    
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) continue;
      
      const idx3 = i * 3;
      const px = this.particlePositions[idx3];
      const py = this.particlePositions[idx3 + 1];
      
      // 计算到中心的距离
      const dx = px - x;
      const dy = py - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        particlesInRange.push({
          index: i,
          distance: dist,
          x: px,
          y: py
        });
      }
    }
    
    if (particlesInRange.length === 0) return 0;
    
    // 计算区域内粒子的平均位置
    let avgX = 0;
    let avgY = 0;
    
    for (const p of particlesInRange) {
      avgX += p.x;
      avgY += p.y;
    }
    
    avgX /= particlesInRange.length;
    avgY /= particlesInRange.length;
    
    // 向平均位置施加轻微的力
    for (const p of particlesInRange) {
      const idx3 = p.index * 3;
      
      // 计算到平均位置的方向
      const dx = avgX - p.x;
      const dy = avgY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // 根据距离计算力的大小
        const forceMagnitude = strength * (1 - p.distance / radius) * 0.5;
        
        // 应用力
        this.particleVelocities[idx3] += (dx / dist) * forceMagnitude;
        this.particleVelocities[idx3 + 1] += (dy / dist) * forceMagnitude;
        
        // 减小粒子速度，增加平滑效果
        this.particleVelocities[idx3] *= 0.9;
        this.particleVelocities[idx3 + 1] *= 0.9;
        
        // 重置静止状态
        this.particles[p.index].resting = false;
        this.particles[p.index].restTime = 0;
      }
    }
    
    return particlesInRange.length;
  }
  
  /**
   * 在指定位置震动沙粒
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} radius - 震动半径
   * @param {number} strength - 震动强度
   * @returns {number} 受影响的粒子数量
   */
  shakeSand(x, y, radius, strength = 1) {
    let affectedCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) continue;
      
      const idx3 = i * 3;
      const px = this.particlePositions[idx3];
      const py = this.particlePositions[idx3 + 1];
      
      // 计算到中心的距离
      const dx = px - x;
      const dy = py - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        // 根据距离计算力的大小
        const forceMagnitude = strength * (1 - dist / radius) * 3;
        
        // 应用随机方向的力
        const angle = random(0, Math.PI * 2);
        const fx = Math.cos(angle) * forceMagnitude;
        const fy = Math.sin(angle) * forceMagnitude;
        
        this.particleVelocities[idx3] += fx / this.particles[i].mass;
        this.particleVelocities[idx3 + 1] += fy / this.particles[i].mass;
        
        // 重置静止状态
        this.particles[i].resting = false;
        this.particles[i].restTime = 0;
        
        affectedCount++;
      }
    }
    
    return affectedCount;
  }
  
  /**
   * 清除所有粒子
   */
  clear() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
    }
  }
  
  /**
   * 获取系统状态
   * @returns {Object} 系统状态
   */
  getStats() {
    return {
      ...this.stats,
      totalParticles: this.particles.length,
      maxParticles: this.params.maxParticles
    };
  }
  
  /**
   * 暂停物理模拟
   */
  pause() {
    this.isPaused = true;
  }
  
  /**
   * 恢复物理模拟
   */
  resume() {
    this.isPaused = false;
  }
  
  /**
   * 切换暂停状态
   * @returns {boolean} 当前是否暂停
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }
  
  /**
   * 设置最大粒子数量
   * @param {number} count - 最大粒子数量
   */
  setMaxParticles(count) {
    // 如果新的最大值小于当前值，需要重新创建数组
    if (count < this.params.maxParticles) {
      // 停用超出新限制的粒子
      for (let i = count; i < this.particles.length; i++) {
        this.particles[i].active = false;
      }
    }
    
    this.params.maxParticles = count;
    
    // 如果新的最大值大于当前值，需要重新创建数组
    if (count > this.particlePositions.length / 3) {
      // 创建新的数组
      const newPositions = new Float32Array(count * 3);
      const newVelocities = new Float32Array(count * 3);
      const newColors = new Float32Array(count * 3);
      const newSizes = new Float32Array(count);
      const newOpacities = new Float32Array(count);
      
      // 复制现有数据
      newPositions.set(this.particlePositions);
      newVelocities.set(this.particleVelocities);
      newColors.set(this.particleColors);
      newSizes.set(this.particleSizes);
      newOpacities.set(this.particleOpacities);
      
      // 更新引用
      this.particlePositions = newPositions;
      this.particleVelocities = newVelocities;
      this.particleColors = newColors;
      this.particleSizes = newSizes;
      this.particleOpacities = newOpacities;
      
      // 更新粒子数组
      const oldLength = this.particles.length;
      for (let i = oldLength; i < count; i++) {
        this.particles.push({
          active: false,
          index: i,
          mass: 1,
          restitution: 0.3,
          type: 'normal',
          resting: false,
          restTime: 0
        });
      }
    }
  }
  
  /**
   * 设置粒子大小
   * @param {number} size - 粒子大小
   */
  setParticleSize(size) {
    this.params.particleSize = size;
    
    // 更新现有活跃粒子的大小
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particleSizes[i] = size * random(0.8, 1.2);
      }
    }
  }
  
  /**
   * 获取粒子数据
   * @returns {Object} 粒子数据
   */
  getParticleData() {
    return {
      positions: this.particlePositions,
      colors: this.particleColors,
      sizes: this.particleSizes,
      opacities: this.particleOpacities,
      particles: this.particles
    };
  }
}
