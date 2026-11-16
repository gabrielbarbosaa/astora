import * as THREE from 'three';
import { telescopes } from '../data/telescopes.js';
import { glowTexture, dotTexture } from '../textures.js';
import { createEarth } from '../earth.js';
import { createLive } from '../live.js';
import { circle, makeMarker, pickMesh } from '../engine/helpers.js';

const RE = 3; // raio da Terra na cena
const sphere = new THREE.SphereGeometry(1, 48, 32);
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
const hex = new THREE.CylinderGeometry(1, 1, 0.12, 6);

const toVec = (lat, lon, r) => {
  const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(a) * Math.cos(b), r * Math.sin(a), -r * Math.cos(a) * Math.sin(b));
};
const kepler = (M, e) => { let E = M; for (let i = 0; i < 6; i++) E = M + e * Math.sin(E); return E; };

function ellipseLine(a, ecc, color, opacity) {
  const b = a * Math.sqrt(1 - ecc * ecc), pts = [];
  for (let i = 0; i < 200; i++) { const E = (i / 200) * Math.PI * 2; pts.push(new THREE.Vector3(a * (Math.cos(E) - ecc), 0, -b * Math.sin(E))); }
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

// Modelos simples dos satélites (não são réplicas fiéis, só dão a silhueta de cada tipo)
export function satModel(type, color) {
  const g = new THREE.Group();
  const metal = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.4, emissive: new THREE.Color(c).multiplyScalar(0.12) });
  const panel = new THREE.MeshStandardMaterial({ color: 0x1d3a78, metalness: 0.3, roughness: 0.5, emissive: 0x0a1a3a });
  const add = (geo, mat, pos, scale, rot) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...scale); if (rot) m.rotation.set(...rot); g.add(m); return m;
  };
  if (type === 'jwst') {
    add(hex, metal(0xffcf5c), [0, 0.25, 0], [0.75, 1, 0.75], [Math.PI / 2, 0, 0]);   // espelho dourado
    add(box, metal(0xc9ccd6), [0, -0.2, 0], [2.3, 0.03, 1.2], [0, 0.5, 0.15]);       // escudo solar
    add(box, metal(0x888fa0), [0, -0.05, 0], [0.5, 0.5, 0.5]);
  } else if (type === 'hubble') {
    add(cyl, metal(0xc8ccd8), [0, 0, 0], [0.32, 1.7, 0.32], [0, 0, Math.PI / 2]);
    add(box, panel, [0, 0.55, 0], [0.5, 0.02, 0.9]);
    add(box, panel, [0, -0.55, 0], [0.5, 0.02, 0.9]);
  } else if (type === 'voyager') { // antena parabólica, mastro com instrumentos e gerador (RTG)
    add(cyl, metal(0xe9e9f0), [0, 0.1, 0], [0.9, 0.06, 0.9]);
    add(box, metal(0xb9a46a), [0, -0.05, 0], [0.5, 0.35, 0.5]);
    add(cyl, metal(0x6a707d), [1.05, 0, 0], [0.04, 1.6, 0.04], [0, 0, Math.PI / 2]);
    add(cyl, metal(0x4a4f5a), [-0.85, -0.05, 0], [0.1, 0.9, 0.1], [0, 0, Math.PI / 2]);
  } else if (type === 'xray') {
    add(cyl, metal(0xd9d2f0), [0, 0, 0], [0.22, 2.0, 0.22], [0, 0, Math.PI / 2]);
    add(box, panel, [0.2, 0, 0.55], [0.8, 0.02, 0.5]);
    add(box, panel, [0.2, 0, -0.55], [0.8, 0.02, 0.5]);
  } else {
    add(box, metal(0xd7d9e0), [0, 0, 0], [0.7, 0.7, 0.7]);
    add(box, panel, [0, 0.9, 0], [0.9, 0.02, 0.45]);
    add(box, panel, [0, -0.9, 0], [0.9, 0.02, 0.45]);
  }
  return g;
}

export function buildTelescopes() {
  const group = new THREE.Group();
  const entries = [], byId = {};
  const dotTex = dotTexture();
  const live = createLive(group);      // satélites reais (CelesTrak + SGP4), carregados sob demanda
  let liveOn = false, trailAt = 0;
  const _sun = new THREE.Vector3();

  // Terra (estilizada) com atmosfera, iluminada pelo Sol vindo de +X
  const earthPivot = new THREE.Group();
  group.add(earthPivot);
  const earthFX = createEarth();
  earthFX.mesh.scale.setScalar(RE);
  earthPivot.add(earthFX.mesh);
  const SUN_DIR = new THREE.Vector3(100, 18, 30).normalize();
  const atmo = new THREE.Mesh(sphere, new THREE.ShaderMaterial({
    transparent: true, side: THREE.FrontSide, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 n;void main(){float i=pow(1.0-abs(n.z),4.0)*0.5;gl_FragColor=vec4(.25,.5,1.,1.)*i;}',
  }));
  atmo.scale.setScalar(RE * 1.045);
  group.add(atmo);
  const sunLight = new THREE.DirectionalLight(0xfff1dd, 2.6);
  sunLight.position.set(100, 18, 30);
  group.add(sunLight);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sunGlow.position.set(170, 24, 50); sunGlow.scale.setScalar(40);
  group.add(sunGlow);

  // Lua (só decoração): órbita de referência
  const moonPivot = new THREE.Group();
  group.add(moonPivot);
  const moon = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ color: 0x9b9b9b, roughness: 1 }));
  moon.scale.setScalar(0.82); moon.position.x = 20;
  moonPivot.add(moon);
  const moonRing = circle(20, 0x9db8ee, 0.18, 128);
  group.add(moonRing);

  const moving = [];
  for (const d of telescopes) {
    const e = { data: d, parent: null, moons: [], extent: 0 };
    if (d.type === 'ground') {
      d.focusDist ??= 7;
      const pins = d.sites.map(([lat, lon]) => {
        const p = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: d.color }));
        p.scale.setScalar(0.04);
        p.position.copy(toVec(lat, lon, RE * 1.005));
        p.userData.id = d.id;
        earthPivot.add(p);
        return p;
      });
      if (d.arcs) { // EHT: arcos ligando as estações ao primeiro ponto (ALMA)
        for (let i = 1; i < pins.length; i++) {
          const a = pins[0].position.clone().normalize(), b = pins[i].position.clone().normalize(), pts = [];
          for (let t = 0; t <= 40; t++) pts.push(a.clone().lerp(b, t / 40).normalize().multiplyScalar(RE * (1.003 + 0.3 * Math.sin(Math.PI * (t / 40)))));
          earthPivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.5 })));
        }
      }
      const mk = makeMarker(dotTex, d.color, 0.012);
      mk.userData.id = d.id;
      pins[0].add(mk); mk.scale.setScalar(0.012 / 0.04);
      Object.assign(e, { R: 0.04, mesh: pins[0], marker: mk, markerDist: 5, markerMax: 40, labelMax: 38 });
      e.extent = 0.04;
    } else {
      const s = d.s ?? 0.16;
      const holder = new THREE.Group();
      let pivot = group, orbitLine = null;
      const col = new THREE.Color(d.color).getHex();
      if (d.type === 'leo' || d.type === 'ellip') {
        pivot = new THREE.Group();
        pivot.rotation.order = 'YXZ';
        pivot.rotation.set(d.orbit.incl, d.orbit.node, 0);
        group.add(pivot);
        orbitLine = d.type === 'leo' ? circle(d.orbit.a, col, 0.25, 128) : ellipseLine(d.orbit.a, d.orbit.ecc, col, 0.28);
        pivot.add(orbitLine);
      } else if (d.type === 'halo') { // órbita em halo ao redor de L1/L2 (plano YZ)
        const pts = [];
        for (let i = 0; i < 90; i++) { const t = (i / 90) * Math.PI * 2; pts.push(new THREE.Vector3(d.orbit.center, d.orbit.h * Math.cos(t), d.orbit.h * 1.3 * Math.sin(t))); }
        group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false })));
      } else if (d.type === 'trail') holder.position.set(...d.pos);
      pivot.add(holder);
      const model = satModel(d.model, d.color);
      model.scale.setScalar(s);
      holder.add(model);
      const mesh = pickMesh(s * 1.5, d.id);
      holder.add(mesh);
      const far = d.type !== 'leo' && d.type !== 'live';
      const mk = makeMarker(dotTex, d.color, far ? 0.014 : 0.01);
      mk.userData.id = d.id;
      holder.add(mk);
      Object.assign(e, { R: s * 1.2, mesh, holder, pivot, orbitLine, marker: mk, markerDist: far ? 12 : 5, markerMax: far ? Infinity : 40, labelMax: far ? 220 : 34, angle: Math.random() * Math.PI * 2, model, extent: s * 1.2 });
      if (d.type === 'live') { e.hide = true; holder.visible = false; } // a ISS só existe no modo ao vivo
      else moving.push(e);
      if (d.norad) { // dados que mudam a cada segundo, mostrados no painel
        d.live = () => {
          const i = live.info(d.norad, new Date());
          return i ? [['Altitude agora', `${Math.round(i.alt).toLocaleString('pt-BR')} km`], ['Velocidade agora', `${Math.round(i.kmh).toLocaleString('pt-BR')} km/h`], ['Sobre', `${i.lat.toFixed(1)}° lat, ${i.lon.toFixed(1)}° lon`]] : [];
        };
      }
    }
    entries.push(e); byId[d.id] = e;
  }

  return {
    id: 'telescopes', group, entries, byId, list: telescopes,
    home: new THREE.Vector3(-4, 40, 92), target: new THREE.Vector3(),
    near: 0.02, far: 14000, minDist: 1, maxDist: 260,
    activeSystem() {},
    // ---- modo "Ao vivo": satélites reais, Terra girando no ritmo real e Sol na posição real ----
    async setLive(on) {
      if (on) {
        const sats = Promise.all([
          live.addGroup('GROUP=stations', '#ffffff', { interval: 300, size: 0.05, minPx: 3 }),
          live.addGroup('GROUP=science', '#9fd0ff', { interval: 300, size: 0.04, minPx: 2.4 }),
          live.addGroup('GROUP=visual', '#ffe9a8', { interval: 500, size: 0.03, minPx: 2 }),
          live.addGroup('GROUP=gps-ops', '#7fe0a8', { interval: 1500, size: 0.03, minPx: 2.4 }),
          live.addGroup('GROUP=geo', '#ffb35a', { interval: 3000, size: 0.03, minPx: 1.8 }),
          live.addCatalog(28485), live.addCatalog(43435), // Swift e TESS
        ]);
        await sats;
        liveOn = true; trailAt = 0;
        for (const e of entries) {
          if (!e.data.norad || !live.has(e.data.norad)) continue;
          e.liveOK = true;
          if (e.pivot) e.pivot.rotation.set(0, 0, 0);
          if (e.orbitLine) e.orbitLine.visible = false;
          if (e.data.type === 'live') { e.hide = false; e.holder.visible = true; }
        }
      } else {
        liveOn = false;
        for (const q of [...live.layers.keys()]) live.removeGroup(q);
        for (const e of entries) {
          if (!e.liveOK) continue;
          e.liveOK = false;
          if (e.pivot && e.data.orbit?.incl != null) e.pivot.rotation.set(e.data.orbit.incl, e.data.orbit.node, 0);
          if (e.orbitLine) e.orbitLine.visible = true;
          if (e.data.type === 'live') { e.hide = true; e.holder.visible = false; }
        }
        earthPivot.rotation.set(0, 0, 0);
        sunLight.position.set(100, 18, 30); sunGlow.position.set(170, 24, 50);
      }
    },
    async setStarlink(on) { // opcional: ~9.000 satélites (download maior, ~2 MB)
      if (on) return live.addGroup('GROUP=starlink', '#7fd0ff', { interval: 1500, size: 0.02, minPx: 1.4, cache: false });
      live.removeGroup('GROUP=starlink'); return 0;
    },
    getLiveInfo: () => (liveOn ? { count: live.count(), now: new Date() } : null),
    update(k, dt, camera) {
      if (liveOn) {
        const now = new Date();
        earthPivot.rotation.y = live.gmst(now);               // a Terra gira no ritmo real
        live.sunDir(now, _sun);
        earthFX.setSun(_sun, camera);
        sunLight.position.copy(_sun).multiplyScalar(100);
        sunGlow.position.copy(_sun).multiplyScalar(180);
        live.update(now, performance.now());
        for (const e of entries) if (e.liveOK) live.posOf(e.data.norad, now, e.holder.position);
      } else {
        earthPivot.rotation.y += k * 0.06;
        earthFX.setSun(SUN_DIR, camera);
      }
      earthFX.drift(k);
      moonPivot.rotation.y += k * 0.04;
      for (const e of moving) {
        if (liveOn && e.liveOK) { e.model.rotation.y += k * 0.3; continue; }
        const d = e.data, o = d.orbit;
        e.angle += k * 2 * Math.PI / (o?.period ?? 60);
        if (d.type === 'leo') e.holder.position.set(o.a * Math.cos(e.angle), 0, -o.a * Math.sin(e.angle));
        else if (d.type === 'ellip') {
          const E = kepler(e.angle, o.ecc);
          e.holder.position.set(o.a * (Math.cos(E) - o.ecc), 0, -o.a * Math.sqrt(1 - o.ecc * o.ecc) * Math.sin(E));
        } else if (d.type === 'halo') e.holder.position.set(o.center, o.h * Math.cos(e.angle), o.h * 1.3 * Math.sin(e.angle));
        e.model.rotation.y += k * 0.3;
      }
    },
  };
}
