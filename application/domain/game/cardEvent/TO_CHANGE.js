({
  // TO_CHANGE (этот файл удалить)
  config: {
    playOneTime: true,
  },
  init: function ({ game, player }) {
    // ...
  },
  handlers: {
    resetEvent: function ({ game, player: activePlayer }) {
    },
    eventTrigger: function ({ game, player: activePlayer, targetId: fakeId, targetPlayerId }) {
      this.emit('resetEvent');

      return { timerOverdueOff: true };
    },
    // любое интересующее нас событие (которое добавлено через additionalCardEvents)
    TO_CHANGE: function ({ game, player }) {
      // ...
      if (false) return { saveEvent: true };
      // ...
    },
    endRound: function ({ game, player }) {
      // ...
    },
    timerOverdue: function ({ game, player }) {
      // ...
      this.emit('endRound');
    },
  },
});
