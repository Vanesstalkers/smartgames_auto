export default [
  {
    path: '/game/TO_CHANGE/poker/:id',
    name: 'TO_CHANGE Poker Game',
    component: function () {
      return import('./pokerGame.vue');
    },
  },
  {
  	path: '/game/TO_CHANGE/:type/:id',
  	name: 'TO_CHANGE Game',
    component: function () {
      return import('./Game.vue');
    },
  },
];
