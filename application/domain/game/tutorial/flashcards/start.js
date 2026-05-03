/* eslint-disable max-len */
(function () {
  return {
    steps: {
      decksList: {
        initialStep: true,
        superPos: true,
        bigControls: true,
        text: 'Выберите колоду',
        buttons: [],
        prepare: ({ step }) => {
          const [{ galleries }] = domain.game.configs.rules();
          step.buttons = galleries.map((deck) => ({
            text: deck.label,
            action: 'TRIGGER',
            selectedDeck: deck.selectGroup,
          }));
        },
        actions: {
          TRIGGER: async ({ clickedButton } = {}) => {
            console.log('TRIGGER game.api.action', clickedButton);
            await api.action
              .call({
                path: 'game.api.action',
                args: [{ name: 'eventTrigger', data: { eventData: { ...clickedButton } } }],
              })
              .catch(prettyAlert);
            return { preventApiCall: true };
          },
        },
      },
      showCard: {
        pos: 'bottom-w100',
        prepare: ({ step, user }) => {
          const game = lib.store('game').get(user.gameId);
          const player = game.roundActivePlayer();
          const card = game.get(player.eventData.shownCardId);
          step.text = card.title;
        },
        buttons: [
          { text: 'Показать карту', action: 'SHOW_CARD', showCard: true },
          { text: 'Дальше', action: 'TRIGGER', nextCard: true },
          { text: 'Закончить игру', action: 'exit' },
        ],
        actions: {
          SHOW_CARD: async ({ $helper, clickedButton } = {}) => {
            $helper.$parent.toggleShownCardFlip();
            await api.action
              .call({
                path: 'game.api.action',
                args: [{ name: 'eventTrigger', data: { eventData: { ...clickedButton } } }],
              })
              .catch(prettyAlert);
            return { preventApiCall: true };
          },
          TRIGGER: async ({ $helper, clickedButton } = {}) => {
            $helper.$parent.closeCardInfo();
            await api.action
              .call({
                path: 'game.api.action',
                args: [{ name: 'eventTrigger', data: { eventData: { ...clickedButton } } }],
              })
              .catch(prettyAlert);
            return { preventApiCall: true };
          },
        },
      },
      showSingleCard: {
        pos: 'bottom-w100',
        prepare: ({ step, user }) => {
          const game = lib.store('game').get(user.gameId);
          const player = game.roundActivePlayer();
          const card = game.get(player.eventData.shownCardId);
          step.text = card.title;
        },
        buttons: [
          { text: 'Показать карту', action: 'SHOW_CARD', showCard: true },
          { text: 'Закрыть', action: 'EXIT' },
        ],
        actions: {
          SHOW_CARD: async ({ $helper, clickedButton } = {}) => {
            $helper.$parent.toggleShownCardFlip();
            return { preventApiCall: true };
          },
          EXIT: async ({ state } = {}) => {
            state.shownCard = null;
            console.log('EXIT showSingleCard', state);
            return { exit: true };
          },
        },
      },
    },
  };
});
