/**
 * 沙粒渲染器
 * 使用Three.js实现WebGL渲染
 */
class SandRenderer {
  /**
   * 创建沙粒渲染器
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {SandParticleSystem} particleSystem - 沙粒粒子系统
   * @param {Object} options - 配置选项
   */
  constructor(canvas, particleSystem, options = {}) {
    this.canvas = canvas;
    this.particleSystem = particleSystem;
    
    // 配置参数
    this.params = {
      quality: options.quality || 'medium', // low, medium, high
      glowIntensity: options.glowIntensity !== undefined ? options.glowIntensity : 0.8,
      bloomEnabled: options.bloomEnabled !== undefined ? options.bloomEnabled : true,
      backgroundDarkness: options.backgroundDarkness !== undefined ? options.backgroundDarkness : 0.95,
      showStats: options.showStats !== undefined ? options.showStats : false
    };
    
    // Three.js组件
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointsMaterial = null;
    this.pointsGeometry = null;
    this.points = null;
    this.composer = null;
    this.bloomPass = null;
    
    // 渲染状态
    this.isRunning = false;
    this.lastRenderTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateInterval = 500; // 更新FPS的时间间隔（毫秒）
    this.lastFpsUpdate = 0;
    
    // 初始化
    this._init();
  }
  
  /**
   * 初始化渲染器
   * @private
   */
  _init() {
    // 创建Three.js场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    const { width, height } = this.particleSystem.bounds;
    this.camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
    this.camera.position.z = 10;
    
    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // 创建粒子几何体
    this._createParticles();
    
    // 设置后期处理
    this._setupPostProcessing();
    
    // 添加窗口大小调整监听器
    window.addEventListener('resize', this.resize.bind(this));
  }
  
  /**
   * 创建粒子
   * @private
   */
  _createParticles() {
    const particleData = this.particleSystem.getParticleData();
    const maxParticles = this.particleSystem.params.maxParticles;
    
    // 创建粒子几何体
    this.pointsGeometry = new THREE.BufferGeometry();
    
    // 设置位置属性
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
    
    // 设置颜色属性
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
    
    // 设置大小属性
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1));
    
    // 设置不透明度属性
    this.pointsGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleData.opacities, 1));
    
    // 创建着色器材质
    const vertexShader = `
      attribute float size;
      attribute float opacity;
      varying vec3 vColor;
      varying float vOpacity;
      
      void main() {
        vColor = color;
        vOpacity = opacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      varying vec3 vColor;
      varying float vOpacity;
      
      void main() {
        // 计算到粒子中心的距离
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        // 创建圆形粒子
        float circle = smoothstep(0.5, 0.4, dist);
        
        // 创建发光效果
        float glow = exp(-dist * 6.0) * 0.5 + circle * 0.5;
        
        // 最终颜色
        vec3 color = vColor * (0.8 + glow * 0.5);
        float alpha = vOpacity * glow;
        
        if (alpha < 0.01) discard;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
    
    this.pointsMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      vertexColors: true
    });
    
    // 创建点精灵
    this.points = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.scene.add(this.points);
  }
  
  /**
   * 设置后期处理
   * @private
   */
  _setupPostProcessing() {
    // 创建效果合成器
    this.composer = new THREE.EffectComposer(this.renderer);
    
    // 添加渲染通道
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // 添加辉光通道
    this.bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(this.canvas.width, this.canvas.height),
      1.5,  // 强度
      0.4,  // 半径
      0.85  // 阈值
    );
    
    // 根据质量调整辉光参数
    this._updateBloomQuality();
    
    // 添加辉光通道
    if (this.params.bloomEnabled) {
      this.composer.addPass(this.bloomPass);
    }
  }
  
  /**
   * 根据质量更新辉光参数
   * @private
   */
  _updateBloomQuality() {
    if (!this.bloomPass) return;
    
    switch (this.params.quality) {
      case 'low':
        this.bloomPass.strength = 1.0;
        this.bloomPass.radius = 0.3;
        this.bloomPass.threshold = 0.9;
        break;
      case 'medium':
        this.bloomPass.strength = 1.5;
        this.bloomPass.radius = 0.4;
        this.bloomPass.threshold = 0.85;
        break;
      case 'high':
        this.bloomPass.strength = 2.0;
        this.bloomPass.radius = 0.5;
        this.bloomPass.threshold = 0.8;
        break;
    }
    
    // 应用发光强度
    this.bloomPass.strength *= this.params.glowIntensity;
  }
  
  /**
   * 更新粒子数据
   * @private
   */
  _updateParticles() {
    const particleData = this.particleSystem.getParticleData();
    const particles = particleData.particles;
    
    // 更新几何体属性
    const positionAttribute = this.pointsGeometry.getAttribute('position');
    const colorAttribute = this.pointsGeometry.getAttribute('color');
    const sizeAttribute = this.pointsGeometry.getAttribute('size');
    const opacityAttribute = this.pointsGeometry.getAttribute('opacity');
    
    // 标记属性需要更新
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
    opacityAttribute.needsUpdate = true;
    
    // 更新几何体边界
    this.pointsGeometry.computeBoundingSphere();
  }
  
  /**
   * 调整大小
   */
  resize() {
    const { width, height } = this.particleSystem.bounds;
    
    // 更新相机
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
    
    // 更新渲染器
    this.renderer.setSize(width, height);
    
    // 更新后期处理
    if (this.composer) {
      this.composer.setSize(width, height);
    }
    
    // 更新辉光通道
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }
  
  /**
   * 设置渲染质量
   * @param {string} quality - 渲染质量 (low, medium, high)
   */
  setQuality(quality) {
    if (quality !== this.params.quality) {
      this.params.quality = quality;
      this._updateBloomQuality();
    }
  }
  
  /**
   * 设置发光强度
   * @param {number} intensity - 发光强度 (0-1)
   */
  setGlowIntensity(intensity) {
    this.params.glowIntensity = clamp(intensity, 0, 1);
    this._updateBloomQuality();
  }
  
  /**
   * 启用或禁用辉光效果
   * @param {boolean} enabled - 是否启用
   */
  setBloomEnabled(enabled) {
    this.params.bloomEnabled = enabled;
    
    // 重新设置后期处理
    if (this.composer) {
      // 移除所有通道
      this.composer.passes = [];
      
      // 添加渲染通道
      const renderPass = new THREE.RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
      
      // 添加辉光通道
      if (enabled) {
        this.composer.addPass(this.bloomPass);
      }
    }
  }
  
  /**
   * 设置背景暗度
   * @param {number} darkness - 暗度 (0-1)
   */
  setBackgroundDarkness(darkness) {
    const value = clamp(darkness, 0, 1);
    const color = Math.round(255 * (1 - value));
    this.scene.background = new THREE.Color(color / 255, color / 255, color / 255);
  }
  
  /**
   * 渲染一帧
   * @param {number} timestamp - 当前时间戳
   */
  render(timestamp) {
    // 更新粒子数据
    this._updateParticles();
    
    // 使用效果合成器渲染
    if (this.composer && this.params.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    // 更新FPS
    this._updateFps(timestamp);
  }
  
  /**
   * 更新FPS计数器
   * @param {number} timestamp - 当前时间戳
   * @private
   */
  _updateFps(timestamp) {
    this.frameCount++;
    
    const now = timestamp || performance.now();
    const elapsed = now - this.lastFpsUpdate;
    
    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
  
  /**
   * 开始渲染循环
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastRenderTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
  }
  
  /**
   * 停止渲染循环
   */
  stop() {
    this.isRunning = false;
  }
  
  /**
   * 创建当前画布的快照
   * @returns {string} 图像数据URL
   */
  createSnapshot() {
    // 渲染一帧以确保最新状态
    if (this.composer && this.params.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    return this.renderer.domElement.toDataURL('image/png');
  }
  
  /**
   * 显示或隐藏统计信息
   * @param {boolean} show - 是否显示
   */
  showStats(show) {
    this.params.showStats = show;
  }
  
  /**
   * 获取渲染器状态
   * @returns {Object} 渲染器状态
   */
  getStats() {
    return {
      fps: this.fps,
      quality: this.params.quality,
      glowIntensity: this.params.glowIntensity,
      bloomEnabled: this.params.bloomEnabled
    };
  }
}
