() => ({
  init: function () {
    const { player } = this.eventContext();
    player.set({ eventData: { skipTurn: true } });
  },
});
