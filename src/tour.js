// Tour guiado: voa por astros de várias escalas, com um texto curto em cada parada (e narração opcional).
const STEPS = [
  { level: 'telescopes', id: null, text: 'Vamos começar bem perto de casa. Ao redor da Terra, dezenas de telescópios olham para o universo: alguns em órbita, outros em montanhas e desertos.' },
  { level: 'telescopes', id: 'jwst', text: 'O James Webb, a 1,5 milhão de quilômetros da Terra, enxerga em infravermelho e já encontrou galáxias que existiam poucas centenas de milhões de anos depois do Big Bang.' },
  { level: 'solar', id: 'terra', text: 'Agora, o Sistema Solar. A Terra é o único mundo conhecido com vida, e cerca de 71% da sua superfície é coberta por água.' },
  { level: 'solar', id: 'lua', text: 'A Lua mostra sempre a mesma face para nós. Doze astronautas pisaram nela, entre 1969 e 1972.' },
  { level: 'solar', id: 'sol', text: 'No centro, o Sol concentra 99,86% de toda a massa do sistema. A luz dele leva cerca de 8 minutos para chegar até nós.' },
  { level: 'solar', id: 'marte', text: 'Marte, o planeta vermelho, abriga o Monte Olimpo, o maior vulcão conhecido, com cerca de 22 quilômetros de altura.' },
  { level: 'solar', id: 'jupiter', text: 'Júpiter é o maior planeta. Sua Grande Mancha Vermelha é uma tempestade maior que a Terra, que dura há séculos.' },
  { level: 'solar', id: 'saturno', text: 'Os anéis de Saturno têm até 280 mil quilômetros de largura, mas costumam ter só uns 10 metros de espessura.' },
  { level: 'solar', id: 'netuno', text: 'Netuno, o mais distante dos planetas, tem os ventos mais rápidos do Sistema Solar, de até 2.100 quilômetros por hora.' },
  { level: 'solar', id: 'plutao', text: 'Mais além fica Plutão, que a sonda New Horizons visitou em 2015, revelando uma planície de gelo em forma de coração.' },
  { level: 'stars', id: 'proxima', text: 'Saindo do Sistema Solar: Proxima Centauri é a estrela mais próxima, a 4,2 anos-luz. Uma sonda atual levaria cerca de 75 mil anos para chegar lá.' },
  { level: 'stars', id: 'trappist', text: 'TRAPPIST-1 tem sete planetas do tamanho da Terra, e pelo menos três deles estão na zona habitável.' },
  { level: 'galaxy', id: 'sol', text: 'Afastando mais: o nosso Sol é só uma entre centenas de bilhões de estrelas da Via Láctea, a 26 mil anos-luz do centro.' },
  { level: 'galaxy', id: 'sgra', text: 'No centro, Sagitário A estrela, um buraco negro com 4 milhões de vezes a massa do Sol, fotografado pela primeira vez em 2022.' },
  { level: 'universe', id: 'andromeda', text: 'No Grupo Local, Andrômeda é a maior galáxia vizinha. Ela vem em nossa direção e vai se fundir com a Via Láctea em cerca de 4,5 bilhões de anos.' },
  { level: 'universe', id: 'm87', text: 'Em M87, a 53 milhões de anos-luz, fica o primeiro buraco negro já fotografado, em 2019.' },
  { level: 'universe', id: null, text: 'E isso é só uma pequena parte do que existe: o universo observável tem cerca de 2 trilhões de galáxias. Bom voo! Agora explore à vontade.' },
];

const $ = (s) => document.querySelector(s);

export function createTour({ setLevel, select, getLevelId, ui }) {
  const card = $('#tour'), textEl = $('#tour-text'), countEl = $('#tour-count'), bar = $('#tour-progress');
  const pauseBtn = $('#tour-pause'), voiceBtn = $('#tour-voice');
  let active = false, paused = false, idx = 0, token = 0, timer = 0, elapsed = 0, dwell = 8000, speaking = false;
  const canSpeak = 'speechSynthesis' in window;
  let voiceOn = false;
  try { voiceOn = canSpeak && localStorage.getItem('astora.voice') === '1'; } catch { /* sem armazenamento */ }
  voiceBtn.hidden = !canSpeak;
  const paintVoice = () => { voiceBtn.style.opacity = voiceOn ? '1' : '0.45'; voiceBtn.title = voiceOn ? 'Narração ligada' : 'Narração desligada'; };
  paintVoice();

  function speak(text) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 1;
    const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('pt'));
    if (v) u.voice = v;
    speaking = true;
    u.onend = u.onerror = () => { speaking = false; elapsed = Math.max(elapsed, dwell - 1200); };
    speechSynthesis.speak(u);
  }

  async function go(i) {
    if (!active) return;
    idx = Math.max(0, Math.min(STEPS.length - 1, i));
    const my = ++token, s = STEPS[idx];
    textEl.textContent = s.text;
    countEl.textContent = `${idx + 1} / ${STEPS.length}`;
    bar.style.width = '0%';
    elapsed = 0; speaking = false;
    dwell = Math.max(8000, s.text.length * 70);
    if (canSpeak) speechSynthesis.cancel();
    if (getLevelId() !== s.level) await setLevel(s.level);
    if (!active || my !== token) return;
    select(s.id);
    if (voiceOn) speak(s.text);
  }

  function tick() {
    if (!active || paused) return;
    elapsed += 100;
    bar.style.width = `${Math.min(100, (elapsed / dwell) * 100)}%`;
    if (elapsed >= dwell && !speaking) {
      if (idx >= STEPS.length - 1) { stop(); ui.toast('Fim do tour. Explore à vontade!'); return; }
      go(idx + 1);
    }
  }

  function start() {
    if (active) return;
    active = true; paused = false;
    document.body.classList.add('touring');
    card.hidden = false;
    pauseBtn.textContent = '❚❚';
    timer = setInterval(tick, 100);
    go(0);
  }
  function stop() {
    if (!active) return;
    active = false; token++;
    clearInterval(timer);
    if (canSpeak) speechSynthesis.cancel();
    card.hidden = true;
    document.body.classList.remove('touring');
  }

  $('#tour-next').onclick = () => { if (idx >= STEPS.length - 1) stop(); else go(idx + 1); };
  $('#tour-prev').onclick = () => go(idx - 1);
  $('#tour-stop').onclick = stop;
  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶' : '❚❚';
    if (canSpeak && speaking) paused ? speechSynthesis.pause() : speechSynthesis.resume();
  };
  voiceBtn.onclick = () => {
    voiceOn = !voiceOn; paintVoice();
    try { localStorage.setItem('astora.voice', voiceOn ? '1' : '0'); } catch { /* sem armazenamento */ }
    if (voiceOn && active) speak(STEPS[idx].text); else if (canSpeak) { speechSynthesis.cancel(); speaking = false; }
  };
  // Esc encerra o tour (antes de qualquer outro atalho)
  addEventListener('keydown', (e) => { if (active && e.key === 'Escape') { e.stopImmediatePropagation(); stop(); } }, true);

  return { start, stop, isActive: () => active };
}
