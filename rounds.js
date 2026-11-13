/* ==========================================
   JOKER WORLDS · MODO PARTIDA (rondas)
   Etapa 2: objetivo por ronda, 30 giros, hasta ronda 15.
   Guardado propio y versionado: no modifica los
   guardados anteriores (joker_worlds_new / expansion).
========================================== */
(() => {
  "use strict";

  const KEY = "joker_worlds_run_v1";
  const SPINS = 30, MAX_ROUND = 15;
  const GOALS = [3000,6000,10000,15000,22000,30000,40000,52000,66000,82000,100000,120000,145000,175000,210000];
  const PAY = { "7":500, "J":400, "★":300, "$":250, "♦":200, "C":150 };
  const SYM = Object.keys(PAY);
  const PERKS = [
    { id:"prize", n:"Premios +30%", d:"Todos los premios x1,3" },
    { id:"luck",  n:"Suerte +8%",   d:"Más chances de combinación" },
    { id:"spins", n:"+5 giros",     d:"5 giros extra cada ronda" },
    { id:"pair",  n:"Pares x2",     d:"Los pares pagan el doble" }
  ];

  const $r = id => document.getElementById(id);
  const snd = n => { try { if (typeof window[n] === "function") window[n](); } catch (e) {} };

  let meta = { v:1, jp:0, bestRound:0, runs:0 };
  let run = null, busy = false;

  function loadMeta() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") {
        meta.jp = Number.isFinite(s.jp) ? s.jp : 0;
        meta.bestRound = Number.isFinite(s.bestRound) ? s.bestRound : 0;
        meta.runs = Number.isFinite(s.runs) ? s.runs : 0;
      }
    } catch (e) {}
  }
  function saveMeta() {
    try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) {}
  }

  const count = id => run.perks.filter(p => p === id).length;
  const goal = () => GOALS[run.round - 1];
  const maxSpins = () => SPINS + 5 * count("spins");

  function newRun() {
    run = { round:1, coins:0, spins:maxSpins0(), perks:[], phase:"play", msg:"" };
    run.spins = SPINS;
    render();
  }
  function maxSpins0() { return SPINS; }

  function roll() {
    const luck = 0.38 + 0.08 * count("luck");
    const mult = Math.pow(1.3, count("prize"));
    let r;
    if (Math.random() < luck) {
      const s = SYM[Math.floor(Math.random() * SYM.length)];
      r = [s, s, s];
    } else {
      r = [0,0,0].map(() => SYM[Math.floor(Math.random() * SYM.length)]);
      if (r[0] === r[1] && r[1] === r[2]) r[2] = SYM[(SYM.indexOf(r[2]) + 1) % SYM.length];
    }
    let prize = 0;
    if (r[0] === r[1] && r[1] === r[2]) prize = PAY[r[0]];
    else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) prize = 40 * (count("pair") ? 2 : 1);
    return { r, prize: Math.round(prize * mult) };
  }

  function spin() {
    if (busy || !run || run.phase !== "play" || run.spins <= 0) return;
    busy = true;
    run.spins--;
    const reels = document.querySelectorAll("#rwReels .rw-reel");
    let n = 0;
    const t = setInterval(() => {
      reels.forEach(x => x.textContent = SYM[Math.floor(Math.random() * SYM.length)]);
      if (++n >= 12) {
        clearInterval(t);
        const res = roll();
        reels.forEach((x, i) => x.textContent = res.r[i]);
        run.coins += res.prize;
        run.msg = res.prize ? "+" + res.prize + " FICHAS" : "SIN PREMIO";
        snd(res.prize ? "soundWin" : "soundLose");
        busy = false;
        checkRound();
        render();
      }
    }, 70);
  }

  function checkRound() {
    if (run.coins >= goal()) {
      if (run.round >= MAX_ROUND) return endRun(true);
      run.phase = "perk";
      run.options = PERKS.slice().sort(() => Math.random() - .5).slice(0, 3);
    } else if (run.spins <= 0) {
      endRun(false);
    }
  }

  function endRun(won) {
    const reached = won ? MAX_ROUND : run.round - (run.coins >= goal() ? 0 : 1);
    const done = Math.max(0, reached);
    run.jpGain = done * 10 + (won ? 50 : 0);
    meta.jp += run.jpGain;
    meta.bestRound = Math.max(meta.bestRound, done);
    meta.runs++;
    saveMeta();
    run.phase = won ? "win" : "lose";
    run.done = done;
  }

  function pick(id) {
    run.perks.push(id);
    run.round++;
    run.coins = 0;
    run.spins = maxSpins();
    run.phase = "play";
    run.msg = "";
    render();
  }

  function render() {
    const box = $r("rwBody");
    if (!box) return;
    if (!run) {
      box.innerHTML =
        '<h2>JOKER WORLDS</h2><p>Cada ronda: llegá al objetivo en ' + SPINS + ' giros gratis.</p>' +
        '<p>Mejor ronda: <b>' + meta.bestRound + '</b> · Joker Points: <b>' + meta.jp + '</b></p>' +
        '<button class="rw-btn" id="rwStart">NUEVA PARTIDA</button>';
      $r("rwStart").onclick = newRun;
      return;
    }
    if (run.phase === "lose" || run.phase === "win") {
      box.innerHTML =
        '<h2>' + (run.phase === "win" ? "¡RONDA 15 COMPLETA!" : "FIN DE LA PARTIDA") + '</h2>' +
        '<p>Rondas completadas: <b>' + run.done + '</b></p>' +
        '<p>Ganaste <b>+' + run.jpGain + ' Joker Points</b> (total ' + meta.jp + ')</p>' +
        (run.phase === "win" ? '<p class="rw-dim">El modo infinito llegará en la próxima etapa.</p>' : '') +
        '<button class="rw-btn" id="rwAgain">JUGAR DE NUEVO</button>';
      $r("rwAgain").onclick = newRun;
      return;
    }
    const pct = Math.min(100, Math.floor(run.coins / goal() * 100));
    let html =
      '<div class="rw-top"><span>RONDA ' + run.round + '/' + MAX_ROUND + '</span><span>GIROS ' + run.spins + '</span></div>' +
      '<div class="rw-goal">OBJETIVO ' + goal().toLocaleString("es") + '</div>' +
      '<div class="rw-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="rw-coins">FICHAS ' + run.coins.toLocaleString("es") + '</div>';
    if (run.phase === "perk") {
      html += '<h3>¡Ronda superada! Elegí una mejora</h3>';
      run.options.forEach(o => {
        html += '<button class="rw-btn rw-perk" data-p="' + o.id + '"><b>' + o.n + '</b><br><small>' + o.d + '</small></button>';
      });
      box.innerHTML = html;
      box.querySelectorAll("[data-p]").forEach(b => b.onclick = () => pick(b.dataset.p));
      return;
    }
    const cur = box.querySelectorAll(".rw-reel");
    const vals = cur.length === 3 ? [...cur].map(x => x.textContent) : ["7","7","7"];
    html += '<div id="rwReels">' + vals.map(v => '<div class="rw-reel">' + v + '</div>').join("") + '</div>' +
      '<div class="rw-msg">' + (run.msg || "&nbsp;") + '</div>' +
      '<button class="rw-btn" id="rwSpin">GIRAR (GRATIS)</button>';
    box.innerHTML = html;
    $r("rwSpin").onclick = spin;
  }

  function build() {
    const st = document.createElement("style");
    st.textContent =
      "#rwScreen{padding:16px;text-align:center;color:#f3e9ff;font-family:monospace}" +
      "#rwBody h2{color:#c9a0ff;text-shadow:0 0 10px #9b4dff}" +
      ".rw-btn{display:block;width:100%;margin:10px 0;padding:14px;background:#2a1450;color:#fff;border:2px solid #9b4dff;border-radius:6px;font:inherit;font-weight:bold;box-shadow:0 0 10px #9b4dff88}" +
      ".rw-btn:disabled{opacity:.5}.rw-perk small,.rw-dim{opacity:.7}" +
      ".rw-top{display:flex;justify-content:space-between;font-weight:bold}" +
      ".rw-goal{margin:8px 0;color:#ffd84d}.rw-coins{margin:6px 0 12px}" +
      ".rw-bar{height:14px;background:#1a0d33;border:2px solid #9b4dff}.rw-bar i{display:block;height:100%;background:#ffd84d}" +
      "#rwReels{display:flex;gap:8px;justify-content:center;margin:14px 0}" +
      ".rw-reel{width:72px;height:84px;line-height:84px;font-size:40px;background:#0b0618;border:3px solid #9b4dff;border-radius:6px}" +
      ".rw-msg{min-height:24px;font-weight:bold;color:#7dffb0}" +
      "#rwBack{background:none;border:0;color:#c9a0ff;font:inherit;float:left}";
    document.head.appendChild(st);

    const sec = document.createElement("section");
    sec.id = "rwScreen";
    sec.className = "screen hidden";
    sec.innerHTML = '<button id="rwBack">← MENÚ</button><div id="rwBody" style="clear:both"></div>';
    document.body.appendChild(sec);
    $r("rwBack").onclick = () => { run = null; showScreen("menu"); };

    const menu = $r("menu");
    if (menu) {
      const b = document.createElement("button");
      b.id = "rwOpen";
      b.className = "rw-btn";
      b.textContent = "▶ PARTIDA (RONDAS)";
      b.onclick = () => { run = null; render(); showScreen("rwScreen"); };
      menu.appendChild(b);
    }
  }

  function start() { loadMeta(); build(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
