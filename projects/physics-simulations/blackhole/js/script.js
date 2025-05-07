/**
 * Black Hole Simulation
 * A frontend-only implementation optimized for mobile devices
 */

// Simple easing functions to replace the external dependency
const easingFunctions = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 10 * (2 * t - 1)) / 2 : (2 - Math.pow(2, -10 * (2 * t - 1))) / 2
};

class AHole extends HTMLElement {
  /**
   * Initialize the black hole
   */
  connectedCallback() {
    // Elements
    this.canvas = this.querySelector(".js-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Properties
    this.discs = [];
    this.lines = [];
    this.particles = [];
    this.isMobile = window.innerWidth < 768;
    this.isActive = false;
    this.touchPosition = { x: 0, y: 0 };

    // Performance settings based on device
    this.settings = {
      totalDiscs: this.isMobile ? 50 : 100,
      totalLines: this.isMobile ? 50 : 100,
      totalParticles: this.isMobile ? 50 : 100,
      particleSpeed: this.isMobile ? 0.8 : 1,
      discAnimationSpeed: 0.001
    };

    // Initialize
    this.setSize();
    this.setDiscs();
    this.setLines();
    this.setParticles();
    this.bindEvents();

    // Start animation loop
    this.lastTime = 0;
    requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Bind events for window resize and touch interactions
   */
  bindEvents() {
    // Resize event
    window.addEventListener("resize", this.onResize.bind(this));

    // Touch events for mobile interaction
    this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.onTouchEnd.bind(this));

    // Mouse events for desktop interaction
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  /**
   * Touch event handlers
   */
  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.isActive = true;
    this.touchPosition = {
      x: touch.clientX - this.rect.left,
      y: touch.clientY - this.rect.top
    };
    this.addParticlesBurst(this.touchPosition.x, this.touchPosition.y, 20);
  }

  onTouchMove(e) {
    if (!this.isActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.touchPosition = {
      x: touch.clientX - this.rect.left,
      y: touch.clientY - this.rect.top
    };
    this.addParticlesBurst(this.touchPosition.x, this.touchPosition.y, 5);
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.isActive = false;
  }

  /**
   * Mouse event handlers
   */
  onMouseDown(e) {
    this.isActive = true;
    this.touchPosition = {
      x: e.clientX - this.rect.left,
      y: e.clientY - this.rect.top
    };
    this.addParticlesBurst(this.touchPosition.x, this.touchPosition.y, 20);
  }

  onMouseMove(e) {
    if (!this.isActive) return;
    this.touchPosition = {
      x: e.clientX - this.rect.left,
      y: e.clientY - this.rect.top
    };
    this.addParticlesBurst(this.touchPosition.x, this.touchPosition.y, 5);
  }

  onMouseUp() {
    this.isActive = false;
  }

  /**
   * Add a burst of particles at the specified position
   */
  addParticlesBurst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      const size = 1 + Math.random() * 3;
      const lifespan = 30 + Math.random() * 70;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: `rgba(${Math.floor(100 + Math.random() * 155)}, ${Math.floor(100 + Math.random() * 155)}, 255, ${0.5 + Math.random() * 0.5})`,
        life: lifespan,
        maxLife: lifespan,
        type: 'burst'
      });
    }
  }

  /**
   * Resize handler
   */
  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.settings.totalDiscs = this.isMobile ? 50 : 100;
    this.settings.totalLines = this.isMobile ? 50 : 100;
    this.settings.totalParticles = this.isMobile ? 50 : 100;
    this.settings.particleSpeed = this.isMobile ? 0.8 : 1;

    this.setSize();
    this.setDiscs();
    this.setLines();
    this.setParticles();
  }

  /**
   * Set canvas size
   */
  setSize() {
    this.rect = this.getBoundingClientRect();

    this.render = {
      width: this.rect.width,
      height: this.rect.height,
      dpi: window.devicePixelRatio || 1
    };

    this.canvas.width = this.render.width * this.render.dpi;
    this.canvas.height = this.render.height * this.render.dpi;
    this.canvas.style.width = `${this.render.width}px`;
    this.canvas.style.height = `${this.render.height}px`;
  }

  /**
   * Set up the discs that form the black hole
   */
  setDiscs() {
    const { width, height } = this.rect;

    this.discs = [];

    // Define the start and end points for the black hole
    this.startDisc = {
      x: width * 0.5,
      y: height * 0.45,
      w: width * 0.75,
      h: height * 0.7,
      p: 0
    };

    this.endDisc = {
      x: width * 0.5,
      y: height * 0.95,
      w: 0,
      h: 0
    };

    const totalDiscs = this.settings.totalDiscs;

    let prevBottom = height;
    this.clip = {};

    // Create the discs
    for (let i = 0; i < totalDiscs; i++) {
      const p = i / totalDiscs;

      const disc = this.tweenDisc({
        p
      });

      const bottom = disc.y + disc.h;

      if (bottom <= prevBottom) {
        this.clip = {
          disc: { ...disc },
          i
        };
      }

      prevBottom = bottom;

      this.discs.push(disc);
    }

    // Create the clipping path
    this.clipPath = new Path2D();
    this.clipPath.ellipse(
      this.clip.disc.x,
      this.clip.disc.y,
      this.clip.disc.w,
      this.clip.disc.h,
      0,
      0,
      Math.PI * 2
    );
    this.clipPath.rect(
      this.clip.disc.x - this.clip.disc.w,
      0,
      this.clip.disc.w * 2,
      this.clip.disc.y
    );
  }

  /**
   * Set up the lines radiating from the center
   */
  setLines() {
    const { width, height } = this.rect;

    this.lines = [];

    const totalLines = this.settings.totalLines;
    const linesAngle = (Math.PI * 2) / totalLines;

    // Initialize the lines array
    for (let i = 0; i < totalLines; i++) {
      this.lines.push([]);
    }

    // Calculate points for each line
    this.discs.forEach((disc) => {
      for (let i = 0; i < totalLines; i++) {
        const angle = i * linesAngle;

        const p = {
          x: disc.x + Math.cos(angle) * disc.w,
          y: disc.y + Math.sin(angle) * disc.h
        };

        this.lines[i].push(p);
      }
    });

    // Pre-render the lines to a separate canvas for better performance
    this.linesCanvas = document.createElement('canvas');
    this.linesCanvas.width = width;
    this.linesCanvas.height = height;
    const ctx = this.linesCanvas.getContext("2d");

    // Draw each line
    this.lines.forEach((line) => {
      ctx.save();

      let lineIsIn = false;
      line.forEach((p1, j) => {
        if (j === 0) return;

        const p0 = line[j - 1];

        // Check if the line is inside the clipping path
        if (!lineIsIn && this.isPointInPath(ctx, p1.x, p1.y)) {
          lineIsIn = true;
        } else if (lineIsIn) {
          ctx.clip(this.clipPath);
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
      });

      ctx.restore();
    });

    this.linesCtx = ctx;
  }

  /**
   * Helper method to check if a point is in the path
   * Compatible with browsers that don't support isPointInPath with Path2D
   */
  isPointInPath(ctx, x, y) {
    try {
      return ctx.isPointInPath(this.clipPath, x, y) || ctx.isPointInStroke(this.clipPath, x, y);
    } catch (e) {
      // Fallback for browsers that don't support isPointInPath with Path2D
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        this.clip.disc.x,
        this.clip.disc.y,
        this.clip.disc.w,
        this.clip.disc.h,
        0,
        0,
        Math.PI * 2
      );
      ctx.rect(
        this.clip.disc.x - this.clip.disc.w,
        0,
        this.clip.disc.w * 2,
        this.clip.disc.y
      );
      const result = ctx.isPointInPath(x, y) || ctx.isPointInStroke(x, y);
      ctx.restore();
      return result;
    }
  }

  /**
   * Set up the particles
   */
  setParticles() {
    const { width, height } = this.rect;

    this.particles = [];

    // Define the area where particles can appear
    this.particleArea = {
      sw: this.clip.disc.w * 0.5,
      ew: this.clip.disc.w * 2,
      h: height * 0.85
    };
    this.particleArea.sx = (width - this.particleArea.sw) / 2;
    this.particleArea.ex = (width - this.particleArea.ew) / 2;

    const totalParticles = this.settings.totalParticles;

    // Create initial particles
    for (let i = 0; i < totalParticles; i++) {
      const particle = this.initParticle(true);
      this.particles.push(particle);
    }
  }

  /**
   * Initialize a new particle
   */
  initParticle(start = false) {
    const sx = this.particleArea.sx + this.particleArea.sw * Math.random();
    const ex = this.particleArea.ex + this.particleArea.ew * Math.random();
    const dx = ex - sx;
    const y = start ? this.particleArea.h * Math.random() : this.particleArea.h;
    const size = 0.5 + Math.random() * 3;
    const vy = (0.5 + Math.random()) * this.settings.particleSpeed;
    const opacity = 0.3 + Math.random() * 0.7;

    return {
      x: sx,
      y: y,
      sx: sx,
      dx: dx,
      vy: vy,
      p: 0,
      size: size,
      color: `rgba(255, 255, 255, ${opacity})`,
      type: 'stream'
    };
  }

  /**
   * Tween a value between start and end points
   */
  tweenValue(start, end, p, ease = 'linear') {
    const delta = end - start;
    const easeFn = easingFunctions[ease] || easingFunctions.linear;
    return start + delta * easeFn(p);
  }

  /**
   * Draw the discs
   */
  drawDiscs() {
    const { ctx } = this;

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;

    // Outer disc
    const outerDisc = this.startDisc;

    ctx.beginPath();
    ctx.ellipse(
      outerDisc.x,
      outerDisc.y,
      outerDisc.w,
      outerDisc.h,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.closePath();

    // Inner discs
    this.discs.forEach((disc, i) => {
      // Only draw every few discs for better performance
      if (i % (this.isMobile ? 10 : 5) !== 0) {
        return;
      }

      if (disc.w < this.clip.disc.w - 5) {
        ctx.save();
        ctx.clip(this.clipPath);
      }

      ctx.beginPath();
      ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();

      if (disc.w < this.clip.disc.w - 5) {
        ctx.restore();
      }
    });
  }

  /**
   * Draw the lines
   */
  drawLines() {
    const { ctx, linesCanvas } = this;
    ctx.drawImage(linesCanvas, 0, 0);
  }

  /**
   * Draw the particles
   */
  drawParticles() {
    const { ctx } = this;

    ctx.save();
    ctx.clip(this.clipPath);

    // Draw stream particles
    this.particles.forEach(particle => {
      if (particle.type === 'stream') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.rect(particle.x, particle.y, particle.size, particle.size);
        ctx.fill();
        ctx.closePath();
      }
    });

    ctx.restore();

    // Draw burst particles (outside the clip path)
    this.particles.forEach(particle => {
      if (particle.type === 'burst') {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.beginPath();
        ctx.rect(particle.x, particle.y, particle.size * alpha, particle.size * alpha);
        ctx.fill();
        ctx.closePath();
      }
    });
  }

  /**
   * Move the discs
   */
  moveDiscs() {
    this.discs.forEach((disc) => {
      disc.p = (disc.p + this.settings.discAnimationSpeed) % 1;
      this.tweenDisc(disc);
    });
  }

  /**
   * Move the particles
   */
  moveParticles() {
    // Filter out dead particles
    this.particles = this.particles.filter(particle => {
      if (particle.type === 'burst') {
        particle.life--;
        return particle.life > 0;
      }
      return true;
    });

    // Move stream particles
    this.particles.forEach(particle => {
      if (particle.type === 'stream') {
        particle.p = 1 - particle.y / this.particleArea.h;
        particle.x = particle.sx + particle.dx * particle.p;
        particle.y -= particle.vy;

        if (particle.y < 0) {
          Object.assign(particle, this.initParticle());
        }
      } else if (particle.type === 'burst') {
        // Move burst particles
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply gravity toward the black hole
        const dx = this.clip.disc.x - particle.x;
        const dy = this.clip.disc.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.clip.disc.w * 2) {
          const force = 0.1 * (1 - distance / (this.clip.disc.w * 2));
          particle.vx += dx / distance * force;
          particle.vy += dy / distance * force;
        }

        // Apply drag
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      }
    });

    // Add new stream particles if needed
    while (this.particles.filter(p => p.type === 'stream').length < this.settings.totalParticles) {
      this.particles.push(this.initParticle());
    }
  }

  /**
   * Tween a disc between start and end points
   */
  tweenDisc(disc) {
    disc.x = this.tweenValue(this.startDisc.x, this.endDisc.x, disc.p);
    disc.y = this.tweenValue(
      this.startDisc.y,
      this.endDisc.y,
      disc.p,
      'easeInExpo'
    );

    disc.w = this.tweenValue(this.startDisc.w, this.endDisc.w, disc.p);
    disc.h = this.tweenValue(this.startDisc.h, this.endDisc.h, disc.p);

    return disc;
  }

  /**
   * Animation loop
   */
  tick(currentTime) {
    const { ctx } = this;
    const deltaTime = currentTime - (this.lastTime || currentTime);
    this.lastTime = currentTime;

    // Clear the canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply device pixel ratio scaling
    ctx.save();
    ctx.scale(this.render.dpi, this.render.dpi);

    // Update and draw
    this.moveDiscs();
    this.moveParticles();

    this.drawDiscs();
    this.drawLines();
    this.drawParticles();

    ctx.restore();

    // Continue the animation loop
    requestAnimationFrame(this.tick.bind(this));
  }
}

// Register the custom element
customElements.define("a-hole", AHole);
