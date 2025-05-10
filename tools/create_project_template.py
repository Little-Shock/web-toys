#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
from datetime import datetime

def read_site_config():
    """读取站点配置文件"""
    # 首先尝试读取根目录的配置文件
    if os.path.exists('site_config.json'):
        try:
            with open('site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取根目录站点配置文件时出错: {e}")

    # 如果根目录没有，尝试读取tools目录的配置文件
    if os.path.exists('tools/site_config.json'):
        try:
            with open('tools/site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取tools目录站点配置文件时出错: {e}")

    print("无法找到站点配置文件")
    return None

def create_project_structure(project_path):
    """创建项目目录结构"""
    try:
        # 创建主目录
        os.makedirs(project_path, exist_ok=True)

        # 创建子目录
        os.makedirs(os.path.join(project_path, "css"), exist_ok=True)
        os.makedirs(os.path.join(project_path, "js"), exist_ok=True)
        os.makedirs(os.path.join(project_path, "assets", "images"), exist_ok=True)
        os.makedirs(os.path.join(project_path, "assets", "sounds"), exist_ok=True)

        print(f"已创建项目目录结构: {project_path}")
        return True
    except Exception as e:
        print(f"创建项目目录结构时出错: {e}")
        return False

def create_project_config(project_path, project_name, category, description=None, tags=None):
    """创建项目配置文件"""
    # 获取当前日期
    today = datetime.now().strftime("%Y-%m-%d")

    # 准备配置数据
    config = {
        "title": project_name,
        "description": description or f"{project_name} - 创意网页玩具",
        "tags": tags or ["互动体验"],
        "status": "beta",
        "category": category,
        "order": 999,

        # 版本管理相关字段
        "version": "0.1.0",
        "creation_date": today,
        "last_updated": today,
        "changelog": [
            {
                "version": "0.1.0",
                "date": today,
                "changes": [
                    "初始版本",
                    "基本功能实现"
                ]
            }
        ],

        # 兼容性信息
        "compatibility": {
            "mobile": True,
            "desktop": True,
            "performance_impact": "medium"
        },

        # 作者信息
        "author": {
            "name": "Little Shock Team",
            "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
            "creator": "Little-Shock",
            "contributors": []
        },

        # 其他元信息
        "features": [
            "基本功能"
        ],
        "dependencies": []
    }

    # 保存配置文件
    config_path = os.path.join(project_path, "project.json")
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        print(f"已创建项目配置文件: {config_path}")
        return True
    except Exception as e:
        print(f"创建项目配置文件时出错: {e}")
        return False

def create_html_template(project_path, project_name):
    """创建HTML模板文件"""
    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_name}</title>
    <meta name="description" content="{project_name} - 创意网页玩具">
    <link rel="stylesheet" href="css/style.css">
    <!-- 预加载字体 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="container">
        <header>
            <h1>{project_name}</h1>
            <p class="version-info">v<span id="version">0.1.0</span></p>
        </header>

        <main>
            <div class="canvas-container">
                <canvas id="mainCanvas"></canvas>
            </div>

            <div class="controls">
                <div class="control-group">
                    <button id="startButton" class="primary-button">开始</button>
                    <button id="resetButton">重置</button>
                </div>

                <div class="control-group">
                    <button id="settingsButton" class="icon-button">⚙️</button>
                    <button id="infoButton" class="icon-button">ℹ️</button>
                </div>
            </div>
        </main>

        <div id="settingsPanel" class="panel">
            <div class="panel-header">
                <h2>设置</h2>
                <button class="close-button">×</button>
            </div>
            <div class="panel-content">
                <div class="setting-item">
                    <label for="qualitySelect">画面质量</label>
                    <select id="qualitySelect">
                        <option value="high">高</option>
                        <option value="medium" selected>中</option>
                        <option value="low">低</option>
                    </select>
                </div>

                <div class="setting-item">
                    <label for="soundToggle">音效</label>
                    <label class="switch">
                        <input type="checkbox" id="soundToggle" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <div id="infoPanel" class="panel">
            <div class="panel-header">
                <h2>关于</h2>
                <button class="close-button">×</button>
            </div>
            <div class="panel-content">
                <p>{project_name} 是一个创意网页玩具，由 Little Shock 团队开发。</p>
                <p>版本: <span class="version">0.1.0</span> (更新于 <span id="updateDate"></span>)</p>
                <p><a href="project-details.html" class="details-link">查看详细信息</a></p>
                <p><a href="../index.html" class="back-link">返回主页</a></p>
            </div>
        </div>

        <div id="overlay" class="overlay"></div>
    </div>

    <!-- 脚本 -->
    <script src="js/utils.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
"""

    # 保存HTML文件
    html_path = os.path.join(project_path, "index.html")
    try:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"已创建HTML模板文件: {html_path}")
        return True
    except Exception as e:
        print(f"创建HTML模板文件时出错: {e}")
        return False

def create_css_template(project_path):
    """创建CSS模板文件"""
    css_content = """/* 基本样式 */
:root {
    --primary-color: #6200ea;
    --secondary-color: #00b0ff;
    --accent-color: #ff4081;
    --dark-bg: #121212;
    --light-bg: #f8f9fa;
    --text-light: #ffffff;
    --text-dark: #212121;
    --shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Noto Sans SC', sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--dark-bg), #2d2d3a);
    color: var(--text-light);
    line-height: 1.6;
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* 头部样式 */
header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
}

h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 900;
    margin-bottom: 10px;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 5px 15px rgba(98, 0, 234, 0.3);
}

.version-info {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    position: absolute;
    top: 10px;
    right: 10px;
}

/* 主要内容区域 */
main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.canvas-container {
    width: 100%;
    height: 70vh;
    background: rgba(30, 30, 40, 0.7);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow);
    position: relative;
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}

/* 控制区域 */
.controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
}

.control-group {
    display: flex;
    gap: 10px;
}

button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-light);
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    transition: var(--transition);
    font-family: inherit;
    font-size: 1rem;
}

button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.primary-button {
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    border: none;
    box-shadow: 0 4px 15px rgba(0, 176, 255, 0.3);
}

.primary-button:hover {
    box-shadow: 0 6px 20px rgba(0, 176, 255, 0.4);
}

.icon-button {
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}

/* 面板样式 */
.panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: rgba(30, 30, 40, 0.95);
    border-radius: 12px;
    box-shadow: var(--shadow);
    width: 90%;
    max-width: 500px;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel.active {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, -50%) scale(1);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
}

.close-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.close-button:hover {
    color: white;
    transform: none;
}

.panel-content {
    padding: 20px;
}

/* 设置项样式 */
.setting-item {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.setting-item label {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
}

select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-family: inherit;
    font-size: 0.9rem;
    width: 120px;
}

/* 开关样式 */
.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: var(--secondary-color);
}

input:checked + .slider:before {
    transform: translateX(26px);
}

/* 信息面板样式 */
.details-link, .back-link {
    color: var(--secondary-color);
    text-decoration: none;
    display: inline-block;
    margin-top: 10px;
    transition: var(--transition);
}

.details-link:hover, .back-link:hover {
    text-decoration: underline;
    transform: translateX(5px);
}

/* 遮罩层 */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.overlay.active {
    opacity: 1;
    visibility: visible;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .container {
        padding: 15px;
    }

    .canvas-container {
        height: 60vh;
    }

    button {
        padding: 8px 16px;
        font-size: 0.9rem;
    }

    .icon-button {
        width: 40px;
        height: 40px;
    }
}
"""

    # 保存CSS文件
    css_path = os.path.join(project_path, "css", "style.css")
    try:
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print(f"已创建CSS模板文件: {css_path}")
        return True
    except Exception as e:
        print(f"创建CSS模板文件时出错: {e}")
        return False

def create_js_templates(project_path, project_name):
    """创建JavaScript模板文件"""
    # 创建utils.js
    utils_content = """/**
 * 工具函数库
 */

// 设备检测
const deviceInfo = {
    // 检测是否为移动设备
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    // 检测是否为iOS设备
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    // 检测是否为Android设备
    isAndroid: /Android/i.test(navigator.userAgent),
    // 获取屏幕尺寸
    screenSize: Math.min(window.innerWidth, window.innerHeight),
    // 获取设备像素比
    pixelRatio: window.devicePixelRatio || 1,
    // 是否为低端设备（将在初始化时确定）
    isLowEndDevice: false
};

// 性能监控
const performanceMonitor = {
    // 帧率监控
    fps: {
        value: 0,
        frames: 0,
        lastTime: performance.now(),
        update: function() {
            this.frames++;
            const now = performance.now();
            const elapsed = now - this.lastTime;

            if (elapsed >= 1000) {
                this.value = Math.round(this.frames * 1000 / elapsed);
                this.frames = 0;
                this.lastTime = now;
            }

            return this.value;
        }
    },

    // 内存使用监控（如果可用）
    memory: {
        get: function() {
            if (window.performance && window.performance.memory) {
                return {
                    total: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)),
                    used: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))
                };
            }
            return null;
        }
    }
};

// 数学工具
const mathUtils = {
    // 将值限制在范围内
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    // 线性插值
    lerp: (a, b, t) => a + (b - a) * t,

    // 随机范围内的值
    random: (min, max) => Math.random() * (max - min) + min,

    // 随机整数
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // 角度转弧度
    degToRad: (degrees) => degrees * Math.PI / 180,

    // 弧度转角度
    radToDeg: (radians) => radians * 180 / Math.PI,

    // 距离计算
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
};

// 颜色工具
const colorUtils = {
    // HSL转RGB
    hslToRgb: (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    // RGB转十六进制
    rgbToHex: (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    // 生成随机颜色
    randomColor: () => {
        return `hsl(${mathUtils.randomInt(0, 360)}, ${mathUtils.randomInt(70, 100)}%, ${mathUtils.randomInt(40, 70)}%)`;
    }
};

// 本地存储工具
const storageUtils = {
    // 保存数据
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    // 加载数据
    load: (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('加载数据失败:', error);
            return defaultValue;
        }
    },

    // 删除数据
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }
};

// 导出工具
const exportUtils = {
    // 导出Canvas为图片
    canvasToImage: (canvas, fileName = 'image.png') => {
        try {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
            return true;
        } catch (error) {
            console.error('导出图片失败:', error);
            return false;
        }
    }
};

// 版本信息
const versionInfo = {
    version: '0.1.0',
    lastUpdated: '2025-01-01',

    // 显示版本信息
    display: () => {
        const versionElements = document.querySelectorAll('#version, .version');
        versionElements.forEach(el => {
            el.textContent = versionInfo.version;
        });

        const updateDateElement = document.getElementById('updateDate');
        if (updateDateElement) {
            updateDateElement.textContent = versionInfo.lastUpdated;
        }
    }
};
"""

    # 创建main.js
    main_content = f"""/**
 * {project_name}
 * 主控制脚本
 */

// 应用状态
const appState = {{
    // 画布和上下文
    canvas: null,
    ctx: null,

    // 动画帧请求ID
    animationFrameId: null,

    // 设备信息
    deviceInfo: deviceInfo,

    // 应用设置
    settings: {{
        quality: 'medium', // 画面质量: 'low', 'medium', 'high'
        sound: true        // 是否启用声音
    }},

    // 运行状态
    isRunning: false,

    // 性能监控
    performance: performanceMonitor
}};

/**
 * 初始化应用
 */
function init() {{
    // 获取画布和上下文
    appState.canvas = document.getElementById('mainCanvas');
    appState.ctx = appState.canvas.getContext('2d');

    // 设置画布尺寸
    resizeCanvas();

    // 检测设备性能
    detectDevicePerformance();

    // 加载设置
    loadSettings();

    // 初始化UI事件
    initUIEvents();

    // 显示版本信息
    versionInfo.display();

    console.log('应用初始化完成');
}}

/**
 * 调整画布尺寸
 */
function resizeCanvas() {{
    const container = appState.canvas.parentElement;
    appState.canvas.width = container.clientWidth;
    appState.canvas.height = container.clientHeight;

    // 如果应用正在运行，重新绘制
    if (appState.isRunning) {{
        render();
    }}
}}

/**
 * 检测设备性能
 */
function detectDevicePerformance() {{
    // 移动设备使用更严格的标准
    if (deviceInfo.isMobile) {{
        // 检查设备内存
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {{
            deviceInfo.isLowEndDevice = true;
        }}

        // 检查处理器核心数
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {{
            deviceInfo.isLowEndDevice = true;
        }}

        // 检查是否为省电模式
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
            deviceInfo.isLowEndDevice = true;
        }}

        // 检查屏幕尺寸
        if (deviceInfo.screenSize < 400) {{
            deviceInfo.isLowEndDevice = true;
        }}
    }}

    // 根据设备性能调整默认设置
    if (deviceInfo.isLowEndDevice) {{
        appState.settings.quality = 'low';
        console.log('检测到低端设备，使用低质量设置');
    }}
}}

/**
 * 加载设置
 */
function loadSettings() {{
    const savedSettings = storageUtils.load('appSettings');
    if (savedSettings) {{
        appState.settings = {{ ...appState.settings, ...savedSettings }};
    }}

    // 更新UI
    document.getElementById('qualitySelect').value = appState.settings.quality;
    document.getElementById('soundToggle').checked = appState.settings.sound;
}}

/**
 * 保存设置
 */
function saveSettings() {{
    storageUtils.save('appSettings', appState.settings);
}}

/**
 * 初始化UI事件
 */
function initUIEvents() {{
    // 窗口调整大小事件
    window.addEventListener('resize', resizeCanvas);

    // 开始按钮
    document.getElementById('startButton').addEventListener('click', toggleStart);

    // 重置按钮
    document.getElementById('resetButton').addEventListener('click', reset);

    // 设置按钮
    document.getElementById('settingsButton').addEventListener('click', () => {{
        togglePanel('settingsPanel');
    }});

    // 信息按钮
    document.getElementById('infoButton').addEventListener('click', () => {{
        togglePanel('infoPanel');
    }});

    // 关闭按钮
    document.querySelectorAll('.close-button').forEach(button => {{
        button.addEventListener('click', () => {{
            closeAllPanels();
        }});
    }});

    // 遮罩层点击
    document.getElementById('overlay').addEventListener('click', closeAllPanels);

    // 质量选择
    document.getElementById('qualitySelect').addEventListener('change', function() {{
        appState.settings.quality = this.value;
        saveSettings();
    }});

    // 声音开关
    document.getElementById('soundToggle').addEventListener('change', function() {{
        appState.settings.sound = this.checked;
        saveSettings();
    }});
}}

/**
 * 切换面板显示
 */
function togglePanel(panelId) {{
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById('overlay');

    // 关闭所有面板
    document.querySelectorAll('.panel').forEach(p => {{
        if (p.id !== panelId) {{
            p.classList.remove('active');
        }}
    }});

    // 切换当前面板
    panel.classList.toggle('active');

    // 切换遮罩层
    if (panel.classList.contains('active')) {{
        overlay.classList.add('active');
    }} else {{
        overlay.classList.remove('active');
    }}
}}

/**
 * 关闭所有面板
 */
function closeAllPanels() {{
    document.querySelectorAll('.panel').forEach(panel => {{
        panel.classList.remove('active');
    }});

    document.getElementById('overlay').classList.remove('active');
}}

/**
 * 切换开始/暂停
 */
function toggleStart() {{
    const startButton = document.getElementById('startButton');

    if (appState.isRunning) {{
        // 暂停
        stopAnimation();
        startButton.textContent = '开始';
    }} else {{
        // 开始
        startAnimation();
        startButton.textContent = '暂停';
    }}
}}

/**
 * 开始动画
 */
function startAnimation() {{
    if (!appState.isRunning) {{
        appState.isRunning = true;
        appState.animationFrameId = requestAnimationFrame(animate);
    }}
}}

/**
 * 停止动画
 */
function stopAnimation() {{
    if (appState.isRunning) {{
        appState.isRunning = false;
        cancelAnimationFrame(appState.animationFrameId);
    }}
}}

/**
 * 重置应用
 */
function reset() {{
    // 停止当前动画
    stopAnimation();

    // 重置状态
    // TODO: 添加应用特定的重置逻辑

    // 清除画布
    clearCanvas();

    // 更新UI
    document.getElementById('startButton').textContent = '开始';
}}

/**
 * 清除画布
 */
function clearCanvas() {{
    appState.ctx.clearRect(0, 0, appState.canvas.width, appState.canvas.height);
}}

/**
 * 动画循环
 */
function animate(timestamp) {{
    // 更新
    update(timestamp);

    // 渲染
    render();

    // 更新性能监控
    appState.performance.fps.update();

    // 继续动画循环
    if (appState.isRunning) {{
        appState.animationFrameId = requestAnimationFrame(animate);
    }}
}}

/**
 * 更新逻辑
 */
function update(timestamp) {{
    // TODO: 添加应用特定的更新逻辑
}}

/**
 * 渲染
 */
function render() {{
    // 清除画布
    clearCanvas();

    // TODO: 添加应用特定的渲染逻辑

    // 示例：绘制文本
    appState.ctx.fillStyle = 'white';
    appState.ctx.font = '24px "Noto Sans SC", sans-serif';
    appState.ctx.textAlign = 'center';
    appState.ctx.fillText('画布已准备就绪', appState.canvas.width / 2, appState.canvas.height / 2);

    // 示例：绘制FPS
    if (appState.isRunning) {{
        appState.ctx.font = '14px "Noto Sans SC", sans-serif';
        appState.ctx.textAlign = 'right';
        appState.ctx.fillText(`FPS: ${{appState.performance.fps.value}}`, appState.canvas.width - 10, 20);
    }}
}}

// 当文档加载完成时初始化应用
document.addEventListener('DOMContentLoaded', init);
"""

    # 保存utils.js
    utils_path = os.path.join(project_path, "js", "utils.js")
    try:
        with open(utils_path, 'w', encoding='utf-8') as f:
            f.write(utils_content)
        print(f"已创建utils.js文件: {utils_path}")
    except Exception as e:
        print(f"创建utils.js文件时出错: {e}")
        return False

    # 保存main.js
    main_path = os.path.join(project_path, "js", "main.js")
    try:
        with open(main_path, 'w', encoding='utf-8') as f:
            f.write(main_content)
        print(f"已创建main.js文件: {main_path}")
        return True
    except Exception as e:
        print(f"创建main.js文件时出错: {e}")
        return False

def create_service_worker(project_path, project_name):
    """创建Service Worker文件"""
    sw_content = f"""// {project_name} Service Worker
const CACHE_NAME = '{project_name.lower().replace(' ', '-')}-v0.1.0';

// 核心资源 - 必须缓存
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/utils.js',
  './js/main.js',
  './project-details.html'
];

// 次要资源 - 如果可能，也缓存这些
const SECONDARY_ASSETS = [
  './assets/images/',
  './assets/sounds/',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap'
];

// 所有要缓存的资源
const ASSETS = [...CORE_ASSETS, ...SECONDARY_ASSETS];

// 安装 Service Worker
self.addEventListener('install', event => {{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {{
        console.log('缓存已打开');
        return cache.addAll(CORE_ASSETS);
      }})
      .then(() => self.skipWaiting())
  );
}});

// 激活 Service Worker
self.addEventListener('activate', event => {{
  event.waitUntil(
    caches.keys().then(cacheNames => {{
      return Promise.all(
        cacheNames.filter(cacheName => {{
          return cacheName.startsWith('{project_name.lower().replace(' ', '-')}') && cacheName !== CACHE_NAME;
        }}).map(cacheName => {{
          console.log('删除旧缓存:', cacheName);
          return caches.delete(cacheName);
        }})
      );
    }}).then(() => self.clients.claim())
  );
}});

// 处理请求
self.addEventListener('fetch', event => {{
  // 跳过非GET请求和非HTTP/HTTPS请求
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {{
    return;
  }}

  // 处理字体请求
  if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {{
    event.respondWith(
      caches.match(event.request).then(response => {{
        return response || fetch(event.request).then(fetchResponse => {{
          return caches.open(CACHE_NAME).then(cache => {{
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          }});
        }});
      }})
    );
    return;
  }}

  // 处理其他请求
  event.respondWith(
    caches.match(event.request).then(response => {{
      // 如果在缓存中找到，返回缓存的响应
      if (response) {{
        return response;
      }}

      // 否则，从网络获取
      return fetch(event.request).then(fetchResponse => {{
        // 检查响应是否有效
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {{
          return fetchResponse;
        }}

        // 缓存响应
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {{
          cache.put(event.request, responseToCache);
        }});

        return fetchResponse;
      }}).catch(error => {{
        console.error('获取资源失败:', error);
        // 可以在这里返回一个离线页面或其他备用内容
      }});
    }})
  );
}});
"""

    # 保存Service Worker文件
    sw_path = os.path.join(project_path, "service-worker.js")
    try:
        with open(sw_path, 'w', encoding='utf-8') as f:
            f.write(sw_content)
        print(f"已创建Service Worker文件: {sw_path}")
        return True
    except Exception as e:
        print(f"创建Service Worker文件时出错: {e}")
        return False

def create_project(project_name, category, description=None, tags=None):
    """创建新项目"""
    # 检查站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，创建中止")
        return False

    # 检查分类是否存在
    categories = site_config.get("categories", [])
    category_exists = False
    for cat in categories:
        if cat.get("id") == category:
            category_exists = True
            break

    if not category_exists:
        print(f"分类 '{category}' 不存在，请选择有效的分类")
        return False

    # 构建项目路径
    project_path = os.path.join("projects", category, project_name)

    # 创建项目目录结构
    if not create_project_structure(project_path):
        return False

    # 创建项目配置文件
    if not create_project_config(project_path, project_name, category, description, tags):
        return False

    # 创建HTML模板文件
    if not create_html_template(project_path, project_name):
        return False

    # 创建CSS模板文件
    if not create_css_template(project_path):
        return False

    # 创建JavaScript模板文件
    if not create_js_templates(project_path, project_name):
        return False

    # 创建Service Worker文件
    if not create_service_worker(project_path, project_name):
        return False

    print(f"\n项目 '{project_name}' 创建成功!")
    print(f"项目路径: {project_path}")
    print("\n接下来的步骤:")
    print("1. 生成项目详情页: python tools/generate_project_details.py")
    print("2. 更新主页: python tools/generate_homepage.py")
    print("3. 开始开发你的项目!")

    return True

def print_usage():
    """打印使用说明"""
    print("项目模板生成工具")
    print("用法:")
    print("  python create_project_template.py <项目名称> <分类ID> [<描述>] [<标签1,标签2,...>]")
    print("\n可用的分类ID:")

    # 读取站点配置
    site_config = read_site_config()
    if site_config:
        categories = site_config.get("categories", [])
        for cat in categories:
            print(f"  {cat.get('id', '')}: {cat.get('name', '')}")

    print("\n示例:")
    print("  python create_project_template.py \"粒子花园\" interactive-visuals \"创意粒子效果\" \"粒子,互动,视觉\"")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print_usage()
        sys.exit(1)

    project_name = sys.argv[1]
    category = sys.argv[2]
    description = sys.argv[3] if len(sys.argv) > 3 else None

    tags = None
    if len(sys.argv) > 4:
        tags = sys.argv[4].split(',')

    create_project(project_name, category, description, tags)
