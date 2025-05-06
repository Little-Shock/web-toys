# Web Toys Collection (网页玩具合集) - Little Shock

一个由 Little Shock 团队创建的有趣网页小玩具集合，每个玩具都是独立的交互式网页体验。

## 项目简介

这个项目收集了各种有趣的网页交互体验，每个"玩具"都是一个独立的网页应用，专注于特定的视觉效果或交互模式。这些玩具通常具有以下特点：

- 单页面应用，无需后端
- 专注于有趣的视觉效果或交互体验
- 支持移动设备和桌面设备
- 轻量级，加载迅速

## 当前玩具列表

目前项目包含以下网页玩具：

1. **神经元模拟 (Synaptic Dreams)** - 模拟神经元网络的视觉效果，可以通过点击激活神经元，观察信号传播。
2. **蜘蛛网效果 (Starborne Garden)** - 创建动态的网状结构，对触摸和设备晃动做出反应。
3. **闪卡效果 (旧版)** - 上传图片创建具有全息效果的闪卡，支持设备晃动和鼠标悬停交互。
4. **赛博闪卡 (新版)** - 闪卡效果的升级版本，提供更好的用户体验。
5. **表情符号查找器 (Emoji Finder)** - 快速查找和复制表情符号的工具。
6. **赛博流麻 (Cyberpunk Glitch)** - 上传图片并应用可调节的赛博朋克风格故障艺术效果。
7. **元素波纹 (Element Ripples)** - 触摸创造水、火、电、光元素的流动波纹，支持上传自定义背景图片，并配有互动音效。
8. **量子弹球 (Quantum Pinball)** - 物理模拟的弹球游戏，可上传自定义图片作为弹球，创建各种障碍物和特殊区域，配有互动音效。
9. **墨韵 (Ink Rhythm)** - 流体墨水画布，模拟墨水在纸上的扩散效果，支持多种墨色和笔触，可通过设备倾斜控制墨水流动。
10. **光绘 (Light Painting)** - 光影剪影创作工具，可放置不同类型的光源和物体，创造独特的光影效果，支持保存高质量图像。
11. **织梦 (Fabric Dreams)** - 虚拟织物模拟器，模拟不同织物的物理特性，支持拖拽、固定点、剪裁和风力交互，可自定义纹理和颜色。

## 项目结构

项目采用灵活的分类系统组织，所有分类和项目分配都集中在 `site_config.json` 文件中管理。

### 主要文件

- `index.html`: 主页，展示所有项目，支持分类导航
- `site_config.json`: 网站配置文件，包含分类定义和项目分配
- `generate_homepage_new.py`: 主页生成器脚本
- `README.md`: 项目说明文档

### 目录结构

```
web-toys/
├── index.html                # 主导航页面
├── site_config.json          # 网站配置文件
├── generate_homepage_new.py  # 主页生成器脚本
├── README.md                 # 项目说明文档
├── neuron/                   # 神经元模拟玩具
│   ├── index.html
│   └── project.json          # 项目配置文件
├── spiderweb/                # 蜘蛛网效果玩具
│   ├── index.html
│   └── project.json
├── Holofoil Card/            # 闪卡效果玩具 (旧版)
│   ├── index.html
│   └── project.json
├── 赛博闪卡/                  # 赛博闪卡玩具 (新版)
│   ├── index.html
│   └── project.json
├── find_emoji/               # 表情符号查找器
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── project.json
└── ... (其他项目)
```

每个项目目录中都包含一个 `project.json` 文件，用于定义项目的元数据，如标题、描述、标签等。主页通过读取这些配置文件和 `site_config.json` 中的分类定义，自动生成带有分类导航的主页。

### 分类系统

项目使用灵活的分类系统，所有项目按以下分类组织：

1. **互动视觉 (interactive-visuals)**: 通过触摸和交互创造的视觉体验，让你沉浸在流动的光影和动态效果中
2. **物理模拟 (physics-simulations)**: 基于物理原理的模拟与交互，探索自然规律和科学现象
3. **创意工具 (creative-tools)**: 释放你的创造力，用数字画笔和特效创作独特的艺术作品
4. **音乐与声音 (music-and-sound)**: 探索声音与视觉的结合，创造独特的听觉和视觉体验
5. **视觉特效 (visual-effects)**: 令人惊叹的视觉效果和特效展示，带来视觉上的震撼体验
6. **游戏与娱乐 (games-and-entertainment)**: 有趣的互动游戏和娱乐体验，带来轻松愉快的时光
7. **实用工具 (utility-tools)**: 实用的功能性工具，解决特定需求的小应用
8. **归档项目 (archived)**: 历史项目和早期版本，见证我们的发展历程

## 如何提交新玩具

如果你想为这个集合添加新的网页玩具，请按照以下步骤操作：

### 1. 准备你的玩具

确保你的网页玩具满足以下条件：

- 完全自包含在一个目录中，主文件命名为 `index.html`
- 不依赖外部服务器或API（纯前端实现）
- 具有响应式设计，在移动设备和桌面设备上都能良好工作
- 代码整洁，注释充分
- 包含返回主菜单的链接（参考现有玩具的实现）

### 2. 创建新目录

为你的玩具创建一个新目录，目录名应该简洁明了，反映玩具的主要功能或效果。例如：

```
web-toys/
└── your-toy-name/
    ├── index.html
    ├── project.json
    └── (其他必要的资源文件)
```

### 3. 创建项目配置文件

在你的玩具目录中创建一个 `project.json` 文件，包含以下内容：

```json
{
  "title": "你的玩具名称",
  "description": "简短的描述，说明玩具的功能和特点",
  "tags": ["标签1", "标签2"],
  "status": "beta",  // 可选值: "stable", "beta", "deprecated"
  "order": 1  // 在分类中的显示顺序
}
```

### 4. 添加返回链接

在你的玩具页面中添加一个返回主菜单的链接，样式可以参考现有玩具。基本HTML结构如下：

```html
<a href="../index.html" class="back-link">返回主菜单</a>
```

样式可以根据你的玩具页面背景进行调整，但应保持在右上角位置。

### 5. 更新分类配置

在 `site_config.json` 文件的 `category_assignments` 部分添加你的项目分类：

```json
"category_assignments": {
  "your-toy-name": "分类ID"  // 例如: "interactive-visuals", "creative-tools" 等
}
```

### 6. 生成新的主页

运行主页生成器脚本更新主页：

```bash
python generate_homepage_new.py
```

### 7. 记录开发过程

在 `开发过程` 目录中创建一个新的Markdown文件，记录添加这个玩具的过程，包括：

- 玩具的功能和特点
- 添加过程中的关键步骤
- 任何需要特别注意的部署事项

文件命名格式参考：`XX_添加YourToyName项目.md`，其中XX是序号。

### 8. 提交更改

将所有更改添加到Git并提交：

```bash
git add your-toy-name/
git add site_config.json
git add index.html
git add 开发过程/XX_添加YourToyName项目.md
git commit -m "添加新玩具：你的玩具名称"
git push
```

## 部署说明

项目使用Cloudflare Pages进行部署。当新的提交推送到GitHub仓库后，Cloudflare Pages会自动构建和部署更新的网站。

部署配置：
- **Production branch**: `main`
- **Framework preset**: `None` / `Static HTML`
- **Build command**: (留空)
- **Build output directory**: `/` (根目录)

## 贡献指南

欢迎贡献新的网页玩具！除了上述的提交步骤外，请注意：

1. 确保你的代码遵循良好的HTML、CSS和JavaScript实践
2. 优化资源，保持页面加载速度快
3. 测试在不同设备和浏览器上的兼容性
4. 提供清晰的用户指引，让用户知道如何与你的玩具交互

## 许可证

["leave something shocking for the world" license]