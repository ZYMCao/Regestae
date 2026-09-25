<template>
  <div class="search-page">
    <!-- 检索首页：大标题 + 三种检索方式 + 右侧热搜面板 -->
    <div v-if="!searched" class="hero-area">
      <div class="hero-main">
        <div class="hero-title">
          <i class="el-icon-search" />
          <span>全文检索</span>
        </div>
        <div class="hero-search">
          <div class="hero-tabs">
            <div
              v-for="t in searchTypes"
              :key="t.key"
              class="hero-tab"
              :class="{ 
                'is-active': (searchType === '' || searchType === t.key),
                'hero-tab-rt': searchType === ''
              }"
              @click="handleTypeSelect(t.key)"
            >{{ t.label }}</div>
          </div>
          <template v-if="searchType">
            <div class="hero-input">
              <el-input
                ref="searchInput"
                v-model="keyword"
                :placeholder="activePlaceholder"
                clearable
                class="search-input"
                @keyup.enter.native="handleSearch(false)"
              >
                <el-select slot="prepend" v-model="category" class="cat-select">
                  <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
                </el-select>
              </el-input>
              <el-button type="primary" class="search-btn" @click="handleSearch(false)">模糊检索</el-button>
              <el-button type="primary" class="search-btn" @click="handleSearch(true)">精确检索</el-button>
            </div>
            <div class="hero-tip">提示：字符中有空格，系统自动分词，如果检索内容包含空格字符，须加上双引号（半角）</div>
          </template>
        </div>
      </div>

      <!-- 右侧：热门关键词 / 最新归档 -->
      <div class="side-panel">
        <div class="panel-title hot">热门关键词</div>
        <div class="keyword-list">
          <span v-for="kw in hotKeywords" :key="kw" class="keyword-link" @click="handleHotKeyword(kw)">{{ kw }}</span>
        </div>
        <div class="panel-title latest">最新归档</div>
        <ul class="latest-list">
          <li v-for="(item, idx) in latestArchives" :key="item.id" @click="openLatest(item)">
            <span class="dot" />
            <span class="idx">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="txt">{{ item.title }}</span>
            <el-tag size="mini" plain>{{ item.tag }}</el-tag>
          </li>
        </ul>
      </div>
    </div>

    <!-- 检索结果页：tab + 返回 + 二次检索行 + 结果组件 -->
    <div v-else class="result-view">
      <div class="result-head">
        <div class="hero-tabs">
          <div
            v-for="t in searchTypes"
            :key="t.key"
            class="hero-tab"
            :class="{ 'is-active': searchType === t.key }"
            @click="handleTypeSelect(t.key)"
          >{{ t.label }}</div>
        </div>
        <span class="back-link" @click="goBack"><i class="el-icon-refresh-left" /> 返回</span>
      </div>
      <div class="result-search">
        <el-input
          v-model="keyword"
          :placeholder="activePlaceholder"
          clearable
          class="search-input"
          @keyup.enter.native="handleSearch(false)"
        >
          <el-select slot="prepend" v-model="category" class="cat-select">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-input>
        <el-button type="primary" class="search-btn" @click="handleSearch(false)">模糊检索</el-button>
        <el-button type="primary" class="search-btn" @click="handleSearch(true)">精确检索</el-button>
        <el-button type="primary" class="search-btn" @click="handleSearch(false)">二次检索</el-button>
      </div>
      <search-result
        :type="searchType"
        :keyword="appliedKeyword"
        :category="category"
        @preview="openFileViewer"
      />
    </div>

    <el-dialog title="文件查看" custom-class="file-viewer-dialog" :visible.sync="viewer.visible" width="82%" append-to-body>
      <div class="file-meta">
        <span>档号：{{ viewer.row.code }}</span>
        <span>文件类型：{{ viewer.row.type }}</span>
        <span>来源：档案全文检索</span>
      </div>
      <div class="file-canvas">
        <div class="file-page">
          <div class="page-title">{{ viewer.row.title }}</div>
          <div v-for="n in 12" :key="n" class="page-line" />
          <div class="page-stamp">在线预览（演示数据）</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import SearchResult from './components/search-result.vue'

export default {
  name: 'UtilizeSearch',
  components: { SearchResult },
  data() {
    return {
      // 检索方式：roll=卷级检索 / piece=件级检索 / text=原文检索
      searchTypes: [
        { key: 'roll', label: '卷级检索' },
        { key: 'piece', label: '件级检索' },
        { key: 'text', label: '原文检索' }
      ],
      searchType: '',
      keyword: '',
      // 检索门类
      category: '全门类',
      categories: ['全门类', '案卷', '文件'],
      searched: false,
      // 点击检索按钮后固化的检索词，驱动结果组件重检索
      appliedKeyword: '',
      // 右侧面板演示数据
      hotKeywords: ['柱基', '属性', '桃江枢纽G匝道桥', '航道标志', '首件', '报告', '柯诸'],
      latestArchives: [
        { id: 1, code: 'KZGS-Z-0301', title: '柯桥至诸暨高速公路工程漓渚镇朱家坞村房屋拆迁补偿安置协议及附件材料', tag: '案卷' },
        { id: 2, code: 'KZGS-Z-0302', title: '柯桥至诸暨高速公路工程柯岩街道丰项村征地补偿安置协议及支付清单材料', tag: '案卷' },
        { id: 3, code: 'KZGS-Z-0411', title: '柯桥至诸暨高速公路工程第TJ04标段桥梁工程施工技术资料', tag: '案卷' },
        { id: 4, code: 'KZGS-Z-0412', title: '柯桥至诸暨高速公路工程第TJ04标段试验检测报告汇总材料', tag: '案卷' },
        { id: 5, code: 'KZGS-Z-0413', title: '柯桥至诸暨高速公路工程第TJ04标段路基工程质量检验评定资料', tag: '案卷' }
      ],
      viewer: { visible: false, row: {} }
    }
  },
  computed: {
    activePlaceholder() {
      const map = {
        roll: '请输入关键词，检索案卷级档案',
        piece: '请输入关键词，检索文件级档案',
        text: '请输入关键词，检索档案原文内容'
      }
      return map[this.searchType] || '请输入关键词'
    }
  },
  /** 打开本模块时默认收起左侧菜单 */
  created() {
    this.$store.dispatch('app/closeSideBar', false)
  },
  methods: {
    /** 选择检索方式：首页聚焦输入框；结果页切换类型并重新检索 */
    handleTypeSelect(key) {
      this.searchType = key
      if (this.searched) {
        this.handleSearch(false)
      } else {
        this.$nextTick(() => {
          this.$refs.searchInput && this.$refs.searchInput.focus()
        })
      }
    },
    /** 点击热门关键词：默认按卷级检索直接检索 */
    handleHotKeyword(kw) {
      if (!this.searchType) this.searchType = 'roll'
      this.keyword = kw
      this.handleSearch(false)
    },
    /** exact: true=精确检索 / false=模糊检索；二次检索复用此方法 */
    handleSearch(exact) {
      const kw = (this.keyword || '').trim()
      if (!kw) {
        this.$message.warning('请输入检索关键词')
        return
      }
      this.appliedKeyword = kw
      this.searched = true
    },
    /** 返回检索首页 */
    goBack() {
      this.searched = false
      this.$nextTick(() => {
        this.$refs.searchInput && this.$refs.searchInput.focus()
      })
    },
    /** 查看检索结果 */
    openFileViewer(row) {
      this.viewer.row = row
      this.viewer.visible = true
    },
    /** 查看最新归档条目 */
    openLatest(item) {
      this.viewer.row = { code: item.code, title: item.title, type: item.tag, category: '最新归档' }
      this.viewer.visible = true
    }
  }
}
</script>

<style scoped>
.search-page { padding: 0 0 20px; background: #fff; min-height: calc(100vh - 110px); }
.hero-area { display: flex; align-items: flex-start; padding: 0 48px; }
.hero-main { flex: 1; min-width: 0; text-align: center; padding-top: 150px; }
.hero-title { color: #3a86e0; font-size: 46px; font-weight: bold; letter-spacing: 2px; }
.hero-title i { font-size: 44px; margin-right: 12px; }
/* 检索区：tab 切换 + 检索框 */
.hero-search { margin-top: 40px; display: inline-block; text-align: left; }
.hero-tabs { display: flex; margin-bottom: 14px; }
.hero-tab {
  padding: 9px 26px; font-size: 15px; color: #4a89dc; background: #fff;
  border: 1px solid #dcdfe6; border-right-width: 0; cursor: pointer; user-select: none;
}
.hero-tab-rt {
  margin-right: 14px;
  border-radius: 4px !important;
}
.hero-tab:first-child { border-radius: 4px 0 0 4px; }
.hero-tab:last-child { border-right-width: 1px; border-radius: 0 4px 4px 0; }
.hero-tab:hover { color: #3273c4; }
.hero-tab.is-active { background: #4a89dc; border-color: #4a89dc; color: #fff; }
.hero-input { display: flex; align-items: center; }
.search-input { width: 460px; }
.search-input >>> .el-input-group__prepend { background: #f5f7fa; padding: 0 12px; }
.cat-select { width: 110px; }
.search-btn { margin-left: 14px; border-radius: 4px; }
.hero-tip { margin-top: 12px; color: #909399; font-size: 12px; }

/* 右侧面板 */
.side-panel {
  width: 360px; flex-shrink: 0; margin: 130px 24px 0 0; padding: 16px 18px 20px;
  background: #fff; border: 1px solid #e4e7ed; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.panel-title { font-size: 15px; font-weight: bold; margin-bottom: 10px; }
.panel-title.hot { color: #52c41a; }
.panel-title.latest { color: #ab47bc; margin-top: 18px; }
.keyword-list { display: flex; flex-wrap: wrap; }
.keyword-link { color: #4a89dc; font-size: 13px; line-height: 24px; margin-right: 14px; cursor: pointer; }
.keyword-link:hover { text-decoration: underline; }
.latest-list { list-style: none; margin: 0; padding: 0; }
.latest-list li { display: flex; align-items: center; margin-top: 9px; font-size: 13px; color: #303133; cursor: pointer; }
.latest-list li:hover .txt { color: #4a89dc; }
.dot { width: 6px; height: 6px; background: #606266; margin-right: 8px; flex-shrink: 0; }
.idx { color: #606266; margin-right: 6px; }
.txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px; }

/* 检索结果页 */
.result-view { padding-top: 4px; }
.result-head { display: flex; align-items: center; padding: 14px 25px 0; }
.result-head .hero-tabs { margin-bottom: 0; }
.back-link { margin-left: 18px; color: #52c41a; font-size: 14px; cursor: pointer; }
.back-link:hover { text-decoration: underline; }
.result-search { display: flex; align-items: center; padding: 16px 25px 0; }
</style>

<style>
.file-viewer-dialog .file-meta { display: flex; gap: 32px; padding: 0 0 10px; color: #606266; font-size: 13px; }
.file-viewer-dialog .file-canvas { background: #525659; padding: 24px; display: flex; justify-content: center; }
.file-viewer-dialog .file-page { background: #fff; width: 640px; min-height: 720px; padding: 48px 56px; position: relative; box-shadow: 0 2px 10px rgba(0,0,0,.4); }
.file-viewer-dialog .page-title { font-size: 17px; font-weight: bold; text-align: center; margin-bottom: 26px; color: #303133; }
.file-viewer-dialog .page-line { height: 10px; background: #e8e8e8; border-radius: 2px; margin-bottom: 14px; }
.file-viewer-dialog .page-line:nth-child(2n) { width: 88%; }
.file-viewer-dialog .page-stamp {
  position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%) rotate(-24deg);
  font-size: 30px; color: rgba(224, 32, 32, .28); border: 3px solid rgba(224, 32, 32, .28);
  padding: 8px 22px; border-radius: 6px; white-space: nowrap; font-weight: bold;
}
</style>
