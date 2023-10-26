() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();

      const carCards = player.decks.car.getObjects({ className: 'Card' });
      for (const card of carCards) {
        card.set({
          eventData: {
            activeEvents: [this],
            cardClass: 'alert', // дополнительный css-класс карты
            buttonText: 'Сбросить карту', // тест кнопки на карте
          },
        });
      }
    },
    handlers: {
      RESET: function () {
        const { game, player, source, sourceId } = this.eventContext();

        player.decks.car.updateAllItems({
          eventData: { activeEvents: [], cardClass: null, buttonText: null },
        });
        source.removeEvent(this);

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target }) {
        const { game, player, source: card } = this.eventContext();
        const {
          decks: { drop: dropDeck },
          settings: {
            playerHand: {
              car: { limit: carLimit },
            },
          },
        } = game;

        target.moveToTarget(dropDeck);
        target.set({
          eventData: { cardClass: null, buttonText: null },
        });

        const count = player.decks.car.itemsCount() - carLimit;
        if (count <= 0) {
          this.emit('RESET');
          game.run('endRound', {}, player);
        } else {
          return { preventListenerRemove: true };
        }
      },
      ROUND_END: function () {
        const { game, player } = this.eventContext();
        const {
          decks: { drop: dropDeck },
          settings: {
            playerHand: {
              car: { limit: carLimit },
            },
          },
        } = game;

        const count = player.decks.car.itemsCount() - carLimit;
        if (count > 0) {
          player.decks.car.moveRandomItems({ count, target: dropDeck });
        }

        this.emit('RESET');
      },
    },
  });
