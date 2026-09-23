<template>
  <!-- 日志管理：操作日志 / 登录日志 双 Tab -->
  <div class="app-container log-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="操作日志" name="oper">
        <el-table v-loading="loading" :data="list" border stripe height="calc(100% - 50px)">
          <el-table-column label="操作人" prop="operName" width="110" />
          <el-table-column label="模块" prop="module" width="130" />
          <el-table-column label="操作类型" prop="action" width="110" align="center" />
          <el-table-column label="请求地址" prop="url" min-width="180" show-overflow-tooltip />
          <el-table-column label="IP" prop="operIp" width="130" />
          <el-table-column label="耗时(ms)" prop="costTime" width="90" align="center" />
          <el-table-column label="结果" width="80" align="center">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">{{ row.status === 0 ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作时间" prop="operTime" width="160" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="登录日志" name="login">
        <el-table v-loading="loading" :data="list" border stripe height="calc(100% - 50px)">
          <el-table-column label="用户名" prop="userName" width="120" />
          <el-table-column label="IP" prop="ipaddr" width="140" />
          <el-table-column label="登录地点" prop="loginLocation" width="140" />
          <el-table-column label="浏览器" prop="browser" width="130" />
          <el-table-column label="操作系统" prop="os" min-width="140" />
          <el-table-column label="结果" width="80" align="center">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">{{ row.status === 0 ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登录时间" prop="loginTime" width="160" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>
  </div>
</template>

<script>
import { listOperLog, listLoginLog } from '@/api/system'

export default {
  name: 'SystemLog',
  data() {
    return {
      activeTab: 'oper',
      loading: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10 }
    }
  },
  created() {
    // this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const request = this.activeTab === 'oper' ? listOperLog(this.queryParams) : listLoginLog(this.queryParams)
      request.then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    handleTabChange() {
      this.queryParams.pageNum = 1
      // this.getList()
    }
  }
}
</script>

<style lang="scss" scoped>
.log-container {
  height: 100%;
  width: 100%;

  ::v-deep .el-tabs {
    height: 100%;

    .el-tabs__content {
      height: calc(100% - 50px);

      .el-tab-pane {
        height: 100%;
      }
    }
  }
}

</style>
