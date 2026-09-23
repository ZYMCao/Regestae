<template>
  <!-- 字典管理：左侧字典类型 + 右侧字典数据 -->
  <div class="app-container dict-container">
    <el-row :gutter="16">
      <!-- 左：字典类型 -->
      <el-col :span="10">
        <el-card shadow="never" header="字典类型">
          <div class="table-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" plain icon="el-icon-plus" size="small" v-permission="['system:dict:add']" @click="typeDialog = true">新增类型</el-button>
            </div>
          </div>
          <el-table v-loading="typeLoading" :data="typeList" border highlight-current-row @current-change="handleTypeSelect">
            <el-table-column label="字典名称" prop="dictName" min-width="120" />
            <el-table-column label="字典类型" prop="dictType" min-width="140" />
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="{ row }">
                <el-button size="mini" type="text" @click.stop="editType(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右：字典数据 -->
      <el-col :span="14">
        <el-card shadow="never" :header="`字典数据${currentType ? ' - ' + currentType.dictName : ''}`">
          <el-table v-loading="dataLoading" :data="dataList" border>
            <el-table-column label="标签" prop="label" />
            <el-table-column label="键值" prop="value" />
            <el-table-column label="排序" prop="sort" width="70" align="center" />
            <el-table-column label="标签样式" prop="tagType" width="100" align="center">
              <template slot-scope="{ row }">
                <el-tag v-if="row.tagType" :type="row.tagType" size="small">{{ row.label }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { listDictType, listDictDataByType } from '@/api/dict'

export default {
  name: 'SystemDict',
  data() {
    return {
      typeLoading: false,
      dataLoading: false,
      typeList: [],
      dataList: [],
      currentType: null,
      typeDialog: false
    }
  },
  created() {
    // this.getTypeList()
  },
  methods: {
    getTypeList() {
      this.typeLoading = true
      listDictType().then(res => {
        this.typeList = (res.data && res.data.list) || res.data || []
        if (this.typeList.length) this.handleTypeSelect(this.typeList[0])
      }).finally(() => { this.typeLoading = false })
    },
    /** 选中类型后加载右侧数据 */
    handleTypeSelect(row) {
      if (!row) return
      this.currentType = row
      this.dataLoading = true
      listDictDataByType(row.dictType).then(res => {
        this.dataList = res.data || []
      }).finally(() => { this.dataLoading = false })
    },
    editType(row) {
      // TODO: 编辑字典类型弹窗
      this.$message.info(`编辑：${row.dictName}`)
    }
  }
}
</script>
