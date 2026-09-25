<template>
  <div class="material-page">
    <!-- 左侧：素材库 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="libKeyword" placeholder="请输入素材库名称" size="small" clearable @keyup.enter.native="doLibFilter">
          <el-button slot="append" icon="el-icon-search" @click="doLibFilter" />
        </el-input>
      </div>
      <div class="lib-tools">
        <span class="lt-btn" @click="libNotify('新增')"><i class="el-icon-circle-plus-outline c-green" />新增</span>
        <span class="lt-btn" @click="libNotify('修改', true)"><i class="el-icon-edit c-orange" />修改</span>
        <span class="lt-btn" @click="libNotify('删除', true)"><i class="el-icon-remove-outline c-red" />删除</span>
        <span class="lt-btn" @click="libNotify('移动', true)"><i class="el-icon-rank c-blue" />移动</span>
      </div>
      <div class="lib-list">
        <div v-for="lib in filteredLibs" :key="lib" :class="['lib-item', lib === activeLib ? 'active' : '']" @click="selectLib(lib)">
          <i class="el-icon-folder lib-icon" />
          <span class="lib-name">{{ lib }}</span>
        </div>
        <div v-if="!filteredLibs.length" class="lib-empty">暂无匹配素材库</div>
      </div>
    </div>

    <!-- 右侧：档案素材 + 文件 -->
    <div class="right-panel">
      <div class="table-block">
        <div class="section-bar">
          <span class="section-title">档案素材</span>
          <div class="section-tools">
            <el-checkbox v-model="compiledOnly" class="compiled-cb">已编研</el-checkbox>
            <el-input v-model="keyword" placeholder="文件题名, 档号" size="mini" clearable class="kw-input" @keyup.enter.native="handleSearch" />
            <el-button size="mini" icon="el-icon-search" class="tool-btn" @click="handleSearch" />
            <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
            <el-button size="mini" class="tool-btn" @click="openAddDialog"><i class="el-icon-circle-plus-outline c-green" />新增</el-button>
            <el-button size="mini" class="tool-btn" @click="openRollCatalog"><i class="el-icon-folder-add c-teal" />添加案卷目录</el-button>
            <el-button size="mini" class="tool-btn" @click="openFileCatalog"><i class="el-icon-document-copy c-teal" />添加文件目录</el-button>
            <el-button size="mini" class="tool-btn" @click="openSortDialog"><i class="el-icon-s-operation c-blue" />排序</el-button>
            <el-button size="mini" class="tool-btn" @click="notifyCompile"><i class="el-icon-collection c-purple" />编研汇编</el-button>
            <el-button size="mini" class="tool-btn" @click="notifyDemo('删除', true)"><i class="el-icon-minus c-red" />删除</el-button>
            <el-button size="mini" class="tool-btn" @click="openAutoDialog"><i class="el-icon-magic-stick c-green" />自动归集</el-button>
          </div>
        </div>
        <el-table
          ref="materialTable"
          :data="filteredRows"
          border
          stripe
          size="mini"
          height="340"
          row-key="id"
          highlight-current-row
          @selection-change="handleSelectionChange"
          @current-change="handleCurrentChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="title" label="案卷/文件题名" min-width="200" align="center" show-overflow-tooltip sortable />
          <el-table-column prop="dh" label="档号" width="120" align="center" sortable />
          <el-table-column prop="wjlx" label="文件类型" width="120" align="center" sortable />
          <el-table-column prop="bgqx" label="保管期限" width="120" align="center" sortable />
          <el-table-column prop="bzdw" label="编制单位" min-width="130" align="center" show-overflow-tooltip sortable />
          <el-table-column prop="ys" label="页数" width="100" align="center" sortable />
          <el-table-column prop="pdf" label="文件PDF大小" width="150" align="center" sortable />
          <el-table-column prop="fjzs" label="附件总数" width="120" align="center" sortable />
          <el-table-column prop="sxjy" label="四性检验情况" width="150" align="center" sortable />
          <el-table-column prop="addTime" label="增加时间" width="110" align="center" sortable />
        </el-table>
        <div class="pager-bar">
          <span class="pager-total">共 {{ filteredRows.length }} 条</span>
          <el-pagination layout="prev, pager, next" :total="filteredRows.length" :page-size="100" :current-page.sync="page" class="pager" />
          <span class="pager-jump">前往 <input v-model="pageInput" class="page-input" disabled> 页</span>
          <el-select v-model="pageSize" size="mini" class="page-size-dd" disabled>
            <el-option label="100条/页" :value="100" />
          </el-select>
        </div>
      </div>

      <div class="table-block">
        <div class="section-bar">
          <span class="section-title">文件</span>
          <div class="section-tools">
            <el-button size="mini" class="tool-btn" @click="handleFileRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
            <el-button size="mini" class="tool-btn" @click="notifyFile('批量上传')"><i class="el-icon-upload2 c-green" />批量上传</el-button>
            <el-button size="mini" class="tool-btn" @click="notifyFile('查看PDF', true)"><i class="el-icon-document c-green" />查看PDF</el-button>
            <el-button size="mini" class="tool-btn" @click="notifyFile('查看详细信息', true)"><i class="el-icon-user c-green" />查看详细信息</el-button>
          </div>
        </div>
        <el-table
          :data="fileRows"
          border
          stripe
          size="mini"
          height="300"
          row-key="id"
          @selection-change="handleFileSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="文件名称" min-width="200" align="center" show-overflow-tooltip sortable />
          <el-table-column prop="code" label="文件编号" width="140" align="center" sortable />
          <el-table-column prop="status" label="文件状态" width="100" align="center" sortable />
          <el-table-column prop="date" label="编制日期" width="110" align="center" sortable />
          <el-table-column prop="type" label="档案类型" width="100" align="center" sortable />
          <el-table-column prop="ys" label="页数" width="80" align="center" sortable />
          <el-table-column prop="format" label="文件格式" width="100" align="center" sortable />
          <el-table-column prop="size" label="文件大小" width="110" align="center" sortable />
        </el-table>
      </div>
    </div>

    <!-- 新增弹窗（图片一） -->
    <el-dialog
      :visible.sync="addVisible"
      :fullscreen="addFullscreen"
      :width="addFullscreen ? '100%' : '640px'"
      custom-class="material-add-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <template slot="title">
        <div class="dlg-header">
          <span class="dlg-title">新增</span>
          <i class="el-icon-crop dlg-fullscreen" @click="addFullscreen = !addFullscreen" />
        </div>
      </template>
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="110px" size="small">
        <el-form-item label="案卷/文件题名" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入案卷/文件题名" />
        </el-form-item>
        <el-form-item label="编制单位" prop="unit">
          <el-input v-model="addForm.unit" placeholder="请输入编制单位" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="档号" prop="dh">
              <el-input v-model="addForm.dh" placeholder="请输入档号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保管期限" prop="term">
              <el-select v-model="addForm.term" placeholder="请选择" style="width: 100%">
                <el-option v-for="t in termOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="confirmAdd">确定</el-button>
        <el-button size="small" @click="addVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 排序窗口（图片四） -->
    <el-dialog
      :visible.sync="sortVisible"
      :fullscreen="sortFullscreen"
      :width="sortFullscreen ? '100%' : '510px'"
      top="6vh"
      custom-class="material-sort-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <template slot="title">
        <div class="dlg-header">
          <span class="dlg-title">排序窗口</span>
          <i class="el-icon-crop dlg-fullscreen" @click="sortFullscreen = !sortFullscreen" />
        </div>
      </template>
      <div class="sort-tools">
        <el-button size="mini" icon="el-icon-top" :disabled="!sortCurrentRow" @click="sortToTop">移至顶部</el-button>
        <el-button size="mini" icon="el-icon-arrow-up" :disabled="!sortCurrentRow" @click="sortUp">向上</el-button>
        <el-button size="mini" icon="el-icon-arrow-down" :disabled="!sortCurrentRow" @click="sortDown">向下</el-button>
        <el-button size="mini" icon="el-icon-bottom" :disabled="!sortCurrentRow" @click="sortToBottom">移至末尾</el-button>
        <el-button size="mini" icon="el-icon-position" :disabled="!sortCurrentRow" @click="sortToIndex">移至</el-button>
      </div>
      <el-table
        ref="sortTable"
        :data="sortRows"
        border
        size="small"
        height="380"
        highlight-current-row
        @current-change="r => (sortCurrentRow = r)"
      >
        <el-table-column label="案卷/文件题名" prop="title" min-width="280" align="center" show-overflow-tooltip />
        <el-table-column label="排序" width="100" align="center">
          <template slot-scope="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary" size="small" @click="confirmSort">确定</el-button>
        <el-button size="small" @click="sortVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 自动收集弹窗（图片五，标题与截图一致） -->
    <el-dialog
      :visible.sync="autoVisible"
      :fullscreen="autoFullscreen"
      :width="autoFullscreen ? '100%' : '520px'"
      custom-class="material-auto-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <template slot="title">
        <div class="dlg-header">
          <span class="dlg-title">自动收集</span>
          <i class="el-icon-crop dlg-fullscreen" @click="autoFullscreen = !autoFullscreen" />
        </div>
      </template>
      <el-form :model="autoForm" label-width="100px" size="small">
        <el-form-item label="专题：">
          <el-input v-model="autoForm.topic" type="textarea" :rows="3" placeholder="请输入专题" />
        </el-form-item>
        <el-form-item label="是否组卷/件：">
          <el-switch v-model="autoForm.grouped" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="confirmAuto">确定</el-button>
        <el-button size="small" @click="autoVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 添加案卷/文件目录弹窗（图片二/图片三） -->
    <material-roll-catalog-dialog :visible.sync="rollCatalogVisible" @confirm="handleRollCatalogConfirm" />
    <material-file-catalog-dialog :visible.sync="fileCatalogVisible" @confirm="handleFileCatalogConfirm" />
  </div>
</template>

<script>
import MaterialRollCatalogDialog from './components/material-roll-catalog-dialog.vue'
import MaterialFileCatalogDialog from './components/material-file-catalog-dialog.vue'

// 素材库（与截图一致）
const LIBS = ['公司网站网页', '抖音', '其他新媒体', '微信公众号', '微信']

export default {
  name: 'DisposalMaterial',
  components: {
    MaterialRollCatalogDialog,
    MaterialFileCatalogDialog
  },
  data() {
    return {
      libKeyword: '',
      libs: LIBS,
      activeLib: '其他新媒体',
      compiledOnly: false,
      keyword: '',
      page: 1,
      pageInput: '1',
      pageSize: 100,
      selections: [],
      fileSelections: [],
      fileRows: [],
      // 各素材库下的档案素材（静态演示，放入 data 保证响应式）
      rowsMap: {
        '其他新媒体': [
          { id: 1, title: '抖音视频文件收集', dh: 'dy-001', wjlx: '文件', bgqx: '10年', bzdw: '抖音app', ys: 0, pdf: '', fjzs: 0, sxjy: '未检验', addTime: '2024-09-29', compiled: false }
        ]
      },
      // 新增弹窗
      addVisible: false,
      addFullscreen: false,
      addForm: { title: '', unit: '', dh: '', term: '' },
      addRules: {
        title: [{ required: true, message: '请输入案卷/文件题名', trigger: 'blur' }],
        unit: [{ required: true, message: '请输入编制单位', trigger: 'blur' }],
        dh: [{ required: true, message: '请输入档号', trigger: 'blur' }],
        term: [{ required: true, message: '请选择保管期限', trigger: 'change' }]
      },
      termOptions: ['10年', '30年', '永久'],
      // 排序窗口
      sortVisible: false,
      sortFullscreen: false,
      sortRows: [],
      sortCurrentRow: null,
      // 自动收集弹窗
      autoVisible: false,
      autoFullscreen: false,
      autoForm: { topic: '', grouped: true },
      // 添加案卷/文件目录弹窗
      rollCatalogVisible: false,
      fileCatalogVisible: false
    }
  },
  computed: {
    filteredLibs() {
      const kw = this.libKeyword.trim()
      if (!kw) return this.libs
      return this.libs.filter(l => l.indexOf(kw) > -1)
    },
    rows() {
      return this.rowsMap[this.activeLib] || []
    },
    filteredRows() {
      let list = this.rows
      if (this.compiledOnly) list = list.filter(r => r.compiled)
      const kw = this.keyword.trim()
      if (kw) list = list.filter(r => r.title.indexOf(kw) > -1 || r.dh.indexOf(kw) > -1)
      return list
    }
  },
  mounted() {
    this.$nextTick(() => {
      // 默认勾选第1条（与截图一致）
      if (this.filteredRows.length && this.$refs.materialTable) {
        this.$refs.materialTable.toggleRowSelection(this.filteredRows[0], true)
        this.$refs.materialTable.setCurrentRow(this.filteredRows[0])
      }
    })
  },
  methods: {
    doLibFilter() {
      // 素材库列表已随 libKeyword 计算过滤
    },
    selectLib(lib) {
      this.activeLib = lib
      this.$nextTick(() => {
        if (this.filteredRows.length && this.$refs.materialTable) {
          this.$refs.materialTable.toggleRowSelection(this.filteredRows[0], true)
          this.$refs.materialTable.setCurrentRow(this.filteredRows[0])
        }
      })
    },
    libNotify(action, needSelect) {
      this.$message.info('素材库' + action + '')
    },
    handleSearch() {
      this.$message.success('查询完成')
    },
    handleRefresh() {
      this.keyword = ''
      this.compiledOnly = false
      this.$message.success('已刷新')
    },
    notifyDemo(action, needSelection) {
      if (needSelection && !this.selections.length) {
        this.$message.warning('请先选择素材记录')
        return
      }
      this.$message.info(action + '')
    },
    notifyCompile() {
      if (!this.selections.length) {
        this.$message.warning('请先选择素材记录')
        return
      }
      this.$message.success('编研汇编任务已创建')
    },
    // 当前日期（yyyy-MM-dd）
    todayStr() {
      const d = new Date()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return d.getFullYear() + '-' + m + '-' + day
    },
    // ========== 新增弹窗（图片一） ==========
    openAddDialog() {
      this.addFullscreen = false
      this.addForm = { title: '', unit: '', dh: '', term: '' }
      this.addVisible = true
      this.$nextTick(() => {
        this.$refs.addForm && this.$refs.addForm.clearValidate()
      })
    },
    confirmAdd() {
      this.$refs.addForm.validate(valid => {
        if (!valid) return
        const list = this.rowsMap[this.activeLib] || []
        const item = {
          id: 'add' + Date.now(),
          title: this.addForm.title,
          dh: this.addForm.dh,
          wjlx: '文件',
          bgqx: this.addForm.term,
          bzdw: this.addForm.unit,
          ys: 0,
          pdf: '',
          fjzs: 0,
          sxjy: '未检验',
          addTime: this.todayStr(),
          compiled: false
        }
        this.rowsMap = { ...this.rowsMap, [this.activeLib]: list.concat(item) }
        this.$message.success('新增成功')
        this.addVisible = false
      })
    },
    // ========== 排序窗口（图片四） ==========
    openSortDialog() {
      const list = this.rowsMap[this.activeLib] || []
      if (!list.length) {
        this.$message.warning('当前素材库暂无可排序的记录')
        return
      }
      this.sortRows = list.map(r => ({ id: r.id, title: r.title }))
      this.sortCurrentRow = null
      this.sortFullscreen = false
      this.sortVisible = true
    },
    // 移动当前选中行到指定位置并保持高亮
    moveCurrent(index) {
      const row = this.sortCurrentRow
      const from = this.sortRows.findIndex(r => r.id === row.id)
      if (from < 0) return
      this.sortRows.splice(from, 1)
      this.sortRows.splice(index, 0, row)
      this.$nextTick(() => {
        this.$refs.sortTable && this.$refs.sortTable.setCurrentRow(row)
      })
    },
    sortToTop() {
      this.moveCurrent(0)
    },
    sortUp() {
      const from = this.sortRows.findIndex(r => r.id === this.sortCurrentRow.id)
      if (from > 0) this.moveCurrent(from - 1)
    },
    sortDown() {
      const from = this.sortRows.findIndex(r => r.id === this.sortCurrentRow.id)
      if (from > -1 && from < this.sortRows.length - 1) this.moveCurrent(from + 1)
    },
    sortToBottom() {
      this.moveCurrent(this.sortRows.length - 1)
    },
    sortToIndex() {
      this.$prompt('请输入目标位置（第几项）', '移至', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入正整数'
      }).then(({ value }) => {
        const target = parseInt(value, 10)
        if (target < 1 || target > this.sortRows.length) {
          this.$message.warning('请输入 1 ~ ' + this.sortRows.length + ' 之间的数字')
          return
        }
        this.moveCurrent(target - 1)
      }).catch(() => {})
    },
    confirmSort() {
      const list = this.rowsMap[this.activeLib] || []
      const map = {}
      list.forEach(r => { map[r.id] = r })
      const reordered = this.sortRows.map(s => map[s.id]).filter(Boolean)
      const rest = list.filter(r => !this.sortRows.some(s => s.id === r.id))
      this.rowsMap = { ...this.rowsMap, [this.activeLib]: reordered.concat(rest) }
      this.$message.success('排序已保存')
      this.sortVisible = false
    },
    // ========== 自动收集弹窗（图片五） ==========
    openAutoDialog() {
      this.autoFullscreen = false
      this.autoForm = { topic: '', grouped: true }
      this.autoVisible = true
    },
    confirmAuto() {
      this.$message.success('自动收集任务已创建（演示）')
      this.autoVisible = false
    },
    // ========== 添加案卷/文件目录弹窗（图片二/图片三） ==========
    openRollCatalog() {
      this.rollCatalogVisible = true
    },
    openFileCatalog() {
      this.fileCatalogVisible = true
    },
    appendMaterial(items) {
      const list = this.rowsMap[this.activeLib] || []
      this.rowsMap = { ...this.rowsMap, [this.activeLib]: list.concat(items) }
    },
    handleRollCatalogConfirm(rows) {
      const addTime = this.todayStr()
      const items = rows.map((r, i) => ({
        id: 'r' + Date.now() + '_' + i,
        title: r.title,
        dh: r.archiveNo,
        wjlx: '案卷',
        bgqx: r.term,
        bzdw: r.unit,
        ys: 0,
        pdf: '',
        fjzs: 0,
        sxjy: r.checkInfo || '未检验',
        addTime: addTime,
        compiled: false
      }))
      this.appendMaterial(items)
      this.$message.success('已添加 ' + items.length + ' 条案卷目录')
    },
    handleFileCatalogConfirm(rows) {
      const addTime = this.todayStr()
      const items = rows.map((r, i) => ({
        id: 'f' + Date.now() + '_' + i,
        title: r.title,
        dh: r.archiveNo,
        wjlx: '文件',
        bgqx: r.term,
        bzdw: r.author,
        ys: 0,
        pdf: '',
        fjzs: 0,
        sxjy: '未检验',
        addTime: addTime,
        compiled: false
      }))
      this.appendMaterial(items)
      this.$message.success('已添加 ' + items.length + ' 条文件目录')
    },
    handleFileRefresh() {
      this.fileRows = []
      this.$message.success('文件列表已刷新')
    },
    notifyFile(action, needSelection) {
      if (needSelection && !this.fileSelections.length) {
        this.$message.warning('请先选择文件记录')
        return
      }
      this.$message.info(action + '')
    },
    handleSelectionChange(rows) {
      this.selections = rows
    },
    handleFileSelectionChange(rows) {
      this.fileSelections = rows
    },
    handleCurrentChange() {
      // 行选中联动
    }
  }
}
</script>

<style lang="scss" scoped>
.material-page {
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
  overflow: auto;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.table-block {
  margin-bottom: 4px;
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

    .compiled-cb {
      margin-right: 8px;

      ::v-deep .el-checkbox__label {
        color: #fff;
        font-size: 12px;
      }
    }

    .kw-input {
      width: 150px;
      margin-right: 6px;
    }

    .tool-btn {
      margin-left: 6px;
      font-size: 12px;

      i {
        margin-right: 3px;
      }
    }
  }
}

.c-green { color: #67c23a; }
.c-orange { color: #e6a23c; }
.c-red { color: #f56c6c; }
.c-blue { color: $themeColor; }
.c-teal { color: #13c2c2; }
.c-purple { color: #9254de; }

.pager-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;

  .pager-total {
    font-size: 12px;
    color: #606266;
    margin-right: 12px;
  }

  .pager-jump {
    font-size: 12px;
    color: #606266;
    margin: 0 10px;

    .page-input {
      width: 40px;
      height: 24px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      text-align: center;
      margin: 0 4px;
    }
  }

  .page-size-dd {
    width: 100px;
  }
}
</style>

<style lang="scss">
/* 内联弹窗为 append-to-body，需要全局样式 */
.material-add-dialog,
.material-sort-dialog,
.material-auto-dialog {
  .el-dialog__header {
    padding: 12px 20px;
  }

  .dlg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 26px;

    .dlg-title {
      font-size: 15px;
      color: #303133;
    }

    .dlg-fullscreen {
      font-size: 15px;
      color: #909399;
      cursor: pointer;

      &:hover {
        color: $themeColor;
      }
    }
  }

  .el-dialog__body {
    padding: 16px 20px;
  }
}

.material-sort-dialog {
  .sort-tools {
    margin-bottom: 10px;

    .el-button + .el-button {
      margin-left: 8px;
    }
  }

  /* 表头浅蓝背景（与截图一致） */
  .el-table th.el-table__cell {
    background-color: #d9e8f8;
  }
}
</style>
