/**
 * 阴影渲染器
 * 负责将光源和物体渲染到画布上，计算阴影效果
 */
class ShadowRenderer {
  constructor(canvas, lightEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lightEngine = lightEngine;
    
    // 渲染参数
    this.params = {
      shadowQuality: 1, // 阴影质量（1为全质量，小于1为性能优化）
      glowEffect: true, // 是否启用光晕效果
      shadowBlur: 15,   // 阴影模糊程度
      lightGlow: 30     // 光源光晕大小
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  
  /**
   * 清除画布
   */
  clear() {
    // 使用背景暗度参数设置背景颜色
    const darkness = this.lightEngine.params.backgroundDarkness;
    const bgColor = `rgb(${Math.floor(20 * (1 - darkness))}, ${Math.floor(20 * (1 - darkness))}, ${Math.floor(30 * (1 - darkness))})`;
    
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  /**
   * 渲染场景
   */
  render() {
    // 清除画布
    this.clear();
    
    // 渲染环境光
    this.renderAmbientLight();
    
    // 使用合成模式来叠加光源效果
    this.ctx.globalCompositeOperation = 'lighter';
    
    // 渲染所有光源和阴影
    this.lightEngine.lights.forEach(light => {
      if (light.type !== 'ambient') {
        this.renderLightAndShadows(light);
      }
    });
    
    // 恢复默认合成模式
    this.ctx.globalCompositeOperation = 'source-over';
    
    // 渲染物体轮廓
    this.renderObjectOutlines();
  }
  
  /**
   * 渲染环境光
   */
  renderAmbientLight() {
    // 查找环境光
    const ambientLights = this.lightEngine.lights.filter(light => light.type === 'ambient');
    
    if (ambientLights.length === 0) return;
    
    // 计算环境光总强度
    let totalAmbientStrength = 0;
    let ambientColor = { r: 0, g: 0, b: 0 };
    
    ambientLights.forEach(light => {
      const strength = this.lightEngine.getAmbientStrength(light);
      totalAmbientStrength += strength;
      
      // 解析颜色
      const color = this.parseColor(light.color);
      ambientColor.r += color.r * strength;
      ambientColor.g += color.g * strength;
      ambientColor.b += color.b * strength;
    });
    
    if (totalAmbientStrength > 0) {
      // 归一化颜色
      ambientColor.r = Math.min(255, ambientColor.r / totalAmbientStrength);
      ambientColor.g = Math.min(255, ambientColor.g / totalAmbientStrength);
      ambientColor.b = Math.min(255, ambientColor.b / totalAmbientStrength);
      
      // 创建环境光图层
      this.ctx.fillStyle = `rgba(${Math.floor(ambientColor.r)}, ${Math.floor(ambientColor.g)}, ${Math.floor(ambientColor.b)}, ${totalAmbientStrength})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // 绘制物体在环境光下的形状
      this.renderObjectsInAmbientLight(totalAmbientStrength, ambientColor);
    }
  }
  
  /**
   * 在环境光下渲染物体
   */
  renderObjectsInAmbientLight(ambientStrength, ambientColor) {
    // 设置合成模式为排除
    this.ctx.globalCompositeOperation = 'destination-out';
    
    // 渲染所有物体
    this.lightEngine.objects.forEach(object => {
      // 计算物体不透明度
      const opacity = object.opacity * this.lightEngine.params.objectOpacity;
      
      // 设置填充样式
      this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      
      // 根据物体类型绘制形状
      this.drawObjectShape(object);
    });
    
    // 恢复默认合成模式
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * 渲染光源和阴影
   * @param {Object} light - 光源对象
   */
  renderLightAndShadows(light) {
    // 获取光源实际位置和参数
    const pos = this.lightEngine.getLightPosition(light);
    const intensity = this.lightEngine.getLightIntensity(light);
    const direction = this.lightEngine.getLightDirection(light);
    
    // 解析光源颜色
    const color = this.parseColor(light.color);
    
    // 创建径向渐变（光源）
    let gradient;
    let lightRadius;
    
    switch (light.type) {
      case 'point':
        lightRadius = light.radius * (1 + intensity);
        gradient = this.ctx.createRadialGradient(
          pos.x, pos.y, 0,
          pos.x, pos.y, lightRadius
        );
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        break;
      
      case 'spot':
        lightRadius = light.radius * (1 + intensity);
        // 绘制聚光灯效果
        this.renderSpotLight(pos, direction, light.angle, lightRadius, color, intensity, light.falloff);
        return; // 聚光灯有特殊渲染，直接返回
      
      case 'directional':
        // 绘制平行光效果
        this.renderDirectionalLight(direction, color, intensity);
        return; // 平行光有特殊渲染，直接返回
    }
    
    // 绘制光源光晕
    if (gradient) {
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, lightRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // 渲染阴影
    this.renderShadows(light, pos, color, intensity);
    
    // 如果启用光晕效果，绘制光源中心的亮点
    if (this.params.glowEffect) {
      const glowSize = this.params.lightGlow * intensity;
      const glowGradient = this.ctx.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, glowSize
      );
      glowGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
      glowGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.5})`);
      glowGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      
      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  /**
   * 渲染聚光灯效果
   */
  renderSpotLight(pos, direction, angle, radius, color, intensity, falloff) {
    // 计算聚光灯的起点和终点
    const startX = pos.x;
    const startY = pos.y;
    const endX = pos.x + Math.cos(direction) * radius;
    const endY = pos.y + Math.sin(direction) * radius;
    
    // 创建径向渐变
    const gradient = this.ctx.createRadialGradient(
      startX, startY, 0,
      startX, startY, radius
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(falloff, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.5})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    // 保存当前上下文状态
    this.ctx.save();
    
    // 移动到光源位置并旋转
    this.ctx.translate(startX, startY);
    this.ctx.rotate(direction);
    
    // 创建聚光灯路径
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(0, 0, radius, -angle, angle);
    this.ctx.closePath();
    
    // 填充聚光灯
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // 恢复上下文状态
    this.ctx.restore();
    
    // 渲染阴影
    this.renderShadows({
      type: 'spot',
      direction,
      angle,
      falloff
    }, pos, color, intensity);
  }
  
  /**
   * 渲染平行光效果
   */
  renderDirectionalLight(direction, color, intensity) {
    // 计算光线方向向量
    const dirX = Math.cos(direction);
    const dirY = Math.sin(direction);
    
    // 创建线性渐变
    const gradient = this.ctx.createLinearGradient(
      this.width / 2 - dirX * this.width,
      this.height / 2 - dirY * this.height,
      this.width / 2 + dirX * this.width,
      this.height / 2 + dirY * this.height
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    // 填充整个画布
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 渲染平行光阴影
    this.renderDirectionalShadows(direction, color, intensity);
  }
  
  /**
   * 渲染阴影
   */
  renderShadows(light, pos, color, intensity) {
    // 设置合成模式为目标外
    this.ctx.globalCompositeOperation = 'destination-out';
    
    // 遍历所有物体
    this.lightEngine.objects.forEach(object => {
      if (!object.castShadow) return;
      
      // 计算物体不透明度
      const opacity = object.opacity * this.lightEngine.params.objectOpacity;
      
      // 设置阴影模糊度
      this.ctx.shadowBlur = this.params.shadowBlur * this.lightEngine.params.shadowSoftness;
      this.ctx.shadowColor = 'black';
      
      // 根据光源类型计算阴影
      if (light.type === 'point') {
        this.renderPointLightShadow(object, pos, opacity);
      } else if (light.type === 'spot') {
        this.renderSpotLightShadow(object, pos, light.direction, light.angle, opacity);
      }
      
      // 重置阴影设置
      this.ctx.shadowBlur = 0;
    });
    
    // 恢复默认合成模式
    this.ctx.globalCompositeOperation = 'lighter';
  }
  
  /**
   * 渲染点光源阴影
   */
  renderPointLightShadow(object, lightPos, opacity) {
    // 根据物体类型计算阴影
    switch (object.type) {
      case 'rectangle':
        this.renderRectangleShadow(object, lightPos, opacity);
        break;
      case 'circle':
        this.renderCircleShadow(object, lightPos, opacity);
        break;
      case 'triangle':
      case 'custom':
        this.renderPolygonShadow(object, lightPos, opacity);
        break;
    }
  }
  
  /**
   * 渲染聚光灯阴影
   */
  renderSpotLightShadow(object, lightPos, direction, angle, opacity) {
    // 检查物体是否在聚光灯范围内
    if (!this.isObjectInSpotLight(object, lightPos, direction, angle)) {
      return;
    }
    
    // 渲染阴影（与点光源类似，但考虑聚光灯角度）
    this.renderPointLightShadow(object, lightPos, opacity);
  }
  
  /**
   * 检查物体是否在聚光灯范围内
   */
  isObjectInSpotLight(object, lightPos, direction, angle) {
    // 获取物体中心点
    let centerX, centerY;
    
    switch (object.type) {
      case 'rectangle':
        centerX = object.x;
        centerY = object.y;
        break;
      case 'circle':
        centerX = object.x;
        centerY = object.y;
        break;
      case 'triangle':
      case 'custom':
        // 计算多边形中心
        let sumX = 0, sumY = 0;
        object.points.forEach(point => {
          sumX += object.x + point.x;
          sumY += object.y + point.y;
        });
        centerX = sumX / object.points.length;
        centerY = sumY / object.points.length;
        break;
      default:
        return false;
    }
    
    // 计算物体相对于光源的角度
    const dx = centerX - lightPos.x;
    const dy = centerY - lightPos.y;
    const objectAngle = Math.atan2(dy, dx);
    
    // 计算角度差（考虑循环）
    let angleDiff = Math.abs(objectAngle - direction);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    
    // 检查物体是否在聚光灯角度范围内
    return angleDiff <= angle;
  }
  
  /**
   * 渲染平行光阴影
   */
  renderDirectionalShadows(direction, color, intensity) {
    // 设置合成模式为目标外
    this.ctx.globalCompositeOperation = 'destination-out';
    
    // 计算光线方向向量
    const dirX = Math.cos(direction);
    const dirY = Math.sin(direction);
    
    // 计算阴影投射距离
    const shadowLength = Math.max(this.width, this.height);
    
    // 遍历所有物体
    this.lightEngine.objects.forEach(object => {
      if (!object.castShadow) return;
      
      // 计算物体不透明度
      const opacity = object.opacity * this.lightEngine.params.objectOpacity;
      
      // 设置阴影模糊度
      this.ctx.shadowBlur = this.params.shadowBlur * this.lightEngine.params.shadowSoftness;
      this.ctx.shadowColor = 'black';
      this.ctx.shadowOffsetX = dirX * shadowLength;
      this.ctx.shadowOffsetY = dirY * shadowLength;
      
      // 绘制物体形状作为阴影
      this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      this.drawObjectShape(object);
      
      // 重置阴影设置
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    });
    
    // 恢复默认合成模式
    this.ctx.globalCompositeOperation = 'lighter';
  }
  
  /**
   * 渲染矩形阴影
   */
  renderRectangleShadow(rect, lightPos, opacity) {
    // 计算矩形的四个角点
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    
    const corners = [
      { x: rect.x - halfWidth, y: rect.y - halfHeight },
      { x: rect.x + halfWidth, y: rect.y - halfHeight },
      { x: rect.x + halfWidth, y: rect.y + halfHeight },
      { x: rect.x - halfWidth, y: rect.y + halfHeight }
    ];
    
    // 计算阴影多边形
    const shadowPoints = this.calculateShadowPolygon(corners, lightPos);
    
    // 绘制阴影
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    this.ctx.beginPath();
    
    // 绘制矩形
    this.ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      this.ctx.lineTo(corners[i].x, corners[i].y);
    }
    this.ctx.closePath();
    
    // 绘制阴影多边形
    this.ctx.moveTo(shadowPoints[0].x, shadowPoints[0].y);
    for (let i = 1; i < shadowPoints.length; i++) {
      this.ctx.lineTo(shadowPoints[i].x, shadowPoints[i].y);
    }
    this.ctx.closePath();
    
    this.ctx.fill();
  }
  
  /**
   * 渲染圆形阴影
   */
  renderCircleShadow(circle, lightPos, opacity) {
    // 计算光源到圆心的方向
    const dx = circle.x - lightPos.x;
    const dy = circle.y - lightPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果光源在圆内，不产生阴影
    if (distance < circle.radius) return;
    
    // 归一化方向向量
    const nx = dx / distance;
    const ny = dy / distance;
    
    // 计算圆上的切点
    const angle = Math.asin(circle.radius / distance);
    const tangentAngle1 = Math.atan2(dy, dx) + angle;
    const tangentAngle2 = Math.atan2(dy, dx) - angle;
    
    // 计算切点坐标
    const tangent1 = {
      x: circle.x - Math.cos(tangentAngle1) * circle.radius,
      y: circle.y - Math.sin(tangentAngle1) * circle.radius
    };
    
    const tangent2 = {
      x: circle.x - Math.cos(tangentAngle2) * circle.radius,
      y: circle.y - Math.sin(tangentAngle2) * circle.radius
    };
    
    // 计算阴影终点
    const shadowLength = Math.max(this.width, this.height) * 2;
    const shadow1 = {
      x: tangent1.x + nx * shadowLength,
      y: tangent1.y + ny * shadowLength
    };
    
    const shadow2 = {
      x: tangent2.x + nx * shadowLength,
      y: tangent2.y + ny * shadowLength
    };
    
    // 绘制阴影
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    this.ctx.beginPath();
    
    // 绘制圆形
    this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    
    // 绘制阴影多边形
    this.ctx.moveTo(tangent1.x, tangent1.y);
    this.ctx.lineTo(shadow1.x, shadow1.y);
    this.ctx.lineTo(shadow2.x, shadow2.y);
    this.ctx.lineTo(tangent2.x, tangent2.y);
    
    this.ctx.fill();
  }
  
  /**
   * 渲染多边形阴影
   */
  renderPolygonShadow(polygon, lightPos, opacity) {
    // 获取多边形的点
    const points = polygon.points.map(point => ({
      x: polygon.x + point.x,
      y: polygon.y + point.y
    }));
    
    // 计算阴影多边形
    const shadowPoints = this.calculateShadowPolygon(points, lightPos);
    
    // 绘制阴影
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    this.ctx.beginPath();
    
    // 绘制多边形
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();
    
    // 绘制阴影多边形
    this.ctx.moveTo(shadowPoints[0].x, shadowPoints[0].y);
    for (let i = 1; i < shadowPoints.length; i++) {
      this.ctx.lineTo(shadowPoints[i].x, shadowPoints[i].y);
    }
    this.ctx.closePath();
    
    this.ctx.fill();
  }
  
  /**
   * 计算阴影多边形
   */
  calculateShadowPolygon(points, lightPos) {
    // 找出可见点和不可见点
    const visiblePoints = [];
    const shadowPoints = [];
    
    // 计算每个点相对于光源的角度
    const angles = points.map(point => Math.atan2(point.y - lightPos.y, point.x - lightPos.x));
    
    // 找出最大和最小角度的点
    let minAngleIndex = 0;
    let maxAngleIndex = 0;
    
    for (let i = 1; i < angles.length; i++) {
      if (angles[i] < angles[minAngleIndex]) minAngleIndex = i;
      if (angles[i] > angles[maxAngleIndex]) maxAngleIndex = i;
    }
    
    // 计算阴影长度
    const shadowLength = Math.max(this.width, this.height) * 2;
    
    // 为每个点计算阴影点
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      // 计算从光源到点的方向向量
      const dx = point.x - lightPos.x;
      const dy = point.y - lightPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 归一化方向向量
      const nx = dx / distance;
      const ny = dy / distance;
      
      // 计算阴影点
      shadowPoints.push({
        x: point.x + nx * shadowLength,
        y: point.y + ny * shadowLength
      });
    }
    
    // 构建阴影多边形
    const result = [];
    
    // 从最小角度点开始，按顺序添加点
    let currentIndex = minAngleIndex;
    do {
      result.push(points[currentIndex]);
      currentIndex = (currentIndex + 1) % points.length;
    } while (currentIndex !== (maxAngleIndex + 1) % points.length);
    
    // 添加阴影点，从最大角度点开始，逆序添加
    currentIndex = maxAngleIndex;
    do {
      result.push(shadowPoints[currentIndex]);
      currentIndex = (currentIndex - 1 + points.length) % points.length;
    } while (currentIndex !== (minAngleIndex - 1 + points.length) % points.length);
    
    return result;
  }
  
  /**
   * 渲染物体轮廓
   */
  renderObjectOutlines() {
    // 遍历所有物体
    this.lightEngine.objects.forEach(object => {
      // 设置描边样式
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.lineWidth = 1;
      
      // 根据物体类型绘制轮廓
      switch (object.type) {
        case 'rectangle':
          this.ctx.strokeRect(
            object.x - object.width / 2,
            object.y - object.height / 2,
            object.width,
            object.height
          );
          break;
        
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2);
          this.ctx.stroke();
          break;
        
        case 'triangle':
        case 'custom':
          if (!object.points || object.points.length < 2) break;
          
          this.ctx.beginPath();
          this.ctx.moveTo(
            object.x + object.points[0].x,
            object.y + object.points[0].y
          );
          
          for (let i = 1; i < object.points.length; i++) {
            this.ctx.lineTo(
              object.x + object.points[i].x,
              object.y + object.points[i].y
            );
          }
          
          this.ctx.closePath();
          this.ctx.stroke();
          break;
      }
    });
  }
  
  /**
   * 绘制物体形状
   * @param {Object} object - 物体对象
   */
  drawObjectShape(object) {
    switch (object.type) {
      case 'rectangle':
        this.ctx.fillRect(
          object.x - object.width / 2,
          object.y - object.height / 2,
          object.width,
          object.height
        );
        break;
      
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      
      case 'triangle':
      case 'custom':
        if (!object.points || object.points.length < 2) break;
        
        this.ctx.beginPath();
        this.ctx.moveTo(
          object.x + object.points[0].x,
          object.y + object.points[0].y
        );
        
        for (let i = 1; i < object.points.length; i++) {
          this.ctx.lineTo(
            object.x + object.points[i].x,
            object.y + object.points[i].y
          );
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }
  }
  
  /**
   * 解析颜色字符串为RGB对象
   * @param {string} color - 颜色字符串
   * @returns {Object} 包含r、g、b值的对象
   */
  parseColor(color) {
    // 创建临时元素来解析颜色
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computedColor = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    
    // 解析RGB值
    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    
    // 默认返回白色
    return { r: 255, g: 255, b: 255 };
  }
  
  /**
   * 保存画布为图像
   * @returns {string} 图像的Data URL
   */
  saveAsImage() {
    return this.canvas.toDataURL('image/png');
  }
}
