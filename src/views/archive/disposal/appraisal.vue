<template>
  <div class="appraisal-page">
    <!-- 档案鉴定记录 -->
    <div class="table-block" style="margin-bottom: 10px;">
      <div class="section-bar">
        <span class="section-title">档案鉴定记录</span>
        <div class="section-tools">
          <el-input v-model="keyword" placeholder="请输入事务名称" size="mini" clearable class="kw-input" @keyup.enter.native="handleSearch" />
          <el-button size="mini" icon="el-icon-search" class="tool-btn b-blue" @click="handleSearch" />
          <adaptive-actions class="section-actions" :items="recordActions" size="mini" @click="onRecordAction" />
        </div>
      </div>

      <el-table
        ref="recordTable"
        :data="filteredRecords"
        border
        stripe
        size="mini"
        row-key="id"
        height="calc(100% - 90px)"
        highlight-current-row
        @selection-change="handleSelectionChange"
        @current-change="handleCurrentChange"
      >
        <el-table-column type="expand" width="40">
          <template slot-scope="scope">
            <div class="expand-box">
              <span class="eb-item"><label>事务名称：</label>{{ scope.row.name }}</span>
              <span class="eb-item"><label>鉴定方式：</label>{{ scope.row.method }}</span>
              <span class="eb-item"><label>鉴定日期：</label>{{ scope.row.date }}</span>
              <span class="eb-item"><label>续存保管期限：</label>{{ scope.row.keepTerm || '—' }}</span>
              <span class="eb-item"><label>密级：</label>{{ scope.row.secret || '—' }}</span>
              <span class="eb-item"><label>开放预览：</label>{{ scope.row.openPreview || '—' }}</span>
              <span class="eb-item"><label>新增人：</label>{{ scope.row.creator }}</span>
              <span class="eb-item"><label>新增时间：</label>{{ scope.row.createTime }}</span>
              <span class="eb-item wide"><label>鉴定理由：</label>{{ scope.row.reason }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="50" align="center" reserve-selection />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="审核状态" width="100" align="center" sortable>
          <template slot-scope="scope">
            <a :class="scope.row.approved ? 'st-link st-pass' : 'st-link st-pending'" @click="openAuditLog(scope.row)">{{ scope.row.approved ? '审核通过' : '未审核' }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="事务名称" min-width="160" show-overflow-tooltip sortable align="center" />
        <el-table-column prop="method" label="鉴定方式" width="100" align="center" sortable />
        <el-table-column prop="date" label="鉴定日期" width="110" align="center" sortable />
        <el-table-column prop="keepTerm" label="续存保管期限" width="130" align="center" sortable />
        <el-table-column prop="secret" label="密级" width="80" align="center" sortable />
        <el-table-column prop="openPreview" label="开放预览" width="100" align="center" sortable />
        <el-table-column prop="reason" label="鉴定理由" min-width="180" show-overflow-tooltip sortable align="center" />
        <el-table-column prop="creator" label="新增人" width="130" align="center" sortable />
        <el-table-column prop="createTime" label="新增时间" width="110" align="center" sortable />
      </el-table>

      <div class="pager-bar">
        <span class="pager-total">共 {{ filteredRecords.length }} 条</span>
        <el-pagination layout="prev, pager, next" :total="filteredRecords.length" :page-size="100" :current-page.sync="page" class="pager" />
        <span class="pager-jump">前往 <input v-model="pageInput" class="page-input" disabled> 页</span>
        <el-select v-model="pageSize" size="mini" class="page-size-dd" disabled>
          <el-option label="100条/页" :value="100" />
        </el-select>
      </div>
    </div>

    <!-- 档案鉴定明细 -->
    <div class="table-block">
      <div class="section-bar">
        <span class="section-title">档案鉴定明细</span>
        <div class="section-tools">
          <adaptive-actions class="section-actions" :items="detailActions" size="mini" @click="onDetailAction" />
        </div>
      </div>
      <el-table
        ref="detailTable"
        :data="detailRows"
        border
        stripe
        size="mini"
        height="calc(100% - 70px)"
        row-key="id"
        @selection-change="handleDetailSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="案卷/文件题名" min-width="180" show-overflow-tooltip sortable />
        <el-table-column prop="dh" label="档号" width="110" align="center" sortable />
        <el-table-column prop="bzdw" label="编制单位" min-width="140" show-overflow-tooltip sortable />
        <el-table-column prop="bgqx" label="保管期限" width="90" align="center" sortable />
        <el-table-column prop="mj" label="密级" width="80" align="center" sortable />
        <el-table-column prop="pdfSize" label="案卷/文件pdf大小" width="140" align="center" sortable />
        <el-table-column prop="fjzs" label="附件总数" width="90" align="center" sortable />
        <el-table-column prop="ys" label="页数" width="80" align="center" sortable />
      </el-table>
    </div>

    <!-- 审核日志弹窗 -->
    <el-dialog title="审核日志" :visible.sync="logVisible" width="690px" append-to-body custom-class="audit-log-dialog">
      <div class="log-timeline">
        <div v-for="(t, i) in currentLog.timeline" :key="i" class="log-timeline-item">{{ t.time }} - {{ t.user }} {{ t.action }}</div>
        <div v-if="!currentLog.timeline.length" class="log-timeline-item">暂无日志</div>
      </div>
      <div v-if="currentLog.initiator" class="log-block">
        <div class="log-block-title">发起人</div>
        <div class="log-item">
          <div class="log-line">
            <span>{{ currentLog.initiator.time }} - {{ currentLog.initiator.user }}</span>
            <span class="log-status">{{ currentLog.initiator.status }}</span>
          </div>
          <div class="log-opinion">意见:{{ currentLog.initiator.opinion }}</div>
        </div>
      </div>
      <div v-if="currentLog.approver" class="log-block">
        <div class="log-block-title">审批人</div>
        <div class="log-item">
          <div class="log-line">
            <span>{{ currentLog.approver.time }} - {{ currentLog.approver.user }}</span>
            <span class="log-status">{{ currentLog.approver.status }}</span>
          </div>
          <div class="log-opinion">意见:{{ currentLog.approver.opinion }}</div>
        </div>
      </div>
    </el-dialog>
    <!-- 新增/编辑鉴定记录弹窗 -->
    <el-dialog
      :visible.sync="formVisible"
      :fullscreen="formFullscreen"
      :width="formFullscreen ? '100%' : '640px'"
      :title="form.id ? '编辑鉴定记录' : '新增鉴定记录'"
      custom-class="record-form-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <template slot="title">
        <div class="record-form-header">
          <span class="rf-title">{{ form.id ? '编辑鉴定记录' : '新增鉴定记录' }}</span>
          <i class="el-icon-crop rf-fullscreen" @click="formFullscreen = !formFullscreen" />
        </div>
      </template>
      <el-form ref="recordForm" :model="form" :rules="formRules" label-width="100px" size="small">
        <el-form-item label="事务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入事务名称" maxlength="50" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="鉴定方式" prop="method">
              <el-select v-model="form.method" placeholder="请选择" style="width: 100%">
                <el-option v-for="m in methodOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="鉴定日期" prop="date">
              <el-date-picker v-model="form.date" type="date" placeholder="请选择" value-format="yyyy-MM-dd" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="续存保管期限" prop="keepTerm">
          <el-select v-model="form.keepTerm" placeholder="请选择" style="width: 100%" clearable>
            <el-option v-for="t in keepTermOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密级" prop="secret">
              <el-select v-model="form.secret" placeholder="请选择" style="width: 100%" clearable>
                <el-option v-for="s in secretOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开放预览" prop="openPreview">
              <el-select v-model="form.openPreview" placeholder="请选择" style="width: 100%" clearable>
                <el-option v-for="o in openOptions" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="鉴定理由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="4" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template slot="footer">
        <el-button type="primary" size="small" @click="confirmRecordForm">确定</el-button>
        <el-button size="small" @click="formVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 添加案卷目录弹窗 -->
    <roll-catalog-select-dialog :visible.sync="rollCatalogVisible" @confirm="handleRollConfirm" />
    <!-- 添加文件目录弹窗 -->
    <file-catalog-select-dialog :visible.sync="fileCatalogVisible" @confirm="handleFileConfirm" />
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions'
import RollCatalogSelectDialog from './components/roll-catalog-select-dialog.vue'
import FileCatalogSelectDialog from './components/file-catalog-select-dialog.vue'

// 鉴定记录（与截图一致）
const RECORDS = [
  { id: 1, approved: true, name: '测试', method: '其他', date: '2023-05-01', keepTerm: '', secret: '', openPreview: '', reason: '测试测试测试测试测试测试', creator: '管理员(开发用)', createTime: '2023-05-17' },
  { id: 2, approved: false, name: '测试', method: '续存', date: '2022-12-12', keepTerm: '', secret: '', openPreview: '', reason: '鉴定理由鉴定理由鉴定理由鉴定理由', creator: '姚德顺', createTime: '2022-12-12' }
]

// 鉴定明细（与截图一致）
const DETAIL_ROWS = [
  { id: 'd1', title: '拆卷', dh: 'BB-2', bzdw: '测试', bgqx: '10年', mj: '机密', pdfSize: '441.05KB', fjzs: 12, ys: 36 },
  { id: 'd2', title: '测试示例01', dh: 'AAA-1', bzdw: 'XXX有限公司', bgqx: '其他', mj: '公开', pdfSize: '316.47KB', fjzs: 10, ys: 41 }
]

// 审核日志（点击审核状态打开弹窗）
const AUDIT_LOG_MAP = {
  1: {
    timeline: [{ time: '2023-05-17 11:46:49', user: '姚德顺', action: '提请审核' }],
    initiator: { time: '2023-05-17 11:46:49', user: '姚德顺', status: '发起申请', opinion: '' },
    approver: { time: '2023-05-17 11:46:56', user: '姚德顺', status: '已同意', opinion: '同意' }
  },
  2: {
    timeline: [{ time: '2022-12-12 10:20:31', user: '姚德顺', action: '提请审核' }],
    initiator: { time: '2022-12-12 10:20:31', user: '姚德顺', status: '发起申请', opinion: '' },
    approver: null
  }
}

export default {
  name: 'DisposalAppraisal',
  components: { AdaptiveActions, RollCatalogSelectDialog, FileCatalogSelectDialog },
  data() {
    return {
      keyword: '',
      page: 1,
      pageInput: '1',
      pageSize: 100,
      records: RECORDS,
      currentRow: null,
      selections: [],
      detailSelections: [],
      // 鉴定明细（按记录 id 分组；删除/追加时整体重新赋值以保证响应式）
      detailMap: { 1: DETAIL_ROWS, 2: DETAIL_ROWS },
      // 添加案卷/文件目录弹窗
      rollCatalogVisible: false,
      fileCatalogVisible: false,
      logVisible: false,
      currentLog: { timeline: [], initiator: null, approver: null },
      // 新增/编辑鉴定记录弹窗
      formVisible: false,
      formFullscreen: false,
      form: { id: null, name: '', method: '', date: '', keepTerm: '', secret: '', openPreview: '', reason: '' },
      formRules: {
        name: [{ required: true, message: '请输入事务名称', trigger: 'blur' }],
        method: [{ required: true, message: '请选择鉴定方式', trigger: 'change' }],
        date: [{ required: true, message: '请选择鉴定日期', trigger: 'change' }]
      },
      methodOptions: ['销毁', '续存', '其他'],
      keepTermOptions: ['10年', '30年', '永久', '其他'],
      secretOptions: ['公开', '内部', '秘密', '机密', '绝密'],
      openOptions: ['是', '否']
    }
  },
  computed: {
    filteredRecords() {
      const kw = this.keyword.trim()
      if (!kw) return this.records
      return this.records.filter(r => r.name.indexOf(kw) > -1)
    },
    detailRows() {
      return this.currentRow ? (this.detailMap[this.currentRow.id] || []) : []
    },
    /** 档案鉴定记录工具栏按钮（AdaptiveActions 配置，不带颜色） */
    recordActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-circle-plus-outline' },
        { key: 'edit', label: '修改', icon: 'el-icon-edit' },
        { key: 'submitAudit', label: '提请审核', icon: 'el-icon-s-custom' },
        { key: 'cancelAudit', label: '撤销提请', icon: 'el-icon-refresh-left' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'exportForm', label: '导出登记表', icon: 'el-icon-download' },
        { key: 'printForm', label: '打印登记表', icon: 'el-icon-printer' }
      ]
    },
    /** 档案鉴定明细工具栏按钮（AdaptiveActions 配置，不带颜色） */
    detailActions() {
      return [
        { key: 'addRoll', label: '添加案卷目录', icon: 'el-icon-folder-add' },
        { key: 'addFileCatalog', label: '添加文件目录', icon: 'el-icon-document-copy' },
        { key: 'refreshDetail', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'exportList', label: '导出鉴定清册', icon: 'el-icon-download' },
        { key: 'printList', label: '打印鉴定清册', icon: 'el-icon-printer' }
      ]
    }
  },
  mounted() {
    // 默认选中第一条记录（与截图一致）
    this.$nextTick(() => {
      if (this.records.length && this.$refs.recordTable) this.$refs.recordTable.setCurrentRow(this.records[0])
      // 默认勾选第2条明细（与截图一致）
      if (this.detailRows[1] && this.$refs.detailTable) this.$refs.detailTable.toggleRowSelection(this.detailRows[1], true)
    })
  },
  methods: {
    /** 打开新增弹窗（默认鉴定日期为当天） */
    openRecordForm() {
      this.formFullscreen = false
      this.form = { id: null, name: '', method: '', date: this.today(), keepTerm: '', secret: '', openPreview: '', reason: '' }
      this.formVisible = true
      this.$nextTick(() => this.$refs.recordForm && this.$refs.recordForm.clearValidate())
    },
    /** 打开编辑弹窗（回填选中记录） */
    openRecordEdit() {
      const row = this.selections[0] || this.currentRow
      if (!row) {
        this.$message.warning('请先选择鉴定记录')
        return
      }
      this.formFullscreen = false
      this.form = {
        id: row.id,
        name: row.name,
        method: row.method,
        date: row.date,
        keepTerm: row.keepTerm,
        secret: row.secret,
        openPreview: row.openPreview,
        reason: row.reason
      }
      this.formVisible = true
      this.$nextTick(() => this.$refs.recordForm && this.$refs.recordForm.clearValidate())
    },
    /** 确定提交：校验通过后新增或更新记录 */
    confirmRecordForm() {
      this.$refs.recordForm.validate(valid => {
        if (!valid) return
        if (this.form.id) {
          const row = this.records.find(r => r.id === this.form.id)
          if (row) Object.assign(row, this.form)
          this.$message.success('修改成功')
        } else {
          const maxId = Math.max(0, ...this.records.map(r => r.id))
          this.records.push({ ...this.form, id: maxId + 1, approved: false, creator: '管理员(开发用)', createTime: this.today() })
          this.$message.success('新增成功')
        }
        this.formVisible = false
      })
    },
    /** 当天日期 yyyy-MM-dd */
    today() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    },
    /** 删除选中的鉴定记录（其鉴定明细一并清除） */
    handleRecordRemove() {
      const rows = this.selections
      if (!rows.length) {
        this.$message.warning('请先选择鉴定记录')
        return
      }
      this.$confirm(`确定删除选中的 ${rows.length} 条鉴定记录吗？删除后其鉴定明细一并清除`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(() => {
        const ids = rows.map(r => r.id)
        this.records = this.records.filter(r => !ids.includes(r.id))
        const map = { ...this.detailMap }
        ids.forEach(id => this.$delete(map, id))
        this.detailMap = map
        if (this.currentRow && ids.includes(this.currentRow.id)) {
          this.currentRow = null
          this.$refs.recordTable && this.$refs.recordTable.setCurrentRow()
        }
        this.$refs.recordTable && this.$refs.recordTable.clearSelection()
        this.$message.success(`已删除 ${rows.length} 条鉴定记录`)
      }).catch(() => {})
    },
    /** 删除选中的鉴定明细 */
    handleDetailRemove() {
      const rows = this.detailSelections
      if (!rows.length) {
        this.$message.warning('请先选择明细记录')
        return
      }
      if (!this.currentRow) return
      this.$confirm(`确定删除选中的 ${rows.length} 条鉴定明细吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(() => {
        const ids = rows.map(r => r.id)
        const rest = (this.detailMap[this.currentRow.id] || []).filter(r => !ids.includes(r.id))
        // 整体重新赋值触发响应式更新
        this.detailMap = { ...this.detailMap, [this.currentRow.id]: rest }
        this.$refs.detailTable && this.$refs.detailTable.clearSelection()
        this.$message.success(`已删除 ${rows.length} 条鉴定明细`)
      }).catch(() => {})
    },
    /** 打开添加案卷目录弹窗（需先选中鉴定记录） */
    openRollCatalog() {
      if (!this.currentRow) {
        this.$message.warning('请先选择鉴定记录')
        return
      }
      this.rollCatalogVisible = true
    },
    /** 打开添加文件目录弹窗（需先选中鉴定记录） */
    openFileCatalog() {
      if (!this.currentRow) {
        this.$message.warning('请先选择鉴定记录')
        return
      }
      this.fileCatalogVisible = true
    },
    /** 案卷目录弹窗确定：勾选项追加到当前记录的鉴定明细 */
    handleRollConfirm(rows) {
      this.appendDetail(rows.map((r, i) => ({
        id: 'r' + Date.now() + '_' + i,
        title: r.title,
        dh: r.archiveNo,
        bzdw: r.unit,
        bgqx: r.term,
        mj: r.secret,
        pdfSize: '316.47KB',
        fjzs: 8 + i,
        ys: 30 + i * 3
      })))
      this.$message.success(`已添加 ${rows.length} 条案卷目录到鉴定明细`)
    },
    /** 文件目录弹窗确定：勾选项追加到当前记录的鉴定明细 */
    handleFileConfirm(rows) {
      this.appendDetail(rows.map((r, i) => ({
        id: 'f' + Date.now() + '_' + i,
        title: r.title,
        dh: r.archiveNo,
        bzdw: r.author,
        bgqx: r.term,
        mj: r.secret,
        pdfSize: '220.13KB',
        fjzs: 5 + i,
        ys: 12 + i * 2
      })))
      this.$message.success(`已添加 ${rows.length} 条文件目录到鉴定明细`)
    },
    /** 追加明细行（整体重新赋值触发响应式） */
    appendDetail(items) {
      if (!this.currentRow) return
      const key = this.currentRow.id
      const rest = (this.detailMap[key] || []).concat(items)
      this.detailMap = { ...this.detailMap, [key]: rest }
    },
    /** 档案鉴定记录工具栏按钮统一分发 */
    onRecordAction(item) {
      const handlers = {
        refresh: () => this.handleRefresh(),
        add: () => this.openRecordForm(),
        edit: () => this.openRecordEdit(),
        submitAudit: () => this.notifyDemo('提请审核', true),
        cancelAudit: () => this.notifyDemo('撤销提请', true),
        remove: () => this.handleRecordRemove(),
        exportForm: () => this.notifyDemo('导出登记表'),
        printForm: () => this.notifyDemo('打印登记表'),
        detail: () => this.handleMore('info')
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    /** 档案鉴定明细工具栏按钮统一分发 */
    onDetailAction(item) {
      const handlers = {
        addRoll: () => this.openRollCatalog(),
        addFileCatalog: () => this.openFileCatalog(),
        refreshDetail: () => this.handleDetailRefresh(),
        remove: () => this.handleDetailRemove(),
        exportList: () => this.notifyDetail('导出鉴定清册'),
        printList: () => this.notifyDetail('打印鉴定清册'),
        detail: () => this.handleDetailMore('info')
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    handleSearch() {
      this.$message.success('查询完成')
    },
    handleRefresh() {
      this.keyword = ''
      this.$message.success('已刷新')
    },
    notifyDemo(action, needSelection) {
      if (needSelection && !this.selections.length) {
        this.$message.warning('请先选择鉴定记录')
        return
      }
      this.$message.info(action + '')
    },
    notifyDetail(action, needSelection) {
      if (needSelection && !this.detailSelections.length) {
        this.$message.warning('请先选择明细记录')
        return
      }
      this.$message.info(action + '')
    },
    handleMore(cmd) {
      if (cmd === 'info') {
        if (!this.selections.length) {
          this.$message.warning('请先选择鉴定记录')
          return
        }
        this.$message.info('查看鉴定记录详细信息')
      }
    },
    handleDetailMore(cmd) {
      if (cmd === 'info') {
        if (!this.detailSelections.length) {
          this.$message.warning('请先选择明细记录')
          return
        }
        this.$message.info('查看明细详细信息')
      }
    },
    handleDetailRefresh() {
      this.$message.success('鉴定明细已刷新')
    },
    handleSelectionChange(rows) {
      this.selections = rows
    },
    handleDetailSelectionChange(rows) {
      this.detailSelections = rows
    },
    handleCurrentChange(row) {
      this.currentRow = row
    },
    // 点击审核状态 → 打开审核日志弹窗
    openAuditLog(row) {
      this.currentLog = AUDIT_LOG_MAP[row.id] || { timeline: [], initiator: null, approver: null }
      this.logVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.appraisal-page {
  background: #fff;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.table-block {
  flex: 0 0 calc(50% - 10px);
  overflow: hidden;
  width: 100%;
}

.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $themeColor;
  padding: 5px 12px;

  .section-title {
    color: #fff;
    font-size: 13px;
    font-weight: bold;
  }

  .section-tools {
    display: flex;
    align-items: center;

    .kw-input {
      width: 180px;
      margin-right: 6px;
    }

    .section-actions {
      flex: 1;
      min-width: 0;
      margin-left: 6px;
    }

    .tool-btn {
      margin-left: 6px;
      font-size: 12px;
    }
  }
}

.expand-box {
  padding: 8px 20px;

  .eb-item {
    display: inline-block;
    margin-right: 30px;
    line-height: 26px;
    font-size: 12px;
    color: #606266;

    &.wide {
      display: block;
      margin-right: 0;
    }

    label {
      color: #909399;
    }
  }
}

.st-link {
  cursor: pointer;
  font-size: 12px;

  &:hover {
    text-decoration: underline;
  }

  &.st-pass {
    color: #67c23a;
  }

  &.st-pending {
    color: #606266;
  }
}

.pager-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;

  .pager-total {
    font-size: 12px;
    color: #606266;
    margin-right: 12px;
  }

  .pager-jump {
    font-size: 12px;
    color: #606266;
    margin: 0 10px;

    .page-input {
      width: 40px;
      height: 24px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      text-align: center;
      margin: 0 4px;
    }
  }

  .page-size-dd {
    width: 100px;
  }
}
</style>

<style lang="scss">
/* 审核日志弹窗（append-to-body 需全局样式） */
.audit-log-dialog {
  .el-dialog__header {
    padding: 14px 20px;
  }

  .el-dialog__title {
    font-size: 15px;
    color: #303133;
  }

  .el-dialog__body {
    padding: 0 20px 20px;
    background: #f0f2f5;
    max-height: 60vh;
    overflow: auto;
  }

  .log-timeline {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 12px 15px;
    font-size: 13px;
    color: #303133;

    .log-timeline-item {
      line-height: 22px;
    }
  }

  .log-block {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 10px 15px 12px;
    margin-top: 12px;

    .log-block-title {
      font-weight: bold;
      font-size: 13px;
      color: #303133;
      margin-bottom: 8px;
    }

    .log-item {
      background: #f5f7fa;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 13px;

      .log-line {
        display: flex;
        justify-content: space-between;
        color: #303133;
      }

      .log-status {
        color: $themeColor;
      }

      .log-opinion {
        margin-top: 6px;
        color: #606266;
      }
    }
  }
}

/* 新增/编辑鉴定记录弹窗（append-to-body 需全局样式） */
.record-form-dialog {
  .el-dialog__header {
    padding: 14px 20px;
  }

  .record-form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 26px;

    .rf-title {
      font-size: 15px;
      color: #303133;
    }

    .rf-fullscreen {
      font-size: 15px;
      color: #909399;
      cursor: pointer;

      &:hover {
        color: $themeColor;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 24px 6px;
  }

  .el-form-item {
    margin-bottom: 16px;
  }

  .el-textarea__inner {
    resize: vertical;
  }
}
</style>
