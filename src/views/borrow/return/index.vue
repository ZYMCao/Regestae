<template>
  <!-- 档案归还：归还确认 -->
  <div class="app-container">
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="借阅单号" prop="borrowNo" width="150" />
      <el-table-column label="档案题名" prop="archiveTitle" min-width="200" show-overflow-tooltip />
      <el-table-column label="借阅人" prop="borrowUser" width="100" />
      <el-table-column label="借出日期" prop="borrowDate" width="110" />
      <el-table-column label="应还日期" prop="dueDate" width="110" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.overdue ? 'danger' : 'primary'" size="small">{{ row.overdue ? '已逾期' : '借阅中' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-refresh-left" @click="handleReturn(row)">归还</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listBorrow, returnArchive } from '@/api/borrow'

export default {
  name: 'BorrowReturn',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10, status: '0' } // 只查借阅中
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listBorrow(this.queryParams).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    /** 归还确认 */
    handleReturn(row) {
      this.$confirm(`确认归还档案「${row.archiveTitle}」吗？`, '提示', { type: 'warning' })
        .then(() => returnArchive({ id: row.id }))
        .then(() => {
          this.$message.success('归还登记成功')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>
