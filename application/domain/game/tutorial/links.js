({
  steps: {
    gameControls: {
      pos: 'bottom-left',
      text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в верхнем левом углу экрана.',
      active: '.gameplane-controls',
    },
    planeControls: {
      pos: 'bottom-left',
      text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в верхнем левом углу экрана.',
      active: '.gameplane-controls',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $controls = $rootEl.querySelector('.gameplane-controls');
          if (!$controls) $rootEl.querySelector('.move.gui-btn')?.click();
        },
      },
      buttons: [{ text: 'Продолжай', step: 'planeControlsMouseLeft' }],
    },
    planeControlsMouseLeft: {
      pos: 'bottom-left',
      text: 'При зажатой левой кнопке мыши можно перемещать игровое поле.',
      img: '/img/tutorial/mouse-left.png',
      buttons: [{ text: 'Продолжай', step: 'planeControlsMouseRight' }],
    },
    planeControlsMouseRight: {
      pos: 'bottom-left',
      text: 'При зажатой правой кнопке мыши можно вращать игровое поле.',
      img: '/img/tutorial/mouse-right.png',
      buttons: [{ text: 'Продолжай', step: 'planeControlsMouseMiddle' }],
    },
    planeControlsMouseMiddle: {
      pos: 'bottom-left',
      text: 'Колесиком мыши можно приближать и удалять игровое поле.',
      img: '/img/tutorial/mouse-middle.png',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    handCards: {
      pos: 'top-right',
      text: 'TO_CHANGE',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Продолжай', step: 'handCardsEvents' }],
    },
    handCardsEvents: {
      pos: 'top-right',
      text: 'TO_CHANGE',
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    cardActive: {
      pos: 'bottom-left',
      text: 'TO_CHANGE',
      active: '[code="Deck[card_active]"]',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
    leaveGame: {
      pos: 'top-left',
      text: 'Для выхода из игры необходимо нажать эту кнопку, либо выбрать соответствующий пункт в меню.',
      active: '.leave-game-btn',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
