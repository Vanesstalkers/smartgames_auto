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
    this.currentPlayer = player;
    this.set({
      statusLabel: this.stepLabel('Ставки на аукционе'),
      roundStep: 'AUCTION_BET',
    });

    if (player.skipRoundCheck()) {
      // в AUCTION_BET сработает проверка playerNullBet с вызовом initAuctionBetStep({ player: nextPlayer })
      this.run('endRound');
      return;
    }

    player.activate({
      publishText: 'Делайте вашу ставку',
      setData: { eventData: { roundBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  };
  const processAuctionResultsForWinner = (winner) => {
    this.carCard.moveToTarget(winner.decks.car);

    winner.decks.service_played.moveAllItems({
      target: this.decks.drop_service,
      emitEvent: 'RESET',
      setData: { visible: false },
    });
  };
  const initSelectClientEvent = (player) => {
    const dealDecks = this.replacedClientDeal
      ? [this.replacedClientDeal]
      : this.getObjects({ className: 'Deck', attr: { subtype: 'deal' } });
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
    this.currentPlayer = player;
    this.set({
      statusLabel: this.stepLabel('Предложение клиенту'),
      roundStep: 'OFFER_READY',
    });

    if (player.decks.car.itemsCount() === 0) {
      this.logs(`У игрока ${player.userName} нет карт авто и он пропускает ход.`);

      // в OFFER_READY сработает проверка emptyOffer с вызовом this.completedOffers.push(currentPlayer);
      this.run('endRound');
      return;
    }

    initSelectClientEvent(player);

    player.decks.car.set({ eventData: { playDisabled: null } });
    player.decks.service.set({ eventData: { playDisabled: null } });

    if (this.selectedDealDeck) delete this.selectedDealDeck;

    player.activate({
      publishText:
        'Выберите клиента и сделайте ему предложение о покупке авто (рекомендуется добавлять только сервисы, меняющие характеристики авто, так как увеличить цену сделки можно будет на шаге дополнительных продаж).',
      setData: { eventData: { roundBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  };

  /**
   * Функция разбирает карты сделки (и клиент с особенностями, и предложения игроков), которые лежат в одной deck.
   * @param {Object} deck
   * @returns { {offers: Object, offersCount: number} } deal data
   */
  const processDealData = (deck) => {
    const offers = {};
    let offersCount = 0;
    for (const card of deck.select('Card')) {
      if (card.group === 'client') {
        if (card.eventData.replacedClient) this.clientCardNew = card;
        else this.clientCard = card;
      } else if (card.group === 'feature') this.featureCard = card;
      else if (card.group === 'credit') this.creditCard = card;
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
    const serviceDeck = player.getObjects({ className: 'Deck', attr: { subtype: 'service_played' } })[0];
    for (const card of serviceDeck.select('Card')) {
      priceMods.push(card.price);
    }
    const carPrice = this.carCard.price;
    const fullPrice = priceMods.reduce((price, mod) => {
      if (mod.at(-1) === '%') return price + carPrice * (parseInt(mod) / 100);
      return price + parseInt(mod);
    }, 0);
    return fullPrice;
  };
  const selectBestOffer = (offersMap) => {
    const { clientCard, clientCardNew, clientMoney, featureCard } = this;
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
    if (this.selectedDealDeck) {
      // делаем здесь, чтобы показать результаты предыдущей проверенной сделки
      this.selectedDealDeck.set({ eventData: { currentDeal: null, referencePlayerCode: null } });
      returnCardsToOwners(this.selectedDealDeck);
    }
  };
  const getPlayersOrderedByDealStars = ({ maxStars }) => {
    const stars = this.dealStars;
    const maxStarsCode = Object.entries(stars).find(([code, stars]) => stars === maxStars)?.[0];

    return Object.keys(stars)
      .sort((a, b) => (a === maxStarsCode ? -1 : 1))
      .map((code) => ({ code, player: this.find(code) }));
  };
  const restoreCardsForDeals = ({ orderedPlayers, maxStars }) => {
    const stars = this.dealStars;
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
        const newRoundNumber = round + 1;
        this.logs(`Начало раунда №${newRoundNumber}.`);

        if (!this.currentPlayer) this.currentPlayer = players[0];
        this.set({ round: newRoundNumber }); // иначе stepLabel в следующем set(...) не подхватит корректное значение
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
        if (this.auctionsLeftInRound === 0) {
          this.logs(`Этап аукционов в этом раунде завершен. Начинается этап продаж.`);

          this.completedOffers = [];
          initDealOffersStep(this.currentPlayer);
          return;
        }

        this.clientCard = getRandomClient();
        this.clientCard.moveToTarget(this.decks.zone_auction_client);
        this.carCard = this.decks.car.getRandomItem();
        this.carCard.moveToTarget(this.decks.zone_auction_car);

        this.logs(`Клиент "${this.clientCard.title}" продает автомобиль "${this.carCard.title}".`);

        settingPlayerDecksAvailabilityForAuction();

        this.completedBets = [];
        this.set({ betSum: 0 });
        initAuctionBetStep(this.currentPlayer);
      }
      break;

    case 'AUCTION_BET':
      {
        const currentPlayer = this.currentPlayer;
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

          this.logs(`Игрок ${currentPlayer.userName} побеждает в аукционе за автомобиль "${this.carCard.title}".`);

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
          this.carCard.moveToTarget(this.decks.drop);
        } else {
          processAuctionResultsForWinner(winner);
          loser.returnTableCardsToHand();
        }

        this.currentPlayer = loser; // первым ставку делает проигравший в предыдущем раунде
        this.set({
          roundStep: 'AUCTION_START',
          auctionsLeftInRound: this.auctionsLeftInRound - 1,
        });
        this.run('endRound');
      }
      break;
    case 'OFFER_READY':
      {
        const { currentPlayer } = this;
        const {
          decks: { service: serviceDeck, car_played: playedCarDeck, service_played: playedServiceDeck },
        } = currentPlayer;

        const emptyOffer = playedCarDeck.itemsCount() === 0;
        if (emptyOffer) {
          this.logs(
            `Так как игрок ${currentPlayer.userName} не сделал ни одного предложения, то он заканчивает участие на данном этапе.`
          );

          playedServiceDeck.moveAllItems({
            target: serviceDeck,
            setData: { visible: false },
          });
          this.completedOffers.push(currentPlayer);
        } else {
          const moveConfig = {
            target: this.selectedDealDeck,
            emitEvent: 'RESET',
            setData: {
              visible: false,
              owner: { code: currentPlayer.code, order: Date.now() },
            },
          };
          playedCarDeck.moveAllItems(moveConfig);
          playedServiceDeck.moveAllItems(moveConfig);
        }

        if (this.selectedDealDeck) {
          this.selectedDealDeck.set({ eventData: { currentDeal: null } });
        }

        if (this.completedOffers.length !== players.length) {
          // не все игроки сделали свои предложения - предаем ход
          let player = currentPlayer.nextPlayer();
          if (this.completedOffers.includes(player)) player = currentPlayer;
          initDealOffersStep(player);
          return;
        }

        this.logs(`Все игроки сделали свои предложения. Начинается определение победителей по сделкам.`);

        this.roundStepWinner = null;
        this.selectedDealDeck = null;
        this.replacedClientDeal = null;
        this.dealStars = {};
        this.checkedDeals = [];
        this.set({
          statusLabel: this.stepLabel('Оценка предложений'),
          roundStep: 'CHECK_DEAL',
        });
        this.run('endRound');
      }
      break;
    case 'CHECK_DEAL':
      {
        const dealDeck = this.getObjects({
          className: 'Deck',
          attr: { subtype: 'deal' },
        }).find((deck) => {
          return !this.checkedDeals.includes(deck);
        });

        if (!dealDeck) {
          // проверены все возможные сделки с клиентами
          clearCurrentDeal();

          const stars = this.dealStars;
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

          if (this.roundStepWinner) this.currentPlayer = this.roundStepWinner.nextPlayer();
          this.set({ roundStep: 'ROUND_START' });
          this.run('endRound');
          return;
        }

        clearCurrentDeal();
        this.selectedDealDeck = dealDeck;

        this.checkedDeals.push(dealDeck);
        dealDeck.set({
          eventData: { currentDeal: true }, // для визуализации на фронте
        });

        this.clientCard = null; // *
        this.clientCardNew = null; // *
        this.featureCard = null; // *
        this.creditCard = null; // *
        // * новые значения установятся в processDealData
        const { offers, offersCount } = processDealData(dealDeck);

        if (offersCount > 0) {
          setDeckCardsVisible(dealDeck, {
            setData: { eventData: { playDisabled: true } },
          });

          if (this.featureCard.replaceClient && !this.featureCard.played) {
            this.featureCard.set({ played: true });

            const dealDeck = this.selectedDealDeck;
            dealDeck.set({ eventData: { currentDeal: null } });
            this.replacedClientDeal = dealDeck;

            const newClient = getRandomClient();
            newClient.set({
              visible: true,
              eventData: { replacedClient: this.clientCard.id() },
            });
            this.clientCardNew = newClient;
            dealDeck.addItem(newClient);
            dealDeck.clientCard = newClient; // используется только в selectClientToDeal для настроек визуализации

            this.logs(
              `Произошла замена клиента. Расчет сделки ведется исходя из бюджета "${this.clientCard.title}", но по требованиям "${newClient.title}".`
            );

            const offerValues = Object.values(offers);
            const offerPlayers = offerValues.map((offer) => offer.player);
            // в этом раунде разрешаем делать предложения новому клиенту только тем, кто сделал предложение основному клиенту
            this.completedOffers = this.completedOffers.filter((player) => {
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
            this.logs(`Клиента "${this.clientCard.title}" не заинтересовало ни одно предложение.`);
            for (const player of players) {
              player.decks.car.set({ eventData: { playDisabled: true } });
              player.decks.service.set({ eventData: { playDisabled: true } });
              player.activate({ setData: { eventData: { roundBtn: { label: 'Пропустить' } } } });
            }
            lib.timers.timerRestart(this, { time: timer.SHOW_RESULTS });
          } else {
            this.run('endRound');
          }
          return;
        }

        this.logs(`Клиента "${this.clientCard.title}" заинтересовал автомобиль "${carCard.title}".`);

        carCard.moveToTarget(player.decks.car_played);
        for (const service of serviceCards) {
          service.moveToTarget(player.decks.service_played);
        }

        if (this.featureCard.canPlay()) this.featureCard.play({ player });
        if (this.featureCard.reference) {
          // !!! createClientDealDeck работает только с this.clientCard, но в этом месте проблем не возникает, потому что дальше по коду case-а он не используется
          this.clientCard = getRandomClient();
          const deck = this.createClientDealDeck();
          deck.set({ eventData: { referencePlayerCode: player.code } });

          this.logs(
            `Игрок ${player.userName} получает возможность эксклюзивной работы с клиентом "${this.clientCard.title}".`
          );

          // чтобы в этом раунде обработки сделки не проводилось
          this.checkedDeals.push(deck);
        }

        this.roundStepWinner = player;
        this.set({
          statusLabel: this.stepLabel('Подарок клиенту'),
          roundStep: 'PRESENT',
        });
        if (player.findEvent({ present: true })) {
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
        const { roundStepWinner: player } = this;
        this.logs(`Начались продажи дополнительных сервисов клиенту.`);
        player.decks.service.set({ eventData: { playDisabled: null } });

        player.activate({
          publishText:
            'Вы можете сделать дополнительные продажи (не превышающее в сумме стоимость авто). При превышении бюджета клиента сделка будет отменена.',
          setData: { eventData: { roundBtn: { label: 'Завершить сделку' } } },
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
        const { roundStepWinner: player, selectedDealDeck, featureCard, clientMoney, dealStars } = this;
        const carCard = player.decks.car_played.select('Card')[0];
        const serviceCards = player.decks.service_played.select('Card');

        // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
        const { fullPrice, carTitle, stars } = this.calcOffer({ carCard, serviceCards, featureCard });

        returnCardsToOwners(selectedDealDeck);

        if (fullPrice <= clientMoney) {
          const formattedPrice = new Intl.NumberFormat().format((fullPrice || 0) * 1000);
          this.logs(
            `Клиент "${this.clientCard.title}" приобрел автомобиль "${carTitle}" и сервисы за ${formattedPrice}₽.`
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
