import { ColdataModel, generateDataModel, diffItem } from '@nameson/sqlutils'
import { useUserStore } from '@/store/modules/user'
import { PostProcessingVO } from '../api'
import { saveData } from '@/api/nameson'

export async function confirmTask({
  data,
  oldData
}: {
  data: Partial<PostProcessingVO>[]
  oldData: Partial<PostProcessingVO>[]
}) {
  const postList: ColdataModel[] = []
  const dataModel = generateDataModel({
    tableName: 'PSTASK',
    user: useUserStore().userInfo?.username
  })

  dataModel.setExclude(['FTYNAME'])

  const diffList = diffItem(
    data,
    oldData,
    (a: PostProcessingVO, b: PostProcessingVO) => a.PSSEQ === b.PSSEQ && a.TSKSEQ === b.TSKSEQ
  )

  for (const items of diffList) {
    const [newItem, oldItem] = items
    const dataItem = newItem || oldItem

    dataModel.setPKvalues({
      PSSEQ: dataItem!.PSSEQ,
      TSKSEQ: dataItem!.TSKSEQ
    })
    dataModel.setColdatas(newItem, oldItem)
    dataModel.hasColdatas() && postList.push(dataModel.build())
  }

  if (postList.length > 0) {
    return await saveData(postList)
  } else {
    return {
      statusCode: '0',
      message: '没有需要确认的任务'
    }
  }
}
