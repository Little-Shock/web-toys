#!/usr/bin/env python3
"""
应用导航修复

这个脚本会：
1. 确保js目录存在
2. 复制导航修复脚本到js目录
3. 修改主页，添加导航修复脚本
4. 修改所有项目页面，添加返回链接修复脚本
5. 修改所有项目页面中的返回链接，使用绝对路径
"""

import os
import re
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
PROJECTS_DIR = ROOT_DIR / "projects"
JS_DIR = ROOT_DIR / "js"

def ensure_js_dir():
    """确保js目录存在"""
    JS_DIR.mkdir(exist_ok=True)
    print(f"已确保js目录存在: {JS_DIR}")

def add_script_to_html(html_file, script_path, script_name):
    """向HTML文件添加脚本引用"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经包含了脚本
    if script_name in content:
        print(f"文件 {html_file} 已包含 {script_name} 脚本")
        return False
    
    # 在</body>标签前添加脚本引用
    script_tag = f'<script src="{script_path}"></script>\n</body>'
    modified_content = content.replace('</body>', script_tag)
    
    # 如果内容没有变化，可能是HTML结构不同
    if modified_content == content:
        # 尝试在</html>标签前添加
        script_tag = f'<script src="{script_path}"></script>\n</html>'
        modified_content = content.replace('</html>', script_tag)
        
        # 如果仍然没有变化，可能需要手动处理
        if modified_content == content:
            print(f"无法修改文件 {html_file}，请手动添加脚本")
            return False
    
    # 写回文件
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    print(f"已向 {html_file} 添加 {script_name} 脚本")
    return True

def fix_back_link(html_file):
    """修复返回链接，使用绝对路径"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找返回链接
    back_link_pattern = r'<a\s+href="[^"]*"\s+class="back-link"[^>]*>返回主菜单</a>'
    back_link_match = re.search(back_link_pattern, content)
    
    if not back_link_match:
        print(f"文件 {html_file} 中未找到返回链接")
        return False
    
    # 替换为绝对路径
    new_back_link = '<a href="/" class="back-link" id="backToHome">返回主菜单</a>'
    modified_content = content.replace(back_link_match.group(0), new_back_link)
    
    # 如果内容没有变化，可能是正则表达式匹配有问题
    if modified_content == content:
        print(f"无法修改文件 {html_file} 中的返回链接，请手动修改")
        return False
    
    # 写回文件
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    print(f"已修复 {html_file} 中的返回链接")
    return True

def process_all_projects():
    """处理所有项目目录"""
    # 确保js目录存在
    ensure_js_dir()
    
    # 统计
    total_files = 0
    modified_files = 0
    back_link_fixed = 0
    
    # 遍历所有项目目录
    for category_dir in PROJECTS_DIR.iterdir():
        if not category_dir.is_dir():
            continue
        
        for project_dir in category_dir.iterdir():
            if not project_dir.is_dir():
                continue
            
            # 查找index.html文件
            index_file = project_dir / "index.html"
            if index_file.exists():
                total_files += 1
                
                # 添加返回链接修复脚本
                if add_script_to_html(index_file, "../../js/back-link-fix.js", "back-link-fix.js"):
                    modified_files += 1
                
                # 修复返回链接
                if fix_back_link(index_file):
                    back_link_fixed += 1
    
    print(f"\n处理完成！共处理 {total_files} 个文件，添加脚本 {modified_files} 个，修复返回链接 {back_link_fixed} 个")

def add_script_to_homepage():
    """向主页添加导航修复脚本"""
    index_file = ROOT_DIR / "index.html"
    if not index_file.exists():
        print("错误：找不到主页文件")
        return False
    
    return add_script_to_html(index_file, "js/navigation-fix.js", "navigation-fix.js")

if __name__ == "__main__":
    # 向主页添加导航修复脚本
    add_script_to_homepage()
    
    # 处理所有项目页面
    process_all_projects()
