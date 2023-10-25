// ! альтернативный обработчик reference-карт (оставил как пример)
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

        game.createClientDealDeck();

        if (game.carCard) game.carCard.moveToTarget(game.decks.drop);
        player.decks.service.updateAllItems({
          eventData: { activeEvents: [] /* , cardClass: null, buttonText: null */ },
        });
        game.removeEvent(this);
        card.removeEvent(this);

        game.removeAllEventListeners({ sourceId });
      },
      INIT: function () {
        const { game, player } = this.eventContext();
        player.decks.service.set({ eventData: { playDisabled: null } });

        const serviceCards = player.decks.service.getObjects({ className: 'Card' });
        for (const card of serviceCards) {
          card.set({ eventData: { activeEvents: [this] } });
        }

        game.clientCard = game.decks.client.getRandomItem();
        game.clientCard.moveToTarget(game.decks.zone_auction_client);
        game.carCard = game.decks.car.getRandomItem();
        game.carCard.moveToTarget(game.decks.zone_auction_car);
      },
      TRIGGER: function ({ target: card }) {
        const { game, player } = this.eventContext();

        card.set({ eventData: { activeEvents: [] } });

        game.logs(
          `Игрок ${player.userName} побеждает в аукционе за автомобиль "${game.carCard.title}" (проводился без соперников).`
        );
        game.carCard.moveToTarget(player.decks.car);
        game.carCard = null; // чтобы в RESET она не попала в decks.drop
        player.decks.service_played.moveAllItems({
          target: game.decks.drop_service,
          setData: { visible: false },
        });

        // RESET произойдет в roundSteps.REFERENCE_CLIENT
        game.run('endRound', {}, player);
      },
    },
  });
