/**
 * 织物物理引擎
 * 负责模拟织物的物理行为
 */
class FabricPhysics {
  constructor() {
    // 物理参数
    this.params = {
      gravity: 0.5,      // 重力强度
      stiffness: 0.3,    // 织物硬度
      damping: 0.2,      // 阻尼系数
      mass: 0.4,         // 织物质量
      resolution: 20,    // 网格精度
      iterations: 5      // 约束求解迭代次数
    };
    
    // 织物类型参数
    this.fabricTypes = {
      silk: {
        stiffness: 0.2,
        damping: 0.1,
        mass: 0.2,
        stretchFactor: 1.2
      },
      cotton: {
        stiffness: 0.4,
        damping: 0.3,
        mass: 0.5,
        stretchFactor: 0.9
      },
      wool: {
        stiffness: 0.6,
        damping: 0.4,
        mass: 0.7,
        stretchFactor: 0.7
      },
      denim: {
        stiffness: 0.8,
        damping: 0.5,
        mass: 0.9,
        stretchFactor: 0.5
      }
    };
    
    // 当前织物类型
    this.currentFabricType = 'silk';
    
    // 织物网格
    this.points = [];        // 点数组
    this.constraints = [];   // 约束数组
    this.triangles = [];     // 三角形数组（用于渲染）
    
    // 固定点
    this.pinnedPoints = [];
    
    // 交互状态
    this.draggedPoint = null;
    this.cutMode = false;
    this.windMode = false;
    this.windDirection = { x: 0, y: 0 };
    this.windStrength = 0;
    this.windTime = 0;
    
    // 初始化
    this.reset();
  }
  
  /**
   * 重置织物
   */
  reset() {
    // 清空数组
    this.points = [];
    this.constraints = [];
    this.triangles = [];
    this.pinnedPoints = [];
    
    // 创建织物网格
    this.createFabricMesh();
  }
  
  /**
   * 创建织物网格
   */
  createFabricMesh() {
    const width = window.innerWidth * 0.6;
    const height = window.innerHeight * 0.6;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const cols = this.params.resolution;
    const rows = Math.floor(cols * (height / width));
    
    const spacing = width / cols;
    
    // 创建点
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = centerX - width / 2 + x * spacing;
        const py = centerY - height / 2 + y * spacing;
        
        this.points.push({
          x: px,
          y: py,
          oldX: px,
          oldY: py,
          vx: 0,
          vy: 0,
          mass: this.params.mass,
          pinned: false,
          index: y * cols + x
        });
      }
    }
    
    // 创建约束（水平和垂直）
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        
        // 右侧约束
        if (x < cols - 1) {
          const j = y * cols + (x + 1);
          this.constraints.push({
            p1: this.points[i],
            p2: this.points[j],
            length: spacing,
            type: 'structural'
          });
        }
        
        // 下方约束
        if (y < rows - 1) {
          const j = (y + 1) * cols + x;
          this.constraints.push({
            p1: this.points[i],
            p2: this.points[j],
            length: spacing,
            type: 'structural'
          });
        }
        
        // 对角线约束（增加稳定性）
        if (x < cols - 1 && y < rows - 1) {
          const j = (y + 1) * cols + (x + 1);
          this.constraints.push({
            p1: this.points[i],
            p2: this.points[j],
            length: spacing * Math.sqrt(2),
            type: 'shear'
          });
          
          const j2 = (y + 1) * cols + x;
          const i2 = y * cols + (x + 1);
          this.constraints.push({
            p1: this.points[i2],
            p2: this.points[j2],
            length: spacing * Math.sqrt(2),
            type: 'shear'
          });
        }
      }
    }
    
    // 创建三角形（用于渲染）
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i1 = y * cols + x;
        const i2 = y * cols + (x + 1);
        const i3 = (y + 1) * cols + x;
        const i4 = (y + 1) * cols + (x + 1);
        
        this.triangles.push([i1, i2, i3]);
        this.triangles.push([i2, i4, i3]);
      }
    }
    
    // 固定顶部两个角
    this.pinPoint(0);
    this.pinPoint(cols - 1);
  }
  
  /**
   * 更新织物类型
   * @param {string} type - 织物类型
   */
  setFabricType(type) {
    if (!this.fabricTypes[type]) return;
    
    this.currentFabricType = type;
    
    // 更新物理参数
    const fabricParams = this.fabricTypes[type];
    this.params.stiffness = fabricParams.stiffness;
    this.params.damping = fabricParams.damping;
    this.params.mass = fabricParams.mass;
    
    // 更新所有点的质量
    for (const point of this.points) {
      point.mass = this.params.mass;
    }
    
    // 更新约束长度
    for (const constraint of this.constraints) {
      if (constraint.originalLength === undefined) {
        constraint.originalLength = constraint.length;
      }
      
      // 根据织物类型调整约束长度（影响弹性）
      constraint.length = constraint.originalLength * fabricParams.stretchFactor;
    }
  }
  
  /**
   * 更新物理参数
   * @param {Object} params - 物理参数
   */
  updateParams(params) {
    // 更新参数
    if (params.gravity !== undefined) this.params.gravity = params.gravity;
    if (params.stiffness !== undefined) this.params.stiffness = params.stiffness;
    if (params.damping !== undefined) this.params.damping = params.damping;
    if (params.mass !== undefined) {
      this.params.mass = params.mass;
      // 更新所有点的质量
      for (const point of this.points) {
        point.mass = this.params.mass;
      }
    }
    
    // 如果分辨率改变，需要重新创建网格
    if (params.resolution !== undefined && params.resolution !== this.params.resolution) {
      this.params.resolution = params.resolution;
      this.reset();
    }
    
    if (params.iterations !== undefined) this.params.iterations = params.iterations;
  }
  
  /**
   * 固定点
   * @param {number} index - 点的索引
   */
  pinPoint(index) {
    if (index >= 0 && index < this.points.length) {
      this.points[index].pinned = true;
      this.pinnedPoints.push(index);
    }
  }
  
  /**
   * 取消固定点
   * @param {number} index - 点的索引
   */
  unpinPoint(index) {
    if (index >= 0 && index < this.points.length) {
      this.points[index].pinned = false;
      const pinIndex = this.pinnedPoints.indexOf(index);
      if (pinIndex !== -1) {
        this.pinnedPoints.splice(pinIndex, 1);
      }
    }
  }
  
  /**
   * 切割织物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 切割半径
   */
  cut(x, y, radius) {
    // 找到切割区域内的约束
    const constraintsToRemove = [];
    
    for (let i = 0; i < this.constraints.length; i++) {
      const constraint = this.constraints[i];
      const p1 = constraint.p1;
      const p2 = constraint.p2;
      
      // 检查约束的中点是否在切割半径内
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      
      const dx = midX - x;
      const dy = midY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius) {
        constraintsToRemove.push(i);
      }
    }
    
    // 从后向前移除约束，避免索引问题
    for (let i = constraintsToRemove.length - 1; i >= 0; i--) {
      this.constraints.splice(constraintsToRemove[i], 1);
    }
    
    return constraintsToRemove.length > 0;
  }
  
  /**
   * 应用风力
   * @param {number} dirX - X方向分量
   * @param {number} dirY - Y方向分量
   * @param {number} strength - 风力强度
   */
  applyWind(dirX, dirY, strength) {
    this.windMode = true;
    this.windDirection.x = dirX;
    this.windDirection.y = dirY;
    this.windStrength = strength;
  }
  
  /**
   * 停止风力
   */
  stopWind() {
    this.windMode = false;
    this.windStrength = 0;
  }
  
  /**
   * 查找最近的点
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} maxDistance - 最大距离
   * @returns {Object|null} 最近的点或null
   */
  findNearestPoint(x, y, maxDistance = 50) {
    let nearestPoint = null;
    let minDistance = maxDistance;
    
    for (const point of this.points) {
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    
    return nearestPoint;
  }
  
  /**
   * 开始拖动点
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否成功开始拖动
   */
  startDragging(x, y) {
    const point = this.findNearestPoint(x, y);
    
    if (point) {
      this.draggedPoint = point;
      return true;
    }
    
    return false;
  }
  
  /**
   * 拖动到新位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  dragTo(x, y) {
    if (this.draggedPoint) {
      this.draggedPoint.x = x;
      this.draggedPoint.y = y;
      this.draggedPoint.oldX = x;
      this.draggedPoint.oldY = y;
      this.draggedPoint.vx = 0;
      this.draggedPoint.vy = 0;
    }
  }
  
  /**
   * 结束拖动
   */
  endDragging() {
    this.draggedPoint = null;
  }
  
  /**
   * 更新物理模拟
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 限制deltaTime，防止大时间步长导致不稳定
    const dt = Math.min(deltaTime, 1 / 30);
    
    // 更新风力
    if (this.windMode) {
      this.windTime += dt;
      // 风力随时间变化，增加自然感
      const windVariation = Math.sin(this.windTime * 2) * 0.3 + 0.7;
      
      // 对每个点应用风力
      for (const point of this.points) {
        if (!point.pinned) {
          // 计算风力
          const windForce = this.windStrength * windVariation;
          point.vx += this.windDirection.x * windForce * dt;
          point.vy += this.windDirection.y * windForce * dt;
        }
      }
    }
    
    // 更新所有点的位置
    for (const point of this.points) {
      if (!point.pinned) {
        // 保存当前位置
        const oldX = point.x;
        const oldY = point.y;
        
        // 计算速度（考虑阻尼）
        point.vx = (point.x - point.oldX) * (1 - this.params.damping);
        point.vy = (point.y - point.oldY) * (1 - this.params.damping);
        
        // 应用重力
        point.vy += this.params.gravity * point.mass;
        
        // 更新位置
        point.x += point.vx;
        point.y += point.vy;
        
        // 更新旧位置
        point.oldX = oldX;
        point.oldY = oldY;
      }
    }
    
    // 求解约束
    for (let i = 0; i < this.params.iterations; i++) {
      this.solveConstraints();
    }
  }
  
  /**
   * 求解约束
   */
  solveConstraints() {
    // 处理所有约束
    for (const constraint of this.constraints) {
      const p1 = constraint.p1;
      const p2 = constraint.p2;
      
      // 计算当前距离
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果距离为0，跳过（防止除以0）
      if (distance === 0) continue;
      
      // 计算差异
      const difference = (constraint.length - distance) / distance;
      
      // 计算校正量
      const stiffness = this.params.stiffness;
      const correctionX = dx * difference * stiffness;
      const correctionY = dy * difference * stiffness;
      
      // 应用校正（考虑质量）
      if (!p1.pinned && !p2.pinned) {
        // 两点都不固定，根据质量分配校正量
        const totalMass = p1.mass + p2.mass;
        const p1Ratio = p2.mass / totalMass;
        const p2Ratio = p1.mass / totalMass;
        
        p1.x -= correctionX * p1Ratio;
        p1.y -= correctionY * p1Ratio;
        p2.x += correctionX * p2Ratio;
        p2.y += correctionY * p2Ratio;
      } else if (!p1.pinned) {
        // 只有p2固定
        p1.x -= correctionX;
        p1.y -= correctionY;
      } else if (!p2.pinned) {
        // 只有p1固定
        p2.x += correctionX;
        p2.y += correctionY;
      }
    }
    
    // 处理边界约束（防止织物超出屏幕）
    const margin = 10;
    const width = window.innerWidth - margin;
    const height = window.innerHeight - margin;
    
    for (const point of this.points) {
      if (!point.pinned) {
        if (point.x < margin) point.x = margin;
        if (point.x > width) point.x = width;
        if (point.y < margin) point.y = margin;
        if (point.y > height) point.y = height;
      }
    }
  }
  
  /**
   * 获取织物网格数据
   * @returns {Object} 织物网格数据
   */
  getMeshData() {
    return {
      points: this.points,
      constraints: this.constraints,
      triangles: this.triangles,
      pinnedPoints: this.pinnedPoints
    };
  }
}
