import Vue from 'vue'
import { checkPermission, checkRole } from '@/utils/permission'

/**
 * 自定义指令：按钮级权限控制
 *
 * 使用方式：
 *   <el-button v-permission="['system:user:add']">新增用户</el-button>
 *   <el-button v-permission.role="['admin']">删除</el-button>   <!-- .role 修饰符按角色校验 -->
 *
 * 原理：无权限时直接从 DOM 中移除该元素（比 v-show 的 display:none 更安全，
 * 防止用户通过开发者工具强行显示后操作）
 */
Vue.directive('permission', {
  inserted(el, binding) {
    const { value, modifiers } = binding
    const hasPermission = modifiers.role
      ? checkRole(value)
      : checkPermission(value)

    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
})
