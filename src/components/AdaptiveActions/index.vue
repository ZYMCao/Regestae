<template>
  <!--
    自适应操作按钮条
    宽度足够时按钮平铺展示；宽度缩小时放不下的按钮收进「...」下拉
    items: [{ key, label, icon, type, plain, color, disabled, children: [{ key, label, icon, disabled }] }]
    点击按钮/下拉项统一 emit('click', item)，带 children 的按钮点击展开子菜单
  -->
  <div :class="['adaptive-actions', { measuring }]">
    <template v-for="(item, index) in items">
      <!-- 平铺：带子菜单的按钮 → el-dropdown 包裹 -->
      <el-dropdown
        v-if="item.children && item.children.length"
        :key="item.key || index"
        v-show="measuring || index < visibleCount"
        class="aa-item-wrap"
        trigger="click"
        popper-append-to-body
        @command="child => onChildClick(item, child)"
      >
        <el-button
          :size="size"
          :type="item.type || ''"
          :plain="!!item.plain"
          :icon="item.icon"
          :disabled="!!item.disabled"
          class="aa-btn aa-item"
        >
          {{ item.label }}<i class="el-icon-arrow-down el-icon--right aa-caret" />
        </el-button>
        <el-dropdown-menu slot="dropdown" class="aa-dropdown-menu">
          <el-dropdown-item
            v-for="child in item.children"
            :key="child.key"
            :command="child"
            :disabled="!!child.disabled"
          >
            <i v-if="child.icon" :class="child.icon" class="aa-dd-icon" :style="child.color ? { color: child.color } : null" />
            <span class="aa-dd-label">{{ child.label }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <!-- 平铺：普通按钮 -->
      <el-button
        v-else
        :key="item.key || index"
        v-show="measuring || index < visibleCount"
        :size="size"
        :type="item.type || ''"
        :plain="!!item.plain"
        :icon="item.icon"
        :disabled="!!item.disabled"
        class="aa-btn aa-item"
        @click="emitClick(item)"
      >{{ item.label }}</el-button>
    </template>

    <!-- 「...」收纳下拉：展示放不下的按钮 -->
    <el-dropdown
      v-show="measuring || visibleCount < items.length"
      ref="moreDropdown"
      class="aa-more-wrap"
      trigger="click"
      popper-append-to-body
      @command="onMoreCommand"
    >
      <el-button :size="size" class="aa-btn aa-more">
        <i class="el-icon-more aa-more-dots" />
        <i class="el-icon-arrow-down el-icon--right aa-arrow" />
      </el-button>
      <el-dropdown-menu slot="dropdown" class="aa-dropdown-menu">
        <template v-for="(item, index) in hiddenItems">
          <!-- 有子菜单：hover 展开二级菜单 -->
          <li
            v-if="item.children && item.children.length"
            :key="item.key || visibleCount + index"
            class="el-dropdown-menu__item aa-sub-item"
          >
            <span class="aa-dd-label-wrap">
              <i v-if="item.icon" :class="item.icon" class="aa-dd-icon" :style="item.color ? { color: item.color } : null" />
              <span class="aa-dd-label">{{ item.label }}</span>
            </span>
            <i class="el-icon-arrow-right aa-sub-arrow" />
            <ul class="aa-sub-menu">
              <li
                v-for="child in item.children"
                :key="child.key"
                class="el-dropdown-menu__item aa-sub-menu-item"
                :class="{ 'is-disabled': !!child.disabled }"
                @click.stop="onSubChildClick(item, child)"
              >
                <i v-if="child.icon" :class="child.icon" class="aa-dd-icon" :style="child.color ? { color: child.color } : null" />
                <span class="aa-dd-label">{{ child.label }}</span>
              </li>
            </ul>
          </li>

          <!-- 无子菜单：普通项 -->
          <el-dropdown-item
            v-else
            :key="item.key || visibleCount + index"
            :command="item"
            :disabled="!!item.disabled"
          >
            <i v-if="item.icon" :class="item.icon" class="aa-dd-icon" :style="item.color ? { color: item.color } : null" />
            <span class="aa-dd-label">{{ item.label }}</span>
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'AdaptiveActions',
  props: {
    /** 按钮配置：[{ key, label, icon, type, plain, color, disabled, children }] */
    items: { type: Array, default: () => [] },
    /** 按钮尺寸 */
    size: { type: String, default: 'mini' },
    /** 按钮间距 */
    gap: { type: Number, default: 8 }
  },
  data() {
    return {
      /** 当前可直接展示的按钮数量 */
      visibleCount: this.items.length,
      /** 测量模式：临时展示全部按钮以获取真实宽度（visibility:hidden 防闪烁） */
      measuring: false
    }
  },
  computed: {
    hiddenItems() {
      return this.items.slice(this.visibleCount)
    }
  },
  watch: {
    items: {
      handler() {
        this.$nextTick(() => this.recalculate())
      },
      deep: true
    }
  },
  mounted() {
    // 监听容器宽度变化（窗口缩放、侧边栏收起、弹窗等场景均触发）
    this.ro = new ResizeObserver(() => this.recalculate())
    this.ro.observe(this.$el)
    this.recalculate()
  },
  beforeDestroy() {
    this.ro && this.ro.disconnect()
  },
  methods: {
    emitClick(item) {
      if (!item || item.disabled) return
      this.$emit('click', item)
    },
    /** 平铺按钮的子菜单命令 */
    onChildClick(item, child) {
      this.emitClick(child)
    },
    /** 「...」菜单普通项命令 */
    onMoreCommand(item) {
      this.emitClick(item)
    },
    /** 「...」菜单二级子菜单项点击（需手动关闭菜单） */
    onSubChildClick(item, child) {
      if (!child || child.disabled) return
      const dropdown = this.$refs.moreDropdown
      dropdown && dropdown.hide && dropdown.hide()
      this.emitClick(child)
    },
    /** 测量各按钮宽度，计算能直接放下的数量 */
    async recalculate() {
      const total = this.items.length
      if (!total) {
        this.visibleCount = 0
        return
      }
      const containerWidth = this.$el.clientWidth
      // 容器不可见（如处于隐藏 tab）时跳过，待显示后 ResizeObserver 会再次触发
      if (!containerWidth) return

      this.measuring = true
      await this.$nextTick()

      const itemEls = this.$el.querySelectorAll('.aa-item')
      const widths = Array.from(itemEls).map(el => el.offsetWidth)
      const moreEl = this.$el.querySelector('.aa-more')
      const moreWidth = (moreEl && moreEl.offsetWidth) || 40

      let sum = 0
      let count = 0
      for (let i = 0; i < total; i++) {
        const w = widths[i] || 0
        // 已放下的按钮 + 当前按钮 +（后面还有按钮时需预留「...」下拉的位置）
        const need = sum + (i > 0 ? this.gap : 0) + w + (i < total - 1 ? this.gap + moreWidth : 0)
        if (need <= containerWidth) {
          sum += (i > 0 ? this.gap : 0) + w
          count = i + 1
        } else {
          break
        }
      }
      this.visibleCount = count
      this.measuring = false
    }
  }
}
</script>

<style lang="scss" scoped>
.adaptive-actions {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  overflow: hidden;
  gap: 8px;
  justify-content: flex-end;

  /* // 按钮间距统一由 gap 控制 */
  ::v-deep .el-button {
    margin-left: 0;
    flex-shrink: 0;
  }

  ::v-deep .aa-more {
    padding: 0 8px;

    .aa-more-dots {
      font-size: 14px;
      vertical-align: middle;
    }

    .aa-arrow {
      margin-left: 2px;
    }
  }

  ::v-deep .aa-caret {
    margin-left: 2px;
  }

  // 测量期间隐藏按钮内容，避免闪现
  &.measuring ::v-deep .el-button {
    visibility: hidden;
  }
}
</style>

<style lang="scss">
/* 「...」下拉菜单（popper 挂载在 body，需用全局样式） */
.aa-dropdown-menu {
  min-width: 170px;

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 30px;
    padding: 0 16px;

    .aa-dd-icon {
      font-size: 14px;
    }

    .aa-dd-label-wrap {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
  }

  /* 二级子菜单：hover 展开到右侧 */
  .aa-sub-item {
    position: relative;
    justify-content: space-between;
    cursor: pointer;
    color: #606266;

    .aa-sub-arrow {
      font-size: 12px;
      color: #909399;
    }

    .aa-sub-menu {
      display: none;
      position: absolute;
      left: 100%;
      top: -6px;
      z-index: 1;
      min-width: 180px;
      list-style: none;
      margin: 0;
      padding: 6px 0;
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    &:hover {
      color: #409eff;
      background: #ecf5ff;

      .aa-sub-arrow { color: #409eff; }
      .aa-sub-menu { display: block; }
    }
  }

  .aa-sub-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 30px;
    padding: 0 16px;
    color: #606266;
    cursor: pointer;
    white-space: nowrap;

    .aa-dd-icon { font-size: 14px; }

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }

    &.is-disabled {
      color: #c0c4cc;
      cursor: not-allowed;

      &:hover {
        color: #c0c4cc;
        background: transparent;
      }
    }
  }
}
</style>
