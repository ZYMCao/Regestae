<template>
  <!-- 借阅记录：历史记录查询 -->
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
      <el-form-item label="借阅人" prop="borrowUser">
        <el-input v-model="queryParams.borrowUser" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="借阅单号" prop="borrowNo" width="150" />
      <el-table-column label="档案题名" prop="archiveTitle" min-width="200" show-overflow-tooltip />
      <el-table-column label="借阅人" prop="borrowUser" width="100" />
      <el-table-column label="借出日期" prop="borrowDate" width="110" />
      <el-table-column label="归还日期" prop="returnDate" width="110" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '2' ? 'success' : row.status === '3' ? 'danger' : 'warning'" size="small">
            {{ ({ 0: '借阅中', 1: '待审批', 2: '已归还', 3: '已逾期' })[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listBorrowRecord } from '@/api/borrow'

export default {
  name: 'BorrowRecord',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      dateRange: [],
      queryParams: { pageNum: 1, pageSize: 10, borrowUser: '' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      if (this.dateRange && this.dateRange.length === 2) {
        params.beginTime = this.dateRange[0]
        params.endTime = this.dateRange[1]
      }
      listBorrowRecord(params).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.$refs.queryForm.resetFields()
      this.handleQuery()
    }
  }
}
</script>
