/**
 * Taiwan Bus 81 - Taichung Streetscape & Route Map (Three.js)
 * Recreates iconic Taiwanese street features along Route 81:
 * 1. 公益路、臺灣大道寬闊路網 (Multi-lane boulevard)
 * 2. 台灣標準道路標線：雙黃實線、公車停靠區 (BUS STOP)、機車停等區 (Yellow box)
 * 3. 台灣小綠人行人紅綠燈 (Taiwan Animated Pedestrian Signals)
 * 4. 台中市獨立智慧型公車站牌 (Taichung Smart Bus Stops with real-time LED)
 * 5. 台灣特色騎樓建築、霓虹招牌 (7-ELEVEN, 全家, 珍奶店, 太陽餅)
 * 6. 81 路固定站序的全站停靠判定；一般站使用低負載站牌，大站使用候車亭
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { classifyStop } from './route-stop.mjs';

const ROUTE_STOP_NAMES = [
  '統聯轉運站(站內)', '福安里(臺灣大道)', '朝馬2(臺灣大道)', '黎明環河路口',
  '西屯區公所', '黎明龍門路口', '黎明市政路口', '黎明國小', '黎明新村(黎明路)',
  '黎明大業路口', '惠文國小', '惠文高中(公益路)', '臺中特殊教育學校',
  '公益文心路口', '公益大墩路口', '公益東興路口', '公益精誠路口',
  '公益公園(公益路)', '公益中美街口', '草悟道(市民廣場)', '公益臺灣大道口',
  '茄苳腳(專用道)', '中央市場', '五權公園路口(光大社區)', '光大里', '五常里',
  '五權學士路口', '莒光新城', '臺灣體大體育場', '臺中一中', '臺灣體大游泳池',
  '臺中公園(雙十路)', '干城站', '臺中車站(C月台)', '復興公園東路口',
  '自由富台東街口', '自由進德路口', '中國醫東區分院', '進德國小', '精武進化路口',
  '精武車站(精武路)', '新福里(中山路)', '新福里(新福路)', '新光里(新福路)',
  '新福振武路口', '新光國小', '新光國中', '新興樹德路口', '育賢立功路口',
  '育賢建和路口', '樹孝太順路口', '太順育德路口', '太原六號橋(太原路)'
];

const ROUTE_START_Z = 40;
const ROUTE_END_Z = -950;

const ROUTE_SEGMENTS = [
  { from: 0, to: 2, road: '臺灣大道', district: '西屯區' },
  { from: 3, to: 11, road: '黎明路', district: '南屯區' },
  { from: 12, to: 20, road: '公益路', district: '西區' },
  { from: 21, to: 28, road: '五權路', district: '北區' },
  { from: 29, to: 33, road: '雙十路／臺灣大道', district: '中區' },
  { from: 34, to: 39, road: '復興路／進化路', district: '東區' },
  { from: 40, to: 47, road: '中山路／新福路', district: '太平區' },
  { from: 48, to: 52, road: '育賢路／太原路', district: '太平區' }
];

export const STATIONS = ROUTE_STOP_NAMES.map((name, id) => ({
  ...classifyStop(name),
  id,
  name,
  enName: name,
  posZ: ROUTE_START_Z + (ROUTE_END_Z - ROUTE_START_Z) * (id / (ROUTE_STOP_NAMES.length - 1)),
  info: id === 0
    ? '起點站 - 統聯轉運站(站內)'
    : id === ROUTE_STOP_NAMES.length - 1
      ? '終點站 - 太原六號橋(太原路)'
      : `第 ${id + 1} 站 - 81 路固定站序`
}));

export class TaichungCity {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Map bounds
    this.roadWidth = 18.0; // 4 車道 + 兩側機慢車道
    this.roadLength = 1200.0;

    this.busStops = [];
    this.trafficLights = [];

    this.build();
    this.scene.add(this.group);
  }

  build() {
    this.createMaterials();
    this.buildRoadsAndMarkings();
    this.buildBusStations();
    this.buildArcadeBuildings();
    this.buildStreetFurniture();
    this.buildRouteIdentitySigns();
  }

  createMaterials() {
    // 瀝青路面 (Asphalt)
    this.matRoad = new THREE.MeshStandardMaterial({
      color: 0x242629,
      roughness: 0.85
    });

    // 騎樓人行道 (Sidewalk Tile)
    this.matSidewalk = new THREE.MeshStandardMaterial({
      color: 0x8d8d8d,
      roughness: 0.7
    });

    // 黃色標線 (Double Yellow Line & Motorcycle Box)
    this.matYellowMarking = new THREE.MeshBasicMaterial({
      color: 0xffcc00
    });

    // 白色標線 (White Lane Dividers & Bus Bay)
    this.matWhiteMarking = new THREE.MeshBasicMaterial({
      color: 0xf0f0f0
    });

    // 公車停靠專用標示 (Red Curb)
    this.matRedCurb = new THREE.MeshBasicMaterial({
      color: 0xd32f2f
    });
  }

  // ==========================================
  // 道路與台灣經典標線
  // ==========================================
  buildRoadsAndMarkings() {
    // 1. 主幹道柏油路
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.matRoad);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -450);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // 2. 兩側人行道與騎樓走廊 (Sidewalks)
    const sidewalkWidth = 6.0;
    const swGeo = new THREE.BoxGeometry(sidewalkWidth, 0.2, this.roadLength);

    const swLeft = new THREE.Mesh(swGeo, this.matSidewalk);
    swLeft.position.set(-this.roadWidth / 2 - sidewalkWidth / 2, 0.1, -450);
    this.group.add(swLeft);

    const swRight = new THREE.Mesh(swGeo, this.matSidewalk);
    swRight.position.set(this.roadWidth / 2 + sidewalkWidth / 2, 0.1, -450);
    this.group.add(swRight);

    // 3. 雙黃實線 (中央分向限制線)
    for (let offset of [-0.12, 0.12]) {
      const yellowLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, this.roadLength),
        this.matYellowMarking
      );
      yellowLine.rotation.x = -Math.PI / 2;
      yellowLine.position.set(offset, 0.01, -450);
      this.group.add(yellowLine);
    }

    // 4. 車道虛線 (White dashed lines)
    for (let x of [-4.5, 4.5]) {
      for (let z = 100; z >= -1050; z -= 8) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.15, 4.0),
          this.matWhiteMarking
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, z);
        this.group.add(dash);
      }
    }

    // 5. 十字路口與機車停等區 (Yellow Motorcycle Box)
    const intersectionZs = [-100, -320, -560, -820];
    for (const z of intersectionZs) {
      this.buildIntersection(z);
    }
  }

  // ==========================================
  // 十字路口：斑馬線、機車停等區、小綠人
  // ==========================================
  buildIntersection(z) {
    // 斑馬線 (Zebra Crossing)
    for (let x = -this.roadWidth / 2 + 1; x <= this.roadWidth / 2 - 1; x += 1.2) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 4.0),
        this.matWhiteMarking
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.012, z);
      this.group.add(stripe);
    }

    // 台灣招牌：黃色機車停等區 (Motorcycle Waiting Box)
    // 位於停止線與斑馬線之間
    const boxOutline = new THREE.Mesh(
      new THREE.PlaneGeometry(7.0, 3.5),
      this.matYellowMarking
    );
    boxOutline.rotation.x = -Math.PI / 2;
    boxOutline.position.set(4.5, 0.013, z + 4.5);
    this.group.add(boxOutline);

    const boxInner = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 3.1),
      this.matRoad
    );
    boxInner.rotation.x = -Math.PI / 2;
    boxInner.position.set(4.5, 0.014, z + 4.5);
    this.group.add(boxInner);

    // 小綠人行人號誌 (Pedestrian Light)
    this.buildPedestrianLight(this.roadWidth / 2 + 0.8, z + 2.5);
  }

  buildPedestrianLight(x, z) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    post.position.set(x, 1.6, z);
    this.group.add(post);

    // 號誌箱
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    box.position.set(x - 0.1, 2.7, z);
    this.group.add(box);

    // 小綠人發光屏 (Green Walking Man)
    const greenLight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x00e676 })
    );
    greenLight.rotation.y = -Math.PI / 2;
    greenLight.position.set(x - 0.21, 2.55, z);
    this.group.add(greenLight);

    // 紅燈小紅人
    const redLight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x330000 })
    );
    redLight.rotation.y = -Math.PI / 2;
    redLight.position.set(x - 0.21, 2.85, z);
    this.group.add(redLight);
  }

  // ==========================================
  // 台中 81路固定站序：一般站牌低負載化，大站保留候車亭
  // ==========================================
  buildBusStations() {
    for (const station of STATIONS) {
      if (station.type === 'ordinary') {
        this.buildOrdinaryStopMarker(station);
      } else {
        this.buildSingleStation(station);
      }
    }
  }

  buildOrdinaryStopMarker(station) {
    const x = this.roadWidth / 2 + 1.2;
    const marker = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.55 })
    );
    pole.position.y = 1.25;
    marker.add(pole);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.62, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.35 })
    );
    sign.position.set(0, 2.45, 0);
    marker.add(sign);
    marker.position.set(x, 0, station.posZ + 5.0);
    this.group.add(marker);
  }

  buildSingleStation(station) {
    const x = this.roadWidth / 2 + 1.2;
    const z = station.posZ;

    // 1. 路面「公車停靠區」白線框與紅色禁停標線
    const bayGeo = new THREE.PlaneGeometry(3.0, 14.0);
    const bayOutline = new THREE.Mesh(bayGeo, this.matWhiteMarking);
    bayOutline.rotation.x = -Math.PI / 2;
    bayOutline.position.set(this.roadWidth / 2 - 1.5, 0.015, z);
    this.group.add(bayOutline);

    const bayInner = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 13.6),
      this.matRoad
    );
    bayInner.rotation.x = -Math.PI / 2;
    bayInner.position.set(this.roadWidth / 2 - 1.5, 0.016, z);
    this.group.add(bayInner);

    // 路面彩繪「公車停靠區」字樣
    const bayTextCanvas = document.createElement('canvas');
    bayTextCanvas.width = 256;
    bayTextCanvas.height = 1024;
    const bCtx = bayTextCanvas.getContext('2d');
    bCtx.fillStyle = 'rgba(0,0,0,0)';
    bCtx.fillRect(0, 0, 256, 1024);

    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 96px "Noto Sans TC", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('公', 128, 200);
    bCtx.fillText('車', 128, 420);
    bCtx.fillText('停', 128, 640);
    bCtx.fillText('靠', 128, 860);

    const bayTextTex = new THREE.CanvasTexture(bayTextCanvas);
    const bayText = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 9.0),
      new THREE.MeshBasicMaterial({ map: bayTextTex, transparent: true })
    );
    bayText.rotation.x = -Math.PI / 2;
    bayText.position.set(this.roadWidth / 2 - 1.5, 0.018, z);
    this.group.add(bayText);

    // 2. 台中市獨立智慧型公車站牌 (Taichung Smart Bus Stop Pole)
    const signGroup = new THREE.Group();

    // 站牌柱身
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x0088cc, roughness: 0.4 })
    );
    pole.position.y = 1.6;
    signGroup.add(pole);

    // 頂部圓盤「台中市公車」
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.06, 24),
      new THREE.MeshStandardMaterial({ color: 0xffcc00 })
    );
    disk.rotation.z = Math.PI / 2;
    disk.position.y = 3.2;
    signGroup.add(disk);

    // 站牌 LED 動態到站資訊螢幕
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#111';
    sCtx.fillRect(0, 0, 256, 256);

    sCtx.fillStyle = '#ffaa00';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('81 統聯客運', 128, 60);

    sCtx.fillStyle = '#00ff66';
    sCtx.font = 'bold 30px "Noto Sans TC", sans-serif';
    sCtx.fillText(station.name, 128, 120);

    sCtx.fillStyle = '#ff3333';
    sCtx.font = 'bold 32px sans-serif';
    sCtx.fillText('即將進站', 128, 190);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signScreen.rotation.y = -Math.PI / 2;
    signScreen.position.set(-0.16, 2.2, 0);
    signGroup.add(signScreen);

    signGroup.position.set(x, 0, z + 5.0);
    this.group.add(signGroup);

    // 3. 玻璃候車亭 (Shelter)
    const shelter = this.buildBusShelter();
    shelter.scale.setScalar(station.type === 'hub' ? 1.25 : station.type === 'major' ? 1.1 : 1);
    shelter.position.set(x + 1.2, 0, z);
    shelter.rotation.y = -Math.PI / 2;
    this.group.add(shelter);

    this.busStops.push({
      id: station.id,
      name: station.name,
      enName: station.enName,
      z: z,
      signGroup: signGroup
    });
  }

  buildBusShelter() {
    const shelter = new THREE.Group();

    // 頂棚
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 0.15, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.3 })
    );
    roof.position.set(0, 2.7, 0);
    shelter.add(roof);

    // 支柱
    for (let x of [-2.6, 2.6]) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.7, 8),
        new THREE.MeshStandardMaterial({ color: 0x263238 })
      );
      p.position.set(x, 1.35, -0.9);
      shelter.add(p);
    }

    // 後方玻璃擋風板
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 2.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x80deea,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1
      })
    );
    glass.position.set(0, 1.4, -0.9);
    shelter.add(glass);

    // 候車長椅
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.45, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.7 })
    );
    bench.position.set(0, 0.3, -0.5);
    shelter.add(bench);

    return shelter;
  }

  // ==========================================
  // 台灣特色建築與商圈店家招牌 (Arcade Buildings & Signs)
  // ==========================================
  buildArcadeBuildings() {
    const shops = [
      { name: '7-ELEVEN 統聯門市', color: '#ff6600', sub: '24H 咖啡 便當' },
      { name: '全家 FamilyMart', color: '#0088ff', sub: '霜淇淋 酷繽沙' },
      { name: '50嵐 珍珠奶茶', color: '#ffd600', sub: '波霸奶茶 綠茶' },
      { name: '台中太陽餅 百年老店', color: '#d32f2f', sub: '手工伴手禮 檸檬餅' },
      { name: '公益路 爌肉飯', color: '#e65100', sub: '二十年老店' },
      { name: '台灣中油 CPC', color: '#1565c0', sub: '甲種加油站' }
    ];

    let shopIdx = 0;
    for (let z = 60; z >= -1000; z -= 36) {
      const shop1 = shops[shopIdx % shops.length];
      const shop2 = shops[(shopIdx + 2) % shops.length];
      shopIdx++;

      // 右側建築 (乘客側)
      this.buildSingleBuilding(this.roadWidth / 2 + 10.0, z, false, shop1);
      // 左側建築 (對向車道側)
      this.buildSingleBuilding(-this.roadWidth / 2 - 10.0, z, true, shop2);
    }
  }

  buildSingleBuilding(x, z, isLeft, shop) {
    const bHeight = 12.0 + Math.random() * 8.0;
    const bWidth = 14.0;
    const bDepth = 30.0;

    // 主樓體
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(bWidth, bHeight, bDepth),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.1, 0.1, 0.4 + Math.random() * 0.2),
        roughness: 0.8
      })
    );
    building.position.set(x, bHeight / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.group.add(building);

    // 經典台灣懸掛直立式招牌 (Vertical Neon Signboard)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 128;
    signCanvas.height = 512;
    const sCtx = signCanvas.getContext('2d');

    sCtx.fillStyle = shop.color;
    sCtx.fillRect(0, 0, 128, 512);

    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 44px "Noto Sans TC", sans-serif';
    sCtx.textAlign = 'center';

    const chars = shop.name.split('');
    let cy = 70;
    for (const c of chars) {
      if (cy < 470) {
        sCtx.fillText(c, 64, cy);
        cy += 48;
      }
    }

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 5.0),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );

    const signX = isLeft ? x + bWidth / 2 + 0.9 : x - bWidth / 2 - 0.9;
    signMesh.position.set(signX, 6.0, z);
    this.group.add(signMesh);
  }

  // ==========================================
  // 街道細節：路燈、行道樹、停放的機車
  // ==========================================
  buildStreetFurniture() {
    // 兩側路燈與行道樹 (Trees & Street Lamps)
    for (let z = 60; z >= -1000; z -= 40) {
      // 路燈
      this.buildStreetLamp(this.roadWidth / 2 + 0.6, z);
      this.buildStreetLamp(-this.roadWidth / 2 - 0.6, z);

      // 行道樹 (台灣常見的小葉欖仁/欒樹)
      this.buildTree(this.roadWidth / 2 + 4.5, z + 15);
      this.buildTree(-this.roadWidth / 2 - 4.5, z + 15);
    }
  }

  buildRouteIdentitySigns() {
    for (const segment of ROUTE_SEGMENTS) {
      const station = STATIONS[Math.floor((segment.from + segment.to) / 2)];
      if (!station) continue;

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0c3d5a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Noto Sans TC", sans-serif';
      ctx.fillText(segment.road, 22, 48);
      ctx.font = '24px "Noto Sans TC", sans-serif';
      ctx.fillText(`81路｜${segment.district}`, 22, 92);

      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.6),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
      );
      sign.position.set(-this.roadWidth / 2 - 0.4, 4.2, station.posZ);
      sign.rotation.y = Math.PI / 2;
      this.group.add(sign);
    }
  }

  buildStreetLamp(x, z) {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    pole.position.y = 3.25;
    lamp.add(pole);

    const lightHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    lightHead.position.set(0, 6.4, 0.4);
    lamp.add(lightHead);

    lamp.position.set(x, 0, z);
    this.group.add(lamp);
  }

  buildTree(x, z) {
    const tree = new THREE.Group();

    // 樹幹
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 3.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 })
    );
    trunk.position.y = 1.5;
    tree.add(trunk);

    // 樹冠
    const foliage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8, 1),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 })
    );
    foliage.position.y = 3.8;
    foliage.castShadow = true;
    tree.add(foliage);

    tree.position.set(x, 0, z);
    this.group.add(tree);
  }
}
