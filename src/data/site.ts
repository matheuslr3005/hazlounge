export const site = {
  name: 'HAZ Poker Lounge',
  instagramHandle: 'hazpokerlounge',
  instagramUrl: 'https://www.instagram.com/hazpokerlounge/',
  /**
   * Número do WhatsApp do lounge no formato internacional, só dígitos (ex.: "5511999999999").
   * Enquanto estiver vazio, os botões de WhatsApp ficam ocultos.
   */
  whatsapp: '',
  currency: 'R$',
  defaultBuyIn: 500,
  startTime: '19h',
  perks: [
    {
      id: 'holdem',
      title: "Hold'em e variações",
      text: 'Mesa de Texas Hold’em com variações para quem quer mudar o jogo ao longo da noite.',
      icon: 'cards',
    },
    {
      id: 'drinks',
      title: 'Bebidas liberadas',
      text: 'Bebidas liberadas para os jogadores durante toda a sessão.',
      icon: 'cocktail',
    },
    {
      id: 'hookah',
      title: 'Narguilé liberado',
      text: 'Sessão de narguilé liberada para os jogadores, direto da mesa.',
      icon: 'hookah',
    },
  ],
} as const

export type Perk = (typeof site.perks)[number]
