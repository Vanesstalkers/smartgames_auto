() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();

      const carCards = player.decks.car.getObjects({ className: 'Card' });
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

        player.decks.car.updateAllItems({ activeEvent: null });
        player.set({ activeEvent: null });

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target }) {
        const { game, player, source: card } = this.eventContext();
        // проверка на дубли событий ( if (target !== card) {...} ) не нужна, потому что она перекрывается проверкой initPlayers в toggleEventHandlers

        target.moveToTarget(game.decks.drop);
        target.set({ activeEvent: null });

        const carCardItems = Object.keys(player.decks.car.itemMap);
        const count = carCardItems.length - game.settings.playerHand.car.limit;
        if (count <= 0) {
          this.emit('RESET');
          game.run('endRound', {}, player);
        } else {
          return { preventListenerRemove: true };
        }
      },
      ROUND_END: function () {
        const { game, player } = this.eventContext();

        const carCardItems = Object.keys(player.decks.car.itemMap);
        const count = carCardItems.length - game.settings.playerHand.car.limit;
        if (count > 0) {
          player.decks.car.moveRandomItems({ count, target: game.decks.drop });
        }

        this.emit('RESET');
      },
    },
  });
