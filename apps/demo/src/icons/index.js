/**
 * svg 图标自动加载
 * 目录：src/icons/svg/*.svg，使用方式 <svg-icon icon-class="文件名" />
 * 如暂无 svg 资源，保持目录存在即可，不影响构建
 */
// Vite：用 import.meta.glob 批量导入（替代 webpack 的 require.context）
const modules = import.meta.glob('./svg/*.svg', { eager: true })

export default modules
