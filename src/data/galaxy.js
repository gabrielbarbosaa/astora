// Via Láctea. 1 unidade de cena = 100 anos-luz (a galáxia tem raio de ~50.000 al = 500 unidades).
// Posições em coordenadas galácticas vistas do Sol: `l` (longitude), `b` (latitude), `dist` (anos-luz).
// Os ícones de nebulosas, buracos negros e aglomerados estão em escala exagerada para serem visíveis.
export const galaxy = [
  {
    id: 'sgra', name: 'Sagitário A*', kind: 'Buraco negro supermassivo', color: '#ffb35a', R: 3.2, black: true, focusDist: 36,
    pos: [0, 0, 0], size: 'horizonte ≈ 24 milhões km',
    about: 'O buraco negro supermassivo no centro da Via Láctea, com 4 milhões de vezes a massa do Sol. Em 2022, o Event Horizon Telescope publicou a primeira imagem dele. Aqui o disco e a lente gravitacional são uma representação artística: mova a câmera em volta e veja como muda.',
    stats: [['Massa', '≈ 4,3 milhões de Sóis'], ['Distância da Terra', '≈ 26.000 anos-luz'], ['Raio do horizonte', '≈ 12 milhões km'], ['Imagem real', 'Event Horizon Telescope, 2022']],
    facts: ['Estrelas passam por ele a milhares de km/s: a estrela S2 orbita em apenas 16 anos.', 'Seu horizonte de eventos caberia dentro da órbita de Mercúrio.', 'A descoberta rendeu o Nobel de Física de 2020 a Reinhard Genzel e Andrea Ghez.', 'Está relativamente "silencioso": consome muito pouca matéria.'],
  },
  {
    id: 'sol', name: 'Sol', kind: 'Estrela · você está aqui', color: '#ffd27a', R: 2.2,
    lbd: [0, 0, 0], galPos: 'sun', size: '1,4 milhão km',
    goto: [{ level: 'solar', label: 'Entrar no Sistema Solar' }, { level: 'stars', label: 'Ver a vizinhança estelar' }],
    about: 'Estamos no Braço de Órion, um braço secundário da Via Láctea, a cerca de 26.000 anos-luz do centro, orbitando a galáxia a ~230 km/s.',
    stats: [['Distância do centro', '≈ 26.000 anos-luz'], ['Período orbital', '≈ 230 milhões de anos'], ['Velocidade', '≈ 230 km/s'], ['Braço', 'Órion (Local)']],
    facts: ['O Sol deu cerca de 20 voltas na galáxia desde que nasceu.', 'A última vez que a Terra estava neste ponto da órbita, os dinossauros estavam surgindo.'],
  },
  {
    id: 'orion', name: 'Nebulosa de Órion', kind: 'Nebulosa de emissão · berçário de estrelas', color: '#ff7fa8', R: 3.2,
    lbd: [209, -19.4, 1344], size: '≈ 24 anos-luz',
    about: 'A região de formação de estrelas mais próxima, visível a olho nu como a "estrela" do meio da espada de Órion. Dentro dela nascem estrelas e discos de planetas.',
    stats: [['Distância', '1.344 anos-luz'], ['Diâmetro', '≈ 24 anos-luz'], ['Estrelas', '> 700 em formação'], ['Idade', '≈ 2 milhões de anos']],
    facts: ['Algumas das estrelas jovens do Trapézio têm menos de 1 milhão de anos.', 'Contém discos protoplanetários visíveis ao Hubble.'],
  },
  {
    id: 'carina', name: 'Nebulosa Carina', kind: 'Nebulosa de emissão', color: '#ff9a6a', R: 4.4,
    lbd: [287.6, -0.6, 7500], size: '≈ 300 anos-luz',
    about: 'Uma das maiores e mais brilhantes nebulosas do céu, quatro vezes maior que a de Órion. Abriga Eta Carinae, uma das estrelas mais massivas e instáveis conhecidas.',
    stats: [['Distância', '≈ 7.500 anos-luz'], ['Diâmetro', '≈ 300 anos-luz'], ['Estrela famosa', 'Eta Carinae']],
    facts: ['Foi uma das primeiras imagens publicadas pelo Telescópio James Webb, em 2022 (os "Penhascos Cósmicos").', 'Eta Carinae pode explodir em supernova a qualquer momento (em escalas astronômicas).'],
  },
  {
    id: 'caranguejo', name: 'Nebulosa do Caranguejo', kind: 'Remanescente de supernova · pulsar', color: '#ffb37a', R: 2.4, pulsar: true,
    lbd: [184.6, -5.8, 6500], size: '≈ 11 anos-luz',
    about: 'Os restos da supernova observada por astrônomos chineses em 1054. No centro dela gira um pulsar: uma estrela de nêutrons que emite um feixe de luz 30 vezes por segundo.',
    stats: [['Distância', '≈ 6.500 anos-luz'], ['Idade', '≈ 970 anos'], ['Pulsar', '30 giros por segundo'], ['Diâmetro do pulsar', '≈ 20 km']],
    facts: ['Uma colher de chá de matéria de estrela de nêutrons pesaria cerca de 1 bilhão de toneladas.', 'A explosão foi tão brilhante que se via de dia, por 23 dias.'],
  },
  {
    id: 'cygx1', name: 'Cygnus X-1', kind: 'Buraco negro de massa estelar', color: '#9fb8ff', R: 1.6, black: true, small: true, focusDist: 18,
    lbd: [71.3, 3.1, 6070], size: 'horizonte ≈ 44 km',
    about: 'Um dos primeiros buracos negros identificados (1971). Arranca matéria de uma estrela supergigante azul companheira, e o gás que cai emite raios X antes de desaparecer.',
    stats: [['Massa', '≈ 21 Sóis'], ['Distância', '≈ 6.070 anos-luz'], ['Companheira', 'HDE 226868 (supergigante azul)'], ['Órbita', '5,6 dias']],
    facts: ['Foi tema de uma aposta famosa: Stephen Hawking apostou que ele NÃO era um buraco negro, e perdeu.', 'Seu horizonte tem só ~120 km de diâmetro, apesar de pesar 21 Sóis.'],
  },
  {
    id: 'omegacen', name: 'Ômega Centauri', kind: 'Aglomerado globular', color: '#ffe6a8', R: 3,
    lbd: [309.1, 15, 17090], size: '≈ 150 anos-luz',
    about: 'O maior aglomerado globular da Via Láctea, com cerca de 10 milhões de estrelas. Pode ser o núcleo remanescente de uma galáxia anã engolida pela nossa.',
    stats: [['Distância', '≈ 17.000 anos-luz'], ['Estrelas', '≈ 10 milhões'], ['Idade', '≈ 12 bilhões de anos']],
    facts: ['Pode abrigar um buraco negro de massa intermediária de ~8.200 Sóis.', 'É visível a olho nu como uma estrela difusa.'],
  },
];
