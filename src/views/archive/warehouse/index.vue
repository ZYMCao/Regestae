<template>
  <!-- 电子档案库房管理（骨架页） -->
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>电子档案库房管理</span>
      </div>
      <el-empty description="库房管理功能建设中（档案柜 / 架位 / 环境监控等）" />
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ArchiveWarehouse',
  data() {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}
</style>
