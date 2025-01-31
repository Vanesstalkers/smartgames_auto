() => ({
  present: true,
  init: function () {
    const { game, player, source } = this.eventContext();

    player.decks.car.set({ eventData: { playDisabled: true } });
    player.decks.service.set({ eventData: { playDisabled: null } });

    const serviceCards = player.decks.service.select('Card');
    for (const card of serviceCards) {
      card.set({
        eventData: {
          activeEvents: [this],
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
      const { game, player, source, sourceId } = this.eventContext();

      player.decks.service.set({ eventData: { playDisabled: true } });
      player.decks.service.updateAllItems({
        eventData: { activeEvents: [], cardClass: null, buttonText: null },
      });
      source.removeEvent(this);
      player.removeEvent(this);

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

      game.removeAllEventListeners({ event: this });
    },
    TRIGGER: function ({ target: card }) {
      const { game, player } = this.eventContext();

      card.set({ eventData: { activeEvents: [], cardClass: null, buttonText: null } });
      card.moveToTarget(game.decks.drop);

      this.emit('RESET');

      game.run('endRound', {}, player);
    },

    PRESENT: function () {
      const { game, player } = this.eventContext();
      const eventStillEnabled = player.eventData.activeEvents.find((event) => event === this);
      this.emit('RESET', {
        // подарок не подарен
        skipRound: eventStillEnabled ? true : false,
      });
    },
  },
});
