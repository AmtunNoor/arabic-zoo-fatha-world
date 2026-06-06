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
    selected: "#FFD54F",   // Soft gold highlight from design doc [cite: 3]
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
  selected: 1, // Start on middle button for balanced TV/Keyboard layout [cite: 3, 4]
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
// CAGES CONFIG (WORLD SPACE WITH LOCAL ANIMAL STATES)
// =====================
const cages = state.letters.map((l, i) => ({
  id: i,
  letter: l,
  x: 500 + i * CONFIG.cageSpacing,
  y: 420, // Positioned safely within background ground lines
  unlocked: false,
  shake: 0,
  rewardAnimal: null,
  rewardTimer: 0 // Track timers per cage locally
}));

// =====================
// SCREEN HANDLING & SCALING
// =====================
let scale = 1;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  scale = Math.min(canvas.width / CONFIG.baseTargetWidth, canvas.height / CONFIG.baseTargetHeight);
  if (scale < 0.45) scale = 0.45; 
}
window.addEventListener("resize", resize);
resize();

// Safe UI Rounded Container Generator
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
  if (state.currentIndex >= cages.length) return; 
  
  const choice = state.options[state.selected];
  if (!choice || !state.target) return;

  if (choice === state.target) {
    const cage = cages[state.currentIndex];
    cage.unlocked = true;
    cage.rewardAnimal = animalKeys[Math.floor(Math.random() * animalKeys.length)]; // Random emotional reinforcement [cite: 2, 4]
    cage.rewardTimer = 90; // Initialize reward exit runtime length
    cage.shake = 15;

    state.currentIndex++;
    
    setTimeout(nextRound, 1400);
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
    const parallaxX = -state.cameraX * 0.3;
    const imgWidth = canvas.height * (assets.bg.width / assets.bg.height);
    
    ctx.drawImage(assets.bg, parallaxX, 0, imgWidth, canvas.height);
    ctx.drawImage(assets.bg, parallaxX + imgWidth - 2, 0, imgWidth, canvas.height);
  } else {
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawCagesAndRewards() {
  for (let cage of cages) {
    let baseWorldX = cage.x * scale;
    let baseWorldY = cage.y * scale;

    let renderX = baseWorldX - state.cameraX;
    let renderY = baseWorldY;

    if (renderX < -300 || renderX > canvas.width + 300) continue;

    // Apply smooth breathing motion to active locked cages [cite: 3, 4]
    if (!cage.unlocked && cage.id === state.currentIndex) {
      renderY += Math.sin(state.pulseTimer * 0.05) * (6 * scale);
    }

    // Dynamic procedural cage shake offset
    let activeShakeX = 0;
    if (cage.shake > 0) {
      activeShakeX = Math.sin(Date.now() * 0.08) * cage.shake;
      cage.shake *= 0.9;
    }

    const cageSize = 260 * scale;

    // 1. DRAW ANIMAL RISING OUT FROM INSIDE THE OPENED CAGE 
    if (cage.unlocked && cage.rewardAnimal && cage.rewardTimer > 0) {
      const animalImg = assets.animals[cage.rewardAnimal];
      if (animalImg && animalImg.complete) {
        ctx.save();
        
        // Calculate release progression (0.0 at trigger -> 1.0 near complete)
        const progress = (90 - cage.rewardTimer) / 90;
        
        // Design animation specification: appear -> bounce -> exit scene 
        // Upward vertical emergence offset out from the cage door line
        let animalOffsetY = -130 * scale * Math.sin(progress * Math.PI);
        
        // Add subtle mid-air bounce rhythm
        let animalBounceY = Math.sin(state.pulseTimer * 0.1) * (10 * scale);
        
        let finalAnimalX = renderX + activeShakeX;
        let finalAnimalY = renderY + animalOffsetY + animalBounceY;
        const animalSize = 200 * scale;

        // Apply clean opacity fadeout as the animal exits the scene 
        if (cage.rewardTimer < 25) {
          ctx.globalAlpha = cage.rewardTimer / 25;
        }

        ctx.drawImage(
          animalImg, 
          finalAnimalX - animalSize / 2, 
          finalAnimalY - animalSize / 2, 
          animalSize, 
          animalSize
        );
        ctx.restore();
      }
      cage.rewardTimer--;
    }

    // 2. DRAW CAGE FORWARD FOREGROUND LAYER
    ctx.save();
    ctx.translate(renderX + activeShakeX, renderY);
    
    const img = cage.unlocked ? assets.cageOpen : assets.cageClosed;
    if (img.complete) {
      ctx.drawImage(img, -cageSize / 2, -cageSize / 2, cageSize, cageSize);
    }
    ctx.restore();
  }
}

function drawUIOptions() {
  const center = canvas.width / 2;
  const uiY = canvas.height * 0.82; 
  const btnW = 240 * scale;
  const btnH = 135 * scale;
  const spacing = 290 * scale;

  state.options.forEach((opt, i) => {
    const x = center + (i - 1) * spacing;
    const isSel = i === state.selected;
    
    const pulseFactor = isSel ? Math.sin(state.pulseTimer * 0.07) * (6 * scale) : 0;
    const currentW = btnW + pulseFactor;
    const currentH = btnH + pulseFactor;

    ctx.save();
    
    // Soft focus item accent glow layer [cite: 3, 4]
    ctx.shadowColor = isSel ? "rgba(255, 152, 0, 0.45)" : "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = isSel ? 30 * scale : 12 * scale;
    ctx.shadowOffsetY = 6 * scale;

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

    ctx.shadowBlur = 0; 
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = CONFIG.colors.text;
    
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

  // Candy Crush Camera Easing: follows the active world track position smoothly [cite: 2, 3, 4]
  if (state.currentIndex < cages.length) {
    const idealWorldX = (cages[state.currentIndex].x * scale) - (canvas.width / 2);
    state.cameraX += (idealWorldX - state.cameraX) * 0.07;
  }

  drawBackground();
  drawCagesAndRewards();
  drawUIOptions();

  requestAnimationFrame(loop);
}

// =====================
// INPUT MAPS (STRICTLY KEYBOARD/TV + TOUCH) [cite: 3, 4]
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
