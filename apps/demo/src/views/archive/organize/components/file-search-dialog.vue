<template>
  <!--
    文件搜索弹窗：在当前选中分类节点及其子节点下检索文件
    左侧搜索表单（标签在上）+ 右侧上下两块结果表格（卷内目录 / 文件），纯静态 DEMO
  -->
  <el-dialog
    :title="searchTitle"
    :visible.sync="dialogVisible"
    width="1200px"
    top="4vh"
    custom-class="file-search-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="fs-body">
      <!-- 左侧：搜索表单 -->
      <div class="fs-form">
        <div class="form-item">
          <div class="form-label">文件题名</div>
          <el-input v-model="query.title" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">责任者</div>
          <el-input v-model="query.author" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">档号</div>
          <el-input v-model="query.archiveNo" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">文号</div>
          <el-input v-model="query.docNo" size="small" />
        </div>
        <el-checkbox v-model="includeChildren" class="include-children">包含子节点目录</el-checkbox>
        <div class="form-btns">
          <el-button size="small" type="primary" @click="doSearch">搜索</el-button>
          <el-button size="small" type="primary" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 右侧：搜索结果（上下两块） -->
      <div class="fs-result">
        <!-- 卷内目录 -->
        <div class="block-panel">
          <div class="block-title">卷内目录</div>
          <el-table
            :data="inRollPaged"
            border
            size="small"
            height="calc(100% - 80px)"
            empty-text="暂无数据"
            @selection-change="rows => (inRollSelection = rows || [])"
          >
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column label="序号" width="55" align="center">
              <template slot-scope="scope">{{ inRollPageStart + scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="所在分类节点路径" prop="path" min-width="200" show-overflow-tooltip />
            <el-table-column label="文件题名" prop="title" min-width="240" show-overflow-tooltip sortable />
            <el-table-column label="文号" prop="docNo" width="120" align="center" sortable />
            <el-table-column label="责任者" prop="author" width="150" show-overflow-tooltip sortable />
            <el-table-column label="编制日期" prop="sDate" width="100" align="center" sortable />
            <el-table-column label="考证日期" prop="verifyDate" width="100" align="center" />
            <el-table-column label="文件数" prop="fileCount" width="70" align="center" sortable />
            <el-table-column label="页数" prop="pages" width="70" align="center" sortable />
          </el-table>
          <div class="pagination-wrap">
            <span class="total-text">共 {{ inRollList.length }} 条</span>
            <el-pagination
              background
              small
              layout="prev, pager, next"
              :total="inRollList.length"
              :current-page.sync="inRollPage"
              :page-size="inRollPageSize"
            />
            <span class="goto-text">前往</span>
            <el-input v-model.number="inRollGoto" size="mini" class="goto-input" @keyup.enter.native="jumpInRoll" />
            <span class="goto-text">页</span>
            <el-select v-model="inRollPageSize" size="mini" class="page-size-select">
              <el-option label="100条/页" :value="100" />
              <el-option label="200条/页" :value="200" />
              <el-option label="500条/页" :value="500" />
            </el-select>
          </div>
        </div>

        <!-- 文件 -->
        <div class="block-panel">
          <div class="block-title">文件</div>
          <el-table
            :data="filePaged"
            border
            size="small"
            height="calc(100% - 80px)"
            empty-text="暂无数据"
            @selection-change="rows => (fileSelection = rows || [])"
          >
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column label="序号" width="55" align="center">
              <template slot-scope="scope">{{ filePageStart + scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="文件名称" prop="name" min-width="220" show-overflow-tooltip sortable />
            <el-table-column label="文件编号" prop="fileNo" width="110" align="center" sortable />
            <el-table-column label="编制日期" prop="sDate" width="95" align="center" sortable />
            <el-table-column label="考证日期" prop="verifyDate" width="95" align="center" />
            <el-table-column label="页数" prop="pages" width="65" align="center" sortable />
            <el-table-column label="排序" prop="order" width="65" align="center" sortable />
            <el-table-column label="档案类型" prop="archiveType" width="90" align="center" sortable />
            <el-table-column label="文件状态" prop="status" width="90" align="center" sortable />
            <el-table-column label="格式信息" prop="format" width="90" align="center" show-overflow-tooltip />
            <el-table-column label="计算机" prop="computer" width="90" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="70" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="onView(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <span class="total-text">共 {{ fileList.length }} 条</span>
            <el-pagination
              background
              small
              layout="prev, pager, next"
              :total="fileList.length"
              :current-page.sync="filePage"
              :page-size="filePageSize"
            />
            <span class="goto-text">前往</span>
            <el-input v-model.number="fileGoto" size="mini" class="goto-input" @keyup.enter.native="jumpFile" />
            <span class="goto-text">页</span>
            <el-select v-model="filePageSize" size="mini" class="page-size-select">
              <el-option label="100条/页" :value="100" />
              <el-option label="200条/页" :value="200" />
              <el-option label="500条/页" :value="500" />
            </el-select>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
/** 卷内目录搜索结果 mock 池 */
const IN_ROLL_POOL = [
  { id: 1, path: '柯桥至诸暨高速公路工程/第一部分 项目申报文件', title: '关于柯桥至诸暨高速公路工程可行性研究报告的批复', docNo: '浙发改函〔2020〕56号', author: '浙江省发展和改革委员会', sDate: '2020-05-31', verifyDate: '2020-06-10', fileCount: 3, pages: 24 },
  { id: 2, path: '柯桥至诸暨高速公路工程/第一部分 项目申报文件', title: '柯桥至诸暨高速公路工程用地预审意见', docNo: '浙自然资预〔2020〕78号', author: '浙江省自然资源厅', sDate: '2020-06-18', verifyDate: '2020-06-25', fileCount: 2, pages: 16 },
  { id: 3, path: '柯桥至诸暨高速公路工程/第二部分 设计文件', title: '柯桥至诸暨高速公路工程初步设计的批复', docNo: '浙发改设计〔2021〕12号', author: '浙江省发展和改革委员会', sDate: '2021-03-15', verifyDate: '2021-03-22', fileCount: 1, pages: 35 }
]

/** 文件搜索结果 mock 池 */
const FILE_RESULT_POOL = [
  { id: 1, name: '工程可行性研究报告批复.pdf', fileNo: 'KZGS-WJ-0001', sDate: '2020-05-31', verifyDate: '2020-06-10', pages: 12, order: 1, archiveType: '文书档案', status: '已归档', format: 'PDF', computer: 'ARCHIVE-01' },
  { id: 2, name: '用地预审意见书.pdf', fileNo: 'KZGS-WJ-0002', sDate: '2020-06-18', verifyDate: '2020-06-25', pages: 8, order: 2, archiveType: '文书档案', status: '已归档', format: 'PDF', computer: 'ARCHIVE-01' },
  { id: 3, name: '初步设计批复文件.docx', fileNo: 'KZGS-WJ-0003', sDate: '2021-03-15', verifyDate: '2021-03-22', pages: 15, order: 3, archiveType: '科技档案', status: '待整理', format: 'DOCX', computer: 'ARCHIVE-02' },
  { id: 4, name: '施工图设计审查意见扫描件.pdf', fileNo: 'KZGS-WJ-0004', sDate: '2021-06-02', verifyDate: '2021-06-09', pages: 26, order: 4, archiveType: '科技档案', status: '已归档', format: 'PDF', computer: 'ARCHIVE-02' },
  { id: 5, name: '环评批复及验收材料.pdf', fileNo: 'KZGS-WJ-0005', sDate: '2021-08-20', verifyDate: '2021-08-27', pages: 18, order: 5, archiveType: '科技档案', status: '已归档', format: 'PDF', computer: 'ARCHIVE-03' }
]

export default {
  name: 'FileSearchDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** 当前选中的分类节点名（用于标题） */
    nodeName: { type: String, default: '' }
  },
  data() {
    return {
      query: { title: '', author: '', archiveNo: '', docNo: '' },
      appliedQuery: { title: '', author: '', archiveNo: '', docNo: '' },
      includeChildren: true,
      inRollList: [],
      inRollSelection: [],
      inRollPage: 1,
      inRollPageSize: 100,
      inRollGoto: 1,
      fileList: [],
      fileSelection: [],
      filePage: 1,
      filePageSize: 100,
      fileGoto: 1
    }
  },
  computed: {
    /** visible 是 prop，不能直接被 .sync 改写；用 computed 中转，关闭时同步回父组件 */
    dialogVisible: {
      get() {
        return this.visible
      },
      set(v) {
        this.$emit('update:visible', v)
      }
    },
    searchTitle() {
      const name = this.nodeName || '柯桥至诸暨高速公路工程'
      return `在【${name}】及其子节点下进行文件搜索`
    },
    inRollFiltered() {
      return this.applyFilter(this.inRollList)
    },
    inRollPaged() {
      const start = (this.inRollPage - 1) * this.inRollPageSize
      return this.inRollFiltered.slice(start, start + this.inRollPageSize)
    },
    inRollPageStart() {
      return (this.inRollPage - 1) * this.inRollPageSize
    },
    fileFiltered() {
      return this.applyFilter(this.fileList)
    },
    filePaged() {
      const start = (this.filePage - 1) * this.filePageSize
      return this.fileFiltered.slice(start, start + this.filePageSize)
    },
    filePageStart() {
      return (this.filePage - 1) * this.filePageSize
    }
  },
  watch: {
    /** 弹窗每次打开重置查询与结果 */
    visible(v) {
      if (v) this.resetSearch()
    }
  },
  methods: {
    /** 按表单关键字过滤（mock 数据按 title/docNo 模糊匹配，档号/文号/责任者同理） */
    applyFilter(list) {
      const q = this.appliedQuery
      let l = list
      if (q.title) l = l.filter(x => (x.title || x.name || '').includes(q.title))
      if (q.author) l = l.filter(x => (x.author || '').includes(q.author))
      if (q.archiveNo) l = l.filter(x => (x.archiveNo || x.fileNo || '').includes(q.archiveNo))
      if (q.docNo) l = l.filter(x => (x.docNo || x.fileNo || '').includes(q.docNo))
      return l
    },
    doSearch() {
      this.appliedQuery = { ...this.query }
      // 纯 mock：首次搜索载入结果池
      if (!this.inRollList.length) this.inRollList = JSON.parse(JSON.stringify(IN_ROLL_POOL))
      if (!this.fileList.length) this.fileList = JSON.parse(JSON.stringify(FILE_RESULT_POOL))
      this.inRollPage = 1
      this.filePage = 1
    },
    resetSearch() {
      this.query = { title: '', author: '', archiveNo: '', docNo: '' }
      this.appliedQuery = { ...this.query }
      this.includeChildren = true
      this.inRollList = []
      this.inRollSelection = []
      this.inRollPage = 1
      this.inRollGoto = 1
      this.fileList = []
      this.fileSelection = []
      this.filePage = 1
      this.fileGoto = 1
    },
    jumpInRoll() {
      const total = Math.max(1, Math.ceil(this.inRollFiltered.length / this.inRollPageSize))
      this.inRollPage = Math.min(Math.max(1, this.inRollGoto || 1), total)
    },
    jumpFile() {
      const total = Math.max(1, Math.ceil(this.fileFiltered.length / this.filePageSize))
      this.filePage = Math.min(Math.max(1, this.fileGoto || 1), total)
    },
    onView(row) {
      this.$message.info(`查看文件：${row.name}`)
    }
  }
}
</script>

<style lang="scss">
/* 文件搜索弹窗（append-to-body 需用全局样式） */
.file-search-dialog {
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
    padding: 10px 14px;
  }

  .fs-body {
    display: flex;
    gap: 10px;
    height: 560px;
  }

  .fs-form {
    width: 210px;
    flex-shrink: 0;
    padding: 4px 6px 4px 2px;

    .form-item {
      margin-bottom: 10px;
    }

    .form-label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }

    .w100 { width: 100%; }

    .include-children {
      display: block;
      margin: 14px 0 0;
      font-size: 13px;
      color: #409eff;
    }

    .form-btns {
      margin-top: 18px;

      .el-button + .el-button { margin-left: 10px; }
    }
  }

  .fs-result {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }

  .block-panel {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
    flex: 1;

    .block-title {
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      color: #fff;
      background: #1a7ef0;
    }
  }

  .pagination-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid #ebeef5;
    background: #fafbfc;

    .total-text { font-size: 13px; color: #606266; }
    .goto-text { font-size: 13px; color: #606266; }
    .goto-input { width: 44px; }
    .page-size-select { width: 100px; }
  }
}
</style>
