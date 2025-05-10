#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
冗余脚本检查工具

这个脚本用于检查tools目录中的冗余脚本，并提供合并或删除建议。

用法:
  python tools/check_redundant_scripts.py [选项]

选项:
  --verbose         显示详细信息
  --help            显示帮助信息并退出
"""

import os
import sys
import argparse
from pathlib import Path
import re

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
TOOLS_DIR = ROOT_DIR / "tools"

# 已知的冗余脚本组
REDUNDANT_GROUPS = [
    {
        "name": "项目创建工具",
        "scripts": ["create_project.py", "create_project_template.py"],
        "replacement": "create_project_unified.py",
        "reason": "这两个脚本功能重叠，都用于创建新项目，但使用不同的模板和方法。"
    },
    {
        "name": "导航修复工具",
        "scripts": ["add_back_link_fix.py", "apply_navigation_fix.py"],
        "replacement": "fix_navigation.py",
        "reason": "这两个脚本功能重叠，都用于修复导航问题，但处理不同的方面。"
    },
    {
        "name": "主页生成工具",
        "scripts": ["generate_homepage_with_tags.py"],
        "replacement": "generate_homepage_simplified.py",
        "reason": "generate_homepage_with_tags.py 可能是旧版本或未完成的实现，现在主要使用 generate_homepage_simplified.py。"
    }
]

# 开发过程文档目录
DEV_PROCESS_DIR = TOOLS_DIR / "开发过程"

def check_script_exists(script_name):
    """检查脚本是否存在"""
    script_path = TOOLS_DIR / script_name
    return script_path.exists()

def check_redundant_scripts(verbose=False):
    """检查冗余脚本"""
    print("检查冗余脚本...")
    
    found_redundant = False
    
    # 检查已知的冗余脚本组
    for group in REDUNDANT_GROUPS:
        existing_scripts = []
        for script in group["scripts"]:
            if check_script_exists(script):
                existing_scripts.append(script)
        
        if existing_scripts:
            found_redundant = True
            print(f"\n发现冗余脚本组: {group['name']}")
            print(f"  存在的脚本: {', '.join(existing_scripts)}")
            print(f"  建议替换为: {group['replacement']}")
            if verbose:
                print(f"  原因: {group['reason']}")
    
    # 检查开发过程文档
    if DEV_PROCESS_DIR.exists() and DEV_PROCESS_DIR.is_dir():
        print("\n发现开发过程文档目录:")
        print(f"  {DEV_PROCESS_DIR}")
        print("  建议: 考虑将项目特定的开发文档移动到相应的项目目录中")
        found_redundant = True
    
    if not found_redundant:
        print("未发现冗余脚本。")
    
    return found_redundant

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='检查tools目录中的冗余脚本')
    parser.add_argument('--verbose', action='store_true', help='显示详细信息')
    
    args = parser.parse_args()
    
    # 检查冗余脚本
    found_redundant = check_redundant_scripts(args.verbose)
    
    # 提供建议
    if found_redundant:
        print("\n建议:")
        print("1. 使用新的统一脚本替换冗余脚本")
        print("2. 在README中标记旧脚本为不推荐使用")
        print("3. 考虑将项目特定的开发文档移动到相应的项目目录中")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
