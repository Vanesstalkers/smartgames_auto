() => ({
  name: 'makeBet',
  init() {
    const { game, source: player } = this.eventContext();
    const round = game.rounds[game.round];
    if (!round.bets) round.bets = {};
    if (!round.bets[player.id()]) round.bets[player.id()] = {};
  },
  handlers: {
    RESET() {
      const { game, player, source, sourceId } = this.eventContext();

      this.destroy();
    },
    TRIGGER({ action, amount }) {
      const { game, player } = this.eventContext();
      const round = game.rounds[game.round];
      const playerBet = round.bets[player.id()];

      switch (action) {
        case 'raise':
          playerBet.amount = amount;
          player.set({ money: player.money - amount });
          break;
        case 'call':
          // !!!! не работает + нужно блокировать кнопку на фронте
          playerBet.amount = amount;
          player.set({ money: player.money - amount });
          playerBet.ready = true;
          break;
        case 'check':
          playerBet.ready = true;
          break;
        case 'reset':
          playerBet.ready = true;
          playerBet.reset = true;

          const remainingPlayersInRound = game.players().filter((player) => {
            const { reset } = round.bets[player.id()] || {};
            return !reset;
          });
          if (remainingPlayersInRound.length === 1) round.roundStepWinner = remainingPlayersInRound[0];

          break;
      }

      this.emit('RESET');
      game.run('roundEnd', {}, player);
    },
    ROUND_END() {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { action: 'check' }, player);
    },
  },
});
