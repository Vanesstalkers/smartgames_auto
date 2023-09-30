({
  activeTimers: {},
  timerRestart(owner, data) {
    const ownerId = owner.id();
    const timerId = this.activeTimers[ownerId];
    if (timerId) clearInterval(timerId);

    if (typeof owner.onTimerRestart === 'function') owner.onTimerRestart({ timerId, data });

    this.activeTimers[ownerId] = setInterval(() => {
      if (typeof owner.onTimerTick === 'function') owner.onTimerTick({ timerId, data });
    }, 1000);
  },
  timerDelete(owner) {
    const timerId = this.activeTimers[owner.id()];
    if (timerId) clearInterval(timerId);
    
    if (typeof owner.onTimerDelete === 'function') owner.onTimerDelete({ timerId });
  },
});
