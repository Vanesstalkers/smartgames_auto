(function ({ timerOverdue, forceActivePlayer } = {}, initPlayer) {
  if (this.status !== 'IN_PROCESS') {
    console.debug('game', { status: this.status, id: this.id() });
    throw new Error('Действие запрещено.');
  }

  const players = this.getPlayerList();

  const timerOverdueCounter = timerOverdue ? (this.timerOverdueCounter || 0) + 1 : 0;
  // если много ходов было завершено по таймауту, то скорее всего все игроки вышли и ее нужно завершать
  if (timerOverdueCounter > this.autoFinishAfterRoundsOverdue) {
    this.checkWinnerAndFinishGame();
    return;
  }
  this.set({ timerOverdueCounter });

  if (timerOverdue) {
    // таймер закончился
    for (const player of players) player.set({ activeReady: true });
  } else {
    if (initPlayer) initPlayer.set({ activeReady: true });
  }
  if (!this.checkPlayersReady()) return; // ждем завершения хода всеми игроками

  this.toggleEventHandlers(this.roundStep, {}, players);

  const roundStepsFunc = domain.game.actions.games[this.gameType].roundSteps;
  if (roundStepsFunc) roundStepsFunc.call(this);
});
