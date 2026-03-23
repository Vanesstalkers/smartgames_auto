<template>
  <div
    id="app"
    :class="[
      state.isMobile ? 'mobile-view' : '',
      state.isLandscape ? 'landscape-view' : 'portrait-view',
      isGameRoute ? (!viewLoaded ? 'game-loading' : 'game-loaded') : '',
    ]"
    :current-route="$root.state.currentRoute"
  >
    <div :class="['fullscreen-btn', 'gui-resizeable', `scale-${state.guiScale}`]">
      <button v-if="!state.hideFullscreeBtn" @click="toggleFullscreen">
        <span v-if="!state.isFullscreen">
          <font-awesome-icon icon="fa-solid fa-expand" class="fa-xl" />
          На весь экран
        </span>
        <span v-if="state.isFullscreen">
          <font-awesome-icon icon="fa-solid fa-compress" class="fa-xl" />
          Свернуть экран
        </span>
      </button>
      <div v-if="!viewLoaded" class="exit show-with-delay">
        <button @click="returnToLobby">Вернуться в лобби</button>
      </div>
    </div>

    <div v-if="connection && !connection.connected && connection.reconnecting" class="connection-overlay">
      <div class="connection-overlay__content">Соединение с сервером разорвано, идет попытка переподключения...</div>
    </div>

    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return { error: '' };
  },
  watch: {
    lobbyDataLoaded() {
      this.$root.state.viewLoaded = true;
    },
    'userData.avatars.code': function () {
      // !!! перенести в generateAvatar с добавлением кнопки перехода в профиль
      prettyAlert(
        { message: 'Новые аватары подготовлены и добавлены в галерею. Перейдите в профиль для просмотра.' },
        { hideTime: 0 }
      );
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    connection() {
      return this.state.connection || null;
    },
    store() {
      return this.state.store || {};
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser];
      return { id: this.state.currentUser, ...(currentUserData || {}) };
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    lobbyDataLoaded() {
      return !!this.lobby.code;
    },
    viewLoaded() {
      return this.$root.state.viewLoaded;
    },
    isGameRoute() {
      return this.$route && this.$route.path.startsWith('/game');
    },
  },
  methods: {
    async returnToLobby() {
      this.$router.push({ path: '/' }).catch((err) => console.error(err));
    },
    toggleFullscreen() {
      if (!this.state.isFullscreen) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
      this.state.isFullscreen = !this.state.isFullscreen;
    },
  },
  created() {
    window.addEventListener('keydown', (event) => {
      if (event.key == 'F11') {
        // по дефолту F11 не выставляет document.fullscreenElement
        event.preventDefault();
        prettyAlert({
          message: 'Для перехода в полноэкранный режим нажмите кнопку в левом верхнем углу экрана',
        });
        // в firefox ошибка "Fullscreen request denied"
        // this.toggleFullscreen();
      }
    });
  },
  mounted() {
    const self = this;
    window.prettyAlert = ({ message, stack } = {}) => {
      if (message === 'Forbidden') {
        // стандартный ответ impress при доступе к запрещенному ресурсу (скорее всего нужна авторизация)
      } else {
        // alert(message);
        self.error = message;
      }
    };
  },
};
</script>

<style lang="scss">
body {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: fixed;
  left: 0px;
  top: 0px;
  height: 100%;
  width: 100%;

  &.game-loading {
    &:before {
      content: 'Идет загрузка игры';
      color: #f4e205;
      line-height: 36px;
    }
  }
}

#app > .exit {
  width: 100%;
  > button {
    width: 110px;
    padding: 2px 0px;
    border-radius: 4px;
    border: 1px solid #f4e205;
    background: transparent;
    color: #f4e205;

    &:hover {
      cursor: pointer;
      opacity: 0.8;
    }
  }
}

.fullscreen-btn {
  position: fixed !important;
  z-index: 1000;
  left: 20px;
  top: 10px;
  button {
    width: 110px;
    font-size: 10px;
    color: #f4e205;
    border-radius: 4px;
    border: 1px solid #f4e205;
    padding: 2px 0px;
    background-color: black;
    background-size: 50px;
    background-repeat: no-repeat;
    background-position: center;
    margin: auto;
    cursor: pointer;
    opacity: 1;

    svg {
      padding-right: 4px;
    }
  }
  :hover {
    opacity: 0.7;
  }

  &.tutorial-active {
    box-shadow: 0 0 10px 10px #f4e205;
    z-index: 100000 !important;
  }
}

.connection-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.connection-overlay__content {
  color: #ffffff;
  font-size: 20px;
  max-width: 800px;
}
#app.game-loaded {
  .fullscreen-btn {
    left: max(10%, 130px);
  }
}

#app.mobile-view .fullscreen-btn {
  left: 70px;
}

#app[current-route='Lobby'] .fullscreen-btn {
  left: 10px;
}

.show-with-delay {
  animation: 2s fadeIn;
  animation-fill-mode: forwards;
  visibility: hidden;
}

@keyframes fadeIn {
  99% {
    visibility: hidden;
  }

  100% {
    visibility: visible;
  }
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

button[disabled='disabled'] {
  opacity: 0.5;
}

.fancybox__container .fancybox__toolbar {
  position: absolute;
  height: 100%;
  width: 100%;
}

.fancybox__container .fancybox__toolbar .fancybox__toolbar__column.is-middle {
  position: absolute;
  bottom: 100px;
  width: 100%;
}

.fancybox__container.has-toolbar.is-compact .fancybox__toolbar__column.is-middle {
  bottom: 80px;
}

.fancybox__container.has-toolbar .fancybox__toolbar .choose-btn {
  background-color: #f4e205;
  margin-top: 10px;
  padding: 0px 10px;
  white-space: nowrap;
  color: black;
  text-transform: uppercase;
  position: absolute;
  bottom: 20%;
  left: 0px;
  width: 200px;
  left: calc(50% - 100px);

  background: #f4e205;
  border: 2px solid #f4e205;
  color: black;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.fancybox__container.has-toolbar .fancybox__toolbar .choose-btn:active {
  opacity: 0;
}

.fancybox__container.has-toolbar .fancybox__toolbar .choose-btn:after {
  content: '';
  background: #837800;
  display: block;
  position: absolute;
  padding-top: 25%;
  padding-left: 120%;
  opacity: 0;
  transition: all 0.8s;
}

.fancybox__container.has-toolbar .fancybox__toolbar .choose-btn:active:after {
  padding: 0;
  margin: 0;
  opacity: 1;
  transition: 0s;
}

.fancybox__container .fancybox__content img.new {
  outline: 4px solid gold;
}

.fancybox__container .fancybox__content label {
  color: gold;
  font-size: 24px;
  position: absolute;
  top: 10px;
  left: 10px;
  font-weight: bold;
  text-transform: uppercase;
}
</style>
