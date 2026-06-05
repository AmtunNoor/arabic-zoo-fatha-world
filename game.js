const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =====================
// BACKGROUND
// =====================
const bg = new Image();
bg.src = "assets/zoo-bg.jpg";

// =====================
// GAME DATA
// =====================
const levels = [
  { text: "جَ", sound: "ja", animal: "lion", emoji: "🦁" },
  { text: "دَ", sound: "da", animal: "bird", emoji: "🐦" },
  { text: "سَ", sound: "sa", animal: "monkey", emoji: "🐒" },
  { text: "عَ", sound: "a", animal: "elephant", emoji: "🐘" },
  { text: "لَ", sound: "la", animal: "turtle", emoji: "🐢" }
];

// =====================
// STATE
// =====================
let options = [];
let target = null;
let selected = 0;

let particles = [];
let glow = 0;

// =====================
// AUDIO (POLISHED)
// =====================
function speak(text, mood = "normal") {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";

  if (mood === "intro") {
    msg.rate = 0.65;
    msg.pitch = 1.4;
  } else if (mood === "success") {
    msg.rate = 0.85;
    msg.pitch = 1.7;
  } else {
    msg.rate = 0.75;
    msg.pitch = 1.5;
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

// =====================
// PARTICLES (SPARKLE EFFECT)
// =====================
function spawnParticles(x, y) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 60
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// =====================
// GAME FLOW
// =====================
function nextRound() {
  options = shuffle([...levels]).slice(0, 3);
  target = options[Math.floor(Math.random() * options.length)];
  selected = 0;

  glow = 1;

  setTimeout(() => {
    speak("Listen carefully", "intro");

    setTimeout(() => {
      speak(target.sound, "intro");
    }, 700);

  }, 400);
}

// =====================
// INPUT
// =====================
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") selected = Math.max(0, selected - 1);
  if (e.key === "ArrowRight") selected = Math.min(options.length - 1, selected + 1);
  if (e.key === " " || e.key === "Enter") check();
});

canvas.addEventListener("click", check);

// =====================
// CHECK ANSWER
// =====================
function check() {
  const choice = options[selected];
  if (!choice || !target) return;

  if (choice.text === target.text) {
    speak("Yes! " + choice.sound, "success");

    glow = 1;
    spawnParticles(canvas.width / 2, canvas.height * 0.35);

    setTimeout(nextRound, 1200);
  } else {
    speak("try again");
  }
}

// =====================
// DRAW BACKGROUND
// =====================
function drawBackground() {
  if (bg.complete) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#6EC6FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // soft overlay (makes UI pop)
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =====================
// DRAW ANIMAL
// =====================
function drawAnimal() {
  if (!target) return;

  const bounce = Math.sin(Date.now() * 0.003) * 12;
  const scale = 120 + glow * 20;

  ctx.font = scale + "px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    target.emoji,
    canvas.width / 2,
    canvas.height * 0.32 + bounce
  );
}

// =====================
// DRAW OPTIONS (MAGIC STONES)
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 200;
    const y = canvas.height * 0.75;

    // glow effect
    ctx.shadowBlur = i === selected ? 25 : 10;
    ctx.shadowColor = "#FFD54F";

    ctx.beginPath();
    ctx.arc(x, y, i === selected ? 80 : 70, 0, Math.PI * 2);
    ctx.fillStyle = i === selected ? "#FFD54F" : "#FFFFFF";
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#000";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(opt.text, x, y + 20);
  });
}

// =====================
// LOOP
// =====================
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawAnimal();
  drawOptions();
  drawParticles();

  updateParticles();

  requestAnimationFrame(loop);
}

// =====================
// START
// =====================
nextRound();
loop();
