<template>
  <!-- 个人中心：用户信息展示 -->
  <div class="profile-container">
    <el-card shadow="never" header="个人信息">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ name }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-for="role in roles" :key="role" size="small" class="mr">{{ role }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="权限数">{{ permissions.length }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Profile',
  computed: {
    ...mapState('user', ['name', 'nickname', 'roles', 'permissions'])
  }
}
</script>

<style lang="scss" scoped>
.profile-container {
  max-width: 800px;
  .mr { margin-right: 6px; }
}
</style>
