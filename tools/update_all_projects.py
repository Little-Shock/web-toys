#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import subprocess

def run_command(command):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def update_all_projects():
    """更新所有项目的元信息和README"""
    print("开始更新所有项目的元信息和README...")
    success, output = run_command("python tools/update_project_metadata.py all --readme")
    if not success:
        print("更新项目元信息和README失败:")
        print(output)
        return False

    print(output)

    print("\n开始生成所有项目的详情页...")
    success, output = run_command("python tools/generate_project_details.py")
    if not success:
        print("生成项目详情页失败:")
        print(output)
        return False

    print(output)

    print("\n开始更新主页...")
    success, output = run_command("python tools/generate_homepage_simplified.py")
    if not success:
        print("更新主页失败:")
        print(output)
        return False

    print(output)

    print("\n所有更新完成!")
    return True

if __name__ == "__main__":
    update_all_projects()
