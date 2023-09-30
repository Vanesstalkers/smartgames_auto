() => ({
  TO_CHANGE: {
    ...{ title: 'TO_CHANGE', icon: ['fas', 'user'] },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
      },
    },
    itemsDefault: {
      singlePlayer: true,
      timer: 60,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          active: true,
          deckList: [{ type: 'card', itemType: 'event' }],
        },
      ],
      deckList: [
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
});
