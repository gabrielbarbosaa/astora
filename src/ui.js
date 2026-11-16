const $ = (s) => document.querySelector(s);

const KM_EARTH = 12742;
const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: n < 10 ? 2 : 1 });

export function initUI({ levelsMeta, onLevel, onGoto, onSelect, onHome, onPause, onSpeed, onOrbits }) {
  const panel = $('#panel');
  const levelsNav = $('#levels');
  const drawer = $('#drawer'), search = $('#search'), listEl = $('#list'), exploreBtn = $('#explore');
  let list = [], levelId = null, activeId = null;
  let currentPlanet = null;

  // seletor de escala
  const levelBtns = {};
  levelsMeta.forEach((l, i) => {
    const b = document.createElement('button');
    b.textContent = l.name; b.title = `${l.name} (${i + 1})`;
    b.onclick = () => onLevel(l.id);
    levelsNav.appendChild(b);
    levelBtns[l.id] = b;
  });

  // ---- Gaveta "Explorar": lista com busca (inclui luas e planetas das estrelas) ----
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const row = (b, sub = false) =>
    `<button class="row${sub ? ' sub' : ''}${b.id === activeId ? ' on' : ''}" data-id="${b.id}"><i style="background:${b.color};color:${b.color}"></i><span class="nm">${b.name}</span><em>${b.kind}</em></button>`;

  function renderList() {
    const q = norm(search.value.trim());
    const hit = (b) => norm(`${b.name} ${b.kind}`).includes(q);
    let html = '';
    for (const b of list) {
      const sats = b.moons ?? [];
      if (!q) html += row(b) + sats.map((m) => row(m, true)).join('');
      else html += (hit(b) ? row(b) : '') + sats.filter(hit).map((m) => row(m, true)).join('');
    }
    listEl.innerHTML = html || '<p class="empty">Nada encontrado</p>';
  }
  listEl.onclick = (e) => {
    const r = e.target.closest('.row');
    if (!r) return;
    onSelect(r.dataset.id);
    if (innerWidth <= 720) toggleDrawer(false);
  };
  function toggleDrawer(open = drawer.hidden) {
    drawer.hidden = !open;
    exploreBtn.setAttribute('aria-expanded', String(open));
    if (open) { renderList(); search.focus({ preventScroll: true }); listEl.querySelector('.row.on')?.scrollIntoView({ block: 'center' }); }
    else search.blur();
  }
  exploreBtn.onclick = () => toggleDrawer();
  search.oninput = renderList;
  search.onkeydown = (e) => {
    if (e.key === 'Enter') { const r = listEl.querySelector('.row'); if (r) { onSelect(r.dataset.id); if (innerWidth <= 720) toggleDrawer(false); } }
    if (e.key === 'Escape') { e.stopPropagation(); toggleDrawer(false); }
  };

  const tab = (name) => {
    for (const t of ['about', 'data', 'facts']) $(`#tab-${t}`).hidden = t !== name;
    panel.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
  };
  panel.querySelectorAll('.tabs button').forEach((x) => (x.onclick = () => tab(x.dataset.tab)));
  $('#close').onclick = () => onSelect(null);
  $('#home').onclick = onHome;

  const step = (d) => {
    if (!currentPlanet || !list.length) return;
    const i = list.findIndex((b) => b.id === currentPlanet.id);
    onSelect(list[(i + d + list.length) % list.length].id);
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
    if (e.target === search) return; // digitando na busca: não dispara atalhos
    if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); toggleDrawer(true); return; }
    if (e.key === 'Escape') { if (!drawer.hidden) toggleDrawer(false); else onSelect(null); }
    if (e.key === ' ') { e.preventDefault(); pause.click(); }
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
    const n = +e.key;
    if (n >= 1 && n <= levelsMeta.length) onLevel(levelsMeta[n - 1].id);
  });

  function compare(b) {
    if (!b.km) return b.size ? `<div class="cmp-row"><span>Tamanho</span><b>${b.size}</b></div>` : '';
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
    const sats = planet.moons ?? [];
    const box = $('#p-moons');
    box.hidden = !sats.length;
    if (box.hidden) return;
    const btn = (m) => `<button data-id="${m.id}" class="${m.id === b.id ? 'on' : ''}"><i style="background:${m.color}"></i>${m.name}</button>`;
    box.innerHTML = `<h3>${planet.satLabel ?? 'Luas'} de ${planet.name} (${sats.length})</h3><div>${parent ? btn(parent) : ''}${sats.map(btn).join('')}</div>`;
    box.querySelectorAll('button').forEach((x) => (x.onclick = () => onSelect(x.dataset.id)));
  }

  function gotoBox(b) {
    const box = $('#p-goto');
    const gs = b.goto ? [].concat(b.goto) : [];
    box.innerHTML = gs.map((g) => `<button data-l="${g.level}">${g.label} →</button>`).join('');
    box.querySelectorAll('button').forEach((x) => (x.onclick = () => onGoto(x.dataset.l)));
  }

  return {
    setLevel(id, newList) {
      levelId = id; list = newList;
      for (const k in levelBtns) levelBtns[k].classList.toggle('on', k === id);
      orb.style.display = id === 'solar' ? '' : 'none';
      search.value = '';
      renderList();
    },
    setActive(id) {
      activeId = id;
      listEl.querySelectorAll('.row').forEach((r) => r.classList.toggle('on', r.dataset.id === id));
      if (!drawer.hidden) listEl.querySelector('.row.on')?.scrollIntoView({ block: 'nearest' });
    },
    show(b, parent) {
      panel.hidden = !b;
      if (!b) { currentPlanet = null; return; }
      currentPlanet = parent ?? b;
      const i = list.findIndex((x) => x.id === currentPlanet.id);
      $('#prev-n').textContent = list[(i - 1 + list.length) % list.length].name;
      $('#next-n').textContent = list[(i + 1) % list.length].name;
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
      gotoBox(b);
      moonsBox(b, parent);
      tab('about');
      panel.scrollTop = 0;
    },
  };
}
