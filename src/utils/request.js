import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// 统一错误提示（去重：同一时间相同错误只弹一次）
const errMessages = []
function showError(msg) {
  if (errMessages.includes(msg)) return
  errMessages.push(msg)
  Message({ message: msg || '系统未知错误', type: 'error', duration: 3 * 1000 })
  setTimeout(() => {
    const i = errMessages.indexOf(msg)
    if (i > -1) errMessages.splice(i, 1)
  }, 3000)
}

// 创建 axios 实例
const service = axios.create({
  // .env 中配置的接口前缀（/dev-api、/test-api、/prod-api）
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 15000 // 请求超时 15s
})

// ---------------- 请求拦截器 ----------------
service.interceptors.request.use(
  config => {
    // 自动携带 token（后端约定格式：请求头 Authorization: Bearer xxx）
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => Promise.reject(error)
)

// ---------------- 响应拦截器 ----------------
service.interceptors.response.use(
  /**
   * 后端统一响应结构约定（SpringBoot 常见做法）：
   * { code: 200, msg: '操作成功', data: {...} }
   * code === 200 视为业务成功；401 未授权；500 业务异常；非对象返回原样
   */
  response => {
    const res = response.data

    // 二进制数据（文件下载/导出）直接返回，不做包装处理
    if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
      return response
    }

    // 非统一结构（如第三方接口）原样返回
    if (typeof res.code === 'undefined') {
      return res
    }

    const code = res.code
    if (code === 401) {
      // 未授权：提示一次并跳转登录页
      MessageBox.confirm('登录状态已过期，您可以取消以停留在此页，或重新登录', '系统提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        store.dispatch('user/resetToken').then(() => {
          location.reload() // 重新加载，路由守卫会自动重定向到 /login
        })
      })
      return Promise.reject(new Error('未授权'))
    } else if (code !== 200) {
      showError(res.msg)
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    // HTTP 层错误（网络断开、超时、404/500 等）
    let message = error.message
    if (message === 'Network Error') {
      message = '网络连接异常'
    } else if (message.includes('timeout')) {
      message = '请求超时'
    } else if (error.response) {
      switch (error.response.status) {
        case 400: message = '请求参数错误'; break
        case 401: message = '未授权，请重新登录'; break
        case 403: message = '拒绝访问'; break
        case 404: message = '请求地址不存在'; break
        case 500: message = '服务器内部错误'; break
        case 502: message = '网关错误'; break
        case 503: message = '服务不可用'; break
        default: message = `连接错误 ${error.response.status}`
      }
    }
    showError(message)
    return Promise.reject(error)
  }
)

export default service
