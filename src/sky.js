import { SKY_STARS, SKY_CONSTELLATIONS, SKY_CITIES } from './data/sky.js';

// "Meu céu hoje": planetário em 2D (projeção estereográfica) do céu visível de um lugar, em qualquer horário.
// Usa o Astronomy Engine (carregado sob demanda). A localização nunca sai do navegador.
const $ = (s) => document.querySelector(s);
const DEG = Math.PI / 180;
const STARS = Object.fromEntries(SKY_STARS.map((s) => [s[0], { id: s[0], name: s[1], ra: s[2], dec: s[3], mag: s[4] }]));
const BODIES = [
  ['Sun', 'Sol', '#ffd25a'], ['Moon', 'Lua', '#e8e8ee'], ['Mercury', 'Mercúrio', '#d2cbbd'], ['Venus', 'Vênus', '#fff3c9'],
  ['Mars', 'Marte', '#ff8466'], ['Jupiter', 'Júpiter', '#ffdca8'], ['Saturn', 'Saturno', '#f2dca0'], ['Uranus', 'Urano', '#9fe6e6'], ['Neptune', 'Netuno', '#8aa0ff'],
];
const DIRS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
const dirName = (az) => DIRS[Math.round(az / 45) % 8];
const fmtMag = (m) => m.toFixed(1).replace('.', ',');

export function createSky({ onOpen, onClose, toast }) {
  const root = $('#sky'), cv = $('#sky-canvas'), ctx = cv.getContext('2d');
  let A = null, open = false, offsetH = 0, lat = -23.55, lon = -46.63, placeName = 'São Paulo';
  let showConst = true, showNames = true, showEcl = true, picked = null, hit = [], timer = 0;

  const when = () => new Date(Date.now() + offsetH * 3600 * 1000);

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function layout() {
    const w = innerWidth, h = innerHeight, top = 70, bottom = innerWidth > 720 ? 130 : 200;
    const R = Math.max(120, Math.min(w - 20, h - top - bottom) / 2 - 4);
    return { cx: w / 2, cy: top + (h - top - bottom) / 2, R };
  }
  // altitude/azimute -> pixel (estereográfica: zênite no centro, horizonte na borda; N no topo e L à esquerda)
  function project(az, alt, L) {
    const rho = L.R * Math.tan(((90 - alt) * DEG) / 2);
    return [L.cx - rho * Math.sin(az * DEG), L.cy - rho * Math.cos(az * DEG)];
  }

  function compute(date) {
    const obs = new A.Observer(lat, lon, 0);
    const bodies = BODIES.map(([key, name, color]) => {
      const eq = A.Equator(A.Body[key], date, obs, true, true), hz = A.Horizon(date, obs, eq.ra, eq.dec, 'normal');
      let mag = null;
      if (key !== 'Sun' && key !== 'Moon') { try { mag = A.Illumination(A.Body[key], date).mag; } catch { /* sem magnitude */ } }
      return { key, name, color, mag, az: hz.azimuth, alt: hz.altitude, kind: 'body' };
    });
    const stars = Object.values(STARS).map((s) => {
      const hz = A.Horizon(date, obs, s.ra, s.dec, 'normal');
      return { ...s, az: hz.azimuth, alt: hz.altitude, kind: 'star' };
    });
    // eclíptica: o caminho do Sol, da Lua e dos planetas no céu
    const ecl = [], E = 23.4393 * DEG;
    for (let l = 0; l <= 360; l += 3) {
      const L = l * DEG, dec = Math.asin(Math.sin(E) * Math.sin(L)) / DEG, ra = (((Math.atan2(Math.cos(E) * Math.sin(L), Math.cos(L)) / DEG) + 360) % 360) / 15;
      const hz = A.Horizon(date, obs, ra, dec, 'normal');
      ecl.push([hz.azimuth, hz.altitude]);
    }
    return { bodies, stars, ecl, sun: bodies[0], phase: A.MoonPhase(date) };
  }

  // visibilidade a olho nu: depende da altura do Sol e do brilho (magnitude) do planeta
  function visibility(b, sunAlt) {
    if (b.alt <= 0) return 'below';
    if (b.key === 'Sun' || b.key === 'Moon') return 'naked';
    if (b.mag == null) return 'naked';
    if (b.mag > 5.8) return 'scope';                 // Urano e Netuno: só com binóculo/telescópio
    const limit = sunAlt < -12 ? 6 : sunAlt < -6 ? 3 : sunAlt < 0 ? 0.5 : -3.9; // até Vênus, de dia, só se muito brilhante
    return b.mag <= limit ? 'naked' : sunAlt >= 0 ? 'day' : 'dim';
  }

  function drawMoon(x, y, r, phase, sunAngle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sunAngle);
    ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    const psi = (phase <= 180 ? phase : 360 - phase) * DEG, a = r * Math.cos(psi); // psi: 0 nova, 180 cheia
    ctx.fillStyle = '#f1f1f4'; ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);                           // semicírculo voltado para o Sol
    if (a >= 0) ctx.ellipse(0, 0, a, r, 0, Math.PI / 2, -Math.PI / 2, true);      // crescente
    else ctx.ellipse(0, 0, -a, r, 0, Math.PI / 2, Math.PI * 1.5, false);           // gibosa
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    if (!open || !A) return;
    const date = when(), L = layout(), S = compute(date), w = innerWidth, h = innerHeight;
    hit = [];
    const sa = S.sun.alt, day = Math.min(1, Math.max(0, (sa + 6) / 18)), tw = Math.min(1, Math.max(0, 1 - Math.abs(sa + 3) / 9));
    const mix = (c1, c2, t) => c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
    const skyC = mix([3, 6, 16], [74, 140, 215], day), edge = mix(skyC, [255, 140, 70], tw * 0.7);
    ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, L.R);
    g.addColorStop(0, `rgb(${skyC})`); g.addColorStop(1, `rgb(${edge})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, 0, Math.PI * 2); ctx.clip();

    const starA = Math.min(1, Math.max(0, -sa / 10)); // estrelas surgem quando o Sol baixa
    ctx.strokeStyle = 'rgba(160,190,255,0.12)'; ctx.lineWidth = 1;
    for (const al of [30, 60]) { const [, y] = project(0, al, L); ctx.beginPath(); ctx.arc(L.cx, L.cy, Math.abs(y - L.cy), 0, Math.PI * 2); ctx.stroke(); }

    // eclíptica (tracejada): onde procurar o Sol, a Lua e os planetas
    if (showEcl) {
      ctx.strokeStyle = day > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(255,214,120,0.38)'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 6]); ctx.beginPath();
      let pen = false;
      for (const [az, al] of S.ecl) {
        if (al < 0) { pen = false; continue; }
        const [x, y] = project(az, al, L);
        if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke(); ctx.setLineDash([]);
    }

    const pos = {};
    for (const s of S.stars) pos[s.id] = project(s.az, s.alt, L);
    if (showConst && starA > 0.05) {
      ctx.strokeStyle = `rgba(140,180,255,${0.35 * starA})`; ctx.lineWidth = 1.2;
      for (const c of SKY_CONSTELLATIONS) {
        const up = [];
        for (const [a, b] of c.lines) {
          const sa2 = S.stars.find((s) => s.id === a), sb = S.stars.find((s) => s.id === b);
          if (!sa2 || !sb || sa2.alt < 0 || sb.alt < 0) continue;
          up.push(pos[a], pos[b]);
          ctx.beginPath(); ctx.moveTo(...pos[a]); ctx.lineTo(...pos[b]); ctx.stroke();
        }
        if (up.length && showNames) {
          const mx = up.reduce((t, p) => t + p[0], 0) / up.length, my = up.reduce((t, p) => t + p[1], 0) / up.length;
          ctx.fillStyle = `rgba(160,195,255,${0.6 * starA})`; ctx.font = 'italic 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(c.name, mx, my - 12);
        }
      }
    }

    // rótulos: os do Sol/Lua/planetas têm prioridade; os das estrelas pulam o que já estiver ocupado
    const taken = [];
    const free = (x, y, text) => { const r = [x, y - 11, x + text.length * 6.4 + 4, y + 3]; return !taken.some((t) => r[0] < t[2] && r[2] > t[0] && r[1] < t[3] && r[3] > t[1]) && (taken.push(r), true); };

    // 1) planetas, Sol e Lua (desenhados primeiro só para reservar o espaço dos rótulos)
    const sunXY = S.sun.alt > -2 ? project(S.sun.az, Math.max(S.sun.alt, 0), L) : null;
    const drawBodies = [];
    for (const b of S.bodies) {
      const v = visibility(b, sa);
      if (v === 'below') continue;
      const [x, y] = project(b.az, b.alt, L);
      drawBodies.push({ b, v, x, y });
      hit.push({ x, y, label: b.name, az: b.az, alt: b.alt, mag: b.mag, v, r: 20 });
      free(x + 12, y + 4, b.name);
    }
    for (const s of S.stars) {
      if (s.alt < 0 || starA < 0.02) continue;
      const [x, y] = pos[s.id], r = Math.max(0.9, 3.4 - s.mag * 0.7);
      ctx.fillStyle = `rgba(255,255,255,${starA * Math.min(1, 1.15 - s.mag * 0.12)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      hit.push({ x, y, label: s.name, az: s.az, alt: s.alt, mag: s.mag, v: 'star', r: 14 });
      if (showNames && s.mag < 2.1 && free(x + r + 3, y + 3, s.name)) { ctx.fillStyle = `rgba(220,230,255,${0.8 * starA})`; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(s.name, x + r + 3, y + 3); }
    }

    // 2) corpos do Sistema Solar por cima
    for (const { b, v, x, y } of drawBodies) {
      if (b.key === 'Sun') {
        const gl = ctx.createRadialGradient(x, y, 0, x, y, 60); gl.addColorStop(0, 'rgba(255,225,120,0.9)'); gl.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
      } else if (b.key === 'Moon') {
        drawMoon(x, y, 12, S.phase, sunXY ? Math.atan2(sunXY[1] - y, sunXY[0] - x) : 0);
      } else if (v === 'naked') { // visível a olho nu: disco colorido, do tamanho do brilho, com halo
        const r = Math.max(2.6, 3.6 - (b.mag ?? 1) * 0.75);
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4); gl.addColorStop(0, b.color + 'aa'); gl.addColorStop(1, b.color + '00');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      } else { // acima do horizonte, mas ofuscado pela luz do dia ou fraco demais: anel vazado
        ctx.strokeStyle = b.color; ctx.globalAlpha = 0.85; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = v === 'naked' || b.key === 'Sun' || b.key === 'Moon' ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.font = '600 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(b.name, x + 12, y + 4);
    }
    ctx.restore();

    // horizonte e pontos cardeais
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#cfe0ff'; ctx.font = '600 14px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [t, az] of [['N', 0], ['L', 90], ['S', 180], ['O', 270]]) { const [x, y] = project(az, -9, L); ctx.fillText(t, x, y); }
    ctx.textBaseline = 'alphabetic';
    if (picked) { const p = hit.find((e) => e.label === picked.label); if (p) { ctx.strokeStyle = '#6aa8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.stroke(); } }

    // textos
    $('#sky-when').textContent = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const phaseTxt = `Lua ${Math.round(((1 - Math.cos(S.phase * DEG)) / 2) * 100)}% iluminada`;
    const planets = drawBodies.filter((d) => d.b.key !== 'Sun' && d.b.key !== 'Moon');
    const item = (d) => `${d.b.name} (${Math.round(d.b.alt)}° · ${dirName(d.b.az)})`;
    const naked = planets.filter((d) => d.v === 'naked').map(item), other = planets.filter((d) => d.v !== 'naked').map((d) => item(d) + (d.v === 'scope' ? ' · só com telescópio' : d.v === 'day' ? ' · ofuscado pelo Sol' : ' · muito fraco'));
    const state = sa > 0 ? 'É dia aqui.' : sa > -12 ? 'Crepúsculo.' : 'É noite.';
    $('#sky-info').innerHTML = picked
      ? `<b>${picked.label}</b> · ${picked.alt > 0 ? `${Math.round(picked.alt)}° acima do horizonte, ${dirName(picked.az)}` : 'abaixo do horizonte'}${picked.mag != null ? ` · magnitude ${fmtMag(picked.mag)}` : ''}${picked.v === 'scope' ? ' · só com telescópio' : picked.v === 'day' ? ' · ofuscado pela luz do dia' : picked.v === 'dim' ? ' · muito fraco agora' : ''}`
      : `${state} ${phaseTxt}. ${naked.length ? '<b>A olho nu:</b> ' + naked.join(', ') + '.' : 'Nenhum planeta visível a olho nu agora.'}${other.length ? ' <span class="sky-dim">Acima do horizonte: ' + other.join(', ') + '.</span>' : ''}`;
  }

  async function ensure() { A ??= await import('astronomy-engine'); }
  async function show() {
    await ensure();
    open = true; root.hidden = false; onOpen?.();
    $('#sky-place').textContent = placeName;
    resize();
    clearInterval(timer); timer = setInterval(() => { if (offsetH === 0) draw(); }, 5000);
  }
  function hide() { open = false; root.hidden = true; clearInterval(timer); onClose?.(); }

  // controles
  const sel = $('#sky-city');
  sel.innerHTML = '<option value="">Escolher cidade…</option>' + SKY_CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('');
  sel.onchange = () => { if (sel.value === '') return; const c = SKY_CITIES[+sel.value]; [placeName, lat, lon] = c; $('#sky-place').textContent = placeName; picked = null; draw(); };
  $('#sky-geo').onclick = () => {
    if (!navigator.geolocation) { toast?.('Seu navegador não permite obter a localização.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { lat = p.coords.latitude; lon = p.coords.longitude; placeName = `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`; $('#sky-place').textContent = placeName; sel.value = ''; picked = null; draw(); },
      () => toast?.('Não consegui obter a localização. Escolha uma cidade.'),
      { timeout: 10000, maximumAge: 600000 },
    ); // a localização fica só neste dispositivo: não é enviada nem guardada
  };
  $('#sky-offset').oninput = (e) => { offsetH = +e.target.value; draw(); };
  $('#sky-now').onclick = () => { offsetH = 0; $('#sky-offset').value = 0; draw(); };
  $('#sk-const').onchange = (e) => { showConst = e.target.checked; draw(); };
  $('#sk-names').onchange = (e) => { showNames = e.target.checked; draw(); };
  $('#sk-ecl').onchange = (e) => { showEcl = e.target.checked; draw(); };
  $('#sky-close').onclick = hide;
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const h of hit) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r && d < bd) { best = h; bd = d; } }
    picked = best; draw();
  });
  addEventListener('resize', () => { if (open) resize(); });
  addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { e.stopImmediatePropagation(); hide(); } }, true);

  return { show, hide, isOpen: () => open };
}
