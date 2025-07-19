() => ({
  steps: {
    ...lib.game.tutorial.links.steps,

    handCards: {
      pos: 'top-right',
      text: 'TO_CHANGE',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Продолжай', step: 'handCardsEvents' }],
    },
    handCardsEvents: {
      pos: 'top-right',
      text: 'TO_CHANGE',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    cardActive: {
      pos: 'bottom-left',
      text: 'TO_CHANGE',
      active: '[code="Deck[card_active]"]',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
