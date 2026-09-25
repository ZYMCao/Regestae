<template>
  <!-- 档案鉴定与处置：到期鉴定、销毁审批 -->
  <div class="app-container">
    <el-alert title="对保管期满的档案进行价值鉴定，决定继续保存或销毁处置（销毁需双人复核审批）" type="warning" :closable="false" class="mb-10" />
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="档案编号" prop="archiveNo" width="140" />
      <el-table-column label="题名" prop="title" min-width="200" show-overflow-tooltip />
      <el-table-column label="保管期限" prop="storagePeriod" width="100" align="center" />
      <el-table-column label="到期日期" prop="expireDate" width="110" />
      <el-table-column label="鉴定状态" width="100" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.appraised ? 'success' : 'info'" size="small">{{ row.appraised ? '已鉴定' : '待鉴定' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-s-check" @click="handleAppraise(row)">继续保存</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" class="danger-text" @click="handleDestroy(row)">申请销毁</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listAppraisal, submitAppraisal } from '@/api/archive'

export default {
  name: 'ArchiveAppraisal',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10 }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listAppraisal(this.queryParams).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    /** 鉴定：继续保存 */
    handleAppraise(row) {
      this.$confirm(`确认将 ${row.archiveNo} 继续保存（延长保管期限）吗？`, '提示', { type: 'warning' })
        .then(() => submitAppraisal({ id: row.id, result: 'keep' }))
        .then(() => {
          this.$message.success('已登记继续保存')
          this.getList()
        }).catch(() => {})
    },
    /** 鉴定：申请销毁 */
    handleDestroy(row) {
      this.$confirm(`确认对 ${row.archiveNo} 发起销毁审批流程吗？销毁需审批通过后执行`, '危险操作', { type: 'error' })
        .then(() => submitAppraisal({ id: row.id, result: 'destroy' }))
        .then(() => {
          this.$message.success('已提交销毁审批')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.danger-text {
  color: #f56c6c;
}
</style>
