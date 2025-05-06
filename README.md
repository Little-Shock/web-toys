# Web Toys Collection (网页玩具合集) - Little Shock

一个由 Little Shock 团队创建的有趣网页小玩具集合，每个玩具都是独立的交互式网页体验。

## 项目简介

这个项目收集了各种有趣的网页交互体验，每个"玩具"都是一个独立的网页应用，专注于特定的视觉效果或交互模式。这些玩具通常具有以下特点：

- 单页面应用，无需后端
- 专注于有趣的视觉效果或交互体验
- 支持移动设备和桌面设备
- 轻量级，加载迅速

## 项目结构

项目采用分类系统组织，所有分类和项目分配都集中在 `site_config.json` 文件中管理。

### 主要文件

- `index.html`: 主页，展示所有项目，支持分类导航
- `site_config.json`: 网站配置文件，包含分类定义和项目分配
- `generate_homepage_new.py`: 主页生成器脚本

每个项目目录中都包含一个 `project.json` 文件，用于定义项目的元数据，如标题、描述、标签等。

### 分类系统

项目使用以下分类组织：

1. **互动视觉 (interactive-visuals)**: 通过触摸和交互创造的视觉体验
2. **物理模拟 (physics-simulations)**: 基于物理原理的模拟与交互
3. **创意工具 (creative-tools)**: 用数字画笔和特效创作的艺术工具
4. **音乐与声音 (music-and-sound)**: 声音与视觉结合的体验
5. **视觉特效 (visual-effects)**: 视觉效果和特效展示
6. **游戏与娱乐 (games-and-entertainment)**: 互动游戏和娱乐体验
7. **实用工具 (utility-tools)**: 功能性工具
8. **归档项目 (archived)**: 历史项目和早期版本

## 如何提交新玩具

### 1. 准备你的玩具

确保你的网页玩具满足以下条件：

- 完全自包含在一个目录中，主文件命名为 `index.html`
- 不依赖外部服务器或API（纯前端实现）
- 具有响应式设计，在移动设备和桌面设备上都能良好工作
- 包含返回主菜单的链接

### 2. 创建项目配置文件

在你的玩具目录中创建一个 `project.json` 文件：

```json
{
  "title": "你的玩具名称",
  "description": "简短的描述，说明玩具的功能和特点",
  "tags": ["标签1", "标签2"],
  "status": "beta",  // 可选值: "stable", "beta", "deprecated"
  "order": 1  // 在分类中的显示顺序（可选）
}
```

### 3. 更新分类配置

在 `site_config.json` 文件的 `category_assignments` 部分添加你的项目分类：

```json
"category_assignments": {
  "your-toy-name": "分类ID"  // 例如: "interactive-visuals", "creative-tools" 等
}
```

### 4. 生成新的主页

运行主页生成器脚本更新主页：

```bash
python generate_homepage_new.py
```

## 设计理念

Little Shock 团队的网页玩具设计理念包括：

- **简约审美**：清晰、简约的界面设计
- **舒适交互**：流畅、自然的交互体验
- **呼吸感**：通过动画和效果创造有机、自然的节奏
- **高级感**：精致的视觉效果和音效设计
- **移动优先**：优先考虑移动设备上的体验

## 部署说明

项目使用Cloudflare Pages进行部署。当新的提交推送到GitHub仓库后，Cloudflare Pages会自动构建和部署更新的网站。

---

© 2025 Little Shock 团队 | [Little Shock 专区 @ WaytoAGI](https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd)