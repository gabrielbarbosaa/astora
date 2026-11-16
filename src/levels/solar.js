import * as THREE from 'three';
import { bodies } from '../data/bodies.js';
import { textureFor, moonTexture, ringTexture, glowTexture, dotTexture } from '../textures.js';
import { circle, makeMarker, pickMesh, addSatellites, pointsMaterial } from '../engine/helpers.js';
import { createEarth } from '../earth.js';
import { upgradeFor, ringMap } from '../planetMaps.js';
import { satModel } from './telescopes.js';

// ---- Escala ---------------------------------------------------------------
// Distâncias (UA) e diâmetros (km) são proporcionais entre si. O Sol é desenhado menor que o real.
export const AU = 16;           // unidades de cena por UA
const R_EARTH = 0.35;           // raio da Terra em unidades de cena
const SUN_R = 4.2;
const radiusOf = (km) => (R_EARTH * km) / 12742;
const periodOf = (years) => 20 * Math.pow(years, 0.6); // segundos por volta em 1x (comprimido, mantém a ordem)

const sphereHi = new THREE.SphereGeometry(1, 64, 48);
const sphereLo = new THREE.SphereGeometry(1, 32, 24);
const sphereTiny = new THREE.SphereGeometry(1, 20, 14);
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.7;

export function buildSolar() {
  const group = new THREE.Group();
  const entries = [], planets = [], byId = {}, orbitLines = [], spinners = [];
  const dotTex = dotTexture();
  let seedN = 1;

  let earthFX = null;
  function makeSphere(d, R, kind) {
    if (d.id === 'terra') { // Terra realista (texturas reais)
      earthFX = createEarth();
      earthFX.mesh.scale.setScalar(R);
      earthFX.mesh.userData.id = d.id;
      return earthFX.mesh;
    }
    let mat;
    if (d.star) mat = new THREE.MeshBasicMaterial({ map: textureFor.sol(), color: new THREE.Color(1.6, 1.3, 1.0) });
    else {
      const map = textureFor[d.id] ? textureFor[d.id]() : moonTexture(d.color, seedN++ * 7);
      mat = new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0 });
    }
    const mesh = new THREE.Mesh(kind === 'moon' || R < 0.2 ? sphereTiny : R >= 1 ? sphereHi : sphereLo, mat);
    mesh.scale.setScalar(R);
    mesh.userData.id = d.id;
    return mesh;
  }

  // Anel no plano equatorial do planeta (não gira junto com a superfície)
  function makeRing(R, { inner, outer, strength, seed, file }) {
    const geo = new THREE.RingGeometry(R * inner, R * outer, 160, 1);
    const p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() / R - inner) / (outer - inner), 0.5); }
    const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: file ? ringMap(file) : ringTexture(strength, seed), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    return ring;
  }

  function ellipseLine(a, ecc) {
    const b = a * Math.sqrt(1 - ecc * ecc), pts = [];
    for (let i = 0; i < 360; i++) { const E = (i / 360) * Math.PI * 2; pts.push(new THREE.Vector3(a * (Math.cos(E) - ecc), 0, -b * Math.sin(E))); }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5f7fb8, transparent: true, opacity: 0.28, depthWrite: false }));
  }

  for (const d of bodies) {
    // Cinturões: nuvem de partículas + ponto de clique estático
    if (d.belt) {
      const b = d.belt;
      const pos = new Float32Array(b.count * 3), col = new Float32Array(b.count * 3), size = new Float32Array(b.count);
      const base = new THREE.Color(d.color), c = new THREE.Color();
      for (let i = 0; i < b.count; i++) {
        const r = AU * (b.inner + (b.outer - b.inner) * Math.pow(Math.random(), 0.85)), a = Math.random() * Math.PI * 2;
        pos.set([Math.cos(a) * r, gauss() * r * b.thick * 0.5, Math.sin(a) * r], i * 3);
        c.copy(base).multiplyScalar(0.35 + Math.random() * 0.6);
        col.set([c.r, c.g, c.b], i * 3); size[i] = b.size * (0.6 + Math.random());
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
      const pts = new THREE.Points(geo, pointsMaterial({ minPx: 1.1, maxPx: 6, alpha: 0.85 }));
      pts.frustumCulled = false;
      group.add(pts); spinners.push(pts);
      const width = (b.outer - b.inner) * AU, R = width * 0.12;
      const mesh = pickMesh(R, d.id);
      mesh.position.set(AU * (b.inner + b.outer) / 2, 0, 0);
      group.add(mesh);
      const marker = makeMarker(dotTex, d.color, 0.01); marker.userData.id = d.id; mesh.add(marker); marker.scale.setScalar(0.01 / R);
      const e = { data: d, R, mesh, marker, markerDist: R * 18, extent: R, parent: null, moons: [], isStatic: true };
      entries.push(e); planets.push(e); byId[d.id] = e;
      continue;
    }

    // Sondas que saíram do Sistema Solar (Voyager, New Horizons): posição aproximada ao longo de uma direção fixa
    if (d.probe) {
      const P = d.probe, s = 0.5, lon = (P.lon * Math.PI) / 180, lat = (P.lat * Math.PI) / 180;
      const dir = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
      const holder = new THREE.Group();
      group.add(holder);
      const model = satModel('voyager', d.color);
      model.scale.setScalar(s);
      holder.add(model);
      const mesh = pickMesh(s * 1.8, d.id);
      holder.add(mesh);
      const mk = makeMarker(dotTex, d.color, 0.014);
      mk.userData.id = d.id;
      holder.add(mk);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir]), new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.35, depthWrite: false }));
      group.add(line);
      const e = { data: d, R: s * 1.2, mesh, holder, model, marker: mk, markerDist: 25, extent: s * 1.2, parent: null, moons: [], isProbe: true, probeDir: dir, probeLine: line };
      entries.push(e); planets.push(e); byId[d.id] = e;
      continue;
    }

    const R = d.visualR ?? (d.star ? SUN_R : radiusOf(d.km));
    const orbit = AU * d.au;
    const pivot = new THREE.Group();          // inclinação do plano orbital
    pivot.rotation.x = d.tilt;
    group.add(pivot);
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
      mesh.add(new THREE.PointLight(0xfff1dd, 2.6, 0, 0));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      glow.scale.setScalar(3.6);
      mesh.add(glow);
    }

    const e = { data: d, R, holder, mesh, pivot, tiltG, orbit, ecc: d.ecc ?? 0, period: d.years ? periodOf(d.years) : 0, angle: Math.random() * Math.PI * 2, parent: null, moons: [], moonSystem: null, extent: R };
    if (d.au) {
      const line = d.ecc ? ellipseLine(orbit, d.ecc) : circle(orbit, 0x5f7fb8, 0.28, 360);
      pivot.add(line); orbitLines.push(line);
      e.simLine = line;
    }
    if (d.au || d.star) {
      const mk = makeMarker(dotTex, d.color, d.star ? 0.03 : 0.012);
      mk.userData.id = d.id;
      tiltG.add(mk);
      e.marker = mk;
    }
    if (d.kind === 'Cometa') { // cauda: sempre aponta para longe do Sol
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      holder.add(tail);
      e.tail = tail;
    }

    addSatellites({
      d, e, holder, R, entries, byId,
      sizeOf: (m) => Math.max(radiusOf(m.km), 0.03), // luas minúsculas ganham um tamanho mínimo visível
      makeBody: (m, mR) => makeSphere(m, mR, 'moon'),
    });
    if (d.id === 'terra') e.earthFX = earthFX;
    e.upgrade = upgradeFor(mesh, d.id);
    for (const m of e.moons) m.upgrade = upgradeFor(m.mesh, m.data.id);
    entries.push(e); planets.push(e); byId[d.id] = e;
  }

  const _d = new THREE.Vector3(), _s = new THREE.Vector3();
  function place(e) {
    if (e.isMoon) { e.mesh.position.set(Math.cos(e.angle) * e.orbit, 0, -Math.sin(e.angle) * e.orbit); return; }
    if (e.isStatic) return;
    if (e.ecc) { // equação de Kepler: o Sol fica em um dos focos
      let E = e.angle;
      for (let i = 0; i < 6; i++) E = e.angle + e.ecc * Math.sin(E);
      e.holder.position.set(e.orbit * (Math.cos(E) - e.ecc), 0, -e.orbit * Math.sqrt(1 - e.ecc * e.ecc) * Math.sin(E));
      if (e.tail) {
        const dist = e.holder.position.length() / AU;
        const L = THREE.MathUtils.clamp(70 / (dist + 0.3), 0.6, 45);
        _d.copy(e.holder.position).normalize();
        e.tail.scale.set(Math.min(L * 0.18, 3), L, Math.min(L * 0.18, 3));
        e.tail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _d);
        e.tail.position.copy(_d).multiplyScalar(L / 2);
        e.tail.material.opacity = THREE.MathUtils.clamp(0.55 - dist * 0.025, 0.05, 0.4);
      }
    } else e.holder.position.set(Math.cos(e.angle) * e.orbit, 0, -Math.sin(e.angle) * e.orbit);
  }
  for (const e of entries) if (e.orbit || e.isMoon) place(e);

  // ---- Modo "Hoje": posições reais dos planetas (Astronomy Engine, carregado só quando ativado) ----
  const real = { on: false, date: new Date(), Astro: null, rate: 1 / 86400, eff: 0, hud: null }; // padrão: tempo real (1 segundo por segundo); rate = dias simulados por segundo
  const BODY = { mercurio: 'Mercury', venus: 'Venus', terra: 'Earth', marte: 'Mars', jupiter: 'Jupiter', saturno: 'Saturn', urano: 'Uranus', netuno: 'Neptune', plutao: 'Pluto' };
  const cE = Math.cos((23.4392911 * Math.PI) / 180), sE = Math.sin((23.4392911 * Math.PI) / 180);
  const HALLEY_T0 = Date.UTC(1986, 1, 9), HALLEY_P = 75.32 * 365.25 * 86400000; // periélio de 1986
  const PROBE_T0 = Date.UTC(2026, 10, 16);                                        // data de referência das sondas
  const realBodies = entries.filter((e) => BODY[e.data.id]);
  const moonE = byId.lua;
  const realLines = [];
  let orbitsOn = true;
  // vetor equatorial J2000 (UA) -> cena (eclíptica: x, y = norte, z = -y_ecl)
  const toScene = (v, k, out) => out.set(v.x * k, (-v.y * sE + v.z * cE) * k, -(v.y * cE + v.z * sE) * k);
  const safeVec = (body, date) => { try { return real.Astro.HelioVector(body, date); } catch { return null; } };

  function applyOrbitVisibility() {
    for (const e of entries) if (e.simLine) e.simLine.visible = orbitsOn && !(real.on && e.realDriven);
    for (const l of realLines) l.visible = orbitsOn && real.on;
  }
  function buildRealLines() { // elipses reais: uma volta completa em torno da data atual
    for (const l of realLines) { group.remove(l); l.geometry.dispose(); }
    realLines.length = 0;
    const A = real.Astro;
    for (const e of realBodies) {
      const body = A.Body[BODY[e.data.id]], P = A.PlanetOrbitalPeriod(body), pts = [];
      for (let i = 0; i < 240; i++) {
        const v = safeVec(body, new Date(real.date.getTime() + (i / 240 - 0.5) * P * 86400000));
        if (!v) { pts.length = 0; break; }
        pts.push(toScene(v, AU, new THREE.Vector3()));
      }
      if (pts.length < 100) continue;
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x5f7fb8, transparent: true, opacity: 0.28, depthWrite: false }));
      group.add(line); realLines.push(line);
    }
  }
  const _m = new THREE.Vector3(), _dir = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1);

  // ---- Terra real: eixo inclinado e rotação pelo tempo sideral; sombra da Lua; fases e eclipses ----
  const KM_AU = 149597870.7, R_EARTH_KM = 6371, R_MOON_KM = 1737, R_SUN_KM = 696000;
  const EPS = (23.4392911 * Math.PI) / 180;
  const earthE = byId.terra;
  const ERA = (date) => { // ângulo de rotação da Terra (radianos)
    const jd = date.getTime() / 86400000 + 2440587.5;
    return 2 * Math.PI * ((0.779057273264 + 1.00273781191135448 * (jd - 2451545)) % 1);
  };
  const spot = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({
    map: (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.1, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.17, 'rgba(0,0,0,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })(), transparent: true, depthWrite: false,
  }));
  spot.visible = false;
  earthE.holder.add(spot);
  const PHASES = [['Lua nova', '🌑'], ['Lua crescente', '🌒'], ['Quarto crescente', '🌓'], ['Crescente gibosa', '🌔'], ['Lua cheia', '🌕'], ['Minguante gibosa', '🌖'], ['Quarto minguante', '🌗'], ['Lua minguante', '🌘']];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  function applyReal() {
    const A = real.Astro, d = real.date;
    for (const e of realBodies) {
      const v = safeVec(A.Body[BODY[e.data.id]], d);
      if (v) toScene(v, AU, e.holder.position);
    }
    // eixo da Terra inclinado como na realidade; a rotação só segue o relógio quando o tempo passa devagar (senão pisca)
    earthE.tiltG.rotation.set(-EPS, 0, 0);
    if (real.eff <= 1.5) earthE.mesh.rotation.y = ERA(d);
    if (!moonE) return;
    try {
      const m = A.GeoMoon(d), E = A.HelioVector(A.Body.Earth, d);
      toScene(m, 1, _m).normalize(); // só a direção real da Lua; a distância na cena é estilizada
      moonE.mesh.position.copy(_m).multiplyScalar(moonE.orbit);
      moonE.angle = Math.atan2(-_m.z, _m.x);

      // geometria Sol-Terra-Lua em km (vetores equatoriais J2000)
      const sd = Math.hypot(E.x, E.y, E.z), sx = -E.x / sd, sy = -E.y / sd, sz = -E.z / sd; // direção Terra->Sol
      const mx = m.x * KM_AU, my = m.y * KM_AU, mz = m.z * KM_AU, md2 = mx * mx + my * my + mz * mz;
      const t = mx * sx + my * sy + mz * sz, rho = Math.sqrt(Math.max(0, md2 - t * t));
      let event = '';

      // eclipse lunar: a Lua entra no cone de sombra da Terra
      let cu = 0, cp = 0;
      if (t < 0) {
        const L = -t, Ru = R_EARTH_KM - (L * (R_SUN_KM - R_EARTH_KM)) / KM_AU, Rp = R_EARTH_KM + (L * (R_SUN_KM + R_EARTH_KM)) / KM_AU;
        cu = clamp01((Ru + R_MOON_KM - rho) / (2 * R_MOON_KM));
        cp = clamp01((Rp + R_MOON_KM - rho) / (2 * R_MOON_KM));
        if (cu > 0.04) event = cu > 0.97 ? 'Eclipse lunar total' : 'Eclipse lunar parcial';
      }
      const dim = 1 - 0.3 * cp;
      moonE.mesh.material.color.setRGB(dim + (0.3 - dim) * cu, dim + (0.1 - dim) * cu, dim + (0.06 - dim) * cu); // cobre avermelhado no total

      // eclipse solar: onde a sombra da Lua cai sobre a Terra
      let strength = 0;
      if (t > 0 && rho < R_EARTH_KM + 3600) {
        let px, py, pz;
        if (rho < R_EARTH_KM) {
          const tau = t - Math.sqrt(R_EARTH_KM * R_EARTH_KM - rho * rho);
          px = mx - tau * sx; py = my - tau * sy; pz = mz - tau * sz; strength = 1;
          event = 'Sombra da Lua sobre a Terra (eclipse solar)';
        } else {
          px = mx - t * sx; py = my - t * sy; pz = mz - t * sz; strength = 0.8 * clamp01(1 - (rho - R_EARTH_KM) / 3600);
        }
        const pl = Math.hypot(px, py, pz) || 1;
        toScene({ x: px / pl, y: py / pl, z: pz / pl }, 1, _dir).normalize();
        spot.position.copy(_dir).multiplyScalar(earthE.R * 1.004);
        spot.quaternion.setFromUnitVectors(_z, _dir);
        spot.scale.setScalar(earthE.R * 0.55); // penumbra ≈ 3.500 km
        spot.material.opacity = strength;
      }
      spot.visible = strength > 0.02;

      const ph = A.MoonPhase(d);
      // os "quartos" valem só perto dos 90° e 270°; entre eles a Lua é crescente/minguante ou gibosa
      const [name, emoji] = PHASES[ph < 3 || ph >= 357 ? 0 : ph < 87 ? 1 : ph < 93 ? 2 : ph < 177 ? 3 : ph < 183 ? 4 : ph < 267 ? 5 : ph < 273 ? 6 : 7];
      real.hud = { text: `${emoji} ${name} · ${Math.round(((1 - Math.cos((ph * Math.PI) / 180)) / 2) * 100)}% iluminada`, event };
    } catch (err) { if (!real.warned) { real.warned = true; console.warn('Modo Hoje: falha ao calcular Lua/eclipses', err); } }
  }

  // próximos eclipses (3 anos à frente), para o seletor da barra do tempo
  function eclipseList() {
    const A = real.Astro, out = [], kind = { total: 'total', partial: 'parcial', annular: 'anular', penumbral: 'penumbral' };
    try {
      let l = A.SearchLunarEclipse(real.date), s = A.SearchGlobalSolarEclipse(real.date);
      for (let i = 0; i < 4; i++) {
        out.push({ label: `Lunar ${kind[l.kind] ?? l.kind}`, date: l.peak.date });
        out.push({ label: `Solar ${kind[s.kind] ?? s.kind}`, date: s.peak.date });
        l = A.NextLunarEclipse(l.peak); s = A.NextGlobalSolarEclipse(s.peak);
      }
    } catch { /* sem dados */ }
    return out.sort((a, b) => a.date - b.date);
  }
  async function setRealTime(on, date) {
    if (on && !real.Astro) real.Astro = await import('astronomy-engine');
    real.on = on;
    if (on) {
      if (date) real.date = new Date(date);
      buildRealLines();
      for (const e of realBodies) { e.pivot.rotation.x = 0; e.realDriven = true; }
      if (moonE) moonE.realDriven = true;
      applyReal();
    } else {
      for (const e of realBodies) { e.pivot.rotation.x = e.data.tilt; e.realDriven = false; place(e); }
      earthE.tiltG.rotation.set(0, 0, earthE.data.axisTilt ?? 0); // volta ao eixo estilizado
      spot.visible = false; real.hud = null;
      if (moonE) { moonE.realDriven = false; place(moonE); moonE.mesh.material.color.setRGB(1, 1, 1); }
    }
    applyOrbitVisibility();
  }

  return {
    id: 'solar', group, entries, byId, list: bodies,
    home: new THREE.Vector3(0, 700, 1100), target: new THREE.Vector3(),
    near: 0.02, far: 14000, minDist: 4, maxDist: 5600,
    setOrbits: (v) => { orbitsOn = v; applyOrbitVisibility(); },
    setRealTime,
    setDate(d) { real.date = new Date(d); if (real.on) applyReal(); },
    setRate(r) { real.rate = r; },
    getDate: () => (real.on ? real.date : null),
    getHud: () => (real.on ? real.hud : null),
    getEclipses: () => (real.on ? eclipseList() : []),
    activeSystem(p) { for (const e of planets) if (e.moonSystem) e.moonSystem.visible = e === p; },
    update(k, dt, camera, elapsed, rawDt = dt) {
      // no modo real: dias simulados por segundo = rate × velocidade, seguindo o relógio de verdade (sem o limite por quadro)
      const spd = dt > 0 ? k / dt : 0;
      const dDays = real.on ? spd * Math.min(rawDt, 5) * real.rate : 0;
      real.eff = spd * real.rate;
      if (real.on) real.date = new Date(real.date.getTime() + dDays * 86400000);
      for (const e of entries) {
        if (e.earthFX) { // o Sol está na origem: a direção até ele é o oposto da posição da Terra
          e.mesh.getWorldPosition(_s);
          e.earthFX.setSun(_s.negate().normalize(), camera);
          e.earthFX.drift(k);
        }
        if (e.isProbe) { // sondas: se afastam em linha reta (posição aproximada)
          const P = e.data.probe;
          let dist = P.d0, vis = true;
          if (real.on) {
            dist = P.d0 + (P.v * (real.date.getTime() - PROBE_T0)) / (365.25 * 86400000);
            vis = real.date.getTime() >= Date.parse(P.launch) && dist > 6;
          }
          e.hide = !vis; e.holder.visible = vis; e.probeLine.visible = vis;
          e.holder.position.copy(e.probeDir).multiplyScalar(dist * AU);
          e.probeLine.scale.setScalar(Math.max(dist, 0.01) * AU);
          e.model.rotation.y += k * 0.2;
          continue;
        }
        if (real.on && !e.isMoon && e.data.years && !e.realDriven) { // Ceres, Éris e Halley: movimento real, posição aproximada
          if (e.data.id === 'halley') e.angle = (2 * Math.PI * (real.date.getTime() - HALLEY_T0)) / HALLEY_P;
          else e.angle += (2 * Math.PI * dDays) / (365.25 * e.data.years);
          place(e);
        } else if (e.period && !(real.on && e.realDriven)) { e.angle += (k * Math.PI * 2) / e.period; place(e); }
        if (e.isMoon) e.mesh.rotation.y = e.angle + Math.PI; // rotação sincronizada: mesma face para o planeta
        else if (!e.isStatic) e.mesh.rotation.y += k * e.data.spin * 2;
      }
      if (real.on) applyReal();
      for (const s of spinners) s.rotation.y += k * 0.01;
    },
  };
}
