#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from collections import defaultdict

# 导入工具模块
from utils import (
    read_site_config, save_site_config, load_project_config, 
    save_project_config, find_all_projects
)

def list_categories():
    """列出所有分类"""
    config = read_site_config()
    if not config:
        return
    
    categories = config.get("categories", [])
    print("\n当前分类列表:")
    print("=" * 60)
    print(f"{'ID':<20} {'名称':<15} {'顺序':<5} {'描述'}")
    print("-" * 60)
    
    for cat in sorted(categories, key=lambda x: x.get("order", 999)):
        print(f"{cat.get('id', ''):<20} {cat.get('name', ''):<15} {cat.get('order', ''):<5} {cat.get('description', '')[:40]}")
    
    print("=" * 60)

def list_projects_by_category():
    """按分类列出项目"""
    config = read_site_config()
    if not config:
        return
    
    categories = {cat["id"]: cat["name"] for cat in config.get("categories", [])}
    
    # 获取所有项目
    projects = find_all_projects()
    
    # 按分类组织项目
    projects_by_category = defaultdict(list)
    for project in projects:
        config, _ = load_project_config(project["path"])
        if config:
            primary_category = config.get("primary_category", project["category_dir"])
            projects_by_category[primary_category].append(project["name"])
    
    print("\n按分类列出项目:")
    print("=" * 60)
    
    for category_id, projects in sorted(projects_by_category.items()):
        category_name = categories.get(category_id, category_id)
        print(f"\n{category_name} ({category_id}):")
        print("-" * 60)
        
        for project in sorted(projects):
            print(f"  - {project}")
    
    print("\n=" * 60)

def add_category():
    """添加新分类"""
    config = read_site_config()
    if not config:
        return
    
    print("\n添加新分类:")
    print("=" * 60)
    
    category_id = input("分类ID (例如: new-category): ").strip()
    if not category_id:
        print("分类ID不能为空")
        return
    
    # 检查ID是否已存在
    for cat in config.get("categories", []):
        if cat.get("id") == category_id:
            print(f"分类ID '{category_id}' 已存在")
            return
    
    name = input("分类名称 (例如: 新分类): ").strip()
    if not name:
        print("分类名称不能为空")
        return
    
    description = input("分类描述: ").strip()
    
    try:
        order = int(input("显示顺序 (数字): ").strip())
    except ValueError:
        print("显示顺序必须是数字")
        return
    
    icon = input("分类图标 (可选): ").strip()
    
    # 创建新分类
    new_category = {
        "id": category_id,
        "name": name,
        "description": description,
        "order": order
    }
    
    if icon:
        new_category["icon"] = icon
    
    # 添加到配置
    if "categories" not in config:
        config["categories"] = []
    config["categories"].append(new_category)
    
    # 保存配置
    if save_site_config(config):
        print(f"分类 '{name}' 已添加")
        
        # 创建对应的目录
        projects_dir = "projects"
        category_dir = os.path.join(projects_dir, category_id)
        if not os.path.exists(category_dir):
            try:
                os.makedirs(category_dir)
                print(f"已创建目录: {category_dir}")
            except Exception as e:
                print(f"创建目录时出错: {e}")

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

def collect_all_tags():
    """收集所有标签"""
    tags = defaultdict(int)
    
    # 查找所有项目
    projects = find_all_projects()
    
    # 收集标签
    for project in projects:
        config, _ = load_project_config(project["path"])
        if not config:
            continue
        
        # 获取标签
        project_tags = config.get("tags", [])
        for tag in project_tags:
            tags[tag] += 1
    
    # 按使用频率排序
    sorted_tags = sorted(tags.items(), key=lambda x: x[1], reverse=True)
    
    return sorted_tags

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
        config, config_path = load_project_config(project["path"])
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
            if save_project_config(config, config_path):
                updated_count += 1
    
    print(f"\n已更新 {updated_count} 个项目的标签")

def update_site_config_for_tags():
    """更新站点配置以支持标签系统"""
    # 加载站点配置
    site_config = read_site_config()
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

def generate_homepage():
    """生成主页"""
    print("\n生成主页...")
    
    # 检查generate_homepage_simplified.py的位置
    if os.path.exists('tools/generate_homepage_simplified.py'):
        os.system("python tools/generate_homepage_simplified.py")
    elif os.path.exists('generate_homepage_simplified.py'):
        os.system("python generate_homepage_simplified.py")
    else:
        print("错误: 找不到主页生成脚本")

def show_menu():
    """显示菜单"""
    print("\n网页玩具元数据管理工具")
    print("=" * 60)
    print("1. 列出所有分类")
    print("2. 按分类列出项目")
    print("3. 添加新分类")
    print("4. 显示标签统计")
    print("5. 标准化标签")
    print("6. 更新站点配置以支持标签系统")
    print("7. 生成主页")
    print("0. 退出")
    print("=" * 60)
    
    choice = input("请选择操作 (0-7): ").strip()
    return choice

def main():
    """主函数"""
    while True:
        choice = show_menu()
        
        if choice == "1":
            list_categories()
        elif choice == "2":
            list_projects_by_category()
        elif choice == "3":
            add_category()
        elif choice == "4":
            show_tag_statistics()
        elif choice == "5":
            standardize_tags()
        elif choice == "6":
            update_site_config_for_tags()
        elif choice == "7":
            generate_homepage()
        elif choice == "0":
            print("\n再见！")
            break
        else:
            print("\n无效的选择，请重试")
        
        input("\n按回车键继续...")

if __name__ == "__main__":
    main()
