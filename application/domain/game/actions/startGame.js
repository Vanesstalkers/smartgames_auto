(function () {
  this.set({ status: 'IN_PROCESS', roundStep: 'ROUND_START' });
  this.run('initGameProcessEvents');
  this.run('roundStart');
});
