<template>
  <!-- 签名人详细信息弹窗（图二） -->
  <el-dialog
    title="详细信息"
    :visible.sync="visible"
    width="860px"
    custom-class="esign-detail-dialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="detail-table">
      <div class="detail-row">
        <div class="detail-label">签名人</div>
        <div class="detail-value">{{ data.signer }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">签名时间</div>
        <div class="detail-value">{{ data.signTime }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">时间戳</div>
        <div class="detail-value">{{ data.timeStamp }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">验签结果</div>
        <div class="detail-value">{{ data.verifyResult }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">签名位置信息</div>
        <div class="detail-value">{{ data.positionInfo }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">证书序列号</div>
        <div class="detail-value">{{ data.certSerial }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">证书base64编码</div>
        <div class="detail-value cert-base64">{{ data.certBase64 }}</div>
      </div>
    </div>
    <template slot="footer"><span /></template>
  </el-dialog>
</template>

<script>
/** 证书base64编码 mock（与图二一致的长编码片段） */
const MOCK_CERT_BASE64 = 'MIIGDCCBCQGCSqGSIb3DQEHAqCABKAwgCWBQYJKoZIhvcNAQELBoSggCiwCAQGGCASUwMjYwMjI3MTQwNjU5WqCAJgYJKoZIhvcNAQELWqCAMqCAMIIGc6ADAgECAgkAoOx7VhFOMyAwDQYJKoZIhvcNAQELBQAwgaAxCzAJBgNVBAYTAkNOMRYwFAYDVQQIDA1alZGVqYS75YyX6ZuuSDEOMAwGA1UEBwwF56We5biDMScwJQYDVQQLDB5al5GVqYS75YyX6Zuu5ZyG56GA5Lia5Lq65rCR5oql6ZGxMTEwLwYDVQQDDCjlvKDlmIXmpILnlKjmiLcp5a6d5aSn5a62566h55CG55m+562J5a2m6ZmiMFkwFAYHKoZIzj0CAQYJKyQDAwIIAQEHA0kABIHHb7CbITjwB8EY0VMeV3FabF8xEgsBHlxHoV1eZlwCtNTINL2C6RSQyRPvO8rSUqH9js0TmgRq7DjZM0uV0w9nokFHoTAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAWBgNVHSUBAf8EDDAKBggrBgEFBQcDAzAiBgNVHREEGzAZgRdsenlAa2V5dWFuamEuY29tMAsGA1UdDwQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQV1p9Ycz1W0HJQPvGOltA6ULCglTAfBgNVHSMEGDAWgBTxV5Hq0ZPFBhbiUL3nZhcwZQYJKoZIhvcNAQEKBoSggCqwCAQGgAMCAQGigagCAaeggQH/AT8wggFpMIIBoTCB+KADAgECAgkAoOx7VhFOMyAwDQYJKoZIhvcNAQELBQAwgaAxCzAJBgNVBAYTAkNOMRYwFAYDVQQIDA1alZGVqYS75YyX6ZuuSDEOMAwGA1UEBwwF56We5biDMScwJQYDVQQLDB5al5GVqYS75YyX6Zuu5ZyG56GA5Lia5Lq65rCR5oql6ZGxMTEwLwYDVQQDDCjlvKDlmIXmpILnlKjmiLcp5a6d5aSn5a62566h55CG55m+562J5a2m6ZmiMFkwFAYHKoZIzj0CAQYJKyQDAwIIAQEHA0kABDZnOu1oIV0='

export default {
  name: 'EsignDetailDialog',
  props: {
    visible: { type: Boolean, default: false },
    detail: { type: Object, default: () => ({}) }
  },
  computed: {
    data() {
      // 证书base64用完整长编码展示（静态 DEMO）
      return { ...this.detail, certBase64: this.detail.certBase64 ? MOCK_CERT_BASE64 : '' }
    }
  }
}
</script>

<style lang="scss">
/* 弹窗使用 append-to-body，需全局样式 */
.esign-detail-dialog {
  .el-dialog__body {
    padding: 16px 24px;
  }

  .detail-table {
    border: 1px solid #dcdfe6;
    max-height: 68vh;
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

  .cert-base64 {
    line-height: 1.6;
  }
}
</style>
