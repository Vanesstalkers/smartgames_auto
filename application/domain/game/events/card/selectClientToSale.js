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
        // у game много TRIGGER-событий - все лишние сбрасываем, а одно выбранное обрабатываем
        this.emit('RESET');

        if (target === card) {
          const selectedSaleDeck = card.parent();
          selectedSaleDeck.set({ activeEvent: { currentSale: true } });
          game.selectedSaleDeck = selectedSaleDeck;
          game.run('endRound', {}, player);
        }
      },
      ROUND_END: function () {
        this.emit('RESET');
      },
    },
  });
