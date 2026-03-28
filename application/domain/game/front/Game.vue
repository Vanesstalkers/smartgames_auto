<template>
  <game
    :debug="false"
    :gamePlaneFillWidth="[0.4, 0.4, 0.4, 0.4, 0.4][state.guiScale - 1]"
    :planeScaleMax="[1.5, 2, 3, 4, 6][state.guiScale - 1]"
  >
    <template #gameplane="{
      /* game = {}, gamePlaneScale */
    } = {}">
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          {{ game.statusLabel }}
          <small v-if="game.status === 'RESTORING_GAME'">{{ subStatusLabel }}</small>
        </div>
        <div class="deck-list">
          <div
            v-for="deck in deckList"
            :key="deck._id"
            :class="['deck', deck.code.includes('_drop') ? 'drop' : '']"
            :code="deck.code"
          >
            <div class="card-event">
              {{ Object.keys(deck.itemMap).length }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #player="{} = {}">
      <player
        :playerId="gameState.sessionPlayerId"
        :viewerId="gameState.sessionViewerId"
        :customClass="[`scale-${state.guiScale}`]"
        :iam="true"
        :showControls="showPlayerControls"
      />
    </template>
    <template #opponents="{} = {}">
      <player
        v-for="(id, index) in playerIds"
        :key="id"
        :playerId="id"
        :customClass="[`idx-${index}`]"
        :showControls="false"
      />
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import card from '~/lib/game/front/components/card.vue';
import player from './components/player.vue';
import tutorial from '~/lib/helper/front/helper.vue';

export default {
  components: {
    Game,
    player,
    card,
    tutorial,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals({ defaultDeviceOffset: 500 });
    provide('gameGlobals', gameGlobals);
    return gameGlobals;
  },
  watch: {
    gameDataLoaded: function () {
      // тут ловим обновление страницы
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore() || {};
    },
    game() {
      return this.getGame();
    },
    gameDataLoaded() {
      return this.game.addTime;
    },
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS' || this.game.status === 'PREPARE_START';
    },

    restoringGameState() {
      return this.game.status === 'RESTORING_GAME';
    },
    subStatusLabel() {
      const players = Object.values(this.store.player || {});
      return `Подключилось ${players.filter((player) => player.ready).length} из ${players.length} игроков`;
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionUserCardDeckLength() {
      return (
        Object.keys(
          Object.keys(this.sessionPlayer.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
  },
  methods: {},
};
</script>
<style lang="scss">
@import './css/game.css';

.card-event.played {
  filter: none !important;
}

.game-status-label {
  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;
}

#game.mobile-view .game-status-label {
  font-size: 1.5em;
}
</style>
