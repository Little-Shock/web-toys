/**
 * 颜色工具函数
 */

/**
 * 根据恒星质量和温度获取恒星颜色
 * @param {number} mass - 恒星质量（太阳质量单位）
 * @param {number} temperature - 恒星温度（开尔文）
 * @returns {Object} 颜色对象，包含hex和rgb属性
 */
function getStarColor(mass, temperature) {
  // 默认温度基于质量估算（简化模型）
  if (!temperature) {
    // 简化的质量-温度关系
    temperature = 5778 * Math.pow(mass, 0.5); // 太阳温度约5778K
  }
  
  // 基于温度的颜色映射（简化的黑体辐射模型）
  let r, g, b;
  
  // 温度范围从2000K（红色）到30000K（蓝色）
  if (temperature < 3500) {
    // 红色恒星
    r = 255;
    g = 100 + (temperature - 2000) / 1500 * 70;
    b = 0;
  } else if (temperature < 5000) {
    // 橙色到黄色恒星
    r = 255;
    g = 170 + (temperature - 3500) / 1500 * 85;
    b = (temperature - 3500) / 1500 * 30;
  } else if (temperature < 6000) {
    // 黄色恒星（如太阳）
    r = 255;
    g = 255;
    b = (temperature - 5000) / 1000 * 170;
  } else if (temperature < 7500) {
    // 黄白色到白色恒星
    r = 255;
    g = 255;
    b = 170 + (temperature - 6000) / 1500 * 85;
  } else if (temperature < 10000) {
    // 白色到蓝白色恒星
    r = 255 - (temperature - 7500) / 2500 * 60;
    g = 255 - (temperature - 7500) / 2500 * 60;
    b = 255;
  } else if (temperature < 30000) {
    // 蓝白色到蓝色恒星
    r = 195 - (temperature - 10000) / 20000 * 95;
    g = 195 - (temperature - 10000) / 20000 * 95;
    b = 255;
  } else {
    // 非常热的蓝色恒星
    r = 100;
    g = 100;
    b = 255;
  }
  
  // 确保RGB值在有效范围内
  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));
  
  // 创建十六进制颜色代码
  const hex = rgbToHex(r, g, b);
  
  return {
    hex: hex,
    rgb: { r, g, b }
  };
}

/**
 * 将RGB值转换为十六进制颜色代码
 * @param {number} r - 红色分量 (0-255)
 * @param {number} g - 绿色分量 (0-255)
 * @param {number} b - 蓝色分量 (0-255)
 * @returns {string} 十六进制颜色代码
 */
function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * 将单个颜色分量转换为十六进制
 * @param {number} c - 颜色分量 (0-255)
 * @returns {string} 十六进制表示
 */
function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

/**
 * 在两个颜色之间进行插值
 * @param {string} color1 - 起始颜色（十六进制）
 * @param {string} color2 - 结束颜色（十六进制）
 * @param {number} factor - 插值因子 (0-1)
 * @returns {string} 插值后的颜色（十六进制）
 */
function interpolateColors(color1, color2, factor) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));
  
  return rgbToHex(r, g, b);
}

/**
 * 将十六进制颜色代码转换为RGB对象
 * @param {string} hex - 十六进制颜色代码
 * @returns {Object} RGB对象，包含r、g、b属性
 */
function hexToRgb(hex) {
  // 移除#前缀（如果有）
  hex = hex.replace(/^#/, '');
  
  // 解析十六进制值
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

/**
 * 调整颜色亮度
 * @param {string} hex - 十六进制颜色代码
 * @param {number} factor - 亮度因子 (>1增加亮度，<1降低亮度)
 * @returns {string} 调整后的颜色（十六进制）
 */
function adjustBrightness(hex, factor) {
  const rgb = hexToRgb(hex);
  
  const r = Math.min(255, Math.round(rgb.r * factor));
  const g = Math.min(255, Math.round(rgb.g * factor));
  const b = Math.min(255, Math.round(rgb.b * factor));
  
  return rgbToHex(r, g, b);
}

/**
 * 创建恒星发光材质的颜色
 * @param {string} baseColor - 基础颜色（十六进制）
 * @returns {Object} 包含核心、中间和外部颜色的对象
 */
function createStarGlowColors(baseColor) {
  const rgb = hexToRgb(baseColor);
  
  // 核心颜色（更亮、更白）
  const coreR = Math.min(255, Math.round(rgb.r * 1.5));
  const coreG = Math.min(255, Math.round(rgb.g * 1.5));
  const coreB = Math.min(255, Math.round(rgb.b * 1.5));
  const coreColor = rgbToHex(coreR, coreG, coreB);
  
  // 中间颜色（原始颜色）
  const midColor = baseColor;
  
  // 外部颜色（更暗）
  const outerR = Math.round(rgb.r * 0.5);
  const outerG = Math.round(rgb.g * 0.5);
  const outerB = Math.round(rgb.b * 0.5);
  const outerColor = rgbToHex(outerR, outerG, outerB);
  
  return {
    core: coreColor,
    mid: midColor,
    outer: outerColor
  };
}

/**
 * 为轨迹创建渐变颜色数组
 * @param {string} baseColor - 基础颜色（十六进制）
 * @param {number} steps - 渐变步数
 * @returns {Array} 颜色数组
 */
function createTrailGradient(baseColor, steps) {
  const colors = [];
  const rgb = hexToRgb(baseColor);
  
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    // 从基础颜色渐变到透明
    const r = Math.round(rgb.r);
    const g = Math.round(rgb.g);
    const b = Math.round(rgb.b);
    const a = 1 - factor;
    
    colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
  }
  
  return colors;
}
