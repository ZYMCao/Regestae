import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import app from './modules/app'
import user from './modules/user'
import archive from './modules/archive'
import dict from './modules/dict'
import permission from './modules/permission'
import tagsView from './modules/tagsView'

Vue.use(Vuex)

/**
 * Vuex 按模块组织：
 * - app:        UI 状态（侧边栏折叠、主题等），通过 localStorage 实现持久化
 * - user:       登录态（token / 用户信息 / 权限），token 用 js-cookie 持久化
 * - archive:    档案列表缓存与筛选条件，刷新即重置（无需持久化）
 * - dict:       数据字典缓存，登录后加载一次
 * - permission: 动态路由（登录后按权限生成，侧边栏据此渲染）
 * - tagsView:   标签页导航（访问过的页面集合）
 */
const store = new Vuex.Store({
  modules: {
    app,
    user,
    archive,
    dict,
    permission,
    tagsView
  },
  getters
})

export default store
