<template>
  <!-- 整体布局容器：系统标题栏 + (侧边栏 + 顶部导航 + 标签页 + 主内容区) -->
  <div :class="classObj" class="app-wrapper">
    <!-- 系统标题栏：Logo + 系统名称 + 项目切换/消息通知/快捷入口 -->
    <div class="system-header">
      <!-- 左侧：Logo + 系统名称 -->
      <div class="header-left">
        <i class="el-icon-bank header-logo" />
        <h1 class="header-title">{{ title }}</h1>
      </div>

      <!-- 右侧操作区 -->
      <div class="header-right">
        <!-- 所属项目/参建单位切换 -->
        <div class="project-switcher">
          <span class="project-tag">建设</span>
          <span class="project-name">{{ projectName }}</span>
          <el-button class="switch-btn" size="mini" @click="handleSwitchProject" style="padding-top: 1px;">切换</el-button>
        </div>

        <!-- 消息通知 -->
        <i class="el-icon-bell header-icon" @click="handleNotice" />
        <!-- 快捷入口 -->
        <quick-entry-popover />
      </div>
    </div>

    <!-- 项目/单位切换弹窗 -->
    <project-switch-dialog :visible.sync="projectSwitchVisible" @confirm="handleProjectConfirm" />

    <!-- 消息中心弹窗 -->
    <message-center-dialog :visible.sync="messageCenterVisible" />

    <!-- 标题栏下方：侧边栏 + 主区域 -->
    <div class="app-body">
      <!-- 侧边栏 -->
      <sidebar class="sidebar-container" />

      <!-- 右侧主体区域 -->
      <div class="main-container">
        <div :class="{ 'fixed-header': fixedHeader }">
          <!-- 顶部导航栏 -->
          <!-- <navbar /> -->
          <!-- 标签页导航 -->
          <tags-view v-if="needTagsView" />
        </div>
        <!-- 主内容区 -->
        <app-main />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView.vue'
import AppMain from './components/AppMain.vue'
import ProjectSwitchDialog from './components/ProjectSwitchDialog.vue'
import MessageCenterDialog from './components/MessageCenterDialog.vue'
import QuickEntryPopover from './components/QuickEntryPopover.vue'

export default {
  name: 'Layout',
  components: { Sidebar, Navbar, TagsView, AppMain, ProjectSwitchDialog, MessageCenterDialog, QuickEntryPopover },
  data() {
    return {
      fixedHeader: true,   // 头部是否固定
      needTagsView: true,  // 是否显示标签页导航
      // 系统标题（与环境变量保持一致）
      title: import.meta.env.VITE_TITLE || '电子档案管理系统',
      // 当前所属项目/参建单位（切换后更新显示）
      projectName: '柯桥至诸暨高速公路工程.绍兴市柯诸高速公路有限公司',
      projectSwitchVisible: false, // 项目切换弹窗显隐
      messageCenterVisible: false  // 消息中心弹窗显隐
    }
  },
  computed: {
    ...mapState({
      sidebar: state => state.app.sidebar,
      device: state => state.app.device
    }),
    // 根据状态拼接 class，控制侧边栏展开/收起动画
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    }
  },
  methods: {
    // 移动端点击遮罩关闭侧边栏
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    },

    // 打开项目/单位切换弹窗
    handleSwitchProject() {
      this.projectSwitchVisible = true
    },

    // 弹窗确认：更新头部显示的项目/单位名称
    handleProjectConfirm({ mode, project, contract, unit }) {
      if (mode === 'build') {
        const contractSuffix = contract ? '.' + contract.name : ''
        this.projectName = (project ? project.name : '') + '.' + (project ? project.unit : '') + contractSuffix
      } else {
        this.projectName = unit ? unit.name : this.projectName
      }
    },

    // 打开消息中心弹窗
    handleNotice() {
      this.messageCenterVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

// 系统标题栏：通栏固定在页面最顶部
.system-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 20px;
  background: linear-gradient(90deg, #2e7bf0 0%, #3d8bfa 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 40, 100, 0.15);

  .header-left {
    display: flex;
    align-items: center;
    min-width: 0;

    .header-logo {
      font-size: 30px;
      margin-right: 10px;
    }

    .header-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 1px;
      white-space: nowrap;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  // 项目/单位切换器
  .project-switcher {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 8px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    margin-right: 28px;

    .project-tag {
      flex-shrink: 0;
      line-height: 20px;
      padding: 0 6px;
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 3px;
      font-size: 12px;
      margin-right: 8px;
    }

    .project-name {
      max-width: 420px;
      margin-right: 12px;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .switch-btn {
      padding: 5px 14px;
      background: #fff;
      border: none;
      color: #2e7bf0;
      font-size: 13px;

      &:hover,
      &:focus {
        color: #5a9cf9;
        background: #f0f6ff;
      }
    }
  }

  .header-icon {
    font-size: 20px;
    color: #fff;
    cursor: pointer;
    margin-left: 24px;

    &:hover {
      opacity: 0.85;
    }
  }
}

// 标题栏下方区域：侧边栏 + 主内容
.app-body {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  // 预留系统标题栏高度（fixed 定位不占文档流）
  margin-top: 60px;
}

// 移动端遮罩
.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

// 固定头部：从系统标题栏下方开始（标题栏60 + 导航50 + 标签页34 + 间距12）
.fixed-header {
  position: fixed;
  top: 60px;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  transition: width 0.28s;
}

// 侧边栏收起时头部宽度跟随变化
.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.mobile .fixed-header {
  width: 100%;
}

// 小屏隐藏项目切换器（名称过长）
@media (max-width: 768px) {
  .project-switcher {
    display: none;
  }
}
</style>
