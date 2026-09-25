<template>
  <!-- 档案数量统计：档案分类树表 + 点击数量列打开明细弹窗（静态演示数据，不请求接口） -->
  <div class="app-container quantity-page">
    <!-- 顶部工具条 -->
    <div class="list-toolbar">
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
      <el-button size="small" type="success" icon="el-icon-notebook-2" @click="handleExportLedger">导出案卷台账</el-button>
      <el-button size="small" icon="el-icon-setting" @click="handleCustomReport">自定义报表</el-button>
    </div>

    <!-- 档案分类统计树表 -->
    <div class="table-container">
      <el-table
        :data="treeData"
        row-key="id"
        border
        size="small"
        height="100%"
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="档案分类" min-width="280">
          <template slot-scope="{ row }">
            <i :class="row.children && row.children.length ? 'el-icon-folder row-icon folder' : 'el-icon-document row-icon doc'" />
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <!-- 案卷总数：点击数值打开案卷总数弹窗 -->
        <el-table-column label="案卷总数" width="150" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.rollCount > 0" class="num-link" @click="openRollDialog(row)">{{ row.rollCount }}</span>
            <span v-else>{{ row.rollCount }}</span>
          </template>
        </el-table-column>
        <!-- 文件目录总数(预归档案卷)：点击数值打开对应弹窗 -->
        <el-table-column label="文件目录总数(预归档案卷)" width="200" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.fileCountRoll > 0" class="num-link" @click="openCatalogDialog(row, 'roll')">{{ row.fileCountRoll }}</span>
            <span v-else>{{ row.fileCountRoll }}</span>
          </template>
        </el-table-column>
        <!-- 文件目录总数(预归档文件)：点击数值打开对应弹窗 -->
        <el-table-column label="文件目录总数(预归档文件)" width="200" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.fileCountFile > 0" class="num-link" @click="openCatalogDialog(row, 'file')">{{ row.fileCountFile }}</span>
            <span v-else>{{ row.fileCountFile }}</span>
          </template>
        </el-table-column>
        <!-- 空文件目录总数(预归档文件)：点击数值打开对应弹窗 -->
        <el-table-column label="空文件目录总数(预归档文件)" width="210" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.emptyCount > 0" class="num-link" @click="openCatalogDialog(row, 'empty')">{{ row.emptyCount }}</span>
            <span v-else>{{ row.emptyCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上传文件总页数(预归档案卷)" width="210" align="center">
          <template slot-scope="{ row }">{{ row.pageCount }}</template>
        </el-table-column>
        <el-table-column label="统计时间" width="175" align="center">
          <template slot-scope="{ row }">{{ row.statTime }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 案卷总数弹窗 -->
    <el-dialog
      title="案卷总数"
      :visible.sync="rollDialog.visible"
      width="1300px"
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
            <el-table-column label="档号" prop="archiveNo" width="160" sortable show-overflow-tooltip />
            <el-table-column label="案卷题名" prop="title" min-width="280" sortable show-overflow-tooltip />
            <el-table-column label="编制单位" prop="unit" min-width="210" sortable show-overflow-tooltip />
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

    <!-- 文件目录类明细弹窗：文件目录总数(预归档案卷) / 文件目录总数(预归档文件) / 空文件目录总数(预归档文件) -->
    <el-dialog
      :title="catalogDialog.title"
      :visible.sync="catalogDialog.visible"
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
            <el-input v-model="catalogDialog.filters.title" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">责任者</div>
            <el-input v-model="catalogDialog.filters.responsible" size="small" />
          </div>
          <div class="filter-item">
            <div class="filter-label">档号</div>
            <el-input v-model="catalogDialog.filters.archiveNo" size="small" />
          </div>
          <div class="filter-btns">
            <el-button type="primary" size="small" @click="handleCatalogSearch">搜索</el-button>
            <el-button type="primary" size="small" @click="handleCatalogReset">重置</el-button>
          </div>
        </div>
        <!-- 右侧：文件目录 + 文件 双表 -->
        <div class="dialog-main">
          <div class="section-bar"><span>文件目录</span></div>
          <el-table :data="catalogPageData" border size="small" height="330" @selection-change="handleCatalogSelectionChange">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" width="65" align="center">
              <template slot-scope="{ $index }">{{ (catalogDialog.page - 1) * catalogDialog.size + $index + 1 }}</template>
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
            :current-page.sync="catalogDialog.page"
            :page-size.sync="catalogDialog.size"
            :page-sizes="[100, 200, 500]"
            :total="catalogDialog.total"
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
        ref="reportSortTable"
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
// 档案数量统计（静态演示数据，不请求接口）
const STAT_TIME = '2026-09-01 17:24:43'

// 树形统计数据：与统计截图一致
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', rollCount: 16242, fileCountRoll: 330292, fileCountFile: 49764, emptyCount: 16712, pageCount: 1192191, statTime: STAT_TIME,
    children: [
      {
        id: 11, name: '第一部分 项目申报文件', rollCount: 34, fileCountRoll: 142, fileCountFile: 0, emptyCount: 0, pageCount: 9133, statTime: STAT_TIME,
        children: [
          { id: 111, name: '一、项目建议书及批复', rollCount: 3, fileCountRoll: 7, fileCountFile: 0, emptyCount: 0, pageCount: 104, statTime: STAT_TIME },
          { id: 112, name: '二、可行性研究报告及批复', rollCount: 3, fileCountRoll: 14, fileCountFile: 0, emptyCount: 0, pageCount: 1836, statTime: STAT_TIME },
          { id: 113, name: '三、环境影响报告及批复文件', rollCount: 2, fileCountRoll: 10, fileCountFile: 0, emptyCount: 0, pageCount: 1063, statTime: STAT_TIME },
          { id: 114, name: '四、水土保持方案报告及批复', rollCount: 2, fileCountRoll: 4, fileCountFile: 0, emptyCount: 0, pageCount: 440, statTime: STAT_TIME },
          { id: 115, name: '五、项目咨询、评估、论证', rollCount: 21, fileCountRoll: 71, fileCountFile: 0, emptyCount: 0, pageCount: 4970, statTime: STAT_TIME },
          { id: 116, name: '六、投资、特许经营协议', rollCount: 1, fileCountRoll: 0, fileCountFile: 0, emptyCount: 0, pageCount: 0, statTime: STAT_TIME },
          { id: 117, name: '七、工程融资贷款计划', rollCount: 2, fileCountRoll: 36, fileCountFile: 0, emptyCount: 0, pageCount: 720, statTime: STAT_TIME }
        ]
      },
      { id: 12, name: '第二部分 设计文件', rollCount: 208, fileCountRoll: 2344, fileCountFile: 0, emptyCount: 0, pageCount: 45115, statTime: STAT_TIME },
      { id: 13, name: '第三部分 工程管理文件', rollCount: 753, fileCountRoll: 8582, fileCountFile: 3, emptyCount: 0, pageCount: 202766, statTime: STAT_TIME },
      { id: 14, name: '第四部分 施工文件', rollCount: 11868, fileCountRoll: 223046, fileCountFile: 47020, emptyCount: 16502, pageCount: 547761, statTime: STAT_TIME },
      { id: 15, name: '第五部分 监理文件', rollCount: 2931, fileCountRoll: 94537, fileCountFile: 2740, emptyCount: 209, pageCount: 155233, statTime: STAT_TIME },
      { id: 16, name: '第六部分 竣工（交）工验收文件', rollCount: 423, fileCountRoll: 1427, fileCountFile: 0, emptyCount: 0, pageCount: 223528, statTime: STAT_TIME },
      { id: 17, name: '第七部分 科研文件', rollCount: 25, fileCountRoll: 214, fileCountFile: 1, emptyCount: 1, pageCount: 8655, statTime: STAT_TIME }
    ]
  }
]

// 案卷演示数据
const ROLL_UNITS = ['浙江交工集团股份有限公司', '中国建筑股份有限公司', '浙江公路水运工程监理有限公司', '柯桥至诸暨高速公路工程建设指挥部']
const ROLL_TITLES = [
  '项目建议书及批复', '可行性研究报告及批复', '环境影响报告及批复文件', '水土保持方案报告及批复',
  '施工图设计文件', '工程施工管理文件', '施工技术方案及交底记录', '分项工程开工报告',
  '监理月报及巡查记录', '交（竣）工验收文件'
]

// 文件目录演示数据（预归档文件）
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

// 根据数量生成分页模拟列表（仅首页展示真实示例，其余页由演示数据循环生成）
function buildCatalogRows(category, row) {
  const isFile = category === 'file' // 预归档文件：有责任者/文号数据
  const empty = category === 'empty' // 空文件目录：文号多为空，题名相同重复
  const total = empty ? row.emptyCount : (isFile ? row.fileCountFile : row.fileCountRoll)
  const rows = []
  for (let i = 0; i < 100; i++) {
    const s = CATALOG_SAMPLES[i % CATALOG_SAMPLES.length]
    const noPart = String(i + 1).padStart(3, '0')
    rows.push({
      archiveNo: empty ? '' : (isFile ? 'KZGS-SG-' + noPart : 'KZGS-JL-' + noPart),
      title: s.title,
      piece: s.piece,
      docNo: empty ? (i % 3 === 0 ? s.docNo : '') : s.docNo,
      unit: s.unit,
      date: s.date,
      comp: '',
      term: s.term,
      secret: ''
    })
  }
  return { rows, total }
}

function buildRollRows(row) {
  const rows = []
  for (let i = 0; i < 100; i++) {
    const noPart = String(i + 1).padStart(4, '0')
    rows.push({
      archiveNo: 'KZGS-' + noPart,
      title: ROLL_TITLES[i % ROLL_TITLES.length],
      unit: ROLL_UNITS[i % ROLL_UNITS.length],
      startDate: '2022-0' + ((i % 9) + 1) + '-15'
    })
  }
  return rows
}

// 自定义报表可选字段（与统计表列一致）
const REPORT_FIELDS = [
  '当前节点案卷数', '案卷总数', '空案卷总数',
  '当前节点文件目录数(预归档案卷)', '当前节点文件目录数(预归档文件)',
  '文件目录总数(预归档案卷)', '文件目录总数(预归档文件)',
  '空文件目录总数(预归档案卷)', '空文件目录总数(预归档文件)',
  '上传文件总页数(预归档案卷)', '上传文件总页数(预归档文件)',
  '上传文件总份数(预归档案卷)', '上传文件总份数(预归档文件)',
  '统计时间'
].map(label => ({ label, visible: false }))

export default {
  name: 'StatsQuantity',
  data() {
    return {
      dateTypes: ['编制日期', '归档日期', '统计日期'],
      queryParams: { dateType: '编制日期', startDate: '', endDate: '' },
      treeData: JSON.parse(JSON.stringify(TREE_DATA)),
      // 自定义报表排序窗口
      reportDialog: {
        visible: false,
        selectedIndex: -1, // 当前选中行索引
        targetIndex: 1 // 「移至」目标序号
      },
      reportFields: REPORT_FIELDS.map(f => ({ ...f })),
      // 案卷总数弹窗
      rollDialog: {
        visible: false,
        page: 1,
        size: 100,
        total: 0,
        allRows: [],
        filters: { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      },
      rollSelected: { count: 0, pieces: 0, pages: 0 },
      // 文件目录类弹窗（预归档案卷 / 预归档文件 / 空文件目录 共用）
      catalogDialog: {
        visible: false,
        title: '',
        category: 'roll', // roll: 预归档案卷 file: 预归档文件 empty: 空文件目录
        page: 1,
        size: 100,
        total: 0,
        currentRow: null,
        allRows: [],
        filters: { title: '', responsible: '', archiveNo: '' }
      }
    }
  },
  computed: {
    canSort() {
      return this.reportDialog.selectedIndex >= 0 && this.reportDialog.selectedIndex < this.reportFields.length
    },
    rollPageData() {
      const start = (this.rollDialog.page - 1) * this.rollDialog.size
      return this.rollDialog.allRows.slice(start, start + this.rollDialog.size)
    },
    catalogPageData() {
      const start = (this.catalogDialog.page - 1) * this.catalogDialog.size
      return this.catalogDialog.allRows.slice(start, start + this.catalogDialog.size)
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
    handleExportLedger() {
      this.$message.success('导出案卷台账成功')
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
    // ===== 案卷总数弹窗 =====
    openRollDialog(row) {
      this.rollDialog.page = 1
      this.rollDialog.size = 100
      this.rollDialog.total = row.rollCount
      this.rollDialog.allRows = buildRollRows(row)
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
      this.rollDialog.allRows = this.rollDialog.allRows.filter(r => {
        const f = this.rollDialog.filters
        if (f.title && !r.title.includes(f.title)) return false
        if (f.archiveNo && !r.archiveNo.includes(f.archiveNo)) return false
        if (f.unit && !r.unit.includes(f.unit)) return false
        return true
      })
      this.rollDialog.total = this.rollDialog.allRows.length
      this.$message.success('搜索完成（演示数据）')
    },
    handleRollReset() {
      this.rollDialog.filters = { title: '', archiveNo: '', unit: '', startDate: '', endDate: '', term: '' }
      this.rollDialog.page = 1
      this.rollDialog.allRows = buildRollRows()
      this.rollDialog.total = this.rollDialog.allRows.length
    },
    // ===== 文件目录类弹窗 =====
    openCatalogDialog(row, category) {
      const titles = { roll: '文件目录总数(预归档案卷)', file: '文件目录总数(预归档文件)', empty: '空文件目录总数(预归档文件)' }
      this.catalogDialog.title = titles[category]
      this.catalogDialog.category = category
      this.catalogDialog.page = 1
      this.catalogDialog.size = 100
      this.catalogDialog.currentRow = row
      this.catalogDialog.filters = { title: '', responsible: '', archiveNo: '' }
      this.applyCatalogRows()
      this.catalogDialog.visible = true
    },
    applyCatalogRows() {
      const built = buildCatalogRows(this.catalogDialog.category, this.catalogDialog.currentRow || {})
      this.catalogDialog.allRows = built.rows
      this.catalogDialog.total = built.total
    },
    handleCatalogSearch() {
      this.catalogDialog.page = 1
      const f = this.catalogDialog.filters
      let rows = buildCatalogRows(this.catalogDialog.category, this.catalogDialog.currentRow || {}).rows
      if (f.title) rows = rows.filter(r => r.title.includes(f.title))
      if (f.archiveNo) rows = rows.filter(r => r.archiveNo.includes(f.archiveNo))
      if (f.responsible) rows = rows.filter(r => r.unit.includes(f.responsible))
      this.catalogDialog.allRows = rows
      this.catalogDialog.total = rows.length
      this.$message.success('搜索完成（演示数据）')
    },
    handleCatalogReset() {
      this.catalogDialog.filters = { title: '', responsible: '', archiveNo: '' }
      this.catalogDialog.page = 1
      this.applyCatalogRows()
    },
    handleCatalogSelectionChange() {}
  }
}
</script>

<style lang="scss" scoped>
.quantity-page {
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

    span + span { margin-left: 6px; }
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
