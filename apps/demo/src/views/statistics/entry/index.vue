<template>
  <!-- 档案审核统计：档案分类树表 + 点击“当前节点案卷数/案卷总数/审核通过案卷数”打开明细弹窗（静态演示数据，不请求接口） -->
  <div class="app-container entry-page">
    <!-- 顶部工具条 -->
    <div class="list-toolbar">
      <el-button size="small" type="success" icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
      <el-button size="small" type="warning" icon="el-icon-data-analysis" @click="handleRestat">重新统计</el-button>
      <el-button size="small" type="success" icon="el-icon-download" @click="handleExportExcel">导出excel</el-button>
      <el-button size="small" icon="el-icon-tickets" @click="handleCustomReport">自定义报表</el-button>
    </div>

    <!-- 档案分类统计树表 -->
    <div class="table-container">
      <el-table
        :data="treeData"
        row-key="id"
        border
        size="small"
        default-expand-all
        :tree-props="{ children: 'children' }"
        height="100%"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="档案分类" min-width="260">
          <template slot-scope="{ row }">
            <i :class="row.children && row.children.length ? 'el-icon-folder row-icon folder' : 'el-icon-document row-icon doc'" />
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <!-- 当前节点案卷数：点击数值打开“当前节点案卷数”弹窗 -->
        <el-table-column label="当前节点案卷数" width="125" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.curRoll > 0" class="num-link" @click="openRollDialog(row, 'cur')">{{ row.curRoll }}</span>
            <span v-else>{{ row.curRoll }}</span>
          </template>
        </el-table-column>
        <!-- 案卷总数：点击数值打开“案卷总数”弹窗 -->
        <el-table-column label="案卷总数" width="110" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.rollTotal > 0" class="num-link" @click="openRollDialog(row, 'total')">{{ row.rollTotal }}</span>
            <span v-else>{{ row.rollTotal }}</span>
          </template>
        </el-table-column>
        <!-- 审核通过案卷数：点击数值打开“审核通过案卷数”弹窗 -->
        <el-table-column label="审核通过案卷数" width="125" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.auditRoll > 0" class="num-link" @click="openRollDialog(row, 'audit')">{{ row.auditRoll }}</span>
            <span v-else>{{ row.auditRoll }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前节点文件" prop="curFile" width="110" align="center" />
        <el-table-column label="文件总数" prop="fileTotal" width="100" align="center" />
        <el-table-column label="审核通过文件数" prop="auditFile" width="125" align="center" />
        <el-table-column label="统计时间" width="170" align="center">
          <template slot-scope="{ row }">{{ row.statTime }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 案卷明细弹窗（当前节点案卷数 / 案卷总数 / 审核通过案卷数 共用） -->
    <el-dialog
      :title="rollDialog.title"
      :visible.sync="rollDialog.visible"
      width="1150px"
      top="6vh"
      custom-class="stat-dialog"
      append-to-body
    >
      <div class="roll-dialog-body">
        <!-- 左侧筛选 -->
        <div class="filter-panel">
          <div class="filter-item">
            <div class="filter-label">案卷题名</div>
            <el-input v-model="rollDialog.filters.title" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">档号</div>
            <el-input v-model="rollDialog.filters.archiveNo" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">编制单位</div>
            <el-input v-model="rollDialog.filters.unit" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">编制起日期</div>
            <el-date-picker v-model="rollDialog.filters.startDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" size="small" style="width: 100%" />
          </div>
          <div class="filter-item">
            <div class="filter-label">编制止日期</div>
            <el-date-picker v-model="rollDialog.filters.endDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" size="small" style="width: 100%" />
          </div>
          <div class="filter-item">
            <div class="filter-label">保管期限</div>
            <el-select v-model="rollDialog.filters.term" size="small" clearable style="width: 100%">
              <el-option label="永久" value="永久" />
              <el-option label="30年" value="30年" />
              <el-option label="10年" value="10年" />
            </el-select>
          </div>
          <div class="filter-btns">
            <el-button type="primary" size="small" @click="handleRollSearch">搜索</el-button>
            <el-button type="primary" size="small" @click="handleRollReset">重置</el-button>
          </div>
        </div>
        <!-- 右侧列表 -->
        <div class="dialog-main">
          <div class="selected-info">
            选中信息：案卷：{{ rollSelected.count }} 卷，件数：{{ rollSelected.pieces }} 件，页数：{{ rollSelected.pages }} 页
          </div>
          <el-table :data="rollPageData" border size="small" height="400" @selection-change="handleRollSelectionChange">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" width="65" align="center">
              <template slot-scope="{ $index }">{{ (rollDialog.page - 1) * rollDialog.size + $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="档号" prop="archiveNo" width="170" sortable show-overflow-tooltip />
            <el-table-column label="案卷题名" prop="title" min-width="300" sortable show-overflow-tooltip />
            <el-table-column label="编制单位" prop="unit" min-width="200" sortable show-overflow-tooltip />
            <el-table-column label="编制起日期" prop="startDate" width="130" align="center" sortable />
          </el-table>
          <el-pagination
            :current-page.sync="rollDialog.page"
            :page-size.sync="rollDialog.size"
            :page-sizes="[100, 200, 500]"
            :total="rollDialog.total"
            layout="total, prev, pager, next, jumper, sizes"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 自定义报表：排序窗口弹窗 -->
    <el-dialog
      title="排序窗口"
      :visible.sync="reportDialog.visible"
      width="640px"
      custom-class="stat-dialog report-sort-dialog"
      append-to-body
    >
      <!-- 排序操作工具条 -->
      <div class="sort-toolbar">
        <el-button size="mini" :disabled="!canSort" @click="handleSortTo('top')"><i class="tri tri-up" /> 移至顶部</el-button>
        <el-button size="mini" :disabled="!canSort" @click="handleSortStep(-1)"><i class="tri tri-up" /> 向上</el-button>
        <el-button size="mini" :disabled="!canSort" @click="handleSortStep(1)"><i class="tri tri-down" /> 向下</el-button>
        <el-button size="mini" :disabled="!canSort" @click="handleSortTo('bottom')"><i class="tri tri-down" /> 移至末尾</el-button>
        <el-button size="mini" :disabled="!canSort || reportDialog.targetIndex === reportDialog.selectedIndex" @click="handleSortMoveTo">
          <i class="el-icon-position" /> 移至
        </el-button>
        <el-input-number
          v-model="reportDialog.targetIndex"
          size="mini"
          :min="1"
          :max="reportFields.length"
          controls-position="right"
          class="sort-target-input"
        />
      </div>
      <!-- 字段排序表 -->
      <el-table
        :data="reportFields"
        border
        size="small"
        height="340"
        highlight-current-row
        @current-change="handleSortCurrentChange"
      >
        <el-table-column label="排序" width="80" align="center">
          <template slot-scope="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="字段" prop="label" min-width="260" show-overflow-tooltip />
        <el-table-column label="是否显示" width="120" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.visible" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary" size="small" @click="handleReportConfirm">确定</el-button>
        <el-button size="small" @click="reportDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 档案审核统计（静态演示数据，不请求接口）
const STAT_TIME = '2026-09-01 17:02:25'
const LEAF_TIME = '2026-09-01 18:02:11'

// 档案分类树形数据：与统计截图一致
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', curRoll: 0, rollTotal: 16242, auditRoll: 15269, curFile: 0, fileTotal: 49764, auditFile: 1, statTime: STAT_TIME,
    children: [
      {
        id: 11, name: '第一部分 项目申报文件', curRoll: 0, rollTotal: 34, auditRoll: 34, curFile: 0, fileTotal: 0, auditFile: 0, statTime: STAT_TIME,
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件', curRoll: 3, rollTotal: 3, auditRoll: 3, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 112, name: '二、可行性研究报告及批复、可行性论证见', curRoll: 3, rollTotal: 3, auditRoll: 3, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 113, name: '三、环境影响报告及批复文件', curRoll: 2, rollTotal: 2, auditRoll: 2, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 114, name: '四、水土保持方案报告及批复文件', curRoll: 2, rollTotal: 2, auditRoll: 2, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 115, name: '五、项目咨询、评估、论证文件', curRoll: 21, rollTotal: 21, auditRoll: 21, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 116, name: '六、投资、特许经营协议', curRoll: 1, rollTotal: 1, auditRoll: 1, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME },
          { id: 117, name: '七、工程融资贷款计划、资金筹措方案、银行贷款协议', curRoll: 2, rollTotal: 2, auditRoll: 2, curFile: 0, fileTotal: 0, auditFile: 0, statTime: LEAF_TIME }
        ]
      },
      { id: 12, name: '第二部分 设计文件', curRoll: 1, rollTotal: 208, auditRoll: 194, curFile: 0, fileTotal: 0, auditFile: 0, statTime: STAT_TIME },
      { id: 13, name: '第三部分 工程管理文件', curRoll: 0, rollTotal: 753, auditRoll: 736, curFile: 0, fileTotal: 3, auditFile: 0, statTime: STAT_TIME },
      { id: 14, name: '第四部分 施工文件', curRoll: 0, rollTotal: 11868, auditRoll: 11152, curFile: 0, fileTotal: 47020, auditFile: 0, statTime: STAT_TIME },
      { id: 15, name: '第五部分 监理文件', curRoll: 0, rollTotal: 2931, auditRoll: 2747, curFile: 0, fileTotal: 2740, auditFile: 1, statTime: STAT_TIME },
      { id: 16, name: '第六部分 竣工（交）工验收文件', curRoll: 0, rollTotal: 423, auditRoll: 400, curFile: 0, fileTotal: 0, auditFile: 0, statTime: STAT_TIME },
      { id: 17, name: '第七部分 科研文件', curRoll: 0, rollTotal: 25, auditRoll: 6, curFile: 1, fileTotal: 1, auditFile: 0, statTime: STAT_TIME }
    ]
  }
]

// 案卷演示数据：与截图一致的基础样本
const ROLL_SAMPLES = [
  { archiveNo: 'KZGS-TJ03-2738', title: '柯桥至诸暨高速公路工程第TJ03标段03省道东延段路基工程施工文件', unit: '中交路桥建设有限公司', startDate: '2024-11-30' },
  { archiveNo: 'KZGS-Z-0721', title: '柯桥至诸暨高速公路工程图文件制作设计服务招标文件', unit: '绍兴市柯诸高速公路有限公司', startDate: '2024-01-01' },
  { archiveNo: 'KZGS-JL01-1496', title: '柯桥至诸暨高速公路工程JL01监理办2024年3月监理月报', unit: '浙江公路水运工程监理有限公司', startDate: '2024-03-01' },
  { archiveNo: 'KZGS-SPZ02-0032', title: '柯桥至诸暨高速公路工程声屏障工程第SPZ02标段交工验收文件', unit: '杭州红旗交通设施有限公司', startDate: '2025-11-21' },
  { archiveNo: 'KZGS-TJ01-2441', title: '柯桥至诸暨高速公路工程第TJ01标段吴屋顶隧道施工文件', unit: '浙江交工集团股份有限公司', startDate: '2023-12-16' },
  { archiveNo: 'KZGS-TJ01-0081', title: '柯桥至诸暨高速公路工程第TJ01标段桥梁工程施工文件', unit: '浙江交工集团股份有限公司', startDate: '2023-06-02' },
  { archiveNo: 'KZGS-SPZ01-0022', title: '柯桥至诸暨高速公路工程声屏障工程第SPZ01标段施工文件', unit: '广西建工集团第四建筑工程有限责任公司', startDate: '2025-01-06' },
  { archiveNo: 'KZGS-TJ02-2097', title: '柯桥至诸暨高速公路工程第TJ02标段朱家坞隧道施工文件', unit: '中交第二公路工程局有限公司', startDate: '2024-12-16' },
  { archiveNo: 'KZGS-TJ03-0464', title: '柯桥至诸暨高速公路工程第TJ03标段K29+815大桥施工文件', unit: '中交路桥建设有限公司', startDate: '2024-06-28' },
  { archiveNo: 'KZGS-JL01-0657', title: '柯桥至诸暨高速公路工程第TJ01标段YK4+785中桥监理文件', unit: '浙江公路水运工程监理有限公司', startDate: '2023-11-24' },
  { archiveNo: 'KZGS-SPZ02-0012', title: '柯桥至诸暨高速公路工程声屏障工程第SPZ02标段开工报告', unit: '杭州红旗交通设施有限公司', startDate: '2024-08-06' }
]

// 生成案卷演示行（最多展示 100 条，总数由统计值控制）
function buildRollRows(count) {
  const n = Math.min(count || 0, 100)
  const rows = []
  for (let i = 0; i < n; i++) {
    const s = ROLL_SAMPLES[i % ROLL_SAMPLES.length]
    rows.push({
      archiveNo: s.archiveNo,
      title: s.title + '（第' + (i + 1) + '卷）',
      unit: s.unit,
      startDate: s.startDate
    })
  }
  return rows
}

// 弹窗标题
const DIALOG_TITLES = { cur: '当前节点案卷数', total: '案卷总数', audit: '审核通过案卷数' }

// 自定义报表可选字段（与审核统计表列一致，visible 默认勾选状态与截图一致）
const REPORT_FIELDS = [
  { label: '当前节点案卷数', visible: true },
  { label: '案卷总数', visible: true },
  { label: '审核通过案卷数', visible: true },
  { label: '未审核案卷数', visible: false },
  { label: '当前节点文件', visible: true },
  { label: '文件总数', visible: true },
  { label: '审核通过文件数', visible: true },
  { label: '未审核文件数', visible: false },
  { label: '统计时间', visible: true }
]

export default {
  name: 'StatsEntry',
  data() {
    return {
      treeData: JSON.parse(JSON.stringify(TREE_DATA)),
      // 自定义报表排序窗口
      reportDialog: {
        visible: false,
        selectedIndex: -1, // 当前选中行索引
        targetIndex: 1 // 「移至」目标序号
      },
      reportFields: REPORT_FIELDS.map(f => ({ ...f })),
      // 案卷明细弹窗（三种类型共用）
      rollDialog: {
        visible: false,
        type: 'total',
        title: '案卷总数',
        page: 1,
        size: 100,
        total: 0,
        allRows: [],
        filters: { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      },
      rollSelected: { count: 0, pieces: 0, pages: 0 }
    }
  },
  computed: {
    canSort() {
      return this.reportDialog.selectedIndex >= 0 && this.reportDialog.selectedIndex < this.reportFields.length
    },
    rollPageData() {
      const start = (this.rollDialog.page - 1) * this.rollDialog.size
      return this.rollDialog.allRows.slice(start, start + this.rollDialog.size)
    }
  },
  methods: {
    // ===== 工具条 =====
    handleRefresh() {
      this.treeData = JSON.parse(JSON.stringify(TREE_DATA))
      this.$message.success('已刷新')
    },
    handleRestat() {
      this.$message.success('重新统计任务已提交')
    },
    handleExportExcel() {
      this.$message.success('导出excel成功')
    },
    handleCustomReport() {
      // 打开排序窗口：重置选择状态
      this.reportDialog.selectedIndex = -1
      this.reportDialog.targetIndex = 1
      this.reportDialog.visible = true
    },
    // ===== 自定义报表：排序窗口 =====
    handleSortCurrentChange(row) {
      this.reportDialog.selectedIndex = row ? this.reportFields.indexOf(row) : -1
    },
    /** 上移/下移一位 */
    handleSortStep(step) {
      const i = this.reportDialog.selectedIndex
      const j = i + step
      if (j < 0 || j >= this.reportFields.length) return
      const list = this.reportFields
      ;[list[i], list[j]] = [list[j], list[i]]
      this.reportDialog.selectedIndex = j
      this.reportDialog.targetIndex = j + 1
    },
    /** 移至顶部/末尾 */
    handleSortTo(pos) {
      const i = this.reportDialog.selectedIndex
      if (i < 0) return
      const [item] = this.reportFields.splice(i, 1)
      const j = pos === 'top' ? 0 : this.reportFields.length
      this.reportFields.splice(j, 0, item)
      this.reportDialog.selectedIndex = j
      this.reportDialog.targetIndex = j + 1
    },
    /** 移至指定序号 */
    handleSortMoveTo() {
      const i = this.reportDialog.selectedIndex
      const j = this.reportDialog.targetIndex - 1
      if (i < 0 || j === i || j < 0 || j >= this.reportFields.length) return
      const [item] = this.reportFields.splice(i, 1)
      this.reportFields.splice(j, 0, item)
      this.reportDialog.selectedIndex = j
    },
    handleReportConfirm() {
      const shown = this.reportFields.filter(f => f.visible).map(f => f.label)
      this.reportDialog.visible = false
      this.$message.success(`自定义报表已保存：显示 ${shown.length} 个字段`)
    },
    // ===== 案卷明细弹窗 =====
    openRollDialog(row, type) {
      const count = type === 'cur' ? row.curRoll : type === 'total' ? row.rollTotal : row.auditRoll
      this.rollDialog.type = type
      this.rollDialog.title = DIALOG_TITLES[type]
      this.rollDialog.page = 1
      this.rollDialog.size = 100
      this.rollDialog.total = count
      this.rollDialog.allRows = buildRollRows(count)
      this.rollDialog.filters = { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      this.rollSelected = { count: 0, pieces: 0, pages: 0 }
      this.rollDialog.visible = true
    },
    handleRollSelectionChange(selection) {
      this.rollSelected.count = selection.length
      this.rollSelected.pieces = selection.length * 10
      this.rollSelected.pages = selection.length * 220
    },
    handleRollSearch() {
      this.rollDialog.page = 1
      const f = this.rollDialog.filters
      let rows = buildRollRows(this.rollDialog.total)
      if (f.title) rows = rows.filter(r => r.title.includes(f.title))
      if (f.archiveNo) rows = rows.filter(r => r.archiveNo.includes(f.archiveNo))
      if (f.unit) rows = rows.filter(r => r.unit.includes(f.unit))
      this.rollDialog.allRows = rows
      this.$message.success('搜索完成（演示数据）')
    },
    handleRollReset() {
      this.rollDialog.filters = { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      this.rollDialog.page = 1
      this.rollDialog.allRows = buildRollRows(this.rollDialog.total)
    }
  }
}
</script>

<style lang="scss" scoped>
.entry-page {
  height: 100%;
  width: 100%;
  padding: 10px;
  background: #fff;

  .table-container {
    height: calc(100% - 40px);
  }
  
  .list-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;

    ::v-deep .el-input__inner {
      height: 26px;
      line-height: 26px;
    }
    
    ::v-deep .el-input__icon {
      height: 26px;
      line-height: 26px;
    }
  }

  .row-icon {
    margin-right: 6px;

    &.folder { color: #e6a23c; }
    &.doc { color: #409eff; }
  }

  .num-link {
    color: #409eff;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }

  ::v-deep .el-table {
    .cell { font-size: 12px; }
  }
}
</style>

<style lang="scss">
/* 弹窗为 append-to-body，需要全局样式 */
.stat-dialog {
  .el-dialog__header {
    padding: 12px 20px;
    background: #fff;

    .el-dialog__title {
      font-size: 16px;
      color: #303133;
    }
  }

  .el-dialog__body {
    padding: 12px 16px;
  }
}

.roll-dialog-body {
  display: flex;
  gap: 12px;
}

.filter-panel {
  width: 220px;
  flex-shrink: 0;

  .filter-item {
    margin-bottom: 12px;

    .filter-label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }
  }

  .filter-btns {
    margin-top: 16px;

    .el-button + .el-button {
      margin-left: 8px;
    }
  }
}

.dialog-main {
  flex: 1;
  min-width: 0;

  .selected-info {
    font-size: 13px;
    color: #303133;
    margin-bottom: 8px;
  }

  .el-pagination {
    margin: 8px 0 12px;
    text-align: left;
  }
}

/* 自定义报表：排序窗口 */
.report-sort-dialog {
  .sort-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;

    .sort-target-input {
      width: 110px;
      margin-left: 2px;
    }

    .el-button {
      padding: 7px 10px;

      .tri {
        display: inline-block;
        margin-right: 2px;
        vertical-align: middle;

        &.tri-up {
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 5px solid currentColor;
        }

        &.tri-down {
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid currentColor;
        }
      }
    }
  }

  .el-table {
    .el-checkbox {
      margin: 0;
    }
  }
}
</style>
