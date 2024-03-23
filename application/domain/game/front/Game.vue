<template>
  <game :gamePlaneScaleMin="1" :gamePlaneScaleMax="2">
    <template
      #gameplane="{
        /* game = {}, gamePlaneScale */
      } = {}"
    >
      <sales-game-plane v-if="game.gameType === 'sales'" />
      <auction-game-plane v-if="game.gameType === 'auction'" />
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          {{ game.statusLabel }}
        </div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code">
          <div v-if="deck._id && deck.code === 'Deck[card_client]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_car]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_drop_service]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
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

import SalesGamePlane from './games/sales/plane.vue';
import AuctionGamePlane from './games/auction/plane.vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import card from '~/lib/game/front/components/card.vue';
import player from './components/player.vue';

export default {
  components: {
    SalesGamePlane,
    AuctionGamePlane,
    Game,
    player,
    card,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals();

    Object.assign(gameGlobals, {
      sessionPlayerIsActive() {
        const playerMap = this.getGame().playerMap || {};
        const activePlayers = Object.keys(playerMap).filter((id) => {
          const player = this.getStore().player?.[id] || {};
          return player.active && !player.activeReady;
        });
        return activePlayers.includes(this.gameState.sessionPlayerId);
      },
      calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
        return {
          transformOrigin: 'center',
        };
      },
    });

    gameGlobals.gameCustom = reactive({
      selectedCard: '',
    });
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
      return this.game.status === 'IN_PROCESS';
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionPlayer() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
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

    fullPrice() {
      const { gameTimer, gameConfig } = this.game;
      const baseSum = 1000; // TO_CHANGE (меняем на свою сумму дохода за игру)
      const timerMod = 30 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig];
      return Math.floor(baseSum * timerMod * configMod);
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
  },
  methods: {},
};
</script>
<style lang="scss">
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

#gameInfo {
  .deck {
    position: absolute;
    top: 35px;
    cursor: default;

    .card-event {
      width: 60px;
      height: 90px;
      border: none;
      font-size: 36px;
      display: flex;
      justify-content: center;
      align-content: center;
      color: #ff5900;
      text-shadow: 1px 1px 0 #fff;
    }

    &[code='Deck[card_client]'] {
      right: 70px;
      .card-event {
        background-image: url(./assets/client-back-side.png);
      }
    }
    &[code='Deck[card_car]'] {
      right: 0px;
      .card-event {
        background-image: url(./assets/car-back-side.png);
      }
    }
    &[code='Deck[card_drop_service]'] {
      right: 140px;
      .card-event {
        background-image: url(./assets/service-back-side.png);
      }
    }
  }
}
</style>
