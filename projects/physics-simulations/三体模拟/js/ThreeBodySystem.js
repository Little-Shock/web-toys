/**
 * 三体系统
 * 模拟三个天体在引力作用下的运动
 */
class ThreeBodySystem {
  /**
   * 创建三体系统
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 配置参数
    this.params = {
      timeStep: options.timeStep || 0.01,
      simulationSpeed: options.simulationSpeed || 1.0,
      gravityConstant: options.gravityConstant || G,
      collisionDistance: options.collisionDistance || 0.1,
      boundaryRadius: options.boundaryRadius || 50,
      integrationMethod: options.integrationMethod || 'rk4' // 'euler' 或 'rk4'
    };

    // 天体数组
    this.bodies = [];

    // 模拟状态
    this.time = 0;
    this.running = false;
    this.collisionDetected = false;

    // 预设配置
    this.presets = {
      figure8: this.createFigure8Preset,
      chaotic: this.createChaoticPreset,
      binary: this.createBinarySystemPreset,
      collision: this.createCollisionPreset,
      random: this.createRandomPreset
    };

    // 初始化默认预设
    this.initializePreset('figure8');

    // 统计数据
    this.stats = {
      initialEnergy: 0,
      currentEnergy: 0,
      energyError: 0,
      initialAngularMomentum: { x: 0, y: 0, z: 0 },
      currentAngularMomentum: { x: 0, y: 0, z: 0 },
      angularMomentumError: 0
    };
  }

  /**
   * 初始化预设配置
   * @param {string} presetName - 预设名称
   */
  initializePreset(presetName) {
    if (this.presets[presetName]) {
      this.bodies = this.presets[presetName].call(this);
      this.resetStats();
    } else {
      console.error(`预设 "${presetName}" 不存在`);
    }
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    // 计算初始能量和角动量
    this.stats.initialEnergy = this.calculateTotalEnergy();
    this.stats.currentEnergy = this.stats.initialEnergy;
    this.stats.energyError = 0;

    this.stats.initialAngularMomentum = this.calculateTotalAngularMomentum();
    this.stats.currentAngularMomentum = { ...this.stats.initialAngularMomentum };
    this.stats.angularMomentumError = 0;
  }

  /**
   * 创建8字形稳定轨道预设
   * @returns {Array} 天体数组
   */
  createFigure8Preset() {
    // 8字形解是三体问题的一个特殊周期解
    // 参考: http://arxiv.org/abs/math/0011268

    const bodies = [
      new CelestialBody({
        mass: 1.0,
        position: { x: 0.97000436, y: -0.24308753, z: 0 },
        velocity: { x: 0.466203685, y: 0.43236573, z: 0 },
        color: '#4e79ff', // 蓝色
        name: '恒星A'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: -0.97000436, y: 0.24308753, z: 0 },
        velocity: { x: 0.466203685, y: 0.43236573, z: 0 },
        color: '#ff4e4e', // 红色
        name: '恒星B'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: -0.93240737, y: -0.86473146, z: 0 },
        color: '#4eff7e', // 绿色
        name: '恒星C'
      })
    ];

    return bodies;
  }

  /**
   * 创建混沌轨道预设
   * @returns {Array} 天体数组
   */
  createChaoticPreset() {
    const bodies = [
      new CelestialBody({
        mass: 1.0,
        position: { x: 3, y: 1, z: 0 },
        velocity: { x: 0, y: 0.3, z: 0 },
        color: '#4e79ff', // 蓝色
        name: '恒星A'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: -2, y: -1, z: 0 },
        velocity: { x: 0.1, y: -0.2, z: 0 },
        color: '#ff4e4e', // 红色
        name: '恒星B'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: -1, y: 2, z: 0 },
        velocity: { x: -0.1, y: -0.1, z: 0 },
        color: '#4eff7e', // 绿色
        name: '恒星C'
      })
    ];

    return bodies;
  }

  /**
   * 创建双星系统+单星预设
   * @returns {Array} 天体数组
   */
  createBinarySystemPreset() {
    const bodies = [
      new CelestialBody({
        mass: 1.5,
        position: { x: 2, y: 0, z: 0 },
        velocity: { x: 0, y: 0.6, z: 0 },
        color: '#4e79ff', // 蓝色
        name: '恒星A'
      }),

      new CelestialBody({
        mass: 1.5,
        position: { x: -2, y: 0, z: 0 },
        velocity: { x: 0, y: -0.6, z: 0 },
        color: '#ff4e4e', // 红色
        name: '恒星B'
      }),

      new CelestialBody({
        mass: 0.8,
        position: { x: 0, y: 5, z: 0 },
        velocity: { x: -0.4, y: 0, z: 0.1 },
        color: '#4eff7e', // 绿色
        name: '恒星C'
      })
    ];

    return bodies;
  }

  /**
   * 创建碰撞路径预设
   * @returns {Array} 天体数组
   */
  createCollisionPreset() {
    const bodies = [
      new CelestialBody({
        mass: 1.0,
        position: { x: 3, y: 0, z: 0 },
        velocity: { x: 0, y: 0.2, z: 0 },
        color: '#4e79ff', // 蓝色
        name: '恒星A'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: -3, y: 0, z: 0 },
        velocity: { x: 0, y: -0.2, z: 0 },
        color: '#ff4e4e', // 红色
        name: '恒星B'
      }),

      new CelestialBody({
        mass: 1.0,
        position: { x: 0, y: 0, z: 3 },
        velocity: { x: -0.1, y: -0.1, z: -0.3 },
        color: '#4eff7e', // 绿色
        name: '恒星C'
      })
    ];

    return bodies;
  }

  /**
   * 创建随机预设
   * @returns {Array} 天体数组
   */
  createRandomPreset() {
    const bodies = [
      new CelestialBody({
        mass: random(0.5, 2.0),
        position: {
          x: random(-5, 5),
          y: random(-5, 5),
          z: random(-2, 2)
        },
        velocity: {
          x: random(-0.3, 0.3),
          y: random(-0.3, 0.3),
          z: random(-0.1, 0.1)
        },
        color: '#4e79ff', // 蓝色
        name: '恒星A'
      }),

      new CelestialBody({
        mass: random(0.5, 2.0),
        position: {
          x: random(-5, 5),
          y: random(-5, 5),
          z: random(-2, 2)
        },
        velocity: {
          x: random(-0.3, 0.3),
          y: random(-0.3, 0.3),
          z: random(-0.1, 0.1)
        },
        color: '#ff4e4e', // 红色
        name: '恒星B'
      }),

      new CelestialBody({
        mass: random(0.5, 2.0),
        position: {
          x: random(-5, 5),
          y: random(-5, 5),
          z: random(-2, 2)
        },
        velocity: {
          x: random(-0.3, 0.3),
          y: random(-0.3, 0.3),
          z: random(-0.1, 0.1)
        },
        color: '#4eff7e', // 绿色
        name: '恒星C'
      })
    ];

    // 调整系统的总动量为零
    this.adjustTotalMomentumToZero(bodies);

    return bodies;
  }

  /**
   * 调整系统的总动量为零
   * @param {Array} bodies - 天体数组
   */
  adjustTotalMomentumToZero(bodies) {
    // 计算总质量和总动量
    let totalMass = 0;
    let totalMomentum = { x: 0, y: 0, z: 0 };

    for (const body of bodies) {
      totalMass += body.mass;
      totalMomentum.x += body.mass * body.velocity.x;
      totalMomentum.y += body.mass * body.velocity.y;
      totalMomentum.z += body.mass * body.velocity.z;
    }

    // 计算质心速度
    const centerVelocity = {
      x: totalMomentum.x / totalMass,
      y: totalMomentum.y / totalMass,
      z: totalMomentum.z / totalMass
    };

    // 调整每个天体的速度
    for (const body of bodies) {
      body.velocity.x -= centerVelocity.x;
      body.velocity.y -= centerVelocity.y;
      body.velocity.z -= centerVelocity.z;
    }
  }

  /**
   * 计算天体间的引力
   * @param {CelestialBody} body1 - 天体1
   * @param {CelestialBody} body2 - 天体2
   * @returns {Object} 作用在天体1上的引力向量
   */
  calculateGravitationalForce(body1, body2) {
    // 计算距离向量
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const dz = body2.position.z - body1.position.z;

    // 计算距离的平方
    const distSquared = dx * dx + dy * dy + dz * dz;

    // 防止距离过小导致的数值不稳定
    const softening = 0.001;
    const dist = Math.sqrt(distSquared + softening * softening);

    // 计算引力大小
    const forceMagnitude = this.params.gravityConstant * body1.mass * body2.mass / (dist * dist);

    // 计算引力向量
    return {
      x: forceMagnitude * dx / dist,
      y: forceMagnitude * dy / dist,
      z: forceMagnitude * dz / dist
    };
  }

  /**
   * 计算天体的加速度（用于RK4积分）
   * @param {CelestialBody} body - 天体
   * @returns {Object} 加速度向量
   */
  calculateAcceleration(body) {
    const acceleration = { x: 0, y: 0, z: 0 };

    for (const otherBody of this.bodies) {
      if (otherBody === body) continue;

      // 计算引力
      const force = this.calculateGravitationalForce(body, otherBody);

      // 计算加速度 (F = ma, a = F/m)
      acceleration.x += force.x / body.mass;
      acceleration.y += force.y / body.mass;
      acceleration.z += force.z / body.mass;
    }

    return acceleration;
  }

  /**
   * 更新系统状态
   * @param {number} dt - 时间步长
   */
  update(dt) {
    try {
      if (!this.running || this.collisionDetected) return;

      // 调整时间步长
      const adjustedDt = dt * this.params.simulationSpeed * this.params.timeStep;

      if (this.params.integrationMethod === 'euler') {
        // 欧拉积分方法
        this.updateEuler(adjustedDt);
      } else {
        // 龙格-库塔方法（RK4）
        this.updateRK4(adjustedDt);
      }

      // 检查碰撞
      this.checkCollisions();

      // 检查边界
      this.checkBoundaries();

      // 更新统计数据
      this.updateStats();

      // 更新时间
      this.time += adjustedDt;
    } catch (error) {
      console.error('更新系统状态时出错:', error);
      // 继续执行，不要因为更新失败而中断整个应用
    }
  }

  /**
   * 使用欧拉积分更新系统
   * @param {number} dt - 时间步长
   */
  updateEuler(dt) {
    // 计算所有天体的力
    for (const body of this.bodies) {
      body.resetForce();

      for (const otherBody of this.bodies) {
        if (body === otherBody) continue;

        const force = this.calculateGravitationalForce(body, otherBody);
        body.applyForce(force);
      }

      body.calculateAcceleration();
    }

    // 更新所有天体的速度和位置
    for (const body of this.bodies) {
      body.updateVelocity(dt);
      body.updatePosition(dt);
    }
  }

  /**
   * 使用RK4积分更新系统
   * @param {number} dt - 时间步长
   */
  updateRK4(dt) {
    for (const body of this.bodies) {
      body.updateRK4((b) => this.calculateAcceleration(b), dt);
    }
  }

  /**
   * 检查天体之间的碰撞
   */
  checkCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const body1 = this.bodies[i];
        const body2 = this.bodies[j];

        const dist = distance(body1.position, body2.position);
        const minDist = (body1.radius + body2.radius) * 0.8; // 使用80%的半径和作为碰撞距离

        if (dist < minDist) {
          this.collisionDetected = true;
          console.log(`碰撞检测：恒星 ${body1.name} 和 ${body2.name} 发生碰撞`);
          return;
        }
      }
    }
  }

  /**
   * 检查天体是否超出边界
   */
  checkBoundaries() {
    for (const body of this.bodies) {
      const dist = distance(body.position, { x: 0, y: 0, z: 0 });

      if (dist > this.params.boundaryRadius) {
        console.log(`边界检测：恒星 ${body.name} 超出边界`);

        // 可以选择停止模拟或将天体拉回边界
        // this.running = false;

        // 或者将天体拉回边界
        const direction = normalizeVector(body.position);
        body.position.x = direction.x * this.params.boundaryRadius * 0.9;
        body.position.y = direction.y * this.params.boundaryRadius * 0.9;
        body.position.z = direction.z * this.params.boundaryRadius * 0.9;
      }
    }
  }

  /**
   * 计算系统的总能量
   * @returns {number} 总能量
   */
  calculateTotalEnergy() {
    return totalEnergy(this.bodies);
  }

  /**
   * 计算系统的总角动量
   * @returns {Object} 总角动量向量
   */
  calculateTotalAngularMomentum() {
    return totalAngularMomentum(this.bodies);
  }

  /**
   * 更新统计数据
   */
  updateStats() {
    // 计算当前能量
    this.stats.currentEnergy = this.calculateTotalEnergy();

    // 计算能量误差
    if (this.stats.initialEnergy !== 0) {
      this.stats.energyError = Math.abs(
        (this.stats.currentEnergy - this.stats.initialEnergy) / this.stats.initialEnergy
      );
    }

    // 计算当前角动量
    this.stats.currentAngularMomentum = this.calculateTotalAngularMomentum();

    // 计算角动量误差
    const initialL = vectorLength(this.stats.initialAngularMomentum);
    const currentL = vectorLength(this.stats.currentAngularMomentum);

    if (initialL !== 0) {
      this.stats.angularMomentumError = Math.abs((currentL - initialL) / initialL);
    }
  }

  /**
   * 开始模拟
   */
  start() {
    this.running = true;
  }

  /**
   * 暂停模拟
   */
  pause() {
    this.running = false;
  }

  /**
   * 重置模拟
   * @param {string} presetName - 预设名称（可选）
   */
  reset(presetName) {
    this.time = 0;
    this.collisionDetected = false;

    if (presetName && this.presets[presetName]) {
      this.initializePreset(presetName);
    } else {
      // 重置现有天体
      for (const body of this.bodies) {
        body.clearTrail();
      }

      this.resetStats();
    }
  }

  /**
   * 设置模拟速度
   * @param {number} speed - 模拟速度
   */
  setSimulationSpeed(speed) {
    this.params.simulationSpeed = speed;
  }

  /**
   * 设置时间步长
   * @param {number} timeStep - 时间步长
   */
  setTimeStep(timeStep) {
    this.params.timeStep = timeStep;
  }

  /**
   * 设置引力常数
   * @param {number} gravityConstant - 引力常数
   */
  setGravityConstant(gravityConstant) {
    this.params.gravityConstant = gravityConstant;
  }

  /**
   * 设置积分方法
   * @param {string} method - 积分方法 ('euler' 或 'rk4')
   */
  setIntegrationMethod(method) {
    if (method === 'euler' || method === 'rk4') {
      this.params.integrationMethod = method;
    } else {
      console.error(`不支持的积分方法: ${method}`);
    }
  }

  /**
   * 设置天体质量
   * @param {number} index - 天体索引
   * @param {number} mass - 新质量
   */
  setBodyMass(index, mass) {
    if (index >= 0 && index < this.bodies.length) {
      this.bodies[index].mass = mass;

      // 更新天体半径
      this.bodies[index].radius = Math.pow(mass, 1/3) * 0.5;
    }
  }

  /**
   * 获取天体
   * @param {number} index - 天体索引
   * @returns {CelestialBody} 天体
   */
  getBody(index) {
    if (index >= 0 && index < this.bodies.length) {
      return this.bodies[index];
    }
    return null;
  }

  /**
   * 获取所有天体
   * @returns {Array} 天体数组
   */
  getBodies() {
    return this.bodies;
  }

  /**
   * 获取统计数据
   * @returns {Object} 统计数据
   */
  getStats() {
    return this.stats;
  }

  /**
   * 获取模拟时间
   * @returns {number} 模拟时间
   */
  getTime() {
    return this.time;
  }

  /**
   * 检查模拟是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning() {
    return this.running;
  }

  /**
   * 检查是否检测到碰撞
   * @returns {boolean} 是否检测到碰撞
   */
  hasCollision() {
    return this.collisionDetected;
  }
}
