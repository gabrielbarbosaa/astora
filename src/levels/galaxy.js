import * as THREE from 'three';
import { galaxy } from '../data/galaxy.js';
import { glowTexture, dotTexture } from '../textures.js';
import { galaxyGeometry, pointsMaterial, makeMarker, pickMesh } from '../engine/helpers.js';
import { makeBlackHole, updateBlackHole } from '../engine/blackhole.js';

const SUN_DIST = 260; // 26.000 anos-luz / 100

// coordenadas galácticas (l, b, distância em anos-luz) vistas do Sol -> cena (centro na origem, Sol em +Z)
const fromSun = (l, b, ly) => {
  const L = (l * Math.PI) / 180, B = (b * Math.PI) / 180, d = ly / 100;
  return new THREE.Vector3(d * Math.cos(B) * Math.sin(L), d * Math.sin(B), SUN_DIST - d * Math.cos(B) * Math.cos(L));
};

export function buildGalaxy({ isMobile }) {
  const group = new THREE.Group();
  const entries = [], byId = {};
  const dotTex = dotTexture();
  const blackHoles = [];

  // A galáxia: ~4 braços, bojo central e halo de brilho
  const n = isMobile ? 22000 : 60000;
  const stars = new THREE.Points(galaxyGeometry({ n, radius: 500, arms: 4, twist: 3.1, thick: 0.035, bulge: 0.22, sizeBase: 1.5 }), pointsMaterial({ minPx: 1, maxPx: 10, alpha: 0.38 }));
  stars.frustumCulled = false;
  group.add(stars);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,205,140'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.3 }));
  halo.scale.setScalar(260);
  group.add(halo);
  const haloOuter = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('140,170,255'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.12 }));
  haloOuter.scale.setScalar(1100);
  group.add(haloOuter);

  for (const d of galaxy) {
    const pos = d.galPos === 'sun' ? new THREE.Vector3(0, 0, SUN_DIST) : d.pos ? new THREE.Vector3(...d.pos) : fromSun(...d.lbd);
    const holder = new THREE.Group();
    holder.position.copy(pos);
    group.add(holder);

    let mesh;
    if (d.black) {
      mesh = makeBlackHole(d.R, d.id);
      holder.add(mesh);
      blackHoles.push(mesh);
    } else {
      mesh = pickMesh(d.R, d.id);
      holder.add(mesh);
      if (d.id === 'sol') {
        const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,210,130'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        sun.scale.setScalar(d.R * 4);
        holder.add(sun);
      } else { // nebulosas / aglomerados: nuvens de brilho coloridas
        for (let i = 0; i < 5; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,255,255'), color: d.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.45 }));
          s.scale.setScalar(d.R * (1.6 + Math.random() * 1.4));
          s.position.set((Math.random() - 0.5) * d.R, (Math.random() - 0.5) * d.R * 0.6, (Math.random() - 0.5) * d.R);
          holder.add(s);
        }
        if (d.pulsar) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('160,220,255'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
          s.scale.setScalar(d.R * 0.9);
          holder.add(s);
        }
      }
    }
    const marker = makeMarker(dotTex, d.color, d.id === 'sol' ? 0.02 : 0.014);
    marker.userData.id = d.id;
    holder.add(marker);
    entries.push({ data: d, R: d.R, mesh, marker, holder, extent: d.R, parent: null, moons: [], markerDist: d.R * 40 });
    byId[d.id] = entries[entries.length - 1];
  }

  return {
    id: 'galaxy', group, entries, byId, list: galaxy,
    home: new THREE.Vector3(0, 650, 820), target: new THREE.Vector3(),
    near: 0.2, far: 12000, minDist: 3, maxDist: 3000,
    activeSystem() {},
    update(k, dt, camera, elapsed) {
      group.rotation.y += k * 0.004; // a galáxia gira devagar, levando tudo junto
      // perto do centro as partículas se acumulam: reduz o brilho para o buraco negro aparecer
      const near = THREE.MathUtils.clamp(camera.position.length() / 450, 0.1, 1);
      stars.material.uniforms.uAlpha.value = 0.38 * near;
      halo.material.opacity = 0.3 * near;
      for (const bh of blackHoles) updateBlackHole(bh, camera, elapsed);
    },
  };
}
