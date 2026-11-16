import * as THREE from 'three';
import { universe } from '../data/universe.js';
import { glowTexture, dotTexture } from '../textures.js';
import { galaxyGeometry, pointsMaterial, makeMarker, pickMesh } from '../engine/helpers.js';
import { makeBlackHole, updateBlackHole } from '../engine/blackhole.js';

const COLORS = {
  spiral: { core: '#ffe3b0', rim: '#9fc4ff' },
  lenticular: { core: '#ffe9c8', rim: '#ffd29a' },
  elliptical: { core: '#ffd9a0', rim: '#ffb070' },
  irregular: { core: '#cfe0ff', rim: '#9fc0ff' },
};

export function buildUniverse({ isMobile }) {
  const group = new THREE.Group();
  const entries = [], byId = {};
  const dotTex = dotTexture();
  const spinners = [];
  let bh = null;

  for (const d of universe) {
    const holder = new THREE.Group();
    const dir = new THREE.Vector3(...d.dir).normalize();
    holder.position.copy(dir.multiplyScalar(40 * Math.sqrt(d.dist)));
    group.add(holder);

    const body = new THREE.Group(); // inclinação da galáxia
    body.rotation.set(...d.tilt);
    holder.add(body);
    const n = Math.round((isMobile ? 0.4 : 1) * (d.R > 15 ? 5000 : d.R > 8 ? 3200 : 1800));
    const pts = new THREE.Points(
      galaxyGeometry({ n, radius: d.R, type: d.type, arms: 2, twist: 3.6, thick: d.type === 'lenticular' ? 0.1 : 0.05, bulge: d.type === 'lenticular' ? 0.5 : 0.25, sizeBase: d.R * 0.06, ...COLORS[d.type] }),
      pointsMaterial({ minPx: 1.3, maxPx: 8, alpha: 0.4 }),
    );
    pts.frustumCulled = false;
    body.add(pts); spinners.push(pts);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,230,190'), color: d.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.11 }));
    glow.scale.setScalar(d.R * 1.5);
    holder.add(glow);

    let mesh = pickMesh(d.R, d.id);
    if (d.black) { // M87*: buraco negro + jato (representação artística)
      bh = makeBlackHole(d.R * 0.07, d.id);
      holder.add(bh);
      for (const s of [1, -1]) {
        const jet = new THREE.Mesh(new THREE.ConeGeometry(d.R * 0.05, d.R * 1.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        jet.position.y = s * d.R * 0.8; jet.rotation.z = s > 0 ? Math.PI : 0;
        holder.add(jet);
      }
    }
    holder.add(mesh);
    const marker = makeMarker(dotTex, d.color, 0.012);
    marker.userData.id = d.id;
    holder.add(marker);
    entries.push({ data: d, R: d.R, mesh, marker, holder, extent: d.R, parent: null, moons: [], markerDist: d.R * 26 });
    byId[d.id] = entries[entries.length - 1];
  }

  // galáxias distantes de fundo: só pontos
  {
    const n = isMobile ? 500 : 1500;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = 450 + Math.random() * 900, u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(a), r * u * 0.7, r * s * Math.sin(a)], i * 3);
      c.setHSL(0.08 + Math.random() * 0.55, 0.5, 0.55); col.set([c.r, c.g, c.b], i * 3); size[i] = 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    const p = new THREE.Points(g, pointsMaterial({ minPx: 1.6, maxPx: 3, alpha: 0.6 }));
    p.frustumCulled = false;
    group.add(p);
  }

  return {
    id: 'universe', group, entries, byId, list: universe,
    home: new THREE.Vector3(0, 330, 640), target: new THREE.Vector3(70, 0, 0),
    near: 0.2, far: 12000, minDist: 4, maxDist: 2200,
    activeSystem() {},
    update(k, dt, camera, elapsed) {
      for (const s of spinners) s.rotation.y += k * 0.02;
      if (bh) updateBlackHole(bh, camera, elapsed);
    },
  };
}
