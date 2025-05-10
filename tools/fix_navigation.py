#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导航修复工具

这个脚本合并了add_back_link_fix.py和apply_navigation_fix.py的功能，
用于修复项目页面中的导航问题，特别是在移动端浏览器中的返回链接问题。

功能:
1. 确保js目录存在
2. 创建或更新导航修复脚本
3. 修改主页，添加导航修复脚本
4. 修改所有项目页面，添加返回链接修复脚本
5. 修改所有项目页面中的返回链接，使用绝对路径

用法:
  python tools/fix_navigation.py [选项]

选项:
  --homepage-only    只修复主页导航
  --projects-only    只修复项目页面导航
  --check            只检查问题，不进行修复
  --verbose          显示详细输出
  --help             显示帮助信息并退出
"""

import os
import re
import sys
import argparse
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
PROJECTS_DIR = ROOT_DIR / "projects"
JS_DIR = ROOT_DIR / "js"

# 导航修复脚本内容
NAVIGATION_FIX_JS = """/**
 * 修复移动端浏览器返回主页后无法再次点击链接的问题
 *
 * 问题原因：
 * 在移动端浏览器中，当用户从项目页面点击"返回主菜单"链接回到主页后，
 * 再次点击项目链接可能无法正常导航，需要重新加载整个网站。
 * 这通常是由于浏览器历史记录和相对路径处理的问题。
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查URL参数，如果有时间戳参数，说明是从项目页面返回的
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('t')) {
        // 清除URL参数，但不刷新页面
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 修复所有项目链接
    fixProjectLinks();
});

/**
 * 修复所有项目链接，确保它们使用绝对路径
 */
function fixProjectLinks() {
    // 获取所有项目链接
    const projectLinks = document.querySelectorAll('.toy-link');

    projectLinks.forEach(link => {
        // 获取原始href
        const originalHref = link.getAttribute('href');

        // 构建绝对URL
        const absoluteUrl = new URL(originalHref, window.location.origin + '/').href;

        // 修改链接的href属性为绝对路径
        link.setAttribute('href', absoluteUrl);

        // 添加点击事件处理，确保链接正常工作
        link.addEventListener('click', function(e) {
            // 不阻止默认行为，让浏览器正常导航
            // 但记录一个标记到sessionStorage，表示这是一个正常的导航
            sessionStorage.setItem('navigatingToProject', 'true');
        });
    });
}
"""

# 返回链接修复脚本内容
BACK_LINK_FIX_JS = """/**
 * 修复项目页面中的返回链接
 *
 * 问题原因：
 * 在移动端浏览器中，使用相对路径的返回链接（如 "../index.html"）可能导致
 * 用户返回主页后无法再次点击项目链接。这个脚本将返回链接修改为绝对路径。
 */

document.addEventListener('DOMContentLoaded', function() {
    // 修复返回链接
    fixBackLink();
});

/**
 * 修复返回主菜单的链接
 */
function fixBackLink() {
    // 获取返回链接元素
    const backLink = document.querySelector('.back-link');

    if (!backLink) {
        console.log('未找到返回链接');
        return;
    }

    // 获取原始href
    const originalHref = backLink.getAttribute('href');

    // 构建绝对URL - 无论原始链接是什么，都使用根路径
    const absoluteUrl = window.location.origin + '/';

    // 修改返回链接的href属性
    backLink.setAttribute('href', absoluteUrl);

    // 添加点击事件处理
    backLink.addEventListener('click', function(e) {
        // 阻止默认行为
        e.preventDefault();

        // 在URL中添加一个时间戳参数，确保主页刷新
        const timestamp = new Date().getTime();
        const urlWithTimestamp = absoluteUrl + '?t=' + timestamp;

        // 使用绝对URL导航
        window.location.href = urlWithTimestamp;
    });
}
"""

def ensure_js_dir():
    """确保js目录存在"""
    JS_DIR.mkdir(exist_ok=True)
    return True

def create_or_update_script(script_name, content):
    """创建或更新脚本文件"""
    script_path = JS_DIR / script_name
    
    # 检查文件是否存在且内容相同
    if script_path.exists():
        with open(script_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()
        
        if existing_content.strip() == content.strip():
            print(f"脚本 {script_name} 已存在且内容相同，无需更新")
            return True
    
    # 创建或更新文件
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"已创建/更新脚本: {script_path}")
    return True

def add_script_to_html(html_file, script_path, script_name, check_only=False):
    """向HTML文件添加脚本引用"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已经包含了脚本
    if script_name in content:
        print(f"文件 {html_file} 已包含 {script_name} 脚本")
        return False
    
    if check_only:
        print(f"文件 {html_file} 需要添加 {script_name} 脚本")
        return True
    
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

def fix_back_link(html_file, check_only=False):
    """修复返回链接，使用绝对路径"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找返回链接
    back_link_pattern = r'<a\s+href="[^"]*"\s+class="back-link"[^>]*>返回主菜单</a>'
    back_link_match = re.search(back_link_pattern, content)
    
    if not back_link_match:
        print(f"文件 {html_file} 中未找到返回链接")
        return False
    
    # 检查是否已经是绝对路径
    if 'href="/"' in back_link_match.group(0) or 'href="http' in back_link_match.group(0):
        print(f"文件 {html_file} 中的返回链接已经是绝对路径")
        return False
    
    if check_only:
        print(f"文件 {html_file} 中的返回链接需要修复")
        return True
    
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

def fix_homepage(check_only=False, verbose=False):
    """修复主页导航"""
    # 确保js目录存在
    if not ensure_js_dir():
        return False
    
    # 创建或更新导航修复脚本
    if not create_or_update_script("navigation-fix.js", NAVIGATION_FIX_JS):
        return False
    
    # 向主页添加导航修复脚本
    index_file = ROOT_DIR / "index.html"
    if not index_file.exists():
        print("错误：找不到主页文件")
        return False
    
    return add_script_to_html(index_file, "js/navigation-fix.js", "navigation-fix.js", check_only)

def fix_project_pages(check_only=False, verbose=False):
    """修复项目页面导航"""
    # 确保js目录存在
    if not ensure_js_dir():
        return False
    
    # 创建或更新返回链接修复脚本
    if not create_or_update_script("back-link-fix.js", BACK_LINK_FIX_JS):
        return False
    
    # 统计
    total_files = 0
    script_added = 0
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
                if add_script_to_html(index_file, "../../js/back-link-fix.js", "back-link-fix.js", check_only):
                    script_added += 1
                
                # 修复返回链接
                if fix_back_link(index_file, check_only):
                    back_link_fixed += 1
    
    if verbose or check_only:
        print(f"\n项目页面检查结果：共 {total_files} 个文件，需要添加脚本 {script_added} 个，需要修复返回链接 {back_link_fixed} 个")
    
    return True

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='修复网页导航问题')
    parser.add_argument('--homepage-only', action='store_true', help='只修复主页导航')
    parser.add_argument('--projects-only', action='store_true', help='只修复项目页面导航')
    parser.add_argument('--check', action='store_true', help='只检查问题，不进行修复')
    parser.add_argument('--verbose', action='store_true', help='显示详细输出')
    
    args = parser.parse_args()
    
    # 如果没有指定特定选项，则修复所有
    fix_home = not args.projects_only
    fix_projects = not args.homepage_only
    
    success = True
    
    if fix_home:
        print("正在处理主页导航...")
        if not fix_homepage(args.check, args.verbose):
            success = False
    
    if fix_projects:
        print("正在处理项目页面导航...")
        if not fix_project_pages(args.check, args.verbose):
            success = False
    
    if args.check:
        print("\n检查完成。使用相同的命令但不带 --check 参数来修复问题。")
    else:
        print("\n导航修复完成！")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
