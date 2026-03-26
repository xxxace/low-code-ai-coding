import { useModal } from '@/plugins/dialog'

export const openEditForm = (TSKNO: string) => {
  useModal({
    modalProps: {
      title: '变更管理',
      width: '1300px',
      height: '754px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            `@dynamic/views/MES/taskConfirm/form/index?identity=VUE_MES_MODIFY&TSKNO=${TSKNO}`
          )
        }
      />
    )
  })
}

export const openInsertForm = (PSSEQ: number) => {
  useModal({
    modalProps: {
      title: '插单管理',
      width: '1100px',
      height: '610px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            `@dynamic/views/MES/taskConfirm/insertFormV4/index?identity=VUE_MES_INSERT&PSSEQ=${PSSEQ}`
          )
        }
      />
    )
  })
}

export const openStopWorkForm = () => {
  useModal({
    modalProps: {
      title: '停工申请',
      width: '1006px',
      height: '646px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(`@dynamic/views/MES/stopWork/form/index?identity=VUE_MES_STOP`)
        }
      />
    )
  })
}

export const openStopWorkForm2 = (row: any) => {
  useModal({
    params: row,
    modalProps: {
      title: '停工状态管理',
      width: '690px',
      height: '336px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            `@dynamic/views/MES/taskConfirm/stopWorkForm/index?identity=VUE_MES_STOP`
          )
        }
      />
    )
  })
}

export const openCancleForm = () => {
  useModal({
    modalProps: {
      title: '取消管理',
      width: '1130px',
      height: '600px'
    },
    component: () => (
      <iframe
        width="100%"
        height="100%"
        style="border: none;"
        src={
          window.location.origin +
          '/#/dynamic?to=' +
          encodeURIComponent(
            `@dynamic/views/MES/taskConfirm/cancelForm/index?identity=VUE_HOTEL_MATERIAL_PRD`
          )
        }
      />
    )
  })
}
