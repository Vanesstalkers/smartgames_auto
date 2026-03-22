(code) => {
  // TO_CHANGE (меняем на свой список рейтингов)
  const list = {
    richestPlayers: {
      title: 'Самые богатые',
      active: true,
      sortFunc: (a, b) => ((a.money || -1) > (b.money || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Выиграно игр' },
        { code: 'money', title: 'Заработано денег', format: 'money' },
      ],
    },
    topPlayers: {
      title: 'Самые продуктивные',
      sortFunc: (a, b) => ((a.games || -1) > (b.games || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Сыграно игр' },
        { code: 'win', title: 'Выиграно игр' },
      ],
    },
  };
  return code ? list[code] : list;
};
