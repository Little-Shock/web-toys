/**
 * 连击系统
 * 负责处理连击计数和效果
 */
class ComboSystem {
  constructor() {
    // 连击状态
    this.combo = 0;
    this.maxCombo = 0;
    this.lastTapTime = 0;
    this.comboTimeout = null;
    
    // 连击参数
    this.params = {
      comboTimeWindow: 2000, // 连击时间窗口 (毫秒)
      comboDecayTime: 500,   // 连击衰减时间 (毫秒)
      minTapInterval: 50,    // 最小敲击间隔 (毫秒)
      enabled: true          // 是否启用连击系统
    };
    
    // 检测设备类型
    const { isMobile, isLowEndDevice } = detectDevice();
    this.isMobile = isMobile;
    this.isLowEndDevice = isLowEndDevice;
    
    // 为移动设备调整参数
    if (this.isMobile) {
      this.params.comboTimeWindow = 2500; // 移动设备给更宽松的时间窗口
      this.params.minTapInterval = 100;   // 移动设备增加最小间隔
    }
    
    // 为低端设备进一步调整
    if (this.isLowEndDevice) {
      this.params.comboTimeWindow = 3000;
      this.params.minTapInterval = 150;
    }
    
    // 连击里程碑
    this.comboMilestones = [10, 30, 50, 100, 200, 300, 500];
    this.reachedMilestones = new Set();
    
    // 回调函数
    this.onComboChange = null;
    this.onComboEnd = null;
    this.onComboMilestone = null;
  }
  
  /**
   * 记录敲击
   * @param {number} intensity - 敲击强度 (0-1)
   * @returns {Object} 敲击结果
   */
  recordTap(intensity = 1) {
    if (!this.params.enabled) return { combo: 0, isNewTap: false };
    
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    
    // 检查是否在最小敲击间隔内
    if (timeSinceLastTap < this.params.minTapInterval) {
      return { combo: this.combo, isNewTap: false };
    }
    
    // 清除之前的超时
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
    
    // 检查是否在连击时间窗口内
    const isCombo = timeSinceLastTap <= this.params.comboTimeWindow;
    
    // 更新连击计数
    if (isCombo) {
      this.combo++;
    } else {
      this.combo = 1;
      this.reachedMilestones.clear();
    }
    
    // 更新最大连击
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // 更新最后敲击时间
    this.lastTapTime = now;
    
    // 设置连击超时
    this.comboTimeout = setTimeout(() => {
      // 连击结束
      if (this.onComboEnd && this.combo > 1) {
        this.onComboEnd(this.combo);
      }
      
      this.combo = 0;
      this.reachedMilestones.clear();
      
      // 通知连击变化
      if (this.onComboChange) {
        this.onComboChange(this.combo);
      }
    }, this.params.comboTimeWindow + this.params.comboDecayTime);
    
    // 检查是否达到里程碑
    const milestone = this.checkMilestone();
    
    // 通知连击变化
    if (this.onComboChange) {
      this.onComboChange(this.combo);
    }
    
    return {
      combo: this.combo,
      isNewTap: true,
      isCombo: isCombo && this.combo > 1,
      milestone
    };
  }
  
  /**
   * 检查是否达到里程碑
   * @returns {number|null} 达到的里程碑或null
   */
  checkMilestone() {
    for (const milestone of this.comboMilestones) {
      if (this.combo >= milestone && !this.reachedMilestones.has(milestone)) {
        this.reachedMilestones.add(milestone);
        
        // 通知里程碑达成
        if (this.onComboMilestone) {
          this.onComboMilestone(milestone);
        }
        
        return milestone;
      }
    }
    
    return null;
  }
  
  /**
   * 获取当前连击等级
   * @returns {Object} 连击等级信息
   */
  getComboRank() {
    return getDMCRanking(this.combo);
  }
  
  /**
   * 获取连击文本
   * @returns {string|null} 连击文本或null
   */
  getComboText() {
    return getComboText(this.combo);
  }
  
  /**
   * 重置连击
   */
  resetCombo() {
    // 清除超时
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
    
    // 重置状态
    this.combo = 0;
    this.reachedMilestones.clear();
    
    // 通知连击变化
    if (this.onComboChange) {
      this.onComboChange(this.combo);
    }
  }
  
  /**
   * 设置连击系统启用状态
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.params.enabled = enabled;
    
    if (!enabled) {
      this.resetCombo();
    }
  }
  
  /**
   * 设置连击变化回调
   * @param {Function} callback - 回调函数
   */
  setOnComboChange(callback) {
    this.onComboChange = callback;
  }
  
  /**
   * 设置连击结束回调
   * @param {Function} callback - 回调函数
   */
  setOnComboEnd(callback) {
    this.onComboEnd = callback;
  }
  
  /**
   * 设置里程碑达成回调
   * @param {Function} callback - 回调函数
   */
  setOnComboMilestone(callback) {
    this.onComboMilestone = callback;
  }
}
