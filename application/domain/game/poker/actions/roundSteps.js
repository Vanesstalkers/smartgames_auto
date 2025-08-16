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

      round.step = 'preflop';

      const handCardsCount = 1;

      const requiredCardsCount = handCardsCount * players.length;
      if (decks.car.itemsCount() < requiredCardsCount) decks.car_drop.moveAllItems({ toDeck: true });
      if (decks.service.itemsCount() < requiredCardsCount) decks.service_drop.moveAllItems({ toDeck: true });

      if (decks.client.itemsCount() === 0) decks.client_drop.moveAllItems({ toDeck: true });
      if (decks.feature.itemsCount() === 0) decks.feature_drop.moveAllItems({ toDeck: true });
      if (decks.credit.itemsCount() === 0) decks.credit_drop.moveAllItems({ toDeck: true });

      for (const player of players) {
        // !!!! count считаем от количества игроков (но не больше 4)
        const moveConfig = {
          count: handCardsCount,
          target: player.decks.hand,
          setData: { eventData: { playDisabled: true } },
        };
        decks.car.moveRandomItems(moveConfig);
        decks.service.moveRandomItems(moveConfig);
      }

      round.clientCard = decks.client.getRandomItem();
      round.clientCard.moveToTarget(decks.zone_flop, { setVisible: true });

      round.featureCard = decks.feature.getRandomItem();
      round.featureCard.moveToTarget(decks.zone_turn, { setVisible: true });

      round.creditCard = decks.credit.getRandomItem();
      round.creditCard.moveToTarget(decks.zone_river, { setVisible: true });

      round.clientMoney = this.calcClientMoney();

      if (!round.currentPlayer) round.currentPlayer = players[0];
      round.currentPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        // setData: { eventData: { controlBtn: { triggerEvent: true } } },
        setData: { eventData: { controlBtn: { label: 'DEBUG', triggerEvent: null } } },
      });
      // round.currentPlayer.initEvent(domain.game.poker.events.makeBet());

      result.statusLabel = `Раунд ${result.newRoundNumber} (Префлоп)`;
      result.roundStep = 'BET';
      result.roundStep = 'PREBET';
      return result;
    }
    case 'PREBET': {
      round.currentPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { label: null, triggerEvent: true } } },
      });
      round.currentPlayer.initEvent(domain.game.poker.events.makeBet());
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

            const offersMap = {};
            function addOffer(player, car, serviceCards) {
              const offerKey = car.id() + ('+' + serviceCards.length ? serviceCards.map((c) => c.name).join('+') : '');
              offersMap[offerKey] = { player, carCard: car, serviceCards };
            }

            const { clientCard, featureCard, creditCard } = round;
            for (const player of players) {
              const handCards = player.decks.hand.items();
              const starCards = new Map();
              const priceGroupCards = new Map();

              for (const service of handCards.filter((c) => c.subtype === 'service')) {
                if (service.stars > 0) starCards.set(service.name, service);

                if (clientCard.priceGroup === '*') continue;

                if (service.priceGroup?.some((group) => clientCard.priceGroup.includes(group)))
                  priceGroupCards.set(service.name, service);
              }

              for (const car of handCards.filter((c) => c.subtype === 'car')) {
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

                if (starCards.size > 0) {
                  const cards = [...starCards.values()];
                  if (car.stars + cards.length < clientCard.stars) continue;

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

                  for (let i = needStars + 1; i <= matchingStarCards.length; i++) {
                    addOffer(player, car, serviceCards.concat(matchingStarCards.slice(0, i)));
                  }

                  serviceCards.push(...matchingStarCards.slice(0, needStars));
                }

                addOffer(player, car, serviceCards);
              }
            }

            const { bestOffer, offersCount } = this.selectBestOffer(offersMap);
            const { player: winner, carCard, serviceCards, price } = bestOffer;

            if (winner) {
              carCard.moveToTarget(winner.decks.show_hand);
              winner.decks.show_hand.setItemVisible(carCard);
              for (const card of serviceCards) {
                card.moveToTarget(winner.decks.show_hand);
                winner.decks.show_hand.setItemVisible(card);
              }
            }

            round.currentPlayer.activate({
              setData: { eventData: { controlBtn: { label: 'DEBUG', triggerEvent: null } } },
            });

            // !!!! если offer-ов нет, то делим банк
            result.roundStep = 'ROUND_END';
            // return { ...result, forcedEndRound: true };
            return result;

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

      clientCard.moveToDrop();
      featureCard.moveToDrop();
      creditCard.moveToDrop();

      for (const player of players) {
        player.decks.hand.moveAllItems({ toDrop: true });
        player.decks.show_hand.moveAllItems({ toDrop: true });
      }

      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
