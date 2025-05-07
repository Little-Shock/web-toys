/**
 * Device orientation and tilt handling for Holo-Card Tilt
 * Manages device orientation events, touch/mouse interactions, and tilt calculations
 */

class OrientationManager {
    constructor() {
        // Tilt state
        this.tilt = { x: 0, y: 0 };
        this.targetTilt = { x: 0, y: 0 };
        
        // Interaction state
        this.isGyroActive = false;
        this.isDragging = false;
        this.isLocked = false;
        this.lastTouchTime = 0;
        
        // Sensitivity settings
        this.gyroSensitivity = 30; // Degrees to normalize to -1...1 range
        this.touchSensitivity = 2; // Multiplier for touch/mouse movement
        this.smoothingFactor = 0.15; // Lower = smoother but slower response
        
        // Bind methods
        this.handleDeviceOrientation = this.handleDeviceOrientation.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handlePointerLeave = this.handlePointerLeave.bind(this);
        this.requestPermission = this.requestPermission.bind(this);
        this.update = this.update.bind(this);
        this.toggleLock = this.toggleLock.bind(this);
        this.reset = this.reset.bind(this);
    }
    
    /**
     * Initialize orientation and touch event listeners
     * @param {HTMLElement} element - The element to attach pointer events to
     */
    init(element) {
        this.element = element;
        
        // Add pointer event listeners
        this.element.addEventListener('pointerdown', this.handlePointerDown);
        this.element.addEventListener('pointermove', this.handleMouseMove);
        this.element.addEventListener('pointerup', this.handlePointerUp);
        this.element.addEventListener('pointerleave', this.handlePointerLeave);
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        
        // Try to initialize device orientation
        this.initDeviceOrientation();
        
        // Start update loop
        this.lastTime = performance.now();
        requestAnimationFrame(this.update);
    }
    
    /**
     * Initialize device orientation with permission handling for iOS
     */
    initDeviceOrientation() {
        if (window.DeviceOrientationEvent) {
            // Check if permission is needed (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS requires user gesture to request permission
                document.body.addEventListener('click', this.requestPermission, { once: true });
                document.body.addEventListener('touchend', this.requestPermission, { once: true });
            } else {
                // For other browsers, just add the listener
                window.addEventListener('deviceorientation', this.handleDeviceOrientation);
            }
        }
    }
    
    /**
     * Request permission for device orientation (iOS 13+)
     */
    requestPermission() {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', this.handleDeviceOrientation);
                    
                    // Provide vibration feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    // Announce to screen readers
                    this.announceToScreenReader('设备方向已启用，请倾斜手机体验全息效果');
                }
            })
            .catch(console.error);
    }
    
    /**
     * Handle device orientation event
     * @param {DeviceOrientationEvent} event 
     */
    handleDeviceOrientation(event) {
        if (this.isLocked) return;
        
        // Check if we have valid data
        if (event.beta === null || event.gamma === null) return;
        
        this.isGyroActive = true;
        
        // Convert orientation angles to normalized tilt values (-1 to 1)
        this.targetTilt.x = Math.max(-1, Math.min(1, event.gamma / this.gyroSensitivity));
        this.targetTilt.y = Math.max(-1, Math.min(1, event.beta / this.gyroSensitivity));
    }
    
    /**
     * Handle mouse movement
     * @param {PointerEvent} event 
     */
    handleMouseMove(event) {
        if (this.isLocked) return;
        if (this.isGyroActive) return; // Gyro has priority
        if (!this.isDragging && event.pointerType !== 'mouse') return; // Touch must be held
        
        // Get element bounds
        const rect = this.element.getBoundingClientRect();
        
        // Calculate normalized position (-1 to 1) from center
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        
        this.targetTilt.x = x * this.touchSensitivity;
        this.targetTilt.y = y * this.touchSensitivity;
    }
    
    /**
     * Handle touch movement with throttling
     * @param {TouchEvent} event 
     */
    handleTouchMove(event) {
        if (this.isLocked) return;
        if (this.isGyroActive) return; // Gyro has priority
        if (!this.isDragging) return;
        
        // Prevent default to avoid scrolling
        event.preventDefault();
        
        // Throttle touch events to improve performance
        const now = performance.now();
        if (now - this.lastTouchTime < 16) return; // ~60fps
        this.lastTouchTime = now;
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const rect = this.element.getBoundingClientRect();
            
            // Calculate normalized position (-1 to 1) from center
            const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((touch.clientY - rect.top) / rect.height - 0.5) * 2;
            
            this.targetTilt.x = x * this.touchSensitivity;
            this.targetTilt.y = y * this.touchSensitivity;
        }
    }
    
    /**
     * Handle pointer down event
     */
    handlePointerDown() {
        this.isDragging = true;
    }
    
    /**
     * Handle pointer up event
     */
    handlePointerUp() {
        this.isDragging = false;
        if (!this.isGyroActive && !this.isLocked) {
            this.reset();
        }
    }
    
    /**
     * Handle pointer leave event
     */
    handlePointerLeave() {
        this.isDragging = false;
        if (!this.isGyroActive && !this.isLocked) {
            this.reset();
        }
    }
    
    /**
     * Toggle lock state
     * @returns {boolean} New lock state
     */
    toggleLock() {
        this.isLocked = !this.isLocked;
        return this.isLocked;
    }
    
    /**
     * Reset tilt to neutral position
     */
    reset() {
        this.targetTilt.x = 0;
        this.targetTilt.y = 0;
    }
    
    /**
     * Update tilt values with smooth interpolation
     * Called on each animation frame
     */
    update() {
        // Smoothly interpolate current tilt towards target tilt
        this.tilt.x = this.tilt.x + (this.targetTilt.x - this.tilt.x) * this.smoothingFactor;
        this.tilt.y = this.tilt.y + (this.targetTilt.y - this.tilt.y) * this.smoothingFactor;
        
        // Continue the animation loop
        requestAnimationFrame(this.update);
    }
    
    /**
     * Get current tilt values
     * @returns {Object} Object with x and y tilt values
     */
    getTilt() {
        return { x: this.tilt.x, y: this.tilt.y };
    }
    
    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
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
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
        this.element.removeEventListener('pointerdown', this.handlePointerDown);
        this.element.removeEventListener('pointermove', this.handleMouseMove);
        this.element.removeEventListener('pointerup', this.handlePointerUp);
        this.element.removeEventListener('pointerleave', this.handlePointerLeave);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
    }
}
