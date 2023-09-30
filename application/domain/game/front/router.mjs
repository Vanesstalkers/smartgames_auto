export default {
  path: '/game/TO_CHANGE/:id',
  name: 'TO_CHANGE Game',
  component: function () {
    return import('./Game.vue');
  },
};
