<template>
  <div v-show="evtEmp && evtEmp.DTLSEQ">
    <div class="header">
      <span class="mr10"> 批号：{{ props.ordInfo.ORDNO }} </span>
      <span>
        工序：{{ evtEmp.DTLNO }}-{{ evtEmp.DTLNAME }}
        <!-- <el-tag class="mr10" style="font-size: 18px">
          {{ evtEmp.DTLNO }}
        </el-tag> -->
        
      </span>
    </div>
    <div class="flex mt10">
      <div class="border-box flex-column flex1 mr10">
        <span class="title mb10">操作步驟</span>
        <!-- <el-image
          style="width: 100%; height: 400px"
          :preview-src-list="[`data:image/png;base64,${evtEmp.IMG}`]"
          :src="`data:image/png;base64,${evtEmp.IMG}`" fit="contain"
        /> -->
        <el-carousel height="400px" class="mt10" ref="carousel">
          <el-carousel-item
            v-for="(item, index) in imageList"
            :key="item.SEQ"
            :label="item.TITLE"
            :name="`${index}`"
          >
            <el-image
              style="width: 100%; height: 400px"
              :preview-src-list="showImageList"
              :initial-index="index"
              :src="`data:image/png;base64,${item.IMG}`"
              fit="contain"
              preview-teleported
            />
          </el-carousel-item>
        </el-carousel>
      </div>
      <div class="border-box flex-column flex1">
        <span class="title mb10">操作視頻</span>
        <video
          width="100"
          v-if="videoUrl"
          height="400"
          controls
          class="mt10"
          style="width: 100%"
          duration
        >
          <source :src="videoUrl" type="video/mp4" />
          您的浏览器不支持 HTML5 video 标签。
        </video>
      </div>
    </div>
    <div class="border-box flex-column mt10">
      <span class="title">工藝說明</span>
      <div class="color-99 mt10 context" style="white-space: pre-wrap" v-html="evtEmp.REF1" />
    </div>
  </div>
  <el-empty v-show="!(evtEmp && evtEmp.DTLSEQ)" :image-size="200" />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useManual } from '../store/index'
import { useUserStore } from '@/store/modules/user'
import { storeToRefs } from 'pinia'
// store
const { userInfo } = useUserStore()
const { username: USERNO, sessionId: USERID } = userInfo
const { ordseq } = storeToRefs(useManual())

const props = defineProps({
  ordInfo: {
    type: Object,
    default: () => {}
  },
  empInfo: {
    type: Array,
    default: () => []
  }
})
const evtEmp = ref({})
const imageList = ref([])
const showImageList = ref([])
const videoUrl = ref('')
const carousel = ref(null)
watch(
  () => ordseq,
  () => {
    // getOrd2Workinstruct();
    if (!ordseq.value) {
      imageList.value = []
      showImageList.value = []
      evtEmp.value = {}
      return
    }
    videoUrl.value = ''
    evtEmp.value = props.empInfo.find((item) => item.DTLSEQ === ordseq.value) || {}
    // 排序
    imageList.value = []
    showImageList.value = []
    if (evtEmp.value.IMGDATA && evtEmp.value.IMGDATA.length) {
      evtEmp.value.IMGDATA.sort((a, b) => a.SEQ - b.SEQ)
      showImageList.value = evtEmp.value.IMGDATA.map((item) => `data:image/png;base64,${item.IMG}`)
      imageList.value = evtEmp.value.IMGDATA
    }
    setTimeout(() => {
      carousel.value.setActiveItem(0)
      videoUrl.value = evtEmp.value.VIDEOPATH
    }, 300)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.header {
  background: #fff;
  padding: 10px 20px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  font-weight: bold;
  font-size: 32px;
}
.border-box {
  background: #fff;
  border-radius: 10px;
  padding: 15px;
  .title {
    font-weight: bold;
  }
  .context {
    line-height: 20px;
  }
}
</style>
