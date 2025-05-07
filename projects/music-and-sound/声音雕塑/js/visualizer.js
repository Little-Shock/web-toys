/**
 * 可视化渲染器
 * 负责将音频分析数据渲染为各种视觉效果
 */
class Visualizer {
  constructor(canvas, audioAnalyzer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyzer = audioAnalyzer;

    // 可视化类型
    this.visualType = 'waveform';

    // 颜色主题
    this.colorTheme = 'spectrum';

    // 渲染参数
    this.params = {
      quality: 1.0,      // 渲染质量
      autoRotate: true,  // 自动旋转
      responsive: true,  // 响应式动画
      rotation: 0,       // 当前旋转角度
      zoom: 1.0,         // 缩放级别
      showFps: false     // 显示FPS
    };

    // FPS计算
    this.fpsData = {
      frameCount: 0,
      lastTime: 0,
      fps: 0
    };

    // 3D场景参数
    this.scene = {
      rotationX: 0,
      rotationY: 0,
      cameraDistance: 500
    };

    // 调整画布大小
    this.resize();

    // 绑定窗口大小变化事件
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * 调整画布大小
   */
  resize() {
    const container = this.canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 设置画布尺寸
    this.canvas.width = width * this.params.quality;
    this.canvas.height = height * this.params.quality;

    // 设置CSS尺寸
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // 保存尺寸
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  /**
   * 设置可视化类型
   * @param {string} type - 可视化类型
   */
  setVisualType(type) {
    this.visualType = type;
  }

  /**
   * 设置颜色主题
   * @param {string} theme - 颜色主题
   */
  setColorTheme(theme) {
    this.colorTheme = theme;
  }

  /**
   * 更新渲染参数
   * @param {Object} params - 参数对象
   */
  updateParams(params) {
    // 更新参数
    Object.assign(this.params, params);

    // 如果质量参数改变，重新调整画布大小
    if (params.quality !== undefined) {
      this.resize();
    }
  }

  /**
   * 更新3D场景参数
   * @param {Object} params - 场景参数
   */
  updateScene(params) {
    Object.assign(this.scene, params);
  }

  /**
   * 渲染可视化效果
   */
  render() {
    // 清除画布
    this.clear();

    // 获取音频分析数据
    const audioData = this.analyzer.getAnalysisData();

    // 根据可视化类型选择渲染方法
    switch (this.visualType) {
      case 'waveform':
        this.renderWaveform(audioData);
        break;
      case 'frequency':
        this.renderFrequency(audioData);
        break;
      case 'circular':
        this.renderCircular(audioData);
        break;
      case 'particles':
        this.renderParticles(audioData);
        break;
      case 'terrain':
        this.renderTerrain(audioData);
        break;
      case 'sculpture':
        this.renderSculpture(audioData);
        break;
      default:
        this.renderWaveform(audioData);
    }

    // 显示FPS
    if (this.params.showFps) {
      this.calculateAndShowFps();
    }
  }

  /**
   * 计算并显示FPS
   */
  calculateAndShowFps() {
    // 获取当前时间
    const now = performance.now();

    // 增加帧计数
    this.fpsData.frameCount++;

    // 每秒更新一次FPS
    if (now - this.fpsData.lastTime >= 1000) {
      // 计算FPS
      this.fpsData.fps = Math.round((this.fpsData.frameCount * 1000) / (now - this.fpsData.lastTime));

      // 重置计数器
      this.fpsData.frameCount = 0;
      this.fpsData.lastTime = now;
    }

    // 显示FPS
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fpsData.fps}`, 10, 20);
  }

  /**
   * 清除画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * 获取颜色
   * @param {number} value - 值（0-1）
   * @param {number} index - 索引
   * @returns {string} 颜色字符串
   */
  getColor(value, index) {
    // 根据主题返回颜色
    switch (this.colorTheme) {
      case 'spectrum':
        // 彩虹色谱
        return `hsl(${index / 2 % 360}, 80%, ${50 + value * 30}%)`;
      case 'neon':
        // 霓虹色调
        const neonColors = [
          `rgba(255, 0, 128, ${value})`,
          `rgba(0, 255, 255, ${value})`,
          `rgba(255, 255, 0, ${value})`,
          `rgba(0, 128, 255, ${value})`
        ];
        return neonColors[index % neonColors.length];
      case 'monochrome':
        // 单色
        return `rgba(255, 255, 255, ${value})`;
      case 'pastel':
        // 柔和的粉彩色调
        return `hsl(${index / 2 % 360}, 50%, ${70 + value * 20}%)`;
      default:
        return `hsl(${index / 2 % 360}, 80%, ${50 + value * 30}%)`;
    }
  }

  /**
   * 渲染波形可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderWaveform(audioData) {
    const { time, sensitivity } = audioData;
    const centerY = this.height / 2;
    const sliceWidth = this.width / time.length;

    // 绘制波形
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    for (let i = 0; i < time.length; i++) {
      const value = time[i] / 128.0;
      const y = value * this.height * sensitivity;
      const x = i * sliceWidth;

      this.ctx.lineTo(x, centerY + y);
    }

    // 设置样式
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.getColor(1, 0);
    this.ctx.stroke();

    // 绘制镜像波形
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    for (let i = 0; i < time.length; i++) {
      const value = time[i] / 128.0;
      const y = value * this.height * sensitivity;
      const x = i * sliceWidth;

      this.ctx.lineTo(x, centerY - y);
    }

    // 设置样式
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.getColor(0.8, 180);
    this.ctx.stroke();
  }

  /**
   * 渲染频谱可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderFrequency(audioData) {
    const { frequency, binCount, sensitivity } = audioData;
    const barWidth = this.width / binCount;
    const barSpacing = barWidth * 0.2;
    const maxBarHeight = this.height * 0.8;

    // 绘制频谱条
    for (let i = 0; i < binCount; i++) {
      const value = frequency[i] / 255.0;
      const barHeight = value * maxBarHeight * sensitivity;
      const x = i * barWidth;
      const y = this.height - barHeight;

      // 设置样式
      this.ctx.fillStyle = this.getColor(value, i);

      // 绘制条形
      this.ctx.fillRect(x + barSpacing/2, y, barWidth - barSpacing, barHeight);
    }
  }

  /**
   * 渲染环形可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderCircular(audioData) {
    const { frequency, binCount, sensitivity } = audioData;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8 * this.params.zoom;

    // 自动旋转
    if (this.params.autoRotate) {
      this.params.rotation += 0.005;
    }

    // 绘制环形频谱
    for (let i = 0; i < binCount; i += 4) {
      const value = frequency[i] / 255.0;
      const adjustedValue = value * sensitivity;
      const angle = (i / binCount) * Math.PI * 2 + this.params.rotation;

      const innerRadius = radius * 0.4;
      const outerRadius = innerRadius + radius * 0.6 * adjustedValue;

      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;

      // 设置样式
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.getColor(adjustedValue, i);

      // 绘制线条
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  /**
   * 渲染粒子可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderParticles(audioData) {
    const { frequency, binCount, sensitivity } = audioData;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 粒子数量（根据频率数据的一部分）
    const particleCount = Math.min(binCount, 128);

    // 应用缩放
    const zoomFactor = this.params.zoom;

    // 自动旋转
    if (this.params.autoRotate) {
      this.params.rotation += 0.005;
    }

    // 绘制粒子
    for (let i = 0; i < particleCount; i++) {
      // 获取频率值并调整
      const value = frequency[i] / 255.0;
      const adjustedValue = value * sensitivity;

      // 计算粒子大小
      const size = 2 + adjustedValue * 15;

      // 计算粒子位置（基于频率和旋转）
      const angle = (i / particleCount) * Math.PI * 2 + this.params.rotation;
      const distance = (50 + adjustedValue * 200) * zoomFactor;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // 设置粒子颜色
      this.ctx.fillStyle = this.getColor(adjustedValue, i);

      // 绘制粒子
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();

      // 添加连接线（连接相邻粒子）
      if (i > 0) {
        const prevAngle = ((i - 1) / particleCount) * Math.PI * 2 + this.params.rotation;
        const prevDistance = (50 + (frequency[i - 1] / 255.0) * sensitivity * 200) * zoomFactor;
        const prevX = centerX + Math.cos(prevAngle) * prevDistance;
        const prevY = centerY + Math.sin(prevAngle) * prevDistance;

        this.ctx.strokeStyle = this.getColor(adjustedValue * 0.5, i);
        this.ctx.lineWidth = 1 + adjustedValue * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
    }
  }

  /**
   * 渲染地形可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderTerrain(audioData) {
    const { frequency, binCount, sensitivity } = audioData;

    // 地形网格参数
    const gridSize = 20 * this.params.zoom; // 网格大小
    const cols = Math.floor(this.width / gridSize) + 1;
    const rows = Math.floor(this.height / gridSize) + 1;

    // 自动旋转
    if (this.params.autoRotate) {
      this.params.rotation += 0.01;
    }

    // 透视参数
    const perspective = 300;
    const cameraHeight = 150;
    const horizonY = this.height / 2;

    // 绘制地形网格
    for (let z = 1; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        // 计算频率索引
        const freqIndex = Math.floor((x / cols) * binCount);

        // 获取频率值并调整
        const value = frequency[freqIndex] / 255.0;
        const adjustedValue = value * sensitivity;

        // 计算地形高度
        const terrainHeight = adjustedValue * 100;

        // 计算3D坐标
        const worldX = (x - cols / 2) * gridSize;
        const worldZ = z * gridSize;
        const worldY = -terrainHeight;

        // 应用旋转
        const rotatedX = worldX * Math.cos(this.params.rotation) - worldZ * Math.sin(this.params.rotation);
        const rotatedZ = worldX * Math.sin(this.params.rotation) + worldZ * Math.cos(this.params.rotation);

        // 透视投影
        const scale = perspective / (perspective + rotatedZ);
        const projectedX = this.width / 2 + rotatedX * scale;
        const projectedY = horizonY + (worldY - cameraHeight) * scale;

        // 绘制点
        const pointSize = 2 + adjustedValue * 5;
        this.ctx.fillStyle = this.getColor(adjustedValue, freqIndex);
        this.ctx.beginPath();
        this.ctx.arc(projectedX, projectedY, pointSize, 0, Math.PI * 2);
        this.ctx.fill();

        // 连接相邻点
        if (x > 0) {
          // 获取上一个点的信息
          const prevFreqIndex = Math.floor(((x - 1) / cols) * binCount);
          const prevValue = frequency[prevFreqIndex] / 255.0;
          const prevAdjustedValue = prevValue * sensitivity;
          const prevTerrainHeight = prevAdjustedValue * 100;

          // 计算上一个点的3D坐标
          const prevWorldX = (x - 1 - cols / 2) * gridSize;
          const prevWorldZ = z * gridSize;
          const prevWorldY = -prevTerrainHeight;

          // 应用旋转
          const prevRotatedX = prevWorldX * Math.cos(this.params.rotation) - prevWorldZ * Math.sin(this.params.rotation);
          const prevRotatedZ = prevWorldX * Math.sin(this.params.rotation) + prevWorldZ * Math.cos(this.params.rotation);

          // 透视投影
          const prevScale = perspective / (perspective + prevRotatedZ);
          const prevProjectedX = this.width / 2 + prevRotatedX * prevScale;
          const prevProjectedY = horizonY + (prevWorldY - cameraHeight) * prevScale;

          // 绘制连接线
          this.ctx.strokeStyle = this.getColor(adjustedValue * 0.7, freqIndex);
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(prevProjectedX, prevProjectedY);
          this.ctx.lineTo(projectedX, projectedY);
          this.ctx.stroke();
        }
      }
    }
  }

  /**
   * 渲染雕塑可视化
   * @param {Object} audioData - 音频分析数据
   */
  renderSculpture(audioData) {
    const { frequency, binCount, sensitivity } = audioData;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 雕塑参数
    const rings = 12;
    const pointsPerRing = 24;
    const baseRadius = Math.min(this.width, this.height) * 0.3 * this.params.zoom;

    // 自动旋转
    if (this.params.autoRotate) {
      this.params.rotation += 0.01;
      this.scene.rotationY += 0.005;
      this.scene.rotationX = Math.sin(this.params.rotation * 0.5) * 0.3;
    }

    // 绘制雕塑
    for (let ring = 0; ring < rings; ring++) {
      // 计算环的参数
      const ringRadius = baseRadius * (1 - ring / rings * 0.7);
      const ringHeight = (ring - rings / 2) * 20;
      const freqOffset = Math.floor((ring / rings) * (binCount / 2));

      // 绘制环上的点
      for (let point = 0; point < pointsPerRing; point++) {
        // 计算频率索引
        const freqIndex = (freqOffset + point) % binCount;

        // 获取频率值并调整
        const value = frequency[freqIndex] / 255.0;
        const adjustedValue = value * sensitivity;

        // 计算点的基础角度
        const angle = (point / pointsPerRing) * Math.PI * 2;

        // 计算点的3D坐标
        const radiusOffset = adjustedValue * 50;
        const pointRadius = ringRadius + radiusOffset;

        // 基础3D坐标
        let x = Math.cos(angle) * pointRadius;
        let y = ringHeight + adjustedValue * 40;
        let z = Math.sin(angle) * pointRadius;

        // 应用X轴旋转
        const cosX = Math.cos(this.scene.rotationX);
        const sinX = Math.sin(this.scene.rotationX);
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // 应用Y轴旋转
        const cosY = Math.cos(this.scene.rotationY + this.params.rotation);
        const sinY = Math.sin(this.scene.rotationY + this.params.rotation);
        const x2 = x * cosY - z1 * sinY;
        const z2 = x * sinY + z1 * cosY;

        // 透视投影
        const scale = 600 / (600 + z2);
        const projectedX = centerX + x2 * scale;
        const projectedY = centerY + y1 * scale;

        // 计算点大小和不透明度
        const size = 2 + adjustedValue * 8 * scale;
        const opacity = 0.3 + adjustedValue * 0.7;

        // 绘制点
        this.ctx.fillStyle = this.getColor(adjustedValue, freqIndex);
        this.ctx.globalAlpha = opacity;
        this.ctx.beginPath();
        this.ctx.arc(projectedX, projectedY, size, 0, Math.PI * 2);
        this.ctx.fill();

        // 连接到下一个点
        if (point < pointsPerRing - 1) {
          // 计算下一个点
          const nextAngle = ((point + 1) / pointsPerRing) * Math.PI * 2;
          const nextFreqIndex = (freqOffset + point + 1) % binCount;
          const nextValue = frequency[nextFreqIndex] / 255.0;
          const nextAdjustedValue = nextValue * sensitivity;
          const nextRadiusOffset = nextAdjustedValue * 50;
          const nextPointRadius = ringRadius + nextRadiusOffset;

          // 下一个点的3D坐标
          let nx = Math.cos(nextAngle) * nextPointRadius;
          let ny = ringHeight + nextAdjustedValue * 40;
          let nz = Math.sin(nextAngle) * nextPointRadius;

          // 应用X轴旋转
          const ny1 = ny * cosX - nz * sinX;
          const nz1 = ny * sinX + nz * cosX;

          // 应用Y轴旋转
          const nx2 = nx * cosY - nz1 * sinY;
          const nz2 = nx * sinY + nz1 * cosY;

          // 透视投影
          const nextScale = 600 / (600 + nz2);
          const nextProjectedX = centerX + nx2 * nextScale;
          const nextProjectedY = centerY + ny1 * nextScale;

          // 绘制连接线
          this.ctx.strokeStyle = this.getColor(adjustedValue * 0.8, freqIndex);
          this.ctx.globalAlpha = opacity * 0.7;
          this.ctx.lineWidth = 1 + adjustedValue * 3 * scale;
          this.ctx.beginPath();
          this.ctx.moveTo(projectedX, projectedY);
          this.ctx.lineTo(nextProjectedX, nextProjectedY);
          this.ctx.stroke();
        }

        // 连接到下一个环
        if (ring < rings - 1) {
          // 计算下一个环的对应点
          const nextRingRadius = baseRadius * (1 - (ring + 1) / rings * 0.7);
          const nextRingHeight = ((ring + 1) - rings / 2) * 20;
          const nextFreqOffset = Math.floor(((ring + 1) / rings) * (binCount / 2));
          const nextFreqIndex = (nextFreqOffset + point) % binCount;
          const nextValue = frequency[nextFreqIndex] / 255.0;
          const nextAdjustedValue = nextValue * sensitivity;
          const nextRadiusOffset = nextAdjustedValue * 50;
          const nextPointRadius = nextRingRadius + nextRadiusOffset;

          // 下一个环点的3D坐标
          let nx = Math.cos(angle) * nextPointRadius;
          let ny = nextRingHeight + nextAdjustedValue * 40;
          let nz = Math.sin(angle) * nextPointRadius;

          // 应用X轴旋转
          const ny1 = ny * cosX - nz * sinX;
          const nz1 = ny * sinX + nz * cosX;

          // 应用Y轴旋转
          const nx2 = nx * cosY - nz1 * sinY;
          const nz2 = nx * sinY + nz1 * cosY;

          // 透视投影
          const nextScale = 600 / (600 + nz2);
          const nextProjectedX = centerX + nx2 * nextScale;
          const nextProjectedY = centerY + ny1 * nextScale;

          // 绘制连接线
          if (point % 2 === 0) { // 只连接部分点，避免过于密集
            this.ctx.strokeStyle = this.getColor(adjustedValue * 0.6, freqIndex);
            this.ctx.globalAlpha = opacity * 0.5;
            this.ctx.lineWidth = 1 + adjustedValue * 2 * scale;
            this.ctx.beginPath();
            this.ctx.moveTo(projectedX, projectedY);
            this.ctx.lineTo(nextProjectedX, nextProjectedY);
            this.ctx.stroke();
          }
        }
      }
    }

    // 重置透明度
    this.ctx.globalAlpha = 1.0;
  }
}
