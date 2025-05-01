/**
 * 流体模拟器
 * 基于Navier-Stokes方程的简化版本，用于模拟墨水在纸上的扩散效果
 */
class FluidSimulation {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    
    // 流体属性
    this.density = 0.7;      // 墨水浓度
    this.diffusion = 0.5;    // 扩散速度
    this.viscosity = 0.5;    // 粘度
    this.dt = 0.1;           // 时间步长
    this.iterations = 4;     // 求解迭代次数
    
    // 纸张属性
    this.absorption = 0.6;   // 纸张吸水性
    this.paperType = 'rice'; // 纸张类型
    
    // 流体网格
    this.density0 = new Float32Array(this.size);  // 当前密度
    this.density1 = new Float32Array(this.size);  // 下一步密度
    this.vx0 = new Float32Array(this.size);       // 当前x方向速度
    this.vx1 = new Float32Array(this.size);       // 下一步x方向速度
    this.vy0 = new Float32Array(this.size);       // 当前y方向速度
    this.vy1 = new Float32Array(this.size);       // 下一步y方向速度
    
    // 墨水颜色
    this.inkColors = {
      black: { r: 0, g: 0, b: 0, a: 1 },
      blue: { r: 0, g: 71, b: 171, a: 1 },
      red: { r: 139, g: 0, b: 0, a: 1 },
      green: { r: 0, g: 100, b: 0, a: 1 }
    };
    this.currentInk = 'black';
    
    // 纸张纹理影响
    this.paperTextures = {
      rice: { roughness: 0.2, absorption: 1.0 },
      rough: { roughness: 0.6, absorption: 0.8 },
      smooth: { roughness: 0.1, absorption: 0.6 },
      absorbent: { roughness: 0.3, absorption: 1.5 }
    };
    
    // 重力影响
    this.gravityX = 0;
    this.gravityY = 0;
    
    // 初始化
    this.clear();
  }
  
  /**
   * 清除流体状态
   */
  clear() {
    for (let i = 0; i < this.size; i++) {
      this.density0[i] = 0;
      this.density1[i] = 0;
      this.vx0[i] = 0;
      this.vx1[i] = 0;
      this.vy0[i] = 0;
      this.vy1[i] = 0;
    }
  }
  
  /**
   * 设置流体参数
   */
  setParameters(params) {
    if (params.density !== undefined) this.density = params.density;
    if (params.diffusion !== undefined) this.diffusion = params.diffusion;
    if (params.viscosity !== undefined) this.viscosity = params.viscosity;
    if (params.absorption !== undefined) this.absorption = params.absorption;
    if (params.paperType !== undefined) this.paperType = params.paperType;
    if (params.inkType !== undefined) this.currentInk = params.inkType;
  }
  
  /**
   * 设置重力影响
   */
  setGravity(x, y) {
    this.gravityX = x;
    this.gravityY = y;
  }
  
  /**
   * 添加墨水
   */
  addInk(x, y, amount, velocityX, velocityY, radius = 5) {
    // 确保坐标在有效范围内
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    const centerIndex = Math.floor(y) * this.width + Math.floor(x);
    const r2 = radius * radius;
    
    // 在半径范围内添加墨水和速度
    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        const distance2 = i * i + j * j;
        if (distance2 > r2) continue;
        
        const posX = Math.floor(x + i);
        const posY = Math.floor(y + j);
        
        if (posX < 0 || posX >= this.width || posY < 0 || posY >= this.height) continue;
        
        const index = posY * this.width + posX;
        
        // 根据距离中心的远近计算影响因子
        const factor = (1 - Math.sqrt(distance2) / radius);
        
        // 添加墨水
        this.density0[index] += amount * factor;
        
        // 添加速度
        this.vx0[index] += velocityX * factor;
        this.vy0[index] += velocityY * factor;
      }
    }
  }
  
  /**
   * 添加水滴
   */
  addWaterDrop(x, y, radius = 10) {
    // 确保坐标在有效范围内
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    const centerIndex = Math.floor(y) * this.width + Math.floor(x);
    const r2 = radius * radius;
    
    // 在半径范围内添加水滴效果
    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        const distance2 = i * i + j * j;
        if (distance2 > r2) continue;
        
        const posX = Math.floor(x + i);
        const posY = Math.floor(y + j);
        
        if (posX < 0 || posX >= this.width || posY < 0 || posY >= this.height) continue;
        
        const index = posY * this.width + posX;
        
        // 水滴会稀释墨水并产生向外的速度
        const factor = (1 - Math.sqrt(distance2) / radius);
        
        // 如果有墨水，稀释它
        if (this.density0[index] > 0) {
          this.density0[index] *= (1 - 0.5 * factor);
        }
        
        // 添加向外的速度
        const dirX = i / (Math.sqrt(distance2) || 1);
        const dirY = j / (Math.sqrt(distance2) || 1);
        this.vx0[index] += dirX * factor * 5;
        this.vy0[index] += dirY * factor * 5;
      }
    }
  }
  
  /**
   * 泼墨效果
   */
  splashInk(x, y, amount, direction, spread = 30) {
    // 确保坐标在有效范围内
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    // 计算方向向量
    const dirX = Math.cos(direction);
    const dirY = Math.sin(direction);
    
    // 创建多个墨滴
    const dropCount = 10 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < dropCount; i++) {
      // 随机偏移方向
      const angle = direction + (Math.random() - 0.5) * spread * Math.PI / 180;
      const speed = 5 + Math.random() * 15;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      
      // 随机墨滴大小
      const dropSize = 2 + Math.random() * 8;
      
      // 随机墨滴位置（在起点附近）
      const dropX = x + (Math.random() - 0.5) * 10;
      const dropY = y + (Math.random() - 0.5) * 10;
      
      // 添加墨滴
      this.addInk(dropX, dropY, amount * (0.5 + Math.random() * 0.5), dx, dy, dropSize);
    }
  }
  
  /**
   * 更新流体状态
   */
  update() {
    // 添加重力影响
    this.addGravity();
    
    // 速度步骤
    this.diffuse(1, this.vx0, this.vx1, this.viscosity);
    this.diffuse(2, this.vy0, this.vy1, this.viscosity);
    
    this.project(this.vx1, this.vy1, this.vx0, this.vy0);
    
    this.advect(1, this.vx0, this.vx1, this.vx1, this.vy1);
    this.advect(2, this.vy0, this.vy1, this.vx1, this.vy1);
    
    this.project(this.vx0, this.vy0, this.vx1, this.vy1);
    
    // 密度步骤
    this.diffuse(0, this.density0, this.density1, this.diffusion);
    this.advect(0, this.density1, this.density0, this.vx0, this.vy0);
    
    // 应用纸张吸收效果
    this.applyPaperAbsorption();
  }
  
  /**
   * 添加重力影响
   */
  addGravity() {
    if (this.gravityX === 0 && this.gravityY === 0) return;
    
    for (let i = 0; i < this.size; i++) {
      if (this.density0[i] > 0.01) {
        this.vx0[i] += this.gravityX * this.density0[i] * 0.1;
        this.vy0[i] += this.gravityY * this.density0[i] * 0.1;
      }
    }
  }
  
  /**
   * 应用纸张吸收效果
   */
  applyPaperAbsorption() {
    const paperProps = this.paperTextures[this.paperType];
    const absorptionRate = this.absorption * paperProps.absorption * 0.01;
    const roughnessEffect = paperProps.roughness * 0.1;
    
    for (let i = 0; i < this.size; i++) {
      // 减少速度（模拟吸收）
      this.vx0[i] *= (1 - absorptionRate);
      this.vy0[i] *= (1 - absorptionRate);
      
      // 根据纸张纹理添加随机扰动
      if (this.density0[i] > 0.01) {
        this.vx0[i] += (Math.random() - 0.5) * roughnessEffect;
        this.vy0[i] += (Math.random() - 0.5) * roughnessEffect;
      }
      
      // 墨水扩散和吸收
      if (this.density0[i] > 0) {
        // 墨水浓度随时间减少（被纸吸收）
        this.density0[i] *= (1 - 0.001 * absorptionRate);
      }
    }
  }
  
  /**
   * 扩散步骤
   */
  diffuse(b, x, x0, diffusion) {
    const a = this.dt * diffusion * (this.width - 2) * (this.height - 2);
    this.linearSolve(b, x, x0, a, 1 + 6 * a);
  }
  
  /**
   * 线性求解器
   */
  linearSolve(b, x, x0, a, c) {
    const cRecip = 1 / c;
    
    for (let k = 0; k < this.iterations; k++) {
      for (let j = 1; j < this.height - 1; j++) {
        for (let i = 1; i < this.width - 1; i++) {
          const index = j * this.width + i;
          x[index] = (x0[index] + a * (
            x[index - 1] + x[index + 1] +
            x[index - this.width] + x[index + this.width]
          )) * cRecip;
        }
      }
      
      this.setBoundary(b, x);
    }
  }
  
  /**
   * 投影步骤（保持不可压缩性）
   */
  project(velocX, velocY, p, div) {
    for (let j = 1; j < this.height - 1; j++) {
      for (let i = 1; i < this.width - 1; i++) {
        const index = j * this.width + i;
        div[index] = -0.5 * (
          velocX[index + 1] - velocX[index - 1] +
          velocY[index + this.width] - velocY[index - this.width]
        ) / this.width;
        p[index] = 0;
      }
    }
    
    this.setBoundary(0, div);
    this.setBoundary(0, p);
    this.linearSolve(0, p, div, 1, 6);
    
    for (let j = 1; j < this.height - 1; j++) {
      for (let i = 1; i < this.width - 1; i++) {
        const index = j * this.width + i;
        velocX[index] -= 0.5 * (p[index + 1] - p[index - 1]) * this.width;
        velocY[index] -= 0.5 * (p[index + this.width] - p[index - this.width]) * this.width;
      }
    }
    
    this.setBoundary(1, velocX);
    this.setBoundary(2, velocY);
  }
  
  /**
   * 平流步骤
   */
  advect(b, d, d0, velocX, velocY) {
    const dtx = this.dt * (this.width - 2);
    const dty = this.dt * (this.height - 2);
    
    for (let j = 1; j < this.height - 1; j++) {
      for (let i = 1; i < this.width - 1; i++) {
        const index = j * this.width + i;
        
        // 回溯粒子位置
        let x = i - dtx * velocX[index];
        let y = j - dty * velocY[index];
        
        // 确保在边界内
        if (x < 0.5) x = 0.5;
        if (x > this.width - 1.5) x = this.width - 1.5;
        if (y < 0.5) y = 0.5;
        if (y > this.height - 1.5) y = this.height - 1.5;
        
        // 找到周围的四个格子
        const i0 = Math.floor(x);
        const i1 = i0 + 1;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;
        
        // 计算插值权重
        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;
        
        // 双线性插值
        d[index] = 
          s0 * (t0 * d0[j0 * this.width + i0] + t1 * d0[j1 * this.width + i0]) +
          s1 * (t0 * d0[j0 * this.width + i1] + t1 * d0[j1 * this.width + i1]);
      }
    }
    
    this.setBoundary(b, d);
  }
  
  /**
   * 设置边界条件
   */
  setBoundary(b, x) {
    // 设置边缘
    for (let i = 1; i < this.width - 1; i++) {
      x[i] = b === 2 ? -x[i + this.width] : x[i + this.width];
      x[i + (this.height - 1) * this.width] = b === 2 ? -x[i + (this.height - 2) * this.width] : x[i + (this.height - 2) * this.width];
    }
    
    for (let j = 1; j < this.height - 1; j++) {
      x[j * this.width] = b === 1 ? -x[1 + j * this.width] : x[1 + j * this.width];
      x[(this.width - 1) + j * this.width] = b === 1 ? -x[(this.width - 2) + j * this.width] : x[(this.width - 2) + j * this.width];
    }
    
    // 设置角落
    x[0] = 0.5 * (x[1] + x[this.width]);
    x[(this.width - 1)] = 0.5 * (x[(this.width - 2)] + x[(this.width - 1) + this.width]);
    x[(this.height - 1) * this.width] = 0.5 * (x[1 + (this.height - 1) * this.width] + x[(this.height - 2) * this.width]);
    x[(this.width - 1) + (this.height - 1) * this.width] = 0.5 * (x[(this.width - 2) + (this.height - 1) * this.width] + x[(this.width - 1) + (this.height - 2) * this.width]);
  }
  
  /**
   * 获取当前墨水颜色
   */
  getCurrentInkColor() {
    return this.inkColors[this.currentInk];
  }
}
