(function () {
  const { rounds, round: roundNumber, decks } = this;
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

      round.step = 'preflop';

      round.clientCard = clientDeck.getRandomItem();
      round.clientCard.moveToTarget(flopZone);
      flopZone.setItemVisible(round.clientCard);
      round.featureCard = featureDeck.getRandomItem();
      round.featureCard.moveToTarget(turnZone);
      turnZone.setItemVisible(round.featureCard);
      round.creditCard = creditDeck.getRandomItem();
      round.creditCard.moveToTarget(riverZone);
      riverZone.setItemVisible(round.creditCard);

      round.clientMoney = this.calcClientMoney();

      for (const player of players) {
        const cards = carDeck.moveRandomItems({ count: 4, target: player.decks.car });
        const services = serviceDeck.moveRandomItems({ count: 4, target: player.decks.service });
        for (const card of [...cards, ...services]) {
          card.set({ eventData: { playDisabled: true } });
        }
      }

      if (!round.currentPlayer) round.currentPlayer = players[0];
      round.currentPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });
      round.currentPlayer.initEvent(domain.game.poker.events.makeBet());

      result.statusLabel = `Раунд ${result.newRoundNumber} (Префлоп)`;
      result.roundStep = 'BET';

      return result;
    }

    case 'BET': {
      const { zone_flop: flopZone, zone_turn: turnZone, zone_river: riverZone } = decks;
      const { currentPlayer, bets, roundStepWinner } = round;
      const nextPlayer = currentPlayer.nextPlayer();
      round.currentPlayer = nextPlayer;

      if (roundStepWinner) {
        result.roundStep = 'ROUND_END';
        return { ...result, forcedEndRound: true };
      }

      result.roundStep = 'BET';

      if (players.every((_) => bets[_.id()]?.ready)) {
        switch (round.step) {
          case 'preflop':
            flopZone.setItemVisible(round.clientCard);
            round.step = 'flop';

            const { clientCard, featureCard, creditCard } = round;
            for (const player of players) {
              const starCards = new Map();
              const priceGroupCards = new Map();
              for (const service of player.decks.service.items()) {
                if (service.stars > 0) starCards.set(service.name, service);
                if (clientCard.priceGroup === '*') continue;
                if (service.priceGroup?.some((group) => clientCard.priceGroup.includes(group)))
                  priceGroupCards.set(service.name, service);
              }

              const offers = [];
              for (const car of player.decks.car.items()) {
                let serviceCards = [];

                if (car.stars + starCards.size < clientCard.stars) continue;
                const carPriceGroup = car.priceGroup;
                const carEquip = car.equip;

                if (
                  clientCard.priceGroup !== '*' &&
                  !car.priceGroup.some((group) => clientCard.priceGroup.includes(group))
                ) {
                  const cards = [...priceGroupCards.values()];
                  if (cards.length === 0) continue;

                  const matchingServiceCard = cards
                    .filter((card) => !card.priceGroup.some((group) => carPriceGroup.includes(group)))
                    .filter((card) => !card.equip || !card.equip.some((equip) => carEquip.includes(equip)))
                    .sort((a, b) => {
                      const aPrice =
                        a.price.at(-1) === '%' ? (a.price.slice(0, -1) * car.price) / 100 : parseInt(a.price);
                      const bPrice =
                        b.price.at(-1) === '%' ? (b.price.slice(0, -1) * car.price) / 100 : parseInt(b.price);
                      return aPrice - bPrice;
                    })[0];
                  if (!matchingServiceCard) continue;

                  serviceCards.push(matchingServiceCard);
                }

                if (car.stars < clientCard.stars) {
                  const cards = [...starCards.values()];
                  if (cards.length === 0) continue;
                  const matchingStarCards = cards
                    .filter((card) => !card.equip || !card.equip.some((equip) => carEquip.includes(equip)))
                    .sort((a, b) => {
                      const aPrice =
                        a.price.at(-1) === '%' ? (a.price.slice(0, -1) * car.price) / 100 : parseInt(a.price);
                      const bPrice =
                        b.price.at(-1) === '%' ? (b.price.slice(0, -1) * car.price) / 100 : parseInt(b.price);
                      return aPrice - bPrice;
                    });
                  const needStars = clientCard.stars - car.stars;
                  if (!matchingStarCards || matchingStarCards.length < needStars) continue;

                  serviceCards.push(...matchingStarCards.slice(0, needStars));
                }

                // offers.push(this.calcOffer({ player, carCard: car, serviceCards, featureCard }));
                offers.push({ car, serviceCards });
              }

              const bestOffer = offers.sort((a, b) => b.car.stars - a.car.stars)[0];
            }

            result.roundStep = 'ROUND_END';
            return { ...result, forcedEndRound: true };

            break;
          case 'flop':
            turnZone.setItemVisible(round.featureCard);
            round.step = 'turn';
            break;
          case 'turn':
            riverZone.setItemVisible(round.creditCard);
            round.step = 'river';
            break;
          case 'river':
            result.roundStep = 'ROUND_END';
            break;
        }

        for (const player of players) {
          const bet = bets[player.id()];
          if (bet.reset) continue;
          bet.ready = false;
        }

        return { ...result, forcedEndRound: true };
      }

      nextPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });
      round.currentPlayer.initEvent(domain.game.poker.events.makeBet());

      result.statusLabel = `Раунд ${result.newRoundNumber} (ставка игрока ${nextPlayer.userName})`;
      result.roundStep = 'BET';

      return { ...result };
    }

    case 'ROUND_END': {
      const { clientCard, featureCard, creditCard } = round;
      const {
        car: carDeck,
        service: serviceDeck,
        client: clientDeck,
        feature: featureDeck,
        credit: creditDeck,
      } = decks;

      clientCard.moveToTarget(clientDeck, { markDelete: true });
      featureCard.moveToTarget(featureDeck, { markDelete: true });
      creditCard.moveToTarget(creditDeck, { markDelete: true });

      for (const player of players) {
        player.decks.car.moveAllItems({ target: carDeck, markDelete: true });
        player.decks.service.moveAllItems({ target: serviceDeck, markDelete: true });
      }

      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
