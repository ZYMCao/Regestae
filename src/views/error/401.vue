<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">401</h1>
      <p class="error-desc">抱歉，您没有权限访问该页面</p>
      <el-button type="primary" @click="$router.push('/login')">重新登录</el-button>
    </div>
  </div>
</template>

<script>
export default { name: 'Unauthorized' }
</script>

<style lang="scss" scoped>
.error-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  text-align: center;

  .error-code {
    font-size: 120px;
    margin: 0;
    color: #e6a23c;
    line-height: 1;
  }
  .error-desc {
    color: #909399;
    margin: 16px 0 24px;
  }
}
</style>
