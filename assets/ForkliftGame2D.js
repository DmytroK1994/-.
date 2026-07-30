(function (global) {
  "use strict";

  const STYLE_ID = "forkliftGame2DStyles";
  const STATS_KEY = "oblikForkliftGame2DStats";
  const TAU = Math.PI * 2;
  const MODE_CONFIGS = {
    transport: {
      name: "Між складами", target: 8,
      goal: "ЦІЛЬ: перевези 8 піддонів у зелену зону СКЛАДУ Б"
    },
    trailer: {
      name: "Завантаження фури", target: 33, trailer: true,
      goal: "став піддони у пронумеровані місця"
    },
    express: {
      name: "Експрес-зміна", target: 12, timeLimit: 420,
      goal: "ЕКСПРЕС: достав піддони до завершення зміни"
    },
    safety: {
      name: "Безпечна зміна", target: 10, strictSafety: true,
      goal: "БЕЗПЕЧНА ЗМІНА: достав 10 піддонів без жодного зіткнення"
    },
    maze: {
      name: "Складський лабіринт", target: 4, maze: true,
      goal: "СКЛАДСЬКИЙ ЛАБІРИНТ"
    }
  };
  const TRUCK_DESTINATIONS = ["Київ", "Львів", "Житомир", "Одеса", "Дніпро", "Харків", "Вінниця", "Черкаси", "Луцьк", "Тернопіль"];
  const PALLET_CATEGORIES = [
    { id: "raw", label: "СИРОВИНА", short: "СИРОВ." },
    { id: "pack", label: "ПАКУВАННЯ", short: "ПАКУВ." },
    { id: "finished", label: "ГОТОВА ПРОДУКЦІЯ", short: "ГП" }
  ];
  let activeGame = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .fg2-root{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#101a20;color:#f7fbfd;font-family:Inter,system-ui,-apple-system,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
      .fg2-root *{box-sizing:border-box;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
      .fg2-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
      .fg2-screen{position:absolute;inset:0;z-index:30;display:grid;padding:max(16px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));place-items:center;background:radial-gradient(circle at 50% 28%,rgba(64,153,176,.28),transparent 44%),linear-gradient(150deg,#152631,#071016 74%)}
      .fg2-screen.hidden,.fg2-hidden,.fg2-menu.hidden{display:none!important}
      .fg2-menu{width:min(100%,760px);max-height:100%;overflow:auto;padding:clamp(18px,3vw,30px);border:1px solid rgba(145,220,235,.24);border-radius:28px;background:linear-gradient(155deg,rgba(13,36,46,.97),rgba(4,13,19,.98));box-shadow:0 34px 110px rgba(0,0,0,.64),inset 0 1px rgba(255,255,255,.08)}
      .fg2-kicker{color:#72d5e4;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.fg2-menu h1{margin:6px 0 8px;font-size:clamp(27px,5vw,44px);line-height:1}.fg2-menu p{margin:0 0 16px;color:#bdcdd5;line-height:1.45}
      .fg2-menu-lead{max-width:620px}.fg2-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.fg2-mode{position:relative;display:grid;grid-template-columns:54px 1fr;align-items:center;gap:12px;width:100%;min-height:88px;padding:14px;border:1px solid rgba(255,255,255,.15);border-radius:19px;background:linear-gradient(145deg,#173642,#10252e);color:#fff;box-shadow:0 9px 24px rgba(0,0,0,.22);text-align:left;transition:transform .16s ease,border-color .16s ease,background .16s ease}.fg2-mode:hover{border-color:rgba(114,213,228,.58);background:linear-gradient(145deg,#1c4350,#14313b);transform:translateY(-2px)}.fg2-mode:active{background:#1b3b48;transform:scale(.985)}.fg2-mode-icon{display:grid;width:54px;height:54px;place-items:center;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:linear-gradient(145deg,#326878,#244852);font-size:28px;box-shadow:inset 0 1px rgba(255,255,255,.12)}.fg2-mode strong,.fg2-mode span{display:block}.fg2-mode-copy>span{margin-top:4px;color:#aec1ca;font-size:12px;line-height:1.3}.fg2-mode-level{position:absolute;top:8px;right:9px;padding:3px 7px;border-radius:999px;background:rgba(5,17,23,.68);color:#78d9e7!important;font-size:9px!important;font-weight:900;letter-spacing:.04em}
      .fg2-levels{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:16px}.fg2-level{position:relative;min-height:82px;border:1px solid rgba(255,255,255,.16);border-radius:17px;background:linear-gradient(145deg,#173642,#10252e);color:#fff;font-size:24px;font-weight:950}.fg2-level small{display:block;margin-top:4px;color:#9fb5bf;font-size:9px;letter-spacing:.05em;text-transform:uppercase}.fg2-level.current{border-color:#72d5e4;box-shadow:0 0 0 2px rgba(114,213,228,.16)}.fg2-level:disabled{border-color:rgba(255,255,255,.07);background:#0c1b22;color:#64767e;opacity:.72}.fg2-level-lock{display:block;font-size:16px}
      .fg2-vehicles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px}.fg2-vehicle{min-height:56px;padding:9px 11px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#102730;color:#fff;text-align:left}.fg2-vehicle strong,.fg2-vehicle span{display:block}.fg2-vehicle span{margin-top:3px;color:#aebfc7;font-size:10px}.fg2-vehicle.active{border-color:#e9bd4f;background:#29434c;box-shadow:0 0 0 2px rgba(233,189,79,.15)}
      .fg2-stats{margin-top:12px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04)}.fg2-stats summary{padding:10px 12px;cursor:pointer;color:#c8d8df;font-size:12px;font-weight:900;list-style:none}.fg2-stats summary::-webkit-details-marker{display:none}.fg2-stats summary::after{content:"⌄";float:right;font-size:16px}.fg2-stats[open] summary::after{content:"⌃"}.fg2-records{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:0 9px 9px}.fg2-record{padding:8px;border-radius:12px;background:rgba(255,255,255,.07);text-align:center}.fg2-record strong,.fg2-record span{display:block}.fg2-record span{margin-top:2px;color:#a8bbc4;font-size:9px;font-weight:800}
      .fg2-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.fg2-btn{flex:1;min-width:120px;min-height:42px;padding:8px 12px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:#1a303a;color:#fff;font-weight:900}.fg2-btn.primary{background:#e9bd4f;color:#162027}.fg2-btn.danger{background:#53272a}
      .fg2-hud{position:absolute;top:max(9px,env(safe-area-inset-top));left:9px;right:82px;z-index:12;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;pointer-events:none}.fg2-hud-items{display:flex;flex-wrap:wrap;gap:5px}.fg2-chip{min-width:72px;padding:6px 8px;border:1px solid rgba(255,255,255,.17);border-radius:11px;background:rgba(7,18,24,.82);box-shadow:0 7px 20px rgba(0,0,0,.25)}.fg2-chip span,.fg2-chip strong{display:block}.fg2-chip span{color:#a9bbc4;font-size:8px;font-weight:900;text-transform:uppercase}.fg2-chip strong{margin-top:1px;font-size:13px}
      .fg2-goal{position:absolute;top:max(63px,calc(env(safe-area-inset-top) + 54px));left:9px;z-index:11;width:min(42vw,360px);padding:6px 9px;border:1px solid rgba(121,238,157,.38);border-radius:10px;background:rgba(9,37,25,.88);font-size:9px;font-weight:900;line-height:1.25;text-align:left;pointer-events:none}
      .fg2-pause{position:absolute;top:max(9px,env(safe-area-inset-top));right:9px;z-index:14;width:66px;height:42px;border:1px solid rgba(255,255,255,.19);border-radius:12px;background:rgba(7,18,24,.88);color:#fff;font-size:11px;font-weight:900}
      .fg2-notices{position:absolute;top:max(116px,calc(env(safe-area-inset-top) + 107px));left:9px;z-index:45;display:grid;gap:3px;width:min(34vw,280px);pointer-events:none}.fg2-notice{padding:5px 8px;border-radius:9px;background:rgba(11,31,40,.92);box-shadow:0 7px 18px rgba(0,0,0,.3);font-size:9px;font-weight:900;line-height:1.2;text-align:left;animation:fg2Notice 1.8s both}.fg2-notice.bad{background:rgba(104,32,36,.93)}.fg2-notice.good{background:rgba(20,91,62,.93)}@keyframes fg2Notice{0%{opacity:0;transform:translateX(-7px)}12%,75%{opacity:1;transform:none}100%{opacity:0;transform:translateX(-5px)}}
      .fg2-controls{position:absolute;left:50%;bottom:max(8px,env(safe-area-inset-bottom));z-index:15;display:none;width:min(82%,700px);align-items:end;justify-content:space-between;pointer-events:none;transform:translateX(-50%)}
      .fg2-left{display:grid;justify-items:center;gap:6px;pointer-events:auto}
      .fg2-joystick{position:relative;width:126px;height:126px;border:2px solid rgba(255,255,255,.35);border-radius:50%;background:rgba(8,25,33,.62);box-shadow:inset 0 0 0 12px rgba(2,9,13,.26);pointer-events:auto;touch-action:none}.fg2-joystick::before,.fg2-joystick::after{content:"";position:absolute;background:rgba(255,255,255,.14)}.fg2-joystick::before{top:50%;left:12%;right:12%;height:1px}.fg2-joystick::after{top:12%;bottom:12%;left:50%;width:1px}.fg2-stick{position:absolute;top:50%;left:50%;width:52px;height:52px;border:2px solid rgba(255,255,255,.45);border-radius:50%;background:#e8ba48;box-shadow:0 6px 16px rgba(0,0,0,.35);transform:translate(-50%,-50%)}
      .fg2-right{display:grid;grid-template-columns:58px 58px;gap:7px;pointer-events:auto}.fg2-control{display:grid;width:58px;height:48px;padding:3px;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:14px;background:rgba(11,31,40,.86);color:#fff;font-size:9px;font-weight:900;line-height:1.05;text-align:center;touch-action:none}.fg2-control:active,.fg2-control.active{background:#efc14f;color:#172027;transform:scale(.96)}.fg2-control.horn{background:#315d6b}.fg2-control.reverse,.fg2-control.speed-mode{width:108px;height:34px;background:rgba(39,69,80,.92)}.fg2-control.reverse.active,.fg2-control.speed-mode.active{background:#efc14f;color:#172027}.fg2-control.wide{grid-column:1/3;width:123px}
      .fg2-zoom-tip{position:absolute;right:18px;bottom:123px;z-index:8;padding:5px 8px;border-radius:9px;background:rgba(5,15,21,.62);color:#c5d5dc;font-size:9px;font-weight:800;pointer-events:none;animation:fg2Tip 5s both}@keyframes fg2Tip{0%,75%{opacity:.85}100%{opacity:0}}
      .fg2-rotate{display:none;position:absolute;inset:0;z-index:60;padding:22px;place-items:center;background:#071018;text-align:center;pointer-events:none;animation:fg2RotateHint 5s forwards}.fg2-rotate strong{display:block;font-size:45px}.fg2-rotate span{display:block;margin-top:8px;font-weight:900}@keyframes fg2RotateHint{0%,78%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}
      @media(pointer:coarse),(max-width:900px){.fg2-controls{display:flex}}
      @media(max-width:700px){.fg2-controls{width:84%}.fg2-joystick{width:112px;height:112px}.fg2-stick{width:47px;height:47px}.fg2-chip{min-width:58px;padding:5px 6px}.fg2-chip strong{font-size:10px}.fg2-records{grid-template-columns:1fr}.fg2-modes{grid-template-columns:1fr}.fg2-levels{grid-template-columns:repeat(5,minmax(48px,1fr))}.fg2-level{min-height:64px;font-size:19px}.fg2-menu{border-radius:22px}.fg2-mode{min-height:78px}.fg2-goal{width:min(52vw,300px)}.fg2-notices{width:min(46vw,240px)}}
      @media(pointer:coarse) and (orientation:portrait){.fg2-root.playing .fg2-rotate{display:grid}}
    `;
    document.head.appendChild(style);
  }

  function loadStats() {
    try {
      const value = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      return {
        bestTrailer: Number(value.bestTrailer) || 0,
        bestScore: Number(value.bestScore) || 0,
        total: Number(value.total) || 0,
        levels: value.levels && typeof value.levels === "object" ? value.levels : {},
        lastPlayed: value.lastPlayed && typeof value.lastPlayed === "object" ? value.lastPlayed : {}
      };
    } catch (error) {
      return { bestTrailer: 0, bestScore: 0, total: 0, levels: {}, lastPlayed: {} };
    }
  }

  function saveStats(stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (error) {}
  }

  function timeText(seconds) {
    const value = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function angleDelta(from, to) {
    let value = (to - from + Math.PI) % TAU - Math.PI;
    if (value < -Math.PI) value += TAU;
    return value;
  }

  function circleRect(x, y, radius, rect) {
    const nearX = clamp(x, rect.x, rect.x + rect.w);
    const nearY = clamp(y, rect.y, rect.y + rect.h);
    return Math.hypot(x - nearX, y - nearY) < radius;
  }

  class Game2D {
    constructor(options) {
      this.options = options || {};
      this.stats = loadStats();
      this.root = null;
      this.canvas = null;
      this.ctx = null;
      this.mode = "";
      this.modeConfig = MODE_CONFIGS.transport;
      this.running = false;
      this.paused = false;
      this.destroyed = false;
      this.over = false;
      this.lastFrame = 0;
      this.raf = 0;
      this.elapsed = 0;
      this.score = 1000;
      this.integrity = 100;
      this.delivered = 0;
      this.target = 8;
      this.level = 1;
      this.levelRules = {};
      this.playerVehicle = "pallet";
      this.forkliftSpeedMode = "slow";
      this.reverse = false;
      this.speedBoostUntil = 0;
      this.shieldBoostUntil = 0;
      this.boosts = [];
      this.speechBubbles = [];
      this.lastDriverComplaint = 0;
      this.trailerTransition = null;
      this.truckQueueTotal = 10;
      this.trucksRequired = 1;
      this.trucksCompleted = 0;
      this.trailerAwaitingDeparture = false;
      this.trailerShortage = 0;
      this.trafficLight = "red";
      this.trailerSafeZone = { x: 875, y: 955, w: 145, h: 245 };
      this.truckDestinations = [];
      this.currentTruckDestination = "";
      this.wrongDeliveries = 0;
      this.totalPalletsCreated = 0;
      this.supplyLimit = 0;
      this.mazePlate = null;
      this.mazeGate = null;
      this.mazeGateOpen = false;
      this.zoom = .72;
      this.pinch = 0;
      this.viewPointers = new Map();
      this.keys = new Set();
      this.joystick = { x: 0, y: 0, pointer: null };
      this.controls = { lift: false, lower: false };
      this.vehicle = { x: 590, y: 700, angle: 0, speed: 0, radius: 29, forksUp: false, carrying: null };
      this.world = { w: 2200, h: 1400 };
      this.source = { x: 80, y: 455, w: 360, h: 490 };
      this.destination = { x: 1740, y: 470, w: 360, h: 460 };
      this.stagingZone = { x: 330, y: 950, w: 310, h: 330 };
      this.trailer = { x: 1050, y: 500, w: 920, h: 390 };
      this.obstacles = [];
      this.pallets = [];
      this.workers = [];
      this.bot = null;
      this.botScore = 0;
      this.botRackPoints = [];
      this.botStageSlots = [];
      this.botStagedPallets = [];
      this.slots = [];
      this.trailerRound = 1;
      this.incident = null;
      this.audio = null;
      this.lastHornNotice = -Infinity;
      this.lastDamageAt = -Infinity;
      this.resizeHandler = () => this.resize();
      this.keyDownHandler = event => this.onKey(event, true);
      this.keyUpHandler = event => this.onKey(event, false);
    }

    mount() {
      injectStyles();
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.root = document.createElement("div");
      this.root.className = "fg2-root";
      this.root.innerHTML = `
        <canvas class="fg2-canvas"></canvas>
        <div class="fg2-hud fg2-hidden">
          <div class="fg2-hud-items">
            <div class="fg2-chip"><span>Рівень</span><strong data-fg2="level">1</strong></div>
            <div class="fg2-chip"><span>Час</span><strong data-fg2="time">00:00</strong></div>
            <div class="fg2-chip"><span>Піддони</span><strong data-fg2="delivery">0 / 8</strong></div>
            <div class="fg2-chip"><span>Бали</span><strong data-fg2="score">1000</strong></div>
            <div class="fg2-chip"><span>Вантаж</span><strong data-fg2="integrity">100%</strong></div>
            <div class="fg2-chip"><span>Техніка</span><strong data-fg2="vehicle">Електровізок</strong></div>
            <div class="fg2-chip fg2-hidden" data-fg2="boost-chip"><span>Буст</span><strong data-fg2="boost">—</strong></div>
          </div>
        </div>
        <div class="fg2-goal fg2-hidden" data-fg2="goal"></div>
        <div class="fg2-notices"></div>
        <button class="fg2-pause fg2-hidden">☰ Пауза</button>
        <div class="fg2-zoom-tip fg2-hidden">Два пальці — масштаб</div>
        <div class="fg2-controls fg2-hidden">
          <div class="fg2-left">
            <div class="fg2-joystick" aria-label="Джойстик руху"><span class="fg2-stick"></span></div>
            <button class="fg2-control reverse" data-control="reverse">Реверс: вимк.</button>
            <button class="fg2-control speed-mode fg2-hidden" data-control="speed">🐢 Черепашка</button>
          </div>
          <div class="fg2-right">
            <button class="fg2-control" data-control="lift">Підняти<br>вила</button>
            <button class="fg2-control" data-control="lower">Опустити<br>вила</button>
            <button class="fg2-control horn wide" data-control="horn">📣 Сигнал</button>
          </div>
        </div>
        <div class="fg2-rotate"><div><strong>↻</strong><span>Поверни телефон горизонтально</span></div></div>
        <div class="fg2-screen">
          <div class="fg2-menu fg2-mode-menu">
            <div class="fg2-kicker">Обери робочу зміну</div>
            <h1>Симулятор транспортувальника</h1>
            <p class="fg2-menu-lead">П’ять режимів, поступове ускладнення рівнів і різні правила проходження.</p>
            <div class="fg2-modes">
              <button class="fg2-mode" data-mode="transport"><span class="fg2-mode-icon">🏭</span><span class="fg2-mode-copy"><strong>Між складами</strong><span>Перевозь піддони через дедалі складніші маршрути.</span></span><span class="fg2-mode-level">ВІДКРИТО ${clamp(Number(this.stats.levels.transport) || 1, 1, 10)}/10</span></button>
              <button class="fg2-mode" data-mode="trailer"><span class="fg2-mode-icon">🚛</span><span class="fg2-mode-copy"><strong>Завантаження фури</strong><span>33 місця, безпечний виїзд і до двох фур за рівень.</span></span><span class="fg2-mode-level">ВІДКРИТО ${clamp(Number(this.stats.levels.trailer) || 1, 1, 10)}/10</span></button>
              <button class="fg2-mode" data-mode="express"><span class="fg2-mode-icon">⏱️</span><span class="fg2-mode-copy"><strong>Експрес-зміна</strong><span>Реалістичний запас часу та зростання обсягу роботи.</span></span><span class="fg2-mode-level">ВІДКРИТО ${clamp(Number(this.stats.levels.express) || 1, 1, 10)}/10</span></button>
              <button class="fg2-mode" data-mode="safety"><span class="fg2-mode-icon">🦺</span><span class="fg2-mode-copy"><strong>Безпечна зміна</strong><span>Складні маршрути без небезпечних зіткнень.</span></span><span class="fg2-mode-level">ВІДКРИТО ${clamp(Number(this.stats.levels.safety) || 1, 1, 10)}/10</span></button>
              <button class="fg2-mode" data-mode="maze"><span class="fg2-mode-icon">🧩</span><span class="fg2-mode-copy"><strong>Великий лабіринт</strong><span>Знайди маршрут, активуй прохід і достав вантаж.</span></span><span class="fg2-mode-level">ВІДКРИТО ${clamp(Number(this.stats.levels.maze) || 1, 1, 10)}/10</span></button>
            </div>
            <details class="fg2-stats">
              <summary>Статистика гри</summary>
              <div class="fg2-records">
                <div class="fg2-record"><strong>${this.stats.bestTrailer ? timeText(this.stats.bestTrailer) : "—"}</strong><span>найкраща фура</span></div>
                <div class="fg2-record"><strong>${this.stats.total}</strong><span>усього піддонів</span></div>
                <div class="fg2-record"><strong>${this.stats.bestScore}</strong><span>найкращі бали</span></div>
              </div>
            </details>
            <div class="fg2-actions"><button class="fg2-btn" data-menu="help">Керування</button><button class="fg2-btn danger" data-menu="exit">Вийти</button></div>
          </div>
          <div class="fg2-menu fg2-level-menu hidden">
            <div class="fg2-kicker">Обери рівень</div>
            <h1 data-level-title>Режим гри</h1>
            <p data-level-description>Пройдені рівні можна запускати повторно.</p>
            <div class="fg2-vehicles" aria-label="Вибір техніки">
              <button class="fg2-vehicle active" data-vehicle="pallet"><strong>Електровізок</strong><span>Точне й спокійне керування</span></button>
              <button class="fg2-vehicle" data-vehicle="forklift"><strong>Кара</strong><span>Швидка техніка: Черепашка / Заєць</span></button>
            </div>
            <div class="fg2-levels" data-level-list></div>
            <div class="fg2-actions"><button class="fg2-btn" data-level-back>Назад до режимів</button></div>
          </div>
        </div>`;
      document.body.appendChild(this.root);
      this.canvas = this.root.querySelector(".fg2-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.root.addEventListener("contextmenu", event => event.preventDefault());
      this.root.addEventListener("selectstart", event => event.preventDefault());
      this.bindMenuActions();
      this.root.querySelector(".fg2-pause").addEventListener("click", () => this.pauseMenu());
      this.resize();
      return this;
    }

    bindMenuActions(scope) {
      const root = scope || this.root;
      root.querySelectorAll("[data-mode]").forEach(button =>
        button.addEventListener("click", () => this.showLevelSelect(button.dataset.mode))
      );
      root.querySelectorAll("[data-menu='exit']").forEach(button =>
        button.addEventListener("click", () => this.destroy())
      );
      root.querySelector("[data-menu='help']")?.addEventListener("click", () => this.helpScreen());
      root.querySelectorAll("[data-vehicle]").forEach(button =>
        button.addEventListener("click", () => {
          this.playerVehicle = button.dataset.vehicle === "forklift" ? "forklift" : "pallet";
          root.querySelectorAll("[data-vehicle]").forEach(item =>
            item.classList.toggle("active", item.dataset.vehicle === this.playerVehicle)
          );
        })
      );
      root.querySelector("[data-level-back]")?.addEventListener("click", () => {
        root.querySelector(".fg2-level-menu")?.classList.add("hidden");
        root.querySelector(".fg2-mode-menu")?.classList.remove("hidden");
      });
    }

    showLevelSelect(mode) {
      if (!MODE_CONFIGS[mode]) return;
      const screen = this.root.querySelector(".fg2-screen");
      const modeMenu = screen.querySelector(".fg2-mode-menu");
      const levelMenu = screen.querySelector(".fg2-level-menu");
      const unlocked = clamp(Number(this.stats.levels[mode]) || 1, 1, 10);
      const lastPlayed = clamp(Number(this.stats.lastPlayed?.[mode]) || unlocked, 1, unlocked);
      levelMenu.querySelector("[data-level-title]").textContent = MODE_CONFIGS[mode].name;
      levelMenu.querySelector("[data-level-description]").textContent =
        `Відкрито рівнів: ${unlocked} із 10. Пройдені рівні можна запускати повторно.`;
      levelMenu.querySelectorAll("[data-vehicle]").forEach(item =>
        item.classList.toggle("active", item.dataset.vehicle === this.playerVehicle)
      );
      const list = levelMenu.querySelector("[data-level-list]");
      list.innerHTML = Array.from({ length: 10 }, (_, index) => {
        const level = index + 1;
        const locked = level > unlocked;
        const current = level === lastPlayed;
        return `<button class="fg2-level${current ? " current" : ""}" data-level="${level}"${locked ? " disabled" : ""}>
          ${locked ? '<span class="fg2-level-lock">🔒</span>' : level}
          <small>${locked ? "закрито" : current ? "останній" : level < unlocked ? "пройдено" : "доступно"}</small>
        </button>`;
      }).join("");
      list.querySelectorAll("[data-level]:not([disabled])").forEach(button =>
        button.addEventListener("click", () => this.start(mode, Number(button.dataset.level)))
      );
      modeMenu.classList.add("hidden");
      levelMenu.classList.remove("hidden");
    }

    enterLandscape() {
      if (!matchMedia("(pointer: coarse)").matches) return;
      const lock = () => {
        try { screen.orientation?.lock?.("landscape")?.catch?.(() => {}); } catch (error) {}
      };
      try {
        if (!document.fullscreenElement && this.root.requestFullscreen) {
          this.root.requestFullscreen({ navigationUI: "hide" })?.then?.(lock).catch?.(lock);
        } else lock();
      } catch (error) { lock(); }
    }

    start(mode, forcedLevel) {
      if (this.running) return;
      this.mode = MODE_CONFIGS[mode] ? mode : "transport";
      this.modeConfig = MODE_CONFIGS[this.mode];
      const unlocked = clamp(Number(this.stats.levels[this.mode]) || 1, 1, 10);
      this.level = clamp(Number(forcedLevel) || unlocked, 1, unlocked);
      this.stats.lastPlayed[this.mode] = this.level;
      saveStats(this.stats);
      this.configureLevel();
      this.vehicle.radius = this.playerVehicle === "forklift" ? 34 : 29;
      this.forkliftSpeedMode = "slow";
      this.root.classList.add("playing");
      this.enterLandscape();
      this.buildWorld();
      this.bindControls();
      this.initAudio();
      this.root.querySelector(".fg2-screen").classList.add("hidden");
      this.root.querySelectorAll(".fg2-hud,.fg2-goal,.fg2-pause,.fg2-controls,.fg2-zoom-tip").forEach(element => element.classList.remove("fg2-hidden"));
      this.root.querySelector("[data-fg2='delivery']").textContent = `0 / ${this.target}`;
      this.root.querySelector("[data-fg2='level']").textContent = String(this.level);
      this.root.querySelector("[data-fg2='goal']").textContent = this.levelGoalText();
      const speedButton = this.root.querySelector("[data-control='speed']");
      speedButton?.classList.toggle("fg2-hidden", this.playerVehicle !== "forklift");
      if (speedButton) speedButton.textContent = "🐢 Черепашка";
      this.running = true;
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(time => this.frame(time));
    }

    configureLevel() {
      const cycle = (this.level - 1) % 5;
      const expressLimit = 420 + Math.min(180, (this.level - 1) * 20);
      const challengeLimit = cycle === 1
        ? (this.modeConfig.trailer ? 720 + Math.min(180, this.level * 15) : 360 + Math.min(180, this.level * 12))
        : 0;
      this.levelRules = {
        timeLimit: this.modeConfig.timeLimit ? expressLimit : challengeLimit,
        strictSafety: Boolean(this.modeConfig.strictSafety || cycle === 3),
        maze: Boolean(this.modeConfig.maze),
        mazeComplexity: Math.min(4, 1 + Math.floor((this.level - 1) / 2)),
        sparseBoosts: this.level % 3 === 0
      };
      this.target = this.modeConfig.trailer
        ? 33
        : this.modeConfig.target + Math.min(10, Math.floor((this.level - 1) / 2) * 2);
      this.trucksRequired = this.modeConfig.trailer ? Math.min(2, 1 + Math.floor((this.level - 1) / 3)) : 1;
      this.trucksCompleted = 0;
      this.truckQueueTotal = Math.max(this.trucksRequired + 2, 10 - ((this.level - 1) % 7));
      this.trailerRound = 1;
      this.trailerAwaitingDeparture = false;
      this.trailerShortage = 0;
      this.trafficLight = "red";
      this.truckDestinations = Array.from({ length: this.trucksRequired }, (_, index) =>
        TRUCK_DESTINATIONS[((this.level - 1) * 2 + index) % TRUCK_DESTINATIONS.length]
      );
      this.currentTruckDestination = this.truckDestinations[0] || "";
      this.wrongDeliveries = 0;
      this.totalPalletsCreated = 0;
      this.supplyLimit = this.modeConfig.trailer
        ? Math.ceil(this.target * 1.5) + 6
        : this.target + Math.max(2, 6 - Math.floor(this.level / 3));
    }

    palletDestination(sequenceIndex) {
      if (!this.modeConfig.trailer) return "";
      const index = Number(sequenceIndex) || 0;
      if (index % 3 !== 2) return this.currentTruckDestination;
      const alternatives = TRUCK_DESTINATIONS.filter(city => city !== this.currentTruckDestination);
      return alternatives[(index + this.level + this.trucksCompleted) % alternatives.length]
        || this.currentTruckDestination;
    }

    palletCategory(sequenceIndex) {
      return PALLET_CATEGORIES[(Number(sequenceIndex) || 0) % PALLET_CATEGORIES.length];
    }

    levelGoalText() {
      const prefix = this.modeConfig.trailer
        ? `ФУРА ${Math.min(this.trucksCompleted + 1, this.trucksRequired)}/${this.trucksRequired} · ${this.currentTruckDestination.toUpperCase()} · `
        : "";
      const rules = [];
      if (this.levelRules.timeLimit) rules.push(`час ${timeText(this.levelRules.timeLimit)}`);
      if (this.levelRules.strictSafety) rules.push("без зіткнень");
      if (this.levelRules.sparseBoosts) rules.push("мало бустів");
      return `${prefix}${this.modeConfig.goal}${rules.length ? ` · ${rules.join(" · ")}` : ""}`;
    }

    buildWorld() {
      const racks = [
        { x: 710, y: 170, w: 150, h: 390, type: "rack" },
        { x: 710, y: 840, w: 150, h: 390, type: "rack" },
        { x: 1030, y: 170, w: 150, h: 390, type: "rack" },
        { x: 1030, y: 840, w: 150, h: 390, type: "rack" },
        { x: 1350, y: 170, w: 150, h: 390, type: "rack" },
        { x: 1350, y: 840, w: 150, h: 390, type: "rack" }
      ];
      if (this.levelRules.maze) {
        const extraMazeWalls = this.levelRules.mazeComplexity >= 2
          ? [
              { x: 930, y: 1030, w: 360, h: 42, type: "maze-wall" },
              { x: 1260, y: 300, w: 42, h: 430, type: "maze-wall" }
            ]
          : [];
        const expertMazeWalls = this.levelRules.mazeComplexity >= 3
          ? [
              { x: 1510, y: 870, w: 420, h: 42, type: "maze-wall" },
              { x: 1760, y: 240, w: 42, h: 430, type: "maze-wall" }
            ]
          : [];
        this.obstacles = [
          { x: 790, y: 0, w: 45, h: 520, type: "maze-wall" },
          { x: 790, y: 520, w: 45, h: 300, type: "maze-gate" },
          { x: 790, y: 820, w: 45, h: 580, type: "maze-wall" },
          { x: 930, y: 180, w: 430, h: 42, type: "maze-wall" },
          { x: 1080, y: 430, w: 42, h: 470, type: "maze-wall" },
          { x: 1080, y: 900, w: 430, h: 42, type: "maze-wall" },
          { x: 1340, y: 0, w: 45, h: 520, type: "maze-wall" },
          { x: 1340, y: 740, w: 45, h: 380, type: "maze-wall" },
          { x: 1510, y: 250, w: 390, h: 42, type: "maze-wall" },
          { x: 1510, y: 540, w: 42, h: 610, type: "maze-wall" },
          { x: 1770, y: 1120, w: 370, h: 42, type: "maze-wall" },
          ...extraMazeWalls,
          ...expertMazeWalls
        ];
        this.mazeGate = this.obstacles.find(rect => rect.type === "maze-gate");
        this.mazePlate = { x: 655, y: 1080, radius: 48 };
        this.mazeGateOpen = false;
      } else {
        this.mazeGate = null;
        this.mazePlate = null;
        this.mazeGateOpen = false;
        this.obstacles = this.modeConfig.trailer
          ? racks.filter(rect => rect.x === 710)
          : racks;
      }
      if (this.modeConfig.trailer) {
        this.obstacles.push(
          { x: this.trailer.x, y: this.trailer.y, w: this.trailer.w, h: 34, type: "trailer-wall" },
          { x: this.trailer.x, y: this.trailer.y + this.trailer.h - 34, w: this.trailer.w, h: 34, type: "trailer-wall" },
          { x: this.trailer.x + this.trailer.w - 34, y: this.trailer.y, w: 34, h: this.trailer.h, type: "trailer-wall" },
          { x: this.trailer.x + this.trailer.w, y: this.trailer.y + 34, w: 170, h: this.trailer.h - 68, type: "trailer-cab" },
          { x: 0, y: 435, w: 2200, h: 28, type: "outside-wall" }
        );
        this.driver = {
          x: this.trailer.x + this.trailer.w + 82,
          y: this.trailer.y + this.trailer.h / 2
        };
      } else {
        this.driver = null;
      }
      this.pallets = [];
      for (let index = 0; index < Math.min(12, this.supplyLimit); index++) {
        const point = this.randomPalletPoint();
        this.pallets.push({
          id: `p${index}`, x: point.x, y: point.y,
          carried: false, delivered: false, slotId: null, damage: 0, awarded: false,
          destroyedPenalty: false, wrongPenaltyApplied: false, wrongInTruck: false,
          destination: this.palletDestination(index),
          category: this.palletCategory(index),
          color: index % 3 === 0 ? "#8bc5dc" : "#d39a55"
        });
        this.totalPalletsCreated += 1;
      }
      if (this.levelRules.maze && this.pallets[0]) {
        this.pallets[0].x = 585;
        this.pallets[0].y = 1080;
      }
      this.slots = [];
      if (this.modeConfig.trailer) {
        // Починаємо від голови фури, щоб дальні місця завантажувалися першими.
        for (let column = 10; column >= 0; column--) {
          for (let row = 0; row < 3; row++) {
            this.slots.push({
              id: (10 - column) * 3 + row + 1,
              x: this.trailer.x + 60 + column * 79,
              y: this.trailer.y + 65 + row * 115,
              occupied: false,
              category: null
            });
          }
        }
      } else {
        const columns = this.target > 12 ? 4 : 3;
        const rows = Math.ceil(this.target / columns);
        const xGap = columns > 1 ? 250 / (columns - 1) : 0;
        const yGap = rows > 1 ? 330 / (rows - 1) : 0;
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns && this.slots.length < this.target; column++) {
            this.slots.push({
              id: row * columns + column + 1,
              x: this.destination.x + 55 + column * xGap,
              y: this.destination.y + 65 + row * yGap,
              occupied: false,
              category: this.palletCategory(row * columns + column)
            });
          }
        }
      }
      this.workers = Array.from({ length: 9 }, (_, index) => {
        const point = this.randomWorkerPoint(false);
        return {
          x: point.x, y: point.y, targetX: point.x, targetY: point.y,
          speed: 42 + Math.random() * 24,
          color: index % 2 ? "#4d82aa" : "#5a926a",
          phase: Math.random() * TAU,
          avoidUntil: 0,
          awayUntil: 0,
          stuckFor: 0,
          aware: Math.random() > .1
        };
      });
      this.workers.forEach(worker => {
        const target = this.randomReachableWorkerPoint(worker, false);
        worker.targetX = target.x;
        worker.targetY = target.y;
      });
      this.botRackPoints = [
        { x: 650, y: 275 },
        { x: 650, y: 455 },
        { x: 650, y: 930 },
        { x: 650, y: 1110 }
      ].filter(point => !this.obstacles.some(rect => circleRect(point.x, point.y, 34, rect)));
      this.botStageSlots = Array.from({ length: 9 }, (_, index) => ({
        x: 380 + (index % 3) * 105,
        y: 1000 + Math.floor(index / 3) * 90,
        category: this.palletCategory(index % 3)
      }));
      this.botStagedPallets = [];
      this.bot = {
        x: 520, y: 1300, angle: 0, targetX: 650, targetY: 1110,
        speed: 58, speedBoostUntil: 0, task: "rack", carrying: false,
        rackIndex: 0, stageIndex: 0, path: [], pathKey: "", blockedFor: 0,
        cargoDestination: "", cargoCategory: null, waitNoticeAt: -Infinity,
        hornAt: -Infinity
      };
      this.bot.carrying = false;
      this.bot.beacon = 0;
      this.spawnBoosts();
    }

    randomAislePoint(radius) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const minY = this.modeConfig.trailer ? 495 : 65;
        const point = { x: 480 + Math.random() * 1070, y: minY + Math.random() * (1335 - minY) };
        const blocked = this.obstacles.some(rect => circleRect(point.x, point.y, radius || 18, rect));
        const onPallet = this.pallets.some(pallet => !pallet.carried && Math.hypot(point.x - pallet.x, point.y - pallet.y) < 55);
        const insideTrailer = this.modeConfig.trailer
          && point.x > this.trailer.x - 20
          && point.x < this.trailer.x + this.trailer.w + 180
          && point.y > this.trailer.y - 20
          && point.y < this.trailer.y + this.trailer.h + 20;
        if (!blocked && !onPallet && !insideTrailer) return point;
      }
      return { x: 550, y: 700 };
    }

    randomWorkerPoint(allowMainAisle) {
      if (allowMainAisle) {
        for (let attempt = 0; attempt < 40; attempt++) {
          const point = {
            x: 500 + Math.random() * 1080,
            y: 625 + Math.random() * 150
          };
          const blocked = this.obstacles.some(obstacle => circleRect(point.x, point.y, 18, obstacle));
          const insideTrailer = this.modeConfig.trailer
            && point.x > this.trailer.x - 25
            && point.x < this.trailer.x + this.trailer.w + 180
            && point.y > this.trailer.y - 25
            && point.y < this.trailer.y + this.trailer.h + 25;
          const insideClosedYard = this.modeConfig.trailer && point.y < 480;
          if (!blocked && !insideTrailer && !insideClosedYard) return point;
        }
      }
      const pedestrianObstacles = this.obstacles.filter(rect =>
        rect.type === "rack" || rect.type === "maze-wall"
      );
      for (let attempt = 0; attempt < 70 && pedestrianObstacles.length; attempt++) {
        const rect = pedestrianObstacles[Math.floor(Math.random() * pedestrianObstacles.length)];
        const verticalSide = Math.random() < .5;
        const side = Math.random() < .5 ? -1 : 1;
        const clearance = 36 + Math.random() * 18;
        const point = verticalSide
          ? {
              x: side < 0 ? rect.x - clearance : rect.x + rect.w + clearance,
              y: rect.y + 30 + Math.random() * Math.max(20, rect.h - 60)
            }
          : {
              x: rect.x + 30 + Math.random() * Math.max(20, rect.w - 60),
              y: side < 0 ? rect.y - clearance : rect.y + rect.h + clearance
            };
        point.x = clamp(point.x, 45, this.world.w - 45);
        point.y = clamp(point.y, 45, this.world.h - 45);
        const blocked = this.obstacles.some(obstacle => circleRect(point.x, point.y, 18, obstacle));
        const insideTrailer = this.modeConfig.trailer
          && point.x > this.trailer.x - 25
          && point.x < this.trailer.x + this.trailer.w + 180
          && point.y > this.trailer.y - 25
          && point.y < this.trailer.y + this.trailer.h + 25;
        const insideSafeZone = this.modeConfig.trailer
          && circleRect(point.x, point.y, 24, this.trailerSafeZone);
        const inMainLane = point.x > 455 && point.x < 1630 && point.y > 585 && point.y < 815;
        const insideClosedYard = this.modeConfig.trailer && point.y < 480;
        if (!blocked && !insideTrailer && !insideSafeZone && !inMainLane && !insideClosedYard) return point;
      }
      return this.randomAislePoint(18);
    }

    workerStaticPointBlocked(x, y) {
      if (x < 28 || x > this.world.w - 28 || y < 28 || y > this.world.h - 28) return true;
      if (this.obstacles.some(rect => circleRect(x, y, 18, rect))) return true;
      const insideTrailer = this.modeConfig.trailer
        && x > this.trailer.x - 12
        && x < this.trailer.x + this.trailer.w + 175
        && y > this.trailer.y - 12
        && y < this.trailer.y + this.trailer.h + 12;
      const insideSafeZone = this.modeConfig.trailer && circleRect(x, y, 18, this.trailerSafeZone);
      const insideStagingZone = circleRect(x, y, 18, this.stagingZone);
      const insideClosedYard = this.modeConfig.trailer && y < 480;
      return insideTrailer || insideSafeZone || insideStagingZone || insideClosedYard;
    }

    workerPathClear(worker, target) {
      const dx = target.x - worker.x;
      const dy = target.y - worker.y;
      const length = Math.hypot(dx, dy);
      if (!length) return true;
      const steps = Math.max(1, Math.ceil(length / 20));
      for (let index = 1; index <= steps; index++) {
        const progress = index / steps;
        if (this.workerStaticPointBlocked(
          worker.x + dx * progress,
          worker.y + dy * progress
        )) return false;
      }
      return true;
    }

    randomReachableWorkerPoint(worker, allowMainAisle) {
      for (let attempt = 0; attempt < 24; attempt++) {
        const point = this.randomWorkerPoint(allowMainAisle && attempt < 5);
        if (!this.workerPointBlocked(point.x, point.y, worker) && this.workerPathClear(worker, point)) {
          return point;
        }
      }
      return { x: worker.x, y: worker.y };
    }

    randomPalletPoint() {
      for (let attempt = 0; attempt < 100; attempt++) {
        const minY = this.modeConfig.trailer ? 500 : 170;
        const point = {
          x: 110 + Math.random() * 1430,
          y: minY + Math.random() * (1270 - minY)
        };
        const blocked = this.obstacles.some(rect => circleRect(point.x, point.y, 42, rect));
        const crowded = this.pallets.some(pallet => Math.hypot(point.x - pallet.x, point.y - pallet.y) < 82);
        const onVehicle = Math.hypot(point.x - this.vehicle.x, point.y - this.vehicle.y) < 100;
        const onWorker = this.workers.some(worker => Math.hypot(point.x - worker.x, point.y - worker.y) < 70);
        const onBot = this.bot && Math.hypot(point.x - this.bot.x, point.y - this.bot.y) < 90;
        const inBotLane = (point.y > 1210 && point.x > 455 && point.x < 1030)
          || (point.x > 890 && point.x < 1025 && point.y > 600 && point.y < 1335)
          || (this.modeConfig.trailer && point.x > 930 && point.x < 1240 && point.y > 590 && point.y < 655);
        const inBotStage = circleRect(point.x, point.y, 45, this.stagingZone);
        const inBotRackService = [
          { x: 650, y: 275 }, { x: 650, y: 455 },
          { x: 650, y: 930 }, { x: 650, y: 1110 }
        ].some(servicePoint => Math.hypot(point.x - servicePoint.x, point.y - servicePoint.y) < 90);
        const insideTrailer = this.modeConfig.trailer
          && point.x > this.trailer.x - 20
          && point.x < this.trailer.x + this.trailer.w + 180
          && point.y > this.trailer.y - 20
          && point.y < this.trailer.y + this.trailer.h + 20;
        if (!blocked && !crowded && !onVehicle && !onWorker && !onBot && !inBotLane && !inBotStage && !inBotRackService && !insideTrailer) return point;
      }
      return { x: 180 + (this.pallets.length % 3) * 100, y: 500 + (this.pallets.length % 5) * 90 };
    }

    bindControls() {
      addEventListener("resize", this.resizeHandler, { passive: true });
      addEventListener("keydown", this.keyDownHandler);
      addEventListener("keyup", this.keyUpHandler);
      const joystick = this.root.querySelector(".fg2-joystick");
      const stick = joystick.querySelector(".fg2-stick");
      const updateStick = event => {
        const box = joystick.getBoundingClientRect();
        let x = event.clientX - (box.left + box.width / 2);
        let y = event.clientY - (box.top + box.height / 2);
        const max = box.width * .34;
        const length = Math.hypot(x, y);
        if (length > max) {
          x = x / length * max;
          y = y / length * max;
        }
        this.joystick.x = x / max;
        this.joystick.y = y / max;
        stick.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
      };
      joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        this.joystick.pointer = event.pointerId;
        joystick.setPointerCapture?.(event.pointerId);
        updateStick(event);
      });
      joystick.addEventListener("pointermove", event => {
        if (this.joystick.pointer === event.pointerId) updateStick(event);
      });
      const releaseStick = event => {
        if (this.joystick.pointer !== event.pointerId) return;
        this.joystick.pointer = null;
        this.joystick.x = 0;
        this.joystick.y = 0;
        stick.style.transform = "";
      };
      joystick.addEventListener("pointerup", releaseStick);
      joystick.addEventListener("pointercancel", releaseStick);
      this.root.querySelectorAll("[data-control]").forEach(button => {
        const action = button.dataset.control;
        button.addEventListener("pointerdown", event => {
          event.preventDefault();
          if (action === "horn") return this.horn();
          if (action === "speed") {
            if (this.playerVehicle !== "forklift") return;
            this.forkliftSpeedMode = this.forkliftSpeedMode === "fast" ? "slow" : "fast";
            button.classList.toggle("active", this.forkliftSpeedMode === "fast");
            button.textContent = this.forkliftSpeedMode === "fast" ? "🐇 Заєць" : "🐢 Черепашка";
            this.softClick(this.forkliftSpeedMode === "fast" ? 360 : 190);
            return;
          }
          if (action === "reverse") {
            this.reverse = !this.reverse;
            button.classList.toggle("active", this.reverse);
            button.textContent = this.reverse ? "Реверс: увімк." : "Реверс: вимк.";
            this.softClick(this.reverse ? 240 : 170);
            return;
          }
          this.controls[action] = true;
          button.classList.add("active");
          this.hydraulic(action);
          button.setPointerCapture?.(event.pointerId);
        });
        const release = event => {
          if (action === "lift" || action === "lower") {
            this.controls[action] = false;
            button.classList.remove("active");
          }
          if (event?.pointerId != null && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
        };
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
      });
      this.canvas.addEventListener("pointerdown", event => {
        event.preventDefault();
        this.viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.viewPointers.size === 2) this.pinch = this.pointerDistance();
        this.canvas.setPointerCapture?.(event.pointerId);
      });
      this.canvas.addEventListener("pointermove", event => {
        if (!this.viewPointers.has(event.pointerId)) return;
        event.preventDefault();
        this.viewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (this.viewPointers.size === 2) {
          const current = this.pointerDistance();
          if (this.pinch) this.zoom = clamp(this.zoom + (current - this.pinch) * .0017, .42, 1.15);
          this.pinch = current;
        }
      });
      const releaseView = event => {
        this.viewPointers.delete(event.pointerId);
        this.pinch = this.viewPointers.size === 2 ? this.pointerDistance() : 0;
      };
      this.canvas.addEventListener("pointerup", releaseView);
      this.canvas.addEventListener("pointercancel", releaseView);
    }

    pointerDistance() {
      const points = Array.from(this.viewPointers.values());
      return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    }

    onKey(event, down) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (down) this.keys.add(event.code);
      else this.keys.delete(event.code);
      if (down && !event.repeat && ["KeyH", "KeyF"].includes(event.code)) this.horn();
      if (down && !event.repeat && event.code === "KeyQ") { this.controls.lift = true; this.hydraulic("lift"); }
      if (down && !event.repeat && event.code === "KeyE") { this.controls.lower = true; this.hydraulic("lower"); }
      if (down && !event.repeat && event.code === "KeyR") {
        this.reverse = !this.reverse;
        const reverseButton = this.root.querySelector("[data-control='reverse']");
        reverseButton?.classList.toggle("active", this.reverse);
        if (reverseButton) reverseButton.textContent = this.reverse ? "Реверс: увімк." : "Реверс: вимк.";
      }
      if (down && !event.repeat && event.code === "KeyT" && this.playerVehicle === "forklift") {
        this.forkliftSpeedMode = this.forkliftSpeedMode === "fast" ? "slow" : "fast";
        const speedButton = this.root.querySelector("[data-control='speed']");
        speedButton?.classList.toggle("active", this.forkliftSpeedMode === "fast");
        if (speedButton) speedButton.textContent = this.forkliftSpeedMode === "fast" ? "🐇 Заєць" : "🐢 Черепашка";
      }
      if (!down && event.code === "KeyQ") this.controls.lift = false;
      if (!down && event.code === "KeyE") this.controls.lower = false;
      if (down && !event.repeat && event.code === "Escape") this.pauseMenu();
    }

    movementInput() {
      const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft");
      const right = this.keys.has("KeyD") || this.keys.has("ArrowRight");
      const up = this.keys.has("KeyW") || this.keys.has("ArrowUp");
      const down = this.keys.has("KeyS") || this.keys.has("ArrowDown");
      let x = this.joystick.x + (left ? -1 : 0) + (right ? 1 : 0);
      let y = this.joystick.y + (up ? -1 : 0) + (down ? 1 : 0);
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      return { x, y, strength: Math.min(1, length) };
    }

    update(dt) {
      if (this.trailerTransition) {
        this.updateTrailerTransition(dt);
        this.updateHUD();
        return;
      }
      if (this.incident) {
        this.updateIncident(dt);
        this.updateHUD();
        return;
      }
      this.elapsed += dt;
      this.speechBubbles = this.speechBubbles.filter(bubble => bubble.until > this.elapsed);
      if (this.modeConfig.trailer && this.driver && this.elapsed > 180 && this.elapsed - this.lastDriverComplaint > 22) {
        this.lastDriverComplaint = this.elapsed;
        const complaints = ["Ми сьогодні поїдемо?", "Швидше, у мене ще рейс!", "Скільки можна чекати?", "Там ще багато піддонів?"];
        this.say(this.driver, complaints[Math.floor(Math.random() * complaints.length)], 4);
      }
      if (this.levelRules.timeLimit && this.elapsed >= this.levelRules.timeLimit) {
        this.gameOver("Час вийшов. Спробуй пройти експрес-зміну швидше.");
        return;
      }
      this.updateBoosts();
      this.updateVehicle(dt);
      if (this.incident || this.over) {
        this.updateHUD();
        return;
      }
      this.updateWorkers(dt);
      if (this.incident || this.over) {
        this.updateHUD();
        return;
      }
      this.updateBot(dt);
      if (this.incident || this.over) {
        this.updateHUD();
        return;
      }
      this.checkTrailerDeparture();
      this.updateHUD();
    }

    updateVehicle(dt) {
      if (this.incident) {
        this.vehicle.speed = 0;
        return;
      }
      const rawInput = this.movementInput();
      const direction = this.reverse ? -1 : 1;
      const input = {
        x: rawInput.x * direction,
        y: rawInput.y * direction,
        strength: rawInput.strength
      };
      const v = this.vehicle;
      const inTrailer = this.modeConfig.trailer && circleRect(v.x, v.y, 12, this.trailer);
      const boosted = this.elapsed < this.speedBoostUntil ? 1.45 : 1;
      const baseSpeed = this.playerVehicle === "forklift"
        ? (this.forkliftSpeedMode === "fast" ? 430 : 235)
        : (v.carrying ? 150 : 176);
      const maxSpeed = baseSpeed * (v.carrying && this.playerVehicle === "forklift" ? .86 : 1) * boosted;
      v.speed += (input.strength * maxSpeed - v.speed) * Math.min(1, dt * 6);
      if (input.strength < .05) v.speed *= Math.pow(.05, dt);
      if (input.strength > .05) {
        const targetAngle = Math.atan2(input.y, input.x) + (this.reverse ? Math.PI : 0);
        v.angle += angleDelta(v.angle, targetAngle) * Math.min(1, dt * (inTrailer ? 5 : 8));
      }
      const previous = { x: v.x, y: v.y };
      v.x += input.x * v.speed * dt;
      v.y += input.y * v.speed * dt;
      v.x = clamp(v.x, 35, this.world.w - 35);
      v.y = clamp(v.y, 35, this.world.h - 35);
      const hitObstacle = this.obstacles.some(rect => circleRect(v.x, v.y, v.radius, rect));
      const hitPallet = this.pallets.some(pallet => !pallet.carried && Math.hypot(v.x - pallet.x, v.y - pallet.y) < 43);
      const hitStagePallet = this.botStagedPallets.some(pallet => Math.hypot(v.x - pallet.x, v.y - pallet.y) < 43);
      const forkPoints = this.forkCollisionPoints(v);
      const hitForkObstacle = forkPoints.some(point =>
        point.x < 10 || point.x > this.world.w - 10
        || point.y < 10 || point.y > this.world.h - 10
        || this.obstacles.some(rect => circleRect(point.x, point.y, 10, rect))
      );
      const hitForkPallet = this.pallets.find(pallet =>
        !pallet.carried
        && !this.palletAcceptsForks(v, pallet)
        && forkPoints.some(point => Math.hypot(point.x - pallet.x, point.y - pallet.y) < 38)
      );
      const hitForkStage = this.botStagedPallets.find(pallet =>
        !this.palletAcceptsForks(v, pallet)
        && forkPoints.some(point => Math.hypot(point.x - pallet.x, point.y - pallet.y) < 38)
      );
      const hitForkWorker = this.workers.find(worker =>
        !worker.injured && forkPoints.some(point => Math.hypot(point.x - worker.x, point.y - worker.y) < 24)
      );
      const hitForkBot = this.bot && forkPoints.some(point => Math.hypot(point.x - this.bot.x, point.y - this.bot.y) < 46);
      const cargoPoint = v.carrying ? this.forkPoint() : null;
      const hitCargoObstacle = cargoPoint && this.obstacles.some(rect => circleRect(cargoPoint.x, cargoPoint.y, 34, rect));
      const hitCargoPallet = cargoPoint && this.pallets.some(pallet =>
        pallet !== v.carrying && !pallet.carried && Math.hypot(cargoPoint.x - pallet.x, cargoPoint.y - pallet.y) < 66
      );
      const hitCargoStage = cargoPoint && this.botStagedPallets.some(pallet =>
        Math.hypot(cargoPoint.x - pallet.x, cargoPoint.y - pallet.y) < 66
      );
      const hitCargoWorker = cargoPoint && this.workers.find(worker =>
        !worker.injured && Math.hypot(cargoPoint.x - worker.x, cargoPoint.y - worker.y) < 43
      );
      const hitCargoBot = cargoPoint && this.bot && Math.hypot(cargoPoint.x - this.bot.x, cargoPoint.y - this.bot.y) < 62;
      if (
        hitObstacle || hitPallet || hitStagePallet
        || hitForkObstacle || hitForkPallet || hitForkStage || hitForkWorker || hitForkBot
        || hitCargoObstacle || hitCargoPallet || hitCargoStage || hitCargoWorker || hitCargoBot
      ) {
        v.x = previous.x;
        v.y = previous.y;
        const struckWorker = hitCargoWorker || hitForkWorker;
        if (struckWorker) {
          const escape = this.workerEscapePoint(struckWorker, this.vehicle);
          struckWorker.targetX = escape.x;
          struckWorker.targetY = escape.y;
          struckWorker.awayUntil = this.elapsed + 9;
          if (v.speed > 65) this.startIncident(struckWorker, "player");
          else if (v.speed > 25) this.damage("Вила або вантаж зачепили працівника");
        } else if (hitCargoBot || hitForkBot) {
          this.gameOver("Вантаж зачепив службову кару. Її потрібно пропускати.");
        } else if (v.speed > 28 && (cargoPoint || hitForkObstacle || hitForkPallet || hitForkStage)) {
          this.damage(
            hitCargoPallet || hitCargoStage || hitForkPallet || hitForkStage
              ? "Вила або вантаж зачепили інший піддон"
              : "Вила або вантаж зачепили перешкоду"
          );
        } else if (v.speed > 70) {
          this.damage("Зіткнення з перешкодою");
        }
        v.speed = 0;
      }
      if (this.controls.lift) this.lift();
      if (this.controls.lower) this.lower();
    }

    forkPoint() {
      return {
        x: this.vehicle.x + Math.cos(this.vehicle.angle) * 77,
        y: this.vehicle.y + Math.sin(this.vehicle.angle) * 77
      };
    }

    forkCollisionPoints(vehicle) {
      const unit = vehicle || this.vehicle;
      const points = [];
      [43, 60, 76].forEach(forward => {
        [-16, 16].forEach(side => {
          points.push({
            x: unit.x + Math.cos(unit.angle) * forward - Math.sin(unit.angle) * side,
            y: unit.y + Math.sin(unit.angle) * forward + Math.cos(unit.angle) * side
          });
        });
      });
      return points;
    }

    palletAcceptsForks(vehicle, pallet) {
      if (vehicle.carrying || pallet.carried) return false;
      const dx = pallet.x - vehicle.x;
      const dy = pallet.y - vehicle.y;
      const forward = dx * Math.cos(vehicle.angle) + dy * Math.sin(vehicle.angle);
      const sideways = -dx * Math.sin(vehicle.angle) + dy * Math.cos(vehicle.angle);
      return forward >= 38 && forward <= 104 && Math.abs(sideways) <= 27;
    }

    lift() {
      if (this.vehicle.forksUp) return;
      const point = this.forkPoint();
      const nearest = [
        ...this.pallets
          .filter(pallet => !pallet.carried && (pallet.damage || 0) < 100)
          .map(pallet => ({ pallet, staged: false })),
        ...this.botStagedPallets
          .map(pallet => ({ pallet, staged: true }))
      ]
        .map(item => ({ ...item, d: Math.hypot(point.x - item.pallet.x, point.y - item.pallet.y) }))
        .sort((a, b) => a.d - b.d)[0];
      if (!nearest || nearest.d > 66) return;
      if (nearest.staged) {
        const stagedIndex = this.botStagedPallets.indexOf(nearest.pallet);
        if (stagedIndex >= 0) this.botStagedPallets.splice(stagedIndex, 1);
        nearest.pallet.carried = false;
        nearest.pallet.delivered = false;
        nearest.pallet.slotId = null;
        nearest.pallet.damage = 0;
        nearest.pallet.awarded = false;
        nearest.pallet.destroyedPenalty = false;
        nearest.pallet.wrongPenaltyApplied = false;
        nearest.pallet.wrongInTruck = false;
        this.pallets.push(nearest.pallet);
        if (this.bot?.task === "parked" && !this.trailerAwaitingDeparture && !this.trailerTransition) {
          this.bot.task = "rack";
          this.bot.path = [];
          this.bot.pathKey = "";
        }
        this.notice(`Взято із зони комплектації: ${nearest.pallet.category?.label || "піддон"}`, "good");
      }
      nearest.pallet.carried = true;
      if (nearest.pallet.slotId != null) {
        const occupiedSlot = this.slots.find(slot => slot.id === nearest.pallet.slotId);
        if (occupiedSlot) {
          occupiedSlot.occupied = false;
          occupiedSlot.palletId = null;
        }
        nearest.pallet.slotId = null;
        nearest.pallet.delivered = false;
        if (nearest.pallet.wrongInTruck) {
          this.wrongDeliveries = Math.max(0, this.wrongDeliveries - 1);
          nearest.pallet.wrongInTruck = false;
        }
        this.delivered = Math.max(0, this.delivered - 1);
        if (this.modeConfig.trailer && this.delivered < this.target) {
          this.trailerAwaitingDeparture = false;
          this.trafficLight = "red";
          this.root.querySelector("[data-fg2='goal']").textContent = this.levelGoalText();
        }
        this.notice("Піддон забрано з місця — його можна переставити", "good");
      }
      this.vehicle.carrying = nearest.pallet;
      this.vehicle.forksUp = true;
      this.notice("Піддон піднято", "good");
    }

    lower() {
      const pallet = this.vehicle.carrying;
      if (!pallet || !this.vehicle.forksUp) return;
      const point = this.forkPoint();
      const slot = this.slots
        .filter(item => !item.occupied)
        .map(item => ({ item, d: Math.hypot(point.x - item.x, point.y - item.y) }))
        .sort((a, b) => a.d - b.d)[0];
      const placementDistance = this.modeConfig.trailer ? 58 : 76;
      const exactSlot = slot && slot.d <= placementDistance ? slot.item : null;
      const freePoint = {
        x: clamp(point.x, 45, this.world.w - 45),
        y: clamp(point.y, 45, this.world.h - 45)
      };
      if (exactSlot && (pallet.damage || 0) >= 100) {
        this.notice("Цей піддон пошкоджено на 100% — завантажити його не можна", "bad");
        this.checkSupplyExhausted();
        return;
      }
      if (
        exactSlot
        && !this.modeConfig.trailer
        && pallet.category?.id
        && exactSlot.category?.id !== pallet.category.id
      ) {
        this.notice(
          `Це місце для категорії «${exactSlot.category?.label || "інша"}». Знайди місце «${pallet.category.label}»`,
          "bad"
        );
        return;
      }
      if (!exactSlot) {
        const blocked = this.obstacles.some(rect => circleRect(freePoint.x, freePoint.y, 35, rect));
        const overlapsPallet = this.pallets.some(item =>
          item !== pallet && !item.carried && Math.hypot(freePoint.x - item.x, freePoint.y - item.y) < 70
        );
        const overlapsStagedPallet = this.botStagedPallets.some(item =>
          Math.hypot(freePoint.x - item.x, freePoint.y - item.y) < 70
        );
        if (blocked || overlapsPallet || overlapsStagedPallet) {
          this.notice("Тут немає вільного місця для піддона", "bad");
          return;
        }
        pallet.x = freePoint.x;
        pallet.y = freePoint.y;
        pallet.carried = false;
        pallet.delivered = false;
        pallet.slotId = null;
        this.vehicle.carrying = null;
        this.vehicle.forksUp = false;
        this.checkMazePlate(pallet);
        this.notice("Піддон поставлено у вибраному місці", "good");
        return;
      }
      exactSlot.occupied = true;
      exactSlot.palletId = pallet.id;
      pallet.x = exactSlot.x;
      pallet.y = exactSlot.y;
      pallet.carried = false;
      pallet.delivered = true;
      pallet.slotId = exactSlot.id;
      const wrongDestination = Boolean(
        this.modeConfig.trailer
        && pallet.destination
        && pallet.destination !== this.currentTruckDestination
      );
      pallet.wrongInTruck = wrongDestination;
      if (wrongDestination) {
        this.wrongDeliveries += 1;
      }
      this.vehicle.carrying = null;
      this.vehicle.forksUp = false;
      this.delivered += 1;
      if (!pallet.awarded) {
        this.score += 100;
        pallet.awarded = true;
        this.stats.total += 1;
      }
      if (wrongDestination) {
        if (!pallet.wrongPenaltyApplied) {
          pallet.wrongPenaltyApplied = true;
          this.score = Math.floor(this.score / 2);
          this.notice(
            `Неправильна фура: ${pallet.destination} замість ${this.currentTruckDestination}. Знято половину балів`,
            "bad"
          );
        } else {
          this.notice(`Увага: цей піддон призначений для міста ${pallet.destination}`, "bad");
        }
      }
      saveStats(this.stats);
      if (!wrongDestination) this.notice("Правильне місце: +100 балів", "good");
      this.tone(640, .16, "sine", .06);
      if (this.delivered >= this.target) {
        if (this.modeConfig.trailer) {
          this.trailerAwaitingDeparture = true;
          this.trafficLight = "red";
          this.root.querySelector("[data-fg2='goal']").textContent = "Фура завантажена · від’їдь у зелену безпечну зону";
          this.notice("Спочатку від’їдь від рампи у зелену безпечну зону", "good");
        }
        else this.complete();
      }
      else if (this.pallets.filter(item =>
        !item.delivered
        && !item.carried
        && (item.damage || 0) < 100
        && (!this.modeConfig.trailer || item.destination === this.currentTruckDestination)
      ).length < 5) {
        while (
          this.pallets.filter(item =>
            !item.delivered
            && !item.carried
            && (item.damage || 0) < 100
            && (!this.modeConfig.trailer || item.destination === this.currentTruckDestination)
          ).length < 5
          && this.replenish()
        ) {}
        this.checkSupplyExhausted();
      }
    }

    replenish() {
      if (this.totalPalletsCreated >= this.supplyLimit) return false;
      const index = this.pallets.length;
      const point = this.randomPalletPoint();
      this.pallets.push({
        id: `p${Date.now()}-${index}-${Math.round(Math.random() * 9999)}`, x: point.x, y: point.y,
        carried: false, delivered: false, slotId: null, damage: 0, awarded: false,
        destroyedPenalty: false, wrongPenaltyApplied: false, wrongInTruck: false,
        destination: this.palletDestination(this.totalPalletsCreated),
        category: this.palletCategory(this.totalPalletsCreated),
        color: index % 2 ? "#d39a55" : "#8bc5dc"
      });
      this.totalPalletsCreated += 1;
      return true;
    }

    checkSupplyExhausted() {
      if (this.trailerAwaitingDeparture || this.trailerTransition) return;
      const usable = this.pallets.filter(pallet =>
        !pallet.delivered && (pallet.damage || 0) < 100
      ).length;
      if (this.totalPalletsCreated < this.supplyLimit || this.delivered + usable >= this.target) return;
      if (!this.modeConfig.trailer) {
        this.gameOver("Запас придатних піддонів вичерпано. Рівень потрібно пройти повторно.");
        return;
      }
      this.trailerShortage = Math.max(0, this.target - this.delivered);
      this.trailerAwaitingDeparture = true;
      this.trafficLight = "red";
      this.root.querySelector("[data-fg2='goal']").textContent =
        `Бракує ${this.trailerShortage} піддонів · від’їдь у безпечну зону, фура вирушить неповною`;
      this.notice(`Запас вичерпано: фура вирушить без ${this.trailerShortage} піддонів`, "bad");
    }

    checkTrailerDeparture() {
      if (!this.modeConfig.trailer || !this.trailerAwaitingDeparture || this.trailerTransition) return;
      const zone = this.trailerSafeZone;
      const inSafeZone = this.vehicle.x >= zone.x
        && this.vehicle.x <= zone.x + zone.w
        && this.vehicle.y >= zone.y
        && this.vehicle.y <= zone.y + zone.h;
      if (!inSafeZone || this.vehicle.carrying) return;
      this.trafficLight = "green";
      this.startTrailerTransition();
    }

    checkMazePlate(pallet) {
      if (!this.mazePlate || this.mazeGateOpen) return;
      if (Math.hypot(pallet.x - this.mazePlate.x, pallet.y - this.mazePlate.y) > this.mazePlate.radius + 22) return;
      this.mazeGateOpen = true;
      this.obstacles = this.obstacles.filter(rect => rect !== this.mazeGate);
      this.mazeGate = null;
      this.tone(520, .3, "sine", .04);
    }

    spawnBoosts() {
      this.boosts = [];
      const types = ["speed", "speed", "shield", "speed", "score", "speed"];
      const regularCount = Math.min(7, 5 + Math.floor((this.level - 1) / 5));
      const boostCount = this.levelRules.sparseBoosts
        ? Math.max(2, Math.ceil(regularCount / 2))
        : regularCount;
      for (let index = 0; index < boostCount; index++) {
        const point = this.randomBoostPoint();
        this.boosts.push({
          x: point.x,
          y: point.y,
          type: types[index % types.length],
          active: true,
          phase: Math.random() * TAU,
          respawnAt: 0
        });
      }
    }

    randomBoostPoint(previousBoost) {
      let fallback = this.randomAislePoint(26);
      for (let attempt = 0; attempt < 35; attempt++) {
        const point = this.randomAislePoint(26);
        fallback = point;
        const movedFarEnough = !previousBoost
          || Math.hypot(point.x - previousBoost.x, point.y - previousBoost.y) >= 220;
        const clearOfOthers = this.boosts.every(boost =>
          boost === previousBoost || !boost.active || Math.hypot(point.x - boost.x, point.y - boost.y) >= 90
        );
        if (movedFarEnough && clearOfOthers) return point;
      }
      return fallback;
    }

    updateBoosts() {
      this.boosts.forEach(boost => {
        if (!boost.active) {
          if (boost.respawnAt && this.elapsed >= boost.respawnAt) {
            const point = this.randomBoostPoint(boost);
            const types = ["speed", "speed", "speed", "shield", "score"];
            boost.x = point.x;
            boost.y = point.y;
            boost.type = types[Math.floor(Math.random() * types.length)];
            boost.phase = Math.random() * TAU;
            boost.active = true;
            boost.respawnAt = 0;
          }
          return;
        }
        const playerTakes = Math.hypot(boost.x - this.vehicle.x, boost.y - this.vehicle.y) <= 42;
        const botTakes = !playerTakes
          && this.bot
          && Math.hypot(boost.x - this.bot.x, boost.y - this.bot.y) <= 54
          && Math.random() < .004;
        if (!playerTakes && !botTakes) return;
        boost.active = false;
        const respawnDelay = this.levelRules.sparseBoosts
          ? 30 + Math.random() * 15
          : 18 + Math.random() * 12;
        boost.respawnAt = this.elapsed + respawnDelay;
        if (botTakes) {
          this.botScore += boost.type === "score" ? 75 : 25;
          if (boost.type === "speed") {
            this.bot.speedBoostUntil = Math.max(this.elapsed, this.bot.speedBoostUntil || 0) + 20;
          }
          return;
        }
        if (boost.type === "speed") {
          this.speedBoostUntil = Math.max(this.elapsed, this.speedBoostUntil) + 40;
          this.notice("Прискорення +40 секунд", "good");
        } else if (boost.type === "shield") {
          this.shieldBoostUntil = Math.max(this.elapsed, this.shieldBoostUntil) + 40;
          this.notice("Захист вантажу +40 секунд", "good");
        } else {
          this.score += 75;
          this.notice("+75 бонусних балів", "good");
        }
        this.tone(760, .18, "sine", .04);
      });
    }

    startTrailerTransition() {
      if (this.trailerTransition) return;
      this.vehicle.speed = 0;
      this.trafficLight = "green";
      this.trailerTransition = { timer: 0, swapped: false };
      this.root.querySelector("[data-fg2='goal']").textContent = "Рампа закривається · завантажена фура готується до виїзду";
    }

    updateTrailerTransition(dt) {
      const transition = this.trailerTransition;
      if (!transition) return;
      transition.timer += dt;
      this.vehicle.speed = 0;
      if (transition.timer >= 3 && !transition.swapped) {
        transition.swapped = true;
        this.trucksCompleted += 1;
        this.truckQueueTotal = Math.max(1, this.truckQueueTotal - 1);
        this.root.querySelector("[data-fg2='goal']").textContent = "Наступна фура під’їжджає до рампи";
      }
      if (transition.timer >= 6) {
        this.trailerTransition = null;
        if (this.trucksCompleted >= this.trucksRequired) {
          this.complete();
          return;
        }
        this.currentTruckDestination = this.truckDestinations[this.trucksCompleted] || "";
        this.pallets = this.pallets.filter(pallet => !pallet.delivered && (pallet.damage || 0) < 100);
        this.pallets.forEach((pallet, index) => {
          pallet.destination = this.palletDestination(index);
          pallet.awarded = false;
          pallet.wrongInTruck = false;
          pallet.wrongPenaltyApplied = false;
        });
        this.slots.forEach(slot => {
          slot.occupied = false;
          slot.palletId = null;
        });
        this.delivered = 0;
        this.wrongDeliveries = 0;
        this.trailerShortage = 0;
        this.totalPalletsCreated = this.pallets.length;
        this.supplyLimit = this.modeConfig.trailer
          ? Math.ceil(this.target * 1.5) + 6
          : this.target + Math.max(2, 6 - Math.floor(this.level / 3));
        while (this.pallets.filter(pallet => !pallet.carried).length < 12 && this.replenish()) {}
        this.trailerRound = this.trucksCompleted + 1;
        this.trailerAwaitingDeparture = false;
        this.trafficLight = "red";
        this.botStagedPallets = [];
        if (this.bot) {
          this.bot.task = "rack";
          this.bot.stageIndex = 0;
          this.bot.path = [];
          this.bot.pathKey = "";
          this.bot.cargoDestination = "";
          this.bot.cargoCategory = null;
        }
        this.root.querySelector("[data-fg2='goal']").textContent = this.levelGoalText();
        this.notice(`Фура ${this.trailerRound}/${this.trucksRequired} готова до завантаження`, "good");
      }
    }

    trailerVisualOffset() {
      const timer = this.trailerTransition?.timer;
      if (timer == null || timer < 1) return 0;
      if (timer < 3) return ((timer - 1) / 2) * 760;
      if (timer < 5) return (1 - (timer - 3) / 2) * 760;
      return 0;
    }

    trailerGateProgress() {
      const timer = this.trailerTransition?.timer;
      if (timer == null) return 0;
      if (timer < 1) return timer;
      if (timer < 5) return 1;
      return Math.max(0, 1 - (timer - 5));
    }

    workerPointBlocked(x, y, ignoredWorker) {
      if (this.workerStaticPointBlocked(x, y)) return true;
      if (this.pallets.some(pallet => !pallet.carried && Math.hypot(x - pallet.x, y - pallet.y) < 35)) return true;
      if (this.botStagedPallets.some(pallet => Math.hypot(x - pallet.x, y - pallet.y) < 35)) return true;
      if (this.bot && Math.hypot(x - this.bot.x, y - this.bot.y) < 48) return true;
      if (this.workers.some(worker =>
        worker !== ignoredWorker && !worker.injured && Math.hypot(x - worker.x, y - worker.y) < 28
      )) return true;
      return false;
    }

    workerEscapePoint(worker, threat) {
      const baseAngle = Math.atan2(worker.y - threat.y, worker.x - threat.x);
      const offsets = [0, .45, -.45, .9, -.9, 1.35, -1.35, Math.PI];
      for (const offset of offsets) {
        const distanceAway = 190 + Math.random() * 70;
        const x = clamp(worker.x + Math.cos(baseAngle + offset) * distanceAway, 35, this.world.w - 35);
        const y = clamp(worker.y + Math.sin(baseAngle + offset) * distanceAway, 35, this.world.h - 35);
        const point = { x, y };
        if (!this.workerPointBlocked(x, y, worker) && this.workerPathClear(worker, point)) return point;
      }
      return this.randomReachableWorkerPoint(worker, false);
    }

    recoverWorker(worker) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const point = this.randomWorkerPoint(false);
        if (!this.workerPointBlocked(point.x, point.y, worker)) {
          worker.x = point.x;
          worker.y = point.y;
          worker.targetX = point.x;
          worker.targetY = point.y;
          worker.stuckFor = 0;
          return;
        }
      }
    }

    updateWorkers(dt) {
      this.workers.forEach(worker => {
        if (worker.injured) return;
        if (this.workerStaticPointBlocked(worker.x, worker.y)) {
          this.recoverWorker(worker);
          return;
        }
        const previous = { x: worker.x, y: worker.y };
        const toVehicle = Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y);
        if (toVehicle < 145 && (worker.aware || worker.avoidUntil > this.elapsed)) {
          const escape = this.workerEscapePoint(worker, this.vehicle);
          worker.targetX = escape.x;
          worker.targetY = escape.y;
          worker.avoidUntil = Math.max(worker.avoidUntil, this.elapsed + 2.2);
          worker.awayUntil = Math.max(worker.awayUntil, this.elapsed + 7);
        } else if (distance(worker, { x: worker.targetX, y: worker.targetY }) < 15 || Math.random() < dt * .06) {
          const target = this.randomReachableWorkerPoint(
            worker,
            worker.awayUntil <= this.elapsed && Math.random() < .08
          );
          worker.targetX = target.x;
          worker.targetY = target.y;
        }
        const dx = worker.targetX - worker.x;
        const dy = worker.targetY - worker.y;
        const length = Math.hypot(dx, dy) || 1;
        const speed = worker.avoidUntil > this.elapsed ? worker.speed * 2.4 : worker.speed;
        const nextX = worker.x + dx / length * speed * dt;
        const nextY = worker.y + dy / length * speed * dt;
        if (this.workerPointBlocked(nextX, nextY, worker)) {
          worker.stuckFor += dt;
          const target = this.randomWorkerPoint(false);
          worker.targetX = target.x;
          worker.targetY = target.y;
        } else {
          worker.x = nextX;
          worker.y = nextY;
          const moved = Math.hypot(worker.x - previous.x, worker.y - previous.y);
          worker.stuckFor = moved < .15 ? worker.stuckFor + dt : Math.max(0, worker.stuckFor - dt * 2);
        }
        if (worker.stuckFor > 1.25) this.recoverWorker(worker);
        worker.phase += dt * speed * .12;

        const bodyCollision = Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y) < 36;
        const cargoPoint = this.vehicle.carrying ? this.forkPoint() : null;
        const cargoCollision = cargoPoint && Math.hypot(worker.x - cargoPoint.x, worker.y - cargoPoint.y) < 43;
        const forkCollision = this.forkCollisionPoints(this.vehicle).some(point =>
          Math.hypot(worker.x - point.x, worker.y - point.y) < 24
        );
        if (bodyCollision || cargoCollision || forkCollision) {
          worker.x = previous.x;
          worker.y = previous.y;
          const escape = this.workerEscapePoint(worker, this.vehicle);
          worker.targetX = escape.x;
          worker.targetY = escape.y;
          worker.avoidUntil = this.elapsed + 2.5;
          worker.awayUntil = this.elapsed + 8;
          if (this.vehicle.speed > (cargoCollision || forkCollision ? 65 : 110)) this.startIncident(worker, "player");
        }
      });
    }

    startIncident(worker, source) {
      if (this.incident || worker.injured) return;
      const causedByBot = source === "bot";
      worker.injured = true;
      this.vehicle.speed = 0;
      if (!causedByBot && !this.modeConfig.noPenalties) this.score = Math.max(0, this.score - 100);
      const side = worker.x > this.world.w / 2 ? -1 : 1;
      this.incident = {
        timer: 0,
        victim: worker,
        causedByBot,
        inspector: { x: worker.x + side * 260, y: worker.y - 130 },
        medics: [
          { x: worker.x + side * 300, y: worker.y + 100 },
          { x: worker.x + side * 340, y: worker.y + 145 }
        ],
        exit: { x: clamp(worker.x + side * 390, 55, this.world.w - 55), y: clamp(worker.y + 190, 55, this.world.h - 55) },
        gameOverAfter: causedByBot
          ? false
          : this.levelRules.strictSafety || (!this.modeConfig.noPenalties && this.score <= 0)
      };
      this.root.querySelector("[data-fg2='goal']").textContent = "ПОРУШЕННЯ · інспектор оформлює подію, медики забирають постраждалого";
      this.notice(causedByBot
        ? "Службова кара зачепила працівника — роботу тимчасово зупинено"
        : this.modeConfig.noPenalties
          ? "Небезпечний контакт із працівником — тренування продовжиться"
          : "-100 балів: небезпечний контакт із працівником", "bad");
      this.tone(110, .28, "square", .065);
    }

    moveActor(actor, target, speed, dt) {
      const dx = target.x - actor.x;
      const dy = target.y - actor.y;
      const waypointDistance = Math.hypot(dx, dy);
      const length = waypointDistance || 1;
      const step = Math.min(length, speed * dt);
      const previous = { x: actor.x, y: actor.y };
      actor.x += dx / length * step;
      actor.y += dy / length * step;
      if (this.obstacles.some(rect => circleRect(actor.x, actor.y, 14, rect))) {
        actor.x = previous.x;
        actor.y = previous.y;
        const tryX = clamp(previous.x + Math.sign(dx) * step, 20, this.world.w - 20);
        if (!this.obstacles.some(rect => circleRect(tryX, actor.y, 14, rect))) actor.x = tryX;
        else {
          const tryY = clamp(previous.y + Math.sign(dy) * step, 20, this.world.h - 20);
          if (!this.obstacles.some(rect => circleRect(actor.x, tryY, 14, rect))) actor.y = tryY;
        }
      }
    }

    updateIncident(dt) {
      const scene = this.incident;
      if (!scene) return;
      scene.timer += dt;
      this.vehicle.speed = 0;
      const victim = scene.victim;
      if (scene.timer < 1.8) {
        this.moveActor(scene.inspector, victim, 185, dt);
        scene.medics.forEach((medic, index) => this.moveActor(medic, { x: victim.x + (index ? 22 : -22), y: victim.y + 10 }, 210, dt));
      } else if (scene.timer < 4.8) {
        const offset = scene.medics[0].x < scene.medics[1].x ? 22 : -22;
        this.moveActor(scene.medics[0], { x: scene.exit.x - offset, y: scene.exit.y }, 120, dt);
        this.moveActor(scene.medics[1], { x: scene.exit.x + offset, y: scene.exit.y }, 120, dt);
        victim.x = (scene.medics[0].x + scene.medics[1].x) / 2;
        victim.y = (scene.medics[0].y + scene.medics[1].y) / 2;
        victim.carriedAway = true;
      } else {
        this.workers = this.workers.filter(worker => worker !== victim);
        const gameOverAfter = scene.gameOverAfter;
        this.incident = null;
        this.root.querySelector("[data-fg2='goal']").textContent = this.levelGoalText();
        if (gameOverAfter) this.gameOver(this.levelRules.strictSafety
          ? "У безпечній зміні не можна допускати зіткнень."
          : undefined);
      }
    }

    botPositionBlocked(x, y, ignoreTargetPallet) {
      if (x < 42 || x > this.world.w - 42 || y < 42 || y > this.world.h - 42) return true;
      if (this.obstacles.some(rect => circleRect(x, y, 36, rect))) return true;
      if (this.pallets.some(pallet =>
        pallet !== ignoreTargetPallet
        && !pallet.carried
        && Math.hypot(x - pallet.x, y - pallet.y) < 58
      )) return true;
      return this.botStagedPallets.some(pallet => Math.hypot(x - pallet.x, y - pallet.y) < 58);
    }

    planBotPath(target) {
      const bot = this.bot;
      if (!bot) return [];
      if (this.botPositionBlocked(target.x, target.y)) return [];
      const cell = 70;
      const columns = Math.ceil(this.world.w / cell);
      const rows = Math.ceil(this.world.h / cell);
      const toIndex = (column, row) => row * columns + column;
      const toCell = point => ({
        column: clamp(Math.floor(point.x / cell), 0, columns - 1),
        row: clamp(Math.floor(point.y / cell), 0, rows - 1)
      });
      const start = toCell(bot);
      const end = toCell(target);
      const startIndex = toIndex(start.column, start.row);
      const endIndex = toIndex(end.column, end.row);
      const open = [startIndex];
      const cameFrom = new Map();
      const score = new Map([[startIndex, 0]]);
      const estimate = new Map([[startIndex, Math.hypot(end.column - start.column, end.row - start.row)]]);
      const closed = new Set();
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];

      for (let iteration = 0; open.length && iteration < 900; iteration++) {
        let bestPosition = 0;
        for (let index = 1; index < open.length; index++) {
          if ((estimate.get(open[index]) ?? Infinity) < (estimate.get(open[bestPosition]) ?? Infinity)) bestPosition = index;
        }
        const current = open.splice(bestPosition, 1)[0];
        if (current === endIndex) {
          const path = [];
          let cursor = current;
          while (cursor !== startIndex && cameFrom.has(cursor)) {
            const column = cursor % columns;
            const row = Math.floor(cursor / columns);
            path.unshift({ x: column * cell + cell / 2, y: row * cell + cell / 2 });
            cursor = cameFrom.get(cursor);
          }
          path.push({ x: target.x, y: target.y });
          return path;
        }
        closed.add(current);
        const currentColumn = current % columns;
        const currentRow = Math.floor(current / columns);
        directions.forEach(([stepX, stepY]) => {
          const column = currentColumn + stepX;
          const row = currentRow + stepY;
          if (column < 0 || column >= columns || row < 0 || row >= rows) return;
          const next = toIndex(column, row);
          if (closed.has(next)) return;
          const point = { x: column * cell + cell / 2, y: row * cell + cell / 2 };
          if (next !== endIndex && this.botPositionBlocked(point.x, point.y)) return;
          if (stepX && stepY) {
            const sideA = { x: (currentColumn + stepX) * cell + cell / 2, y: currentRow * cell + cell / 2 };
            const sideB = { x: currentColumn * cell + cell / 2, y: (currentRow + stepY) * cell + cell / 2 };
            if (this.botPositionBlocked(sideA.x, sideA.y) || this.botPositionBlocked(sideB.x, sideB.y)) return;
          }
          const tentative = (score.get(current) ?? Infinity) + (stepX && stepY ? 1.414 : 1);
          if (tentative >= (score.get(next) ?? Infinity)) return;
          cameFrom.set(next, current);
          score.set(next, tentative);
          estimate.set(next, tentative + Math.hypot(end.column - column, end.row - row));
          if (!open.includes(next)) open.push(next);
        });
      }
      return [];
    }

    recoverBotPosition() {
      const bot = this.bot;
      if (!bot) return;
      for (let radius = 70; radius <= 420; radius += 70) {
        for (let index = 0; index < 16; index++) {
          const angle = index / 16 * TAU;
          const x = clamp(bot.x + Math.cos(angle) * radius, 45, this.world.w - 45);
          const y = clamp(bot.y + Math.sin(angle) * radius, 45, this.world.h - 45);
          const clearOfWorkers = this.workers.every(worker =>
            worker.injured || Math.hypot(x - worker.x, y - worker.y) >= 62
          );
          const clearOfPlayer = Math.hypot(x - this.vehicle.x, y - this.vehicle.y) >= 90;
          if (!this.botPositionBlocked(x, y) && clearOfWorkers && clearOfPlayer) {
            bot.x = x;
            bot.y = y;
            bot.path = [];
            bot.blockedFor = 0;
            return;
          }
        }
      }
      bot.x = 520;
      bot.y = 1300;
      bot.path = [];
      bot.blockedFor = 0;
    }

    updateBot(dt) {
      const bot = this.bot;
      if (!bot) return;
      bot.beacon += dt * 8;

      if (this.trailerAwaitingDeparture || this.trailerTransition || this.botStagedPallets.length >= this.botStageSlots.length) {
        bot.task = "parked";
        bot.carrying = false;
      }
      const rackPoint = this.botRackPoints[bot.rackIndex % Math.max(1, this.botRackPoints.length)] || { x: 650, y: 1110 };
      const freeStageIndex = this.botStageSlots.findIndex(slot =>
        (
          !bot.cargoCategory?.id
          || slot.category?.id === bot.cargoCategory.id
        )
        && !this.botStagedPallets.some(pallet => Math.hypot(slot.x - pallet.x, slot.y - pallet.y) < 36)
      );
      if (freeStageIndex >= 0) bot.stageIndex = freeStageIndex;
      const stagePoint = this.botStageSlots[bot.stageIndex % this.botStageSlots.length] || { x: 520, y: 1200 };
      const stageDirectionX = stagePoint.x - rackPoint.x;
      const stageDirectionY = stagePoint.y - rackPoint.y;
      const stageDirectionLength = Math.hypot(stageDirectionX, stageDirectionY) || 1;
      const stageStop = {
        x: stagePoint.x - stageDirectionX / stageDirectionLength * 78,
        y: stagePoint.y - stageDirectionY / stageDirectionLength * 78
      };
      const target = bot.task === "rack"
        ? rackPoint
        : bot.task === "stage"
          ? stageStop
          : { x: 520, y: 1300 };
      bot.targetX = target.x;
      bot.targetY = target.y;
      const pathKey = `${bot.task}:${Math.round(target.x)}:${Math.round(target.y)}`;
      if (bot.pathKey !== pathKey || !bot.path.length) {
        bot.pathKey = pathKey;
        bot.path = this.planBotPath(target);
      }
      if (!bot.path.length && Math.hypot(bot.x - target.x, bot.y - target.y) >= 38) {
        bot.blockedFor += dt;
        if (bot.blockedFor > .8) {
          if (bot.task === "rack") bot.rackIndex = (bot.rackIndex + 1) % Math.max(1, this.botRackPoints.length);
          else if (bot.task === "stage") bot.stageIndex = (bot.stageIndex + 1) % Math.max(1, this.botStageSlots.length);
          bot.pathKey = "";
        }
        if (bot.blockedFor > 3.2) this.recoverBotPosition();
        return;
      }

      let waypoint = bot.path[0] || target;
      if (Math.hypot(bot.x - waypoint.x, bot.y - waypoint.y) < 28 && bot.path.length) {
        bot.path.shift();
        waypoint = bot.path[0] || target;
      }
      const dx = waypoint.x - bot.x;
      const dy = waypoint.y - bot.y;
      const waypointDistance = Math.hypot(dx, dy);
      const length = waypointDistance || 1;
      const directionX = dx / length;
      const directionY = dy / length;
      const playerOffsetX = this.vehicle.x - bot.x;
      const playerOffsetY = this.vehicle.y - bot.y;
      const playerDistance = Math.hypot(playerOffsetX, playerOffsetY);
      const playerAhead = playerOffsetX * directionX + playerOffsetY * directionY;
      const playerSide = Math.abs(playerOffsetX * directionY - playerOffsetY * directionX);
      const playerBlocksRoute = waypointDistance > 4
        && (
          playerDistance < 90
          || (playerAhead > -15 && playerAhead < 190 && playerSide < 72)
        );
      if (playerBlocksRoute) {
        bot.blockedFor = 0;
        if (this.elapsed - bot.waitNoticeAt > 5) {
          bot.waitNoticeAt = this.elapsed;
          this.notice("Службова кара бачить тебе й чекає, доки проїзд звільниться", "good");
        }
        return;
      }
      const botBoost = this.elapsed < (bot.speedBoostUntil || 0) ? 1.18 : 1;
      const step = Math.min(length, bot.speed * botBoost * dt);
      const nextX = clamp(bot.x + dx / length * step, 42, this.world.w - 42);
      const nextY = clamp(bot.y + dy / length * step, 42, this.world.h - 42);
      bot.angle = Math.atan2(dy, dx);
      const botCargoPoint = bot.carrying
        ? {
            x: nextX + Math.cos(bot.angle) * 77,
            y: nextY + Math.sin(bot.angle) * 77
          }
        : null;

      const workerInRoute = this.workers.find(worker => {
        if (worker.injured) return false;
        const offsetX = worker.x - bot.x;
        const offsetY = worker.y - bot.y;
        const ahead = offsetX * directionX + offsetY * directionY;
        const side = Math.abs(offsetX * directionY - offsetY * directionX);
        return ahead > -10 && ahead < 165 && side < 58;
      });
      if (workerInRoute) {
        const escape = this.workerEscapePoint(workerInRoute, bot);
        workerInRoute.targetX = escape.x;
        workerInRoute.targetY = escape.y;
        workerInRoute.avoidUntil = Math.max(workerInRoute.avoidUntil, this.elapsed + 3);
        workerInRoute.awayUntil = Math.max(workerInRoute.awayUntil, this.elapsed + 9);
        workerInRoute.aware = true;
        if (this.elapsed - bot.hornAt > 2.4) {
          bot.hornAt = this.elapsed;
          this.softHorn();
          this.say(bot, "Обережно, звільніть проїзд!", 2.2);
        }
        bot.blockedFor = 0;
        return;
      }

      const struckWorker = this.workers.find(worker =>
        !worker.injured && (
          Math.hypot(nextX - worker.x, nextY - worker.y) < 48
          || (botCargoPoint && Math.hypot(botCargoPoint.x - worker.x, botCargoPoint.y - worker.y) < 43)
        )
      );
      if (struckWorker) {
        this.startIncident(struckWorker, "bot");
        return;
      }
      const cargoBlocked = botCargoPoint && (
        this.obstacles.some(rect => circleRect(botCargoPoint.x, botCargoPoint.y, 34, rect))
        || this.pallets.some(pallet => !pallet.carried && Math.hypot(botCargoPoint.x - pallet.x, botCargoPoint.y - pallet.y) < 66)
        || this.botStagedPallets.some(pallet => Math.hypot(botCargoPoint.x - pallet.x, botCargoPoint.y - pallet.y) < 66)
      );
      if (this.botPositionBlocked(nextX, nextY) || cargoBlocked) {
        bot.path = [];
        bot.blockedFor += dt;
        if (bot.blockedFor > .42) {
          const reverseStep = bot.speed * .62 * dt;
          const reverseX = clamp(bot.x - Math.cos(bot.angle) * reverseStep, 42, this.world.w - 42);
          const reverseY = clamp(bot.y - Math.sin(bot.angle) * reverseStep, 42, this.world.h - 42);
          if (!this.botPositionBlocked(reverseX, reverseY)) {
            bot.x = reverseX;
            bot.y = reverseY;
          }
        }
        if (bot.blockedFor > 1.6) this.recoverBotPosition();
      } else {
        bot.x = nextX;
        bot.y = nextY;
        bot.blockedFor = Math.max(0, bot.blockedFor - dt * 2);
      }

      if (Math.hypot(bot.x - target.x, bot.y - target.y) < 38) {
        if (bot.task === "rack") {
          bot.carrying = true;
          bot.cargoDestination = this.palletDestination(bot.rackIndex + bot.stageIndex);
          const availableCategories = PALLET_CATEGORIES.filter(category =>
            this.botStageSlots.some(slot =>
              slot.category?.id === category.id
              && !this.botStagedPallets.some(pallet => Math.hypot(slot.x - pallet.x, slot.y - pallet.y) < 36)
            )
          );
          bot.cargoCategory = availableCategories[bot.rackIndex % Math.max(1, availableCategories.length)]
            || this.palletCategory(bot.rackIndex);
          bot.task = "stage";
          bot.path = [];
          bot.pathKey = "";
        } else if (bot.task === "stage") {
          this.botStagedPallets.push({
            x: stagePoint.x,
            y: stagePoint.y,
            id: `stage-${Date.now()}-${bot.stageIndex}`,
            destination: bot.cargoDestination,
            category: bot.cargoCategory,
            color: bot.cargoCategory?.id === "raw"
              ? "#8bc5dc"
              : bot.cargoCategory?.id === "pack" ? "#d39a55" : "#8bcf8f"
          });
          bot.carrying = false;
          bot.cargoDestination = "";
          bot.cargoCategory = null;
          bot.stageIndex += 1;
          bot.rackIndex += 1;
          bot.task = this.botStagedPallets.length >= this.botStageSlots.length ? "parked" : "rack";
          bot.path = [];
          bot.pathKey = "";
          this.botScore += 100;
          if (Math.random() < .45) this.say(bot, ["Ряд готовий.", "Наступний піддон.", "Зона комплектації поповнена."][Math.floor(Math.random() * 3)]);
        }
      }

      if (Math.hypot(bot.x - this.vehicle.x, bot.y - this.vehicle.y) < 65) {
        this.vehicle.speed = 0;
        this.say(bot, "Обережно, службова кара!");
        this.gameOver("Зіткнення зі службовою карою. Її потрібно обов’язково пропускати.");
      }
    }

    say(actor, text, duration) {
      this.speechBubbles.push({
        actor,
        text,
        until: this.elapsed + (duration || 3.2)
      });
      if (this.speechBubbles.length > 4) this.speechBubbles.shift();
    }

    damage(reason) {
      if (this.elapsed - this.lastDamageAt < .8) return;
      this.lastDamageAt = this.elapsed;
      const carried = this.vehicle.carrying;
      let destroyedNow = false;
      if (carried && this.elapsed >= this.shieldBoostUntil) {
        const addedDamage = Math.round(clamp(6 + this.vehicle.speed * .08, 7, 24));
        carried.damage = clamp((carried.damage || 0) + addedDamage, 0, 100);
        this.notice(`Пошкодження цього піддона: ${Math.round(carried.damage)}%`, "bad");
        if (carried.damage >= 100 && !carried.destroyedPenalty) {
          carried.destroyedPenalty = true;
          this.score = Math.floor(this.score / 2);
          destroyedNow = true;
          this.notice("Піддон знищено: втрачено половину накопичених балів", "bad");
          this.replenish();
          this.checkSupplyExhausted();
        }
      }
      if (this.modeConfig.noPenalties) {
        this.notice(`${reason} — без штрафу у тренуванні`, "bad");
        this.tone(92, .2, "square", .05);
        return;
      }
      if (destroyedNow) {
        this.integrity = Math.max(0, this.integrity - 15);
        this.tone(78, .3, "square", .09);
        if (this.levelRules.strictSafety) this.gameOver("У безпечній зміні вантаж не можна пошкоджувати.");
        else if (this.score <= 0) this.gameOver();
        return;
      }
      this.score = Math.max(0, this.score - 50);
      this.integrity = Math.max(0, this.integrity - 7);
      this.notice(`-50 балів: ${reason}`, "bad");
      this.tone(92, .2, "square", .08);
      if (this.levelRules.strictSafety) this.gameOver("У безпечній зміні не можна допускати зіткнень.");
      else if (this.score <= 0) this.gameOver();
    }

    horn() {
      if (!this.running || this.paused || this.incident) return;
      this.softHorn();
      this.workers.forEach(worker => {
        if (worker.injured || Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y) >= 270) return;
        if (this.workerStaticPointBlocked(worker.x, worker.y)) this.recoverWorker(worker);
        const escape = this.workerEscapePoint(worker, this.vehicle);
        worker.targetX = escape.x;
        worker.targetY = escape.y;
        worker.avoidUntil = this.elapsed + 3;
        worker.awayUntil = this.elapsed + 9;
        worker.stuckFor = 0;
        worker.aware = true;
      });
      if (this.elapsed - this.lastHornNotice > 4) {
        this.lastHornNotice = this.elapsed;
        this.notice("Працівники звільняють проїзд", "good");
      }
    }

    softHorn() {
      if (!this.audio) return;
      try {
        this.audio.resume?.().catch?.(() => {});
        const now = this.audio.currentTime;
        const gain = this.audio.createGain();
        const low = this.audio.createOscillator();
        const high = this.audio.createOscillator();
        low.type = "sine";
        high.type = "sine";
        low.frequency.value = 330;
        high.frequency.value = 440;
        gain.gain.setValueAtTime(.001, now);
        gain.gain.linearRampToValueAtTime(.045, now + .04);
        gain.gain.setValueAtTime(.045, now + .22);
        gain.gain.exponentialRampToValueAtTime(.001, now + .48);
        low.connect(gain);
        high.connect(gain);
        gain.connect(this.audio.destination);
        low.start(now); high.start(now);
        low.stop(now + .5); high.stop(now + .5);
      } catch (error) {}
    }

    softClick(frequency) {
      if (!this.audio) return;
      try {
        const now = this.audio.currentTime;
        const oscillator = this.audio.createOscillator();
        const gain = this.audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency || 210;
        gain.gain.setValueAtTime(.025, now);
        gain.gain.exponentialRampToValueAtTime(.001, now + .12);
        oscillator.connect(gain).connect(this.audio.destination);
        oscillator.start(now);
        oscillator.stop(now + .13);
      } catch (error) {}
    }

    hydraulic(direction) {
      if (!this.audio) return;
      try {
        this.audio.resume?.().catch?.(() => {});
        const now = this.audio.currentTime;
        const oscillator = this.audio.createOscillator();
        const overtone = this.audio.createOscillator();
        const gain = this.audio.createGain();
        const rising = direction === "lift";
        oscillator.type = "sine";
        overtone.type = "triangle";
        oscillator.frequency.setValueAtTime(rising ? 118 : 205, now);
        oscillator.frequency.exponentialRampToValueAtTime(rising ? 205 : 118, now + .48);
        overtone.frequency.setValueAtTime(rising ? 236 : 410, now);
        overtone.frequency.exponentialRampToValueAtTime(rising ? 410 : 236, now + .48);
        gain.gain.setValueAtTime(.001, now);
        gain.gain.linearRampToValueAtTime(.028, now + .07);
        gain.gain.exponentialRampToValueAtTime(.001, now + .5);
        oscillator.connect(gain);
        overtone.connect(gain);
        gain.connect(this.audio.destination);
        oscillator.start(now);
        overtone.start(now);
        oscillator.stop(now + .52);
        overtone.stop(now + .52);
      } catch (error) {}
    }

    initAudio() {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      try {
        if (AudioContext) this.audio = new AudioContext();
      } catch (error) {
        this.audio = null;
      }
    }

    tone(frequency, duration, type, volume) {
      if (!this.audio) return;
      try {
        const oscillator = this.audio.createOscillator();
        const gain = this.audio.createGain();
        oscillator.type = type || "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = volume || .05;
        gain.gain.exponentialRampToValueAtTime(.001, this.audio.currentTime + duration);
        oscillator.connect(gain).connect(this.audio.destination);
        oscillator.start();
        oscillator.stop(this.audio.currentTime + duration);
      } catch (error) {}
    }

    frame(time) {
      if (this.destroyed) return;
      const dt = Math.min(.04, Math.max(0, (time - this.lastFrame) / 1000));
      this.lastFrame = time;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(next => this.frame(next));
    }

    camera() {
      return {
        x: this.vehicle.x,
        y: this.vehicle.y,
        scale: this.zoom,
        offsetX: (this.viewWidth || innerWidth) / 2,
        offsetY: (this.viewHeight || innerHeight) / 2
      };
    }

    draw() {
      const ctx = this.ctx;
      const camera = this.camera();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();
      ctx.translate(camera.offsetX, camera.offsetY);
      ctx.scale(camera.scale, camera.scale);
      ctx.translate(-camera.x, -camera.y);
      this.drawFloor(ctx);
      this.drawTruckQueue(ctx);
      this.drawMazeElements(ctx);
      this.drawRoute(ctx);
      this.drawZones(ctx);
      this.obstacles.forEach(rect => this.drawRack(ctx, rect));
      this.drawBoosts(ctx);
      this.drawPallets(ctx);
      if (this.bot) this.drawVehicle(ctx, this.bot.x, this.bot.y, this.bot.angle, "#39829c", false, true);
      this.workers.filter(worker => !worker.injured).forEach(worker => this.drawWorker(ctx, worker));
      if (this.incident) this.drawIncident(ctx);
      this.drawVehicle(
        ctx,
        this.vehicle.x,
        this.vehicle.y,
        this.vehicle.angle,
        this.playerVehicle === "forklift" ? "#df8f35" : "#e4b637",
        true,
        false
      );
      this.drawSpeechBubbles(ctx);
      ctx.restore();
      this.drawObjectiveIndicator(ctx);
    }

    drawFloor(ctx) {
      const gradient = ctx.createLinearGradient(0, 0, this.world.w, this.world.h);
      gradient.addColorStop(0, "#758187");
      gradient.addColorStop(1, "#58666c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.world.w, this.world.h);
      ctx.fillStyle = "rgba(42,57,63,.25)";
      ctx.fillRect(455, 585, 1175, 230);
      ctx.strokeStyle = "rgba(250,215,91,.72)";
      ctx.lineWidth = 4;
      ctx.setLineDash([24, 18]);
      ctx.strokeRect(465, 595, 1155, 210);
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= this.world.w; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.world.h); ctx.stroke(); }
      for (let y = 0; y <= this.world.h; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.world.w, y); ctx.stroke(); }
      ctx.strokeStyle = "#28373d";
      ctx.lineWidth = 18;
      ctx.strokeRect(5, 5, this.world.w - 10, this.world.h - 10);
      ctx.setLineDash([24, 18]);
      ctx.strokeStyle = "rgba(245,210,87,.6)";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(470, 700); ctx.lineTo(1610, 700); ctx.stroke();
      ctx.setLineDash([]);
      const stageColors = [
        ["rgba(85,176,215,.18)", "#77cfea"],
        ["rgba(225,174,78,.18)", "#e4ba65"],
        ["rgba(91,200,126,.18)", "#75dc98"]
      ];
      const stageColumnWidth = this.stagingZone.w / PALLET_CATEGORIES.length;
      PALLET_CATEGORIES.forEach((category, index) => {
        const x = this.stagingZone.x + index * stageColumnWidth;
        ctx.fillStyle = stageColors[index][0];
        ctx.strokeStyle = stageColors[index][1];
        ctx.lineWidth = 3;
        ctx.setLineDash([13, 10]);
        ctx.fillRect(x, this.stagingZone.y, stageColumnWidth, this.stagingZone.h);
        ctx.strokeRect(x, this.stagingZone.y, stageColumnWidth, this.stagingZone.h);
        ctx.setLineDash([]);
        ctx.fillStyle = "#f4fbfd";
        ctx.font = "900 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(category.short, x + stageColumnWidth / 2, this.stagingZone.y - 12);
      });
      ctx.fillStyle = "#d3f7ff";
      ctx.font = "900 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "ЗОНА КОМПЛЕКТАЦІЇ",
        this.stagingZone.x + this.stagingZone.w / 2,
        this.stagingZone.y - 34
      );
    }

    drawTruckQueue(ctx) {
      if (!this.modeConfig.trailer) return;
      ctx.save();
      ctx.fillStyle = "#46555c";
      ctx.fillRect(900, 35, 1290, 400);
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.lineWidth = 3;
      ctx.strokeRect(900, 35, 1290, 400);
      ctx.fillStyle = "#aebdc3";
      ctx.font = "900 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText("ЧЕРГА ФУР", 920, 65);
      const waiting = Math.max(0, this.truckQueueTotal - 1);
      for (let index = 0; index < waiting; index++) {
        const column = index % 5;
        const row = Math.floor(index / 5);
        const x = 940 + column * 245;
        const y = 105 + row * 145;
        ctx.fillStyle = index % 2 ? "#cfd8dc" : "#b9c8cd";
        ctx.fillRect(x, y, 165, 58);
        ctx.fillStyle = "#56717c";
        ctx.beginPath();
        ctx.roundRect(x + 165, y + 5, 55, 48, [4, 16, 16, 4]);
        ctx.fill();
        ctx.fillStyle = "#18262b";
        ctx.fillRect(x + 25, y - 6, 24, 8);
        ctx.fillRect(x + 25, y + 56, 24, 8);
        ctx.fillRect(x + 177, y - 4, 20, 7);
        ctx.fillRect(x + 177, y + 55, 20, 7);
        ctx.fillStyle = "#263840";
        ctx.font = "900 11px Arial";
        ctx.textAlign = "center";
        const destination = this.truckDestinations[this.trucksCompleted + index + 1];
        ctx.fillText(destination ? destination.toUpperCase() : `РЕЙС #${this.level + index + 1}`, x + 82, y + 34);
      }
      ctx.fillStyle = "#7d8b90";
      ctx.fillRect(900, 435, 1300, 28);
      ctx.restore();
    }

    drawMazeElements(ctx) {
      if (!this.levelRules.maze || !this.mazePlate) return;
      ctx.save();
      const pulse = .16 + (Math.sin(this.elapsed * 2.6) + 1) * .07;
      ctx.fillStyle = this.mazeGateOpen ? "rgba(82,230,137,.38)" : `rgba(236,193,72,${pulse})`;
      ctx.strokeStyle = this.mazeGateOpen ? "#69ec99" : "rgba(244,207,93,.48)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.mazePlate.x, this.mazePlate.y, this.mazePlate.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (this.mazeGateOpen) {
        ctx.setLineDash([14, 12]);
        ctx.beginPath();
        ctx.moveTo(790, 520);
        ctx.lineTo(790, 820);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    drawBoosts(ctx) {
      this.boosts.forEach(boost => {
        if (!boost.active) return;
        boost.phase += .035;
        const radius = 19 + Math.sin(boost.phase) * 3;
        const colors = { speed: "#55c9ff", shield: "#79e59a", score: "#f2c950" };
        const labels = { speed: "⚡", shield: "◆", score: "+75" };
        ctx.save();
        ctx.translate(boost.x, boost.y);
        ctx.fillStyle = `${colors[boost.type]}35`;
        ctx.strokeStyle = colors[boost.type];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = boost.type === "score" ? "900 10px Arial" : "900 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[boost.type], 0, 1);
        ctx.restore();
      });
    }

    drawSpeechBubbles(ctx) {
      this.speechBubbles.forEach(bubble => {
        const actor = bubble.actor;
        if (!actor) return;
        const width = clamp(bubble.text.length * 6.5 + 22, 80, 180);
        const x = actor.x - width / 2;
        const y = actor.y - 67;
        ctx.save();
        ctx.fillStyle = "rgba(250,252,252,.94)";
        ctx.strokeStyle = "rgba(15,35,43,.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, 31, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#14242b";
        ctx.font = "900 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(bubble.text, actor.x, y + 16, width - 12);
        ctx.restore();
      });
    }

    drawRoute(ctx) {
      if (this.levelRules.maze) return;
      const target = this.objectivePoint();
      ctx.save();
      ctx.setLineDash([18, 15]);
      ctx.lineDashOffset = -this.elapsed * 35;
      ctx.strokeStyle = "rgba(102,255,155,.7)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(this.vehicle.x, this.vehicle.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.restore();
    }

    objectivePoint() {
      if (this.modeConfig.trailer && this.trailerAwaitingDeparture) {
        return {
          x: this.trailerSafeZone.x + this.trailerSafeZone.w / 2,
          y: this.trailerSafeZone.y + this.trailerSafeZone.h / 2
        };
      }
      if (!this.vehicle.carrying) {
        const staged = this.botStagedPallets[0];
        if (staged) return staged;
        const available = this.pallets.find(pallet =>
          !pallet.carried && !pallet.delivered && (pallet.damage || 0) < 100
        );
        return available || { x: this.source.x + this.source.w / 2, y: this.source.y + this.source.h / 2 };
      }
      return this.slots.find(slot =>
        !slot.occupied
        && (
          this.modeConfig.trailer
          || !this.vehicle.carrying?.category?.id
          || slot.category?.id === this.vehicle.carrying.category.id
        )
      )
        || (this.modeConfig.trailer
          ? { x: this.trailer.x + this.trailer.w / 2, y: this.trailer.y + this.trailer.h / 2 }
          : { x: this.destination.x + this.destination.w / 2, y: this.destination.y + this.destination.h / 2 });
    }

    drawObjectiveIndicator(ctx) {
      if (this.levelRules.maze) return;
      const target = this.objectivePoint();
      const width = this.viewWidth || innerWidth;
      const height = this.viewHeight || innerHeight;
      const rawX = width / 2 + (target.x - this.vehicle.x) * this.zoom;
      const rawY = height / 2 + (target.y - this.vehicle.y) * this.zoom;
      const marginX = 78;
      const marginTop = 90;
      const marginBottom = 122;
      const x = clamp(rawX, marginX, width - marginX);
      const y = clamp(rawY, marginTop, height - marginBottom);
      const angle = Math.atan2(rawY - height / 2, rawX - width / 2);
      const meters = Math.max(1, Math.round(Math.hypot(target.x - this.vehicle.x, target.y - this.vehicle.y) / 10));
      const targetText = this.vehicle.carrying && target.id != null ? `МІСЦЕ №${target.id}` : `${meters} м`;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = this.vehicle.carrying ? "#62f293" : "#f4cb4f";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-12, -17);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-12, 17);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(5,18,24,.84)";
      ctx.strokeStyle = this.vehicle.carrying ? "#62f293" : "#f4cb4f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 43, y + 25, 86, 23, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "900 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(targetText, x, y + 36);
      ctx.restore();
    }

    drawZones(ctx) {
      this.zone(ctx, this.source, "#e1b83d", "СКЛАД А · ПІДДОНИ РОЗМІЩЕНІ ПО ВСІЙ ЗОНІ");
      if (!this.modeConfig.trailer) {
        this.zone(ctx, this.destination, "#42ca79", "СКЛАД Б · РОЗПОДІЛ ЗА КАТЕГОРІЯМИ");
        const categoryColors = {
          raw: ["rgba(88,181,218,.2)", "#7dd3ed"],
          pack: ["rgba(225,177,79,.2)", "#e7bd69"],
          finished: ["rgba(85,205,126,.2)", "#7ae09c"]
        };
        PALLET_CATEGORIES.forEach(category => {
          const categorySlots = this.slots.filter(slot => slot.category?.id === category.id);
          if (!categorySlots.length) return;
          const left = Math.min(...categorySlots.map(slot => slot.x - 52));
          const right = Math.max(...categorySlots.map(slot => slot.x + 52));
          const top = Math.min(...categorySlots.map(slot => slot.y - 38));
          const bottom = Math.max(...categorySlots.map(slot => slot.y + 38));
          const colors = categoryColors[category.id];
          ctx.fillStyle = colors[0];
          ctx.strokeStyle = colors[1];
          ctx.lineWidth = 3;
          ctx.fillRect(left - 4, top - 28, right - left + 8, bottom - top + 32);
          ctx.strokeRect(left - 4, top - 28, right - left + 8, bottom - top + 32);
          ctx.fillStyle = "#f4fff7";
          ctx.font = "900 10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            category.id === "finished" ? "ЗОНА ГП" : `ЗОНА ${category.label}`,
            (left + right) / 2,
            top - 15,
            right - left
          );
        });
        this.slots.forEach(slot => {
          ctx.fillStyle = slot.occupied ? "#2f9f61" : "rgba(89,221,133,.18)";
          ctx.strokeStyle = slot.occupied ? "#d1ffe0" : "#76e99d";
          ctx.lineWidth = 3;
          ctx.fillRect(slot.x - 52, slot.y - 38, 104, 76);
          ctx.strokeRect(slot.x - 52, slot.y - 38, 104, 76);
          ctx.fillStyle = slot.occupied ? "#fff" : "#d0f7dc";
          ctx.font = "900 22px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(slot.id), slot.x, slot.y - 8);
          ctx.font = "900 9px Arial";
          ctx.fillText(slot.category?.short || "", slot.x, slot.y + 19, 92);
        });
        this.drawTargetArrow(ctx, this.destination.x + this.destination.w / 2, this.destination.y - 35);
      } else {
        ctx.save();
        const rearX = this.trailer.x;
        const centerY = this.trailer.y + this.trailer.h / 2;
        const cabinX = this.trailer.x + this.trailer.w;
        const cabinW = 170;
        const safeZone = this.trailerSafeZone;

        ctx.fillStyle = this.trailerAwaitingDeparture ? "rgba(70,220,125,.32)" : "rgba(70,220,125,.14)";
        ctx.strokeStyle = "#5fe18e";
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 9]);
        ctx.fillRect(safeZone.x, safeZone.y, safeZone.w, safeZone.h);
        ctx.strokeRect(safeZone.x, safeZone.y, safeZone.w, safeZone.h);
        ctx.setLineDash([]);
        ctx.fillStyle = "#d8ffe5";
        ctx.font = "900 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("БЕЗПЕЧНА ЗОНА", safeZone.x + safeZone.w / 2, safeZone.y - 10);

        const lightX = rearX + 22;
        const lightY = this.trailer.y - 48;
        ctx.fillStyle = "#17262d";
        ctx.beginPath();
        ctx.roundRect(lightX - 17, lightY - 32, 34, 64, 9);
        ctx.fill();
        ctx.fillStyle = this.trafficLight === "red" ? "#ff4e4e" : "#5f281f";
        ctx.beginPath(); ctx.arc(lightX, lightY - 15, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = this.trafficLight === "green" ? "#55e583" : "#234f34";
        ctx.beginPath(); ctx.arc(lightX, lightY + 15, 9, 0, TAU); ctx.fill();

        // Відкрита площадка перед задньою частиною фури — без воріт і стінки.
        ctx.fillStyle = "#9aa7ac";
        ctx.fillRect(rearX - 155, this.trailer.y + 34, 155, this.trailer.h - 68);
        ctx.setLineDash([15, 12]);
        ctx.strokeStyle = "#f3cb55";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(rearX - 140, this.trailer.y + 48);
        ctx.lineTo(rearX - 140, this.trailer.y + this.trailer.h - 48);
        ctx.stroke();
        ctx.setLineDash([]);

        // Вантажний відсік: задня ліва сторона повністю відкрита.
        ctx.save();
        ctx.translate(this.trailerVisualOffset(), 0);
        ctx.fillStyle = "#33464e";
        ctx.shadowColor = "rgba(0,0,0,.4)";
        ctx.shadowBlur = 20;
        ctx.fillRect(this.trailer.x, this.trailer.y + 34, this.trailer.w - 34, this.trailer.h - 68);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#d8e0e3";
        ctx.fillRect(this.trailer.x, this.trailer.y, this.trailer.w, 34);
        ctx.fillRect(this.trailer.x, this.trailer.y + this.trailer.h - 34, this.trailer.w, 34);
        ctx.fillRect(this.trailer.x + this.trailer.w - 34, this.trailer.y, 34, this.trailer.h);
        ctx.strokeStyle = "#5ee08c";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(rearX, this.trailer.y + 34);
        ctx.lineTo(cabinX - 34, this.trailer.y + 34);
        ctx.lineTo(cabinX - 34, this.trailer.y + this.trailer.h - 34);
        ctx.lineTo(rearX, this.trailer.y + this.trailer.h - 34);
        ctx.stroke();

        // Кабіна, вид зверху.
        ctx.fillStyle = "#d5dde0";
        ctx.beginPath();
        ctx.roundRect(cabinX - 2, this.trailer.y + 34, cabinW, this.trailer.h - 68, [18, 46, 46, 18]);
        ctx.fill();
        ctx.fillStyle = "#4e6974";
        ctx.beginPath();
        ctx.roundRect(cabinX + 28, this.trailer.y + 76, 82, this.trailer.h - 152, 18);
        ctx.fill();
        ctx.fillStyle = "#24363e";
        ctx.fillRect(cabinX + 112, this.trailer.y + 95, 38, this.trailer.h - 190);
        ctx.fillStyle = "#18262b";
        ctx.fillRect(cabinX + 18, this.trailer.y + 18, 48, 22);
        ctx.fillRect(cabinX + 18, this.trailer.y + this.trailer.h - 40, 48, 22);
        ctx.fillRect(cabinX + 116, this.trailer.y + 18, 38, 22);
        ctx.fillRect(cabinX + 116, this.trailer.y + this.trailer.h - 40, 38, 22);

        ctx.fillStyle = "#183027";
        ctx.font = "900 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `ЗАВАНТАЖЕННЯ · ${this.currentTruckDestination.toUpperCase()} · ФУРА ${this.trailerRound}/${this.trucksRequired}`,
          this.trailer.x + this.trailer.w / 2,
          this.trailer.y - 22
        );
        this.slots.forEach(slot => {
          const showOccupied = slot.occupied && (!this.trailerTransition || this.trailerTransition.timer < 3);
          ctx.fillStyle = showOccupied ? "#2f9f61" : "rgba(89,221,133,.16)";
          ctx.strokeStyle = showOccupied ? "#a7f4c1" : "#66df91";
          ctx.lineWidth = 2;
          ctx.fillRect(slot.x - 34, slot.y - 42, 68, 84);
          ctx.strokeRect(slot.x - 34, slot.y - 42, 68, 84);
          ctx.fillStyle = showOccupied ? "#fff" : "#b8efca";
          ctx.font = "900 17px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(slot.id), slot.x, slot.y);
        });
        ctx.restore();

        const gateProgress = this.trailerGateProgress();
        if (gateProgress > 0) {
          const gateHeight = (this.trailer.h - 68) * gateProgress;
          ctx.fillStyle = "#c7d1d5";
          ctx.strokeStyle = "#e0b946";
          ctx.lineWidth = 5;
          ctx.fillRect(rearX - 10, this.trailer.y + 34, 22, gateHeight);
          ctx.strokeRect(rearX - 10, this.trailer.y + 34, 22, gateHeight);
        }
        ctx.restore();
        if (this.trailerAwaitingDeparture) {
          this.drawTargetArrow(ctx, safeZone.x + safeZone.w / 2, safeZone.y - 35);
        } else {
          this.drawTargetArrow(ctx, rearX - 65, centerY - 70);
        }
      }
    }

    zone(ctx, rect, color, label) {
      ctx.save();
      ctx.fillStyle = `${color}45`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = color;
      ctx.font = "900 25px Arial";
      ctx.textAlign = "center";
      ctx.fillText(label, rect.x + rect.w / 2, rect.y - 22);
      ctx.restore();
    }

    drawTargetArrow(ctx, x, y) {
      const bounce = Math.sin(this.elapsed * 4) * 12;
      ctx.save();
      ctx.translate(x, y + bounce);
      ctx.fillStyle = "#6dff9d";
      ctx.shadowColor = "#50f18a";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(0, 28); ctx.lineTo(-27, -8); ctx.lineTo(-10, -8); ctx.lineTo(-10, -36);
      ctx.lineTo(10, -36); ctx.lineTo(10, -8); ctx.lineTo(27, -8); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    drawRack(ctx, rect) {
      if (rect.type === "outside-wall") {
        ctx.save();
        ctx.fillStyle = "#26383f";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();
        ctx.strokeStyle = "#e7bd3e";
        ctx.lineWidth = 10;
        for (let x = rect.x - rect.h; x < rect.x + rect.w + rect.h; x += 34) {
          ctx.beginPath();
          ctx.moveTo(x, rect.y + rect.h);
          ctx.lineTo(x + rect.h, rect.y);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
      if (["trailer-wall", "trailer-cab"].includes(rect.type)) return;
      if (rect.type === "maze-wall" || rect.type === "maze-gate") {
        ctx.save();
        ctx.fillStyle = rect.type === "maze-gate" ? "#8b7440" : "#344a54";
        ctx.strokeStyle = rect.type === "maze-gate" ? "#d1b35d" : "#6d8791";
        ctx.lineWidth = 5;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.fillStyle = "#264d63";
      ctx.shadowColor = "rgba(0,0,0,.38)";
      ctx.shadowBlur = 12;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#76a1b6";
      ctx.lineWidth = 6;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = "#b77b3f";
      for (let y = rect.y + 35; y < rect.y + rect.h - 20; y += 70) ctx.fillRect(rect.x + 18, y, rect.w - 36, 38);
      ctx.restore();
    }

    drawPallets(ctx) {
      this.pallets.forEach(pallet => {
        if (pallet.carried) return;
        if (this.trailerTransition && pallet.delivered && this.trailerTransition.timer >= 3) return;
        ctx.save();
        const transitionOffset = this.trailerTransition && pallet.delivered ? this.trailerVisualOffset() : 0;
        ctx.translate(pallet.x + transitionOffset, pallet.y);
        ctx.fillStyle = pallet.delivered ? "#2d9d5e" : "#8d5f31";
        ctx.fillRect(-34, -25, 68, 50);
        ctx.fillStyle = pallet.delivered ? "#8ee5ae" : pallet.color;
        ctx.fillRect(-29, -21, 58, 40);
        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.strokeRect(-29, -21, 58, 40);
        if (pallet.destination) {
          ctx.fillStyle = "rgba(9,22,28,.9)";
          ctx.fillRect(-29, -7, 58, 15);
          ctx.fillStyle = "#fff";
          ctx.font = "900 8px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pallet.destination.toUpperCase(), 0, 1, 54);
        } else if (pallet.category) {
          ctx.fillStyle = "rgba(9,22,28,.9)";
          ctx.fillRect(-29, -7, 58, 15);
          ctx.fillStyle = "#fff";
          ctx.font = "900 7px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pallet.category.short, 0, 1, 54);
        }
        if ((pallet.damage || 0) > 0) {
          ctx.fillStyle = pallet.damage >= 100 ? "#901f28" : pallet.damage > 50 ? "#c74343" : "#e5b442";
          ctx.fillRect(-29, 13, 58 * clamp(pallet.damage / 100, 0, 1), 6);
          ctx.fillStyle = "#fff";
          ctx.font = "900 9px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`${Math.round(pallet.damage)}%`, 0, -29);
        }
        ctx.restore();
      });
      this.botStagedPallets.forEach((pallet, index) => {
        ctx.save();
        ctx.translate(pallet.x, pallet.y);
        ctx.fillStyle = "#8d5f31";
        ctx.fillRect(-34, -25, 68, 50);
        ctx.fillStyle = pallet.color || (index % 2 ? "#d39a55" : "#8bc5dc");
        ctx.fillRect(-29, -21, 58, 40);
        ctx.strokeStyle = "rgba(255,255,255,.45)";
        ctx.strokeRect(-29, -21, 58, 40);
        ctx.fillStyle = "rgba(9,22,28,.9)";
        ctx.fillRect(-29, -7, 58, 15);
        ctx.fillStyle = "#fff";
        ctx.font = "900 8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          (pallet.destination || pallet.category?.short || "ГОТОВО").toUpperCase(),
          0,
          1,
          54
        );
        ctx.restore();
      });
    }

    drawWorker(ctx, worker) {
      ctx.save();
      ctx.translate(worker.x, worker.y);
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#17252b";
      ctx.beginPath(); ctx.ellipse(0, 8, 13, 20, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = worker.color;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = "#e5b18a";
      ctx.beginPath(); ctx.arc(0, -15, 8, 0, TAU); ctx.fill();
      ctx.restore();
    }

    drawIncident(ctx) {
      const scene = this.incident;
      if (!scene) return;
      const victim = scene.victim;
      ctx.save();
      if (victim.carriedAway) {
        const left = Math.min(scene.medics[0].x, scene.medics[1].x);
        const right = Math.max(scene.medics[0].x, scene.medics[1].x);
        ctx.strokeStyle = "#f1b34d";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(left, victim.y);
        ctx.lineTo(right, victim.y);
        ctx.stroke();
        ctx.fillStyle = victim.color;
        ctx.beginPath();
        ctx.ellipse(victim.x, victim.y, 24, 10, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = victim.color;
        ctx.beginPath();
        ctx.ellipse(victim.x, victim.y, 24, 11, -.2, 0, TAU);
        ctx.fill();
      }
      this.drawResponder(ctx, scene.inspector, "#2f65ad", "ІНСПЕКТОР");
      scene.medics.forEach(medic => this.drawResponder(ctx, medic, "#f2f5f6", "МЕДИК", true));
      ctx.restore();
    }

    drawResponder(ctx, actor, color, label, medic) {
      ctx.save();
      ctx.translate(actor.x, actor.y);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, TAU);
      ctx.fill();
      if (medic) {
        ctx.strokeStyle = "#d83838";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
        ctx.moveTo(0, -7); ctx.lineTo(0, 7);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(6,18,24,.9)";
      ctx.fillRect(-37, -34, 74, 15);
      ctx.fillStyle = "#fff";
      ctx.font = "900 8px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, -26);
      ctx.restore();
    }

    drawVehicle(ctx, x, y, angle, color, player, bot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const enlarged = bot || (player && this.playerVehicle === "forklift");
      if (enlarged) {
        ctx.save();
        ctx.scale(bot ? 1.18 : 1.14, bot ? 1.18 : 1.14);
      }
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillRect(-28, -24, 57, 48);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#17252a";
      ctx.fillRect(-22, -18, 26, 36);
      ctx.fillStyle = "#e8b58c";
      ctx.beginPath(); ctx.arc(-8, 0, 8, 0, TAU); ctx.fill();
      if (bot) {
        ctx.fillStyle = Math.sin(this.bot?.beacon || 0) > 0 ? "#ffd94a" : "#8b6d1e";
        ctx.shadowColor = "#ffd94a";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, -24, 7, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "900 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BOT", -9, 4);
      } else if (player && this.playerVehicle === "forklift") {
        ctx.fillStyle = "#fff";
        ctx.font = "900 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("КАРА", -7, 3);
      }
      if (enlarged) {
        ctx.restore();
      }
      // Вила і піддон мають однаковий реальний розмір у гравця та службової кари.
      ctx.fillStyle = "#18262b";
      ctx.fillRect(25, -20, 48, 7);
      ctx.fillRect(25, 13, 48, 7);
      if (player && this.vehicle.carrying) {
        ctx.fillStyle = this.vehicle.carrying.color;
        ctx.fillRect(48, -28, 58, 56);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(48, -28, 58, 56);
      }
      if (bot) {
        if (this.bot?.carrying) {
          ctx.fillStyle = "#c68d4c";
          ctx.fillRect(48, -28, 58, 56);
          ctx.strokeStyle = "#f2d2a5";
          ctx.lineWidth = 2;
          ctx.strokeRect(48, -28, 58, 56);
          if (
            (this.modeConfig.trailer && this.bot?.cargoDestination)
            || (!this.modeConfig.trailer && this.bot?.cargoCategory)
          ) {
            ctx.fillStyle = "rgba(9,22,28,.9)";
            ctx.fillRect(48, -7, 58, 15);
            ctx.fillStyle = "#fff";
            ctx.font = "900 8px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              (
                this.modeConfig.trailer
                  ? this.bot.cargoDestination
                  : this.bot.cargoCategory?.short
              ).toUpperCase(),
              77,
              1,
              54
            );
          }
        }
      }
      ctx.restore();
    }

    updateHUD() {
      this.root.querySelector("[data-fg2='level']").textContent = String(this.level);
      this.root.querySelector("[data-fg2='time']").textContent = this.levelRules.timeLimit
        ? timeText(Math.max(0, this.levelRules.timeLimit - this.elapsed))
        : timeText(this.elapsed);
      this.root.querySelector("[data-fg2='delivery']").textContent = `${this.delivered} / ${this.target}`;
      this.root.querySelector("[data-fg2='score']").textContent = String(Math.round(this.score));
      this.root.querySelector("[data-fg2='vehicle']").textContent = this.playerVehicle === "forklift"
        ? `Кара · ${this.forkliftSpeedMode === "fast" ? "Заєць" : "Черепашка"}`
        : "Електровізок";
      const carried = this.vehicle.carrying;
      this.root.querySelector("[data-fg2='integrity']").textContent = carried
        ? `${Math.round(100 - (carried.damage || 0))}%`
        : "—";
      const boostParts = [];
      const speedRemaining = Math.max(0, this.speedBoostUntil - this.elapsed);
      const shieldRemaining = Math.max(0, this.shieldBoostUntil - this.elapsed);
      if (speedRemaining > 0) boostParts.push(`⚡ ${timeText(speedRemaining)}`);
      if (shieldRemaining > 0) boostParts.push(`🛡 ${timeText(shieldRemaining)}`);
      const boostChip = this.root.querySelector("[data-fg2='boost-chip']");
      boostChip?.classList.toggle("fg2-hidden", boostParts.length === 0);
      const boostValue = this.root.querySelector("[data-fg2='boost']");
      if (boostValue) boostValue.textContent = boostParts.join(" · ") || "—";
    }

    notice(text, type) {
      const area = this.root?.querySelector(".fg2-notices");
      if (!area) return;
      const duplicate = Array.from(area.children).find(item => item.textContent === text);
      if (duplicate) return;
      const element = document.createElement("div");
      element.className = `fg2-notice ${type || ""}`;
      element.textContent = text;
      area.appendChild(element);
      while (area.children.length > 2) area.firstElementChild?.remove();
      setTimeout(() => element.remove(), 1850);
    }

    helpScreen() {
      const screen = this.root.querySelector(".fg2-screen");
      const previousContent = screen.innerHTML;
      screen.innerHTML = `
        <div class="fg2-menu">
          <h1>Керування</h1>
          <p><strong>Телефон:</strong> джойстик задає напрям руху. Кнопки праворуч керують вилами та сигналом. Для кари кнопка «Черепашка / Заєць» перемикає швидкість. Два пальці змінюють масштаб.</p>
          <p><strong>Комп’ютер:</strong> стрілки або W/A/S/D — рух, Q — підняти вила, E — опустити, H або F — сигнал, T — швидкість кари.</p>
          <p>Піддон можна взяти з будь-якого місця й поставити назад, у фуру, у зону призначення або в інше вільне місце.</p>
          <div class="fg2-actions"><button class="fg2-btn primary" data-help="back">Зрозуміло</button></div>
        </div>`;
      screen.querySelector("[data-help='back']").addEventListener("click", () => {
        screen.innerHTML = previousContent;
        this.bindMenuActions(screen);
      });
    }

    pauseMenu() {
      if (!this.running || this.destroyed || this.over) return;
      this.paused = true;
      const screen = this.root.querySelector(".fg2-screen");
      screen.innerHTML = `
        <div class="fg2-menu"><div class="fg2-kicker">Пауза</div><h1>Зміна призупинена</h1>
        <p>Можна продовжити, змінити режим у меню гри або повернутися до застосунку.</p>
        <div class="fg2-actions"><button class="fg2-btn primary" data-pause="resume">Продовжити</button><button class="fg2-btn" data-pause="menu">Меню гри</button><button class="fg2-btn danger" data-pause="exit">Вийти в склад</button></div></div>`;
      screen.classList.remove("hidden");
      screen.querySelector("[data-pause='resume']").addEventListener("click", () => { screen.classList.add("hidden"); this.paused = false; this.lastFrame = performance.now(); });
      screen.querySelector("[data-pause='menu']").addEventListener("click", () => this.returnToMenu());
      screen.querySelector("[data-pause='exit']").addEventListener("click", () => this.destroy());
    }

    complete() {
      this.paused = true;
      this.stats.bestScore = Math.max(this.stats.bestScore, Math.round(this.score));
      if (this.modeConfig.trailer && (!this.stats.bestTrailer || this.elapsed < this.stats.bestTrailer)) this.stats.bestTrailer = Math.floor(this.elapsed);
      this.stats.levels[this.mode] = Math.max(
        Number(this.stats.levels[this.mode]) || 1,
        Math.min(10, this.level + 1)
      );
      saveStats(this.stats);
      this.resultScreen(
        `Рівень ${this.level} пройдено!`,
        `${this.modeConfig.name} · Час: ${timeText(this.elapsed)} · Результат: ${Math.round(this.score)} балів`
          + (this.wrongDeliveries ? ` · Не за призначенням: ${this.wrongDeliveries}` : ""),
        true
      );
    }

    gameOver(message) {
      if (this.over) return;
      this.over = true;
      this.paused = true;
      this.resultScreen("Game Over", message || "Бали закінчилися. Спробуй пройти зміну обережніше.");
    }

    resultScreen(title, message, wonLevel) {
      const screen = this.root.querySelector(".fg2-screen");
      screen.innerHTML = `
        <div class="fg2-menu"><div class="fg2-kicker">Результат зміни</div><h1>${title}</h1><p>${message}</p>
        <div class="fg2-actions">${wonLevel && this.level < 10 ? '<button class="fg2-btn primary" data-result="next">Наступний рівень</button>' : ""}<button class="fg2-btn" data-result="again">Повторити рівень</button><button class="fg2-btn" data-result="menu">Меню гри</button><button class="fg2-btn danger" data-result="exit">Вийти</button></div></div>`;
      screen.classList.remove("hidden");
      screen.querySelector("[data-result='next']")?.addEventListener("click", () => this.nextLevel());
      screen.querySelector("[data-result='again']").addEventListener("click", () => this.restartLevel());
      screen.querySelector("[data-result='menu']").addEventListener("click", () => this.returnToMenu());
      screen.querySelector("[data-result='exit']").addEventListener("click", () => this.destroy());
    }

    nextLevel() {
      const mode = this.mode;
      const nextLevel = this.level + 1;
      const options = this.options;
      const playerVehicle = this.playerVehicle;
      this.destroy(true);
      const next = global.ForkliftGame.launch(options);
      next.playerVehicle = playerVehicle;
      next.start(mode, nextLevel);
    }

    restartLevel() {
      const mode = this.mode;
      const level = this.level;
      const options = this.options;
      const playerVehicle = this.playerVehicle;
      this.destroy(true);
      const next = global.ForkliftGame.launch(options);
      next.playerVehicle = playerVehicle;
      next.start(mode, level);
    }

    returnToMenu() {
      const options = this.options;
      const playerVehicle = this.playerVehicle;
      this.destroy(true);
      const next = global.ForkliftGame.launch(options);
      next.playerVehicle = playerVehicle;
    }

    resize() {
      if (!this.canvas) return;
      const ratio = Math.min(global.devicePixelRatio || 1, 2);
      this.viewWidth = innerWidth;
      this.viewHeight = innerHeight;
      this.canvas.width = Math.round(this.viewWidth * ratio);
      this.canvas.height = Math.round(this.viewHeight * ratio);
      this.canvas.style.width = `${this.viewWidth}px`;
      this.canvas.style.height = `${this.viewHeight}px`;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    destroy(silent) {
      if (this.destroyed) return;
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      removeEventListener("resize", this.resizeHandler);
      removeEventListener("keydown", this.keyDownHandler);
      removeEventListener("keyup", this.keyUpHandler);
      try { this.audio?.close(); } catch (error) {}
      try { screen.orientation?.unlock?.(); } catch (error) {}
      if (document.fullscreenElement === this.root) {
        try { document.exitFullscreen()?.catch?.(() => {}); } catch (error) {}
      }
      this.root?.remove();
      document.body.style.overflow = this.previousOverflow || "";
      if (activeGame === this) activeGame = null;
      if (!silent && typeof this.options.onExit === "function") this.options.onExit();
    }
  }

  global.ForkliftGame = {
    launch(options) {
      activeGame?.destroy(true);
      activeGame = new Game2D(options).mount();
      return activeGame;
    },
    close() {
      activeGame?.destroy();
    }
  };
})(window);
