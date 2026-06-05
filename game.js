const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Responsive Scaling
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// --- Configuration ---
const WORLD_STEP = 900; // Distance between cages
let cameraX = 0;
let currentIndex = 0;

// --- Asset Loading ---
const assets = {
  bg: new Image(),
  cageClosed: new Image(),
  cageOpen: new Image(),
  animals: {
    lion: new Image(),
    monkey: new Image(),
    bird: new Image(),
    elephant: new Image(),
    turtle: new Image()
  }
};

assets.bg.src = "assets/zoo-bg.jpg";
assets.cageClosed.src = "assets/cage-closed.png";
assets.cageOpen.src = "assets/cage-open.png";
Object.keys(assets.animals).forEach(key => {
  assets.animals[key].src = `assets/${key}.png`;
});

// --- Game State ---
const syllables = ["جَ", "دَ", "سَ", "عَ", "لَ"];
let currentOptions = [];
let targetSyllable = "";
let selectedIndex = 1;
let rewardAnimal = null;
let rewardTicks = 0;

function nextRound() {
  currentOptions = [...syllables].sort(() => Math.random() - 0.5).slice(0, 3);
  targetSyllable = currentOptions[Math.floor(Math.random() * 3)];
  // Play sound here
}

// --- Main Loop ---
function update() {
  // Smooth Camera Easing for the "Zoo World" illusion
  const targetCameraX = (currentIndex * WORLD_STEP) - (canvas.width / 2) + 200;
  cameraX += (targetCameraX - cameraX) * 0.05;

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Background (Parallax effect for depth)
  if (assets.bg.complete) {
    const bgScale = canvas.height / assets.bg.height;
    ctx.drawImage(assets.bg, -cameraX * 0.2, 0, assets.bg.width * bgScale * 2, canvas.height);
  }

  // 2. Cages (The "Map")[cite: 1, 2]
  for (let i = 0; i < 10; i++) {
    const x = (i * WORLD_STEP) - cameraX;
    const y = canvas.height * 0.5;
    const img = i < currentIndex ? assets.cageOpen : assets.cageClosed;
    
    if (img.complete) {
      ctx.drawImage(img, x - 150, y - 150, 300, 300);
    }
  }

  // 3. Syllable Buttons (UI Overlay)[cite: 2]
  const btnY = canvas.height * 0.85;
  currentOptions.forEach((text, i) => {
    const x = (canvas.width / 2) + (i - 1) * 250;
    const isSelected = i === selectedIndex;

    ctx.fillStyle = isSelected ? "#FFD54F" : "white";
    ctx.beginPath();
    ctx.roundRect(x - 100, btnY - 60, 200, 120, 20);
    ctx.fill();

    ctx.fillStyle = "#333";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, btnY + 20);
  });

  // 4. Reward Animation[cite: 2]
  if (rewardTicks > 0 && rewardAnimal) {
    const animalImg = assets.animals[rewardAnimal];
    if (animalImg.complete) {
      ctx.globalAlpha = rewardTicks / 100;
      ctx.drawImage(animalImg, canvas.width/2 - 100, canvas.height * 0.2, 200, 200);
      ctx.globalAlpha = 1.0;
    }
    rewardTicks--;
  }
}

// --- Controls[cite: 2] ---
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") selectedIndex = Math.max(0, selectedIndex - 1);
  if (e.key === "ArrowRight") selectedIndex = Math.min(2, selectedIndex + 1);
  if (e.key === "Enter") {
    if (currentOptions[selectedIndex] === targetSyllable) {
      currentIndex++;
      rewardAnimal = Object.keys(assets.animals)[Math.floor(Math.random() * 5)];
      rewardTicks = 100;
      setTimeout(nextRound, 1000);
    }
  }
});

nextRound();
update();
