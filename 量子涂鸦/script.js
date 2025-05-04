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

// 初始化函数
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

    // 初始化Three.js
    initThreeJS();

    // 添加事件监听器
    addEventListeners();

    // 开始动画循环
    animate();

    // 保存初始状态
    saveDrawState();
}

// 调整画布尺寸
function resizeCanvases() {
    const container = document.querySelector('.canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 设置画布尺寸
    drawingCanvas.width = width;
    drawingCanvas.height = height;
    effectCanvas.width = width;
    effectCanvas.height = height;

    // 如果Three.js已初始化，也更新其尺寸
    if (renderer) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
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

    // 创建初始粒子
    createParticles(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;

    const pos = getPointerPosition(e);
    const currentX = pos.x;
    const currentY = pos.y;

    // 计算距离和速度
    const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));

    // 如果距离太小，不绘制（防止点击产生的小点）
    if (distance < 1) return;

    // 绘制线条
    drawLine(lastX, lastY, currentX, currentY);

    // 根据距离和速度创建粒子
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

    // 保存当前画布状态
    drawHistory.push(drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
}

// 撤销上一步
function undoLastDraw() {
    if (drawHistory.length > 1) {
        // 移除当前状态
        drawHistory.pop();
        // 恢复上一个状态
        const prevState = drawHistory[drawHistory.length - 1];
        drawingContext.putImageData(prevState, 0, 0);
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

// 绘制线条
function drawLine(x1, y1, x2, y2) {
    // 获取渐变色
    const gradient = drawingContext.createLinearGradient(x1, y1, x2, y2);
    const baseColor = getBaseColor();
    const complementaryColor = getComplementaryColor(baseColor);

    // 创建平滑渐变
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.5, complementaryColor);
    gradient.addColorStop(1, baseColor);

    // 绘制线条
    drawingContext.beginPath();
    drawingContext.moveTo(x1, y1);
    drawingContext.lineTo(x2, y2);
    drawingContext.strokeStyle = gradient;
    drawingContext.lineWidth = brushSize;
    drawingContext.lineCap = 'round';
    drawingContext.lineJoin = 'round';

    // 添加阴影效果
    drawingContext.shadowColor = complementaryColor;
    drawingContext.shadowBlur = brushSize / 2;

    drawingContext.stroke();

    // 重置阴影
    drawingContext.shadowColor = 'transparent';
    drawingContext.shadowBlur = 0;
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

// 粒子系统
function createParticles(x, y) {
    // 根据笔刷类型创建不同数量和特性的粒子
    const count = getBrushParticleCount();

    for (let i = 0; i < count; i++) {
        // 计算粒子生命周期，使用粒子寿命倍数
        const lifeBase = Math.random() * 100 + 150;
        const life = lifeBase * particleLifeMultiplier;

        // 创建粒子对象
        const particle = {
            x: x + (Math.random() - 0.5) * brushSize * 2,
            y: y + (Math.random() - 0.5) * brushSize * 2,
            size: Math.random() * brushSize * 0.5 + brushSize * 0.2,
            color: getParticleColor(),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: life,
            maxLife: life,
            type: brushType,
            phase: Math.random() * Math.PI * 2,
            frequency: Math.random() * 0.05 + 0.01,
            opacity: Math.random() * 0.5 + 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };

        particles.push(particle);
    }

    // 限制粒子数量，防止性能问题
    if (particles.length > 2000) {
        particles = particles.slice(-2000);
    }
}

// 根据笔刷类型获取粒子数量
function getBrushParticleCount() {
    switch (brushType) {
        case 'quantum':
            return Math.floor(brushSize * 0.8);
        case 'wave':
            return Math.floor(brushSize * 0.5);
        case 'entangle':
            return Math.floor(brushSize * 1.2);
        case 'particle':
            return Math.floor(brushSize * 1.5);
        case 'flow':
            return Math.floor(brushSize * 1.0);
        default:
            return Math.floor(brushSize);
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

// 更新和绘制粒子
function updateParticles() {
    // 设置混合模式
    effectContext.globalCompositeOperation = blendMode;

    // 使用半透明黑色覆盖，创造拖尾效果
    effectContext.fillStyle = 'rgba(0, 0, 0, 0.05)';
    effectContext.fillRect(0, 0, effectCanvas.width, effectCanvas.height);

    // 恢复混合模式
    effectContext.globalCompositeOperation = blendMode;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 根据粒子类型更新位置和特性
        updateParticleByType(p, i);

        // 绘制粒子
        drawParticle(p);

        // 减少生命值
        p.life -= 0.3; // 减缓生命减少速度

        // 移除死亡粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

// 根据粒子类型更新粒子
function updateParticleByType(particle, index) {
    // 计算生命周期比例
    const lifeRatio = particle.life / particle.maxLife;

    switch (particle.type) {
        case 'quantum':
            // 量子笔刷：随机波动
            particle.x += particle.vx * (Math.sin(Date.now() * 0.001 + particle.phase) * 0.5 + 0.5) * evolutionSpeed;
            particle.y += particle.vy * (Math.cos(Date.now() * 0.001 + particle.phase) * 0.5 + 0.5) * evolutionSpeed;
            // 随时间变化大小
            particle.size = (Math.sin(Date.now() * 0.002 + particle.phase) * 0.2 + 0.8) * particle.size;
            break;

        case 'wave':
            // 波函数笔刷：波浪运动
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed + Math.sin(Date.now() * particle.frequency) * 2 * evolutionSpeed;
            // 随时间变化颜色
            const hue = parseInt(particle.color.match(/hsla?\((\d+)/)[1]);
            const newHue = (hue + 0.5) % 360;
            particle.color = particle.color.replace(/hsla?\(\d+/, `hsla(${newHue}`);
            break;

        case 'entangle':
            // 纠缠笔刷：相互吸引/排斥
            if (particles.length > 1 && index % 5 === 0) {
                // 只对部分粒子应用纠缠效果，提高性能
                const otherIndex = Math.floor(Math.random() * particles.length);
                const other = particles[otherIndex];

                if (other !== particle) {
                    const dx = other.x - particle.x;
                    const dy = other.y - particle.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0 && dist < 150) {
                        // 根据距离计算力度
                        const force = 0.05 * (1 - dist / 150) * evolutionSpeed;
                        particle.vx += (dx / dist) * force;
                        particle.vy += (dy / dist) * force;
                    }
                }
            }
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
            break;

        case 'particle':
            // 粒子笔刷：更快的运动
            particle.x += particle.vx * evolutionSpeed * 1.5;
            particle.y += particle.vy * evolutionSpeed * 1.5;
            // 旋转
            particle.rotation += particle.rotationSpeed * evolutionSpeed;
            break;

        case 'flow':
            // 流光笔刷：流动效果
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
            // 添加微小的随机运动
            particle.vx += (Math.random() - 0.5) * 0.1;
            particle.vy += (Math.random() - 0.5) * 0.1;
            // 随时间变化透明度
            particle.opacity = lifeRatio * 0.8;
            break;

        default:
            particle.x += particle.vx * evolutionSpeed;
            particle.y += particle.vy * evolutionSpeed;
    }

    // 限制粒子在画布范围内
    particle.x = Math.max(0, Math.min(effectCanvas.width, particle.x));
    particle.y = Math.max(0, Math.min(effectCanvas.height, particle.y));

    // 缓慢减小速度
    particle.vx *= 0.99;
    particle.vy *= 0.99;
}

// 绘制单个粒子
function drawParticle(p) {
    // 计算生命周期比例
    const lifeRatio = p.life / p.maxLife;

    // 根据粒子类型绘制不同形状
    switch (p.type) {
        case 'quantum':
            // 量子笔刷：发光圆形
            const gradient = effectContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            effectContext.fillStyle = gradient;
            effectContext.fill();

            // 添加光晕效果
            if (Math.random() > 0.9) {
                effectContext.beginPath();
                effectContext.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                effectContext.strokeStyle = p.color.replace('0.7', '0.2');
                effectContext.lineWidth = 1;
                effectContext.stroke();
            }
            break;

        case 'wave':
            // 波函数笔刷：波浪线
            effectContext.beginPath();
            effectContext.arc(
                p.x,
                p.y,
                p.size * (Math.sin(Date.now() * 0.002 + p.phase) * 0.3 + 0.7),
                0,
                Math.PI * 2
            );
            effectContext.fillStyle = p.color;
            effectContext.fill();

            // 添加波纹效果
            if (Math.random() > 0.95) {
                effectContext.beginPath();
                effectContext.arc(p.x, p.y, p.size * 2 * lifeRatio, 0, Math.PI * 2);
                effectContext.strokeStyle = p.color.replace('0.7', '0.1');
                effectContext.lineWidth = 0.5;
                effectContext.stroke();
            }
            break;

        case 'entangle':
            // 纠缠笔刷：连接线
            if (particles.length > 1 && Math.random() > 0.8) {
                // 寻找附近的粒子
                for (let i = 0; i < 3; i++) { // 限制连线数量
                    const other = particles[Math.floor(Math.random() * particles.length)];
                    if (other === p) continue;

                    const dx = other.x - p.x;
                    const dy = other.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        // 创建渐变连线
                        const gradient = effectContext.createLinearGradient(p.x, p.y, other.x, other.y);
                        gradient.addColorStop(0, p.color.replace('0.7', '0.3'));
                        gradient.addColorStop(1, other.color.replace('0.7', '0.1'));

                        effectContext.beginPath();
                        effectContext.moveTo(p.x, p.y);
                        effectContext.lineTo(other.x, other.y);
                        effectContext.strokeStyle = gradient;
                        effectContext.lineWidth = 0.5;
                        effectContext.stroke();
                    }
                }
            }

            // 绘制粒子本身
            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            effectContext.fillStyle = p.color;
            effectContext.fill();
            break;

        case 'particle':
            // 粒子笔刷：旋转的小方块
            effectContext.save();
            effectContext.translate(p.x, p.y);
            effectContext.rotate(p.rotation);
            effectContext.fillStyle = p.color;
            effectContext.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            effectContext.restore();

            // 添加轨迹效果
            if (Math.random() > 0.7) {
                effectContext.beginPath();
                effectContext.moveTo(p.x, p.y);
                effectContext.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
                effectContext.strokeStyle = p.color.replace('0.7', '0.2');
                effectContext.lineWidth = 0.5;
                effectContext.stroke();
            }
            break;

        case 'flow':
            // 流光笔刷：流动的光效
            const flowGradient = effectContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            const flowColor = p.color.replace('0.7', `${p.opacity}`);
            flowGradient.addColorStop(0, flowColor);
            flowGradient.addColorStop(0.5, flowColor.replace('0.7', '0.3'));
            flowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            effectContext.beginPath();
            effectContext.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            effectContext.fillStyle = flowGradient;
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

// 动画循环
function animate() {
    animationId = requestAnimationFrame(animate);

    // 更新粒子
    updateParticles();

    // 更新Three.js效果
    if (quantumEffect) {
        // 更新绘图纹理
        quantumEffect.material.uniforms.drawingTexture.value.needsUpdate = true;

        // 更新时间
        quantumEffect.material.uniforms.time.value = Date.now() * 0.0005; // 减慢时间流逝

        // 更新颜色方案
        quantumEffect.material.uniforms.colorScheme.value = getColorSchemeValue();
    }

    // 渲染Three.js场景
    renderer.render(scene, camera);
}

// 清除画布
function clearCanvas() {
    // 保存当前状态用于撤销
    saveDrawState();

    // 清除画布
    drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    effectContext.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
    particles = [];

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

// 保存图像
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

    // 捕获Three.js渲染
    tempContext.drawImage(renderer.domElement, 0, 0);

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `量子涂鸦_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    // 显示保存反馈
    showFeedback('图像已保存');
}

// 保存GIF
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

    // 捕获多个帧
    const frameCount = 40;
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

        // 捕获Three.js渲染
        tempContext.drawImage(renderer.domElement, 0, 0);

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
