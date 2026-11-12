/* JOKER WORLDS EXPANSION - árboles independientes, 5 niveles y ranking online */
(() => {
  "use strict";

  const SUPABASE_URL = "https://hqkzhtxvwooyuowcfvcf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_sQsCdLJILYuPsSagN19CYw_UO8zQplO";
  const EXT_SAVE = "joker_worlds_expansion_v1";
  const $x = id => document.getElementById(id);
  const odds = [0.25, 0.18, 0.12, 0.08, 0.05];
  const levelCosts = [0, 300, 900, 1800, 3000];
  const labels = {slot:"JOKER SLOTS",scratch:"SCRATCH PIXEL",rush:"PIXEL RUSH"};
  const basePrizes = {slot:200,scratch:500,rush:50};
  const topPrizes = {slot:[200,500,1200,1800,2500],scratch:[500,1200,3000,4500,6000],rush:[50,100,250,400,600]};

  const machineUpgradeDefs = {
    slot:[
      {id:"luck",name:"Ajuste de suerte",desc:"Aumenta 3 puntos porcentuales la posibilidad de premio.",price:500},
      {id:"reward",name:"Premios reforzados",desc:"Aumenta un 25% las fichas ganadas.",price:450},
      {id:"discount",name:"Entrada económica",desc:"Reduce un 20% el costo de jugar.",price:350}
    ],
    scratch:[
      {id:"luck",name:"Papel de la suerte",desc:"Aumenta 2 puntos porcentuales la posibilidad de premio.",price:500},
      {id:"reward",name:"Premio reforzado",desc:"Aumenta un 25% las fichas ganadas.",price:450},
      {id:"discount",name:"Tarjeta económica",desc:"Reduce un 20% el costo de cada tarjeta.",price:350}
    ],
    rush:[
      {id:"luck",name:"Rodillo afortunado",desc:"Aumenta 2 puntos porcentuales la posibilidad de premio.",price:500},
      {id:"reward",name:"Premio reforzado",desc:"Aumenta un 25% las fichas ganadas.",price:450},
      {id:"discount",name:"Partida económica",desc:"Reduce un 20% el costo de jugar.",price:350}
    ]
  };

  const ext = {
    machineTiers:{slot:1,scratch:1,rush:1},
    machineSelected:{slot:1,scratch:1,rush:1},
    machineUpgrades:{slot:[],scratch:[],rush:[]},
    nextSpinMultiplier:1,pendingSpinMultiplier:1,playerId:"",username:""
  };

  function readExt(){
    try{
      const s=JSON.parse(localStorage.getItem(EXT_SAVE)||"{}");
      if(s.machineTiers) ext.machineTiers={...ext.machineTiers,...s.machineTiers};
      if(s.machineSelected) ext.machineSelected={...ext.machineSelected,...s.machineSelected};
      if(s.machineUpgrades) ext.machineUpgrades={...ext.machineUpgrades,...s.machineUpgrades};
      ext.nextSpinMultiplier=[1,2,5,10].includes(s.nextSpinMultiplier)?s.nextSpinMultiplier:1;
      ext.playerId=s.playerId||localStorage.getItem("joker_worlds_player_id")||"";
      ext.username=s.username||localStorage.getItem("joker_worlds_username")||"";
    }catch(e){}
    ["slot","scratch","rush"].forEach(t=>{
      ext.machineTiers[t]=Math.max(1,Math.min(5,Number(ext.machineTiers[t])||1));
      ext.machineSelected[t]=Math.max(1,Math.min(ext.machineTiers[t],Number(ext.machineSelected[t])||1));
      if(!Array.isArray(ext.machineUpgrades[t])) ext.machineUpgrades[t]=[];
    });
    if(!ext.playerId){ext.playerId="jw_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(36).slice(2));localStorage.setItem("joker_worlds_player_id",ext.playerId);}
    if(!ext.username)ext.username="Jugador"+Math.floor(1000+Math.random()*9000);
    localStorage.setItem("joker_worlds_username",ext.username);saveExt();
  }
  function saveExt(){try{localStorage.setItem(EXT_SAVE,JSON.stringify(ext));}catch(e){}}
  function tier(type){return ext.machineSelected[type]||1;}
  function chance(type){const base=odds[tier(type)-1]||odds[0];const bonus=hasUpgrade(type,"luck")?(type==="slot"?.03:.02):0;return Math.min(.95,base+bonus);}
  function hasUpgrade(type,id){return (ext.machineUpgrades[type]||[]).includes(id);}
  function prizeFor(type){return topPrizes[type][tier(type)-1]||basePrizes[type];}
  function beginMultiplier(){ext.pendingSpinMultiplier=ext.nextSpinMultiplier||1;ext.nextSpinMultiplier=1;saveExt();}

  /* Ranking Supabase: usa únicamente la clave publishable en el navegador. */
  let sb=null,syncTimer=null,lastSentCoins=null;
  function connectSupabase(){
    if(window.supabase?.createClient){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);refreshLeaderboard();scheduleSync(true);}
    else if($x("leaderboardStatus"))$x("leaderboardStatus").textContent="No se pudo cargar la conexión online. Revisá internet y recargá.";
  }
  function scheduleSync(force=false){if(!sb)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncScore(force),force?400:5000);}
  async function syncScore(force=false){
    if(!sb || typeof data === "undefined")return;
    const coins=Number(data.coins)||0;if(!force&&coins===lastSentCoins)return;
    const row={player_id:ext.playerId,username:ext.username.slice(0,18),coins,updated_at:new Date().toISOString()};
    const {error}=await sb.from("leaderboard").upsert(row,{onConflict:"player_id"});
    if(error){if($x("leaderboardStatus"))$x("leaderboardStatus").textContent="No se pudo actualizar el ranking: "+error.message;return;}
    lastSentCoins=coins;if($x("leaderboardStatus"))$x("leaderboardStatus").textContent="Puntuación sincronizada · "+new Date().toLocaleTimeString();refreshLeaderboard();
  }
  async function refreshLeaderboard(){
    if(!sb)return;
    const {data:rows,error}=await sb.from("leaderboard").select("username,coins,updated_at").order("coins",{ascending:false}).limit(50);
    const list=$x("leaderboardList"),status=$x("leaderboardStatus");
    if(error){if(status)status.textContent="Error al cargar el ranking: "+error.message;return;}
    if(!list)return;list.innerHTML="";
    (rows||[]).forEach((row,i)=>{const item=document.createElement("div");item.className="rank-row"+(i<3?" rank-top":"");const pos=document.createElement("b");pos.textContent="#"+(i+1);const name=document.createElement("span");name.textContent=row.username||"Jugador";const score=document.createElement("strong");score.textContent=(Number(row.coins)||0).toLocaleString("es-AR")+" F";item.append(pos,name,score);list.appendChild(item);});
    if(!rows?.length)list.textContent="TODAVÍA NO HAY PUNTUACIONES.";
    if(status&&!status.textContent.startsWith("Puntuación sincronizada"))status.textContent="Ranking mundial · "+(rows?.length||0)+" jugadores";
  }
  function addLeaderboardPage(){
    const menu=document.querySelector("#menu .menu-nav");
    if(menu&&!$x("leaderboardButton")){const b=document.createElement("button");b.id="leaderboardButton";b.textContent="CLASIFICACIÓN";menu.appendChild(b);b.addEventListener("click",openLeaderboard);}
    if($x("leaderboardPage"))return;
    const page=document.createElement("section");page.id="leaderboardPage";page.className="screen hidden";
    page.innerHTML=`<button class="back pixel-button">← VOLVER</button><div class="arcade-title"><h2>CLASIFICACIÓN MUNDIAL</h2><p>LOS JUGADORES CON MÁS FICHAS</p></div><div class="leaderboard-profile"><label for="leaderboardName">TU NOMBRE</label><input id="leaderboardName" maxlength="18" autocomplete="nickname"><button id="saveLeaderboardName" class="pixel-button gold">GUARDAR NOMBRE</button></div><p id="leaderboardStatus" class="leaderboard-status">Conectando...</p><div id="leaderboardList" class="leaderboard-list"></div><button id="refreshLeaderboard" class="pixel-button">ACTUALIZAR RANKING</button><p class="leaderboard-note">Las fichas se guardan en este dispositivo. El ranking online es amistoso y no tiene validación antitrampas.</p>`;
    document.body.appendChild(page);page.querySelector(".back").addEventListener("click",()=>showScreen("menu"));
    $x("leaderboardName").value=ext.username;
    $x("saveLeaderboardName").addEventListener("click",()=>{const value=$x("leaderboardName").value.trim().replace(/\s+/g," ").slice(0,18);if(!value){alert("Escribí un nombre.");return;}ext.username=value;localStorage.setItem("joker_worlds_username",value);saveExt();scheduleSync(true);});
    $x("refreshLeaderboard").addEventListener("click",refreshLeaderboard);
  }
  function openLeaderboard(){addLeaderboardPage();showScreen("leaderboardPage");refreshLeaderboard();}

  /* Árboles propios: cada máquina tiene botón debajo de su gabinete. */
  function addMachineTreeButtons(){
    const room=document.querySelector(".arcade-room");if(!room)return;
    room.querySelectorAll(".cabinet[data-game]").forEach(cab=>{
      const type=cab.dataset.game;if(!labels[type]||cab.dataset.treeWrapped==="1")return;
      cab.dataset.treeWrapped="1";
      const wrap=document.createElement("div");wrap.className="cabinet-unit";
      cab.parentNode.insertBefore(wrap,cab);wrap.appendChild(cab);
      const b=document.createElement("button");b.className="machine-tree-open";b.textContent="ÁRBOL DE MEJORAS";b.addEventListener("click",()=>openMachineTree(type));wrap.appendChild(b);
    });
  }
  function addMachineTreePage(){
    if($x("machineTreePage"))return;
    const page=document.createElement("section");page.id="machineTreePage";page.className="screen hidden";
    page.innerHTML='<button id="machineTreeBack" class="back pixel-button">← VOLVER</button><div class="arcade-title"><h2 id="machineTreeTitle">ÁRBOL DE MÁQUINA</h2><p>PROGRESO PERMANENTE E INDEPENDIENTE</p></div><div id="machineTreeContent" class="machine-tree-content"></div>';
    document.body.appendChild(page);$x("machineTreeBack").addEventListener("click",()=>showScreen("menu"));
  }
  function openMachineTree(type){addMachineTreePage();renderMachineTree(type);showScreen("machineTreePage");}
  function renderMachineTree(type){
    const host=$x("machineTreeContent");if(!host)return;host.innerHTML="";$x("machineTreeTitle").textContent=labels[type]+" · ÁRBOL";
    const current=ext.machineTiers[type];
    const intro=document.createElement("div");intro.className="machine-tree-summary";intro.innerHTML=`<b>NIVEL ACTUAL: ${current}/5</b><span>Probabilidad base del nivel: ${Math.round(odds[current-1]*100)}%</span><small>Las mejoras se guardan y no caducan.</small>`;host.appendChild(intro);
    const levels=document.createElement("div");levels.className="machine-level-grid";
    odds.forEach((prob,i)=>{
      const n=i+1,unlocked=n<=current,card=document.createElement("article");card.className="machine-level-card"+(n===current?" current":"")+(unlocked?" unlocked":"");
      const tag=document.createElement("span");tag.className="level-tag";tag.textContent=unlocked?(n===current?"NIVEL ACTUAL":"DESBLOQUEADO"):"BLOQUEADO";
      const h=document.createElement("h3");h.textContent="NIVEL "+n;
      const p=document.createElement("strong");p.className="level-odds";p.textContent=Math.round(prob*100)+"%";
      const desc=document.createElement("p");desc.textContent="Probabilidad base de premio";
      const prize=document.createElement("small");prize.textContent="Premio máximo: "+prizeForLevel(type,n).toLocaleString("es-AR")+" F";
      const btn=document.createElement("button");btn.className="buy-button";
      if(unlocked){btn.textContent=n===current?"SELECCIONADO":"USAR ESTE NIVEL";btn.disabled=n===current;btn.addEventListener("click",()=>{ext.machineSelected[type]=n;saveExt();renderMachineTree(type);});}
      else{btn.textContent="DESBLOQUEAR · "+levelCosts[i].toLocaleString("es-AR")+" F";btn.disabled=n!==current+1;btn.addEventListener("click",()=>{if(data.coins<levelCosts[i]){alert("No tenés fichas suficientes.");return;}data.coins-=levelCosts[i];ext.machineTiers[type]=n;ext.machineSelected[type]=n;saveExt();save();update();renderMachineTree(type);});}
      card.append(tag,h,p,desc,prize,btn);levels.appendChild(card);
    });
    host.appendChild(levels);
    const upgradesTitle=document.createElement("div");upgradesTitle.className="arcade-title";upgradesTitle.innerHTML="<h2>MEJORAS ESPECIALES</h2><p>SOLO AFECTAN A ESTA MÁQUINA</p>";host.appendChild(upgradesTitle);
    const upgrades=document.createElement("div");upgrades.className="machine-upgrade-grid";
    machineUpgradeDefs[type].forEach(up=>{const owned=hasUpgrade(type,up.id),card=document.createElement("article");card.className="machine-upgrade-card";const h=document.createElement("h3");h.textContent=up.name;const p=document.createElement("p");p.textContent=up.desc;const b=document.createElement("button");b.className="buy-button";b.textContent=owned?"COMPRADO · PERMANENTE":up.price+" FICHAS";b.disabled=owned;b.addEventListener("click",()=>{if(data.coins<up.price){alert("No tenés fichas suficientes.");return;}data.coins-=up.price;ext.machineUpgrades[type].push(up.id);saveExt();save();update();renderMachineTree(type);});card.append(h,p,b);upgrades.appendChild(card);});
    host.appendChild(upgrades);
  }
  function prizeForLevel(type,n){return topPrizes[type][n-1];}

  function addMultiplierItems(){
    const items=[
      {id:"spin2",name:"Joker Multiplicador ×2",price:200,desc:"Multiplica por 2 el premio de tu próxima jugada. Se consume incluso si no ganás.",sprite:"mult2",kind:"spinMultiplier",value:2},
      {id:"spin5",name:"Joker Multiplicador ×5",price:500,desc:"Multiplica por 5 el premio de tu próxima jugada. Se consume incluso si no ganás.",sprite:"mult5",kind:"spinMultiplier",value:5},
      {id:"spin10",name:"Joker Multiplicador ×10",price:1000,desc:"Multiplica por 10 el premio de tu próxima jugada. Se consume incluso si no ganás.",sprite:"mult10",kind:"spinMultiplier",value:10}
    ];
    items.forEach(it=>{if(!catalog.some(x=>x.id===it.id))catalog.push(it);});
    pixel.mult2=["........","..YY...."," .YYYY..".replace(" ",""),"..YY....","..YY....","..YY....",".YYYYY..","........"];
    pixel.mult5=["........","..GG....",".GGGG...","..GG....","..GG....","..GG....",".GGGGG..","........"];
    pixel.mult10=["........","..RR....",".RRRR...","..RR....","..RR....","..RR....",".RRRRR..","........"];
  }

  function installOverrides(){
    const oldSave=window.save;window.save=function(){oldSave();saveExt();scheduleSync(false);};
    const oldCost=window.cost;window.cost=function(type){let c=oldCost(type);if(hasUpgrade(type,"discount"))c=Math.max(1,Math.ceil(c*.8));c=Math.ceil(c*(1+(tier(type)-1)*.15));return c;};
    const oldCharge=window.charge;window.charge=function(type){const ok=oldCharge(type);if(ok)beginMultiplier();return ok;};
    const oldReward=window.reward;window.reward=function(amount){const type=currentGame||"slot";let adjusted=amount*(prizeFor(type)/basePrizes[type]);if(hasUpgrade(type,"reward"))adjusted*=1.25;adjusted*=ext.pendingSpinMultiplier||1;ext.pendingSpinMultiplier=1;saveExt();return oldReward(Math.round(adjusted));};
    const oldActivate=window.activateItem;window.activateItem=function(id){const item=catalog.find(x=>x.id===id);if(item?.kind==="spinMultiplier"){if((Number(data.inventory[id])||0)<=0||ext.nextSpinMultiplier!==1){alert("Ya tenés un multiplicador preparado o no tenés unidades.");return;}data.inventory[id]--;ext.nextSpinMultiplier=item.value;saveExt();$x("useModal").classList.add("hidden");save();update();renderShop();alert("Multiplicador ×"+item.value+" preparado para tu próxima jugada.");return;}oldActivate(id);};
    const oldOpenUse=window.openUseModal;window.openUseModal=function(){const list=$x("useList");list.innerHTML="";const owned=catalog.filter(item=>(Number(data.inventory[item.id])||0)>0);if(!owned.length)list.textContent="NO TENÉS OBJETOS. COMPRALOS EN LA TIENDA.";owned.forEach(item=>{const row=document.createElement("div");row.className="use-option";const label=document.createElement("span");label.textContent=item.name+" x"+(Number(data.inventory[item.id])||0);const btn=document.createElement("button");btn.textContent=item.kind==="spinMultiplier"?"PREPARAR":"ACTIVAR";btn.addEventListener("click",()=>window.activateItem(item.id));row.append(spriteCanvas(item.sprite,42),label,btn);list.appendChild(row);});$x("useModal").classList.remove("hidden");};
    const oldShow=window.showScreen;window.showScreen=function(id){oldShow(id);if(id==="menu")addMachineTreeButtons();if(id==="machineTreePage"){};};
    const oldCheckScratch=window.checkScratch;window.checkScratch=function(){oldCheckScratch();if(scratchDone.filter(Boolean).length===3){const [a,b,c]=scratchSymbols;if(!(a===b&&b===c)){ext.pendingSpinMultiplier=1;saveExt();}}};
    const oldBuyItem=window.buyItem;window.buyItem=function(id){oldBuyItem(id);scheduleSync(true);};
    const oldBuySkill=window.buySkill;window.buySkill=function(id){oldBuySkill(id);scheduleSync(true);};
  }

  function replaceGames(){
    window.spin=function(){
      if(busy||!charge("slot"))return;busy=true;$x("spin").disabled=true;const machine=$x("slotGame").querySelector(".slot-machine"),reels=document.querySelectorAll(".reel");machine.classList.add("spinning");let count=0;
      spinTimer=setInterval(()=>{reels.forEach(r=>r.textContent=symbols[Math.floor(Math.random()*symbols.length)]);if(++count<18)return;clearInterval(spinTimer);spinTimer=null;let result;if(Math.random()<chance("slot")){const s=symbols[Math.floor(Math.random()*symbols.length)];result=[s,s,s];}else{result=Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]);if(result[0]===result[1]&&result[1]===result[2])result[2]=symbols[(symbols.indexOf(result[2])+1)%symbols.length];}reels.forEach((r,i)=>r.textContent=result[i]);if(result[0]===result[1]&&result[1]===result[2]){$x("slotResult").textContent="¡JACKPOT! +"+reward(basePrizes.slot)+" FICHAS";}else{$x("slotResult").textContent="SIN PREMIO";ext.pendingSpinMultiplier=1;saveExt();}machine.classList.remove("spinning");busy=false;$x("spin").disabled=false;},isFast()?45:100);
    };
    window.createScratch=function(){
      const icons=["7","♦","$","★","C","J","♣","●","◆","♥"];const pool=icons.slice(0,Math.min(icons.length,5+tier("scratch")));const match=Math.random()<chance("scratch");scratchSymbols=match?[pool[0],pool[0],pool[0]]:Array.from({length:3},()=>pool[Math.floor(Math.random()*pool.length)]);if(!match&&scratchSymbols[0]===scratchSymbols[1]&&scratchSymbols[1]===scratchSymbols[2])scratchSymbols[2]=pool[(pool.indexOf(scratchSymbols[2])+1)%pool.length];
      scratchDone=[false,false,false];$x("scratchGrid").innerHTML="";$x("scratchResult").textContent="¡RASPÁ LOS TRES CUADROS!";
      scratchSymbols.forEach((symbol,index)=>{const cell=document.createElement("div");cell.className="scratch-cell";const revealed=document.createElement("div");revealed.className="scratch-symbol";revealed.textContent=symbol;const canvas=document.createElement("canvas");cell.append(revealed,canvas);$x("scratchGrid").appendChild(cell);const rect=cell.getBoundingClientRect(),ratio=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));const ctx=canvas.getContext("2d");if(!ctx){finishScratch(index,cell);return;}ctx.fillStyle="#aaa9b5";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#555";ctx.font=`bold ${12*ratio}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("RASPAR",canvas.width/2,canvas.height/2);let drawing=false,lastX=0,lastY=0,distance=0;const pos=e=>{const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*ratio,y:(e.clientY-b.top)*ratio};};const erase=(x1,y1,x2,y2)=>{ctx.globalCompositeOperation="destination-out";ctx.lineWidth=(hasSkill("scratch")?58:38)*ratio;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};const check=()=>{if(scratchDone[index])return;try{const px=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0,total=0;for(let i=3;i<px.length;i+=16){total++;if(px[i]<100)clear++;}if(clear/total>=.35)finishScratch(index,cell);}catch(e){if(distance>=canvas.width*2.5)finishScratch(index,cell);}};canvas.addEventListener("pointerdown",e=>{if(scratchDone[index])return;drawing=true;canvas.setPointerCapture(e.pointerId);const p=pos(e);lastX=p.x;lastY=p.y;erase(p.x,p.y,p.x+1,p.y+1);check();});canvas.addEventListener("pointermove",e=>{if(!drawing||scratchDone[index])return;const p=pos(e);erase(lastX,lastY,p.x,p.y);distance+=Math.hypot(p.x-lastX,p.y-lastY);lastX=p.x;lastY=p.y;if(distance>=canvas.width*2.5)finishScratch(index,cell);else if(distance%100<15)check();});["pointerup","pointercancel"].forEach(ev=>canvas.addEventListener(ev,()=>{drawing=false;check();}));});
    };
    window.rush=function(){
      if(busy||!charge("rush"))return;busy=true;const reel=$x("rushReel");reel.disabled=true;reel.classList.add("rolling");let count=0;spinTimer=setInterval(()=>{reel.textContent=symbols[Math.floor(Math.random()*symbols.length)];if(++count<18)return;clearInterval(spinTimer);spinTimer=null;reel.classList.remove("rolling");let prize=0;if(Math.random()<chance("rush"))prize=prizeFor("rush");if(prize>0)$x("rushResult").textContent="¡GANASTE! +"+reward(basePrizes.rush)+" FICHAS";else{$x("rushResult").textContent="SIN PREMIO · ¡PROBÁ OTRA VEZ!";ext.pendingSpinMultiplier=1;saveExt();}busy=false;reel.disabled=false;},isFast()?45:100);
    };
    const spinBtn=$x("spin");if(spinBtn){const fresh=spinBtn.cloneNode(true);spinBtn.replaceWith(fresh);fresh.addEventListener("click",window.spin);}const rushBtn=$x("rushReel");if(rushBtn){const fresh=rushBtn.cloneNode(true);rushBtn.replaceWith(fresh);fresh.addEventListener("click",window.rush);}
  }

  function init(){
    readExt();addMultiplierItems();addLeaderboardPage();addMachineTreePage();installOverrides();replaceGames();addMachineTreeButtons();connectSupabase();
    // El botón de clasificación ya queda conectado al crearse la página.
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
