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
// LETTERS (FATHA SET)
// =====================
const levels = [
  { text: "جَ", sound: "ja" },
  { text: "دَ", sound: "da" },
  { text: "سَ", sound: "sa" },
  { text: "عَ", sound: "a" },
  { text: "لَ", sound: "la" }
];

// =====================
// STATE
// =====================
let options = [];
let target = null;
let selected = 0;

let cages = [0, 0, 0, 0, 0]; // 0 = locked, 1 = open
let progress = 0;

let rewardAnimal = null;
let rewardTimer = 0;

// =====================
// ANIMALS (REWARD SYSTEM)
// =====================
const rewardAnimals = ["🦁", "🐒", "🐦", "🐘", "🐢"];

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
  return rewardAnimals[Math.floor(Math.random() * rewardAnimals.length)];
}

// =====================
// ROUND SYSTEM
// =====================
function nextRound() {
  options = shuffle([...levels]).slice(0, 3);
  target = options[Math.floor(Math.random() * options.length)];
  selected = 0;

  setTimeout(() => {
    speak("Listen");
    setTimeout(() => speak(target.sound), 600);
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
    speak(choice.sound, "success");

    // unlock cage
    if (progress < cages.length) {
      cages[progress] = 1;
      rewardAnimal = randomReward();
      rewardTimer = 80;
      progress++;
    }

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
    ctx.fillStyle = "#7ec8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =====================
// DRAW OPTIONS
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 200;
    const y = canvas.height * 0.65;

    ctx.beginPath();
    ctx.arc(x, y, i === selected ? 80 : 70, 0, Math.PI * 2);
    ctx.fillStyle = i === selected ? "#FFD54F" : "#fff";
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(opt.text, x, y + 20);
  });
}

// =====================
// DRAW CAGES (REWARD TRACK)
// =====================
function drawCages() {
  const startX = canvas.width / 2 - 300;
  const y = canvas.height * 0.85;

  for (let i = 0; i < cages.length; i++) {
    const x = startX + i * 150;

    // cage base
    ctx.fillStyle = cages[i] ? "#b9f6ca" : "#ddd";
    ctx.fillRect(x, y, 100, 80);

    ctx.strokeStyle = "#333";
    ctx.strokeRect(x, y, 100, 80);

    // lock icon
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";

    ctx.fillText(cages[i] ? "🐾" : "🔒", x + 50, y + 50);
  }
}

// =====================
// DRAW REWARD ANIMAL
// =====================
function drawReward() {
  if (rewardTimer <= 0 || !rewardAnimal) return;

  ctx.font = "120px Arial";
  ctx.textAlign = "center";

  const bounce = Math.sin(Date.now() * 0.01) * 10;

  ctx.fillText(
    rewardAnimal,
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
