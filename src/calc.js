// Calculadoras da aba "Brincar": peso, idade e tempo de viagem para cada astro.
const AU_KM = 149.6e6, LY_KM = 9.4607e12, C_KMS = 299792.458;
// Gravidade na superfície (m/s²). Sem valor = a calculadora de peso não aparece.
const GRAV = {
  sol: 274, mercurio: 3.7, venus: 8.87, terra: 9.81, lua: 1.62, marte: 3.71, ceres: 0.27, jupiter: 24.79, saturno: 10.44,
  urano: 8.69, netuno: 11.15, plutao: 0.62, eris: 0.82,
  fobos: 0.0057, deimos: 0.003, io: 1.8, europa: 1.31, ganimedes: 1.43, calisto: 1.24, encelado: 0.113, reia: 0.264,
  tita: 1.35, japeto: 0.223, miranda: 0.079, titania: 0.379, oberon: 0.346, tritao: 0.779, caronte: 0.288,
};
const SPEEDS = [['A pé (5 km/h)', 5], ['De carro (100 km/h)', 100], ['De avião (900 km/h)', 900], ['Na velocidade da Voyager 1 (61.200 km/h)', 61200]];

const num = (n, d = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: d });
function fmtYears(y) {
  if (y < 1000) return `${num(y, y < 10 ? 1 : 0)} anos`;
  if (y < 1e6) return `${Math.round(y).toLocaleString('pt-BR')} anos`;
  if (y < 1e9) return `${num(y / 1e6)} milhões de anos`;
  return `${num(y / 1e9)} bilhões de anos`;
}
function fmtHours(h) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} minutos`;
  if (h < 48) return `${num(h)} horas`;
  const d = h / 24;
  if (d < 730) return `${num(d, 0)} dias`;
  return fmtYears(d / 365.25);
}
function fmtSeconds(s) {
  if (s < 90) return `${num(s, 0)} segundos`;
  if (s < 5400) return `${num(s / 60, 1)} minutos`;
  if (s < 172800) return `${num(s / 3600, 1)} horas`;
  return fmtHours(s / 3600);
}

// Distância da Terra: { km } no Sistema Solar, { ly } fora dele
function distance(b, level) {
  if (level === 'solar') {
    if (b.id === 'terra') return null;
    if (b.id === 'lua') return { km: 384400 };
    if (b.id === 'sol') return { km: AU_KM };
    if (b.belt) return { km: Math.abs((b.belt.inner + b.belt.outer) / 2 - 1) * AU_KM };
    if (b.probe) return { km: Math.abs(b.probe.d0 - 1) * AU_KM };
    if (b.au > 0) return { km: Math.max(Math.abs(b.au - 1), 0.05) * AU_KM }; // distância mínima aproximada
    return null;
  }
  if (level === 'stars') return b.dist > 0 ? { ly: b.dist } : null;
  if (level === 'galaxy') {
    if (b.id === 'sgra') return { ly: 26000 };
    return b.lbd && b.lbd[2] > 0 ? { ly: b.lbd[2] } : null;
  }
  if (level === 'universe') return b.dist > 0 ? { ly: b.dist * 1e6 } : null;
  return null;
}
const gravity = (b, level) => (level === 'solar' ? GRAV[b.id] ?? null : null);
const yearLength = (b, level) => (level === 'solar' && b.years > 0 ? b.years : null);

export const calcAvailable = (b, level) => gravity(b, level) != null || yearLength(b, level) != null || distance(b, level) != null;

function store(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function save(key, val) { try { localStorage.setItem(key, val); } catch { /* sem armazenamento */ } }

export function renderCalc(root, b, level) {
  const g = gravity(b, level), yrs = yearLength(b, level), dist = distance(b, level);
  const cards = [];
  if (g != null) cards.push(`
    <div class="card" id="c-weight">
      <h4>Quanto eu pesaria</h4>
      <label>Meu peso na Terra <input type="number" id="in-kg" min="1" max="500" step="0.5" value="${store('astora.kg', '70')}" /> kg</label>
      <div class="out" id="out-weight"></div>
    </div>`);
  if (yrs != null) cards.push(`
    <div class="card" id="c-age">
      <h4>Minha idade aqui</h4>
      <label>Nasci em <input type="date" id="in-birth" max="${new Date().toISOString().slice(0, 10)}" value="${store('astora.birth', '')}" /></label>
      <div class="out" id="out-age"></div>
    </div>`);
  if (dist) cards.push(`<div class="card"><h4>Quanto tempo para chegar</h4><dl id="out-trip"></dl></div>`);
  root.innerHTML = `<div class="calc">${cards.join('')}</div>`;

  const weightOut = root.querySelector('#out-weight');
  if (weightOut) {
    const upd = () => {
      const kg = parseFloat(root.querySelector('#in-kg').value);
      if (!(kg > 0)) { weightOut.textContent = '—'; return; }
      save('astora.kg', String(kg));
      weightOut.innerHTML = `${num(kg * (g / 9.81), kg * (g / 9.81) < 10 ? 2 : 1)} kg<small>Gravidade de ${num(g, 2)} m/s² (${num(g / 9.81, 2)}× a da Terra)</small>`;
    };
    root.querySelector('#in-kg').oninput = upd; upd();
  }
  const ageOut = root.querySelector('#out-age');
  if (ageOut) {
    const upd = () => {
      const v = root.querySelector('#in-birth').value;
      const yearTxt = yrs < 1 ? `${num(yrs * 365.25, 0)} dias terrestres` : `${num(yrs, 2)} anos terrestres`;
      if (!v) { ageOut.innerHTML = `—<small>Um ano em ${b.name} dura ${yearTxt}.</small>`; return; }
      const days = (Date.now() - new Date(v + 'T12:00:00').getTime()) / 86400000;
      if (!(days >= 0)) { ageOut.textContent = '—'; return; }
      save('astora.birth', v);
      const age = days / 365.25 / yrs;
      ageOut.innerHTML = `${num(age, age < 10 ? 2 : 1)} anos<small>Um ano em ${b.name} dura ${yearTxt}.</small>`;
    };
    root.querySelector('#in-birth').oninput = upd; upd();
  }
  const trip = root.querySelector('#out-trip');
  if (trip) {
    const rows = [];
    if (dist.km != null) {
      const d = dist.km;
      rows.push(['Distância', d >= 1e6 ? `${num(d / 1e6, d < 1e7 ? 2 : 1)} milhões de km` : `${Math.round(d).toLocaleString('pt-BR')} km`]);
      for (const [label, kmh] of SPEEDS) rows.push([label, fmtHours(dist.km / kmh)]);
      rows.push(['Na velocidade da luz', fmtSeconds(dist.km / C_KMS)]);
    } else {
      rows.push(['Distância', `${dist.ly >= 1e6 ? num(dist.ly / 1e6) + ' milhões' : Math.round(dist.ly).toLocaleString('pt-BR')} de anos-luz`]);
      rows.push(['Na velocidade da Voyager 1 (61.200 km/h)', fmtYears((dist.ly * LY_KM) / 61200 / 8766)]);
      rows.push(['Na velocidade da luz', fmtYears(dist.ly)]);
    }
    trip.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
}
