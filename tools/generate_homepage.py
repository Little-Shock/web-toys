#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import re
from collections import defaultdict

# 状态文本映射
STATUS_TEXT = {
    "stable": "稳定版",
    "beta": "测试版",
    "deprecated": "已归档"
}

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

def read_project_config(project_path):
    """读取项目配置文件"""
    config_path = os.path.join(project_path, "project.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取配置文件 {config_path} 时出错: {e}")
            return None
    return None

def generate_project_card(project_path, config):
    """生成项目卡片HTML"""
    # 获取项目目录名
    project_dir = os.path.basename(project_path)

    title = config.get("title", project_dir)
    description = config.get("description", "")
    tags = config.get("tags", [])
    status = config.get("status", "beta")

    # 获取版本信息
    version = config.get("version", "")
    last_updated = config.get("last_updated", "")

    # 构建版本信息字符串
    version_info = ""
    if version:
        version_info = f"v{version}"
        if last_updated:
            version_info += f" ({last_updated})"

    # 构建项目卡片HTML
    card_html = f"""                <div class="toy-card">
                    <a href="{project_path}/index.html" class="toy-link">
                        <h3 class="toy-title">{title}</h3>
                        <p class="toy-description">{description}</p>
                        <div>"""

    # 添加标签
    for tag in tags:
        card_html += f'                            <span class="toy-tag">{tag}</span>\n'

    # 添加状态和版本信息
    status_text = STATUS_TEXT.get(status, "测试版")
    card_html += f"""                        </div>
                        <div class="toy-meta">
                            <span class="toy-status {status}">{status_text}</span>"""

    # 如果有版本信息，添加到卡片中
    if version_info:
        card_html += f"""
                            <span class="toy-version">{version_info}</span>"""

    card_html += """
                        </div>
                    </a>
                </div>"""
    return card_html

def generate_homepage():
    """生成主页HTML"""
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，生成中止")
        return

    # 获取分类和分类分配
    categories = site_config.get("categories", [])
    category_assignments = site_config.get("category_assignments", {})

    # 按分类组织项目
    projects_by_category = defaultdict(list)

    # 项目根目录
    projects_root = "projects"

    # 遍历分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 找到对应的分类ID
            category_id = None
            for cat in categories:
                if cat["id"] == category_dir:
                    category_id = category_dir
                    break

            if not category_id:
                print(f"警告: 找不到目录 {category_dir} 对应的分类ID")
                continue

            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    config = read_project_config(project_path)
                    if config:
                        # 获取项目在分类中的顺序
                        order = config.get("order", 999)
                        projects_by_category[category_id].append((project_path, config, order))
                    else:
                        print(f"警告: 项目 {project_path} 没有配置文件或配置文件无效")

    # 开始生成HTML
    html = []

    # 添加HTML头部
    html.append("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">""")

    # 添加标题
    html.append(f'    <title>{site_config.get("site_title", "网页玩具合集 - Little Shock")}</title>')

    # 添加样式
    html.append("""    <link rel="preconnect" href="https://fonts.googleapis.com">
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

        .category-icon {
            margin-right: 8px;
            font-size: 1.1em;
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
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--secondary-color);
            display: inline-block;
        }

        .category-description {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 20px;
            max-width: 800px;
            font-size: 1rem;
            line-height: 1.5;
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

        .toy-meta {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .toy-status {
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

        .toy-version {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            text-align: right;
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
        <header>""")

    # 添加团队名称和描述
    html.append(f'            <div class="team-name">{site_config.get("team_name", "Little Shock")}</div>')
    html.append(f'            <p class="subtitle">{site_config.get("site_description", "创意网页玩具合集")}</p>')
    html.append(f'            <div class="little-shock-link">')
    html.append(f'                <a href="{site_config.get("team_link", "#")}" target="_blank">Little Shock 专区 @ WaytoAGI</a>')
    html.append(f'            </div>')
    html.append(f'        </header>')

    # 添加分类导航
    html.append("""        <div class="category-nav">
            <div class="nav-arrows left">
                <div class="nav-arrow-icon">◀</div>
            </div>
            <div class="category-nav-scroll">""")

    # 按order排序分类
    sorted_categories = sorted(categories, key=lambda x: x.get("order", 999))

    # 只显示有项目的分类
    for category in sorted_categories:
        category_id = category.get("id")
        if category_id in projects_by_category and projects_by_category[category_id]:
            icon = category.get("icon", "")
            icon_html = f'<span class="category-icon">{icon}</span>' if icon else ''
            html.append(f'                <div class="category-tab" data-category="{category_id}">{icon_html}{category.get("name", "未命名")}</div>')

    html.append("""            </div>
            <div class="nav-arrows right">
                <div class="nav-arrow-icon">▶</div>
            </div>
        </div>
        <div class="content-area">""")

    # 生成每个分类的内容
    for category in sorted_categories:
        category_id = category.get("id")
        if category_id in projects_by_category and projects_by_category[category_id]:
            # 对每个分类中的项目按order排序
            projects = sorted(projects_by_category[category_id], key=lambda x: x[2])

            # 生成分类内容区域
            html.append(f"""            <div class="category-content" id="content-{category_id}">
                <h2 class="category-title">{category.get("name", "未命名")}</h2>
                <p class="category-description">{category.get("description", "")}</p>
                <div class="toys-container">""")

            # 生成每个项目的卡片
            for project_path, config, _ in projects:
                html.append(generate_project_card(project_path, config))

            html.append("""                </div>
            </div>""")

    html.append("""        </div>
        <footer>""")
    html.append(f'            {site_config.get("copyright", "© 2025 Little Shock 团队 | 所有项目均为开源网页玩具")}')
    html.append("""        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 获取所有分类标签和内容区域
            const categoryTabs = document.querySelectorAll('.category-tab');
            const categoryContents = document.querySelectorAll('.category-content');
            const navScroll = document.querySelector('.category-nav-scroll');
            const leftArrow = document.querySelector('.nav-arrows.left');
            const rightArrow = document.querySelector('.nav-arrows.right');

            // 默认激活第一个分类
            if (categoryTabs.length > 0 && categoryContents.length > 0) {
                categoryTabs[0].classList.add('active');
                const firstCategoryId = categoryTabs[0].getAttribute('data-category');
                document.getElementById('content-' + firstCategoryId).classList.add('active');
            }

            // 分类切换功能
            categoryTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // 移除所有激活状态
                    categoryTabs.forEach(t => t.classList.remove('active'));
                    categoryContents.forEach(c => c.classList.remove('active'));

                    // 添加当前激活状态
                    this.classList.add('active');
                    const categoryId = this.getAttribute('data-category');
                    document.getElementById('content-' + categoryId).classList.add('active');

                    // 滚动到视图中央
                    const tabRect = this.getBoundingClientRect();
                    const navRect = navScroll.getBoundingClientRect();
                    const scrollLeft = navScroll.scrollLeft + tabRect.left - navRect.left - (navRect.width / 2) + (tabRect.width / 2);
                    navScroll.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth'
                    });
                });
            });

            // 导航箭头功能
            function updateArrowsVisibility() {
                leftArrow.classList.toggle('visible', navScroll.scrollLeft > 0);
                rightArrow.classList.toggle('visible', navScroll.scrollLeft < navScroll.scrollWidth - navScroll.clientWidth - 10);
            }

            navScroll.addEventListener('scroll', updateArrowsVisibility);
            window.addEventListener('resize', updateArrowsVisibility);

            // 初始检查
            updateArrowsVisibility();

            // 左右箭头点击事件
            leftArrow.addEventListener('click', function() {
                navScroll.scrollBy({
                    left: -200,
                    behavior: 'smooth'
                });
            });

            rightArrow.addEventListener('click', function() {
                navScroll.scrollBy({
                    left: 200,
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>""")

    # 将HTML写入文件
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write('\n'.join(html))

    print("主页生成完成！")

if __name__ == "__main__":
    generate_homepage()
