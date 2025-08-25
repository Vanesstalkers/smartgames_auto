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
  poker: {
    ...{ title: 'TO_CHANGE', icon: ['fas', 'fa-coins'] },
    items: {
      default: {
        title: 'Стандарт',
        maxPlayersInGame: '2-8',
        minPlayersToStart: 2,
      },
    },
    itemsDefault: {
      timer: (baseTimer) => {
        return {
          DEFAULT: baseTimer,
          SHOW_RESULTS: Math.max(15, Math.ceil(baseTimer / 2)),
        };
      },
      cardsToRemove: [],
      playerHand: {},
      autoFinishAfterRoundsOverdue: 10,
      playerStartMoney: 10000,
      bigBlindSum: 100,

      playerTemplates: {
        default: {
          deckList: [
            { type: 'card', subtype: 'hand' },
            { type: 'card', subtype: 'played', placement: 'table', access: 'all' },
          ],
        },
      },

      playerList: [],
      deckList: [
        { type: 'card', subtype: 'car', placement: 'main', hasDrop: true },
        { type: 'card', subtype: 'service', placement: 'main', hasDrop: true },
        { type: 'card', subtype: 'client', placement: 'main', hasDrop: true },
        { type: 'card', subtype: 'credit', placement: 'main', hasDrop: true },
        { type: 'card', subtype: 'feature', placement: 'main', hasDrop: true },
        { type: 'card', subtype: 'zone_client', placement: 'table' },
        { type: 'card', subtype: 'zone_feature', placement: 'table' },
        { type: 'card', subtype: 'zone_credit', placement: 'table' },
      ],
    },
  },
});
