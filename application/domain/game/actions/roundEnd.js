(function ({ timerOverdue = false } = {}, initPlayer) {
  this.updateTimerOverdueCounter(timerOverdue);
  
  if (initPlayer) initPlayer.deactivate();

  for (const player of this.players({ ai: true })) {
    if (!player.active) continue;
    player.aiActions.forEach((action) => this.run(action.action, action.data, player));
    player.aiActions = [];
    this.run('roundEnd', {}, player);
  }

  if (!this.checkAllPlayersFinishRound()) return;

  for (const player of this.players()) {
    this.toggleEventHandlers(this.roundStep, {}, player);
  }

  this.run('roundStart'); // если убирать это отсюда, то нужно не забыть про handleAction по кнопке с фронта
});
