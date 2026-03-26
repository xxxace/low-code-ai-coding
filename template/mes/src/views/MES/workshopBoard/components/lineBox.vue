<template>
  <div class="black-box box-r box-s flex1 flex-column p-10">
    <div class="text-llg text-bold c-white">产线及生产进度</div>
    <div class="flex scroll" style="padding: 20px 0 10px 0">
      <div
        v-for="item in props.list"
        :key="item.WCSEQ"
        class="btn"
        :style="bgColorFor()"
        @click="toDetail(item)"
      >
        {{ item.CNAME || item.JOBNO }}
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'
const { userInfo } = useUserStore()

const props = defineProps({
  list: {
    type: Array,
    default:()=>[]
  },
  selectObj: {
    type: Object,
    default: ()=>({})
  }
})
const bgColorFor = () => {
  const R = Math.floor(Math.random() * 150)
  const G = Math.floor(Math.random() * 130)
  const B = Math.floor(Math.random() * 120)
  return {
    background: `linear-gradient(90deg, rgba(${R},${G},${B},1),  rgba(${R},${G},${B},0.9))`
  }
}
const toDetail = (item) => {
  const { username, sessionId, pwd } = userInfo
  window.open(
    `http://10.3.0.165:9512/#/scheduling?loginid=${username}&pwd=${pwd}`
  )
}
</script>

<style lang="scss">
.scroll {
  overflow-x: auto;
}
.btn {
  padding: 12px 25px;
  font-weight: bold;
  margin: 0 10px 0 0;
  background: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  color: #fff;
  white-space: nowrap;
}
</style>
