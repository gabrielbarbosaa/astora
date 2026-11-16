const $ = (s) => document.querySelector(s);

const KM_EARTH = 12742;
const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: n < 10 ? 2 : 1 });

export function initUI({ bodies, onSelect, onHome, onPause, onSpeed, onOrbits }) {
  const panel = $('#panel');
  const chips = $('#chips');
  const chipEls = {};
  let current = null, currentPlanet = null;

  for (const b of bodies) {
    const el = document.createElement('button');
    el.className = 'chip';
    el.innerHTML = `<i style="background:${b.color}"></i>${b.name}`;
    el.onclick = () => onSelect(b.id);
    chips.appendChild(el);
    chipEls[b.id] = el;
  }

  const tab = (name) => {
    for (const t of ['about', 'data', 'facts']) $(`#tab-${t}`).hidden = t !== name;
    panel.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
  };
  panel.querySelectorAll('.tabs button').forEach((x) => (x.onclick = () => tab(x.dataset.tab)));
  $('#close').onclick = () => onSelect(null);
  $('#home').onclick = onHome;

  const step = (d) => {
    if (!currentPlanet) return;
    const i = bodies.findIndex((b) => b.id === currentPlanet.id);
    onSelect(bodies[(i + d + bodies.length) % bodies.length].id);
  };
  $('#prev').onclick = () => step(-1);
  $('#next').onclick = () => step(1);

  const pause = $('#pause');
  let paused = false;
  pause.onclick = () => { paused = !paused; pause.textContent = paused ? '▶' : '❚❚'; onPause(paused); };
  $('#speed').oninput = (e) => onSpeed(+e.target.value);
  const orb = $('#orbits');
  orb.onclick = () => { orb.classList.toggle('on'); onOrbits(orb.classList.contains('on')); };

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') onSelect(null);
    if (e.key === ' ') { e.preventDefault(); pause.click(); }
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  function compare(b) {
    const ratio = b.km / KM_EARTH;
    if (b.id === 'terra') return `<div class="cmp-row"><span>Diâmetro</span><b>${fmt(b.km)} km</b></div>`;
    const pct = Math.max(3, Math.min(100, (Math.log10(Math.max(ratio, 0.001) * 10) / 3.1) * 100));
    const earthPct = (1 / 3.1) * 100;
    const txt = ratio >= 1 ? `${fmt(ratio)}× a Terra` : ratio < 0.01 ? 'menos de 1% da Terra' : `${Math.round(ratio * 100)}% da Terra`;
    return `<div class="cmp-row"><span>Diâmetro</span><b>${fmt(b.km)} km · ${txt}</b></div>
      <div class="bar"><i style="width:${pct}%;background:${b.color}"></i><u style="left:${earthPct}%" title="Terra"></u></div>
      <small>Escala logarítmica · a marca indica o tamanho da Terra</small>`;
  }

  function moonsBox(b, parent) {
    const planet = parent ?? b;
    const list = planet.moons ?? [];
    const box = $('#p-moons');
    box.hidden = !list.length && !parent;
    if (box.hidden) return;
    const btn = (m, extra = '') => `<button data-id="${m.id}" class="${m.id === b.id ? 'on' : ''}" ${extra}><i style="background:${m.color}"></i>${m.name}</button>`;
    box.innerHTML = `<h3>${list.length ? `Luas de ${planet.name} (${list.length})` : ''}</h3><div>${parent ? btn(parent) : ''}${list.map((m) => btn(m)).join('')}</div>`;
    box.querySelectorAll('button').forEach((x) => (x.onclick = () => onSelect(x.dataset.id)));
  }

  return {
    setActive(id) { for (const k in chipEls) chipEls[k].classList.toggle('on', k === id); },
    show(b, parent) {
      current = b;
      panel.hidden = !b;
      if (!b) { currentPlanet = null; return; }
      currentPlanet = parent ?? b;
      const i = bodies.findIndex((x) => x.id === currentPlanet.id);
      $('#prev-n').textContent = bodies[(i - 1 + bodies.length) % bodies.length].name;
      $('#next-n').textContent = bodies[(i + 1) % bodies.length].name;
      panel.style.setProperty('--c', b.color);
      $('#p-swatch').style.background = `radial-gradient(circle at 30% 30%, #fff8, ${b.color} 45%, #000 120%)`;
      $('#p-swatch').style.boxShadow = `0 0 34px ${b.color}66`;
      $('#p-kind').textContent = b.kind;
      $('#p-name').textContent = b.name;
      $('#p-compare').innerHTML = compare(b);
      const hi = b.stats.slice(0, 3).map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
      $('#tab-about').innerHTML = `<p>${b.about}</p><div class="stats-hi">${hi}</div><div class="didyou"><span>✦ Você sabia?</span>${b.facts[0]}</div>`;
      $('#tab-data').innerHTML = `<div class="grid">${b.stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
      $('#tab-facts').innerHTML = `<ul>${b.facts.map((f) => `<li>${f}</li>`).join('')}</ul>`;
      moonsBox(b, parent);
      tab('about');
      panel.scrollTop = 0;
    },
  };
}
