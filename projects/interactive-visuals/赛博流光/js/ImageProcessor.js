/**
 * 图像处理器
 * 处理图像加载和处理
 */
class ImageProcessor {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.maxImageSize = 1024; // 最大图像尺寸
  }

  /**
   * 加载图像
   * @param {string} url - 图像URL
   * @returns {Promise<THREE.Texture>} - 加载的纹理
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          resolve(texture);
        },
        undefined,
        error => {
          console.error('图像加载失败:', error);
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
      const reader = new FileReader();
      
      reader.onload = e => {
        // 创建图像对象以获取尺寸
        const img = new Image();
        
        img.onload = () => {
          // 检查图像尺寸
          const { width, height } = this.calculateOptimalSize(img.width, img.height);
          
          // 如果需要调整大小
          if (width !== img.width || height !== img.height) {
            const resizedImage = this.resizeImage(img, width, height);
            
            // 创建纹理
            const texture = new THREE.Texture(resizedImage);
            texture.needsUpdate = true;
            resolve(texture);
          } else {
            // 直接创建纹理
            const texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            resolve(texture);
          }
        };
        
        img.onerror = () => {
          reject(new Error('图像处理失败'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 计算最佳图像尺寸
   * @param {number} width - 原始宽度
   * @param {number} height - 原始高度
   * @returns {Object} - 最佳尺寸 {width, height}
   */
  calculateOptimalSize(width, height) {
    // 如果图像尺寸已经小于最大尺寸，则不调整
    if (width <= this.maxImageSize && height <= this.maxImageSize) {
      return { width, height };
    }
    
    // 计算缩放比例
    const ratio = width / height;
    
    if (width > height) {
      // 宽度大于高度
      return {
        width: this.maxImageSize,
        height: Math.round(this.maxImageSize / ratio)
      };
    } else {
      // 高度大于宽度
      return {
        width: Math.round(this.maxImageSize * ratio),
        height: this.maxImageSize
      };
    }
  }
  
  /**
   * 调整图像大小
   * @param {HTMLImageElement} img - 图像元素
   * @param {number} width - 目标宽度
   * @param {number} height - 目标高度
   * @returns {HTMLCanvasElement} - 调整大小后的画布
   */
  resizeImage(img, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas;
  }
  
  /**
   * 应用滤镜效果
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {Object} options - 滤镜选项
   * @returns {HTMLCanvasElement} - 处理后的画布
   */
  applyFilters(canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 默认选项
    const defaults = {
      brightness: 0,  // -100 到 100
      contrast: 0,    // -100 到 100
      saturation: 0,  // -100 到 100
      hue: 0          // -180 到 180
    };
    
    // 合并选项
    const settings = { ...defaults, ...options };
    
    // 应用亮度
    const brightnessF = 1 + settings.brightness / 100;
    
    // 应用对比度
    const contrastF = 1 + settings.contrast / 100;
    const intercept = 128 * (1 - contrastF);
    
    // 应用饱和度和色相
    const saturationF = 1 + settings.saturation / 100;
    const hueF = settings.hue * Math.PI / 180;
    
    for (let i = 0; i < data.length; i += 4) {
      // 应用亮度和对比度
      data[i] = brightnessF * (contrastF * data[i] + intercept);
      data[i + 1] = brightnessF * (contrastF * data[i + 1] + intercept);
      data[i + 2] = brightnessF * (contrastF * data[i + 2] + intercept);
      
      // 应用饱和度和色相
      if (saturationF !== 1 || hueF !== 0) {
        // 转换为HSL
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        
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
        
        // 应用色相和饱和度
        h = (h + hueF / (2 * Math.PI)) % 1;
        s = Math.max(0, Math.min(1, s * saturationF));
        
        // 转换回RGB
        let r1, g1, b1;
        
        if (s === 0) {
          r1 = g1 = b1 = l; // 灰色
        } else {
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          
          r1 = this.hue2rgb(p, q, h + 1/3);
          g1 = this.hue2rgb(p, q, h);
          b1 = this.hue2rgb(p, q, h - 1/3);
        }
        
        data[i] = r1 * 255;
        data[i + 1] = g1 * 255;
        data[i + 2] = b1 * 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 辅助函数：色相转RGB
   */
  hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  
  /**
   * 创建纹理
   * @param {HTMLCanvasElement|HTMLImageElement} source - 源图像
   * @returns {THREE.Texture} - 创建的纹理
   */
  createTexture(source) {
    const texture = new THREE.Texture(source);
    texture.needsUpdate = true;
    return texture;
  }
}
