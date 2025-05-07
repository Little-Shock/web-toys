# 主页生成器使用说明

这个Python脚本用于自动生成网页玩具合集的主页，通过读取每个项目文件夹中的配置文件来生成完整的index.html。

## 使用方法

### 1. 为项目创建配置文件

在每个项目文件夹中创建一个名为`project.json`的配置文件，格式如下：

```json
{
    "title": "项目名称",
    "description": "项目描述文本",
    "tags": ["标签1", "标签2"],
    "status": "stable",
    "category": "视觉互动",
    "order": 1
}
```

配置项说明：
- `title`: 项目标题
- `description`: 项目描述
- `tags`: 项目标签（数组）
- `status`: 项目状态，可选值：`stable`（稳定版）、`beta`（测试版）、`deprecated`（已归档）
- `category`: 项目分类，预设分类有：视觉互动、特效展示、声音与创意、实用工具、归档项目
- `order`: 在分类中的显示顺序（数字越小越靠前）

### 2. 从现有主页创建配置文件

如果你已经有一个现成的index.html，可以使用以下命令从中提取信息并为每个项目创建配置文件：

```bash
python generate_homepage.py --create-configs
```

这将分析当前的index.html，并在每个项目文件夹中创建对应的project.json文件。

### 3. 生成主页

配置文件准备好后，运行以下命令生成主页：

```bash
python generate_homepage.py
```

这将读取所有项目文件夹中的配置文件，并生成新的index.html。

## 注意事项

1. 脚本会保持原有主页的样式和结构
2. 只有包含有效配置文件的项目才会被包含在生成的主页中
3. 项目按照分类和顺序排列
4. 预设的分类顺序为：视觉互动、特效展示、声音与创意、实用工具、归档项目、其他

## 自定义

如果需要修改主页的样式或结构，可以编辑脚本中的`HTML_HEAD`和`HTML_FOOTER`变量。
