<template>
  <!-- 案卷详情视图：上部卷内目录 + 下部文件（按截图开发） -->
  <div class="roll-detail-view">
    <!-- 顶部面包屑 -->
    <div class="detail-breadcrumb">
      <el-link :underline="false" icon="el-icon-back" class="back-link" @click="$emit('back')">返回</el-link>
      <i class="el-icon-collection crumb-icon" />
      <template v-for="(crumb, idx) in crumbs">
        <span v-if="idx > 0" :key="'s' + idx" class="crumb-sep">&gt;</span>
        <a :key="idx" :class="['crumb-item', { last: idx === crumbs.length - 1 }]">{{ crumb }}</a>
      </template>
    </div>

    <!-- 卷内目录 -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">卷内目录</span>
        <div class="section-btns">
          <adaptive-actions :items="catalogActions" size="mini" @click="onSectionAction" />
        </div>
      </div>
      <el-table
        :data="catalogRows"
        border
        stripe
        size="small"
        height="calc(100% - 80px)"
        empty-text="暂无数据"
        highlight-current-row
        @current-change="onCatalogChange"
      >
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="序号" type="index" width="55" align="center" />
        <el-table-column label="文件题名" min-width="280" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" @click="clickCatalogTitle(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="文号" prop="fileNo" width="130" show-overflow-tooltip />
        <el-table-column label="编制日期" prop="createDate" width="100" align="center" />
        <el-table-column label="责任者" prop="author" min-width="170" show-overflow-tooltip />
        <el-table-column label="件数" prop="pieceCount" width="60" align="center" />
        <el-table-column label="页数" prop="pages" width="60" align="center" />
        <el-table-column label="参考信息" prop="refInfo" width="90" align="center" />
        <el-table-column label="文件数" prop="fileCount" width="70" align="center" />
        <el-table-column label="档案类型" prop="archiveType" width="90" align="center" />
        <el-table-column label="页码" prop="pageNo" width="60" align="center" />
      </el-table>
      <div class="detail-pagination">
        <span class="page-total">共 {{ catalogRows.length }} 条</span>
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes"
          :total="catalogRows.length"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[100]"
        />
      </div>
    </div>

    <!-- 文件 -->
    <div class="section-block">
      <div class="section-header">
        <span class="section-title">文件</span>
        <div class="section-btns">
          <adaptive-actions :items="fileActions" size="mini" @click="onSectionAction" />
        </div>
      </div>
      <el-table
        :data="fileRows"
        border
        stripe
        size="small"
        height="calc(100% - 80px)"
        empty-text="暂无数据"
        highlight-current-row
        @current-change="onFileChange"
      >
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="文件名称" prop="name" min-width="220" show-overflow-tooltip />
        <el-table-column label="文件编号" prop="code" width="120" show-overflow-tooltip />
        <el-table-column label="编制日期" prop="createDate" width="100" align="center" />
        <el-table-column label="考证日期" prop="checkDate" width="100" align="center" />
        <el-table-column label="页数" prop="pages" width="70" align="center" />
        <el-table-column label="排序" prop="sortNo" width="70" align="center" />
        <el-table-column label="档案类型" prop="archiveType" width="90" align="center" />
        <el-table-column label="文件状态" prop="fileStatus" width="90" align="center" />
        <el-table-column label="格式信息" prop="formatInfo" width="90" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" class="op-link" @click="viewFile(row)">查看</el-link>
            <el-link type="primary" :underline="false" class="op-link" @click="downloadFile(row)">下载</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 卷内文件详细信息弹窗 -->
    <el-dialog
      title="详细信息"
      :visible.sync="fileDetailVisible"
      width="860px"
      custom-class="file-detail-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="field in fileDetailFields" :key="field.prop" class="detail-row">
          <div class="detail-label">{{ field.label }}</div>
          <div class="detail-value">{{ fileDetailData[field.prop] }}</div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>

    <!-- 文件表格“查看详情信息”弹窗 -->
    <el-dialog
      title="详细信息"
      :visible.sync="fileRowDetailVisible"
      width="860px"
      custom-class="file-detail-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="field in fileRowDetailFields" :key="field.prop" class="detail-row">
          <div class="detail-label">{{ field.label }}</div>
          <div class="detail-value">{{ fileRowDetailData[field.prop] }}</div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions/index.vue'

/** 卷内目录 mock（与截图一致的 7 条） */
const CATALOG_ROWS = [
  { id: 1, title: '关于要求对柯桥至诸暨高速公路工程可行性研究报告的申请', fileNo: '绍市建〔2020...', createDate: '2020-03-03', author: '绍兴市交通建设有限公司', pieceCount: 1, pages: 2, refInfo: '', fileCount: 1, archiveType: '电子档案', pageNo: 1 },
  { id: 2, title: '关于要求组织柯桥至诸暨高速公路工程可行性研究报告评审的请示', fileNo: '绍市建〔2020...', createDate: '2020-03-11', author: '绍兴市交通建设有限公司', pieceCount: 2, pages: 4, refInfo: '', fileCount: 1, archiveType: '电子档案', pageNo: 5 },
  { id: 3, title: '柯桥至诸暨高速公路工程可行性研究报告评估报告', fileNo: '', createDate: '2020-03-01', author: '浙江公路水运工程咨询有限责任公司', pieceCount: 3, pages: 92, refInfo: '', fileCount: 1, archiveType: '数字化档案', pageNo: 97 },
  { id: 4, title: '关于召开柯桥至诸暨高速公路工程可行性研究报告预评会会议的通知', fileNo: '', createDate: '2020-04-02', author: '绍兴市交通运输局', pieceCount: 4, pages: 3, refInfo: '', fileCount: 1, archiveType: '电子档案', pageNo: 100 },
  { id: 5, title: '关于召开柯桥至诸暨高速公路工程可行性研究报告评审会会议的通知', fileNo: '', createDate: '2020-04-02', author: '绍兴市交通建设有限公司', pieceCount: 5, pages: 2, refInfo: '', fileCount: 1, archiveType: '数字化档案', pageNo: 102 },
  { id: 6, title: '柯桥至诸暨高速公路工程可行性研究报告评审会专家意见', fileNo: '', createDate: '2020-04-09', author: '绍兴市交通建设有限公司', pieceCount: 6, pages: 12, refInfo: '', fileCount: 1, archiveType: '数字化档案', pageNo: 114 },
  { id: 7, title: '柯桥至诸暨高速公路工程项目申请报告核查意见书', fileNo: '', createDate: '2021-05-01', author: '浙江公路水运工程咨询有限责任公司', pieceCount: 7, pages: 35, refInfo: '', fileCount: 1, archiveType: '数字化档案', pageNo: 149 }
]

/** 每条卷内目录对应的电子文件（点击文件题名后在下区“文件”中展示） */
const CATALOG_FILES = {
  1: [{ name: '关于要求对柯桥至诸暨高速公路工程可行性研究报告的申请.pdf', pages: 2 }],
  2: [{ name: '关于要求组织柯桥至诸暨高速公路工程可行性研究报告评审的请示.pdf', pages: 4 }],
  3: [{ name: '柯桥至诸暨高速公路工程可行性研究报告评估报告.pdf', pages: 92 }],
  4: [{ name: '关于召开柯桥至诸暨高速公路工程可行性研究报告预评会会议的通知.pdf', pages: 3 }],
  5: [{ name: '关于召开柯桥至诸暨高速公路工程可行性研究报告评审会会议的通知.pdf', pages: 2 }],
  6: [{ name: '柯桥至诸暨高速公路工程可行性研究报告评审会专家意见.pdf', pages: 12 }],
  7: [{ name: '柯桥至诸暨高速公路工程项目申请报告核查意见书.pdf', pages: 35 }]
}

/** 卷内文件详细信息弹窗字段（与截图一致：档案类型出现两次，按图保留） */
const FILE_DETAIL_FIELDS = [
  { prop: 'title', label: '文件题名' },
  { prop: 'fileNo', label: '文号' },
  { prop: 'createDate', label: '编制日期' },
  { prop: 'author', label: '责任者' },
  { prop: 'pieceNo', label: '件号' },
  { prop: 'pages', label: '页数' },
  { prop: 'refInfo', label: '参考信息' },
  { prop: 'fileCount', label: '文件数' },
  { prop: 'archiveType', label: '档案类型' },
  { prop: 'pageNo', label: '页码' },
  { prop: 'materialComplete', label: '资料是否齐全' },
  { prop: 'secretLevel', label: '密级' },
  { prop: 'addPerson', label: '增加人' },
  { prop: 'addTime', label: '增加时间' },
  { prop: 'editPerson', label: '修改人' },
  { prop: 'editTime', label: '修改时间' },
  { prop: 'archiveType2', label: '档案类型' },
  { prop: 'nodePath', label: '所在分类节点路径' }
]

/** 文件表格“查看详情信息”弹窗字段（与截图一致：计算机文件大小出现两次，按图保留） */
const FILE_ROW_DETAIL_FIELDS = [
  { prop: 'name', label: '文件名称' },
  { prop: 'code', label: '文件编号' },
  { prop: 'createDate', label: '编制日期' },
  { prop: 'checkDate', label: '考证日期' },
  { prop: 'pages', label: '页数' },
  { prop: 'sortNo', label: '排序' },
  { prop: 'archiveType', label: '档案类型' },
  { prop: 'fileStatus', label: '文件状态' },
  { prop: 'formatInfo', label: '格式信息' },
  { prop: 'size', label: '计算机文件大小' },
  { prop: 'openFlag', label: '开放' },
  { prop: 'tableStatus', label: '表格状态' },
  { prop: 'operation', label: '操作' },
  { prop: 'originName', label: '原文件名' },
  { prop: 'size2', label: '计算机文件大小' },
  { prop: 'fileSource', label: '文件来源' },
  { prop: 'signStatus', label: '主管签名情况' },
  { prop: 'remark', label: '备注' },
  { prop: 'addPerson', label: '增加人' },
  { prop: 'addTime', label: '增加时间' },
  { prop: 'editPerson', label: '修改人' },
  { prop: 'editTime', label: '修改时间' },
  { prop: 'nodePath', label: '所在分类节点路径' }
]

export default {
  name: 'RollDetailView',
  components: { AdaptiveActions },
  props: {
    /** 当前查看的案卷行数据 */
    roll: { type: Object, default: () => ({}) },
    /** 父级分类节点面包屑（名称数组） */
    breadcrumb: { type: Array, default: () => [] }
  },
  data() {
    return {
      catalogRows: JSON.parse(JSON.stringify(CATALOG_ROWS)),
      fileRows: [],
      catalogRow: null,
      fileRow: null,
      fileDetailVisible: false,
      fileDetailFields: FILE_DETAIL_FIELDS,
      fileDetailData: {},
      fileRowDetailVisible: false,
      fileRowDetailFields: FILE_ROW_DETAIL_FIELDS,
      fileRowDetailData: {},
      page: 1,
      pageSize: 100
    }
  },
  computed: {
    /** 卷内目录工具栏按钮（AdaptiveActions 配置） */
    catalogActions() {
      return [
        { key: 'refreshCatalog', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'catalogDetail', label: '查看详情信息', icon: 'el-icon-user', disabled: !this.catalogRow && this.catalogRows.length == 1 }
      ]
    },
    /** 文件工具栏按钮（AdaptiveActions 配置） */
    fileActions() {
      return [
        { key: 'refreshFiles', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'fileDetail', label: '查看详情信息', icon: 'el-icon-user', disabled: !this.fileRow && this.fileRows.length == 1 }
      ]
    },
    /** 面包屑：分类节点路径 -> 案卷题名 -> 整理日期 */
    crumbs() {
      const names = this.breadcrumb.map(item => item.name)
      return [...names, this.roll.title || '', '2026-09-04/2026-09-04']
    }
  },
  methods: {
    /** 区块工具栏按钮统一分发 */
    onSectionAction(item) {
      const handlers = {
        refreshCatalog: () => this.refreshCatalog(),
        catalogDetail: () => this.showCatalogDetail(),
        refreshFiles: () => this.refreshFiles(),
        fileDetail: () => this.showFileRowDetail()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },

    /** 卷内目录单选高亮 */
    onCatalogChange(row) {
      this.catalogRow = row || null
    },

    /** 文件表格单选高亮 */
    onFileChange(row) {
      this.fileRow = row || null
    },

    /** 点击文件题名：联动更新下区“文件”数据 */
    clickCatalogTitle(row) {
      this.catalogRow = row
      this.fileRow = null
      const files = CATALOG_FILES[row.id] || []
      this.fileRows = files.map((f, i) => ({
        id: i + 1,
        name: f.name,
        code: row.fileNo || '',
        createDate: row.createDate,
        checkDate: '',
        pages: f.pages,
        sortNo: row.pieceCount,
        archiveType: row.archiveType,
        fileStatus: '上传成功',
        formatInfo: '.pdf',
        size: f.size,
        openFlag: '',
        tableStatus: '',
        operation: '',
        originName: f.originName,
        size2: f.size,
        fileSource: '上传',
        signStatus: '已签名',
        remark: '',
        addPerson: '陈艳',
        addTime: '2022-12-08 14:35:46',
        editPerson: '',
        editTime: '',
        nodePath: ''
      }))
    },

    /** 文件表格“查看详情信息”：展示当前选中文件的详细信息 */
    showFileRowDetail() {
      if (!this.fileRow) return
      this.fileRowDetailData = { ...this.fileRow }
      this.fileRowDetailVisible = true
    },

    /** 查看详情信息：展示当前选中目录条目的详细信息 */
    showCatalogDetail() {
      if (!this.catalogRow) return
      const row = this.catalogRow
      this.fileDetailData = {
        ...row,
        pieceNo: row.pieceCount,
        materialComplete: '',
        secretLevel: '',
        addPerson: '陈艳',
        addTime: '2022-12-08 00:00:00',
        editPerson: '张鲁莎',
        editTime: '2026-02-25 14:48:30',
        archiveType2: row.archiveType,
        nodePath: ''
      }
      this.fileDetailVisible = true
    },

    refreshCatalog() {
      this.$message.success('卷内目录已刷新')
    },
    refreshFiles() {
      this.$message.success('文件列表已刷新')
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
.roll-detail-view {
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

    .back-link {
      margin-right: 10px;
      font-size: 13px;
    }

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
  }

  .detail-pagination {
    display: flex;
    align-items: center;
    padding: 6px 10px;

    .page-total {
      margin-right: 12px;
      font-size: 13px;
      color: #606266;
    }
  }

  .op-link {
    margin-right: 8px;
    font-size: 13px;
  }
}
</style>

<style lang="scss">
/* 详细信息弹窗使用 append-to-body，需全局样式 */
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
