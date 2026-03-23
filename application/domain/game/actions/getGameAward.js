(function () {
  const winner = this.players().find((player) => player.endGameStatus === 'win');
  if (!winner) return 0;

  const baseSum = winner.money;
  const timerMod = 30000 / this.gameTimer;
  const configMod = {}[this.gameConfig] || 1;
  const difficultyMod = {}[this.difficulty] || 1;

  return Math.floor(baseSum * timerMod * configMod * difficultyMod); // TO CHANGE (меняем на свою сумму логику расчета награды за игру)
});
