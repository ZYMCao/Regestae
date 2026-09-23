<template>
  <!--
    预归档文件：左侧档案分类目录树 + 右侧"文件目录"表 + "文件明细"表
    纯静态 DEMO，不请求接口，所有数据来自 script 内 mock
  -->
  <div class="pre-file-page">

    <!-- ========== 左侧：档案分类目录树 ========== -->
    <div class="left-panel">
      <div class="left-header">
        <el-input
          v-model="treeKeyword"
          placeholder="搜索分类"
          prefix-icon="el-icon-search"
          size="small"
          clearable
        />
        <el-select v-model="companyFilter" size="small" class="company-select">
          <el-option label="全公司" value="all" />
          <el-option label="绍兴市柯诸高速公路有限公司" value="kezhu" />
        </el-select>
      </div>
      <div class="left-tree-wrap">
        <el-tree
          ref="archiveTree"
          :data="filteredTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :default-expand-all="false"
          :default-expanded-keys="[1, 11]"
          highlight-current
          @node-click="handleNodeClick"
        >
          <!-- 自定义节点：名称 + 子节点计数 -->
          <span slot-scope="{ node, data }" class="tree-node">
            <i v-if="!data.children || data.children.length === 0" class="tree-icon leaf el-icon-document" />
            <i v-else class="tree-icon folder el-icon-folder-opened" />
            <span class="tree-label">{{ data.name }}</span>
            <span class="tree-count">({{ data.fileCount || 0 }})</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- ========== 右侧 ========== -->
    <div class="right-panel">

      <!-- ---- 上区：文件目录 ---- -->
      <div class="table-section">
        <div class="section-header">
          <span class="section-title">文件目录</span>
          <div class="section-toolbar">
            <!-- 自适应操作按钮条（宽度不足时自动收进「...」，按钮均无色） -->
            <adaptive-actions :items="fileDirActions" @click="onFileDirAction" />
          </div>
        </div>

        <el-table
          ref="fileDirTable"
          :data="fileDirList"
          row-key="id"
          border stripe size="small"
          height="calc(100% - 60px)"
          @selection-change="onFileDirSelectionChange"
          @row-click="onFileDirRowClick"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" type="index" width="55" align="center" />
          <el-table-column label="档号" prop="archiveNo" width="170" align="center" />
          <el-table-column label="文件题名" prop="title" min-width="200" show-overflow-tooltip sortable align="center">
            <template slot-scope="{ row }">
              <span class="title-link">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="件号" prop="pieceNo" width="120" align="center" sortable />
          <el-table-column label="文号" prop="docNo" width="100" sortable align="center" />
          <el-table-column label="责任者" prop="responsible" width="110" sortable align="center" />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" sortable />
          <el-table-column label="组件情况" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag v-if="row.composed" size="mini" type="success">已组件</el-tag>
              <el-tag v-else size="mini">未组件</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="保管期限" prop="retention" width="90" align="center" />
          <el-table-column label="密级" prop="secretLevel" width="100" align="center" sortable />
          <el-table-column label="文件数" prop="fileCount" width="100" align="center" sortable />
          <el-table-column label="页数" prop="pages" width="100" align="center" sortable />
          <el-table-column label="文件PDF大小" prop="pdfSize" width="110" align="center" />
          <el-table-column label="审核情况" prop="auditStatus" width="90" align="center" />
          <el-table-column label="四性检验情况" prop="fourCheckStatus" width="110" align="center" />
          <el-table-column label="档案类型" prop="archiveType" width="100" align="center" sortable />
          <el-table-column label="移交情况" prop="transferStatus" width="100" align="center" sortable />
          <el-table-column label="互见号" prop="crossNo" width="100" sortable />
          <el-table-column label="备注" prop="remark" width="100" sortable show-overflow-tooltip />
          <el-table-column label="表格状态" prop="tableStatus" width="130" align="center" sortable />
        </el-table>

        <div class="pagination-wrap">
          <span class="total-text">共 {{ fileDirTotal }} 条</span>
          <el-pagination
            background small
            layout="prev, pager, next, jumper"
            :total="fileDirTotal"
            :current-page.sync="fileDirPage"
            @current-change="refreshFileDir"
          />
          <el-select v-model="fileDirPageSize" size="mini" class="page-size-select" @change="refreshFileDir">
            <el-option label="10条/页" :value="10" />
            <el-option label="50条/页" :value="50" />
            <el-option label="100条/页" :value="100" />
          </el-select>
        </div>
      </div>

      <!-- ---- 下区：文件明细 ---- -->
      <div class="table-section">
        <div class="section-header">
          <span class="section-title">文件</span>
          <div class="section-toolbar">
            <!-- 自适应操作按钮条（宽度不足时自动收进「...」，按钮均无色） -->
            <adaptive-actions :items="fileActions" @click="onFileAction" />
          </div>
        </div>

        <el-table
          ref="fileListTable"
          :data="fileList"
          border stripe size="small"
          empty-text="暂无数据"
          height="calc(100% - 60px)"
          @selection-change="handleFileSelectionChange"
        >
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column type="index" width="55" align="center" label="序号" />
          <el-table-column label="文件名称" prop="name" min-width="180" show-overflow-tooltip sortable />
          <el-table-column label="文件编号" prop="fileNo" width="120" sortable />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" sortable />
          <el-table-column label="考证日期" prop="verifyDate" width="110" align="center" />
          <el-table-column label="页数" prop="pages" width="100" align="center" sortable />
          <el-table-column label="排序" prop="sort" width="100" align="center" sortable />
          <el-table-column label="档案类型" prop="archiveType" width="110" align="center" sortable />
          <el-table-column label="文件状态" prop="status" width="120" align="center" sortable>
            <template slot-scope="{ row }">
              <el-tag v-if="row.status === '已上传'" size="mini" type="success">已上传</el-tag>
              <el-tag v-else size="mini" type="info">未上传</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="格式信息" prop="formatInfo" width="110" align="center" sortable />
          <el-table-column label="计算机文件大小" prop="fileSize" width="120" align="center" />
          <el-table-column label="开放" prop="openStatus" width="80" align="center" sortable />
          <el-table-column label="表格状态" prop="tableStatus" width="120" align="center" sortable />
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button size="mini" type="text" icon="el-icon-view" @click="viewFile(row)">预览</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="delFileOne(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- ========== 新增文件弹窗：填写档案信息，确定后推入文件目录 ========== -->
    <el-dialog
      title="新增文件"
      :visible.sync="addFileDialogVisible"
      width="900px"
      custom-class="add-file-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFileForm"
        :model="addFileForm"
        :rules="addFileRules"
        label-width="90px"
        size="small"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="全宗号" prop="fondsNo">
              <el-input v-model="addFileForm.fondsNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别号" prop="categoryNo">
              <el-input v-model="addFileForm.categoryNo" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="文件题名" prop="title">
              <el-input v-model="addFileForm.title" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="档号" prop="archiveNo">
              <el-input v-model="addFileForm.archiveNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="件号" prop="pieceNo">
              <el-input v-model.number="addFileForm.pieceNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文号" prop="docNo">
              <el-input v-model="addFileForm.docNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="互见号" prop="crossNo">
              <el-input v-model="addFileForm.crossNo" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="责任者" prop="responsible">
              <el-input v-model="addFileForm.responsible" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保管期限" prop="retention">
              <el-select v-model="addFileForm.retention" style="width: 100%">
                <el-option label="永久" value="永久" />
                <el-option label="定期30年" value="定期30年" />
                <el-option label="定期10年" value="定期10年" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密级" prop="secretLevel">
              <el-select v-model="addFileForm.secretLevel" style="width: 100%">
                <el-option label="公开" value="公开" />
                <el-option label="内部" value="内部" />
                <el-option label="秘密" value="秘密" />
                <el-option label="机密" value="机密" />
                <el-option label="绝密" value="绝密" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编制日期" prop="createDate">
              <el-date-picker
                v-model="addFileForm.createDate"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年度" prop="year">
              <el-input v-model="addFileForm.year" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="页数" prop="pages">
              <el-input v-model.number="addFileForm.pages" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资料是否齐全" prop="materialsComplete">
              <el-select v-model="addFileForm.materialsComplete" style="width: 100%">
                <el-option label="齐全" value="齐全" />
                <el-option label="基本齐全" value="基本齐全" />
                <el-option label="不齐全" value="不齐全" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参考信息" prop="referenceInfo">
              <el-input v-model="addFileForm.referenceInfo" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="saveFileDir">确定</el-button>
        <el-button size="small" @click="addFileDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 文件明细 新增/修改/上传文件弹窗 ========== -->
    <el-dialog
      :title="fileDialogTitle"
      :visible.sync="fileDialogVisible"
      width="900px"
      custom-class="add-file-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="fileForm"
        :model="fileForm"
        :rules="fileRules"
        label-width="90px"
        size="small"
      >
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="文件名称" prop="name">
              <el-input v-model="fileForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件编号" prop="fileNo">
              <el-input v-model="fileForm.fileNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编制日期" prop="createDate">
              <el-date-picker
                v-model="fileForm.createDate"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="考证日期" prop="verifyDate">
              <el-date-picker
                v-model="fileForm.verifyDate"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="页数" prop="pages">
              <el-input v-model.number="fileForm.pages" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input v-model.number="fileForm.sort" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="fileForm.remark" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="saveFileDialog">{{ fileDialogMode === 'upload' ? '保存后选择文件' : '确定' }}</el-button>
        <el-button size="small" @click="fileDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 批量上传弹窗 ========== -->
    <el-dialog
      title="批量上传"
      :visible.sync="batchUploadVisible"
      width="520px"
      custom-class="upload-panel-dialog"
      :close-on-click-modal="false"
    >
      <el-upload
        class="upload-picker"
        drag
        action="#"
        multiple
        :show-file-list="false"
        :on-change="onUploadPicked"
      >
        <div class="upload-picker-row">
          <span>在这里拖放文件上传</span>
          <span class="upload-picker-or">或</span>
          <span class="upload-picker-btn">选择文件</span>
        </div>
      </el-upload>
      <div class="upload-tip">
        根据国家标准、行业标准要求<br>
        实体文件请上传PDF等版式文档格式进行归档
      </div>
      <div class="upload-blank" />
    </el-dialog>

    <!-- ========== 上传压缩文件弹窗 ========== -->
    <el-dialog
      title="上传压缩文件"
      :visible.sync="zipUploadVisible"
      width="520px"
      custom-class="upload-panel-dialog zip-panel-dialog"
      :close-on-click-modal="false"
    >
      <el-upload
        class="upload-picker"
        drag
        action="#"
        :show-file-list="false"
        :on-change="onUploadPicked"
      >
        <div class="upload-picker-row">
          <span>在这里拖放文件上传</span>
          <span class="upload-picker-or">或</span>
          <span class="upload-picker-btn">选择文件</span>
        </div>
      </el-upload>
      <div class="upload-blank" />
    </el-dialog>

    <!-- ========== 收集弹窗：标题随点击的收集项切换 ========== -->
    <collect-dialog :visible.sync="collectVisible" :title="collectTitle" @confirm="onCollectConfirm" />

    <!-- ========== 收集移交文件弹窗 ========== -->
    <transfer-dialog :visible.sync="transferVisible" @confirm="onTransferConfirm" />
  </div>
</template>

<script>
/**
 * 左侧树 mock：与"维护分类"同源，fileCount 表示该节点下文件数
 */
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', fileCount: 0, level: 1,
    children: [
      { id: 11, name: '第一部分 项目申报文件', fileCount: 1, level: 2,
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件', fileCount: 1, level: 3 },
          { id: 112, name: '二、可行性研究报告及批复、可行性论证意见', fileCount: 0, level: 3 },
          { id: 113, name: '三、环境影响报告及批复文件', fileCount: 0, level: 3 },
          { id: 114, name: '四、水土保持方案报告及批复文件', fileCount: 0, level: 3 },
          { id: 115, name: '五、项目咨询、评估、论证文件', fileCount: 0, level: 3 },
          { id: 116, name: '六、投资、特许经营协议', fileCount: 0, level: 3 },
          { id: 117, name: '七、工程融资贷款计划、资金筹措方案、银行贷款协议', fileCount: 0, level: 3 }
        ]
      },
      { id: 12, name: '第二部分 设计文件', fileCount: 0, level: 2,
        children: [
          { id: 121, name: '一、初步设计及有关审批文件', fileCount: 0, level: 3 },
          { id: 122, name: '二、施工图设计及有关审批文件', fileCount: 0, level: 3 },
          { id: 123, name: '三、有关设计问题的往来文件', fileCount: 0, level: 3 },
          { id: 124, name: '四、设计技术联系单', fileCount: 0, level: 3 }
        ]
      },
      { id: 13, name: '第三部分 工程管理文件', fileCount: 3, level: 2 },
      { id: 14, name: '第四部分 施工文件', fileCount: 47020, level: 2 },
      { id: 15, name: '第五部分 监理文件', fileCount: 2740, level: 2 },
      { id: 16, name: '第六部分 竣工（交）验收文件', fileCount: 0, level: 2,
        children: [
          { id: 161, name: '一、交工验收文件', fileCount: 0, level: 3 },
          { id: 162, name: '二、工程交接表', fileCount: 0, level: 3 },
          { id: 163, name: '三、计量支付报表及汇编', fileCount: 0, level: 3 },
          { id: 164, name: '四、工程变更文件', fileCount: 0, level: 3 },
          { id: 165, name: '五、专项验收文件', fileCount: 0, level: 3 },
          { id: 166, name: '六、结算文件', fileCount: 0, level: 3 },
          { id: 167, name: '六、竣工验收文件', fileCount: 0, level: 3 }
        ]
      },
      { id: 17, name: '第七部分 科研文件', fileCount: 0, level: 2 }
    ]
  }
]

/** 选中"一、项目建议书..."节点时展示的文件目录 mock */
const MOCK_FILE_DIR = [
  {
    id: 1, archiveNo: '1-1', title: '柯桥至诸暨高速公路工程项目建议书', pieceNo: 1,
    docNo: '绍发改〔2022〕111号', responsible: '绍兴市柯诸高速公路有限公司',
    createDate: '2026-05-14', composed: false,
    retention: '永久', secretLevel: '', fileCount: 2, pages: 0, pdfSize: '',
    auditStatus: '未审核', fourCheckStatus: '未检验', archiveType: '数字化档案',
    transferStatus: '未移交', crossNo: '', remark: '', tableStatus: ''
  }
]

/** 文件明细 mock */
const MOCK_FILE_LIST = []

import AdaptiveActions from '@/components/AdaptiveActions'
import CollectDialog from './components/collect-dialog.vue'
import TransferDialog from './components/transfer-dialog.vue'

export default {
  name: 'ArchivePreFile',
  components: { CollectDialog, TransferDialog, AdaptiveActions },
  data() {
    return {
      // 左
      treeKeyword: '',
      companyFilter: 'all',
      fullTree: JSON.parse(JSON.stringify(TREE_DATA)),
      filteredTree: JSON.parse(JSON.stringify(TREE_DATA)),
      currentNode: null,

      // 右上：文件目录
      fileDirList: [],
      fileDirTotal: 0,
      fileDirPage: 1,
      fileDirPageSize: 100,
      fileDirSelection: [],
      fileDirKeyword: '',

      // 右下：文件明细
      fileList: [],
      selectedFile: null,
      fileSelection: [],

      // 新增文件弹窗
      addFileDialogVisible: false,
      addFileForm: this.defaultAddFileForm(),
      addFileRules: {
        title: [{ required: true, message: '不能为空', trigger: 'blur' }],
        pieceNo: [{ required: true, message: '不能为空', trigger: 'blur' }],
        responsible: [{ required: true, message: '不能为空', trigger: 'blur' }],
        retention: [{ required: true, message: '不能为空', trigger: 'change' }],
        secretLevel: [{ required: true, message: '不能为空', trigger: 'change' }],
        materialsComplete: [{ required: true, message: '不能为空', trigger: 'change' }]
      },

      // 文件明细 新增/修改弹窗
      fileDialogVisible: false,
      fileDialogMode: 'add',
      fileDialogRow: null,
      batchUploadVisible: false,
      zipUploadVisible: false,
      fileForm: {
        name: '',
        fileNo: '',
        createDate: '',
        verifyDate: '',
        pages: 0,
        sort: 1,
        remark: ''
      },
      fileRules: {
        name: [{ required: true, message: '不能为空', trigger: 'blur' }],
        createDate: [{ required: true, message: '不能为空', trigger: 'change' }],
        sort: [{ required: true, message: '不能为空', trigger: 'blur' }]
      },

      // 收集下拉选项（彩色文档图标）
      collectOptions: [
        { label: '收集进度材料', color: '#67c23a' },
        { label: '收集表附件材料', color: '#67c23a' },
        { label: '收集监理月报', color: '#e6a23c' },
        { label: '收集施工月报', color: '#e6a23c' },
        { label: '收集其他来文', color: '#409eff' },
        { label: '收集仪器鉴定文件', color: '#409eff' },
        { label: '收集前期工作', color: '#909399' },
        { label: '收集设计图纸', color: '#909399' },
        { label: '收集创造建设', color: '#e6a23c' },
        { label: '收集开工报告', color: '#67c23a' },
        { label: '收集施工组织设计及方案', color: '#409eff' },
        { label: '收集综合资料', color: '#e6a23c' },
        { label: '收集变更管理', color: '#f56c6c' },
        { label: '收集接收表格', color: '#909399' }
      ],

      // 收集弹窗
      collectVisible: false,
      collectTitle: '收集',

      // 收集移交文件弹窗
      transferVisible: false
    }
  },
  computed: {
    /** 文件目录是否选中了行（控制下表所有按钮可用性） */
    dirSelected() {
      return this.fileDirSelection.length > 0
    },
    /** 文件弹窗标题：新增 / 修改 / 上传文件 */
    fileDialogTitle() {
      if (this.fileDialogMode === 'edit') return '修改文件'
      return this.fileDialogMode === 'upload' ? '上传文件' : '新增文件'
    },
    /** 文件目录工具栏按钮（统一交 AdaptiveActions 自适应收纳；均不传 type 保持无色） */
    fileDirActions() {
      const none = !this.fileDirSelection.length
      return [
        { key: 'search', label: '文件搜索', icon: 'el-icon-search' },
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus' },
        { key: 'delete', label: '删除', icon: 'el-icon-delete', disabled: none },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', disabled: none },
        { key: 'compose', label: '组件', icon: 'el-icon-s-operation', disabled: none },
        { key: 'view-pdf', label: '查看文件PDF', icon: 'el-icon-view', disabled: none },
        { key: 'verify', label: '四性校验', icon: 'el-icon-check', disabled: none },
        { key: 'print', label: '打印', icon: 'el-icon-printer', children: [
          { key: 'print-dir', label: '打印目录' },
          { key: 'print-list', label: '打印文件清单' }
        ] }
      ]
    },
    /** 文件工具栏按钮（统一交 AdaptiveActions 自适应收纳；均不传 type 保持无色） */
    fileActions() {
      const none = !this.dirSelected
      const one = none || this.fileSelection.length !== 1
      const any = none || !this.fileSelection.length
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh', disabled: none },
        { key: 'add', label: '新增', icon: 'el-icon-plus', disabled: none },
        { key: 'upload', label: '上传', icon: 'el-icon-upload2', disabled: none, children: [
          { key: 'upload-file', label: '上传文件', icon: 'el-icon-upload', color: '#409eff' },
          { key: 'upload-scatter', label: '散点上传', icon: 'el-icon-share', color: '#409eff' },
          { key: 'upload-batch', label: '批量上传', icon: 'el-icon-copy-document', color: '#67c23a' },
          { key: 'upload-zip', label: '上传压缩文件', icon: 'el-icon-box', color: '#67c23a' },
          { key: 'upload-clear', label: '清空文件', icon: 'el-icon-delete', color: '#909399' }
        ] },
        { key: 'collect-excel', label: '收集表格', icon: 'el-icon-s-order', disabled: none },
        { key: 'collect', label: '收集', icon: 'el-icon-download', disabled: none, children: this.collectOptions.map(o => ({ key: `collect:${o.label}`, label: o.label, icon: 'el-icon-document', color: o.color })) },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', disabled: none },
        { key: 'delete', label: '删除', icon: 'el-icon-delete', disabled: any },
        { key: 'view-dl', label: '查看/下载', icon: 'el-icon-search', disabled: one, children: [
          { key: 'view-pdf', label: '查看PDF/文件', icon: 'el-icon-document', color: '#67c23a' },
          { key: 'view-original', label: '查看原始文件', icon: 'el-icon-picture-outline', color: '#67c23a' },
          { key: 'batch-attach', label: '批量下载附件', icon: 'el-icon-download', disabled: true },
          { key: 'batch-meta', label: '批量元数据', icon: 'el-icon-tickets', disabled: true }
        ] },
        { key: 'transfer', label: '收集移交文件', icon: 'el-icon-finished', disabled: none }
      ]
    }
  },
  created() {
    this.refreshFileDir()
  },
  watch: {
    treeKeyword() { this.filterTree() }
  },
  methods: {
    /** 按关键字过滤树（保留祖先） */
    filterTree() {
      const kw = this.treeKeyword.trim()
      if (!kw) {
        this.filteredTree = JSON.parse(JSON.stringify(this.fullTree))
        return
      }
      const walk = (list) => list.reduce((acc, n) => {
        const selfHit = n.name.includes(kw)
        const childrenHit = n.children ? walk(n.children) : []
        if (selfHit || childrenHit.length) acc.push({ ...n, children: childrenHit })
        return acc
      }, [])
      this.filteredTree = walk(this.fullTree)
    },

    /** 点击左侧树节点 → 加载右侧数据（纯 mock） */
    handleNodeClick(node) {
      this.currentNode = node
      this.refreshFileDir()
    },

    // ===== 右上图：文件目录 =====
    refreshFileDir() {
      // 纯 mock：选中叶子节点（有文件数）时给点示例数据
      let list = []
      if (this.currentNode && this.currentNode.fileCount > 0) {
        list = JSON.parse(JSON.stringify(MOCK_FILE_DIR))
      }
      // 应用文件搜索关键字过滤
      const kw = this.fileDirKeyword.trim()
      if (kw) list = list.filter(x => (x.title || '').includes(kw))
      this.fileDirList = list
      this.fileDirTotal = list.length
      this.fileDirPage = 1
      // 切树节点时清空已选中的目录 & 右下文件列表
      this.$nextTick(() => {
        this.fileDirSelection = []
        this.fileList = []
      })
    },

    /** 自适应按钮条统一分发 */
    onFileDirAction(item) {
      const map = {
        'search': () => this.searchFileDir(),
        'refresh': () => this.refreshFileDir(),
        'add': () => this.addFileDir(),
        'delete': () => this.delFileDir(),
        'edit': () => this.editFileDir(),
        'compose': () => this.compose(),
        'view-pdf': () => this.viewPdf(),
        'verify': () => this.verifyFour(),
        'print-dir': () => this.$message.info('打印目录（静态 DEMO）'),
        'print-list': () => this.$message.info('打印文件清单（静态 DEMO）')
      }
      const fn = map[item.key]
      fn && fn()
    },
    /** 文件搜索：按文件题名关键字过滤当前目录 */
    searchFileDir() {
      this.$prompt('请输入文件题名关键字', '文件搜索', { inputValue: this.fileDirKeyword })
        .then(({ value }) => {
          this.fileDirKeyword = (value || '').trim()
          this.refreshFileDir()
          if (this.fileDirKeyword) this.$message.info(`文件搜索：${this.fileDirKeyword}`)
        }).catch(() => {})
    },

    /** 文件列表自适应按钮条统一分发 */
    onFileAction(item) {
      const key = item.key
      // 收集下拉：key 形如 collect:收集进度材料
      if (key.startsWith('collect:')) {
        this.collectByType(key.slice(8))
        return
      }
      const map = {
        'refresh': () => this.refreshFileList(),
        'add': () => this.addFile(),
        'upload-file': () => this.openUploadFileDialog(),
        'upload-scatter': () => { this.batchUploadVisible = true },
        'upload-batch': () => { this.batchUploadVisible = true },
        'upload-zip': () => { this.zipUploadVisible = true },
        'upload-clear': () => this.clearFiles(),
        'collect-excel': () => this.collectExcel(),
        'edit': () => this.editFile(),
        'delete': () => this.delFile(),
        'view-pdf': () => this.viewFile(),
        'view-original': () => this.viewOriginalFile(),
        'transfer': () => this.transferFiles()
      }
      const fn = map[key]
      fn && fn()
    },

    /** selection-change 回调（method 形式确保 this 正确，Vue 响应式赋值） */
    onFileDirSelectionChange(selection) {
      this.fileDirSelection = selection || []
    },
    /** 点击目录行 → 加载其下文件明细 */
    onFileDirRowClick(row) {
      this.fileList = this.getFilesByDir(row.id)
    },
    getFilesByDir(dirId) {
      // mock：给一些示例
      return dirId === 1 ? [
        { id: 1, name: '柯桥至诸暨高速公路工程项目建议书.pdf', fileNo: 'PDF-0001', createDate: '2026-05-14', verifyDate: '', pages: 28, sort: 1, archiveType: 'PDF', status: '已上传', formatInfo: 'PDF格式', fileSize: '2.35MB', openStatus: '开放', tableStatus: '' },
        { id: 2, name: '项目建议书编制说明.docx', fileNo: 'DOC-0001', createDate: '2026-05-10', verifyDate: '', pages: 12, sort: 2, archiveType: 'Word', status: '已上传', formatInfo: 'DOCX格式', fileSize: '56.8KB', openStatus: '开放', tableStatus: '' }
      ] : []
    },
    addFileDir() {
      if (!this.currentNode) { this.$message.warning('请先在左侧选择分类'); return }
      // 打开新增文件弹窗，填默认值；确定后推入数据
      this.addFileForm = this.defaultAddFileForm()
      this.addFileForm.pieceNo = this.fileDirList.length + 1
      this.addFileDialogVisible = true
      this.$nextTick(() => {
        this.$refs.addFileForm && this.$refs.addFileForm.clearValidate()
      })
    },
    /** 新增文件弹窗默认值（全宗号 0001、类别号 XM、编制日期/年度默认当天；件号在打开弹窗时按列表长度自增） */
    defaultAddFileForm() {
      return {
        fondsNo: '0001',
        categoryNo: 'XM',
        title: '',
        archiveNo: '',
        pieceNo: 1,
        docNo: '',
        crossNo: '',
        responsible: '',
        retention: '永久',
        secretLevel: '',
        createDate: this.today(),
        year: String(new Date().getFullYear()),
        pages: 0,
        materialsComplete: '齐全',
        referenceInfo: ''
      }
    },
    /** 弹窗确定：校验通过后推入文件目录表格 */
    saveFileDir() {
      this.$refs.addFileForm.validate(valid => {
        if (!valid) return
        const f = this.addFileForm
        this.fileDirList.push({
          id: Date.now(),
          archiveNo: f.archiveNo || `${f.fondsNo}-${f.categoryNo}-${f.pieceNo}`,
          title: f.title,
          pieceNo: f.pieceNo,
          docNo: f.docNo,
          responsible: f.responsible,
          createDate: f.createDate,
          composed: false,
          retention: f.retention,
          secretLevel: f.secretLevel,
          fileCount: 0,
          pages: f.pages || 0,
          pdfSize: '',
          auditStatus: '未审核',
          fourCheckStatus: '未检验',
          archiveType: '数字化档案',
          transferStatus: '未移交',
          crossNo: f.crossNo,
          remark: '',
          tableStatus: ''
        })
        this.fileDirTotal = this.fileDirList.length
        this.addFileDialogVisible = false
        this.$message.success('新增文件成功')
      })
    },
    delFileDir() {
      if (!this.fileDirSelection.length) return
      this.$confirm(`删除 ${this.fileDirSelection.length} 条文件目录？`, '提示', { type: 'warning' })
        .then(() => {
          const ids = new Set(this.fileDirSelection.map(x => x.id))
          this.fileDirList = this.fileDirList.filter(x => !ids.has(x.id))
          this.fileDirTotal = this.fileDirList.length
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    editFileDir() {
      const row = this.fileDirSelection[0]
      if (!row) return
      this.$prompt('修改文件题名', '编辑', { inputValue: row.title })
        .then(({ value }) => { row.title = value; this.$message.success('已修改') })
        .catch(() => {})
    },
    compose() {
      const ids = this.fileDirSelection.map(x => x.id).join(', ')
      this.$message.info(`组件：选中 ${this.fileDirSelection.length} 条（档号 ${ids}），标记为"已组件"`)
      this.fileDirSelection.forEach(r => { r.composed = true })
    },
    viewPdf() {
      const row = this.fileDirSelection[0]
      if (!row) return
      this.$message.info(`查看 PDF：${row.title}`)
    },
    verifyFour() {
      this.$message.success(`对选中 ${this.fileDirSelection.length} 条执行"四性校验"（静态 DEMO：模拟通过）`)
    },

    // ===== 右下：文件明细 =====
    refreshFileList() {
      this.fileList = []
      this.selectedFile = null
      this.$message.info('刷新文件明细列表（静态 DEMO）')
    },
    addFile() {
      // 新增文件：打开弹窗，排序默认为列表长度 + 1
      this.openFileDialog('add')
    },
    /** 上传 → 上传文件：复用文件弹窗，标题「上传文件」、底部「保存后选择文件」 */
    openUploadFileDialog() {
      this.openFileDialog('upload')
    },
    /** 打开文件弹窗（add=新增 / upload=上传文件），排序默认为列表长度 + 1 */
    openFileDialog(mode) {
      this.fileDialogMode = mode
      this.fileDialogRow = null
      this.fileForm = {
        name: '',
        fileNo: '',
        createDate: this.today(),
        verifyDate: '',
        pages: 0,
        sort: this.fileList.length + 1,
        remark: ''
      }
      this.fileDialogVisible = true
      this.$nextTick(() => {
        this.$refs.fileForm && this.$refs.fileForm.clearValidate()
      })
    },
    /** 批量上传 / 上传压缩文件：选择文件后提示（静态 DEMO） */
    onUploadPicked(file) {
      this.$message.success(`已选择文件：${file.name}`)
    },
    /** 上传 → 清空文件：清空当前文件列表 */
    clearFiles() {
      if (!this.fileList.length) { this.$message.info('当前列表暂无文件'); return }
      this.$confirm('确定清空当前文件列表？', '提示', { type: 'warning' })
        .then(() => {
          this.fileList = []
          this.selectedFile = null
          this.$message.success('清空成功')
        }).catch(() => {})
    },
    editFile() {
      const row = this.selectedFile
      // 修改按钮在选中目录后即可用，未勾选具体文件时给出提示
      if (!row) { this.$message.warning('请先勾选要修改的文件'); return }
      // 修改文件：打开弹窗并回填当前行
      this.fileDialogMode = 'edit'
      this.fileDialogRow = row
      this.fileForm = {
        name: row.name,
        fileNo: row.fileNo,
        createDate: row.createDate,
        verifyDate: row.verifyDate,
        pages: row.pages,
        sort: row.sort,
        remark: row.remark || ''
      }
      this.fileDialogVisible = true
      this.$nextTick(() => {
        this.$refs.fileForm && this.$refs.fileForm.clearValidate()
      })
    },
    /** 文件明细弹窗确定：校验通过后新增/上传文件推入 / 修改更新当前行 */
    saveFileDialog() {
      this.$refs.fileForm.validate(valid => {
        if (!valid) return
        const f = { ...this.fileForm }
        if (this.fileDialogMode !== 'edit') {
          const ext = f.name.includes('.') ? f.name.split('.').pop() : ''
          this.fileList.push({
            id: Date.now(),
            ...f,
            archiveType: ext.toUpperCase(),
            status: '未上传',
            formatInfo: ext ? `${ext.toUpperCase()}格式` : '',
            fileSize: '',
            openStatus: '',
            tableStatus: ''
          })
          this.$message.success(this.fileDialogMode === 'upload' ? '保存成功，请选择要上传的文件' : '新增文件成功')
        } else {
          Object.assign(this.fileDialogRow, f)
          this.$message.success('修改成功')
        }
        this.fileDialogVisible = false
      })
    },
    delFile() {
      const targets = this.fileSelection.slice()
      if (!targets.length) return
      const names = targets.map(x => x.name).join('、')
      this.$confirm(`删除文件「${names}」？`, '提示', { type: 'warning' })
        .then(() => {
          const ids = targets.map(x => x.id)
          this.fileList = this.fileList.filter(x => !ids.includes(x.id))
          this.selectedFile = null
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    /** 操作列删除单行（不受勾选影响） */
    delFileOne(row) {
      if (!row) return
      this.$confirm(`删除文件「${row.name}」？`, '提示', { type: 'warning' })
        .then(() => {
          this.fileList = this.fileList.filter(x => x.id !== row.id)
          if (this.selectedFile && this.selectedFile.id === row.id) this.selectedFile = null
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    viewFile(row) {
      const target = row || this.selectedFile
      if (!target) return
      this.$message.info(`查看/下载：${target.name}（静态 DEMO）`)
    },
    handleFileSelectionChange(selection) {
      this.fileSelection = selection || []
      // 单选时同步 selectedFile，供查看/下载等单行操作使用
      this.selectedFile = this.fileSelection.length === 1 ? this.fileSelection[0] : null
    },
    collectExcel() { this.$message.info('收集表格：生成 Excel 清单') },
    /** 按收集类型打开收集弹窗（标题随类型切换） */
    collectByType(type) {
      this.collectTitle = type
      this.collectVisible = true
    },
    /** 收集弹窗确定：回填选中文件 */
    onCollectConfirm({ title, files }) {
      this.$message.success(`「${title}」收集了 ${files.length} 个文件`)
    },
    /** 查看原始文件 */
    viewOriginalFile() {
      const target = this.selectedFile
      if (!target) return
      this.$message.info(`查看原始文件：${target.name}`)
    },
    transferFiles() { this.transferVisible = true },
    /** 移交弹窗确定 */
    onTransferConfirm({ tx, files }) {
      this.$message.success(`移交事务「${tx ? tx.name : ''}」共移交 ${files.length} 个文件`)
    },
    today() {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.pre-file-page {
  display: flex;
  height: 100%;
  background: #fff;
  gap: 8px;
  padding: 8px;

  // 左侧面板
  .left-panel {
    width: 260px;
    flex-shrink: 0;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .left-header {
      padding: 8px;
      background: #f7f9fc;
      border-bottom: 1px solid #ebeef5;

      .company-select { width: 100%; margin-top: 6px; }

      .el-input__inner {
        height: 26px;
        line-height: 27px;
      }
    }

    .left-tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 6px;

      ::v-deep .el-tree-node__content { height: 30px; }
    }

    .tree-node {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;

      .tree-icon { font-size: 14px; }
      .tree-icon.folder { color: #e6a23c; }
      .tree-icon.leaf { color: #409eff; }
      .tree-label { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tree-count { color: #909399; font-size: 12px; }
    }
  }

  // 右侧面板
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
    padding-bottom: 10px;
  }

  .table-section {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    // 上区较高（文件目录较复杂），下区稍矮
    &:nth-of-type(1) { flex: 1.1; }
    &:nth-of-type(2) { flex: 1; }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f7f9fc;
      border-bottom: 1px solid #ebeef5;
      flex-wrap: wrap;
      gap: 6px;
      background: $themeColor;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }
      .section-toolbar {
        // 必须撑满剩余宽度：AdaptiveActions 依赖容器宽度计算按钮收纳，
        // 若宽度由内容收缩决定，会形成"收缩→重算→再收缩"的死循环，按钮展示不全
        flex: 1;
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        // 覆盖 AdaptiveActions 默认右对齐，保持按钮左对齐排列
        ::v-deep .adaptive-actions {
          justify-content: flex-end;
        }
      }
    }

    // 文件题名：蓝色链接样式（见截图）
    ::v-deep .title-link {
      color: #409eff;
      cursor: pointer;
    }

    ::v-deep .el-table { flex: 1; }
    ::v-deep .el-table__body-wrapper, ::v-deep .el-table__body-wrapper { overflow: auto; }
  }

  .pagination-wrap {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding: 6px 12px;
    border-top: 1px solid #ebeef5;
    background: #fafbfc;

    .total-text { color: #606266; font-size: 13px; margin-right: auto; }
    .page-size-select { width: 110px; }
  }
}
</style>

<style lang="scss">
/* 新增文件弹窗（append-to-body 需用全局样式） */
.add-file-dialog {
  .el-dialog__header {
    padding: 12px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__body {
    padding: 16px 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .el-form-item {
    margin-bottom: 14px;
  }
}

/* 批量上传 / 上传压缩文件弹窗 */
.upload-panel-dialog {
  .el-dialog__header {
    padding: 12px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__body {
    padding: 16px 20px;
  }

  /* 拖放上传条：细长一行「在这里拖放文件上传 或 [选择文件]」 */
  .upload-picker {
    .el-upload,
    .el-upload-dragger {
      width: 100%;
    }

    .el-upload-dragger {
      height: auto;
      padding: 8px 12px;
      text-align: left;
    }

    .el-upload-dragger .el-icon-upload {
      display: none;
    }
  }

  .upload-picker-row {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #606266;
  }

  .upload-picker-or {
    margin: 0 8px;
  }

  .upload-picker-btn {
    padding: 5px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    background: #fff;
    font-size: 12px;
    color: #606266;
    cursor: pointer;

    &:hover {
      color: #409eff;
      border-color: #c6e2ff;
      background: #ecf5ff;
    }
  }

  /* 红色归档提示（仅批量上传弹窗） */
  .upload-tip {
    margin-top: 12px;
    text-align: center;
    font-size: 15px;
    font-weight: bold;
    line-height: 1.9;
    color: #f00;
  }

  /* 弹窗下方留白区 */
  .upload-blank {
    height: 230px;
  }

  &.zip-panel-dialog .upload-blank {
    height: 300px;
  }
}
</style>
