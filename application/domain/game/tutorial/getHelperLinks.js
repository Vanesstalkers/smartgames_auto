() => ({
  gameControls: {
    selector: '.game-controls',
    tutorial: 'game-tutorial-gameControls',
    type: 'game',
    pos: { top: false, left: false },
    simple: false,
  },
  handCards: {
    selector: '.session-player .player.iam.active .hand-cards .card-event:first-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  cardActive: {
    selector: '[code="Deck[card_active]"] .card-event',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: false, left: true },
  },
  leaveGame: {
    selector: '.leave-game-btn',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
});
