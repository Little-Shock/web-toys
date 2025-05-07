#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import re
from datetime import datetime

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

    print("无法找到站点配置文件")
    return None

def save_site_config(config):
    """保存站点配置"""
    # 优先保存到简化版配置文件
    config_path = 'tools/site_config_simplified.json'
    
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        print(f"站点配置已保存到 {config_path}")
        return True
    except Exception as e:
        print(f"保存站点配置文件时出错: {e}")
        return False

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

def save_project_config(config, config_path):
    """保存项目配置"""
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        print(f"项目配置已保存到 {config_path}")
        return True
    except Exception as e:
        print(f"保存项目配置文件时出错: {e}")
        return False

def find_all_projects():
    """查找所有项目"""
    projects = []
    projects_root = "projects"
    
    if not os.path.exists(projects_root):
        print("找不到项目目录")
        return projects
    
    # 遍历分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    # 检查是否有配置文件
                    config_path = os.path.join(project_path, "project.json")
                    if os.path.exists(config_path):
                        projects.append({
                            "name": project_dir,
                            "path": project_path,
                            "config_path": config_path,
                            "category_dir": category_dir
                        })
    
    return projects

def find_project(project_name):
    """查找单个项目"""
    projects_root = "projects"
    
    # 查找项目
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            possible_path = os.path.join(category_path, project_name)
            if os.path.isdir(possible_path):
                return possible_path
    
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
    
    return template

def get_today_date():
    """获取当前日期，格式为YYYY-MM-DD"""
    return datetime.now().strftime("%Y-%m-%d")

def extract_features_from_readme(readme_path):
    """从README文件中提取功能特点"""
    if not os.path.exists(readme_path):
        return []

    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 查找功能特点部分
        features_match = re.search(r'## 功能特点\s+(.*?)(?=\s+##|\s*$)', content, re.DOTALL)
        if features_match:
            features_text = features_match.group(1).strip()
            # 提取每个功能点
            features = []
            for line in features_text.split('\n'):
                # 移除Markdown列表符号和加粗标记
                cleaned_line = re.sub(r'^-\s+\*\*(.*?)\*\*.*$', r'\1', line.strip())
                if cleaned_line and cleaned_line != line.strip():
                    features.append(cleaned_line)
            return features
    except Exception as e:
        print(f"读取README文件时出错: {e}")

    return []
