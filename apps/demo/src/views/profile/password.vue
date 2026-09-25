<template>
  <!-- 修改密码 -->
  <div class="password-container">
    <el-card shadow="never" header="修改密码">
      <el-form ref="pwdForm" :model="form" :rules="rules" label-width="100px" style="max-width: 420px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="form.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Password',
  data() {
    const confirmValidator = (rule, value, callback) => {
      if (value !== this.form.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      form: { oldPassword: '', newPassword: '', confirmPassword: '' },
      rules: {
        oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: confirmValidator, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submit() {
      this.$refs.pwdForm.validate(valid => {
        if (!valid) return
        this.loading = true
        // TODO: 调用 updatePwd 接口（后端就绪后接入）
        setTimeout(() => {
          this.loading = false
          this.$message.success('密码修改成功，请重新登录')
          this.$store.dispatch('user/resetToken').then(() => {
            this.$router.push('/login')
          })
        }, 500)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.password-container {
  max-width: 600px;
}
</style>
