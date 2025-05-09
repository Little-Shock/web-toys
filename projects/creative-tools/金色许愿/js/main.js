/**
 * 金色许愿 - 主控制脚本
 * 版本: 1.0.0
 * 
 * 这个脚本控制金色许愿项目的主要功能，包括：
 * - 图片上传与处理
 * - 动画效果控制
 * - 粒子系统
 * - 响应式设计适配
 */

// 应用状态
const appState = {
    // 是否为移动设备
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    // 上传的图片源
    uploadedCardSrc: null,
    
    // 设置
    settings: {
        particleCount: 30,      // 粒子数量
        starCount: 100,         // 星星数量
        animationSpeed: 1.0,    // 动画速度倍率
        effectQuality: 'high'   // 效果质量: 'low', 'medium', 'high'
    }
};

// DOM元素引用
const elements = {
    cardUploader: document.getElementById('cardUploader'),
    wishButton: document.getElementById('wishButton'),
    mainContainer: document.getElementById('mainContainer'),
    animationOverlay: document.getElementById('animationOverlay'),
    starrySky: document.getElementById('starrySky'),
    summoningPortal: document.getElementById('summoningPortal'),
    shootingStar: document.getElementById('shootingStar'),
    energyBurst: document.getElementById('energyBurst'),
    particleContainer: document.getElementById('particleContainer'),
    cardRevealArea: document.getElementById('cardRevealArea'),
    revealedCardDisplay: document.getElementById('revealedCardDisplay'),
    actionButtons: document.getElementById('actionButtons'),
    retryButton: document.getElementById('retryButton'),
    closeAnimationLink: document.getElementById('closeAnimationLink'),
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    particleCountInput: document.getElementById('particleCount'),
    effectQualitySelect: document.getElementById('effectQuality')
};

/**
 * 初始化应用
 */
function init() {
    // 创建星空背景
    createStars(appState.settings.starCount);
    
    // 初始化事件监听器
    initEventListeners();
    
    // 加载设置
    loadSettings();
    
    // 如果是移动设备，自动降低效果质量
    if (appState.isMobile && appState.settings.effectQuality === 'high') {
        appState.settings.effectQuality = 'medium';
        appState.settings.particleCount = Math.min(appState.settings.particleCount, 20);
        updateSettingsUI();
    }
    
    console.log('金色许愿应用初始化完成');
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 文件上传事件
    elements.cardUploader.addEventListener('change', handleFileUpload);
    
    // 祈愿按钮点击事件
    elements.wishButton.addEventListener('click', startWishAnimation);
    
    // 重试按钮点击事件
    elements.retryButton.addEventListener('click', resetAndCloseAnimation);
    
    // 关闭按钮点击事件
    elements.closeAnimationLink.addEventListener('click', function(e) {
        e.preventDefault();
        resetAndCloseAnimation();
    });
    
    // 设置按钮点击事件
    if (elements.settingsToggle) {
        elements.settingsToggle.addEventListener('click', toggleSettings);
    }
    
    // 设置变更事件
    if (elements.particleCountInput) {
        elements.particleCountInput.addEventListener('change', updateSettings);
    }
    
    if (elements.effectQualitySelect) {
        elements.effectQualitySelect.addEventListener('change', updateSettings);
    }
    
    // 窗口大小变化事件
    window.addEventListener('resize', handleResize);
}

/**
 * 处理文件上传
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            appState.uploadedCardSrc = e.target.result;
            elements.wishButton.disabled = false;
            elements.wishButton.textContent = '开始祈愿！';
        };
        reader.onerror = function() {
            console.error('文件读取错误');
            showError('读取图片时出错，请重试');
        };
        reader.readAsDataURL(file);
    } else {
        appState.uploadedCardSrc = null;
        elements.wishButton.disabled = true;
        elements.wishButton.textContent = '请上传有效图片';
    }
}

/**
 * 开始祈愿动画
 */
function startWishAnimation() {
    if (!appState.uploadedCardSrc) {
        showError('请先上传一张图片作为您的卡片！');
        return;
    }

    elements.mainContainer.classList.add('hidden');
    elements.animationOverlay.classList.add('active');
    
    elements.revealedCardDisplay.src = appState.uploadedCardSrc;

    // 重置动画
    resetAnimations();
    
    // 创建粒子
    createParticles(appState.settings.particleCount);
}

/**
 * 重置动画
 */
function resetAnimations() {
    // 重置所有动画元素
    [
        elements.summoningPortal, 
        elements.shootingStar, 
        elements.energyBurst, 
        elements.cardRevealArea, 
        elements.actionButtons
    ].forEach(el => {
        if (el) {
            el.style.animation = 'none';
            // 强制重排，确保动画重置
            void el.offsetHeight;
            el.style.animation = '';
        }
    });
    
    // 显示卡片区域和按钮
    if (elements.cardRevealArea) {
        elements.cardRevealArea.style.display = 'flex';
    }
    
    if (elements.actionButtons) {
        elements.actionButtons.style.display = 'flex';
    }
}

/**
 * 重置并关闭动画
 */
function resetAndCloseAnimation() {
    if (elements.animationOverlay) {
        elements.animationOverlay.classList.remove('active');
    }
    
    if (elements.mainContainer) {
        elements.mainContainer.classList.remove('hidden');
    }
    
    // 隐藏应该初始不可见的元素
    if (elements.cardRevealArea) {
        elements.cardRevealArea.style.display = 'none';
    }
    
    if (elements.actionButtons) {
        elements.actionButtons.style.display = 'none';
    }
}

/**
 * 创建星空背景
 */
function createStars(count) {
    // 清空现有星星
    if (elements.starrySky) {
        elements.starrySky.innerHTML = '';
        
        // 根据设备性能和设置调整星星数量
        const actualCount = appState.isMobile && appState.settings.effectQuality === 'low' 
            ? Math.floor(count * 0.5) 
            : count;
        
        // 创建星星
        for (let i = 0; i < actualCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            // 随机大小
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // 随机位置
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // 随机动画延迟和持续时间
            star.style.animationDelay = `${Math.random() * 2}s`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            
            elements.starrySky.appendChild(star);
        }
    }
}

/**
 * 创建粒子效果
 */
function createParticles(count) {
    if (elements.particleContainer) {
        // 清空现有粒子
        elements.particleContainer.innerHTML = '';
        
        // 根据设备性能和设置调整粒子数量
        const actualCount = appState.isMobile && appState.settings.effectQuality === 'low' 
            ? Math.floor(count * 0.5) 
            : count;
        
        // 创建粒子
        for (let i = 0; i < actualCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // 随机大小
            const size = Math.random() * 5 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // 随机位置
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // 随机动画延迟和持续时间
            particle.style.animationDelay = `${Math.random() * 5 + 3.5}s`;
            particle.style.animationDuration = `${Math.random() * 5 + 5}s`;
            
            elements.particleContainer.appendChild(particle);
        }
    }
}

/**
 * 显示错误消息
 */
function showError(message) {
    alert(message);
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
    // 可以在这里添加响应式调整逻辑
}

/**
 * 切换设置面板
 */
function toggleSettings() {
    if (elements.settingsPanel) {
        elements.settingsPanel.classList.toggle('active');
    }
}

/**
 * 更新设置
 */
function updateSettings() {
    if (elements.particleCountInput) {
        appState.settings.particleCount = parseInt(elements.particleCountInput.value);
    }
    
    if (elements.effectQualitySelect) {
        appState.settings.effectQuality = elements.effectQualitySelect.value;
    }
    
    // 保存设置
    saveSettings();
}

/**
 * 更新设置UI
 */
function updateSettingsUI() {
    if (elements.particleCountInput) {
        elements.particleCountInput.value = appState.settings.particleCount;
    }
    
    if (elements.effectQualitySelect) {
        elements.effectQualitySelect.value = appState.settings.effectQuality;
    }
}

/**
 * 保存设置到本地存储
 */
function saveSettings() {
    try {
        localStorage.setItem('goldenWishSettings', JSON.stringify(appState.settings));
    } catch (e) {
        console.error('保存设置失败:', e);
    }
}

/**
 * 从本地存储加载设置
 */
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('goldenWishSettings');
        if (savedSettings) {
            appState.settings = { ...appState.settings, ...JSON.parse(savedSettings) };
            updateSettingsUI();
        }
    } catch (e) {
        console.error('加载设置失败:', e);
    }
}

// 当文档加载完成时初始化应用
document.addEventListener('DOMContentLoaded', init);
