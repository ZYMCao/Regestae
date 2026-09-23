import request from '@/utils/request'

/**
 * 统计模块接口
 */

// 分类统计（按门类/年度/保管期限统计数量）
export function statsByCategory(params) {
  return request({ url: '/stats/category', method: 'get', params })
}

// 借阅统计（按部门/时间段统计借阅次数、归还率等）
export function statsByBorrow(params) {
  return request({ url: '/stats/borrow', method: 'get', params })
}

// 驾驶舱首页概览数据
export function dashboardOverview() {
  return request({ url: '/stats/dashboard', method: 'get' })
}
