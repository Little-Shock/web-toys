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
        // Create renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true // Required for image capture
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(cardRenderer.clientWidth, cardRenderer.clientHeight);
        cardRenderer.appendChild(renderer.domElement);
        
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000);
        camera.position.z = 1;
        
        // Create clock for animation
        clock = new THREE.Clock();
        
        // Create a plane for the card
        const geometry = new THREE.PlaneGeometry(1, 1);
        
        // Create material with shader
        material = new THREE.ShaderMaterial({
            vertexShader: shaders.vertex,
            fragmentShader: shaders.rainbow,
            uniforms: {
                tDiffuse: { value: null },
                uTime: { value: 0 },
                uTilt: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector2(
                    cardRenderer.clientWidth, 
                    cardRenderer.clientHeight
                )}
            }
        });
        
        // Create mesh
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Initialize export manager
        exportManager.init(
            renderer.domElement,
            handleExportStart,
            handleExportProgress,
            handleExportComplete
        );
        
        // Start animation loop
        animate();
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
        
        // Load image
        const image = new Image();
        image.onload = () => {
            // Create texture
            const texture = new THREE.Texture(image);
            texture.needsUpdate = true;
            
            // Update material
            material.uniforms.tDiffuse.value = texture;
            
            // Store user image
            userImage = image;
            
            // Switch to card screen
            welcomeScreen.classList.remove('active');
            cardScreen.classList.add('active');
            
            // Initialize orientation manager
            orientationManager.init(cardRenderer);
            
            // Hide loading overlay
            loadingOverlay.classList.remove('active');
            
            // Announce to screen readers
            announceToScreenReader('图片已加载，您可以倾斜手机或拖动卡片查看全息效果');
        };
        
        image.onerror = () => {
            loadingOverlay.classList.remove('active');
            alert('图片加载失败，请尝试其他图片。');
        };
        
        image.src = url;
    }
    
    /**
     * Change holographic filter
     * @param {string} filter - Filter name: 'rainbow', 'metal', or 'cyber'
     */
    function changeFilter(filter) {
        if (filter === currentFilter) return;
        
        // Update current filter
        currentFilter = filter;
        
        // Update shader
        switch (filter) {
            case 'rainbow':
                material.fragmentShader = shaders.rainbow;
                break;
            case 'metal':
                material.fragmentShader = shaders.metal;
                break;
            case 'cyber':
                material.fragmentShader = shaders.cyber;
                break;
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
