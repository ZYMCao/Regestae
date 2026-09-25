<template>
  <div class="todo-page">
    <div class="toolbar">
      <el-button size="mini" class="tool-btn" @click="doSearch"><i class="el-icon-search c-blue" />搜索</el-button>
      <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
      <el-button size="mini" class="tool-btn" @click="handleAudit"><i class="el-icon-user c-blue" />审核</el-button>
      <el-input v-model="keyword" placeholder="请输入审核内容摘要信息" size="small" clearable class="kw-input" @keyup.enter.native="doSearch">
        <el-button slot="append" icon="el-icon-search" @click="doSearch" />
      </el-input>
    </div>
    <el-table
      ref="table"
      :data="filteredRows"
      border
      stripe
      size="mini"
      height="calc(100% - 60px)"
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="40" align="center" />
      <el-table-column type="index" label="序号" min-width="280" align="center" />
      <el-table-column prop="summary" label="审核内容摘要信息" min-width="360" align="center" show-overflow-tooltip />
      <el-table-column prop="flow" label="审核流程" width="160" align="center" />
      <el-table-column prop="detail" label="文件详情" width="150" align="center" />
      <el-table-column prop="submitter" label="提清人" width="200" align="center" />
      <el-table-column prop="submitTime" label="提清时间" width="200" align="center" />
    </el-table>
  </div>
</template>

<script>
// 待办事项（静态演示）
const ROWS = []

export default {
  name: 'ProfileTodo',
  data() {
    return {
      keyword: '',
      rows: ROWS,
      selections: []
    }
  },
  computed: {
    filteredRows() {
      const kw = this.keyword.trim()
      if (!kw) return this.rows
      return this.rows.filter(r => r.summary.indexOf(kw) > -1)
    }
  },
  methods: {
    doSearch() {
      // 列表已随 keyword 计算过滤
    },
    handleRefresh() {
      this.keyword = ''
      this.$message.success('已刷新')
    },
    handleAudit() {
      if (!this.selections.length) {
        this.$message.warning('请先选择待办事项')
        return
      }
      this.$message.success('审核操作成功')
    },
    handleSelectionChange(rows) {
      this.selections = rows
    }
  }
}
</script>

<style lang="scss" scoped>
.todo-page {
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

    i {
      margin-right: 3px;
    }
  }

  .kw-input {
    width: 240px;
    margin-left: 6px;
  }
}

.c-blue { color: $themeColor; }
.c-green { color: #67c23a; }
</style>
