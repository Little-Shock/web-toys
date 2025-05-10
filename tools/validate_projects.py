#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys

def validate_projects():
    """验证所有项目的元数据和文件结构"""
    projects_root = "projects"
    issues_found = False
    
    # 检查项目根目录是否存在
    if not os.path.exists(projects_root):
        print(f"错误: 项目根目录 '{projects_root}' 不存在")
        return False
    
    # 遍历所有分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if not os.path.isdir(category_path):
            continue
        
        # 遍历分类下的所有项目
        for project_dir in os.listdir(category_path):
            project_path = os.path.join(category_path, project_dir)
            if not os.path.isdir(project_path):
                continue
            
            # 检查项目是否有index.html文件
            index_path = os.path.join(project_path, "index.html")
            if not os.path.exists(index_path):
                print(f"警告: 项目 '{project_path}' 缺少 index.html 文件")
                issues_found = True
            
            # 检查项目是否有project.json文件
            json_path = os.path.join(project_path, "project.json")
            if not os.path.exists(json_path):
                print(f"警告: 项目 '{project_path}' 缺少 project.json 文件")
                issues_found = True
                continue
            
            # 验证project.json文件内容
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    project_data = json.load(f)
                
                # 检查必要字段
                required_fields = ["title", "description", "status", "primary_category"]
                for field in required_fields:
                    if field not in project_data:
                        print(f"警告: 项目 '{project_path}' 的 project.json 缺少必要字段 '{field}'")
                        issues_found = True
                
                # 检查primary_category是否与实际目录匹配
                primary_category = project_data.get("primary_category")
                if primary_category and primary_category != category_dir:
                    print(f"警告: 项目 '{project_path}' 的 primary_category '{primary_category}' 与实际目录 '{category_dir}' 不匹配")
                    issues_found = True
                
                # 检查版本信息
                if "version" not in project_data:
                    print(f"警告: 项目 '{project_path}' 缺少版本信息")
                    issues_found = True
                
                # 检查作者信息
                if "author" not in project_data:
                    print(f"警告: 项目 '{project_path}' 缺少作者信息")
                    issues_found = True
                elif "creator" not in project_data["author"]:
                    print(f"警告: 项目 '{project_path}' 的作者信息缺少创建者字段")
                    issues_found = True
                
            except json.JSONDecodeError:
                print(f"错误: 项目 '{project_path}' 的 project.json 文件格式无效")
                issues_found = True
            except Exception as e:
                print(f"错误: 读取项目 '{project_path}' 的 project.json 时出错: {e}")
                issues_found = True
    
    if not issues_found:
        print("验证完成: 所有项目元数据和文件结构都符合要求")
        return True
    else:
        print("验证完成: 发现一些问题，请修复后重新运行主页生成脚本")
        return False

if __name__ == "__main__":
    success = validate_projects()
    sys.exit(0 if success else 1)
