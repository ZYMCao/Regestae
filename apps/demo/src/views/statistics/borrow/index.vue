<template>
  <!-- 借阅统计 -->
  <div class="app-container">
    <el-card shadow="never" header="近 30 天借阅趋势">
      <div class="chart-placeholder">折线图区域（ECharts：借阅/归还趋势）</div>
    </el-card>

    <el-card shadow="never" header="部门借阅排行" class="mt-10">
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="排名" type="index" width="60" align="center" />
        <el-table-column label="部门" prop="deptName" />
        <el-table-column label="借阅次数" prop="borrowCount" align="center" />
        <el-table-column label="按时归还率" prop="onTimeRate" align="center">
          <template slot-scope="{ row }">{{ row.onTimeRate }}%</template>
        </el-table-column>
        <el-table-column label="逾期次数" prop="overdueCount" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { statsByBorrow } from '@/api/stats'

export default {
  name: 'StatsBorrow',
  data() {
    return {
      loading: false,
      list: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      statsByBorrow().then(res => {
        this.list = res.data || []
      }).finally(() => { this.loading = false })
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-placeholder {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #fafafa;
  border-radius: 4px;
}
</style>
