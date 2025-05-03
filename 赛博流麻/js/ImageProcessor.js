/**
 * 图像处理器
 * 处理图像加载和处理
 */
class ImageProcessor {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.maxTextureSize = 1024; // 最大纹理尺寸
  }

  /**
   * 从URL加载图像
   * @param {string} url - 图像URL
   * @returns {Promise<THREE.Texture>} - 加载的纹理
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // 设置纹理参数
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          resolve(texture);
        },
        undefined, // 进度回调
        (error) => {
          console.error('加载图像失败:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * 从文件加载图像
   * @param {File} file - 图像文件
   * @returns {Promise<THREE.Texture>} - 加载的纹理
   */
  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('无效的图像文件'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          // 调整图像大小
          const resizedImage = this.resizeImage(img);
          
          // 创建纹理
          const texture = new THREE.Texture(resizedImage);
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          
          resolve(texture);
        };
        
        img.onerror = () => {
          reject(new Error('图像加载失败'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 调整图像大小
   * @param {HTMLImageElement} img - 原始图像
   * @returns {HTMLCanvasElement} - 调整大小后的图像
   */
  resizeImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 计算新尺寸
    let width = img.width;
    let height = img.height;
    
    if (width > this.maxTextureSize || height > this.maxTextureSize) {
      if (width > height) {
        height = Math.round(height * (this.maxTextureSize / width));
        width = this.maxTextureSize;
      } else {
        width = Math.round(width * (this.maxTextureSize / height));
        height = this.maxTextureSize;
      }
    }
    
    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    
    // 绘制调整大小后的图像
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas;
  }

  /**
   * 创建默认纹理
   * @returns {THREE.Texture} - 默认纹理
   */
  createDefaultTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(1, '#1a1a30');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加一些随机星星
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 创建纹理
    const texture = new THREE.Texture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    
    return texture;
  }

  /**
   * 应用滤镜效果
   * @param {THREE.Texture} texture - 原始纹理
   * @param {Object} filters - 滤镜参数
   * @returns {THREE.Texture} - 处理后的纹理
   */
  applyFilters(texture, filters) {
    // 创建临时画布
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    
    // 绘制原始图像
    ctx.drawImage(texture.image, 0, 0);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 应用滤镜
    for (let i = 0; i < data.length; i += 4) {
      // 获取像素颜色
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // 应用亮度调整
      if (filters.brightness !== undefined) {
        const factor = filters.brightness * 2;
        r = Math.min(255, r * factor);
        g = Math.min(255, g * factor);
        b = Math.min(255, b * factor);
      }
      
      // 应用对比度调整
      if (filters.contrast !== undefined) {
        const factor = filters.contrast * 2 + 1;
        const intercept = 128 * (1 - factor);
        r = Math.min(255, Math.max(0, r * factor + intercept));
        g = Math.min(255, Math.max(0, g * factor + intercept));
        b = Math.min(255, Math.max(0, b * factor + intercept));
      }
      
      // 应用饱和度调整
      if (filters.saturation !== undefined) {
        const factor = filters.saturation * 2 + 1;
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = Math.min(255, Math.max(0, gray + factor * (r - gray)));
        g = Math.min(255, Math.max(0, gray + factor * (g - gray)));
        b = Math.min(255, Math.max(0, gray + factor * (b - gray)));
      }
      
      // 应用色相调整
      if (filters.hue !== undefined) {
        const hsl = this.rgbToHsl(r, g, b);
        hsl[0] = (hsl[0] + filters.hue) % 1;
        const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
      }
      
      // 更新像素颜色
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    // 更新图像数据
    ctx.putImageData(imageData, 0, 0);
    
    // 创建新纹理
    const newTexture = new THREE.Texture(canvas);
    newTexture.wrapS = texture.wrapS;
    newTexture.wrapT = texture.wrapT;
    newTexture.minFilter = texture.minFilter;
    newTexture.magFilter = texture.magFilter;
    newTexture.needsUpdate = true;
    
    return newTexture;
  }

  /**
   * RGB转HSL
   * @param {number} r - 红色分量 (0-255)
   * @param {number} g - 绿色分量 (0-255)
   * @param {number} b - 蓝色分量 (0-255)
   * @returns {Array} - HSL值 [h, s, l] (0-1)
   */
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // 灰色
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h, s, l];
  }

  /**
   * HSL转RGB
   * @param {number} h - 色相 (0-1)
   * @param {number} s - 饱和度 (0-1)
   * @param {number} l - 亮度 (0-1)
   * @returns {Array} - RGB值 [r, g, b] (0-255)
   */
  hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // 灰色
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}
