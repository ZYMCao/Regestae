<template>
  <!-- 照片地窖：高德地图全屏展示 + 顶部工具条 + 照片库/新增/批量上传弹窗（静态演示数据） -->
  <div class="photo-map-page">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container" />

    <!-- 顶部工具条 -->
    <div class="map-toolbar">
      <el-input
        v-model="searchAddr"
        placeholder="输入查询地址"
        size="small"
        clearable
        class="addr-input"
        @keyup.enter.native="handleSearchAddr"
      />
      <el-button size="small" icon="el-icon-search" @click="handleSearchAddr" />
      <el-button type="primary" size="small" @click="galleryVisible = true">照片库</el-button>
      <el-button type="primary" size="small" @click="openAddDialog">新增</el-button>
      <el-button type="primary" size="small" @click="uploadVisible = true">批量上传</el-button>
      <el-button size="small" @click="handleExpandAll">{{ expandAll ? '一键收拢' : '一键展开' }}</el-button>
      <el-select v-model="photoLimit" size="small" class="limit-select">
        <el-option v-for="n in limitOptions" :key="n" :label="`照片数量: ${n}`" :value="n" />
      </el-select>
    </div>

    <!-- ================= 照片库弹窗 ================= -->
    <el-dialog
      title="照片库"
      :visible.sync="galleryVisible"
      width="1000px"
      top="6vh"
      custom-class="photo-gallery-dialog"
      append-to-body
    >
      <div class="gallery-body">
        <!-- 左侧：档案分类目录 -->
        <div class="gallery-left">
          <div class="gallery-left-head">
            <span class="cat-label">档案分类目录</span>
            <el-select v-model="orgScope" size="mini" class="org-select">
              <el-option label="全公司" value="all" />
              <el-option label="柯诸高速项目" value="project" />
            </el-select>
          </div>
          <div class="gallery-tree-wrap">
            <el-tree
              :key="'gallery-tree-' + expandAll"
              :data="categoryTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              :default-expand-all="expandAll"
              :default-expanded-keys="expandAll ? [] : [1, 11]"
              :current-node-key="'unclassified'"
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleGalleryNodeClick"
            >
              <span slot-scope="{ data, node }" class="gallery-tree-node">
                <i :class="nodeIcon(data, node)" />
                <span class="label">{{ data.name }}</span>
              </span>
            </el-tree>
          </div>
        </div>

        <!-- 右侧：照片展示区 -->
        <div class="gallery-right">
          <div class="gallery-right-head">
            <span class="display-label">照片展示方式：</span>
            <span class="group-opt" :class="{ active: !groupByMonth }" @click="groupByMonth = false">按天分组</span>
            <el-switch v-model="groupByMonth" active-color="#409EFF" />
            <span class="group-opt" :class="{ active: groupByMonth }" @click="groupByMonth = true">按月分组</span>
          </div>
          <div class="gallery-photos">
            <template v-if="groupedPhotos.length">
              <div v-for="group in groupedPhotos" :key="group.key" class="photo-group">
                <div class="group-title">{{ group.label }}（{{ group.items.length }}）</div>
                <div class="photo-grid">
                  <div v-for="p in group.items" :key="p.id" class="photo-card" @click="handlePreview(p)">
                    <img :src="p.url" :alt="p.name" loading="lazy">
                    <div class="photo-name" :title="p.name">{{ p.name }}</div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="gallery-empty">
              <i class="el-icon-picture-outline" />
              <p>暂无照片</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- ================= 新增照片六要素弹窗（组件） ================= -->
    <photo-add-dialog :visible.sync="addVisible" @submit="handleAddSubmit" />

    <!-- ================= 批量上传弹窗 ================= -->
    <el-dialog
      title="批量上传"
      :visible.sync="uploadVisible"
      width="500px"
      custom-class="photo-upload-dialog"
      append-to-body
    >
      <div class="upload-body">
        <div
          class="upload-drag-zone"
          :class="{ dragging }"
          @click="pickFiles"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDropFiles"
        >
          <div class="upload-tip-row">
            <span>在这里拖放文件上传 或</span>
            <el-button size="mini" type="plain" class="choose-btn" @click.stop="pickFiles">选择文件</el-button>
          </div>
        </div>
        <div v-if="uploadFiles.length" class="upload-file-list">
          <div v-for="(f, idx) in uploadFiles" :key="idx" class="upload-file-item">
            <i class="el-icon-picture-outline" />
            <span class="fname" :title="f.name">{{ f.name }}</span>
            <span class="fsize">{{ (f.size / 1024).toFixed(1) }} KB</span>
            <i class="el-icon-close fremove" @click.stop="removeUploadFile(idx)" />
          </div>
        </div>
        <div v-else class="upload-empty-hint">支持多选图片文件（jpg / png 等）</div>
      </div>
      <input ref="uploadInput" type="file" accept="image/*" multiple style="display: none" @change="onPickFiles">
    </el-dialog>
  </div>
</template>

<script>
import PhotoAddDialog from './components/photo-add-dialog.vue'

// 档案分类树（静态演示数据：与照片库左侧目录一致）
const CATEGORY_TREE = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    children: [
      {
        id: 11,
        name: '第一部分 项目申报文件',
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件' },
          { id: 112, name: '二、可行性研究报告及批复文件' },
          { id: 113, name: '三、环境影响报告及批复文件' },
          { id: 114, name: '四、水土保持方案报告及批复文件' },
          { id: 115, name: '五、项目咨询、评估、论证文件' },
          { id: 116, name: '六、投资、特许经营协议文件' },
          { id: 117, name: '七、工程融资贷款计划、资金管理文件' }
        ]
      },
      { id: 12, name: '第二部分 设计文件', children: [{ id: 121, name: '一、初步设计文件' }, { id: 122, name: '二、施工图设计文件' }] },
      { id: 13, name: '第三部分 工程管理文件', children: [{ id: 131, name: '一、征地拆迁文件' }, { id: 132, name: '二、建设管理文件' }] },
      { id: 14, name: '第四部分 竣工文件', children: [{ id: 141, name: '一、路基竣工图' }, { id: 142, name: '二、路面竣工图' }] },
      { id: 15, name: '第五部分 监理文件', children: [{ id: 151, name: '一、监理管理文件' }, { id: 152, name: '二、监理日志' }] },
      { id: 16, name: '第六部分 竣工（交）工验收文件', children: [{ id: 161, name: '一、交工验收文件' }, { id: 162, name: '二、竣工验收文件' }] }
    ]
  }
]

// 未归类照片
const UNCLASSIFIED_PHOTOS = [
  { id: 'u1', name: '无坐标未收集图片-01.jpg', date: '2026-08-31', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=highway%20construction%20site%20with%20bridge%20piers%2C%20documentary%20photo%2C%20daylight&image_size=landscape_4_3' },
  { id: 'u2', name: '无坐标未收集图片-02.jpg', date: '2026-08-12', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=roadbed%20earthwork%20construction%20aerial%20view%2C%20highway%20project%2C%20documentary%20photo&image_size=landscape_4_3' }
]

// 各分类下的演示照片
const CATEGORY_PHOTOS = {
  111: [
    { id: 'p111-1', name: '项目建议书批复仪式现场.jpg', date: '2026-07-21', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=official%20approval%20ceremony%20meeting%20room%2C%20project%20proposal%2C%20documentary%20photo&image_size=landscape_4_3' },
    { id: 'p111-2', name: '项目申请报告评审会.jpg', date: '2026-07-21', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=expert%20review%20meeting%20in%20conference%20room%2C%20documents%20on%20table%2C%20documentary%20photo&image_size=landscape_4_3' },
    { id: 'p111-3', name: '立项批复文件扫描件翻拍.jpg', date: '2026-06-18', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=official%20red%20header%20document%20close%20up%2C%20official%20seal%2C%20documentary%20photo&image_size=landscape_4_3' }
  ],
  112: [
    { id: 'p112-1', name: '可行性研究报告专家论证会.jpg', date: '2026-05-30', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=feasibility%20study%20expert%20demonstration%20meeting%2C%20projector%20screen%2C%20documentary%20photo&image_size=landscape_4_3' }
  ],
  114: [
    { id: 'p114-1', name: '水土保持方案现场踏勘.jpg', date: '2026-04-02', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=engineers%20field%20survey%20on%20hillside%20with%20maps%2C%20soil%20and%20water%20conservation%2C%20documentary%20photo&image_size=landscape_4_3' }
  ]
}

export default {
  name: 'ArchivePhoto',
  components: { PhotoAddDialog },
  data() {
    return {
      /* ===== 地图与工具条 ===== */
      map: null,
      AMap: null,
      searchAddr: '',
      expandAll: false,
      photoLimit: 500,
      limitOptions: [100, 200, 500, 1000, 2000],

      /* ===== 照片库弹窗 ===== */
      galleryVisible: false,
      galleryMaximized: false,
      orgScope: 'all',
      groupByMonth: false,
      categoryTree: CATEGORY_TREE,
      currentGalleryNodeId: 'unclassified',

      /* ===== 新增弹窗 ===== */
      addVisible: false,

      /* ===== 批量上传弹窗 ===== */
      uploadVisible: false,
      uploadFiles: [],
      dragging: false
    }
  },
  computed: {
    /** 当前分类下照片 */
    galleryPhotos() {
      if (this.currentGalleryNodeId === 'unclassified') return UNCLASSIFIED_PHOTOS
      return CATEGORY_PHOTOS[this.currentGalleryNodeId] || []
    },
    /** 按天 / 按月分组 */
    groupedPhotos() {
      const groups = []
      const map = {}
      this.galleryPhotos.forEach(p => {
        const key = this.groupByMonth ? p.date.slice(0, 7) : p.date
        if (!map[key]) {
          map[key] = { key, label: this.groupByMonth ? key.replace('-', '年') + '月' : key, items: [] }
          groups.push(map[key])
        }
        map[key].items.push(p)
      })
      return groups
    }
  },
  mounted() {
    this.initMap()
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
  },
  methods: {
    /* ================= 地图 ================= */
    initMap() {
      const AMap = window.AMap
      if (!AMap || !this.$refs.mapContainer) return
      this.AMap = AMap
      this.map = new AMap.Map(this.$refs.mapContainer, {
        center: [118.796877, 32.060255], // 默认南京市中心，可按项目实际坐标调整
        zoom: 12,
        resizeEnable: true
      })
    },

    /** 地址搜索：使用高德地理编码 */
    handleSearchAddr() {
      const kw = (this.searchAddr || '').trim()
      if (!kw) return this.$message.warning('请输入查询地址')
      if (!this.AMap) return this.$message.error('高德地图加载失败，无法搜索')
      this.AMap.plugin('AMap.Geocoder', () => {
        this.geocoder = this.geocoder || new this.AMap.Geocoder()
        this.geocoder.getLocation(kw, (status, result) => {
          if (status === 'complete' && result.geocodes && result.geocodes.length) {
            const { location } = result.geocodes[0]
            this.map.setZoomAndCenter(15, [location.lng, location.lat])
            this.clearMarkers()
            this.addMarker([location.lng, location.lat])
          } else {
            this.$message.warning(`未找到地址：${kw}`)
          }
        })
      })
    },

    clearMarkers() {
      if (this.markers && this.markers.length) {
        this.map.remove(this.markers)
      }
      this.markers = []
    },

    addMarker(position) {
      const marker = new this.AMap.Marker({ position, map: this.map })
      this.markers = this.markers || []
      this.markers.push(marker)
    },

    /* ================= 工具条 ================= */
    handleExpandAll() {
      this.expandAll = !this.expandAll
      this.$message.info(`已${this.expandAll ? '展开' : '收拢'}全部照片标注`)
    },

    /* ================= 照片库 ================= */
    /** 树节点图标：展开=打开的橙色文件夹，折叠=关闭的橙色文件夹，叶子=蓝色文件夹 */
    nodeIcon(data, node) {
      if (data.children && data.children.length) {
        return node.expanded ? 'el-icon-folder-opened folder' : 'el-icon-folder folder'
      }
      return 'el-icon-folder leaf'
    },

    handleGalleryNodeClick(data) {
      this.currentGalleryNodeId = data.id
    },

    handlePreview(photo) {
      this.$alert(`<img src="${photo.url}" style="width:100%" alt="${photo.name}"/>`, photo.name, {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭'
      })
    },

    /* ================= 新增六要素 ================= */
    openAddDialog() {
      this.addVisible = true
    },

    /** 新增弹窗确定：接收表单数据 */
    handleAddSubmit(form) {
      this.$message.success(`已保存：${form.name}`)
    },

    /* ================= 批量上传 ================= */
    pickFiles() {
      this.$refs.uploadInput && this.$refs.uploadInput.click()
    },

    onPickFiles(e) {
      this.addFiles(e.target.files)
      e.target.value = ''
    },

    onDropFiles(e) {
      this.dragging = false
      this.addFiles(e.dataTransfer.files)
    },

    addFiles(fileList) {
      const files = Array.from(fileList || []).filter(f => /^image\//.test(f.type))
      if (!files.length) return this.$message.warning('请选择图片文件')
      this.uploadFiles = this.uploadFiles.concat(files)
    },

    removeUploadFile(idx) {
      this.uploadFiles.splice(idx, 1)
    },

    submitUpload() {
      if (!this.uploadFiles.length) return this.$message.warning('请先选择要上传的文件')
      this.$message.success(`已上传 ${this.uploadFiles.length} 个文件`)
      this.uploadFiles = []
      this.uploadVisible = false
    }
  }
}
</script>

<style scoped lang="scss">
.photo-map-page {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* ===== 顶部工具条 ===== */
.map-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;

  .addr-input {
    width: 240px;
  }

  .limit-select {
    width: 140px;
  }
}
</style>

<!-- 弹窗内部样式（弹窗 append-to-body，需全局样式） -->
<style lang="scss">
.photo-gallery-dialog {
  .el-dialog__header {
    padding: 10px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__headerbtn {
    display: none;
  }

  .gallery-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #303133;
    }

    .header-btns {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* 最大化 / 还原按钮（小方块，截图样式） */
    .sq-btn {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 1px solid #909399;
      cursor: pointer;

      &:hover {
        border-color: #409eff;
      }

      &.restored {
        width: 9px;
        height: 9px;
        border-color: #409eff;
        box-shadow: 2px -2px 0 -1px #409eff;
      }
    }

    .close-btn {
      cursor: pointer;
      color: #909399;
      font-size: 16px;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  .el-dialog__body {
    padding: 10px 16px;
  }

  .gallery-body {
    display: flex;
    gap: 12px;
    height: 480px;
  }

  .gallery-left {
    display: flex;
    flex-direction: column;
    width: 240px;
    min-width: 240px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .gallery-left-head {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;

      .cat-label {
        font-size: 13px;
        color: #303133;
        font-weight: 700;
        flex-shrink: 0;
      }

      .org-select {
        flex: 1;
      }
    }

    .gallery-tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 6px 4px;
    }
  }

  .gallery-tree-node {
    display: flex;
    align-items: center;
    min-width: 0;
    padding-right: 6px;
    font-size: 13px;

    i {
      margin-right: 4px;
      font-size: 14px;

      &.folder {
        color: #e6a23c;
      }

      &.leaf {
        color: #409eff;
      }
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .gallery-right {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    .gallery-right-head {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #eaf3fc;
      border-bottom: 1px solid #d9e8f8;
      font-size: 13px;

      .display-label {
        color: #303133;
      }

      .group-opt {
        color: #606266;
        cursor: pointer;
        margin: 0 6px;

        &.active {
          color: #409eff;
        }
      }
    }

    .gallery-photos {
      flex: 1;
      overflow: auto;
      padding: 12px;
    }
  }

  .photo-group {
    margin-bottom: 16px;

    .group-title {
      font-size: 13px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 8px;
    }
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .photo-card {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    }

    img {
      display: block;
      width: 100%;
      height: 100px;
      object-fit: cover;
    }

    .photo-name {
      padding: 4px 6px;
      font-size: 12px;
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .gallery-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;

    i {
      font-size: 48px;
      margin-bottom: 8px;
    }
  }
}

.photo-upload-dialog {
  .el-dialog__body {
    padding: 14px 18px;
  }

  .upload-body {
    min-height: 280px;
    display: flex;
    flex-direction: column;
  }

  .upload-drag-zone {
    border-bottom: 1px solid #ebeef5;

    &:hover,
    &.dragging {
      background: #ecf5ff;
    }
  }

  .upload-tip-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;

    .choose-btn {
      padding: 6px 14px;
    }
  }

  .upload-file-list {
    flex: 1;
    overflow: auto;
    min-height: 200px;
    max-height: 260px;
    padding: 6px 12px;
  }

  .upload-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border-bottom: 1px dashed #ebeef5;
    font-size: 13px;
    color: #606266;

    .fname {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fsize {
      color: #909399;
      flex-shrink: 0;
    }

    .fremove {
      cursor: pointer;
      color: #909399;
      flex-shrink: 0;

      &:hover {
        color: #f56c6c;
      }
    }
  }

  .upload-empty-hint {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 12px;
    min-height: 180px;
  }
}
</style>
