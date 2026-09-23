<template>
  <div class="expired-page">
    <!-- 左侧：档案分类目录 -->
    <div class="left-panel">
      <div class="search-bar">
        <el-input v-model="catKeyword" placeholder="搜索分类" size="small" clearable @keyup.enter.native="doFilter">
          <el-button slot="append" icon="el-icon-search" @click="doFilter" />
        </el-input>
      </div>
      <div class="cat-tabs">
        <div :class="['tab-item', tab === 'volume' ? 'active' : '']" @click="switchTab('volume')">按卷管理分类</div>
        <div :class="['tab-item', tab === 'piece' ? 'active' : '']" @click="switchTab('piece')">按件管理分类</div>
      </div>
      <div class="cat-head">
        <span class="cat-title">档案分类目录</span>
        <el-select v-model="expireFilter" size="mini" class="expire-dd" @change="handleExpireFilter">
          <el-option label="到期未鉴定" value="到期未鉴定" />
          <el-option label="全部到期" value="全部到期" />
          <el-option label="已鉴定" value="已鉴定" />
        </el-select>
      </div>
      <div class="tree-wrap">
        <el-tree ref="tree" :data="treeData" node-key="id" highlight-current :expand-on-click-node="false"
          :default-expanded-keys="expandedKeys" :filter-node-method="filterNode" @node-click="handleNodeClick">
          <span slot-scope="{ data }" class="tree-node">
            <i :class="data.type === 'folder' ? 'folder-icon el-icon-folder-opened' : 'file-icon el-icon-document'" />
            <span class="tree-label" :title="data.name + '(' + data.cur + '/' + data.file + ')'">{{ data.name }}({{
              data.cur }}/{{ data.file }})</span>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧：面包屑 + 案卷目录 + 案内文件 -->
    <div class="right-panel">
      <div class="crumb-bar">
        <i class="el-icon-collection-tag crumb-icon" />
        <template v-for="(c, idx) in crumb">
          <a :key="'c' + idx" class="crumb-link" @click="locateNode(c.id)">{{ c.name }}</a>
          <span v-if="idx < crumb.length - 1" :key="'s' + idx" class="crumb-sep">&gt;</span>
        </template>
      </div>

      <!-- 案卷目录（按卷）/ 案卷目录（按件） -->
      <div class="table-block">
        <div class="section-bar">
          <span class="section-title">{{ tab === 'volume' ? '案卷目录' : '文件目录' }}</span>
          <div class="section-tools">
            <el-select v-model="searchField" size="mini" class="field-dd">
              <el-option v-for="col in activeCols" :key="col.prop" :label="col.label" :value="col.prop" />
            </el-select>
            <el-input v-model="keyword" size="mini" class="kw-input" clearable @keyup.enter.native="handleSearch" />
            <el-button size="mini" icon="el-icon-search" class="tool-btn" @click="handleSearch" />
            <el-button size="mini" icon="el-icon-refresh" class="tool-btn" @click="handleRefresh">刷新</el-button>
            <el-button size="mini" icon="el-icon-user" class="tool-btn" @click="handleRollInfo">查看详细信息</el-button>
          </div>
        </div>

        <el-table :data="rollRows" border stripe size="mini" class="roll-table" :height="tab === 'volume' ? 'calc(100% - 90px)' : 'calc(100% - 40px)' "
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column v-for="col in activeCols" :key="col.prop" :prop="col.prop" :label="col.label"
            :min-width="col.width || 110" show-overflow-tooltip sortable align="center" />
        </el-table>

        <div class="pager-bar">
          <span class="pager-total">共 {{ rollTotal }} 条</span>
          <el-pagination layout="prev, pager, next" :total="rollTotal" :page-size="100" :current-page.sync="rollPage"
            class="pager" />
          <span class="pager-jump">前往 <input v-model="rollPageInput" class="page-input" disabled> 页</span>
          <el-select v-model="rollPageSize" size="mini" class="page-size-dd" disabled>
            <el-option label="100条/页" :value="100" />
          </el-select>
        </div>
      </div>

      <!-- 案内文件 -->
      <div class="table-block" v-if="tab === 'piece'">
        <div class="section-bar">
          <span class="section-title">{{ tab === 'volume' ? '案内文件' : '文件' }}</span>
          <div class="section-tools">
            <el-button size="mini" icon="el-icon-refresh" class="tool-btn" @click="handleFileRefresh">刷新</el-button>
            <el-button size="mini" icon="el-icon-document" class="tool-btn" @click="viewFile">查看PDF/A文件</el-button>
            <el-button size="mini" icon="el-icon-user" class="tool-btn" @click="handleFileInfo">查看详细信息</el-button>
          </div>
        </div>
        <el-table :data="fileRows" border stripe size="mini" height="calc(100% - 50px)" class="file-table"
          @selection-change="handleFileSelectionChange">
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column v-for="col in FILE_COLS" :key="col.prop" :prop="col.prop" :label="col.label"
            :min-width="col.width || 110" show-overflow-tooltip sortable />
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="op-btn" @click="viewFile(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
  // 原始分类树数据（静态演示）
  const RAW = [
    {
      name: '柯桥至诸暨高速公路工程', type: 'folder', children: [
        {
          name: '第一部分 项目申报文件', type: 'folder', children: [
            {
              name: '一、项目立项申请及批复', type: 'file', children: [
                { name: '1. 可行性研究报告及批复文件', type: 'file' }
              ]
            },
            { name: '二、可行性研究报告及批...', type: 'file' },
            { name: '三、环境影响报告及批复...', type: 'file' },
            { name: '四、水土保持方案报告及...', type: 'file' },
            { name: '五、项目咨询、评估、论...', type: 'file' },
            { name: '六、投资、特许经营协议(...', type: 'file' },
            { name: '七、工程融资贷款计划、...', type: 'file' }
          ]
        },
        {
          name: '第二部分 设计文件', type: 'folder', children: [
            { name: '一、初步设计及有关审批...', type: 'folder' },
            { name: '二、施工图设计及有关审...', type: 'folder' },
            { name: '三、有关设计问题的来往...', type: 'file' },
            { name: '四、设计技术联系单(0/0)', type: 'file' }
          ]
        },
        { name: '第三部分 工程管理文件', type: 'folder' },
        { name: '第四部分 施工文件', type: 'folder' },
        { name: '第五部分 监理文件', type: 'folder' },
        { name: '第六部分 竣工（交）工验收...', type: 'folder' },
        {
          name: '第七部分 科研文件', type: 'folder', children: [
            { name: '一、窄幅钢箱梁组合梁设计与施工关键技术研究', type: 'file' },
            { name: '二、公路隧道照明提质增效关键技术研究', type: 'file' },
            { name: '三、基于数字可视化的顺畅行车关键技术研究', type: 'file' },
            { name: '四、电子档案单套制中可信保障关键技术研究', type: 'file' },
            { name: '五、智慧高速“交通一通”关键技术研究', type: 'file' },
            { name: '六、基于BIM的建管养一体化关键技术研究', type: 'file' }
          ]
        }
      ]
    }
  ]

  // 按卷管理分类 - 案卷目录列（28列）
  const VOLUME_COLS = [
    { prop: 'dh', label: '档号', width: 120 },
    { prop: 'ajtm', label: '案卷题名', width: 180 },
    { prop: 'bzdw', label: '编制单位', width: 140 },
    { prop: 'bzq', label: '编制起日期', width: 120 },
    { prop: 'bzz', label: '编制止日期', width: 120 },
    { prop: 'kzq', label: '考证起日期', width: 120 },
    { prop: 'kzz', label: '考证止日期', width: 120 },
    { prop: 'zjqk', label: '组卷情况', width: 120 },
    { prop: 'bgqx', label: '保管期限', width: 120 },
    { prop: 'bcbgqx', label: '续存保管期限', width: 150 },
    { prop: 'bcdqsj', label: '续存到期时间', width: 150 },
    { prop: 'mj', label: '密级', width: 100 },
    { prop: 'js', label: '件数', width: 100 },
    { prop: 'ys', label: '页数', width: 100 },
    { prop: 'pdfdx', label: '案卷PDF大小', width: 150 },
    { prop: 'fjzs', label: '附件总数', width: 120 },
    { prop: 'jbgg', label: '脊背规格', width: 120 },
    { prop: 'dalx', label: '档案类型', width: 120 },
    { prop: 'shqk', label: '审核情况', width: 120 },
    { prop: 'sxjyqk', label: '四性检验情况', width: 150 },
    { prop: 'yjqk', label: '移交情况', width: 120 },
    { prop: 'sfkf', label: '是否开放', width: 120 },
    { prop: 'hjh', label: '互见号', width: 120 },
    { prop: 'wzcl', label: '文字材料', width: 120 },
    { prop: 'ty', label: '图样', width: 100 },
    { prop: 'zp', label: '照片', width: 100 },
    { prop: 'bgzt', label: '表格状态', width: 120 },
    { prop: 'bz', label: '备注', width: 120 }
  ]

  // 按件管理分类 - 案卷目录列（27列）
  const PIECE_COLS = [
    { prop: 'wjtm', label: '文件题名', width: 180 },
    { prop: 'wjqk', label: '文件数', width: 100 },
    { prop: 'dh', label: '档号', width: 120 },
    { prop: 'wh', label: '文号', width: 120 },
    { prop: 'hjh', label: '互见号', width: 120 },
    { prop: 'zrz', label: '责任者', width: 110 },
    { prop: 'bgqx', label: '保管期限', width: 120 },
    { prop: 'bcbgqx', label: '续存保管期限', width: 150 },
    { prop: 'bcdqsj', label: '续存到期时间', width: 150 },
    { prop: 'bzrq', label: '编制日期', width: 120 },
    { prop: 'jh', label: '件号', width: 100 },
    { prop: 'ys', label: '页数', width: 100 },
    { prop: 'ck', label: '参考', width: 100 },
    { prop: 'mj', label: '密级', width: 100 },
    { prop: 'pdfdx', label: '案卷PDF大小', width: 150 },
    { prop: 'fjzs', label: '附件总数', width: 120 },
    { prop: 'jbgg', label: '脊背规格', width: 120 },
    { prop: 'dalx', label: '档案类型', width: 120 },
    { prop: 'shqk', label: '审核情况', width: 120 },
    { prop: 'sxjyqk', label: '四性检验情况', width: 150 },
    { prop: 'yjqk', label: '移交情况', width: 120 },
    { prop: 'sfkf', label: '是否开放', width: 120 },
    { prop: 'wzcl', label: '文字材料', width: 120 },
    { prop: 'ty', label: '图样', width: 100 },
    { prop: 'zp', label: '照片', width: 100 },
    { prop: 'bgzt', label: '表格状态', width: 120 },
    { prop: 'bz', label: '备注', width: 120 }
  ]

  // 文件（案内文件）列（10列）
  const FILE_COLS = [
    { prop: 'wjmc', label: '文件名称', width: 180 },
    { prop: 'wjbh', label: '文件编号', width: 120 },
    { prop: 'bzrq', label: '编制日期', width: 120 },
    { prop: 'kzrq', label: '考证日期', width: 120 },
    { prop: 'ys', label: '页数', width: 100 },
    { prop: 'px', label: '排序', width: 100 },
    { prop: 'dalx', label: '档案类型', width: 120 },
    { prop: 'wjzt', label: '文件状态', width: 120 },
    { prop: 'gsxx', label: '格式信息', width: 120 },
    { prop: 'jsjwjdx', label: '计算机文件大小', width: 160 }
  ]

  let _uid = 0
  // 递归构造树节点：id 自增、path 面包屑路径、cur/file 计数
  function build (nodes, parentPath, parentIds) {
    return nodes.map(n => {
      _uid += 1
      const id = _uid
      const path = parentPath.concat(n.name)
      const ids = parentIds.concat(id)
      const node = { id, name: n.name, type: n.type || 'file', path, ids, cur: 0, file: 0, children: [] }
      if (n.children && n.children.length) {
        node.type = 'folder'
        node.children = build(n.children, path, ids)
      }
      return node
    })
  }

  // 按名称查找节点 id
  function findId (nodes, kw) {
    for (const n of nodes) {
      if (n.name.indexOf(kw) > -1) return n.id
      if (n.children && n.children.length) {
        const r = findId(n.children, kw)
        if (r) return r
      }
    }
    return null
  }

  export default {
    name: 'DisposalExpired',
    data () {
      return {
        catKeyword: '',
        tab: 'volume',
        expireFilter: '到期未鉴定',
        treeData: build(RAW, [], []),
        expandedKeys: [],
        crumb: [],
        searchField: '',
        keyword: '',
        rollRows: [],
        fileRows: [],
        rollPage: 1,
        rollPageInput: '1',
        rollPageSize: 100,
        filePage: 1,
        filePageSize: 100,
        selections: [],
        fileSelections: [],
        FILE_COLS: FILE_COLS
      }
    },
    computed: {
      activeCols () {
        return this.tab === 'volume' ? VOLUME_COLS : PIECE_COLS
      },
      rollTotal () {
        return this.rollRows.length
      },
      fileTotal () {
        return this.fileRows.length
      }
    },
    mounted () {
      // 默认定位到「第七部分 科研文件 > 一、窄幅钢箱梁组合梁设计与施工关键技术研究」（与截图一致）
      const id = findId(this.treeData, '一、窄幅钢箱梁组合梁设计与施工关键技术研究')
      if (id) {
        const node = this.findNodeById(this.treeData, id)
        this.$nextTick(() => {
          this.$refs.tree.setCurrentKey(id)
          // 展开祖先
          if (node) this.expandedKeys = node.ids.slice(0, -1)
          this.crumb = node ? node.path.map((name, i) => ({ id: node.ids[i], name })) : []
        })
      }
    },
    methods: {
      findNodeById (nodes, id) {
        for (const n of nodes) {
          if (n.id === id) return n
          if (n.children && n.children.length) {
            const r = this.findNodeById(n.children, id)
            if (r) return r
          }
        }
        return null
      },
      doFilter () {
        this.$refs.tree.filter(this.catKeyword)
      },
      filterNode (value, data) {
        if (!value) return true
        return data.name.indexOf(value) !== -1
      },
      switchTab (t) {
        this.tab = t
      },
      handleExpireFilter () {
        this.$message.info('已切换到期筛选：' + this.expireFilter + '（演示数据）')
      },
      handleNodeClick (data) {
        this.crumb = data.path.map((name, i) => ({ id: data.ids[i], name }))
      },
      locateNode (id) {
        const node = this.findNodeById(this.treeData, id)
        if (!node) return
        this.$refs.tree.setCurrentKey(id)
        this.expandedKeys = node.ids.slice(0, -1)
        this.crumb = node.path.map((name, i) => ({ id: node.ids[i], name }))
      },
      handleSearch () {
        this.$message.info('查询完成，当前分类下无到期档案数据')
      },
      handleRefresh () {
        this.rollRows = []
        this.$message.success('案卷目录已刷新')
      },
      handleRollInfo () {
        if (!this.selections.length) {
          this.$message.warning('请先选择案卷记录')
          return
        }
        this.$message.info('查看案卷详细信息')
      },
      handleFileRefresh () {
        this.fileRows = []
        this.$message.success('文件列表已刷新')
      },
      viewFile () {
        this.$message.info('查看PDF/A文件')
      },
      handleFileInfo () {
        if (!this.fileSelections.length) {
          this.$message.warning('请先选择文件记录')
          return
        }
        this.$message.info('查看文件详细信息')
      },
      handleSelectionChange (rows) {
        this.selections = rows
      },
      handleFileSelectionChange (rows) {
        this.fileSelections = rows
      }
    }
  }
</script>

<style lang="scss" scoped>
  .expired-page {
    display: flex;
    height: 100%;
    background: #fff;
    overflow: hidden;
  }

  .left-panel {
    width: 240px;
    min-width: 240px;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    background: #fff;

    .search-bar {
      padding: 10px 10px 6px;
    }

    .cat-tabs {
      display: flex;
      margin: 0 10px 8px;
      border: 1px solid $themeColor;
      border-radius: 3px;
      overflow: hidden;

      .tab-item {
        flex: 1;
        text-align: center;
        padding: 6px 0;
        font-size: 12px;
        color: $themeColor;
        cursor: pointer;
        background: #fff;

        &.active {
          background: $themeColor;
          color: #fff;
        }
      }
    }

    .cat-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px 6px;

      .cat-title {
        font-size: 13px;
        font-weight: bold;
        color: #303133;
      }

      .expire-dd {
        width: 110px;
      }
    }

    .tree-wrap {
      flex: 1;
      overflow: auto;
      padding: 0 4px 10px;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    font-size: 12px;
    overflow: hidden;

    .folder-icon {
      color: #f7ba2a;
      margin-right: 4px;
    }

    .file-icon {
      color: $themeColor;
      margin-right: 4px;
    }

    .tree-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .right-panel {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .crumb-bar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    font-size: 13px;
    border-bottom: 1px solid #ebeef5;

    .crumb-icon {
      color: $themeColor;
      margin-right: 6px;
    }

    .crumb-link {
      color: $themeColor;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .crumb-sep {
      margin: 0 6px;
      color: #909399;
    }
  }

  .table-block {
    margin-bottom: 4px;
    flex: 1;
    overflow: hidden;
  }

  .section-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: $themeColor;
    padding: 5px 12px;

    .section-title {
      color: #fff;
      font-size: 13px;
      font-weight: bold;
    }

    .section-tools {
      display: flex;
      align-items: center;

      .field-dd {
        width: 110px;
        margin-right: 6px;
      }

      .kw-input {
        width: 160px;
        margin-right: 6px;
      }

      .tool-btn {
        margin-left: 6px;
        font-size: 12px;
      }
    }
  }

  .roll-table,
  .file-table {
    width: 120%;
  }

  .op-btn {
    padding: 0;
    font-size: 12px;
  }

  .pager-bar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-top: 1px solid #ebeef5;
    background: #fafafa;

    .pager-total {
      font-size: 12px;
      color: #606266;
      margin-right: 12px;
    }

    .pager-jump {
      font-size: 12px;
      color: #606266;
      margin: 0 10px;

      .page-input {
        width: 40px;
        height: 24px;
        border: 1px solid #dcdfe6;
        border-radius: 3px;
        text-align: center;
        margin: 0 4px;
      }
    }

    .page-size-dd {
      width: 120px;
    }
  }
</style>