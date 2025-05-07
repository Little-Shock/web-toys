#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
import re
from datetime import datetime

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

def update_version(project_name, new_version, changes=None):
    """更新项目版本"""
    # 查找项目目录
    project_path = find_project_directory(project_name)
    if not project_path:
        print(f"找不到项目: {project_name}")
        return False
    
    # 加载项目配置
    config, config_path = load_project_config(project_path)
    if not config:
        return False
    
    # 获取当前日期
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 更新版本信息
    old_version = config.get("version", "0.1.0")
    config["version"] = new_version
    config["last_updated"] = today
    
    # 初始化更新日志
    if "changelog" not in config:
        config["changelog"] = []
    
    # 添加新的更新日志条目
    changelog_entry = {
        "version": new_version,
        "date": today,
        "changes": changes if changes else ["版本更新"]
    }
    
    # 将新的更新日志条目添加到列表开头
    config["changelog"].insert(0, changelog_entry)
    
    # 保存配置
    if save_project_config(config, config_path):
        print(f"项目 {project_name} 版本已从 {old_version} 更新到 {new_version}")
        return True
    return False

def update_service_worker_version(project_path, new_version):
    """更新Service Worker中的版本号"""
    # 查找Service Worker文件
    sw_paths = [
        os.path.join(project_path, "service-worker.js"),
        os.path.join(project_path, "js", "service-worker.js"),
        os.path.join(project_path, "sw.js")
    ]
    
    for sw_path in sw_paths:
        if os.path.exists(sw_path):
            try:
                with open(sw_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 查找并更新缓存名称中的版本号
                version_pattern = r"(const\s+CACHE_NAME\s*=\s*['\"])([^'\"]+)(['\"])"
                if re.search(version_pattern, content):
                    # 提取缓存名称前缀
                    match = re.search(version_pattern, content)
                    cache_prefix = re.sub(r"-v\d+(\.\d+)*$", "", match.group(2))
                    
                    # 更新缓存名称
                    new_cache_name = f"{cache_prefix}-v{new_version}"
                    updated_content = re.sub(version_pattern, r"\1" + new_cache_name + r"\3", content)
                    
                    # 保存更新后的文件
                    with open(sw_path, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                    
                    print(f"已更新Service Worker缓存版本: {sw_path}")
                    return True
            except Exception as e:
                print(f"更新Service Worker时出错: {e}")
    
    return False

def list_projects():
    """列出所有项目"""
    projects_root = "projects"
    
    if not os.path.exists(projects_root):
        print("找不到项目目录")
        return
    
    print("可用项目列表:")
    print("=" * 60)
    print(f"{'项目名称':<30} {'版本':<10} {'状态':<10} {'最后更新':<12}")
    print("-" * 60)
    
    # 遍历所有分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    # 读取项目配置
                    config, _ = load_project_config(project_path)
                    if config:
                        title = config.get("title", project_dir)
                        version = config.get("version", "未知")
                        status = config.get("status", "未知")
                        last_updated = config.get("last_updated", "未知")
                        
                        print(f"{title:<30} {version:<10} {status:<10} {last_updated:<12}")
    
    print("=" * 60)

def show_project_info(project_name):
    """显示项目详细信息"""
    # 查找项目目录
    project_path = find_project_directory(project_name)
    if not project_path:
        print(f"找不到项目: {project_name}")
        return
    
    # 加载项目配置
    config, _ = load_project_config(project_path)
    if not config:
        return
    
    print("\n项目详细信息:")
    print("=" * 60)
    print(f"名称: {config.get('title', project_name)}")
    print(f"描述: {config.get('description', '无描述')}")
    print(f"版本: {config.get('version', '未知')}")
    print(f"状态: {config.get('status', '未知')}")
    print(f"最后更新: {config.get('last_updated', '未知')}")
    print(f"分类: {config.get('category', '未分类')}")
    
    # 显示标签
    tags = config.get("tags", [])
    if tags:
        print(f"标签: {', '.join(tags)}")
    
    # 显示兼容性信息
    compatibility = config.get("compatibility", {})
    if compatibility:
        print("\n兼容性信息:")
        print(f"  移动设备: {'支持' if compatibility.get('mobile', False) else '不支持'}")
        print(f"  桌面设备: {'支持' if compatibility.get('desktop', False) else '不支持'}")
        print(f"  最小屏幕宽度: {compatibility.get('min_screen_width', '未知')}px")
        print(f"  性能影响: {compatibility.get('performance_impact', '未知')}")
    
    # 显示更新日志
    changelog = config.get("changelog", [])
    if changelog:
        print("\n更新日志:")
        for entry in changelog:
            print(f"  v{entry.get('version', '未知')} ({entry.get('date', '未知日期')})")
            for change in entry.get("changes", []):
                print(f"    - {change}")
    
    print("=" * 60)

def initialize_version_info(project_name):
    """初始化项目版本信息"""
    # 查找项目目录
    project_path = find_project_directory(project_name)
    if not project_path:
        print(f"找不到项目: {project_name}")
        return False
    
    # 加载项目配置
    config, config_path = load_project_config(project_path)
    if not config:
        return False
    
    # 获取当前日期
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 初始化版本信息
    if "version" not in config:
        config["version"] = "1.0.0"
    
    if "last_updated" not in config:
        config["last_updated"] = today
    
    # 初始化更新日志
    if "changelog" not in config:
        config["changelog"] = [{
            "version": config["version"],
            "date": config["last_updated"],
            "changes": ["初始版本"]
        }]
    
    # 初始化兼容性信息
    if "compatibility" not in config:
        config["compatibility"] = {
            "mobile": True,
            "desktop": True,
            "min_screen_width": 320,
            "performance_impact": "medium"
        }
    
    # 保存配置
    if save_project_config(config, config_path):
        print(f"已初始化项目 {project_name} 的版本信息")
        return True
    return False

def initialize_all_projects():
    """初始化所有项目的版本信息"""
    projects_root = "projects"
    
    if not os.path.exists(projects_root):
        print("找不到项目目录")
        return
    
    success_count = 0
    fail_count = 0
    
    # 遍历所有分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    # 读取项目配置
                    config, config_path = load_project_config(project_path)
                    if config:
                        # 检查是否需要初始化版本信息
                        needs_init = (
                            "version" not in config or
                            "last_updated" not in config or
                            "changelog" not in config or
                            "compatibility" not in config
                        )
                        
                        if needs_init:
                            print(f"初始化项目: {project_dir}")
                            if initialize_version_info(project_dir):
                                success_count += 1
                            else:
                                fail_count += 1
                        else:
                            print(f"项目已有版本信息: {project_dir}")
                            success_count += 1
    
    print(f"\n初始化完成! 成功: {success_count}, 失败: {fail_count}")

def print_usage():
    """打印使用说明"""
    print("项目版本管理工具")
    print("用法:")
    print("  python manage_versions.py list")
    print("    列出所有项目")
    print("  python manage_versions.py info <项目名称>")
    print("    显示项目详细信息")
    print("  python manage_versions.py update <项目名称> <新版本号> [<更新内容1> <更新内容2> ...]")
    print("    更新项目版本")
    print("  python manage_versions.py init <项目名称>")
    print("    初始化项目版本信息")
    print("  python manage_versions.py init-all")
    print("    初始化所有项目的版本信息")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "list":
        list_projects()
    
    elif command == "info" and len(sys.argv) >= 3:
        show_project_info(sys.argv[2])
    
    elif command == "update" and len(sys.argv) >= 4:
        project_name = sys.argv[2]
        new_version = sys.argv[3]
        changes = sys.argv[4:] if len(sys.argv) > 4 else None
        update_version(project_name, new_version, changes)
        
        # 更新Service Worker版本
        project_path = find_project_directory(project_name)
        if project_path:
            update_service_worker_version(project_path, new_version)
    
    elif command == "init" and len(sys.argv) >= 3:
        initialize_version_info(sys.argv[2])
    
    elif command == "init-all":
        initialize_all_projects()
    
    else:
        print_usage()
        sys.exit(1)
