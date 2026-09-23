/**
 * svg 图标自动加载
 * 目录：src/icons/svg/*.svg，使用方式 <svg-icon icon-class="文件名" />
 * 如暂无 svg 资源，保持目录存在即可，不影响构建
 */
const req = require.context('./svg', false, /\.svg$/)
const requireAll = requireContext => requireContext.keys().map(requireContext)
requireAll(req)
