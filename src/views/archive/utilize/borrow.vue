<template>
  <div class="app-container borrow-page">
    <!-- 借阅记录 -->
    <div class="section-bar">
      <span class="bar-title">借阅</span>
      <el-input v-model="filterName" placeholder="请输入事务名称" size="small" style="width: 170px" clearable @keyup.enter.native="handleSearch" />
      <el-button size="small" icon="el-icon-search" @click="handleSearch" />
      <adaptive-actions class="bar-actions" :items="borrowActions" size="small" @click="onBorrowAction" />
    </div>

    <el-table
      ref="mainTable"
      :data="rows"
      border
      stripe
      height="calc(60% - 80px)"
      highlight-current-row
      @current-change="handleCurrentChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="status" label="审核状态" width="100" align="center">
        <template slot-scope="{ row }">
          <span :class="row.status === '审核通过' ? 'status-ok' : 'status-normal'">{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="事务名称" min-width="300" show-overflow-tooltip>
        <template slot-scope="{ row }">
          <span :class="row.status === '审核通过' ? 'name-link-red' : 'name-link-blue'" @click="openDetail(row)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="way" label="利用方式" width="130" align="center" />
      <el-table-column prop="startDate" label="借阅起日期" width="120" align="center" />
      <el-table-column prop="endDate" label="借阅止日期" width="120" align="center" />
      <el-table-column prop="purpose" label="用途" width="80" align="center" />
      <el-table-column prop="attachment" label="附件" min-width="160" />
      <el-table-column prop="creator" label="增加人" width="110" align="center" />
      <el-table-column prop="createTime" label="增加时间" width="170" align="center" />
      <el-table-column prop="remark" label="备注" min-width="140" />
    </el-table>
    <el-pagination
      background
      layout="total, prev, pager, next, sizes, jumper"
      :current-page.sync="page"
      :page-size.sync="size"
      :total="total"
      :page-sizes="[100, 200, 500]"
      style="margin-top: 8px"
    />

    <!-- 详细信息（借阅明细） -->
    <div class="section-bar sub-bar">
      <span class="bar-title">详细信息</span>
      <adaptive-actions class="bar-actions" :items="detailActions" size="small" @click="onDetailBarAction" />
    </div>

    <el-table :data="detailRows" border stripe height="calc(40% - 50px)" @selection-change="handleDetailSelectionChange">
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="code" label="档号/文件编号" width="260" align="center" />
      <el-table-column prop="title" label="案卷/文件题名/文件名称" min-width="420" show-overflow-tooltip />
      <el-table-column prop="returnDate" label="归还日期" width="160" align="center" />
      <el-table-column label="是否归还" width="120" align="center">
        <template slot-scope="{ row }">
          <span :class="row.returned ? 'back-ok' : 'back-no'">{{ row.returned ? '已归还' : '未归还' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详细信息弹窗 -->
    <el-dialog title="详细信息" custom-class="detail-dialog" :visible.sync="detailVisible" width="860px" append-to-body>
      <table class="detail-table">
        <tr>
          <th>审核状态</th>
          <td><span :class="detail.status === '审核通过' ? 'status-ok' : 'status-normal'">{{ detail.status }}</span></td>
        </tr>
        <tr>
          <th>事务名称</th>
          <td><span :class="detail.status === '审核通过' ? 'detail-name' : 'detail-name-blue'">{{ detail.name }}</span></td>
        </tr>
        <tr><th>利用方式</th><td>{{ detail.way }}</td></tr>
        <tr><th>借阅起日期</th><td>{{ detail.startDate }}</td></tr>
        <tr><th>借阅止日期</th><td>{{ detail.endDate }}</td></tr>
        <tr><th>用途</th><td>{{ detail.purpose }}</td></tr>
        <tr><th>附件</th><td>{{ detail.attachment }}</td></tr>
        <tr><th>增加人</th><td>{{ detail.creator }}</td></tr>
        <tr><th>增加时间</th><td>{{ detail.createTime }}</td></tr>
        <tr><th>备注</th><td>{{ detail.remark }}</td></tr>
        <tr><th>所在分类节点路径</th><td>{{ detail.nodePath }}</td></tr>
      </table>
      <div slot="footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 添加案卷目录弹窗 -->
    <roll-catalog-dialog :visible.sync="rollCatalogVisible" @confirm="handleRollConfirm" />

    <!-- 添加文件目录弹窗 -->
    <file-catalog-dialog :visible.sync="fileCatalogVisible" @confirm="handleFileConfirm" />

    <!-- 添加文件弹窗 -->
    <add-file-dialog :visible.sync="addFileVisible" @confirm="handleAddFileConfirm" />

    <!-- 归还事务弹窗 -->
    <el-dialog
      title="归还事务"
      :visible.sync="returnDialog.visible"
      width="900px"
      top="6vh"
      custom-class="return-dialog"
      append-to-body
    >
      <div class="return-section">
        <div class="return-section-bar">
          <span class="return-section-title">归还事务目录</span>
          <div class="return-section-tools">
            <el-button size="mini" type="success" icon="el-icon-refresh" @click="handleReturnRefresh">刷新</el-button>
            <el-button size="mini" icon="el-icon-takeaway-box" @click="handleReturnSubmit">归还</el-button>
            <el-button size="mini" icon="el-icon-s-check" @click="returnNotify('提请审核')">提请审核</el-button>
            <el-button size="mini" icon="el-icon-refresh-left" @click="returnNotify('撤销审核')">撤销审核</el-button>
            <el-dropdown size="mini" trigger="click" style="margin-left: 8px" @command="returnNotify">
              <el-button size="mini">…<i class="el-icon-arrow-down el-icon--right" /></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="打印">打印</el-dropdown-item>
                <el-dropdown-item command="导出excel">导出excel</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button size="mini" icon="el-icon-arrow-up" style="margin-left: 8px" @click="toggleReturnTop" />
          </div>
        </div>
        <el-table
          ref="returnTable"
          :data="returnRows"
          border
          stripe
          height="260"
          highlight-current-row
          @current-change="handleReturnCurrentChange"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="事务名称" min-width="420" align="center" show-overflow-tooltip />
          <el-table-column prop="status" label="审核状态" width="220" align="center">
            <template slot-scope="{ row }">
              <span :class="row.status === '审核通过' ? 'status-ok' : 'status-normal'">{{ row.status }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          background
          layout="total, prev, pager, next, sizes, jumper"
          :current-page.sync="returnPage"
          :page-size.sync="returnSize"
          :total="returnTotal"
          :page-sizes="[100, 200, 500]"
          style="margin-top: 8px"
        />
      </div>
      <div class="return-section" style="margin-top: 12px">
        <div class="return-section-bar">
          <span class="return-section-title">归还文件</span>
          <div class="return-section-tools">
            <el-button size="mini" icon="el-icon-arrow-up" @click="toggleReturnFiles" />
          </div>
        </div>
        <el-table :data="returnDetailRows" border stripe height="200">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="code" label="档号/文件编号" min-width="260" align="center" show-overflow-tooltip />
          <el-table-column prop="title" label="案卷题名/文件题名/文件名称" min-width="420" show-overflow-tooltip />
          <el-table-column label="是否归还" width="120" align="center">
            <template slot-scope="{ row }">
              <span :class="row.returned ? 'back-ok' : 'back-no'">{{ row.returned ? '已归还' : '未归还' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button size="small" @click="returnDialog.visible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 新增/修改纸质借阅申请弹窗 -->
    <el-dialog
      :title="borrowApplyDialog.type === 'edit' ? '修改纸质借阅申请' : '新增纸质借阅申请'"
      :visible.sync="borrowApplyDialog.visible"
      width="760px"
      top="6vh"
      custom-class="borrow-apply-dialog"
      append-to-body
    >
      <el-form ref="borrowApplyForm" :model="borrowApplyForm" :rules="borrowApplyRules" label-width="110px" size="small">
        <el-form-item label="事务名称" prop="name" required>
          <el-input v-model="borrowApplyForm.name" placeholder="请输入事务名称" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="利用人" prop="user" required>
              <el-input v-model="borrowApplyForm.user" placeholder="请输入利用人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="利用方式" prop="way" required>
              <el-select v-model="borrowApplyForm.way" placeholder="请选择" style="width: 100%">
                <el-option label="查阅" value="查阅" />
                <el-option label="下载" value="下载" />
                <el-option label="打印" value="打印" />
                <el-option label="复制" value="复制" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="borrowApplyForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="borrowApplyForm.email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="借阅起日期" prop="startDate" required>
              <el-date-picker
                v-model="borrowApplyForm.startDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="借阅止日期" prop="endDate" required>
              <el-date-picker
                v-model="borrowApplyForm.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="发往单位" prop="targetUnit">
              <el-input v-model="borrowApplyForm.targetUnit" placeholder="请输入发往单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否加盖公章" prop="stamp" required>
              <el-select v-model="borrowApplyForm.stamp" placeholder="请选择" style="width: 100%">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="借阅部门" prop="dept" required>
          <el-input v-model="borrowApplyForm.dept" placeholder="请输入借阅部门" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose" required>
          <el-input v-model="borrowApplyForm.purpose" placeholder="请输入用途" />
        </el-form-item>
        <el-form-item label="借阅档案名称" prop="archiveNames">
          <el-input v-model="borrowApplyForm.archiveNames" type="textarea" :rows="3" placeholder="请输入借阅档案名称" />
        </el-form-item>
        <el-form-item label="处理意见" prop="opinion">
          <el-input v-model="borrowApplyForm.opinion" placeholder="请输入处理意见" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="borrowApplyForm.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitBorrowApply">确定</el-button>
        <el-button size="small" @click="borrowApplyDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import RollCatalogDialog from './components/roll-catalog-dialog.vue'
import FileCatalogDialog from './components/file-catalog-dialog.vue'
import AddFileDialog from './components/add-file-dialog.vue'
import AdaptiveActions from '@/components/AdaptiveActions'
const RECORDS = [
  { id: 1, status: '审核通过', name: '俞文杰借阅专项检测招标文件、合同', way: '拷贝电子文件', startDate: '2026-08-14', endDate: '2026-08-21', purpose: '借阅', attachment: '', creator: '张鲁莎', createTime: '2026-08-14 16:59:29', remark: '', nodePath: '' },
  { id: 2, status: '审核通过', name: '苟可借阅500KV塔基临时便道资料', way: '拷贝电子文件', startDate: '2026-08-06', endDate: '2026-08-13', purpose: '借阅', attachment: '', creator: '张鲁莎', createTime: '2026-08-06 12:36:09', remark: '', nodePath: '' },
  { id: 3, status: '审核通过', name: '苟可借阅柯岩街道房屋拆迁档案', way: '拷贝电子文件', startDate: '2026-08-06', endDate: '2026-08-15', purpose: '借阅', attachment: '', creator: '张鲁莎', createTime: '2026-08-05 14:25:39', remark: '', nodePath: '' },
  { id: 4, status: '未审核', name: '借阅22年考勤资料', way: '原件', startDate: '2023-05-17', endDate: '2023-05-19', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 16:12:26', remark: '', nodePath: '' },
  { id: 5, status: '未审核', name: '借阅500KV高压铁塔涉及工程红线内杆线迁改工程', way: '原件', startDate: '2023-07-24', endDate: '2023-07-24', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 16:10:56', remark: '', nodePath: '' },
  { id: 6, status: '未审核', name: '借阅报审审计报表、季度月报、审计意见书', way: '原件', startDate: '2023-06-25', endDate: '2023-07-17', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 16:07:17', remark: '', nodePath: '' },
  { id: 7, status: '未审核', name: '借阅考古调查、交通影响评价合同', way: '原件', startDate: '2023-05-08', endDate: '2023-05-08', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 15:56:23', remark: '', nodePath: '' },
  { id: 8, status: '未审核', name: '借阅疗休养、办公会议系统、全员动员仪式合同', way: '原件', startDate: '2023-05-08', endDate: '2023-05-11', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 15:54:40', remark: '', nodePath: '' },
  { id: 9, status: '未审核', name: '借阅柯诸高速公路与诸永改扩建工程交叉界面协议', way: '原件', startDate: '2023-04-23', endDate: '2023-09-19', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 15:50:07', remark: '', nodePath: '' },
  { id: 10, status: '未审核', name: '借阅柯诸高速建筑工程一切险及第三者责任险合同', way: '原件', startDate: '2023-04-13', endDate: '2023-04-13', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 15:43:50', remark: '', nodePath: '' },
  { id: 11, status: '未审核', name: '借阅柯诸高速交竣工验收检测报告资料', way: '原件', startDate: '2023-04-02', endDate: '2023-04-06', purpose: '借阅', attachment: '', creator: '许隶', createTime: '2023-09-19 15:40:12', remark: '', nodePath: '' }
]

// 各事务对应的借阅明细（按记录 id 关联）
const DETAIL_MAP = {
  1: [{ code: 'KZGS-Z-0685', title: '柯桥至诸暨高速公路工程第ZXJC01和ZXJC02标段专项试验检测招标文件、投标情况报告、合同文件', returnDate: '2026-08-18', returned: true }],
  2: [{ code: 'KZGS-Z-0309', title: '柯桥至诸暨高速公路工程福全街道容山村陈建江、陈建华、陈志、陈建继、陈水祥、陈佰中户房屋拆迁一户一档材料', returnDate: '2026-08-10', returned: true }],
  3: [{ code: '征迁012-9', title: '柯桥至诸暨高速公路工程漓渚镇集体土地承包经营权会议记录，征地块情况登记情况说明', returnDate: '', returned: false }],
  4: [{ code: 'KZGS-GL-2022-021', title: '2022年度考勤表及员工花名册', returnDate: '', returned: false }],
  5: [{ code: 'KZGS-SJ-118', title: '500KV高压铁塔迁改工程红线定位及杆线布置图', returnDate: '2023-07-24', returned: true }],
  6: [{ code: 'KZGS-JJ-045', title: '2023年第二季度审计报表、季度月报及审计意见书', returnDate: '', returned: false }],
  7: [{ code: 'KZGS-HT-112', title: '考古调查、交通影响评价服务合同', returnDate: '2023-05-08', returned: true }],
  8: [{ code: 'KZGS-HT-118', title: '疗休养服务、办公会议系统采购、全员动员仪式服务合同', returnDate: '', returned: false }],
  9: [{ code: 'KZGS-HT-102', title: '柯诸高速公路与诸永改扩建工程交叉界面协议', returnDate: '', returned: false }],
  10: [{ code: 'KZGS-HT-098', title: '建筑工程一切险及第三者责任险保险合同', returnDate: '2023-04-13', returned: true }],
  11: [{ code: 'KZGS-JG-031', title: '交竣工验收检测报告及备案资料', returnDate: '', returned: false }]
}

// 构建纸质借阅申请表单默认值（借阅起日期=当天，止日期=一周后）
function buildBorrowApplyForm() {
  const fmt = d => d.toISOString().slice(0, 10)
  const start = new Date()
  const end = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  return {
    name: '',
    user: '柯诸业主测试(勿选)',
    way: '',
    phone: '',
    email: '',
    startDate: fmt(start),
    endDate: fmt(end),
    targetUnit: '',
    stamp: '否',
    dept: '绍兴市柯诸高速公路有限公司',
    purpose: '',
    archiveNames: '',
    opinion: '',
    remark: ''
  }
}

export default {
  name: 'UtilizeBorrow',
  components: { RollCatalogDialog, FileCatalogDialog, AddFileDialog, AdaptiveActions },
  data() {
    return {
      filterName: '',
      page: 1,
      size: 100,
      rows: RECORDS,
      currentRow: RECORDS[0],
      detailVisible: false,
      detail: {},
      selection: [],
      detailSelection: [],
      // 添加案卷目录/文件目录/文件弹窗
      rollCatalogVisible: false,
      fileCatalogVisible: false,
      addFileVisible: false,
      // 通过弹窗追加的明细（key 为记录 id）
      extraDetails: {},
      // 归还事务弹窗
      returnDialog: { visible: false },
      returnPage: 1,
      returnSize: 100,
      returnCurrent: null,
      // 新增/修改纸质借阅申请弹窗
      borrowApplyDialog: { visible: false, type: 'add' },
      borrowApplyForm: buildBorrowApplyForm(),
      borrowApplyRules: {
        name: [{ required: true, message: '请输入事务名称', trigger: 'blur' }],
        user: [{ required: true, message: '请输入利用人', trigger: 'blur' }],
        way: [{ required: true, message: '请选择利用方式', trigger: 'change' }],
        startDate: [{ required: true, message: '请选择借阅起日期', trigger: 'change' }],
        endDate: [{ required: true, message: '请选择借阅止日期', trigger: 'change' }],
        stamp: [{ required: true, message: '请选择是否加盖公章', trigger: 'change' }],
        dept: [{ required: true, message: '请输入借阅部门', trigger: 'blur' }],
        purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }]
      }
    }
  },
  computed: {
    total() {
      return this.rows.length
    },
    /** 借阅列表工具栏按钮（AdaptiveActions 配置，不带颜色） */
    borrowActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus' },
        { key: 'reBorrow', label: '重新借阅', icon: 'el-icon-refresh-right' },
        { key: 'edit', label: '修改', icon: 'el-icon-edit' },
        { key: 'submitAudit', label: '提请审核', icon: 'el-icon-s-check' },
        { key: 'cancelAudit', label: '撤销提请', icon: 'el-icon-refresh-left' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'feedback', label: '反馈利用效果', icon: 'el-icon-chat-dot-round' },
        {
          key: 'print', label: '打印', icon: 'el-icon-printer',
          children: [
            { key: 'printRecord', label: '借阅记录' },
            { key: 'printDetail', label: '借阅明细' }
          ]
        },
        { key: 'export', label: '导出excel', icon: 'el-icon-download' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-document' },
        { key: 'upload', label: '上传附件', icon: 'el-icon-upload2' }
      ]
    },
    /** 详细信息列表工具栏按钮（AdaptiveActions 配置，不带颜色） */
    detailActions() {
      return [
        { key: 'refreshDetail', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'returnDialog', label: '归还事务', icon: 'el-icon-takeaway-box' },
        { key: 'doReturn', label: '归还', icon: 'el-icon-finished' },
        { key: 'addRoll', label: '添加案卷目录', icon: 'el-icon-folder-add' },
        { key: 'addFileCatalog', label: '添加文件目录', icon: 'el-icon-folder-opened' },
        { key: 'addFile', label: '添加文件', icon: 'el-icon-document-add' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-document' }
      ]
    },
    // 归还事务弹窗：可归还的事务（明细中存在未归还文件）
    returnRows() {
      return this.rows.filter(r => {
        const list = DETAIL_MAP[r.id] || []
        const extra = this.extraDetails[r.id] || []
        return list.concat(extra).some(d => !d.returned)
      })
    },
    returnTotal() {
      return this.returnRows.length
    },
    // 归还事务弹窗：当前选中事务的未归还明细
    returnDetailRows() {
      const id = this.returnCurrent ? this.returnCurrent.id : ''
      const base = id !== '' ? (DETAIL_MAP[id] || []) : []
      return base.concat(this.extraDetails[id] || [])
    },
    detailRows() {
      const base = this.currentRow ? (DETAIL_MAP[this.currentRow.id] || []) : []
      return base.concat(this.extraDetails[this.currentRow ? this.currentRow.id : ''] || [])
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.mainTable && this.$refs.mainTable.setCurrentRow(RECORDS[0])
    })
  },
  methods: {
    /** 借阅列表工具栏按钮统一分发 */
    onBorrowAction(item) {
      const handlers = {
        refresh: () => this.handleRefresh(),
        add: () => this.handleBorrowAdd(),
        reBorrow: () => this.notifyDemo('重新借阅', true),
        edit: () => this.handleBorrowEdit(),
        submitAudit: () => this.notifyDemo('提请审核', true),
        cancelAudit: () => this.notifyDemo('撤销提请', true),
        remove: () => this.notifyDemo('删除', true),
        feedback: () => this.notifyDemo('反馈利用效果'),
        printRecord: () => this.handlePrint('record'),
        printDetail: () => this.handlePrint('detail'),
        export: () => this.notifyDemo('导出excel'),
        detail: () => this.openDetailFromSelection(),
        upload: () => this.notifyDemo('上传附件', true)
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    /** 详细信息列表工具栏按钮统一分发 */
    onDetailBarAction(item) {
      const handlers = {
        refreshDetail: () => this.handleDetailRefresh(),
        returnDialog: () => this.openReturnDialog(),
        doReturn: () => this.notifyDetail('归还', true),
        addRoll: () => this.openRollCatalog(),
        addFileCatalog: () => this.openFileCatalog(),
        addFile: () => this.openAddFile(),
        remove: () => this.notifyDetail('删除', true),
        detail: () => this.notifyDetail('查看详细信息')
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    handleSearch() {
      const kw = (this.filterName || '').trim()
      this.rows = kw ? RECORDS.filter(r => r.name.includes(kw)) : RECORDS
      this.page = 1
      if (this.rows.length) {
        this.$nextTick(() => this.$refs.mainTable.setCurrentRow(this.rows[0]))
      } else {
        this.currentRow = null
      }
    },
    handleRefresh() {
      this.filterName = ''
      this.rows = RECORDS
      this.page = 1
      this.$nextTick(() => this.$refs.mainTable.setCurrentRow(RECORDS[0]))
      this.$message.success('刷新成功')
    },
    handleCurrentChange(row) {
      if (row) this.currentRow = row
    },
    handleSelectionChange(val) {
      this.selection = val
    },
    handleDetailSelectionChange(val) {
      this.detailSelection = val
    },
    handlePrint(cmd) {
      this.$message.info((cmd === 'record' ? '借阅记录' : '借阅明细') + '打印：演示数据，仅作界面展示')
    },
    notifyDemo(action, needSelection) {
      if (needSelection && !this.selection.length) {
        this.$message.warning('请先勾选需要' + action + '的记录')
        return
      }
      this.$message.info(action + '：演示数据，仅作界面展示')
    },
    notifyDetail(action, needSelection) {
      if (needSelection && !this.detailSelection.length) {
        this.$message.warning('请先勾选明细中需要' + action + '的数据')
        return
      }
      this.$message.info(action + '：演示数据，仅作界面展示')
    },
    openDetail(row) {
      this.detail = row
      this.detailVisible = true
    },
    openDetailFromSelection() {
      if (!this.selection.length) {
        this.$message.warning('请先勾选需要查看的记录')
        return
      }
      this.openDetail(this.selection[0])
    },
    handleDetailRefresh() {
      this.$message.success('刷新成功')
    },
    // ===== 添加案卷目录/文件目录/文件弹窗 =====
    openRollCatalog() {
      if (!this.currentRow) {
        this.$message.warning('请先选择借阅记录')
        return
      }
      this.rollCatalogVisible = true
    },
    openFileCatalog() {
      if (!this.currentRow) {
        this.$message.warning('请先选择借阅记录')
        return
      }
      this.fileCatalogVisible = true
    },
    openAddFile() {
      if (!this.currentRow) {
        this.$message.warning('请先选择借阅记录')
        return
      }
      this.addFileVisible = true
    },
    // 追加明细到当前选中事务
    appendDetail(items) {
      if (!this.currentRow) return
      const id = this.currentRow.id
      const list = this.extraDetails[id] || []
      this.$set(this.extraDetails, id, list.concat(items))
    },
    handleRollConfirm(rows) {
      this.appendDetail(rows.map(r => ({ code: r.archiveNo, title: r.title, returnDate: '', returned: false })))
      this.$message.success('已添加 ' + rows.length + ' 条案卷目录')
    },
    handleFileConfirm(rows) {
      this.appendDetail(rows.map(r => ({ code: r.archiveNo, title: r.title, returnDate: '', returned: false })))
      this.$message.success('已添加 ' + rows.length + ' 条文件目录')
    },
    handleAddFileConfirm(rows) {
      this.appendDetail(rows.map(r => ({ code: r.archiveNo, title: r.name, returnDate: '', returned: false })))
      this.$message.success('已添加 ' + rows.length + ' 个文件')
    },
    // ===== 归还事务弹窗 =====
    openReturnDialog() {
      if (!this.returnRows.length) {
        this.$message.warning('没有可归还的事务')
        return
      }
      this.returnCurrent = this.returnRows[0]
      this.returnPage = 1
      this.returnDialog.visible = true
      this.$nextTick(() => {
        this.$refs.returnTable && this.$refs.returnTable.setCurrentRow(this.returnRows[0])
      })
    },
    handleReturnCurrentChange(row) {
      if (row) this.returnCurrent = row
    },
    handleReturnRefresh() {
      this.returnPage = 1
      this.$message.success('刷新成功')
    },
    // 归还：把当前选中事务的未归还明细全部置为已归还
    handleReturnSubmit() {
      if (!this.returnCurrent) {
        this.$message.warning('请先选择需要归还的事务')
        return
      }
      const id = this.returnCurrent.id
      const markReturned = list => list.forEach(d => { d.returned = true })
      if (DETAIL_MAP[id]) markReturned(DETAIL_MAP[id])
      if (this.extraDetails[id]) markReturned(this.extraDetails[id])
      this.returnDialog.visible = false
      this.$message.success('归还成功')
    },
    returnNotify(action) {
      if (!this.returnCurrent) {
        this.$message.warning('请先选择事务')
        return
      }
      this.$message.info(action + '：演示数据，仅作界面展示')
    },
    toggleReturnTop() {
      this.$message.info('收起/展开：演示数据，仅作界面展示')
    },
    toggleReturnFiles() {
      this.$message.info('收起/展开：演示数据，仅作界面展示')
    },
    // ===== 新增/修改纸质借阅申请弹窗 =====
    handleBorrowAdd() {
      this.borrowApplyDialog.type = 'add'
      this.borrowApplyForm = buildBorrowApplyForm()
      this.borrowApplyDialog.visible = true
      this.$nextTick(() => this.$refs.borrowApplyForm && this.$refs.borrowApplyForm.clearValidate())
    },
    handleBorrowEdit() {
      const row = this.selection.length ? this.selection[0] : this.currentRow
      if (!row) {
        this.$message.warning('请先选择借阅记录')
        return
      }
      if (row.status !== '未审核') {
        this.$message.warning('仅「未审核」状态的记录可修改')
        return
      }
      this.borrowApplyDialog.type = 'edit'
      this.borrowApplyDialog.editRow = row
      this.borrowApplyForm = {
        ...buildBorrowApplyForm(),
        name: row.name,
        startDate: row.startDate,
        endDate: row.endDate,
        user: row.creator,
        way: row.way,
        purpose: row.purpose,
        remark: row.remark
      }
      this.borrowApplyDialog.visible = true
      this.$nextTick(() => this.$refs.borrowApplyForm && this.$refs.borrowApplyForm.clearValidate())
    },
    submitBorrowApply() {
      this.$refs.borrowApplyForm.validate(valid => {
        if (!valid) return
        const type = this.borrowApplyDialog.type
        if (type === 'add') {
          // 演示：插入到列表头部
          this.rows.unshift({
            id: Date.now(),
            status: '未审核',
            name: this.borrowApplyForm.name,
            way: this.borrowApplyForm.way,
            startDate: this.borrowApplyForm.startDate,
            endDate: this.borrowApplyForm.endDate,
            purpose: this.borrowApplyForm.purpose,
            attachment: '',
            creator: this.borrowApplyForm.user,
            createTime: this.formatNow(),
            remark: this.borrowApplyForm.remark,
            nodePath: ''
          })
          this.page = 1
        } else if (this.borrowApplyDialog.editRow) {
          Object.assign(this.borrowApplyDialog.editRow, {
            name: this.borrowApplyForm.name,
            way: this.borrowApplyForm.way,
            startDate: this.borrowApplyForm.startDate,
            endDate: this.borrowApplyForm.endDate,
            purpose: this.borrowApplyForm.purpose,
            remark: this.borrowApplyForm.remark
          })
        }
        this.borrowApplyDialog.visible = false
        this.$message.success((type === 'edit' ? '修改' : '新增') + '纸质借阅申请成功')
      })
    },
    formatNow() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    }
  }
}
</script>

<style lang="scss" scoped>
.borrow-page { padding: 8px 10px; }
.section-bar {
  background: linear-gradient(90deg, #2f7bd0, #4a94e8);
  color: #fff; padding: 7px 12px; font-size: 14px; font-weight: bold;
  border-radius: 3px 3px 0 0;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;

  ::v-deep .el-input__inner { height: 26px; line-height: 26px; }
}
.sub-bar { margin-top: 14px; }
.bar-title { white-space: nowrap; }
.bar-actions { flex: 1; min-width: 0; }
.name-link-red { color: #e02020; cursor: pointer; }
.name-link-blue { color: #2f6fd9; cursor: pointer; }
.name-link-red:hover, .name-link-blue:hover { text-decoration: underline; }
.status-ok { color: #13a813; }
.status-normal { color: #606266; }
.back-ok { color: #13a813; }
.back-no { color: #e6a23c; }
</style>

<style>
.detail-dialog .detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.detail-dialog .detail-table th,
.detail-dialog .detail-table td { border: 1px solid #ebeef5; padding: 10px 12px; }
.detail-dialog .detail-table th { width: 160px; background: #f7f8fa; color: #606266; text-align: left; font-weight: normal; }
.detail-dialog .detail-table td { color: #303133; }
.detail-dialog .detail-name { color: #e02020; }
.detail-dialog .detail-name-blue { color: #2f6fd9; }
.detail-dialog .status-ok { color: #13a813; }
.detail-dialog .status-normal { color: #606266; }
</style>

<style>
/* 弹窗为 append-to-body，需要全局样式 */
.return-dialog .return-section-bar {
  background: $themeColor;
  color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold;
  border-radius: 3px 3px 0 0;
  display: flex; align-items: center; justify-content: space-between;
}
.return-dialog .return-section-tools { display: flex; align-items: center; }
.return-dialog .el-table th {
  background: #eaf1fb;
  color: #303133;
  font-weight: bold;
}
.borrow-apply-dialog {
  .el-dialog__body {
    padding: 16px 24px;
    max-height: 65vh;
    overflow: auto;
  }

  .el-form-item {
    margin-bottom: 14px;
  }
}
</style>
