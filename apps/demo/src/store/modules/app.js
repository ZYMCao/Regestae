import cookies from 'js-cookie'
import { defineModule } from '@/store/module-helper'

/**
 * app 模块：全局 UI 状态
 * 持久化方案：手动 + localStorage（适合小而关键的 UI 配置）
 */
const KEY_SIDEBAR = 'eas-sidebar-opened'
const KEY_LANG = 'eas-lang'

const app = defineModule({
  namespaced: true,

  state: () => ({
    // 从 localStorage 恢复侧边栏状态（刷新不丢失）
    sidebar: {
      opened: cookies.get(KEY_SIDEBAR) !== 'false', // 默认展开
      withoutAnimation: false
    },
    device: 'desktop',   // 设备类型 desktop / mobile
    language: cookies.get(KEY_LANG) || 'zh-CN',
    theme: '#409EFF'     // Element UI 主色
  }),

  mutations: {
    // 切换侧边栏折叠状态
    TOGGLE_SIDEBAR(state) {
      state.sidebar.opened = !state.sidebar.opened
      state.sidebar.withoutAnimation = false
      // 同步持久化（cookie 存 true/false 字符串）
      cookies.set(KEY_SIDEBAR, String(state.sidebar.opened))
    },
    CLOSE_SIDEBAR(state, withoutAnimation) {
      state.sidebar.opened = false
      state.sidebar.withoutAnimation = withoutAnimation
      cookies.set(KEY_SIDEBAR, 'false')
    },
    TOGGLE_DEVICE(state, device) {
      state.device = device
    },
    SET_LANGUAGE(state, language) {
      state.language = language
      cookies.set(KEY_LANG, language)
    },
    SET_THEME(state, theme) {
      state.theme = theme
    }
  },

  actions: {
    toggleSideBar({ commit }) {
      commit('TOGGLE_SIDEBAR')
    },
    closeSideBar({ commit }, withoutAnimation) {
      commit('CLOSE_SIDEBAR', withoutAnimation)
    },
    toggleDevice({ commit }, device) {
      commit('TOGGLE_DEVICE', device)
    },
    setLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
    }
  }
})

export default app
