<template>
  <div class="achievement-page">
    <!-- 左侧：成果库（与编研素材的素材库一致） -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="libKeyword" placeholder="请输入素材库名称" size="small" clearable @keyup.enter.native="doLibFilter">
          <el-button slot="append" icon="el-icon-search" @click="doLibFilter" />
        </el-input>
      </div>
      <div class="lib-tools">
        <span class="lt-btn" @click="handleLibAdd"><i class="el-icon-circle-plus-outline c-green" />新增</span>
        <span class="lt-btn" @click="handleLibEdit"><i class="el-icon-edit c-orange" />修改</span>
        <span class="lt-btn" @click="libNotify('删除')"><i class="el-icon-remove-outline c-red" />删除</span>
        <span class="lt-btn" @click="handleLibSort"><i class="el-icon-rank c-blue" />移动</span>
      </div>
      <div class="lib-list">
        <div v-for="lib in filteredLibs" :key="lib" :class="['lib-item', lib === activeLib ? 'active' : '']" @click="selectLib(lib)">
          <i class="el-icon-folder lib-icon" />
          <span class="lib-name">{{ lib }}</span>
        </div>
        <div v-if="!filteredLibs.length" class="lib-empty">暂无匹配素材库</div>
      </div>
    </div>

    <!-- 右侧：面包屑 + 编研汇编 -->
    <div class="right-panel">
      <div class="crumb-bar">
        <i class="el-icon-collection-tag crumb-icon" />
        <template v-for="(c, idx) in crumb">
          <a :key="'c' + idx" class="crumb-link">{{ c.name }}</a>
          <span v-if="idx < crumb.length - 1" :key="'s' + idx" class="crumb-sep">&gt;</span>
        </template>
      </div>
      <div class="section-bar">
        <span class="section-title">编研汇编</span>
        <div class="section-tools">
          <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
          <el-button size="mini" class="tool-btn" @click="handleAdd"><i class="el-icon-circle-plus-outline c-green" />新增</el-button>
          <el-button size="mini" class="tool-btn" @click="handleEdit"><i class="el-icon-edit c-orange" />修改</el-button>
          <el-button size="mini" class="tool-btn" @click="notifyDemo('删除')"><i class="el-icon-minus c-red" />删除</el-button>
          <el-button size="mini" class="tool-btn" @click="notifyDemo('编研')"><i class="el-icon-notebook-2 c-teal" />编研</el-button>
          <el-button size="mini" class="tool-btn" @click="notifyDemo('查看pdf')"><i class="el-icon-document c-green" />查看pdf</el-button>
          <el-button size="mini" class="tool-btn" @click="notifyDemo('排序')"><i class="el-icon-s-operation c-blue" />排序</el-button>
        </div>
      </div>
      <div class="empty-area" />
    </div>

    <!-- 新增/修改编研成果弹窗 -->
    <el-dialog
      :title="editDialog.type === 'edit' ? '修改' : '新增'"
      :visible.sync="editDialog.visible"
      width="640px"
      append-to-body
      custom-class="achieve-dialog"
    >
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="90px" size="small">
        <el-form-item label="编研标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入编研标题" />
        </el-form-item>
        <el-form-item label="编研封面" prop="cover">
          <el-upload
            class="cover-uploader"
            action="#"
            accept="image/*"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleCoverChange"
          >
            <img v-if="editForm.cover" :src="editForm.cover" class="cover-preview" alt="编研封面">
            <i v-else class="el-icon-plus cover-add-icon" />
          </el-upload>
          <el-button v-if="editForm.cover" type="text" size="mini" class="cover-remove" @click="editForm.cover = ''">移除封面</el-button>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitEdit">确定</el-button>
        <el-button size="small" @click="editDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 素材库新增/修改弹窗 -->
    <el-dialog
      :title="libDialog.type === 'edit' ? '修改' : '新增'"
      :visible.sync="libDialog.visible"
      width="480px"
      append-to-body
    >
      <el-form ref="libForm" :model="libForm" :rules="libRules" label-width="110px" size="small">
        <el-form-item label="素材库名称" prop="name">
          <el-input v-model="libForm.name" placeholder="请输入素材库名称" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="libDialog.visible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="submitLib">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 素材库排序窗口 -->
    <el-dialog
      title="排序窗口"
      :visible.sync="libSortDialog.visible"
      width="520px"
      append-to-body
      custom-class="lib-sort-dialog"
    >
      <div class="sort-toolbar">
        <el-button size="mini" :disabled="!canLibSort" @click="handleLibSortTo('top')"><i class="tri tri-up" /> 移至顶部</el-button>
        <el-button size="mini" :disabled="!canLibSort" @click="handleLibSortStep(-1)"><i class="tri tri-up" /> 向上</el-button>
        <el-button size="mini" :disabled="!canLibSort" @click="handleLibSortStep(1)"><i class="tri tri-down" /> 向下</el-button>
        <el-button size="mini" :disabled="!canLibSort" @click="handleLibSortTo('bottom')"><i class="tri tri-down" /> 移至末尾</el-button>
        <el-button
          size="mini"
          :disabled="!canLibSort || libSortDialog.targetIndex === libSortDialog.selectedIndex"
          @click="handleLibSortMoveTo"
        >
          <i class="el-icon-position" /> 移至
        </el-button>
        <el-input-number
          v-model="libSortDialog.targetIndex"
          size="mini"
          :min="1"
          :max="libs.length"
          controls-position="right"
          class="sort-target-input"
        />
      </div>
      <el-table
        ref="libSortTable"
        :data="libSortList"
        border
        size="small"
        height="340"
        highlight-current-row
        @current-change="handleLibSortCurrentChange"
      >
        <el-table-column label="素材库" align="center">
          <template slot-scope="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="排序" width="90" align="center">
          <template slot-scope="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitLibSort">确定</el-button>
        <el-button size="small" @click="libSortDialog.visible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 成果库（与编研素材的素材库一致，静态演示）
const LIBS = ['公司网站网页', '抖音', '其他新媒体', '微信公众号', '微博']

export default {
  name: 'DisposalAchievement',
  data() {
    return {
      libKeyword: '',
      libs: LIBS,
      activeLib: '微博',
      // 新增/修改弹窗
      editDialog: { visible: false, type: 'add' },
      editForm: { title: '', cover: '' },
      editRules: {
        title: [{ required: true, message: '请输入编研标题', trigger: 'blur' }]
      },
      // 素材库新增/修改弹窗
      libDialog: { visible: false, type: 'add' },
      libForm: { name: '' },
      libRules: {
        name: [{ required: true, message: '请输入素材库名称', trigger: 'blur' }]
      },
      // 素材库排序窗口
      libSortDialog: {
        visible: false,
        selectedIndex: -1, // 当前选中行索引
        targetIndex: 1 // 「移至」目标序号
      },
      libSortList: []
    }
  },
  computed: {
    filteredLibs() {
      const kw = this.libKeyword.trim()
      if (!kw) return this.libs
      return this.libs.filter(l => l.indexOf(kw) > -1)
    },
    canLibSort() {
      return this.libSortDialog.selectedIndex >= 0 && this.libSortDialog.selectedIndex < this.libSortList.length
    },
    crumb() {
      return [{ name: '编研成果' }, { name: this.activeLib }]
    }
  },
  methods: {
    doLibFilter() {
      // 素材库列表已随 libKeyword 计算过滤
    },
    selectLib(lib) {
      this.activeLib = lib
    },
    libNotify(action) {
      this.$message.info('素材库' + action + '')
    },
    handleRefresh() {
      this.$message.success('已刷新')
    },
    notifyDemo(action) {
      this.$message.info(action + '')
    },
    // ===== 新增/修改弹窗 =====
    handleAdd() {
      this.editDialog.type = 'add'
      this.editForm = { title: '', cover: '' }
      this.editDialog.visible = true
      this.$nextTick(() => this.$refs.editForm && this.$refs.editForm.clearValidate())
    },
    handleEdit() {
      this.editDialog.type = 'edit'
      this.editForm = { title: '', cover: '' }
      this.editDialog.visible = true
      this.$nextTick(() => this.$refs.editForm && this.$refs.editForm.clearValidate())
    },
    handleCoverChange(file) {
      // 本地预览：读取为 base64
      const reader = new FileReader()
      reader.onload = e => { this.editForm.cover = e.target.result }
      reader.readAsDataURL(file.raw)
    },
    submitEdit() {
      this.$refs.editForm.validate(valid => {
        if (!valid) return
        this.editDialog.visible = false
        this.$message.success((this.editDialog.type === 'edit' ? '修改' : '新增') + '成功')
      })
    },
    // ===== 素材库新增/修改弹窗 =====
    handleLibAdd() {
      this.libDialog.type = 'add'
      this.libForm = { name: '' }
      this.libDialog.visible = true
      this.$nextTick(() => this.$refs.libForm && this.$refs.libForm.clearValidate())
    },
    handleLibEdit() {
      this.libDialog.type = 'edit'
      this.libForm = { name: this.activeLib }
      this.libDialog.visible = true
      this.$nextTick(() => this.$refs.libForm && this.$refs.libForm.clearValidate())
    },
    submitLib() {
      this.$refs.libForm.validate(valid => {
        if (!valid) return
        const name = this.libForm.name.trim()
        if (this.libDialog.type === 'add') {
          if (this.libs.indexOf(name) > -1) {
            this.$message.warning('素材库名称已存在')
            return
          }
          this.libs.push(name)
          this.activeLib = name
        } else {
          const idx = this.libs.indexOf(this.activeLib)
          if (idx > -1) this.libs.splice(idx, 1, name)
          this.activeLib = name
        }
        this.libDialog.visible = false
        this.$message.success((this.libDialog.type === 'edit' ? '修改' : '新增') + '成功')
      })
    },
    // ===== 素材库排序窗口 =====
    handleLibSort() {
      // 打开时以当前左侧列表顺序初始化，重置选择状态
      this.libSortList = this.libs.map(name => ({ name }))
      this.libSortDialog.selectedIndex = -1
      this.libSortDialog.targetIndex = 1
      this.libSortDialog.visible = true
    },
    handleLibSortCurrentChange(row) {
      this.libSortDialog.selectedIndex = row ? this.libSortList.indexOf(row) : -1
    },
    /** 上移/下移一位 */
    handleLibSortStep(step) {
      const i = this.libSortDialog.selectedIndex
      const j = i + step
      if (j < 0 || j >= this.libSortList.length) return
      const list = this.libSortList
      ;[list[i], list[j]] = [list[j], list[i]]
      this.libSortDialog.selectedIndex = j
      this.libSortDialog.targetIndex = j + 1
    },
    /** 移至顶部/末尾 */
    handleLibSortTo(pos) {
      const i = this.libSortDialog.selectedIndex
      if (i < 0) return
      const [item] = this.libSortList.splice(i, 1)
      const j = pos === 'top' ? 0 : this.libSortList.length
      this.libSortList.splice(j, 0, item)
      this.libSortDialog.selectedIndex = j
      this.libSortDialog.targetIndex = j + 1
    },
    /** 移至指定序号 */
    handleLibSortMoveTo() {
      const i = this.libSortDialog.selectedIndex
      const j = this.libSortDialog.targetIndex - 1
      if (i < 0 || j === i || j < 0 || j >= this.libSortList.length) return
      const [item] = this.libSortList.splice(i, 1)
      this.libSortList.splice(j, 0, item)
      this.libSortDialog.selectedIndex = j
    },
    submitLibSort() {
      this.libs = this.libSortList.map(item => item.name)
      this.libSortDialog.visible = false
      this.$message.success('排序已保存')
    }
  }
}
</script>

<style lang="scss" scoped>
.achievement-page {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.left-panel {
  width: 230px;
  min-width: 230px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #fff;

  .search-bar {
    padding: 10px 10px 6px;
  }

  .lib-tools {
    display: flex;
    align-items: center;
    padding: 0 10px 8px;

    .lt-btn {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      color: #606266;
      cursor: pointer;
      margin-right: 10px;

      i {
        margin-right: 2px;
        font-size: 13px;
      }

      &:hover {
        color: $themeColor;
      }
    }
  }

  .lib-list {
    flex: 1;
    overflow: auto;
    border-top: 1px solid #ebeef5;

    .lib-item {
      display: flex;
      align-items: center;
      padding: 9px 14px;
      font-size: 13px;
      color: #303133;
      cursor: pointer;

      .lib-icon {
        color: $themeColor;
        margin-right: 6px;
      }

      .lib-name {
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

    .lib-empty {
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

.crumb-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid #ebeef5;

  .crumb-icon {
    color: $themeColor;
    margin-right: 6px;
  }

  .crumb-link {
    color: $themeColor;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .crumb-sep {
    margin: 0 6px;
    color: #909399;
  }
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
  }
}

.empty-area {
  flex: 1;
  background: #fff;
}

/* 新增/修改弹窗 */
.achieve-dialog {
  .cover-uploader {
    ::v-deep .el-upload {
      border: 1px dashed #c0c4cc;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fbfdff;

      &:hover {
        border-color: $themeColor;
      }
    }

    .cover-add-icon {
      font-size: 26px;
      color: #8c939d;
    }

    .cover-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .cover-remove {
    margin-left: 0;
    padding-left: 0;
  }
}

.c-green { color: #67c23a; }
.c-orange { color: #e6a23c; }
.c-red { color: #f56c6c; }
.c-blue { color: $themeColor; }
.c-teal { color: #13c2c2; }
</style>

<style lang="scss">
/* 弹窗为 append-to-body，需要全局样式 */
.lib-sort-dialog {
  .sort-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;

    .sort-target-input {
      width: 110px;
      margin-left: 2px;
    }

    .el-button {
      padding: 7px 10px;

      .tri {
        display: inline-block;
        margin-right: 2px;
        vertical-align: middle;

        &.tri-up {
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 5px solid currentColor;
        }

        &.tri-down {
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid currentColor;
        }
      }
    }
  }
}
</style>
