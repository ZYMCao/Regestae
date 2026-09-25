<template>
  <div class="history-page">
    <div class="toolbar">
      <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
      <span class="date-label">起日期</span>
      <el-date-picker v-model="startDate" type="date" value-format="yyyy-MM-dd" size="small" class="date-picker" />
      <span class="date-label">止日期</span>
      <el-date-picker v-model="endDate" type="date" value-format="yyyy-MM-dd" size="small" class="date-picker" />
      <el-button size="small" class="search-btn" @click="doSearch"><i class="el-icon-search" />搜索</el-button>
    </div>
    <el-table
      :data="filteredRows"
      border
      stripe
      size="mini"
      height="calc(100% - 92px)"
      row-key="id"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="opTime" label="操作时间" min-width="300" align="center" sortable />
      <el-table-column prop="detail" label="详细情况" min-width="380" align="center" show-overflow-tooltip />
      <el-table-column prop="parentNode" label="父节点" min-width="200" align="center" />
      <el-table-column prop="rid" label="RID" min-width="190" align="center" />
      <el-table-column prop="iids" label="IIDS" min-width="190" align="center" />
      <el-table-column prop="abnormal" label="是否异常" min-width="180" align="center" sortable />
      <el-table-column prop="ip" label="IP" min-width="190" align="center" />
    </el-table>
    <div class="pager-bar">
      <span class="pager-total">共 {{ filteredRows.length }} 条</span>
      <el-pagination layout="prev, pager, next" :total="filteredRows.length" :page-size="100" :current-page.sync="page" class="pager" />
      <span class="pager-jump">前往 <input v-model="pageInput" class="page-input" disabled> 页</span>
      <el-select v-model="pageSize" size="mini" class="page-size-dd" disabled>
        <el-option label="100条/页" :value="100" />
      </el-select>
    </div>
  </div>
</template>

<script>
// 工作历程记录（静态演示）
const ROWS = []

export default {
  name: 'ProfileHistory',
  data() {
    return {
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      rows: ROWS,
      page: 1,
      pageInput: '1',
      pageSize: 100
    }
  },
  computed: {
    filteredRows() {
      let list = this.rows
      if (this.startDate) {
        list = list.filter(r => r.opTime >= this.startDate)
      }
      if (this.endDate) {
        list = list.filter(r => r.opTime <= this.endDate + ' 23:59:59')
      }
      return list
    }
  },
  methods: {
    doSearch() {
      // 列表已随日期计算过滤
    },
    handleRefresh() {
      this.$message.success('已刷新')
    }
  }
}
</script>

<style lang="scss" scoped>
.history-page {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  padding: 8px 12px;
  display: flex;
  align-items: center;

  .tool-btn {
    font-size: 12px;
    margin-right: 8px;

    i {
      margin-right: 3px;
    }
  }

  .date-label {
    font-size: 13px;
    color: #303133;
    margin: 0 6px 0 2px;
  }

  .date-picker {
    width: 140px;
    margin-right: 10px;
  }

  .search-btn {
    font-size: 12px;

    i {
      margin-right: 3px;
      color: $themeColor;
    }
  }
}

.pager-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;

  .pager-total {
    font-size: 12px;
    color: #606266;
    margin-right: 12px;
  }

  .pager-jump {
    font-size: 12px;
    color: #606266;
    margin: 0 10px;

    .page-input {
      width: 40px;
      height: 24px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      text-align: center;
      margin: 0 4px;
    }
  }

  .page-size-dd {
    width: 100px;
  }
}

.c-green { color: #67c23a; }
</style>
