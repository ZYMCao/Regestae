<template>
  <!-- 机构管理（树形表格 CRUD） -->
  <div class="app-container">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" plain icon="el-icon-plus" size="small" v-permission="['system:org:add']" @click="openDialog()">新增机构</el-button>
      </div>
    </div>

    <el-table v-loading="loading" height="calc(100% - 60px)" :data="list" row-key="orgId" border default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column label="机构名称" prop="orgName" min-width="220" />
      <el-table-column label="机构编码" prop="orgCode" width="140" />
      <el-table-column label="负责人" prop="leader" width="120" />
      <el-table-column label="联系电话" prop="phone" width="140" />
      <el-table-column label="排序" prop="orderNum" width="70" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-plus" @click="openDialog(null, row.orgId)">新增子级</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" @click="openDialog(row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="form.orgId ? '编辑机构' : '新增机构'" :visible.sync="dialogVisible" width="520px" append-to-body>
      <el-form ref="orgForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级机构" prop="parentId">
          <el-input v-model="form.parentName" disabled placeholder="不选则为顶级机构" />
        </el-form-item>
        <el-form-item label="机构名称" prop="orgName">
          <el-input v-model="form.orgName" />
        </el-form-item>
        <el-form-item label="机构编码" prop="orgCode">
          <el-input v-model="form.orgCode" />
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
import { listOrg, addOrg, updateOrg, delOrg } from '@/api/system'

export default {
  name: 'SystemOrg',
  data() {
    return {
      loading: false,
      submitLoading: false,
      list: [],
      dialogVisible: false,
      form: {},
      rules: {
        orgName: [{ required: true, message: '请输入机构名称', trigger: 'blur' }],
        orgCode: [{ required: true, message: '请输入机构编码', trigger: 'blur' }]
      }
    }
  },
  created() {
    // this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listOrg().then(res => {
        this.list = res.data || []
      }).finally(() => { this.loading = false })
    },
    openDialog(row, parentId) {
      this.form = row
        ? { ...row }
        : { parentId: parentId || 0, parentName: '', orgName: '', orgCode: '', orderNum: 0, status: '0' }
      this.dialogVisible = true
    },
    submitForm() {
      this.$refs.orgForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        const request = this.form.orgId ? updateOrg(this.form) : addOrg(this.form)
        request.then(() => {
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.getList()
        }).finally(() => { this.submitLoading = false })
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除机构「${row.orgName}」吗？`, '警告', { type: 'warning' })
        .then(() => delOrg(row.orgId))
        .then(() => {
          this.$message.success('删除成功')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>
