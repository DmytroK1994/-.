(function (global) {
  "use strict";

  const THREE = global.THREE;
  const STATS_KEY = "oblikForkliftGameStats";
  const STYLE_ID = "forkliftGameStyles";
  let activeGame = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .fg-root{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#071018;color:#f6fbff;font-family:Inter,system-ui,-apple-system,sans-serif;touch-action:none;user-select:none}
      .fg-root *{box-sizing:border-box}
      .fg-stage,.fg-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
      .fg-screen{position:absolute;inset:0;z-index:20;display:grid;padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));place-items:center;background:radial-gradient(circle at 50% 35%,rgba(44,126,151,.32),transparent 42%),linear-gradient(155deg,#101c26,#04080c 72%)}
      .fg-screen.hidden,.fg-hidden{display:none!important}
      .fg-menu{width:min(100%,560px);max-height:100%;overflow:auto;padding:24px;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:rgba(8,20,28,.9);box-shadow:0 30px 90px rgba(0,0,0,.55);backdrop-filter:blur(18px)}
      .fg-kicker{color:#6ed6e7;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .fg-menu h1{margin:7px 0 8px;font-size:clamp(27px,6vw,46px);line-height:1}
      .fg-menu p{margin:0 0 18px;color:#b9c9d3;line-height:1.48}
      .fg-mode-grid{display:grid;gap:9px}
      .fg-mode{display:grid;grid-template-columns:48px 1fr;align-items:center;gap:11px;width:100%;padding:13px;border:1px solid rgba(255,255,255,.15);border-radius:17px;background:#142731;color:#f7fdff;text-align:left;cursor:pointer}
      .fg-mode:hover,.fg-mode:focus-visible{border-color:#73d8e6;background:#19343f;outline:none}
      .fg-mode-icon{display:grid;width:48px;height:48px;place-items:center;border-radius:14px;background:#254856;font-size:25px}
      .fg-mode strong,.fg-mode span{display:block}.fg-mode span{margin-top:3px;color:#a9bcc6;font-size:12px}
      .fg-records{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}
      .fg-record{padding:9px;border-radius:13px;background:rgba(255,255,255,.07);text-align:center}.fg-record strong,.fg-record span{display:block}.fg-record strong{font-size:16px}.fg-record span{margin-top:2px;color:#a9bbc5;font-size:9px;font-weight:800}
      .fg-menu-actions{display:flex;gap:8px;margin-top:14px}.fg-btn{min-height:42px;padding:9px 14px;border:1px solid rgba(255,255,255,.18);border-radius:13px;background:#1b303a;color:#fff;font:800 13px inherit;cursor:pointer}.fg-btn.primary{background:#e9be50;color:#172029;border-color:#ffe08d}.fg-btn.danger{background:#4b2428}
      .fg-menu-actions .fg-btn{flex:1}
      .fg-hud{position:absolute;inset:max(10px,env(safe-area-inset-top)) 10px auto;z-index:10;display:grid;grid-template-columns:1fr auto;gap:8px;pointer-events:none}
      .fg-hud-bar{display:flex;flex-wrap:wrap;gap:6px}.fg-chip{min-width:86px;padding:7px 9px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(5,15,21,.78);box-shadow:0 8px 24px rgba(0,0,0,.25);backdrop-filter:blur(9px)}
      .fg-chip span,.fg-chip strong{display:block}.fg-chip span{color:#aabcc6;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.fg-chip strong{margin-top:2px;font-size:14px}
      .fg-integrity{width:116px;height:5px;margin-top:5px;overflow:hidden;border-radius:99px;background:#3e4a4e}.fg-integrity i{display:block;width:100%;height:100%;background:#60d394;transition:width .2s,background .2s}
      .fg-minimap{width:122px;height:82px;border:1px solid rgba(255,255,255,.18);border-radius:13px;background:rgba(4,12,17,.78);box-shadow:0 8px 24px rgba(0,0,0,.25)}
      .fg-goal{position:absolute;top:max(94px,calc(env(safe-area-inset-top) + 94px));left:50%;z-index:9;max-width:min(90%,430px);padding:7px 12px;border-radius:999px;background:rgba(5,15,21,.76);color:#f7fbfd;font-size:12px;font-weight:800;text-align:center;transform:translateX(-50%);pointer-events:none}
      .fg-prompt{position:absolute;left:50%;bottom:132px;z-index:11;max-width:80%;padding:8px 12px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(5,15,21,.86);font-size:12px;font-weight:800;text-align:center;transform:translateX(-50%);pointer-events:none}
      .fg-notices{position:absolute;top:145px;left:50%;z-index:30;display:grid;gap:7px;width:min(90%,440px);pointer-events:none;transform:translateX(-50%)}
      .fg-notice{padding:10px 14px;border-radius:13px;background:rgba(12,27,34,.92);box-shadow:0 12px 30px rgba(0,0,0,.35);font-size:13px;font-weight:900;text-align:center;animation:fgNotice 2.7s both}.fg-notice.bad{background:rgba(104,31,35,.94)}.fg-notice.good{background:rgba(21,88,62,.94)}
      @keyframes fgNotice{0%{opacity:0;transform:translateY(-12px)}12%,80%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-8px)}}
      .fg-exit{position:absolute;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:13;min-height:38px;padding:7px 11px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(7,18,24,.78);color:#fff;font-weight:900;cursor:pointer}
      .fg-controls{position:absolute;inset:auto 0 max(12px,env(safe-area-inset-bottom));z-index:12;display:none;align-items:end;justify-content:space-between;padding:10px 14px;pointer-events:none}
      .fg-steer{position:relative;width:116px;height:116px;border:3px solid rgba(230,244,248,.62);border-radius:50%;background:rgba(7,19,25,.56);box-shadow:inset 0 0 0 9px rgba(4,9,12,.42);pointer-events:auto}
      .fg-steer::before,.fg-steer::after{content:"";position:absolute;top:50%;left:50%;background:#d8e7eb;transform-origin:center}.fg-steer::before{width:72%;height:4px;transform:translate(-50%,-50%)}.fg-steer::after{width:4px;height:72%;transform:translate(-50%,-50%)}.fg-steer-hub{position:absolute;inset:39%;border-radius:50%;background:#f2c34f}
      .fg-pedals{display:grid;grid-template-columns:repeat(3,58px);gap:7px;pointer-events:auto}.fg-control{display:grid;height:54px;padding:4px;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:15px;background:rgba(12,31,39,.82);color:#fff;font-size:10px;font-weight:900;line-height:1.05;text-align:center}.fg-control:active,.fg-control.active{background:#f0c450;color:#172029}.fg-control.horn{grid-column:2/4;background:#325d6b}
      .fg-incident{position:absolute;inset:0;z-index:25;display:grid;padding:18px;place-items:center;background:rgba(84,5,9,.44);pointer-events:none}.fg-incident-box{max-width:440px;padding:20px;border:2px solid #ff9292;border-radius:20px;background:rgba(55,12,15,.94);box-shadow:0 20px 70px rgba(0,0,0,.6);text-align:center}.fg-incident-box strong{display:block;font-size:25px}.fg-incident-box span{display:block;margin-top:7px;color:#ffd2d2}
      .fg-loading{position:absolute;inset:0;z-index:50;display:grid;place-items:center;background:#030608}.fg-loading-box{text-align:center}.fg-loader{width:66px;height:66px;margin:0 auto 13px;border:4px solid #23363e;border-top-color:#f2c550;border-radius:50%;animation:fgSpin .75s linear infinite}@keyframes fgSpin{to{transform:rotate(360deg)}}
      .fg-glitch{animation:fgGlitch .48s both}@keyframes fgGlitch{15%{transform:translate(7px,-2px);filter:hue-rotate(40deg)}35%{transform:translate(-8px,3px)}58%{transform:translate(5px,5px);filter:contrast(1.7)}100%{transform:none;filter:none}}
      @media(pointer:coarse),(max-width:900px){.fg-controls{display:flex}.fg-exit{bottom:auto;top:calc(env(safe-area-inset-top) + 100px)}.fg-prompt{bottom:148px}.fg-hud{grid-template-columns:1fr auto}.fg-chip{min-width:70px;padding:6px}.fg-minimap{width:102px;height:72px}}
      @media(max-width:560px){.fg-hud-bar{max-width:245px}.fg-chip{min-width:70px}.fg-chip strong{font-size:12px}.fg-records{grid-template-columns:1fr}.fg-steer{width:102px;height:102px}.fg-pedals{grid-template-columns:repeat(3,52px)}.fg-control{height:49px}.fg-goal{top:118px}}
    `;
    document.head.appendChild(style);
  }

  function loadStats() {
    try {
      const value = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
      return {
        bestTrailerTime: Number(value.bestTrailerTime) || 0,
        totalCargo: Number(value.totalCargo) || 0,
        bestScore: Number(value.bestScore) || 0
      };
    } catch (error) {
      return { bestTrailerTime: 0, totalCargo: 0, bestScore: 0 };
    }
  }

  function saveStats(stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (error) {}
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  class ForkliftGame {
    constructor(options) {
      this.options = options || {};
      this.stats = loadStats();
      this.root = null;
      this.stage = null;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.clock = null;
      this.raf = 0;
      this.mode = "";
      this.started = false;
      this.paused = false;
      this.destroyed = false;
      this.elapsed = 0;
      this.score = 1000;
      this.integrity = 100;
      this.delivered = 0;
      this.targetCount = 8;
      this.totalCarried = 0;
      this.speed = 0;
      this.steer = 0;
      this.forkHeight = 0.08;
      this.carrying = null;
      this.incidentLock = 0;
      this.damageCooldown = 0;
      this.lastLateralForce = 0;
      this.keys = new Set();
      this.controls = { forward: false, reverse: false, lift: false, lower: false, steer: 0 };
      this.pallets = [];
      this.npcs = [];
      this.obstacles = [];
      this.bots = [];
      this.audio = null;
      this.engineOscillator = null;
      this.engineGain = null;
      this.resizeHandler = () => this.resize();
      this.keyDownHandler = event => this.onKey(event, true);
      this.keyUpHandler = event => this.onKey(event, false);
    }

    mount() {
      injectStyles();
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.root = document.createElement("div");
      this.root.className = "fg-root";
      this.root.setAttribute("role", "application");
      this.root.setAttribute("aria-label", "Симулятор транспортувальника");
      this.root.innerHTML = `
        <div class="fg-stage"></div>
        <div class="fg-hud fg-hidden">
          <div class="fg-hud-bar">
            <div class="fg-chip"><span>Час зміни</span><strong data-fg="time">00:00</strong></div>
            <div class="fg-chip"><span>Завдання</span><strong data-fg="delivery">0 / 8</strong></div>
            <div class="fg-chip"><span>Бали</span><strong data-fg="score">1000</strong></div>
            <div class="fg-chip"><span>Цілісність вантажу</span><strong data-fg="integrity">100%</strong><div class="fg-integrity"><i data-fg="integrity-bar"></i></div></div>
          </div>
          <canvas class="fg-minimap" width="244" height="164"></canvas>
        </div>
        <div class="fg-goal fg-hidden" data-fg="goal"></div>
        <div class="fg-prompt fg-hidden" data-fg="prompt"></div>
        <div class="fg-notices"></div>
        <div class="fg-controls fg-hidden">
          <div class="fg-steer" aria-label="Кермо"><span class="fg-steer-hub"></span></div>
          <div class="fg-pedals">
            <button class="fg-control" data-control="lift">Підняти<br>вила</button>
            <button class="fg-control" data-control="forward">Вперед</button>
            <button class="fg-control" data-control="lower">Опустити<br>вила</button>
            <button class="fg-control" data-control="reverse">Реверс</button>
            <button class="fg-control horn" data-control="horn">📣 Сигнал</button>
          </div>
        </div>
        <button class="fg-exit fg-hidden" type="button">Вийти в склад</button>
        <div class="fg-incident fg-hidden"><div class="fg-incident-box"><strong>Штраф за порушення ТБ!</strong><span>Рух заблоковано. Інспектор і медики вже прямують до місця інциденту.</span></div></div>
        <div class="fg-screen">
          <div class="fg-menu">
            <div class="fg-kicker">Секретний режим</div>
            <h1>Симулятор транспортувальника</h1>
            <p>Керуй електричною роклою, подавай сигнал працівникам, бережи вантаж і виконуй завдання без порушень техніки безпеки.</p>
            <div class="fg-mode-grid">
              <button class="fg-mode" data-mode="transport"><span class="fg-mode-icon">🏭</span><span><strong>Між складами</strong><span>Перевези 8 піддонів зі Складу А до Складу Б.</span></span></button>
              <button class="fg-mode" data-mode="trailer"><span class="fg-mode-icon">🚛</span><span><strong>Завантаження фури</strong><span>Завантаж 33 європіддони та встанови найкращий час.</span></span></button>
            </div>
            <div class="fg-records">
              <div class="fg-record"><strong>${this.stats.bestTrailerTime ? formatTime(this.stats.bestTrailerTime) : "—"}</strong><span>найкраща фура</span></div>
              <div class="fg-record"><strong>${this.stats.totalCargo}</strong><span>усього піддонів</span></div>
              <div class="fg-record"><strong>${this.stats.bestScore}</strong><span>найкращі бали</span></div>
            </div>
            <div class="fg-menu-actions"><button class="fg-btn" data-menu-action="help">Керування</button><button class="fg-btn danger" data-menu-action="exit">Повернутися до роботи</button></div>
          </div>
        </div>
      `;
      document.body.appendChild(this.root);
      this.stage = this.root.querySelector(".fg-stage");
      this.bindMenu();
      return this;
    }

    bindMenu() {
      this.root.querySelectorAll("[data-mode]").forEach(button => {
        button.addEventListener("click", () => this.start(button.dataset.mode));
      });
      this.root.querySelector("[data-menu-action='exit']").addEventListener("click", () => this.destroy());
      this.root.querySelector("[data-menu-action='help']").addEventListener("click", () => {
        this.notice("ПК: WASD/стрілки — рух, Q/E — вила, H/F — сигнал, Пробіл — гальмо. На телефоні використовуй кермо та кнопки.", "good");
      });
      this.root.querySelector(".fg-exit").addEventListener("click", () => this.showPauseMenu());
    }

    async start(mode) {
      if (this.started) return;
      this.mode = mode === "trailer" ? "trailer" : "transport";
      this.targetCount = this.mode === "trailer" ? 33 : 8;
      this.root.classList.add("fg-glitch");
      const loading = document.createElement("div");
      loading.className = "fg-loading";
      loading.innerHTML = `<div class="fg-loading-box"><div class="fg-loader"></div><strong>Запускаю електродвигун…</strong></div>`;
      this.root.appendChild(loading);
      await new Promise(resolve => setTimeout(resolve, 520));
      this.root.classList.remove("fg-glitch");
      this.root.querySelector(".fg-screen").classList.add("hidden");
      try {
        this.initThree();
      } catch (error) {
        loading.innerHTML = `<div class="fg-menu"><h1>Не вдалося запустити 3D</h1><p>Цей пристрій або браузер не надав доступу до WebGL.</p><button class="fg-btn" data-failed-exit>Повернутися до роботи</button></div>`;
        loading.querySelector("[data-failed-exit]").addEventListener("click", () => this.destroy());
        return;
      }
      loading.remove();
      this.started = true;
      this.root.querySelectorAll(".fg-hud,.fg-controls,.fg-exit,.fg-goal").forEach(element => element.classList.remove("fg-hidden"));
      this.root.querySelector("[data-fg='delivery']").textContent = `0 / ${this.targetCount}`;
      this.root.querySelector("[data-fg='goal']").textContent = this.mode === "trailer"
        ? "Забирай піддони зі Складу А та опускай їх у зоні фури."
        : "Перевези піддони зі Складу А до зеленої зони Складу Б.";
      this.bindControls();
      this.initAudio();
      this.clock = new THREE.Clock();
      this.animate();
    }

    initThree() {
      if (!THREE) throw new Error("Three.js is unavailable");
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0d161b);
      this.scene.fog = new THREE.Fog(0x0d161b, 35, 105);
      this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 180);
      this.renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio <= 1.7, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      this.renderer.setSize(innerWidth, innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.stage.appendChild(this.renderer.domElement);
      this.scene.add(new THREE.HemisphereLight(0xb8d9e7, 0x283029, 1.55));
      const sun = new THREE.DirectionalLight(0xffffff, 2.1);
      sun.position.set(-18, 30, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(devicePixelRatio > 1.5 ? 1024 : 1536, devicePixelRatio > 1.5 ? 1024 : 1536);
      sun.shadow.camera.left = -34;
      sun.shadow.camera.right = 34;
      sun.shadow.camera.top = 52;
      sun.shadow.camera.bottom = -52;
      this.scene.add(sun);
      this.buildFactory();
      this.buildVehicle();
      this.spawnPallets(10);
      this.spawnWorkers(10);
      this.spawnTraffic();
      addEventListener("resize", this.resizeHandler, { passive: true });
    }

    material(color, roughness, metalness) {
      return new THREE.MeshStandardMaterial({ color, roughness: roughness == null ? .72 : roughness, metalness: metalness || 0 });
    }

    mesh(geometry, material, x, y, z, cast) {
      const object = new THREE.Mesh(geometry, material);
      object.position.set(x || 0, y || 0, z || 0);
      object.castShadow = cast !== false;
      object.receiveShadow = true;
      return object;
    }

    buildFactory() {
      const floor = this.mesh(new THREE.PlaneGeometry(44, 92), this.material(0x687277, .42, .08), 0, 0, 0, false);
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
      const grid = new THREE.GridHelper(92, 46, 0x8d989c, 0x798286);
      grid.rotation.y = Math.PI / 2;
      grid.position.y = .012;
      this.scene.add(grid);
      const wallMaterial = this.material(0x35444b, .78);
      [
        { x: -22, z: 0, w: .6, d: 92 },
        { x: 22, z: 0, w: .6, d: 92 },
        { x: 0, z: -46, w: 44, d: .6 },
        { x: 0, z: 46, w: 44, d: .6 }
      ].forEach(item => {
        const wall = this.mesh(new THREE.BoxGeometry(item.w, 5.5, item.d), wallMaterial, item.x, 2.75, item.z);
        this.scene.add(wall);
      });
      const zone = (x, z, width, depth, color) => {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .32, side: THREE.DoubleSide });
        const plane = this.mesh(new THREE.PlaneGeometry(width, depth), mat, x, .025, z, false);
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
      };
      zone(0, 36, 14, 12, 0xd7a928);
      zone(this.mode === "trailer" ? 15 : 0, this.mode === "trailer" ? -13 : -36, this.mode === "trailer" ? 10 : 14, this.mode === "trailer" ? 31 : 12, 0x42bc78);
      this.addSign("СКЛАД А", -16, 4.4, 40);
      this.addSign("СКЛАД Б", -16, 4.4, -40);
      this.buildRacks();
      this.buildTrailer();
      for (const x of [-10, 10]) {
        for (const z of [-20, 0, 20]) {
          const column = this.mesh(new THREE.CylinderGeometry(.55, .55, 6, 12), this.material(0x8b969b, .55, .18), x, 3, z);
          this.scene.add(column);
          this.obstacles.push({ x, z, radius: 1 });
        }
      }
    }

    addSign(text, x, y, z) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      context.fillStyle = "#f1c44f";
      context.fillRect(0, 0, 512, 128);
      context.fillStyle = "#172029";
      context.font = "900 62px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, 256, 68);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
      sprite.position.set(x, y, z);
      sprite.scale.set(6, 1.5, 1);
      this.scene.add(sprite);
    }

    buildRacks() {
      const metal = this.material(0x315c75, .43, .55);
      const boxMaterial = this.material(0xb67a3f, .88);
      [-16, 16].forEach(x => {
        [-27, -9, 9, 27].forEach(z => {
          const rack = new THREE.Group();
          for (const px of [-1.1, 1.1]) {
            for (const pz of [-2.6, 2.6]) {
              rack.add(this.mesh(new THREE.BoxGeometry(.16, 5.2, .16), metal, px, 2.6, pz, false));
            }
          }
          [1.1, 2.7, 4.3].forEach(y => {
            rack.add(this.mesh(new THREE.BoxGeometry(2.5, .14, .18), metal, 0, y, -2.6, false));
            rack.add(this.mesh(new THREE.BoxGeometry(2.5, .14, .18), metal, 0, y, 2.6, false));
            for (const dz of [-1.55, 0, 1.55]) rack.add(this.mesh(new THREE.BoxGeometry(2, .82, 1.16), boxMaterial, 0, y + .5, dz, false));
          });
          rack.position.set(x, 0, z);
          this.scene.add(rack);
          this.obstacles.push({ x, z, radius: 3.25 });
        });
      });
    }

    buildTrailer() {
      const trailer = new THREE.Group();
      const white = this.material(0xd9e0e2, .52, .14);
      trailer.add(this.mesh(new THREE.BoxGeometry(9.5, .28, 31), this.material(0x59656a, .65, .2), 0, .22, 0));
      trailer.add(this.mesh(new THREE.BoxGeometry(.2, 3.3, 31), white, -4.75, 1.8, 0));
      trailer.add(this.mesh(new THREE.BoxGeometry(.2, 3.3, 31), white, 4.75, 1.8, 0));
      trailer.add(this.mesh(new THREE.BoxGeometry(9.5, 3.3, .2), white, 0, 1.8, -15.5));
      trailer.position.set(15, 0, -13);
      this.scene.add(trailer);
      if (this.mode !== "trailer") trailer.visible = false;
    }

    buildVehicle() {
      const vehicle = new THREE.Group();
      const yellow = this.material(0xe3b531, .4, .22);
      const dark = this.material(0x172328, .34, .42);
      vehicle.add(this.mesh(new THREE.BoxGeometry(1.45, .62, 1.75), yellow, 0, .52, .22));
      vehicle.add(this.mesh(new THREE.BoxGeometry(1.3, .16, .85), dark, 0, .2, 1.25));
      for (const x of [-.48, .48]) {
        const wheel = this.mesh(new THREE.CylinderGeometry(.28, .28, .18, 14), dark, x, .3, .42);
        wheel.rotation.z = Math.PI / 2;
        vehicle.add(wheel);
      }
      this.forkCarrier = new THREE.Group();
      this.forkCarrier.position.set(0, this.forkHeight, -.75);
      for (const x of [-.43, .43]) this.forkCarrier.add(this.mesh(new THREE.BoxGeometry(.16, .12, 2.35), dark, x, .12, -1.05));
      vehicle.add(this.forkCarrier);
      this.steeringHandle = new THREE.Group();
      this.steeringHandle.add(this.mesh(new THREE.CylinderGeometry(.07, .07, 1.6, 10), dark, 0, 1.2, .82));
      const grip = this.mesh(new THREE.TorusGeometry(.42, .07, 8, 18, Math.PI), dark, 0, 2.0, .82);
      grip.rotation.z = Math.PI / 2;
      this.steeringHandle.add(grip);
      vehicle.add(this.steeringHandle);
      const operator = this.createPerson(0x2a6c9b, 0xf0bf93);
      operator.scale.set(.86, .86, .86);
      operator.position.set(0, .35, 1.48);
      operator.rotation.y = Math.PI;
      vehicle.add(operator);
      vehicle.position.set(0, 0, 30);
      vehicle.rotation.y = Math.PI;
      this.vehicle = vehicle;
      this.scene.add(vehicle);
    }

    createPerson(clothes, skin) {
      const person = new THREE.Group();
      const uniform = this.material(clothes, .78);
      const skinMat = this.material(skin, .82);
      const dark = this.material(0x1a2328, .8);
      const torso = this.mesh(new THREE.CapsuleGeometry(.34, .72, 5, 10), uniform, 0, 1.42, 0);
      const head = this.mesh(new THREE.SphereGeometry(.25, 14, 10), skinMat, 0, 2.18, 0);
      person.add(torso, head);
      for (const x of [-.16, .16]) {
        const leg = this.mesh(new THREE.CapsuleGeometry(.1, .62, 4, 8), dark, x, .52, 0);
        person.add(leg);
      }
      for (const x of [-.43, .43]) {
        const arm = this.mesh(new THREE.CapsuleGeometry(.08, .58, 4, 8), uniform, x, 1.45, 0);
        arm.rotation.z = x > 0 ? -.18 : .18;
        person.add(arm);
      }
      person.userData.limbs = person.children.slice(-4);
      return person;
    }

    createPallet(index) {
      const pallet = new THREE.Group();
      const wood = this.material(0x9b6a38, .9);
      const wrap = this.material(index % 3 === 0 ? 0xb7d8e8 : 0xc99a61, .65, .02);
      for (const z of [-.55, 0, .55]) pallet.add(this.mesh(new THREE.BoxGeometry(1.6, .12, .24), wood, 0, .08, z));
      pallet.add(this.mesh(new THREE.BoxGeometry(1.48, 1.0, 1.1), wrap, 0, .64, 0));
      pallet.userData = { loose: true, index };
      return pallet;
    }

    spawnPallets(count) {
      for (let index = 0; index < count; index++) {
        const pallet = this.createPallet(index);
        pallet.position.set(-5.5 + (index % 5) * 2.7, 0, 33 + Math.floor(index / 5) * 2.2);
        this.scene.add(pallet);
        this.pallets.push(pallet);
      }
    }

    replenishPallet() {
      const index = this.totalCarried + this.pallets.length;
      const pallet = this.createPallet(index);
      pallet.position.set(-5.5 + (index % 5) * 2.7, 0, 34.5 + Math.floor((index % 10) / 5) * 2.2);
      this.scene.add(pallet);
      this.pallets.push(pallet);
    }

    spawnWorkers(count) {
      for (let index = 0; index < count; index++) {
        const person = this.createPerson(index % 2 ? 0x315b82 : 0x548454, 0xe0ad83);
        person.position.set(index % 2 ? -5.5 : 5.5, 0, -34 + index * 7);
        const limbs = person.userData.limbs;
        person.userData = {
          direction: index % 2 ? 1 : -1,
          baseX: person.position.x,
          speed: .85 + (index % 3) * .13,
          phase: Math.random() * Math.PI * 2,
          yieldUntil: 0,
          downUntil: 0,
          limbs
        };
        this.scene.add(person);
        this.npcs.push(person);
      }
      this.inspector = this.createPerson(0xf1c339, 0xdca67c);
      this.inspector.visible = false;
      this.scene.add(this.inspector);
      this.medics = new THREE.Group();
      const medicA = this.createPerson(0xe9f2f4, 0xe2b18b);
      const medicB = this.createPerson(0xe9f2f4, 0xc98c67);
      medicA.position.x = -.6;
      medicB.position.x = .6;
      const stretcher = this.mesh(new THREE.BoxGeometry(1.1, .08, 2.0), this.material(0xef7b45, .75), 0, .82, 0);
      this.medics.add(medicA, medicB, stretcher);
      this.medics.visible = false;
      this.scene.add(this.medics);
    }

    spawnTraffic() {
      const bot = new THREE.Group();
      bot.add(this.mesh(new THREE.BoxGeometry(1.35, .55, 1.7), this.material(0x3c7892, .45, .18), 0, .5, 0));
      for (const x of [-.42, .42]) bot.add(this.mesh(new THREE.BoxGeometry(.14, .1, 1.8), this.material(0x182226, .5, .4), x, .16, -1.4));
      bot.position.set(-8, 0, -38);
      this.scene.add(bot);
      this.bots.push({ object: bot, direction: 1, speed: 2.3 });
    }

    bindControls() {
      addEventListener("keydown", this.keyDownHandler);
      addEventListener("keyup", this.keyUpHandler);
      const wheel = this.root.querySelector(".fg-steer");
      const steerFromPointer = event => {
        const box = wheel.getBoundingClientRect();
        const value = ((event.clientX - box.left) / box.width - .5) * 2;
        this.controls.steer = Math.max(-1, Math.min(1, value));
        wheel.style.transform = `rotate(${this.controls.steer * 105}deg)`;
      };
      wheel.addEventListener("pointerdown", event => {
        wheel.setPointerCapture(event.pointerId);
        steerFromPointer(event);
      });
      wheel.addEventListener("pointermove", event => {
        if (wheel.hasPointerCapture(event.pointerId)) steerFromPointer(event);
      });
      const releaseWheel = () => {
        this.controls.steer = 0;
        wheel.style.transform = "";
      };
      wheel.addEventListener("pointerup", releaseWheel);
      wheel.addEventListener("pointercancel", releaseWheel);
      this.root.querySelectorAll("[data-control]").forEach(button => {
        const action = button.dataset.control;
        const press = event => {
          event.preventDefault();
          if (action === "horn") {
            this.horn();
            return;
          }
          this.controls[action] = true;
          button.classList.add("active");
          button.setPointerCapture?.(event.pointerId);
        };
        const release = event => {
          if (action !== "horn") this.controls[action] = false;
          button.classList.remove("active");
          if (event?.pointerId != null && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
        };
        button.addEventListener("pointerdown", press);
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
      });
    }

    onKey(event, down) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (down) this.keys.add(event.code);
      else this.keys.delete(event.code);
      if (down && !event.repeat && ["KeyH", "KeyF"].includes(event.code)) this.horn();
      if (down && !event.repeat && event.code === "Escape") this.showPauseMenu();
    }

    initAudio() {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) return;
      try {
        this.audio = new AudioContext();
        this.engineOscillator = this.audio.createOscillator();
        this.engineGain = this.audio.createGain();
        this.engineOscillator.type = "sawtooth";
        this.engineOscillator.frequency.value = 52;
        this.engineGain.gain.value = .012;
        this.engineOscillator.connect(this.engineGain).connect(this.audio.destination);
        this.engineOscillator.start();
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
        oscillator.frequency.setValueAtTime(frequency, this.audio.currentTime);
        gain.gain.setValueAtTime(volume || .08, this.audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, this.audio.currentTime + duration);
        oscillator.connect(gain).connect(this.audio.destination);
        oscillator.start();
        oscillator.stop(this.audio.currentTime + duration);
      } catch (error) {}
    }

    horn() {
      if (!this.started || this.paused) return;
      this.tone(320, .22, "square", .09);
      setTimeout(() => this.tone(265, .18, "square", .07), 90);
      this.npcs.forEach(npc => {
        if (npc.position.distanceTo(this.vehicle.position) < 10) npc.userData.yieldUntil = this.elapsed + 3.2;
      });
      this.notice("Сигнал подано — працівники звільняють прохід", "good");
    }

    getInput() {
      const forward = this.controls.forward || this.keys.has("KeyW") || this.keys.has("ArrowUp");
      const reverse = this.controls.reverse || this.keys.has("KeyS") || this.keys.has("ArrowDown");
      const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft");
      const right = this.keys.has("KeyD") || this.keys.has("ArrowRight");
      const brake = this.keys.has("Space");
      const keyboardSteer = (left ? -1 : 0) + (right ? 1 : 0);
      return {
        throttle: (forward ? 1 : 0) + (reverse ? -1 : 0),
        steer: keyboardSteer || this.controls.steer,
        brake,
        lift: this.controls.lift || this.keys.has("KeyQ"),
        lower: this.controls.lower || this.keys.has("KeyE")
      };
    }

    updateVehicle(dt) {
      const input = this.getInput();
      if (this.incidentLock > 0 || this.paused) {
        this.speed *= Math.pow(.05, dt);
        return;
      }
      const acceleration = input.throttle * (input.throttle > 0 ? 5.2 : 4.1);
      this.speed += acceleration * dt;
      this.speed *= Math.pow(input.brake ? .025 : .72, dt);
      this.speed = Math.max(-3.8, Math.min(this.carrying ? 5.2 : 6.6, this.speed));
      if (Math.abs(input.throttle) < .01 && Math.abs(this.speed) < .025) this.speed = 0;
      this.steer += (input.steer - this.steer) * Math.min(1, dt * 7);
      const steeringForce = this.steer * Math.min(1, Math.abs(this.speed) / 1.6);
      this.vehicle.rotation.y += steeringForce * this.speed * dt * .17;
      this.steeringHandle.rotation.y = -this.steer * .62;
      const direction = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, -Math.cos(this.vehicle.rotation.y));
      const previous = this.vehicle.position.clone();
      this.vehicle.position.addScaledVector(direction, this.speed * dt);
      const hitWall = Math.abs(this.vehicle.position.x) > 20.2 || Math.abs(this.vehicle.position.z) > 44.2;
      const hitObstacle = this.obstacles.some(item => Math.hypot(this.vehicle.position.x - item.x, this.vehicle.position.z - item.z) < item.radius + .8);
      if (hitWall || hitObstacle) {
        this.vehicle.position.copy(previous);
        if (Math.abs(this.speed) > 1.2) this.damage(Math.min(12, Math.abs(this.speed) * 1.6), "Зіткнення з конструкцією");
        this.speed *= -.18;
      }
      const lateralForce = Math.abs(this.speed * this.speed * steeringForce);
      if (this.carrying && lateralForce > 10 && this.damageCooldown <= 0) {
        this.damage(Math.min(7, (lateralForce - 9) * .5), "Вантаж змістився на різкому повороті");
      }
      this.lastLateralForce = lateralForce;
      this.forkHeight += ((input.lift ? 1 : 0) - (input.lower ? 1 : 0)) * dt * .72;
      this.forkHeight = Math.max(.05, Math.min(1.45, this.forkHeight));
      this.forkCarrier.position.y = this.forkHeight;
      if (this.carrying) this.carrying.position.y = .18;
      if (input.lift) this.tryPickup();
      if (input.lower && this.forkHeight <= .09) this.tryDrop();
      if (this.engineOscillator && this.audio) {
        this.engineOscillator.frequency.setTargetAtTime(48 + Math.abs(this.speed) * 12, this.audio.currentTime, .05);
        this.engineGain.gain.setTargetAtTime(.009 + Math.abs(this.speed) * .004, this.audio.currentTime, .08);
      }
    }

    forkWorldPosition() {
      return this.vehicle.localToWorld(new THREE.Vector3(0, this.forkHeight, -2.15));
    }

    tryPickup() {
      if (this.carrying || this.forkHeight > .34) return;
      const fork = this.forkWorldPosition();
      const nearest = this.pallets
        .filter(pallet => pallet.userData.loose)
        .map(pallet => ({ pallet, distance: Math.hypot(pallet.position.x - fork.x, pallet.position.z - fork.z) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (!nearest || nearest.distance > 1.25) return;
      this.carrying = nearest.pallet;
      this.carrying.userData.loose = false;
      this.scene.remove(this.carrying);
      this.forkCarrier.add(this.carrying);
      this.carrying.position.set(0, .18, -1.05);
      this.carrying.rotation.y = 0;
      this.pallets = this.pallets.filter(item => item !== this.carrying);
      this.totalCarried += 1;
      this.tone(180, .16, "sine", .06);
      this.notice("Піддон піднято", "good");
      if (this.pallets.length < 5 && this.delivered + this.pallets.length < this.targetCount + 4) this.replenishPallet();
    }

    inDestination(position) {
      if (this.mode === "trailer") return position.x > 10 && position.x < 20 && position.z > -29 && position.z < 3;
      return Math.abs(position.x) < 7 && position.z < -30;
    }

    tryDrop() {
      if (!this.carrying) return;
      const world = this.forkWorldPosition();
      const pallet = this.carrying;
      this.forkCarrier.remove(pallet);
      if (this.inDestination(world)) {
        this.scene.remove(pallet);
        this.carrying = null;
        this.delivered += 1;
        const reward = Math.round(100 * (this.integrity / 100));
        this.score += reward;
        this.stats.totalCargo += 1;
        saveStats(this.stats);
        this.notice(`Піддон прийнято · +${reward} балів`, "good");
        this.tone(620, .18, "sine", .07);
        this.tone(820, .24, "sine", .05);
        if (this.delivered >= this.targetCount) this.completeShift();
      } else {
        pallet.position.copy(world);
        pallet.position.y = 0;
        pallet.rotation.y = this.vehicle.rotation.y;
        pallet.userData.loose = true;
        this.scene.add(pallet);
        this.pallets.push(pallet);
        this.carrying = null;
        this.notice("Піддон залишено поза зоною приймання");
      }
    }

    updateWorkers(dt) {
      this.npcs.forEach((npc, index) => {
        const data = npc.userData;
        if (data.downUntil > this.elapsed) return;
        const yielding = data.yieldUntil > this.elapsed;
        const targetX = yielding ? (data.baseX < 0 ? -18.5 : 18.5) : data.baseX;
        npc.position.x += (targetX - npc.position.x) * Math.min(1, dt * (yielding ? 2.4 : .7));
        if (!yielding) {
          npc.position.z += data.direction * data.speed * dt;
          if (npc.position.z > 41 || npc.position.z < -41) {
            data.direction *= -1;
            npc.rotation.y += Math.PI;
          }
        }
        data.phase += dt * data.speed * 5;
        const limbs = data.limbs || [];
        limbs.forEach((limb, limbIndex) => {
          limb.rotation.x = Math.sin(data.phase + limbIndex * Math.PI) * .35;
        });
        const distance = Math.hypot(npc.position.x - this.vehicle.position.x, npc.position.z - this.vehicle.position.z);
        if (distance < 1.05 && this.incidentLock <= 0) this.triggerIncident(npc);
        if (distance < 4.8 && !yielding && Math.abs(this.speed) > 2.4 && index % 2 === 0) {
          this.root.querySelector("[data-fg='prompt']").textContent = "Попереду працівник — подай сигнал!";
          this.root.querySelector("[data-fg='prompt']").classList.remove("fg-hidden");
        }
      });
    }

    updateTraffic(dt) {
      this.bots.forEach(bot => {
        bot.object.position.z += bot.direction * bot.speed * dt;
        if (bot.object.position.z > 39 || bot.object.position.z < -39) {
          bot.direction *= -1;
          bot.object.rotation.y += Math.PI;
        }
        const distance = Math.hypot(bot.object.position.x - this.vehicle.position.x, bot.object.position.z - this.vehicle.position.z);
        if (distance < 1.6 && this.damageCooldown <= 0) {
          this.damage(10, "Зіткнення з іншою електророклою");
          this.speed *= -.2;
        }
      });
    }

    triggerIncident(npc) {
      this.incidentLock = 6.2;
      this.score = Math.max(0, this.score - 1000);
      this.speed = 0;
      npc.userData.downUntil = this.elapsed + 6;
      npc.rotation.z = Math.PI / 2;
      this.root.querySelector(".fg-incident").classList.remove("fg-hidden");
      this.notice("-1000 балів: порушення техніки безпеки!", "bad");
      this.tone(145, .55, "sawtooth", .12);
      this.inspector.visible = true;
      this.inspector.position.set(this.vehicle.position.x + 8, 0, this.vehicle.position.z + 5);
      this.medics.visible = false;
      setTimeout(() => {
        if (!this.destroyed) {
          this.medics.visible = true;
          this.medics.position.set(this.vehicle.position.x - 9, 0, this.vehicle.position.z - 5);
          this.tone(760, .2, "square", .05);
          setTimeout(() => this.tone(520, .2, "square", .05), 230);
        }
      }, 1900);
      setTimeout(() => {
        if (this.destroyed) return;
        npc.rotation.z = 0;
        npc.position.set(npc.userData.baseX, 0, 38);
        this.inspector.visible = false;
        this.medics.visible = false;
        this.root.querySelector(".fg-incident").classList.add("fg-hidden");
      }, 6100);
    }

    updateIncidentActors(dt) {
      if (this.incidentLock <= 0) return;
      this.incidentLock = Math.max(0, this.incidentLock - dt);
      const moveToward = (object, target, speed) => {
        const direction = target.clone().sub(object.position);
        direction.y = 0;
        const distance = direction.length();
        if (distance > 1.8) object.position.addScaledVector(direction.normalize(), Math.min(distance, speed * dt));
      };
      if (this.inspector.visible) moveToward(this.inspector, this.vehicle.position, 2.5);
      if (this.medics.visible) moveToward(this.medics, this.vehicle.position, 3.2);
    }

    damage(amount, reason) {
      if (this.damageCooldown > 0) return;
      this.damageCooldown = .8;
      this.integrity = Math.max(0, this.integrity - amount);
      const penalty = Math.round(amount * 12);
      this.score = Math.max(0, this.score - penalty);
      this.notice(`-${penalty} балів: ${reason}`, "bad");
      this.tone(92, .22, "square", .11);
    }

    updateCamera(dt) {
      const direction = new THREE.Vector3(Math.sin(this.vehicle.rotation.y), 0, -Math.cos(this.vehicle.rotation.y));
      const targetPosition = this.vehicle.position.clone().addScaledVector(direction, -7.2).add(new THREE.Vector3(0, 4.8, 0));
      this.camera.position.lerp(targetPosition, 1 - Math.pow(.004, dt));
      const lookAt = this.vehicle.position.clone().addScaledVector(direction, 3.2).add(new THREE.Vector3(0, 1, 0));
      this.camera.lookAt(lookAt);
    }

    updateHUD() {
      this.root.querySelector("[data-fg='time']").textContent = formatTime(this.elapsed);
      this.root.querySelector("[data-fg='delivery']").textContent = `${this.delivered} / ${this.targetCount}`;
      this.root.querySelector("[data-fg='score']").textContent = Math.round(this.score);
      this.root.querySelector("[data-fg='integrity']").textContent = `${Math.round(this.integrity)}%`;
      const bar = this.root.querySelector("[data-fg='integrity-bar']");
      bar.style.width = `${this.integrity}%`;
      bar.style.background = this.integrity > 65 ? "#60d394" : (this.integrity > 30 ? "#f1c453" : "#ed6666");
      const fork = this.forkWorldPosition();
      const nearPallet = !this.carrying && this.pallets.some(pallet => Math.hypot(pallet.position.x - fork.x, pallet.position.z - fork.z) < 1.5);
      const prompt = this.root.querySelector("[data-fg='prompt']");
      if (nearPallet) {
        prompt.textContent = "Підніми вила, щоб узяти піддон";
        prompt.classList.remove("fg-hidden");
      } else if (this.carrying && this.inDestination(fork)) {
        prompt.textContent = "Опусти вила, щоб здати піддон";
        prompt.classList.remove("fg-hidden");
      } else if (!this.npcs.some(npc => npc.position.distanceTo(this.vehicle.position) < 4.8)) {
        prompt.classList.add("fg-hidden");
      }
      this.drawMinimap();
    }

    drawMinimap() {
      const canvas = this.root.querySelector(".fg-minimap");
      const context = canvas.getContext("2d");
      const map = position => ({
        x: canvas.width / 2 + position.x / 44 * canvas.width,
        y: canvas.height / 2 + position.z / 92 * canvas.height
      });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#0b171d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#4f6771";
      context.lineWidth = 3;
      context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      context.fillStyle = "#d7a928";
      context.fillRect(canvas.width * .35, canvas.height * .84, canvas.width * .3, canvas.height * .1);
      context.fillStyle = "#42bc78";
      if (this.mode === "trailer") context.fillRect(canvas.width * .75, canvas.height * .18, canvas.width * .2, canvas.height * .34);
      else context.fillRect(canvas.width * .35, canvas.height * .06, canvas.width * .3, canvas.height * .1);
      context.fillStyle = "#e3b531";
      const player = map(this.vehicle.position);
      context.beginPath();
      context.arc(player.x, player.y, 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#f08b8b";
      this.npcs.forEach(npc => {
        const point = map(npc.position);
        context.beginPath();
        context.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        context.fill();
      });
    }

    notice(text, type) {
      if (!this.root) return;
      const element = document.createElement("div");
      element.className = `fg-notice ${type || ""}`;
      element.textContent = text;
      this.root.querySelector(".fg-notices").appendChild(element);
      setTimeout(() => element.remove(), 2800);
    }

    completeShift() {
      this.paused = true;
      this.speed = 0;
      this.stats.bestScore = Math.max(this.stats.bestScore, Math.round(this.score));
      if (this.mode === "trailer" && (!this.stats.bestTrailerTime || this.elapsed < this.stats.bestTrailerTime)) {
        this.stats.bestTrailerTime = Math.floor(this.elapsed);
      }
      saveStats(this.stats);
      const screen = this.root.querySelector(".fg-screen");
      screen.innerHTML = `
        <div class="fg-menu">
          <div class="fg-kicker">Зміну завершено</div>
          <h1>${this.mode === "trailer" ? "Фуру завантажено!" : "Перевезення завершено!"}</h1>
          <p>Час: <strong>${formatTime(this.elapsed)}</strong> · Бали: <strong>${Math.round(this.score)}</strong> · Цілісність вантажу: <strong>${Math.round(this.integrity)}%</strong></p>
          <div class="fg-menu-actions"><button class="fg-btn primary" data-finish="again">Ще одна зміна</button><button class="fg-btn" data-finish="exit">Вийти в склад</button></div>
        </div>`;
      screen.classList.remove("hidden");
      screen.querySelector("[data-finish='again']").addEventListener("click", () => {
        this.destroy();
        global.ForkliftGame.launch(this.options);
      });
      screen.querySelector("[data-finish='exit']").addEventListener("click", () => this.destroy());
    }

    showPauseMenu() {
      if (!this.started || this.destroyed) {
        this.destroy();
        return;
      }
      this.paused = true;
      const screen = this.root.querySelector(".fg-screen");
      screen.innerHTML = `
        <div class="fg-menu">
          <div class="fg-kicker">Пауза</div>
          <h1>Зміна призупинена</h1>
          <p>Поточний результат буде втрачено, якщо вийти в робочий застосунок.</p>
          <div class="fg-menu-actions"><button class="fg-btn primary" data-pause="resume">Продовжити</button><button class="fg-btn danger" data-pause="exit">Вийти в склад</button></div>
        </div>`;
      screen.classList.remove("hidden");
      screen.querySelector("[data-pause='resume']").addEventListener("click", () => {
        screen.classList.add("hidden");
        this.paused = false;
        this.clock?.getDelta();
      });
      screen.querySelector("[data-pause='exit']").addEventListener("click", () => this.destroy());
    }

    animate() {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(() => this.animate());
      const dt = Math.min(.05, this.clock.getDelta());
      if (!this.paused) {
        this.elapsed += dt;
        this.damageCooldown = Math.max(0, this.damageCooldown - dt);
        this.updateVehicle(dt);
        this.updateWorkers(dt);
        this.updateTraffic(dt);
        this.updateIncidentActors(dt);
        this.updateCamera(dt);
        this.updateHUD();
      }
      this.renderer.render(this.scene, this.camera);
    }

    resize() {
      if (!this.renderer || !this.camera) return;
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      this.renderer.setSize(innerWidth, innerHeight);
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      removeEventListener("resize", this.resizeHandler);
      removeEventListener("keydown", this.keyDownHandler);
      removeEventListener("keyup", this.keyUpHandler);
      try { this.engineOscillator?.stop(); } catch (error) {}
      try { this.audio?.close(); } catch (error) {}
      if (this.scene) {
        this.scene.traverse(object => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
          else object.material?.dispose?.();
          object.material?.map?.dispose?.();
        });
      }
      this.renderer?.dispose?.();
      this.root?.remove();
      document.body.style.overflow = this.previousBodyOverflow || "";
      if (activeGame === this) activeGame = null;
      if (typeof this.options.onExit === "function") this.options.onExit();
    }
  }

  global.ForkliftGame = {
    launch(options) {
      if (activeGame) activeGame.destroy();
      activeGame = new ForkliftGame(options).mount();
      return activeGame;
    },
    close() {
      activeGame?.destroy();
    }
  };
})(window);
