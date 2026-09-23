<template>
  <div class="app-container maintain-page">
    <!-- 工具条 -->
    <div class="toolbar">
      <el-button size="mini" class="tool-btn" @click="handleRefresh"><i class="el-icon-refresh c-green" />刷新</el-button>
      <el-button size="mini" class="tool-btn" @click="handleAdd('新增库房', 'house')"><i class="el-icon-circle-plus-outline c-green" />新增库房</el-button>
      <el-button size="mini" class="tool-btn" @click="handleAdd('新增密集架', 'dense')"><i class="el-icon-circle-plus-outline c-green" />新增密集架</el-button>
      <el-button size="mini" class="tool-btn" @click="handleAdd('新增其它节点', 'other')"><i class="el-icon-circle-plus-outline c-green" />新增其它节点</el-button>
      <el-button size="mini" class="tool-btn" @click="handleEdit"><i class="el-icon-edit c-orange" />修改</el-button>
      <el-button size="mini" class="tool-btn" @click="handleDelete"><i class="el-icon-minus c-red" />删除</el-button>
      <el-button size="mini" class="tool-btn" @click="handleSort"><i class="el-icon-s-operation c-blue" />排序</el-button>
    </div>

    <!-- 树形表格：库房 > 密集架 > 列 > 层 -->
    <el-table
      ref="treeTable"
      :data="rows"
      row-key="id"
      :default-expand-all="false"
      :tree-props="{ children: 'children' }"
      border
      size="mini"
      height="calc(100% - 40px)"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="order" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="名称" min-width="380">
        <template slot-scope="{ row }">
          <i :class="iconClass(row)" />
          <span class="node-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编码" width="180" align="center" />
      <el-table-column prop="type" label="节点类型" width="120" align="center" />
      <el-table-column prop="remark" label="备注" min-width="120" align="center" />
      <el-table-column prop="creator" label="增加人" width="150" align="center" />
      <el-table-column prop="createTime" label="增加时间" width="180" align="center" />
    </el-table>

    <!-- 新增/修改 弹窗 -->
    <el-dialog
      :title="dialogType === 'edit' ? '修改节点' : dialogTitle"
      :visible.sync="dialogVisible"
      width="460px"
      append-to-body
      custom-class="node-dialog"
    >
      <el-form ref="nodeForm" :model="form" :rules="rules" label-width="110px" size="small">
        <template v-if="form.type === '库房'">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" />
          </el-form-item>
          <el-form-item label="编码" prop="code">
            <el-input v-model="form.code" placeholder="请输入编码" />
          </el-form-item>
        </template>

        <template v-if="form.type === '密集架'">
          <el-form-item label="密集架名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" />
          </el-form-item>
          <el-form-item label="密集架编码" prop="code">
            <el-input v-model="form.code" placeholder="请输入编码" />
          </el-form-item>
        </template>
        
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submitNode">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 排序弹窗 -->
    <el-dialog title="节点排序" :visible.sync="sortVisible" width="320px" append-to-body custom-class="node-dialog">
      <el-input v-model="sortValue" size="small" placeholder="请输入排序号" />
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="sortVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submitSort">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
let uid = 100

// 库房树形结构（与截图一致）
const NODES = [
  {
    id: 1, order: 1, name: '测试', code: '1', type: '库房', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:14:04',
    children: [
      {
        id: 11, order: 1, name: '密集架1', code: '1', type: '密集架', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:15:40',
        children: [
          {
            id: 111, order: 1, name: '密集架1-列1列', code: '列1', type: '列', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:15:52',
            children: [
              { id: 1111, order: 1, name: '密集架1-列1列1层002层', code: '层002', type: '层', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:16:13' },
              { id: 1112, order: 2, name: '密集架1-列1列1层', code: '层1', type: '层', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:16:07' }
            ]
          }
        ]
      },
      { id: 12, order: 2, name: '密集架2', code: '2', type: '密集架', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:18:04' },
      { id: 13, order: 3, name: '密集架3', code: '3', type: '密集架', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:18:13' },
      { id: 14, order: 4, name: '密集架4', code: '4', type: '密集架', remark: '', creator: '管理员(开发用)', createTime: '2023-05-17 11:18:20' }
    ]
  }
]

export default {
  name: 'WarehouseMaintain',
  data() {
    return {
      rows: JSON.parse(JSON.stringify(NODES)),
      currentNode: null,
      // 弹窗
      dialogVisible: false,
      dialogType: 'add',
      dialogTitle: '新增库房',
      simpleAdd: false, // 新增库房/密集架：无上级节点、节点类型，带排序字段
      form: { parentName: '', name: '', code: '', type: '库房', order: 1, remark: '' },
      rules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
        order: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
      },
      // 排序
      sortVisible: false,
      sortValue: ''
    }
  },
  mounted() {
    // 默认展开第一层（库房）
    this.$nextTick(() => {
      if (this.rows.length) {
        this.rows.forEach(r => { r.expand = undefined }) // 保持 el-table 默认行为
      }
    })
  },
  methods: {
    iconClass(data) {
      if (data.type === '库房') return 'el-icon-folder c-orange'
      if (data.type === '密集架') return 'el-icon-folder-opened c-orange'
      if (data.type === '列') return 'el-icon-folder-opened c-orange'
      return 'el-icon-notebook-2 c-blue' // 层
    },
    handleCurrentChange(row) {
      this.currentNode = row
    },
    // 新增：kind = house（库房根节点）/ dense（密集架）/ other（其它节点）
    handleAdd(title, kind) {
      this.dialogType = 'add'
      this.dialogTitle = title
      // 库房、密集架：简化表单（无上级节点/节点类型，带排序）
      this.simpleAdd = kind === 'house' || kind === 'dense'
      const node = this.currentNode || {}
      let parentName = '（顶级）'
      let type = '库房'
      if (kind === 'dense') {
        parentName = node.name || ''
        type = '密集架'
      } else if (kind === 'other') {
        parentName = node.name || ''
        type = '其它节点'
      } else {
        // 依据当前选中节点类型推断新增子节点类型
        parentName = node.name || ''
      }
      this.form = { parentName, name: '', code: '', type, order: 1, remark: '' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.nodeForm && this.$refs.nodeForm.clearValidate())
    },
    handleEdit() {
      if (!this.currentNode) {
        this.$message.warning('请先选择节点')
        return
      }
      this.dialogType = 'edit'
      this.dialogTitle = '修改节点'
      this.form = {
        parentName: '',
        name: this.currentNode.name,
        code: this.currentNode.code,
        type: this.currentNode.type,
        remark: this.currentNode.remark || ''
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.nodeForm && this.$refs.nodeForm.clearValidate())
    },
    submitNode() {
      this.$refs.nodeForm.validate(valid => {
        if (!valid) return
        if (this.dialogType === 'edit') {
          this.currentNode.name = this.form.name
          this.currentNode.code = this.form.code
          this.currentNode.remark = this.form.remark
          this.$message.success('修改成功')
        } else {
          const node = {
            id: ++uid,
            order: this.form.order || 1,
            name: this.form.name,
            code: this.form.code,
            type: this.form.type,
            remark: this.form.remark,
            creator: '管理员(开发用)',
            createTime: this.formatNow()
          }
          if (this.dialogTitle === '新增库房') {
            this.rows.push(node)
          } else if (this.currentNode) {
            if (!this.currentNode.children) this.$set(this.currentNode, 'children', [])
            this.currentNode.children.push(node)
            this.currentNode.expand = true // el-table 树懒展开提示
            this.$refs.treeTable.toggleRowExpansion(this.currentNode, true)
          }
          this.$message.success('新增成功')
        }
        this.dialogVisible = false
      })
    },
    findParentAndRemove(list, id, parent) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          if (parent) {
            parent.children.splice(i, 1)
            if (!parent.children.length) delete parent.children
          }
          return true
        }
        if (list[i].children && this.findParentAndRemove(list[i].children, id, list[i])) return true
      }
      return false
    },
    handleDelete() {
      if (!this.currentNode) {
        this.$message.warning('请先选择节点')
        return
      }
      this.$confirm('确认删除节点「' + this.currentNode.name + '」吗？', '提示', { type: 'warning' })
        .then(() => {
          this.findParentAndRemove(this.rows, this.currentNode.id, null)
          this.currentNode = null
          this.$message.success('删除成功')
        })
        .catch(() => {})
    },
    handleSort() {
      if (!this.currentNode) {
        this.$message.warning('请先选择节点')
        return
      }
      this.sortValue = String(this.currentNode.order)
      this.sortVisible = true
    },
    submitSort() {
      const v = parseInt(this.sortValue, 10)
      if (isNaN(v)) {
        this.$message.warning('请输入数字排序号')
        return
      }
      this.currentNode.order = v
      this.sortVisible = false
      this.$message.success('排序已更新')
    },
    handleRefresh() {
      this.rows = JSON.parse(JSON.stringify(NODES))
      this.currentNode = null
      this.$message.success('已刷新')
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
.maintain-page {
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 10px 10px;
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

.node-name {
  margin-left: 4px;
  font-size: 13px;
  color: #303133;
}

.c-green { color: #67c23a; }
.c-orange { color: #e6a23c; }
.c-red { color: #f56c6c; }
.c-blue { color: $themeColor; }
</style>
