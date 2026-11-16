import * as THREE from 'three';
import { bodies } from '../data/bodies.js';
import { textureFor, moonTexture, ringTexture, glowTexture, dotTexture } from '../textures.js';
import { circle, makeMarker, pickMesh, addSatellites, pointsMaterial } from '../engine/helpers.js';

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

  function makeSphere(d, R, kind) {
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
  function makeRing(R, { inner, outer, strength, seed }) {
    const geo = new THREE.RingGeometry(R * inner, R * outer, 160, 1);
    const p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() / R - inner) / (outer - inner), 0.5); }
    const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: ringTexture(strength, seed), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
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
      mesh.add(new THREE.PointLight(0xfff1dd, 4.5, 0, 0));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      glow.scale.setScalar(3.6);
      mesh.add(glow);
    }

    const e = { data: d, R, holder, mesh, orbit, ecc: d.ecc ?? 0, period: d.years ? periodOf(d.years) : 0, angle: Math.random() * Math.PI * 2, parent: null, moons: [], moonSystem: null, extent: R };
    if (d.au) {
      const line = d.ecc ? ellipseLine(orbit, d.ecc) : circle(orbit, 0x5f7fb8, 0.28, 360);
      pivot.add(line); orbitLines.push(line);
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
    entries.push(e); planets.push(e); byId[d.id] = e;
  }

  const _d = new THREE.Vector3();
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

  return {
    id: 'solar', group, entries, byId, list: bodies,
    home: new THREE.Vector3(0, 700, 1100), target: new THREE.Vector3(),
    near: 0.02, far: 14000, minDist: 4, maxDist: 3200,
    setOrbits: (v) => orbitLines.forEach((l) => (l.visible = v)),
    activeSystem(p) { for (const e of planets) if (e.moonSystem) e.moonSystem.visible = e === p; },
    update(k) {
      for (const e of entries) {
        if (e.period) { e.angle += (k * Math.PI * 2) / e.period; place(e); }
        if (e.isMoon) e.mesh.rotation.y = e.angle; // rotação sincronizada: mesma face para o planeta
        else if (!e.isStatic) e.mesh.rotation.y += k * e.data.spin * 2;
      }
      for (const s of spinners) s.rotation.y += k * 0.01;
    },
  };
}
