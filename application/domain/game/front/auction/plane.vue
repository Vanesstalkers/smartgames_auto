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
          deck.eventData.referencePlayerId ? 'exclusive' : '',
          deck.eventData.referencePlayerId !== gameState.sessionPlayerId ? 'disabled' : '',
        ]"
        :style="{ width: handCardsWidth }"
        :cardCount="deck.cards.length"
      >
        <card
          v-for="[id, { group, order }] in deck.cards"
          :key="id"
          :id="id"
          :cardId="id"
          :cardGroup="group"
          :canPlay="sessionPlayerIsActive() && group === 'client'"
          :class="'group-' + group"
          imgExt="png"
          :order="order"
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
          deck.cards = Object.entries(deck.itemMap)
            .filter(([id, { owner }]) => !owner)
            .map(([id, card]) => [id, { ...card, order: this.getCardOrder({ id, group: card.group }) }]);
          deck.cards.sort(([aid, a], [bid, b]) => (a.order > b.order ? 1 : -1));

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
  methods: {
    getCardOrder({ id, group }) {
      switch (group) {
        case 'feature':
          return 0;
        case 'credit':
          return 1;
        case 'client':
          return this.store.card?.[id]?.eventData?.replacedClient ? 2 : 3;
      }
    },
  },
};
</script>
<style lang="scss">
#game {
  #gamePlane {
    .game-zones {
      width: 100%;
      height: 100%;

      [code='Deck[card_zone_auction_client]'] {
        position: absolute;
        left: calc(50% + 300px);
        top: calc(50% - 100px);
        z-index: 1;
      }
      [code='Deck[card_zone_auction_car]'] {
        position: absolute;
        left: calc(50% + 450px);
        top: calc(50% - 100px);
        z-index: 1;
      }

      .deal-zones {
        position: absolute;
        left: 0px;
        top: calc(50% - 180px);
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

          &.exclusive .group-client {
            box-shadow: 0px 0px 20px 0px gold;
            border: 2px solid gold;
            border-radius: 4px;
          }
          &.exclusive.disabled .group-client {
            border: none;
            opacity: 0.5;

            .play-btn {
              display: none;
            }
          }

          .card-event {
            margin-left: -80px;

            .card-info-btn {
              left: 10px !important;
              z-index: 1;
            }
          }

          &[cardCount='4'] {
            .card-event[order='2']:after {
              content: '';
              background: #0f0f0f;
              width: 24px;
              height: 37px;
              position: absolute;
              left: 4px;
              top: 4px;
            }
            .card-event[order='3']:after {
              content: '';
              background: #0f0f0f;
              width: 24px;
              height: 50px;
              position: absolute;
              left: 4px;
              top: 40px;
            }
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
