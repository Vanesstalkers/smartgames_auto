<template>
  <div :class="['game-zones']">
    <div v-for="deck in tableAuctionZones" :key="deck._id" :code="deck.code" :style="{ width: handCardsWidth }">
      <card
        v-for="[id, { group }] in Object.entries(deck.itemMap)"
        :key="id"
        :id="id"
        :cardId="id"
        :cardGroup="group"
        :canPlay="false"
        imgExt="png"
      />
    </div>
    <div :class="['deal-zones']">
      <div
        v-for="deck in tableDealZones"
        :key="deck._id"
        :code="deck.code"
        :class="[
          'deal-deck',
          deck.eventData.currentDeal ? 'active-deal' : '',
          deck.eventData.referencePlayerCode ? 'exclusive' : '',
          deck.eventData.referencePlayerCode !== sessionPlayer.code ? 'disabled' : '',
        ]"
        :style="{ width: handCardsWidth }"
      >
        <card
          v-for="[id, { group }] in Object.entries(deck.itemMap).filter(([id, { owner }]) => !owner)"
          :key="id"
          :id="id"
          :cardId="id"
          :cardGroup="group"
          :canPlay="sessionPlayerIsActive() && group === 'client'"
          imgExt="png"
        />

        <div class="offers">
          <div class="owner" v-for="{ ownerCode, offers } in deck.owners" :key="ownerCode">
            <div class="offer" v-for="[offerCode, itemGroup] in Object.entries(offers)" :key="offerCode">
              <card
                v-for="{ id, group } in itemGroup"
                :key="id"
                :id="id"
                :cardId="id"
                :cardGroup="group"
                :canPlay="false"
                imgExt="png"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { provide, reactive, inject } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import card from '~/lib/game/front/components/card.vue';

export default {
  components: {
    card,
  },
  props: {},
  setup() {
    return inject('gameGlobals');
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
    sessionPlayer() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
    },

    tableCardZones() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id] || {});
    },
    tableAuctionZones() {
      return this.tableCardZones.filter((deck) => deck.placement == 'table' && deck.subtype != 'deal');
    },
    tableDealZones() {
      return this.tableCardZones
        .filter((deck) => deck.placement == 'table' && deck.subtype == 'deal')
        .map((deck) => {
          deck.owners = Object.entries(deck.itemMap).reduce(
            (obj, [id, { group, owner }]) => {
              if (owner) {
                if (!obj[owner.code]) obj[owner.code] = {};
                if (!obj[owner.code][owner.order]) obj[owner.code][owner.order] = [];
                obj[owner.code][owner.order].push({ id, group });
              }
              return obj;
            },
            { 'Player[1]': {}, 'Player[2]': {} }
          );
          const sessionPlayerCode = this.sessionPlayer.code;
          deck.owners = Object.entries(deck.owners).map(([id, offers]) => ({ ownerCode: id, offers }));
          deck.owners.sort((a, b) => (a.ownerCode === sessionPlayerCode ? 1 : -1));
          return deck;
        });
    },

    handCardsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;
      return state.isMobile ? `${cardWidth}px` : `${Math.ceil(1 / maxCardStack) * cardWidth}px`;
    },
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
#game {
  #gamePlane {
    .game-zones {
      width: 100%;
      height: 100%;

      [code='Deck[card_zone_auction_client]'] {
        position: absolute;
        left: calc(50% - 130px - 10px);
        top: calc(50% - 90px);
        z-index: 1;
      }
      [code='Deck[card_zone_auction_car]'] {
        position: absolute;
        left: calc(50%);
        top: calc(50% - 90px);
      }

      .deal-zones {
        position: absolute;
        left: 0px;
        top: 50px;
        width: 100%;
        display: flex;
        justify-content: center;
        margin-left: 40px;
        transform-origin: center top;
        scale: 0.7;

        .deal-deck {
          height: 100%;
          display: flex;
          margin: 0px 50px;
          position: relative;

          &.active-deal {
            scale: 1.5;
            margin-top: 250px;
            z-index: 1;
          }

          &.exclusive {
            box-shadow: 0px 0px 20px 0px gold;
            border: 2px solid gold;
            border-radius: 4px;
          }
          &.exclusive.disabled {
            opacity: 0.5;
          }

          .card-event {
            margin-left: -80px;
          }

          .offers {
            position: absolute;
            left: 0px;
            top: 170px;
            width: 370px;
            height: 0px;
            margin-left: -140px;
            display: flex;
            justify-content: space-between;
            transform-origin: bottom;
            scale: 0.5;

            .owner {
              max-width: 30%;
              .offer {
                display: flex;
              }
            }
            .owner:last-child {
              .offer {
                justify-content: flex-end;
              }
            }
          }
        }
      }
    }
  }
}
</style>
