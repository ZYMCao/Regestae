<template>
  <!-- 电子档案年报：档案室基本情况年报（DA-3表） -->
  <div class="annual-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button size="small" icon="el-icon-refresh" class="btn-refresh" @click="handleRefresh">刷新</el-button>
      <el-button size="small" icon="el-icon-document-checked" class="btn-save" @click="handleSave">保存</el-button>
      <el-button size="small" icon="el-icon-data-line" class="btn-stat" @click="reCount">重新统计</el-button>
      <el-button size="small" icon="el-icon-printer" @click="printPdf">打印年报PDF</el-button>
      <el-button size="small" icon="el-icon-info" class="btn-help" @click="showHelp">说明</el-button>
      <el-date-picker
        v-model="yearMonth"
        type="month"
        size="small"
        format="yyyy年MM月"
        value-format="yyyy-MM"
        :clearable="false"
        class="month-picker"
        placeholder="选择年月"
      />
      <el-button type="text" class="close-link" @click="toggleLastYear">
        {{ showLastYear ? '关闭上年度数据' : '显示上年度数据' }}
      </el-button>
      <el-switch v-model="showLastYear" active-color="#f56c6c" />
      <span class="switch-label">显示上年度数据</span>
    </div>

    <div class="report-body">
      <h2 class="report-title">档案室基本情况年报</h2>

      <!-- 表头 -->
      <div class="report-card">
        <div class="section-divider"><span class="divider-text">表头</span></div>
        <div class="form-grid">
          <div class="form-col">
            <div class="form-item">
              <label class="f-label">01 统一社会信用代码：</label>
              <el-input v-model="form.creditCode" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">02 单位名称：</label>
              <el-input v-model="form.unitName" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">03 单位类别代码：</label>
              <el-input v-model="form.unitTypeCode" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">04 邮政编码：</label>
              <el-input v-model="form.postCode" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">05 单位地址：</label>
              <el-input v-model="form.unitAddress" size="small" class="f-input" />
            </div>
          </div>
          <div class="form-col">
            <div class="form-item">
              <label class="f-label">表号：</label>
              <el-input value="DA-3表" size="small" class="f-input" disabled />
            </div>
            <div class="form-item">
              <label class="f-label">制定机关：</label>
              <el-input value="国家档案局" size="small" class="f-input" disabled />
            </div>
            <div class="form-item">
              <label class="f-label">批准机关：</label>
              <el-input value="国家统计局" size="small" class="f-input" disabled />
            </div>
            <div class="form-item">
              <label class="f-label">批准文号：</label>
              <el-input value="国统制〔2025〕175号" size="small" class="f-input" disabled />
            </div>
            <div class="form-item">
              <label class="f-label">有效期至：</label>
              <el-date-picker
                v-model="validUntil"
                type="date"
                size="small"
                format="yyyy年MM月dd日"
                value-format="yyyy-MM-dd"
                disabled
                class="f-input"
              />
            </div>
            <div class="form-item">
              <label class="f-label">06 电话：</label>
              <el-input v-model="form.phone" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">07 机构情况：</label>
              <div class="check-group">
                <el-checkbox v-model="form.orgSetup1">1.独立设置档案室(处、科等)</el-checkbox>
                <el-checkbox v-model="form.orgSetup2">2.无独立设置档案室(处、科等)</el-checkbox>
              </div>
            </div>
          </div>
        </div>

        <!-- 表尾 -->
        <div class="section-divider"><span class="divider-text">表尾</span></div>
        <div class="form-grid">
          <div class="form-col">
            <div class="form-item">
              <label class="f-label">单位负责人：</label>
              <el-input v-model="form.leader" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">填表人：</label>
              <el-input v-model="form.filler" size="small" class="f-input" />
            </div>
          </div>
          <div class="form-col">
            <div class="form-item">
              <label class="f-label">统计负责人：</label>
              <el-input v-model="form.statLeader" size="small" class="f-input" />
            </div>
            <div class="form-item">
              <label class="f-label">报出日期：</label>
              <el-date-picker
                v-model="form.reportDate"
                type="date"
                size="small"
                format="yyyy年MM月dd日"
                value-format="yyyy-MM-dd"
                disabled
                placeholder="显示当前打印的日期"
                class="f-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 指标表 -->
      <div class="report-card table-card">
        <el-table
          :data="rows"
          border
          size="small"
          style="width: 100%"
          :header-cell-style="{ background: '#d9e7f5', color: '#333', fontWeight: 600 }"
        >
          <el-table-column label="指标名称" min-width="460" align="center">
            <template slot-scope="{ row }">
              <div class="ind-name" :style="{ paddingLeft: row.indent * 24 + 'px' }">{{ row.name }}</div>
            </template>
          </el-table-column>
          <el-table-column label="计量单位" width="230" align="center">
            <template slot-scope="{ row }">
              <span>{{ row.type === 'g' ? '—' : row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="代码" width="190" align="center">
            <template slot-scope="{ row }">
              <span>{{ row.type === 'g' ? '—' : row.code }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="280" align="center">
            <template slot-scope="{ row }">
              <span v-if="row.type === 'g'">—</span>
              <div v-else-if="row.type === 'yn'" class="yn-group">
                <el-checkbox v-model="row.yes">是</el-checkbox>
                <el-checkbox v-model="row.no">否</el-checkbox>
              </div>
              <el-input v-else v-model="row.value" size="mini" class="cell-input" />
            </template>
          </el-table-column>
          <el-table-column v-if="showLastYear" label="上年数量" width="200" align="center">
            <template slot-scope="{ row }">
              <span>{{ row.last }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
// 指标原始数据：[type, indent, name, unit, code, value]
// type: h = 表头行(甲乙丙1) / g = 分组行(数量显示 —) / n = 录入行
const RAW_ROWS = [
  ['h', 0, '甲', '乙', '丙', '1'],
  // 一、人员情况
  ['g', 0, '一、人员情况'],
  ['n', 1, '专职人员', '人', '08', ''],
  ['n', 1, '其中：女性', '人', '09', ''],
  ['g', 1, '年龄'],
  ['n', 2, '50岁及以上', '人', '10', ''],
  ['n', 2, '35—49岁', '人', '11', ''],
  ['n', 2, '34岁及以下', '人', '12', ''],
  ['g', 1, '专职人员文化程度'],
  ['n', 2, '博士研究生', '人', '13', ''],
  ['n', 2, '硕士研究生', '人', '14', ''],
  ['n', 2, '研究生班研究生', '人', '15', ''],
  ['n', 2, '双学士', '人', '16', ''],
  ['n', 2, '大学本科', '人', '17', ''],
  ['n', 2, '大专', '人', '18', ''],
  ['n', 2, '高中（含中专）及以下', '人', '19', ''],
  ['g', 1, '图书、情报、档案专业专职人员文化程度'],
  ['n', 2, '博士研究生', '人', '20', ''],
  ['n', 2, '硕士研究生', '人', '21', ''],
  ['n', 2, '研究生班研究生', '人', '22', ''],
  ['n', 2, '大学本科', '人', '23', ''],
  ['n', 2, '大专', '人', '24', ''],
  ['n', 2, '中专', '人', '25', ''],
  ['g', 1, '档案干部专业技术职务'],
  ['n', 2, '研究馆员', '人', '26', ''],
  ['n', 2, '副研究馆员', '人', '27', ''],
  ['n', 2, '馆员', '人', '28', ''],
  ['n', 2, '助理馆员', '人', '29', ''],
  ['n', 2, '管理员', '人', '30', ''],
  ['n', 1, '兼职人员', '人', '31', ''],
  ['n', 1, '本年接受档案业务在职培训教育', '期', '32', ''],
  ['n', 1, '', '人次', '33', ''],
  // 二、室存情况
  ['g', 0, '二、室存情况'],
  ['g', 1, '总计数量'],
  ['g', 2, '纸质档案'],
  ['n', 3, '以卷为保管单位档案', '卷', '34', '3448'],
  ['n', 3, '以件为保管单位档案', '件', '35', '11218'],
  ['n', 3, '总排架长度', '米', '36', ''],
  ['n', 2, '电子档案', 'GB', '37', '336'],
  ['n', 3, '其中：文书类电子档案', '件', '38', '0'],
  ['n', 3, '', 'GB', '39', '0'],
  ['n', 3, '数码照片', '张', '40', '10416'],
  ['n', 3, '', 'GB', '41', '35'],
  ['n', 3, '数字录音、数字录像', '小时', '42', ''],
  ['n', 3, '', 'GB', '43', '29'],
  ['g', 2, '其他载体档案'],
  ['n', 3, '照片档案', '张', '44', ''],
  ['n', 3, '录音磁带、录像磁带、影片档案', '盘', '45', ''],
  ['n', 3, '实物档案', '件', '46', '0'],
  ['g', 1, '其中室存永久保管档案情况'],
  ['g', 2, '纸质档案'],
  ['n', 3, '以卷为保管单位档案', '卷', '47', '1369'],
  ['n', 3, '以件为保管单位档案', '件', '48', '2038'],
  ['n', 2, '电子档案', 'GB', '49', '3'],
  ['n', 3, '其中：文书类电子档案', '件', '50', '0'],
  ['n', 3, '', 'GB', '51', '0'],
  ['n', 3, '数码照片', '张', '52', '0'],
  ['n', 3, '', 'GB', '53', '0'],
  ['n', 3, '数字录音、数字录像', '小时', '54', ''],
  ['n', 3, '', 'GB', '55', '0'],
  ['g', 2, '其他载体档案'],
  ['n', 3, '照片档案', '张', '56', ''],
  ['n', 3, '录音磁带、录像磁带、影片档案', '盘', '57', ''],
  ['n', 3, '实物档案', '件', '58', '0'],
  ['g', 1, '其中室存30年（长期）保管档案情况'],
  ['g', 2, '纸质档案'],
  ['n', 3, '以卷为保管单位档案', '卷', '59', '2079'],
  ['n', 3, '以件为保管单位档案', '件', '60', '8157'],
  ['n', 2, '电子档案', 'GB', '61', '266'],
  ['n', 3, '其中：文书类电子档案', '件', '62', '0'],
  ['n', 3, '', 'GB', '63', '0'],
  ['n', 3, '数码照片', '张', '64', '100'],
  ['n', 3, '', 'GB', '65', '0'],
  ['n', 3, '数字录音、数字录像', '小时', '66', ''],
  ['n', 3, '', 'GB', '67', '29'],
  ['g', 2, '其他载体档案'],
  ['n', 3, '照片档案', '张', '68', ''],
  ['n', 3, '录音磁带、录像磁带、影片档案', '盘', '69', ''],
  ['n', 3, '实物档案', '件', '70', '0'],
  // 三、档案数字化成果
  ['g', 0, '三、档案数字化成果'],
  ['g', 1, '纸质档案'],
  ['n', 2, '以卷为保管单位档案', '卷', '71', ''],
  ['n', 2, '', 'GB', '72', ''],
  ['n', 2, '', '万幅', '73', ''],
  ['n', 2, '以件为保管单位档案', '件', '74', ''],
  ['n', 2, '', 'GB', '75', ''],
  ['n', 2, '', '万幅', '76', ''],
  ['g', 1, '其他载体档案'],
  ['n', 2, '照片档案', 'GB', '77', ''],
  ['n', 2, '录音磁带、录像磁带、影片档案', 'GB', '78', ''],
  ['n', 2, '其他', 'GB', '79', ''],
  // 四、档案编目情况
  ['g', 0, '四、档案编目情况'],
  ['g', 1, '机读目录'],
  ['n', 2, '案卷级', '万条', '80', ''],
  ['n', 2, '文件级', '万条', '81', ''],
  ['n', 0, '五、检索工具', '种', '82', ''],
  // 六、本年接收档案情况
  ['g', 0, '六、本年接收档案情况'],
  ['g', 1, '纸质档案'],
  ['n', 2, '以卷为保管单位档案', '卷', '83', ''],
  ['n', 2, '以件为保管单位档案', '件', '84', ''],
  ['n', 1, '电子档案', 'GB', '85', ''],
  ['n', 2, '其中：文书类电子档案', '件', '86', ''],
  ['n', 2, '', 'GB', '87', ''],
  ['n', 2, '数码照片', '张', '88', ''],
  ['n', 2, '', 'GB', '89', ''],
  ['n', 2, '数字录音、数字录像', '小时', '90', ''],
  ['n', 2, '', 'GB', '91', ''],
  ['g', 1, '其他载体档案'],
  ['n', 2, '照片档案', '张', '92', ''],
  ['n', 2, '录音磁带、录像磁带、影片档案', '盘', '93', ''],
  ['n', 2, '实物档案', '件', '94', ''],
  // 七~九、是否类（是/否复选）
  ['yn', 0, '七、本年是否向档案馆移交档案', '—', '95', ''],
  ['yn', 0, '八、本年是否有移出档案', '—', '96', ''],
  ['yn', 0, '九、本年是否有销毁档案', '—', '97', ''],
  // 十、档案利用情况
  ['g', 0, '十、档案利用情况'],
  ['n', 1, '本年利用档案', '人次', '98', '23'],
  ['n', 1, '', '卷（件）次', '99', '1642'],
  ['g', 1, '本年编研成果'],
  ['n', 2, '公开出版', '种', '100', ''],
  ['n', 2, '', '万字', '101', ''],
  ['n', 2, '内部参考', '种', '102', ''],
  ['n', 2, '', '万字', '103', ''],
  // 十一、档案室设施设备情况
  ['g', 0, '十一、档案室设施设备情况'],
  ['n', 1, '档案室建筑面积', '平方米', '104', ''],
  ['n', 1, '其中：档案库房建筑面积', '平方米', '105', ''],
  ['g', 1, '档案室设备'],
  ['n', 2, '服务器', '台', '106', ''],
  ['g', 2, '安全防护系统'],
  ['n', 3, '火灾自动报警系统', '套', '107', ''],
  ['n', 3, '温湿度控制系统', '套', '108', ''],
  ['n', 0, '十二、数字档案室', '个', '109', '']
]

// 上年度数据 mock（演示用）
const LAST_YEAR = {
  '34': '3265', '35': '10437', '37': '312', '40': '9860', '41': '33', '43': '27',
  '47': '1240', '48': '1863', '49': '3', '59': '1912', '60': '7612', '61': '245',
  '64': '96', '67': '27'
}

export default {
  name: 'ArchiveAnnual',
  data() {
    return {
      form: {
        creditCode: '',
        unitName: '',
        unitTypeCode: '',
        postCode: '',
        unitAddress: '',
        phone: '',
        orgSetup1: false,
        orgSetup2: false,
        leader: '',
        filler: '',
        statLeader: '',
        reportDate: ''
      },
      yearMonth: '2026-09',
      validUntil: '2026-09-30',
      showLastYear: false,
      rows: []
    }
  },
  created() {
    this.buildRows()
  },
  methods: {
    buildRows() {
      this.rows = RAW_ROWS.map(r => ({
        type: r[0],
        indent: r[1],
        name: r[2],
        unit: r[3] || '—',
        code: r[4] || '—',
        value: r[5] || '',
        yes: false,
        no: false,
        last: r[0] === 'n' ? (LAST_YEAR[r[4]] || '') : '—'
      }))
    },
    handleRefresh() {
      this.buildRows()
      this.$message.success('刷新成功')
    },
    handleSave() {
      this.$message.success('保存成功')
    },
    reCount() {
      this.$message.success('重新统计完成')
    },
    printPdf() {
      this.form.reportDate = new Date().toISOString().slice(0, 10)
      window.print()
    },
    showHelp() {
      this.$alert(
        '本表为档案室基本情况年报（DA-3表），依据国家档案局制发的统计制度填报。' +
        '表中"数量"栏由档案室按指标逐项填写，分组行不需填写；' +
        '可通过"显示上年度数据"开关查看上年同期数据，便于对比分析。',
        '填报说明',
        { confirmButtonText: '知道了', customClass: 'annual-help' }
      )
    },
    toggleLastYear() {
      this.showLastYear = !this.showLastYear
    }
  }
}
</script>

<style lang="scss" scoped>
.annual-page {
  height: 100%;
  background: #eef2f9;
  padding: 12px 16px 24px;
  box-sizing: border-box;
  overflow-y: scroll;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .btn-refresh ::v-deep i { color: #67c23a; }
  .btn-save ::v-deep i { color: #e6a23c; }
  .btn-stat ::v-deep i { color: #e6a23c; }
  .btn-help ::v-deep i { color: #3d8ef8; }

  ::v-deep .el-input__inner { height: 26px; line-height: 26px; }
  ::v-deep .el-input__icon { height: 26px; line-height: 26px; }

  .month-picker {
    width: 160px;
    margin: 0 8px;
  }

  .close-link {
    color: #f56c6c;
    font-size: 14px;
    padding: 0 4px;

    &:hover { color: #f78989; }
  }

  .switch-label {
    margin-left: 8px;
    font-size: 14px;
    color: #606266;
  }
}

.report-body {
  max-width: 1560px;
  margin: 0 auto;
}

.report-title {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: #1f2d3d;
  margin: 8px 0 20px;
}

.report-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(31, 60, 112, 0.06);
  padding: 20px 40px 28px;
  margin-bottom: 20px;
}

.section-divider {
  display: flex;
  align-items: center;
  margin: 4px 0 24px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #dcdfe6;
  }

  .divider-text {
    padding: 0 14px;
    font-size: 14px;
    color: #606266;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 120px;
  margin-bottom: 12px;
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;

  &:last-child { margin-bottom: 0; }

  .f-label {
    flex: none;
    width: 175px;
    text-align: right;
    padding-right: 10px;
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }

  .f-input {
    flex: 1;
  }

  .check-group {
    display: flex;
    align-items: center;
    gap: 20px;

    ::v-deep .el-checkbox {
      margin-right: 0;
      color: #606266;
    }
  }
}

.table-card {
  padding: 16px 12px 20px;
}

.ind-name {
  text-align: left;
  font-size: 13px;
  color: #333;
  line-height: 24px;
}

.cell-input {
  width: 150px;

  ::v-deep .el-input__inner {
    text-align: center;
  }
}

.yn-group {
  display: flex;
  justify-content: center;
  gap: 24px;

  ::v-deep .el-checkbox {
    margin-right: 0;
    color: #606266;
  }
}

@media print {
  .toolbar { display: none; }

  .annual-page {
    background: #fff;
    padding: 0;
  }

  .report-card {
    box-shadow: none;
    border: 1px solid #ebeef5;
  }
}
</style>
