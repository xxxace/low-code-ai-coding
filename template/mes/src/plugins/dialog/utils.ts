export function parseURL(url: string) {
  try {
    const u = new URL(url)

    // 关键修复：处理 hash 中的 ? (将其视为 hash 内部的查询参数)
    let hashPath = u.hash
    let hashQuery = ''
    if (hashPath && hashPath.includes('?')) {
      const [pathPart, queryPart] = hashPath.split('?', 2)
      hashPath = pathPart
      hashQuery = `?${queryPart}`
    }

    return {
      protocol: u.protocol.slice(0, -1), // 去掉 : (http)
      domain: u.origin, // http://localhost:4050
      path: u.origin + u.pathname + hashPath, // http://localhost:4050/#/dynamic
      search: hashQuery, // ?to=... (原始查询字符串)
      query: hashQuery
        ? Object.fromEntries(new URLSearchParams(hashQuery.substring(1)).entries())
        : {}
    }
  } catch (e) {
    throw new Error(`无效的 URL: ${url}`)
  }
}

export function shortUUID() {
  return Math.random().toString(36).slice(2, 10)
}
