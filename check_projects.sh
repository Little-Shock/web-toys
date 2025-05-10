#!/bin/bash

# 查找所有project.json文件
echo "查找项目文件..."
project_files=$(find projects -name "project.json")

# 计算文件数量
count=$(echo "$project_files" | wc -l)
echo "找到 $count 个项目文件"

# 列出前5个文件的路径
echo "前5个项目文件:"
echo "$project_files" | head -n 5

# 检查第一个文件的内容
first_file=$(echo "$project_files" | head -n 1)
echo "第一个文件 ($first_file) 的内容:"
cat "$first_file"
