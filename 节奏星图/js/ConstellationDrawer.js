/**
 * 星座绘制器
 * 负责创建和管理星座连接
 */
class ConstellationDrawer {
  /**
   * 创建星座绘制器
   * @param {StarField} starField - 星空场景
   * @param {Object} options - 配置选项
   */
  constructor(starField, options = {}) {
    this.starField = starField;
    
    // 配置参数
    this.params = {
      maxDistance: options.maxDistance || 0.3,
      lineWidth: options.lineWidth || 1,
      lineOpacity: options.lineOpacity || 0.7,
      autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
      connectNearest: options.connectNearest !== undefined ? options.connectNearest : true,
      maxConnections: options.maxConnections || 3,
      pulseEnabled: options.pulseEnabled !== undefined ? options.pulseEnabled : true,
      pulseSpeed: options.pulseSpeed || 1,
      animationDuration: options.animationDuration || 1
    };
    
    // 星座模板
    this.constellationTemplates = {
      // 大熊座
      ursaMajor: [
        { x: 0.2, y: 0.3 },
        { x: 0.25, y: 0.35 },
        { x: 0.3, y: 0.4 },
        { x: 0.35, y: 0.45 },
        { x: 0.4, y: 0.5 },
        { x: 0.45, y: 0.45 },
        { x: 0.5, y: 0.5 }
      ],
      // 猎户座
      orion: [
        { x: 0.5, y: 0.2 },
        { x: 0.55, y: 0.25 },
        { x: 0.5, y: 0.3 },
        { x: 0.45, y: 0.25 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.4 },
        { x: 0.45, y: 0.5 },
        { x: 0.55, y: 0.5 }
      ],
      // 天琴座
      lyra: [
        { x: 0.7, y: 0.3 },
        { x: 0.75, y: 0.35 },
        { x: 0.8, y: 0.4 },
        { x: 0.75, y: 0.45 },
        { x: 0.7, y: 0.4 },
        { x: 0.75, y: 0.35 }
      ],
      // 天鹅座
      cygnus: [
        { x: 0.3, y: 0.7 },
        { x: 0.4, y: 0.6 },
        { x: 0.5, y: 0.5 },
        { x: 0.6, y: 0.6 },
        { x: 0.7, y: 0.7 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.8 }
      ]
    };
    
    // 连接历史
    this.connectionHistory = [];
  }
  
  /**
   * 设置自动连接
   * @param {boolean} enabled - 是否启用
   */
  setAutoConnect(enabled) {
    this.params.autoConnect = enabled;
  }
  
  /**
   * 设置最大连接距离
   * @param {number} distance - 距离 (0-1)
   */
  setMaxDistance(distance) {
    this.params.maxDistance = distance;
  }
  
  /**
   * 设置线条宽度
   * @param {number} width - 宽度
   */
  setLineWidth(width) {
    this.params.lineWidth = width;
  }
  
  /**
   * 设置线条不透明度
   * @param {number} opacity - 不透明度 (0-1)
   */
  setLineOpacity(opacity) {
    this.params.lineOpacity = opacity;
  }
  
  /**
   * 设置脉冲效果
   * @param {boolean} enabled - 是否启用
   * @param {number} speed - 速度
   */
  setPulse(enabled, speed = 1) {
    this.params.pulseEnabled = enabled;
    this.params.pulseSpeed = speed;
  }
  
  /**
   * 添加星点
   * @param {number} x - x坐标 (0-1)
   * @param {number} y - y坐标 (0-1)
   * @param {Object} options - 星点选项
   * @returns {Object} 创建的星点
   */
  addStar(x, y, options = {}) {
    const star = this.starField.addUserStar(x, y, options);
    
    // 如果启用了自动连接，尝试连接到其他星点
    if (this.params.autoConnect) {
      this.connectToNearestStars(star);
    }
    
    return star;
  }
  
  /**
   * 连接到最近的星点
   * @param {Object} star - 星点对象
   * @returns {Array} 创建的连接数组
   */
  connectToNearestStars(star) {
    if (!star) return [];
    
    // 获取同一层的其他星点
    const layerStars = this.starField.getLayerStars(star.layerId).filter(s => s.id !== star.id);
    
    if (layerStars.length === 0) return [];
    
    // 计算到其他星点的距离
    const starsWithDistance = layerStars.map(s => ({
      star: s,
      distance: Math.sqrt(Math.pow(s.x - star.x, 2) + Math.pow(s.y - star.y, 2))
    }));
    
    // 按距离排序
    starsWithDistance.sort((a, b) => a.distance - b.distance);
    
    const connections = [];
    
    // 连接到最近的星点
    if (this.params.connectNearest) {
      // 限制连接数量
      const connectCount = Math.min(this.params.maxConnections, starsWithDistance.length);
      
      for (let i = 0; i < connectCount; i++) {
        const { star: targetStar, distance } = starsWithDistance[i];
        
        // 检查距离是否在范围内
        if (distance <= this.params.maxDistance) {
          // 创建连接
          const connection = this.starField.addConstellation(star.id, targetStar.id, {
            color: star.color,
            width: this.params.lineWidth,
            opacity: this.params.lineOpacity,
            pulse: this.params.pulseEnabled,
            pulseSpeed: this.params.pulseSpeed,
            layerId: star.layerId
          });
          
          if (connection) {
            connections.push(connection);
            
            // 记录连接历史
            this.connectionHistory.push({
              sourceId: star.id,
              targetId: targetStar.id,
              time: Date.now()
            });
          }
        }
      }
    }
    
    return connections;
  }
  
  /**
   * 手动连接星点
   * @param {string} sourceId - 源星点ID
   * @param {string} targetId - 目标星点ID
   * @param {Object} options - 连接选项
   * @returns {Object} 创建的连接
   */
  connectStars(sourceId, targetId, options = {}) {
    // 查找星点
    const sourceStar = this.starField.userStars.find(s => s.id === sourceId);
    const targetStar = this.starField.userStars.find(s => s.id === targetId);
    
    if (!sourceStar || !targetStar) return null;
    
    // 计算距离
    const distance = Math.sqrt(
      Math.pow(sourceStar.x - targetStar.x, 2) +
      Math.pow(sourceStar.y - targetStar.y, 2)
    );
    
    // 检查距离是否在范围内
    if (distance > this.params.maxDistance) return null;
    
    // 创建连接
    const connection = this.starField.addConstellation(sourceId, targetId, {
      color: options.color || sourceStar.color,
      width: options.width || this.params.lineWidth,
      opacity: options.opacity || this.params.lineOpacity,
      pulse: options.pulse !== undefined ? options.pulse : this.params.pulseEnabled,
      pulseSpeed: options.pulseSpeed || this.params.pulseSpeed,
      layerId: sourceStar.layerId
    });
    
    if (connection) {
      // 记录连接历史
      this.connectionHistory.push({
        sourceId,
        targetId,
        time: Date.now()
      });
    }
    
    return connection;
  }
  
  /**
   * 移除连接
   * @param {string} connectionId - 连接ID
   * @returns {boolean} 是否成功移除
   */
  removeConnection(connectionId) {
    return this.starField.removeConstellation(connectionId);
  }
  
  /**
   * 移除星点
   * @param {string} starId - 星点ID
   * @returns {boolean} 是否成功移除
   */
  removeStar(starId) {
    return this.starField.removeUserStar(starId);
  }
  
  /**
   * 清除所有星点和连接
   */
  clearAll() {
    this.starField.clearUserStars();
    this.connectionHistory = [];
  }
  
  /**
   * 清除指定层的星点和连接
   * @param {number} layerId - 层ID
   */
  clearLayer(layerId) {
    this.starField.clearLayerStars(layerId);
    
    // 清除相关的连接历史
    this.connectionHistory = this.connectionHistory.filter(c => {
      const sourceStar = this.starField.userStars.find(s => s.id === c.sourceId);
      return sourceStar && sourceStar.layerId !== layerId;
    });
  }
  
  /**
   * 创建星座模板
   * @param {string} templateName - 模板名称
   * @param {number} x - 中心x坐标 (0-1)
   * @param {number} y - 中心y坐标 (0-1)
   * @param {number} scale - 缩放比例
   * @param {Object} options - 星点和连接选项
   * @returns {Array} 创建的星点数组
   */
  createConstellationTemplate(templateName, x, y, scale = 1, options = {}) {
    const template = this.constellationTemplates[templateName];
    if (!template) return [];
    
    // 计算模板中心
    let centerX = 0;
    let centerY = 0;
    
    for (const point of template) {
      centerX += point.x;
      centerY += point.y;
    }
    
    centerX /= template.length;
    centerY /= template.length;
    
    // 创建星点
    const stars = [];
    
    for (const point of template) {
      // 计算相对于中心的偏移
      const offsetX = (point.x - centerX) * scale;
      const offsetY = (point.y - centerY) * scale;
      
      // 计算最终位置
      const starX = x + offsetX;
      const starY = y + offsetY;
      
      // 确保在画布范围内
      if (starX < 0 || starX > 1 || starY < 0 || starY > 1) continue;
      
      // 创建星点
      const star = this.addStar(starX, starY, {
        size: options.size || random(3, 5),
        color: options.color || '#ffffff',
        pulse: options.pulse !== undefined ? options.pulse : true,
        layerId: options.layerId || 0
      });
      
      if (star) {
        stars.push(star);
      }
    }
    
    // 连接星点
    if (stars.length > 1 && options.connect !== false) {
      for (let i = 0; i < stars.length - 1; i++) {
        this.connectStars(stars[i].id, stars[i + 1].id, options);
      }
      
      // 可选：连接首尾
      if (options.closed && stars.length > 2) {
        this.connectStars(stars[stars.length - 1].id, stars[0].id, options);
      }
    }
    
    return stars;
  }
  
  /**
   * 创建随机星座
   * @param {number} starCount - 星点数量
   * @param {number} x - 中心x坐标 (0-1)
   * @param {number} y - 中心y坐标 (0-1)
   * @param {number} radius - 半径 (0-1)
   * @param {Object} options - 星点和连接选项
   * @returns {Array} 创建的星点数组
   */
  createRandomConstellation(starCount, x, y, radius = 0.2, options = {}) {
    const stars = [];
    
    // 创建星点
    for (let i = 0; i < starCount; i++) {
      // 随机角度和距离
      const angle = random(0, Math.PI * 2);
      const distance = random(0, radius);
      
      // 计算位置
      const starX = x + Math.cos(angle) * distance;
      const starY = y + Math.sin(angle) * distance;
      
      // 确保在画布范围内
      if (starX < 0 || starX > 1 || starY < 0 || starY > 1) continue;
      
      // 创建星点
      const star = this.addStar(starX, starY, {
        size: options.size || random(3, 5),
        color: options.color || '#ffffff',
        pulse: options.pulse !== undefined ? options.pulse : true,
        layerId: options.layerId || 0
      });
      
      if (star) {
        stars.push(star);
      }
    }
    
    // 连接星点
    if (stars.length > 1 && options.connect !== false) {
      // 创建最小生成树连接
      this.createMinimumSpanningTree(stars, options);
      
      // 可选：添加额外连接
      if (options.extraConnections) {
        const extraCount = Math.min(options.extraConnections, stars.length);
        
        for (let i = 0; i < extraCount; i++) {
          const sourceIndex = randomInt(0, stars.length - 1);
          let targetIndex;
          
          do {
            targetIndex = randomInt(0, stars.length - 1);
          } while (targetIndex === sourceIndex);
          
          this.connectStars(stars[sourceIndex].id, stars[targetIndex].id, options);
        }
      }
    }
    
    return stars;
  }
  
  /**
   * 创建最小生成树连接
   * @param {Array} stars - 星点数组
   * @param {Object} options - 连接选项
   */
  createMinimumSpanningTree(stars, options = {}) {
    if (stars.length < 2) return;
    
    // 计算所有可能的边
    const edges = [];
    
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const star1 = stars[i];
        const star2 = stars[j];
        
        const distance = Math.sqrt(
          Math.pow(star1.x - star2.x, 2) +
          Math.pow(star1.y - star2.y, 2)
        );
        
        edges.push({
          source: star1,
          target: star2,
          distance
        });
      }
    }
    
    // 按距离排序
    edges.sort((a, b) => a.distance - b.distance);
    
    // 使用Kruskal算法创建最小生成树
    const parent = {};
    const rank = {};
    
    // 初始化并查集
    for (const star of stars) {
      parent[star.id] = star.id;
      rank[star.id] = 0;
    }
    
    // 查找函数
    const find = (id) => {
      if (parent[id] !== id) {
        parent[id] = find(parent[id]);
      }
      return parent[id];
    };
    
    // 合并函数
    const union = (id1, id2) => {
      const root1 = find(id1);
      const root2 = find(id2);
      
      if (root1 === root2) return;
      
      if (rank[root1] < rank[root2]) {
        parent[root1] = root2;
      } else if (rank[root1] > rank[root2]) {
        parent[root2] = root1;
      } else {
        parent[root2] = root1;
        rank[root1]++;
      }
    };
    
    // 创建最小生成树
    for (const edge of edges) {
      const sourceRoot = find(edge.source.id);
      const targetRoot = find(edge.target.id);
      
      if (sourceRoot !== targetRoot) {
        // 连接星点
        this.connectStars(edge.source.id, edge.target.id, options);
        
        // 合并集合
        union(edge.source.id, edge.target.id);
      }
    }
  }
  
  /**
   * 创建节奏星座
   * @param {Array} rhythmEvents - 节奏事件数组
   * @param {Object} options - 星点和连接选项
   * @returns {Array} 创建的星点数组
   */
  createRhythmConstellation(rhythmEvents, options = {}) {
    if (!rhythmEvents || rhythmEvents.length < 2) return [];
    
    const stars = [];
    
    // 创建星点
    for (const event of rhythmEvents) {
      const star = this.addStar(event.x, event.y, {
        size: options.size || random(3, 5),
        color: options.color || '#ffffff',
        pulse: options.pulse !== undefined ? options.pulse : true,
        layerId: options.layerId || event.layerId || 0
      });
      
      if (star) {
        // 存储事件ID
        star.eventId = event.id;
        stars.push(star);
      }
    }
    
    // 连接星点
    if (stars.length > 1 && options.connect !== false) {
      // 按时间顺序连接
      for (let i = 0; i < stars.length - 1; i++) {
        this.connectStars(stars[i].id, stars[i + 1].id, options);
      }
      
      // 可选：连接首尾
      if (options.closed && stars.length > 2) {
        this.connectStars(stars[stars.length - 1].id, stars[0].id, options);
      }
    }
    
    return stars;
  }
  
  /**
   * 分析连接模式
   * @returns {Object} 分析结果
   */
  analyzeConnectionPattern() {
    // 获取所有用户星点
    const stars = this.starField.userStars;
    
    if (stars.length < 3) {
      return {
        complexity: 0,
        symmetry: 0,
        density: 0,
        pattern: 'none'
      };
    }
    
    // 获取所有连接
    const connections = this.starField.constellations;
    
    // 计算连接密度
    const maxConnections = (stars.length * (stars.length - 1)) / 2;
    const density = connections.length / maxConnections;
    
    // 计算复杂度（基于连接交叉）
    let intersections = 0;
    
    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const conn1 = connections[i];
        const conn2 = connections[j];
        
        // 检查是否有共享端点
        if (
          conn1.sourceId === conn2.sourceId ||
          conn1.sourceId === conn2.targetId ||
          conn1.targetId === conn2.sourceId ||
          conn1.targetId === conn2.targetId
        ) {
          continue;
        }
        
        // 检查线段是否相交
        if (this.checkLineIntersection(
          conn1.sourceX, conn1.sourceY, conn1.targetX, conn1.targetY,
          conn2.sourceX, conn2.sourceY, conn2.targetX, conn2.targetY
        )) {
          intersections++;
        }
      }
    }
    
    const complexity = Math.min(intersections / connections.length, 1);
    
    // 计算对称性
    // 简化：使用星点分布的方差作为对称性度量
    const centerX = stars.reduce((sum, star) => sum + star.x, 0) / stars.length;
    const centerY = stars.reduce((sum, star) => sum + star.y, 0) / stars.length;
    
    const distances = stars.map(star => 
      Math.sqrt(Math.pow(star.x - centerX, 2) + Math.pow(star.y - centerY, 2))
    );
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const symmetry = 1 - Math.min(variance * 10, 1); // 方差越小，对称性越高
    
    // 确定模式类型
    let pattern = 'random';
    
    if (symmetry > 0.7) {
      pattern = 'symmetric';
    } else if (complexity > 0.5) {
      pattern = 'complex';
    } else if (density < 0.3) {
      pattern = 'sparse';
    } else if (density > 0.7) {
      pattern = 'dense';
    }
    
    return {
      complexity,
      symmetry,
      density,
      pattern
    };
  }
  
  /**
   * 检查两条线段是否相交
   * @param {number} x1 - 第一条线段起点x
   * @param {number} y1 - 第一条线段起点y
   * @param {number} x2 - 第一条线段终点x
   * @param {number} y2 - 第一条线段终点y
   * @param {number} x3 - 第二条线段起点x
   * @param {number} y3 - 第二条线段起点y
   * @param {number} x4 - 第二条线段终点x
   * @param {number} y4 - 第二条线段终点y
   * @returns {boolean} 是否相交
   */
  checkLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    // 计算方向
    const d1 = this.direction(x3, y3, x4, y4, x1, y1);
    const d2 = this.direction(x3, y3, x4, y4, x2, y2);
    const d3 = this.direction(x1, y1, x2, y2, x3, y3);
    const d4 = this.direction(x1, y1, x2, y2, x4, y4);
    
    // 检查是否相交
    return (
      ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
    ) || (
      d1 === 0 && this.onSegment(x3, y3, x4, y4, x1, y1) ||
      d2 === 0 && this.onSegment(x3, y3, x4, y4, x2, y2) ||
      d3 === 0 && this.onSegment(x1, y1, x2, y2, x3, y3) ||
      d4 === 0 && this.onSegment(x1, y1, x2, y2, x4, y4)
    );
  }
  
  /**
   * 计算方向
   * @param {number} x1 - 点1 x
   * @param {number} y1 - 点1 y
   * @param {number} x2 - 点2 x
   * @param {number} y2 - 点2 y
   * @param {number} x3 - 点3 x
   * @param {number} y3 - 点3 y
   * @returns {number} 方向值
   */
  direction(x1, y1, x2, y2, x3, y3) {
    return (x3 - x1) * (y2 - y1) - (x2 - x1) * (y3 - y1);
  }
  
  /**
   * 检查点是否在线段上
   * @param {number} x1 - 线段起点x
   * @param {number} y1 - 线段起点y
   * @param {number} x2 - 线段终点x
   * @param {number} y2 - 线段终点y
   * @param {number} x - 点x
   * @param {number} y - 点y
   * @returns {boolean} 是否在线段上
   */
  onSegment(x1, y1, x2, y2, x, y) {
    return (
      x >= Math.min(x1, x2) &&
      x <= Math.max(x1, x2) &&
      y >= Math.min(y1, y2) &&
      y <= Math.max(y1, y2)
    );
  }
}
