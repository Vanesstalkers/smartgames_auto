(function () {
  const {
    round,
    // eventData, // нельзя тут объявлять, потому что он динамически обновится в toggleEventHandlers
    settings: {
      // конфиги
      timer,
      winMoneySum,
      auctionsPerRound,
    },
  } = this;
  const players = this.players();

  const getRandomClient = () => {
    const client = this.decks.client.getRandomItem();
    if (!client) {
      const winningPlayer = players.sort((a, b) => {
        return a.money > b.money ? -1 : 1;
      })[0];
      this.run('endGame', { winningPlayer });
    }
    return client;
  };

  /**
   * Активируем колоды сервисов и блокируем колоды авто у всех игроков
   */
  const settingPlayerDecksAvailabilityForAuction = () => {
    for (const player of players) {
      player.decks.car.set({ eventData: { playDisabled: true } });
      player.decks.service.set({ eventData: { playDisabled: null } });
    }
  };
  const initAuctionBetStep = (player) => {
    const round = this.rounds[this.round];
    round.currentPlayer = player;
    this.set({
      statusLabel: this.stepLabel('Ставки на аукционе'),
      roundStep: 'AUCTION_BET',
    });

    if (player.eventData.skipTurn) {
      this.logs({ msg: `Игрок {{player}} пропускает ход.`, userId: player.userId });
      player.set({ eventData: { skipTurn: null } });

      // в AUCTION_BET сработает проверка playerNullBet с вызовом initAuctionBetStep({ player: nextPlayer })
      this.run('endRound');
      return;
    }

    player.activate({
      publishText: 'Делайте вашу ставку',
      setData: { eventData: { controlBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  };
  const processAuctionResultsForWinner = (winner) => {
    const round = this.rounds[this.round];
    round.carCard.moveToTarget(winner.decks.car);

    winner.decks.service_played.moveAllItems({
      target: this.decks.drop_service,
      emitEvent: 'RESET',
      setData: { visible: false },
    });
  };
  const initSelectClientEvent = (player) => {
    const { replacedClientDeal } = this.rounds[this.round];
    const dealDecks = replacedClientDeal
      ? [replacedClientDeal]
      : this.select({ className: 'Deck', attr: { subtype: 'deal' } });
    for (const deck of dealDecks) {
      if (
        deck.eventData.referencePlayerCode && // эксклюзивный клиент
        deck.eventData.referencePlayerCode !== player.code
      )
        continue;
      deck.initEvent('selectClientToDeal', { player });
    }
  };
  const initDealOffersStep = (player) => {
    const round = this.rounds[this.round];
    round.currentPlayer = player;
    this.set({
      statusLabel: this.stepLabel('Предложение клиенту'),
      roundStep: 'OFFER_READY',
    });

    if (player.decks.car.itemsCount() === 0) {
      this.logs(`У игрока ${player.userName} нет карт авто и он пропускает ход.`);

      // в OFFER_READY сработает проверка emptyOffer с вызовом round.completedOffers.push(currentPlayer);
      this.run('endRound');
      return;
    }

    initSelectClientEvent(player);

    player.decks.car.set({ eventData: { playDisabled: null } });
    player.decks.service.set({ eventData: { playDisabled: null } });

    if (round.selectedDealDeck) delete round.selectedDealDeck;

    player.activate({
      publishText:
        'Выберите клиента и сделайте ему предложение о покупке авто (рекомендуется добавлять только сервисы, меняющие характеристики авто, так как увеличить цену сделки можно будет на шаге дополнительных продаж).',
      setData: { eventData: { controlBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  };

  /**
   * Функция разбирает карты сделки (и клиент с особенностями, и предложения игроков), которые лежат в одной deck.
   * @param {Object} deck
   * @returns { {offers: Object, offersCount: number} } deal data
   */
  const processDealData = (deck) => {
    const round = this.rounds[this.round];

    const offers = {};
    let offersCount = 0;
    for (const card of deck.select('Card')) {
      if (card.group === 'client') {
        if (card.eventData.replacedClient) round.clientCardNew = card;
        else round.clientCard = card;
      } else if (card.group === 'feature') round.featureCard = card;
      else if (card.group === 'credit') round.creditCard = card;
      else if (card.owner) {
        const key = card.owner.code + card.owner.order;
        if (!offers[key]) {
          offers[key] = {
            player: this.find(card.owner.code),
            order: card.owner.order,
            serviceCards: [],
          };
          offersCount++;
        }
        if (card.group === 'car') {
          offers[key].carCard = card;
        } else {
          offers[key].serviceCards.push(card);
        }
      }
    }
    return { offers, offersCount };
  };

  const calcAuction = (player) => {
    const priceMods = [];
    const serviceDeck = player.select({ className: 'Deck', attr: { subtype: 'service_played' } })[0];

    for (const card of serviceDeck.select('Card')) {
      priceMods.push(card.price);
    }

    const { carCard } = this.rounds[this.round];
    const fullPrice = priceMods.reduce((price, mod) => {
      if (mod.at(-1) === '%') return price + carCard.price * (parseInt(mod) / 100);
      return price + parseInt(mod);
    }, 0);
    return fullPrice;
  };
  // !!! попробовать переписать более универсально для всех трех auto-игр
  const selectBestOffer = (offersMap) => {
    const round = this.rounds[this.round];
    const { clientCard, clientCardNew, clientMoney, featureCard } = round;
    const offers = [];

    const { stars, priceGroup } = clientCardNew || clientCard;

    for (const { player, carCard, serviceCards } of Object.values(offersMap)) {
      let offer;
      try {
        offer = this.calcOffer({ player, carCard, serviceCards, featureCard });
        offer.carCard = carCard;
        offer.serviceCards = serviceCards;
      } catch (err) {
        if (err === 'no_car') continue;
        else throw err;
      }

      if (
        offer.fullPrice <= clientMoney &&
        offer.stars >= stars &&
        (priceGroup === '*' || offer.priceGroup.find((group) => priceGroup.includes(group)))
      ) {
        offers.push(offer);
      }
    }

    const bestOffer = { price: clientMoney, stars: 0 };
    for (const { player, ...offer } of offers) {
      if (bestOffer.stars < offer.stars || (bestOffer.stars == offer.stars && bestOffer.price > offer.fullPrice)) {
        bestOffer.carCard = offer.carCard;
        bestOffer.serviceCards = offer.serviceCards;
        bestOffer.price = offer.fullPrice;
        bestOffer.player = player;
        bestOffer.stars = offer.stars;
      }
    }
    return bestOffer;
  };
  const setDeckCardsVisible = (deck, { setData }) => {
    for (const card of deck.select('Card')) {
      card.set(setData);
      deck.setItemVisible(card);
    }
  };
  const returnCardsToOwners = (deck) => {
    const cards = deck.select('Card');
    for (const card of cards) {
      if (!card.owner) continue;
      const player = this.find(card.owner.code);
      card.set({ eventData: { playDisabled: null } });
      card.moveToTarget(player.decks[card.group]); // card.group == (car || service)
    }
  };
  const clearCurrentDeal = () => {
    const { selectedDealDeck } = this.rounds[this.round];

    if (selectedDealDeck) {
      // делаем здесь, чтобы показать результаты предыдущей проверенной сделки
      selectedDealDeck.set({ eventData: { currentDeal: null, referencePlayerCode: null } });
      returnCardsToOwners(selectedDealDeck);
    }
  };
  const getPlayersOrderedByDealStars = ({ maxStars }) => {
    const { dealStars: stars } = this.rounds[this.round];
    const maxStarsCode = Object.entries(stars).find(([code, stars]) => stars === maxStars)?.[0];

    return Object.keys(stars)
      .sort((a, b) => (a === maxStarsCode ? -1 : 1))
      .map((code) => ({ code, player: this.find(code) }));
  };
  const restoreCardsForDeals = ({ orderedPlayers, maxStars }) => {
    const { dealStars: stars } = this.rounds[this.round];
    const serviceCards = this.decks.drop_service.select('Card');

    for (let i = 0; i < maxStars; i++) {
      for (const { code, player } of orderedPlayers) {
        if ((stars[code] || 0) == 0) continue;
        stars[code]--;
        const card = serviceCards.shift();
        if (!card) continue;
        card.set({ eventData: { playDisabled: null } });
        card.moveToTarget(player.decks.service);
      }
    }
  };

  switch (this.roundStep) {
    case 'ROUND_START':
      {
        // result.newRoundNumber++;
        // result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

        // this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
        // const round = this.prepareRoundObject();

        const newRoundNumber = round + 1;
        this.logs(`Начало раунда №${newRoundNumber}.`);

        if (!round.currentPlayer) round.currentPlayer = players[0];
        
        this.set({
          roundStep: 'AUCTION_START',
          round: newRoundNumber,
          auctionsLeftInRound: auctionsPerRound,
        });
        this.run('endRound');
      }
      break;
    case 'AUCTION_START':
      {
        const round = this.rounds[this.round];

        if (this.auctionsLeftInRound === 0) {
          this.logs(`Этап аукционов в этом раунде завершен. Начинается этап продаж.`);

          round.completedOffers = [];
          initDealOffersStep(round.currentPlayer);
          return;
        }

        round.clientCard = getRandomClient();
        round.clientCard.moveToTarget(this.decks.zone_auction_client);
        round.carCard = this.decks.car.getRandomItem();
        round.carCard.moveToTarget(this.decks.zone_auction_car);

        this.logs(`Клиент "${round.clientCard.title}" продает автомобиль "${round.carCard.title}".`);

        settingPlayerDecksAvailabilityForAuction();

        this.completedBets = [];
        this.set({ betSum: 0 });
        initAuctionBetStep(round.currentPlayer);
      }
      break;

    case 'AUCTION_BET':
      {
        const round = this.rounds[this.round];
        const { currentPlayer, carCard } = round;
        const nextPlayer = currentPlayer.nextPlayer();
        let winner, loser;

        const betSum = calcAuction(currentPlayer);

        if (betSum > this.betSum) {
          this.set({ betSum }); // нельзя переносить в initAuctionBetStep, иначе будет ложный вызов noAuctionBets

          const playedCards = currentPlayer.decks.service_played.select('Card');
          for (const card of playedCards) card.set({ eventData: { playDisabled: true } });

          // ! будет работать только для 2-х игроков
          if (!this.completedBets.includes(nextPlayer)) {
            // следующий игрок еще не закончил делать ставки - передаем ему ход
            initAuctionBetStep(nextPlayer);
            return;
          }

          this.logs(`Игрок ${currentPlayer.userName} побеждает в аукционе за автомобиль "${carCard.title}".`);

          winner = currentPlayer;
          loser = nextPlayer;
        } else {
          const formattedBet = new Intl.NumberFormat().format((betSum || 0) * 1000);
          const formattedSum = new Intl.NumberFormat().format((this.betSum || 0) * 1000);
          this.logs(
            `Игрок ${currentPlayer.userName} выбывает из торгов, так как его ставка (${formattedBet}₽) не смогла превысить предыдущее предложение (${formattedSum}₽).`
          );

          this.completedBets.push(currentPlayer);
          if (this.betSum === 0 && this.completedBets.length !== players.length) {
            // не все игроки закончили делать ставки - передаем ход
            initAuctionBetStep(nextPlayer);
            return;
          }

          winner = nextPlayer;
          loser = currentPlayer;
        }

        this.createClientDealDeck();

        const noAuctionBets = this.betSum === 0;
        if (noAuctionBets) {
          carCard.moveToTarget(this.decks.drop);
        } else {
          processAuctionResultsForWinner(winner);
          loser.returnTableCardsToHand();
        }

        round.currentPlayer = loser; // первым ставку делает проигравший в предыдущем раунде
        this.set({
          roundStep: 'AUCTION_START',
          auctionsLeftInRound: this.auctionsLeftInRound - 1,
        });
        this.run('endRound');
      }
      break;
    case 'OFFER_READY':
      {
        const round = this.rounds[this.round];
        const { currentPlayer, selectedDealDeck } = round;
        const {
          decks: { car: carDeck, service: serviceDeck, car_played: playedCarDeck, service_played: playedServiceDeck },
        } = currentPlayer;
        let emptyOffer = playedCarDeck.itemsCount() === 0;

        if (!selectedDealDeck) {
          if (!emptyOffer) {
            const moveConfig = {
              emitEvent: 'RESET',
              setData: { visible: false },
            };
            playedCarDeck.moveAllItems({ ...moveConfig, target: carDeck });
            playedServiceDeck.moveAllItems({ ...moveConfig, target: serviceDeck });
            emptyOffer = true;
          }
        } else {
          selectedDealDeck.set({ eventData: { currentDeal: null } });
        }

        if (emptyOffer) {
          this.logs(
            `Так как игрок ${currentPlayer.userName} не сделал ни одного предложения, то он заканчивает участие на данном этапе.`
          );

          playedServiceDeck.moveAllItems({
            target: serviceDeck,
            setData: { visible: false },
          });
          round.completedOffers.push(currentPlayer);
        } else {
          const moveConfig = {
            target: selectedDealDeck,
            emitEvent: 'RESET',
            setData: {
              visible: false,
              owner: { code: currentPlayer.code, order: Date.now() },
            },
          };
          playedCarDeck.moveAllItems(moveConfig);
          playedServiceDeck.moveAllItems(moveConfig);
        }

        if (round.completedOffers.length !== players.length) {
          // не все игроки сделали свои предложения - предаем ход
          let player = currentPlayer.nextPlayer();
          if (round.completedOffers.includes(player)) player = currentPlayer;
          initDealOffersStep(player);
          return;
        }

        this.logs(`Все игроки сделали свои предложения. Начинается определение победителей по сделкам.`);

        round.roundStepWinner = null;
        round.selectedDealDeck = null;
        round.replacedClientDeal = null;
        round.dealStars = {};
        round.checkedDeals = [];
        this.set({
          statusLabel: this.stepLabel('Оценка предложений'),
          roundStep: 'CHECK_DEAL',
        });
        this.run('endRound');
      }
      break;
    case 'CHECK_DEAL':
      {
        const round = this.rounds[this.round];
        const { checkedDeals, roundStepWinner, featureCard, selectedDealDeck, clientCard, completedOffers, dealStars: stars } = round;
        const dealDeck = this.select({ className: 'Deck', attr: { subtype: 'deal' } }).find((deck) => {
          return !checkedDeals.includes(deck);
        });

        if (!dealDeck) {
          // проверены все возможные сделки с клиентами
          clearCurrentDeal();

          const starsValues = Object.values(stars);
          const maxStars = starsValues.length > 0 ? Math.max(...starsValues) : 0;

          if (maxStars) {
            const orderedPlayers = getPlayersOrderedByDealStars({ maxStars });

            const gameWinner = orderedPlayers.find(({ player }) => {
              return player.money > winMoneySum;
            });
            if (gameWinner) {
              const { player: winningPlayer } = orderedPlayers.sort((a, b) => {
                return a.player.money > b.player.money ? -1 : 1;
              })[0];
              this.run('endGame', { winningPlayer });
            }

            for (const { code, player } of orderedPlayers) {
              this.logs(
                `За проведенные в этом раунде сделки игрок ${player.userName} получает карты сервисов (${stars[code]} шт).`
              );
            }
            restoreCardsForDeals({ orderedPlayers, maxStars });
          }

          if (roundStepWinner) round.currentPlayer = roundStepWinner.nextPlayer();
          this.set({ roundStep: 'ROUND_START' });
          this.run('endRound');
          return;
        }

        clearCurrentDeal();
        round.selectedDealDeck = dealDeck;

        checkedDeals.push(dealDeck);
        dealDeck.set({
          eventData: { currentDeal: true }, // для визуализации на фронте
        });

        delete round.clientCard; // *
        delete round.clientCardNew; // *
        delete round.featureCard; // *
        delete round.creditCard; // *
        // * новые значения установятся в processDealData
        const { offers, offersCount } = processDealData(dealDeck);

        if (offersCount > 0) {
          setDeckCardsVisible(dealDeck, {
            setData: { eventData: { playDisabled: true } },
          });

          if (featureCard.replaceClient && !featureCard.played) {
            featureCard.set({ played: true });

            selectedDealDeck.set({ eventData: { currentDeal: null } });
            round.replacedClientDeal = selectedDealDeck;

            const newClient = getRandomClient();
            newClient.set({
              visible: true,
              eventData: { replacedClient: clientCard.id() },
            });
            round.clientCardNew = newClient;
            dealDeck.addItem(newClient);
            dealDeck.clientCard = newClient; // используется только в selectClientToDeal для настроек визуализации

            this.logs(
              `Произошла замена клиента. Расчет сделки ведется исходя из бюджета "${clientCard.title}", но по требованиям "${newClient.title}".`
            );

            const offerValues = Object.values(offers);
            const offerPlayers = offerValues.map((offer) => offer.player);
            // в этом раунде разрешаем делать предложения новому клиенту только тем, кто сделал предложение основному клиенту
            round.completedOffers = completedOffers.filter((player) => {
              return !offerPlayers.includes(player);
            });

            // первым делает предложение новому клиенту делает тот, кто сделал первое предложение основному клиенту
            offerValues.sort((a, b) => (a.order < b.order ? -1 : 1));
            const dealPlayer = offerValues[0].player;

            returnCardsToOwners(dealDeck);

            initDealOffersStep(dealPlayer);
            return;
          }
        }

        this.calcClientMoney();
        const { player, carCard, serviceCards } = selectBestOffer(offers);

        if (!player) {
          dealDeck.set({ eventData: { playDisabled: null } });

          this.set({
            statusLabel: this.stepLabel('Оценка предложений'),
            roundStep: 'CHECK_DEAL',
          });
          if (offersCount > 0) {
            this.logs(`Клиента "${clientCard.title}" не заинтересовало ни одно предложение.`);
            for (const player of players) {
              player.decks.car.set({ eventData: { playDisabled: true } });
              player.decks.service.set({ eventData: { playDisabled: true } });
              player.activate({ setData: { eventData: { controlBtn: { label: 'Пропустить' } } } });
            }
            lib.timers.timerRestart(this, { time: timer.SHOW_RESULTS });
          } else {
            this.run('endRound');
          }
          return;
        }

        this.logs(`Клиента "${clientCard.title}" заинтересовал автомобиль "${carCard.title}".`);

        carCard.moveToTarget(player.decks.car_played);
        for (const service of serviceCards) {
          service.moveToTarget(player.decks.service_played);
        }

        featureCard.play({ player });

        if (featureCard.reference) {
          // !!! createClientDealDeck работает только с round.clientCard, но в этом месте проблем не возникает, потому что дальше по коду case-а он не используется
          round.clientCard = getRandomClient();
          const deck = this.createClientDealDeck();
          deck.set({ eventData: { referencePlayerCode: player.code } });

          this.logs(
            `Игрок ${player.userName} получает возможность эксклюзивной работы с клиентом "${clientCard.title}".`
          );

          // чтобы в этом раунде обработки сделки не проводилось
          checkedDeals.push(deck);
        }

        round.roundStepWinner = player;
        this.set({
          statusLabel: this.stepLabel('Подарок клиенту'),
          roundStep: 'PRESENT',
        });
        if (player.findEvent({ name: 'present' })) {
          this.logs(`Происходит выбор подарка клиенту.`);
          player.activate();
          lib.timers.timerRestart(this, { time: timer.PRESENT });
        } else {
          this.run('endRound');
        }
      }
      break;
    case 'PRESENT':
      {
        const round = this.rounds[this.round];
        const { roundStepWinner: player } = round;
        this.logs(`Начались продажи дополнительных сервисов клиенту.`);
        player.decks.service.set({ eventData: { playDisabled: null } });

        player.activate({
          publishText:
            'Вы можете сделать дополнительные продажи (не превышающее в сумме стоимость авто). При превышении бюджета клиента сделка будет отменена.',
          setData: { eventData: { controlBtn: { label: 'Завершить сделку' } } },
        });
        this.set({
          statusLabel: this.stepLabel('Дополнительные продажи'),
          roundStep: 'SECOND_OFFER',
        });
        lib.timers.timerRestart(this, { time: timer.SECOND_OFFER });
      }
      break;
    case 'SECOND_OFFER':
      {
        const { roundStepWinner: player, selectedDealDeck, featureCard, clientMoney, dealStars, clientCard } = this.rounds[this.round];
        const carCard = player.decks.car_played.select('Card')[0];
        const serviceCards = player.decks.service_played.select('Card');

        // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
        const { fullPrice, carTitle, stars } = this.calcOffer({ carCard, serviceCards, featureCard });

        returnCardsToOwners(selectedDealDeck);

        if (fullPrice <= clientMoney) {
          const formattedPrice = new Intl.NumberFormat().format((fullPrice || 0) * 1000);
          const services = serviceCards.map(({ title }) => `"${title}"`).join(', ');
          this.logs(
            `Клиент "${clientCard.title}" приобрел автомобиль "${carTitle}" и сервисы (${services}) за ${formattedPrice}₽.`
          );

          const money = player.money + fullPrice;
          player.set({ money });
          dealStars[player.code] = (dealStars[player.code] || 0) + stars;

          player.decks.car_played.moveAllItems({ target: this.decks.drop });
          player.decks.service_played.moveAllItems({ target: this.decks.drop });

          this.deleteDeck(selectedDealDeck);
        } else {
          this.logs(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
          player.decks.car_played.moveAllItems({ target: player.decks.car });
          player.decks.service_played.moveAllItems({ target: player.decks.service });
        }

        this.set({
          statusLabel: this.stepLabel('Оценка предложений'),
          roundStep: 'CHECK_DEAL',
        });
        this.run('endRound');
      }
      break;
  }
});
