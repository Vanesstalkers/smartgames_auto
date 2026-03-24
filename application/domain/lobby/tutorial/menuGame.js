/* eslint-disable max-len */
({
  utils: lib.lobby.tutorial.menuGame.utils,
  steps: {
    ...lib.lobby.tutorial.menuGame.steps,
    settings: {
      ...lib.lobby.tutorial.menuGame.steps.settings,
      buttons: [{ text: 'Дальше', step: 'join' }], // в оригинале - step='teams'
    },
  },
});
