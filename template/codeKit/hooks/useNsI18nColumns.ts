import {ref, computed} from "vue";
import {useNsI18n} from "./useNsI18n";

/**
 * 表格列国际化hook，支持列的动态操作和翻译
 * @param {object} options - 配置选项
 * @param {string} options.scope - 国际化命名空间前缀
 * @param {Array} options.columns - 原始列配置数组
 * @returns {object} 包含翻译后列和操作方法的对象
 */
export function useNsI18nColumns<T>({scope, columns}) {
    const {t} = useNsI18n(scope);

    const columnsRef = ref([...columns]);

    const translatedColumns = computed(() => {
        return columnsRef.value.map((col) => {
            if (!col.i18nKey) return col;
            return {
                ...col,
                title: t(`${col.i18nKey}|${col.title}`),
            }
        });
    });

    return translatedColumns as T;

    // return {
    //   columns: translatedColumns,
    //   addColumn: (newColumn) => columnsRef.value.push({ ...newColumn }),
    //   removeColumn: (index) => columnsRef.value.splice(index, 1),
    //   updateColumn: (index, updates) => {
    //     columnsRef.value[index] = { ...columnsRef.value[index], ...updates };
    //   },
    // };
}
