({
  init: function ({ game }) {
    game.set({ activeEvent: { sourceId: this._id } });
    for (const plane of game.getObjects({ className: 'Plane', directParent: game })) {
      if (plane.isCardPlane()) continue;
      plane.set({ activeEvent: { sourceId: this._id } });
    }
  },
  handlers: {
    eventTrigger: function ({ game, target }) {
      if (!target) return;

      const deck = game.getObjectByCode('Deck[domino]');
      for (const dice of target.getObjects({ className: 'Dice' })) {
        dice.moveToTarget(deck);
      }
      target.set({ release: null });

      game.set({ activeEvent: null });
      for (const plane of game.getObjects({ className: 'Plane', directParent: game })) {
        plane.set({ activeEvent: null });
      }
      return { timerOverdueOff: true };
    },
    timerOverdue: function ({ game }) {
      const planes = game.getObjects({ className: 'Plane', directParent: game });
      const target = planes.find((plane) => !plane.isCardPlane());
      this.emit('eventTrigger', { target });
    },
  },
});
