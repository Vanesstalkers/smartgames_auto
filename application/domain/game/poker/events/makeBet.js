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
    TRIGGER({ action }) {
      const { game, player } = this.eventContext();
      const round = game.rounds[game.round];

      switch (action) {
        case 'raise':
        case 'call':
        case 'check':
        case 'reset':
          round.bets[player.id()].ready = true;
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
