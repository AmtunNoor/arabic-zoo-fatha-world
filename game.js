const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// DESIGN REQS & STATES
// =====================
const CONFIG = {
  worldWidth: 5000,        
  cageSpacing: 800,       
  baseTargetWidth: 1920,   
  baseTargetHeight: 1080,  
  colors: {
    selected: "#FFD54F",   // Soft gold highlight from design doc
    unselected: "#FFFFFF",
    stroke: "#FF9800",
    text: "#1A1A1A"
  }
};

let state = {
  letters: ["جَ", "دَ", "سَ", "عَ", "لَ"],
  sounds: { "جَ": "ja", "دَ": "da", "سَ": "sa", "عَ": "a", "لَ": "la" },
  cameraX: 0,
  currentIndex: 0,
  options: [],
  target: null,
  selected: 1, // Start on middle button for balanced TV/Keyboard layout
  floatingReward: null,
  rewardTimer: 0,
  shake: 0,
  pulseTimer: 0
};

// =====================
// ASSET MANAGEMENT
// =====================
function load(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const assets = {
  bg: load("assets/zoo-bg.jpg"),
  cageClosed: load("assets/cage-closed.png"),
  cageOpen: load("assets/cage-open.png"),
  animals: {
    lion: load("assets/lion.png"),
    monkey: load("assets/monkey.png"),
    bird: load("assets/bird.png"),
    elephant: load("assets/elephant.png"),
    turtle: load("assets/turtle.png")
  }
};
const animalKeys = Object.keys(assets.animals);

// =====================
// CAGES CONFIG (WORLD SPACE)
// =====================
const cages = state.letters.map((l, i) => ({
  id: i,
  letter: l,
  x: 500 + i * CONFIG.cageSpacing,
  y: 380, // Positioned safely within background sightlines
  unlocked: false,
  shake: 0,
  reward: null
}));

// =====================
// SCREEN HANDLING & SCALING
// =====================
let scale = 1;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Responsive factor to handle mobile vs wide TV screen views cleanly
  scale = Math.min(canvas.width / CONFIG.baseTargetWidth, canvas.height / CONFIG.baseTargetHeight);
  if (scale < 0.45) scale = 0.45; 
}
window.addEventListener("resize", resize);
resize();

// Safe UI Rounded Container Renderer (Guarantees zero browser loop crashes)
function drawUIFrame(x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }
}

// =====================
// AUDIO ENGINE
// =====================
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.8;
  speechSynthesis.cancel(); 
  speechSynthesis.speak(msg);
}

// =====================
// GAME LOOPS & INTERACTION
// =====================
function nextRound() {
  state.options = [...state.letters].sort(() => Math.random() - 0.5).slice(0, 3);
  state.target = state.options[Math.floor(Math.random() * state.options.length)];
  state.selected = 1; 

  setTimeout(() => {
    if (state.target) speak(state.sounds[state.target]);
  }, 400);
}

function check() {
  if (state.currentIndex >= cages.length) return; // End of level safety check
  
  const choice = state.options[state.selected];
  if (!choice || !state.target) return;

  if (choice === state.target) {
    const cage = cages[state.currentIndex];
    cage.unlocked = true;
    cage.reward = animalKeys[Math.floor(Math.random() * animalKeys.length)];
    cage.shake = 15;

    state.floatingReward = cage.reward;
    state.rewardTimer = 90;
    state.currentIndex++;
    
    setTimeout(nextRound, 1200);
  } else {
    state.shake = -8; 
    speak("try again");
  }
}

// =====================
// RENDERING CONTROLLERS
// =====================
function drawBackground() {
  if (assets.bg.complete) {
    // Parallax factor: Moves background slower than camera to build pseudo-3D world depth
    const parallaxX = -state.cameraX * 0.3;
    const imgWidth = canvas.height * (assets.bg.width / assets.bg.height);
    
    ctx.drawImage(assets.bg, parallaxX, 0, imgWidth, canvas.height);
    ctx.drawImage(assets.bg, parallaxX + imgWidth - 2, 0, imgWidth, canvas.height);
  } else {
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawCages() {
  for (let cage of cages) {
    let x = (cage.x * scale) - state.cameraX;
    let y = cage.y * scale;

    if (x < -300 || x > canvas.width + 300) continue;

    // Apply soft breathing motion to active cages for premium polish feel
    if (!cage.unlocked && cage.id === state.currentIndex) {
      y += Math.sin(state.pulseTimer * 0.05) * (6 * scale);
    }

    ctx.save();

    if (cage.shake > 0) {
      ctx.translate(x + Math.sin(Date.now() * 0.08) * cage.shake, y);
      cage.shake *= 0.9;
    } else {
      ctx.translate(x, y);
    }

    const img = cage.unlocked ? assets.cageOpen : assets.cageClosed;
    const size = 260 * scale;

    if (img.complete) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    }

    ctx.restore();
  }
}

function drawRewardAnimation() {
  if (state.rewardTimer <= 0 || !state.floatingReward) return;

  const img = assets.animals[state.floatingReward];
  if (!img || !img.complete) return;

  const size = 280 * scale;
  const x = canvas.width / 2 - size / 2;
  
  // Animation bounce sequence directly relative to state timers
  const bounceY = (canvas.height * 0.22) + Math.sin(state.pulseTimer * 0.08) * (15 * scale);

  ctx.save();
  if (state.rewardTimer < 25) ctx.globalAlpha = state.rewardTimer / 25; // Gentle fadeout
  ctx.drawImage(img, x, bounceY, size, size);
  ctx.restore();

  state.rewardTimer--;
}

function drawUIOptions() {
  const center = canvas.width / 2;
  const uiY = canvas.height * 0.82; // Locked to bottom overlay safe-zones across landscape/portrait
  const btnW = 240 * scale;
  const btnH = 135 * scale;
  const spacing = 290 * scale;

  state.options.forEach((opt, i) => {
    const x = center + (i - 1) * spacing;
    const isSel = i === state.selected;
    
    // Breathing animation expansion for selected token item
    const pulseFactor = isSel ? Math.sin(state.pulseTimer * 0.07) * (6 * scale) : 0;
    const currentW = btnW + pulseFactor;
    const currentH = btnH + pulseFactor;

    ctx.save();
    
    // Premium soft glow accent separation on item focus
    ctx.shadowColor = isSel ? "rgba(255, 152, 0, 0.45)" : "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = isSel ? 30 * scale : 12 * scale;
    ctx.shadowOffsetY = 6 * scale;

    // Interface Container Card
    drawUIFrame(
      x - currentW / 2, 
      uiY - currentH / 2, 
      currentW, 
      currentH, 
      26 * scale,
      isSel ? CONFIG.colors.selected : CONFIG.colors.unselected,
      isSel ? CONFIG.colors.stroke : "#D0D0D0",
      isSel ? 5 * scale : 2 * scale
    );

    // Text rendering context layer overrides
    ctx.shadowBlur = 0; 
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = CONFIG.colors.text;
    
    // Font setup utilizing clean fallback cascades
    ctx.font = `bold ${72 * scale}px "Baloo 2", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opt, x, uiY + (4 * scale));

    ctx.restore();
  });
}

// =====================
// MASTER LOOP PIPELINE
// =====================
function loop() {
  state.pulseTimer++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth camera track algorithm matching your original speed step defaults
  if (state.currentIndex < cages.length) {
    const idealWorldX = (cages[state.currentIndex].x * scale) - (canvas.width / 2);
    state.cameraX += (idealWorldX - state.cameraX) * 0.07;
  }

  drawBackground();
  drawCages();
  drawRewardAnimation();
  drawUIOptions();

  requestAnimationFrame(loop);
}

// =====================
// INPUT MAPS (STRICTLY KEYBOARD/TV + TOUCH)
// =====================
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") state.selected = Math.max(0, state.selected - 1);
  if (e.key === "ArrowRight") state.selected = Math.min(state.options.length - 1, state.selected + 1);
  if (e.key === "Enter" || e.key === " ") check();
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touchX = e.touches[0].clientX;
  const center = canvas.width / 2;
  const spacing = 290 * scale;

  if (touchX < center - spacing / 2) {
    state.selected = 0;
  } else if (touchX > center + spacing / 2) {
    state.selected = 2;
  } else {
    state.selected = 1;
  }
  check();
}, { passive: false });

// Initialize Game Execution Track
nextRound();
loop();
