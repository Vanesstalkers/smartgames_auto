(function ({ forceActivePlayer } = {}, initPlayer) {
  const players = this.players();
  if (initPlayer) initPlayer.set({ activeReady: true });
  
  if (!this.checkPlayersReady()) return; // ждем завершения хода всеми игроками

  this.toggleEventHandlers(this.roundStep, {}, players);

  const roundStepsFunc = domain.game.actions.games[this.gameType].roundSteps;
  if (roundStepsFunc) roundStepsFunc.call(this);
});
