async function handleGameApi(data, { onSuccess, onError } = {}) {
  if (!onError) onError = prettyAlert;
  data.gameId = this.game._id;
  return await api.action
    .call({ path: 'game.flashcards.api.action', args: [data] })
    .then(onSuccess)
    .catch(onError);
}

export default {
  // handleGameApi,
};

export const gameCustomArgs = {
  viewerState: { showCards: {} },
};
