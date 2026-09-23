<template>
  <!-- 侧边栏折叠按钮：三条横线动画 -->
  <div
    :class="{ 'is-active': isActive }"
    class="hamburger"
    @click="toggleClick"
  >
    <span class="line line1" />
    <span class="line line2" />
    <span class="line line3" />
  </div>
</template>

<script>
export default {
  name: 'Hamburger',
  props: {
    // 是否激活（侧边栏展开状态）
    isActive: { type: Boolean, default: false }
  },
  methods: {
    // 触发父组件的切换事件
    toggleClick() {
      this.$emit('toggleClick')
    }
  }
}
</script>

<style lang="scss" scoped>
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;

  .line {
    display: block;
    width: 100%;
    height: 2px;
    background-color: #5a5e66;
    border-radius: 1px;
    transition: transform 0.3s, opacity 0.3s;
    margin: 2px 0;
  }

  // 激活态：中间隐藏，上下旋转成交叉
  &.is-active {
    .line1 {
      transform: translateY(6px) rotate(45deg);
    }
    .line2 {
      opacity: 0;
    }
    .line3 {
      transform: translateY(-6px) rotate(-45deg);
    }
  }
}
</style>
