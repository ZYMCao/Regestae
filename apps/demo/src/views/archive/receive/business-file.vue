<template>
  <!--
    业务文件接收：左侧档案类别树 + 右上"文件目录" + 右下"文件"
    纯静态 DEMO，不请求接口
  -->
  <div class="business-file-page">

    <!-- ========== 左侧：档案类别树 ========== -->
    <div class="left-panel">
      <div class="left-search">
        <el-input
          v-model="categoryKeyword"
          placeholder="请输入档案类别"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        >
          <el-button slot="append" icon="el-icon-search" @click="filterTree" />
        </el-input>
      </div>
      <div class="left-tree-title">档案类别</div>
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
          @node-click="onNodeClick"
        >
          <span slot-scope="{ node, data }" class="tree-node">
            <i :class="data.id === 1 ? 'el-icon-folder-opened text-warning' : 'el-icon-folder text-warning'" />
            <span class="tree-node-label">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- ========== 右侧：上文件目录 + 下文件 ========== -->
    <div class="right-panel">

      <!-- 上：文件目录 -->
      <div class="panel dir-panel search-input">
        <div class="panel-header">
          <span class="panel-title">文件目录</span>
          <div class="panel-toolbar">
            <el-select v-model="dirSearchField" size="small" class="search-field">
              <el-option label="文件题名" value="title" />
              <el-option label="文件编号" value="code" />
              <el-option label="编制日期" value="creationDate" />
              <el-option label="责任者" value="owner" />
              <el-option label="归档日期" value="archiveDate" />
            </el-select>
            <el-input
              v-model="dirSearchKeyword"
              placeholder=""
              size="small"
              clearable
              class="search-input"
              @keyup.enter.native="doDirSearch"
            />
            <el-button size="small" icon="el-icon-search" class="btn-search" @click="doDirSearch" />
            <el-select v-model="dirStatusFilter" size="small" class="status-field" @change="doDirSearch">
              <el-option label="全部" value="" />
              <el-option label="待归档" value="待归档" />
              <el-option label="已归档" value="已归档" />
              <el-option label="不归档" value="不归档" />
            </el-select>
            <el-button size="small" class="btn-plain" @click="doDirSearch">搜索</el-button>
            <el-button size="small" icon="el-icon-refresh" class="btn-plain" @click="refreshDir">刷新</el-button>
          </div>
        </div>

        <el-table
          ref="dirTable"
          :data="pagedDirs"
          row-key="id"
          border
          size="small"
          empty-text="暂无数据"
          height="calc(100% - 70px)"
          highlight-current-row
          @selection-change="onDirSelectionChange"
          @row-click="onDirRowClick"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ dirPageStart + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="归档状态" width="100" align="center">
            <template slot-scope="{ row }">
              <span :class="row.status === '已归档' ? 'text-success' : 'text-danger'">{{ row.status }}</span>
            </template>
          </el-table-column>
          <el-table-column label="文件题名" prop="title" min-width="300" align="left" show-overflow-tooltip />
          <el-table-column label="文件编号" prop="code" width="120" align="center" />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" />
          <el-table-column label="责任者" prop="owner" width="100" align="center" />
          <el-table-column label="归档日期" prop="archiveDate" width="110" align="center">
            <template slot-scope="{ row }">
              <span>{{ row.archiveDate || '' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="filteredDirs.length"
            :current-page.sync="dirPage"
            :page-size.sync="dirPageSize"
            :page-sizes="[10, 50, 100]"
          />
        </div>
      </div>

      <!-- 下：文件 -->
      <div class="panel file-panel">
        <div class="panel-header">
          <span class="panel-title">文件</span>
        </div>

        <el-table
          ref="fileTable"
          :data="fileList"
          row-key="id"
          border
          size="small"
          empty-text="暂无数据"
          height="calc(100% - 40px)"
          highlight-current-row
          @selection-change="onFileSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="名称" min-width="300" align="left">
            <template slot-scope="{ row }">
              <el-link type="primary" :underline="false" @click="viewFile(row)">{{ row.name }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="上传日期" prop="uploadDate" width="120" align="center" />
          <el-table-column label="上传人" prop="uploader" width="100" align="center" />
          <el-table-column label="文件状态" width="110" align="center">
            <template slot-scope="{ row }">
              <span class="text-primary">{{ row.status }}</span>
            </template>
          </el-table-column>
          <el-table-column label="扩展名" prop="ext" width="100" align="center" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
/** 档案类别树 mock（与截图层级/计数一致） */
const MOCK_CATEGORY_TREE = [
  {
    id: 1,
    name: '柯诸高速数智管控系统(0/7232)',
    children: [
      {
        id: 11,
        name: '安全隐患排查(0/1943)',
        children: [
          { id: 111, name: 'TJ01标日常安全检查(46...' },
          { id: 112, name: 'TJ02标日常安全检查(61...' },
          { id: 113, name: 'TJ03标日常安全检查(41...' },
          { id: 114, name: 'TJ04标日常安全检查(44...' },
          { id: 115, name: '安全整改意见单(503/503)' },
          { id: 116, name: '安全体系/制度-岗位职责(0...' },
          { id: 117, name: '安全体系/制度-安全责任书...' },
          { id: 118, name: '安全体系/制度-管理制度(0...' },
          { id: 119, name: '安全体系/制度-安全管理(...' },
          { id: 120, name: '危大工程(42/42)' },
          { id: 121, name: '平安工地考核(27/27)' },
          { id: 122, name: '航拍视频-TJ01标(0/292)' },
          { id: 123, name: '航拍视频-TJ02标(0/605)' },
          { id: 124, name: '航拍视频-TJ03标(0/332)' },
          { id: 125, name: '航拍视频-TJ04标(0/264)' },
          { id: 126, name: '航拍视频-全线视频(0/123)' },
          { id: 127, name: '阳光分包(0/1325)' },
          { id: 128, name: '资金监管(0/1543)' },
          { id: 129, name: '品质工程考核(0/0)' },
          { id: 130, name: '立功竞赛-2022年(0/0)' },
          { id: 131, name: '立功竞赛-2023年(0/43)' },
          { id: 132, name: '科技创新-柯诸高速科技创...' },
          { id: 133, name: '环保隐患排查(72/72)' },
          { id: 134, name: '变更管理(0/469)' }
        ]
      }
    ]
  }
]

/** 文件目录 mock 生成（共 464 条） */
function buildMockDirs() {
  const titles1 = '陈绍梁全面枢纽匝道3#地系梁基坑开挖方案'
  const titles2 = '俞文杰柯桥至诸暨高速公路工程安全检查整改通知单'
  const rows = []
  const dates = ['2022-11-12', '2022-12-12']
  const codes = ['AQWT_00987', 'AQWT_01081', 'AQWT_00971', 'AQWT_01083', 'AQWT_01084', 'AQWT_01083', 'AQWT_00987', 'AQWT_01081', 'AQWT_00971', 'AQWT_01083']
  const owners = ['陈绍梁', '俞文杰']
  const archiveDates = ['2024-01-24', '2024-01-24', '2024-01-24', '2024-01-24', '2024-01-24', '2024-01-24', '2024-02-01', '2024-02-01', '2024-02-01', '2024-02-01']
  for (let i = 0; i < 464; i++) {
    const idx = i % 10
    rows.push({
      id: i + 1,
      status: '待归档',
      title: idx % 2 === 0 ? titles1 : titles2,
      code: codes[idx],
      createDate: dates[idx % 2],
      owner: owners[idx % 2],
      archiveDate: archiveDates[idx]
    })
  }
  return rows
}

/** 右下"文件" mock：点击目录行 → 显示对应上传文件 */
function buildMockFiles(dirRow) {
  return [
    {
      id: dirRow ? dirRow.id * 1000 + 1 : 1,
      name: 'dangerRpt_8',
      uploadDate: dirRow ? dirRow.createDate : '2022-12-12',
      uploader: dirRow ? dirRow.owner : '俞文杰',
      status: '上传成功',
      ext: '.pdf'
    }
  ]
}

export default {
  name: 'ArchiveBusinessFile',
  data() {
    return {
      // 左侧树
      categoryKeyword: '',
      categoryTree: MOCK_CATEGORY_TREE,

      // 右上：文件目录
      dirSearchField: 'title',
      dirSearchKeyword: '',
      dirStatusFilter: '待归档',
      dirList: buildMockDirs(),
      dirSelection: [],
      dirPage: 1,
      dirPageSize: 100,
      currentDir: null,

      // 右下：文件
      fileList: [],
      fileSelection: []
    }
  },
  computed: {
    filteredDirs() {
      const kw = this.dirSearchKeyword.trim()
      let list = this.dirList
      // 状态过滤（默认"待归档"）
      if (this.dirStatusFilter) {
        list = list.filter(d => d.status === this.dirStatusFilter)
      }
      // 关键字过滤
      if (kw) {
        list = list.filter(d => String(d[this.dirSearchField] || '').includes(kw))
      }
      return list
    },
    pagedDirs() {
      const start = (this.dirPage - 1) * this.dirPageSize
      return this.filteredDirs.slice(start, start + this.dirPageSize)
    },
    dirPageStart() {
      return (this.dirPage - 1) * this.dirPageSize
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
    onNodeClick(data) {
      // 点树节点：重置筛选并刷新目录（静态演示仅提示 + 重置）
      this.currentDir = null
      this.fileList = []
      this.dirPage = 1
      this.dirStatusFilter = ''
      this.$message.success(`已切换到分类「${data.name}」（静态 DEMO）`)
    },

    // ===== 右上：文件目录 =====
    doDirSearch() {
      this.dirPage = 1
    },
    refreshDir() {
      this.dirList = buildMockDirs()
      this.dirPage = 1
      this.dirSearchKeyword = ''
      this.dirStatusFilter = ''
      this.fileList = []
      this.currentDir = null
      this.$message.success('刷新成功（静态 DEMO）')
    },
    onDirSelectionChange(selection) {
      this.dirSelection = selection || []
    },
    /** 点击目录行 → 加载其下文件明细 */
    onDirRowClick(row) {
      this.currentDir = row
      this.fileList = buildMockFiles(row)
    },
    viewFile(row) {
      this.$message.info(`查看文件「${row.name}${row.ext}」`)
    },

    // ===== 右下：文件 =====
    onFileSelectionChange(selection) {
      this.fileSelection = selection || []
    }
  }
}
</script>

<style lang="scss" scoped>
.business-file-page {
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

  // 右侧双表
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    .panel {
      display: flex;
      flex-direction: column;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      overflow: hidden;

      &.dir-panel { flex: 1.5; }
      &.file-panel { flex: 1; }

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

          .search-field { width: 120px; }
          .search-input { width: 160px; }
          .status-field { width: 110px; }
          .btn-search { margin-left: 0; padding: 9px 12px; }

          .btn-plain {
            background: #fff;
            color: #409eff;
            border-color: #dcdfe6;
          }
        }
      }

      ::v-deep .el-table { flex: 1; }

      .pagination-wrap {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-top: 1px solid #ebeef5;
        background: #fafbfc;
      }
    }
  }

  .text-success { color: #67c23a; }
  .text-danger { color: #f56c6c; }
  .text-primary { color: #409eff; }
  .text-warning { color: #e6a23c; }
}
</style>
