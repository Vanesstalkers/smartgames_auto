(function ({ cardId, targetPlayerId }, player) {
  this.run('domain.playCard', { cardId, targetPlayerId }, player);

  const card = this.get(cardId);

  if (card.group === 'service') {
    if (this.roundStep === 'SECOND_OFFER' || this.roundStep === 'AUCTION_BET') {
      // все карты на столе уже visible = true
      card.set({ visible: true });
    }
  }
});
