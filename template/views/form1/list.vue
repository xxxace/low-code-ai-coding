<template>
  <div
      class="view-container w-full h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <AceFieldset legend="查询" class="overflow-hidden min-w-[900px]">
      <FieldItemGroup :disabled="loading">
        <div>
          <FieldItem :label="t('lbPLNNO', '单号')" :width="32">
            <el-input class="w-[120px]!" v-model="query.PLNNO"/>
          </FieldItem>
          <FieldItem :label="t('lbBEGFR', '开机月份')" :width="70">
            <el-date-picker
                class="w-[120px]!"
                v-model="query.BEGFR"
                type="month"
                format="YYYYMM"
                value-format="YYYYMM"
            />
          </FieldItem>
          <FieldItem :label="t('lbEQMCAT', '针种')" :width="28">
            <RemoteSelect
                class="!w-[120px]"
                v-model="query.EQMCAT"
                :data-loader="getEQMCATList"
                @change="handleEQMCATChange"
            />
          </FieldItem>
          <FieldItem :label="t('lbEQMMODEL', '电脑机')" :width="40">
            <RemoteSelect
                class="!w-[120px]"
                v-model="query.EQMMODEL"
                :params="{args:[query.EQMCAT]}"
                :data-loader="getEQMMODList"
                :disabled="!query.EQMCAT"
            />
          </FieldItem>
          <FieldItem :label="t('lbSTFG', '状态')" :width="28">
            <RemoteSelect
                class="!w-[120px]"
                v-model="query.STFG"
                :data-loader="getBillStatusList"
            />
          </FieldItem>
          <FieldItem :width="0">
            <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('common.search', '查询') }}
            </el-button>
            <el-button size="small" :loading="loading" @click="handleRest"
            >{{ c('common.reset', '重置') }}
            </el-button>
          </FieldItem>
        </div>
        <div class="my-1">
          <FieldItem :label="t('lbBLTY', '单类')" :width="32">
            <RemoteSelect
                class="!w-[120px]"
                v-model="query.BLTY"
                :data-loader="getOrderTypeList"
            />
          </FieldItem>
          <FieldItem :label="t('lbENDTO', '货期月份')" :width="70">
            <el-date-picker
                class="w-[120px]!"
                v-model="query.ENDTO"
                type="month"
                format="YYYYMM"
                value-format="YYYYMM"
            />
          </FieldItem>
          <FieldItem :label="t('lbCLNT', '客户')" :width="28">
            <OptionInput
                :label-width="100"
                :value-width="198"
                v-model="query.CLNT"
                v-model:label-value="query.V_CLNTNAME"
                :dialog-compoent="CustomerDialog"
            />
          </FieldItem>
          <FieldItem :label="t('lbTEAM', '队伍')" :width="28">
            <RemoteSelect
                class="!w-[120px]"
                label-key="TEAMNAME"
                value-key="TEAMNO"
                v-model="query.TEAM"
                :data-loader="getTeamList"
            />
          </FieldItem>
          <FieldItem :width="0">
            <el-button
                plain
                type="primary"
                size="small"
                :loading="loading"
                @click="()=>handleOpenForm()"
            >
              <Icon icon="vi-ep:document-add"/>
              <span>新增询单</span>
            </el-button>
          </FieldItem>
        </div>
      </FieldItemGroup>
    </AceFieldset>
    <div class="flex-1 flex flex-col" v-ace-loading="loading">
      <AceFieldset class="flex-1" legend="交付计划列表">
        <template #legend>
          <div class="flex gap-2">
            <span>交付计划列表</span>

            <!--            <div class="flex items-center cursor-pointer" @click="()=>handleOpenForm()">-->
            <!--              <Icon icon="vi-ep:document-add"/>-->
            <!--              <span>{{ c('common.add', '新增') }}</span>-->
            <!--            </div>-->
          </div>
        </template>
        <InquiryOrderTable :data="dataList" @open-order="handleOpenForm" @currentRowChange="handleMainCurrRowChange"/>
      </AceFieldset>
      <div class="flex gap-1 flex-[0.7]">
        <div class="w-[390px] h-full relative">
          <AceFieldset class="h-full" legend="工序：包装">
            <PackageJobTable :data="dataList2"/>
          </AceFieldset>
        </div>
        <AceFieldset class="flex-1" legend="产线负荷">
          <FieldItem class="yearMonthPicker" label="计划周期" :width="56">
            <el-date-picker
                class="w-[120px]!"
                v-model="yearMonth"
                type="month"
                format="YYYYMM"
                value-format="YYYYMM"
                :clearable="false"
                :editable="false"
                @change="handleYearMonthChange"
            />
          </FieldItem>
          <LoadChart
              v-if="barList.length"
              ref="loadChartRef"
              :evt="barItemComputed"
              pPsty="MPS0"
              :min-date="barChartState.minDate"
              :max-date="barChartState.maxDate"
          />
        </AceFieldset>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {computed, h, ref, reactive} from 'vue';
import RemoteSelect from '@/components/RemoteSelectV2/index.vue'
import {
  fetchInquiryOrderList,
  getBillStatusList,
  getEQMCATList,
  getEQMMODList,
  getTeamList,
  getWorkLineItem,
  getOrderTypeList,
  type InquiryOrderVO
} from '@/api/modules/nameson/inquiryOrder'
import {useNsI18n} from "@/hooks/useNsI18n";
import {useParamsRefManager, useArrayRefManager} from "@/hooks/useRefManager";
import OptionInput from "@/components/OptionInput.vue";
import CustomerDialog from "./dialogs/customerDialog.vue";
import InquiryOrderTable from "./components/InquiryOrderTable.vue";
import PackageJobTable from "@/views/InquiryOrder/components/PackageJobTable.vue";
import LoadChart from "@/views/InquiryOrder/components/loadChart.vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {Icon} from "@/components/Icon";
import {useModal} from "@/service/dialog";
import {useWebWorkerFn} from '@vueuse/core';
import {barTableApis} from '@/views/barTable/api/index'
import {getISOYearWeek} from "@/views/InquiryOrder/utils.ts";
import dayjs from 'dayjs'

const {t, c} = useNsI18n('VUE_INQUIRY')

const loading = ref(false)
const [query, queryManager] = useParamsRefManager(() => {
  return {
    BLTY: '',
    PLNNO: '',
    BEGFR: '',
    ENDTO: dayjs().format('YYYYMM'),
    EQMCAT: '',
    EQMMODEL: '',
    STFG: '',
    CLNT: '',
    V_CLNTNAME: '',
    TEAM: ''
  }
})
const [dataList, dataListManager] = useArrayRefManager<InquiryOrderVO>([])
const [dataList2, dataList2Manager] = useArrayRefManager<InquiryOrderVO>([])

const barChartState = reactive({
  minDate: '',
  maxDate: '',
})
const yearMonth = ref(dayjs().format('YYYYMM'))
const currentRow = ref<InquiryOrderVO>({} as InquiryOrderVO)
const loadChartRef = ref()
const barList = ref([])
const barItemComputed = computed(() => {
  return barList.value ? barList.value[0] || {} : {}
})

const handleRest = () => {
  queryManager.reset()
}

const loadData = async () => {
  loading.value = true
  try {
    const params = query.value
    const list = await fetchInquiryOrderList({
      where: {
        'A.BLTY': params.BLTY,
        'A.PLNNO__like': params.PLNNO,
        "TO_CHAR(A.BEGFR,'YYYYMM')": params.BEGFR,
        "TO_CHAR(A.ENDTO,'YYYYMM')": params.ENDTO,
        'A.EQMCAT': params.EQMCAT,
        'A.EQMMODEL': params.EQMMODEL,
        'A.CLNT': params.CLNT,
        'A.STFG': params.STFG,
        'A.TEAM': params.TEAM
      }
    })
    dataListManager.update(list)
    dataList2Manager.update([...list].sort((a, b) => {
      return new Date(a.ENDTO).getTime() - new Date(b.ENDTO).getTime()
    }))
  } catch (err) {
    ElMessageBox.alert(`获取列表错误：${err.message || JSON.stringify(err)}`)
  }
  loading.value = false
}

const handleEQMCATChange = () => {
  query.value.EQMMODEL = ''
}

const handleOpenForm = (row?: InquiryOrderVO) => {
  let src = `${window.location.origin}/#/inquiry-order-form`
  let title = '詢單'
  if (row && row.PLNSEQ) {
    src += `?id=${row.PLNSEQ}`
    title = row.V_BLTYNAME
  }

  useModal({
    modalProps: {
      title: title,
      width: '760px',
      height: '564px'
    },
    component: () => h('iframe', {
      width: '100%',
      height: '100%',
      style: 'border: none;',
      src: src
    })
  } as any)
}

const handleMainCurrRowChange = async (row: InquiryOrderVO) => {
  currentRow.value = row
  await loadChartRender(row)
}

const handleYearMonthChange = async () => {
  await handleMainCurrRowChange(currentRow.value)
}

const loadChartRender = async (row: InquiryOrderVO) => {
  barChartState.minDate = getISOYearWeek(row.BEGFR) + '周'
  barChartState.maxDate = getISOYearWeek(row.ENDTO) + '周'
  await getLoadData(row.EQMMODEL)
}

// 多线程 - 处理报表数据
const {workerFn: barWorkerFn, workerTerminate: barWorkerTerminate} = useWebWorkerFn((data) => {
  // some heavy works to do in web worker
  const reList = []

  // 处理报表参数
  data.forEach((item) => {
    // debugger
    const {WCSEQ, WCNAME, YRWEEK} = item

    // 区分产线图表
    const idx = reList.findIndex((bItem) => bItem.WCSEQ === WCSEQ)
    const weekText = `${YRWEEK}`

    if (!item.PCT) {
      item.PCT = 0
    }
    if (idx > -1) {
      const evt = reList[idx]
      // 找周期 没有就添加
      const weekIdx = evt.week.findIndex((wItem) => wItem === weekText)
      // 创建一个bar
      if (weekIdx === -1) {
        evt.week.push(weekText)
        evt.bar[0].push(item)
      } else {
        let blo = false
        evt.bar.forEach((sbItem) => {
          if (!sbItem[weekIdx] && !blo) {
            sbItem[weekIdx] = item
            blo = true
          }
        })
        if (!blo) {
          evt.bar[evt.bar.length] = []
          evt.bar[evt.bar.length - 1][weekIdx] = item
        }
      }
    } else {
      let newName = ''
      if (!WCNAME) {
        const find = data.find((bItem) => bItem.WCNAME && bItem.WCSEQ === WCSEQ)
        newName = find ? find.WCNAME : ''
      }
      reList.push({
        WCSEQ,
        WCNAME: WCNAME || newName,
        week: [weekText],
        bar: [[item]],
      })
    }
  })

  return reList
})

// 获取报表数据
async function getLoadData(EQMMODEL) {
  if (!EQMMODEL) return
  try {
    barList.value = []
    loading.value = true

    const wcItem = await getWorkLineItem({
      where: {
        CODE: EQMMODEL
      }
    }, {slient: true})

    if (wcItem && wcItem.WCSEQ) {
      const res = await barTableApis.getLoadData({
        pWcseq: wcItem.WCSEQ,
        pType: 'WCNO',
        pYrmth: yearMonth.value,
        pPsty: 'MPS0',
        pIQYORD: 'Y'
      })

      const {statusCode, data} = res || {}

      if (statusCode == '1') {
        const barSourceList = await barWorkerFn(data)

        // 填补 empty
        barSourceList.forEach((blItem) => {
          blItem.bar.forEach((brItem) => {
            for (let idx = 0; idx < brItem.length; idx++) {
              if (!brItem[idx]) brItem[idx] = {}
            }
          })
        })

        barList.value = barSourceList
        barWorkerTerminate()
      }
    }
  } catch (err) {
    if (!err.__CANCEL__) {
      ElMessage.error(err.message || JSON.stringify(err))
    }
  }

  loading.value = false
}
</script>

<style lang="scss" scoped>
.yearMonthPicker {
  position: absolute;
  left: 10px;
  z-index: 1;
}
</style>
