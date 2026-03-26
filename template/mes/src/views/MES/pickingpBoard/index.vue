<template>
  <div class="board">
    <div class="headerVue">
      <div class="p-10 header">
        <div class="title text-center">
          缝挑/后整生产看板
        </div>
        <div class="right flex">
          <div class="black-box box-r flex-center ml10 c-white font-s14" style="padding: 2px 10px">
            {{ time }}
          </div>
        </div>
      </div>
      <div class="flex-between box">
        <div class="flex-align-center">
          <div class="flex-align-center">
            <div class="text-lg text-bold">工业区：</div>
            <el-select
              v-model="productVal"
              placeholder="请选择"
              size="small"
              style="width: 100px"
              @change="getProductBaseFtyno"
            >
              <el-option
                v-for="item in productBase"
                :key="item.CODE"
                :label="item.CNAME"
                :value="item.CODE"
              >
              </el-option>
            </el-select>
          </div>
          <div class="flex-align-center ml10">
            <div class="text-lg text-bold">工厂：</div>
            <el-select
              v-model="productBaseFtynoVal"
              placeholder="请选择"
              size="small"
              style="width: 150px"
              @change="getWcM"
            >
              <el-option
                v-for="item in productBaseFtynoList"
                :key="item.CODE"
                :label="item.CNAME"
                :value="item.CODE"
              >
              </el-option>
            </el-select>
          </div>
          <div class="flex-align-center ml10">
            <div class="text-lg text-bold">部门：</div>
            <el-select v-model="wcMVal" placeholder="请选择" size="small" style="width: 140px">
              <el-option
                v-for="item in wcMList"
                :key="item.WCSEQ"
                :label="item.CNAME"
                :value="item.WCSEQ"
              >
              </el-option>
            </el-select>
          </div>
          <!-- <div class="flex-align-center ml10">
            <div class="text-lg text-bold">工序：</div>
            <el-select v-model="wcPVal" placeholder="请选择" size="small" style="width: 140px">
              <el-option v-for="item in wcPList" :key="item.JOBNO" :label="item.LNAME" :value="item.JOBNO"> </el-option>
            </el-select>
          </div> -->
          <el-button type="primary" size="small" class="ml10" round @click="query">查 询</el-button>
        </div>
        <div class="flex">
          <div class="flex-align-center mr20">
            <h3>总计划数:</h3>
            <div class="box-r ml10 text-bold c-green" style="font-size: 20px">{{ QTYSUM }}</div>
          </div>
          <!-- <div class="flex-align-center ml10">
            <h3>低效率:</h3>
            <div class="box-r ml10 text-bold c-red" style="font-size: 20px">
              {{ count[0] }}
            </div>
          </div> -->
        </div>
      </div>
    </div>
    <div class="flex">
      <div style="width: 80%">
        <div class="box-r box-s black-box p-10 overflow flex-column" style="height: 350px">
          <el-table
            ref="table"
            :data="dataList"
            height="100%"
            class="black-table"
            show-summary
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="ORDNO" label="生产单号" />
            <el-table-column prop="PMNO" label="加工合约" />
            <el-table-column prop="STYNO" label="款号" />
            <el-table-column prop="JOBNAME" label="工序" />
            <el-table-column prop="DEVTYNAME" label="针种" align="center" />
            <el-table-column prop="KNITDATE" label="片期" align="center" />
            <el-table-column prop="MIN_WKDATE" label="计划完工日期" align="center" />
            <el-table-column prop="QTY" label="计划数量(件)" align="center" width="105" />
            <el-table-column prop="WIP_QTY" label="完成数量(件)" align="center" width="105" />
            <el-table-column prop="WCL" label="完成率" align="left" width="105" />
            <el-table-column prop="MIQTY" label="需料数(磅)" align="center" width="105" />
          </el-table>
        </div>
      </div>
      <rmaterVue class="flex1 ml10" :res-data="dataList" title="完成率" />
    </div>
    <div class="flex mb10">
      <div
        class="box-r box-s black-box p-10 overflow flex-column mt10"
        style="height: 350px; width: 50%"
      >
        <div class="text-bold text-center text-llg c-white">物料信息(暂未对接)</div>
        <div class="flex1 overflow mt10">
          <el-table
            ref="table"
            :data="dataItemList"
            height="100%"
            class="black-table"
            show-summary
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="XH" label="序号" width="60" />
            <el-table-column prop="CM" label="尺码" />
            <el-table-column prop="QTY" label="计划数量" />
            <el-table-column prop="DCQTY" label="待产数量" />
            <el-table-column prop="WCQTY" label="完成数量" />
            <el-table-column prop="WCL" label="完成率" />
            <el-table-column prop="PHQ" label="牌号起" />
            <el-table-column prop="PHZ" label="牌号止" />
          </el-table>
        </div>
      </div>
      <div
        class="box-r box-s black-box p-10 overflow flex-column mt10 ml10"
        style="height: 350px; width: calc(50% - 10px)"
      >
        <div class="text-bold text-center text-llg c-white">产线信息</div>
        <div class="flex1 overflow mt10">
          <el-table
            ref="table"
            :data="dataWcList"
            height="100%"
            class="black-table"
            show-summary
            :summary-method="getSummaries"
          >
            <el-table-column prop="WCNAME" label="产线" />
            <el-table-column prop="PQTY" label="计划数(件)" width="120" />
            <el-table-column prop="FLBL" label="完成数(件)" align="right" width="95" />
            <el-table-column prop="XLQTY" label="需料数(磅)" width="95" />
            <el-table-column prop="FLQTY" label="发料数(磅)" align="right" width="95" />
            <el-table-column prop="QFLQTY" label="欠发料数(磅)" align="right" width="105" />
          </el-table>
        </div>
      </div>
      <!-- <smaterVue class="flex1 ml10 mt10" :res-data="smaterList" title="收货率" /> -->
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import rmaterVue from './components/rmater.vue'
import smaterVue from './components/smater.vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { searchData } from '@/api/nameson'
import { useUserStore } from '@/store/modules/user'
const { userInfo } = useUserStore()

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_HZFLKB'
})
console.log(remoteSqlMap, 'remoteSqlMap')

const time = ref()
const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

onMounted(async () => {
  setInterval(() => {
    time.value = `${dayjs().format('YYYY-MM-DD hh:mm:ss')} ${weekdayNames[dayjs().day()]}`
  }, 1000)
  await getProductBase()
  query()
})

// 获取工业区
const productVal = ref('')
const productBase = ref([])
const getProductBase = async () => {
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工业区下拉框']
  const { data, statusCode } = await searchData({
    sql: DBQUERY.replace(),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode == 1) {
    productBase.value = data
    productVal.value = data[0].CODE
    await getProductBaseFtyno()
  }
}
// 获取工厂
const productBaseFtynoVal = ref('')
const productBaseFtynoList = ref([])
const getProductBaseFtyno = async () => {
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工厂下拉框']
  const { data, statusCode } = await searchData({
    sql: DBQUERY.replace('{1}', productVal.value)
      .replace('{0}', userInfo.username)
      .replace('{0}', userInfo.username),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode == 1) {
    productBaseFtynoList.value = data
    productBaseFtynoVal.value = data[0].CODE
    await getWcM()
  }
}
// 获取部门
const wcMVal = ref('')
const wcMList = ref([])
const getWcM = async () => {
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['部门下拉框']
  const { data, statusCode } = await searchData({
    sql: DBQUERY.replace('{0}', productBaseFtynoVal.value),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode == 1) {
    wcMList.value = data
    wcMVal.value = data[0].CODE
  }
}
// 查询
const query = () => {
   queryData()
   queryDataItem()
   queryDataItemWc()
}
const QTYSUM = ref(0)
const activeRow = ref({
  PSSEQ: '',
  TSKSEQ: '',
  JOBSEQ: ''
})
// 主信息
const dataList = ref([])
const queryData = async () => {
  const WHERE = []
  WHERE.push(`A.ORIGIN='${productVal.value}'`)
  WHERE.push(`A.FTYNO='${productBaseFtynoVal.value}'`)
  WHERE.push(`E.DEPTNO='${wcMVal.value}'`)
  QTYSUM.value = 0
  activeRow.value = {
    PSSEQ: '',
    TSKSEQ: '',
    JOBSEQ: ''
  }
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['物料明细信息']
  const { data, statusCode } = await searchData({sql:DBQUERY, params:WHERE.join(' AND '), sortby:SORTBYCONTENT})
  if (statusCode == 1) {
    dataList.value = data
    data.forEach((item) => {
      QTYSUM.value += Number(item.MIQTY)
    })
    if (dataList.value.length > 0) {
      activeRow.value = {
        PSSEQ: data[0].PSSEQ,
        TSKSEQ: data[0].TSKSEQ,
        JOBSEQ: data[0].JOBSEQ
      }
    }
  }
}
// 物料信息
const dataItemList = ref([])
const queryDataItem = async () => {
  const WHERE = []
  WHERE.push(`D.PSSEQ='${activeRow.value.PSSEQ}'`)
  WHERE.push(`D.TSKSEQ='${activeRow.value.TSKSEQ}'`)
  WHERE.push(`D.JOBSEQ='${activeRow.value.JOBSEQ}'`)
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['物料信息']
  const { data, statusCode } = await searchData({sql:DBQUERY, params:WHERE.join(' AND '), sortby:SORTBYCONTENT})
  if (statusCode == 1) {
    dataItemList.value = data
  }
}
// 产线信息
const dataWcList = ref([])
const queryDataItemWc = async () => {
  const WHERE = []
  WHERE.push(`D.PSSEQ='${activeRow.value.PSSEQ}'`)
  WHERE.push(`D.TSKSEQ='${activeRow.value.TSKSEQ}'`)
  WHERE.push(`D.JOBSEQ='${activeRow.value.JOBSEQ}'`)
    const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['产线信息']
  const { data, statusCode } = await searchData({sql:DBQUERY, params:WHERE.join(' AND '), sortby:SORTBYCONTENT})
  if (statusCode == 1) {
    dataWcList.value = data
  }
}
const tableRowClassName = ({ row, rowIndex }) => {
  if (
    row.PSSEQ == activeRow.value.PSSEQ &&
    row.TSKSEQ == activeRow.value.TSKSEQ &&
    row.JOBSEQ == activeRow.value.JOBSEQ
  ) {
    return 'br-active'
  }
  return ''
}
const getSummaries = ({ columns, data }) => {
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['FHR', 'FHRQ', 'SHR', 'SHRQ'].includes(column.property)) {
      return (sums[index] = '')
    }
    const values = data.map((item) => Number(item[column.property]))
    if (!values.every((value) => Number.isNaN(value))) {
      sums[index] = `${values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!Number.isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0)}`
    } else {
      sums[index] = ''
    }
  })

  return sums
}
</script>
<style lang="scss" scoped>
.board {
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
  background: url(@/assets/imgs/bg.jpg);
  padding: 0 15px 0px 15px;
}
.color-f {
  color: #fff;
}
.header {
  position: relative;
  height: 103px;
  background: url(@/assets/imgs/header.png) no-repeat center;
  background-size: auto 103px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  overflow: hidden;
  .title {
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    background-image: linear-gradient(180deg, #d6e7ff, #006ee3);
    background-clip: text;
    color: transparent;
    font-size: 35px;
    font-weight: bold;
  }

  .right {
    position: absolute;
    right: 0;
    top: 65px;
  }
}
.box {
  color: #fff;
  margin-bottom: 20px;
}
</style>
