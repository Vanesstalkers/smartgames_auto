(function ({}, player) {
  player.set({ ready: false });
  const remainPlayersOverall = this.players().filter((p) => p.ready).length;

  if (remainPlayersOverall <= 0) return this.run('endGame');

  const round = this.rounds[this.round];
  const playerBet = round.bets[player.id()];
  if (playerBet) {
    playerBet.ready = true;
    playerBet.out = true;
  }

  if (player === this.roundActivePlayer()) this.run('roundEnd');

  player.markDelete();
  player.set({ userId: null });
  this.set({ playerMap: { [player.id()]: null } });
});
