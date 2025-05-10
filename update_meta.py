import os
import json
import random
from datetime import datetime, timedelta

def find_project_files():
    """查找所有project.json文件"""
    result = []
    for root, dirs, files in os.walk("projects"):
        if "project.json" in files:
            result.append(os.path.join(root, "project.json"))
    return result

def generate_creation_date(last_updated):
    """生成合理的创建日期"""
    try:
        # 解析last_updated日期
        last_updated_date = datetime.strptime(last_updated, "%Y-%m-%d")
        
        # 创建日期应该比最后更新日期早1-60天
        days_earlier = random.randint(1, 60)
        creation_date = last_updated_date - timedelta(days=days_earlier)
        
        # 确保创建日期不早于2023年
        min_date = datetime(2023, 1, 1)
        if creation_date < min_date:
            creation_date = min_date
        
        return creation_date.strftime("%Y-%m-%d")
    except:
        # 如果解析失败，返回一个默认日期
        return "2023-01-01"

def update_project_file(file_path):
    """更新单个project.json文件"""
    try:
        # 读取文件
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # 检查并添加creation_date
        if "creation_date" not in data:
            if "last_updated" in data:
                data["creation_date"] = generate_creation_date(data["last_updated"])
            else:
                data["creation_date"] = "2023-01-01"
        
        # 保存更新后的文件
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"已更新: {file_path}")
        return True
    except Exception as e:
        print(f"更新 {file_path} 失败: {e}")
        return False

def main():
    """主函数"""
    # 查找所有project.json文件
    project_files = find_project_files()
    print(f"找到 {len(project_files)} 个项目文件")
    
    # 更新每个文件
    success = 0
    failure = 0
    for file_path in project_files:
        if update_project_file(file_path):
            success += 1
        else:
            failure += 1
    
    print(f"更新完成: 成功 {success}, 失败 {failure}")

if __name__ == "__main__":
    main()
