(class Game extends lib.game.class() {
  constructor() {
    super();
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
      ...lib.game.decorators['@hasCardEvents'].decorate({
        additionalCardEvents: {}, // TO_CHANGE (добавить необходимые cardEvents, если требуется)
      }),
    });
    this.preventSaveFields([]); // TO_CHANGE

    // !!! подумать, как лучше это организовать
    this.events({
      handlers: {
        // тут все что вызывается через GameObject.emit(...)
      },
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
    if (data.cardEvents) this.cardEvents = data.cardEvents;
    this.availablePorts = data.availablePorts || [];

    const { configs } = domain.game;
    const {
      objects: { Card },
    } = lib.game;

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
      const deckItemClass = Card;

      if (item.access === 'all') item.access = this.playerMap;
      this.addDeck(item, { deckItemClass });
    }
    if (newGame) {
      const cardsToRemove = this.settings.cardsToRemove || [];
      for (const [deckCode, json] of [
        ['Deck[card]', configs.cards().filter((card) => !cardsToRemove.includes(card.name))],
      ]) {
        const deck = this.getObjectByCode(deckCode);
        const items = lib.utils.structuredClone(json);
        for (const item of items) deck.addItem(item);
      }
    }

    this.clearChanges(); // игра запишется в БД в store.create
    return this;
  }

  endGame({ winningPlayer, canceledByUser } = {}) {
    super.endGame({ winningPlayer, canceledByUser, customFinalize: false });

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
            this.set({ status: 'IN_PROCESS' });

            const deck = this.getObjectByCode('Deck[card]');
            for (const player of playerList) {
              const playerHand = player.getObjectByCode('Deck[card]');
              deck.moveRandomItems({ count: this.settings.playerHandStart || 0, target: playerHand });
            }

            this.run('endRound', { forceActivePlayer: playerList[0] });
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
});
