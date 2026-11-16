# Astora

Explorador 3D do Sistema Solar em modelo **geocêntrico**: a Terra fica no centro e a Lua, o Sol e os planetas giram ao redor dela. Arraste para girar a câmera, use a roda do mouse (ou pinça) para zoom e clique em um astro para ver *Sobre*, *Dados* e *Curiosidades*.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera ./dist
```

## Estrutura

- `src/main.js` — cena, câmera, loop de animação, clique/voo de câmera
- `src/textures.js` — texturas procedurais (trocáveis por mapas reais)
- `src/data/bodies.js` — conteúdo em pt-BR e parâmetros de cada astro
- `src/ui.js` / `src/style.css` — painel de detalhes e barra inferior

## Observações

- Sol no centro (modelo heliocêntrico). **Distâncias (UA) e diâmetros (km) dos planetas são proporcionais entre si.**
- Exceções para caber na tela: o Sol é desenhado menor que o real, as órbitas das luas e os períodos orbitais são estilizados, e luas minúsculas têm um tamanho mínimo visível.
- Ao selecionar um planeta, suas luas e órbitas aparecem e podem ser clicadas.
- Otimizações: estrelas em um único `Points`, pixel ratio limitado a 2, bloom desligado em dispositivos touch, rótulos HTML em vez de sprites, chunk separado do Three.js.

## Próximos passos

Texturas reais (NASA/Solar System Scope, KTX2/WebP), nuvens da Terra, mais luas, página de lista de planetas, deploy no GitHub Pages.
