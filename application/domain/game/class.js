(class Game extends lib.game.class() {
  constructor() {
    super();
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });
    // this.preventSaveFields([]);

    this.defaultClasses({
      Player: domain.game.objects.Player,
      Card: domain.game.objects.Card,
    });
  }

  fillData(data, { newGame } = {}) {
    if (data.store) this.store = data.store;
    this.logs(data.logs);
    this.deckType = data.deckType;
    this.gameType = data.gameType;
    this.gameConfig = data.gameConfig;
    this.gameTimer = data.gameTimer;
    this.addTime = data.addTime;
    this.settings = data.settings;
    this.status = data.status || 'WAIT_FOR_PLAYERS';
    this.round = data.round || 0;
    if (data.activeEvent) this.activeEvent = data.activeEvent;
    this.availablePorts = data.availablePorts || [];

    const { configs } = domain.game;
    const { Card: deckItemClass } = this.defaultClasses();

    if (data.playerMap) {
      data.playerList = [];
      for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
    } else {
      data.playerList = data.settings.playerList;
    }
    for (const item of data.playerList || []) this.run('addPlayer', item);

    if (data.deckMap) {
      data.deckList = [];
      for (const _id of Object.keys(data.deckMap)) data.deckList.push(this.store.deck[_id]);
    } else {
      data.deckList = data.settings.deckList;
    }
    for (const item of data.deckList || []) {
      if (item.access === 'all') item.access = this.playerMap;
      const deck = this.addDeck(item, { deckItemClass });

      if (newGame) {
        // const cardsToRemove = this.settings.cardsToRemove || [];
        const items = lib.utils.structuredClone(configs.cards().filter(({ group }) => group === deck.subtype));
        for (const item of items) deck.addItem(item);
      }
    }

    this.clearChanges(); // игра запишется в БД в store.create
    return this;
  }

  endGame({ winningPlayer, canceledByUser } = {}) {
    super.endGame({ winningPlayer, canceledByUser, customFinalize: true });

    this.broadcastAction('gameFinished', {
      gameId: this.id(),
      gameType: this.deckType,
      playerEndGameStatus: this.playerEndGameStatus,
      fullPrice: winningPlayer?.money,
      roundCount: this.round,
    });

    throw new lib.game.endGameException();

    // TO_CHANGE (если требуется, то ставим customFinalize = true и делаем свой broadcast-формат для 'gameFinished')
  }

  getFullPrice() {
    const baseSum = 1000; // TO_CHANGE (меняем на свою сумму дохода за игру)
    const timerMod = 30 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  /**
   * Проверяет и обновляет статус игры, если это необходимо
   * @throws lib.game.endGameException
   */
  checkStatus({ cause } = {}) {
    const activePlayer = this.getActivePlayer();
    const playerList = this.getObjects({ className: 'Player' });
    switch (this.status) {
      case 'WAIT_FOR_PLAYERS':
        switch (cause) {
          case 'PLAYER_JOIN':
            if (this.getFreePlayerSlot()) return;

            this.set({ status: 'PREPARE_START' });

            if (false) {
              // TO_CHANGE (меняем, если игроки должны что-то делать перед началом игры)
              lib.timers.timerRestart(this);
            } else {
              this.checkStatus({ cause: 'START_GAME' });
            }
            break;
        }
        break;

      case 'PREPARE_START':
        switch (cause) {
          case 'PLAYFIELD_CREATING':
            if (false) {
              // TO_CHANGE (меняем, если игроки должны что-то делать перед началом игры)
              this.changeActivePlayer();
              lib.timers.timerRestart(this);
            } else {
              this.checkStatus({ cause: 'START_GAME' });
            }
            break;

          case 'START_GAME':
            const { playerHand } = this.settings;
            const startDecks = Object.entries(playerHand || {});

            for (let idx = 0; idx < playerList.length; idx++) {
              const player = playerList[idx];

              player.set({ activeReady: true }); // чтобы в endRound пройти проверку checkPlayersReady

              if (startDecks.length) {
                for (const [deckType, { start: count }] of startDecks) {
                  if (typeof count === 'object') {
                    const { customAction, actionData = {} } = count;
                    actionData.idx = idx;
                    if (customAction) this.run(customAction, actionData, player);
                  } else {
                    const playerHand = player.getObjectByCode(`Deck[card_${deckType}]`);
                    const deck = this.getObjectByCode(`Deck[card_${deckType}]`);
                    deck.moveRandomItems({ count, target: playerHand });
                  }
                }
              }
            }

            this.set({ status: 'IN_PROCESS', roundStep: 'ROUND_START' });
            this.run('endRound');
            break;

          case 'PLAYER_TIMER_END':
            // TO_CHANGE (если игроки должны что-то делать перед началом игры, то делаем это)
            this.checkStatus({ cause: 'PLAYFIELD_CREATING' });
            break;
        }
        break;

      case 'IN_PROCESS':
        switch (cause) {
          case 'PLAYER_TIMER_END':
            this.run('endRound', { timerOverdue: true });
            break;
          default:
            this.endGame();
        }
        break;

      case 'FINISHED':
        switch (cause) {
          case 'PLAYER_TIMER_END':
            lib.timers.timerDelete(this);
            break;
        }
        break;
    }
  }

  allowedToPerformAction(player, eventName) {
    const result = {
      success: true,
    };

    if (!this.getActivePlayers().includes(player) && eventName !== 'leaveGame') {
      result.success = false;
      result.errorMessage = 'Игрок не может выполнить это действие, так как сейчас не его ход.';
    } else if (player.eventData.actionsDisabled && eventName !== 'endRound' && eventName !== 'leaveGame') {
      result.success = false;
      result.errorMessage = 'Игрок не может выполнять действия в этот ход.';
    }

    return result;
  }
  async handleAction({ name: actionName, data = {}, sessionUserId: userId }) {
    try {
      const player = this.getPlayerList().find((player) => player.userId === userId);
      if (!player) throw new Error('Player not found');

      const authResult = this.allowedToPerformAction(player, actionName);
      if (!authResult.success) throw new Error(authResult.errorMessage);

      this.run(actionName, data, player);

      await this.saveChanges();
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
        await this.removeGame();
      } else {
        lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'broadcastToSessions', {
          data: { message: exception.message, stack: exception.stack },
        });
      }
    }
  }

  getActivePlayer() {
    return this.getPlayerList().find((player) => player.active);
  }
  getActivePlayers() {
    return this.getPlayerList().filter((player) => player.active);
  }
  checkPlayersReady() {
    for (const player of this.getActivePlayers()) {
      if (!player.activeReady) return false;
    }
    return true;
  }
  onTimerRestart({ timerId, data: { time, extraTime = 0 } = {} }) {
    if (!time) time = this.settings.timer.DEFAULT;

    for (const player of this.getActivePlayers()) {
      if (extraTime) {
        player.set({ timerEndTime: (player.timerEndTime || 0) + extraTime * 1000 });
      } else {
        player.set({ timerEndTime: Date.now() + time * 1000 });
      }
      player.set({ timerUpdateTime: Date.now() });
      if (!player.timerEndTime) throw 'player.timerEndTime === NaN';
    }
  }

  async onTimerTick({ timerId, data: { time = null } = {} }) {
    try {
      for (const player of this.getActivePlayers()) {
        if (!player.timerEndTime) {
          if (this.status === 'FINISHED') {
            // тут некорректное завершение таймера игры
            // остановка таймера должна была отработать в endGame
            // бросать endGameException нельзя, потому что в removeGame будет вызов saveChanges, который попытается сделать broadcastData, но channel к этому моменту будет уже удален
            lib.timers.timerDelete(this);
            return;
          } else throw 'player.timerEndTime === NaN';
        }
        // console.log('setInterval', player.timerEndTime - Date.now()); // временно оставил для отладки (все еще появляются setInterval NaN - отловить не смог)
        if (player.timerEndTime < Date.now()) {
          // !!!!!!!!
          this.checkStatus({ cause: 'PLAYER_TIMER_END' });
          // ???
          await this.saveChanges();
        }
      }
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
        await this.removeGame();
      } else throw exception;
    }
  }
  onTimerDelete({ timerId }) {
    for (const player of this.getActivePlayers()) {
      player.set({
        timerEndTime: null,
        timerUpdateTime: Date.now(),
      });
    }
  }

  checkWinnerAndFinishGame() {
    let winningPlayer = this.getPlayerList().sort((a, b) => (a.money > b.money ? -1 : 1))[0];
    if (winningPlayer.money <= 0) winningPlayer = null;
    return this.endGame({ winningPlayer });
  }

  activatePlayers({ publishText, setData }) {
    for (const player of this.getPlayerList()) {
      if (player.activeEvent?.skipRound) {
        this.logs(`Игрок ${player.userName} пропускает ход`);
        player.set({ activeEvent: null, eventData: { actionsDisabled: true } });
        continue;
      }
      player.activate({ setData, publishText });
    }
  }
  removeTableCards() {
    const cardDeckDrop = this.decks.drop;
    const tableDecks = this.getObjects({ className: 'Deck', attr: { placement: 'table' } });
    for (const deck of tableDecks) {
      deck.moveAllItems({ target: cardDeckDrop }, { visible: false });
    }
  }
  calcClientMoney() {
    const { clientCard, featureCard, creditCard } = this;
    let clientMoney = clientCard.money;
    if (featureCard.money && featureCard.target === 'client') {
      clientMoney += parseInt(featureCard.money);
    }
    clientMoney += clientMoney * (parseInt(creditCard.money) / 100); // у кредита всегда проценты
    this.clientMoney = clientMoney;
  }
  showTableCards() {
    this.decks.zone_credit.setItemVisible(this.creditCard);
    this.decks.zone_feature.setItemVisible(this.featureCard);

    for (const player of this.getPlayerList()) {
      const tableZones = player
        .getObjects({
          className: 'Deck',
        })
        .filter(({ placement }) => placement == 'table');
      for (const zone of tableZones) {
        for (const card of zone.getObjects({ className: 'Card' })) {
          card.activeEvent.set({ canPlay: false });
          zone.setItemVisible(card);
        }
      }
    }
  }

  addNewRoundCardsToPlayers() {
    for (const player of this.getPlayerList()) {
      // добавляем новые карты в руку
      const carCard = this.decks.car.getRandomItem();
      if (carCard) carCard.moveToTarget(player.decks.car);
      const serviceCard = this.decks.service.getRandomItem();
      if (serviceCard) serviceCard.moveToTarget(player.decks.service);

      const carItems = Object.keys(player.decks.car.itemMap);
      const tooManyCardsInHand = carItems.length > this.settings.playerHand.car.limit;
      if (tooManyCardsInHand) player.initEvent('dropCard');
    }
  }

  restorePlayersHands() {
    for (const player of this.getPlayerList()) {
      if (player === this.roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }
});
