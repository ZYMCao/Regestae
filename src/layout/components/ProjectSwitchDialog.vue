<template>
  <!--
    项目/单位切换弹窗（头部"切换"按钮触发）
    两种入口模式：
    - 建设档案：选择建设项目 → 联动加载合同段 → 选择合同段或双击项目行确认
    - 系统管理员：直接选择所属单位
    数据当前为本地模拟，后续对接后端接口时替换 MOCK_PROJECTS / MOCK_UNITS
  -->
  <el-dialog
    title=""
    :visible="visible"
    width="1200px"
    top="5vh"
    custom-class="project-switch-dialog"
    :close-on-click-modal="false"
    @update:visible="handleVisibleChange"
    @opened="handleOpened"
  >
    <!-- 切换入口 -->
    <div class="switch-entry">
      <span class="entry-label">切换入口：</span>
      <el-button
        size="small"
        class="entry-btn"
        :class="{ 'is-active': activeTab === 'build' }"
        @click="activeTab = 'build'"
      >建设档案</el-button>
      <el-button
        size="small"
        class="entry-btn"
        :class="{ 'is-active': activeTab === 'admin' }"
        @click="activeTab = 'admin'"
      >系统管理员</el-button>
    </div>

    <!-- ===== 建设档案模式：建设项目 + 合同段 ===== -->
    <template v-if="activeTab === 'build'">
      <!-- 建设项目 -->
      <div class="section-block">
        <div class="section-header">
          <span class="section-title">建设项目</span>
          <div class="section-tools">
            <el-input
              v-model.trim="projectKeyword"
              placeholder="输入建设项目名称"
              size="small"
              clearable
              class="section-search"
              @keyup.enter.native="handleSearchProject"
            />
            <el-button size="small" icon="el-icon-search" class="search-btn" @click="handleSearchProject" />
            <i
              class="collapse-icon el-icon-caret-bottom"
              :class="{ collapsed: !showProjectSection }"
              @click="showProjectSection = !showProjectSection"
            />
          </div>
        </div>
        <el-table
          v-show="showProjectSection"
          ref="projectTable"
          :data="filteredProjects"
          border
          height="240"
          highlight-current-row
          empty-text="暂无数据"
          class="section-table"
          @row-click="handleProjectRowClick"
          @row-dblclick="handleProjectDblClick"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="建设项目名称" sortable show-overflow-tooltip />
          <el-table-column prop="unit" label="建设单位" sortable show-overflow-tooltip />
          <el-table-column prop="code" label="项目编码" sortable width="140" show-overflow-tooltip />
          <el-table-column prop="startDate" label="开工时间" sortable width="120" align="center" />
          <el-table-column prop="handoverDate" label="交工时间" sortable width="120" align="center" />
          <el-table-column prop="completionDate" label="竣工时间" sortable width="120" align="center" />
        </el-table>
      </div>

      <!-- 合同段（随选中项目联动） -->
      <div class="section-block">
        <div class="section-header">
          <span class="section-title">合同段</span>
          <div class="section-tools">
            <el-input
              v-model.trim="contractKeyword"
              placeholder="输入合同段名称"
              size="small"
              clearable
              class="section-search"
              @keyup.enter.native="handleSearchContract"
            />
            <el-button size="small" icon="el-icon-search" class="search-btn" @click="handleSearchContract" />
            <i
              class="collapse-icon el-icon-caret-bottom"
              :class="{ collapsed: !showContractSection }"
              @click="showContractSection = !showContractSection"
            />
          </div>
        </div>
        <el-table
          v-show="showContractSection"
          :data="filteredContracts"
          border
          height="220"
          empty-text="暂无数据"
          class="section-table"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="type" label="合同类型" sortable width="150" />
          <el-table-column prop="name" label="合同段名称" sortable show-overflow-tooltip />
          <el-table-column prop="unitName" label="单位名称" sortable show-overflow-tooltip />
          <el-table-column prop="startDate" label="开始时间" sortable width="130" align="center" />
          <el-table-column prop="endDate" label="结束时间" sortable width="130" align="center" />
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="{ row }">
              <el-button type="text" @click="handleContractSelect(row)">选择</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ===== 系统管理员模式：所属单位 ===== -->
    <template v-else>
      <div class="section-block">
        <div class="section-header">
          <span class="section-title">所属单位</span>
          <div class="section-tools">
            <el-input
              v-model.trim="unitKeyword"
              placeholder="输入单位名称"
              size="small"
              clearable
              class="section-search"
              @keyup.enter.native="handleSearchUnit"
            />
            <el-button size="small" icon="el-icon-search" class="search-btn" @click="handleSearchUnit" />
            <i
              class="collapse-icon el-icon-caret-bottom"
              :class="{ collapsed: !showUnitSection }"
              @click="showUnitSection = !showUnitSection"
            />
          </div>
        </div>
        <el-table
          v-show="showUnitSection"
          :data="filteredUnits"
          border
          height="240"
          empty-text="暂无数据"
          class="section-table"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="单位名称" show-overflow-tooltip />
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="{ row }">
              <el-button type="text" @click="handleUnitSelect(row)">选择</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </el-dialog>
</template>

<script>
// 本地模拟数据：后续对接后端接口（建设项目/合同段/单位列表）时替换
const MOCK_PROJECTS = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    unit: '绍兴市柯诸高速公路有限公司',
    code: '',
    startDate: '2022-09-28',
    handoverDate: '',
    completionDate: '',
    contracts: []
  }
]

const MOCK_UNITS = [
  { id: 1, name: '绍兴市柯诸高速公路有限公司' }
]

export default {
  name: 'ProjectSwitchDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'build',        // 切换入口：build 建设档案 / admin 系统管理员
      projects: MOCK_PROJECTS,
      units: MOCK_UNITS,
      selectedProject: null,     // 当前选中的建设项目（联动合同段）
      // 搜索关键字：keyword 为输入框值，applied 为点搜索/回车后生效的值
      projectKeyword: '',
      appliedProjectKeyword: '',
      contractKeyword: '',
      appliedContractKeyword: '',
      unitKeyword: '',
      appliedUnitKeyword: '',
      // 分区折叠状态
      showProjectSection: true,
      showContractSection: true,
      showUnitSection: true
    }
  },
  computed: {
    filteredProjects() {
      const kw = this.appliedProjectKeyword
      return this.projects.filter(p => !kw || p.name.includes(kw))
    },
    filteredContracts() {
      const contracts = (this.selectedProject && this.selectedProject.contracts) || []
      const kw = this.appliedContractKeyword
      return contracts.filter(c => !kw || c.name.includes(kw))
    },
    filteredUnits() {
      const kw = this.appliedUnitKeyword
      return this.units.filter(u => !kw || u.name.includes(kw))
    }
  },
  methods: {
    // 转发 el-dialog 的 visible 同步事件
    handleVisibleChange(val) {
      this.$emit('update:visible', val)
    },

    // 每次打开：重置到建设档案入口，默认选中第一个项目（如有）
    handleOpened() {
      this.activeTab = 'build'
      this.selectedProject = this.projects[0] || null
      this.$nextTick(() => {
        if (this.$refs.projectTable && this.selectedProject) {
          this.$refs.projectTable.setCurrentRow(this.selectedProject)
        }
      })
    },

    handleSearchProject() {
      this.appliedProjectKeyword = this.projectKeyword
    },
    handleSearchContract() {
      this.appliedContractKeyword = this.contractKeyword
    },
    handleSearchUnit() {
      this.appliedUnitKeyword = this.unitKeyword
    },

    // 单击项目行：选中并联动合同段列表
    handleProjectRowClick(row) {
      this.selectedProject = row
      this.contractKeyword = ''
      this.appliedContractKeyword = ''
    },

    // 双击项目行：直接确认（不选合同段）
    handleProjectDblClick(row) {
      this.selectedProject = row
      this.confirmBuild(null)
    },

    // 选择合同段：连同所属项目一并确认
    handleContractSelect(row) {
      this.confirmBuild(row)
    },

    confirmBuild(contract) {
      this.$emit('confirm', { mode: 'build', project: this.selectedProject, contract })
      this.close()
    },

    handleUnitSelect(row) {
      this.$emit('confirm', { mode: 'admin', unit: row })
      this.close()
    },

    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
// 弹窗样式（custom-class 渲染在组件内部，深度选择器覆盖）
::v-deep .project-switch-dialog {
  max-width: 96%;

  .el-dialog__header {
    padding: 12px 20px 0;
  }

  .el-dialog__body {
    padding: 10px 20px 20px;
  }
}

// 顶部切换入口
.switch-entry {
  display: flex;
  align-items: center;
  margin-bottom: 14px;

  .entry-label {
    font-size: 14px;
    color: #303133;
  }

  .entry-btn {
    background: #fff;
    border-color: #dcdfe6;
    color: #303133;

    &.is-active {
      background: #2bb9a4;
      border-color: #2bb9a4;
      color: #fff;
    }
  }
}

// 蓝色分区（标题栏 + 搜索 + 折叠）
.section-block {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 10px;
  background: #3d8bfa;
  border-radius: 2px;

  .section-title {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
  }

  .section-tools {
    display: flex;
    align-items: center;
  }

  .section-search {
    width: 180px;
  }

  .search-btn {
    margin-left: 6px;
    padding: 7px 9px;
    background: #2e6fd8;
    border-color: #2e6fd8;
    color: #fff;

    &:hover,
    &:focus {
      background: #4a82e0;
      border-color: #4a82e0;
      color: #fff;
    }
  }

  .collapse-icon {
    margin-left: 12px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s;

    // 折叠时箭头转为向右
    &.collapsed {
      transform: rotate(-90deg);
    }
  }
}
</style>
