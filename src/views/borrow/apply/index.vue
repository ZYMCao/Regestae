<template>
  <!-- 档案借阅：提交借阅申请 -->
  <div class="app-container">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="dialogVisible = true">借阅申请</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="借阅单号" prop="borrowNo" width="150" />
      <el-table-column label="档案题名" prop="archiveTitle" min-width="200" show-overflow-tooltip />
      <el-table-column label="借阅人" prop="borrowUser" width="100" />
      <el-table-column label="借出日期" prop="borrowDate" width="110" />
      <el-table-column label="应还日期" prop="dueDate" width="110" />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template slot-scope="{ row }">
          <el-button v-if="row.status === '0'" size="mini" type="text" @click="handleRenew(row)">续借</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination background layout="total, prev, pager, next" :total="total" :current-page.sync="queryParams.pageNum" :page-size="queryParams.pageSize" @current-change="getList" />
    </div>

    <!-- 借阅申请弹窗 -->
    <el-dialog title="借阅申请" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form ref="borrowForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="档案编号" prop="archiveNo">
          <el-input v-model="form.archiveNo" placeholder="请输入要借阅的档案编号" />
        </el-form-item>
        <el-form-item label="借阅事由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请说明借阅用途" />
        </el-form-item>
        <el-form-item label="归还日期" prop="dueDate">
          <el-date-picker v-model="form.dueDate" type="date" value-format="yyyy-MM-dd" placeholder="选择预计归还日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitApply">提 交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listBorrow, applyBorrow, renewBorrow } from '@/api/borrow'

export default {
  name: 'BorrowApply',
  data() {
    return {
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      list: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10 },
      form: { archiveNo: '', reason: '', dueDate: '' },
      rules: {
        archiveNo: [{ required: true, message: '请输入档案编号', trigger: 'blur' }],
        reason: [{ required: true, message: '请输入借阅事由', trigger: 'blur' }],
        dueDate: [{ required: true, message: '请选择归还日期', trigger: 'change' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listBorrow(this.queryParams).then(res => {
        this.list = (res.data && res.data.list) || []
        this.total = (res.data && res.data.total) || 0
      }).finally(() => { this.loading = false })
    },
    statusText(s) {
      return ({ 0: '借阅中', 1: '待审批', 2: '已归还', 3: '已逾期' })[s] || s
    },
    statusTag(s) {
      return ({ 0: 'primary', 1: 'warning', 2: 'success', 3: 'danger' })[s] || 'info'
    },
    /** 提交申请 */
    submitApply() {
      this.$refs.borrowForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        applyBorrow(this.form).then(() => {
          this.$message.success('借阅申请已提交，等待审批')
          this.dialogVisible = false
          this.getList()
        }).finally(() => { this.submitLoading = false })
      })
    },
    /** 续借 */
    handleRenew(row) {
      this.$confirm(`确认为借阅单 ${row.borrowNo} 续借 15 天吗？`, '提示', { type: 'warning' })
        .then(() => renewBorrow({ id: row.id }))
        .then(() => {
          this.$message.success('续借成功')
          this.getList()
        }).catch(() => {})
    }
  }
}
</script>
