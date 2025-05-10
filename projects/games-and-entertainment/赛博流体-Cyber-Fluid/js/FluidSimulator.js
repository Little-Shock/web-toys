/**
 * 流体模拟器
 * 使用WebGL着色器实现流体动态效果
 */
class FluidSimulator {
  constructor() {
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.baseTexture = null;
    this.time = 0;
    this.params = {
      viscosity: 0.5,  // 粘度
      speed: 0.4,      // 速度
      color: '#00a0ff' // 颜色
    };
    this.forceX = 0;
    this.forceY = 0;
    this.forceZ = 0;
    this.forceDecay = 0.95; // 力的衰减系数
  }

  /**
   * 初始化流体模拟器
   */
  async init() {
    // 创建平面几何体
    this.geometry = new THREE.PlaneGeometry(4, 4, 64, 64);

    // 创建着色器材质
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: null },
        uViscosity: { value: this.params.viscosity },
        uSpeed: { value: this.params.speed },
        uColor: { value: new THREE.Color(this.params.color) },
        uForce: { value: new THREE.Vector3(0, 0, 0) }
      },
      vertexShader: fluidVertexShader,
      fragmentShader: fluidFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });

    // 创建网格
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    return this;
  }

  /**
   * 设置基础纹理
   */
  setBaseTexture(texture) {
    this.baseTexture = texture;
    this.material.uniforms.uTexture.value = texture;
    return this;
  }

  /**
   * 更新参数
   */
  updateParams(params) {
    // 更新参数
    Object.assign(this.params, params);

    // 更新着色器uniforms
    if (this.material) {
      this.material.uniforms.uViscosity.value = this.params.viscosity;
      this.material.uniforms.uSpeed.value = this.params.speed;

      if (params.color) {
        this.material.uniforms.uColor.value = new THREE.Color(this.params.color);
      }
    }

    return this;
  }

  /**
   * 应用外部力
   */
  applyForce(x, y, z) {
    this.forceX = x * 0.1; // 缩小力的影响
    this.forceY = y * 0.1;
    this.forceZ = z * 0.1;

    return this;
  }

  /**
   * 更新流体模拟
   */
  update(deltaTime = 0.016) {
    if (!this.material) return this;

    // 更新时间
    this.time += deltaTime;

    // 计算循环时间 (8-12秒循环)
    const cycleDuration = 10; // 10秒完整循环
    const cycleTime = (this.time % cycleDuration) / cycleDuration;

    // 使用平滑的循环时间值
    const smoothCycleTime = cycleTime < 0.5
      ? 4 * cycleTime * cycleTime * cycleTime
      : 1 - Math.pow(-2 * cycleTime + 2, 3) / 2;

    // 应用到着色器
    this.material.uniforms.uTime.value = smoothCycleTime * Math.PI * 2; // 0到2π的循环

    // 更新力
    this.material.uniforms.uForce.value.set(
      this.forceX,
      this.forceY,
      this.forceZ
    );

    // 力的衰减 - 使用非线性衰减以避免气泡滞留
    const nonLinearDecay = this.forceDecay * (1.0 - 0.2 * Math.abs(this.forceX + this.forceY + this.forceZ));

    this.forceX *= nonLinearDecay;
    this.forceY *= nonLinearDecay;
    this.forceZ *= nonLinearDecay;

    // 当力接近零时，完全清零以避免微小残留
    const forceMagnitude = Math.abs(this.forceX) + Math.abs(this.forceY) + Math.abs(this.forceZ);
    if (forceMagnitude < 0.01) {
      this.forceX = 0;
      this.forceY = 0;
      this.forceZ = 0;
    }

    return this;
  }

  /**
   * 重置流体模拟器
   */
  reset() {
    this.time = 0;
    this.forceX = 0;
    this.forceY = 0;
    this.forceZ = 0;

    if (this.material) {
      this.material.uniforms.uTime.value = 0;
      this.material.uniforms.uForce.value.set(0, 0, 0);
    }

    return this;
  }

  /**
   * 获取网格对象
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * 创建波纹效果
   * @param {number} x - 波纹中心x坐标 (-1到1)
   * @param {number} y - 波纹中心y坐标 (-1到1)
   * @param {number} strength - 波纹强度 (0到1)
   */
  createRipple(x, y, strength = 0.5) {
    // 如果没有网格，则不处理
    if (!this.mesh) return this;

    // 将归一化坐标转换为网格坐标
    const positionX = x * 2; // 转换到网格坐标系
    const positionY = y * 2;

    // 应用波纹力
    const rippleForce = strength * 0.5;

    // 创建向外扩散的力
    // 这里我们使用一个简单的方法：在波纹中心施加一个脉冲力
    this.applyForce(
      positionX * rippleForce,
      positionY * rippleForce,
      rippleForce
    );

    // 添加一个额外的随机扰动，使波纹看起来更自然
    this.material.uniforms.uTime.value += Math.random() * 0.01;

    return this;
  }

  /**
   * 销毁流体模拟器
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    return this;
  }
}
