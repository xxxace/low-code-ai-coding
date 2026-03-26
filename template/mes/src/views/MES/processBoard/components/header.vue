<template>
  <div>
    <div class="p-10 header">
      <div class="title text-center">
        生产工序看板（本周）
        <div style="font-size: 14px; margin-top: 5px">PRODUCTION PROCESS</div>
      </div>

      <div class="right flex">
        <div class="black-box box-r flex-center ml10 c-white" style="padding: 10px">
          <Icon icon="vi-ep:timer" style="margin-right: 5px" />
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
          <el-select
            v-model="wcMVal"
            placeholder="请选择"
            size="small"
            style="width: 140px"
            @change="getWcP2Jobno"
          >
            <el-option
              v-for="item in wcMList"
              :key="item.WCSEQ"
              :label="item.CNAME"
              :value="item.WCSEQ"
            >
            </el-option>
          </el-select>
        </div>
        <div class="flex-align-center ml10">
          <div class="text-lg text-bold">工序：</div>
          <el-select v-model="wcPVal" placeholder="请选择" size="small" style="width: 140px">
            <el-option
              v-for="item in wcPList"
              :key="item.JOBNO"
              :label="item.LNAME"
              :value="item.JOBNO"
            >
            </el-option>
          </el-select>
        </div>
        <el-button type="primary" size="small" class="ml10" round @click="updata">查 询</el-button>
      </div>
      <div class="flex">
        <!-- <div class="flex-align-center mr20">
                    <h3>高效率:</h3>
                    <div class="box-r ml10 text-bold c-green" style="font-size: 20px">
                        {{ count[1] }}
                    </div>
                </div>
                <div class="flex-align-center ml10">
                    <h3>低效率:</h3>
                    <div class="box-r ml10 text-bold c-red" style="font-size: 20px">
                        {{ count[0] }}
                    </div>
                </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRemoteSqlMap } from '@/hooks/nameson/useFetchSql'
import { searchData } from '@/api/nameson'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/modules/user'
const { userInfo } = useUserStore()

const emit = defineEmits(['updata'])

const remoteSqlMap = useRemoteSqlMap({
  objectName: 'VUE_MES_PJB'
})
console.log(remoteSqlMap)
const productVal = ref('')
const productBaseFtynoVal = ref('')
const wcMVal = ref('')
const wcPVal = ref('')
const time = ref('')
const productBase = ref([])
const productBaseFtynoList = ref([])
const wcMList = ref([])
const wcPList = ref([])
onMounted(async () => {
  setInterval(() => {
    time.value = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} ${getCurrentWeekday()}`
  }, 1000)
  await getProductBase()
})
// 获取当前星期几
function getCurrentWeekday() {
  // 获取当前日期的星期几（0-6）
  const dayOfWeek = dayjs().day()

  // 创建一个星期名称的数组
  const weekdays = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  // 使用dayOfWeek作为索引获取星期名称
  const weekdayName = weekdays[dayOfWeek]

  // 返回星期名称
  return weekdayName
}
const getProductBase = async () => {
  productBaseFtynoList.value = []
  productBaseFtynoVal.value = ''
  wcMList.value = []
  wcMVal.value = ''
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工业区下拉框']
  const { data, statusCode } = await searchData({ sql: DBQUERY, params: '', sortby: SORTBYCONTENT })
  if (statusCode != 1) return
  productBase.value = data
  productVal.value = data[0].CODE
  getProductBaseFtyno()
}
// 工厂
const getProductBaseFtyno = async () => {
  productBaseFtynoList.value = []
  productBaseFtynoVal.value = ''
  wcMList.value = []
  wcMVal.value = ''
  const { username, sessionId } = userInfo
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工厂下拉框']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}'], [productVal.value, username]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  productBaseFtynoList.value = data
  productBaseFtynoVal.value = data[0].CODE
  getWcM()
}
// 部门
const getWcM = async () => {
  wcMList.value = []
  wcMVal.value = ''
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['部门下拉框']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}', '{1}'], [productVal.value, productBaseFtynoVal.value]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  wcMList.value = data
  wcMVal.value = data[0].WCSEQ
  getWcP2Jobno()
}
// 工序
const getWcP2Jobno = async () => {
  wcPList.value = []
  wcPVal.value = ''
  const { DBQUERY, SORTBYCONTENT } = remoteSqlMap['工序下拉框']
  const { data, statusCode } = await searchData({
    sql: setSQLCSREPLACE(DBQUERY, ['{0}'], [wcMVal.value]),
    params: '',
    sortby: SORTBYCONTENT
  })
  if (statusCode != 1) return
  wcPList.value = data
  wcPVal.value = data[0].JOBNO
  updata()
}
const updata = () => {
  emit('updata', {
    productBaseFtynoVal: productBaseFtynoVal.value,
    productVal: productVal.value,
    wcPVal: wcPVal.value,
    wcMVal: wcMVal.value
  })
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
