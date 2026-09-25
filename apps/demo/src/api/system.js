import request from '@/utils/request'

/**
 * 系统管理模块接口：用户 / 机构 / 部门 / 字典 / 日志
 */

// ================= 用户管理 =================
export function listUser(params) {
  return request({ url: '/system/user/list', method: 'get', params })
}
export function getUser(userId) {
  return request({ url: '/system/user/' + userId, method: 'get' })
}
export function addUser(data) {
  return request({ url: '/system/user', method: 'post', data })
}
export function updateUser(data) {
  return request({ url: '/system/user', method: 'put', data })
}
export function delUser(userId) {
  return request({ url: '/system/user/' + userId, method: 'delete' })
}
export function resetUserPwd(userId, password) {
  return request({ url: '/system/user/resetPwd', method: 'put', data: { userId, password } })
}

// ================= 机构管理 =================
export function listOrg(params) {
  return request({ url: '/system/org/list', method: 'get', params })
}
export function addOrg(data) {
  return request({ url: '/system/org', method: 'post', data })
}
export function updateOrg(data) {
  return request({ url: '/system/org', method: 'put', data })
}
export function delOrg(orgId) {
  return request({ url: '/system/org/' + orgId, method: 'delete' })
}

// ================= 部门管理 =================
export function listDept(params) {
  return request({ url: '/system/dept/list', method: 'get', params })
}
// 部门树（下拉选择用）
export function getDeptTree() {
  return request({ url: '/system/dept/tree', method: 'get' })
}
export function addDept(data) {
  return request({ url: '/system/dept', method: 'post', data })
}
export function updateDept(data) {
  return request({ url: '/system/dept', method: 'put', data })
}
export function delDept(deptId) {
  return request({ url: '/system/dept/' + deptId, method: 'delete' })
}

// ================= 字典管理 =================
export function listDictType(params) {
  return request({ url: '/system/dict/type/list', method: 'get', params })
}
export function listDictData(dictType) {
  return request({ url: '/system/dict/data/' + dictType, method: 'get' })
}
export function addDictType(data) {
  return request({ url: '/system/dict/type', method: 'post', data })
}
export function updateDictType(data) {
  return request({ url: '/system/dict/type', method: 'put', data })
}
export function delDictType(dictId) {
  return request({ url: '/system/dict/type/' + dictId, method: 'delete' })
}

// ================= 日志管理 =================
export function listOperLog(params) {
  return request({ url: '/system/log/oper/list', method: 'get', params })
}
export function listLoginLog(params) {
  return request({ url: '/system/log/login/list', method: 'get', params })
}
export function cleanLog() {
  return request({ url: '/system/log/clean', method: 'delete' })
}
