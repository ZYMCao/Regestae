<template>
  <!--
    消息中心弹窗（头部铃铛按钮触发）
    - 顶部：标题 + 最大化切换 + 关闭
    - Tab："我的下载"（当前唯一入口，后续可扩展更多消息类别）
    - 列表：序号 / 模块操作 / 名称 / 信息 / 操作
    数据当前为本地模拟，后续对接后端消息接口时替换 MOCK_MESSAGES
  -->
  <el-dialog
    :visible="visible"
    :width="isMaximized ? '96%' : '860px'"
    :top="isMaximized ? '2vh' : '8vh'"
    custom-class="message-center-dialog"
    :close-on-click-modal="false"
    @update:visible="handleVisibleChange"
  >
    <!-- 自定义头部：标题 + 最大化/还原 + 关闭 -->
    <template slot="title">
      <div class="dialog-header">
        <span class="dialog-title">消息中心</span>
        <span class="header-tools">
          <i
            :class="isMaximized ? 'el-icon-copy-document' : 'el-icon-full-screen'"
            class="header-tool-icon"
            :title="isMaximized ? '还原' : '最大化'"
            @click="isMaximized = !isMaximized"
          />
          <i class="el-icon-close header-tool-icon" title="关闭" @click="close" />
        </span>
      </div>
    </template>

    <!-- 消息类别 Tab -->
    <div class="message-tabs">
      <el-button
        size="small"
        class="tab-btn"
        :class="{ 'is-active': activeTab === 'download' }"
        @click="activeTab = 'download'"
      >我的下载</el-button>
    </div>

    <!-- 消息列表 -->
    <el-table
      :data="filteredMessages"
      border
      height="380"
      empty-text="暂无数据"
      class="message-table"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="module" label="模块操作" min-width="120" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="info" label="信息" min-width="240" show-overflow-tooltip />
      <el-table-column label="操作" width="90" align="center">
        <template slot-scope="{ row }">
          <el-button type="text" @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部：关闭按钮 -->
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="close">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
// 本地模拟数据：后续对接后端消息接口时替换
const MOCK_MESSAGES = []

export default {
  name: 'MessageCenterDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'download', // 当前消息类别：download 我的下载
      messages: MOCK_MESSAGES,
      isMaximized: false     // 弹窗最大化状态（标题栏方块图标切换）
    }
  },
  computed: {
    // 按当前 Tab 过滤消息（后续增加类别时在此扩展）
    filteredMessages() {
      return this.activeTab === 'download' ? this.messages : []
    }
  },
  methods: {
    // 转发 el-dialog 的 visible 同步（点击遮罩/ESC 关闭）
    handleVisibleChange(val) {
      this.$emit('update:visible', val)
    },

    // 查看消息详情（后续对接详情页/附件下载）
    handleView(row) {
      this.$message.info(`查看消息：${row.name}`)
    },

    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .message-center-dialog {
  max-width: 98%;

  .el-dialog__header {
    padding: 14px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 14px 20px;
  }

  .el-dialog__footer {
    padding: 10px 20px 14px;
    border-top: 1px solid #ebeef5;
  }
}

// 自定义头部：标题左对齐，工具按钮右对齐
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .header-tools {
    display: flex;
    align-items: center;
  }

  .header-tool-icon {
    margin-left: 16px;
    font-size: 16px;
    color: #606266;
    cursor: pointer;

    &:hover {
      color: #409eff;
    }
  }
}

// 消息类别 Tab（蓝色选中）
.message-tabs {
  margin-bottom: 12px;

  .tab-btn {
    background: #fff;
    border-color: #dcdfe6;
    color: #303133;

    &.is-active {
      background: #3d8bfa;
      border-color: #3d8bfa;
      color: #fff;
    }
  }
}

// 消息列表：浅蓝表头
.message-table {
  ::v-deep th {
    background: #dce9fb;
    color: #303133;
    font-weight: 600;
  }
}
</style>
