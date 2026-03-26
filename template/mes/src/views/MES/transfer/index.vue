<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '生产单号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.ORDNO" placeholder="请输入生产单号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '交货开始日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.DstartDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '交货结束日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.DendDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '交货人')" :width="70">
          <el-input class="w-[140px]!" v-model="query.DSTAFF" placeholder="请输入交货人" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '移交工序')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.JOBNO"
            :sql="remoteSqlMap['工序下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工序下拉框'].SORTBYCONTENT"
          />
          <!-- <el-input
            class="w-[140px]!"
            v-model="query.productionLine"
            placeholder="请输入移交工序"
          /> -->
        </FieldItem>
      </div>
      <div class="my-1">
        <FieldItem :label="t('lbBOOKER', '交货工厂')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.DFTYNO"
            :sql="remoteSqlMap['工厂下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工厂下拉框'].SORTBYCONTENT"
          />
          <!-- <el-input class="w-[140px]!" v-model="query.toolCode" placeholder="请输入交货工厂" /> -->
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '收货开始日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.RstartDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '收货结束日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.RendDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '收货人')" :width="70">
          <el-input class="w-[140px]!" v-model="query.DSTAFF" placeholder="请输入收货人" />
        </FieldItem>
      </div>
      <div class="my-1">
        <FieldItem :label="t('lbBOOKER', '收货工厂')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.RFTYNO"
            :sql="remoteSqlMap['工厂下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工厂下拉框'].SORTBYCONTENT"
          />
          <!-- <el-input class="w-[140px]!" v-model="query.toolCode" placeholder="请输入收货工厂" /> -->
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '登记开始日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.RGstartDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '登记结束日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.RGendDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '登记人')" :width="70">
          <el-input class="w-[140px]!" v-model="query.RGSTAFF" placeholder="请输入登记人" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>

    <div class="flex-1 bg-white mt-2 p-1" style="border-radius: 8px">
      <div class="textCenter">
        <div class="itemRow">
          <AceFieldset legend="批号信息" class="" style="height: 100%">
            <BatchUmberTable :data="reportList" :loading="reporLoading" />
          </AceFieldset>
        </div>
        <div class="itemRow">
          <AceFieldset legend="工厂信息" class="" style="height: 100%">
            <FactoryTable :data="factoryList" :loading="factLoading" />
          </AceFieldset>
        </div>
        <div class="itemRow">
          <AceFieldset legend="交货信息" class="" style="height: 100%">
            <DeliveryTable :data="deliveryList" :loading="deliveLoading" />
          </AceFieldset>
        </div>
      </div>

      <div class="textRow">
        <div class="itemRow">
          <AceFieldset legend="颜色信息" class="" style="height: 100%">
            <ColorMsgTable :data="colorMsgList" :rowClick="colorRowClick" :loading="colorLoading" />
          </AceFieldset>
        </div>
        <div class="itemRow">
          <AceFieldset legend="移交详情" class="" style="height: 100%">
            <TransferDetailsTable :data="transferDetailsList" :loading="transLoading" />
          </AceFieldset>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'

import BatchUmberTable from '@/views/MES/transfer/components/systemTable/BatchUmber.vue'
import FactoryTable from '@/views/MES/transfer/components/systemTable/Factory.vue'
import DeliveryTable from '@/views/MES/transfer/components/systemTable/Delivery.vue'
import ColorMsgTable from '@/views/MES/transfer/components/systemTable/ColorMsg.vue'
import TransferDetailsTable from '@/views/MES/transfer/components/systemTable/TransferDetails.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql.ts'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import { formatString, parseImgSrc } from '@/utils'
import dayjs from 'dayjs'
import type { transferOrdnoVo } from '$types/views/MES/transfer.ts'

const loading = ref(false)
const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_SPYJCX'
})

const { t, c } = useI18nProxy('VUE_MES_PERFORMANCE')

const [reportList, reportListManager] = useArrayRefManager<any[]>([])
const [factoryList, factoryData] = useArrayRefManager<any[]>([])
const [deliveryList, deliveryData] = useArrayRefManager<any[]>([])
const [colorMsgList, colorMsgData] = useArrayRefManager<any[]>([])
const [transferDetailsList, transferDetailsData] = useArrayRefManager<any[]>([])

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: '',
    endDate: '',
    ORDNO: '',
    DstartDate: '',
    DendDate: '',
    RstartDate: '',
    RendDate: '',
    RGstartDate: '',
    RGendDate: '',
    DFTYNO: '',
    RFTYNO: '',
    JOBNO: '',
    DSTAFF: '',
    RSTAFF: '',
    RGSTAFF: ''
  }
})

const reporLoading = ref(false)
const factLoading = ref(false)
const deliveLoading = ref(false)
const colorLoading = ref(false)
const transLoading = ref(false)
const loadData = async () => {
  queryOrdnoData()
  queryClntData()
  queryDeliverData()
  queryColorData()
  queryTransData()
}
// 批号信息
const queryOrdnoData = async () => {
  reporLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['批号信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(
        DBQUERY,
        query.value.ORDNO,
        query.value.DFTYNO,
        query.value.RFTYNO,
        query.value.RGstartDate,
        query.value.RGendDate,
        query.value.RstartDate,
        query.value.RendDate,
        query.value.RGSTAFF,
        query.value.DSTAFF,
        query.value.JOBNO,
        query.value.DstartDate,
        query.value.DendDate,
        query.value.DSTAFF
      ),
      sortby: SORTBYCONTENT
    })
    reportListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`批号信息:${e.message || JSON.stringify(e)}`)
  }
  reporLoading.value = false
}
// 工厂信息
const queryClntData = async () => {
  factLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工厂信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(
        DBQUERY,
        query.value.ORDNO,
        query.value.DFTYNO,
        query.value.RFTYNO,
        query.value.RGstartDate,
        query.value.RGendDate,
        query.value.RstartDate,
        query.value.RendDate,
        query.value.RGSTAFF,
        query.value.DSTAFF,
        query.value.JOBNO,
        query.value.DstartDate,
        query.value.DendDate,
        query.value.DSTAFF
      ),
      sortby: SORTBYCONTENT
    })
    factoryData.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`工厂信息:${e.message || JSON.stringify(e)}`)
  }
  factLoading.value = false
}
// 交货信息
const queryDeliverData = async () => {
  deliveLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['交货信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(
        DBQUERY,
        query.value.ORDNO,
        query.value.DFTYNO,
        query.value.RFTYNO,
        query.value.RGstartDate,
        query.value.RGendDate,
        query.value.RstartDate,
        query.value.RendDate,
        query.value.RGSTAFF,
        query.value.DSTAFF,
        query.value.JOBNO,
        query.value.DstartDate,
        query.value.DendDate,
        query.value.DSTAFF
      ),
      sortby: SORTBYCONTENT
    })
    deliveryData.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`交货信息:${e.message || JSON.stringify(e)}`)
  }
  deliveLoading.value = false
}
//颜色信息
const queryColorData = async () => {
  colorLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['颜色信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(
        DBQUERY,
        query.value.ORDNO,
        query.value.DFTYNO,
        query.value.RFTYNO,
        query.value.RGstartDate,
        query.value.RGendDate,
        query.value.RstartDate,
        query.value.RendDate,
        query.value.RGSTAFF,
        query.value.DSTAFF,
        query.value.JOBNO,
        query.value.DstartDate,
        query.value.DendDate,
        query.value.DSTAFF
      ),
      sortby: SORTBYCONTENT
    })
    colorMsgData.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`颜色信息:${e.message || JSON.stringify(e)}`)
  }
  colorLoading.value = false
}
//移交信息
const queryTransData = async () => {
  transLoading.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['移交信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(DBQUERY, query.value.ORDNO, query.value.DFTYNO),
      sortby: SORTBYCONTENT
    })
    transferDetailsData.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`移交信息:${e.message || JSON.stringify(e)}`)
  }
  transLoading.value = false
}
// 点击颜色单元格 移交信息
const colorRowClick = async (e: any) => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['移交信息']
    const list = await searchList<transferOrdnoVo[]>({
      sql: formatString(DBQUERY, e.MVSEQ, e.CLSEQ),
      sortby: SORTBYCONTENT
    })
    transferDetailsData.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`移交信息:${e.message || JSON.stringify(e)}`)
  }
}
onMounted(() => {
  //loadData()
})
</script>
<style lang="scss" scoped>
.textCenter {
  height: 350px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;

  .itemRow {
    height: 100%;
  }
}

.textRow {
  display: grid;
  grid-template-columns: 30% 1fr;
  gap: 10px;
  height: 350px;
}
</style>
