(class PokerGame extends domain.game.class {
  constructor() {
    super(...arguments);

    const { Player } = domain.game.poker._objects;
    this.defaultClasses({ Player });
  }

  broadcastDataBeforeHandler(data, config = {}) {
    super.broadcastDataBeforeHandler(data, config);
    if (data.rounds) {
      data.roundData = data.rounds[this.round];
      if (data.roundData._data) {
        data.roundData.bigBlindPlayerId = data.roundData._data.bigBlindPlayer;
        data.roundData.smallBlindPlayerId = data.roundData._data.smallBlindPlayer;
        delete data.roundData._data;
      }
      delete data.rounds;
    }
  }

  getFreePlayerSlot() {
    const playerCount = this.players().length;
    if (this.maxPlayersInGame && playerCount >= this.maxPlayersInGame) return null;

    const player = this.run('addPlayer', {
      ...lib.utils.structuredClone(this.settings.playerTemplates['default']),
      _code: playerCount + 1,
    });

    return player;
  }

  async playerJoin({ userId, userName }) {
    try {
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена');

      const restoredPlayer = this.getPlayerByUserId(userId);
      const player = restoredPlayer || this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');

      const gameId = this.id();
      const playerId = player.id();

      player.set({ userId, userName });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'joinGame', {
        gameId,
        playerId,
        deckType: this.deckType,
        gameType: this.gameType,
        gameStartTutorialName: 'game-poker-tutorial-start',
      });

      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      // инициатором события был установлен первый player в списке, который совпадает с активным игроком на старте игры
      this.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId }, player);

      await this.saveChanges();

      return { playerId };
    } catch (exception) {
      console.error(exception);
      lib.store.broadcaster.publishAction.call(this, `user-${userId}`, 'broadcastToSessions', {
        data: { message: exception.message, stack: exception.stack },
      });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'logout'); // инициирует hideGameIframe
    }
  }

  async playerLeave({ userId, viewerId }) {
    if (this.status !== 'FINISHED' && !viewerId) {
      this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
      try {
        const player = this.getPlayerByUserId(userId);
        this.run('processPlayerLeave', {}, player);

        await this.saveChanges();
      } catch (exception) {
        if (exception instanceof lib.game.endGameException) {
          await this.removeGame();
        } else throw exception;
      }
    }
    lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'leaveGame', {});
  }

  run(actionPath, data, initPlayer) {
    const [actionName, actionDir] = actionPath.split('.').reverse();

    let action;
    if (actionDir) {
      if (actionDir === 'domain') action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    } else {
      action = domain.game.poker.actions?.[actionName];
      if (!action) action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    }

    if (!action) throw new Error(`action "${actionName}" not found`);

    return action.call(this, data, initPlayer);
  }

  calcClientMoney() {
    const { flopCard: clientCard, turnCard: featureCard, riverCard: creditCard } = this.rounds[this.round];
    let clientMoney = clientCard.money;

    if (featureCard.money && featureCard.target === 'client') {
      clientMoney += parseInt(featureCard.money);
    }
    clientMoney *= Math.floor(1000 / parseInt(creditCard.pv)) / 10; // точность до 1 знака после запятой

    return clientMoney;
  }

  selectBestOffer(offersMap) {
    const { flopCard: clientCard, turnCard: featureCard, clientMoney } = this.rounds[this.round];
    const offers = [];

    const { stars, priceGroup } = clientCard;

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
    return { bestOffer, relevantOffers: offers};
  }
});
