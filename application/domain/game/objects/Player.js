(class Player extends lib.game.objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(
      this.broadcastableFields().concat(
        // добавляем недостающие поля
        ['TO_CHANGE']
      )
    );

    this.set({
      TO_CHANGE: 'сохраняем в класс новые поля',
    });
  }
  // TO_CHANGE (если нужно, то пишем свою логику broadcast-фильтрации полей)
  // prepareBroadcastData({ data, player, viewerMode }) {
  //   const bFields = this.broadcastableFields();
  //   let visibleId = this._id;
  //   let preparedData;
  //   if (!bFields) {
  //     preparedData = data;
  //   } else {
  //     preparedData = {};
  //     for (const [key, value] of Object.entries(data)) {
  //       if (bFields.includes(key)) {
  //         preparedData[key] = value;
  //       }
  //     }
  //   }
  //   return { visibleId, preparedData };
  // }
});
