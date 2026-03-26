<template>
  <div v-loading="loading" class="jobTable flex-column" style="padding: 0 10px 10px 10px">
    <headerVue :count="[num1, num2]" @updata="updata" />
    <div class="flex">
      <tableVue :list="tableList" style="width: 80%" />
      <gaugeVue :res-data="tableList" title="完成率" class="flex1 ml10" />
    </div>
    <div class="flex mt10 flex1">
      <rankingVue style="width: 50%; margin-right: 10px" :list="rankingList" />
      <barVue
        class="flex1 mr10"
        title="队伍品质问题分析图"
        :res-data="wc2QcData3"
        :xy-text="['队伍', '个']"
      />
      <radarVue class="flex1" :res-data="wc2QcData4" title="产线品质问题分析图" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { searchData } from '@/api/nameson'
import headerVue from './components/header.vue'
import tableVue from './components/table.vue'
import gaugeVue from './components/gauge.vue'
import rankingVue from './components/ranking.vue'
import barVue from './components/bar.vue'
import radarVue from './components/radar.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { useUserStore } from '@/store/modules/user'
const { userInfo } = useUserStore()

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_PJB'
})

const loading = ref(false)
const tableList = ref([])
const num1 = ref(0)
const num2 = ref(0)
const rankingList = ref([])
const lineList = ref([])
const wc2QcData3 = ref([])
const wc2QcData4 = ref([])

//  生产进度
const searchWc2QcData = async (e) => {
  tableList.value = []
  const { username, sessionId } = userInfo
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工序任务单进度情况']
  const { productBaseFtynoVal, productVal, wcPVal, wcMVal } = e
  num1.value = 0
  num2.value = 0
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(
      DBQUERY,
      ['{0}', '{1}', '{2}', '{3}'],
      [productVal, productBaseFtynoVal, wcMVal, wcPVal]
    ),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  data.forEach((item) => {
    if (item.EFFCIENCY == -1) {
      num1.value++
    } else if (item.EFFCIENCY == 1) {
      num2.value++
    }
  })
  tableList.value = data
  // 遍历添加优先级
  tableList.value.forEach((item, index) => {
    if (index + 1 < 5) {
      item.YXJ = '10' + index
    } else if (index + 1 < 11) {
      item.YXJ = '20' + index
    } else {
      item.YXJ = '3' + index
    }
    item.YGRS = '1' + index
  })
  console.log(tableList)
}
// 产线生产数据汇总
const searchWc2JobnoOrdsch2 = async (e) => {
  rankingList.value = []
  const { productBaseFtynoVal, productVal, wcPVal, wcMVal } = e
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线生产数据汇总']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(
      DBQUERY,
      ['{0}', '{1}', '{2}', '{3}'],
      [productVal, productBaseFtynoVal, wcMVal, wcPVal]
    ),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return

  rankingList.value = data
}
// 队伍品质问题分析
const searchWc2QcData3 = async (e) => {
  wc2QcData3.value = []
  const { productBaseFtynoVal, productVal, wcPVal, wcMVal } = e
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['队伍品质问题分析']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{3}'], [wcPVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  data.forEach((item) => {
    item.name = item.TEAMNAME
    item.value = item.BADQTY
  })
  wc2QcData3.value = data
}
// 产线品质问题分析
const searchWc2QcData4 = async (e) => {
  wc2QcData4.value = []
  const { productBaseFtynoVal, productVal, wcPVal, wcMVal } = e
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线品质问题分析']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{3}'], [wcPVal]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  data.forEach((item) => {
    item.name = item.QCNAME
    item.value = item.BADQTY
  })
  wc2QcData4.value = data
}
// 全局更新事件
const updata = async (e) => {
  loading.value = true
  searchWc2QcData(e)
  searchWc2JobnoOrdsch2(e)
  searchWc2QcData3(e)
  searchWc2QcData4(e)
  loading.value = false
}
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

<style lang="scss" scope>
.jobTable {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: url(@/assets/imgs/bg.jpg);
}
</style>
