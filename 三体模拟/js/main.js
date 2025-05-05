/**
 * 三体模拟 - 主程序
 * 基于经典三体问题的宇宙物理模拟
 */
document.addEventListener('DOMContentLoaded', () => {
  // 显示加载指示器
  showLoading();

  // 初始化应用
  initApp();
});

/**
 * 显示加载指示器
 */
function showLoading() {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">正在初始化三体模拟...</div>
  `;
  document.body.appendChild(loadingIndicator);
}

/**
 * 隐藏加载指示器
 */
function hideLoading() {
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(loadingIndicator);
    }, 500);
  }
}

/**
 * 初始化应用
 */
function initApp() {
  try {
    console.log('开始初始化应用...');
    console.log('THREE对象状态:', THREE);

    // 检查THREE.OrbitControls是否存在
    if (!THREE.OrbitControls) {
      console.error('THREE.OrbitControls未定义!');

      // 创建一个简单的OrbitControls替代品
      THREE.OrbitControls = function(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        this.target = new THREE.Vector3();
        this.enableDamping = false;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
        this.update = function() { return true; };
        this.dispose = function() {};
      };

      console.log('已创建OrbitControls替代品');
    }

    // 创建三体系统
    console.log('创建三体系统...');
    const system = new ThreeBodySystem({
      timeStep: 0.01,
      simulationSpeed: 1.0,
      integrationMethod: 'rk4'
    });
    console.log('三体系统创建成功:', system);

    // 创建场景管理器
    console.log('创建场景管理器...');
    const sceneManager = new SceneManager('canvas-container', system);
    console.log('场景管理器创建成功:', sceneManager);

    // 创建UI管理器
    console.log('创建UI管理器...');
    const ui = new UI(system, sceneManager);
    console.log('UI管理器创建成功:', ui);

    // 开始模拟
    console.log('启动模拟...');
    system.start();

    // 隐藏加载指示器
    hideLoading();

    // 创建更新循环
    function update() {
      // 更新UI
      ui.update();

      // 继续更新循环
      requestAnimationFrame(update);
    }

    // 开始更新循环
    console.log('开始更新循环...');
    update();

    // 添加页面卸载事件处理
    window.addEventListener('beforeunload', () => {
      sceneManager.stop();
    });

    console.log('应用初始化完成!');

  } catch (error) {
    console.error('初始化应用时出错:', error);
    alert('初始化应用时出错: ' + error.message + '\n\n请查看控制台获取更多信息。');
    hideLoading();
  }
}
