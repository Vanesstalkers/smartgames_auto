(function ({ cardId }, player) {
  if (this.activeEvent)
    throw new Error(
      this.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const card = this.getObjectById(cardId);

  if (card.group === 'car') {
    card.moveToTarget(player.decks.car_played);
  }
  if (card.group === 'service') {
    card.moveToTarget(player.decks.service_played);
      // все карты на столе уже visible = true
      card.set({ visible: true });
    }
  }
  
  card.initEvent('returnCardToHand', { player });
});
