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
          this.set({ roundStep: 'SALES_OFFERS' });
          this.run('endRound');
        } else {
          const clientZone = this.getObjectByCode('Deck[card_zone_auction_client]');
          const carZone = this.getObjectByCode('Deck[card_zone_auction_car]');

          this.clientCard = this.getObjectByCode('Deck[card_client]').getRandomItem();
          this.clientCard.moveToTarget(clientZone);
          this.carCard = this.getObjectByCode('Deck[card_car]').getRandomItem();
          this.carCard.moveToTarget(carZone);

          this.set({ bidSum: -1 * (players.length - 1), roundStep: 'AUCTION_BID' });
        }
        this.run('endRound');
      }
      break;
    case 'AUCTION_BID':
      {
        let currentPlayer = this.lastActivePlayer;
        if (!currentPlayer) {
          currentPlayer = players[0];
          this.lastActivePlayer = currentPlayer; // ссылки на объекты ставятся нативно, а не через set({})
          currentPlayer.activate({ publishText: 'Делайте вашу ставку' });
          lib.timers.timerRestart(this);
        } else {
          const nextPlayer = currentPlayer.nextPlayer();
          this.lastActivePlayer = nextPlayer; // ссылки на объекты ставятся нативно, а не через set({})

          let bidSum = calcAuction.call(this, currentPlayer);
          if (bidSum === 0 && this.bidSum < 0) bidSum = this.bidSum + 1;
          if (bidSum > this.bidSum) {
            const playedDeck = currentPlayer.getObjectByCode('Deck[card_service_played]');
            for (const card of playedDeck.getObjects({ className: 'Card' })) {
              card.set({ activeEvent: { playDisabled: true } });
            }

            this.set({ bidSum });
            nextPlayer.activate({ publishText: 'Делайте вашу ставку' });
            lib.timers.timerRestart(this);
          } else {
            const clientSalesDeck = this.addDeck({ type: 'card', subtype: 'sales', placement: 'table' });
            this.clientCard.moveToTarget(clientSalesDeck);
            this.clientCard.set({ visible: true });
            const cardCredit = this.getObjectByCode('Deck[card_credit]');
            cardCredit.getRandomItem().moveToTarget(clientSalesDeck);
            const cardFeature = this.getObjectByCode('Deck[card_feature]');
            cardFeature.getRandomItem().moveToTarget(clientSalesDeck);

            const deckDrop = this.getObjectByCode('Deck[card_drop]');
            if (this.bidSum === 0) {
              this.carCard.moveToTarget(deckDrop);
            } else {
              {
                // winner
                const carDeck = nextPlayer.getObjectByCode('Deck[card_car]');
                this.carCard.moveToTarget(carDeck);

                const serviceDeckPlayed = nextPlayer.getObjectByCode('Deck[card_service_played]');
                serviceDeckPlayed.moveAllItems({ target: deckDrop }, { visible: false }); // !!!! заменить
              }

              {
                // loser
                const serviceDeckPlayed = currentPlayer.getObjectByCode('Deck[card_service_played]');
                const serviceDeckInHand = currentPlayer.getObjectByCode('Deck[card_service]');
                serviceDeckPlayed.moveAllItems(
                  { target: serviceDeckInHand },
                  {
                    visible: false,
                    activeEvent: null,
                  }
                );
              }
            }

            this.set({
              auctionCount: this.auctionCount - 1,
              roundStep: 'AUCTION_START',
            });
            this.run('endRound');
          }
        }
      }
      break;
    case 'SALES_OFFERS':
      {
        const nextPlayer = this.lastActivePlayer.nextPlayer();

        // ???

        nextPlayer.activate({ publishText: 'Делайте ваше предложение клиенту' });
        this.set({ roundStep: 'SALES_OFFERS' });
        lib.timers.timerRestart(this);
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
  // function selectBestOffer() {
  //   const { clientCard, clientMoney } = this;
  //   const offers = [];

  //   for (const player of this.getPlayerList()) {
  //     let offer;
  //     try {
  //       offer = calcOffer.call(this, player);
  //     } catch (err) {
  //       if (err === 'no_car') continue;
  //       else throw err;
  //     }

  //     if (
  //       offer.fullPrice < clientMoney &&
  //       offer.stars >= clientCard.stars &&
  //       (clientCard.priceGroup === '*' || offer.priceGroup.find((group) => clientCard.priceGroup.includes(group)))
  //     ) {
  //       offers.push(offer);
  //     }
  //   }

  //   const bestOffer = { price: clientMoney, stars: 0 };
  //   for (const { player, ...offer } of offers) {
  //     if (bestOffer.stars < offer.stars || (bestOffer.stars == offer.stars && bestOffer.price > offer.fullPrice)) {
  //       bestOffer.carTitle = offer.carTitle;
  //       bestOffer.price = offer.fullPrice;
  //       bestOffer.player = player;
  //       bestOffer.stars = offer.stars;
  //     }
  //   }
  //   return bestOffer;
  // }
  // function calcOffer(player) {
  //   const { featureCard } = this;
  //   const [carDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'car_played' } });
  //   const [carCard] = carDeck.getObjects({ className: 'Card' });
  //   if (!carCard) throw 'no_car';

  //   const offer = { player, carPrice: 0, stars: 0, priceMods: [], priceGroup: [], equip: [] };
  //   offer.carTitle = carCard.title;
  //   offer.carPrice = carCard.price;
  //   offer.stars = carCard.stars;
  //   offer.priceGroup.push(...carCard.priceGroup);
  //   offer.equip.push(...carCard.equip);
  //   if (featureCard.price) offer.priceMods.push(featureCard.price);

  //   const [serviceDeck] = player.getObjects({ className: 'Deck', attr: { subtype: 'service_played' } });
  //   for (const card of serviceDeck.getObjects({ className: 'Card' })) {
  //     const exclusiveEquip = !card.equip || !card.equip.find((equip) => offer.equip.includes(equip));
  //     if (!exclusiveEquip) continue;

  //     if (card.stars) offer.stars += card.stars;
  //     if (card.priceGroup) offer.priceGroup.push(...card.priceGroup);
  //     if (card.equip) offer.equip.push(...card.equip);
  //     offer.priceMods.push(card.price);
  //   }

  //   offer.fullPrice = offer.priceMods.reduce((price, mod) => {
  //     if (mod.at(-1) === '%') return price + offer.carPrice * (parseInt(mod) / 100);
  //     return price + parseInt(mod);
  //   }, offer.carPrice);

  //   return offer;
  // }
});
