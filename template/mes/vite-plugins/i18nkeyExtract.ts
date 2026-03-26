import fs from 'fs'
import path from 'path'
import { parse, compileTemplate, compileScript, SFCTemplateBlock } from 'vue/compiler-sfc'

// 解析 Vue 文件的模板，提取 i18n 数据
function extractI18nDataFromTemplate(templateBody: SFCTemplateBlock) {
  const i18nData = {}

  if (templateBody.ast?.children && templateBody.ast?.children.length > 0) {
    for (const node of templateBody.ast?.children) {
      traverseNode(node as unknown as TemplateNode, i18nData)
    }
  }

  return i18nData
}

type TemplateNode = {
  type: string
  ns: string
  props: any
  children: TemplateNode[]
}

function traverseNode(node: TemplateNode, i18nMap: Record<string, string>) {
  if (node.props && node.props.length) {
    let i18nKey = ''
    let labelValue = ''

    for (const prop of node.props) {
      if (prop.name === 'i18n-key' || prop.name === 'i18nKey') {
        i18nKey = prop.value.content
      } else if (prop.name === 'label') {
        labelValue = prop.value.content
      }

      if (i18nKey && labelValue) break
    }

    if (i18nKey && labelValue) {
      console.log(i18nKey, labelValue)
      i18nMap[i18nKey] = labelValue
    }
  }

  if (node.children) {
    node.children.forEach((child) => {
      traverseNode(child, i18nMap)
    })
  }
}

// 递归提取所有组件的 i18n 数据
async function extractI18nDataFromComponent(id) {
  const fileContent = fs.readFileSync(id, 'utf-8') // 读取 Vue 文件内容
  const sfc = parse(fileContent)

  let i18nData = {}

  // 提取当前组件中的 i18n 数据
  const templateBody = sfc.descriptor.template // 获取模板部分
  if (!templateBody) return i18nData
  i18nData = extractI18nDataFromTemplate(templateBody)

  const scriptSetup = sfc.descriptor.scriptSetup
  if (scriptSetup) {
    const scriptBlock = compileScript(sfc.descriptor, {
      id
    })

    // 处理子组件引用
    const importedComponents: string[] = []
    for (const importItemKey in scriptBlock.imports) {
      const importItem = scriptBlock.imports[importItemKey]
      if (!importItem.isType && importItem.isUsedInTemplate) {
        importedComponents.push(importItem.source)
      }
    }

    // 递归提取子组件中的 i18n 数据
    for (const componentPath of importedComponents) {
      const componentAbsolutePath = path.resolve(path.dirname(id), componentPath)
      if (fs.existsSync(componentAbsolutePath)) {
        const childData = await extractI18nDataFromComponent(componentAbsolutePath)
        i18nData = { ...i18nData, ...childData }
      }
    }
  }

  return i18nData
}

// 插件主函数
export function i18nKeyExtractPlugin() {
  return {
    name: 'vite-plugin-i18n-key-extrct',
    async transform(code, id) {
      // 只处理 .vue 文件
      if (!id.endsWith('.vue')) {
        return null
      }

      const rootComponentParttern = /<script[^>]*\s+root\s*(?:=\s*["'][^"']*["'])?[^>]*>/g
      // 提取父组件的 i18n 数据
      const isRootComponent = rootComponentParttern.test(code)

      if (!isRootComponent) return

      let i18nData = await extractI18nDataFromComponent(id)

      // 获取当前父组件的路径
      const parentComponentPath = path.dirname(id)
      const i18nFilePath = path.resolve(parentComponentPath, 'i18n.json')

      // 将 i18n 数据写入文件
      fs.writeFileSync(i18nFilePath, JSON.stringify(i18nData, null, 2), 'utf-8')

      return code
    }
  }
}
