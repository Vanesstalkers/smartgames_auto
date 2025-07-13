() => ({
  init() {
    const { game, player, source: deck } = this.eventContext();

    this.clientCard = deck.select({ className: 'Card', attr: { group: 'client' } });

    this.clientCard.set({
      eventData: {
        playDisabled: null,
        buttonText: 'Выбрать', // текст кнопки на карте
        activeEvents: [this],
      },
    });
  },
  handlers: {
    RESET() {
      const { game, player, source: deck, sourceId } = this.eventContext();

      this.clientCard.set({ eventData: { playDisabled: true, buttonText: null } });
      this.clientCard.removeEvent(this);
      deck.removeEvent(this);

      this.destroy();
    },
    TRIGGER({ target }) {
      const { game, player, source: deck } = this.eventContext();
      const round = game.rounds[game.round];

      if (round.selectedDealDeck) {
        // ранее выбранный клиент
        round.selectedDealDeck.set({ eventData: { currentDeal: null } });

        const clientCard = round.selectedDealDeck.select({ className: 'Card', attr: { group: 'client' } });
        clientCard.set({ eventData: { buttonText: 'Выбрать' } });
      }
      if (round.selectedDealDeck === deck) {
        delete round.selectedDealDeck;
      } else {
        round.selectedDealDeck = deck;
        deck.set({ eventData: { currentDeal: true } });

        const clientCard = deck.select({ className: 'Card', attr: { group: 'client' } });
        clientCard.set({ eventData: { buttonText: 'Отмена' } });
      }
      return { preventListenerRemove: true };
    },
    OFFER_READY() {
      this.emit('RESET');
    },
  },
});
