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

def generate_project_card(project_path, config, valid_tag_ids):
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

    # 获取分类信息
    primary_category = config.get("primary_category", "")
    secondary_categories = config.get("secondary_categories", [])
    all_categories = [primary_category] + secondary_categories if primary_category else secondary_categories

    # 过滤标签，只保留有效的标签ID
    valid_tags = []
    tag_ids = []
    for tag in tags:
        tag_id = tag.lower().replace(' ', '-')
        if tag_id in valid_tag_ids:
            valid_tags.append(tag)
            tag_ids.append(tag_id)

    # 构建项目卡片HTML，添加数据属性用于筛选
    card_html = f"""                <div class="toy-card" data-categories="{' '.join(all_categories)}" data-tags="{' '.join(tag_ids)}">
                    <a href="{project_path}/index.html" class="toy-link">
                        <h3 class="toy-title">{title}</h3>
                        <p class="toy-description">{description}</p>
                        <div class="toy-tags">"""

    # 添加标签，最多显示3个
    for tag in valid_tags[:3]:
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

    # 获取分类和标签
    categories = site_config.get("categories", [])
    tags = site_config.get("tags", [])
    
    # 创建有效标签ID列表
    valid_tag_ids = [tag["id"] for tag in tags]

    # 按分类组织项目
    projects_by_category = defaultdict(list)
    all_projects = []

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
                        
                        # 获取主分类和次要分类
                        primary_category = config.get("primary_category", category_id)
                        secondary_categories = config.get("secondary_categories", [])
                        
                        # 添加到主分类
                        projects_by_category[primary_category].append((project_path, config, order))
                        
                        # 添加到次要分类
                        for sec_category in secondary_categories:
                            if sec_category != primary_category:
                                projects_by_category[sec_category].append((project_path, config, 999))  # 次要分类中顺序靠后
                        
                        # 添加到所有项目列表
                        all_projects.append((project_path, config, order))
                    else:
                        print(f"警告: 项目 {project_path} 没有配置文件或配置文件无效")

    # 生成HTML
    html = []

    # HTML头部
    html.append("""<!DOCTYPE html>
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
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 10px;
            background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .subtitle {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 15px;
        }

        .little-shock-link a {
            color: var(--secondary-color);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }

        .little-shock-link a:hover {
            color: var(--accent-color);
            text-decoration: underline;
        }

        .category-nav {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            position: relative;
        }

        .category-nav-scroll {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
            flex-grow: 1;
            padding: 10px 0;
        }

        .category-nav-scroll::-webkit-scrollbar {
            display: none;
        }

        .category-tab {
            padding: 10px 20px;
            margin-right: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            cursor: pointer;
            white-space: nowrap;
            transition: var(--transition);
            display: flex;
            align-items: center;
        }

        .category-tab:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .category-tab.active {
            background: var(--primary-color);
            box-shadow: 0 4px 10px rgba(98, 0, 234, 0.3);
        }

        .category-icon {
            margin-right: 8px;
            font-size: 1.2em;
        }

        .nav-arrows {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            transition: var(--transition);
            z-index: 2;
        }

        .nav-arrows.visible {
            opacity: 1;
        }

        .nav-arrows:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .nav-arrows.left {
            margin-right: 10px;
        }

        .nav-arrows.right {
            margin-left: 10px;
        }

        .content-area {
            position: relative;
        }

        .category-content {
            display: none;
            animation: fadeIn 0.5s ease;
        }

        .category-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .category-title {
            font-size: 1.8rem;
            margin-bottom: 10px;
            color: var(--secondary-color);
        }

        .category-description {
            margin-bottom: 30px;
            color: rgba(255, 255, 255, 0.7);
        }

        .toys-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
        }

        .toy-card {
            background: var(--card-bg);
            border-radius: 15px;
            overflow: hidden;
            transition: var(--transition);
            box-shadow: var(--shadow);
            height: 100%;
        }

        .toy-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }

        .toy-link {
            display: block;
            padding: 25px;
            color: var(--text-light);
            text-decoration: none;
            height: 100%;
        }

        .toy-title {
            font-size: 1.4rem;
            margin-bottom: 15px;
            color: var(--text-light);
        }

        .toy-description {
            margin-bottom: 15px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.95rem;
        }

        .toy-tag {
            display: inline-block;
            padding: 5px 10px;
            margin-right: 8px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.9);
        }

        .toy-meta {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .toy-status {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .toy-status.stable {
            background: rgba(76, 175, 80, 0.2);
            color: #81c784;
        }

        .toy-status.beta {
            background: rgba(255, 152, 0, 0.2);
            color: #ffb74d;
        }

        .toy-status.deprecated {
            background: rgba(244, 67, 54, 0.2);
            color: #e57373;
        }

        .toy-version {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
        }

        /* 标签筛选器样式 */
        .tag-filter {
            margin-bottom: 30px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
        }

        .tag-filter-title {
            font-size: 1.2rem;
            margin-bottom: 15px;
            color: var(--secondary-color);
        }

        .tag-cloud {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }

        .tag-item {
            padding: 8px 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            cursor: pointer;
            transition: var(--transition);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tag-item:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .tag-item.active {
            background: var(--secondary-color);
            color: var(--text-dark);
        }

        .tag-filter-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }

        .tag-filter-button {
            padding: 8px 15px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 20px;
            color: var(--text-light);
            cursor: pointer;
            transition: var(--transition);
            margin-left: 10px;
        }

        .tag-filter-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .tag-filter-button.primary {
            background: var(--primary-color);
        }

        .tag-filter-button.primary:hover {
            background: #7c4dff;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .team-name {
                font-size: 2rem;
            }

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
            
            .tag-cloud {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
        }

        @media (max-width: 480px) {
            .container {
                padding: 20px 10px;
            }

            .toys-container {
                grid-template-columns: 1fr;
            }

            .category-tab {
                padding: 8px 15px;
                font-size: 0.9rem;
            }
            
            .tag-cloud {
                grid-template-columns: repeat(2, 1fr);
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

    # 添加标签筛选器
    html.append("""        <div class="tag-filter">
            <h3 class="tag-filter-title">标签筛选</h3>
            <div class="tag-cloud">""")

    # 添加标签，只显示配置中的标签
    for tag in tags:
        html.append(f'                <div class="tag-item" data-tag="{tag["id"]}">{tag["name"]}</div>')

    html.append("""            </div>
            <div class="tag-filter-actions">
                <button class="tag-filter-button" id="clearTags">清除筛选</button>
                <button class="tag-filter-button primary" id="applyTags">应用筛选</button>
            </div>
        </div>""")

    # 添加分类导航
    html.append("""        <div class="category-nav">
            <div class="nav-arrows left">
                <div class="nav-arrow-icon">◀</div>
            </div>
            <div class="category-nav-scroll">""")

    # 按order排序分类
    sorted_categories = sorted(categories, key=lambda x: x.get("order", 999))

    # 添加"全部"分类
    html.append('                <div class="category-tab" data-category="all"><span class="category-icon">🔍</span>全部项目</div>')

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

    # 添加"全部"分类内容
    html.append("""            <div class="category-content" id="content-all">
                <h2 class="category-title">全部项目</h2>
                <p class="category-description">所有创意网页玩具的完整集合</p>
                <div class="toys-container">""")

    # 对所有项目按order排序
    all_projects.sort(key=lambda x: x[2])

    # 生成每个项目的卡片
    for project_path, config, _ in all_projects:
        html.append(generate_project_card(project_path, config, valid_tag_ids))

    html.append("""                </div>
            </div>""")

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
                html.append(generate_project_card(project_path, config, valid_tag_ids))

            html.append("""                </div>
            </div>""")

    # HTML尾部
    html.append("""        </div>
        <footer>
            <p class="copyright">""" + site_config.get("copyright", "© 2025 Little Shock 团队") + """</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 获取所有分类标签和内容区域
            const categoryTabs = document.querySelectorAll('.category-tab');
            const categoryContents = document.querySelectorAll('.category-content');
            const navScroll = document.querySelector('.category-nav-scroll');
            const leftArrow = document.querySelector('.nav-arrows.left');
            const rightArrow = document.querySelector('.nav-arrows.right');
            
            // 默认激活"全部"分类
            if (categoryTabs.length > 0 && categoryContents.length > 0) {
                categoryTabs[0].classList.add('active');
                document.getElementById('content-all').classList.add('active');
            }
            
            // 分类标签点击事件
            categoryTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // 移除所有激活状态
                    categoryTabs.forEach(t => t.classList.remove('active'));
                    categoryContents.forEach(c => c.classList.remove('active'));
                    
                    // 激活当前分类
                    this.classList.add('active');
                    const categoryId = this.getAttribute('data-category');
                    document.getElementById('content-' + categoryId).classList.add('active');
                    
                    // 应用当前标签筛选
                    applyTagFilters();
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
            
            // 标签筛选功能
            const tagItems = document.querySelectorAll('.tag-item');
            const clearTagsButton = document.getElementById('clearTags');
            const applyTagsButton = document.getElementById('applyTags');
            
            // 标签点击事件
            tagItems.forEach(tag => {
                tag.addEventListener('click', function() {
                    this.classList.toggle('active');
                });
            });
            
            // 清除标签筛选
            clearTagsButton.addEventListener('click', function() {
                tagItems.forEach(tag => tag.classList.remove('active'));
                applyTagFilters();
            });
            
            // 应用标签筛选
            applyTagsButton.addEventListener('click', applyTagFilters);
            
            // 应用标签筛选函数
            function applyTagFilters() {
                const selectedTags = Array.from(document.querySelectorAll('.tag-item.active')).map(tag => tag.getAttribute('data-tag'));
                const toyCards = document.querySelectorAll('.toy-card');
                
                // 获取当前激活的分类
                const activeCategory = document.querySelector('.category-tab.active').getAttribute('data-category');
                
                toyCards.forEach(card => {
                    // 检查分类匹配
                    const cardCategories = card.getAttribute('data-categories').split(' ');
                    const categoryMatch = activeCategory === 'all' || cardCategories.includes(activeCategory);
                    
                    // 检查标签匹配
                    const cardTags = card.getAttribute('data-tags').split(' ');
                    const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => cardTags.includes(tag));
                    
                    // 显示或隐藏卡片
                    if (categoryMatch && tagMatch) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
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
