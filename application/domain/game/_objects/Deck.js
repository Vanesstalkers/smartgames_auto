(class Deck extends lib.game._objects.Deck { 
  prepareBroadcastData({ data, player, viewerMode }) {
    const { visibleId, preparedData } = super.prepareBroadcastData({ data, player, viewerMode });

    if (this.subtype === 'deal' && preparedData.itemMap) {
      const preparedItems = Object.entries(preparedData.itemMap);
      const alienPreparedItems = preparedItems.filter(([key, val]) => {
        return val === null || val.owner?.code !== player.code;
      });
      const realItems = Object.entries(this.itemMap);
      const playerPreparedItems = realItems.filter(([key, val]) => {
        const item = this.get(key);
        if (item.visible && val.owner?.code === player.code) return true;
        const fakeId = item.fakeId[this.id()];
        return preparedData.itemMap[fakeId] && val.owner?.code === player.code;
      });
      preparedData.itemMap = Object.fromEntries(alienPreparedItems.concat(playerPreparedItems));
    }

    return { visibleId, preparedData };
  }
});
