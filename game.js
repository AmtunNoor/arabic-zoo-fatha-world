const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =====================
// WORLD CONFIG (CANDY CRUSH STYLE MAP)
// =====================
const WORLD_WIDTH = 5000;
let cameraX = 0;

// =====================
// LOAD ASSETS
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

// =====================
// LEARNING DATA (FATHA MODE)
// =====================
const letters = ["جَ", "دَ", "سَ", "عَ", "لَ"];

const sounds = {
  "جَ": "ja",
  "دَ": "da",
  "سَ": "sa",
  "عَ": "a",
  "لَ": "la"
};

// =====================
// WORLD OBJECTS (CAGES IN WORLD SPACE)
// =====================
const cages = letters.map((l, i) => ({
  id: i,
  letter: l,
  x: 500 + i * 800,
  y: 350,
  unlocked: false,
  shake: 0,
  reward: null
}));

let currentIndex = 0;
let options = [];
let target = null;
let selected = 0;

// =====================
// REWARD STATE
// =====================
let floatingReward = null;
let rewardTimer = 0;

const animalKeys = Object.keys(assets.animals);

// =====================
// AUDIO (CLEAN, NO SPAM)
// =====================
function speak(text, mood = "normal") {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";

  msg.rate = mood === "success" ? 0.85 : 0.75;
  msg.pitch = mood === "success" ? 1.6 : 1.3;

  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

// =====================
// UTIL
// =====================
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function randomAnimal() {
  return animalKeys[Math.floor(Math.random() * animalKeys.length)];
}

// =====================
// ROUND
// =====================
function nextRound() {
  options = shuffle([...letters]).slice(0, 3);
  target = options[Math.floor(Math.random() * options.length)];
  selected = 0;

  setTimeout(() => {
    speak(sounds[target]);
  }, 300);
}

// =====================
// CAMERA (CANDY CRUSH FEEL)
// =====================
function updateCamera() {
  const targetX = cages[currentIndex].x - canvas.width / 2;
  cameraX += (targetX - cameraX) * 0.08;
}

// =====================
// INPUT (TV + MOBILE ONLY)
// =====================

// TV / Keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") selected = Math.max(0, selected - 1);
  if (e.key === "ArrowRight") selected = Math.min(options.length - 1, selected + 1);
  if (e.key === "Enter" || e.key === " ") check();
});

// Touch only
canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];

  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;

  const center = canvas.width / 2;

  for (let i = 0; i < options.length; i++) {
    const ox = center + (i - 1) * 260;
    const oy = canvas.height * 0.62;

    const dx = x - ox;
    const dy = y - oy;

    if (Math.sqrt(dx * dx + dy * dy) < 90) {
      selected = i;
      check();
    }
  }
});

// =====================
// CHECK ANSWER
// =====================
function check() {
  const choice = options[selected];
  if (!choice || !target) return;

  if (choice === target) {
    speak(sounds[choice], "success");

    const cage = cages[currentIndex];

    cage.unlocked = true;
    cage.reward = randomAnimal();
    cage.shake = 20;

    floatingReward = cage.reward;
    rewardTimer = 80;

    currentIndex++;

    setTimeout(nextRound, 900);
  } else {
    speak("try again");
  }
}

// =====================
// DRAW BACKGROUND
// =====================
function drawBackground() {
  if (assets.bg.complete) {
    ctx.drawImage(assets.bg, -cameraX * 0.2, 0, WORLD_WIDTH, canvas.height);
  } else {
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =====================
// DRAW CAGES (REAL ASSETS)
// =====================
function drawCages() {
  for (let cage of cages) {
    const x = cage.x - cameraX;
    const y = cage.y;

    if (x < -200 || x > canvas.width + 200) continue;

    ctx.save();

    if (cage.shake > 0) {
      ctx.translate(x + Math.sin(Date.now() * 0.05) * cage.shake, y);
      cage.shake *= 0.9;
    } else {
      ctx.translate(x, y);
    }

    const img = cage.unlocked ? assets.cageOpen : assets.cageClosed;

    if (img.complete) {
      ctx.drawImage(img, -80, -80, 160, 160);
    }

    ctx.restore();
  }
}

// =====================
// OPTIONS UI
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 260;
    const y = canvas.height * 0.62;

    const isSel = i === selected;

    ctx.beginPath();
    ctx.arc(x, y, isSel ? 95 : 75, 0, Math.PI * 2);

    ctx.fillStyle = isSel ? "#FFD54F" : "#fff";
    ctx.fill();

    ctx.strokeStyle = isSel ? "#ff9800" : "#999";
    ctx.lineWidth = isSel ? 6 : 2;
    ctx.stroke();

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "70px Baloo";
    ctx.textAlign = "center";
    ctx.fillText(opt, x, y + 25);
  });
}

// =====================
// REWARD ANIMATION (REAL IMAGE)
// =====================
function drawReward() {
  if (rewardTimer <= 0 || !floatingReward) return;

  const img = assets.animals[floatingReward];
  if (!img || !img.complete) return;

  const bounce = Math.sin(Date.now() * 0.01) * 15;

  ctx.drawImage(
    img,
    canvas.width / 2 - 110,
    canvas.height * 0.2 + bounce,
    220,
    220
  );

  rewardTimer--;
}

// =====================
// LOOP
// =====================
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateCamera();

  drawBackground();
  drawCages();
  drawReward();
  drawOptions();

  requestAnimationFrame(loop);
}

// =====================
// START
// =====================
nextRound();
loop();
