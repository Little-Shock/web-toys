/**
 * 场景管理器
 * 负责创建和管理Three.js场景、相机和渲染器
 */
class SceneManager {
  /**
   * 创建场景管理器
   * @param {string} containerId - 容器元素ID
   * @param {ThreeBodySystem} system - 三体系统
   */
  constructor(containerId, system) {
    this.container = document.getElementById(containerId);
    this.system = system;

    // Three.js组件
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = null;

    // 轨道跟踪器
    this.orbitTracer = null;

    // 天体对象映射
    this.celestialObjects = new Map();

    // 显示选项
    this.showGrid = false;
    this.showTrails = true;
    this.showVectors = false;

    // 动画ID
    this.animationId = null;

    // 初始化场景
    this.init();
  }

  /**
   * 初始化Three.js场景
   */
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 20);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 创建轨道控制器
    const OrbitControls = THREE.OrbitControls;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;

    // 创建时钟
    this.clock = new THREE.Clock();

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    // 创建轨道跟踪器
    this.orbitTracer = new OrbitTracer(this.scene);

    // 创建网格
    this.createGrid();

    // 创建天体
    this.createCelestialBodies();

    // 添加窗口大小调整监听器
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 开始动画循环
    this.animate();
  }

  /**
   * 创建网格
   */
  createGrid() {
    try {
      // 创建网格辅助对象
      const gridSize = 20;
      const gridDivisions = 20;
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x555555, 0x222222);
      gridHelper.rotation.x = Math.PI / 2; // 旋转到XZ平面
      gridHelper.visible = this.showGrid;
      this.scene.add(gridHelper);
      this.gridHelper = gridHelper;

      // 创建坐标轴辅助对象
      const axesHelper = new THREE.AxesHelper(5);
      axesHelper.visible = this.showGrid;
      this.scene.add(axesHelper);
      this.axesHelper = axesHelper;
    } catch (error) {
      console.error('创建网格时出错:', error);
      // 继续执行，不要因为网格创建失败而中断整个应用
    }
  }

  /**
   * 创建天体
   */
  createCelestialBodies() {
    // 清除现有天体
    this.clearCelestialBodies();

    // 获取系统中的天体
    const bodies = this.system.getBodies();

    // 为每个天体创建3D对象
    for (const body of bodies) {
      this.createCelestialBody(body);
    }
  }

  /**
   * 创建单个天体的3D表示
   * @param {CelestialBody} body - 天体
   */
  createCelestialBody(body) {
    // 创建恒星材质
    const starMaterial = this.createStarMaterial(body.baseColor);

    // 创建恒星几何体
    const radius = body.radius;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    // 创建恒星网格
    const star = new THREE.Mesh(geometry, starMaterial);
    star.position.set(body.position.x, body.position.y, body.position.z);
    this.scene.add(star);

    // 创建发光效果
    const glow = this.createStarGlow(body.baseColor, radius * 2);
    star.add(glow);

    // 创建速度向量
    const velocityArrow = this.createVelocityArrow(body);
    velocityArrow.visible = this.showVectors;
    star.add(velocityArrow);

    // 存储对象引用
    this.celestialObjects.set(body, {
      star: star,
      glow: glow,
      velocityArrow: velocityArrow
    });

    // 设置天体的3D对象引用
    body.object3D = star;

    // 创建轨迹
    this.orbitTracer.createTrailForBody(body, body.baseColor);
  }

  /**
   * 创建恒星材质
   * @param {string} color - 恒星颜色
   * @returns {THREE.Material} 恒星材质
   */
  createStarMaterial(color) {
    // 创建基础材质
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5
    });

    return material;
  }

  /**
   * 创建恒星发光效果
   * @param {string} color - 恒星颜色
   * @param {number} size - 发光大小
   * @returns {THREE.Sprite} 发光精灵
   */
  createStarGlow(color, size) {
    // 创建发光纹理
    const glowTexture = this.createGlowTexture(color);

    // 创建精灵材质
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    // 创建精灵
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size, size, 1);

    return sprite;
  }

  /**
   * 创建发光纹理
   * @param {string} color - 颜色
   * @returns {THREE.Texture} 纹理
   */
  createGlowTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );

    // 创建从中心到边缘的渐变
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 创建速度向量箭头
   * @param {CelestialBody} body - 天体
   * @returns {THREE.Object3D} 箭头对象
   */
  createVelocityArrow(body) {
    // 创建箭头
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), // 方向将在更新时设置
      new THREE.Vector3(0, 0, 0), // 原点
      1, // 长度将在更新时设置
      0xffff00, // 黄色
      0.2, // 箭头头部长度
      0.1  // 箭头头部宽度
    );

    return arrowHelper;
  }

  /**
   * 更新速度向量箭头
   * @param {CelestialBody} body - 天体
   * @param {THREE.Object3D} arrow - 箭头对象
   */
  updateVelocityArrow(body, arrow) {
    // 获取速度向量
    const velocity = body.velocity;
    const speed = body.getSpeed();

    // 设置方向
    const direction = new THREE.Vector3(
      velocity.x / speed,
      velocity.y / speed,
      velocity.z / speed
    );

    // 设置长度（基于速度大小）
    const length = Math.min(3, Math.max(0.5, speed * 2));

    // 更新箭头
    arrow.setDirection(direction);
    arrow.setLength(length, 0.2 * length, 0.1 * length);
  }

  /**
   * 清除所有天体
   */
  clearCelestialBodies() {
    // 移除所有天体对象
    for (const [body, objects] of this.celestialObjects.entries()) {
      this.scene.remove(objects.star);
      body.object3D = null;
    }

    // 清除映射
    this.celestialObjects.clear();

    // 移除所有轨迹
    this.orbitTracer.removeAllTrails();
  }

  /**
   * 更新天体
   */
  updateCelestialBodies() {
    // 获取系统中的天体
    const bodies = this.system.getBodies();

    // 检查是否需要创建新的天体
    for (const body of bodies) {
      if (!this.celestialObjects.has(body)) {
        this.createCelestialBody(body);
      }
    }

    // 更新天体位置和速度向量
    for (const [body, objects] of this.celestialObjects.entries()) {
      // 更新位置
      objects.star.position.set(body.position.x, body.position.y, body.position.z);

      // 更新速度向量
      if (this.showVectors) {
        this.updateVelocityArrow(body, objects.velocityArrow);
      }
    }

    // 更新轨迹
    if (this.showTrails) {
      this.orbitTracer.update(bodies);
    }
  }

  /**
   * 设置轨迹长度
   * @param {number} length - 轨迹长度
   */
  setTrailLength(length) {
    this.orbitTracer.setMaxTrailLength(length);

    // 更新系统中天体的轨迹长度
    const bodies = this.system.getBodies();
    for (const body of bodies) {
      body.setMaxTrailLength(length);
    }
  }

  /**
   * 设置是否显示网格
   * @param {boolean} show - 是否显示
   */
  setShowGrid(show) {
    this.showGrid = show;
    if (this.gridHelper) {
      this.gridHelper.visible = show;
    }
    if (this.axesHelper) {
      this.axesHelper.visible = show;
    }
  }

  /**
   * 设置是否显示轨迹
   * @param {boolean} show - 是否显示
   */
  setShowTrails(show) {
    this.showTrails = show;
    this.orbitTracer.setVisible(show);
  }

  /**
   * 设置是否显示速度向量
   * @param {boolean} show - 是否显示
   */
  setShowVectors(show) {
    this.showVectors = show;

    // 更新所有速度向量的可见性
    for (const [_, objects] of this.celestialObjects.entries()) {
      objects.velocityArrow.visible = show;
    }
  }

  /**
   * 窗口大小调整处理函数
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 更新相机
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 更新渲染器
    this.renderer.setSize(width, height);
  }

  /**
   * 动画循环
   */
  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    try {
      // 获取时间增量
      const delta = this.clock.getDelta();

      // 更新系统
      this.system.update(delta);

      // 更新天体
      this.updateCelestialBodies();

      // 更新控制器
      this.controls.update();

      // 渲染场景
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('动画循环中出错:', error);
      // 继续执行，不要因为一帧渲染失败而中断整个应用
    }
  }

  /**
   * 停止动画循环
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 重置场景
   */
  reset() {
    // 清除天体
    this.clearCelestialBodies();

    // 创建新的天体
    this.createCelestialBodies();
  }
}
