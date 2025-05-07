#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
from collections import defaultdict

def load_site_config():
    """加载站点配置"""
    # 首先尝试读取当前目录的配置文件
    if os.path.exists('site_config.json'):
        try:
            with open('site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取当前目录站点配置文件时出错: {e}")
    
    # 如果当前目录没有，尝试读取tools目录的配置文件
    if os.path.exists('tools/site_config.json'):
        try:
            with open('tools/site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取tools目录站点配置文件时出错: {e}")
    
    print("无法找到站点配置文件")
    return None

def save_site_config(config):
    """保存站点配置"""
    # 优先保存到tools目录
    if os.path.exists('tools/site_config.json'):
        config_path = 'tools/site_config.json'
    else:
        config_path = 'site_config.json'
    
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        print(f"站点配置已保存到 {config_path}")
        return True
    except Exception as e:
        print(f"保存站点配置文件时出错: {e}")
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

def load_project_config(config_path):
    """加载项目配置"""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取项目配置文件时出错: {e}")
        return None

def save_project_config(config, config_path):
    """保存项目配置"""
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存项目配置文件时出错: {e}")
        return False

def migrate_projects():
    """迁移项目到新的配置格式"""
    # 加载站点配置
    site_config = load_site_config()
    if not site_config:
        return
    
    # 获取分类分配
    category_assignments = site_config.get("category_assignments", {})
    
    # 查找所有项目
    projects = find_all_projects()
    
    # 收集所有标签
    all_tags = defaultdict(int)
    
    # 迁移项目配置
    migrated_count = 0
    
    for project in projects:
        config = load_project_config(project["config_path"])
        if not config:
            continue
        
        # 检查是否已经迁移
        if "primary_category" in config:
            print(f"项目 {project['name']} 已经迁移")
            continue
        
        # 获取当前分类
        current_category = None
        if project["name"] in category_assignments:
            current_category = category_assignments[project["name"]]
        elif "category" in config:
            current_category = config["category"]
        else:
            current_category = project["category_dir"]
        
        # 更新为新的分类格式
        config["primary_category"] = current_category
        if "category" in config:
            del config["category"]
        
        # 添加次要分类
        if "secondary_categories" not in config:
            config["secondary_categories"] = []
        
        # 收集标签
        for tag in config.get("tags", []):
            all_tags[tag] += 1
        
        # 保存更新后的配置
        if save_project_config(config, project["config_path"]):
            print(f"已迁移项目 {project['name']} 的配置")
            migrated_count += 1
        else:
            print(f"迁移项目 {project['name']} 的配置失败")
    
    print(f"\n已成功迁移 {migrated_count} 个项目的配置")
    
    # 更新站点配置
    if "tags" not in site_config:
        site_config["tags"] = []
    
    # 添加标签到站点配置
    for tag, count in all_tags.items():
        tag_id = tag.lower().replace(" ", "-")
        site_config["tags"].append({
            "id": tag_id,
            "name": tag,
            "count": count
        })
    
    # 保存更新后的站点配置
    if save_site_config(site_config):
        print("已更新站点配置")
    else:
        print("更新站点配置失败")

def main():
    """主函数"""
    print("项目配置迁移工具")
    print("=" * 60)
    print("此工具将帮助你将项目配置迁移到新的标签和多分类系统。")
    print("迁移过程将：")
    print("1. 将现有的分类转换为主分类")
    print("2. 添加空的次要分类列表")
    print("3. 收集所有标签并更新站点配置")
    print("=" * 60)
    
    choice = input("是否继续迁移? (y/n): ").strip().lower()
    if choice != 'y':
        print("迁移已取消")
        return
    
    migrate_projects()
    
    print("\n迁移完成！")
    print("接下来你可以：")
    print("1. 运行 python tools/manage_tags.py 标准化标签")
    print("2. 运行 python tools/generate_homepage_with_tags.py 生成新的主页")

if __name__ == "__main__":
    main()
