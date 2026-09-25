<template>
  <!--
    收集移交文件弹窗：左侧移交事务列表 + 右侧移交文件目录表格
    纯静态 DEMO
  -->
  <el-dialog
    title="收集移交文件"
    :visible.sync="dialogVisible"
    width="1100px"
    custom-class="transfer-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="transfer-body">
      <!-- 左侧：移交事务列表 -->
      <div class="left-panel">
        <div class="panel-header">移交事务列表</div>
        <div class="list-wrap">
          <div
            v-for="item in pagedTransactions"
            :key="item.id"
            :class="['tx-item', { active: currentTx && currentTx.id === item.id }]"
            @click="onTxClick(item)"
          >
            <div class="tx-name">{{ item.name }}</div>
            <div class="tx-meta">
              <span>{{ item.unit }}</span>
              <span>{{ item.date }}</span>
            </div>
          </div>
          <div v-if="!pagedTransactions.length" class="empty-tip">暂无数据</div>
        </div>
        <div class="left-footer">
          <el-input
            v-model="keyword"
            size="small"
            placeholder="搜索事务名称"
            clearable
            @keyup.enter.native="doSearch"
          >
            <i slot="suffix" class="el-icon-search el-input__icon" @click="doSearch" />
          </el-input>
          <el-select v-model="statusFilter" size="small" placeholder="未收集" @change="doSearch">
            <el-option label="未收集" value="未收集" />
            <el-option label="已收集" value="已收集" />
            <el-option label="全部" value="" />
          </el-select>
        </div>
      </div>

      <!-- 右侧：移交文件目录 -->
      <div class="right-panel">
        <div class="panel-header blue">移交文件目录</div>
        <el-table
          :data="pagedFiles"
          border
          size="small"
          height="100%"
          empty-text="暂无数据"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">{{ fileStart + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件名称" prop="name" min-width="180" align="center" show-overflow-tooltip />
          <el-table-column label="文件格式" prop="format" width="100" align="center" />
          <el-table-column label="文件大小" prop="size" width="90" align="center" />
          <el-table-column label="项目名称" prop="project" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column label="移交单位" prop="unit" min-width="140" align="center" show-overflow-tooltip sortable />
          <el-table-column label="移交人" prop="person" width="100" align="center" sortable />
          <el-table-column label="移交日期" prop="date" width="110" align="center" sortable />
        </el-table>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" size="small" :disabled="!selection.length" @click="confirm">确定</el-button>
      <el-button size="small" @click="visible = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
/** 移交事务 mock */
const TX_LIST = [
  { id: 1, name: 'TJ01标段第一次移交', unit: '柯诸高速TJ01标项目经理部', date: '2026-08-12', status: '未收集' },
  { id: 2, name: 'TJ02标段八月移交', unit: '柯诸高速TJ02标项目经理部', date: '2026-08-20', status: '未收集' },
  { id: 3, name: '监理办声像文件移交', unit: '总监理工程师办公室', date: '2026-09-01', status: '已收集' },
  { id: 4, name: 'TJ03标段竣工文件移交', unit: '柯诸高速TJ03标项目经理部', date: '2026-09-05', status: '未收集' }
]

/** 移交文件目录 mock（选中事务后展示） */
const FILE_LIST = [
  { id: 1, name: '桥梁工程开工报告.pdf', format: 'pdf', size: '2.4MB', project: '柯桥至诸暨高速公路工程', unit: '柯诸高速TJ01标项目经理部', person: '黄宇聪', date: '2026-08-12' },
  { id: 2, name: '路基压实度检测报告.docx', format: 'docx', size: '860KB', project: '柯桥至诸暨高速公路工程', unit: '柯诸高速TJ01标项目经理部', person: '吴伊杨', date: '2026-08-12' },
  { id: 3, name: '隐蔽工程验收记录.xlsx', format: 'xlsx', size: '320KB', project: '柯桥至诸暨高速公路工程', unit: '柯诸高速TJ02标项目经理部', person: '刘锴', date: '2026-08-20' },
  { id: 4, name: '监理周报202608.zip', format: 'zip', size: '15.8MB', project: '柯桥至诸暨高速公路工程', unit: '总监理工程师办公室', person: '张监理', date: '2026-09-01' }
]

export default {
  name: 'TransferDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      keyword: '',
      appliedKeyword: '',
      statusFilter: '未收集',
      txList: TX_LIST,
      currentTx: null,
      fileList: [],
      selection: []
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
    filteredTx() {
      let list = this.txList
      if (this.appliedKeyword) list = list.filter(x => x.name.includes(this.appliedKeyword))
      if (this.statusFilter) list = list.filter(x => x.status === this.statusFilter)
      return list
    },
    pagedTransactions() {
      return this.filteredTx
    },
    pagedFiles() {
      return this.fileList
    },
    fileStart() {
      return 0
    }
  },
  watch: {
    /** 弹窗打开时重置 */
    visible(v) {
      if (v) this.resetAll()
    }
  },
  methods: {
    resetAll() {
      this.keyword = ''
      this.appliedKeyword = ''
      this.statusFilter = '未收集'
      this.currentTx = null
      this.fileList = []
      this.selection = []
    },
    doSearch() {
      this.appliedKeyword = this.keyword.trim()
    },
    onTxClick(tx) {
      this.currentTx = tx
      // 纯 mock：选中事务后给文件目录数据
      this.fileList = JSON.parse(JSON.stringify(FILE_LIST))
      this.selection = []
    },
    onSelectionChange(selection) {
      this.selection = selection || []
    },
    confirm() {
      if (!this.selection.length) {
        this.$message.warning('请先选择文件')
        return
      }
      this.$emit('confirm', { tx: this.currentTx, files: this.selection })
      this.visible = false
    }
  }
}
</script>

<style lang="scss">
/* 收集移交文件弹窗（append-to-body 需用全局样式） */
.transfer-dialog {
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

  .transfer-body {
    display: flex;
    gap: 10px;
    height: 460px;
  }

  .panel-header {
    padding: 7px 10px;
    background: #e8f3fd;
    font-size: 13px;
    font-weight: 600;
    color: #303133;

    &.blue {
      background: $themeColor;
      color: #fff;
    }
  }

  .left-panel {
    width: 230px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .list-wrap {
      flex: 1;
      overflow: auto;

      .tx-item {
        padding: 8px 10px;
        border-bottom: 1px solid #f0f2f5;
        cursor: pointer;

        &:hover { background: #f5f7fa; }

        &.active {
          background: #e8f3fd;
          .tx-name { color: $themeColor; }
        }

        .tx-name {
          font-size: 13px;
          color: #303133;
          line-height: 1.4;
        }

        .tx-meta {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          margin-top: 4px;
          font-size: 12px;
          color: #909399;
        }
      }

      .empty-tip {
        padding: 40px 0;
        text-align: center;
        font-size: 13px;
        color: #909399;
      }
    }

    .left-footer {
      padding: 8px;
      border-top: 1px solid #ebeef5;

      .el-select { width: 100%; margin-top: 6px; }
    }
  }

  .right-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .el-table { flex: 1; }
  }

  .dialog-footer { text-align: right; }
}
</style>
