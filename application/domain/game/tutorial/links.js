() => ({
  steps: {
    ...lib.game.tutorial.links.steps,
    opponentCards: {
      pos: 'bottom-right',
      text: `
        Это предложения твоих соперников.
      `,
      active: '.players .hand-cards.at-table .card-event',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    pokerChipsPanel: {
      pos: 'bottom-right',
      text: `
        Для выбора размера ставки выделяй нужное количество фишек в стопках.
      `,
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
