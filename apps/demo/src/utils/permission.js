import store from '@/store'

/**
 * 权限相关工具
 */

/**
 * 检查当前用户是否拥有指定权限（按钮级控制）
 * 用法一：在组件中 v-if="checkPermission(['system:user:add'])"
 * 用法二：配合全局指令 v-permission（见 main.js / directive/permission.js）
 * @param {Array} value 权限标识数组，如 ['system:user:add']
 * @returns {Boolean}
 */
export function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = store.state.user.roles
    const permissions = store.state.user.permissions

    if (roles.includes('admin')) return true // 超管跳过检查

    const permissionFlag = value
    return permissions.some(permission => permissionFlag.includes(permission))
  } else {
    console.error("需要权限标识！如 v-permission=\"['system:user:add']\"")
    return false
  }
}

/**
 * 检查角色
 * @param {Array} value 角色数组
 */
export function checkRole(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = store.state.user.roles
    return roles.some(role => value.includes(role))
  }
  return false
}
