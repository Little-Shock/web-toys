/**
 * 沙粒物理系统
 * 管理所有沙粒的物理模拟
 */
class SandPhysics {
  /**
   * 创建沙粒物理系统
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 配置参数
    this.params = {
      maxParticles: options.maxParticles || 10000,
      particleSize: options.particleSize || 2,
      gravity: options.gravity || 0.5,
      gravityX: 0,
      gravityY: 1,
      friction: options.friction || 0.97,
      interactionRadius: options.interactionRadius || 50,
      spatialHashCellSize: options.spatialHashCellSize || 10,
      simulationSpeed: options.simulationSpeed || 1,
      collisionsEnabled: options.collisionsEnabled !== undefined ? options.collisionsEnabled : true,
      restingThreshold: options.restingThreshold || 0.05
    };
    
    // 粒子数组
    this.particles = [];
    
    // 空间哈希网格 - 用于优化碰撞检测
    this.grid = {};
    
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
   * 初始化物理系统
   * @private
   */
  _init() {
    // 初始化空间哈希网格
    this._clearGrid();
  }
  
  /**
   * 清空空间哈希网格
   * @private
   */
  _clearGrid() {
    this.grid = {};
  }
  
  /**
   * 获取粒子所在的网格单元坐标
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @returns {string} 网格单元ID
   * @private
   */
  _getGridCell(x, y) {
    const cellSize = this.params.spatialHashCellSize;
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    return `${cellX},${cellY}`;
  }
  
  /**
   * 将粒子添加到空间哈希网格
   * @param {SandParticle} particle - 沙粒粒子
   * @param {number} index - 粒子在数组中的索引
   * @private
   */
  _addToGrid(particle, index) {
    const cellId = this._getGridCell(particle.x, particle.y);
    if (!this.grid[cellId]) {
      this.grid[cellId] = [];
    }
    this.grid[cellId].push(index);
  }
  
  /**
   * 更新空间哈希网格
   * @private
   */
  _updateGrid() {
    this._clearGrid();
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.isActive) {
        this._addToGrid(particle, i);
      }
    }
  }
  
  /**
   * 获取指定位置附近的粒子
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} radius - 搜索半径
   * @returns {Array} 附近的粒子索引数组
   * @private
   */
  _getNearbyParticles(x, y, radius) {
    const cellSize = this.params.spatialHashCellSize;
    const cellRadius = Math.ceil(radius / cellSize);
    const centerCellX = Math.floor(x / cellSize);
    const centerCellY = Math.floor(y / cellSize);
    
    const nearbyParticles = [];
    
    for (let cellX = centerCellX - cellRadius; cellX <= centerCellX + cellRadius; cellX++) {
      for (let cellY = centerCellY - cellRadius; cellY <= centerCellY + cellRadius; cellY++) {
        const cellId = `${cellX},${cellY}`;
        const cell = this.grid[cellId];
        
        if (cell) {
          for (const index of cell) {
            const particle = this.particles[index];
            const dx = particle.x - x;
            const dy = particle.y - y;
            const distSquared = dx * dx + dy * dy;
            
            if (distSquared <= radius * radius) {
              nearbyParticles.push(index);
            }
          }
        }
      }
    }
    
    return nearbyParticles;
  }
  
  /**
   * 处理粒子碰撞
   * @private
   */
  _handleCollisions() {
    if (!this.params.collisionsEnabled) return;
    
    // 使用空间哈希网格优化碰撞检测
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.isActive) continue;
      
      const cellId = this._getGridCell(particle.x, particle.y);
      const cell = this.grid[cellId];
      
      if (!cell) continue;
      
      // 检查同一网格单元内的粒子碰撞
      for (let j = 0; j < cell.length; j++) {
        const otherIndex = cell[j];
        if (otherIndex <= i) continue; // 避免重复检测
        
        const other = this.particles[otherIndex];
        if (!other.isActive) continue;
        
        if (particle.collidesWith(other)) {
          particle.resolveCollision(other);
        }
      }
      
      // 检查相邻网格单元的粒子碰撞
      const cellSize = this.params.spatialHashCellSize;
      const cellX = Math.floor(particle.x / cellSize);
      const cellY = Math.floor(particle.y / cellSize);
      
      for (let nx = -1; nx <= 1; nx++) {
        for (let ny = -1; ny <= 1; ny++) {
          if (nx === 0 && ny === 0) continue; // 跳过当前单元
          
          const neighborCellId = `${cellX + nx},${cellY + ny}`;
          const neighborCell = this.grid[neighborCellId];
          
          if (!neighborCell) continue;
          
          for (let k = 0; k < neighborCell.length; k++) {
            const otherIndex = neighborCell[k];
            const other = this.particles[otherIndex];
            
            if (!other.isActive) continue;
            
            if (particle.collidesWith(other)) {
              particle.resolveCollision(other);
            }
          }
        }
      }
    }
  }
  
  /**
   * 更新物理系统
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
      y: this.params.gravityY * this.params.gravity
    };
    
    // 更新所有粒子
    let activeCount = 0;
    for (const particle of this.particles) {
      if (particle.isActive) {
        particle.update(adjustedDt, this.bounds, gravity);
        activeCount++;
      }
    }
    
    // 更新空间哈希网格
    this._updateGrid();
    
    // 处理碰撞
    this._handleCollisions();
    
    // 更新统计信息
    this.stats.activeParticles = activeCount;
    this.stats.updateTime = performance.now() - startTime;
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
   * 添加粒子
   * @param {SandParticle} particle - 沙粒粒子
   * @returns {boolean} 是否成功添加
   */
  addParticle(particle) {
    if (this.particles.length >= this.params.maxParticles) {
      // 如果达到最大粒子数，替换一个不活跃的粒子
      const inactiveIndex = this.particles.findIndex(p => !p.isActive);
      if (inactiveIndex !== -1) {
        this.particles[inactiveIndex] = particle;
        return true;
      }
      return false;
    }
    
    this.particles.push(particle);
    return true;
  }
  
  /**
   * 在指定位置创建粒子
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {Object} options - 粒子选项
   * @returns {SandParticle|null} 创建的粒子或null
   */
  createParticle(x, y, options = {}) {
    const particle = new SandParticle(x, y, {
      radius: options.radius || this.params.particleSize,
      color: options.color || '#ffdc73',
      vx: options.vx || 0,
      vy: options.vy || 0,
      type: options.type || 'normal',
      ...options
    });
    
    if (this.addParticle(particle)) {
      return particle;
    }
    
    return null;
  }
  
  /**
   * 在指定区域创建多个粒子
   * @param {number} x - 中心x坐标
   * @param {number} y - 中心y坐标
   * @param {number} radius - 区域半径
   * @param {number} count - 粒子数量
   * @param {Object} options - 粒子选项
   * @returns {Array} 创建的粒子数组
   */
  createParticles(x, y, radius, count, options = {}) {
    const particles = [];
    
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
      
      const particle = this.createParticle(px, py, {
        ...options,
        vx,
        vy
      });
      
      if (particle) {
        particles.push(particle);
      }
    }
    
    return particles;
  }
  
  /**
   * 在指定位置创建沙粒爆发效果
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} count - 粒子数量
   * @param {Object} options - 配置选项
   * @returns {Array} 创建的粒子数组
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
   * @returns {Array} 创建的粒子数组
   */
  pourSand(x, y, count, options = {}) {
    const pourOptions = {
      initialSpeed: options.speed || random(0.5, 2),
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
    const nearbyIndices = this._getNearbyParticles(x, y, radius);
    let affectedCount = 0;
    
    for (const index of nearbyIndices) {
      const particle = this.particles[index];
      
      // 计算到中心的距离
      const dx = particle.x - x;
      const dy = particle.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // 根据距离计算力的大小
      const forceMagnitude = strength * (1 - dist / radius) * 5;
      
      // 计算力的方向（远离中心）
      const angle = Math.atan2(dy, dx);
      const fx = Math.cos(angle) * forceMagnitude;
      const fy = Math.sin(angle) * forceMagnitude;
      
      // 应用力
      particle.applyForce(fx, fy);
      affectedCount++;
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
    const nearbyIndices = this._getNearbyParticles(x, y, radius);
    let affectedCount = 0;
    
    if (nearbyIndices.length === 0) return 0;
    
    // 计算区域内粒子的平均位置
    let avgX = 0;
    let avgY = 0;
    
    for (const index of nearbyIndices) {
      const particle = this.particles[index];
      avgX += particle.x;
      avgY += particle.y;
    }
    
    avgX /= nearbyIndices.length;
    avgY /= nearbyIndices.length;
    
    // 向平均位置施加轻微的力
    for (const index of nearbyIndices) {
      const particle = this.particles[index];
      
      // 计算到平均位置的方向
      const dx = avgX - particle.x;
      const dy = avgY - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // 根据距离计算力的大小
        const forceMagnitude = strength * (1 - dist / radius) * 0.5;
        
        // 应用力
        particle.applyForce(dx / dist * forceMagnitude, dy / dist * forceMagnitude);
        
        // 减小粒子速度，增加平滑效果
        particle.vx *= 0.9;
        particle.vy *= 0.9;
        
        affectedCount++;
      }
    }
    
    return affectedCount;
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
    const nearbyIndices = this._getNearbyParticles(x, y, radius);
    let affectedCount = 0;
    
    for (const index of nearbyIndices) {
      const particle = this.particles[index];
      
      // 计算到中心的距离
      const dx = particle.x - x;
      const dy = particle.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // 根据距离计算力的大小
      const forceMagnitude = strength * (1 - dist / radius) * 3;
      
      // 应用随机方向的力
      const angle = random(0, Math.PI * 2);
      const fx = Math.cos(angle) * forceMagnitude;
      const fy = Math.sin(angle) * forceMagnitude;
      
      particle.applyForce(fx, fy);
      affectedCount++;
    }
    
    return affectedCount;
  }
  
  /**
   * 清除所有粒子
   */
  clear() {
    this.particles = [];
    this._clearGrid();
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
    this.params.maxParticles = count;
    
    // 如果当前粒子数量超过新的最大值，移除多余的粒子
    if (this.particles.length > count) {
      this.particles.splice(count);
    }
  }
  
  /**
   * 设置粒子大小
   * @param {number} size - 粒子大小
   */
  setParticleSize(size) {
    this.params.particleSize = size;
    
    // 更新现有粒子的大小
    for (const particle of this.particles) {
      particle.radius = size * random(0.8, 1.2);
    }
  }
}
