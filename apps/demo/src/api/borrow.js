import request from '@/utils/request'

/**
 * 借阅管理模块接口
 */

// 借阅申请列表
export function listBorrow(params) {
  return request({ url: '/borrow/list', method: 'get', params })
}
// 提交借阅申请
export function applyBorrow(data) {
  return request({ url: '/borrow/apply', method: 'post', data })
}
// 借阅审批（通过/驳回）
export function auditBorrow(data) {
  return request({ url: '/borrow/audit', method: 'put', data })
}
// 归还确认
export function returnArchive(data) {
  return request({ url: '/borrow/return', method: 'put', data })
}
// 续借
export function renewBorrow(data) {
  return request({ url: '/borrow/renew', method: 'put', data })
}
// 借阅记录（历史）
export function listBorrowRecord(params) {
  return request({ url: '/borrow/record/list', method: 'get', params })
}
