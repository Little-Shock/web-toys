#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import re
import shutil
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

def read_template():
    """读取项目详情页模板"""
    template_path = "tools/project_detail_template.html"
    if os.path.exists(template_path):
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"读取模板文件时出错: {e}")
            return None
    print(f"找不到模板文件: {template_path}")
    return None

def render_template(template, context):
    """简单的模板渲染函数"""
    # 替换基本变量
    for key, value in context.items():
        if isinstance(value, str):
            template = template.replace(f"{{{{{key}}}}}", value)
    
    # 处理条件语句 {{#var}}content{{/var}}
    for key, value in context.items():
        if isinstance(value, bool):
            if value:
                # 如果条件为真，移除标记但保留内容
                template = re.sub(r'\{\{#' + key + r'\}\}(.*?)\{\{/' + key + r'\}\}', r'\1', template, flags=re.DOTALL)
                # 移除否定条件的内容
                template = re.sub(r'\{\{\^' + key + r'\}\}(.*?)\{\{/' + key + r'\}\}', '', template, flags=re.DOTALL)
            else:
                # 如果条件为假，移除标记和内容
                template = re.sub(r'\{\{#' + key + r'\}\}(.*?)\{\{/' + key + r'\}\}', '', template, flags=re.DOTALL)
                # 保留否定条件的内容
                template = re.sub(r'\{\{\^' + key + r'\}\}(.*?)\{\{/' + key + r'\}\}', r'\1', template, flags=re.DOTALL)
    
    # 处理列表 {{#items}}{{.}}{{/items}}
    for key, value in context.items():
        if isinstance(value, list) and value:
            # 找到列表模板
            list_pattern = r'\{\{#' + key + r'\}\}(.*?)\{\{/' + key + r'\}\}'
            list_matches = re.findall(list_pattern, template, re.DOTALL)
            
            if list_matches:
                list_template = list_matches[0]
                # 为列表中的每个项目渲染模板
                rendered_items = []
                for item in value:
                    if isinstance(item, dict):
                        # 如果列表项是字典，递归渲染
                        item_rendered = list_template
                        for item_key, item_value in item.items():
                            if isinstance(item_value, str):
                                item_rendered = item_rendered.replace(f"{{{{{item_key}}}}}", item_value)
                        rendered_items.append(item_rendered)
                    else:
                        # 如果列表项是简单值，替换 {{.}}
                        rendered_items.append(list_template.replace("{{.}}", str(item)))
                
                # 替换整个列表模板
                template = re.sub(list_pattern, ''.join(rendered_items), template, flags=re.DOTALL)
            
            # 处理列表长度条件
            length_key = f"{key}.length"
            if value:
                template = re.sub(r'\{\{#' + length_key + r'\}\}(.*?)\{\{/' + length_key + r'\}\}', r'\1', template, flags=re.DOTALL)
            else:
                template = re.sub(r'\{\{#' + length_key + r'\}\}(.*?)\{\{/' + length_key + r'\}\}', '', template, flags=re.DOTALL)
    
    # 处理性能影响特殊情况
    if 'compatibility' in context and 'performance_impact' in context['compatibility']:
        impact = context['compatibility']['performance_impact']
        context[f'compatibility.performance_impact_{impact}'] = True
        
        for level in ['low', 'medium', 'high']:
            if level == impact:
                template = re.sub(r'\{\{#compatibility.performance_impact_' + level + r'\}\}(.*?)\{\{/compatibility.performance_impact_' + level + r'\}\}', r'\1', template, flags=re.DOTALL)
            else:
                template = re.sub(r'\{\{#compatibility.performance_impact_' + level + r'\}\}(.*?)\{\{/compatibility.performance_impact_' + level + r'\}\}', '', template, flags=re.DOTALL)
    
    return template

def generate_project_detail(project_path, config, template):
    """生成项目详情页"""
    # 准备模板上下文
    context = {
        'title': config.get('title', os.path.basename(project_path)),
        'description': config.get('description', ''),
        'version': config.get('version', '1.0.0'),
        'last_updated': config.get('last_updated', datetime.now().strftime('%Y-%m-%d')),
        'tags': config.get('tags', []),
        'status': config.get('status', 'beta'),
        'changelog': config.get('changelog', []),
        'compatibility': config.get('compatibility', {
            'mobile': True,
            'desktop': True,
            'min_screen_width': 320,
            'performance_impact': 'medium'
        }),
        'author_name': config.get('author', {}).get('name', 'Little Shock Team'),
        'features': config.get('features', []),
        'dependencies': config.get('dependencies', [])
    }
    
    # 渲染模板
    rendered_html = render_template(template, context)
    
    # 保存到项目目录
    detail_path = os.path.join(project_path, 'project-details.html')
    try:
        with open(detail_path, 'w', encoding='utf-8') as f:
            f.write(rendered_html)
        print(f"已生成项目详情页: {detail_path}")
        return True
    except Exception as e:
        print(f"保存项目详情页时出错: {e}")
        return False

def process_all_projects():
    """处理所有项目"""
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，生成中止")
        return
    
    # 读取模板
    template = read_template()
    if not template:
        print("无法读取模板，生成中止")
        return
    
    # 项目根目录
    projects_root = "projects"
    
    # 成功和失败计数
    success_count = 0
    fail_count = 0
    
    # 遍历分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    config = read_project_config(project_path)
                    if config:
                        if generate_project_detail(project_path, config, template):
                            success_count += 1
                        else:
                            fail_count += 1
                    else:
                        print(f"警告: 项目 {project_path} 没有配置文件或配置文件无效")
                        fail_count += 1
    
    print(f"处理完成! 成功: {success_count}, 失败: {fail_count}")

def update_project_links():
    """更新项目卡片，添加详情页链接"""
    # 读取主页HTML
    if not os.path.exists('index.html'):
        print("找不到主页文件")
        return False
    
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html = f.read()
        
        # 修改项目链接，添加详情页链接
        pattern = r'<a href="([^"]+)/index.html" class="toy-link">'
        
        def add_details_link(match):
            project_path = match.group(1)
            return f'<a href="{project_path}/index.html" class="toy-link" data-details="{project_path}/project-details.html">'
        
        updated_html = re.sub(pattern, add_details_link, html)
        
        # 添加详情页链接的JavaScript
        if '</body>' in updated_html:
            details_script = """
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 为每个项目卡片添加详情页链接
            const toyLinks = document.querySelectorAll('.toy-link');
            toyLinks.forEach(link => {
                const detailsUrl = link.getAttribute('data-details');
                if (detailsUrl) {
                    // 创建详情按钮
                    const detailsButton = document.createElement('a');
                    detailsButton.href = detailsUrl;
                    detailsButton.className = 'details-button';
                    detailsButton.textContent = '详情';
                    detailsButton.addEventListener('click', function(e) {
                        e.stopPropagation(); // 阻止事件冒泡
                    });
                    
                    // 添加到卡片
                    const toyCard = link.closest('.toy-card');
                    toyCard.appendChild(detailsButton);
                }
            });
        });
    </script>
"""
            updated_html = updated_html.replace('</body>', details_script + '</body>')
            
            # 添加详情按钮样式
            if '</style>' in updated_html:
                details_style = """
        .toy-card {
            position: relative;
        }
        
        .details-button {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.1);
            color: var(--secondary-color);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.8rem;
            text-decoration: none;
            transition: var(--transition);
            opacity: 0;
            transform: translateY(-10px);
            z-index: 2;
        }
        
        .toy-card:hover .details-button {
            opacity: 1;
            transform: translateY(0);
        }
        
        .details-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px) !important;
        }
"""
                updated_html = updated_html.replace('</style>', details_style + '</style>')
        
        # 保存更新后的HTML
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(updated_html)
        
        print("已更新主页，添加项目详情页链接")
        return True
    except Exception as e:
        print(f"更新主页时出错: {e}")
        return False

if __name__ == "__main__":
    print("开始生成项目详情页...")
    process_all_projects()
    update_project_links()
