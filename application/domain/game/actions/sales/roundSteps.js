(function () {
  const {
    // eventData, // нельзя тут объявлять, потому что он динамически обновится в toggleEventHandlers
    settings: {
      // конфиги
      timer,
      winMoneySum,
      playerHand: {
        car: { limit: carLimitInHand },
      },
    },
  } = this;
  const players = this.players();
  const result = { newRoundLogEvents: [], newRoundNumber: this.round };

  const calcOfferForPlayer = (player) => {
    const { featureCard } = this.rounds[this.round];
    const carCard = player.decks.car_played.select('Card')[0];
    const serviceCards = player.decks.service_played.select('Card');

    return this.calcOffer({ player, carCard, serviceCards, featureCard });
  };

  // !!! попробовать переписать более универсально для всех трех auto-игр
  const selectBestOffer = () => {
    const { clientCard, clientCardNew, clientMoney } = this.rounds[this.round];
    const offers = [];
    let offersCount = 0;

    const { stars, priceGroup } = clientCardNew || clientCard;

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
      const carCard = this.decks.car.getRandomItem();
      if (carCard) carCard.moveToTarget(player.decks.car);
      const serviceCard = this.decks.service.getRandomItem();
      if (serviceCard) serviceCard.moveToTarget(player.decks.service);

      const tooManyCardsInHand = player.decks.car.itemsCount() > carLimitInHand;
      if (tooManyCardsInHand) dropCardsPlayers.push(player);
    }
    return { dropCardsPlayers };
  };

  const prepareSecondOfferStep = () => {
    const { roundStepWinner: player } = this.rounds[this.round];

    player.notifyUser('Добавьте в сделку нужное вам количество сервисов (не превышающее в сумме стоимость авто)');
    player.activate({ setData: { eventData: { controlBtn: { label: 'Завершить сделку' } } } });

    result.newRoundLogEvents.push(`Начались продажи дополнительных сервисов клиенту.`);
    result.statusLabel = this.stepLabel('Дополнительные продажи');
    result.roundStep = 'SECOND_OFFER';
    return { ...result, timerRestart: timer.SECOND_OFFER, endRound: false };
  };

  switch (this.roundStep) {
    case 'ROUND_START': {
      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
      const round = this.prepareRoundObject();
      const { client: clientDeck, feature: featureDeck, credit: creditDeck } = this.decks;
      const { zone_client: clientZone, zone_feature: featureZone, zone_credit: creditZone } = this.decks;

      round.clientCard = clientDeck.getRandomItem();
      round.clientCard.moveToTarget(clientZone);
      round.featureCard = featureDeck.getRandomItem();
      round.featureCard.moveToTarget(featureZone);
      round.creditCard = this.run('smartMoveRandomCard', { deck: creditDeck, target: creditZone });
      if (round.clientCardNew) delete round.clientCardNew;

      round.clientMoney = this.calcClientMoney();

      this.activatePlayers({
        notifyUser: 'Сделайте ваше предложение клиенту (одно авто и сколько угодно сервисов)',
        setData: {
          eventData: { playDisabled: null, controlBtn: { label: 'Сделать предложение' } },
        },
      });

      result.statusLabel = `Раунд ${result.newRoundNumber} (Первое предложение)`;
      result.roundStep = round.featureCard.replaceClient ? 'REPLACE_CLIENT' : 'FIRST_OFFER';
      return { ...result, timerRestart: true, endRound: false };
    }

    case 'REPLACE_CLIENT': {
      result.newRoundLogEvents.push(`Произошла замена клиента.`);

      const round = this.rounds[this.round];

      round.clientCardNew = this.decks.client.getRandomItem();
      round.clientCardNew.set({
        visible: true,
        eventData: { replacedClient: round.clientCard.id(), playDisabled: true },
      });

      if (!round.clientCardNew) {
        result.newRoundLogEvents.push(`В колоде закончились карты клиентов.`);
        return this.checkWinnerAndFinishGame();
      }

      round.clientCardNew.moveToTarget(this.decks.zone_client_dop);
      for (const player of players) {
        player.returnTableCardsToHand();
      }
      this.showTableCards();

      this.activatePlayers({ notifyUser: 'Клиент поменялся, вы можете сделать новое предложение.' });

      result.statusLabel = this.stepLabel('Первое предложение');
      result.roundStep = 'FIRST_OFFER';
      return { ...result, timerRestart: true, endRound: false };
    }

    case 'FIRST_OFFER': {
      this.showTableCards();

      const round = this.rounds[this.round];
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
        return { ...result, timerRestart: false, endRound: true };
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

      if (player.findEvent({ name: 'present' })) {
        result.statusLabel = this.stepLabel('Подарок клиенту');
        result.roundStep = 'PRESENT';
        result.newRoundLogEvents.push(`Происходит выбор подарка клиенту.`);
        player.activate();
        return { ...result, timerRestart: timer.PRESENT, endRound: false };
      }

      return prepareSecondOfferStep();
    }

    case 'PRESENT': {
      const { roundStepWinner: player } = this.rounds[this.round];

      player.decks.service.set({
        eventData: { playDisabled: null }, // мог быть выставлен playDisabled после present-event
      });

      result.newRoundLogEvents.push(`Начались продажи дополнительных сервисов клиенту.`);
      result.statusLabel = this.stepLabel('Дополнительные продажи');
      result.roundStep = 'SECOND_OFFER';
      return prepareSecondOfferStep();
    }

    case 'SECOND_OFFER': {
      const round = this.rounds[this.round];
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
      return { ...result, timerRestart: false, endRound: true };
    }

    case 'SHOW_RESULTS': {
      this.activatePlayers({
        setData: { eventData: { playDisabled: true, controlBtn: { label: 'Завершить раунд' } } },
        disableSkipTurnCheck: true,
      });
      result.roundStep = 'CARD_DROP';
      return { ...result, timerRestart: timer.SHOW_RESULTS, endRound: false };
    }

    case 'CARD_DROP': {
      const { roundStepWinner, featureCard } = this.rounds[this.round];
      const emptyClientDeck = this.decks.client.itemsCount() === 0;
      const emptyFeatureDeck = this.decks.feature.itemsCount() === 0;
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
            player.activate({
              notifyUser: `Выберите карты, которые хотите сбросить. В руке должно остаться не больше ${carLimitInHand} карт авто.`,
              setData: { eventData: { playDisabled: null, controlBtn: { label: 'Сбросить' } } },
            });
          }

          return { ...result, timerRestart: timer.CARD_DROP, endRound: false };
        }
      }

      return { ...result, timerRestart: false, endRound: true };
    }

    case 'ROUND_END': {
      this.removeTableCards();
      const round = this.rounds[this.round];
      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, timerRestart: false, endRound: true };
    }
  }
});
