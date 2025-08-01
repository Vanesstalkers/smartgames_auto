<template>
  <div
    v-if="player._id || viewer._id"
    :id="player._id"
    :class="[
      'card-worker',
      'card-worker-' + player.code,
      player.active ? 'active' : '',
      selectable ? 'selectable' : '',
      showControlBtn || showLeaveBtn ? 'has-action' : '',
    ]"
    :style="customStyle"
  >
    <div class="money">{{ new Intl.NumberFormat().format((player.money || 0) * 1000) }}₽</div>
    <div v-if="showTimer" class="end-round-timer">
      {{ this.localTimer }}
    </div>
    <div v-if="!iam" class="car-deck card-event">
      {{ carDeckCount }}
    </div>
    <div v-if="!iam" class="service-deck card-event">
      {{ serviceDeckCount }}
    </div>
    <div v-if="showControlBtn" :class="['action-btn', 'end-round-btn', controlBtn.class || '']" @click="controlAction">
      {{ controlBtn.label || 'Закончить раунд' }}
    </div>
    <div v-if="showLeaveBtn" class="action-btn leave-game-btn" @click="controlAction">Выйти из игры</div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    playerId: String,
    viewerId: String,
    iam: Boolean,
  },
  data() {
    return {
      localTimer: null,
      localTimerUpdateTime: null,
      localTimerId: null,
    };
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    game() {
      return this.getGame();
    },
    store() {
      return this.getStore();
    },
    userData() {
      return this.state.store?.user?.[this.state.currentUser] || {};
    },
    player() {
      const player = this.store.player?.[this.playerId] || {};
      // через watch не осилил (проблема при создании игры - "Vue cannot detect property addition or deletion")
      if (player.timerEndTime && this.localTimerUpdateTime !== player.timerUpdateTime) {
        clearTimeout(this.localTimerId);
        this.localTimer = Math.floor((player.timerEndTime - state.serverTimeDiff - Date.now()) / 1000);
        this.localTimerUpdateTime = player.timerUpdateTime;
        this.localTimerId = setInterval(() => {
          if (this.localTimer !== null) {
            this.localTimer--;
            if (this.localTimer < 0) this.localTimer = 0;
          }
        }, 1000);
      }
      return player || {};
    },
    viewer() {
      return this.store.viewer?.[this.viewerId] || {};
    },
    customStyle() {
      const style = {};
      const gender = this.userData.gender;

      const defaultImage = `_default/${gender}_empty`;
      const avatarCode = this.userData.avatarCode || this.player.avatarsMap?.[gender] || defaultImage;

      style.backgroundImage = `url(${this.state.lobbyOrigin}/img/workers/${avatarCode}.png)`;

      return style;
    },
    controlBtn() {
      return this.player.eventData.controlBtn;
    },
    selectable() {
      return this.sessionPlayerIsActive() && this.player.eventData.selectable;
    },
    playerDecks() {
      return Object.keys(this.player.deckMap || {}).map((id) => this.store.deck?.[id] || {});
    },
    carDeckCount() {
      const deck = this.playerDecks.find(({ subtype }) => subtype === 'car');
      return Object.keys(deck?.itemMap || {}).length || 0;
    },
    serviceDeckCount() {
      const deck = this.playerDecks.find(({ subtype }) => subtype === 'service');
      return Object.keys(deck?.itemMap || {}).length || 0;
    },
    showControlBtn() {
      return this.iam && this.sessionPlayerIsActive() && this.controlBtn?.label && !this.controlBtn.leaveGame;
    },
    showTimer() {
      return (
        this.player.active &&
        !this.player.eventData.actionsDisabled &&
        this.player.timerEndTime &&
        this.game.status != 'WAIT_FOR_PLAYERS'
      );
    },
    showLeaveBtn() {
      return (this.iam && this.controlBtn?.leaveGame) || this.viewerId;
    },
  },
  methods: {
    async controlAction() {
      prettyAlertClear?.();

      if (this.selectable) return; // выбор игрока в контексте события карты

      if (this.showLeaveBtn) return await this.leaveGame();

      if (this.showControlBtn) {
        if (this.controlBtn.triggerEvent) await this.handleGameApi({ name: 'eventTrigger' });
        else await this.endRound();
      }
    },
    async endRound() {
      await this.handleGameApi({ name: 'roundEnd' });
    },
    async leaveGame() {
      await api.action
        .call({
          path: 'game.api.leave',
          args: [],
        })
        .catch(prettyAlert);
    },
  },
};
</script>

<style scoped lang="scss">
.card-worker {
  position: relative;
  border: 1px solid;
  width: 120px;
  height: 180px;
  background-size: cover;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  border-radius: 10px;
  margin: 0px 0px 0px 5px;
  box-shadow: inset 0px 20px 20px 0px black;

  &.active {
    outline: 4px solid green;
  }

  .money {
    position: absolute;
    top: 0px;
    width: 100%;
    font-size: 20px;
    font-weight: bold;
    color: #f4e205;
    padding-top: 4px;
  }

  .card-event {
    position: absolute;
    bottom: 0px;
    width: 48px;
    height: 72px;
    color: white;
    border: none;
    font-size: 36px;
    display: flex;
    justify-content: center;
    align-content: center;

    &.car-deck {
      left: 0px;
      background-image: url(../assets/car-back-side.png);
    }

    &.service-deck {
      right: 0px;
      background-image: url(../assets/service-back-side.png);
    }
  }
}

.card-worker.has-action:hover .action-btn {
  cursor: pointer;
  background: green;
}

.card-worker.selectable .end-round-btn,
.card-worker.selectable .end-round-timer {
  display: none;
}

.end-round-btn {
  position: absolute;
  bottom: 0px;
  width: 100%;
  min-height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.5em;
  text-align: center;
  cursor: pointer;
  background: #008000de;
  color: white;
  font-size: 16px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  &:hover {
    background: #008000;
  }
}

.end-round-timer {
  position: absolute;
  bottom: 50px;
  width: 100px;
  z-index: 1;
  font-size: 64px;
  color: white;
  border-radius: 50%;
  height: 100px;
  line-height: 100px;
  margin: 10px;
  color: #ff5900;
  text-shadow: 4px 4px 0 #fff;
}

.leave-game-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #bb3030;
  color: white;
  font-size: 16px;
}
</style>
