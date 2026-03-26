export function toFixedPlus(num: string | number, digits = 0, number = false) {
  if (num) {
    if (typeof num !== 'number') num = Number(num)
    const value = Number(num.toFixed(digits))
    if (number === true) return value
    const formatValue = String(value).split('.')
    formatValue[0] = formatValue[0].replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$1,') //将整数部分逢三一断
    return formatValue[1] ? formatValue.join('.') : formatValue[0]
  } else {
    return num
  }
}

export function copy(obj: object | any[] | null | undefined) {
  return isDef(obj) && typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj
}

export function isDef(val: any) {
  return val !== null && val !== undefined && val !== ''
}

export function isNotEmptyObject(data: any): data is object {
  return data !== null && data !== undefined && Object.keys(data).length !== 0
}
