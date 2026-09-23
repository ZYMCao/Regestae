<template>
  <!-- 声像档案：左档案类别树 + 右视频预览卡片墙（静态演示数据，不请求接口） -->
  <div class="audiovisual-page">
    <!-- 左侧：档案类别 -->
    <div class="left-panel">
      <div class="search-row">
        <el-input
          v-model="treeKeyword"
          placeholder="请输入档案类别"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        />
        <el-button class="search-btn" size="small" icon="el-icon-search" @click="filterTree" />
      </div>
      <div class="tree-title">档案类别</div>
      <div class="left-tree-wrap">
        <el-tree
          ref="categoryTree"
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :default-expanded-keys="[1, 13, 136]"
          highlight-current
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i v-if="data.children && data.children.length" class="tree-icon folder el-icon-folder-opened" />
            <i v-else class="tree-icon leaf el-icon-document" />
            <span class="tree-label">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧：视频预览 -->
    <div class="right-panel">
      <div class="list-header">
        <span class="header-title">视频预览</span>
      </div>
      <div class="filter-bar">
        <el-button size="small" class="refresh-btn" icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
        <el-input
          v-model="keyword"
          placeholder="请输入视频标题"
          size="small"
          clearable
          class="keyword-input"
          @keyup.enter.native="handleSearch"
        />
        <el-button class="search-btn" size="small" icon="el-icon-search" @click="handleSearch" />
        <span class="date-label">日期：</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          size="small"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          class="date-picker"
        />
      </div>
      <div class="sort-bar">
        <span class="sort-label">排序：</span>
        <el-button size="mini" :class="['sort-btn', sortBy === 'upload' && 'active']" @click="handleSort('upload')">最新上传</el-button>
        <el-button size="mini" :class="['sort-btn', sortBy === 'play' && 'active']" @click="handleSort('play')">最高播放</el-button>
        <el-button size="mini" :class="['sort-btn', sortBy === 'clip' && 'active']" @click="handleSort('clip')">切片</el-button>
      </div>

      <!-- 视频卡片墙 -->
      <div class="video-grid-wrap">
        <div class="video-grid">
          <div v-for="item in pagedVideos" :key="item.id" :class="['video-card', item.id === selectedId && 'active']" @click="handleCardClick(item)">
            <div class="video-cover">
              <i class="el-icon-video-play play-icon" />
            </div>
            <div class="video-name" :title="item.title">{{ item.title }}</div>
            <div class="video-desc">此视频暂无描述...</div>
            <div class="video-footer">
              <span class="fmt">格式：{{ item.fmt }}</span>
              <a class="link" @click.stop="handleDownload(item)">下载</a>
              <span class="clip-tag" @click.stop="handleClip(item)">已切片</span>
            </div>
          </div>
        </div>
        <div v-if="!filteredVideos.length" class="empty-tip">暂无数据</div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="filteredVideos.length"
          :current-page.sync="pageNum"
          :page-size.sync="pageSize"
          :page-sizes="[20, 40, 60, 100]"
        />
      </div>
    </div>
  </div>
</template>

<script>
// 档案类别树（静态演示数据）
const TREE_DATA = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    children: [
      {
        id: 13,
        name: '第三部分 工程管理文件',
        children: [
          {
            id: 136,
            name: '六、声像文件',
            children: [
              { id: 1362, name: '（二）录像档案' }
            ]
          }
        ]
      },
      {
        id: 14,
        name: '第四部分 施工文件',
        children: [
          { id: 141, name: '一、路基施工文件' },
          { id: 142, name: '二、路面施工文件' }
        ]
      }
    ]
  }
]

// 视频标题池（对应截图中的 20 条）
const TITLE_POOL = [
  '姚江枢纽主线桥姚江岸侧第一节段浇筑', '学院路高架（2月26日）', '姚江3号高架桥（3月2日）', '姚江3号高架桥（1月18日）',
  '姚江3号高架桥（4月25日）', '大侣互通(1月14日)', '大侣互通（3月27日）', '姚江枢纽主线桥姚江岸侧第二节段浇筑',
  '学院路高架（4月15日）', '姚江枢纽主线桥姚江侧挂篮拼装', '姚江3号高架桥（2月20日）', '姚江枢纽主线桥姚江岸侧合龙段浇筑',
  '姚江枢纽主线桥姚江侧悬浇施工', '姚江3号高架桥（4月10日）', '大侣互通（4月15日）', '大侣互通（2月27日）',
  '大侣互通收费站（4月20日）', '学院路高架（1月14日）', '学院路高架（3月27日）', '姚江主线桥（8月15日）'
]

// 生成 1463 条静态视频数据（与截图分页一致）
const VIDEO_LIST = (() => {
  const list = []
  const total = 1463
  for (let i = 1; i <= total; i++) {
    const month = (i % 12) + 1
    const day = (i % 27) + 1
    list.push({
      id: i,
      categoryId: 1362,
      title: TITLE_POOL[(i - 1) % TITLE_POOL.length],
      fmt: 'mp4',
      uploadDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      playCount: (i * 37) % 2000,
      clipped: true
    })
  }
  return list
})()

export default {
  name: 'ArchiveAudiovisual',
  data() {
    return {
      treeKeyword: '',
      treeData: JSON.parse(JSON.stringify(TREE_DATA)),
      currentNodeId: 1362,
      keyword: '',
      appliedKeyword: '',
      dateRange: [],
      sortBy: 'upload', // upload-最新上传 / play-最高播放 / clip-切片
      selectedId: 2,
      pageNum: 1,
      pageSize: 20,
      videoList: JSON.parse(JSON.stringify(VIDEO_LIST))
    }
  },
  computed: {
    /** 过滤 + 排序后的视频列表 */
    filteredVideos() {
      const ids = [this.currentNodeId, ...this.collectChildIds(this.currentNodeId)]
      let list = this.videoList.filter(v => ids.indexOf(v.categoryId) > -1)
      if (this.appliedKeyword && this.appliedKeyword.trim()) {
        const kw = this.appliedKeyword.trim()
        list = list.filter(v => v.title.indexOf(kw) > -1)
      }
      if (this.dateRange && this.dateRange.length === 2) {
        const [start, end] = this.dateRange
        list = list.filter(v => v.uploadDate >= start && v.uploadDate <= end)
      }
      if (this.sortBy === 'upload') {
        list = [...list].sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : -1))
      } else if (this.sortBy === 'play') {
        list = [...list].sort((a, b) => b.playCount - a.playCount)
      } else if (this.sortBy === 'clip') {
        list = [...list].sort((a, b) => (b.clipped === true) - (a.clipped === true))
      }
      return list
    },
    /** 当前页视频卡片 */
    pagedVideos() {
      const start = (this.pageNum - 1) * this.pageSize
      return this.filteredVideos.slice(start, start + this.pageSize)
    }
  },
  watch: {
    treeKeyword(val) {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(val)
    }
  },
  methods: {
    /** 收集某节点全部后代 id */
    collectChildIds(id) {
      const ids = []
      const walk = (nodes) => {
        for (const node of nodes) {
          if (node.children && node.children.length) {
            ids.push(node.id)
            walk(node.children)
          }
        }
      }
      const find = (nodes) => {
        for (const node of nodes) {
          if (node.id === id) {
            walk(node.children || [])
            return true
          }
          if (node.children && find(node.children)) return true
        }
        return false
      }
      find(this.treeData)
      return ids
    },

    /** 树节点过滤 */
    filterNode(value, data) {
      if (!value) return true
      return data.name.indexOf(value) > -1
    },

    filterTree() {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(this.treeKeyword)
    },

    /** 点击树节点 */
    handleNodeClick(data) {
      this.currentNodeId = data.id
      this.pageNum = 1
    },

    handleSearch() {
      this.appliedKeyword = this.keyword
      this.pageNum = 1
    },

    handleRefresh() {
      this.keyword = ''
      this.appliedKeyword = ''
      this.dateRange = []
      this.sortBy = 'upload'
      this.pageNum = 1
      this.$message.success('刷新成功')
    },

    /** 切换排序 */
    handleSort(type) {
      if (this.sortBy === type) return
      this.sortBy = type
      this.pageNum = 1
    },

    /** 点击视频卡片 */
    handleCardClick(item) {
      this.selectedId = item.id
      this.$message.info(`播放视频：${item.title}`)
    },

    handleDownload(item) {
      this.$message.info(`下载视频：${item.title}`)
    },

    handleClip(item) {
      this.$message.info(`查看切片：${item.title}`)
    }
  }
}
</script>

<style scoped lang="scss">
.audiovisual-page {
  display: flex;
  gap: 12px;
  height: 100%;
  padding: 12px;
  background: #f0f2f5;
  box-sizing: border-box;
}

/* ===== 左侧档案类别树 ===== */
.left-panel {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;

  .search-row {
    display: flex;
    gap: 6px;

    .el-input {
      flex: 1;
    }

    .search-btn {
      padding: 9px 12px;
    }
  }

  .tree-title {
    margin: 12px 0 6px;
    padding: 6px 8px;
    font-size: 13px;
    font-weight: 700;
    color: #303133;
    background: #eef5ff;
    border-radius: 3px;
  }

  .left-tree-wrap {
    flex: 1;
    overflow: auto;
    padding: 4px 0;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding-right: 8px;
  font-size: 13px;

  .tree-icon {
    margin-right: 5px;
    font-size: 14px;

    &.folder {
      color: #e6a23c;
    }

    &.leaf {
      color: #409eff;
    }
  }

  .tree-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ===== 右侧视频预览 ===== */
.right-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

/* 蓝色标题栏 */
.list-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #409eff;
  border-radius: 4px;

  .header-title {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
  }
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  .refresh-btn {
    color: #67c23a;
    border-color: #67c23a;

    &:hover,
    &:focus {
      color: #85cf60;
      border-color: #85cf60;
    }
  }

  .keyword-input {
    width: 180px;
  }

  .search-btn {
    padding: 9px 12px;
  }

  .date-label {
    font-size: 13px;
    color: #606266;
    margin-left: 8px;
  }

  .date-picker {
    width: 260px;
  }
}

/* 排序栏 */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;

  .sort-label {
    font-size: 13px;
    color: #606266;
  }

  .sort-btn {
    &.active {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
    }
  }
}

/* 视频卡片墙 */
.video-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px;
  }

  .video-card {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 6px;
    cursor: pointer;
    background: #fff;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    }

    &.active {
      background: #e4e7ed;
      border-color: #dcdfe6;
    }

    .video-cover {
      position: relative;
      height: 110px;
      background: #f5f7fa;
      border: 1px solid #ebeef5;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;

      .play-icon {
        font-size: 34px;
        color: #c0c4cc;
      }
    }

    .video-name {
      margin-top: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .video-desc {
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .video-footer {
      display: flex;
      align-items: center;
      margin-top: 6px;
      font-size: 12px;

      .fmt {
        color: #606266;
      }

      .link {
        margin-left: 8px;
        color: #409eff;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      .clip-tag {
        margin-left: auto;
        padding: 1px 6px;
        border: 1px solid #67c23a;
        border-radius: 3px;
        color: #67c23a;
        cursor: pointer;

        &:hover {
          background: #f0f9eb;
        }
      }
    }
  }

  .empty-tip {
    padding: 60px 0;
    text-align: center;
    color: #909399;
    font-size: 13px;
  }
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: flex-start;
  padding-top: 12px;
}
</style>
