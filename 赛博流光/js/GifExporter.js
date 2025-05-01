/**
 * GIF导出工具
 * 使用gif.js库实现GIF动画导出
 */
class GifExporter {
  constructor(options = {}) {
    this.options = Object.assign({
      quality: 10,         // 质量 (1-30)，越低质量越高
      width: 500,          // GIF宽度
      height: 500,         // GIF高度
      fps: 15,             // 帧率
      duration: 3,         // 持续时间（秒）
      transparent: 0x00FF00, // 透明色
      background: null,    // 背景色
      dither: false        // 抖动
    }, options);
    
    this.gif = null;
    this.isRecording = false;
    this.frameCount = 0;
    this.totalFrames = this.options.fps * this.options.duration;
    this.onProgress = null;
    this.onFinished = null;
    
    // 加载gif.js库
    this.loadGifJsLibrary();
  }
  
  /**
   * 加载gif.js库
   */
  loadGifJsLibrary() {
    if (window.GIF) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif.js library'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * 开始录制
   */
  async startRecording() {
    try {
      // 确保gif.js库已加载
      await this.loadGifJsLibrary();
      
      // 创建GIF实例
      this.gif = new GIF({
        workers: 2,
        quality: this.options.quality,
        width: this.options.width,
        height: this.options.height,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
        transparent: this.options.transparent,
        background: this.options.background,
        dither: this.options.dither
      });
      
      // 设置事件监听
      this.gif.on('progress', (progress) => {
        if (this.onProgress) {
          this.onProgress(progress);
        }
      });
      
      this.gif.on('finished', (blob) => {
        if (this.onFinished) {
          this.onFinished(blob);
        }
      });
      
      this.isRecording = true;
      this.frameCount = 0;
      
      return true;
    } catch (error) {
      console.error('GIF录制初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 添加帧
   * @param {HTMLCanvasElement|HTMLImageElement} frame - 要添加的帧
   * @param {number} delay - 帧延迟（毫秒）
   */
  addFrame(frame, delay = 1000 / this.options.fps) {
    if (!this.isRecording || !this.gif) return false;
    
    this.gif.addFrame(frame, { delay: delay, copy: true });
    this.frameCount++;
    
    // 检查是否达到总帧数
    if (this.frameCount >= this.totalFrames) {
      this.stopRecording();
    }
    
    return true;
  }
  
  /**
   * 停止录制并渲染GIF
   */
  stopRecording() {
    if (!this.isRecording || !this.gif) return false;
    
    this.isRecording = false;
    this.gif.render();
    
    return true;
  }
  
  /**
   * 取消录制
   */
  cancelRecording() {
    if (!this.gif) return false;
    
    this.isRecording = false;
    this.gif.abort();
    
    return true;
  }
  
  /**
   * 设置进度回调
   * @param {Function} callback - 进度回调函数
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }
  
  /**
   * 设置完成回调
   * @param {Function} callback - 完成回调函数
   */
  setFinishedCallback(callback) {
    this.onFinished = callback;
  }
  
  /**
   * 下载GIF
   * @param {Blob} blob - GIF数据
   * @param {string} filename - 文件名
   */
  static downloadGif(blob, filename = 'animation.gif') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
