#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
import re
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

def load_project_config(project_path):
    """加载项目配置"""
    config_path = os.path.join(project_path, "project.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f), config_path
        except Exception as e:
            print(f"读取项目配置文件时出错: {e}")
    else:
        print(f"项目配置文件不存在: {config_path}")
    return None, None

def read_template():
    """读取README模板"""
    template_path = "tools/readme_template.md"
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
                            elif isinstance(item_value, list):
                                # 处理嵌套列表
                                nested_list_pattern = r'\{\{#' + item_key + r'\}\}(.*?)\{\{/' + item_key + r'\}\}'
                                nested_list_matches = re.findall(nested_list_pattern, item_rendered, re.DOTALL)
                                if nested_list_matches and item_value:
                                    nested_list_template = nested_list_matches[0]
                                    nested_rendered_items = []
                                    for nested_item in item_value:
                                        if isinstance(nested_item, str):
                                            nested_rendered_items.append(nested_list_template.replace("{{.}}", nested_item))
                                    nested_rendered = ''.join(nested_rendered_items)
                                    item_rendered = re.sub(nested_list_pattern, nested_rendered, item_rendered, flags=re.DOTALL)
                        rendered_items.append(item_rendered)
                    else:
                        # 如果列表项是简单值，替换 {{.}}
                        rendered_items.append(list_template.replace("{{.}}", str(item)))
                
                # 替换整个列表模板
                template = re.sub(list_pattern, ''.join(rendered_items), template, flags=re.DOTALL)
    
    return template

def generate_readme(project_path, config):
    """生成README文件"""
    # 读取模板
    template = read_template()
    if not template:
        return False
    
    # 准备模板上下文
    project_dir = os.path.basename(project_path)
    
    # 状态文本映射
    status_text_map = {
        "stable": "稳定版",
        "beta": "测试版",
        "deprecated": "已归档"
    }
    
    context = {
        'title': config.get('title', project_dir),
        'description': config.get('description', ''),
        'version': config.get('version', '1.0.0'),
        'last_updated': config.get('last_updated', datetime.now().strftime('%Y-%m-%d')),
        'status': config.get('status', 'beta'),
        'status_text': status_text_map.get(config.get('status', 'beta'), '测试版'),
        'project_dir': project_dir,
        'features': config.get('features', ['基本功能']),
        'dependencies': config.get('dependencies', []),
        'changelog': config.get('changelog', [])
    }
    
    # 渲染模板
    rendered_readme = render_template(template, context)
    
    # 保存到项目目录
    readme_path = os.path.join(project_path, 'README.md')
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(rendered_readme)
        print(f"已生成README文件: {readme_path}")
        return True
    except Exception as e:
        print(f"保存README文件时出错: {e}")
        return False

def process_all_projects():
    """处理所有项目"""
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，生成中止")
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
                    # 检查是否已有README文件
                    readme_path = os.path.join(project_path, 'README.md')
                    if os.path.exists(readme_path):
                        print(f"项目 {project_dir} 已有README文件，跳过")
                        continue
                    
                    # 读取项目配置
                    config, _ = load_project_config(project_path)
                    if config:
                        if generate_readme(project_path, config):
                            success_count += 1
                        else:
                            fail_count += 1
                    else:
                        print(f"警告: 项目 {project_path} 没有配置文件或配置文件无效")
                        fail_count += 1
    
    print(f"处理完成! 成功: {success_count}, 失败: {fail_count}")

def process_single_project(project_name, force=False):
    """处理单个项目"""
    # 项目根目录
    projects_root = "projects"
    
    # 查找项目
    project_path = None
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            possible_path = os.path.join(category_path, project_name)
            if os.path.isdir(possible_path):
                project_path = possible_path
                break
    
    if not project_path:
        print(f"找不到项目: {project_name}")
        return False
    
    # 检查是否已有README文件
    readme_path = os.path.join(project_path, 'README.md')
    if os.path.exists(readme_path) and not force:
        print(f"项目 {project_name} 已有README文件，使用 --force 参数覆盖")
        return False
    
    # 读取项目配置
    config, _ = load_project_config(project_path)
    if config:
        if generate_readme(project_path, config):
            print(f"项目 {project_name} 的README文件生成成功!")
            return True
        else:
            print(f"项目 {project_name} 的README文件生成失败!")
            return False
    else:
        print(f"项目 {project_name} 没有配置文件或配置文件无效")
        return False

def print_usage():
    """打印使用说明"""
    print("README生成工具")
    print("用法:")
    print("  python generate_readme.py all")
    print("    为所有没有README的项目生成README文件")
    print("  python generate_readme.py <项目名称> [--force]")
    print("    为指定项目生成README文件，--force参数可覆盖已有文件")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "all":
        process_all_projects()
    else:
        force = "--force" in sys.argv
        process_single_project(command, force)
