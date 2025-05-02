/**
 * 波纹渲染器
 * 负责处理所有与波纹效果相关的渲染
 * 优化版本：提高移动端性能，改善视觉效果
 */
class RippleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }); // 禁用alpha通道以提高性能

    // 设置画布尺寸
    this.resize();

    // 波纹数组
    this.ripples = [];

    // 背景图像
    this.backgroundImage = null;
    this.hasCustomBackground = false;
    this.backgroundCanvas = document.createElement('canvas'); // 用于缓存背景
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');

    // 渲染参数
    this.params = {
      intensity: 0.5,    // 波纹强度
      size: 0.5,         // 波纹大小
      decay: 0.5,        // 波纹衰减速度
      multiElement: true, // 是否允许元素混合
      maxRipples: 50,    // 最大波纹数量，移动端可能需要更低的值
      quality: this.detectPerformance() // 根据设备性能自动调整质量
    };

    // 元素颜色配置
    this.elementColors = {
      water: {
        primary: 'rgba(0, 229, 255, 0.7)',
        secondary: 'rgba(0, 153, 255, 0.4)',
        glow: 'rgba(0, 229, 255, 0.2)'
      },
      fire: {
        primary: 'rgba(255, 87, 34, 0.7)',
        secondary: 'rgba(255, 152, 0, 0.4)',
        glow: 'rgba(255, 87, 34, 0.2)'
      },
      electric: {
        primary: 'rgba(179, 136, 255, 0.7)',
        secondary: 'rgba(124, 77, 255, 0.4)',
        glow: 'rgba(179, 136, 255, 0.2)'
      },
      light: {
        primary: 'rgba(255, 235, 59, 0.7)',
        secondary: 'rgba(255, 255, 255, 0.4)',
        glow: 'rgba(255, 235, 59, 0.2)'
      }
    };

    // 当前选中的元素
    this.currentElement = 'water';

    // 动画帧请求ID
    this.animationFrameId = null;

    // 性能监控
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 500; // 每500ms更新一次FPS
    this.lastFpsUpdate = 0;

    // 绑定事件处理
    this.resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);
  }

  /**
   * 检测设备性能并返回适当的质量级别
   * @returns {string} 'high', 'medium', 或 'low'
   */
  detectPerformance() {
    // 检查是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 检查设备像素比
    const pixelRatio = window.devicePixelRatio || 1;

    // 检查屏幕尺寸
    const screenSize = Math.max(window.innerWidth, window.innerHeight);

    if (isMobile) {
      if (pixelRatio > 2 && screenSize > 1000) {
        return 'medium';
      } else {
        return 'low';
      }
    } else {
      if (pixelRatio > 1 && screenSize > 1200) {
        return 'high';
      } else {
        return 'medium';
      }
    }
  }

  /**
   * 调整画布大小
   */
  resize() {
    // 获取设备像素比以支持高DPI屏幕
    const pixelRatio = window.devicePixelRatio || 1;

    // 获取显示尺寸
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // 设置画布尺寸，考虑设备像素比和性能设置
    let scaleFactor = 1;
    if (this.params.quality === 'low') {
      scaleFactor = 0.75; // 低质量模式下降低分辨率
    } else if (this.params.quality === 'medium') {
      scaleFactor = pixelRatio > 1 ? 0.85 : 1; // 中等质量模式下根据像素比调整
    } else {
      scaleFactor = pixelRatio; // 高质量模式使用设备像素比
    }

    // 设置画布尺寸
    this.canvas.width = Math.floor(displayWidth * scaleFactor);
    this.canvas.height = Math.floor(displayHeight * scaleFactor);
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';

    // 设置背景缓存画布尺寸
    this.backgroundCanvas.width = this.canvas.width;
    this.backgroundCanvas.height = this.canvas.height;

    // 保存尺寸
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.scaleFactor = scaleFactor;

    // 更新背景
    this.updateBackgroundCache();

    // 重新绘制
    this.render();

    console.log(`Canvas resized: ${this.width}x${this.height}, Quality: ${this.params.quality}, Scale: ${scaleFactor}`);
  }

  /**
   * 设置背景图像
   * @param {string|Image} source - 图像源（URL或Image对象）
   */
  setBackground(source) {
    return new Promise((resolve, reject) => {
      if (!source) {
        // 如果没有提供源，使用默认渐变背景
        this.backgroundImage = null;
        this.hasCustomBackground = false;
        this.updateBackgroundCache();
        resolve();
        return;
      }

      const img = new Image();

      img.onload = () => {
        this.backgroundImage = img;
        this.hasCustomBackground = true;
        this.updateBackgroundCache();
        resolve();
      };

      img.onerror = (error) => {
        console.error('背景图像加载失败:', error);
        this.backgroundImage = null;
        this.hasCustomBackground = false;
        this.updateBackgroundCache();
        reject(new Error('背景图像加载失败'));
      };

      // 添加超时处理
      const timeout = setTimeout(() => {
        img.src = ''; // 中止加载
        reject(new Error('背景图像加载超时'));
      }, 15000); // 15秒超时

      img.onload = () => {
        clearTimeout(timeout);
        this.backgroundImage = img;
        this.hasCustomBackground = true;
        this.updateBackgroundCache();
        resolve();
      };

      if (typeof source === 'string') {
        img.src = source;
      } else if (source instanceof Image) {
        img.src = source.src;
      } else {
        clearTimeout(timeout);
        reject(new Error('无效的图像源'));
      }
    });
  }

  /**
   * 更新背景缓存
   * 将背景绘制到单独的缓存画布中以提高性能
   */
  updateBackgroundCache() {
    const ctx = this.backgroundCtx;

    // 清除背景画布
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.hasCustomBackground && this.backgroundImage) {
      // 绘制自定义背景图像，保持纵横比并填充整个画布
      const imgRatio = this.backgroundImage.width / this.backgroundImage.height;
      const canvasRatio = this.width / this.height;

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

      if (canvasRatio > imgRatio) {
        // 画布比图像更宽
        drawWidth = this.width;
        drawHeight = this.width / imgRatio;
        offsetY = (this.height - drawHeight) / 2;
      } else {
        // 画布比图像更高
        drawHeight = this.height;
        drawWidth = this.height * imgRatio;
        offsetX = (this.width - drawWidth) / 2;
      }

      try {
        ctx.drawImage(this.backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

        // 添加暗色叠加层，使波纹更明显
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.width, this.height);
      } catch (error) {
        console.error('绘制背景图像时出错:', error);
        this.drawDefaultBackground();
      }
    } else {
      this.drawDefaultBackground();
    }
  }

  /**
   * 绘制默认背景
   */
  drawDefaultBackground() {
    const ctx = this.backgroundCtx;

    // 绘制默认渐变背景
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.5
    );

    gradient.addColorStop(0, '#1a237e');
    gradient.addColorStop(1, '#000000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 添加一些随机星星
    this.drawStars(ctx);
  }

  /**
   * 绘制背景到主画布
   */
  drawBackground() {
    // 直接从缓存画布复制背景
    this.ctx.drawImage(this.backgroundCanvas, 0, 0);
  }

  /**
   * 绘制星星背景
   * @param {CanvasRenderingContext2D} ctx - 绘制上下文
   */
  drawStars(ctx = this.ctx) {
    // 根据质量级别和画布大小调整星星数量
    let density = 5000;
    if (this.params.quality === 'low') {
      density = 8000;
    } else if (this.params.quality === 'high') {
      density = 3000;
    }

    const starCount = Math.floor(this.width * this.height / density);

    ctx.save();

    // 使用批处理方式绘制星星以提高性能
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = Math.random() * 1.5;
      const opacity = Math.random() * 0.8 + 0.2;

      // 添加一些大一点的星星
      if (Math.random() < 0.05) {
        // 绘制发光的大星星
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
        glow.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 添加波纹
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} element - 元素类型
   * @param {number} intensity - 强度 (0-1)
   */
  addRipple(x, y, element, intensity = 1) {
    // 应用缩放因子到坐标
    x = x * this.scaleFactor;
    y = y * this.scaleFactor;

    // 计算实际大小 (根据质量级别调整)
    let sizeMultiplier = 1;
    if (this.params.quality === 'low') {
      sizeMultiplier = 0.8; // 低质量模式下减小波纹大小
    } else if (this.params.quality === 'high') {
      sizeMultiplier = 1.2; // 高质量模式下增大波纹大小
    }

    const baseSize = (50 + this.params.size * 100) * sizeMultiplier;
    const size = baseSize * (0.8 + Math.random() * 0.4) * (0.7 + intensity * 0.6);

    // 计算实际强度
    const actualIntensity = this.params.intensity * intensity;

    // 计算衰减速度
    const decay = 0.01 + this.params.decay * 0.04;

    // 创建新波纹
    const ripple = {
      x,
      y,
      size,
      element,
      intensity: actualIntensity,
      opacity: 0.8,
      age: 0,
      decay,
      // 添加一些随机变化
      speed: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      // 添加一些元素特定的属性
      elementProps: this.getElementSpecificProps(element)
    };

    this.ripples.push(ripple);

    // 如果波纹数量过多，移除最老的
    const maxRipples = this.params.maxRipples;
    if (this.ripples.length > maxRipples) {
      this.ripples.splice(0, this.ripples.length - maxRipples);
    }
  }

  /**
   * 获取元素特定的属性
   * @param {string} element - 元素类型
   * @returns {Object} 元素特定的属性
   */
  getElementSpecificProps(element) {
    switch (element) {
      case 'water':
        return {
          waveCount: 2 + Math.floor(Math.random() * 2),
          waveSpeed: 0.05 + Math.random() * 0.05
        };
      case 'fire':
        return {
          particleCount: 8 + Math.floor(Math.random() * 8),
          flickerRate: 0.1 + Math.random() * 0.2
        };
      case 'electric':
        return {
          boltCount: 4 + Math.floor(Math.random() * 4),
          jitterFactor: 0.3 + Math.random() * 0.5
        };
      case 'light':
        return {
          rayCount: 6 + Math.floor(Math.random() * 6),
          pulseRate: 0.05 + Math.random() * 0.1
        };
      default:
        return {};
    }
  }

  /**
   * 更新波纹状态
   */
  update() {
    // 更新FPS计数
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.lastFpsUpdate = now;
      this.frameCount = 0;

      // 根据FPS动态调整质量
      this.adjustQualityBasedOnFps();
    }

    // 更新所有波纹
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];

      // 增加年龄
      ripple.age += ripple.speed;

      // 减少不透明度
      ripple.opacity -= ripple.decay;

      // 更新旋转
      ripple.rotation += ripple.rotationSpeed;

      // 如果波纹完全透明，移除它
      if (ripple.opacity <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  /**
   * 根据FPS动态调整质量
   */
  adjustQualityBasedOnFps() {
    // 只有在FPS低于阈值时才降低质量
    if (this.fps < 30 && this.params.quality !== 'low') {
      this.params.quality = 'low';
      this.params.maxRipples = 30; // 减少最大波纹数量
      console.log(`性能优化: 降低质量到 ${this.params.quality}, FPS: ${this.fps}`);
      this.resize(); // 重新调整画布大小
    } else if (this.fps > 50 && this.params.quality === 'low') {
      this.params.quality = 'medium';
      this.params.maxRipples = 50; // 恢复最大波纹数量
      console.log(`性能优化: 提高质量到 ${this.params.quality}, FPS: ${this.fps}`);
      this.resize(); // 重新调整画布大小
    }
  }

  /**
   * 渲染所有波纹
   */
  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 重绘背景
    this.drawBackground();

    // 根据质量级别决定是否跳过某些波纹
    let skipFactor = 1;
    if (this.params.quality === 'low' && this.ripples.length > 20) {
      skipFactor = 2; // 低质量模式下，如果波纹太多，每隔一个绘制一个
    }

    // 绘制所有波纹
    for (let i = 0; i < this.ripples.length; i += skipFactor) {
      this.drawRipple(this.ripples[i]);
    }

    // 在调试模式下显示FPS
    if (window.DEBUG_MODE) {
      this.drawDebugInfo();
    }
  }

  /**
   * 绘制调试信息
   */
  drawDebugInfo() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 150, 60);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${this.fps}`, 20, 30);
    this.ctx.fillText(`Quality: ${this.params.quality}`, 20, 50);
    this.ctx.fillText(`Ripples: ${this.ripples.length}/${this.params.maxRipples}`, 20, 70);
    this.ctx.restore();
  }

  /**
   * 绘制单个波纹
   * @param {Object} ripple - 波纹对象
   */
  drawRipple(ripple) {
    const { x, y, size, element, opacity, age, rotation, intensity, elementProps } = ripple;
    const colors = this.elementColors[element];

    // 如果不透明度太低，跳过绘制以提高性能
    if (opacity < 0.05) return;

    this.ctx.save();

    // 移动到波纹中心并旋转
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    // 根据质量级别决定是否绘制光晕
    if (this.params.quality !== 'low') {
      // 绘制外部光晕
      const glowSize = size * (1 + age * 0.1);
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);

      gradient.addColorStop(0, colors.glow.replace('0.2', opacity.toString()));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // 根据元素类型绘制不同的波纹效果
    switch (element) {
      case 'water':
        this.drawWaterRipple(size, age, opacity, colors, intensity, elementProps);
        break;
      case 'fire':
        this.drawFireRipple(size, age, opacity, colors, intensity, elementProps);
        break;
      case 'electric':
        this.drawElectricRipple(size, age, opacity, colors, intensity, elementProps);
        break;
      case 'light':
        this.drawLightRipple(size, age, opacity, colors, intensity, elementProps);
        break;
    }

    this.ctx.restore();
  }

  /**
   * 绘制水元素波纹
   * @param {number} size - 波纹大小
   * @param {number} age - 波纹年龄
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   * @param {number} intensity - 强度
   * @param {Object} props - 元素特定属性
   */
  drawWaterRipple(size, age, opacity, colors, intensity, props = {}) {
    const { waveCount = 3, waveSpeed = 0.1 } = props;

    // 根据质量级别调整环数
    let ringCount = this.params.quality === 'low' ? 2 : waveCount;

    // 绘制多个同心圆
    for (let i = 0; i < ringCount; i++) {
      const progress = (age * waveSpeed + i / ringCount) % 1;
      const ringSize = size * progress;
      const ringOpacity = opacity * (1 - progress) * 0.8;

      // 跳过太小或不可见的环
      if (ringSize < 5 || ringOpacity < 0.05) continue;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
      this.ctx.lineWidth = 2 + intensity * 3;
      this.ctx.strokeStyle = colors.primary.replace('0.7', ringOpacity.toString());
      this.ctx.stroke();
    }

    // 绘制中心水滴
    const dropSize = size * 0.2 * (1 - age * 0.02);
    if (dropSize > 0) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, dropSize, 0, Math.PI * 2);
      this.ctx.fillStyle = colors.secondary.replace('0.4', opacity.toString());
      this.ctx.fill();

      // 高质量模式下添加水滴高光
      if (this.params.quality === 'high') {
        const highlightSize = dropSize * 0.5;
        const highlightOffset = dropSize * 0.3;

        this.ctx.beginPath();
        this.ctx.arc(-highlightOffset, -highlightOffset, highlightSize, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        this.ctx.fill();
      }
    }
  }

  /**
   * 绘制火元素波纹
   * @param {number} size - 波纹大小
   * @param {number} age - 波纹年龄
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   * @param {number} intensity - 强度
   * @param {Object} props - 元素特定属性
   */
  drawFireRipple(size, age, opacity, colors, intensity, props = {}) {
    const { particleCount = 12, flickerRate = 0.2 } = props;

    // 根据质量级别调整粒子数量
    let actualParticleCount = Math.floor(particleCount * intensity);
    if (this.params.quality === 'low') {
      actualParticleCount = Math.floor(actualParticleCount * 0.6);
    }

    // 绘制火焰粒子
    for (let i = 0; i < actualParticleCount; i++) {
      const angle = (i / actualParticleCount) * Math.PI * 2 + age * 0.2;
      const flicker = 1 + Math.sin(age * flickerRate * 10 + i) * 0.3; // 火焰闪烁效果
      const distance = size * (0.3 + 0.7 * Math.sin(age * 0.3 + i)) * flicker;

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const particleSize = (size * 0.15) * (1 - age * 0.05) * (0.5 + Math.random() * 0.5);

      // 跳过太小的粒子
      if (particleSize < 2) continue;

      this.ctx.beginPath();
      this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      this.ctx.fillStyle = colors.primary.replace('0.7', (opacity * 0.8).toString());
      this.ctx.fill();
    }

    // 绘制中心火球
    const coreSize = size * 0.3 * (1 - age * 0.03);
    if (coreSize > 0) {
      const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);

      coreGradient.addColorStop(0, colors.secondary.replace('0.4', opacity.toString()));
      coreGradient.addColorStop(1, colors.primary.replace('0.7', '0'));

      this.ctx.beginPath();
      this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      this.ctx.fillStyle = coreGradient;
      this.ctx.fill();
    }
  }

  /**
   * 绘制电元素波纹
   * @param {number} size - 波纹大小
   * @param {number} age - 波纹年龄
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   * @param {number} intensity - 强度
   * @param {Object} props - 元素特定属性
   */
  drawElectricRipple(size, age, opacity, colors, intensity, props = {}) {
    const { boltCount = 6, jitterFactor = 0.5 } = props;

    // 根据质量级别调整闪电数量
    let actualBoltCount = Math.floor(boltCount + intensity * 4);
    if (this.params.quality === 'low') {
      actualBoltCount = Math.floor(actualBoltCount * 0.7);
    }

    this.ctx.lineWidth = 2 + intensity * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 绘制闪电
    for (let i = 0; i < actualBoltCount; i++) {
      const angle = (i / actualBoltCount) * Math.PI * 2 + age * 0.1;
      const length = size * (0.5 + Math.random() * 0.5);

      // 创建闪电路径
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);

      let x = 0, y = 0;
      // 根据质量级别调整分段数
      const segments = this.params.quality === 'low' ? 3 : (4 + Math.floor(intensity * 3));

      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        // 使用jitterFactor增加随机性
        const segmentAngle = angle + (Math.random() - 0.5) * jitterFactor;

        x += Math.cos(segmentAngle) * segmentLength;
        y += Math.sin(segmentAngle) * segmentLength;

        this.ctx.lineTo(x, y);
      }

      // 添加闪电闪烁效果
      const jitter = 0.7 + Math.sin(age * 10 + i * 3) * 0.3;
      this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.9 * jitter).toString());
      this.ctx.stroke();
    }

    // 绘制中心电球
    const coreSize = size * 0.2 * (1 - age * 0.02);
    if (coreSize > 0) {
      // 添加闪烁效果
      const pulseEffect = 0.8 + Math.sin(age * 15) * 0.2;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, coreSize * pulseEffect, 0, Math.PI * 2);
      this.ctx.fillStyle = colors.secondary.replace('0.4', (opacity * pulseEffect).toString());
      this.ctx.fill();
    }
  }

  /**
   * 绘制光元素波纹
   * @param {number} size - 波纹大小
   * @param {number} age - 波纹年龄
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   * @param {number} intensity - 强度
   * @param {Object} props - 元素特定属性
   */
  drawLightRipple(size, age, opacity, colors, intensity, props = {}) {
    const { rayCount = 8, pulseRate = 0.1 } = props;

    // 根据质量级别调整光线数量
    let actualRayCount = Math.floor(rayCount + intensity * 6);
    if (this.params.quality === 'low') {
      actualRayCount = Math.floor(actualRayCount * 0.6);
    }

    const maxRayLength = size * (0.7 + intensity * 0.3);

    // 绘制光芒
    for (let i = 0; i < actualRayCount; i++) {
      const angle = (i / actualRayCount) * Math.PI * 2;
      // 使用pulseRate创建脉动效果
      const pulse = 0.5 + 0.5 * Math.sin(age * pulseRate * 10 + i * 0.7);
      const rayLength = maxRayLength * pulse;

      const x = Math.cos(angle) * rayLength;
      const y = Math.sin(angle) * rayLength;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(x, y);
      this.ctx.lineWidth = 2 + intensity * 3;
      this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.7).toString());
      this.ctx.stroke();
    }

    // 绘制中心光球
    const coreSize = size * 0.25 * (1 - age * 0.01);
    if (coreSize > 0) {
      // 添加脉动效果
      const pulseEffect = 0.8 + Math.sin(age * pulseRate * 15) * 0.2;
      const adjustedCoreSize = coreSize * pulseEffect;

      const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, adjustedCoreSize);

      coreGradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
      coreGradient.addColorStop(0.7, colors.secondary.replace('0.4', (opacity * 0.8).toString()));
      coreGradient.addColorStop(1, colors.primary.replace('0.7', '0'));

      this.ctx.beginPath();
      this.ctx.arc(0, 0, adjustedCoreSize, 0, Math.PI * 2);
      this.ctx.fillStyle = coreGradient;
      this.ctx.fill();

      // 高质量模式下添加额外的光晕效果
      if (this.params.quality === 'high') {
        const glareSize = adjustedCoreSize * 1.5;
        const glareGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glareSize);

        glareGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
        glareGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(0, 0, glareSize, 0, Math.PI * 2);
        this.ctx.fillStyle = glareGradient;
        this.ctx.fill();
      }
    }
  }

  /**
   * 开始动画循环
   */
  startAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = this.lastFrameTime;
    this.frameCount = 0;

    const animate = () => {
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // 如果标签页不可见或帧率过低，降低更新频率
      if (document.hidden || deltaTime > 100) {
        this.update();
        this.render();
        this.animationFrameId = setTimeout(() => requestAnimationFrame(animate), 100);
      } else {
        this.update();
        this.render();
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * 停止动画循环
   */
  stopAnimation() {
    if (this.animationFrameId) {
      if (typeof this.animationFrameId === 'number') {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
  }

  /**
   * 清除所有波纹
   */
  clearRipples() {
    this.ripples = [];
    this.render();
  }

  /**
   * 设置当前元素类型
   * @param {string} element - 元素类型
   */
  setCurrentElement(element) {
    if (this.elementColors[element]) {
      this.currentElement = element;

      // 添加元素切换的视觉反馈
      this.addElementSwitchEffect(element);
    }
  }

  /**
   * 添加元素切换的视觉反馈
   * @param {string} element - 元素类型
   */
  addElementSwitchEffect(element) {
    // 在屏幕中心添加一个大的波纹效果
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 添加3个不同大小的波纹，创造连续的切换效果
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const intensity = 1 - (i * 0.2);
        this.addRipple(centerX / this.scaleFactor, centerY / this.scaleFactor, element, intensity);
      }, i * 100);
    }
  }

  /**
   * 更新渲染参数
   * @param {Object} params - 参数对象
   */
  updateParams(params) {
    // 保存旧参数以检测变化
    const oldQuality = this.params.quality;

    // 更新参数
    Object.assign(this.params, params);

    // 如果质量设置发生变化，重新调整画布大小
    if (oldQuality !== this.params.quality) {
      console.log(`质量设置已更改: ${oldQuality} -> ${this.params.quality}`);
      this.resize();
    }
  }

  /**
   * 清理资源
   * 在组件卸载时调用，防止内存泄漏
   */
  dispose() {
    // 停止动画
    this.stopAnimation();

    // 移除事件监听器
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('orientationchange', this.resizeHandler);

    // 清空波纹数组
    this.ripples = [];

    // 释放背景图像
    this.backgroundImage = null;

    console.log('RippleRenderer 资源已清理');
  }
}
