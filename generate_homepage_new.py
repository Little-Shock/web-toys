#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import re
from collections import defaultdict

# HTML模板 - 头部
HTML_HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网页玩具合集 - Little Shock</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6200ea;
            --secondary-color: #00b0ff;
            --accent-color: #ff4081;
            --dark-bg: #121212;
            --light-bg: #f8f9fa;
            --text-light: #ffffff;
            --text-dark: #212121;
            --card-bg: rgba(30, 30, 40, 0.7);
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
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .team-name {
            font-size: clamp(3rem, 8vw, 5rem);
            font-weight: 900;
            margin-bottom: 10px;
            background: linear-gradient(45deg, var(--primary-color), var(--secondary-color), var(--accent-color));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 5px 15px rgba(98, 0, 234, 0.3);
            letter-spacing: -1px;
        }

        .subtitle {
            font-size: clamp(1.2rem, 3vw, 1.8rem);
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
            max-width: 800px;
            margin: 0 auto;
            margin-bottom: 15px;
        }

        .little-shock-link {
            margin-top: 15px;
        }

        .little-shock-link a {
            display: inline-block;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            color: var(--secondary-color);
            text-decoration: none;
            border-radius: 20px;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .little-shock-link a:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        /* 分类导航样式 */
        .category-nav {
            position: relative;
            margin-bottom: 40px;
            overflow: hidden;
        }

        .category-nav-scroll {
            display: flex;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 10px;
            scrollbar-width: none; /* Firefox */
        }

        .category-nav-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge */
        }

        .category-tab {
            flex: 0 0 auto;
            padding: 12px 24px;
            margin-right: 10px;
            background: rgba(30, 30, 40, 0.7);
            color: rgba(255, 255, 255, 0.7);
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: nowrap;
        }

        .category-tab:hover {
            background: rgba(40, 40, 50, 0.9);
            transform: translateY(-2px);
        }

        .category-tab.active {
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            color: white;
            box-shadow: 0 4px 15px rgba(0, 176, 255, 0.3);
        }

        .nav-arrows {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(90deg, rgba(18, 18, 18, 0.8), transparent);
            z-index: 2;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .nav-arrows.visible {
            opacity: 1;
        }

        .nav-arrows.left {
            left: 0;
        }

        .nav-arrows.right {
            right: 0;
            background: linear-gradient(270deg, rgba(18, 18, 18, 0.8), transparent);
        }

        .nav-arrow-icon {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }

        /* 内容区域样式 */
        .content-area {
            position: relative;
            min-height: 400px;
        }

        .category-content {
            display: none;
            animation: fadeIn 0.5s ease forwards;
        }

        .category-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .toys-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }

        .category-title {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--secondary-color);
            display: inline-block;
        }

        .toy-card {
            position: relative;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            transition: var(--transition);
            box-shadow: var(--shadow);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .toy-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .toy-card:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            z-index: 1;
        }

        .toy-link {
            display: flex;
            flex-direction: column;
            padding: 25px;
            color: var(--text-light);
            text-decoration: none;
            height: 100%;
        }

        .toy-title {
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 10px;
            color: white;
        }

        .toy-description {
            font-size: 0.95rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 15px;
            flex-grow: 1;
        }

        .toy-tag {
            display: inline-block;
            padding: 5px 10px;
            background: rgba(98, 0, 234, 0.2);
            color: var(--secondary-color);
            border-radius: 20px;
            font-size: 0.8rem;
            margin-right: 5px;
            margin-bottom: 5px;
        }

        .toy-status {
            margin-top: 15px;
            font-size: 0.85rem;
            color: var(--accent-color);
        }

        .toy-status.stable {
            color: #00c853;
        }

        .toy-status.beta {
            color: #ffd600;
        }

        .toy-status.deprecated {
            color: #757575;
        }

        footer {
            text-align: center;
            margin-top: 80px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .toys-container {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }

            .toy-link {
                padding: 20px;
            }

            .toy-title {
                font-size: 1.2rem;
            }

            .category-tab {
                padding: 10px 18px;
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="team-name">Little Shock</div>
            <p class="subtitle">创意网页玩具合集 - 探索互动视觉与声音的奇妙世界</p>
            <div class="little-shock-link">
                <a href="https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd" target="_blank">Little Shock 专区 @ WaytoAGI</a>
            </div>
        </header>
"""

# HTML模板 - 尾部
HTML_FOOTER = """
        <footer>
            <p>© 2023-2024 Little Shock 团队 | 所有项目均为开源网页玩具</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化分类标签和内容
            const tabs = document.querySelectorAll('.category-tab');
            const contents = document.querySelectorAll('.category-content');
            const navScroll = document.querySelector('.category-nav-scroll');
            const leftArrow = document.querySelector('.nav-arrows.left');
            const rightArrow = document.querySelector('.nav-arrows.right');
            
            // 默认激活第一个分类
            if (tabs.length > 0) {
                tabs[0].classList.add('active');
                contents[0].classList.add('active');
            }
            
            // 标签点击事件
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    // 移除所有激活状态
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    
                    // 激活当前标签和内容
                    tab.classList.add('active');
                    contents[index].classList.add('active');
                    
                    // 滚动到视图中
                    tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                });
            });
            
            // 检查是否需要显示导航箭头
            function checkScrollArrows() {
                if (navScroll.scrollWidth > navScroll.clientWidth) {
                    leftArrow.classList.add('visible');
                    rightArrow.classList.add('visible');
                } else {
                    leftArrow.classList.remove('visible');
                    rightArrow.classList.remove('visible');
                }
                
                // 检查滚动位置
                if (navScroll.scrollLeft <= 10) {
                    leftArrow.style.opacity = '0.3';
                } else {
                    leftArrow.style.opacity = '1';
                }
                
                if (navScroll.scrollLeft + navScroll.clientWidth >= navScroll.scrollWidth - 10) {
                    rightArrow.style.opacity = '0.3';
                } else {
                    rightArrow.style.opacity = '1';
                }
            }
            
            // 初始检查
            checkScrollArrows();
            window.addEventListener('resize', checkScrollArrows);
            
            // 导航箭头点击事件
            leftArrow.addEventListener('click', () => {
                navScroll.scrollBy({ left: -200, behavior: 'smooth' });
            });
            
            rightArrow.addEventListener('click', () => {
                navScroll.scrollBy({ left: 200, behavior: 'smooth' });
            });
            
            // 滚动事件监听
            navScroll.addEventListener('scroll', checkScrollArrows);
            
            // 触摸滑动支持
            let touchStartX = 0;
            let touchEndX = 0;
            
            document.querySelector('.content-area').addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, false);
            
            document.querySelector('.content-area').addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, false);
            
            function handleSwipe() {
                const threshold = 100; // 最小滑动距离
                
                if (touchEndX < touchStartX - threshold) {
                    // 向左滑动 - 下一个分类
                    const activeTab = document.querySelector('.category-tab.active');
                    const nextTab = activeTab.nextElementSibling;
                    if (nextTab) {
                        nextTab.click();
                    }
                }
                
                if (touchEndX > touchStartX + threshold) {
                    // 向右滑动 - 上一个分类
                    const activeTab = document.querySelector('.category-tab.active');
                    const prevTab = activeTab.previousElementSibling;
                    if (prevTab) {
                        prevTab.click();
                    }
                }
            }
        });
    </script>
</body>
</html>"""

# 状态文本映射
STATUS_TEXT = {
    "stable": "稳定版",
    "beta": "测试版",
    "deprecated": "已归档"
}

# 新的分类方案
NEW_CATEGORIES = [
    "互动视觉",
    "物理模拟",
    "创意工具",
    "音乐与声音",
    "视觉特效",
    "游戏与娱乐",
    "实用工具",
    "归档项目"
]

# 分类映射关系（旧分类 -> 新分类）
CATEGORY_MAPPING = {
    "视觉互动": {
        "赛博流光": "互动视觉",
        "元素波纹": "互动视觉",
        "微光沙盘": "互动视觉",
        "微光沙盘_WebGL": "互动视觉",
        "墨韵": "互动视觉",
        "量子弹球": "物理模拟",
        "三体模拟": "物理模拟",
        "赛博故障风": "创意工具"
    },
    "特效展示": {
        "神经元模拟": "视觉特效",
        "蜘蛛网效果": "视觉特效",
        "赛博闪卡": "视觉特效",
        "Holo-Card-Tilt": "视觉特效",
        "blackhole": "物理模拟",
        "赛博流麻": "游戏与娱乐"
    },
    "声音与创意": {
        "声音雕塑": "音乐与声音",
        "节奏星图": "音乐与声音",
        "电子木鱼": "音乐与声音",
        "光绘": "创意工具",
        "量子涂鸦": "创意工具",
        "织梦": "创意工具"
    },
    "实用工具": {
        "放大镜后": "实用工具"
    },
    "游戏": {
        "find_emoji": "游戏与娱乐"
    },
    "归档项目": {
        "Holofoil Card": "归档项目"
    }
}

def read_project_config(project_dir):
    """读取项目配置文件"""
    config_path = os.path.join(project_dir, "project.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取配置文件 {config_path} 时出错: {e}")
            return None
    return None

def generate_project_card(project_dir, config):
    """生成项目卡片HTML"""
    title = config.get("title", os.path.basename(project_dir))
    description = config.get("description", "")
    tags = config.get("tags", [])
    status = config.get("status", "beta")

    # 构建项目卡片HTML
    card_html = f"""                <div class="toy-card">
                    <a href="{project_dir}/index.html" class="toy-link">
                        <h3 class="toy-title">{title}</h3>
                        <p class="toy-description">{description}</p>
                        <div>"""

    # 添加标签
    for tag in tags:
        card_html += f'                            <span class="toy-tag">{tag}</span>\n'

    # 添加状态
    status_text = STATUS_TEXT.get(status, "测试版")
    card_html += f"""                        </div>
                        <div class="toy-status {status}">{status_text}</div>
                    </a>
                </div>"""
    return card_html

def update_project_categories():
    """更新项目分类"""
    project_dirs = [d for d in os.listdir('.') if os.path.isdir(d) and not d.startswith('.') and d != "开发过程"]
    
    for project_dir in project_dirs:
        config = read_project_config(project_dir)
        if config:
            old_category = config.get("category", "其他")
            
            # 查找新分类
            new_category = None
            if old_category in CATEGORY_MAPPING and project_dir in CATEGORY_MAPPING[old_category]:
                new_category = CATEGORY_MAPPING[old_category][project_dir]
            
            # 如果找到新分类，更新配置文件
            if new_category:
                config["category"] = new_category
                config_path = os.path.join(project_dir, "project.json")
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, ensure_ascii=False, indent=4)
                print(f"已更新 {project_dir} 的分类: {old_category} -> {new_category}")

def generate_homepage():
    """生成主页HTML"""
    # 获取所有项目目录
    project_dirs = [d for d in os.listdir('.') if os.path.isdir(d) and not d.startswith('.') and d != "开发过程"]

    # 按分类组织项目
    projects_by_category = defaultdict(list)

    for project_dir in project_dirs:
        config = read_project_config(project_dir)
        if config:
            category = config.get("category", "其他")
            order = config.get("order", 999)
            projects_by_category[category].append((project_dir, config, order))

    # 开始生成HTML
    html = HTML_HEAD

    # 生成分类导航
    html += """        <div class="category-nav">
            <div class="nav-arrows left">
                <div class="nav-arrow-icon">◀</div>
            </div>
            <div class="category-nav-scroll">
"""

    # 生成分类标签
    for i, category in enumerate(NEW_CATEGORIES):
        if category in projects_by_category:
            html += f'                <div class="category-tab" data-category="{category}">{category}</div>\n'

    html += """            </div>
            <div class="nav-arrows right">
                <div class="nav-arrow-icon">▶</div>
            </div>
        </div>
        <div class="content-area">
"""

    # 生成分类内容
    for i, category in enumerate(NEW_CATEGORIES):
        if category in projects_by_category:
            # 对每个分类中的项目按order排序
            projects = sorted(projects_by_category[category], key=lambda x: x[2])

            # 生成分类内容区域
            html += f"""            <div class="category-content" id="content-{category}">
                <h2 class="category-title">{category}</h2>
                <div class="toys-container">"""

            # 生成每个项目的卡片
            for project_dir, config, _ in projects:
                html += generate_project_card(project_dir, config)

            html += """                </div>
            </div>
"""

    html += "        </div>"
    
    # 添加页脚
    html += HTML_FOOTER

    # 写入文件
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("主页生成完成！")

def create_config_files_from_current_index():
    """从当前index.html提取信息并为每个项目创建配置文件"""
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()

        # 使用正则表达式提取项目信息
        pattern = r'<a href="([^"]+)" class="toy-link">\s*<h3 class="toy-title">([^<]+)</h3>\s*<p class="toy-description">([^<]+)</p>.*?<span class="toy-tag">([^<]+)</span>\s*<span class="toy-tag">([^<]+)</span>.*?<div class="toy-status ([^"]+)">([^<]+)</div>'

        # 提取分类信息
        category_pattern = r'<h2 class="category-title">([^<]+)</h2>\s*<div class="toys-container">(.*?)</section>'
        categories = re.findall(category_pattern, html_content, re.DOTALL)

        for category_name, category_content in categories:
            # 在每个分类中查找项目
            projects = re.findall(pattern, category_content, re.DOTALL)

            for i, (href, title, description, tag1, tag2, status, _) in enumerate(projects):
                # 提取项目目录名
                project_dir = href.split('/')[0]

                # 创建配置对象
                config = {
                    "title": title.strip(),
                    "description": description.strip(),
                    "tags": [tag1.strip(), tag2.strip()],
                    "status": status.strip(),
                    "category": category_name.strip(),
                    "order": i + 1
                }

                # 确保项目目录存在
                if os.path.isdir(project_dir):
                    # 创建配置文件
                    config_path = os.path.join(project_dir, "project.json")
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=4)

                    print(f"已为 {project_dir} 创建配置文件")
                else:
                    print(f"警告: 项目目录 {project_dir} 不存在")

        print("配置文件创建完成！")

    except Exception as e:
        print(f"创建配置文件时出错: {e}")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--create-configs":
            # 从当前index.html创建配置文件
            create_config_files_from_current_index()
        elif sys.argv[1] == "--update-categories":
            # 更新项目分类
            update_project_categories()
    else:
        # 生成主页
        generate_homepage()
        print("使用 --create-configs 参数可以从当前index.html创建项目配置文件")
        print("使用 --update-categories 参数可以更新项目分类")
