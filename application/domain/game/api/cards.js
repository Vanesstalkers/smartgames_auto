({
  access: 'public',
  method: async (context, { selectGroup } = {}) => {
    const cards = domain.game.configs
      .cards()
      .filter(({ group }) => group === selectGroup)
      .map(({ name }) => `${selectGroup}/${name}.png`)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });

    return { status: 'ok', cards };
  },
});
