<template>
  <!-- 四性检验历史：检测批次列表 + 检验详情弹窗（静态演示数据，不请求接口） -->
  <div class="app-container">
    <!-- 顶部工具条 -->
    <div class="list-toolbar">
      <el-button class="refresh-btn" type="text" icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
      <span class="toolbar-label">姓名:</span>
      <el-input
        v-model="queryParams.name"
        placeholder="请输入内容"
        size="small"
        clearable
        style="width: 150px"
        @keyup.enter.native="handleQuery"
      />
      <span class="toolbar-label">起始日期</span>
      <el-date-picker v-model="queryParams.startDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" size="small" style="width: 140px" />
      <span class="toolbar-label">止日期</span>
      <el-date-picker v-model="queryParams.endDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" size="small" style="width: 140px" />
      <el-button size="small" type="primary" plain icon="el-icon-search" @click="handleQuery" style="margin-left: 8px;" />
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table :data="pagedList" border stripe size="small" height="100%">
        <el-table-column label="序号" type="index" :index="indexMethod" width="60" align="center" />
        <el-table-column label="检测方案" prop="scheme" width="160" align="center" />
        <el-table-column label="文件总数" prop="fileCount" width="100" align="center" />
        <el-table-column label="档案库" prop="library" width="140" align="center" />
        <el-table-column label="四性检验情况" width="130" align="center">
          <template slot-scope="{ row }">
            <span :class="row.pass ? 'text-ok' : 'text-fail'">{{ row.pass ? '通过' : '不通过' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有无检测报告" width="130" align="center">
          <template slot-scope="{ row }">
            <span :class="row.hasReport ? 'text-ok' : 'text-fail'">{{ row.hasReport ? '有' : '无' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="检测人员" prop="checker" width="160" align="center" />
        <el-table-column label="检测时间" prop="checkDate" min-width="140" align="center" />
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button size="mini" plain @click="handleDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        background
        layout="total, prev, pager, next, jumper, sizes"
        :total="filteredList.length"
        :current-page.sync="queryParams.pageNum"
        :page-size.sync="queryParams.pageSize"
        :page-sizes="[100, 200, 500]"
      />
    </div>

    <!-- 检验详情弹窗 -->
    <el-dialog title="检验详情" :visible.sync="detailVisible" width="1050px" top="6vh" append-to-body>
      <div class="detail-info-row">
        <span>检测时间: {{ detail.checkTime }}</span>
        <span>检测人员: {{ detail.checker }}</span>
        <span>检测方案: {{ detail.scheme }}</span>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="自动检测" name="auto" />
        <el-tab-pane label="手动检测" name="manual" />
      </el-tabs>

      <el-checkbox v-if="activeTab === 'auto'" v-model="onlyFailed" class="only-failed">仅显示未通过</el-checkbox>

      <!-- 手动检测：载体人工检测项 -->
      <div v-if="activeTab === 'manual'" class="manual-check">
        <div class="manual-head">
          <span class="col-name">检测项目</span>
          <span class="col-result">检测结果</span>
          <span class="col-remark">备注</span>
        </div>
        <div v-for="item in manualItems" :key="item.name" class="manual-row">
          <span class="col-name">{{ item.name }}</span>
          <span class="col-result">
            <el-radio-group v-model="item.result" size="mini">
              <el-radio label="pass">通过</el-radio>
              <el-radio label="fail">不通过</el-radio>
            </el-radio-group>
          </span>
          <span class="col-remark">
            <el-input v-model="item.remark" size="mini" placeholder="请输入备注" />
          </span>
        </div>
      </div>

      <div v-if="activeTab === 'auto'" class="detail-body">
        <!-- 左侧：文件四性检测结果 -->
        <div class="detail-left">
          <el-table
            :data="activeItems"
            border
            size="small"
            height="400"
            highlight-current-row
            empty-text="暂无数据"
            @row-click="handleItemClick"
          >
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column label="档号" prop="archiveNo" width="150" align="center" />
            <el-table-column label="题名" prop="title" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column label="真实性" width="80" align="center">
              <template slot-scope="{ row }"><i :class="checkIcon(row.authentic)" /></template>
            </el-table-column>
            <el-table-column label="可用性" width="80" align="center">
              <template slot-scope="{ row }"><i :class="checkIcon(row.available)" /></template>
            </el-table-column>
            <el-table-column label="完整性" width="80" align="center">
              <template slot-scope="{ row }"><i :class="checkIcon(row.complete)" /></template>
            </el-table-column>
            <el-table-column label="安全性" width="80" align="center">
              <template slot-scope="{ row }"><i :class="checkIcon(row.secure)" /></template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 右侧：单件详情 -->
        <div class="detail-right">
          <template v-if="currentItem">
            <div class="item-title">{{ currentItem.title }}</div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="档号">{{ currentItem.archiveNo }}</el-descriptions-item>
              <el-descriptions-item label="真实性"><span :class="currentItem.authentic ? 'text-ok' : 'text-fail'">{{ checkText(currentItem.authentic) }}</span></el-descriptions-item>
              <el-descriptions-item label="可用性"><span :class="currentItem.available ? 'text-ok' : 'text-fail'">{{ checkText(currentItem.available) }}</span></el-descriptions-item>
              <el-descriptions-item label="完整性"><span :class="currentItem.complete ? 'text-ok' : 'text-fail'">{{ checkText(currentItem.complete) }}</span></el-descriptions-item>
              <el-descriptions-item label="安全性"><span :class="currentItem.secure ? 'text-ok' : 'text-fail'">{{ checkText(currentItem.secure) }}</span></el-descriptions-item>
              <el-descriptions-item label="文件格式">{{ currentItem.format }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ currentItem.fileSize }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <div v-else class="placeholder">点击左侧查看详情</div>
        </div>
      </div>

      <div class="report-row">
        <el-button type="primary" size="small" @click="handleViewReport">查看检测报告</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 四性检验历史（静态演示数据，共 597 条，模拟截图数据分布）
const CHECKERS = ['吴智峰', '张鲁莎', '吴智峰', '吴智峰', '吴智峰', '张鲁莎', '张鲁莎', '张鲁莎', '张鲁莎', '管理员(开发用)']
const DATES = ['2026-08-11', '2026-08-11', '2026-08-11', '2026-08-11', '2026-08-11', '2026-08-11', '2026-08-09', '2026-08-09', '2026-08-04', '2026-08-04', '2026-08-03', '2026-08-03', '2026-08-03', '2026-08-03', '2026-08-03', '2026-07-31', '2026-07-31', '2026-07-31']
const PASS_PATTERN = [true, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, true, true, true, false]

function pad(n) {
  return String(n).padStart(2, '0')
}

function buildManualItems() {
  // 载体人工检测项（静态演示数据）
  return [
    { name: '载体读取速度检测', result: 'pass', remark: '' },
    { name: '载体外观检测', result: 'pass', remark: '' },
    { name: '光盘合格性检测', result: 'pass', remark: '' },
    { name: '操作过程安全性检测', result: 'pass', remark: '' }
  ]
}

function buildMockList() {
  const list = []
  for (let i = 1; i <= 597; i++) {
    const pass = PASS_PATTERN[i % PASS_PATTERN.length]
    const hasReport = i % 5 === 3 || i % 9 === 5
    const checkDate = DATES[i % DATES.length]
    const failDim = i % 4 // 未通过时失效维度：0真实性 1可用性 2完整性 3安全性
    const row = {
      id: i,
      archiveNo: `KZGS-JL01-${String(400 + i).padStart(4, '0')}`,
      title: `柯桥至诸暨高速公路工程第J01标段JK0+${100 + i * 3}段工程文件（归档检测）`,
      fileCount: 1,
      library: '预归档库',
      scheme: '归档环节',
      pass,
      hasReport,
      checker: CHECKERS[i % CHECKERS.length],
      checkDate,
      checkTime: `${checkDate} ${pad(9 + (i % 8))}:${pad((i * 13) % 60)}:${pad((i * 7) % 60)}`
    }
    row.items = [{
      id: i,
      archiveNo: row.archiveNo,
      title: row.title,
      authentic: pass || failDim !== 0,
      available: pass || failDim !== 1,
      complete: pass || failDim !== 2,
      secure: pass || failDim !== 3,
      format: 'OFD',
      fileSize: `${1 + (i % 9)}.${i % 10}MB`
    }]
    list.push(row)
  }
  return list
}

export default {
  name: 'ArchiveFourCheckHistory',
  data() {
    return {
      list: buildMockList(),
      queryParams: { pageNum: 1, pageSize: 100, name: '', startDate: '', endDate: '' },
      detailVisible: false,
      detail: {},
      activeTab: 'auto',
      onlyFailed: false,
      currentItem: null,
      // 手动检测项（载体人工检测）
      manualItems: buildManualItems()
    }
  },
  computed: {
    filteredList() {
      const { name, startDate, endDate } = this.queryParams
      return this.list.filter(row => {
        if (name && row.checker.indexOf(name) === -1) return false
        if (startDate && row.checkDate < startDate) return false
        if (endDate && row.checkDate > endDate) return false
        return true
      })
    },
    pagedList() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize
      return this.filteredList.slice(start, start + this.queryParams.pageSize)
    },
    activeItems() {
      if (this.activeTab === 'manual') return []
      const items = this.detail.items || []
      return this.onlyFailed ? items.filter(i => !(i.authentic && i.available && i.complete && i.secure)) : items
    }
  },
  methods: {
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
    },

    checkIcon(val) {
      return val ? 'el-icon-success icon-ok' : 'el-icon-error icon-fail'
    },

    checkText(val) {
      return val ? '通过' : '不通过'
    },

    handleRefresh() {
      this.queryParams.name = ''
      this.queryParams.startDate = ''
      this.queryParams.endDate = ''
      this.queryParams.pageNum = 1
      this.list = buildMockList()
    },

    handleQuery() {
      this.queryParams.pageNum = 1
    },

    handleDetail(row) {
      this.detail = { ...row, items: (row.items || []).map(i => ({ ...i })) }
      this.activeTab = 'auto'
      this.onlyFailed = false
      this.currentItem = null
      this.manualItems = buildManualItems()
      this.detailVisible = true
    },

    handleItemClick(row) {
      this.currentItem = row
    },

    handleViewReport() {
      if (this.detail.hasReport) {
        this.$message.success('查看检测报告')
      } else {
        this.$message.warning('该批次无检测报告')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  padding: 10px;

  .table-container {
    height: calc(100% - 100px);
  }
}

.list-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .toolbar-label {
    margin: 0 6px 0 12px;
    font-size: 13px;
    color: #606266;
  }

  ::v-deep .el-input__inner {
    height: 26px;
    line-height: 26px;
  }
}

.refresh-btn {
  padding: 0;
  color: #67c23a;
}

.text-ok {
  color: #67c23a;
}

.text-fail {
  color: #f56c6c;
}

.pagination-wrap {
  margin-top: 12px;
}

.detail-info-row {
  display: flex;
  justify-content: space-between;
  padding: 0 8px 10px;
  font-size: 13px;
  color: #303133;
}

.only-failed {
  margin-bottom: 8px;
}

/* 手动检测：载体人工检测项 */
.manual-check {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  .manual-head,
  .manual-row {
    display: flex;
    align-items: center;
  }

  .manual-head {
    background: #f5f7fa;
    font-size: 13px;
    font-weight: 700;
    color: #303133;
  }

  .manual-row {
    border-top: 1px solid #ebeef5;
    font-size: 13px;
    color: #303133;
  }

  .col-name {
    width: 200px;
    padding: 8px 12px;
    flex-shrink: 0;
  }

  .col-result {
    width: 200px;
    padding: 4px 12px;
    flex-shrink: 0;
  }

  .col-remark {
    flex: 1;
    padding: 4px 12px 4px 0;
  }
}

.detail-body {
  display: flex;
}

.detail-left {
  flex: 1;
  min-width: 0;
}

.detail-right {
  width: 320px;
  min-width: 320px;
  max-height: 430px;
  margin-left: 12px;
  padding: 12px;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .item-title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #303133;
  }
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 380px;
  color: #909399;
  font-size: 14px;
}

.report-row {
  margin-top: 12px;
  text-align: right;
}

.icon-ok {
  color: #67c23a;
  font-size: 16px;
}

.icon-fail {
  color: #f56c6c;
  font-size: 16px;
}
</style>
