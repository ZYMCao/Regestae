<template>
  <!-- 档案库管理：左分类树 + 右案卷目录（静态演示数据，不请求接口） -->
  <div class="save-page">
    <!-- 左侧：档案分类目录 -->
    <div class="left-panel">
      <div class="search-row">
        <el-input
          v-model="treeKeyword"
          placeholder="搜索分类"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        />
        <el-button class="search-btn" size="small" icon="el-icon-search" @click="filterTree" />
      </div>
      <div class="mode-tabs">
        <div :class="['mode-tab', manageMode === 'roll' && 'active']" @click="switchMode('roll')">按卷管理分类</div>
        <div :class="['mode-tab', manageMode === 'file' && 'active']" @click="switchMode('file')">按件管理分类</div>
      </div>
      <div class="tree-title">档案分类目录</div>
      <div class="left-tree-wrap">
        <el-tree
          ref="categoryTree"
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :default-expanded-keys="[1, 11]"
          highlight-current
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i v-if="data.children && data.children.length" class="tree-icon folder el-icon-folder-opened" />
            <i v-else class="tree-icon leaf el-icon-document" />
            <span class="tree-label">{{ data.name }}</span>
            <span v-if="data.fileCount !== undefined" class="tree-count">({{ data.rollCount || 0 }}/{{ data.fileCount }})</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧：按件管理分类视图 / 案卷目录 / 案卷详情视图 -->
    <div class="right-panel">
      <!-- 按件管理分类：文件目录 + 文件 -->
      <file-manage-view v-if="manageMode === 'file'" :breadcrumb="breadcrumb" />

      <template v-else-if="detailRoll == null">
      <!-- 面包屑 -->
      <div class="breadcrumb-bar">
        <i class="el-icon-collection breadcrumb-icon" />
        <template v-for="(crumb, idx) in breadcrumb">
          <span v-if="idx > 0" :key="'sep' + crumb.id" class="crumb-sep">&gt;</span>
          <a :key="crumb.id" :class="['crumb-item', idx === breadcrumb.length - 1 && 'last']" @click="locateNode(crumb)">{{ crumb.name }}</a>
        </template>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <span class="table-title">{{ tableTitle }}</span>
        <el-checkbox v-model="includeChildren" class="include-check">包含子节点</el-checkbox>
        <el-select v-model="searchField" size="small" class="field-select">
          <el-option label="案卷题名" value="title" />
          <el-option label="档号" value="archiveNo" />
          <el-option label="编制单位" value="orgName" />
        </el-select>
        <el-input v-model="keyword" size="small" class="keyword-input" clearable @keyup.enter.native="handleSearch" />
        <el-button size="small" icon="el-icon-search" @click="handleSearch" />
        <adaptive-actions :items="toolbarActions" size="small" @click="onToolbarAction" />
      </div>

      <!-- 案卷列表 -->
      <div class="table-wrap">
        <el-table :data="rolls" border stripe height="100%" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column label="序号" type="index" width="55" align="center" />
          <el-table-column label="档号" prop="archiveNo" sortable width="130" align="center" />
          <el-table-column label="案卷题名" prop="title" sortable min-width="280" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <a class="title-link" @click="handleDetailRow(row)">{{ row.title }}</a>
            </template>
          </el-table-column>
          <el-table-column label="编制单位" prop="orgName" min-width="200" show-overflow-tooltip />
          <el-table-column label="编制起日期" prop="startDate" sortable width="110" align="center" />
          <el-table-column label="编制止日期" prop="endDate" sortable width="110" align="center" />
          <el-table-column label="考证起日期" prop="checkStartDate" width="105" align="center" />
          <el-table-column label="考证止日期" prop="checkEndDate" width="105" align="center" />
          <el-table-column label="组卷情况" prop="rollStatus" sortable width="100" align="center">
            <template slot-scope="{ row }">
              <span class="status-ok">{{ row.rollStatus }}</span>
            </template>
          </el-table-column>
          <el-table-column label="保管期限" prop="period" width="90" align="center" />
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="rolls.length"
          :current-page.sync="pageNum"
          :page-size.sync="pageSize"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
      </template>

      <!-- 案卷详情视图：卷内目录 + 文件 -->
      <roll-detail-view
        v-else
        :roll="detailRoll"
        :breadcrumb="breadcrumb"
        @back="detailRoll = null"
      />
    </div>

    <!-- ========== 案卷搜索弹窗 ========== -->
    <el-dialog
      :title="rollSearchTitle"
      :visible.sync="rollSearchVisible"
      width="85%"
      top="6vh"
      custom-class="roll-search-dialog"
      :close-on-click-modal="false"
    >
      <div class="search-body">
        <!-- 左侧：搜索条件 -->
        <div class="search-side">
          <el-form :model="rollSearchForm" label-position="top" size="small" class="search-form">
            <el-form-item label="案卷题名"><el-input v-model="rollSearchForm.title" /></el-form-item>
            <el-form-item label="档号"><el-input v-model="rollSearchForm.archiveNo" /></el-form-item>
            <el-form-item label="附件总数"><el-input v-model="rollSearchForm.attachCount" /></el-form-item>
            <el-form-item label="编制单位"><el-input v-model="rollSearchForm.orgName" /></el-form-item>
            <el-form-item label="编制起日期">
              <el-date-picker v-model="rollSearchForm.startDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%" />
            </el-form-item>
            <el-form-item label="编制止日期">
              <el-date-picker v-model="rollSearchForm.endDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%" />
            </el-form-item>
            <el-form-item label="保管期限">
              <el-select v-model="rollSearchForm.period" style="width: 100%">
                <el-option label="永久" value="永久" />
                <el-option label="定期30年" value="定期30年" />
                <el-option label="定期10年" value="定期10年" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-btns">
            <el-button type="primary" size="small" @click="doRollSearch">搜索</el-button>
            <el-button type="primary" size="small" @click="resetRollSearch">重置</el-button>
          </div>
        </div>

        <!-- 右侧：搜索结果 -->
        <div class="search-main">
          <div class="selected-bar">{{ rollSearchSummary }}</div>
          <el-table
            :data="pagedRollSearchRows"
            row-key="id"
            border
            stripe
            size="small"
            height="100%"
            empty-text="暂无数据"
            @selection-change="onRollSearchSelectionChange"
          >
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column label="序号" width="55" align="center">
              <template slot-scope="scope">{{ rollSearchPageStart + scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="所在分类节点路径" prop="nodePath" min-width="250" align="center" show-overflow-tooltip />
            <el-table-column label="档号" prop="archiveNo" width="130" align="center" sortable />
            <el-table-column label="案卷题名" prop="title" min-width="280" align="center" show-overflow-tooltip sortable />
            <el-table-column label="编制单位" prop="orgName" min-width="180" align="center" show-overflow-tooltip sortable />
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="filteredRollSearchRows.length"
              :current-page.sync="rollSearchPage"
              :page-size.sync="rollSearchPageSize"
              :page-sizes="[10, 50, 100]"
            />
          </div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>

    <!-- ========== 文件搜索弹窗 ========== -->
    <el-dialog
      :title="fileSearchTitle"
      :visible.sync="fileSearchVisible"
      width="95%"
      top="3vh"
      custom-class="file-search-dialog"
      :close-on-click-modal="false"
    >
      <div class="search-body">
        <!-- 左侧：搜索条件 -->
        <div class="search-side">
          <el-form :model="fileSearchForm" label-position="top" size="small" class="search-form">
            <el-form-item label="文件题名"><el-input v-model="fileSearchForm.title" /></el-form-item>
            <el-form-item label="责任者"><el-input v-model="fileSearchForm.responsible" /></el-form-item>
            <el-form-item label="档号"><el-input v-model="fileSearchForm.archiveNo" /></el-form-item>
            <el-form-item label="文号"><el-input v-model="fileSearchForm.docNo" /></el-form-item>
            <el-checkbox v-model="fileSearchIncludeChildren" class="include-check">包含子节点目录</el-checkbox>
          </el-form>
          <div class="search-btns">
            <el-button type="primary" size="small" @click="doFileSearch">搜索</el-button>
            <el-button type="primary" size="small" @click="resetFileSearch">重置</el-button>
          </div>
        </div>

        <!-- 右侧：卷内目录 + 文件 -->
        <div class="search-main">
          <div class="roll-part">
            <div class="section-header">卷内目录</div>
            <el-table
              :data="pagedFileSearchRolls"
              row-key="id"
              border
              stripe
              size="small"
              height="100%"
              empty-text="暂无数据"
              @selection-change="onFileSearchSelectionChange"
            >
              <el-table-column type="selection" width="40" align="center" />
              <el-table-column label="序号" width="55" align="center">
                <template slot-scope="scope">{{ fileSearchPageStart + scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column label="文件题名" prop="title" min-width="260" align="center" show-overflow-tooltip sortable />
              <el-table-column label="所在分类节点路径" prop="nodePath" min-width="140" align="center" show-overflow-tooltip />
              <el-table-column label="文号" prop="docNo" width="150" align="center" show-overflow-tooltip sortable />
              <el-table-column label="编制日期" prop="createDate" width="100" align="center" sortable />
              <el-table-column label="责任者" prop="responsible" min-width="170" align="center" show-overflow-tooltip sortable />
              <el-table-column label="件数" prop="pieceNo" width="70" align="center" sortable />
              <el-table-column label="页数" prop="pages" width="80" align="center" sortable />
              <el-table-column label="参考信息" prop="refInfo" width="100" align="center" />
              <el-table-column label="文件数" prop="fileCount" width="80" align="center" sortable />
            </el-table>
            <div class="pagination-wrap">
              <el-pagination
                background
                layout="total, prev, pager, next, jumper, sizes"
                :total="filteredFileSearchRolls.length"
                :current-page.sync="fileSearchPage"
                :page-size.sync="fileSearchPageSize"
                :page-sizes="[10, 50, 100]"
              />
            </div>
          </div>

          <div class="file-part">
            <div class="section-header">文件</div>
            <el-table
              :data="fileSearchFiles"
              row-key="id"
              border
              stripe
              size="small"
              height="100%"
              empty-text="暂无数据"
            >
              <el-table-column type="selection" width="40" align="center" />
              <el-table-column label="序号" type="index" width="55" align="center" />
              <el-table-column label="文件名称" prop="name" min-width="200" align="center" show-overflow-tooltip sortable />
              <el-table-column label="文件编号" prop="fileNo" width="120" align="center" sortable />
              <el-table-column label="编制日期" prop="createDate" width="100" align="center" sortable />
              <el-table-column label="考证日期" prop="checkDate" width="100" align="center" />
              <el-table-column label="页数" prop="pages" width="70" align="center" sortable />
              <el-table-column label="排序" prop="sortNo" width="70" align="center" sortable />
              <el-table-column label="档案类型" prop="archiveType" width="100" align="center" sortable />
              <el-table-column label="文件状态" prop="fileStatus" width="90" align="center" sortable />
              <el-table-column label="格式信息" prop="formatInfo" width="90" align="center" sortable />
              <el-table-column label="计算机文件名" prop="computerName" width="130" align="center" show-overflow-tooltip sortable />
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="{ row }">
                  <el-link type="primary" :underline="false" class="op-link" @click="viewSearchFile(row)">查看</el-link>
                  <el-link type="primary" :underline="false" class="op-link" @click="downloadSearchFile(row)">下载</el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>

    <!-- 查看案卷电子签名情况：签名信息列表弹窗（图一） -->
    <esign-list-dialog :visible.sync="esignListVisible" @detail="openEsignDetail" />

    <!-- 签名人详细信息弹窗（图二） -->
    <esign-detail-dialog :visible.sync="esignDetailVisible" :detail="esignDetail" />

    <!-- ========== 四性检测弹窗 ========== -->
    <el-dialog
      title="四性检测"
      :visible.sync="checkDialogVisible"
      width="640px"
      custom-class="four-check-dialog"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px" size="small" class="check-form">
        <el-form-item label="检测方案">
          <el-radio-group v-model="checkForm.scheme">
            <div v-for="item in checkSchemes" :key="item.value" class="scheme-item">
              <el-radio :label="item.value">{{ item.label }}</el-radio>
              <el-link type="primary" :underline="false" class="scheme-link" @click="viewSchemeDetail(item)">[详情]</el-link>
            </div>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检测说明">
          <el-input v-model="checkForm.remark" type="textarea" :rows="3" placeholder="" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="confirmCheck">确定</el-button>
        <el-button size="small" @click="checkDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 案卷详细信息弹窗 ========== -->
    <el-dialog
      title="详细信息"
      :visible.sync="rollDetailVisible"
      width="860px"
      custom-class="roll-detail-dialog"
      :close-on-click-modal="false"
    >
      <div class="detail-table">
        <div v-for="field in rollDetailFields" :key="field.prop" class="detail-row">
          <div class="detail-label">{{ field.label }}</div>
          <div class="detail-value">
            <span v-if="field.prop === 'rollStatus' && rollDetailData.rollStatus === '组卷成功'" class="text-success">{{ rollDetailData[field.prop] }}</span>
            <span v-else-if="field.prop === 'auditStatus' && rollDetailData.auditStatus === '已归档'" class="text-success">{{ rollDetailData[field.prop] }}</span>
            <span v-else-if="field.prop === 'fourCheck' && rollDetailData.fourCheck === '通过'" class="text-success">{{ rollDetailData[field.prop] }}</span>
            <span v-else>{{ rollDetailData[field.prop] }}</span>
          </div>
        </div>
      </div>
      <template slot="footer"><span /></template>
    </el-dialog>
  </div>
</template>

<script>
import EsignListDialog from './components/esign-list-dialog.vue'
import EsignDetailDialog from './components/esign-detail-dialog.vue'
import RollDetailView from './components/roll-detail-view.vue'
import FileManageView from './components/file-manage-view.vue'
import AdaptiveActions from '@/components/AdaptiveActions'

// 档案分类树（静态演示数据：柯桥至诸暨高速公路工程）
const TREE_DATA = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    rollCount: 0,
    fileCount: 15432,
    children: [
      {
        id: 11,
        name: '第一部分 项目申报文件',
        rollCount: 0,
        fileCount: 28,
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件' },
          { id: 112, name: '二、可行性研究报告及批复文件' },
          { id: 113, name: '三、环境影响报告及批复文件' },
          { id: 114, name: '四、水土保持方案报告及批复文件' },
          { id: 115, name: '五、项目咨询、评估、论证文件' },
          { id: 116, name: '六、投资、特许经营协议文件' },
          { id: 117, name: '七、工程融资贷款计划、资金管理文件' }
        ]
      },
      {
        id: 12,
        name: '第二部分 设计文件',
        rollCount: 0,
        fileCount: 112,
        children: [
          { id: 121, name: '一、初步设计文件' },
          { id: 122, name: '二、施工图设计文件' }
        ]
      },
      {
        id: 13,
        name: '第三部分 工程管理文件',
        rollCount: 0,
        fileCount: 590,
        children: [
          { id: 131, name: '一、征地拆迁文件' },
          { id: 132, name: '二、建设管理文件' }
        ]
      },
      {
        id: 14,
        name: '第四部分 竣工文件',
        rollCount: 0,
        fileCount: 11500,
        children: [
          { id: 141, name: '一、路基竣工图' },
          { id: 142, name: '二、路面竣工图' }
        ]
      },
      {
        id: 15,
        name: '第五部分 监理文件',
        rollCount: 0,
        fileCount: 2828,
        children: [
          { id: 151, name: '一、监理管理文件' },
          { id: 152, name: '二、监理日志' }
        ]
      },
      {
        id: 16,
        name: '第六部分 竣工（交）工验收文件',
        rollCount: 0,
        fileCount: 866,
        children: [
          { id: 161, name: '一、交工验收文件' },
          { id: 162, name: '二、竣工验收文件' }
        ]
      },
      {
        id: 17,
        name: '第七部分 科研文件',
        rollCount: 0,
        fileCount: 6,
        children: [
          { id: 171, name: '一、科研课题文件' }
        ]
      }
    ]
  }
]

// 案卷目录（静态演示数据）
const ROLL_LIST = [
  {
    id: 1,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0001',
    title: '柯桥至诸暨高速公路工程项目建议书及批复、项目申请有关文件',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2020-05-18',
    endDate: '2021-05-11',
    checkStartDate: '',
    checkEndDate: '',
    rollStatus: '组卷成功',
    period: '永久'
  },
  {
    id: 2,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0002',
    title: '柯桥至诸暨高速公路工程项目申请报告及批复文件',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2021-10-01',
    endDate: '2021-11-26',
    checkStartDate: '2021-10-01',
    checkEndDate: '2021-11-26',
    rollStatus: '组卷成功',
    period: '永久'
  },
  {
    id: 3,
    categoryId: 111,
    archiveNo: 'KZGS-Z-0003',
    title: '柯桥至诸暨高速公路工程项目申请报告（附图）',
    orgName: '绍兴市柯诸高速公路有限公司',
    startDate: '2021-10-01',
    endDate: '2021-10-01',
    checkStartDate: '2021-10-01',
    checkEndDate: '2021-10-01',
    rollStatus: '组卷成功',
    period: '永久'
  }
]

/** 案卷搜索弹窗结果 mock（与截图一致：3 条可行性研究报告案卷） */
const ROLL_SEARCH_ROWS = [
  { id: 1, nodePath: '柯桥至诸暨高速公路工程 -> 第一部分 项目申报文件', archiveNo: 'KZGS-Z-0004', title: '柯桥至诸暨高速公路工程可行性研究报告及批...', orgName: '绍兴市' },
  { id: 2, nodePath: '柯桥至诸暨高速公路工程 -> 第一部分 项目申报文件', archiveNo: 'KZGS-Z-0005', title: '柯桥至诸暨高速公路工程可行性研究报告（报...', orgName: '绍兴市' },
  { id: 3, nodePath: '柯桥至诸暨高速公路工程 -> 第一部分 项目申报文件', archiveNo: 'KZGS-Z-0006', title: '柯桥至诸暨高速公路工程工程可行性研究报...', orgName: '绍兴市' }
]

/** 文件搜索弹窗：卷内目录 mock（与截图一致：14 条中的 9 条代表性数据） */
const FILE_SEARCH_ROLLS = [
  { id: 1, title: '省发展改革委关于核准柯桥至诸暨高速公路...', nodePath: '', docNo: '浙发改项字〔2...', createDate: '2021-11-26', responsible: '浙江省发展和改革委员会', pieceNo: 1, pages: 4, refInfo: '', fileCount: 1 },
  { id: 2, title: '绍兴市发展和改革委员会关于要求核准柯桥...', nodePath: '', docNo: '绍市发改综〔2...', createDate: '2021-10-25', responsible: '绍兴市发展和改革委', pieceNo: 2, pages: 4, refInfo: '', fileCount: 1 },
  { id: 3, title: '省交通运输厅关于重新报送柯桥至诸暨高速...', nodePath: '', docNo: '浙交函〔2021...', createDate: '2021-11-15', responsible: '浙江省交通运输厅', pieceNo: 3, pages: 10, refInfo: '', fileCount: 1 },
  { id: 4, title: '柯诸高速公路项目申请报告', nodePath: '', docNo: '', createDate: '2021-10-01', responsible: '绍兴市柯诸高速公路有限公司', pieceNo: 4, pages: 581, refInfo: '', fileCount: 1 },
  { id: 5, title: '柯桥至诸暨高速公路项目申请报告（附图）', nodePath: '', docNo: '', createDate: '2021-10-01', responsible: '绍兴市柯诸高速公路有限公司', pieceNo: 1, pages: 337, refInfo: '', fileCount: 1 },
  { id: 6, title: '关于要求对柯桥至诸暨高速公路工程可行性...', nodePath: '', docNo: '绍市建〔20...', createDate: '2020-03-03', responsible: '绍兴市交通建设有限公司', pieceNo: 1, pages: 2, refInfo: '', fileCount: 1 },
  { id: 7, title: '柯桥至诸暨高速公路工程可行性研究报告（...', nodePath: '', docNo: '', createDate: '2020-08-01', responsible: '浙江省交通规划设计研究...', pieceNo: 1, pages: 415, refInfo: '', fileCount: 1 },
  { id: 8, title: '关于要求组织柯桥至诸暨高速公路工程可行...', nodePath: '', docNo: '绍市建〔20...', createDate: '2020-03-11', responsible: '绍兴市交通建设有限公司', pieceNo: 2, pages: 4, refInfo: '', fileCount: 1 },
  { id: 9, title: '柯桥至诸暨高速公路工程可行性研究报...', nodePath: '', docNo: '', createDate: '2021-08-01', responsible: '浙江省交通规划设计研究...', pieceNo: 1, pages: 335, refInfo: '', fileCount: 1 }
]

/** 四性检测：检测方案选项 */
const CHECK_SCHEMES = [
  { value: 'guiDang', label: '【项目档案】归档环节' },
  { value: 'baoCun', label: '【项目档案】长期保存环节' },
  { value: 'yiJiao', label: '【项目档案】移交与接收环节' }
]

/** 案卷详细信息弹窗字段（与截图一致：23 行，前段基础信息 + 后段管理信息） */
const ROLL_DETAIL_FIELDS = [
  { prop: 'archiveNo', label: '档号' },
  { prop: 'title', label: '案卷题名' },
  { prop: 'orgName', label: '编制单位' },
  { prop: 'startDate', label: '编制起日期' },
  { prop: 'endDate', label: '编制止日期' },
  { prop: 'checkStartDate', label: '考证起日期' },
  { prop: 'checkEndDate', label: '考证止日期' },
  { prop: 'rollStatus', label: '组卷情况' },
  { prop: 'period', label: '保管期限' },
  { prop: 'secretLevel', label: '密级' },
  { prop: 'pieceCount', label: '件数' },
  { prop: 'pages', label: '页数' },
  { prop: 'pdfSize', label: '案卷PDF大小' },
  { prop: 'attachCount', label: '附件总数' },
  { prop: 'spineSpec', label: '脊背规格' },
  { prop: 'archiveType', label: '档案类型' },
  { prop: 'auditStatus', label: '审核情况' },
  { prop: 'fourCheck', label: '四性检验情况' },
  { prop: 'transferStatus', label: '移交情况' },
  { prop: 'openFlag', label: '是否开放' },
  { prop: 'mutualNo', label: '互见号' },
  { prop: 'textMaterial', label: '文字材料' },
  { prop: 'graphics', label: '图样' },
  { prop: 'photos', label: '照片' },
  { prop: 'formStatus', label: '表格状态' },
  { prop: 'remark', label: '备注' },
  { prop: 'addPerson', label: '增加人' },
  { prop: 'addTime', label: '增加时间' },
  { prop: 'editPerson', label: '修改人' },
  { prop: 'editTime', label: '修改时间' },
  { prop: 'nodePath', label: '所在分类节点路径' }
]

export default {
  name: 'ArchiveSave',
  components: { EsignListDialog, EsignDetailDialog, RollDetailView, FileManageView, AdaptiveActions },
  data() {
    return {
      manageMode: 'roll', // roll-按卷管理分类 / file-按件管理分类
      treeKeyword: '',
      treeData: JSON.parse(JSON.stringify(TREE_DATA)),
      currentNodeId: 111,
      includeChildren: true,
      searchField: 'title',
      keyword: '',
      appliedKeyword: '',
      selection: [],
      pageNum: 1,
      pageSize: 100,
      rollList: JSON.parse(JSON.stringify(ROLL_LIST)),

      // 案卷搜索弹窗
      rollSearchVisible: false,
      rollSearchForm: { title: '', archiveNo: '', attachCount: '', orgName: '', startDate: '', endDate: '', period: '' },
      rollSearchApplied: {},
      rollSearchRows: JSON.parse(JSON.stringify(ROLL_SEARCH_ROWS)),
      rollSearchSelection: [],
      rollSearchPage: 1,
      rollSearchPageSize: 100,

      // 文件搜索弹窗
      fileSearchVisible: false,
      fileSearchForm: { title: '', responsible: '', archiveNo: '', docNo: '' },
      fileSearchApplied: {},
      fileSearchIncludeChildren: true,
      fileSearchRolls: JSON.parse(JSON.stringify(FILE_SEARCH_ROLLS)),
      fileSearchFiles: [],
      fileSearchSelection: [],
      fileSearchPage: 1,
      fileSearchPageSize: 100,

      // 案卷电子签名弹窗
      esignListVisible: false,
      esignDetailVisible: false,
      esignDetail: {},

      // 四性检测弹窗
      checkDialogVisible: false,
      checkSchemes: CHECK_SCHEMES,
      checkForm: { scheme: 'guiDang', remark: '' },

      // 案卷详细信息弹窗
      rollDetailVisible: false,
      rollDetailFields: ROLL_DETAIL_FIELDS,
      rollDetailData: {},

      // 案卷详情视图（卷内目录 + 文件）
      detailRoll: null
    }
  },
  computed: {
    tableTitle() {
      return this.manageMode === 'roll' ? '案卷目录' : '文件目录'
    },
    /** 当前节点名称 */
    currentNodeName() {
      const crumbs = this.breadcrumb
      return crumbs.length ? crumbs[crumbs.length - 1].name : ''
    },
    /** 面包屑：当前节点的祖先链 */
    breadcrumb() {
      const path = []
      const walk = (nodes) => {
        for (const node of nodes) {
          path.push(node)
          if (node.id === this.currentNodeId) return true
          if (node.children && walk(node.children)) return true
          path.pop()
        }
        return false
      }
      walk(this.treeData)
      return path
    },
    /** 当前展示的案卷列表 */
    rolls() {
      let list
      if (this.includeChildren) {
        const ids = [this.currentNodeId, ...this.collectChildIds(this.currentNodeId)]
        list = this.rollList.filter(r => ids.indexOf(r.categoryId) > -1)
      } else {
        list = this.rollList.filter(r => r.categoryId === this.currentNodeId)
      }
      if (this.appliedKeyword && this.appliedKeyword.trim()) {
        const kw = this.appliedKeyword.trim()
        list = list.filter(r => (r[this.searchField] || '').indexOf(kw) > -1)
      }
      return list
    },
    /** 案卷搜索弹窗标题：当前节点名 */
    rollSearchTitle() {
      return `在【${this.currentNodeName}】及其子节点进行案卷搜索`
    },
    /** 文件搜索弹窗标题 */
    fileSearchTitle() {
      return `在【${this.currentNodeName}】及其子节点下进行文件搜索`
    },
    /** 案卷搜索：按左侧条件过滤后的结果 */
    filteredRollSearchRows() {
      const f = this.rollSearchApplied
      return this.rollSearchRows.filter(r => {
        if (f.title && (r.title || '').indexOf(f.title) === -1) return false
        if (f.archiveNo && (r.archiveNo || '').indexOf(f.archiveNo) === -1) return false
        if (f.orgName && (r.orgName || '').indexOf(f.orgName) === -1) return false
        if (f.period && r.period !== f.period) return false
        return true
      })
    },
    pagedRollSearchRows() {
      const start = (this.rollSearchPage - 1) * this.rollSearchPageSize
      return this.filteredRollSearchRows.slice(start, start + this.rollSearchPageSize)
    },
    rollSearchPageStart() {
      return (this.rollSearchPage - 1) * this.rollSearchPageSize
    },
    /** 案卷搜索：选中信息摘要 */
    rollSearchSummary() {
      const rolls = this.rollSearchSelection.length
      return `选中信息：案卷：${rolls} 卷，件数：0 件，页数：0 页`
    },
    /** 文件搜索：卷内目录过滤结果 */
    filteredFileSearchRolls() {
      const f = this.fileSearchApplied
      return this.fileSearchRolls.filter(r => {
        if (f.title && (r.title || '').indexOf(f.title) === -1) return false
        if (f.responsible && (r.responsible || '').indexOf(f.responsible) === -1) return false
        if (f.archiveNo && (r.archiveNo || '').indexOf(f.archiveNo) === -1) return false
        if (f.docNo && (r.docNo || '').indexOf(f.docNo) === -1) return false
        return true
      })
    },
    pagedFileSearchRolls() {
      const start = (this.fileSearchPage - 1) * this.fileSearchPageSize
      return this.filteredFileSearchRolls.slice(start, start + this.fileSearchPageSize)
    },
    fileSearchPageStart() {
      return (this.fileSearchPage - 1) * this.fileSearchPageSize
    },
    /** 工具栏按钮（AdaptiveActions 配置，type 对应原按钮颜色） */
    toolbarActions() {
      const single = this.selection.length === 1
      return [
        { key: 'rollSearch', label: '案卷搜索', icon: 'el-icon-search' },
        { key: 'fileSearch', label: '文件搜索', icon: 'el-icon-document' },
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh', type: 'success' },
        { key: 'esign', label: '查看案卷电子签名情况', icon: 'el-icon-stamp', disabled: !single },
        { key: 'viewPdf', label: '查看案卷PDF', icon: 'el-icon-tickets', disabled: !single },
        { key: 'check', label: '四性校验', icon: 'el-icon-finished' },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-view', disabled: !single },
        {
          key: 'print', label: '打印', icon: 'el-icon-printer',
          children: [
            { key: 'printRoll', label: '打印案卷目录' },
            { key: 'printFile', label: '打印文件目录' },
            { key: 'printCover', label: '打印案卷封面' },
            { key: 'printSpine', label: '打印档案脊背' }
          ]
        },
        {
          key: 'export', label: '导出', icon: 'el-icon-download', type: 'success',
          children: [
            { key: 'exportExcel', label: '导出Excel' },
            { key: 'exportPdf', label: '导出PDF' }
          ]
        },
        { key: 'backUnarchived', label: '重定为未归档', icon: 'el-icon-undo', type: 'primary' }
      ]
    }
  },
  watch: {
    treeKeyword(val) {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(val)
    }
  },
  methods: {
    /** 收集某节点全部后代 id */
    collectChildIds(id) {
      const ids = []
      const walk = (nodes) => {
        for (const node of nodes) {
          if (node.children && node.children.length) {
            ids.push(node.id)
            walk(node.children)
          }
        }
      }
      const find = (nodes) => {
        for (const node of nodes) {
          if (node.id === id) {
            walk(node.children || [])
            return true
          }
          if (node.children && find(node.children)) return true
        }
        return false
      }
      find(this.treeData)
      return ids
    },

    /** 树节点过滤 */
    filterNode(value, data) {
      if (!value) return true
      return data.name.indexOf(value) > -1
    },

    filterTree() {
      this.$refs.categoryTree && this.$refs.categoryTree.filter(this.treeKeyword)
    },

    /** 切换按卷/按件管理 */
    switchMode(mode) {
      if (this.manageMode === mode) return
      this.manageMode = mode
    },

    /** 点击树节点 */
    handleNodeClick(data) {
      this.currentNodeId = data.id
      this.pageNum = 1
    },

    /** 面包屑定位 */
    locateNode(crumb) {
      this.currentNodeId = crumb.id
      this.$nextTick(() => {
        this.$refs.categoryTree.setCurrentKey(crumb.id)
      })
    },

    onSelectionChange(selection) {
      this.selection = selection
    },

    handleSearch() {
      this.appliedKeyword = this.keyword
      this.pageNum = 1
    },

    /** 工具栏按钮统一分发（含打印/导出子菜单项） */
    onToolbarAction(item) {
      const handlers = {
        rollSearch: () => this.handleRollSearch(),
        fileSearch: () => this.handleFileSearch(),
        refresh: () => this.handleRefresh(),
        esign: () => this.handleEsign(),
        viewPdf: () => this.handleViewPdf(),
        check: () => this.handleCheck(),
        detail: () => this.handleDetail(),
        printRoll: () => this.handlePrint('roll'),
        printFile: () => this.handlePrint('file'),
        printCover: () => this.handlePrint('cover'),
        printSpine: () => this.handlePrint('spine'),
        exportExcel: () => this.handleExport('excel'),
        exportPdf: () => this.handleExport('pdf'),
        backUnarchived: () => this.handleBackUnarchived()
      }
      const handler = handlers[item.key]
      if (handler) handler()
    },

    /** 案卷搜索弹窗 */
    handleRollSearch() {
      this.rollSearchApplied = { ...this.rollSearchForm }
      this.rollSearchSelection = []
      this.rollSearchPage = 1
      this.rollSearchVisible = true
    },
    doRollSearch() {
      this.rollSearchApplied = { ...this.rollSearchForm }
      this.rollSearchPage = 1
    },
    resetRollSearch() {
      this.rollSearchForm = { title: '', archiveNo: '', attachCount: '', orgName: '', startDate: '', endDate: '', period: '' }
      this.rollSearchApplied = {}
      this.rollSearchPage = 1
    },
    onRollSearchSelectionChange(selection) {
      this.rollSearchSelection = selection || []
    },

    /** 文件搜索弹窗 */
    handleFileSearch() {
      this.fileSearchApplied = { ...this.fileSearchForm }
      this.fileSearchSelection = []
      this.fileSearchPage = 1
      this.fileSearchVisible = true
    },
    doFileSearch() {
      this.fileSearchApplied = { ...this.fileSearchForm }
      this.fileSearchPage = 1
    },
    resetFileSearch() {
      this.fileSearchForm = { title: '', responsible: '', archiveNo: '', docNo: '' }
      this.fileSearchApplied = {}
      this.fileSearchPage = 1
    },
    onFileSearchSelectionChange(selection) {
      this.fileSearchSelection = selection || []
    },
    /** 文件区操作 */
    viewSearchFile(row) {
      this.$message.info(`查看文件：${row.name}`)
    },
    downloadSearchFile(row) {
      this.$message.success(`下载文件：${row.name}`)
    },

    handleRefresh() {
      this.keyword = ''
      this.appliedKeyword = ''
      this.rollList = JSON.parse(JSON.stringify(ROLL_LIST))
      this.$message.success('刷新成功')
    },

    /** 查看案卷电子签名情况：仅选中一条时可操作 */
    handleEsign() {
      if (this.selection.length !== 1) return this.$message.warning('请先勾选一条案卷')
      this.esignListVisible = true
    },

    /** 签名人点击：打开详细信息弹窗 */
    openEsignDetail(row) {
      this.esignDetail = row || {}
      this.esignDetailVisible = true
    },

    handleViewPdf() {
      if (!this.selection.length) return this.$message.warning('请先勾选案卷')
      this.$message.info(`查看案卷PDF`)
    },

    handleCheck() {
      if (!this.selection.length) return this.$message.warning('请先勾选案卷')
      this.checkForm = { scheme: 'guiDang', remark: '' }
      this.checkDialogVisible = true
    },

    /** 查看检测方案详情 */
    viewSchemeDetail(item) {
      this.$alert(`${item.label}：真实性、完整性、可用性、安全性检测方案`, '检测方案详情', {
        confirmButtonText: '关闭'
      })
    },

    /** 四性检测确定 */
    confirmCheck() {
      this.checkDialogVisible = false
      this.$message.success(`四性检测完成：按「${(this.checkSchemes.find(s => s.value === this.checkForm.scheme) || {}).label}」检测通过`)
    },

    /** 案卷详细信息：构建详情数据 */
    buildRollDetail(row) {
      return {
        ...row,
        secretLevel: '',
        pieceCount: 1,
        pages: 335,
        pdfSize: '87.52MB',
        attachCount: 1,
        spineSpec: '',
        archiveType: '数字化档案',
        auditStatus: '已归档',
        fourCheck: '通过',
        transferStatus: '',
        openFlag: '',
        mutualNo: '',
        textMaterial: '',
        graphics: '',
        photos: '',
        formStatus: '',
        remark: '',
        addPerson: '张鲁莎',
        addTime: '2026-02-25 00:00:00',
        editPerson: '张鲁莎',
        editTime: '2026-03-03 14:00:11',
        nodePath: '柯桥至诸暨高速公路工程 -> 第一部分 项目申报文件 -> 二、可行性研究报告及批复、可行性论证意见'
      }
    },

    handleDetail() {
      if (this.selection.length !== 1) return this.$message.warning('请先勾选一条案卷')
      this.rollDetailData = this.buildRollDetail(this.selection[0])
      this.rollDetailVisible = true
    },

    handleDetailRow(row) {
      // 点击案卷题名：切换到“卷内目录 + 文件”详情视图
      this.detailRoll = row
    },

    handlePrint(command) {
      this.$message.info(`执行打印：${command}`)
    },

    handleExport(command) {
      this.$message.info(`执行导出：${command}`)
    },

    handleBackUnarchived() {
      if (!this.selection.length) return this.$message.warning('请先勾选案卷')
      this.$confirm(`确认将选中的 ${this.selection.length} 卷重定为未归档吗？`, '提示', { type: 'warning' })
        .then(() => {
          this.$message.success('已重定为未归档')
        }).catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
.save-page {
  display: flex;
  gap: 12px;
  height: 100%;
  padding: 12px;
  background: #f0f2f5;
  box-sizing: border-box;
}

/* ===== 左侧分类树 ===== */
.left-panel {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;

  .search-row {
    display: flex;
    gap: 6px;

    .el-input {
      flex: 1;
      height: 26px;
    }

    ::v-deep .el-input__inner {
      height: 26px;
      line-height: 26px;
    }

  }

  .mode-tabs {
    display: flex;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;

    .mode-tab {
      flex: 1;
      text-align: center;
      padding: 7px 0;
      font-size: 13px;
      color: #606266;
      cursor: pointer;
      background: #fff;
      transition: all 0.2s;

      & + .mode-tab {
        border-left: 1px solid #dcdfe6;
      }

      &.active {
        background: #409eff;
        color: #fff;
      }
    }
  }

  .tree-title {
    margin: 12px 0 6px;
    font-size: 14px;
    font-weight: 700;
    color: #303133;
  }

  .left-tree-wrap {
    flex: 1;
    overflow: auto;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 6px 4px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding-right: 8px;
  font-size: 13px;

  .tree-icon {
    margin-right: 5px;
    font-size: 14px;

    &.folder {
      color: #e6a23c;
    }

    &.leaf {
      color: #409eff;
    }
  }

  .tree-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-count {
    margin-left: 4px;
    color: #909399;
    font-size: 12px;
    flex-shrink: 0;
  }
}

/* ===== 右侧案卷目录 ===== */
.right-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 10px;
  font-size: 14px;

  .breadcrumb-icon {
    margin-right: 6px;
    color: #409eff;
    font-size: 16px;
  }

  .crumb-item {
    color: #409eff;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }

    &.last {
      color: #409eff;
    }
  }

  .crumb-sep {
    margin: 0 6px;
    color: #909399;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: #f5f7fa;
  border-radius: 4px;

  .table-title {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
    margin-right: 4px;
  }

  .include-check {
    margin-right: 4px;
  }

  .field-select {
    width: 120px;
  }

  .keyword-input {
    width: 160px;
  }
}

.table-wrap {
  flex: 1;
  min-height: 0;

  .title-link {
    color: #409eff;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .status-ok {
    color: #67c23a;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 12px;
}

/* ===== 搜索弹窗通用（案卷搜索 / 文件搜索） ===== */
::v-deep .roll-search-dialog,
::v-deep .file-search-dialog {
  display: flex;
  flex-direction: column;

  .el-dialog__header {
    padding: 14px 20px;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-dialog__body {
    flex: 1;
    overflow: hidden;
    padding: 12px 16px;
  }

  .search-body {
    display: flex;
    gap: 12px;
    height: 64vh;
  }

  // 左侧：搜索条件
  .search-side {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .search-form {
      flex: 1;
      overflow: auto;
      padding-right: 4px;

      .el-form-item {
        margin-bottom: 12px;

        .el-form-item__label {
          padding-bottom: 2px;
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    .include-check {
      margin: 4px 0 8px;
    }

    .search-btns {
      padding-top: 8px;
      border-top: 1px solid #ebeef5;

      .el-button {
        min-width: 76px;
      }
    }
  }

  // 右侧：结果区
  .search-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .selected-bar {
      padding: 4px 2px 8px;
      font-size: 13px;
      color: #606266;
    }

    // 文件搜索：卷内目录 + 文件 两段
    .roll-part,
    .file-part {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .roll-part {
      flex: 1;
    }

    .file-part {
      flex: 1;
      margin-top: 10px;
    }

    .section-header {
      flex-shrink: 0;
      padding: 7px 12px;
      background: linear-gradient(#2e8fe8, #1e88d2);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      border-radius: 2px 2px 0 0;
    }

    .el-table {
      flex: 1;

      .op-link {
        margin-right: 8px;
      }
    }

    .pagination-wrap {
      padding: 8px 0 2px;
    }
  }
}

/* ===== 四性检测弹窗 ===== */
::v-deep .four-check-dialog {
  .el-dialog__body {
    padding: 20px 24px 8px;
  }

  .check-form {
    .scheme-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .scheme-link {
        margin-left: 6px;
        font-size: 13px;
      }
    }

    .el-textarea__inner {
      resize: vertical;
    }
  }
}

/* ===== 案卷详细信息弹窗 ===== */
::v-deep .roll-detail-dialog {
  .el-dialog__body {
    padding: 16px 24px;
  }

  .detail-table {
    border: 1px solid #dcdfe6;
    max-height: 66vh;
    overflow: auto;
  }

  .detail-row {
    display: flex;
    border-bottom: 1px solid #dcdfe6;

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    width: 160px;
    flex-shrink: 0;
    padding: 12px 14px;
    background: #f5f7fa;
    border-right: 1px solid #dcdfe6;
    font-size: 13px;
    color: #303133;
  }

  .detail-value {
    flex: 1;
    padding: 12px 14px;
    font-size: 13px;
    color: #303133;
    word-break: break-all;
  }

  .text-success {
    color: #67c23a;
  }
}
</style>
