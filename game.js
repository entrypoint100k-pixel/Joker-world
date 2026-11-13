
"use strict";

/* ==========================================
   JOKER WORLDS - MIDNIGHT ARCADE
   Juego + música + efectos + monedas animadas
========================================== */

const $ = id => document.getElementById(id);
const SAVE = "joker_worlds_new";
const POWER_SECONDS = 180;
const SHOP_SECONDS = 180;

const data = {
  coins: 1000,
  wins: 0,
  games: 0,
  skills: [],
  inventory: {},
  activePower: null,
  shopRemaining: SHOP_SECONDS,
  shopStock: []
};

const symbols = ["7", "♦", "$", "★", "C", "J"];
const costs = { slot: 10, scratch: 20, rush: 15 };

const skills = [
  {id:"shop",name:"Desbloquear tienda",price:1000,desc:"Desbloquea la tienda de objetos.",sprite:"shop"},
  {id:"double",name:"Premios x2",price:500,desc:"Duplica todos tus premios permanentemente.",sprite:"double"},
  {id:"triple",name:"Premios x3",price:1200,desc:"Triplica tus premios permanentemente. Necesita x2.",sprite:"triple"},
  {id:"discount",name:"Descuento",price:700,desc:"Reduce el costo de jugar un 25% permanentemente.",sprite:"discount"},
  {id:"scratch",name:"Raspador grande",price:600,desc:"Aumenta el tamaño del raspador permanentemente.",sprite:"scratch"},
  {id:"speed",name:"Giro rápido",price:800,desc:"Acelera las máquinas permanentemente.",sprite:"speed"}
];

const jokers = [
  {id:"fortune",name:"Joker Fortuna",price:400,desc:"Aumenta los premios un 10% durante 3 minutos.",sprite:"fortune",kind:"joker"},
  {id:"saver",name:"Joker Ahorro",price:350,desc:"Reduce los costos un 10% durante 3 minutos.",sprite:"saver",kind:"joker"},
  {id:"turbo",name:"Joker Turbo",price:500,desc:"Acelera los giros durante 3 minutos.",sprite:"turbo",kind:"joker"},
  {id:"royal",name:"Joker Real",price:900,desc:"Aumenta los premios un 15% durante 3 minutos.",sprite:"royal",kind:"joker"}
];

const specialCards = [
  {id:"lucky",name:"Carta de la Suerte",price:300,desc:"Aumenta los premios un 25% durante 3 minutos.",sprite:"lucky",kind:"card"},
  {id:"coupon",name:"Cupón Dorado",price:250,desc:"Reduce los costos un 20% durante 3 minutos.",sprite:"coupon",kind:"card"},
  {id:"overdrive",name:"Carta Turbo",price:350,desc:"Acelera las máquinas durante 3 minutos.",sprite:"overdrive",kind:"card"}
];

const catalog = [...jokers, ...specialCards];

const pixel = {
  fortune:["..GG....",".GYYG...","GYYYYG..","GYYYYG..",".GYYG...","..GG....","...G....","..G....."],
  saver:["...YY...","..YGGY..",".YG..GY.","YG....GY","YG....GY",".YG..GY.","..YGGY..","...YY..."],
  turbo:["....Y...","...YY...","..YYY...","YYYYYYY.","...YYY..","..YYY...","..Y.....","........."],
  royal:["...YY...","..YYYY..",".Y.YY.Y.","YYYYYYYY","..YYYY..","..YYYY..",".YYYYYY.","YY....YY"],
  lucky:["...G....","..GGG...",".G.G.G..","..GGG...","...G....","..GGG...",".G...G..","........."],
  coupon:["YYYYYYYY","Y......Y","Y.YYYY.Y","Y.Y..Y.Y","Y.YYYY.Y","Y......Y","YYYYYYYY","........"],
  overdrive:["....R...","...RR...","..RRR...","RRRRRRR.","...RRR..","..RRR...","..R.....","........."],
  shop:["..YYYY..",".Y....Y.","Y.YYYY.Y","Y.Y..Y.Y","Y.YYYY.Y","Y......Y",".YYYYYY.","........"],
  double:["........",".Y....Y.","..Y..Y..","...YY...","...YY...","..Y..Y..",".Y....Y.","........"],
  triple:["...Y....","..YYY...",".YYYYY..","YYYYYYY.","...Y....","...Y....","...Y....","........"],
  discount:["..GG....",".G..G...","G....G..","G....G..",".G..G...","..GG....","...G....","..GG...."],
  scratch:["YYYYYYYY","Y......Y","Y..YY..Y","Y..YY..Y","Y......Y","Y.YYYY.Y","Y......Y","YYYYYYYY"],
  speed:["....R...","...RR...","..RRR...","RRRRRRR.","...RRR..","..RRR...","..R.....","........."]
};

const palette = {
  Y:"#ffd34e",
  G:"#70f58a",
  R:"#ff526b",
  ".":"#10091d"
};

let busy = false;
let spinTimer = null;
let selectedItem = null;
let scratchSymbols = [];
let scratchDone = [];
let sessionActive = false;
let currentGame = null;
let clock = null;

/* ==========================================
   AUDIO SYSTEM
========================================== */

let audioContext = null;
let musicTimer = null;
let musicIndex = 0;
let currentMusicTheme = "arcade";

const audioSettings = {
  music: true,
  effects: true
};

const musicTracks = {
  arcade: {
    tempo: 280,
    bass: [73.42,58.27,87.31,55],
    chords: [
      [293.66,349.23,440,523.25],
      [233.08,293.66,349.23,440],
      [261.63,329.63,392,493.88],
      [220,277.18,329.63,415.30]
    ],
    melody: [
      587,0,698,0,784,0,698,587,
      523,0,587,0,698,784,0,587,
      523,0,659,0,784,0,659,587,
      415,0,523,0,659,587,0,0
    ]
  },

  shop: {
    tempo: 340,
    bass: [65.41,82.41,73.42,55],
    chords: [
      [261.63,329.63,392,493.88],
      [293.66,369.99,440,554.37],
      [220,277.18,329.63,415.30],
      [246.94,311.13,369.99,466.16]
    ],
    melody: [
      784,0,659,0,587,0,659,784,
      880,0,784,0,659,587,0,0,
      698,0,784,0,880,0,784,659,
      587,0,523,0,587,659,0,0
    ]
  }
};

function getAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;

  if (!audioContext) audioContext = new Audio();

  if (!document.hidden && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function tone(freq,duration=.1,volume=.12,wave="square",delay=0) {
  if (!audioSettings.effects || document.hidden) return;

  const ctx = getAudio();
  if (!ctx || ctx.state !== "running") return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;

  osc.type = wave;
  osc.frequency.setValueAtTime(freq,start);

  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(
    Math.min(volume * 3,.55),
    start+.01
  );
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start+duration+.02);
}

function musicNote(freq,duration,volume,wave="triangle",delay=0) {
  if (!audioSettings.music || document.hidden) return;

  const ctx = getAudio();
  if (!ctx || ctx.state !== "running") return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;

  osc.type = wave;
  osc.frequency.setValueAtTime(freq,start);

  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(
    Math.min(volume * 3,.18),
    start+.025
  );
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start+duration+.03);
}

function playMusicStep() {
  if (!audioSettings.music || document.hidden) return;

  const track = musicTracks[currentMusicTheme] || musicTracks.arcade;
  const step = musicIndex % 32;
  const bar = Math.floor(step/8);
  const chord = track.chords[bar];

  if (step%2===0) {
    musicNote(track.bass[bar],.32,.035,"triangle");
  }

  if (step===0 || step===4) {
    chord.forEach((freq,i)=>{
      musicNote(freq,.55,.012,"triangle",i*.018);
    });
  }

  const note = track.melody[step];
  if (note) musicNote(note,.22,.018,"sine");

  if (step%4===2) {
    musicNote(110,.07,.012,"square");
  }

  musicIndex=(musicIndex+1)%32;
}

function startArcadeMusic(theme="arcade") {
  if (!audioSettings.music || document.hidden) return;

  if (musicTimer && currentMusicTheme===theme) return;

  stopArcadeMusic();
  currentMusicTheme=theme;
  musicIndex=0;

  const ctx=getAudio();
  if (!ctx || ctx.state!=="running") return;

  playMusicStep();

  musicTimer=setInterval(
    playMusicStep,
    musicTracks[theme].tempo
  );
}

function stopArcadeMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer=null;
}

function resumeGameAudio() {
  if (document.hidden) return;

  const activeScreen=document.querySelector(".screen:not(.hidden)");
  if (!activeScreen || activeScreen.id==="intro") return;

  if (!audioSettings.music) return;

  const ctx=getAudio();
  if (!ctx) return;

  ctx.resume().then(()=>{
    if (document.hidden || !audioSettings.music) return;

    if (!musicTimer) {
      playMusicStep();
      musicTimer=setInterval(
        playMusicStep,
        musicTracks[currentMusicTheme].tempo
      );
    }
  }).catch(()=>{});
}

function soundButton() {
  tone(520,.045,.012,"square");
  tone(760,.055,.008,"triangle",.035);
}

function soundSpinTick(step) {
  tone(520+(step%4)*85,.055,.018,"square");
}

function soundMachineStop() {
  tone(180,.12,.035,"square");
  tone(110,.16,.02,"triangle",.07);
}

function soundWin() {
  [523,659,784,1047].forEach((n,i)=>{
    tone(n,.22,.045,"square",i*.14);
  });
  tone(1318,.3,.025,"triangle",.56);
}

function soundLose() {
  tone(220,.12,.025,"triangle");
  tone(165,.18,.02,"triangle",.13);
}

function soundScratch() {
  tone(680,.045,.012,"square");
}

function soundCoins() {
  [880,1174,1396,1760].forEach((n,i)=>{
    tone(n,.12,.025,"sine",i*.075);
  });
}

function soundUnlock() {
  [392,523,659,784,1047].forEach((n,i)=>{
    tone(n,.18,.03,"square",i*.11);
  });
}

function createAudioControls() {
  if ($("jwAudioControls")) return;

  const panel=document.createElement("div");
  panel.id="jwAudioControls";

  panel.style.cssText=[
    "position:fixed",
    "right:10px",
    "bottom:10px",
    "z-index:100000",
    "display:flex",
    "gap:5px",
    "padding:6px",
    "background:#160d25",
    "border:1px solid #9b4dff",
    "border-radius:8px",
    "font-family:monospace"
  ].join(";");

  function makeButton(id,label,callback) {
    const btn=document.createElement("button");
    btn.id=id;
    btn.textContent=label;

    btn.style.cssText=[
      "background:#29183c",
      "color:#ffd34e",
      "border:1px solid #9b4dff",
      "border-radius:5px",
      "padding:7px 8px",
      "font-size:9px",
      "font-family:monospace"
    ].join(";");

    btn.addEventListener("click",()=>{
      getAudio();
      callback();
      updateAudioControls();
    });

    panel.appendChild(btn);
  }

  makeButton("jwMusicButton","♫ MÚSICA",()=>{
    audioSettings.music=!audioSettings.music;

    if (audioSettings.music) {
      startArcadeMusic(currentMusicTheme);
    } else {
      stopArcadeMusic();
    }
  });

  makeButton("jwEffectsButton","♪ EFECTOS",()=>{
    audioSettings.effects=!audioSettings.effects;
  });

  document.body.appendChild(panel);
  updateAudioControls();
}

function updateAudioControls() {
  const music=$("jwMusicButton");
  const effects=$("jwEffectsButton");

  if (music) {
    music.textContent=audioSettings.music?"♫ MÚSICA ON":"♫ MÚSICA OFF";
  }

  if (effects) {
    effects.textContent=audioSettings.effects?"♪ EFECTOS ON":"♪ EFECTOS OFF";
  }
}

/* ==========================================
   PIXEL SPRITES
========================================== */

function spriteCanvas(key,size=64) {
  const canvas=document.createElement("canvas");
  canvas.width=8;
  canvas.height=8;
  canvas.className="sprite";
  canvas.style.width=size+"px";
  canvas.style.height=size+"px";

  const ctx=canvas.getContext("2d");
  const map=pixel[key]||pixel.fortune;

  map.forEach((row,y)=>[...row].forEach((cell,x)=>{
    if(cell!=="."){
      ctx.fillStyle=palette[cell]||"#fff";
      ctx.fillRect(x,y,1,1);
    }
  }));

  return canvas;
}

/* ==========================================
   SAVE / LOAD
========================================== */

function save() {
  try {
    localStorage.setItem(SAVE,JSON.stringify(data));
  } catch(e) {
    console.warn("No se pudo guardar.",e);
  }
}

function load() {
  try {
    const saved=JSON.parse(localStorage.getItem(SAVE));

    if (!saved) {
      rotateShop(false);
      return;
    }

    data.coins=Number.isFinite(saved.coins)?saved.coins:1000;
    data.wins=Number.isFinite(saved.wins)?saved.wins:0;
    data.games=Number.isFinite(saved.games)?saved.games:0;
    data.skills=Array.isArray(saved.skills)?saved.skills:[];
    data.inventory=saved.inventory&&typeof saved.inventory==="object"?saved.inventory:{};
    data.activePower=saved.activePower&&typeof saved.activePower==="object"?saved.activePower:null;
    data.shopRemaining=Number.isFinite(saved.shopRemaining)?saved.shopRemaining:SHOP_SECONDS;
    data.shopStock=Array.isArray(saved.shopStock)?saved.shopStock:[];

    if(data.activePower&&(!Number.isFinite(data.activePower.remaining)||data.activePower.remaining<=0)){
      data.activePower=null;
    }

    if(!data.shopStock.length) rotateShop(false);

  } catch(e) {
    console.warn("No se pudo cargar la partida.",e);
    rotateShop(false);
  }
}

function hasSkill(id) {
  return data.skills.includes(id);
}

function inventoryCount(id) {
  return Math.max(0,Number(data.inventory[id])||0);
}

function activeItem() {
  return data.activePower?catalog.find(x=>x.id===data.activePower.id):null;
}

function hasActive(id) {
  return !!data.activePower&&data.activePower.id===id&&data.activePower.remaining>0;
}

/* ==========================================
   GAME RULES
========================================== */

function cost(type) {
  let discount=hasSkill("discount") ? .25 : 0;

  if(hasActive("saver")) discount+=.10;
  if(hasActive("coupon")) discount+=.20;

  return Math.max(
    1,
    Math.ceil(costs[type]*(1-Math.min(.75,discount)))
  );
}

function multiplier() {
  let value=hasSkill("triple")?3:hasSkill("double")?2:1;

  if(hasActive("fortune")) value*=1.10;
  if(hasActive("royal")) value*=1.15;
  if(hasActive("lucky")) value*=1.25;

  return value;
}

function isFast() {
  return hasSkill("speed")||hasActive("turbo")||hasActive("overdrive");
}

/* ==========================================
   HUD
========================================== */

function update() {
  ["coins","gameCoins","statCoins"].forEach(id=>{
    if($(id)) $(id).textContent=data.coins;
  });

  if($("statWins")) $("statWins").textContent=data.wins;
  if($("statGames")) $("statGames").textContent=data.games;

  if($("shopButton")) {
    $("shopButton").textContent=hasSkill("shop")?"TIENDA PIXEL":"🔒 TIENDA";
  }

  updatePowerHud();

  if($("shopTimer")) {
    $("shopTimer").textContent=formatTime(data.shopRemaining);
  }
}

function formatTime(seconds) {
  seconds=Math.max(0,Math.ceil(seconds||0));

  return String(Math.floor(seconds/60)).padStart(2,"0")+":"+
    String(seconds%60).padStart(2,"0");
}

function updatePowerHud() {
  const item=activeItem();
  const hud=$("powerHud");

  if(!hud) return;

  if(item&&data.activePower.remaining>0) {
    hud.classList.add("active");
    $("activePowerText").textContent=item.name.toUpperCase();
    $("activePowerTime").textContent=formatTime(data.activePower.remaining);
    $("usePower").textContent="OBJETO ACTIVO";
    $("usePower").disabled=true;
  } else {
    hud.classList.remove("active");
    $("activePowerText").textContent="SIN OBJETO ACTIVO";
    $("activePowerTime").textContent="--:--";
    $("usePower").textContent="USAR OBJETO";
    $("usePower").disabled=false;
  }
}

/* ==========================================
   COIN ANIMATION
========================================== */

function animateCoinGain(oldCoins,newCoins) {
  const screen=document.querySelector(".screen:not(.hidden)");
  const target=screen?.querySelector(".coins");
  const counter=target?.querySelector("b");

  if(!target||!counter) return;

  let source=null;

  if(currentGame==="slot") source=$("slotResult");
  if(currentGame==="scratch") source=$("scratchResult");
  if(currentGame==="rush") source=$("rushResult");

  const start=source?source.getBoundingClientRect():target.getBoundingClientRect();
  const end=target.getBoundingClientRect();

  const startX=start.left+start.width/2;
  const startY=start.top+start.height/2;
  const endX=end.left+end.width/2;
  const endY=end.top+end.height/2;

  for(let i=0;i<9;i++) {
    const coin=document.createElement("span");
    coin.className="jw-flying-coin";
    coin.textContent="🪙";

    const offsetX=(Math.random()-.5)*100;
    const offsetY=(Math.random()-.5)*55;

    coin.style.cssText=[
      "position:fixed",
      "z-index:99999",
      "pointer-events:none",
      "font-size:25px",
      "filter:drop-shadow(0 0 7px #ffd34e)",
      "left:"+(startX+offsetX)+"px",
      "top:"+(startY+offsetY)+"px"
    ].join(";");

    document.body.appendChild(coin);

    if(typeof coin.animate==="function") {
      const animation=coin.animate([
        {transform:"translate(0,0) scale(1)",opacity:1},
        {
          transform:`translate(${endX-startX-offsetX}px,${endY-startY-offsetY}px) scale(.35)`,
          opacity:0
        }
      ],{
        duration:750+i*45,
        delay:i*35,
        easing:"cubic-bezier(.2,.8,.3,1)"
      });

      animation.onfinish=()=>coin.remove();
    } else {
      coin.remove();
    }
  }

  const duration=850;
  const startTime=performance.now();

  function countUp(now) {
    const progress=Math.min(1,(now-startTime)/duration);
    const eased=1-Math.pow(1-progress,3);

    counter.textContent=Math.round(oldCoins+(newCoins-oldCoins)*eased);

    if(progress<1) {
      requestAnimationFrame(countUp);
    } else {
      counter.textContent=newCoins;
    }
  }

  requestAnimationFrame(countUp);

  target.classList.remove("coin-impact");
  void target.offsetWidth;
  target.classList.add("coin-impact");

  setTimeout(()=>target.classList.remove("coin-impact"),650);

  soundCoins();
}

function reward(amount) {
  const oldCoins=data.coins;
  const won=Math.round(amount*multiplier());

  data.coins+=won;
  data.wins++;

  save();
  update();
  animateCoinGain(oldCoins,data.coins);

  return won;
}

function charge(type) {
  const price=cost(type);

  if(data.coins<price) {
    alert("No tenés fichas suficientes.");
    return false;
  }

  data.coins-=price;
  data.games++;

  save();
  update();

  return true;
}

/* ==========================================
   TIMERS
========================================== */

function startSessionClock() {
  sessionActive=true;

  if(clock) clearInterval(clock);

  clock=setInterval(()=>{
    if(!sessionActive||document.hidden) return;

    if(data.activePower) {
      data.activePower.remaining--;

      if(data.activePower.remaining<=0) {
        data.activePower=null;

        if($("activePowerText")) {
          $("activePowerText").textContent="OBJETO AGOTADO";
        }
      }
    }

    data.shopRemaining--;

    if(data.shopRemaining<=0) rotateShop(true);

    update();
    save();
  },1000);
}

function stopSessionClock() {
  sessionActive=false;

  if(clock) {
    clearInterval(clock);
    clock=null;
  }

  save();
}

function rotateShop(announce) {
  const pool=[...catalog];
  const chosen=[];

  while(chosen.length<Math.min(4,pool.length)) {
    const index=Math.floor(Math.random()*pool.length);
    chosen.push(pool.splice(index,1)[0].id);
  }

  data.shopStock=chosen;
  data.shopRemaining=SHOP_SECONDS;

  save();

  if($("shopList")&&$("shopPage")&&!$("shopPage").classList.contains("hidden")) {
    renderShop();
  }

  if(announce&&$("shopList")&&$("shopPage")&&!$("shopPage").classList.contains("hidden")) {
    $("shopList").insertAdjacentHTML(
      "afterbegin",
      '<p class="rotation-message">¡LA TIENDA SE ACTUALIZÓ!</p>'
    );

    soundUnlock();
  }
}

/* ==========================================
   SCREENS
========================================== */

function showScreen(id) {
  stopBusy();

  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));

  const nextScreen=$(id);
  if(!nextScreen) {
    console.error("No existe la pantalla:",id);
    return;
  }

  nextScreen.classList.remove("hidden");

  if(id==="intro") {
    stopSessionClock();
    stopArcadeMusic();
  } else {
    startSessionClock();
    startArcadeMusic(id==="shopPage"?"shop":"arcade");
  }

  update();
}

function stopBusy() {
  if(spinTimer) {
    clearInterval(spinTimer);
    spinTimer=null;
  }

  busy=false;

  if($("spin")) $("spin").disabled=false;

  if($("rushReel")) {
    $("rushReel").disabled=false;
    $("rushReel").classList.remove("rolling");
  }

  if($("slotGame")) {
    const machine=$("slotGame").querySelector(".slot-machine");
    if(machine) machine.classList.remove("spinning");
  }
}

function back() {
  if($("jokerModal")) $("jokerModal").classList.add("hidden");
  if($("useModal")) $("useModal").classList.add("hidden");

  showScreen("menu");
}

function openGame(name) {
  showScreen("game");
  currentGame=name;

  ["slotGame","scratchGame","rushGame"].forEach(id=>{
    $(id).classList.add("hidden");
  });

  const titles={
    slot:"JOKER SLOTS",
    scratch:"SCRATCH PIXEL",
    rush:"PIXEL RUSH"
  };

  const panels={
    slot:"slotGame",
    scratch:"scratchGame",
    rush:"rushGame"
  };

  if(!panels[name]) return;

  $("gameTitle").textContent=titles[name];
  $(panels[name]).classList.remove("hidden");

  if(name==="scratch") {
    if(!charge("scratch")) {
      showScreen("menu");
      return;
    }

    createScratch();
  }
}

/* ==========================================
   OBJECTS
========================================== */

function openUseModal() {
  if(!currentGame) {
    alert("Primero entrá en una maquinita.");
    return;
  }

  if(data.activePower) {
    alert("Ya tenés un objeto activo.");
    return;
  }

  const list=$("useList");
  list.innerHTML="";

  const owned=catalog.filter(item=>inventoryCount(item.id)>0);

  if(!owned.length) {
    list.textContent="NO TENÉS OBJETOS. COMPRALOS EN LA TIENDA.";
  } else {
    owned.forEach(item=>{
      const row=document.createElement("div");
      row.className="use-option";

      const label=document.createElement("span");
      label.textContent=item.name+" x"+inventoryCount(item.id);

      const btn=document.createElement("button");
      btn.textContent="ACTIVAR";
      btn.addEventListener("click",()=>activateItem(item.id));

      row.append(spriteCanvas(item.sprite,42),label,btn);
      list.appendChild(row);
    });
  }

  $("useModal").classList.remove("hidden");
}

function activateItem(id) {
  const item=catalog.find(x=>x.id===id);

  if(!item||inventoryCount(id)<=0||data.activePower) return;

  data.inventory[id]=inventoryCount(id)-1;
  data.activePower={id,remaining:POWER_SECONDS};

  $("useModal").classList.add("hidden");

  save();
  update();
  renderShop();
  soundUnlock();
}

/* ==========================================
   JOKER SLOTS
========================================== */

function spin() {
  if(busy||!charge("slot")) return;

  getAudio();

  busy=true;
  $("spin").disabled=true;

  const machine=$("slotGame").querySelector(".slot-machine");
  const reels=document.querySelectorAll(".reel");

  machine.classList.add("spinning");

  let count=0;

  spinTimer=setInterval(()=>{
    reels.forEach(reel=>{
      reel.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    });

    count++;

    if(count%3===0) soundSpinTick(count);

    if(count>=18) {
      clearInterval(spinTimer);
      spinTimer=null;

      let result;

      if(Math.random()<.35) {
        const s=symbols[Math.floor(Math.random()*symbols.length)];
        result=[s,s,s];
      } else {
        result=Array.from(
          {length:3},
          ()=>symbols[Math.floor(Math.random()*symbols.length)]
        );

        if(result[0]===result[1]&&result[1]===result[2]) {
          result[2]=symbols[(symbols.indexOf(result[2])+1)%symbols.length];
        }
      }

      reels.forEach((reel,i)=>reel.textContent=result[i]);

      soundMachineStop();

      if(result[0]===result[1]&&result[1]===result[2]) {
        const won=reward(200);
        $("slotResult").textContent="¡JACKPOT! +"+won+" FICHAS";
        soundWin();
      } else {
        $("slotResult").textContent="SIN PREMIO";
        soundLose();
      }

      machine.classList.remove("spinning");
      busy=false;
      $("spin").disabled=false;
    }
  },isFast()?45:100);
}

/* ==========================================
   SCRATCH PIXEL
========================================== */

function createScratch() {
  const scratchIcons=["7","♦","$","★","C","J"];

  scratchSymbols=Array.from({length:3},()=>{
    return scratchIcons[Math.floor(Math.random()*scratchIcons.length)];
  });

  scratchDone=[false,false,false];

  $("scratchGrid").innerHTML="";
  $("scratchResult").textContent="¡RASPÁ LOS TRES CUADROS!";

  scratchSymbols.forEach((symbol,index)=>{
    const cell=document.createElement("div");
    cell.className="scratch-cell";

    const revealed=document.createElement("div");
    revealed.className="scratch-symbol";
    revealed.textContent=symbol;

    const canvas=document.createElement("canvas");
    cell.append(revealed,canvas);
    $("scratchGrid").appendChild(cell);

    const rect=cell.getBoundingClientRect();
    const ratio=window.devicePixelRatio||1;

    canvas.width=Math.max(1,Math.round(rect.width*ratio));
    canvas.height=Math.max(1,Math.round(rect.height*ratio));

    const ctx=canvas.getContext("2d");

    if(!ctx) {
      finishScratch(index,cell);
      return;
    }

    ctx.fillStyle="#aaa9b5";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#555";
    ctx.font=`bold ${12*ratio}px monospace`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("RASPAR",canvas.width/2,canvas.height/2);

    let drawing=false;
    let lastX=0;
    let lastY=0;
    let distance=0;

    const pos=e=>{
      const b=canvas.getBoundingClientRect();

      return {
        x:(e.clientX-b.left)*ratio,
        y:(e.clientY-b.top)*ratio
      };
    };

    const erase=(x1,y1,x2,y2)=>{
      ctx.globalCompositeOperation="destination-out";
      ctx.lineWidth=(hasSkill("scratch")?58:38)*ratio;
      ctx.lineCap="round";
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.stroke();
    };

    const check=()=>{
      if(scratchDone[index]) return;

      try {
        const px=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let clear=0;
        let total=0;

        for(let i=3;i<px.length;i+=16) {
          total++;
          if(px[i]<100) clear++;
        }

        if(clear/total>=.35) finishScratch(index,cell);

      } catch(e) {
        if(distance>=canvas.width*2.5) finishScratch(index,cell);
      }
    };

    canvas.addEventListener("pointerdown",e=>{
      if(scratchDone[index]) return;

      drawing=true;
      canvas.setPointerCapture(e.pointerId);

      const p=pos(e);
      lastX=p.x;
      lastY=p.y;

      erase(p.x,p.y,p.x+1,p.y+1);
      check();
    });

    canvas.addEventListener("pointermove",e=>{
      if(!drawing||scratchDone[index]) return;

      const p=pos(e);
      erase(lastX,lastY,p.x,p.y);

      distance+=Math.hypot(p.x-lastX,p.y-lastY);

      lastX=p.x;
      lastY=p.y;

      if(distance>=canvas.width*2.5) {
        finishScratch(index,cell);
      } else if(distance%100<15) {
        check();
      }
    });

    ["pointerup","pointercancel"].forEach(ev=>{
      canvas.addEventListener(ev,()=>{
        drawing=false;
        check();
      });
    });
  });
}

function finishScratch(index,cell) {
  if(scratchDone[index]) return;

  scratchDone[index]=true;
  cell.classList.add("scratched");

  soundScratch();
  checkScratch();
}

function checkScratch() {
  const found=scratchDone.filter(Boolean).length;

  if(found<3) {
    $("scratchResult").textContent=found+" DE 3 DESCUBIERTOS";
    return;
  }

  const [a,b,c]=scratchSymbols;

  if(a===b&&b===c) {
    const won=reward(500);
    $("scratchResult").textContent="¡RASPADAZO! +"+won+" FICHAS";
    soundWin();
  } else {
    $("scratchResult").textContent="TARJETA COMPLETA · SIN PREMIO";
    soundLose();
  }
}

function newScratch() {
  if(busy) return;
  if(!charge("scratch")) return;

  createScratch();
}

/* ==========================================
   PIXEL RUSH
========================================== */

function rush() {
  if(busy||!charge("rush")) return;

  getAudio();

  busy=true;

  const reel=$("rushReel");
  reel.disabled=true;
  reel.classList.add("rolling");

  let count=0;

  spinTimer=setInterval(()=>{
    reel.textContent=symbols[Math.floor(Math.random()*symbols.length)];

    count++;

    if(count%3===0) soundSpinTick(count);

    if(count>=18) {
      clearInterval(spinTimer);
      spinTimer=null;

      reel.classList.remove("rolling");
      soundMachineStop();

      const roll=Math.random()*100;
      const prize=roll<40?0:roll<70?5:roll<88?10:roll<98?20:50;

      if(prize>0) {
        const won=reward(prize);
        $("rushResult").textContent="¡GANASTE! +"+won+" FICHAS";
        soundWin();
      } else {
        $("rushResult").textContent="SIN PREMIO · ¡PROBÁ OTRA VEZ!";
        soundLose();
      }

      busy=false;
      reel.disabled=false;
    }
  },isFast()?45:100);
}

/* ==========================================
   SKILL TREE
========================================== */

function renderSkills() {
  $("skillsList").innerHTML="";

  skills.forEach(skill=>{
    const owned=hasSkill(skill.id);
    const locked=skill.id==="triple"&&!hasSkill("double");

    const card=document.createElement("div");
    card.className="item";
    card.appendChild(spriteCanvas(skill.sprite));

    const title=document.createElement("h3");
    title.textContent=skill.name;

    const desc=document.createElement("p");
    desc.textContent=skill.desc;

    const button=document.createElement("button");
    button.className="buy-button";

    button.textContent=owned?"COMPRADO · PERMANENTE":locked?"BLOQUEADO":skill.price+" FICHAS";
    button.disabled=owned||locked;

    button.addEventListener("click",()=>buySkill(skill.id));

    card.append(title,desc,button);
    $("skillsList").appendChild(card);
  });
}

function buySkill(id) {
  const skill=skills.find(x=>x.id===id);

  if(!skill||hasSkill(id)) return;

  if(id==="triple"&&!hasSkill("double")) {
    alert("Primero comprá Premios x2.");
    return;
  }

  if(data.coins<skill.price) {
    alert("No tenés fichas suficientes.");
    return;
  }

  data.coins-=skill.price;
  data.skills.push(id);

  save();
  update();
  renderSkills();
  soundUnlock();
}

/* ==========================================
   SHOP
========================================== */

function renderShop() {
  $("shopList").innerHTML="";
  $("collection").innerHTML="";

  const stock=catalog.filter(item=>data.shopStock.includes(item.id));

  stock.forEach(item=>{
    const card=document.createElement("div");
    card.className="item";

    card.appendChild(spriteCanvas(item.sprite));

    const title=document.createElement("h3");
    title.textContent=item.name;

    const desc=document.createElement("p");
    desc.textContent=item.desc;

    const price=document.createElement("p");
    price.textContent=item.price+" FICHAS";

    const info=document.createElement("button");
    info.className="buy-button";
    info.textContent="VER INFORMACIÓN";
    info.addEventListener("click",()=>showItem(item));

    const buy=document.createElement("button");
    buy.className="buy-button";
    buy.textContent="COMPRAR";
    buy.addEventListener("click",()=>buyItem(item.id));

    card.append(title,desc,price,info,buy);
    $("shopList").appendChild(card);
  });

  if(!stock.length) {
    $("shopList").textContent="LA TIENDA SE ESTÁ PREPARANDO...";
  }

  catalog.forEach(item=>{
    const count=inventoryCount(item.id);
    if(!count) return;

    const card=document.createElement("div");
    card.className="item";
    card.appendChild(spriteCanvas(item.sprite));

    const title=document.createElement("h3");
    title.textContent=item.name;

    const countText=document.createElement("p");
    countText.textContent="CANTIDAD: "+count;

    card.append(title,countText);
    $("collection").appendChild(card);
  });

  if(!$("collection").children.length) {
    $("collection").textContent="TODAVÍA NO TENÉS OBJETOS.";
  }

  $("shopTimer").textContent=formatTime(data.shopRemaining);
}

function showItem(item) {
  selectedItem=item.id;

  $("modalSprite").innerHTML="";
  $("modalSprite").appendChild(spriteCanvas(item.sprite,80));

  $("jokerName").textContent=item.name;
  $("jokerDescription").textContent=item.desc;
  $("buyJoker").textContent="COMPRAR · "+item.price+" FICHAS";
  $("buyJoker").disabled=false;

  $("jokerModal").classList.remove("hidden");
}

function buyItem(id) {
  const item=catalog.find(x=>x.id===id);

  if(!item||!data.shopStock.includes(id)) return;

  if(data.coins<item.price) {
    alert("No tenés fichas suficientes.");
    return;
  }

  data.coins-=item.price;
  data.inventory[id]=inventoryCount(id)+1;

  save();
  update();
  renderShop();

  $("jokerModal").classList.add("hidden");
  soundUnlock();
}

/* ==========================================
   EVENTS / INIT
========================================== */

function init() {
  load();
  update();
  createAudioControls();

  document.addEventListener("click",e=>{
    const button=e.target.closest("button");

    if(!button) return;
    if(button.id==="jwMusicButton"||button.id==="jwEffectsButton") return;
    if(button.disabled) return;

    soundButton();
  });

  $("play").addEventListener("click",()=>{
    getAudio();
    showScreen("menu");
  });

  $("backMenu").addEventListener("click",back);

  document.querySelectorAll(".back").forEach(b=>{
    b.addEventListener("click",back);
  });

  document.querySelectorAll("[data-game]").forEach(b=>{
    b.addEventListener("click",()=>openGame(b.dataset.game));
  });

  $("spin").addEventListener("click",spin);
  $("newScratch").addEventListener("click",newScratch);
  $("rushReel").addEventListener("click",rush);

  $("skillsButton").addEventListener("click",()=>{
    renderSkills();
    showScreen("skillsPage");
  });

  $("shopButton").addEventListener("click",()=>{
    if(!hasSkill("shop")) {
      alert("Primero desbloqueá la tienda en habilidades.");
      return;
    }

    renderShop();
    showScreen("shopPage");
  });

  $("statsButton").addEventListener("click",()=>{
    showScreen("statsPage");
  });

  $("closeModal").addEventListener("click",()=>{
    $("jokerModal").classList.add("hidden");
  });

  $("buyJoker").addEventListener("click",()=>{
    if(selectedItem) buyItem(selectedItem);
  });

  $("usePower").addEventListener("click",openUseModal);

  $("closeUseModal").addEventListener("click",()=>{
    $("useModal").classList.add("hidden");
  });

  showScreen("intro");
}

/* ==========================================
   PAUSA AUTOMÁTICA DEL AUDIO
========================================== */

document.addEventListener("visibilitychange",()=>{
  if(document.hidden) {
    stopArcadeMusic();

    if(audioContext&&audioContext.state==="running") {
      audioContext.suspend().catch(()=>{});
    }
  } else {
    update();
    resumeGameAudio();
  }
});

if(document.readyState==="loading") {
  document.addEventListener("DOMContentLoaded",init);
} else {
  init();
}
