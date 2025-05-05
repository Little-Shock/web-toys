/**
 * 触摸交互工具函数
 */

/**
 * 添加点击/触摸检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} callback - 回调函数，参数为点击位置 {x, y}
 */
function addTapDetection(element, callback) {
  // 存储触摸开始信息
  let touchStartInfo = null;
  
  // 触摸开始事件
  element.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartInfo = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  }, { passive: true });
  
  // 触摸结束事件
  element.addEventListener('touchend', function(e) {
    if (!touchStartInfo) return;
    
    // 计算触摸时间和移动距离
    const touchTime = Date.now() - touchStartInfo.time;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const distance = Math.sqrt(
      Math.pow(touchEndX - touchStartInfo.x, 2) +
      Math.pow(touchEndY - touchStartInfo.y, 2)
    );
    
    // 如果触摸时间短且移动距离小，则视为点击
    if (touchTime < 300 && distance < 10) {
      callback({
        x: touchStartInfo.x,
        y: touchStartInfo.y
      });
    }
    
    touchStartInfo = null;
  }, { passive: true });
  
  // 鼠标点击事件（桌面端）
  element.addEventListener('click', function(e) {
    callback({
      x: e.clientX,
      y: e.clientY
    });
  });
}

/**
 * 添加长按检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} callback - 回调函数，参数为长按位置 {x, y}
 * @param {number} duration - 长按持续时间（毫秒）
 */
function addLongPressDetection(element, callback, duration = 500) {
  let longPressTimer = null;
  let longPressPosition = null;
  
  // 触摸开始事件
  element.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      longPressPosition = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      // 设置长按定时器
      longPressTimer = setTimeout(function() {
        if (longPressPosition) {
          callback(longPressPosition);
        }
      }, duration);
    }
  }, { passive: true });
  
  // 触摸移动事件
  element.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1 && longPressPosition) {
      const touch = e.touches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - longPressPosition.x, 2) +
        Math.pow(touch.clientY - longPressPosition.y, 2)
      );
      
      // 如果移动距离过大，取消长按
      if (distance > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressPosition = null;
      }
    }
  }, { passive: true });
  
  // 触摸结束事件
  element.addEventListener('touchend', function() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressPosition = null;
  }, { passive: true });
  
  // 触摸取消事件
  element.addEventListener('touchcancel', function() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressPosition = null;
  }, { passive: true });
  
  // 鼠标长按（桌面端）
  let mouseDownTime = 0;
  let mouseDownPosition = null;
  
  element.addEventListener('mousedown', function(e) {
    mouseDownTime = Date.now();
    mouseDownPosition = {
      x: e.clientX,
      y: e.clientY
    };
  });
  
  element.addEventListener('mouseup', function(e) {
    if (mouseDownPosition && Date.now() - mouseDownTime >= duration) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPosition.x, 2) +
        Math.pow(e.clientY - mouseDownPosition.y, 2)
      );
      
      if (distance < 10) {
        callback(mouseDownPosition);
      }
    }
    
    mouseDownPosition = null;
  });
}

/**
 * 添加拖动检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} dragCallback - 拖动回调函数，参数为拖动距离 (deltaX, deltaY) 和当前位置 {x, y}
 * @param {Function} startCallback - 开始拖动回调函数，参数为开始位置 {x, y}
 * @param {Function} endCallback - 结束拖动回调函数，参数为结束位置 {x, y}
 */
function addDragDetection(element, dragCallback, startCallback, endCallback) {
  let isDragging = false;
  let lastPosition = null;
  
  // 触摸事件
  element.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      const touch = e.touches[0];
      lastPosition = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      if (startCallback) {
        startCallback(lastPosition);
      }
    }
  }, { passive: true });
  
  element.addEventListener('touchmove', function(e) {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const currentPosition = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      const deltaX = currentPosition.x - lastPosition.x;
      const deltaY = currentPosition.y - lastPosition.y;
      
      dragCallback(deltaX, deltaY, currentPosition);
      
      lastPosition = currentPosition;
    }
  }, { passive: true });
  
  element.addEventListener('touchend', function(e) {
    if (isDragging) {
      isDragging = false;
      
      if (endCallback && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        endCallback({
          x: touch.clientX,
          y: touch.clientY
        });
      }
    }
  }, { passive: true });
  
  element.addEventListener('touchcancel', function() {
    isDragging = false;
  }, { passive: true });
  
  // 鼠标事件（桌面端）
  element.addEventListener('mousedown', function(e) {
    isDragging = true;
    lastPosition = {
      x: e.clientX,
      y: e.clientY
    };
    
    if (startCallback) {
      startCallback(lastPosition);
    }
  });
  
  window.addEventListener('mousemove', function(e) {
    if (isDragging) {
      const currentPosition = {
        x: e.clientX,
        y: e.clientY
      };
      
      const deltaX = currentPosition.x - lastPosition.x;
      const deltaY = currentPosition.y - lastPosition.y;
      
      dragCallback(deltaX, deltaY, currentPosition);
      
      lastPosition = currentPosition;
    }
  });
  
  window.addEventListener('mouseup', function(e) {
    if (isDragging) {
      isDragging = false;
      
      if (endCallback) {
        endCallback({
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  });
}

/**
 * 添加多点触控检测
 * @param {HTMLElement} element - 要添加事件的元素
 * @param {Function} touchCallback - 触摸回调函数，参数为触摸点数组
 * @param {Function} startCallback - 开始触摸回调函数
 * @param {Function} endCallback - 结束触摸回调函数
 */
function addMultiTouchDetection(element, touchCallback, startCallback, endCallback) {
  let activeTouches = {};
  
  element.addEventListener('touchstart', function(e) {
    // 记录新的触摸点
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      activeTouches[touch.identifier] = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now()
      };
    }
    
    if (startCallback) {
      startCallback(Object.values(activeTouches));
    }
    
    touchCallback(Object.values(activeTouches));
  }, { passive: true });
  
  element.addEventListener('touchmove', function(e) {
    // 更新触摸点位置
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (activeTouches[touch.identifier]) {
        activeTouches[touch.identifier].x = touch.clientX;
        activeTouches[touch.identifier].y = touch.clientY;
      }
    }
    
    touchCallback(Object.values(activeTouches));
  }, { passive: true });
  
  element.addEventListener('touchend', function(e) {
    // 移除结束的触摸点
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      delete activeTouches[touch.identifier];
    }
    
    if (endCallback) {
      endCallback(Object.values(activeTouches));
    }
    
    touchCallback(Object.values(activeTouches));
  }, { passive: true });
  
  element.addEventListener('touchcancel', function(e) {
    // 移除取消的触摸点
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      delete activeTouches[touch.identifier];
    }
    
    if (endCallback) {
      endCallback(Object.values(activeTouches));
    }
    
    touchCallback(Object.values(activeTouches));
  }, { passive: true });
}

/**
 * 添加设备方向检测
 * @param {Function} callback - 回调函数，参数为方向数据 {alpha, beta, gamma}
 */
function addDeviceOrientationDetection(callback) {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(e) {
      callback({
        alpha: e.alpha, // Z轴旋转角度 [0, 360)
        beta: e.beta,   // X轴旋转角度 [-180, 180)
        gamma: e.gamma  // Y轴旋转角度 [-90, 90)
      });
    }, { passive: true });
  }
}

/**
 * 添加设备运动检测
 * @param {Function} callback - 回调函数，参数为加速度数据 {x, y, z, interval}
 */
function addDeviceMotionDetection(callback) {
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function(e) {
      const acceleration = e.accelerationIncludingGravity;
      if (acceleration) {
        callback({
          x: acceleration.x,
          y: acceleration.y,
          z: acceleration.z,
          interval: e.interval
        });
      }
    }, { passive: true });
  }
}

/**
 * 检测设备是否支持触摸
 * @returns {boolean} 是否支持触摸
 */
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 检测设备是否支持方向感应
 * @returns {boolean} 是否支持方向感应
 */
function isOrientationSupported() {
  return 'DeviceOrientationEvent' in window;
}

/**
 * 检测设备是否支持运动感应
 * @returns {boolean} 是否支持运动感应
 */
function isMotionSupported() {
  return 'DeviceMotionEvent' in window;
}

/**
 * 请求设备方向权限（iOS 13+需要）
 * @returns {Promise} 权限请求结果
 */
function requestDeviceOrientationPermission() {
  return new Promise((resolve, reject) => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    } else {
      // 其他设备，假设已经有权限
      resolve(true);
    }
  });
}

/**
 * 请求设备运动权限（iOS 13+需要）
 * @returns {Promise} 权限请求结果
 */
function requestDeviceMotionPermission() {
  return new Promise((resolve, reject) => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          reject(error);
        });
    } else {
      // 其他设备，假设已经有权限
      resolve(true);
    }
  });
}

/**
 * 触发设备振动
 * @param {number|Array} pattern - 振动时间（毫秒）或振动模式数组
 * @returns {boolean} 是否成功触发振动
 */
function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
    return true;
  }
  return false;
}

/**
 * 阻止默认触摸行为
 * @param {HTMLElement} element - 要阻止默认行为的元素
 */
function preventDefaultTouchAction(element) {
  element.addEventListener('touchstart', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  element.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  element.addEventListener('touchend', function(e) {
    e.preventDefault();
  }, { passive: false });
}

/**
 * 阻止页面滚动
 */
function preventPageScroll() {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  
  document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
}

/**
 * 恢复页面滚动
 */
function restorePageScroll() {
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  
  document.body.removeEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
}

/**
 * 获取触摸点相对于元素的位置
 * @param {Touch} touch - 触摸点
 * @param {HTMLElement} element - 参考元素
 * @returns {Object} 相对位置 {x, y}
 */
function getTouchPosition(touch, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

/**
 * 计算两个触摸点之间的距离
 * @param {Touch} touch1 - 第一个触摸点
 * @param {Touch} touch2 - 第二个触摸点
 * @returns {number} 距离
 */
function getTouchDistance(touch1, touch2) {
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) +
    Math.pow(touch2.clientY - touch1.clientY, 2)
  );
}

/**
 * 计算两个触摸点之间的角度
 * @param {Touch} touch1 - 第一个触摸点
 * @param {Touch} touch2 - 第二个触摸点
 * @returns {number} 角度（弧度）
 */
function getTouchAngle(touch1, touch2) {
  return Math.atan2(
    touch2.clientY - touch1.clientY,
    touch2.clientX - touch1.clientX
  );
}

/**
 * 检测滑动手势
 * @param {Object} startTouch - 开始触摸点 {x, y, time}
 * @param {Object} endTouch - 结束触摸点 {x, y, time}
 * @param {number} minDistance - 最小滑动距离
 * @param {number} maxTime - 最大滑动时间（毫秒）
 * @returns {Object|null} 滑动信息 {direction, distance, angle, speed} 或 null
 */
function detectSwipe(startTouch, endTouch, minDistance = 50, maxTime = 300) {
  const dx = endTouch.x - startTouch.x;
  const dy = endTouch.y - startTouch.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const time = endTouch.time - startTouch.time;
  
  if (distance >= minDistance && time <= maxTime) {
    const angle = Math.atan2(dy, dx);
    const speed = distance / time;
    
    // 确定滑动方向
    let direction;
    const absAngle = Math.abs(angle);
    
    if (absAngle <= Math.PI / 4) {
      direction = 'right';
    } else if (absAngle >= 3 * Math.PI / 4) {
      direction = 'left';
    } else if (angle > 0) {
      direction = 'down';
    } else {
      direction = 'up';
    }
    
    return {
      direction,
      distance,
      angle,
      speed
    };
  }
  
  return null;
}

/**
 * 检测捏合手势
 * @param {Array} startTouches - 开始触摸点数组 [{x, y}, {x, y}]
 * @param {Array} endTouches - 结束触摸点数组 [{x, y}, {x, y}]
 * @returns {Object|null} 捏合信息 {scale, rotation} 或 null
 */
function detectPinch(startTouches, endTouches) {
  if (startTouches.length < 2 || endTouches.length < 2) {
    return null;
  }
  
  const startDistance = Math.sqrt(
    Math.pow(startTouches[1].x - startTouches[0].x, 2) +
    Math.pow(startTouches[1].y - startTouches[0].y, 2)
  );
  
  const endDistance = Math.sqrt(
    Math.pow(endTouches[1].x - endTouches[0].x, 2) +
    Math.pow(endTouches[1].y - endTouches[0].y, 2)
  );
  
  const startAngle = Math.atan2(
    startTouches[1].y - startTouches[0].y,
    startTouches[1].x - startTouches[0].x
  );
  
  const endAngle = Math.atan2(
    endTouches[1].y - endTouches[0].y,
    endTouches[1].x - endTouches[0].x
  );
  
  return {
    scale: endDistance / startDistance,
    rotation: endAngle - startAngle
  };
}

/**
 * 检测设备晃动
 * @param {Object} acceleration - 加速度数据 {x, y, z}
 * @param {number} threshold - 晃动阈值
 * @returns {boolean} 是否检测到晃动
 */
function detectShake(acceleration, threshold = 15) {
  const magnitude = Math.sqrt(
    acceleration.x * acceleration.x +
    acceleration.y * acceleration.y +
    acceleration.z * acceleration.z
  );
  
  return magnitude > threshold;
}
