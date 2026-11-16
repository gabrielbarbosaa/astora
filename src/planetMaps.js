import * as THREE from 'three';

// Texturas reais dos astros (public/textures/planets). Carregadas sob demanda: o astro começa com a
// textura procedural e troca para a real quando a câmera chega perto (economiza rede e memória de vídeo).
const BASE = import.meta.env.BASE_URL + 'textures/planets/';
const loader = new THREE.TextureLoader();

export const REAL = {
  sol: '2k_sun.jpg',
  mercurio: '2k_mercury.jpg',
  venus: '2k_venus_atmosphere.jpg',
  urano: '2k_uranus.jpg',
  netuno: '2k_neptune.jpg',
  lua: '2k_moon.jpg',
  marte: '2k_mars.jpg',
  jupiter: '2k_jupiter.jpg',
  saturno: '2k_saturn.jpg',
};

function tex(file, anisotropy = 8) {
  const t = loader.load(BASE + file);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

// Devolve uma função que troca o mapa do material pela textura real (ou null se não houver arquivo)
export function upgradeFor(mesh, id) {
  const file = REAL[id];
  if (!file) return null;
  return () => {
    const t = loader.load(BASE + file, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      const m = mesh.material;
      m.map?.dispose();
      m.map = t;
      m.needsUpdate = true;
    });
    return t;
  };
}

export const ringMap = (file) => tex(file, 4);
