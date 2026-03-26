<template>
  <el-container :class="WithoutLayout?'elHtightT':'elHtightF'">
    <el-aside class="left-aside flex-column" width="350px">
      <div class="search flex-column mb10">
        <div class="c-white mb10 text-bold"> 批號搜索 </div>
        <el-input
          v-model="searchVal"
          class="mb10"
          prefix-icon="Search"
          ref="ordInput"
          placeholder="請輸入批號"
          @keyup.enter="getOrdInfoEvent"
          @change="getOrdInfoEvent"
          clearable
        />
        <div class="c-white mb10 text-bold"> 工號/条码(扫描用户厂证) </div>
        <el-input
          v-model="barcode"
          class="mb10"
          prefix-icon="Search"
          ref="barInput"
          placeholder="請輸入工號"
          @keyup.enter="getEmpInfoEvent"
          @change="getEmpInfoEvent"
          clearable
        />
        <!-- <el-button type="primary" @click="getEmpInfoEvent">
          搜索
        </el-button> -->
      </div>
      <el-scrollbar
        class="flex1"
        v-loading="loading"
        element-loading-text="加載中..."
        element-loading-background="rgba(0, 0, 0,0)"
      >
        <transition name="el-zoom-in-top">
          <div v-if="ordInfo && ordInfo && ordInfo.ORDSEQ">
            <leftMenuVue :ord-info="ordInfo" :emp-info="empInfo" :tableloading="tableloading" />
          </div>
        </transition>
      </el-scrollbar>
    </el-aside>
    <el-main class="main">
      <rightContentVue :ord-info="ordInfo" :emp-info="empInfo" />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { GetOrdinfo, GetEmpinfo, GetOrd2Workinstruct, Image } from './api/index'
import { useManual } from './store/index'
import leftMenuVue from './components/leftMenu.vue'
import rightContentVue from './components/rightContent.vue'
import { useUserStore } from '@/store/modules/user'
import { useAppStoreWithOut } from '@/store/modules/app'

const appStore = useAppStoreWithOut()
const WithoutLayout=appStore.getIsWithoutLayout
// store
const { userInfo } = useUserStore()
const { username: USERNO, sessionId: USERID } = userInfo
const { setOrdseq } = useManual()
// FV22056001
// 860125806
const ordInput = ref(null)
const searchVal = ref('')
const loading = ref(false)

// 工號
const barcode = ref('')
const barInput = ref(null)
const tableloading = ref(false)

// 檢索數據
const ordInfo = ref({})
const getOrdInfoEvent = useDebounceFn(async () => {
  if (!searchVal.value) {
    return
  }
  loading.value = true
  const { data, statusCode } = await GetOrdinfo({
    pBarcode: searchVal.value,
    pUser: USERNO,
    pID: USERID
  })
  ordInput.value.select()
  if (!statusCode) {
    return
  }
  loading.value = false
  ordInfo.value = data[0]
  if (ordInfo.value&&ordInfo.value.IMGSEQ) {
    ordInfo.value.IMG = `http://116.6.194.123:9501/JsonService.asmx/Image?IMGSEQ=${ordInfo.value.IMGSEQ}&pUser=${USERNO}&sessionID=${USERID}`
  }
  empInfo.value = []
  saveEmpInfo.value = []
  setOrdseq('')
  getOrd2WorkinstructEvent()
}, 500)

// 详情信息
const empInfo = ref([])
const saveEmpInfo = ref([])
const getOrd2WorkinstructEvent = async () => {
  tableloading.value = true
  if (!searchVal.value || !ordInfo.value) {
    return
  }
  const { data, statusCode } = await GetOrd2Workinstruct({
    pordseq: ordInfo.value.ORDSEQ,
    pUser: USERNO,
    pID: USERID
  })
  tableloading.value = false
  if (!statusCode) return
  empInfo.value = data
  saveEmpInfo.value = data
  loading.value = false
  screenList()
}
// 過濾數據
const screenList = () => {
  const array = []
  userList.value.forEach((item) => {
    const findItem = saveEmpInfo.value.find((sItem) => sItem.DTLNO === item.JOBNO)
    if (findItem) array.push(findItem)
  })
  empInfo.value = barcode.value ? array : saveEmpInfo.value
}

// 返回当前用户权限
const userList = ref([])
const getEmpInfoEvent = useDebounceFn(async () => {
  userList.value = []
  if (!barcode.value) {
    screenList()
    return
  }
  const { data, statusCode } = await GetEmpinfo({
    pBarcode: barcode.value,
    pUser: USERNO,
    pID: USERID
  })
  if (!statusCode) return
  barInput.value.select()
  userList.value = data
  screenList()
}, 500)

onMounted(() => {
  ordInput.value.focus()
})
</script>

<style lang="scss" scoped>
.elHtightT{
  height: calc(100vh - 16px);
}
.elHtightF{
  height: calc(100vh - 16px - 56px);
}
.left-aside {
  background: #1b242d;
  padding: 15px;
}

.main {
  background: #f4f5f7;
  padding: 0 20px 20px 20px;
}
.search{
    height: 130px;
}
</style>
