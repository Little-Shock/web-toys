/**
 * 波纹渲染器
 * 负责处理所有与波纹效果相关的渲染
 * 优化版本2.0：大幅提高移动端性能，改善视觉效果
 */
class RippleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    // 禁用alpha通道以提高性能
    this.ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true, // 启用非同步渲染以减少延迟
      powerPreference: 'high-performance' // 请求高性能模式
    });

    // 波纹数组 - 使用对象池模式以减少GC
    this.ripples = [];
    this.ripplePool = [];
    this.maxPoolSize = 100;

    // 背景图像
    this.backgroundImage = null;
    this.hasCustomBackground = false;
    this.backgroundCanvas = document.createElement('canvas'); // 用于缓存背景
    this.backgroundCtx = this.backgroundCanvas.getContext('2d', { alpha: false });

    // 检测设备性能并设置初始参数
    const performanceLevel = this.detectPerformance();

    // 渲染参数
    this.params = {
      intensity: 0.5,    // 波纹强度
      size: 0.5,         // 波纹大小
      decay: 0.5,        // 波纹衰减速度
      multiElement: true, // 是否允许元素混合
      quality: performanceLevel, // 根据设备性能自动调整质量
      maxRipples: this.getMaxRipplesForQuality(performanceLevel), // 根据质量级别设置最大波纹数
      useSimplifiedEffects: performanceLevel === 'low' // 低端设备使用简化效果
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
    this.isAnimating = false;

    // 性能监控
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 500; // 每500ms更新一次FPS
    this.lastFpsUpdate = 0;
    this.lowFpsCount = 0; // 连续低帧率计数
    this.highFpsCount = 0; // 连续高帧率计数

    // 绑定事件处理
    this.resizeHandler = this.throttle(this.resize.bind(this), 200);
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);

    // 设置画布尺寸
    this.resize();
  }

  /**
   * 根据质量级别获取最大波纹数量
   * @param {string} quality - 质量级别
   * @returns {number} 最大波纹数量
   */
  getMaxRipplesForQuality(quality) {
    switch(quality) {
      case 'low': return 20;
      case 'medium': return 40;
      case 'high': return 60;
      default: return 30;
    }
  }

  /**
   * 节流函数 - 限制函数调用频率
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 检测设备性能并返回适当的质量级别
   * @returns {string} 'high', 'medium', 或 'low'
   */
  detectPerformance() {
    try {
      // 检查是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // 检查设备像素比
      const pixelRatio = window.devicePixelRatio || 1;

      // 检查屏幕尺寸
      const screenSize = Math.max(window.innerWidth, window.innerHeight);

      // 检查设备内存 (如果可用)
      let memoryLimited = false;
      if (navigator.deviceMemory) {
        memoryLimited = navigator.deviceMemory < 4; // 小于4GB内存视为受限
      }

      // 检查处理器核心数 (如果可用)
      let cpuLimited = false;
      if (navigator.hardwareConcurrency) {
        cpuLimited = navigator.hardwareConcurrency < 4; // 小于4核视为受限
      }

      // 检查是否为低端设备
      const isLowEndDevice = memoryLimited || cpuLimited;

      // 检查是否为省电模式 (如果可用)
      let isPowerSaveMode = false;
      if (window.matchMedia) {
        isPowerSaveMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }

      // 根据设备特性确定质量级别
      if (isMobile) {
        if (isLowEndDevice || isPowerSaveMode || screenSize < 768) {
          return 'low';
        } else if (pixelRatio > 2 && screenSize > 1000 && !isPowerSaveMode) {
          return 'medium';
        } else {
          return 'low';
        }
      } else {
        if (isLowEndDevice || isPowerSaveMode) {
          return 'medium';
        } else if (pixelRatio > 1 && screenSize > 1200) {
          return 'high';
        } else {
          return 'medium';
        }
      }
    } catch (error) {
      console.warn('性能检测失败，使用默认低质量设置:', error);
      return 'low'; // 出错时使用安全的低质量设置
    }
  }

  /**
   * 调整画布大小
   */
  resize() {
    try {
      // 获取设备像素比以支持高DPI屏幕
      const pixelRatio = window.devicePixelRatio || 1;

      // 获取显示尺寸
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      // 设置画布尺寸，考虑设备像素比和性能设置
      let scaleFactor = 1;
      if (this.params.quality === 'low') {
        scaleFactor = 0.6; // 低质量模式下大幅降低分辨率
      } else if (this.params.quality === 'medium') {
        scaleFactor = pixelRatio > 1 ? 0.75 : 0.9; // 中等质量模式下根据像素比调整
      } else {
        scaleFactor = Math.min(pixelRatio, 2); // 高质量模式使用设备像素比，但最大为2
      }

      // 设置画布尺寸 - 确保尺寸为整数以避免模糊
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
      if (this.isAnimating) {
        this.render();
      }

      console.log(`Canvas resized: ${this.width}x${this.height}, Quality: ${this.params.quality}, Scale: ${scaleFactor}`);
    } catch (error) {
      console.error('调整画布大小失败:', error);
      // 出错时尝试使用安全的默认值
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }
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
   * 从对象池获取或创建新波纹对象
   * @returns {Object} 波纹对象
   */
  getRippleFromPool() {
    if (this.ripplePool.length > 0) {
      return this.ripplePool.pop();
    }
    return {};
  }

  /**
   * 将波纹对象返回到对象池
   * @param {Object} ripple - 波纹对象
   */
  returnRippleToPool(ripple) {
    // 清空对象属性以便重用
    for (const prop in ripple) {
      if (typeof ripple[prop] === 'object' && ripple[prop] !== null) {
        ripple[prop] = {};
      } else if (typeof ripple[prop] !== 'function') {
        ripple[prop] = null;
      }
    }

    // 限制池大小以防内存泄漏
    if (this.ripplePool.length < this.maxPoolSize) {
      this.ripplePool.push(ripple);
    }
  }

  /**
   * 添加波纹
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} element - 元素类型
   * @param {number} intensity - 强度 (0-1)
   */
  addRipple(x, y, element, intensity = 1) {
    try {
      // 如果波纹数量已达最大值，不再添加新波纹
      if (this.ripples.length >= this.params.maxRipples) {
        // 移除最老的波纹
        const oldRipple = this.ripples.shift();
        this.returnRippleToPool(oldRipple);
      }

      // 应用缩放因子到坐标
      x = x * this.scaleFactor;
      y = y * this.scaleFactor;

      // 计算实际大小 (根据质量级别调整)
      let sizeMultiplier = 1;
      if (this.params.quality === 'low') {
        sizeMultiplier = 0.7; // 低质量模式下减小波纹大小
      } else if (this.params.quality === 'high') {
        sizeMultiplier = 1.2; // 高质量模式下增大波纹大小
      }

      const baseSize = (50 + this.params.size * 100) * sizeMultiplier;
      const size = baseSize * (0.8 + Math.random() * 0.4) * (0.7 + intensity * 0.6);

      // 计算实际强度
      const actualIntensity = this.params.intensity * intensity;

      // 计算衰减速度
      const decay = 0.01 + this.params.decay * 0.04;

      // 从对象池获取波纹对象
      const ripple = this.getRippleFromPool();

      // 设置波纹属性
      ripple.x = x;
      ripple.y = y;
      ripple.size = size;
      ripple.element = element;
      ripple.intensity = actualIntensity;
      ripple.opacity = 0.8;
      ripple.age = 0;
      ripple.decay = decay;
      ripple.speed = 0.8 + Math.random() * 0.4;
      ripple.rotation = Math.random() * Math.PI * 2;
      ripple.rotationSpeed = (Math.random() - 0.5) * 0.02;
      ripple.elementProps = this.getElementSpecificProps(element);

      // 添加到波纹数组
      this.ripples.push(ripple);

      // 确保动画循环正在运行
      if (!this.isAnimating) {
        this.startAnimation();
      }
    } catch (error) {
      console.error('添加波纹失败:', error);
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
    try {
      // 更新FPS计数
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.frameCount++;

      // 如果帧率过低，增加低帧率计数
      if (deltaTime > 50) { // 小于20fps
        this.lowFpsCount++;
        this.highFpsCount = 0;
      } else if (deltaTime < 20) { // 大于50fps
        this.highFpsCount++;
        this.lowFpsCount = 0;
      } else {
        this.lowFpsCount = 0;
        this.highFpsCount = 0;
      }

      // 更新FPS显示
      if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.lastFpsUpdate = now;
        this.frameCount = 0;

        // 根据FPS动态调整质量
        this.adjustQualityBasedOnFps();
      }

      // 批量更新波纹以提高性能
      const ripplesToRemove = [];

      // 更新所有波纹
      for (let i = 0; i < this.ripples.length; i++) {
        const ripple = this.ripples[i];

        // 增加年龄
        ripple.age += ripple.speed;

        // 减少不透明度
        ripple.opacity -= ripple.decay;

        // 更新旋转
        ripple.rotation += ripple.rotationSpeed;

        // 如果波纹完全透明，标记为移除
        if (ripple.opacity <= 0) {
          ripplesToRemove.push(i);
        }
      }

      // 从后向前移除波纹，以避免索引问题
      for (let i = ripplesToRemove.length - 1; i >= 0; i--) {
        const index = ripplesToRemove[i];
        const ripple = this.ripples.splice(index, 1)[0];
        this.returnRippleToPool(ripple);
      }

      // 如果没有波纹且不是首次渲染，停止动画循环以节省资源
      if (this.ripples.length === 0 && this.isAnimating && now - this.lastFrameTime > 1000) {
        this.stopAnimation();
      }
    } catch (error) {
      console.error('更新波纹状态失败:', error);
    }
  }

  /**
   * 根据FPS动态调整质量
   */
  adjustQualityBasedOnFps() {
    try {
      // 连续多次低帧率才降低质量，避免临时性能波动导致频繁切换
      if (this.lowFpsCount > 5 && this.params.quality !== 'low') {
        const oldQuality = this.params.quality;
        this.params.quality = 'low';
        this.params.maxRipples = this.getMaxRipplesForQuality('low');
        this.params.useSimplifiedEffects = true;
        console.log(`性能优化: 降低质量到 ${this.params.quality}, FPS: ${this.fps}`);

        // 只有在质量真正改变时才调整画布大小
        if (oldQuality !== 'low') {
          this.resize();
        }

        // 重置计数器
        this.lowFpsCount = 0;
      }
      // 连续多次高帧率才提高质量
      else if (this.highFpsCount > 10 && this.params.quality === 'low' && this.fps > 45) {
        const oldQuality = this.params.quality;
        this.params.quality = 'medium';
        this.params.maxRipples = this.getMaxRipplesForQuality('medium');
        this.params.useSimplifiedEffects = false;
        console.log(`性能优化: 提高质量到 ${this.params.quality}, FPS: ${this.fps}`);

        // 只有在质量真正改变时才调整画布大小
        if (oldQuality !== 'medium') {
          this.resize();
        }

        // 重置计数器
        this.highFpsCount = 0;
      }
    } catch (error) {
      console.error('调整质量失败:', error);
    }
  }

  /**
   * 渲染所有波纹
   */
  render() {
    try {
      // 清除画布
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 重绘背景
      this.drawBackground();

      // 如果没有波纹，不需要继续渲染
      if (this.ripples.length === 0) {
        return;
      }

      // 根据质量级别决定渲染策略
      const skipFactor = this.params.quality === 'low' && this.ripples.length > 15 ? 2 : 1;
      const simplifiedRendering = this.params.useSimplifiedEffects;

      // 使用批处理方式绘制波纹以提高性能
      this.ctx.save();

      // 按元素类型分组绘制，减少状态切换
      const elementGroups = {};

      // 将波纹分组
      for (let i = 0; i < this.ripples.length; i += skipFactor) {
        const ripple = this.ripples[i];
        if (!elementGroups[ripple.element]) {
          elementGroups[ripple.element] = [];
        }
        elementGroups[ripple.element].push(ripple);
      }

      // 按元素类型批量绘制
      for (const element in elementGroups) {
        const ripples = elementGroups[element];
        for (let i = 0; i < ripples.length; i++) {
          this.drawRipple(ripples[i], simplifiedRendering);
        }
      }

      this.ctx.restore();

      // 在调试模式下显示FPS
      if (window.DEBUG_MODE) {
        this.drawDebugInfo();
      }
    } catch (error) {
      console.error('渲染波纹失败:', error);
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
   * @param {boolean} simplified - 是否使用简化渲染
   */
  drawRipple(ripple, simplified = false) {
    const { x, y, size, element, opacity, age, rotation, intensity, elementProps } = ripple;

    // 如果不透明度太低，跳过绘制以提高性能
    if (opacity < 0.05) return;

    // 获取元素颜色
    const colors = this.elementColors[element];
    if (!colors) return;

    this.ctx.save();

    // 移动到波纹中心并旋转
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    // 根据质量级别决定是否绘制光晕
    if (!simplified && this.params.quality !== 'low') {
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
    try {
      switch (element) {
        case 'water':
          this.drawWaterRipple(size, age, opacity, colors, intensity, elementProps, simplified);
          break;
        case 'fire':
          this.drawFireRipple(size, age, opacity, colors, intensity, elementProps, simplified);
          break;
        case 'electric':
          this.drawElectricRipple(size, age, opacity, colors, intensity, elementProps, simplified);
          break;
        case 'light':
          this.drawLightRipple(size, age, opacity, colors, intensity, elementProps, simplified);
          break;
      }
    } catch (error) {
      // 出错时使用简单圆形作为后备
      console.warn(`绘制${element}元素波纹失败，使用后备渲染:`, error);
      this.drawFallbackRipple(size, opacity, colors);
    }

    this.ctx.restore();
  }

  /**
   * 绘制后备波纹 (当正常渲染失败时)
   * @param {number} size - 波纹大小
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   */
  drawFallbackRipple(size, opacity, colors) {
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    this.ctx.fillStyle = colors.primary.replace('0.7', (opacity * 0.7).toString());
    this.ctx.fill();
  }

  /**
   * 绘制水元素波纹
   * @param {number} size - 波纹大小
   * @param {number} age - 波纹年龄
   * @param {number} opacity - 不透明度
   * @param {Object} colors - 颜色对象
   * @param {number} intensity - 强度
   * @param {Object} props - 元素特定属性
   * @param {boolean} simplified - 是否使用简化渲染
   */
  drawWaterRipple(size, age, opacity, colors, intensity, props = {}, simplified = false) {
    const { waveCount = 3, waveSpeed = 0.1 } = props;

    // 简化渲染模式
    if (simplified) {
      // 只绘制一个主环和中心
      const progress = (age * waveSpeed) % 1;
      const ringSize = size * progress;

      if (ringSize > 5) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        this.ctx.lineWidth = 2 + intensity * 2;
        this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.8).toString());
        this.ctx.stroke();
      }

      // 简化的中心水滴
      const dropSize = size * 0.15 * (1 - age * 0.02);
      if (dropSize > 0) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, dropSize, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', opacity.toString());
        this.ctx.fill();
      }

      return;
    }

    // 标准渲染模式
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
   * @param {boolean} simplified - 是否使用简化渲染
   */
  drawFireRipple(size, age, opacity, colors, intensity, props = {}, simplified = false) {
    const { particleCount = 12, flickerRate = 0.2 } = props;

    // 简化渲染模式
    if (simplified) {
      // 只绘制几个主要粒子和中心火球
      const simpleParticleCount = 4;

      // 绘制简化的火焰粒子
      for (let i = 0; i < simpleParticleCount; i++) {
        const angle = (i / simpleParticleCount) * Math.PI * 2 + age * 0.2;
        const flicker = 1 + Math.sin(age * flickerRate * 10 + i) * 0.3;
        const distance = size * 0.5 * flicker;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        const particleSize = size * 0.12 * (1 - age * 0.05);

        if (particleSize < 2) continue;

        this.ctx.beginPath();
        this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.primary.replace('0.7', (opacity * 0.8).toString());
        this.ctx.fill();
      }

      // 绘制简化的中心火球
      const coreSize = size * 0.25 * (1 - age * 0.03);
      if (coreSize > 0) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', opacity.toString());
        this.ctx.fill();
      }

      return;
    }

    // 标准渲染模式
    // 根据质量级别调整粒子数量
    let actualParticleCount = Math.floor(particleCount * intensity);
    if (this.params.quality === 'low') {
      actualParticleCount = Math.floor(actualParticleCount * 0.6);
    }

    // 使用伪随机数生成器以提高性能
    const pseudoRandom = (i) => (Math.sin(i * 12.9898 + age * 78.233) * 43758.5453) % 1;

    // 绘制火焰粒子
    for (let i = 0; i < actualParticleCount; i++) {
      const angle = (i / actualParticleCount) * Math.PI * 2 + age * 0.2;
      const flicker = 1 + Math.sin(age * flickerRate * 10 + i) * 0.3; // 火焰闪烁效果
      const distance = size * (0.3 + 0.7 * Math.sin(age * 0.3 + i)) * flicker;

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const particleSize = (size * 0.15) * (1 - age * 0.05) * (0.5 + pseudoRandom(i) * 0.5);

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
      // 根据质量级别决定是否使用渐变
      if (this.params.quality === 'low') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', opacity.toString());
        this.ctx.fill();
      } else {
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);

        coreGradient.addColorStop(0, colors.secondary.replace('0.4', opacity.toString()));
        coreGradient.addColorStop(1, colors.primary.replace('0.7', '0'));

        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        this.ctx.fillStyle = coreGradient;
        this.ctx.fill();
      }
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
   * @param {boolean} simplified - 是否使用简化渲染
   */
  drawElectricRipple(size, age, opacity, colors, intensity, props = {}, simplified = false) {
    const { boltCount = 6, jitterFactor = 0.5 } = props;

    // 简化渲染模式
    if (simplified) {
      // 只绘制几条主要闪电和中心电球
      const simpleBoltCount = 3;

      this.ctx.lineWidth = 2 + intensity * 2;
      this.ctx.lineCap = 'round';

      // 绘制简化的闪电
      for (let i = 0; i < simpleBoltCount; i++) {
        const angle = (i / simpleBoltCount) * Math.PI * 2 + age * 0.1;
        const length = size * 0.6;

        // 创建简化的闪电路径 (只有两段)
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);

        const midX = Math.cos(angle) * (length * 0.5);
        const midY = Math.sin(angle) * (length * 0.5);

        // 添加一点随机偏移
        const offsetAngle = angle + (Math.sin(age * 5 + i * 7) * 0.3);
        const endX = Math.cos(offsetAngle) * length;
        const endY = Math.sin(offsetAngle) * length;

        this.ctx.lineTo(midX, midY);
        this.ctx.lineTo(endX, endY);

        // 添加闪电闪烁效果
        const jitter = 0.7 + Math.sin(age * 10 + i * 3) * 0.3;
        this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.9 * jitter).toString());
        this.ctx.stroke();
      }

      // 绘制简化的中心电球
      const coreSize = size * 0.15 * (1 - age * 0.02);
      if (coreSize > 0) {
        const pulseEffect = 0.8 + Math.sin(age * 15) * 0.2;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreSize * pulseEffect, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', (opacity * pulseEffect).toString());
        this.ctx.fill();
      }

      return;
    }

    // 标准渲染模式
    // 根据质量级别调整闪电数量
    let actualBoltCount = Math.floor(boltCount + intensity * 4);
    if (this.params.quality === 'low') {
      actualBoltCount = Math.floor(actualBoltCount * 0.7);
    }

    this.ctx.lineWidth = 2 + intensity * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 使用伪随机数生成器以提高性能
    const pseudoRandom = (i, j) => (Math.sin(i * 12.9898 + j * 78.233 + age * 43.5453) * 43758.5453) % 1;

    // 绘制闪电
    for (let i = 0; i < actualBoltCount; i++) {
      const angle = (i / actualBoltCount) * Math.PI * 2 + age * 0.1;
      const length = size * (0.5 + pseudoRandom(i, 0) * 0.5);

      // 创建闪电路径
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);

      let x = 0, y = 0;
      // 根据质量级别调整分段数
      const segments = this.params.quality === 'low' ? 3 : (4 + Math.floor(intensity * 3));

      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        // 使用jitterFactor增加随机性，但使用伪随机数以提高性能
        const segmentAngle = angle + (pseudoRandom(i, j) - 0.5) * jitterFactor;

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
   * @param {boolean} simplified - 是否使用简化渲染
   */
  drawLightRipple(size, age, opacity, colors, intensity, props = {}, simplified = false) {
    const { rayCount = 8, pulseRate = 0.1 } = props;

    // 简化渲染模式
    if (simplified) {
      // 只绘制几条主要光线和中心光球
      const simpleRayCount = 4;
      const maxRayLength = size * 0.6;

      // 绘制简化的光芒
      for (let i = 0; i < simpleRayCount; i++) {
        const angle = (i / simpleRayCount) * Math.PI * 2;
        const pulse = 0.5 + 0.5 * Math.sin(age * pulseRate * 10 + i * 0.7);
        const rayLength = maxRayLength * pulse;

        const x = Math.cos(angle) * rayLength;
        const y = Math.sin(angle) * rayLength;

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(x, y);
        this.ctx.lineWidth = 2 + intensity * 2;
        this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.7).toString());
        this.ctx.stroke();
      }

      // 绘制简化的中心光球
      const coreSize = size * 0.2 * (1 - age * 0.01);
      if (coreSize > 0) {
        const pulseEffect = 0.8 + Math.sin(age * pulseRate * 15) * 0.2;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, coreSize * pulseEffect, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', (opacity * 0.8).toString());
        this.ctx.fill();
      }

      return;
    }

    // 标准渲染模式
    // 根据质量级别调整光线数量
    let actualRayCount = Math.floor(rayCount + intensity * 6);
    if (this.params.quality === 'low') {
      actualRayCount = Math.floor(actualRayCount * 0.6);
    }

    const maxRayLength = size * (0.7 + intensity * 0.3);

    // 使用批处理方式绘制光芒以提高性能
    this.ctx.beginPath();
    this.ctx.lineWidth = 2 + intensity * 3;
    this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.7).toString());

    // 绘制光芒
    for (let i = 0; i < actualRayCount; i++) {
      const angle = (i / actualRayCount) * Math.PI * 2;
      // 使用pulseRate创建脉动效果
      const pulse = 0.5 + 0.5 * Math.sin(age * pulseRate * 10 + i * 0.7);
      const rayLength = maxRayLength * pulse;

      const x = Math.cos(angle) * rayLength;
      const y = Math.sin(angle) * rayLength;

      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(x, y);
    }

    // 一次性绘制所有光线
    this.ctx.stroke();

    // 绘制中心光球
    const coreSize = size * 0.25 * (1 - age * 0.01);
    if (coreSize > 0) {
      // 添加脉动效果
      const pulseEffect = 0.8 + Math.sin(age * pulseRate * 15) * 0.2;
      const adjustedCoreSize = coreSize * pulseEffect;

      // 根据质量级别决定是否使用渐变
      if (this.params.quality === 'low') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, adjustedCoreSize, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.secondary.replace('0.4', (opacity * 0.8).toString());
        this.ctx.fill();
      } else {
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
  }

  /**
   * 开始动画循环
   */
  startAnimation() {
    // 如果已经在运行，不重复启动
    if (this.isAnimating) return;

    // 取消任何现有的动画帧
    if (this.animationFrameId) {
      if (typeof this.animationFrameId === 'number') {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
    }

    this.isAnimating = true;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = this.lastFrameTime;
    this.frameCount = 0;

    // 使用RAF回调函数
    const animate = () => {
      try {
        // 检查是否应该继续动画
        if (!this.isAnimating) return;

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;

        // 如果标签页不可见或帧率过低，降低更新频率
        if (document.hidden || deltaTime > 100) {
          this.update();
          this.render();

          // 使用setTimeout降低更新频率
          this.animationFrameId = setTimeout(() => {
            if (this.isAnimating) {
              this.animationFrameId = requestAnimationFrame(animate);
            }
          }, 100);
        } else {
          this.update();
          this.render();

          // 正常情况下使用requestAnimationFrame
          if (this.isAnimating) {
            this.animationFrameId = requestAnimationFrame(animate);
          }
        }
      } catch (error) {
        console.error('动画循环出错:', error);
        // 出错时尝试恢复
        if (this.isAnimating) {
          this.animationFrameId = setTimeout(() => requestAnimationFrame(animate), 1000);
        }
      }
    };

    // 启动动画循环
    this.animationFrameId = requestAnimationFrame(animate);
    console.log('动画循环已启动');
  }

  /**
   * 停止动画循环
   */
  stopAnimation() {
    this.isAnimating = false;

    if (this.animationFrameId) {
      if (typeof this.animationFrameId === 'number') {
        cancelAnimationFrame(this.animationFrameId);
      } else {
        clearTimeout(this.animationFrameId);
      }
      this.animationFrameId = null;
    }

    console.log('动画循环已停止');
  }

  /**
   * 清除所有波纹
   */
  clearRipples() {
    // 将所有波纹返回到对象池
    for (const ripple of this.ripples) {
      this.returnRippleToPool(ripple);
    }

    // 清空波纹数组
    this.ripples = [];

    // 重新渲染
    this.render();
  }

  /**
   * 设置当前元素类型
   * @param {string} element - 元素类型
   */
  setCurrentElement(element) {
    if (this.elementColors[element] && this.currentElement !== element) {
      this.currentElement = element;

      // 添加元素切换的视觉反馈
      this.addElementSwitchEffect(element);

      return true;
    }
    return false;
  }

  /**
   * 添加元素切换的视觉反馈
   * @param {string} element - 元素类型
   */
  addElementSwitchEffect(element) {
    try {
      // 确保动画循环正在运行
      if (!this.isAnimating) {
        this.startAnimation();
      }

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
    } catch (error) {
      console.error('添加元素切换效果失败:', error);
    }
  }

  /**
   * 更新渲染参数
   * @param {Object} params - 参数对象
   */
  updateParams(params) {
    try {
      // 保存旧参数以检测变化
      const oldQuality = this.params.quality;
      const oldMaxRipples = this.params.maxRipples;

      // 更新参数
      Object.assign(this.params, params);

      // 如果质量设置发生变化，更新相关参数
      if (oldQuality !== this.params.quality) {
        console.log(`质量设置已更改: ${oldQuality} -> ${this.params.quality}`);

        // 更新最大波纹数量
        if (oldMaxRipples === this.getMaxRipplesForQuality(oldQuality)) {
          this.params.maxRipples = this.getMaxRipplesForQuality(this.params.quality);
        }

        // 更新简化效果设置
        this.params.useSimplifiedEffects = this.params.quality === 'low';

        // 重新调整画布大小
        this.resize();
      }

      // 如果波纹数量超过新的最大值，移除多余的波纹
      if (this.ripples.length > this.params.maxRipples) {
        const excessRipples = this.ripples.splice(0, this.ripples.length - this.params.maxRipples);
        for (const ripple of excessRipples) {
          this.returnRippleToPool(ripple);
        }
      }
    } catch (error) {
      console.error('更新渲染参数失败:', error);
    }
  }

  /**
   * 清理资源
   * 在组件卸载时调用，防止内存泄漏
   */
  dispose() {
    try {
      // 停止动画
      this.stopAnimation();

      // 移除事件监听器
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);

      // 清空波纹数组和对象池
      this.ripples = [];
      this.ripplePool = [];

      // 释放背景图像
      this.backgroundImage = null;

      // 释放画布上下文
      this.ctx = null;
      this.backgroundCtx = null;

      console.log('RippleRenderer 资源已清理');
    } catch (error) {
      console.error('清理资源失败:', error);
    }
  }
}
