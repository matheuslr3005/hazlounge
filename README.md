# HAZ Poker Lounge

Site interativo do HAZ Poker Lounge: abertura em 3D com uma mesa de poker realista onde as cartas são distribuídas, hero com cartas e fichas em 3D, agenda de eventos e reservas.

**Stack:** Vite · React 19 · TypeScript · three.js (`@react-three/fiber`, `drei`, `postprocessing`) · framer-motion · zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # saída em dist/
```

## Identidade visual

Segue o PDF "HAZ Poker Lounge · Identidade visual" (LAX, out/2026): cores Noite `#121110`, Osso `#EEE7DA`, Feltro `#1D3A2F`, Latão `#C4A472` e Copas `#C23B2E`; fontes Instrument Serif (títulos) e Inter (textos). O logo e o símbolo (o Ás) são desenhados em código em `src/components/brand.ts` e `src/components/Logo.tsx`; o padrão do Ás está em `src/components/AcePattern.tsx`. As cores ficam como variáveis no topo de `src/styles/global.css`.

## Onde editar o conteúdo

| O quê | Arquivo |
| --- | --- |
| Eventos, datas, buy-in, horário | `src/data/events.ts` |
| Instagram, WhatsApp, benefícios, valor padrão | `src/data/site.ts` |
| Ranking das mãos (exemplos, textos, chances) | `src/data/hands.ts` |
| Mão da abertura (cartas do jogador e flop) | `src/scene/IntroScene.tsx` |
| Fotos dos eventos | `public/images/` (hoje recortadas do post, em baixa resolução) |

## Como o 3D funciona

- **Abertura (tela de carregamento):** `src/components/Intro.tsx` mostra `src/scene/IntroScene.tsx`, uma mesa de poker em 3D onde as cartas são distribuídas, o flop é aberto e a câmera mergulha nas cartas. Dura cerca de 5,6 s e tem botão "Pular abertura". Depois um clarão dourado abre o site.
- **Hero:** `src/scene/HeroScene.tsx` é um close da mesa. Um royal flush sai do baralho, é espalhado, virado e aberto em leque conforme o scroll, e fichas caem na mesa. Fica dentro de `src/sections/Hero.tsx`.
- `src/scene/RealCard.tsx` (carta com espessura, borda de papel e acabamento brilhante), `src/scene/Chip.tsx` (ficha com chanfro e listras na borda) e `src/scene/Table.tsx` (feltro com fibras, borda de couro, ouro) são compartilhados.
- Em telas pequenas ou com poucos núcleos a qualidade cai (sem desfoque nem MSAA). Sem WebGL, ou com "reduzir movimento" ligado, o site abre direto.
- Em desenvolvimento, `?introAt=4.4&introFreeze=1` congela a abertura num instante para inspecionar um quadro.

## Reservas e pagamento (pelo WhatsApp)

Não há cobrança nem banco de dados no site. A pessoa escolhe a noite e as cadeiras, informa nome e WhatsApp, e o site abre a conversa com o HAZ já com o pedido escrito (`src/lib/booking.ts`). A equipe confirma a cadeira e combina o pagamento direto com ela, pelo WhatsApp. O formulário de aluguel do lounge segue o mesmo caminho.

Para funcionar, preencha o número do HAZ em `src/data/site.ts` (`whatsapp`, só dígitos com 55 e DDD, ex.: `5511999999999`). Enquanto estiver vazio, o botão vira "Copiar pedido de reserva".

**Cadeiras ocupadas:** quando a equipe fechar uma reserva, marque as cadeiras em `TAKEN_SEATS` no fim de `src/data/events.ts` (ex.: `'pizza-night-2026-10-27': [2, 5]`) e publique de novo. Cadeiras de 1 a 9.

> O sistema de pagamento online (Mercado Pago, banco D1, aviso automático no WhatsApp) foi construído e depois retirado. Está no histórico do git, no commit `ce881e5`, caso volte a ser útil.
