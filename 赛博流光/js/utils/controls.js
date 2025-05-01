/**
 * 交互控制工具函数
 */

// 检测设备类型
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检测是否支持触摸事件
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// 检测是否支持设备方向事件
function supportsDeviceOrientation() {
  return 'DeviceOrientationEvent' in window;
}

// 检测是否需要请求设备方向权限（iOS 13+）
function requiresOrientationPermission() {
  return typeof DeviceOrientationEvent !== 'undefined' && 
         typeof DeviceOrientationEvent.requestPermission === 'function';
}

// 请求设备方向权限
async function requestOrientationPermission() {
  if (requiresOrientationPermission()) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('请求设备方向权限失败:', error);
      return false;
    }
  }
  
  return true; // 不需要权限
}

// 添加设备方向事件监听器
function addDeviceOrientationListener(callback) {
  if (supportsDeviceOrientation()) {
    window.addEventListener('deviceorientation', callback);
    return true;
  }
  
  return false;
}

// 移除设备方向事件监听器
function removeDeviceOrientationListener(callback) {
  window.removeEventListener('deviceorientation', callback);
}

// 添加设备运动事件监听器
function addDeviceMotionListener(callback) {
  if ('DeviceMotionEvent' in window) {
    window.addEventListener('devicemotion', callback);
    return true;
  }
  
  return false;
}

// 移除设备运动事件监听器
function removeDeviceMotionListener(callback) {
  window.removeEventListener('devicemotion', callback);
}

// 添加触摸事件监听器
function addTouchListeners(element, callbacks) {
  const { onStart, onMove, onEnd } = callbacks;
  
  if (isTouchDevice()) {
    if (onStart) element.addEventListener('touchstart', onStart);
    if (onMove) element.addEventListener('touchmove', onMove);
    if (onEnd) element.addEventListener('touchend', onEnd);
  } else {
    if (onStart) element.addEventListener('mousedown', onStart);
    if (onMove) element.addEventListener('mousemove', onMove);
    if (onEnd) element.addEventListener('mouseup', onEnd);
  }
}

// 移除触摸事件监听器
function removeTouchListeners(element, callbacks) {
  const { onStart, onMove, onEnd } = callbacks;
  
  if (isTouchDevice()) {
    if (onStart) element.removeEventListener('touchstart', onStart);
    if (onMove) element.removeEventListener('touchmove', onMove);
    if (onEnd) element.removeEventListener('touchend', onEnd);
  } else {
    if (onStart) element.removeEventListener('mousedown', onStart);
    if (onMove) element.removeEventListener('mousemove', onMove);
    if (onEnd) element.removeEventListener('mouseup', onEnd);
  }
}

// 获取触摸/鼠标事件的坐标
function getEventCoordinates(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
  } else {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }
}

// 进入全屏模式
function enterFullscreen(element = document.documentElement) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

// 退出全屏模式
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

// 检测是否处于全屏模式
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

// 添加全屏变化事件监听器
function addFullscreenChangeListener(callback) {
  document.addEventListener('fullscreenchange', callback);
  document.addEventListener('mozfullscreenchange', callback);
  document.addEventListener('webkitfullscreenchange', callback);
  document.addEventListener('MSFullscreenChange', callback);
}

// 移除全屏变化事件监听器
function removeFullscreenChangeListener(callback) {
  document.removeEventListener('fullscreenchange', callback);
  document.removeEventListener('mozfullscreenchange', callback);
  document.removeEventListener('webkitfullscreenchange', callback);
  document.removeEventListener('MSFullscreenChange', callback);
}
