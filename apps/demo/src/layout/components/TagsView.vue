<template>
  <!-- 标签页导航：记录访问过的页面，支持切换、关闭、右键菜单 -->
  <div class="tags-view-container">
    <el-scrollbar wrap-class="scrollbar-wrapper" class="scroll-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :class="isActive(tag) ? 'active' : ''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        @click.middle.native="closeSelectedTag(tag)"
      >
        {{ tag.title }}
        <span
          v-if="!isAffix(tag)"
          class="el-icon-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        />
      </router-link>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'TagsView',
  computed: {
    ...mapState('tagsView', {
      visitedViews: state => state.visitedViews
    })
  },
  watch: {
    // 路由变化时：添加标签 + 滚动到当前标签
    $route() {
      this.addTags()
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
  },
  methods: {
    isActive(route) {
      return route.path === this.$route.path
    },
    // affix 标签（如首页）固定不可关闭
    isAffix(tag) {
      return tag.meta && tag.meta.affix
    },

    initTags() {
      // 初始化时把所有 affix 标签加入（传入 permission 模块维护的完整路由表）
      this.$store.dispatch('tagsView/initAffixTags', this.$store.state.permission.routes)
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
      return false
    },
    closeSelectedTag(view) {
      // affix 标签（首页）固定不可关闭
      if (this.isAffix(view)) return
      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        // 如果关闭的是当前标签，自动跳转到最后一个标签
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
    },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView.fullPath || latestView.path)
      } else {
        // 没有任何标签时回首页（守卫会将 / 重定向到 /dashboard）
        this.$router.push('/')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);

  .scroll-wrapper {
    white-space: nowrap;
  }

  .tags-view-item {
    display: inline-block;
    position: relative;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    border: 1px solid #d8dce5;
    color: #495060;
    background: #fff;
    padding: 0 8px;
    font-size: 12px;
    margin-left: 5px;
    margin-top: 4px;

    &:first-of-type {
      margin-left: 15px;
    }

    &:last-of-type {
      margin-right: 15px;
    }

    &.active {
      background-color: #409eff;
      color: #fff;
      border-color: #409eff;

      &::before {
        content: '';
        background: #fff;
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 4px;
      }
    }

    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transform-origin: 100% 50%;

      &:hover {
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>
