(function () {
  const winner = this.players().find((player) => player.endGameStatus === 'win');
  if (!winner) return 0;

  const baseSum = winner.money;
  const timerMod = 30000 / this.gameTimer;
  const difficultyMod = {weak: 0.005, strong: 0.001}[this.difficulty] || 0;

  return Math.floor(baseSum * timerMod * difficultyMod);
});
