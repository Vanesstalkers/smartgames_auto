({
  activeTimers: {},
  timerRestart(owner, data) {
    const ownerId = owner.id();
    const timerId = this.activeTimers[ownerId];
    if (timerId) clearTimeout(timerId);

    if (typeof owner.onTimerRestart === 'function') owner.onTimerRestart({ timerId, data });

    const self = this;
    this.activeTimers[ownerId] = setTimeout(async function tick() {
      if (typeof owner.onTimerTick === 'function') await owner.onTimerTick({ timerId, data });
      if (!self.activeTimers[ownerId]) return;
      self.activeTimers[ownerId] = setTimeout(tick, 1000);
    }, 1000);
  },
  timerDelete(owner) {
    const timerId = this.activeTimers[owner.id()];
    if (timerId) {
      delete this.activeTimers[owner.id()];
      clearTimeout(timerId);
    }

    if (typeof owner.onTimerDelete === 'function') owner.onTimerDelete({ timerId });
  },
});
