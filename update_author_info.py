#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import random

# 可能的创建者名字列表（示例名字，实际使用时应替换为真实名字）
CREATORS = [
    "王小明", "李小华", "张小强", "刘小红", "陈小军", 
    "赵小燕", "杨小勇", "周小梅", "吴小龙", "郑小云"
]

# 可能的贡献者名字列表（示例名字，实际使用时应替换为真实名字）
CONTRIBUTORS = [
    "马小飞", "林小玲", "朱小伟", "孙小艳", "胡小杰",
    "高小婷", "谢小涛", "何小琳", "罗小峰", "郭小静",
    "梁小浩", "宋小娟", "唐小刚", "许小芳", "韩小磊",
    "冯小娜", "董小健", "萧小莉", "曹小鹏", "袁小倩"
]

def find_all_project_json_files():
    """查找所有project.json文件"""
    project_files = []
    for root, dirs, files in os.walk('projects'):
        if 'project.json' in files:
            project_files.append(os.path.join(root, 'project.json'))
    return project_files

def generate_random_creator():
    """生成随机创建者"""
    return random.choice(CREATORS)

def generate_random_contributors(count=2, exclude=None):
    """生成随机贡献者列表"""
    available_contributors = [c for c in CONTRIBUTORS if c != exclude]
    return random.sample(available_contributors, min(count, len(available_contributors)))

def update_author_info(file_path):
    """更新单个project.json文件的作者信息"""
    try:
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 检查是否已有author字段
        if 'author' not in data:
            # 如果没有author字段，创建一个新的
            creator = generate_random_creator()
            contributors = generate_random_contributors(2)
            data['author'] = {
                "name": "Little Shock Team",
                "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
                "creator": creator,
                "contributors": contributors
            }
        else:
            # 如果已有author字段，检查是否有creator和contributors
            if 'creator' not in data['author'] or not data['author']['creator']:
                data['author']['creator'] = generate_random_creator()
            
            if 'contributors' not in data['author'] or not data['author']['contributors']:
                # 确保贡献者不包括创建者
                data['author']['contributors'] = generate_random_contributors(2, data['author']['creator'])
        
        # 保存更新后的文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"已更新作者信息: {file_path}")
        return True
    except Exception as e:
        print(f"更新 {file_path} 时出错: {e}")
        return False

def update_readme_with_author_info(project_dir, author_info):
    """更新README.md文件，添加作者信息"""
    readme_path = os.path.join(project_dir, 'README.md')
    if not os.path.exists(readme_path):
        print(f"README文件不存在: {readme_path}")
        return False
    
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否已有作者信息部分
        if "## 作者信息" not in content:
            # 如果没有作者信息部分，添加一个
            author_section = f"""
## 作者信息

- **开发团队**: {author_info.get('name', 'Little Shock Team')}
- **主要创建者**: {author_info.get('creator', '')}
- **贡献者**: {', '.join(author_info.get('contributors', []))}
- **联系方式**: [团队Wiki]({author_info.get('contact', 'https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd')})
"""
            
            # 在未来计划部分之前插入作者信息
            if "## 未来计划" in content:
                content = content.replace("## 未来计划", f"{author_section}## 未来计划")
            elif "## 许可证" in content:
                content = content.replace("## 许可证", f"{author_section}## 许可证")
            else:
                content += f"\n{author_section}"
            
            # 保存更新后的README
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"已更新README文件: {readme_path}")
            return True
        else:
            # 如果已有作者信息部分，更新它
            # 这部分比较复杂，需要正则表达式，暂时不实现
            print(f"README文件已有作者信息部分，跳过更新: {readme_path}")
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
            # 读取更新后的作者信息
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'author' in data:
                        # 更新对应的README文件
                        project_dir = os.path.dirname(file_path)
                        update_readme_with_author_info(project_dir, data['author'])
            except Exception as e:
                print(f"读取更新后的作者信息时出错: {e}")
            
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n更新完成! 成功: {success_count}, 失败: {fail_count}")

if __name__ == "__main__":
    main()
