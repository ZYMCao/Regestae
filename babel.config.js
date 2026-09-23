// babel 配置：@vue/cli-plugin-babel/preset 已包含 Vue2 JSX、polyfill(core-js) 等
// 若采用 Element UI 按需引入，见下方注释
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ]
  // ================= Element UI 按需引入方案 =================
  // 1. 安装: npm i -D babel-plugin-component
  // 2. 配置如下（此时 main.js 中只 import 用到的组件，不再全量 Vue.use(ElementUI)）：
  //
  // "plugins": [
  //   [
  //     "component",
  //     {
  //       "libraryName": "element-ui",
  //       "styleLibraryName": "theme-chalk"
  //     }
  //   ]
  // ]
  //
  // 注意：Message/MessageBox/Notification/Loading 这类"命令式"组件必须单独引入样式：
  // import 'element-ui/lib/theme-chalk/message.css'
  // import 'element-ui/lib/theme-chalk/message-box.css'
}
