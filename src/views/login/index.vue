<template>
  <!-- 登录页：用户名 + 密码 + 验证码（可选） -->
  <div class="login-container">
    <div class="login-box">
      <!-- 左侧品牌区 -->
      <div class="login-banner">
        <h1>{{ title }}</h1>
        <p>档案全生命周期管理平台</p>
        <ul class="feature-list">
          <li><i class="el-icon-download" /> 档案接收</li>
          <li><i class="el-icon-s-operation" /> 档案整理</li>
          <li><i class="el-icon-box" /> 档案保存</li>
          <li><i class="el-icon-view" /> 档案利用</li>
          <li><i class="el-icon-delete" /> 鉴定处置</li>
        </ul>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-form-wrap">
        <h2 class="form-title">用户登录</h2>
        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          label-position="top"
          @submit.native.prevent="handleLogin"
        >
          <!-- 用户名 -->
          <el-form-item prop="username" label="用户名">
            <el-input
              ref="username"
              v-model.trim="loginForm.username"
              prefix-icon="el-icon-user"
              placeholder="请输入用户名"
              name="username"
              type="text"
              tabindex="1"
              auto-complete="on"
            />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password" label="密码">
            <el-input
              :key="passwordType"
              ref="password"
              v-model.trim="loginForm.password"
              :type="passwordType"
              prefix-icon="el-icon-lock"
              placeholder="请输入密码（至少6位）"
              name="password"
              tabindex="2"
              auto-complete="on"
            />
            <span class="show-pwd" @click="toggleShowPwd">
              <i :class="passwordType === 'password' ? 'el-icon-view' : 'el-icon-hide'" />
            </span>
          </el-form-item>

          <!-- 验证码（后端未就绪时自动隐藏） -->
          <el-form-item v-if="captchaEnabled" prop="code" label="验证码">
            <div class="captcha-row">
              <el-input
                v-model.trim="loginForm.code"
                prefix-icon="el-icon-key"
                placeholder="验证码"
                name="code"
                tabindex="3"
              />
              <img
                v-if="codeUrl"
                :src="codeUrl"
                class="captcha-img"
                title="看不清？点击刷新"
                @click="getCode"
              >
            </div>
          </el-form-item>

          <!-- 登录按钮：loading 状态防重复提交 -->
          <el-form-item>
            <el-button
              :loading="loading"
              type="primary"
              class="login-btn"
              native-type="submit"
            >登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { login, getCodeImg } from '@/api/auth'
import { setToken } from '@/utils/auth'

export default {
  name: 'Login',
  data() {
    // 自定义校验器：用户名非空
    const validateUsername = (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('请输入用户名'))
      } else {
        callback()
      }
    }
    // 自定义校验器：密码非空且不少于 6 位
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码不能少于 6 位'))
      } else {
        callback()
      }
    }
    return {
      title: import.meta.env.VITE_TITLE || '电子档案管理系统',
      codeUrl: '',            // 验证码图片（base64）
      captchaEnabled: false,  // 是否开启验证码（获取接口成功后置为 true）
      loginForm: {
        username: 'admin',
        password: 'admin123',
        code: '',
        uuid: ''              // 验证码唯一标识（后端校验用）
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        code: [{ required: true, trigger: 'blur', message: '请输入验证码' }]
      },
      loading: false,         // 登录请求进行中（防抖标志）
      passwordType: 'password',
      redirect: undefined,    // 登录成功后的回跳地址
      otherQuery: {}          // 其他 query 参数
    }
  },
  watch: {
    // 监听路由变化，获取 redirect 参数（退出登录后回跳场景）
    $route: {
      handler(route) {
        this.redirect = route.query && route.query.redirect
        this.otherQuery = this.getOtherQuery(route.query)
      },
      immediate: true
    }
  },
  created() {
    // DEMO 模式（VITE_USE_MOCK=true）不请求验证码接口，避免后端未就绪时弹出网络错误提示
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      this.getCode()
    }
  },
  methods: {
    /**
     * 获取验证码
     * 接口失败（如后端未启动）时保持 captchaEnabled=false，隐藏验证码框，不阻塞登录调试
     */
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.data && res.data.captchaEnabled !== false
        this.codeUrl = res.data && res.data.img ? 'data:image/gif;base64,' + res.data.img : ''
        this.loginForm.uuid = (res.data && res.data.uuid) || ''
      }).catch(() => {
        this.captchaEnabled = false
      })
    },

    // 显示/隐藏密码
    toggleShowPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },

    /**
     * 登录：写入本地登录态（DEMO 模式）后跳转到电子档案接收模块
     */
    handleLogin() {
      const token = 'mock-token-' + Date.now()
      setToken(token)
      this.$store.commit('user/SET_TOKEN', token)
      this.$router.push({ path: '/archive-receive' })
    },

    // 提取 query 中除 redirect 外的其他参数
    getOtherQuery(query) {
      return Object.keys(query || {}).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1f3a5f 0%, #2b5f8f 100%);

  .login-box {
    display: flex;
    width: 820px;
    max-width: 92%;
    margin: auto;
    background: #fff;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .login-banner {
    width: 40%;
    background: linear-gradient(160deg, #1f3a5f, #2b5f8f);
    color: #fff;
    padding: 60px 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    h1 {
      font-size: 22px;
      margin: 0 0 8px;
    }
    p {
      opacity: 0.8;
      font-size: 13px;
      margin: 0 0 30px;
    }
    .feature-list {
      padding: 0;
      li {
        list-style: none;
        margin: 14px 0;
        font-size: 14px;
        i {
          margin-right: 8px;
        }
      }
    }
  }

  .login-form-wrap {
    flex: 1;
    padding: 50px 50px 30px;

    .form-title {
      font-size: 20px;
      margin: 0 0 20px;
      color: #303133;
    }

    .captcha-row {
      display: flex;
      align-items: center;

      .captcha-img {
        height: 40px;
        margin-left: 10px;
        border-radius: 4px;
        cursor: pointer;
        border: 1px solid #dcdfe6;
      }
    }

    .login-btn {
      width: 100%;
      margin-top: 6px;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #889aa4;
    cursor: pointer;
    user-select: none;
  }
}

// 小屏隐藏品牌区
@media (max-width: 768px) {
  .login-banner {
    display: none;
  }
}
</style>
