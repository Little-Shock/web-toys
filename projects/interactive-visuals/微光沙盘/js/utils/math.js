/**
 * 数学工具函数
 */

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
 * @returns {number} 两点之间的距离
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
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
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

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
 * 生成随机颜色
 * @returns {string} 十六进制颜色值
 */
function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * 在两个颜色之间插值
 * @param {string} color1 - 第一个颜色 (十六进制)
 * @param {string} color2 - 第二个颜色 (十六进制)
 * @param {number} t - 插值因子 (0-1)
 * @returns {string} 插值后的颜色
 */
function lerpColor(color1, color2, t) {
  // 解析颜色
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
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
 * @returns {Object} RGB颜色对象 {r, g, b}
 */
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // 灰色
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
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * 将RGB颜色转换为HSL颜色
 * @param {number} r - 红色 (0-255)
 * @param {number} g - 绿色 (0-255)
 * @param {number} b - 蓝色 (0-255)
 * @returns {Object} HSL颜色对象 {h, s, l}
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // 灰色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * 生成柏林噪声
 * 简化版本，用于生成随机地形
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} seed - 随机种子
 * @returns {number} 噪声值 (0-1)
 */
function perlinNoise(x, y, seed = 0) {
  // 简化的柏林噪声实现
  const noise = function(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    
    return lerp(
      lerp(grad(p[A], x, y), grad(p[B], x - 1, y), u),
      lerp(grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1), u),
      v
    );
  };
  
  const fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  
  const grad = function(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  
  // 使用种子生成伪随机置换表
  const p = new Array(512);
  const permutation = [];
  
  for (let i = 0; i < 256; i++) {
    permutation[i] = i;
  }
  
  // 使用Fisher-Yates洗牌算法
  for (let i = 255; i > 0; i--) {
    const j = Math.floor((i + 1) * ((Math.sin(i * seed) * 0.5 + 0.5)));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  
  for (let i = 0; i < 256; i++) {
    p[i] = p[i + 256] = permutation[i];
  }
  
  // 将噪声值映射到0-1范围
  return (noise(x, y) + 1) * 0.5;
}

/**
 * 生成分形布朗运动噪声
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} octaves - 八度数
 * @param {number} persistence - 持续度
 * @param {number} seed - 随机种子
 * @returns {number} 噪声值 (0-1)
 */
function fbm(x, y, octaves = 6, persistence = 0.5, seed = 0) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += perlinNoise(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  return total / maxValue;
}
