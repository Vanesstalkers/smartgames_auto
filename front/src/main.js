import Vue from 'vue';
import App from './App.vue';
import router from './router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { Metacom } from '../lib/metacom.js';
import { mergeDeep } from '../lib/utils.js';

// взять config.server.balancer не могу, потому что там неимпортируемый формат
import serverFrontConfig from './../../application/config/front.json';

library.add(fas, far, fab);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;

const init = async () => {
  if (!window.name) window.name = Date.now() + Math.random();

  window.tokenName = 'smartgames.session.token-' + location.host + location.pathname;
  if (window.tokenName.endsWith('/')) window.tokenName = window.tokenName.slice(0, -1);

  const protocol = location.protocol === 'http:' ? 'ws' : 'wss';

  const serverHost =
    process.env.NODE_ENV === 'development' || new URLSearchParams(document.location.search).get('dev')
      ? `${location.hostname}:${serverFrontConfig.port}`
      : `${location.hostname + location.pathname}api/`;

  const metacom = Metacom.create(`${protocol}://${serverHost}`);
  metacom.on('error', (err) => {
    console.log({ err });
  });
  const { api } = metacom;
  window.metacom = metacom;
  window.api = api;

  await metacom.load('action');

  class StoreQueue {
    constructor(getTarget) {
      this.queue = [];
      this.processing = false;
      this.getTarget = getTarget;
    }

    push(data) {
      this.queue.push(data);
      this.process();
    }

    process() {
      if (this.processing || this.queue.length === 0) return;
      this.processing = true;
      const data = this.queue.shift();
      mergeDeep({ target: this.getTarget(), source: data });
      this.processing = false;
      if (this.queue.length > 0) {
        Promise.resolve().then(() => this.process());
      }
    }
  }

  let reconnectPollTimer = null;

  const startReconnectPolling = () => {
    if (reconnectPollTimer) return;
    reconnectPollTimer = setInterval(async () => {
      if (metacom.connected) {
        clearInterval(reconnectPollTimer);
        reconnectPollTimer = null;
        return;
      }
      try {
        const response = await fetch(`${location.protocol}//${serverHost}`, {
          method: 'HEAD',
          cache: 'no-store',
        });
        if (response.ok) {
          try {
            await metacom.open();
          } catch (err) {
            console.log(err);
          }
        }
      } catch (err) {
        // сервер всё ещё недоступен, просто ждём следующую попытку
      }
    }, 5000);
  };

  const stopReconnectPolling = () => {
    if (!reconnectPollTimer) return;
    clearInterval(reconnectPollTimer);
    reconnectPollTimer = null;
  };

  const state = {
    serverOrigin: `${location.protocol}//${serverHost}`,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    isMobile: false,
    isLandscape: true,
    isPortrait: false,
    iframeMode: window !== window.parent,
    isFullscreen: false,
    gamePlaneNeedUpdate: false,
    guiScale: 1,
    store: {},
    connection: {
      connected: metacom.connected,
      reconnecting: false,
      lastError: null,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      reconnectAttempts: 0,
    },
    emit: {
      updateStore(data) {
        storeQueue.push(data);
      },
      alert(data, config) {
        window.prettyAlert(data, config);
      },
      returnToLobby() {
        router.push({ path: '/' }).catch((err) => console.error(err));
      },
    },
  };

  const storeQueue = new StoreQueue(() => state.store);

  metacom.on('open', () => {
    state.connection.connected = true;
    state.connection.reconnecting = false;
    state.connection.lastConnectedAt = Date.now();
    // если до этого уже было зафиксировано отключение, значит это восстановление соединения
    const hadDisconnect = state.connection.lastDisconnectedAt !== null;
    stopReconnectPolling();
    if (hadDisconnect) {
      // полная перезагрузка страницы после восстановления коннекта
      window.location.reload();
    }
  });

  metacom.on('close', () => {
    state.connection.connected = false;
    state.connection.reconnecting = true;
    state.connection.lastDisconnectedAt = Date.now();
    state.connection.reconnectAttempts += 1;
    startReconnectPolling();
  });

  metacom.on('error', (err) => {
    state.connection.lastError = err && err.message ? err.message : String(err);
  });

  api.action.on('emit', ({ eventName, data, config }) => {
    const event = state.emit[eventName];
    if (!event) return console.error(`event "${eventName}" not found`);
    event(data, config);
  });

  window.addEventListener('message', async (e) => {
    const { path, args, routeTo, emit } = e.data;
    if (path && args) {
      const result = await api.action.call({ path, args }).catch((err) => window.prettyAlert(err));

      if (result?.returnToLobby === true) {
        return router.push({ path: '/' }).catch((err) => location.reload());
      }
      if (result?.logout === true) {
        return await api.action.call({ path: 'lobby.api.logout' }).catch(window.prettyAlert);
      }
      return result;
    }

    if (routeTo) {
      return router.push({ path: routeTo }).catch((err) => {
        console.log(err);
      });
    }

    if (emit) {
      const { name: eventName, data, config } = emit;
      const event = state.emit[eventName];

      if (!event) return console.error(`event "${eventName}" not found`);

      return await event(data, config);
    }
  });

  router.beforeEach((to, from, next) => {
    state.currentRoute = to;
    return next();
  });

  window.state = state;
  window.app = new Vue({
    router,
    data: { state },
    render(h) {
      return h(App);
    },
  });

  window.app.$mount('#app');

  const { userAgent } = navigator;
  const isMobile = () =>
    userAgent.match(/Android/i) ||
    userAgent.match(/webOS/i) ||
    userAgent.match(/iPhone/i) ||
    userAgent.match(/iPad/i) ||
    userAgent.match(/iPod/i) ||
    userAgent.match(/BlackBerry/i) ||
    userAgent.match(/Windows Phone/i);

  const checkDevice = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    state.innerWidth = screen.width;
    state.innerHeight = screen.height;
    state.isMobile = !!isMobile();
    state.isLandscape = height < width;
    state.isPortrait = !state.isLandscape;
    state.guiScale = width < 1000 ? 1 : width < 1500 ? 2 : width < 2000 ? 3 : width < 3000 ? 4 : 5;
    state.isFullscreen = !!document.fullscreenElement;
  };

  // window.addEventListener('orientationchange', async () => {
  //   console.log("orientationchange");
  //   store.dispatch('setSimple', { isLandscape: await isLandscape() });
  // });
  window.addEventListener('resize', checkDevice);
  checkDevice();

  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
};

init();
