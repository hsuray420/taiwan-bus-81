/**
 * Taiwan Bus 81 - Core Simulation & Physics Engine
 * Controls:
 * - W / S / A / D / Arrows: Drive & Steer
 * - Space / P: Pneumatic Parking Brake (氣壓手煞車拔起/釋放 嘶——喀！)
 * - 1: Toggle Front Door (前折疊門)
 * - 2: Toggle Middle Door (中外滑門)
 * - C: Cycle Camera View (左駕駕駛座 / 車外第三人稱)
 * - Q / X: Left / Right Turn Signals (清脆方向燈繼電器)
 * - H: Dual Heavy Horn (大巴喇叭)
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { KinglongBus } from './bus.js?v=manual-transmission-20261107';
import { TaichungCity, STATIONS } from './city.js?v=d25635b';
import { BusAudioEngine } from './audio.js?v=manual-transmission-20261107';
import {
  applyPassengerEvent,
  createPassengerEventPlan,
  shouldAutoOpenFrontDoor,
  shouldPlayTurnWarning
} from './passenger-events.mjs?v=manual-transmission-20261107';
import {
  calculateDriveForce,
  calculateEngineRpm,
  gearLabel,
  isEngineStalled,
  shiftGear as selectManualGear
} from './manual-transmission.mjs?v=manual-transmission-20261107';

export class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.audio = new BusAudioEngine();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x82b4dc); // 台灣晴朗天空藍
    this.scene.fog = new THREE.FogExp2(0x95c0e4, 0.0016);

    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      1600
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Daylight lighting
    this.setupLighting();

    // Spawn City and Bus
    this.city = new TaichungCity(this.scene);
    this.bus = new KinglongBus(this.scene);

    // Initial bus transform (Starting near 統聯轉運站)
    this.busPos = new THREE.Vector3(4.5, 0, 50); // 右側通行車道；車內駕駛座在左側
    this.busHeading = Math.PI; // 朝向 -Z 行駛 (往台中車站方向)
    this.busSpeed = 0; // m/s
    this.steerAngle = 0; // rad

    // Physics parameters
    this.maxSpeed = 16.6; // 60 km/h
    this.maxReverseSpeed = -3.5;
    this.acceleration = 3.4; // m/s^2
    this.braking = 7.0;
    this.drag = 0.988;
    this.maxSteer = 0.54;
    this.steerReturnSpeed = 3.6;

    // Game state
    this.currentStationIndex = 0;
    this.stationStopped = false;
    this.passengerCount = 14;
    this.cameraMode = 0; // 預設左駕駕駛座；只保留駕駛與車外視角
    this.cameraDistance = 15.0;
    this.cameraHeight = 4.2;

    // 手排變速箱狀態：啟動時留在空檔，必須踩離合器才能入檔。
    this.gear = 0;
    this.engineRpm = 700;
    this.engineStalled = false;

    // Parking brake state
    this.isParkingBrakeEngaged = false;
    this.leftTurnActive = false;
    this.rightTurnActive = false;
    this.stationEventsScheduled = new Set();
    this.passengerEventTimers = new Set();

    // Keys
    this.keys = {};

    // Setup events
    this.setupInputs();
    this.setupUI();

    // Clock
    this.clock = new THREE.Clock();

    // Initial station HUD
    this.updateStationHUD();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // 太陽直射光 (Sunlight with soft shadow)
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.6);
    sun.position.set(60, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // 半球環境光 (Sky Blue + Warm Ground Bounce)
    const hemiLight = new THREE.HemisphereLight(0xdbe9f6, 0x6e7b85, 0.85);
    this.scene.add(hemiLight);
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.audio.ensureContext();
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      this.keys[e.code] = true;

      if (e.repeat) return;

      // Single action hotkeys
      if (k === '1') this.toggleFrontDoor();
      if (k === '2') this.toggleMiddleDoor();
      if (k === 'c') this.cycleCamera();
      if (k === 'r') this.changeGear(1);
      if (k === 'f') this.changeGear(-1);
      if (k === 'n') this.setNeutral();
      if (k === 'v') this.toggleReferenceRecording();
      if (k === 'h') this.audio.playHorn();
      if (k === 'p' || e.code === 'Space') this.toggleParkingBrake();
      if (k === 'q') this.toggleTurnSignal('left');
      if (k === 'x' || k === 'e') this.toggleTurnSignal('right');
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      this.keys[e.code] = false;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('click', () => {
      this.audio.ensureContext();
    }, { once: true });
  }

  setupUI() {
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('touchstart', (e) => { e.preventDefault(); this.audio.ensureContext(); fn(true); });
        el.addEventListener('touchend', (e) => { e.preventDefault(); fn(false); });
        el.addEventListener('mousedown', () => { this.audio.ensureContext(); fn(true); });
        el.addEventListener('mouseup', () => { fn(false); });
      }
    };

    bindBtn('btn-gas', (active) => { this.keys['arrowup'] = active; });
    bindBtn('btn-brake', (active) => { this.keys['arrowdown'] = active; });
    bindBtn('btn-left', (active) => { this.keys['arrowleft'] = active; });
    bindBtn('btn-right', (active) => { this.keys['arrowright'] = active; });

    document.getElementById('btn-door-front')?.addEventListener('click', () => this.toggleFrontDoor());
    document.getElementById('btn-door-mid')?.addEventListener('click', () => this.toggleMiddleDoor());
    document.getElementById('btn-cam-switch')?.addEventListener('click', () => this.cycleCamera());
    document.getElementById('btn-handbrake')?.addEventListener('click', () => this.toggleParkingBrake());
    document.getElementById('btn-reference-audio')?.addEventListener('click', () => this.toggleReferenceRecording());
  }

  // ==========================================
  // 操作動作
  // ==========================================
  toggleParkingBrake() {
    this.isParkingBrakeEngaged = !this.isParkingBrakeEngaged;
    this.audio.playParkingBrake(this.isParkingBrakeEngaged);

    // 司機右側黃色大香菇氣壓手煞車拉起/推下動畫
    if (this.bus.parkingBrakeValve) {
      this.bus.parkingBrakeValve.position.y = this.isParkingBrakeEngaged ? 1.06 : 1.01;
    }

    const hbEl = document.getElementById('handbrake-indicator');
    if (hbEl) {
      hbEl.classList.toggle('active', this.isParkingBrakeEngaged);
    }

    this.showFloatingNotice(this.isParkingBrakeEngaged ? '🛑 氣壓手煞車已拔起 (排氣鎖定)' : '🟢 氣壓手煞車已釋放');
  }

  toggleTurnSignal(dir) {
    if (dir === 'left') {
      this.leftTurnActive = !this.leftTurnActive;
      this.rightTurnActive = false;
    } else {
      this.rightTurnActive = !this.rightTurnActive;
      this.leftTurnActive = false;
    }
    const anyActive = this.leftTurnActive || this.rightTurnActive;
    this.audio.setTurnSignal(anyActive);
  }

  get clutchPressed() {
    return Boolean(this.keys.ShiftLeft || this.keys.ShiftRight || this.keys.shift);
  }

  changeGear(direction) {
    const nextGear = selectManualGear(this.gear, direction, {
      clutchPressed: this.clutchPressed,
      speedMps: this.busSpeed
    });

    if (nextGear === this.gear) {
      this.audio.playGearShift(false);
      this.showFloatingNotice(this.clutchPressed ? '⚠️ 車速過快，無法掛入這個檔位' : '⚠️ 請先踩住離合器（Shift）');
      return;
    }

    this.gear = nextGear;
    this.bus.setGearPosition(this.gear);
    this.audio.playGearShift(true);
    this.showFloatingNotice(`⚙️ 已掛入 ${gearLabel(this.gear)} 檔`);
    this.updateTransmissionUI();
  }

  setNeutral() {
    if (!this.clutchPressed && this.gear !== 0) {
      this.showFloatingNotice('⚠️ 請踩住離合器（Shift）再回空檔');
      return;
    }
    this.gear = 0;
    this.bus.setGearPosition(this.gear);
    this.audio.playGearShift(true);
    this.showFloatingNotice('⚙️ 已回到空檔 N');
    this.updateTransmissionUI();
  }

  toggleReferenceRecording() {
    this.audio.toggleReferenceRecording().then((playing) => {
      this.showFloatingNotice(playing ? '🎧 播放你提供的原始行車實錄' : '⏸️ 已暫停原始行車實錄');
      const button = document.getElementById('btn-reference-audio');
      if (button) button.querySelector('span:last-of-type').innerText = playing ? '播放中' : '未播放';
    }).catch(() => {
      this.showFloatingNotice('⚠️ 原始錄音載入失敗，請確認 assets/audio 檔案存在');
    });
  }

  toggleFrontDoor() {
    const isOpen = this.bus.toggleFrontDoor();
    this.audio.playDoorPneumatic(isOpen);
    this.updateDoorUI();
    this.tryStartPassengerExchange();
  }

  toggleMiddleDoor() {
    const isOpen = this.bus.toggleMiddleDoor();
    this.audio.playDoorPneumatic(isOpen);
    this.updateDoorUI();
    this.tryStartPassengerExchange();
  }

  triggerCardTap() {
    const isStudent = Math.random() > 0.65;
    const cardType = isStudent ? 'student' : 'regular';
    this.audio.playCardTap(cardType);

    this.bus.updateCardReaderScreen('扣款成功 0元', '台中市民10km免費', true);
    this.showFloatingNotice(`乘客持【${isStudent ? '學生票' : '普通卡'}】自動刷卡 (0元)`);

    setTimeout(() => {
      this.bus.updateCardReaderScreen('歡迎搭乘 81', '上下車請刷卡');
    }, 2200);
  }

  triggerStopBell() {
    this.audio.playStopBell();
    this.bus.setStopBellLight(true);

    const alertEl = document.getElementById('bell-alert');
    if (alertEl) {
      alertEl.classList.add('active');
    }
    this.showFloatingNotice('叮咚！乘客自動按下車鈴');
  }

  resetStopBell() {
    this.bus.setStopBellLight(false);
    const alertEl = document.getElementById('bell-alert');
    if (alertEl) {
      alertEl.classList.remove('active');
    }
  }

  cycleCamera() {
    this.cameraMode = (this.cameraMode + 1) % 3;
    const names = ['台灣標準左駕駕駛室視角', '車外第三人稱追蹤視角', '成運電側身全車特寫視角'];
    this.showFloatingNotice(`已切換至：${names[this.cameraMode]}`);
  }

  announceNextStation() {
    const nextSt = STATIONS[this.currentStationIndex];
    if (!nextSt) return;
    this.audio.announceStation(STATIONS[this.currentStationIndex - 1]?.name, nextSt.name);
    this.bus.updateInteriorLed(`下一站：${nextSt.name}`);
    this.showFloatingNotice(`📢 廣播下一站：${nextSt.name}`);
  }

  testPreludeChime() {
    this.audio.playStationPreludeChime('bus');
    this.showFloatingNotice('🔔 播放公車/捷運三音到站提示前奏鈴');
  }

  // ==========================================
  // 物理與車輛動態
  // ==========================================
  updatePhysics(delta) {
    const forward = this.keys['w'] || this.keys['arrowup'];
    const backward = this.keys['s'] || this.keys['arrowdown'];
    const left = this.keys['a'] || this.keys['arrowleft'];
    const right = this.keys['d'] || this.keys['arrowright'];
    const clutchPressed = this.clutchPressed;
    const isReverseThrottle = this.gear < 0 && backward;
    const isForwardThrottle = this.gear > 0 && forward;
    const throttle = isReverseThrottle || isForwardThrottle ? 1 : 0;
    const brakeInput = backward && this.gear >= 0 && this.busSpeed > 0;

    this.bus.setClutchPedal(clutchPressed);

    // 數位離合器：踩住時切斷傳動，放開後由檔位決定驅動方向。
    if (this.engineStalled && clutchPressed && forward) {
      this.engineStalled = false;
      this.audio.playEngineStart();
      this.showFloatingNotice('🔑 引擎重新啟動');
    }

    // 氣壓手煞車限制
    if (this.isParkingBrakeEngaged) {
      this.busSpeed *= 0.85;
      if (Math.abs(this.busSpeed) < 0.05) this.busSpeed = 0;
    } else if (this.engineStalled) {
      this.busSpeed *= Math.pow(this.drag, delta * 60);
    } else if (brakeInput) {
      this.busSpeed = Math.max(0, this.busSpeed - this.braking * delta);
    } else if (clutchPressed) {
      this.busSpeed *= Math.pow(this.drag, delta * 28);
      if (Math.abs(this.busSpeed) < 0.05) this.busSpeed = 0;
    } else {
      const driveForce = calculateDriveForce({
        gear: this.gear,
        clutchPressed,
        throttle,
        speedMps: this.busSpeed
      });

      if (this.gear < 0 && isReverseThrottle) {
        this.busSpeed = Math.max(this.maxReverseSpeed, this.busSpeed - Math.abs(driveForce) * delta);
      } else if (this.gear > 0 && isForwardThrottle) {
        this.busSpeed = Math.min(this.maxSpeed, this.busSpeed + driveForce * delta);
      } else {
        this.busSpeed *= Math.pow(this.drag, delta * 60);
        if (Math.abs(this.busSpeed) < 0.05) this.busSpeed = 0;
      }
    }

    // 轉向物理 (Steering)
    const steerSpeed = 2.5 * delta;
    if (left) {
      this.steerAngle = Math.min(this.maxSteer, this.steerAngle + steerSpeed);
    } else if (right) {
      this.steerAngle = Math.max(-this.maxSteer, this.steerAngle - steerSpeed);
    } else {
      if (this.steerAngle > 0.02) {
        this.steerAngle -= this.steerReturnSpeed * delta;
      } else if (this.steerAngle < -0.02) {
        this.steerAngle += this.steerReturnSpeed * delta;
      } else {
        this.steerAngle = 0;
      }
    }

    // 航向角與大巴內輪差轉動 (Ackermann Wheelbase kinematics)
    const angularVelocity = (this.busSpeed / this.bus.wheelbase) * Math.tan(this.steerAngle);
    this.busHeading += angularVelocity * delta;

    // 前進位移 (朝向 -Z 方向)
    this.busPos.x += Math.sin(this.busHeading) * this.busSpeed * delta;
    this.busPos.z += Math.cos(this.busHeading) * this.busSpeed * delta;

    // 固定路線站停輔助：接近站牌時由車輛自動柔煞，避免玩家高速穿站。
    // 最終仍需由玩家控制方向、煞車與開門，這不是自動駕駛。
    this.applyStationStopAssist(delta);

    // 道路邊界限制
    this.busPos.x = Math.max(-this.city.roadWidth / 2 + 1.3, Math.min(this.city.roadWidth / 2 - 1.3, this.busPos.x));

    // 更新 3D 模型位置
    this.bus.group.position.copy(this.busPos);
    this.bus.group.rotation.y = this.busHeading;

    // 車身煞車點頭與過彎傾斜 (Suspension roll & pitch)
    const rollAngle = -this.steerAngle * (this.busSpeed / this.maxSpeed) * 0.06;
    const pitchAngle = (forward ? -0.015 : (backward ? 0.025 : 0));
    this.bus.group.rotation.z = rollAngle;
    this.bus.group.rotation.x = pitchAngle;

    // 更新車輪與車門動畫
    const isBraking = (backward && this.busSpeed > 0.2) || this.isParkingBrakeEngaged;
    this.bus.update(delta, this.busSpeed, this.steerAngle, isBraking);

    const steeringDirection = left ? 'left' : right ? 'right' : null;
    this.audio.setTurnWarning(
      shouldPlayTurnWarning({ speed: this.busSpeed, steerAngle: this.steerAngle }),
      steeringDirection
    );

    // 引擎聲浪動態更新
    const speedKmh = Math.abs(this.busSpeed * 3.6);
    this.engineRpm = calculateEngineRpm({
      speedMps: this.busSpeed,
      gear: this.gear,
      throttle,
      stalled: this.engineStalled
    });
    if (!this.engineStalled && isEngineStalled({
      gear: this.gear,
      clutchPressed,
      speedMps: this.busSpeed,
      throttle,
      rpm: this.engineRpm
    })) {
      this.engineStalled = true;
      this.busSpeed = 0;
      this.audio.playEngineStall();
      this.showFloatingNotice('🛑 拖檔熄火：踩住離合器並按 W 重新啟動');
    }
    this.audio.updateEngine(
      speedKmh,
      throttle,
      this.gear > 0 && backward && speedKmh > 15,
      this.gear,
      this.engineRpm,
      this.engineStalled
    );

    // 更新成運電數位液晶儀表板 (Roblox 100% 48°C / 時速 / 檔位 / 方向燈)
    if (this.bus.updateDigitalCluster) {
      const flash = Math.floor(Date.now() / 320) % 2 === 0;
      const leftBlink = (this.leftTurnActive || (left && speedKmh > 2)) && flash;
      const rightBlink = (this.rightTurnActive || (right && speedKmh > 2)) && flash;
      this.bus.updateDigitalCluster({
        speedKmh,
        gearLabel: gearLabel(this.gear),
        rpm: this.engineRpm,
        batteryPct: Math.max(92, 100 - (Math.abs(this.busPos.z) / 400)),
        batteryTemp: 48,
        leftSignal: leftBlink,
        rightSignal: rightBlink,
        parkingBrake: this.isParkingBrakeEngaged
      });
    }

    // 更新 HUD
    this.updateSpeedometer(speedKmh);
    this.updateTransmissionUI();
    this.checkStationProximity();
  }

  checkStationProximity() {
    const currentSt = STATIONS[this.currentStationIndex];
    if (!currentSt) return;

    const distToStation = Math.abs(this.busPos.z - currentSt.posZ);
    const stationPrompt = document.getElementById('station-prompt');

    if (distToStation < 16.0) {
      if (stationPrompt) {
        stationPrompt.style.display = 'block';
        const stopLabel = currentSt.type === 'hub' ? '大站' : currentSt.type === 'major' ? '主要站' : '一般站';
        stationPrompt.innerHTML = `🚏 即將抵達：<strong>${currentSt.name}</strong> <small>（${stopLabel}）</small><br><small>請減速靠右停妥，車門與乘客上下車流程會自動執行</small>`;
      }

      if (Math.abs(this.busSpeed) < 0.3) {
        if (!this.stationStopped) {
          this.stationStopped = true;
          this.onStationArrival(currentSt);
        }
      }
    } else if (distToStation < 34.0 && this.currentStationIndex > 0) {
      this.schedulePassengerStopBell(currentSt);
    } else {
      if (stationPrompt && distToStation > 25.0) {
        stationPrompt.style.display = 'none';
      }
      if (distToStation > 30.0 && this.stationStopped) {
        this.stationStopped = false;
        this.resetStopBell();
        if (this.currentStationIndex < STATIONS.length - 1) {
          this.currentStationIndex++;
          this.stationEventsScheduled.delete(currentSt.id);
          this.updateStationHUD();
          this.announceNextStation();
        }
      }
    }
  }

  applyStationStopAssist(delta) {
    const station = STATIONS[this.currentStationIndex];
    if (!station || this.stationStopped || this.busSpeed <= 0) return;

    const distance = Math.abs(this.busPos.z - station.posZ);
    if (distance > 12) return;

    const assistBraking = this.braking * 1.8;
    this.busSpeed = Math.max(0, this.busSpeed - assistBraking * delta);
    if (distance < 1.2 && this.busSpeed < 2.2) this.busSpeed = 0;
  }

  onStationArrival(station) {
    this.showFloatingNotice(`✅ 已停妥【${station.name}】（${station.type === 'hub' ? '大站' : station.type === 'major' ? '主要站' : '一般站'}）`);
    this.resetStopBell();

    if (shouldAutoOpenFrontDoor({
      stationStopped: this.stationStopped,
      frontDoorOpen: this.bus.frontDoorOpen
    })) {
      this.toggleFrontDoor();
    }

    this.tryStartPassengerExchange();
  }

  tryStartPassengerExchange() {
    const station = STATIONS[this.currentStationIndex];
    if (!this.stationStopped || !station || this.stationEventsScheduled.has(`exchange:${station.id}`)) return;
    if (!this.bus.frontDoorOpen && !this.bus.middleDoorOpen) return;

    this.stationEventsScheduled.add(`exchange:${station.id}`);

    const plan = createPassengerEventPlan({
      passengerCount: this.passengerCount,
      stationIndex: station.id
    });

    for (const event of plan) {
      const timer = setTimeout(() => {
        this.passengerEventTimers.delete(timer);
        this.passengerCount = applyPassengerEvent(this.passengerCount, event);
        if (event.type === 'board') this.triggerCardTap();
        this.updatePassengerUI();
      }, event.delayMs);
      this.passengerEventTimers.add(timer);
    }

    const lastEventDelay = plan.length > 0 ? plan[plan.length - 1].delayMs : 0;
    const closeTimer = setTimeout(() => {
      this.passengerEventTimers.delete(closeTimer);
      if (this.currentStationIndex === station.id && this.bus.frontDoorOpen) {
        this.toggleFrontDoor();
      }
    }, lastEventDelay + 1800);
    this.passengerEventTimers.add(closeTimer);
  }

  schedulePassengerStopBell(station) {
    if (this.stationEventsScheduled.has(station.id)) return;
    this.stationEventsScheduled.add(station.id);
    const timer = setTimeout(() => {
      this.passengerEventTimers.delete(timer);
      if (this.currentStationIndex === station.id && Math.abs(this.busSpeed) > 0.3) {
        this.triggerStopBell();
      }
    }, 900);
    this.passengerEventTimers.add(timer);
  }

  // ==========================================
  // 鏡頭視角更新 (含台灣標準左駕駕駛艙視角)
  // ==========================================
  updateCamera() {
    if (this.cameraMode === 0) {
      // 模式 0：台灣標準左駕駕駛室視角 (坐在左前方 x = -0.75, y = 1.62, z = 4.35)
      // 朝向前方擋風玻璃，方向盤在眼前下方，左後視鏡在左，右照地鏡與投幣箱在右前方
      const driverEye = new THREE.Vector3(-0.75, 1.62, 4.35);
      driverEye.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.busHeading);

      const lookAhead = new THREE.Vector3(-0.75, 1.55, 24.0);
      lookAhead.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.busHeading);

      this.camera.position.copy(this.busPos).add(driverEye);
      this.camera.lookAt(this.busPos.clone().add(lookAhead));
    } else if (this.cameraMode === 1) {
      // 模式 1：車外第三人稱追蹤視角 (稍帶右偏角，完整欣賞綠色金屬漆車身與輪拱)
      const dist = this.cameraDistance;
      const angle = this.busHeading;
      const camOffset = new THREE.Vector3(
        -Math.sin(angle) * dist + 1.6,
        this.cameraHeight,
        -Math.cos(angle) * dist
      );

      this.camera.position.copy(this.busPos).add(camOffset);
      this.camera.lookAt(this.busPos.x, this.busPos.y + 1.7, this.busPos.z);
    } else if (this.cameraMode === 2) {
      // 模式 2：車身右側 45 度全身特寫視角 (成運電 EAL-5195 科技塗裝與車門特寫)
      const sideOffset = new THREE.Vector3(5.8, 2.0, 1.2);
      sideOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.busHeading);
      this.camera.position.copy(this.busPos).add(sideOffset);
      this.camera.lookAt(this.busPos.x, this.busPos.y + 1.3, this.busPos.z);
    }
  }

  // ==========================================
  // HUD 介面輔助
  // ==========================================
  updateSpeedometer(kmh) {
    const el = document.getElementById('speed-display');
    if (el) el.innerText = Math.round(kmh);
  }

  updateTransmissionUI() {
    const gearEl = document.getElementById('gear-display');
    const clutchEl = document.getElementById('clutch-display');
    const engineEl = document.getElementById('engine-status');
    if (gearEl) gearEl.innerText = gearLabel(this.gear);
    if (clutchEl) clutchEl.innerText = this.clutchPressed ? '離合器：踩下' : '離合器：放開';
    if (engineEl) engineEl.innerText = this.engineStalled ? '熄火' : `${Math.round(this.engineRpm)} RPM`;
  }

  updateStationHUD() {
    const st = STATIONS[this.currentStationIndex];
    const el = document.getElementById('current-station-name');
    if (el && st) el.innerText = st.name;

    const infoEl = document.getElementById('route-info');
    if (infoEl && st) {
      const stopLabel = st.type === 'hub' ? '大站' : st.type === 'major' ? '主要站' : '一般站';
      infoEl.innerText = `${st.id + 1}/${STATIONS.length}站 · ${stopLabel}: ${st.info}`;
    }
  }

  updateDoorUI() {
    const fEl = document.getElementById('door-front-status');
    const mEl = document.getElementById('door-mid-status');
    if (fEl) fEl.innerText = this.bus.frontDoorOpen ? '開啟' : '關閉';
    if (mEl) mEl.innerText = this.bus.middleDoorOpen ? '開啟' : '關閉';
  }

  updatePassengerUI() {
    const el = document.getElementById('passenger-count');
    if (el) el.innerText = this.passengerCount;
  }

  showFloatingNotice(text) {
    const el = document.getElementById('toast-notice');
    if (!el) return;
    el.innerText = text;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2800);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePhysics(delta);
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  }
}

// 啟動遊戲
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
