() => ({
  name: 'betEvent',
  handlers: {
    TRIGGER({ action, amount }) {
      const { game, player } = this.eventContext();
      const round = game.rounds[game.round];
      const playerBet = round.bets[player.id()];

      switch (action) {
        case 'raise':
          game.logs({ msg: `Игрок {{player}} поднял ставку на ${amount}₽.`, userId: player.userId });

          for (const player of game.players()) {
            const bet = round.bets[player.id()];
            if (bet.out) continue;
            bet.ready = false;
          }

          player.bet(amount);
          playerBet.raiseCount++;
          playerBet.ready = true;
          break;
        case 'call':
          game.logs({ msg: `Игрок {{player}} уровнял ставку до ${amount}₽.`, userId: player.userId });
          player.bet(amount);
          playerBet.ready = true;
          break;
        case 'check':
          game.logs({ msg: `Игрок {{player}} пропустил ставку.`, userId: player.userId });
          playerBet.ready = true;
          break;
        case 'reset':
          game.logs({ msg: `Игрок {{player}} сбросил карты.`, userId: player.userId });
          playerBet.ready = true;
          playerBet.out = true;
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
