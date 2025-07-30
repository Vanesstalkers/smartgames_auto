async function handleGameApi(data, { onSuccess, onError } = {}) {
  if (!onError) onError = prettyAlert;
  data.gameId = this.game._id;
  await api.action
    .call({ path: 'game.poker.api.action', args: [data] })
    .then(onSuccess)
    .catch(onError);
}

export default {
  handleGameApi,
};

export const gameCustomArgs = {
  viewerState: { showCards: {} },
};
