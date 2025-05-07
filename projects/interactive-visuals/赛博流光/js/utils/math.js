/**
 * 数学工具函数
 */

// 将角度转换为弧度
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

// 将弧度转换为角度
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

// 线性插值
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 限制值在指定范围内
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// 将值从一个范围映射到另一个范围
function map(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

// 生成指定范围内的随机数
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// 生成指定范围内的随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 计算两点之间的距离
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// 计算两点之间的角度（弧度）
function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// 平滑步进函数
function smoothstep(min, max, value) {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

// 缓动函数
const easing = {
  // 线性
  linear: t => t,
  
  // 二次方
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // 三次方
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // 弹性
  easeOutElastic: t => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }
};
