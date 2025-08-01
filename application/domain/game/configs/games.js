() => ({
  sales: {
    ...{ title: 'Авто-продажи', icon: ['fas', 'cash-register'] },
    items: {
      default: {
        title: 'Дуэль',
      },
      ai: {
        title: 'Один игрок',
        difficulty: [
          { code: 'weak', title: 'Слабый' },
          { code: 'strong', title: 'Сильный' },
        ],
      },
      // добавить два уровня сложности: с подсказками (расчет текущей суммы сделки) и без них
    },
    itemsDefault: {
      timer: (baseTimer) => {
        return {
          DEFAULT: baseTimer,
          SECOND_OFFER: Math.ceil(baseTimer / 2),
          PRESENT: Math.ceil(baseTimer / 3),
          SHOW_RESULTS: Math.max(5, Math.ceil(baseTimer / 5)),
          CARD_DROP: Math.max(5, Math.ceil(baseTimer / 5)),
        };
      },
      winMoneySum: 15000,
      cardsToRemove: [],
      playerHand: {
        car: {
          start: 3,
          limit: 3,
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
        { type: 'card', subtype: 'credit', placement: 'main' },
        { type: 'card', subtype: 'feature', placement: 'main' },
        { type: 'card', subtype: 'drop', placement: 'drop' },
        { type: 'card', subtype: 'zone_client', placement: 'table', access: 'all' },
        { type: 'card', subtype: 'zone_client_dop', placement: 'table', access: 'all' },
        { type: 'card', subtype: 'zone_credit', placement: 'table' },
        { type: 'card', subtype: 'zone_feature', placement: 'table' },
      ],
    },
  },
  auction: {
    ...{ title: 'Авто-аукцион', icon: ['fas', 'cash-register'] },
    items: {
      default: {
        title: 'Стандарт',
      },
      ai: {
        title: 'Один игрок',
        difficulty: [
          { code: 'weak', title: 'Слабый' },
          { code: 'strong', title: 'Сильный' },
        ],
      },
      // добавить два уровня сложности: с подсказками (расчет текущей суммы сделки) и без них
    },
    itemsDefault: {
      timer: (baseTimer) => {
        return {
          DEFAULT: baseTimer,
          SECOND_OFFER: Math.ceil(baseTimer / 2),
          PRESENT: Math.ceil(baseTimer / 3),
          SHOW_RESULTS: Math.max(5, Math.ceil(baseTimer / 5)),
          // CARD_DROP: Math.max(5, Math.ceil(baseTimer / 5)),
        };
      },
      auctionsPerRound: 4,
      winMoneySum: 15000,
      cardsToRemove: [],
      playerHand: {
        service: {
          start: {
            customAction: 'fillStartHandWithServices',
          },
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
        { type: 'card', subtype: 'credit', placement: 'main' },
        { type: 'card', subtype: 'feature', placement: 'main' },
        { type: 'card', subtype: 'drop', placement: 'drop' },
        { type: 'card', subtype: 'drop_service', placement: 'drop' },
        { type: 'card', subtype: 'zone_auction_client', placement: 'table', access: 'all' },
        { type: 'card', subtype: 'zone_auction_car', placement: 'table', access: 'all' },
      ],
    },
  },
  poker: {
    ...{ title: 'Бизнес-покер', icon: ['fas', 'fa-coins'] },
    items: {
      default: {
        title: 'Стандарт',
      },
    },
    itemsDefault: {
      timer: (baseTimer) => {
        return {
          DEFAULT: baseTimer,
          SHOW_RESULTS: Math.max(15, Math.ceil(baseTimer / 2)),
        };
      },
      cardsToRemove: [
        'for_work',
        'for_present',
        'reference1',
        'reference2',
        'present',
        'problem1',
        'problem2',
        'downer',
      ],
      playerHand: {},
      autoFinishAfterRoundsOverdue: 10,

      playerTemplates: {
        default: {
          deckList: [
            { type: 'card', subtype: 'car' },
            { type: 'card', subtype: 'service' },
          ],
        },
      },

      playerList: [],
      deckList: [
        { type: 'card', subtype: 'car', placement: 'main' },
        { type: 'card', subtype: 'service', placement: 'main' },
        { type: 'card', subtype: 'client', placement: 'main' },
        { type: 'card', subtype: 'credit', placement: 'main' },
        { type: 'card', subtype: 'feature', placement: 'main' },
        { type: 'card', subtype: 'drop', placement: 'drop' },
        { type: 'card', subtype: 'zone_flop', placement: 'table' },
        { type: 'card', subtype: 'zone_turn', placement: 'table' },
        { type: 'card', subtype: 'zone_river', placement: 'table' },
      ],
    },
  },
});
