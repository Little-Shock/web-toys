# 项目管理工具

这个目录包含了一系列用于管理项目的工具，特别是用于管理项目的版本信息和元信息。

## 工具列表

### 0. 统一项目创建工具 (`create_project_unified.py`) - 推荐使用

这个工具整合了 `create_project.py` 和 `create_project_template.py` 的功能，提供了一个统一的接口来创建新项目。

**用法:**
```bash
# 创建新项目
python tools/create_project_unified.py --title "项目标题" --description "项目描述" --category "分类ID"

# 使用现有项目作为模板创建新项目
python tools/create_project_unified.py --title "项目标题" --description "项目描述" --category "分类ID" --template "projects/分类/项目名称"

# 指定项目标签
python tools/create_project_unified.py --title "项目标题" --description "项目描述" --category "分类ID" --tags "标签1,标签2,标签3"
```

### 1. 项目元信息更新工具 (`update_project_metadata.py`)

这个工具用于更新项目的元信息，包括版本号、更新时间、更新日志、兼容性信息等。同时也可以生成README文件。

**用法:**
```bash
# 更新所有项目的元信息
python tools/update_project_metadata.py all

# 更新指定项目的元信息
python tools/update_project_metadata.py <项目名称>

# 更新元信息并生成README
python tools/update_project_metadata.py all --readme

# 更新元信息并强制覆盖已有README
python tools/update_project_metadata.py <项目名称> --readme --force
```



### 2. 项目详情页生成工具 (`generate_project_details.py`)

这个工具用于生成项目的详情页，显示项目的详细信息，包括版本历史、更新日志、兼容性信息等。

**用法:**
```bash
# 生成所有项目的详情页
python tools/generate_project_details.py
```

### 3. 主页生成工具 (`generate_homepage_simplified.py`)

这个工具用于生成项目的主页，显示所有项目的列表和分类，支持标签筛选功能。

**用法:**
```bash
# 生成主页
python tools/generate_homepage_simplified.py

# 仅验证项目元数据，不生成主页
python tools/generate_homepage_simplified.py --validate
```

### 4. 项目版本管理工具 (`manage_versions.py`)

这个工具用于管理项目的版本信息，包括更新版本号、添加更新日志等。

**用法:**
```bash
# 列出所有项目
python tools/manage_versions.py list

# 显示项目详细信息
python tools/manage_versions.py info <项目名称>

# 更新项目版本
python tools/manage_versions.py update <项目名称> <新版本号> [<更新内容1> <更新内容2> ...]

# 初始化项目版本信息
python tools/manage_versions.py init <项目名称>

# 初始化所有项目的版本信息
python tools/manage_versions.py init-all
```

### 5. 项目模板生成工具 (`create_project_template.py`)

这个工具用于生成新项目的模板，包括目录结构、HTML、CSS、JavaScript、Service Worker等文件。

**用法:**
```bash
# 创建新项目
python tools/create_project_template.py <项目名称> <分类ID> [<描述>] [<标签1,标签2,...>]
```

### 6. 元数据管理工具 (`manage_metadata.py`)

这个工具用于管理项目的分类和标签，包括添加分类、标准化标签等。

**用法:**
```bash
# 启动交互式管理界面
python tools/manage_metadata.py
```

### 7. 批处理工具 (`update_all_projects.py`)

这个工具用于一次性更新所有项目的元信息、README和详情页。

**用法:**
```bash
# 更新所有项目
python tools/update_all_projects.py
```

### 8. 工具库 (`utils.py`)

这个文件包含了各个工具共用的函数，如配置读取、项目查找、模板渲染等。不需要直接调用。

### 9. 项目验证工具 (`validate_projects.py`)

这个工具用于验证所有项目的元数据和文件结构，确保它们符合规范。

**用法:**
```bash
# 验证所有项目
python tools/validate_projects.py
```

### 10. 项目创建工具 (`create_project.py`)

这个工具用于创建新项目，包括目录结构、基本HTML文件和元数据文件。

**用法:**
```bash
# 创建新项目
python tools/create_project.py --title "项目标题" --description "项目描述" --category "分类ID"

# 使用现有项目作为模板创建新项目
python tools/create_project.py --title "项目标题" --description "项目描述" --category "分类ID" --template "projects/分类/项目名称"
```

### 11. 项目移动工具 (`move_project.py`)

这个工具用于将项目从一个分类移动到另一个分类，并自动更新元数据。

**用法:**
```bash
# 移动项目
python tools/move_project.py --source "projects/原分类/项目目录" --category "目标分类"
```

### 12. 导航修复工具 (`fix_navigation.py`)

这个工具用于修复项目页面中的导航问题，特别是在移动端浏览器中的返回链接问题。它整合了 `add_back_link_fix.py` 和 `apply_navigation_fix.py` 的功能。

**用法:**
```bash
# 修复所有导航问题
python tools/fix_navigation.py

# 只修复主页导航
python tools/fix_navigation.py --homepage-only

# 只修复项目页面导航
python tools/fix_navigation.py --projects-only

# 只检查问题，不进行修复
python tools/fix_navigation.py --check

# 显示详细输出
python tools/fix_navigation.py --verbose
```

## 工作流程

1. 使用 `update_project_metadata.py` 更新项目的元信息和README
2. 使用 `generate_project_details.py` 生成项目的详情页
3. 使用 `generate_homepage_simplified.py` 更新主页

或者，直接使用 `update_all_projects.py` 一次性完成所有步骤。

## 创建新项目

### 推荐方法：使用统一项目创建工具

1. 使用 `create_project_unified.py` 创建新项目
   ```bash
   python tools/create_project_unified.py --title "项目标题" --description "项目描述" --category "分类ID"
   ```
2. 开发项目
3. 使用 `manage_versions.py` 更新项目的版本信息
4. 使用 `generate_homepage_simplified.py` 更新主页

### 旧方法一：使用项目创建工具（不推荐）

1. 使用 `create_project.py` 创建新项目
   ```bash
   python tools/create_project.py --title "项目标题" --description "项目描述" --category "分类ID"
   ```
2. 开发项目
3. 使用 `manage_versions.py` 更新项目的版本信息
4. 使用 `generate_homepage_simplified.py` 更新主页

### 旧方法二：使用项目模板（不推荐）

1. 使用 `create_project_template.py` 创建新项目的模板
2. 开发项目
3. 使用 `manage_versions.py` 更新项目的版本信息
4. 使用 `update_project_metadata.py` 更新项目的元信息和README
5. 使用 `generate_project_details.py` 生成项目的详情页
6. 使用 `generate_homepage_simplified.py` 更新主页

## 注意事项

- 所有工具都需要在项目根目录下运行
- 项目的元信息存储在 `project.json` 文件中
- 项目的详情页存储在 `project-details.html` 文件中
- 项目的README文件存储在 `README.md` 文件中

## 常见问题排查

### 项目在主页上不显示

1. 检查项目目录中是否有`index.html`文件
2. 检查项目目录中是否有`project.json`文件
3. 检查`project.json`中的`primary_category`是否与项目所在目录匹配
4. 运行验证脚本检查项目元数据是否有问题
   ```bash
   python tools/validate_projects.py
   ```
5. 重新生成主页
   ```bash
   python tools/generate_homepage_simplified.py
   ```

### 项目显示在错误的分类中

1. 检查`project.json`中的`primary_category`和`secondary_categories`字段
2. 使用`move_project.py`脚本将项目移动到正确的分类
   ```bash
   python tools/move_project.py --source "projects/原分类/项目目录" --category "目标分类"
   ```
3. 重新生成主页

### 主页生成后没有变化

1. 清除浏览器缓存，或使用无痕模式打开主页
2. 检查主页文件是否被正确更新（查看文件修改时间）
3. 确保运行生成脚本时没有错误信息

## 元信息指南

关于项目元信息 (`project.json`) 的详细规范和最佳实践，请参考 [meta_info_guidelines.md](./meta_info_guidelines.md)。该文档详细说明了：

- 必要的元信息字段（标题、描述、标签等）
- 版本和时间信息（版本号、创建日期、更新日期等）
- 兼容性信息
- 作者信息
- 功能和依赖列表
- 元信息的最佳实践

**重要提示**：所有新项目必须包含完整的元信息，特别是版本号、创建日期和作者信息。
