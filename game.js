const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// =====================
// ASSETS
// =====================
const bg = new Image();
bg.src = "assets/zoo-bg.jpg";

const animals = {
  lion: "assets/lion.png",
  bird: "assets/bird.png",
  monkey: "assets/monkey.png",
  elephant: "assets/elephant.png",
  turtle: "assets/turtle.png",
};

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

let options = [];
let target = null;
let selected = 0;

// =====================
// AUDIO (NO FILES NEEDED)
// =====================
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.9;
  speechSynthesis.speak(msg);
}

// =====================
// GAME FLOW
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
  if (!choice) return;

  if (choice.text === target.text) {
    speak(choice.sound);
    setTimeout(nextRound, 1200);
  } else {
    speak("try again");
  }
}

// =====================
// RENDER LOOP
// =====================
function drawBackground() {
  if (bg.complete) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  }
}

function drawAnimal() {
  const img = new Image();
  img.src = animals[target?.animal || "lion"];

  const size = Math.min(canvas.width, canvas.height) * 0.35;

  ctx.drawImage(
    img,
    canvas.width / 2 - size / 2,
    canvas.height * 0.25,
    size,
    size
  );
}

function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 180;
    const y = canvas.height * 0.75;

    // circle
    ctx.beginPath();
    ctx.arc(x, y, i === selected ? 70 : 60, 0, Math.PI * 2);
    ctx.fillStyle = i === selected ? "#FFD54F" : "#ffffff";
    ctx.fill();

    // text
    ctx.fillStyle = "#000";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText(opt.text, x, y + 15);
  });
}

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
