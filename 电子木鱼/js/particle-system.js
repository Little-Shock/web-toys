/**
 * 粒子系统
 * 负责处理所有粒子效果
 */
class ParticleSystem {
  constructor(canvas) {
    // 画布和上下文
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 检测设备类型和性能
    const { isMobile, isIOS, isLowEndDevice } = detectDevice();
    this.isMobile = isMobile;
    this.isIOS = isIOS;
    this.isLowEndDevice = isLowEndDevice;

    // 粒子系统参数
    this.params = {
      enabled: true,
      maxParticles: this.isLowEndDevice ? 50 : (this.isMobile ? 100 : 300),
      gravity: 0.05,
      friction: 0.98,
      qualityLevel: this.isLowEndDevice ? 0 : (this.isMobile ? 1 : 2) // 0=低, 1=中, 2=高
    };

    // 粒子数组
    this.particles = [];

    // 发射器数组
    this.emitters = [];

    // 时间跟踪
    this.lastTime = 0;
    this.deltaTime = 0;

    // 初始化
    this.init();
  }

  /**
   * 初始化粒子系统
   */
  init() {
    // 调整画布大小
    this.resize();

    // 开始动画循环
    this.animate();

    // 添加窗口大小变化监听
    window.addEventListener('resize', this.resize.bind(this));
  }

  /**
   * 调整画布大小
   */
  resize() {
    const dpr = window.devicePixelRatio || 1;

    // 获取容器大小
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // 设置画布大小
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // 缩放上下文
    this.ctx.scale(dpr, dpr);

    // 保存画布尺寸
    this.width = displayWidth;
    this.height = displayHeight;
  }

  /**
   * 动画循环
   */
  animate() {
    // 计算时间增量
    const now = performance.now();
    this.deltaTime = (now - this.lastTime) / 1000; // 转换为秒
    this.lastTime = now;

    // 限制时间增量，防止大延迟导致的问题
    this.deltaTime = Math.min(this.deltaTime, 0.1);

    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 更新和绘制粒子
    if (this.params.enabled) {
      this.updateParticles();
      this.updateEmitters();
    }

    // 继续动画循环
    requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * 创建粒子
   * @param {Object} options - 粒子选项
   * @returns {Object} 粒子对象
   */
  createParticle(options = {}) {
    const particle = {
      x: options.x || 0,
      y: options.y || 0,
      size: options.size || random(3, 8),
      color: options.color || randomColor(),
      vx: options.vx || random(-2, 2),
      vy: options.vy || random(-2, 2),
      rotation: options.rotation || random(0, Math.PI * 2),
      rotationSpeed: options.rotationSpeed || random(-0.1, 0.1),
      life: 0,
      maxLife: options.life || random(0.5, 2),
      alpha: 1,
      shape: options.shape || 'circle',
      active: true
    };

    this.particles.push(particle);
    return particle;
  }

  /**
   * 创建粒子爆发
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} count - 粒子数量
   * @param {Object} options - 粒子选项
   */
  createBurst(x, y, count, options = {}) {
    // 如果粒子数量已经达到上限的80%，则减少新创建的粒子数量
    if (this.particles.length > this.params.maxParticles * 0.8) {
      count = Math.floor(count * 0.5);
    }

    // 如果粒子数量已经达到上限的95%，则大幅减少新创建的粒子数量
    if (this.particles.length > this.params.maxParticles * 0.95) {
      count = Math.floor(count * 0.2);
    }

    // 转换为画布坐标
    const canvasX = x * this.width;
    const canvasY = y * this.height;

    // 根据设备性能和质量级别调整粒子数量
    let adjustedCount;
    switch (this.params.qualityLevel) {
      case 0: // 低质量
        adjustedCount = Math.floor(count * 0.3);
        break;
      case 1: // 中质量
        adjustedCount = Math.floor(count * 0.6);
        break;
      case 2: // 高质量
      default:
        adjustedCount = count;
        break;
    }

    // 创建粒子
    for (let i = 0; i < adjustedCount; i++) {
      // 如果已经达到最大粒子数量，则停止创建
      if (this.particles.length >= this.params.maxParticles) {
        break;
      }

      // 计算速度
      const speed = options.speed || random(1, 5);
      const angle = random(0, Math.PI * 2);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // 创建粒子
      this.createParticle({
        x: canvasX,
        y: canvasY,
        vx,
        vy,
        size: options.size || random(2, 6),
        color: options.color || randomColor(),
        life: options.life || random(0.5, 1.5),
        shape: options.shape || 'circle'
      });
    }
  }

  /**
   * 创建波纹效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 波纹选项
   */
  createRipple(x, y, options = {}) {
    // 转换为画布坐标
    const canvasX = x * this.width;
    const canvasY = y * this.height;

    // 波纹参数
    const ripple = {
      x: canvasX,
      y: canvasY,
      radius: options.radius || 5,
      maxRadius: options.maxRadius || 100,
      width: options.width || 2,
      color: options.color || 'rgba(255, 255, 255, 0.7)',
      speed: options.speed || 3,
      life: 0,
      maxLife: options.life || 1,
      active: true
    };

    // 添加到粒子数组
    this.particles.push(ripple);

    return ripple;
  }

  /**
   * 创建文字粒子
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {string} text - 文字内容
   * @param {Object} options - 文字选项
   */
  createTextParticles(x, y, text, options = {}) {
    // 转换为画布坐标
    const canvasX = x * this.width;
    const canvasY = y * this.height;

    // 设置文字样式
    this.ctx.font = options.font || '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // 获取文字宽度
    const textWidth = this.ctx.measureText(text).width;

    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = textWidth + 20;
    tempCanvas.height = 40;

    // 在临时画布上绘制文字
    tempCtx.font = options.font || '20px Arial';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = options.color || 'white';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    // 粒子间距
    const gap = this.isLowEndDevice ? 4 : (this.isMobile ? 3 : 2);

    // 创建粒子
    for (let y = 0; y < tempCanvas.height; y += gap) {
      for (let x = 0; x < tempCanvas.width; x += gap) {
        const i = (y * tempCanvas.width + x) * 4;
        const alpha = pixels[i + 3];

        // 只为不透明的像素创建粒子
        if (alpha > 50) {
          // 计算粒子位置
          const px = canvasX + (x - tempCanvas.width / 2);
          const py = canvasY + (y - tempCanvas.height / 2);

          // 创建粒子
          this.createParticle({
            x: px,
            y: py,
            vx: random(-1, 1),
            vy: random(-1, 1),
            size: options.size || random(1, 3),
            color: options.color || 'white',
            life: options.life || random(0.5, 1.5),
            shape: 'circle'
          });
        }
      }
    }
  }

  /**
   * 创建发射器
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 发射器选项
   * @returns {Object} 发射器对象
   */
  createEmitter(x, y, options = {}) {
    // 转换为画布坐标
    const canvasX = x * this.width;
    const canvasY = y * this.height;

    // 创建发射器
    const emitter = {
      x: canvasX,
      y: canvasY,
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

    // 添加到发射器数组
    this.emitters.push(emitter);

    return emitter;
  }

  /**
   * 更新粒子
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (!p.active) {
        // 移除非活动粒子
        this.particles.splice(i, 1);
        continue;
      }

      // 更新生命周期
      p.life += this.deltaTime;

      // 检查是否过期
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      // 计算生命周期比例
      const lifeRatio = p.life / p.maxLife;

      // 根据粒子类型更新
      if (p.radius !== undefined) {
        // 波纹类型
        p.radius += p.speed * this.deltaTime;
        p.alpha = 1 - lifeRatio;

        // 绘制波纹
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`);
        this.ctx.lineWidth = p.width;
        this.ctx.stroke();
      } else {
        // 普通粒子

        // 应用重力
        p.vy += this.params.gravity * this.deltaTime;

        // 应用摩擦力
        p.vx *= this.params.friction;
        p.vy *= this.params.friction;

        // 更新位置
        p.x += p.vx;
        p.y += p.vy;

        // 更新旋转
        p.rotation += p.rotationSpeed;

        // 更新透明度
        p.alpha = 1 - lifeRatio;

        // 绘制粒子
        this.drawParticle(p);
      }
    }
  }

  /**
   * 绘制粒子
   * @param {Object} p - 粒子对象
   */
  drawParticle(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);

    // 设置透明度
    this.ctx.globalAlpha = p.alpha;

    // 根据形状绘制
    switch (p.shape) {
      case 'square':
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        break;

      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size / 2);
        this.ctx.lineTo(p.size / 2, p.size / 2);
        this.ctx.lineTo(-p.size / 2, p.size / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        break;

      case 'star':
        this.drawStar(0, 0, p.size, p.size / 2, 5);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        break;

      case 'circle':
      default:
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
        break;
    }

    this.ctx.restore();
  }

  /**
   * 绘制星形
   * @param {number} x - 中心x坐标
   * @param {number} y - 中心y坐标
   * @param {number} outerRadius - 外半径
   * @param {number} innerRadius - 内半径
   * @param {number} points - 星形点数
   */
  drawStar(x, y, outerRadius, innerRadius, points) {
    this.ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;

      const px = x + radius * Math.sin(angle);
      const py = y + radius * Math.cos(angle);

      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }

    this.ctx.closePath();
  }

  /**
   * 更新发射器
   */
  updateEmitters() {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];

      if (!emitter.active) {
        // 移除非活动发射器
        this.emitters.splice(i, 1);
        continue;
      }

      // 检查是否达到发射上限
      if (emitter.count > 0 && emitter.emitted >= emitter.count) {
        emitter.active = false;
        continue;
      }

      // 计算发射间隔
      const emitInterval = 1 / emitter.rate;

      // 检查是否应该发射
      if (this.deltaTime > 0 && (this.lastTime - emitter.lastEmitTime) / 1000 >= emitInterval) {
        // 发射粒子
        const options = { ...emitter.particleOptions };

        // 添加随机性
        options.vx = (options.vx || 0) + random(-0.5, 0.5);
        options.vy = (options.vy || 0) + random(-0.5, 0.5);

        // 创建粒子
        this.createParticle({
          x: emitter.x,
          y: emitter.y,
          ...options
        });

        // 更新发射时间和计数
        emitter.lastEmitTime = this.lastTime;
        emitter.emitted++;
      }
    }
  }

  /**
   * 创建木鱼敲击效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  createTapEffect(x, y, intensity = 1) {
    // 如果禁用粒子效果，直接返回
    if (!this.params.enabled) return;

    // 获取粒子风格
    const particleStyle = window.appState ? window.appState.settings.particleStyle : 1;

    // 根据粒子风格选择不同的效果
    switch (particleStyle) {
      case 0: // 简约风格
        this.createSimpleTapEffect(x, y, intensity);
        break;
      case 1: // 标准风格
        this.createStandardTapEffect(x, y, intensity);
        break;
      case 2: // 华丽风格
        this.createFancyTapEffect(x, y, intensity);
        break;
      default:
        this.createStandardTapEffect(x, y, intensity);
    }
  }

  /**
   * 创建简约风格敲击效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  createSimpleTapEffect(x, y, intensity) {
    // 根据强度和设备性能调整粒子数量
    const particleCount = this.isLowEndDevice ? 5 : (this.isMobile ? 10 : 15);
    const adjustedCount = Math.floor(particleCount * intensity);

    // 创建简单的粒子爆发 - 白色粒子
    this.createBurst(x, y, adjustedCount, {
      color: 'rgba(255, 255, 255, 0.8)',
      size: 2 + intensity * 2,
      speed: 1 + intensity * 2,
      life: 0.4 + intensity * 0.3,
      shape: 'circle'
    });

    // 创建单个波纹
    this.createRipple(x, y, {
      color: 'rgba(255, 255, 255, 0.4)',
      maxRadius: 40 + intensity * 30,
      width: 1,
      speed: 30 + intensity * 15,
      life: 0.4 + intensity * 0.2
    });
  }

  /**
   * 创建标准风格敲击效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  createStandardTapEffect(x, y, intensity) {
    // 根据强度调整效果
    const particleCount = this.isLowEndDevice ? 10 : (this.isMobile ? 20 : 30);
    const adjustedCount = Math.floor(particleCount * intensity);

    // 创建粒子爆发 - 金色粒子
    this.createBurst(x, y, adjustedCount, {
      color: `hsla(${40 + random(-10, 10)}, 100%, ${70 + random(-10, 10)}%, 1)`,
      size: 3 + intensity * 3,
      speed: 2 + intensity * 3,
      life: 0.5 + intensity * 0.5
    });

    // 创建波纹效果
    this.createRipple(x, y, {
      color: `rgba(255, 255, 255, ${0.5 * intensity})`,
      maxRadius: 50 + intensity * 50,
      width: 1 + intensity * 2,
      speed: 40 + intensity * 20,
      life: 0.5 + intensity * 0.3
    });

    // 高强度时添加额外效果
    if (intensity > 0.7) {
      // 创建第二个波纹
      this.createRipple(x, y, {
        color: `rgba(255, 200, 100, ${0.3 * intensity})`,
        maxRadius: 30 + intensity * 40,
        width: 1 + intensity,
        speed: 30 + intensity * 15,
        life: 0.4 + intensity * 0.2
      });
    }
  }

  /**
   * 创建华丽风格敲击效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} intensity - 强度 (0-1)
   */
  createFancyTapEffect(x, y, intensity) {
    // 根据强度调整效果 - 华丽风格使用更多粒子
    const particleCount = this.isLowEndDevice ? 15 : (this.isMobile ? 30 : 50);
    const adjustedCount = Math.floor(particleCount * intensity);

    // 创建多彩粒子爆发
    this.createBurst(x, y, adjustedCount, {
      color: randomColor(), // 随机颜色
      size: 3 + intensity * 4,
      speed: 3 + intensity * 4,
      life: 0.6 + intensity * 0.6,
      shape: random() > 0.5 ? 'circle' : 'star' // 随机形状
    });

    // 创建第二组粒子 - 不同颜色
    this.createBurst(x, y, Math.floor(adjustedCount * 0.5), {
      color: randomColor(),
      size: 2 + intensity * 3,
      speed: 2 + intensity * 3,
      life: 0.5 + intensity * 0.5,
      shape: 'square'
    });

    // 创建多层波纹效果
    for (let i = 0; i < 3; i++) {
      const alpha = 0.6 - i * 0.15;
      const delay = i * 0.1;

      setTimeout(() => {
        if (!this.params.enabled) return;

        this.createRipple(x, y, {
          color: `rgba(255, 255, 255, ${alpha * intensity})`,
          maxRadius: 40 + intensity * 60 + i * 20,
          width: 2 - i * 0.5,
          speed: 50 + intensity * 25 - i * 10,
          life: 0.6 + intensity * 0.4 - i * 0.1
        });
      }, delay * 1000);
    }

    // 高强度时添加额外效果
    if (intensity > 0.6) {
      // 创建发射器 - 短暂的粒子流
      this.createEmitter(x, y, {
        rate: 20,
        count: 10,
        color: `hsla(${random(0, 360)}, 100%, 70%, 0.8)`,
        size: 2 + intensity * 2,
        life: 0.3 + intensity * 0.3,
        shape: 'star'
      });
    }
  }

  /**
   * 创建连击效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} combo - 连击数
   */
  createComboEffect(x, y, combo) {
    // 如果禁用粒子效果，直接返回
    if (!this.params.enabled) return;

    // 获取DMC风格的连击评价
    const ranking = getDMCRanking(combo);

    // 创建粒子爆发
    this.createBurst(x, y, this.isLowEndDevice ? 15 : (this.isMobile ? 25 : 40), {
      color: ranking.color,
      size: 4,
      speed: 3 + Math.min(5, combo / 20),
      life: 1 + Math.min(1, combo / 50),
      shape: 'star'
    });

    // 创建波纹效果
    this.createRipple(x, y, {
      color: ranking.color.replace(')', ', 0.7)').replace('rgb', 'rgba'),
      maxRadius: 80 + Math.min(50, combo),
      width: 2,
      speed: 50 + Math.min(30, combo / 2),
      life: 0.8
    });

    // 高连击时添加额外效果
    if (combo >= 50) {
      // 创建发射器
      this.createEmitter(x, y, {
        rate: 20,
        count: 10,
        color: ranking.color,
        size: 3,
        life: 0.8,
        shape: 'star'
      });
    }
  }

  /**
   * 创建里程碑效果
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} level - 里程碑级别
   */
  createMilestoneEffect(x, y, level) {
    // 如果禁用粒子效果，直接返回
    if (!this.params.enabled) return;

    // 根据级别调整效果
    const colors = [
      '#ffeb3b', // 黄色
      '#ff9800', // 橙色
      '#f44336'  // 红色
    ];

    const color = colors[Math.min(level, colors.length - 1)];
    const particleCount = this.isLowEndDevice ? 20 : (this.isMobile ? 40 : 80);

    // 创建粒子爆发
    this.createBurst(x, y, particleCount, {
      color,
      size: 4 + level,
      speed: 4 + level,
      life: 1 + level * 0.5,
      shape: 'star'
    });

    // 创建多个波纹
    for (let i = 0; i < 3; i++) {
      this.createRipple(x, y, {
        color: color.replace(')', ', ' + (0.7 - i * 0.2) + ')').replace('#', 'rgba('),
        maxRadius: 70 + level * 30 + i * 20,
        width: 2 + i,
        speed: 40 + level * 10 + i * 5,
        life: 0.8 + i * 0.2
      });
    }

    // 创建发射器
    this.createEmitter(x, y, {
      rate: 30,
      count: 20 + level * 10,
      color,
      size: 3 + level,
      life: 1,
      shape: 'star'
    });
  }

  /**
   * 设置粒子系统启用状态
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.params.enabled = enabled;

    // 如果禁用，清除所有粒子
    if (!enabled) {
      this.particles = [];
      this.emitters = [];
    }
  }
}
