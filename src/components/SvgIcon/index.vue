<template functional>
  <!-- 通用 SVG 图标组件（配合 svg-sprite-loader 使用） -->
  <i :class="['iconfont', 'icon-' + props.iconClass]" />
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    iconClass: { type: String, required: true },
    className: { type: String, default: '' }
  }
}
</script>

<style scoped>
.iconfont {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
