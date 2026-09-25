/**
 * 常用校验函数（可用于 el-form 的 validator 或直接调用）
 */

/** 是否合法手机号 */
export function validMobile(mobile) {
  return /^1[3-9]\d{9}$/.test(mobile)
}

/** 是否合法邮箱 */
export function validEmail(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
}

/** URL */
export function validURL(url) {
  return /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)){3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:[0-9]+)?(\/\S*)?$/.test(url)
}

/** 是否非空字符串 */
export function isStringEmpty(str) {
  return str === undefined || str === null || String(str).trim() === ''
}

/** 档案编号格式：如 DA-2026-0001（字母-年份-流水号） */
export function validArchiveNo(no) {
  return /^[A-Z]{2,4}-\d{4}-\d{4,6}$/.test(no)
}

/**
 * el-form 自定义校验器：用户名 4-20 位字母数字下划线
 */
export function validateUsername(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (!/^[a-zA-Z0-9_]{4,20}$/.test(value)) {
    callback(new Error('用户名为 4-20 位字母、数字或下划线'))
  } else {
    callback()
  }
}

/**
 * el-form 自定义校验器：密码 6-20 位
 */
export function validatePassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6 || value.length > 20) {
    callback(new Error('密码长度为 6-20 位'))
  } else {
    callback()
  }
}
