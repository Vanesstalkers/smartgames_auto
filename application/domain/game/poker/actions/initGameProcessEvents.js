(function () {
  const { handlers } = lib.game.events.common.gameProcess();

  return this.initEvent(
    {
      name: 'gameProcess',
      handlers,
      init() {
        const { game } = this.eventContext();
        const { playerHand } = game.settings;
        const startDecks = Object.entries(playerHand || {});
        const players = game.players();

        for (const player of players) {
          player.set({ money: 10000 });
        }
      },
    },
    { allowedPlayers: this.players() }
  );
});
