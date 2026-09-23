<template>
  <!-- 档案接收：待接收列表 + 确认接收 -->
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
      <el-form-item label="移交单位" prop="transferOrg">
        <el-input v-model="queryParams.transferOrg" placeholder="请输入移交单位" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="接收状态" clearable style="width: 140px">
          <el-option label="待接收" value="0" />
          <el-option label="已接收" value="1" />
          <el-option label="已退回" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="移交单号" prop="transferNo" width="150" />
      <el-table-column label="移交单位" prop="transferOrg" min-width="180" show-overflow-tooltip />
      <el-table-column label="档案数量" prop="count" width="90" align="center" />
      <el-table-column label="移交人" prop="transferUser" width="100" />
      <el-table-column label="移交日期" prop="transferDate" width="110" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : row.status === '2' ? 'danger' : 'warning'" size="small">
            {{ ['待接收', '已接收', '已退回'][row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template slot-scope="{ row }">
          <template v-if="row.status === '0'">
            <el-button size="mini" type="text" icon="el-icon-check" @click="handleConfirm(row, 1)">接收</el-button>
            <el-button size="mini" type="text" icon="el-icon-back" @click="handleConfirm(row, 2)">退回</el-button>
          </template>
          <el-button v-else size="mini" type="text" icon="el-icon-view" @click="handleDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listReceive, confirmReceive } from '@/api/archive'

export default {
  name: 'ArchiveReceive',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10, transferOrg: '', status: '' }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listReceive(this.queryParams).then(res => {
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
    /** 确认接收 / 退回 */
    handleConfirm(row, action) {
      const text = action === 1 ? '接收' : '退回'
      this.$confirm(`确认${text}移交单 ${row.transferNo} 吗？`, '提示', { type: 'warning' })
        .then(() => confirmReceive({ id: row.id, action }))
        .then(() => {
          this.$message.success(`${text}成功`)
          this.getList()
        }).catch(() => {})
    },
    handleDetail(row) {
      // TODO: 跳转详情页或打开弹窗
      this.$message.info(`查看移交单：${row.transferNo}`)
    }
  }
}
</script>
