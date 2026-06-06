const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// CONFIG
// =====================
const CONFIG = {
  baseTargetWidth: 1920,
  baseTargetHeight: 1080,
  colors: {
    selected: "#FFD54F",
    unselected: "#FFFFFF",
    stroke: "#FF9800",
    text: "#1A1A1A"
  }
};

// =====================
// STATE
// =====================
let state = {
  letters: ["جَ", "دَ", "سَ", "عَ", "لَ"],
  sounds: { "جَ":"جَ","دَ":"دَ","سَ":"سَ","عَ":"عَ","لَ":"لَ" },
  cameraX: 0,
  currentIndex: 0,
  options: [],
  target: null,
  selected: 1,
  pulseTimer: 0
};

// =====================
// ASSETS
// =====================
function load(src){
  const img = new Image();
  img.src = src;
  return img;
}

const assets = {
  bg: load("assets/zoo-bg.jpg"),
  cageClosed: load("assets/cage-closed.png"),
  cageOpen: load("assets/cage-opened.png"),
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
// ZOO WORLD DATA
// =====================

// PERMANENT animals (IMPORTANT FIX)
const releasedAnimals = [];

// SCATTERED ZOO MAP (not a line)
const cagePositions = [
  { x: 500,  y: 350 },
  { x: 1200, y: 650 },
  { x: 2000, y: 420 },
  { x: 2900, y: 700 },
  { x: 3800, y: 380 }
];

const cages = state.letters.map((l, i) => ({
  id: i,
  letter: l,
  x: cagePositions[i].x,
  y: cagePositions[i].y,
  unlocked: false,
  shake: 0,
  rewardAnimal: null
}));

// =====================
// RESIZE
// =====================
let scale = 1;

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  scale = Math.min(
    canvas.width / CONFIG.baseTargetWidth,
    canvas.height / CONFIG.baseTargetHeight
  );

  if(scale < 0.45) scale = 0.45;
}

window.addEventListener("resize", resize);
resize();

// =====================
// UI FRAME
// =====================
function drawUIFrame(x,y,w,h,r,fill,stroke,line){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();

  if(fill){ ctx.fillStyle = fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}

// =====================
// AUDIO
// =====================
function speak(text){
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

// =====================
// GAME FLOW
// =====================
function nextRound(){
  state.options = [...state.letters]
    .sort(()=>Math.random()-0.5)
    .slice(0,3);

  state.target = state.options[Math.floor(Math.random()*state.options.length)];
  state.selected = 1;

  setTimeout(()=>{
    if(state.target) speak(state.target);
  }, 500);
}

function check(){
  if(state.currentIndex >= cages.length) return;

  const choice = state.options[state.selected];
  if(!choice || !state.target) return;

  if(choice === state.target){

    const cage = cages[state.currentIndex];

    cage.unlocked = true;
    cage.shake = 12;

    const animal = animalKeys[Math.floor(Math.random()*animalKeys.length)];

    cage.rewardAnimal = animal;

    // IMPORTANT: animal becomes PERMANENT in zoo world
    releasedAnimals.push({
      type: animal,
      x: cage.x,
      y: cage.y,
      tx: cage.x + 200 + Math.random()*300,
      ty: cage.y - 100 + Math.random()*200
    });

    state.currentIndex++;

    if(state.currentIndex < cages.length){
      setTimeout(nextRound, 1200);
    }

  } else {
    speak("حاول مرة أخرى");
  }
}

// =====================
// BACKGROUND
// =====================
function drawBackground(){
  if(!assets.bg.complete) return;

  const parallax = -state.cameraX * 0.3;
  const w = canvas.height * (assets.bg.width/assets.bg.height);

  ctx.drawImage(assets.bg, parallax, 0, w, canvas.height);
  ctx.drawImage(assets.bg, parallax + w, 0, w, canvas.height);
}

// =====================
// RELEASED ANIMALS (LIVE WORLD)
// =====================
function drawReleasedAnimals(){

  for(const a of releasedAnimals){

    a.x += (a.tx - a.x) * 0.02;
    a.y += (a.ty - a.y) * 0.02;

    const img = assets.animals[a.type];
    if(!img.complete) continue;

    const x = a.x * scale - state.cameraX;
    const y = a.y * scale + Math.sin(state.pulseTimer*0.08)*8;

    const size = 170 * scale;

    ctx.drawImage(img, x-size/2, y-size/2, size, size);
  }
}

// =====================
// CAGES
// =====================
function drawCages(){

  for(const cage of cages){

    const x = cage.x * scale - state.cameraX;
    const y = cage.y * scale;

    if(cage.id === state.currentIndex && !cage.unlocked){
      ctx.globalAlpha = 1;
    }

    if(cage.shake > 0){
      const shakeX = Math.sin(Date.now()*0.08)*cage.shake;
      cage.shake *= 0.85;
      cage._shakeX = shakeX;
    } else {
      cage._shakeX = 0;
    }

    const img = cage.unlocked ? assets.cageOpen : assets.cageClosed;
    const size = 260 * scale;

    if(img.complete){
      ctx.drawImage(
        img,
        x - size/2 + cage._shakeX,
        y - size/2,
        size,
        size
      );
    }
  }
}

// =====================
// UI
// =====================
function drawUIOptions(){

  if(state.currentIndex >= cages.length) return;

  const center = canvas.width/2;
  const y = canvas.height*0.82;

  const w = 240*scale;
  const h = 135*scale;
  const gap = 290*scale;

  state.options.forEach((o,i)=>{

    const x = center + (i-1)*gap;
    const sel = i === state.selected;

    drawUIFrame(
      x-w/2,
      y-h/2,
      w,
      h,
      26*scale,
      sel ? CONFIG.colors.selected : CONFIG.colors.unselected,
      sel ? CONFIG.colors.stroke : "#D0D0D0",
      sel ? 5*scale : 2*scale
    );

    ctx.fillStyle = CONFIG.colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${72*scale}px Arial`;
    ctx.fillText(o, x, y);
  });
}

// =====================
// COMPLETION
// =====================
function drawCompletion(){
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";

  ctx.font = `bold ${80*scale}px Arial`;
  ctx.fillText("Zoo Complete!", canvas.width/2, canvas.height/2-40);

  ctx.font = `bold ${42*scale}px Arial`;
  ctx.fillText("All Animals Are Free", canvas.width/2, canvas.height/2+40);
}

// =====================
// LOOP
// =====================
function loop(){

  state.pulseTimer++;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(state.currentIndex < cages.length){
    const targetX = cages[state.currentIndex].x*scale - canvas.width/2;
    state.cameraX += (targetX - state.cameraX)*0.06;
  }

  drawBackground();
  drawReleasedAnimals();
  drawCages();
  drawUIOptions();

  if(state.currentIndex >= cages.length){
    drawCompletion();
  }

  requestAnimationFrame(loop);
}

// =====================
// INPUT
// =====================
window.addEventListener("keydown",(e)=>{

  if(e.key==="ArrowLeft")
    state.selected = Math.max(0, state.selected-1);

  if(e.key==="ArrowRight")
    state.selected = Math.min(2, state.selected+1);

  if(e.key==="Enter" || e.key===" ")
    check();
});

canvas.addEventListener("touchstart",(e)=>{
  e.preventDefault();

  const x = e.touches[0].clientX;
  const center = canvas.width/2;
  const gap = 290*scale;

  if(x < center-gap/2) state.selected=0;
  else if(x > center+gap/2) state.selected=2;
  else state.selected=1;

  check();
},{passive:false});

// =====================
// START
// =====================
nextRound();
loop();
