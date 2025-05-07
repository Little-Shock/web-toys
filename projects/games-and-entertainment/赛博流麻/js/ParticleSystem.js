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
    this.burstParticles = []; // 爆发粒子数组
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
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
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
    if (this.burstParticles.length > 0) {
      this.updateBurstParticles(deltaTime);
    }

    return this;
  }

  /**
   * 创建粒子爆发效果
   * @param {number} x - 爆发中心x坐标 (-1到1)
   * @param {number} y - 爆发中心y坐标 (-1到1)
   * @param {number} count - 粒子数量
   */
  createBurst(x, y, count = 50) {
    // 创建爆发粒子
    const burstGeometry = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(count * 3);
    const burstSizes = new Float32Array(count);
    const burstColors = new Float32Array(count * 3);
    const burstAngles = new Float32Array(count);
    const burstVelocities = [];
    const burstLifetimes = new Float32Array(count);

    // 转换坐标到3D空间
    const positionX = x * 2;
    const positionY = y * 2;
    const positionZ = 0;

    // 基础颜色
    const color = new THREE.Color(this.params.color);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 初始位置（爆发中心）
      burstPositions[i3] = positionX;
      burstPositions[i3 + 1] = positionY;
      burstPositions[i3 + 2] = positionZ;

      // 随机大小
      burstSizes[i] = Math.random() * 0.2 + 0.05;

      // 随机颜色变化
      const hue = (color.getHSL({}).h + (Math.random() * 0.2 - 0.1)) % 1;
      const saturation = color.getHSL({}).s * (Math.random() * 0.2 + 0.9);
      const lightness = color.getHSL({}).l * (Math.random() * 0.2 + 0.9);

      const particleColor = new THREE.Color().setHSL(hue, saturation, lightness);

      burstColors[i3] = particleColor.r;
      burstColors[i3 + 1] = particleColor.g;
      burstColors[i3 + 2] = particleColor.b;

      // 随机角度
      burstAngles[i] = Math.random() * Math.PI * 2;

      // 随机速度（向外爆发）
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.1 + 0.05;
      burstVelocities.push({
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
        z: (Math.random() - 0.5) * 0.05
      });

      // 随机生命周期
      burstLifetimes[i] = Math.random() * 1.5 + 0.5; // 0.5到2秒
    }

    // 设置属性
    burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    burstGeometry.setAttribute('size', new THREE.BufferAttribute(burstSizes, 1));
    burstGeometry.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));
    burstGeometry.setAttribute('angle', new THREE.BufferAttribute(burstAngles, 1));

    // 创建材质
    const burstMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 30 * window.devicePixelRatio },
        uTexture: { value: this.createParticleTexture() }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 创建粒子系统
    const burstParticles = new THREE.Points(burstGeometry, burstMaterial);

    // 添加到场景
    if (this.particles && this.particles.parent) {
      this.particles.parent.add(burstParticles);
    }

    // 添加到爆发粒子数组
    this.burstParticles.push({
      mesh: burstParticles,
      geometry: burstGeometry,
      material: burstMaterial,
      velocities: burstVelocities,
      lifetimes: burstLifetimes,
      age: 0
    });

    return this;
  }

  /**
   * 更新爆发粒子
   */
  updateBurstParticles(deltaTime) {
    for (let b = this.burstParticles.length - 1; b >= 0; b--) {
      const burst = this.burstParticles[b];
      
      // 更新年龄
      burst.age += deltaTime;
      
      // 更新材质时间
      burst.material.uniforms.uTime.value = burst.age;
      
      // 更新位置
      const positions = burst.geometry.attributes.position.array;
      const sizes = burst.geometry.attributes.size.array;
      const colors = burst.geometry.attributes.color.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        
        // 应用速度
        positions[i3] += burst.velocities[i].x;
        positions[i3 + 1] += burst.velocities[i].y;
        positions[i3 + 2] += burst.velocities[i].z;
        
        // 应用重力
        burst.velocities[i].y -= 0.001;
        
        // 应用阻尼
        burst.velocities[i].x *= 0.98;
        burst.velocities[i].y *= 0.98;
        burst.velocities[i].z *= 0.98;
        
        // 基于生命周期缩小粒子
        const lifeRatio = Math.max(0, 1 - burst.age / burst.lifetimes[i]);
        sizes[i] *= lifeRatio > 0.9 ? 1 : 0.99;
        
        // 基于生命周期淡出颜色
        if (lifeRatio < 0.3) {
          const fadeRatio = lifeRatio / 0.3;
          colors[i3 + 3] = fadeRatio; // Alpha
        }
      }
      
      // 更新几何体
      burst.geometry.attributes.position.needsUpdate = true;
      burst.geometry.attributes.size.needsUpdate = true;
      burst.geometry.attributes.color.needsUpdate = true;
      
      // 检查是否所有粒子都已经消失
      if (burst.age > 2) { // 最大生命周期
        // 从场景中移除
        if (burst.mesh.parent) {
          burst.mesh.parent.remove(burst.mesh);
        }
        
        // 释放资源
        burst.geometry.dispose();
        burst.material.dispose();
        
        // 从数组中移除
        this.burstParticles.splice(b, 1);
      }
    }
  }

  /**
   * 重置粒子系统
   */
  reset() {
    this.time = 0;
    this.forceX = 0;
    this.forceY = 0;
    this.forceZ = 0;

    // 清除所有爆发粒子
    for (const burst of this.burstParticles) {
      if (burst.mesh.parent) {
        burst.mesh.parent.remove(burst.mesh);
      }
      burst.geometry.dispose();
      burst.material.dispose();
    }
    this.burstParticles = [];

    return this;
  }

  /**
   * 获取网格对象
   */
  getMesh() {
    return this.particles;
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
    }

    // 清除所有爆发粒子
    for (const burst of this.burstParticles) {
      if (burst.mesh.parent) {
        burst.mesh.parent.remove(burst.mesh);
      }
      burst.geometry.dispose();
      burst.material.dispose();
    }
    this.burstParticles = [];

    return this;
  }
}
