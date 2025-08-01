() => ({
  name: 'dropCard',
  init() {
    const { game, player } = this.eventContext();

    const carCards = player.decks.car.select('Card');
    for (const card of carCards) {
      card.set({
        eventData: {
          activeEvents: [this],
          cardClass: 'alert', // дополнительный css-класс карты
          buttonText: 'Сбросить карту', // тест кнопки на карте
        },
      });
    }
    const serviceCards = player.decks.service.select('Card');
    for (const card of serviceCards) {
      card.set({ eventData: { playDisabled: true } });
    }
  },
  handlers: {
    RESET() {
      const { game, player, source, sourceId } = this.eventContext();

      player.decks.service.updateAllItems({ eventData: { playDisabled: null } });
      player.decks.car.updateAllItems({
        eventData: { activeEvents: [], cardClass: null, buttonText: null },
      });

      this.destroy();
    },
    TRIGGER({ target }) {
      const { game, player } = this.eventContext();
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
        game.run('roundEnd', {}, player);
      } else {
        return { preventListenerRemove: true };
      }
    },
    ROUND_END() {
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
