/**
 * 数学工具函数
 */

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
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 将值限制在指定范围内
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
 * 计算两点之间的距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 距离
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的角度（弧度）
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 角度（弧度）
 */
function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 将弧度转换为角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

/**
 * 将角度转换为弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 将值从一个范围映射到另一个范围
 * @param {number} value - 要映射的值
 * @param {number} inMin - 输入范围最小值
 * @param {number} inMax - 输入范围最大值
 * @param {number} outMin - 输出范围最小值
 * @param {number} outMax - 输出范围最大值
 * @returns {number} 映射后的值
 */
function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * 将值从一个范围映射到另一个范围，并限制在输出范围内
 * @param {number} value - 要映射的值
 * @param {number} inMin - 输入范围最小值
 * @param {number} inMax - 输入范围最大值
 * @param {number} outMin - 输出范围最小值
 * @param {number} outMax - 输出范围最大值
 * @returns {number} 映射后的值
 */
function mapClamped(value, inMin, inMax, outMin, outMax) {
  return clamp(map(value, inMin, inMax, outMin, outMax), outMin, outMax);
}

/**
 * 计算两个颜色之间的插值
 * @param {string} color1 - 第一个颜色（十六进制）
 * @param {string} color2 - 第二个颜色（十六进制）
 * @param {number} t - 插值因子 (0-1)
 * @returns {string} 插值后的颜色（十六进制）
 */
function lerpColor(color1, color2, t) {
  // 解析颜色
  const r1 = parseInt(color1.substr(1, 2), 16);
  const g1 = parseInt(color1.substr(3, 2), 16);
  const b1 = parseInt(color1.substr(5, 2), 16);
  
  const r2 = parseInt(color2.substr(1, 2), 16);
  const g2 = parseInt(color2.substr(3, 2), 16);
  const b2 = parseInt(color2.substr(5, 2), 16);
  
  // 插值
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  
  // 转换回十六进制
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 将HSL颜色转换为RGB颜色
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {string} RGB颜色（十六进制）
 */
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 生成随机颜色
 * @returns {string} 随机颜色（十六进制）
 */
function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * 计算贝塞尔曲线点
 * @param {number} t - 参数 (0-1)
 * @param {Array} points - 控制点数组，每个点是 [x, y] 形式
 * @returns {Array} 曲线上的点 [x, y]
 */
function bezierPoint(t, points) {
  const n = points.length - 1;
  let x = 0;
  let y = 0;
  
  for (let i = 0; i <= n; i++) {
    const b = bernstein(n, i, t);
    x += points[i][0] * b;
    y += points[i][1] * b;
  }
  
  return [x, y];
}

/**
 * 计算伯恩斯坦多项式
 * @param {number} n - 阶数
 * @param {number} i - 索引
 * @param {number} t - 参数 (0-1)
 * @returns {number} 伯恩斯坦多项式值
 */
function bernstein(n, i, t) {
  return binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
}

/**
 * 计算二项式系数
 * @param {number} n - 上标
 * @param {number} k - 下标
 * @returns {number} 二项式系数
 */
function binomial(n, k) {
  let coeff = 1;
  for (let i = 0; i < k; i++) {
    coeff *= (n - i) / (i + 1);
  }
  return coeff;
}

/**
 * 将数值四舍五入到指定小数位
 * @param {number} value - 要四舍五入的值
 * @param {number} decimals - 小数位数
 * @returns {number} 四舍五入后的值
 */
function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * 计算两个向量的点积
 * @param {Array} v1 - 第一个向量 [x, y]
 * @param {Array} v2 - 第二个向量 [x, y]
 * @returns {number} 点积
 */
function dotProduct(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

/**
 * 计算向量的长度
 * @param {Array} v - 向量 [x, y]
 * @returns {number} 向量长度
 */
function vectorLength(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

/**
 * 归一化向量
 * @param {Array} v - 向量 [x, y]
 * @returns {Array} 归一化后的向量 [x, y]
 */
function normalizeVector(v) {
  const len = vectorLength(v);
  if (len === 0) return [0, 0];
  return [v[0] / len, v[1] / len];
}

/**
 * 计算向量的叉积
 * @param {Array} v1 - 第一个向量 [x, y]
 * @param {Array} v2 - 第二个向量 [x, y]
 * @returns {number} 叉积
 */
function crossProduct(v1, v2) {
  return v1[0] * v2[1] - v1[1] * v2[0];
}

/**
 * 计算两个向量之间的角度（弧度）
 * @param {Array} v1 - 第一个向量 [x, y]
 * @param {Array} v2 - 第二个向量 [x, y]
 * @returns {number} 角度（弧度）
 */
function angleBetweenVectors(v1, v2) {
  const dot = dotProduct(v1, v2);
  const len1 = vectorLength(v1);
  const len2 = vectorLength(v2);
  return Math.acos(dot / (len1 * len2));
}

/**
 * 将数值转换为带前导零的字符串
 * @param {number} num - 数值
 * @param {number} size - 字符串长度
 * @returns {string} 带前导零的字符串
 */
function padNumber(num, size) {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

/**
 * 生成UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 计算两个时间戳之间的差值（毫秒）
 * @param {number} t1 - 第一个时间戳
 * @param {number} t2 - 第二个时间戳
 * @returns {number} 时间差（毫秒）
 */
function timeDiff(t1, t2) {
  return Math.abs(t2 - t1);
}

/**
 * 将毫秒转换为节拍时间
 * @param {number} ms - 毫秒
 * @param {number} bpm - 每分钟节拍数
 * @returns {number} 节拍时间
 */
function msToBeats(ms, bpm) {
  const beatMs = 60000 / bpm; // 一拍的毫秒数
  return ms / beatMs;
}

/**
 * 将节拍时间转换为毫秒
 * @param {number} beats - 节拍时间
 * @param {number} bpm - 每分钟节拍数
 * @returns {number} 毫秒
 */
function beatsToMs(beats, bpm) {
  const beatMs = 60000 / bpm; // 一拍的毫秒数
  return beats * beatMs;
}

/**
 * 量化时间到最近的节拍
 * @param {number} ms - 毫秒
 * @param {number} bpm - 每分钟节拍数
 * @param {number} division - 节拍细分（1=整拍，4=四分音符，8=八分音符等）
 * @returns {number} 量化后的毫秒
 */
function quantizeTime(ms, bpm, division = 4) {
  const beatMs = 60000 / bpm; // 一拍的毫秒数
  const divisionMs = beatMs / division; // 一个细分的毫秒数
  return Math.round(ms / divisionMs) * divisionMs;
}

/**
 * 计算循环中的位置
 * @param {number} value - 当前值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 循环后的值
 */
function cycle(value, min, max) {
  const range = max - min;
  return min + ((value - min) % range + range) % range;
}

/**
 * 平滑过渡函数（缓动）
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 平滑值 (0-1)
 */
function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * 更平滑的过渡函数
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 平滑值 (0-1)
 */
function smootherStep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * 正弦缓动
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 缓动值 (0-1)
 */
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * 二次方缓动
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 缓动值 (0-1)
 */
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * 三次方缓动
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 缓动值 (0-1)
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 弹性缓动
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 缓动值 (0-1)
 */
function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * 弹跳缓动
 * @param {number} t - 时间参数 (0-1)
 * @returns {number} 缓动值 (0-1)
 */
function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * 生成柏林噪声
 * 简化版本，仅用于基本效果
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} z - z坐标
 * @returns {number} 噪声值 (-1到1)
 */
function perlinNoise(x, y, z = 0) {
  // 简化的柏林噪声实现
  const noise = function(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    
    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;
    
    return lerp(
      lerp(
        lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
        lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
        v
      ),
      lerp(
        lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
        lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  };
  
  const fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  
  const grad = function(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  
  // 生成随机排列表
  const p = new Array(512);
  for (let i = 0; i < 256; i++) {
    p[i] = p[i + 256] = Math.floor(Math.random() * 256);
  }
  
  return noise(x, y, z);
}

/**
 * 生成分形布朗运动噪声
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} octaves - 倍频数
 * @param {number} persistence - 持续度
 * @returns {number} 噪声值 (0-1)
 */
function fbm(x, y, octaves = 6, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += perlinNoise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  // 归一化到0-1范围
  return (total / maxValue + 1) / 2;
}
