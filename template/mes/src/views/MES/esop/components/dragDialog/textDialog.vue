<template>
  <!-- 自定义文本 -->
  <div>
    <el-descriptions class="margin-top" title=""
                     :column="1"
                     :label-style="{
                       width:'100px'
                     }"
                     border
    >
      <el-descriptions-item>
        <template slot="label">
          星号
        </template>
        <el-switch
          v-model="isStar"
        >
        </el-switch>
      </el-descriptions-item>
      <el-descriptions-item span="2">
        <template slot="label">
          文本
        </template>
        <div class="flex-column">
          <!-- <el-select v-model="state1" filterable placeholder="请选择" style="width:100%;" @change="changeVal">
            <el-option
              v-for="item in restaurants"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select> -->
          <div class="">
            <el-input v-model="text"></el-input>
          </div>
        </div>
      </el-descriptions-item>
      <el-descriptions-item>
        <template slot="label">
          結果
        </template>
        <div class="flex-column">
          <div>
            <div class="contentFlex">
              <span>{{ isStar?'★':'' }}{{ text }}</span>
              <!-- <template v-for="(item,index) in textArr">
                <span v-if="parseFloat(item)" class="">
                  <el-input v-model="textArr[index]" size="mini" placeholder="请输入类型"></el-input>
                </span>
                <span v-else class="">
                  {{ item }}
                </span>
              </template> -->
            </div>
          </div>
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script>
export default {
  name: 'TextDialog',
  props: {
    value: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isStar: false,
      restaurants: [],
      state1: '',
      numArr: [],
      saveNumArr: [],
      textArr: [],
      text: ''
    };
  },
  watch: {
    // state1(newVal, oldVal) {
    //   if (newVal == oldVal) return;
    //   const newArr = newVal.match(/\d+/g);
    //   const oldArr = oldVal.match(/\d+/g);
    //   if (oldArr && oldArr.length > 0) {
    //     newArr.forEach((item) => {
    //       console.log(newVal.indexOf(item));
    //     });
    //   }
    //   console.log(newArr, 'new');
    //   console.log(oldArr, 'old');
    // }
  },
  mounted() {

  },
  methods: {
    open(item) {
      console.log(item, '数字');
      this.isStar = this.value.isStar;
      this.text = item.content;
    },
    commit() {
      this.$emit('input', {
        ...this.value,
        content: this.text,
        isStar: this.isStar
      });
    },
    changeVal(e) {
      this.numArr = e.match(/\d+/g);
      this.saveNumArr = e.match(/\d+/g);
      console.log(this.saveNumArr, 'e');
      let str = e;
      const array = [];
      this.saveNumArr.forEach((item) => {
        const evtArr = str.substring(0, str.indexOf(item));
        array.push(evtArr);
        array.push(item);
        str = str.substring(str.indexOf(item) + item.length);
      });
      array.push(str);
      this.textArr = array;
    },
    inputNum(e, idx) {
      console.log(this.state1);
    }
  }
};
</script>

<style lang="scss" scoped>
.contentFlex{
  flex-wrap: wrap;
  align-items: center;
  .el-input{
    width:40px;
    padding:0;
    margin-top:5px;
    ::v-deep .el-input__inner{
      padding:0 5px;
    }
  }
}
</style>
