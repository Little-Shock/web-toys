/**
 * Main application logic for Holo-Card Tilt
 * Initializes and coordinates all components
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const cardScreen = document.getElementById('card-screen');
    const cardContainer = document.getElementById('card-container');
    const cardRenderer = document.getElementById('card-renderer');
    const imageUpload = document.getElementById('image-upload');
    const exportModal = document.getElementById('export-modal');
    const loadingOverlay = document.getElementById('loading-overlay');
    const lockButton = document.getElementById('lock-button');
    const exportButton = document.getElementById('export-button');
    const shareButton = document.getElementById('share-button');
    const exportGifButton = document.getElementById('export-gif');
    const exportMp4Button = document.getElementById('export-mp4');
    const cancelExportButton = document.getElementById('cancel-export');
    const filterButtons = document.querySelectorAll('.filter-button');

    // Application state
    let currentFilter = 'rainbow';
    let isLocked = false;
    let userImage = null;
    let renderer, scene, camera, material, mesh, clock;
    let animationFrameId = null;

    // Initialize managers
    const orientationManager = new OrientationManager();
    const exportManager = new ExportManager();

    /**
     * Initialize Three.js scene
     */
    function initThreeJS() {
        console.log("Initializing Three.js with default texture");

        // Create renderer with basic settings
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true // Required for image capture
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(cardRenderer.clientWidth, cardRenderer.clientHeight);
        cardRenderer.appendChild(renderer.domElement);

        // Create scene with white background for testing
        scene = new THREE.Scene();

        // Create camera
        camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000);
        camera.position.z = 1;

        // Create clock for animation
        clock = new THREE.Clock();

        // Create a plane for the card
        const geometry = new THREE.PlaneGeometry(1, 1);

        // Try both approaches: shader material and basic material

        // 1. First create a basic material as fallback
        const basicMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true
        });

        // 2. Then create shader material
        // Get shaders from the unified shaders.js file
        const allShaders = window.shaders || {};

        // Try to use the minimal shader first if available, otherwise use the full effect shader
        material = new THREE.ShaderMaterial({
            vertexShader: allShaders.vertex,
            fragmentShader: allShaders.minimal ? allShaders.minimal.rainbow : allShaders.rainbow,
            uniforms: {
                tDiffuse: { value: null },
                uTime: { value: 0 },
                uTilt: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector2(
                    cardRenderer.clientWidth,
                    cardRenderer.clientHeight
                )}
            },
            transparent: true
        });

        // Create mesh with the shader material
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Store the basic material for potential fallback
        window.basicMaterial = basicMaterial;

        // Initialize export manager
        exportManager.init(
            renderer.domElement,
            handleExportStart,
            handleExportProgress,
            handleExportComplete
        );

        // Start animation loop
        animate();

        console.log("Three.js initialized");
    }

    /**
     * Animation loop
     */
    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Update uniforms
        material.uniforms.uTime.value = clock.getElapsedTime();

        // Get current tilt from orientation manager
        const tilt = orientationManager.getTilt();
        material.uniforms.uTilt.value.set(tilt.x, tilt.y);

        // Apply 3D transform to card container
        const tiltX = -tilt.y * 15; // Invert Y for natural tilt
        const tiltY = tilt.x * 15;
        cardRenderer.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

        // Render scene
        renderer.render(scene, camera);
    }

    /**
     * Handle image upload
     * @param {Event} event - Upload input change event
     */
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show loading overlay
        loadingOverlay.classList.add('active');

        // Create object URL
        const url = URL.createObjectURL(file);

        // Try multiple approaches to ensure the image displays

        // APPROACH 1: Use TextureLoader (more reliable for Three.js)
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = '';

        textureLoader.load(
            url,
            // onLoad callback
            function(loadedTexture) {
                console.log("Texture loaded via TextureLoader:", loadedTexture);

                // Set texture parameters
                loadedTexture.minFilter = THREE.LinearFilter;
                loadedTexture.magFilter = THREE.LinearFilter;
                loadedTexture.format = THREE.RGBAFormat;
                loadedTexture.needsUpdate = true;

                // Update material with the loaded texture
                material.uniforms.tDiffuse.value = loadedTexture;
                material.needsUpdate = true;

                // APPROACH 2: Create a basic material as fallback
                const fallbackMaterial = new THREE.MeshBasicMaterial({
                    map: loadedTexture,
                    transparent: true
                });

                // Store the fallback material for potential use
                window.fallbackMaterial = fallbackMaterial;

                // Add a button to switch to basic material if shader doesn't work
                const fallbackButton = document.createElement('button');
                fallbackButton.textContent = '图片不显示？点击这里';
                fallbackButton.className = 'fallback-button';
                fallbackButton.style.position = 'absolute';
                fallbackButton.style.bottom = '120px';
                fallbackButton.style.left = '50%';
                fallbackButton.style.transform = 'translateX(-50%)';
                fallbackButton.style.padding = '8px 16px';
                fallbackButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
                fallbackButton.style.color = 'white';
                fallbackButton.style.border = 'none';
                fallbackButton.style.borderRadius = '20px';
                fallbackButton.style.zIndex = '100';

                fallbackButton.addEventListener('click', function() {
                    console.log("Switching to basic material");
                    // Switch to basic material
                    mesh.material = fallbackMaterial;
                    // Hide the button
                    this.style.display = 'none';
                });

                // APPROACH 3: Add a button to switch to minimal shader mode
                const minimalButton = document.createElement('button');
                minimalButton.textContent = '简化特效模式';
                minimalButton.className = 'fallback-button';
                minimalButton.style.position = 'absolute';
                minimalButton.style.bottom = '70px';
                minimalButton.style.left = '50%';
                minimalButton.style.transform = 'translateX(-50%)';
                minimalButton.style.padding = '8px 16px';
                minimalButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
                minimalButton.style.color = 'white';
                minimalButton.style.border = 'none';
                minimalButton.style.borderRadius = '20px';
                minimalButton.style.zIndex = '100';

                minimalButton.addEventListener('click', function() {
                    // Toggle minimal shader mode
                    document.body.classList.add('use-minimal-shaders');

                    // Update shader with minimal version
                    const allShaders = window.shaders || {};
                    if (allShaders.minimal) {
                        switch (currentFilter) {
                            case 'rainbow':
                                material.fragmentShader = allShaders.minimal.rainbow;
                                break;
                            case 'metal':
                                material.fragmentShader = allShaders.minimal.metal;
                                break;
                            case 'cyber':
                                material.fragmentShader = allShaders.minimal.cyber;
                                break;
                        }
                        material.needsUpdate = true;
                    }

                    // Hide this button
                    this.style.display = 'none';
                });

                // APPROACH 4: Add a button to switch to no-effect mode
                const noEffectButton = document.createElement('button');
                noEffectButton.textContent = '无特效模式';
                noEffectButton.className = 'fallback-button';
                noEffectButton.style.position = 'absolute';
                noEffectButton.style.bottom = '20px';
                noEffectButton.style.left = '50%';
                noEffectButton.style.transform = 'translateX(-50%)';
                noEffectButton.style.padding = '8px 16px';
                noEffectButton.style.backgroundColor = 'rgba(0,0,0,0.7)';
                noEffectButton.style.color = 'white';
                noEffectButton.style.border = 'none';
                noEffectButton.style.borderRadius = '20px';
                noEffectButton.style.zIndex = '100';

                noEffectButton.addEventListener('click', function() {
                    // Redirect to basic.html
                    window.location.href = 'basic.html';
                });

                cardScreen.appendChild(fallbackButton);
                cardScreen.appendChild(minimalButton);
                cardScreen.appendChild(noEffectButton);

                // Switch to card screen
                welcomeScreen.classList.remove('active');
                cardScreen.classList.add('active');

                // Initialize orientation manager
                orientationManager.init(cardRenderer);

                // Hide loading overlay
                loadingOverlay.classList.remove('active');

                // Announce to screen readers
                announceToScreenReader('图片已加载，您可以倾斜手机或拖动卡片查看全息效果');
            },
            // onProgress callback
            undefined,
            // onError callback
            function(err) {
                console.error("TextureLoader error:", err);
                loadingOverlay.classList.remove('active');
                alert('图片加载失败，请尝试其他图片。');
            }
        );
    }

    /**
     * Change holographic filter
     * @param {string} filter - Filter name: 'rainbow', 'metal', or 'cyber'
     */
    function changeFilter(filter) {
        if (filter === currentFilter) return;

        // Update current filter
        currentFilter = filter;

        // Get shaders from the unified shaders.js file
        const allShaders = window.shaders || {};

        // Check if we're using minimal shaders (for performance/compatibility)
        const useMinimal = document.body.classList.contains('use-minimal-shaders');

        // Update shader based on selected filter
        if (useMinimal && allShaders.minimal) {
            // Use minimal shaders if available and requested
            switch (filter) {
                case 'rainbow':
                    material.fragmentShader = allShaders.minimal.rainbow;
                    break;
                case 'metal':
                    material.fragmentShader = allShaders.minimal.metal;
                    break;
                case 'cyber':
                    material.fragmentShader = allShaders.minimal.cyber;
                    break;
            }
        } else {
            // Use full effect shaders
            switch (filter) {
                case 'rainbow':
                    material.fragmentShader = allShaders.rainbow;
                    break;
                case 'metal':
                    material.fragmentShader = allShaders.metal;
                    break;
                case 'cyber':
                    material.fragmentShader = allShaders.cyber;
                    break;
            }
        }

        // Need to flag for recompilation
        material.needsUpdate = true;

        // Update UI
        filterButtons.forEach(button => {
            if (button.dataset.filter === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Toggle orientation lock
     */
    function toggleLock() {
        isLocked = orientationManager.toggleLock();

        // Update lock button
        lockButton.querySelector('.icon').textContent = isLocked ? '🔒' : '🔓';

        // Announce to screen readers
        announceToScreenReader(isLocked ? '已锁定卡片位置' : '已解锁卡片位置');
    }

    /**
     * Show export modal
     */
    function showExportModal() {
        exportModal.classList.add('active');
    }

    /**
     * Hide export modal
     */
    function hideExportModal() {
        exportModal.classList.remove('active');
    }

    /**
     * Handle export start
     * @param {string} type - Export type: 'gif' or 'mp4'
     */
    function handleExportStart(type) {
        loadingOverlay.classList.add('active');
        loadingOverlay.querySelector('.loading-text').textContent =
            type === 'gif' ? '正在生成GIF...' : '正在录制视频...';
    }

    /**
     * Handle export progress
     * @param {number} progress - Progress from 0 to 1
     */
    function handleExportProgress(progress) {
        const percent = Math.round(progress * 100);
        loadingOverlay.querySelector('.loading-text').textContent = `处理中... ${percent}%`;
    }

    /**
     * Handle export complete
     * @param {Blob} blob - The exported file blob
     * @param {string} type - Export type: 'gif' or 'mp4'
     */
    function handleExportComplete(blob, type) {
        loadingOverlay.classList.remove('active');

        if (!blob) {
            alert('导出失败，请重试。');
            return;
        }

        // Download the file
        exportManager.downloadFile(blob, type);

        // Announce to screen readers
        announceToScreenReader(type === 'gif' ? 'GIF已保存' : '视频已保存');
    }

    /**
     * Share the current card
     */
    function shareCard() {
        // If Web Share API is available
        if (navigator.share) {
            // Take a snapshot
            const dataUrl = renderer.domElement.toDataURL('image/png');

            // Convert data URL to blob
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'holo-card.png', { type: 'image/png' });

                    navigator.share({
                        title: 'Holo-Card Tilt',
                        text: '查看我制作的全息闪卡！',
                        files: [file]
                    }).catch(error => {
                        console.error('Share failed:', error);
                        alert('分享失败，请尝试导出后手动分享。');
                    });
                });
        } else {
            // Fallback to export modal
            showExportModal();
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('role', 'status');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        // Remove after announcement is processed
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 3000);
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        if (!renderer) return;

        // Update renderer size
        renderer.setSize(cardRenderer.clientWidth, cardRenderer.clientHeight);

        // Update resolution uniform
        material.uniforms.uResolution.value.set(
            cardRenderer.clientWidth,
            cardRenderer.clientHeight
        );
    }

    /**
     * Clean up resources
     */
    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        if (orientationManager) {
            orientationManager.destroy();
        }

        if (renderer) {
            renderer.dispose();
        }
    }

    // Initialize Three.js
    initThreeJS();

    // Event listeners
    imageUpload.addEventListener('change', handleImageUpload);

    lockButton.addEventListener('click', toggleLock);
    exportButton.addEventListener('click', showExportModal);
    shareButton.addEventListener('click', shareCard);

    exportGifButton.addEventListener('click', () => {
        hideExportModal();
        exportManager.startRecording('gif', 3000);
    });

    exportMp4Button.addEventListener('click', () => {
        hideExportModal();
        exportManager.startRecording('mp4', 3000);
    });

    cancelExportButton.addEventListener('click', hideExportModal);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            changeFilter(button.dataset.filter);
        });
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', cleanup);
});
