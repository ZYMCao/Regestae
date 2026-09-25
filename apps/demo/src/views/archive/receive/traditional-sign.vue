<template>
  <!--
    传统档案电子签：左侧档案分类目录树 + 右侧电子签文件列表
    纯静态 DEMO，不请求接口
  -->
  <div class="traditional-sign-page">

    <!-- ========== 左侧：档案分类目录树 ========== -->
    <div class="left-panel">
      <div class="left-search">
        <el-input
          v-model="categoryKeyword"
          placeholder="请输入档案分类目录"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        >
          <el-button slot="append" icon="el-icon-search" @click="filterTree" />
        </el-input>
      </div>
      <div class="left-tree-title">档案分类目录</div>
      <div class="left-tree-wrap">
        <el-tree
          ref="categoryTree"
          :data="categoryTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i :class="nodeIcon(data)" />
            <span class="tree-node-label">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- ========== 右侧：电子签文件列表 ========== -->
    <div class="right-panel">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索"
          size="small"
          clearable
          class="search-input"
          @keyup.enter.native="doSearch"
        >
          <i slot="prefix" class="el-icon-search el-input__icon" />
        </el-input>
        <el-button size="small" type="warning" plain icon="el-icon-edit-outline" :disabled="!canMainSign" @click="batchMainSign">主签名</el-button>
        <el-button size="small" plain icon="el-icon-edit" :disabled="!selection.length" @click="batchReSign">重新签名</el-button>
        <el-button size="small" plain icon="el-icon-collection" :disabled="selection.length !== 1" @click="viewCollectInfo">查看收集信息</el-button>
        <el-button size="small" icon="el-icon-refresh" @click="refresh">刷新</el-button>
        <el-button size="small" type="success" plain icon="el-icon-finished" :disabled="!selection.length" @click="batchSign">电子签章</el-button>
        <el-button size="small" type="primary" plain icon="el-icon-stamp" :disabled="!selection.length" @click="batchSeal">公章签章</el-button>
        <el-checkbox v-model="onlySigned" class="signed-check" @change="doSearch">已签名</el-checkbox>
      </div>

      <!-- 查看收集信息弹窗 -->
      <el-dialog
        title="上传文件收集信息"
        :visible.sync="collectDialogVisible"
        width="560px"
        custom-class="collect-info-dialog"
        append-to-body
      >
        <div v-if="collectRow" class="collect-info">
          <div class="info-row"><span class="label">收集ID:</span>{{ collectRow.collectId }}</div>
          <div class="info-row"><span class="label">文件编号:</span>{{ collectRow.fileCode || '-' }}</div>
          <div class="info-row"><span class="label">文件名称:</span>{{ collectRow.name }}</div>
          <div class="info-row"><span class="label">收集人:</span>{{ collectRow.collector }}</div>
          <div class="info-row"><span class="label">收集日期:</span>{{ collectRow.collectDate }}</div>
          <div class="section">所在文件目录: {{ collectRow.fileDirName }}</div>
          <div class="section indent">文件目录所在路径: {{ collectRow.fileDirPath }}</div>
          <div class="section">所在案卷目录: {{ collectRow.volumeDirName }}</div>
          <div class="section indent">案卷目录所在路径: {{ collectRow.volumePath }}</div>
          <div class="section">删除信息:</div>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" size="small" @click="collectDialogVisible = false">确定</el-button>
        </div>
      </el-dialog>

      <!-- 电子签章弹窗 -->
      <el-dialog
        title="电子签章"
        :visible.sync="signDialogVisible"
        width="880px"
        top="4vh"
        custom-class="sign-dialog"
        append-to-body
      >
        <!-- 事务目录 -->
        <div class="sign-section-header">
          <span class="sign-section-title">事务目录</span>
          <div class="sign-section-btns">
            <el-button size="mini" icon="el-icon-refresh" @click="refreshAffairs">刷新</el-button>
            <el-button size="mini" icon="el-icon-delete" disabled>催办</el-button>
            <el-button size="mini" type="primary" icon="el-icon-user" @click="submitAudit">提请审核</el-button>
            <el-button size="mini" type="primary" plain icon="el-icon-remove-outline" disabled>撤销审核</el-button>
            <el-button size="mini" plain>···</el-button>
            <el-button size="mini" icon="el-icon-arrow-down" />
          </div>
        </div>
        <el-table
          :data="affairList"
          border
          size="small"
          highlight-current-row
          empty-text="暂无数据"
          class="sign-table"
        >
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">{{ scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="事务名称" prop="name" align="left" show-overflow-tooltip sortable />
          <el-table-column label="审核状态" width="200" align="center" sortable>
            <template slot-scope="{ row }">
              <span :class="row.status === '已审核' ? 'text-success' : 'text-muted'">{{ row.status }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="sign-pagination">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="affairList.length"
            :current-page="1"
            :page-size="100"
            :page-sizes="[10, 50, 100]"
          />
        </div>

        <!-- 签名文件 -->
        <div class="sign-section-header blue">
          <span class="sign-section-title">签名文件</span>
          <i class="el-icon-arrow-down" />
        </div>
        <el-table
          :data="signFileList"
          border
          size="small"
          empty-text="暂无数据"
          class="sign-table"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">{{ scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件/表格名称" prop="name" align="left" show-overflow-tooltip sortable />
          <el-table-column label="主签名情况" width="140" align="center" sortable>
            <template slot-scope="{ row }">
              <span :class="row.mainSign === '已签名' ? 'text-success' : 'text-muted'">{{ row.mainSign }}</span>
            </template>
          </el-table-column>
          <el-table-column label="公章签章情况" prop="sealSign" width="130" align="center" />
        </el-table>

        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="signDialogVisible = false">关闭</el-button>
        </div>
      </el-dialog>

      <el-table
        ref="table"
        :data="pagedList"
        row-key="id"
        border
        size="small"
        empty-text="暂无数据"
        height="100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="序号" width="60" align="center">
          <template slot-scope="scope">{{ pageStart + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="文件/表格名称" prop="name" min-width="360" align="left" show-overflow-tooltip />
        <el-table-column label="原件文件名" prop="originalName" min-width="200" align="left" show-overflow-tooltip />
        <el-table-column label="主签名情况" width="110" align="center">
          <template slot-scope="{ row }">
            <span :class="row.mainSign === '已签名' ? 'text-success' : 'text-danger'">{{ row.mainSign }}</span>
          </template>
        </el-table-column>
        <el-table-column label="公章签章情况" prop="sealSign" width="110" align="center" />
        <el-table-column label="AI遮挡" prop="aiMask" width="90" align="center" />
        <el-table-column label="页数" prop="pages" width="80" align="center" />
        <el-table-column label="文件大小" prop="fileSize" width="100" align="center" />
        <el-table-column label="编制日期" prop="createDate" width="110" align="center" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="filteredList.length"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[10, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<script>
/** 档案分类目录树 mock（与截图层级一致：七大部分） */
const MOCK_CATEGORY_TREE = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    icon: 'root',
    children: [
      {
        id: 11,
        name: '第一部分 项目申报文件',
        children: [
          { id: 111, name: '一、项目建议书及批复、...' },
          { id: 112, name: '二、可行性研究报告及批...' },
          { id: 113, name: '三、环境影响报告及批复...' },
          { id: 114, name: '四、水土保持方案报告及...' },
          { id: 115, name: '五、项目咨询、评估、论...' },
          { id: 116, name: '六、投资、特许经营协议' },
          { id: 117, name: '七、工程融资贷款计划、...' }
        ]
      },
      {
        id: 12,
        name: '第二部分 设计文件',
        children: [
          { id: 121, name: '一、初步设计及有关审批...' },
          { id: 122, name: '二、施工图设计及有关审...' },
          { id: 123, name: '三、有关设计问题的往来...' },
          { id: 124, name: '四、设计技术联系单' }
        ]
      },
      { id: 13, name: '第三部分 工程管理文件' },
      { id: 14, name: '第四部分 施工文件' },
      { id: 15, name: '第五部分 监理文件' },
      { id: 16, name: '第六部分 竣工（交）验收...' },
      { id: 17, name: '第七部分 科研文件' }
    ]
  }
]

/** 电子签文件列表 mock（共 48 条未签名 + 图片中 17 条已签名） */
const MOCK_SIGNED_LIST = [
  { name: 'OPGW光缆安装检验批质量验收记录表', originalName: 'OPGW光缆安装检验批质量验收记录表.pdf', pages: 1, fileSize: '0.27MB', createDate: '2023-05-27' },
  { name: '导线、地线（OPGW）紧线检验批质量验收记录表', originalName: '导线、地线（OPGW）紧线检验批质量验收记录表.pdf', pages: 1, fileSize: '0.23MB', createDate: '2023-05-26' },
  { name: '导线、地线耐张管施工检验批质量验收记录表', originalName: '导线、地线耐张管施工检验批质量验收记录表.pdf', pages: 4, fileSize: '1.28MB', createDate: '2023-05-27' },
  { name: '房建及绿化工程FJLH04标段空调设备及报价表', originalName: 'FJLH04标段空调设备及报价表.pdf', pages: 1, fileSize: '0.25MB', createDate: '2024-05-14' },
  { name: '交叉跨越记录表', originalName: '交叉跨越记录表5.pdf', pages: 1, fileSize: '0.10MB', createDate: '2023-05-27' },
  { name: '竣工报告', originalName: '竣工报告5.pdf', pages: 1, fileSize: '0.18MB', createDate: '2023-05-30' },
  { name: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程', originalName: '导线、地线（OPGW）展放与连接记录.pdf', pages: 1, fileSize: '0.25MB', createDate: '2023-05-28' },
  { name: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程', originalName: '杆塔组立前阶段验收申请表、公司级专检报告.pdf', pages: 5, fileSize: '0.80MB', createDate: '2023-05-17' },
  { name: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程', originalName: '试品/试件试验报告报验表及附件.pdf', pages: 33, fileSize: '4.65MB', createDate: '2023-04-22' },
  { name: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程', originalName: '乙供工程材料构配件设备进场报审表.pdf', pages: 37, fileSize: '11.61MB', createDate: '2023-05-17' },
  { name: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程', originalName: '乙供工程材料构配件设备进场报审表 2.pdf', pages: 10, fileSize: '7.30MB', createDate: '2023-02-09' },
  { name: '柯诸高速公路漓渚互通连接线LK2+259通道桥及LK1+808-LK2+307改路设计', originalName: 'WS:2023-Y-0157.pdf', pages: 10, fileSize: '5.38MB', createDate: '2023-10-19' },
  { name: '耐张管附件安装检验批质量验收记录表', originalName: '耐张管附件安装检验批质量验收记录表.pdf', pages: 4, fileSize: '1.27MB', createDate: '2023-05-28' },
  { name: '试品、试件试验报告报验表及附件（钢筋焊接）', originalName: '试品/试件试验报告报验表及附件.pdf', pages: 5, fileSize: '1.28MB', createDate: '2023-05-17' },
  { name: '试品、试件试验报告报验表及附件（混凝土抗压试块）', originalName: '试品/试件试验报告报验表及附件 2.pdf', pages: 18, fileSize: '11.42MB', createDate: '2023-05-17' },
  { name: '试品、试件试验报告报验表及附件（机械连接）', originalName: '试品/试件试验报告报验表及附件 3.pdf', pages: 3, fileSize: '0.75MB', createDate: '2023-05-17' },
  { name: '投运前阶段验收申请表、公司级专检报告', originalName: '投运前阶段验收申请表、公司级专检报告.pdf', pages: 5, fileSize: '0.89MB', createDate: '2023-05-29' }
]

function buildMockList() {
  const names = [
    ['柯桥至诸暨高速公路工程房建工程FJLH01标段濂湖收费站交通管理用房—4.45...', '1-2 濂湖收费站 交通管理用房—1.2...'],
    ['柯桥至诸暨高速公路房建工程FJLH02标两阶段施工图设计店口管理...', '3-0店口管理中心结构总说明 2.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH02标两阶段施工图设计店口管理...', '3-0店口管理中心结构总说明 3.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH02标两阶段施工图设计店口管理...', '3-0店口管理中心结构总说明 4.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH02标两阶段施工图设计店口管理...', '3-0店口管理中心结构总说明 1.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH03标店口服务东区西区机房 同...', '页面提取自 - 2-3东西区机房修.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电电气...', '4-3 店口南收费站 泵房及变电 ...(ns1...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电电气...', '4-3 店口南收费站 泵房及变电 ...(ns1...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电基础...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电配电...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电图纸...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电屋顶...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电一层...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标大侣收费站泵房及变电一层...', '4-3 店口南收费站 泵房及变电 ...(ns...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电...', '4-3 店口南收费站 泵房变电 6.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电给...', '4-3 2.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电基...', '4-3 店口南收费站 泵房变电 2.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电框...', '4-3 店口南收费站 泵房变电 3.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电目录', '4-3 1.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电目录', '4-3 店口南收费站 泵房及变电 隧施...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电目...', '4-3 店口南收费站 泵房变电 1.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电电...', '4-3 3.pdf'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电通...', '4-3 店口南收费站 泵房及变电 隧施...'],
    ['柯桥至诸暨高速公路房建工程FJLH04标店口南收费站泵房及变电消...', '4-3 店口南收费站 泵房及变电 隐蔽...']
  ]
  const sizes = ['0.26MB', '1.18MB', '1.02MB', '1.27MB', '1.32MB', '0.93MB', '1.13MB', '0.99MB', '1.11MB', '0.74MB', '0.87MB', '0.64MB', '0.65MB', '0.71MB', '0.67MB', '0.88MB', '0.85MB', '0.63MB', '0.54MB', '0.48MB', '0.54MB', '0.59MB', '0.83MB', '0.90MB']
  // 两轮循环拼成 48 条
  const rows = []
  for (let r = 0; r < 2; r++) {
    names.forEach((n, i) => {
      rows.push({
        id: r * names.length + i + 1,
        name: n[0],
        originalName: n[1],
        mainSign: '未签名',
        sealSign: '',
        aiMask: '',
        pages: 1,
        fileSize: sizes[i],
        createDate: '2024-01-01'
      })
    })
  }
  // 图片中的 17 条"已签名"数据
  MOCK_SIGNED_LIST.forEach((n, i) => {
    rows.push({
      id: rows.length + 1,
      name: n.name,
      originalName: n.originalName,
      mainSign: '已签名',
      sealSign: '',
      aiMask: '',
      pages: n.pages,
      fileSize: n.fileSize,
      createDate: n.createDate
    })
  })
  return rows
}

export default {
  name: 'ArchiveTraditionalSign',
  data() {
    return {
      // 左侧树
      categoryKeyword: '',
      categoryTree: MOCK_CATEGORY_TREE,

      // 右侧列表
      keyword: '',
      appliedKeyword: '',
      onlySigned: false,
      list: buildMockList(),
      selection: [],
      page: 1,
      pageSize: 100,
      collectDialogVisible: false,
      collectRow: null,
      signDialogVisible: false,
      affairList: [],
      signFileList: []
    }
  },
  computed: {
    filteredList() {
      let list = this.list
      const kw = this.appliedKeyword.trim()
      if (kw) list = list.filter(x => x.name.includes(kw))
      // 未勾选"已签名"时只展示未签名数据，勾选后只展示已签名数据
      list = list.filter(x => this.onlySigned ? x.mainSign === '已签名' : x.mainSign !== '已签名')
      return list
    },
    pagedList() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredList.slice(start, start + this.pageSize)
    },
    pageStart() {
      return (this.page - 1) * this.pageSize
    },
    /** 主签名：仅当选中数据全部为"未签名"时可操作 */
    canMainSign() {
      return this.selection.length > 0 && this.selection.every(x => x.mainSign !== '已签名')
    }
  },
  methods: {
    // ===== 左侧树 =====
    filterTree() {
      this.$refs.categoryTree.filter(this.categoryKeyword)
    },
    filterNode(value, data) {
      if (!value) return true
      return data.name.includes(value)
    },
    /** 根节点/分组节点用文件夹图标，叶子节点用文档图标 */
    nodeIcon(data) {
      if (data.icon === 'root' || data.children) return 'el-icon-folder text-warning'
      return 'el-icon-document text-primary'
    },

    // ===== 右侧列表 =====
    doSearch() {
      this.appliedKeyword = this.keyword
      this.page = 1
    },
    refresh() {
      this.list = buildMockList()
      this.keyword = ''
      this.appliedKeyword = ''
      this.onlySigned = false
      this.page = 1
      this.$nextTick(() => { this.selection = [] })
      this.$message.success('刷新成功（静态 DEMO）')
    },
    onSelectionChange(selection) {
      this.selection = selection || []
    },
    batchMainSign() {
      this.$message.info(`对 ${this.selection.length} 条记录执行主签名`)
    },
    batchReSign() {
      this.$message.info(`对 ${this.selection.length} 条记录重新签名`)
    },
    viewCollectInfo() {
      const row = this.selection[0]
      if (!row || this.selection.length !== 1) return
      this.collectRow = {
        ...row,
        collectId: '25112621-0621-4804-5AC2-61FF781316C8',
        fileCode: '',
        collector: '张鲁莎',
        collectDate: '2025-11-26 21:06:21',
        fileDirName: '110kV白虹1D40线、白直1600线16#-17#段迁改工程导线展放|紧线、耐张管施工、附件安装检验批验收记录等',
        fileDirPath: '柯桥至诸暨高速公路工程 -> 第三部分 工程管理文件',
        volumeDirName: '柯桥至诸暨高速公路工程110kV白虹1D40线、白直1600线16#-17#段迁改工程立塔架线竣工移交试验报告、铁塔组立、紧固件安装检验批记录；商品混凝土乙供材料、抗压试块试验报告及报验、钢筋乙供材料、机械连接、焊接试验报告及报验；桩基试验报告及报验；导地线展放记录、耐张管施工、附件安装检验批验收记录；杆塔组立、投运前阶段验收申请表、竣工验收报告、监理旁站记录、施工设计进出场验收单',
        volumePath: '柯桥至诸暨高速公路工程 -> 第三部分 工程管理文件 -> 二、征地拆迁合同、协议 -> 柯桥至诸暨高速公路1100-220KV高压电塔涉及广告红线内杆线迁改工程 -> （五）110kV白虹1D40线白直1600线16#-17#段迁改工程'
      }
      this.collectDialogVisible = true
    },
    batchSign() {
      // 按图片展示"电子签章"弹窗（事务目录 + 签名文件）
      this.affairList = [
        { id: 1, name: '施工日志封面', status: '未审核' },
        { id: 2, name: '施工日志封面', status: '未审核' },
        { id: 3, name: '施工管理文件', status: '未审核' }
      ]
      this.signFileList = this.selection.map(x => ({
        id: x.id,
        name: `封面（记录人：${'张亚宾'}）`,
        mainSign: x.mainSign,
        sealSign: x.sealSign
      }))
      this.signDialogVisible = true
    },
    batchSeal() {
      this.selection.forEach(x => { x.sealSign = '已签章' })
      this.$message.success(`已对 ${this.selection.length} 条记录完成公章签章（静态 DEMO 模拟）`)
    },
    /** 弹窗内：刷新事务目录 */
    refreshAffairs() {
      this.$message.success('刷新成功（静态 DEMO）')
    },
    /** 弹窗内：提请审核 */
    submitAudit() {
      this.$message.info('提请审核')
    }
  }
}
</script>

<style lang="scss" scoped>
.traditional-sign-page {
  display: flex;
  gap: 8px;
  height: 100%;
  padding: 8px;
  background: #fff;

  // 左侧树
  .left-panel {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .left-search { padding: 8px; }

    .left-tree-title {
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      background: #f5f7fa;
      border-top: 1px solid #ebeef5;
      border-bottom: 1px solid #ebeef5;
    }

    .left-tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 4px;
    }
  }

  // 右侧列表
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;

      .search-input { width: 180px; }
      .signed-check { margin: 0 0 0 8px; }
    }

    .el-table { flex: 1; }

    .pagination-wrap {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }
  }

  .text-success { color: #67c23a; }
  .text-danger { color: #f56c6c; }
  .text-primary { color: #409eff; }
  .text-warning { color: #e6a23c; }
}
</style>

<style lang="scss">
/* 查看收集信息弹窗（append-to-body 需用全局样式） */
.collect-info-dialog {
  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__header {
    padding: 14px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 14px 20px;
    max-height: 440px;
    overflow-y: auto;
  }

  .collect-info {
    font-size: 13px;
    line-height: 1.9;
    color: #303133;
    word-break: break-all;

    .section {
      margin-top: 10px;
    }

    .indent {
      margin-top: 2px;
    }
  }

  .dialog-footer {
    text-align: right;
  }
}

/* 电子签章弹窗 */
.sign-dialog {
  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__header {
    padding: 14px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 12px 16px;
  }

  .sign-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    margin-bottom: 8px;
    background: #1e88d2;
    border-radius: 2px;

    &.blue {
      background: #2e8fe8;
    }

    .sign-section-title {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
    }

    .sign-section-btns {
      display: flex;
      gap: 6px;
    }

    .el-icon-arrow-down {
      color: #fff;
    }
  }

  .sign-table {
    width: 100%;
  }

  .sign-pagination {
    padding: 8px 0 12px;
  }

  .text-success { color: #67c23a; }
  .text-muted { color: #909399; }

  .dialog-footer {
    text-align: right;
  }
}
</style>
