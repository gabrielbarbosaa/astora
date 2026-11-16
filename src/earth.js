import * as THREE from 'three';

// Terra realista: mapa de cores, relevo, oceano brilhante, nuvens e luzes de cidade só no lado noturno.
// Texturas em /public/textures/earth (carregadas uma vez e compartilhadas entre os níveis).
const BASE = import.meta.env.BASE_URL + 'textures/earth/';
const lowPower = matchMedia('(pointer: coarse)').matches;
const geo = lowPower ? new THREE.SphereGeometry(1, 64, 48) : new THREE.SphereGeometry(1, 96, 64);

let shared = null;
function loadMaps() {
  if (shared) return shared;
  const loader = new THREE.TextureLoader();
  const color = (name, srgb = true) => {
    const t = loader.load(BASE + name);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const maps = { day: color('earth_atmos_2048.jpg'), normal: color('earth_normal_2048.jpg', false), lights: color('earth_lights_2048.png'), clouds: color('earth_clouds_1024.png'), rough: null, listeners: [] };
  // o mapa "specular" (oceano = branco) vira rugosidade: oceano liso e brilhante, terra fosca
  loader.load(BASE + 'earth_specular_2048.jpg', (t) => {
    const img = t.image, c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      p[i] = p[i + 1] = p[i + 2] = 255 * (0.3 + 0.7 * (1 - p[i] / 255)); // oceano ≈ 0,3 · terra ≈ 1,0
    }
    g.putImageData(d, 0, 0);
    maps.rough = new THREE.CanvasTexture(c);
    maps.rough.anisotropy = 8;
    maps.listeners.forEach((fn) => fn());
  });
  return (shared = maps);
}

// Devolve { mesh, clouds, setSun, update }. `mesh` é uma esfera de raio 1 (escale ao usar).
export function createEarth() {
  const maps = loadMaps();
  const sunView = { value: new THREE.Vector3(1, 0, 0) };
  const mat = new THREE.MeshStandardMaterial({
    map: maps.day, normalMap: maps.normal, normalScale: new THREE.Vector2(1.4, 1.4),
    emissiveMap: maps.lights, emissive: new THREE.Color(1.0, 0.82, 0.55), emissiveIntensity: 1.1,
    roughness: 0.8, metalness: 0,
  });
  // luzes das cidades só no hemisfério escuro
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSunView = sunView;
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec3 uSunView;\nvoid main() {')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= 1.0 - smoothstep(-0.08, 0.22, dot(normal, uSunView));');
  };
  const apply = () => { if (maps.rough) { mat.roughnessMap = maps.rough; mat.needsUpdate = true; } };
  apply(); maps.listeners.push(apply);

  const mesh = new THREE.Mesh(geo, mat);

  const clouds = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: maps.clouds, transparent: true, opacity: 0.85, depthWrite: false, roughness: 1, metalness: 0,
  }));
  clouds.scale.setScalar(1.012);
  mesh.add(clouds);

  const _d = new THREE.Vector3();
  return {
    mesh, clouds,
    // `dirWorld`: direção da Terra até o Sol, em coordenadas do mundo
    setSun(dirWorld, camera) { sunView.value.copy(_d.copy(dirWorld).transformDirection(camera.matrixWorldInverse)); },
    drift(k) { clouds.rotation.y += k * 0.012; },
  };
}
