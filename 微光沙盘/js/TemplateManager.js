/**
 * 模板管理器
 * 管理预设沙盘模板
 */
class TemplateManager {
  /**
   * 创建模板管理器
   * @param {SandPhysics} physics - 沙粒物理系统
   * @param {Object} options - 配置选项
   */
  constructor(physics, options = {}) {
    this.physics = physics;
    
    // 配置参数
    this.params = {
      particleDensity: options.particleDensity || 0.5, // 粒子密度
      randomizeColors: options.randomizeColors !== undefined ? options.randomizeColors : true,
      randomizeTypes: options.randomizeTypes !== undefined ? options.randomizeTypes : true
    };
    
    // 模板定义
    this.templates = {
      mountain: {
        name: '山脉',
        generate: this._generateMountain.bind(this)
      },
      valley: {
        name: '峡谷',
        generate: this._generateValley.bind(this)
      },
      island: {
        name: '岛屿',
        generate: this._generateIsland.bind(this)
      },
      crater: {
        name: '陨石坑',
        generate: this._generateCrater.bind(this)
      }
    };
    
    // 颜色映射
    this.colorMap = {
      gold: '#ffdc73',
      blue: '#73b0ff',
      green: '#73ffb0',
      purple: '#c073ff',
      red: '#ff7373'
    };
    
    // 粒子类型
    this.particleTypes = ['normal', 'light', 'heavy', 'bouncy', 'glowing'];
  }
  
  /**
   * 生成山脉模板
   * @param {Object} options - 配置选项
   * @returns {number} 创建的粒子数量
   * @private
   */
  _generateMountain(options = {}) {
    const { width, height } = this.physics.bounds;
    const particleSize = this.physics.params.particleSize;
    
    // 山脉参数
    const mountainOptions = {
      peakCount: options.peakCount || randomInt(2, 4),
      maxHeight: options.maxHeight || height * 0.7,
      baseHeight: options.baseHeight || height * 0.3,
      ...options
    };
    
    // 创建山脉轮廓
    const mountainProfile = [];
    const segmentCount = width / (particleSize * 2);
    
    // 生成山峰
    const peaks = [];
    for (let i = 0; i < mountainOptions.peakCount; i++) {
      peaks.push({
        x: random(width * 0.1, width * 0.9),
        height: random(mountainOptions.baseHeight, mountainOptions.maxHeight),
        width: random(width * 0.1, width * 0.3)
      });
    }
    
    // 生成山脉轮廓
    for (let i = 0; i <= segmentCount; i++) {
      const x = (i / segmentCount) * width;
      let y = mountainOptions.baseHeight;
      
      // 计算每个峰对当前x位置的影响
      for (const peak of peaks) {
        const distance = Math.abs(x - peak.x);
        const influence = Math.max(0, 1 - (distance / peak.width) ** 2);
        y = Math.max(y, mountainOptions.baseHeight + (peak.height - mountainOptions.baseHeight) * influence);
      }
      
      // 添加一些噪声
      y += random(-10, 10);
      
      mountainProfile.push({ x, y });
    }
    
    // 填充山脉
    let particleCount = 0;
    
    for (let x = 0; x < width; x += particleSize * 2) {
      // 找到当前x位置的山脉高度
      const index = Math.floor((x / width) * segmentCount);
      const nextIndex = Math.min(index + 1, mountainProfile.length - 1);
      const t = (x - mountainProfile[index].x) / (mountainProfile[nextIndex].x - mountainProfile[index].x);
      const mountainHeight = lerp(mountainProfile[index].y, mountainProfile[nextIndex].y, t);
      
      // 从山脉高度到底部填充粒子
      for (let y = mountainHeight; y < height; y += particleSize * 2) {
        // 根据密度随机跳过一些位置
        if (Math.random() > this.params.particleDensity) continue;
        
        // 选择颜色和类型
        const colorName = this._getRandomColorName();
        const color = this.colorMap[colorName];
        const type = this.params.randomizeTypes ? this._getRandomParticleType() : 'normal';
        
        // 创建粒子
        this.physics.createParticle(x + random(-particleSize, particleSize), y + random(-particleSize, particleSize), {
          color,
          type,
          isStatic: Math.random() < 0.2 // 一些粒子是静态的，增加稳定性
        });
        
        particleCount++;
      }
    }
    
    return particleCount;
  }
  
  /**
   * 生成峡谷模板
   * @param {Object} options - 配置选项
   * @returns {number} 创建的粒子数量
   * @private
   */
  _generateValley(options = {}) {
    const { width, height } = this.physics.bounds;
    const particleSize = this.physics.params.particleSize;
    
    // 峡谷参数
    const valleyOptions = {
      valleyWidth: options.valleyWidth || width * 0.3,
      valleyDepth: options.valleyDepth || height * 0.6,
      valleyCenter: options.valleyCenter || width * 0.5,
      ...options
    };
    
    // 创建峡谷轮廓
    const valleyProfile = [];
    const segmentCount = width / (particleSize * 2);
    
    // 生成峡谷轮廓
    for (let i = 0; i <= segmentCount; i++) {
      const x = (i / segmentCount) * width;
      const distanceFromCenter = Math.abs(x - valleyOptions.valleyCenter);
      const valleyInfluence = Math.min(1, distanceFromCenter / (valleyOptions.valleyWidth * 0.5));
      const y = height - valleyOptions.valleyDepth * (1 - valleyInfluence ** 2);
      
      // 添加一些噪声
      const noise = perlinNoise(x * 0.01, 0, 42) * 20;
      
      valleyProfile.push({ x, y: y + noise });
    }
    
    // 填充峡谷两侧
    let particleCount = 0;
    
    for (let x = 0; x < width; x += particleSize * 2) {
      // 找到当前x位置的峡谷高度
      const index = Math.floor((x / width) * segmentCount);
      const nextIndex = Math.min(index + 1, valleyProfile.length - 1);
      const t = (x - valleyProfile[index].x) / (valleyProfile[nextIndex].x - valleyProfile[index].x);
      const valleyHeight = lerp(valleyProfile[index].y, valleyProfile[nextIndex].y, t);
      
      // 从峡谷高度到底部填充粒子
      for (let y = valleyHeight; y < height; y += particleSize * 2) {
        // 根据密度随机跳过一些位置
        if (Math.random() > this.params.particleDensity) continue;
        
        // 选择颜色和类型
        const colorName = this._getRandomColorName();
        const color = this.colorMap[colorName];
        const type = this.params.randomizeTypes ? this._getRandomParticleType() : 'normal';
        
        // 创建粒子
        this.physics.createParticle(x + random(-particleSize, particleSize), y + random(-particleSize, particleSize), {
          color,
          type,
          isStatic: Math.random() < 0.2 // 一些粒子是静态的，增加稳定性
        });
        
        particleCount++;
      }
    }
    
    return particleCount;
  }
  
  /**
   * 生成岛屿模板
   * @param {Object} options - 配置选项
   * @returns {number} 创建的粒子数量
   * @private
   */
  _generateIsland(options = {}) {
    const { width, height } = this.physics.bounds;
    const particleSize = this.physics.params.particleSize;
    
    // 岛屿参数
    const islandOptions = {
      centerX: options.centerX || width * 0.5,
      centerY: options.centerY || height * 0.6,
      radius: options.radius || Math.min(width, height) * 0.3,
      irregularity: options.irregularity || 0.3,
      ...options
    };
    
    // 创建岛屿轮廓
    const angleStep = Math.PI * 2 / 36; // 每10度一个点
    const islandPoints = [];
    
    for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
      // 添加不规则性
      const radiusNoise = 1 + random(-islandOptions.irregularity, islandOptions.irregularity);
      const radius = islandOptions.radius * radiusNoise;
      
      const x = islandOptions.centerX + Math.cos(angle) * radius;
      const y = islandOptions.centerY + Math.sin(angle) * radius;
      
      islandPoints.push({ x, y });
    }
    
    // 闭合轮廓
    islandPoints.push(islandPoints[0]);
    
    // 填充岛屿
    let particleCount = 0;
    
    // 使用网格方法填充
    const gridSize = particleSize * 2;
    const startX = Math.max(0, islandOptions.centerX - islandOptions.radius * 1.5);
    const endX = Math.min(width, islandOptions.centerX + islandOptions.radius * 1.5);
    const startY = Math.max(0, islandOptions.centerY - islandOptions.radius * 1.5);
    const endY = Math.min(height, islandOptions.centerY + islandOptions.radius * 1.5);
    
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        // 计算到中心的距离
        const dx = x - islandOptions.centerX;
        const dy = y - islandOptions.centerY;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // 如果在岛屿半径内，创建粒子
        if (distanceToCenter < islandOptions.radius * (1 + random(-0.2, 0.2))) {
          // 根据密度随机跳过一些位置
          if (Math.random() > this.params.particleDensity) continue;
          
          // 选择颜色和类型
          const colorName = this._getRandomColorName();
          const color = this.colorMap[colorName];
          const type = this.params.randomizeTypes ? this._getRandomParticleType() : 'normal';
          
          // 创建粒子
          this.physics.createParticle(x + random(-gridSize/2, gridSize/2), y + random(-gridSize/2, gridSize/2), {
            color,
            type,
            isStatic: Math.random() < 0.2 // 一些粒子是静态的，增加稳定性
          });
          
          particleCount++;
        }
      }
    }
    
    return particleCount;
  }
  
  /**
   * 生成陨石坑模板
   * @param {Object} options - 配置选项
   * @returns {number} 创建的粒子数量
   * @private
   */
  _generateCrater(options = {}) {
    const { width, height } = this.physics.bounds;
    const particleSize = this.physics.params.particleSize;
    
    // 陨石坑参数
    const craterOptions = {
      centerX: options.centerX || width * 0.5,
      centerY: options.centerY || height * 0.5,
      radius: options.radius || Math.min(width, height) * 0.3,
      rimHeight: options.rimHeight || 20,
      rimWidth: options.rimWidth || 40,
      ...options
    };
    
    // 填充陨石坑
    let particleCount = 0;
    
    // 使用网格方法填充
    const gridSize = particleSize * 2;
    
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        // 计算到中心的距离
        const dx = x - craterOptions.centerX;
        const dy = y - craterOptions.centerY;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // 跳过陨石坑内部
        if (distanceToCenter < craterOptions.radius) continue;
        
        // 在陨石坑边缘创建更高的粒子（形成边缘）
        const rimFactor = Math.max(0, 1 - Math.abs(distanceToCenter - craterOptions.radius) / craterOptions.rimWidth);
        const heightOffset = rimFactor * craterOptions.rimHeight;
        
        // 根据密度随机跳过一些位置
        if (Math.random() > this.params.particleDensity) continue;
        
        // 选择颜色和类型
        const colorName = this._getRandomColorName();
        const color = this.colorMap[colorName];
        const type = this.params.randomizeTypes ? this._getRandomParticleType() : 'normal';
        
        // 创建粒子
        this.physics.createParticle(x + random(-gridSize/2, gridSize/2), y - heightOffset + random(-gridSize/2, gridSize/2), {
          color,
          type,
          isStatic: Math.random() < 0.2 // 一些粒子是静态的，增加稳定性
        });
        
        particleCount++;
      }
    }
    
    return particleCount;
  }
  
  /**
   * 获取随机颜色名称
   * @returns {string} 颜色名称
   * @private
   */
  _getRandomColorName() {
    if (!this.params.randomizeColors) return 'gold';
    
    const colorNames = Object.keys(this.colorMap);
    return colorNames[Math.floor(Math.random() * colorNames.length)];
  }
  
  /**
   * 获取随机粒子类型
   * @returns {string} 粒子类型
   * @private
   */
  _getRandomParticleType() {
    // 大多数粒子是普通类型
    if (Math.random() < 0.7) return 'normal';
    
    return this.particleTypes[Math.floor(Math.random() * this.particleTypes.length)];
  }
  
  /**
   * 应用模板
   * @param {string} templateName - 模板名称
   * @param {Object} options - 配置选项
   * @returns {number} 创建的粒子数量
   */
  applyTemplate(templateName, options = {}) {
    const template = this.templates[templateName];
    if (!template) {
      console.error(`未知模板: ${templateName}`);
      return 0;
    }
    
    // 清除现有粒子
    this.physics.clear();
    
    // 生成模板
    return template.generate(options);
  }
  
  /**
   * 获取所有模板名称
   * @returns {Array} 模板名称数组
   */
  getTemplateNames() {
    return Object.keys(this.templates);
  }
  
  /**
   * 获取模板信息
   * @param {string} templateName - 模板名称
   * @returns {Object|null} 模板信息或null
   */
  getTemplateInfo(templateName) {
    const template = this.templates[templateName];
    if (!template) return null;
    
    return {
      name: template.name,
      id: templateName
    };
  }
  
  /**
   * 设置粒子密度
   * @param {number} density - 密度 (0-1)
   */
  setParticleDensity(density) {
    this.params.particleDensity = clamp(density, 0.1, 1);
  }
  
  /**
   * 设置是否随机化颜色
   * @param {boolean} randomize - 是否随机化
   */
  setRandomizeColors(randomize) {
    this.params.randomizeColors = randomize;
  }
  
  /**
   * 设置是否随机化粒子类型
   * @param {boolean} randomize - 是否随机化
   */
  setRandomizeTypes(randomize) {
    this.params.randomizeTypes = randomize;
  }
}
