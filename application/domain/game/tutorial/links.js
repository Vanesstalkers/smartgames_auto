() => ({
  steps: {
    ...lib.game.tutorial.links.steps,
    opponentCards: {
      pos: 'bottom-right',
      text: `
        Это предложения твоих соперников.
      `,
      active: '.players .hand-cards.at-table .card-event',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    },
  },
});
