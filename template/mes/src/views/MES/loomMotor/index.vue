<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '加工合约号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.PMNO" placeholder="请输入加工合约号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '生产单号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.ORDNO" placeholder="请输入生产单号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '款号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.STYNO" placeholder="请输入款号" />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '开始日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '结束日期')" :width="90">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
      </div>
      <div class="my-1">
        <!-- <FieldItem :label="t('lbBOOKER', '状态')" :width="70">
          <el-input class="w-[140px]!" v-model="query.productionLine" placeholder="请输入状态" />
        </FieldItem> -->
        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>

    <!-- <div class="bg-white p-1" style="border-radius: 8px">
      <div class="basicInfo">
        <AceFieldset legend="基础信息" absolute class="flex-1 overflow-hidden" style="height: 100%;">
          <ul class="basecUl">
            <li>
              <el-input v-model="state.input1" style="max-width: 600px" placeholder="FAC12">
                <template #prepend>工厂</template>
              </el-input>
            </li>
            <li>
              <el-input v-model="state.input2" style="max-width: 600px" placeholder="织机车间">
                <template #prepend>车间</template>
              </el-input>
            </li>
            <li>
              <el-input v-model="state.input3" style="max-width: 600px" placeholder="电1">
                <template #prepend>产线</template>
              </el-input>
            </li>

            <li>
              <el-input v-model="state.input4" style="max-width: 600px" placeholder="织机">
                <template #prepend>工序</template>
              </el-input>
            </li>

          </ul>
        </AceFieldset>
      </div>
    </div> -->

    <!-- 工单列表 -->
    <div class="bg-white p-1" style="border-radius: 8px">
      <div class="WorkOrder">
        <AceFieldset
          legend="工单列表"
          absolute
          class="flex-1 overflow-hidden"
          style="height: 300px"
        >
          <!-- <ul class="basecUl">
            <li>
              <el-button type="primary" size="small">编辑</el-button>
            </li>
            <li class="ml-1">
              <el-button type="primary" size="small">保存</el-button>
            </li>
            <li class="ml-1">
              <el-button type="primary" size="small">发料</el-button>
            </li>
          </ul> -->
          <div class="flex-1 overflow-hidden mt-1" style="height: 250px">
            <WorkorderTable :data="reportList" :loading="loading" />
          </div>
        </AceFieldset>
      </div>
    </div>

    <!-- 物料明细 -->
    <div class="bg-white p-1" style="border-radius: 8px">
      <div class="WorkOrder">
        <AceFieldset
          legend="物料明细"
          absolute
          class="flex-1 overflow-hidden"
          style="height: 400px"
        >
          <MaterialsTable :data="materialsList" :loading="loading" />
        </AceFieldset>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'

import WorkorderTable from '@/views/MES/loomMotor/components/systemTable/Workorder.vue'
import MaterialsTable from '@/views/MES/loomMotor/components/systemTable/Materials.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { ElMessageBox } from 'element-plus'
import { searchList } from '@/api/nameson'
import dayjs from 'dayjs'
const state = reactive({
  input1: '',
  input2: '',
  input3: '',
  input4: '',
  input5: '',
  input6: '',
  input7: '',
  input8: '',
  input9: '',
  input10: ''
})

const { t, c } = useI18nProxy('VUE_MES_WC_ZJ')
const remoteSqlMap = useRemoteSqlMap({ objectName: 'VUE_MES_WC_ZJ' })

const [reportList, reportListManager] = useArrayRefManager<any[]>([])
const [materialsList, materialsListManager] = useArrayRefManager<any[]>([])

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: '',
    endDate: '',
    PMNO: '',
    ORDNO: '',
    STYNO: ''
  }
})
const loading = ref(false)
const loadData = async () => {
  loading.value = true
  try {
    await queryWorkOrderData()
    await queryMatData()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
  loading.value = false
}
// 查询工单列表
const queryWorkOrderData = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工单列表的查询语句']
    const list = await searchList<[]>({
      sql: DBQUERY,
      params: {
        'G.PMNO': query.value.PMNO,
        'J.ORDNO': query.value.ORDNO,
        'F.STYNO': query.value.STYNO,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    reportListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产明细记录:${e.message || JSON.stringify(e)}`)
  }
}
// 查询物料
const queryMatData = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['物料明细的查询语句']
    const list = await searchList<[]>({
      sql: DBQUERY,
      params: {
        'G.PMNO': query.value.PMNO,
        'J.ORDNO': query.value.ORDNO,
        'S.STYNO': query.value.STYNO,
        'E.WKDATE__gte@date': query.value.startDate,
        'E.WKDATE__lte@date': query.value.endDate
      },
      sortby: SORTBYCONTENT
    })
    materialsListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`生产明细记录:${e.message || JSON.stringify(e)}`)
  }
}

onMounted(() => {
  // 设置默认日期范围（最近7天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  queryManager.update({
    ...query.value,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  })

  loadData()
})
</script>
<style lang="scss" scoped>
.basicInfo {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .basecUl {
    height: 100%;
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: auto auto auto auto;
    justify-content: flex-start;
    align-items: center;

    li {
    }
  }
}

.WorkOrder {
  .basecUl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: auto auto auto auto;
    justify-content: flex-start;
    align-items: center;
  }
}
</style>
