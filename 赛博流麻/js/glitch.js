/**
 * 赛博流麻效果处理类
 * 实现各种赛博朋克风格的图像故障效果
 */
class GlitchEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.originalImageData = null;
    this.width = 0;
    this.height = 0;
    this.params = {
      glitchIntensity: 0.5,  // 故障强度 0-1
      rgbShift: 0.3,         // RGB偏移量 0-1
      scanLines: 0.4,        // 扫描线强度 0-1
      noiseAmount: 0.2,      // 噪点数量 0-1
      blockGlitch: 0.3,      // 块状故障 0-1
      waveDistortion: 0.25,  // 波浪扭曲 0-1
      colorShift: 0.35       // 色彩偏移 0-1
    };
    this.animationId = null;
    this.lastRender = 0;
  }

  // 加载图像
  loadImage(imageSource) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 调整canvas大小以适应图像
        this.width = img.width;
        this.height = img.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // 绘制原始图像
        this.ctx.drawImage(img, 0, 0, this.width, this.height);
        
        // 保存原始图像数据
        this.originalImageData = this.ctx.getImageData(0, 0, this.width, this.height);
        
        resolve();
      };
      img.onerror = () => reject(new Error('图像加载失败'));
      img.src = imageSource;
    });
  }

  // 更新参数
  updateParams(params) {
    Object.assign(this.params, params);
    this.render();
  }

  // 随机化参数
  randomizeParams() {
    this.params = {
      glitchIntensity: Math.random(),
      rgbShift: Math.random() * 0.5,
      scanLines: Math.random(),
      noiseAmount: Math.random() * 0.4,
      blockGlitch: Math.random() * 0.6,
      waveDistortion: Math.random() * 0.5,
      colorShift: Math.random() * 0.7
    };
    return this.params;
  }

  // 重置为原始图像
  reset() {
    if (this.originalImageData) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
    }
  }

  // 主渲染函数
  render() {
    if (!this.originalImageData) return;
    
    // 复制原始图像数据以进行处理
    const imageData = new ImageData(
      new Uint8ClampedArray(this.originalImageData.data),
      this.width,
      this.height
    );
    
    // 应用各种效果
    this.applyRGBShift(imageData);
    this.applyScanLines(imageData);
    this.applyNoise(imageData);
    this.applyBlockGlitch(imageData);
    this.applyWaveDistortion(imageData);
    this.applyColorShift(imageData);
    
    // 绘制处理后的图像
    this.ctx.putImageData(imageData, 0, 0);
  }

  // 开始动画渲染
  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const animate = (timestamp) => {
      if (timestamp - this.lastRender > 100) { // 每100ms更新一次
        this.lastRender = timestamp;
        
        // 随机调整某些参数以创建动态效果
        if (Math.random() < this.params.glitchIntensity * 0.3) {
          this.applyRandomGlitch();
        }
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  // 停止动画
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // 应用随机故障效果
  applyRandomGlitch() {
    const tempParams = { ...this.params };
    
    // 临时增强某些效果
    if (Math.random() < 0.3) {
      tempParams.rgbShift *= 1.5;
    }
    
    if (Math.random() < 0.2) {
      tempParams.blockGlitch *= 2;
    }
    
    this.updateParams(tempParams);
    this.render();
    
    // 短暂延迟后恢复原始参数
    setTimeout(() => {
      this.updateParams(this.params);
      this.render();
    }, 50 + Math.random() * 200);
  }

  // RGB通道偏移效果
  applyRGBShift(imageData) {
    if (this.params.rgbShift <= 0) return;
    
    const data = imageData.data;
    const amount = Math.floor(this.params.rgbShift * 20);
    const temp = new Uint8ClampedArray(data);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = (y * this.width + x) * 4;
        
        // 红色通道向左偏移
        const rOffset = ((y * this.width) + Math.max(0, x - amount)) * 4;
        data[i] = temp[rOffset];
        
        // 蓝色通道向右偏移
        const bOffset = ((y * this.width) + Math.min(this.width - 1, x + amount)) * 4 + 2;
        data[i + 2] = temp[bOffset];
      }
    }
  }

  // 扫描线效果
  applyScanLines(imageData) {
    if (this.params.scanLines <= 0) return;
    
    const data = imageData.data;
    const intensity = this.params.scanLines * 0.8;
    
    for (let y = 0; y < this.height; y++) {
      // 创建扫描线效果
      const lineFactor = Math.sin(y * 0.1) * 0.5 + 0.5;
      const scanIntensity = y % 2 === 0 ? intensity * lineFactor : 0;
      
      for (let x = 0; x < this.width; x++) {
        const i = (y * this.width + x) * 4;
        
        // 降低亮度以创建扫描线
        data[i] = data[i] * (1 - scanIntensity);
        data[i + 1] = data[i + 1] * (1 - scanIntensity);
        data[i + 2] = data[i + 2] * (1 - scanIntensity);
      }
    }
  }

  // 噪点效果
  applyNoise(imageData) {
    if (this.params.noiseAmount <= 0) return;
    
    const data = imageData.data;
    const amount = this.params.noiseAmount;
    
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < amount * 0.1) {
        // 添加白噪点
        const noise = Math.random() * 255;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
      }
    }
  }

  // 块状故障效果
  applyBlockGlitch(imageData) {
    if (this.params.blockGlitch <= 0) return;
    
    const data = imageData.data;
    const blockSize = Math.floor(this.params.blockGlitch * 30) + 5;
    const numBlocks = Math.floor(this.params.blockGlitch * 10) + 1;
    
    for (let n = 0; n < numBlocks; n++) {
      // 随机选择一个块
      const blockX = Math.floor(Math.random() * (this.width - blockSize));
      const blockY = Math.floor(Math.random() * (this.height - blockSize));
      
      // 随机选择目标位置
      const targetX = Math.floor(Math.random() * (this.width - blockSize));
      const targetY = blockY; // 保持在同一行以创建水平滑动效果
      
      // 复制块
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const sourceIdx = ((blockY + y) * this.width + (blockX + x)) * 4;
          const targetIdx = ((targetY + y) * this.width + (targetX + x)) * 4;
          
          // 复制像素
          data[targetIdx] = data[sourceIdx];
          data[targetIdx + 1] = data[sourceIdx + 1];
          data[targetIdx + 2] = data[sourceIdx + 2];
        }
      }
    }
  }

  // 波浪扭曲效果
  applyWaveDistortion(imageData) {
    if (this.params.waveDistortion <= 0) return;
    
    const temp = new ImageData(
      new Uint8ClampedArray(imageData.data),
      this.width,
      this.height
    );
    
    const amplitude = this.params.waveDistortion * 20;
    const frequency = 0.1;
    
    for (let y = 0; y < this.height; y++) {
      // 计算水平偏移
      const offsetX = Math.sin(y * frequency) * amplitude;
      
      for (let x = 0; x < this.width; x++) {
        // 计算源坐标
        const sourceX = Math.floor(x + offsetX);
        
        // 确保坐标在有效范围内
        if (sourceX >= 0 && sourceX < this.width) {
          const targetIdx = (y * this.width + x) * 4;
          const sourceIdx = (y * this.width + sourceX) * 4;
          
          // 复制像素
          imageData.data[targetIdx] = temp.data[sourceIdx];
          imageData.data[targetIdx + 1] = temp.data[sourceIdx + 1];
          imageData.data[targetIdx + 2] = temp.data[sourceIdx + 2];
          imageData.data[targetIdx + 3] = temp.data[sourceIdx + 3];
        }
      }
    }
  }

  // 色彩偏移效果
  applyColorShift(imageData) {
    if (this.params.colorShift <= 0) return;
    
    const data = imageData.data;
    const amount = this.params.colorShift;
    
    for (let i = 0; i < data.length; i += 4) {
      // 增强某些颜色通道
      if (Math.random() < amount * 0.5) {
        // 随机选择要增强的通道
        const channel = Math.floor(Math.random() * 3);
        data[i + channel] = Math.min(255, data[i + channel] * (1 + amount));
      }
      
      // 添加青色/洋红色调
      if (data[i] < data[i + 2]) {
        data[i] = Math.max(0, data[i] - amount * 20);
        data[i + 1] = Math.min(255, data[i + 1] + amount * 10);
      } else {
        data[i + 2] = Math.min(255, data[i + 2] + amount * 15);
      }
    }
  }

  // 保存当前图像
  saveImage() {
    return this.canvas.toDataURL('image/png');
  }
}
