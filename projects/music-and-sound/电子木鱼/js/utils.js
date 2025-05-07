/**
 * 工具函数集合
 */

// 生成唯一ID
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// 限制数值在指定范围内
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// 线性插值
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// 随机范围内的数
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// 随机整数
function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

// 随机颜色
function randomColor() {
  return `hsl(${random(0, 360)}, ${random(70, 100)}%, ${random(60, 80)}%)`;
}

// 随机从数组中选择一项
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 检测设备类型
function detectDevice() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isLowEndDevice = detectLowEndDevice();
  
  return { isMobile, isIOS, isLowEndDevice };
}

// 检测低端设备
function detectLowEndDevice() {
  // 检查设备内存 (如果可用)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    return true;
  }
  
  // 检查硬件并发数
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  // 检查是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // 检查是否为旧版iOS设备
  const isOldIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                  !window.MSStream && 
                  !(window.devicePixelRatio >= 3);
  
  // 检查是否为低端Android设备
  const isLowEndAndroid = /Android/.test(navigator.userAgent) && 
                         (/Android 4/.test(navigator.userAgent) || 
                          /Android 5/.test(navigator.userAgent));
  
  return isOldIOS || isLowEndAndroid || (isMobile && window.devicePixelRatio < 2);
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 检测浏览器支持的功能
function detectBrowserFeatures() {
  return {
    webAudio: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined',
    webGL: (function() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch(e) {
        return false;
      }
    })(),
    touchEvents: 'ontouchstart' in window,
    vibration: 'vibrate' in navigator,
    fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob)
  };
}

// 格式化数字 (添加千位分隔符)
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// 振动反馈
function vibrateDevice(pattern) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('振动API调用失败:', e);
    }
  }
}

// 加载图片
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// 调整图片大小
function resizeImage(img, maxWidth, maxHeight) {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;
  
  // 计算缩放比例
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas.toDataURL('image/png');
}

// 创建圆形图片
function createCircularImage(img) {
  const canvas = document.createElement('canvas');
  const size = Math.min(img.width, img.height);
  
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  // 创建圆形裁剪区域
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  // 绘制图片
  ctx.drawImage(
    img,
    (img.width - size) / 2,
    (img.height - size) / 2,
    size,
    size,
    0,
    0,
    size,
    size
  );
  
  return canvas.toDataURL('image/png');
}

// 保存数据到本地存储
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('保存到本地存储失败:', e);
    return false;
  }
}

// 从本地存储加载数据
function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('从本地存储加载失败:', e);
    return null;
  }
}

// 生成随机文本
const positiveTexts = [
  "功德+1",
  "善哉善哉",
  "心如止水",
  "福报满满",
  "佛光普照",
  "心诚则灵",
  "修身养性",
  "禅心一念",
  "静心冥想",
  "清心寡欲",
  "内心平静",
  "福寿安康",
  "吉祥如意",
  "心想事成",
  "万事顺利",
  "平安喜乐",
  "智慧常在",
  "福慧双修",
  "心灵净化",
  "妙手回春"
];

// 连击文本
const comboTexts = {
  5: ["连击 x5", "小有所成"],
  10: ["连击 x10", "初具禅心"],
  20: ["连击 x20", "禅意渐浓"],
  30: ["连击 x30", "心如明镜"],
  50: ["连击 x50", "佛法无边", "Smokin' Sick Style!"],
  80: ["连击 x80", "功德无量", "Savage!"],
  100: ["连击 x100", "大彻大悟", "Combo Master!"],
  150: ["连击 x150", "六根清净", "Incredible!"],
  200: ["连击 x200", "顿悟成佛", "Unstoppable!"],
  300: ["连击 x300", "如来神掌", "Godlike!"],
  500: ["连击 x500", "佛祖附体", "ULTRA COMBO!"]
};

// DMC风格的连击评价
const dmcRankings = [
  { threshold: 10, rank: "D", color: "#6b7280" },
  { threshold: 20, rank: "C", color: "#3b82f6" },
  { threshold: 40, rank: "B", color: "#10b981" },
  { threshold: 60, rank: "A", color: "#f59e0b" },
  { threshold: 80, rank: "S", color: "#ef4444" },
  { threshold: 100, rank: "SS", color: "#8b5cf6" },
  { threshold: 150, rank: "SSS", color: "#ec4899" }
];

// 获取DMC风格的连击评价
function getDMCRanking(combo) {
  // 从高到低检查，找到第一个阈值小于等于当前连击数的等级
  for (let i = dmcRankings.length - 1; i >= 0; i--) {
    if (combo >= dmcRankings[i].threshold) {
      return dmcRankings[i];
    }
  }
  
  // 默认返回最低等级
  return { rank: "D", color: "#6b7280" };
}

// 获取随机正面文本
function getRandomPositiveText() {
  return randomChoice(positiveTexts);
}

// 获取连击文本
function getComboText(combo) {
  // 找到最接近但不超过当前连击数的阈值
  const thresholds = Object.keys(comboTexts).map(Number).sort((a, b) => a - b);
  let bestThreshold = 0;
  
  for (const threshold of thresholds) {
    if (combo >= threshold) {
      bestThreshold = threshold;
    } else {
      break;
    }
  }
  
  return bestThreshold > 0 ? randomChoice(comboTexts[bestThreshold]) : null;
}
