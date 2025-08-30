(function () {
  // TO_CHANGE - все закомментированное

  const {
    rounds,
    round: roundNumber,
    decks,
    settings: { timer, bigBlindSum },
  } = this;
  const round = rounds[roundNumber] || {};
  const { currentPlayer, bigBlindPlayer, smallBlindPlayer: prevSmallBlindPlayer } = round;
  const players = Object.keys(round?.bets || {}).map((id) => this.store.player[id]);
  const result = { newRoundLogEvents: [], newRoundNumber: roundNumber };

  function initBetEvent(player) {
    player.initEvent({
      name: 'betEvent',
      handlers: {
        TRIGGER({ action, amount }) {
          const { game, player } = this.eventContext();
          const round = game.rounds[game.round];
          const playerBet = round.bets[player.id()];

          switch (action) {
            case 'raise':
              game.logs({ msg: `Игрок {{player}} поднял ставку на ${amount}₽.`, userId: player.userId });

              for (const player of game.players()) {
                const bet = round.bets[player.id()];
                if (bet.out) continue;
                bet.ready = false;
              }

              player.bet(amount);
              playerBet.raiseCount++;
              playerBet.ready = true;
              break;
            case 'call':
              game.logs({ msg: `Игрок {{player}} уровнял ставку до ${amount}₽.`, userId: player.userId });
              player.bet(amount);
              playerBet.ready = true;
              break;
            case 'check':
              game.logs({ msg: `Игрок {{player}} пропустил ставку.`, userId: player.userId });
              playerBet.ready = true;
              break;
            case 'reset':
              game.logs({ msg: `Игрок {{player}} сбросил карты.`, userId: player.userId });
              playerBet.ready = true;
              playerBet.out = true;
              break;
          }

          this.emit('RESET');
          game.run('roundEnd', {}, player);
        },
        ROUND_END() {
          const { game, player } = this.eventContext();
          this.emit('TRIGGER', { action: 'check' }, player);
        },
      },
    });
  }
  const getOffersMap = () => {
    const offersMap = {};
    // for (const player of players) {
    //   const productCards = player.decks.played.items().filter((c) => c.subtype === 'product');
    //   if (!productCards.length) continue;

    //   offersMap[productCards[0].id()] = {
    //     player,
    //     productCards,
    //     serviceCards: player.decks.played.items().filter((c) => c.subtype === 'service'),
    //   };
    // }
    return offersMap;
  };

  switch (this.roundStep) {
    case 'ROUND_START': {
      const players = this.players();

      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber });

      const round = this.prepareRoundObject();
      round.step = 'flop';
      round.pot = 0;

      const handCardsCount = players.length < 5 ? 4 : players.length < 7 ? 3 : 2;

      const requiredCardsCount = handCardsCount * players.length;
      // if (decks.car.itemsCount() < requiredCardsCount) decks.car_drop.moveAllItems({ toDeck: true });
      // if (decks.service.itemsCount() < requiredCardsCount) decks.service_drop.moveAllItems({ toDeck: true });

      // if (decks.client.itemsCount() === 0) decks.client_drop.moveAllItems({ toDeck: true });
      // if (decks.feature.itemsCount() === 0) decks.feature_drop.moveAllItems({ toDeck: true });
      // if (decks.credit.itemsCount() === 0) decks.credit_drop.moveAllItems({ toDeck: true });

      round.bets = {};
      for (const player of players) {
        round.bets[player.id()] = { amount: 0, raiseCount: 0 };

        if (player.money < bigBlindSum) {
          round.bets[player.id()].out = true;
          continue;
        }

        const moveConfig = {
          count: handCardsCount,
          target: player.decks.hand,
          setData: { eventData: { playDisabled: true } },
        };
        // decks.car.moveRandomItems(moveConfig);
        // decks.service.moveRandomItems(moveConfig);
      }

      round.smallBlindPlayer = prevSmallBlindPlayer ? prevSmallBlindPlayer.nextPlayer() : players[0];
      if (round.smallBlindPlayer === prevSmallBlindPlayer) {
        return this.run('endGame', { winningPlayer: currentPlayer });
      }
      round.smallBlindPlayer.bet(bigBlindSum / 2);
      round.bigBlindPlayer = round.smallBlindPlayer.nextPlayer();
      round.bigBlindPlayer.bet(bigBlindSum);
      round.currentPlayer = round.bigBlindPlayer.nextPlayer();

      // round.clientCard = decks.client.getRandomItem();
      // round.clientCard.moveToTarget(decks.zone_client, { setVisible: true });
      // round.featureCard = decks.feature.getRandomItem();
      // round.featureCard.moveToTarget(decks.zone_feature);
      // round.creditCard = decks.credit.getRandomItem();
      // round.creditCard.moveToTarget(decks.zone_credit);

      round.currentPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });
      initBetEvent(round.currentPlayer);

      result.statusLabel = `Раунд ${result.newRoundNumber} (Префлоп)`;
      result.roundStep = 'BET';
      return result;
    }
    case 'BET': {
      // const { zone_client: clientZone, zone_feature: featureZone, zone_credit: creditZone } = decks;

      const remainingPlayersInRound = players.filter((p) => !round.bets[p.id()]?.out);
      if (remainingPlayersInRound.length === 1) {
        round.roundStepWinner = remainingPlayersInRound[0];
        result.roundStep = 'SHOW_RESULTS';
        return { ...result, forcedEndRound: true };
      }

      const allPlayersReady = players.every((_) => {
        const roundBet = round.bets[_.id()] || {};
        return roundBet.ready || roundBet.out;
      });
      if (allPlayersReady) {
        switch (round.step) {
          case 'flop':
            // featureZone.setItemVisible(round.featureCard);
            round.step = 'turn';
            break;

          case 'turn':
            // creditZone.setItemVisible(round.creditCard);
            round.step = 'river';
            break;

          case 'river':
            const offersMap = {};
            for (const player of players) {
              // Object.assign(offersMap, player.getAvailableOffers({ clientCard: round.clientCard }));
            }

            // const { bestOffer, relevantOffers } = this.run('selectBestOffer', { offersMap: getOffersMap() });
            // const { player: winner, carCard, serviceCards, price } = bestOffer;

            // if (winner) {
            //   round.roundStepWinner = winner;

            //   carCard.moveToTarget(winner.decks.played);
            //   winner.decks.played.setItemVisible(carCard);
            //   for (const card of serviceCards) {
            //     card.moveToTarget(winner.decks.played);
            //     winner.decks.played.setItemVisible(card);
            //   }
            // }

            result.roundStep = 'SHOW_RESULTS';
            break;
        }

        for (const player of players) {
          const bet = round.bets[player.id()];
          if (bet.out) continue;
          bet.ready = false;
        }

        return { ...result, forcedEndRound: true };
      }

      const nextPlayer = currentPlayer.nextPlayer();
      round.currentPlayer = nextPlayer;

      nextPlayer.activate({
        notifyUser: 'Сделай свою ставку',
        setData: { eventData: { controlBtn: { triggerEvent: true } } },
      });
      initBetEvent(round.currentPlayer);

      result.statusLabel = `Раунд ${result.newRoundNumber} (ставка игрока ${nextPlayer.userName})`;
      result.roundStep = 'BET';

      return { ...result };
    }

    case 'SHOW_RESULTS': {
      const winner = round.roundStepWinner;
      if (winner) {
        result.newRoundLogEvents.push({
          msg: `Игрок {{player}} забирает банк в размере ${round.pot}₽.`,
          userId: winner.userId,
        });
        winner.set({ money: winner.money + round.pot });
      } else {
        const playersInGame = players.filter((p) => !p.out);
        const sharedPot = Math.floor(round.pot / playersInGame.length / 5) * 5;
        for (const player of playersInGame) {
          player.set({ money: player.money + sharedPot });
        }
      }

      this.activatePlayers({
        setData: { eventData: { playDisabled: true, controlBtn: { label: 'Завершить раунд', triggerEvent: null } } },
        disableSkipTurnCheck: true,
      });
      result.roundStep = 'ROUND_END';
      return { ...result, timerRestart: timer.SHOW_RESULTS };
    }

    case 'ROUND_END': {
      // const { clientCard, featureCard, creditCard } = round;

      // clientCard.moveToDrop();
      // featureCard.moveToDrop();
      // creditCard.moveToDrop();

      for (const player of players) {
        player.decks.hand.moveAllItems({ toDrop: true });
        player.decks.played.moveAllItems({ toDrop: true });
      }

      round.roundStepWinner = null;

      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
