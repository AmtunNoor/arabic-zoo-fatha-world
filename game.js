const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// SAFE RESIZE
// =====================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =====================
// LOAD BACKGROUND
// =====================
const bg = new Image();
bg.src = "assets/zoo-bg.jpg";

// =====================
// GAME DATA (FATHA SET)
// =====================
const levels = [
  { text: "جَ", sound: "ja", animal: "lion" },
  { text: "دَ", sound: "da", animal: "bird" },
  { text: "سَ", sound: "sa", animal: "monkey" },
  { text: "عَ", sound: "a", animal: "elephant" },
  { text: "لَ", sound: "la", animal: "turtle" }
];

// =====================
// STATE
// =====================
let options = [];
let target = null;
let selected = 0;

// =====================
// EMOJI ANIMALS (SAFE V1)
// =====================
const animalEmoji = {
  lion: "🦁",
  bird: "🐦",
  monkey: "🐒",
  elephant: "🐘",
  turtle: "🐢"
};

// =====================
// AUDIO
// =====================
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.9;
  speechSynthesis.speak(msg);
}

// =====================
// GAME LOGIC
// =====================
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function nextRound() {
  options = shuffle([...levels]).slice(0, 3);
  target = options[Math.floor(Math.random() * options.length)];
  selected = 0;

  setTimeout(() => {
    speak(target.sound);
  }, 800);
}

// =====================
// INPUT (TV + MOBILE)
// =====================
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    selected = Math.max(0, selected - 1);
  }

  if (e.key === "ArrowRight") {
    selected = Math.min(options.length - 1, selected + 1);
  }

  if (e.key === " " || e.key === "Enter") {
    check();
  }
});

canvas.addEventListener("click", check);

// =====================
// CHECK ANSWER
// =====================
function check() {
  const choice = options[selected];
  if (!choice || !target) return;

  if (choice.text === target.text) {
    speak(choice.sound);
    setTimeout(nextRound, 1200);
  } else {
    speak("try again");
  }
}

// =====================
// RENDER BACKGROUND
// =====================
function drawBackground() {
  if (bg.complete) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// =====================
// DRAW ANIMAL
// =====================
function drawAnimal() {
  if (!target) return;

  ctx.font = "120px Arial";
  ctx.textAlign = "center";

  const bounce = Math.sin(Date.now() * 0.003) * 10;

  ctx.fillText(
    animalEmoji[target.animal],
    canvas.width / 2,
    canvas.height * 0.3 + bounce
  );
}

// =====================
// DRAW OPTIONS (SILVER STONES)
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 180;
    const y = canvas.height * 0.75;

    // stone
    ctx.beginPath();
    ctx.arc(x, y, i === selected ? 75 : 65, 0, Math.PI * 2);
    ctx.fillStyle = i === selected ? "#FFD54F" : "#FFFFFF";
    ctx.fill();

    // text
    ctx.fillStyle = "#000";
    ctx.font = "55px Arial";
    ctx.textAlign = "center";
    ctx.fillText(opt.text, x, y + 18);
  });
}

// =====================
// MAIN LOOP
// =====================
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawAnimal();
  drawOptions();

  requestAnimationFrame(loop);
}

// =====================
// START GAME
// =====================
nextRound();
loop();
