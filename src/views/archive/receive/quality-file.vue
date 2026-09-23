<template>
  <!--
    质量系统文件管理：左侧工程名称树 + 右侧试验检测表格列表
    纯静态 DEMO，不请求接口
  -->
  <div class="quality-file-page">

    <!-- ========== 左侧：工程名称树 ========== -->
    <div class="left-panel">
      <div class="left-search">
        <el-input
          v-model="categoryKeyword"
          placeholder="搜索分类"
          size="small"
          clearable
          @keyup.enter.native="filterTree"
        >
          <el-button slot="append" icon="el-icon-search" @click="filterTree" />
        </el-input>
      </div>
      <div class="left-tree-title">工程名称</div>
      <div class="left-tree-wrap">
        <el-tree
          ref="categoryTree"
          :data="categoryTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
        >
          <span slot-scope="{ data }" class="tree-node">
            <i :class="data.children ? 'el-icon-folder text-warning' : 'el-icon-document text-warning'" />
            <span class="tree-node-label">{{ data.name }}</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- ========== 右侧：试验检测表格列表 ========== -->
    <div class="right-panel">
      <div class="toolbar">
        <el-button size="small" icon="el-icon-refresh" @click="refresh">刷新</el-button>
        <el-button size="small" icon="el-icon-search" @click="doSearch">搜索</el-button>
        <el-button size="small" plain icon="el-icon-document-copy" @click="viewPdf">查看PDF文件</el-button>
        <el-button size="small" plain icon="el-icon-tickets" @click="viewMetadata">查看元数据</el-button>
        <el-button size="small" plain icon="el-icon-time" @click="viewProcess">查看过程数据</el-button>
        <el-button size="small" plain icon="el-icon-collection" :disabled="!currentRow" @click="viewCollectInfo">查看收集信息</el-button>
        <el-button size="small" plain icon="el-icon-paperclip" @click="viewAccessory">查看附件</el-button>
      </div>

      <!-- 质量系统文件收集信息弹窗 -->
      <el-dialog
        title="质量系统文件收集信息"
        :visible.sync="collectDialogVisible"
        width="560px"
        custom-class="collect-info-dialog"
        append-to-body
      >
        <pre class="collect-json">{{ collectJson }}</pre>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" size="small" @click="collectDialogVisible = false">确定</el-button>
        </div>
      </el-dialog>

      <!-- 查看附件弹窗 -->
      <el-dialog
        title="查看附件"
        :visible.sync="accessoryDialogVisible"
        width="620px"
        append-to-body
      >
        <div class="accessory-empty">暂无附件表格</div>
        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="accessoryDialogVisible = false">关闭</el-button>
        </div>
      </el-dialog>

      <el-table
        ref="table"
        v-loading="loading"
        :data="pagedList"
        row-key="id"
        border
        size="small"
        empty-text="暂无数据"
        highlight-current-row
        height="calc(100% - 70px)"
        @current-change="onCurrentChange"
      >
        <el-table-column label="序号" width="60" align="center">
          <template slot-scope="scope">{{ pageStart + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="表格编号" prop="code" width="200" align="center" sortable />
        <el-table-column label="表格名称" prop="name" min-width="260" align="center" show-overflow-tooltip sortable />
        <el-table-column label="工程部位" prop="part" width="150" align="center" show-overflow-tooltip sortable />
        <el-table-column label="检评日期" prop="checkDate" width="110" align="center" sortable />
        <el-table-column label="填表单位" prop="unit" min-width="240" align="center" show-overflow-tooltip sortable />
        <el-table-column label="页数" prop="pages" width="70" align="center" sortable />
        <el-table-column label="收集次数" prop="collectCount" width="90" align="center" sortable />
        <el-table-column label="起点桩号" prop="startStake" width="110" align="center" />
        <el-table-column label="终点桩号" prop="endStake" width="110" align="center" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper, sizes"
          :total="total"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[10, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<script>
/** 工程名称树 mock（与截图层级一致） */
const MOCK_CATEGORY_TREE = [
  {
    id: 1,
    name: '柯桥至诸暨高速公路工程',
    children: [
      {
        id: 11,
        name: '柯桥至诸暨高速公路工程第...',
        children: [
          {
            id: 111,
            name: '改路面面',
            children: [
              { id: 1111, name: '福全枢纽' },
              { id: 1112, name: '福全互通' },
              { id: 1113, name: '主线' },
              { id: 1114, name: '福全连接线' }
            ]
          },
          { id: 112, name: '店口南互通' },
          { id: 113, name: '03省道' },
          { id: 114, name: '朱家坞隧道' },
          { id: 115, name: '瓦片顶隧道' },
          { id: 116, name: '梅里隧道' },
          { id: 117, name: '斯垣圳村桥' },
          { id: 118, name: '线外人行桥' },
          { id: 119, name: '福全枢纽匝道桥' },
          { id: 120, name: '福全枢纽G匝道2号桥' },
          { id: 121, name: '大头山桥右幅' },
          { id: 122, name: '大头山桥左幅' },
          { id: 123, name: '路面工程' },
          { id: 124, name: '绿化及环境保护工程' },
          { id: 125, name: '机电工程' },
          { id: 126, name: '路基工程' },
          { id: 127, name: '绿化工程' },
          { id: 128, name: '管理、养护设施' },
          { id: 129, name: '03省道路面' },
          { id: 130, name: '大侣互通路面' }
        ]
      }
    ]
  }
]

/** 表格编号/名称候选（与截图 24 条一致） */
const MOCK_ROWS = [
  ['JL-TJ01-2023-GJJ-05-023', '钢筋原材料屈服强度、极限强度、伸长率、最大力...'],
  ['BG-TJ01-2024-KZF-07-001（28d）', '矿粉粉试验检测报告'],
  ['JL-TJ01-2025-LQXJL-07-043-01', '细集料颗粒级配(水筛法)、密度(容量瓶法)试验检...'],
  ['JL-STB-202304(TJ01)-007-01', '现场压实度检测记录表(灌砂法)'],
  ['BG-TJ01-2025-MSJ-08-010', '沥青混合料马歇尔试验检测报告(表干法)'],
  ['JL-TJ01-2025-LQKPB-04-004', '矿质混合料配合组成试验检测记录表'],
  ['BG-TJ01-2024-DJCHSL-11-009', '无机结合料稳定材料含水率试验检测报告'],
  ['JL-TJ01-2025-LMSW-KPB-05-054', '矿质混合料配合组成试验检测记录表'],
  ['BG-JL-202504(TJ01)-011', '沥青路面用粗集料试验检测报告'],
  ['BG-TJ01-2025-GLQ-08-041', '改性沥青试验检测报告'],
  ['BG-TJ01-2024-GHJ-11-012', '钢筋焊接试验检测报告'],
  ['JL-TJ01-2023-XJL-10-009', '细集料堆积密度、紧密密度、有害物质含量试验...'],
  ['JL-LMS-202509(TJ01)-054', '沥青路面渗水系数试验检测记录表'],
  ['BG-TJ01-2023-CJL-05-001', '粗集料试验检测报告'],
  ['JL-TJ01-2024-XJL-03-029', '细集料堆积密度、紧密密度、有害物质含量试验...'],
  ['JL-LB-202401(TJ01)-010-01', '锚杆拉拔试验检测记录表'],
  ['JL-TJ01-2025-GZJ-08-023', '路面构造深度试验检测记录表(手工铺砂法)'],
  ['JL-TJ01-2024-JCWCX-10-001', '无机结合料稳定材料无侧限抗压强度试验检测记...'],
  ['JL-TJ01-2024-WCX-08-005', '无机结合料稳定材料无侧限抗压强度试验检测记...'],
  ['BG-SNJL-202406(TJ01)-010', '水泥或石灰剂量试验检测报告(EDTA滴定法)'],
  ['GJJ-2024-01-01-010', '原材料报验单'],
  ['BG-TJ01-2024-JCHSL-10-003', '无机结合料稳定材料含水率试验检测报告'],
  ['JL-TJ01-2025-KPB-02-007', '矿质混合料配合组成试验检测记录表'],
  ['JL-JL-202503-003-003', '粗集料针片状颗粒含量、黏附性、方解石含量、...']
]

const PARTS = ['桥梁、路基、隧...', '桥梁、路基、隧...', '沥青面层、基层', 'ZK5+504.2盖板...', '路面工程/主线K...', '沥青中、下面层', '离诸互通K5+0...', '路面工程', '路面工程（主线...', '沥青面层、防水...', '桥梁工程', '03省道右幅K35...', '桥梁、路基工程', '瓦片顶隧道出口...', '路面工程/店口...', 'YK20+999.52-...', 'LK0+777盖板涵...', 'YK3+238大头...']

/** 生成 62900 条 mock（分页演示用，实际只缓存当前页数据） */
function buildPage(page, pageSize) {
  const units = ['柯桥至诸暨高速公路工程第TJ01标段工地试验室', '柯桥至诸暨高速公路第SYS01标段中心试验室']
  const rows = []
  const startIdx = (page - 1) * pageSize
  for (let i = 0; i < pageSize; i++) {
    const idx = (startIdx + i) % MOCK_ROWS.length
    const m = MOCK_ROWS[idx]
    const date = `20${23 + (idx % 3)}-0${1 + (idx % 9)}-1${idx % 10}`
    rows.push({
      id: startIdx + i + 1,
      code: m[0],
      name: m[1],
      part: PARTS[idx % PARTS.length],
      checkDate: date,
      unit: units[idx % 2],
      pages: idx % 2 + 1,
      collectCount: idx % 4,
      startStake: '0+000.000',
      endStake: '0+000.000'
    })
  }
  return rows
}

export default {
  name: 'ArchiveQualityFile',
  data() {
    return {
      // 左侧树
      categoryKeyword: '',
      categoryTree: MOCK_CATEGORY_TREE,

      // 右侧列表
      total: 62900,
      list: [],
      currentRow: null,
      collectDialogVisible: false,
      collectJson: '',
      accessoryDialogVisible: false,
      page: 1,
      pageSize: 100,
      loading: false
    }
  },
  computed: {
    pagedList() {
      return this.list
    },
    pageStart() {
      return (this.page - 1) * this.pageSize
    }
  },
  created() {
    this.loadPage()
  },
  methods: {
    // ===== 左侧树 =====
    filterTree() {
      this.$refs.categoryTree.filter(this.categoryKeyword)
    },
    filterNode(value, data) {
      if (!value) return true
      return data.name.includes(value)
    },

    // ===== 右侧列表 =====
    /** 模拟分页加载（静态 mock，无需接口） */
    loadPage() {
      this.loading = true
      setTimeout(() => {
        this.list = buildPage(this.page, this.pageSize)
        this.loading = false
      }, 200)
    },
    doSearch() {
      this.page = 1
      this.loadPage()
      this.$message.success('查询成功（静态 DEMO）')
    },
    refresh() {
      this.page = 1
      this.loadPage()
      this.$message.success('刷新成功（静态 DEMO）')
    },
    onCurrentChange(row) {
      this.currentRow = row || null
    },
    viewPdf() {
      window.open('quality-file.pdf')
    },
    viewMetadata() {
      window.open('weepal-file.xml')
    },
    viewProcess() {
      window.open('ViewMetaXml.xml')
    },
    viewCollectInfo() {
      const row = this.currentRow
      if (!row) return
      // 按截图格式构建收集信息 JSON（静态 DEMO，固定值 + 当前行表格编号/名称）
      const contents = [
        '收集ID: F705C936-3DE8-42D9-8F56-368B0E8272D7',
        `表格编号: ${row.code}`,
        `表格名称: ${row.name}`,
        '收集人：李俊杰',
        '收集日期： 2023-07-10 10:28:23',
        '',
        '所在文件目录：桥梁、路基、隧道工程热轧带肋钢筋原材料报验单',
        '文件目录所在路径: 柯桥至诸暨高速公路工程 -> 第四部分 施工文件 -> 柯桥至诸暨高速公路工程TJ01标段项目经理部施工文件 -> 二、施工基础资料 -> （三）原材料报验及汇总表 -> 钢筋',
        '',
        '所在案卷目录: 柯桥至诸暨高速公路工程TJ01标段钢筋原材料报验单（GJJ-2023-01-04-013～GJJ-2023-01-05-011）',
        '案卷目录所在路径: 柯桥至诸暨高速公路工程 -> 第四部分 施工文件 -> 柯桥至诸暨高速公路工程TJ01标段项目经理部施工文件 -> 二、施工基础资料 -> （三）原材料报验及汇总表 -> 钢筋',
        '',
        '删除信息:'
      ].join('\n')
      this.collectJson = `[ { "contents": "${contents}", "kID": "F705C936-3DE8-42D9-8F56-368B0E8272D7" } ]`
      this.collectDialogVisible = true
    },
    viewAccessory() {
      this.accessoryDialogVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.quality-file-page {
  display: flex;
  gap: 8px;
  height: 100%;
  padding: 8px;
  background: #fff;

  // 左侧树
  .left-panel {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .left-search { padding: 8px; }

    .left-tree-title {
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      background: #f5f7fa;
      border-top: 1px solid #ebeef5;
      border-bottom: 1px solid #ebeef5;
    }

    .left-tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 4px;
    }
  }

  // 右侧列表
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .el-table { flex: 1; }

    .pagination-wrap {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }
  }

  .text-warning { color: #e6a23c; }
}

/* 查看附件弹窗空态 */
.accessory-empty {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: #909399;
}
</style>

<style lang="scss">
/* 质量系统文件收集信息弹窗（append-to-body，需全局样式） */
.collect-info-dialog {
  .el-dialog__body {
    padding: 10px 20px;
  }

  .collect-json {
    margin: 0;
    padding: 10px 12px;
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #303133;
    white-space: pre-wrap;
    word-break: break-all;
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    max-height: 60vh;
    overflow: auto;
  }
}
</style>
