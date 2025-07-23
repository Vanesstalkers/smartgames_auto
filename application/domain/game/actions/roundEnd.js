(function ({ timerOverdue = false } = {}, initPlayer) {
  this.updateTimerOverdueCounter(timerOverdue);

  if (initPlayer) initPlayer.deactivate();
  if (!this.checkAllPlayersFinishRound()) return;

  for (const player of this.players()) {
    this.toggleEventHandlers(this.roundStep, {}, player);
  }

  this.run('roundStart'); // если убирать это отсюда, то нужно не забыть про handleAction по кнопке с фронта
});
