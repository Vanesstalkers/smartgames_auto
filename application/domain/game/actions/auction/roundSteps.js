(function () {
  const {
    rounds,
    round: roundNumber,
    decks,
    settings: { timer, winMoneySum, auctionsPerRound },
  } = this;
  const round = rounds[roundNumber];
  const players = this.players();
  const result = { newRoundLogEvents: [], newRoundNumber: roundNumber };

  const getRandomClient = () => {
    const client = decks.client.getRandomItem();
    if (!client) {
      const [{ player: winningPlayer }] = players.sort((a, b) => (a.money > b.money ? -1 : 1));
      return this.run('endGame', { winningPlayer });
    }
    return client;
  };

  const settingPlayerDecksAvailabilityForAuction = () => {
    for (const player of players) {
      player.decks.car.set({ eventData: { playDisabled: true } });
      player.decks.service.set({ eventData: { playDisabled: null } });
    }
  };

  const initAuctionBetStep = (player) => {
    const round = this.rounds[this.round];

    round.currentPlayer = player;

    result.statusLabel = this.stepLabel('Ставки на аукционе');
    result.roundStep = 'AUCTION_BET';

    if (player.eventData.skipTurn) {
      result.newRoundLogEvents.push({ msg: `Игрок {{player}} пропускает ход.`, userId: player.userId });
      player.set({ eventData: { skipTurn: null } });

      // в AUCTION_BET сработает проверка playerNullBet с вызовом initAuctionBetStep({ player: nextPlayer })
      return { ...result, forcedEndRound: true };
    }

    player.activate({
      notifyUser: 'Сделай свою ставку',
      setData: { eventData: { controlBtn: { label: 'Подтвердить выбор' } } },
    });

    return result;
  };

  const processAuctionResultsForWinner = (winner) => {
    const { carCard } = round;
    carCard.moveToTarget(winner.decks.car);
    winner.decks.played.moveAllItems({ toDrop: true, emitEvent: 'RESET', setData: { visible: false } });
  };

  const initDealOffersStep = (player) => {
    round.currentPlayer = player;

    result.statusLabel = this.stepLabel('Предложение клиенту');
    result.roundStep = 'OFFER_READY';

    if (player.decks.car.itemsCount() === 0) {
      result.newRoundLogEvents.push(`У игрока ${player.userName} нет карт авто и он пропускает ход.`);
      // в OFFER_READY сработает проверка emptyOffer с вызовом round.completedOffers.push(currentPlayer);
      return { ...result, forcedEndRound: true };
    }

    this.initEvent('selectClientToDeal', { player });

    player.decks.car.set({ eventData: { playDisabled: null } });
    player.decks.service.set({ eventData: { playDisabled: null } });

    if (round.selectedDealDeck) delete round.selectedDealDeck;

    player.activate({
      notifyUser: 'Выбери клиента и сделай ему предложение о покупке авто.',
      setData: { eventData: { controlBtn: { label: 'Подтвердить выбор' } } },
    });

    return result;
  };

  const processDealData = (deck) => {
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
    const { carCard } = round;
    const priceMods = [];

    const serviceCards = player.decks.played.items().filter((c) => c.subtype === 'service');
    for (const card of serviceCards) priceMods.push(card.price);

    const fullPrice = priceMods.reduce((price, mod) => {
      if (mod.at(-1) === '%') return price + carCard.price * (parseInt(mod) / 100);
      return price + parseInt(mod);
    }, 0);

    return fullPrice;
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
    const { selectedDealDeck } = round;

    if (selectedDealDeck) {
      // делаем здесь, чтобы показать результаты предыдущей проверенной сделки
      selectedDealDeck.set({ eventData: { currentDeal: null, referencePlayerId: null } });
      returnCardsToOwners(selectedDealDeck);
    }
  };

  const getPlayersOrderedByDealStars = ({ maxStars }) => {
    const { dealStars: stars } = round;
    const [maxStarsCode] = Object.entries(stars).find(([code, stars]) => stars === maxStars) || [];

    return Object.keys(stars)
      .sort((a, b) => (a === maxStarsCode ? -1 : 1))
      .map((code) => ({ code, player: this.find(code) }));
  };

  const restoreCardsForDeals = ({ orderedPlayers, maxStars }) => {
    const { dealStars: stars } = round;
    const serviceCards = decks.service_drop.select('Card');
    serviceCards.sort((a, b) => (a.eventData.playedTime || 0) - (b.eventData.playedTime || 0));

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
    case 'ROUND_START': {
      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
      const round = this.prepareRoundObject();

      if (!round.currentPlayer) round.currentPlayer = players[0];

      round.auctionsLeftInRound = auctionsPerRound;

      result.roundStep = 'AUCTION_START';
      return { ...result, forcedEndRound: true };
    }

    case 'AUCTION_START': {
      if (round.auctionsLeftInRound === 0) {
        result.newRoundLogEvents.push(`Этап аукционов в этом раунде завершен. Начинается этап продаж.`);

        round.completedOffers = [];
        return initDealOffersStep(round.currentPlayer);
      }

      round.clientCard = getRandomClient();
      round.clientCard.moveToTarget(decks.zone_auction_client);
      round.carCard = decks.car.getRandomItem();
      round.carCard.moveToTarget(decks.zone_auction_car);

      result.newRoundLogEvents.push(`Клиент "${round.clientCard.title}" продает автомобиль "${round.carCard.title}".`);

      settingPlayerDecksAvailabilityForAuction();

      round.completedBets = [];
      round.betSum = 0;
      return initAuctionBetStep(round.currentPlayer);
    }

    case 'AUCTION_BET': {
      const { currentPlayer, carCard } = round;
      const nextPlayer = currentPlayer.nextPlayer();
      let winner, loser;

      const betSum = calcAuction(currentPlayer);

      if (betSum > round.betSum) {
        round.betSum = betSum; // нельзя переносить в initAuctionBetStep, иначе будет ложный вызов noAuctionBets

        const serviceCards = currentPlayer.decks.played.items().filter((c) => c.subtype === 'service');
        for (const card of serviceCards) card.set({ eventData: { playDisabled: true } });

        // ! будет работать только для 2-х игроков
        if (!round.completedBets.includes(nextPlayer)) {
          // следующий игрок еще не закончил делать ставки - передаем ему ход
          return initAuctionBetStep(nextPlayer);
        }

        result.newRoundLogEvents.push(
          `Игрок ${currentPlayer.userName} побеждает в аукционе за автомобиль "${carCard.title}".`
        );

        winner = currentPlayer;
        loser = nextPlayer;
      } else {
        const formattedBet = new Intl.NumberFormat().format((betSum || 0) * 1000);
        const formattedSum = new Intl.NumberFormat().format((round.betSum || 0) * 1000);
        result.newRoundLogEvents.push(
          `Игрок ${currentPlayer.userName} выбывает из торгов, так как его ставка (${formattedBet}₽) не смогла превысить предыдущее предложение (${formattedSum}₽).`
        );

        round.completedBets.push(currentPlayer);
        if (round.betSum === 0 && round.completedBets.length !== players.length) {
          // не все игроки закончили делать ставки - передаем ход
          return initAuctionBetStep(nextPlayer);
        }

        winner = nextPlayer;
        loser = currentPlayer;
      }

      this.createClientDealDeck();

      const noAuctionBets = round.betSum === 0;
      if (noAuctionBets) {
        carCard.moveToTarget(decks.car_drop);
      } else {
        processAuctionResultsForWinner(winner);
        loser.returnTableCardsToHand();
      }

      round.currentPlayer = loser; // первым ставку делает проигравший в предыдущем раунде
      round.auctionsLeftInRound = round.auctionsLeftInRound - 1;

      result.roundStep = 'AUCTION_START';
      return { ...result, forcedEndRound: true };
    }

    case 'OFFER_READY': {
      const { currentPlayer, selectedDealDeck } = round;
      const { decks: playerDecks } = currentPlayer;
      const playedDeck = playerDecks.played;

      let emptyOffer = playedDeck.items().find((c) => c.subtype === 'car') === undefined;

      if (!selectedDealDeck) {
        if (!emptyOffer) {
          const moveConfig = { toDeck: true, setData: { visible: false } };

          playerDecks.car.moveAllItems(moveConfig);
          playerDecks.service.moveAllItems(moveConfig);

          emptyOffer = true;
        }
      } else {
        selectedDealDeck.set({ eventData: { currentDeal: null } });
      }

      if (emptyOffer) {
        result.newRoundLogEvents.push(
          `Так как игрок ${currentPlayer.userName} не сделал ни одного предложения, то он заканчивает участие на данном этапе.`
        );

        playedDeck.moveAllItems({ toDeck: true, setData: { visible: false } });
        round.completedOffers.push(currentPlayer);
      } else {
        playedDeck.moveAllItems({
          target: selectedDealDeck,
          emitEvent: 'RESET',
          setData: { visible: false, owner: { code: currentPlayer.code, order: Date.now() } },
        });
      }

      if (round.completedOffers.length !== players.length) {
        // не все игроки сделали свои предложения - предаем ход
        let player = currentPlayer.nextPlayer();
        if (round.completedOffers.includes(player)) player = currentPlayer;
        return initDealOffersStep(player);
      }

      result.newRoundLogEvents.push(
        `Все игроки сделали свои предложения. Начинается определение победителей по сделкам.`
      );

      round.roundStepWinner = null;
      round.selectedDealDeck = null;
      round.replacedClientDeal = null;
      round.dealStars = {};
      round.checkedDeals = [];

      result.statusLabel = this.stepLabel('Оценка предложений');
      result.roundStep = 'CHECK_DEAL';
      return { ...result, forcedEndRound: true };
    }

    case 'CHECK_DEAL': {
      const { checkedDeals, roundStepWinner, clientCard, completedOffers, dealStars: stars } = round;
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
            const [{ player: winningPlayer } = {}] = orderedPlayers.sort((a, b) =>
              a.player.money > b.player.money ? -1 : 1
            );

            return this.run('endGame', { winningPlayer });
          }

          for (const { code, player } of orderedPlayers) {
            result.newRoundLogEvents.push(
              `За проведенные в этом раунде сделки игрок ${player.userName} получает карты сервисов (${stars[code]} шт).`
            );
          }
          restoreCardsForDeals({ orderedPlayers, maxStars });
        }

        if (roundStepWinner) round.currentPlayer = roundStepWinner.nextPlayer();

        result.roundStep = 'ROUND_START';
        return { ...result, forcedEndRound: true };
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
      // * новые значения установятся ниже в processDealData

      const { offers, offersCount } = processDealData(dealDeck);

      if (offersCount > 0) {
        setDeckCardsVisible(dealDeck, {
          setData: { eventData: { playDisabled: true } },
        });

        if (round.featureCard.replaceClient && !round.featureCard.played) {
          round.featureCard.set({ played: true });

          round.selectedDealDeck.set({ eventData: { currentDeal: null } });
          round.replacedClientDeal = round.selectedDealDeck;

          const newClient = getRandomClient();
          newClient.set({
            visible: true,
            eventData: { replacedClient: round.clientCard.id(), playDisabled: true },
          });

          round.clientCardNew = newClient;
          dealDeck.addItem(newClient);
          dealDeck.clientCard = newClient; // используется только в selectClientToDeal для настроек визуализации

          result.newRoundLogEvents.push(
            `Произошла замена клиента. Расчет сделки ведется исходя из бюджета "${round.clientCardNew.title}", но по требованиям "${round.clientCard.title}".`
          );
        }
      }

      round.clientMoney = this.calcClientMoney();
      const {
        bestOffer: { player, carCard, serviceCards },
      } = this.selectBestOffer(offers);

      if (!player) {
        result.statusLabel = this.stepLabel('Оценка предложений');
        result.roundStep = 'CHECK_DEAL';

        if (offersCount > 0) {
          result.newRoundLogEvents.push(`Клиента "${round.clientCard.title}" не заинтересовало ни одно предложение.`);
          for (const player of players) {
            player.decks.car.set({ eventData: { playDisabled: true } });
            player.decks.service.set({ eventData: { playDisabled: true } });
            player.activate({ setData: { eventData: { controlBtn: { label: 'Пропустить' } } } });
          }

          return { ...result, timerRestart: timer.SHOW_RESULTS };
        }

        return { ...result, forcedEndRound: true };
      }

      result.newRoundLogEvents.push(`Клиента "${round.clientCard.title}" заинтересовал автомобиль "${carCard.title}".`);

      carCard.moveToTarget(player.decks.played);
      for (const service of serviceCards) service.moveToTarget(player.decks.played);

      round.featureCard.play({ player });

      if (round.featureCard.reference) {
        // ! createClientDealDeck работает только с round.clientCard, но в этом месте проблем не возникает, потому что дальше по коду case-а он не используется
        round.clientCard = getRandomClient();

        const deck = this.createClientDealDeck();
        deck.set({ eventData: { referencePlayerId: player.id() } });

        result.newRoundLogEvents.push(
          `Игрок ${player.userName} получает возможность эксклюзивной работы с клиентом "${round.clientCard.title}".`
        );

        // чтобы в этом раунде обработки сделки не проводилось
        checkedDeals.push(deck);
      }

      round.roundStepWinner = player;
      result.statusLabel = this.stepLabel('Подарок клиенту');
      result.roundStep = 'PRESENT';

      if (player.findEvent({ name: 'present' })) {
        result.newRoundLogEvents.push(`Происходит выбор подарка клиенту.`);
        player.activate();

        return { ...result, timerRestart: timer.PRESENT };
      }

      return { ...result, forcedEndRound: true };
    }

    case 'PRESENT': {
      const { roundStepWinner: player } = this.rounds[this.round];

      result.newRoundLogEvents.push(`Начались продажи дополнительных сервисов клиенту.`);

      player.decks.service.set({ eventData: { playDisabled: null } });

      player.activate({
        notifyUser: 'Ты можешь сделать дополнительные продажи. При превышении бюджета клиента сделка будет отменена.',
        setData: { eventData: { controlBtn: { label: 'Завершить сделку' } } },
      });

      result.statusLabel = this.stepLabel('Дополнительные продажи');
      result.roundStep = 'SECOND_OFFER';

      return { ...result, timerRestart: timer.SECOND_OFFER };
    }

    case 'SECOND_OFFER': {
      const {
        roundStepWinner: player,
        selectedDealDeck,
        featureCard,
        clientMoney,
        dealStars,
        clientCard,
      } = this.rounds[this.round];
      const carCard = player.decks.played.items().find((c) => c.subtype === 'car');
      const serviceCards = player.decks.played.items().filter((c) => c.subtype === 'service');

      // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
      const { fullPrice, carTitle, stars } = this.calcOffer({ carCard, serviceCards, featureCard });

      returnCardsToOwners(selectedDealDeck);

      if (fullPrice <= clientMoney) {
        const formattedPrice = new Intl.NumberFormat().format((fullPrice || 0) * 1000);
        const services = serviceCards.map(({ title }) => `"${title}"`).join(', ');
        result.newRoundLogEvents.push(
          `Клиент "${clientCard.title}" приобрел автомобиль "${carTitle}" и сервисы (${services}) за ${formattedPrice}₽.`
        );

        const money = player.money + fullPrice;
        player.set({ money });
        dealStars[player.code] = (dealStars[player.code] || 0) + stars;

        player.decks.played.moveAllItems({ toDrop: true });

        this.deleteDeck(selectedDealDeck);
      } else {
        result.newRoundLogEvents.push(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
        player.decks.played.moveAllItems({ toDeck: true });
      }

      result.statusLabel = this.stepLabel('Оценка предложений');
      result.roundStep = 'CHECK_DEAL';

      return { ...result, forcedEndRound: true };
    }
  }
});
