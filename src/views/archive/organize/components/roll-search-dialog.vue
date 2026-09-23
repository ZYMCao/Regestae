<template>
  <!--
    案卷搜索弹窗：在当前选中分类节点及其子节点范围内检索案卷
    左侧搜索表单（标签在上）+ 右侧结果表格，纯静态 DEMO
  -->
  <el-dialog
    :title="searchTitle"
    :visible.sync="dialogVisible"
    width="1100px"
    top="6vh"
    custom-class="roll-search-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="rs-body">
      <!-- 左侧：搜索表单 -->
      <div class="rs-form">
        <div class="form-item">
          <div class="form-label">案卷题名</div>
          <el-input v-model="query.title" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">档号</div>
          <el-input v-model="query.archiveNo" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">附件总数</div>
          <el-input v-model="query.attachmentCount" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">编制单位</div>
          <el-input v-model="query.unit" size="small" />
        </div>
        <div class="form-item">
          <div class="form-label">编制起日期</div>
          <el-date-picker v-model="query.startDate" size="small" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
        </div>
        <div class="form-item">
          <div class="form-label">编制止日期</div>
          <el-date-picker v-model="query.endDate" size="small" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
        </div>
        <div class="form-item">
          <div class="form-label">保管期限</div>
          <el-select v-model="query.keepTerm" size="small" class="w100">
            <el-option label="永久" value="永久" />
            <el-option label="30年" value="30年" />
            <el-option label="10年" value="10年" />
          </el-select>
        </div>
        <div class="form-btns">
          <el-button size="small" type="primary" @click="doSearch">搜索</el-button>
          <el-button size="small" type="primary" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 右侧：搜索结果 -->
      <div class="rs-result">
        <div class="info-bar">
          选中信息：案卷：{{ selInfo.rolls }} 卷，件数：{{ selInfo.pieces }} 件，页数：{{ selInfo.pages }} 页
        </div>
        <el-table
          :data="pagedList"
          border
          size="small"
          height="100%"
          empty-text="暂无数据"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ pageStart + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="所在分类节点路径" prop="path" min-width="230" show-overflow-tooltip />
          <el-table-column label="档号" prop="archiveNo" width="110" align="center" sortable />
          <el-table-column label="案卷题名" prop="title" min-width="280" show-overflow-tooltip sortable />
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
            <el-option label="100条/页" :value="100" />
            <el-option label="200条/页" :value="200" />
            <el-option label="500条/页" :value="500" />
          </el-select>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
/** 案卷搜索结果 mock 池 */
const ROLL_RESULT_POOL = [
  { id: 1, path: '柯桥至诸暨高速公路工程', archiveNo: '22', title: '柯桥至诸暨高速公路工程', pieces: 1, pages: 125, sDate: '2020-05-31', eDate: '2020-05-31', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '永久' },
  { id: 2, path: '柯桥至诸暨高速公路工程/第一部分 项目申报文件', archiveNo: 'KZGS-Z-0011', title: '柯桥至诸暨高速公路工程接线桥通道、姚江枢纽互通区域施工的安全性评价报告', pieces: 1, pages: 125, sDate: '2020-05-31', eDate: '2020-05-31', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '永久' },
  { id: 3, path: '柯桥至诸暨高速公路工程/第一部分 项目申报文件', archiveNo: 'KZGS-Z-0012', title: '柯桥至诸暨高速公路工程地质灾害危险性评估报告及备案登记表、监管承压介质报告', pieces: 3, pages: 85, sDate: '2020-12-28', eDate: '2020-12-31', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '永久' },
  { id: 4, path: '柯桥至诸暨高速公路工程/第一部分 项目申报文件', archiveNo: 'KZGS-Z-0013', title: '柯桥至诸暨高速公路工程压覆矿产资源分布情况调查报告及审查意见、请示', pieces: 4, pages: 34, sDate: '2020-12-21', eDate: '2020-12-31', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '30年' },
  { id: 5, path: '柯桥至诸暨高速公路工程/第二部分 设计文件', archiveNo: 'KZGS-Z-0014', title: '柯桥至诸暨高速公路工程初勘外业验收核查总结报告、详勘勘察检查总结报告', pieces: 2, pages: 112, sDate: '2021-01-31', eDate: '2022-01-31', unit: '浙江省交通规划设计研究院有限公司', keepTerm: '永久' },
  { id: 6, path: '柯桥至诸暨高速公路工程/第二部分 设计文件', archiveNo: 'KZGS-Z-0015', title: '柯桥至诸暨高速公路工程初步设计阶段安全性评价报告、安全风险评估报告', pieces: 3, pages: 563, sDate: '2021-03-31', eDate: '2022-02-01', unit: '浙江省交通规划设计研究院有限公司', keepTerm: '永久' },
  { id: 7, path: '柯桥至诸暨高速公路工程/第三部分 工程管理文件', archiveNo: 'KZGS-Z-0016', title: '柯桥至诸暨高速公路工程社会风险评估报告及备案文件', pieces: 2, pages: 301, sDate: '2021-06-20', eDate: '2021-06-30', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '10年' },
  { id: 8, path: '柯桥至诸暨高速公路工程/第六部分 竣工（交）验收文件', archiveNo: 'KZGS-Z-0017', title: '柯桥至诸暨高速公路工程建设项目用地报批材料', pieces: 6, pages: 294, sDate: '2022-06-15', eDate: '2022-08-01', unit: '绍兴市柯诸高速公路有限公司', keepTerm: '永久' }
]

export default {
  name: 'RollSearchDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** 当前选中的分类节点名（用于标题） */
    nodeName: { type: String, default: '' }
  },
  data() {
    return {
      query: { title: '', archiveNo: '', attachmentCount: '', unit: '', startDate: '', endDate: '', keepTerm: '' },
      appliedQuery: { title: '', archiveNo: '', attachmentCount: '', unit: '', startDate: '', endDate: '', keepTerm: '' },
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
    searchTitle() {
      const name = this.nodeName || '柯桥至诸暨高速公路工程'
      return `在【${name}】及其子节点进行案卷搜索`
    },
    filteredList() {
      let l = this.list
      const q = this.appliedQuery
      if (q.title) l = l.filter(x => x.title.includes(q.title))
      if (q.archiveNo) l = l.filter(x => x.archiveNo.includes(q.archiveNo))
      if (q.unit) l = l.filter(x => x.unit.includes(q.unit))
      if (q.keepTerm) l = l.filter(x => x.keepTerm === q.keepTerm)
      if (q.startDate) l = l.filter(x => x.eDate >= q.startDate)
      if (q.endDate) l = l.filter(x => x.sDate <= q.endDate)
      return l
    },
    pagedList() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredList.slice(start, start + this.pageSize)
    },
    pageStart() {
      return (this.page - 1) * this.pageSize
    },
    /** 选中信息统计 */
    selInfo() {
      const rolls = this.selection.length
      const pieces = this.selection.reduce((s, x) => s + (x.pieces || 0), 0)
      const pages = this.selection.reduce((s, x) => s + (x.pages || 0), 0)
      return { rolls, pieces, pages }
    }
  },
  watch: {
    /** 弹窗每次打开重置查询与结果 */
    visible(v) {
      if (v) this.resetSearch()
    }
  },
  methods: {
    onSelectionChange(selection) {
      this.selection = selection || []
    },
    doSearch() {
      this.appliedQuery = { ...this.query }
      // 纯 mock：首次搜索载入结果池
      if (!this.list.length) this.list = JSON.parse(JSON.stringify(ROLL_RESULT_POOL))
      this.page = 1
    },
    resetSearch() {
      this.query = { title: '', archiveNo: '', attachmentCount: '', unit: '', startDate: '', endDate: '', keepTerm: '' }
      this.appliedQuery = { ...this.query }
      this.list = []
      this.selection = []
      this.page = 1
      this.gotoPage = 1
    },
    jumpPage() {
      const total = Math.max(1, Math.ceil(this.filteredList.length / this.pageSize))
      this.page = Math.min(Math.max(1, this.gotoPage || 1), total)
    }
  }
}
</script>

<style lang="scss">
/* 案卷搜索弹窗（append-to-body 需用全局样式） */
.roll-search-dialog {
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

  .rs-body {
    display: flex;
    gap: 10px;
    height: 480px;
  }

  .rs-form {
    width: 210px;
    flex-shrink: 0;
    overflow: auto;
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

    .form-btns {
      margin-top: 14px;

      .el-button + .el-button { margin-left: 10px; }
    }
  }

  .rs-result {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .info-bar {
      padding: 7px 10px;
      font-size: 13px;
      color: #303133;
      background: #f7f9fc;
      border-bottom: 1px solid #ebeef5;
    }

    .el-table { flex: 1; }

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
}
</style>
