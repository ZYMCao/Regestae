<template>
  <!-- 顶部导航栏：折叠按钮 + 面包屑 + 右侧用户区 -->
  <div class="navbar">
    <!-- 侧边栏折叠/展开按钮（使用 app 模块的 toggleSideBar action） -->
    <hamburger
      :is-active="sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    />

    <!-- 面包屑：基于 $route.matched 自动生成 -->
    <breadcrumb class="breadcrumb-container" />

    <!-- 右侧操作区 -->
    <div class="right-menu">
      <!-- 全屏切换 -->
      <screenfull class="right-menu-item hover-effect" />

      <!-- 用户下拉菜单 -->
      <el-dropdown class="avatar-container" trigger="click" @command="handleCommand">
        <div class="avatar-wrapper">
          <span class="avatar-text">{{ name || '用户' }}</span>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <el-dropdown-item command="profile">
            <i class="el-icon-user" /> 个人中心
          </el-dropdown-item>
          <el-dropdown-item command="password">
            <i class="el-icon-key" /> 修改密码
          </el-dropdown-item>
          <el-dropdown-item divided command="logout">
            <i class="el-icon-switch-button" /> 退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Hamburger from '@/components/Hamburger/index.vue'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Screenfull from '@/components/Screenfull/index.vue'

export default {
  name: 'Navbar',
  components: { Hamburger, Breadcrumb, Screenfull },
  computed: {
    ...mapGetters(['sidebar', 'name'])
  },
  methods: {
    // 切换侧边栏（调用 Vuex app 模块 action）
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },

    // 下拉菜单命令分发
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/profile/index')
          break
        case 'password':
          this.$router.push('/password/index')
          break
        case 'logout':
          this.handleLogout()
          break
      }
    },

    // 退出登录：二次确认 → 调用 user/logout action → 回登录页（带当前地址）
    async handleLogout() {
      const confirmed = await this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => true).catch(() => false)

      if (!confirmed) return

      await this.$store.dispatch('user/logout')

      // 回登录页并带上 redirect，登录成功后跳回当前页
      this.$router.push(`/login?redirect=${encodeURIComponent(this.$route.fullPath)}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;
    padding: 0 10px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      margin-left: 10px;
      cursor: pointer;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        color: #5a5e66;

        .avatar-text {
          font-size: 14px;
          margin-right: 4px;
        }
      }
    }
  }
}
</style>
