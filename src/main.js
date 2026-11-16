import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './style.css';
import { bodies } from './data/bodies.js';
import { textureFor, moonTexture, ringTexture, glowTexture, dotTexture } from './textures.js';
import { initUI } from './ui.js';

// ---- Escala ---------------------------------------------------------------
// Distâncias (UA) e diâmetros (km) são proporcionais entre si. O Sol é desenhado menor que o real.
const AU = 16;            // unidades de cena por UA
const R_EARTH = 0.35;     // raio da Terra em unidades de cena (todos os outros raios derivam dele)
const SUN_R = 4.2;
const radiusOf = (km) => (R_EARTH * km) / 12742;
const periodOf = (years) => 20 * Math.pow(years, 0.6); // segundos por volta em 1x (comprimido, mantém a ordem)

const canvas = document.getElementById('scene');
const isMobile = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);
const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 6000);
const HOME = new THREE.Vector3(0, 560, 880);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4;
controls.maxDistance = 1500;
controls.zoomSpeed = 0.9;

// Pós-processamento: o bloom só pega o que é muito brilhante (o Sol)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.6, 0.92);
if (!isMobile) composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight(0x8793b8, 0.6));

// Estrelas: um único Points
{
  const n = isMobile ? 2500 : 5000;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = 2200 + Math.random() * 1800;
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

// ---- Corpos ---------------------------------------------------------------
const entries = [];            // planetas + luas
const planets = [];
const byId = {};
const orbitLines = [];         // linhas de órbita dos planetas
const sphereHi = new THREE.SphereGeometry(1, 64, 48);
const sphereLo = new THREE.SphereGeometry(1, 32, 24);
const sphereTiny = new THREE.SphereGeometry(1, 20, 14);
const dotTex = dotTexture();
let seedN = 1;

function makeSphere(d, R, kind) {
  let mat;
  if (d.star) mat = new THREE.MeshBasicMaterial({ map: textureFor.sol(), color: new THREE.Color(1.6, 1.3, 1.0) });
  else {
    const map = textureFor[d.id] ? textureFor[d.id]() : moonTexture(d.color, seedN++ * 7);
    mat = new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0 });
  }
  const mesh = new THREE.Mesh(kind === 'moon' ? sphereTiny : R >= 1 ? sphereHi : sphereLo, mat);
  mesh.scale.setScalar(R);
  mesh.userData.id = d.id;
  return mesh;
}

function circle(radius, color, opacity, seg = 256) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

// Anel no plano equatorial do planeta (não gira junto com a superfície)
function makeRing(R, { inner, outer, strength, seed }) {
  const geo = new THREE.RingGeometry(R * inner, R * outer, 160, 1);
  const p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() / R - inner) / (outer - inner), 0.5); }
  const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: ringTexture(strength, seed), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; // RingGeometry nasce no plano XY; leva para o plano equatorial XZ
  return ring;
}

for (const d of bodies) {
  const R = d.star ? SUN_R : radiusOf(d.km);
  const orbit = AU * d.au;
  const pivot = new THREE.Group();          // inclinação do plano orbital
  pivot.rotation.x = d.tilt;
  scene.add(pivot);
  const holder = new THREE.Group();         // posição ao longo da órbita
  pivot.add(holder);
  const tiltG = new THREE.Group();          // inclinação do eixo do planeta
  tiltG.rotation.z = d.axisTilt ?? 0;
  holder.add(tiltG);
  const mesh = makeSphere(d, R, 'planet');
  tiltG.add(mesh);

  if (d.id === 'terra') { // atmosfera: brilho de borda fino, abaixo do limiar do bloom
    const atmo = new THREE.Mesh(sphereLo, new THREE.ShaderMaterial({
      transparent: true, side: THREE.FrontSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 n;void main(){float i=pow(1.0-abs(n.z),4.0)*0.5;gl_FragColor=vec4(.25,.5,1.,1.)*i;}',
    }));
    atmo.scale.setScalar(1.045);
    mesh.add(atmo);
  }
  for (const rg of d.rings ?? []) tiltG.add(makeRing(R, rg));

  if (d.star) {
    mesh.add(new THREE.PointLight(0xfff1dd, 4.5, 0, 0));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.setScalar(3.6);
    mesh.add(glow);
  }

  const e = { data: d, R, holder, mesh, orbit, period: d.years ? periodOf(d.years) : 0, angle: Math.random() * Math.PI * 2, parent: null, moons: [], moonSystem: null, extent: R };
  if (d.au) {
    const line = circle(orbit, 0x5f7fb8, 0.28, 360);
    pivot.add(line); orbitLines.push(line);
  }
  if (d.au || d.star) {
    // marcador de tamanho constante na tela: planetas reais são minúsculos vistos de longe
    const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: d.color, transparent: true, depthWrite: false, sizeAttenuation: false }));
    mk.scale.setScalar(d.star ? 0.03 : 0.012);
    mk.userData.id = d.id;
    tiltG.add(mk);
    e.marker = mk;
  }

  if (d.moons?.length) {
    const ms = new THREE.Group();
    ms.rotation.x = 0.06; ms.visible = false;
    holder.add(ms);
    e.moonSystem = ms;
    for (const m of d.moons) {
      const mR = Math.max(radiusOf(m.km), 0.03); // luas minúsculas ganham um tamanho mínimo visível
      const mOrbit = R * m.a;
      const mm = makeSphere(m, mR, 'moon');
      ms.add(mm);
      ms.add(circle(mOrbit, 0x9db8ee, 0.35, 96));
      const me = { data: m, R: mR, mesh: mm, orbit: mOrbit, period: m.period, angle: Math.random() * Math.PI * 2, parent: e, isMoon: true, extent: mR };
      e.moons.push(me); entries.push(me); byId[m.id] = me;
      e.extent = Math.max(e.extent, mOrbit);
    }
  }
  entries.push(e); planets.push(e); byId[d.id] = e;
}

// ---- Seleção / câmera -----------------------------------------------------
let viewX = 0, focus = null, desiredDist = null, paused = false, speed = 1, homeAnim = false;
const tmp = new THREE.Vector3(), v3 = new THREE.Vector3();

function activeSystem(p) {
  for (const e of planets) if (e.moonSystem) e.moonSystem.visible = e === p;
}

function select(id) {
  focus = id ? byId[id] : null;
  const planet = focus ? focus.parent ?? focus : null;
  activeSystem(planet);
  if (focus) {
    homeAnim = false;
    if (focus.isMoon) { desiredDist = focus.R * 6 + 0.5; controls.minDistance = focus.R * 2.2; }
    else { desiredDist = Math.max(focus.R * 4.2, focus.extent * 2.3) + (focus.data.star ? 3 : 1); controls.minDistance = focus.R * 1.6; }
  } else {
    desiredDist = null; controls.minDistance = 4; homeAnim = true;
  }
  ui.show(focus ? focus.data : null, focus?.parent?.data);
  ui.setActive(planet ? planet.data.id : null);
}

const ui = initUI({
  bodies, onSelect: select, onHome: () => select(null),
  onPause: (p) => (paused = p), onSpeed: (s) => (speed = s), onOrbits: (v) => orbitLines.forEach((l) => (l.visible = v)),
});

// Rótulos HTML (poucos e baratos)
const labelsEl = document.getElementById('labels');
for (const e of entries) {
  const el = document.createElement('button');
  el.className = 'label' + (e.isMoon ? ' moon' : '');
  el.textContent = e.data.name;
  el.onclick = () => select(e.data.id);
  labelsEl.appendChild(el); e.label = el;
}

// Clique (diferencia de arrastar)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
function pickables() {
  const out = [];
  for (const e of entries) {
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
  if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return;
  const hit = pick(ev);
  if (hit) select(hit.object.userData.id);
});
canvas.addEventListener('pointermove', (ev) => {
  if (ev.buttons) return;
  canvas.style.cursor = pick(ev) ? 'pointer' : 'grab';
});

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---- Loop -----------------------------------------------------------------
const clock = new THREE.Clock();
function place(e) {
  const x = Math.cos(e.angle) * e.orbit, z = -Math.sin(e.angle) * e.orbit;
  if (e.isMoon) e.mesh.position.set(x, 0, z); else e.holder.position.set(x, 0, z);
}
for (const e of entries) if (e.orbit) place(e);

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const k = paused ? 0 : speed * dt;
  const damp = (rate) => 1 - Math.exp(-rate * dt); // suavização independente do FPS
  for (const e of entries) {
    if (e.period) { e.angle += (k * Math.PI * 2) / e.period; place(e); }
    if (e.isMoon) e.mesh.rotation.y = e.angle; // rotação sincronizada: mesma face para o planeta
    else e.mesh.rotation.y += k * e.data.spin * 2;
  }

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
    controls.target.lerp(v3.set(0, 0, 0), damp(3.5));
    camera.position.lerp(HOME, damp(3));
    if (camera.position.distanceTo(HOME) < 2) homeAnim = false;
  }

  // Desloca a cena enquanto o painel está aberto (só em telas largas)
  const wantX = focus && innerWidth > 720 ? Math.min(200, innerWidth * 0.17) : 0;
  viewX += (wantX - viewX) * damp(5);
  if (Math.abs(viewX) > 0.5 || wantX) camera.setViewOffset(innerWidth, innerHeight, viewX, 0, innerWidth, innerHeight);
  else camera.clearViewOffset();

  controls.update();

  // marcadores e rótulos
  for (const e of entries) {
    const hidden = e.isMoon && !e.parent.moonSystem.visible;
    e.mesh.visible = !hidden;
    if (hidden) { e.label.style.display = 'none'; continue; }
    e.mesh.getWorldPosition(tmp);
    const dist = camera.position.distanceTo(tmp);
    if (e.marker) e.marker.visible = dist > e.R * 45;
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
