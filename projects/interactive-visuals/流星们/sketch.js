
// Helper to detect mobile devices (basic check)
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) ||
         /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4)) || (window.innerWidth <= 800 && window.innerHeight <= 600) ;
}

// Global Configuration Object
const config = {
numParticles: isMobileDevice() ? 45 : 100,
particleMaxSpeedMin: 1.5,
particleMaxSpeedMax: isMobileDevice() ? 4.5 : 6,
particleTrailLengthMin: 8,
particleTrailLengthMax: isMobileDevice() ? 28 : 45,
particleRadiusMin: isMobileDevice() ? 2.2 : 2,
particleRadiusMax: isMobileDevice() ? 5.5 : 7,
particleLifespan: isMobileDevice() ? 450 : 650,
fadeInDuration: 50,
fadeOutDuration: 90,

enableSeek: true,
seekForce: 0.8, 
enableFlowField: !isMobileDevice(), 
flowFieldStrength: 0.5,
enableRepulsion: !isMobileDevice(), // Repulsion can also be a bit heavy on mobile
repulsionForce: 0.9,
repulsionRadiusMultiplier: 3.0,

backgroundColor: [230, 35, 13],
backgroundAlpha: isMobileDevice() ? 28 : 22, // Slightly faster clear on mobile
globalHueSpeed: 0.07,

flowFieldScale: 23,
flowFieldNoiseIncrement: 0.075,
flowFieldTimeIncrement: 0.003,

palettes: {
  "default":     { H: [0, 360],  S: [75, 100], B: [85, 100] },
  "fiery":       { H: [0, 60],   S: [85, 100], B: [85, 100] },
  "ocean":       { H: [180, 260],S: [70, 100], B: [75, 100] },
  "forest":      { H: [70, 160], S: [60, 90],  B: [65, 90]  },
  "nebula":      { H: [240, 330],S: [70, 100], B: [80, 100] },
  "monochrome":  { H: [0, 360],  S: [0, 0],    B: [70, 100] }
},
activePalette: "default",

mouseBurstRadius: isMobileDevice() ? 130 : 180,
mouseBurstStrength: 20,
mouseDragInfluenceRadius: isMobileDevice() ? 100 : 150,
mouseDragForceMultiplier: isMobileDevice() ? 5.0 : 4.0,
};

// --- UI System Variables ---
let uiElements = [];
let uiOpen = false; // If the panel is visually open
let activeSlider = null; 
let activeTouchID = null; // Store the ID of the touch interacting with UI

const uiPanelWidth = 220; 
const uiPadding = 10;     
const uiElementHeight = 28; // Taller for touch
const uiHeaderHeight = 35;
const uiLabelOffset = 6;
const uiValueXOffset = 110; 
const uiSliderTrackXOffset = 110; 
const uiSliderThumbSize = 20; // Larger thumb 
const uiToggleSize = 20;      

let uiPanelCurrentX = -uiPanelWidth; // Start off-screen (left)
let uiPanelTargetX = -uiPanelWidth;  // Target X for animation

const uiToggleButtonSize = 35;     // The 'gear' icon button
const uiToggleButtonPadding = 15;
// --- End UI System Variables ---

// Particle class (Assumed to be the same as the previous version, using config)
class Particle { /* ... Same as before ... */ 
constructor(x, y) { this.respawn(x, y); }
respawn(x,y){ this.pos = (x !== undefined && y !== undefined) ? createVector(x, y) : createVector(random(width), random(height)); this.vel = p5.Vector.random2D(); this.vel.mult(random(1,2.5)); this.acc = createVector(0,0); this.maxSpeed = random(config.particleMaxSpeedMin, config.particleMaxSpeedMax); this.originalMaxSpeed = this.maxSpeed; this.baseMaxForce = random(0.1,0.3); this.r = random(config.particleRadiusMin, config.particleRadiusMax); this.history = []; this.trailLength = int(random(config.particleTrailLengthMin, config.particleTrailLengthMax)); const palette = config.palettes[config.activePalette] || config.palettes["default"]; this.baseHue = random(palette.H[0], palette.H[1]); this.baseSat = random(palette.S[0], palette.S[1]); this.baseBri = random(palette.B[0], palette.B[1]); this.age = 0; this.lifespan = config.particleLifespan > 0 ? config.particleLifespan + random(-config.particleLifespan * 0.15, config.particleLifespan * 0.15) : 0; this.perturbationTimer = 0; }
update(){ if(this.lifespan > 0){ this.age++; if(this.age > this.lifespan){ this.respawn(); return; }} if(this.perturbationTimer > 0){ this.vel.mult(0.95); this.perturbationTimer--; if(this.perturbationTimer === 0){ this.maxSpeed = this.originalMaxSpeed; }}else{ this.vel.add(this.acc); } this.vel.limit(this.maxSpeed); this.pos.add(this.vel); this.acc.mult(0); this.history.push(this.pos.copy()); if(this.history.length > this.trailLength){ this.history.splice(0,1); }}
applyForce(force){ this.acc.add(force); }
seek(target){ if(this.perturbationTimer > 0 || !config.enableSeek) return; let desired = p5.Vector.sub(target, this.pos); let d = desired.mag(); if(d < 180){ let m = map(d,0,180,0,this.maxSpeed * 1.2); desired.setMag(m); }else{ desired.setMag(this.maxSpeed); } let steer = p5.Vector.sub(desired, this.vel); steer.limit(this.baseMaxForce * config.seekForce * 2.5); this.applyForce(steer); }
applyFlow(flowVector){ if(this.perturbationTimer > 0 || !config.enableFlowField) return; this.applyForce(flowVector.copy().mult(this.baseMaxForce * config.flowFieldStrength)); }
repel(particles){ if(this.perturbationTimer > 0 || !config.enableRepulsion) return; let repulsionRadius = this.r * config.repulsionRadiusMultiplier; let totalRepulsion = createVector(0,0); let count = 0; for(let other of particles){ if(other !== this){ let d = p5.Vector.dist(this.pos, other.pos); if(d > 0 && d < repulsionRadius){ let diff = p5.Vector.sub(this.pos, other.pos); diff.normalize(); diff.div(d * 0.15); totalRepulsion.add(diff); count++; }}} if(count > 0){ totalRepulsion.div(count); totalRepulsion.limit(this.baseMaxForce * config.repulsionForce); this.applyForce(totalRepulsion); }}
display(globalHueOffset){ let currentAlpha = 100; if(this.lifespan > 0){ if(this.age < config.fadeInDuration){ currentAlpha = map(this.age,0,config.fadeInDuration,0,100); }else if(this.age > this.lifespan - config.fadeOutDuration){ currentAlpha = map(this.age, this.lifespan - config.fadeOutDuration, this.lifespan, 100,0); }} currentAlpha = constrain(currentAlpha,0,100); let particleHue = this.baseHue; let particleSat = this.baseSat; let particleBri = this.baseBri; if(this.perturbationTimer > 0){ particleSat = constrain(this.baseSat + 30,0,100); particleBri = constrain(this.baseBri + map(this.perturbationTimer,60,0,30,-20),60,100); particleHue = (this.baseHue + 180 + random(-70,70)) % 360; } if(this.history.length > 1){ beginShape(); noFill(); for(let i = 0; i < this.history.length; i++){ let p = this.history[i]; let trailHueProgress = (particleHue + globalHueOffset + i * 0.7) % 360; let alphaFactor = map(i,0,this.history.length,0.05,1); let trailAlpha = currentAlpha * 0.65 * alphaFactor; let weight = map(i,0,this.history.length,this.r * 0.15, this.r * 0.65); stroke(trailHueProgress, particleSat * 0.85, particleBri * 0.85, trailAlpha); strokeWeight(weight); vertex(p.x, p.y); } endShape(); } fill((particleHue + globalHueOffset) % 360, particleSat, particleBri, currentAlpha * 0.9); noStroke(); ellipse(this.pos.x, this.pos.y, this.r, this.r); }
edges(){ let wrapped = false; if(this.pos.x > width + this.r){this.pos.x = -this.r; wrapped = true;} else if(this.pos.x < -this.r){this.pos.x = width + this.r; wrapped = true;} if(this.pos.y > height + this.r){this.pos.y = -this.r; wrapped = true;} else if(this.pos.y < -this.r){this.pos.y = height + this.r; wrapped = true;} if(wrapped){this.history = [];}}
burst(){ this.vel.mult(random(2.8,4.8)); this.vel.rotate(random(-PI,PI)); this.acc.mult(0); this.perturbationTimer = 70; this.maxSpeed = this.originalMaxSpeed * 2.2; }
}


let particles = [];
let flowField;
let zOffset = 0; 
let stars = [];
const numStars = isMobileDevice() ? 80 : 150;

function setupStars() { stars = []; for(let i=0; i<numStars; i++){ stars.push({ x: random(width), y: random(height), size: random(0.2, isMobileDevice() ? 1.2 : 1.5), baseAlpha: random(20,70) });}}
function drawStars(globalHueOffset) { for(let star of stars){ let starHue = (200 + globalHueOffset * 0.1 + random(-20,20)) % 360; let starSat = random(2,12); let starBri = 100; let starAlpha = star.baseAlpha * (0.6 + sin(frameCount * 0.02 + star.y) * 0.4); starAlpha = starAlpha * (config.backgroundAlpha / 60); fill(starHue,starSat,starBri,constrain(starAlpha,0,100)); noStroke(); ellipse(star.x,star.y,star.size,star.size);}}


function setup() {
createCanvas(windowWidth, windowHeight);
colorMode(HSB, 360, 100, 100, 100);

setupUI(); 
initSystem(); // Initialize particles and flow field
setupStars();

console.log("Tap/Click gear icon (top-left) to toggle UI Panel.");
if (isMobileDevice()) {
  console.log("Mobile device detected: Using optimized settings.");
  // frameRate(30); // Optionally cap frame rate on mobile
}
}

function initSystem(fullResetParticles = true) {
  if (fullResetParticles) initParticles(); 
  if (config.enableFlowField) calculateFlowField(); else flowField = [];
}

function initParticles() {
  particles = [];
  for (let i = 0; i < config.numParticles; i++) {
      particles.push(new Particle(random(width), random(height)));
  }
}
function calculateFlowField() { /* ... Same as before, uses config ... */ 
if (!config.enableFlowField || config.flowFieldScale <=0) { flowField = []; return; }
let cols = floor(width / config.flowFieldScale); let rows = floor(height / config.flowFieldScale);
if (cols === 0 || rows === 0) { flowField = []; return; }
flowField = new Array(cols * rows); noiseDetail(3, 0.45); let yNoiseOffset = 0;
for (let y = 0; y < rows; y++) { let xNoiseOffset = 0;
  for (let x = 0; x < cols; x++) {
    let angle = noise(xNoiseOffset, yNoiseOffset, zOffset) * TWO_PI * 2.5; 
    let v = p5.Vector.fromAngle(angle); v.setMag(1); 
    flowField[x + y * cols] = v; xNoiseOffset += config.flowFieldNoiseIncrement;
  } yNoiseOffset += config.flowFieldNoiseIncrement;
} zOffset += config.flowFieldTimeIncrement; 
}


function draw() {
background(config.backgroundColor[0], config.backgroundColor[1], config.backgroundColor[2], config.backgroundAlpha);
let globalHueOffset = (frameCount * config.globalHueSpeed) % 360;
drawStars(globalHueOffset);

// Animate UI panel
uiPanelCurrentX = lerp(uiPanelCurrentX, uiPanelTargetX, 0.25);

if (config.enableFlowField && frameCount % (isMobileDevice() ? 4 : 2) === 0) { // Update flow field less often on mobile
    calculateFlowField();
}

// Determine interaction point (mouse or first touch)
let interactPt = { x: mouseX, y: mouseY };
if (touches.length > 0) {
  interactPt = { x: touches[0].x, y: touches[0].y };
}


for (let p of particles) {
  if (config.enableFlowField && flowField && flowField.length > 0) {
      let xGrid = floor(p.pos.x / config.flowFieldScale);
      let yGrid = floor(p.pos.y / config.flowFieldScale);
      let colsGrid = floor(width / config.flowFieldScale);
      let index = constrain(xGrid + yGrid * colsGrid, 0, flowField.length - 1);
      if (flowField[index]) { p.applyFlow(flowField[index]); }
  }
  if (config.enableRepulsion) p.repel(particles); 
  
  // Only seek if UI is not being actively dragged by a touch, or if mouse is used and no active touch on UI
  let UIIsActiveTouch = (activeTouchID !== null && touches.some(t => t.id === activeTouchID));
  if (config.enableSeek && !UIIsActiveTouch) {
      p.seek(createVector(interactPt.x, interactPt.y));
  }
  
  p.update();
  p.edges();
  p.display(globalHueOffset);
}

drawUI(); // Draw UI elements (panel, buttons, etc.)
}

// --- UI System Implementation ---
function setupUI() {
  uiElements = []; 
  let currentY = uiHeaderHeight + uiPadding; 

  const addElement = (el) => {
      // x positions are relative to the panel's 0, not screen 0
      el.x = uiPadding; 
      el.y = currentY;
      el.w = uiPanelWidth - 2 * uiPadding; 
      el.h = uiElementHeight;
      uiElements.push(el);
      currentY += uiElementHeight + uiPadding / 1.5;
  };
  
  // Sliders - Minimized list for brevity, add more as needed from previous version
  addElement({ type: 'slider', label: 'Particles', configKey: 'numParticles', min: 10, max: isMobileDevice() ? 100 : 200, step: 1, requiresReinit: true });
  addElement({ type: 'slider', label: 'Max Speed', configKey: 'particleMaxSpeedMax', min: 1, max: 10, step: 0.1 });
  addElement({ type: 'slider', label: 'Trail Len', configKey: 'particleTrailLengthMax', min: 5, max: 80, step: 1 });
  addElement({ type: 'slider', label: 'Seek Force', configKey: 'seekForce', min: 0.0, max: 2.0, step: 0.01 });
  addElement({ type: 'slider', label: 'BG Alpha', configKey: 'backgroundAlpha', min: 0, max: 100, step: 1 });


  // Toggles
  addElement({ type: 'toggle', label: 'Seek', configKey: 'enableSeek' });
  addElement({ type: 'toggle', label: 'Flow Field', configKey: 'enableFlowField', requiresReinit: 'flowfield' });
  addElement({ type: 'toggle', label: 'Repulsion', configKey: 'enableRepulsion' });

  // Buttons
  addElement({ type: 'button', label: 'Next Palette', action: () => {
      const paletteNames = Object.keys(config.palettes);
      let currentIndex = paletteNames.indexOf(config.activePalette);
      currentIndex = (currentIndex + 1) % paletteNames.length;
      config.activePalette = paletteNames[currentIndex];
      initParticles();
  }});
}

function drawUIToggleButton() {
  push();
  let btnX = uiToggleButtonPadding;
  let btnY = uiToggleButtonPadding;
  let hue = frameCount % 360;
  
  fill(hue, 80, 30, 70); // BG for button
  noStroke();
  ellipse(btnX + uiToggleButtonSize/2, btnY + uiToggleButtonSize/2, uiToggleButtonSize * 1.2);

  stroke(0,0,100);
  strokeWeight(2);
  fill(0,0,80); // Gear color

  // Simple Gear Icon
  translate(btnX + uiToggleButtonSize / 2, btnY + uiToggleButtonSize / 2);
  for (let i = 0; i < 6; i++) {
      rotate(PI / 3);
      rect(-3, -uiToggleButtonSize * 0.35, 6, uiToggleButtonSize * 0.2);
  }
  ellipse(0,0, uiToggleButtonSize * 0.4, uiToggleButtonSize * 0.4); // Center circle
  pop();
}

function drawUI() {
  drawUIToggleButton(); // Always draw the main toggle button

  if (abs(uiPanelCurrentX - uiPanelTargetX) < 0.1 && !uiOpen) return; // Don't draw panel if fully closed

  push();
  translate(uiPanelCurrentX, 0); // Move the coordinate system for the panel

  // Panel Background
  fill(20, 80, 20, 85); 
  noStroke();
  rect(0, 0, uiPanelWidth, height);

  // Header
  fill(0,0,100);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Settings", uiPanelWidth / 2, uiHeaderHeight / 2);

  // Close Button (X) for the panel
  let closeBtnSize = 20;
  let closeBtnX = uiPanelWidth - uiPadding - closeBtnSize;
  let closeBtnY = (uiHeaderHeight - closeBtnSize) / 2;
  fill(0, 80, 70, 70);
  rect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, 3);
  stroke(0,0,100);
  strokeWeight(2);
  line(closeBtnX + 5, closeBtnY + 5, closeBtnX + closeBtnSize - 5, closeBtnY + closeBtnSize - 5);
  line(closeBtnX + closeBtnSize - 5, closeBtnY + 5, closeBtnX + 5, closeBtnY + closeBtnSize - 5);


  for (let el of uiElements) {
      fill(0, 0, 90); 
      noStroke();
      textSize(12);
      textAlign(LEFT, CENTER);
      text(el.label, el.x + uiLabelOffset, el.y + el.h / 2);

      if (el.type === 'slider') {
          stroke(0, 0, 65);
          strokeWeight(3); // Thicker track for touch
          line(el.x + uiSliderTrackXOffset, el.y + el.h / 2, el.x + el.w - uiPadding / 2, el.y + el.h / 2);
          let thumbX = map(config[el.configKey], el.min, el.max, el.x + uiSliderTrackXOffset, el.x + el.w - uiPadding/2 );
          fill( (frameCount * 2 + el.y)%360, 85, 100); 
          stroke(0, 0, 100);
          strokeWeight(1.5);
          ellipse(thumbX, el.y + el.h / 2, uiSliderThumbSize, uiSliderThumbSize);
          fill(0,0,90); noStroke(); textAlign(RIGHT, CENTER);
          text(nf(config[el.configKey],0,(el.step < 1 ? 2:0)), el.x + uiSliderTrackXOffset - 8, el.y + el.h / 2);

      } else if (el.type === 'toggle') {
          stroke(0, 0, 75); strokeWeight(1.5);
          fill(config[el.configKey] ? [120, 85, 85, 80] : [0, 80, 80, 70]); 
          rect(el.x + uiValueXOffset, el.y + el.h/2 - uiToggleSize/2, uiToggleSize, uiToggleSize, 3);
          if (config[el.configKey]) { fill(0,0,100); noStroke(); textSize(12); textAlign(CENTER, CENTER); text("✓", el.x + uiValueXOffset + uiToggleSize/2, el.y + el.h/2); }
          fill(0,0,90); noStroke(); textAlign(LEFT, CENTER);
          text(config[el.configKey] ? "On" : "Off", el.x + uiValueXOffset + uiToggleSize + 5, el.y + el.h/2);

      } else if (el.type === 'button') {
          stroke(0, 0, 75); fill(50, 75, 65, 70);
          rect(el.x + uiValueXOffset, el.y, el.w - uiValueXOffset, el.h - 2, 4);
          fill(0,0,100); noStroke(); textAlign(CENTER, CENTER);
          text(el.label, el.x + uiValueXOffset + (el.w - uiValueXOffset)/2, el.y + el.h/2);
      }
  }
  pop(); 
}


function handleUIInteraction(px, py, eventType, touchId = null) {
  // 1. Check UI Toggle Button (Gear Icon) - Coordinates are screen-based
  let gearBtnX = uiToggleButtonPadding;
  let gearBtnY = uiToggleButtonPadding;
  if (dist(px, py, gearBtnX + uiToggleButtonSize/2, gearBtnY + uiToggleButtonSize/2) < uiToggleButtonSize/2 + 5) { // Add padding
      if (eventType === 'pressed' || eventType === 'touched') {
          uiOpen = !uiOpen;
          uiPanelTargetX = uiOpen ? 0 : -uiPanelWidth;
          activeSlider = null; // Reset active slider when toggling panel
          return true; // Consumed by gear button
      }
  }

  if (!uiOpen && abs(uiPanelCurrentX - (-uiPanelWidth)) < 1) return false; // Panel is fully closed, no further UI interaction

  // Transform px, py to be relative to the panel's current drawing position
  let panelX = px - uiPanelCurrentX;
  let panelY = py;

  // 2. Check Panel Close Button (X) - Coordinates are panel-relative
  let closeBtnSize = 20;
  let closeBtnX = uiPanelWidth - uiPadding - closeBtnSize;
  let closeBtnY = (uiHeaderHeight - closeBtnSize) / 2;
  if (panelX > closeBtnX && panelX < closeBtnX + closeBtnSize && 
      panelY > closeBtnY && panelY < closeBtnY + closeBtnSize) {
      if (eventType === 'pressed' || eventType === 'touched') {
          uiOpen = false;
          uiPanelTargetX = -uiPanelWidth;
          activeSlider = null;
          return true;
      }
  }
  
  // If interaction is outside the visible panel area (considering its current animated position)
  if (px > uiPanelCurrentX + uiPanelWidth || px < uiPanelCurrentX) {
      if (eventType === 'released' || eventType === 'touchEnded') activeSlider = null; // Release slider if touch ends outside
      return false;
  }


  for (let el of uiElements) {
      // All element coordinates (el.x, el.y) are relative to the panel's origin.
      // We use panelX, panelY for hit-testing.
      if (el.type === 'slider') {
          let trackLeft = el.x + uiSliderTrackXOffset;
          let trackRight = el.x + el.w - uiPadding / 2;
          let sliderY = el.y + el.h / 2;
          // Wider hit area for slider y-axis
          if (panelY > el.y - uiElementHeight*0.5 && panelY < el.y + el.h + uiElementHeight*0.5 && panelX > trackLeft - uiSliderThumbSize && panelX < trackRight + uiSliderThumbSize) {
               if (eventType === 'pressed' || eventType === 'touched') {
                  activeSlider = el;
                  activeTouchID = touchId;
              }
          }
          // Dragging logic (only if this slider is active and correct touch ID or mouse)
          if ((eventType === 'dragged' || eventType === 'touchMoved') && activeSlider === el && (activeTouchID === touchId || touchId === null)) {
              let val = map(panelX, trackLeft, trackRight, el.min, el.max, true);
              val = round(val / el.step) * el.step;
              if (abs(config[el.configKey] - val) > el.step / 20) { // Smaller tolerance for smoother drag
                  config[el.configKey] = val;
                  if (el.requiresReinit === true) initSystem();
                  else if (el.requiresReinit === 'flowfield') {
                      if (config.enableFlowField) calculateFlowField(); else flowField = [];
                  }
              }
              return true;
          }

      } else if (el.type === 'toggle' || el.type === 'button') {
          // Hit area for toggle/button value part
          let interactionAreaX = el.x + (el.type === 'toggle' ? uiValueXOffset : uiValueXOffset);
          let interactionAreaW = el.w - (el.type === 'toggle' ? uiValueXOffset : uiValueXOffset);
          
          if (panelY > el.y && panelY < el.y + el.h && panelX > interactionAreaX && panelX < interactionAreaX + interactionAreaW) {
              if (eventType === 'pressed' || eventType === 'touched') { // Act on press/touch for responsiveness
                  if (el.type === 'toggle') {
                      config[el.configKey] = !config[el.configKey];
                      if (el.requiresReinit === true) initSystem();
                      else if (el.requiresReinit === 'flowfield') {
                         if (config.enableFlowField) calculateFlowField(); else flowField = [];
                      }
                  } else if (el.type === 'button') {
                      el.action();
                  }
                  return true; 
              }
          }
      }
  }

  if (eventType === 'released' || eventType === 'touchEnded') {
      if (activeTouchID === touchId || touchId === null) { // only release if it's the tracked touch or mouse
         activeSlider = null;
         activeTouchID = null;
      }
  }
  // If inside panel but didn't hit specific element, still consider it handled by UI to prevent game interaction
  return panelX > 0 && panelX < uiPanelWidth && panelY > 0 && panelY < height;
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
// uiPanelCurrentX and uiPanelTargetX might need adjustment if panel visibility logic changes
setupUI(); // Re-layout UI 
initSystem(true); 
setupStars(); 
}

// --- Combined Mouse/Touch Event Handlers ---
function mousePressed() {
if (handleUIInteraction(mouseX, mouseY, 'pressed', null)) return false;
// Game interaction
for (let p of particles) {
  let d = dist(mouseX, mouseY, p.pos.x, p.pos.y);
  if (d < config.mouseBurstRadius) { 
    p.burst(); 
    let force = p5.Vector.sub(p.pos, createVector(mouseX, mouseY));
    force.normalize();
    force.mult(map(d,0,config.mouseBurstRadius,config.mouseBurstStrength, config.mouseBurstStrength * 0.2)); 
    p.applyForce(force);
  }
}
return false; // Prevent default
}

function mouseDragged() {
if (handleUIInteraction(mouseX, mouseY, 'dragged', null)) return false;
// Game interaction
for (let p of particles) {
  let d = dist(mouseX, mouseY, p.pos.x, p.pos.y);
  if (d < config.mouseDragInfluenceRadius && p.perturbationTimer === 0) { 
    let force = p5.Vector.sub(createVector(mouseX, mouseY), p.pos); 
    let strength = map(d, 0, config.mouseDragInfluenceRadius, p.baseMaxForce * config.mouseDragForceMultiplier, p.baseMaxForce * 0.1);
    force.setMag(strength);
    p.applyForce(force);
    if (d < config.mouseDragInfluenceRadius * 0.35) p.vel.mult(1.05); 
  }
}
return false; // Prevent default
}

function mouseReleased() {
handleUIInteraction(mouseX, mouseY, 'released', null);
return false; // Prevent default
}

function touchStarted() {
if (touches.length === 0) return false;
// Try to handle UI interaction with the first touch that starts.
// If multiple touches start, subsequent ones might not be captured by UI immediately if first one is on game area.
// This simplified model assumes primary UI interaction is single-touch.
if (handleUIInteraction(touches[0].x, touches[0].y, 'touched', touches[0].id)) return false;

// Game interaction (use first touch for burst)
let touchPt = touches[0];
for (let p of particles) {
  let d = dist(touchPt.x, touchPt.y, p.pos.x, p.pos.y);
  if (d < config.mouseBurstRadius) {
    p.burst();
    let force = p5.Vector.sub(p.pos, createVector(touchPt.x, touchPt.y));
    force.normalize();
    force.mult(map(d, 0, config.mouseBurstRadius, config.mouseBurstStrength, config.mouseBurstStrength * 0.2));
    p.applyForce(force);
  }
}
return false; // Prevent default browser actions
}

function touchMoved() {
 if (touches.length === 0) return false;
 // Find the touch that might be interacting with the UI (if activeTouchID is set)
 let uiTouch = null;
 if (activeTouchID !== null) {
     uiTouch = touches.find(t => t.id === activeTouchID);
 }
 // If a UI touch is found and handled, return. Otherwise, use the first touch for game interaction.
 if (uiTouch && handleUIInteraction(uiTouch.x, uiTouch.y, 'touchMoved', uiTouch.id)) return false;
 
 // If no specific UI touch is active or handled, use the first touch for game interaction.
 // This prevents other touches from dragging particles if one touch is on UI.
 if (activeTouchID === null) {
     let gameTouch = touches[0];
      for (let p of particles) {
          let d = dist(gameTouch.x, gameTouch.y, p.pos.x, p.pos.y);
          if (d < config.mouseDragInfluenceRadius && p.perturbationTimer === 0) {
              let force = p5.Vector.sub(createVector(gameTouch.x, gameTouch.y), p.pos);
              let strength = map(d, 0, config.mouseDragInfluenceRadius, p.baseMaxForce * config.mouseDragForceMultiplier, p.baseMaxForce * 0.1);
              force.setMag(strength);
              p.applyForce(force);
               if (d < config.mouseDragInfluenceRadius * 0.35) p.vel.mult(1.05);
          }
      }
 }
return false; // Prevent default browser actions
}

function touchEnded() {
if (touches.length === 0 && activeTouchID !== null) { // All touches lifted, but one was active on UI
    // The 'changedTouches' array in a native event would be better here.
    // For p5, we can't easily know which touch ended if multiple were active.
    // So, we assume the activeTouchID is the one that ended if no touches remain.
    handleUIInteraction(-1, -1, 'touchEnded', activeTouchID); // Pass invalid coords, type matters
} else {
    // Iterate through changedTouches if p5 provided it, or just assume if activeTouchID no longer in touches
    // Simplified: if activeTouchID is not in current touches, it has ended.
    let stillActive = touches.some(t => t.id === activeTouchID);
    if (!stillActive && activeTouchID !== null) {
        handleUIInteraction(-1, -1, 'touchEnded', activeTouchID);
    }
}
return false; // Prevent default browser actions
}

function keyPressed() { // Desktop keyboard shortcuts
  if (key === 'u' || key === 'U') { // Alternative UI toggle if needed
      uiOpen = !uiOpen;
      uiPanelTargetX = uiOpen ? 0 : -uiPanelWidth;
  }
  // P, F, R, S for palette, flow, repulsion, seek can be added back if desired
}

