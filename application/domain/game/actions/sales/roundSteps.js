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
      round.creditCard = creditDeck.getRandomItem();
      round.creditCard.moveToTarget(creditZone);
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
        const cards = [];
        switch (this.difficulty) {
          case 'weak':
            const card = player.decks.car.getRandomItem();
            if (card) cards.push(card);
            break;
          case 'strong':
            const offers = Object.values(player.getAvailableOffers({ clientCard: round.clientCard }));
            const offer = offers[Math.floor(Math.random() * offers.length)];
            if (offer) {
              cards.push(offer.carCard);
              cards.push(...offer.serviceCards);
            }
            break;
        }
        player.aiActions.push(...cards.map((c) => ({ action: 'playCard', data: { cardId: c.id() } })));
      }

      const notAIPlayers = this.getActivePlayers().filter((p) => !p.ai);
      if (notAIPlayers.length === 0) result.forcedEndRound = true;

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

      const offersMap = {};
      for (const player of players) {
        const carCard = player.decks.played.items().find((c) => c.subtype === 'car');
        if (!carCard) continue;

        offersMap[carCard.id()] = {
          player,
          carCard,
          serviceCards: player.decks.played.items().filter((c) => c.subtype === 'service'),
        };
      }

      const { bestOffer, relevantOffers } = this.selectBestOffer(offersMap);
      const { player, carCard } = bestOffer;

      if (!player) {
        if (relevantOffers.length > 0) {
          result.newRoundLogEvents.push(`Клиента не устроило ни одно из предложений.`);
          result.statusLabel = this.stepLabel('Результаты раунда');
          result.roundStep = 'SHOW_RESULTS';
        } else {
          result.roundStep = 'CARD_DROP';
        }
        return { ...result, forcedEndRound: true };
      }

      round.roundStepWinner = player;
      result.newRoundLogEvents.push(`Клиента заинтересовал автомобиль "${carCard.title}".`);

      // у всех карт, выложенных на стол, убираем возможность возврата карты в руку делать через блокировку deck нельзя, потому что позже в нее будут добавляться дополнительные карты
      for (const deck of player.select({ className: 'Deck', attr: { placement: 'table' } })) {
        for (const card of deck.items()) {
          card.set({ eventData: { playDisabled: true } });
        }
      }

      round.featureCard.play({ player });

      if (player.findEvent({ present: true })) {
        result.statusLabel = this.stepLabel('Подарок клиенту');
        result.roundStep = 'PRESENT';
        result.newRoundLogEvents.push(`Происходит выбор подарка клиенту.`);
        player.activate();

        if (player.ai) {
          player.decks.service.set({ eventData: { playDisabled: null } });
          return { ...result, forcedEndRound: true };
        }
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
      const { featureCard, roundStepWinner: player } = round;

      const { fullPrice, carTitle } = this.calcOffer({
        player,
        carCard: player.decks.played.items().find((c) => c.subtype === 'car'),
        serviceCards: player.decks.played.items().filter((c) => c.subtype === 'service'),
        featureCard,
      });

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
          let onlyAIPlayers = true;

          for (const player of dropCardsPlayers) {
            player.initEvent('dropCard', { player });

            if (player.ai) continue;
            onlyAIPlayers = false;

            player.activate({
              notifyUser: `Выбери карты, которые хочешь сбросить. В руке должно остаться не больше ${carLimitInHand} карт авто.`,
              setData: { eventData: { playDisabled: null, controlBtn: { label: 'Сбросить' } } },
            });
          }

          result.forcedEndRound = onlyAIPlayers ? true : false;
          result.timerRestart = onlyAIPlayers ? null : timer.CARD_DROP;
          return result;
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
