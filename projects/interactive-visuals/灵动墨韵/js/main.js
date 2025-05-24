import { createShader, createProgram, createBuffer, createTexture, createFramebuffer } from './utils.js';

console.log('灵动墨韵 - main.js loaded');

const canvas = document.getElementById('fluid-canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 not supported, falling back on experimental-webgl');
    // Try to fallback to webgl1 and handle it by checking later.
    // For now, just log an error and stop.
    // gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    alert('需要支持 WebGL 2 的浏览器才能运行此项目。');
    // throw new Error('WebGL 2 not supported');
}

// Check for WebGL extensions
const ext = {
     υπάρχει_float_lin: gl.getExtension('OES_texture_float_linear'),
    // υπάρχει_half_float_lin: gl.getExtension('OES_texture_half_float_linear'), // Not strictly needed for now
    color_buffer_float: gl.getExtension('EXT_color_buffer_float') // Important for rendering to float textures
};

if (!ext.color_buffer_float) {
    console.warn("EXT_color_buffer_float not supported. Fluid simulation might not work as expected or with high precision.");
    // alert("此浏览器不支持渲染到浮点纹理(EXT_color_buffer_float)，流体模拟可能无法正常工作或精度较低。");
    // We can still try with UNSIGNED_BYTE textures, but it's not ideal for velocities.
}

if (gl) {
    console.log('WebGL (hopefully 2) context obtained:', gl);
    console.log('OES_texture_float_linear supported:', !!ext.υπάρχει_float_lin);
    console.log('EXT_color_buffer_float supported:', !!ext.color_buffer_float);

    // --- Shared Variables & Configuration ---
    const POINTER_RADIUS_NORMALIZED = 0.02; // Radius of the pointer splat, normalized to canvas height
    let pointerRadiusPixels = 20;

    // --- Shader Sources ---

    // Vertex shader for full-screen quad
    const quadVsSource = `#version 300 es
        in vec2 a_position;
        out vec2 v_uv;
        void main() {
            v_uv = a_position * 0.5 + 0.5; // Convert from -1 -> +1 to 0 -> 1
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader to display a texture
    const displayFsSource = `#version 300 es
        precision highp float;
        in vec2 v_uv;
        uniform sampler2D u_texture;
        out vec4 outColor;
        void main() {
            outColor = texture(u_texture, v_uv);
        }
    `;

    // Fragment shader for adding density (splat)
    const splatFsSource = `#version 300 es
        precision highp float;
        in vec2 v_uv;
        uniform sampler2D u_target_texture; // The texture we are writing to (current density)
        uniform vec2 u_pointer_pos;      // Pointer position (0 to 1)
        uniform float u_pointer_radius;  // Pointer radius (in texels/pixels on the texture)
        uniform vec3 u_splat_color;      // Color of the splat
        uniform bool u_pointer_active;   // Is the pointer/mouse button down?

        out vec4 outColor;

        void main() {
            vec4 existing_color = texture(u_target_texture, v_uv);
            outColor = existing_color;

            if (u_pointer_active) {
                float dist = distance(v_uv * vec2(textureSize(u_target_texture, 0)), u_pointer_pos * vec2(textureSize(u_target_texture, 0)));
                if (dist < u_pointer_radius) {
                    // Simple splat: just add color, could be more sophisticated (e.g., gaussian falloff)
                    // float strength = smoothstep(u_pointer_radius, 0.0, dist);
                    float strength = 1.0 - smoothstep(0.0, u_pointer_radius, dist); // Smoother splat
                    outColor.rgb = mix(existing_color.rgb, u_splat_color, strength);
                    // outColor.rgb += u_splat_color * strength; // Additive, might get too bright
                    outColor.a = max(existing_color.a, strength); // Make it opaque where splatting
                }
            }
        }
    `;

    // Fragment shader for advection
    const advectionFsSource = `#version 300 es
        precision highp float;
        precision highp sampler2D;

        in vec2 v_uv;

        uniform sampler2D u_velocity_texture; // Current velocity field
        uniform sampler2D u_source_texture;   // Quantity to be advected (e.g., density or velocity itself)
        uniform vec2 u_texel_size;          // 1.0 / textureSize
        uniform float u_dt;                 // Timestep
        uniform float u_dissipation;        // Dissipation factor for the advected quantity

        out vec4 outColor;

        void main() {
            // Read velocity at current UV
            vec2 velocity = texture(u_velocity_texture, v_uv).xy; // Assuming R=vx, G=vy

            // Backtrace particle position (semi-Lagrangian advection)
            // Go back in time by dt along the velocity vector
            vec2 prev_uv = v_uv - u_dt * velocity * u_texel_size; // texel_size makes velocity grid-scaled

            // Sample the source texture at the backtraced position
            // (Bilinear interpolation is done by default by texture())
            vec4 advected_value = texture(u_source_texture, prev_uv);

            // Apply dissipation (e.g., for density to fade over time)
            outColor = advected_value * u_dissipation;
        }
    `;

    // --- Shader Programs ---
    const quadVertexShader = createShader(gl, gl.VERTEX_SHADER, quadVsSource);

    const displayProgram = createProgram(gl, quadVertexShader, createShader(gl, gl.FRAGMENT_SHADER, displayFsSource));
    const splatProgram = createProgram(gl, quadVertexShader, createShader(gl, gl.FRAGMENT_SHADER, splatFsSource));
    const advectionProgram = createProgram(gl, quadVertexShader, createShader(gl, gl.FRAGMENT_SHADER, advectionFsSource));

    if (!displayProgram || !splatProgram || !advectionProgram) {
        throw new Error('Shader program creation failed');
    }

    // --- Program Locations (Display) ---
    const displayPositionAttribLoc = gl.getAttribLocation(displayProgram, "a_position");
    const displayTextureUniformLoc = gl.getUniformLocation(displayProgram, "u_texture");

    // --- Program Locations (Splat) ---
    const splatPositionAttribLoc = gl.getAttribLocation(splatProgram, "a_position");
    const splatTargetTextureUniformLoc = gl.getUniformLocation(splatProgram, "u_target_texture");
    const splatPointerPosUniformLoc = gl.getUniformLocation(splatProgram, "u_pointer_pos");
    const splatPointerRadiusUniformLoc = gl.getUniformLocation(splatProgram, "u_pointer_radius");
    const splatColorUniformLoc = gl.getUniformLocation(splatProgram, "u_splat_color");
    const splatPointerActiveUniformLoc = gl.getUniformLocation(splatProgram, "u_pointer_active");

    // --- Program Locations (Advection) ---
    const advectionPositionAttribLoc = gl.getAttribLocation(advectionProgram, "a_position");
    const advectionVelocityTextureUniformLoc = gl.getUniformLocation(advectionProgram, "u_velocity_texture");
    const advectionSourceTextureUniformLoc = gl.getUniformLocation(advectionProgram, "u_source_texture");
    const advectionTexelSizeUniformLoc = gl.getUniformLocation(advectionProgram, "u_texel_size");
    const advectionDtUniformLoc = gl.getUniformLocation(advectionProgram, "u_dt");
    const advectionDissipationUniformLoc = gl.getUniformLocation(advectionProgram, "u_dissipation");

    // --- Buffers ---
    // prettier-ignore
    const quadVertices = [
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ];
    const quadBuffer = createBuffer(gl, quadVertices);

    // --- Framebuffers and Textures ---
    let simWidth, simHeight;
    let densityTextureRead, densityTextureWrite; // Ping-pong textures for density
    let densityFboRead, densityFboWrite;         // Ping-pong FBOs
    let velocityTextureRead, velocityTextureWrite;
    let velocityFboRead, velocityFboWrite;

    // Texture format - using RGBA8 for broader compatibility initially for density
    // For velocity, we will try to use FLOAT if supported.
    const densityTextureInternalFormat = gl.RGBA;
    const densityTextureFormat = gl.RGBA;
    const densityTextureType = gl.UNSIGNED_BYTE;

    // Attempt to use floating point textures for velocity if supported
    // Half float is often a good compromise: RGBA16F
    // Full float: RGBA32F
    let velocityTextureInternalFormat = gl.RGBA16F; // Default to half float
    let velocityTextureType = gl.HALF_FLOAT;

    if (!ext.color_buffer_float) { // If we can't render to float textures
        console.warn("Falling back to UNSIGNED_BYTE textures for velocity due to missing EXT_color_buffer_float.");
        velocityTextureInternalFormat = gl.RGBA; // Fallback
        velocityTextureType = gl.UNSIGNED_BYTE;  // Fallback
    } else {
        // Check if rendering to RGBA16F is actually supported
        const testTex = createTexture(gl, 1, 1, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null);
        const testFbo = createFramebuffer(gl, testTex);
        gl.bindFramebuffer(gl.FRAMEBUFFER, testFbo);
        const fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (fboStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.warn('RGBA16F is not color-renderable. Trying RGBA32F.');
            velocityTextureInternalFormat = gl.RGBA32F;
            velocityTextureType = gl.FLOAT;

            // Test RGBA32F
            gl.deleteTexture(testTex);
            gl.deleteFramebuffer(testFbo);
            const testTex32 = createTexture(gl, 1, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
            const testFbo32 = createFramebuffer(gl, testTex32);
            gl.bindFramebuffer(gl.FRAMEBUFFER, testFbo32);
            const fboStatus32 = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (fboStatus32 !== gl.FRAMEBUFFER_COMPLETE) {
                console.error('RGBA32F is also not color-renderable. Velocity simulation will likely fail or be low quality.');
                // Fallback to byte texture as a last resort for velocity, though this is bad for accumulation
                velocityTextureInternalFormat = gl.RGBA;
                velocityTextureType = gl.UNSIGNED_BYTE;
            }
            gl.deleteTexture(testTex32);
            gl.deleteFramebuffer(testFbo32);

        } else {
            console.log('Using RGBA16F for velocity textures.');
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if(testTex && !testTex.deleted) gl.deleteTexture(testTex); // Ensure cleanup
        if(testFbo && !testFbo.deleted) gl.deleteFramebuffer(testFbo); // Ensure cleanup
    }

    function initFramebuffersAndTextures(width, height) {
        simWidth = width; // For simplicity, use full resolution. Could be width / 2 for performance.
        simHeight = height;
        pointerRadiusPixels = Math.max(10, simHeight * POINTER_RADIUS_NORMALIZED);

        if (densityTextureRead) gl.deleteTexture(densityTextureRead);
        if (densityTextureWrite) gl.deleteTexture(densityTextureWrite);
        if (densityFboRead) gl.deleteFramebuffer(densityFboRead);
        if (densityFboWrite) gl.deleteFramebuffer(densityFboWrite);
        if (velocityTextureRead) gl.deleteTexture(velocityTextureRead);
        if (velocityTextureWrite) gl.deleteTexture(velocityTextureWrite);
        if (velocityFboRead) gl.deleteFramebuffer(velocityFboRead);
        if (velocityFboWrite) gl.deleteFramebuffer(velocityFboWrite);

        densityTextureRead = createTexture(gl, simWidth, simHeight, densityTextureInternalFormat, densityTextureFormat, densityTextureType, null);
        densityTextureWrite = createTexture(gl, simWidth, simHeight, densityTextureInternalFormat, densityTextureFormat, densityTextureType, null);
        velocityTextureRead = createTexture(gl, simWidth, simHeight, velocityTextureInternalFormat, densityTextureFormat, velocityTextureType, null); // Use appropriate format
        velocityTextureWrite = createTexture(gl, simWidth, simHeight, velocityTextureInternalFormat, densityTextureFormat, velocityTextureType, null); // Use appropriate format

        densityFboRead = createFramebuffer(gl, densityTextureRead);
        densityFboWrite = createFramebuffer(gl, densityTextureWrite);
        velocityFboRead = createFramebuffer(gl, velocityTextureRead);
        velocityFboWrite = createFramebuffer(gl, velocityTextureWrite);

        // Initialize textures (e.g., clear to black/zero)
        gl.bindFramebuffer(gl.FRAMEBUFFER, densityFboRead);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, densityFboWrite);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFboRead);
        gl.clearColor(0, 0, 0, 0); // Zero velocity
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFboWrite);
        gl.clearColor(0, 0, 0, 0); // Zero velocity
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        console.log(`Initialized FBOs and textures for simulation at ${simWidth}x${simHeight}. Pointer radius: ${pointerRadiusPixels.toFixed(2)}px`);
    }

    function swapDensityTextures() {
        let tempTexture = densityTextureRead;
        densityTextureRead = densityTextureWrite;
        densityTextureWrite = tempTexture;

        let tempFbo = densityFboRead;
        densityFboRead = densityFboWrite;
        densityFboWrite = tempFbo;
    }

    function swapVelocityTextures() {
        let tempTexture = velocityTextureRead;
        velocityTextureRead = velocityTextureWrite;
        velocityTextureWrite = tempTexture;

        let tempFbo = velocityFboRead;
        velocityFboRead = velocityFboWrite;
        velocityFboWrite = tempFbo;
    }

    // --- Mouse/Touch State ---
    let pointer = {
        id: -1,
        x: 0, y: 0, // Normalized (0-1) coordinates, Y flipped for WebGL
        dx: 0, dy: 0,
        down: false,
        color: [Math.random(), Math.random(), Math.random()], // Random splat color per "click"
        velocityScale: 5.0 // How much velocity the pointer imparts
    };

    // --- Event Listeners (Mouse) ---
    canvas.addEventListener('mousedown', (e) => {
        pointer.down = true;
        pointer.x = e.clientX / canvas.width;
        pointer.y = 1.0 - (e.clientY / canvas.height);
        pointer.dx = 0;
        pointer.dy = 0;
        pointer.color = [Math.random(), Math.random(), Math.random()];
    });

    canvas.addEventListener('mouseup', () => pointer.down = false);
    canvas.addEventListener('mouseleave', () => pointer.down = false);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const newX = (e.clientX - rect.left) / canvas.width;
        const newY = 1.0 - ((e.clientY - rect.top) / canvas.height);
        pointer.dx = newX - pointer.x;
        pointer.dy = newY - pointer.y;
        pointer.x = newX;
        pointer.y = newY;
    });

    // --- Event Listeners (Touch) ---
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pointer.down = true;
        const touch = e.touches[0];
        pointer.x = touch.clientX / canvas.width;
        pointer.y = 1.0 - (touch.clientY / canvas.height);
        pointer.dx = 0;
        pointer.dy = 0;
        pointer.color = [Math.random(), Math.random(), Math.random()];
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        pointer.down = false;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const newX = (touch.clientX - rect.left) / canvas.width;
            const newY = 1.0 - ((touch.clientY - rect.top) / canvas.height);
            pointer.dx = newX - pointer.x;
            pointer.dy = newY - pointer.y;
            pointer.x = newX;
            pointer.y = newY;
        }
    }, { passive: false });

    // --- Simulation Steps ---
    function applyForces(dt) { // Renamed from applySplat, and now also adds velocity
        gl.bindFramebuffer(gl.FRAMEBUFFER, densityFboWrite);
        gl.viewport(0, 0, simWidth, simHeight);
        gl.useProgram(splatProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, densityTextureRead);
        gl.uniform1i(splatTargetTextureUniformLoc, 0);
        gl.uniform2f(splatPointerPosUniformLoc, pointer.x, pointer.y);
        gl.uniform1f(splatPointerRadiusUniformLoc, pointerRadiusPixels);
        gl.uniform3fv(splatColorUniformLoc, pointer.color);
        gl.uniform1i(splatPointerActiveUniformLoc, pointer.down ? 1 : 0);
        gl.enableVertexAttribArray(splatPositionAttribLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.vertexAttribPointer(splatPositionAttribLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        swapDensityTextures();

        // Now add velocity based on pointer movement
        if (pointer.down && (pointer.dx !== 0 || pointer.dy !== 0)) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, velocityFboWrite); // Target velocity write FBO
            // No viewport change needed if same simWidth/Height
            gl.useProgram(splatProgram); // Can reuse splat shader for adding velocity vectors

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, velocityTextureRead); // Read current velocity
            gl.uniform1i(splatTargetTextureUniformLoc, 0);

            gl.uniform2f(splatPointerPosUniformLoc, pointer.x, pointer.y);
            gl.uniform1f(splatPointerRadiusUniformLoc, pointerRadiusPixels * 0.75); // Smaller radius for force
            
            // Splat color for velocity: dx, dy, 0. Use a scaling factor.
            // Normalize dx, dy roughly by deltaTime to make it somewhat frame-rate independent, though true physics is more complex.
            // The u_texel_size might also be relevant here if dx/dy are in screen pixels.
            // For now, a simple scaling.
            const forceX = pointer.dx * pointer.velocityScale * (simWidth / canvas.width);
            const forceY = pointer.dy * pointer.velocityScale * (simHeight / canvas.height);
            // Velocity is often stored in -1 to 1 range, or scaled. Here, let's assume direct values that advection shader will use.
            // splatProgram expects a vec3 color. We map (forceX, forceY, 0) to it.
            // The splat shader does `mix(existing.rgb, splat_color, strength)`.
            // This isn't ideal for accumulating forces. A better splat for forces would *add* force.
            // For now, we'll overwrite with a mix, which is not physically correct for continuous force but will show effect.
            // A proper force splat shader would be better. Let's assume for now that splatting a color
            // directly sets the velocity at that point if strength is 1.
            // To make it additive, the splat shader would need to be: outColor.xy = existing_color.xy + u_splat_color.xy * strength;
            // Let's modify splatFsSource for this behavior when a u_is_velocity_splat uniform is true.
            // OR, make a dedicated force splat shader. For now, let's just see it move.
            // We are setting a color [forceX, forceY, 0] and splat will mix it.
            // This will work visually but not be an accumulation of forces.
            gl.uniform3f(splatColorUniformLoc, forceX, forceY, 0.0);
            gl.uniform1i(splatPointerActiveUniformLoc, 1); // Force active while dragging

            gl.enableVertexAttribArray(splatPositionAttribLoc);
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
            gl.vertexAttribPointer(splatPositionAttribLoc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            swapVelocityTextures();
        }
         // Reset pointer deltas after use
        pointer.dx = 0;
        pointer.dy = 0;
    }

    function advect(targetFbo, targetTexture, sourceTexture, velocityTexture, dissipation, dt) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
        gl.viewport(0, 0, simWidth, simHeight);
        gl.useProgram(advectionProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocityTexture);
        gl.uniform1i(advectionVelocityTextureUniformLoc, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(advectionSourceTextureUniformLoc, 1);

        gl.uniform2f(advectionTexelSizeUniformLoc, 1.0 / simWidth, 1.0 / simHeight);
        gl.uniform1f(advectionDtUniformLoc, dt);
        gl.uniform1f(advectionDissipationUniformLoc, dissipation);

        gl.enableVertexAttribArray(advectionPositionAttribLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.vertexAttribPointer(advectionPositionAttribLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // The result is now in targetTexture. Ping-pong is handled by caller.
    }

    // --- Main Render Loop ---
    let lastTime = 0;
    function animate(currentTime) {
        currentTime *= 0.001; // convert time to seconds
        const deltaTime = Math.min(currentTime - lastTime, 0.0166); // Cap deltaTime to prevent jumps
        lastTime = currentTime;

        // 1. Update simulation state
        applyForces(deltaTime); // Adds density and velocity from pointer

        // Advect density by velocity field
        advect(densityFboWrite, densityTextureWrite, densityTextureRead, velocityTextureRead, 0.99, deltaTime);
        swapDensityTextures();

        // Advect velocity by itself (self-advection)
        advect(velocityFboWrite, velocityTextureWrite, velocityTextureRead, velocityTextureRead, 0.98, deltaTime);
        swapVelocityTextures();
        
        // TODO: Future steps:
        // - Vorticity confinement (to add more detail/swirls)
        // - Pressure solve (Jacobi iterations for incompressibility)
        // - Divergence calculation
        // - Gradient subtraction (projection step)

        // 2. Render final result to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Bind to default framebuffer (the screen)
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        // gl.clearColor(0.0, 0.0, 0.0, 1.0); // Not strictly needed if texture covers screen
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(displayProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, densityTextureRead); // Display the result of all sim steps
        gl.uniform1i(displayTextureUniformLoc, 0);

        gl.enableVertexAttribArray(displayPositionAttribLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.vertexAttribPointer(displayPositionAttribLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(animate);
    }

    // --- Resize Handling ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        initFramebuffersAndTextures(gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    window.addEventListener('resize', resizeCanvas);

    // --- Initialization ---
    resizeCanvas(); // Setup initial canvas size, FBOs, and textures
    animate(0);     // Start the animation loop

    console.log('灵动墨韵 - Initialized. Try clicking and dragging on the canvas to add color and motion.');
} 