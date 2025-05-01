/**
 * 粒子系统
 * 实现闪片效果
 */
class ParticleSystem {
  constructor() {
    this.particles = null;
    this.geometry = null;
    this.material = null;
    this.count = 1000; // 粒子数量
    this.positions = null;
    this.velocities = [];
    this.time = 0;
    this.params = {
      density: 0.6,    // 密度
      size: 0.3,       // 大小
      color: '#ffffff' // 颜色
    };
    this.forceX = 0;
    this.forceY = 0;
    this.forceZ = 0;
    this.forceDecay = 0.9; // 力的衰减系数
  }

  /**
   * 初始化粒子系统
   */
  async init() {
    // 创建几何体
    this.geometry = new THREE.BufferGeometry();

    // 计算粒子数量
    this.count = Math.floor(1000 * this.params.density);

    // 创建粒子位置
    this.positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);
    const angles = new Float32Array(this.count);

    const color = new THREE.Color(this.params.color);

    for (let i = 0; i < this.count; i++) {
      // 随机位置
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * 4; // x
      this.positions[i3 + 1] = (Math.random() - 0.5) * 4; // y
      this.positions[i3 + 2] = (Math.random() - 0.5) * 0.5; // z

      // 随机大小
      const size = Math.random() * this.params.size + 0.01;
      sizes[i] = size;

      // 随机颜色变化
      const hue = (color.getHSL({}).h + (Math.random() * 0.1 - 0.05)) % 1;
      const saturation = color.getHSL({}).s * (Math.random() * 0.2 + 0.9);
      const lightness = color.getHSL({}).l * (Math.random() * 0.2 + 0.9);

      const particleColor = new THREE.Color().setHSL(hue, saturation, lightness);

      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;

      // 随机角度
      angles[i] = Math.random() * Math.PI * 2;

      // 初始速度
      this.velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      });
    }

    // 设置属性
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));

    // 创建材质
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 30 * window.devicePixelRatio },
        uTexture: { value: this.createParticleTexture() }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 创建粒子系统
    this.particles = new THREE.Points(this.geometry, this.material);

    return this;
  }

  /**
   * 创建粒子纹理
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d');

    // 清除画布
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 随机选择粒子形状
    const shapeType = Math.random();

    // 中心点和基本尺寸
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseSize = canvas.width / 2 - 4;

    // 创建基本径向渐变
    const gradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseSize * 1.2
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;

    // 形状1：星形闪片 (30% 概率)
    if (shapeType < 0.3) {
      const outerRadius = baseSize;
      const innerRadius = outerRadius * 0.4;
      const spikes = 5 + Math.floor(Math.random() * 3); // 5-7个尖角

      // 绘制星形
      context.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = Math.PI * i / spikes;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();

      // 添加一些额外的闪光点
      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (let i = 0; i < 3; i++) {
        const size = 2 + Math.random() * 4;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }
    }
    // 形状2：菱形闪片 (30% 概率)
    else if (shapeType < 0.6) {
      const size = baseSize;

      // 绘制主菱形
      context.beginPath();
      context.moveTo(centerX, centerY - size);
      context.lineTo(centerX + size, centerY);
      context.lineTo(centerX, centerY + size);
      context.lineTo(centerX - size, centerY);
      context.closePath();
      context.fill();

      // 绘制交叉线
      context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(centerX - size * 0.7, centerY - size * 0.7);
      context.lineTo(centerX + size * 0.7, centerY + size * 0.7);
      context.moveTo(centerX + size * 0.7, centerY - size * 0.7);
      context.lineTo(centerX - size * 0.7, centerY + size * 0.7);
      context.stroke();
    }
    // 形状3：六边形闪片 (20% 概率)
    else if (shapeType < 0.8) {
      const size = baseSize * 0.9;
      const sides = 6;

      // 绘制六边形
      context.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides;
        const x = centerX + Math.cos(angle) * size;
        const y = centerY + Math.sin(angle) * size;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();

      // 添加内部图案
      context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      context.lineWidth = 1;

      // 绘制内部六边形
      context.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides + Math.PI / 6;
        const x = centerX + Math.cos(angle) * (size * 0.5);
        const y = centerY + Math.sin(angle) * (size * 0.5);

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.stroke();
    }
    // 形状4：三角形闪片 (20% 概率)
    else {
      const size = baseSize;

      // 绘制三角形
      context.beginPath();
      context.moveTo(centerX, centerY - size);
      context.lineTo(centerX + size * 0.866, centerY + size * 0.5); // cos(30°), sin(30°)
      context.lineTo(centerX - size * 0.866, centerY + size * 0.5);
      context.closePath();
      context.fill();

      // 添加内部图案
      context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      context.lineWidth = 1;

      // 绘制内部三角形
      context.beginPath();
      context.moveTo(centerX, centerY + size * 0.3);
      context.lineTo(centerX - size * 0.5, centerY - size * 0.25);
      context.lineTo(centerX + size * 0.5, centerY - size * 0.25);
      context.closePath();
      context.stroke();
    }

    // 添加光晕效果
    const glowGradient = context.createRadialGradient(
      centerX, centerY, baseSize * 0.5,
      centerX, centerY, baseSize * 1.5
    );

    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.globalCompositeOperation = 'screen';
    context.fillStyle = glowGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 创建纹理
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 获取顶点着色器代码
   */
  getVertexShader() {
    return `
      uniform float uTime;
      uniform float uSize;

      attribute float size;
      attribute vec3 color;
      attribute float angle;

      varying vec3 vColor;
      varying float vAngle;

      void main() {
        vColor = color;
        vAngle = angle + uTime * 0.5; // 随时间旋转

        // 计算位置
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        // 设置点大小
        gl_PointSize = size * uSize / -mvPosition.z;

        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  /**
   * 获取片元着色器代码
   */
  getFragmentShader() {
    return `
      uniform sampler2D uTexture;

      varying vec3 vColor;
      varying float vAngle;

      void main() {
        // 计算旋转后的UV坐标
        float c = cos(vAngle);
        float s = sin(vAngle);

        vec2 rotatedUV = vec2(
          c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,
          c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5
        );

        // 采样纹理
        vec4 texColor = texture2D(uTexture, rotatedUV);

        // 应用颜色
        gl_FragColor = vec4(vColor, 1.0) * texColor;
      }
    `;
  }

  /**
   * 更新参数
   */
  updateParams(params) {
    // 更新参数
    Object.assign(this.params, params);

    // 更新粒子大小
    if (this.geometry && params.size !== undefined) {
      const sizes = this.geometry.attributes.size.array;

      for (let i = 0; i < this.count; i++) {
        sizes[i] = Math.random() * this.params.size + 0.01;
      }

      this.geometry.attributes.size.needsUpdate = true;
    }

    // 更新粒子颜色
    if (this.geometry && params.color !== undefined) {
      const colors = this.geometry.attributes.color.array;
      const color = new THREE.Color(this.params.color);

      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;

        // 随机颜色变化
        const hue = (color.getHSL({}).h + (Math.random() * 0.1 - 0.05)) % 1;
        const saturation = color.getHSL({}).s * (Math.random() * 0.2 + 0.9);
        const lightness = color.getHSL({}).l * (Math.random() * 0.2 + 0.9);

        const particleColor = new THREE.Color().setHSL(hue, saturation, lightness);

        colors[i3] = particleColor.r;
        colors[i3 + 1] = particleColor.g;
        colors[i3 + 2] = particleColor.b;
      }

      this.geometry.attributes.color.needsUpdate = true;
    }

    // 更新粒子数量
    if (params.density !== undefined && this.count !== Math.floor(1000 * this.params.density)) {
      // 重新初始化粒子系统
      this.dispose();
      this.init();
    }

    return this;
  }

  /**
   * 应用外部力
   */
  applyForce(x, y, z) {
    this.forceX = x * 0.005; // 缩小力的影响
    this.forceY = y * 0.005;
    this.forceZ = z * 0.005;

    return this;
  }

  /**
   * 更新粒子系统
   */
  update(deltaTime = 0.016) {
    if (!this.particles) return this;

    // 更新时间
    this.time += deltaTime;
    this.material.uniforms.uTime.value = this.time;

    // 计算循环时间 (8-12秒循环，与流体同步)
    const cycleDuration = 10; // 10秒完整循环
    const cycleTime = (this.time % cycleDuration) / cycleDuration;

    // 更新粒子位置
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // 应用速度
      this.positions[i3] += this.velocities[i].x;
      this.positions[i3 + 1] += this.velocities[i].y;
      this.positions[i3 + 2] += this.velocities[i].z;

      // 应用外部力
      this.velocities[i].x += this.forceX;
      this.velocities[i].y += this.forceY;
      this.velocities[i].z += this.forceZ;

      // 添加周期性的微小波动，使闪片看起来更加闪烁
      const particleOffset = i * 0.1;
      const waveX = Math.sin(this.time * 2 + particleOffset) * 0.0005;
      const waveY = Math.cos(this.time * 1.5 + particleOffset) * 0.0005;
      const waveZ = Math.sin(this.time * 3 + particleOffset) * 0.0005;

      this.velocities[i].x += waveX;
      this.velocities[i].y += waveY;
      this.velocities[i].z += waveZ;

      // 边界检查 - 使用平滑的反弹
      const bounceStrength = 0.05; // 反弹强度
      const bounceDistance = 0.2; // 开始反弹的距离

      // X轴边界
      if (this.positions[i3] < -2 + bounceDistance) {
        const force = (-2 + bounceDistance - this.positions[i3]) * bounceStrength;
        this.velocities[i].x += force;
      } else if (this.positions[i3] > 2 - bounceDistance) {
        const force = (2 - bounceDistance - this.positions[i3]) * bounceStrength;
        this.velocities[i].x += force;
      }

      // Y轴边界
      if (this.positions[i3 + 1] < -2 + bounceDistance) {
        const force = (-2 + bounceDistance - this.positions[i3 + 1]) * bounceStrength;
        this.velocities[i].y += force;
      } else if (this.positions[i3 + 1] > 2 - bounceDistance) {
        const force = (2 - bounceDistance - this.positions[i3 + 1]) * bounceStrength;
        this.velocities[i].y += force;
      }

      // Z轴边界
      if (this.positions[i3 + 2] < -0.5 + bounceDistance * 0.5) {
        const force = (-0.5 + bounceDistance * 0.5 - this.positions[i3 + 2]) * bounceStrength * 2;
        this.velocities[i].z += force;
      } else if (this.positions[i3 + 2] > 0.5 - bounceDistance * 0.5) {
        const force = (0.5 - bounceDistance * 0.5 - this.positions[i3 + 2]) * bounceStrength * 2;
        this.velocities[i].z += force;
      }

      // 阻尼 - 基于循环时间变化，创造流体缓慢回落的效果
      const dampingFactor = 0.98 - Math.sin(cycleTime * Math.PI * 2) * 0.01;
      this.velocities[i].x *= dampingFactor;
      this.velocities[i].y *= dampingFactor;
      this.velocities[i].z *= dampingFactor;

      // 添加微小的重力效果，使粒子缓慢下落
      this.velocities[i].y -= 0.0001;
    }

    // 更新几何体
    this.geometry.attributes.position.needsUpdate = true;

    // 力的衰减 - 使用非线性衰减
    const nonLinearDecay = this.forceDecay * (1.0 - 0.1 * Math.abs(this.forceX + this.forceY + this.forceZ));

    this.forceX *= nonLinearDecay;
    this.forceY *= nonLinearDecay;
    this.forceZ *= nonLinearDecay;

    // 当力接近零时，完全清零以避免微小残留
    const forceMagnitude = Math.abs(this.forceX) + Math.abs(this.forceY) + Math.abs(this.forceZ);
    if (forceMagnitude < 0.001) {
      this.forceX = 0;
      this.forceY = 0;
      this.forceZ = 0;
    }

    // 更新爆发粒子
    if (this.burstParticles && this.burstParticles.length > 0) {
      this.updateBurstParticles();
    }

    return this;
  }

  /**
   * 重置粒子系统
   */
  reset() {
    this.time = 0;
    this.forceX = 0;
    this.forceY = 0;
    this.forceZ = 0;

    // 重置粒子位置和速度
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // 随机位置
      this.positions[i3] = (Math.random() - 0.5) * 4;
      this.positions[i3 + 1] = (Math.random() - 0.5) * 4;
      this.positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

      // 重置速度
      this.velocities[i] = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      };
    }

    // 更新几何体
    this.geometry.attributes.position.needsUpdate = true;

    return this;
  }

  /**
   * 获取粒子系统网格
   */
  getMesh() {
    return this.particles;
  }

  /**
   * 创建粒子爆发效果
   * @param {number} x - 爆发中心x坐标 (-1到1)
   * @param {number} y - 爆发中心y坐标 (-1到1)
   * @param {number} count - 爆发粒子数量
   */
  createBurst(x, y, count = 20) {
    // 如果没有粒子系统，则不处理
    if (!this.particles) return this;

    // 创建临时粒子
    const burstParticles = [];

    // 将归一化坐标转换为场景坐标
    const positionX = x * 2; // 转换到场景坐标系
    const positionY = y * 2;

    // 创建爆发粒子
    for (let i = 0; i < count; i++) {
      // 随机角度
      const angle = Math.random() * Math.PI * 2;
      // 随机速度
      const speed = Math.random() * 0.1 + 0.05;
      // 随机大小
      const size = Math.random() * this.params.size * 1.5 + 0.02;
      // 随机寿命 (1-3秒)
      const lifetime = Math.random() * 2000 + 1000;

      // 计算速度向量
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const vz = (Math.random() - 0.5) * 0.05;

      // 创建粒子
      burstParticles.push({
        position: { x: positionX, y: positionY, z: 0 },
        velocity: { x: vx, y: vy, z: vz },
        size: size,
        color: new THREE.Color(this.params.color),
        createdAt: Date.now(),
        lifetime: lifetime
      });
    }

    // 添加到临时粒子数组
    this.burstParticles = this.burstParticles || [];
    this.burstParticles.push(...burstParticles);

    // 创建或更新爆发粒子系统
    this.updateBurstParticles();

    return this;
  }

  /**
   * 更新爆发粒子系统
   */
  updateBurstParticles() {
    // 如果没有爆发粒子，则不处理
    if (!this.burstParticles || this.burstParticles.length === 0) return;

    // 当前时间
    const now = Date.now();

    // 过滤掉已经过期的粒子
    this.burstParticles = this.burstParticles.filter(particle => {
      return now - particle.createdAt < particle.lifetime;
    });

    // 如果没有粒子了，则清除爆发粒子系统
    if (this.burstParticles.length === 0) {
      if (this.burstParticlesSystem) {
        this.scene.remove(this.burstParticlesSystem);
        this.burstParticlesSystem = null;
      }
      return;
    }

    // 创建或更新几何体
    const positions = new Float32Array(this.burstParticles.length * 3);
    const sizes = new Float32Array(this.burstParticles.length);
    const colors = new Float32Array(this.burstParticles.length * 3);
    const angles = new Float32Array(this.burstParticles.length);

    // 更新粒子属性
    for (let i = 0; i < this.burstParticles.length; i++) {
      const particle = this.burstParticles[i];
      const i3 = i * 3;

      // 更新位置
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.position.z += particle.velocity.z;

      // 添加重力效果
      particle.velocity.y -= 0.001;

      // 添加阻力
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
      particle.velocity.z *= 0.98;

      // 设置位置
      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;

      // 计算生命周期因子 (0-1)
      const lifeFactor = 1 - (now - particle.createdAt) / particle.lifetime;

      // 设置大小 (随生命周期减小)
      sizes[i] = particle.size * lifeFactor;

      // 设置颜色
      colors[i3] = particle.color.r;
      colors[i3 + 1] = particle.color.g;
      colors[i3 + 2] = particle.color.b;

      // 设置角度 (随机旋转)
      angles[i] = Math.random() * Math.PI * 2;
    }

    // 创建或更新几何体
    if (!this.burstGeometry) {
      this.burstGeometry = new THREE.BufferGeometry();
    }

    this.burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.burstGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.burstGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.burstGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));

    // 创建或更新材质
    if (!this.burstMaterial) {
      this.burstMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 30 * window.devicePixelRatio },
          uTexture: { value: this.createParticleTexture() }
        },
        vertexShader: this.getVertexShader(),
        fragmentShader: this.getFragmentShader(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
    }

    // 更新时间
    this.burstMaterial.uniforms.uTime.value = this.time;

    // 创建或更新粒子系统
    if (!this.burstParticlesSystem) {
      this.burstParticlesSystem = new THREE.Points(this.burstGeometry, this.burstMaterial);
      if (this.particles && this.particles.parent) {
        this.particles.parent.add(this.burstParticlesSystem);
      }
    }
  }

  /**
   * 销毁粒子系统
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
      if (this.material.uniforms.uTexture.value) {
        this.material.uniforms.uTexture.value.dispose();
      }
    }

    if (this.burstGeometry) {
      this.burstGeometry.dispose();
    }

    if (this.burstMaterial) {
      this.burstMaterial.dispose();
      if (this.burstMaterial.uniforms.uTexture.value) {
        this.burstMaterial.uniforms.uTexture.value.dispose();
      }
    }

    return this;
  }
}
