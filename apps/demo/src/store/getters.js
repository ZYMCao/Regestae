const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  name: state => state.user.name,
  avatar: state => state.user.avatar,
  roles: state => state.user.roles,
  permissions: state => state.user.permissions,
  // 计算属性示例：是否为超级管理员
  isAdmin: state => state.user.roles.includes('admin')
}

export default getters
