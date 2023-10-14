(function ({ cardId }, player) {
  if (this.activeEvent)
    throw new Error(
      this.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const card = this.getObjectById(cardId);

  if (card.group === 'car') {
    const targetDeck = player.getObjectByCode('Deck[card_car_played]');
    card.moveToTarget(targetDeck);
  }
  if (card.group === 'service') {
    const targetDeck = player.getObjectByCode(`Deck[card_service_played]`);
    card.moveToTarget(targetDeck);
    if (this.roundStep === 'SECOND_OFFER') {
      // все карты на столе уже visible = true
      card.set({ visible: true });
    }
  }
  card.initEvent('returnCardToHand', { player });
});
