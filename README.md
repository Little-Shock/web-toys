# Web Toys Collection (网页玩具合集) - Little Shock

一个由 Little Shock 团队创建的有趣网页小玩具集合，每个玩具都是独立的交互式网页体验。

## 项目简介

这个项目收集了各种有趣的网页交互体验，每个"玩具"都是一个独立的网页应用，专注于特定的视觉效果或交互模式。这些玩具通常具有以下特点：

- 单页面应用，无需后端
- 专注于有趣的视觉效果或交互体验
- 支持移动设备和桌面设备
- 轻量级，加载迅速

## 项目结构

项目采用分类目录结构，便于管理和维护：

```
web-toys/
├── projects/                    # 所有项目目录
│   ├── interactive-visuals/     # 互动视觉类项目
│   ├── physics-simulations/     # 物理模拟类项目
│   ├── creative-tools/          # 创意工具类项目
│   ├── music-and-sound/         # 音乐与声音类项目
│   ├── visual-effects/          # 视觉特效类项目
│   ├── games-and-entertainment/ # 游戏与娱乐类项目
│   ├── utility-tools/           # 实用工具类项目
│   └── archived/                # 归档项目
├── tools/                       # 脚本和工具
│   ├── generate_homepage_simplified.py  # 支持精简标签系统的主页生成脚本
│   ├── generate_homepage_with_tags.py  # 支持完整标签系统的主页生成脚本
│   ├── manage_tags.py           # 标签管理工具
│   ├── site_config.json         # 站点配置文件
│   ├── site_config_simplified.json  # 精简标签系统配置文件
│   └── 开发过程/                 # 开发过程文档
├── common/                      # 共享资源和库
│   ├── js/                      # 共享JavaScript库
│   ├── css/                     # 共享CSS样式
│   ├── assets/                  # 共享资源文件
│   └── templates/               # 共享模板
└── index.html                   # 主页
```

### 主要文件

- `index.html`: 主页，展示所有项目，支持分类导航和标签筛选
- `site_config.json`: 网站配置文件，包含分类定义、标签定义和项目分配
- `tools/generate_homepage_simplified.py`: 支持精简标签系统的主页生成器脚本
- `tools/generate_homepage_with_tags.py`: 支持完整标签和多分类的主页生成器脚本
- `tools/manage_tags.py`: 标签管理工具，用于标准化标签和建议次要分类
- `tools/site_config_simplified.json`: 包含精简标签系统的站点配置文件

每个项目目录中都包含一个 `project.json` 文件，用于定义项目的元数据，如标题、描述、标签、主分类、次要分类等。

### 分类与标签系统

项目使用混合的分类和标签系统：

#### 主要分类

1. **互动视觉 (interactive-visuals)**: 通过触摸和交互创造的视觉体验
2. **物理模拟 (physics-simulations)**: 基于物理原理的模拟与交互
3. **创意工具 (creative-tools)**: 用数字画笔和特效创作的艺术工具
4. **音乐与声音 (music-and-sound)**: 声音与视觉结合的体验
5. **视觉特效 (visual-effects)**: 视觉效果和特效展示
6. **游戏与娱乐 (games-and-entertainment)**: 互动游戏和娱乐体验
7. **实用工具 (utility-tools)**: 功能性工具
8. **归档项目 (archived)**: 历史项目和早期版本

#### 标签系统

项目可以有多个标签，用于更细粒度的分类和筛选。标签反映了项目的特性、技术或主题，如"粒子效果"、"触摸互动"、"3D交互"等。

为了保持界面简洁和提高用户体验，特别是在移动设备上，我们将标签系统精简为10个核心标签：

1. **触摸互动**：需要用户触摸或点击交互的项目
2. **粒子效果**：使用粒子系统创造视觉效果的项目
3. **3D交互**：提供三维空间交互体验的项目
4. **物理模拟**：模拟现实世界物理规律的项目
5. **光效**：以光线和发光效果为特色的项目
6. **音频可视化**：将声音转化为视觉效果的项目
7. **互动音乐**：允许用户创造或交互音乐的项目
8. **移动优化**：专为移动设备优化的项目
9. **游戏**：具有游戏玩法元素的项目
10. **创意绘画**：允许用户创作视觉艺术的项目

#### 多分类支持

项目可以有一个主分类和多个次要分类，使项目能够在多个分类中显示，提高项目的可发现性。

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
  "primary_category": "interactive-visuals",  // 主要分类ID
  "secondary_categories": ["physics-simulations"],  // 次要分类ID列表（可选）
  "order": 1,  // 在主分类中的显示顺序（可选）

  // 版本管理相关字段
  "version": "0.1.0",  // 语义化版本号
  "creation_date": "2025-01-01",  // 创建日期
  "last_updated": "2025-01-15",  // 最后更新日期
  "changelog": [
    {
      "version": "0.1.0",
      "date": "2025-01-15",
      "changes": ["初始版本"]
    }
  ],

  // 兼容性信息
  "compatibility": {
    "mobile": true,  // 是否支持移动设备
    "desktop": true,  // 是否支持桌面设备
    "performance_impact": "medium"  // 性能影响: "low", "medium", "high"
  },

  // 作者信息
  "author": {
    "name": "Little Shock Team",
    "contact": "https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd",
    "creator": "Little-Shock",
    "contributors": []
  },

  // 其他元信息
  "features": ["基本功能"],
  "dependencies": []
}
```

### 3. 将项目放入正确的分类目录

将你的项目目录放入对应的分类目录中，例如：

```
projects/interactive-visuals/your-toy-name/
```

### 4. 更新分类配置

使用标签管理工具更新项目的分类和标签：

```bash
python tools/manage_tags.py
```

或者手动编辑 `site_config.json` 文件，确保项目在 `category_assignments` 部分有正确的主分类：

```json
"category_assignments": {
  "your-toy-name": "primary-category-id"  // 例如: "interactive-visuals", "creative-tools" 等
}
```

### 5. 生成新的主页

运行支持标签的主页生成器脚本更新主页：

```bash
python tools/generate_homepage_simplified.py
```

这个脚本会生成一个优化的主页，包含精简的标签系统，特别适合移动设备浏览。

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