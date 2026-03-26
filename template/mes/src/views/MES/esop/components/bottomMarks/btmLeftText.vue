<template>
  <div class="btmLeftText flex-column">
    <div v-for="(item,index) in list" :key="index" class="flex-align-center listBox">
      <div style="margin-right:5px;">{{ index+1 }}.</div>
      <div class="flex1">
        <!-- <el-select v-model="values" filterable :placeholder="$t('pc')" clearable style="width:100%;" @focus="posClick(index)" @change="change(index)">
          <el-option
            v-for="item2 in options"
            :key="item2.value"
            :label="item2.value"
            :value="item2.value"
          >
          </el-option>
        </el-select> -->
        <el-autocomplete
          v-model="list[index]"
          :fetch-suggestions="querySearchAsync"
          style="width:100%;"
          type="textarea"
          autosize
          clearable @select="inputValue" @change="inputValue"
        >
          <template slot-scope="{ item }">
            <div class="name"><span style="color:#cccccc">{{ `${item.id}. ` }}</span>{{ item.value }}</div>
          </template>
        </el-autocomplete>
      </div>
    </div>
    <div class="mt20">
    </div>
  </div>
</template>

<script>
// import { translateArr } from '@/lang/translate';

export default {
  props: {
    value: {
      type: [Array, Object],
      default: () => []
    }
  },
  data() {
    return {
      list: [],
      values: '',
      searchVal: [
      ],
      options: [
        { value: '上袖套針位針針穿，刮2支2支邊，袖夾到邊刮2支半' },
        { value: '上領用1條A色原身毛加1條70DX2尼龍加捻縫' },
        { value: '用1條原身毛縫' },
      ]
    };
  },
  computed: {
    testText() {
      return this.$store.state.printStore.lang;
    }
  },
  watch: {
    testText: {
      handler() {
        this.$nextTick(
          this.text()
        );
        console.log('监听3');
      }
    },
  },
  mounted() {
    this.list = this.value;
    let id = 0;
    this.options.forEach((item) => {
      id += 1;
      item.id = id;
    });
    // this.text();
  },
  methods: {
    // text() {
    //   const sArr = [];
    //   this.options.forEach(async (item) => {
    //     const list = await translateArr([item.value]);
    //     sArr.push(
    //       { value: list[0] }
    //     );
    //   });
    //   this.options = sArr;
    // },
    add() {
      if (this.list.length < 4) { this.list.push(''); }
    },
    del(idx) {
      this.list.splice(idx, 1);
    },
    // querySearch(query) {
    //   if (query) {
    //     this.list = this.options.filter((item) => item.value.includes(query));
    //   } else {
    //     this.list = this.options;
    //   }
    //   // 调用 callback 返回建议列表的数据
    // },
    querySearchAsync(queryString, cb) {
      let data = [];
      if (queryString) {
        data = this.options.filter((item) => item.value.includes(queryString));
      } else {
        data = this.options;
      }
      cb(data);
    },
    inputValue() {
      this.$emit('input', this.list);
    },
    posClick(idx) {
      const printFooter = document.querySelector('.print-footer');
      const line = printFooter.querySelectorAll('.line')[idx];
      document.getElementById('myViewport').scrollTop = line.offsetTop;
      line.style.background = '#e8f3ff';
      setTimeout(() => {
        line.style.background = '#fff';
      }, 500);
    }
  },
};
</script>

<style lang="scss" scoped>
    .btmLeftText{
        padding:0 10px;
        .listBox{
            padding:10px 0;
            border-bottom:1px solid #ddd;
        }
    }
</style>
