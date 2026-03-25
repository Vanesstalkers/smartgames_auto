({
  utils: {
    ...lib.lobby.tutorial.menuGame.utils,
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $label = $root.querySelector('.menu-item.game:not(.pinned) label');
      if ($label) $label.click();

      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async transferToConfigBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.showGamesBlock(data);

      const $btn = $root.querySelector('.game-block .select-btn.sales');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
    async transferToSettingsBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.transferToConfigBlock(data);

      const $btn = $root.querySelector('.game-config-block .select-btn.ai');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
  },
  steps: {
    // TO_CHANGE (поменять тексты)
    ...lib.lobby.tutorial.menuGame.steps,
    init: {
      initialStep: true,
      text: `
        Колода бизнес-карт АВТОБИЗНЕС позволяет проводить <a>симуляции процессов продажи автомобилей в салонах автодилеров</a>. Доступны несколько типов игр, включая одиночный и командный.
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      buttons: [
        { text: 'Продолжай', step: 'type' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    type: {
      text: `
        Варианты игры:
        
        АВТО-ПРОДАЖИ - самая простая игра <a>друг против друга или&nbsp;против&nbsp;AI</a>
        АВТО-АУКЦИОН - более сложная <a>игра для двоих</a>
        <span style="color: white; font-weight: bold;">БИЗНЕС-ПОКЕР - <a>формат корпоративной игры</a></span>
      `,
      actions: { before: async (data) => await data.utils.showGamesBlock(data) },
      active: '.game-block .select-btn:not(.disabled)',
      buttons: [{ text: 'Продолжай', step: 'config' }],
    },
    config: {
      text: `
        Режим игры позволяет выбрать соперника:
        
        ДУЭЛЬ - <a>живой человек</a>
        ОДИН ИГРОК - <a>искусственный интелект</a>
      `,
      actions: { before: async (data) => await data.utils.transferToConfigBlock(data) },
      active: '.game-config-block .select-btn',
      buttons: [{ text: 'Дальше', step: 'time' }],
    },
    time: {
      text: `
        На сложность игры так же влияет <a>значение&nbsp;таймера,&nbsp;доступного&nbsp;на&nbsp;ход</a>.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .timer', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [{ text: 'Дальше', step: 'ai' }],
    },
    ai: {
      text: `
        В одиночном режиме игры можно выбрать <a>уровень&nbsp;мастерства&nbsp;искусственного&nbsp;интеллекта</a>.
      `,
      actions: {
        before: async (data) => {
          await data.utils.transferToSettingsBlock(data);

          const { $root } = data;
          const $aiBlock = $root.querySelector('.game-start-block .ai-config');
          const skipStep = $aiBlock ? false : { goto: { step: 'exit' } };
          return { skipStep };
        },
      },
      active: {
        selector: '.game-start-block .ai-config',
        css: { boxShadow: 'inset white 0px 0px 10px 4px' },
      },
      buttons: [{ text: 'Дальше', step: 'start' }],
    },
    start: {
      text: `
        Для начала игры необходимо нажать соответствующую кнопку. Еще могу рассказать про список игр, продолжать?
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: '.game-start-block .select-btn',
      buttons: [
        { text: 'Продолжай', step: 'list' }, // step из lib.lobby.tutorial.menuGame
        { text: 'Я разберусь', action: 'exit', exit: true },
      ],
    },
  },
});
