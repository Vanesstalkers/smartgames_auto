(function ({ winningPlayer, canceledByUser } = {}) {
  this.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true });

  this.broadcastAction('gameFinished', {
    gameId: this.id(),
    gameType: this.deckType,
    playerEndGameStatus: this.playerEndGameStatus,
    fullPrice: winningPlayer?.money,
    roundCount: this.round,
  });

  throw new lib.game.endGameException();
});
