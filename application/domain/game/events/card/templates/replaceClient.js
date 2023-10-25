() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();
      game.addEvent(this);

      game.clientCardNew = game.decks.client.getRandomItem();
      game.clientCardNew.set({
        visible: true,
        eventData: { replacedClient: game.clientCard.id(), playDisabled: true },
      });
      game.selectedDealDeck.addItem(game.clientCardNew);
      game.selectedDealDeck.clientCard = game.clientCardNew; // используется только в selectClientToDeal для настроек визуализации

      game.logs(
        `Произошла замена клиента. Расчет сделки ведется исходя из бюджета "${game.clientCard.title}", но по требованиям "${game.clientCardNew.title}".`
      );

      this.emit('RESET');
    },
    handlers: {
      RESET: function () {
        const { game, player, source: card, sourceId } = this.eventContext();

        game.removeEvent(this);
        card.removeEvent(this);

        game.removeAllEventListeners({ sourceId });
      },
    },
  });
