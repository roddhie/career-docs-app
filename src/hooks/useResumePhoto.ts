// src/hooks/useResumePhoto.ts
import { useEffect, useState } from 'react'
import {
  loadPhoto,
  type PhotoDirectoryHandle,
} from '../utils/photoStorage'

type PhotoResult = {
  directory: PhotoDirectoryHandle
  path: string
  url: string | null
  error: string | null
}

export function useResumePhoto(
  directory: PhotoDirectoryHandle | null,
  photoPath: string | null,
) {
  const [result, setResult] = useState<PhotoResult | null>(null)

  useEffect(() => {
    if (!directory || !photoPath) return

    const selectedDirectory = directory
    const selectedPath = photoPath
    let cancelled = false
    let objectUrl: string | null = null

    async function readPhoto() {
      try {
        const file = await loadPhoto(selectedDirectory, selectedPath)

        if (cancelled) return

        objectUrl = URL.createObjectURL(file)

        // 印刷前に画像の読み込みが完了するようにします。
        const image = new Image()
        image.src = objectUrl
        await image.decode()

        if (cancelled) return

        setResult({
          directory: selectedDirectory,
          path: selectedPath,
          url: objectUrl,
          error: null,
        })
      } catch (error) {
        if (cancelled) return

        setResult({
          directory: selectedDirectory,
          path: selectedPath,
          url: null,
          error:
            error instanceof Error
              ? error.message
              : '写真を読み込めませんでした。',
        })
      }
    }

    void readPhoto()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [directory, photoPath])

  // 別の書類・フォルダの写真を、一瞬でも表示しないようにします。
  const current =
    result?.directory === directory && result?.path === photoPath
      ? result
      : null

  const photoError = !photoPath
    ? null
    : !directory
      ? '写真を読み込むため、データ保存フォルダを選択してください。'
      : current?.error ?? null

  return {
    photoUrl: photoPath ? current?.url ?? null : null,
    photoError,
    photoLoading: Boolean(photoPath && directory && !current),
  }
}