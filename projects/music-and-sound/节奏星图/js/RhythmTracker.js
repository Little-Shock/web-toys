/**
 * 节奏跟踪器
 * 负责记录和分析用户创建的节奏模式
 */
class RhythmTracker {
  /**
   * 创建节奏跟踪器
   * @param {AudioManager} audioManager - 音频管理器
   * @param {Object} options - 配置选项
   */
  constructor(audioManager, options = {}) {
    this.audioManager = audioManager;
    
    // 配置参数
    this.params = {
      bpm: options.bpm || 120,
      quantize: options.quantize !== undefined ? options.quantize : true,
      quantizeDivision: options.quantizeDivision || 16, // 16分音符
      loopEnabled: options.loopEnabled !== undefined ? options.loopEnabled : true,
      autoConnect: options.autoConnect !== undefined ? options.autoConnect : true
    };
    
    // 节奏状态
    this.isRecording = false;
    this.isPlaying = false;
    this.startTime = 0;
    
    // 节奏事件
    this.rhythmEvents = [];
    
    // 节拍计数器
    this.beatCounter = 0;
    this.beatInterval = null;
    
    // 连接状态
    this.connections = [];
    
    // 回调函数
    this.onBeat = options.onBeat || null;
    this.onNoteAdded = options.onNoteAdded || null;
    this.onConnectionCreated = options.onConnectionCreated || null;
  }
  
  /**
   * 设置BPM
   * @param {number} bpm - 每分钟节拍数
   */
  setBPM(bpm) {
    this.params.bpm = clamp(bpm, 60, 180);
    this.audioManager.setBPM(bpm);
    
    // 如果正在播放节拍，重新启动
    if (this.beatInterval) {
      this.stopBeatCounter();
      this.startBeatCounter();
    }
  }
  
  /**
   * 设置量化
   * @param {boolean} enabled - 是否启用量化
   * @param {number} division - 量化细分（4=四分音符，8=八分音符，16=十六分音符）
   */
  setQuantize(enabled, division = 16) {
    this.params.quantize = enabled;
    this.params.quantizeDivision = division;
  }
  
  /**
   * 设置循环
   * @param {boolean} enabled - 是否启用循环
   */
  setLoopEnabled(enabled) {
    this.params.loopEnabled = enabled;
  }
  
  /**
   * 设置自动连接
   * @param {boolean} enabled - 是否启用自动连接
   */
  setAutoConnect(enabled) {
    this.params.autoConnect = enabled;
  }
  
  /**
   * 开始记录节奏
   */
  startRecording() {
    this.isRecording = true;
    this.startTime = Date.now();
    this.startBeatCounter();
  }
  
  /**
   * 停止记录节奏
   */
  stopRecording() {
    this.isRecording = false;
    this.stopBeatCounter();
  }
  
  /**
   * 开始播放节奏
   */
  startPlaying() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.startTime = Date.now();
    this.startBeatCounter();
    
    // 开始播放所有节奏层
    this.audioManager.playAllRhythmLayers();
  }
  
  /**
   * 停止播放节奏
   */
  stopPlaying() {
    this.isPlaying = false;
    this.stopBeatCounter();
    
    // 停止所有声音
    this.audioManager.stopAllSounds();
  }
  
  /**
   * 开始节拍计数器
   */
  startBeatCounter() {
    this.stopBeatCounter();
    
    this.beatCounter = 0;
    const beatTime = 60000 / this.params.bpm; // 一拍的毫秒数
    
    this.beatInterval = setInterval(() => {
      this.beatCounter++;
      
      if (this.onBeat) {
        this.onBeat(this.beatCounter);
      }
    }, beatTime);
  }
  
  /**
   * 停止节拍计数器
   */
  stopBeatCounter() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }
  
  /**
   * 添加节奏事件
   * @param {Object} event - 节奏事件
   * @returns {Object} 添加的事件
   */
  addRhythmEvent(event) {
    if (!this.isRecording) return null;
    
    // 计算相对时间
    const time = Date.now();
    const relativeTime = time - this.startTime;
    
    // 量化时间
    let quantizedTime = relativeTime;
    if (this.params.quantize) {
      quantizedTime = this.quantizeTime(relativeTime);
    }
    
    // 创建事件对象
    const rhythmEvent = {
      ...event,
      id: generateId(),
      time: time,
      relativeTime: relativeTime,
      quantizedTime: quantizedTime,
      beat: this.calculateBeat(quantizedTime)
    };
    
    // 添加到事件列表
    this.rhythmEvents.push(rhythmEvent);
    
    // 如果启用了自动连接，尝试创建连接
    if (this.params.autoConnect) {
      this.createConnectionsForEvent(rhythmEvent);
    }
    
    // 触发回调
    if (this.onNoteAdded) {
      this.onNoteAdded(rhythmEvent);
    }
    
    return rhythmEvent;
  }
  
  /**
   * 量化时间
   * @param {number} time - 时间（毫秒）
   * @returns {number} 量化后的时间（毫秒）
   */
  quantizeTime(time) {
    return quantizeTime(time, this.params.bpm, this.params.quantizeDivision);
  }
  
  /**
   * 计算节拍位置
   * @param {number} time - 时间（毫秒）
   * @returns {number} 节拍位置
   */
  calculateBeat(time) {
    return msToBeats(time, this.params.bpm);
  }
  
  /**
   * 为事件创建连接
   * @param {Object} event - 节奏事件
   */
  createConnectionsForEvent(event) {
    // 获取当前活跃层
    const layer = this.audioManager.getActiveLayer();
    
    // 查找同一层中的其他事件
    const layerEvents = this.rhythmEvents.filter(e => 
      e.layerId === event.layerId && e.id !== event.id
    );
    
    if (layerEvents.length === 0) return;
    
    // 查找最近的事件
    let nearestEvent = null;
    let minDistance = Infinity;
    
    for (const otherEvent of layerEvents) {
      const distance = Math.sqrt(
        Math.pow(event.x - otherEvent.x, 2) +
        Math.pow(event.y - otherEvent.y, 2)
      );
      
      if (distance < minDistance && distance < 0.3) { // 最大连接距离为0.3
        minDistance = distance;
        nearestEvent = otherEvent;
      }
    }
    
    if (nearestEvent) {
      // 创建连接
      const connection = {
        id: generateId(),
        layerId: event.layerId,
        sourceId: event.id,
        targetId: nearestEvent.id,
        sourceX: event.x,
        sourceY: event.y,
        targetX: nearestEvent.x,
        targetY: nearestEvent.y,
        distance: minDistance,
        time: Date.now()
      };
      
      this.connections.push(connection);
      
      // 触发回调
      if (this.onConnectionCreated) {
        this.onConnectionCreated(connection);
      }
    }
  }
  
  /**
   * 手动创建连接
   * @param {string} sourceId - 源事件ID
   * @param {string} targetId - 目标事件ID
   * @returns {Object} 创建的连接
   */
  createConnection(sourceId, targetId) {
    // 查找事件
    const sourceEvent = this.rhythmEvents.find(e => e.id === sourceId);
    const targetEvent = this.rhythmEvents.find(e => e.id === targetId);
    
    if (!sourceEvent || !targetEvent) return null;
    
    // 计算距离
    const distance = Math.sqrt(
      Math.pow(sourceEvent.x - targetEvent.x, 2) +
      Math.pow(sourceEvent.y - targetEvent.y, 2)
    );
    
    // 创建连接
    const connection = {
      id: generateId(),
      layerId: sourceEvent.layerId,
      sourceId: sourceEvent.id,
      targetId: targetEvent.id,
      sourceX: sourceEvent.x,
      sourceY: sourceEvent.y,
      targetX: targetEvent.x,
      targetY: targetEvent.y,
      distance: distance,
      time: Date.now()
    };
    
    this.connections.push(connection);
    
    // 触发回调
    if (this.onConnectionCreated) {
      this.onConnectionCreated(connection);
    }
    
    return connection;
  }
  
  /**
   * 删除连接
   * @param {string} connectionId - 连接ID
   * @returns {boolean} 是否成功删除
   */
  removeConnection(connectionId) {
    const index = this.connections.findIndex(c => c.id === connectionId);
    
    if (index !== -1) {
      this.connections.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * 清除所有连接
   */
  clearConnections() {
    this.connections = [];
  }
  
  /**
   * 清除所有节奏事件
   */
  clearEvents() {
    this.rhythmEvents = [];
    this.clearConnections();
  }
  
  /**
   * 获取层的事件
   * @param {number} layerId - 层ID
   * @returns {Array} 事件数组
   */
  getLayerEvents(layerId) {
    return this.rhythmEvents.filter(e => e.layerId === layerId);
  }
  
  /**
   * 获取层的连接
   * @param {number} layerId - 层ID
   * @returns {Array} 连接数组
   */
  getLayerConnections(layerId) {
    return this.connections.filter(c => c.layerId === layerId);
  }
  
  /**
   * 分析节奏模式
   * @param {number} layerId - 层ID
   * @returns {Object} 节奏分析结果
   */
  analyzeRhythm(layerId) {
    const events = this.getLayerEvents(layerId);
    
    if (events.length < 2) {
      return {
        patternLength: 0,
        density: 0,
        regularity: 0,
        complexity: 0
      };
    }
    
    // 按时间排序
    events.sort((a, b) => a.quantizedTime - b.quantizedTime);
    
    // 计算时间间隔
    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].quantizedTime - events[i - 1].quantizedTime);
    }
    
    // 计算模式长度（最后一个事件的时间）
    const patternLength = events[events.length - 1].quantizedTime;
    
    // 计算密度（每秒事件数）
    const density = events.length / (patternLength / 1000);
    
    // 计算规律性（时间间隔的标准差，越小越规律）
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const regularity = 1 - Math.min(stdDev / avgInterval, 1); // 0-1，越大越规律
    
    // 计算复杂度（基于连接数量和事件分布）
    const connections = this.getLayerConnections(layerId);
    const connectionFactor = Math.min(connections.length / events.length, 1);
    
    // 空间分布（事件在x-y空间的分布）
    const positions = events.map(e => ({ x: e.x, y: e.y }));
    const spatialComplexity = this.calculateSpatialComplexity(positions);
    
    const complexity = (connectionFactor + spatialComplexity) / 2;
    
    return {
      patternLength,
      density,
      regularity,
      complexity
    };
  }
  
  /**
   * 计算空间复杂度
   * @param {Array} positions - 位置数组 [{x, y}, ...]
   * @returns {number} 空间复杂度 (0-1)
   */
  calculateSpatialComplexity(positions) {
    if (positions.length < 2) return 0;
    
    // 计算位置的平均值
    const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    
    // 计算位置的标准差
    const varX = positions.reduce((sum, pos) => sum + Math.pow(pos.x - avgX, 2), 0) / positions.length;
    const varY = positions.reduce((sum, pos) => sum + Math.pow(pos.y - avgY, 2), 0) / positions.length;
    
    const stdDevX = Math.sqrt(varX);
    const stdDevY = Math.sqrt(varY);
    
    // 计算空间复杂度（标准差越大，分布越分散，复杂度越高）
    return Math.min((stdDevX + stdDevY) / 2 * 5, 1); // 0-1，越大越复杂
  }
  
  /**
   * 导出节奏数据
   * @returns {Object} 节奏数据
   */
  exportRhythmData() {
    return {
      events: this.rhythmEvents,
      connections: this.connections,
      params: this.params
    };
  }
  
  /**
   * 导入节奏数据
   * @param {Object} data - 节奏数据
   */
  importRhythmData(data) {
    if (!data) return;
    
    if (data.events) {
      this.rhythmEvents = data.events;
    }
    
    if (data.connections) {
      this.connections = data.connections;
    }
    
    if (data.params) {
      this.params = { ...this.params, ...data.params };
      this.setBPM(this.params.bpm);
    }
  }
}
