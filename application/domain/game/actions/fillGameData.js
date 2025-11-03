(function(data) {
  const { configs } = domain.game;
  const { Card: deckItemClass } = this.defaultClasses();

  const newGame = data.newGame;

  if (data.store) this.store = data.store;
  this.logs(data.logs);

  this.deckType = data.deckType;
  this.gameType = data.gameType;
  this.gameConfig = data.gameConfig;
  this.gameTimer = data.gameTimer;
  this.difficulty = data.difficulty;
  this.maxPlayersInGame = data.maxPlayersInGame;
  this.minPlayersToStart = data.minPlayersToStart;
  this.addTime = data.addTime;
  this.settings = data.settings;
  this.status = data.status;
  this.statusLabel = data.statusLabel;
  this.round = data.round || 0;
  this.rounds = data.rounds || {};
  this.prepareRoundObject(this.rounds[this.round]);
  this.roundStep = data.roundStep;
  this.roundStepsMap = data.roundStepsMap || {};
  this.roundActivePlayerId = data.roundActivePlayerId;
  this.cardEvents = data.cardEvents || {};
  this.title = data.title;
  if (!data.templates) data.templates = { card: 'default' };
  this.templates = data.templates || { card: domain.game.configs.cardTemplates.random() };

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
      const cardsToRemove = this.settings.cardsToRemove || [];
      const cardsList = configs.cards().filter((card) => !cardsToRemove.includes(card.name));
      const items = lib.utils.structuredClone(cardsList.filter(({ group }) => group === deck.subtype));
      for (const item of items) deck.addItem({ ...item, subtype: deck.subtype });

      if (item.hasDrop) {
        const dropDeckData = { ...item, subtype: item.subtype + '_drop', placement: 'drop', parentDeckId: deck.id() };
        const dropDeck = this.addDeck(dropDeckData, { deckItemClass });
        deck.set({ dropDeckId: dropDeck.id() });
      }
    }
  }

  this.clearChanges(); // игра запишется в БД в store.create
  return this;
});
