/**
 * defineModule 辅助函数
 *
 * 作用说明（Vuex 模块持久化简易方案）：
 * 本项目未引入 vuex-persistedstate 插件，而 user 模块的 token 通过 js-cookie
 * 在 actions 中手动持久化（setToken / removeToken），app 模块的 UI 状态通过
 * localStorage 手动持久化。这样职责清晰且避免额外依赖。
 *
 * 若未来需要"整个 state 自动持久化"，可安装 vuex-persistedstate 并在 store/index.js 中：
 *   import createPersistedState from 'vuex-persistedstate'
 *   const store = new Vuex.Store({
 *     modules,
 *     plugins: [createPersistedState({
 *       storage: window.localStorage,      // 或 Cookies
 *       reducer: state => ({ user: state.user, app: state.app }) // 仅持久化指定模块
 *     })]
 *   })
 *
 * 此处仅做一层包装（透传配置），为将来统一扩展（如日志、持久化插件）留入口。
 */
export function defineModule(options) {
  return options
}
