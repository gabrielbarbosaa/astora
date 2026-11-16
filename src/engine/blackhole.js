import * as THREE from 'three';

// Buraco negro "falso" em shader: sombra, anel de fótons, disco de acreção e o arco do disco
// curvado pela lente gravitacional. É um quadro (billboard) que sempre encara a câmera; a
// inclinação do disco vem do ângulo entre a câmera e o eixo de rotação (Y do mundo).
const EXT = 7; // metade do quadro, em raios do buraco negro

const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uInc, uSign, uRot, uTime;
  void main(){
    vec2 p = (vUv - 0.5) * 2.0 * ${EXT.toFixed(1)};
    float c = cos(uRot), s = sin(uRot);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);   // eixo de rotação para cima
    float r = length(p);

    float ratio = max(uInc, 0.07);
    vec2 q = vec2(p.x, p.y / ratio);
    float rq = length(q);
    float ang = atan(q.y, q.x);
    float turb = 0.65 + 0.35 * sin(ang * 7.0 + rq * 5.0 - uTime * 1.2) * sin(rq * 11.0 + ang * 3.0 + uTime * 0.7);

    // disco de acreção visto de frente (com efeito Doppler: lado que se aproxima é mais brilhante)
    float disc = smoothstep(1.7, 2.0, rq) * smoothstep(5.4, 3.0, rq);
    float dop = 1.0 + 0.75 * (p.x / max(rq, 0.5));
    vec3 hot = mix(vec3(1.0, 0.93, 0.75), vec3(1.0, 0.38, 0.08), smoothstep(1.8, 4.8, rq));
    vec3 emit = hot * disc * pow(2.0 / max(rq, 0.1), 1.6) * turb * dop * 2.2;

    // luz do lado de trás do disco, dobrada por cima (e por baixo) da sombra
    float lens = exp(-pow((r - 1.55) / 0.42, 2.0)) * (0.45 + 0.55 * smoothstep(-0.6, 1.0, p.y * uSign));
    emit += vec3(1.0, 0.72, 0.38) * lens * 0.7 * (0.6 + 0.4 * turb);

    // anel de fótons
    emit += vec3(1.0, 0.9, 0.7) * exp(-pow((r - 1.08) * 14.0, 2.0)) * 1.0;

    emit *= 0.9 / (1.0 + max(emit.r, max(emit.g, emit.b))); // comprime o brilho: abaixo do limiar do bloom, para não estourar a tela

    float shadow = 1.0 - smoothstep(0.98, 1.05, r);
    emit *= 1.0 - shadow;
    emit *= smoothstep(${EXT.toFixed(1)}, ${(EXT * 0.7).toFixed(1)}, r);

    float a = max(shadow, clamp(max(emit.r, max(emit.g, emit.b)), 0.0, 1.0));
    gl_FragColor = vec4(emit / max(a, 0.001), a);
  }`;

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const geo = new THREE.PlaneGeometry(1, 1);
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _a = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export function makeBlackHole(R, id) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uInc: { value: 0.3 }, uSign: { value: 1 }, uRot: { value: 0 }, uTime: { value: 0 } },
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 10; // por último, para a sombra cobrir o brilho da galáxia atrás
  m.scale.setScalar(R * EXT * 2);
  m.userData.id = id;
  m.userData.isBlackHole = true;
  return m;
}

export function updateBlackHole(m, camera, time) {
  m.parent.getWorldQuaternion(_q).invert();
  m.quaternion.copy(_q).multiply(camera.quaternion);   // encara a câmera
  m.getWorldPosition(_w);
  _v.copy(camera.position).sub(_w).normalize();        // direção até a câmera
  const dotUp = _v.dot(UP);
  // eixo de rotação projetado na tela
  _a.copy(UP).applyQuaternion(_q.copy(camera.quaternion).invert());
  const u = m.material.uniforms;
  u.uRot.value = Math.atan2(_a.x, _a.y);
  u.uInc.value = Math.abs(dotUp);
  u.uSign.value = dotUp >= 0 ? 1 : -1;
  u.uTime.value = time;
}
