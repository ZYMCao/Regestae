<template>
  <!-- 全屏切换按钮（原生 Fullscreen API，无需额外依赖） -->
  <div class="screenfull right-menu-item hover-effect" @click="toggle">
    <i :class="isFullscreen ? 'el-icon-copy-document' : 'el-icon-full-screen'" />
  </div>
</template>

<script>
export default {
  name: 'Screenfull',
  data() {
    return {
      isFullscreen: false
    }
  },
  mounted() {
    // 监听全屏状态变化（F11 退出等场景也能同步图标）
    document.addEventListener('fullscreenchange', this.handleChange)
  },
  beforeDestroy() {
    document.removeEventListener('fullscreenchange', this.handleChange)
  },
  methods: {
    handleChange() {
      this.isFullscreen = !!document.fullscreenElement
    },
    toggle() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
  }
}
</script>

<style scoped>
.screenfull {
  display: inline-block;
  cursor: pointer;
}
</style>
