/**
 * 控制工具函数
 * 处理用户交互和控制
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

/**
 * 添加点击检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} callback - 点击回调函数
 */
function addTapDetection(element, callback) {
  const TAP_THRESHOLD = 300; // 点击时间阈值（毫秒）
  const MOVE_THRESHOLD = 10; // 移动距离阈值（像素）
  
  let startX, startY, startTime;
  let isTapping = false;
  
  function getTouchPosition(e) {
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  function startPress(e) {
    const position = getTouchPosition(e);
    startX = position.x;
    startY = position.y;
    startTime = Date.now();
    isTapping = true;
  }
  
  function endPress(e) {
    if (!isTapping) return;
    
    const position = e.changedTouches ? 
                    { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : 
                    { x: e.clientX, y: e.clientY };
    
    const deltaTime = Date.now() - startTime;
    const deltaX = Math.abs(position.x - startX);
    const deltaY = Math.abs(position.y - startY);
    
    // 如果时间短且移动距离小，则视为点击
    if (deltaTime < TAP_THRESHOLD && deltaX < MOVE_THRESHOLD && deltaY < MOVE_THRESHOLD) {
      callback(position);
    }
    
    isTapping = false;
  }
  
  function cancelPress() {
    isTapping = false;
  }
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchcancel', cancelPress);
  } else {
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', cancelPress);
  }
}

/**
 * 添加长按检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} callback - 长按回调函数
 * @param {number} threshold - 长按时间阈值（毫秒）
 */
function addLongPressDetection(element, callback, threshold = 500) {
  const MOVE_THRESHOLD = 10; // 移动距离阈值（像素）
  
  let startX, startY;
  let longPressTimer;
  let isLongPressing = false;
  
  function getTouchPosition(e) {
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  function startPress(e) {
    const position = getTouchPosition(e);
    startX = position.x;
    startY = position.y;
    
    isLongPressing = false;
    clearTimeout(longPressTimer);
    
    longPressTimer = setTimeout(() => {
      isLongPressing = true;
      callback(position);
    }, threshold);
  }
  
  function movePress(e) {
    if (!longPressTimer) return;
    
    const position = getTouchPosition(e);
    const deltaX = Math.abs(position.x - startX);
    const deltaY = Math.abs(position.y - startY);
    
    // 如果移动距离过大，取消长按
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
  
  function endPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchmove', movePress, { passive: true });
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchcancel', endPress);
  } else {
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mousemove', movePress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', endPress);
  }
  
  return {
    isLongPressing: () => isLongPressing
  };
}

/**
 * 添加拖动检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} dragCallback - 拖动回调函数
 * @param {Function} startCallback - 开始拖动回调函数
 * @param {Function} endCallback - 结束拖动回调函数
 */
function addDragDetection(element, dragCallback, startCallback, endCallback) {
  let isDragging = false;
  let lastX, lastY;
  
  function getTouchPosition(e) {
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }
  
  function startDrag(e) {
    const position = getTouchPosition(e);
    lastX = position.x;
    lastY = position.y;
    isDragging = true;
    
    if (startCallback) {
      startCallback(position);
    }
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const position = getTouchPosition(e);
    const deltaX = position.x - lastX;
    const deltaY = position.y - lastY;
    
    if (dragCallback) {
      dragCallback(deltaX, deltaY, position);
    }
    
    lastX = position.x;
    lastY = position.y;
  }
  
  function endDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (endCallback) {
      const position = e.changedTouches ? 
                      { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : 
                      { x: e.clientX, y: e.clientY };
      endCallback(position);
    }
  }
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchstart', startDrag, { passive: true });
    element.addEventListener('touchmove', drag, { passive: true });
    element.addEventListener('touchend', endDrag);
    element.addEventListener('touchcancel', endDrag);
  } else {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
  }
  
  return {
    isDragging: () => isDragging
  };
}

/**
 * 添加设备方向事件监听器
 * @param {Function} callback - 方向变化回调函数
 * @returns {boolean} 是否成功添加监听器
 */
function addDeviceOrientationListener(callback) {
  if (supportsDeviceOrientation()) {
    window.addEventListener('deviceorientation', callback);
    return true;
  }
  
  return false;
}

/**
 * 移除设备方向事件监听器
 * @param {Function} callback - 方向变化回调函数
 */
function removeDeviceOrientationListener(callback) {
  window.removeEventListener('deviceorientation', callback);
}

/**
 * 添加设备运动事件监听器
 * @param {Function} callback - 运动变化回调函数
 * @returns {boolean} 是否成功添加监听器
 */
function addDeviceMotionListener(callback) {
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', callback);
    return true;
  }
  
  return false;
}

/**
 * 移除设备运动事件监听器
 * @param {Function} callback - 运动变化回调函数
 */
function removeDeviceMotionListener(callback) {
  window.removeEventListener('devicemotion', callback);
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时间（毫秒）
 */
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('active');
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, duration);
}

/**
 * 触发振动
 * @param {number|number[]} pattern - 振动模式
 * @returns {boolean} 是否成功触发振动
 */
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
    return true;
  }
  
  return false;
}
