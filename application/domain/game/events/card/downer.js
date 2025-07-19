() => ({
  init: function () {
    const { game, player } = this.eventContext();
    player.set({ eventData: { skipTurn: true } });
    game.logs({ msg: `Игрок пропускает следующий ход.`, userId: player.userId });

    return { resetEvent: true };
  },
});
