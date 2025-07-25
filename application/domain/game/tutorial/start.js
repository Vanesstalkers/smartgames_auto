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
        { text: 'Продолжай', step: 'deckClient' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    deckClient: {
      text: 'Это счетчик карт, оставшихся в колоде клиентов.',
      active: { selector: '[code="Deck[card_client]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'deckCar' }],
    },
    deckCar: {
      text: 'Это счетчик карт, оставшихся в колоде автомобилей.',
      active: { selector: '[code="Deck[card_car]"]', customClass: 'rounded' },
      buttons: [{ text: 'Дальше', step: 'players' }],
    },
    players: {
      text: 'Это твой противник. Ты можешь увидеть сколько карт у него в руке.',
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
      showMenu: true,
      active: '.helper-guru',
      text: `
        В любой момент времени ты можешь снова повторить это обучение. Для этого нажми на мою иконку (в левом верхнем углу) и выбери пункт "Покажи доступные обучения". В открывшемся списке выбери интересующие тебя подсказки.
      `,
      buttons: [{ text: 'Понятно', action: 'exit' }],
    },
  },
});
