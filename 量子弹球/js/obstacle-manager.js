/**
 * 障碍物管理器
 * 负责创建和管理游戏中的各种障碍物
 */
class ObstacleManager {
  constructor(engine, render) {
    this.engine = engine;
    this.render = render;
    
    // Matter.js模块
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.World = Matter.World;
    this.Composite = Matter.Composite;
    
    // 障碍物集合
    this.obstacles = {
      walls: [],
      bumpers: [],
      gravityWells: [],
      portals: []
    };
    
    // 边界墙
    this.boundaries = [];
    
    // 传送门配对
    this.portalPairs = [];
    
    // 创建边界
    this.createBoundaries();
    
    // 设置重力井效果
    this.setupGravityWellEffect();
    
    // 设置传送门效果
    this.setupPortalEffect();
  }

  /**
   * 创建边界墙
   */
  createBoundaries() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallThickness = 50;
    
    // 上边界
    const topWall = this.Bodies.rectangle(
      width / 2, -wallThickness / 2,
      width + wallThickness * 2, wallThickness,
      { isStatic: true, label: 'boundary' }
    );
    
    // 下边界
    const bottomWall = this.Bodies.rectangle(
      width / 2, height + wallThickness / 2,
      width + wallThickness * 2, wallThickness,
      { isStatic: true, label: 'boundary' }
    );
    
    // 左边界
    const leftWall = this.Bodies.rectangle(
      -wallThickness / 2, height / 2,
      wallThickness, height + wallThickness * 2,
      { isStatic: true, label: 'boundary' }
    );
    
    // 右边界
    const rightWall = this.Bodies.rectangle(
      width + wallThickness / 2, height / 2,
      wallThickness, height + wallThickness * 2,
      { isStatic: true, label: 'boundary' }
    );
    
    this.boundaries = [topWall, bottomWall, leftWall, rightWall];
    this.World.add(this.engine.world, this.boundaries);
  }

  /**
   * 更新边界位置（窗口大小改变时）
   */
  updateBoundaries() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallThickness = 50;
    
    // 更新上边界
    this.Body.setPosition(this.boundaries[0], {
      x: width / 2,
      y: -wallThickness / 2
    });
    this.Body.setVertices(this.boundaries[0], this.Bodies.rectangle(
      width / 2, -wallThickness / 2,
      width + wallThickness * 2, wallThickness
    ).vertices);
    
    // 更新下边界
    this.Body.setPosition(this.boundaries[1], {
      x: width / 2,
      y: height + wallThickness / 2
    });
    this.Body.setVertices(this.boundaries[1], this.Bodies.rectangle(
      width / 2, height + wallThickness / 2,
      width + wallThickness * 2, wallThickness
    ).vertices);
    
    // 更新左边界
    this.Body.setPosition(this.boundaries[2], {
      x: -wallThickness / 2,
      y: height / 2
    });
    this.Body.setVertices(this.boundaries[2], this.Bodies.rectangle(
      -wallThickness / 2, height / 2,
      wallThickness, height + wallThickness * 2
    ).vertices);
    
    // 更新右边界
    this.Body.setPosition(this.boundaries[3], {
      x: width + wallThickness / 2,
      y: height / 2
    });
    this.Body.setVertices(this.boundaries[3], this.Bodies.rectangle(
      width + wallThickness / 2, height / 2,
      wallThickness, height + wallThickness * 2
    ).vertices);
  }

  /**
   * 设置重力井效果
   */
  setupGravityWellEffect() {
    // 在每个引擎更新前应用重力井效果
    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      const gravityWells = this.obstacles.gravityWells;
      
      // 获取所有弹球
      const balls = this.engine.world.bodies.filter(body => body.label === 'ball');
      
      // 对每个重力井
      gravityWells.forEach(well => {
        const wellPos = well.position;
        const strength = well.gravityStrength || 0.5;
        const radius = well.circleRadius * 5; // 影响半径是视觉半径的5倍
        
        // 对每个弹球应用引力
        balls.forEach(ball => {
          const ballPos = ball.position;
          
          // 计算距离
          const dx = wellPos.x - ballPos.x;
          const dy = wellPos.y - ballPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果在影响范围内
          if (distance < radius) {
            // 计算引力大小（距离越近越强）
            const force = strength * (1 - distance / radius) * 0.001;
            
            // 应用引力
            this.Body.applyForce(ball, ballPos, {
              x: dx * force,
              y: dy * force
            });
          }
        });
      });
    });
  }

  /**
   * 设置传送门效果
   */
  setupPortalEffect() {
    // 在每个引擎更新后检查传送门
    Matter.Events.on(this.engine, 'afterUpdate', () => {
      // 对每对传送门
      this.portalPairs.forEach(pair => {
        const entrance = pair.entrance;
        const exit = pair.exit;
        
        if (!entrance || !exit) return;
        
        const entrancePos = entrance.position;
        const exitPos = exit.position;
        const radius = entrance.circleRadius;
        
        // 获取所有弹球
        const balls = this.engine.world.bodies.filter(body => body.label === 'ball');
        
        // 检查每个弹球是否进入传送门
        balls.forEach(ball => {
          // 如果球刚刚被传送，跳过检查
          if (ball.recentlyTeleported) return;
          
          const ballPos = ball.position;
          
          // 计算与入口传送门的距离
          const dx = entrancePos.x - ballPos.x;
          const dy = entrancePos.y - ballPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果球进入传送门
          if (distance < radius * 0.8) {
            // 计算球的速度
            const velocity = {
              x: ball.velocity.x,
              y: ball.velocity.y
            };
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            // 传送到出口传送门
            this.Body.setPosition(ball, {
              x: exitPos.x + (velocity.x / speed) * radius * 1.5,
              y: exitPos.y + (velocity.y / speed) * radius * 1.5
            });
            
            // 标记为刚刚传送，防止立即传送回去
            ball.recentlyTeleported = true;
            
            // 一段时间后清除标记
            setTimeout(() => {
              ball.recentlyTeleported = false;
            }, 1000);
          }
        });
      });
    });
  }

  /**
   * 创建墙壁
   * @param {Array} points - 墙壁的点数组 [{x, y}, ...]
   * @param {Object} options - 额外选项
   */
  createWall(points, options = {}) {
    if (points.length < 2) return null;
    
    const walls = [];
    
    // 创建每段墙
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // 计算墙段的中点和角度
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      
      // 创建墙体
      const wall = this.Bodies.rectangle(midX, midY, length, options.thickness || 10, {
        isStatic: true,
        angle: angle,
        label: 'wall',
        render: {
          fillStyle: options.color || '#6200ea'
        }
      });
      
      walls.push(wall);
      this.obstacles.walls.push(wall);
    }
    
    this.World.add(this.engine.world, walls);
    return walls;
  }

  /**
   * 创建弹射器
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
   */
  createBumper(x, y, options = {}) {
    const radius = options.radius || 30;
    
    const bumper = this.Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'bumper',
      restitution: 1.5, // 高弹性
      render: {
        fillStyle: options.color || '#ff4081'
      }
    });
    
    this.World.add(this.engine.world, bumper);
    this.obstacles.bumpers.push(bumper);
    
    return bumper;
  }

  /**
   * 创建重力井
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
   */
  createGravityWell(x, y, options = {}) {
    const radius = options.radius || 40;
    
    const well = this.Bodies.circle(x, y, radius, {
      isStatic: true,
      isSensor: true, // 不产生物理碰撞
      label: 'gravity',
      gravityStrength: options.strength || 0.5,
      render: {
        fillStyle: options.color || 'rgba(0, 176, 255, 0.3)',
        lineWidth: 2,
        strokeStyle: '#00b0ff'
      }
    });
    
    this.World.add(this.engine.world, well);
    this.obstacles.gravityWells.push(well);
    
    return well;
  }

  /**
   * 创建传送门对
   * @param {number} x1 - 入口X坐标
   * @param {number} y1 - 入口Y坐标
   * @param {number} x2 - 出口X坐标
   * @param {number} y2 - 出口Y坐标
   * @param {Object} options - 额外选项
   */
  createPortalPair(x1, y1, x2, y2, options = {}) {
    const radius = options.radius || 35;
    
    // 创建入口传送门
    const entrance = this.Bodies.circle(x1, y1, radius, {
      isStatic: true,
      isSensor: true,
      label: 'portal',
      render: {
        fillStyle: options.entranceColor || 'rgba(98, 0, 234, 0.3)',
        lineWidth: 2,
        strokeStyle: '#6200ea'
      }
    });
    
    // 创建出口传送门
    const exit = this.Bodies.circle(x2, y2, radius, {
      isStatic: true,
      isSensor: true,
      label: 'portal',
      render: {
        fillStyle: options.exitColor || 'rgba(255, 64, 129, 0.3)',
        lineWidth: 2,
        strokeStyle: '#ff4081'
      }
    });
    
    this.World.add(this.engine.world, [entrance, exit]);
    this.obstacles.portals.push(entrance, exit);
    
    // 记录传送门对
    const pair = { entrance, exit };
    this.portalPairs.push(pair);
    
    return pair;
  }

  /**
   * 移除障碍物
   * @param {Matter.Body} obstacle - 要移除的障碍物
   */
  removeObstacle(obstacle) {
    if (!obstacle) return;
    
    // 从世界中移除
    this.World.remove(this.engine.world, obstacle);
    
    // 从对应数组中移除
    if (obstacle.label === 'wall') {
      const index = this.obstacles.walls.indexOf(obstacle);
      if (index !== -1) this.obstacles.walls.splice(index, 1);
    } else if (obstacle.label === 'bumper') {
      const index = this.obstacles.bumpers.indexOf(obstacle);
      if (index !== -1) this.obstacles.bumpers.splice(index, 1);
    } else if (obstacle.label === 'gravity') {
      const index = this.obstacles.gravityWells.indexOf(obstacle);
      if (index !== -1) this.obstacles.gravityWells.splice(index, 1);
    } else if (obstacle.label === 'portal') {
      const index = this.obstacles.portals.indexOf(obstacle);
      if (index !== -1) {
        this.obstacles.portals.splice(index, 1);
        
        // 移除对应的传送门对
        for (let i = 0; i < this.portalPairs.length; i++) {
          const pair = this.portalPairs[i];
          if (pair.entrance === obstacle || pair.exit === obstacle) {
            // 如果另一个传送门还存在，也移除它
            if (pair.entrance === obstacle && pair.exit) {
              this.World.remove(this.engine.world, pair.exit);
              const exitIndex = this.obstacles.portals.indexOf(pair.exit);
              if (exitIndex !== -1) this.obstacles.portals.splice(exitIndex, 1);
            } else if (pair.exit === obstacle && pair.entrance) {
              this.World.remove(this.engine.world, pair.entrance);
              const entranceIndex = this.obstacles.portals.indexOf(pair.entrance);
              if (entranceIndex !== -1) this.obstacles.portals.splice(entranceIndex, 1);
            }
            
            this.portalPairs.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  /**
   * 移除所有障碍物
   */
  removeAllObstacles() {
    // 移除所有墙壁
    this.obstacles.walls.forEach(wall => {
      this.World.remove(this.engine.world, wall);
    });
    this.obstacles.walls = [];
    
    // 移除所有弹射器
    this.obstacles.bumpers.forEach(bumper => {
      this.World.remove(this.engine.world, bumper);
    });
    this.obstacles.bumpers = [];
    
    // 移除所有重力井
    this.obstacles.gravityWells.forEach(well => {
      this.World.remove(this.engine.world, well);
    });
    this.obstacles.gravityWells = [];
    
    // 移除所有传送门
    this.obstacles.portals.forEach(portal => {
      this.World.remove(this.engine.world, portal);
    });
    this.obstacles.portals = [];
    this.portalPairs = [];
  }

  /**
   * 查找指定位置的障碍物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} radius - 查找半径
   * @returns {Matter.Body|null} 找到的障碍物或null
   */
  findObstacleAt(x, y, radius = 20) {
    // 检查所有类型的障碍物
    const allObstacles = [
      ...this.obstacles.walls,
      ...this.obstacles.bumpers,
      ...this.obstacles.gravityWells,
      ...this.obstacles.portals
    ];
    
    // 查找距离最近的障碍物
    let closestObstacle = null;
    let minDistance = radius;
    
    allObstacles.forEach(obstacle => {
      const dx = obstacle.position.x - x;
      const dy = obstacle.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestObstacle = obstacle;
      }
    });
    
    return closestObstacle;
  }
}
