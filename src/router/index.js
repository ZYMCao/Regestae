import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/layout/index.vue'

Vue.use(Router)

// vue-router 3.1+ 中，导航被守卫重定向/取消/重复时 push/replace 会 reject
// 一个 NavigationFailure（如登录后 /dashboard 被守卫重定向到第一个菜单），
// 这类失败是预期行为，统一吞掉，避免控制台出现 Uncaught (in promise) 报错
const originalPush = Router.prototype.push
const originalReplace = Router.prototype.replace

Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (Router.isNavigationFailure && Router.isNavigationFailure(err)) return
    return Promise.reject(err)
  })
}

Router.prototype.replace = function replace(location) {
  return originalReplace.call(this, location).catch(err => {
    if (Router.isNavigationFailure && Router.isNavigationFailure(err)) return
    return Promise.reject(err)
  })
}

/**
 * 路由定义规则说明：
 * 1. constantRoutes：静态路由，所有登录用户可访问（登录页、404、首页等），均不在侧边栏显示
 * 2. asyncRoutes：动态路由，登录后由 store/permission.js 根据用户权限过滤，
 *    过滤后的路由通过 router.addRoutes 动态挂载，并作为侧边栏菜单渲染
 *
 * 一级菜单结构说明：
 * - 单子路由的父路由会被侧边栏合并渲染为一个一级菜单项（见 SidebarItem.vue 的 hasOneShowingChild）
 * - 多子路由的父路由渲染为可展开的一级菜单（如"电子档案统计"、"系统管理"）
 *
 * 路由 meta 字段约定：
 * - title:    菜单/面包屑/标签页显示名称
 * - icon:     侧边栏菜单图标（Element UI 图标名）
 * - noCache:  true 表示该页面不使用 keep-alive 缓存
 * - hidden:   true 表示不在侧边栏显示
 * - permission: 按钮级权限标识（页面内部 v-permission 指令使用）
 * - activeMenu: 当该路由高亮的菜单（如详情页高亮列表菜单）
 */

/**
 * 静态路由：无需登录/所有用户可访问（均不在侧边栏显示）
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },

  // 根路由：实际跳转目标由全局守卫动态决定（默认跳第一个可展示菜单）
  // redirect:'/dashboard' 仅作兜底，守卫会覆盖此重定向
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    hidden: true,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        // affix: 首页标签固定在标签栏第一位，不可关闭
        meta: { title: '首页', icon: 'el-icon-s-home', affix: true },
        hidden: true
      }
    ]
  },

  // 修改密码（顶部下拉入口，不在侧边栏）
  {
    path: '/password',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index',
        name: 'Password',
        component: () => import('@/views/profile/password.vue'),
        meta: { title: '修改密码', noCache: true }
      }
    ]
  }
]

/**
 * 动态路由：10 个一级菜单，按角色权限过滤后挂载
 * permission 字段：允许访问的角色/权限标识；不写表示不限角色
 */
export const asyncRoutes = [
  // 1. 电子档案接收（多子路由 → 侧边栏可展开菜单）
  {
    path: '/archive-receive',
    component: Layout,
    redirect: '/archive-receive/business-file',
    meta: { title: '电子档案接收', icon: 'el-icon-download' },
    children: [
      {
        path: 'business-file',
        name: 'ArchiveBusinessFile',
        component: () => import('@/views/archive/receive/business-file.vue'),
        meta: { title: '业务文件接收', icon: 'el-icon-document' }
      },
      {
        path: 'traditional-link',
        name: 'ArchiveTraditionalLink',
        component: () => import('@/views/archive/receive/traditional-link.vue'),
        meta: { title: '传统档案连接', icon: 'el-icon-link' }
      },
      {
        path: 'traditional-sign',
        name: 'ArchiveTraditionalSign',
        component: () => import('@/views/archive/receive/traditional-sign.vue'),
        meta: { title: '传统档案电子签', icon: 'el-icon-edit-outline' }
      },
      {
        path: 'quality-file',
        name: 'ArchiveQualityFile',
        component: () => import('@/views/archive/receive/quality-file.vue'),
        meta: { title: '质量系统文件管理', icon: 'el-icon-s-check' }
      }
    ]
  },

  // 2. 电子档案整理（多子路由 → 侧边栏可展开菜单）
  {
    path: '/archive-organize',
    component: Layout,
    redirect: '/archive-organize/category',
    meta: { title: '电子档案整理', icon: 'el-icon-s-operation' },
    children: [
      {
        path: 'category',
        name: 'ArchiveOrganizeCategory',
        component: () => import('@/views/archive/organize/category.vue'),
        meta: { title: '维护分类', icon: 'el-icon-s-management' }
      },
      {
        path: 'pre-file',
        name: 'ArchivePreFile',
        component: () => import('@/views/archive/organize/index.vue'),
        meta: { title: '归档文件', icon: 'el-icon-document' }
      },
      {
        path: 'pre-roll',
        name: 'ArchivePreRoll',
        component: () => import('@/views/archive/organize/pre-roll.vue'),
        meta: { title: '归档案卷', icon: 'el-icon-folder' }
      },
      {
        path: 'archive-entry',
        name: 'ArchiveEntry',
        component: () => import('@/views/archive/organize/archive-entry.vue'),
        meta: { title: '电子档案入库', icon: 'el-icon-box' }
      }
    ]
  },

  // 3. 电子档案保存（多子路由 → 侧边栏可展开菜单）
  {
    path: '/archive-save',
    component: Layout,
    redirect: '/archive-save/index',
    meta: { title: '电子档案保存', icon: 'el-icon-box' },
    children: [
      {
        path: 'index',
        name: 'ArchiveSave',
        component: () => import('@/views/archive/save/index.vue'),
        meta: { title: '档案库管理', icon: 'el-icon-s-management' }
      },
      {
        path: 'material',
        name: 'ArchiveMaterial',
        component: () => import('@/views/archive/save/material.vue'),
        meta: { title: '资料库管理', icon: 'el-icon-s-cooperation' }
      },
      {
        path: 'audiovisual',
        name: 'ArchiveAudiovisual',
        component: () => import('@/views/archive/save/audiovisual.vue'),
        meta: { title: '声像档案', icon: 'el-icon-video-camera' }
      },
      {
        path: 'photo',
        name: 'ArchivePhoto',
        component: () => import('@/views/archive/save/photo.vue'),
        meta: { title: '照片地图', icon: 'el-icon-picture-outline' }
      },
      {
        path: 'four-check-history',
        name: 'ArchiveFourCheckHistory',
        component: () => import('@/views/archive/save/four-check-history.vue'),
        meta: { title: '四性检验历史', icon: 'el-icon-time' }
      }
    ]
  },

  // 4. 电子档案统计（可展开一级菜单：档案数量统计、档案汇总统计、档案入库统计）
  {
    path: '/archive-statistics',
    component: Layout,
    redirect: '/archive-statistics/quantity',
    meta: { title: '电子档案统计', icon: 'el-icon-s-data' },
    children: [
      {
        path: 'quantity',
        name: 'StatsQuantity',
        component: () => import('@/views/statistics/quantity/index.vue'),
        meta: { title: '档案数量统计', icon: 'el-icon-pie-chart' }
      },
      {
        path: 'summary',
        name: 'StatsSummary',
        component: () => import('@/views/statistics/summary/index.vue'),
        meta: { title: '档案汇总统计', icon: 'el-icon-s-data' }
      },
      {
        path: 'entry',
        name: 'StatsEntry',
        component: () => import('@/views/statistics/entry/index.vue'),
        meta: { title: '档案入库统计', icon: 'el-icon-box' }
      }
    ]
  },

  // 5. 电子档案利用（三个子模块）
  {
    path: '/archive-utilize',
    component: Layout,
    redirect: '/archive-utilize/search',
    meta: { title: '电子档案利用', icon: 'el-icon-view' },
    children: [
      {
        path: 'search',
        name: 'UtilizeSearch',
        component: () => import('@/views/archive/utilize/search.vue'),
        meta: { title: '档案全文检索', icon: 'el-icon-search' }
      },
      {
        path: 'online',
        name: 'UtilizeOnline',
        component: () => import('@/views/archive/utilize/online.vue'),
        meta: { title: '在线浏览复用', icon: 'el-icon-monitor' }
      },
      {
        path: 'borrow',
        name: 'UtilizeBorrow',
        component: () => import('@/views/archive/utilize/borrow.vue'),
        meta: { title: '纸质档案借阅', icon: 'el-icon-notebook-2' }
      }
    ]
  },

  // 6. 电子档案处置（四个子模块）
  {
    path: '/archive-disposal',
    component: Layout,
    redirect: '/archive-disposal/expired',
    meta: { title: '电子档案处置', icon: 'el-icon-delete' },
    children: [
      {
        path: 'expired',
        name: 'DisposalExpired',
        component: () => import('@/views/archive/disposal/expired.vue'),
        meta: { title: '到期档案库', icon: 'el-icon-time' }
      },
      {
        path: 'appraisal',
        name: 'DisposalAppraisal',
        component: () => import('@/views/archive/disposal/appraisal.vue'),
        meta: { title: '档案鉴定', icon: 'el-icon-s-check' }
      },
      {
        path: 'material',
        name: 'DisposalMaterial',
        component: () => import('@/views/archive/disposal/material.vue'),
        meta: { title: '编研素材', icon: 'el-icon-collection' }
      },
      {
        path: 'achievement',
        name: 'DisposalAchievement',
        component: () => import('@/views/archive/disposal/achievement.vue'),
        meta: { title: '编研成果', icon: 'el-icon-medal' }
      }
    ]
  },

  // 7. 电子档案库房（五个子模块）
  {
    path: '/archive-warehouse',
    component: Layout,
    redirect: '/archive-warehouse/maintain',
    meta: { title: '电子档案库房', icon: 'el-icon-house' },
    children: [
      {
        path: 'maintain',
        name: 'WarehouseMaintain',
        component: () => import('@/views/archive/warehouse/maintain.vue'),
        meta: { title: '库房维护', icon: 'el-icon-house' }
      },
      {
        path: 'shelf',
        name: 'WarehouseShelf',
        component: () => import('@/views/archive/warehouse/shelf.vue'),
        meta: { title: '密集架管理', icon: 'el-icon-set-up' }
      },
      {
        path: 'display',
        name: 'WarehouseDisplay',
        component: () => import('@/views/archive/warehouse/display.vue'),
        meta: { title: '密集架展示', icon: 'el-icon-monitor' }
      },
      {
        path: 'humiture',
        name: 'WarehouseHumiture',
        component: () => import('@/views/archive/warehouse/humiture.vue'),
        meta: { title: '库房温湿度登记', icon: 'el-icon-odometer' }
      },
      {
        path: 'access',
        name: 'WarehouseAccess',
        component: () => import('@/views/archive/warehouse/access.vue'),
        meta: { title: '人员出入库房登记', icon: 'el-icon-s-check' }
      }
    ]
  },

  // 8. 电子档案年报
  {
    path: '/archive-annual',
    component: Layout,
    redirect: '/archive-annual/index',
    meta: { title: '电子档案年报', icon: 'el-icon-document-copy' },
    children: [
      {
        path: 'index',
        name: 'ArchiveAnnual',
        component: () => import('@/views/archive/annual/index.vue'),
        meta: { title: '电子档案年报', icon: 'el-icon-document-copy' }
      }
    ]
  },

  // 9. 系统管理（可展开一级菜单）
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'el-icon-s-tools' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'el-icon-user', permission: ['system:user:list'] }
      },
      {
        path: 'org',
        name: 'SystemOrg',
        component: () => import('@/views/system/org/index.vue'),
        meta: { title: '机构管理', icon: 'el-icon-office-building', permission: ['system:org:list'] }
      },
      {
        path: 'dept',
        name: 'SystemDept',
        component: () => import('@/views/system/dept/index.vue'),
        meta: { title: '部门管理', icon: 'el-icon-s-custom', permission: ['system:dept:list'] }
      },
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: { title: '字典管理', icon: 'el-icon-collection', permission: ['system:dict:list'] }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@/views/system/log/index.vue'),
        meta: { title: '日志管理', icon: 'el-icon-tickets', permission: ['system:log:list'] }
      }
    ]
  },

  // 10. 个人中心（可展开一级菜单）
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/todo',
    meta: { title: '个人中心', icon: 'el-icon-user-solid' },
    children: [
      {
        path: 'todo',
        name: 'ProfileTodo',
        component: () => import('@/views/profile/todo.vue'),
        meta: { title: '我的待办事项', icon: 'el-icon-finished' }
      },
      {
        path: 'recycle',
        name: 'ProfileRecycle',
        component: () => import('@/views/profile/recycle.vue'),
        meta: { title: '我的回收站', icon: 'el-icon-delete' }
      },
      {
        path: 'history',
        name: 'ProfileHistory',
        component: () => import('@/views/profile/history.vue'),
        meta: { title: '我的工作历程', icon: 'el-icon-time' }
      }
    ]
  },

  // 兜底：404 必须放最后（addRoutes 之后匹配）
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  mode: 'hash', // hash 模式部署最简单（不需要 nginx history 回退配置）；如需 history 自行修改
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

/**
 * 重置路由：
 * 退出登录时调用。vue-router 3.x 的 addRoutes 无法清空已添加路由，
 * 只能通过"新建 Router 实例 + matcher 替换"的方式重置。
 */
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // 关键：替换 matcher
}

export default router
