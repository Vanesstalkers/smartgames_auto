(function ({ idx }, player) {
  const serviceCards = this.getObjects({ className: 'Card', attr: { group: 'service' } });
  serviceCards.sort((a, b) => (a.id() < b.id() ? -1 : a.id() > b.id() ? 1 : 0));
  const serviceHand = player.getObjectByCode('Deck[card_service]');
  for (let i = idx; i < serviceCards.length; i = i + 2) {
    const card = serviceCards[i];
    card.moveToTarget(serviceHand);
  }
});
