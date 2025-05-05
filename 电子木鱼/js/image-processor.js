/**
 * 图像处理器
 * 负责处理图像上传和处理
 */
class ImageProcessor {
  constructor() {
    // 图像状态
    this.currentImage = null;
    this.processedImage = null;
    this.defaultImage = null;

    // 处理参数
    this.params = {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.9,
      circularCrop: true
    };

    // 检测浏览器功能
    const features = detectBrowserFeatures();
    this.hasFileAPI = features.fileAPI;

    // 初始化
    this.init();
  }

  /**
   * 初始化图像处理器
   */
  async init() {
    // 加载默认图像
    try {
      this.defaultImage = await this.loadDefaultImage();
    } catch (error) {
      console.error('加载默认图像失败:', error);
    }
  }

  /**
   * 加载默认图像
   * @returns {string} 默认图像的Data URL
   */
  async loadDefaultImage() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 处理默认图像
        const processedImage = this.processImage(img);
        resolve(processedImage);
      };
      img.onerror = () => {
        // 创建备用图像
        const fallbackImage = this.createFallbackImage();
        resolve(fallbackImage);
      };

      // 尝试加载默认图像
      img.src = 'assets/images/default-character.svg';
    });
  }

  /**
   * 创建备用图像
   * @returns {string} 备用图像的Data URL
   */
  createFallbackImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // 绘制圆形背景
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // 绘制简单的笑脸
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 眼睛
    ctx.beginPath();
    ctx.arc(70, 80, 10, 0, Math.PI * 2);
    ctx.arc(130, 80, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // 嘴巴
    ctx.beginPath();
    ctx.arc(100, 110, 40, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    return canvas.toDataURL('image/png');
  }

  /**
   * 处理图像文件
   * @param {File} file - 图像文件
   * @returns {Promise<string>} 处理后的图像Data URL
   */
  async processImageFile(file) {
    if (!this.hasFileAPI) {
      throw new Error('浏览器不支持文件API');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            // 保存原始图像
            this.currentImage = img;

            // 处理图像
            const processedImage = this.processImage(img);
            this.processedImage = processedImage;

            resolve(processedImage);
          };
          img.onerror = () => {
            reject(new Error('图像加载失败'));
          };

          img.src = e.target.result;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * 处理图像
   * @param {HTMLImageElement} img - 图像元素
   * @returns {string} 处理后的图像Data URL
   */
  processImage(img) {
    // 调整大小
    const resizedImage = this.resizeImage(img);

    // 圆形裁剪
    if (this.params.circularCrop) {
      return this.createCircularImage(resizedImage);
    }

    return resizedImage;
  }

  /**
   * 调整图像大小
   * @param {HTMLImageElement} img - 图像元素
   * @returns {string} 调整大小后的图像Data URL
   */
  resizeImage(img) {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // 计算缩放比例
    if (width > this.params.maxWidth || height > this.params.maxHeight) {
      const ratio = Math.min(this.params.maxWidth / width, this.params.maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/png', this.params.quality);
  }

  /**
   * 创建圆形图像
   * @param {string} imageUrl - 图像URL
   * @returns {Promise<string>} 圆形图像的Data URL
   */
  createCircularImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        // 创建圆形裁剪区域
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // 绘制图像
        ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
        );

        // 添加边框
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        resolve(canvas.toDataURL('image/png', this.params.quality));
      };

      img.onerror = () => {
        reject(new Error('创建圆形图像失败'));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 应用图像效果
   * @param {string} imageUrl - 图像URL
   * @param {Object} effects - 效果参数
   * @returns {Promise<string>} 处理后的图像Data URL
   */
  async applyEffects(imageUrl, effects = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');

        // 绘制原始图像
        ctx.drawImage(img, 0, 0);

        // 应用效果
        if (effects.brightness !== undefined) {
          this.applyBrightness(ctx, canvas.width, canvas.height, effects.brightness);
        }

        if (effects.contrast !== undefined) {
          this.applyContrast(ctx, canvas.width, canvas.height, effects.contrast);
        }

        if (effects.saturation !== undefined) {
          this.applySaturation(ctx, canvas.width, canvas.height, effects.saturation);
        }

        if (effects.blur !== undefined) {
          this.applyBlur(ctx, canvas.width, canvas.height, effects.blur);
        }

        if (effects.glow) {
          this.applyGlow(ctx, canvas.width, canvas.height, effects.glowColor || 'rgba(255, 255, 255, 0.5)', effects.glowSize || 10);
        }

        resolve(canvas.toDataURL('image/png', this.params.quality));
      };

      img.onerror = () => {
        reject(new Error('应用图像效果失败'));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 应用亮度效果
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} value - 亮度值 (-1 到 1)
   */
  applyBrightness(ctx, width, height, value) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + 255 * value, 0, 255);     // R
      data[i + 1] = clamp(data[i + 1] + 255 * value, 0, 255); // G
      data[i + 2] = clamp(data[i + 2] + 255 * value, 0, 255); // B
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用对比度效果
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} value - 对比度值 (-1 到 1)
   */
  applyContrast(ctx, width, height, value) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255);     // R
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255); // G
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255); // B
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用饱和度效果
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} value - 饱和度值 (-1 到 1)
   */
  applySaturation(ctx, width, height, value) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const factor = 1 + value;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

      data[i] = clamp(gray + factor * (r - gray), 0, 255);     // R
      data[i + 1] = clamp(gray + factor * (g - gray), 0, 255); // G
      data[i + 2] = clamp(gray + factor * (b - gray), 0, 255); // B
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用模糊效果
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} value - 模糊值 (0 到 10)
   */
  applyBlur(ctx, width, height, value) {
    if (value <= 0) return;

    // 使用CSS滤镜
    ctx.filter = `blur(${value}px)`;

    // 保存当前图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(ctx.canvas, 0, 0);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 重新绘制带滤镜的图像
    ctx.drawImage(tempCanvas, 0, 0);

    // 重置滤镜
    ctx.filter = 'none';
  }

  /**
   * 应用发光效果
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} color - 发光颜色
   * @param {number} size - 发光大小
   */
  applyGlow(ctx, width, height, color, size) {
    // 保存当前图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(ctx.canvas, 0, 0);

    // 应用发光效果
    ctx.shadowColor = color;
    ctx.shadowBlur = size;
    ctx.drawImage(tempCanvas, 0, 0);

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  /**
   * 获取当前图像
   * @returns {string} 当前图像的Data URL
   */
  getCurrentImage() {
    return this.processedImage || this.defaultImage;
  }

  /**
   * 获取默认图像
   * @returns {string} 默认图像的Data URL
   */
  getDefaultImage() {
    return this.defaultImage;
  }

  /**
   * 重置为默认图像
   */
  resetToDefault() {
    this.currentImage = null;
    this.processedImage = null;

    return this.defaultImage;
  }
}
