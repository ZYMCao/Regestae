const path = require('path')

// 系统标题（读取环境变量）
const name = process.env.VUE_APP_TITLE || '电子档案管理系统'
// 开发服务器端口，避免与后端 8080 冲突
const port = process.env.port || process.env.npm_config_port || 8081

module.exports = {
  // 部署应用包时的基本 URL：
  // 生产用相对路径 './'，可部署在任意子路径下（如 nginx /eas/ 目录）
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',

  // 构建输出目录
  outputDir: 'dist',

  // 静态资源(js/css/img)放置目录
  assetsDir: 'static',

  // eslint-loader 是否在保存时校验（开发量大时建议关闭，用 npm run lint 手动校验）
  lintOnSave: false,

  // 生产构建是否生成 source map（关闭可加快构建、减小体积）
  productionSourceMap: false,

  devServer: {
    port: port,
    open: true,
    // webpack-dev-server v4 写法：client.overlay 控制浏览器错误遮罩
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    },
    // 关键：代理转发。前端所有请求带 VUE_APP_BASE_API 前缀（如 /dev-api），
    // 由 devServer 转发到后端并去掉前缀，避免跨域
    proxy: {
      [process.env.VUE_APP_BASE_API]: {
        target: 'http://localhost:8080', // 后端 SpringBoot 地址
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: '' // /dev-api/user/list -> /user/list
        }
      }
    }
  },

  css: {
    loaderOptions: {
      sass: {
        // 向所有 scss 自动注入全局变量与 mixin，组件内无需重复 @import
        // 注意：使用函数形式，variables.scss / mixin.scss 自身不再注入，避免 "already being loaded" 循环引用
        // 且 variables.scss 只能包含变量，mixin.scss 只能包含 @mixin，避免样式重复输出
        additionalData: (content, loaderContext) => {
          const { resourcePath, rootContext } = loaderContext
          const relativePath = path.relative(rootContext, resourcePath).replace(/\\/g, '/')
          // variables.scss / mixin.scss 自身不注入，避免 "already being loaded" 循环引用
          if (relativePath.endsWith('src/styles/variables.scss') || relativePath.endsWith('src/styles/mixin.scss')) {
            return content
          }
          return '@import "~@/styles/variables.scss"; @import "~@/styles/mixin.scss";\n' + content
        }
      }
    }
  },

  configureWebpack: {
    name: name,
    resolve: {
      alias: {
        // '@' 别名 Vue CLI 默认已指向 src，此处补充常用别名
        '~': path.resolve(__dirname, 'src'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils')
      }
    }
  },

  chainWebpack(config) {
    // 首页标题
    config.plugin('html').tap(args => {
      args[0].title = name
      return args
    })

    // ---------------- 打包优化：拆分第三方大库，提升缓存命中 ----------------
    config.when(process.env.NODE_ENV === 'production', config => {
      config
        .plugin('ScriptExtHtmlWebpackPlugin')
        .after('html')
        .use('script-ext-html-webpack-plugin', [{
          inline: /runtime\..*\.js$/
        }])
        .end()

      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial' // 只打包初始依赖
          },
          elementUI: {
            name: 'chunk-elementui',
            priority: 20,
            test: /[\\/]node_modules[\\/]element-ui[\\/]/
          },
          commons: {
            name: 'chunk-commons',
            test: path.resolve(__dirname, 'src/components'),
            minChunks: 2, // 被 2 处以上引用的公共组件
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      // 独立抽出 webpack runtime，减小因业务代码变更导致的缓存失效
      config.optimization.runtimeChunk('single')
    })
  }
}
