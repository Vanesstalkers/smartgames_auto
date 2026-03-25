() => ({
  ...lib.lobby.tutorial.getHelperLinks(),
  menuGamePoker: {
    selector: '.game-block .select-btn.poker',
    tutorial: 'lobby-tutorial-menuGamePoker',
    simple: false,
    type: 'lobby',
  },
});
