import {useI18n} from "vue-i18n";

/**
 * 解析带默认值的翻译键
 * @param {string} key - 格式为"key|默认值"的翻译键
 * @returns {object} 包含localeKey和defaultValue的对象
 */
export const parseKeyWithDefault = (key) => {
    const separatorIndex = key.indexOf("|");
    if (separatorIndex > -1) {
        return {
            localeKey: key.substring(0, separatorIndex).trim(),
            defaultValue: key.substring(separatorIndex + 1).trim(),
        };
    }
    return {
        localeKey: key,
        defaultValue: key,
    };
};

/**
 * 命名空间国际化hook，支持默认值和作用域前缀
 * @param {string} scope - 国际化命名空间前缀
 * @param {object} options - vue-i18n选项
 * @returns {object} 增强的i18n对象
 */
export function useNsI18n(scope, options = {}) {
    const i18n = useI18n(options);

    /**
     * 带命名空间的翻译函数，支持默认值
     * @param {string|null|undefined} key - 翻译键，格式：key|默认值
     * @param {object|string|number} valueOrIndex - 翻译参数
     * @returns {string} 翻译后的文本
     */
    const t = (key, valueOrIndex) => {
        // 处理空值情况
        if (!key) {
            return "";
        }

        // 解析键和默认值
        const {localeKey, defaultValue} = parseKeyWithDefault(key);

        // 添加命名空间前缀
        const namespacedKey = scope ? `${scope}.${localeKey}` : localeKey;

        // 执行翻译
        const translatedValue = i18n.t(namespacedKey, valueOrIndex);

        // 如果翻译失败，返回默认值
        return translatedValue === namespacedKey ? defaultValue : translatedValue;
    };

    const c = (key, valueOrIndex)=>{
        // 处理空值情况
        if (!key) {
            return "";
        }

        // 解析键和默认值
        const {localeKey, defaultValue} = parseKeyWithDefault(key);

        // 执行翻译
        const translatedValue = i18n.t(localeKey, valueOrIndex);

        // 如果翻译失败，返回默认值
        return translatedValue === localeKey ? defaultValue : translatedValue;
    }

    return {
        ...i18n,
        t,
        c
    };
}
