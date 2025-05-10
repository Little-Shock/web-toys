#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
import shutil
import argparse

def read_site_config():
    """读取站点配置文件"""
    if os.path.exists('tools/site_config_simplified.json'):
        try:
            with open('tools/site_config_simplified.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取站点配置文件时出错: {e}")
            return None
    return None

def move_project(source_path, target_category):
    """将项目移动到新分类，并更新元数据"""
    if not os.path.isdir(source_path):
        print(f"错误: 源项目路径 '{source_path}' 不存在或不是目录")
        return False
    
    # 读取项目元数据
    json_path = os.path.join(source_path, "project.json")
    if not os.path.exists(json_path):
        print(f"错误: 项目 '{source_path}' 缺少 project.json 文件")
        return False
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
    except Exception as e:
        print(f"错误: 读取项目元数据时出错: {e}")
        return False
    
    # 获取项目名称
    project_dir = os.path.basename(source_path)
    
    # 创建目标路径
    target_path = os.path.join("projects", target_category, project_dir)
    
    # 检查目标路径是否已存在
    if os.path.exists(target_path):
        print(f"错误: 目标路径 '{target_path}' 已存在")
        return False
    
    # 更新项目元数据
    old_category = project_data.get("primary_category", "")
    project_data["primary_category"] = target_category
    
    # 如果旧分类不为空且不等于新分类，将其添加到次要分类中
    if old_category and old_category != target_category:
        secondary_categories = project_data.get("secondary_categories", [])
        if old_category not in secondary_categories:
            secondary_categories.append(old_category)
            project_data["secondary_categories"] = secondary_categories
    
    # 保存更新后的元数据
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"错误: 保存项目元数据时出错: {e}")
        return False
    
    # 移动项目文件
    try:
        # 创建目标目录
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        # 移动项目
        shutil.move(source_path, target_path)
        
        print(f"项目已成功移动到 '{target_path}'")
        print(f"项目元数据已更新，primary_category 从 '{old_category}' 更改为 '{target_category}'")
        return True
    except Exception as e:
        print(f"错误: 移动项目时出错: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='将项目移动到新分类')
    parser.add_argument('--source', required=True, help='源项目路径')
    parser.add_argument('--category', required=True, help='目标分类')
    
    args = parser.parse_args()
    
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，移动中止")
        sys.exit(1)
    
    # 验证分类是否有效
    valid_categories = [cat["id"] for cat in site_config.get("categories", [])]
    if args.category not in valid_categories:
        print(f"错误: 无效的分类 '{args.category}'")
        print(f"有效的分类: {', '.join(valid_categories)}")
        sys.exit(1)
    
    # 移动项目
    success = move_project(args.source, args.category)
    
    if success:
        print("\n接下来的步骤:")
        print("1. 运行 'python tools/generate_homepage_simplified.py' 更新主页")
        print("2. 在浏览器中打开index.html检查主页是否正确显示移动后的项目")
        sys.exit(0)
    else:
        print("项目移动失败")
        sys.exit(1)

if __name__ == "__main__":
    main()
