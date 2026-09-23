import { defineModule } from '@/store/module-helper'

/**
 * archive 模块：档案列表页缓存
 * 用途：列表页 -> 详情页 -> 返回列表 时保留查询条件与列表数据（配合 keep-alive）
 * 注意：此模块数据量可能大，不做持久化，刷新页面即重置（符合预期）
 */
const archive = defineModule({
  namespaced: true,

  state: () => ({
    // 当前列表查询条件（档案保存页等共用）
    queryParams: {
      pageNum: 1,
      pageSize: 10,
      archiveNo: '',      // 档案编号
      title: '',          // 题名
      archiveType: '',    // 门类
      securityClass: '',  // 密级
      storagePeriod: ''   // 保管期限
    },
    // 当前选中的档案（详情页跳转用，可选）
    currentArchive: null,
    // 已选中的行（批量操作用）
    selectedIds: []
  }),

  mutations: {
    // 更新查询条件（组件中: this.$store.commit('archive/SET_QUERY_PARAMS', {...})）
    SET_QUERY_PARAMS(state, params) {
      state.queryParams = { ...state.queryParams, ...params }
    },
    // 重置查询条件
    RESET_QUERY_PARAMS(state) {
      state.queryParams = {
        pageNum: 1,
        pageSize: 10,
        archiveNo: '',
        title: '',
        archiveType: '',
        securityClass: '',
        storagePeriod: ''
      }
    },
    SET_CURRENT_ARCHIVE(state, archive) {
      state.currentArchive = archive
    },
    SET_SELECTED_IDS(state, ids) {
      state.selectedIds = ids
    }
  },

  actions: {
    /**
     * 异步 action 示例：保存查询条件并跳转前缓存
     * 组件中: this.$store.dispatch('archive/updateQueryParams', { title: '合同' })
     */
    updateQueryParams({ commit }, params) {
      commit('SET_QUERY_PARAMS', params)
    },
    clearSelection({ commit }) {
      commit('SET_SELECTED_IDS', [])
      commit('SET_CURRENT_ARCHIVE', null)
    }
  },

  getters: {
    // getters 示例：是否处于筛选状态
    hasFilter: state => {
      const { archiveNo, title, archiveType, securityClass, storagePeriod } = state.queryParams
      return !!(archiveNo || title || archiveType || securityClass || storagePeriod)
    }
  }
})

export default archive
