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

def update_project_categories():
    """更新项目分类"""
    # 加载站点配置
    site_config = load_site_config()
    if not site_config:
        return
    
    # 获取所有分类
    categories = site_config.get("categories", [])
    category_dict = {cat["id"]: cat["name"] for cat in categories}
    
    # 查找所有项目
    projects = find_all_projects()
    
    # 更新项目配置
    for project in projects:
        config = load_project_config(project["config_path"])
        if not config:
            continue
        
        # 获取当前分类
        current_category = None
        if "category" in config:
            current_category = config["category"]
        elif project["category_dir"] in category_dict:
            current_category = project["category_dir"]
        
        # 更新为新的分类格式
        if current_category and "primary_category" not in config:
            config["primary_category"] = current_category
            if "category" in config:
                del config["category"]
            
            # 如果没有次要分类，添加空列表
            if "secondary_categories" not in config:
                config["secondary_categories"] = []
            
            # 保存更新后的配置
            if save_project_config(config, project["config_path"]):
                print(f"已更新项目 {project['name']} 的分类")
            else:
                print(f"更新项目 {project['name']} 的分类失败")

def collect_all_tags():
    """收集所有标签"""
    tags = defaultdict(int)
    
    # 查找所有项目
    projects = find_all_projects()
    
    # 收集标签
    for project in projects:
        config = load_project_config(project["config_path"])
        if not config:
            continue
        
        # 获取标签
        project_tags = config.get("tags", [])
        for tag in project_tags:
            tags[tag] += 1
    
    # 按使用频率排序
    sorted_tags = sorted(tags.items(), key=lambda x: x[1], reverse=True)
    
    return sorted_tags

def show_tag_statistics():
    """显示标签统计信息"""
    tags = collect_all_tags()
    
    print("\n标签使用统计:")
    print("=" * 60)
    print(f"{'标签':<30} {'使用次数':<10}")
    print("-" * 60)
    
    for tag, count in tags:
        print(f"{tag:<30} {count:<10}")
    
    print("=" * 60)
    print(f"共有 {len(tags)} 个不同的标签")

def standardize_tags():
    """标准化标签"""
    # 收集所有标签
    all_tags = collect_all_tags()
    
    # 显示标签统计
    show_tag_statistics()
    
    # 询问是否要标准化标签
    choice = input("\n是否要标准化标签? (y/n): ").strip().lower()
    if choice != 'y':
        return
    
    # 创建标签映射
    tag_mapping = {}
    
    print("\n为每个标签指定标准名称 (直接回车保持不变):")
    for tag, count in all_tags:
        new_tag = input(f"{tag} ({count}次) -> ").strip()
        if new_tag:
            tag_mapping[tag] = new_tag
    
    # 确认映射
    print("\n标签映射:")
    for old_tag, new_tag in tag_mapping.items():
        print(f"{old_tag} -> {new_tag}")
    
    confirm = input("\n确认应用这些更改? (y/n): ").strip().lower()
    if confirm != 'y':
        return
    
    # 应用映射
    projects = find_all_projects()
    updated_count = 0
    
    for project in projects:
        config = load_project_config(project["config_path"])
        if not config:
            continue
        
        # 获取标签
        project_tags = config.get("tags", [])
        new_tags = []
        updated = False
        
        for tag in project_tags:
            if tag in tag_mapping:
                new_tags.append(tag_mapping[tag])
                updated = True
            else:
                new_tags.append(tag)
        
        if updated:
            config["tags"] = new_tags
            if save_project_config(config, project["config_path"]):
                updated_count += 1
    
    print(f"\n已更新 {updated_count} 个项目的标签")

def suggest_secondary_categories():
    """根据标签建议次要分类"""
    # 加载站点配置
    site_config = load_site_config()
    if not site_config:
        return
    
    # 获取所有分类
    categories = site_config.get("categories", [])
    category_dict = {cat["id"]: cat["name"] for cat in categories}
    
    # 创建标签到分类的映射
    tag_to_category = {}
    
    print("\n为常用标签指定相关分类:")
    tags = collect_all_tags()
    
    for tag, count in tags:
        if count >= 2:  # 只处理使用至少2次的标签
            print(f"\n标签: {tag} (使用 {count} 次)")
            print("可选分类:")
            for i, (cat_id, cat_name) in enumerate(category_dict.items(), 1):
                print(f"{i}. {cat_name} ({cat_id})")
            
            choice = input("选择相关分类 (多个用逗号分隔，直接回车跳过): ").strip()
            if choice:
                try:
                    selected_indices = [int(idx.strip()) for idx in choice.split(",")]
                    selected_categories = [list(category_dict.keys())[idx-1] for idx in selected_indices if 1 <= idx <= len(category_dict)]
                    if selected_categories:
                        tag_to_category[tag] = selected_categories
                except ValueError:
                    print("输入无效，跳过此标签")
    
    # 应用建议的次要分类
    projects = find_all_projects()
    updated_count = 0
    
    for project in projects:
        config = load_project_config(project["config_path"])
        if not config:
            continue
        
        # 获取标签和主分类
        project_tags = config.get("tags", [])
        primary_category = config.get("primary_category")
        if not primary_category:
            continue
        
        # 建议的次要分类
        suggested_categories = set()
        for tag in project_tags:
            if tag in tag_to_category:
                for cat in tag_to_category[tag]:
                    if cat != primary_category:  # 排除主分类
                        suggested_categories.add(cat)
        
        if suggested_categories:
            # 更新次要分类
            current_secondary = config.get("secondary_categories", [])
            new_secondary = list(set(current_secondary) | suggested_categories)
            
            if set(new_secondary) != set(current_secondary):
                config["secondary_categories"] = new_secondary
                if save_project_config(config, project["config_path"]):
                    print(f"已更新项目 {project['name']} 的次要分类: {', '.join(new_secondary)}")
                    updated_count += 1
    
    print(f"\n已更新 {updated_count} 个项目的次要分类")

def update_site_config_for_tags():
    """更新站点配置以支持标签系统"""
    # 加载站点配置
    site_config = load_site_config()
    if not site_config:
        return
    
    # 收集所有标签
    tags = collect_all_tags()
    
    # 添加标签配置
    if "tags" not in site_config:
        site_config["tags"] = []
    
    # 更新标签列表
    existing_tags = {tag["id"]: tag for tag in site_config["tags"]}
    
    for tag_name, count in tags:
        tag_id = tag_name.lower().replace(" ", "-")
        if tag_id not in existing_tags:
            site_config["tags"].append({
                "id": tag_id,
                "name": tag_name,
                "count": count
            })
        else:
            existing_tags[tag_id]["count"] = count
    
    # 保存更新后的配置
    if save_site_config(site_config):
        print("已更新站点配置以支持标签系统")
    else:
        print("更新站点配置失败")

def show_menu():
    """显示菜单"""
    print("\n标签管理工具")
    print("=" * 60)
    print("1. 显示标签统计")
    print("2. 标准化标签")
    print("3. 更新项目分类格式")
    print("4. 根据标签建议次要分类")
    print("5. 更新站点配置以支持标签系统")
    print("0. 退出")
    print("=" * 60)
    
    choice = input("请选择操作 (0-5): ").strip()
    return choice

def main():
    """主函数"""
    while True:
        choice = show_menu()
        
        if choice == "0":
            break
        elif choice == "1":
            show_tag_statistics()
        elif choice == "2":
            standardize_tags()
        elif choice == "3":
            update_project_categories()
        elif choice == "4":
            suggest_secondary_categories()
        elif choice == "5":
            update_site_config_for_tags()
        else:
            print("无效的选择，请重试")
        
        input("\n按回车键继续...")

if __name__ == "__main__":
    main()
