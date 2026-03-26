import {
    VxeUI,
    VxeButton,
    VxeButtonGroup,
    VxeDatePicker,
    VxeDateRangePicker,
    VxeCheckbox,
    VxeCheckboxGroup,
//     VxeForm,
//     VxeFormGather,
//     VxeFormItem,
    VxeIcon,
    VxeInput,
//     VxeList,
    VxeLoading,
    VxeModal,
    VxeOptgroup,
    VxeOption,
//     VxePager,
    VxePulldown,
    VxeRadio,
    // VxeRadioButton,
    // VxeRadioGroup,
    VxeSelect,
//     VxeSwitch,
//     VxeTextarea,
    VxeTooltip
} from "vxe-pc-ui";

import {
    VxeTable,
    VxeColumn,
    VxeColgroup,
    VxeGrid,
    VxeToolbar
} from 'vxe-table'

import registerRender from "./customRender/register";
import {registerFormats} from "./formats";

// 导入主题变量，也可以重写主题变量
import 'vxe-pc-ui/styles/cssvar.scss'
import 'vxe-table/styles/cssvar.scss'
import type {App} from "vue";

// 可选组件
function lazyVxeUI(app: App) {
    app.use(VxeButton);
    app.use(VxeButtonGroup);
    app.use(VxeDatePicker);
    app.use(VxeDateRangePicker);
    app.use(VxeCheckbox);
    app.use(VxeCheckboxGroup);
    // app.use(VxeForm);
    // app.use(VxeFormGather);
    // app.use(VxeFormItem);
    app.use(VxeIcon);
    app.use(VxeInput);
    // app.use(VxeList);
    app.use(VxeLoading);
    app.use(VxeModal);
    app.use(VxeOptgroup);
    app.use(VxeOption);
    // app.use(VxePager);
    app.use(VxePulldown);
    app.use(VxeRadio);
    // app.use(VxeRadioButton);
    // app.use(VxeRadioGroup);
    app.use(VxeSelect);
    // app.use(VxeSwitch);
    // app.use(VxeTextarea);
    app.use(VxeTooltip);
}

function lazyVxeTable(app: App) {
    app.use(VxeTable)
    app.use(VxeColumn)
    app.use(VxeColgroup)
    app.use(VxeGrid)
    app.use(VxeToolbar)
}

export function setupVxeTable(app: App) {
    lazyVxeUI(app);
    lazyVxeTable(app);

    registerRender(VxeUI);
    registerFormats(VxeUI);
}

// 导入默认的语言
import zhCN from "vxe-pc-ui/lib/language/zh-CN";
import zhHK from "vxe-pc-ui/lib/language/zh-HK";
import en from "vxe-pc-ui/lib/language/en-US";
import viVN from "vxe-pc-ui/lib/language/vi-VN";
// import zhCN from "vxe-table/lib/locale/lang/zh-CN";
// import zhHK from "vxe-table/lib/locale/lang/zh-HK";
// import en from "vxe-table/lib/locale/lang/en-US";
// import viVN from "./vi-VN";

VxeUI.setI18n('zh-CN', zhCN)
VxeUI.setLanguage('zh-CN')

const vxeLocale = {
    zh: zhCN,
    "zh-Hant": zhHK,
    en: en,
    vi: viVN,
};

import type {VxeGlobalI18nLocale} from 'vxe-pc-ui'

export function setVxeTableLanguage(language: any) {
    const i18LocaleMap: Record<any, VxeGlobalI18nLocale> = {
        zh: "zh-CN",
        "zh-Hant": "zh-HK",
        en: "en-US",
        vi: "vi-VN",
    };
    // console.log(VxeUI.setI18n, VxeUI.setLanguage)
    VxeUI.setI18n(i18LocaleMap[language], vxeLocale[language]);
    VxeUI.setLanguage(i18LocaleMap[language]);
}
