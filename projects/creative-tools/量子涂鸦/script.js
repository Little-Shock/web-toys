// 量子涂鸦 (Quantum Doodle) - Main Script
// 基于Three.js实现量子视觉效果，优化版本

// 全局变量
let drawingCanvas, drawingContext;
let effectCanvas, effectContext;
let isDrawing = false;
let lastX = 0, lastY = 0;
let particles = [];
let evolutionSpeed = 0.3; // 降低默认速度，使效果更持久
let colorScheme = 'quantum';
let brushType = 'quantum';
let brushSize = 15;
let particleLifeMultiplier = 4; // 粒子寿命倍数
let blendMode = 'lighter';
let animationId;
let renderer, scene, camera;
let quantumEffect;
let drawHistory = []; // 用于撤销功能
let controlsVisible = false; // 控制面板可见性

// 初始化函数 - 移除Three.js以提高性能
function init() {
    // 获取画布元素
    drawingCanvas = document.getElementById('drawingCanvas');
    effectCanvas = document.getElementById('effectCanvas');

    // 设置画布尺寸
    resizeCanvases();

    // 获取绘图上下文
    drawingContext = drawingCanvas.getContext('2d');
    effectContext = effectCanvas.getContext('2d');

    // 设置初始混合模式
    effectContext.globalCompositeOperation = blendMode;

    // 添加事件监听器
    addEventListeners();

    // 开始动画循环
    animate();

    // 保存初始状态
    saveDrawState();
}

// 调整画布尺寸 - 移除Three.js相关代码
function resizeCanvases() {
    const container = document.querySelector('.canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 设置画布尺寸
    drawingCanvas.width = width;
    drawingCanvas.height = height;
    effectCanvas.width = width;
    effectCanvas.height = height;
}

// 添加事件监听器
function addEventListeners() {
    // 触摸和鼠标事件
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseleave', stopDrawing);

    drawingCanvas.addEventListener('touchstart', handleTouchStart);
    drawingCanvas.addEventListener('touchmove', handleTouchMove);
    drawingCanvas.addEventListener('touchend', handleTouchEnd);

    // 控制面板事件
    const controlsToggle = document.getElementById('controlsToggle');
    const controlsPanel = document.getElementById('controlsPanel');
    const closePanel = document.getElementById('closePanel');

    controlsToggle.addEventListener('click', () => {
        controlsVisible = !controlsVisible;
        if (controlsVisible) {
            controlsPanel.classList.add('active');
        } else {
            controlsPanel.classList.remove('active');
        }
    });

    closePanel.addEventListener('click', () => {
        controlsVisible = false;
        controlsPanel.classList.remove('active');
    });

    // 控制UI事件
    document.getElementById('brushType').addEventListener('change', (e) => {
        brushType = e.target.value;
    });

    document.getElementById('brushSize').addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
    });

    document.getElementById('evolutionSpeed').addEventListener('input', (e) => {
        evolutionSpeed = parseInt(e.target.value) / 100;
    });

    document.getElementById('particleLife').addEventListener('input', (e) => {
        particleLifeMultiplier = parseInt(e.target.value) / 50;
    });

    document.getElementById('colorScheme').addEventListener('change', (e) => {
        colorScheme = e.target.value;
    });

    document.getElementById('blendMode').addEventListener('change', (e) => {
        blendMode = e.target.value;
    });

    // 按钮事件
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('clearBtn2').addEventListener('click', clearCanvas);
    document.getElementById('saveBtn').addEventListener('click', saveImage);
    document.getElementById('saveGifBtn').addEventListener('click', saveGif);
    document.getElementById('undoBtn').addEventListener('click', undoLastDraw);

    // 窗口调整大小事件
    window.addEventListener('resize', resizeCanvases);

    // 防止移动端缩放和滚动
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

// 绘画相关函数
function startDrawing(e) {
    isDrawing = true;
    const pos = getPointerPosition(e);
    lastX = pos.x;
    lastY = pos.y;

    // 重置点历史
    pointHistory = [];

    // 添加初始点到历史记录
    pointHistory.push({x: pos.x, y: pos.y});

    // 创建初始粒子
    createParticles(pos.x, pos.y);

    // 绘制一个小点作为起点
    drawingContext.beginPath();
    drawingContext.arc(pos.x, pos.y, brushSize/2, 0, Math.PI * 2);
    drawingContext.fillStyle = getBaseColor();
    drawingContext.fill();
}

// 添加一个点历史数组，用于平滑线条
let pointHistory = [];
const HISTORY_SIZE = 5; // 保留最近的5个点用于平滑

// 存储绘制的线段，用于淡出效果
let strokeSegments = [];
const STROKE_LIFETIME = 5000; // 线段存在时间（毫秒）

function draw(e) {
    if (!isDrawing) return;

    const pos = getPointerPosition(e);
    const currentX = pos.x;
    const currentY = pos.y;

    // 计算距离和速度
    const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));

    // 如果距离太小，不绘制（防止点击产生的小点）
    if (distance < 1) return;

    // 添加当前点到历史记录
    pointHistory.push({x: currentX, y: currentY});

    // 保持历史记录在指定大小
    if (pointHistory.length > HISTORY_SIZE) {
        pointHistory.shift();
    }

    // 绘制线条
    drawLine(lastX, lastY, currentX, currentY);

    // 根据距离和速度创建粒子，距离越大创建越多粒子
    const particleCount = Math.max(1, Math.floor(distance / 2));

    // 在线段上均匀分布粒子
    for (let i = 0; i < particleCount; i++) {
        const ratio = i / particleCount;
        const x = lastX + (currentX - lastX) * ratio;
        const y = lastY + (currentY - lastY) * ratio;
        createParticles(x, y);
    }

    // 更新位置
    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    if (isDrawing) {
        // 如果有足够的历史点，绘制一个平滑的结束曲线
        if (pointHistory.length >= 2) {
            const lastPoint = pointHistory[pointHistory.length - 1];

            // 创建一个小的收尾效果
            drawingContext.beginPath();
            drawingContext.arc(lastPoint.x, lastPoint.y, brushSize/3, 0, Math.PI * 2);

            // 使用渐变填充
            const gradient = drawingContext.createRadialGradient(
                lastPoint.x, lastPoint.y, 0,
                lastPoint.x, lastPoint.y, brushSize/2
            );

            const baseColor = getBaseColor();
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(1, 'transparent');

            drawingContext.fillStyle = gradient;
            drawingContext.fill();

            // 在结束点添加一些额外的粒子
            createParticles(lastPoint.x, lastPoint.y);
        }

        isDrawing = false;
        // 保存当前绘图状态用于撤销
        saveDrawState();
    }
}

// 保存绘图状态
function saveDrawState() {
    // 限制历史记录长度
    if (drawHistory.length > 10) {
        drawHistory.shift();
    }

    // 创建临时画布来保存当前状态
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 绘制所有当前线段到临时画布
    for (const segment of strokeSegments) {
        tempCtx.globalAlpha = segment.opacity;
        tempCtx.drawImage(segment.canvas, 0, 0);
    }

    // 保存当前画布状态和线段状态
    drawHistory.push({
        imageData: tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height),
        segments: JSON.parse(JSON.stringify(strokeSegments.map(s => ({
            createdAt: s.createdAt,
            opacity: s.opacity
        })))),
        canvases: strokeSegments.map(s => s.canvas)
    });
}

// 撤销上一步
function undoLastDraw() {
    if (drawHistory.length > 1) {
        // 移除当前状态
        drawHistory.pop();

        // 恢复上一个状态
        const prevState = drawHistory[drawHistory.length - 1];

        // 清除当前画布
        drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        // 恢复图像数据
        drawingContext.putImageData(prevState.imageData, 0, 0);

        // 恢复线段状态
        strokeSegments = prevState.segments.map((s, i) => ({
            canvas: prevState.canvases[i],
            createdAt: s.createdAt,
            opacity: s.opacity
        }));
    } else if (drawHistory.length === 1) {
        // 只有初始状态，清空画布
        clearCanvas();
    }
}

// 触摸事件处理
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrawing(touch);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        draw(touch);
    } else if (e.touches.length === 2) {
        // 双指手势控制演变方向
        handleMultiTouchGesture(e);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    stopDrawing();
}

// 获取指针位置
function getPointerPosition(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// 绘制线条 - 增强美观度，添加淡出效果
function drawLine(x1, y1, x2, y2) {
    // 计算线条长度
    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    // 根据线条长度调整笔刷大小，使快速移动时线条更细，慢速移动时线条更粗
    // 更平滑的速度因子计算
    const speedFactor = Math.min(1, Math.max(0.3, 30 / (lineLength + 10)));
    const dynamicBrushSize = brushSize * speedFactor * 1.5; // 增加线条宽度，形成色带效果

    // 创建更丰富的渐变
    const gradient = drawingContext.createLinearGradient(x1, y1, x2, y2);
    const baseColor = getBaseColor();
    const complementaryColor = getComplementaryColor(baseColor);
    const brightColor = getBrighterColor(baseColor);

    // 多色渐变，使线条更有层次感
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.3, brightColor);
    gradient.addColorStop(0.5, complementaryColor);
    gradient.addColorStop(0.7, brightColor);
    gradient.addColorStop(1, baseColor);

    // 创建一个临时画布来绘制线段
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 使用点历史记录创建更平滑的曲线
    let path = new Path2D(); // 使用Path2D对象存储路径

    if (pointHistory.length >= 3) {
        // 获取最近的几个点
        const p0 = pointHistory[pointHistory.length - 3]; // 倒数第三个点
        const p1 = pointHistory[pointHistory.length - 2]; // 倒数第二个点
        const p2 = pointHistory[pointHistory.length - 1]; // 最新点
        const p3 = {x: x2, y: y2}; // 当前点

        // 使用Catmull-Rom样条曲线创建平滑路径
        path.moveTo(p1.x, p1.y);

        // 计算控制点
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        // 绘制三次贝塞尔曲线
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    else if (pointHistory.length === 2) {
        // 只有两个点时使用二次贝塞尔曲线
        const p0 = pointHistory[pointHistory.length - 2];
        const p1 = pointHistory[pointHistory.length - 1];

        path.moveTo(p0.x, p0.y);

        // 计算控制点
        const cpx = (p0.x + p1.x + x2) / 3;
        const cpy = (p0.y + p1.y + y2) / 3;

        path.quadraticCurveTo(cpx, cpy, p1.x, p1.y);
        path.lineTo(x2, y2);
    }
    else {
        // 点不够时使用简单线段
        path.moveTo(x1, y1);
        path.lineTo(x2, y2);
    }

    // 在临时画布上绘制线条
    tempCtx.strokeStyle = gradient;
    tempCtx.lineWidth = dynamicBrushSize;
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';

    // 添加适度的发光效果
    tempCtx.shadowColor = brightColor;
    tempCtx.shadowBlur = dynamicBrushSize * 1.2;

    // 绘制线条
    tempCtx.stroke(path);

    // 绘制线段端点，使线条更加圆润
    tempCtx.beginPath();
    tempCtx.arc(x2, y2, dynamicBrushSize/2, 0, Math.PI * 2);
    tempCtx.fillStyle = gradient;
    tempCtx.fill();

    // 将线段添加到strokeSegments数组
    strokeSegments.push({
        canvas: tempCanvas,
        createdAt: Date.now(),
        opacity: 1.0
    });

    // 限制线段数量
    if (strokeSegments.length > 50) {
        strokeSegments = strokeSegments.slice(-50);
    }

    // 重置阴影
    tempCtx.shadowColor = 'transparent';
    tempCtx.shadowBlur = 0;
}

// 获取更亮的颜色变体
function getBrighterColor(color) {
    // 从HSL颜色字符串中提取色相、饱和度和亮度
    const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (hslMatch && hslMatch.length >= 4) {
        const hue = parseInt(hslMatch[1]);
        const saturation = parseInt(hslMatch[2]);
        const lightness = parseInt(hslMatch[3]);

        // 增加亮度，但保持在合理范围内
        const newLightness = Math.min(lightness + 15, 85);

        // 返回更亮的颜色
        return color.replace(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/,
                            `hsla(${hue}, ${saturation}%, ${newLightness}%`);
    }
    return color;
}

// 获取基础颜色
function getBaseColor() {
    switch (colorScheme) {
        case 'quantum':
            return `hsla(${Math.random() * 60 + 200}, 80%, 60%, 0.8)`;
        case 'elegant':
            return `hsla(${Math.random() * 30 + 260}, 60%, 55%, 0.8)`;
        case 'pastel':
            return `hsla(${Math.random() * 360}, 50%, 75%, 0.7)`;
        case 'monochrome':
            return `hsla(240, 10%, ${Math.random() * 30 + 40}%, 0.8)`;
        case 'aurora':
            return `hsla(${Math.random() * 60 + 120}, 70%, 60%, 0.8)`;
        default:
            return `hsla(${Math.random() * 360}, 70%, 60%, 0.8)`;
    }
}

// 获取互补色
function getComplementaryColor(baseColor) {
    // 从HSL颜色字符串中提取色相
    const hueMatch = baseColor.match(/hsla?\((\d+)/);
    if (hueMatch && hueMatch[1]) {
        const hue = parseInt(hueMatch[1]);
        // 计算互补色（色相相差180度）
        const complementaryHue = (hue + 180) % 360;

        // 保持相同的饱和度和亮度，但使用互补色相
        return baseColor.replace(/hsla?\(\d+/, `hsla(${complementaryHue}`);
    }
    return baseColor;
}

// 粒子系统 - 简化版本以提高性能
function createParticles(x, y) {
    // 根据笔刷类型创建不同数量和特性的粒子
    const count = getBrushParticleCount();

    for (let i = 0; i < count; i++) {
        // 减少粒子生命周期，提高性能
        const lifeBase = Math.random() * 50 + 50;
        const life = lifeBase * particleLifeMultiplier;

        // 创建简化的粒子对象，减少属性
        const particle = {
            x: x + (Math.random() - 0.5) * brushSize * 2,
            y: y + (Math.random() - 0.5) * brushSize * 2,
            size: Math.random() * brushSize * 0.4 + brushSize * 0.1,
            color: getParticleColor(),
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: life,
            maxLife: life,
            type: brushType,
            phase: Math.random() * Math.PI * 2
        };

        particles.push(particle);
    }

    // 限制粒子数量，防止性能问题 - 大幅减少最大粒子数
    if (particles.length > 300) {
        particles = particles.slice(-300);
    }
}

// 根据笔刷类型获取粒子数量 - 大幅减少粒子数量以提高性能
function getBrushParticleCount() {
    switch (brushType) {
        case 'quantum':
            return Math.floor(brushSize * 0.3);
        case 'wave':
            return Math.floor(brushSize * 0.2);
        case 'entangle':
            return Math.floor(brushSize * 0.4);
        case 'particle':
            return Math.floor(brushSize * 0.5);
        case 'flow':
            return Math.floor(brushSize * 0.3);
        default:
            return Math.floor(brushSize * 0.3);
    }
}

// 获取粒子颜色
function getParticleColor() {
    // 与基础颜色类似，但有细微变化
    switch (colorScheme) {
        case 'quantum':
            return `hsla(${Math.random() * 60 + 200}, 80%, 70%, 0.7)`;
        case 'elegant':
            return `hsla(${Math.random() * 30 + 260}, 60%, 65%, 0.7)`;
        case 'pastel':
            return `hsla(${Math.random() * 360}, 50%, 80%, 0.6)`;
        case 'monochrome':
            return `hsla(240, 10%, ${Math.random() * 40 + 50}%, 0.7)`;
        case 'aurora':
            return `hsla(${Math.random() * 60 + 120}, 70%, 65%, 0.7)`;
        default:
            return `hsla(${Math.random() * 360}, 70%, 70%, 0.7)`;
    }
}

// 更新和绘制粒子 - 简化版本以提高性能
function updateParticles() {
    // 清除画布
    effectContext.clearRect(0, 0, effectCanvas.width, effectCanvas.height);

    // 设置混合模式
    effectContext.globalCompositeOperation = blendMode;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 简化的粒子更新
        updateParticleByType(p, i);

        // 简化的粒子绘制
        drawParticle(p);

        // 加快生命值减少速度
        p.life -= 1.0;

        // 移除死亡粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

// 根据粒子类型更新粒子 - 极度简化版本以提高性能
function updateParticleByType(particle, index) {
    // 计算生命周期比例
    const lifeRatio = particle.life / particle.maxLife;

    switch (particle.type) {
        case 'quantum':
            // 量子笔刷：简化的运动
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
            break;

        case 'wave':
            // 波函数笔刷：简化的波浪运动
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed + Math.sin(particle.phase) * evolutionSpeed;
            break;

        case 'entangle':
            // 纠缠笔刷：简化的运动
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
            break;

        case 'particle':
            // 粒子笔刷：简化的运动
            particle.x += particle.vx * evolutionSpeed * 1.2;
            particle.y += particle.vy * evolutionSpeed * 1.2;
            break;

        case 'flow':
            // 流光笔刷：简化的运动
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
            break;

        default:
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
    }

    // 限制粒子在画布范围内
    particle.x = Math.max(0, Math.min(effectCanvas.width, particle.x));
    particle.y = Math.max(0, Math.min(effectCanvas.height, particle.y));

    // 缓慢减小速度
    particle.vx *= 0.98;
    particle.vy *= 0.98;
}

// 绘制单个粒子 - 极度简化版本以提高性能
function drawParticle(p) {
    // 计算生命周期比例
    const lifeRatio = p.life / p.maxLife;

    // 根据粒子类型绘制简化形状
    switch (p.type) {
        case 'quantum':
            // 量子笔刷：简单圆形
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
            break;

        case 'wave':
            // 波函数笔刷：简单圆形
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
            break;

        case 'entangle':
            // 纠缠笔刷：简单圆形
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
            break;

        case 'particle':
            // 粒子笔刷：简单方块
            effectContext.fillStyle = p.color;
            effectContext.fillRect(p.x - p.size/2 * lifeRatio, p.y - p.size/2 * lifeRatio,
                                  p.size * lifeRatio, p.size * lifeRatio);
            break;

        case 'flow':
            // 流光笔刷：简单圆形
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio * 1.5, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
            break;

        default:
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
    }
}

// Three.js 相关函数
function initThreeJS() {
    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    const width = drawingCanvas.width;
    const height = drawingCanvas.height;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '3';
    document.querySelector('.canvas-container').appendChild(renderer.domElement);

    // 创建量子效果着色器
    createQuantumEffect();
}

// 创建量子效果着色器
function createQuantumEffect() {
    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(10, 10);

    // 创建着色器材质
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(drawingCanvas.width, drawingCanvas.height) },
            drawingTexture: { value: new THREE.CanvasTexture(drawingCanvas) },
            colorScheme: { value: getColorSchemeValue() }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            uniform sampler2D drawingTexture;
            uniform float colorScheme;
            varying vec2 vUv;

            // 量子波函数模拟
            float quantumWave(vec2 p, float t) {
                return sin(p.x * 10.0 + t) * cos(p.y * 10.0 + t) * 0.5 + 0.5;
            }

            // 扭曲函数
            vec2 distort(vec2 uv, float t) {
                vec2 distortedUV = uv;
                float distortionX = sin(uv.y * 8.0 + t * 0.5) * 0.01;
                float distortionY = cos(uv.x * 8.0 + t * 0.5) * 0.01;

                distortedUV.x += distortionX;
                distortedUV.y += distortionY;

                return distortedUV;
            }

            // 色彩调整
            vec3 adjustColor(vec3 color, float scheme) {
                if (scheme < 1.0) {
                    // 量子色彩
                    return color * vec3(0.9, 1.1, 1.2);
                } else if (scheme < 2.0) {
                    // 优雅色调
                    return color * vec3(1.0, 0.9, 1.2);
                } else if (scheme < 3.0) {
                    // 柔和色彩
                    return mix(color, vec3(0.9, 0.9, 1.0), 0.2);
                } else if (scheme < 4.0) {
                    // 单色调
                    float gray = dot(color, vec3(0.299, 0.587, 0.114));
                    return vec3(gray * 0.9, gray * 0.95, gray * 1.1);
                } else {
                    // 极光色彩
                    return color * vec3(0.8, 1.2, 1.0);
                }
            }

            void main() {
                // 采样绘图纹理
                vec4 drawingColor = texture2D(drawingTexture, vUv);

                // 只在有绘制的区域应用效果
                if (drawingColor.a > 0.01) {
                    // 创建量子效果
                    vec2 uv = vUv;
                    float wave = quantumWave(uv, time);

                    // 扭曲UV坐标
                    vec2 distortedUV = distort(uv, time);

                    // 重新采样扭曲后的纹理
                    vec4 distortedColor = texture2D(drawingTexture, distortedUV);

                    // 混合原始颜色和扭曲颜色
                    vec4 finalColor = mix(drawingColor, distortedColor, 0.3);

                    // 添加量子光晕效果
                    finalColor.rgb += vec3(wave * 0.15) * drawingColor.a;

                    // 调整颜色
                    finalColor.rgb = adjustColor(finalColor.rgb, colorScheme);

                    gl_FragColor = finalColor;
                } else {
                    gl_FragColor = vec4(0.0);
                }
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    // 创建网格并添加到场景
    quantumEffect = new THREE.Mesh(geometry, material);
    scene.add(quantumEffect);
}

// 获取颜色方案值（用于着色器）
function getColorSchemeValue() {
    switch (colorScheme) {
        case 'quantum': return 0.0;
        case 'elegant': return 1.0;
        case 'pastel': return 2.0;
        case 'monochrome': return 3.0;
        case 'aurora': return 4.0;
        default: return 0.0;
    }
}

// 动画循环 - 添加线段淡出效果
function animate() {
    animationId = requestAnimationFrame(animate);

    // 清除主绘图画布
    drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    // 绘制所有线段，应用淡出效果
    const currentTime = Date.now();

    // 处理每个线段
    for (let i = strokeSegments.length - 1; i >= 0; i--) {
        const segment = strokeSegments[i];
        const age = currentTime - segment.createdAt;

        // 计算不透明度，随时间减少
        if (age < STROKE_LIFETIME) {
            // 前半段时间保持完全不透明
            if (age < STROKE_LIFETIME / 2) {
                segment.opacity = 1.0;
            } else {
                // 后半段时间线性淡出
                segment.opacity = 1.0 - (age - STROKE_LIFETIME / 2) / (STROKE_LIFETIME / 2);
            }

            // 绘制线段，应用不透明度
            drawingContext.globalAlpha = segment.opacity;
            drawingContext.drawImage(segment.canvas, 0, 0);
        } else {
            // 超过生命周期，移除线段
            strokeSegments.splice(i, 1);
        }
    }

    // 重置全局透明度
    drawingContext.globalAlpha = 1.0;

    // 更新粒子
    updateParticles();
}

// 清除画布
function clearCanvas() {
    // 保存当前状态用于撤销
    saveDrawState();

    // 清除画布
    drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    effectContext.clearRect(0, 0, effectCanvas.width, effectCanvas.height);

    // 清除所有粒子和线段
    particles = [];
    strokeSegments = [];

    // 显示清除反馈
    showFeedback('画布已清除');
}

// 显示操作反馈
function showFeedback(message) {
    // 创建反馈元素
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '80px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.background = 'rgba(25, 25, 35, 0.9)';
    feedback.style.color = 'white';
    feedback.style.borderRadius = '20px';
    feedback.style.fontSize = '14px';
    feedback.style.zIndex = '1000';
    feedback.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s ease';

    // 添加到文档
    document.body.appendChild(feedback);

    // 显示反馈
    setTimeout(() => {
        feedback.style.opacity = '1';
    }, 10);

    // 淡出并移除
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 300);
    }, 2000);
}

// 保存图像 - 移除Three.js相关代码
function saveImage() {
    // 创建临时画布合并所有图层
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    const tempContext = tempCanvas.getContext('2d');

    // 绘制背景
    tempContext.fillStyle = '#0a0a14';
    tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 绘制主画布
    tempContext.drawImage(drawingCanvas, 0, 0);

    // 绘制效果画布
    tempContext.drawImage(effectCanvas, 0, 0);

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `量子涂鸦_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    // 显示保存反馈
    showFeedback('图像已保存');
}

// 保存GIF - 移除Three.js相关代码，简化以提高性能
function saveGif() {
    // 显示加载提示
    showFeedback('正在生成GIF，请稍候...');

    // 创建GIF编码器
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: drawingCanvas.width,
        height: drawingCanvas.height,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });

    // 记录当前状态
    const originalParticles = [...particles];

    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    const tempContext = tempCanvas.getContext('2d');

    // 捕获多个帧 - 减少帧数以提高性能
    const frameCount = 20;
    let currentFrame = 0;

    function captureFrame() {
        // 清除临时画布
        tempContext.fillStyle = '#0a0a14';
        tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 绘制主画布
        tempContext.drawImage(drawingCanvas, 0, 0);

        // 更新粒子位置
        updateParticles();

        // 绘制效果画布
        tempContext.drawImage(effectCanvas, 0, 0);

        // 添加帧到GIF
        gif.addFrame(tempCanvas, { delay: 100, copy: true });

        currentFrame++;

        if (currentFrame < frameCount) {
            // 继续捕获下一帧
            setTimeout(captureFrame, 10);
        } else {
            // 完成GIF生成
            gif.on('finished', function(blob) {
                // 创建下载链接
                const link = document.createElement('a');
                link.download = `量子涂鸦动画_${new Date().toISOString().slice(0, 10)}.gif`;
                link.href = URL.createObjectURL(blob);
                link.click();

                // 恢复原始状态
                particles = originalParticles;

                // 显示完成反馈
                showFeedback('GIF已生成并保存');
            });

            gif.render();
        }
    }

    // 开始捕获帧
    captureFrame();
}

// 处理多点触控手势
function handleMultiTouchGesture(e) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    // 计算两个触摸点之间的角度和距离
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 使用角度和距离来影响粒子的运动方向和速度
    for (let i = 0; i < particles.length; i++) {
        // 角度影响方向
        particles[i].vx += Math.cos(angle) * 0.1;
        particles[i].vy += Math.sin(angle) * 0.1;

        // 距离影响速度
        const speedFactor = Math.min(distance / 200, 2);
        particles[i].vx *= speedFactor;
        particles[i].vy *= speedFactor;
    }

    // 创建一些新粒子在两个触摸点之间
    const midX = (touch1.clientX + touch2.clientX) / 2;
    const midY = (touch1.clientY + touch2.clientY) / 2;
    const rect = drawingCanvas.getBoundingClientRect();
    createParticles(midX - rect.left, midY - rect.top);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
