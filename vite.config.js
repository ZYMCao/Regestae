import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue2'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env.[mode] 中的变量（第三个参数 '' 表示不限制变量前缀）
  const env = loadEnv(mode, process.cwd(), '')
  // 系统标题（读取环境变量）
  const name = env.VITE_TITLE || '电子档案管理系统'
  // 后端接口前缀，避免与后端 8080 冲突
  const baseApi = env.VITE_BASE_API || '/dev-api'

  return {
    // 部署应用包时的基本 URL：
    // 生产用相对路径 './'，可部署在任意子路径下（如 nginx /eas/ 目录）
    base: mode === 'production' ? './' : '/',

    plugins: [vue()],

    resolve: {
      alias: {
        // '@' 别名指向 src（原 Vue CLI 默认行为），此处补充常用别名
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./src', import.meta.url)),
        '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url))
      }
    },

    css: {
      preprocessorOptions: {
        scss: {
          // 向所有 scss 自动注入全局变量与 mixin，组件内无需重复 @import
          // 注意：使用函数形式，variables.scss / mixin.scss 自身不再注入，避免 "already being loaded" 循环引用
          // 且 variables.scss 只能包含变量，mixin.scss 只能包含 @mixin，避免样式重复输出
          additionalData: (source, id) => {
            const normalizedPath = id.replace(/\\/g, '/')
            if (
              normalizedPath.endsWith('src/styles/variables.scss') ||
              normalizedPath.endsWith('src/styles/mixin.scss')
            ) {
              return source
            }
            return '@import "@/styles/variables.scss"; @import "@/styles/mixin.scss";\n' + source
          },
          // 项目仍使用 @import 语法（sass 1.80+ 视为弃用），静默相关告警
          silenceDeprecations: ['import', 'legacy-js-api']
        }
      }
    },

    server: {
      // 开发服务器端口，避免与后端 8080 冲突
      port: Number(env.port || env.npm_config_port || 8081),
      open: true,
      // 关键：代理转发。前端所有请求带 VITE_BASE_API 前缀（如 /dev-api），
      // 由 dev server 转发到后端并去掉前缀，避免跨域
      proxy: {
        [baseApi]: {
          target: 'http://localhost:8080', // 后端 SpringBoot 地址
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + baseApi), '') // /dev-api/user/list -> /user/list
        }
      }
    },

    build: {
      // 生产构建不生成 source map（关闭可加快构建、减小体积）
      sourcemap: false,
      rollupOptions: {
        output: {
          // 打包优化：拆分第三方大库，提升缓存命中
          // （Vite 无 runtime chunk，不再需要 script-ext-html-webpack-plugin 内联）
          manualChunks: {
            'chunk-libs': ['vue', 'vue-router', 'vuex', 'axios', 'js-cookie', 'nprogress'],
            'chunk-elementui': ['element-ui']
          }
        }
      }
    }
  }
})
