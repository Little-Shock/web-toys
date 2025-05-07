/**
 * 数学工具函数
 */

// 引力常数
const G = 0.5;

/**
 * 生成指定范围内的随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 计算两点之间的距离
 * @param {Object} p1 - 点1 {x, y, z}
 * @param {Object} p2 - 点2 {x, y, z}
 * @returns {number} 距离
 */
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算向量长度
 * @param {Object} v - 向量 {x, y, z}
 * @returns {number} 向量长度
 */
function vectorLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * 向量归一化
 * @param {Object} v - 向量 {x, y, z}
 * @returns {Object} 归一化后的向量
 */
function normalizeVector(v) {
  const length = vectorLength(v);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length
  };
}

/**
 * 向量叉积
 * @param {Object} v1 - 向量1 {x, y, z}
 * @param {Object} v2 - 向量2 {x, y, z}
 * @returns {Object} 叉积向量
 */
function crossProduct(v1, v2) {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
}

/**
 * 向量点积
 * @param {Object} v1 - 向量1 {x, y, z}
 * @param {Object} v2 - 向量2 {x, y, z}
 * @returns {number} 点积
 */
function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * 计算系统的总能量
 * @param {Array} bodies - 天体数组
 * @returns {number} 总能量
 */
function totalEnergy(bodies) {
  let energy = 0;
  
  // 计算动能
  for (const body of bodies) {
    energy += body.getKineticEnergy();
  }
  
  // 计算势能
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const body1 = bodies[i];
      const body2 = bodies[j];
      const dist = distance(body1.position, body2.position);
      
      // 防止除以零
      if (dist > 0.001) {
        energy -= G * body1.mass * body2.mass / dist;
      }
    }
  }
  
  return energy;
}

/**
 * 计算系统的总角动量
 * @param {Array} bodies - 天体数组
 * @returns {Object} 总角动量向量
 */
function totalAngularMomentum(bodies) {
  const L = { x: 0, y: 0, z: 0 };
  
  for (const body of bodies) {
    // 计算角动量 L = r × p = r × (m * v)
    const r = body.position;
    const p = {
      x: body.mass * body.velocity.x,
      y: body.mass * body.velocity.y,
      z: body.mass * body.velocity.z
    };
    
    const angularMomentum = crossProduct(r, p);
    L.x += angularMomentum.x;
    L.y += angularMomentum.y;
    L.z += angularMomentum.z;
  }
  
  return L;
}

/**
 * 计算系统的质心
 * @param {Array} bodies - 天体数组
 * @returns {Object} 质心位置
 */
function centerOfMass(bodies) {
  let totalMass = 0;
  const com = { x: 0, y: 0, z: 0 };
  
  for (const body of bodies) {
    totalMass += body.mass;
    com.x += body.mass * body.position.x;
    com.y += body.mass * body.position.y;
    com.z += body.mass * body.position.z;
  }
  
  if (totalMass > 0) {
    com.x /= totalMass;
    com.y /= totalMass;
    com.z /= totalMass;
  }
  
  return com;
}

/**
 * 限制值在指定范围内
 * @param {number} value - 值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 线性插值
 * @param {number} a - 起始值
 * @param {number} b - 结束值
 * @param {number} t - 插值参数 [0, 1]
 * @returns {number} 插值结果
 */
function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * 平滑步进函数
 * @param {number} edge0 - 下边界
 * @param {number} edge1 - 上边界
 * @param {number} x - 输入值
 * @returns {number} 平滑步进值 [0, 1]
 */
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

/**
 * 计算帧率
 */
class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
  }
  
  /**
   * 更新帧率
   */
  update() {
    this.frames++;
    const now = performance.now();
    const elapsed = now - this.lastTime;
    
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = now;
    }
    
    return this.fps;
  }
}
