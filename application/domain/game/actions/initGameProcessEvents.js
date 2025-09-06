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

        if (game.restorationMode) return;

        for (let idx = 0; idx < players.length; idx++) {
          const player = players[idx];

          if (startDecks.length) {
            for (const [deckType, { start: count }] of startDecks) {
              if (typeof count === 'object') {
                const { customAction, actionData = {} } = count;
                actionData.idx = idx;
                if (customAction) game.run(customAction, actionData, player);
              } else {
                const playerHand = player.find(`Deck[card_${deckType}]`);
                const deck = game.find(`Deck[card_${deckType}]`);
                deck.moveRandomItems({ count, target: playerHand });
              }
            }
          }
        }
      },
    },
    { allowedPlayers: this.players() }
  );
});
