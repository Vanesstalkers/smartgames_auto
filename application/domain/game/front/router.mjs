export default {
  path: '/game/auto/:type/:id',
  name: 'Auto Game',
  component: function () {
    return import('./Game.vue');
  },
};
