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

// 获取触摸或鼠标事件的坐标
function getEventCoordinates(event, element) {
  const rect = element.getBoundingClientRect();
  let x, y;
  
  if (event.type.startsWith('touch')) {
    // 触摸事件
    const touch = event.touches[0] || event.changedTouches[0];
    x = touch.clientX - rect.left;
    y = touch.clientY - rect.top;
  } else {
    // 鼠标事件
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }
  
  // 归一化坐标 (0 到 1)
  x = x / rect.width;
  y = y / rect.height;
  
  // 转换为 -1 到 1 的范围
  x = x * 2 - 1;
  y = y * 2 - 1;
  
  return { x, y };
}

// 添加长按检测
function addLongPressDetection(element, callback, duration = 500) {
  let timer;
  let isPressed = false;
  let startPosition = { x: 0, y: 0 };
  
  // 开始按下
  const startPress = (event) => {
    isPressed = true;
    const coords = getEventCoordinates(event, element);
    startPosition = coords;
    
    timer = setTimeout(() => {
      if (isPressed) {
        callback(coords);
      }
    }, duration);
  };
  
  // 结束按下
  const endPress = () => {
    isPressed = false;
    clearTimeout(timer);
  };
  
  // 移动检测
  const movePress = (event) => {
    if (isPressed) {
      const coords = getEventCoordinates(event, element);
      const distance = Math.sqrt(
        Math.pow(coords.x - startPosition.x, 2) + 
        Math.pow(coords.y - startPosition.y, 2)
      );
      
      // 如果移动距离过大，取消长按
      if (distance > 0.1) {
        isPressed = false;
        clearTimeout(timer);
      }
    }
  };
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchstart', startPress);
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchcancel', endPress);
    element.addEventListener('touchmove', movePress);
  } else {
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', endPress);
    element.addEventListener('mousemove', movePress);
  }
  
  // 返回移除函数
  return () => {
    if (isTouchDevice()) {
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', endPress);
      element.removeEventListener('touchcancel', endPress);
      element.removeEventListener('touchmove', movePress);
    } else {
      element.removeEventListener('mousedown', startPress);
      element.removeEventListener('mouseup', endPress);
      element.removeEventListener('mouseleave', endPress);
      element.removeEventListener('mousemove', movePress);
    }
  };
}

// 添加拖动检测
function addDragDetection(element, moveCallback, startCallback, endCallback) {
  let isDragging = false;
  let lastPosition = { x: 0, y: 0 };
  
  // 开始拖动
  const startDrag = (event) => {
    isDragging = true;
    lastPosition = getEventCoordinates(event, element);
    
    if (startCallback) {
      startCallback(lastPosition);
    }
  };
  
  // 拖动中
  const drag = (event) => {
    if (!isDragging) return;
    
    const currentPosition = getEventCoordinates(event, element);
    const deltaX = currentPosition.x - lastPosition.x;
    const deltaY = currentPosition.y - lastPosition.y;
    
    moveCallback(deltaX, deltaY, currentPosition);
    
    lastPosition = currentPosition;
  };
  
  // 结束拖动
  const endDrag = (event) => {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (endCallback) {
      const finalPosition = getEventCoordinates(event, element);
      endCallback(finalPosition);
    }
  };
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchstart', startDrag);
    element.addEventListener('touchmove', drag);
    element.addEventListener('touchend', endDrag);
    element.addEventListener('touchcancel', endDrag);
  } else {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
  }
  
  // 返回移除函数
  return () => {
    if (isTouchDevice()) {
      element.removeEventListener('touchstart', startDrag);
      element.removeEventListener('touchmove', drag);
      element.removeEventListener('touchend', endDrag);
      element.removeEventListener('touchcancel', endDrag);
    } else {
      element.removeEventListener('mousedown', startDrag);
      element.removeEventListener('mousemove', drag);
      element.removeEventListener('mouseup', endDrag);
      element.removeEventListener('mouseleave', endDrag);
    }
  };
}

// 添加点击检测
function addTapDetection(element, callback, doubleTapCallback) {
  let lastTap = 0;
  const doubleTapDelay = 300; // 双击间隔时间（毫秒）
  
  const handleTap = (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    const position = getEventCoordinates(event, element);
    
    if (tapLength < doubleTapDelay && tapLength > 0 && doubleTapCallback) {
      // 双击
      doubleTapCallback(position);
      event.preventDefault();
    } else {
      // 单击
      callback(position);
    }
    
    lastTap = currentTime;
  };
  
  // 添加事件监听器
  if (isTouchDevice()) {
    element.addEventListener('touchend', handleTap);
  } else {
    element.addEventListener('click', handleTap);
  }
  
  // 返回移除函数
  return () => {
    if (isTouchDevice()) {
      element.removeEventListener('touchend', handleTap);
    } else {
      element.removeEventListener('click', handleTap);
    }
  };
}
