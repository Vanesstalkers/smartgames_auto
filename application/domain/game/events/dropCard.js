() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();
      const playerCarHand = player.getObjectByCode('Deck[card_car]');
      const carCards = playerCarHand.getObjects({ className: 'Card' });

      this.set({
        eventCards: Object.keys(playerCarHand.itemMap),
      });

      for (const card of carCards) {
        card.set({
          activeEvent: {
            cardClass: 'alert', // дополнительный css-класс карты
            buttonText: 'Сбросить карту', // тест кнопки на карте
          },
        });
      }

      player.activate({
        publishText: `Выберите карты, которые хотите сбросить. В руке должно остаться не больше ${game.settings.playerHand.car.limit} карт авто.`,
      });
    },
    handlers: {
      RESET: function () {
        const { game, player, sourceId } = this.eventContext();
        const playerCarHand = player.getObjectByCode('Deck[card_car]');

        playerCarHand.updateAllItems({ activeEvent: null });
        player.set({ activeEvent: null });

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target: card }) {
        const { game, player } = this.eventContext();
        const dropDeck = game.getObjectByCode('Deck[card_drop]');
        const playerCarHand = player.getObjectByCode('Deck[card_car]');

        card.moveToTarget(dropDeck);
        card.set({ activeEvent: null });

        const count = Object.keys(playerCarHand.itemMap).length - game.settings.playerHand.car.limit;
        if (count <= 0) {
          this.emit('RESET');
          game.run('endRound', {}, player);
        } else {
          return { preventListenerRemove: true };
        }
      },
      ROUND_END: function () {
        const { game, player } = this.eventContext();
        const playerCarHand = player.getObjectByCode('Deck[card_car]');

        const count = Object.keys(playerCarHand.itemMap).length - game.settings.playerHand.car.limit;
        if (count > 0) {
          const dropDeck = game.getObjectByCode('Deck[card_drop]');
          playerCarHand.moveRandomItems({ count, target: dropDeck });
        }

        this.emit('RESET');
      },
    },
  });
