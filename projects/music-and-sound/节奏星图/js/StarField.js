/**
 * 星空场景
 * 负责渲染星空背景和星点
 */
class StarField {
  /**
   * 创建星空场景
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {Object} options - 配置选项
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 配置参数
    this.params = {
      starCount: options.starCount || 200,
      starSizeMin: options.starSizeMin || 0.5,
      starSizeMax: options.starSizeMax || 2,
      starColorBase: options.starColorBase || '#ffffff',
      starColorVariation: options.starColorVariation || 0.2,
      backgroundGradient: options.backgroundGradient || ['#000000', '#0a0a2a'],
      theme: options.theme || 'cosmic',
      parallaxFactor: options.parallaxFactor || 0.1,
      twinkleSpeed: options.twinkleSpeed || 0.01,
      twinkleAmount: options.twinkleAmount || 0.3
    };
    
    // 星空主题
    this.themes = {
      cosmic: {
        backgroundGradient: ['#000000', '#0a0a2a'],
        starColorBase: '#ffffff',
        starColorVariation: 0.2,
        nebulaColors: ['rgba(75, 0, 130, 0.1)', 'rgba(138, 43, 226, 0.1)', 'rgba(0, 0, 139, 0.1)']
      },
      aurora: {
        backgroundGradient: ['#000000', '#001a33'],
        starColorBase: '#a0e6ff',
        starColorVariation: 0.3,
        nebulaColors: ['rgba(0, 255, 127, 0.1)', 'rgba(0, 191, 255, 0.1)', 'rgba(30, 144, 255, 0.1)']
      },
      nebula: {
        backgroundGradient: ['#0a0014', '#1a0033'],
        starColorBase: '#ffccff',
        starColorVariation: 0.4,
        nebulaColors: ['rgba(255, 0, 255, 0.1)', 'rgba(138, 43, 226, 0.1)', 'rgba(75, 0, 130, 0.1)']
      },
      galaxy: {
        backgroundGradient: ['#000000', '#0a0a0a'],
        starColorBase: '#ffffcc',
        starColorVariation: 0.3,
        nebulaColors: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 140, 0, 0.1)', 'rgba(178, 34, 34, 0.1)']
      }
    };
    
    // 应用主题
    this.applyTheme(this.params.theme);
    
    // 星星数组
    this.stars = [];
    
    // 用户创建的星点
    this.userStars = [];
    
    // 星座连接
    this.constellations = [];
    
    // 动画状态
    this.time = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // 鼠标/触摸位置
    this.mousePosition = { x: 0, y: 0 };
    
    // 设备方向
    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    
    // 初始化
    this.init();
    this.resize();
    
    // 添加事件监听
    window.addEventListener('resize', () => this.resize());
    
    // 设备方向事件
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        this.deviceOrientation = {
          alpha: e.alpha || 0,
          beta: e.beta || 0,
          gamma: e.gamma || 0
        };
      });
    }
  }
  
  /**
   * 初始化星空
   */
  init() {
    // 创建背景星星
    this.createStars();
    
    // 开始动画循环
    this.animate();
  }
  
  /**
   * 应用主题
   * @param {string} themeName - 主题名称
   */
  applyTheme(themeName) {
    if (this.themes[themeName]) {
      const theme = this.themes[themeName];
      this.params.backgroundGradient = theme.backgroundGradient;
      this.params.starColorBase = theme.starColorBase;
      this.params.starColorVariation = theme.starColorVariation;
      this.params.nebulaColors = theme.nebulaColors;
    }
  }
  
  /**
   * 设置主题
   * @param {string} themeName - 主题名称
   */
  setTheme(themeName) {
    this.params.theme = themeName;
    this.applyTheme(themeName);
    
    // 更新星星颜色
    this.updateStarColors();
  }
  
  /**
   * 更新星星颜色
   */
  updateStarColors() {
    for (const star of this.stars) {
      star.color = this.getRandomStarColor();
    }
  }
  
  /**
   * 调整画布大小
   */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    
    this.ctx.scale(dpr, dpr);
    
    // 重新创建星星
    this.createStars();
  }
  
  /**
   * 创建背景星星
   */
  createStars() {
    this.stars = [];
    
    for (let i = 0; i < this.params.starCount; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: random(this.params.starSizeMin, this.params.starSizeMax),
        color: this.getRandomStarColor(),
        twinkle: Math.random(),
        twinkleSpeed: random(0.005, 0.02),
        parallaxFactor: random(0.05, 0.2)
      });
    }
  }
  
  /**
   * 获取随机星星颜色
   * @returns {string} 颜色值
   */
  getRandomStarColor() {
    // 解析基础颜色
    const r = parseInt(this.params.starColorBase.substr(1, 2), 16);
    const g = parseInt(this.params.starColorBase.substr(3, 2), 16);
    const b = parseInt(this.params.starColorBase.substr(5, 2), 16);
    
    // 添加随机变化
    const variation = this.params.starColorVariation;
    const vr = Math.floor(random(-r * variation, r * variation));
    const vg = Math.floor(random(-g * variation, g * variation));
    const vb = Math.floor(random(-b * variation, b * variation));
    
    // 生成新颜色
    const nr = clamp(r + vr, 0, 255);
    const ng = clamp(g + vg, 0, 255);
    const nb = clamp(b + vb, 0, 255);
    
    return `rgb(${nr}, ${ng}, ${nb})`;
  }
  
  /**
   * 添加用户创建的星点
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 星点选项
   * @returns {Object} 创建的星点
   */
  addUserStar(x, y, options = {}) {
    const star = {
      id: options.id || generateId(),
      x,
      y,
      size: options.size || random(3, 5),
      color: options.color || '#ffffff',
      pulse: options.pulse || false,
      pulseSize: options.pulseSize || 20,
      pulseSpeed: options.pulseSpeed || 1,
      pulsePhase: options.pulsePhase || 0,
      trail: options.trail || false,
      trailPoints: options.trailPoints || [],
      trailMaxLength: options.trailMaxLength || 20,
      layerId: options.layerId || 0,
      time: Date.now(),
      opacity: 1,
      fadeIn: true,
      age: 0
    };
    
    this.userStars.push(star);
    return star;
  }
  
  /**
   * 添加星座连接
   * @param {string} sourceId - 源星点ID
   * @param {string} targetId - 目标星点ID
   * @param {Object} options - 连接选项
   * @returns {Object} 创建的连接
   */
  addConstellation(sourceId, targetId, options = {}) {
    // 查找源星点和目标星点
    const sourceStar = this.userStars.find(star => star.id === sourceId);
    const targetStar = this.userStars.find(star => star.id === targetId);
    
    if (!sourceStar || !targetStar) return null;
    
    const constellation = {
      id: options.id || generateId(),
      sourceId,
      targetId,
      sourceX: sourceStar.x,
      sourceY: sourceStar.y,
      targetX: targetStar.x,
      targetY: targetStar.y,
      color: options.color || sourceStar.color,
      width: options.width || 1,
      pulse: options.pulse || false,
      pulseSpeed: options.pulseSpeed || 1,
      pulsePhase: options.pulsePhase || 0,
      layerId: options.layerId || sourceStar.layerId,
      time: Date.now(),
      opacity: 0,
      fadeIn: true,
      age: 0
    };
    
    this.constellations.push(constellation);
    return constellation;
  }
  
  /**
   * 更新星座连接位置
   * @param {string} constellationId - 连接ID
   */
  updateConstellationPosition(constellationId) {
    const constellation = this.constellations.find(c => c.id === constellationId);
    if (!constellation) return;
    
    // 查找源星点和目标星点
    const sourceStar = this.userStars.find(star => star.id === constellation.sourceId);
    const targetStar = this.userStars.find(star => star.id === constellation.targetId);
    
    if (sourceStar && targetStar) {
      constellation.sourceX = sourceStar.x;
      constellation.sourceY = sourceStar.y;
      constellation.targetX = targetStar.x;
      constellation.targetY = targetStar.y;
    }
  }
  
  /**
   * 移除用户星点
   * @param {string} starId - 星点ID
   * @returns {boolean} 是否成功移除
   */
  removeUserStar(starId) {
    const index = this.userStars.findIndex(star => star.id === starId);
    
    if (index !== -1) {
      this.userStars.splice(index, 1);
      
      // 移除相关的星座连接
      this.constellations = this.constellations.filter(
        c => c.sourceId !== starId && c.targetId !== starId
      );
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 移除星座连接
   * @param {string} constellationId - 连接ID
   * @returns {boolean} 是否成功移除
   */
  removeConstellation(constellationId) {
    const index = this.constellations.findIndex(c => c.id === constellationId);
    
    if (index !== -1) {
      this.constellations.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * 清除所有用户星点
   */
  clearUserStars() {
    this.userStars = [];
    this.constellations = [];
  }
  
  /**
   * 清除指定层的用户星点
   * @param {number} layerId - 层ID
   */
  clearLayerStars(layerId) {
    this.userStars = this.userStars.filter(star => star.layerId !== layerId);
    this.constellations = this.constellations.filter(c => c.layerId !== layerId);
  }
  
  /**
   * 设置鼠标位置
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   */
  setMousePosition(x, y) {
    this.mousePosition = {
      x: x / window.innerWidth,
      y: y / window.innerHeight
    };
  }
  
  /**
   * 应用设备方向
   */
  applyDeviceOrientation() {
    if (!this.deviceOrientation) return;
    
    // 将设备方向转换为视差偏移
    const beta = clamp(this.deviceOrientation.beta || 0, -90, 90);
    const gamma = clamp(this.deviceOrientation.gamma || 0, -90, 90);
    
    // 归一化到 -1 到 1 范围
    const normalizedBeta = beta / 90;
    const normalizedGamma = gamma / 90;
    
    // 应用视差效果
    this.mousePosition = {
      x: 0.5 + normalizedGamma * 0.5,
      y: 0.5 + normalizedBeta * 0.5
    };
  }
  
  /**
   * 动画循环
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // 计算时间增量
    const now = Date.now();
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.time += this.deltaTime;
    
    // 应用设备方向
    this.applyDeviceOrientation();
    
    // 更新和渲染
    this.update();
    this.render();
  }
  
  /**
   * 更新星空状态
   */
  update() {
    // 更新背景星星
    for (const star of this.stars) {
      // 更新闪烁
      star.twinkle += star.twinkleSpeed * this.deltaTime * 60;
      if (star.twinkle > 1) star.twinkle = 0;
    }
    
    // 更新用户星点
    for (let i = this.userStars.length - 1; i >= 0; i--) {
      const star = this.userStars[i];
      
      // 更新年龄
      star.age += this.deltaTime;
      
      // 淡入效果
      if (star.fadeIn) {
        star.opacity = Math.min(star.opacity + this.deltaTime * 2, 1);
        if (star.opacity >= 1) star.fadeIn = false;
      }
      
      // 更新脉冲
      if (star.pulse) {
        star.pulsePhase += star.pulseSpeed * this.deltaTime;
        if (star.pulsePhase > Math.PI * 2) star.pulsePhase -= Math.PI * 2;
      }
      
      // 更新轨迹
      if (star.trail) {
        // 添加新的轨迹点
        star.trailPoints.push({ x: star.x, y: star.y, age: 0 });
        
        // 限制轨迹长度
        if (star.trailPoints.length > star.trailMaxLength) {
          star.trailPoints.shift();
        }
        
        // 更新轨迹点年龄
        for (let j = 0; j < star.trailPoints.length; j++) {
          star.trailPoints[j].age += this.deltaTime;
        }
      }
    }
    
    // 更新星座连接
    for (let i = this.constellations.length - 1; i >= 0; i--) {
      const constellation = this.constellations[i];
      
      // 更新年龄
      constellation.age += this.deltaTime;
      
      // 淡入效果
      if (constellation.fadeIn) {
        constellation.opacity = Math.min(constellation.opacity + this.deltaTime * 2, 1);
        if (constellation.opacity >= 1) constellation.fadeIn = false;
      }
      
      // 更新脉冲
      if (constellation.pulse) {
        constellation.pulsePhase += constellation.pulseSpeed * this.deltaTime;
        if (constellation.pulsePhase > Math.PI * 2) constellation.pulsePhase -= Math.PI * 2;
      }
      
      // 更新位置
      this.updateConstellationPosition(constellation.id);
    }
  }
  
  /**
   * 渲染星空
   */
  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    this.drawBackground();
    
    // 绘制星云
    this.drawNebula();
    
    // 绘制背景星星
    this.drawBackgroundStars();
    
    // 绘制星座连接
    this.drawConstellations();
    
    // 绘制用户星点
    this.drawUserStars();
  }
  
  /**
   * 绘制背景
   */
  drawBackground() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.params.backgroundGradient[0]);
    gradient.addColorStop(1, this.params.backgroundGradient[1]);
    
    // 填充背景
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  /**
   * 绘制星云
   */
  drawNebula() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 绘制多个星云
    for (let i = 0; i < 3; i++) {
      const x = width * (0.2 + 0.6 * Math.sin(this.time * 0.05 + i * Math.PI * 2 / 3));
      const y = height * (0.2 + 0.6 * Math.cos(this.time * 0.05 + i * Math.PI * 2 / 3));
      const size = Math.min(width, height) * (0.3 + 0.1 * Math.sin(this.time * 0.1 + i));
      
      // 创建径向渐变
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, this.params.nebulaColors[i % this.params.nebulaColors.length]);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // 填充星云
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }
  
  /**
   * 绘制背景星星
   */
  drawBackgroundStars() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 计算视差偏移
    const parallaxX = (this.mousePosition.x - 0.5) * 2;
    const parallaxY = (this.mousePosition.y - 0.5) * 2;
    
    // 绘制每颗星星
    for (const star of this.stars) {
      // 应用视差
      const x = (star.x + parallaxX * star.parallaxFactor) * width;
      const y = (star.y + parallaxY * star.parallaxFactor) * height;
      
      // 计算闪烁
      const twinkle = 0.7 + 0.3 * Math.sin(star.twinkle * Math.PI * 2);
      
      // 绘制星星
      ctx.beginPath();
      ctx.arc(x, y, star.size * twinkle, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = twinkle;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  
  /**
   * 绘制用户星点
   */
  drawUserStars() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 绘制每个用户星点
    for (const star of this.userStars) {
      const x = star.x * width;
      const y = star.y * height;
      
      // 绘制星点
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // 绘制脉冲效果
      if (star.pulse) {
        const pulseSize = star.pulseSize * (0.5 + 0.5 * Math.sin(star.pulsePhase));
        
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = star.opacity * (1 - pulseSize / star.pulseSize);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // 绘制轨迹
      if (star.trail && star.trailPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(star.trailPoints[0].x * width, star.trailPoints[0].y * height);
        
        for (let i = 1; i < star.trailPoints.length; i++) {
          const point = star.trailPoints[i];
          ctx.lineTo(point.x * width, point.y * height);
        }
        
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = star.opacity * 0.5;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  
  /**
   * 绘制星座连接
   */
  drawConstellations() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // 绘制每个星座连接
    for (const constellation of this.constellations) {
      const sourceX = constellation.sourceX * width;
      const sourceY = constellation.sourceY * height;
      const targetX = constellation.targetX * width;
      const targetY = constellation.targetY * height;
      
      // 计算连接线的长度和角度
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // 绘制连接线
      ctx.save();
      ctx.translate(sourceX, sourceY);
      ctx.rotate(angle);
      
      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, distance, 0);
      gradient.addColorStop(0, constellation.color);
      gradient.addColorStop(1, constellation.color);
      
      // 绘制线条
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(distance, 0);
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = constellation.opacity;
      
      // 应用脉冲效果
      if (constellation.pulse) {
        ctx.lineWidth = constellation.width * (0.5 + 0.5 * Math.sin(constellation.pulsePhase));
      } else {
        ctx.lineWidth = constellation.width;
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  
  /**
   * 获取指定位置的星点
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {number} radius - 搜索半径
   * @returns {Object|null} 星点或null
   */
  getStarAtPosition(x, y, radius = 0.02) {
    for (const star of this.userStars) {
      const distance = Math.sqrt(
        Math.pow(star.x - x, 2) +
        Math.pow(star.y - y, 2)
      );
      
      if (distance < radius) {
        return star;
      }
    }
    
    return null;
  }
  
  /**
   * 获取指定层的星点
   * @param {number} layerId - 层ID
   * @returns {Array} 星点数组
   */
  getLayerStars(layerId) {
    return this.userStars.filter(star => star.layerId === layerId);
  }
  
  /**
   * 获取指定层的星座连接
   * @param {number} layerId - 层ID
   * @returns {Array} 连接数组
   */
  getLayerConstellations(layerId) {
    return this.constellations.filter(c => c.layerId === layerId);
  }
  
  /**
   * 创建星座
   * @param {Array} stars - 星点数组
   * @param {Object} options - 选项
   */
  createConstellation(stars, options = {}) {
    if (stars.length < 2) return;
    
    // 连接所有星点
    for (let i = 0; i < stars.length - 1; i++) {
      this.addConstellation(stars[i].id, stars[i + 1].id, options);
    }
    
    // 可选：连接首尾
    if (options.closed && stars.length > 2) {
      this.addConstellation(stars[stars.length - 1].id, stars[0].id, options);
    }
  }
  
  /**
   * 应用扰动效果
   * @param {number} intensity - 扰动强度
   */
  applyDisturbance(intensity = 1) {
    // 扰动背景星星
    for (const star of this.stars) {
      star.x += random(-0.01, 0.01) * intensity;
      star.y += random(-0.01, 0.01) * intensity;
      
      // 保持在范围内
      star.x = cycle(star.x, 0, 1);
      star.y = cycle(star.y, 0, 1);
    }
    
    // 扰动用户星点
    for (const star of this.userStars) {
      star.x += random(-0.005, 0.005) * intensity;
      star.y += random(-0.005, 0.005) * intensity;
      
      // 保持在范围内
      star.x = clamp(star.x, 0, 1);
      star.y = clamp(star.y, 0, 1);
    }
  }
  
  /**
   * 保存星空图像
   * @returns {string} 图像数据URL
   */
  saveImage() {
    return this.canvas.toDataURL('image/png');
  }
  
  /**
   * 释放资源
   */
  dispose() {
    window.removeEventListener('resize', () => this.resize());
    window.removeEventListener('deviceorientation', () => {});
    
    this.stars = [];
    this.userStars = [];
    this.constellations = [];
  }
}
