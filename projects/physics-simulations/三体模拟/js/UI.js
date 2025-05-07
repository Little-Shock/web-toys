/**
 * 用户界面管理器
 * 负责处理用户界面交互和更新
 */
class UI {
  /**
   * 创建UI管理器
   * @param {ThreeBodySystem} system - 三体系统
   * @param {SceneManager} sceneManager - 场景管理器
   */
  constructor(system, sceneManager) {
    this.system = system;
    this.sceneManager = sceneManager;
    
    // UI元素
    this.elements = {
      // 预设选择
      presetSelect: document.getElementById('preset-select'),
      
      // 模拟控制
      playPauseButton: document.getElementById('play-pause'),
      resetButton: document.getElementById('reset'),
      
      // 模拟速度
      speedSlider: document.getElementById('speed-slider'),
      speedValue: document.getElementById('speed-value'),
      
      // 轨迹长度
      trailSlider: document.getElementById('trail-slider'),
      trailValue: document.getElementById('trail-value'),
      
      // 显示选项
      showTrailsCheckbox: document.getElementById('show-trails'),
      showGridCheckbox: document.getElementById('show-grid'),
      showVectorsCheckbox: document.getElementById('show-vectors'),
      
      // 恒星参数
      star1Mass: document.getElementById('star1-mass'),
      star1MassValue: document.getElementById('star1-mass-value'),
      star2Mass: document.getElementById('star2-mass'),
      star2MassValue: document.getElementById('star2-mass-value'),
      star3Mass: document.getElementById('star3-mass'),
      star3MassValue: document.getElementById('star3-mass-value'),
      
      // 面板控制
      togglePanelButton: document.getElementById('toggle-panel'),
      controlPanel: document.querySelector('.control-panel')
    };
    
    // 初始化UI
    this.init();
  }
  
  /**
   * 初始化UI
   */
  init() {
    // 设置初始值
    this.updateUIFromSystem();
    
    // 绑定事件监听器
    this.bindEventListeners();
  }
  
  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 预设选择
    this.elements.presetSelect.addEventListener('change', () => {
      const presetName = this.elements.presetSelect.value;
      this.system.reset(presetName);
      this.sceneManager.reset();
      this.updateUIFromSystem();
    });
    
    // 播放/暂停按钮
    this.elements.playPauseButton.addEventListener('click', () => {
      if (this.system.isRunning()) {
        this.system.pause();
        this.elements.playPauseButton.textContent = '播放';
      } else {
        this.system.start();
        this.elements.playPauseButton.textContent = '暂停';
      }
    });
    
    // 重置按钮
    this.elements.resetButton.addEventListener('click', () => {
      const presetName = this.elements.presetSelect.value;
      this.system.reset(presetName);
      this.sceneManager.reset();
    });
    
    // 模拟速度滑块
    this.elements.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.elements.speedSlider.value);
      this.elements.speedValue.textContent = speed.toFixed(1);
      this.system.setSimulationSpeed(speed);
    });
    
    // 轨迹长度滑块
    this.elements.trailSlider.addEventListener('input', () => {
      const length = parseInt(this.elements.trailSlider.value);
      this.elements.trailValue.textContent = length;
      this.sceneManager.setTrailLength(length);
    });
    
    // 显示轨迹复选框
    this.elements.showTrailsCheckbox.addEventListener('change', () => {
      const show = this.elements.showTrailsCheckbox.checked;
      this.sceneManager.setShowTrails(show);
    });
    
    // 显示网格复选框
    this.elements.showGridCheckbox.addEventListener('change', () => {
      const show = this.elements.showGridCheckbox.checked;
      this.sceneManager.setShowGrid(show);
    });
    
    // 显示速度向量复选框
    this.elements.showVectorsCheckbox.addEventListener('change', () => {
      const show = this.elements.showVectorsCheckbox.checked;
      this.sceneManager.setShowVectors(show);
    });
    
    // 恒星1质量滑块
    this.elements.star1Mass.addEventListener('input', () => {
      const mass = parseFloat(this.elements.star1Mass.value);
      this.elements.star1MassValue.textContent = mass.toFixed(1);
      this.system.setBodyMass(0, mass);
    });
    
    // 恒星2质量滑块
    this.elements.star2Mass.addEventListener('input', () => {
      const mass = parseFloat(this.elements.star2Mass.value);
      this.elements.star2MassValue.textContent = mass.toFixed(1);
      this.system.setBodyMass(1, mass);
    });
    
    // 恒星3质量滑块
    this.elements.star3Mass.addEventListener('input', () => {
      const mass = parseFloat(this.elements.star3Mass.value);
      this.elements.star3MassValue.textContent = mass.toFixed(1);
      this.system.setBodyMass(2, mass);
    });
    
    // 面板切换按钮
    this.elements.togglePanelButton.addEventListener('click', () => {
      this.elements.controlPanel.classList.toggle('panel-collapsed');
    });
    
    // 移动设备检测
    this.checkMobileDevice();
  }
  
  /**
   * 从系统更新UI
   */
  updateUIFromSystem() {
    // 更新恒星质量
    const bodies = this.system.getBodies();
    if (bodies.length >= 3) {
      this.elements.star1Mass.value = bodies[0].mass;
      this.elements.star1MassValue.textContent = bodies[0].mass.toFixed(1);
      
      this.elements.star2Mass.value = bodies[1].mass;
      this.elements.star2MassValue.textContent = bodies[1].mass.toFixed(1);
      
      this.elements.star3Mass.value = bodies[2].mass;
      this.elements.star3MassValue.textContent = bodies[2].mass.toFixed(1);
    }
    
    // 更新播放/暂停按钮
    this.elements.playPauseButton.textContent = this.system.isRunning() ? '暂停' : '播放';
    
    // 更新模拟速度
    this.elements.speedSlider.value = this.system.params.simulationSpeed;
    this.elements.speedValue.textContent = this.system.params.simulationSpeed.toFixed(1);
    
    // 更新轨迹长度
    const trailLength = bodies.length > 0 ? bodies[0].maxTrailLength : 500;
    this.elements.trailSlider.value = trailLength;
    this.elements.trailValue.textContent = trailLength;
  }
  
  /**
   * 检查是否为移动设备
   */
  checkMobileDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 显示移动控制提示
      document.querySelector('.mobile-controls-hint').style.display = 'block';
      
      // 默认折叠控制面板
      this.elements.controlPanel.classList.add('panel-collapsed');
    }
  }
  
  /**
   * 显示碰撞警告
   */
  showCollisionWarning() {
    // 创建警告元素
    const warningElement = document.createElement('div');
    warningElement.className = 'collision-warning';
    warningElement.innerHTML = `
      <div class="warning-content">
        <h3>检测到碰撞！</h3>
        <p>恒星之间发生了碰撞。</p>
        <button id="reset-after-collision">重置模拟</button>
      </div>
    `;
    
    // 添加样式
    warningElement.style.position = 'fixed';
    warningElement.style.top = '50%';
    warningElement.style.left = '50%';
    warningElement.style.transform = 'translate(-50%, -50%)';
    warningElement.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
    warningElement.style.padding = '20px';
    warningElement.style.borderRadius = '10px';
    warningElement.style.zIndex = '1000';
    warningElement.style.textAlign = 'center';
    
    // 添加到文档
    document.body.appendChild(warningElement);
    
    // 绑定重置按钮事件
    document.getElementById('reset-after-collision').addEventListener('click', () => {
      const presetName = this.elements.presetSelect.value;
      this.system.reset(presetName);
      this.sceneManager.reset();
      document.body.removeChild(warningElement);
    });
  }
  
  /**
   * 更新UI
   */
  update() {
    // 检查碰撞
    if (this.system.hasCollision()) {
      this.showCollisionWarning();
    }
  }
}
