import router from '@/router'

/**
 * tagsView 模块：标签页导航状态管理
 * visitedViews: 已访问页面列表（渲染标签）
 * cachedViews: 需要 keep-alive 缓存的组件 name 列表
 */
const state = {
  visitedViews: [],
  cachedViews: []
}

const mutations = {
  // 添加访问记录
  ADD_VISITED_VIEW(state, view) {
    // 去重：已存在则不添加
    if (state.visitedViews.some(v => v.path === view.path)) return
    state.visitedViews.push(
      Object.assign({}, view, {
        title: (view.meta && view.meta.title) || 'no-name'
      })
    )
  },
  // 添加缓存（组件 name）
  ADD_CACHED_VIEW(state, view) {
    if (state.cachedViews.includes(view.name)) return
    // meta.noCache === true 的页面不缓存
    if (!view.meta || !view.meta.noCache) {
      state.cachedViews.push(view.name)
    }
  },

  // 删除访问记录
  DEL_VISITED_VIEW(state, view) {
    const list = state.visitedViews
    for (const [i, v] of list.entries()) {
      if (v.path === view.path) {
        state.visitedViews.splice(i, 1)
        break
      }
    }
  },
  DEL_CACHED_VIEW(state, view) {
    const index = state.cachedViews.indexOf(view.name)
    index > -1 && state.cachedViews.splice(index, 1)
  },

  // 关闭其他标签
  DEL_OTHER_VISITED_VIEWS(state, view) {
    state.visitedViews = state.visitedViews.filter(v => {
      return (v.meta && v.meta.affix) || v.path === view.path
    })
  },
  DEL_OTHER_CACHED_VIEWS(state, view) {
    const index = state.cachedViews.indexOf(view.name)
    if (index > -1) {
      state.cachedViews = state.cachedViews.slice(index, index + 1)
    } else {
      state.cachedViews = []
    }
  },

  // 关闭所有标签（保留 affix）
  DEL_ALL_VISITED_VIEWS(state) {
    const affixTags = state.visitedViews.filter(tag => tag.meta && tag.meta.affix)
    state.visitedViews = affixTags
  },
  DEL_ALL_CACHED_VIEWS(state) {
    state.cachedViews = []
  }
}

const actions = {
  addView({ dispatch }, view) {
    dispatch('addVisitedView', view)
    dispatch('addCachedView', view)
  },
  addVisitedView({ commit }, view) {
    commit('ADD_VISITED_VIEW', view)
  },
  addCachedView({ commit }, view) {
    commit('ADD_CACHED_VIEW', view)
  },

  delView({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delVisitedView', view)
      dispatch('delCachedView', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delVisitedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_VISITED_VIEW', view)
      resolve([...state.visitedViews])
    })
  },
  delCachedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_CACHED_VIEW', view)
      resolve([...state.cachedViews])
    })
  },

  delOtherViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delOtherVisitedViews', view)
      dispatch('delOtherCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delOtherVisitedViews({ commit }, view) {
    commit('DEL_OTHER_VISITED_VIEWS', view)
  },
  delOtherCachedViews({ commit }, view) {
    commit('DEL_OTHER_CACHED_VIEWS', view)
  },

  delAllViews({ dispatch, state }) {
    return new Promise(resolve => {
      dispatch('delAllVisitedViews')
      dispatch('delAllCachedViews')
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delAllVisitedViews({ commit }) {
    commit('DEL_ALL_VISITED_VIEWS')
  },
  delAllCachedViews({ commit }) {
    commit('DEL_ALL_CACHED_VIEWS')
  },

  // 清空全部标签页（退出登录时调用）
  clearViews({ commit }) {
    commit('DEL_ALL_VISITED_VIEWS')
    commit('DEL_ALL_CACHED_VIEWS')
  },

  // 初始化 affix 标签：从完整路由表中提取 affix 页面（如首页）
  initAffixTags({ commit }, routes) {
    const affixTags = []
    const findAffix = (routeList, basePath = '/') => {
      routeList.forEach(route => {
        // tagPath 需声明在 if 外：下方递归 children 时也要用（否则 ReferenceError）
        let tagPath = basePath
        if (route.meta && route.meta.affix) {
          tagPath = (basePath + '/' + String(route.path)).replace(/\/+/g, '/')
          affixTags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          findAffix(route.children, tagPath)
        }
      })
    }
    // 从 permission 模块的 routes 中提取（已包含静态+动态）
    const allRoutes = routes || router.options.routes || []
    findAffix(allRoutes)
    affixTags.forEach(tag => commit('ADD_VISITED_VIEW', tag))
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
