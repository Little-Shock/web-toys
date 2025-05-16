#!/usr/bin/env python3
"""
应用导航修复脚本到所有项目文件

这个脚本会遍历所有项目文件夹，为每个项目的index.html文件添加back-link-fix-mobile.js脚本引用，
以修复移动端导航问题。
"""

import os
import re
import sys
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
PROJECTS_DIR = ROOT_DIR / "projects"

def find_all_html_files():
    """查找所有项目的HTML文件"""
    html_files = []
    for root, dirs, files in os.walk(PROJECTS_DIR):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    return html_files

def add_back_link_fix_script(html_file):
    """添加返回链接修复脚本"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查是否已经包含了脚本
        if 'back-link-fix-mobile.js' in content:
            print(f"文件 {html_file} 已包含返回链接修复脚本")
            return False

        # 计算相对路径
        rel_path = os.path.relpath(ROOT_DIR / "js", os.path.dirname(html_file))
        script_path = os.path.join(rel_path, "back-link-fix-mobile.js").replace("\\", "/")

        # 添加脚本引用
        if '</body>' in content:
            new_content = content.replace('</body>', f'    <script src="{script_path}"></script>\n</body>')

            # 写回文件
            try:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"已添加返回链接修复脚本到 {html_file}")
                return True
            except PermissionError:
                print(f"无法写入文件 {html_file}，权限被拒绝")
                return False
        else:
            print(f"文件 {html_file} 中未找到 </body> 标签")
            return False
    except Exception as e:
        print(f"处理文件 {html_file} 时出错: {e}")
        return False

def remove_embedded_fix_function(html_file):
    """移除嵌入式的fixBackLink函数"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 查找嵌入式的fixBackLink函数
        pattern = r'function\s+fixBackLink\s*\(\)\s*\{[^}]*\}'
        match = re.search(pattern, content)

        if match:
            # 替换为注释
            new_content = content.replace(match.group(0), '// 返回链接修复已移至外部脚本')

            # 写回文件
            try:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"已移除嵌入式fixBackLink函数从 {html_file}")
                return True
            except PermissionError:
                print(f"无法写入文件 {html_file}，权限被拒绝")
                return False
        else:
            return False
    except Exception as e:
        print(f"处理文件 {html_file} 时出错: {e}")
        return False

def main():
    """主函数"""
    html_files = find_all_html_files()

    # 过滤掉备份文件
    filtered_html_files = [f for f in html_files if 'backup' not in f.lower()]

    print(f"找到 {len(html_files)} 个HTML文件，过滤后剩余 {len(filtered_html_files)} 个")

    modified_count = 0
    for html_file in filtered_html_files:
        if add_back_link_fix_script(html_file):
            modified_count += 1
        remove_embedded_fix_function(html_file)

    print(f"已修改 {modified_count} 个文件")

if __name__ == "__main__":
    main()
