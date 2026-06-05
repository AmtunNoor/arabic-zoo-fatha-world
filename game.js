const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// DESIGN REQS & STATES [cite: 1]
// =====================
const CONFIG = {
  worldWidth: 6000,        // Total horizontal length of the zoo world 
  cageSpacing: 900,       // Distance between cages
  baseTargetWidth: 1920,   // Virtual design resolution width
  baseTargetHeight: 1080,  // Virtual design resolution height
  colors: {
    selected: "#FFD54F",
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
  selected: 1, // Start middle button
  floatingReward: null,
  rewardTimer: 0,
  shake: 0,
  pulseTimer: 0
};

// =====================
// ASSET MANAGEMENT [cite: 3]
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
// SCREEN HANDLING & SCALING 
// =====================
let scale = 1;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Choose scaling aspect ratio factor based on screen size
  scale = Math.min(canvas.width / CONFIG.baseTargetWidth, canvas.height / CONFIG.baseTargetHeight);
  if (scale < 0.5) scale = 0.5; // Prevent downsizing elements too far on tiny screens
}
window.addEventListener("resize", resize);
resize();

// =====================
// AUDIO SYSTEM (NO SPAM) 
// =====================
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.8;
  speechSynthesis.cancel(); // Interrupt old audio immediately 
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
    speak(state.sounds[state.target]);
  }, 400);
}

function check() {
  const choice = state.options[state.selected];
  if (!choice || !state.target) return;

  if (choice === state.target) {
    // Correct Action Loop 
    state.shake = 15;
    state.floatingReward = animalKeys[Math.floor(Math.random() * animalKeys.length)]; [cite: 4]
    state.rewardTimer = 90;
    state.currentIndex++;
    
    setTimeout(nextRound, 1200);
  } else {
    // Incorrect Feedback
    state.shake = -10; // Simple side wiggle
    speak("try again");
  }
}

// =====================
// RENDERING CONTROLLERS
// =====================
function drawBackground() {
  if (assets.bg.complete) {
    // Parallax scrolling: Background moves slower than camera (creates deep world illusion)
    const parallaxX = -state.cameraX * 0.35;
    
    // Scale image cleanly to fit screen height perfectly
    const imgWidth = canvas.height * (assets.bg.width / assets.bg.height);
    
    ctx.drawImage(assets.bg, parallaxX, 0, imgWidth, canvas.height);
    ctx.drawImage(assets.bg, parallaxX + imgWidth - 2, 0, imgWidth, canvas.height);
  } else {
    ctx.fillStyle = "#8ED6FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawCages() {
  const centerY = canvas.height * 0.42; // Cages float nicely in upper-middle viewport
  
  for (let i = 0; i < state.letters.length; i++) {
    // Calculate world positions translated through screen space
    let x = (550 * scale) + (i * CONFIG.cageSpacing * scale) - state.cameraX;
    let y = centerY;

    // Apply smooth breathing motion to cages to look premium
    y += Math.sin(state.pulseTimer * 0.03 + i) * (8 * scale);

    // Dynamic shake filter on correct answer
    if (i === state.currentIndex && state.shake !== 0) {
      x += Math.sin(Date.now() * 0.08) * state.shake;
      state.shake *= 0.9;
      if (Math.abs(state.shake) < 0.5) state.shake = 0;
    }

    const img = i < state.currentIndex ? assets.cageOpen : assets.cageClosed;
    const size = 320 * scale;

    if (img.complete) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    }
  }
}

function drawRewardAnimation() {
  if (state.rewardTimer <= 0 || !state.floatingReward) return;

  const img = assets.animals[state.floatingReward];
  if (!img || !img.complete) return;

  const size = 260 * scale;
  const x = canvas.width / 2 - size / 2;
  
  // Animation: Pop up, bounce slightly via dynamic sine values [cite: 4]
  const bounceY = (canvas.height * 0.22) + Math.sin(state.pulseTimer * 0.08) * (15 * scale);

  ctx.save();
  // Simple alpha fadeout near the end of timer
  if (state.rewardTimer < 25) ctx.globalAlpha = state.rewardTimer / 25;
  ctx.drawImage(img, x, bounceY, size, size);
  ctx.restore();

  state.rewardTimer--;
}

function drawUIOptions() {
  const center = canvas.width / 2;
  const uiY = canvas.height * 0.80; // Safe bottom target placement [cite: 4]
  const btnW = 220 * scale;
  const btnH = 130 * scale;
  const spacing = 270 * scale;

  state.options.forEach((opt, i) => {
    const x = center + (i - 1) * spacing;
    const isSel = i === state.selected;
    
    // Smooth pulse scaling on selection for premium feel [cite: 4]
    const selectPulse = isSel ? Math.sin(state.pulseTimer * 0.07) * (6 * scale) : 0;
    const currentW = btnW + selectPulse;
    const currentH = btnH + selectPulse;

    ctx.save();
    
    // Draw button shadow/glow layer [cite: 4]
    ctx.shadowColor = isSel ? "rgba(255, 152, 0, 0.4)" : "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = isSel ? 25 * scale : 10 * scale;
    ctx.shadowOffsetY = 8 * scale;

    // Body container
    ctx.fillStyle = isSel ? CONFIG.colors.selected : CONFIG.colors.unselected;
    ctx.beginPath();
    ctx.roundRect(x - currentW / 2, uiY - currentH / 2, currentW, currentH, 24 * scale);
    ctx.fill();

    // Border line stroke
    ctx.shadowBlur = 0; 
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = isSel ? 5 * scale : 2 * scale;
    ctx.strokeStyle = isSel ? CONFIG.colors.stroke : "#CCCCCC";
    ctx.stroke();

    // Arabic Character Text
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = `bold ${64 * scale}px system-ui, -apple-system`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opt, x, uiY + (2 * scale));

    ctx.restore();
  });
}

// =====================
// MASTER LOOP PIPELINE
// =====================
function loop() {
  state.pulseTimer++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth Camera Easing (The Candy Crush world track effect) 
  const idealWorldX = (state.currentIndex * CONFIG.cageSpacing * scale) - (canvas.width / 2) + (550 * scale);
  state.cameraX += (idealWorldX - state.cameraX) * 0.06; // 0.06 provides smooth sliding acceleration

  drawBackground();
  drawCages();
  drawRewardAnimation();
  drawUIOptions();

  requestAnimationFrame(loop);
}

// =====================
// GLOBAL INPUT MAPPING [cite: 3]
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
  const spacing = 270 * scale;

  // Map broad side-screen tap coordinates to clean button layout indexes [cite: 4]
  if (touchX < center - spacing / 2) {
    state.selected = 0;
  } else if (touchX > center + spacing / 2) {
    state.selected = 2;
  } else {
    state.selected = 1;
  }
  check();
}, { passive: false });

// Start Game Engine
nextRound();
loop();
