const reClsMap: { [key: string]: any } = {}

function getClsRE(cls: any) {
  if (!reClsMap[cls]) {
    reClsMap[cls] = new RegExp(`(?:^|\\s)${cls}(?!\\S)`, 'g')
  }
  return reClsMap[cls]
}

export function hasClass(elem: any, cls: any) {
  return elem && elem.className && elem.className.match && elem.className.match(getClsRE(cls))
}

export function removeClass(elem: any, cls: any) {
  if (elem && hasClass(elem, cls)) {
    elem.className = elem.className.replace(getClsRE(cls), '')
  }
}

export function addClass(elem: any, cls: string) {
  if (elem && !hasClass(elem, cls)) {
    removeClass(elem, cls)
    elem.className = `${elem.className} ${cls}`
  }
}
