/**
 * Taiwan Bus 81 - KINGLONG KL6112U1 11.2m short-wheelbase Euro IV city bus (Three.js)
 * High-definition modeling with authentic Taiwan Left-Hand Drive (LHD - 左駕) setup:
 * - Driver Station on the LEFT (左側駕駛座):
 *   * Authentic 45° angled 2-spoke steering wheel with King Long emblem
 *   * Detailed slanted instrument cluster with glowing speedo, tachometer & dual air pressure gauges
 *   * Yellow mushroom parking air brake valve ("黃色大香菇氣壓手煞車")
 *   * Manual gear lever, three pedals & illuminated driver switch panel
 *   * Stainless steel coin fare box (不鏽鋼投幣箱)
 *   * 寶錄電子 (Baolu) IC Card Reader facing passenger entrance
 * - Passenger Boarding on the RIGHT (右側開門):
 *   * Front pneumatic 2-leaf folding door with safety edges
 *   * Middle wide low-floor sliding doors
 * - Exterior Craftsmanship:
 *   * 統聯客運 (Ubus Green) metallic clearcoat with official white wave stripe & greyhound logo
 *   * Wheel arches (輪拱) with black rubber fender flares
 *   * 10-lug heavy duty alloy rims with chrome hubcaps and deep tread radial tires
 *   * Projector glass headlights, amber turn signals, LED daytime running lights
 *   * High-contrast glowing amber LED destination matrix (81 經 公益路 臺中車站)
 *   * Taiwan bus license plate (812-U9)
 *   * Ergonomic patterned seats, 博愛座 (Priority Seats) with pictograms,
 *     ceiling hand straps, and realistic glowing red stop buzzers (下車鈴)
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { KL6112U1_SPEC } from './vehicle-spec.mjs';

export class KinglongBus {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1:1 Scale Dimensions (Meters)
    this.length = KL6112U1_SPEC.lengthM;
    this.width = KL6112U1_SPEC.widthM;
    this.height = KL6112U1_SPEC.heightM;
    this.wheelbase = KL6112U1_SPEC.wheelbaseM;

    // States
    this.frontDoorOpen = false;
    this.middleDoorOpen = false;
    this.frontDoorProgress = 0;
    this.middleDoorProgress = 0;
    this.stopBellActive = false;
    this.parkingBrakeActive = false;

    // Animated references
    this.frontDoorPivot = null;
    this.midDoorLeft = null;
    this.midDoorRight = null;
    this.steeringWheel = null;
    this.parkingBrakeValve = null;
    this.speedNeedle = null;
    this.rpmNeedle = null;
    this.frontLeftWheelPivot = null;
    this.frontRightWheelPivot = null;
    this.frontLeftWheel = null;
    this.frontRightWheel = null;
    this.rearLeftWheel = null;
    this.rearRightWheel = null;
    this.stopBells = [];

    this.createMaterials();
    this.build();
    this.scene.add(this.group);
  }

  createMaterials() {
    // 1. 統聯客運經典金屬綠漆 (Metallic Ubus Green with clearcoat)
    this.matUbusGreen = new THREE.MeshStandardMaterial({
      color: 0x11853b,
      roughness: 0.22,
      metalness: 0.35
    });

    // 2. 白色車側飾條
    this.matWhite = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.35
    });

    // 3. 黑色高光窗框 / 陶瓷黑網點 (Gloss Black Trim)
    this.matGlossBlack = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.15,
      metalness: 0.2
    });

    // 4. 黑色霧面底盤與保險桿 (Matte Bumper & Underbody)
    this.matMatteBlack = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.85
    });

    // 5. 金龍鍍鉻金屬件 (Chrome Grille & Emblems)
    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      metalness: 0.95,
      roughness: 0.08
    });

    this.matWood = new THREE.MeshStandardMaterial({
      color: 0x6d3f22,
      roughness: 0.3,
      metalness: 0.05
    });

    // 6. 晶透前擋風玻璃 (Crystal Clear Laminated Windshield)
    this.matWindshield = new THREE.MeshPhysicalMaterial({
      color: 0x112222,
      transparent: true,
      opacity: 0.18,
      roughness: 0.02,
      transmission: 0.94,
      ior: 1.52
    });

    // 7. 側邊抗 UV 隔熱茶綠車窗 (Tinted UV Glass)
    this.matSideGlass = new THREE.MeshPhysicalMaterial({
      color: 0x1a3828,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      transmission: 0.82,
      ior: 1.52
    });

    // 8. 駕駛艙立柱亮黃色安全漆 (Safety Yellow)
    this.matYellowPole = new THREE.MeshStandardMaterial({
      color: 0xfbc02d,
      roughness: 0.3,
      metalness: 0.1
    });

    // 9. 經典紅色下車鈴按鈕 (Stop Buzzer)
    this.matBellHousing = new THREE.MeshStandardMaterial({
      color: 0xc62828,
      roughness: 0.3
    });

    this.matBellButton = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: 0x000000,
      roughness: 0.2
    });

    // 10. 不銹鋼投幣箱金屬 (Brushed Stainless Steel)
    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      metalness: 0.85,
      roughness: 0.3
    });

    // 11. 輪胎防滑橡膠 (Radial Tire Rubber)
    this.matTire = new THREE.MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.95
    });

    // 12. 鋁合金 10 孔輪圈 (10-Lug Alloy Rim)
    this.matRim = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.75,
      roughness: 0.25
    });

    // 13. 座椅絨布花紋
    this.matSeat = new THREE.MeshStandardMaterial({
      color: 0x1565c0,
      roughness: 0.8
    });

    // 14. 博愛座 (Priority Seat - 深藍)
    this.matPrioritySeat = new THREE.MeshStandardMaterial({
      color: 0x0d47a1,
      roughness: 0.8
    });
  }

  build() {
    this.buildBodyStructure();
    this.buildWheelWells();
    this.buildWindows();
    this.buildRoofAndAC();
    this.buildFrontFace();
    this.buildRearFace();
    this.buildDoors();
    this.buildWheels();
    this.buildLeftHandDriveCockpit(); // 台灣標準左駕
    this.buildInteriorPassengers();
    this.buildLights();
    this.buildMirrors();
  }

  // ==========================================
  // 1. 車體主結構與高解析塗裝 (Body & Liveries)
  // ==========================================
  buildBodyStructure() {
    const halfL = this.length / 2;
    const halfW = this.width / 2;

    // 完整上車身殼體：讓車窗、門框與車頭不再漂浮在空氣中。
    const bodyShell = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, 2.25, this.length - 0.24),
      this.matUbusGreen
    );
    bodyShell.position.set(0, 1.68, 0);
    bodyShell.castShadow = true;
    bodyShell.receiveShadow = true;
    this.group.add(bodyShell);

    // A. 低地板底盤總成 (Chassis Floor)
    const floorGeo = new THREE.BoxGeometry(this.width, 0.22, this.length);
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({ color: 0x2b3035, roughness: 0.9 })
    );
    floor.position.set(0, 0.4, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // B. 左側裙板 (Left Side Lower Body Panel) - y: 0.5 ~ 1.45
    const leftLowerGeo = new THREE.BoxGeometry(0.12, 0.95, this.length - 0.4);
    const leftLower = new THREE.Mesh(leftLowerGeo, this.matUbusGreen);
    leftLower.position.set(-halfW + 0.06, 0.95, 0);
    this.group.add(leftLower);

    // C. 右側裙板 (Right Side Lower Body Panels - 避開右前方前門與中央中門)
    // 前門前裙板 (z: 5.4 ~ 5.8)
    const rLower1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.95, 0.5),
      this.matUbusGreen
    );
    rLower1.position.set(halfW - 0.06, 0.95, 5.6);
    this.group.add(rLower1);

    // 前門與中門之間裙板 (z: 0.8 ~ 4.2)
    const rLower2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.95, 3.8),
      this.matUbusGreen
    );
    rLower2.position.set(halfW - 0.06, 0.95, 2.5);
    this.group.add(rLower2);

    // 中門後裙板 (z: -5.6 ~ -1.6)
    const rLower3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.95, 4.2),
      this.matUbusGreen
    );
    rLower3.position.set(halfW - 0.06, 0.95, -3.6);
    this.group.add(rLower3);

    // D. 統聯白色拉花飾條 (Official White Speed Swoosh)
    const stripeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.22, this.length - 0.4),
      this.matWhite
    );
    stripeL.position.set(-halfW + 0.06, 0.95, 0);
    this.group.add(stripeL);

    const stripeR = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.22, 3.8),
      this.matWhite
    );
    stripeR.position.set(halfW - 0.06, 0.95, 2.5);
    this.group.add(stripeR);

    // E. 車側高清晰統聯客運塗裝貼圖 (Side Decals)
    this.buildHighResSideDecals();
  }

  buildHighResSideDecals() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 256);

    // 繪製統聯綠色金屬感漸層文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px "Noto Sans TC", sans-serif';
    ctx.fillText('統聯客運', 40, 110);

    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('UNITED BUS', 400, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Noto Sans TC", sans-serif';
    ctx.fillText('81 統聯轉運站 ⇄ 太平', 400, 125);

    ctx.fillStyle = '#cfd8dc';
    ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
    ctx.fillText('(經 公益路、草悟道、臺中車站)', 40, 185);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    const matDecal = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

    // 右側塗裝 (靠近乘客上車側)
    const rightDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), matDecal);
    rightDecal.rotation.y = Math.PI / 2;
    rightDecal.position.set(this.width / 2 + 0.02, 0.95, 2.5);
    this.group.add(rightDecal);

    // 左側塗裝 (駕駛側)
    const leftDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), matDecal);
    leftDecal.rotation.y = -Math.PI / 2;
    leftDecal.position.set(-this.width / 2 - 0.02, 0.95, 0);
    this.group.add(leftDecal);
  }

  // ==========================================
  // 2. 輪拱開孔 (Wheel Arches & Black Fenders)
  // ==========================================
  buildWheelWells() {
    const halfW = this.width / 2;
    // 前後輪拱黑色橡膠檔泥外唇
    const wellPositions = [
      { x: -halfW - 0.01, z: 3.6 },
      { x: halfW + 0.01, z: 3.6 },
      { x: -halfW - 0.01, z: -2.4 },
      { x: halfW + 0.01, z: -2.4 }
    ];

    for (const pos of wellPositions) {
      const arch = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.62, 16, 1, 0, Math.PI),
        this.matMatteBlack
      );
      arch.rotation.y = pos.x > 0 ? Math.PI / 2 : -Math.PI / 2;
      arch.position.set(pos.x, 0.5, pos.z);
      this.group.add(arch);
    }
  }

  // ==========================================
  // 3. 車窗與黑網點防曬窗柱 (Windows & Ceramic Frit)
  // ==========================================
  buildWindows() {
    const halfW = this.width / 2;
    const winHeight = 1.25;
    const winY = 2.05;

    // 左側駕駛側窗柱 (Pillars)
    for (let z = 5.2; z >= -5.2; z -= 1.8) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, winHeight, 0.12),
        this.matGlossBlack
      );
      pillar.position.set(-halfW - 0.06, winY, z);
      this.group.add(pillar);
    }

    // 左側駕駛側透明隔熱大車窗
    const leftWin = new THREE.Mesh(
      new THREE.PlaneGeometry(this.length - 1.2, winHeight),
      this.matSideGlass
    );
    leftWin.rotation.y = -Math.PI / 2;
    leftWin.position.set(-halfW - 0.03, winY, 0);
    this.group.add(leftWin);

    // 右側乘客側車窗 (分段避開前後門)
    const rightWinFront = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, winHeight),
      this.matSideGlass
    );
    rightWinFront.rotation.y = Math.PI / 2;
    rightWinFront.position.set(halfW + 0.03, winY, 2.4);
    this.group.add(rightWinFront);

    const rightWinRear = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, winHeight),
      this.matSideGlass
    );
    rightWinRear.rotation.y = Math.PI / 2;
    rightWinRear.position.set(halfW + 0.03, winY, -3.6);
    this.group.add(rightWinRear);
  }

  // ==========================================
  // 4. 車頂與頂置冷氣組 (Roof & AC Unit)
  // ==========================================
  buildRoofAndAC() {
    // 頂部圓弧綠色車頂 (y: 2.75 ~ 3.1)
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, 0.25, this.length),
      this.matUbusGreen
    );
    roof.position.set(0, 2.85, 0);
    this.group.add(roof);

    // 車頂空調冷氣排熱艙 (Roof AC Pod)
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.35, 3.4),
      this.matWhite
    );
    ac.position.set(0, 3.12, -0.6);
    this.group.add(ac);

    // 冷氣排風葉片
    for (let i = -1.2; i <= 1.2; i += 0.4) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.04, 0.2),
        this.matMatteBlack
      );
      vent.position.set(0, 3.32, -0.6 + i);
      this.group.add(vent);
    }
  }

  // ==========================================
  // 5. 金龍車頭、鍍鉻水箱罩與 LED 看板 (Front Face)
  // ==========================================
  buildFrontFace() {
    const halfL = this.length / 2;

    // 前保險桿 (Black Bumper)
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + 0.02, 0.48, 0.38),
      this.matMatteBlack
    );
    frontBumper.position.set(0, 0.45, halfL + 0.08);
    this.group.add(frontBumper);

    // 台灣綠底白字車牌 (Taiwan Bus License Plate: 812-U9)
    this.buildLicensePlate(0, 0.38, halfL + 0.28, false);

    // KL6112U1 車頭橫柵與金龍廠徽
    for (let i = 0; i < 3; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.045, 0.07),
        this.matChrome
      );
      bar.position.set(0, 0.82 + i * 0.095, halfL + 0.08);
      this.group.add(bar);
    }

    // 金龍立體廠徽 (Kinglong Chrome Emblem)
    const emblem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24),
      this.matChrome
    );
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 1.18, halfL + 0.08);
    this.group.add(emblem);

    // 大曲面透明前擋風玻璃 (Windshield)
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(2.36, 1.45),
      this.matWindshield
    );
    windshield.position.set(0, 1.95, halfL + 0.06);
    this.group.add(windshield);

    // 陶瓷黑網點邊框 (Black border mask)
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.1), this.matGlossBlack);
    frameTop.position.set(0, 2.7, halfL + 0.06);
    this.group.add(frameTop);

    // 雨刷組 (Heavy duty dual wipers)
    for (let x of [-0.65, 0.35]) {
      const wiperArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.72, 0.02),
        this.matGlossBlack
      );
      wiperArm.rotation.z = -0.32;
      wiperArm.position.set(x, 1.6, halfL + 0.09);
      this.group.add(wiperArm);
    }

    // 車頭頂部發光 LED 路線看板
    this.buildFrontLed();
  }

  buildFrontLed() {
    this.ledCanvas = document.createElement('canvas');
    this.ledCanvas.width = 512;
    this.ledCanvas.height = 128;
    this.ledCtx = this.ledCanvas.getContext('2d');
    this.ledTexture = new THREE.CanvasTexture(this.ledCanvas);

    const ledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.44),
      new THREE.MeshBasicMaterial({ map: this.ledTexture })
    );
    ledScreen.position.set(0, 2.9, this.length / 2 + 0.08);
    this.group.add(ledScreen);

    this.updateLedDisplay('81 統聯轉運站 太原六號橋');
  }

  updateLedDisplay(text) {
    if (!this.ledCtx) return;
    const ctx = this.ledCtx;
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, 512, 128);

    // 琥珀色發光 LED 點陣字 (Glowing Amber LED)
    ctx.fillStyle = '#ff9900';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 14;

    ctx.font = 'bold 58px monospace';
    ctx.fillText('81', 16, 88);

    ctx.font = 'bold 36px "Noto Sans TC", sans-serif';
    ctx.fillText(text.replace('81', '').trim(), 105, 84);

    this.ledTexture.needsUpdate = true;
  }

  // 台灣營業大客車綠底白字車牌 (Taiwan Commercial Bus Plate)
  buildLicensePlate(x, y, z, isRear = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f5b28'; // 營業大客車專用綠底
    ctx.fillRect(0, 0, 256, 128);

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(6, 6, 244, 116);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('812-U9', 128, 86);

    const texture = new THREE.CanvasTexture(canvas);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.25),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    plate.position.set(x, y, z);
    if (isRear) plate.rotation.y = Math.PI;
    this.group.add(plate);
  }

  // ==========================================
  // 6. 車尾外觀 (Rear Face)
  // ==========================================
  buildRearFace() {
    const halfL = this.length / 2;

    const rearBumper = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + 0.02, 0.48, 0.38),
      this.matMatteBlack
    );
    rearBumper.position.set(0, 0.45, -halfL - 0.08);
    this.group.add(rearBumper);

    // 車尾車牌
    this.buildLicensePlate(0, 0.42, -halfL - 0.28, true);

    // 後擋風透明玻璃
    const rearWin = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.95),
      this.matSideGlass
    );
    rearWin.rotation.y = Math.PI;
    rearWin.position.set(0, 2.0, -halfL - 0.06);
    this.group.add(rearWin);

    // 車尾小型 LED 路線牌 (只顯示 81)
    const rearLed = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.32),
      new THREE.MeshBasicMaterial({ map: this.ledTexture })
    );
    rearLed.rotation.y = Math.PI;
    rearLed.position.set(0, 2.85, -halfL - 0.06);
    this.group.add(rearLed);
  }

  // ==========================================
  // 7. 右側開門機構 (Front Folding & Middle Sliding Doors)
  // ==========================================
  buildDoors() {
    const halfW = this.width / 2;

    // A. 右前門 (前門折疊內推門，z = 5.0)
    this.frontDoorPivot = new THREE.Group();
    this.frontDoorPivot.position.set(halfW, 1.45, 5.0);

    const fLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.9, 0.48),
      this.matSideGlass
    );
    fLeaf.position.z = -0.24;
    this.frontDoorPivot.add(fLeaf);
    this.group.add(this.frontDoorPivot);

    // B. 右中門 (中央低底盤雙開外滑門，z = -0.4)
    this.midDoorLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.9, 0.58),
      this.matSideGlass
    );
    this.midDoorLeft.position.set(halfW, 1.45, -0.15);
    this.group.add(this.midDoorLeft);

    this.midDoorRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.9, 0.58),
      this.matSideGlass
    );
    this.midDoorRight.position.set(halfW, 1.45, -0.75);
    this.group.add(this.midDoorRight);
  }

  // ==========================================
  // 8. 車輪總成 (10-Lug Alloy Rims & Radial Tires)
  // ==========================================
  buildWheels() {
    const r = 0.5;
    const w = 0.32;
    const halfW = this.width / 2;

    const makeWheel = (isDual = false) => {
      const g = new THREE.Group();
      // 輪胎本體
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, w * (isDual ? 1.8 : 1), 28),
        this.matTire
      );
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      g.add(tire);

      // 鋁合金輪圈
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.58, r * 0.58, w * (isDual ? 1.82 : 1.02), 20),
        this.matRim
      );
      rim.rotation.z = Math.PI / 2;
      g.add(rim);

      // 鍍鉻中心輪轂蓋
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, w * (isDual ? 1.86 : 1.06), 16),
        this.matChrome
      );
      hub.rotation.z = Math.PI / 2;
      g.add(hub);

      return g;
    };

    // 前輪 (具備轉向樞軸)
    this.frontLeftWheelPivot = new THREE.Group();
    this.frontLeftWheelPivot.position.set(-halfW + 0.16, r, 3.6);
    this.frontLeftWheel = makeWheel(false);
    this.frontLeftWheelPivot.add(this.frontLeftWheel);
    this.group.add(this.frontLeftWheelPivot);

    this.frontRightWheelPivot = new THREE.Group();
    this.frontRightWheelPivot.position.set(halfW - 0.16, r, 3.6);
    this.frontRightWheel = makeWheel(false);
    this.frontRightWheelPivot.add(this.frontRightWheel);
    this.group.add(this.frontRightWheelPivot);

    // 後輪 (雙輪固定驅動軸)
    this.rearLeftWheel = makeWheel(true);
    this.rearLeftWheel.position.set(-halfW + 0.1, r, -2.4);
    this.group.add(this.rearLeftWheel);

    this.rearRightWheel = makeWheel(true);
    this.rearRightWheel.position.set(halfW - 0.1, r, -2.4);
    this.group.add(this.rearRightWheel);
  }

  // ==========================================
  // 9. 台灣標準左駕駕駛艙 (Left-Hand Drive Cockpit)
  // 司機在左 (x = -0.75)，投幣箱與刷卡機在右 (x = -0.1 ~ +0.3)
  // ==========================================
  buildLeftHandDriveCockpit() {
    const driverX = -0.75; // 台灣左駕位置

    // A. 駕駛艙專屬高背氣壓懸吊座椅
    const seatGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), this.matMatteBlack);
    base.position.y = 0.65;
    seatGroup.add(base);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.75, 0.12), this.matMatteBlack);
    backrest.position.set(0, 1.15, -0.22);
    seatGroup.add(backrest);

    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), this.matMatteBlack);
    headrest.position.set(0, 1.6, -0.22);
    seatGroup.add(headrest);

    seatGroup.position.set(driverX, 0, 4.3);
    this.group.add(seatGroup);

    // B. 金龍弧形駕駛座儀表台 (Slanted Instrument Console)
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.68, 0.75),
      this.matMatteBlack
    );
    dash.position.set(driverX, 0.88, 5.05);
    this.group.add(dash);

    // 儀表板雙圓表盤 (時速表與轉速表貼圖)
    this.buildInstrumentCluster(driverX, 1.05, 4.95);
    this.buildAirPressureGauges(driverX, 1.05, 4.62);
    this.buildManualGearConsole(driverX - 0.22, 0.95, 4.18);
    this.buildDriverSwitchPanel(driverX + 0.48, 1.08, 4.78);
    this.buildDriverPedals(driverX, 0.52, 4.98);

    // C. 大客車 45 度傾斜方向盤 (Steering Wheel)
    this.steeringWheel = new THREE.Group();

    // 外圈
    const wheelRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.024, 12, 32),
      this.matWood
    );
    this.steeringWheel.add(wheelRim);

    // 雙輻條與中心金龍喇叭蓋
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.02), this.matGlossBlack);
    this.steeringWheel.add(spoke);

    const centerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), this.matChrome);
    centerHub.rotation.x = Math.PI / 2;
    this.steeringWheel.add(centerHub);

    this.steeringWheel.rotation.x = Math.PI / 3.8;
    this.steeringWheel.position.set(driverX, 1.12, 4.78);
    this.group.add(this.steeringWheel);

    // D. 台灣大巴經典「黃色大香菇氣壓手煞車手柄」(Yellow Mushroom Parking Brake Valve)
    const pbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), this.matMatteBlack);
    pbBase.position.set(driverX + 0.38, 0.95, 4.5);
    this.group.add(pbBase);

    this.parkingBrakeValve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.03, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 })
    );
    this.parkingBrakeValve.position.set(driverX + 0.38, 1.02, 4.5);
    this.group.add(this.parkingBrakeValve);

    // E. 司機右側不鏽鋼投幣箱 (Stainless Steel Fare Coin Box)
    const coinBox = new THREE.Group();
    const boxBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.65, 0.35),
      this.matSteel
    );
    boxBody.position.y = 0.72;
    coinBox.add(boxBody);

    // 投幣透明壓克力觀察窗
    const coinGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.02),
      this.matWindshield
    );
    coinGlass.position.set(0, 0.92, 0.18);
    coinBox.add(coinGlass);

    coinBox.position.set(-0.15, 0, 4.6);
    this.group.add(coinBox);

    // F. 寶錄電子 (Baolu) IC 卡刷卡機 (面對上車乘客右側)
    this.buildBaoluCardReader();

    // G. 駕駛安全壓克力透明防護板
    const partition = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 1.5, 1.4),
      this.matWindshield
    );
    partition.position.set(-0.35, 1.35, 4.1);
    this.group.add(partition);
  }

  buildAirPressureGauges(x, y, z) {
    const gaugeMaterial = new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.35,
      metalness: 0.25
    });
    const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xeceff1 });

    for (const offset of [-0.17, 0.17]) {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 16), gaugeMaterial);
      housing.rotation.x = Math.PI / 2;
      housing.position.set(x + offset, y, z);
      this.group.add(housing);

      const face = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), faceMaterial);
      face.position.set(x + offset, y, z + 0.02);
      face.rotation.x = -Math.PI / 2;
      this.group.add(face);
    }
  }

  buildManualGearConsole(x, y, z) {
    const console = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 0.34),
      this.matMatteBlack
    );
    console.position.set(x, y, z);
    this.group.add(console);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8),
      this.matChrome
    );
    shaft.position.set(x, y + 0.14, z);
    this.group.add(shaft);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.25 })
    );
    knob.position.set(x, y + 0.27, z);
    this.group.add(knob);
  }

  buildDriverSwitchPanel(x, y, z) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.16, 0.5),
      this.matGlossBlack
    );
    panel.rotation.x = -Math.PI / 5;
    panel.position.set(x, y, z);
    this.group.add(panel);

    for (let index = 0; index < 4; index += 1) {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.025, 0.06),
        new THREE.MeshStandardMaterial({
          color: index === 0 ? 0xffc107 : index === 1 ? 0x43a047 : 0x607d8b,
          emissive: index === 0 ? 0x4a2500 : 0x000000
        })
      );
      button.position.set(x - 0.1 + (index % 2) * 0.2, y + 0.08, z - 0.14 + Math.floor(index / 2) * 0.28);
      this.group.add(button);
    }
  }

  buildDriverPedals(x, y, z) {
    const pedalMaterial = new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.7 });
    for (let index = -1; index <= 1; index += 1) {
      const pedal = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.2, 0.035),
        pedalMaterial
      );
      pedal.rotation.x = -Math.PI / 8;
      pedal.position.set(x + index * 0.14, y, z);
      this.group.add(pedal);
    }
  }

  // 繪製擬真儀表板表盤 (Speedometer & Gauges)
  buildInstrumentCluster(x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, 256, 128);

    // 左表：時速表 (0-100 km/h)
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 48, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('km/h', 64, 90);

    // 右表：引擎轉速表 (0-3000 RPM)
    ctx.strokeStyle = '#ff9100';
    ctx.beginPath();
    ctx.arc(192, 64, 48, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    ctx.fillText('RPM', 192, 90);

    const texture = new THREE.CanvasTexture(canvas);
    const cluster = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.25),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    cluster.rotation.x = -Math.PI / 4;
    cluster.position.set(x, y, z);
    this.group.add(cluster);
  }

  // ==========================================
  // 10. 寶錄電子 (Baolu) 悠遊卡/一卡通刷卡機 (Facing Passengers)
  // ==========================================
  buildBaoluCardReader() {
    const g = new THREE.Group();

    // 刷卡機金屬深灰本體
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.35, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.4 })
    );
    g.add(body);

    // 藍綠色感應板 (EasyCard / iPASS Tap Plate)
    const sensor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x00897b })
    );
    sensor.position.set(0, -0.07, 0.075);
    g.add(sensor);

    // 綠色背光液晶熒幕 (Green LCD Screen)
    this.cardReaderScreenCanvas = document.createElement('canvas');
    this.cardReaderScreenCanvas.width = 256;
    this.cardReaderScreenCanvas.height = 128;
    this.cardReaderScreenCtx = this.cardReaderScreenCanvas.getContext('2d');
    this.cardReaderScreenTexture = new THREE.CanvasTexture(this.cardReaderScreenCanvas);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.09),
      new THREE.MeshBasicMaterial({ map: this.cardReaderScreenTexture })
    );
    screen.position.set(0, 0.09, 0.075);
    g.add(screen);

    // 固定在右前上車立柱 (Facing the entrance door)
    g.position.set(0.65, 1.25, 4.2);
    g.rotation.y = -Math.PI / 4;
    this.group.add(g);

    this.updateCardReaderScreen('歡迎搭乘 81', '上下車請刷卡');
  }

  updateCardReaderScreen(line1, line2, isHighlight = false) {
    if (!this.cardReaderScreenCtx) return;
    const ctx = this.cardReaderScreenCtx;

    ctx.fillStyle = isHighlight ? '#00e676' : '#26a69a';
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = '#0f2015';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(line1, 128, 48);

    ctx.font = 'bold 24px monospace';
    ctx.fillText(line2, 128, 96);

    this.cardReaderScreenTexture.needsUpdate = true;
  }

  // ==========================================
  // 11. 客艙內裝、座椅、拉環與紅色下車鈴
  // ==========================================
  buildInteriorPassengers() {
    // 黃色安全立柱與下車鈴
    for (let z = 3.6; z >= -4.5; z -= 1.8) {
      const poleGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.2, 8);
      const poleL = new THREE.Mesh(poleGeo, this.matYellowPole);
      poleL.position.set(-0.55, 1.55, z);
      this.group.add(poleL);

      const poleR = new THREE.Mesh(poleGeo, this.matYellowPole);
      poleR.position.set(0.55, 1.55, z);
      this.group.add(poleR);

      // 立柱上的紅色下車鈴
      this.buildStopBell(-0.55, 1.45, z + 0.03);
      this.buildStopBell(0.55, 1.45, z + 0.03);
    }

    // 車頂橫向黃色長扶手與三角拉環 (Hand Straps)
    for (const x of [-0.55, 0.55]) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, this.length - 2.0, 8),
        this.matYellowPole
      );
      bar.rotation.x = Math.PI / 2;
      bar.position.set(x, 2.5, 0);
      this.group.add(bar);

      // 三角拉環
      for (let z = 3.0; z >= -4.0; z -= 1.2) {
        this.buildHandStrap(x, 2.45, z);
      }
    }

    // 乘客座椅 (博愛座與一般座)
    this.buildPassengerSeats();

    // 車內車頂 LED 到站顯示屏
    this.buildInteriorLedSign();
  }

  buildHandStrap(x, y, z) {
    const strap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6),
      this.matYellowPole
    );
    strap.position.set(x, y - 0.11, z);
    this.group.add(strap);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.012, 6, 12),
      this.matWhite
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y - 0.26, z);
    this.group.add(ring);
  }

  buildStopBell(x, y, z) {
    const g = new THREE.Group();

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.12, 0.04),
      this.matBellHousing
    );
    g.add(housing);

    const button = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.07, 0.02),
      this.matBellButton.clone()
    );
    button.position.z = 0.022;
    g.add(button);

    g.position.set(x, y, z);
    this.group.add(g);
    this.stopBells.push(button);
  }

  setStopBellLight(active) {
    this.stopBellActive = active;
    for (const b of this.stopBells) {
      if (active) {
        b.material.emissive.setHex(0xff1744);
        b.material.color.setHex(0xff5252);
      } else {
        b.material.emissive.setHex(0x000000);
        b.material.color.setHex(0xff3b30);
      }
    }
  }

  buildPassengerSeats() {
    const seatGeo = new THREE.BoxGeometry(0.48, 0.48, 0.45);
    const backGeo = new THREE.BoxGeometry(0.48, 0.62, 0.08);

    const makeSeat = (x, y, z, isPriority = false) => {
      const g = new THREE.Group();
      const mat = isPriority ? this.matPrioritySeat : this.matSeat;

      const base = new THREE.Mesh(seatGeo, mat);
      base.position.y = 0.24;
      g.add(base);

      const back = new THREE.Mesh(backGeo, mat);
      back.position.set(0, 0.65, -0.2);
      g.add(back);

      g.position.set(x, y, z);
      return g;
    };

    // 前半部博愛座
    this.group.add(makeSeat(-0.85, 0.5, 3.0, true));
    this.group.add(makeSeat(-0.85, 0.5, 2.0, true));

    // 一般座位
    for (let z = 0.8; z >= -4.5; z -= 1.1) {
      this.group.add(makeSeat(-0.85, 0.5, z, false));
      this.group.add(makeSeat(0.85, 0.5, z, false));
    }
  }

  buildInteriorLedSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    this.intLedCtx = canvas.getContext('2d');
    this.intLedTexture = new THREE.CanvasTexture(canvas);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.22),
      new THREE.MeshBasicMaterial({ map: this.intLedTexture })
    );
    screen.position.set(0, 2.65, 4.3);
    this.group.add(screen);

    this.updateInteriorLed('下一站：草悟道 (市民廣場)');
  }

  updateInteriorLed(text) {
    if (!this.intLedCtx) return;
    const ctx = this.intLedCtx;
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, 512, 96);

    ctx.fillStyle = '#ff3b30';
    ctx.shadowColor = '#ff5252';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 38px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 62);

    this.intLedTexture.needsUpdate = true;
  }

  // ==========================================
  // 12. 車燈與後視鏡 (Lights & Mirrors)
  // ==========================================
  buildLights() {
    // 雙頭燈 (Headlights with projectors)
    this.headlightL = new THREE.SpotLight(0xfffaed, 3.0, 40, Math.PI / 5.5, 0.4);
    this.headlightL.position.set(-0.85, 0.9, this.length / 2 + 0.1);
    this.headlightL.target.position.set(-0.85, 0, this.length / 2 + 25);
    this.group.add(this.headlightL);
    this.group.add(this.headlightL.target);

    this.headlightR = new THREE.SpotLight(0xfffaed, 3.0, 40, Math.PI / 5.5, 0.4);
    this.headlightR.position.set(0.85, 0.9, this.length / 2 + 0.1);
    this.headlightR.target.position.set(0.85, 0, this.length / 2 + 25);
    this.group.add(this.headlightR);
    this.group.add(this.headlightR.target);

    // 車尾垂直三色尾燈 (Taillights: Amber turn, Red brake, White reverse)
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0x990000 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.05), this.taillightMat);
    tailL.position.set(-0.95, 1.15, -this.length / 2 - 0.08);
    this.group.add(tailL);

    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.05), this.taillightMat);
    tailR.position.set(0.95, 1.15, -this.length / 2 - 0.08);
    this.group.add(tailR);
  }

  buildMirrors() {
    // 左側駕駛鏡 (Left Driver Mirror)
    const mirrorL = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.38, 0.08),
      this.matGlossBlack
    );
    mirrorL.position.set(-this.width / 2 - 0.22, 2.1, 5.3);
    this.group.add(mirrorL);

    // 右側台灣經典兔耳照地鏡 (Right Rabbit-ear Mirror)
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8),
      this.matGlossBlack
    );
    arm.rotation.z = -Math.PI / 4;
    arm.position.set(this.width / 2 + 0.32, 2.6, 5.3);
    this.group.add(arm);

    const mirrorR = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.48, 0.08),
      this.matGlossBlack
    );
    mirrorR.position.set(this.width / 2 + 0.58, 2.3, 5.6);
    this.group.add(mirrorR);
  }

  // ==========================================
  // 動態更新 (Update loop)
  // ==========================================
  update(delta, speed, steerAngle, isBraking) {
    const wheelRotSpeed = (speed / 0.5) * delta;
    if (this.frontLeftWheel) this.frontLeftWheel.rotation.x += wheelRotSpeed;
    if (this.frontRightWheel) this.frontRightWheel.rotation.x += wheelRotSpeed;
    if (this.rearLeftWheel) this.rearLeftWheel.rotation.x += wheelRotSpeed;
    if (this.rearRightWheel) this.rearRightWheel.rotation.x += wheelRotSpeed;

    if (this.frontLeftWheelPivot) this.frontLeftWheelPivot.rotation.y = steerAngle;
    if (this.frontRightWheelPivot) this.frontRightWheelPivot.rotation.y = steerAngle;

    // 方向盤隨動旋轉
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -steerAngle * 2.8;
    }

    // 車門平滑氣動開關
    const doorSpeed = delta * 2.5;
    if (this.frontDoorOpen && this.frontDoorProgress < 1.0) {
      this.frontDoorProgress = Math.min(1.0, this.frontDoorProgress + doorSpeed);
    } else if (!this.frontDoorOpen && this.frontDoorProgress > 0.0) {
      this.frontDoorProgress = Math.max(0.0, this.frontDoorProgress - doorSpeed);
    }

    if (this.middleDoorOpen && this.middleDoorProgress < 1.0) {
      this.middleDoorProgress = Math.min(1.0, this.middleDoorProgress + doorSpeed);
    } else if (!this.middleDoorOpen && this.middleDoorProgress > 0.0) {
      this.middleDoorProgress = Math.max(0.0, this.middleDoorProgress - doorSpeed);
    }

    if (this.frontDoorPivot) {
      this.frontDoorPivot.rotation.y = this.frontDoorProgress * (Math.PI / 2.2);
    }

    if (this.midDoorLeft && this.midDoorRight) {
      this.midDoorLeft.position.z = -0.15 + this.middleDoorProgress * 0.45;
      this.midDoorRight.position.z = -0.75 - this.middleDoorProgress * 0.45;
    }

    if (this.taillightMat) {
      this.taillightMat.color.setHex(isBraking ? 0xff0000 : 0x990000);
    }
  }

  toggleFrontDoor() {
    this.frontDoorOpen = !this.frontDoorOpen;
    return this.frontDoorOpen;
  }

  toggleMiddleDoor() {
    this.middleDoorOpen = !this.middleDoorOpen;
    return this.middleDoorOpen;
  }
}
