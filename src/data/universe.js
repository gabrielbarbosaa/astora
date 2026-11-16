// Galáxias próximas. Distâncias comprimidas na cena (raiz quadrada: cena = 40 × √Mal) e formas estilizadas
// por tipo, não são mapas fiéis de cada galáxia. `R` é o raio visual; `dir` é uma direção aproximada.
export const universe = [
  {
    id: 'via-lactea', name: 'Via Láctea', kind: 'Galáxia espiral barrada · sua casa', color: '#9fc4ff', type: 'spiral', R: 10, dist: 0, dir: [0, 0, 1], tilt: [0.5, 0, 0.3],
    size: '≈ 100.000 anos-luz', goto: { level: 'galaxy', label: 'Entrar na Via Láctea' },
    about: 'Nossa galáxia, com 100 a 400 bilhões de estrelas e um buraco negro supermassivo no centro. É a segunda maior galáxia do Grupo Local, atrás de Andrômeda.',
    stats: [['Diâmetro', '≈ 100.000 anos-luz'], ['Estrelas', '100 a 400 bilhões'], ['Tipo', 'Espiral barrada (SBbc)'], ['Idade', '≈ 13,6 bilhões de anos']],
    facts: ['Está em rota de colisão com Andrômeda: elas se fundirão em ~4,5 bilhões de anos.', 'Toda a Via Láctea é só uma entre cerca de 2 trilhões de galáxias no universo observável.'],
  },
  {
    id: 'andromeda', name: 'Andrômeda (M31)', kind: 'Galáxia espiral', color: '#b7c6ff', type: 'spiral', R: 20, dist: 2.54, dir: [0.62, 0.35, -0.7], tilt: [1.2, 0, 0.4],
    size: '≈ 220.000 anos-luz',
    about: 'A maior galáxia do Grupo Local e a mais distante visível a olho nu, uma mancha difusa em noites escuras. Tem cerca de 1 trilhão de estrelas.',
    stats: [['Distância', '2,5 milhões de anos-luz'], ['Diâmetro', '≈ 220.000 anos-luz'], ['Estrelas', '≈ 1 trilhão'], ['Aproximação', '110 km/s']],
    facts: ['É a galáxia espiral grande mais próxima de nós.', 'Edwin Hubble usou estrelas variáveis dela, em 1923, para provar que existem outras galáxias.'],
  },
  {
    id: 'triangulo', name: 'Galáxia do Triângulo (M33)', kind: 'Galáxia espiral', color: '#a8d0ff', type: 'spiral', R: 8, dist: 2.73, dir: [0.55, 0.5, -0.67], tilt: [0.4, 0, -0.5],
    size: '≈ 60.000 anos-luz',
    about: 'A terceira maior galáxia do Grupo Local, uma espiral compacta com um grande berçário de estrelas, a Nebulosa NGC 604.',
    stats: [['Distância', '2,7 milhões de anos-luz'], ['Diâmetro', '≈ 60.000 anos-luz'], ['Estrelas', '≈ 40 bilhões']],
    facts: ['É o objeto mais distante visto a olho nu por observadores em locais muito escuros.'],
  },
  {
    id: 'lmc', name: 'Grande Nuvem de Magalhães', kind: 'Galáxia anã irregular', color: '#c8dcff', type: 'irregular', R: 4.5, dist: 0.16, dir: [-0.4, -0.75, 0.5], tilt: [0.3, 0, 0],
    size: '≈ 14.000 anos-luz',
    about: 'Uma galáxia satélite da Via Láctea, visível a olho nu no hemisfério sul. Abriga a Nebulosa da Tarântula e a supernova SN 1987A.',
    stats: [['Distância', '160.000 anos-luz'], ['Diâmetro', '≈ 14.000 anos-luz'], ['Estrelas', '≈ 30 bilhões']],
    facts: ['Navegadores como Magalhães a usaram como referência no céu do sul.', 'A SN 1987A foi a supernova mais próxima vista desde 1604.'],
  },
  {
    id: 'smc', name: 'Pequena Nuvem de Magalhães', kind: 'Galáxia anã irregular', color: '#d0e0ff', type: 'irregular', R: 3, dist: 0.2, dir: [-0.2, -0.9, 0.4], tilt: [0.1, 0, 0.2],
    size: '≈ 7.000 anos-luz',
    about: 'Outra galáxia anã satélite da Via Láctea, com cerca de 3 bilhões de estrelas.',
    stats: [['Distância', '200.000 anos-luz'], ['Diâmetro', '≈ 7.000 anos-luz'], ['Estrelas', '≈ 3 bilhões']],
    facts: ['Henrietta Leavitt estudou estrelas variáveis nela e descobriu como medir distâncias no universo.'],
  },
  {
    id: 'm81', name: 'Galáxia de Bode (M81)', kind: 'Galáxia espiral', color: '#ffe0b0', type: 'spiral', R: 12, dist: 11.8, dir: [-0.3, 0.8, -0.5], tilt: [0.9, 0, 0.1],
    size: '≈ 90.000 anos-luz',
    about: 'Uma bela espiral de braços bem definidos, no grupo M81. Tem um buraco negro central de ~70 milhões de Sóis.',
    stats: [['Distância', '11,8 milhões de anos-luz'], ['Diâmetro', '≈ 90.000 anos-luz']],
    facts: ['Interage gravitacionalmente com a vizinha M82, a "Galáxia do Charuto".'],
  },
  {
    id: 'cena', name: 'Centaurus A', kind: 'Galáxia elíptica · núcleo ativo', color: '#ffc890', type: 'elliptical', R: 14, dist: 13, dir: [-0.8, -0.2, 0.55], tilt: [0.2, 0, 0.5],
    size: '≈ 60.000 anos-luz',
    about: 'Uma galáxia elíptica atravessada por uma faixa de poeira escura, resultado de uma fusão com uma galáxia espiral. Seu buraco negro central lança jatos enormes.',
    stats: [['Distância', '13 milhões de anos-luz'], ['Buraco negro', '≈ 55 milhões de Sóis'], ['Tipo', 'Elíptica / rádio galáxia']],
    facts: ['É uma das fontes de rádio mais fortes do céu.', 'É a galáxia ativa mais próxima da Terra.'],
  },
  {
    id: 'm51', name: 'Galáxia do Redemoinho (M51)', kind: 'Galáxia espiral em interação', color: '#9fc4ff', type: 'spiral', R: 12, dist: 23, dir: [0.2, 0.9, 0.4], tilt: [-0.3, 0, 0.9],
    size: '≈ 76.000 anos-luz',
    about: 'Uma espiral clássica, de braços perfeitos, que está em plena interação com uma galáxia menor, NGC 5195.',
    stats: [['Distância', '23 milhões de anos-luz'], ['Diâmetro', '≈ 76.000 anos-luz']],
    facts: ['Foi a primeira galáxia onde se identificou a estrutura espiral, em 1845, pelo Lorde Rosse.'],
  },
  {
    id: 'sombrero', name: 'Galáxia do Sombreiro (M104)', kind: 'Galáxia lenticular', color: '#ffe6bd', type: 'lenticular', R: 11, dist: 29, dir: [-0.5, -0.1, -0.85], tilt: [1.4, 0, 0],
    size: '≈ 50.000 anos-luz',
    about: 'Famosa pelo grande bojo luminoso e a faixa de poeira escura, que lembram um sombrero. Possui cerca de 2.000 aglomerados globulares.',
    stats: [['Distância', '29 milhões de anos-luz'], ['Diâmetro', '≈ 50.000 anos-luz'], ['Buraco negro', '≈ 1 bilhão de Sóis']],
    facts: ['Seu buraco negro central é um dos mais massivos da vizinhança.'],
  },
  {
    id: 'm87', name: 'Messier 87 e M87*', kind: 'Galáxia elíptica gigante · buraco negro', color: '#ffd9a0', type: 'elliptical', R: 24, dist: 53.5, dir: [0.9, -0.1, 0.4], tilt: [0.3, 0, 0], black: true, jet: true, focusDist: 20,
    size: '≈ 120.000 anos-luz',
    about: 'Uma galáxia elíptica gigante no centro do Aglomerado de Virgem. Em 2019, foi o primeiro buraco negro fotografado (M87*), com 6,5 bilhões de vezes a massa do Sol. Daqui parte um jato de partículas com 5.000 anos-luz.',
    stats: [['Distância', '53,5 milhões de anos-luz'], ['Buraco negro M87*', '≈ 6,5 bilhões de Sóis'], ['Jato', '≈ 5.000 anos-luz'], ['Aglomerados globulares', '≈ 12.000']],
    facts: ['A imagem do Event Horizon Telescope juntou telescópios do mundo todo, formando uma "antena" do tamanho da Terra.', 'Seu horizonte de eventos é maior que todo o Sistema Solar.', 'O buraco negro e o jato aqui são representações artísticas.'],
  },
];
