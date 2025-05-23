/**
 * 墨水渲染器
 * 负责将流体模拟的结果渲染到画布上
 */
class InkRenderer {
  constructor(canvas, fluidSimulation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fluid = fluidSimulation;

    // 渲染参数
    this.renderScale = 1;  // 渲染比例（可以小于1以提高性能）
    this.blendMode = 'source-over';  // 混合模式

    // 纸张纹理
    this.paperTextures = {
      rice: null,
      rough: null,
      smooth: null,
      absorbent: null
    };

    // 当前纸张
    this.currentPaper = 'rice';

    // 渲染缓冲区
    this.buffer = document.createElement('canvas');
    this.bufferCtx = this.buffer.getContext('2d');

    // 调整画布大小
    this.resize();

    // 加载纸张纹理
    this.loadPaperTextures();
  }

  /**
   * 调整画布大小
   */
  resize() {
    // 设置画布尺寸为窗口大小
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // 计算流体模拟的尺寸（可能小于画布尺寸以提高性能）
    const simWidth = Math.max(32, Math.floor(this.canvas.width * this.renderScale));
    const simHeight = Math.max(32, Math.floor(this.canvas.height * this.renderScale));

    // 保存当前流体参数
    let params = {};
    if (this.fluid) {
      params = {
        density: this.fluid.density,
        diffusion: this.fluid.diffusion,
        viscosity: this.fluid.viscosity,
        absorption: this.fluid.absorption,
        paperType: this.fluid.paperType,
        inkType: this.fluid.currentInk
      };
    }

    // 重新创建流体模拟器
    this.fluid = new FluidSimulation(simWidth, simHeight);

    // 恢复参数
    if (Object.keys(params).length > 0) {
      this.fluid.setParameters(params);
    }

    // 调整缓冲区大小
    this.buffer.width = simWidth;
    this.buffer.height = simHeight;

    // 清除画布
    this.clear();

    console.log(`调整画布大小: ${this.canvas.width}x${this.canvas.height}, 模拟大小: ${simWidth}x${simHeight}`);
  }

  /**
   * 加载纸张纹理
   */
  loadPaperTextures() {
    // 直接创建默认纹理，不尝试加载外部图像
    this.createDefaultTexture('rice');
    this.createDefaultTexture('rough');
    this.createDefaultTexture('smooth');
    this.createDefaultTexture('absorbent');

    console.log('已创建所有默认纹理');
  }

  /**
   * 创建默认纹理
   */
  createDefaultTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 根据纸张类型创建不同的默认纹理
    switch (type) {
      case 'rice':
        // 米色背景，细微纹理
        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawNoiseTexture(ctx, 0.03, '#e8e8e0');
        break;
      case 'rough':
        // 灰白色背景，粗糙纹理
        ctx.fillStyle = '#f0f0e8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawNoiseTexture(ctx, 0.1, '#e0e0d8');
        break;
      case 'smooth':
        // 白色背景，几乎无纹理
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawNoiseTexture(ctx, 0.01, '#f8f8f8');
        break;
      case 'absorbent':
        // 浅黄色背景，中等纹理
        ctx.fillStyle = '#f8f5e8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawNoiseTexture(ctx, 0.05, '#f0edd0');
        break;
    }

    // 将Canvas转换为图像
    const img = new Image();
    img.src = canvas.toDataURL();
    this.paperTextures[type] = img;
  }

  /**
   * 绘制噪声纹理
   */
  drawNoiseTexture(ctx, intensity, color) {
    const { width, height } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 解析颜色
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, 1, 1);
    const colorData = tempCtx.getImageData(0, 0, 1, 1).data;

    // 添加噪声
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity * 255;

      data[i] = Math.max(0, Math.min(255, colorData[0] + noise));
      data[i + 1] = Math.max(0, Math.min(255, colorData[1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, colorData[2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 设置纸张类型
   */
  setPaper(paperType) {
    this.currentPaper = paperType;
    this.fluid.setParameters({ paperType });

    // 重绘背景
    this.drawBackground();
  }

  /**
   * 绘制背景
   */
  drawBackground() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 使用纯色背景
    switch (this.currentPaper) {
      case 'rice':
        this.ctx.fillStyle = '#f5f5f0';
        break;
      case 'rough':
        this.ctx.fillStyle = '#f0f0e8';
        break;
      case 'smooth':
        this.ctx.fillStyle = '#ffffff';
        break;
      case 'absorbent':
        this.ctx.fillStyle = '#f8f5e8';
        break;
      default:
        this.ctx.fillStyle = '#f5f5f0';
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 如果有纹理，尝试使用它
    const texture = this.paperTextures[this.currentPaper];
    if (texture && texture.complete) {
      try {
        // 平铺纹理以覆盖整个画布
        const pattern = this.ctx.createPattern(texture, 'repeat');
        if (pattern) {
          this.ctx.globalAlpha = 0.3; // 设置透明度使纹理更微妙
          this.ctx.fillStyle = pattern;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.globalAlpha = 1.0; // 恢复透明度
        }
      } catch (e) {
        console.warn('无法创建纹理图案:', e);
      }
    }
  }

  /**
   * 清除画布
   */
  clear() {
    // 清除流体模拟
    this.fluid.clear();

    // 重绘背景
    this.drawBackground();
  }

  /**
   * 渲染流体
   */
  render() {
    // 获取流体密度数据
    const density = this.fluid.density0;
    const width = this.fluid.width;
    const height = this.fluid.height;

    // 创建图像数据
    const imageData = this.bufferCtx.createImageData(width, height);
    const data = imageData.data;

    // 获取当前墨水颜色
    const inkColor = this.fluid.getCurrentInkColor();

    // 填充图像数据
    for (let i = 0; i < density.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);

      // 计算像素索引
      const pixelIndex = (y * width + x) * 4;

      // 获取墨水密度
      const d = Math.min(1, density[i]);

      if (d > 0.001) {
        // 设置颜色
        data[pixelIndex] = inkColor.r;
        data[pixelIndex + 1] = inkColor.g;
        data[pixelIndex + 2] = inkColor.b;
        data[pixelIndex + 3] = Math.floor(d * 255 * inkColor.a);
      } else {
        // 透明
        data[pixelIndex + 3] = 0;
      }
    }

    // 将图像数据绘制到缓冲区
    this.bufferCtx.putImageData(imageData, 0, 0);

    // 将缓冲区内容绘制到主画布
    this.ctx.globalCompositeOperation = this.blendMode;
    this.ctx.drawImage(
      this.buffer,
      0, 0, width, height,
      0, 0, this.canvas.width, this.canvas.height
    );

    // 重置混合模式
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 设置混合模式
   */
  setBlendMode(mode) {
    this.blendMode = mode;
  }

  /**
   * 保存画布为图像
   */
  saveAsImage() {
    return this.canvas.toDataURL('image/png');
  }
}
