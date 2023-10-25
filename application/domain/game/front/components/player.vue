<template>
  <div
    v-if="player._id || viewer._id"
    :class="['player', ...customClass, iam ? 'iam' : '', player.active ? 'active' : '']"
  >
    <div class="inner-content">
      <div class="player-hands">
        <div class="hand-cards-list" ref="scrollbar">
          <div v-if="iam || gameState.viewerMode" class="hand-cards" :style="{ width: handCardsWidth }">
            <card
              v-for="card in handCards"
              :key="card.id"
              :cardId="card.id"
              :cardGroup="card.group"
              :canPlay="canPlay(card)"
              :myCard="iam"
              :imgExt="'png'"
            />
          </div>
          <div class="hand-cards at-table">
            <card
              v-for="card in tableCards"
              :key="card.id"
              :cardId="card.id"
              :cardGroup="card.group"
              :canPlay="canPlay(card)"
              :myCard="iam"
              :imgExt="'png'"
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
  watch: {},
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
      const map = this.deckIds.map((id) => this.store.deck?.[id] || {});
      return map.filter((deck) => deck.type === 'card') || [];
    },
    cardDecksData() {
      return this.cardDecks.map(({ code, eventData }) => ({ code, eventData }));
    },
    handCards() {
      return this.cardDecks
        .filter(({ placement }) => placement !== 'table')
        .reduce((arr, deck) => {
          return arr.concat(
            Object.entries(deck.itemMap).map(([id, { group }]) => {
              const { price = 0, priceGroup, stars } = this.store.card[id] || {};
              const cardOrder =
                parseInt(price) * (price.toString().includes('%') ? 100 : 1) +
                (priceGroup ? 1000000 : 0) +
                (stars ? 5000000 : 0);
              return {
                id,
                group,
                deck,
                cardOrder,
              };
            })
          );
        }, [])
        .sort((a, b) => (a.cardOrder > b.cardOrder ? -1 : 1));
    },
    tableCards() {
      return this.cardDecks
        .filter(({ placement }) => placement === 'table')
        .reduce((arr, deck) => {
          return arr.concat(Object.entries(deck.itemMap).map(([id, { group }]) => ({ id, group, deck })));
        }, []);
    },
    deckIds() {
      return Object.keys(this.player.deckMap || {});
    },
    handCardsWidth() {
      return state.isMobile && this.state.isPortrait ? `${window.innerWidth - 80}px` : 'auto';
    },
    mainCardDeckItemsCount() {
      return this.handCards.length;
    },
  },
  methods: {
    canPlay(card) {
      const playerAvailable =
        (this.sessionPlayerIsActive() || this.player.eventData.canPlay) && !this.player.eventData.playDisabled;
      const deckAvailable = !card.deck.eventData.playDisabled;

      const tableCar = this.tableCards.find((card) => card.group === 'car');
      const currentEquip = this.tableCards.reduce(
        (arr, card) => arr.concat(...(this.store.card?.[card.id]?.equip || [])),
        []
      );
      const onlyOneCar = card.group !== 'car' || !tableCar;
      const cardEquip = this.store.card?.[card.id]?.equip || [];
      const exclusiveEquip = !cardEquip.find((equip) => currentEquip.includes(equip));
      const customCheck = (onlyOneCar && exclusiveEquip) || card.deck.placement === 'table';

      return this.iam && playerAvailable && deckAvailable && customCheck;
    },
  },
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
  flex-wrap: nowrap;
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
#game.mobile-view.portrait-view .player.iam > .inner-content > .player-hands {
  flex-wrap: nowrap;

  .hand-cards {
    flex-wrap: wrap;
  }
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
    display: flex;
    align-items: flex-end;
    flex-direction: row;

    &.tutorial-active {
      box-shadow: 0 0 10px 10px #f4e205 !important;
    }
  }
}

.player.iam .player-hands {
  .hand-cards-list {
    flex-direction: row-reverse;

    .hand-cards.at-table {
      position: absolute;
      left: auto;
      right: -120px;
      bottom: 200px;
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
    flex-direction: row;
  }
}
#game.mobile-view .hand-cards-list {
  overflow-y: auto;
  overflow-x: hidden;
}
#game.mobile-view.landscape-view .hand-cards-list {
  @media only screen and (max-height: 360px) {
    max-height: 300px;
  }
}

.hand-cards {
  display: flex;
  flex-wrap: nowrap;
  margin-left: 80px;
  & > .card-event {
    margin-left: -80px;
  }
}
#game.mobile-view.portrait-view .hand-cards-list {
  .hand-cards {
    margin-top: 70px;
    & > .card-event {
      margin-top: -70px;
    }
  }
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
