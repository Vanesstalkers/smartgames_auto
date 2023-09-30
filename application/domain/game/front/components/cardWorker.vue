<template>
  <div
    v-if="player._id || viewer._id"
    :id="player._id"
    :class="[
      'card-worker',
      'card-worker-' + player.code,
      player.active ? 'active' : '',
      choiceEnabled ? 'active-event' : '',
      showEndRoundBtn || showLeaveBtn ? 'has-action' : '',
    ]"
    :style="customStyle"
    @click="controlAction"
  >
    <div v-if="showEndRoundBtn" class="action-btn end-round-btn">Закончить раунд</div>
    <div v-if="player.active && player.timerEndTime && game.status != 'WAIT_FOR_PLAYERS'" class="end-round-timer">
      {{ this.localTimer }}
    </div>
    <div v-if="!iam" class="card-event">
      {{ cardDeckCount }}
    </div>
    <div v-if="showLeaveBtn" class="action-btn leave-game-btn">Выйти из игры</div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    playerId: String,
    viewerId: String,
    iam: Boolean,
    showControls: Boolean,
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
    choiceEnabled() {
      return this.sessionPlayerIsActive() && this.player.activeEvent?.choiceEnabled;
    },
    cardDeckCount() {
      return (
        Object.keys(
          Object.keys(this.player.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    showEndRoundBtn() {
      return this.showControls && this.iam && this.sessionPlayerIsActive();
    },
    showLeaveBtn() {
      return (this.game.status === 'FINISHED' && this.iam) || this.viewerId;
    },
  },
  methods: {
    async controlAction() {
      if (this.choiceEnabled) return; // выбор игрока в контексте события карты
      if (this.showEndRoundBtn) return await this.endRound();
      if (this.showLeaveBtn) return await this.leaveGame();
    },

    async endRound() {
      // TO_CHANGE (свои обработчики конца раунда)

      await this.handleGameApi({ name: 'endRound' });
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
  mounted() {},
};
</script>

<style scoped>
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
}
.card-worker.has-action {
  cursor: pointer;
}
.card-worker.has-action:hover .action-btn {
  background: green;
}
.card-worker.active {
  outline: 4px solid green;
}

.card-worker .card-event {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 60px;
  height: 90px;
  color: white;
  border: none;
  font-size: 36px;
  display: flex;
  justify-content: center;
  align-content: center;
  background-image: url(../assets/back-side.jpg);
}
#game.mobile-view.portrait-view .card-worker .card-event {
  left: auto;
  right: 0px;
}
.card-worker.active-event .end-round-btn,
.card-worker.active-event .end-round-timer {
  display: none;
}

.end-round-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #3f51b5;
  color: white;
  font-size: 16px;
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
