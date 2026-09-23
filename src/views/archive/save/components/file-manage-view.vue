<template>
  <!-- 按件管理分类视图：上部文件目录 + 下部文件（按截图开发） -->
  <div class="file-manage-view">
    <!-- 顶部面包屑 -->
    <div class="detail-breadcrumb">
      <i class="el-icon-collection crumb-icon" />
      <template v-for="(crumb, idx) in crumbs">
        <span v-if="idx > 0" :key="'s' + idx" class="crumb-sep">&gt;</span>
        <a :key="idx" :class="['crumb-item', { last: idx === crumbs.length - 1 }]">{{ crumb }}</a>
      </template>
    </div>

    <!-- 文件目录 -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">文件目录</span>
        <div class="section-btns">
          <adaptive-actions :items="dirActions" size="mini" @click="onDirAction" />
        </div>
      </div>
      <el-table
        :data="dirRows"
        border
        stripe
        size="small"
        height="calc(100% - 80px)"
        empty-text="暂无数据"
        @selection-change="onDirSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="序号" type="index" width="55" align="center" />
        <el-table-column label="文件题名" prop="title" min-width="300" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" @click="clickDirTitle(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="文件数" prop="fileCount" sortable width="80" align="center" />
        <el-table-column label="档号" prop="archiveNo" width="140" show-overflow-tooltip />
        <el-table-column label="文号" prop="fileNo" sortable width="130" show-overflow-tooltip />
        <el-table-column label="互见号" prop="seeNo" sortable width="110" show-overflow-tooltip />
        <el-table-column label="责任者" prop="author" sortable min-width="180" show-overflow-tooltip />
        <el-table-column label="保管期限" prop="period" width="90" align="center" />
        <el-table-column label="编制日期" prop="createDate" width="100" align="center" />
      </el-table>
      <div class="section-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="dirRows.length"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </div>

    <!-- 文件 -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">文件</span>
        <div class="section-btns">
          <adaptive-actions :items="fileActions" size="mini" @click="onFileAction" />
        </div>
      </div>
      <el-table
        :data="fileRows"
        border
        stripe
        size="small"
        height="calc(100% - 80px)"
        empty-text="暂无数据"
        @selection-change="onFileSelectionChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="序号" type="index" width="55" align="center" />
        <el-table-column label="文件名称" prop="name" min-width="260" show-overflow-tooltip />
        <el-table-column label="文件编号" prop="code" width="140" show-overflow-tooltip />
        <el-table-column label="编制日期" prop="createDate" width="110" align="center" />
        <el-table-column label="考证日期" prop="checkDate" width="110" align="center" />
        <el-table-column label="页数" prop="pages" width="70" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" class="op-link" @click="viewFile(row)">查看</el-link>
            <el-link type="primary" :underline="false" class="op-link" @click="downloadFile(row)">下载</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 查看详细信息弹窗 -->
    <el-dialog
      title="详细信息"
      :visible.sync="detailVisible"
      width="860px"
      custom-class="file-detail-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="field in detailFields" :key="field.prop" class="detail-row">
          <div class="detail-label">{{ field.label }}</div>
          <div class="detail-value">{{ detailData[field.prop] }}</div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions/index.vue'

/** 文件目录详细信息弹窗字段 */
const DIR_DETAIL_FIELDS = [
  { prop: 'title', label: '文件题名' },
  { prop: 'fileCount', label: '文件数' },
  { prop: 'archiveNo', label: '档号' },
  { prop: 'fileNo', label: '文号' },
  { prop: 'seeNo', label: '互见号' },
  { prop: 'author', label: '责任者' },
  { prop: 'period', label: '保管期限' },
  { prop: 'createDate', label: '编制日期' },
  { prop: 'boxNo', label: '盒号' },
  { prop: 'addPerson', label: '增加人' },
  { prop: 'addTime', label: '增加时间' },
  { prop: 'nodePath', label: '所在分类节点路径' }
]

/** 文件详细信息弹窗字段 */
const FILE_DETAIL_FIELDS = [
  { prop: 'name', label: '文件名称' },
  { prop: 'code', label: '文件编号' },
  { prop: 'createDate', label: '编制日期' },
  { prop: 'checkDate', label: '考证日期' },
  { prop: 'pages', label: '页数' },
  { prop: 'fileStatus', label: '文件状态' },
  { prop: 'formatInfo', label: '格式信息' },
  { prop: 'size', label: '计算机文件大小' },
  { prop: 'remark', label: '备注' },
  { prop: 'addPerson', label: '增加人' },
  { prop: 'addTime', label: '增加时间' },
  { prop: 'nodePath', label: '所在分类节点路径' }
]

export default {
  name: 'FileManageView',
  components: { AdaptiveActions },
  props: {
    /** 父级分类节点面包屑（节点对象数组，含 name） */
    breadcrumb: { type: Array, default: () => [] }
  },
  data() {
    return {
      // 与截图一致：当前分类节点下暂无数据
      dirRows: [],
      fileRows: [],
      dirSelection: [],
      fileSelection: [],
      page: 1,
      pageSize: 100,
      detailVisible: false,
      detailFields: DIR_DETAIL_FIELDS,
      detailData: {}
    }
  },
  computed: {
    /** 文件目录工具栏按钮（AdaptiveActions 配置，不带颜色） */
    dirActions() {
      const single = this.dirSelection.length === 1
      return [
        { key: 'refreshDir', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'boxLoad', label: '装盒', icon: 'el-icon-box', disabled: !this.dirSelection.length },
        { key: 'boxSort', label: '按盒排序', icon: 'el-icon-sort', disabled: !this.dirSelection.length },
        { key: 'viewPdf', label: '查看文件PDF', icon: 'el-icon-tickets', disabled: !single },
        {
          key: 'print', label: '打印', icon: 'el-icon-printer',
          children: [
            { key: 'printFile', label: '打印文件目录' },
            { key: 'printBox', label: '打印盒内目录' },
            { key: 'printCover', label: '打印档案盒封面' },
            { key: 'printSpine', label: '打印档案脊背' }
          ]
        },
        {
          key: 'export', label: '导出', icon: 'el-icon-download',
          children: [
            { key: 'exportExcel', label: '导出Excel' },
            { key: 'exportPdf', label: '导出PDF' }
          ]
        },
        { key: 'backUnarchived', label: '重定为未归档', icon: 'el-icon-undo', disabled: !this.dirSelection.length },
        { key: 'check', label: '四性校验', icon: 'el-icon-finished', disabled: !this.dirSelection.length },
        { key: 'dirDetail', label: '查看详细信息', icon: 'el-icon-view', disabled: !single }
      ]
    },
    /** 文件工具栏按钮（AdaptiveActions 配置，不带颜色） */
    fileActions() {
      return [
        { key: 'refreshFiles', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'fileDetail', label: '查看详细信息', icon: 'el-icon-view', disabled: this.fileSelection.length !== 1 }
      ]
    },
    /** 面包屑：分类节点祖先链 */
    crumbs() {
      return this.breadcrumb.map(item => item.name)
    }
  },
  methods: {
    /** 文件目录工具栏按钮统一分发 */
    onDirAction(item) {
      const handlers = {
        refreshDir: () => this.refreshDir(),
        boxLoad: () => this.requireSelection('装盒'),
        boxSort: () => this.requireSelection('按盒排序'),
        viewPdf: () => this.viewFilePdf(),
        printFile: () => this.handlePrint('文件目录'),
        printBox: () => this.handlePrint('盒内目录'),
        printCover: () => this.handlePrint('档案盒封面'),
        printSpine: () => this.handlePrint('档案脊背'),
        exportExcel: () => this.handleExport('Excel'),
        exportPdf: () => this.handleExport('PDF'),
        backUnarchived: () => this.requireSelection('重定为未归档'),
        check: () => this.requireSelection('四性校验'),
        dirDetail: () => this.showDirDetail()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },

    /** 文件工具栏按钮统一分发 */
    onFileAction(item) {
      const handlers = {
        refreshFiles: () => this.refreshFiles(),
        fileDetail: () => this.showFileDetail()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },

    onDirSelectionChange(rows) {
      this.dirSelection = rows || []
    },

    onFileSelectionChange(rows) {
      this.fileSelection = rows || []
    },

    /** 勾选校验：未选中时提示 */
    requireSelection(action) {
      if (!this.dirSelection.length) {
        this.$message.warning(`请先勾选需要${action}的文件`)
        return
      }
      this.$message.success(`${action}操作成功（演示，共 ${this.dirSelection.length} 条）`)
    },

    /** 点击文件题名：联动展示下区“文件” */
    clickDirTitle(row) {
      this.fileRows = [{
        name: `${row.title}.pdf`,
        code: row.fileNo || '',
        createDate: row.createDate,
        checkDate: '',
        pages: row.fileCount,
        fileStatus: '上传成功',
        formatInfo: '.pdf',
        size: '1.2MB',
        remark: '',
        addPerson: '陈艳',
        addTime: '2022-12-08 14:35:46',
        nodePath: ''
      }]
    },

    viewFilePdf() {
      const row = this.dirSelection[0]
      this.$message.info(`查看文件PDF：${row.title}`)
    },

    showDirDetail() {
      const row = this.dirSelection[0]
      this.detailFields = DIR_DETAIL_FIELDS
      this.detailData = {
        ...row,
        boxNo: '',
        addPerson: '陈艳',
        addTime: '2022-12-08 14:35:46',
        nodePath: this.crumbs.join(' > ')
      }
      this.detailVisible = true
    },

    showFileDetail() {
      const row = this.fileSelection[0]
      this.detailFields = FILE_DETAIL_FIELDS
      this.detailData = { ...row, nodePath: this.crumbs.join(' > ') }
      this.detailVisible = true
    },

    refreshDir() {
      this.$message.success('文件目录已刷新')
    },
    refreshFiles() {
      this.$message.success('文件列表已刷新')
    },
    handlePrint(target) {
      this.$message.info(`打印${target}`)
    },
    handleExport(type) {
      this.$message.success(`导出${type}成功`)
    },
    viewFile(row) {
      this.$message.info(`查看文件：${row.name}`)
    },
    downloadFile(row) {
      this.$message.success(`下载文件：${row.name}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.file-manage-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .detail-breadcrumb {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #eef3f8;
    border-bottom: 1px solid #dfe6ee;
    font-size: 13px;
    color: #1e88d2;

    .crumb-icon {
      margin-right: 6px;
      color: #23b39a;
    }

    .crumb-item {
      color: #1e88d2;
      cursor: pointer;

      &.last {
        color: #606266;
        cursor: default;
      }
    }

    .crumb-sep {
      margin: 0 6px;
      color: #909399;
    }
  }

  .section-block {
    margin-top: 8px;
    flex: 0 0 calc(50% - 12px);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 34px;
    padding: 0 10px;
    background: linear-gradient(#2e8fe8, #1e88d2);

    .section-title {
      color: #fff;
      font-weight: bold;
      font-size: 14px;
    }

    .section-btns {
      display: flex;
      min-width: 0;

      ::v-deep .el-button {
        color: #fff;
        background: transparent;
        border-color: rgba(255, 255, 255, 0.6);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
      }
    }
  }

  .section-pagination {
    display: flex;
    align-items: center;
    padding: 6px 10px;
  }

  .op-link {
    margin-right: 8px;
    font-size: 13px;
  }
}
</style>

<style lang="scss">
/* 详细信息弹窗使用 append-to-body，需全局样式（复用 roll-detail-view 的 file-detail-dialog 样式） */
.file-detail-dialog {
  .el-dialog__body {
    padding: 16px 24px;
  }

  .detail-table {
    border: 1px solid #dcdfe6;
    max-height: 66vh;
    overflow: auto;
  }

  .detail-row {
    display: flex;
    border-bottom: 1px solid #dcdfe6;

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    width: 160px;
    flex-shrink: 0;
    padding: 12px 14px;
    background: #f5f7fa;
    border-right: 1px solid #dcdfe6;
    font-size: 13px;
    color: #303133;
  }

  .detail-value {
    flex: 1;
    padding: 12px 14px;
    font-size: 13px;
    color: #303133;
    word-break: break-all;
  }
}
</style>
