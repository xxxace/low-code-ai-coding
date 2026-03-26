import { generateDataModel } from '@nameson/sqlutils'
import { useUserStore } from '@/store/modules/user'

export function getChangeStatusItemList({ item, status }) {
  if (!item.PSSEQ) throw new Error('变更状态接受的参数为空！')

  const userInfo = useUserStore().userInfo

  const dataModel = generateDataModel({
    tableName: 'PSTASKJOB',
    user: userInfo?.username
  })

  dataModel.setPKvalues({
    PSSEQ: item.PSSEQ,
    TSKSEQ: item.TSKSEQ,
    JOBSEQ: item.JOBSEQ
  })

  dataModel.setColdatas(
    {
      STFG: status
    },
    {
      STFG: item.STFG
    }
  )

  return dataModel.build()
}
