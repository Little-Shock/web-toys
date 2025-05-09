/**
 * 粒子游泳 - Main
 * 主控制脚本
 */

// 全局变量
let particleSystem;
let controlsPanel;
let isPanelCollapsed = false;

// 应用配置
const config = {
  maxParticles: 300,
  hueSpeed: 0.15,
  bgSaturation: 80,
  bgBrightness: 80
};

// p5.js 设置函数
function setup() {
  // 创建全屏画布
  createCanvas(windowWidth, windowHeight);

  // 设置颜色模式
  colorMode(HSB, 360, 100, 100, 100);

  // 初始化粒子系统
  particleSystem = new ParticleSystem();

  // 检测设备并调整配置
  adjustForDevice();

  // 初始化控制面板
  initControlPanel();

  // 显示版本信息
  displayVersionInfo();
}

// p5.js 绘制函数
function draw() {
  // 更新和显示粒子系统
  particleSystem.update();
  particleSystem.display();
}

// 窗口大小改变时调整画布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 鼠标移动时添加粒子
function mouseMoved() {
  if (!mouseIsPressed) {
    particleSystem.addParticles(mouseX, mouseY, 1);
  }
  return false; // 防止默认行为
}

// 鼠标拖动时添加粒子
function mouseDragged() {
  particleSystem.addParticles(mouseX, mouseY, 2);
  return false; // 防止默认行为
}

// 鼠标按下时添加粒子
function mousePressed() {
  particleSystem.addParticles(mouseX, mouseY, 15);
  return false; // 防止默认行为
}

// 触摸开始时添加粒子
function touchStarted() {
  if (touches.length > 0) {
    particleSystem.addParticles(touches[0].x, touches[0].y, 15);
  }
  return false; // 防止默认行为
}

// 触摸移动时添加粒子
function touchMoved() {
  if (touches.length > 0) {
    particleSystem.addParticles(touches[0].x, touches[0].y, 2);
  }
  return false; // 防止默认行为
}

// 根据设备调整配置
function adjustForDevice() {
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 检测是否为低端设备
  const isLowEndDevice = detectLowEndDevice();

  // 根据设备类型调整配置
  if (isMobile) {
    config.maxParticles = isLowEndDevice ? 100 : 150;
  } else {
    config.maxParticles = isLowEndDevice ? 200 : 300;
  }

  // 应用配置到粒子系统
  particleSystem.setMaxParticles(config.maxParticles);
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

  // 检查是否为旧版iOS设备
  const isOldIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                  !window.MSStream &&
                  !(window.devicePixelRatio >= 3);

  // 检查是否为低端Android设备
  const isLowEndAndroid = /Android/.test(navigator.userAgent) &&
                         (/Android 4/.test(navigator.userAgent) ||
                          /Android 5/.test(navigator.userAgent));

  return isOldIOS || isLowEndAndroid || (window.devicePixelRatio < 2);
}

// 初始化控制面板
function initControlPanel() {
  // 获取控制面板元素
  controlsPanel = document.querySelector('.controls-panel');

  // 如果控制面板不存在，则创建
  if (!controlsPanel) {
    return;
  }

  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 在移动设备上默认折叠控制面板
  if (isMobile) {
    isPanelCollapsed = true;
    controlsPanel.classList.add('collapsed');
  }

  // 设置面板切换事件
  const panelHeader = controlsPanel.querySelector('.panel-header');
  if (panelHeader) {
    panelHeader.addEventListener('click', toggleControlPanel);
  }

  // 设置滑块控制事件
  const particleSlider = document.getElementById('particleCount');
  if (particleSlider) {
    particleSlider.value = config.maxParticles;
    document.getElementById('particleValue').textContent = config.maxParticles;

    particleSlider.addEventListener('input', function() {
      const value = parseInt(this.value);
      document.getElementById('particleValue').textContent = value;
      config.maxParticles = value;
      particleSystem.setMaxParticles(value);
    });
  }

  // 设置色相速度滑块
  const hueSpeedSlider = document.getElementById('hueSpeed');
  if (hueSpeedSlider) {
    hueSpeedSlider.value = config.hueSpeed * 100;
    document.getElementById('hueValue').textContent = config.hueSpeed.toFixed(2);

    hueSpeedSlider.addEventListener('input', function() {
      const value = parseFloat(this.value) / 100;
      document.getElementById('hueValue').textContent = value.toFixed(2);
      config.hueSpeed = value;
      particleSystem.setHueSpeed(value);
    });
  }

  // 设置背景饱和度滑块
  const bgSatSlider = document.getElementById('bgSaturation');
  if (bgSatSlider) {
    bgSatSlider.value = config.bgSaturation;
    document.getElementById('satValue').textContent = config.bgSaturation;

    bgSatSlider.addEventListener('input', function() {
      const value = parseInt(this.value);
      document.getElementById('satValue').textContent = value;
      config.bgSaturation = value;
      particleSystem.setBgSaturation(value);
    });
  }

  // 设置背景亮度滑块
  const bgBrightSlider = document.getElementById('bgBrightness');
  if (bgBrightSlider) {
    bgBrightSlider.value = config.bgBrightness;
    document.getElementById('brightValue').textContent = config.bgBrightness;

    bgBrightSlider.addEventListener('input', function() {
      const value = parseInt(this.value);
      document.getElementById('brightValue').textContent = value;
      config.bgBrightness = value;
      particleSystem.setBgBrightness(value);
    });
  }
}

// 切换控制面板显示/隐藏
function toggleControlPanel() {
  isPanelCollapsed = !isPanelCollapsed;
  if (isPanelCollapsed) {
    controlsPanel.classList.add('collapsed');
  } else {
    controlsPanel.classList.remove('collapsed');
  }
}

// 显示版本信息
function displayVersionInfo() {
  const versionElement = document.getElementById('version');
  if (versionElement) {
    versionElement.textContent = '1.0.0';
  }
}
