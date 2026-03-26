import { VxeUI } from 'vxe-pc-ui'
import { VxeGrid } from 'vxe-table'
import type { VxeColumnProps } from 'vxe-table'

export function useModelTable({
                                  title,
                                  columns,
                                  data
                              }: {
    title: string
    columns: VxeColumnProps[]
    data: any[]
}) {
    VxeUI.modal.open({
        title: title,
        mask: false,
        lockView: false,
        escClosable: true,
        width: 600,
        height: 300,
        minHeight: 200,
        showZoom: true,
        resize: true,
        size: 'mini',
        showFooter: true,
        showConfirmButton: true,
        showCancelButton: false,
        slots: {
            default() {
                return <VxeGrid size="mini" height={'auto'} border columns={columns} data={data}></VxeGrid>
            }
        }
    })
}
