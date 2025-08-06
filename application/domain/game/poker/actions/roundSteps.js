(function () {
  const {
    rounds,
    round: roundNumber,
    decks,
  } = this;
  const round = rounds[roundNumber];
  const players = this.players();
  const result = { newRoundLogEvents: [], newRoundNumber: roundNumber };

  switch (this.roundStep) {
    case 'ROUND_START': {
      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
      const round = this.prepareRoundObject();
      const {
        car: carDeck,
        service: serviceDeck,
        client: clientDeck,
        feature: featureDeck,
        credit: creditDeck,
      } = decks;
      const { zone_flop: flopZone, zone_turn: turnZone, zone_river: riverZone } = decks;

      round.clientCard = clientDeck.getRandomItem();
      round.clientCard.moveToTarget(flopZone);

      flopZone.setItemVisible(round.clientCard);

      round.featureCard = featureDeck.getRandomItem();
      round.featureCard.moveToTarget(turnZone);
      round.creditCard = creditDeck.getRandomItem();
      round.creditCard.moveToTarget(riverZone);

      round.clientMoney = this.calcClientMoney();

      for (const player of players) {
        const cards = carDeck.moveRandomItems({ count: 2, target: player.decks.car });
        const services = serviceDeck.moveRandomItems({ count: 2, target: player.decks.service });
        for (const card of [...cards, ...services]) {
          card.set({ eventData: { playDisabled: true } });
        }
      }

      if (!round.currentPlayer) round.currentPlayer = players[0];
      round.currentPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });

      result.statusLabel = `Раунд ${result.newRoundNumber} (Префлоп)`;
      result.roundStep = 'BET';

      return result;
    }

    case 'BET': {
      const { currentPlayer, carCard } = round;
      const nextPlayer = currentPlayer.nextPlayer();
      round.currentPlayer = nextPlayer;

      nextPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });

      result.statusLabel = `Раунд ${result.newRoundNumber} (ставка игрока ${nextPlayer.userName})`;
      result.roundStep = 'BET';

      return { ...result };
    }

    case 'ROUND_END': {
      this.removeTableCards();
      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
