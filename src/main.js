/**
 * main.js：应用入口
 * 职责：注册 Vue 实例、Element UI、全局样式、路由、Vuex、全局指令
 */
import Vue from 'vue'

// ---------------- ResizeObserver 循环报错修复 ----------------
// 消除浏览器已知良性报错："ResizeObserver loop completed with undelivered
// notifications"。原因：ResizeObserver 回调里的布局变化又触发新的通知，
// 同一帧内无法投递完毕。方案：用 requestAnimationFrame 把回调推迟到下一帧，
// 合并同帧内多次通知，避免循环触发（对 el-table 等自适应宽度无感知影响）
  ;(() => {
  const OriginalRO = window.ResizeObserver
  if (!OriginalRO) return
  window.ResizeObserver = class extends OriginalRO {
    constructor(callback) {
      let ticking = false
      super((...args) => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          callback(...args)
        })
      })
    }
  }
})()

// 兜底：拦截该良性报错的抛出，避免控制台输出（含 devtools overlay）
window.addEventListener('error', (e) => {
  const msg = e && e.message
  if (
    msg === 'ResizeObserver loop completed with undelivered notifications' ||
    msg === 'ResizeObserver loop limit exceeded'
  ) {
    e.stopImmediatePropagation()
    e.preventDefault()
  }
}, true)

// ---------------- Element UI ----------------
// 全量引入（简单直接）。若需减小体积，见 babel.config.js 中按需引入方案注释
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
// 中文语言包（日期选择器、分页等组件文案）
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'

// ---------------- 自身模块 ----------------
import App from './App.vue'
import router from './router'
import store from './store'
import '@/permission' // 全局路由守卫（登录验证 + 动态路由，副作用导入）
import './directive/permission' // v-permission 按钮级权限指令
import './icons' // svg 图标（如启用）
import '@/styles/index.scss' // 全局样式

// ---------------- 环境信息 ----------------
// 获取环境变量示例：
//   process.env.VUE_APP_BASE_API  -> 接口前缀
//   process.env.VUE_APP_TITLE     -> 系统标题
//   process.env.NODE_ENV          -> development / production

Vue.use(ElementUI, {
  locale: zhLocale,
  size: 'medium' // 全局组件尺寸
})

Vue.config.productionTip = false

// 全局过滤器示例：档案密级文本
// 模板中：{{ row.securityClass | securityClassText }}
Vue.filter('securityClassText', value => {
  const map = { 1: '公开', 2: '内部', 3: '秘密', 4: '机密' }
  return map[value] || value || '-'
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
