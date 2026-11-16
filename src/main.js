import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';
import { initUI } from './ui.js';
import { setPxScale } from './engine/helpers.js';
import { buildSolar } from './levels/solar.js';
import { buildStars } from './levels/stars.js';
import { buildGalaxy } from './levels/galaxy.js';
import { buildUniverse } from './levels/universe.js';

const canvas = document.getElementById('scene');
const isMobile = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // comprime realces: planetas e galáxias não "estouram"
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);
const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 14000);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.zoomSpeed = 0.9;

// Pós-processamento: o bloom só pega o que é muito brilhante (Sol, núcleo da galáxia, buracos negros)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.6, 0.92);
if (!isMobile) composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight(0x8793b8, 0.4));

// Estrelas de fundo: um único Points, comum a todos os níveis
{
  const n = isMobile ? 2500 : 5000;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = 5000 + Math.random() * 1800;
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
    c.setHSL(0.55 + Math.random() * 0.15, 0.4, 0.6 + Math.random() * 0.4);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })));
}

// ---- Níveis ---------------------------------------------------------------
const levelsMeta = [
  { id: 'solar', name: 'Sistema Solar' },
  { id: 'stars', name: 'Vizinhança Estelar' },
  { id: 'galaxy', name: 'Via Láctea' },
  { id: 'universe', name: 'Grupo Local' },
];
const builders = { solar: buildSolar, stars: buildStars, galaxy: () => buildGalaxy({ isMobile }), universe: () => buildUniverse({ isMobile }) };
const levels = {};
let level = null;
const labelsEl = document.getElementById('labels');

function ensureLevel(id) {
  if (levels[id]) return levels[id];
  const L = builders[id]();
  L.group.visible = false;
  scene.add(L.group);
  for (const e of L.entries) { // rótulos HTML (poucos e baratos)
    const el = document.createElement('button');
    el.className = 'label' + (e.isMoon ? ' moon' : '');
    el.textContent = e.data.name;
    el.style.display = 'none';
    el.onclick = () => select(e.data.id);
    labelsEl.appendChild(el); e.label = el;
  }
  return (levels[id] = L);
}

// ---- Seleção / câmera -----------------------------------------------------
let viewX = 0, focus = null, desiredDist = null, paused = false, speed = 1, homeAnim = false;
const tmp = new THREE.Vector3(), v3 = new THREE.Vector3();

function select(id) {
  focus = id ? level.byId[id] : null;
  const planet = focus ? focus.parent ?? focus : null;
  level.activeSystem(planet);
  if (focus) {
    homeAnim = false;
    const d = focus.data;
    if (focus.isMoon) { desiredDist = focus.R * 6 + 0.5; controls.minDistance = focus.R * 2.2; }
    else if (d.focusDist) { desiredDist = d.focusDist; controls.minDistance = d.focusDist * 0.3; }
    else { desiredDist = Math.max(focus.R * 4.2, focus.extent * 2.3) + (d.star ? 3 : 1); controls.minDistance = focus.R * 1.6; }
  } else {
    desiredDist = null; controls.minDistance = level.minDist; homeAnim = true;
  }
  ui.show(focus ? focus.data : null, focus?.parent?.data);
  ui.setActive(focus ? focus.data.id : null);
}

const fadeEl = document.getElementById('fade');
let switching = false;
function applyLevel(id) {
  if (level) {
    level.group.visible = false;
    for (const e of level.entries) e.label.style.display = 'none';
  }
  level = ensureLevel(id);
  level.group.visible = true;
  camera.near = level.near; camera.far = level.far; camera.updateProjectionMatrix();
  controls.minDistance = level.minDist; controls.maxDistance = level.maxDist;
  camera.position.copy(level.home); controls.target.copy(level.target);
  focus = null; desiredDist = null; homeAnim = false; viewX = 0; camera.clearViewOffset();
  ui.setLevel(id, level.list);
  ui.show(null);
  ui.setActive(null);
  level.setOrbits?.(document.getElementById('orbits').classList.contains('on'));
}
function setLevel(id) {
  if (switching || (level && level.id === id)) return;
  switching = true;
  fadeEl.classList.add('on');
  setTimeout(() => {
    applyLevel(id);
    requestAnimationFrame(() => fadeEl.classList.remove('on'));
    switching = false;
  }, 380);
}

const ui = initUI({
  levelsMeta, onLevel: setLevel, onGoto: setLevel,
  onSelect: select, onHome: () => select(null),
  onPause: (p) => (paused = p), onSpeed: (s) => (speed = s),
  onOrbits: (v) => level?.setOrbits?.(v),
});

// Clique (diferencia de arrastar)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
function pickables() {
  const out = [];
  for (const e of level.entries) {
    if (e.isMoon && !e.parent.moonSystem.visible) continue;
    out.push(e.marker?.visible ? e.marker : e.mesh);
  }
  return out;
}
function pick(ev) {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObjects(pickables(), false)[0];
}
canvas.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
canvas.addEventListener('pointerup', (ev) => {
  if (!down || !level || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return;
  const hit = pick(ev);
  if (hit) select(hit.object.userData.id);
});
canvas.addEventListener('pointermove', (ev) => {
  if (ev.buttons || !level) return;
  canvas.style.cursor = pick(ev) ? 'pointer' : 'grab';
});

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  setPxScale(h * renderer.getPixelRatio(), camera.fov);
}
addEventListener('resize', resize); resize();

// ---- Loop -----------------------------------------------------------------
const clock = new THREE.Clock();
let elapsed = 0;
applyLevel('solar');

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const k = paused ? 0 : speed * dt;
  const damp = (rate) => 1 - Math.exp(-rate * dt); // suavização independente do FPS
  level.update(k, dt, camera, elapsed);

  if (focus) {
    focus.mesh.getWorldPosition(tmp);
    camera.position.add(v3.copy(tmp).sub(controls.target)); // acompanha o astro
    controls.target.copy(tmp);
    if (desiredDist) {
      const off = v3.copy(camera.position).sub(controls.target);
      const next = THREE.MathUtils.lerp(off.length(), desiredDist, damp(3.5));
      camera.position.copy(controls.target).add(off.setLength(next));
      if (Math.abs(next - desiredDist) < desiredDist * 0.01) desiredDist = null;
    }
  } else if (homeAnim) {
    controls.target.lerp(level.target, damp(3.5));
    camera.position.lerp(level.home, damp(3));
    if (camera.position.distanceTo(level.home) < level.home.length() * 0.004) homeAnim = false;
  }

  // Desloca a cena enquanto o painel está aberto (só em telas largas)
  const wantX = focus && innerWidth > 720 ? Math.min(200, innerWidth * 0.17) : 0;
  viewX += (wantX - viewX) * damp(5);
  if (Math.abs(viewX) > 0.5 || wantX) camera.setViewOffset(innerWidth, innerHeight, viewX, 0, innerWidth, innerHeight);
  else camera.clearViewOffset();

  controls.update();

  // marcadores e rótulos
  for (const e of level.entries) {
    const hidden = e.isMoon && !e.parent.moonSystem.visible;
    e.mesh.visible = !hidden;
    if (hidden) { e.label.style.display = 'none'; continue; }
    e.mesh.getWorldPosition(tmp);
    const dist = camera.position.distanceTo(tmp);
    if (e.marker) e.marker.visible = dist > (e.markerDist ?? e.R * 45);
    tmp.project(camera);
    const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 && dist > e.R * 1.8;
    e.label.style.display = vis ? '' : 'none';
    if (vis) {
      const px = (tmp.x * 0.5 + 0.5) * innerWidth, py = (-tmp.y * 0.5 + 0.5) * innerHeight;
      const rpx = Math.min(innerHeight, (e.R / dist) * innerHeight * 1.07); // raio aparente em px
      e.label.style.transform = `translate(-50%, 0) translate(${px}px, ${py + rpx + 8}px)`;
    }
  }
  composer.render();
});

controls.addEventListener('start', () => { homeAnim = false; desiredDist = null; });
requestAnimationFrame(() => document.getElementById('loader').classList.add('done'));
