(function ({}, player) {
  player.set({ ready: false });
  const remainPlayersOverall = this.players().filter((p) => p.ready).length;

  if (remainPlayersOverall <= 0) return this.run('endGame');

  if (player === this.roundActivePlayer()) this.run('roundEnd');

  player.markDelete();
  player.set({ userId: null });
  this.set({ playerMap: { [player.id()]: null } });
});
