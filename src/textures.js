import * as THREE from 'three';

// Texturas procedurais (sem baixar imagens). Depois podem ser trocadas por mapas reais da NASA.
const W = 1024, H = 512;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function canvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function finish(c, aniso = 4) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

function speckle(g, r, n, rgba, maxR, w = W, h = H) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = rgba(r());
    g.beginPath();
    g.arc(r() * w, r() * h, 1 + r() * maxR, 0, 7);
    g.fill();
  }
}

export function rockyTexture(base, seed = 1, craters = 220) {
  const [c, g] = canvas(); const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  speckle(g, r, 900, (v) => `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + r() * 0.06})`, 28);
  for (let i = 0; i < craters; i++) {
    const x = r() * W, y = r() * H, s = 2 + r() * r() * 22;
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.beginPath(); g.arc(x - s * 0.15, y - s * 0.15, s * 0.8, 0, 7); g.fill();
  }
  return finish(c);
}

// Versão pequena e barata para luas
export function moonTexture(base, seed = 1) {
  const [c, g] = canvas(256, 128); const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 256, 128);
  speckle(g, r, 160, (v) => `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${0.05 + r() * 0.08})`, 9, 256, 128);
  for (let i = 0; i < 40; i++) {
    const x = r() * 256, y = r() * 128, s = 1 + r() * r() * 7;
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  return finish(c, 2);
}

export function bandedTexture(colors, seed = 1, storm = false) {
  const [c, g] = canvas(); const r = rng(seed);
  const grad = g.createLinearGradient(0, 0, 0, H);
  colors.forEach((col, i) => grad.addColorStop(i / (colors.length - 1), col));
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { // faixas finas
    g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.07})`;
    g.fillRect(0, r() * H, W, 2 + r() * 14);
  }
  speckle(g, r, 400, () => `rgba(255,255,255,${r() * 0.05})`, 14);
  if (storm) {
    g.fillStyle = 'rgba(190,80,50,0.75)';
    g.beginPath(); g.ellipse(W * 0.3, H * 0.62, 46, 24, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,220,180,0.4)'; g.lineWidth = 3; g.stroke();
  }
  return finish(c);
}

export function earthTexture() {
  const [c, g] = canvas(); const r = rng(7);
  g.fillStyle = '#16478f'; g.fillRect(0, 0, W, H);
  speckle(g, r, 300, () => 'rgba(60,140,220,0.08)', 30);
  const land = ['#3f7d3a', '#5d9a45', '#8f8a52', '#2f6b34'];
  for (let k = 0; k < 14; k++) {
    const cx = r() * W, cy = H * (0.2 + r() * 0.6);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = land[(r() * 4) | 0];
      g.beginPath();
      g.arc(cx + (r() - 0.5) * 150, cy + (r() - 0.5) * 80, 6 + r() * 20, 0, 7);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.92)'; // gelo polar
  g.fillRect(0, 0, W, 22); g.fillRect(0, H - 26, W, 26);
  speckle(g, r, 60, () => 'rgba(255,255,255,0.1)', 40); // nuvens
  return finish(c);
}

export function sunTexture() {
  const [c, g] = canvas(); const r = rng(3);
  g.fillStyle = '#ffae2b'; g.fillRect(0, 0, W, H);
  speckle(g, r, 1200, (v) => (v > 0.5 ? 'rgba(255,230,120,0.18)' : 'rgba(210,90,10,0.16)'), 22);
  return finish(c);
}

// Textura radial de anel (1D). `strength` controla a opacidade geral (Saturno = 1, demais = sutis).
export function ringTexture(strength = 1, seed = 11) {
  const N = 512;
  const c = document.createElement('canvas'); c.width = N; c.height = 1;
  const g = c.getContext('2d'); const r = rng(seed);
  let a = 0.5;
  for (let x = 0; x < N; x++) {
    a = Math.max(0.1, Math.min(1, a + (r() - 0.5) * 0.35)); // variação suave de faixas
    const t = x / N;
    const gap = t > 0.38 && t < 0.43 ? 0.08 : 1; // divisão de Cassini
    const edge = Math.min(1, t / 0.06) * Math.min(1, (1 - t) / 0.06);
    const alpha = a * gap * edge * strength * 0.9;
    g.fillStyle = `rgba(214,195,150,${alpha})`; g.fillRect(x, 0, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function glowTexture(color = '255,170,60') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${color},0.95)`); gr.addColorStop(0.25, `rgba(${color},0.35)`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Ponto nítido usado como marcador de planetas distantes
export function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export const textureFor = {
  terra: () => earthTexture(),
  lua: () => moonTexture('#9b9b9b', 5),
  mercurio: () => rockyTexture('#8d867e', 2, 260),
  venus: () => bandedTexture(['#e9cf9a', '#d2a964', '#ecd6a4', '#c99b5c'], 4),
  sol: () => sunTexture(),
  marte: () => rockyTexture('#b9532f', 9, 120),
  jupiter: () => bandedTexture(['#c99a6b', '#efe0c8', '#b97d4c', '#e6d3b4', '#a86f45', '#efe0c8'], 6, true),
  saturno: () => bandedTexture(['#d9c28a', '#ecdcb0', '#cdb078', '#e8d6a2'], 8),
  urano: () => bandedTexture(['#a4e6e8', '#86d3d8', '#a4e6e8'], 12),
  netuno: () => bandedTexture(['#3f5fd0', '#5a7cf0', '#3350b8', '#4a68d8'], 13),
};
