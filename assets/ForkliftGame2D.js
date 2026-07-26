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
      name: "Експрес-зміна", target: 12, timeLimit: 180,
      goal: "ЕКСПРЕС: достав 12 піддонів за 3 хвилини"
    },
    safety: {
      name: "Безпечна зміна", target: 10, strictSafety: true,
      goal: "БЕЗПЕЧНА ЗМІНА: достав 10 піддонів без жодного зіткнення"
    },
    training: {
      name: "Вільне тренування", target: 15, noPenalties: true,
      goal: "ТРЕНУВАННЯ: переміщуй піддони вільно, без штрафів"
    }
  };
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
      .fg2-screen.hidden,.fg2-hidden{display:none!important}
      .fg2-menu{width:min(100%,580px);max-height:100%;overflow:auto;padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:rgba(7,20,28,.94);box-shadow:0 28px 90px rgba(0,0,0,.58)}
      .fg2-kicker{color:#72d5e4;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.fg2-menu h1{margin:6px 0 8px;font-size:clamp(27px,5vw,44px);line-height:1}.fg2-menu p{margin:0 0 16px;color:#bdcdd5;line-height:1.45}
      .fg2-modes{display:grid;gap:9px}.fg2-mode{display:grid;grid-template-columns:50px 1fr;align-items:center;gap:11px;width:100%;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:17px;background:#142b35;color:#fff;text-align:left}.fg2-mode:active{background:#1b3b48}.fg2-mode-icon{display:grid;width:50px;height:50px;place-items:center;border-radius:14px;background:#28515f;font-size:26px}.fg2-mode strong,.fg2-mode span{display:block}.fg2-mode span span{margin-top:3px;color:#aec1ca;font-size:12px}
      .fg2-stats{margin-top:12px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04)}.fg2-stats summary{padding:10px 12px;cursor:pointer;color:#c8d8df;font-size:12px;font-weight:900;list-style:none}.fg2-stats summary::-webkit-details-marker{display:none}.fg2-stats summary::after{content:"⌄";float:right;font-size:16px}.fg2-stats[open] summary::after{content:"⌃"}.fg2-records{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:0 9px 9px}.fg2-record{padding:8px;border-radius:12px;background:rgba(255,255,255,.07);text-align:center}.fg2-record strong,.fg2-record span{display:block}.fg2-record span{margin-top:2px;color:#a8bbc4;font-size:9px;font-weight:800}
      .fg2-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.fg2-btn{flex:1;min-width:120px;min-height:42px;padding:8px 12px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:#1a303a;color:#fff;font-weight:900}.fg2-btn.primary{background:#e9bd4f;color:#162027}.fg2-btn.danger{background:#53272a}
      .fg2-hud{position:absolute;top:max(9px,env(safe-area-inset-top));left:9px;right:82px;z-index:12;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;pointer-events:none}.fg2-hud-items{display:flex;flex-wrap:wrap;gap:5px}.fg2-chip{min-width:72px;padding:6px 8px;border:1px solid rgba(255,255,255,.17);border-radius:11px;background:rgba(7,18,24,.82);box-shadow:0 7px 20px rgba(0,0,0,.25)}.fg2-chip span,.fg2-chip strong{display:block}.fg2-chip span{color:#a9bbc4;font-size:8px;font-weight:900;text-transform:uppercase}.fg2-chip strong{margin-top:1px;font-size:13px}
      .fg2-goal{position:absolute;top:max(75px,calc(env(safe-area-inset-top) + 66px));left:50%;z-index:11;max-width:60%;padding:7px 12px;border:1px solid rgba(121,238,157,.38);border-radius:999px;background:rgba(9,37,25,.86);font-size:11px;font-weight:900;text-align:center;transform:translateX(-50%);pointer-events:none}
      .fg2-pause{position:absolute;top:max(9px,env(safe-area-inset-top));right:9px;z-index:14;width:66px;height:42px;border:1px solid rgba(255,255,255,.19);border-radius:12px;background:rgba(7,18,24,.88);color:#fff;font-size:11px;font-weight:900}
      .fg2-notices{position:absolute;top:102px;left:50%;z-index:45;display:grid;gap:6px;width:min(78%,420px);pointer-events:none;transform:translateX(-50%)}.fg2-notice{padding:9px 12px;border-radius:13px;background:rgba(11,31,40,.94);box-shadow:0 10px 28px rgba(0,0,0,.36);font-size:12px;font-weight:900;text-align:center;animation:fg2Notice 2.35s both}.fg2-notice.bad{background:rgba(104,32,36,.95)}.fg2-notice.good{background:rgba(20,91,62,.95)}@keyframes fg2Notice{0%{opacity:0;transform:translateY(-8px)}12%,78%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
      .fg2-controls{position:absolute;inset:auto 0 max(7px,env(safe-area-inset-bottom));z-index:15;display:none;align-items:end;justify-content:space-between;padding:7px 15px;pointer-events:none}
      .fg2-joystick{position:relative;width:126px;height:126px;border:2px solid rgba(255,255,255,.35);border-radius:50%;background:rgba(8,25,33,.62);box-shadow:inset 0 0 0 12px rgba(2,9,13,.26);pointer-events:auto;touch-action:none}.fg2-joystick::before,.fg2-joystick::after{content:"";position:absolute;background:rgba(255,255,255,.14)}.fg2-joystick::before{top:50%;left:12%;right:12%;height:1px}.fg2-joystick::after{top:12%;bottom:12%;left:50%;width:1px}.fg2-stick{position:absolute;top:50%;left:50%;width:52px;height:52px;border:2px solid rgba(255,255,255,.45);border-radius:50%;background:#e8ba48;box-shadow:0 6px 16px rgba(0,0,0,.35);transform:translate(-50%,-50%)}
      .fg2-right{display:grid;grid-template-columns:58px 58px;gap:7px;margin-right:18px;pointer-events:auto}.fg2-control{display:grid;width:58px;height:48px;padding:3px;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:14px;background:rgba(11,31,40,.86);color:#fff;font-size:9px;font-weight:900;line-height:1.05;text-align:center;touch-action:none}.fg2-control:active,.fg2-control.active{background:#efc14f;color:#172027;transform:scale(.96)}.fg2-control.horn{background:#315d6b}.fg2-control.wide{grid-column:1/3;width:123px}
      .fg2-zoom-tip{position:absolute;right:18px;bottom:123px;z-index:8;padding:5px 8px;border-radius:9px;background:rgba(5,15,21,.62);color:#c5d5dc;font-size:9px;font-weight:800;pointer-events:none;animation:fg2Tip 5s both}@keyframes fg2Tip{0%,75%{opacity:.85}100%{opacity:0}}
      .fg2-rotate{display:none;position:absolute;inset:0;z-index:60;padding:22px;place-items:center;background:#071018;text-align:center}.fg2-rotate strong{display:block;font-size:45px}.fg2-rotate span{display:block;margin-top:8px;font-weight:900}
      @media(pointer:coarse),(max-width:900px){.fg2-controls{display:flex}.fg2-goal{top:68px}.fg2-notices{top:96px}}
      @media(max-width:700px){.fg2-joystick{width:112px;height:112px}.fg2-stick{width:47px;height:47px}.fg2-right{margin-right:8px}.fg2-chip{min-width:64px;padding:5px 7px}.fg2-chip strong{font-size:11px}.fg2-records{grid-template-columns:1fr}}
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
        total: Number(value.total) || 0
      };
    } catch (error) {
      return { bestTrailer: 0, bestScore: 0, total: 0 };
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
      this.trailer = { x: 1050, y: 500, w: 920, h: 390 };
      this.obstacles = [];
      this.pallets = [];
      this.workers = [];
      this.bot = null;
      this.slots = [];
      this.trailerRound = 1;
      this.incident = null;
      this.audio = null;
      this.effectSources = {
        horn: "./assets/audio/car-horn.mp3?v=316"
      };
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
            <div class="fg2-chip"><span>Час</span><strong data-fg2="time">00:00</strong></div>
            <div class="fg2-chip"><span>Піддони</span><strong data-fg2="delivery">0 / 8</strong></div>
            <div class="fg2-chip"><span>Бали</span><strong data-fg2="score">1000</strong></div>
            <div class="fg2-chip"><span>Вантаж</span><strong data-fg2="integrity">100%</strong></div>
          </div>
        </div>
        <div class="fg2-goal fg2-hidden" data-fg2="goal"></div>
        <div class="fg2-notices"></div>
        <button class="fg2-pause fg2-hidden">☰ Пауза</button>
        <div class="fg2-zoom-tip fg2-hidden">Два пальці — масштаб</div>
        <div class="fg2-controls fg2-hidden">
          <div class="fg2-joystick" aria-label="Джойстик руху"><span class="fg2-stick"></span></div>
          <div class="fg2-right">
            <button class="fg2-control" data-control="lift">Підняти<br>вила</button>
            <button class="fg2-control" data-control="lower">Опустити<br>вила</button>
            <button class="fg2-control horn wide" data-control="horn">📣 Сигнал</button>
          </div>
        </div>
        <div class="fg2-rotate"><div><strong>↻</strong><span>Поверни телефон горизонтально</span></div></div>
        <div class="fg2-screen">
          <div class="fg2-menu">
            <h1>Симулятор транспортувальника</h1>
            <div class="fg2-modes">
              <button class="fg2-mode" data-mode="transport"><span class="fg2-mode-icon">🏭</span><span><strong>Між складами</strong><span>Перевези 8 піддонів із жовтої зони в зелену.</span></span></button>
              <button class="fg2-mode" data-mode="trailer"><span class="fg2-mode-icon">🚛</span><span><strong>Завантаження фури</strong><span>Щільно встанови 33 піддони у пронумеровані місця.</span></span></button>
              <button class="fg2-mode" data-mode="express"><span class="fg2-mode-icon">⏱️</span><span><strong>Експрес-зміна</strong><span>Достав 12 піддонів за три хвилини.</span></span></button>
              <button class="fg2-mode" data-mode="safety"><span class="fg2-mode-icon">🦺</span><span><strong>Безпечна зміна</strong><span>Достав 10 піддонів без жодного зіткнення.</span></span></button>
              <button class="fg2-mode" data-mode="training"><span class="fg2-mode-icon">🎓</span><span><strong>Вільне тренування</strong><span>Тренуйся без штрафів і Game Over.</span></span></button>
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
        </div>`;
      document.body.appendChild(this.root);
      this.canvas = this.root.querySelector(".fg2-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.root.addEventListener("contextmenu", event => event.preventDefault());
      this.root.addEventListener("selectstart", event => event.preventDefault());
      this.root.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => this.start(button.dataset.mode)));
      this.root.querySelector("[data-menu='exit']").addEventListener("click", () => this.destroy());
      this.root.querySelector("[data-menu='help']").addEventListener("click", () => this.helpScreen());
      this.root.querySelector(".fg2-pause").addEventListener("click", () => this.pauseMenu());
      this.resize();
      return this;
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

    start(mode) {
      if (this.running) return;
      this.mode = MODE_CONFIGS[mode] ? mode : "transport";
      this.modeConfig = MODE_CONFIGS[this.mode];
      this.target = this.modeConfig.target;
      this.root.classList.add("playing");
      this.enterLandscape();
      this.buildWorld();
      this.bindControls();
      this.initAudio();
      this.root.querySelector(".fg2-screen").classList.add("hidden");
      this.root.querySelectorAll(".fg2-hud,.fg2-goal,.fg2-pause,.fg2-controls,.fg2-zoom-tip").forEach(element => element.classList.remove("fg2-hidden"));
      this.root.querySelector("[data-fg2='delivery']").textContent = `0 / ${this.target}`;
      this.root.querySelector("[data-fg2='goal']").textContent = this.modeConfig.trailer
        ? `ФУРА №${this.trailerRound} · ${this.modeConfig.goal}`
        : this.modeConfig.goal;
      this.running = true;
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(time => this.frame(time));
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
      this.obstacles = this.modeConfig.trailer
        ? racks.filter(rect => rect.x === 710)
        : racks;
      if (this.modeConfig.trailer) {
        this.obstacles.push(
          { x: this.trailer.x, y: this.trailer.y, w: this.trailer.w, h: 34, type: "trailer-wall" },
          { x: this.trailer.x, y: this.trailer.y + this.trailer.h - 34, w: this.trailer.w, h: 34, type: "trailer-wall" },
          { x: this.trailer.x + this.trailer.w - 34, y: this.trailer.y, w: 34, h: this.trailer.h, type: "trailer-wall" },
          { x: this.trailer.x + this.trailer.w, y: this.trailer.y + 34, w: 170, h: this.trailer.h - 68, type: "trailer-cab" }
        );
      }
      this.pallets = [];
      for (let index = 0; index < 12; index++) {
        const point = this.randomPalletPoint();
        this.pallets.push({
          id: `p${index}`, x: point.x, y: point.y,
          carried: false, delivered: false, slotId: null,
          color: index % 3 === 0 ? "#8bc5dc" : "#d39a55"
        });
      }
      this.slots = [];
      if (this.modeConfig.trailer) {
        for (let column = 0; column < 11; column++) {
          for (let row = 0; row < 3; row++) {
            this.slots.push({
              id: column * 3 + row + 1,
              x: this.trailer.x + 60 + column * 79,
              y: this.trailer.y + 65 + row * 115,
              occupied: false
            });
          }
        }
      } else {
        for (let row = 0; row < 4; row++) {
          for (let column = 0; column < 2; column++) {
            this.slots.push({
              id: row * 2 + column + 1,
              x: this.destination.x + 105 + column * 150,
              y: this.destination.y + 75 + row * 105,
              occupied: false
            });
          }
        }
      }
      this.workers = Array.from({ length: 9 }, (_, index) => {
        const point = this.randomAislePoint(18);
        const target = this.randomAislePoint(18);
        return {
          x: point.x, y: point.y, targetX: target.x, targetY: target.y,
          speed: 42 + Math.random() * 24,
          color: index % 2 ? "#4d82aa" : "#5a926a",
          phase: Math.random() * TAU,
          avoidUntil: 0
        };
      });
      const botPoint = this.randomAislePoint(30);
      const botTarget = this.randomAislePoint(30);
      this.bot = { x: botPoint.x, y: botPoint.y, angle: Math.PI, targetX: botTarget.x, targetY: botTarget.y, speed: 70 };
    }

    randomAislePoint(radius) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const point = { x: 480 + Math.random() * 1070, y: 65 + Math.random() * 1270 };
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

    randomPalletPoint() {
      for (let attempt = 0; attempt < 100; attempt++) {
        const point = {
          x: 110 + Math.random() * 1430,
          y: 100 + Math.random() * 1200
        };
        const blocked = this.obstacles.some(rect => circleRect(point.x, point.y, 42, rect));
        const crowded = this.pallets.some(pallet => Math.hypot(point.x - pallet.x, point.y - pallet.y) < 82);
        const onVehicle = Math.hypot(point.x - this.vehicle.x, point.y - this.vehicle.y) < 100;
        const onWorker = this.workers.some(worker => Math.hypot(point.x - worker.x, point.y - worker.y) < 70);
        const onBot = this.bot && Math.hypot(point.x - this.bot.x, point.y - this.bot.y) < 90;
        const insideTrailer = this.modeConfig.trailer
          && point.x > this.trailer.x - 20
          && point.x < this.trailer.x + this.trailer.w + 180
          && point.y > this.trailer.y - 20
          && point.y < this.trailer.y + this.trailer.h + 20;
        if (!blocked && !crowded && !onVehicle && !onWorker && !onBot && !insideTrailer) return point;
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
          this.controls[action] = true;
          button.classList.add("active");
          this.hydraulic(action);
          button.setPointerCapture?.(event.pointerId);
        });
        const release = event => {
          if (action !== "horn") this.controls[action] = false;
          button.classList.remove("active");
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
      if (this.incident) {
        this.updateIncident(dt);
        this.updateHUD();
        return;
      }
      this.elapsed += dt;
      if (this.modeConfig.timeLimit && this.elapsed >= this.modeConfig.timeLimit) {
        this.gameOver("Час вийшов. Спробуй пройти експрес-зміну швидше.");
        return;
      }
      this.updateVehicle(dt);
      this.updateWorkers(dt);
      this.updateBot(dt);
      this.updateHUD();
    }

    updateVehicle(dt) {
      if (this.incident) {
        this.vehicle.speed = 0;
        return;
      }
      const input = this.movementInput();
      const v = this.vehicle;
      const inTrailer = this.modeConfig.trailer && circleRect(v.x, v.y, 12, this.trailer);
      const maxSpeed = inTrailer ? 92 : (v.carrying ? 150 : 176);
      v.speed += (input.strength * maxSpeed - v.speed) * Math.min(1, dt * 6);
      if (input.strength < .05) v.speed *= Math.pow(.05, dt);
      if (input.strength > .05) {
        const targetAngle = Math.atan2(input.y, input.x);
        v.angle += angleDelta(v.angle, targetAngle) * Math.min(1, dt * (inTrailer ? 5 : 8));
      }
      const previous = { x: v.x, y: v.y };
      v.x += input.x * v.speed * dt;
      v.y += input.y * v.speed * dt;
      v.x = clamp(v.x, 35, this.world.w - 35);
      v.y = clamp(v.y, 35, this.world.h - 35);
      const hitObstacle = this.obstacles.some(rect => circleRect(v.x, v.y, v.radius, rect));
      const hitPallet = this.pallets.some(pallet => !pallet.carried && Math.hypot(v.x - pallet.x, v.y - pallet.y) < 43);
      if (hitObstacle || hitPallet) {
        v.x = previous.x;
        v.y = previous.y;
        if (v.speed > 70) this.damage("Зіткнення з перешкодою");
        v.speed = 0;
      }
      if (this.controls.lift) this.lift();
      if (this.controls.lower) this.lower();
    }

    forkPoint() {
      return {
        x: this.vehicle.x + Math.cos(this.vehicle.angle) * 43,
        y: this.vehicle.y + Math.sin(this.vehicle.angle) * 43
      };
    }

    lift() {
      if (this.vehicle.forksUp) return;
      const point = this.forkPoint();
      const nearest = this.pallets
        .filter(pallet => !pallet.carried)
        .map(pallet => ({ pallet, d: Math.hypot(point.x - pallet.x, point.y - pallet.y) }))
        .sort((a, b) => a.d - b.d)[0];
      if (!nearest || nearest.d > 48) return;
      nearest.pallet.carried = true;
      if (nearest.pallet.slotId != null) {
        const occupiedSlot = this.slots.find(slot => slot.id === nearest.pallet.slotId);
        if (occupiedSlot) {
          occupiedSlot.occupied = false;
          occupiedSlot.palletId = null;
        }
        nearest.pallet.slotId = null;
        nearest.pallet.delivered = false;
        this.delivered = Math.max(0, this.delivered - 1);
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
      const placementDistance = this.modeConfig.trailer ? 72 : 88;
      const exactSlot = slot && slot.d <= placementDistance ? slot.item : null;
      const freePoint = {
        x: clamp(point.x, 45, this.world.w - 45),
        y: clamp(point.y, 45, this.world.h - 45)
      };
      if (!exactSlot) {
        const blocked = this.obstacles.some(rect => circleRect(freePoint.x, freePoint.y, 35, rect));
        const overlapsPallet = this.pallets.some(item =>
          item !== pallet && !item.carried && Math.hypot(freePoint.x - item.x, freePoint.y - item.y) < 70
        );
        if (blocked || overlapsPallet) {
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
      this.vehicle.carrying = null;
      this.vehicle.forksUp = false;
      this.delivered += 1;
      this.score += Math.round(100 * this.integrity / 100);
      this.stats.total += 1;
      saveStats(this.stats);
      this.notice("Піддон точно встановлено", "good");
      this.tone(640, .16, "sine", .06);
      if (this.delivered >= this.target) this.complete();
      else if (this.pallets.filter(item => !item.delivered && !item.carried).length < 5) this.replenish();
    }

    replenish() {
      const index = this.pallets.length;
      const point = this.randomPalletPoint();
      this.pallets.push({
        id: `p${index}`, x: point.x, y: point.y,
        carried: false, delivered: false, slotId: null,
        color: index % 2 ? "#d39a55" : "#8bc5dc"
      });
    }

    updateWorkers(dt) {
      this.workers.forEach((worker, workerIndex) => {
        if (worker.injured) return;
        const toVehicle = Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y);
        if (toVehicle < 135) {
          let dx = worker.x - this.vehicle.x;
          let dy = worker.y - this.vehicle.y;
          const length = Math.hypot(dx, dy) || 1;
          worker.targetX = clamp(worker.x + dx / length * 190, 50, this.world.w - 50);
          worker.targetY = clamp(worker.y + dy / length * 190, 50, this.world.h - 50);
          worker.avoidUntil = this.elapsed + 1.4;
        } else if (distance(worker, { x: worker.targetX, y: worker.targetY }) < 15 || Math.random() < dt * .08) {
          const target = this.randomAislePoint(18);
          worker.targetX = target.x;
          worker.targetY = target.y;
        }
        let dx = worker.targetX - worker.x;
        let dy = worker.targetY - worker.y;
        const length = Math.hypot(dx, dy) || 1;
        const previous = { x: worker.x, y: worker.y };
        const speed = worker.avoidUntil > this.elapsed ? worker.speed * 2.4 : worker.speed;
        worker.x += dx / length * speed * dt;
        worker.y += dy / length * speed * dt;
        const hitsObstacle = this.obstacles.some(rect => circleRect(worker.x, worker.y, 14, rect));
        const hitsPallet = this.pallets.some(pallet => !pallet.carried && Math.hypot(worker.x - pallet.x, worker.y - pallet.y) < 33);
        const hitsBot = this.bot && Math.hypot(worker.x - this.bot.x, worker.y - this.bot.y) < 45;
        const hitsWorker = this.workers.some((other, otherIndex) =>
          otherIndex !== workerIndex && !other.injured && Math.hypot(worker.x - other.x, worker.y - other.y) < 27
        );
        if (hitsObstacle || hitsPallet || hitsBot || hitsWorker) {
          worker.x = previous.x;
          worker.y = previous.y;
          const target = this.randomAislePoint(18);
          worker.targetX = target.x;
          worker.targetY = target.y;
        }
        worker.phase += dt * speed * .12;
        const collision = Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y) < 35;
        if (collision) {
          worker.x = previous.x;
          worker.y = previous.y;
          worker.avoidUntil = 0;
          if (this.vehicle.speed > 118) {
            this.startIncident(worker);
          }
        }
      });
    }

    startIncident(worker) {
      if (this.incident || worker.injured) return;
      worker.injured = true;
      this.vehicle.speed = 0;
      if (!this.modeConfig.noPenalties) this.score = Math.max(0, this.score - 100);
      const side = worker.x > this.world.w / 2 ? -1 : 1;
      this.incident = {
        timer: 0,
        victim: worker,
        inspector: { x: worker.x + side * 260, y: worker.y - 130 },
        medics: [
          { x: worker.x + side * 300, y: worker.y + 100 },
          { x: worker.x + side * 340, y: worker.y + 145 }
        ],
        exit: { x: clamp(worker.x + side * 390, 55, this.world.w - 55), y: clamp(worker.y + 190, 55, this.world.h - 55) },
        gameOverAfter: this.modeConfig.strictSafety || (!this.modeConfig.noPenalties && this.score <= 0)
      };
      this.root.querySelector("[data-fg2='goal']").textContent = "ПОРУШЕННЯ · інспектор оформлює подію, медики забирають постраждалого";
      this.notice(this.modeConfig.noPenalties
        ? "Небезпечний контакт із працівником — тренування продовжиться"
        : "-100 балів: небезпечний контакт із працівником", "bad");
      this.tone(110, .28, "square", .065);
    }

    moveActor(actor, target, speed, dt) {
      const dx = target.x - actor.x;
      const dy = target.y - actor.y;
      const length = Math.hypot(dx, dy) || 1;
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
        this.root.querySelector("[data-fg2='goal']").textContent = this.modeConfig.trailer
          ? `ФУРА №${this.trailerRound} · ${this.modeConfig.goal}`
          : this.modeConfig.goal;
        if (gameOverAfter) this.gameOver(this.modeConfig.strictSafety
          ? "У безпечній зміні не можна допускати зіткнень."
          : undefined);
      }
    }

    updateBot(dt) {
      const bot = this.bot;
      if (!bot) return;
      if (Math.hypot(bot.x - bot.targetX, bot.y - bot.targetY) < 35) {
        const target = this.randomAislePoint(30);
        bot.targetX = target.x;
        bot.targetY = target.y;
      }
      const dx = bot.targetX - bot.x;
      const dy = bot.targetY - bot.y;
      const length = Math.hypot(dx, dy) || 1;
      const previous = { x: bot.x, y: bot.y };
      bot.angle = Math.atan2(dy, dx);
      bot.x += dx / length * bot.speed * dt;
      bot.y += dy / length * bot.speed * dt;
      const botHitObstacle = this.obstacles.some(rect => circleRect(bot.x, bot.y, 25, rect));
      const botHitPallet = this.pallets.some(pallet => !pallet.carried && Math.hypot(bot.x - pallet.x, bot.y - pallet.y) < 48);
      const botHitWorker = this.workers.some(worker => !worker.injured && Math.hypot(bot.x - worker.x, bot.y - worker.y) < 43);
      if (botHitObstacle || botHitPallet || botHitWorker) {
        bot.x = previous.x;
        bot.y = previous.y;
        const target = this.randomAislePoint(30);
        bot.targetX = target.x;
        bot.targetY = target.y;
      }
      if (Math.hypot(bot.x - this.vehicle.x, bot.y - this.vehicle.y) < 54) {
        bot.x = previous.x;
        bot.y = previous.y;
        const target = this.randomAislePoint(30);
        bot.targetX = target.x;
        bot.targetY = target.y;
        if (this.vehicle.speed > 65) this.damage("Зіткнення зі службовим транспортом");
      }
    }

    damage(reason) {
      if (this.elapsed - this.lastDamageAt < .8) return;
      this.lastDamageAt = this.elapsed;
      if (this.modeConfig.noPenalties) {
        this.notice(`${reason} — без штрафу у тренуванні`, "bad");
        this.tone(92, .2, "square", .05);
        return;
      }
      this.score = Math.max(0, this.score - 50);
      this.integrity = Math.max(0, this.integrity - 7);
      this.notice(`-50 балів: ${reason}`, "bad");
      this.tone(92, .2, "square", .08);
      if (this.modeConfig.strictSafety) this.gameOver("У безпечній зміні не можна допускати зіткнень.");
      else if (this.score <= 0) this.gameOver();
    }

    horn() {
      if (!this.running || this.paused || this.incident) return;
      this.playEffect("horn", 0, .95, .68);
      this.workers.forEach(worker => {
        if (worker.injured || Math.hypot(worker.x - this.vehicle.x, worker.y - this.vehicle.y) >= 270) return;
        const dx = worker.x - this.vehicle.x;
        const dy = worker.y - this.vehicle.y;
        const length = Math.hypot(dx, dy) || 1;
        worker.targetX = clamp(worker.x + dx / length * 240, 50, this.world.w - 50);
        worker.targetY = clamp(worker.y + dy / length * 240, 50, this.world.h - 50);
        worker.avoidUntil = this.elapsed + 2;
      });
      if (this.elapsed - this.lastHornNotice > 4) {
        this.lastHornNotice = this.elapsed;
        this.notice("Працівники звільняють проїзд", "good");
      }
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

    playEffect(name, startAt, duration, volume) {
      const source = this.effectSources[name];
      if (!source) return;
      try {
        const effect = new Audio(source);
        effect.preload = "auto";
        effect.volume = volume == null ? .6 : volume;
        effect.currentTime = startAt || 0;
        const playback = effect.play();
        playback?.catch?.(() => {});
        setTimeout(() => {
          effect.pause();
          effect.src = "";
        }, Math.max(120, (duration || .8) * 1000));
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
      this.drawRoute(ctx);
      this.drawZones(ctx);
      this.obstacles.forEach(rect => this.drawRack(ctx, rect));
      this.drawPallets(ctx);
      if (this.bot) this.drawVehicle(ctx, this.bot.x, this.bot.y, this.bot.angle, "#39829c", false, true);
      this.workers.filter(worker => !worker.injured).forEach(worker => this.drawWorker(ctx, worker));
      if (this.incident) this.drawIncident(ctx);
      this.drawVehicle(ctx, this.vehicle.x, this.vehicle.y, this.vehicle.angle, "#e4b637", true, false);
      ctx.restore();
      this.drawObjectiveIndicator(ctx);
    }

    drawFloor(ctx) {
      const gradient = ctx.createLinearGradient(0, 0, this.world.w, this.world.h);
      gradient.addColorStop(0, "#758187");
      gradient.addColorStop(1, "#58666c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.world.w, this.world.h);
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
    }

    drawRoute(ctx) {
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
      if (!this.vehicle.carrying) {
        const available = this.pallets.find(pallet => !pallet.carried && !pallet.delivered);
        return available || { x: this.source.x + this.source.w / 2, y: this.source.y + this.source.h / 2 };
      }
      return this.slots.find(slot => !slot.occupied)
        || (this.modeConfig.trailer
          ? { x: this.trailer.x + this.trailer.w / 2, y: this.trailer.y + this.trailer.h / 2 }
          : { x: this.destination.x + this.destination.w / 2, y: this.destination.y + this.destination.h / 2 });
    }

    drawObjectiveIndicator(ctx) {
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
      ctx.roundRect(x - 34, y + 25, 68, 23, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "900 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${meters} м`, x, y + 36);
      ctx.restore();
    }

    drawZones(ctx) {
      this.zone(ctx, this.source, "#e1b83d", "СКЛАД А · ПІДДОНИ РОЗМІЩЕНІ ПО ВСІЙ ЗОНІ");
      if (!this.modeConfig.trailer) {
        this.zone(ctx, this.destination, "#42ca79", "СКЛАД Б · ПОСТАВИТИ СЮДИ");
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
          ctx.fillText(String(slot.id), slot.x, slot.y);
        });
        this.drawTargetArrow(ctx, this.destination.x + this.destination.w / 2, this.destination.y - 35);
      } else {
        ctx.save();
        const rearX = this.trailer.x;
        const centerY = this.trailer.y + this.trailer.h / 2;
        const cabinX = this.trailer.x + this.trailer.w;
        const cabinW = 170;

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
        ctx.fillText(`ФУРА №${this.trailerRound} · 33 МІСЦЯ`, this.trailer.x + this.trailer.w / 2, this.trailer.y - 22);
        this.slots.forEach(slot => {
          ctx.fillStyle = slot.occupied ? "#2f9f61" : "rgba(89,221,133,.16)";
          ctx.strokeStyle = slot.occupied ? "#a7f4c1" : "#66df91";
          ctx.lineWidth = 2;
          ctx.fillRect(slot.x - 34, slot.y - 42, 68, 84);
          ctx.strokeRect(slot.x - 34, slot.y - 42, 68, 84);
          ctx.fillStyle = slot.occupied ? "#fff" : "#b8efca";
          ctx.font = "900 17px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(slot.id), slot.x, slot.y);
        });
        ctx.restore();
        this.drawTargetArrow(ctx, rearX - 65, centerY - 70);
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
      if (rect.type === "trailer-wall" || rect.type === "trailer-cab") return;
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
        ctx.save();
        ctx.translate(pallet.x, pallet.y);
        ctx.fillStyle = pallet.delivered ? "#2d9d5e" : "#8d5f31";
        ctx.fillRect(-34, -25, 68, 50);
        ctx.fillStyle = pallet.delivered ? "#8ee5ae" : pallet.color;
        ctx.fillRect(-29, -21, 58, 40);
        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.strokeRect(-29, -21, 58, 40);
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
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillRect(-28, -24, 57, 48);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#17252a";
      ctx.fillRect(-22, -18, 26, 36);
      ctx.fillStyle = "#e8b58c";
      ctx.beginPath(); ctx.arc(-8, 0, 8, 0, TAU); ctx.fill();
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
        ctx.fillStyle = "#fff";
        ctx.font = "900 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BOT", -9, 4);
      }
      ctx.restore();
    }

    updateHUD() {
      this.root.querySelector("[data-fg2='time']").textContent = this.modeConfig.timeLimit
        ? timeText(Math.max(0, this.modeConfig.timeLimit - this.elapsed))
        : timeText(this.elapsed);
      this.root.querySelector("[data-fg2='delivery']").textContent = `${this.delivered} / ${this.target}`;
      this.root.querySelector("[data-fg2='score']").textContent = String(Math.round(this.score));
      this.root.querySelector("[data-fg2='integrity']").textContent = `${Math.round(this.integrity)}%`;
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
      setTimeout(() => element.remove(), 2400);
    }

    helpScreen() {
      const screen = this.root.querySelector(".fg2-screen");
      const previousContent = screen.innerHTML;
      screen.innerHTML = `
        <div class="fg2-menu">
          <h1>Керування</h1>
          <p><strong>Телефон:</strong> джойстик задає напрям руху. Кнопки праворуч керують вилами та сигналом. Два пальці змінюють масштаб.</p>
          <p><strong>Комп’ютер:</strong> стрілки або W/A/S/D — рух, Q — підняти вила, E — опустити, H або F — сигнал.</p>
          <p>Піддон можна взяти з будь-якого місця й поставити назад, у фуру, у зону призначення або в інше вільне місце.</p>
          <div class="fg2-actions"><button class="fg2-btn primary" data-help="back">Зрозуміло</button></div>
        </div>`;
      screen.querySelector("[data-help='back']").addEventListener("click", () => {
        screen.innerHTML = previousContent;
        screen.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => this.start(button.dataset.mode)));
        screen.querySelector("[data-menu='exit']")?.addEventListener("click", () => this.destroy());
        screen.querySelector("[data-menu='help']")?.addEventListener("click", () => this.helpScreen());
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
      saveStats(this.stats);
      this.resultScreen(
        this.modeConfig.trailer ? `Фуру №${this.trailerRound} завантажено!` : `${this.modeConfig.name} завершено!`,
        `Час: ${timeText(this.elapsed)} · Бали: ${Math.round(this.score)}`,
        this.modeConfig.trailer
      );
    }

    gameOver(message) {
      if (this.over) return;
      this.over = true;
      this.paused = true;
      this.resultScreen("Game Over", message || "Бали закінчилися. Спробуй пройти зміну обережніше.");
    }

    resultScreen(title, message, nextTrailer) {
      const screen = this.root.querySelector(".fg2-screen");
      screen.innerHTML = `
        <div class="fg2-menu"><div class="fg2-kicker">Результат зміни</div><h1>${title}</h1><p>${message}</p>
        <div class="fg2-actions"><button class="fg2-btn primary" data-result="again">${nextTrailer ? "Наступна фура" : "Ще раз"}</button>${nextTrailer ? '<button class="fg2-btn" data-result="inspect">Перевірити вантаж</button>' : ""}<button class="fg2-btn" data-result="menu">Меню гри</button><button class="fg2-btn danger" data-result="exit">Вийти</button></div></div>`;
      screen.classList.remove("hidden");
      screen.querySelector("[data-result='again']").addEventListener("click", () => nextTrailer ? this.nextTrailer() : this.restartMode());
      screen.querySelector("[data-result='inspect']")?.addEventListener("click", () => {
        screen.classList.add("hidden");
        this.paused = false;
        this.lastFrame = performance.now();
        this.notice("Можна забрати будь-який піддон із фури та переставити", "good");
      });
      screen.querySelector("[data-result='menu']").addEventListener("click", () => this.returnToMenu());
      screen.querySelector("[data-result='exit']").addEventListener("click", () => this.destroy());
    }

    nextTrailer() {
      this.trailerRound += 1;
      this.elapsed = 0;
      this.score = 1000;
      this.integrity = 100;
      this.delivered = 0;
      this.over = false;
      this.incident = null;
      this.vehicle = { x: 590, y: 700, angle: 0, speed: 0, radius: 29, forksUp: false, carrying: null };
      this.buildWorld();
      this.root.querySelector(".fg2-screen").classList.add("hidden");
      this.root.querySelector("[data-fg2='goal']").textContent = `ФУРА №${this.trailerRound} · ${this.modeConfig.goal}`;
      this.paused = false;
      this.lastFrame = performance.now();
      this.notice(`Фура №${this.trailerRound} подана до рампи`, "good");
    }

    restartMode() {
      const mode = this.mode;
      const options = this.options;
      this.destroy(true);
      const next = global.ForkliftGame.launch(options);
      next.start(mode);
    }

    returnToMenu() {
      const options = this.options;
      this.destroy(true);
      global.ForkliftGame.launch(options);
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
