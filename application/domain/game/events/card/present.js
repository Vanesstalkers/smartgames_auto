({ name = 'present', message = 'Клиенту пообещали подарок.' } = {}) => ({
  name,
  present: true,
  data: {
    dialogMessage: message,
  },
  init() {
    const { game, player, source } = this.eventContext();

    this.presentNotGiven = true;

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
        text: `
          ${this.data.dialogMessage} У тебя есть выбор: подарить (один из сервисов на выбор), либо пропустить следующий раунд. 
          При этом <a>нельзя дарить оборудование, которое уже установлено на авто</a>.
        `,
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
    RESET() {
      const { game, player } = this.eventContext();

      player.decks.service.set({ eventData: { playDisabled: true } });
      player.decks.service.updateAllItems({
        eventData: { activeEvents: [], cardClass: null, buttonText: null },
      });

      if (this.presentNotGiven) {
        game.logs({ msg: `Игрок {{player}} не стал дарить подарок и пропускает следующий ход.`, userId: player.userId });
        player.set({ eventData: { skipTurn: true } });
      }

      lib.store.broadcaster.publishData(`gameuser-${player.userId}`, {
        helper: null,
      });

      this.destroy();
    },
    TRIGGER({ target: card }) {
      const { game, player } = this.eventContext();

      this.presentNotGiven = false;
      card.set({ eventData: { activeEvents: [], cardClass: null, buttonText: null } });
      card.moveToTarget(game.decks.service_drop);

      this.emit('RESET');

      game.run('roundEnd', {}, player);
    },
    SECOND_OFFER() {
      this.emit('RESET');
    },
  },
});
