const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// FORCE SIZE SAFETY (important for mobile + TV)
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =====================
// SAFE STATE (always defined)
// =====================
let options = [
  { text: "جَ" },
  { text: "دَ" },
  { text: "سَ" }
];

let selected = 0;

// =====================
// DRAW SAFE SCREEN FIRST (CRITICAL)
// =====================
function drawSafeScreen() {
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";

  ctx.fillText("Zoo Fatha World Loading...", canvas.width / 2, canvas.height / 2);
}

// =====================
// SIMPLE UI (NO IMAGES YET)
// =====================
function drawOptions() {
  const center = canvas.width / 2;

  options.forEach((opt, i) => {
    const x = center + (i - 1) * 160;
    const y = canvas.height * 0.75;

    ctx.beginPath();
    ctx.arc(x, y, i === selected ? 70 : 60, 0, Math.PI * 2);
    ctx.fillStyle = i === selected ? "#FFD54F" : "#fff";
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText(opt.text, x, y + 15);
  });
}

// =====================
// INPUT (SAFE)
// =====================
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") selected = Math.max(0, selected - 1);
  if (e.key === "ArrowRight") selected = Math.min(options.length - 1, selected + 1);
});

// =====================
// LOOP (ALWAYS RUNS)
// =====================
function loop() {
  drawSafeScreen();
  drawOptions();
  requestAnimationFrame(loop);
}

loop();
