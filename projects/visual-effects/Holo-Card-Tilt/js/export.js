/**
 * Export functionality for Holo-Card Tilt
 * Handles GIF and MP4 recording and export
 */

class ExportManager {
    constructor() {
        this.isRecording = false;
        this.recordingType = null;
        this.frames = [];
        this.recordingStartTime = 0;
        this.recordingDuration = 3000; // 3 seconds by default
        this.frameRate = 30; // Frames per second
        this.frameInterval = 1000 / this.frameRate;
        this.lastFrameTime = 0;
        this.gif = null;
        this.mediaRecorder = null;
        this.mediaChunks = [];
        
        // Bind methods
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.captureFrame = this.captureFrame.bind(this);
        this.processGif = this.processGif.bind(this);
        this.processVideo = this.processVideo.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.shareFile = this.shareFile.bind(this);
    }
    
    /**
     * Initialize the export manager
     * @param {HTMLCanvasElement} canvas - The canvas to capture
     * @param {Function} onStart - Callback when recording starts
     * @param {Function} onProgress - Callback during recording progress (0-1)
     * @param {Function} onComplete - Callback when recording is complete
     */
    init(canvas, onStart, onProgress, onComplete) {
        this.canvas = canvas;
        this.onStart = onStart || (() => {});
        this.onProgress = onProgress || (() => {});
        this.onComplete = onComplete || (() => {});
        
        // Initialize GIF.js
        this.gif = new GIF({
            workers: 2,
            quality: 10,
            width: this.canvas.width,
            height: this.canvas.height,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
        });
        
        this.gif.on('progress', progress => {
            this.onProgress(progress);
        });
        
        this.gif.on('finished', blob => {
            this.onComplete(blob, 'gif');
        });
    }
    
    /**
     * Start recording
     * @param {string} type - 'gif' or 'mp4'
     * @param {number} duration - Recording duration in milliseconds
     */
    startRecording(type = 'gif', duration = 3000) {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordingType = type;
        this.recordingDuration = duration;
        this.recordingStartTime = performance.now();
        this.lastFrameTime = this.recordingStartTime;
        this.frames = [];
        this.mediaChunks = [];
        
        this.onStart(type);
        
        if (type === 'mp4') {
            try {
                const stream = this.canvas.captureStream(this.frameRate);
                this.mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: 5000000 // 5 Mbps
                });
                
                this.mediaRecorder.ondataavailable = event => {
                    if (event.data && event.data.size > 0) {
                        this.mediaChunks.push(event.data);
                    }
                };
                
                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.mediaChunks, { type: 'video/webm' });
                    this.onComplete(blob, 'mp4');
                };
                
                this.mediaRecorder.start();
                
                // Set timeout to stop recording
                setTimeout(() => {
                    if (this.isRecording) {
                        this.stopRecording();
                    }
                }, this.recordingDuration);
            } catch (error) {
                console.error('MediaRecorder error:', error);
                this.isRecording = false;
                this.onComplete(null, 'error');
                alert('视频录制失败，请尝试使用GIF格式或更新浏览器。');
            }
        } else {
            // For GIF, we'll capture frames manually
            this.captureFrame();
        }
    }
    
    /**
     * Capture a frame for GIF recording
     */
    captureFrame() {
        if (!this.isRecording || this.recordingType !== 'gif') return;
        
        const now = performance.now();
        const elapsed = now - this.recordingStartTime;
        
        // Check if we should capture a frame based on frameRate
        if (now - this.lastFrameTime >= this.frameInterval) {
            this.lastFrameTime = now;
            this.frames.push(this.canvas.toDataURL('image/png'));
            
            // Update progress
            const progress = Math.min(1, elapsed / this.recordingDuration);
            this.onProgress(progress);
        }
        
        // Check if recording is complete
        if (elapsed >= this.recordingDuration) {
            this.stopRecording();
        } else {
            // Continue capturing frames
            requestAnimationFrame(this.captureFrame);
        }
    }
    
    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.recordingType === 'gif') {
            this.processGif();
        } else if (this.recordingType === 'mp4' && this.mediaRecorder) {
            if (this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
        }
    }
    
    /**
     * Process captured frames into a GIF
     */
    processGif() {
        this.gif.abort(); // Clear any previous processing
        
        // Reset GIF
        this.gif = new GIF({
            workers: 2,
            quality: 10,
            width: this.canvas.width,
            height: this.canvas.height,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
        });
        
        this.gif.on('progress', progress => {
            this.onProgress(0.5 + progress * 0.5); // Second half of progress bar
        });
        
        this.gif.on('finished', blob => {
            this.onComplete(blob, 'gif');
        });
        
        // Add frames to GIF
        const totalFrames = this.frames.length;
        const frameDelay = this.recordingDuration / totalFrames;
        
        this.frames.forEach((dataUrl, index) => {
            const img = new Image();
            img.onload = () => {
                this.gif.addFrame(img, { delay: frameDelay, copy: true });
                this.onProgress(0.5 * (index / totalFrames)); // First half of progress bar
                
                // Start rendering when all frames are added
                if (index === totalFrames - 1) {
                    this.gif.render();
                }
            };
            img.src = dataUrl;
        });
    }
    
    /**
     * Process video recording (already handled by MediaRecorder)
     */
    processVideo() {
        // Processing is handled by MediaRecorder's onstop event
    }
    
    /**
     * Download the recorded file
     * @param {Blob} blob - The file blob
     * @param {string} type - 'gif' or 'mp4'
     */
    downloadFile(blob, type) {
        if (!blob) return;
        
        const extension = type === 'gif' ? 'gif' : 'webm';
        const filename = `holo-card-${new Date().getTime()}.${extension}`;
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    /**
     * Share the recorded file using Web Share API if available
     * @param {Blob} blob - The file blob
     * @param {string} type - 'gif' or 'mp4'
     */
    shareFile(blob, type) {
        if (!blob || !navigator.share) {
            // Fallback to download if Web Share API is not available
            this.downloadFile(blob, type);
            return;
        }
        
        const extension = type === 'gif' ? 'gif' : 'webm';
        const filename = `holo-card-${new Date().getTime()}.${extension}`;
        const file = new File([blob], filename, { 
            type: type === 'gif' ? 'image/gif' : 'video/webm' 
        });
        
        navigator.share({
            title: 'Holo-Card Tilt',
            text: '查看我制作的全息闪卡！',
            files: [file]
        }).catch(error => {
            console.error('Share failed:', error);
            // Fallback to download
            this.downloadFile(blob, type);
        });
    }
}
