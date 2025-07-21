() => ({
  init() {
    const { game, player, source: deck } = this.eventContext();
    const { replacedClientDeal } = game.rounds[game.round];

    const dealDecks = replacedClientDeal
      ? [replacedClientDeal]
      : game.select({ className: 'Deck', attr: { subtype: 'deal' } });

    for (const deck of dealDecks) {
      if (
        deck.eventData.referencePlayerId && // эксклюзивный клиент
        deck.eventData.referencePlayerId !== player.id()
      )
        continue;

      const clientCard = deck.select({ className: 'Card', attr: { group: 'client' } })[0];
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
      const { game, player, source: deck, sourceId } = this.eventContext();
      const round = game.rounds[game.round];

      round.clientCard.set({ eventData: { playDisabled: true, buttonText: null } });
      round.clientCard.removeEvent(this);
      deck.removeEvent(this);

      this.destroy();
    },
    TRIGGER({ target: clientCard }) {
      const { game, player } = this.eventContext();
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
