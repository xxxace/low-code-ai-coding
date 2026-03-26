<template>
  <div v-loading="loading" class="home flex-column">
    <div>
      <headerVue @updata="allUpdata" />
    </div>
    <div class="flex mt10">
      <div style="width: 50%" class="flex">
        <textPieVue
          :text-arr="['车间概览（当天）', '已完成：', '计划数：', '完成率']"
          :res-date="wc2OverData"
        />
        <textPieVue
          :text-arr="['在岗情况（当天）', '在岗：', '在职：', '在岗率']"
          :res-date="wc2BeOnDuty"
        />
      </div>
      <lineBoxVue :list="wcPList"/>
    </div>
    <div class="flex mt10">
      <barVue
        class="flex1 mr10"
        title="产线效率图（本周）"
        :res-data="wc2Efficiency"
        :xy-text="['产线', '%']"
      />
      <barVue
        class="flex1 mr10"
        title="产线进度(本周)"
        :res-data="wc2Capacity"
        :xy-text="['产线', '%']"
      />
      <barVue
        class="flex1"
        title="稼动率（当天）"
        :res-data="wc2Croprate"
        :xy-text="['产线', '%']"
      />
    </div>
    <div class="flex1 mt10 flex mb10">
      <tableVue class="mr10" style="width: 45%" :list="wc2OrdschList" />
      <barVue
        class="flex1 mr10 x"
        title="重点品质问题趋势图（本周）"
        :res-data="wc2QcData"
        :xy-text="['日期', '个']"
      />
      <pieVue class="flex1" title="重点工序品质问题分布图（本周）" :res-data="wc2QcData2" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

import headerVue from './components/header.vue'
import textPieVue from './components/textPie.vue'
import lineBoxVue from './components/lineBox.vue'
import barVue from './components/bar.vue'
import pieVue from './components/pie.vue'
import tableVue from './components/table.vue'
import { useUserStore } from '@/store/modules/user'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { searchData } from '@/api/nameson'
import { storeToRefs } from 'pinia'
const { userInfo } = useUserStore()

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_WMB'
})
console.log(remoteSqlMap, 'remoteSqlMap')

const loading = ref(false)
const wc2OrdschList = ref([])
const wc2OverData = ref([])
const wc2BeOnDuty = ref([])
const wcPList = ref([])
const wc2Efficiency = ref([])
const wc2Capacity = ref([])
const wc2Croprate = ref([])
const wc2QcData = ref([])
const wc2QcData2 = ref([])

// 车间概览
const searchWc2Overview = async (selectObj) => {
  const { username, sessionId } = userInfo
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj

  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['车间概览']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  const { PSQTY, QTY, PCT } = data && data.length ? data[0] : {}
  wc2OverData.value = [QTY || '--', PSQTY || '--', PCT || 0]
}
// 在岗情况
const searchWc2BeOnDuty = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['车间在岗(员工)']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{2}'], [wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  const { JOBQTY, DUTYQTY, PCT } = data && data.length ? data[0] : {}
  wc2BeOnDuty.value = [DUTYQTY || '--', JOBQTY || '--', PCT || 0]
}
// 所有产线
const GetWcP = async (selectObj) => {
  const { wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['车间产线清单']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}'], [wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (!statusCode) return
  wcPList.value = data
}
// 产线效率
const SearchWc2Efficiency = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线效率']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  data.forEach((element) => {
    element.name = element.X_NAME
    element.value = element.EFFCIENCYPCT
  })
  wc2Efficiency.value = data
}
// 产线进度
const SearchWc2Capacity = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线进度']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (!statusCode) return
  data.forEach((element) => {
    element.name = element.X_NAME
    element.value = element.PCT
  })
  wc2Capacity.value = data
}
// 稼动率
const SearchWc2Croprate = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线稼动率']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (!statusCode) return
  data.forEach((element) => {
    element.name = element.X_NAME
    element.value = element.PCT
  })
  wc2Croprate.value = data
}
// 生产进度
const SearchWc2Ordsch = async (selectObj) => {
  wc2OrdschList.value = []
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['生产进度']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })

  if (!statusCode) return
  wc2OrdschList.value = data
}
// 生产进度--品质问题数量
const SearchWc2QcData = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['品质问题数量']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (!statusCode) return
  data.forEach((element) => {
    element.name = new Date(element.WKDATE).Format('yyyy-MM-dd')
    element.value = element.BADQTY
  })
  wc2QcData.value = data
}
// 生产进度--品质类型占比
const SearchWc2QcData2 = async (selectObj) => {
  const { productBaseFtynoVal, productVal, wcMVal } = selectObj
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['品质类型占比']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}', '{2}'], [productVal, productBaseFtynoVal, wcMVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (!statusCode) return
  data.forEach((element) => {
    element.name = element.QCNAME
    element.value = element.BADQTY
  })
  wc2QcData2.value = data
}
// 更新所有数据
const allUpdata = async (val) => {

  loading.value = true

  searchWc2Overview(val)
  searchWc2BeOnDuty(val)
  GetWcP(val)
  SearchWc2Efficiency(val)
  SearchWc2Capacity(val)
  SearchWc2Croprate(val)
  SearchWc2Ordsch(val)
  SearchWc2QcData(val)
  await SearchWc2QcData2(val)

  loading.value = false
}
// 批量replace
const setSQLCSREPLACE = (str, k, v) => {
  let keyval = str
  k.forEach((element, i) => {
    let regex = new RegExp(element.replace('{', '\\{').replace('}', '\\}'), 'g')
    const num = (keyval.match(regex) || []).length
    for (let index = 1; index <= num; index++) {
      keyval = keyval.replace(element, v[i])
    }
  })
  return keyval
}
</script>

<style lang="scss" scoped>
.home {
  background: url('@/assets/imgs/bg.jpg') no-repeat #06051c;
  background-size: cover;
  padding: 0 15px 0px 15px;
  box-sizing: border-box;
}
</style>
