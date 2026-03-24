<template>
  <lobby :gameServerTitle="gameServerTitle">
    <template v-if="lobby.__gameServerConfig" #menu-item-game>
      <games class="menu-item-content" :gamesMap="gamesMap" :defaultGameCode="defaultGameCode">
        <template #tutorial-games>
          <tutorial-games class="tutorial-games" />
        </template>
      </games>
    </template>
  </lobby>
</template>

<script>
import Lobby from '~/lib/lobby/front/Lobby.vue';
import games from '~/lib/lobby/front/components/games.vue';
import tutorialGames from './components/tutorial-games.vue';

export default {
  name: 'TO_CHANGE',
  components: { Lobby, games, tutorialGames },
  data() {
    return {};
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    gameServerTitle() {
      return this.lobby.__gameServerConfig?.title;
    },
    defaultGameCode() {
      return this.lobby.__gameServerConfig?.code;
    },
    gamesMap() {
      return {
        [this.defaultGameCode]: this.lobby.__gameServerConfig,
      };
    },
  },
  methods: {},
  created() {},
  mounted() {
    if(this.lobby.code) {
      // дублирует логику из App.vue на случай, если страница была перезагружена в процессе игры
      this.$root.state.viewLoaded = true;
    }
  },
  async beforeDestroy() {},
};
</script>
<style lang="scss" scoped>
.big-controls {
  height: 100%;
  width: 100%;

  .select-btn {
    height: 50px;
    width: 80% !important;
    margin: auto !important;
    margin-top: 20px !important;
    font-size: 24px;
    text-align: center !important;
    line-height: 48px;
  }
}
</style>
