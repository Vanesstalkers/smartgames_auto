() => ({
  name: 'present',
  init() {
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
                args: [{ name: 'roundEnd' }],
              })
              .catch(prettyAlert);

            return { exit: true };
          }).toString(),
        },
      },
    });
  },
  handlers: {
    RESET({ skipTurn }) {
      const { game, player, source, sourceId } = this.eventContext();

      player.decks.service.set({ eventData: { playDisabled: true } });
      player.decks.service.updateAllItems({
        eventData: { activeEvents: [], cardClass: null, buttonText: null },
      });

      if (skipTurn) {
        game.logs({ msg: `Игрок {{player}} не стал дарить подарок.`, userId: player.userId });
        player.set({ eventData: { skipTurn: true } });
      }

      lib.store.broadcaster.publishData(`gameuser-${player.userId}`, {
        helper: null,
      });

      this.destroy();
    },
    TRIGGER({ target: card }) {
      const { game, player } = this.eventContext();

      card.set({ eventData: { activeEvents: [], cardClass: null, buttonText: null } });
      card.moveToTarget(game.decks.drop);

      this.emit('RESET');

      game.run('roundEnd', {}, player);
    },

    PRESENT() {
      const { game, player } = this.eventContext();
      const presentNotGiven = player.eventData.activeEvents.find((event) => event === this);
      this.emit('RESET', { skipTurn: presentNotGiven });
    },
  },
});
