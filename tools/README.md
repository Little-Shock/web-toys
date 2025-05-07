# 项目管理工具

这个目录包含了一系列用于管理项目的工具，特别是用于管理项目的版本信息和元信息。

## 工具列表

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

## 工作流程

1. 使用 `update_project_metadata.py` 更新项目的元信息和README
2. 使用 `generate_project_details.py` 生成项目的详情页
3. 使用 `generate_homepage_simplified.py` 更新主页

或者，直接使用 `update_all_projects.py` 一次性完成所有步骤。

## 创建新项目

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
