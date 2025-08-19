(function ({ cardId, targetPlayerId }, player) {
  this.run('domain.playCard', { cardId, targetPlayerId }, player);

  const card = this.get(cardId);

  if (card.group === 'service') {
    if (this.roundStep === 'SECOND_OFFER') {
      // все карты на столе уже visible = true
      card.set({ visible: true });
    }
  }
});
