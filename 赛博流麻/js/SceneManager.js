/**
 * 场景管理器
 * 负责创建和管理Three.js场景、相机和渲染器
 */
class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.clock = new THREE.Clock();
    this.animationId = null;
    this.controls = null;
  }

  /**
   * 初始化Three.js场景
   */
  async init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      60, // 视野角度
      this.width / this.height, // 宽高比
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    this.camera.position.z = 5;

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能
    this.renderer.setClearColor(0x000000, 0); // 透明背景

    // 启用阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 添加到DOM
    this.container.appendChild(this.renderer.domElement);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 添加主光源 - 从右上方照射
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;

    // 配置阴影
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.bias = -0.0005;

    this.scene.add(mainLight);

    // 添加辅助光源 - 从左下方照射，创造更好的光影效果
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.4); // 蓝色调光源
    fillLight.position.set(-5, -2, 3);
    this.scene.add(fillLight);

    // 添加背光 - 从后方照射，增强轮廓感
    const backLight = new THREE.DirectionalLight(0xffaa00, 0.3); // 暖色调光源
    backLight.position.set(0, 0, -5);
    this.scene.add(backLight);

    // 添加点光源 - 增强闪片效果
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 2, 3);
    this.scene.add(pointLight);

    // 创建背景 - 添加渐变背景
    this.createBackground();

    // 添加相机控制
    this.setupControls();

    // 添加视差效果
    this.setupParallaxEffect();

    return this;
  }

  /**
   * 创建渐变背景
   */
  createBackground() {
    // 创建渐变背景平面
    const bgGeometry = new THREE.PlaneGeometry(20, 20);
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color(0x0a0a20) },
        colorBottom: { value: new THREE.Color(0x1a1a30) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
        }
      `,
      side: THREE.BackSide
    });

    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.z = -5;
    this.scene.add(background);

    // 添加一些背景星星
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 200;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsSizes = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      starsPositions[i3] = (Math.random() - 0.5) * 20;
      starsPositions[i3 + 1] = (Math.random() - 0.5) * 20;
      starsPositions[i3 + 2] = -4 - Math.random() * 2;

      starsSizes[i] = Math.random() * 0.1 + 0.02;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1));

    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying float vSize;
        uniform float time;

        void main() {
          vSize = size;
          // 添加微小的闪烁效果
          float flicker = sin(time * 3.0 + position.x * 100.0) * 0.5 + 0.5;
          gl_PointSize = size * 100.0 * flicker;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vSize;

        void main() {
          // 创建圆形点
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

          // 添加发光效果
          vec3 color = vec3(0.9, 0.9, 1.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
    this.stars = stars; // 保存引用以便在渲染循环中更新
  }

  /**
   * 设置视差效果
   */
  setupParallaxEffect() {
    // 使用设备方向或鼠标移动创建视差效果
    this.parallaxStrength = 0.1; // 视差强度
    this.targetRotation = { x: 0, y: 0 }; // 目标旋转角度
    this.currentRotation = { x: 0, y: 0 }; // 当前旋转角度

    // 添加鼠标移动监听
    this.container.addEventListener('mousemove', (event) => {
      // 将鼠标位置归一化为 -1 到 1 的范围
      const x = (event.clientX / this.width) * 2 - 1;
      const y = (event.clientY / this.height) * 2 - 1;

      // 设置目标旋转角度
      this.targetRotation.x = -y * this.parallaxStrength;
      this.targetRotation.y = x * this.parallaxStrength;
    });

    // 添加触摸移动监听
    this.container.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1) {
        // 将触摸位置归一化为 -1 到 1 的范围
        const x = (event.touches[0].clientX / this.width) * 2 - 1;
        const y = (event.touches[0].clientY / this.height) * 2 - 1;

        // 设置目标旋转角度
        this.targetRotation.x = -y * this.parallaxStrength;
        this.targetRotation.y = x * this.parallaxStrength;
      }
    });
  }

  /**
   * 设置相机控制
   */
  setupControls() {
    // 使用OrbitControls需要导入THREE.OrbitControls
    // 这里假设已经通过CDN或其他方式导入
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true; // 添加阻尼效果
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.5;
      this.controls.enableZoom = false; // 禁用缩放

      // 限制旋转角度
      this.controls.minPolarAngle = Math.PI / 4; // 45度
      this.controls.maxPolarAngle = Math.PI / 2; // 90度

      // 限制水平旋转
      this.controls.minAzimuthAngle = -Math.PI / 4; // -45度
      this.controls.maxAzimuthAngle = Math.PI / 4; // 45度
    } else {
      console.warn('THREE.OrbitControls未定义，跳过控制器设置');
    }
  }

  /**
   * 添加对象到场景
   */
  addToScene(object) {
    this.scene.add(object);
    return this;
  }

  /**
   * 从场景移除对象
   */
  removeFromScene(object) {
    this.scene.remove(object);
    return this;
  }

  /**
   * 更新场景尺寸
   */
  updateSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 更新相机
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // 更新渲染器
    this.renderer.setSize(this.width, this.height);

    return this;
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop(updateCallback) {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // 获取时间增量
      const deltaTime = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // 更新控制器
      if (this.controls) {
        this.controls.update();
      }

      // 更新视差效果
      if (this.targetRotation && this.currentRotation) {
        // 平滑过渡到目标旋转角度
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

        // 应用旋转
        this.scene.rotation.x = this.currentRotation.x;
        this.scene.rotation.y = this.currentRotation.y;
      }

      // 更新背景星星
      if (this.stars && this.stars.material.uniforms) {
        this.stars.material.uniforms.time.value = elapsedTime;
      }

      // 执行更新回调
      if (typeof updateCallback === 'function') {
        updateCallback(deltaTime);
      }

      // 渲染场景
      this.renderer.render(this.scene, this.camera);
    };

    animate();
    return this;
  }

  /**
   * 停止渲染循环
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    return this;
  }

  /**
   * 截取当前场景图像
   */
  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * 销毁场景管理器
   */
  dispose() {
    this.stopRenderLoop();

    // 清空场景
    while(this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      // 释放几何体和材质
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }

    // 释放渲染器
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    // 释放控制器
    if (this.controls) {
      this.controls.dispose();
    }

    return this;
  }
}
