# HAZ Poker Lounge

Site interativo do HAZ Poker Lounge: abertura em 3D com uma mesa de poker realista onde as cartas são distribuídas, hero com cartas e fichas em 3D, agenda de eventos e reservas.

**Stack:** Vite · React 19 · TypeScript · three.js (`@react-three/fiber`, `drei`, `postprocessing`) · framer-motion · zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # saída em dist/
```

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

## Reservas e pagamento (demonstração)

`src/lib/booking.ts` guarda reservas só no `localStorage` e simula o pagamento. Nada sai do navegador e nenhum dado de cartão é coletado. Antes de publicar, troque `submitSeatReservation` e `submitRentalRequest` por chamadas a uma API real e conecte um provedor de pagamento (Mercado Pago, Pagar.me, Stripe etc.). A disponibilidade de cadeiras (`takenSeatsFor` em `events.ts`) também é simulada.
