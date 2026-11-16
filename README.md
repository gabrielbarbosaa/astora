# Astora

Explorador 3D do Universo em cinco escalas. Arraste para girar, role (ou pince) para dar zoom e clique em um astro para ver *Sobre*, *Dados* e *Curiosidades*.

| Nível | O que tem |
|---|---|
| **Telescópios** | ~30 observatórios: Hubble, James Webb (no ponto L2), Chandra, TESS, Gaia, Euclid e outros em órbita; ALMA, VLT, Keck, FAST, Rubin, LIGO, Event Horizon Telescope e outros em solo; mais os aposentados (Spitzer, Kepler, Arecibo) e os em construção (ELT, SKA, Roman) |
| **Sistema Solar** | Sol, planetas, luas, anéis, planetas anões (Ceres, Plutão, Éris), cinturões de asteroides e de Kuiper, cometa Halley |
| **Vizinhança Estelar** | ~17 estrelas próximas em posições reais (Alfa Centauri, Sirius, TRAPPIST-1 e outras) com seus exoplanetas |
| **Via Láctea** | Galáxia em ~60 mil partículas, Sol, nebulosas, pulsar, **Sagitário A\*** e Cygnus X-1 (buracos negros com disco e lente gravitacional em shader) |
| **Grupo Local** | Andrômeda, Triângulo, Nuvens de Magalhães, M81, Centaurus A, M51, Sombreiro e **M87\*** com jato |

Atalhos: `/` (ou `Ctrl+K`) abre a busca "Explorar", `1`–`4` trocam de escala, `←`/`→` astro anterior/próximo, `Espaço` pausa, `Esc` volta à visão geral.

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

- **Telescópios:** a Terra é estilizada (os continentes não coincidem com o mapa real), mas os pinos dos observatórios em solo usam latitude/longitude reais. As órbitas e distâncias dos satélites são estilizadas: L1 e L2 ficam bem mais perto da Terra do que na realidade (1,5 milhão de km).
- **Sistema Solar:** distâncias (UA) e diâmetros (km) dos planetas são proporcionais entre si. O Sol é desenhado menor que o real; órbitas das luas, períodos e tamanho mínimo de luas minúsculas são estilizados.
- **Vizinhança Estelar:** posições reais (ascensão reta, declinação, distância). Betelgeuse, Antares e Rigel têm distância comprimida; o raio das estrelas é estilizado.
- **Via Láctea e Grupo Local:** a forma das galáxias é estilizada por tipo (não são mapas reais), as distâncias do Grupo Local usam raiz quadrada, e buracos negros, nebulosas e jatos estão em escala exagerada.
- Otimizações: partículas em um único `Points` com shader próprio, níveis construídos sob demanda, pixel ratio ≤ 2, bloom desligado e menos partículas em dispositivos touch.

## Próximos passos

Texturas reais (NASA/Solar System Scope, KTX2/WebP), nuvens da Terra, mais luas, constelações, deploy no GitHub Pages.
