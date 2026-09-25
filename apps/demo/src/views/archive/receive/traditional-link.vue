<template>
  <!--
    传统档案连接：扫描件/原始文件与目录的挂接
    纯静态 DEMO，不请求接口
  -->
  <div class="traditional-link-page">

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索"
        size="small"
        clearable
        class="search-input"
        @keyup.enter.native="doSearch"
      >
        <i slot="prefix" class="el-icon-search el-input__icon" />
      </el-input>
      <el-button size="small" icon="el-icon-refresh" @click="refresh">刷新</el-button>
      <el-button size="small" type="warning" plain icon="el-icon-upload2" :disabled="!canReUpload" @click="reUpload">重新上传</el-button>
      <el-button size="small" plain icon="el-icon-picture-outline" :disabled="!canConvertPdf" @click="convertPdf">转换为PDF</el-button>
      <el-button size="small" plain icon="el-icon-document" :disabled="!canViewOriginal" @click="viewOriginal">查看原始文件</el-button>
      <el-button size="small" plain icon="el-icon-document-copy" :disabled="!canViewPdf" @click="viewPdf">查看PDF文件</el-button>
      <el-button size="small" plain icon="el-icon-collection" :disabled="!currentRow" @click="viewCollectInfo">查看收集信息</el-button>
      <el-checkbox v-model="onlyUploaded" class="uploaded-check" @change="doSearch">已上传</el-checkbox>
    </div>

    <!-- 查看收集信息弹窗 -->
    <el-dialog
      title="上传文件收集信息"
      :visible.sync="collectDialogVisible"
      width="520px"
      custom-class="collect-info-dialog"
      append-to-body
    >
      <div v-if="collectRow" class="collect-info">
        <div class="info-row"><span class="label">收集ID:</span>{{ collectRow.collectId }}</div>
        <div class="info-row"><span class="label">文件编号:</span>{{ collectRow.fileCode || '-' }}</div>
        <div class="info-row"><span class="label">文件名称:</span>{{ collectRow.name }}</div>
        <div class="info-row"><span class="label">收集人:</span>{{ collectRow.collector }}</div>
        <div class="info-row"><span class="label">收集日期:</span>{{ collectRow.collectDate }}</div>
        <div class="section">所在文件目录: {{ collectRow.fileDirPath }}</div>
        <div class="section indent">文件目录路径: {{ collectRow.filePath }}</div>
        <div class="section">所在案卷目录: {{ collectRow.volumeDir }}</div>
        <div class="section indent">案卷目录路径: {{ collectRow.volumePath }}</div>
        <div class="section">删除信息:</div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="collectDialogVisible = false">确定</el-button>
      </div>
    </el-dialog>

    <!-- 重新上传弹窗：拖放/选择文件上传 -->
    <el-dialog
      title="重新上传"
      :visible.sync="reUploadVisible"
      width="560px"
      custom-class="re-upload-dialog"
      append-to-body
      :close-on-click-modal="false"
      @closed="resetUpload"
    >
      <div
        class="upload-zone"
        :class="{ 'is-dragover': dragOver }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <div class="upload-tip">
          在这里拖放文件上传或
          <el-button size="small" plain @click="chooseFiles">选择文件</el-button>
        </div>
        <div class="upload-file-list">
          <div v-for="(f, index) in uploadFiles" :key="f.uid" class="upload-file-item">
            <i class="el-icon-document" />
            <span class="file-name" :title="f.name">{{ f.name }}</span>
            <span class="file-size">{{ f.sizeText }}</span>
            <el-progress class="file-progress" :percentage="f.percent" :stroke-width="6" :show-text="false" />
            <span class="file-status" :class="{ 'is-success': f.percent >= 100 }">{{ f.statusText }}</span>
            <i class="el-icon-close file-remove" @click="removeFile(index)" />
          </div>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        style="display: none"
        @change="onFileChange"
      >
    </el-dialog>

    <!-- 文件列表 -->
    <el-table
      ref="table"
      :data="pagedList"
      row-key="id"
      border
      size="small"
      empty-text="暂无数据"
      highlight-current-row
      height="calc(100% - 70px)"
      @current-change="onCurrentChange"
    >
      <el-table-column label="序号" width="60" align="center">
        <template slot-scope="scope">{{ pageStart + scope.$index + 1 }}</template>
      </el-table-column>
      <el-table-column label="文件/表格名称" prop="name" min-width="380" align="left" show-overflow-tooltip />
      <el-table-column label="原件文件名" prop="originalName" min-width="220" align="left" show-overflow-tooltip />
      <el-table-column label="文件状态" width="130" align="center">
        <template slot-scope="{ row }">
          <span :class="row.status === '已上传' ? 'text-success' : 'text-danger'">{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="主签名情况" width="130" align="center">
        <template slot-scope="{ row }">
          <span :class="row.signStatus === '已签名' ? 'text-success' : 'text-danger'">{{ row.signStatus }}</span>
        </template>
      </el-table-column>
      <el-table-column label="页数" prop="pages" width="100" align="center" />
      <el-table-column label="编制日期" prop="createDate" width="130" align="center" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        background
        layout="total, prev, pager, next, jumper, sizes"
        :total="filteredList.length"
        :current-page.sync="page"
        :page-size.sync="pageSize"
        :page-sizes="[10, 50, 100]"
      />
    </div>
  </div>
</template>

<script>
/** 文件挂接列表 mock（4 条"无文件" + 图片中 23 条"已上传"数据） */
const MOCK_LIST = [
  { id: 1, name: '二、工程交接表12', originalName: '', status: '无文件', signStatus: '未签名', pages: 0, createDate: '2026-03-24' },
  { id: 2, name: '2023年12月26日绍兴市交投集团党委书记、董事长张永春带队赴柯诸高速开展"元旦"节前安全生产检查', originalName: '', status: '无文件', signStatus: '未签名', pages: 0, createDate: '2023-12-26' },
  { id: 3, name: '24', originalName: '', status: '无文件', signStatus: '未签名', pages: 0, createDate: '2023-12-26' },
  { id: 4, name: '2022年7月4日绍兴市副市长陈伟军（右）、诸暨市委书记沈志江（左）协调柯诸高速项目', originalName: '', status: '无文件', signStatus: '未签名', pages: 0, createDate: '2022-07-01' },
  { id: 5, name: '(一）照片档案23', originalName: '0f0fb29a52813c6f2062596c9cfb04e.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2026-04-01' },
  { id: 6, name: '容山湖桥桥面清洗', originalName: '容山湖桥桥面清洗2024.12.26黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-26' },
  { id: 7, name: '容山湖桥左幅护栏浇筑', originalName: '容山湖桥左幅护栏浇筑2024.12.18黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-18' },
  { id: 8, name: '漓渚互通H匝道Hk0+501盖板涵—字墙砼浇筑', originalName: '漓渚互通H匝道Hk0+501盖板涵—字墙砼浇筑2024.12.17吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-17' },
  { id: 9, name: '容山湖桥左幅6#台搭板垫层浇筑', originalName: '容山湖桥左幅6#台搭板垫层浇筑2024.12.11黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-11' },
  { id: 10, name: '容山湖桥左幅6#台搭台背回填', originalName: '容山湖桥左幅6#台搭台背回填2024.12.8黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-08' },
  { id: 11, name: '漓渚互通HK0+501盖板涵—字墙开挖', originalName: '漓渚互通HK0+501盖板涵—字墙开挖2024.12.5吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-05' },
  { id: 12, name: '容山湖桥右幅护栏钢筋绑扎焊接', originalName: '容山湖桥右幅护栏钢筋绑扎焊接2024.12.2黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-02' },
  { id: 13, name: '容山湖桥左幅桥面铺装浇筑', originalName: '容山湖桥左幅桥面铺装浇筑2024.12.1黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-12-01' },
  { id: 14, name: '新造垾通道桥右幅0小桩号搭板开挖', originalName: '新造垾通道桥右幅0小桩号搭板开挖2024.11.27吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-11-27' },
  { id: 15, name: '漓渚互通H匝道第10跨梁板安装', originalName: '漓渚互通H匝道第十跨梁板安装2024.10.22吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-10-22' },
  { id: 16, name: '漓渚互通H匝道桥10#墩桥台台背开挖', originalName: '漓渚互通H匝道桥10#墩桥台台背开挖2024.10.21吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-10-21' },
  { id: 17, name: '洪家墩通道桥3#台搭板养护', originalName: '洪家墩通道桥3#台搭板养护2024.8.3黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-08-03' },
  { id: 18, name: '容山湖桥4#墩混凝土养护', originalName: '2024.7.4 黄宇聪 容山湖桥4#墩混凝土养护.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-04' },
  { id: 19, name: '漓渚互通迪埠大桥左幅5#墩盖梁台帽、6#墩盖梁底模拆除', originalName: '2024.7.4 刘锴 迪埠大桥左幅5#墩盖梁台帽、6#墩盖梁底模.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-04' },
  { id: 20, name: '漓渚互通迪埠大桥左幅5#墩盖梁骨架钢筋对接', originalName: '2024.7.4 李星星 迪埠大桥 5 号墩左幅盖梁骨架钢筋对接.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-04' },
  { id: 21, name: '漓渚互通迪埠大桥左幅6#墩盖梁封锚', originalName: '2024.7.4 刘锴 迪埠大桥左幅6#墩盖梁封锚.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-04' },
  { id: 22, name: '漓渚互通迪埠大桥左幅1-2#桩基钢筋笼安装', originalName: '2024.7.3 刘锴 迪埠大桥左幅1-2#桩基下钢筋笼.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-03' },
  { id: 23, name: '容山湖桥4#墩盖梁洒水土工布养护', originalName: '容山湖桥4#墩盖梁洒水土工布养护2024.7.3黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-03' },
  { id: 24, name: '容山湖桥小桩号侧拆模', originalName: '容山湖桥小桩号侧拆模2024.7.3黄宇聪.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-03' },
  { id: 25, name: 'LK4+021.98~LK4+075.02洪家墩通道桥左幅第3跨横隔板混凝土浇筑', originalName: '2024.7.4 卢锋凯 洪家墩通道桥左幅上部构造现浇浇筑第一联就地浇筑混凝土.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-03' },
  { id: 26, name: '漓渚互通迪埠大桥左幅0#台第一层模板拆除', originalName: '2024.7.2 李星星 迪埠大桥 0 号台左幅拆除第一层模板.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-02' },
  { id: 27, name: '漓渚互通H0椎坡修整', originalName: '漓渚互通H0锥坡修整2024.7.2吴伊杨.jpg', status: '已上传', signStatus: '未签名', pages: 1, createDate: '2024-07-02' }
]

export default {
  name: 'ArchiveTraditionalLink',
  data() {
    return {
      keyword: '',
      appliedKeyword: '',
      onlyUploaded: false,
      list: JSON.parse(JSON.stringify(MOCK_LIST)),
      currentRow: null,
      page: 1,
      pageSize: 100,
      collectDialogVisible: false,
      collectRow: null,
      reUploadVisible: false,
      reUploadRow: null,
      dragOver: false,
      uploadFiles: []
    }
  },
  computed: {
    /** 关键字 + 已上传 过滤（未勾选"已上传"时不展示已上传状态的数据） */
    filteredList() {
      let list = this.list
      const kw = this.appliedKeyword.trim()
      if (kw) list = list.filter(x => x.name.includes(kw))
      if (!this.onlyUploaded) list = list.filter(x => x.status !== '已上传')
      return list
    },
    pagedList() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredList.slice(start, start + this.pageSize)
    },
    pageStart() {
      return (this.page - 1) * this.pageSize
    },
    /** 按钮可用性：基于当前选中行状态判断（单选） */
    /** 当前行是否为"无文件"（未上传） */
    isCurrentNotUploaded() {
      return !!this.currentRow && this.currentRow.status === '无文件'
    },
    /** 当前行是否为"已上传" */
    isCurrentUploaded() {
      return !!this.currentRow && this.currentRow.status === '已上传'
    },
    /** 未上传：仅可"重新上传"、"查看收集信息"；已上传不可"重新上传" */
    canReUpload() {
      return this.isCurrentNotUploaded
    },
    /** 已上传：除"重新上传"外均可操作 */
    canConvertPdf() {
      return this.isCurrentUploaded
    },
    canViewOriginal() {
      return this.isCurrentUploaded
    },
    canViewPdf() {
      return this.isCurrentUploaded
    }
  },
  methods: {
    doSearch() {
      this.appliedKeyword = this.keyword
      this.page = 1
    },
    refresh() {
      this.list = JSON.parse(JSON.stringify(MOCK_LIST))
      this.keyword = ''
      this.appliedKeyword = ''
      this.onlyUploaded = false
      this.page = 1
      this.$nextTick(() => { this.currentRow = null })
      this.$message.success('刷新成功（静态 DEMO）')
    },
    onCurrentChange(row) {
      this.currentRow = row || null
    },
    /** 重新上传扫描件：打开上传弹窗 */
    reUpload() {
      const row = this.currentRow
      if (!row) return
      this.reUploadRow = row
      this.reUploadVisible = true
    },
    /** 选择文件（系统文件选择框） */
    chooseFiles() {
      this.$refs.fileInput.click()
    },
    onFileChange(e) {
      this.addFiles(Array.from(e.target.files || []))
      e.target.value = ''
    },
    /** 拖放文件 */
    onDrop(e) {
      this.dragOver = false
      this.addFiles(Array.from(e.dataTransfer.files || []))
    },
    /** 添加文件并模拟上传进度（静态 DEMO，不真实上传） */
    addFiles(files) {
      files.forEach(file => {
        const f = {
          uid: Date.now() + Math.random(),
          name: file.name,
          sizeText: this.formatSize(file.size),
          percent: 0,
          statusText: '等待上传'
        }
        this.uploadFiles.push(f)
        this.simulateUpload(f)
      })
    },
    /** 模拟上传进度 */
    simulateUpload(f) {
      const timer = setInterval(() => {
        f.percent = Math.min(f.percent + Math.random() * 20 + 5, 100)
        if (f.percent >= 100) {
          f.statusText = '上传成功'
          clearInterval(timer)
        } else {
          f.statusText = '上传中'
        }
      }, 300)
    },
    removeFile(index) {
      this.uploadFiles.splice(index, 1)
    },
    formatSize(size) {
      if (size == null) return ''
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
      return `${(size / 1024 / 1024).toFixed(2)} MB`
    },
    /** 弹窗关闭后重置 */
    resetUpload() {
      this.uploadFiles = []
      this.dragOver = false
      this.reUploadRow = null
    },
    /** 转换为 PDF */
    convertPdf() {
      if (!this.currentRow) return
      this.$message.success(`已将「${this.currentRow.name}」加入转换队列`)
    },
    viewOriginal() {
      this.$message.info('查看原始文件')
    },
    viewPdf() {
      this.$message.info('查看PDF文件')
    },
    /** 查看收集信息弹窗 */
    viewCollectInfo() {
      const row = this.currentRow
      if (!row) return
      this.collectRow = {
        ...row,
        collectId: '4FC0A3C9-1C84-41BE-BAC2-19398564D3A2',
        fileCode: '',
        collector: '柯诸业主测试(勿选)',
        collectDate: '2026-04-27 18:12:01',
        fileDirPath: '柯诸至诸暨高速公路工程 -> 第四部分 施工文件 -> 柯诸至诸暨高速公路工程TJ01标段项目经理部施工文件 -> 七、声像文件 -> 照片档案',
        filePath: '柯诸至诸暨高速公路工程 -> 第四部分 施工文件 -> 柯诸至诸暨高速公路工程TJ01标段项目经理部施工文件 -> 七、声像文件 -> 照片档案',
        volumeDir: '柯诸至诸暨高速公路工程TJ01标段音频/视频/G2、H匝道、改路桥、洪家墩通道桥、漓渚互通H匝道桥、漓渚互通迪埠大桥、容山湖桥、新造垾通道桥照片档案',
        volumePath: '柯诸至诸暨高速公路工程 -> 第四部分 施工文件 -> 柯诸至诸暨高速公路工程TJ01标段项目经理部施工文件 -> 七、声像文件 -> 照片档案'
      }
      this.collectDialogVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.traditional-link-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
  background: #fff;

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    .search-input { width: 180px; }
    .uploaded-check { margin: 0 0 0 8px; }
  }

  .el-table { flex: 1; }

  .pagination-wrap {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }

  .text-success { color: #67c23a; }
  .text-danger { color: #f56c6c; }
}
</style>

<style lang="scss">
/* 查看收集信息弹窗（append-to-body 需用全局样式） */
.collect-info-dialog {
  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__header {
    padding: 14px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__body {
    padding: 14px 20px;
    max-height: 420px;
    overflow-y: auto;
  }

  .collect-info {
    font-size: 13px;
    line-height: 1.9;
    color: #303133;
    word-break: break-all;

    .info-row .label {
      color: #303133;
    }

    .section {
      margin-top: 10px;
    }

    .indent {
      margin-top: 2px;
    }
  }

  .dialog-footer {
    text-align: right;
  }
}

/* 重新上传弹窗（append-to-body 需用全局样式） */
.re-upload-dialog {
  .el-dialog__header {
    padding: 12px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .el-dialog__body {
    padding: 12px 16px 16px;
  }

  .upload-zone {
    min-height: 340px;
    max-height: 460px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px 12px;
    transition: border-color 0.2s, background-color 0.2s;

    &.is-dragover {
      border-color: #409eff;
      background-color: #ecf5ff;
    }

    .upload-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0 10px;
      font-size: 13px;
      color: #606266;
      border-bottom: 1px solid #ebeef5;
      margin-bottom: 8px;
    }

    .upload-file-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .upload-file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #606266;
      line-height: 28px;

      .file-name {
        flex-shrink: 0;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-size {
        flex-shrink: 0;
        color: #909399;
      }

      .file-progress {
        flex: 1;
      }

      .file-status {
        flex-shrink: 0;
        color: #909399;

        &.is-success {
          color: #67c23a;
        }
      }

      .file-remove {
        cursor: pointer;
        color: #909399;

        &:hover {
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
