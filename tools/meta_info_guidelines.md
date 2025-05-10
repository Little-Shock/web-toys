# 项目元信息 (Meta Information) 指南

本文档提供了创建和维护项目元信息 (`project.json`) 的标准和最佳实践。

## 必要字段

每个项目的 `project.json` 文件必须包含以下字段：

### 基本信息

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `title` | 字符串 | 项目标题 | `"瞬息之华"` |
| `description` | 字符串 | 项目简短描述 | `"互动式粒子光华效果，通过触摸或拖动屏幕创造绚烂的粒子绽放..."` |
| `tags` | 字符串数组 | 项目标签 | `["粒子效果", "触摸互动", "光效"]` |
| `status` | 字符串 | 项目状态 | `"stable"`, `"beta"`, `"deprecated"` |
| `primary_category` | 字符串 | 主要分类ID | `"visual-effects"` |
| `secondary_categories` | 字符串数组 | 次要分类ID列表 | `["interactive-visuals"]` |
| `order` | 整数 | 在分类中的显示顺序 | `6` |

### 版本和时间信息

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `version` | 字符串 | 语义化版本号 | `"1.0.0"` |
| `creation_date` | 字符串 | 项目创建日期 (YYYY-MM-DD) | `"2025-05-01"` |
| `last_updated` | 字符串 | 最后更新日期 (YYYY-MM-DD) | `"2025-05-15"` |
| `changelog` | 对象数组 | 版本更新日志 | 见下方示例 |

### 兼容性信息

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `compatibility` | 对象 | 兼容性信息 | 见下方示例 |

### 作者信息

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `author` | 对象 | 作者信息 | 见下方示例 |

### 功能和依赖

| 字段 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `features` | 字符串数组 | 项目功能特点 | `["粒子绽放系统", "可调节参数面板"]` |
| `dependencies` | 字符串数组 | 项目技术依赖 | `["p5.js", "Web Audio API"]` |

## 完整示例

```json
{
    "title": "瞬息之华",
    "description": "互动式粒子光华效果，通过触摸或拖动屏幕创造绚烂的粒子绽放，支持多种参数调整，呈现如花朵般瞬息绽放的视觉体验。",
    "tags": [
        "粒子效果",
        "触摸互动",
        "光效",
        "移动优化"
    ],
    "status": "stable",
    "order": 6,
    "primary_category": "visual-effects",
    "secondary_categories": [],
    "version": "1.0.0",
    "creation_date": "2025-05-01",
    "last_updated": "2025-05-15",
    "changelog": [
        {
            "version": "1.0.0",
            "date": "2025-05-15",
            "changes": [
                "初始版本发布",
                "实现基础粒子系统",
                "添加参数调整面板",
                "支持移动端触摸交互",
                "优化性能表现"
            ]
        }
    ],
    "compatibility": {
        "mobile": true,
        "desktop": true,
        "performance_impact": "medium"
    },
    "author": {
        "name": "Little Shock Team",
        "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd"
    },
    "features": [
        "粒子绽放系统",
        "可调节参数面板",
        "触摸互动效果",
        "拖尾效果",
        "移动端优化"
    ],
    "dependencies": [
        "p5.js"
    ]
}
```

## 字段详细说明

### 状态 (status)

- `stable`: 稳定版，功能完整且已经过充分测试
- `beta`: 测试版，主要功能已实现但可能存在问题
- `deprecated`: 已归档，不再维护或已被新版本替代

### 更新日志 (changelog)

更新日志是一个对象数组，每个对象包含以下字段：

- `version`: 版本号
- `date`: 发布日期
- `changes`: 变更内容列表

### 兼容性信息 (compatibility)

兼容性对象包含以下字段：

- `mobile`: 是否支持移动设备
- `desktop`: 是否支持桌面设备
- `performance_impact`: 性能影响，可选值为 `"low"`, `"medium"`, `"high"`

### 作者信息 (author)

作者对象包含以下字段：

- `name`: 作者或团队名称
- `contact`: 联系方式或链接
- `contributors`: 贡献者列表（可选）
- `creator`: 项目创建者的具体名字（可选）

**重要提示**：
- 应该尽可能具体地标明项目的实际创建者，而不仅仅是团队名称
- 如果是团队合作项目，应在`contributors`字段中列出所有主要贡献者
- 示例：
  ```json
  "author": {
      "name": "Little Shock Team",
      "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
      "creator": "张三",
      "contributors": ["李四", "王五", "赵六"]
  }
  ```

## 最佳实践

1. **保持描述简洁明了**：描述应该简短但包含项目的核心功能和特点
2. **使用标准化标签**：尽量使用已有的标签，避免创建过于相似的新标签
3. **版本号遵循语义化版本规范**：主版本.次版本.修订版本 (例如 1.0.0)
4. **及时更新changelog**：每次发布新版本时更新changelog
5. **准确评估兼容性**：确保兼容性信息反映项目的实际情况
6. **详细列出功能和依赖**：这有助于用户和开发者理解项目

## 工具使用

可以使用以下工具来管理项目元信息：

- `update_project_metadata.py`: 更新项目元信息
- `manage_versions.py`: 管理项目版本信息
- `generate_project_details.py`: 生成项目详情页

详细用法请参考 [tools/README.md](./README.md)。
