/**
 * 粒子系统
 * 负责创建和管理粒子效果
 */
class ParticleSystem {
  /**
   * 创建粒子系统
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {Object} options - 配置选项
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 配置参数
    this.params = {
      maxParticles: options.maxParticles || 500,
      particleSizeMin: options.particleSizeMin || 1,
      particleSizeMax: options.particleSizeMax || 3,
      particleLifeMin: options.particleLifeMin || 1,
      particleLifeMax: options.particleLifeMax || 3,
      particleSpeedMin: options.particleSpeedMin || 0.01,
      particleSpeedMax: options.particleSpeedMax || 0.05,
      gravity: options.gravity || 0.001,
      friction: options.friction || 0.98,
      fadeRate: options.fadeRate || 0.02,
      blendMode: options.blendMode || 'screen'
    };
    
    // 粒子数组
    this.particles = [];
    
    // 粒子池（用于重用粒子对象）
    this.particlePool = [];
    
    // 发射器数组
    this.emitters = [];
    
    // 动画状态
    this.time = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化粒子系统
   */
  init() {
    // 预创建粒子池
    for (let i = 0; i < this.params.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }
  
  /**
   * 创建粒子对象
   * @returns {Object} 粒子对象
   */
  createParticle() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 0,
      rotation: 0,
      rotationSpeed: 0,
      shape: 'circle',
      active: false
    };
  }
  
  /**
   * 获取空闲粒子
   * @returns {Object|null} 粒子对象或null
   */
  getParticle() {
    // 先从池中查找
    for (let i = 0; i < this.particlePool.length; i++) {
      if (!this.particlePool[i].active) {
        return this.particlePool[i];
      }
    }
    
    // 如果粒子数量未达到最大值，创建新粒子
    if (this.particles.length < this.params.maxParticles) {
      const particle = this.createParticle();
      this.particlePool.push(particle);
      return particle;
    }
    
    // 如果达到最大值，返回null
    return null;
  }
  
  /**
   * 发射粒子
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 粒子选项
   * @returns {Object|null} 粒子对象或null
   */
  emitParticle(x, y, options = {}) {
    const particle = this.getParticle();
    if (!particle) return null;
    
    // 设置粒子属性
    particle.x = x;
    particle.y = y;
    particle.vx = options.vx !== undefined ? options.vx : random(-this.params.particleSpeedMax, this.params.particleSpeedMax);
    particle.vy = options.vy !== undefined ? options.vy : random(-this.params.particleSpeedMax, this.params.particleSpeedMax);
    particle.size = options.size !== undefined ? options.size : random(this.params.particleSizeMin, this.params.particleSizeMax);
    particle.color = options.color || '#ffffff';
    particle.alpha = options.alpha !== undefined ? options.alpha : 1;
    particle.life = 0;
    particle.maxLife = options.life !== undefined ? options.life : random(this.params.particleLifeMin, this.params.particleLifeMax);
    particle.rotation = options.rotation !== undefined ? options.rotation : random(0, Math.PI * 2);
    particle.rotationSpeed = options.rotationSpeed !== undefined ? options.rotationSpeed : random(-0.1, 0.1);
    particle.shape = options.shape || 'circle';
    particle.active = true;
    
    // 添加到活跃粒子数组
    if (!this.particles.includes(particle)) {
      this.particles.push(particle);
    }
    
    return particle;
  }
  
  /**
   * 创建粒子爆发
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} count - 粒子数量
   * @param {Object} options - 爆发选项
   */
  createBurst(x, y, count, options = {}) {
    const burstOptions = {
      speed: options.speed || 0.05,
      size: options.size || random(this.params.particleSizeMin, this.params.particleSizeMax),
      color: options.color || '#ffffff',
      life: options.life || random(this.params.particleLifeMin, this.params.particleLifeMax),
      shape: options.shape || 'circle'
    };
    
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(0.01, burstOptions.speed);
      
      this.emitParticle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: random(burstOptions.size * 0.5, burstOptions.size * 1.5),
        color: burstOptions.color,
        life: random(burstOptions.life * 0.5, burstOptions.life * 1.5),
        shape: burstOptions.shape
      });
    }
  }
  
  /**
   * 创建粒子发射器
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 发射器选项
   * @returns {Object} 发射器对象
   */
  createEmitter(x, y, options = {}) {
    const emitter = {
      id: options.id || generateId(),
      x,
      y,
      rate: options.rate || 10, // 每秒发射粒子数
      count: options.count || 0, // 总发射数量，0表示无限
      emitted: 0, // 已发射数量
      active: true,
      lastEmitTime: 0,
      particleOptions: {
        vx: options.vx,
        vy: options.vy,
        size: options.size,
        color: options.color,
        life: options.life,
        shape: options.shape
      }
    };
    
    this.emitters.push(emitter);
    return emitter;
  }
  
  /**
   * 移除发射器
   * @param {string} emitterId - 发射器ID
   * @returns {boolean} 是否成功移除
   */
  removeEmitter(emitterId) {
    const index = this.emitters.findIndex(e => e.id === emitterId);
    
    if (index !== -1) {
      this.emitters.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * 更新粒子系统
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    this.deltaTime = deltaTime;
    this.time += deltaTime;
    
    // 更新发射器
    this.updateEmitters();
    
    // 更新粒子
    this.updateParticles();
  }
  
  /**
   * 更新发射器
   */
  updateEmitters() {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      
      if (!emitter.active) continue;
      
      // 检查是否达到发射上限
      if (emitter.count > 0 && emitter.emitted >= emitter.count) {
        emitter.active = false;
        continue;
      }
      
      // 计算发射间隔
      const emitInterval = 1 / emitter.rate;
      
      // 检查是否应该发射
      if (this.time - emitter.lastEmitTime >= emitInterval) {
        // 发射粒子
        this.emitParticle(emitter.x, emitter.y, emitter.particleOptions);
        
        // 更新发射时间和计数
        emitter.lastEmitTime = this.time;
        emitter.emitted++;
      }
    }
  }
  
  /**
   * 更新粒子
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      // 更新生命周期
      particle.life += this.deltaTime;
      
      // 检查是否过期
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        continue;
      }
      
      // 计算生命周期比例
      const lifeRatio = particle.life / particle.maxLife;
      
      // 更新透明度
      particle.alpha = 1 - lifeRatio;
      
      // 应用重力
      particle.vy += this.params.gravity * this.deltaTime * 60;
      
      // 应用摩擦力
      particle.vx *= this.params.friction;
      particle.vy *= this.params.friction;
      
      // 更新位置
      particle.x += particle.vx * this.deltaTime * 60;
      particle.y += particle.vy * this.deltaTime * 60;
      
      // 更新旋转
      particle.rotation += particle.rotationSpeed * this.deltaTime * 60;
    }
    
    // 移除不活跃的粒子
    this.particles = this.particles.filter(p => p.active);
  }
  
  /**
   * 渲染粒子系统
   */
  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 设置混合模式
    ctx.globalCompositeOperation = this.params.blendMode;
    
    // 渲染所有粒子
    for (const particle of this.particles) {
      if (!particle.active) continue;
      
      const x = particle.x * width;
      const y = particle.y * height;
      
      // 保存上下文
      ctx.save();
      
      // 设置透明度
      ctx.globalAlpha = particle.alpha;
      
      // 移动到粒子位置
      ctx.translate(x, y);
      
      // 应用旋转
      ctx.rotate(particle.rotation);
      
      // 根据形状绘制粒子
      switch (particle.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;
          
        case 'square':
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;
          
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size * 0.866, particle.size * 0.5);
          ctx.lineTo(-particle.size * 0.866, particle.size * 0.5);
          ctx.closePath();
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;
          
        case 'star':
          this.drawStar(ctx, 0, 0, 5, particle.size, particle.size / 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;
          
        default:
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
      }
      
      // 恢复上下文
      ctx.restore();
    }
    
    // 恢复默认混合模式
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * 绘制星形
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} points - 星形点数
   * @param {number} outerRadius - 外半径
   * @param {number} innerRadius - 内半径
   */
  drawStar(ctx, x, y, points, outerRadius, innerRadius) {
    ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      
      const pointX = x + radius * Math.sin(angle);
      const pointY = y - radius * Math.cos(angle);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    
    ctx.closePath();
  }
  
  /**
   * 清除所有粒子
   */
  clearParticles() {
    for (const particle of this.particles) {
      particle.active = false;
    }
    
    this.particles = [];
  }
  
  /**
   * 清除所有发射器
   */
  clearEmitters() {
    this.emitters = [];
  }
  
  /**
   * 设置混合模式
   * @param {string} mode - 混合模式
   */
  setBlendMode(mode) {
    this.params.blendMode = mode;
  }
  
  /**
   * 设置重力
   * @param {number} gravity - 重力值
   */
  setGravity(gravity) {
    this.params.gravity = gravity;
  }
  
  /**
   * 设置摩擦力
   * @param {number} friction - 摩擦力值
   */
  setFriction(friction) {
    this.params.friction = friction;
  }
  
  /**
   * 设置最大粒子数
   * @param {number} maxParticles - 最大粒子数
   */
  setMaxParticles(maxParticles) {
    this.params.maxParticles = maxParticles;
  }
  
  /**
   * 释放资源
   */
  dispose() {
    this.clearParticles();
    this.clearEmitters();
    this.particlePool = [];
  }
}
