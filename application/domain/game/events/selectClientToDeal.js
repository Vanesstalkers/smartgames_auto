() => ({
  init() {
    const { game, player } = this.eventContext();
    const dealDecks = game.select({ className: 'Deck', attr: { subtype: 'deal' } });

    for (const deck of dealDecks) {
      if (
        deck.eventData.referencePlayerId && // эксклюзивный клиент
        deck.eventData.referencePlayerId !== player.id()
      )
        continue;

      const [clientCard] = deck.select({ className: 'Card', attr: { group: 'client' } });
      clientCard.set({
        eventData: {
          playDisabled: null,
          buttonText: 'Выбрать', // текст кнопки на карте
          activeEvents: [this],
        },
      });
    }
  },
  handlers: {
    RESET() {
      const { game } = this.eventContext();
      const dealDecks = game.select({ className: 'Deck', attr: { subtype: 'deal' } });

      for (const deck of dealDecks) {
        const [clientCard] = deck.select({ className: 'Card', attr: { group: 'client' } });
        clientCard.set({ eventData: { playDisabled: true, buttonText: null } });
        clientCard.removeEvent(this);
      }

      this.destroy();
    },
    TRIGGER({ target: clientCard }) {
      const { game } = this.eventContext();
      const round = game.rounds[game.round];
      const deck = clientCard.parent();

      if (round.selectedDealDeck) {
        // ранее выбранный клиент
        round.selectedDealDeck.set({ eventData: { currentDeal: null } });
        clientCard.set({ eventData: { buttonText: 'Выбрать' } });
      }
      if (round.selectedDealDeck === deck) {
        delete round.selectedDealDeck;
      } else {
        round.selectedDealDeck = deck;
        deck.set({ eventData: { currentDeal: true } });
        clientCard.set({ eventData: { buttonText: 'Отмена' } });
      }
      return { preventListenerRemove: true };
    },
    OFFER_READY() {
      this.emit('RESET');
    },
  },
});
