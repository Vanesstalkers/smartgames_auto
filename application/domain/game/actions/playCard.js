(function ({ cardId, targetPlayerId }, player) {
  const card = this.get(cardId);

  if (card.eventData.playDisabled || card.parent().eventData.playDisabled || player.eventData.playDisabled)
    throw new Error('Эту карту нельзя разыгрывать.');

  if (card.eventData.activeEvents.length) {
    for (const event of card.eventData.activeEvents) {
      event.emit('TRIGGER', { targetId: cardId, targetPlayerId });
    }
    return;
  }

  if (card.group === 'car') {
    card.moveToTarget(player.decks.car_played);
  }
  if (card.group === 'service') {
    card.moveToTarget(player.decks.service_played);

    if (
      this.roundStep === 'SECOND_OFFER' ||
      // !!!! переделать в логику с разными файлами для разных игр
      this.roundStep === 'AUCTION_BET'
    ) {
      // все карты на столе уже visible = true
      card.set({ visible: true });
    }
  }

  card.initEvent('returnCardToHand', { player });
});
