<template>
  <!-- 主内容区：keep-alive 缓存 + router-view -->
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <!--
        keep-alive 缓存说明：
        - cachedViews 来自 tagsView 模块（访问过的且 meta.noCache !== true 的页面）
        - include 匹配的是组件的 name，因此业务页面必须声明 name 与路由 name 一致
        - key 用 $route.fullPath，支持同组件不同参数页共存（如详情页 /archive/detail/1 与 /archive/detail/2）
      -->
      <keep-alive :include="cachedViews">
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </section>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'AppMain',
  computed: {
    ...mapState('tagsView', {
      cachedViews: state => state.cachedViews
    }),
    key() {
      return this.$route.fullPath
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  // 头部导航50 + 标签页34 = 84px；fixed-header 时需要预留
  height: calc(100vh - 60px);
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f0f2f5;
  padding: 12px;
  box-sizing: border-box;
}

// 页面切换过渡动画
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

<style lang="scss">
// 修复 fixed-header 下内容区顶部被遮挡的问题
.fixed-header + .app-main {
  padding-top: 40px;
}
</style>
