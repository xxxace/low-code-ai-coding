<template>
  <div
    class="min-w-[1248px] view-container h-full box-border relative bg-white p-1 overflow-auto flex flex-col"
  >
    <AceFieldset legend="查询" class="overflow-hidden">
      <div>
        <FieldItem label="出库单" :width="56">
          <el-input class="w-[140px]!" v-model="query.outboundNo" />
        </FieldItem>
        <FieldItem label="工厂" :width="56">
          <el-input class="w-[120px]!" v-model="query.factory" />
        </FieldItem>
        <FieldItem label="部门" :width="28">
          <OptionInput
            :label-width="80"
            :value-width="120"
            value-key="JOBNO"
            v-model="query.JOBNO"
            v-model:labelValue="query.JOBNAME"
          />
        </FieldItem>
        <FieldItem label="产线" :width="28">
          <el-input class="w-[158px]!" v-model="query.productionLine" />
        </FieldItem>
        <FieldItem :width="0">
          <el-button type="primary" size="small" :loading="loading" @click="loadData"
            >查询
          </el-button>
        </FieldItem>
      </div>
      <div class="mt-1">
        <FieldItem label="领料单" :width="56">
          <el-input class="w-[140px]!" v-model="query.materialNo" />
        </FieldItem>
        <FieldItem label="加工合约" :width="56">
          <el-input class="w-[120px]!" v-model="query.contractNo" />
        </FieldItem>
        <FieldItem label="状态" :width="28">
          <el-input class="w-[120px]!" v-model="query.status" />
        </FieldItem>
        <FieldItem label="出库日期" :width="56">
          <date-range-picker
            class="w-[210px]"
            v-model:start="query.outboundDate.start"
            v-model:end="query.outboundDate.end"
          />
        </FieldItem>
      </div>
    </AceFieldset>
    <AceFieldset absolute class="flex-1 overflow-hidden">
      <template #legend>
        <div class="flex items-center mb-1">
          <span>收料明细</span>

          <div class="ml-4 flex items-center gap-4">
            <div class="cursor-pointer flex items-center gap-1">
              <Icon icon="vi-ep:edit" />
              <span>编辑</span>
            </div>
            <!--            <div class="cursor-pointer flex items-center gap-1">-->
            <!--              <Icon icon="vi-ep:document-checked" />-->
            <!--              <span>保存</span>-->
            <!--            </div>-->
          </div>
        </div>
      </template>
      <YarnReceiveTable :data="yarnReceiveList" />
    </AceFieldset>
    <div class="flex flex-1 gap-2 mt-2">
      <AceFieldset legend="出库单明细" absolute class="flex-1 overflow-hidden">
        <OutboundDetailTable :data="outboundDetailList" />
      </AceFieldset>
      <AceFieldset legend="关联领料单" absolute class="flex-[0.5] overflow-hidden">
        <RelatedMaterialTable :data="relatedMaterialList" />
      </AceFieldset>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import YarnReceiveTable from './components/YarnReceiveTable.vue'
import OutboundDetailTable from './components/OutboundDetailTable.vue'
import RelatedMaterialTable from './components/RelatedMaterialTable.vue'
import OptionInput from '@/components/OptionInput.vue'

const query = ref({
  outboundNo: '',
  factory: '',
  department: '',
  productionLine: '',
  outboundDate: { start: '', end: '' },
  materialNo: '',
  contractNo: '',
  status: ''
})
const loading = ref(false)
const yarnReceiveList = ref([
  {
    orderNo: 'FVE02505080',
    type: '生產出庫單',
    factory: '南旋1',
    dept: '电脑电机部',
    line: '电1',
    outDate: '2025-05-30',
    outQty: 1622.38,
    recvQty: 0,
    status: '待收',
    remark: ''
  },
  {
    orderNo: 'FVE02505081',
    type: '生產出庫單',
    factory: '南旋1',
    dept: '电脑电机部',
    line: '电1',
    outDate: '2025-05-31',
    outQty: 3000,
    recvQty: 0,
    status: '待收',
    remark: ''
  }
])
const outboundDetailList = ref([
  {
    colorNo: 'NSY56393',
    colorName: '白色 01(01A) OFF WHITE',
    batchNo: '80250442516',
    applyQty: 692,
    outQty: 692,
    recvQty: '',
    remark: '',
    receiver: '',
    recvDate: '2025-05-30'
  },
  {
    colorNo: 'NSY56393',
    colorName: '白色 01(01A) OFF WHITE',
    batchNo: '24250442516',
    applyQty: 22.08,
    outQty: 22.08,
    recvQty: '',
    remark: '',
    receiver: '',
    recvDate: '2025-05-30'
  },
  {
    colorNo: 'NSY56394',
    colorName: '黑色 09 BLACK',
    batchNo: '01250542985',
    applyQty: 906,
    outQty: 906,
    recvQty: '',
    remark: '',
    receiver: '',
    recvDate: '2025-05-30'
  },
  {
    colorNo: 'NSY45292',
    colorName: '黑色 NSY56394',
    batchNo: '79255-FMK34',
    applyQty: 1.3,
    outQty: 1.3,
    recvQty: '',
    remark: '',
    receiver: '',
    recvDate: '2025-05-30'
  },
  {
    colorNo: 'NSY49135',
    colorName: '白色 NSY41547',
    batchNo: '65033-FMK21',
    applyQty: 1,
    outQty: 1,
    recvQty: '',
    remark: '',
    receiver: '',
    recvDate: '2025-05-30'
  }
])
const relatedMaterialList = ref([
  {
    reqNo: 'FVE02505084',
    contract: 'NV25091033_01',
    reqDate: '2025-05-28',
    reqQty: 692
  }
])

const loadData = () => {
  loading.value = true
  // TODO: 数据请求逻辑
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>
