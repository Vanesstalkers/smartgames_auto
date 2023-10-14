() => ({
  sales: {
    ...{ title: 'Авто-продажи', icon: ['fas', 'cash-register'] },
    items: {
      default: {
        title: 'Стандарт',
      },
    },
    itemsDefault: {
      winMoneySum: 7000,
      cardsToRemove: [],
      playerHand: {
        car: {
          start: 3,
          limit: 5,
        },
        service: {
          start: 3,
        },
      },
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          active: true,
          deckList: [
            { type: 'card', subtype: 'car' },
            { type: 'card', subtype: 'service' },
            { type: 'card', subtype: 'car_played', placement: 'table' },
            { type: 'card', subtype: 'service_played', placement: 'table' },
          ],
        },
        {
          _code: 2,
          active: true,
          deckList: [
            { type: 'card', subtype: 'car' },
            { type: 'card', subtype: 'service' },
            { type: 'card', subtype: 'car_played', placement: 'table' },
            { type: 'card', subtype: 'service_played', placement: 'table' },
          ],
        },
      ],
      deckList: [
        { type: 'card', subtype: 'car', placement: 'main' },
        { type: 'card', subtype: 'service', placement: 'main' },
        { type: 'card', subtype: 'client', placement: 'main' },
        { type: 'card', subtype: 'credit', placement: 'main', cardGroups: ['credit'] },
        { type: 'card', subtype: 'feature', placement: 'main' },
        { type: 'card', subtype: 'drop', placement: 'drop' },
        { type: 'card', subtype: 'zone_client', placement: 'table', access: 'all' },
        { type: 'card', subtype: 'zone_client_dop', placement: 'table', access: 'all' },
        { type: 'card', subtype: 'zone_credit', placement: 'table' },
        { type: 'card', subtype: 'zone_feature', placement: 'table' },
      ],
    },
  },
});
