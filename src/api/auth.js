import request from '@/utils/request'

/**
 * 登录模块接口
 */

// 用户登录（用户名 + 密码）
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 获取图形验证码（返回 { uuid, img(base64) }）
export function getCodeImg() {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
}

// 获取当前登录用户信息（含 roles / permissions）
export function getInfo() {
  return request({
    url: '/auth/info',
    method: 'get'
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 修改密码
export function updatePwd(params) {
  return request({
    url: '/auth/password',
    method: 'put',
    params
  })
}
