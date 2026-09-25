<template>
  <!-- 查看PDF电子签名信息列表弹窗（图一） -->
  <el-dialog
    title="查看PDF电子签名信息"
    :visible.sync="visible"
    width="900px"
    custom-class="esign-list-dialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-table :data="rows" border stripe size="small" height="340" empty-text="暂无数据">
      <el-table-column label="序号" type="index" width="55" align="center" />
      <el-table-column label="签名人" width="90" align="center">
        <template slot-scope="{ row }">
          <el-link type="primary" :underline="false" class="signer-link" @click="viewDetail(row)">{{ row.signer }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="签名时间" prop="signTime" width="160" align="center" />
      <el-table-column label="时间戳" prop="timeStamp" width="160" align="center" />
      <el-table-column label="验签结果" prop="verifyResult" width="90" align="center" />
      <el-table-column label="签名位置信息" min-width="120" align="center" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.positionInfo }}</template>
      </el-table-column>
      <el-table-column label="证书序列号" min-width="180" align="center" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.certSerial }}</template>
      </el-table-column>
      <el-table-column label="证书base64编码" min-width="90" align="center" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.certBase64 }}</template>
      </el-table-column>
    </el-table>
    <template slot="footer"><span /></template>
  </el-dialog>
</template>

<script>
/** PDF电子签名信息 mock（与图一一致：陈艳/张鲁莎/陈艳 3 条） */
const ESIGN_ROWS = [
  { id: 1, signer: '陈艳', signTime: '2026-02-27 14:06:59', timeStamp: '2026-02-27 14:06:59', verifyResult: '无效', positionInfo: '不可视签名', certSerial: '10ac3b424ebd021e4b2...', certBase64: 'MIIGG...' },
  { id: 2, signer: '张鲁莎', signTime: '2026-03-03 13:43:04', timeStamp: '2026-03-03 13:43:04', verifyResult: '有效', positionInfo: '签名在 第338...', certSerial: '10c3bd0f0ba5f2bf987...', certBase64: 'MIIFP2...' },
  { id: 3, signer: '陈艳', signTime: '2026-03-03 13:57:45', timeStamp: '2026-03-03 13:57:45', verifyResult: '有效', positionInfo: '签名在 第338...', certSerial: '10ac3b424ebd021e4b2...', certBase64: 'MIIGG...' }
]

export default {
  name: 'EsignListDialog',
  props: {
    visible: { type: Boolean, default: false }
  },
  data() {
    return {
      rows: JSON.parse(JSON.stringify(ESIGN_ROWS))
    }
  },
  methods: {
    /** 点击签名人：通知父组件打开详细信息弹窗 */
    viewDetail(row) {
      this.$emit('detail', row)
    }
  }
}
</script>

<style lang="scss">
/* 弹窗使用 append-to-body，需全局样式 */
.esign-list-dialog {
  .el-dialog__body {
    padding: 14px 20px;
  }

  .signer-link {
    font-weight: 400;
  }
}
</style>
