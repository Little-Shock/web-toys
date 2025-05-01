/**
 * 光源引擎
 * 负责处理光源和物体的创建、管理和交互
 */
class LightEngine {
  constructor() {
    // 光源数组
    this.lights = [];
    
    // 物体数组
    this.objects = [];
    
    // 光源类型
    this.lightTypes = {
      point: {
        name: '点光源',
        radius: 20,
        falloff: 0.5
      },
      spot: {
        name: '聚光灯',
        radius: 30,
        angle: Math.PI / 4,
        falloff: 0.7,
        direction: 0
      },
      directional: {
        name: '平行光',
        direction: Math.PI / 4,
        strength: 0.8
      },
      ambient: {
        name: '环境光',
        strength: 0.3
      }
    };
    
    // 物体类型
    this.objectTypes = {
      rectangle: {
        name: '矩形'
      },
      circle: {
        name: '圆形'
      },
      triangle: {
        name: '三角形'
      },
      custom: {
        name: '自由绘制'
      }
    };
    
    // 引擎参数
    this.params = {
      lightIntensity: 0.7,
      shadowSoftness: 0.5,
      objectOpacity: 0.8,
      backgroundDarkness: 0.9,
      animationEnabled: true
    };
    
    // 动画状态
    this.animationFrame = null;
    this.lastUpdateTime = 0;
  }
  
  /**
   * 创建光源
   * @param {string} type - 光源类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} color - 光源颜色
   * @param {Object} options - 额外选项
   * @returns {Object} 创建的光源对象
   */
  createLight(type, x, y, color = '#FFFFFF', options = {}) {
    const lightType = this.lightTypes[type];
    if (!lightType) return null;
    
    // 基础光源属性
    const light = {
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      color,
      intensity: options.intensity || this.params.lightIntensity,
      active: true,
      animation: {
        enabled: options.animation !== undefined ? options.animation : this.params.animationEnabled,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5
      }
    };
    
    // 根据类型添加特定属性
    switch (type) {
      case 'point':
        light.radius = options.radius || lightType.radius;
        light.falloff = options.falloff || lightType.falloff;
        break;
      case 'spot':
        light.radius = options.radius || lightType.radius;
        light.angle = options.angle || lightType.angle;
        light.direction = options.direction || lightType.direction;
        light.falloff = options.falloff || lightType.falloff;
        break;
      case 'directional':
        light.direction = options.direction || lightType.direction;
        light.strength = options.strength || lightType.strength;
        break;
      case 'ambient':
        light.strength = options.strength || lightType.strength;
        break;
    }
    
    // 添加到光源数组
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * 创建物体
   * @param {string} type - 物体类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} dimensions - 物体尺寸
   * @param {number} opacity - 不透明度
   * @returns {Object} 创建的物体对象
   */
  createObject(type, x, y, dimensions, opacity = this.params.objectOpacity) {
    const objectType = this.objectTypes[type];
    if (!objectType) return null;
    
    // 基础物体属性
    const object = {
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      opacity,
      castShadow: true
    };
    
    // 根据类型添加特定属性
    switch (type) {
      case 'rectangle':
        object.width = dimensions.width || 100;
        object.height = dimensions.height || 60;
        break;
      case 'circle':
        object.radius = dimensions.radius || 50;
        break;
      case 'triangle':
        object.points = dimensions.points || [
          { x: 0, y: -50 },
          { x: -40, y: 40 },
          { x: 40, y: 40 }
        ];
        break;
      case 'custom':
        object.points = dimensions.points || [];
        break;
    }
    
    // 添加到物体数组
    this.objects.push(object);
    
    return object;
  }
  
  /**
   * 更新光源位置
   * @param {string|Object} lightId - 光源ID或光源对象
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   */
  updateLightPosition(lightId, x, y) {
    const light = typeof lightId === 'object' ? lightId : this.getLightById(lightId);
    if (!light) return;
    
    light.x = x;
    light.y = y;
  }
  
  /**
   * 更新物体位置
   * @param {string|Object} objectId - 物体ID或物体对象
   * @param {number} x - 新的X坐标
   * @param {number} y - 新的Y坐标
   */
  updateObjectPosition(objectId, x, y) {
    const object = typeof objectId === 'object' ? objectId : this.getObjectById(objectId);
    if (!object) return;
    
    // 计算偏移量
    const dx = x - object.x;
    const dy = y - object.y;
    
    // 更新位置
    object.x = x;
    object.y = y;
    
    // 如果是三角形或自定义形状，更新所有点
    if (object.points) {
      object.points.forEach(point => {
        point.x += dx;
        point.y += dy;
      });
    }
  }
  
  /**
   * 更新物体尺寸
   * @param {string|Object} objectId - 物体ID或物体对象
   * @param {Object} dimensions - 新的尺寸
   */
  updateObjectDimensions(objectId, dimensions) {
    const object = typeof objectId === 'object' ? objectId : this.getObjectById(objectId);
    if (!object) return;
    
    switch (object.type) {
      case 'rectangle':
        if (dimensions.width !== undefined) object.width = dimensions.width;
        if (dimensions.height !== undefined) object.height = dimensions.height;
        break;
      case 'circle':
        if (dimensions.radius !== undefined) object.radius = dimensions.radius;
        break;
      case 'triangle':
      case 'custom':
        if (dimensions.points !== undefined) object.points = dimensions.points;
        break;
    }
  }
  
  /**
   * 添加点到自定义形状
   * @param {string|Object} objectId - 物体ID或物体对象
   * @param {number} x - 点的X坐标
   * @param {number} y - 点的Y坐标
   */
  addPointToCustomShape(objectId, x, y) {
    const object = typeof objectId === 'object' ? objectId : this.getObjectById(objectId);
    if (!object || (object.type !== 'custom' && object.type !== 'triangle')) return;
    
    // 如果是自定义形状，添加点
    if (!object.points) object.points = [];
    
    // 添加相对于物体中心的点
    object.points.push({
      x: x - object.x,
      y: y - object.y
    });
  }
  
  /**
   * 根据ID获取光源
   * @param {string} id - 光源ID
   * @returns {Object|null} 光源对象或null
   */
  getLightById(id) {
    return this.lights.find(light => light.id === id) || null;
  }
  
  /**
   * 根据ID获取物体
   * @param {string} id - 物体ID
   * @returns {Object|null} 物体对象或null
   */
  getObjectById(id) {
    return this.objects.find(object => object.id === id) || null;
  }
  
  /**
   * 移除光源
   * @param {string|Object} lightId - 光源ID或光源对象
   */
  removeLight(lightId) {
    const id = typeof lightId === 'object' ? lightId.id : lightId;
    this.lights = this.lights.filter(light => light.id !== id);
  }
  
  /**
   * 移除物体
   * @param {string|Object} objectId - 物体ID或物体对象
   */
  removeObject(objectId) {
    const id = typeof objectId === 'object' ? objectId.id : objectId;
    this.objects = this.objects.filter(object => object.id !== id);
  }
  
  /**
   * 清除所有光源和物体
   */
  clear() {
    this.lights = [];
    this.objects = [];
  }
  
  /**
   * 更新引擎参数
   * @param {Object} params - 新参数
   */
  updateParams(params) {
    Object.assign(this.params, params);
  }
  
  /**
   * 更新光源动画
   * @param {number} deltaTime - 时间增量（秒）
   */
  updateLightAnimations(deltaTime) {
    if (!this.params.animationEnabled) return;
    
    this.lights.forEach(light => {
      if (!light.animation || !light.animation.enabled) return;
      
      // 更新动画相位
      light.animation.phase += light.animation.speed * deltaTime;
      
      // 根据光源类型应用不同的动画效果
      switch (light.type) {
        case 'point':
        case 'spot':
          // 轻微移动光源位置
          const amplitude = 5;
          light.animation.offsetX = Math.sin(light.animation.phase) * amplitude;
          light.animation.offsetY = Math.cos(light.animation.phase * 0.7) * amplitude;
          
          // 轻微变化光源强度
          const intensityVariation = 0.1;
          light.animation.intensityFactor = 1 + Math.sin(light.animation.phase * 1.3) * intensityVariation;
          break;
        case 'directional':
          // 轻微变化光源方向
          const directionVariation = 0.1;
          light.animation.directionOffset = Math.sin(light.animation.phase) * directionVariation;
          break;
        case 'ambient':
          // 轻微变化环境光强度
          const strengthVariation = 0.05;
          light.animation.strengthFactor = 1 + Math.sin(light.animation.phase) * strengthVariation;
          break;
      }
    });
  }
  
  /**
   * 获取光源的实际位置（考虑动画）
   * @param {Object} light - 光源对象
   * @returns {Object} 包含x和y坐标的对象
   */
  getLightPosition(light) {
    if (!light.animation || !light.animation.enabled || !this.params.animationEnabled) {
      return { x: light.x, y: light.y };
    }
    
    return {
      x: light.x + (light.animation.offsetX || 0),
      y: light.y + (light.animation.offsetY || 0)
    };
  }
  
  /**
   * 获取光源的实际强度（考虑动画）
   * @param {Object} light - 光源对象
   * @returns {number} 光源强度
   */
  getLightIntensity(light) {
    const baseIntensity = light.intensity * this.params.lightIntensity;
    
    if (!light.animation || !light.animation.enabled || !this.params.animationEnabled) {
      return baseIntensity;
    }
    
    return baseIntensity * (light.animation.intensityFactor || 1);
  }
  
  /**
   * 获取光源的实际方向（考虑动画）
   * @param {Object} light - 光源对象
   * @returns {number} 光源方向（弧度）
   */
  getLightDirection(light) {
    if (!light.direction) return 0;
    
    if (!light.animation || !light.animation.enabled || !this.params.animationEnabled) {
      return light.direction;
    }
    
    return light.direction + (light.animation.directionOffset || 0);
  }
  
  /**
   * 获取环境光的实际强度（考虑动画）
   * @param {Object} light - 环境光对象
   * @returns {number} 环境光强度
   */
  getAmbientStrength(light) {
    const baseStrength = light.strength * this.params.lightIntensity;
    
    if (!light.animation || !light.animation.enabled || !this.params.animationEnabled) {
      return baseStrength;
    }
    
    return baseStrength * (light.animation.strengthFactor || 1);
  }
  
  /**
   * 启动引擎更新循环
   */
  start() {
    if (this.animationFrame) return;
    
    this.lastUpdateTime = performance.now();
    
    const update = (timestamp) => {
      // 计算时间增量（秒）
      const deltaTime = (timestamp - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = timestamp;
      
      // 更新光源动画
      this.updateLightAnimations(deltaTime);
      
      // 继续更新循环
      this.animationFrame = requestAnimationFrame(update);
    };
    
    this.animationFrame = requestAnimationFrame(update);
  }
  
  /**
   * 停止引擎更新循环
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
