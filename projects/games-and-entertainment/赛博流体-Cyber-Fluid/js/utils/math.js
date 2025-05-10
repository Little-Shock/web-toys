/**
 * 数学工具函数
 */

// 将值限制在指定范围内
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// 线性插值
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// 平滑步进函数
function smoothstep(min, max, value) {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

// 生成指定范围内的随机数
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// 生成指定范围内的随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 角度转弧度
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

// 弧度转角度
function radToDeg(radians) {
  return radians * 180 / Math.PI;
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

// 将值从一个范围映射到另一个范围
function map(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 平滑动画的缓动函数
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
  
  // 正弦
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => (1 - Math.cos(Math.PI * t)) / 2
};
