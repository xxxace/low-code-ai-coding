<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-04 17:07:39
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-08 16:21:18
 * @FilePath: \77_MES-APS\src\views\MES\performance\index.vue
 * @Description: 系统报表-员工绩效
-->
<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col systemReportPage"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem :label="t('lbBOOKER', '开始日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '结束日期')" :width="70">
          <el-date-picker
            class="w-[140px]!"
            v-model="query.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工厂')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.FTYNO"
            :sql="remoteSqlMap['工厂下拉框'].DBQUERY"
            :orderby="remoteSqlMap['工厂下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '部门')" :width="42">
          <RemoteSelect
            class="w-[120px]!"
            autoLoad
            transfer
            v-model="query.DEPTNO"
            :sql="formatString(remoteSqlMap['部门下拉框'].DBQUERY,query.FTYNO)"
            :orderby="remoteSqlMap['部门下拉框'].SORTBYCONTENT"
          />
        </FieldItem>
        <FieldItem :label="t('lbBOOKER', '工号')" :width="70">
          <el-input class="w-[140px]!" v-model="query.EMPNO" placeholder="请输入职员工号" />
        </FieldItem>
        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >{{ c('查询', 'common.query') }}
          </el-button>
        </FieldItem>
      </div>
    </AceFieldset>

    <!-- 表格区域 -->
    <AceFieldset legend="统计" absolute class="flex-1 overflow-hidden">
      <SystemReportTable :data="reportList" :loading="loading"/>
    </AceFieldset>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18nProxy } from '@/hooks/nameson/useI18nProxy'
import { useArrayRefManager, useParamsRefManager } from '@/hooks/nameson/useRefManager'
import SystemReportTable from '@/views/MES/performance/components/systemTable/index.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql.ts'
import { formatString, parseImgSrc } from '@/utils'
import { searchList, searchObject } from '@/api/nameson'
import { ElMessageBox } from 'element-plus'

const loading = ref(false)

const { t, c } = useI18nProxy('VUE_MES_EMPKPIRPT')
const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_EMPKPIRPT'
})

const [reportList, reportListManager] = useArrayRefManager<any[]>([])

const [query, queryManager] = useParamsRefManager(() => {
  return {
    startDate: '',
    endDate: '',
    FTYNO: '',
    DEPTNO: '',
    EMPNO: ''
  }
})

const loadData = async () => {
  loading.value = true
  try {
    await queryEmpData()
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}
const queryEmpData = async () => {
  try {
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['员工绩效清单']
    const list = await searchList<[]>({
      sql: formatString(
        DBQUERY,
        query.value.startDate,
        query.value.endDate,
        query.value.FTYNO,
        query.value.DEPTNO,
        query.value.EMPNO
      ),
      sortby: SORTBYCONTENT
    })
    reportListManager.update(list)
  } catch (e: any) {
    ElMessageBox.alert(`员工绩效清单:${e.message || JSON.stringify(e)}`)
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
