<template>
  <div class="display-page">
    <!-- 左侧：库房分类目录 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="whKeyword" placeholder="搜索库名称" size="small" clearable @keyup.enter.native="doWhFilter">
          <el-button slot="append" icon="el-icon-search" @click="doWhFilter" />
        </el-input>
      </div>
      <div class="panel-header">库房分类目录</div>
      <div class="tree-wrap">
        <el-tree
          ref="whTree"
          :data="treeData"
          node-key="id"
          :default-expanded-keys="[1]"
          :props="{ label: 'name', children: 'children' }"
          highlight-current
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i :class="data.type === '库房' ? 'el-icon-folder c-orange' : 'el-icon-folder c-blue'" />
            <span class="node-name">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧：库房案卷目录 -->
    <div class="right-panel">
      <div class="section-bar">
        <span class="section-title">库房案卷目录</span>
        <el-button size="mini" class="refresh-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
      </div>
      <div class="total-bar">
        <span>存放总量: {{ totalCount }}</span>
      </div>
      <div class="layer-area">
        <div v-for="layer in layers" :key="layer" class="layer-block">
          <div class="layer-title">{{ layer }}</div>
          <div class="layer-box" />
        </div>
        <div v-if="!layers.length" class="layer-empty">请选择密集架</div>
      </div>
    </div>
  </div>
</template>

<script>
// 库房树（与库房维护数据一致）
const TREE_DATA = [
  {
    id: 1,
    name: '测试',
    type: '库房',
    children: [
      { id: 11, name: '密集架1', type: '密集架' },
      { id: 12, name: '密集架2', type: '密集架' },
      { id: 13, name: '密集架3', type: '密集架' },
      { id: 14, name: '密集架4', type: '密集架' }
    ]
  }
]

// 各密集架下的层（静态演示）
const LAYERS_MAP = {
  '密集架1': ['密集架1-列1列1层002层', '密集架1-列1列1层1层'],
  '密集架2': [],
  '密集架3': [],
  '密集架4': []
}

export default {
  name: 'WarehouseDisplay',
  data() {
    return {
      whKeyword: '',
      treeData: TREE_DATA,
      currentNode: null,
      layers: []
    }
  },
  computed: {
    totalCount() {
      return this.layers.length ? 0 : 0 // 各层存放量均为0
    }
  },
  mounted() {
    // 默认选中密集架1（与截图一致）
    this.$nextTick(() => {
      const first = this.treeData[0].children[0]
      this.currentNode = first
      this.layers = LAYERS_MAP[first.name] || []
      this.$refs.whTree && this.$refs.whTree.setCurrentKey(first.id)
    })
  },
  methods: {
    doWhFilter() {
      // 库房树已随 whKeyword 过滤（演示数据仅1个库房，暂不实现关键字过滤）
    },
    handleNodeClick(data) {
      this.currentNode = data
      this.layers = data.type === '密集架' ? (LAYERS_MAP[data.name] || []) : []
    },
    handleRefresh() {
      if (this.currentNode && this.currentNode.type === '密集架') {
        this.layers = LAYERS_MAP[this.currentNode.name] || []
      }
      this.$message.success('已刷新')
    }
  }
}
</script>

<style lang="scss" scoped>
.display-page {
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

  .tree-wrap {
    flex: 1;
    overflow: auto;

    .tree-node {
      display: inline-flex;
      align-items: center;
      font-size: 13px;

      i {
        font-size: 14px;
        margin-right: 4px;
      }

      .node-name {
        color: #303133;
      }
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

  .refresh-btn {
    font-size: 12px;

    i {
      margin-right: 3px;
    }
  }
}

.total-bar {
  background: #cfe3fb;
  padding: 8px 12px;
  text-align: center;
  font-size: 13px;
  font-weight: bold;
  color: #303133;
}

.layer-area {
  flex: 1;
  padding: 24px 40px;
  overflow: auto;

  .layer-block {
    margin-bottom: 28px;

    .layer-title {
      text-align: center;
      font-size: 15px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 12px;
    }

    .layer-box {
      width: 410px;
      height: 355px;
      border: 2px solid #303133;
      background: #fff;
      box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.65);
    }
  }

  .layer-empty {
    text-align: center;
    font-size: 12px;
    color: #909399;
    padding-top: 40px;
  }
}

.c-orange { color: #e6a23c; }
.c-blue { color: $themeColor; }
.c-green { color: #67c23a; }
</style>
