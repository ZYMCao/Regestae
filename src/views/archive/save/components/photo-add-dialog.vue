<template>
  <!-- 新增照片六要素弹窗：左侧六要素表单（两张截图字段合并，滚动展示）+ 右侧照片上传区 -->
  <el-dialog
    title="新增照片六要素"
    :visible.sync="dialogVisible"
    width="980px"
    custom-class="photo-add-dialog"
    :close-on-click-modal="false"
    append-to-body
    @open="handleOpen"
  >
    <div class="add-body">
      <!-- 左侧表单 -->
      <div class="add-left">
        <el-form ref="addForm" :model="form" :rules="rules" label-width="90px" size="small">
          <el-form-item label="文件名称" prop="name">
            <el-input v-model="form.name" type="textarea" :rows="3" resize="vertical" />
          </el-form-item>
          <el-form-item label="文件编号" prop="code">
            <el-input v-model="form.code" />
          </el-form-item>
          <el-form-item label="编制日期" prop="date">
            <el-date-picker v-model="form.date" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="1" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="照片号" prop="photoNo">
            <el-input v-model="form.photoNo" />
          </el-form-item>
          <el-form-item label="参见号" prop="seeNo">
            <el-input v-model="form.seeNo" />
          </el-form-item>
          <el-form-item label="底片号" prop="negativeNo">
            <el-input v-model="form.negativeNo" />
          </el-form-item>
          <el-form-item label="人物" prop="person">
            <el-input v-model="form.person" />
          </el-form-item>
          <el-form-item label="拍摄时间" prop="shootTime">
            <el-date-picker v-model="form.shootTime" type="date" value-format="yyyy-MM-dd" style="width: 100%" />
          </el-form-item>
          <el-form-item label="地点" prop="place">
            <el-input v-model="form.place" />
          </el-form-item>
          <el-form-item label="摄影者" prop="photographer">
            <el-input v-model="form.photographer" />
          </el-form-item>
          <el-form-item label="文字说明" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" resize="vertical" />
          </el-form-item>
          <el-form-item label="背景" prop="background">
            <el-input v-model="form.background" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" resize="vertical" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧照片区 -->
      <div class="add-right">
        <div
          class="photo-upload-zone"
          :class="{ dragging }"
          @click="pickFile"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <img v-if="form.url" :src="form.url" class="zone-preview" alt="照片预览">
          <i v-else class="el-icon-plus zone-plus" />
        </div>
        <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onPickFile">
        <div v-if="form.url" class="remove-photo-row">
          <el-button size="mini" type="text" class="remove-photo-btn" @click.stop="removePhoto">移除照片</el-button>
        </div>
      </div>
    </div>
    <div slot="footer">
      <el-button type="primary" @click="submit">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
/** 本地日期 yyyy-MM-dd */
function formatDate(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 默认表单：编制日期默认当天，排序默认 1 */
function defaultForm() {
  return {
    name: '',
    code: '',
    date: formatDate(new Date()),
    sort: 1,
    photoNo: '',
    seeNo: '',
    negativeNo: '',
    person: '',
    shootTime: '',
    place: '',
    photographer: '',
    description: '',
    background: '',
    remark: '',
    url: ''
  }
}

export default {
  name: 'PhotoAddDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      form: defaultForm(),
      rules: {
        name: [{ required: true, message: '请输入文件名称', trigger: 'blur' }],
        date: [{ required: true, message: '请选择编制日期', trigger: 'change' }],
        sort: [{ required: true, message: '请输入排序号', trigger: 'blur' }],
        shootTime: [{ required: true, message: '请选择拍摄时间', trigger: 'change' }],
        photographer: [{ required: true, message: '请输入摄影者', trigger: 'blur' }],
        description: [{ required: true, message: '请输入文字说明', trigger: 'blur' }]
      },
      dragging: false
    }
  },
  computed: {
    /** visible prop 的代理：关闭时通知父组件更新，避免直接变异 prop */
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  methods: {
    /** 每次打开：重置表单并清除校验 */
    handleOpen() {
      this.form = defaultForm()
      this.dragging = false
      this.$nextTick(() => this.$refs.addForm && this.$refs.addForm.clearValidate())
    },

    pickFile() {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },

    onPickFile(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      this.setPhotoPreview(file)
      e.target.value = ''
    },

    onDrop(e) {
      this.dragging = false
      const file = e.dataTransfer.files && e.dataTransfer.files[0]
      if (!file) return
      if (!/^image\//.test(file.type)) return this.$message.warning('请拖入图片文件')
      this.setPhotoPreview(file)
    },

    setPhotoPreview(file) {
      const reader = new FileReader()
      reader.onload = evt => {
        this.form.url = evt.target.result
      }
      reader.readAsDataURL(file)
    },

    removePhoto() {
      this.form.url = ''
    },

    submit() {
      this.$refs.addForm.validate(valid => {
        if (!valid) return
        this.$emit('submit', { ...this.form })
        this.dialogVisible = false
      })
    }
  }
}
</script>

<style lang="scss">
/* 弹窗使用 append-to-body，需全局样式 */
.photo-add-dialog {
  .el-dialog__body {
    padding: 14px 20px;
  }

  .add-body {
    display: flex;
    gap: 16px;
  }

  .add-left {
    width: 320px;
    min-width: 320px;
    max-height: 420px;
    overflow: auto;
    padding-right: 4px;
  }

  .add-right {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .photo-upload-zone {
    flex: 1;
    min-height: 360px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fafafa;
    transition: border-color 0.2s, background 0.2s;

    &:hover,
    &.dragging {
      border-color: #409eff;
      background: #ecf5ff;
    }

    .zone-plus {
      font-size: 48px;
      color: #c0c4cc;
    }

    .zone-preview {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .remove-photo-row {
    text-align: right;
    padding-top: 6px;

    .remove-photo-btn {
      color: #f56c6c;
    }
  }
}
</style>
