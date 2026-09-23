import { listAllDictData } from '@/api/dict'
import { defineModule } from '@/store/module-helper'

/**
 * dict 模块：数据字典缓存
 * 登录成功后一次性拉取全部字典，存入 allMap：
 * { archive_type: [{value,label,tagType}], security_class: [...] }
 * 组件中通过 utils/dict.js 的 getDictLabel/getDictOptions 读取
 */
const dict = defineModule({
  namespaced: true,

  state: () => ({
    loaded: false,  // 是否已加载
    allMap: {}      // 字典大Map
  }),

  mutations: {
    SET_DICT_MAP(state, map) {
      state.allMap = map
      state.loaded = true
    }
  },

  actions: {
    /**
     * 加载全部字典（幂等：已加载则跳过）
     * 组件中: this.$store.dispatch('dict/loadDictMap')
     */
    loadDictMap({ commit, state }) {
      if (state.loaded) return Promise.resolve()
      return new Promise((resolve, reject) => {
        listAllDictData().then(res => {
          commit('SET_DICT_MAP', res.data || {})
          resolve()
        }).catch(reject)
      })
    }
  }
})

export default dict
