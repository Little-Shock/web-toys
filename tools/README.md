# 项目管理工具

这个目录包含了一系列用于管理项目的工具，特别是用于管理项目的版本信息和元信息。

## 工具列表

### 1. 项目元信息更新工具 (`update_project_metadata.py`)

这个工具用于更新项目的元信息，包括版本号、更新时间、更新日志、兼容性信息等。

**用法:**
```bash
# 更新所有项目的元信息
python tools/update_project_metadata.py all

# 更新指定项目的元信息
python tools/update_project_metadata.py <项目名称>
```

### 2. README生成工具 (`generate_readme.py`)

这个工具用于生成或更新项目的README文件，根据项目的元信息自动生成。

**用法:**
```bash
# 为所有没有README的项目生成README文件
python tools/generate_readme.py all

# 为指定项目生成README文件
python tools/generate_readme.py <项目名称>

# 强制覆盖已有的README文件
python tools/generate_readme.py <项目名称> --force
```

### 3. 项目详情页生成工具 (`generate_project_details.py`)

这个工具用于生成项目的详情页，显示项目的详细信息，包括版本历史、更新日志、兼容性信息等。

**用法:**
```bash
# 生成所有项目的详情页
python tools/generate_project_details.py
```

### 4. 主页生成工具 (`generate_homepage.py`)

这个工具用于生成项目的主页，显示所有项目的列表和分类。

**用法:**
```bash
# 生成主页
python tools/generate_homepage.py
```

### 5. 项目版本管理工具 (`manage_versions.py`)

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

### 6. 项目模板生成工具 (`create_project_template.py`)

这个工具用于生成新项目的模板，包括目录结构、HTML、CSS、JavaScript、Service Worker等文件。

**用法:**
```bash
# 创建新项目
python tools/create_project_template.py <项目名称> <分类ID> [<描述>] [<标签1,标签2,...>]
```

### 7. 批处理工具 (`update_all_projects.py`)

这个工具用于一次性更新所有项目的元信息、README和详情页。

**用法:**
```bash
# 更新所有项目
python tools/update_all_projects.py
```

## 工作流程

1. 使用 `update_project_metadata.py` 更新项目的元信息
2. 使用 `generate_readme.py` 生成或更新项目的README文件
3. 使用 `generate_project_details.py` 生成项目的详情页
4. 使用 `generate_homepage.py` 更新主页

或者，直接使用 `update_all_projects.py` 一次性完成所有步骤。

## 创建新项目

1. 使用 `create_project_template.py` 创建新项目的模板
2. 开发项目
3. 使用 `manage_versions.py` 更新项目的版本信息
4. 使用 `generate_project_details.py` 生成项目的详情页
5. 使用 `generate_homepage.py` 更新主页

## 注意事项

- 所有工具都需要在项目根目录下运行
- 项目的元信息存储在 `project.json` 文件中
- 项目的详情页存储在 `project-details.html` 文件中
- 项目的README文件存储在 `README.md` 文件中
