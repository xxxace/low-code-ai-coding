import { VxeUIExport, VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { toFixedPlus } from '@/utils'
import YesOrNoCheckbox from './YesOrNoCheckbox/index.vue'
import PopupTable from './PopupTable/index.vue'
import NSInput from './NSInput/index.vue'
import RemoteSelect from './RemoteSelect/index.vue'
import RemoteSelectV2 from './RemoteSelect/indexV2.vue'
import BillStatusSelect from './BillStatusSelect/index.vue'
// import ElButton from './ElButton/index.vue'
import Link from './Link/index.vue'

function registerRender(VxeUI: VxeUIExport) {
  VxeUI.renderer.add('YesOrNoCheckbox', {
    renderTableDefault(_renderOpts, params) {
      return <YesOrNoCheckbox params={params as VxeGlobalRendererHandles.RenderTableEditParams} />
    }
  })

  VxeUI.renderer.add('ElButton', {
    renderTableDefault(renderOpts, params) {
      return <Link options={renderOpts} params={params} />
    }
  })

  // VxeUI.renderer.add('ElButton', {
  //   renderTableDefault(renderOpts, params) {
  //     return <ElButton options={renderOpts} params={params} />
  //   }
  // })

  VxeUI.renderer.add('PopupTable', {
    renderTableEdit(_renderOpts, params) {
      return (
        <PopupTable
          options={
            _renderOpts as VxeGlobalRendererHandles.RenderDefaultOptions & {
              clearable?: boolean
              contentKey?: string
              labelKey?: string
              valueKey: string
              valueMappings?: string[]
              dialogComponent: Object
              dialogUpdator?: Function
            }
          }
          params={params as VxeGlobalRendererHandles.RenderTableEditParams}
        />
      )
    },
    renderTableCell(renderOpts, params) {
      const { attrs } = renderOpts
      const { row, column } = params
      if (attrs && attrs.contentKey) {
        return <span>{row[attrs.contentKey]}</span>
      }
      return <span>{row[column.field]}</span>
    }
  })

  VxeUI.renderer.add('NSInput', {
    renderTableEdit(renderOpts, params) {
      return <NSInput options={renderOpts} params={params} />
    },
    renderTableCell(_renderOpts, params) {
      const { row, column } = params
      return <span>{row[column.field]}</span>
    }
  })

  VxeUI.renderer.add('NSNumberInput', {
    renderTableEdit(renderOpts, params) {
      const defaultAttrs = {
        attrs: Object.assign({ type: 'number', align: 'right' }, renderOpts.attrs)
      }
      return <NSInput options={{ ...renderOpts, ...defaultAttrs }} params={params} />
    },
    renderTableCell(_renderOpts, params) {
      const { row, column } = params
      return <span>{toFixedPlus(row[column.field], 4)}</span>
    }
  })

  VxeUI.renderer.add('RemoteSelect', {
    renderTableDefault(renderOpts, params) {
      const defaultAttrs = { attrs: Object.assign({}, renderOpts.attrs) }
      return <RemoteSelect options={{ ...renderOpts, ...defaultAttrs }} params={params} />
    }
  })

  VxeUI.renderer.add('RemoteSelectV2', {
    renderTableDefault(renderOpts, params) {
      const defaultAttrs = { attrs: Object.assign({}, renderOpts.attrs) }
      return <RemoteSelectV2 options={{ ...renderOpts, ...defaultAttrs }} params={params} />
    }
  })

  VxeUI.renderer.add('BillStatusSelect', {
    renderTableDefault(_renderOpts, params) {
      return <BillStatusSelect params={params as VxeGlobalRendererHandles.RenderTableEditParams} />
    }
  })
}

export default registerRender
