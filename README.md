# Web Toys Collection (网页玩具合集) - Little Shock

一个由 Little Shock 团队创建的有趣网页小玩具集合，每个玩具都是独立的交互式网页体验。

## 项目简介

这个项目收集了各种有趣的网页交互体验，每个"玩具"都是一个独立的网页应用，专注于特定的视觉效果或交互模式。这些玩具通常具有以下特点：

- 单页面应用，无需后端
- 专注于有趣的视觉效果或交互体验
- 支持移动设备和桌面设备
- 轻量级，加载迅速

## 当前玩具列表

项目按照以下分类组织：

### 互动视觉
1. **赛博流光 (Cyber Light Flow)** - 触摸屏幕创造流动的光效波纹，长按产生涟漪，点击爆发粒子，体验流光溢彩的视觉盛宴。
2. **墨韵 (Ink Rhythm)** - 模拟水墨在纸上的流动效果，创造出独特的东方美学风格的数字艺术作品。
3. **元素波纹 (Element Ripples)** - 创造出动态的元素波纹效果，通过触摸互动产生美丽的视觉波纹。
4. **微光沙盘 (Luminous Sandbox)** - 交互式发光沙粒模拟，通过触摸和设备倾斜与沙粒互动，创造美丽的光效沙景。
5. **微光沙盘 WebGL** - 高性能WebGL版微光沙盘，使用GPU加速渲染，提供更流畅的体验和更清晰的视觉效果。

### 物理模拟
1. **量子弹球 (Quantum Pinball)** - 创造你的专属弹球世界，上传自定义图片作为弹球，绘制障碍物，体验物理碰撞的乐趣。
2. **黑洞效果 (Black Hole)** - 模拟黑洞引力场效果，创造出吸引周围物体的视觉体验。
3. **三体模拟 (Three-Body Simulation)** - 基于经典三体问题的宇宙物理模拟，观察三个恒星在引力作用下的轨迹变化和混沌行为。

### 创意工具
1. **赛博故障风 (Cyberpunk Glitch Effect)** - 为图片添加赛博朋克风格的故障艺术效果，可调节多种参数创造独特视觉体验。
2. **光绘 (Light Painting)** - 使用光线绘制出美丽的图案，创造出光的艺术作品。
3. **织梦 (Fabric Dreams)** - 编织梦幻般的图案和纹理，创造出独特的视觉艺术作品。
4. **量子涂鸦 (Quantum Doodle)** - 一个结合人工智能的创意绘画工具，用户的简单涂鸦会演变成复杂的量子风格艺术。

### 音乐与声音
1. **声音雕塑 (Sound Sculpture)** - 通过触摸和手势创造出独特的声音和视觉效果，将声音可视化为动态雕塑。
2. **节奏星图 (Rhythm Constellation)** - 将音乐节奏转化为星空图案的互动体验，通过触摸创造音乐和视觉效果。
3. **电子木鱼 (Electronic Wooden Fish)** - 敲击木鱼积攒功德，连击有特效和音效，支持上传自定义角色图片，体验现代化的电子木鱼玩具。

### 视觉特效
1. **赛博闪卡 (Cyber Holofoil Card)** - 模拟全息闪卡效果，随着视角变化呈现出炫彩光泽，支持自定义图片。
2. **Holo-Card Tilt** - 上传角色图，即刻生成可随手机姿态闪彩折射的全息卡，并能导出动图/短片。
3. **神经元模拟 (Synaptic Dreams)** - 模拟神经网络连接的视觉效果，创造出流动的神经元网络动画。
4. **蜘蛛网效果 (Starborne Garden)** - 创造出动态的蜘蛛网状连接效果，随鼠标移动产生互动变化。

### 游戏与娱乐
1. **找到不动的 emoji (Find Static Emoji)** - 在多个移动的emoji中找出唯一一个静止不动的emoji。
2. **赛博流麻 (Cyber Mahjong)** - 赛博风格的麻将游戏体验，结合现代视觉效果的麻将玩法。

### 实用工具
1. **放大镜 (Magnifier)** - 网页内容放大工具，帮助查看细节或辅助阅读。

### 归档项目
1. **闪卡效果 (旧版) (Holofoil Card)** - 早期版本的全息闪卡效果，已被新版赛博闪卡替代。
2. **赛博流麻 (旧版) (Cyber Mahjong Old)** - 早期版本的赛博风格麻将游戏，已被新版赛博流麻替代。

## 项目结构

项目采用灵活的分类系统组织，所有分类和项目分配都集中在 `site_config.json` 文件中管理。

### 主要文件

- `index.html`: 主页，展示所有项目，支持分类导航
- `site_config.json`: 网站配置文件，包含分类定义和项目分配
- `generate_homepage_new.py`: 主页生成器脚本（最新版本）
- `generate_homepage_flexible.py`: 灵活版主页生成器脚本
- `manage_categories.py`: 分类管理工具
- `README.md`: 项目说明文档

### 目录结构

```
web-toys/
├── index.html                # 主导航页面
├── site_config.json          # 网站配置文件
├── generate_homepage_new.py  # 主页生成器脚本
├── README.md                 # 项目说明文档
├── 开发过程/                  # 开发记录文档
│   ├── 01_项目分析与初步了解.md
│   ├── 02_添加Spiderweb项目.md
│   └── ... (其他开发记录)
├── neuron/                   # 神经元模拟玩具
│   ├── index.html
│   └── project.json          # 项目配置文件
├── spiderweb/                # 蜘蛛网效果玩具
│   ├── index.html
│   └── project.json
├── 赛博流光/                  # 赛博流光玩具
│   ├── index.html
│   ├── assets/
│   │   ├── textures/
│   │   ├── models/
│   │   └── presets/
│   ├── js/
│   ├── css/
│   └── project.json
├── 微光沙盘/                  # 微光沙盘玩具
│   ├── index.html
│   ├── js/
│   ├── css/
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

所有分类和项目分配都在 `site_config.json` 文件中定义，这使得添加新分类或重新分配项目变得简单。主页生成器脚本会读取这个配置文件，自动生成带有分类导航的主页。

## 如何提交新玩具

如果你想为这个集合添加新的网页玩具，请按照以下步骤操作：

### 1. 准备你的玩具

确保你的网页玩具满足以下条件：

- 完全自包含在一个目录中，主文件命名为 `index.html`
- 不依赖外部服务器或API（纯前端实现）
- 具有响应式设计，在移动设备和桌面设备上都能良好工作
- 代码整洁，注释充分
- 包含返回主菜单的链接（参考现有玩具的实现）
- 针对移动设备优化，确保良好的触摸体验

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
  "order": 1  // 在分类中的显示顺序（可选）
}
```

### 4. 添加返回链接

在你的玩具页面中添加一个返回主菜单的链接，样式可以参考现有玩具。基本HTML结构如下：

```html
<a href="../index.html" class="back-link">返回主菜单</a>
```

样式可以根据你的玩具页面背景进行调整，但应保持在右上角位置。参考示例样式：

```css
.back-link {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 20;
    background: rgba(0,0,0,0.6);
    padding: 0.5rem 1rem;
    border-radius: 5px;
    color: #eee;
    text-decoration: none;
    font-size: 0.9rem;
    backdrop-filter: blur(3px);
    transition: background 0.3s;
}
.back-link:hover {
    background: rgba(0,0,0,0.8);
}
```

### 5. 更新分类配置

在 `site_config.json` 文件的 `category_assignments` 部分添加你的项目分类：

```json
"category_assignments": {
  "your-toy-name": "分类ID"  // 例如: "interactive-visuals", "creative-tools" 等
}
```

可用的分类ID包括：
- `interactive-visuals`: 互动视觉
- `physics-simulations`: 物理模拟
- `creative-tools`: 创意工具
- `music-and-sound`: 音乐与声音
- `visual-effects`: 视觉特效
- `games-and-entertainment`: 游戏与娱乐
- `utility-tools`: 实用工具
- `archived`: 归档项目

### 6. 生成新的主页

运行主页生成器脚本更新主页：

```bash
python generate_homepage_new.py
```

或者使用灵活版本的生成器：

```bash
python generate_homepage_flexible.py
```

### 7. 记录开发过程

在 `开发过程` 目录中创建一个新的Markdown文件，记录添加这个玩具的过程，包括：

- 玩具的功能和特点
- 添加过程中的关键步骤
- 任何需要特别注意的部署事项
- 未来可能的改进方向

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

提交后，Cloudflare Pages会自动构建和部署更新的网站。

## 部署说明

项目使用Cloudflare Pages进行部署。当新的提交推送到GitHub仓库后，Cloudflare Pages会自动构建和部署更新的网站。

部署配置：
- **Production branch**: `main`
- **Framework preset**: `None` / `Static HTML`
- **Build command**: (留空)
- **Build output directory**: `/` (根目录)

这种配置允许直接部署静态HTML文件，无需构建步骤，非常适合纯前端项目。

## 移动端优化

所有玩具都应该针对移动设备进行优化，包括：

1. **响应式设计**：适应不同屏幕尺寸
2. **触摸友好**：针对触摸操作优化的交互界面
3. **性能优化**：针对移动设备的性能限制进行优化
4. **设备API集成**：适当利用设备方向、振动等移动设备特有功能
5. **离线支持**：确保在无网络环境下也能正常使用

## 贡献指南

欢迎贡献新的网页玩具！除了上述的提交步骤外，请注意：

1. **代码质量**：确保你的代码遵循良好的HTML、CSS和JavaScript实践
2. **性能优化**：优化资源，保持页面加载速度快
3. **兼容性测试**：测试在不同设备和浏览器上的兼容性
4. **用户体验**：提供清晰的用户指引，让用户知道如何与你的玩具交互
5. **移动优先**：优先考虑移动设备上的体验
6. **创新性**：尝试创造独特的交互体验或视觉效果
7. **文档完善**：提供详细的项目说明和开发文档

## 设计理念

Little Shock 团队的网页玩具设计理念包括：

- **简约审美**：清晰、简约的界面设计
- **舒适交互**：流畅、自然的交互体验
- **呼吸感**：通过动画和效果创造有机、自然的节奏
- **高级感**：精致的视觉效果和音效设计
- **移动优先**：优先考虑移动设备上的体验
- **创新性**：尝试创造独特的交互体验或视觉效果

## 许可证

["leave something shocking for the world" license]

---

© 2025 Little Shock 团队 | [Little Shock 专区 @ WaytoAGI](https://waytoagi.feishu.cn/wiki/UaxewECiHiVBmykypR0c48FhnFd)