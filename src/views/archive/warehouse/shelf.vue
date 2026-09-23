<template>
  <div class="shelf-page">
    <!-- 左侧：库房分类目录 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="whKeyword" placeholder="搜索库名称" size="small" clearable @keyup.enter.native="doWhFilter">
          <el-button slot="append" icon="el-icon-search" @click="doWhFilter" />
        </el-input>
      </div>
      <div class="panel-header">库房分类目录</div>
      <div class="wh-list">
        <div v-for="wh in filteredWhs" :key="wh" :class="['wh-item', wh === activeWh ? 'active' : '']" @click="selectWh(wh)">
          <i class="el-icon-menu wh-icon" />
          <span class="wh-name">{{ wh }}</span>
        </div>
        <div v-if="!filteredWhs.length" class="wh-empty">暂无匹配库房</div>
      </div>
    </div>

    <!-- 右侧：库房密集目录 -->
    <div class="right-panel">
      <div class="section-bar">
        <span class="section-title">库房密集目录</span>
        <div class="section-tools">
          <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
          <el-button size="mini" class="tool-btn" @click="handleMove(-1)"><i class="el-icon-caret-left c-orange" />左移</el-button>
          <el-button size="mini" class="tool-btn" @click="handleStop"><span class="stop-square" />停止</el-button>
          <el-button size="mini" class="tool-btn" @click="handleMove(1)"><i class="el-icon-caret-right c-yellow" />右移</el-button>
          <el-button size="mini" class="tool-btn" @click="handleAutoClose"><i class="el-icon-refresh c-blue" />自动闭架</el-button>
          <el-button size="mini" class="tool-btn" @click="handleVentilate"><i class="el-icon-wind-power c-orange" />通风</el-button>
          <el-button size="mini" class="tool-btn" @click="handleClose"><i class="el-icon-switch-button c-grey" />关闭</el-button>
        </div>
      </div>
      <div class="status-bar">
        <span class="st-item">当前选中: {{ selectedShelf ? selectedShelf.name : '无' }}</span>
        <span class="st-item">整套架状态: {{ frameStatus }}</span>
        <span class="st-item">库房当前温度: {{ temperature }}</span>
        <span class="st-item">库房当前湿度: {{ humidity }}</span>
      </div>
      <div class="shelf-area">
        <div
          v-for="shelf in shelves"
          :key="shelf.id"
          :class="['shelf-bar', selectedShelf && selectedShelf.id === shelf.id ? 'selected' : '']"
          @click="selectShelf(shelf)"
        >
          <span class="shelf-name">{{ shelf.name }}</span>
        </div>
        <div v-if="!shelves.length" class="shelf-empty">请选择库房</div>
      </div>
    </div>
  </div>
</template>

<script>
// 库房及密集架（与库房维护数据一致）
const WHS = ['测试']
const SHELVES_MAP = {
  '测试': ['密集架1', '密集架2', '密集架3', '密集架4']
}

export default {
  name: 'WarehouseShelf',
  data() {
    return {
      whKeyword: '',
      whs: WHS,
      activeWh: '测试',
      shelves: [],
      selectedShelf: null,
      frameStatus: '闭架',
      temperature: 4,
      humidity: 4
    }
  },
  computed: {
    filteredWhs() {
      const kw = this.whKeyword.trim()
      if (!kw) return this.whs
      return this.whs.filter(w => w.indexOf(kw) > -1)
    }
  },
  mounted() {
    this.loadShelves()
    // 默认选中最后一个密集架（与截图一致）
    if (this.shelves.length) {
      this.selectedShelf = this.shelves[this.shelves.length - 1]
    }
  },
  methods: {
    doWhFilter() {
      // 库房列表已随 whKeyword 计算过滤
    },
    loadShelves() {
      this.shelves = (SHELVES_MAP[this.activeWh] || []).map((name, i) => ({ id: i + 1, name }))
    },
    selectWh(wh) {
      this.activeWh = wh
      this.loadShelves()
      this.selectedShelf = this.shelves.length ? this.shelves[this.shelves.length - 1] : null
    },
    selectShelf(shelf) {
      this.selectedShelf = shelf
    },
    handleRefresh() {
      this.loadShelves()
      this.$message.success('已刷新')
    },
    handleMove(dir) {
      if (!this.selectedShelf) {
        this.$message.warning('请先选择密集架')
        return
      }
      const idx = this.shelves.findIndex(s => s.id === this.selectedShelf.id)
      const target = idx + dir
      if (target < 0 || target >= this.shelves.length) {
        this.$message.warning('已无法继续' + (dir < 0 ? '左移' : '右移'))
        return
      }
      const tmp = this.shelves[idx]
      this.$set(this.shelves, idx, this.shelves[target])
      this.$set(this.shelves, target, tmp)
      this.$message.info(this.selectedShelf.name + (dir < 0 ? ' 左移' : ' 右移'))
    },
    handleStop() {
      this.$message.info('已停止')
    },
    handleAutoClose() {
      this.frameStatus = '闭架'
      this.$message.success('自动闭架指令已下发')
    },
    handleVentilate() {
      this.$message.info('通风指令已下发')
    },
    handleClose() {
      this.$message.info('已关闭')
    }
  }
}
</script>

<style lang="scss" scoped>
.shelf-page {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.left-panel {
  width: 235px;
  min-width: 235px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #fff;

  .search-bar {
    padding: 10px 10px 8px;
  }

  .panel-header {
    background: #d9e8fb;
    padding: 8px 12px;
    font-size: 13px;
    color: #303133;
    border-top: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
  }

  .wh-list {
    flex: 1;
    overflow: auto;

    .wh-item {
      display: flex;
      align-items: center;
      padding: 9px 14px;
      font-size: 13px;
      color: #303133;
      cursor: pointer;

      .wh-icon {
        color: $themeColor;
        margin-right: 6px;
      }

      .wh-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &:hover {
        background: #f5f7fa;
      }

      &.active {
        background: #d9e8fb;
      }
    }

    .wh-empty {
      padding: 20px 14px;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }
}

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: auto;
}

.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $themeColor;
  padding: 5px 12px;

  .section-title {
    color: #fff;
    font-size: 13px;
    font-weight: bold;
  }

  .section-tools {
    display: flex;
    align-items: center;

    .tool-btn {
      margin-left: 6px;
      font-size: 12px;

      i {
        margin-right: 3px;
      }
    }

    .stop-square {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: #2fbf5b;
      border-radius: 1px;
      margin-right: 4px;
      vertical-align: middle;
    }
  }
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #cfe3fb;
  padding: 8px 12px;

  .st-item {
    font-size: 13px;
    font-weight: bold;
    color: #303133;
    margin: 0 22px;
  }
}

.shelf-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 90px 40px;

  .shelf-bar {
    width: 44px;
    height: 560px;
    margin-right: 8px;
    border-radius: 8px;
    background: linear-gradient(180deg, #2e80ef 0%, #1c64e0 100%);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    .shelf-name {
      color: #fff;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 6px;
      writing-mode: vertical-lr;
      text-orientation: sideways;
    }

    &:hover {
      opacity: 0.92;
    }

    &.selected {
      background: linear-gradient(180deg, #0d52b8 0%, #083d8c 100%);
    }
  }

  .shelf-empty {
    font-size: 12px;
    color: #909399;
  }
}

.c-green { color: #67c23a; }
.c-orange { color: #e6a23c; }
.c-yellow { color: #fadb14; }
.c-blue { color: $themeColor; }
.c-grey { color: #909399; }
</style>
