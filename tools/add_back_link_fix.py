#!/usr/bin/env python3
"""
为所有项目页面添加返回链接修复脚本

这个脚本会遍历所有项目目录，找到每个项目的index.html文件，
然后在其中添加返回链接修复脚本的引用。
"""

import os
import re
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
PROJECTS_DIR = ROOT_DIR / "projects"
SCRIPT_PATH = "../../js/back-link-fix.js"

def add_script_to_html(html_file):
    """向HTML文件添加脚本引用"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经包含了脚本
    if "back-link-fix.js" in content:
        print(f"文件 {html_file} 已包含返回链接修复脚本")
        return False
    
    # 在</body>标签前添加脚本引用
    script_tag = f'<script src="{SCRIPT_PATH}"></script>\n</body>'
    modified_content = content.replace('</body>', script_tag)
    
    # 如果内容没有变化，可能是HTML结构不同
    if modified_content == content:
        # 尝试在</html>标签前添加
        script_tag = f'<script src="{SCRIPT_PATH}"></script>\n</html>'
        modified_content = content.replace('</html>', script_tag)
        
        # 如果仍然没有变化，可能需要手动处理
        if modified_content == content:
            print(f"无法修改文件 {html_file}，请手动添加脚本")
            return False
    
    # 写回文件
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    print(f"已向 {html_file} 添加返回链接修复脚本")
    return True

def process_all_projects():
    """处理所有项目目录"""
    # 确保js目录存在
    js_dir = ROOT_DIR / "js"
    js_dir.mkdir(exist_ok=True)
    
    # 复制返回链接修复脚本到js目录
    script_file = js_dir / "back-link-fix.js"
    if not script_file.exists():
        print("错误：找不到返回链接修复脚本文件")
        return
    
    # 统计
    total_files = 0
    modified_files = 0
    
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
                if add_script_to_html(index_file):
                    modified_files += 1
    
    print(f"\n处理完成！共处理 {total_files} 个文件，修改了 {modified_files} 个文件")

if __name__ == "__main__":
    process_all_projects()
