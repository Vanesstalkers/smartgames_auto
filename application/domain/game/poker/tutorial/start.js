({
  steps: {
    start: {
      initialStep: true,
      superPos: true,
      text: `
        Поздравляю, ты начал партию игры бизнес-покер с колодой АВТОБИЗНЕС. Я готов рассказать об интерфейсе игры.
      `,
      buttons: [
        { text: 'Продолжай', step: 'decks' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    decks: {
      text: `
        Это счетчик карт, оставшихся в колодах (слева направо):
        <a>автомобили</a>, <a>сервисы</a>, <a>клиенты</a>, <a>особенности клиентов</a>, <a>кредиты</a>.
      `,
      active: { selector: '#gameInfo .deck:not(.drop)' },
      buttons: [{ text: 'Дальше', step: 'readyBtn' }],
    },
    readyBtn: {
      text: 'Чтобы начать игру нажми на кнопку "Готов".',
      active: { selector: '.end-round-btn' },
      buttons: [{ text: 'Спасибо', step: 'exit' }],
    },
    exit: {
      superPos: true,
      showMenu: true,
      active: '.helper-guru',
      text: `
        В любой момент времени ты можешь снова повторить это обучение. Для&nbsp;этого нажми на мою иконку (в левом верхнем углу) и выбери пункт "Покажи доступные обучения". В открывшемся списке выбери интересующие тебя подсказки.
      `,
      buttons: [{ text: 'Понятно', action: 'exit' }],
    },
  },
});
