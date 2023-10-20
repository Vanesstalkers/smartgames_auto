(function () {
  const {
    round,
    // activeEvent, // нельзя тут объявлять, потому что он динамически обновиться в toggleEventHandlers
    settings: {
      // конфиги
      timer,
    },
    // getObjectByCode: getByCode, // нельзя тут объявлять, потому что потеряется контекст выполнения
  } = this;
  const players = this.getPlayerList();

  switch (this.roundStep) {
    case 'ROUND_START':
      {
        const newRoundNumber = round + 1;
        this.logs(`Начало раунда №${newRoundNumber}.`);

        const updateCardsFunc = domain.game.actions.games[this.gameType].updateClientTableCards;
        updateCardsFunc.call(this);

        this.calcClientMoney();

        this.set({
          round: newRoundNumber,
          roundStep: this.featureCard.replaceClient ? 'REPLACE_CLIENT' : 'FIRST_OFFER',
        });
        this.activatePlayers({
          publishText: 'Сделайте ваше предложение клиенту (одно авто и сколько угодно сервисов).',
        });
        lib.timers.timerRestart(this);
      }
      break;
    case 'REPLACE_CLIENT':
      {
        this.logs(`Произошла замена клиента.`);

        this.clientReplacedCard = this.clientCard;
        this.clientCard = this.decks.client.getRandomItem();

        if (!this.clientCard) {
          this.logs(`В колоде закончились карты клиентов.`);
          return this.checkWinnerAndFinishGame();
        }

        this.clientCard.moveToTarget(this.decks.zone_client_dop);
        for (const player of players) {
          player.returnTableCardsToHand();
        }
        this.showTableCards();

        this.activatePlayers({ publishText: 'Клиент поменялся, вы можете сделать новое предложение.' });
        this.set({ roundStep: 'FIRST_OFFER' });
        lib.timers.timerRestart(this);
      }
      break;
    case 'FIRST_OFFER':
      {
        this.showTableCards();

        const { player, carTitle } = selectBestOffer.call(this);
        if (!player) {
          this.logs(`Клиента не устроило ни одно из предложений.`);

          this.set({ roundStep: 'SHOW_RESULTS' });
          this.run('endRound');
        } else {
          this.roundStepWinner = player;
          this.logs(`Клиента заинтересовал автомобиль "${carTitle}".`);

          // у всех карт, выложенных на стол, убираем возможность возврата карты в руку
          for (const deck of player.getObjects({ className: 'Deck', attr: { placement: 'table' } })) {
            for (const card of deck.getObjects({ className: 'Card' })) {
              card.activeEvent.set({ playDisabled: true });
            }
          }

          try {
            this.featureCard.play({ player });
          } catch (err) {
            if (!err.message.includes('event not found')) throw err;
          }

          this.set({ roundStep: 'PRESENT' });
          if (player.activeEvent?.present) {
            this.logs(`Происходит выбор подарка клиенту.`);
            player.activate();
            lib.timers.timerRestart(this, { time: timer.PRESENT });
          } else {
            this.run('endRound');
          }
        }
      }
      break;
    case 'PRESENT':
      {
        this.roundStepWinner.activate({
          publishText: 'Добавьте в сделку нужное вам количество сервисов (не превышающее в сумме стоимость авто).',
        });
        this.set({ roundStep: 'SECOND_OFFER' });
        this.logs(`Начались продажи дополнительных сервисов клиенту.`);
        lib.timers.timerRestart(this, { time: timer.SECOND_OFFER });
      }
      break;
    case 'SECOND_OFFER':
      {
        const player = this.roundStepWinner;

        // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
        const { fullPrice, carTitle } = calcOfferForPlayer.call(this, player);
        if (fullPrice <= this.clientMoney) {
          this.logs(
            `Клиент приобрел автомобиль "${carTitle}" и сервисы за ${new Intl.NumberFormat().format(
              (fullPrice || 0) * 1000
            )}₽.`
          );

          const money = player.money + fullPrice;
          player.set({ money });

          if (money >= this.settings.winMoneySum) {
            return this.endGame({ winningPlayer: player });
          }
        } else {
          this.logs(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
          delete this.roundStepWinner;
        }

        this.set({ roundStep: 'SHOW_RESULTS' });
        this.run('endRound');
      }
      break;
    case 'SHOW_RESULTS':
      {
        const emptyClientDeck = this.decks.client.itemsCount() === 0;
        const emptyFeatureDeck = this.decks.feature.itemsCount() === 0;
        if (emptyClientDeck || emptyFeatureDeck) {
          this.logs(`В колоде закончились карты ${emptyClientDeck ? 'клиентов' : 'сервисов'}.`);
          return this.checkWinnerAndFinishGame();
        }

        this.restorePlayersHands();
        this.removeTableCards();

        if (this.featureCard.reference && this.roundStepWinner) {
          // дополнительный клиент
          for (const player of players) {
            if (player !== this.roundStepWinner) player.initEvent('skipRound');
          }
        } else {
          this.addNewRoundCardsToPlayers();

          if (!this.checkPlayersReady()) {
            // событие удаления лишних карт (хотя бы у одного из игроков)
            lib.timers.timerRestart(this, { time: timer.CARD_DROP });
          } else {
            lib.timers.timerRestart(this, { time: timer.SHOW_RESULTS });
          }
        }
        this.set({ roundStep: 'ROUND_END' });
        this.run('endRound');
      }
      break;
    case 'ROUND_END':
      {
        this.clearEvents(); // чтобы очистить события возврата карт, взятых в руку
        this.set({ roundStep: 'ROUND_START', roundStepWinner: null });
        this.run('endRound');
      }
      break;
  }

  function selectBestOffer() {
    const { clientCard, clientMoney } = this;
    const offers = [];

    for (const player of this.getPlayerList()) {
      let offer;
      try {
        offer = calcOfferForPlayer.call(this, player);
      } catch (err) {
        if (err === 'no_car') continue;
        else throw err;
      }

      if (
        offer.fullPrice < clientMoney &&
        offer.stars >= clientCard.stars &&
        (clientCard.priceGroup === '*' || offer.priceGroup.find((group) => clientCard.priceGroup.includes(group)))
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
    return bestOffer;
  }
  function calcOfferForPlayer(player) {
    const [carDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'car_played' } }); // ??? почему не через .decks
    const [carCard] = carDeck.getObjects({ className: 'Card' });
    const [serviceDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'service_played' } }); // ??? .decks
    const serviceCards = serviceDeck.getObjects({ className: 'Card' });
    const { featureCard } = this;
    this.calcOffer({ player, carCard, serviceCards, featureCard });
  }
});
