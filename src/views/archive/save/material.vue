<template>
  <!-- 资料库管理：左分类树 + 右案卷/文件目录（静态演示数据，不请求接口） -->
  <div class="material-page">
    <!-- 左侧：档案分类目录 -->
    <div class="left-panel">
      <div class="search-row">
        <el-input
          v-model="treeKeyword"
          placeholder="搜索分类"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        />
        <el-button class="search-btn" size="small" icon="el-icon-search" @click="filterTree" />
      </div>
      <div class="mode-tabs">
        <div :class="['mode-tab', manageMode === 'roll' && 'active']" @click="switchMode('roll')">按卷管理分类</div>
        <div :class="['mode-tab', manageMode === 'file' && 'active']" @click="switchMode('file')">按件管理分类</div>
      </div>
      <div class="tree-title">档案分类目录</div>
      <div class="left-tree-wrap">
        <div v-if="treeLoading" class="tree-loading">
          <i class="el-icon-loading" />
          <span>正在加载数据...</span>
        </div>
        <el-tree
          v-show="!treeLoading"
          ref="categoryTree"
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :default-expanded-keys="[1, 11]"
          highlight-current
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i v-if="data.children && data.children.length" class="tree-icon folder el-icon-folder-opened" />
            <i v-else class="tree-icon leaf el-icon-document" />
            <span class="tree-label">{{ data.name }}</span>
            <span v-if="data.fileCount !== undefined" class="tree-count">({{ data.rollCount || 0 }}/{{ data.fileCount }})</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧：目录区 -->
    <div class="right-panel">
      <!-- 按卷管理：案卷目录 -->
      <template v-if="manageMode === 'roll'">
        <div class="list-header">
          <span class="header-title">案卷目录</span>
          <div class="header-btns">
            <adaptive-actions :items="rollActions" size="mini" @click="onHeaderAction" />
          </div>
        </div>
        <div class="table-wrap">
          <el-table :data="rolls" border stripe height="100%" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column label="档号" prop="archiveNo" sortable width="140" align="center" />
            <el-table-column label="案卷题名" prop="title" sortable min-width="300" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <a class="title-link" @click="handleDetailRow(row)">{{ row.title }}</a>
              </template>
            </el-table-column>
            <el-table-column label="编制单位" prop="orgName" min-width="220" show-overflow-tooltip />
            <el-table-column label="编制起止日期" width="200" align="center">
              <template slot-scope="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
            </el-table-column>
            <el-table-column label="组卷情况" prop="rollStatus" width="100" align="center">
              <template slot-scope="{ row }">
                <span class="status-ok">{{ row.rollStatus }}</span>
              </template>
            </el-table-column>
            <el-table-column label="保管期限" prop="period" width="90" align="center" />
          </el-table>
        </div>
        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="rolls.length"
            :current-page.sync="pageNum"
            :page-size.sync="pageSize"
            :page-sizes="[10, 20, 50, 100]"
          />
        </div>
      </template>

      <!-- 按件管理：文件目录 + 文件表 -->
      <template v-else>
        <div class="list-header">
          <span class="header-title">文件目录</span>
          <div class="header-btns">
            <adaptive-actions :items="fileActions" size="mini" @click="onHeaderAction" />
          </div>
        </div>
        <div class="table-wrap file-table-top">
          <el-table :data="files" border stripe height="100%" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column label="档号" prop="archiveNo" sortable width="140" align="center" />
            <el-table-column label="文件题名" prop="title" sortable min-width="300" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <a class="title-link" @click="handleDetailRow(row)">{{ row.title }}</a>
              </template>
            </el-table-column>
            <el-table-column label="责任者" prop="author" width="180" show-overflow-tooltip />
            <el-table-column label="日期" prop="fileDate" width="110" align="center" />
            <el-table-column label="盒号" prop="boxNo" width="80" align="center" />
          </el-table>
        </div>
        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="files.length"
            :current-page.sync="pageNum"
            :page-size.sync="pageSize"
            :page-sizes="[10, 20, 50, 100]"
          />
        </div>

        <div class="list-header file-header">
          <span class="header-title">文件</span>
          <div class="header-btns">
            <adaptive-actions :items="fileBottomActions" size="mini" @click="onHeaderAction" />
          </div>
        </div>
        <div class="table-wrap file-table-bottom">
          <el-table :data="files" border stripe height="100%">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column label="档号" prop="archiveNo" width="140" align="center" />
            <el-table-column label="文件题名" prop="title" min-width="300" show-overflow-tooltip />
            <el-table-column label="责任者" prop="author" width="180" show-overflow-tooltip />
            <el-table-column label="日期" prop="fileDate" width="110" align="center" />
          </el-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions/index.vue'

// 档案分类树（静态演示数据，与档案库管理一致）
const TREE_DATA = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    rollCount: 0,
    fileCount: 15432,
    children: [
      {
        id: 11,
        name: '第一部分 项目申报文件',
        rollCount: 0,
        fileCount: 28,
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件' },
          { id: 112, name: '二、可行性研究报告及批复文件' },
          { id: 113, name: '三、环境影响报告及批复文件' },
          { id: 114, name: '四、水土保持方案报告及批复文件' },
          { id: 115, name: '五、项目咨询、评估、论证文件' },
          { id: 116, name: '六、投资、特许经营协议文件' },
          { id: 117, name: '七、工程融资贷款计划、资金管理文件' }
        ]
      },
      {
        id: 12,
        name: '第二部分 设计文件',
        rollCount: 0,
        fileCount: 112,
        children: [
          { id: 121, name: '一、初步设计文件' },
          { id: 122, name: '二、施工图设计文件' }
        ]
      },
      {
        id: 13,
        name: '第三部分 工程管理文件',
        rollCount: 0,
        fileCount: 590,
        children: [
          { id: 131, name: '一、征地拆迁文件' },
          { id: 132, name: '二、建设管理文件' }
        ]
      },
      {
        id: 14,
        name: '第四部分 竣工文件',
        rollCount: 0,
        fileCount: 11500,
        children: [
          { id: 141, name: '一、路基竣工图' },
          { id: 142, name: '二、路面竣工图' }
        ]
      },
      {
        id: 15,
        name: '第五部分 监理文件',
        rollCount: 0,
        fileCount: 2828,
        children: [
          { id: 151, name: '一、监理管理文件' },
          { id: 152, name: '二、监理日志' }
        ]
      },
      {
        id: 16,
        name: '第六部分 竣工（交）工验收文件',
        rollCount: 0,
        fileCount: 866,
        children: [
          { id: 161, name: '一、交工验收文件' },
          { id: 162, name: '二、竣工验收文件' }
        ]
      },
      {
        id: 17,
        name: '第七部分 科研文件',
        rollCount: 0,
        fileCount: 6,
        children: [
          { id: 171, name: '一、科研课题文件' }
        ]
      }
    ]
  }
]

// 案卷目录（静态演示数据）
const ROLL_LIST = [
  {
    id: 1,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0001',
    title: '柯桥至诸暨高速公路工程项目建议书及批复、项目申请有关文件',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2020-05-18',
    endDate: '2021-05-11',
    rollStatus: '组卷成功',
    period: '永久'
  },
  {
    id: 2,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0002',
    title: '柯桥至诸暨高速公路工程项目申请报告及批复文件',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2021-10-01',
    endDate: '2021-11-26',
    rollStatus: '组卷成功',
    period: '永久'
  },
  {
    id: 3,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0003',
    title: '柯桥至诸暨高速公路工程项目申请报告（附图）',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2021-10-01',
    endDate: '2021-10-01',
    rollStatus: '组卷成功',
    period: '永久'
  }
]

// 文件目录（静态演示数据）
const FILE_LIST = [
  {
    id: 1,
    categoryId: 111,
    archiveNo: 'KZGS-W-0001',
    title: '关于柯桥至诸暨高速公路工程可行性研究报告的批复',
    author: '浙江省发展和改革委员会',
    fileDate: '2020-06-12',
    boxNo: ''
  },
  {
    id: 2,
    categoryId: 111,
    archiveNo: 'KZGS-W-0002',
    title: '柯桥至诸暨高速公路工程初步设计的批复',
    author: '浙江省交通运输厅',
    fileDate: '2020-09-03',
    boxNo: ''
  },
  {
    id: 3,
    categoryId: 111,
    archiveNo: 'KZGS-W-0003',
    title: '关于成立柯桥至诸暨高速公路工程建设指挥部的通知',
    author: '绍兴市人民政府',
    fileDate: '2020-10-21',
    boxNo: ''
  }
]

export default {
  name: 'ArchiveMaterial',
  components: { AdaptiveActions },
  data() {
    return {
      manageMode: 'roll', // roll-按卷管理分类 / file-按件管理分类
      treeKeyword: '',
      treeData: [],
      treeLoading: false,
      currentNodeId: 111,
      selection: [],
      pageNum: 1,
      pageSize: 100,
      rollList: [],
      fileList: []
    }
  },
  computed: {
    /** 案卷目录工具栏按钮（AdaptiveActions 配置，不设颜色） */
    rollActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-view' },
        { key: 'backUnarchived', label: '重定为未归档', icon: 'el-icon-undo' }
      ]
    },
    /** 文件目录工具栏按钮（AdaptiveActions 配置，不设颜色） */
    fileActions() {
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'pack', label: '装盒', icon: 'el-icon-box' },
        { key: 'sortByBox', label: '按盒排序', icon: 'el-icon-sort' },
        { key: 'backUnarchived', label: '重定为未归档', icon: 'el-icon-undo' },
        { key: 'check', label: '四性校验', icon: 'el-icon-finished' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-view' }
      ]
    },
    /** 文件表格工具栏按钮（AdaptiveActions 配置，不设颜色） */
    fileBottomActions() {
      return [
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-view' }
      ]
    },
    /** 当前展示的案卷列表 */
    rolls() {
      const ids = [this.currentNodeId, ...this.collectChildIds(this.currentNodeId)]
      return this.rollList.filter(r => ids.indexOf(r.categoryId) > -1)
    },
    /** 当前展示的文件列表 */
    files() {
      const ids = [this.currentNodeId, ...this.collectChildIds(this.currentNodeId)]
      return this.fileList.filter(f => ids.indexOf(f.categoryId) > -1)
    }
  },
  watch: {
    treeKeyword(val) {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(val)
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    /** 模拟异步加载分类树与目录数据 */
    loadData() {
      this.treeLoading = true
      setTimeout(() => {
        this.treeData = JSON.parse(JSON.stringify(TREE_DATA))
        this.rollList = JSON.parse(JSON.stringify(ROLL_LIST))
        this.fileList = JSON.parse(JSON.stringify(FILE_LIST))
        this.treeLoading = false
      }, 1500)
    },

    /** 收集某节点全部后代 id */
    collectChildIds(id) {
      const ids = []
      const walk = (nodes) => {
        for (const node of nodes) {
          if (node.children && node.children.length) {
            ids.push(node.id)
            walk(node.children)
          }
        }
      }
      const find = (nodes) => {
        for (const node of nodes) {
          if (node.id === id) {
            walk(node.children || [])
            return true
          }
          if (node.children && find(node.children)) return true
        }
        return false
      }
      find(this.treeData)
      return ids
    },

    /** 树节点过滤 */
    filterNode(value, data) {
      if (!value) return true
      return data.name.indexOf(value) > -1
    },

    filterTree() {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(this.treeKeyword)
    },

    /** 切换按卷/按件管理 */
    switchMode(mode) {
      if (this.manageMode === mode) return
      this.manageMode = mode
      this.$message.info(mode === 'roll' ? '已切换为按卷管理分类' : '已切换为按件管理分类')
    },

    /** 点击树节点 */
    handleNodeClick(data) {
      this.currentNodeId = data.id
      this.pageNum = 1
    },

    onSelectionChange(selection) {
      this.selection = selection
    },

    /** 列表工具栏按钮统一分发 */
    onHeaderAction(item) {
      const handlers = {
        refresh: () => this.handleRefresh(),
        pack: () => this.handlePack(),
        sortByBox: () => this.handleSortByBox(),
        backUnarchived: () => this.handleBackUnarchived(),
        check: () => this.handleCheck(),
        detail: () => this.handleDetail()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },

    handleRefresh() {
      this.rollList = JSON.parse(JSON.stringify(ROLL_LIST))
      this.fileList = JSON.parse(JSON.stringify(FILE_LIST))
      this.$message.success('刷新成功')
    },

    /** 装盒 */
    handlePack() {
      if (!this.selection.length) return this.$message.warning('请先勾选文件')
      this.$prompt('请输入盒号', '装盒', { confirmButtonText: '确定', cancelButtonText: '取消' })
        .then(({ value }) => {
          const boxNo = (value || '').trim() || '1'
          this.selection.forEach(row => { row.boxNo = boxNo })
          this.$message.success(`已将 ${this.selection.length} 件文件装入 ${boxNo} 号盒`)
        }).catch(() => {})
    },

    /** 按盒排序 */
    handleSortByBox() {
      this.fileList.sort((a, b) => (Number(a.boxNo) || 0) - (Number(b.boxNo) || 0))
      this.$message.success('已按盒号排序')
    },

    handleBackUnarchived() {
      if (!this.selection.length) return this.$message.warning('请先勾选数据')
      const tip = this.manageMode === 'roll' ? '卷' : '件'
      this.$confirm(`确认将选中的 ${this.selection.length} ${tip}重定为未归档吗？`, '提示', { type: 'warning' })
        .then(() => {
          this.$message.success('已重定为未归档')
        }).catch(() => {})
    },

    /** 四性校验 */
    handleCheck() {
      if (!this.selection.length) return this.$message.warning('请先勾选文件')
      this.$message.success(`四性校验完成：${this.selection.length} 件全部通过`)
    },

    handleDetail() {
      if (!this.selection.length) return this.$message.warning('请先勾选数据')
      this.$message.info('查看详细信息')
    },

    handleDetailRow(row) {
      this.$alert(`档号：${row.archiveNo}<br/>题名：${row.title}<br/>责任者/编制单位：${row.author || row.orgName}<br/>日期：${row.fileDate || (row.startDate + ' ~ ' + row.endDate)}`, '详细信息', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭'
      })
    }
  }
}
</script>

<style scoped lang="scss">
.material-page {
  display: flex;
  gap: 12px;
  height: 100%;
  padding: 12px;
  background: #f0f2f5;
  box-sizing: border-box;
}

/* ===== 左侧分类树 ===== */
.left-panel {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;

  .search-row {
    display: flex;
    gap: 6px;

    .el-input {
      flex: 1;
    }

    ::v-deep .el-input__inner {
      height: 26px;
      line-height: 26px;
    }
  }

  .mode-tabs {
    display: flex;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;

    .mode-tab {
      flex: 1;
      text-align: center;
      padding: 7px 0;
      font-size: 13px;
      color: #606266;
      cursor: pointer;
      background: #fff;
      transition: all 0.2s;

      & + .mode-tab {
        border-left: 1px solid #dcdfe6;
      }

      &.active {
        background: #409eff;
        color: #fff;
      }
    }
  }

  .tree-title {
    margin: 12px 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }

  .left-tree-wrap {
    flex: 1;
    overflow: auto;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 6px 4px;

    .tree-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 100%;
      color: #409eff;
      font-size: 13px;

      i {
        font-size: 28px;
      }
    }
  }
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding-right: 8px;
  font-size: 13px;

  .tree-icon {
    margin-right: 5px;
    font-size: 14px;

    &.folder {
      color: #e6a23c;
    }

    &.leaf {
      color: #409eff;
    }
  }

  .tree-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-count {
    margin-left: 4px;
    color: #909399;
    font-size: 12px;
    flex-shrink: 0;
  }
}

/* ===== 右侧目录区 ===== */
.right-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

/* 蓝色标题栏 */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #409eff;
  border-radius: 4px 4px 0 0;

  .header-title {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
  }

  .header-btns {
    display: flex;
    min-width: 0;
  }
}

.table-wrap {
  flex: 1;
  min-height: 0;

  .title-link {
    color: #409eff;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .status-ok {
    color: #67c23a;
  }
}

/* 按件管理：上下两个表格 */
.file-table-top {
  flex: 1;
}

.file-table-bottom {
  flex: 1;
  margin-bottom: 4px;
}

.file-header {
  margin-top: 10px;
}

/* 分页左对齐 */
.pagination-wrap {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}
</style>
