<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '工业区')" :width="50">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.origin"
            :sql="remoteSqlMap['工业区下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工业区下拉框'].SORTBYCONTENT"
          />
        </FieldItem>

        <FieldItem :label="t('lbBOOKER', '工厂')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.ftyno"
            :sql="remoteSqlMap['工厂下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工厂下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '产线')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.wcno"
            :sql="remoteSqlMap['产线下拉框'].DBQUERY"
            :orderby="remoteSqlMap['产线下拉框'].SORTBYCONTENT"
            :params="`A.ORIGIN='${query.origin}' AND A.FTYNO='${query.ftyno}'`"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工序')" :width="70">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.jobno"
            :sql="remoteSqlMap['工序下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工序下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <!-- <FieldItem :label="t('lbBOOKER', '针种')" :width="42">
          <el-input class="w-[120px]!" v-model="query.eqmmod" placeholder="请输入针种" />
        </FieldItem> -->

        <FieldItem :label="t('lbBOOKER', '计划开始日期')" :width="110">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>

        <FieldItem :label="t('lbBOOKER', '计划结束日期')" :width="110">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loadingComputed" @click="queryEvent"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>

    <!-- 生产工序 -->
    <AceFieldset legend="生产工序" absolute class="flex-1 mt-1 overflow-hidden">
      <ProcessComponent :loading="loadingOne" />
    </AceFieldset>

    <!-- 生产园区 -->
    <AceFieldset legend="生产园区" absolute class="flex-1 mt-1 overflow-hidden">
      <ParkComponent :loading="loadingTwo" />
    </AceFieldset>

    <!-- 生产计划 -->
    <AceFieldset legend="生产计划" absolute class="flex-1 mt-1 overflow-hidden">
      <Process :data="processList" :loading="loadingThree" />
    </AceFieldset>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, defineComponent, computed, watch } from 'vue'
import type { VxeTablePropTypes } from 'vxe-table'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import XEUtils from 'xe-utils'
import Process from '@/views/MES/productionScheduling/components/systemTable/Process.vue'
import type { productionItemVO, productionOriginVO } from '$types/views/MES/productionScheduling.ts'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql.ts'
import dayjs from 'dayjs'
import { searchList } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'
import { any } from 'vue-types'
import { obj } from '@visactor/vtable/es/tools/helper'

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_PSDS'
})

interface RowVO {
  JOBNAME: string
  JTQTY: number
  STFGNAME: string
  day1?: number
  day2?: number
  day3?: number
  day4?: number
  day5?: number
  day6?: number
  day7?: number
}

interface RowVO2 {
  id: number
  ORIGINNAME: string
  FTYNAME: string
  WCNAME: string
  JTQTY: string
  WKHRS: number
  RQTY: number
  day1_QTY: number
  day1_QTY1: number
  day2_QTY: number
  day2_QTY1: number
  day3_QTY: number
  day3_QTY1: number
  day4_QTY: number
  day4_QTY1: number
  day5_QTY: number
  day5_QTY1: number
  day6_QTY: number
  day6_QTY1: number
  day7_QTY: number
  day7_QTY1: number
}

interface dayColumnAo {
  field: string
  title: string
}

const tableData = ref<RowVO[]>([])
const [processList, materialListManager] = useArrayRefManager<any[]>([])

const getList = () => {
  const list = [
    { id: '100000000', parentId: null, name: '织机' },
    { id: '110000000', parentId: '100000000', name: '160' },

    { id: '111000000', parentId: '110000000', name: '产能(小时)' },
    { id: '111100000', parentId: '111000000', name: '2354' },

    { id: '112000000', parentId: '110000000', name: '排产(小时)' },
    { id: '112100000', parentId: '112000000', name: '2874' },

    { id: '112300000', parentId: '110000000', name: '完工(小时)' },
    { id: '112310000', parentId: '112300000', name: '5471' },

    { id: '114000000', parentId: '110000000', name: '待产(小时)' },
    { id: '114100000', parentId: '114000000', name: '234' },

    { id: '115000000', parentId: '110000000', name: '完工率(%)' },
    { id: '115100000', parentId: '115000000', name: '20.3%' },

    { id: '116000000', parentId: '110000000', name: '负荷(%)' },
    { id: '116100000', parentId: '116000000', name: '82.1%' },

    { id: '111200000', parentId: '111100000', name: '845' },

    { id: '111300000', parentId: '112100000', name: '2232' },

    { id: '112311000', parentId: '112310000', name: '4071' },

    { id: '114110000', parentId: '114100000', name: '234' },

    { id: '115110000', parentId: '115100000', name: '20.3%' },

    { id: '116110000', parentId: '116100000', name: '82.1%' }
  ]
  return list
}

// 将普通树结构转换为横向树列表
const toColTreeData = (treeData: any[]) => {
  const options = { children: 'children' }
  const list: any[] = []
  const keyMap: any = {}
  XEUtils.eachTree(
    treeData,
    (item, index, result, paths, parent) => {
      keyMap[item.id] = item
      item.keys = parent ? parent.keys.concat([item.id]) : [item.id]
      if (!item.children || !item.children.length) {
        const row: any = {}
        item.keys.forEach((key: any, index: number) => {
          const level = index + 1
          const obj = keyMap[key]
          row[`check${level}`] = false
          row[`id${level}`] = obj.id
          row[`name${level}`] = obj.name
        })
        list.push(row)
      }
    },
    options
  )
  tableData.value = list
}

// 通用行合并函数（将多行相同字段的数据合并为一行）
const rowspanMethod: VxeTablePropTypes.SpanMethod = ({ row, _rowIndex, column, visibleData }) => {
  const fields = [
    'name1',
    'name2',
    'name3',
    'name4',
    'name5',
    'name6',
    'name7',
    'name8',
    'name9',
    'name10'
  ]
  const cellValue = row[column.field]
  if (cellValue && fields.includes(column.field)) {
    const prevRow = visibleData[_rowIndex - 1]
    let nextRow = visibleData[_rowIndex + 1]
    if (prevRow && prevRow[column.field] === cellValue) {
      return { rowspan: 0, colspan: 0 }
    } else {
      let countRowspan = 1
      while (nextRow && nextRow[column.field] === cellValue) {
        nextRow = visibleData[++countRowspan + _rowIndex]
      }
      if (countRowspan > 1) {
        return { rowspan: countRowspan, colspan: 1 }
      }
    }
  }
}

const treeData = XEUtils.toArrayTree(getList())
// toColTreeData(treeData)

const tableData2 = ref<RowVO2[]>([])

const mergeCells = ref<VxeTablePropTypes.MergeCells>([
  { row: 0, col: 4, rowspan: 1, colspan: 2 },
  { row: 2, col: 4, rowspan: 1, colspan: 2 }
])

const saveMergeData = () => {
  console.log(mergeCells.value)
}

const { t, c } = useI18nProxy('VUE_MES_SYSTEMREPORT')

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(6, 'd').format('YYYY-MM-DD'),
    origin: '',
    ftyno: '',
    wcno: '',
    jobno: '',
    eqmmod: ''
  }
})
/**
 * 获取两个日期之间的所有日期（包含首尾日期）
 * @param {string | Date} startDate - 开始日期（支持 'YYYY-MM-DD' 字符串或 Date 对象）
 * @param {string | Date} endDate - 结束日期（支持 'YYYY-MM-DD' 字符串或 Date 对象）
 * @param {string} format - 返回日期格式（默认 'YYYY-MM-DD'，可选其他格式如 'MM/DD/YYYY'）
 * @returns {string[]} 两个日期之间的所有日期数组
 */
const datesBetWeenData = ref<string[]>([])
const getDatesBetween = (
  startDate: string | Date,
  endDate: string | Date,
  format = 'YYYY-MM-DD'
) => {
  // 1. 统一解析日期为 Date 对象（处理字符串/Date 混合输入）
  const parseDate = (date: string | Date) => {
    if (date instanceof Date) return new Date(date)
    // 处理 'YYYY-MM-DD' 字符串（避免时区偏移导致日期错误，如 '2024-01-01' 解析为前一天）
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day) // 月份从 0 开始，需减 1
  }

  let start = parseDate(startDate)
  let end = parseDate(endDate)
  const dateForamtList: dayColumnAo[] = []
  const dateList: string[] = []
  // 2. 确保 start <= end（处理用户输入的日期顺序颠倒）
  if (start > end) [start, end] = [end, start]
  const diffDat = dayjs(end).diff(dayjs(start), 'day')

  if (diffDat > 6) return ElMessageBox.alert(`只查询7天的日期数据！`)
  // 3. 循环生成中间所有日期（每次递增 1 天）
  const currentDate = new Date(start) // 避免修改原 start 日期
  let index: number = 0
  while (currentDate <= end) {
    index = index + 1
    // 格式化日期为指定格式（默认 YYYY-MM-DD）
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // 补 0 为两位数
    const day = String(currentDate.getDate()).padStart(2, '0')
    const dayWeekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const week = dayWeekList[dayjs(`${year}-${month}-${day}`).format('d')]
    const formattedDate = {
      field: `day${index}`,
      title: ''
    }
    switch (format) {
      case 'YYYY-MM-DD':
        formattedDate.title = `${year}-${month}-${day}`
        break
      case 'MM/DD/YYYY':
        formattedDate.title = `${month}/${day}/${year}`
        break
      case 'MM/DD':
        formattedDate.title = `${month}/${day}(${week})`
        break
      default:
        formattedDate.title = `${year}-${month}-${day}` // 默认格式
    }
    dateForamtList.push(formattedDate)
    dateList.push(`${year}-${month}-${day}`)
    // 4. 日期递增 1 天（创建新日期，避免修改原对象）
    currentDate.setDate(currentDate.getDate() + 1)
  }
  processColumnList.value = [
    {
      field: 'JOBNAME',
      title: '工序'
    },
    {
      field: 'JTQTY',
      title: '机台数人数'
    },
    {
      field: 'STFGNAME',
      title: '类型'
    },
    ...dateForamtList
  ]
  parkColumnList.value = [...dateForamtList]
  datesBetWeenData.value = dateList
}
const processColumnList = ref<dayColumnAo[]>([])

const parkColumnList = ref<dayColumnAo[]>([])

const ProcessComponent = defineComponent({
  setup() {
    return () => (
      <vxe-table
        border
        height="200"
        size="mini"
        loading={loadingOne.value}
        virtual-y-config={{ enabled: false }}
        span-method={rowspanMethod}
        data={tableData.value}
      >
        {processColumnList.value.map((item) => (
          <vxe-column field={item.field} title={item.title}></vxe-column>
        ))}
      </vxe-table>
    )
  }
})

const ParkComponent = defineComponent({
  setup() {
    return () => (
      <vxe-table
        border
        min-height="200"
        loading={loadingTwo.value}
        data={tableData2.value}
        merge-cells={mergeCells.value}
        size="mini"
      >
        <vxe-column type="seq" width="70" fixed="left"></vxe-column>
        <vxe-column field="ORIGINNAME" title="工业园" width="90" fixed="left"></vxe-column>
        <vxe-column field="FTYNAME" title="工厂" width="90" fixed="left"></vxe-column>
        <vxe-column field="WCNAME" title="产线" width="100" fixed="left"></vxe-column>
        <vxe-column field="JTQTY" title="机台人数" width="90" fixed="left"></vxe-column>
        <vxe-column field="WKHRS" title="工时" width="90" fixed="left"></vxe-column>
        <vxe-column field="RQTY" title="日产量" width="90" fixed="left"></vxe-column>

        {parkColumnList.value.map((item) => (
          <vxe-colgroup title={item.title} field={item.field} header-align="center">
            <vxe-column field={item.field + '_QTY'} title="计划" width="90"></vxe-column>
            <vxe-column field={item.field + '_QTY1'} title="完工" width="90"></vxe-column>
          </vxe-colgroup>
        ))}
      </vxe-table>
    )
  }
})
const loadingOne = ref(false)
const loadingTwo = ref(false)
const loadingThree = ref(false)
const loadingComputed = computed(() => {
  return loadingOne.value || loadingTwo.value || loadingThree.value
})
// 查询
const queryEvent = async () => {
  getDatesBetween(query.value.startDate, query.value.endDate, 'MM/DD')
  queryJob()
  queryOrgin()
  queryPSDS()
}
const queryJob = async () => {
  loadingOne.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['生产工序信息']
    const list = await searchList<productionItemVO[]>({
      sql: DBQUERY,
      params: {
        'A.ORIGIN': query.value.origin,
        'A.FTYNO': query.value.ftyno,
        'E.WCSEQ': query.value.wcno,
        'E.JONO': query.value.jobno,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })

    tableData.value = transJobData(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产工序信息:${e.message || JSON.stringify(e)}`)
  }
  loadingOne.value = false
}
const queryOrgin = async () => {
  loadingTwo.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['生产园区信息']
    const list = await searchList<productionItemVO[]>({
      sql: DBQUERY,
      params: {
        'A.ORIGIN': query.value.origin,
        'A.FTYNO': query.value.ftyno,
        'E.WCSEQ': query.value.wcno,
        'E.JONO': query.value.jobno,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    tableData2.value = transOriginData(list)
    console.log(tableData2.value)
  } catch (e: any) {
    ElMessageBox.alert(`生产园区信息:${e.message || JSON.stringify(e)}`)
  }
  loadingTwo.value = false
}
const queryPSDS = async () => {
  loadingThree.value = true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['生产计划信息']
    const list = await searchList<productionItemVO[]>({
      sql: DBQUERY,
      params: {
        'A.ORIGIN': query.value.origin,
        'A.FTYNO': query.value.ftyno,
        'E.WCSEQ': query.value.wcno,
        'E.JONO': query.value.jobno,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    materialListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产计划信息:${e.message || JSON.stringify(e)}`)
  }
  loadingThree.value = false
}
// 生产工序数据格式化
const transJobData = (rawData: productionItemVO[]): RowVO[] => {
  const groupedData = rawData.reduce((acc: any, item: productionItemVO) => {
    const key = item.JOBNO
    if (!acc[key]) {
      acc[key] = {
        JOBNAME: item.JOBNAME,
        JTQTY: item.JTQTY,
        STFGNAME: item.STFGNAME
        // LIST:[]
      }
    }
    const index = datesBetWeenData.value.indexOf(item.WKDATE)
    if (!acc[key][`day${index + 1}`]) {
      acc[key][`day${index + 1}`] = item.WKHRS
    }
    let num = acc[key][`day${index + 1}`]
    acc[key][`day${index + 1}`] = num + item.WKHRS
    // if (!acc[key].list[item.WKDATE]) {
    //   acc[key].list[item.WKDATE]=item.WKHRS
    // }
    // let num = acc[key].list[item.WKDATE].WKHRS
    // acc[key] = num + item.WKHRS
    return acc
  }, {})
  const list: RowVO[] = Object.values(groupedData)
  return list
}
// 生产园区数据格式化
const transOriginData = (rawData: productionOriginVO[]): RowVO2[] => {
  let SEQ = 0
  const groupedData = rawData.reduce((acc: any, item: productionOriginVO) => {
    const key = item.JOBNO
    if (!acc[key]) {
      SEQ = SEQ + 1
      acc[key] = {
        // SEQ:SEQ,
        ORIGINNAME: item.ORIGINNAME,
        FTYNAME: item.FTYNAME,
        WCNAME: item.WCNAME,
        JTQTY: item.JTQTY,
        WKHRS: item.WKHRS,
        RQTY: 120
      }
    }
    const index = datesBetWeenData.value.indexOf(item.WKDATE)
    if (!acc[key][`day${index + 1}_QTY`]) {
      acc[key][`day${index + 1}_QTY`] = item.QTY
      acc[key][`day${index + 1}_QTY1`] = item.WIP_QTY
    }
    let num = acc[key][`day${index + 1}_QTY`]
    let num1 = acc[key][`day${index + 1}_QTY1`]
    acc[key][`day${index + 1}_QTY`] = num + item.QTY
    acc[key][`day${index + 1}_QTY1`] = num1 + item.WIP_QTY
    return acc
  }, {})
  const list: RowVO2[] = Object.values(groupedData)
  return list
}
// watch(
//   () => query.value.startDate,
//   () => {
//     getDatesBetween(query.value.startDate, query.value.endDate, 'MM/DD')
//   }
// )
// watch(
//   () => query.value.endDate,
//   () => {
//     getDatesBetween(query.value.startDate, query.value.endDate, 'MM/DD')
//   }
// )

onMounted(() => {
  queryEvent()
})
</script>

<style scoped lang="scss"></style>
