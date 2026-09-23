<template>
  <!--
    递归菜单项组件：
    - 无子路由或只有单个可见子路由 → 渲染 el-menu-item（叶子）
    - 多个子路由 → 渲染 el-submenu（可展开），内部递归调用自身
  -->
  <div v-if="!item.hidden">
    <!-- 情况1：只有一层可见子菜单，直接渲染该子菜单为叶子节点 -->
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyChild.children || onlyChild.noShowingChildren)">
      <router-link v-if="onlyChild.meta" :to="resolvePath(onlyChild.path)">
        <el-menu-item :index="resolvePath(onlyChild.path)">
          <item
            :icon="onlyChild.meta.icon || (item.meta && item.meta.icon)"
            :title="onlyChild.meta.title"
          />
        </el-menu-item>
      </router-link>
      <el-menu-item v-else :index="resolvePath()">
        <item
          :icon="item.meta && item.meta.icon"
          :title="item.meta && item.meta.title"
          :show-title="!isCollapse"
        />
      </el-menu-item>
    </template>

    <!-- 情况2：多级菜单，渲染 el-submenu -->
    <el-submenu v-else :index="resolvePath()">
      <template slot="title">
        <item
          :icon="item.meta && item.meta.icon"
          :title="item.meta && item.meta.title"
          :show-title="!isCollapse"
        />
      </template>
      <!-- 递归渲染子菜单 -->
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
        :isCollapse="isCollapse"
      />
    </el-submenu>
  </div>
</template>

<script>
import Item from './Item.vue'

export default {
  name: 'SidebarItem',
  components: { Item },
  props: {
    // 路由对象
    item: { type: Object, required: true },
    // 父级路径前缀（用于拼接完整路径）
    basePath: { type: String, default: '' },
    // 是否为折叠状态
    isCollapse: { type: Boolean, default: false }
  },
  data() {
    this.onlyChild = null
    return {}
  },
  methods: {
    /**
     * 判断是否只有一个可见子路由
     * 处理了 children 为空、children 中有 hidden 项等边界情况
     */
    hasOneShowingChild(children = [], parent) {
      const showingChildren = (children || []).filter(item => !item.hidden)

      // 没有子路由：将自身当作叶子
      if (showingChildren.length === 0) {
        this.onlyChild = { ...parent, path: '', noShowingChildren: true }
        return true
      }

      // 只有一个可见子路由
      // if (showingChildren.length === 1) {
      //   this.onlyChild = showingChildren[0]
      //   return true
      // }

      // 多个子路由
      return false
    },

    /**
     * 拼接完整路径（支持绝对路径直接返回）
     */
    resolvePath(routePath = '') {
      if (routePath.startsWith('/')) return routePath // 外部/绝对路径
      if (!routePath) return this.basePath || '/'
      // 完整路径 = basePath + '/' + routePath（处理斜杠重复）
      return (this.basePath + '/' + routePath).replace(/\/+/g, '/')
    }
  }
}
</script>
