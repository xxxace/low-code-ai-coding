import type { VxeModalInstance, VxeModalProps } from 'vxe-pc-ui'

export type ResizeModalProps = Omit<
  VxeModalProps,
  'width' | 'height' | 'title' | 'minHeight' | 'showMinimize' | 'beforeHideMethod'
> & {
  noOverflow?: boolean
  footer?: boolean
  mode?: 'default' | 'paramsForm' | 'confirm' | 'alert'
}

export type ModalProps = VxeModalProps & {
  noOverflow?: boolean
  footer?: boolean
  mode?: 'default' | 'paramsForm' | 'confirm' | 'alert'
}

export type ResizeModalInstance = VxeModalInstance

export type ParamsFormInstance = VxeModalInstance & {
  open: (params: any) => Promise<void>
}
