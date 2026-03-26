import { fetchDataItem, fetchDataList, useNsSearchData } from '@/api/nameson/utils'
import type { FetchWrapperOptions, SearchParamsUnion } from '@/api/nameson/utils'

// 后整PO排工厂
const request = useNsSearchData('VUE_MES_POFTY')

export type FactoryOption = {
  FTYNO: string
  FTYNAME: string
}

export function fetchFactoryOptions(params?: Record<string, any>, options?: FetchWrapperOptions) {
  return fetchDataList<FactoryOption[]>(request('承制工厂的下拉取值', params), options)
}

export function fetchFtyOptions(params?: Record<string, any>, options?: FetchWrapperOptions) {
  return fetchDataList<FactoryOption[]>(request('工厂的下拉取值', params), options)
}

export type IndustrialZoneOption = {
  CODE: string
  CNAME: string
  CRCY: string
  CRCYNAME: number
}

export async function fetchIndustrialZoneOptions(options?: FetchWrapperOptions) {
  return await fetchDataList<IndustrialZoneOption[]>(request('工业区的下拉取值'), options)
}

export type SchedualingTypeOption = {
  TMPLNO: string
  CNAME: string
}

export async function fetchSchedualingTypeOptions(options?: FetchWrapperOptions) {
  return await fetchDataList<SchedualingTypeOption[]>(request('排产类型的查询'), options)
}

export type HzTaskVO = {
  PSTY: string //排产类型
  YRWEEK: string //排产年月
  PS_ORIGIN: string //工业区
  ORDSEQ: number //批号ORDSEQ
  ORDNO: string //批号
  STYSEQ: number //款号SEQ
  STYNO: string //款号
  STYNAME: string //款号描述
  ORIGIN: string //产地编码
  ORIGINNAME: string //产地名称
  EQMCAT: string //针种类型
  EQMMODEL: string //电脑机
  CLNTFTYNO: string //承制工厂
  MATDT: string //齐毛期
  SHPDTTO: string //最小厂期
  QTY: number //数量
}

export async function fetchHzTaskList(params?: Record<string, any>, options?: FetchWrapperOptions) {
  return await fetchDataList<HzTaskVO[]>(request('任务清单的查询', params), options)
}

export type TaskSchedualingVO = {
  ORDSEQ: number //批号序号
  FTYTY: string //工厂类型编码
  FTYTYNAME: string //工厂类型名称
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
}

export async function fetchTaskSchedualingList(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return await fetchDataList<TaskSchedualingVO[]>(
    request('任务单对应的生产排期信息的查询', params),
    options
  )
}

export type TaskSchedualingJobVO = {
  PSTY: string //排产类型
  YRWEEK: string //排产年月
  PS_ORIGIN: string //工业区
  JOBNO: string //工序编码
  JOBNAME: string //工序名称
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
  BEGDT: string //开始日期
  ENDDT: string //结束日期
  QTY: number //数量
}

export async function fetchTaskSchedualingJobList(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return await fetchDataList<TaskSchedualingJobVO[]>(
    request('任务单对应的工序信息的查询', params),
    options
  )
}

export type PreProcessingVO = {
  BILLNO: string //合约号
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
  KNIT_DATE: string //开织日期
  KNITEND_DATE: string //片期
  QTY: number //数量
}

export type LinkingAndHandStitchingVO = {
  BILLNO: string //合约号
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
  SEW_DATE: string //缝盘日期
  SEWEND_DATE: string //缝盘交期
  QTY: number //数量
}

export type PostProcessingVO = {
  PSSEQ: number //排产序号
  TSKSEQ: number //任务序号
  BILLNO: string //客PO
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
  QTY: number //数量
  ISMODIFY: string //是否修改
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}

export type TaskSchedualingDetailVO = {
  PSSEQ: number //排产序号
  TSKSEQ: number //任务序号
  LSTSEQ: number //列表序号
  PSTY: string //排产类型
  YRWEEK: string //排产年月
  PS_ORIGIN: string //工业区
  ORDSEQ: number //批号ORDSEQ
  ORDNO: string //批号
  STYSEQ: number
  STYNO: string //款号
  STYNAME: string //款号描述
  ORIGIN: string //产地编码
  ORIGINNAME: string //产地名称
  EQMCAT: string //针种类型
  EQMMODEL: string //电脑机
  BILLNO: string //单号
  FTYTY: string //工厂类型  FF:表示前整  TF:表示缝挑   BF:表示后整
  FTYNO: string //工厂编码
  FTYNAME: string //工厂名称
  KNIT_DATE: string //开织日期 取值待定
  KNITEND_DATE: string //片期 取值待定
  SEW_DATE: string //缝盘日期
  SEWEND_DATE: string //缝盘交期
  QTY: number //数量
  ISMODIFY: string
  ADDUSER: string
  ADDDTTM: string
  UPDUSER: string
  UPDDTTM: string
}

export async function fetchTaskSchedualingDetailList(
  params?: Record<string, any>,
  options?: FetchWrapperOptions
) {
  return await fetchDataList<TaskSchedualingDetailVO[]>(
    request('任务单对应的前整\\缝挑\\后整信息的查询', params),
    options
  )
}
