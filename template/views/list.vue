<template>
  <div class="view-container">
    <div class="p-1 mb-1">
      <FieldItem label="周期" :width="28">
        <el-date-picker
            class="w-[180px]!"
            v-model="query.dateRange"
            size="small"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :editable="false"
            :disabled-date="checkDisableDate"
        />
      </FieldItem>
      <FieldItem label="店铺" :width="28">
        <el-input
            class="w-[130px]!"
            v-model="query.USERNO"
            placeholder="请输入店铺名称"
            :clearable="true"
        />
      </FieldItem>
      <FieldItem label="ID" :width="28">
        <el-input
            class="w-[130px]!"
            v-model="query.MATID"
            placeholder="请输入ID"
            :clearable="true"
        />
      </FieldItem>
      <FieldItem label="商品计划名" :width="70">
        <el-input
            class="w-[180px]!"
            v-model="query.MATNAME"
            placeholder="请输入商品计划名"
            :clearable="true"
        />
      </FieldItem>
      <FieldItem :width="0">
        <el-button
            type="primary"
            size="small"
            :loading="loading"
            @click="handleSearch"
        >查询
        </el-button>
        <el-button
            type="primary"
            size="small"
            :loading="loading"
            @click="handleReset"
        >重置
        </el-button>
      </FieldItem>
    </div>

    <section class="card-section flex-1 flex flex-col">
      <DataSum class="mb-2" config-key="jdzy-quanzhan" :columns="dataSumColumns" :data="summaryData"/>

      <DataTable class="flex-1" :loading="loading" :data="dataList"/>

      <el-pagination
          size="small"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 300, 500, 1000]"
          :disabled="loading || pagination.total === 0"
          :background="true"
          layout="sizes, prev, pager, next, jumper, total"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from "vue";
import dayjs from "dayjs";
import FieldItem from "@/nameson/components/FieldItem/index.vue";
import DataTable from "./components/dataTable.vue";
import {useArrayRefManager, useParamsRefManager,} from "@/hooks/nameson/useRefManager";
import {
  fetchQuanZhanItemList,
  fetchSummaryData,
  type QuanZhanItemVO,
  type QuanZhanSummaryVO
} from "@/api/nameson/services/analysises/jdzy/quanZhan";
import DataSum from "@/components/DataSum/index.vue";
import {dataSumColumns} from './constants/dataSumColumns'

const loading = ref(false);

const [query, queryManager] = useParamsRefManager(() => {
  return {
    dateRange: [dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")],
    USERNO: "",
    MATNAME: "",
    MATID: "",
  };
});

const pagination = reactive({
  page: 1,
  pageSize: 100,
  total: 0,
});

const summaryData = ref<Partial<QuanZhanSummaryVO>>({})
const [dataList, dataListManager] = useArrayRefManager<QuanZhanItemVO>([]);

const checkDisableDate = (date) => {
  return date.getTime() > new Date().getTime()
}

const handleCurrentChange = () => {
  loadData();
};
const handleSizeChange = () => {
  loadData();
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const loadData = async () => {
  try {
    loading.value = true;

    const params = {
      "A.DT__gte@date": query.value.dateRange[0],
      "A.DT__lte@date": query.value.dateRange[1],
      "A.USERNO__like": query.value.USERNO,
      "A.MATNAME__like": query.value.MATNAME,
      "A.MATID__like": query.value.MATID,
    }

    const res = await fetchQuanZhanItemList({
      ...params,
      pageNo: pagination.page,
      pageSize: pagination.pageSize,
    });

    pagination.total = Number(res.totalsize || 0);
    dataListManager.update(res.data);

    let summary = {}
    if (res.data && res.data.length > 0) {
      summary = await fetchSummaryData(params);
    }
    summaryData.value = summary
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  queryManager.reset();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.view-container {
  padding: 0;

  h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #333;
  }

  .card-section {
    padding: 10px;
    border: 1px solid #eaeaea;
    border-radius: 8px;
    background-color: #f9f9f9;

    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #666;
    }
  }

  .test-table {
    margin-top: 20px;
  }
}
</style>
