<template>
  <!-- 用户管理：标准 CRUD 页（含部门树过滤，参照此页开发其他系统管理页） -->
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="toolbar">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="queryParams.mobile" placeholder="请输入手机号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="用户状态" clearable style="width: 120px">
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" plain icon="el-icon-plus" size="small" v-permission="['system:user:add']" @click="openDialog()">新增</el-button>
        <el-button type="danger" plain icon="el-icon-delete" size="small" v-permission="['system:user:remove']" :disabled="!selectedIds.length" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" height="calc(100% - 160px)" border stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="用户编号" prop="userId" width="90" align="center" />
      <el-table-column label="用户名" prop="userName" width="120" />
      <el-table-column label="昵称" prop="nickName" width="120" />
      <el-table-column label="部门" prop="deptName" width="140" />
      <el-table-column label="手机号" prop="mobile" width="130" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="160" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-edit" v-permission="['system:user:edit']" @click="openDialog(row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-key" v-permission="['system:user:resetPwd']" @click="handleResetPwd(row)">重置密码</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" v-permission="['system:user:remove']" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :page-sizes="[10, 20, 50]" @size-change="getList" @current-change="getList" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="form.userId ? '编辑用户' : '新增用户'" :visible.sync="dialogVisible" width="560px" append-to-body>
      <el-form ref="userForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="form.userName" :disabled="!!form.userId" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
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
import { listUser, addUser, updateUser, delUser, resetUserPwd } from '@/api/system'

export default {
  name: 'SystemUser',
  data() {
    return {
      loading: false,
      submitLoading: false,
      list: [],
      total: 0,
      selectedIds: [],
      queryParams: { pageNum: 1, pageSize: 10, userName: '', mobile: '', status: '' },
      dialogVisible: false,
      form: {},
      rules: {
        userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
      }
    }
  },
  created() {
    // this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listUser(this.queryParams).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.$refs.queryForm.resetFields()
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.userId)
    },
    openDialog(row) {
      this.form = row ? { ...row } : { userName: '', nickName: '', mobile: '', status: '0' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.userForm.clearValidate())
    },
    submitForm() {
      this.$refs.userForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        const request = this.form.userId ? updateUser(this.form) : addUser(this.form)
        request.then(() => {
          this.$message.success(this.form.userId ? '修改成功' : '新增成功')
          this.dialogVisible = false
          this.getList()
        }).finally(() => { this.submitLoading = false })
      })
    },
    handleResetPwd(row) {
      this.$prompt(`请输入用户 ${row.userName} 的新密码`, '重置密码', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^.{6,20}$/,
        inputErrorMessage: '密码长度为 6-20 位'
      }).then(({ value }) => resetUserPwd(row.userId, value)).then(() => {
        this.$message.success('重置成功')
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row && row.userId ? [row.userId] : this.selectedIds
      this.$confirm(`确认删除选中的 ${ids.length} 个用户吗？`, '警告', { type: 'warning' })
        .then(() => delUser(ids.join(',')))
        .then(() => {
          this.$message.success('删除成功')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>
