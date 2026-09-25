import Cookies from 'js-cookie'

// Token 存储的 Cookie 键名与有效期
const TokenKey = 'eas-admin-token'
const expires = 7 // 7 天

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token, { expires: expires })
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
