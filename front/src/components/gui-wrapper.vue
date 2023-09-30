<template>
  <div class="gui-wrapper scroll-off" :style="wrapperCustomStyle">
    <div :class="['gui-resizeable', `scale-${state.guiScale}`, ...contentClass]" :style="contentCustomStyle">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'gui-wrapper',
  props: {
    margin: {
      type: Number,
      default: 10,
    },
    pos: Array,
    offset: Object,
    wrapperStyle: Object,
    contentClass: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    wrapperCustomStyle() {
      const style = {};
      if (this.pos.includes('top')) style.top = '0px';
      if (this.pos.includes('bottom')) style.bottom = '0px';
      if (this.pos.includes('left')) style.left = '0px';
      if (this.pos.includes('right')) style.right = '0px';
      return { ...style, ...this.wrapperStyle };
    },
    contentCustomStyle() {
      const { margin, offset: { top, bottom, left, right } = {} } = this;
      const style = {};
      if (this.pos.includes('top')) style.top = margin + (top || 0) + 'px';
      if (this.pos.includes('bottom')) style.bottom = margin + (bottom || 0) + 'px';
      if (this.pos.includes('left')) style.left = margin + (left || 0) + 'px';
      if (this.pos.includes('right')) style.right = margin + (right || 0) + 'px';
      style.transformOrigin = this.pos.join(' ');
      return style;
    },
  },
};
</script>
<style scoped>
.gui-wrapper {
  position: absolute;
  height: 0px;
  width: 100%;
}
.gui-resizeable {
  position: absolute;
  height: auto;
  width: auto;
}
</style>
