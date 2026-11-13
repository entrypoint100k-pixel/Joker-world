
/* ==========================================
   JOKER WORLDS EXPANSION
   Árboles independientes · 5 niveles
   Multiplicadores · Ranking online
========================================== */
(() => {
  "use strict";

  const SUPABASE_URL = "https://hqkzhtxvwooyuowcfvcf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_sQsCdLJILYuPsSagN19CYw_UO8zQplO";

  const EXT_SAVE = "joker_worlds_expansion_v1";
  const $x = id => document.getElementById(id);

  const odds = [0.25, 0.18, 0.12, 0.08, 0.05];
  const levelCosts = [0, 300, 900, 1800, 3000];

  const labels = {
    slot: "JOKER SLOTS",
    scratch: "SCRATCH PIXEL",
    rush: "PIXEL RUSH"
  };

  const basePrizes = {
    slot: 200,
    scratch: 500,
    rush: 50
  };

  const topPrizes = {
    slot: [200, 500, 1200, 1800, 2500],
    scratch: [500, 1200, 3000, 4500, 6000],
    rush: [50, 100, 250, 400, 600]
  };

  const machineUpgradeDefs = {
    slot: [
      { id: "luck", name: "Ajuste de suerte", desc: "Aumenta 3 puntos porcentuales la posibilidad de premio.", price: 500 },
      { id: "reward", name: "Premios reforzados", desc: "Aumenta un 25% las fichas ganadas.", price: 450 },
      { id: "discount", name: "Entrada económica", desc: "Reduce un 20% el costo de jugar.", price: 350 }
    ],
    scratch: [
      { id: "luck", name: "Papel de la suerte", desc: "Aumenta 2 puntos porcentuales la posibilidad de premio.", price: 500 },
      { id: "reward", name: "Premio reforzado", desc: "Aumenta un 25% las fichas ganadas.", price: 450 },
      { id: "discount", name: "Tarjeta económica", desc: "Reduce un 20% el costo de cada tarjeta.", price: 350 }
    ],
    rush: [
      { id: "luck", name: "Rodillo afortunado", desc: "Aumenta 2 puntos porcentuales la posibilidad de premio.", price: 500 },
      { id: "reward", name: "Premio reforzado", desc: "Aumenta un 25% las fichas ganadas.", price: 450 },
      { id: "discount", name: "Partida económica", desc: "Reduce un 20% el costo de jugar.", price: 350 }
    ]
  };

  const ext = {
    machineTiers: { slot: 1, scratch: 1, rush: 1 },
    machineSelected: { slot: 1, scratch: 1, rush: 1 },
    machineUpgrades: { slot: [], scratch: [], rush: [] },
    nextSpinMultiplier: 1,
    pendingSpinMultiplier: 1,
    playerId: "",
    username: ""
  };

  /* ==========================================
     GUARDADO
  ========================================== */

  function saveExt() {
    try {
      localStorage.setItem(EXT_SAVE, JSON.stringify(ext));
    } catch (e) {
      console.error("No se pudo guardar la expansión:", e);
    }
  }

  function readExt() {
    try {
      const s = JSON.parse(localStorage.getItem(EXT_SAVE) || "{}");

      if (s.machineTiers) {
        ext.machineTiers = { ...ext.machineTiers, ...s.machineTiers };
      }

      if (s.machineSelected) {
        ext.machineSelected = { ...ext.machineSelected, ...s.machineSelected };
      }

      if (s.machineUpgrades) {
        ext.machineUpgrades = { ...ext.machineUpgrades, ...s.machineUpgrades };
      }

      ext.nextSpinMultiplier = [1, 2, 5, 10].includes(s.nextSpinMultiplier)
        ? s.nextSpinMultiplier
        : 1;

      ext.pendingSpinMultiplier = 1;

      ext.playerId =
        s.playerId ||
        localStorage.getItem("joker_worlds_player_id") ||
        "";

      ext.username =
        s.username ||
        localStorage.getItem("joker_worlds_username") ||
        "";

    } catch (e) {
      console.error("Error leyendo la expansión:", e);
    }

    ["slot", "scratch", "rush"].forEach(type => {
      ext.machineTiers[type] = Math.max(
        1,
        Math.min(5, Number(ext.machineTiers[type]) || 1)
      );

      ext.machineSelected[type] = Math.max(
        1,
        Math.min(
          ext.machineTiers[type],
          Number(ext.machineSelected[type]) || 1
        )
      );

      if (!Array.isArray(ext.machineUpgrades[type])) {
        ext.machineUpgrades[type] = [];
      }
    });

    if (!ext.playerId) {
      const id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : Date.now() + "_" + Math.random().toString(36).slice(2);

      ext.playerId = "jw_" + id;
      localStorage.setItem("joker_worlds_player_id", ext.playerId);
    }

    if (!ext.username) {
      ext.username = "Jugador" + Math.floor(1000 + Math.random() * 9000);
    }

    localStorage.setItem("joker_worlds_username", ext.username);
    saveExt();
  }

  function tier(type) {
    return ext.machineSelected[type] || 1;
  }

  function hasUpgrade(type, id) {
    return (ext.machineUpgrades[type] || []).includes(id);
  }

  function chance(type) {
    const base = odds[tier(type) - 1] || odds[0];
    const bonus = hasUpgrade(type, "luck")
      ? (type === "slot" ? 0.03 : 0.02)
      : 0;

    return Math.min(0.95, base + bonus);
  }

  function prizeFor(type) {
    return topPrizes[type][tier(type) - 1] || basePrizes[type];
  }

  function beginMultiplier() {
    ext.pendingSpinMultiplier = ext.nextSpinMultiplier || 1;
    ext.nextSpinMultiplier = 1;
    saveExt();
  }

  /* ==========================================
     RANKING ONLINE
  ========================================== */

  let sb = null;
  let syncTimer = null;
  let lastSentCoins = null;

  function connectSupabase() {
    if (window.supabase?.createClient) {
      try {
        sb = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

        refreshLeaderboard();
        scheduleSync(true);

      } catch (error) {
        console.error("Supabase:", error);
        setLeaderboardStatus("No se pudo iniciar la conexión online.");
      }

    } else {
      setLeaderboardStatus(
        "No se cargó Supabase. Revisá la conexión y el script del index."
      );
    }
  }

  function setLeaderboardStatus(message) {
    const status = $x("leaderboardStatus");
    if (status) status.textContent = message;
  }

  function scheduleSync(force = false) {
    if (!sb) return;

    clearTimeout(syncTimer);

    syncTimer = setTimeout(() => {
      syncScore(force);
    }, force ? 400 : 5000);
  }

  async function syncScore(force = false) {
    if (!sb || typeof data === "undefined") return;

    const coins = Number(data.coins) || 0;

    if (!force && coins === lastSentCoins) return;

    const row = {
      player_id: ext.playerId,
      username: ext.username.slice(0, 18),
      coins,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await sb
        .from("leaderboard")
        .upsert(row, { onConflict: "player_id" });

      if (error) {
        setLeaderboardStatus(
          "No se pudo actualizar el ranking: " + error.message
        );
        return;
      }

      lastSentCoins = coins;

      setLeaderboardStatus(
        "Puntuación sincronizada · " +
        new Date().toLocaleTimeString()
      );

      refreshLeaderboard();

    } catch (error) {
      console.error("Error de sincronización:", error);
      setLeaderboardStatus("Error de conexión con el ranking.");
    }
  }

  async function refreshLeaderboard() {
    if (!sb) {
      setLeaderboardStatus("Ranking sin conexión.");
      return;
    }

    const list = $x("leaderboardList");
    const status = $x("leaderboardStatus");

    try {
      const { data: rows, error } = await sb
        .from("leaderboard")
        .select("username,coins,updated_at")
        .order("coins", { ascending: false })
        .limit(50);

      if (error) {
        if (status) {
          status.textContent = "Error al cargar el ranking: " + error.message;
        }
        return;
      }

      if (!list) return;

      list.innerHTML = "";

      (rows || []).forEach((row, index) => {
        const item = document.createElement("div");
        item.className = "rank-row" + (index < 3 ? " rank-top" : "");

        const position = document.createElement("b");
        position.textContent = "#" + (index + 1);

        const name = document.createElement("span");
        name.textContent = row.username || "Jugador";

        const score = document.createElement("strong");
        score.textContent =
          (Number(row.coins) || 0).toLocaleString("es-AR") + " F";

        item.append(position, name, score);
        list.appendChild(item);
      });

      if (!rows?.length) {
        list.textContent = "TODAVÍA NO HAY PUNTUACIONES.";
      }

      if (
        status &&
        !status.textContent.startsWith("Puntuación sincronizada")
      ) {
        status.textContent =
          "Ranking mundial · " + (rows?.length || 0) + " jugadores";
      }

    } catch (error) {
      console.error("Error leyendo ranking:", error);
      if (status) status.textContent = "No se pudo conectar al ranking.";
    }
  }

  function addLeaderboardPage() {
    const menu = document.querySelector("#menu .menu-nav");

    if (menu && !$x("leaderboardButton")) {
      const button = document.createElement("button");
      button.id = "leaderboardButton";
      button.textContent = "CLASIFICACIÓN";
      button.addEventListener("click", openLeaderboard);
      menu.appendChild(button);
    }

    if ($x("leaderboardPage")) return;

    const page = document.createElement("section");
    page.id = "leaderboardPage";
    page.className = "screen hidden";

    page.innerHTML = `
      <button class="back pixel-button">← VOLVER</button>

      <div class="arcade-title">
        <h2>CLASIFICACIÓN MUNDIAL</h2>
        <p>LOS JUGADORES CON MÁS FICHAS</p>
      </div>

      <div class="leaderboard-profile">
        <label for="leaderboardName">TU NOMBRE</label>
        <input id="leaderboardName" maxlength="18" autocomplete="nickname">
        <button id="saveLeaderboardName" class="pixel-button gold">
          GUARDAR NOMBRE
        </button>
      </div>

      <p id="leaderboardStatus" class="leaderboard-status">
        Conectando...
      </p>

      <div id="leaderboardList" class="leaderboard-list"></div>

      <button id="refreshLeaderboard" class="pixel-button">
        ACTUALIZAR RANKING
      </button>

      <p class="leaderboard-note">
        Las fichas se guardan en este dispositivo.
        El ranking online es amistoso y no tiene validación antitrampas.
      </p>
    `;

    document.body.appendChild(page);

    page.querySelector(".back").addEventListener("click", () => {
      showScreen("menu");
    });

    $x("leaderboardName").value = ext.username;

    $x("saveLeaderboardName").addEventListener("click", () => {
      const value = $x("leaderboardName")
        .value
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 18);

      if (!value) {
        alert("Escribí un nombre.");
        return;
      }

      ext.username = value;
      localStorage.setItem("joker_worlds_username", value);

      saveExt();
      scheduleSync(true);

      setLeaderboardStatus("Nombre guardado.");
    });

    $x("refreshLeaderboard").addEventListener("click", () => {
      refreshLeaderboard();
    });
  }

  function openLeaderboard() {
    addLeaderboardPage();
    showScreen("leaderboardPage");
    refreshLeaderboard();
  }

  /* ==========================================
     ÁRBOLES DE MEJORAS
  ========================================== */

  function addMachineTreeButtons() {
    const room = document.querySelector(".arcade-room");
    if (!room) return;

    room.querySelectorAll(".cabinet[data-game]").forEach(cabinet => {
      const type = cabinet.dataset.game;

      if (!labels[type] || cabinet.dataset.treeWrapped === "1") return;

      cabinet.dataset.treeWrapped = "1";

      const wrap = document.createElement("div");
      wrap.className = "cabinet-unit";

      cabinet.parentNode.insertBefore(wrap, cabinet);
      wrap.appendChild(cabinet);

      const button = document.createElement("button");
      button.className = "machine-tree-open";
      button.textContent = "ÁRBOL DE MEJORAS";

      button.addEventListener("click", () => {
        openMachineTree(type);
      });

      wrap.appendChild(button);
    });
  }

  function addMachineTreePage() {
    if ($x("machineTreePage")) return;

    const page = document.createElement("section");
    page.id = "machineTreePage";
    page.className = "screen hidden";

    page.innerHTML = `
      <button id="machineTreeBack" class="back pixel-button">
        ← VOLVER
      </button>

      <div class="arcade-title">
        <h2 id="machineTreeTitle">ÁRBOL DE MÁQUINA</h2>
        <p>PROGRESO PERMANENTE E INDEPENDIENTE</p>
      </div>

      <div id="machineTreeContent" class="machine-tree-content"></div>
    `;

    document.body.appendChild(page);

    $x("machineTreeBack").addEventListener("click", () => {
      showScreen("menu");
    });
  }

  function openMachineTree(type) {
    addMachineTreePage();
    renderMachineTree(type);
    showScreen("machineTreePage");
  }

  function renderMachineTree(type) {
    const host = $x("machineTreeContent");
    if (!host || !labels[type]) return;

    host.innerHTML = "";

    $x("machineTreeTitle").textContent =
      labels[type] + " · ÁRBOL";

    const current = ext.machineTiers[type];

    const intro = document.createElement("div");
    intro.className = "machine-tree-summary";

    intro.innerHTML = `
      <b>NIVEL ACTUAL: ${current}/5</b>
      <span>
        Probabilidad base del nivel:
        ${Math.round(odds[current - 1] * 100)}%
      </span>
      <small>Las mejoras se guardan y no caducan.</small>
    `;

    host.appendChild(intro);

    const levels = document.createElement("div");
    levels.className = "machine-level-grid";

    odds.forEach((probability, index) => {
      const number = index + 1;
      const unlocked = number <= current;

      const card = document.createElement("article");
      card.className =
        "machine-level-card" +
        (number === current ? " current" : "") +
        (unlocked ? " unlocked" : "");

      const tag = document.createElement("span");
      tag.className = "level-tag";
      tag.textContent = unlocked
        ? (number === current ? "NIVEL ACTUAL" : "DESBLOQUEADO")
        : "BLOQUEADO";

      const heading = document.createElement("h3");
      heading.textContent = "NIVEL " + number;

      const probabilityText = document.createElement("strong");
      probabilityText.className = "level-odds";
      probabilityText.textContent =
        Math.round(probability * 100) + "%";

      const description = document.createElement("p");
      description.textContent = "Probabilidad base de premio";

      const prize = document.createElement("small");
      prize.textContent =
        "Premio máximo: " +
        prizeForLevel(type, number).toLocaleString("es-AR") +
        " F";

      const button = document.createElement("button");
      button.className = "buy-button";

      if (unlocked) {
        button.textContent =
          number === current ? "SELECCIONADO" : "USAR ESTE NIVEL";

        button.disabled = number === current;

        button.addEventListener("click", () => {
          ext.machineSelected[type] = number;
          saveExt();
          renderMachineTree(type);
        });

      } else {
        button.textContent =
          "DESBLOQUEAR · " +
          levelCosts[index].toLocaleString("es-AR") +
          " F";

        button.disabled = number !== current + 1;

        button.addEventListener("click", () => {
          if (data.coins < levelCosts[index]) {
            alert("No tenés fichas suficientes.");
            return;
          }

          data.coins -= levelCosts[index];

          ext.machineTiers[type] = number;
          ext.machineSelected[type] = number;

          saveExt();
          save();
          update();

          renderMachineTree(type);
        });
      }

      card.append(
        tag,
        heading,
        probabilityText,
        description,
        prize,
        button
      );

      levels.appendChild(card);
    });

    host.appendChild(levels);

    const upgradesTitle = document.createElement("div");
    upgradesTitle.className = "arcade-title";
    upgradesTitle.innerHTML = `
      <h2>MEJORAS ESPECIALES</h2>
      <p>SOLO AFECTAN A ESTA MÁQUINA</p>
    `;

    host.appendChild(upgradesTitle);

    const upgrades = document.createElement("div");
    upgrades.className = "machine-upgrade-grid";

    machineUpgradeDefs[type].forEach(upgrade => {
      const owned = hasUpgrade(type, upgrade.id);

      const card = document.createElement("article");
      card.className = "machine-upgrade-card";

      const heading = document.createElement("h3");
      heading.textContent = upgrade.name;

      const description = document.createElement("p");
      description.textContent = upgrade.desc;

      const button = document.createElement("button");
      button.className = "buy-button";
      button.textContent = owned
        ? "COMPRADO · PERMANENTE"
        : upgrade.price + " FICHAS";

      button.disabled = owned;

      button.addEventListener("click", () => {
        if (data.coins < upgrade.price) {
          alert("No tenés fichas suficientes.");
          return;
        }

        data.coins -= upgrade.price;
        ext.machineUpgrades[type].push(upgrade.id);

        saveExt();
        save();
        update();

        renderMachineTree(type);
      });

      card.append(heading, description, button);
      upgrades.appendChild(card);
    });

    host.appendChild(upgrades);
  }

  function prizeForLevel(type, number) {
    return topPrizes[type][number - 1];
  }

  /* ==========================================
     MULTIPLICADORES
  ========================================== */

  function addMultiplierItems() {
    if (
      typeof catalog === "undefined" ||
      typeof pixel === "undefined"
    ) {
      console.error("No se encontraron catalog o pixel de game.js.");
      return;
    }

    const items = [
      {
        id: "spin2",
        name: "Joker Multiplicador ×2",
        price: 200,
        desc: "Multiplica por 2 el premio de tu próxima jugada. Se consume incluso si no ganás.",
        sprite: "mult2",
        kind: "spinMultiplier",
        value: 2
      },
      {
        id: "spin5",
        name: "Joker Multiplicador ×5",
        price: 500,
        desc: "Multiplica por 5 el premio de tu próxima jugada. Se consume incluso si no ganás.",
        sprite: "mult5",
        kind: "spinMultiplier",
        value: 5
      },
      {
        id: "spin10",
        name: "Joker Multiplicador ×10",
        price: 1000,
        desc: "Multiplica por 10 el premio de tu próxima jugada. Se consume incluso si no ganás.",
        sprite: "mult10",
        kind: "spinMultiplier",
        value: 10
      }
    ];

    items.forEach(item => {
      if (!catalog.some(existing => existing.id === item.id)) {
        catalog.push(item);
      }
    });

    pixel.mult2 = [
      "........",
      "..YY....",
      ".YYYY...",
      "..YY....",
      "..YY....",
      "..YY....",
      ".YYYYY..",
      "........"
    ];

    pixel.mult5 = [
      "........",
      "..GG....",
      ".GGGG...",
      "..GG....",
      "..GG....",
      "..GG....",
      ".GGGGG..",
      "........"
    ];

    pixel.mult10 = [
      "........",
      "..RR....",
      ".RRRR...",
      "..RR....",
      "..RR....",
      "..RR....",
      ".RRRRR..",
      "........"
    ];
  }

  /* ==========================================
     INTEGRACIÓN CON GAME.JS
  ========================================== */

  function installOverrides() {
    const oldSave = window.save;
    const oldCost = window.cost;
    const oldCharge = window.charge;
    const oldReward = window.reward;
    const oldActivate = window.activateItem;
    const oldShow = window.showScreen;
    const oldCheckScratch = window.checkScratch;
    const oldBuyItem = window.buyItem;
    const oldBuySkill = window.buySkill;

    if (typeof oldSave === "function") {
      window.save = function () {
        oldSave();
        saveExt();
        scheduleSync(false);
      };
    }

    if (typeof oldCost === "function") {
      window.cost = function (type) {
        let value = oldCost(type);

        if (hasUpgrade(type, "discount")) {
          value = Math.max(1, Math.ceil(value * 0.8));
        }

        value = Math.ceil(value * (1 + (tier(type) - 1) * 0.15));

        return value;
      };
    }

    if (typeof oldCharge === "function") {
      window.charge = function (type) {
        const result = oldCharge(type);

        if (result) beginMultiplier();

        return result;
      };
    }

    if (typeof oldReward === "function") {
      window.reward = function (amount) {
        const type =
          typeof currentGame !== "undefined" && labels[currentGame]
            ? currentGame
            : "slot";

        let adjusted =
          amount * (prizeFor(type) / basePrizes[type]);

        if (hasUpgrade(type, "reward")) {
          adjusted *= 1.25;
        }

        adjusted *= ext.pendingSpinMultiplier || 1;

        ext.pendingSpinMultiplier = 1;
        saveExt();

        return oldReward(Math.round(adjusted));
      };
    }

    if (typeof oldActivate === "function") {
      window.activateItem = function (id) {
        const item = catalog.find(entry => entry.id === id);

        if (item?.kind === "spinMultiplier") {
          if (
            (Number(data.inventory[id]) || 0) <= 0 ||
            ext.nextSpinMultiplier !== 1
          ) {
            alert("Ya tenés un multiplicador preparado o no tenés unidades.");
            return;
          }

          data.inventory[id]--;
          ext.nextSpinMultiplier = item.value;

          saveExt();

          $x("useModal")?.classList.add("hidden");

          save();
          update();
          renderShop();

          alert(
            "Multiplicador ×" +
            item.value +
            " preparado para tu próxima jugada."
          );

          return;
        }

        oldActivate(id);
      };
    }

    window.openUseModal = function () {
      const list = $x("useList");
      if (!list) return;

      list.innerHTML = "";

      const owned = catalog.filter(item =>
        (Number(data.inventory[item.id]) || 0) > 0
      );

      if (!owned.length) {
        list.textContent =
          "NO TENÉS OBJETOS. COMPRALOS EN LA TIENDA.";
      }

      owned.forEach(item => {
        const row = document.createElement("div");
        row.className = "use-option";

        const label = document.createElement("span");
        label.textContent =
          item.name + " x" + (Number(data.inventory[item.id]) || 0);

        const button = document.createElement("button");
        button.textContent =
          item.kind === "spinMultiplier" ? "PREPARAR" : "ACTIVAR";

        button.addEventListener("click", () => {
          window.activateItem(item.id);
        });

        row.append(
          spriteCanvas(item.sprite, 42),
          label,
          button
        );

        list.appendChild(row);
      });

      $x("useModal").classList.remove("hidden");
    };

    if (typeof oldShow === "function") {
      window.showScreen = function (id) {
        oldShow(id);

        if (id === "menu") {
          addMachineTreeButtons();
        }
      };
    }

    if (typeof oldCheckScratch === "function") {
      window.checkScratch = function () {
        oldCheckScratch();

        if (
          typeof scratchDone !== "undefined" &&
          typeof scratchSymbols !== "undefined" &&
          scratchDone.filter(Boolean).length === 3
        ) {
          const [a, b, c] = scratchSymbols;

          if (!(a === b && b === c)) {
            ext.pendingSpinMultiplier = 1;
            saveExt();
          }
        }
      };
    }

    if (typeof oldBuyItem === "function") {
      window.buyItem = function (id) {
        oldBuyItem(id);
        scheduleSync(true);
      };
    }

    if (typeof oldBuySkill === "function") {
      window.buySkill = function (id) {
        oldBuySkill(id);
        scheduleSync(true);
      };
    }
  }

  /* ==========================================
     JUEGOS MEJORADOS
  ========================================== */

  function replaceGames() {
    window.spin = function () {
      if (busy || !charge("slot")) return;

      busy = true;

      const button = $x("spin");
      const machine = $x("slotGame")?.querySelector(".slot-machine");
      const reels = document.querySelectorAll("#slotGame .reel");

      if (!button || !machine || reels.length !== 3) {
        busy = false;
        return;
      }

      button.disabled = true;
      machine.classList.add("spinning");

      let count = 0;

      spinTimer = setInterval(() => {
        reels.forEach(reel => {
          reel.textContent =
            symbols[Math.floor(Math.random() * symbols.length)];
        });

        if (++count < 18) return;

        clearInterval(spinTimer);
        spinTimer = null;

        let result;

        if (Math.random() < chance("slot")) {
          const symbol =
            symbols[Math.floor(Math.random() * symbols.length)];

          result = [symbol, symbol, symbol];

        } else {
          result = Array.from(
            { length: 3 },
            () => symbols[Math.floor(Math.random() * symbols.length)]
          );

          if (
            result[0] === result[1] &&
            result[1] === result[2]
          ) {
            result[2] =
              symbols[(symbols.indexOf(result[2]) + 1) % symbols.length];
          }
        }

        reels.forEach((reel, index) => {
          reel.textContent = result[index];
        });

        const won =
          result[0] === result[1] &&
          result[1] === result[2];

        if (won) {
          reward(basePrizes.slot);
          $x("slotResult").textContent = "¡JACKPOT!";
        } else {
          $x("slotResult").textContent = "SIN PREMIO";
          ext.pendingSpinMultiplier = 1;
          saveExt();
        }

        machine.classList.remove("spinning");
        busy = false;
        button.disabled = false;

      }, isFast() ? 45 : 100);
    };

    window.createScratch = function () {
      const grid = $x("scratchGrid");
      if (!grid) return;

      const icons = [
        "7", "♦", "$", "★", "C",
        "J", "♣", "●", "◆", "♥"
      ];

      const pool = icons.slice(
        0,
        Math.min(icons.length, 5 + tier("scratch"))
      );

      const match = Math.random() < chance("scratch");

      scratchSymbols = match
        ? [pool[0], pool[0], pool[0]]
        : Array.from(
            { length: 3 },
            () => pool[Math.floor(Math.random() * pool.length)]
          );

      if (
        !match &&
        scratchSymbols[0] === scratchSymbols[1] &&
        scratchSymbols[1] === scratchSymbols[2]
      ) {
        scratchSymbols[2] =
          pool[(pool.indexOf(scratchSymbols[2]) + 1) % pool.length];
      }

      scratchDone = [false, false, false];

      grid.innerHTML = "";
      $x("scratchResult").textContent =
        "¡RASPÁ LOS TRES CUADROS!";

      scratchSymbols.forEach((symbol, index) => {
        const cell = document.createElement("div");
        cell.className = "scratch-cell";

        const revealed = document.createElement("div");
        revealed.className = "scratch-symbol";
        revealed.textContent = symbol;

        const canvas = document.createElement("canvas");

        cell.append(revealed, canvas);
        grid.appendChild(cell);

        const rect = cell.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          finishScratch(index, cell);
          return;
        }

        ctx.fillStyle = "#aaa9b5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#555";
        ctx.font = `bold ${12 * ratio}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "RASPAR",
          canvas.width / 2,
          canvas.height / 2
        );

        let drawing = false;
        let lastX = 0;
        let lastY = 0;
        let distance = 0;

        const position = event => {
          const bounds = canvas.getBoundingClientRect();

          return {
            x: (event.clientX - bounds.left) * ratio,
            y: (event.clientY - bounds.top) * ratio
          };
        };

        const erase = (x1, y1, x2, y2) => {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = (hasSkill("scratch") ? 58 : 38) * ratio;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        };

        const check = () => {
          if (scratchDone[index]) return;

          try {
            const pixels = ctx.getImageData(
              0, 0, canvas.width, canvas.height
            ).data;

            let clear = 0;
            let total = 0;

            for (let i = 3; i < pixels.length; i += 16) {
              total++;

              if (pixels[i] < 100) clear++;
            }

            if (total && clear / total >= 0.35) {
              finishScratch(index, cell);
            }

          } catch (error) {
            if (distance >= canvas.width * 2.5) {
              finishScratch(index, cell);
            }
          }
        };

        canvas.addEventListener("pointerdown", event => {
          if (scratchDone[index]) return;

          drawing = true;
          canvas.setPointerCapture(event.pointerId);

          const point = position(event);

          lastX = point.x;
          lastY = point.y;

          erase(point.x, point.y, point.x + 1, point.y + 1);
          check();
        });

        canvas.addEventListener("pointermove", event => {
          if (!drawing || scratchDone[index]) return;

          const point = position(event);

          erase(lastX, lastY, point.x, point.y);

          distance += Math.hypot(
            point.x - lastX,
            point.y - lastY
          );

          lastX = point.x;
          lastY = point.y;

          if (distance >= canvas.width * 2.5) {
            finishScratch(index, cell);
          } else if (distance % 100 < 15) {
            check();
          }
        });

        ["pointerup", "pointercancel"].forEach(eventName => {
          canvas.addEventListener(eventName, () => {
            drawing = false;
            check();
          });
        });
      });
    };

    window.rush = function () {
      if (busy || !charge("rush")) return;

      busy = true;

      const reel = $x("rushReel");

      if (!reel) {
        busy = false;
        return;
      }

      reel.disabled = true;
      reel.classList.add("rolling");

      let count = 0;

      spinTimer = setInterval(() => {
        reel.textContent =
          symbols[Math.floor(Math.random() * symbols.length)];

        if (++count < 18) return;

        clearInterval(spinTimer);
        spinTimer = null;

        reel.classList.remove("rolling");

        const won = Math.random() < chance("rush");

        if (won) {
          reward(basePrizes.rush);
          $x("rushResult").textContent = "¡GANASTE!";
        } else {
          $x("rushResult").textContent =
            "SIN PREMIO · ¡PROBÁ OTRA VEZ!";

          ext.pendingSpinMultiplier = 1;
          saveExt();
        }

        busy = false;
        reel.disabled = false;

      }, isFast() ? 45 : 100);
    };

    /* Reconectar los botones a las funciones nuevas. */
    const buttonIds = [
      ["spin", () => window.spin()],
      ["rushReel", () => window.rush()],
      ["newScratch", () => {
        if (typeof window.newScratch === "function") {
          window.newScratch();
        } else {
          console.error("No se encontró newScratch() en game.js.");
        }
      }]
    ];

    buttonIds.forEach(([id, action]) => {
      const button = $x(id);
      if (!button) return;

      const freshButton = button.cloneNode(true);
      button.replaceWith(freshButton);

      freshButton.addEventListener("click", action);
    });
  }

  /* ==========================================
     INICIO
  ========================================== */

  function init() {
    try {
      readExt();
      addMultiplierItems();
      addLeaderboardPage();
      addMachineTreePage();
      installOverrides();
      replaceGames();
      addMachineTreeButtons();
      connectSupabase();

      console.log("JOKER WORLDS EXPANSION cargada correctamente.");

    } catch (error) {
      console.error("Error iniciando JOKER WORLDS EXPANSION:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();
