import * as THREE from 'three';
import { stars } from '../data/stars.js';
import { glowTexture, dotTexture, moonTexture } from '../textures.js';
import { circle, makeMarker, addSatellites } from '../engine/helpers.js';

const sphere = new THREE.SphereGeometry(1, 32, 24);

// ascensão reta (h), declinação (°), distância (anos-luz) -> posição na cena
const toPos = (ra, dec, d) => {
  const a = (ra * 15 * Math.PI) / 180, b = (dec * Math.PI) / 180;
  return new THREE.Vector3(d * Math.cos(b) * Math.cos(a), d * Math.sin(b), -d * Math.cos(b) * Math.sin(a));
};

export function buildStars() {
  const group = new THREE.Group();
  const entries = [], byId = {};
  const dotTex = dotTexture();

  // anéis de distância (5, 10, 25, 50, 100 anos-luz) no plano equatorial + linhas até o Sol
  for (const r of [5, 10, 25, 50, 100]) group.add(circle(r, 0x6f8fc8, 0.18, 192));
  const lines = [];

  function starMat(d) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color).multiplyScalar(1.7) }); }
  function makeBody(m, mR) {
    const mesh = m.star
      ? new THREE.Mesh(sphere, starMat(m))
      : new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ map: moonTexture(m.color, 3), roughness: 0.9 }));
    mesh.scale.setScalar(mR);
    mesh.userData.id = m.id;
    return mesh;
  }

  for (const d of stars) {
    const holder = new THREE.Group();
    holder.position.copy(d.dist ? toPos(d.ra, d.dec, d.dist) : new THREE.Vector3());
    group.add(holder);
    const mesh = new THREE.Mesh(sphere, starMat(d));
    mesh.scale.setScalar(d.r);
    mesh.userData.id = d.id;
    holder.add(mesh);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,210,150'), color: d.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
    glow.scale.setScalar(d.r * 7);
    holder.add(glow);
    if (d.moons?.length) holder.add(new THREE.PointLight(0xffffff, 3, 0, 0));
    const marker = makeMarker(dotTex, d.color, d.id === 'sol' ? 0.026 : 0.016);
    marker.userData.id = d.id;
    holder.add(marker);

    const e = { data: d, R: d.r, mesh, marker, holder, extent: d.r, parent: null, moons: [], moonSystem: null, markerDist: d.r * 30 };
    addSatellites({ d, e, holder, R: d.r, entries, byId, sizeOf: (m) => m.r ?? 0.05, makeBody });
    entries.push(e); byId[d.id] = e;
    if (d.dist) lines.push(new THREE.Vector3(), holder.position.clone());
  }
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines), new THREE.LineBasicMaterial({ color: 0x6f8fc8, transparent: true, opacity: 0.12, depthWrite: false })));

  return {
    id: 'stars', group, entries, byId, list: stars,
    home: new THREE.Vector3(0, 70, 190), target: new THREE.Vector3(),
    near: 0.05, far: 8000, minDist: 1.2, maxDist: 600,
    activeSystem(p) { for (const e of entries) if (e.moonSystem) e.moonSystem.visible = e === p; },
    update(k) {
      for (const e of entries) {
        if (!e.isMoon) continue;
        e.angle += (k * Math.PI * 2) / e.period;
        e.mesh.position.set(Math.cos(e.angle) * e.orbit, 0, -Math.sin(e.angle) * e.orbit);
        e.mesh.rotation.y = e.angle;
      }
    },
  };
}
