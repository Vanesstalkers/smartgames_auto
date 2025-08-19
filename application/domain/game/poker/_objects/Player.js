(class Player extends domain.game._objects.Player {
  getHandCards() {
    return this.decks.hand.items();
  }

  bet(amount) {
    const round = this.game().rounds[this.game().round];
    const playerBet = round.bets[this.id()];

    const money = this.money - amount;
    if (money < 0) throw 'not_enough_money';

    this.set({ money });
    playerBet.amount += amount;
    round.pot += amount;

    return playerBet;
  }
  nextPlayer() {
    let player = super.nextPlayer();
    const game = this.game();
    const round = game.rounds[game.round];

    while ((!round.bets[player.id()] || round.bets[player.id()]?.out) && player !== this) {
      player = player.nextPlayer();
    }

    return player;
  }
  activate() {
    super.activate(...arguments);
    this.game().roundActivePlayer(this);
  }
});
