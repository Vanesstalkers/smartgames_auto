({
  utils: {
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $label = $root.querySelector('.menu-item.game:not(.pinned) label');
      if ($label) $label.click();
      await new Promise((resolve) => setTimeout(resolve, 100)); // ждем отрисовки фронтенда (тут 100, потому что есть анимация)
    },
    async transferToConfigBlock(data) {
      const {
        $root,
        utils,
        state: { isMobile },
      } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      if (isMobile) {
        $root.querySelectorAll('.menu-item.pinned:not(.game) label').forEach(($el) => $el.click());
      } else {
        await utils.showGamesBlock(data);
      }

      const $btn = $root.querySelector('.game-block .select-btn.poker');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async transferToSettingsBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.transferToConfigBlock(data);

      const $btn = $root.querySelector('.game-config-block .select-btn.default');
      if ($btn) $btn.click(); // может не быть, так как для единственного конфига происходит автовыбор
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
  },
  steps: {
    init: {
      initialStep: true,
      text: `
        Данный режим предназначен проведения тимбилдинга в формате карточной игры, напоминающей покер.
        Для получения практики в определении выигрышных комбинаций рекомендуется предварительно сыграть несколько игр против компьютера.
      `,
      actions: { before: async (data) => await data.utils.transferToConfigBlock(data) },
      active: '.game-config-block .select-btn',
      buttons: [
        { text: 'Продолжай', step: 'timer' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    timer: {
      text: `
        Чем меньше таймер, тем сложнее победить. <a>Для первых игр рекомендуется ставить значение не менее 60 секунд на ход</a>.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .timer', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [{ text: 'Продолжай', step: 'rounds' }],
    },
    rounds: {
      text: `
        Через установленное количество раундов игра прекратится и <a>победителем станет игрок с наибольшим количеством денег</a>.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .rounds', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [{ text: 'Дальше', step: 'teams' }],
    },
    teams: {
      text: `
        Игра начнется как только к ней подключатся два игрока, однако <a>в&nbsp;процессе игры могут подключаться новые игроки</a>. Их&nbsp;количество ограничивается данной настройкой.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: {
        selector: '.game-start-block .max-players',
        css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' },
      },
      buttons: [{ text: 'Дальше', step: 'exit' }],
    },
    exit: {
      text: `
        Для начала игры необходимо нажать соответствующую кнопку.
      `,
      active: '.game-start-block .select-btn',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
