<template>
  <!--
    预归档案卷：左侧档案分类目录树 + 右侧"案卷目录"表
    纯静态 DEMO，不请求接口，所有数据来自 script 内 mock
  -->
  <div class="pre-roll-page">

    <!-- ========== 左侧：档案分类目录树 ========== -->
    <div class="left-panel">
      <div class="left-header">
        <el-input
          v-model="treeKeyword"
          placeholder="搜索分类"
          prefix-icon="el-icon-search"
          size="small"
          clearable
        />
        <el-select v-model="companyFilter" size="small" class="company-select">
          <el-option label="全公司" value="all" />
          <el-option label="绍兴市柯诸高速公路有限公司" value="kezhu" />
        </el-select>
      </div>
      <div class="left-tree-wrap">
        <el-tree
          ref="archiveTree"
          :data="filteredTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :default-expanded-keys="[1, 11]"
          highlight-current
          @node-click="handleNodeClick"
          @node-contextmenu="onNodeContextMenu"
        >
          <!-- 自定义节点：名称 + (卷数/件数) -->
          <span slot-scope="{ node, data }" class="tree-node">
            <i v-if="!data.children || data.children.length === 0" class="tree-icon leaf el-icon-document" />
            <i v-else class="tree-icon folder el-icon-folder-opened" />
            <span class="tree-label">{{ data.name }}</span>
            <span class="tree-count">({{ data.rollCount || 0 }}/{{ data.fileCount || 0 }})</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- ========== 右侧：案卷目录 ========== -->
    <div class="right-panel">

      <!-- ===== 视图一：案卷目录列表 ===== -->
      <div v-if="!detailVisible" class="list-view">
        <!-- 面包屑：当前分类路径 -->
        <div class="breadcrumb-bar">
          <i class="el-icon-collection crumb-icon" />
          <template v-if="breadcrumbPath.length">
            <span v-for="(item, idx) in breadcrumbPath" :key="item.id" class="crumb-item">
              <span class="crumb-name" :class="{ last: idx === breadcrumbPath.length - 1 }">{{ item.name }}</span>
              <i v-if="idx < breadcrumbPath.length - 1" class="el-icon-arrow-right separator" />
            </span>
          </template>
          <span v-else class="crumb-empty">请先在左侧选择档案分类</span>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar search-input">
          <span class="table-title">案卷目录</span>
          <el-checkbox v-model="includeChildren" class="include-check">包含子节点</el-checkbox>
          <el-input
            v-model="rollKeyword"
            placeholder="案卷题名"
            size="small"
            clearable
            class="keyword-input"
            @keyup.enter.native="doSearch"
          />
          <el-button size="small" icon="el-icon-search" class="btn-keyword-search" @click="doSearch" style="padding-top: 1px;margin-left: -8px;" />

          <span class="toolbar-divider" />

          <adaptive-actions :items="rollActions" size="small" class="toolbar-actions" @click="onRollAction" />
        </div>

        <!-- 案卷目录表 -->
        <el-table
          ref="rollTable"
          :data="pagedRollList"
          row-key="id"
          border
          stripe
          height="calc(100% - 50px)"
          size="small"
          empty-text="暂无数据"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ pageStartIndex + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="档号" prop="archiveNo" width="130" sortable />
          <el-table-column label="案卷题名" prop="title" min-width="300" show-overflow-tooltip sortable>
            <template slot-scope="{ row }">
              <el-link :underline="false" class="roll-title-link" @click="openRollDetail(row)">{{ row.title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="编制单位" prop="unit" min-width="200" show-overflow-tooltip />
          <el-table-column label="编制起日期" prop="startDate" width="110" align="center" sortable />
          <el-table-column label="编制止日期" prop="endDate" width="110" align="center" sortable />
          <el-table-column label="考证起日期" prop="verifyStart" width="105" align="center" sortable />
          <el-table-column label="考证止日期" prop="verifyEnd" width="105" align="center" sortable />
          <el-table-column label="组卷情况" width="90" align="center">
            <template slot-scope="{ row }">
              <span :class="row.rollStatus === '组卷成功' ? 'status-ok' : 'status-none'">{{ row.rollStatus }}</span>
            </template>
          </el-table-column>
          <el-table-column label="保管期限" prop="keepTerm" width="85" align="center" />
          <el-table-column label="密级" prop="secretLevel" width="70" align="center" sortable />
          <el-table-column label="件数" prop="pieceCount" width="70" align="center" sortable />
          <el-table-column label="页数" prop="pages" width="80" align="center" sortable />
          <el-table-column label="案卷PDF大小" prop="pdfSize" width="110" align="center" sortable />
          <el-table-column label="附件总数" prop="attachmentCount" width="85" align="center" sortable />
          <el-table-column label="背脊规格" prop="spineSpec" width="85" align="center" />
          <el-table-column label="档案类型" prop="archiveType" width="100" align="center" sortable />
          <el-table-column label="审核情况" width="90" align="center">
            <template slot-scope="{ row }">
              <span v-if="row.auditStatus" :class="row.auditStatus === '已归档' ? 'text-success' : ''">{{ row.auditStatus }}</span>
            </template>
          </el-table-column>
          <el-table-column label="四性检验情况" width="110" align="center">
            <template slot-scope="{ row }">
              <span v-if="row.fourCheckStatus" :class="row.fourCheckStatus === '通过' ? 'text-success' : ''">{{ row.fourCheckStatus }}</span>
            </template>
          </el-table-column>
          <el-table-column label="移交情况" prop="transferStatus" width="90" align="center" />
          <el-table-column label="是否开放" prop="isOpen" width="85" align="center" />
          <el-table-column label="互见号" prop="mutualNo" width="100" align="center" />
          <el-table-column label="文字材料" prop="textMaterial" width="90" align="center" />
          <el-table-column label="图样" prop="drawing" width="80" align="center" />
          <el-table-column label="照片" prop="photo" width="80" align="center" />
          <el-table-column label="表格状态" prop="tableStatus" width="90" align="center" sortable />
          <el-table-column label="备注" prop="remark" min-width="100" align="center" />
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="filteredRollList.length"
            :current-page.sync="page"
            :page-size.sync="pageSize"
            :page-sizes="[10, 50, 100]"
          />
        </div>
      </div>

      <!-- ===== 视图二：案卷详情（案卷目录 + 卷内文件，按截图布局） ===== -->
      <div v-else class="detail-view">

        <!-- 面包屑 + 返回 -->
        <div class="breadcrumb-bar">
          <el-button type="text" size="small" icon="el-icon-back" class="back-btn" @click="backToList">返回</el-button>
          <i class="el-icon-collection crumb-icon" />
          <template v-if="breadcrumbPath.length">
            <span v-for="(item, idx) in breadcrumbPath" :key="item.id" class="crumb-item">
              <span class="crumb-name" :class="{ last: idx === breadcrumbPath.length - 1 }">{{ item.name }}</span>
              <i v-if="idx < breadcrumbPath.length - 1" class="el-icon-arrow-right separator" />
            </span>
          </template>
          <span class="crumb-item"><i class="el-icon-arrow-right separator" /><span class="crumb-name last">{{ detailRoll.title }}</span></span>
        </div>

        <!-- 案卷目录区 -->
        <div class="section-header">
          <span class="section-title">案卷目录</span>
          <div class="section-tools">
            <adaptive-actions :items="detailRollActions" size="mini" @click="onDetailRollAction" />
          </div>
        </div>

        <!-- 案卷目录表（文件题名/文号/责任者/编制日期/考证日期/文件数/页数/档案类型/备注） -->
        <el-table
          ref="detailRollTable"
          :data="detailRollRows"
          row-key="id"
          border
          size="small"
          empty-text="暂无数据"
          height="calc(100% - 50px)"
          highlight-current-row
          @current-change="onDetailRollChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件题名" prop="title" min-width="300" show-overflow-tooltip />
          <el-table-column label="文号" prop="docNo" width="160" show-overflow-tooltip />
          <el-table-column label="责任者" prop="responsible" min-width="180" show-overflow-tooltip />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" />
          <el-table-column label="考证日期" prop="verifyDate" width="110" align="center" />
          <el-table-column label="文件数" prop="fileCount" width="80" align="center" />
          <el-table-column label="页数" prop="pages" width="80" align="center" />
          <el-table-column label="档案类型" prop="archiveType" width="110" align="center" />
          <el-table-column label="备注" prop="remark" min-width="100" />
        </el-table>

        <!-- 案卷目录分页 -->
        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next, jumper, sizes"
            :total="detailRollTotal"
            :current-page.sync="detailPage"
            :page-size.sync="detailPageSize"
            :page-sizes="[100, 200, 500]"
          />
        </div>

        <!-- 卷内文件区 -->
        <div class="section-header">
          <span class="section-title">文件</span>
          <div class="section-tools">
            <adaptive-actions :items="detailFileActions" size="mini" @click="onDetailFileAction" />
          </div>
        </div>

        <!-- 卷内文件表（按截图列） -->
        <el-table
          ref="detailFileTable"
          :data="detailFileRows"
          row-key="id"
          border
          size="small"
          height="calc(100% - 50px)"
          empty-text="暂无数据"
          @selection-change="onFileSelectionChange"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="序号" width="55" align="center">
            <template slot-scope="scope">{{ scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="文件名称" prop="name" min-width="260" show-overflow-tooltip />
          <el-table-column label="文件编号" prop="fileNo" width="180" show-overflow-tooltip />
          <el-table-column label="编制日期" prop="createDate" width="110" align="center" />
          <el-table-column label="考证日期" prop="verifyDate" width="110" align="center" />
          <el-table-column label="页数" prop="pages" width="80" align="center" />
          <el-table-column label="排序" prop="sortNo" width="70" align="center" />
          <el-table-column label="档案类型" prop="archiveType" width="100" align="center" />
          <el-table-column label="文件状态" width="100" align="center">
            <template slot-scope="{ row }">
              <el-link :underline="false">{{ row.fileStatus }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="格式信息" prop="formatInfo" width="90" align="center" />
          <el-table-column label="操作" width="120" align="center">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" class="op-btn" @click="viewFile(row)">查看</el-button>
              <el-button type="text" size="mini" class="op-btn" @click="downloadFile(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 案卷搜索弹窗 -->
    <roll-search-dialog :visible.sync="rollSearchVisible" :node-name="currentNode ? currentNode.name : ''" />
    <!-- 文件搜索弹窗 -->
    <file-search-dialog :visible.sync="fileSearchVisible" :node-name="currentNode ? currentNode.name : ''" />
    <!-- 案卷新增/编辑弹窗 -->
    <roll-edit-dialog
      :visible.sync="rollEditVisible"
      :mode="rollEditMode"
      :row-data="rollEditRow"
      @confirm="onRollEditConfirm"
    />

    <!-- ========== 树节点右键菜单（跟随鼠标，锁定/导出含二级子菜单） ========== -->
    <div
      v-show="ctxMenu.visible"
      ref="ctxMenu"
      class="tree-ctx-menu"
      :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
    >
      <div
        v-for="item in ctxMenuItems"
        :key="item.key"
        class="ctx-item"
        :class="{ disabled: item.disabled }"
        @mouseenter="onCtxEnter(item)"
        @click.stop="onCtxClick(item)"
      >
        <i :class="item.icon" :style="{ color: item.disabled ? '#c0c4cc' : item.color }" />
        <span class="ctx-label">{{ item.label }}</span>
        <i v-if="item.children" class="el-icon-arrow-right ctx-arrow" />
        <!-- 二级子菜单：hover 展开 -->
        <div v-if="item.children && ctxSubMenu === item.key" class="ctx-submenu">
          <div
            v-for="child in item.children"
            :key="child.key"
            class="ctx-item"
            @click.stop="onCtxClick(child)"
          >
            <span class="ctx-label">{{ child.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdaptiveActions from '@/components/AdaptiveActions/index.vue'
import RollSearchDialog from './components/roll-search-dialog.vue'
import FileSearchDialog from './components/file-search-dialog.vue'
import RollEditDialog from './components/roll-edit-dialog.vue'

/**
 * 左侧树 mock：与"预归档文件"同源，rollCount=卷数、fileCount=件数
 */
const TREE_DATA = [
  {
    id: 1, name: '柯桥至诸暨高速公路工程', rollCount: 0, fileCount: 16266, level: 1,
    children: [
      { id: 11, name: '第一部分 项目申报文件', rollCount: 0, fileCount: 34, level: 2,
        children: [
          { id: 111, name: '一、项目建议书及批复、项目申请有关文件', rollCount: 0, fileCount: 1, level: 3 },
          { id: 112, name: '二、可行性研究报告及批复、可行性论证意见', rollCount: 0, fileCount: 2, level: 3 },
          { id: 113, name: '三、环境影响报告及批复文件', rollCount: 0, fileCount: 3, level: 3 },
          { id: 114, name: '四、水土保持方案报告及批复文件', rollCount: 0, fileCount: 4, level: 3 },
          { id: 115, name: '五、项目咨询、评估、论证文件', rollCount: 0, fileCount: 21, level: 3 },
          { id: 116, name: '六、投资、特许经营协议', rollCount: 1, fileCount: 6, level: 3 },
          { id: 117, name: '七、工程融资贷款计划、资金筹措方案、银行贷款协议', rollCount: 0, fileCount: 7, level: 3 }
        ]
      },
      { id: 12, name: '第二部分 设计文件', rollCount: 1, fileCount: 208, level: 2,
        children: [
          { id: 121, name: '一、初步设计及有关审批文件', rollCount: 1, fileCount: 30, level: 3 },
          { id: 122, name: '二、施工图设计及有关审批文件', rollCount: 0, fileCount: 120, level: 3 },
          { id: 123, name: '三、有关设计问题的往来文件', rollCount: 0, fileCount: 40, level: 3 },
          { id: 124, name: '四、设计技术联系单', rollCount: 0, fileCount: 18, level: 3 }
        ]
      },
      { id: 13, name: '第三部分 工程管理文件', rollCount: 0, fileCount: 75, level: 2 },
      { id: 14, name: '第四部分 施工文件', rollCount: 0, fileCount: 11868, level: 2 },
      { id: 15, name: '第五部分 监理文件', rollCount: 0, fileCount: 2931, level: 2 },
      { id: 16, name: '第六部分 竣工（交）验收文件', rollCount: 0, fileCount: 156, level: 2,
        children: [
          { id: 161, name: '一、交工验收文件', rollCount: 0, fileCount: 20, level: 3 },
          { id: 162, name: '二、工程交接表', rollCount: 0, fileCount: 8, level: 3 },
          { id: 163, name: '三、计量支付报表及汇编', rollCount: 0, fileCount: 30, level: 3 },
          { id: 164, name: '四、工程变更文件', rollCount: 0, fileCount: 45, level: 3 },
          { id: 165, name: '五、专项验收文件', rollCount: 0, fileCount: 22, level: 3 },
          { id: 166, name: '六、结算文件', rollCount: 0, fileCount: 16, level: 3 },
          { id: 167, name: '七、竣工验收文件', rollCount: 0, fileCount: 15, level: 3 }
        ]
      },
      { id: 17, name: '第七部分 科研文件', rollCount: 0, fileCount: 25, level: 2 }
    ]
  }
]

/** 生成案卷目录 mock（KZGS-Z-0011 起，共 21 条，与截图一致） */
const ROLL_TITLES = [
  '柯桥至诸暨高速公路工程接线桥通道、姚江枢纽互通区域施工的安全性评价报告',
  '柯桥至诸暨高速公路工程地质灾害危险性评估报告及备案登记表、监管承压介质报告',
  '柯桥至诸暨高速公路工程压覆矿产资源分布情况调查报告及审查意见、请示',
  '柯桥至诸暨高速公路工程初勘外业验收核查总结报告、详勘勘察检查总结报告',
  '柯桥至诸暨高速公路工程初步设计阶段安全性评价报告、安全风险评估报告；诸永高速公路改扩建工程直埠枢纽至姚江枢纽段施工安全性评价报告',
  '柯桥至诸暨高速公路工程社会风险评估报告及备案文件',
  '柯桥至诸暨高速公路工程柯桥段、诸暨段土地征拆项目社会风险评估报告及备案表文书',
  '柯桥至诸暨高速公路工程场地地震安全性评价报告及批复、请示',
  '柯桥至诸暨高速公路工程规划选址和用地预审论证报告（备案稿）、用地预审规划选址备案材料',
  '柯桥至诸暨高速公路工程选址阶段交通影响评价及评审意见',
  '柯桥至诸暨高速公路工程浦阳江、浦阳东江航道通航条件影响评价报告及评审意见',
  '柯桥至诸暨高速公路工程防洪影响评价专题报告（报批稿）及批复、请示',
  '柯桥至诸暨高速公路工程防洪影响评价专题报告（报批稿）附图集',
  '柯桥至诸暨高速公路工程水土保持方案报告（报批稿）及批复',
  '柯桥至诸暨高速公路工程建设项目用地报批材料',
  '柯桥至诸暨高速公路工程文物考古调查勘探报告及批复',
  '柯桥至诸暨高速公路工程环境影响报告书（报批稿）及批复',
  '柯桥至诸暨高速公路工程使用林地审核同意书及使用林地批复',
  '柯桥至诸暨高速公路工程涉路施工安全技术评价报告及备案证明',
  '柯桥至诸暨高速公路工程初步设计批复及概算核定文件',
  '柯桥至诸暨高速公路工程施工图设计审批意见'
]

function buildMockRolls() {
  const startDates = ['2020-05-31', '2020-12-28', '2020-12-21', '2021-01-31', '2021-03-31', '2021-06-20', '2022-06-15', '2021-04-01', '2021-06-01', '2021-11-30', '2021-12-31', '2022-05-24', '2022-05-31', '2020-11-12', '2021-02-01', '2021-05-10', '2020-09-20', '2021-07-08', '2021-08-25', '2021-09-14', '2021-10-19']
  const endDates = ['2020-05-31', '2020-12-31', '2020-12-31', '2022-01-31', '2022-02-01', '2021-06-30', '2022-08-01', '2021-05-31', '2021-10-21', '2021-11-30', '2022-01-20', '2022-05-31', '2022-05-31', '2020-12-08', '2021-03-15', '2021-06-18', '2020-10-26', '2021-08-10', '2021-09-18', '2021-10-12', '2021-11-05']
  // 与截图一致：件数/页数/PDF大小/附件总数
  const pieceCounts = [1, 3, 4, 2, 3, 2, 6, 3, 2, 1, 8, 3, 1, 2, 4, 3, 5, 2, 6, 3, 1]
  const pageCounts = [125, 85, 34, 112, 563, 301, 294, 134, 534, 73, 328, 303, 155, 96, 210, 148, 386, 92, 265, 174, 88]
  const pdfSizes = ['2.72MB', '33.62MB', '12.28MB', '16.44MB', '66.32MB', '43.36MB', '45.38MB', '85.82MB', '148.86MB', '43.06MB', '143.94MB', '37.02MB', '75.29MB', '28.50MB', '52.16MB', '31.75MB', '98.43MB', '22.08MB', '61.29MB', '40.87MB', '15.63MB']
  const attachmentCounts = [1, 3, 4, 2, 3, 2, 6, 3, 18, 1, 8, 3, 1, 2, 4, 3, 5, 2, 6, 3, 1]
  // 与截图一致：表格状态仅部分行显示"正常"
  const tableStatuses = ['', '正常', '', '正常', '正常', '', '正常', '正常', '正常', '', '正常', '', '正常', '', '正常', '', '', '正常', '', '', '']
  return ROLL_TITLES.map((title, i) => ({
    id: i + 1,
    archiveNo: `KZGS-Z-${String(i + 11).padStart(4, '0')}`,
    title,
    unit: '绍兴市柯诸高速公路有限公司',
    startDate: startDates[i],
    endDate: endDates[i],
    verifyStart: startDates[i].slice(0, 7).replace('-', '') + '00',
    verifyEnd: endDates[i].replace(/-/g, ''),
    rollStatus: '组卷成功',
    keepTerm: '永久',
    secretLevel: '',
    pieceCount: pieceCounts[i],
    pages: pageCounts[i],
    pdfSize: pdfSizes[i],
    attachmentCount: attachmentCounts[i],
    spineSpec: '',
    archiveType: '数字化档案',
    auditStatus: '已归档',
    fourCheckStatus: '通过',
    transferStatus: '未移交',
    isOpen: '否',
    mutualNo: '',
    textMaterial: '',
    drawing: '',
    photo: '',
    tableStatus: tableStatuses[i],
    remark: ''
  }))
}
const MOCK_ROLL_LIST = buildMockRolls()

/** 案卷详情-案卷目录 mock（与截图 6 条一致，共 7 条） */
const MOCK_DETAIL_ROLLS = [
  { title: '柯桥至诸暨高速公路工程项目受理通知书', docNo: '浙发改项字〔2020...', responsible: '浙江省发展和改革委员会', createDate: '2020-09-21', verifyDate: '', fileCount: 2, pages: 3, archiveType: '数字化档案' },
  { title: '关于要求审批柯桥至诸暨高速公路工程项目建议书的请示', docNo: '绍市建〔2020〕...', responsible: '绍兴市交通建设有限公司', createDate: '2020-05-18', verifyDate: '', fileCount: 1, pages: 4, archiveType: '电子档案' },
  { title: '关于要求审批柯桥至诸暨高速公路工程项目建议书的请示', docNo: '绍市改建〔2020〕1...', responsible: '绍兴市交通建设有限公司', createDate: '2020-06-08', verifyDate: '', fileCount: 1, pages: 4, archiveType: '电子档案' },
  { title: '关于要求审批柯桥至诸暨高速公路工程项目建议书的请示', docNo: '绍市建〔2020〕1...', responsible: '绍兴市交通建设有限公司', createDate: '2020-06-15', verifyDate: '', fileCount: 1, pages: 4, archiveType: '电子档案' },
  { title: '关于要求审批柯桥至诸暨高速公路工程项目建议书的请示', docNo: '绍市建〔2020〕2...', responsible: '绍兴市交通建设有限公司', createDate: '2020-08-14', verifyDate: '', fileCount: 1, pages: 4, archiveType: '电子档案' },
  { title: '柯桥至诸暨高速公路工程项目建议书', docNo: '', responsible: '浙江省交通规划设计研究院有限公司', createDate: '2020-08-01', verifyDate: '20200800', fileCount: 1, pages: 84, archiveType: '数字化档案' }
].map((r, i) => ({ id: i + 1, remark: '', ...r }))

/** 案卷详情-卷内文件 mock（与截图 2 条一致） */
const MOCK_DETAIL_FILES = [
  { name: '柯桥至诸暨高速公路工程项目受理通知书', fileNo: '浙发改项字〔20...', createDate: '2020-09-21', verifyDate: '', pages: 2, sortNo: 1, archiveType: '数字化档案', fileStatus: '上传成功', formatInfo: '.pdf' },
  { name: '公文处理单', fileNo: '浙发改项字〔20...', createDate: '2020-09-21', verifyDate: '', pages: 1, sortNo: 2, archiveType: '数字化档案', fileStatus: '上传成功', formatInfo: '.pdf' }
].map((r, i) => ({ id: i + 1, ...r }))

export default {
  name: 'ArchivePreRoll',
  components: { AdaptiveActions, RollSearchDialog, FileSearchDialog, RollEditDialog },
  data() {
    return {
      // 左侧树
      treeKeyword: '',
      companyFilter: 'all',
      fullTree: JSON.parse(JSON.stringify(TREE_DATA)),
      filteredTree: JSON.parse(JSON.stringify(TREE_DATA)),
      currentNode: null,
      breadcrumbPath: [],

      // 右侧案卷目录
      includeChildren: true,
      rollKeyword: '',
      appliedKeyword: '',
      rollList: [],
      selection: [],
      page: 1,
      pageSize: 100,

      // 案卷/文件搜索弹窗
      rollSearchVisible: false,
      fileSearchVisible: false,

      // 案卷新增/编辑弹窗
      rollEditVisible: false,
      rollEditMode: 'add',
      rollEditRow: null,

      // 案卷详情视图
      detailVisible: false,
      detailRoll: null,
      detailRollRows: [],
      detailSelection: [],
      detailFileRows: [],
      fileSelection: [],
      detailPage: 1,
      detailPageSize: 100,
      detailRollTotal: 7,

      // 树节点右键菜单
      ctxMenu: { visible: false, x: 0, y: 0 },
      ctxSubMenu: null,
      ctxNode: null
    }
  },
  computed: {
    /** 树节点右键菜单（与真实系统一致：锁定/导出含二级子菜单，重新构建对应关系置灰） */
    ctxMenuItems() {
      return [
        { key: 'lock', label: '锁定', icon: 'el-icon-lock', color: '#409eff', children: [
          { key: 'lockNode', label: '锁定' },
          { key: 'unlockNode', label: '解锁' }
        ] },
        { key: 'uploadDir', label: '上传文件夹（档号_件号）', icon: 'el-icon-folder', color: '#e6a23c' },
        { key: 'uploadZip', label: '上传压缩文件（档号_件号）', icon: 'el-icon-box', color: '#67c23a' },
        { key: 'calcPdf', label: '计算PDF页数', icon: 'el-icon-tickets', color: '#409eff' },
        { key: 'export', label: '导出', icon: 'el-icon-share', color: '#409eff', children: [
          { key: 'exportRollDir', label: '导出案卷目录' },
          { key: 'exportFileDir', label: '导出卷内文件目录' }
        ] },
        { key: 'checkNo', label: '检查档号重复', icon: 'el-icon-search', color: '#409eff' },
        { key: 'checkTitle', label: '检测案卷题名重复', icon: 'el-icon-search', color: '#67c23a' },
        { key: 'genNo', label: '生成档号', icon: 'el-icon-setting', color: '#67c23a' },
        { key: 'autoInnerNo', label: '自动生成卷内目录档号', icon: 'el-icon-s-grid', color: '#67c23a' },
        { key: 'rebuild', label: '重新构建对应关系', icon: 'el-icon-refresh-left', color: '#c0c4cc', disabled: true },
        { key: 'downloadQr', label: '下载案卷二维码台账', icon: 'el-icon-download', color: '#e6a23c' }
      ]
    },

    /** 工具栏自适应按钮（宽度不足时自动收进「...」下拉） */
    rollActions() {
      const hasSelection = this.selection.length > 0
      return [
        { key: 'rollSearch', label: '案卷搜索', icon: 'el-icon-folder-opened', plain: true },
        { key: 'fileSearch', label: '文件搜索', icon: 'el-icon-document', plain: true },
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh', plain: true },
        { key: 'add', label: '新增', icon: 'el-icon-plus' },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', plain: true, disabled: !hasSelection },
        { key: 'del', label: '删除', icon: 'el-icon-delete', plain: true, disabled: !hasSelection },
        { key: 'import', label: '导入案卷目录', icon: 'el-icon-upload2', plain: true },
        { key: 'compose', label: '组卷', icon: 'el-icon-files', plain: true, disabled: !hasSelection },
        { key: 'view', label: '查看', icon: 'el-icon-view', plain: true, children: [
          { key: 'viewRoll', label: '查看案卷' },
          { key: 'viewFiles', label: '查看卷内文件' }
        ] },
        { key: 'verifyFour', label: '四性校验', icon: 'el-icon-finished', plain: true, disabled: !hasSelection },
        { key: 'print', label: '打印', icon: 'el-icon-printer', plain: true, children: [
          { key: 'printRollDir', label: '打印案卷目录' },
          { key: 'printFileDir', label: '打印卷内文件目录' }
        ] },
        { key: 'export', label: '导出', icon: 'el-icon-download', plain: true, children: [
          { key: 'exportRollDir', label: '导出案卷目录' },
          { key: 'exportFileDir', label: '导出卷内文件目录' }
        ] },
        { key: 'calcPdf', label: '计算PDF页数', icon: 'el-icon-document-checked', plain: true, disabled: !hasSelection },
        { key: 'correct', label: '数据校正', icon: 'el-icon-magic-stick', plain: true, children: [
          { key: 'correctDate', label: '校正编制日期、页面项序号' },
          { key: 'correctPages', label: '校正页面页数等' },
          { key: 'correctElectronic', label: '校正为电子档案' },
          { key: 'correctDouble', label: '双套制' },
          { key: 'correctHalf', label: '半套制' }
        ] },
        { key: 'renumber', label: '档号重排' },
        { key: 'keepTerm', label: '批量调整保管期限' }
      ]
    },

    /** 详情视图-案卷目录区自适应按钮 */
    detailRollActions() {
      const hasSelection = this.detailSelection.length > 0
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus', plain: true },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', plain: true, disabled: !hasSelection },
        { key: 'del', label: '删除', icon: 'el-icon-delete', plain: true, disabled: !hasSelection },
        { key: 'import', label: '导入案卷目录', icon: 'el-icon-upload2', plain: true },
        { key: 'copy', label: '复制', icon: 'el-icon-download', plain: true, disabled: !hasSelection },
        { key: 'paste', label: '粘贴', icon: 'el-icon-document-copy', plain: true },
        { key: 'cut', label: '剪切', icon: 'el-icon-scissors', plain: true, disabled: !hasSelection },
        { key: 'merge', label: '合并', icon: 'el-icon-connection', plain: true, disabled: !hasSelection },
        { key: 'batchEdit', label: '批量修改', icon: 'el-icon-edit-outline', plain: true },
        { key: 'batchReplace', label: '批量替换', icon: 'el-icon-sort', plain: true },
        { key: 'correct', label: '数据校正', icon: 'el-icon-magic-stick', plain: true, children: [
          { key: 'correctDate', label: '校正编制日期、页面项序号' },
          { key: 'correctPages', label: '校正页面页数等' },
          { key: 'correctElectronic', label: '校正为电子档案' },
          { key: 'correctDouble', label: '双套制' },
          { key: 'correctHalf', label: '半套制' }
        ] },
        { key: 'collectBiz', label: '收集业务文件', icon: 'el-icon-collection', plain: true }
      ]
    },

    /** 详情视图-文件区自适应按钮 */
    detailFileActions() {
      const hasSelection = this.fileSelection.length > 0
      return [
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus', plain: true },
        { key: 'upload', label: '上传', icon: 'el-icon-upload', plain: true, children: [
          { key: 'uploadFile', label: '上传文件' },
          { key: 'uploadDir', label: '上传目录' }
        ] },
        { key: 'collectTable', label: '收集表格', icon: 'el-icon-tickets', plain: true },
        { key: 'collect', label: '收集', icon: 'el-icon-download', plain: true, children: [
          { key: 'collectDisk', label: '从磁盘收集' },
          { key: 'collectSystem', label: '从业务系统收集' }
        ] },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', plain: true, disabled: !hasSelection },
        { key: 'del', label: '删除', icon: 'el-icon-delete', plain: true, disabled: !hasSelection },
        { key: 'mainSign', label: '主签名', icon: 'el-icon-edit-outline', plain: true, disabled: !hasSelection },
        { key: 'viewDownload', label: '查看/下载', icon: 'el-icon-view', plain: true, disabled: !hasSelection, children: [
          { key: 'view', label: '查看' },
          { key: 'download', label: '下载' },
          { key: 'batchDownload', label: '批量下载' }
        ] },
        { key: 'calcPdf', label: '计算PDF页数', icon: 'el-icon-document', plain: true, disabled: !hasSelection }
      ]
    },

    /** 按关键字过滤后的案卷列表 */
    filteredRollList() {
      const kw = this.appliedKeyword.trim()
      if (!kw) return this.rollList
      return this.rollList.filter(r => r.title.includes(kw) || r.archiveNo.includes(kw))
    },
    pagedRollList() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredRollList.slice(start, start + this.pageSize)
    },
    pageStartIndex() {
      return (this.page - 1) * this.pageSize
    }
  },
  watch: {
    treeKeyword() { this.filterTree() },
    page() { this.selection = [] }
  },
  created() {
    // 默认选中"五、项目咨询、评估、论证文件"节点（与截图一致）
    this.$nextTick(() => {
      const treeRef = this.$refs.archiveTree
      if (treeRef) {
        treeRef.setCurrentKey(115)
        this.handleNodeClick({ id: 115, name: '五、项目咨询、评估、 论证文件', level: 3 })
      }
    })
  },
  mounted() {
    // 右键菜单：点击其它区域 / 右键其它区域 / Esc 关闭
    document.addEventListener('mousedown', this.onGlobalMousedown)
    document.addEventListener('contextmenu', this.onGlobalContextmenu)
    document.addEventListener('keydown', this.onEscKeydown)
  },
  beforeDestroy() {
    document.removeEventListener('mousedown', this.onGlobalMousedown)
    document.removeEventListener('contextmenu', this.onGlobalContextmenu)
    document.removeEventListener('keydown', this.onEscKeydown)
  },
  methods: {
    /** 按关键字过滤树（保留祖先） */
    filterTree() {
      const kw = this.treeKeyword.trim()
      if (!kw) {
        this.filteredTree = JSON.parse(JSON.stringify(this.fullTree))
        return
      }
      const walk = (list) => list.reduce((acc, n) => {
        const selfHit = n.name.includes(kw)
        const childrenHit = n.children ? walk(n.children) : []
        if (selfHit || childrenHit.length) acc.push({ ...n, children: childrenHit })
        return acc
      }, [])
      this.filteredTree = walk(this.fullTree)
    },

    /** 根据节点 id 回溯面包屑路径 */
    buildBreadcrumb(nodeId) {
      const path = []
      const find = (list, trail) => {
        for (const n of list) {
          const next = [...trail, { id: n.id, name: n.name }]
          if (n.id === nodeId) { path.push(...next); return true }
          if (n.children && find(n.children, next)) return true
        }
        return false
      }
      find(this.fullTree, [])
      this.breadcrumbPath = path
    },

    /** 点击左侧树节点 → 加载案卷目录（纯 mock） */
    handleNodeClick(node) {
      this.currentNode = node
      this.buildBreadcrumb(node.id)
      this.refreshList()
    },

    // ===== 树节点右键菜单 =====
    /** 右键树节点：选中该节点并在鼠标位置展示菜单 */
    onNodeContextMenu(event, data) {
      event.preventDefault()
      this.ctxNode = data
      this.$refs.archiveTree && this.$refs.archiveTree.setCurrentKey(data.id)
      this.ctxSubMenu = null
      // 预估菜单尺寸，避免超出视口
      const menuW = 240
      const menuH = 390
      this.ctxMenu = {
        visible: true,
        x: Math.min(event.clientX, window.innerWidth - menuW - 8),
        y: Math.min(event.clientY, window.innerHeight - menuH - 8)
      }
    },
    /** hover 展开/收起二级子菜单 */
    onCtxEnter(item) {
      this.ctxSubMenu = item.children ? item.key : null
    },
    /** 右键菜单项点击（有子菜单的父项仅展开子菜单不执行） */
    onCtxClick(item) {
      if (item.disabled) return
      if (item.children) {
        this.ctxSubMenu = this.ctxSubMenu === item.key ? null : item.key
        return
      }
      const name = this.ctxNode ? this.ctxNode.name : ''
      const handlers = {
        lockNode: () => this.$message.success(`已锁定「${name}」（静态 DEMO）`),
        unlockNode: () => this.$message.info(`已解锁「${name}」（静态 DEMO）`),
        uploadDir: () => this.$message.info(`上传文件夹到「${name}」（档号_件号）（静态 DEMO 占位）`),
        uploadZip: () => this.$message.info(`上传压缩文件到「${name}」（档号_件号）（静态 DEMO 占位）`),
        calcPdf: () => this.$message.info(`计算「${name}」下 PDF 页数（静态 DEMO 占位）`),
        exportRollDir: () => this.handleExportCmd('rollDir'),
        exportFileDir: () => this.handleExportCmd('fileDir'),
        checkNo: () => this.$message.info(`检查「${name}」档号重复（静态 DEMO 占位）`),
        checkTitle: () => this.$message.info(`检测「${name}」案卷题名重复（静态 DEMO 占位）`),
        genNo: () => this.$message.success(`为「${name}」生成档号（静态 DEMO）`),
        autoInnerNo: () => this.$message.success(`为「${name}」自动生成卷内目录档号（静态 DEMO）`),
        downloadQr: () => this.$message.info(`下载「${name}」案卷二维码台账（静态 DEMO 占位）`)
      }
      const fn = handlers[item.key]
      if (fn) fn()
      this.hideCtxMenu()
    },
    hideCtxMenu() {
      this.ctxMenu.visible = false
      this.ctxSubMenu = null
    },
    /** 点击菜单外区域关闭 */
    onGlobalMousedown(e) {
      if (!this.ctxMenu.visible) return
      const menu = this.$refs.ctxMenu
      if (menu && !menu.contains(e.target)) this.hideCtxMenu()
    },
    /** 右键其它区域关闭（右键树节点时由 onNodeContextMenu 重新定位，不关闭） */
    onGlobalContextmenu(e) {
      if (!this.ctxMenu.visible) return
      if (e.target && e.target.closest && e.target.closest('.el-tree')) return
      this.hideCtxMenu()
    },
    /** Esc 关闭 */
    onEscKeydown(e) {
      if (e.key === 'Escape' && this.ctxMenu.visible) this.hideCtxMenu()
    },

    // ===== 案卷目录 =====
    refreshList() {
      // 纯 mock：选中"五、项目咨询、评估、论证文件"（115）时展示 21 条案卷
      if (this.currentNode && this.currentNode.id === 115) {
        this.rollList = JSON.parse(JSON.stringify(MOCK_ROLL_LIST))
      } else if (this.currentNode && this.currentNode.level === 3) {
        // 其他三级节点给少量示例数据
        this.rollList = JSON.parse(JSON.stringify(MOCK_ROLL_LIST.slice(0, 3))).map((r, i) => ({
          ...r, id: i + 1, archiveNo: `KZGS-Z-${String(i + 11).padStart(4, '0')}`
        }))
      } else {
        this.rollList = []
      }
      this.page = 1
      this.appliedKeyword = this.rollKeyword
      this.$nextTick(() => { this.selection = [] })
    },

    doSearch() {
      this.appliedKeyword = this.rollKeyword
      this.page = 1
    },

    onSelectionChange(selection) {
      this.selection = selection || []
    },

    // ===== 案卷详情视图 =====
    /** 点击"案卷题名"链接 → 切换到详情视图（案卷目录 + 卷内文件） */
    openRollDetail(row) {
      this.detailRoll = row
      this.detailVisible = true
      this.refreshDetail()
    },
    /** 返回案卷目录列表 */
    backToList() {
      this.detailVisible = false
      this.detailRoll = null
      this.detailRollRows = []
      this.detailFileRows = []
      this.detailSelection = []
      this.fileSelection = []
    },
    /** 加载详情两个表格（纯 mock） */
    refreshDetail() {
      this.detailRollRows = JSON.parse(JSON.stringify(MOCK_DETAIL_ROLLS))
      this.detailFileRows = JSON.parse(JSON.stringify(MOCK_DETAIL_FILES))
      this.detailPage = 1
      this.detailSelection = []
      this.fileSelection = []
    },
    onDetailRollChange(row) {
      if (!row) return
      // 单选行联动：高亮即选中
      this.detailSelection = [row]
    },
    onFileSelectionChange(selection) {
      this.fileSelection = selection || []
    },
    copyRoll() {
      this.$message.info(`已复制 ${this.detailSelection.length} 条案卷目录（静态 DEMO 占位）`)
    },
    pasteRoll() {
      this.$message.info('粘贴案卷目录（静态 DEMO 占位）')
    },
    cutRoll() {
      this.$message.info(`已剪切 ${this.detailSelection.length} 条案卷目录（静态 DEMO 占位）`)
    },
    mergeRoll() {
      this.$message.info(`合并选中 ${this.detailSelection.length} 条案卷（静态 DEMO 占位）`)
    },
    batchEdit() {
      this.$message.info('批量修改（静态 DEMO 占位）')
    },
    batchReplace() {
      this.$message.info('批量替换（静态 DEMO 占位）')
    },
    collectFile() {
      this.$message.info('收集业务文件（静态 DEMO 占位）')
    },
    handleCollectCmd(cmd) {
      this.$message.info(cmd === 'disk' ? '从磁盘收集（静态 DEMO 占位）' : '从业务系统收集（静态 DEMO 占位）')
    },
    mainSign() {
      this.$message.info('主签名（静态 DEMO 占位）')
    },
    handleViewFileCmd(cmd) {
      const map = { view: '查看', download: '下载', batchDownload: '批量下载' }
      this.$message.info(`${map[cmd]}（静态 DEMO 占位）`)
    },
    viewFile(row) {
      this.$message.info(`查看文件「${row.name}」（静态 DEMO 占位）`)
    },
    downloadFile(row) {
      this.$message.info(`下载文件「${row.name}」（静态 DEMO 占位）`)
    },

    /** 新增案卷：打开新增弹窗（列表视图/详情视图通用） */
    addRoll() {
      this.rollEditMode = 'add'
      this.rollEditRow = null
      this.rollEditVisible = true
    },

    /** 案卷新增/编辑弹窗确认 */
    onRollEditConfirm(formData) {
      // 编辑 → 回写选中行；新增 → 按视图追加
      if (this.rollEditMode === 'edit') {
        const row = this.detailVisible ? this.detailSelection[0] : this.selection[0]
        if (!row) return
        if (this.detailVisible) {
          Object.assign(row, {
            title: formData.title,
            responsible: formData.unit,
            createDate: formData.startDate,
            verifyDate: formData.verifyStart,
            remark: formData.remark
          })
        } else {
          Object.assign(row, {
            archiveNo: formData.archiveNo,
            title: formData.title,
            mutualNo: formData.mutualNo,
            unit: formData.unit,
            startDate: formData.startDate,
            endDate: formData.endDate,
            verifyStart: formData.verifyStart,
            verifyEnd: formData.verifyEnd,
            keepTerm: formData.keepTerm,
            secretLevel: formData.secretLevel,
            spineSpec: formData.spineSpec,
            textMaterial: formData.textMaterial,
            drawing: formData.drawing,
            photo: formData.photo,
            remark: formData.remark
          })
        }
        this.$message.success('修改成功')
        return
      }

      if (this.detailVisible) {
        this.detailRollRows.push({
          id: Date.now(),
          title: formData.title,
          docNo: '',
          responsible: formData.unit,
          createDate: formData.startDate,
          verifyDate: formData.verifyStart,
          fileCount: 1,
          pages: 0,
          archiveType: '数字化档案',
          remark: formData.remark
        })
      } else {
        if (!this.currentNode) { this.$message.warning('请先在左侧选择分类'); return }
        const n = this.rollList.length + 1
        this.rollList.push({
          id: Date.now(),
          archiveNo: formData.archiveNo || `KZGS-Z-${String(n + 10).padStart(4, '0')}`,
          title: formData.title,
          unit: formData.unit,
          startDate: formData.startDate,
          endDate: formData.endDate,
          verifyStart: formData.verifyStart,
          verifyEnd: formData.verifyEnd,
          rollStatus: '未组卷',
          keepTerm: formData.keepTerm,
          secretLevel: formData.secretLevel,
          pieceCount: 1,
          pages: 0,
          pdfSize: '',
          attachmentCount: 0,
          spineSpec: formData.spineSpec,
          archiveType: '数字化档案',
          auditStatus: '',
          fourCheckStatus: '',
          transferStatus: '未移交',
          isOpen: '否',
          mutualNo: formData.mutualNo,
          textMaterial: formData.textMaterial,
          drawing: formData.drawing,
          photo: formData.photo,
          tableStatus: '',
          remark: formData.remark
        })
      }
      this.$message.success('新增成功')
    },
    delRoll() {
      // 详情视图 → 删除案卷目录选中行；列表视图 → 删除案卷列表选中行
      if (this.detailVisible) {
        if (!this.detailSelection.length) return
        const ids = new Set(this.detailSelection.map(x => x.id))
        this.detailRollRows = this.detailRollRows.filter(x => !ids.has(x.id))
        this.detailSelection = []
        this.$message.success('删除成功')
        return
      }
      if (!this.selection.length) return
      this.$confirm(`删除 ${this.selection.length} 条案卷目录？`, '提示', { type: 'warning' })
        .then(() => {
          const ids = new Set(this.selection.map(x => x.id))
          this.rollList = this.rollList.filter(x => !ids.has(x.id))
          this.$message.success('删除成功')
        }).catch(() => {})
    },
    /** 编辑案卷：打开编辑弹窗（回填列表视图或详情视图选中行） */
    editRoll() {
      const row = this.detailVisible ? this.detailSelection[0] : this.selection[0]
      if (!row) { this.$message.warning('请先选择案卷'); return }
      this.rollEditMode = 'edit'
      this.rollEditRow = row
      this.rollEditVisible = true
    },
    importRoll() {
      this.$message.info('导入案卷目录：弹出 Excel 导入对话框（静态 DEMO 占位）')
    },
    composeRoll() {
      this.selection.forEach(r => { r.rollStatus = '组卷成功' })
      this.$message.success(`组卷：选中 ${this.selection.length} 条案卷已标记为"组卷成功"（静态 DEMO）`)
    },
    rollSearch() {
      this.rollSearchVisible = true
    },
    fileSearch() {
      this.fileSearchVisible = true
    },

    // ===== 下拉命令 =====
    /** 自适应按钮条统一分发（含「...」下拉内的隐藏按钮与二级菜单） */
    onRollAction(item) {
      const handlers = {
        rollSearch: () => this.rollSearch(),
        fileSearch: () => this.fileSearch(),
        refresh: () => this.refreshList(),
        add: () => this.addRoll(),
        edit: () => this.editRoll(),
        del: () => this.delRoll(),
        import: () => this.importRoll(),
        compose: () => this.composeRoll(),
        viewRoll: () => this.handleViewCmd('roll'),
        viewFiles: () => this.handleViewCmd('files'),
        verifyFour: () => this.verifyFour(),
        printRollDir: () => this.handlePrintCmd('rollDir'),
        printFileDir: () => this.handlePrintCmd('fileDir'),
        exportRollDir: () => this.handleExportCmd('rollDir'),
        exportFileDir: () => this.handleExportCmd('fileDir'),
        calcPdf: () => this.calcPdf(),
        correctDate: () => this.handleCorrectCmd('date'),
        correctPages: () => this.handleCorrectCmd('pages'),
        correctElectronic: () => this.handleCorrectCmd('electronic'),
        correctDouble: () => this.handleCorrectCmd('double'),
        correctHalf: () => this.handleCorrectCmd('half'),
        renumber: () => this.handleMoreCmd('renumber'),
        keepTerm: () => this.handleMoreCmd('keepTerm')
      }
      const fn = handlers[item.key]
      fn ? fn() : this.$message.info(`「${item.label}」（静态 DEMO 占位）`)
    },

    /** 详情视图-案卷目录区自适应按钮统一分发 */
    onDetailRollAction(item) {
      const handlers = {
        refresh: () => this.refreshDetail(),
        add: () => this.addRoll(),
        edit: () => this.editRoll(),
        del: () => this.delRoll(),
        import: () => this.importRoll(),
        copy: () => this.copyRoll(),
        paste: () => this.pasteRoll(),
        cut: () => this.cutRoll(),
        merge: () => this.mergeRoll(),
        batchEdit: () => this.batchEdit(),
        batchReplace: () => this.batchReplace(),
        correctDate: () => this.handleCorrectCmd('date'),
        correctPages: () => this.handleCorrectCmd('pages'),
        correctElectronic: () => this.handleCorrectCmd('electronic'),
        correctDouble: () => this.handleCorrectCmd('double'),
        correctHalf: () => this.handleCorrectCmd('half'),
        collectBiz: () => this.collectFile()
      }
      const fn = handlers[item.key]
      fn ? fn() : this.$message.info(`「${item.label}」（静态 DEMO 占位）`)
    },

    /** 详情视图-文件区自适应按钮统一分发 */
    onDetailFileAction(item) {
      const handlers = {
        refresh: () => this.refreshDetail(),
        add: () => this.addRoll(),
        uploadFile: () => this.$message.info('上传文件（静态 DEMO 占位）'),
        uploadDir: () => this.$message.info('上传目录（静态 DEMO 占位）'),
        collectTable: () => this.collectFile(),
        collectDisk: () => this.handleCollectCmd('disk'),
        collectSystem: () => this.handleCollectCmd('system'),
        edit: () => this.editFile(),
        del: () => this.delFile(),
        mainSign: () => this.mainSign(),
        view: () => this.handleViewFileCmd('view'),
        download: () => this.handleViewFileCmd('download'),
        batchDownload: () => this.handleViewFileCmd('batchDownload'),
        calcPdf: () => this.calcPdf()
      }
      const fn = handlers[item.key]
      fn ? fn() : this.$message.info(`「${item.label}」（静态 DEMO 占位）`)
    },

    /** 编辑选中文件（静态 DEMO 占位） */
    editFile() {
      if (!this.fileSelection.length) return
      this.$message.info(`修改文件「${this.fileSelection[0].name}」（静态 DEMO 占位）`)
    },
    /** 删除选中文件 */
    delFile() {
      if (!this.fileSelection.length) return
      const ids = new Set(this.fileSelection.map(x => x.id))
      this.detailFileRows = this.detailFileRows.filter(x => !ids.has(x.id))
      this.fileSelection = []
      this.$message.success('删除成功')
    },
    handleViewCmd(cmd) {
      const row = this.selection[0]
      if (!row) { this.$message.warning('请先选择案卷'); return }
      this.$message.info(cmd === 'roll' ? `查看案卷：${row.archiveNo}（静态 DEMO）` : `查看卷内文件：${row.archiveNo}（静态 DEMO）`)
    },
    handlePrintCmd(cmd) {
      this.$message.info(cmd === 'rollDir' ? '打印案卷目录（静态 DEMO 占位）' : '打印卷内文件目录（静态 DEMO 占位）')
    },
    handleExportCmd(cmd) {
      this.$message.info(cmd === 'rollDir' ? '导出案卷目录 Excel（静态 DEMO 占位）' : '导出卷内文件目录 Excel（静态 DEMO 占位）')
    },
    verifyFour() {
      this.$message.success(`对选中 ${this.selection.length} 条执行"四性校验"（静态 DEMO：模拟通过）`)
    },
    calcPdf() {
      this.$message.info(`计算选中 ${this.selection.length} 条案卷的 PDF 页数（静态 DEMO 占位）`)
    },
    handleCorrectCmd(cmd) {
      const map = {
        date: '校正编制日期、页面项序号',
        pages: '校正页面页数等',
        electronic: '校正为电子档案',
        double: '双套制',
        half: '半套制'
      }
      this.$message.info(`数据校正 - ${map[cmd]}（静态 DEMO 占位）`)
    },
    handleMoreCmd(cmd) {
      this.$message.info(cmd === 'renumber' ? '档号重排（静态 DEMO 占位）' : '批量调整保管期限（静态 DEMO 占位）')
    }
  }
}
</script>

<style lang="scss" scoped>
.pre-roll-page {
  display: flex;
  height: 100%;
  background: #fff;
  gap: 8px;
  padding: 8px;

  // 左侧面板
  .left-panel {
    width: 260px;
    flex-shrink: 0;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .left-header {
      padding: 8px;
      background: #f7f9fc;
      border-bottom: 1px solid #ebeef5;

      .company-select { width: 100%; margin-top: 6px; }
    }

    .left-tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 6px;

      ::v-deep .el-tree-node__content { height: 30px; }
    }

    .tree-node {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;

      .tree-icon { font-size: 14px; }
      .tree-icon.folder { color: #e6a23c; }
      .tree-icon.leaf { color: #409eff; }
      .tree-label { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tree-count { color: #909399; font-size: 12px; }
    }
  }

  // 树节点右键菜单
  .tree-ctx-menu {
    position: fixed;
    z-index: 3000;
    min-width: 225px;
    padding: 5px 0;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

    .ctx-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 32px;
      padding: 0 16px;
      font-size: 13px;
      color: #303133;
      cursor: pointer;
      user-select: none;

      &:hover { background: #f5f7fa; }

      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;

        &:hover { background: none; }
      }

      .ctx-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ctx-arrow {
        margin-left: auto;
        color: #c0c4cc;
        font-size: 12px;
      }

      // 二级子菜单：贴右侧展开
      .ctx-submenu {
        position: absolute;
        left: calc(100% - 4px);
        top: -6px;
        min-width: 170px;
        padding: 5px 0;
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
    }
  }

  // 右侧面板
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    .list-view {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    // 面包屑
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #f7f9fc;
      border-bottom: 1px solid #ebeef5;
      font-size: 13px;
      overflow: hidden;
      white-space: nowrap;

      .crumb-icon { color: #409eff; }
      .crumb-item { display: inline-flex; align-items: center; gap: 6px; }
      .crumb-name { color: #606266; }
      .crumb-name.last { color: #303133; font-weight: 600; }
      .separator { color: #c0c4cc; font-size: 12px; }
      .crumb-empty { color: #909399; }
    }

    // 工具栏
    .toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      padding: 4px 12px;
      border-bottom: 1px solid #ebeef5;
      background: #4683f9;

      .table-title { font-size: 14px; color: #fff; margin-right: 4px; }
      .include-check { 
        margin: 0 4px;
        background: #fff;
        height: 26px;
        line-height: 24px;
        padding: 0 6px;
        border-radius: 4px;
      }
      .keyword-input { width: 180px; }
      .btn-keyword-search { margin-left: 0; padding: 9px 12px; }
      .toolbar-divider { width: 1px; height: 20px; background: #dcdfe6; margin: 0 4px; }
    }

    .status-ok { color: #67c23a; font-weight: 600; }
    .status-none { color: #909399; }
    .text-success { color: #67c23a; }

    .pagination-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 12px;
      border-top: 1px solid #ebeef5;
      background: #fafbfc;
    }

    // ===== 详情视图（案卷目录 + 卷内文件） =====
    .detail-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;

      .back-btn { padding: 0 8px 0 0; margin-right: 4px; }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(#2e8fe8, #1e88d2);
        border-radius: 3px 3px 0 0;

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .section-tools {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          overflow: hidden;

          // 蓝底上的浅色按钮文字加深
          .el-button--mini {
            padding: 6px 10px;
          }
        }
      }

      .pagination-wrap {
        border-top: none;
        background: #fff;
      }
    }

    // 案卷题名链接样式
    .roll-title-link {
      font-size: 13px;
      ::v-deep .el-link__inner { font-weight: normal; }
    }

    .op-btn { padding: 0; margin: 0 8px 0 0; }
  }
}
</style>
