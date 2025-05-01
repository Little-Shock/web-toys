/**
 * 织物渲染器
 * 负责将织物物理模拟结果渲染到画布上
 */
class FabricRenderer {
  constructor(canvas, fabricPhysics) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.physics = fabricPhysics;
    
    // 渲染参数
    this.params = {
      showWireframe: false,
      showPins: true,
      showConstraints: false,
      showShadow: true,
      renderQuality: 1.0
    };
    
    // 纹理
    this.textures = {
      plain: null,
      stripes: null,
      dots: null,
      custom: null
    };
    
    // 当前纹理
    this.currentTexture = 'plain';
    
    // 当前颜色
    this.currentColor = '#3498db';
    
    // 调整画布大小
    this.resize();
    
    // 创建纹理
    this.createTextures();
    
    // 绑定窗口大小变化事件
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
  }
  
  /**
   * 创建纹理
   */
  createTextures() {
    // 创建素色纹理
    this.textures.plain = this.createPlainTexture();
    
    // 创建条纹纹理
    this.textures.stripes = this.createStripesTexture();
    
    // 创建圆点纹理
    this.textures.dots = this.createDotsTexture();
  }
  
  /**
   * 创建素色纹理
   * @returns {CanvasPattern} 纹理对象
   */
  createPlainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = this.currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加一些细微的纹理变化
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return this.ctx.createPattern(canvas, 'repeat');
  }
  
  /**
   * 创建条纹纹理
   * @returns {CanvasPattern} 纹理对象
   */
  createStripesTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // 背景色
    ctx.fillStyle = this.currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 条纹
    const stripeColor = this.adjustColor(this.currentColor, -20);
    ctx.fillStyle = stripeColor;
    
    const stripeWidth = 10;
    for (let i = 0; i < canvas.width; i += stripeWidth * 2) {
      ctx.fillRect(i, 0, stripeWidth, canvas.height);
    }
    
    return this.ctx.createPattern(canvas, 'repeat');
  }
  
  /**
   * 创建圆点纹理
   * @returns {CanvasPattern} 纹理对象
   */
  createDotsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // 背景色
    ctx.fillStyle = this.currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 圆点
    const dotColor = this.adjustColor(this.currentColor, -30);
    ctx.fillStyle = dotColor;
    
    const dotSize = 8;
    const spacing = 20;
    
    for (let y = spacing / 2; y < canvas.height; y += spacing) {
      for (let x = spacing / 2; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return this.ctx.createPattern(canvas, 'repeat');
  }
  
  /**
   * 设置自定义纹理
   * @param {HTMLImageElement} image - 图像元素
   */
  setCustomTexture(image) {
    if (!image) return;
    
    try {
      this.textures.custom = this.ctx.createPattern(image, 'repeat');
      this.currentTexture = 'custom';
    } catch (error) {
      console.error('创建自定义纹理失败:', error);
    }
  }
  
  /**
   * 设置当前纹理
   * @param {string} textureName - 纹理名称
   */
  setTexture(textureName) {
    if (this.textures[textureName]) {
      this.currentTexture = textureName;
    }
  }
  
  /**
   * 设置当前颜色
   * @param {string} color - 颜色值
   */
  setColor(color) {
    this.currentColor = color;
    
    // 更新纹理
    this.textures.plain = this.createPlainTexture();
    this.textures.stripes = this.createStripesTexture();
    this.textures.dots = this.createDotsTexture();
  }
  
  /**
   * 调整颜色亮度
   * @param {string} color - 颜色值
   * @param {number} amount - 调整量
   * @returns {string} 调整后的颜色
   */
  adjustColor(color, amount) {
    // 创建临时元素来解析颜色
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computedColor = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    
    // 解析RGB值
    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return color;
    
    const r = Math.max(0, Math.min(255, parseInt(match[1]) + amount));
    const g = Math.max(0, Math.min(255, parseInt(match[2]) + amount));
    const b = Math.max(0, Math.min(255, parseInt(match[3]) + amount));
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * 更新渲染参数
   * @param {Object} params - 渲染参数
   */
  updateParams(params) {
    Object.assign(this.params, params);
  }
  
  /**
   * 清除画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  /**
   * 渲染织物
   */
  render() {
    // 清除画布
    this.clear();
    
    // 获取织物网格数据
    const meshData = this.physics.getMeshData();
    const { points, constraints, triangles, pinnedPoints } = meshData;
    
    // 绘制背景
    this.ctx.fillStyle = '#f5f7fa';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制阴影
    if (this.params.showShadow) {
      this.renderShadow(points, triangles);
    }
    
    // 绘制织物
    this.renderFabric(points, triangles);
    
    // 绘制约束（线框）
    if (this.params.showWireframe || this.params.showConstraints) {
      this.renderConstraints(points, constraints);
    }
    
    // 绘制固定点
    if (this.params.showPins) {
      this.renderPins(points, pinnedPoints);
    }
  }
  
  /**
   * 渲染织物阴影
   * @param {Array} points - 点数组
   * @param {Array} triangles - 三角形数组
   */
  renderShadow(points, triangles) {
    // 设置阴影样式
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    
    // 阴影偏移
    const offsetX = 10;
    const offsetY = 10;
    
    // 绘制每个三角形
    for (const triangle of triangles) {
      const p1 = points[triangle[0]];
      const p2 = points[triangle[1]];
      const p3 = points[triangle[2]];
      
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x + offsetX, p1.y + offsetY);
      this.ctx.lineTo(p2.x + offsetX, p2.y + offsetY);
      this.ctx.lineTo(p3.x + offsetX, p3.y + offsetY);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
  
  /**
   * 渲染织物
   * @param {Array} points - 点数组
   * @param {Array} triangles - 三角形数组
   */
  renderFabric(points, triangles) {
    // 获取当前纹理
    const texture = this.textures[this.currentTexture];
    
    if (!texture) {
      // 如果没有纹理，使用纯色
      this.ctx.fillStyle = this.currentColor;
    } else {
      this.ctx.fillStyle = texture;
    }
    
    // 保存当前上下文状态
    this.ctx.save();
    
    // 开始新路径
    this.ctx.beginPath();
    
    // 绘制每个三角形
    for (const triangle of triangles) {
      const p1 = points[triangle[0]];
      const p2 = points[triangle[1]];
      const p3 = points[triangle[2]];
      
      // 使用纹理映射
      if (texture) {
        this.renderTexturedTriangle(p1, p2, p3);
      } else {
        // 简单填充
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
      }
    }
    
    // 填充路径
    if (!texture) {
      this.ctx.fill();
    }
    
    // 恢复上下文状态
    this.ctx.restore();
  }
  
  /**
   * 渲染带纹理的三角形
   * @param {Object} p1 - 第一个点
   * @param {Object} p2 - 第二个点
   * @param {Object} p3 - 第三个点
   */
  renderTexturedTriangle(p1, p2, p3) {
    // 使用仿射变换绘制纹理三角形
    // 这是一个简化版本，实际上需要更复杂的UV映射
    
    // 计算三角形的包围盒
    const minX = Math.min(p1.x, p2.x, p3.x);
    const minY = Math.min(p1.y, p2.y, p3.y);
    const maxX = Math.max(p1.x, p2.x, p3.x);
    const maxY = Math.max(p1.y, p2.y, p3.y);
    
    // 绘制三角形
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineTo(p3.x, p3.y);
    this.ctx.closePath();
    
    // 裁剪到三角形区域
    this.ctx.save();
    this.ctx.clip();
    
    // 填充纹理
    this.ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    
    // 恢复裁剪区域
    this.ctx.restore();
  }
  
  /**
   * 渲染约束（线框）
   * @param {Array} points - 点数组
   * @param {Array} constraints - 约束数组
   */
  renderConstraints(points, constraints) {
    // 设置线条样式
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 0.5;
    
    // 绘制每个约束
    for (const constraint of constraints) {
      const p1 = constraint.p1;
      const p2 = constraint.p2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }
  }
  
  /**
   * 渲染固定点
   * @param {Array} points - 点数组
   * @param {Array} pinnedPoints - 固定点索引数组
   */
  renderPins(points, pinnedPoints) {
    // 设置固定点样式
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    
    // 绘制每个固定点
    for (const index of pinnedPoints) {
      const point = points[index];
      
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }
  
  /**
   * 渲染风力效果
   * @param {number} x - 起点X坐标
   * @param {number} y - 起点Y坐标
   * @param {number} dirX - X方向分量
   * @param {number} dirY - Y方向分量
   * @param {number} strength - 风力强度
   */
  renderWindEffect(x, y, dirX, dirY, strength) {
    // 设置风力效果样式
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 2;
    
    // 计算终点
    const length = strength * 50;
    const endX = x + dirX * length;
    const endY = y + dirY * length;
    
    // 绘制风力线
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // 绘制箭头
    const arrowSize = 10;
    const angle = Math.atan2(dirY, dirX);
    
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fill();
  }
  
  /**
   * 渲染剪刀效果
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 剪刀半径
   */
  renderCutEffect(x, y, radius) {
    // 设置剪刀效果样式
    this.ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    this.ctx.lineWidth = 2;
    
    // 绘制剪刀范围
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // 绘制剪刀图标
    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('✂️', x, y);
  }
  
  /**
   * 保存画布为图像
   * @returns {string} 图像的Data URL
   */
  saveAsImage() {
    return this.canvas.toDataURL('image/png');
  }
}
