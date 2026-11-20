// src/utils/photoStorage.ts

interface PhotoWritable {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
  abort: () => Promise<void>
}

interface PhotoFileHandle {
  getFile: () => Promise<File>
  createWritable: () => Promise<PhotoWritable>
}

export interface PhotoDirectoryHandle {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<PhotoDirectoryHandle>

  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<PhotoFileHandle>
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// このアプリで保存した写真のパスだけを受け付けます。
const PHOTO_PATH_PATTERN =
  /^photos\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png))$/

async function validatePhoto(file: File): Promise<void> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    throw new Error('写真にはJPEGまたはPNG形式の画像を選択してください。')
  }

  if (file.size === 0) {
    throw new Error('選択した画像ファイルが空です。')
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('写真のファイルサイズは5MB以下にしてください。')
  }

  // 拡張子だけで判断せず、画像として読み込めることも確認します。
  const url = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.src = url
    await image.decode()
  } catch {
    throw new Error(
      '画像を読み込めませんでした。別のJPEGまたはPNG画像を選択してください。',
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 選択した写真をデータ保存フォルダ内へコピーし、
 * JSONに記録する相対パスを返します。
 */
export async function savePhoto(
  directory: PhotoDirectoryHandle,
  file: File,
): Promise<string> {
  await validatePhoto(file)

  const photosDirectory = await directory.getDirectoryHandle('photos', {
    create: true,
  })

  const extension = file.type === 'image/jpeg' ? 'jpg' : 'png'
  const fileName = `${crypto.randomUUID()}.${extension}`

  const handle = await photosDirectory.getFileHandle(fileName, {
    create: true,
  })

  const writable = await handle.createWritable()

  try {
    await writable.write(file)
    await writable.close()
  } catch (error) {
    // 書き込みに失敗した場合は、中途半端な内容の確定を避けます。
    try {
      await writable.abort()
    } catch {
      // 元の書き込みエラーを優先します。
    }

    throw error
  }

  return `photos/${fileName}`
}

/**
 * JSONに記録された相対パスから写真を読み込みます。
 */
export async function loadPhoto(
  directory: PhotoDirectoryHandle,
  photoPath: string,
): Promise<File> {
  const match = PHOTO_PATH_PATTERN.exec(photoPath)

  if (!match) {
    throw new Error(
      '写真の保存場所が正しくありません。写真を選択し直してください。',
    )
  }

  try {
    const photosDirectory = await directory.getDirectoryHandle('photos')
    const handle = await photosDirectory.getFileHandle(match[1])
    const file = await handle.getFile()

    await validatePhoto(file)

    return file
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new Error(
        '保存した写真が見つかりません。データ保存フォルダを確認するか、写真を選択し直してください。',
      )
    }

    throw error
  }
}