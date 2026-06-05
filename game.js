const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =====================
// BACKGROUND (YOUR ASSET ONLY)
// =====================
const bg = new Image();
bg.src = "assets/zoo-bg.jpg";

// =====================
// CORE LETTER SET (FATHA MODE)
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
// STATE
// =====================
let options = [];
let target = null;
let selected = 0;

let cages = [0, 0, 0, 0, 0];
let progress = 0;

let reward = null;
let rewardTimer = 0;

const rewards = ["lion", "monkey", "bird", "elephant", "turtle"];

// =====================
// AUDIO
// =====================
function speak(text, mood = "normal") {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";

  if (mood === "success") {
    msg.rate = 0.85;
    msg.pitch = 1.7;
  } else {
    msg.rate = 0.75;
    msg.pitch = 1.4;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

// =====================
// UTIL
// =====================
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function randomReward() {
  return rewards[Math.floor(Math.random() * rewards.length)];
}

// =====================
// GAME FLOW
// =====================
function nextRound() {
  options = shuffle([...letters]).slice(0, 3);
  target = options[Math.floor(Math.random() * options.length)];
  selected = 0;

  setTimeout(() => {
    speak("listen");
    setTimeout(() => speak(sounds[target]), 600);
  }, 300);
}

// =====================
// INPUT (STRICT: TV + MOBILE ONLY)
// =====================

// TV / Keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    selected = Math.max(0, selected - 1);
  }

  if (e.key === "ArrowRight") {
    selected = Math.min(options.length - 1, selected + 1);
  }

  if (e.key === "Enter" || e.key === " ") {
    check();
  }
});

// Mobile touch ONLY (no mouse logic)
canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  const center = canvas.width / 2;

  for (let i = 0; i < options.length; i++) {
    const ox = center + (i - 1) * 240;
    const oy = canvas.height * 0.6;

    const dx = x - ox;
    const dy = y - oy;

    if (Math.sqrt(dx * dx + dy * dy) < 80) {
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

    if (progress < cages.length) {
      cages[progress] = 1;
      reward = randomReward();
      rewardTimer = 70;
      progress++;
    }

    setTimeout(nextRound, 900);
  } else {
    speak("try again");
  }
}

// =====================
// BACKGROUND
// =====================
function drawBackground() {
  if (bg.complete) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =====================
// OPTIONS UI (PREMIUM SPACING)
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 260;
    const y = canvas.height * 0.6;

    const isSelected = i === selected;

    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 90 : 75, 0, Math.PI * 2);

    ctx.fillStyle = isSelected ? "#FFD54F" : "#ffffff";
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#ff9800" : "#999";
    ctx.lineWidth = isSelected ? 6 : 2;
    ctx.stroke();

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "70px Baloo";
    ctx.textAlign = "center";
    ctx.fillText(opt, x, y + 25);
  });
}

// =====================
// CAGES (PROGRESS TRACK)
// =====================
function drawCages() {
  const startX = canvas.width / 2 - 320;
  const y = canvas.height * 0.85;

  for (let i = 0; i < cages.length; i++) {
    const x = startX + i * 160;

    ctx.fillStyle = cages[i] ? "#6EE7B7" : "#D1D5DB";
    ctx.fillRect(x, y, 110, 80);

    ctx.strokeStyle = "#333";
    ctx.strokeRect(x, y, 110, 80);

    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";
    ctx.fillText(cages[i] ? "🐾" : "🔒", x + 55, y + 50);
  }
}

// =====================
// REWARD ANIMATION
// =====================
function drawReward() {
  if (rewardTimer <= 0 || !reward) return;

  const icons = {
    lion: "🦁",
    monkey: "🐒",
    bird: "🐦",
    elephant: "🐘",
    turtle: "🐢"
  };

  const bounce = Math.sin(Date.now() * 0.01) * 12;

  ctx.font = "120px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    icons[reward],
    canvas.width / 2,
    canvas.height * 0.25 + bounce
  );

  rewardTimer--;
}

// =====================
// LOOP
// =====================
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawReward();
  drawOptions();
  drawCages();

  requestAnimationFrame(loop);
}

// =====================
// START
// =====================
nextRound();
loop();
