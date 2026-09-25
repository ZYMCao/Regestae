<template>
  <!--
    快捷入口弹出菜单（头部九宫格按钮触发）
    点击菜单项后自动收起；各项动作后续按需对接：
    - 借阅车徽标数暂写死，后续从后端获取
  -->
  <el-popover
    v-model="visible"
    placement="bottom-end"
    width="230"
    trigger="click"
    popper-class="quick-entry-popper"
  >
    <!-- 触发图标：头部九宫格 -->
    <i slot="reference" class="el-icon-s-grid quick-entry-trigger" />

    <ul class="quick-menu">
      <li
        v-for="entry in entries"
        :key="entry.key"
        class="quick-menu-item"
        :class="{ 'is-logout': entry.key === 'logout' }"
        @click="handleCommand(entry.key)"
      >
        <i :class="entry.icon" class="item-icon" />
        <span class="item-label">{{ entry.label }}</span>
        <!-- 借阅车徽标 -->
        <span v-if="entry.key === 'borrowCart' && borrowCount > 0" class="item-badge">{{ borrowCount }}</span>
      </li>
    </ul>
  </el-popover>
</template>

<script>
export default {
  name: 'QuickEntryPopover',
  data() {
    return {
      visible: false,
      borrowCount: 4, // 借阅车数量（暂写死，后续对接后端）
      entries: [
        { key: 'identity', icon: 'el-icon-user', label: '柯诸业主主测试(勿选)' },
        { key: 'borrowCart', icon: 'el-icon-shopping-cart-full', label: '借阅车' },
        { key: 'favorite', icon: 'el-icon-star-off', label: '收藏' },
        { key: 'help', icon: 'el-icon-question', label: '帮助' },
        { key: 'password', icon: 'el-icon-key', label: '修改密码' },
        { key: 'theme', icon: 'el-icon-moon', label: '切换菜单主题' },
        { key: 'logout', icon: 'el-icon-switch-button', label: '退出登录' }
      ]
    }
  },
  methods: {
    // 收起弹层
    close() {
      this.visible = false
    },

    // 菜单命令分发
    async handleCommand(key) {
      this.close()

      switch (key) {
        case 'identity':
          this.$message.info('身份切换功能开发中')
          break
        case 'borrowCart':
          this.$message.info('借阅车功能开发中')
          break
        case 'favorite':
          this.$message.info('收藏功能开发中')
          break
        case 'help':
          this.$message.info('帮助功能开发中')
          break
        case 'password':
          this.$router.push('/password/index')
          break
        case 'theme':
          this.$message.info('菜单主题切换功能开发中')
          break
        case 'logout':
          await this.handleLogout()
          break
      }
    },

    // 退出登录：二次确认 → 注销 → 回登录页
    async handleLogout() {
      const confirmed = await this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => true).catch(() => false)

      if (!confirmed) return

      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${encodeURIComponent(this.$route.fullPath)}`)
    }
  }
}
</script>

<style lang="scss" scoped>
// 触发图标（与头部其他图标一致）
.quick-entry-trigger {
  font-size: 20px;
  color: #fff;
  cursor: pointer;
  margin-left: 24px;

  &:hover {
    opacity: 0.85;
  }
}

// 菜单列表
.quick-menu {
  margin: 0 -12px; // 抵消 popover body 内边距，使菜单项通栏
  padding: 0;
  list-style: none;

  .quick-menu-item {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    cursor: pointer;
    color: #303133;
    font-size: 14px;

    &:hover {
      background: #f5f7fa;
    }

    .item-icon {
      width: 20px;
      margin-right: 10px;
      font-size: 15px;
      color: #909399;
      text-align: center;
    }

    .item-label {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // 借阅车红色徽标
    .item-badge {
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: #f56c6c;
      color: #fff;
      font-size: 12px;
      text-align: center;
    }

    // 退出登录：红色高亮
    &.is-logout {
      color: #303133;

      .item-icon {
        color: #303133;
      }

      &:hover {
        color: #f56c6c;
        background: #fef0f0;

        .item-icon {
          color: #f56c6c;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 弹层渲染在 body 下，需全局样式
.quick-entry-popper {
  padding: 8px 12px;
}
</style>
