({
  config: {
    playOneTime: true,
  },
  init: function ({ game, player }) {
    const gameDeck = game.getObjectByCode('Deck[plane]');
    const deck = player.getObjectByCode('Deck[plane]');

    for (let i = 0; i < game.settings.planesToChoosee; i++) {
      const plane = gameDeck.getRandomItem();
      if (plane) plane.moveToTarget(deck);
    }
  },
  handlers: {
    addPlane: function ({ game, player }) {
      const gameDeck = game.getObjectByCode('Deck[plane]');
      const deck = player.getObjectByCode('Deck[plane]');
      const itemIds = Object.keys(deck.itemMap);
      for (const itemId of itemIds) {
        game.getStore().plane[itemId].moveToTarget(gameDeck);
      }
      return { timerOverdueOff: true };
    },
    endRound: function ({ game, player }) {
      if (!game.availablePorts.length) {
        const planeDeck = player.getObjectByCode('Deck[plane]');
        const plane = planeDeck.getObjects({ className: 'Plane' })[0];
        if (plane) game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
      }
      const availablePortConfig = game.availablePorts[0];
      if (availablePortConfig) game.run('putPlaneOnField', availablePortConfig);
      this.emit('addPlane');
    },
    timerOverdue: function ({ game, player }) {
      this.emit('endRound');
    },
  },
});
