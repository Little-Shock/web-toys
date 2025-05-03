/**
 * 量子弹球 - 弹球管理器
 * 负责创建和管理弹球，处理纹理加载和物理属性
 */
class BallManager {
  constructor(gameCore) {
    this.gameCore = gameCore;
    this.engine = gameCore.engine;
    this.render = gameCore.render;

    // Matter.js模块
    this.Bodies = Matter.Bodies;
    this.World = Matter.World;
    this.Body = Matter.Body;

    // 弹球数组
    this.balls = [];

    // 移动设备检测
    this.isMobile = gameCore.state.isMobile;

    // 弹球属性 (更小、更快的弹球)
    this.ballProperties = {
      radius: this.isMobile ? 15 : 18, // 更小的弹球
      restitution: 0.9,  // 更高的弹性
      friction: this.isMobile ? 0.005 : 0.008,    // 降低摩擦力
      frictionAir: this.isMobile ? 0.0001 : 0.0002 // 大幅降低空气摩擦力
    };

    // 性能限制
    this.maxBalls = this.isMobile ? 15 : 30; // 移动设备限制最大弹球数量
    this.ballsCreatedCount = 0; // 跟踪创建的弹球总数

    // 纹理状态
    this.textureState = {
      defaultTextureReady: false,
      customTextureReady: false,
      loadingError: false
    };

    // 默认弹球纹理
    this.defaultBallTexture = this.createFallbackTexture();

    // 加载默认弹球图像
    this.loadDefaultTexture();

    // 自定义弹球纹理
    this.customBallTexture = null;

    // 碰撞监听
    this.setupCollisionEvents();

    // 性能优化：定期清理不活跃的弹球
    this.setupAutoCleanup();
  }

  /**
   * 创建备用纹理 (纯色圆形)
   * @returns {HTMLCanvasElement} 备用纹理画布
   */
  createFallbackTexture() {
    const canvas = document.createElement('canvas');
    const size = this.ballProperties.radius * 2;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    // 绘制渐变圆形
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, '#6200ea');
    gradient.addColorStop(0.7, '#00b0ff');
    gradient.addColorStop(1, '#ff4081');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 添加高光效果
    const highlight = ctx.createRadialGradient(
      size * 0.3, size * 0.3, size * 0.1,
      size / 2, size / 2, size / 2
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    highlight.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  /**
   * 加载默认弹球纹理
   */
  loadDefaultTexture() {
    // 直接使用备用纹理，不尝试加载SVG
    console.log("使用备用弹球纹理");
    this.textureState.defaultTextureReady = true;

    // 确保备用纹理已创建
    if (!this.defaultBallTexture) {
      this.defaultBallTexture = this.createFallbackTexture();
    }

    // 不需要等待图像加载，直接更新纹理
    this.updateBallTextures();
  }

  /**
   * 设置碰撞事件监听
   */
  setupCollisionEvents() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        // 检查是否有弹球参与碰撞
        if (this.isBall(pair.bodyA) || this.isBall(pair.bodyB)) {
          const ball = this.isBall(pair.bodyA) ? pair.bodyA : pair.bodyB;
          const other = ball === pair.bodyA ? pair.bodyB : pair.bodyA;

          // 获取碰撞位置
          const collision = pair.collision;
          const position = collision.supports[0] || { x: ball.position.x, y: ball.position.y };

          // 计算碰撞强度
          const velocity = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
          const normalizedVelocity = Math.min(1, velocity / 30);

          // 处理特殊碰撞效果
          this.handleSpecialCollision(ball, other, position, normalizedVelocity);

          // 如果有音频管理器，播放音效
          if (this.gameCore.audioManager) {
            // 根据碰撞对象类型播放不同音效
            if (other.label === 'bumper') {
              this.gameCore.audioManager.playSound('bumper', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
            } else if (other.label === 'wall' || other.label === 'boundary') {
              this.gameCore.audioManager.playSound('wall', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
            } else {
              this.gameCore.audioManager.playSound('bounce', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
            }
          }

          // 增加分数
          if (window.gameScore) {
            // 根据碰撞类型和速度给予不同分数
            let points = 0;

            if (other.label === 'bumper') {
              // 弹射器给高分
              points = Math.round(velocity * 2);
            } else if (other.label === 'gravity') {
              // 重力井给中等分数
              points = Math.round(velocity);
            } else if (other.label === 'portal') {
              // 传送门给高分
              points = Math.round(velocity * 3);
            } else if (other.label === 'wall') {
              // 墙壁给低分
              points = Math.max(1, Math.round(velocity * 0.5));
            } else if (other.label === 'ball') {
              // 球与球碰撞给中等分数
              points = Math.round(velocity);
            }

            // 只有得分大于0时才增加分数
            if (points > 0) {
              window.gameScore.addScore(points);
            }
          }
        }
      }
    });

    // 添加更新事件，用于特殊效果
    Matter.Events.on(this.engine, 'afterUpdate', () => {
      this.updateSpecialEffects();
    });
  }

  /**
   * 处理特殊碰撞效果
   * 改进的物理模拟，更真实的碰撞效果
   */
  handleSpecialCollision(ball, other, position, intensity) {
    // 获取球的当前速度和动量
    const velocity = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
    const mass = ball.mass || 1;
    const momentum = velocity * mass;

    // 弹射器碰撞 - 给球额外的推力，基于动量和速度
    if (other.label === 'bumper') {
      // 计算从弹射器到球的方向向量
      const dx = ball.position.x - other.position.x;
      const dy = ball.position.y - other.position.y;
      const mag = Math.sqrt(dx * dx + dy * dy);

      // 标准化方向向量
      const dirX = dx / mag;
      const dirY = dy / mag;

      // 计算入射角 (球与弹射器中心连线的夹角)
      const incidentAngle = Math.atan2(dy, dx);

      // 基于入射角计算反弹力量 (垂直入射时最大)
      const angleFactor = Math.abs(Math.sin(incidentAngle)) * 0.5 + 0.5;

      // 应用额外的力 (根据球的类型、速度和入射角调整)
      // 速度越快，反弹力越大
      const velocityFactor = Math.min(1, velocity / 20) * 0.5 + 0.5;

      // 球的类型影响反弹力
      const typeFactor = ball.ballType === 'heavy' ? 0.7 :
                         (ball.ballType === 'light' ? 1.3 : 1.0);

      // 计算最终力量
      const forceMagnitude = 0.1 * velocityFactor * angleFactor * typeFactor;

      // 应用力量
      this.Body.applyForce(ball, ball.position, {
        x: dirX * forceMagnitude,
        y: dirY * forceMagnitude
      });

      // 临时增加描边宽度以显示碰撞效果，但不改变颜色
      const originalLineWidth = ball.render.lineWidth || 1;
      ball.render.lineWidth = 3;

      // 0.2秒后恢复原始描边宽度
      setTimeout(() => {
        if (ball && ball.render) {
          ball.render.lineWidth = originalLineWidth;
        }
      }, 200);
    }

    // 墙壁碰撞 - 不再减速，保持动量
    if (other.label === 'wall') {
      // 不做任何速度调整，保持原有速度
      // 可以在这里添加视觉效果，但不影响速度

      // 临时改变墙壁颜色以显示碰撞效果
      if (other.render) {
        const originalColor = other.render.fillStyle;
        other.render.fillStyle = '#FFFFFF';

        // 0.1秒后恢复原始颜色
        setTimeout(() => {
          if (other && other.render) {
            other.render.fillStyle = originalColor;
          }
        }, 100);
      }
    }

    // 重力井碰撞 - 基于物理学的引力效果
    if (other.label === 'gravity') {
      // 计算球到重力井的方向向量
      const dx = other.position.x - ball.position.x;
      const dy = other.position.y - ball.position.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // 标准化方向向量
      const dirX = dx / dist;
      const dirY = dy / dist;

      // 计算引力大小 (反比于距离平方)
      // 使用引力常数G和质量计算万有引力
      const G = 0.0001; // 引力常数
      const gravityWellMass = 100; // 重力井的质量
      const ballMass = ball.mass || 1;

      // 计算引力大小: F = G * m1 * m2 / r^2
      const forceMagnitude = G * gravityWellMass * ballMass / distSq;

      // 应用引力
      this.Body.applyForce(ball, ball.position, {
        x: dirX * forceMagnitude,
        y: dirY * forceMagnitude
      });

      // 视觉效果 - 球靠近重力井时轻微变形
      const deformFactor = Math.min(0.2, 1 / dist * 5);
      if (ball.render) {
        ball.render.lineWidth = 1 + deformFactor * 3;
      }
    }

    // 传送门碰撞 - 保持动量的传送效果
    if (other.label === 'portal') {
      const canvas = this.gameCore.canvas;

      // 获取当前速度和动量
      const vx = ball.velocity.x;
      const vy = ball.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const direction = Math.atan2(vy, vx);

      // 寻找另一个传送门
      let otherPortal = null;
      if (this.gameCore.obstacleManager && this.gameCore.obstacleManager.obstacles.portals) {
        const portals = this.gameCore.obstacleManager.obstacles.portals;
        // 找到不是当前传送门的另一个传送门
        for (let i = 0; i < portals.length; i++) {
          if (portals[i] !== other) {
            otherPortal = portals[i];
            break;
          }
        }
      }

      // 如果找到另一个传送门，传送到那里
      // 否则传送到随机位置
      let newX, newY;
      if (otherPortal) {
        // 传送到另一个传送门，并添加一点偏移以避免立即再次触发
        const offsetMag = 30; // 偏移量
        const offsetAngle = direction; // 使用当前运动方向作为偏移方向
        newX = otherPortal.position.x + Math.cos(offsetAngle) * offsetMag;
        newY = otherPortal.position.y + Math.sin(offsetAngle) * offsetMag;
      } else {
        // 传送到随机位置
        newX = Math.random() * canvas.width;
        newY = Math.random() * canvas.height;
      }

      // 设置新位置
      this.Body.setPosition(ball, { x: newX, y: newY });

      // 保持速度大小，但可能稍微改变方向
      // 添加一点随机性，但不要完全改变方向
      const newDirection = direction + (Math.random() - 0.5) * Math.PI / 4; // ±45度

      this.Body.setVelocity(ball, {
        x: Math.cos(newDirection) * speed,
        y: Math.sin(newDirection) * speed
      });

      // 传送效果 - 短暂增加描边宽度
      if (ball.render) {
        const originalLineWidth = ball.render.lineWidth || 1;

        // 增加描边宽度
        ball.render.lineWidth = 4;

        // 恢复原始描边宽度
        setTimeout(() => {
          if (ball && ball.render) {
            ball.render.lineWidth = originalLineWidth;
          }
        }, 100);
      }
    }
  }

  /**
   * 更新特殊效果
   * 保持颜色完全固定，只添加物理效果
   */
  updateSpecialEffects() {
    const time = performance.now();

    this.balls.forEach(ball => {
      // 不再应用任何可能改变球外观的效果
      // 所有视觉效果都移除，确保球的颜色和外观保持不变

      // 根据球的类型应用不同的物理效果
      if (ball.ballType === 'light') {
        // 轻型球受到轻微的随机力，模拟空气流动
        if (Math.random() < 0.05) { // 5%的几率
          const randomForce = 0.00005;
          this.Body.applyForce(ball, ball.position, {
            x: (Math.random() - 0.5) * randomForce,
            y: (Math.random() - 0.5) * randomForce
          });
        }
      } else if (ball.ballType === 'heavy') {
        // 重型球可以轻微影响其他球
        // 在重型球周围寻找其他球
        const influenceRadius = 50;
        this.balls.forEach(otherBall => {
          if (otherBall !== ball) {
            const dx = otherBall.position.x - ball.position.x;
            const dy = otherBall.position.y - ball.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < influenceRadius * influenceRadius) {
              // 在影响范围内，施加微弱引力
              const dist = Math.sqrt(distSq);
              const dirX = dx / dist;
              const dirY = dy / dist;

              const forceMagnitude = 0.00001 * (1 - dist / influenceRadius);

              this.Body.applyForce(otherBall, otherBall.position, {
                x: -dirX * forceMagnitude, // 负号表示引力
                y: -dirY * forceMagnitude
              });
            }
          }
        });
      }
    });
  }

  /**
   * 检查物体是否为弹球
   * @param {Matter.Body} body - 物理引擎中的物体
   * @returns {boolean} 是否为弹球
   */
  isBall(body) {
    return body.label === 'ball' && this.balls.includes(body);
  }

  /**
   * 设置自定义弹球图像
   * @param {string|Image} image - 图像源（URL或Image对象）
   */
  setCustomBallImage(image) {
    return new Promise((resolve, reject) => {
      if (!image) {
        this.customBallTexture = null;
        this.textureState.customTextureReady = false;
        this.updateBallTextures(); // 更新所有球为默认纹理
        resolve();
        return;
      }

      const img = new Image();

      img.onload = () => {
        console.log("自定义弹球图像加载完成");

        // 创建纹理
        const texture = this.createCircularTexture(img);

        if (texture) {
          this.customBallTexture = texture;
          this.textureState.customTextureReady = true;
          this.updateBallTextures(); // 更新所有球为新纹理
          resolve();
        } else {
          console.error("自定义弹球纹理创建失败");
          this.customBallTexture = null;
          this.textureState.customTextureReady = false;
          reject(new Error('纹理创建失败'));
        }
      };

      img.onerror = () => {
        console.error('自定义弹球图像加载失败');
        this.customBallTexture = null;
        this.textureState.customTextureReady = false;
        reject(new Error('图像加载失败'));
      };

      if (typeof image === 'string') {
        img.src = image;
      } else if (image instanceof Image) {
        if (image.src) {
          img.src = image.src;
        } else {
          reject(new Error('传入的 Image 对象没有有效的 src'));
        }
      } else {
        reject(new Error('无效的图像源'));
      }
    });
  }

  /**
   * 创建圆形纹理
   * @param {Image} image - 图像
   * @returns {HTMLCanvasElement|null} 圆形纹理画布
   */
  createCircularTexture(image) {
    try {
      // 确保 image 是有效的 Image 对象并且已加载完成
      if (!image || !(image instanceof HTMLImageElement) || !image.complete || image.naturalHeight === 0) {
        console.warn('尝试为未加载或无效的图像创建纹理');
        return null;
      }

      const canvas = document.createElement('canvas');
      const size = this.ballProperties.radius * 2;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');

      // 创建圆形裁剪区域
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 绘制图像
      ctx.drawImage(image, 0, 0, size, size);

      // 添加边缘高光效果
      const gradient = ctx.createRadialGradient(
        size * 0.3, size * 0.3, size * 0.1,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      return canvas;
    } catch (error) {
      console.error('创建圆形纹理时出错:', error);
      return null;
    }
  }

  /**
   * 获取当前弹球纹理
   * @returns {HTMLCanvasElement} 弹球纹理
   */
  getBallTexture() {
    // 优先使用自定义纹理
    if (this.textureState.customTextureReady && this.customBallTexture) {
      return this.customBallTexture;
    }

    // 否则使用默认纹理
    return this.defaultBallTexture;
  }

  /**
   * 生成随机颜色
   * @returns {string} 随机颜色的十六进制代码
   */
  getRandomColor() {
    // 更柔和、更美观的颜色集
    const aestheticColors = [
      '#3F51B5', '#5C6BC0', '#7986CB', // 靛蓝色系
      '#303F9F', '#3949AB', '#1A237E',
      '#1976D2', '#1E88E5', '#2196F3', // 蓝色系
      '#0D47A1', '#0277BD', '#01579B',
      '#00897B', '#00796B', '#00695C', // 青色系
      '#2E7D32', '#388E3C', '#43A047', // 绿色系
      '#558B2F', '#689F38', '#7CB342',
      '#F57F17', '#F57C00', '#EF6C00', // 橙色系
      '#E65100', '#D84315', '#BF360C',
      '#6D4C41', '#5D4037', '#4E342E', // 棕色系
      '#455A64', '#37474F', '#263238', // 蓝灰色系
      '#512DA8', '#673AB7', '#5E35B1', // 紫色系
      '#4527A0', '#311B92', '#4A148C'
    ];

    return aestheticColors[Math.floor(Math.random() * aestheticColors.length)];
  }

  /**
   * 更新所有弹球的纹理
   */
  updateBallTextures() {
    // 为每个弹球分配随机颜色
    this.balls.forEach((ball) => {
      if (ball && ball.render) {
        // 如果球没有颜色，分配一个随机颜色
        if (!ball.customColor) {
          ball.customColor = this.getRandomColor();
          ball.glowColor = this.getRandomColor(); // 用于发光效果
        }

        // 使用纯色渲染
        ball.render.fillStyle = ball.customColor;
        ball.render.strokeStyle = '#ffffff';
        ball.render.lineWidth = 1;
      }
    });
  }

  /**
   * 设置自动清理
   * 定期检查并移除不活跃或超出边界的弹球
   */
  setupAutoCleanup() {
    // 每3秒检查一次
    setInterval(() => {
      this.cleanupInactiveBalls();
    }, 3000);
  }

  /**
   * 清理不活跃的弹球
   */
  cleanupInactiveBalls() {
    if (this.balls.length <= 1) return; // 保留至少一个弹球

    // 获取当前时间 (用于检查弹球存在时间)
    const now = performance.now();
    const canvas = this.gameCore.canvas;

    // 最小存在时间 (毫秒)
    const minLifetime = 2000;
    const width = canvas.width;
    const height = canvas.height;
    const margin = 200; // 超出边界的容差

    // 标记要移除的弹球
    const ballsToRemove = [];

    this.balls.forEach(ball => {
      // 检查是否超出边界
      const outOfBounds = (
        ball.position.x < -margin ||
        ball.position.x > width + margin ||
        ball.position.y < -margin ||
        ball.position.y > height + margin
      );

      // 检查是否几乎静止
      const almostStatic = (
        Math.abs(ball.velocity.x) < 0.1 &&
        Math.abs(ball.velocity.y) < 0.1
      );

      // 检查存在时间
      const lifetime = ball.createdAt ? now - ball.createdAt : Infinity;
      const isOldEnough = lifetime > minLifetime; // 只清理存在足够长时间的弹球

      if ((outOfBounds && isOldEnough) || (almostStatic && this.balls.length > 5 && isOldEnough)) {
        ballsToRemove.push(ball);
      }
    });

    // 移除标记的弹球 (最多移除超过5个的部分)
    if (ballsToRemove.length > 0 && this.balls.length - ballsToRemove.length >= 5) {
      // 限制一次最多移除的数量
      const maxRemove = Math.min(ballsToRemove.length, this.balls.length - 5);
      const toRemove = ballsToRemove.slice(0, maxRemove);

      toRemove.forEach(ball => {
        this.World.remove(this.engine.world, ball);
        const index = this.balls.indexOf(ball);
        if (index !== -1) {
          this.balls.splice(index, 1);
        }
      });

      if (toRemove.length > 0) {
        console.log(`已清理 ${toRemove.length} 个不活跃的弹球，当前弹球数: ${this.balls.length}`);
      }
    }
  }

  /**
   * 添加弹球
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
   * @returns {Matter.Body} 创建的弹球
   */
  addBall(x, y, options = {}) {
    // 检查是否超过最大弹球数量限制
    if (this.balls.length >= this.maxBalls) {
      // 移除最早创建的弹球
      const oldestBall = this.balls.shift();
      if (oldestBall) {
        this.World.remove(this.engine.world, oldestBall);
      }
    }

    // 增加创建计数
    this.ballsCreatedCount++;

    const radius = options.radius || this.ballProperties.radius;

    // 获取纹理 - 确保使用有效的纹理
    let texture = this.getBallTexture();

    // 如果纹理无效，强制使用备用纹理
    if (!texture) {
      console.warn("纹理无效，使用备用纹理");
      this.defaultBallTexture = this.createFallbackTexture();
      texture = this.defaultBallTexture;
      this.textureState.defaultTextureReady = true;
    }

    // 生成随机颜色
    const ballColor = this.getRandomColor();
    const glowColor = this.getRandomColor();

    // 创建物理球体 (更小、更快的弹球)
    const ball = this.Bodies.circle(x, y, radius, {
      label: 'ball',
      restitution: options.restitution || this.ballProperties.restitution,
      friction: options.friction || this.ballProperties.friction,
      frictionAir: options.frictionAir || this.ballProperties.frictionAir,
      // 降低密度以减轻计算负担
      density: 0.0008,
      // 碰撞检测
      collisionFilter: {
        group: 0,
        category: 1,
        mask: 0xFFFFFFFF
      },
      // 使用随机颜色渲染
      render: {
        fillStyle: ballColor,
        strokeStyle: '#ffffff',
        lineWidth: 1
      },
      // 添加自定义属性
      customColor: ballColor,
      glowColor: glowColor,
      // 添加特殊效果标志
      specialEffect: Math.random() < 0.3 ? 'glow' :
                    (Math.random() < 0.5 ? 'trail' : 'normal'),
      // 添加弹球类型 (普通、重型、轻型)
      ballType: Math.random() < 0.2 ? 'heavy' :
               (Math.random() < 0.4 ? 'light' : 'normal')
    });

    // 添加创建时间戳和ID (用于后续清理)
    ball.createdAt = performance.now();
    ball.ballId = this.ballsCreatedCount;

    // 添加到世界和数组
    this.World.add(this.engine.world, ball);
    this.balls.push(ball);

    // 根据球的类型调整物理属性
    if (ball.ballType === 'heavy') {
      ball.density = 0.002; // 更重
      ball.restitution = 0.7; // 弹性降低
      ball.render.lineWidth = 2; // 更粗的边框
    } else if (ball.ballType === 'light') {
      ball.density = 0.0004; // 更轻
      ball.restitution = 1.0; // 弹性增加
      ball.frictionAir = 0.00005; // 几乎没有空气阻力
    }

    // 应用初始速度 (大幅提高速度)
    const velocityScale = this.isMobile ? 2.5 : 3.0; // 大幅提高速度
    const baseVelocity = {
      x: options.velocityX || (Math.random() - 0.5) * 10,
      y: options.velocityY || (Math.random() - 0.5) * 10
    };

    // 根据球的类型调整速度
    let finalVelocity = {
      x: baseVelocity.x * velocityScale,
      y: baseVelocity.y * velocityScale
    };

    // 轻型球更快，重型球更慢
    if (ball.ballType === 'light') {
      finalVelocity.x *= 1.3;
      finalVelocity.y *= 1.3;
    } else if (ball.ballType === 'heavy') {
      finalVelocity.x *= 0.8;
      finalVelocity.y *= 0.8;
    }

    this.Body.setVelocity(ball, finalVelocity);

    return ball;
  }

  /**
   * 移除所有弹球
   */
  removeAllBalls() {
    this.balls.forEach(ball => {
      this.World.remove(this.engine.world, ball);
    });

    this.balls = [];
  }

  /**
   * 更新物理参数
   * @param {Object} params - 物理参数
   */
  updatePhysicsParams(params) {
    if (params.restitution !== undefined) {
      this.ballProperties.restitution = params.restitution;
    }

    if (params.friction !== undefined) {
      this.ballProperties.friction = params.friction;
    }

    if (params.frictionAir !== undefined) {
      this.ballProperties.frictionAir = params.frictionAir;
    }

    // 更新现有弹球的物理属性
    this.balls.forEach(ball => {
      if (params.restitution !== undefined) {
        ball.restitution = params.restitution;
      }

      if (params.friction !== undefined) {
        ball.friction = params.friction;
      }

      if (params.frictionAir !== undefined) {
        ball.frictionAir = params.frictionAir;
      }
    });
  }

  /**
   * 等待纹理就绪
   * @returns {Promise} 纹理就绪的Promise
   */
  awaitTexture() {
    return new Promise(resolve => {
      // 如果纹理已就绪，立即解析
      if (this.textureState.defaultTextureReady || this.textureState.customTextureReady) {
        resolve();
        return;
      }

      // 否则，等待默认纹理加载完成
      const checkInterval = 50; // 检查间隔（毫秒）
      const maxWaitTime = 3000; // 最大等待时间（毫秒）
      let waitedTime = 0;

      const intervalId = setInterval(() => {
        waitedTime += checkInterval;

        if (this.textureState.defaultTextureReady || this.textureState.customTextureReady || this.textureState.loadingError) {
          clearInterval(intervalId);
          resolve();
        } else if (waitedTime >= maxWaitTime) {
          // 超时，使用备用纹理
          clearInterval(intervalId);
          console.warn("纹理加载超时，使用备用纹理");
          this.textureState.loadingError = true;
          this.textureState.defaultTextureReady = true;
          resolve();
        }
      }, checkInterval);
    });
  }
}
