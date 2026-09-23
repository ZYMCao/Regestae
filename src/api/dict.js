import request from '@/utils/request'

/**
 * 数据字典接口
 */

// 查询字典类型列表（字典管理页面使用）
export function listDictType(params) {
  return request({ url: '/system/dict/type/list', method: 'get', params })
}

// 一次性拉取全部字典数据（登录后调用，返回 { type: [{value,label}] } 大Map）
export function listAllDictData() {
  return request({ url: '/system/dict/data/all', method: 'get' })
}

// 按类型查询字典数据
export function listDictDataByType(dictType) {
  return request({ url: '/system/dict/data/' + dictType, method: 'get' })
}
