import request from '@/utils/request'

/**
 * 档案管理模块接口
 * 后端约定：RESTful 风格，分页查询用 GET + params，新增 POST，修改 PUT，删除 DELETE
 */

// ============ 档案接收 ============
// 接收登记列表（待接收/已接收）
export function listReceive(params) {
  return request({ url: '/archive/receive/list', method: 'get', params })
}
// 确认接收
export function confirmReceive(data) {
  return request({ url: '/archive/receive/confirm', method: 'post', data })
}
// 新建移交单
export function addTransfer(data) {
  return request({ url: '/archive/receive/transfer', method: 'post', data })
}

// ============ 档案整理 ============
export function listOrganize(params) {
  return request({ url: '/archive/organize/list', method: 'get', params })
}
// 案卷编目 / 组卷
export function saveOrganize(data) {
  return request({ url: '/archive/organize', method: 'post', data })
}
// 档案著录（录入元数据）
export function catalogArchive(data) {
  return request({ url: '/archive/organize/catalog', method: 'post', data })
}

// ============ 档案保存 ============
export function listArchive(params) {
  return request({ url: '/archive/info/list', method: 'get', params })
}
export function getArchive(id) {
  return request({ url: '/archive/info/' + id, method: 'get' })
}
export function addArchive(data) {
  return request({ url: '/archive/info', method: 'post', data })
}
export function updateArchive(data) {
  return request({ url: '/archive/info', method: 'put', data })
}
export function delArchive(ids) {
  return request({ url: '/archive/info/' + ids, method: 'delete' })
}
// 档案入库/上架（库位管理）
export function shelfArchive(data) {
  return request({ url: '/archive/info/shelf', method: 'put', data })
}

// ============ 档案利用 ============
export function listUtilize(params) {
  return request({ url: '/archive/utilize/list', method: 'get', params })
}
// 申请利用（查阅/复制/出证）
export function applyUtilize(data) {
  return request({ url: '/archive/utilize/apply', method: 'post', data })
}
// 利用审批
export function auditUtilize(data) {
  return request({ url: '/archive/utilize/audit', method: 'put', data })
}

// ============ 档案鉴定与处置 ============
export function listAppraisal(params) {
  return request({ url: '/archive/appraisal/list', method: 'get', params })
}
// 到期档案鉴定（继续保存 / 销毁）
export function submitAppraisal(data) {
  return request({ url: '/archive/appraisal', method: 'post', data })
}
// 销毁审批
export function destroyAudit(data) {
  return request({ url: '/archive/appraisal/destroy-audit', method: 'put', data })
}
