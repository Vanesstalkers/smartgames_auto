({ apiRequest, selectGroup, template } = {}) => {
  const list = [
    { group: 'TO_CHANGE', name: 'TO_CHANGE', title: 'TO_CHANGE' },
  ];

  const result = list
    .filter((card) => !selectGroup || card.group === selectGroup)
    .map((card) => (apiRequest ? { path: `${template}/${card.group}/${card.name}.png` } : card));

  return result;
};
