/**
 * 粒子游泳 - Particle System
 * 粒子系统实现
 */

class Particle {
  constructor(x, y, initialHue) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 2.5));
    this.acc = createVector(0, 0);
    this.lifespan = random(120, 240);
    this.age = 0;
    this.baseSize = random(4, 10);
    this.oscillationSpeed = random(0.05, 0.15);
    this.oscillationOffset = random(TWO_PI);
    this.hue = (initialHue + random(-20, 20) + 360) % 360;
    this.saturation = random(70, 90);
    this.brightness = 100;
    this.currentAlphaMapped = 100;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // 鼠标/触摸交互 - 排斥力
    let mousePos = createVector(mouseX, mouseY);
    let dirFromMouse = p5.Vector.sub(this.pos, mousePos);
    let distToMouseSq = dirFromMouse.magSq();

    if (distToMouseSq < 100 * 100) {
      let repulsionStrength = map(sqrt(distToMouseSq), 0, 100, 0.3, 0);
      dirFromMouse.normalize().mult(repulsionStrength);
      this.applyForce(dirFromMouse);
    }

    // 随机游走力
    let wanderForce = p5.Vector.random2D().mult(0.05);
    this.applyForce(wanderForce);

    // 物理更新
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.limit(3);
    this.vel.mult(0.985);

    // 边界处理 - 环绕
    if (this.pos.x > width + this.baseSize) this.pos.x = -this.baseSize;
    if (this.pos.x < -this.baseSize) this.pos.x = width + this.baseSize;
    if (this.pos.y > height + this.baseSize) this.pos.y = -this.baseSize;
    if (this.pos.y < -this.baseSize) this.pos.y = height + this.baseSize;

    // 生命周期更新
    this.age++;
    let lifeRatio = this.age / this.lifespan;
    this.currentAlphaMapped = 100 * pow(1 - lifeRatio, 1.5);
  }

  display() {
    // 大小脉动
    let sizePulse = sin(this.age * this.oscillationSpeed + this.oscillationOffset + this.pos.x * 0.005) * (this.baseSize * 0.4);
    let currentSize = this.baseSize + sizePulse;
    
    // 绘制粒子
    fill(this.hue, this.saturation, this.brightness, this.currentAlphaMapped);
    noStroke();
    ellipse(this.pos.x, this.pos.y, currentSize, currentSize);
  }

  isDead() {
    return this.age >= this.lifespan;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 300;
    this.currentBgHue = 0;
    this.hueSpeed = 0.15;
    this.bgSaturation = 80;
    this.bgBrightness = 80;
    
    // 移动设备检测和优化
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (this.isMobile) {
      this.maxParticles = 150; // 移动设备减少粒子数量
    }
  }

  update() {
    // 更新背景色相
    this.currentBgHue = (frameCount * this.hueSpeed) % 360;
    
    // 更新所有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    // 自动添加粒子
    if (frameCount % 8 == 0 && this.particles.length < this.maxParticles * 0.75) {
      let x = random(width);
      let y = random(height);
      if (this.particles.length < this.maxParticles) {
        this.particles.push(new Particle(x, y, this.currentBgHue));
      }
    }
  }

  display() {
    // 设置背景色
    background(this.currentBgHue, this.bgSaturation, this.bgBrightness);
    
    // 设置混合模式
    blendMode(ADD);
    
    // 绘制所有粒子
    for (let particle of this.particles) {
      particle.display();
    }
    
    // 恢复默认混合模式
    blendMode(BLEND);
  }

  addParticles(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length < this.maxParticles) {
        this.particles.push(new Particle(x, y, this.currentBgHue));
      } else {
        break;
      }
    }
  }
  
  // 设置最大粒子数
  setMaxParticles(count) {
    this.maxParticles = count;
    // 如果当前粒子数超过新的最大值，移除多余粒子
    while (this.particles.length > this.maxParticles) {
      this.particles.pop();
    }
  }
  
  // 设置背景色相变化速度
  setHueSpeed(speed) {
    this.hueSpeed = speed;
  }
  
  // 设置背景饱和度
  setBgSaturation(saturation) {
    this.bgSaturation = saturation;
  }
  
  // 设置背景亮度
  setBgBrightness(brightness) {
    this.bgBrightness = brightness;
  }
}
