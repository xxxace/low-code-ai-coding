import {fetchDataItem, FetchWrapperOptions, useNsSearchData} from "@/api/nameson/services/utils";
import type { SearchParamsUnion } from "@/api/nameson/services/utils";

// 京东自营-快车
const request = useNsSearchData("VUE_JJZ_JDZY");

export type KuaiCheItemVO = {
    USERNO: string; //店铺名
    DT: string; //日期
    MATID: string; //跟单SKU ID
};

export function fetchKuaiCheItemList<P extends SearchParamsUnion>(
    params: P,
) {
    return request<KuaiCheItemVO[], P>("快车-明细列表查询", params);
}

export type KuaiCheSummaryVO = {
    T_SHOWCNT: number; //展现数
    T_CLICKCNT: number; //点击数
};

export function fetchSummaryData(params: Record<string, any>, options?: FetchWrapperOptions) {
    return fetchDataItem<KuaiCheSummaryVO>(request("快车-数据概览查询", params), options)
}
