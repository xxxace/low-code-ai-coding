<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-04 11:07:51
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-10 14:27:14
 * @FilePath: \77_MES-APS\src\views\MES\rateOfProgress\index.vue
 * @Description: 系統報表—即時在制
-->
<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '部门')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.DEPTNO"
            :sql="remoteSqlMap['部门的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['部门的查询语句'].SORTBYCONTENT"
          />
          <!-- <OptionInput :label-width="60" :value-width="120" value-key="DEPTNO" v-model="query.deptNo"
            v-model:labelValue="query.deptName" /> -->
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '产线')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.WCSEQ"
            :sql="remoteSqlMap['产线的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['产线的查询语句'].SORTBYCONTENT"
          />
          <!-- <el-input class="w-[120px]!" v-model="query.productionLine" placeholder="请输入产线" /> -->
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工序')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.JOBNO"
            :sql="remoteSqlMap['工序的查询语句'].DBQUERY"
            :orderby="remoteSqlMap['工序的查询语句'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '生产工单')" :width="70">
          <el-input class="w-[140px]!" v-model="query.ORDNO" placeholder="请输入生产工单" />
        </FieldItem>

        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="state.loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>
    <!-- <AceFieldset legend="在制列表" class="overflow-hidden">
      <div>
        <el-collapse :accordion="true" @change="handleCollapseChange">
          <el-collapse-item name="1">
            <template #title>
              <div :class="{ collapseTitleCor: state.collapseActive === '1' }">
                <span style="margin-left: 10px">料件编号：AHWOC17032AA</span>
                <span class="ml-10">在制数量：30000</span>
              </div>
            </template>
            <div>
              <vxe-table
                border
                height=""
                :virtual-y-config="{ enabled: false }"
                :span-method="rowspanMethod"
                :data="tableData"
                size="mini"
                :showHeader="true"
              >
                <vxe-column field="name1" align="center" title="部门"></vxe-column>
                <vxe-column field="name2" align="center" title="线别"></vxe-column>
                <vxe-column field="name3" align="center" title="料件编号"></vxe-column>
                <vxe-column field="name4" align="center" title="品名"></vxe-column>
                <vxe-column field="name5" align="center" title="工序"></vxe-column>
                <vxe-column field="name6" align="center" title="工作中心"></vxe-column>
                <vxe-column field="name7" align="center" title="工单号码"></vxe-column>
                <vxe-column field="name8" align="center" title="在制数量"></vxe-column>
                <vxe-column field="name9" align="center" title="不良数量"></vxe-column>
                <vxe-column field="name10" align="center" title="生产状态"></vxe-column>
              </vxe-table>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-collapse :accordion="true" @change="handleCollapseChange">
          <el-collapse-item name="2">
            <template #title>
              <div :class="{ collapseTitleCor: state.collapseActive === '2' }">
                <span style="margin-left: 10px">料件编号：AHWOC17032AA</span>
                <span class="ml-10">在制数量：30000</span>
              </div>
            </template>
            <div>
              <vxe-table
                border
                height=""
                :virtual-y-config="{ enabled: false }"
                :span-method="rowspanMethod"
                :data="tableData"
                size="mini"
                :showHeader="true"
              >
                <vxe-column field="name1" align="center" title="部门"></vxe-column>
                <vxe-column field="name2" align="center" title="线别"></vxe-column>
                <vxe-column field="name3" align="center" title="料件编号"></vxe-column>
                <vxe-column field="name4" align="center" title="品名"></vxe-column>
                <vxe-column field="name5" align="center" title="工序"></vxe-column>
                <vxe-column field="name6" align="center" title="工作中心"></vxe-column>
                <vxe-column field="name7" align="center" title="工单号码"></vxe-column>
                <vxe-column field="name8" align="center" title="在制数量"></vxe-column>
                <vxe-column field="name9" align="center" title="不良数量"></vxe-column>
                <vxe-column field="name10" align="center" title="生产状态"></vxe-column>
              </vxe-table>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </AceFieldset> -->
    <AceFieldset legend="在制列表" class="overflow-hidden flex-1">
      <ReportTable
        ref="tableRef"
        class="h-full"
        footer
        :columns="columns"
        :data="tableData"
        :loading="state.loading"
      >
      </ReportTable>
    </AceFieldset>
  </div>
</template>
<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { useParamsRefManager } from '@/hooks/nameson/useRefManager'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import type { VxeTablePropTypes } from 'vxe-table'
import XEUtils from 'xe-utils'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import dayjs from 'dayjs'
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'

const { t, c } = useI18nProxy('VUE_MES_WORKIN')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_WORKIN' })
interface RowVO {
  id: string
  parentId: string
  name: string

  id1?: string
  id2?: string
  id3?: string
  id4?: string
  name1?: string
  name2?: string
  name3?: string
  name4?: string
  check1?: boolean
  check2?: boolean
  check3?: boolean
  check4?: boolean
}

const tableData = ref<RowVO[]>([])

const state = reactive({
  collapseActive: '1' as string,
  loading: false
})

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
toColTreeData(treeData)

const [query] = useParamsRefManager(() => {
  return {
    DEPTNO: '',
    WCSEQ: '',
    JOBNO: '',
    ORDNO: ''
  }
})

const handleCollapseChange = (collapseActive: string) => {
  console.log(collapseActive)
  state.collapseActive = collapseActive
}

function getList() {
  const list = []
  return list
}

// 将普通树结构转换为横向树列表
function toColTreeData(treeData: any[]) {
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
const columns = reactive<ReportTableColumn[]>([
  { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
  {
    title: '加工合约',
    field: 'PMNO',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '批号',
    field: 'ORDNO',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '款号',
    field: 'STYNO',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '工厂',
    field: 'V_FTYNAME',
    width: 125,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '部门',
    field: 'V_DEPTNAME',
    width: 75,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '工序',
    field: 'JOBNAME',
    width: 50,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '产线',
    field: 'WCNAME',
    width: 100,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '排产日期',
    field: 'WKDATE',
    width: 90,
    align: 'right',
    fixed: 'left'
  },
  {
    title: '排产数量',
    field: 'QTY',
    width: 100,
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '实际产出',
    field: 'WIP_QTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '不良数量',
    field: 'WIP_BADQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '在制数量',
    field:"UNFINQTY",
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '状态',
    field:"STFGNAME",
    width: 80,
    align: 'right',
    headerAlign: 'center',
  }
])

const loadData = async () => {
  state.loading=true
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['明细的查询语句']
    const list = await searchList<[]>({
      sql: DBQUERY,
      params: {
        'W.DEPTNO': query.value.DEPTNO,
        'B.WCSEQ': query.value.WCSEQ,
        'B.JONO': query.value.JOBNO
      },
      sortby: SORTBYCONTENT
    })
    tableData.value=list
  } catch (e: any) {
    ElMessageBox.alert(`生产明细记录:${e.message || JSON.stringify(e)}`)
  }
  state.loading=false
}
</script>
<style lang="scss" scoped>
.zzUl {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  justify-content: space-between;
  gap: 10px;

  li {
    padding: 5px 0;
    border-radius: 5px;
    text-align: center;
    font-size: 13px;
  }
}

.collapseTitleCor {
  color: #0952eb;
  font-weight: 700;
}
</style>
