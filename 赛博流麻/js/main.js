/**
 * 赛博流麻 - 主控制脚本
 * 处理用户交互和UI更新
 */
document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const uploadArea = document.getElementById('uploadArea');
  const imageUpload = document.getElementById('imageUpload');
  const previewContainer = document.getElementById('previewContainer');
  const glitchCanvas = document.getElementById('glitchCanvas');
  const randomizeBtn = document.getElementById('randomizeBtn');
  const saveImageBtn = document.getElementById('saveImageBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  // 获取所有滑块控制器
  const sliders = {
    glitchIntensity: document.getElementById('glitchIntensity'),
    rgbShift: document.getElementById('rgbShift'),
    scanLines: document.getElementById('scanLines'),
    noiseAmount: document.getElementById('noiseAmount'),
    blockGlitch: document.getElementById('blockGlitch'),
    waveDistortion: document.getElementById('waveDistortion'),
    colorShift: document.getElementById('colorShift')
  };
  
  // 创建流麻效果处理器
  const glitchEffect = new GlitchEffect(glitchCanvas);
  
  // 处理图片上传
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择有效的图片文件');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // 显示预览区域
        previewContainer.style.display = 'flex';
        uploadArea.style.display = 'none';
        
        // 加载图像并应用初始效果
        await glitchEffect.loadImage(e.target.result);
        updateEffectFromSliders();
        
        // 开始动画效果
        glitchEffect.startAnimation();
      } catch (error) {
        console.error('图像处理错误:', error);
        alert('图像处理失败，请尝试其他图片');
      }
    };
    
    reader.readAsDataURL(file);
  }
  
  // 从滑块更新效果参数
  function updateEffectFromSliders() {
    const params = {};
    
    // 从所有滑块获取值并转换为0-1范围
    Object.keys(sliders).forEach(key => {
      params[key] = sliders[key].value / 100;
      
      // 更新显示的值
      const display = sliders[key].nextElementSibling;
      if (display) {
        display.textContent = `${sliders[key].value}%`;
      }
    });
    
    // 更新效果
    glitchEffect.updateParams(params);
  }
  
  // 随机化参数
  function randomizeParams() {
    const params = glitchEffect.randomizeParams();
    
    // 更新滑块位置
    Object.keys(params).forEach(key => {
      if (sliders[key]) {
        sliders[key].value = Math.round(params[key] * 100);
        
        // 更新显示的值
        const display = sliders[key].nextElementSibling;
        if (display) {
          display.textContent = `${sliders[key].value}%`;
        }
      }
    });
    
    // 应用效果
    glitchEffect.render();
  }
  
  // 保存图像
  function saveImage() {
    const dataUrl = glitchEffect.saveImage();
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `cyberpunk-glitch-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 重置图像
  function resetImage() {
    // 隐藏预览区域，显示上传区域
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'flex';
    
    // 停止动画
    glitchEffect.stopAnimation();
    
    // 清空文件输入
    imageUpload.value = '';
  }
  
  // 事件监听器
  uploadArea.addEventListener('click', () => {
    imageUpload.click();
  });
  
  imageUpload.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0]);
  });
  
  // 拖放支持
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });
  
  // 滑块事件监听
  Object.values(sliders).forEach(slider => {
    slider.addEventListener('input', updateEffectFromSliders);
  });
  
  // 按钮事件监听
  randomizeBtn.addEventListener('click', randomizeParams);
  saveImageBtn.addEventListener('click', saveImage);
  resetBtn.addEventListener('click', resetImage);
  
  // 移动端触摸优化
  document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('slider')) {
      e.preventDefault(); // 防止滑动滑块时页面滚动
    }
  }, { passive: false });
});
