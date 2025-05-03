/**
 * 量子弹球 - 障碍物管理器
 * 负责创建和管理游戏中的各种障碍物
 */
class ObstacleManager {
  constructor(gameCore) {
    this.gameCore = gameCore;
    this.engine = gameCore.engine;
    this.render = gameCore.render;

    // Matter.js模块
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.World = Matter.World;
    this.Composite = Matter.Composite;

    // 障碍物集合 (简化版本只保留墙壁和弹射器)
    this.obstacles = {
      walls: [],
      bumpers: []
    };

    // 边界墙
    this.boundaries = [];

    // 创建边界
    this.createBoundaries();
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
    const radius = options.radius || 25; // 更小的弹射器

    // 创建弹射器
    const bumper = this.Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'bumper',
      restitution: 2.0, // 更高的弹性
      render: {
        fillStyle: options.color || '#ff4081',
        strokeStyle: '#ffffff',
        lineWidth: 2
      }
    });

    // 添加脉动动画效果
    bumper.pulseEffect = {
      active: true,
      baseRadius: radius,
      phase: Math.random() * Math.PI * 2 // 随机初始相位
    };

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

    // 创建重力井
    const gravityWell = this.Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'gravity',
      isSensor: true, // 不产生物理碰撞，只触发事件
      render: {
        fillStyle: 'rgba(100, 100, 255, 0.3)',
        strokeStyle: '#6464ff',
        lineWidth: 2
      }
    });

    // 添加到世界和障碍物集合
    this.World.add(this.engine.world, gravityWell);

    // 如果obstacles对象中没有gravityWells数组，创建它
    if (!this.obstacles.gravityWells) {
      this.obstacles.gravityWells = [];
    }

    this.obstacles.gravityWells.push(gravityWell);

    return gravityWell;
  }

  /**
   * 创建传送门
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
   */
  createPortal(x, y, options = {}) {
    const radius = options.radius || 30;

    // 创建传送门
    const portal = this.Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'portal',
      isSensor: true, // 不产生物理碰撞，只触发事件
      render: {
        fillStyle: 'rgba(255, 100, 255, 0.3)',
        strokeStyle: '#ff64ff',
        lineWidth: 2
      }
    });

    // 添加到世界和障碍物集合
    this.World.add(this.engine.world, portal);

    // 如果obstacles对象中没有portals数组，创建它
    if (!this.obstacles.portals) {
      this.obstacles.portals = [];
    }

    this.obstacles.portals.push(portal);

    return portal;
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
    if (this.obstacles.gravityWells) {
      this.obstacles.gravityWells.forEach(well => {
        this.World.remove(this.engine.world, well);
      });
      this.obstacles.gravityWells = [];
    }

    // 移除所有传送门
    if (this.obstacles.portals) {
      this.obstacles.portals.forEach(portal => {
        this.World.remove(this.engine.world, portal);
      });
      this.obstacles.portals = [];
    }
  }

  /**
   * 更新障碍物动画效果
   * 在游戏循环中调用
   */
  updateObstacleEffects() {
    const time = performance.now();

    // 更新弹射器脉动效果
    this.obstacles.bumpers.forEach(bumper => {
      if (bumper.pulseEffect && bumper.pulseEffect.active) {
        // 使用正弦波创建脉动效果
        const phase = bumper.pulseEffect.phase || 0;
        const baseRadius = bumper.pulseEffect.baseRadius || 25;
        const pulseFactor = Math.sin(time / 300 + phase) * 0.1 + 1;

        // 更新渲染属性
        bumper.render.lineWidth = 2 + Math.sin(time / 200 + phase) * 1;

        // 随时间变化颜色
        const hue = (time / 50) % 360;
        bumper.render.strokeStyle = `hsl(${hue}, 100%, 70%)`;
      }
    });

    // 更新重力井效果
    if (this.obstacles.gravityWells) {
      this.obstacles.gravityWells.forEach(well => {
        // 脉动透明度
        const alpha = 0.2 + Math.sin(time / 500) * 0.1;
        well.render.fillStyle = `rgba(100, 100, 255, ${alpha})`;

        // 旋转线条效果
        const angle = (time / 1000) % (Math.PI * 2);
        well.angle = angle;
      });
    }

    // 更新传送门效果
    if (this.obstacles.portals) {
      this.obstacles.portals.forEach(portal => {
        // 脉动透明度
        const alpha = 0.2 + Math.sin(time / 300) * 0.1;
        portal.render.fillStyle = `rgba(255, 100, 255, ${alpha})`;

        // 旋转线条效果
        const angle = (time / 800) % (Math.PI * 2);
        portal.angle = -angle; // 反方向旋转
      });
    }
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
      ...this.obstacles.bumpers
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
