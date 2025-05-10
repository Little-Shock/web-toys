#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一项目创建工具

这个脚本结合了create_project.py和create_project_template.py的功能，
提供了一个统一的接口来创建新项目。

用法:
  python tools/create_project_unified.py --title "项目标题" --description "项目描述" --category "分类ID" [选项]

选项:
  --title TEXT          项目标题 [必需]
  --description TEXT    项目描述 [必需]
  --category TEXT       项目分类 [必需]
  --status TEXT         项目状态 [默认: beta]
  --template TEXT       使用现有项目作为模板
  --tags TEXT           项目标签，逗号分隔
  --full-template       使用完整模板（包含更多文件和功能）
  --help                显示帮助信息并退出
"""

import os
import json
import sys
import datetime
import argparse
import shutil
from pathlib import Path

def read_site_config():
    """读取站点配置文件"""
    # 首先尝试读取简化版配置文件
    if os.path.exists('tools/site_config_simplified.json'):
        try:
            with open('tools/site_config_simplified.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取简化版站点配置文件时出错: {e}")
    
    # 如果简化版不存在，尝试读取根目录的配置文件
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

def create_project_json(project_path, title, description, category, status="beta", tags=None):
    """创建项目的project.json文件"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # 如果没有提供标签，使用默认标签
    if not tags:
        tags = ["互动体验"]
    
    project_data = {
        "title": title,
        "description": description,
        "tags": tags,
        "status": status,
        "primary_category": category,
        "secondary_categories": [],
        "order": 1,
        "version": "1.0.0",
        "creation_date": today,
        "last_updated": today,
        "changelog": [
            {
                "version": "1.0.0",
                "date": today,
                "changes": [
                    "初始版本"
                ]
            }
        ],
        "compatibility": {
            "mobile": True,
            "desktop": True,
            "performance_impact": "medium"
        },
        "author": {
            "name": "Little Shock Team",
            "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
            "creator": "Little-Shock",
            "contributors": []
        },
        "features": [],
        "dependencies": []
    }
    
    json_path = os.path.join(project_path, "project.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(project_data, f, ensure_ascii=False, indent=4)
    
    print(f"已创建项目元数据文件: {json_path}")
    return True

def create_basic_html(project_path, title, description):
    """创建基本的index.html文件"""
    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>{title}</h1>
            <p class="version-info">v<span id="version">1.0.0</span></p>
        </header>

        <main>
            <div class="canvas-container">
                <canvas id="mainCanvas"></canvas>
            </div>

            <div class="controls">
                <button id="startButton" class="primary-button">开始</button>
                <button id="resetButton">重置</button>
            </div>
        </main>

        <footer>
            <a href="../index.html" class="back-link">返回主菜单</a>
        </footer>
    </div>

    <!-- 脚本 -->
    <script src="js/main.js"></script>
</body>
</html>"""
    
    html_path = os.path.join(project_path, "index.html")
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"已创建基本HTML文件: {html_path}")
    return True

def create_basic_css(project_path):
    """创建基本的CSS文件"""
    css_content = """/* 基本样式 */
:root {
    --primary-color: #6200ea;
    --secondary-color: #00b0ff;
    --dark-bg: #121212;
    --text-light: #ffffff;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* 头部样式 */
header {
    text-align: center;
    margin-bottom: 30px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    color: var(--secondary-color);
}

.version-info {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
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
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
}

button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-light);
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    font-size: 1rem;
}

button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.primary-button {
    background: var(--primary-color);
    border: none;
}

.primary-button:hover {
    background: #7c4dff;
}

/* 底部样式 */
footer {
    margin-top: 30px;
    text-align: center;
}

.back-link {
    color: var(--secondary-color);
    text-decoration: none;
    display: inline-block;
    padding: 8px 16px;
    border: 1px solid var(--secondary-color);
    border-radius: 20px;
    transition: all 0.3s ease;
}

.back-link:hover {
    background: var(--secondary-color);
    color: var(--dark-bg);
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
}"""
    
    css_path = os.path.join(project_path, "css", "style.css")
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css_content)
    
    print(f"已创建基本CSS文件: {css_path}")
    return True

def create_basic_js(project_path, title):
    """创建基本的JavaScript文件"""
    js_content = f"""/**
 * {title}
 * 主控制脚本
 */

// 获取画布和上下文
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// 应用状态
const appState = {{
    // 动画帧请求ID
    animationFrameId: null,
    
    // 应用设置
    settings: {{
        sound: true
    }},
    
    // 运行状态
    isRunning: false
}};

/**
 * 初始化应用
 */
function init() {{
    // 设置画布尺寸
    resizeCanvas();
    
    // 初始化UI事件
    initUIEvents();
    
    // 绘制初始画面
    render();
    
    console.log('应用初始化完成');
}}

/**
 * 调整画布尺寸
 */
function resizeCanvas() {{
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 如果应用正在运行，重新绘制
    if (appState.isRunning) {{
        render();
    }}
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}}

/**
 * 动画循环
 */
function animate(timestamp) {{
    // 更新
    update(timestamp);
    
    // 渲染
    render();
    
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
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('画布已准备就绪', canvas.width / 2, canvas.height / 2);
}}

// 当文档加载完成时初始化应用
document.addEventListener('DOMContentLoaded', init);
"""
    
    js_path = os.path.join(project_path, "js", "main.js")
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"已创建基本JavaScript文件: {js_path}")
    return True

def create_project(args):
    """创建新项目"""
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，创建中止")
        return False
    
    # 验证分类是否有效
    valid_categories = [cat["id"] for cat in site_config.get("categories", [])]
    if args.category not in valid_categories:
        print(f"错误: 无效的分类 '{args.category}'")
        print(f"有效的分类: {', '.join(valid_categories)}")
        return False
    
    # 构建项目目录名（将标题转换为目录名）
    project_dir = args.title.replace(" ", "_")
    # 移除非法字符
    project_dir = ''.join(c for c in project_dir if c.isalnum() or c in ['_', '-'])
    
    # 构建项目路径
    project_path = os.path.join("projects", args.category, project_dir)
    
    # 检查项目目录是否已存在
    if os.path.exists(project_path):
        print(f"错误: 项目目录 '{project_path}' 已存在")
        return False
    
    # 处理标签
    tags = []
    if args.tags:
        tags = [tag.strip() for tag in args.tags.split(',')]
    
    # 创建项目目录结构
    if not create_project_structure(project_path):
        return False
    
    # 如果指定了模板，复制模板文件
    if args.template:
        template_path = args.template
        if not os.path.isdir(template_path):
            print(f"错误: 模板目录 '{template_path}' 不存在或不是目录")
            return False
        
        # 复制模板文件，但排除project.json
        for item in os.listdir(template_path):
            if item != "project.json":
                src = os.path.join(template_path, item)
                dst = os.path.join(project_path, item)
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
        
        print(f"已从模板 '{template_path}' 复制文件")
    
    # 创建project.json文件
    if not create_project_json(project_path, args.title, args.description, args.category, args.status, tags):
        return False
    
    # 如果没有使用模板或模板中没有index.html，创建基本的HTML文件
    if not args.template or not os.path.exists(os.path.join(project_path, "index.html")):
        if not create_basic_html(project_path, args.title, args.description):
            return False
    
    # 如果没有使用模板或模板中没有style.css，创建基本的CSS文件
    if not args.template or not os.path.exists(os.path.join(project_path, "css", "style.css")):
        if not create_basic_css(project_path):
            return False
    
    # 如果没有使用模板或模板中没有main.js，创建基本的JavaScript文件
    if not args.template or not os.path.exists(os.path.join(project_path, "js", "main.js")):
        if not create_basic_js(project_path, args.title):
            return False
    
    print(f"\n项目 '{args.title}' 创建成功!")
    print(f"目录: {project_path}")
    print("\n接下来的步骤:")
    print("1. 编辑项目文件，实现你的创意")
    print("2. 更新project.json中的元数据")
    print("3. 运行 'python tools/generate_homepage_simplified.py' 更新主页")
    print("4. 在浏览器中打开index.html测试你的项目")
    
    return True

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='创建新的网页玩具项目')
    parser.add_argument('--title', required=True, help='项目标题')
    parser.add_argument('--description', required=True, help='项目描述')
    parser.add_argument('--category', required=True, help='项目分类')
    parser.add_argument('--status', default='beta', choices=['beta', 'stable', 'deprecated'], help='项目状态')
    parser.add_argument('--template', help='使用现有项目作为模板')
    parser.add_argument('--tags', help='项目标签，逗号分隔')
    parser.add_argument('--full-template', action='store_true', help='使用完整模板（包含更多文件和功能）')
    
    args = parser.parse_args()
    
    # 创建项目
    success = create_project(args)
    
    # 返回状态码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
