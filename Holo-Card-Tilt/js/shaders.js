/**
 * Shader definitions for the Holo-Card Tilt application
 * Contains vertex and fragment shaders for different holographic effects
 */

// Vertex shader - common for all effects
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader - Rainbow holographic effect
const rainbowFragmentShader = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uTilt;
uniform vec2 uResolution;

varying vec2 vUv;

// Noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Fresnel effect calculation
float fresnel(vec2 uv, vec2 tilt) {
    vec2 center = vec2(0.5) + tilt * 0.2;
    float dist = distance(uv, center);
    return pow(dist, 1.5);
}

void main() {
    vec2 uv = vUv;
    
    // Apply subtle distortion based on tilt
    float distortAmount = 0.02 * length(uTilt);
    uv += uTilt * distortAmount;
    
    // Calculate fresnel effect
    float fresnelFactor = fresnel(uv, uTilt);
    
    // RGB shift based on tilt and fresnel
    float rgbShiftAmount = 0.01 * fresnelFactor;
    vec4 texR = texture2D(tDiffuse, uv + vec2(rgbShiftAmount, 0.0));
    vec4 texG = texture2D(tDiffuse, uv);
    vec4 texB = texture2D(tDiffuse, uv - vec2(rgbShiftAmount, 0.0));
    
    // Combine RGB channels
    vec4 color = vec4(texR.r, texG.g, texB.b, 1.0);
    
    // Add holographic rainbow effect
    vec3 rainbow = vec3(0.0);
    float angle = atan(uTilt.y, uTilt.x) + uTime * 0.2;
    rainbow.r = 0.5 + 0.5 * sin(fresnelFactor * 10.0 + angle);
    rainbow.g = 0.5 + 0.5 * sin(fresnelFactor * 10.0 + angle + 2.0);
    rainbow.b = 0.5 + 0.5 * sin(fresnelFactor * 10.0 + angle + 4.0);
    
    // Add scan lines
    float scanLine = 0.05 * sin(uv.y * uResolution.y * 0.5 + uTime * 2.0);
    color.rgb -= scanLine;
    
    // Add noise
    float noise = random(uv * uTime * 0.01) * 0.05;
    
    // Combine everything
    color.rgb = mix(color.rgb, rainbow, fresnelFactor * 0.7);
    color.rgb += noise;
    
    // Add vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - vec2(0.5)));
    color.rgb *= vignette;
    
    gl_FragColor = color;
}
`;

// Fragment shader - Metal holographic effect
const metalFragmentShader = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uTilt;
uniform vec2 uResolution;

varying vec2 vUv;

// Noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Fresnel effect calculation
float fresnel(vec2 uv, vec2 tilt) {
    vec2 center = vec2(0.5) + tilt * 0.2;
    float dist = distance(uv, center);
    return pow(dist, 1.5);
}

void main() {
    vec2 uv = vUv;
    
    // Apply subtle distortion based on tilt
    float distortAmount = 0.02 * length(uTilt);
    uv += uTilt * distortAmount;
    
    // Calculate fresnel effect
    float fresnelFactor = fresnel(uv, uTilt);
    
    // RGB shift based on tilt and fresnel
    float rgbShiftAmount = 0.005 * fresnelFactor;
    vec4 texR = texture2D(tDiffuse, uv + vec2(rgbShiftAmount, 0.0));
    vec4 texG = texture2D(tDiffuse, uv);
    vec4 texB = texture2D(tDiffuse, uv - vec2(rgbShiftAmount, 0.0));
    
    // Combine RGB channels
    vec4 color = vec4(texR.r, texG.g, texB.b, 1.0);
    
    // Add metallic effect
    vec3 metal = vec3(0.8, 0.8, 0.9);
    float metalAngle = atan(uTilt.y, uTilt.x) + uTime * 0.1;
    float metalFactor = 0.5 + 0.5 * sin(fresnelFactor * 15.0 + metalAngle);
    metal *= metalFactor;
    
    // Add scan lines
    float scanLine = 0.03 * sin(uv.y * uResolution.y * 0.8 + uTime * 1.5);
    color.rgb -= scanLine;
    
    // Add noise
    float noise = random(uv * uTime * 0.01) * 0.03;
    
    // Combine everything
    color.rgb = mix(color.rgb, metal, fresnelFactor * 0.6);
    color.rgb += noise;
    
    // Add vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - vec2(0.5)));
    color.rgb *= vignette;
    
    gl_FragColor = color;
}
`;

// Fragment shader - Cyber holographic effect (hacker green)
const cyberFragmentShader = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uTilt;
uniform vec2 uResolution;

varying vec2 vUv;

// Noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Fresnel effect calculation
float fresnel(vec2 uv, vec2 tilt) {
    vec2 center = vec2(0.5) + tilt * 0.2;
    float dist = distance(uv, center);
    return pow(dist, 1.5);
}

void main() {
    vec2 uv = vUv;
    
    // Apply subtle distortion based on tilt
    float distortAmount = 0.03 * length(uTilt);
    uv += uTilt * distortAmount;
    
    // Calculate fresnel effect
    float fresnelFactor = fresnel(uv, uTilt);
    
    // RGB shift based on tilt and fresnel
    float rgbShiftAmount = 0.015 * fresnelFactor;
    vec4 texR = texture2D(tDiffuse, uv + vec2(rgbShiftAmount, 0.0));
    vec4 texG = texture2D(tDiffuse, uv);
    vec4 texB = texture2D(tDiffuse, uv - vec2(rgbShiftAmount, 0.0));
    
    // Combine RGB channels with green emphasis
    vec4 color = vec4(texR.r * 0.7, texG.g * 1.2, texB.b * 0.7, 1.0);
    
    // Add cyber green effect
    vec3 cyber = vec3(0.0, 1.0, 0.3);
    float cyberAngle = atan(uTilt.y, uTilt.x) + uTime * 0.3;
    float cyberFactor = 0.5 + 0.5 * sin(fresnelFactor * 12.0 + cyberAngle);
    cyber *= cyberFactor;
    
    // Add scan lines
    float scanLine = 0.08 * sin(uv.y * uResolution.y * 1.0 + uTime * 3.0);
    color.rgb -= scanLine;
    
    // Add digital noise
    float noise = step(0.7, random(floor(uv * 100.0) + uTime * 0.1)) * 0.1;
    
    // Add glitch effect
    float glitchLine = step(0.97, random(vec2(floor(uv.y * 50.0), uTime))) * 0.1;
    uv.x += glitchLine;
    
    // Combine everything
    color.rgb = mix(color.rgb, cyber, fresnelFactor * 0.5);
    color.rgb += noise;
    
    // Add vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - vec2(0.5)));
    color.rgb *= vignette;
    
    gl_FragColor = color;
}
`;

// Export shader objects for use in main.js
const shaders = {
    vertex: vertexShader,
    rainbow: rainbowFragmentShader,
    metal: metalFragmentShader,
    cyber: cyberFragmentShader
};
