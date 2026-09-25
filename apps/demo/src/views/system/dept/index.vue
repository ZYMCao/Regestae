<template>
  <!-- 部门管理（树形表格，与机构管理结构类似） -->
  <div class="app-container">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" plain icon="el-icon-plus" size="small" v-permission="['system:dept:add']" @click="openDialog()">新增部门</el-button>
      </div>
    </div>

    <el-table v-loading="loading" height="calc(100% - 60px)" :data="list" row-key="deptId" border default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column label="部门名称" prop="deptName" min-width="220" />
      <el-table-column label="部门编码" prop="deptCode" width="140" />
      <el-table-column label="负责人" prop="leader" width="120" />
      <el-table-column label="排序" prop="orderNum" width="80" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="openDialog(row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.deptId ? '编辑部门' : '新增部门'" :visible.sync="dialogVisible" width="520px" append-to-body>
      <el-form ref="deptForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" />
        </el-form-item>
        <el-form-item label="部门编码" prop="deptCode">
          <el-input v-model="form.deptCode" />
        </el-form-item>
        <el-form-item label="排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDept, addDept, updateDept, delDept } from '@/api/system'

export default {
  name: 'SystemDept',
  data() {
    return {
      loading: false,
      submitLoading: false,
      list: [],
      dialogVisible: false,
      form: {},
      rules: {
        deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
        deptCode: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
      }
    }
  },
  created() {
    // this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listDept().then(res => {
        this.list = res.data || []
      }).finally(() => { this.loading = false })
    },
    openDialog(row) {
      this.form = row ? { ...row } : { parentId: 0, deptName: '', deptCode: '', orderNum: 0, status: '0' }
      this.dialogVisible = true
    },
    submitForm() {
      this.$refs.deptForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        const request = this.form.deptId ? updateDept(this.form) : addDept(this.form)
        request.then(() => {
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.getList()
        }).finally(() => { this.submitLoading = false })
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除部门「${row.deptName}」吗？`, '警告', { type: 'warning' })
        .then(() => delDept(row.deptId))
        .then(() => {
          this.$message.success('删除成功')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>
