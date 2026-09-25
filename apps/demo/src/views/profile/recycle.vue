<template>
  <div class="recycle-page">
    <div class="toolbar">
      <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
      <el-button size="mini" class="tool-btn" :disabled="!selections.length" @click="handleRestore"><i class="el-icon-refresh-right c-grey" />还原</el-button>
      <el-button size="mini" class="tool-btn" @click="handleProperty"><i class="el-icon-view c-teal" />属性</el-button>
      <span class="date-label">起日期</span>
      <el-date-picker v-model="startDate" type="date" value-format="yyyy-MM-dd" size="small" class="date-picker" />
      <span class="date-label">止日期</span>
      <el-date-picker v-model="endDate" type="date" value-format="yyyy-MM-dd" size="small" class="date-picker" />
      <el-input v-model="keyword" placeholder="请输入名称" size="small" clearable class="kw-input" @keyup.enter.native="doSearch">
        <i slot="prefix" class="el-icon-search kw-prefix" />
      </el-input>
      <el-button size="small" class="search-btn" @click="doSearch"><i class="el-icon-search" />搜索</el-button>
    </div>
    <el-table
      ref="table"
      :data="filteredRows"
      border
      stripe
      size="mini"
      height="calc(100% - 92px)"
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="40" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="type" label="类型" width="200" align="center" />
      <el-table-column prop="name" label="名称" min-width="700" align="center" show-overflow-tooltip />
      <el-table-column prop="deleteTime" label="删除时间" min-width="400" align="center" />
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
// 回收站记录（静态演示）
const ROWS = []

export default {
  name: 'ProfileRecycle',
  data() {
    return {
      startDate: '2026-09-01',
      endDate: '2026-09-01',
      keyword: '',
      rows: ROWS,
      selections: [],
      page: 1,
      pageInput: '1',
      pageSize: 100
    }
  },
  computed: {
    filteredRows() {
      const kw = this.keyword.trim()
      let list = this.rows
      if (kw) {
        list = list.filter(r => r.name.indexOf(kw) > -1)
      }
      if (this.startDate) {
        list = list.filter(r => r.deleteTime >= this.startDate)
      }
      if (this.endDate) {
        list = list.filter(r => r.deleteTime <= this.endDate + ' 23:59:59')
      }
      return list
    }
  },
  methods: {
    doSearch() {
      // 列表已随 keyword/日期 计算过滤
    },
    handleRefresh() {
      this.keyword = ''
      this.$message.success('已刷新')
    },
    handleRestore() {
      this.$confirm('确认还原选中的 ' + this.selections.length + ' 条记录吗？', '提示', { type: 'warning' })
        .then(() => {
          const ids = this.selections.map(s => s.id)
          this.rows = this.rows.filter(r => ids.indexOf(r.id) === -1)
          this.$message.success('还原成功')
        })
        .catch(() => {})
    },
    handleProperty() {
      if (!this.selections.length) {
        this.$message.warning('请先选择记录')
        return
      }
      this.$message.info('查看属性')
    },
    handleSelectionChange(rows) {
      this.selections = rows
    }
  }
}
</script>

<style lang="scss" scoped>
.recycle-page {
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

  .kw-input {
    width: 170px;
    margin: 0 8px 0 4px;

    .kw-prefix {
      margin-left: 4px;
      color: #909399;
    }
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
.c-grey { color: #909399; }
.c-teal { color: #13c2c2; }
</style>
