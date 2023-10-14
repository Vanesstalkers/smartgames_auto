() =>
  new lib.game.GameEvent({
    init: function () {
      const { game, player } = this.eventContext();
      const [serviceHand] = player.getObjects({
        className: 'Deck',
        attr: { subtype: 'service' },
      });

      this.present = true;
      this.eventCards = Object.keys(serviceHand.itemMap);
      player.set({ activeEvent: this });

      for (const card of serviceHand.getObjects({ className: 'Card' })) {
        card.set({
          activeEvent: {
            cardClass: 'danger', // дополнительный css-класс карты
            buttonText: 'Подарить', // тест кнопки на карте
          },
        });
      }

      lib.store.broadcaster.publishData(`gameuser-${player.userId}`, {
        helper: {
          text: 'Клиенту пообещали подарок. У вас есть выбор: подарить (один из сервисов на выбор), либо пропустить следующий раунд. При этом вы не можете подарить то оборудование, которое уже установлено на авто.',
          superPos: true,
          hideTime: null,
          buttons: [
            { text: 'Выбрать подарок', action: 'exit' },
            { text: 'Не буду дарить', action: 'cancel' },
          ],
          actions: {
            cancel: (async () => {
              await api.action
                .call({
                  path: 'game.api.action',
                  args: [{ name: 'endRound' }],
                })
                .catch(prettyAlert);

              return { exit: true };
            }).toString(),
          },
        },
      });
    },
    handlers: {
      RESET: function ({ skipRound }) {
        const { game, player, sourceId } = this.eventContext();
        const [playerServiceHand] = player.getObjects({
          className: 'Deck',
          attr: { subtype: 'service' },
        });

        playerServiceHand.updateAllItems({ activeEvent: null });
        player.set({ activeEvent: null, eventData: { skipRound } });
        lib.store.broadcaster.publishData(`gameuser-${player.userId}`, {
          helper: null,
        });

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target: card }) {
        const { game, player } = this.eventContext();
        const dropDeck = game.getObjectByCode('Deck[card_drop]');

        card.moveToTarget(dropDeck);
        card.set({ activeEvent: null });

        this.emit('RESET');

        game.run('endRound', {}, player);
      },

      PRESENT: function () {
        const { game, player } = this.eventContext();
        this.emit('RESET', {
          // подарок не подарен
          skipRound: { [game.round + 1]: player.activeEvent ? true : false },
        });
      },
    },
  });
