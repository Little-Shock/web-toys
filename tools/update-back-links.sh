#!/bin/bash

# 批量更新所有项目的返回链接修复脚本
# 这个脚本会扫描所有项目的HTML文件，添加新的修复脚本引用

# 项目根目录
ROOT_DIR=$(pwd)
PROJECTS_DIR="$ROOT_DIR/projects"

echo "开始更新项目返回链接..."

# 查找所有HTML文件
HTML_FILES=$(find "$PROJECTS_DIR" -name "*.html")
FILE_COUNT=$(echo "$HTML_FILES" | wc -l)
echo "找到 $FILE_COUNT 个HTML文件"

# 更新每个HTML文件
for FILE in $HTML_FILES; do
    # 计算相对路径
    REL_DIR=$(dirname "$FILE")
    REL_PATH=$(realpath --relative-to="$REL_DIR" "$ROOT_DIR")
    SCRIPT_PATH="$REL_PATH/js/back-link-fix-new.js"
    
    # 检查是否已经包含新的修复脚本
    if grep -q "back-link-fix-new.js" "$FILE"; then
        echo "[已更新] $FILE"
        continue
    fi
    
    # 创建临时文件
    TMP_FILE=$(mktemp)
    
    # 替换旧的修复脚本引用
    if grep -q "back-link-fix.js" "$FILE"; then
        sed "s|<script.*back-link-fix\.js.*></script>|<script src=\"$SCRIPT_PATH\"></script>|" "$FILE" > "$TMP_FILE"
        echo "[替换] $FILE"
    else
        # 如果没有旧的修复脚本，在</body>前添加新的修复脚本
        sed "s|</body>|    <script src=\"$SCRIPT_PATH\"></script>\n</body>|" "$FILE" > "$TMP_FILE"
        echo "[添加] $FILE"
    fi
    
    # 移除可能存在的内联返回链接处理代码
    if grep -q "修复返回按钮链接" "$TMP_FILE"; then
        sed -i '/\/\/ 修复返回按钮链接/,/}\);/c\            // 返回按钮链接由back-link-fix-new.js处理\n            // 不再需要这里的代码' "$TMP_FILE"
        echo "[移除内联代码] $FILE"
    fi
    
    # 更新原文件
    mv "$TMP_FILE" "$FILE"
done

echo "更新完成!"
