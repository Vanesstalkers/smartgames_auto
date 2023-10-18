() =>
  new lib.game.GameEvent({
    present: true,
    init: function () {
      const { game, player } = this.eventContext();
      const decks = player.getObjects({ className: 'Deck' });
      const carHand = decks.find((deck) => deck.subtype === 'car');
      const serviceHand = decks.find((deck) => deck.subtype === 'service');

      carHand.set({ activeEvent: { playDisabled: true } });

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
        const decks = player.getObjects({ className: 'Deck' });
        const carHand = decks.find((deck) => deck.subtype === 'car');
        const serviceHand = decks.find((deck) => deck.subtype === 'service');

        carHand.set({ activeEvent: null });
        serviceHand.updateAllItems({ activeEvent: null });
        player.set({ activeEvent: null });
        // делаем после обнуления activeEvent, чтобы не удалить событие skipRound
        if (skipRound) {
          game.logs({
            msg: `Игрок {{player}} не стал дарить подарок.`,
            userId: player.userId,
          });
          player.initEvent('skipRound');
        }

        lib.store.broadcaster.publishData(`gameuser-${player.userId}`, {
          helper: null,
        });

        game.removeAllEventListeners({ sourceId });
      },
      TRIGGER: function ({ target: card }) {
        const { game, player } = this.eventContext();

        card.moveToTarget(game.decks.drop);
        card.set({ activeEvent: null });

        this.emit('RESET');

        game.run('endRound', {}, player);
      },

      PRESENT: function () {
        const { game, player } = this.eventContext();
        this.emit('RESET', {
          // подарок не подарен
          skipRound: player.activeEvent ? true : false,
        });
      },
    },
  });
