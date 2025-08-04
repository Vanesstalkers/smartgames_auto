(function () {
  const {
    rounds,
    round: roundNumber,
    decks,
    settings: {
      timer,
      winMoneySum,
      playerHand: {
        car: { limit: carLimitInHand },
      },
    },
  } = this;
  const round = rounds[roundNumber];
  const players = this.players();
  const result = { newRoundLogEvents: [], newRoundNumber: roundNumber };

  const calcOfferForPlayer = (player) => {
    const { featureCard } = round;
    const [carCard] = player.decks.car_played.select('Card');
    const serviceCards = player.decks.service_played.select('Card');

    return this.calcOffer({ player, carCard, serviceCards, featureCard });
  };

  // !!! попробовать переписать более универсально для всех трех auto-игр
  const selectBestOffer = () => {
    const { clientCard, clientMoney } = round;
    const offers = [];
    let offersCount = 0;

    const { stars, priceGroup } = clientCard;

    for (const player of players) {
      let offer;
      try {
        offer = calcOfferForPlayer(player);
        offersCount++;
      } catch (err) {
        if (err === 'no_car') continue;
        else throw err;
      }

      if (
        offer.fullPrice < clientMoney &&
        offer.stars >= stars &&
        (priceGroup === '*' || offer.priceGroup.find((group) => priceGroup.includes(group)))
      ) {
        offers.push(offer);
      }
    }

    const bestOffer = { price: clientMoney, stars: 0 };
    for (const { player, ...offer } of offers) {
      if (bestOffer.stars < offer.stars || (bestOffer.stars == offer.stars && bestOffer.price > offer.fullPrice)) {
        bestOffer.carTitle = offer.carTitle;
        bestOffer.price = offer.fullPrice;
        bestOffer.player = player;
        bestOffer.stars = offer.stars;
      }
    }
    return { bestOffer, offersCount };
  };

  const addNewRoundCardsToPlayers = () => {
    const dropCardsPlayers = [];
    for (const player of players) {
      // добавляем новые карты в руку
      const carCard = decks.car.getRandomItem();
      if (carCard) carCard.moveToTarget(player.decks.car);
      const serviceCard = decks.service.getRandomItem();
      if (serviceCard) serviceCard.moveToTarget(player.decks.service);

      const tooManyCardsInHand = player.decks.car.itemsCount() > carLimitInHand;
      if (tooManyCardsInHand) dropCardsPlayers.push(player);
    }
    return { dropCardsPlayers };
  };

  const prepareSecondOfferStep = () => {
    const { roundStepWinner: player } = round;

    player.notifyUser(
      'Добавь в сделку нужное количество сервисов. При превышении бюджета клиента сделка будет отменена.'
    );
    player.activate({ setData: { eventData: { controlBtn: { label: 'Завершить сделку' } } } });

    result.newRoundLogEvents.push(`Начались продажи дополнительных сервисов клиенту.`);
    result.statusLabel = this.stepLabel('Дополнительные продажи');
    result.roundStep = 'SECOND_OFFER';

    if (player.ai) return { ...result, forcedEndRound: true };
    return { ...result, timerRestart: timer.SECOND_OFFER };
  };

  switch (this.roundStep) {
    case 'ROUND_START': {
      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
      const round = this.prepareRoundObject();
      const { client: clientDeck, feature: featureDeck, credit: creditDeck } = decks;
      const { zone_client: clientZone, zone_feature: featureZone, zone_credit: creditZone } = decks;

      round.clientCard = clientDeck.getRandomItem();
      round.clientCard.moveToTarget(clientZone);
      round.featureCard = featureDeck.getRandomItem();
      round.featureCard.moveToTarget(featureZone);
      round.creditCard = this.run('smartMoveRandomCard', { deck: creditDeck, target: creditZone });
      if (round.clientCardNew) delete round.clientCardNew;

      round.clientMoney = this.calcClientMoney();

      this.activatePlayers({
        notifyUser: 'Сделай свое предложение клиенту (одно авто и сколько угодно сервисов)',
        setData: {
          eventData: { playDisabled: null, controlBtn: { label: 'Сделать предложение' } },
        },
      });

      result.statusLabel = `Раунд ${result.newRoundNumber} (Первое предложение)`;
      result.roundStep = round.featureCard.replaceClient ? 'REPLACE_CLIENT' : 'FIRST_OFFER';

      for (const player of this.players({ ai: true })) {
        const card =
          this.difficulty === 'weak'
            ? player.decks.car.getRandomItem()
            : (() => {
                const { stars, priceGroup } = round.clientCard;
                const cars = player.decks.car
                  .items()
                  .filter((car) => {
                    return (
                      stars >= car.stars &&
                      (priceGroup === '*' || car.priceGroup.find((group) => priceGroup.includes(group)))
                    );
                  })
                  .sort((a, b) => b.price - a.price);
                return cars[0];
              })();
        if (card) player.aiActions.push({ action: 'playCard', data: { cardId: card.id() } });
      }

      return result;
    }

    case 'REPLACE_CLIENT': {
      result.newRoundLogEvents.push(`Произошла замена клиента.`);

      round.clientCardNew = decks.client.getRandomItem();
      round.clientCardNew.set({
        visible: true,
        eventData: { replacedClient: round.clientCard.id(), playDisabled: true },
      });

      if (!round.clientCardNew) {
        result.newRoundLogEvents.push(`В колоде закончились карты клиентов.`);
        return this.checkWinnerAndFinishGame();
      }

      round.clientMoney = this.calcClientMoney();
      round.clientCardNew.moveToTarget(decks.zone_client_dop);

      result.roundStep = 'FIRST_OFFER';
      return { ...result, forcedEndRound: true };
    }

    case 'FIRST_OFFER': {
      this.showTableCards();

      const {
        bestOffer: { player, carTitle },
        offersCount,
      } = selectBestOffer();

      if (!player) {
        if (offersCount > 0) {
          result.newRoundLogEvents.push(`Клиента не устроило ни одно из предложений.`);
          result.statusLabel = this.stepLabel('Результаты раунда');
          result.roundStep = 'SHOW_RESULTS';
        } else {
          result.roundStep = 'CARD_DROP';
        }
        return { ...result, forcedEndRound: true };
      }

      round.roundStepWinner = player;
      result.newRoundLogEvents.push(`Клиента заинтересовал автомобиль "${carTitle}".`);

      // у всех карт, выложенных на стол, убираем возможность возврата карты в руку делать через блокировку deck нельзя, потому что позже в нее будут добавляться дополнительные карты
      for (const deck of player.select({ className: 'Deck', attr: { placement: 'table' } })) {
        for (const card of deck.select('Card')) {
          card.set({ eventData: { playDisabled: true } });
        }
      }

      round.featureCard.play({ player });

      if (player.findEvent({ present: true })) {
        result.statusLabel = this.stepLabel('Подарок клиенту');
        result.roundStep = 'PRESENT';
        result.newRoundLogEvents.push(`Происходит выбор подарка клиенту.`);
        player.activate();

        if (player.ai) return { ...result, forcedEndRound: true };
        return { ...result, timerRestart: timer.PRESENT };
      }

      return prepareSecondOfferStep();
    }

    case 'PRESENT': {
      const { roundStepWinner: player } = round;

      player.decks.service.set({
        eventData: { playDisabled: null }, // мог быть выставлен playDisabled после present-event
      });

      result.newRoundLogEvents.push(`Начались продажи дополнительных сервисов клиенту.`);
      result.statusLabel = this.stepLabel('Дополнительные продажи');
      result.roundStep = 'SECOND_OFFER';
      return prepareSecondOfferStep();
    }

    case 'SECOND_OFFER': {
      const { roundStepWinner: player } = round;

      // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
      const { fullPrice, carTitle } = calcOfferForPlayer(player);
      if (fullPrice <= round.clientMoney) {
        result.newRoundLogEvents.push(
          `Клиент приобрел автомобиль "${carTitle}" и сервисы за ${new Intl.NumberFormat().format(
            (fullPrice || 0) * 1000
          )}₽.`
        );

        const money = player.money + fullPrice;
        player.set({ money });

        if (money >= winMoneySum) return this.run('endGame', { winningPlayer: player });
      } else {
        result.newRoundLogEvents.push(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
        delete round.roundStepWinner;
      }

      result.statusLabel = this.stepLabel('Результаты раунда');
      result.roundStep = 'SHOW_RESULTS';
      return { ...result, forcedEndRound: true };
    }

    case 'SHOW_RESULTS': {
      this.activatePlayers({
        setData: { eventData: { playDisabled: true, controlBtn: { label: 'Завершить раунд' } } },
        disableSkipTurnCheck: true,
      });
      result.roundStep = 'CARD_DROP';
      return { ...result, timerRestart: timer.SHOW_RESULTS };
    }

    case 'CARD_DROP': {
      const { roundStepWinner, featureCard } = round;
      const emptyClientDeck = decks.client.itemsCount() === 0;
      const emptyFeatureDeck = decks.feature.itemsCount() === 0;
      if (emptyClientDeck || emptyFeatureDeck) {
        result.newRoundLogEvents.push(`В колоде закончились карты ${emptyClientDeck ? 'клиентов' : 'сервисов'}.`);
        return this.checkWinnerAndFinishGame();
      }

      this.restorePlayersHands();

      if (roundStepWinner) {
        roundStepWinner.decks.car.set({
          eventData: { playDisabled: null }, // мог быть выставлен playDisabled после present-event
        });
      }

      result.statusLabel = this.stepLabel('Окончание раунда');
      result.roundStep = 'ROUND_END';

      if (featureCard.reference && roundStepWinner) {
        // дополнительный клиент (играем без добавления карт в руку)

        for (const player of players) {
          if (player === roundStepWinner) continue;
          player.set({ eventData: { skipTurn: true } });
        }
      } else {
        // чтобы не было лишней логики в первом раунде, карты в руку добавляем в конце раунда

        const { dropCardsPlayers } = addNewRoundCardsToPlayers();
        if (dropCardsPlayers.length) {
          for (const player of dropCardsPlayers) {
            player.initEvent('dropCard', { player });
            if (player.ai) continue;
            
            player.activate({
              notifyUser: `Выбери карты, которые хочешь сбросить. В руке должно остаться не больше ${carLimitInHand} карт авто.`,
              setData: { eventData: { playDisabled: null, controlBtn: { label: 'Сбросить' } } },
            });
          }

          return { ...result, timerRestart: timer.CARD_DROP };
        }
      }

      return { ...result, forcedEndRound: true };
    }

    case 'ROUND_END': {
      this.removeTableCards();
      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
