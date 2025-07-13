(function () {
  const { playerHand } = this.settings;
  const startDecks = Object.entries(playerHand || {});

  const players = this.players();
  for (let idx = 0; idx < players.length; idx++) {
    const player = players[idx];

    if (startDecks.length) {
      for (const [deckType, { start: count }] of startDecks) {
        if (typeof count === 'object') {
          const { customAction, actionData = {} } = count;
          actionData.idx = idx;
          if (customAction) this.run(customAction, actionData, player);
        } else {
          const playerHand = player.find(`Deck[card_${deckType}]`);
          const deck = this.find(`Deck[card_${deckType}]`);
          deck.moveRandomItems({ count, target: playerHand });
        }
      }
    }
  }

  this.initEvent(
    {
      handlers: {
        PLAYER_TIMER_END: function () {
          const { game, player } = this.eventContext();

          game.logs({
            msg: `Игрок {{player}} не успел завершить все действия за отведенное время, и раунд завершится автоматически.`,
            userId: player.userId,
          });

          game.run('roundEnd', { timerOverdue: true });
          return { preventListenerRemove: true };
        },
      },
    },
    { defaultResetHandler: true, allowedPlayers: this.players() }
  );

  this.set({ status: 'IN_PROCESS', roundStep: 'ROUND_START' });
  this.run('roundStart');

  return { status: 'ok' };
});
