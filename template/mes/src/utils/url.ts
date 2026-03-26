export function toQueryString(query: object, startWithQuestionMark: boolean = false) {
  if (!query) return ''
  const prefix = startWithQuestionMark ? '?' : ''

  const entries: string[] = []
  Object.keys(query).forEach((key) => {
    entries.push(`${key}=${query[key]}`)
  })

  if (entries.length > 0) {
    return prefix + entries.join('&')
  } else {
    return ''
  }
}

export function queryToObject(query: string) {
  const obj = {}
  if (!query) return obj

  query = query[0] === '?' ? query.slice(1) : query

  query.split('&').forEach((entry) => {
    const [key, value] = entry.split('=')
    obj[key] = value
  })

  return obj
}
