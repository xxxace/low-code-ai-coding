<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <AceFieldset legend="查询" class="overflow-hidden min-w-[1248px]">
      <div>
        <FieldItem :label="t('lbORDNO', '批号')" :width="30">
          <UppercaseInput class="w-[100px]!" v-model="query.ORDNO" />
        </FieldItem>
        <FieldItem :label="t('lbSTYNO', '款式')" :width="30">
          <UppercaseInput class="w-[100px]!" v-model="query.STYNO" />
        </FieldItem>
        <FieldItem :label="t('lbORIGIN', '产地')" :width="30">
          <RemoteSelect
            class="!w-[154px]"
            autoLoad
            transfer
            v-model="query.ORIGIN"
            :sql="remoteSqlMap['批号_产地下拉框'].DBQUERY"
            :orderby="remoteSqlMap['批号_产地下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbCLNT', '客户')" :width="30">
          <OptionUppercaseInput
            :label-width="80"
            :value-width="120"
            v-model="query.CLNT"
            v-model:labelValue="query.CLNTNAME"
            :dialog-compoent="ClientDialog"
            @enter="loadClientItem"
          />
        </FieldItem>
        <FieldItem :label="t('lbCLNTFTYNO', '工厂')" :width="30">
          <OptionUppercaseInput
            :label-width="80"
            :value-width="120"
            v-model="query.CLNTFTYNO"
            v-model:labelValue="query.CLNTFTYNAME"
            :dialog-compoent="FactoryDialog"
            @enter="loadFactoryItem"
          />
        </FieldItem>
        <!--        <FieldItem :label="t('lbBOOKER', '仓库')" :width="30">-->
        <!--          <OptionInput-->
        <!--            :label-width="60"-->
        <!--            :value-width="100"-->
        <!--            value-key="JOBNO"-->
        <!--            v-model="query.JOBNO"-->
        <!--            v-model:labelValue="query.JOBNAME"-->
        <!--          />-->
        <!--        </FieldItem>-->
        <FieldItem :label="t('lbBOOKER', '货期')" :width="30">
          <date-range-picker
            class="w-[210px]"
            v-model:start="query.CLNTDTTO.start"
            v-model:end="query.CLNTDTTO.end"
          />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loadingComputed" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>
    <div class="flex h-[250px]">
      <div class="flex-1 h-full">
        <AceFieldset
          :legend="t('lgRedinessEntry', '齐套明细')"
          absolute
          class="h-full overflow-hidden"
        >
          <WorkOrderTable
            :data="workOrderList"
            :loading="loadingComputed"
            @currentRowChange="readinessEntryRowChange"
          />
        </AceFieldset>
      </div>
      <div class="w-[350px] h-full">
        <AceFieldset :legend="t('lgColorGroup', '颜色组')" absolute class="h-full overflow-hidden">
          <ColorGroupTable
            :data="colorGroupList"
            :loading="loadingComputed"
            @currentRowChange="colorGroupRowChange"
          />
        </AceFieldset>
      </div>
      <div class="w-[250px] h-full">
        <AceFieldset :legend="t('lgImage', '公仔图')" absolute class="h-full overflow-hidden">
          <el-image
            style="width: 100%; height: 100%"
            :src="imgComputed"
            :zoom-rate="1.2"
            :max-scale="7"
            :min-scale="0.2"
            show-progress
            :initial-index="0"
            :preview-src-list="[imgComputed]"
            fit="cover"
          />
        </AceFieldset>
      </div>
    </div>
    <AceFieldset :legend="t('lgColorEntry', '颜色明细')" absolute class="flex-1 overflow-hidden">
      <MaterialTable
        :data="colorGroupEntryList"
        :loading="loadingComputed"
        @currentRowChange="colorEntryRowChange"
      />
    </AceFieldset>
    <div class="flex h-[300px]">
      <div class="flex-1 h-full">
        <AceFieldset
          :legend="t('lgAvailableInventory', '可用库存明细')"
          absolute
          class="h-full overflow-hidden"
        >
          <template #legend>
            <el-segmented v-model="currentTab" :options="['可用库存', '同料批号']" size="small" />
          </template>
          <AvailableInventoryTable
            v-show="currentTab === '可用库存'"
            :data="availableInventoryList"
            :loading="loadingComputed"
          />
          <div class="flex flex-col h-full" v-show="currentTab === '同料批号'">
            <SameBatchnoTable :data="sameBatchnoList" :loading="loadingComputed" />
          </div>
        </AceFieldset>
      </div>
      <div class="w-[300px] h-full">
        <AceFieldset absolute class="h-full overflow-hidden">
          <template #legend>
            <el-segmented
              v-model="currentTab2"
              :options="[t('lgTotalRequirement', '总需求明细')]"
              size="small"
            />
          </template>
          <TotalRequirementTable :data="totalRequirementList" :loading="loadingComputed" />
        </AceFieldset>
      </div>
      <div class="w-[300px] h-full">
        <AceFieldset absolute class="h-full overflow-hidden">
          <template #legend>
            <el-segmented
              v-model="currentTab3"
              :options="[t('lgRegisterDate', '登记日期')]"
              size="small"
            />
          </template>
          <RegisterDateTable :data="registerDateList" :loading="loadingComputed" />
        </AceFieldset>
      </div>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import OptionUppercaseInput from '@/components/OptionUppercaseInput.vue'
import WorkOrderTable from './components/workOrderTable/index.vue'
import MaterialTable from './components/materialTable/index.vue'
import ColorGroupTable from './components/colorGroupTable/index.vue'
import AvailableInventoryTable from './components/availableInventory/index.vue'
import TotalRequirementTable from './components/totalRequirement/index.vue'
import SameBatchnoTable from './components/sameBatchno/index.vue'
import RegisterDateTable from './components/registerDate/index.vue'
import namesonLog from '@/assets/imgs/logo.png'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import ClientDialog from './dialog/ClientDialog.vue'
import FactoryDialog from './dialog/FactoryDialog.vue'
import type {
  ReadinessEntryVO,
  ColorGroupVO,
  ColorEntryVO,
  AvailableInventoryEntryVO,
  SameBatchnoVO,
  TotalRequirementVO,
  RegisterDateVO
} from '$types/views/MES/materialReadinessAnalysis'
import { searchList, searchObject } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'
import { formatString, parseImgSrc } from '@/utils'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import dayjs from 'dayjs'
import { useDebounceFn } from '@vueuse/core'

const { t, c } = useI18nProxy('VUE_MES_QT')
const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_QT'
})

const loading = ref(false)
const colorGroupLoading = ref(false)
const colorGroupEntryLoading = ref(false)
const availableInventoryLoading = ref(false)
const sameBatchnoLoading = ref(false)
const totalRequirementLoading = ref(false)
const registerDateLoading = ref(false)
const [query, queryManager] = useParamsRefManager(() => {
  return {
    ORDNO: '',
    STYNO: '',
    ORIGIN: '',
    CLNT: '',
    CLNTNAME: '',
    CLNTFTYNO: '',
    CLNTFTYNAME: '',
    CLNTDTTO: {
      start: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
      end: dayjs().format('YYYY-MM-DD')
    }
  }
})

const redinessCurrentRow = ref<Partial<ReadinessEntryVO>>({})

const [workOrderList, workOrderListManager] = useArrayRefManager<ReadinessEntryVO>([])
const [colorGroupList, colorGroupListManager] = useArrayRefManager<ColorGroupVO>([])
const [colorGroupEntryList, colorGroupEntryListManager] = useArrayRefManager<ColorEntryVO>([])
const [availableInventoryList, availableInventoryListManager] =
  useArrayRefManager<AvailableInventoryEntryVO>([])
const [sameBatchnoList, sameBatchnoListManager] = useArrayRefManager<SameBatchnoVO>([])
const [totalRequirementList, totalRequirementListManager] = useArrayRefManager<TotalRequirementVO>(
  []
)
const [registerDateList, registerDateListManager] = useArrayRefManager<RegisterDateVO>([])

const currentTab = ref('可用库存')
const currentTab2 = ref('总需求明细')
const currentTab3 = ref('登记日期')

const loadingComputed = computed(() => {
  console.log(
    loading.value,
    colorGroupLoading.value,
    colorGroupEntryLoading.value,
    availableInventoryLoading.value,
    sameBatchnoLoading.value,
    totalRequirementLoading.value,
    loading.value ||
      colorGroupLoading.value ||
      colorGroupEntryLoading.value ||
      availableInventoryLoading.value ||
      sameBatchnoLoading.value ||
      totalRequirementLoading.value
  )
  return (
    loading.value ||
    colorGroupLoading.value ||
    colorGroupEntryLoading.value ||
    availableInventoryLoading.value ||
    sameBatchnoLoading.value ||
    totalRequirementLoading.value
  )
})

const imgComputed = computed(() => {
  return redinessCurrentRow.value.IMGSEQ ? parseImgSrc(redinessCurrentRow.value.IMGSEQ) : namesonLog
})

const loadData = async () => {
  loading.value = true
  try {
    redinessCurrentRow.value = {}
    await loadReadinessEntryList()
  } catch (err: any) {
    loading.value = false
    ElMessageBox.alert(`查询数据错误：${err.message || JSON.stringify(err)}`)
  }
}

const readinessEntryRowChange = async (row: ReadinessEntryVO) => {
  redinessCurrentRow.value = row

  loading.value = true
  try {
    await loadColorGroupList(row.ORDSEQ)
    await loadRegisterDateList(row.ORDSEQ)
  } catch (err: any) {
    loading.value = false
    ElMessageBox.alert(`查询明细数据错误：${err.message || JSON.stringify(err)}`)
  }
}

const colorGroupRowChange = async (row: ColorGroupVO) => {
  loading.value = true
  colorGroupLoading.value = true
  try {
    await loadColorEntryList(row.ORDSEQ, row.ITMSEQ, row.CLSEQ)
    await loadAvailableInventoryEntryList(row.ORDSEQ, row.ITMSEQ)
  } catch (err: any) {
    ElMessageBox.alert(`查询明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  colorGroupLoading.value = false
  loading.value = false
}

const colorEntryRowChange = async (row: ColorEntryVO) => {
  loading.value = true
  colorGroupEntryLoading.value = true
  try {
    await loadTotalRequirementList(row.ORDSEQ, row.ITMSEQ, row.MATID, row.SPECID)
    await loadSameBatchnoList(row.MATID, row.SPECID)
  } catch (err: any) {
    ElMessageBox.alert(`查询明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  colorGroupEntryLoading.value = false
  loading.value = false
}

const loadReadinessEntryList = async () => {
  try {
    const remoteSql = remoteSqlMap['批号_齐套明细']
    const params = query.value
    const list = await searchList<ReadinessEntryVO[]>({
      sql: formatString(
        remoteSql.DBQUERY,
        params.ORDNO,
        params.STYNO,
        params.ORIGIN,
        '',
        params.CLNT,
        params.CLNTFTYNO,
        params.CLNTDTTO.start,
        params.CLNTDTTO.end
      ),
      sortby: remoteSql.SORTBYCONTENT
    })

    workOrderListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询齐套明细数据错误：${err.message || JSON.stringify(err)}`)
  }
}

const loadColorGroupList = async (ORDSEQ: number) => {
  if (!ORDSEQ) {
    colorGroupListManager.update([])
    return
  }

  colorGroupLoading.value = true

  try {
    const remoteSql = remoteSqlMap['批号_顏色組']
    const list = await searchList<ReadinessEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, ORDSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorGroupListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询顏色組明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  colorGroupLoading.value = false
}

const loadColorEntryList = async (ORDSEQ: number, ITMSEQ: number, CLSEQ: number) => {
  if (!ORDSEQ || !ITMSEQ || !CLSEQ) {
    colorGroupEntryListManager.update([])
    return
  }

  colorGroupEntryLoading.value = true

  try {
    const remoteSql = remoteSqlMap['批号_顏色明細']
    const list = await searchList<ColorEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, ORDSEQ, ITMSEQ, CLSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    colorGroupEntryListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询顏色明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  colorGroupEntryLoading.value = false
}

const loadAvailableInventoryEntryList = async (ORDSEQ: number, ITMSEQ: number) => {
  if (!ORDSEQ || !ITMSEQ) {
    availableInventoryListManager.update([])
    return
  }

  availableInventoryLoading.value = true

  try {
    const remoteSql = remoteSqlMap['批号_可用庫存']
    const list = await searchList<ColorEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, ORDSEQ, ITMSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })

    availableInventoryListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询可用庫存明细数据错误：${err.message || JSON.stringify(err)}`)
  }

  availableInventoryLoading.value = false
}

const loadSameBatchnoList = async (MATID: number, SPECID: number) => {
  if (!MATID || !SPECID) {
    sameBatchnoListManager.update([])
    return
  }

  sameBatchnoLoading.value = true

  try {
    const remoteSql = remoteSqlMap['批号_同料批号']
    const list = await searchList<ColorEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, MATID, SPECID),
      sortby: remoteSql.SORTBYCONTENT
    })

    sameBatchnoListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询同料批号明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  sameBatchnoLoading.value = false
}

const loadTotalRequirementList = async (
  ORDSEQ: number,
  ITMSEQ: number,
  MATID: number,
  SPECID: number
) => {
  if (!ORDSEQ || !ITMSEQ || !MATID || !SPECID) {
    totalRequirementListManager.update([])
    return
  }

  totalRequirementLoading.value = true

  try {
    const remoteSql = remoteSqlMap['批号_总需求明细']
    const list = await searchList<ColorEntryVO[]>({
      sql: formatString(remoteSql.DBQUERY, ORDSEQ, ITMSEQ, MATID, SPECID),
      sortby: remoteSql.SORTBYCONTENT
    })

    totalRequirementListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询总需求明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  totalRequirementLoading.value = false
}

const loadRegisterDateList = async (ORDSEQ: number) => {
  registerDateLoading.value = true
  try {
    const remoteSql = remoteSqlMap['批号_登记日期明细']
    const list = await searchList<RegisterDateVO[]>({
      sql: formatString(remoteSql.DBQUERY, ORDSEQ),
      sortby: remoteSql.SORTBYCONTENT
    })
    registerDateListManager.update(list)
  } catch (err: any) {
    ElMessageBox.alert(`查询登记日期明细数据错误：${err.message || JSON.stringify(err)}`)
  }
  registerDateLoading.value = false
}

const loadClientItem = async () => {
  try {
    const remoteSql = remoteSqlMap['批号_客户下拉框']
    const options = await searchObject<{ CODE: string; CNAME: string }>({
      sql: remoteSql.DBQUERY,
      params: {
        CODE: query.value.CLNT
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { CODE: string; CNAME: string }
    query.value.CLNT = item.CODE
    query.value.CLNTNAME = item.CNAME
  } catch (e: any) {
    ElMessageBox.alert(`查询客户数据错误：${e.message || JSON.stringify(e)}`)
  }
}

const loadFactoryItem = async () => {
  try {
    const remoteSql = remoteSqlMap['批号_工厂下拉框']
    const options = await searchObject<{ CODE: string; CNAME: string }>({
      sql: remoteSql.DBQUERY,
      params: {
        CODE: query.value.CLNTFTYNO
      },
      sortby: remoteSql.SORTBYCONTENT
    })
    const item = (options || {}) as { CODE: string; CNAME: string }
    query.value.CLNTFTYNO = item.CODE
    query.value.CLNTFTYNAME = item.CNAME
  } catch (e: any) {
    ElMessageBox.alert(`查询工厂数据错误：${e.message || JSON.stringify(e)}`)
  }
}
</script>
