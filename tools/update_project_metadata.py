#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import re
from datetime import datetime

# 导入工具模块
from utils import (
    read_site_config, load_project_config, save_project_config,
    find_project, extract_features_from_readme, render_template,
    get_today_date
)

def read_readme_template():
    """读取README模板"""
    template_path = "tools/readme_template.md"
    if os.path.exists(template_path):
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"读取模板文件时出错: {e}")
            return None
    print(f"找不到模板文件: {template_path}")
    return None

def generate_readme(project_path, config, force=False):
    """生成README文件"""
    # 检查是否已有README文件
    readme_path = os.path.join(project_path, 'README.md')
    if os.path.exists(readme_path) and not force:
        print(f"项目已有README文件，跳过生成")
        return False

    # 读取模板
    template = read_readme_template()
    if not template:
        return False

    # 准备模板上下文
    project_dir = os.path.basename(project_path)

    # 状态文本映射
    status_text_map = {
        "stable": "稳定版",
        "beta": "测试版",
        "deprecated": "已归档"
    }

    context = {
        'title': config.get('title', project_dir),
        'description': config.get('description', ''),
        'version': config.get('version', '1.0.0'),
        'last_updated': config.get('last_updated', get_today_date()),
        'status': config.get('status', 'beta'),
        'status_text': status_text_map.get(config.get('status', 'beta'), '测试版'),
        'project_dir': project_dir,
        'features': config.get('features', ['基本功能']),
        'dependencies': config.get('dependencies', []),
        'changelog': config.get('changelog', [])
    }

    # 渲染模板
    rendered_readme = render_template(template, context)

    # 保存到项目目录
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(rendered_readme)
        print(f"已生成README文件: {readme_path}")
        return True
    except Exception as e:
        print(f"保存README文件时出错: {e}")
        return False

def extract_dependencies_from_readme(readme_path):
    """从README文件中提取技术依赖"""
    if not os.path.exists(readme_path):
        return []

    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 查找技术实现部分
        tech_match = re.search(r'## 技术实现\s+(.*?)(?=\s+##|\s*$)', content, re.DOTALL)
        if tech_match:
            tech_text = tech_match.group(1).strip()
            # 提取每个技术点
            techs = []
            for line in tech_text.split('\n'):
                # 提取技术名称
                tech_name = re.sub(r'^-\s+\*\*(.*?)\*\*.*$', r'\1', line.strip())
                if tech_name == line.strip():
                    tech_name = re.sub(r'^-\s+(.*?)：.*$', r'\1', line.strip())
                if tech_name != line.strip():
                    # 提取可能的库名称
                    lib_match = re.search(r'使用(.*?)(?:生成|处理|实现)', line)
                    if lib_match:
                        lib_name = lib_match.group(1).strip()
                        if lib_name:
                            techs.append(lib_name)
                    else:
                        techs.append(tech_name)
            return techs
    except Exception as e:
        print(f"读取README文件时出错: {e}")

    return []

def update_project_metadata(project_path):
    """更新项目元信息"""
    # 加载项目配置
    config, config_path = load_project_config(project_path)
    if not config:
        return False

    # 获取当前日期
    today = datetime.now().strftime("%Y-%m-%d")

    # 添加版本信息
    if "version" not in config:
        config["version"] = "1.0.0"

    if "last_updated" not in config:
        config["last_updated"] = today

    # 添加更新日志
    if "changelog" not in config:
        config["changelog"] = [{
            "version": config["version"],
            "date": config["last_updated"],
            "changes": ["初始版本"]
        }]

    # 添加兼容性信息
    if "compatibility" not in config:
        config["compatibility"] = {
            "mobile": True,
            "desktop": True,
            "min_screen_width": 320,
            "performance_impact": "medium"
        }

    # 添加作者信息
    if "author" not in config:
        config["author"] = {
            "name": "Little Shock Team",
            "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd"
        }

    # 从README中提取功能特点
    if "features" not in config:
        readme_path = os.path.join(project_path, "README.md")
        features = extract_features_from_readme(readme_path)
        if features:
            config["features"] = features
        else:
            config["features"] = ["基本功能"]

    # 从README中提取技术依赖
    if "dependencies" not in config:
        readme_path = os.path.join(project_path, "README.md")
        dependencies = extract_dependencies_from_readme(readme_path)
        if dependencies:
            config["dependencies"] = dependencies
        else:
            config["dependencies"] = []

    # 保存更新后的配置
    return save_project_config(config, config_path)

def update_readme_with_version(project_path):
    """更新README文件，添加版本信息部分"""
    readme_path = os.path.join(project_path, "README.md")
    if not os.path.exists(readme_path):
        print(f"README文件不存在: {readme_path}")
        return False

    # 加载项目配置
    config, _ = load_project_config(project_path)
    if not config:
        return False

    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查是否已有版本信息部分
        if "## 版本信息" not in content:
            # 构建版本信息部分
            version_info = f"""
## 版本信息

- **当前版本**: v{config.get('version', '1.0.0')}
- **最后更新**: {config.get('last_updated', datetime.now().strftime("%Y-%m-%d"))}
- **状态**: {config.get('status', 'stable')}

### 更新日志

"""
            # 添加更新日志
            changelog = config.get('changelog', [])
            for entry in changelog:
                version_info += f"#### v{entry.get('version', '1.0.0')} ({entry.get('date', '')})\n\n"
                for change in entry.get('changes', []):
                    version_info += f"- {change}\n"
                version_info += "\n"

            # 在未来计划部分之前插入版本信息
            if "## 未来计划" in content:
                content = content.replace("## 未来计划", f"{version_info}## 未来计划")
            elif "## 许可证" in content:
                content = content.replace("## 许可证", f"{version_info}## 许可证")
            else:
                content += f"\n{version_info}"

            # 保存更新后的README
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"已更新README文件: {readme_path}")
            return True
        else:
            # 更新已有的版本信息部分
            version_pattern = r"## 版本信息\s+.*?(?=\s+##|\s*$)"
            if re.search(version_pattern, content, re.DOTALL):
                # 构建新的版本信息部分
                new_version_info = f"""## 版本信息

- **当前版本**: v{config.get('version', '1.0.0')}
- **最后更新**: {config.get('last_updated', datetime.now().strftime("%Y-%m-%d"))}
- **状态**: {config.get('status', 'stable')}

### 更新日志

"""
                # 添加更新日志
                changelog = config.get('changelog', [])
                for entry in changelog:
                    new_version_info += f"#### v{entry.get('version', '1.0.0')} ({entry.get('date', '')})\n\n"
                    for change in entry.get('changes', []):
                        new_version_info += f"- {change}\n"
                    new_version_info += "\n"

                # 移除末尾的额外换行符
                new_version_info = new_version_info.rstrip()

                # 替换旧的版本信息部分
                updated_content = re.sub(version_pattern, new_version_info.strip(), content, flags=re.DOTALL)

                # 保存更新后的README
                with open(readme_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)

                print(f"已更新README文件中的版本信息: {readme_path}")
                return True
            else:
                print(f"无法在README文件中找到版本信息部分: {readme_path}")
                return False
    except Exception as e:
        print(f"更新README文件时出错: {e}")
        return False

def process_all_projects(generate_readme_flag=False, force_readme=False):
    """处理所有项目"""
    # 读取站点配置
    site_config = read_site_config()
    if not site_config:
        print("无法读取站点配置，更新中止")
        return

    # 项目根目录
    projects_root = "projects"

    # 成功和失败计数
    success_count = 0
    fail_count = 0

    # 遍历分类目录
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            # 遍历该分类下的所有项目
            for project_dir in os.listdir(category_path):
                project_path = os.path.join(category_path, project_dir)
                if os.path.isdir(project_path):
                    print(f"\n处理项目: {project_dir}")

                    # 更新项目元信息
                    if update_project_metadata(project_path):
                        # 更新README文件
                        if update_readme_with_version(project_path):
                            # 如果需要，生成完整的README
                            if generate_readme_flag:
                                config, _ = load_project_config(project_path)
                                if config:
                                    generate_readme(project_path, config, force_readme)
                            success_count += 1
                        else:
                            fail_count += 1
                    else:
                        fail_count += 1

    print(f"\n处理完成! 成功: {success_count}, 失败: {fail_count}")

def process_single_project(project_name, generate_readme_flag=False, force_readme=False):
    """处理单个项目"""
    # 查找项目
    project_path = find_project(project_name)

    if not project_path:
        print(f"找不到项目: {project_name}")
        return False

    print(f"\n处理项目: {project_name}")

    # 更新项目元信息
    if update_project_metadata(project_path):
        # 更新README文件
        if update_readme_with_version(project_path):
            # 如果需要，生成完整的README
            if generate_readme_flag:
                config, _ = load_project_config(project_path)
                if config:
                    generate_readme(project_path, config, force_readme)
            print(f"项目 {project_name} 处理成功!")
            return True

    print(f"项目 {project_name} 处理失败!")
    return False

def print_usage():
    """打印使用说明"""
    print("项目元信息更新工具")
    print("用法:")
    print("  python update_project_metadata.py all [--readme] [--force]")
    print("    更新所有项目的元信息")
    print("    --readme: 同时生成README文件")
    print("    --force: 强制覆盖已有的README文件")
    print("  python update_project_metadata.py <项目名称> [--readme] [--force]")
    print("    更新指定项目的元信息")
    print("    --readme: 同时生成README文件")
    print("    --force: 强制覆盖已有的README文件")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]
    generate_readme_flag = "--readme" in sys.argv
    force_readme = "--force" in sys.argv

    if command == "all":
        process_all_projects(generate_readme_flag, force_readme)
    else:
        process_single_project(command, generate_readme_flag, force_readme)
