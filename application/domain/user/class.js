() =>
  class ReleaseGameUser extends lib.game.userClass() {
    // TO_CHANGE (название класса + расчет rankings)
    async gameFinished({ gameId, gameType, playerEndGameStatus, fullPrice, roundCount }) {
      const {
        helper: { getTutorial },
        utils: { structuredClone: clone },
      } = lib;

      if (this.viewerId) {
        this.set({
          helper: {
            text: 'Игра закончена',
            buttons: [{ text: 'Закончить игру', action: 'leaveGame' }],
            actions: {
              leaveGame: (async () => {
                await api.action.call({ path: 'game.api.leave', args: [] }).catch(prettyAlert);
                return { exit: true };
              }).toString(),
            },
          },
        });
        await this.saveChanges();
        return;
      }

      const endGameStatus = playerEndGameStatus[this.id()];

      const rankings = clone(this.rankings || {});
      if (!rankings[gameType]) rankings[gameType] = {};
      const { games = 0, win = 0, money = 0, penalty = 0, totalTime = 0 } = rankings[gameType];

      let income = 0;
      let penaltySum = 0;
      if (endGameStatus === 'win') {
        penaltySum = 0; // TO_CHANGE
        income = fullPrice * 1000 - penaltySum;
        rankings[gameType].money = money + income;
        if (income < 0) income = 0; // в рейтинги отрицательный результата пишем
        rankings[gameType].penalty = penalty + penaltySum;
        rankings[gameType].win = win + 1;
      }
      rankings[gameType].games = games + 1;
      rankings[gameType].totalTime = totalTime + roundCount;
      rankings[gameType].avrTime = Math.floor(rankings[gameType].totalTime / rankings[gameType].win);

      const tutorial = clone(getTutorial('game-tutorial-finished'), {
        convertFuncToString: true,
      });
      let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
      if (penaltySum > 0)
        incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽)`;
      tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);
      this.set({ money: (this.money || 0) + income, helper: tutorial[endGameStatus], rankings });
      await this.saveChanges();
    }
  };
