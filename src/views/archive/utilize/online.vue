<template>
  <!-- 在线浏览复用：在线利用记录 + 在线利用明细（静态演示数据，不请求接口） -->
  <div class="app-container online-page">
    <!-- 在线利用记录 -->
    <div class="section-bar toolbar-bar">
      <span class="bar-title">在线利用记录</span>
      <el-input v-model="queryName" size="mini" placeholder="请输入事务名称" class="bar-search" clearable @keyup.enter.native="handleSearch" />
      <el-button size="mini" icon="el-icon-search" @click="handleSearch">搜索</el-button>
      <adaptive-actions class="bar-actions" :items="recordActions" size="mini" @click="onRecordAction" />
    </div>

    <el-table
      :data="filteredRows"
      border
      size="small"
      highlight-current-row
      height="calc(50% - 70px)"
      @current-change="handleRecordChange"
      @selection-change="s => (recordSelection = s)"
    >
      <el-table-column type="selection" width="45" align="center" />
      <el-table-column label="序号" width="60" align="center">
        <template slot-scope="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="审核状态" width="110" align="center" sortable>
        <template slot-scope="{ row }">
          <span :class="row.status === '审核通过' ? 'status-ok' : 'status-warn'">{{ row.status }}</span>
        </template>
      </el-table-column>
      <!-- 事务名称：点击打开详情弹窗 -->
      <el-table-column label="事务名称" min-width="220" sortable>
        <template slot-scope="{ row }">
          <span class="name-link" @click="openDetail(row)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="借阅起日期" prop="startDate" width="120" align="center" sortable />
      <el-table-column label="借阅止日期" prop="endDate" width="120" align="center" sortable />
      <el-table-column label="利用方式" prop="way" width="110" align="center" sortable />
      <el-table-column label="在线浏览网址" width="130" align="center">
        <template slot-scope><span class="link-disabled">链接不可访问</span></template>
      </el-table-column>
      <el-table-column label="用途" prop="purpose" min-width="130" sortable show-overflow-tooltip />
      <el-table-column label="附件" prop="attachment" width="80" align="center" />
      <el-table-column label="备注" prop="remark" width="80" align="center" />
      <el-table-column label="增加人" prop="creator" width="130" show-overflow-tooltip />
      <el-table-column label="增加时间" prop="createTime" width="165" align="center" />
    </el-table>

    <el-pagination
      :current-page.sync="page"
      :page-size.sync="size"
      :page-sizes="[100, 200, 500]"
      :total="total"
      layout="total, prev, pager, next, jumper, sizes"
      class="record-pagination"
    />

    <!-- 在线利用明细 -->
    <div class="section-bar detail-bar">
      <span class="bar-title">在线利用明细</span>
      <div class="bar-right">
        <adaptive-actions class="bar-actions" :items="detailActions" size="mini" @click="onDetailAction" />
      </div>
    </div>

    <el-table :data="detailRows" border size="small" height="calc(50% - 40px)" @selection-change="s => (detailSelection = s)">
      <el-table-column type="selection" width="45" align="center" />
      <el-table-column label="序号" width="60" align="center">
        <template slot-scope="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="档号/文件编号" prop="archiveNo" min-width="200" sortable show-overflow-tooltip />
      <el-table-column label="案卷/文件题名/文件名称" prop="title" min-width="520" sortable show-overflow-tooltip />
      <el-table-column label="文件类型" prop="type" width="100" align="center" sortable />
      <el-table-column label="操作" width="80" align="center">
        <template slot-scope="{ row }">
          <el-button type="text" size="mini" class="view-btn" @click="openFileViewer(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 事务详细信息弹窗 -->
    <el-dialog
      title="详细信息"
      :visible.sync="detailVisible"
      width="860px"
      top="6vh"
      custom-class="detail-dialog"
      append-to-body
    >
      <table class="detail-table">
        <tbody>
          <tr>
            <td class="label">审核状态</td>
            <td><span class="status-ok">{{ current.status }}</span></td>
          </tr>
          <tr>
            <td class="label">事务名称</td>
            <td><span class="name-text">{{ current.name }}</span></td>
          </tr>
          <tr>
            <td class="label">借阅起日期</td>
            <td>{{ current.startDate }}</td>
          </tr>
          <tr>
            <td class="label">借阅止日期</td>
            <td>{{ current.endDate }}</td>
          </tr>
          <tr>
            <td class="label">利用方式</td>
            <td>{{ current.way }}</td>
          </tr>
          <tr>
            <td class="label">在线浏览网址</td>
            <td><span class="link-disabled">链接不可访问</span></td>
          </tr>
          <tr>
            <td class="label">用途</td>
            <td>{{ current.purpose }}</td>
          </tr>
          <tr>
            <td class="label">附件</td>
            <td>{{ current.attachment }}</td>
          </tr>
          <tr>
            <td class="label">备注</td>
            <td>{{ current.remark }}</td>
          </tr>
          <tr>
            <td class="label">增加人</td>
            <td>{{ current.creator }}</td>
          </tr>
          <tr>
            <td class="label">增加时间</td>
            <td>{{ current.createTime }}</td>
          </tr>
          <tr>
            <td class="label">所在分类节点路径</td>
            <td>{{ current.path }}</td>
          </tr>
        </tbody>
      </table>
    </el-dialog>

    <!-- 文件查看弹窗 -->
    <el-dialog
      :title="fileViewer.title"
      :visible.sync="fileViewer.visible"
      width="82%"
      top="4vh"
      custom-class="file-viewer-dialog"
      append-to-body
    >
      <div class="file-meta">
        <span>档号：{{ fileViewer.archiveNo }}</span>
        <span>文件类型：{{ fileViewer.type }}</span>
        <span>利用方式：在线浏览</span>
      </div>
      <div class="file-canvas">
        <div class="file-page">
          <div class="page-title">{{ fileViewer.title }}</div>
          <div class="page-line" v-for="n in 12" :key="n" :style="{ width: (96 - (n % 4) * 9) + '%' }" />
          <div class="page-stamp">在线预览（演示数据）</div>
        </div>
      </div>
      <div class="viewer-footer">
        <el-pagination
          :current-page.sync="fileViewer.page"
          :page-size="1"
          :total="fileViewer.pages"
          layout="prev, pager, next"
          small
        />
      </div>
    </el-dialog>

    <!-- 新增/修改在线利用申请弹窗 -->
    <el-dialog
      :title="applyDialog.type === 'edit' ? '修改在线利用申请' : '新增在线利用申请'"
      :visible.sync="applyDialog.visible"
      width="760px"
      top="6vh"
      custom-class="apply-dialog"
      append-to-body
    >
      <el-form ref="applyForm" :model="applyForm" :rules="applyRules" label-width="110px" size="small">
        <el-form-item label="事务名称" prop="name" required>
          <el-input v-model="applyForm.name" placeholder="请输入事务名称" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="借阅起日期" prop="startDate" required>
              <el-date-picker
                v-model="applyForm.startDate"
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
                v-model="applyForm.endDate"
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
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="applyForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="applyForm.email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="利用人" prop="user" required>
              <el-input v-model="applyForm.user" placeholder="请输入利用人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="利用方式" prop="way" required>
              <el-select v-model="applyForm.way" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="发往单位" prop="targetUnit">
              <el-input v-model="applyForm.targetUnit" placeholder="请输入发往单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否加盖公章" prop="stamp" required>
              <el-select v-model="applyForm.stamp" placeholder="请选择" style="width: 100%">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="借阅部门" prop="dept" required>
          <el-input v-model="applyForm.dept" placeholder="请输入借阅部门" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose" required>
          <el-input v-model="applyForm.purpose" type="textarea" :rows="2" placeholder="请输入用途" />
        </el-form-item>
        <el-form-item label="借阅档案名称" prop="archiveNames">
          <el-input v-model="applyForm.archiveNames" type="textarea" :rows="3" placeholder="请输入借阅档案名称" />
        </el-form-item>
        <el-form-item label="处理意见" prop="opinion">
          <el-input v-model="applyForm.opinion" placeholder="请输入处理意见" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="applyForm.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitApply">确定</el-button>
        <el-button size="small" @click="applyDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 添加案卷目录弹窗 -->
    <roll-catalog-dialog :visible.sync="rollCatalogVisible" @confirm="handleRollConfirm" />

    <!-- 添加文件目录弹窗 -->
    <file-catalog-dialog :visible.sync="fileCatalogVisible" @confirm="handleFileConfirm" />

    <!-- 添加文件弹窗 -->
    <add-file-dialog :visible.sync="addFileVisible" @confirm="handleAddFileConfirm" />
  </div>
</template>

<script>
import RollCatalogDialog from './components/roll-catalog-dialog.vue'
import FileCatalogDialog from './components/file-catalog-dialog.vue'
import AddFileDialog from './components/add-file-dialog.vue'
import AdaptiveActions from '@/components/AdaptiveActions'
// 在线利用记录演示数据（与截图一致，共12条）
const RECORDS = [
  { id: 1, status: '审核通过', name: '财审补充', startDate: '2026-07-27', endDate: '2026-08-23', way: '查阅', purpose: '财审补充', attachment: '', remark: '', creator: '柯诸业主测试(勿选)', createTime: '2026-07-27 17:10:33', path: '' },
  { id: 2, status: '审核通过', name: '财审', startDate: '2026-07-23', endDate: '2026-08-23', way: '查阅', purpose: '财审', attachment: '', remark: '', creator: '柯诸业主测试(勿选)', createTime: '2026-07-23 11:40:29', path: '' },
  { id: 3, status: '审核通过', name: '工程二处征迁档案借阅', startDate: '2025-12-09', endDate: '2026-01-09', way: '查阅', purpose: '工程二处征迁档案借阅', attachment: '', remark: '', creator: '苟可', createTime: '2025-12-09 16:34:38', path: '' },
  { id: 4, status: '审核通过', name: '柯桥段房屋拆迁档案借阅', startDate: '2025-11-19', endDate: '2025-12-19', way: '查阅', purpose: '柯桥段房屋拆迁档案借阅', attachment: '', remark: '', creator: '苟可', createTime: '2025-11-19 17:19:27', path: '' },
  { id: 5, status: '审核通过', name: '招投标档案审计借阅', startDate: '2025-10-13', endDate: '2025-11-13', way: '查阅', purpose: '招投标档案审计借阅', attachment: '', remark: '', creator: '张鲁莎', createTime: '2025-10-13 08:38:42', path: '' },
  { id: 6, status: '审核通过', name: '用地审批、征迁档案借阅', startDate: '2025-10-12', endDate: '2025-10-28', way: '查阅', purpose: '用地审批、征迁档案借阅', attachment: '', remark: '', creator: '张鲁莎', createTime: '2025-10-12 11:31:34', path: '' },
  { id: 7, status: '审核通过', name: '招投标档案审计借阅', startDate: '2025-09-16', endDate: '2025-10-15', way: '查阅', purpose: '招投标档案审计借阅', attachment: '', remark: '', creator: '张鲁莎', createTime: '2025-09-16 15:13:09', path: '' },
  { id: 8, status: '审核通过', name: '征迁档案借阅', startDate: '2025-04-02', endDate: '2025-07-02', way: '查阅', purpose: '征迁档案借阅', attachment: '', remark: '', creator: '张鲁莎', createTime: '2025-04-02 10:49:19', path: '' },
  { id: 9, status: '审核通过', name: '征迁档案审计查看', startDate: '2024-09-14', endDate: '2024-12-14', way: '查阅', purpose: '征迁档案审计', attachment: '', remark: '', creator: '柯诸业主测试(勿选)', createTime: '2024-09-14 10:20:43', path: '' },
  { id: 10, status: '审核通过', name: '机电标段借阅学习前期文件', startDate: '2024-08-20', endDate: '2024-09-03', way: '查阅', purpose: '机电标段借阅学习前期文件', attachment: '', remark: '', creator: '单一峰', createTime: '2024-08-20 09:35:04', path: '' },
  { id: 11, status: '审核通过', name: '隧道工程施工方案借阅', startDate: '2024-06-11', endDate: '2024-07-11', way: '查阅', purpose: '隧道工程施工方案参考', attachment: '', remark: '', creator: '苟可', createTime: '2024-06-11 14:22:51', path: '' },
  { id: 12, status: '待审核', name: '桥梁荷载试验报告借阅', startDate: '2024-05-08', endDate: '2024-06-08', way: '查阅', purpose: '桥梁荷载试验报告查看', attachment: '', remark: '', creator: '单一峰', createTime: '2024-05-08 09:12:36', path: '' }
]

// 在线利用明细演示数据（与截图一致，共10条）
const DETAILS = [
  { archiveNo: 'KZGS-8206-002', title: '柯桥至诸暨高速公路工程110kV白培1601线、培放1602线15#-16#线路迁改工程施工管理人员资格报审、施工设施进场验收单', type: '案卷' },
  { archiveNo: 'KZGS-Z-0309', title: '柯桥至诸暨高速公路工程福全街道窑山村陈建江、陈建华、陈志、陈水祥、陈佰中户房屋拆迁一户一档材料', type: '案卷' },
  { archiveNo: 'KZGS-Z-0314', title: '柯桥至诸暨高速公路工程福全街道新迪埠村金森彪、韩大龙、金国祖、王丽美、洪关灶户房屋拆迁一户一档材料', type: '案卷' },
  { archiveNo: '征迁012-9', title: '柯桥至诸暨高速公路工程漓渚镇集体土地承包经营权会议记录，征地补偿登记情况说明', type: '案卷' },
  { archiveNo: 'KZGS-Z-0310', title: '柯桥至诸暨高速公路工程福全街道容山村陈云芳、朱建一、陈金奎户房屋拆迁一户一档材料', type: '案卷' },
  { archiveNo: 'KZGS-8205-001', title: '柯桥至诸暨高速公路工程110kV白培1601线、培放1602线15#-16#线路迁改工程接地网敷设与连接、耐张管施工、附件安装验收批', type: '案卷' },
  { archiveNo: 'KZGS-Z-0487', title: '柯桥至诸暨高速公路工程110kV培店1604线31#-36#、40#-43#/培唐1607线31#-36#、24#-27#段迁改工程供货商资质、试验单', type: '案卷' },
  { archiveNo: 'KZGS-Z-0502', title: '柯桥至诸暨高速公路工程110kV培店1604线、白唐1607线12#-17#段迁改工程项目管理实施规划、安全管控措施施工方案及报审', type: '案卷' },
  { archiveNo: 'KZGS-Z-0507', title: '柯桥至诸暨高速公路工程110kV培店1604线、白唐1607线12#-17#段迁改工程灌注桩混凝土施工、成桩、接地开挖、引下线安装验收', type: '案卷' },
  { archiveNo: 'KZGS-Z-0349', title: '柯桥至诸暨高速公路工程型塘镇浦西村征地补偿安置协议（普通青苗补偿协议）及记载凭证、支付清单、会议记录', type: '案卷' }
]

// 构建在线利用申请表单默认值（借阅起日期=当天，止日期=一周后）
function buildApplyForm() {
  const fmt = d => d.toISOString().slice(0, 10)
  const start = new Date()
  const end = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  return {
    name: '',
    startDate: fmt(start),
    endDate: fmt(end),
    phone: '',
    email: '',
    user: '柯诸业主测试(勿选)',
    way: '',
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
  name: 'UtilizeOnline',
  components: { RollCatalogDialog, FileCatalogDialog, AddFileDialog, AdaptiveActions },
  data() {
    return {
      queryName: '',
      page: 1,
      size: 100,
      list: JSON.parse(JSON.stringify(RECORDS)),
      selectedRow: null,
      recordSelection: [],
      detailRows: JSON.parse(JSON.stringify(DETAILS)),
      detailSelection: [],
      // 事务详情弹窗
      detailVisible: false,
      current: {},
      // 文件查看弹窗
      fileViewer: {
        visible: false,
        title: '',
        archiveNo: '',
        type: '',
        page: 1,
        pages: 5
      },
      // 新增/修改在线利用申请弹窗
      applyDialog: { visible: false, type: 'add' },
      applyForm: buildApplyForm(),
      applyRules: {
        name: [{ required: true, message: '请输入事务名称', trigger: 'blur' }],
        startDate: [{ required: true, message: '请选择借阅起日期', trigger: 'change' }],
        endDate: [{ required: true, message: '请选择借阅止日期', trigger: 'change' }],
        user: [{ required: true, message: '请输入利用人', trigger: 'blur' }],
        way: [{ required: true, message: '请选择利用方式', trigger: 'change' }],
        stamp: [{ required: true, message: '请选择是否加盖公章', trigger: 'change' }],
        dept: [{ required: true, message: '请输入借阅部门', trigger: 'blur' }],
        purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }]
      },
      // 添加案卷目录弹窗
      rollCatalogVisible: false,
      // 添加文件目录弹窗
      fileCatalogVisible: false,
      // 添加文件弹窗
      addFileVisible: false
    }
  },
  computed: {
    // 前端按事务名称过滤
    filteredRows() {
      if (!this.queryName) return this.list
      return this.list.filter(r => r.name.includes(this.queryName))
    },
    total() {
      return this.filteredRows.length
    },
    /** 在线利用记录工具栏按钮（AdaptiveActions 配置，不带颜色） */
    recordActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'apply', label: '新增', icon: 'el-icon-plus' },
        { key: 'reBorrow', label: '重新借阅', icon: 'el-icon-refresh-right' },
        { key: 'edit', label: '修改', icon: 'el-icon-edit' },
        { key: 'submitAudit', label: '提请审核', icon: 'el-icon-position' },
        { key: 'cancelAudit', label: '撤销提请', icon: 'el-icon-back' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'sendFile', label: '发送电子件', icon: 'el-icon-s-promotion' },
        { key: 'feedback', label: '反馈利用效果', icon: 'el-icon-chat-dot-square' },
        {
          key: 'print', label: '打印', icon: 'el-icon-printer',
          children: [
            { key: 'printRecord', label: '利用记录' },
            { key: 'printDetail', label: '利用明细' }
          ]
        },
        { key: 'stop', label: '停阅', icon: 'el-icon-turn-off' },
        { key: 'viewBorrow', label: '查看借阅', icon: 'el-icon-view' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-document' },
        { key: 'upload', label: '上传附件', icon: 'el-icon-upload2' }
      ]
    },
    /** 在线利用明细工具栏按钮（AdaptiveActions 配置，不带颜色） */
    detailActions() {
      return [
        { key: 'addRoll', label: '添加案卷目录', icon: 'el-icon-folder-add' },
        { key: 'addFileCatalog', label: '添加文件目录', icon: 'el-icon-document-add' },
        { key: 'addFile', label: '添加文件', icon: 'el-icon-document-copy' },
        { key: 'remove', label: '删除', icon: 'el-icon-delete' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-document' }
      ]
    }
  },
  methods: {
    /** 在线利用记录工具栏按钮统一分发 */
    onRecordAction(item) {
      const handlers = {
        refresh: () => this.handleRefresh(),
        apply: () => this.handleApply(),
        reBorrow: () => this.notifyDemo('重新借阅'),
        edit: () => this.handleApplyEdit(),
        submitAudit: () => this.notifyDemo('提请审核'),
        cancelAudit: () => this.notifyDemo('撤销提请'),
        remove: () => this.notifyDemo('删除'),
        sendFile: () => this.notifyDemo('发送电子件'),
        feedback: () => this.notifyDemo('反馈利用效果'),
        printRecord: () => this.notifyDemo('打印利用记录'),
        printDetail: () => this.notifyDemo('打印利用明细'),
        stop: () => this.notifyDemo('停阅'),
        viewBorrow: () => this.notifyDemo('查看借阅'),
        detail: () => this.openDetail(this.selectedRow || this.list[0]),
        upload: () => this.notifyDemo('上传附件')
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    /** 在线利用明细工具栏按钮统一分发 */
    onDetailAction(item) {
      const handlers = {
        addRoll: () => { this.rollCatalogVisible = true },
        addFileCatalog: () => { this.fileCatalogVisible = true },
        addFile: () => { this.addFileVisible = true },
        remove: () => this.notifyDemo('删除'),
        detail: () => this.notifyDemo('查看详细信息')
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },
    handleSearch() {
      this.page = 1
      this.$message.success('搜索完成（演示数据）')
    },
    handleRefresh() {
      this.queryName = ''
      this.list = JSON.parse(JSON.stringify(RECORDS))
      this.$message.success('已刷新')
    },
    handleRecordChange(row) {
      this.selectedRow = row
    },
    notifyDemo(action) {
      if (['修改', '提请审核', '撤销提请', '删除', '发送电子件', '反馈利用效果', '停阅', '上传附件'].includes(action) && this.recordSelection.length === 0) {
        this.$message.warning('请先勾选利用记录')
        return
      }
      // 状态校验：待审核才可 修改/提请审核/删除；待审核不可 重新借阅
      const rows = this.recordSelection.length ? this.recordSelection : (this.selectedRow ? [this.selectedRow] : [])
      if (['修改', '提请审核', '删除'].includes(action)) {
        if (rows.some(r => r.status !== '待审核')) {
          this.$message.warning('仅「待审核」状态的记录可' + action)
          return
        }
      }
      if (action === '重新借阅') {
        if (!rows.length) {
          this.$message.warning('请先选择利用记录')
          return
        }
        if (rows.some(r => r.status === '待审核')) {
          this.$message.warning('「待审核」状态的记录不可重新借阅')
          return
        }
      }
      this.$message.success(action + '：操作成功')
    },
    // 打开事务详细信息弹窗
    openDetail(row) {
      if (!row) {
        this.$message.warning('请先选择利用记录')
        return
      }
      this.current = row
      this.detailVisible = true
    },
    // 打开文件查看弹窗
    openFileViewer(row) {
      this.fileViewer.title = row.title
      this.fileViewer.archiveNo = row.archiveNo
      this.fileViewer.type = row.type
      this.fileViewer.page = 1
      this.fileViewer.pages = 5
      this.fileViewer.visible = true
    },
    // ===== 新增/修改在线利用申请弹窗 =====
    handleApply() {
      this.applyDialog.type = 'add'
      this.applyForm = buildApplyForm()
      this.applyDialog.visible = true
      this.$nextTick(() => this.$refs.applyForm && this.$refs.applyForm.clearValidate())
    },
    handleApplyEdit() {
      if (!this.selectedRow) {
        this.$message.warning('请先选择利用记录')
        return
      }
      if (this.selectedRow.status !== '待审核') {
        this.$message.warning('仅「待审核」状态的记录可修改')
        return
      }
      this.applyDialog.type = 'edit'
      this.applyForm = {
        ...buildApplyForm(),
        name: this.selectedRow.name,
        startDate: this.selectedRow.startDate,
        endDate: this.selectedRow.endDate,
        user: this.selectedRow.creator,
        way: this.selectedRow.way,
        purpose: this.selectedRow.purpose
      }
      this.applyDialog.visible = true
      this.$nextTick(() => this.$refs.applyForm && this.$refs.applyForm.clearValidate())
    },
    submitApply() {
      this.$refs.applyForm.validate(valid => {
        if (!valid) return
        const type = this.applyDialog.type
        if (type === 'add') {
          // 演示：插入到列表头部
          this.list.unshift({
            id: Date.now(),
            status: '待审核',
            name: this.applyForm.name,
            startDate: this.applyForm.startDate,
            endDate: this.applyForm.endDate,
            way: this.applyForm.way,
            purpose: this.applyForm.purpose,
            attachment: '',
            remark: this.applyForm.remark,
            creator: this.applyForm.user,
            createTime: this.formatNow(),
            path: ''
          })
          this.page = 1
        } else if (this.selectedRow) {
          Object.assign(this.selectedRow, {
            name: this.applyForm.name,
            startDate: this.applyForm.startDate,
            endDate: this.applyForm.endDate,
            way: this.applyForm.way,
            purpose: this.applyForm.purpose,
            remark: this.applyForm.remark
          })
        }
        this.applyDialog.visible = false
        this.$message.success((type === 'edit' ? '修改' : '新增') + '在线利用申请成功')
      })
    },
    formatNow() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    },
    // 添加案卷目录：确认后把勾选的案卷追加到在线利用明细
    handleRollConfirm(rows) {
      rows.forEach(r => {
        this.detailRows.push({
          archiveNo: r.archiveNo,
          title: r.title,
          type: '案卷'
        })
      })
      this.$message.success('已添加 ' + rows.length + ' 条案卷目录')
    },
    // 添加文件目录：确认后把勾选的文件追加到在线利用明细
    handleFileConfirm(rows) {
      rows.forEach(r => {
        this.detailRows.push({
          archiveNo: r.archiveNo,
          title: r.title,
          type: '文件'
        })
      })
      this.$message.success('已添加 ' + rows.length + ' 条文件目录')
    },
    // 添加文件：确认后把勾选的电子文件追加到在线利用明细
    handleAddFileConfirm(rows) {
      rows.forEach(r => {
        this.detailRows.push({
          archiveNo: r.archiveNo,
          title: r.name,
          type: '文件'
        })
      })
      this.$message.success('已添加 ' + rows.length + ' 个文件')
    }
  }
}
</script>

<style lang="scss" scoped>
.online-page {
  .section-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    height: auto;
    min-height: 40px;
    padding: 4px 12px;
    margin-bottom: 8px;
    background: #409eff;
    border-radius: 2px;

    .bar-title {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      margin-right: 8px;
    }

    .bar-search {
      width: 220px;
    }

    .bar-actions {
      flex: 1;
      min-width: 0;
    }

    .bar-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .status-ok { color: #67c23a; }
  .status-warn { color: #e6a23c; }

  .name-link {
    color: #f56c6c;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }

  .link-disabled {
    color: #c0c4cc;
    cursor: not-allowed;
  }

  .view-btn {
    color: #409eff;
    padding: 0;
  }

  .record-pagination {
    margin: 8px 0 12px;
    text-align: left;
  }

  ::v-deep .el-table {
    .cell { font-size: 12px; }
  }
}
</style>

<style lang="scss">
/* 弹窗为 append-to-body，需要全局样式 */
.detail-dialog {
  .el-dialog__body {
    padding: 16px 20px;
  }
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  td {
    border: 1px solid #ebeef5;
    padding: 10px 12px;
    line-height: 1.5;
  }

  .label {
    width: 180px;
    background: #f5f7fa;
    color: #303133;
  }

  .status-ok { color: #67c23a; }
  .name-text { color: #f56c6c; }
  .link-disabled { color: #c0c4cc; }
}

.file-viewer-dialog {
  .el-dialog__body {
    padding: 10px 16px;
  }

  .file-meta {
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: #606266;
    margin-bottom: 10px;
  }

  .file-canvas {
    background: #525659;
    padding: 16px;
    display: flex;
    justify-content: center;
    border-radius: 2px;
  }

  .file-page {
    width: 720px;
    min-height: 560px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    padding: 40px 44px;
    position: relative;

    .page-title {
      font-size: 17px;
      font-weight: 600;
      color: #303133;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .page-line {
      height: 10px;
      background: #e8eaed;
      border-radius: 2px;
      margin-bottom: 14px;
    }

    .page-stamp {
      position: absolute;
      right: 18px;
      bottom: 14px;
      font-size: 12px;
      color: #c0c4cc;
      transform: rotate(-12deg);
      border: 1px dashed #c0c4cc;
      padding: 2px 8px;
      border-radius: 3px;
    }
  }

  .viewer-footer {
    margin-top: 10px;
    text-align: center;
  }
}

/* 弹窗为 append-to-body，需要全局样式 */
.apply-dialog {
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
