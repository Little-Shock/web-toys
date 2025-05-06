/**
 * 颜色工具函数
 */

/**
 * 根据恒星质量和温度获取颜色
 * @param {number} mass - 恒星质量
 * @param {number} temperature - 恒星温度
 * @returns {Object} 颜色信息 {hex, rgb, name}
 */
function getStarColor(mass, temperature) {
  // 根据温度估算恒星颜色
  // 参考: https://en.wikipedia.org/wiki/Stellar_classification
  
  // 默认颜色（太阳类型，G型恒星）
  let color = {
    hex: '#FFF4E8',
    rgb: [255, 244, 232],
    name: 'G型恒星'
  };
  
  // 根据温度分类
  if (temperature > 30000) {
    // O型恒星 - 蓝色
    color = {
      hex: '#9BB0FF',
      rgb: [155, 176, 255],
      name: 'O型恒星'
    };
  } else if (temperature > 10000) {
    // B型恒星 - 蓝白色
    color = {
      hex: '#CAD7FF',
      rgb: [202, 215, 255],
      name: 'B型恒星'
    };
  } else if (temperature > 7500) {
    // A型恒星 - 白色
    color = {
      hex: '#F8F7FF',
      rgb: [248, 247, 255],
      name: 'A型恒星'
    };
  } else if (temperature > 6000) {
    // F型恒星 - 黄白色
    color = {
      hex: '#FFF4EA',
      rgb: [255, 244, 234],
      name: 'F型恒星'
    };
  } else if (temperature > 5200) {
    // G型恒星 - 黄色（太阳类型）
    color = {
      hex: '#FFF2A1',
      rgb: [255, 242, 161],
      name: 'G型恒星'
    };
  } else if (temperature > 3700) {
    // K型恒星 - 橙色
    color = {
      hex: '#FFD2A1',
      rgb: [255, 210, 161],
      name: 'K型恒星'
    };
  } else {
    // M型恒星 - 红色
    color = {
      hex: '#FFB199',
      rgb: [255, 177, 153],
      name: 'M型恒星'
    };
  }
  
  return color;
}

/**
 * 根据恒星质量获取发光强度
 * @param {number} mass - 恒星质量
 * @returns {number} 发光强度
 */
function getStarLuminosity(mass) {
  // 简化的质量-光度关系
  // L ∝ M^3.5 (对于主序星)
  return Math.pow(mass, 3.5);
}

/**
 * 根据恒星质量获取半径
 * @param {number} mass - 恒星质量
 * @returns {number} 恒星半径
 */
function getStarRadius(mass) {
  // 简化的质量-半径关系
  // R ∝ M^0.8 (对于主序星)
  return Math.pow(mass, 0.8);
}

/**
 * 将RGB颜色转换为十六进制颜色
 * @param {number} r - 红色分量 [0, 255]
 * @param {number} g - 绿色分量 [0, 255]
 * @param {number} b - 蓝色分量 [0, 255]
 * @returns {string} 十六进制颜色
 */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 将十六进制颜色转换为RGB颜色
 * @param {string} hex - 十六进制颜色
 * @returns {Array} RGB颜色 [r, g, b]
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * 在两个颜色之间插值
 * @param {Array} color1 - 颜色1 [r, g, b]
 * @param {Array} color2 - 颜色2 [r, g, b]
 * @param {number} t - 插值参数 [0, 1]
 * @returns {Array} 插值后的颜色 [r, g, b]
 */
function lerpColor(color1, color2, t) {
  t = Math.max(0, Math.min(1, t));
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t)
  ];
}

/**
 * 创建颜色渐变
 * @param {Array} colors - 颜色数组 [[r, g, b], ...]
 * @param {number} steps - 步数
 * @returns {Array} 渐变颜色数组 [[r, g, b], ...]
 */
function createGradient(colors, steps) {
  if (colors.length < 2) return colors;
  
  const gradient = [];
  const stepSize = 1 / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const t = i * stepSize;
    const segmentIndex = Math.min(Math.floor(t * (colors.length - 1)), colors.length - 2);
    const segmentT = (t * (colors.length - 1)) - segmentIndex;
    
    gradient.push(lerpColor(colors[segmentIndex], colors[segmentIndex + 1], segmentT));
  }
  
  return gradient;
}

/**
 * 创建恒星发光颜色
 * @param {string} baseColor - 基础颜色（十六进制）
 * @param {number} intensity - 发光强度 [0, 1]
 * @returns {string} 发光颜色（十六进制）
 */
function createStarGlowColor(baseColor, intensity) {
  const rgb = hexToRgb(baseColor);
  const white = [255, 255, 255];
  
  // 向白色插值
  const glowRgb = lerpColor(rgb, white, intensity);
  return rgbToHex(glowRgb[0], glowRgb[1], glowRgb[2]);
}

/**
 * 创建轨迹颜色渐变
 * @param {string} baseColor - 基础颜色（十六进制）
 * @param {number} steps - 步数
 * @returns {Array} 渐变颜色数组（十六进制）
 */
function createTrailGradient(baseColor, steps) {
  const rgb = hexToRgb(baseColor);
  const transparent = [...rgb, 0]; // 添加透明度
  const opaque = [...rgb, 1];
  
  const gradient = [];
  const stepSize = 1 / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const t = i * stepSize;
    const alpha = 1 - t;
    
    gradient.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`);
  }
  
  return gradient;
}
