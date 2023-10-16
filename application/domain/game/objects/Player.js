(class Player extends lib.game.objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(
      this.broadcastableFields().concat(
        //
        ['money']
      )
    );

    this.set({
      money: data.money || 0,
    });
  }
  initEvent(eventName, { player } = {}) {
    super.initEvent(eventName, { player: this });
  }

  publishInfo(info = {}) {
    if (!info.text) return;

    lib.store.broadcaster.publishData(`gameuser-${this.userId}`, {
      helper: {
        text: info.text,
        pos: {
          desktop: 'top-left',
          mobile: 'top-left',
        },
        hideTime: info.hideTime || 3000,
      },
    });
  }

  activate({ setData, publishText } = {}) {
    this.set({ active: true, activeReady: false, eventData: { actionsDisabled: null } });
    if (setData) this.set(setData);
    if (publishText) this.publishInfo({ text: publishText, hideTime: 5000 });
  }
});
