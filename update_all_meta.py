#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
from datetime import datetime, timedelta
import random

def find_all_project_json_files():
    """查找所有project.json文件"""
    project_files = []
    for root, dirs, files in os.walk('projects'):
        if 'project.json' in files:
            project_files.append(os.path.join(root, 'project.json'))
    return project_files

def generate_creation_date(last_updated_date):
    """根据last_updated生成一个合理的creation_date"""
    # 将last_updated转换为datetime对象
    if isinstance(last_updated_date, str):
        try:
            last_updated = datetime.strptime(last_updated_date, "%Y-%m-%d")
        except ValueError:
            # 如果日期格式不正确，使用当前日期减去30天
            last_updated = datetime.now()
    else:
        last_updated = datetime.now()
    
    # 创建日期应该比最后更新日期早1-60天
    days_earlier = random.randint(1, 60)
    creation_date = last_updated - timedelta(days=days_earlier)
    
    # 确保创建日期不早于2023年
    min_date = datetime(2023, 1, 1)
    if creation_date < min_date:
        creation_date = min_date
    
    return creation_date.strftime("%Y-%m-%d")

def update_project_json(file_path):
    """更新单个project.json文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 检查是否已有creation_date
        if 'creation_date' not in data:
            # 如果有last_updated，根据它生成creation_date
            if 'last_updated' in data:
                data['creation_date'] = generate_creation_date(data['last_updated'])
            else:
                # 如果没有last_updated，使用当前日期减去30天
                data['creation_date'] = generate_creation_date(datetime.now().strftime("%Y-%m-%d"))
        
        # 确保有version字段
        if 'version' not in data:
            data['version'] = "1.0.0"
        
        # 确保有last_updated字段
        if 'last_updated' not in data:
            data['last_updated'] = datetime.now().strftime("%Y-%m-%d")
        
        # 确保有changelog字段
        if 'changelog' not in data:
            data['changelog'] = [{
                "version": data['version'],
                "date": data['last_updated'],
                "changes": ["初始版本"]
            }]
        
        # 确保有compatibility字段
        if 'compatibility' not in data:
            data['compatibility'] = {
                "mobile": True,
                "desktop": True,
                "min_screen_width": 320,
                "performance_impact": "medium"
            }
        
        # 确保有author字段
        if 'author' not in data:
            data['author'] = {
                "name": "Little Shock Team",
                "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd"
            }
        
        # 确保有features字段
        if 'features' not in data:
            data['features'] = ["基本功能"]
        
        # 确保有dependencies字段
        if 'dependencies' not in data:
            data['dependencies'] = []
        
        # 保存更新后的数据
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"已更新: {file_path}")
        return True
    except Exception as e:
        print(f"更新 {file_path} 时出错: {e}")
        return False

def main():
    """主函数"""
    project_files = find_all_project_json_files()
    print(f"找到 {len(project_files)} 个项目文件")
    
    success_count = 0
    fail_count = 0
    
    for file_path in project_files:
        if update_project_json(file_path):
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n更新完成! 成功: {success_count}, 失败: {fail_count}")

if __name__ == "__main__":
    main()
