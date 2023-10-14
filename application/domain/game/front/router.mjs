export default {
  path: '/game/auto/:id',
  name: 'Auto Game',
  component: function () {
    return import('./Game.vue');
  },
};
