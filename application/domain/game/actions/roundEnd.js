(function ({ timerOverdue = false } = {}) {
  this.updateTimerOverdueCounter(timerOverdue);

  this.roundActivePlayer().deactivate();
  if (!this.checkAllPlayersFinishRound()) return;

  for (const player of this.players()) {
    this.toggleEventHandlers(this.roundStep, {}, player);
  }

  this.run('roundStart'); // если убирать это отсюда, то нужно не забыть про handleAction по кнопке с фронта
});
