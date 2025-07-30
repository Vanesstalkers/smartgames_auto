export default [
  {
    path: '/game/auto/poker/:id',
    name: 'Auto Poker Game',
    component: function () {
      return import('./pokerGame.vue');
    },
  },
  {
    path: '/game/auto/:type/:id',
    name: 'Auto Game',
    component: function () {
      return import('./Game.vue');
    },
  },
];
