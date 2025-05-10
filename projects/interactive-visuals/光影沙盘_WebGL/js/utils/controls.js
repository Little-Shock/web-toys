/**
 * 控制工具函数
 */

// 检测设备类型
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 767;
}

// 检测是否支持触摸事件
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

// 检测是否支持设备方向
function supportsDeviceOrientation() {
  return window.DeviceMotionEvent !== undefined;
}

// 检测是否需要请求设备方向权限（iOS 13+）
function requiresOrientationPermission() {
  return typeof DeviceMotionEvent.requestPermission === 'function';
}

// 请求设备方向权限
async function requestOrientationPermission() {
  if (requiresOrientationPermission()) {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('请求设备方向权限失败:', error);
      return false;
    }
  }
  return true; // 不需要权限的设备
}

// 显示提示消息
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('active');
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, duration);
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

// 下载图像
function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 分享图像
async function shareImage(blob, title, text) {
  if (!navigator.share) {
    showToast('您的浏览器不支持分享功能');
    return false;
  }
  
  try {
    const file = new File([blob], title, { type: 'image/png' });
    
    await navigator.share({
      title: title,
      text: text,
      files: [file]
    });
    
    return true;
  } catch (error) {
    console.error('分享失败:', error);
    return false;
  }
}
