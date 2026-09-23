<template>
  <!-- 侧边栏：基于 Vuex permission.routes 自动生成菜单 -->
  <div class="sidebar-container">
    <!-- Logo 区域 -->
    <!-- <div class="sidebar-logo" :class="{ collapse: isCollapse }">
      <router-link to="/dashboard">
        <i class="el-icon-s-management sidebar-logo-icon" />
        <h1 v-if="!isCollapse" class="sidebar-title">{{ title }}</h1>
      </router-link>
    </div> -->

    <!-- el-menu 菜单（折叠时 mouseOut 展开弹层，与收起态配合） -->
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        :unique-opened="true"
        mode="vertical"
      >
        <!-- 递归渲染菜单项（支持多级） -->
        <sidebar-item
          v-for="route in permissionRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
          :is-collapse="isCollapse"
        />
      </el-menu>
    </el-scrollbar>

    <!-- 底部收缩/展开按钮 -->
    <div class="sidebar-toggle" @click="toggleSideBar">
      <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'" />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import SidebarItem from './SidebarItem.vue'

// 菜单颜色（webpack 5 下 scss 变量文件无 JS 导出，此处直接定义，与 variables.scss 保持一致）
const menuVariables = {
  menuBg: '#fff',
  menuText: '#303133',
  menuActiveText: '#409EFF'
}

export default {
  name: 'Sidebar',
  components: { SidebarItem },
  computed: {
    ...mapState('permission', {
      permissionRoutes: state => state.routes // 用户可访问的路由表
    }),
    ...mapGetters(['sidebar', 'device']),
    // 当前激活菜单：支持详情页通过 meta.activeMenu 高亮指定菜单
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      return meta && meta.activeMenu ? meta.activeMenu : path
    },
    // 折叠状态（移动端强制折叠）
    isCollapse() {
      return !this.sidebar.opened || this.device === 'mobile'
    },
    title() {
      return process.env.VUE_APP_TITLE || '电子档案管理系统'
    },
    variables() {
      return menuVariables
    }
  },
  methods: {
    // 切换侧边栏收起/展开
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  // Logo
  .sidebar-logo {
    position: relative;
    height: 50px;
    line-height: 50px;
    background: #fff;
    text-align: center;
    overflow: hidden;
    border-bottom: 1px solid #f0f2f5;

    a {
      display: inline-flex;
      align-items: center;
      width: 100%;
      height: 100%;
      justify-content: center;

      .sidebar-logo-icon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
        color: #409eff;
      }
    }

    .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #383838;
      font-weight: 600;
      font-size: 14px;
      vertical-align: middle;
    }

    &.collapse {
      .sidebar-logo-icon {
        margin-right: 0;
      }
    }
  }

  // 底部收缩/展开按钮
  .sidebar-toggle {
    flex-shrink: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #f0f2f5;
    cursor: pointer;
    color: #606266;
    font-size: 18px;
    transition: color 0.2s, background 0.2s;

    &:hover {
      color: #409eff;
      background: #f5f7fa;
    }
  }

  // el-menu 覆盖（去掉默认右边框）
  ::v-deep .el-menu {
    border-right: none;
  }
}
</style>
