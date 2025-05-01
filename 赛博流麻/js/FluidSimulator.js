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
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide
    });

    // 创建网格
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    return this;
  }

  /**
   * 获取顶点着色器代码
   */
  getVertexShader() {
    return `
      uniform float uTime;
      uniform float uViscosity;
      uniform float uSpeed;
      uniform vec3 uForce;

      varying vec2 vUv;
      varying float vElevation;

      // 噪声函数
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        // 计算网格单元坐标
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        // 计算四面体中的其他三个顶点
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        // 排列
        i = mod289(i);
        vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        // 梯度
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        // 归一化梯度
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // 混合
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      void main() {
        vUv = uv;

        // 计算时间因子
        float t = uTime * uSpeed;

        // 应用外部力
        vec3 forceOffset = uForce * 0.1;

        // 基于噪声的波动
        float noiseFreq = 0.8;
        float noiseAmp = 0.4 * (1.0 - uViscosity); // 粘度越高，波动越小

        // 计算多层噪声
        float noise1 = snoise(vec3(position.x * noiseFreq + forceOffset.x,
                                   position.y * noiseFreq + forceOffset.y,
                                   t)) * noiseAmp;

        float noise2 = snoise(vec3(position.x * noiseFreq * 2.0 - t,
                                   position.y * noiseFreq * 2.0,
                                   t * 0.5 + forceOffset.z)) * noiseAmp * 0.5;

        // 组合噪声
        float elevation = noise1 + noise2;

        // 应用到顶点
        vec3 newPosition = position;
        newPosition.z += elevation;

        vElevation = elevation;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;
  }

  /**
   * 获取片元着色器代码
   */
  getFragmentShader() {
    return `
      uniform sampler2D uTexture;
      uniform vec3 uColor;

      varying vec2 vUv;
      varying float vElevation;

      void main() {
        // 基础颜色
        vec3 baseColor = uColor;

        // 如果有纹理，则混合纹理颜色
        vec4 textureColor = texture2D(uTexture, vUv);

        // 基于高度的颜色变化
        float colorIntensity = smoothstep(-0.2, 0.4, vElevation) * 0.8 + 0.2;

        // 混合颜色
        vec3 finalColor = mix(baseColor, textureColor.rgb, 0.6);
        finalColor = mix(finalColor * 0.7, finalColor, colorIntensity);

        // 透明度基于高度和纹理
        float alpha = smoothstep(-0.2, 0.2, vElevation) * 0.7 + 0.3;
        alpha *= textureColor.a;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;
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
