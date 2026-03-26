import Vue from 'vue';
import VueI18n from 'vue-i18n';
// element-ui多语言文件
import locale from 'element-ui/lib/locale';
// element
import zhEl from 'element-ui/lib/locale/lang/zh-CN';
import zhTWEl from 'element-ui/lib/locale/lang/zh-TW';
import enEl from 'element-ui/lib/locale/lang/en';
import viEl from 'element-ui/lib/locale/lang/vi';
// 而外
import zhCN from './other/zh-CN';
import zhTW from './other/zh-TW';
import en from './other/en';
import my from './other/my';
import vi from './other/vi.js';

Vue.use(VueI18n);
const i18n = new VueI18n({
  locale: localStorage.lang || 'zh-CN',
  messages: {
    'zh-CN': { ...zhEl, ...zhCN },
    'zh-TW': { ...zhTWEl, ...zhTW },
    en: { ...enEl, ...en },
    vi: { ...viEl, ...vi },
    my: { ...enEl, ...my }
  }
});
// element-ui多语言配置
locale.i18n((key, value) => i18n.t(key, value));

export default i18n;
