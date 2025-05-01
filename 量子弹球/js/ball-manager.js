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

    // 弹球属性
    this.ballProperties = {
      radius: 30,
      restitution: 0.7,  // 弹性
      friction: 0.01,    // 摩擦力
      frictionAir: 0.001 // 空气摩擦力
    };

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
    const defaultBallImage = new Image();

    defaultBallImage.onload = () => {
      console.log("默认弹球SVG加载完成");

      // 创建纹理
      const texture = this.createCircularTexture(defaultBallImage);

      if (texture) {
        this.defaultBallTexture = texture;
        this.textureState.defaultTextureReady = true;
        this.updateBallTextures();
      }
    };

    defaultBallImage.onerror = () => {
      console.error("默认弹球SVG加载失败，使用备用纹理");
      this.textureState.loadingError = true;
      // 继续使用备用纹理
      this.textureState.defaultTextureReady = true;
    };

    // 使用内联SVG数据，避免额外的网络请求
    defaultBallImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjUwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzYyMDBlYSIvPjxzdG9wIG9mZnNldD0iNzAlIiBzdG9wLWNvbG9yPSIjMDBiMGZmIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmY0MDgxIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjM1IiByPSIxMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9zdmc+';
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
          const normalizedVelocity = Math.min(1, velocity / 20);

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
        }
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
   * 更新所有弹球的纹理
   */
  updateBallTextures() {
    const texture = this.getBallTexture();

    this.balls.forEach(ball => {
      if (ball && ball.render && ball.render.sprite) {
        ball.render.sprite.texture = texture;
      }
    });
  }

  /**
   * 添加弹球
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
   * @returns {Matter.Body} 创建的弹球
   */
  addBall(x, y, options = {}) {
    const radius = options.radius || this.ballProperties.radius;

    // 创建物理球体
    const ball = this.Bodies.circle(x, y, radius, {
      label: 'ball',
      restitution: options.restitution || this.ballProperties.restitution,
      friction: options.friction || this.ballProperties.friction,
      frictionAir: options.frictionAir || this.ballProperties.frictionAir,
      render: {
        sprite: {
          texture: this.getBallTexture(),
          xScale: 1,
          yScale: 1
        }
      }
    });

    // 添加到世界和数组
    this.World.add(this.engine.world, ball);
    this.balls.push(ball);

    // 应用初始速度
    if (options.velocityX !== undefined || options.velocityY !== undefined) {
      this.Body.setVelocity(ball, {
        x: options.velocityX || 0,
        y: options.velocityY || 0
      });
    }

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
