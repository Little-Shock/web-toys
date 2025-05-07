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

def list_categories():
    """列出所有分类"""
    config = load_site_config()
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
    config = load_site_config()
    if not config:
        return
    
    categories = {cat["id"]: cat["name"] for cat in config.get("categories", [])}
    assignments = config.get("category_assignments", {})
    
    # 按分类组织项目
    projects_by_category = defaultdict(list)
    for project, category_id in assignments.items():
        projects_by_category[category_id].append(project)
    
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
    config = load_site_config()
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

def get_all_projects():
    """获取所有项目目录"""
    projects_root = "projects"
    all_projects = []
    
    # 检查projects目录是否存在
    if not os.path.exists(projects_root):
        print(f"错误: 找不到项目根目录 '{projects_root}'")
        return all_projects
    
    # 遍历所有分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    all_projects.append(project_dir)
    
    return all_projects

def assign_project():
    """分配项目到分类"""
    config = load_site_config()
    if not config:
        return
    
    print("\n分配项目到分类:")
    print("=" * 60)
    
    # 列出所有分类
    categories = config.get("categories", [])
    print("\n可用分类:")
    for i, cat in enumerate(categories):
        print(f"{i+1}. {cat.get('name')} ({cat.get('id')})")
    
    try:
        cat_index = int(input("\n选择分类 (输入序号): ").strip()) - 1
        if cat_index < 0 or cat_index >= len(categories):
            print("无效的分类序号")
            return
    except ValueError:
        print("请输入有效的序号")
        return
    
    category = categories[cat_index]
    category_id = category.get("id")
    
    # 获取所有项目
    all_projects = get_all_projects()
    
    # 过滤掉已分配到当前分类的项目
    assignments = config.get("category_assignments", {})
    assigned_projects = [p for p, c in assignments.items() if c == category_id]
    unassigned_projects = [p for p in all_projects if p not in assigned_projects]
    
    if not unassigned_projects:
        print(f"\n没有未分配到 '{category.get('name')}' 的项目")
        return
    
    print(f"\n未分配到 '{category.get('name')}' 的项目:")
    for i, project in enumerate(unassigned_projects):
        print(f"{i+1}. {project}")
    
    try:
        project_indices = input("\n选择要分配的项目 (输入序号，多个序号用逗号分隔): ").strip()
        indices = [int(idx.strip()) - 1 for idx in project_indices.split(",")]
        
        for idx in indices:
            if idx < 0 or idx >= len(unassigned_projects):
                print(f"无效的项目序号: {idx+1}")
                continue
            
            project = unassigned_projects[idx]
            config["category_assignments"][project] = category_id
            print(f"项目 '{project}' 已分配到 '{category.get('name')}'")
            
            # 移动项目到对应的分类目录
            source_dir = find_project_directory(project)
            if source_dir:
                target_dir = os.path.join("projects", category_id, project)
                if source_dir != target_dir:
                    try:
                        # 确保目标目录存在
                        os.makedirs(os.path.dirname(target_dir), exist_ok=True)
                        # 如果目标已存在，先删除
                        if os.path.exists(target_dir):
                            import shutil
                            shutil.rmtree(target_dir)
                        # 移动目录
                        import shutil
                        shutil.move(source_dir, target_dir)
                        print(f"已将项目从 {source_dir} 移动到 {target_dir}")
                    except Exception as e:
                        print(f"移动项目时出错: {e}")
    except ValueError:
        print("请输入有效的序号")
        return
    
    # 保存配置
    save_site_config(config)

def find_project_directory(project_name):
    """查找项目目录的完整路径"""
    projects_root = "projects"
    
    # 检查projects目录是否存在
    if not os.path.exists(projects_root):
        return None
    
    # 遍历所有分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            project_path = os.path.join(category_path, project_name)
            if os.path.exists(project_path) and os.path.isdir(project_path):
                return project_path
    
    # 如果在projects目录中找不到，检查根目录
    if os.path.exists(project_name) and os.path.isdir(project_name):
        return project_name
    
    return None

def reassign_project():
    """重新分配项目到不同分类"""
    config = load_site_config()
    if not config:
        return
    
    print("\n重新分配项目:")
    print("=" * 60)
    
    # 列出所有已分配的项目
    assignments = config.get("category_assignments", {})
    if not assignments:
        print("没有已分配的项目")
        return
    
    projects = list(assignments.keys())
    categories = {cat["id"]: cat["name"] for cat in config.get("categories", [])}
    
    print("\n当前项目分配:")
    for i, project in enumerate(projects):
        category_id = assignments[project]
        category_name = categories.get(category_id, category_id)
        print(f"{i+1}. {project} -> {category_name} ({category_id})")
    
    try:
        project_index = int(input("\n选择要重新分配的项目 (输入序号): ").strip()) - 1
        if project_index < 0 or project_index >= len(projects):
            print("无效的项目序号")
            return
    except ValueError:
        print("请输入有效的序号")
        return
    
    project = projects[project_index]
    current_category_id = assignments[project]
    
    # 列出所有分类
    all_categories = config.get("categories", [])
    print("\n可用分类:")
    for i, cat in enumerate(all_categories):
        marker = " (当前)" if cat.get("id") == current_category_id else ""
        print(f"{i+1}. {cat.get('name')} ({cat.get('id')}){marker}")
    
    try:
        cat_index = int(input("\n选择新分类 (输入序号): ").strip()) - 1
        if cat_index < 0 or cat_index >= len(all_categories):
            print("无效的分类序号")
            return
    except ValueError:
        print("请输入有效的序号")
        return
    
    new_category = all_categories[cat_index]
    new_category_id = new_category.get("id")
    
    if new_category_id == current_category_id:
        print("项目已经在该分类中")
        return
    
    # 更新分配
    config["category_assignments"][project] = new_category_id
    
    # 移动项目到新的分类目录
    source_dir = find_project_directory(project)
    if source_dir:
        target_dir = os.path.join("projects", new_category_id, project)
        if source_dir != target_dir:
            try:
                # 确保目标目录存在
                os.makedirs(os.path.dirname(target_dir), exist_ok=True)
                # 如果目标已存在，先删除
                if os.path.exists(target_dir):
                    import shutil
                    shutil.rmtree(target_dir)
                # 移动目录
                import shutil
                shutil.move(source_dir, target_dir)
                print(f"已将项目从 {source_dir} 移动到 {target_dir}")
            except Exception as e:
                print(f"移动项目时出错: {e}")
    
    # 保存配置
    if save_site_config(config):
        print(f"项目 '{project}' 已从 '{categories.get(current_category_id)}' 重新分配到 '{new_category.get('name')}'")

def generate_homepage():
    """生成主页"""
    print("\n生成主页...")
    
    # 检查generate_homepage.py的位置
    if os.path.exists('tools/generate_homepage.py'):
        os.system("python tools/generate_homepage.py")
    elif os.path.exists('generate_homepage.py'):
        os.system("python generate_homepage.py")
    else:
        print("错误: 找不到主页生成脚本")

def show_menu():
    """显示菜单"""
    print("\n网页玩具分类管理工具")
    print("=" * 60)
    print("1. 列出所有分类")
    print("2. 按分类列出项目")
    print("3. 添加新分类")
    print("4. 分配项目到分类")
    print("5. 重新分配项目")
    print("6. 生成主页")
    print("0. 退出")
    print("=" * 60)
    
    choice = input("请选择操作 (0-6): ").strip()
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
            assign_project()
        elif choice == "5":
            reassign_project()
        elif choice == "6":
            generate_homepage()
        elif choice == "0":
            print("\n再见！")
            break
        else:
            print("\n无效的选择，请重试")
        
        input("\n按回车键继续...")

if __name__ == "__main__":
    main()
