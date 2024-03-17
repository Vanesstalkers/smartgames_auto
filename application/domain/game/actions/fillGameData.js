(function ({ data, newGame }) {
  if (data.store) this.store = data.store;
  this.logs(data.logs);
  this.deckType = data.deckType;
  this.gameType = data.gameType;
  this.gameConfig = data.gameConfig;
  this.gameTimer = data.gameTimer;
  this.addTime = data.addTime;
  this.settings = data.settings;
  this.status = data.status;
  this.statusLabel = data.statusLabel;
  this.round = data.round || 0;
  if (data.cardEvents) this.cardEvents = data.cardEvents;

  const { configs } = domain.game;
  const { Card: deckItemClass } = this.defaultClasses();

  if (data.playerMap) {
    data.playerList = [];
    for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
  } else {
    data.playerList = data.settings.playerList;
  }
  for (const item of data.playerList || []) this.run('addPlayer', item);

  if (newGame) this.run('initPlayerWaitEvents');

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
});
