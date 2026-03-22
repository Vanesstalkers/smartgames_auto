(function ({ winningPlayer, canceledByUser, message } = {}) {
  this.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true, message });

  this.broadcastAction('gameFinished', {
    gameId: this.id(),
    gameCode: this.gameCode,
    userEndGameStatusMap: this.userEndGameStatusMap,
    gameAward: this.run('getGameAward'),
    roundCount: this.round,
  });

  throw new lib.game.endGameException();
});
