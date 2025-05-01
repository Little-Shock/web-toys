/**
 * 弹球管理器
 * 负责创建和管理弹球
 */
class BallManager {
  constructor(engine, render, audioManager) {
    this.engine = engine;
    this.render = render;
    this.audioManager = audioManager;
    
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
    
    // 默认弹球图像及加载状态
    this.defaultBallImage = new Image();
    this.isDefaultImageReady = false;
    this.defaultBallTexture = null; // 缓存默认纹理

    // Promise to signal default texture readiness
    this._resolveDefaultTextureReady = null;
    this.defaultTextureReadyPromise = new Promise(resolve => {
        this._resolveDefaultTextureReady = resolve;
    });

    this.defaultBallImage.onload = () => {
      console.log("默认弹球SVG加载完成");
      this.isDefaultImageReady = true;
      // 预先生成并缓存默认纹理
      this.defaultBallTexture = this.createCircularTexture(this.defaultBallImage);
      // 如果有已经创建的球，更新它们的纹理
      this.updateExistingBallTextures(this.defaultBallTexture);
      // Signal that the default texture is ready
      if (this._resolveDefaultTextureReady) {
        this._resolveDefaultTextureReady();
      }
    };
    this.defaultBallImage.onerror = () => {
      console.error("默认弹球SVG加载失败！");
       // Still resolve the promise even on error, maybe with a fallback?
       // Or reject, but the calling code needs to handle rejection. Let's resolve for now.
       if (this._resolveDefaultTextureReady) {
        this._resolveDefaultTextureReady(); // Let the app proceed, maybe without texture
      }
    };
    this.defaultBallImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjUwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzYyMDBlYSIvPjxzdG9wIG9mZnNldD0iNzAlIiBzdG9wLWNvbG9yPSIjMDBiMGZmIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmY0MDgxIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIGZpbGw9InVybCgjZykiLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjM1IiByPSIxMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9zdmc+';
    
    // 自定义弹球图像及纹理缓存
    this.customBallImage = null;
    this.customBallTexture = null; // 缓存自定义纹理
    
    // 碰撞监听
    this.setupCollisionEvents();
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
          
          // 根据碰撞对象类型播放不同音效
          if (other.label === 'bumper') {
            this.audioManager.playSound('bumper', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
          } else if (other.label === 'portal') {
            this.audioManager.playSound('portal', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
          } else if (other.label === 'gravity') {
            this.audioManager.playSound('gravity', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
          } else if (other.label === 'wall' || other.label === 'boundary') {
            this.audioManager.playSound('wall', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
          } else {
            this.audioManager.playSound('bounce', position.x / window.innerWidth, position.y / window.innerHeight, normalizedVelocity);
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
        this.customBallImage = null;
        this.customBallTexture = null; // 清除缓存
        this.updateBallTextures(); // 更新所有球为默认纹理
        resolve();
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        console.log("自定义弹球图像加载完成");
        this.customBallImage = img;
        // 生成并缓存自定义纹理
        this.customBallTexture = this.createCircularTexture(this.customBallImage);
        this.updateBallTextures(); // 更新所有球为新纹理
        resolve();
      };
      
      img.onerror = () => {
        console.error('自定义弹球图像加载失败');
        this.customBallImage = null;
        this.customBallTexture = null; // 清除缓存
        this.updateBallTextures(); // 更新所有球为默认纹理
        reject(new Error('弹球图像加载失败'));
      };
      
      if (typeof image === 'string') {
        img.src = image;
      } else if (image instanceof Image) {
        // 如果传入的是已经存在的 Image 对象，也需要确保其 src 被设置
        if (image.src) {
            img.src = image.src;
        } else {
            reject(new Error('传入的 Image 对象没有有效的 src'));
            return;
        }
      } else {
        reject(new Error('无效的图像源'));
      }
    });
  }

  /**
   * 创建圆形纹理 (确保图片已加载)
   * @param {Image} image - 图像 (必须已加载完成)
   * @returns {HTMLCanvasElement|null} 圆形纹理画布, 或在图片未加载时返回 null
   */
  createCircularTexture(image) {
    // 确保 image 是有效的 Image 对象并且已加载完成
    if (!image || !(image instanceof HTMLImageElement) || !image.complete || image.naturalHeight === 0) {
      console.warn('尝试为未加载或无效的图像创建纹理:', image);
      return null; // 返回 null 或一个备用纹理
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
  }

  /**
   * 获取弹球纹理
   * @returns {string|HTMLCanvasElement} 弹球纹理
   */
  getBallTexture() {
    if (this.customBallImage && this.customBallTexture) {
      // 优先使用缓存的自定义纹理
      return this.customBallTexture;
    } else if (this.isDefaultImageReady && this.defaultBallTexture) {
      // 使用缓存的默认纹理
      return this.defaultBallTexture;
    } else {
      // 如果默认纹理还没准备好，返回一个占位符或 null
      // 或者可以尝试再次创建（但不推荐，因为可能还是未加载）
      console.warn("默认纹理尚未准备好，返回 null");
      return null; // 或者返回一个简单的颜色/占位符 Canvas
    }
  }

  /**
   * 更新所有弹球的纹理 (使用缓存)
   */
  updateBallTextures() {
    const texture = this.getBallTexture();
    
    if (!texture) {
      console.warn("无法获取有效纹理，跳过更新");
      return;
    }

    this.updateExistingBallTextures(texture);
  }

  /**
   * Helper: 使用指定纹理更新已存在的球
   * @param {HTMLCanvasElement} texture
   */
  updateExistingBallTextures(texture) {
    this.balls.forEach(ball => {
      // 检查 ball 和 render.sprite 是否存在
      if (ball && ball.render && ball.render.sprite) {
        ball.render.sprite.texture = texture;
      } else {
        console.warn("尝试更新纹理时发现无效的 ball 或 sprite:", ball);
      }
    });
  }

  /**
   * 添加弹球
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 额外选项
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
    if (options.velocityX || options.velocityY) {
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
   * Returns a promise that resolves when the default ball texture is ready (or failed to load).
   */
  awaitDefaultTexture() {
    return this.defaultTextureReadyPromise;
  }
}
