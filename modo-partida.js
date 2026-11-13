/* ==========================================
   JOKER WORLDS · MODO PARTIDA v2
   Rondas con objetivo + tienda de Jokers con
   disparadores y sinergias. Guardado propio
   (joker_worlds_run_v1): no toca guardados viejos
   ni el ranking de Supabase.
========================================== */
(() => {
  "use strict";

  const KEY = "joker_worlds_run_v1";
  const SPINS = 30, MAX = 15, SLOTS = 5;
  const JACK = [.20,.15,.10,.05,.03,.02,.01];
  const GOALS = [2000,4000,5500,8000,11500,16000,22000,30000,40000,54000,72000,95000,125000,165000,210000];
  const PAY = { "7":500, "J":400, "★":300, "$":250, "♦":200, "C":150 };
  const SYM = Object.keys(PAY);
  const $r = id => document.getElementById(id);
  const snd = n => { try { if (typeof window[n] === "function") window[n](); } catch (e) {} };
  const rnd = () => SYM[Math.floor(Math.random() * SYM.length)];

  /* ---------- JOKERS ----------
     fx(c, run) -> {add, mul}. Se aplican de izquierda a derecha:
     (fichas + add) × mul. El orden cambia el resultado. */
  const J = [
    { id:"sueldo",   n:"Sueldo",    d:"+20 fichas cada giro",              p:4, tags:[],       fx:() => ({ add:20 }) },
    { id:"banquero", n:"Banquero",  d:"Al superar una ronda: +$2",         p:6, tags:[] },
    { id:"parejaC",  n:"Pareja C",  d:"Par de C: +100 fichas",             p:5, tags:["par"],  fx:c => c.pair && c.sym==="C" && { add:100 } },
    { id:"parejaJ",  n:"Pareja J",  d:"Par de J: +130 fichas",             p:5, tags:["par"],  fx:c => c.pair && c.sym==="J" && { add:130 } },
    { id:"parejaD",  n:"Pareja ♦",  d:"Par de ♦: +90 fichas",              p:5, tags:["par"],  fx:c => c.pair && c.sym==="♦" && { add:90 } },
    { id:"caza7",    n:"Caza 7",    d:"+40 por cada 7 en pantalla",        p:5, tags:[],       fx:c => c.n("7")>0 && { add:40*c.n("7") } },
    { id:"dolar",    n:"Dólar",     d:"+30 por cada $ en pantalla",        p:4, tags:[],       fx:c => c.n("$")>0 && { add:30*c.n("$") } },
    { id:"variedad", n:"Variedad",  d:"3 símbolos distintos: +30 fichas",  p:4, tags:[],       fx:c => !c.pair && !c.triple && { add:30 } },
    { id:"optimista",n:"Optimista", d:"Si aún no hay fichas en el giro: +25", p:5, tags:[],    fx:c => c.chips===0 && { add:25 } },
    { id:"doblej",   n:"Doble J",   d:"Con una J en pantalla: ×1,3",       p:6, tags:[],       fx:c => c.n("J")>0 && { mul:1.3 } },
    { id:"siete2",   n:"Siete Doble",d:"Par de 7: ×2",                     p:8, tags:["par"],  fx:c => c.pair && c.sym==="7" && { mul:2 } },
    { id:"veterano", n:"Veterano",  d:"×(1 + 0,05 por ronda superada)",    p:7, tags:[],       fx:(c,run) => run.round>1 && { mul:1+0.05*(run.round-1) } },
    { id:"mazo",     n:"Mazo",      d:"×(1 + 0,03 por cada Joker que tengas)", p:8, tags:[],  fx:(c,run) => c.chips>0 && { mul:1+0.03*run.jokers.length } },
    { id:"cazad",    n:"Caza ♦",    d:"2 o más ♦: ×1,4",                   p:6, tags:[],       fx:c => c.n("♦")>=2 && { mul:1.4 } },
    { id:"tormenta", n:"Tormenta",  d:"Con 3+ premios seguidos: ×2",       p:8, tags:[],       fx:(c,run) => run.streak>=3 && { mul:2 } },
    { id:"iman",     n:"Imán",      d:"Par: +10 por cada Joker que tengas",p:6, tags:["par"],  fx:(c,run) => c.pair && { add:10*run.jokers.length } },
    { id:"casino",   n:"Casino",    d:"Cada 5.º giro: ×2",                 p:7, tags:[],       fx:(c,run) => (maxSp()-run.spins)%5===0 && { mul:2 } },
    { id:"prima",    n:"Prima",     d:"Primer giro de la ronda: +150",     p:5, tags:[],       fx:(c,run) => run.spins===maxSp()-1 && { add:150 } },
    { id:"semilla",  n:"Semilla",   d:"+3 por cada giro ya jugado en la ronda", p:5, tags:[],  fx:(c,run) => ({ add:3*(maxSp()-run.spins) }) },
    { id:"ruleta",   n:"Ruleta",    d:"Con premio: 25% de ×2,5",           p:7, tags:[],       fx:c => c.chips>0 && Math.random()<.25 && { mul:2.5 } },
    { id:"maestro",  n:"Maestro",   d:"Con 3+ Jokers de pares: ×1,5",      p:9, tags:[],       fx:(c,run) => c.chips>0 && run.jokers.filter(x=>x.tags.includes("par")).length>=3 && { mul:1.5 } },
    { id:"consuelo", n:"Consuelo",  d:"Par: +15 fichas",               p:4, tags:["par"],  fx:c => c.pair && { add:15 } },
    { id:"billetes", n:"Billetes",  d:"Par de $: +80 fichas",          p:5, tags:["par"],  fx:c => c.pair && c.sym==="$" && { add:80 } },
    { id:"pareja7",  n:"Pareja 7",  d:"Par de 7: +120 fichas",         p:6, tags:["par"],  fx:c => c.pair && c.sym==="7" && { add:120 } },
    { id:"estrella", n:"Estrella",  d:"2+ ★: +60 fichas",              p:4, tags:["par"],  fx:c => c.n("★")>=2 && { add:60 } },
    { id:"diamante", n:"Diamante",  d:"+25 por cada ♦",                p:4, tags:[],       fx:c => c.n("♦")>0 && { add:25*c.n("♦") } },
    { id:"dorado",   n:"Dorado",    d:"Trío: +150 fichas",             p:5, tags:["trio"], fx:c => c.triple && { add:150 } },
    { id:"siete",    n:"Siete",     d:"777: fichas ×1,5",              p:7, tags:["trio"], fx:c => c.triple && c.sym==="7" && { mul:1.5 } },
    { id:"espejo",   n:"Espejo",    d:"Extremos iguales: ×1,5",        p:6, tags:[],       fx:c => c.r[0]===c.r[2] && !c.triple && { mul:1.5 } },
    { id:"racha",    n:"Racha",     d:"+0,2× por giro seguido con premio", p:7, tags:[],   fx:(c,run) => run.streak>0 && { mul:1+Math.min(3,0.2*run.streak) } },
    { id:"ultimo",   n:"Último",    d:"Último giro: ×2",               p:6, tags:[],       fx:c => c.last && { mul:2 } },
    { id:"gordo",    n:"Gordo",     d:"+10 por ronda superada",        p:5, tags:[],       fx:(c,run) => run.round>1 && { add:10*(run.round-1) } },
    { id:"cadena",   n:"Cadena",    d:"Par: ×1,25 por cada Joker de pares", p:8, tags:[], fx:(c,run) => c.pair && { mul:1+0.25*run.jokers.filter(j=>j.tags.includes("par")).length } },
    { id:"rey",      n:"Rey",       d:"Trío: ×1,5 por cada Joker de tríos", p:9, tags:[], fx:(c,run) => c.triple && { mul:1+0.5*run.jokers.filter(j=>j.tags.includes("trio")).length } },
    { id:"comodin",  n:"Comodín J", d:"La J copia al símbolo más repetido", p:7, tags:[], pre:r => {
        const o = r.filter(s => s !== "J"); if (o.length === 3) return;
        const t = o.length ? o[0] : "7"; for (let i = 0; i < 3; i++) if (r[i] === "J") r[i] = t; } },
    { id:"casi",     n:"Casi",      d:"Par: 25% de repetir el rodillo suelto", p:6, tags:["par"], pre:r => {
        for (let i = 0; i < 3; i++) { const a = (i+1)%3, b = (i+2)%3;
          if (r[a] === r[b] && r[i] !== r[a] && Math.random() < .25) { r[i] = r[a]; return; } } } }
  ];
  const RASPA = { id:"raspa", n:"Raspadito", d:"+4% de jackpot la próxima ronda (1 por tienda)", p:3, consumable:true };

  /* ---------- ESTADO ---------- */
  let meta = { jp:0, bestRound:0, runs:0, sp:0, tree:{}, claimed:{}, owned:["base"], theme:"base",
               q:{ spins:0, triples:0, sevens:0, pairs:0, bestCoins:0, maxJokers:0 } };
  let run = null, busy = false, view = "run";

  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) {
      ["jp","bestRound","runs","sp"].forEach(k => meta[k] = +s[k] || 0);
      ["tree","claimed","q"].forEach(k => { if (s[k] && typeof s[k] === "object") Object.assign(meta[k], s[k]); });
      if (Array.isArray(s.owned)) meta.owned = s.owned;
      if (typeof s.theme === "string") meta.theme = s.theme;
    }
  } catch (e) {}
  const lvl = id => meta.tree[id] || 0;
  const slots = () => SLOTS + lvl("slot");
  const maxSp = () => SPINS + lvl("spins");

  /* ---------- ÁRBOL PERMANENTE (Joker Points) ---------- */
  const TREE = [
    { id:"bank",  n:"Fondo inicial",   d:"+$3 al empezar cada partida",      max:5, c:[20,40,70,110,160] },
    { id:"spins", n:"Giros extra",     d:"+1 giro por ronda",                max:5, c:[40,80,140,220,320] },
    { id:"luck",  n:"Suerte de base",  d:"+1% de chance de trío",            max:5, c:[30,60,100,160,240] },
    { id:"prize", n:"Premios +5%",     d:"+5% a todas las fichas ganadas",   max:5, c:[30,60,100,160,240] },
    { id:"free",  n:"Cambio gratis",   d:"1 cambio de ofertas gratis por tienda", max:1, c:[80] }
  ];

  /* ---------- MISIONES (Style Points) ---------- */
  const QUESTS = [
    { id:"q1", n:"Completar 10 giros",        t:10,   v:() => meta.q.spins,     r:5 },
    { id:"q2", n:"Conseguir tres iguales",    t:1,    v:() => meta.q.triples,   r:5 },
    { id:"q3", n:"2.000 fichas en una ronda", t:2000, v:() => meta.q.bestCoins, r:10 },
    { id:"q4", n:"Terminar una partida",      t:1,    v:() => meta.runs,        r:5 },
    { id:"q5", n:"Superar 3 rondas",          t:3,    v:() => meta.bestRound,   r:10 },
    { id:"q6", n:"Conseguir un 777",          t:1,    v:() => meta.q.sevens,    r:15 },
    { id:"q7", n:"Tener 5 Jokers a la vez",   t:5,    v:() => meta.q.maxJokers, r:15 },
    { id:"q8", n:"Llegar a la ronda 6",       t:6,    v:() => meta.bestRound,   r:20 },
    { id:"q9", n:"Jugar 200 giros",           t:200,  v:() => meta.q.spins,     r:20 },
    { id:"q10",n:"Completar la ronda 15",     t:15,   v:() => meta.bestRound,   r:50 }
  ];
  const THEMES = [
    { id:"base", n:"Violeta",     c:"#9b4dff", cost:0 },
    { id:"neon", n:"Neón Rosa",   c:"#ff4dd2", cost:20 },
    { id:"ice",  n:"Hielo",       c:"#4dd2ff", cost:30 },
    { id:"mint", n:"Verde Arcade",c:"#4dff9b", cost:25 },
    { id:"gold", n:"Oro",         c:"#ffd84d", cost:40 }
  ];
  function applyTheme() {
    const t = THEMES.find(x => x.id === meta.theme) || THEMES[0];
    const s = $r("rwScreen"); if (s) s.style.setProperty("--rw", t.c);
  }
  const saveMeta = () => { try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) {} };
  const goal = () => GOALS[run.round - 1];

  function offers() {
    const pool = J.filter(j => !run.jokers.some(o => o.id === j.id)).sort(() => Math.random() - .5);
    const o = pool.slice(0, 3);
    if (!run.raspaBought && Math.random() < .5) o[2] = { ...RASPA, p: 3 + 2 * (run.raspas || 0) };
    return o.filter(Boolean);
  }

  function newRun() {
    run = { round:1, coins:0, spins:maxSp(), money:14 + 3 * lvl("bank"), freeRe:lvl("free") > 0, raspas:0, raspaBought:false, jokers:[], streak:0, lucky:0, nextLucky:0,
            phase:"shop", msg:"", shop:null };
    run.shop = offers();
    render();
  }

  /* ---------- GIRO ---------- */
  function roll() {
    let r;
    if (Math.random() < JACK[Math.min(run.round - 1, JACK.length - 1)] + .01 * lvl("luck") + run.lucky) { const s = rnd(); r = [s, s, s]; }
    else { r = [rnd(), rnd(), rnd()]; if (r[0] === r[1] && r[1] === r[2]) r[2] = SYM[(SYM.indexOf(r[2]) + 1) % 6]; }
    run.jokers.forEach(j => j.pre && j.pre(r));
    return r;
  }

  function evaluate(r) {
    const triple = r[0] === r[1] && r[1] === r[2];
    const pair = !triple && (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]);
    const sym = triple ? r[0] : pair ? (r[0] === r[1] || r[0] === r[2] ? r[0] : r[1]) : null;
    const c = { r, triple, pair, sym, last: run.spins === 0, n: s => r.filter(x => x === s).length };
    let chips = triple ? PAY[sym] : 0;
    const log = triple ? ["¡TRÍO! " + chips] : [];
    run.jokers.forEach(j => {
      c.chips = chips; const o = j.fx && j.fx(c, run);
      if (!o) return;
      if (o.add) { chips += o.add; log.push(j.n + " +" + o.add); }
      if (o.mul) { chips = Math.round(chips * o.mul); log.push(j.n + " ×" + (Math.round(o.mul * 100) / 100)); }
    });
    if (chips > 0) chips *= 1 + .05 * lvl("prize");
    return { chips: Math.round(chips), log, triple, pair };
  }

  function spin() {
    if (busy || !run || run.phase !== "play" || run.spins <= 0) return;
    busy = true; run.spins--;
    const reels = document.querySelectorAll("#rwScreen .reel");
    const machine = document.querySelector("#rwScreen .slot-machine");
    machine && machine.classList.add("spinning");
    let n = 0;
    const t = setInterval(() => {
      reels.forEach(x => x.textContent = rnd());
      if (++n < 14) return;
      clearInterval(t);
      const r = roll(), res = evaluate(r);
      reels.forEach((x, i) => x.textContent = r[i]);
      run.coins += res.chips;
      meta.q.spins++; if (res.triple) { meta.q.triples++; if (r[0] === "7") meta.q.sevens++; } else if (res.pair) meta.q.pairs++;
      meta.q.bestCoins = Math.max(meta.q.bestCoins, run.coins); saveMeta();
      run.streak = res.chips > 0 ? run.streak + 1 : 0;
      run.msg = res.chips ? res.log.join(" · ") + " = +" + res.chips : (res.log.join(" · ") || "SIN PREMIO");
      run.pop = res.chips > 0;
      snd(res.triple ? "soundWin" : res.chips ? "soundCoins" : "soundLose");
      machine && machine.classList.remove("spinning");
      busy = false;
      afterSpin();
    }, 70);
  }

  function afterSpin() {
    if (run.coins >= goal()) {
      if (run.round >= MAX) return end(true);
      const over = Math.min(10, Math.floor((run.coins - goal()) / goal() * 20));
      const bonus = Math.ceil((8 + run.spins * 2 + over) / 2) + 2 * run.jokers.filter(x => x.id === "banquero").length;
      run.money += bonus;
      run.msg = "¡RONDA SUPERADA! +" + bonus + " $ (giros sobrantes y exceso)";
      run.round++; run.coins = 0; run.spins = maxSp(); run.streak = 0; run.freeRe = lvl("free") > 0;
      run.lucky = run.nextLucky; run.nextLucky = 0;
      run.raspaBought = false; run.phase = "shop"; run.shop = offers();
    } else if (run.spins <= 0) end(false);
    render();
  }

  function end(won) {
    const done = won ? MAX : run.round - 1;
    run.jpGain = done * 10 + (won ? 50 : 0);
    meta.jp += run.jpGain; meta.bestRound = Math.max(meta.bestRound, done); meta.runs++;
    saveMeta(); run.done = done; run.phase = won ? "win" : "lose";
    render();
  }

  /* ---------- TIENDA ---------- */
  function buy(i) {
    const it = run.shop[i];
    if (!it || run.money < it.p) return;
    if (it.consumable) { run.nextLucky = .04; run.raspas++; run.raspaBought = true; }
    else { if (run.jokers.length >= 10) return; run.jokers.push(it); meta.q.maxJokers = Math.max(meta.q.maxJokers, run.jokers.length); saveMeta(); }
    run.money -= it.p; run.shop[i] = null; snd("soundUnlock"); render();
  }
  function sell(i) { run.money += Math.ceil(run.jokers[i].p / 2); run.jokers.splice(i, 1); render(); }
  function move(i, d) {
    const k = i + d; if (k < 0 || k >= run.jokers.length) return;
    [run.jokers[i], run.jokers[k]] = [run.jokers[k], run.jokers[i]]; render();
  }

  /* ---------- PANTALLAS ---------- */
  const ICON = { consuelo:"🍀", billetes:"💵", pareja7:"7️⃣", estrella:"⭐", diamante:"💎", dorado:"🥇", siete:"🔥",
    espejo:"🪞", racha:"⚡", ultimo:"⏳", gordo:"🐷", cadena:"⛓️", rey:"🤴", sueldo:"🪙", banquero:"🏦", parejaC:"🔔", parejaJ:"🤡", parejaD:"💠", caza7:"🎯", dolar:"💲", variedad:"🌈", optimista:"🌤️", doblej:"🎪", siete2:"🎡", veterano:"🎖️", mazo:"🗃️", cazad:"🔷", tormenta:"⛈️", iman:"🧲", casino:"🏰", prima:"🥂", semilla:"🌱", ruleta:"🎠", maestro:"🎓", comodin:"🃏", casi:"🎲", raspa:"🎟️" };
  const rar = p => p >= 7 ? "rare" : p >= 5 ? "unc" : "com";

  function cards() {
    const pages = Math.max(1, Math.ceil(run.jokers.length / 10));
    let h = '<div class="rw-pages" id="rwPages">';
    for (let p = 0; p < pages; p++) {
      h += '<div class="rw-page">';
      for (let i = p * 10; i < p * 10 + 10; i++) {
        const j = run.jokers[i];
        h += j ? '<button class="rw-card rw-' + rar(j.p) + (run.sel === i ? ' rw-sel' : '') + '" data-o="' + i + '"><span class="rw-ico">' + ICON[j.id] +
          '</span><b>' + j.n + '</b></button>' : '<div class="rw-card rw-empty"><span class="rw-ico">＋</span></div>';
      }
      h += '</div>';
    }
    h += '</div>';
    if (pages > 1) h += '<div class="rw-dots">' + Array.from({ length: pages }, (_, p) => '<i class="' + ((run.page || 0) === p ? 'on' : '') + '"></i>').join("") + '</div>';
    const s = run.jokers[run.sel];
    h += '<div class="rw-info">' + (s ? '<b>' + s.n + '</b>: ' + s.d : 'Tocá una carta para ver qué hace · ' + run.jokers.length + '/10 Jokers') + '</div>';
    if (s && run.phase === "shop") h += '<div class="rw-acts"><button data-m="-1">◀ MOVER</button><button data-m="1">MOVER ▶</button><button data-sell="1">VENDER $' + Math.ceil(s.p / 2) + '</button></div>';
    return h;
  }

  function bindCards(box) {
    const pg = box.querySelector("#rwPages");
    if (pg) {
      pg.scrollLeft = (run.page || 0) * pg.clientWidth;
      pg.onscroll = () => {
        const p = Math.round(pg.scrollLeft / (pg.clientWidth || 1)); run.page = p;
        box.querySelectorAll(".rw-dots i").forEach((d, k) => d.classList.toggle("on", k === p));
      };
    }
    box.querySelectorAll("[data-o]").forEach(b => b.onclick = () => { run.sel = run.sel === +b.dataset.o ? -1 : +b.dataset.o; render(); });
    box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const d = +b.dataset.m, k = run.sel + d;
      if (k < 0 || k >= run.jokers.length) return; [run.jokers[run.sel], run.jokers[k]] = [run.jokers[k], run.jokers[run.sel]]; run.sel = k; render(); });
    box.querySelectorAll("[data-sell]").forEach(b => b.onclick = () => { sell(run.sel); run.sel = -1; render(); });
  }

  function render() {
    const box = $r("rwBody"); if (!box) return;
    if (view !== "run") return renderView(box);
    if (!run) { renderMenu(); box.innerHTML = ""; return; }
    if (run.phase === "win" || run.phase === "lose") {
      box.innerHTML = '<h2>' + (run.phase === "win" ? "¡RONDA 15 COMPLETA!" : "FIN DE LA PARTIDA") + '</h2>' +
        '<p>Rondas completadas: <b>' + run.done + '</b></p><p>+<b>' + run.jpGain + '</b> Joker Points (total ' + meta.jp + ')</p>' +
        '<button class="rw-btn" id="rwAgain">JUGAR DE NUEVO</button>';
      $r("rwAgain").onclick = newRun; return;
    }
    const head = '<div class="rw-top"><span>RONDA ' + run.round + '/' + MAX + '</span><span>$ ' + run.money + '</span></div>' +
      '<div class="rw-goal">OBJETIVO ' + goal().toLocaleString("es") + '</div>';
    if (run.phase === "shop") {
      let h = head + '<p class="rw-msg">' + (run.msg || "") + '</p><h3>TIENDA</h3><div class="rw-row">';
      run.shop.forEach((it, i) => {
        h += it ? '<button class="rw-card rw-big rw-' + (it.consumable ? "unc" : rar(it.p)) + '" data-b="' + i + '"' + (run.money < it.p ? ' style="opacity:.5"' : '') +
          '><span class="rw-ico">' + ICON[it.id] + '</span><b>' + it.n + '</b><small>' + it.d + '</small><i>$' + it.p + '</i></button>' : '<div class="rw-card rw-big rw-empty">vendido</div>';
      });
      h += '</div><h3>TUS JOKERS</h3>' + cards() +
        '<button class="rw-btn" id="rwRe">' + (run.freeRe ? "CAMBIAR OFERTAS (GRATIS)" : "CAMBIAR OFERTAS ($2)") + '</button><button class="rw-btn" id="rwGo">JUGAR RONDA ▶</button>';
      box.innerHTML = h;
      box.querySelectorAll("[data-b]").forEach(b => b.onclick = () => buy(+b.dataset.b));
      bindCards(box);
      $r("rwRe").onclick = () => { if (run.freeRe) { run.freeRe = false; run.shop = offers(); render(); } else if (run.money >= 2) { run.money -= 2; run.shop = offers(); render(); } };
      $r("rwGo").onclick = () => { run.phase = "play"; run.msg = ""; run.sel = -1; render(); };
      return;
    }
    const pct = Math.min(100, Math.floor(run.coins / goal() * 100));
    const cur = box.querySelectorAll(".reel");
    const v = cur.length === 3 ? [...cur].map(x => x.textContent) : ["7", "7", "7"];
    box.innerHTML = head + '<div class="rw-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="rw-coins">FICHAS ' + run.coins.toLocaleString("es") + ' · GIROS ' + run.spins + '</div>' +
      '<div class="slot-machine"><div class="reels" style="display:flex;gap:8px;justify-content:center">' + v.map(s => '<div class="reel">' + s + '</div>').join("") + '</div></div>' +
      '<div class="rw-msg' + (run.pop ? ' rw-pop' : '') + '">' + (run.msg || "&nbsp;") + '</div>' +
      '<button class="rw-btn" id="rwSpin">GIRAR (GRATIS)</button>' + cards();
    run.pop = false;
    $r("rwSpin").onclick = spin;
    bindCards(box);
  }

  function renderMenu() {
    const m = $r("rwMenu"); if (!m) return;
    m.innerHTML = '<p style="text-align:center;color:#f3e9ff">Mejor ronda: <b>' + meta.bestRound + '</b> · JP: <b>' + meta.jp + '</b> · SP: <b>' + meta.sp + '</b></p>' +
      '<button class="rw-btn" id="rwOpen">▶ INICIAR PARTIDA</button>' +
      '<button class="rw-btn" id="rwTree">🌳 ÁRBOL (JOKER POINTS)</button>' +
      '<button class="rw-btn" id="rwQuests">🎯 MISIONES Y COSMÉTICOS</button>';
    const go = v => { view = v; run = null; showScreen("rwScreen"); render(); };
    $r("rwOpen").onclick = () => { view = "run"; run = null; newRun(); showScreen("rwScreen"); };
    $r("rwTree").onclick = () => go("tree");
    $r("rwQuests").onclick = () => go("quests");
  }

  function renderView(box) {
    let h = "";
    if (view === "tree") {
      h = '<h2>ÁRBOL PERMANENTE</h2><p>Joker Points: <b>' + meta.jp + '</b></p>';
      TREE.forEach(u => {
        const l = lvl(u.id), maxed = l >= u.max, cost = u.c[l];
        h += '<div class="rw-line"><div><b>' + u.n + '</b> ' + l + '/' + u.max + '<br><small>' + u.d + '</small></div>' +
          '<button data-t="' + u.id + '"' + (maxed || meta.jp < cost ? ' disabled' : '') + '>' + (maxed ? "MAX" : cost + " JP") + '</button></div>';
      });
    } else {
      h = '<h2>MISIONES</h2><p>Style Points: <b>' + meta.sp + '</b></p>';
      QUESTS.forEach(q => {
        const cur = Math.min(q.t, q.v()), done = cur >= q.t, got = meta.claimed[q.id];
        h += '<div class="rw-line"><div><b>' + q.n + '</b><br><small>' + cur.toLocaleString("es") + '/' + q.t.toLocaleString("es") + ' · +' + q.r + ' SP</small></div>' +
          '<button data-q="' + q.id + '"' + (!done || got ? ' disabled' : '') + '>' + (got ? "✔" : done ? "RECLAMAR" : "…") + '</button></div>';
      });
      h += '<h2>COSMÉTICOS</h2>';
      THEMES.forEach(t => {
        const own = meta.owned.includes(t.id), on = meta.theme === t.id;
        h += '<div class="rw-line"><div><b style="color:' + t.c + '">' + t.n + '</b><br><small>Solo estético</small></div>' +
          '<button data-c="' + t.id + '"' + (on || (!own && meta.sp < t.cost) ? ' disabled' : '') + '>' + (on ? "EN USO" : own ? "USAR" : t.cost + " SP") + '</button></div>';
      });
    }
    box.innerHTML = h;
    box.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
      const u = TREE.find(x => x.id === b.dataset.t), c = u.c[lvl(u.id)];
      if (c != null && meta.jp >= c) { meta.jp -= c; meta.tree[u.id] = lvl(u.id) + 1; saveMeta(); snd("soundUnlock"); render(); } });
    box.querySelectorAll("[data-q]").forEach(b => b.onclick = () => {
      const q = QUESTS.find(x => x.id === b.dataset.q);
      if (q.v() >= q.t && !meta.claimed[q.id]) { meta.claimed[q.id] = 1; meta.sp += q.r; saveMeta(); snd("soundCoins"); render(); } });
    box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      const t = THEMES.find(x => x.id === b.dataset.c);
      if (!meta.owned.includes(t.id)) { if (meta.sp < t.cost) return; meta.sp -= t.cost; meta.owned.push(t.id); }
      meta.theme = t.id; saveMeta(); applyTheme(); render(); });
  }
  const showMenuBtn = () => {};

  /* ---------- MONTAJE ---------- */
  function build() {
    const st = document.createElement("style");
    st.textContent =
      "#rwScreen{padding:12px;text-align:center;color:#f3e9ff;font-family:monospace}" +
      ".rw-btn{display:block;width:100%;margin:10px 0;padding:14px;background:#2a1450;color:#fff;border:2px solid var(--rw,#9b4dff);border-radius:6px;font:inherit;font-weight:bold;box-shadow:0 0 10px var(--rw,#9b4dff)}" +
      ".rw-top{display:flex;justify-content:space-between;font-weight:bold}.rw-goal{margin:6px 0;color:#ffd84d}" +
      ".rw-bar{height:14px;background:#1a0d33;border:2px solid var(--rw,#9b4dff)}.rw-bar i{display:block;height:100%;background:#ffd84d}" +
      ".rw-coins{margin:6px 0}.rw-row{display:flex;gap:6px;margin:8px 0}" +
      ".rw-card{flex:1;min-width:0;aspect-ratio:2/3;padding:4px 2px;background:linear-gradient(160deg,#2a1450,#120826);border:3px solid #6b5b95;border-radius:8px;color:#fff;font:inherit;font-size:9px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;position:relative;box-shadow:0 3px 0 #0006}" +
      ".rw-ico{font-size:26px;line-height:1.2}.rw-card b{font-size:9px;word-break:break-word}.rw-card small{font-size:8px;opacity:.85}" +
      ".rw-big{aspect-ratio:auto;min-height:150px;padding:6px 3px}.rw-big .rw-ico{font-size:34px}.rw-big i{color:#ffd84d;font-style:normal;font-weight:bold;font-size:13px}" +
      ".rw-com{border-color:#7fa6d9}.rw-unc{border-color:#b56bff}.rw-rare{border-color:#ffd84d;box-shadow:0 0 10px #ffd84d88}" +
      ".rw-sel{transform:translateY(-6px);filter:brightness(1.3)}.rw-empty{opacity:.3;border-style:dashed;justify-content:center}" +
      ".rw-info{min-height:34px;font-size:12px;color:#cdb8ff}.rw-acts{display:flex;gap:6px}.rw-acts button{flex:1;padding:8px 2px;background:#2a1450;color:#fff;border:2px solid var(--rw,#9b4dff);border-radius:6px;font:inherit;font-size:11px}" +
      ".rw-msg{min-height:34px;font-weight:bold;color:#7dffb0;font-size:13px}" +
      ".rw-pop{animation:rwpop .35s}@keyframes rwpop{0%{transform:scale(.6)}60%{transform:scale(1.25)}100%{transform:scale(1)}}" +
      ".rw-pages{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:8px 0}.rw-pages::-webkit-scrollbar{display:none}" +
      ".rw-page{flex:0 0 100%;scroll-snap-align:start;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-content:start}" +
      ".rw-dots{display:flex;gap:6px;justify-content:center;margin:4px 0}.rw-dots i{width:8px;height:8px;border-radius:50%;background:#6b5b95}.rw-dots i.on{background:#ffd84d}" +
      ".rw-line{display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;margin:6px 0;padding:8px;background:#1a0d33;border:2px solid var(--rw,#9b4dff);border-radius:6px;font-size:12px}.rw-line button{padding:8px;background:#2a1450;color:#fff;border:2px solid var(--rw,#9b4dff);border-radius:6px;font:inherit;font-size:11px;min-width:76px}.rw-line button:disabled{opacity:.4}" +
      "#rwBack{background:none;border:0;color:#c9a0ff;font:inherit;float:left}";
    document.head.appendChild(st);
    const sec = document.createElement("section");
    sec.id = "rwScreen"; sec.className = "screen hidden";
    sec.innerHTML = '<button id="rwBack">← MENÚ</button><div id="rwBody" style="clear:both"></div>';
    document.body.appendChild(sec);
    $r("rwBack").onclick = () => { view = "run"; run = null; renderMenu(); showScreen("menu"); };
    renderMenu(); applyTheme();
  }
  const start = () => build();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
