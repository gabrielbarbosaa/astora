import * as THREE from 'three';
import { pointsMaterial } from './engine/helpers.js';

// Satélites ao vivo: dados orbitais (TLE) públicos do CelesTrak + propagação SGP4 (satellite.js, carregado sob demanda).
// Os dados são atualizados a cada ~2 h (guardados no navegador). Nada do usuário é enviado.
export const KM_PER_UNIT = 6371 / 3; // a Terra tem raio 3 na cena

const url = (q) => `https://celestrak.org/NORAD/elements/gp.php?${q}&FORMAT=tle`;
const TTL = 2 * 3600 * 1000;

async function fetchTle(q, cache = true) {
  const key = 'astora.tle.' + q;
  if (cache) {
    try { const c = JSON.parse(localStorage.getItem(key)); if (c && Date.now() - c.ts < TTL) return c.t; } catch { /* sem cache */ }
  }
  const r = await fetch(url(q));
  if (!r.ok) throw new Error('CelesTrak ' + r.status);
  const t = await r.text();
  if (cache) { try { localStorage.setItem(key, JSON.stringify({ t, ts: Date.now() })); } catch { /* cota cheia */ } }
  return t;
}

function parseTle(text) {
  const L = text.split(/\r?\n/).map((s) => s.trimEnd()).filter(Boolean), out = [];
  for (let i = 0; i + 2 < L.length; i += 3) {
    if (L[i + 1].startsWith('1 ') && L[i + 2].startsWith('2 ')) out.push({ name: L[i].trim(), l1: L[i + 1], l2: L[i + 2], norad: parseInt(L[i + 1].slice(2, 7), 10) });
  }
  return out;
}

export function createLive(parent) {
  let sat = null;
  const layers = new Map();   // consulta -> { points, items, n, interval, next }
  const recs = new Map();     // norad -> { name, rec }
  const ensure = async () => { sat ??= await import('satellite.js'); };

  async function addGroup(query, color, { interval = 400, size = 0.03, minPx = 2, cache = true } = {}) {
    await ensure();
    if (layers.has(query)) return layers.get(query).n;
    const items = [];
    for (const t of parseTle(await fetchTle(query, cache))) {
      try { const rec = sat.twoline2satrec(t.l1, t.l2); items.push({ rec, norad: t.norad }); recs.set(t.norad, { name: t.name, rec }); } catch { /* TLE inválido */ }
    }
    const n = items.length, c = new THREE.Color(color), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n).fill(size), 1));
    const points = new THREE.Points(g, pointsMaterial({ minPx, maxPx: 4, alpha: 0.95 }));
    points.frustumCulled = false;
    parent.add(points);
    layers.set(query, { points, items, n, interval, next: 0 });
    return n;
  }
  function removeGroup(query) {
    const L = layers.get(query);
    if (!L) return;
    parent.remove(L.points); L.points.geometry.dispose();
    for (const it of L.items) recs.delete(it.norad);
    layers.delete(query);
  }
  async function addCatalog(norad) { // um satélite específico (Swift, TESS...)
    await ensure();
    if (recs.has(norad)) return true;
    try {
      const t = parseTle(await fetchTle('CATNR=' + norad))[0];
      if (t) { recs.set(norad, { name: t.name, rec: sat.twoline2satrec(t.l1, t.l2) }); return true; }
    } catch { /* indisponível */ }
    return false;
  }

  const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
  function update(date, now) { // reposiciona as nuvens de pontos (com intervalos diferentes por grupo)
    for (const L of layers.values()) {
      if (now < L.next) continue;
      L.next = now + L.interval;
      const pos = L.points.geometry.attributes.position.array;
      for (let i = 0; i < L.n; i++) {
        const pv = sat.propagate(L.items[i].rec, date), p = pv && pv.position;
        if (ok(p)) { pos[i * 3] = p.x / KM_PER_UNIT; pos[i * 3 + 1] = p.z / KM_PER_UNIT; pos[i * 3 + 2] = -p.y / KM_PER_UNIT; }
        else pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
      }
      L.points.geometry.attributes.position.needsUpdate = true;
    }
  }
  // quadro inercial (x = equinócio, z = norte) -> cena (y = norte)
  function posOf(norad, date, out) {
    const r = recs.get(norad);
    if (!r) return false;
    const pv = sat.propagate(r.rec, date), p = pv && pv.position;
    if (!ok(p)) return false;
    out.set(p.x / KM_PER_UNIT, p.z / KM_PER_UNIT, -p.y / KM_PER_UNIT);
    return true;
  }
  function info(norad, date) {
    const r = recs.get(norad);
    if (!r) return null;
    const pv = sat.propagate(r.rec, date);
    if (!pv || !ok(pv.position)) return null;
    const geo = sat.eciToGeodetic(pv.position, sat.gstime(date)), v = pv.velocity;
    return { lat: sat.degreesLat(geo.latitude), lon: sat.degreesLong(geo.longitude), alt: geo.height, kmh: Math.hypot(v.x, v.y, v.z) * 3600 };
  }
  const gmst = (date) => sat.gstime(date);
  function sunDir(date, out) { // direção Terra->Sol real (para o dia e a noite corretos)
    const s = sat.sunPos(sat.jday(date)).rsun;
    return out.set(s.x, s.z, -s.y).normalize();
  }
  return { addGroup, removeGroup, addCatalog, update, posOf, info, gmst, sunDir, has: (n) => recs.has(n), count: () => [...layers.values()].reduce((a, L) => a + L.n, 0), layers };
}
