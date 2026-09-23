<template>
  <!-- 添加文件弹窗：左侧档案分类目录 + 右侧条件查询与电子文件列表（静态演示数据） -->
  <el-dialog
    title="添加文件"
    :visible.sync="dialogVisible"
    width="92%"
    top="4vh"
    custom-class="add-file-dialog"
    append-to-body
  >
    <div class="afd-body">
      <!-- 左侧：档案分类目录 -->
      <div class="afd-tree">
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
      <div class="afd-main">
        <div class="expand-bar" @click="expandQuery = !expandQuery">
          <span>{{ expandQuery ? '收起条件查询' : '展开条件查询' }}</span>
          <i :class="expandQuery ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
        <div v-show="expandQuery" class="filter-area">
          <el-form :model="filters" size="small" label-width="90px">
            <el-row>
              <el-col :span="12">
                <el-form-item label="文件名称">
                  <el-input v-model="filters.name" placeholder="请输入文件名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文件编号">
                  <el-input v-model="filters.fileNo" placeholder="请输入文件编号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="档案类型">
                  <el-select v-model="filters.archiveType" placeholder="请选择" style="width: 100%">
                    <el-option label="文书档案" value="文书档案" />
                    <el-option label="科技档案" value="科技档案" />
                    <el-option label="会计档案" value="会计档案" />
                    <el-option label="照片档案" value="照片档案" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="新增人">
                  <el-input v-model="filters.creator" placeholder="请输入新增人" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-checkbox v-model="filters.includeChild">包含子节点目录</el-checkbox>
          </el-form>
        </div>

        <el-table :data="rows" border size="small" height="340" @selection-change="s => (selection = s)">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="档号" prop="archiveNo" width="140" sortable show-overflow-tooltip />
          <el-table-column label="文件编号" prop="fileNo" width="130" sortable show-overflow-tooltip />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" sortable />
          <el-table-column label="页数" prop="pages" width="70" align="center" sortable />
          <el-table-column label="排序" prop="order" width="70" align="center" sortable />
          <el-table-column label="文件名称" prop="name" min-width="220" sortable show-overflow-tooltip />
          <el-table-column label="档案类型" prop="archiveType" width="100" align="center" sortable />
          <el-table-column label="文件状态" prop="status" width="90" align="center" sortable />
          <el-table-column label="计算机文件名" prop="pcName" min-width="150" sortable show-overflow-tooltip />
          <el-table-column label="格式信息" prop="format" width="90" align="center" />
          <el-table-column label="开放范围" prop="openScope" width="90" align="center" />
        </el-table>

        <el-pagination
          :current-page.sync="page"
          :page-size.sync="size"
          :page-sizes="[100, 200, 500]"
          :total="total"
          layout="total, prev, pager, next, jumper, sizes"
          class="afd-pagination"
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
  name: 'AddFileDialog',
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
        name: '',
        fileNo: '',
        archiveType: '',
        creator: '',
        includeChild: false
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
    // 生成演示电子文件数据（以当前选中分类为名称前缀）
    buildDemoRows() {
      const nodeName = this.currentNode ? this.currentNode.name : '柯桥至诸暨高速公路工程'
      const rows = []
      for (let i = 1; i <= 8; i++) {
        rows.push({
          id: i,
          archiveNo: 'KZGS-DZ-' + (4000 + i * 3),
          fileNo: 'WJ-2026-' + String(i).padStart(4, '0'),
          createDate: '2026-0' + ((i % 9) + 1) + '-05',
          pages: 3 + i,
          order: i,
          name: nodeName + '电子文件' + i + '',
          archiveType: '科技档案',
          status: '正常',
          pcName: 'document_' + (20260 + i) + '.pdf',
          format: 'PDF',
          openScope: '内部'
        })
      }
      return rows
    },
    handleQuery() {
      const f = this.filters
      let rows = this.buildDemoRows()
      if (f.name) rows = rows.filter(r => r.name.includes(f.name))
      if (f.fileNo) rows = rows.filter(r => String(r.fileNo).includes(f.fileNo))
      if (f.archiveType) rows = rows.filter(r => r.archiveType === f.archiveType)
      if (f.creator) rows = rows.filter(r => r.creator && r.creator.includes(f.creator))
      this.rows = rows
      this.total = rows.length
      this.page = 1
      this.$message.success('查询完成（演示数据）')
    },
    handleConfirm() {
      if (!this.selection.length) {
        this.$message.warning('请先勾选文件')
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
.add-file-dialog {
  .el-dialog__body {
    padding: 12px 16px;
  }

  .afd-body {
    display: flex;
    gap: 12px;
    min-height: 520px;
  }

  .afd-tree {
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

  .afd-main {
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

  .afd-pagination {
    margin: 8px 0 4px;
    text-align: left;
  }
}
</style>
