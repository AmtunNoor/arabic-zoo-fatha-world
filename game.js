/**
 * Zoo Fatha World - Arabic Early Learning
 * Updated strictly to .TXT design requirements
 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Configuration from .TXT Requirements
const CONFIG = {
    letters: ["جَ", "دَ", "سَ", "عَ", "لَ"],
    sounds: { "جَ": "ja", "دَ": "da", "سَ": "sa", "عَ": "a", "لَ": "la" },
    worldWidth: 6000,
    cageSpacing: 900,
    cameraEasing: 0.05,
    colors: {
        highlight: "#FFD54F",
        glow: "rgba(255, 213, 79, 0.6)",
        text: "#1a1a1a"
    }
};

let state = {
    cameraX: 0,
    currentIndex: 0,
    options: [],
    target: null,
    selected: 1,
    floatingReward: null,
    rewardTimer: 0,
    shake: 0,
    animTime: 0
};

// =====================
// ASSET LOADING
// =====================
function loadAsset(path) {
    const img = new Image();
    img.src = path;
    return img;
}

const assets = {
    bg: loadAsset("assets/zoo-bg.jpg"),
    cageClosed: loadAsset("assets/cage-closed.png"),
    cageOpen: loadAsset("assets/cage-open.png"),
    animals: {
        lion: loadAsset("assets/lion.png"),
        monkey: loadAsset("assets/monkey.png"),
        bird: loadAsset("assets/bird.png"),
        elephant: loadAsset("assets/elephant.png"),
        turtle: loadAsset("assets/turtle.png")
    }
};

const animalKeys = Object.keys(assets.animals);

// =====================
// GAME LOGIC
// =====================
function initRound() {
    // Select 3 random syllables for the UI
    state.options = [...CONFIG.letters].sort(() => Math.random() - 0.5).slice(0, 3);
    state.target = state.options[Math.floor(Math.random() * state.options.length)];
    state.selected = 1; // Start center for TV/Remote feel

    // Single pronunciation per round
    speak(CONFIG.sounds[state.target]);
}

function checkAnswer() {
    if (state.options[state.selected] === state.target) {
        // Success Logic
        state.floatingReward = animalKeys[Math.floor(Math.random() * animalKeys.length)];
        state.rewardTimer = 120;
        state.shake = 15;
        state.currentIndex++;
        
        setTimeout(() => {
            if (state.currentIndex < 10) initRound(); // Infinite loop for demo
        }, 1500);
    } else {
        state.shake = 5;
        speak("Try again");
    }
}

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "ar-SA";
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
}

// =====================
// RENDERING SYSTEM
// =====================
function draw() {
    state.animTime += 0.05;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Smooth Camera Easing[cite: 2]
    const targetCam = (state.currentIndex * CONFIG.cageSpacing) - canvas.width / 2 + 200;
    state.cameraX += (targetCam - state.cameraX) * CONFIG.cameraEasing;

    // 2. Parallax Background
    if (assets.bg.complete) {
        ctx.drawImage(assets.bg, -state.cameraX * 0.3, 0, CONFIG.worldWidth, canvas.height);
    }

    // 3. Draw Cages in World Space[cite: 1, 2]
    for (let i = 0; i < 10; i++) {
        const x = (i * CONFIG.cageSpacing) - state.cameraX;
        const y = canvas.height * 0.45;
        const isUnlocked = i < state.currentIndex;
        const img = isUnlocked ? assets.cageOpen : assets.cageClosed;
        
        ctx.save();
        ctx.translate(x, y + Math.sin(state.animTime + i) * 5); // Breathing animation
        if (i === state.currentIndex && state.shake > 0) {
            ctx.translate(Math.random() * state.shake, 0);
            state.shake *= 0.9;
        }
        ctx.drawImage(img, -150, -150, 300, 300);
        ctx.restore();
    }

    // 4. Reward Animation (Appear -> Bounce -> Exit)[cite: 2]
    if (state.rewardTimer > 0 && state.floatingReward) {
        const animalImg = assets.animals[state.floatingReward];
        const bounce = Math.abs(Math.sin(state.animTime * 2)) * 50;
        const opacity = state.rewardTimer / 120;
        ctx.globalAlpha = opacity;
        ctx.drawImage(animalImg, canvas.width/2 - 125, canvas.height * 0.2 - bounce, 250, 250);
        ctx.globalAlpha = 1.0;
        state.rewardTimer--;
    }

    // 5. UI Options (Premium Polish)[cite: 2]
    const uiY = canvas.height * 0.8;
    state.options.forEach((opt, i) => {
        const x = (canvas.width / 2) + (i - 1) * 280;
        const isSel = i === state.selected;
        const pulse = isSel ? Math.sin(state.animTime * 4) * 10 : 0;

        // Glow selection[cite: 2]
        if (isSel) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = CONFIG.colors.glow;
        }

        ctx.fillStyle = isSel ? CONFIG.colors.highlight : "white";
        ctx.beginPath();
        ctx.roundRect(x - 100, uiY - 75 + pulse, 200, 150, 25);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = CONFIG.colors.text;
        ctx.font = "bold 80px 'Baloo 2', Arial";
        ctx.textAlign = "center";
        ctx.fillText(opt, x, uiY + 25 + pulse);
    });

    requestAnimationFrame(draw);
}

// =====================
// INPUT HANDLING[cite: 2]
// =====================
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") state.selected = Math.max(0, state.selected - 1);
    if (e.key === "ArrowRight") state.selected = Math.min(state.options.length - 1, state.selected + 1);
    if (e.key === "Enter" || e.key === " ") checkAnswer();
});

canvas.addEventListener("touchstart", (e) => {
    const touchX = e.touches[0].clientX;
    const center = canvas.width / 2;
    if (touchX < center - 140) state.selected = 0;
    else if (touchX > center + 140) state.selected = 2;
    else state.selected = 1;
    checkAnswer();
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();
initRound();
draw();
