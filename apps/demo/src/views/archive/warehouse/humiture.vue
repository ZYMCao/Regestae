<template>
  <div class="humiture-page">
    <!-- 左侧：库房节点 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="nodeKeyword" placeholder="请输入库房节点" size="small" clearable @keyup.enter.native="doFilter">
          <el-button slot="append" icon="el-icon-search" @click="doFilter" />
        </el-input>
      </div>
      <div class="panel-header">库房节点</div>
      <div class="node-list">
        <div v-for="n in filteredNodes" :key="n" :class="['node-item', n === activeNode ? 'active' : '']" @click="selectNode(n)">
          <i class="el-icon-folder-opened node-icon" />
          <span class="node-name">{{ n }}</span>
        </div>
        <div v-if="!filteredNodes.length" class="node-empty">暂无匹配节点</div>
      </div>
    </div>

    <!-- 右侧：温湿度登记表 -->
    <div class="right-panel">
      <div class="toolbar">
        <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
        <el-button size="mini" class="tool-btn" @click="handleAdd"><i class="el-icon-circle-plus-outline c-green" />新增</el-button>
        <el-button size="mini" class="tool-btn" @click="handleEdit"><i class="el-icon-edit c-orange" />修改</el-button>
        <el-button size="mini" class="tool-btn" @click="handleDelete"><i class="el-icon-minus c-red" />删除</el-button>
        <el-button size="mini" class="tool-btn" @click="handlePrint"><i class="el-icon-printer c-teal" />打印温湿度登记表</el-button>
        <el-button size="mini" class="tool-btn" @click="handleImport"><i class="el-icon-upload c-green" />导入</el-button>
        <el-button size="mini" class="tool-btn" @click="handleExport"><i class="el-icon-download c-blue" />导出</el-button>
      </div>
      <el-table
        ref="table"
        :data="rows"
        border
        stripe
        size="mini"
        height="calc(100% - 84px)"
        row-key="id"
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="wh" label="库名称" min-width="160" align="center" sortable />
        <el-table-column prop="date" label="日期" width="120" align="center" sortable />
        <el-table-column prop="time" label="时间" width="130" align="center" sortable />
        <el-table-column prop="temp" label="温度(℃)" width="100" align="center" sortable />
        <el-table-column prop="humi" label="湿度(%)" width="100" align="center" sortable />
        <el-table-column prop="recorder" label="记录人" width="110" align="center" sortable />
        <el-table-column prop="handle" label="处理情况" min-width="140" align="center" show-overflow-tooltip sortable />
        <el-table-column prop="creator" label="增加人" width="120" align="center" sortable />
        <el-table-column prop="createTime" label="增加时间" width="160" align="center" sortable />
      </el-table>
      <div class="pager-bar">
        <span class="pager-total">共 {{ rows.length }} 条</span>
        <el-pagination layout="prev, pager, next" :total="rows.length" :page-size="100" :current-page.sync="page" class="pager" />
        <span class="pager-jump">前往 <input v-model="pageInput" class="page-input" disabled> 页</span>
        <el-select v-model="pageSize" size="mini" class="page-size-dd" disabled>
          <el-option label="100条/页" :value="100" />
        </el-select>
      </div>
    </div>

    <!-- 新增/修改 弹窗 -->
    <el-dialog
      :title="dialogType === 'edit' ? '修改温湿度登记' : '新增温湿度登记'"
      :visible.sync="dialogVisible"
      width="460px"
      append-to-body
      custom-class="humiture-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="small">
        <el-form-item label="库名称" prop="wh">
          <el-input v-model="form.wh" disabled />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="form.date" type="date" value-format="yyyy-MM-dd" placeholder="请选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="时间" prop="time">
          <el-time-picker v-model="form.time" value-format="HH:mm:ss" placeholder="请选择时间" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="温度(℃)" prop="temp">
          <el-input-number v-model="form.temp" :min="-20" :max="60" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="湿度(%)" prop="humi">
          <el-input-number v-model="form.humi" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="记录人" prop="recorder">
          <el-input v-model="form.recorder" placeholder="请输入记录人" />
        </el-form-item>
        <el-form-item label="处理情况">
          <el-input v-model="form.handle" type="textarea" :rows="2" placeholder="请输入处理情况" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 库房节点（与库房维护数据一致）
const NODES = ['测试']

// 各库房节点的温湿度记录（静态演示）
const ROWS_MAP = {
  '测试': []
}

export default {
  name: 'WarehouseHumiture',
  data() {
    return {
      nodeKeyword: '',
      nodes: NODES,
      activeNode: '测试',
      rows: [],
      selections: [],
      page: 1,
      pageInput: '1',
      pageSize: 100,
      // 弹窗
      dialogVisible: false,
      dialogType: 'add',
      form: { wh: '', date: '', time: '', temp: 20, humi: 50, recorder: '', handle: '' },
      rules: {
        date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        time: [{ required: true, message: '请选择时间', trigger: 'change' }],
        temp: [{ required: true, message: '请输入温度', trigger: 'blur' }],
        humi: [{ required: true, message: '请输入湿度', trigger: 'blur' }],
        recorder: [{ required: true, message: '请输入记录人', trigger: 'blur' }]
      }
    }
  },
  computed: {
    filteredNodes() {
      const kw = this.nodeKeyword.trim()
      if (!kw) return this.nodes
      return this.nodes.filter(n => n.indexOf(kw) > -1)
    }
  },
  mounted() {
    this.loadRows()
  },
  methods: {
    doFilter() {
      // 节点列表已随 nodeKeyword 计算过滤
    },
    loadRows() {
      this.rows = ROWS_MAP[this.activeNode] || []
    },
    selectNode(n) {
      this.activeNode = n
      this.loadRows()
    },
    handleSelectionChange(rows) {
      this.selections = rows
    },
    handleRefresh() {
      this.loadRows()
      this.$message.success('已刷新')
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { wh: this.activeNode, date: '', time: '', temp: 20, humi: 50, recorder: '', handle: '' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    handleEdit() {
      if (this.selections.length !== 1) {
        this.$message.warning('请选择一条记录')
        return
      }
      this.dialogType = 'edit'
      const s = this.selections[0]
      this.form = { wh: s.wh, date: s.date, time: s.time, temp: s.temp, humi: s.humi, recorder: s.recorder, handle: s.handle }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        if (this.dialogType === 'edit') {
          const s = this.selections[0]
          s.date = this.form.date
          s.time = this.form.time
          s.temp = this.form.temp
          s.humi = this.form.humi
          s.recorder = this.form.recorder
          s.handle = this.form.handle
          this.$message.success('修改成功')
        } else {
          this.rows.push({
            id: Date.now(),
            wh: this.form.wh,
            date: this.form.date,
            time: this.form.time,
            temp: this.form.temp,
            humi: this.form.humi,
            recorder: this.form.recorder,
            handle: this.form.handle,
            creator: '管理员(开发用)',
            createTime: this.formatNow()
          })
          this.$message.success('新增成功')
        }
        this.dialogVisible = false
      })
    },
    handleDelete() {
      if (!this.selections.length) {
        this.$message.warning('请先选择记录')
        return
      }
      this.$confirm('确认删除选中的 ' + this.selections.length + ' 条记录吗？', '提示', { type: 'warning' })
        .then(() => {
          const ids = this.selections.map(s => s.id)
          this.rows = this.rows.filter(r => ids.indexOf(r.id) === -1)
          this.$message.success('删除成功')
        })
        .catch(() => {})
    },
    handlePrint() {
      this.$message.info('打印温湿度登记表')
    },
    handleImport() {
      this.$message.info('导入')
    },
    handleExport() {
      this.$message.info('导出')
    },
    formatNow() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    }
  }
}
</script>

<style lang="scss" scoped>
.humiture-page {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.left-panel {
  width: 225px;
  min-width: 225px;
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

  .node-list {
    flex: 1;
    overflow: auto;

    .node-item {
      display: flex;
      align-items: center;
      padding: 9px 14px;
      font-size: 13px;
      color: #303133;
      cursor: pointer;

      .node-icon {
        color: $themeColor;
        margin-right: 6px;
      }

      .node-name {
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

    .node-empty {
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
  overflow: hidden;
}

.toolbar {
  padding: 8px 12px;
  display: flex;
  align-items: center;

  .tool-btn {
    font-size: 12px;

    i {
      margin-right: 3px;
    }
  }
}

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

.c-green { color: #67c23a; }
.c-orange { color: #e6a23c; }
.c-red { color: #f56c6c; }
.c-blue { color: $themeColor; }
.c-teal { color: #13c2c2; }
</style>
