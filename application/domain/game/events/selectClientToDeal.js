() => ({
  init: function () {
    const { game, player, source: deck } = this.eventContext();

    deck.clientCard.set({
      eventData: {
        playDisabled: null,
        buttonText: 'Выбрать', // текст кнопки на карте
        activeEvents: [this],
      },
    });
  },
  handlers: {
    RESET: function () {
      const { game, player, source: deck, sourceId } = this.eventContext();

      deck.clientCard.set({ eventData: { playDisabled: true, buttonText: null } });
      deck.clientCard.removeEvent(this);
      deck.removeEvent(this);

      game.removeAllEventListeners({ event: this });
    },
    TRIGGER: function ({ target }) {
      const { game, player, source: deck } = this.eventContext();

      if (game.selectedDealDeck) {
        // ранее выбранный клиент
        game.selectedDealDeck.set({ eventData: { currentDeal: null } });
        game.selectedDealDeck.clientCard.set({
          eventData: { buttonText: 'Выбрать' },
        });
      }
      if (game.selectedDealDeck === deck) {
        delete game.selectedDealDeck;
      } else {
        game.selectedDealDeck = deck;
        deck.set({ eventData: { currentDeal: true } });
        deck.clientCard.set({
          eventData: { buttonText: 'Отмена' },
        });
      }
      return { preventListenerRemove: true };
    },
    OFFER_READY: function () {
      this.emit('RESET');
    },
  },
});
