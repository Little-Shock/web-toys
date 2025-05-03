/**
 * 着色器代码库
 * 包含常用的GLSL着色器代码片段
 */

// 噪声函数
const noiseShader = `
// 经典Perlin噪声
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // 计算网格单元坐标
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // 计算四面体中的其他三个顶点
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // 排列
  i = mod289(i);
  vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // 梯度
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // 归一化梯度
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // 混合
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// FBM (分形布朗运动) 噪声
float fbm(vec3 p, int octaves, float lacunarity, float gain) {
  float freq = 1.0;
  float amp = 0.5;
  float sum = 0.0;
  
  for(int i = 0; i < octaves; i++) {
    sum += snoise(p * freq) * amp;
    freq *= lacunarity;
    amp *= gain;
  }
  
  return sum;
}
`;

// 流体顶点着色器
const fluidVertexShader = `
uniform float uTime;
uniform float uViscosity;
uniform float uSpeed;
uniform vec3 uForce;

varying vec2 vUv;
varying float vElevation;

${noiseShader}

void main() {
  vUv = uv;

  // 计算时间因子
  float t = uTime * uSpeed;

  // 应用外部力
  vec3 forceOffset = uForce * 0.1;

  // 基于噪声的波动
  float noiseFreq = 0.8;
  float noiseAmp = 0.4 * (1.0 - uViscosity); // 粘度越高，波动越小

  // 计算多层噪声
  float noise1 = snoise(vec3(position.x * noiseFreq + forceOffset.x,
                           position.y * noiseFreq + forceOffset.y,
                           t)) * noiseAmp;

  float noise2 = snoise(vec3(position.x * noiseFreq * 2.0 - t,
                           position.y * noiseFreq * 2.0,
                           t * 0.5 + forceOffset.z)) * noiseAmp * 0.5;

  // 组合噪声
  float elevation = noise1 + noise2;

  // 应用到顶点
  vec3 newPosition = position;
  newPosition.z += elevation;

  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

// 流体片元着色器
const fluidFragmentShader = `
uniform sampler2D uTexture;
uniform vec3 uColor;

varying vec2 vUv;
varying float vElevation;

void main() {
  // 基础颜色
  vec3 baseColor = uColor;

  // 如果有纹理，则混合纹理颜色
  vec4 textureColor = texture2D(uTexture, vUv);

  // 基于高度的颜色变化
  float colorIntensity = smoothstep(-0.2, 0.4, vElevation) * 0.8 + 0.2;

  // 混合颜色
  vec3 finalColor = mix(baseColor, textureColor.rgb, 0.6);
  finalColor = mix(finalColor * 0.7, finalColor, colorIntensity);

  // 透明度基于高度和纹理
  float alpha = smoothstep(-0.2, 0.2, vElevation) * 0.7 + 0.3;
  alpha *= textureColor.a;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

// 粒子顶点着色器
const particleVertexShader = `
uniform float uTime;
uniform float uSize;

attribute float size;
attribute vec3 color;
attribute float angle;

varying vec3 vColor;
varying float vAngle;

void main() {
  vColor = color;
  vAngle = angle + uTime * 0.5; // 随时间旋转

  // 计算位置
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // 设置点大小
  gl_PointSize = size * uSize / -mvPosition.z;

  gl_Position = projectionMatrix * mvPosition;
}
`;

// 粒子片元着色器
const particleFragmentShader = `
uniform sampler2D uTexture;

varying vec3 vColor;
varying float vAngle;

void main() {
  // 计算旋转后的UV坐标
  float c = cos(vAngle);
  float s = sin(vAngle);

  vec2 rotatedUV = vec2(
    c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,
    c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5
  );

  // 采样纹理
  vec4 texColor = texture2D(uTexture, rotatedUV);

  // 应用颜色
  gl_FragColor = vec4(vColor, 1.0) * texColor;
}
`;
