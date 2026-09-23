<template>
  <!--
    电子档案入库：上区"档案审核记录" + 下区"档案审核注册"
    纯静态 DEMO，不请求接口，无审批流程
  -->
  <div class="archive-entry-page">

    <!-- ========== 上区：档案审核记录 ========== -->
    <div class="panel record-panel">
      <div class="panel-header">
        <span class="panel-title">档案审核记录</span>
        <div class="panel-toolbar">
          <el-select v-model="searchField" size="small" class="search-field">
            <el-option label="事务名称" value="name" />
            <el-option label="题名" value="title" />
            <el-option label="档号" value="docNo" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="请输入"
            size="small"
            clearable
            class="search-input"
            @keyup.enter.native="doSearch"
          />
          <el-button size="small" icon="el-icon-search" class="btn-search" @click="doSearch" />

          <adaptive-actions :items="recordActions" size="small" @click="onRecordAction" />
        </div>
      </div>

      <el-table
        ref="recordTable"
        :data="pagedRecords"
        row-key="id"
        border
        stripe
        size="small"
        height="calc(100% - 40px)"
        empty-text="暂无数据"
        @selection-change="onRecordSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="序号" width="55" align="center">
          <template slot-scope="scope">{{ recordPageStart + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="140" align="center" sortable>
          <template slot-scope="{ row }">
            <el-link
              :type="row.auditStatus === '已归档' ? 'success' : 'info'"
              :underline="false"
              @click="showAuditLog(row)"
            >{{ row.auditStatus }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="事务名称" prop="name" min-width="320" align="center" show-overflow-tooltip sortable />
        <el-table-column label="事务类型" prop="type" width="160" align="center" sortable />
        <el-table-column label="四性检验情况" width="160" align="center">
          <template slot-scope="{ row }">
            <span :class="row.fourCheck === '通过' ? 'text-success' : 'text-muted'">{{ row.fourCheck }}</span>
          </template>
        </el-table-column>
        <el-table-column label="四性检验报告" prop="report" width="160" align="center">
          <template slot-scope="{ row }">
            <el-link v-if="row.report" type="primary" :underline="false" @click="viewReport(row)">{{ row.report }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="140" align="center" sortable />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="filteredRecords.length"
          :current-page.sync="recordPage"
          :page-size.sync="recordPageSize"
          :page-sizes="[10, 50, 100]"
        />
      </div>
    </div>

    <!-- ========== 下区：档案审核注册 ========== -->
    <div class="panel roll-panel">
      <div class="panel-header">
        <span class="panel-title">档案审核注册</span>
        <div class="panel-toolbar">
          <adaptive-actions :items="rollActions" size="small" @click="onRollAction" />
        </div>
      </div>

      <el-table
        ref="rollTable"
        :data="pagedRolls"
        row-key="id"
        border
        stripe
        size="small"
        empty-text="暂无数据"
        height="calc(100% - 40px)"
        @selection-change="onRollSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="序号" width="55" align="center">
          <template slot-scope="scope">{{ rollPageStart + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="案卷题名" prop="title" min-width="300" align="center" show-overflow-tooltip sortable />
        <el-table-column label="档号" prop="archiveNo" width="130" align="center" sortable />
        <el-table-column label="编制单位" prop="unit" min-width="180" align="center" show-overflow-tooltip sortable />
        <el-table-column label="文件类型" prop="fileType" width="120" align="center" sortable />
        <el-table-column label="组卷情况" width="100" align="center">
          <template slot-scope="{ row }">
            <span :class="row.rollStatus === '组卷成功' ? 'text-success' : 'text-muted'">{{ row.rollStatus }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" prop="fileSize" width="100" align="center" sortable />
        <el-table-column label="页数" prop="pages" width="80" align="center" sortable />
        <el-table-column label="签名情况" prop="signStatus" width="100" align="center" sortable />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="rollList.length"
          :current-page.sync="rollPage"
          :page-size.sync="rollPageSize"
          :page-sizes="[10, 50, 100]"
        />
      </div>
    </div>

    <!-- ========== 新增/修改审核记录弹窗 ========== -->
    <el-dialog
      :title="recordDialogMode === 'edit' ? '修改审核记录' : '新增审核记录'"
      :visible.sync="recordDialogVisible"
      width="680px"
      custom-class="record-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="recordForm" :model="recordForm" :rules="recordRules" label-width="110px" size="small">
        <el-form-item label="事务名称" prop="name">
          <el-input v-model="recordForm.name" placeholder="请输入事务名称" />
        </el-form-item>
        <el-form-item label="事务类型" prop="type">
          <el-select v-model="recordForm.type" placeholder="请选择" style="width: 100%">
            <el-option label="案卷目录" value="案卷目录" />
            <el-option label="文件目录" value="文件目录" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件材料(件)" prop="fileMaterial" class="dual-item">
          <el-input-number v-model="recordForm.fileMaterial" :min="0" controls-position="right" class="dual-main" />
          <span class="dual-sub-label">照片、声像(张、盒)</span>
          <el-input-number v-model="recordForm.photoVideo" :min="0" controls-position="right" class="dual-sub" />
        </el-form-item>
        <el-form-item label="电子文件(件)" prop="electronicFile" class="dual-item">
          <el-input-number v-model="recordForm.electronicFile" :min="0" controls-position="right" class="dual-main" />
          <span class="dual-sub-label">竣工图(张)</span>
          <el-input-number v-model="recordForm.drawing" :min="0" controls-position="right" class="dual-sub" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="recordForm.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="confirmRecord">确定</el-button>
        <el-button size="small" @click="recordDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 添加案盒弹窗 ========== -->
    <el-dialog
      title="添加案盒"
      :visible.sync="caseBoxDialogVisible"
      width="82%"
      top="4vh"
      custom-class="case-box-dialog"
      :close-on-click-modal="false"
    >
      <div class="case-box-body">
        <!-- 左侧：档案分类目录 -->
        <div class="case-box-tree">
          <div class="tree-header">档案分类目录</div>
          <el-tree
            :data="caseBoxTreeData"
            :props="caseBoxTreeProps"
            node-key="id"
            :default-expanded-keys="caseBoxExpandedKeys"
            highlight-current
            :expand-on-click-node="false"
            @node-click="onCaseBoxNodeClick"
          >
            <span slot-scope="{ node, data }" class="case-box-node">
              <i :class="caseBoxNodeIcon(node)" />
              <span class="case-box-node-label" :title="data.name">{{ data.name }}({{ data.boxCount }}/{{ data.fileCount }})</span>
            </span>
          </el-tree>
        </div>

        <!-- 右侧：案盒表格 -->
        <div class="case-box-table">
          <el-table
            ref="caseBoxTable"
            :data="pagedCaseBoxes"
            row-key="id"
            border
            stripe
            size="small"
            height="100%"
            empty-text="暂无数据"
            @selection-change="onCaseBoxSelectionChange"
          >
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column label="序号" width="55" align="center">
              <template slot-scope="scope">{{ caseBoxPageStart + scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="盒号" prop="boxNo" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="件数" prop="pieceCount" width="80" align="center" />
            <el-table-column label="机构(问题)" prop="orgIssue" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="附件总数" prop="attachCount" width="90" align="center" />
            <el-table-column label="页数" prop="pages" width="80" align="center" />
            <el-table-column label="备注" prop="remark" min-width="120" align="center" show-overflow-tooltip />
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="caseBoxRows.length"
              :current-page.sync="caseBoxPage"
              :page-size.sync="caseBoxPageSize"
              :page-sizes="[10, 50, 100]"
            />
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="confirmAddCaseBox">确定</el-button>
        <el-button size="small" @click="caseBoxDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 查看详细信息弹窗 ========== -->
    <el-dialog
      title="详细信息"
      :visible.sync="detailDialogVisible"
      width="860px"
      custom-class="detail-info-dialog"
      :close-on-click-modal="false"
    >
      <div class="detail-table">
        <div class="detail-row">
          <div class="detail-label">审核状态</div>
          <div class="detail-value">
            <span :class="detailData.auditStatus === '已归档' ? 'text-success' : ''">{{ detailData.auditStatus }}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">事务名称</div>
          <div class="detail-value">{{ detailData.name }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">事务类型</div>
          <div class="detail-value">{{ detailData.type }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">四性检验情况</div>
          <div class="detail-value">{{ detailData.fourCheck }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">四性检验报告</div>
          <div class="detail-value">{{ detailData.report }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">备注</div>
          <div class="detail-value">{{ detailData.remark }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">增加人</div>
          <div class="detail-value">{{ detailData.addPerson }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">增加时间</div>
          <div class="detail-value">{{ detailData.addTime }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">修改人</div>
          <div class="detail-value">{{ detailData.editPerson }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">修改时间</div>
          <div class="detail-value">{{ detailData.editTime }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">所在分类节点路径</div>
          <div class="detail-value">{{ detailData.nodePath }}</div>
        </div>
      </div>
      <template slot="footer">
        <span />
      </template>
    </el-dialog>

    <!-- ========== 审核日志弹窗 ========== -->
    <el-dialog
      title="审核日志"
      :visible.sync="auditLogVisible"
      width="620px"
      custom-class="audit-log-dialog"
      :close-on-click-modal="false"
    >
      <div class="log-summary">{{ auditLogData.summary }}</div>

      <div class="log-section">
        <div class="log-section-title">发起人</div>
        <div class="log-item">
          <div class="log-item-main">
            <div class="log-item-line">{{ auditLogData.initiator }}</div>
            <div class="log-item-line">意见:</div>
          </div>
          <span class="log-item-tag">{{ auditLogData.initiatorAction }}</span>
        </div>
      </div>

      <div class="log-section">
        <div class="log-section-title">立卷人</div>
        <div
          v-for="item in auditLogData.archivists"
          :key="item.time + item.user"
          class="log-item"
        >
          <div class="log-item-main">
            <div class="log-item-line">{{ item.time }} - {{ item.user }}</div>
            <div class="log-item-line">意见:{{ item.opinion }}</div>
          </div>
          <span class="log-item-tag">{{ item.action }}</span>
        </div>
      </div>

      <div class="log-section">
        <div class="log-section-title">审核人</div>
        <div
          v-for="item in auditLogData.auditors"
          :key="item.time + item.user"
          class="log-item"
        >
          <div class="log-item-main">
            <div class="log-item-line">{{ item.time }} - {{ item.user }}</div>
            <div class="log-item-line">意见:{{ item.opinion }}</div>
          </div>
          <span class="log-item-tag">{{ item.action }}</span>
        </div>
      </div>

      <template slot="footer">
        <span />
      </template>
    </el-dialog>
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions/index.vue'

/** 档案审核记录 mock（与截图一致：1 条"测试"记录） */
const MOCK_RECORDS = [
  { id: 1, auditStatus: '已归档', name: '测试', type: '案卷目录', fourCheck: '未检验', report: '', remark: '' }
]

/** 提取未审核目录时的案卷 mock */
const MOCK_ROLLS = [
  { id: 101, title: '柯桥至诸暨高速公路工程接线桥通道、姚江枢纽互通区域施工的安全性评价报告', archiveNo: 'KZGS-Z-0011', unit: '绍兴市柯诸高速公路有限公司', fileType: '数字化档案', rollStatus: '组卷成功', fileSize: '2.72MB', pages: 125, signStatus: '' },
  { id: 102, title: '柯桥至诸暨高速公路工程地质灾害危险性评估报告及备案登记表、监管承压介质报告', archiveNo: 'KZGS-Z-0012', unit: '绍兴市柯诸高速公路有限公司', fileType: '数字化档案', rollStatus: '组卷成功', fileSize: '33.62MB', pages: 85, signStatus: '' },
  { id: 103, title: '柯桥至诸暨高速公路工程压覆矿产资源分布情况调查报告及审查意见、请示', archiveNo: 'KZGS-Z-0013', unit: '绍兴市柯诸高速公路有限公司', fileType: '数字化档案', rollStatus: '组卷成功', fileSize: '12.28MB', pages: 34, signStatus: '' }
]

/** 审核日志 mock（与截图一致：发起人/立卷人/审核人） */
const MOCK_AUDIT_LOG = {
  summary: '2026-03-03 09:37:56 - 柯诸业主测试(勿选) 提请审核',
  initiator: '2026-03-03 09:37:56 - 柯诸业主测试(勿选)',
  initiatorAction: '发起申请',
  archivists: [
    { time: '2026-03-03 09:39:24', user: '张鲁莎', action: '已同意', opinion: '同意' }
  ],
  auditors: [
    { time: '2026-03-03 09:41:18', user: '陈艳', action: '已同意', opinion: '同意' }
  ]
}

/** 添加案盒弹窗：档案分类目录树 mock（与截图一致，boxCount/fileCount 显示为 (盒数/件数)） */
const MOCK_CASE_BOX_TREE = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', boxCount: 0, fileCount: 0, children: [
      {
        id: 11, name: '第一部分 项目申报文件', boxCount: 0, fileCount: 0, children: [
          { id: 111, name: '一、项目建议书及批复', boxCount: 0, fileCount: 0 },
          { id: 112, name: '二、可行性研究报告及批复', boxCount: 0, fileCount: 0 },
          { id: 113, name: '三、环境影响报告及批复', boxCount: 0, fileCount: 0 },
          { id: 114, name: '四、水土保持方案报告及', boxCount: 0, fileCount: 0 },
          { id: 115, name: '五、项目咨询、评估、论', boxCount: 0, fileCount: 0 },
          { id: 116, name: '六、投资、融资等经营协', boxCount: 0, fileCount: 0 },
          { id: 117, name: '七、工程融资贷款计划、', boxCount: 0, fileCount: 0 }
        ]
      },
      { id: 12, name: '第二部分 设计文件', boxCount: 0, fileCount: 0 },
      { id: 13, name: '第三部分 工程管理文件', boxCount: 0, fileCount: 0 },
      { id: 14, name: '第四部分 施工文件', boxCount: 0, fileCount: 0 },
      { id: 15, name: '第五部分 监理文件', boxCount: 0, fileCount: 0 },
      {
        id: 16, name: '第六部分 竣工（交）工验收文件', boxCount: 0, fileCount: 0, children: [
          { id: 161, name: '一、交竣工验收文件', boxCount: 0, fileCount: 0 },
          { id: 162, name: '二、工程交接表', boxCount: 0, fileCount: 0 },
          { id: 163, name: '三、计量支付报表及汇编', boxCount: 0, fileCount: 0 },
          { id: 164, name: '四、工程变更文件', boxCount: 0, fileCount: 0 },
          { id: 165, name: '五、专项验收文件', boxCount: 0, fileCount: 0 }
        ]
      },
      { id: 17, name: '第七部分 科研文件', boxCount: 0, fileCount: 0 }
    ]
  }
]

export default {
  name: 'ArchiveEntry',
  components: { AdaptiveActions },
  data() {
    return {
      // 上区：档案审核记录
      searchField: 'name',
      searchKeyword: '',
      appliedField: 'name',
      appliedKeyword: '',
      recordList: JSON.parse(JSON.stringify(MOCK_RECORDS)),
      recordSelection: [],
      recordPage: 1,
      recordPageSize: 100,

      // 下区：档案审核注册
      rollList: [],
      rollSelection: [],
      rollPage: 1,
      rollPageSize: 100,

      // 审核日志弹窗
      auditLogVisible: false,
      auditLogData: { summary: '', initiator: '', initiatorAction: '', archivists: [], auditors: [] },

      // 新增/修改审核记录弹窗
      recordDialogVisible: false,
      recordDialogMode: 'add', // add：新增；edit：修改
      editingRecord: null,
      recordForm: { name: '', type: '', fileMaterial: 0, photoVideo: 0, electronicFile: 0, drawing: 0, remark: '' },
      recordRules: {
        name: [{ required: true, message: '请输入事务名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择事务类型', trigger: 'change' }],
        fileMaterial: [{ required: true, message: '请输入文件材料件数', trigger: 'blur' }],
        electronicFile: [{ required: true, message: '请输入电子文件件数', trigger: 'blur' }]
      },

      // 详细信息弹窗
      detailDialogVisible: false,
      detailData: {
        auditStatus: '',
        name: '',
        type: '',
        fourCheck: '',
        report: '',
        remark: '',
        addPerson: '',
        addTime: '',
        editPerson: '',
        editTime: '',
        nodePath: ''
      },

      // 添加案盒弹窗
      caseBoxDialogVisible: false,
      caseBoxTreeData: JSON.parse(JSON.stringify(MOCK_CASE_BOX_TREE)),
      caseBoxTreeProps: { children: 'children', label: 'name' },
      caseBoxExpandedKeys: [1, 11],
      caseBoxRows: [],
      caseBoxSelection: [],
      caseBoxPage: 1,
      caseBoxPageSize: 100
    }
  },
  computed: {
    /** 选中记录是否为未归档（未审核）状态 */
    selectedRecord() {
      return this.recordSelection.length === 1 ? this.recordSelection[0] : null
    },
    /** 未归档：可 修改/删除/提请审核/撤销提请 */
    canOperateRecord() {
      return !!this.selectedRecord && this.selectedRecord.auditStatus === '未归档'
    },
    /** 未归档或已归档均可 查看详细信息/打印（需选中一条） */
    canViewRecord() {
      return !!this.selectedRecord
    },
    /** 上区工具栏按钮（AdaptiveActions 配置，不带 type/color 保持无色） */
    recordActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus' },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', disabled: !this.canViewRecord },
        { key: 'del', label: '删除', icon: 'el-icon-delete', disabled: !this.canViewRecord },
        { key: 'submitAudit', label: '提请审核', icon: 'el-icon-s-promotion', disabled: !this.canViewRecord },
        { key: 'cancelAudit', label: '撤销提请', icon: 'el-icon-refresh-left', disabled: !this.canViewRecord },
        { key: 'printAcceptForm', label: '打印移交验收签记表', icon: 'el-icon-printer', disabled: !this.canViewRecord },
        { key: 'viewRecordDetail', label: '查看详细信息', icon: 'el-icon-view', disabled: !this.canViewRecord }
      ]
    },
    /** 下区工具栏按钮（AdaptiveActions 配置） */
    rollActions() {
      return [
        { key: 'fetchUnaudited', label: '提取未审核目录', icon: 'el-icon-download', disabled: !this.recordSelection.length },
        { key: 'addRollDir', label: '添加案盒', icon: 'el-icon-circle-plus-outline', disabled: !this.recordSelection.length },
        { key: 'delRollDir', label: '删除', icon: 'el-icon-delete', disabled: !this.rollSelection.length },
        { key: 'viewRollDetail', label: '查看详细信息', icon: 'el-icon-view', disabled: !this.rollSelection.length },
        { key: 'sortRolls', label: '排序', icon: 'el-icon-sort' }
      ]
    },
    /** 按字段 + 关键字过滤审核记录 */
    filteredRecords() {
      const kw = this.appliedKeyword.trim()
      if (!kw) return this.recordList
      return this.recordList.filter(r => String(r[this.appliedField] || '').includes(kw))
    },
    pagedRecords() {
      const start = (this.recordPage - 1) * this.recordPageSize
      return this.filteredRecords.slice(start, start + this.recordPageSize)
    },
    recordPageStart() {
      return (this.recordPage - 1) * this.recordPageSize
    },
    pagedRolls() {
      const start = (this.rollPage - 1) * this.rollPageSize
      return this.rollList.slice(start, start + this.rollPageSize)
    },
    rollPageStart() {
      return (this.rollPage - 1) * this.rollPageSize
    },
    pagedCaseBoxes() {
      const start = (this.caseBoxPage - 1) * this.caseBoxPageSize
      return this.caseBoxRows.slice(start, start + this.caseBoxPageSize)
    },
    caseBoxPageStart() {
      return (this.caseBoxPage - 1) * this.caseBoxPageSize
    }
  },
  methods: {
    // ===== 上区：档案审核记录 =====
    /** 上区工具栏按钮统一分发 */
    onRecordAction(item) {
      const handlers = {
        refresh: () => this.refreshRecords(),
        add: () => this.addRecord(),
        edit: () => this.editRecord(),
        del: () => this.delRecord(),
        submitAudit: () => this.submitAudit(),
        cancelAudit: () => this.cancelAudit(),
        printAcceptForm: () => this.printAcceptForm(),
        viewRecordDetail: () => this.viewRecordDetail()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    /** 下区工具栏按钮统一分发 */
    onRollAction(item) {
      const handlers = {
        fetchUnaudited: () => this.fetchUnaudited(),
        addRollDir: () => this.addRollDir(),
        delRollDir: () => this.delRollDir(),
        viewRollDetail: () => this.viewRollDetail(),
        sortRolls: () => this.sortRolls()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    doSearch() {
      this.appliedField = this.searchField
      this.appliedKeyword = this.searchKeyword
      this.recordPage = 1
    },
    refreshRecords() {
      this.recordList = JSON.parse(JSON.stringify(MOCK_RECORDS))
      this.recordPage = 1
      this.appliedKeyword = ''
      this.searchKeyword = ''
      this.$nextTick(() => {
        this.recordSelection = []
        this.rollList = []
        this.rollSelection = []
      })
      this.$message.success('刷新成功（静态 DEMO）')
    },
    onRecordSelectionChange(selection) {
      this.recordSelection = selection || []
    },
    addRecord() {
      this.recordDialogMode = 'add'
      this.editingRecord = null
      this.recordForm = { name: '', type: '', fileMaterial: 0, photoVideo: 0, electronicFile: 0, drawing: 0, remark: '' }
      this.recordDialogVisible = true
      this.$nextTick(() => {
        this.$refs.recordForm && this.$refs.recordForm.clearValidate()
      })
    },
    /** 弹窗确定：新增模式追加记录，修改模式回写选中记录 */
    confirmRecord() {
      this.$refs.recordForm.validate(valid => {
        if (!valid) return
        const f = this.recordForm
        if (this.recordDialogMode === 'edit' && this.editingRecord) {
          const row = this.recordList.find(x => x.id === this.editingRecord.id)
          if (row) {
            row.name = f.name
            row.type = f.type
            row.remark = f.remark
          }
          this.recordDialogVisible = false
          this.$message.success('修改成功')
          return
        }
        this.recordList.push({
          id: Date.now(),
          auditStatus: '未归档',
          name: f.name,
          type: f.type,
          fourCheck: '未检验',
          report: '',
          remark: f.remark
        })
        this.recordDialogVisible = false
        this.$message.success('已新增（静态 DEMO 仅前端添加）')
      })
    },
    /** 修改：复用新增弹窗并回填选中记录 */
    editRecord() {
      const row = this.selectedRecord
      if (!row) { this.$message.warning('请先选择要修改的审核记录'); return }
      this.recordDialogMode = 'edit'
      this.editingRecord = row
      this.recordForm = {
        name: row.name,
        type: row.type,
        fileMaterial: row.fileMaterial || 0,
        photoVideo: row.photoVideo || 0,
        electronicFile: row.electronicFile || 0,
        drawing: row.drawing || 0,
        remark: row.remark
      }
      this.recordDialogVisible = true
      this.$nextTick(() => {
        this.$refs.recordForm && this.$refs.recordForm.clearValidate()
      })
    },
    delRecord() {
      if (!this.recordSelection.length) { this.$message.warning('请先选择要删除的审核记录'); return }
      this.$confirm(`删除 ${this.recordSelection.length} 条审核记录？删除后其注册目录一并清空`, '提示', { type: 'warning' })
        .then(() => {
          const ids = new Set(this.recordSelection.map(x => x.id))
          this.recordList = this.recordList.filter(x => !ids.has(x.id))
          this.rollList = []
          this.rollSelection = []
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    printAcceptForm() {
      if (!this.selectedRecord) { this.$message.warning('请先选择审核记录'); return }
      this.$message.info(`打印移交验收签记表：${this.selectedRecord.name}`)
    },
    /** 提请审核：未归档记录提交审核 */
    submitAudit() {
      const row = this.selectedRecord
      if (!row) return
      this.$confirm(`确认对事务「${row.name}」提请审核？`, '提示', { type: 'info' })
        .then(() => { this.$message.success('已提请审核（静态 DEMO）') })
        .catch(() => {})
    },
    /** 撤销提请：撤回审核申请 */
    cancelAudit() {
      const row = this.selectedRecord
      if (!row) return
      this.$confirm(`确认撤销事务「${row.name}」的审核申请？`, '提示', { type: 'warning' })
        .then(() => { this.$message.success('已撤销提请（静态 DEMO）') })
        .catch(() => {})
    },
    /** 查看详细信息：填充弹窗数据并打开 */
    viewRecordDetail() {
      const row = this.recordSelection[0]
      if (!row) { this.$message.warning('请先选择审核记录'); return }
      this.detailData = {
        auditStatus: row.auditStatus || '',
        name: row.name || '',
        type: row.type || '',
        fourCheck: row.fourCheck || '',
        report: row.report || '',
        remark: row.remark || '',
        addPerson: '柯诸业主测试(勿选)',
        addTime: '2026-03-03',
        editPerson: '',
        editTime: '',
        nodePath: ''
      }
      this.detailDialogVisible = true
    },
    viewReport(row) {
      this.$message.info(`查看四性检验报告：${row.report}`)
    },
    /** 点击审核状态 → 显示审核日志弹窗 */
    showAuditLog() {
      this.auditLogData = JSON.parse(JSON.stringify(MOCK_AUDIT_LOG))
      this.auditLogVisible = true
    },

    // ===== 下区：档案审核注册 =====
    onRollSelectionChange(selection) {
      this.rollSelection = selection || []
    },
    /** 提取未审核目录：加载 mock 案卷 */
    fetchUnaudited() {
      if (!this.recordSelection.length) return
      this.rollList = JSON.parse(JSON.stringify(MOCK_ROLLS))
      this.rollPage = 1
      this.$message.success(`已提取 ${this.rollList.length} 条未审核案卷目录（静态 DEMO）`)
    },
    /** 添加案盒：打开弹窗 */
    addRollDir() {
      if (!this.recordSelection.length) return
      this.caseBoxRows = []
      this.caseBoxSelection = []
      this.caseBoxPage = 1
      this.caseBoxDialogVisible = true
    },
    // ===== 添加案盒弹窗 =====
    /** 节点图标：文件夹（有子节点）/ 盒状（叶子节点） */
    caseBoxNodeIcon(node) {
      return node.childNodes && node.childNodes.length
        ? 'el-icon-folder-opened case-box-node-icon'
        : 'el-icon-document-copy case-box-node-icon'
    },
    /** 点击分类节点：加载该节点下的案盒（静态 DEMO，未挂接数据则展示为空） */
    onCaseBoxNodeClick(data) {
      this.caseBoxSelection = []
      this.caseBoxPage = 1
      // 静态 DEMO：分类节点下暂无已挂接案盒，展示为空
      this.caseBoxRows = []
      this.$message.info(`已切换到分类节点「${data.name}」（静态 DEMO，暂无案盒数据）`)
    },
    onCaseBoxSelectionChange(selection) {
      this.caseBoxSelection = selection || []
    },
    /** 添加案盒弹窗确定：将选中案盒加入审核注册列表 */
    confirmAddCaseBox() {
      if (!this.caseBoxSelection.length) {
        this.$message.warning('请先在左侧选择分类节点并勾选案盒')
        return
      }
      const picked = this.caseBoxSelection.map(x => JSON.parse(JSON.stringify(x)))
      this.rollList = this.rollList.concat(picked)
      this.caseBoxDialogVisible = false
      this.$message.success(`已添加 ${picked.length} 个案盒（静态 DEMO 仅前端添加）`)
    },
    delRollDir() {
      if (!this.rollSelection.length) return
      this.$confirm(`删除 ${this.rollSelection.length} 条案卷目录？`, '提示', { type: 'warning' })
        .then(() => {
          const ids = new Set(this.rollSelection.map(x => x.id))
          this.rollList = this.rollList.filter(x => !ids.has(x.id))
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    viewRollDetail() {
      const row = this.rollSelection[0]
      if (!row) return
      this.$message.info(`查看案卷「${row.archiveNo}」详细信息`)
    },
    sortRolls() {
      this.$message.info('排序')
    }
  }
}
</script>

<style lang="scss" scoped>
.archive-entry-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  gap: 8px;
  padding: 8px;
  height: 100%;
  overflow: hidden;

  .panel {
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    // 上区稍高
    &.record-panel { flex: 1.15; }
    &.roll-panel { flex: 1; }

    // 蓝色标题栏
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 12px;
      background: linear-gradient(90deg, #3d8ef8, #409eff);

      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        white-space: nowrap;
      }

      .panel-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        /* 必须占满剩余宽度，否则 AdaptiveActions 容器宽度随按钮数变化，
           ResizeObserver 陷入「收缩↔重算」死循环，按钮会被错误收纳进「...」 */
        flex: 1;
        min-width: 0;

        .search-field { 
          width: 120px; height: 26px;

          ::v-deep .el-input__inner { height: 26px; line-height: 26px; }
          ::v-deep .el-input__icon { height: 26px; line-height: 26px; }
        }
        .search-input { width: 180px; }
        .btn-search { margin-left: 0; }
      }
    }

    ::v-deep .el-table { flex: 1; }

    .pagination-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 8px 12px;
      border-top: 1px solid #ebeef5;
      background: #fafbfc;
    }
  }

  .text-success { color: #67c23a; }
  .text-muted { color: #909399; }

  ::v-deep .record-dialog {
    .el-dialog__body {
      padding: 24px 28px 8px;
    }

    .el-form-item {
      margin-bottom: 20px;
    }

    // 双输入行：主输入 + 副标签 + 副输入
    .dual-item {
      .el-form-item__content {
        display: flex;
        align-items: center;
      }

      .dual-main {
        width: 200px;
        margin-right: 12px;
      }

      .dual-sub-label {
        width: 110px;
        margin-right: 8px;
        font-size: 13px;
        color: #606266;
        text-align: left;
        line-height: 1.4;
      }

      .dual-sub {
        flex: 1;
        width: auto;
      }
    }

    .el-input-number .el-input__inner { text-align: left; }
  }

  ::v-deep .audit-log-dialog {
    .el-dialog__title { font-weight: 600; }

    .log-summary {
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      color: #606266;
      font-size: 13px;
    }

    .log-section {
      margin-bottom: 14px;

      &:last-child { margin-bottom: 0; }

      .log-section-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .log-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        background: #f5f7fa;
        border-radius: 4px;

        .log-item-main {
          flex: 1;
          .log-item-line { font-size: 13px; color: #606266; line-height: 1.8; }
        }

        .log-item-tag { font-size: 13px; color: #303133; white-space: nowrap; }
      }
    }

    .el-dialog__footer { padding: 0; }
  }

  ::v-deep .detail-info-dialog {
    .el-dialog__title { font-weight: 600; }

    .el-dialog__body {
      padding: 16px 24px 24px;
    }

    .detail-table {
      border: 1px solid #dcdfe6;
    }

    .detail-row {
      display: flex;
      align-items: stretch;

      & + .detail-row {
        border-top: 1px solid #dcdfe6;
      }
    }

    .detail-label {
      width: 160px;
      flex-shrink: 0;
      padding: 12px 14px;
      background: #f5f7fa;
      border-right: 1px solid #dcdfe6;
      font-size: 13px;
      color: #303133;
    }

    .detail-value {
      flex: 1;
      padding: 12px 14px;
      font-size: 13px;
      color: #303133;
      word-break: break-all;
    }
  }

  ::v-deep .case-box-dialog {
    .el-dialog__body {
      padding: 12px 20px 8px;
    }

    .case-box-body {
      display: flex;
      height: 62vh;
      gap: 12px;
    }

    // 左侧：档案分类目录
    .case-box-tree {
      width: 250px;
      flex-shrink: 0;
      border: 1px solid #dcdfe6;
      display: flex;
      flex-direction: column;

      .tree-header {
        padding: 8px 12px;
        background: #f5f7fa;
        border-bottom: 1px solid #dcdfe6;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }

      .el-tree {
        flex: 1;
        overflow: auto;
        padding: 6px 4px;
      }

      .case-box-node {
        display: flex;
        align-items: center;
        overflow: hidden;
        font-size: 13px;

        .case-box-node-icon {
          margin-right: 5px;
          font-size: 14px;
        }

        .el-icon-folder-opened,
        .el-icon-folder {
          color: #e6a23c;
        }

        .el-icon-document-copy {
          color: #409eff;
        }

        .case-box-node-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    // 右侧：案盒表格
    .case-box-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-table {
        flex: 1;

        .el-table__body-wrapper {
          overflow-y: auto;
        }
      }

      .pagination-wrap {
        padding: 8px 0 4px;
      }
    }
  }
}
</style>
