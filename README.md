# Astora

Explorador 3D do Universo em cinco escalas. Arraste para girar, role (ou pince) para dar zoom e clique em um astro para ver *Sobre*, *Dados* e *Curiosidades*.

| Nível | O que tem |
|---|---|
| **Telescópios** | ~30 observatórios: Hubble, James Webb (no ponto L2), Chandra, TESS, Gaia, Euclid e outros em órbita; ALMA, VLT, Keck, FAST, Rubin, LIGO, Event Horizon Telescope e outros em solo; mais os aposentados (Spitzer, Kepler, Arecibo) e os em construção (ELT, SKA, Roman) |
| **Sistema Solar** | Sol, planetas, luas, anéis, planetas anões (Ceres, Plutão, Éris), cinturões de asteroides e de Kuiper, cometa Halley |
| **Vizinhança Estelar** | ~17 estrelas próximas em posições reais (Alfa Centauri, Sirius, TRAPPIST-1 e outras) com seus exoplanetas |
| **Via Láctea** | Galáxia em ~60 mil partículas, Sol, nebulosas, pulsar, **Sagitário A\*** e Cygnus X-1 (buracos negros com disco e lente gravitacional em shader) |
| **Grupo Local** | Andrômeda, Triângulo, Nuvens de Magalhães, M81, Centaurus A, M51, Sombreiro e **M87\*** com jato |

## Recursos

- **Links diretos:** cada escala e astro tem URL própria (`#/solar/saturno`, `#/galaxy/sgra`), com título dinâmico e botão de compartilhar. Metadados Open Graph e imagem de pré-visualização (`public/og.png`) para redes sociais.
- **Aba "Brincar":** quanto você pesaria, sua idade e quanto tempo levaria para chegar em cada astro (a pé, de carro, de avião, na velocidade da Voyager 1 e da luz).
- **Tour guiado:** visita narrada (voz opcional, via síntese do navegador) por 17 paradas, do James Webb ao Grupo Local.
- **Modo "Hoje":** posições reais dos planetas e da Lua (biblioteca [Astronomy Engine](https://github.com/cosinekitty/astronomy)), com órbitas elípticas reais e viagem no tempo entre 1900 e 2100. O pacote é carregado só quando o modo é ligado. Ceres, Éris e Halley seguem movimento real, mas com posição aproximada.
- **Sondas:** Voyager 1 e 2, New Horizons (posições aproximadas em nov/2026, afastando-se em linha reta) e Juno em órbita de Júpiter.
- **Fases da Lua e eclipses:** no modo "Hoje", a Terra segue o eixo e a rotação reais, a Lua mostra a fase, a sombra dela cai sobre a Terra nos eclipses solares e a Lua escurece (cobre) nos lunares. Há uma lista dos próximos eclipses e controle de velocidade do tempo.
- **Satélites ao vivo (nível Telescópios, botão "Ao vivo"):** ISS, telescópios espaciais, GPS, satélites geoestacionários e, opcionalmente, Starlink, nas posições reais de agora (dados orbitais do [CelesTrak](https://celestrak.org/) + satellite.js). A Terra e o Sol seguem o horário real. Os dados são buscados no navegador e guardados por ~2 h.
- **Meu céu:** planetário 2D do céu de hoje no seu lugar (cidade ou localização, que nunca sai do dispositivo), com Sol, Lua com fase, planetas, ~90 estrelas e 13 constelações, e um controle de ±12 horas.
- **Celular e PWA:** layout adaptado a telas pequenas, menos carga em dispositivos touch, instalável como app e com cache offline (service worker, só em HTTPS).
- **Créditos e licenças** em uma janela própria (botão ⓘ).

Atalhos: `/` (ou `Ctrl+K`) abre a busca "Explorar", `1`–`4` trocam de escala, `←`/`→` astro anterior/próximo, `Espaço` pausa, `Esc` volta à visão geral (ou encerra o tour).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera ./dist
```

## Estrutura

- `src/main.js` — cena, câmera, gerenciador de níveis, seleção e loop
- `src/levels/` — um módulo por escala (`solar`, `stars`, `galaxy`, `universe`)
- `src/engine/` — partículas de galáxia, marcadores e o shader do buraco negro
- `src/data/` — conteúdo em pt-BR de cada astro
- `src/textures.js`, `src/ui.js`, `src/style.css`

## Escala e fidelidade

- **Telescópios:** a Terra usa texturas reais, e os pinos dos observatórios em solo usam latitude/longitude reais. As órbitas e distâncias dos satélites são estilizadas: L1 e L2 ficam bem mais perto da Terra do que na realidade (1,5 milhão de km).
- **Sistema Solar:** distâncias (UA) e diâmetros (km) dos planetas são proporcionais entre si. O Sol é desenhado menor que o real; órbitas das luas, períodos e tamanho mínimo de luas minúsculas são estilizados.
- **Vizinhança Estelar:** posições reais (ascensão reta, declinação, distância). Betelgeuse, Antares e Rigel têm distância comprimida; o raio das estrelas é estilizado.
- **Via Láctea e Grupo Local:** a forma das galáxias é estilizada por tipo (não são mapas reais), as distâncias do Grupo Local usam raiz quadrada, e buracos negros, nebulosas e jatos estão em escala exagerada.
- Otimizações: partículas em um único `Points` com shader próprio, níveis construídos sob demanda, pixel ratio ≤ 2, bloom desligado e menos partículas em dispositivos touch.

## Créditos

- Texturas da Terra (`public/textures/earth/`): imagens de exemplo do repositório do [three.js](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets), originadas de dados da NASA. Confirme a licença antes de publicar o site.
- Texturas de Sol, Mercúrio, Vênus (camada de nuvens), Lua, Marte, Júpiter, Saturno (e anéis), Urano e Netuno (`public/textures/planets/`, 2K): [Solar System Scope](https://www.solarsystemscope.com/textures/), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), baseadas em dados da NASA. São carregadas sob demanda, quando a câmera chega perto (`src/planetMaps.js`).
- A Terra usa mapa de cores, relevo, brilho do oceano, nuvens e luzes de cidade apenas no lado noturno (`src/earth.js`). Os demais astros ainda usam texturas procedurais.

## Próximos passos

Texturas reais (NASA/Solar System Scope, KTX2/WebP), nuvens da Terra, mais luas, constelações, deploy no GitHub Pages.
