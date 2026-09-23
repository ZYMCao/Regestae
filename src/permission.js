import router from './router'
import store from './store'
import { getToken } from '@/utils/auth' // 验权（Cookie 中取 token）
import { Message } from 'element-ui'
import NProgress from 'nprogress' // 页面加载顶部进度条
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false }) // 关闭右上角转圈

// 白名单：无需登录即可访问的页面
const whiteList = ['/login']

/**
 * 计算第一个可展示菜单的完整路径
 * 用于登录后/访问根路径时默认跳转
 * @param {Array} routes 已过滤的可访问路由表（permission.routes）
 */
function getFirstAccessiblePath(routes) {
  for (const route of routes || []) {
    if (route.hidden) continue
    const children = (route.children || []).filter(c => !c.hidden)
    if (children.length > 0) {
      const child = children[0]
      const cp = child.path || ''
      if (cp.startsWith('/')) return cp // 绝对路径直接返回
      // 拼接父路径 + 子路径（去重斜杠）
      return (route.path + '/' + cp).replace(/\/+/g, '/')
    }
    // 无子路由的父路由，直接用自身路径
    if (route.path && route.path !== '*') return route.path
  }
  return '/dashboard' // 兜底：无可见菜单时进首页
}

/**
 * 全局前置守卫
 * 1. 启动进度条
 * 2. 设置页面标题
 * 3. 判断是否有 token：
 *    - 有：访问 /login 则跳首页；否则确保用户信息+动态路由已加载后放行，
 *          根路径 / 统一重定向到"第一个可展示菜单"
 *    - 无：白名单放行；其余重定向到 /login 并携带 redirect 参数
 */
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  // 设置浏览器标签页标题
  document.title = (to.meta && to.meta.title)
    ? `${to.meta.title} - ${import.meta.env.VITE_TITLE}`
    : import.meta.env.VITE_TITLE || ''

  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 已登录访问登录页 → 跳根路径（由下方逻辑进一步跳第一个菜单）
      next({ path: '/' })
      NProgress.done()
    } else {
      // 判断是否已拉取用户信息（区分"刷新页面"与"正常跳转"）
      const hasUserInfo = store.state.user.roles && store.state.user.roles.length > 0

      if (hasUserInfo) {
        // 已有用户信息：/ 重定向到首页；/dashboard 作为固定首页直接放行
        if (to.path === '/') {
          next({ path: '/dashboard', replace: true })
        } else {
          next()
        }
      } else {
        try {
          // ---------- 首次进入 / 刷新页面：恢复登录态 ----------
          // 1. 拉取用户信息（角色、权限）
          const user = await store.dispatch('user/getInfo')

          // 2. 根据权限生成动态路由表
          const accessRoutes = await store.dispatch('permission/generateRoutes', {
            roles: user.roles || [],
            permissions: user.permissions || []
          })

          // 3. 动态挂载路由（vue-router 3.x 的 addRoutes）
          router.addRoutes(accessRoutes)

          // 4. 关键：addRoutes 之后当前这次导航的匹配已结束，需 replace 重新进入
          //    / 与 /dashboard 统一跳第一个可展示菜单（登录回跳 redirect=/dashboard 也走这里）
          if (to.path === '/' || to.path === '/dashboard') {
            const firstPath = getFirstAccessiblePath(accessRoutes)
            next({ path: firstPath, replace: true })
          } else {
            next({ ...to, replace: true })
          }
        } catch (error) {
          // 拉取信息失败（token 过期等）：清空登录态，回登录页
          await store.dispatch('user/resetToken')
          Message.error(error.message || '登录状态已失效，请重新登录')
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
          NProgress.done()
        }
      }
    }
  } else {
    // ---------- 无 token ----------
    if (whiteList.indexOf(to.path) !== -1) {
      // 白名单页面（如登录页）放行
      next()
    } else {
      // 其他页面一律重定向登录页，并记录来源以便登录后回跳
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      NProgress.done()
    }
  }
})

// 全局后置钩子：结束进度条
router.afterEach(() => {
  NProgress.done()
})
