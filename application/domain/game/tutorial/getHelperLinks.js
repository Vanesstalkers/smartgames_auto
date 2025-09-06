() => ({
  ...lib.game.tutorial.getHelperLinks(),
  clientCard: {
    selector: '#gamePlane [code="Deck[card_zone_client]"] .card-event.visible',
    tutorial: 'game-tutorial-clientCard',
    simple: false,
    type: 'game',
    pos: { top: true, right: true },
  },
  creditCard: {
    selector: '#gamePlane [code="Deck[card_zone_credit]"] .card-event.visible',
    tutorial: 'game-tutorial-creditCard',
    simple: false,
    type: 'game',
    pos: { top: true, right: true },
  },
  opponentCards: {
    selector: '.players .hand-cards.at-table',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, right: true },
  },
  pokerChipsPanel: {
    selector: '.chips-panel.select-mode',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { bottom: true, left: true },
  },
});
