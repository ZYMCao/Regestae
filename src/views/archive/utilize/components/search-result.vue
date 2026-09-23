<template>
  <!-- 全文检索结果页：统计行 + 左侧结果列表 + 右侧分类检索面板 + 悬浮借阅车 -->
  <div class="search-result">
    <!-- 统计行 -->
    <div class="stats-bar" v-show="!toolsOpen">
      <span class="stats-item">检索词：<em class="kw">{{ keyword }}</em></span>
      <span class="stats-item">检索到：<b>{{ total }}</b>条结果，检索时间：{{ elapsed }}秒</span>
      <span class="tools-link" @click="toggleTools">{{ toolsOpen ? '收起工具' : '检索工具' }}</span>
    </div>

    <!-- 检索工具栏（点击"检索工具"展开/收起） -->
    <div v-show="toolsOpen" class="tools-bar">
      <el-select
        v-for="f in toolFields"
        :key="f.key"
        v-model="toolFilters[f.key]"
        size="mini"
        clearable
        :placeholder="f.label"
        class="tool-item"
        @change="onToolChange(f, $event)"
      >
        <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
      </el-select>
      <div class="bar-ops">
        <span class="bar-op-fold" @click="toggleTools">收起工具</span>
        <span class="bar-op-clear" @click="clearTools">清除</span>
      </div>
    </div>

    <div class="result-body">
      <!-- 左侧：工具栏 + 结果列表 + 分页 -->
      <div class="result-left">
        <div class="list-toolbar">
          <el-checkbox :value="allChecked" border size="mini" class="tool-check" @change="toggleAll">全选</el-checkbox>
          <el-checkbox v-if="type !== 'text'" v-model="grouped" border size="mini" class="tool-check">已组卷</el-checkbox>
          <div class="sort-box">
            <span class="sort-label">排序方式：</span>
            <el-select v-model="sortBy" size="mini" class="sort-select">
              <el-option v-for="s in ['相关度', '档号', '题名', '编制日期']" :key="s" :label="s" :value="s" />
            </el-select>
            <el-select v-model="sortOrder" size="mini" class="sort-select">
              <el-option label="降序" value="降序" />
              <el-option label="升序" value="升序" />
            </el-select>
          </div>
        </div>

        <div class="record-list">
          <div v-for="row in rows" :key="row.id" class="record">
            <el-checkbox
              :value="selectedIds.includes(row.id)"
              class="record-check"
              @change="toggleCheck(row)"
            />
            <div class="record-main">
              <div class="record-title" v-html="highlight(row.title)" @click="emitPreview(row)" />
              <div class="record-meta">
                <span v-for="(m, i) in mainMetaOf(row)" :key="'m' + i" class="meta-item">
                  <label>{{ m.label }}</label>
                  <span v-html="highlight(m.value)" />
                </span>
                <!-- 原文检索：文件内容摘要位于元信息中间 -->
                <div v-if="type === 'text' && row.content" class="record-content" v-html="highlight(row.content)" />
                <span v-for="(m, i) in TAIL_META" :key="'t' + i" class="meta-item">
                  <label>{{ m.label }}</label>
                  <span>{{ m.value }}</span>
                </span>
              </div>
              <div class="record-actions">
                <el-button
                  v-for="btn in actions"
                  :key="btn"
                  size="mini"
                  class="act-btn"
                  @click="onAction(btn, row)"
                >{{ btn }}</el-button>
              </div>
            </div>
          </div>
          <div v-if="!rows.length" class="empty">未检索到匹配结果（演示数据）</div>
        </div>

        <div class="pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :current-page="page"
            :page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            @size-change="onSizeChange"
            @current-change="onPageChange"
          />
        </div>
      </div>

      <!-- 右侧：分类检索 -->
      <div class="facet-panel">
        <div class="facet-title">分类检索</div>
        <div v-for="g in facetGroups" :key="g.name" class="facet-group">
          <div class="facet-group-title">{{ g.name }}</div>
          <div
            v-for="f in g.items"
            :key="f.name"
            class="facet-item"
            :class="{ 'is-active': activeFacet === g.name + ':' + f.name }"
            :title="f.name + '(' + f.count + ')'"
            @click="clickFacet(g, f)"
          >{{ f.name }}({{ f.count }})</div>
        </div>
      </div>
    </div>

    <!-- 悬浮借阅车 -->
    <div class="cart-box">
      <el-badge :value="selectedIds.length" :hidden="!selectedIds.length" class="cart-badge">
        <div class="cart-btn" @click="$message.info(`演示：借阅车共 ${selectedIds.length} 条档案`)">
          <i class="el-icon-shopping-cart-full" />
        </div>
      </el-badge>
    </div>

    <!-- 详细信息弹窗 -->
    <el-dialog
      title="详细信息"
      custom-class="detail-dialog"
      :visible.sync="detail.visible"
      width="860px"
      append-to-body
    >
      <div class="detail-table">
        <div v-for="f in detail.fields" :key="f.label" class="detail-row">
          <div class="detail-label">{{ f.label }}</div>
          <div class="detail-value">{{ f.value }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 查看关联文件弹窗 -->
    <el-dialog
      title="查看关联文件"
      custom-class="rel-dialog"
      :visible.sync="rel.visible"
      width="72%"
      append-to-body
    >
      <!-- 上：文件 -->
      <div class="rel-group">
        <div class="group-bar" @click="rel.fileOpen = !rel.fileOpen">
          <span>文件</span>
          <i :class="rel.fileOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
        <div v-show="rel.fileOpen" class="group-body">
          <el-table
            :data="relFiles"
            border
            size="mini"
            max-height="360"
            :header-cell-style="{ background: '#e9f0f8', color: '#303133' }"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column type="index" label="序号" width="56" align="center" />
            <el-table-column prop="title" label="文件名称" min-width="240" show-overflow-tooltip />
            <el-table-column prop="fileNo" label="文件编号" width="160" show-overflow-tooltip />
            <el-table-column prop="compDate" label="编制日期" width="110" align="center" />
            <el-table-column prop="pages" label="页数" width="70" align="center" />
            <el-table-column prop="sortNo" label="排序" width="70" align="center" />
            <el-table-column prop="archiveType" label="档案类型" width="100" align="center" />
          </el-table>
          <div class="rel-pager">
            <el-pagination
              small
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="relFiles.length"
              :page-size="100"
              :page-sizes="[100]"
              :current-page.sync="relPage"
            />
          </div>
        </div>
      </div>

      <!-- 下：关联文件 -->
      <div class="rel-group">
        <div class="group-bar">
          <span @click="rel.relOpen = !rel.relOpen">关联文件</span>
          <div class="bar-right">
            <div class="bar-tools" @click.stop>
              <el-button size="mini" @click="onRelTool('查看PDF文件')"><i class="el-icon-document" /> 查看PDF文件</el-button>
              <el-button size="mini" @click="onRelTool('查看原文件')"><i class="el-icon-picture-outline" /> 查看原文件</el-button>
              <el-button size="mini" @click="onRelTool('查看详细信息')"><i class="el-icon-user" /> 查看详细信息</el-button>
              <el-dropdown trigger="click" @command="onRelTool">
                <el-button size="mini"><i class="el-icon-more" /></el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="在线浏览利用">在线浏览利用</el-dropdown-item>
                  <el-dropdown-item command="纸质档案借阅">纸质档案借阅</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <i
              :class="rel.relOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"
              class="bar-arrow"
              @click="rel.relOpen = !rel.relOpen"
            />
          </div>
        </div>
        <div v-show="rel.relOpen" class="group-body">
          <el-table
            :data="relRelated"
            border
            size="mini"
            max-height="360"
            empty-text="暂无数据"
            :header-cell-style="{ background: '#e9f0f8', color: '#303133' }"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column type="index" label="序号" width="56" align="center" />
            <el-table-column prop="title" label="文件名称" min-width="240" show-overflow-tooltip />
            <el-table-column prop="fileNo" label="文件编号" width="160" show-overflow-tooltip />
            <el-table-column prop="compDate" label="编制日期" width="110" align="center" />
            <el-table-column prop="pages" label="页数" width="70" align="center" />
            <el-table-column prop="sortNo" label="排序" width="70" align="center" />
            <el-table-column prop="archiveType" label="档案类型" width="100" align="center" />
          </el-table>
          <div class="rel-pager">
            <el-pagination
              small
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="relRelated.length"
              :page-size="100"
              :page-sizes="[100]"
              :current-page.sync="relPage2"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 查看文件记录弹窗 -->
    <el-dialog
      title="查看文件记录"
      custom-class="filerec-dialog"
      :visible.sync="fileRec.visible"
      width="880px"
      append-to-body
    >
      <!-- 上：卷内目录 -->
      <div class="rel-group">
        <div class="group-bar" @click="fileRec.catOpen = !fileRec.catOpen">
          <span>卷内目录</span>
          <i :class="fileRec.catOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        </div>
        <div v-show="fileRec.catOpen" class="group-body">
          <el-table
            :data="fileRecRows"
            border
            size="mini"
            max-height="320"
            :header-cell-style="{ background: '#e9f0f8', color: '#303133' }"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column type="index" label="序号" width="56" align="center" />
            <el-table-column prop="title" label="文件题名" min-width="220" sortable show-overflow-tooltip />
            <el-table-column prop="docNo" label="文号" width="100" show-overflow-tooltip />
            <el-table-column prop="compDate" label="编制日期" width="110" sortable align="center" />
            <el-table-column prop="duty" label="责任者" min-width="170" sortable show-overflow-tooltip />
            <el-table-column prop="pages" label="页数" width="70" sortable align="center" />
          </el-table>
          <div class="rel-pager">
            <el-pagination
              small
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="fileRecRows.length"
              :page-size="100"
              :page-sizes="[100]"
              :current-page.sync="fileRecPage"
            />
          </div>
        </div>
      </div>

      <!-- 下：文件 -->
      <div class="rel-group">
        <div class="group-bar">
          <span @click="fileRec.fileOpen = !fileRec.fileOpen">文件</span>
          <div class="bar-right">
            <div class="bar-tools" @click.stop>
              <el-button size="mini" @click="onFileRecTool('查看PDF文件')"><i class="el-icon-document" /> 查看PDF文件</el-button>
              <el-button size="mini" @click="onFileRecTool('查看原文件')"><i class="el-icon-picture-outline" /> 查看原文件</el-button>
              <el-button size="mini" @click="onFileRecTool('查看详细信息')"><i class="el-icon-user" /> 查看详细信息</el-button>
              <el-dropdown trigger="click" @command="onFileRecTool">
                <el-button size="mini"><i class="el-icon-more" /></el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="在线浏览利用">在线浏览利用</el-dropdown-item>
                  <el-dropdown-item command="纸质档案借阅">纸质档案借阅</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <i
              :class="fileRec.fileOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"
              class="bar-arrow"
              @click="fileRec.fileOpen = !fileRec.fileOpen"
            />
          </div>
        </div>
        <div v-show="fileRec.fileOpen" class="group-body">
          <el-table
            :data="fileRecFiles"
            border
            size="mini"
            max-height="320"
            empty-text="暂无数据"
            :header-cell-style="{ background: '#e9f0f8', color: '#303133' }"
          >
            <el-table-column type="selection" width="42" align="center" />
            <el-table-column type="index" label="序号" width="56" align="center" />
            <el-table-column prop="title" label="文件名称" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fileNo" label="文件编号" width="140" show-overflow-tooltip />
            <el-table-column prop="compDate" label="编制日期" width="100" align="center" />
            <el-table-column prop="pages" label="页数" width="60" align="center" />
            <el-table-column prop="sortNo" label="排序" width="60" align="center" />
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="emitPreview(scope.row)">预览</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="rel-pager">
            <el-pagination
              small
              background
              layout="total, prev, pager, next, jumper, sizes"
              :total="fileRecFiles.length"
              :page-size="100"
              :page-sizes="[100]"
              :current-page.sync="fileRecPage2"
            />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/** 元信息公共尾部：知识标签 / 借阅情况 / 在线浏览利用 / 纸质档案借阅 */
const TAIL_META = [
  { label: '知识标签', value: '[]' },
  { label: '借阅情况', value: '' },
  { label: '在线浏览利用', value: '(未借阅)' },
  { label: '纸质档案借阅', value: '(未借阅)' }
]

/** 演示数据池 */
const POOLS = {
  // 卷级检索
  roll: [
    { id: 'roll-1', title: '柯桥至诸暨高速公路工程第TJ01标段校准证书（JK-230912222～JK230912283）', code: 'KZGS-TJ01-0139', org: '浙江交工集团股份有限公司', startDate: '2023-09-13', endDate: '2023-09-13', secret: '', term: '30年', addPerson: '李俊杰', addDate: '2026-03-18', type: '案卷' },
    { id: 'roll-2', title: '柯桥至诸暨高速公路工程第TJ02标段青山顺隧道右洞K9+550-K9+805仰坡开挖分项工程检验申请和中间检验审批表', code: 'KZGS-TJ02-2222', org: '中交第二公路工程局有限公司', startDate: '2023-10-18', endDate: '2023-12-21', secret: '', term: '30年', addPerson: '白晓洁', addDate: '2024-03-11', type: '案卷' },
    { id: 'roll-3', title: '柯桥至诸暨高速公路工程第TJ03标段DK0+428.301姚江互通D匝道桥5#桥墩基础及下部构造分项工程检验申请和中间交验审批表', code: 'KZGS-TJ03-2222', org: '中交路桥建设有限公司', startDate: '2024-06-30', endDate: '2024-10-25', secret: '', term: '30年', addPerson: '一键归档', addDate: '2024-06-18', type: '案卷' },
    { id: 'roll-4', title: '柯桥至诸暨高速公路工程第TJ04标段K36+572.502～K39+271.579学院路高架全幅26#墩基础及下部构造分项工程检验申请和中间交验审批表', code: 'KZGS-TJ04-2222', org: '中交建筑股份有限公司', startDate: '2023-07-05', endDate: '2023-08-25', secret: '', term: '30年', addPerson: '一键归档', addDate: '2023-11-15', type: '案卷' },
    { id: 'roll-5', title: '柯桥至诸暨高速公路工程第TJ01标段HK0+129.05～HK0+341.49漓渚互通H匝道桥第9跨上部构造预制和安装分项工程检验申请和中间交验审批表', code: 'KZGS-TJ01-2222', org: '浙江交工集团股份有限公司', startDate: '2023-06-23', endDate: '2024-10-15', secret: '', term: '30年', addPerson: '骆洪恩', addDate: '2024-12-03', type: '案卷' }
  ],
  // 件级检索
  piece: [
    { id: 'piece-1', title: '桥梁工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0695', fileNo: 'BG-KZGS-TJ03-CJL-2025-01-032', duty: 'CJL-2025-01-010', compDate: '2025-01-20', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' },
    { id: 'piece-2', title: '桥梁、路基工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0695', fileNo: 'BG-KZGS-TJ03-CJL-2025-01-031', duty: 'CJL-2025-01-010', compDate: '2025-01-19', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' },
    { id: 'piece-3', title: '桥梁工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0696', fileNo: 'BG-KZGS-TJ03-CJL-2025-04-028', duty: 'CJL-2025-03-001', compDate: '2025-04-29', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' },
    { id: 'piece-4', title: '桥梁工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0696', fileNo: 'BG-KZGS-TJ03-CJL-2025-04-025', duty: 'CJL-2025-03-001', compDate: '2025-04-27', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' },
    { id: 'piece-5', title: '桥梁、路基工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0696', fileNo: 'BG-KZGS-TJ03-CJL-2025-04-027', duty: 'CJL-2025-03-001', compDate: '2025-04-27', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' },
    { id: 'piece-6', title: '桥梁、路基工程粗集料（碎石、卵石）原材料报验单', code: 'KZGS-TJ03-0696', fileNo: 'BG-KZGS-TJ03-CJL-2025-04-026', duty: 'CJL-2025-03-001', compDate: '2025-04-27', addPerson: '张鲁莎', addDate: '2025-08-19', type: '文件' }
  ],
  // 原文检索
  text: [
    {
      id: 'text-1', title: '2022 25 青山隧道 质检单', attach: '2022 25 青山隧道 质检单', originName: '2022 25 青山隧道 2023.03.03.pdf',
      code: 'KZGS-TJ01-0765', tableNo: 'TJJ-2023-01-03-002', compDate: '2023-03-13', addPerson: '李俊杰', addDate: '2023-06-29', type: '原文',
      content: '文件内容：本质检单为青山隧道工程质量检查记录，检查内容包括开挖支护、初期支护、二衬浇筑等分项工程，各检查项目均按设计及规范要求执行，检验结果合格。'
    },
    {
      id: 'text-2', title: '高边坡监测月报（2024年1月26日~2024年2月25日）', attach: '高边坡监测月报（2024年1月26日~2024年2月25日）', originName: '3标高边坡监测月报24.1.26-24.2.25.pdf',
      code: 'KZGS-TJ03-0275', tableNo: 'TJ03-（高边坡）R-2024-1-26~2024-2-25', compDate: '2024-02-25', addPerson: '张鲁莎', addDate: '2025-09-02', type: '原文',
      content: '文件内容：本报告为高边坡监测月报，监测坡段为桩号K20+405-K20+516左边坡及K20+700-K20+918右测段边坡，对各监测点水平位移、垂直位移、深层水平位移及地下水位进行了周期性观测，监测数据均在控制值范围内，边坡整体处于稳定状态，监测结论与建议详见附表。'
    },
    {
      id: 'text-3', title: '高边坡监测月报（2023年12月26日~2024年1月25日）', attach: '高边坡监测月报（2023年12月26日~2024年1月25日）', originName: '3标高边坡监测月报23.12.26-24.1.25.pdf',
      code: 'KZGS-TJ03-0275', tableNo: 'TJ03-（高边坡）R-2023-12-26~2024-1-25', compDate: '2024-01-25', addPerson: '张鲁莎', addDate: '2025-09-02', type: '原文',
      content: '文件内容：本报告为高边坡监测月报，监测坡段为桩号K20+405-K20+516及K20+700-K20+918段边坡，本周期共完成监测点位移观测、沉降观测及裂缝观测等各项观测，观测数据未见异常，边坡处于稳定状态，后续将按监测方案继续实施周期观测。'
    },
    {
      id: 'text-4', title: '202212-001', attach: '202212-001', originName: '202212-001.pdf',
      code: 'KZGS-LJ02-0166', tableNo: '202212-001', compDate: '2025-09-03', addPerson: '刘红杰', addDate: '2026-02-01', type: '原文',
      content: '文件内容：交通工程（检测师）31620220601020052899交通工程（检测师）31620201101030033501桥梁、隧道、交通工程师审核该人道路工程（检测师）316201711002385桥梁工程师31620220601020052899交通工程（检测师）检测内容本次对该项目店口互通E匝道1号桥（Z匝道桥）桥台桩基进行了完整性（声波透射法）检测，共检测8根。'
    }
  ]
}

/** 右侧分类检索分组 */
const FACETS = {
  roll: [
    {
      name: '所属标段',
      items: [
        { name: '柯桥至诸暨高速公路工程第TJ01标段项目', count: 2 },
        { name: '柯桥至诸暨高速公路工程第TJ02标段项目', count: 1 },
        { name: '柯桥至诸暨高速公路工程第TJ03标段项目', count: 1 },
        { name: '柯桥至诸暨高速公路工程第TJ04标段项目', count: 1 }
      ]
    },
    { name: '档案类别', items: [{ name: '项目档案', count: 5 }] },
    { name: '编制日期(年度)', items: [{ name: '2023', count: 2 }, { name: '2024', count: 2 }, { name: '2025', count: 1 }] },
    { name: '保管期限', items: [{ name: '30年', count: 5 }] },
    { name: '密级', items: [{ name: '未定密', count: 5 }] },
    { name: '档案类型', items: [{ name: '电子标签', count: 4 }, { name: '数字化档案', count: 1 }] }
  ],
  piece: [
    {
      name: '标段',
      items: [
        { name: '柯桥至诸暨高速公路工程第TJ04标段项目', count: 70260 },
        { name: '柯桥至诸暨高速公路工程LJ02监理工程师', count: 56912 },
        { name: '柯桥至诸暨高速公路工程第TJ01标段项目', count: 52846 },
        { name: '柯桥至诸暨高速公路工程第TJ02标段项目', count: 49066 },
        { name: '柯桥至诸暨高速公路工程第TJ03标段项目', count: 48648 },
        { name: '柯桥至诸暨高速公路工程LJ01监理工程师', count: 24807 },
        { name: '柯桥至诸暨高速公路建及绿化工程第I', count: 8994 },
        { name: '柯桥至诸暨高速公路工程', count: 8546 },
        { name: '柯桥至诸暨高速公路交通安全设施工', count: 3665 },
        { name: '柯桥至诸暨高速公路机电工程第JD02', count: 925 }
      ]
    },
    { name: '档案类别', items: [{ name: '项目档案', count: 311574 }, { name: '照片档案', count: 13475 }, { name: '录像档案', count: 1427 }] },
    { name: '编制日期(年度)', items: [{ name: '2005', count: 2 }, { name: '2017', count: 2 }, { name: '2019', count: 21 }, { name: '2020', count: 33 }, { name: '2021', count: 46 }] }
  ],
  text: [
    { name: '档案类别', items: [{ name: '项目档案', count: 2363101 }, { name: '照片档案', count: 12194 }, { name: '录像档案', count: 1165 }] },
    {
      name: '编制日期(年度)',
      items: [
        { name: '1900', count: 2 }, { name: '1905', count: 2 }, { name: '2002', count: 2 }, { name: '2005', count: 2 },
        { name: '2013', count: 22 }, { name: '2014', count: 7 }, { name: '2017', count: 1 }, { name: '2018', count: 1 },
        { name: '2019', count: 31 }, { name: '2020', count: 105 }, { name: '2021', count: 137 }, { name: '2022', count: 13206 },
        { name: '2023', count: 802763 }, { name: '2024', count: 122073 }, { name: '2025', count: 337385 }, { name: '2026', count: 17505 },
        { name: '2027', count: 4 }, { name: '2030', count: 3 }, { name: '2032', count: 1 }, { name: '2034', count: 1 },
        { name: '2041', count: 1 }, { name: '2050', count: 1 }, { name: '2202', count: 2 }
      ]
    }
  ]
}

/** 检索工具栏字段（按检索类型） */
const TOOL_FIELDS = {
  roll: [
    { key: 'degree', label: '检索度', options: ['精确', '模糊'] },
    { key: 'match', label: '匹配度', options: ['高', '中', '低'] },
    { key: 'title', label: '案卷题名', options: ['包含', '不包含'] },
    { key: 'tags', label: '知识标签', options: ['有', '无'] },
    { key: 'code', label: '档号', options: ['包含', '不包含'] },
    { key: 'org', label: '编制单位', options: ['包含', '不包含'] },
    { key: 'date', label: '编制日期', options: ['升序', '降序'] },
    { key: 'secret', label: '密级', options: ['未定密', '秘密', '机密'] },
    { key: 'term', label: '保管期限', options: ['10年', '30年', '永久'] },
    { key: 'atype', label: '档案类型', options: ['数字化档案', '电子档案'] },
    { key: 'person', label: '增加人', options: ['包含', '不包含'] },
    { key: 'addDate', label: '增加日期', options: ['升序', '降序'] }
  ],
  piece: [
    { key: 'degree', label: '检索度', options: ['精确', '模糊'] },
    { key: 'match', label: '匹配度', options: ['高', '中', '低'] },
    { key: 'title', label: '文件题名', options: ['包含', '不包含'] },
    { key: 'tags', label: '知识标签', options: ['有', '无'] },
    { key: 'code', label: '档号', options: ['包含', '不包含'] },
    { key: 'fileNo', label: '文件编号', options: ['包含', '不包含'] },
    { key: 'duty', label: '责任者', options: ['包含', '不包含'] },
    { key: 'date', label: '编制日期', options: ['升序', '降序'] },
    { key: 'term', label: '保管期限', options: ['10年', '30年', '永久'] },
    { key: 'atype', label: '档案类型', options: ['数字化档案', '电子档案'] },
    { key: 'person', label: '增加人', options: ['包含', '不包含'] },
    { key: 'addDate', label: '增加日期', options: ['升序', '降序'] }
  ],
  text: [
    { key: 'degree', label: '检索度', options: ['精确', '模糊'] },
    { key: 'match', label: '匹配度', options: ['高', '中', '低'] },
    { key: 'attach', label: '附件', options: ['有', '无'] },
    { key: 'originName', label: '原文件名', options: ['包含', '不包含'] },
    { key: 'tags', label: '知识标签', options: ['有', '无'] },
    { key: 'code', label: '档号', options: ['包含', '不包含'] },
    { key: 'tableNo', label: '文件表格编号', options: ['包含', '不包含'] },
    { key: 'date', label: '编制日期', options: ['升序', '降序'] },
    { key: 'term', label: '保管期限', options: ['10年', '30年', '永久'] },
    { key: 'atype', label: '档案类型', options: ['数字化档案', '电子档案'] },
    { key: 'person', label: '增加人', options: ['包含', '不包含'] },
    { key: 'addDate', label: '增加日期', options: ['升序', '降序'] }
  ]
}

export default {
  name: 'SearchResult',
  props: {
    // 检索方式：roll=卷级 / piece=件级 / text=原文
    type: { type: String, required: true },
    // 检索词
    keyword: { type: String, default: '' },
    // 检索门类
    category: { type: String, default: '全门类' }
  },
  data() {
    return {
      TAIL_META,
      rows: [],
      total: 0,
      elapsed: '0.000',
      page: 1,
      pageSize: 20,
      selectedIds: [],
      grouped: false,
      sortBy: '相关度',
      sortOrder: '降序',
      activeFacet: '',
      // 详细信息弹窗
      detail: { visible: false, fields: [] },
      // 查看关联文件弹窗
      rel: { visible: false, fileOpen: true, relOpen: true },
      relFiles: [],
      relRelated: [],
      relPage: 1,
      relPage2: 1,
      // 检索工具栏
      toolsOpen: false,
      toolFilters: {},
      // 查看文件记录弹窗
      fileRec: { visible: false, catOpen: true, fileOpen: true },
      fileRecRow: {},
      fileRecRows: [],
      fileRecFiles: [],
      fileRecPage: 1,
      fileRecPage2: 1
    }
  },
  computed: {
    facetGroups() {
      return FACETS[this.type] || []
    },
    actions() {
      return this.type === 'text'
        ? ['详细信息', '查看原始文件', '查看PDF', '查看关联文件', '在线浏览利用', '纸质档案借阅', '预览', '收藏']
        : ['详细信息', '查看案卷PDF', '查看文件', '在线浏览利用', '纸质档案借阅', '预览', '收藏']
    },
    allChecked() {
      return this.rows.length > 0 && this.rows.every(r => this.selectedIds.includes(r.id))
    },
    /** 检索工具栏字段 */
    toolFields() {
      return TOOL_FIELDS[this.type] || []
    }
  },
  watch: {
    type() { this.page = 1; this.doSearch() },
    keyword() { this.page = 1; this.doSearch() },
    category() { this.page = 1; this.doSearch() }
  },
  created() {
    this.doSearch()
  },
  methods: {
    /** 执行检索（演示：生成当前页数据与耗时） */
    doSearch() {
      this.elapsed = (Math.random() * 2 + 0.3).toFixed(3)
      this.selectedIds = []
      this.activeFacet = ''
      if (this.type === 'roll') {
        this.total = POOLS.roll.length
        this.rows = POOLS.roll.map(r => ({ ...r }))
        return
      }
      // 件级/原文：模拟大数据量，按页生成
      this.total = 10000
      const pool = POOLS[this.type]
      const start = (this.page - 1) * this.pageSize
      this.rows = Array.from({ length: this.pageSize }, (_, i) => {
        const base = pool[(start + i) % pool.length]
        const row = { ...base, id: `${this.type}-${start + i}` }
        // 文件编号随页码递增，模拟分页数据
        if (row.fileNo) row.fileNo = row.fileNo.replace(/(\d+)$/, m => String(Number(m) + start + i))
        return row
      })
    },
    onSizeChange(size) {
      this.pageSize = size
      this.page = 1
      this.doSearch()
    },
    onPageChange(p) {
      this.page = p
      this.doSearch()
    },
    /** 当前记录元信息（tail 之前的部分） */
    mainMetaOf(row) {
      if (this.type === 'roll') {
        return [
          { label: '档号', value: row.code },
          { label: '编制单位', value: row.org },
          { label: '编制起日期', value: row.startDate },
          { label: '编制止日期', value: row.endDate },
          { label: '密级', value: row.secret },
          { label: '保管期限', value: row.term },
          { label: '增加人', value: row.addPerson },
          { label: '增加日期', value: row.addDate }
        ]
      }
      if (this.type === 'piece') {
        return [
          { label: '档号', value: row.code },
          { label: '文件编号', value: row.fileNo },
          { label: '责任者', value: row.duty },
          { label: '编制日期', value: row.compDate },
          { label: '增加人', value: row.addPerson },
          { label: '增加日期', value: row.addDate }
        ]
      }
      return [
        { label: '附件', value: row.attach },
        { label: '原文件名', value: row.originName },
        { label: '档号', value: row.code },
        { label: '文件/表格编号', value: row.tableNo },
        { label: '编制日期', value: row.compDate },
        { label: '增加人', value: row.addPerson },
        { label: '增加日期', value: row.addDate }
      ]
    },
    /** HTML 转义 */
    escapeHtml(val) {
      return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    },
    /** 关键词红色高亮（先转义再匹配） */
    highlight(val) {
      const str = this.escapeHtml(val)
      const kw = (this.keyword || '').trim()
      if (!kw) return str
      const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return str.replace(new RegExp(safe, 'gi'), m => `<span class="hl">${m}</span>`)
    },
    toggleAll(checked) {
      const ids = this.rows.map(r => r.id)
      this.selectedIds = checked
        ? Array.from(new Set([...this.selectedIds, ...ids]))
        : this.selectedIds.filter(id => !ids.includes(id))
    },
    toggleCheck(row) {
      const idx = this.selectedIds.indexOf(row.id)
      if (idx >= 0) this.selectedIds.splice(idx, 1)
      else this.selectedIds.push(row.id)
    },
    clickFacet(group, facet) {
      const key = group.name + ':' + facet.name
      this.activeFacet = this.activeFacet === key ? '' : key
      this.$message.info(`演示：按【${group.name}】筛选 ${facet.name}`)
    },
    /** 展开/收起检索工具栏 */
    toggleTools() {
      this.toolsOpen = !this.toolsOpen
    },
    /** 工具栏字段筛选 */
    onToolChange(field, val) {
      if (val) this.$message.info(`演示：按【${field.label}】筛选 ${val}`)
    },
    /** 清除全部工具栏筛选 */
    clearTools() {
      this.toolFilters = {}
      this.$message.success('已清除全部筛选条件')
    },
    onAction(btn, row) {
      if (['预览', '查看PDF', '查看原始文件', '查看案卷PDF'].includes(btn)) {
        this.emitPreview(row)
        return
      }
      if (btn === '详细信息') {
        this.showDetail(row)
        return
      }
      if (btn === '查看关联文件') {
        this.showRelation(row)
        return
      }
      if (btn === '查看文件') {
        this.showFileRecord(row)
        return
      }
      if (btn === '收藏') {
        this.$message.success(`已收藏：${row.title}`)
        return
      }
      this.$message.info(`演示：${btn}`)
    },
    /** 打开详细信息弹窗（按检索类型组装字段，演示数据） */
    showDetail(row) {
      let head = []
      if (this.type === 'roll') {
        head = [
          { label: '案卷名称', value: row.title },
          { label: '档号', value: row.code },
          { label: '编制单位', value: row.org },
          { label: '编制起日期', value: row.startDate },
          { label: '编制止日期', value: row.endDate },
          { label: '密级', value: row.secret || '未定密' },
          { label: '保管期限', value: row.term }
        ]
      } else if (this.type === 'piece') {
        head = [
          { label: '文件名称', value: row.title },
          { label: '知识标签', value: '' },
          { label: '文件编号', value: row.fileNo },
          { label: '责任者', value: row.duty },
          { label: '编制日期', value: row.compDate }
        ]
      } else {
        head = [
          { label: '文件名称', value: row.title },
          { label: '原文件名称', value: row.originName },
          { label: '知识标签', value: '' },
          { label: '文件编号', value: row.tableNo },
          { label: '编制日期', value: row.compDate }
        ]
      }
      const tail = [
        { label: '文件状态', value: '上传成功' },
        { label: '页数', value: '4' },
        { label: '互见号', value: '' },
        { label: '档案类型', value: '数字化档案' },
        { label: '主管签名情况', value: '' },
        { label: '文件来源', value: '上传' },
        { label: '增加人', value: row.addPerson },
        { label: '增加日期', value: row.addDate + ' 00:00:00' },
        { label: '所属模块', value: '预归档案卷' },
        { label: '所在案卷', value: '柯桥至诸暨高速公路工程TJ01标段套筒原材料报验单及评定表（TTJ-2022-01-09-001 ~ TTJ-2023-01-10-001）' },
        { label: '所在文件目录', value: '桥梁工程套筒原材料报验单' },
        { label: '所在分类节点路径', value: '柯桥至诸暨高速公路工程-第二部分 施工文件-柯桥至诸暨高速公路工程TJ01标段项目部施工文件-二、施工基础资料-（三）原材料报验单及汇总表-套筒' }
      ]
      // 案卷本身无上级案卷/文件目录
      const drop = this.type === 'roll' ? ['所在案卷', '所在文件目录'] : []
      this.detail.fields = [...head, ...tail].filter(f => !drop.includes(f.label))
      this.detail.visible = true
    },
    /** 打开查看关联文件弹窗（上：当前文件；下：关联文件，演示为空） */
    showRelation(row) {
      this.rel.fileOpen = true
      this.rel.relOpen = true
      this.relFiles = [{
        id: row.id,
        title: row.title,
        fileNo: row.tableNo || row.fileNo || row.code,
        compDate: row.compDate || row.startDate || '',
        pages: '',
        sortNo: '',
        archiveType: '数字化档案'
      }]
      this.relRelated = []
      this.rel.visible = true
    },
    /** 关联文件工具栏按钮 */
    onRelTool(cmd) {
      if (cmd === '查看原文件') {
        this.emitPreview(this.rel.row)
        return
      }
      if (cmd === '查看详细信息') {
        this.showDetail(this.rel.row)
        return
      }
      this.$message.info(`演示：${cmd}`)
    },
    /** 打开查看文件记录弹窗（上：卷内目录 6 条演示；下：文件，演示为空） */
    showFileRecord(row) {
      this.fileRecRow = row
      this.fileRec.catOpen = true
      this.fileRec.fileOpen = true
      const pages = [31, 31, 31, 31, 29, 24]
      const prefix = (row.title || '').slice(0, 20)
      this.fileRecRows = pages.map((p, i) => ({
        id: i + 1,
        title: `${prefix}2023年${String(i + 8).padStart(2, '0')}月份施工安全巡查日志`,
        docNo: '',
        compDate: '2023-11-30',
        duty: row.org || '中交第二公路工程局有限公司',
        pages: p
      }))
      this.fileRecFiles = []
      this.fileRecPage = 1
      this.fileRecPage2 = 1
      this.fileRec.visible = true
    },
    /** 文件记录弹窗工具栏按钮 */
    onFileRecTool(cmd) {
      if (cmd === '查看原文件') {
        this.emitPreview(this.fileRecRow)
        return
      }
      if (cmd === '查看详细信息') {
        this.showDetail(this.fileRecRow)
        return
      }
      this.$message.info(`演示：${cmd}`)
    },
    emitPreview(row) {
      this.$emit('preview', row)
    }
  }
}
</script>

<style scoped>
.search-result { background: #fff; padding-bottom: 24px; }

/* 统计行 */
.stats-bar { display: flex; align-items: center; padding: 12px 24px; font-size: 13px; color: #606266; }
.stats-item { margin-right: 28px; }
.stats-bar .kw { color: #e02020; font-style: normal; }
.tools-link { margin-left: auto; color: #4a89dc; cursor: pointer; }
.tools-link:hover { text-decoration: underline; }

/* 检索工具栏 */
.tools-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  margin: 0 24px; padding: 6px 12px;
}
.tool-item { width: 88px; margin-right: 8px; }
.tool-item >>> .el-input__inner {
  border: none; padding-left: 2px; color: #606266; background: transparent;
}
.bar-ops { margin-left: auto; flex-shrink: 0; font-size: 13px; }
.bar-op-fold { color: #606266; cursor: pointer; }
.bar-op-fold:hover { color: #4a89dc; }
.bar-op-clear { margin-left: 14px; color: #e02020; cursor: pointer; }
.bar-op-clear:hover { text-decoration: underline; }

.result-body { display: flex; padding: 0 24px; }
.result-left { flex: 1; min-width: 0; }

/* 工具栏 */
.list-toolbar { display: flex; align-items: center; padding: 12px 0; }
.tool-check { margin-right: 12px; }
.sort-box { margin-left: auto; display: flex; align-items: center; }
.sort-label { color: #606266; font-size: 13px; }
.sort-select { width: 110px; margin-left: 8px; }

/* 结果列表 */
.record { display: flex; align-items: flex-start; padding: 12px 4px; }
.record:hover { background: #f8fbff; }
.record-check { margin: 3px 10px 0 0; flex-shrink: 0; }
.record-main { flex: 1; min-width: 0; }
.record-title { display: inline; color: #4a89dc; font-size: 15px; line-height: 22px; cursor: pointer; }
.record-title:hover { text-decoration: underline; }
.record-meta { margin-top: 8px; font-size: 13px; color: #606266; line-height: 24px; }
.meta-item { margin-right: 18px; }
.meta-item label { color: #909399; margin-right: 4px; }
.record-content { margin: 6px 0; color: #606266; line-height: 22px; }
.record-actions { margin-top: 8px; }
.act-btn { margin: 0 10px 6px 0; }
.empty { padding: 60px 0; text-align: center; color: #909399; font-size: 14px; }

/* 关键词高亮（v-html 内容需 deep） */
.record-title >>> .hl,
.record-meta >>> .hl,
.record-content >>> .hl { color: #e02020; font-style: normal; }

/* 分页 */
.pager { padding: 14px 0 4px; }

/* 右侧分类检索 */
.facet-panel { width: 300px; flex-shrink: 0; margin-left: 24px; padding-top: 4px; }
.facet-title { font-size: 18px; font-weight: bold; color: #303133; margin-bottom: 14px; }
.facet-group { margin-bottom: 16px; }
.facet-group-title { font-size: 14px; font-weight: bold; color: #303133; margin-bottom: 6px; }
.facet-item { font-size: 13px; color: #4a89dc; line-height: 24px; cursor: pointer; word-break: break-all; }
.facet-item:hover { text-decoration: underline; }
.facet-item.is-active { color: #e02020; font-weight: bold; }

/* 悬浮借阅车 */
.cart-box { position: fixed; right: 40px; bottom: 60px; z-index: 20; }
.cart-btn {
  width: 48px; height: 48px; border-radius: 6px; background: #4a89dc; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer;
  box-shadow: 0 2px 8px rgba(74, 137, 220, .4);
}
.cart-btn:hover { background: #3273c4; }

/* 详细信息弹窗表格 */
.detail-table { border: 1px solid #e4e7ed; border-bottom: none; }
.detail-row { display: flex; border-bottom: 1px solid #e4e7ed; }
.detail-label {
  width: 170px; flex-shrink: 0; background: #f5f7fa; padding: 12px 14px;
  font-size: 13px; color: #303133; border-right: 1px solid #e4e7ed;
}
.detail-value { flex: 1; min-width: 0; padding: 12px 14px; font-size: 13px; color: #303133; word-break: break-all; }

/* 查看关联文件弹窗 */
.rel-group { margin-bottom: 14px; }
.group-bar {
  display: flex; align-items: center; justify-content: space-between;
  height: 38px; padding: 0 12px; background: #4a89dc; color: #fff;
  font-size: 14px; font-weight: bold; cursor: pointer; user-select: none;
}
.bar-right { display: flex; align-items: center; }
.bar-tools { display: flex; align-items: center; }
.bar-tools .el-button { margin-left: 10px; }
.bar-tools .el-button i { margin-right: 4px; }
.bar-tools .el-dropdown { margin-left: 10px; }
.bar-arrow { margin-left: 12px; font-size: 14px; }
.rel-pager { padding: 10px 2px 0; }
</style>

<style>
.detail-dialog .el-dialog__body { max-height: 62vh; overflow-y: auto; padding: 12px 20px 20px; }
.rel-dialog .el-dialog__body { padding: 14px 20px 20px; max-height: 72vh; overflow-y: auto; }
.filerec-dialog .el-dialog__body { padding: 14px 20px 20px; max-height: 72vh; overflow-y: auto; }
</style>
