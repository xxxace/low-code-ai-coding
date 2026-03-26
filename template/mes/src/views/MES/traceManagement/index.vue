<template>
  <div class="h-full overflow-auto flex flex-col box-border relative">
    <div class="mt-[-4px] mb-1">
      <el-radio-group v-model="currComponentName" size="small">
        <el-radio-button
          v-for="item in componentList"
          :key="item.name"
          :label="item.name"
          :value="item.component"
        />
      </el-radio-group>
    </div>
    <Transition name="fade" mode="out-in">
      <KeepAlive>
        <component class="flex-1" :is="componentMap[currComponentName]" />
      </KeepAlive>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import OrderTrace from '../orderTrace/index.vue'
import ProcessTrace from '../processTrace/index.vue'

const currComponentName = ref('OrderTrace')
const componentList = [
  { name: '订单追溯', component: 'OrderTrace' },
  { name: '工序追溯', component: 'ProcessTrace' }
]
const componentMap = {
  OrderTrace: OrderTrace,
  ProcessTrace: ProcessTrace
}
</script>
<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
