/**
 * 数学工具函数
 */

// 万有引力常数 (缩放后的值，适合模拟)
const G = 6.67430;

/**
 * 将角度转换为弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 将弧度转换为角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

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
 * @param {Object} p1 - 点1，包含x、y、z坐标
 * @param {Object} p2 - 点2，包含x、y、z坐标
 * @returns {number} 距离
 */
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算两点之间的距离的平方
 * @param {Object} p1 - 点1，包含x、y、z坐标
 * @param {Object} p2 - 点2，包含x、y、z坐标
 * @returns {number} 距离的平方
 */
function distanceSquared(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * 限制值在指定范围内
 * @param {number} value - 要限制的值
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
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 插值结果
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 计算向量的长度
 * @param {Object} vector - 向量，包含x、y、z分量
 * @returns {number} 向量长度
 */
function vectorLength(vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

/**
 * 归一化向量
 * @param {Object} vector - 向量，包含x、y、z分量
 * @returns {Object} 归一化后的向量
 */
function normalizeVector(vector) {
  const length = vectorLength(vector);
  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
}

/**
 * 计算两个向量的点积
 * @param {Object} v1 - 向量1，包含x、y、z分量
 * @param {Object} v2 - 向量2，包含x、y、z分量
 * @returns {number} 点积结果
 */
function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * 计算两个向量的叉积
 * @param {Object} v1 - 向量1，包含x、y、z分量
 * @param {Object} v2 - 向量2，包含x、y、z分量
 * @returns {Object} 叉积结果，包含x、y、z分量
 */
function crossProduct(v1, v2) {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
}

/**
 * 计算向量的标量乘积
 * @param {Object} vector - 向量，包含x、y、z分量
 * @param {number} scalar - 标量
 * @returns {Object} 标量乘积结果，包含x、y、z分量
 */
function scaleVector(vector, scalar) {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar
  };
}

/**
 * 计算两个向量的和
 * @param {Object} v1 - 向量1，包含x、y、z分量
 * @param {Object} v2 - 向量2，包含x、y、z分量
 * @returns {Object} 向量和，包含x、y、z分量
 */
function addVectors(v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
    z: v1.z + v2.z
  };
}

/**
 * 计算两个向量的差 (v1 - v2)
 * @param {Object} v1 - 向量1，包含x、y、z分量
 * @param {Object} v2 - 向量2，包含x、y、z分量
 * @returns {Object} 向量差，包含x、y、z分量
 */
function subtractVectors(v1, v2) {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
    z: v1.z - v2.z
  };
}

/**
 * 计算向量的方向角
 * @param {Object} vector - 向量，包含x、y分量
 * @returns {number} 方向角（弧度）
 */
function vectorAngle(vector) {
  return Math.atan2(vector.y, vector.x);
}

/**
 * 从角度和长度创建向量
 * @param {number} angle - 角度（弧度）
 * @param {number} length - 长度
 * @returns {Object} 向量，包含x、y分量
 */
function vectorFromAngle(angle, length) {
  return {
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length
  };
}

/**
 * 计算两个向量之间的角度
 * @param {Object} v1 - 向量1，包含x、y、z分量
 * @param {Object} v2 - 向量2，包含x、y、z分量
 * @returns {number} 角度（弧度）
 */
function angleBetweenVectors(v1, v2) {
  const dot = dotProduct(v1, v2);
  const len1 = vectorLength(v1);
  const len2 = vectorLength(v2);
  return Math.acos(dot / (len1 * len2));
}

/**
 * 计算轨道能量
 * @param {number} mass1 - 质量1
 * @param {number} mass2 - 质量2
 * @param {number} distance - 距离
 * @param {number} velocity - 相对速度
 * @returns {number} 轨道能量
 */
function orbitalEnergy(mass1, mass2, distance, velocity) {
  const kineticEnergy = 0.5 * (mass1 * mass2 / (mass1 + mass2)) * velocity * velocity;
  const potentialEnergy = -G * mass1 * mass2 / distance;
  return kineticEnergy + potentialEnergy;
}

/**
 * 计算轨道角动量
 * @param {number} mass - 质量
 * @param {Object} position - 位置向量
 * @param {Object} velocity - 速度向量
 * @returns {Object} 角动量向量
 */
function angularMomentum(mass, position, velocity) {
  const r = { x: position.x, y: position.y, z: position.z };
  const v = { x: velocity.x, y: velocity.y, z: velocity.z };
  const cross = crossProduct(r, v);
  return scaleVector(cross, mass);
}

/**
 * 计算系统的质心
 * @param {Array} bodies - 天体数组，每个天体包含质量和位置
 * @returns {Object} 质心位置
 */
function centerOfMass(bodies) {
  let totalMass = 0;
  let cx = 0, cy = 0, cz = 0;
  
  for (const body of bodies) {
    totalMass += body.mass;
    cx += body.position.x * body.mass;
    cy += body.position.y * body.mass;
    cz += body.position.z * body.mass;
  }
  
  if (totalMass === 0) return { x: 0, y: 0, z: 0 };
  
  return {
    x: cx / totalMass,
    y: cy / totalMass,
    z: cz / totalMass
  };
}

/**
 * 计算系统的总动量
 * @param {Array} bodies - 天体数组，每个天体包含质量和速度
 * @returns {Object} 总动量向量
 */
function totalMomentum(bodies) {
  let px = 0, py = 0, pz = 0;
  
  for (const body of bodies) {
    px += body.velocity.x * body.mass;
    py += body.velocity.y * body.mass;
    pz += body.velocity.z * body.mass;
  }
  
  return { x: px, y: py, z: pz };
}

/**
 * 计算系统的总角动量
 * @param {Array} bodies - 天体数组，每个天体包含质量、位置和速度
 * @returns {Object} 总角动量向量
 */
function totalAngularMomentum(bodies) {
  let Lx = 0, Ly = 0, Lz = 0;
  
  for (const body of bodies) {
    const L = angularMomentum(body.mass, body.position, body.velocity);
    Lx += L.x;
    Ly += L.y;
    Lz += L.z;
  }
  
  return { x: Lx, y: Ly, z: Lz };
}

/**
 * 计算系统的总能量
 * @param {Array} bodies - 天体数组，每个天体包含质量、位置和速度
 * @returns {number} 总能量
 */
function totalEnergy(bodies) {
  let energy = 0;
  
  // 动能
  for (const body of bodies) {
    const v2 = body.velocity.x * body.velocity.x + 
               body.velocity.y * body.velocity.y + 
               body.velocity.z * body.velocity.z;
    energy += 0.5 * body.mass * v2;
  }
  
  // 势能
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const body1 = bodies[i];
      const body2 = bodies[j];
      const dist = distance(body1.position, body2.position);
      energy -= G * body1.mass * body2.mass / dist;
    }
  }
  
  return energy;
}
