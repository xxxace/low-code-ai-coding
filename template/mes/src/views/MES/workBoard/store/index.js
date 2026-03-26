import { defineStore } from 'pinia';

export const useManual = defineStore('manualStore', {
  state: () => ({
    // eq
    ordseq: '',
  }),
  getters: {

  },
  actions: {
    // 设置状态列表
    setOrdseq(data) {
      this.ordseq = data;
    },
  },
});
