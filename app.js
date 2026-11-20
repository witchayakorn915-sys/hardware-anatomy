import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================
   DOM REFS
   ============================================================ */
const viewport      = document.getElementById('viewport');
const deconSlider    = document.getElementById('decon-slider');
const deconValue     = document.getElementById('decon-value');
const layerListEl    = document.getElementById('layer-list');
const specSheetEl    = document.getElementById('spec-sheet');
const deviceTabsEl   = document.getElementById('device-tabs');
const vpDeviceName   = document.getElementById('vp-device-name');
const vpDeviceSub    = document.getElementById('vp-device-sub');
const hoverTip       = document.getElementById('hover-tip');
const inspEyebrow    = document.getElementById('inspector-eyebrow');
const inspName       = document.getElementById('inspector-name');
const inspMaterial   = document.getElementById('inspector-material');
const inspDesc       = document.getElementById('inspector-desc');
const inspHint       = document.getElementById('inspector-hint');
const btnTheme       = document.getElementById('btn-theme');

/* ============================================================
   THEME STATE
   ============================================================ */
const THEME_KEY = 'hw-anatomy-theme';
let themeKey = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

/* Scene-side theme definitions.
   Every value here is tuned per theme so the 3D stage matches the UI. */
const SCENE_THEME = {
  dark: {
    bg: 0x0c1119,
    fogNear: 14, fogFar: 34,
    gridCenter: 0x2a3448, gridLines: 0x1a2334,
    pad: 0x10141e,
    exposure: 1.15,
    ambient: { color: 0x8fa3c8, intensity: 0.55 },
    hemi:    { sky: 0xaecbe8, ground: 0x1a1a1f, intensity: 0.6 },
    key:     { color: 0xfff3e2, intensity: 1.9 },
    rim:     { color: 0x5fa8ff, intensity: 0.5 },
    fill:    { color: 0xdd9553, intensity: 0.25 },
    hoverHex: 0x5fe1cd, hoverIntensity: 0.35,
    selectHex: 0xdd9553, selectIntensity: 0.55
  },
  light: {
    bg: 0xf0f4fa,
    fogNear: 18, fogFar: 44,
    gridCenter: 0xb6c2d4, gridLines: 0xdbe2ed,
    pad: 0xe4eaf3,
    exposure: 1.0,
    ambient: { color: 0xffffff, intensity: 0.85 },
    hemi:    { sky: 0xffffff, ground: 0xd3dbe6, intensity: 0.95 },
    key:     { color: 0xffffff, intensity: 2.1 },
    rim:     { color: 0x7aa7ff, intensity: 0.4 },
    fill:    { color: 0xffcfa0, intensity: 0.35 },
    hoverHex: 0x14b8a6, hoverIntensity: 0.55,
    selectHex: 0xd97706, selectIntensity: 0.5
  }
};

/* ============================================================
   SCENE SETUP
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1119);
scene.fog = new THREE.Fog(0x0c1119, 14, 34);

const camera = new THREE.PerspectiveCamera(38, viewport.clientWidth / viewport.clientHeight, 0.05, 100);
camera.position.set(6, 3.4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 30;
controls.target.set(0, 0.3, 0);

const focusTarget = new THREE.Vector3(0, 0.3, 0);

/* ---- lights (kept in references so themes can retune them) ---- */
const ambientLight = new THREE.AmbientLight(0x8fa3c8, 0.55);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xaecbe8, 0x1a1a1f, 0.6);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff3e2, 1.9);
keyLight.position.set(5, 9, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x5fa8ff, 0.5);
rimLight.position.set(-6, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xdd9553, 0.25);
fillLight.position.set(-3, 2, 6);
scene.add(fillLight);

/* ---- ground / grid ---- */
let grid = null;

const padGeo = new THREE.CircleGeometry(10, 48);
const padMat = new THREE.MeshStandardMaterial({ color: 0x10141e, roughness: 1, metalness: 0 });
const pad = new THREE.Mesh(padGeo, padMat);
pad.rotation.x = -Math.PI / 2;
pad.receiveShadow = true;
scene.add(pad);

/* ============================================================
   THEME APPLICATION (3D)
   ============================================================ */
function rebuildGrid(t) {
  if (grid) {
    scene.remove(grid);
    grid.geometry.dispose();
    grid.material.dispose();
  }
  grid = new THREE.GridHelper(30, 30, t.gridCenter, t.gridLines);
  grid.position.y = currentData ? currentData.floorY : -5;
  scene.add(grid);
}

function applySceneTheme(key) {
  const t = SCENE_THEME[key];

  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.bg);
  scene.fog.near = t.fogNear;
  scene.fog.far = t.fogFar;

  renderer.toneMappingExposure = t.exposure;

  pad.material.color.setHex(t.pad);

  ambientLight.color.setHex(t.ambient.color);
  ambientLight.intensity = t.ambient.intensity;

  hemiLight.color.setHex(t.hemi.sky);
  hemiLight.groundColor.setHex(t.hemi.ground);
  hemiLight.intensity = t.hemi.intensity;

  keyLight.color.setHex(t.key.color);
  keyLight.intensity = t.key.intensity;

  rimLight.color.setHex(t.rim.color);
  rimLight.intensity = t.rim.intensity;

  fillLight.color.setHex(t.fill.color);
  fillLight.intensity = t.fill.intensity;

  rebuildGrid(t);
}

/* ============================================================
   BUILD HELPERS
   ============================================================ */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function stdMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, ...opts });
}

function newComponent(id, name, material, description) {
  return { id, name, material, description, parts: [], center: new THREE.Vector3() };
}

function addPart(comp, group, geometry, material, pos, explodeDir, rot) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos);
  if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.componentId = comp.id;
  group.add(mesh);
  const baseEmissiveHex = mesh.material.emissive ? mesh.material.emissive.getHex() : 0x000000;
  const baseEmissiveIntensity = mesh.material.emissiveIntensity !== undefined ? mesh.material.emissiveIntensity : 1;
  comp.parts.push({ mesh, basePos: pos.clone(), explodeDir: explodeDir.clone(), baseEmissiveHex, baseEmissiveIntensity });
  return mesh;
}

function finalizeComponent(comp, componentsMap, order) {
  const c = new THREE.Vector3();
  comp.parts.forEach(p => c.add(p.basePos));
  c.divideScalar(comp.parts.length);
  comp.center.copy(c);
  componentsMap[comp.id] = comp;
  order.push(comp.id);
}

function disposeGroup(group) {
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}

/* ============================================================
   DEVICE: SMARTPHONE
   ============================================================ */
function buildPhone() {
  const group = new THREE.Group();
  const components = {}; const order = [];

  const W = 2.4, D = 4.9, T = 0.9, n = 9;
  const step = T / n;
  const topY = T / 2;
  const yAt = i => topY - step * (i + 0.5);

  let c = newComponent('phone-glass', 'Front cover glass', 'Aluminosilicate glass',
    'Chemically strengthened glass fused to the display. It is the outermost layer and takes the brunt of drops and scratches.');
  addPart(c, group, new THREE.BoxGeometry(W, step * 0.9, D),
    new THREE.MeshPhysicalMaterial({ color: 0xdce8f2, transparent: true, opacity: 0.5, roughness: 0.05, transmission: 0.3 }),
    V3(0, yAt(0), 0), V3(0, 4.2, 0));
  finalizeComponent(c, components, order);

  c = newComponent('phone-oled', 'OLED display panel', 'Organic LED array',
    'Each sub-pixel emits its own light, so the panel can switch off individual pixels entirely for a true black.');
  addPart(c, group, new THREE.BoxGeometry(W * 0.96, step * 0.7, D * 0.97),
    stdMat(0x0a0d14, { emissive: 0x14304c, emissiveIntensity: 0.3, roughness: 0.4 }),
    V3(0, yAt(1), 0), V3(0, 3.2, 0));
  finalizeComponent(c, components, order);

  c = newComponent('phone-digitizer', 'Touch digitizer', 'Capacitive sensor mesh',
    'A grid of transparent electrodes senses the tiny change in electrical field a fingertip makes to track touch position.');
  addPart(c, group, new THREE.BoxGeometry(W * 0.96, step * 0.5, D * 0.97),
    new THREE.MeshStandardMaterial({ color: 0x3fe0c4, transparent: true, opacity: 0.16, roughness: 0.3 }),
    V3(0, yAt(2), 0), V3(0, 2.2, 0));
  finalizeComponent(c, components, order);

  c = newComponent('phone-frame', 'Mid-frame chassis', 'Machined aluminum',
    "The structural skeleton of the phone. It anchors every internal part and often carries the antenna lines cut into its edges.");
  const railMat = stdMat(0x9aa4ac, { metalness: 0.85, roughness: 0.3 });
  const rY = yAt(3);
  addPart(c, group, new THREE.BoxGeometry(W + 0.06, step * 0.8, 0.12), railMat, V3(0, rY, D / 2 - 0.02), V3(0, 0.8, 0));
  addPart(c, group, new THREE.BoxGeometry(W + 0.06, step * 0.8, 0.12), railMat, V3(0, rY, -D / 2 + 0.02), V3(0, 0.8, 0));
  addPart(c, group, new THREE.BoxGeometry(0.12, step * 0.8, D), railMat, V3(W / 2 - 0.02, rY, 0), V3(0, 0.8, 0));
  addPart(c, group, new THREE.BoxGeometry(0.12, step * 0.8, D), railMat, V3(-W / 2 + 0.02, rY, 0), V3(0, 0.8, 0));
  finalizeComponent(c, components, order);

  c = newComponent('phone-board', 'Main logic board', 'Multilayer PCB + SoC',
    "The phone's brain: a system-on-chip, memory, and radio modules soldered to a compact multilayer circuit board.");
  addPart(c, group, new THREE.BoxGeometry(W * 0.55, step * 0.6, D * 0.42), stdMat(0x184a2e, { roughness: 0.6 }),
    V3(0.1, yAt(4), -D * 0.22), V3(0, -1.0, 0.6));
  addPart(c, group, new THREE.BoxGeometry(0.5, step * 0.6, 0.5), stdMat(0x111214, { roughness: 0.5, metalness: 0.3 }),
    V3(0.1, yAt(4) + step * 0.5, -D * 0.22), V3(0, -1.0, 0.6));
  finalizeComponent(c, components, order);

  c = newComponent('phone-camera', 'Camera module', 'Stacked lens elements',
    'A small stack of glass lens elements and an image sensor, packed into a housing thinner than a coin.');
  const camY = yAt(4);
  addPart(c, group, new THREE.CylinderGeometry(0.28, 0.28, step * 1.6, 20), stdMat(0x14161c, { metalness: 0.6, roughness: 0.3 }),
    V3(-W / 2 + 0.55, camY, -D / 2 + 0.7), V3(-1.0, -0.6, -1.2), { x: Math.PI / 2 });
  addPart(c, group, new THREE.CylinderGeometry(0.18, 0.18, step * 1.7, 20),
    new THREE.MeshPhysicalMaterial({ color: 0x1a2a44, roughness: 0.05, transmission: 0.6 }),
    V3(-W / 2 + 0.55, camY, -D / 2 + 0.7), V3(-1.0, -0.6, -1.2), { x: Math.PI / 2 });
  finalizeComponent(c, components, order);

  c = newComponent('phone-battery', 'Battery', 'Lithium-ion pouch cell',
    'Usually the single largest component by volume, storing the energy that runs everything else.');
  addPart(c, group, new THREE.BoxGeometry(W * 0.8, step * 0.85, D * 0.5), stdMat(0x16181c, { roughness: 0.7 }),
    V3(0, yAt(6), D * 0.14), V3(0, -2.0, 0));
  finalizeComponent(c, components, order);

  c = newComponent('phone-coil', 'Wireless charging coil', 'Copper wire winding',
    'A flat copper coil receives energy transferred magnetically from a charging pad, with no cable connection needed.');
  addPart(c, group, new THREE.TorusGeometry(0.9, 0.05, 8, 32), stdMat(0xd9822b, { metalness: 0.7, roughness: 0.35 }),
    V3(0, yAt(7), D * 0.1), V3(0, -3.0, 0), { x: Math.PI / 2 });
  finalizeComponent(c, components, order);

  c = newComponent('phone-back', 'Rear cover', 'Glass / composite shell',
    'The outer shell protects everything inside and, on wireless-charging phones, has to stay non-metallic over the coil.');
  addPart(c, group, new THREE.BoxGeometry(W, step * 0.9, D), stdMat(0x272a30, { roughness: 0.35, metalness: 0.2 }),
    V3(0, yAt(8), 0), V3(0, -4.2, 0));
  finalizeComponent(c, components, order);

  return {
    group, components, order,
    label: 'Smartphone',
    tagline: 'A modern glass-and-aluminum smartphone, peeled back one layer at a time.',
    spec: [['Layers', '9'], ['Footprint', '71.5 × 147 × 7.8 mm'], ['Materials', 'Glass · aluminum · Li-ion'], ['Basis', 'reference proportions']],
    floorY: -5,
    home: { pos: [6, 3.2, 8.4], target: [0, 0, 0] },
    views: {
      iso: { pos: [6, 3.2, 8.4], target: [0, 0, 0] },
      top: { pos: [0.01, 11, 0.01], target: [0, 0, 0] },
      front: { pos: [0, 0.6, 11], target: [0, 0.1, 0] }
    }
  };
}

/* ============================================================
   DEVICE: MECHANICAL KEYSWITCH
   ============================================================ */
function buildSwitch() {
  const group = new THREE.Group();
  const components = {}; const order = [];

  let c = newComponent('sw-cap', 'Keycap', 'ABS / PBT plastic',
    'The part your finger touches. Its profile and shape are the only thing about a switch most people ever notice.');
  addPart(c, group, new THREE.BoxGeometry(1.15, 0.35, 1.15), stdMat(0xd7dbe2, { roughness: 0.55 }), V3(0, 1.55, 0), V3(0, 3.2, 0));
  addPart(c, group, new THREE.BoxGeometry(0.35, 0.3, 0.06), stdMat(0xc4c9d1, { roughness: 0.5 }), V3(0, 1.32, 0), V3(0, 3.2, 0));
  addPart(c, group, new THREE.BoxGeometry(0.06, 0.3, 0.35), stdMat(0xc4c9d1, { roughness: 0.5 }), V3(0, 1.32, 0), V3(0, 3.2, 0));
  finalizeComponent(c, components, order);

  c = newComponent('sw-upper', 'Upper housing', 'Translucent polycarbonate',
    'The upper shell is usually clear so backlighting can shine through, and it guides the stem in a perfectly straight vertical path.');
  addPart(c, group, new THREE.BoxGeometry(1.0, 0.5, 1.0), new THREE.MeshStandardMaterial({ color: 0xeef2f8, transparent: true, opacity: 0.45, roughness: 0.15, emissive: 0x3a4356, emissiveIntensity: 0.4 }),
    V3(0, 1.05, 0), V3(0, 2.4, 0));
  finalizeComponent(c, components, order);

  c = newComponent('sw-stem', 'Stem (slider)', 'POM plastic',
    'Moves straight down when pressed. A small bump on its side is what your finger feels — and what sometimes clicks — at the actuation point.');
  addPart(c, group, new THREE.BoxGeometry(0.32, 0.85, 0.32), stdMat(0x9a6a3d, { roughness: 0.45 }), V3(0, 0.75, 0), V3(0, 1.6, 0));
  addPart(c, group, new THREE.BoxGeometry(0.08, 0.16, 0.06), stdMat(0x8a5c31, { roughness: 0.45 }), V3(0.2, 0.55, 0), V3(0, 1.6, 0));
  finalizeComponent(c, components, order);

  c = newComponent('sw-spring', 'Return spring', 'Coiled steel wire',
    'A compression spring pushes the stem back up after every keystroke, ready for the next press.');
  for (let i = 0; i < 6; i++) {
    const y = 0.32 + i * 0.09;
    addPart(c, group, new THREE.TorusGeometry(0.15, 0.017, 8, 20), stdMat(0xc7c9cf, { metalness: 0.85, roughness: 0.25 }),
      V3(0, y, 0), V3(0, 0.8, 0), { x: Math.PI / 2 });
  }
  finalizeComponent(c, components, order);

  c = newComponent('sw-lower', 'Lower housing', 'Nylon base',
    'The base shell anchors the switch to the plate or PCB and houses the electrical contacts.');
  addPart(c, group, new THREE.BoxGeometry(1.0, 0.45, 1.0), stdMat(0x1c1c20, { roughness: 0.6 }), V3(0, 0.15, 0), V3(0, -0.8, 0));
  finalizeComponent(c, components, order);

  c = newComponent('sw-contacts', 'Contact leaves', 'Gold-plated spring metal',
    'Two spring-loaded metal leaves complete a circuit the instant the stem pushes them together.');
  addPart(c, group, new THREE.BoxGeometry(0.05, 0.35, 0.16), stdMat(0xd4af37, { metalness: 0.9, roughness: 0.2 }), V3(0.18, -0.02, 0.1), V3(0.5, -1.6, 0.2), { z: 0.15 });
  addPart(c, group, new THREE.BoxGeometry(0.05, 0.35, 0.16), stdMat(0xd4af37, { metalness: 0.9, roughness: 0.2 }), V3(-0.18, -0.02, -0.1), V3(-0.5, -1.6, -0.2), { z: -0.15 });
  finalizeComponent(c, components, order);

  c = newComponent('sw-led', 'LED diffuser slot', 'Clear plastic window',
    'An optional light-emitting diode sits in a slot in the base, shining up through the translucent housing for backlighting.');
  addPart(c, group, new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
    V3(0, -0.15, 0.3), V3(0, -2.2, 0.3));
  finalizeComponent(c, components, order);

  c = newComponent('sw-pins', 'Mounting pins', 'Stamped metal',
    'Two or more metal pins push through holes in the circuit board and are soldered in place to hold the switch and carry signal.');
  addPart(c, group, new THREE.CylinderGeometry(0.035, 0.035, 0.35, 10), stdMat(0xb8bcc4, { metalness: 0.8, roughness: 0.3 }), V3(0.2, -0.35, 0), V3(0.2, -2.8, 0));
  addPart(c, group, new THREE.CylinderGeometry(0.035, 0.035, 0.35, 10), stdMat(0xb8bcc4, { metalness: 0.8, roughness: 0.3 }), V3(-0.2, -0.35, 0), V3(-0.2, -2.8, 0));
  finalizeComponent(c, components, order);

  c = newComponent('sw-pcb', 'PCB pad', 'Glass-reinforced FR4',
    'The circuit board every switch is soldered to. It carries the row and column wiring the keyboard controller scans.');
  addPart(c, group, new THREE.BoxGeometry(1.6, 0.14, 1.6), stdMat(0x14532d, { roughness: 0.6 }), V3(0, -0.6, 0), V3(0, -3.6, 0));
  addPart(c, group, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10), stdMat(0xd4af37, { metalness: 0.7 }), V3(0.2, -0.52, 0), V3(0.2, -3.6, 0));
  addPart(c, group, new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10), stdMat(0xd4af37, { metalness: 0.7 }), V3(-0.2, -0.52, 0), V3(-0.2, -3.6, 0));
  finalizeComponent(c, components, order);

  return {
    group, components, order,
    label: 'Keyboard switch',
    tagline: 'An MX-style mechanical switch, the smallest assembly with the biggest fan following.',
    spec: [['Layers', '9'], ['Footprint', '~15.5 × 15.5 × 18 mm'], ['Materials', 'Polymer · steel · gold contacts'], ['Basis', 'reference proportions']],
    floorY: -1.3,
    home: { pos: [4.6, 3.0, 5.6], target: [0, 0, 0] },
    views: {
      iso: { pos: [4.6, 3.0, 5.6], target: [0, 0, 0] },
      top: { pos: [0.01, 8.4, 0.01], target: [0, 0, 0] },
      front: { pos: [0, 0.6, 7.2], target: [0, 0, 0] }
    }
  };
}

/* ============================================================
   DEVICE: QUADCOPTER DRONE
   ============================================================ */
function buildDrone() {
  const group = new THREE.Group();
  const components = {}; const order = [];
  const armLen = 1.6;
  const angles = [45, 135, 225, 315].map(d => d * Math.PI / 180);

  let c = newComponent('drone-frame', 'Frame plate', 'Woven carbon fiber',
    'The central chassis every other system bolts to. It stays put in this view as the fixed reference the rest of the drone explodes away from.');
  const frameMesh = addPart(c, group, new THREE.BoxGeometry(1.5, 0.09, 1.5), stdMat(0x16171a, { metalness: 0.25, roughness: 0.6 }), V3(0, 0, 0), V3(0, 0, 0));
  frameMesh.rotation.y = Math.PI / 4;
  finalizeComponent(c, components, order);

  c = newComponent('drone-battery', 'Battery pack', 'Lithium-polymer cells',
    'The heaviest single part, so it sits low and central to keep the aircraft balanced in flight.');
  addPart(c, group, new THREE.BoxGeometry(0.7, 0.35, 2.0), stdMat(0x0d0d10, { roughness: 0.6 }), V3(0, 0.28, 0), V3(0, 2.0, 0));
  addPart(c, group, new THREE.BoxGeometry(0.72, 0.04, 0.35), stdMat(0xd9822b, { roughness: 0.5 }), V3(0, 0.46, 0.55), V3(0, 2.0, 0));
  finalizeComponent(c, components, order);

  c = newComponent('drone-fc', 'Flight controller', 'PCB + IMU sensors',
    "A small computer packed with gyroscopes and accelerometers that reads pilot input hundreds of times a second and adjusts each motor's speed to keep the aircraft stable.");
  addPart(c, group, new THREE.BoxGeometry(0.6, 0.06, 0.6), stdMat(0x1b4332, { roughness: 0.55 }), V3(0, 0.5, 0), V3(0, 1.4, 0));
  addPart(c, group, new THREE.BoxGeometry(0.16, 0.05, 0.16), stdMat(0x111214, { roughness: 0.4, metalness: 0.3 }), V3(0, 0.56, 0), V3(0, 1.4, 0));
  finalizeComponent(c, components, order);

  c = newComponent('drone-arms', 'Booms', 'Carbon fiber tube',
    "Four booms hold the motors away from the body in an X pattern, far enough apart that the spinning propellers can't collide.");
  const armMat = stdMat(0x1c1d21, { metalness: 0.2, roughness: 0.55 });
  angles.forEach(ang => {
    const dir = V3(Math.cos(ang), 0, Math.sin(ang));
    const armPos = dir.clone().multiplyScalar(armLen / 2);
    const armMesh = addPart(c, group, new THREE.BoxGeometry(armLen, 0.09, 0.22), armMat, armPos, dir.clone().multiplyScalar(1.1));
    armMesh.rotation.y = -ang;
  });
  finalizeComponent(c, components, order);

  c = newComponent('drone-motors', 'Motors + propellers', 'Brushless motor / carbon blade',
    'Each brushless motor spins its own propeller directly, no gearbox needed, and the flight controller varies all four speeds independently to move in any direction.');
  angles.forEach(ang => {
    const dir = V3(Math.cos(ang), 0, Math.sin(ang));
    const tip = dir.clone().multiplyScalar(armLen + 0.12);
    const explode = dir.clone().multiplyScalar(1.3).add(V3(0, 0.9, 0));
    addPart(c, group, new THREE.CylinderGeometry(0.13, 0.15, 0.03, 8), stdMat(0xd9822b, { metalness: 0.75, roughness: 0.35 }),
      V3(tip.x, 0.05, tip.z), explode);
    addPart(c, group, new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16), stdMat(0x2b2d33, { metalness: 0.6, roughness: 0.3 }),
      V3(tip.x, 0.17, tip.z), explode);
    const bladePos = V3(tip.x, 0.29, tip.z);
    const b1 = addPart(c, group, new THREE.BoxGeometry(0.72, 0.02, 0.09), stdMat(0x232428, { transparent: true, opacity: 0.85, roughness: 0.4 }), bladePos, explode);
    b1.rotation.y = ang;
    const b2 = addPart(c, group, new THREE.BoxGeometry(0.72, 0.02, 0.09), stdMat(0x232428, { transparent: true, opacity: 0.85, roughness: 0.4 }), bladePos, explode);
    b2.rotation.y = ang + Math.PI / 2;
  });
  finalizeComponent(c, components, order);

  c = newComponent('drone-camera', 'Camera gimbal', 'Motorized stabilizer',
    'A camera on a motorized gimbal stays level and steady even as the body tilts to accelerate.');
  addPart(c, group, new THREE.BoxGeometry(0.32, 0.28, 0.28), stdMat(0x1a1b1f, { roughness: 0.5 }), V3(0, -0.14, -1.0), V3(0, -1.0, -1.3));
  addPart(c, group, new THREE.CylinderGeometry(0.09, 0.09, 0.14, 16), new THREE.MeshPhysicalMaterial({ color: 0x1a2c44, roughness: 0.05, transmission: 0.5 }),
    V3(0, -0.14, -1.16), V3(0, -1.0, -1.3), { x: Math.PI / 2 });
  finalizeComponent(c, components, order);

  c = newComponent('drone-gps', 'GPS + antenna mast', 'Ceramic patch antenna',
    'Raised above the electronics on a small mast, the GPS antenna gets a clear, interference-free view of the sky for accurate position holds.');
  addPart(c, group, new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), stdMat(0x222226, { roughness: 0.5 }), V3(0, 0.32, 0.55), V3(0, 2.2, 0.3));
  addPart(c, group, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20), stdMat(0xe8ecf2, { roughness: 0.5 }), V3(0, 0.6, 0.55), V3(0, 2.2, 0.3));
  finalizeComponent(c, components, order);

  return {
    group, components, order,
    label: 'Quadcopter',
    tagline: 'A compact quadcopter drone, spread into its seven main systems.',
    spec: [['Systems', '7'], ['Diagonal', '~250 mm'], ['Materials', 'Carbon fiber · aluminum · LiPo'], ['Basis', 'reference proportions']],
    floorY: -1.6,
    home: { pos: [6.2, 4.4, 7.0], target: [0, 0.2, 0] },
    views: {
      iso: { pos: [6.2, 4.4, 7.0], target: [0, 0.2, 0] },
      top: { pos: [0.01, 9.8, 0.01], target: [0, 0.2, 0] },
      front: { pos: [0, 1.0, 9.0], target: [0, 0.3, 0] }
    }
  };
}

/* ============================================================
   DEVICE REGISTRY + STATE
   ============================================================ */
const DEVICES = {
  phone:  { key: 'phone',  build: buildPhone },
  switch: { key: 'switch', build: buildSwitch },
  drone:  { key: 'drone',  build: buildDrone },
};
const DEVICE_ORDER = ['phone', 'switch', 'drone'];

let currentGroup = null;
let currentData = null;
let selectedId = null;
let hoveredId = null;

/* ---- device tabs ---- */
DEVICE_ORDER.forEach(key => {
  const btn = document.createElement('button');
  btn.dataset.device = key;
  btn.innerHTML = `<span class="dot"></span><span class="label"></span>`;
  btn.addEventListener('click', () => loadDevice(key));
  deviceTabsEl.appendChild(btn);
});

function updateActiveTab(key) {
  deviceTabsEl.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.device === key);
  });
}

/* ============================================================
   LOAD / SWITCH DEVICE
   ============================================================ */
function loadDevice(key) {
  const def = DEVICES[key];
  if (!def) return;
  const data = def.build();

  if (currentGroup) {
    scene.remove(currentGroup);
    disposeGroup(currentGroup);
  }

  currentGroup = data.group;
  currentData = data;
  scene.add(currentGroup);

  selectedId = null;
  hoveredId = null;

  if (grid) grid.position.y = data.floorY;
  pad.position.y = data.floorY + 0.01;

  buildLayerList(data);
  buildSpecSheet(data);

  vpDeviceName.textContent = data.label;
  vpDeviceSub.textContent = 'exploded-view inspector';

  deconSlider.value = 0;
  deconValue.textContent = '0%';

  camera.position.set(...data.home.pos);
  focusTarget.set(...data.home.target);
  controls.target.copy(focusTarget);

  showOverview(data);
  updateActiveTab(key);

  const labelForTab = deviceTabsEl.querySelector(`button[data-device="${key}"] .label`);
  if (labelForTab) labelForTab.textContent = data.label;
}

DEVICE_ORDER.forEach(key => {
  const btn = deviceTabsEl.querySelector(`button[data-device="${key}"]`);
  const tmpLabel = { phone: 'Smartphone', switch: 'Keyboard switch', drone: 'Quadcopter' }[key];
  btn.querySelector('.label').textContent = tmpLabel;
});

/* ============================================================
   LEFT PANEL: LAYER LIST + SPEC SHEET
   ============================================================ */
function buildLayerList(data) {
  layerListEl.innerHTML = '';
  data.order.forEach((id, idx) => {
    const comp = data.components[id];
    const li = document.createElement('li');
    li.dataset.id = id;
    const idxStr = String(idx + 1).padStart(2, '0');
    li.innerHTML = `
      <span class="idx">${idxStr}</span>
      <span class="meta">
        <div class="name">${comp.name}</div>
        <div class="material">${comp.material}</div>
      </span>
    `;
    li.addEventListener('click', () => toggleSelect(id));
    layerListEl.appendChild(li);
  });
}

function buildSpecSheet(data) {
  specSheetEl.innerHTML = data.spec.map(([label, val]) => `
    <div class="spec-row"><span>${label}</span><span>${val}</span></div>
  `).join('');
}

function highlightListRow() {
  layerListEl.querySelectorAll('li').forEach(li => {
    li.classList.toggle('selected', selectedId === li.dataset.id);
    li.classList.toggle('hovered', !selectedId && hoveredId === li.dataset.id);
  });
}

/* ============================================================
   INSPECTOR PANEL
   ============================================================ */
function showOverview(data) {
  inspEyebrow.textContent = data.order.length + ' LAYERS';
  inspName.textContent = data.label;
  inspMaterial.style.display = 'none';
  inspDesc.textContent = data.tagline;
  inspHint.textContent = 'Hover a part in the viewport, or click a row in the layer stack, to inspect it. Drag the deconstruct slider to pull the assembly apart.';
}

function showComponent(id) {
  const data = currentData;
  const idx = data.order.indexOf(id);
  const comp = data.components[id];
  if (!comp) return;
  inspEyebrow.textContent = `LAYER ${String(idx + 1).padStart(2, '0')} / ${data.order.length}`;
  inspName.textContent = comp.name;
  inspMaterial.style.display = 'inline-block';
  inspMaterial.textContent = comp.material;
  inspDesc.textContent = comp.description;
  inspHint.textContent = selectedId === id
    ? 'Click this layer again, or click empty space, to deselect it.'
    : '';
}

function refreshInspector() {
  if (selectedId) showComponent(selectedId);
  else if (hoveredId) showComponent(hoveredId);
  else showOverview(currentData);
}

/* ============================================================
   HIGHLIGHTING (theme-aware)
   ============================================================ */
function setComponentHighlight(id, hex, intensity) {
  const comp = currentData.components[id];
  if (!comp) return;
  comp.parts.forEach(p => {
    if (p.mesh.material.emissive) {
      p.mesh.material.emissive.setHex(hex);
      p.mesh.material.emissiveIntensity = intensity;
    }
  });
}

function clearComponentHighlight(id) {
  const comp = currentData.components[id];
  if (!comp) return;
  comp.parts.forEach(p => {
    if (p.mesh.material.emissive) {
      p.mesh.material.emissive.setHex(p.baseEmissiveHex);
      p.mesh.material.emissiveIntensity = p.baseEmissiveIntensity;
    }
  });
}

function refreshHighlights() {
  if (!currentData) return;
  const t = SCENE_THEME[themeKey];
  if (hoveredId && hoveredId !== selectedId) {
    setComponentHighlight(hoveredId, t.hoverHex, t.hoverIntensity);
  }
  if (selectedId) {
    setComponentHighlight(selectedId, t.selectHex, t.selectIntensity);
  }
}

function setHovered(id) {
  if (id === hoveredId) return;
  if (hoveredId && hoveredId !== selectedId) clearComponentHighlight(hoveredId);
  hoveredId = id;
  const t = SCENE_THEME[themeKey];
  if (hoveredId && hoveredId !== selectedId) setComponentHighlight(hoveredId, t.hoverHex, t.hoverIntensity);
  highlightListRow();
  refreshInspector();
}

function toggleSelect(id) {
  const t = SCENE_THEME[themeKey];
  if (selectedId === id) {
    clearComponentHighlight(id);
    selectedId = null;
    if (hoveredId === id) setComponentHighlight(id, t.hoverHex, t.hoverIntensity);
    focusTarget.copy(new THREE.Vector3(...currentData.home.target));
  } else {
    if (selectedId) clearComponentHighlight(selectedId);
    if (hoveredId && hoveredId !== id) clearComponentHighlight(hoveredId);
    selectedId = id;
    setComponentHighlight(id, t.selectHex, t.selectIntensity);
    focusTarget.copy(currentData.components[id].center);
  }
  highlightListRow();
  refreshInspector();
}

function clearSelection() {
  if (selectedId) {
    clearComponentHighlight(selectedId);
    selectedId = null;
    focusTarget.copy(new THREE.Vector3(...currentData.home.target));
    highlightListRow();
    refreshInspector();
  }
}

/* ============================================================
   RAYCASTING (hover + click)
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getAllMeshes() {
  const arr = [];
  if (currentGroup) currentGroup.traverse(o => { if (o.isMesh) arr.push(o); });
  return arr;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(getAllMeshes(), false);
  const found = hits.length ? hits[0].object.userData.componentId : null;
  setHovered(found || null);

  if (found) {
    hoverTip.style.display = 'block';
    hoverTip.style.left = (event.clientX + 14) + 'px';
    hoverTip.style.top = (event.clientY + 14) + 'px';
    hoverTip.textContent = currentData.components[found].name;
  } else {
    hoverTip.style.display = 'none';
  }
});

renderer.domElement.addEventListener('pointerleave', () => {
  setHovered(null);
  hoverTip.style.display = 'none';
});

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(getAllMeshes(), false);
  if (hits.length) toggleSelect(hits[0].object.userData.componentId);
  else clearSelection();
});

/* ============================================================
   DECONSTRUCTION SLIDER
   ============================================================ */
function updateDeconstruction(factor) {
  if (!currentData) return;
  currentData.order.forEach(id => {
    const comp = currentData.components[id];
    comp.parts.forEach(p => {
      p.mesh.position.copy(p.basePos).add(p.explodeDir.clone().multiplyScalar(factor));
    });
  });
}

deconSlider.addEventListener('input', () => {
  const val = parseFloat(deconSlider.value);
  deconValue.textContent = Math.round(val) + '%';
  updateDeconstruction(val / 100);
});

document.querySelectorAll('.decon-chips button').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseFloat(btn.dataset.val);
    deconSlider.value = val;
    deconValue.textContent = val + '%';
    updateDeconstruction(val / 100);
  });
});

/* ============================================================
   CAMERA VIEW PRESETS + RESET
   ============================================================ */
function setView(viewKey) {
  const v = currentData.views[viewKey];
  if (!v) return;
  camera.position.set(...v.pos);
  focusTarget.set(...v.target);
}

document.querySelectorAll('#view-presets button').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  setView('iso');
  clearSelection();
});

/* ============================================================
   THEME SWITCHING
   ============================================================ */
function setTheme(key, persist = true) {
  themeKey = key === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', themeKey);

  if (persist) {
    try { localStorage.setItem(THEME_KEY, themeKey); } catch (e) {}
  }

  btnTheme.title = themeKey === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  btnTheme.setAttribute('aria-pressed', themeKey === 'light' ? 'true' : 'false');

  applySceneTheme(themeKey);
  refreshHighlights();
}

btnTheme.addEventListener('click', () => {
  setTheme(themeKey === 'dark' ? 'light' : 'dark');
});

/* Follow system preference only if the user has never chosen manually */
if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (saved) return;
    setTheme(e.matches ? 'light' : 'dark', false);
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

/* ============================================================
   RESIZE
   ============================================================ */
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);
  controls.target.lerp(focusTarget, 0.09);
  controls.update();
  renderer.render(scene, camera);
}

/* ============================================================
   INIT
   ============================================================ */
applySceneTheme(themeKey);
btnTheme.title = themeKey === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
btnTheme.setAttribute('aria-pressed', themeKey === 'light' ? 'true' : 'false');

loadDevice('phone');
animate();
setTimeout(resize, 60);