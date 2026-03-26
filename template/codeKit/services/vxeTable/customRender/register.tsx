import {VxeUIExport, VxeGlobalRendererHandles} from 'vxe-pc-ui'
import {toFixedPlus} from '../../../utils'
import YesOrNoCheckbox from './YesOrNoCheckbox/index.vue'
import NSInput from './NSInput/index.vue'
import NSSelect from './NSSelect/index.vue'
import RemoteSelect from './RemoteSelect/indexV2.vue'
import Link from './Link/index.vue'

function registerRender(VxeUI: VxeUIExport) {
    VxeUI.renderer.add('YesOrNoCheckbox', {
        renderTableDefault(_renderOpts, params) {
            return <YesOrNoCheckbox params={params as VxeGlobalRendererHandles.RenderTableEditParams}/>
        }
    })

    VxeUI.renderer.add('ElButton', {
        renderTableDefault(renderOpts, params) {
            return <Link options={renderOpts} params={params}/>
        }
    })

    VxeUI.renderer.add('NSSelect', {
        renderTableEdit(renderOpts, params) {
            // console.log('renderOpts', renderOpts, params)
            return <NSSelect options={renderOpts} params={params}/>
        },
        renderTableCell(_renderOpts, params) {
            const {options, optionProps} = _renderOpts
            const {row, column} = params

            const labelField = optionProps.label
            const valueField = optionProps.value
            // console.log(_renderOpts,labelField,valueField)
            const item = options.find(opt => opt[valueField] === row[column.field]) || {}

            return <span>{item[labelField]}</span>
        }
    })

    VxeUI.renderer.add('NSInput', {
        renderTableEdit(renderOpts, params) {
            return <NSInput options={renderOpts} params={params}/>
        },
        renderTableCell(_renderOpts, params) {
            const {row, column} = params
            return <span>{row[column.field]}</span>
        }
    })

    VxeUI.renderer.add('NSNumberInput', {
        renderTableEdit(renderOpts, params) {
            const defaultAttrs = {
                attrs: Object.assign({type: 'number', align: 'right'}, renderOpts.attrs)
            }
            return <NSInput options={{...renderOpts, ...defaultAttrs}} params={params}/>
        },
        renderTableCell(_renderOpts, params) {
            const {row, column} = params
            return <span>{toFixedPlus(row[column.field], 4)}</span>
        }
    })

    VxeUI.renderer.add('RemoteSelect', {
        renderTableDefault(renderOpts, params) {
            const defaultAttrs = {attrs: Object.assign({}, renderOpts.attrs)}
            return <RemoteSelect options={{...renderOpts, ...defaultAttrs}} params={params}/>
        }
    })
}

export default registerRender
