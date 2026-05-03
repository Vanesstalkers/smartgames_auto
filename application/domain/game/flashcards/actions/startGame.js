(async function () {
  const game = this;

  game.run('lib.startGame');

  const player = game.roundActivePlayer();
  player.set({ helper: null, eventData: null }, { reset: ['helper', 'eventData'], removeEmptyObject: true });

  game.initEvent(
    {
      name: 'flashcardEvent',
      data: {},
      handlers: {
        TRIGGER({ selectedDeck = null, nextCard = false, showCard = false }) {
          const { game, player, data } = this.eventContext();

          if (selectedDeck) {
            player.set({ eventData: { selectedDeck } });

            const deck = game.decks[selectedDeck];
            const card = deck.getRandomItem();
            player.set({ eventData: { shownCardId: card.id() } });

            const user = lib.store('user').get(player.userId);
            user.updateTutorial({ step: 'showCard' });

            return { preventListenerRemove: true };
          } else if (nextCard) {
            const card = game.decks[player.eventData.selectedDeck].getRandomItem();
            player.set({ eventData: { shownCardId: card.id() } });
            user.updateTutorial({ step: 'showCard' });
          } else if (showCard) {
            const card = game.get(player.eventData.shownCardId);
            card.moveToTarget(game.decks.table);
          }

          return { preventListenerRemove: true };
        },
        PLAYER_TIMER_END({ initPlayer: player }) {
          // this.emit('TRIGGER', { timerAutoPick: true }, player);
          return { preventListenerRemove: true };
        },
        RESET() {
          const { game } = this.eventContext();

          for (const player of game.players()) {
            player.removeEventWithTriggerListener();
          }

          this.destroy();
        },
      },
    },
    { player }
  );

  const user = lib.store('user').get(player.userId);
  const tutorialPayload = { tutorial: 'game-tutorial-flashcards-start' };
  await user.updateTutorial(tutorialPayload);
});
