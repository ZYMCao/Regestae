<template>
  <!-- 档案汇总统计：档案类别树表 + 点击“预归档文件数/预归档案卷数”打开明细弹窗（静态演示数据，不请求接口） -->
  <div class="app-container summary-page">
    <!-- 顶部工具条 -->
    <div class="list-toolbar">
      <el-select v-model="queryParams.category" size="small" clearable placeholder="全门类" style="width: 118px">
        <el-option label="全门类" value="" />
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="queryParams.term" size="small" clearable placeholder="请选择保管期限" style="width: 150px">
        <el-option label="永久" value="永久" />
        <el-option label="30年" value="30年" />
        <el-option label="10年" value="10年" />
      </el-select>
      <el-select v-model="queryParams.dateType" size="small" clearable placeholder="日期类型" style="width: 118px">
        <el-option v-for="t in dateTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-date-picker v-model="queryParams.startDate" type="date" value-format="yyyy-MM-dd" placeholder="起始日期" size="small" style="width: 135px" />
      <span class="range-sep">至</span>
      <el-date-picker v-model="queryParams.endDate" type="date" value-format="yyyy-MM-dd" placeholder="结束日期" size="small" style="width: 135px" />
      <el-button size="small" icon="el-icon-search" @click="handleSearch">搜索</el-button>
      <el-button size="small" type="success" icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
      <el-button size="small" type="warning" icon="el-icon-data-analysis" @click="handleRestat">重新统计</el-button>
      <el-button size="small" type="success" icon="el-icon-download" @click="handleExportExcel">导出excel</el-button>
      <el-button size="small" icon="el-icon-tickets" @click="handleCustomReport">自定义报表</el-button>
    </div>

    <!-- 档案类别汇总树表 -->
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
        <el-table-column label="档案类别" min-width="240">
          <template slot-scope="{ row }">
            <i :class="row.children && row.children.length ? 'el-icon-folder row-icon folder' : 'el-icon-folder-opened row-icon doc'" />
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <!-- 预归档文件数：点击数值打开预归档文件数弹窗 -->
        <el-table-column label="预归档文件数" width="130" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.fileCount > 0" class="num-link" @click="openFileDialog(row)">{{ row.fileCount }}</span>
            <span v-else>{{ row.fileCount }}</span>
          </template>
        </el-table-column>
        <!-- 预归档案卷数：点击数值打开预归档案卷数弹窗 -->
        <el-table-column label="预归档案卷数" width="130" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.rollCount > 0" class="num-link" @click="openRollDialog(row)">{{ row.rollCount }}</span>
            <span v-else>{{ row.rollCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数字化档案份数" prop="digCopies" width="130" align="center" />
        <el-table-column label="数字化档案页数" prop="digPages" width="130" align="center" />
        <el-table-column label="数字化档案数据量" prop="digSize" width="150" align="center" />
        <el-table-column label="电子档案份数" prop="elecCopies" width="130" align="center" />
        <el-table-column label="电子档案页数" prop="elecPages" width="130" align="center" />
        <el-table-column label="电子档案数据量" prop="elecSize" width="140" align="center" />
        <el-table-column label="统计时间" width="175" align="center">
          <template slot-scope="{ row }">{{ row.statTime }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 预归档文件数弹窗 -->
    <el-dialog
      title="预归档文件数"
      :visible.sync="fileDialog.visible"
      width="96%"
      top="3vh"
      custom-class="stat-dialog catalog-dialog"
      append-to-body
    >
      <div class="catalog-dialog-body">
        <!-- 左侧筛选 -->
        <div class="filter-panel">
          <div class="filter-item">
            <div class="filter-label">文件题名</div>
            <el-input v-model="fileDialog.filters.title" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">责任者</div>
            <el-input v-model="fileDialog.filters.responsible" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">档号</div>
            <el-input v-model="fileDialog.filters.archiveNo" size="small" />
          </div>
          <div class="filter-btns">
            <el-button type="primary" size="small" @click="handleFileSearch">搜索</el-button>
            <el-button type="primary" size="small" @click="handleFileReset">重置</el-button>
          </div>
        </div>
        <!-- 右侧：文件目录 + 文件 双表 -->
        <div class="dialog-main">
          <div class="section-bar"><span>文件目录</span></div>
          <el-table :data="filePageData" border size="small" height="330" @selection-change="() => {}">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" width="65" align="center">
              <template slot-scope="{ $index }">{{ (fileDialog.page - 1) * fileDialog.size + $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="档号" prop="archiveNo" width="130" sortable show-overflow-tooltip />
            <el-table-column label="文件题名" prop="title" min-width="240" sortable show-overflow-tooltip />
            <el-table-column label="件号" prop="piece" width="90" align="center" sortable />
            <el-table-column label="文号" prop="docNo" width="170" sortable show-overflow-tooltip />
            <el-table-column label="责任者" prop="unit" min-width="200" sortable show-overflow-tooltip />
            <el-table-column label="编制日期" prop="date" width="120" align="center" sortable />
            <el-table-column label="组件情况" prop="comp" width="100" align="center" />
            <el-table-column label="保管期限" prop="term" width="100" align="center" />
            <el-table-column label="密级" prop="secret" width="80" align="center" />
          </el-table>
          <el-pagination
            :current-page.sync="fileDialog.page"
            :page-size.sync="fileDialog.size"
            :page-sizes="[100, 200, 500]"
            :total="fileDialog.total"
            layout="total, prev, pager, next, jumper, sizes"
          />

          <div class="section-bar"><span>文件</span></div>
          <el-table :data="[]" border size="small" height="200">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" width="65" align="center" />
            <el-table-column label="文件名称" min-width="220" show-overflow-tooltip />
            <el-table-column label="文件编号" width="130" sortable />
            <el-table-column label="编制日期" width="120" align="center" sortable />
            <el-table-column label="考证日期" width="120" align="center" />
            <el-table-column label="页数" width="80" align="center" sortable />
            <el-table-column label="排序" width="80" align="center" sortable />
            <el-table-column label="档案类型" width="110" sortable />
            <el-table-column label="文件状态" width="110" sortable />
            <el-table-column label="格式信息" width="110" sortable />
            <el-table-column label="计算机" width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="80" align="center" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 预归档案卷数弹窗 -->
    <el-dialog
      title="预归档案卷数"
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
            <el-table-column label="编制单位" prop="unit" min-width="190" sortable show-overflow-tooltip />
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
// 档案汇总统计（静态演示数据，不请求接口）
const STAT_TIME = '2026-09-01 17:54:16'

// 档案类别汇总树形数据：与统计截图一致
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', fileCount: 49763, rollCount: 973, digCopies: 56796, digPages: 978987, digSize: '456.35GB', elecCopies: 2525817, elecPages: 3476422, elecSize: '338.47GB', statTime: STAT_TIME,
    children: [
      { id: 11, name: '第一部分 项目申报文件', fileCount: 0, rollCount: 0, digCopies: 154, digPages: 9104, digSize: '1.99GB', elecCopies: 8, elecPages: 29, elecSize: '5.81MB', statTime: STAT_TIME },
      { id: 12, name: '第二部分 设计文件', fileCount: 0, rollCount: 14, digCopies: 2343, digPages: 45091, digSize: '17.12GB', elecCopies: 2, elecPages: 24, elecSize: '831.08KB', statTime: STAT_TIME },
      { id: 13, name: '第三部分 工程管理文件', fileCount: 3, rollCount: 17, digCopies: 9567, digPages: 191471, digSize: '67.1GB', elecCopies: 3603, elecPages: 11462, elecSize: '125.27GB', statTime: STAT_TIME },
      { id: 14, name: '第四部分 施工文件', fileCount: 47020, rollCount: 716, digCopies: 38634, digPages: 546098, digSize: '307.82GB', elecCopies: 1641849, elecPages: 2379512, elecSize: '40.65GB', statTime: STAT_TIME },
      { id: 15, name: '第五部分 监理文件', fileCount: 2739, rollCount: 184, digCopies: 4208, digPages: 37233, digSize: '16.07GB', elecCopies: 878154, elecPages: 1003202, elecSize: '166.39GB', statTime: STAT_TIME },
      { id: 16, name: '第六部分 竣工（交）工验收文件', fileCount: 0, rollCount: 23, digCopies: 1669, digPages: 141335, digSize: '44.82GB', elecCopies: 2201, elecPages: 82193, elecSize: '6.15GB', statTime: STAT_TIME },
      { id: 17, name: '第七部分 科研文件', fileCount: 1, rollCount: 19, digCopies: 221, digPages: 8655, digSize: '1.43GB', elecCopies: 0, elecPages: 0, elecSize: '0B', statTime: STAT_TIME }
    ]
  }
]

// 文件目录演示数据（预归档文件数弹窗）
const CATALOG_SAMPLES = [
  { title: '福全枢纽地系梁首件方案', piece: 1, docNo: '', unit: '浙江交工集团股份有限公司', date: '2023-02-12', term: '30年' },
  { title: '福全枢纽地系梁首件总结', piece: 2, docNo: '', unit: '浙江交工集团股份有限公司', date: '2023-02-12', term: '30年' },
  { title: '福全枢纽地系梁分项开工报告', piece: 3, docNo: '', unit: '浙江交工集团股份有限公司', date: '2023-02-12', term: '30年' },
  { title: 'K0+619.583姚江枢纽G匝道桥9#-1桩基分项开工报告', piece: 2, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-03', term: '永久' },
  { title: 'K0+644.583姚江枢纽G匝道桥10#-0桩基分项开工报告', piece: 3, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-11', term: '永久' },
  { title: 'K0+644.583姚江枢纽G匝道桥10#-1桩基分项开工报告', piece: 4, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-09', term: '永久' },
  { title: 'K0+669.583姚江枢纽G匝道桥11#-0桩基分项开工报告', piece: 5, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-04', term: '永久' },
  { title: 'K0+694.583姚江枢纽G匝道桥12#-0桩基分项开工报告', piece: 7, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-06', term: '永久' },
  { title: 'K0+694.583姚江枢纽G匝道桥12#-1桩基分项开工报告', piece: 8, docNo: '', unit: '中国建筑股份有限公司', date: '2022-12-10', term: '永久' },
  { title: '监理月报', piece: 1, docNo: '', unit: '浙江公路水运工程监理有限公司', date: '2023-05-25', term: '30年' },
  { title: '桥梁工程套筒原材料报验单', piece: 2, docNo: 'TTJ-2022-01-10-001', unit: '浙江交工集团股份有限公司', date: '2023-04-26', term: '30年' },
  { title: '柯诸高速公路工程项目关于钢筋加工场存在问题及处理意见', piece: 1, docNo: 'JLZL-010', unit: '浙江交工集团股份有限公司', date: '2023-04-27', term: '30年' },
  { title: '柯诸高速公路工程项目关于钢筋加工场存在问题及处理意见', piece: 2, docNo: 'JLZL-010', unit: '浙江交工集团股份有限公司', date: '2023-04-27', term: '30年' },
  { title: '柯诸高速公路工程项目关于TJ01标2号隧道钢筋加工场检查意见', piece: 3, docNo: 'JLZL-TJ01-018', unit: '浙江公路水运工程监理有限公司', date: '2023-04-27', term: '30年' },
  { title: '柯诸高速公路工程项目关于TJ01标2号隧道钢筋加工场检查回复', piece: 4, docNo: 'JLZL-TJ01-018', unit: '浙江交工集团股份有限公司', date: '2023-04-27', term: '30年' },
  { title: '柯诸高速公路工程项目关于TJ01标2号隧道钢拱架间距检查意见', piece: 5, docNo: 'JLZL-YJ01-020', unit: '浙江公路水运工程监理有限公司', date: '2023-04-27', term: '30年' }
]

// 案卷演示数据（预归档案卷数弹窗）：房建及绿化工程 FJL 标段
const ROLL_DATES = [
  '2026-04-29', '2024-06-28', '2024-07-05', '2024-12-29', '2025-03-24', '2025-03-14',
  '2024-08-17', '2025-03-03', '2025-07-12', '2025-02-25', '2025-04-06'
]

function buildCatalogRows() {
  const rows = []
  for (let i = 0; i < 100; i++) {
    const s = CATALOG_SAMPLES[i % CATALOG_SAMPLES.length]
    const noPart = String(i + 1).padStart(3, '0')
    rows.push({
      archiveNo: 'KZGS-SG-' + noPart,
      title: s.title,
      piece: s.piece,
      docNo: s.docNo,
      unit: s.unit,
      date: s.date,
      comp: '',
      term: s.term,
      secret: ''
    })
  }
  return rows
}

function buildRollRows() {
  const rows = []
  for (let i = 0; i < 100; i++) {
    rows.push({
      archiveNo: 'KZGS-FJLH01-' + String(i + 31).padStart(4, '0'),
      title: '柯桥至诸暨高速公路工程房建及绿化工程FJL标段（第' + (i + 1) + '卷）',
      unit: '中铁十局集团有限公司',
      startDate: ROLL_DATES[i % ROLL_DATES.length]
    })
  }
  return rows
}

// 自定义报表可选字段（与汇总统计表列一致，visible 默认勾选状态与截图一致）
const REPORT_FIELDS = [
  { label: '预归档文件数', visible: true },
  { label: '预归档案卷数', visible: true },
  { label: '预归档数据量', visible: false },
  { label: '已归档文件数', visible: false },
  { label: '已归档案卷数', visible: false },
  { label: '已归档数据量', visible: false },
  { label: '数字化档案份数', visible: true },
  { label: '数字化档案页数', visible: true },
  { label: '数字化档案数据量', visible: true },
  { label: '电子档案份数', visible: true },
  { label: '电子档案页数', visible: true },
  { label: '电子档案数据量', visible: true },
  { label: '统计时间', visible: true }
]

export default {
  name: 'StatsSummary',
  data() {
    return {
      categories: ['项目申报文件', '设计文件', '工程管理文件', '施工文件', '监理文件', '竣工（交）工验收文件', '科研文件'],
      dateTypes: ['编制日期', '归档日期', '统计日期'],
      queryParams: { category: '', term: '', dateType: '', startDate: '', endDate: '' },
      treeData: JSON.parse(JSON.stringify(TREE_DATA)),
      // 自定义报表排序窗口
      reportDialog: {
        visible: false,
        selectedIndex: -1, // 当前选中行索引
        targetIndex: 1 // 「移至」目标序号
      },
      reportFields: REPORT_FIELDS.map(f => ({ ...f })),
      // 预归档文件数弹窗
      fileDialog: {
        visible: false,
        page: 1,
        size: 100,
        total: 0,
        allRows: [],
        filters: { title: '', responsible: '', archiveNo: '' }
      },
      // 预归档案卷数弹窗
      rollDialog: {
        visible: false,
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
    filePageData() {
      const start = (this.fileDialog.page - 1) * this.fileDialog.size
      return this.fileDialog.allRows.slice(start, start + this.fileDialog.size)
    },
    rollPageData() {
      const start = (this.rollDialog.page - 1) * this.rollDialog.size
      return this.rollDialog.allRows.slice(start, start + this.rollDialog.size)
    }
  },
  methods: {
    // ===== 工具条 =====
    handleSearch() {
      this.$message.success('搜索完成（演示数据）')
    },
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
    // ===== 预归档文件数弹窗 =====
    openFileDialog(row) {
      this.fileDialog.page = 1
      this.fileDialog.size = 100
      this.fileDialog.total = row.fileCount
      this.fileDialog.allRows = buildCatalogRows()
      this.fileDialog.filters = { title: '', responsible: '', archiveNo: '' }
      this.fileDialog.visible = true
    },
    handleFileSearch() {
      this.fileDialog.page = 1
      const f = this.fileDialog.filters
      let rows = buildCatalogRows()
      if (f.title) rows = rows.filter(r => r.title.includes(f.title))
      if (f.archiveNo) rows = rows.filter(r => r.archiveNo.includes(f.archiveNo))
      if (f.responsible) rows = rows.filter(r => r.unit.includes(f.responsible))
      this.fileDialog.allRows = rows
      this.$message.success('搜索完成（演示数据）')
    },
    handleFileReset() {
      this.fileDialog.filters = { title: '', responsible: '', archiveNo: '' }
      this.fileDialog.page = 1
      this.fileDialog.allRows = buildCatalogRows()
    },
    // ===== 预归档案卷数弹窗 =====
    openRollDialog(row) {
      this.rollDialog.page = 1
      this.rollDialog.size = 100
      this.rollDialog.total = row.rollCount
      this.rollDialog.allRows = buildRollRows()
      this.rollDialog.filters = { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      this.rollSelected = { count: 0, pieces: 0, pages: 0 }
      this.rollDialog.visible = true
    },
    handleRollSelectionChange(selection) {
      this.rollSelected.count = selection.length
      this.rollSelected.pieces = selection.length
      this.rollSelected.pages = selection.length * 35
    },
    handleRollSearch() {
      this.rollDialog.page = 1
      const f = this.rollDialog.filters
      let rows = buildRollRows()
      if (f.title) rows = rows.filter(r => r.title.includes(f.title))
      if (f.archiveNo) rows = rows.filter(r => r.archiveNo.includes(f.archiveNo))
      if (f.unit) rows = rows.filter(r => r.unit.includes(f.unit))
      this.rollDialog.allRows = rows
      this.$message.success('搜索完成（演示数据）')
    },
    handleRollReset() {
      this.rollDialog.filters = { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      this.rollDialog.page = 1
      this.rollDialog.allRows = buildRollRows()
    }
  }
}
</script>

<style lang="scss" scoped>
.summary-page {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #fff;
  padding: 10px;

  .table-container {
    height: calc(100% - 100px);
  }

  .list-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;

    .range-sep {
      margin: 0 2px;
      color: #606266;
    }

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

.roll-dialog-body,
.catalog-dialog-body {
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

  .section-bar {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 12px;
    margin-bottom: 8px;
    background: #409eff;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    border-radius: 2px;
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
