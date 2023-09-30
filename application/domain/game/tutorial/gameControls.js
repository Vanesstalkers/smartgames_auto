({
  steps: {
    gameControls: {
      initialStep: true,
      pos: 'bottom-right',
      text: 'В левом верхнем углу расположены элементы обеспечивающие управления интерфейсом, доступ к игровым логам и чату с другими игроками.',
      active: '.game-controls',
      buttons: [
        { text: 'Продолжай', step: 'planeControls' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    planeControls: {
      pos: 'bottom-right',
      text: 'Вы можете управлять положением и размером игрового поля с помощью кнопок в этом блоке. При нажатии на центральную кнопку блока игровое поле восстановится в базовом масштабе по центру - это может быть полезно, если вы случайно переместили игровое поле за пределы экрана.',
      active: '.move.gui-btn',
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
      pos: 'bottom-right',
      text: 'При зажатой левой кнопке мыши можно перемещать игровое поле.',
      img: '/img/tutorial/mouse-left.png',
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [{ text: 'Продолжай', step: 'planeControlsMouseRight' }],
    },
    planeControlsMouseRight: {
      pos: 'bottom-right',
      text: 'При зажатой правой кнопке мыши можно вращать игровое поле.',
      img: '/img/tutorial/mouse-right.png',
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [{ text: 'Продолжай', step: 'planeControlsMouseMiddle' }],
    },
    planeControlsMouseMiddle: {
      pos: 'bottom-right',
      text: 'Игровое поле можно перемешать.',
      img: '/img/tutorial/touch-move.png',
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          const skipStep = isMobile ? false : true;
          return { skipStep };
        },
      },
      buttons: [{ text: 'Продолжай', step: 'planeControlsTouchMove' }],
    },
    planeControlsTouchMove: {
      pos: 'bottom-right',
      text: 'Также можно менять его масштаб.',
      img: '/img/tutorial/touch-scroll.png',
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          const skipStep = isMobile ? false : true;
          return { skipStep };
        },
      },
      buttons: [{ text: 'Продолжай', step: 'planeControlsTouchScroll' }],
    },
    planeControlsTouchScroll: {
      pos: 'bottom-right',
      text: 'Колесиком мыши можно приближать и удалять игровое поле.',
      img: '/img/tutorial/mouse-middle.png',
      actions: {
        before: (self) => {
          const { isMobile } = self.state;
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [{ text: 'Продолжай', step: 'logs' }],
    },
    logs: {
      pos: 'bottom-right',
      text: 'Центральная кнопка предоставляет доступ к логам текущей игры. В них записываются все значимые события, последовательность которых вы можете в любой момент изучить.',
      active: '.log.gui-btn',
      actions: {
        before: (self) => {
          const $rootEl = self.$root.$el;
          const $controls = $rootEl.querySelector('.gameplane-controls');
          if ($controls) $rootEl.querySelector('.move.gui-btn')?.click();
        },
      },
      buttons: [{ text: 'Продолжай', step: 'chat' }],
    },
    chat: {
      pos: 'bottom-right',
      text: 'Крайняя кнопка слева открывает чат с другими игроками. В списке доступных каналов, помимо личных и общего чата, добавился чат текущей игры.',
      active: '.chat.gui-btn',
      buttons: [{ text: 'Понятно, спасибо', action: 'exit' }],
    },
  },
});
