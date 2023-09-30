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
  window.tokenName = 'smartgames.session.token';

  const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
  // направление на конкретный port нужно для reconnect (см. initSession) + для отладки
  const port = new URLSearchParams(location.search).get('port') || serverFrontConfig.port;

  const serverHost =
    process.env.NODE_ENV === 'development' || new URLSearchParams(document.location.search).get('dev')
      ? `${location.hostname}:${port}`
      : `${location.hostname}/api`;

  const metacom = Metacom.create(`${protocol}://${serverHost}`);
  const { api } = metacom;
  window.metacom = metacom;
  window.api = api;
  window.iframeEvents = [];

  await metacom.load('action');

  const state = {
    serverOrigin: `${location.protocol}//${serverHost}`,
    isMobile: false,
    isLandscape: true,
    isPortrait: false,
    isFullscreen: false,
    guiScale: 1,
    store: {},
    emit: {
      updateStore(data) {
        mergeDeep({ target: state.store, source: data });
      },
      alert(data) {
        prettyAlert(data);
      },
      logout() {
        window.app.$set(window.app.$root.state, 'currentUser', '');
        localStorage.removeItem(window.tokenName);
        router.push({ path: `/` }).catch((err) => {
          console.log(err);
        });
      },
    },
  };

  api.action.on('emit', ({ eventName, data }) => {
    const event = state.emit[eventName];
    if (!event) return console.error(`event "${eventName}" not found`);
    event(data);
  });

  window.addEventListener('message', async function (e) {
    const { path, args, routeTo, emit } = e.data;
    if (path && args) return await api.action.call({ path, args }).catch((err) => prettyAlert(err));
    if (routeTo)
      return router.push({ path: routeTo }).catch((err) => {
        console.log(err);
      });
    if (emit) {
      const { name: eventName, data } = emit;
      const event = state.emit[eventName];
      if (!event) return console.error(`event "${eventName}" not found`);
      return await event(data);
    }
  });

  router.beforeEach((to, from, next) => {
    state.currentRoute = to.name;
    return next();
  });

  const mixin = {
    methods: {
      async initSession(config, handlers) {
        if (arguments.length < 2) {
          handlers = config;
          config = {};
        }
        const { login, password, demo } = config || {};
        const { success: onSuccess, error: onError } = handlers;

        const token = localStorage.getItem(window.tokenName);
        const session =
          (await api.action
            .public({
              path: 'user.api.initSession',
              args: [
                {
                  token,
                  windowTabId: window.name,
                  login,
                  password,
                  demo,
                },
              ],
            })
            .catch(async (err) => {
              if (typeof onError === 'function') await onError(err);
            })) || {};

        const { token: sessionToken, userId, reconnect } = session;
        if (reconnect) {
          const { workerId, ports } = reconnect;
          const port = ports[workerId.substring(1) * 1 - 1];
          location.href = `${location.origin}?port=${port}`;
          return;
        }

        this.$set(this.$root.state, 'currentToken', sessionToken);
        if (sessionToken && sessionToken !== token) localStorage.setItem(window.tokenName, sessionToken);
        if (userId) {
          this.$set(this.$root.state, 'currentUser', userId);
          if (typeof onSuccess === 'function') await onSuccess(session);
        }
      },
      async initSessionIframe() {
        const searchParams = new URLSearchParams(document.location.search);
        const userId = searchParams.get('userId');
        const lobbyId = searchParams.get('lobbyId');
        const token = searchParams.get('token');

        await api.action.public({
          path: 'user.api.initSession',
          args: [
            {
              ...{ token, userId, lobbyId },
              windowTabId: window.name,
            },
          ],
        });

        this.$set(this.$root.state, 'currentUser', userId);
        this.$set(this.$root.state, 'currentLobby', lobbyId);
        this.$set(this.$root.state, 'lobbyOrigin', searchParams.get('lobbyOrigin'));

        if (window !== window.parent) {
          const iframeCode = searchParams.get('iframeCode');
          window.parent.postMessage({ emit: { name: 'iframeAlive', data: { iframeCode } } }, '*');
        }
      },
    },
  };
  window.state = state;
  window.app = new Vue({
    router,
    mixins: [mixin],
    data: { state },
    render: function (h) {
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
    state.isMobile = isMobile() ? true : false;
    state.isLandscape = height < width;
    state.isPortrait = !state.isLandscape;
    state.guiScale = width < 1000 ? 1 : width < 1500 ? 2 : width < 2000 ? 3 : width < 3000 ? 4 : 5;
    state.isFullscreen = document.fullscreenElement ? true : false;
  };

  // window.addEventListener('orientationchange', async () => {
  //   console.log("orientationchange");
  //   store.dispatch('setSimple', { isLandscape: await isLandscape() });
  // });
  window.addEventListener('resize', checkDevice);
  checkDevice();

  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });
};

init();
