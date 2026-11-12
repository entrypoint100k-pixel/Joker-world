"use strict";

/* JOKER WORLDS - 8 BIT ARCADE */

const $ = id => document.getElementById(id);
const SAVE = "joker_worlds_new";
const POWER_SECONDS = 180;
const SHOP_SECONDS = 180;

const data = {
  coins: 1000, wins: 0, games: 0,
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
const palette = {Y:"#ffd34e",G:"#70f58a",R:"#ff526b","." : "#10091d"};

let busy = false;
let spinTimer = null;
let selectedItem = null;
let scratchSymbols = [];
let scratchDone = [];
let sessionActive = false;
let currentGame = null;
let clock = null;

function spriteCanvas(key, size=64) {
  const canvas = document.createElement("canvas");
  canvas.width = 8; canvas.height = 8;
  canvas.className = "sprite";
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  const ctx = canvas.getContext("2d");
  const map = pixel[key] || pixel.fortune;
  map.forEach((row,y) => [...row].forEach((cell,x) => {
    if (cell !== ".") { ctx.fillStyle = palette[cell] || "#fff"; ctx.fillRect(x,y,1,1); }
  }));
  return canvas;
}

function save() {
  try { localStorage.setItem(SAVE, JSON.stringify(data)); }
  catch(e) { console.warn("No se pudo guardar.", e); }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE));
    if (!saved) return;
    data.coins = Number.isFinite(saved.coins) ? saved.coins : 1000;
    data.wins = Number.isFinite(saved.wins) ? saved.wins : 0;
    data.games = Number.isFinite(saved.games) ? saved.games : 0;
    data.skills = Array.isArray(saved.skills) ? saved.skills : [];
    data.inventory = saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {};
    data.activePower = saved.activePower && typeof saved.activePower === "object" ? saved.activePower : null;
    data.shopRemaining = Number.isFinite(saved.shopRemaining) ? saved.shopRemaining : SHOP_SECONDS;
    data.shopStock = Array.isArray(saved.shopStock) ? saved.shopStock : [];
    if (data.activePower && (!Number.isFinite(data.activePower.remaining) || data.activePower.remaining <= 0)) data.activePower = null;
  } catch(e) { console.warn("Se inició una partida nueva.", e); }
  if (!data.shopStock.length) rotateShop(false);
}

function hasSkill(id) { return data.skills.includes(id); }
function inventoryCount(id) { return Math.max(0, Number(data.inventory[id]) || 0); }
function activeItem() { return data.activePower ? catalog.find(x => x.id === data.activePower.id) : null; }
function hasActive(id) { return !!data.activePower && data.activePower.id === id && data.activePower.remaining > 0; }

function cost(type) {
  let discount = hasSkill("discount") ? .25 : 0;
  if (hasActive("saver")) discount += .10;
  if (hasActive("coupon")) discount += .20;
  return Math.max(1, Math.ceil(costs[type] * (1 - Math.min(.75, discount))));
}
function multiplier() {
  let value = hasSkill("triple") ? 3 : hasSkill("double") ? 2 : 1;
  if (hasActive("fortune")) value *= 1.10;
  if (hasActive("royal")) value *= 1.15;
  if (hasActive("lucky")) value *= 1.25;
  return value;
}
function isFast() { return hasSkill("speed") || hasActive("turbo") || hasActive("overdrive"); }

function update() {
  ["coins","gameCoins","statCoins"].forEach(id => { if ($(id)) $(id).textContent = data.coins; });
  $("statWins").textContent = data.wins;
  $("statGames").textContent = data.games;
  $("shopButton").textContent = hasSkill("shop") ? "TIENDA PIXEL" : "🔒 TIENDA";
  updatePowerHud();
  $("shopTimer").textContent = formatTime(data.shopRemaining);
}
function formatTime(seconds) {
  seconds = Math.max(0, Math.ceil(seconds || 0));
  return String(Math.floor(seconds/60)).padStart(2,"0") + ":" + String(seconds%60).padStart(2,"0");
}
function updatePowerHud() {
  const item = activeItem();
  const hud = $("powerHud");
  if (!hud) return;
  if (item && data.activePower.remaining > 0) {
    hud.classList.add("active");
    $("activePowerText").textContent = item.name.toUpperCase();
    $("activePowerTime").textContent = formatTime(data.activePower.remaining);
    $("usePower").textContent = "OBJETO ACTIVO";
    $("usePower").disabled = true;
  } else {
    hud.classList.remove("active");
    $("activePowerText").textContent = "SIN OBJETO ACTIVO";
    $("activePowerTime").textContent = "--:--";
    $("usePower").textContent = "USAR OBJETO";
    $("usePower").disabled = false;
  }
}

function animateCoinGain(oldCoins, newCoins) {
  const screen = document.querySelector(".screen:not(.hidden)");
  const target = screen?.querySelector(".coins");
  const counter = target?.querySelector("b");

  if (!target || !counter) return;

  const source = screen.querySelector(
    "#slotResult, #scratchResult, #rushResult"
  );

  const start = source
    ? source.getBoundingClientRect()
    : target.getBoundingClientRect();

  const end = target.getBoundingClientRect();

  const startX = start.left + start.width / 2;
  const startY = start.top + start.height / 2;
  const endX = end.left + end.width / 2;
  const endY = end.top + end.height / 2;

  // Monedas voladoras
  for (let i = 0; i < 9; i++) {
    const coin = document.createElement("span");
    coin.className = "jw-flying-coin";
    coin.textContent = "🪙";

    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 55;

    coin.style.left = startX + offsetX + "px";
    coin.style.top = startY + offsetY + "px";

    document.body.appendChild(coin);

    const animation = coin.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${endX - startX - offsetX}px, ${endY - startY - offsetY}px) scale(.35)`,
        opacity: 0
      }
    ], {
      duration: 750 + i * 45,
      delay: i * 35,
      easing: "cubic-bezier(.2,.8,.3,1)"
    });

    animation.onfinish = () => coin.remove();
  }

  // Contador que aumenta rápidamente
  const duration = 850;
  const startTime = performance.now();

  function countUp(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);

    counter.textContent = Math.round(
      oldCoins + (newCoins - oldCoins) * eased
    );

    if (progress < 1) {
      requestAnimationFrame(countUp);
    } else {
      counter.textContent = newCoins;
    }
  }

  requestAnimationFrame(countUp);

  // Temblor al recibir las fichas
  target.classList.remove("coin-impact");
  void target.offsetWidth;
  target.classList.add("coin-impact");

  setTimeout(() => {
    target.classList.remove("coin-impact");
  }, 650);
}

function reward(amount) {
  const oldCoins = data.coins;
  const won = Math.round(amount * multiplier());

  data.coins += won;
  data.wins++;

  save();
  update();

  animateCoinGain(oldCoins, data.coins);

  return won;
}

function charge(type) {
  const price = cost(type);
  if (data.coins < price) { alert("No tenés fichas suficientes."); return false; }
  data.coins -= price; data.games++;
  save(); update();
  return true;
}

function startSessionClock() {
  sessionActive = true;
  if (clock) clearInterval(clock);
  clock = setInterval(() => {
    if (!sessionActive || document.hidden) return;
    if (data.activePower) {
      data.activePower.remaining--;
      if (data.activePower.remaining <= 0) {
        data.activePower = null;
        if ($("activePowerText")) $("activePowerText").textContent = "OBJETO AGOTADO";
      }
    }
    data.shopRemaining--;
    if (data.shopRemaining <= 0) rotateShop(true);
    update();
    save();
  }, 1000);
}
function stopSessionClock() {
  sessionActive = false;
  if (clock) { clearInterval(clock); clock = null; }
  save();
}
function rotateShop(announce) {
  const pool = [...catalog];
  const chosen = [];
  while (chosen.length < Math.min(4,pool.length)) {
    const index = Math.floor(Math.random()*pool.length);
    chosen.push(pool.splice(index,1)[0].id);
  }
  data.shopStock = chosen;
  data.shopRemaining = SHOP_SECONDS;
  save();
  if ($("shopList") && !$("shopPage").classList.contains("hidden")) renderShop();
  if (announce && !$("shopPage").classList.contains("hidden")) {
    $("shopList").insertAdjacentHTML("afterbegin", '<p class="rotation-message">¡LA TIENDA SE ACTUALIZÓ!</p>');
  }
}
function showScreen(id) {
  stopBusy();
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $(id).classList.remove("hidden");
  if (id === "intro") stopSessionClock();
  else startSessionClock();
  update();
}
function stopBusy() {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
  busy = false;
  if ($("spin")) $("spin").disabled = false;
  if ($("rushReel")) { $("rushReel").disabled = false; $("rushReel").classList.remove("rolling"); }
  if ($("slotGame")) $("slotGame").querySelector(".slot-machine").classList.remove("spinning");
}
function back() {
  $("jokerModal").classList.add("hidden");
  $("useModal").classList.add("hidden");
  showScreen("menu");
}

function openGame(name) {
  showScreen("game");
  currentGame = name;
  ["slotGame","scratchGame","rushGame"].forEach(id => $(id).classList.add("hidden"));
  const titles = {slot:"JOKER SLOTS",scratch:"SCRATCH PIXEL",rush:"PIXEL RUSH"};
  const panels = {slot:"slotGame",scratch:"scratchGame",rush:"rushGame"};
  $("gameTitle").textContent = titles[name];
  $(panels[name]).classList.remove("hidden");
  if (name === "scratch") {
    if (!charge("scratch")) { showScreen("menu"); return; }
    createScratch();
  }
}

/* Activar objetos: el contador empieza al usarlos en una máquina. */
function openUseModal() {
  if (!currentGame) { alert("Primero entrá en una maquinita."); return; }
  if (data.activePower) { alert("Ya tenés un objeto activo."); return; }
  const list = $("useList");
  list.innerHTML = "";
  const owned = catalog.filter(item => inventoryCount(item.id) > 0);
  if (!owned.length) {
    list.textContent = "NO TENÉS OBJETOS. COMPRALOS EN LA TIENDA.";
  } else {
    owned.forEach(item => {
      const row = document.createElement("div");
      row.className = "use-option";
      const label = document.createElement("span");
      label.textContent = item.name + " x" + inventoryCount(item.id);
      const btn = document.createElement("button");
      btn.textContent = "ACTIVAR";
      btn.addEventListener("click", () => activateItem(item.id));
      row.append(spriteCanvas(item.sprite,42),label,btn);
      list.appendChild(row);
    });
  }
  $("useModal").classList.remove("hidden");
}
function activateItem(id) {
  const item = catalog.find(x => x.id === id);
  if (!item || inventoryCount(id) <= 0 || data.activePower) return;
  data.inventory[id] = inventoryCount(id) - 1;
  data.activePower = {id, remaining:POWER_SECONDS};
  $("useModal").classList.add("hidden");
  save(); update(); renderShop();
}

/* JOKER SLOTS */
function spin() {
  if (busy || !charge("slot")) return;
  busy = true; $("spin").disabled = true;
  const machine = $("slotGame").querySelector(".slot-machine");
  const reels = document.querySelectorAll(".reel");
  machine.classList.add("spinning");
  let count = 0;
  spinTimer = setInterval(() => {
    reels.forEach(reel => reel.textContent = symbols[Math.floor(Math.random()*symbols.length)]);
    count++;
    if (count >= 18) {
      clearInterval(spinTimer); spinTimer = null;
      let result;
      if (Math.random() < .35) {
        const s = symbols[Math.floor(Math.random()*symbols.length)];
        result = [s,s,s];
      } else {
        result = Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]);
        if (result[0] === result[1] && result[1] === result[2]) result[2] = symbols[(symbols.indexOf(result[2])+1)%symbols.length];
      }
      reels.forEach((reel,i)=>reel.textContent=result[i]);
      if (result[0]===result[1] && result[1]===result[2]) {
        const won=reward(200); $("slotResult").textContent="¡JACKPOT! +"+won+" FICHAS";
      } else $("slotResult").textContent="SIN PREMIO";
      machine.classList.remove("spinning"); busy=false; $("spin").disabled=false;
    }
  }, isFast()?45:100);
}

/* SCRATCH PIXEL */
function createScratch() {
  const scratchIcons = ["7","♦","$","★","C","J"];
  scratchSymbols = Array.from({length:3},()=>scratchIcons[Math.floor(Math.random()*scratchIcons.length)]);
  scratchDone=[false,false,false]; $("scratchGrid").innerHTML=""; $("scratchResult").textContent="¡RASPÁ LOS TRES CUADROS!";
  scratchSymbols.forEach((symbol,index)=>{
    const cell=document.createElement("div"); cell.className="scratch-cell";
    const revealed=document.createElement("div"); revealed.className="scratch-symbol"; revealed.textContent=symbol;
    const canvas=document.createElement("canvas"); cell.append(revealed,canvas); $("scratchGrid").appendChild(cell);
    const rect=cell.getBoundingClientRect(), ratio=window.devicePixelRatio||1;
    canvas.width=Math.max(1,Math.round(rect.width*ratio)); canvas.height=Math.max(1,Math.round(rect.height*ratio));
    const ctx=canvas.getContext("2d");
    if(!ctx){finishScratch(index,cell);return;}
    ctx.fillStyle="#aaa9b5";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#555";ctx.font=`bold ${12*ratio}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("RASPAR",canvas.width/2,canvas.height/2);
    let drawing=false,lastX=0,lastY=0,distance=0;
    const pos=e=>{const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*ratio,y:(e.clientY-b.top)*ratio};};
    const erase=(x1,y1,x2,y2)=>{ctx.globalCompositeOperation="destination-out";ctx.lineWidth=(hasSkill("scratch")?58:38)*ratio;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    const check=()=>{if(scratchDone[index])return;try{const px=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0,total=0;for(let i=3;i<px.length;i+=16){total++;if(px[i]<100)clear++;}if(clear/total>=.35)finishScratch(index,cell);}catch(e){if(distance>=canvas.width*2.5)finishScratch(index,cell);}};
    canvas.addEventListener("pointerdown",e=>{if(scratchDone[index])return;drawing=true;canvas.setPointerCapture(e.pointerId);const p=pos(e);lastX=p.x;lastY=p.y;erase(p.x,p.y,p.x+1,p.y+1);check();});
    canvas.addEventListener("pointermove",e=>{if(!drawing||scratchDone[index])return;const p=pos(e);erase(lastX,lastY,p.x,p.y);distance+=Math.hypot(p.x-lastX,p.y-lastY);lastX=p.x;lastY=p.y;if(distance>=canvas.width*2.5)finishScratch(index,cell);else if(distance%100<15)check();});
    ["pointerup","pointercancel"].forEach(ev=>canvas.addEventListener(ev,()=>{drawing=false;check();}));
  });
}
function finishScratch(index,cell){if(scratchDone[index])return;scratchDone[index]=true;cell.classList.add("scratched");checkScratch();}
function checkScratch(){
  const found=scratchDone.filter(Boolean).length;
  if(found<3){$("scratchResult").textContent=found+" DE 3 DESCUBIERTOS";return;}
  const [a,b,c]=scratchSymbols;
  if(a===b&&b===c){const won=reward(500);$("scratchResult").textContent="¡RASPADAZO! +"+won+" FICHAS";}
  else $("scratchResult").textContent="TARJETA COMPLETA · SIN PREMIO";
}
function newScratch(){if(busy)return;if(!charge("scratch"))return;createScratch();}

/* PIXEL RUSH */
function rush() {
  if(busy||!charge("rush"))return;
  busy=true;const reel=$("rushReel");reel.disabled=true;reel.classList.add("rolling");let count=0;
  spinTimer=setInterval(()=>{
    reel.textContent=symbols[Math.floor(Math.random()*symbols.length)];count++;
    if(count>=18){
      clearInterval(spinTimer);spinTimer=null;reel.classList.remove("rolling");
      const roll=Math.random()*100;let prize=roll<40?0:roll<70?5:roll<88?10:roll<98?20:50;
      if(prize>0){const won=reward(prize);$("rushResult").textContent="¡GANASTE! +"+won+" FICHAS";}
      else $("rushResult").textContent="SIN PREMIO · ¡PROBÁ OTRA VEZ!";
      busy=false;reel.disabled=false;
    }
  },isFast()?45:100);
}

/* ÁRBOL: TODAS LAS HABILIDADES SON PERMANENTES */
function renderSkills(){
  $("skillsList").innerHTML="";
  skills.forEach(skill=>{
    const owned=hasSkill(skill.id),locked=skill.id==="triple"&&!hasSkill("double");
    const card=document.createElement("div");card.className="item";
    card.appendChild(spriteCanvas(skill.sprite));
    const title=document.createElement("h3");title.textContent=skill.name;
    const desc=document.createElement("p");desc.textContent=skill.desc;
    const button=document.createElement("button");button.className="buy-button";
    button.textContent=owned?"COMPRADO · PERMANENTE":locked?"BLOQUEADO":skill.price+" FICHAS";
    button.disabled=owned||locked;button.addEventListener("click",()=>buySkill(skill.id));
    card.append(title,desc,button);$("skillsList").appendChild(card);
  });
}
function buySkill(id){
  const skill=skills.find(x=>x.id===id);if(!skill||hasSkill(id))return;
  if(id==="triple"&&!hasSkill("double")){alert("Primero comprá Premios x2.");return;}
  if(data.coins<skill.price){alert("No tenés fichas suficientes.");return;}
  data.coins-=skill.price;data.skills.push(id);save();update();renderSkills();
}

/* TIENDA ROTATIVA */
function renderShop(){
  $("shopList").innerHTML="";$("collection").innerHTML="";
  const stock=catalog.filter(item=>data.shopStock.includes(item.id));
  stock.forEach(item=>{
    const card=document.createElement("div");card.className="item";
    card.appendChild(spriteCanvas(item.sprite));
    const title=document.createElement("h3");title.textContent=item.name;
    const desc=document.createElement("p");desc.textContent=item.desc;
    const price=document.createElement("p");price.textContent=item.price+" FICHAS";
    const info=document.createElement("button");info.className="buy-button";info.textContent="VER INFORMACIÓN";info.addEventListener("click",()=>showItem(item));
    const buy=document.createElement("button");buy.className="buy-button";buy.textContent="COMPRAR";
    buy.addEventListener("click",()=>buyItem(item.id));
    card.append(title,desc,price,info,buy);$("shopList").appendChild(card);
  });
  if(!stock.length)$("shopList").textContent="LA TIENDA SE ESTÁ PREPARANDO...";
  catalog.forEach(item=>{
    const count=inventoryCount(item.id);if(!count)return;
    const card=document.createElement("div");card.className="item";
    card.appendChild(spriteCanvas(item.sprite));
    const title=document.createElement("h3");title.textContent=item.name;
    const countText=document.createElement("p");countText.textContent="CANTIDAD: "+count;
    card.append(title,countText);$("collection").appendChild(card);
  });
  if(!$("collection").children.length)$("collection").textContent="TODAVÍA NO TENÉS OBJETOS.";
  $("shopTimer").textContent=formatTime(data.shopRemaining);
}
function showItem(item){
  selectedItem=item.id;$("modalSprite").innerHTML="";$("modalSprite").appendChild(spriteCanvas(item.sprite,80));
  $("jokerName").textContent=item.name;$("jokerDescription").textContent=item.desc;
  $("buyJoker").textContent="COMPRAR · "+item.price+" FICHAS";$("buyJoker").disabled=false;
  $("jokerModal").classList.remove("hidden");
}
function buyItem(id){
  const item=catalog.find(x=>x.id===id);if(!item||!data.shopStock.includes(id))return;
  if(data.coins<item.price){alert("No tenés fichas suficientes.");return;}
  data.coins-=item.price;data.inventory[id]=inventoryCount(id)+1;
  save();update();renderShop();
  $("jokerModal").classList.add("hidden");
}

/* EVENTOS */
function init(){
  load();update();
  $("play").addEventListener("click",()=>showScreen("menu"));
  $("backMenu").addEventListener("click",back);
  document.querySelectorAll(".back").forEach(b=>b.addEventListener("click",back));
  document.querySelectorAll("[data-game]").forEach(b=>b.addEventListener("click",()=>openGame(b.dataset.game)));
  $("spin").addEventListener("click",spin);$("newScratch").addEventListener("click",newScratch);$("rushReel").addEventListener("click",rush);
  $("skillsButton").addEventListener("click",()=>{renderSkills();showScreen("skillsPage");});
  $("shopButton").addEventListener("click",()=>{if(!hasSkill("shop")){alert("Primero desbloqueá la tienda en habilidades.");return;}renderShop();showScreen("shopPage");});
  $("statsButton").addEventListener("click",()=>showScreen("statsPage"));
  $("closeModal").addEventListener("click",()=>$("jokerModal").classList.add("hidden"));
  $("buyJoker").addEventListener("click",()=>{if(selectedItem)buyItem(selectedItem);});
  $("usePower").addEventListener("click",openUseModal);
  $("closeUseModal").addEventListener("click",()=>$("useModal").classList.add("hidden"));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)update();});
  showScreen("intro");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
