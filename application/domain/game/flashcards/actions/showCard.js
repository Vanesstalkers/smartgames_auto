(async function ({ cardId }, player) {
  let card = this.get(cardId);

  const user = lib.store('user').get(player.userId);
  // const tutorialPayload = { tutorial: 'game-tutorial-flashcards-start' };
  if (!user.currentTutorial?.active) {
    player.set({ eventData: { shownCardId: cardId } });
    await user.updateTutorial({ tutorial: 'game-tutorial-flashcards-start', step: 'showSingleCard' });
  }

  return { cardId: card.id(), cardCode: card.name, cardGroup: card.group };
});
