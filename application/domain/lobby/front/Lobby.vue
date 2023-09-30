<template>
  <lobby :customInitSession="customInitSession" />
</template>

<script>
import Lobby from '~/lib/lobby/front/Lobby.vue';
export default {
  components: { Lobby },
  computed: {
    state() {
      return this.$root.state || {};
    },
  },
  methods: {
    async customInitSession() {
      await this.$root.initSessionIframe();
    },
  },
  created() {
    this.state.emit.logout = async () => {
      window.parent.postMessage({ emit: { name: 'hideGameIframe' } }, '*');
    };
  },
  async beforeDestroy() {},
};
</script>
<style lang="scss">
#lobby {
  // чтобы не мельтешил при загрузке игры
  display: none !important;
}
</style>
