// Estrelas brilhantes: [id, nome, ascensão reta (horas), declinação (°), magnitude]. Coordenadas J2000 aproximadas.
// A precessão desde 2000 (~0,3°) é ignorada, o que não é perceptível a olho nu.
export const SKY_STARS = [
  ['sirius', 'Sirius', 6.752, -16.716, -1.46], ['canopus', 'Canopus', 6.399, -52.696, -0.74], ['arcturus', 'Arcturus', 14.261, 19.182, -0.05],
  ['rigilkent', 'Alfa Centauri', 14.66, -60.834, -0.01], ['vega', 'Vega', 18.616, 38.784, 0.03], ['capella', 'Capela', 5.278, 45.998, 0.08],
  ['rigel', 'Rigel', 5.242, -8.202, 0.13], ['procyon', 'Procyon', 7.655, 5.225, 0.34], ['achernar', 'Achernar', 1.629, -57.237, 0.46],
  ['betelgeuse', 'Betelgeuse', 5.919, 7.407, 0.5], ['hadar', 'Hadar', 14.064, -60.373, 0.61], ['altair', 'Altair', 19.846, 8.868, 0.76],
  ['acrux', 'Acrux', 12.443, -63.099, 0.76], ['aldebaran', 'Aldebarã', 4.599, 16.509, 0.86], ['antares', 'Antares', 16.49, -26.432, 1.06],
  ['spica', 'Spica', 13.42, -11.161, 0.97], ['pollux', 'Pólux', 7.755, 28.026, 1.14], ['fomalhaut', 'Fomalhaut', 22.961, -29.622, 1.16],
  ['deneb', 'Deneb', 20.69, 45.28, 1.25], ['mimosa', 'Mimosa', 12.795, -59.689, 1.25], ['regulus', 'Régulo', 10.14, 11.967, 1.35],
  ['adhara', 'Adhara', 6.977, -28.972, 1.5], ['castor', 'Castor', 7.577, 31.888, 1.58], ['gacrux', 'Gacrux', 12.519, -57.113, 1.63],
  ['shaula', 'Shaula', 17.56, -37.104, 1.62], ['bellatrix', 'Bellatrix', 5.419, 6.35, 1.64], ['elnath', 'Elnath', 5.438, 28.608, 1.65],
  ['miaplacidus', 'Miaplacidus', 9.22, -69.717, 1.67], ['alnilam', 'Alnilam', 5.603, -1.202, 1.69], ['alnitak', 'Alnitak', 5.679, -1.943, 1.77],
  ['alioth', 'Alioth', 12.9, 55.96, 1.77], ['dubhe', 'Dubhe', 11.062, 61.751, 1.79], ['mirfak', 'Mirfaque', 3.405, 49.861, 1.79],
  ['wezen', 'Wezen', 7.14, -26.393, 1.84], ['sargas', 'Sargas', 17.622, -42.998, 1.86], ['kausaus', 'Kaus Australis', 18.403, -34.385, 1.85],
  ['avior', 'Avior', 8.375, -59.509, 1.86], ['alkaid', 'Alkaid', 13.792, 49.313, 1.86], ['menkalinan', 'Menkalinan', 5.992, 44.947, 1.9],
  ['atria', 'Atria', 16.811, -69.028, 1.92], ['alhena', 'Alhena', 6.629, 16.399, 1.93], ['peacock', 'Pavão', 20.427, -56.735, 1.94],
  ['mirzam', 'Mirzam', 6.378, -17.956, 1.98], ['alphard', 'Alphard', 9.46, -8.659, 2.0], ['polaris', 'Polaris', 2.53, 89.264, 1.98],
  ['hamal', 'Hamal', 2.12, 23.463, 2.0], ['diphda', 'Diphda', 0.726, -17.987, 2.04], ['nunki', 'Nunki', 18.921, -26.297, 2.02],
  ['menkent', 'Menkent', 14.111, -36.37, 2.06], ['mintaka', 'Mintaka', 5.533, -0.299, 2.23], ['saiph', 'Saiph', 5.796, -9.67, 2.07],
  ['alpheratz', 'Alpheratz', 0.14, 29.091, 2.06], ['mizar', 'Mizar', 13.399, 54.925, 2.04], ['merak', 'Merak', 11.031, 56.382, 2.37],
  ['phecda', 'Phecda', 11.897, 53.695, 2.44], ['megrez', 'Megrez', 12.257, 57.033, 3.31], ['denebola', 'Denébola', 11.818, 14.572, 2.14],
  ['algieba', 'Algieba', 10.333, 19.842, 2.28], ['schedar', 'Schedar', 0.675, 56.537, 2.24], ['caph', 'Caph', 0.153, 59.15, 2.28],
  ['gammacas', 'Gamma Cas', 0.945, 60.717, 2.47], ['ruchbah', 'Ruchbah', 1.43, 60.235, 2.68], ['segin', 'Segin', 1.907, 63.67, 3.37],
  ['sadr', 'Sadr', 20.37, 40.257, 2.23], ['albireo', 'Albireo', 19.512, 27.96, 3.18], ['gienah', 'Gienah', 20.77, 33.97, 2.46],
  ['rasalhague', 'Rasalhague', 17.582, 12.56, 2.08], ['eltanin', 'Eltanin', 17.943, 51.489, 2.23], ['sabik', 'Sabik', 17.173, -15.725, 2.43],
  ['dschubba', 'Dschubba', 16.006, -22.622, 2.32], ['graffias', 'Graffias', 16.091, -19.805, 2.62], ['imai', 'Imai', 12.252, -58.749, 2.8],
  ['sheliak', 'Sheliak', 18.835, 33.363, 3.5], ['sulafat', 'Sulafat', 18.982, 32.69, 3.25], ['tarazed', 'Tarazed', 19.771, 10.613, 2.72],
  ['alshain', 'Alshain', 19.922, 6.407, 3.71], ['meissa', 'Meissa', 5.585, 9.934, 3.39], ['larawag', 'Larawag', 16.836, -34.293, 2.29],
  ['zetasco', 'Zeta Sco', 16.909, -42.362, 3.6], ['etasco', 'Eta Sco', 17.203, -43.239, 3.33], ['iotasco', 'Iota Sco', 17.793, -40.127, 3.0],
  ['kappasco', 'Kappa Sco', 17.708, -39.03, 2.41], ['zosma', 'Zosma', 11.235, 20.524, 2.56], ['chertan', 'Chertan', 11.237, 15.43, 3.34],
  ['etaleo', 'Eta Leo', 10.122, 16.763, 3.52], ['zetaleo', 'Adhafera', 10.278, 23.417, 3.44], ['muleo', 'Rasalas', 9.879, 26.007, 3.88],
  ['epsleo', 'Algenubi', 9.764, 23.774, 2.98], ['ain', 'Ain', 4.477, 19.18, 3.53], ['deltacyg', 'Fawaris', 19.75, 45.131, 2.87],
  ['deltalyr', 'Delta Lyr', 18.908, 36.899, 4.3], ['zetalyr', 'Zeta Lyr', 18.746, 37.605, 4.36],
];

// Constelações (figuras simplificadas): pares de estrelas ligadas por uma linha.
export const SKY_CONSTELLATIONS = [
  { id: 'orion', name: 'Órion', lines: [['betelgeuse', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'], ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['alnitak', 'saiph'], ['mintaka', 'rigel'], ['betelgeuse', 'meissa'], ['bellatrix', 'meissa']] },
  { id: 'cruzeiro', name: 'Cruzeiro do Sul', lines: [['acrux', 'gacrux'], ['mimosa', 'imai']] },
  { id: 'ursamaior', name: 'Ursa Maior', lines: [['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid']] },
  { id: 'escorpiao', name: 'Escorpião', lines: [['graffias', 'dschubba'], ['dschubba', 'antares'], ['antares', 'larawag'], ['larawag', 'zetasco'], ['zetasco', 'etasco'], ['etasco', 'sargas'], ['sargas', 'iotasco'], ['iotasco', 'kappasco'], ['kappasco', 'shaula']] },
  { id: 'cassiopeia', name: 'Cassiopeia', lines: [['caph', 'schedar'], ['schedar', 'gammacas'], ['gammacas', 'ruchbah'], ['ruchbah', 'segin']] },
  { id: 'leao', name: 'Leão', lines: [['regulus', 'etaleo'], ['etaleo', 'algieba'], ['algieba', 'zetaleo'], ['zetaleo', 'muleo'], ['muleo', 'epsleo'], ['algieba', 'zosma'], ['zosma', 'denebola'], ['zosma', 'chertan'], ['chertan', 'regulus']] },
  { id: 'cisne', name: 'Cisne', lines: [['deneb', 'sadr'], ['sadr', 'albireo'], ['gienah', 'sadr'], ['sadr', 'deltacyg']] },
  { id: 'lira', name: 'Lira', lines: [['vega', 'zetalyr'], ['zetalyr', 'deltalyr'], ['deltalyr', 'sulafat'], ['sulafat', 'sheliak'], ['sheliak', 'zetalyr']] },
  { id: 'aguia', name: 'Águia', lines: [['tarazed', 'altair'], ['altair', 'alshain']] },
  { id: 'touro', name: 'Touro', lines: [['aldebaran', 'ain'], ['aldebaran', 'elnath']] },
  { id: 'gemeos', name: 'Gêmeos', lines: [['castor', 'pollux'], ['pollux', 'alhena']] },
  { id: 'caomaior', name: 'Cão Maior', lines: [['mirzam', 'sirius'], ['sirius', 'adhara'], ['adhara', 'wezen']] },
  { id: 'centauro', name: 'Centauro', lines: [['rigilkent', 'hadar'], ['hadar', 'menkent']] },
];

// Cidades para escolher o local sem usar GPS
export const SKY_CITIES = [
  ['São Paulo', -23.55, -46.63], ['Rio de Janeiro', -22.91, -43.17], ['Brasília', -15.79, -47.88], ['Salvador', -12.97, -38.51],
  ['Belo Horizonte', -19.92, -43.94], ['Fortaleza', -3.73, -38.52], ['Manaus', -3.12, -60.02], ['Porto Alegre', -30.03, -51.23],
  ['Curitiba', -25.43, -49.27], ['Recife', -8.05, -34.88], ['Lisboa', 38.72, -9.14], ['Nova York', 40.71, -74.01], ['Londres', 51.51, -0.13], ['Tóquio', 35.68, 139.69],
];
