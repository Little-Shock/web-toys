/**
 * 波纹渲染器
 * 负责处理所有与波纹效果相关的渲染
 */
class RippleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    this.resize();
    
    // 波纹数组
    this.ripples = [];
    
    // 背景图像
    this.backgroundImage = null;
    this.hasCustomBackground = false;
    
    // 渲染参数
    this.params = {
      intensity: 0.5,    // 波纹强度
      size: 0.5,         // 波纹大小
      decay: 0.5,        // 波纹衰减速度
      multiElement: true // 是否允许元素混合
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
    
    // 绑定事件处理
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * 调整画布大小
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // 重新绘制背景
    this.drawBackground();
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
        this.drawBackground();
        resolve();
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        this.backgroundImage = img;
        this.hasCustomBackground = true;
        this.drawBackground();
        resolve();
      };
      
      img.onerror = () => {
        console.error('背景图像加载失败');
        this.backgroundImage = null;
        this.hasCustomBackground = false;
        this.drawBackground();
        reject(new Error('背景图像加载失败'));
      };
      
      if (typeof source === 'string') {
        img.src = source;
      } else if (source instanceof Image) {
        img.src = source.src;
      } else {
        reject(new Error('无效的图像源'));
      }
    });
  }

  /**
   * 绘制背景
   */
  drawBackground() {
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
      
      this.ctx.drawImage(this.backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
      
      // 添加暗色叠加层，使波纹更明显
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // 绘制默认渐变背景
      const gradient = this.ctx.createRadialGradient(
        this.width / 2, this.height / 2, 0,
        this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.5
      );
      
      gradient.addColorStop(0, '#1a237e');
      gradient.addColorStop(1, '#000000');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // 添加一些随机星星
      this.drawStars();
    }
  }

  /**
   * 绘制星星背景
   */
  drawStars() {
    const starCount = Math.floor(this.width * this.height / 5000);
    
    this.ctx.save();
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = Math.random() * 1.5;
      const opacity = Math.random() * 0.8 + 0.2;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  /**
   * 添加波纹
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} element - 元素类型
   * @param {number} intensity - 强度 (0-1)
   */
  addRipple(x, y, element, intensity = 1) {
    // 计算实际大小
    const baseSize = 50 + this.params.size * 100;
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
      rotationSpeed: (Math.random() - 0.5) * 0.02
    };
    
    this.ripples.push(ripple);
    
    // 如果波纹数量过多，移除最老的
    if (this.ripples.length > 100) {
      this.ripples.shift();
    }
  }

  /**
   * 更新波纹状态
   */
  update() {
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
   * 渲染所有波纹
   */
  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 重绘背景
    this.drawBackground();
    
    // 绘制所有波纹
    for (const ripple of this.ripples) {
      this.drawRipple(ripple);
    }
  }

  /**
   * 绘制单个波纹
   * @param {Object} ripple - 波纹对象
   */
  drawRipple(ripple) {
    const { x, y, size, element, opacity, age, rotation, intensity } = ripple;
    const colors = this.elementColors[element];
    
    this.ctx.save();
    
    // 移动到波纹中心并旋转
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    // 绘制外部光晕
    const glowSize = size * (1 + age * 0.1);
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    
    gradient.addColorStop(0, colors.glow.replace('0.2', opacity.toString()));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // 根据元素类型绘制不同的波纹效果
    switch (element) {
      case 'water':
        this.drawWaterRipple(size, age, opacity, colors, intensity);
        break;
      case 'fire':
        this.drawFireRipple(size, age, opacity, colors, intensity);
        break;
      case 'electric':
        this.drawElectricRipple(size, age, opacity, colors, intensity);
        break;
      case 'light':
        this.drawLightRipple(size, age, opacity, colors, intensity);
        break;
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制水元素波纹
   */
  drawWaterRipple(size, age, opacity, colors, intensity) {
    // 绘制多个同心圆
    const ringCount = 3;
    
    for (let i = 0; i < ringCount; i++) {
      const progress = (age * 0.1 + i / ringCount) % 1;
      const ringSize = size * progress;
      const ringOpacity = opacity * (1 - progress) * 0.8;
      
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
    }
  }

  /**
   * 绘制火元素波纹
   */
  drawFireRipple(size, age, opacity, colors, intensity) {
    // 绘制火焰粒子
    const particleCount = Math.floor(12 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + age * 0.2;
      const distance = size * (0.3 + 0.7 * Math.sin(age * 0.3 + i));
      
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      const particleSize = (size * 0.15) * (1 - age * 0.05) * (0.5 + Math.random() * 0.5);
      
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
   */
  drawElectricRipple(size, age, opacity, colors, intensity) {
    // 绘制闪电
    const boltCount = Math.floor(6 + intensity * 6);
    
    this.ctx.lineWidth = 2 + intensity * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2 + age * 0.1;
      const length = size * (0.5 + Math.random() * 0.5);
      
      // 创建闪电路径
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      
      let x = 0, y = 0;
      const segments = 4 + Math.floor(intensity * 3);
      
      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        const segmentAngle = angle + (Math.random() - 0.5) * 0.8;
        
        x += Math.cos(segmentAngle) * segmentLength;
        y += Math.sin(segmentAngle) * segmentLength;
        
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.strokeStyle = colors.primary.replace('0.7', (opacity * 0.9).toString());
      this.ctx.stroke();
    }
    
    // 绘制中心电球
    const coreSize = size * 0.2 * (1 - age * 0.02);
    if (coreSize > 0) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      this.ctx.fillStyle = colors.secondary.replace('0.4', opacity.toString());
      this.ctx.fill();
    }
  }

  /**
   * 绘制光元素波纹
   */
  drawLightRipple(size, age, opacity, colors, intensity) {
    // 绘制光芒
    const rayCount = Math.floor(8 + intensity * 8);
    const maxRayLength = size * (0.7 + intensity * 0.3);
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = maxRayLength * (0.5 + 0.5 * Math.sin(age * 0.2 + i * 0.7));
      
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
      const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
      
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
      coreGradient.addColorStop(0.7, colors.secondary.replace('0.4', (opacity * 0.8).toString()));
      coreGradient.addColorStop(1, colors.primary.replace('0.7', '0'));
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      this.ctx.fillStyle = coreGradient;
      this.ctx.fill();
    }
  }

  /**
   * 开始动画循环
   */
  startAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const animate = () => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * 停止动画循环
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
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
    }
  }

  /**
   * 更新渲染参数
   * @param {Object} params - 参数对象
   */
  updateParams(params) {
    Object.assign(this.params, params);
  }
}
