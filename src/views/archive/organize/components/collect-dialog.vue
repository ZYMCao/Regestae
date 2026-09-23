<template>
  <!--
    收集弹窗：左侧工程项目树 + 检索表单，右侧文件列表
    标题由父组件传入（如"收集监理月报"），纯静态 DEMO
  -->
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="1000px"
    custom-class="collect-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="collect-body">
      <!-- 左侧：工程项目树 + 检索 -->
      <div class="left-panel">
        <div class="tree-header">工程项目</div>
        <div class="tree-wrap">
          <el-tree
            :data="treeData"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :expand-on-click-node="false"
            highlight-current
            default-expand-all
            @node-click="onNodeClick"
          />
        </div>
        <div class="search-form">
          <div class="form-row"><span class="form-label">标题</span><el-input v-model="query.title" size="small" /></div>
          <div class="form-row"><span class="form-label">文件题名</span><el-input v-model="query.fileTitle" size="small" /></div>
          <div class="form-row"><span class="form-label">文件号</span><el-input v-model="query.fileNo" size="small" /></div>
          <div class="form-row"><span class="form-label">关键字</span><el-input v-model="query.keyword" size="small" /></div>
          <div class="form-row"><span class="form-label">上传用户</span><el-input v-model="query.uploader" size="small" /></div>
          <div class="form-btns">
            <el-button size="small" type="primary" plain @click="doSearch">搜索</el-button>
            <el-button size="small" type="primary" @click="resetSearch">重置</el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：文件列表 -->
      <div class="right-panel">
        <el-table
          :data="pagedList"
          border
          size="small"
          height="100%"
          empty-text="暂无数据"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">{{ pageStart + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件题名" prop="fileTitle" min-width="200" align="center" show-overflow-tooltip />
          <el-table-column label="文件号" prop="fileNo" min-width="140" align="center" show-overflow-tooltip />
          <el-table-column label="扩展名" prop="ext" width="90" align="center" />
          <el-table-column label="密级" prop="secretLevel" width="80" align="center" />
          <el-table-column label="页数" prop="pages" width="70" align="center" />
          <el-table-column label="上传用户" prop="uploader" width="110" align="center" />
          <el-table-column label="新档案号" prop="newArchiveNo" width="120" align="center" />
        </el-table>

        <div class="pagination-wrap">
          <span class="total-text">共 {{ filteredList.length }} 条</span>
          <el-pagination
            background
            small
            layout="prev, pager, next"
            :total="filteredList.length"
            :current-page.sync="page"
            :page-size="pageSize"
          />
          <span class="goto-text">前往</span>
          <el-input v-model.number="gotoPage" size="mini" class="goto-input" @keyup.enter.native="jumpPage" />
          <span class="goto-text">页</span>
          <el-select v-model="pageSize" size="mini" class="page-size-select">
            <el-option label="10条/页" :value="10" />
            <el-option label="50条/页" :value="50" />
            <el-option label="100条/页" :value="100" />
          </el-select>
        </div>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" size="small" @click="confirm">确定</el-button>
      <el-button size="small" @click="visible = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
/** 工程项目树 mock */
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程',
    children: [
      { id: 11, name: '柯桥至诸暨高速公路工程第TJ01标段', children: [{ id: 111, name: '路基工程' }, { id: 112, name: '桥梁工程' }] },
      { id: 12, name: '柯桥至诸暨高速公路工程第TJ02标段', children: [{ id: 121, name: '路基工程' }] },
      { id: 13, name: '柯桥至诸暨高速公路工程第TJ03标段', children: [{ id: 131, name: '路面工程' }] },
      { id: 14, name: '柯桥至诸暨高速公路工程第TJ05标段', children: [{ id: 141, name: '隧道工程' }] },
      { id: 15, name: '柯桥至诸暨高速公路房建及附属设施工程', children: [{ id: 151, name: '房建工程' }] }
    ]
  }
]

/** 文件列表 mock（选中树节点后展示） */
const MOCK_FILES = [
  { id: 1, fileTitle: '监理月报2024年10月', fileNo: 'JLYB-2024-10', ext: 'pdf', secretLevel: '内部', pages: 32, uploader: '张监理', newArchiveNo: '' },
  { id: 2, fileTitle: '监理月报2024年11月', fileNo: 'JLYB-2024-11', ext: 'pdf', secretLevel: '内部', pages: 28, uploader: '张监理', newArchiveNo: '' },
  { id: 3, fileTitle: '监理月报2024年12月', fileNo: 'JLYB-2024-12', ext: 'docx', secretLevel: '内部', pages: 30, uploader: '李监理', newArchiveNo: '' },
  { id: 4, fileTitle: '旁站记录汇总表', fileNo: 'PZ-2024-01', ext: 'xlsx', secretLevel: '公开', pages: 12, uploader: '王监理', newArchiveNo: '' },
  { id: 5, fileTitle: '隐蔽工程验收记录', fileNo: 'YB-2024-08', ext: 'pdf', secretLevel: '内部', pages: 45, uploader: '张监理', newArchiveNo: '' }
]

export default {
  name: 'CollectDialog',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '收集' }
  },
  data() {
    return {
      treeData: TREE_DATA,
      currentNode: null,
      query: { title: '', fileTitle: '', fileNo: '', keyword: '', uploader: '' },
      appliedQuery: { title: '', fileTitle: '', fileNo: '', keyword: '', uploader: '' },
      list: [],
      selection: [],
      page: 1,
      pageSize: 100,
      gotoPage: 1
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
    filteredList() {
      let list = this.list
      const q = this.appliedQuery
      if (q.fileTitle) list = list.filter(x => x.fileTitle.includes(q.fileTitle))
      if (q.fileNo) list = list.filter(x => x.fileNo.includes(q.fileNo))
      if (q.keyword) list = list.filter(x => x.fileTitle.includes(q.keyword))
      if (q.uploader) list = list.filter(x => x.uploader.includes(q.uploader))
      return list
    },
    pagedList() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredList.slice(start, start + this.pageSize)
    },
    pageStart() {
      return (this.page - 1) * this.pageSize
    }
  },
  watch: {
    /** 弹窗每次打开重置查询与选择 */
    visible(v) {
      if (v) this.resetSearch()
    }
  },
  methods: {
    onNodeClick(node) {
      this.currentNode = node
      // 纯 mock：选中任意节点给示例数据
      this.list = JSON.parse(JSON.stringify(MOCK_FILES))
      this.page = 1
    },
    onSelectionChange(selection) {
      this.selection = selection || []
    },
    doSearch() {
      this.appliedQuery = { ...this.query }
      this.page = 1
    },
    resetSearch() {
      this.query = { title: '', fileTitle: '', fileNo: '', keyword: '', uploader: '' }
      this.appliedQuery = { ...this.query }
      this.list = []
      this.currentNode = null
      this.selection = []
      this.page = 1
      this.gotoPage = 1
    },
    jumpPage() {
      const total = Math.max(1, Math.ceil(this.filteredList.length / this.pageSize))
      this.page = Math.min(Math.max(1, this.gotoPage || 1), total)
    },
    confirm() {
      if (!this.selection.length) {
        this.$message.warning('请先选择文件')
        return
      }
      this.$emit('confirm', { title: this.title, files: this.selection })
      this.visible = false
    }
  }
}
</script>

<style lang="scss">
/* 收集弹窗（append-to-body 需用全局样式） */
.collect-dialog {
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

  .collect-body {
    display: flex;
    gap: 10px;
    height: 430px;
  }

  .left-panel {
    width: 230px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .tree-header {
      padding: 7px 10px;
      background: #e8f3fd;
      font-size: 13px;
      font-weight: 600;
      color: #303133;
    }

    .tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 6px;
      border-bottom: 1px solid #ebeef5;

      .el-tree-node__content { height: 28px; }
      .el-tree-node__label { font-size: 13px; }
    }

    .search-form {
      padding: 10px 10px 12px;

      .form-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .form-label {
          width: 56px;
          flex-shrink: 0;
          font-size: 13px;
          color: #606266;
          text-align: justify;
          text-align-last: justify;
        }

        .el-input { flex: 1; }
      }

      .form-btns {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  }

  .right-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .el-table { flex: 1; }

    .pagination-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0 2px;

      .total-text { font-size: 13px; color: #606266; }
      .goto-text { font-size: 13px; color: #606266; }
      .goto-input { width: 44px; }
      .page-size-select { width: 96px; }
    }
  }

  .dialog-footer { text-align: right; }
}
</style>
