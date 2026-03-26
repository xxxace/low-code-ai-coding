<template>
  <div class="h-full overflow-auto flex flex-col box-border relative">
    <el-container>
      <!-- 左侧 -->
      <el-aside width="350px">
        <div class="title p-10 flex-column" style="padding: 15px 10px">
          <span class="aside-title">自定义-作业指南</span>
          <span style="margin-top: 8px" class="color-99">CUSTOMIZED HOMEWORK GUIDE</span>
        </div>
        <div class="flex">
          <div class="p-10 flex-column mt10">
            <strong>批号：</strong>
            <UppercaseInput
              class="search-input"
              v-model="orderVal"
              placeholder="批号"
              clearable
              spellcheck="false"
            >
              <template #suffix>
                <Icon icon="vi-ant-design:search-outline" />
              </template>
            </UppercaseInput>
          </div>
        </div>
        <div class="flex">
          <div class="p-10 flex-column mt10" style="padding-top: 0">
            <strong>参考批号：</strong>
            <UppercaseInput
              class="search-input"
              v-model="orderRefe"
              placeholder="参考批号："
              clearable
              spellcheck="false"
            >
              <template #suffix>
                <Icon icon="vi-ant-design:search-outline" />
              </template>
            </UppercaseInput>
          </div>
        </div>
      </el-aside>
      <!-- 右侧 -->
      <el-main style="width: 100%; overflow: auto">
        <div class="flex mainPag">
          <div class="main-left flex-column">
            <el-tabs class="flex-column flex1" v-model="activeName" type="card">
              <el-tab-pane class="flex flex1" style="overflow: auto" label="缝盘要求" name="sPlate">
                <el-tabs class="flex-column flex1" v-model="activesPlate">
                  <el-tab-pane
                    class="flex flex1"
                    v-for="(item, index) in list[0].left"
                    :key="index"
                    :label="item.name"
                    :name="item.name"
                  >
                    <!-- <selectVue class="flex-column flex1" v-model="list[0].left[index]"> </selectVue> -->
                  </el-tab-pane>
                </el-tabs>
              </el-tab-pane>
            </el-tabs>
            <!-- 操作-图片/视频 -->
            <div class="p-10 flex-column" style="height: 30%">
              <h2>操作</h2>
              <div class="flex flex1">
                <div class="flex1"
                  >图片
                  <div><el-button size="small">上传</el-button></div>
                  <div></div>
                </div>
                <div class="flex1"
                  >视频
                  <div><el-button size="small">上传</el-button></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUpdated } from 'vue'
import UppercaseInput from '@/components/Nameson/UppercaseInput/index.vue'
import draggable from 'vuedraggable'
import leftData from './js/otherData/leftdata'

// 組件
// 左侧
import selectVue from './components/leftPlanA/select.vue'
import btmLeftTextVue from './components/bottomMarks/btmLeftText.vue'
// 显示区
import printPageVue from './components/print-page.vue'
// 翻譯
// import { translateArr } from "./lang/translate";

import TextVue from './components/leftPlanA/text.vue'
import TextBVue from './components/rightPlanB/text.vue'
import TableVue from './components/rightPlanB/table.vue'

import TextDialogVue from './components/dragDialog/textDialog.vue'
import TableDialogVue from './components/dragDialog/tableDialog.vue'
import WriteTextDialogvue from './components/dragDialog/writetextDialog.vue'
import EidtTableVue from './components/dragDialog/eidtTable.vue'
import EiTableVue from './components/dragDialog/Table.vue'

const orderVal = ref('')
const orderRefe = ref('')

const lang = localStorage.getItem('lang')
const scaleVal = ref(1)
const activeNamer = ref('sPlate')
const activesPlate = ref('')
const cleanShow = ref(true)
const page = ref(0)
const activeName1 = ref('print')
const list = ref([
  {
    left: [],
    right: [],
    bottom: ['', '', '', ''],
    list3: []
  }
])
const allList = ref({
  left: [],
  right: [],
  bottom: ['', '', '', '']
})
const typeObj = ref({
  value: '',
  list: [
    {
      value: 'Beijing',
      label: '衣服'
    },
    {
      value: 'Shanghai',
      label: '裤子'
    },
    {
      value: 'Nanjing',
      label: '帽子'
    }
  ]
})
const right = ref({
  list: [
    {
      id: '',
      name: '文本',
      content: '',
      icon: 'icon-wenbenkuang',
      comId: 'TextVue',
      isStar: false,
      diaLogId: 'WriteTextDialogvue'
    },
    {
      id: '',
      name: '表格',
      content: '',
      icon: 'icon-biaoge',
      comId: 'TableVue',
      diaLogId: 'TableDialogVue'
    },
    {
      id: '',
      name: '备注',
      content: '',
      icon: 'icon-wenbenkuang',
      comId: 'TextBVue',
      isStar: false,
      diaLogId: 'TextDialogVue'
    }
  ]
})
const dialog = ref({
  show: false,
  title: '',
  evt: {}
})
watch(
  () => lang,
  async () => {
    // await data();
  }
)
onMounted(async () => {
  await data()
  activesPlate.value = list.value[0].left[0].name
})
onUpdated(async () => {
  //         console.log(this.list, "list");
  //         const pagePrints = this.$refs.printPage;
  //         pagePrints.forEach((pagePrint, index1) => {
  //             pagePrint.$refs.printPage.style.border = "";
  //             if (this.page == index1) {
  //                 pagePrint.$refs.printPage.style.border = "2px solid #66b1ff";
  //             }
  //         });
  //         // await this.data();
})

const data = async () => {
  console.log(leftData)

  const sArr = leftData
  //   const nameArr = await translateArr(leftData.map((item) => item.name))
  //   await leftData.forEach(async (item, index) => {
  //     const list = await translateArr(item.list.map((item2) => item2.value))
  //     sArr.push({
  //       ...item,
  //       name: nameArr[index],
  //       list: list.map((item2) => ({ value: item2 }))
  //     })
  //   })
  // const t = JSON.stringify(sArr);
  // this.list[0].left = JSON.parse(t);
  list.value[0].left = sArr
  console.log(list.value)

  // this.list.left = sArr;
}
const log = (evt) => {
  window.console.log('left', evt)
}
const cloneDog = (evt) => {
  const list = [
    { value: '内领贴扣用手挑，详细做法如原辩' },
    {
      value:
        '全件勾线头底面计勾8-10度，每度不可超过三行，要拉平、顺直★后领膊骨线头不可向后领中收藏线头2个勾膊骨1个勾前幅，夹底线头分上下勾一边向袖骨位，一边向衫身骨位，衫脚、袖口领边膊骨位线'
    },
    {
      value:
        '縫線用法：上領用1條A色原身毛加1條70DX2尼龍加捻縫，其余用1條A色原身毛加2條70DX2尼龍加捻縫'
    }
  ]
  return {
    id: Math.random().toString(16).slice(2),
    ...evt,
    list
  }
}
// 打印
const print = () => {
  console.log('print')
  const pagePrints = this.$refs.printPage
  pagePrints.forEach((pagePrint, index) => {
    if (this.page == index) {
      pagePrint.print()
    }
  })
}
// 全部打印
// printALL() {
//   const pagePrints = this.$refs.printPageA;
//   const pagePrin = this.$refs.printPage;
//   pagePrin.forEach((pagePrint,) => {
//     pagePrint.$refs.printPage.style.border = '';
//   });
//   console.log(pagePrints);
//   this.$print(pagePrints);
//   pagePrin.forEach((pagePrint, index1) => {
//     pagePrint.$refs.printPage.style.border = '';
//     if (this.page == index1) {
//       pagePrint.$refs.printPage.style.border = '2px solid #66b1ff';
//     }
//   });
// }
const printALL = () => {
  const pagePrints = this.$refs.printPageA
  const pagePrin = this.$refs.printPage
  pagePrin.forEach((pagePrint) => {
    pagePrint.$refs.printPage.style.border = ''
  })
  this.$print(pagePrints)
  pagePrin.forEach((pagePrint, index1) => {
    pagePrint.$refs.printPage.style.border = ''
    if (this.page == index1) {
      pagePrint.$refs.printPage.style.border = '2px solid #66b1ff'
    }
  })
}
// 保存
const svag = () => {
  this.$message.success('保存成功')
}
// 重置
const cleanData = () => {
  this.list.forEach((item) => {
    item.left = JSON.parse(JSON.stringify(leftData))
    item.right = []
    item.bottom = ['', '', '']
  })
  console.log(leftData)
  this.cleanShow = false
  setTimeout(() => {
    this.cleanShow = true
  }, 100)
}
// 复制
const copy = (index) => {
  console.log(this.allList)
  const copyData = { ...JSON.parse(JSON.stringify(this.list[index])) }
  this.list.splice(index, 0, copyData)
  console.log(this.allList, '点击复制', this.list)
  this.$message.success('复制成功!')
}
// 当前页
const seleIndex = (index) => {
  this.page = index
  console.log(index, '当前页')
  const pagePrints = this.$refs.printPage
  pagePrints.forEach((pagePrint, index1) => {
    pagePrint.$refs.printPage.style.border = ''
    if (index == index1) {
      pagePrint.$refs.printPage.style.border = '2px solid #66b1ff'
    }
  })
  this.$store.commit('printStore/setPage', index)
  // }
}
// 删除当前页
const delect = (index) => {
  if (this.list.length > 1) {
    this.$alert(`是否删除第 ${index + 1} 页`, '删除', {
      confirmButtonText: '确定',
      callback: (action) => {
        this.$message({
          type: action === 'cancel' ? 'info' : 'success',
          message: action === 'cancel' ? '取消删除' : '确认删除'
        })
        if (action !== 'cancel') {
          this.list.splice(index, 1)
          this.page = 0
        }
      }
    })
  } else {
    // alert('请保留一页');
    this.$message.warning('请保留一页!')
  }
}
// 右侧内容新增
const addRight = (val) => {
  const arr = this.right.list.find((item) => item.diaLogId == val)
  arr.id = Math.random().toString(16).slice(2)
  this.list[0].list3.push(JSON.parse(JSON.stringify(arr)))
}
// 编辑右侧
const edit = (itm) => {
  this.dialog.evt = itm
  this.dialog.title = itm.name
  this.dialog.show = true
  this.$nextTick(() => {
    this.$refs.dialogCom.open(itm)
  })
}
// 退出弹窗
const handleClose = (done) => {
  this.$confirm('确认关闭？')
    .then((_) => {
      done()
    })
    .catch((_) => {})
}
// 提交数据
const commitDialog = () => {
  this.$refs.dialogCom.commit()
  if (this.dialog.evt.tableShow) {
    if (this.dialog.evt.tableHeader.length == 0) {
      this.$message.warning('尺寸为空')
      return
    }
  }
  const { evt } = this.dialog
  console.log(evt, 'evt')
  console.log(this.list[0].list3)

  this.list[0].list3.forEach((item, index) => {
    if (item.id == evt.id) {
      this.$set(this.list[0].list3, index, evt)
    }
  })
  this.dialog.show = false
}
// 获取组件类型名称
const getItemTypeName = (comId) => {
  const typeMap = {
    TextVue: '文本',
    TableVue: '表格',
    TextBVue: '备注'
  }
  return typeMap[comId] || '内容'
}
</script>

<style lang="scss" scoped>
.el-container {
  width: 100%;
  height: 100%;
  background: #f6f6f6;

  .el-aside {
    position: relative;
    z-index: 99;
    box-shadow: 1px 1px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
    .aside-title {
      font-size: 24px;
      font-weight: 700;
    }
    .title {
      box-shadow: 1px 1px 20px rgba(0, 0, 0, 0.1);
    }
  }

  .el-main {
    display: flex;
    background: #fff;
    margin-left: 5px;
    padding: 0px;
    border: 1px #fff solid;
    box-shadow: 1px 1px 20px rgba(0, 0, 0, 0.1);
    .mainPag {
      flex: 1;
      overflow: auto;
      .main-left {
        flex: 1;
        border-right: 1px #dedede solid;
        overflow: auto;
      }
      .main-right {
        width: 35%;
        height: 100%;
        overflow: auto;

        .pageView {
          padding: 10px;
        }
      }
    }
  }
  :deep(.el-tabs--card > .el-tabs__header .el-tabs__nav) {
    border: none;
  }
  :deep(.el-tabs__header) {
    margin: 0px;
  }
  :deep(.el-tabs--top .el-tabs__item.is-top:nth-child(2)) {
    padding-left: 20px;
  }
  :deep(.el-tabs__content) {
    display: flex;
    flex: 1;
  }
  :deep(.el-tabs__nav-next) {
    line-height: 38px;
  }
}
.dragSBox {
  position: relative;
  .el-button-group {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: none;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    .el-button-group {
      display: block;
    }
  }
}
.operation-bar {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-text {
    font-weight: 500;
    color: #1f2329;
    font-size: 14px;
  }

  .item-count {
    font-size: 12px;
    color: #86909c;
  }
}

.content-area {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  min-height: 300px;
  padding: 16px;
  transition: border-color 0.3s;
  overflow: auto;

  &:hover {
    border-color: #c0c4cc;
  }
}

.content-item {
  background-color: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: #c9cdd4;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f3f5;

  .item-index {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #f0f2f5;
    color: #86909c;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }

  .item-type {
    flex: 1;
    font-size: 13px;
    color: #4e5969;
    font-weight: 500;
  }

  .item-actions {
    opacity: 0;
    transition: opacity 0.2s;

    // 鼠标悬停时才显示操作按钮
    .content-item:hover & {
      opacity: 1;
    }
  }
}

.item-content {
  padding: 8px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #86909c;
}

// 优化拖拽体验
:deep(.dragArea) {
  min-height: 200px;
}

:deep(.list-group-item) {
  cursor: move;
}

:deep(.ghost) {
  background-color: #f0f7ff;
  border: 1px dashed #91bfff;
}

:deep(.dragging) {
  opacity: 0.8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
