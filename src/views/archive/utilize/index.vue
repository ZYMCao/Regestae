<template>
  <!-- 档案利用：利用申请与审批 -->
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
      <el-form-item label="申请人" prop="applicant">
        <el-input v-model="queryParams.applicant" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="申请单号" prop="applyNo" width="150" />
      <el-table-column label="档案题名" prop="archiveTitle" min-width="200" show-overflow-tooltip />
      <el-table-column label="利用方式" prop="utilizeType" width="100" align="center" />
      <el-table-column label="申请人" prop="applicant" width="100" />
      <el-table-column label="申请时间" prop="applyTime" width="160" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : row.status === '2' ? 'danger' : 'warning'" size="small">
            {{ ['待审批', '已通过', '已驳回'][row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template slot-scope="{ row }">
          <template v-if="row.status === '0'">
            <el-button size="mini" type="text" @click="handleAudit(row, 1)">通过</el-button>
            <el-button size="mini" type="text" @click="handleAudit(row, 2)">驳回</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listUtilize, auditUtilize } from '@/api/archive'

export default {
  name: 'ArchiveUtilize',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10, applicant: '' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listUtilize(this.queryParams).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.$refs.queryForm.resetFields()
      this.handleQuery()
    },
    handleAudit(row, action) {
      auditUtilize({ id: row.id, action }).then(() => {
        this.$message.success('审批完成')
        this.getList()
      })
    }
  }
}
</script>
