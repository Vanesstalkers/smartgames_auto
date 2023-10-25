() =>
  new lib.game.GameEvent({
    reference: true,
    init: function () {
      const { game, player } = this.eventContext();
      game.addEvent(this);
    },
    handlers: {
      RESET: function () {
        const { game, player, source: card, sourceId } = this.eventContext();

        game.removeEvent(this);
        card.removeEvent(this);

        game.removeAllEventListeners({ sourceId });
      },
      ROUND_START: function () {
        const { game, player } = this.eventContext();

        game.clientCard = game.decks.client.getRandomItem();
        const deck = game.createClientDealDeck();
        deck.set({ eventData: { referencePlayerCode: player.code } });
        game.logs(
          `Игрок ${player.userName} получает возможность эксклюзивной работы с клиентом "${game.clientCard.title}".`
        );

        this.emit('RESET');
      },
    },
  });
