<template>
  <!--
    案卷新增/编辑弹窗：两列表单布局（全宗号/类别号/题名/档号/编制单位/日期/保管期限等）
    mode = 'add' 新增案卷 | 'edit' 编辑案卷（回填 rowData），确定时 emit('confirm', formData)
  -->
  <el-dialog
    :title="mode === 'edit' ? '编辑案卷' : '新增案卷'"
    :visible.sync="dialogVisible"
    width="680px"
    top="6vh"
    custom-class="roll-edit-dialog"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form ref="editForm" :model="form" :rules="rules" label-width="110px" size="small">
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="全宗号" prop="fondsNo">
            <el-input v-model="form.fondsNo" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类别号" prop="categoryNo">
            <el-input v-model="form.categoryNo" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="案卷题名" prop="title">
            <el-input v-model="form.title" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="档号" prop="archiveNo">
            <el-input v-model="form.archiveNo" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="互见号" prop="mutualNo">
            <el-input v-model="form.mutualNo" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="编制单位" prop="unit">
            <el-input v-model="form.unit" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="编制起日期" prop="startDate">
            <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="编制止日期" prop="endDate">
            <el-date-picker v-model="form.endDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="考证起日期" prop="verifyStart">
            <el-date-picker v-model="form.verifyStart" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="考证止日期" prop="verifyEnd">
            <el-date-picker v-model="form.verifyEnd" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" class="w100" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="保管期限" prop="keepTerm">
            <el-select v-model="form.keepTerm" class="w100">
              <el-option label="永久" value="永久" />
              <el-option label="30年" value="30年" />
              <el-option label="10年" value="10年" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密级" prop="secretLevel">
            <el-select v-model="form.secretLevel" class="w100" clearable>
              <el-option label="绝密" value="绝密" />
              <el-option label="机密" value="机密" />
              <el-option label="秘密" value="秘密" />
              <el-option label="内部" value="内部" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="案卷号" prop="rollNo">
            <el-input v-model="form.rollNo" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年度" prop="year">
            <el-input v-model="form.year" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="脊背规格" prop="spineSpec">
            <el-select v-model="form.spineSpec" class="w100" clearable>
              <el-option label="2cm" value="2cm" />
              <el-option label="3cm" value="3cm" />
              <el-option label="4cm" value="4cm" />
              <el-option label="5cm" value="5cm" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资料是否齐全" prop="materialComplete">
            <el-select v-model="form.materialComplete" class="w100">
              <el-option label="齐全" value="齐全" />
              <el-option label="基本齐全" value="基本齐全" />
              <el-option label="不齐全" value="不齐全" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="文字材料" prop="textMaterial">
            <el-input v-model="form.textMaterial" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="图样" prop="drawing">
            <el-input v-model="form.drawing" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="照片" prop="photo">
            <el-input v-model="form.photo" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="备考表说明" prop="prepNote">
            <el-input v-model="form.prepNote" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer">
      <el-button size="small" type="primary" @click="onConfirm">确定</el-button>
      <el-button size="small" @click="dialogVisible = false">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
/** 表单默认值（新增时的初始值，与截图一致） */
const EMPTY_FORM = () => ({
  fondsNo: '0001',
  categoryNo: 'XM',
  title: '',
  archiveNo: '',
  mutualNo: '',
  unit: '绍兴市柯诸高速公路有限公司',
  startDate: '',
  endDate: '',
  verifyStart: '',
  verifyEnd: '',
  keepTerm: '永久',
  secretLevel: '',
  rollNo: '',
  year: String(new Date().getFullYear()),
  spineSpec: '',
  materialComplete: '齐全',
  textMaterial: '',
  drawing: '',
  photo: '',
  remark: '',
  prepNote: ''
})

export default {
  name: 'RollEditDialog',
  props: {
    visible: { type: Boolean, default: false },
    /** add=新增案卷 / edit=编辑案卷 */
    mode: { type: String, default: 'add' },
    /** 编辑时回填的案卷行数据 */
    rowData: { type: Object, default: null }
  },
  data() {
    return {
      form: EMPTY_FORM(),
      rules: {
        title: [{ required: true, message: '请输入案卷题名', trigger: 'blur' }],
        archiveNo: [{ required: true, message: '请输入档号', trigger: 'blur' }],
        unit: [{ required: true, message: '请输入编制单位', trigger: 'blur' }],
        keepTerm: [{ required: true, message: '请选择保管期限', trigger: 'change' }],
        rollNo: [{ required: true, message: '请输入案卷号', trigger: 'blur' }],
        materialComplete: [{ required: true, message: '请选择资料是否齐全', trigger: 'change' }]
      }
    }
  },
  computed: {
    /** visible 是 prop，不能直接被 .sync 改写；用 computed 中转，关闭时同步回父组件 */
    dialogVisible: {
      get() {
        return this.visible
      },
      set(v) {
        this.$emit('update:visible', v)
      }
    }
  },
  watch: {
    /** 弹窗每次打开：新增重置默认值，编辑回填所选行 */
    visible(v) {
      if (!v) return
      if (this.mode === 'edit' && this.rowData) {
        const base = EMPTY_FORM()
        Object.keys(base).forEach(k => {
          if (this.rowData[k] !== undefined && this.rowData[k] !== null) base[k] = this.rowData[k]
        })
        this.form = base
      } else {
        this.form = EMPTY_FORM()
      }
      this.$nextTick(() => this.$refs.editForm && this.$refs.editForm.clearValidate())
    }
  },
  methods: {
    onConfirm() {
      this.$refs.editForm.validate(valid => {
        if (!valid) return
        // 深拷贝交给父组件，避免表单与表格行互相影响
        this.$emit('confirm', JSON.parse(JSON.stringify(this.form)))
        this.dialogVisible = false
      })
    }
  }
}
</script>

<style lang="scss">
/* 案卷新增/编辑弹窗（append-to-body 需用全局样式） */
.roll-edit-dialog {
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
    padding: 14px 20px 4px;
    max-height: 65vh;
    overflow: auto;
  }

  .el-form-item {
    margin-bottom: 12px;
  }

  .w100 { width: 100%; }
}
</style>
