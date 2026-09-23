<template>
  <!-- 分类统计：门类/年度/保管期限维度统计（图表区预留 ECharts 接入） -->
  <div class="app-container">
    <el-row :gutter="16">
      <el-col :md="10">
        <el-card shadow="never" header="按门类分布">
          <div class="chart-placeholder">饼图区域（ECharts：门类占比）</div>
        </el-card>
      </el-col>
      <el-col :md="14">
        <el-card shadow="never" header="按年度归档数量">
          <div class="chart-placeholder">柱状图区域（ECharts：年度趋势）</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="统计明细" class="mt-10">
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column label="门类" prop="archiveType" width="140" />
        <el-table-column label="档案总数" prop="totalCount" align="center" />
        <el-table-column label="永久保存" prop="permanentCount" align="center" />
        <el-table-column label="定期30年" prop="p30Count" align="center" />
        <el-table-column label="定期10年" prop="p10Count" align="center" />
        <el-table-column label="电子文件数(GB)" prop="digitalSize" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { statsByCategory } from '@/api/stats'

export default {
  name: 'StatsCategory',
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
      statsByCategory().then(res => {
        this.list = res.data || []
        // TODO: 将 list 渲染为 ECharts 图表
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
