import { login, logout, getInfo } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'
import { defineModule } from '@/store/module-helper'

/**
 * 静态 DEMO 开关：环境变量 VITE_USE_MOCK=true 时，登录/用户信息/退出
 * 均不请求后端接口，使用本地模拟数据（后端未就绪时的演示模式）。
 * 后端联调时把 .env.development 中 VITE_USE_MOCK 改为 false 即可恢复真实接口。
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// DEMO 模拟用户：admin 拥有全部角色/权限（permission.js 中 admin 放行全部动态路由）
const MOCK_USER = {
  userName: 'admin',
  nickName: '系统管理员',
  avatar: '',
  roles: ['admin'],
  permissions: [],
  introduction: '电子档案管理系统演示账号'
}
const user = defineModule({
  namespaced: true,

  state: () => ({
    token: getToken() || '',   // 初始化时从 Cookie 恢复
    name: '',                  // 用户名
    nickname: '',              // 昵称（显示用）
    avatar: '',                // 头像 URL
    roles: [],                 // 角色编码列表，如 ['admin'] / ['archiveManager']
    permissions: [],           // 按钮级权限标识列表，如 ['system:user:add']
    introduction: ''
  }),

  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
    },
    SET_USER_INFO(state, userInfo) {
      state.name = userInfo.userName || ''
      state.nickname = userInfo.nickName || ''
      state.avatar = userInfo.avatar || ''
      state.roles = userInfo.roles || []
      state.permissions = userInfo.permissions || []
      state.introduction = userInfo.introduction || ''
    },
    // 退出/过期时重置所有状态
    RESET_STATE(state) {
      state.token = ''
      state.name = ''
      state.nickname = ''
      state.avatar = ''
      state.roles = []
      state.permissions = []
    }
  },

  actions: {
    /**
     * 异步 action 示例：登录
     * 1. 调用后端接口换取 token；2. mutation 存入 state；3. 同步写入 Cookie
     */
    login({ commit }, userInfo) {
      const { username, password, code, uuid } = userInfo
      // DEMO 模式：不请求接口，校验非空后直接发本地假 token
      if (USE_MOCK) {
        return new Promise((resolve, reject) => {
          if (!username || !password) {
            reject(new Error('请输入用户名和密码'))
            return
          }
          const token = 'mock-token-' + Date.now()
          commit('SET_TOKEN', token)
          setToken(token) // Cookie 持久化，刷新不丢
          resolve()
        })
      }
      return new Promise((resolve, reject) => {
        login({ username: username.trim(), password, code, uuid }).then(res => {
          const token = res.data.token
          commit('SET_TOKEN', token)
          setToken(token) // Cookie 持久化，刷新不丢
          resolve()
        }).catch(reject)
      })
    },

    /**
     * 获取用户信息（登录后 / 刷新页面恢复登录态时调用）
     */
    getInfo({ commit, state }) {
      // DEMO 模式：直接返回本地模拟用户信息
      if (USE_MOCK) {
        return new Promise(resolve => {
          commit('SET_USER_INFO', MOCK_USER)
          resolve(MOCK_USER)
        })
      }
      return new Promise((resolve, reject) => {
        getInfo().then(res => {
          const user = res.data
          if (!user || (user.roles && user.roles.length === 0)) {
            reject(new Error('该用户未分配角色，请联系管理员'))
            return
          }
          commit('SET_USER_INFO', user)
          resolve(user)
        }).catch(reject)
      })
    },

    /**
     * 退出登录：调接口（使后端 token 失效）+ 清理本地状态
     */
    logout({ commit, state, dispatch }) {
      // DEMO 模式：不请求接口，直接清理本地登录态
      if (USE_MOCK) {
        return new Promise(resolve => {
          commit('RESET_STATE')
          removeToken()
          resetRouter() // 重置路由，防止上一个用户的动态路由残留
          dispatch('tagsView/clearViews', null, { root: true }) // 清空标签页
          resolve()
        })
      }
      return new Promise((resolve, reject) => {
        logout(state.token).then(() => {
          commit('RESET_STATE')
          removeToken()
          resetRouter() // 重置路由，防止上一个用户的动态路由残留
          dispatch('tagsView/clearViews', null, { root: true }) // 清空标签页
          resolve()
        }).catch(reject)
      })
    },

    /**
     * token 失效时前端强制登出（不调后端接口）
     */
    resetToken({ commit, dispatch }) {
      return new Promise(resolve => {
        commit('RESET_STATE')
        removeToken()
        resetRouter()
        dispatch('tagsView/clearViews', null, { root: true }) // 清空标签页
        resolve()
      })
    }
  }
})

export default user
