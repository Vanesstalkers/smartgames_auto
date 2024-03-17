(function () {
  const {
    round,
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

  const calcOfferForPlayer = (player) => {
    const carCard = player.decks.car_played.select('Card')[0];
    const serviceCards = player.decks.service_played.select('Card');
    const { featureCard } = this;
    return this.calcOffer({ player, carCard, serviceCards, featureCard });
  };

  const selectBestOffer = () => {
    const { clientCard, clientCardNew, clientMoney } = this;
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

  switch (this.roundStep) {
    case 'ROUND_START':
      {
        const newRoundNumber = round + 1;
        this.logs(`Начало раунда №${newRoundNumber}.`);

        this.clientCard = this.decks.client.getRandomItem();
        this.clientCard.moveToTarget(this.decks.zone_client);
        this.featureCard = this.decks.feature.getRandomItem();
        this.featureCard.moveToTarget(this.decks.zone_feature);
        this.creditCard = this.decks.credit.smartMoveRandomCard({
          target: this.decks.zone_credit,
        });
        if (this.clientCardNew) delete this.clientCardNew;

        this.calcClientMoney();

        this.activatePlayers({
          setData: {
            staticHelper: { text: 'Сделайте ваше предложение клиенту (одно авто и сколько угодно сервисов).' },
            eventData: {
              playDisabled: null,
              roundBtn: { label: 'Сделать предложение' },
            },
          },
        });
        this.set({ round: newRoundNumber }); // иначе stepLabel в следующем set(...) не подхватит корректное значение
        this.set({
          statusLabel: this.stepLabel('Первое предложение'),
          roundStep: this.featureCard.replaceClient ? 'REPLACE_CLIENT' : 'FIRST_OFFER',
        });
        lib.timers.timerRestart(this);
      }
      break;
    case 'REPLACE_CLIENT':
      {
        this.logs(`Произошла замена клиента.`);

        this.clientCardNew = this.decks.client.getRandomItem();
        this.clientCardNew.set({
          visible: true,
          eventData: { replacedClient: this.clientCard.id(), playDisabled: true },
        });

        if (!this.clientCardNew) {
          this.logs(`В колоде закончились карты клиентов.`);
          return this.checkWinnerAndFinishGame();
        }

        this.clientCardNew.moveToTarget(this.decks.zone_client_dop);
        for (const player of players) {
          player.returnTableCardsToHand();
        }
        this.showTableCards();

        this.activatePlayers({ publishText: 'Клиент поменялся, вы можете сделать новое предложение.' });
        this.set({
          statusLabel: this.stepLabel('Первое предложение'),
          roundStep: 'FIRST_OFFER',
        });
        lib.timers.timerRestart(this);
      }
      break;
    case 'FIRST_OFFER':
      {
        this.showTableCards();

        const {
          bestOffer: { player, carTitle },
          offersCount,
        } = selectBestOffer();

        if (!player) {
          if (offersCount > 0) {
            this.logs(`Клиента не устроило ни одно из предложений.`);
            this.set({
              statusLabel: this.stepLabel('Результаты раунда'),
              roundStep: 'SHOW_RESULTS',
            });
          } else {
            this.set({ roundStep: 'CARD_DROP' });
          }
          this.run('endRound');
          return;
        }

        this.roundStepWinner = player;
        this.logs(`Клиента заинтересовал автомобиль "${carTitle}".`);

        // у всех карт, выложенных на стол, убираем возможность возврата карты в руку делать через блокировку deck нельзя, потому что позже в нее будут добавляться дополнительные карты
        for (const deck of player.getObjects({ className: 'Deck', attr: { placement: 'table' } })) {
          for (const card of deck.select('Card')) {
            card.set({ eventData: { playDisabled: true } });
          }
        }

        if (this.featureCard.canPlay()) this.featureCard.play({ player });

        this.set({
          statusLabel: this.stepLabel('Подарок клиенту'),
          roundStep: 'PRESENT',
        });

        if (player.findEvent({ present: true })) {
          this.logs(`Происходит выбор подарка клиенту.`);
          player.activate();
          lib.timers.timerRestart(this, { time: timer.PRESENT });
          return;
        }

        this.run('endRound');
      }
      break;
    case 'PRESENT':
      {
        this.roundStepWinner.activate({
          publishText: 'Добавьте в сделку нужное вам количество сервисов (не превышающее в сумме стоимость авто).',
          setData: { eventData: { roundBtn: { label: 'Завершить сделку' } } },
        });
        this.roundStepWinner.decks.service.set({
          eventData: { playDisabled: null }, // мог быть выставлен playDisabled после present-event
        });
        this.set({
          statusLabel: this.stepLabel('Дополнительные продажи'),
          roundStep: 'SECOND_OFFER',
        });
        this.logs(`Начались продажи дополнительных сервисов клиенту.`);
        lib.timers.timerRestart(this, { time: timer.SECOND_OFFER });
      }
      break;
    case 'SECOND_OFFER':
      {
        const player = this.roundStepWinner;

        // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
        const { fullPrice, carTitle } = calcOfferForPlayer(player);
        if (fullPrice <= this.clientMoney) {
          this.logs(
            `Клиент приобрел автомобиль "${carTitle}" и сервисы за ${new Intl.NumberFormat().format(
              (fullPrice || 0) * 1000
            )}₽.`
          );

          const money = player.money + fullPrice;
          player.set({ money });

          if (money >= winMoneySum) {
            return this.run('endGame', { winningPlayer: player });
          }
        } else {
          this.logs(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
          delete this.roundStepWinner;
        }

        this.set({
          statusLabel: this.stepLabel('Результаты раунда'),
          roundStep: 'SHOW_RESULTS',
        });
        this.run('endRound');
      }
      break;
    case 'SHOW_RESULTS':
      {
        this.activatePlayers({
          setData: { eventData: { playDisabled: true, roundBtn: { label: 'Завершить раунд' } } },
          disableSkipRoundCheck: true,
        });
        this.set({ roundStep: 'CARD_DROP' });
        lib.timers.timerRestart(this, { time: timer.SHOW_RESULTS });
      }
      break;
    case 'CARD_DROP':
      {
        const emptyClientDeck = this.decks.client.itemsCount() === 0;
        const emptyFeatureDeck = this.decks.feature.itemsCount() === 0;
        if (emptyClientDeck || emptyFeatureDeck) {
          this.logs(`В колоде закончились карты ${emptyClientDeck ? 'клиентов' : 'сервисов'}.`);
          return this.checkWinnerAndFinishGame();
        }

        this.restorePlayersHands();
        if (this.roundStepWinner) {
          this.roundStepWinner.decks.car.set({
            eventData: { playDisabled: null }, // мог быть выставлен playDisabled после present-event
          });
        }

        this.set({
          statusLabel: this.stepLabel('Окончание раунда'),
          roundStep: 'ROUND_END',
        });
        if (this.featureCard.reference && this.roundStepWinner) {
          // дополнительный клиент (играем без добавления карт в руку)

          for (const player of players) {
            if (player !== this.roundStepWinner) player.initEvent('skipRound');
          }
        } else {
          // чтобы не было лишней логики в первом раунде, карты в руку добавляем в конце раунда

          const { dropCardsPlayers } = addNewRoundCardsToPlayers();
          if (dropCardsPlayers.length) {
            for (const player of dropCardsPlayers) {
              player.initEvent('dropCard');
              player.activate({
                publishText: `Выберите карты, которые хотите сбросить. В руке должно остаться не больше ${carLimitInHand} карт авто.`,
                setData: { eventData: { playDisabled: null } },
              });
            }
            lib.timers.timerRestart(this, { time: timer.CARD_DROP });
            return;
          }
        }
        this.run('endRound');
      }
      break;
    case 'ROUND_END':
      {
        this.removeTableCards();
        this.set({ roundStep: 'ROUND_START', roundStepWinner: null });
        this.run('endRound');
      }
      break;
  }
});
