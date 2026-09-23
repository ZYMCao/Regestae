<template>
  <!--
    维护分类：电子档案整理 / 维护分类
    纯静态 DEMO 页，不请求后端接口，所有数据来自 script 内 mockTree
  -->
  <div class="app-container category-page">

    <!-- ======= 操作栏 ======= -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="请输入分类名称"
        prefix-icon="el-icon-search"
        clearable
        size="small"
        class="search-input"
        @keyup.enter.native="handleQuery"
      />
      <!-- 自适应操作按钮条（宽度不足时自动收进「...」） -->
      <adaptive-actions :items="actionItems" size="small" class="toolbar-actions" @click="onActionClick" />
    </div>

    <!-- ======= 数据表格（树形） ======= -->
    <el-table
      ref="treeTable"
      v-loading="loading"
      :data="treeData"
      row-key="id"
      :default-expand-all="false"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      border
      stripe
      size="small"
      height="calc(100% - 60px)"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
      highlight-current-row
    >
      <!-- 复选列：点击"切换复选"显示/隐藏 -->
      <el-table-column v-if="showCheckbox" type="selection" width="45" align="center" />
      <el-table-column label="分类名称" prop="name" min-width="260" :indent="20">
        <template slot-scope="{ row }">
          <!-- 按层级显示不同图标 -->
          <i v-if="row.level === 1" class="el-icon-s-order category-icon top" />
          <i v-else-if="row.level === 2" class="el-icon-folder-opened category-icon" />
          <i v-else class="el-icon-document category-icon leaf" />
          <span class="category-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类号" prop="code" width="120" />
      <el-table-column label="档号前缀" prop="prefix" width="100" />
      <el-table-column label="年度" prop="year" width="80" align="center" />
      <el-table-column label="整理方式" prop="organizeMethod" width="140" align="center">
        <template slot-scope="{ row }">
          <el-tag v-if="row.organizeMethod === '按件整理+按卷整理'" size="mini" type="info">按件整理+按卷整理</el-tag>
          <el-tag v-else-if="row.organizeMethod === '按件整理'" size="mini">按件整理</el-tag>
          <el-tag v-else-if="row.organizeMethod === '按卷整理'" size="mini" type="success">按卷整理</el-tag>
          <span v-else>{{ row.organizeMethod }}</span>
        </template>
      </el-table-column>
      <el-table-column label="保管期限" prop="retention" width="90" align="center">
        <template slot-scope="{ row }">
          <span :class="['retention-tag', row.retention === '永久' ? 'forever' : 'limited']">{{ row.retention }}</span>
        </template>
      </el-table-column>
      <el-table-column label="档案类别" prop="category" width="100" align="center" />
      <el-table-column label="分类说明" prop="remark" min-width="140" show-overflow-tooltip />

      <!-- 保存单位（checkbox 区） -->
      <el-table-column label="保存单位" align="center">
        <el-table-column label="设计单位" width="90" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.units.design" @click.native.stop />
          </template>
        </el-table-column>
        <el-table-column label="建设单位" width="90" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.units.build" @click.native.stop />
          </template>
        </el-table-column>
        <el-table-column label="施工单位" width="90" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.units.construct" @click.native.stop />
          </template>
        </el-table-column>
        <el-table-column label="监理单位" width="90" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.units.supervise" @click.native.stop />
          </template>
        </el-table-column>
        <el-table-column label="城建档案馆" width="100" align="center">
          <template slot-scope="{ row }">
            <el-checkbox v-model="row.units.archive" @click.native.stop />
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="增加时间" prop="createTime" width="120" align="center" />
    </el-table>

    <!-- ======= 新增 / 编辑弹窗 ======= -->
    <el-dialog
      :title="form.id ? '修改子项' : '新增子项'"
      :visible.sync="dialogVisible"
      width="640px"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="档案类别" prop="category">
          <el-select v-model="form.category" style="width: 100%" placeholder="请选择档案类别" allow-create filterable>
            <el-option label="项目档案" value="项目档案" />
            <el-option label="文书档案" value="文书档案" />
            <el-option label="科技档案" value="科技档案" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类号" prop="code">
          <el-input v-model="form.code" placeholder="如 XM" />
        </el-form-item>
        <el-form-item label="档号前缀">
          <el-input v-model="form.prefix" placeholder="如 XM-" />
        </el-form-item>
        <el-form-item label="整理方式" prop="organizeMethod">
          <el-row :gutter="10">
            <el-col :span="14">
              <el-select v-model="form.organizeMethod" style="width: 100%">
                <el-option label="按件整理" value="按件整理" />
                <el-option label="按卷整理" value="按卷整理" />
                <el-option label="按件整理+按卷整理" value="按件整理+按卷整理" />
              </el-select>
            </el-col>
            <el-col :span="2" class="form-label-text">年度</el-col>
            <el-col :span="6">
              <el-input v-model="form.year" placeholder="" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="保管期限" prop="retention">
          <el-row :gutter="10">
            <el-col :span="14">
              <el-select v-model="form.retention" style="width: 100%">
                <el-option label="永久" value="永久" />
                <el-option label="长期" value="长期" />
                <el-option label="30年" value="30年" />
                <el-option label="10年" value="10年" />
              </el-select>
            </el-col>
            <el-col :span="2" class="form-label-text">密级</el-col>
            <el-col :span="6">
              <el-select v-model="form.securityClass" style="width: 100%" placeholder="请选择">
                <el-option label="公开" :value="1" />
                <el-option label="内部" :value="2" />
                <el-option label="秘密" :value="3" />
                <el-option label="机密" :value="4" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="分类说明">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.orderNum" :min="1" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label-width="20px">
          <el-row>
            <el-col :span="12">
              <el-checkbox v-model="form.isMaterial">是否为资料文件</el-checkbox>
            </el-col>
            <el-col :span="12">
              <el-checkbox v-model="form.autoPrefix">自动获取档号前缀</el-checkbox>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitForm">确 定</el-button>
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 从模板选取弹窗 ======= -->
    <el-dialog
      title="从模板选取"
      :visible.sync="templateDialogVisible"
      width="780px"
      top="6vh"
      append-to-body
    >
      <el-row :gutter="12" class="tpl-wrap">
        <!-- 左侧：分类模板列表 -->
        <el-col :span="7">
          <div class="tpl-left">
            <div class="tpl-left-header">分类模板</div>
            <div
              v-for="tpl in templateList"
              :key="tpl.id"
              :class="['tpl-item', { active: tpl.id === selectedTemplateId }]"
              @click="handleTemplateClick(tpl)"
            >
              {{ tpl.name }}
            </div>
          </div>
        </el-col>
        <!-- 右侧：模板下的分类树 -->
        <el-col :span="17">
          <el-table
            ref="tplTable"
            :data="templateTreeData"
            row-key="id"
            :tree-props="{ children: 'children' }"
            border
            size="small"
            height="360"
            @select="handleTplSelect"
            @select-all="handleTplSelect"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="名称" prop="name" min-width="300">
              <template slot-scope="{ row }">
                <i :class="row.children && row.children.length ? 'el-icon-folder-opened tpl-icon' : 'el-icon-document tpl-icon'" />
                <span>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="保管期限" prop="retention" width="90" align="center" />
          </el-table>
        </el-col>
      </el-row>
      <el-checkbox v-model="tplIncludeCurrent" class="tpl-checkbox">包含当前选中节点</el-checkbox>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitTemplate">确 定</el-button>
        <el-button size="small" @click="templateDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 新增WBS工程节点弹窗 ======= -->
    <el-dialog
      title="新增WBS工程节点"
      :visible.sync="wbsDialogVisible"
      width="780px"
      top="6vh"
      append-to-body
    >
      <el-row :gutter="12" class="tpl-wrap">
        <!-- 左侧：工程层级列表 -->
        <el-col :span="7">
          <div class="tpl-left">
            <div class="tpl-left-header">工程</div>
            <div
              v-for="item in wbsLevelList"
              :key="item.id"
              :class="['tpl-item', { active: item.id === selectedWbsLevelId }]"
              @click="handleWbsLevelClick(item)"
            >
              {{ item.name }}
            </div>
          </div>
        </el-col>
        <!-- 右侧：工程项目名 + WBS代码 -->
        <el-col :span="17">
          <el-table
            :data="wbsTableData"
            row-key="id"
            :tree-props="{ children: 'children' }"
            border
            size="small"
            height="360"
            @select="handleWbsSelect"
            @select-all="handleWbsSelect"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="工程项目名" prop="name" min-width="300" />
            <el-table-column label="WBS代码" prop="wbsCode" width="120" align="center" />
          </el-table>
        </el-col>
      </el-row>
      <el-checkbox v-model="wbsIncludeCurrent" class="tpl-checkbox">是否包含当前选择节点</el-checkbox>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitWbs">确 定</el-button>
        <el-button size="small" @click="wbsDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 新增年度弹窗 ======= -->
    <el-dialog
      title="新增年度"
      :visible.sync="yearDialogVisible"
      width="460px"
      append-to-body
    >
      <el-form ref="yearFormRef" :model="yearForm" :rules="yearRules" label-width="80px" size="small">
        <el-form-item label="年度" prop="year">
          <el-date-picker
            v-model="yearForm.year"
            type="year"
            value-format="yyyy"
            placeholder="选择年"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="yearForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="排序号" prop="orderNum">
          <el-input-number v-model="yearForm.orderNum" :min="1" style="width: 100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitYear">确 定</el-button>
        <el-button size="small" @click="yearDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 新增保管期限弹窗 ======= -->
    <el-dialog
      title="新增保管期限"
      :visible.sync="retentionDialogVisible"
      width="460px"
      append-to-body
    >
      <el-form ref="retentionFormRef" :model="retentionForm" :rules="retentionRules" label-width="90px" size="small">
        <el-form-item label="保管期限" prop="retention">
          <el-select v-model="retentionForm.retention" placeholder="请选择" style="width: 100%">
            <el-option label="永久" value="永久" />
            <el-option label="长期" value="长期" />
            <el-option label="30年" value="30年" />
            <el-option label="10年" value="10年" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序号" prop="orderNum">
          <el-input-number v-model="retentionForm.orderNum" :min="1" style="width: 100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitRetention">确 定</el-button>
        <el-button size="small" @click="retentionDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>
    <!-- ======= 排序窗口 ======= -->
    <el-dialog
      title="排序窗口"
      :visible.sync="sortDialogVisible"
      width="1128px"
      top="6vh"
      append-to-body
    >
      <div class="sort-toolbar">
        <el-button size="mini" icon="el-icon-top" @click="handleSortMove('top')">移至顶部</el-button>
        <el-button size="mini" icon="el-icon-arrow-up" @click="handleSortMove('up')">向上</el-button>
        <el-button size="mini" icon="el-icon-arrow-down" @click="handleSortMove('down')">向下</el-button>
        <el-button size="mini" icon="el-icon-bottom" @click="handleSortMove('bottom')">移至末尾</el-button>
        <el-button size="mini" icon="el-icon-position" @click="handleSortMove('goto')">移至</el-button>
        <el-input-number
          v-if="sortAction === 'goto'"
          v-model="sortTargetIndex"
          size="mini"
          :min="1"
          :max="sortList.length"
          controls-position="right"
          style="width: 120px; margin-left: 8px"
        />
      </div>
      <el-table
        :data="sortList"
        border
        size="small"
        height="420"
        highlight-current-row
        @current-change="handleSortRowClick"
      >
        <el-table-column label="分类名称" prop="name" min-width="560" />
        <el-table-column label="分类说明" prop="remark" min-width="330" />
        <el-table-column label="排序号" prop="orderNum" width="120" align="center">
          <template slot-scope="{ row }">
            <el-input-number v-model="row.orderNum" :min="1" size="mini" controls-position="right" style="width: 90px" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitSort">确 定</el-button>
        <el-button size="small" @click="sortDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 复制子节点（详细信息）弹窗 ======= -->
    <el-dialog
      title="详细信息"
      :visible.sync="copyDialogVisible"
      width="900px"
      top="4vh"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="col in detailColumns" :key="col.key" class="detail-row">
          <div class="detail-label">{{ col.label }}</div>
          <div class="detail-value">{{ copyDetail[col.key] }}</div>
        </div>
      </div>
      <div slot="footer">
        <el-button type="primary" size="small" @click="submitCopy">确 定</el-button>
        <el-button size="small" @click="copyDialogVisible = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- ======= 查看详细信息弹窗 ======= -->
    <el-dialog
      title="详细信息"
      :visible.sync="detailDialogVisible"
      width="900px"
      top="4vh"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="col in detailViewColumns" :key="col.key" class="detail-row">
          <div class="detail-label">{{ col.label }}</div>
          <div class="detail-value">{{ detailData[col.key] }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * mock 数据：模拟"柯桥至诸暨高速公路工程"的三层档案分类树
 * 字段与页面表格列一一对应
 */
const MOCK_TREE = [
  {
    id: 1, parentId: 0, level: 1,
    name: '柯桥至诸暨高速公路工程',
    code: '', prefix: '', year: '',
    organizeMethod: '', retention: '', category: '', remark: '',
    createTime: '2022-09-01',
    units: { design: false, build: false, construct: false, supervise: false, archive: false },
    children: [
      {
        id: 11, parentId: 1, level: 2,
        name: '第一部分 项目申报文件',
        code: '1', prefix: '1-', year: '',
        organizeMethod: '按件整理+按卷整理', retention: '永久', category: '项目档案',
        remark: '项目立项、审批相关文件', createTime: '2022-09-01',
        units: { design: false, build: true, construct: false, supervise: false, archive: false },
        children: [
          { id: 111, parentId: 11, level: 3, name: '一、项目建议书及批复、项目申请有关文件',
            code: '1-1', prefix: '1-1-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 112, parentId: 11, level: 3, name: '二、可行性研究报告及批复、可行性论证意见',
            code: '1-2', prefix: '1-2-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 113, parentId: 11, level: 3, name: '三、环境影响报告及批复文件',
            code: '1-3', prefix: '1-3-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 114, parentId: 11, level: 3, name: '四、水土保持方案报告及批复文件',
            code: '1-4', prefix: '1-4-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 115, parentId: 11, level: 3, name: '五、项目咨询、评估、论证文件',
            code: '1-5', prefix: '1-5-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 116, parentId: 11, level: 3, name: '六、投资、特许经营协议',
            code: '1-6', prefix: '1-6-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-11-17',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } },
          { id: 117, parentId: 11, level: 3, name: '七、工程融资贷款计划、资金筹措方案、银行贷款协议',
            code: '1-7', prefix: '1-7-', year: '', organizeMethod: '按件整理+按卷整理',
            retention: '永久', category: '项目档案', remark: '', createTime: '2022-11-17',
            units: { design: false, build: false, construct: false, supervise: false, archive: false } }
        ]
      },
      { id: 12, parentId: 1, level: 2, name: '第二部分 设计文件',
        code: '2', prefix: '2-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: true, construct: false, supervise: false, archive: false } },
      { id: 13, parentId: 1, level: 2, name: '第三部分 工程管理文件',
        code: '3', prefix: '3-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: false, construct: false, supervise: false, archive: false } },
      { id: 14, parentId: 1, level: 2, name: '第四部分 施工文件',
        code: '4', prefix: '4-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: false, construct: false, supervise: false, archive: false } },
      { id: 15, parentId: 1, level: 2, name: '第五部分 监理文件',
        code: '5', prefix: '5-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: false, construct: false, supervise: true, archive: false } },
      { id: 16, parentId: 1, level: 2, name: '第六部分 竣工（交）验收文件',
        code: '6', prefix: '6-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: false, construct: false, supervise: true, archive: false } },
      { id: 17, parentId: 1, level: 2, name: '第七部分 科研文件',
        code: '7', prefix: '7-', year: '', organizeMethod: '按件整理+按卷整理',
        retention: '永久', category: '项目档案', remark: '', createTime: '2022-09-01',
        units: { design: false, build: false, construct: false, supervise: true, archive: false } }
    ]
  }
]

/**
 * 分类模板 mock 数据（从模板选取弹窗）
 * 左侧模板列表 → 右侧模板分类树
 */
const TEMPLATE_LIST = [
  { id: 't1', name: '104国道', tree: [] },
  { id: 't2', name: '柯落高速公路工程', tree: [] },
  {
    id: 't3', name: '施工文件', tree: [
      {
        id: 't3-1', name: '第一部分 项目申报文件', retention: '永久',
        children: [
          { id: 't3-1-1', name: '项目建议书及批复、项目申请有关文件', retention: '永久' },
          { id: 't3-1-2', name: '可行性研究报告及批复、可行性论证意见', retention: '永久' },
          { id: 't3-1-3', name: '环境影响报告及批复', retention: '永久' },
          { id: 't3-1-4', name: '项目用地预审意见', retention: '永久' },
          { id: 't3-1-5', name: '水土保持方案报告、批复及请示', retention: '永久' },
          { id: 't3-1-6', name: '防堍评价报告、批复及请示', retention: '永久' },
          { id: 't3-1-7', name: '通航条件影响评价、批复及请示', retention: '永久' },
          { id: 't3-1-8', name: '社会风险评估、审查意见', retention: '永久' },
          { id: 't3-1-9', name: '地质灾害评估报告、备案登记', retention: '永久' }
        ]
      }
    ]
  },
  { id: 't4', name: '监理文件', tree: [] }
]

/**
 * WBS 工程层级 mock 数据（新增WBS工程节点弹窗）
 * 左侧工程层级 → 右侧项目列表
 */
const WBS_LEVEL_LIST = [
  { id: 'w1', name: '单位工程', items: [] },
  { id: 'w2', name: '分部工程', items: [] },
  { id: 'w3', name: '分项工程', items: [] },
  { id: 'w4', name: '子分项工程', items: [] }
]

import AdaptiveActions from '@/components/AdaptiveActions/index.vue'

export default {
  name: 'ArchiveOrganizeCategory',
  components: { AdaptiveActions },
  data() {
    return {
      loading: false,
      keyword: '',
      showCheckbox: false,
      treeData: [],         // 当前展示数据（keyword 过滤后）
      fullTree: [],         // 完整 mock 树
      currentRow: null,     // 选中行
      multipleSelection: [], // 表格勾选的多选数据
      clipboard: [],        // 复制子节点暂存
      dialogVisible: false,
      form: {},
      rules: {
        category: [{ required: true, message: '请选择档案类别', trigger: 'change' }],
        name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
        organizeMethod: [{ required: true, message: '请选择整理方式', trigger: 'change' }],
        retention: [{ required: true, message: '请选择保管期限', trigger: 'change' }]
      },
      nextId: 1000,

      // ---- 从模板选取弹窗 ----
      templateDialogVisible: false,
      templateList: TEMPLATE_LIST,
      selectedTemplateId: '',
      templateTreeData: [],
      tplSelection: [],
      tplIncludeCurrent: false,

      // ---- 新增WBS工程节点弹窗 ----
      wbsDialogVisible: false,
      wbsLevelList: WBS_LEVEL_LIST,
      selectedWbsLevelId: '',
      wbsTableData: [],
      wbsSelection: [],
      wbsIncludeCurrent: false,

      // ---- 新增年度弹窗 ----
      yearDialogVisible: false,
      yearForm: { year: '', name: '', orderNum: 1 },
      yearRules: {
        year: [{ required: true, message: '请选择年度', trigger: 'change' }],
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        orderNum: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
      },

      // ---- 新增保管期限弹窗 ----
      retentionDialogVisible: false,
      retentionForm: { retention: '', orderNum: 1 },
      retentionRules: {
        retention: [{ required: true, message: '不能为空!', trigger: 'change' }],
        orderNum: [{ required: true, message: '请输入排序号', trigger: 'blur' }]
      },

      // ---- 排序窗口 ----
      sortDialogVisible: false,
      sortList: [],
      sortCurrent: null,
      sortAction: '',
      sortTargetIndex: 1,

      // ---- 复制子节点（详细信息）弹窗 ----
      copyDialogVisible: false,
      copyDetail: {},
      detailColumns: [
        { key: 'name', label: '分类名称' },
        { key: 'code', label: '分类号' },
        { key: 'prefix', label: '档号前缀' },
        { key: 'year', label: '年度' },
        { key: 'department', label: '部' },
        { key: 'volume', label: '册' },
        { key: 'subVolume', label: '分册' },
        { key: 'leader', label: '负责人' },
        { key: 'members', label: '参加人员' },
        { key: 'organizeMethod', label: '整理方式' },
        { key: 'retention', label: '保管期限' },
        { key: 'category', label: '档案类别' },
        { key: 'startNo', label: '起桩号' },
        { key: 'endNo', label: '止桩号' },
        { key: 'remark', label: '分类说明' }
      ],

      // ---- 查看详细信息弹窗 ----
      detailDialogVisible: false,
      detailData: {},
      detailViewColumns: [
        { key: 'name', label: '分类名称' },
        { key: 'code', label: '分类号' },
        { key: 'prefix', label: '档号前缀' },
        { key: 'year', label: '年度' },
        { key: 'department', label: '部' },
        { key: 'volume', label: '册' },
        { key: 'subVolume', label: '分册' },
        { key: 'leader', label: '负责人' },
        { key: 'members', label: '参加人员' },
        { key: 'organizeMethod', label: '整理方式' },
        { key: 'retention', label: '保管期限' },
        { key: 'category', label: '档案类别' },
        { key: 'startNo', label: '起桩号' },
        { key: 'endNo', label: '止桩号' },
        { key: 'startPrefix', label: '起桩号前缀' },
        { key: 'endPrefix', label: '止桩号前缀' },
        { key: 'remark', label: '分类说明' },
        { key: 'sectionInfo', label: '项目桩段信息' },
        { key: 'unitsText', label: '设计单位' },
        { key: 'unitsText2', label: '建设单位' },
        { key: 'unitsText3', label: '施工单位' },
        { key: 'unitsText4', label: '监理单位' },
        { key: 'unitsText5', label: '城建档案馆' },
        { key: 'pathText', label: '所在分类节点路径' }
      ]
    }
  },
  computed: {
    /** 复选框勾选了多条数据（多选时仅删除可用） */
    multipleSelected() {
      return this.multipleSelection.length > 1
    },
    /** 工具栏按钮配置（统一交给 AdaptiveActions 自适应收纳；均不传 type 保持无色） */
    actionItems() {
      const none = !this.currentRow
      const lock = this.multipleSelected || !this.currentRow
      return [
        { key: 'search', label: '搜索', icon: 'el-icon-search' },
        { key: 'refresh', label: '刷新', icon: 'el-icon-refresh' },
        { key: 'add', label: '新增', icon: 'el-icon-plus', disabled: none, children: [
          { key: 'add-single', label: '新增单个分类' },
          { key: 'add-template', label: '从模板选取' },
          { key: 'add-wbs', label: '新增WBS工程节点' }
        ] },
        { key: 'add-year', label: '新增年度', icon: 'el-icon-date', disabled: lock },
        { key: 'add-retention', label: '新增保管期限', icon: 'el-icon-time', disabled: lock },
        { key: 'edit', label: '修改', icon: 'el-icon-edit', disabled: lock },
        { key: 'delete', label: '删除', icon: 'el-icon-delete', disabled: !this.multipleSelection.length && !this.currentRow },
        { key: 'sort', label: '排序', icon: 'el-icon-sort', disabled: lock },
        { key: 'copy', label: '复制子节点', icon: 'el-icon-copy-document', disabled: lock },
        { key: 'paste', label: '粘贴', icon: 'el-icon-bottom-right', disabled: this.multipleSelected || !this.clipboard.length },
        { key: 'detail', label: '查看详细信息', icon: 'el-icon-view', disabled: lock },
        { key: 'toggle-check', label: this.showCheckbox ? '隐藏复选' : '切换复选', icon: 'el-icon-finished' }
      ]
    }
  },
  created() {
    // 深拷贝 mock 数据，避免修改影响原始
    this.fullTree = JSON.parse(JSON.stringify(MOCK_TREE))
    this.treeData = JSON.parse(JSON.stringify(MOCK_TREE))
  },
  methods: {
    /** 自适应按钮条统一分发 */
    onActionClick(item) {
      const map = {
        'search': () => this.handleQuery(),
        'refresh': () => this.resetQuery(),
        'add-single': () => this.handleAddDropdown('single'),
        'add-template': () => this.handleAddDropdown('template'),
        'add-wbs': () => this.handleAddDropdown('wbs'),
        'add-year': () => this.openYearDialog(),
        'add-retention': () => this.openRetentionDialog(),
        'edit': () => this.handleEdit(),
        'delete': () => this.handleDelete(),
        'sort': () => this.handleSort(),
        'copy': () => this.handleCopy(),
        'paste': () => this.handlePaste(),
        'detail': () => this.handleDetail(),
        'toggle-check': () => this.showCheckbox = !this.showCheckbox
      }
      const fn = map[item.key]
      fn && fn()
    },

    /** 搜索：按分类名称关键字过滤（保留祖先路径） */
    handleQuery() {
      if (!this.keyword.trim()) {
        this.treeData = JSON.parse(JSON.stringify(this.fullTree))
        return
      }
      const kw = this.keyword.trim()
      // 递归过滤：命中节点 + 其所有祖先都保留
      const filter = (list) => {
        return list.reduce((acc, node) => {
          const selfHit = node.name.includes(kw)
          const childrenHit = node.children ? filter(node.children) : []
          if (selfHit || childrenHit.length) {
            acc.push({ ...node, children: childrenHit })
          }
          return acc
        }, [])
      }
      this.treeData = filter(this.fullTree)
      this.$message.success(`找到 ${this.countNodes(this.treeData)} 条`)
    },
    countNodes(list) {
      let n = 0
      const walk = (l) => { l.forEach(x => { n++; if (x.children) walk(x.children) }) }
      walk(list)
      return n
    },
    resetQuery() {
      this.keyword = ''
      this.treeData = JSON.parse(JSON.stringify(this.fullTree))
    },

    /** 勾选数据变化（多选时仅删除可用） */
    handleSelectionChange(val) {
      this.multipleSelection = val
    },

    /**
     * 行点击：
     * - 有下级（children 非空）→ 切换下级展示/收起
     * - 无下级 → 选中当前项，并同步行前复选框为选中
     */
    handleRowClick(row) {
      if (row.children && row.children.length) {
        this.$refs.treeTable.toggleRowExpansion(row)
        return
      }
      this.currentRow = row
      const table = this.$refs.treeTable
      if (!table || !this.showCheckbox) return
      this.multipleSelection.forEach(item => {
        if (item.id !== row.id) table.toggleRowSelection(item, false)
      })
      table.toggleRowSelection(row, true)
    },

    /** 新增下拉 */
    handleAddDropdown(cmd) {
      if (cmd === 'template') {
        this.templateDialogVisible = true
        return
      }
      if (cmd === 'wbs') {
        this.wbsDialogVisible = true
        return
      }
      const parent = this.currentRow
      if (!parent) {
        this.$message.warning('请先选择一个上级分类')
        return
      }
      this.form = {
        parentId: parent.id,
        parentName: this.getNodeName(this.fullTree, parent.id) || parent.name,
        category: '项目档案',
        name: '', code: '', prefix: '',
        organizeMethod: '按件整理+按卷整理', year: '',
        retention: '永久', securityClass: '',
        remark: '', orderNum: 1,
        isMaterial: false, autoPrefix: false
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate())
    },

    /** 打开修改弹窗 */
    handleEdit() {
      if (!this.currentRow) return
      const row = this.currentRow
      this.form = {
        id: row.id,
        parentId: row.parentId,
        parentName: this.getNodeName(this.fullTree, row.parentId),
        category: row.category,
        name: row.name, code: row.code, prefix: row.prefix,
        organizeMethod: row.organizeMethod, year: row.year,
        retention: row.retention, securityClass: row.securityClass || '',
        remark: row.remark, orderNum: row.orderNum || 1,
        isMaterial: !!row.isMaterial, autoPrefix: !!row.autoPrefix
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate())
    },

    submitForm() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return
        // 新增：插入 fullTree；修改：同步更新节点
        if (this.form.id) {
          const node = this.findNode(this.fullTree, this.form.id)
          if (node) {
            Object.assign(node, {
              category: this.form.category,
              name: this.form.name, code: this.form.code, prefix: this.form.prefix,
              organizeMethod: this.form.organizeMethod, year: this.form.year,
              retention: this.form.retention, securityClass: this.form.securityClass,
              remark: this.form.remark, orderNum: this.form.orderNum,
              isMaterial: this.form.isMaterial, autoPrefix: this.form.autoPrefix
            })
            // 当前选中行也同步（表格直接绑定 treeData）
            Object.assign(this.currentRow, node)
          }
          this.dialogVisible = false
          this.$message.success('保存成功')
        } else {
          const parent = this.findNode(this.fullTree, this.form.parentId)
          if (!parent) {
            this.$message.warning('上级分类不存在')
            return
          }
          const newNode = {
            id: ++this.nextId, parentId: parent.id, level: parent.level + 1,
            name: this.form.name, code: this.form.code,
            prefix: this.form.autoPrefix ? (parent.code ? `${parent.code}-` : '') : this.form.prefix,
            year: this.form.year, organizeMethod: this.form.organizeMethod,
            retention: this.form.retention, category: this.form.category,
            securityClass: this.form.securityClass, remark: this.form.remark,
            orderNum: this.form.orderNum, isMaterial: this.form.isMaterial,
            createTime: this.today(),
            units: { design: false, build: false, construct: false, supervise: false, archive: false }
          }
          this.insertNode(this.fullTree, parent.id, newNode)
          // 搜索态下保持当前过滤结果
          if (this.keyword.trim()) {
            this.handleQuery()
          } else {
            this.treeData = JSON.parse(JSON.stringify(this.fullTree))
          }
          this.dialogVisible = false
          this.$message.success(`已在「${parent.name}」下新增子项`)
        }
      })
    },

    // ---------- 从模板选取弹窗 ----------
    handleTemplateClick(tpl) {
      this.selectedTemplateId = tpl.id
      this.templateTreeData = JSON.parse(JSON.stringify(tpl.tree))
    },
    handleTplSelect(selection) {
      this.tplSelection = selection
    },
    /** 把模板节点转为分类树新节点 */
    tplNodeToCategory(node, parent, level) {
      return {
        id: ++this.nextId, parentId: parent ? parent.id : 0, level,
        name: node.name, code: '', prefix: '', year: '',
        organizeMethod: '按件整理+按卷整理', retention: node.retention || '永久',
        category: '项目档案', remark: '', createTime: this.today(),
        units: { design: false, build: false, construct: false, supervise: false, archive: false },
        children: (node.children || []).map(c => this.tplNodeToCategory(c, node, level + 1))
      }
    },
    submitTemplate() {
      if (!this.tplSelection.length) {
        this.$message.warning('请先勾选模板节点')
        return
      }
      const parent = this.currentRow
      if (!parent) {
        this.$message.warning('请先选择一个上级分类')
        return
      }
      const parentInFull = this.findNode(this.fullTree, parent.id)
      if (!parentInFull) return
      // 勾选的顶层节点（el-table 树形勾选父节点会自动带子节点）
      const tops = this.tplSelection.filter(n => {
        // 过滤掉父节点也在勾选集中的子节点，避免重复插入
        return !this.tplSelection.some(p => (p.children || []).includes(n))
      })
      tops.forEach(n => {
        this.insertNode(this.fullTree, parent.id, this.tplNodeToCategory(n, null, parentInFull.level + 1))
      })
      this.refreshTree()
      this.templateDialogVisible = false
      this.$refs.tplTable && this.$refs.tplTable.clearSelection()
      this.tplSelection = []
      this.$message.success(`已从模板插入 ${tops.length} 个节点`)
    },

    // ---------- 新增WBS工程节点弹窗 ----------
    handleWbsLevelClick(item) {
      this.selectedWbsLevelId = item.id
      this.wbsTableData = JSON.parse(JSON.stringify(item.items))
    },
    handleWbsSelect(selection) {
      this.wbsSelection = selection
    },
    submitWbs() {
      if (!this.wbsSelection.length) {
        this.$message.warning('请先勾选 WBS 节点')
        return
      }
      const parent = this.currentRow
      if (!parent) {
        this.$message.warning('请先选择一个上级分类')
        return
      }
      const parentInFull = this.findNode(this.fullTree, parent.id)
      if (!parentInFull) return
      this.wbsSelection.forEach(n => {
        this.insertNode(this.fullTree, parent.id, {
          id: ++this.nextId, parentId: parent.id, level: parentInFull.level + 1,
          name: n.name, code: n.wbsCode || '', prefix: '', year: '',
          organizeMethod: '按件整理+按卷整理', retention: '永久', category: '项目档案',
          remark: '', createTime: this.today(),
          units: { design: false, build: false, construct: false, supervise: false, archive: false }
        })
      })
      this.refreshTree()
      this.wbsDialogVisible = false
      const count = this.wbsSelection.length
      this.wbsSelection = []
      this.$message.success(`已插入 ${count} 个 WBS 节点`)
    },

    // ---------- 新增年度弹窗 ----------
    openYearDialog() {
      if (!this.currentRow) return
      this.yearForm = { year: '', name: '', orderNum: 1 }
      this.yearDialogVisible = true
      this.$nextTick(() => this.$refs.yearFormRef && this.$refs.yearFormRef.clearValidate())
    },
    submitYear() {
      this.$refs.yearFormRef.validate(valid => {
        if (!valid) return
        const parent = this.currentRow
        const parentInFull = this.findNode(this.fullTree, parent.id)
        if (!parentInFull) return
        this.insertNode(this.fullTree, parent.id, {
          id: ++this.nextId, parentId: parent.id, level: parentInFull.level + 1,
          name: this.yearForm.name || this.yearForm.year, code: '', prefix: '',
          year: this.yearForm.year,
          organizeMethod: '按件整理+按卷整理', retention: '永久', category: '项目档案',
          remark: '', orderNum: this.yearForm.orderNum, createTime: this.today(),
          units: { design: false, build: false, construct: false, supervise: false, archive: false }
        })
        this.refreshTree()
        this.yearDialogVisible = false
        this.$message.success(`已在「${parent.name}」下新增年度 ${this.yearForm.year}`)
      })
    },

    // ---------- 新增保管期限弹窗 ----------
    openRetentionDialog() {
      if (!this.currentRow) return
      this.retentionForm = { retention: '', orderNum: 1 }
      this.retentionDialogVisible = true
      this.$nextTick(() => this.$refs.retentionFormRef && this.$refs.retentionFormRef.clearValidate())
    },
    submitRetention() {
      this.$refs.retentionFormRef.validate(valid => {
        if (!valid) return
        const parent = this.currentRow
        const parentInFull = this.findNode(this.fullTree, parent.id)
        if (!parentInFull) return
        this.insertNode(this.fullTree, parent.id, {
          id: ++this.nextId, parentId: parent.id, level: parentInFull.level + 1,
          name: this.retentionForm.retention, code: '', prefix: '', year: '',
          organizeMethod: '按件整理+按卷整理', retention: this.retentionForm.retention,
          category: '项目档案', remark: '', orderNum: this.retentionForm.orderNum,
          createTime: this.today(),
          units: { design: false, build: false, construct: false, supervise: false, archive: false }
        })
        this.refreshTree()
        this.retentionDialogVisible = false
        this.$message.success(`已在「${parent.name}」下新增保管期限「${this.retentionForm.retention}」`)
      })
    },

    handleDelete() {
      // 多选批量删除
      if (this.multipleSelection.length > 1) {
        const rows = this.multipleSelection
        const total = rows.reduce((n, r) => n + 1 + this.countNodes(r.children || []), 0)
        this.$confirm(`确认删除选中的 ${rows.length} 项（共 ${total} 个节点）吗？`, '警告', { type: 'warning' })
          .then(() => {
            rows.forEach(r => this.removeNode(this.fullTree, r.id))
            this.treeData = JSON.parse(JSON.stringify(this.fullTree))
            this.$refs.treeTable && this.$refs.treeTable.clearSelection()
            this.currentRow = null
            this.$message.success('删除成功')
          }).catch(() => {})
        return
      }
      if (!this.currentRow) return
      const row = this.currentRow
      const childCount = this.countNodes(row.children || [])
      this.$confirm(`确认删除「${row.name}」${childCount ? `及其 ${childCount} 个子节点` : ''}吗？`, '警告', { type: 'warning' })
        .then(() => {
          this.removeNode(this.fullTree, row.id)
          this.treeData = JSON.parse(JSON.stringify(this.fullTree))
          this.currentRow = null
          this.$message.success('删除成功')
        }).catch(() => {})
    },

    /** 排序：打开排序窗口，对当前节点的同级节点排序 */
    handleSort() {
      if (!this.currentRow) return
      const parentId = this.currentRow.parentId
      const parent = parentId ? this.findNode(this.fullTree, parentId) : null
      const siblings = parent ? (parent.children || []) : this.fullTree
      this.sortList = siblings.map((n, i) => ({
        id: n.id, name: n.name, remark: n.remark || '', orderNum: n.orderNum || i + 1
      }))
      this.sortCurrent = this.sortList.find(x => x.id === this.currentRow.id) || null
      this.sortAction = ''
      this.sortTargetIndex = 1
      this.sortDialogVisible = true
    },
    handleSortRowClick(row) {
      this.sortCurrent = row
    },
    /** 排序窗口：移动按钮 */
    handleSortMove(action) {
      if (!this.sortCurrent) {
        this.$message.warning('请先选择要排序的行')
        return
      }
      this.sortAction = action
      const list = this.sortList
      const i = list.indexOf(this.sortCurrent)
      let j = i
      if (action === 'top') j = 0
      else if (action === 'up') j = Math.max(0, i - 1)
      else if (action === 'down') j = Math.min(list.length - 1, i + 1)
      else if (action === 'bottom') j = list.length - 1
      else if (action === 'goto') j = Math.min(list.length - 1, Math.max(0, this.sortTargetIndex - 1))
      if (j === i) return
      list.splice(i, 1)
      list.splice(j, 0, this.sortCurrent)
      list.forEach((n, idx) => { n.orderNum = idx + 1 })
    },
    submitSort() {
      if (!this.sortList.length) {
        this.sortDialogVisible = false
        return
      }
      // 按排序号排序后写回 fullTree
      const ordered = [...this.sortList].sort((a, b) => a.orderNum - b.orderNum)
      const parentId = this.currentRow.parentId
      const parent = parentId ? this.findNode(this.fullTree, parentId) : null
      const siblings = parent ? (parent.children || []) : this.fullTree
      const actual = ordered.map(o => siblings.find(s => s.id === o.id)).filter(Boolean)
      siblings.forEach(s => { if (!actual.includes(s)) actual.push(s) })
      actual.forEach((n, i) => { n.orderNum = i + 1 })
      if (parent) {
        parent.children = actual
      } else {
        this.fullTree.splice(0, this.fullTree.length, ...actual)
      }
      this.refreshTree()
      this.sortDialogVisible = false
      this.$message.success('排序成功')
    },
    /** 复制子节点：弹窗展示详细信息，确定后复制到剪贴板 */
    handleCopy() {
      if (!this.currentRow) return
      const row = this.currentRow
      this.copyDetail = {
        name: row.name || '', code: row.code || '', prefix: row.prefix || '', year: row.year || '',
        department: row.department || '', volume: row.volume || '', subVolume: row.subVolume || '',
        leader: row.leader || '', members: row.members || '',
        organizeMethod: row.organizeMethod || '', retention: row.retention || '', category: row.category || '',
        startNo: row.startNo != null ? row.startNo : '', endNo: row.endNo != null ? row.endNo : '',
        remark: row.remark || ''
      }
      this.copyDialogVisible = true
    },
    submitCopy() {
      if (!this.currentRow) return
      const clone = JSON.parse(JSON.stringify(this.currentRow))
      const remap = (n) => { n.id = ++this.nextId; (n.children || []).forEach(remap) }
      remap(clone)
      this.clipboard = [clone]
      this.copyDialogVisible = false
      const childCount = (clone.children || []).length
      this.$message.success(`已复制「${clone.name}」${childCount ? `及其 ${childCount} 个子节点` : ''}，请选择目标节点后点击「粘贴」`)
    },
    handlePaste() {
      if (!this.clipboard.length || !this.currentRow) {
        this.$message.warning(this.currentRow ? '剪贴板为空' : '请先选择目标分类')
        return
      }
      // 重写 ID 避免冲突
      const remap = (list) => list.forEach(n => {
        n.id = ++this.nextId
        if (n.children) remap(n.children)
      })
      const cloned = JSON.parse(JSON.stringify(this.clipboard))
      remap(cloned)
      this.insertNode(this.fullTree, this.currentRow.id, ...cloned)
      this.treeData = JSON.parse(JSON.stringify(this.fullTree))
      this.clipboard = []
      this.$message.success('粘贴成功')
    },
    /** 查看详细信息：表格式展示当前行完整信息 */
    handleDetail() {
      if (!this.currentRow) return
      const row = this.currentRow
      const yn = v => (v ? '是' : '否')
      // 所在分类节点路径：从根到当前节点
      const findPath = (list, target, trail) => {
        for (const n of list) {
          const cur = [...trail, n.name]
          if (n.id === target) return cur
          if (n.children) {
            const r = findPath(n.children, target, cur)
            if (r) return r
          }
        }
        return null
      }
      const path = findPath(this.fullTree, row.id, []) || []
      this.detailData = {
        name: row.name || '', code: row.code || '', prefix: row.prefix || '', year: row.year || '',
        department: row.department || '', volume: row.volume || '', subVolume: row.subVolume || '',
        leader: row.leader || '', members: row.members || '',
        organizeMethod: row.organizeMethod || '', retention: row.retention || '', category: row.category || '',
        startNo: row.startNo != null ? row.startNo : '', endNo: row.endNo != null ? row.endNo : '',
        startPrefix: row.startPrefix || '', endPrefix: row.endPrefix || '',
        remark: row.remark || '', sectionInfo: row.sectionInfo || '',
        unitsText: yn(row.units && row.units.design),
        unitsText2: yn(row.units && row.units.build),
        unitsText3: yn(row.units && row.units.construct),
        unitsText4: yn(row.units && row.units.supervise),
        unitsText5: yn(row.units && row.units.archive),
        pathText: path.join(' / ')
      }
      this.detailDialogVisible = true
    },

    // ---------- 树辅助 ----------
    findNode(list, id) {
      for (const n of list) {
        if (n.id === id) return n
        if (n.children) { const r = this.findNode(n.children, id); if (r) return r }
      }
      return null
    },
    getNodeName(list, id) {
      const n = this.findNode(list, id)
      return n ? n.name : ''
    },
    insertNode(list, parentId, ...newNodes) {
      for (const n of list) {
        if (n.id === parentId) {
          n.children = n.children || []
          n.children.push(...newNodes)
          return true
        }
        if (n.children && this.insertNode(n.children, parentId, ...newNodes)) return true
      }
      return false
    },
    removeNode(list, id) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) { list.splice(i, 1); return true }
        if (list[i].children && this.removeNode(list[i].children, id)) return true
      }
      return false
    },
    today() {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    /** fullTree → treeData 同步刷新（兼容搜索态） */
    refreshTree() {
      if (this.keyword.trim()) {
        this.handleQuery()
      } else {
        this.treeData = JSON.parse(JSON.stringify(this.fullTree))
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.category-page {
  padding: 16px 16px 24px;
  background: #fff;
  height: 100%;
}

// ===== 工具栏 =====
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #f7f9fc;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .search-input {
    width: 200px;
    margin-right: 4px;
  }

  // 覆盖 AdaptiveActions 默认右对齐，保持按钮左对齐排列
  // 注意：toolbar-actions 类直接加在组件根元素上（与 .adaptive-actions 同一元素），
  // 必须用同级复合选择器命中，后代选择器永远匹配不到
  ::v-deep .toolbar-actions.adaptive-actions {
    justify-content: flex-end;
  }
}

// ===== 表格图标 =====
.category-icon {
  margin-right: 6px;
  font-size: 15px;
  &.top { color: #e6a23c; }          // 一级：橙色文件夹
  &.leaf { color: #409eff; }         // 叶子：蓝色文档
  color: #606266;                    // 默认：灰文件夹
}
.category-name { font-size: 13px; }

// 保管期限标签
.retention-tag {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 12px;
  &.forever { background: #fef0f0; color: #f56c6c; }
  &.limited { background: #ecf5ff; color: #409eff; }
}

// 保存单位勾选图标（非复选模式下用彩色勾表示已勾）
.unit-check {
  font-size: 16px;
  color: #67c23a;
}

.text-muted { color: #909399; font-size: 13px; }

// 弹窗内行内小标签（年度 / 密级）
::v-deep .form-label-text {
  text-align: center;
  line-height: 32px;
  font-size: 13px;
  color: #606266;
}

// ===== 模板选取 / WBS 弹窗 =====
::v-deep .tpl-wrap {
  .tpl-left {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    height: 360px;
    overflow-y: auto;

    .tpl-left-header {
      padding: 10px 12px;
      font-weight: bold;
      font-size: 13px;
      color: #303133;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;
    }

    .tpl-item {
      padding: 9px 12px;
      font-size: 13px;
      color: #606266;
      cursor: pointer;
      border-bottom: 1px solid #f2f6fc;
      transition: background 0.15s;

      &:hover { background: #f5f7fa; }
      &.active {
        background: #ecf5ff;
        color: #409eff;
        font-weight: bold;
      }
    }
  }

  .tpl-icon {
    margin-right: 6px;
    color: #e6a23c;
  }
}
.tpl-checkbox {
  display: block;
  margin-top: 10px;
  text-align: center;
}

/* ======= 排序窗口 ======= */
.sort-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .el-button + .el-button {
    margin-left: 8px;
  }
}

/* ======= 详细信息（复制子节点）======= */
.detail-table {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ebeef5;

  .detail-row {
    display: flex;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    flex: 0 0 160px;
    padding: 10px 14px;
    background: #f5f7fa;
    color: #606266;
    font-size: 13px;
    border-right: 1px solid #ebeef5;
  }

  .detail-value {
    flex: 1;
    padding: 10px 14px;
    color: #303133;
    font-size: 13px;
    word-break: break-all;
  }
}
</style>
