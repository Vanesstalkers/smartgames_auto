() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { skipRound: { [game.round + 1]: true } } });
    },
  });
