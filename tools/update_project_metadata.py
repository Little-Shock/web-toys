#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sys
from datetime import datetime
import re

def read_site_config():
    """读取站点配置文件"""
    # 首先尝试读取根目录的配置文件
    if os.path.exists('site_config.json'):
        try:
            with open('site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取根目录站点配置文件时出错: {e}")

    # 如果根目录没有，尝试读取tools目录的配置文件
    if os.path.exists('tools/site_config.json'):
        try:
            with open('tools/site_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取tools目录站点配置文件时出错: {e}")

    print("无法找到站点配置文件")
    return None

def load_project_config(project_path):
    """加载项目配置"""
    config_path = os.path.join(project_path, "project.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f), config_path
        except Exception as e:
            print(f"读取项目配置文件时出错: {e}")
    else:
        print(f"项目配置文件不存在: {config_path}")
    return None, None

def save_project_config(config, config_path):
    """保存项目配置"""
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        print(f"项目配置已保存到 {config_path}")
        return True
    except Exception as e:
        print(f"保存项目配置文件时出错: {e}")
        return False

def extract_features_from_readme(readme_path):
    """从README文件中提取功能特点"""
    if not os.path.exists(readme_path):
        return []

    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 查找功能特点部分
        features_match = re.search(r'## 功能特点\s+(.*?)(?=\s+##|\s*$)', content, re.DOTALL)
        if features_match:
            features_text = features_match.group(1).strip()
            # 提取每个功能点
            features = []
            for line in features_text.split('\n'):
                # 移除Markdown列表符号和加粗标记
                cleaned_line = re.sub(r'^-\s+\*\*(.*?)\*\*.*$', r'\1', line.strip())
                if cleaned_line and cleaned_line != line.strip():
                    features.append(cleaned_line)
            return features

        # 如果没有找到功能特点部分，尝试查找其他可能的部分
        tech_match = re.search(r'## 技术实现\s+(.*?)(?=\s+##|\s*$)', content, re.DOTALL)
        if tech_match:
            tech_text = tech_match.group(1).strip()
            techs = []
            for line in tech_text.split('\n'):
                cleaned_line = re.sub(r'^-\s+\*\*(.*?)\*\*.*$', r'\1', line.strip())
                if not cleaned_line or cleaned_line == line.strip():
                    cleaned_line = re.sub(r'^-\s+(.*?)$', r'\1', line.strip())
                if cleaned_line and cleaned_line != line.strip():
                    techs.append(cleaned_line)
            return techs
    except Exception as e:
        print(f"读取README文件时出错: {e}")

    return []

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

def process_all_projects():
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
                            success_count += 1
                        else:
                            fail_count += 1
                    else:
                        fail_count += 1

    print(f"\n处理完成! 成功: {success_count}, 失败: {fail_count}")

def process_single_project(project_name):
    """处理单个项目"""
    # 项目根目录
    projects_root = "projects"

    # 查找项目
    project_path = None
    for category_dir in os.listdir(projects_root):
        category_path = os.path.join(projects_root, category_dir)
        if os.path.isdir(category_path):
            possible_path = os.path.join(category_path, project_name)
            if os.path.isdir(possible_path):
                project_path = possible_path
                break

    if not project_path:
        print(f"找不到项目: {project_name}")
        return False

    print(f"\n处理项目: {project_name}")

    # 更新项目元信息
    if update_project_metadata(project_path):
        # 更新README文件
        if update_readme_with_version(project_path):
            print(f"项目 {project_name} 处理成功!")
            return True

    print(f"项目 {project_name} 处理失败!")
    return False

def print_usage():
    """打印使用说明"""
    print("项目元信息更新工具")
    print("用法:")
    print("  python update_project_metadata.py all")
    print("    更新所有项目的元信息")
    print("  python update_project_metadata.py <项目名称>")
    print("    更新指定项目的元信息")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]

    if command == "all":
        process_all_projects()
    else:
        process_single_project(command)
