import {VxeUIExport} from 'vxe-pc-ui'
import dayjs from 'dayjs'
import {toFixedPlus} from '../../utils'

export function registerFormats(VxeUI: VxeUIExport) {

    VxeUI.formats.add('date', function ({cellValue}) {
        return cellValue ? dayjs(cellValue).format('YYYY-MM-DD') : cellValue
    })

    VxeUI.formats.add('datetime', function ({cellValue}, pattern = 'YYYY-MM-DD HH:mm:ss') {
        return cellValue ? dayjs(cellValue).format(pattern) : cellValue
    })

    VxeUI.formats.add('number', function ({cellValue}, digits = 8) {
        return cellValue ? toFixedPlus(cellValue, digits) : cellValue
    })

    VxeUI.formats.add('percentage', function ({cellValue}, digits = 2) {
        const value = cellValue ? toFixedPlus(cellValue, digits) : cellValue
        return value ? value + '%' : value
    })

    VxeUI.formats.add('percentage2', function ({cellValue}, digits = 2) {
        const value = cellValue ? toFixedPlus(cellValue * 100, digits) : cellValue
        return value ? value + '%' : value
    })
}
