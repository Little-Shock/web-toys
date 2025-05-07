/**
 * 沙粒渲染器
 * 负责将沙粒物理系统渲染到画布上
 */
class SandRenderer {
  /**
   * 创建沙粒渲染器
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {SandPhysics} physics - 沙粒物理系统
   * @param {Object} options - 配置选项
   */
  constructor(canvas, physics, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.physics = physics;

    // 配置参数
    this.params = {
      quality: options.quality || 'medium', // low, medium, high
      glowIntensity: options.glowIntensity !== undefined ? options.glowIntensity : 0.7,
      blurEffect: options.blurEffect !== undefined ? options.blurEffect : true,
      trailEffect: options.trailEffect !== undefined ? options.trailEffect : true,
      backgroundDarkness: options.backgroundDarkness !== undefined ? options.backgroundDarkness : 0.95,
      renderScale: options.renderScale || 1.5, // 提高默认渲染比例
      showStats: options.showStats !== undefined ? options.showStats : false
    };

    // 渲染状态
    this.isRunning = false;
    this.lastRenderTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 500; // 更新FPS的时间间隔（毫秒）
    this.lastFpsUpdate = 0;

    // 离屏画布 - 用于实现发光和拖尾效果
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    // 背景画布 - 用于绘制静态背景
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');

    // 初始化
    this._init();
  }

  /**
   * 初始化渲染器
   * @private
   */
  _init() {
    // 调整画布大小
    this.resize();

    // 初始化背景
    this._initBackground();
  }

  /**
   * 初始化背景
   * @private
   */
  _initBackground() {
    const { width, height } = this.canvas;

    // 设置背景画布大小
    this.backgroundCanvas.width = width;
    this.backgroundCanvas.height = height;

    // 绘制渐变背景
    const gradient = this.backgroundCtx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.7
    );

    gradient.addColorStop(0, 'rgba(10, 10, 15, 1)');
    gradient.addColorStop(0.5, 'rgba(5, 5, 10, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    this.backgroundCtx.fillStyle = gradient;
    this.backgroundCtx.fillRect(0, 0, width, height);

    // 添加一些随机的星点
    this.backgroundCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5;

      this.backgroundCtx.beginPath();
      this.backgroundCtx.arc(x, y, size, 0, Math.PI * 2);
      this.backgroundCtx.fill();
    }
  }

  /**
   * 调整画布大小
   */
  resize() {
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;

    // 根据渲染质量调整渲染比例
    let renderScale = this.params.renderScale;
    if (this.params.quality === 'low') {
      renderScale *= 0.75;
    } else if (this.params.quality === 'high') {
      renderScale *= 1.5;
    }

    // 设置画布大小
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // 计算实际渲染大小，考虑设备像素比
    const renderWidth = Math.floor(displayWidth * renderScale * dpr);
    const renderHeight = Math.floor(displayHeight * renderScale * dpr);

    // 设置画布尺寸
    this.canvas.width = renderWidth;
    this.canvas.height = renderHeight;

    // 设置CSS尺寸保持不变
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // 设置离屏画布尺寸
    this.offscreenCanvas.width = renderWidth;
    this.offscreenCanvas.height = renderHeight;

    // 更新物理系统边界
    this.physics.resize(renderWidth, renderHeight);

    // 重新初始化背景
    this._initBackground();
  }

  /**
   * 设置渲染质量
   * @param {string} quality - 渲染质量 (low, medium, high)
   */
  setQuality(quality) {
    if (quality !== this.params.quality) {
      this.params.quality = quality;
      this.resize(); // 调整大小以应用新的渲染比例
    }
  }

  /**
   * 设置发光强度
   * @param {number} intensity - 发光强度 (0-1)
   */
  setGlowIntensity(intensity) {
    this.params.glowIntensity = clamp(intensity, 0, 1);
  }

  /**
   * 启用或禁用模糊效果
   * @param {boolean} enabled - 是否启用
   */
  setBlurEffect(enabled) {
    this.params.blurEffect = enabled;
  }

  /**
   * 启用或禁用拖尾效果
   * @param {boolean} enabled - 是否启用
   */
  setTrailEffect(enabled) {
    this.params.trailEffect = enabled;
  }

  /**
   * 设置背景暗度
   * @param {number} darkness - 暗度 (0-1)
   */
  setBackgroundDarkness(darkness) {
    this.params.backgroundDarkness = clamp(darkness, 0, 1);
  }

  /**
   * 清除画布
   * @private
   */
  _clearCanvas() {
    // 清除主画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制背景
    this.ctx.drawImage(this.backgroundCanvas, 0, 0);

    // 如果启用拖尾效果，使用半透明矩形而不是完全清除离屏画布
    if (this.params.trailEffect) {
      this.offscreenCtx.fillStyle = `rgba(0, 0, 0, ${this.params.backgroundDarkness})`;
      this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    } else {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
  }

  /**
   * 渲染粒子
   * @private
   */
  _renderParticles() {
    const { particles } = this.physics;
    const { quality, glowIntensity } = this.params;

    // 根据质量级别调整渲染选项
    const renderOptions = {
      showGlow: quality !== 'low',
      quality
    };

    // 在离屏画布上绘制粒子
    for (const particle of particles) {
      if (particle.isActive) {
        // 调整发光强度
        particle.glow *= glowIntensity;
        particle.draw(this.offscreenCtx, renderOptions);
      }
    }

    // 应用模糊效果（如果启用）
    if (this.params.blurEffect && quality !== 'low') {
      const blurAmount = quality === 'high' ? 1.5 : 1;
      this.ctx.filter = `blur(${blurAmount}px)`;
    } else {
      this.ctx.filter = 'none';
    }

    // 将离屏画布内容绘制到主画布
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.filter = 'none';
  }

  /**
   * 渲染统计信息
   * @private
   */
  _renderStats() {
    if (!this.params.showStats) return;

    const stats = this.physics.getStats();

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 200, 80);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 20, 30);
    this.ctx.fillText(`Particles: ${stats.activeParticles}/${stats.maxParticles}`, 20, 50);
    this.ctx.fillText(`Physics: ${stats.updateTime.toFixed(1)}ms`, 20, 70);

    this.ctx.restore();
  }

  /**
   * 更新FPS计数器
   * @private
   */
  _updateFps() {
    this.frameCount++;

    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;

    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * 渲染一帧
   * @param {number} timestamp - 当前时间戳
   */
  render(timestamp) {
    // 计算帧间隔时间
    const dt = this.lastRenderTime ? (timestamp - this.lastRenderTime) / 1000 : 0.016;
    this.lastRenderTime = timestamp;

    // 清除画布
    this._clearCanvas();

    // 渲染粒子
    this._renderParticles();

    // 渲染统计信息
    this._renderStats();

    // 更新FPS
    this._updateFps();
  }

  /**
   * 开始渲染循环
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastRenderTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    const animate = (timestamp) => {
      if (!this.isRunning) return;

      this.render(timestamp);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * 停止渲染循环
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 创建当前画布的快照
   * @returns {HTMLCanvasElement} 快照画布
   */
  createSnapshot() {
    const snapshotCanvas = document.createElement('canvas');
    const snapshotCtx = snapshotCanvas.getContext('2d');

    snapshotCanvas.width = this.canvas.width;
    snapshotCanvas.height = this.canvas.height;

    // 绘制背景
    snapshotCtx.drawImage(this.backgroundCanvas, 0, 0);

    // 绘制粒子
    snapshotCtx.drawImage(this.offscreenCanvas, 0, 0);

    return snapshotCanvas;
  }

  /**
   * 将当前画布保存为图像
   * @returns {string} 图像数据URL
   */
  saveAsImage() {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * 显示或隐藏统计信息
   * @param {boolean} show - 是否显示
   */
  showStats(show) {
    this.params.showStats = show;
  }
}
