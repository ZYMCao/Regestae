import { asyncRoutes, constantRoutes } from '@/router'

/**
 * 动态路由模块（Vuex）
 * 职责：根据用户权限过滤 asyncRoutes，并保存"用户可访问的完整路由表"，
 * 供侧边栏菜单渲染使用。
 */

const state = {
  // 用户可访问的完整路由（constantRoutes + 过滤后的 asyncRoutes），侧边栏据此渲染
  routes: [],
  // 过滤后的动态路由
  addedRoutes: []
}

const mutations = {
  SET_ROUTES(state, routes) {
    state.addedRoutes = routes
    // 完整路由表 = 静态路由 + 动态路由（静态路由均 hidden 不影响菜单渲染；
    // TagsView 依赖它提取 affix 固定标签，如首页）
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  /**
   * 生成用户可访问的路由（登录后/刷新页面时由全局守卫调用）
   * @param {Object} user { roles: ['admin'], permissions: ['system:user:list'] }
   */
  generateRoutes({ commit }, user) {
    return new Promise(resolve => {
      let accessedRoutes
      if (user.roles.includes('admin')) {
        // 超管：拥有全部动态路由
        accessedRoutes = asyncRoutes || []
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, user)
      }
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  },

  /**
   * 清空动态路由（退出登录时与 resetRouter 配合调用）
   */
  resetRoutes({ commit }) {
    commit('SET_ROUTES', [])
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

/**
 * 递归过滤路由树：
 * 路由 meta.permission 是"权限标识数组"，用户 permissions/roles 中
 * 拥有其中任意一个即放行；没有 permission 字段则默认放行。
 */
function filterAsyncRoutes(routes, user) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(tmp, user)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, user)
      }
      res.push(tmp)
    }
  })
  return res
}

function hasPermission(route, user) {
  const perm = route.meta && route.meta.permission
  if (!perm) return true
  return perm.some(p => user.permissions.includes(p) || user.roles.includes(p))
}
