import { postAction } from './index'

export type CreateFileParams = {
  folderName: string
  filename: string
  base64: string
}

export async function createFile(params: CreateFileParams) {
  if (!params.filename || !params.folderName) throw new Error('createFile參數錯誤')
  const path = `D:\\WebApp\\NXAPPService\\VEHICLE\\${params.folderName}`

  const res = await postAction('/CreateFiles', {
    pFilesDirectory: path,
    pFileName: params.filename,
    pFileString: params.base64
  })

  if (res.statusCode !== '1') {
    throw new Error(res.message)
  } else {
    return path + `\\${params.filename}`
  }
}

export type DeleteFileParams = {
  folderName: string
  filepath: string
}

export async function deleteFile(params: DeleteFileParams) {
  if (!params.filepath || !params.folderName) throw new Error('deleteFile缺少参数')
  const path = `D:\\WebApp\\NXAPPService\\VEHICLE\\${params.folderName}`

  const res = await postAction('/DeleteFiles', {
    pFilesDirectory: path,
    pFileName: params.filepath.substring(path.length + 1)
  })

  if (res.statusCode !== '1') {
    throw new Error(res.message)
  }
}
