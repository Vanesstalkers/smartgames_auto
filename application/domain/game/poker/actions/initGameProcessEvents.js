(function () {
  const { handlers } = lib.game.events.common.gameProcess();

  return this.initEvent(
    {
      name: 'gameProcess',
      init() {
        const { game } = this.eventContext();

        for (const player of game.players()) {
          // для игроков, подключившихся до вызова initGameProcessEvents
          player.set({ money: game.settings.playerStartMoney });
        }
      },
      handlers: {
        ...handlers,
        PLAYER_JOIN({ initPlayer: player }) {
          const { game } = this.eventContext();

          player.set({ money: game.settings.playerStartMoney });
          return { preventListenerRemove: true };
        },
      },
    },
    { publicHandlers: ['PLAYER_JOIN'] }
  );
});
