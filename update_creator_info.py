#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json

def find_all_project_json_files():
    """查找所有project.json文件"""
    project_files = []
    for root, dirs, files in os.walk('projects'):
        if 'project.json' in files:
            project_files.append(os.path.join(root, 'project.json'))
    return project_files

def update_author_info(file_path):
    """更新单个project.json文件的作者信息"""
    try:
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 检查是否已有author字段
        if 'author' not in data:
            # 如果没有author字段，创建一个新的
            data['author'] = {
                "name": "Little Shock Team",
                "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
                "creator": "Little-Shock",
                "contributors": []
            }
        else:
            # 如果已有author字段，更新creator和contributors
            data['author']['creator'] = "Little-Shock"
            data['author']['contributors'] = []
        
        # 保存更新后的文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"已更新作者信息: {file_path}")
        return True
    except Exception as e:
        print(f"更新 {file_path} 时出错: {e}")
        return False

def update_readme_with_author_info(project_dir):
    """更新README.md文件中的作者信息"""
    readme_path = os.path.join(project_dir, 'README.md')
    if not os.path.exists(readme_path):
        print(f"README文件不存在: {readme_path}")
        return False
    
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找作者信息部分
        author_section_start = content.find("## 作者信息")
        if author_section_start == -1:
            print(f"README文件中没有作者信息部分: {readme_path}")
            return False
        
        # 查找作者信息部分的结束位置
        next_section_start = content.find("##", author_section_start + 10)
        if next_section_start == -1:
            # 如果没有下一个部分，则作者信息部分到文件结束
            author_section = content[author_section_start:]
            next_section_start = len(content)
        else:
            author_section = content[author_section_start:next_section_start]
        
        # 创建新的作者信息部分
        new_author_section = """## 作者信息

- **开发团队**: Little Shock Team
- **主要创建者**: Little-Shock
- **联系方式**: [团队Wiki](https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd)
"""
        
        # 替换作者信息部分
        new_content = content[:author_section_start] + new_author_section + content[next_section_start:]
        
        # 保存更新后的README
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"已更新README文件中的作者信息: {readme_path}")
        return True
    except Exception as e:
        print(f"更新README文件时出错: {e}")
        return False

def main():
    """主函数"""
    # 查找所有project.json文件
    project_files = find_all_project_json_files()
    print(f"找到 {len(project_files)} 个项目文件")
    
    # 更新每个文件的作者信息
    success_count = 0
    fail_count = 0
    
    for file_path in project_files:
        if update_author_info(file_path):
            # 更新对应的README文件
            project_dir = os.path.dirname(file_path)
            update_readme_with_author_info(project_dir)
            
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n更新完成! 成功: {success_count}, 失败: {fail_count}")

if __name__ == "__main__":
    main()
