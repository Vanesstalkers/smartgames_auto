(function () {
  const {
    round,
    // activeEvent, // нельзя тут объявлять, потому что он динамически обновиться в toggleEventHandlers
    settings: {
      // конфиги
      timer,
      auctionsPerRound,
    },
    // getObjectByCode: getByCode, // нельзя тут объявлять, потому что потеряется контекст выполнения
  } = this;
  const players = this.getPlayerList();

  switch (this.roundStep) {
    case 'ROUND_START':
      {
        const newRoundNumber = round + 1;
        this.logs(`Начало раунда №${newRoundNumber}.`);

        for (const player of players) {
          player.decks.car.set({ activeEvent: { playDisabled: true } });
          // если игроки не делали предложения на аукционах, то decks.service останутся заблокированной после initSalesOffersStep
          player.decks.service.set({ activeEvent: null });
        }

        this.set({
          round: newRoundNumber,
          roundStep: 'AUCTION_START',
          auctionCount: auctionsPerRound,
        });
        this.run('endRound');
      }
      break;
    case 'AUCTION_START':
      {
        if (this.auctionCount == 0) {
          this.completedOffers = [];
          initSalesOffersStep.call(this, { player: this.currentPlayer });
        } else {
          this.clientCard = this.decks.client.getRandomItem();
          this.clientCard.moveToTarget(this.decks.zone_auction_client);
          this.carCard = this.decks.car.getRandomItem();
          this.carCard.moveToTarget(this.decks.zone_auction_car);

          initAuctionBidStep.call(this, {
            bidSum: -1 * (players.length - 1),
            player: this.currentPlayer || players[0],
          });
        }
      }
      break;
    case 'AUCTION_BID':
      {
        const currentPlayer = this.currentPlayer;
        const nextPlayer = currentPlayer.nextPlayer();

        let bidSum = calcAuction.call(this, currentPlayer);
        if (bidSum === 0 && this.bidSum < 0) {
          // логика проверки нулевых ставок (по итогу сбрасываем машину, если никто не сделал ставку)
          bidSum = this.bidSum + 1;
        }
        if (bidSum > this.bidSum) {
          const playedCars = currentPlayer.decks.service_played.getObjects({ className: 'Card' });
          for (const card of playedCars) {
            card.set({ activeEvent: { playDisabled: true } });
          }
          initAuctionBidStep.call(this, { bidSum, player: nextPlayer });
        } else {
          const clientSalesDeck = this.addDeck(
            { type: 'card', subtype: 'sales', placement: 'table' },
            { parentDirectLink: false }
          );
          clientSalesDeck.set({ saleInitiated: false });

          // порядок добавления влияет на визуализацию
          this.decks.feature.getRandomItem().moveToTarget(clientSalesDeck);
          this.decks.credit.getRandomItem().moveToTarget(clientSalesDeck);
          this.clientCard.moveToTarget(clientSalesDeck);
          this.clientCard.set({ visible: true, activeEvent: { playDisabled: true } });

          if (this.bidSum === 0) {
            this.carCard.moveToTarget(this.decks.drop);
          } else {
            {
              // winner
              this.carCard.moveToTarget(nextPlayer.decks.car);

              nextPlayer.decks.service_played.moveAllItems(
                {
                  target: this.decks.drop_service,
                },
                { visible: false }
              );
            }

            {
              // loser
              currentPlayer.decks.service_played.moveAllItems(
                {
                  target: currentPlayer.decks.service,
                },
                { visible: false, activeEvent: null }
              );
            }
          }

          this.set({
            auctionCount: this.auctionCount - 1,
            roundStep: 'AUCTION_START',
          });
          this.currentPlayer = currentPlayer;
          this.run('endRound');
        }
      }
      break;
    case 'SALES_OFFERS':
      {
        if (!this.selectedSaleDeck) {
          this.set({ roundStep: 'FIRST_OFFER' });
          this.run('endRound');
        } else {
          this.currentPlayer.decks.car.set({ activeEvent: null });
          this.currentPlayer.decks.service.set({ activeEvent: null });

          this.set({ roundStep: 'FIRST_OFFER' });
          this.currentPlayer.activate({
            publishText: 'Сделайте ваше предложение клиенту',
            setData: { activeEvent: { roundBtn: { label: 'Подтвердить выбор' } } },
          });
          lib.timers.timerRestart(this);
        }
      }
      break;
    case 'FIRST_OFFER':
      {
        const currentPlayer = this.currentPlayer;

        if (currentPlayer.decks.car_played.itemsCount() === 0) {
          // currentPlayer.decks.service.set({ activeEvent: null }); // если у игрока не было продаж и  он пропустил все торги, то decks.service у него останется заблокированной
          currentPlayer.decks.car_played.moveAllItems({ target: currentPlayer.decks.car }, { visible: false });
          currentPlayer.decks.service_played.moveAllItems({ target: currentPlayer.decks.service }, { visible: false });
          this.completedOffers.push(currentPlayer);
        } else {
          const target = this.selectedSaleDeck;
          const owner = { code: currentPlayer.code, order: Date.now() };
          currentPlayer.decks.car_played.moveAllItems({ target }, { visible: false, owner });
          currentPlayer.decks.service_played.moveAllItems({ target }, { visible: false, owner });
        }

        if (this.completedOffers.length === 2) {
          this.roundStepWinner = null;
          this.selectedSaleDeck = null;
          this.salesStars = {};
          this.set({ roundStep: 'CHECK_SALES' });
          this.run('endRound');
        } else {
          let player = currentPlayer.nextPlayer();
          if (this.completedOffers.includes(player)) player = currentPlayer;
          initSalesOffersStep.call(this, { player });
        }
      }
      break;
    case 'CHECK_SALES':
      {
        const [salesDeck] = this.getObjects({
          className: 'Deck',
          attr: { subtype: 'sales', saleInitiated: false },
        });

        if (!salesDeck) {
          // проверены все возможные сделки с клиентами

          const stars = this.salesStars;
          const maxStars = Math.max(...Object.values(stars));

          if (maxStars) {
            const maxStarsCode = Object.entries(stars).find(([code, stars]) => stars === maxStars)?.[0];

            const orderedPlayers = Object.keys(stars)
              .sort((a, b) => (a === maxStarsCode ? -1 : 1))
              .map((code) => ({ code, player: this.getObjectByCode(code) }));

            if (orderedPlayers.find(({ player }) => player.money > this.settings.winMoneySum)) {
              const [{ player: winningPlayer }] = orderedPlayers.sort((a, b) =>
                a.player.money > b.player.money ? -1 : 1
              );
              return this.endGame({ winningPlayer });
            }

            const serviceCards = this.decks.drop_service.getObjects({ className: 'Card' });
            for (let i = 0; i < maxStars; i++) {
              for (const { code, player } of orderedPlayers) {
                if ((stars[code] || 0) == 0) continue;
                stars[code]--;
                const card = serviceCards.shift();
                if (!card) continue;
                card.set({ activeEvent: null });
                card.moveToTarget(player.decks.service);
              }
            }
          }

          this.set({ roundStep: 'ROUND_START' });
          this.run('endRound');
          return;
        }

        this.selectedSaleDeck = salesDeck;
        salesDeck.set({ saleInitiated: true, activeEvent: { currentSale: true } });
        const offers = {};

        for (const card of salesDeck.getObjects({ className: 'Card' })) {
          card.set({ activeEvent: { playDisabled: true } });
          salesDeck.setItemVisible(card);
          if (card.group === 'client') this.clientCard = card;
          else if (card.group === 'feature') this.featureCard = card;
          else if (card.group === 'credit') this.creditCard = card;
          else if (card.owner) {
            const key = card.owner.code + card.owner.order;
            if (!offers[key]) {
              offers[key] = {
                player: this.getObjectByCode(card.owner.code),
                serviceCards: [],
              };
            }
            if (card.group === 'car') {
              offers[key].carCard = card;
            } else {
              offers[key].serviceCards.push(card);
            }
          }
        }

        this.calcClientMoney();
        const { player, carCard, serviceCards } = selectBestOffer.call(this, offers);
        if (!player) {
          // победитель не определен

          this.selectedSaleDeck.set({ activeEvent: null });
          const cards = this.selectedSaleDeck.getObjects({ className: 'Card' });
          for (const card of cards) {
            if (!card.owner) continue;
            const player = this.getObjectByCode(card.owner.code);
            card.moveToTarget(player.decks[card.group]); // card.group == (car || service)
          }

          this.run('endRound');
          return;
        }

        this.roundStepWinner = player;
        this.logs(`Клиента заинтересовал автомобиль "${carCard.title}".`);

        carCard.moveToTarget(player.decks.car_played);
        for (const service of serviceCards) {
          service.moveToTarget(player.decks.service_played);
        }

        player.decks.service.set({ activeEvent: null });
        player.activate({
          publishText:
            'Вы можете сделать дополнительные продажи. При превышении бюджета клиента сделка будет отменена.',
          setData: { activeEvent: { roundBtn: { label: 'Завершить сделку' } } },
        });

        this.set({ roundStep: 'SECOND_OFFER' });
        lib.timers.timerRestart(this);
      }
      break;
    case 'SECOND_OFFER':
      {
        const { roundStepWinner: player, featureCard } = this;
        const [carDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'car_played' } });
        const [carCard] = carDeck.getObjects({ className: 'Card' });
        const [serviceDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'service_played' } });
        const serviceCards = serviceDeck.getObjects({ className: 'Card' });

        // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
        const { fullPrice, carTitle, stars } = this.calcOffer({ carCard, serviceCards, featureCard });
        if (fullPrice <= this.clientMoney) {
          this.logs(
            `Клиент приобрел автомобиль "${carTitle}" и сервисы за ${new Intl.NumberFormat().format(
              (fullPrice || 0) * 1000
            )}₽.`
          );

          const money = player.money + fullPrice;
          player.set({ money });
          this.salesStars[player.code] = (this.salesStars[player.code] || 0) + stars;

          player.decks.car_played.moveAllItems({ target: this.decks.drop });
          player.decks.service_played.moveAllItems({ target: this.decks.drop });
        } else {
          this.logs(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
          delete this.roundStepWinner;
        }

        const cards = this.selectedSaleDeck.getObjects({ className: 'Card' });
        for (const card of cards) {
          if (!card.owner) continue;
          const player = this.getObjectByCode(card.owner.code);
          carCard.moveToTarget(player.decks[card.group]); // card.group == (car || service)
        }
        if (this.roundStepWinner) this.deleteDeck(this.selectedSaleDeck);

        this.set({ roundStep: 'CHECK_SALES' });
        this.run('endRound');
      }
      break;

    // case 'REPLACE_CLIENT':
    //   {
    //     this.logs(`Произошла замена клиента.`);

    //     this.clientReplacedCard = this.clientCard;
    //     this.clientCard = this.getObjectByCode('Deck[card_client]').getRandomItem();

    //     if (!this.clientCard) {
    //       this.logs(`В колоде закончились карты клиентов.`);
    //       return this.checkWinnerAndFinishGame();
    //     }

    //     this.clientCard.moveToTarget(this.getObjectByCode('Deck[card_zone_client_dop]'));
    //     for (const player of players) player.returnTableCardsToHand();
    //     this.showTableCards();

    //     this.activatePlayers({ publishText: 'Клиент поменялся, вы можете сделать новое предложение.' });
    //     this.set({ roundStep: 'FIRST_OFFER' });
    //     lib.timers.timerRestart(this);
    //   }
    //   break;
    // case 'FIRST_OFFER':
    //   {
    //     this.showTableCards();

    //     const { player, carTitle } = selectBestOffer.call(this);
    //     if (!player) {
    //       this.logs(`Клиента не устроило ни одно из предложений.`);

    //       this.set({ roundStep: 'SHOW_RESULTS' });
    //       this.run('endRound');
    //     } else {
    //       this.roundStepWinner = player;
    //       this.logs(`Клиента заинтересовал автомобиль "${carTitle}".`);

    //       // у всех карт, выложенных на стол, убираем возможность возврата карты в руку
    //       for (const deck of player.getObjects({ className: 'Deck', attr: { placement: 'table' } })) {
    //         for (const card of deck.getObjects({ className: 'Card' })) {
    //           card.activeEvent.set({ canPlay: false });
    //           // card.activeEvent.emit('RESET');
    //         }
    //       }

    //       try {
    //         this.featureCard.play({ player });
    //       } catch (err) {
    //         if (!err.message.includes('event not found')) throw err;
    //       }

    //       this.set({ roundStep: 'PRESENT' });
    //       if (player.activeEvent?.present) {
    //         this.logs(`Происходит выбор подарка клиенту.`);
    //         player.activate();
    //         lib.timers.timerRestart(this, { time: timer.PRESENT });
    //       } else {
    //         this.run('endRound');
    //       }
    //     }
    //   }
    //   break;
    // case 'PRESENT':
    //   {
    //     this.roundStepWinner.activate({
    //       publishText: 'Добавьте в сделку нужное вам количество сервисов (не превышающее в сумме стоимость авто).',
    //     });
    //     this.set({ roundStep: 'SECOND_OFFER' });
    //     this.logs(`Начались продажи дополнительных сервисов клиенту.`);
    //     lib.timers.timerRestart(this, { time: timer.SECOND_OFFER });
    //   }
    //   break;
    // case 'SECOND_OFFER':
    //   {
    //     const player = this.roundStepWinner;

    //     // рассчитываем предложение клиенту заново (с учетом добавленных сервисов)
    //     const { fullPrice, carTitle } = calcOffer.call(this, player);
    //     if (fullPrice <= this.clientMoney) {
    //       this.logs(
    //         `Клиент приобрел автомобиль "${carTitle}" и сервисы за ${new Intl.NumberFormat().format(
    //           (fullPrice || 0) * 1000
    //         )}₽.`
    //       );

    //       const money = player.money + fullPrice;
    //       player.set({ money });

    //       if (money >= this.settings.winMoneySum) {
    //         return this.endGame({ winningPlayer: player });
    //       }
    //     } else {
    //       this.logs(`Клиент отказался от сделки из-за превышения допустимой стоимости сервисов.`);
    //       delete this.roundStepWinner;
    //     }

    //     this.set({ roundStep: 'SHOW_RESULTS' });
    //     this.run('endRound');
    //   }
    //   break;
    // case 'SHOW_RESULTS':
    //   {
    //     const emptyClientDeck = this.getObjectByCode('Deck[card_client]').itemsCount() === 0;
    //     const emptyFeatureDeck = this.getObjectByCode('Deck[card_feature]').itemsCount() === 0;
    //     if (emptyClientDeck || emptyFeatureDeck) {
    //       this.logs(`В колоде закончились карты ${emptyClientDeck ? 'клиентов' : 'сервисов'}.`);
    //       return this.checkWinnerAndFinishGame();
    //     }

    //     this.restorePlayersHands();
    //     this.removeTableCards();

    //     if (this.featureCard.reference && this.roundStepWinner) {
    //       // дополнительный клиент
    //       for (const player of players) {
    //         if (player !== this.roundStepWinner) {
    //           // player.set({ eventData: { skipRound: { [this.round + 1]: true } } });
    //           player.initEvent('skipRound');
    //         }
    //       }
    //     } else {
    //       this.addNewRoundCardsToPlayers();

    //       if (!this.checkPlayersReady()) {
    //         // событие удаления лишних карт (хотя бы у одного из игроков)
    //         lib.timers.timerRestart(this, { time: timer.CARD_DROP });
    //       } else {
    //         lib.timers.timerRestart(this, { time: timer.SHOW_RESULTS });
    //       }
    //     }
    //     this.set({ roundStep: 'ROUND_END' });
    //     this.run('endRound');
    //   }
    //   break;
    // case 'ROUND_END':
    //   {
    //     this.clearEvents(); // чтобы очистить события возврата карт, взятых в руку
    //     this.set({ roundStep: 'ROUND_START', roundStepWinner: null });
    //     this.run('endRound');
    //   }
    //   break;
  }

  function initAuctionBidStep({ bidSum, player }) {
    this.set({ bidSum, roundStep: 'AUCTION_BID' });
    this.currentPlayer = player; // ссылки на объекты ставятся нативно, а не через set({})
    player.activate({
      publishText: 'Делайте вашу ставку',
      setData: { activeEvent: { roundBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  }
  function initSalesOffersStep({ player }) {
    const salesDecks = this.getObjects({ className: 'Deck', attr: { subtype: 'sales' } });
    for (const deck of salesDecks) {
      deck.set({ activeEvent: null });
      const [clientCard] = deck.getObjects({ className: 'Card', attr: { group: 'client' } });
      clientCard.initEvent('selectClientToSale', { player });
    }

    player.decks.car.set({ activeEvent: { playDisabled: true } });
    player.decks.service.set({ activeEvent: { playDisabled: true } });

    this.set({ roundStep: 'SALES_OFFERS' });
    if (this.selectedSaleDeck) delete this.selectedSaleDeck;
    this.currentPlayer = player;
    player.activate({
      publishText: 'Выберите клиента, которому хотите сделать предложение',
      setData: { activeEvent: { roundBtn: { label: 'Подтвердить выбор' } } },
    });
    lib.timers.timerRestart(this);
  }

  function calcAuction(player) {
    const priceMods = [];
    const [serviceDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'service_played' } });
    for (const card of serviceDeck.getObjects({ className: 'Card' })) {
      priceMods.push(card.price);
    }
    const carPrice = this.carCard.price;
    const fullPrice = priceMods.reduce((price, mod) => {
      if (mod.at(-1) === '%') return price + carPrice * (parseInt(mod) / 100);
      return price + parseInt(mod);
    }, 0);
    return fullPrice;
  }
  function selectBestOffer(offersMap) {
    const { clientCard, clientMoney, featureCard } = this;
    const offers = [];

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
        offer.stars >= clientCard.stars &&
        (clientCard.priceGroup === '*' || offer.priceGroup.find((group) => clientCard.priceGroup.includes(group)))
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
  }
});
