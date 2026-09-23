<template>
  <!-- 首页：历史模块 + 统计条 + 待办表格（左） / 通知公告 + 常用模块（右） -->
  <div class="dashboard-container">
    <!-- ==================== 左侧主区域 ==================== -->
    <div class="dash-left">
      <!-- 历史模块：横向滚动卡片 -->
      <div class="panel history-panel">
        <div class="panel-header">
          <div class="panel-title">
            <i class="el-icon-s-grid title-icon" />
            <span>历史模块</span>
          </div>
          <!-- 非涉密平台警示语 -->
          <div class="secret-notice">
            本平台为互联网非涉密平台，严禁处理、传输国家秘密、工作秘密或敏感信息
          </div>
        </div>
        <div class="history-body">
          <i class="el-icon-arrow-left scroll-arrow" @click="scrollHistory(-1)" />
          <div ref="historyScroll" class="history-scroll">
            <div
              v-for="item in historyModules"
              :key="item.name"
              class="history-card"
              @click="handleHistoryClick(item)"
            >
              <i :class="['card-icon', item.icon]" />
              <div class="card-name">{{ item.name }}</div>
            </div>
          </div>
          <i class="el-icon-arrow-right scroll-arrow" @click="scrollHistory(1)" />
        </div>
      </div>

      <!-- 统计条：在线人数 / 已归档案卷 / 电子文件案卷 -->
      <div class="stat-row">
        <div class="stat-bar stat-green">
          <i class="el-icon-user stat-icon" />
          <div class="stat-text">
            <div class="stat-label">在线人数</div>
            <div class="stat-value">{{ stats.online }}</div>
          </div>
        </div>
        <div class="stat-bar stat-blue">
          <i class="el-icon-collection stat-icon" />
          <div class="stat-text">
            <div class="stat-label">已归档案卷/未归档案卷</div>
            <div class="stat-value">{{ stats.archived }}/{{ stats.unArchived }}</div>
          </div>
        </div>
        <div class="stat-bar stat-cyan">
          <i class="el-icon-document stat-icon" />
          <div class="stat-text">
            <div class="stat-label">电子文件案卷/数字化副本案卷</div>
            <div class="stat-value">{{ stats.eFile }}/{{ stats.digitalCopy }}</div>
          </div>
        </div>
      </div>

      <!-- 我的待办 / 我的申请 / 我参与的 / 整改通知 -->
      <div class="panel todo-panel">
        <div class="todo-tabs">
          <div
            v-for="tab in todoTabs"
            :key="tab.name"
            :class="['todo-tab', { active: activeTab === tab.name }]"
            @click="activeTab = tab.name"
          >
            <i :class="tab.icon" />
            <span>{{ tab.label }}（{{ tab.count }}）</span>
          </div>
        </div>
        <el-table
          :data="currentTableData"
          class="dash-table"
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column prop="type" label="类型" width="220" align="center" />
          <el-table-column prop="name" label="名称" align="center" show-overflow-tooltip />
          <el-table-column prop="time" label="时间" width="200" align="center" />
        </el-table>
      </div>
    </div>

    <!-- ==================== 右侧栏 ==================== -->
    <div class="dash-right">
      <!-- 通知公告 -->
      <div class="panel notice-panel">
        <div class="panel-header">
          <div class="panel-title">
            <i class="el-icon-bell title-icon" />
            <span>通知公告</span>
          </div>
          <i class="el-icon-more panel-more" />
        </div>
        <el-table
          :data="notices"
          class="dash-table"
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="名称" align="center" show-overflow-tooltip />
          <el-table-column prop="time" label="时间" width="90" align="center" />
        </el-table>
      </div>

      <!-- 常用模块 -->
      <div class="panel module-panel">
        <div class="module-title">常用模块</div>
        <div class="module-body">
          <div class="module-config" @click="handleConfigModule">
            <i class="el-icon-plus" />
            <span>配置模块</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard', // name 必须与路由 name 一致，keep-alive 缓存依赖它
  data() {
    return {
      // 历史模块快捷卡片（横向滚动）
      historyModules: [
        { name: '准准入类', icon: 'el-icon-s-unfold', path: '/archive-receive/business-file' },
        { name: '传统档案连接', icon: 'el-icon-connection', path: '/archive-receive/traditional-link' },
        { name: '业务文件接收', icon: 'el-icon-folder-opened', path: '/archive-receive/business-file' },
        { name: '归档案卷', icon: 'el-icon-collection', path: '/archive-organize/pre-roll' },
        { name: '归档文件', icon: 'el-icon-document', path: '/archive-organize/pre-file' },
        { name: '质量系统文件管理', icon: 'el-icon-s-document', path: '/archive-receive/quality-file' },
        { name: '传统档案电子签', icon: 'el-icon-full-screen', path: '/archive-receive/traditional-sign' }
      ],
      // 统计数据（MOCK，待对接后端）
      stats: {
        online: 2,
        archived: 15824,
        unArchived: 585,
        eFile: 11452,
        digitalCopy: 3613
      },
      // 待办 Tab 定义
      todoTabs: [
        { name: 'todo', label: '我的待办', count: 0, icon: 'el-icon-date' },
        { name: 'apply', label: '我的申请', count: 5, icon: 'el-icon-document' },
        { name: 'joined', label: '我参与的', count: 9, icon: 'el-icon-suitcase' },
        { name: 'notice', label: '整改通知', count: 0, icon: 'el-icon-bell' }
      ],
      activeTab: 'todo',
      // 各 Tab 表格数据（MOCK：待办/整改通知为空）
      tableDataMap: {
        todo: [],
        notice: [],
        apply: [
          { type: '归档申请', name: '柯诸高速项目档案归档申请', time: '2026-09-01' },
          { type: '借阅申请', name: '施工图设计文件借阅申请', time: '2026-08-28' },
          { type: '归档申请', name: '路基工程验收资料归档申请', time: '2026-08-25' },
          { type: '鉴定申请', name: '到期档案鉴定申请', time: '2026-08-20' },
          { type: '借阅申请', name: '监理月报借阅申请', time: '2026-08-15' }
        ],
        joined: [
          { type: '整理任务', name: '桥梁工程预归档案卷整理', time: '2026-09-05' },
          { type: '接收任务', name: '业务文件接收确认', time: '2026-09-03' },
          { type: '整理任务', name: '隧道工程预归档文件整理', time: '2026-08-30' },
          { type: '利用任务', name: '档案全文检索利用', time: '2026-08-26' },
          { type: '整理任务', name: '路面工程电子文件入库', time: '2026-08-22' },
          { type: '接收任务', name: '质量系统文件接收', time: '2026-08-18' },
          { type: '利用任务', name: '纸质档案借阅审批', time: '2026-08-12' },
          { type: '整理任务', name: '声像档案整理', time: '2026-08-08' },
          { type: '利用任务', name: '在线浏览复用', time: '2026-08-02' }
        ]
      },
      // 通知公告（MOCK）
      notices: []
    }
  },
  computed: {
    currentTableData() {
      return this.tableDataMap[this.activeTab] || []
    }
  },
  methods: {
    // 历史模块横向滚动（direction: 1 向右 / -1 向左）
    scrollHistory(direction) {
      const el = this.$refs.historyScroll
      if (el) el.scrollBy({ left: direction * 320, behavior: 'smooth' })
    },
    // 历史模块卡片点击 → 跳转对应模块
    handleHistoryClick(item) {
      this.$router.push(item.path).catch(() => {})
    },
    // 配置常用模块（占位）
    handleConfigModule() {
      this.$message.info('常用模块配置功能开发中')
    }
  }
}
</script>

<style lang="scss" scoped>
$primary: #2e7bf0;
$border: #e4e9f2;

.dashboard-container {
  height: 100%;
  display: flex;
  gap: 12px;
  overflow: hidden;
}

// ---------- 面板通用 ----------
.panel {
  background: #fff;
  border: 1px solid $border;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;

  .title-icon {
    color: $primary;
    font-size: 16px;
    margin-right: 6px;
  }
}

.panel-more {
  color: #909399;
  cursor: pointer;

  &:hover {
    color: $primary;
  }
}

// ---------- 左侧主区域 ----------
.dash-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ---------- 历史模块 ----------
.history-panel {
  flex-shrink: 0;
}

// 警示语绝对定位居中（覆盖整个面板头部宽度）
.secret-notice {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #f56c6c;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.history-body {
  display: flex;
  align-items: center;
  padding: 10px 6px;
}

.scroll-arrow {
  flex-shrink: 0;
  width: 24px;
  height: 56px;
  line-height: 56px;
  text-align: center;
  color: #b0b6c3;
  font-size: 18px;
  cursor: pointer;

  &:hover {
    color: $primary;
  }
}

.history-scroll {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;

  // 隐藏滚动条（左右箭头代替）
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}

.history-card {
  flex-shrink: 0;
  width: 148px;
  padding: 14px 0 12px;
  margin: 0 5px;
  background: #f7fafd;
  border: 1px solid $border;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $primary;
    box-shadow: 0 2px 10px rgba(46, 123, 240, 0.15);

    .card-icon {
      color: $primary;
    }
  }

  .card-icon {
    font-size: 30px;
    color: $primary;
  }

  .card-name {
    margin-top: 8px;
    font-size: 13px;
    color: #303133;
    padding: 0 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ---------- 统计条 ----------
.stat-row {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-bar {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 4px;

  .stat-icon {
    font-size: 34px;
    margin-right: 14px;
  }

  .stat-label {
    font-size: 13px;
    font-weight: 600;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }
}

.stat-green {
  background: #e9f8ec;
  color: #52c41a;

  .stat-label {
    color: #52c41a;
  }
}

.stat-blue {
  background: #e8f3fd;
  color: $primary;

  .stat-label {
    color: $primary;
  }
}

.stat-cyan {
  background: #e5f8fb;
  color: #13c2c2;

  .stat-label {
    color: #13c2c2;
  }
}

// ---------- 待办 Tab 表格 ----------
.todo-panel {
  flex: 1;
  min-height: 0;
}

.todo-tabs {
  display: flex;
  border-bottom: 1px solid $border;
  background: #f5f7fa;
  flex-shrink: 0;
}

.todo-tab {
  display: flex;
  align-items: center;
  padding: 0 18px;
  height: 38px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border-bottom: 2px solid transparent;

  i {
    margin-right: 5px;
    font-size: 14px;
  }

  &:hover {
    color: $primary;
  }

  &.active {
    color: $primary;
    font-weight: 600;
    background: #fff;
    border-bottom-color: $primary;
  }
}

// ---------- 右侧栏 ----------
.dash-right {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-panel {
  flex: 1;
  min-height: 0;
}

.module-panel {
  flex-shrink: 0;
}

.module-title {
  height: 40px;
  line-height: 40px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid $border;
}

.module-body {
  padding: 16px 14px;
}

.module-config {
  width: 96px;
  padding: 12px 0;
  border: 1px dashed #c6cad6;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  color: #606266;
  font-size: 12px;
  transition: all 0.2s;

  i {
    display: block;
    font-size: 22px;
    margin-bottom: 6px;
    color: #909399;
  }

  &:hover {
    border-color: $primary;
    color: $primary;

    i {
      color: $primary;
    }
  }
}

// ---------- 表格通用：浅蓝表头 ----------
.dash-table {
  flex: 1;
  min-height: 0;

  ::v-deep .el-table__header th {
    background: #e8f3fd;
    color: #303133;
    font-weight: 600;
    padding: 7px 0;
  }

  ::v-deep .el-table__empty-block {
    min-height: 160px;
  }
}
</style>
