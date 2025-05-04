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
            --card-bg: rgba(255, 255, 255, 0.9);
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
            margin-bottom: 50px;
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

        .toys-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }

        .category {
            margin-top: 60px;
            margin-bottom: 20px;
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
            background: rgba(30, 30, 40, 0.7);
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
</body>
</html>"""

# 状态文本映射
STATUS_TEXT = {
    "stable": "稳定版",
    "beta": "测试版",
    "deprecated": "已归档"
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

    # 预定义分类顺序
    category_order = ["视觉互动", "特效展示", "声音与创意", "实用工具", "归档项目", "其他"]

    # 按分类生成内容
    for category in category_order:
        if category in projects_by_category:
            # 对每个分类中的项目按order排序
            projects = sorted(projects_by_category[category], key=lambda x: x[2])

            # 生成分类标题和容器
            html += f"""        <section class="category">
            <h2 class="category-title">{category}</h2>
            <div class="toys-container">"""

            # 生成每个项目的卡片
            for project_dir, config, _ in projects:
                html += generate_project_card(project_dir, config)

            html += """            </div>
        </section>"""

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

    if len(sys.argv) > 1 and sys.argv[1] == "--create-configs":
        # 从当前index.html创建配置文件
        create_config_files_from_current_index()
    else:
        # 生成主页
        generate_homepage()
        print("使用 --create-configs 参数可以从当前index.html创建项目配置文件")
