import * as THREE from 'three';

// Escala em pixels para partículas (atualizada no resize)
export const px = { value: 1000 };
export function setPxScale(heightPx, fovDeg) {
  px.value = heightPx / 2 / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
}

// Material de partículas: pontos suaves, aditivos, com tamanho mínimo/máximo em pixels
export function pointsMaterial({ minPx = 1.2, maxPx = 40, alpha = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: px, uMinPx: { value: minPx }, uMaxPx: { value: maxPx }, uAlpha: { value: alpha } },
    vertexShader: `
      attribute float size; attribute vec3 color; varying vec3 vColor;
      uniform float uScale, uMinPx, uMaxPx;
      void main(){
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(size * uScale / max(-mv.z, 0.001), uMinPx, uMaxPx);
      }`,
    fragmentShader: `
      varying vec3 vColor; uniform float uAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * uAlpha);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) * 1.7; };

// Gera partículas de galáxia: 'spiral' | 'lenticular' | 'elliptical' | 'irregular'
export function galaxyGeometry(o) {
  const { n, radius: R, type = 'spiral', arms = 4, twist = 3.4, thick = 0.05, bulge = 0.2, sizeBase = 1 } = o;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
  const cCore = new THREE.Color(o.core ?? '#ffe3b0'), cRim = new THREE.Color(o.rim ?? '#9fc4ff'), c = new THREE.Color();
  const clumps = Array.from({ length: 6 }, () => [gauss() * R * 0.4, gauss() * R * 0.12, gauss() * R * 0.4]);
  for (let i = 0; i < n; i++) {
    let x, y, z, t;
    if (type === 'elliptical') {
      x = gauss() * R * 0.38; y = gauss() * R * 0.26; z = gauss() * R * 0.32; t = Math.min(1, Math.hypot(x, y, z) / R);
    } else if (type === 'irregular') {
      const k = clumps[(Math.random() * 6) | 0];
      x = k[0] + gauss() * R * 0.22; y = k[1] + gauss() * R * 0.12; z = k[2] + gauss() * R * 0.22; t = Math.min(1, Math.hypot(x, y, z) / R);
    } else if (Math.random() < bulge) {
      x = gauss() * R * 0.12; y = gauss() * R * 0.09; z = gauss() * R * 0.12; t = 0.05;
    } else {
      const rr = Math.pow(Math.random(), 0.65) * R; t = rr / R;
      let a = Math.random() * Math.PI * 2;
      if (type === 'spiral' && Math.random() > 0.15) a = Math.floor(Math.random() * arms) * ((Math.PI * 2) / arms) + t * twist + gauss() * (0.28 - 0.12 * t);
      x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = gauss() * R * thick * (1 - 0.5 * t);
    }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    c.copy(cCore).lerp(cRim, Math.min(1, t * 1.2)).multiplyScalar(0.5 + Math.random() * 0.5);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = sizeBase * (0.6 + Math.random() * 1.1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  return g;
}

export function circle(radius, color, opacity, seg = 256) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

// Marcador de tamanho constante na tela (para astros minúsculos vistos de longe)
export function makeMarker(tex, color, scale) {
  const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, sizeAttenuation: false }));
  mk.scale.setScalar(scale);
  return mk;
}

// Malha invisível, usada apenas para o clique (raycast)
const pickGeo = new THREE.SphereGeometry(1, 12, 8);
export function pickMesh(R, id) {
  const m = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
  m.scale.setScalar(R);
  m.userData.id = id;
  return m;
}

// Luas / planetas orbitando um astro; só aparecem quando o astro é selecionado
export function addSatellites({ d, e, holder, R, entries, byId, sizeOf, makeBody }) {
  if (!d.moons?.length) return;
  const ms = new THREE.Group();
  ms.rotation.x = 0.06; ms.visible = false;
  holder.add(ms);
  e.moonSystem = ms;
  for (const m of d.moons) {
    const mR = sizeOf(m);
    const mOrbit = R * m.a;
    const mm = makeBody(m, mR);
    ms.add(mm);
    ms.add(circle(mOrbit, 0x9db8ee, 0.35, 96));
    const me = { data: m, R: mR, mesh: mm, orbit: mOrbit, period: m.period, angle: Math.random() * Math.PI * 2, parent: e, isMoon: true, extent: mR };
    e.moons.push(me); entries.push(me); byId[m.id] = me;
    e.extent = Math.max(e.extent, mOrbit);
  }
}
