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

## 项目结构

项目采用简单的目录结构：

```
web-toys/
├── index.html                # 主导航页面
├── README.md                 # 项目说明文档
├── neuron/                   # 神经元模拟玩具
│   └── index.html
├── spiderweb/                # 蜘蛛网效果玩具
│   └── index.html
├── Holofoil Card/            # 闪卡效果玩具 (旧版)
│   └── index.html
├── 赛博闪卡/                  # 赛博闪卡玩具 (新版)
│   └── index.html
├── find_emoji/               # 表情符号查找器
│   ├── index.html
│   ├── css/
│   └── js/
└── 开发过程/                  # 开发文档目录
    └── ...
```

每个玩具都有自己的目录，包含至少一个 `index.html` 文件，主页面通过链接引导用户访问各个玩具。

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
    └── index.html
    └── (其他必要的资源文件)
```

### 3. 添加返回链接

在你的玩具页面中添加一个返回主菜单的链接，样式可以参考现有玩具。基本HTML结构如下：

```html
<a href="../index.html" class="back-link">返回主菜单</a>
```

样式可以根据你的玩具页面背景进行调整，但应保持在右上角位置。

### 4. 更新主导航页面

修改根目录的 `index.html` 文件，添加指向你的新玩具的链接：

```html
<a href="your-toy-name/index.html" class="button">你的玩具名称</a>
```

### 5. 记录开发过程

在 `开发过程` 目录中创建一个新的Markdown文件，记录添加这个玩具的过程，包括：

- 玩具的功能和特点
- 添加过程中的关键步骤
- 任何需要特别注意的部署事项

文件命名格式参考：`XX_添加YourToyName项目.md`，其中XX是序号。

### 6. 提交更改

将所有更改添加到Git并提交：

```bash
git add your-toy-name/
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