({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `
        Поздравляю, ты начал многопользовательскую партию игры с колодой АВТОБИЗНЕС. Пока ты ждешь подключения других игроков, я готов рассказать об интерфейсе игры.
      `,
      actions: {
        before: ({ $root }) => {
          const skipStep = $root.querySelector('.players .player') ? false : true;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'helloSingle' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    helloSingle: {
      text: `
        Поздравляю, ты начал однопользовательскую партию игры с колодой АВТОБИЗНЕС. Я готов рассказать об интерфейсе игры.
      `,
      superPos: true,
      actions: {
        before: ({ $root }) => {
          const skipStep = $root.querySelector('.players .player') ? true : false;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'deckCard' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    deckCard: {
      text: 'Это счетчик оставшихся в колоде карт.',
      active: { selector: '[code="Deck[card]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'deckCardDrop' }],
    },
    deckCardDrop: {
      text: 'Это счетчик карт в колоде сброса.',
      active: { selector: '[code="Deck[card_drop]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'players' }],
    },
    players: {
      text: 'Это твои противники. Ты можешь увидеть сколько у них карт в руке.',
      actions: {
        before: ({ $root }) => {
          const skipStep = $root.querySelector('.players .player') ? false : true;
          return { skipStep };
        },
      },
      active: { selector: '.players .player .workers' },
      buttons: [{ text: 'Спасибо', step: 'exit' }],
    },
    exit: {
      superPos: true,
      text: `
        В любой момент времени ты можешь снова повторить это обучение. Для этого нажми на мою иконку (в левом верхнем углу) и выбери пункт "Покажи доступные обучения". В открывшемся списке выбери интересующие тебя подсказки.
      `,
      buttons: [{ text: 'Понятно', action: 'exit' }],
    },
  },
});
