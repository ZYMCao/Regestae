<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script>
export default { name: 'NotFound' }
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
    color: #409eff;
    line-height: 1;
  }
  .error-desc {
    color: #909399;
    margin: 16px 0 24px;
  }
}
</style>
