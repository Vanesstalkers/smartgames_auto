() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();
      this.set({
        playDisabled: null,
        buttonText: 'Выбрать', // текст кнопки на карте
      });
    },
    handlers: {
      RESET: function () {
        const { game, player, source, sourceId } = this.eventContext();

        source.set({ activeEvent: { playDisabled: true } }, { reset: ['activeEvent'] });

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target }) {
        const { game, player, source: card } = this.eventContext();
        // у game много TRIGGER-событий, проверка нужна, чтобы не инициировать лишние
        if (target !== card) return { preventListenerRemove: true };

        if (target === card) {
          if (game.selectedSaleDeck) game.selectedSaleDeck.set({ activeEvent: null });
          if (this.cancelAction) {
            delete game.selectedSaleDeck;
            this.set({ cancelAction: null, buttonText: 'Выбрать' });
          } else {
            if (game.selectedSaleDeck) {
              const [clientCard] = game.selectedSaleDeck.getObjects({
                className: 'Card',
                attr: { group: 'client' },
              });
              clientCard.set(
                { activeEvent: { cancelAction: null, buttonText: 'Выбрать' } },
                { reset: ['activeEvent'] }
              );
            }
            const selectedSaleDeck = card.parent();
            game.selectedSaleDeck = selectedSaleDeck;
            selectedSaleDeck.set({ activeEvent: { currentSale: true } });
            this.set({ cancelAction: true, buttonText: 'Отмена' });
          }
          return { preventListenerRemove: true };
        }
      },
      SALES_OFFERS: function () {
        this.emit('RESET');
      },
    },
  });
