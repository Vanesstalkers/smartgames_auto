<template>
  <div
    v-if="player._id || viewer._id"
    :class="['player', ...customClass, iam ? 'iam' : '', player.active ? 'active' : '']"
  >
    <div class="inner-content">
      <div class="player-hands">
        <div v-if="iam || gameState.viewerMode" class="hand-cards-list" ref="scrollbar">
          <div v-for="deck in cardDecks" :key="deck._id" class="hand-cards" :style="{ width: handCarsWidth }">
            <card
              v-for="id in Object.keys(deck.itemMap)"
              :key="id"
              :cardId="id"
              :canPlay="iam"
              :isSelected="id === gameCustom.selectedCard"
            />
          </div>
        </div>
      </div>
      <div class="workers">
        <card-worker :playerId="playerId" :viewerId="viewerId" :iam="iam" :showControls="showControls" />
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';

import card from '~/lib/game/front/components/card.vue';
import cardWorker from './cardWorker.vue';

export default {
  components: {
    PerfectScrollbar,
    card,
    cardWorker,
  },
  props: {
    customClass: Array,
    playerId: String,
    viewerId: String,
    iam: Boolean,
    showControls: Boolean,
  },
  data() {
    return {};
  },
  watch: {
    mainCardDeckItemsCount: function () {
      this.$nextTick(() => {
        const scrollbar = this.$refs.scrollbar;
        if (!scrollbar) return; // !!! тут соперник - нужно поправить логику
        scrollbar.scrollTo({ top: 1000000 }); // просто высоты экрана может быть не достаточно при большом количестве карт в руке
      });
    },
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    player() {
      return this.store.player?.[this.playerId] || {};
    },
    viewer() {
      return this.store.viewer?.[this.viewerId] || {};
    },
    cardDecks() {
      return this.deckIds.map((id) => this.store.deck?.[id]).filter((deck) => deck.type === 'card') || [];
    },
    mainCardDeckItemsCount() {
      return Object.keys(this.cardDecks[0]?.itemMap || {}).length;
    },
    deckIds() {
      return Object.keys(this.player.deckMap || {});
    },
    showDecks() {
      return this.sessionPlayerIsActive() && this.player.activeEvent?.showDecks;
    },
    handCarsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;
      return state.isMobile
        ? `${cardWidth}px`
        : `${Math.ceil(this.mainCardDeckItemsCount / maxCardStack) * cardWidth}px`;
    },
  },
  methods: {},
};
</script>

<style lang="scss">
.player:not(.iam) {
  position: relative;
  margin-top: 10px;
}
.player:not(.iam) > .inner-content {
  display: flex;
  align-items: flex-end;
  flex-direction: row-reverse;
}
#game.mobile-view.portrait-view .player:not(.iam) > .inner-content {
  flex-direction: row;
}

.player.iam > .inner-content {
  display: flex;
  align-items: flex-end;
  position: absolute;
  right: 0px;
  bottom: 0px;
  height: 0px;
}
#game.mobile-view .player.iam > .inner-content > .player-hands {
  flex-wrap: nowrap;
}

.workers {
  z-index: 1; /* карточка воркера должна быть видна при размещении игровых зон из руки */
}

.player-hands {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  padding: 0px 10px;
  flex-direction: row;
  position: relative;
  height: 0px;
  width: 100%;

  .hand-cards-list {
    &.tutorial-active {
      box-shadow: 0 0 10px 10px #f4e205 !important;
    }
  }
}
#game.mobile-view.portrait-view .player-hands {
  justify-content: flex-start;
  height: initial;
}
#game:not(.mobile-view) .hand-cards-list {
  .hand-cards {
    max-height: 250px;
    flex-direction: column;
  }
}
#game.mobile-view .hand-cards-list {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 400px;
  .hand-cards {
    margin-top: 130px;
  }
}
#game.mobile-view.landscape-view .hand-cards-list {
  @media only screen and (max-height: 360px) {
    max-height: 300px;
  }
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
}
.hand-cards > .card-event {
  margin-top: -130px;
}

.deck-counters {
  position: absolute;
  color: white;
  font-size: 24px;
  width: 100%;
  right: 0px;
  bottom: 0px;
  text-align: right;
}
.deck-counters b {
  font-size: 42px;
}
</style>
