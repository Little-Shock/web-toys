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
  const loadingOverlay = document.getElementById('loadingOverlay');
  const controlsPanel = document.getElementById('controlsPanel');
  const toggleControlsBtn = document.getElementById('toggleControlsBtn');
  const closeControlsBtn = document.getElementById('closeControlsBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenModal = document.getElementById('fullscreenModal');
  const fullscreenCanvas = document.getElementById('fullscreenCanvas');
  const closeModal = document.querySelector('.close-modal');
  const qualitySelect = document.getElementById('qualitySelect');

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

  // 预设效果配置
  const presets = {
    cyberpunk: {
      glitchIntensity: 0.7,
      rgbShift: 0.5,
      scanLines: 0.6,
      noiseAmount: 0.3,
      blockGlitch: 0.4,
      waveDistortion: 0.3,
      colorShift: 0.6
    },
    vaporwave: {
      glitchIntensity: 0.4,
      rgbShift: 0.7,
      scanLines: 0.2,
      noiseAmount: 0.1,
      blockGlitch: 0.2,
      waveDistortion: 0.5,
      colorShift: 0.8
    },
    glitch: {
      glitchIntensity: 0.9,
      rgbShift: 0.3,
      scanLines: 0.1,
      noiseAmount: 0.5,
      blockGlitch: 0.8,
      waveDistortion: 0.2,
      colorShift: 0.4
    },
    retro: {
      glitchIntensity: 0.3,
      rgbShift: 0.2,
      scanLines: 0.8,
      noiseAmount: 0.2,
      blockGlitch: 0.1,
      waveDistortion: 0.1,
      colorShift: 0.3
    }
  };

  // 创建流麻效果处理器
  const glitchEffect = new GlitchEffect(glitchCanvas);

  // 应用程序状态
  const appState = {
    isMobile: window.innerWidth <= 767,
    isProcessing: false,
    controlsVisible: !(window.innerWidth <= 767)
  };

  // 显示加载指示器
  function showLoading() {
    appState.isProcessing = true;
    loadingOverlay.classList.add('active');
  }

  // 隐藏加载指示器
  function hideLoading() {
    appState.isProcessing = false;
    loadingOverlay.classList.remove('active');
  }

  // 处理图片上传
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择有效的图片文件');
      return;
    }

    showLoading();
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

        // 在移动端自动显示控制面板，但不立即显示，给用户一些时间查看效果
        if (appState.isMobile) {
          // 延迟1秒后显示控制面板
          setTimeout(() => {
            toggleControlsBtn.style.display = 'flex';
          }, 1000);
        }
      } catch (error) {
        console.error('图像处理错误:', error);
        alert('图像处理失败，请尝试其他图片');
        // 出错时恢复上传界面
        previewContainer.style.display = 'none';
        uploadArea.style.display = 'flex';
      } finally {
        hideLoading();
      }
    };

    reader.onerror = () => {
      console.error('文件读取错误');
      alert('文件读取失败，请重试');
      hideLoading();
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
    showLoading();

    try {
      setTimeout(() => {
        const dataUrl = glitchEffect.saveImage();

        // 创建下载链接
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `cyberpunk-glitch-${Date.now()}.png`;
        document.body.appendChild(link);

        // 尝试触发下载
        try {
          link.click();
        } catch (e) {
          console.error('下载触发失败:', e);
          // 提供备用方案
          alert('自动下载失败，请长按图片并选择"保存图片"');

          // 在新窗口中打开图片，方便用户手动保存
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`<img src="${dataUrl}" alt="赛博故障效果" style="max-width:100%;">`);
            newWindow.document.title = '赛博故障效果 - 长按保存';
          } else {
            alert('无法打开新窗口，请检查浏览器设置');
          }
        }

        document.body.removeChild(link);
        hideLoading();
      }, 100); // 短暂延迟以确保加载指示器显示
    } catch (error) {
      console.error('保存图像失败:', error);
      alert('保存图像失败，请重试');
      hideLoading();
    }
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

    // 隐藏控制面板（移动端）
    if (appState.isMobile && controlsPanel.classList.contains('active')) {
      toggleControlsPanel();
    }
  }

  // 切换控制面板显示（移动端）
  function toggleControlsPanel() {
    controlsPanel.classList.toggle('active');
    appState.controlsVisible = controlsPanel.classList.contains('active');

    // 防止控制面板切换时页面滚动
    if (appState.controlsVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // 全屏预览
  function openFullscreenPreview() {
    if (!glitchEffect.originalImageData) return;

    // 复制当前画布内容到全屏画布
    const ctx = fullscreenCanvas.getContext('2d');
    fullscreenCanvas.width = glitchCanvas.width;
    fullscreenCanvas.height = glitchCanvas.height;
    ctx.drawImage(glitchCanvas, 0, 0);

    // 显示模态框
    fullscreenModal.style.display = 'block';
  }

  // 关闭全屏预览
  function closeFullscreenPreview() {
    fullscreenModal.style.display = 'none';
  }

  // 处理窗口大小变化
  function handleResize() {
    const wasMobile = appState.isMobile;
    appState.isMobile = window.innerWidth <= 767;

    // 如果设备类型发生变化，更新界面
    if (wasMobile !== appState.isMobile) {
      if (appState.isMobile) {
        // 移动端默认隐藏控制面板
        controlsPanel.classList.remove('active');
        // 显示控制面板切换按钮
        toggleControlsBtn.style.display = 'flex';
      } else {
        // 桌面端默认显示控制面板
        controlsPanel.classList.add('active');
        // 隐藏控制面板切换按钮
        toggleControlsBtn.style.display = 'none';
      }
      // 更新控制面板可见状态
      appState.controlsVisible = controlsPanel.classList.contains('active');
    }
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
  toggleControlsBtn.addEventListener('click', toggleControlsPanel);
  closeControlsBtn.addEventListener('click', toggleControlsPanel);
  fullscreenBtn.addEventListener('click', openFullscreenPreview);
  closeModal.addEventListener('click', closeFullscreenPreview);

  // 应用预设效果
  function applyPreset(presetName) {
    if (!presets[presetName]) return;

    const presetParams = presets[presetName];

    // 更新滑块位置
    Object.keys(presetParams).forEach(key => {
      if (sliders[key]) {
        sliders[key].value = Math.round(presetParams[key] * 100);

        // 更新显示的值
        const display = sliders[key].nextElementSibling;
        if (display) {
          display.textContent = `${sliders[key].value}%`;
        }
      }
    });

    // 更新效果
    glitchEffect.updateParams(presetParams);

    // 高亮当前选中的预设
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.preset === presetName) {
        btn.classList.add('active');
      }
    });
  }

  // 预设按钮事件监听
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.dataset.preset;
      applyPreset(presetName);
    });
  });

  // 质量选择事件监听
  qualitySelect.addEventListener('change', () => {
    const quality = qualitySelect.value;
    glitchEffect.setQuality(quality);
    updateEffectFromSliders();
  });

  // 移动端触摸优化
  document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('slider')) {
      e.preventDefault(); // 防止滑动滑块时页面滚动
    }
  }, { passive: false });

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);

  // 初始化
  handleResize();

  // 初始化移动端控制面板切换按钮显示状态
  if (appState.isMobile) {
    toggleControlsBtn.style.display = 'flex';
  } else {
    toggleControlsBtn.style.display = 'none';
    controlsPanel.classList.add('active');
  }
});
