<template>
  <!-- 渲染单个菜单的图标 + 标题 -->
  <span class="menu-item">
    <i v-if="icon" :class="icon" class="menu-item-icon" />
    <span v-if="showTitle" slot="title" class="menu-item-title">{{ title }}</span>
  </span>
</template>

<script>
export default {
  name: 'MenuItem',
  functional: false,
  props: {
    icon: { type: String, default: '' },
    title: { type: String, default: '' },
    // 是否显示标题
    showTitle: { type: Boolean, default: true }
  }
}
</script>

<style lang="scss" scoped>
.menu-item {
  display: inline-flex;
  align-items: center;
  .menu-item-icon {
    margin-right: 8px;
    font-size: 16px;
  }
}
</style>
