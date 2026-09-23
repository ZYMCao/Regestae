<template>
  <!-- 添加文件目录弹窗：左侧档案分类目录 + 右侧条件查询与文件列表（静态演示数据） -->
  <el-dialog
    title="添加文件目录"
    :visible.sync="dialogVisible"
    width="92%"
    top="4vh"
    custom-class="file-catalog-dialog"
    append-to-body
  >
    <div class="fcd-body">
      <!-- 左侧：档案分类目录 -->
      <div class="fcd-tree">
        <div class="tree-title">档案分类目录</div>
        <el-tree
          :data="treeData"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          highlight-current
          :props="{ label: 'name', children: 'children' }"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i class="el-icon-folder node-icon" />
            <span class="node-name">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>

      <!-- 右侧：条件查询 + 文件列表 -->
      <div class="fcd-main">
        <div class="expand-bar" @click="expandQuery = !expandQuery">
          <span>{{ expandQuery ? '收起条件查询' : '展开条件查询' }}</span>
          <i :class="expandQuery ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
        <div v-show="expandQuery" class="filter-area">
          <el-form :model="filters" size="small" label-width="90px">
            <el-row>
              <el-col :span="12">
                <el-form-item label="文件题名">
                  <el-input v-model="filters.title" placeholder="请输入文件题名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="档号">
                  <el-input v-model="filters.archiveNo" placeholder="请输入档号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="编制日期">
                  <el-date-picker v-model="filters.createDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="责任者">
                  <el-input v-model="filters.author" placeholder="请输入责任者" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="文号">
                  <el-input v-model="filters.docNo" placeholder="请输入文号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="件号">
                  <el-input v-model="filters.itemNo" placeholder="请输入件号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="保管期限">
                  <el-select v-model="filters.term" placeholder="请选择" style="width: 100%">
                    <el-option label="永久" value="永久" />
                    <el-option label="定期30年" value="定期30年" />
                    <el-option label="定期10年" value="定期10年" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="密级">
                  <el-select v-model="filters.secret" placeholder="请选择" style="width: 100%">
                    <el-option label="公开" value="公开" />
                    <el-option label="内部" value="内部" />
                    <el-option label="秘密" value="秘密" />
                    <el-option label="机密" value="机密" />
                    <el-option label="绝密" value="绝密" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-checkbox v-model="filters.includeChild">包含子节点目录</el-checkbox>
            <el-checkbox v-model="filters.grouped">已组件</el-checkbox>
          </el-form>
        </div>

        <el-table :data="rows" border size="small" height="340" @selection-change="s => (selection = s)">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件题名" prop="title" min-width="220" sortable show-overflow-tooltip />
          <el-table-column label="文件数" prop="fileCount" width="80" align="center" sortable />
          <el-table-column label="档号" prop="archiveNo" width="140" sortable show-overflow-tooltip />
          <el-table-column label="文号" prop="docNo" width="130" sortable show-overflow-tooltip />
          <el-table-column label="互见号" prop="mutualNo" width="130" sortable show-overflow-tooltip />
          <el-table-column label="责任者" prop="author" min-width="160" sortable show-overflow-tooltip />
          <el-table-column label="保管期限" prop="term" width="90" align="center" sortable />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" sortable />
          <el-table-column label="件号" prop="itemNo" width="70" align="center" sortable />
          <el-table-column label="页数" prop="pages" width="70" align="center" sortable />
          <el-table-column label="参考信息" prop="reference" min-width="120" show-overflow-tooltip />
        </el-table>

        <el-pagination
          :current-page.sync="page"
          :page-size.sync="size"
          :page-sizes="[100, 200, 500]"
          :total="total"
          layout="total, prev, pager, next, jumper, sizes"
          class="fcd-pagination"
        />
      </div>
    </div>
    <div slot="footer">
      <el-button size="small" icon="el-icon-search" @click="handleQuery">查询</el-button>
      <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
      <el-button size="small" @click="dialogVisible = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
// 档案分类目录（静态演示）
const TREE_DATA = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    children: [
      { id: 11, name: '第一部分 项目申请文件' },
      { id: 12, name: '第二部分 设计文件' },
      { id: 13, name: '第三部分 工程管理文件' },
      { id: 14, name: '第四部分 施工文件' },
      { id: 15, name: '第五部分 监理文件' },
      { id: 16, name: '第六部分 竣工（交）验收文件' },
      { id: 17, name: '第七部分 科研文件' }
    ]
  }
]

export default {
  name: 'FileCatalogDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      treeData: TREE_DATA,
      currentNode: null,
      expandQuery: true,
      filters: {
        title: '',
        archiveNo: '',
        createDate: '',
        author: '',
        docNo: '',
        itemNo: '',
        term: '',
        secret: '',
        includeChild: false,
        grouped: true
      },
      rows: [],
      selection: [],
      page: 1,
      size: 100,
      total: 0
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        // 每次打开重置查询结果与选择状态
        this.currentNode = null
        this.rows = []
        this.selection = []
        this.page = 1
        this.total = 0
        this.expandQuery = true
      }
    }
  },
  methods: {
    handleNodeClick(data) {
      this.currentNode = data
    },
    // 生成演示文件数据（以当前选中分类为题名前缀）
    buildDemoRows() {
      const nodeName = this.currentNode ? this.currentNode.name : '柯桥至诸暨高速公路工程'
      const rows = []
      for (let i = 1; i <= 8; i++) {
        const term = i % 3 === 0 ? '定期10年' : i % 3 === 1 ? '定期30年' : '永久'
        rows.push({
          id: i,
          title: nodeName + '文件' + i + '',
          fileCount: 1,
          archiveNo: 'KZGS-W-' + (2000 + i * 5),
          docNo: '绍市柯诸〔2025〕' + i + '号',
          mutualNo: 'JJ-' + (300 + i),
          author: '绍兴市柯诸高速公路有限公司',
          term: term,
          createDate: '2025-0' + ((i % 9) + 1) + '-20',
          itemNo: i,
          pages: 5 + i,
          reference: ''
        })
      }
      return rows
    },
    handleQuery() {
      const f = this.filters
      let rows = this.buildDemoRows()
      if (f.title) rows = rows.filter(r => r.title.includes(f.title))
      if (f.archiveNo) rows = rows.filter(r => String(r.archiveNo).includes(f.archiveNo))
      if (f.author) rows = rows.filter(r => r.author.includes(f.author))
      if (f.docNo) rows = rows.filter(r => r.docNo.includes(f.docNo))
      if (f.itemNo) rows = rows.filter(r => String(r.itemNo).includes(f.itemNo))
      if (f.term) rows = rows.filter(r => r.term === f.term)
      if (f.secret) rows = rows.filter(r => r.secret === f.secret)
      this.rows = rows
      this.total = rows.length
      this.page = 1
      this.$message.success('查询完成（演示数据）')
    },
    handleConfirm() {
      if (!this.selection.length) {
        this.$message.warning('请先勾选文件目录')
        return
      }
      this.$emit('confirm', this.selection)
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss">
/* 弹窗为 append-to-body，需要全局样式 */
.file-catalog-dialog {
  .el-dialog__body {
    padding: 12px 16px;
  }

  .fcd-body {
    display: flex;
    gap: 12px;
    min-height: 520px;
  }

  .fcd-tree {
    width: 240px;
    flex-shrink: 0;
    border: 1px solid #ebeef5;
    border-radius: 2px;
    overflow: auto;

    .tree-title {
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
    }

    .tree-node {
      display: inline-flex;
      align-items: center;
      font-size: 13px;
      overflow: hidden;

      .node-icon {
        color: #e6a23c;
        margin-right: 4px;
      }

      .node-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .fcd-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .expand-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 13px;
    color: #fff;
    background: $themeColor;
    border-radius: 2px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .filter-area {
    padding: 4px 12px 0;
    border: 1px solid #ebeef5;
    border-radius: 2px;
    margin-bottom: 10px;

    .el-checkbox {
      margin: 0 12px 10px 0;
    }
  }

  .fcd-pagination {
    margin: 8px 0 4px;
    text-align: left;
  }
}
</style>
