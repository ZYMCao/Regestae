/**
 * 字典工具：读取 Vuex 中缓存的字典数据，将 value 翻译为 label
 * 用法：dictLabel('archive_type', row.archiveType)
 */
import store from '@/store'

/** 根据字典类型与值获取显示文本 */
export function getDictLabel(type, value) {
  const dictMap = store.state.dict.allMap || {}
  const list = dictMap[type] || []
  const item = list.find(d => String(d.value) === String(value))
  return item ? item.label : value
}

/** 根据字典类型获取完整选项列表（供 el-select 下拉使用） */
export function getDictOptions(type) {
  const dictMap = store.state.dict.allMap || {}
  return dictMap[type] || []
}

/** 标签类型映射（用于 el-tag 的 type） */
export function getDictTagType(type, value) {
  const list = getDictOptions(type)
  const item = list.find(d => String(d.value) === String(value))
  return item ? (item.tagType || '') : ''
}
