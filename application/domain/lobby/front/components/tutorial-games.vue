<template>
  <!-- TO_CHANGE (заменить примеры игр) -->
  <div>
    <game-item
      :game="{
        id: 'tutorial-game',
        gameCode: 'auto',
        gameType: 'duel',
        gameConfig: 'default',
        gameTimer: 30,
        joinedPlayers: 1,
        waitForPlayer: true,
      }"
      :gamesMap="{
        auto: {
          icon: ['fas', 'car'],
          games: {
            duel: {
              icon: ['fas', 'car'],
              items: {
                default: {
                  title: 'Дуэль',
                },
              },
            },
          },
        },
      }"
      @join="() => {}"
    />
    <game-item
      :game="{
        id: 'tutorial-game-ai',
        gameCode: 'auto',
        gameType: 'ai',
        gameConfig: 'default',
        gameTimer: 60,
        joinedPlayers: 1,
        waitForPlayer: false,
        round: 1,
      }"
      :gamesMap="{
        auto: {
          icon: ['fas', 'car'],
          games: {
            ai: {
              icon: ['fas', 'cash-register'],
              items: {
                default: {
                  title: 'Один игрок',
                },
              },
            },
          },
        },
      }"
      @join="() => {}"
    />
  </div>
</template>

<script>
import GameItem from '~/lib/lobby/front/components/game-item.vue';

export default {
  name: 'tutorial-games',
  components: { GameItem },
};
</script>
