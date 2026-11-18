import { useEffect, useRef, useState } from 'react'
import type { ApplicationDocument } from './types/documents'
import { createSampleApplication } from './data/createSampleApplication'
import { isApplicationDocument } from './utils/validateApplication'
import CareerPreview from './components/CareerPreview'
import ResumePreview from './components/ResumePreview'

type WritableFile = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
  abort: () => Promise<void>
}

type LocalFileHandle = {
  getFile: () => Promise<File>
  createWritable: () => Promise<WritableFile>
}

type LocalDirectoryHandle = {
  name: string
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<LocalFileHandle>
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: {
    mode: 'readwrite'
  }) => Promise<LocalDirectoryHandle>
}

const fileName = 'application.json'

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'AbortError':
        return '操作をキャンセルしました。'
      case 'NotAllowedError':
        return 'フォルダへのアクセスが許可されていません。保存先を選び直してください。'
      case 'NotFoundError':
        return `${fileName}が見つかりません。先に保存してください。`
    }
  }

  if (error instanceof SyntaxError) {
    return 'JSONの形式が正しくありません。入力内容は保持しています。'
  }

  return error instanceof Error
    ? error.message
    : '処理に失敗しました。もう一度お試しください。'
}

export default function App() {
  const [application, setApplication] =
    useState<ApplicationDocument>(createSampleApplication)

  const [directory, setDirectory] =
    useState<LocalDirectoryHandle | null>(null)

  const [previewType, setPreviewType] =
    useState<'career' | 'resume'>('career')

  const [message, setMessage] = useState('保存先を選択してください。')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(true)
  const operationRunning = useRef(false)

  const pickerWindow = window as DirectoryPickerWindow
  const supported = typeof pickerWindow.showDirectoryPicker === 'function'

  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [dirty])

  async function runOperation(operation: () => Promise<void>) {
    if (operationRunning.current) return

    operationRunning.current = true
    setBusy(true)

    try {
      await operation()
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      operationRunning.current = false
      setBusy(false)
    }
  }

  async function selectDirectory() {
    const picker = pickerWindow.showDirectoryPicker

    if (!picker) {
      setMessage('保存先の選択に対応したChromeで開いてください。')
      return
    }

    const selected = await picker.call(window, { mode: 'readwrite' })

    setDirectory(selected)
    setDirty(true)
    setMessage(
      `保存先「${selected.name}」を選択しました。既存の書類は「読み込む」で開けます。`,
    )
  }

  async function saveApplication() {
    if (!directory) return

    // 上書きする前に、既存ファイルの有無を確認する。
    let exists = false

    try {
      await directory.getFileHandle(fileName)
      exists = true
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
        throw error
      }
    }

    if (
      exists &&
      !window.confirm(`${fileName}を現在の内容で上書きしますか？`)
    ) {
      setMessage('保存をキャンセルしました。')
      return
    }

    const savedApplication: ApplicationDocument = {
      ...application,
      updatedAt: new Date().toISOString(),
    }

    const handle = await directory.getFileHandle(fileName, {
      create: true,
    })
    const writable = await handle.createWritable()

    try {
      await writable.write(JSON.stringify(savedApplication, null, 2))
      await writable.close()
    } catch (error) {
      // 書き込み途中で失敗した場合は中止を試みる。
      try {
        await writable.abort()
      } catch {
        // 既に閉じている場合などは、元のエラーを表示する。
      }
      throw error
    }

    setApplication(savedApplication)
    setDirty(false)
    setMessage(`${fileName}を保存しました。`)
  }

  async function loadApplication() {
    if (!directory) return

    if (
      dirty &&
      !window.confirm('現在の入力内容を、保存済みの書類に置き換えますか？')
    ) {
      setMessage('読込をキャンセルしました。')
      return
    }

    const handle = await directory.getFileHandle(fileName)
    const file = await handle.getFile()
    const data: unknown = JSON.parse(await file.text())

    if (!isApplicationDocument(data)) {
      throw new Error(
        '対応していない書類データです。入力内容は保持しています。',
      )
    }

    setApplication(data)
    setDirty(false)
    setMessage(`${fileName}を読み込みました。`)
  }

  function editApplication(
    update: (current: ApplicationDocument) => ApplicationDocument,
  ) {
    if (operationRunning.current) return

    setApplication(update)
    setDirty(true)
    setMessage('書類を変更しました。保存してください。')
  }

  return (
    <main>
      <h1>履歴書・職務経歴書の作成</h1>

      {!supported && (
        <p role="alert">
          このブラウザはフォルダ選択に対応していません。
          ChromeでローカルURLを開いてください。
        </p>
      )}

      <fieldset disabled={busy}>
        <legend>保存・読込</legend>

        <div className="actions">
          <button
            type="button"
            disabled={!supported}
            onClick={() => void runOperation(selectDirectory)}
          >
            保存フォルダを選択
          </button>

          <button
            type="button"
            disabled={!directory}
            onClick={() => void runOperation(saveApplication)}
          >
            保存する
          </button>

          <button
            type="button"
            disabled={!directory}
            onClick={() => void runOperation(loadApplication)}
          >
            読み込む
          </button>
        </div>

        <p>保存先：{directory?.name ?? '未選択'}</p>
        <p>{dirty ? '未保存の変更があります' : '保存済みデータと一致しています'}</p>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>応募先と基本情報</legend>

        <label htmlFor="companyName">応募先企業</label>
        <input
          id="companyName"
          value={application.companyName}
          onChange={(event) => {
            const value = event.target.value
            editApplication((current) => ({
              ...current,
              companyName: value,
            }))
          }}
        />

        <label htmlFor="fullName">氏名</label>
        <input
          id="fullName"
          value={application.profile.fullName}
          onChange={(event) => {
            const value = event.target.value
            editApplication((current) => ({
              ...current,
              profile: {
                ...current.profile,
                fullName: value,
              },
            }))
          }}
        />

        <label htmlFor="documentDate">書類の日付</label>
        <input
          id="documentDate"
          type="date"
          value={application.documentDate}
          onChange={(event) => {
            const value = event.target.value
            editApplication((current) => ({
              ...current,
              documentDate: value,
            }))
          }}
        />

        <label htmlFor="summary">職務要約</label>
        <textarea
          id="summary"
          rows={5}
          value={application.careerHistory.summary}
          onChange={(event) => {
            const value = event.target.value
            editApplication((current) => ({
              ...current,
              careerHistory: {
                ...current.careerHistory,
                summary: value,
              },
            }))
          }}
        />

        <label htmlFor="motivation">履歴書の志望動機</label>
        <textarea
          id="motivation"
          rows={5}
          value={application.resume.motivation}
          onChange={(event) => {
            const value = event.target.value
            editApplication((current) => ({
              ...current,
              resume: {
                ...current.resume,
                motivation: value,
              },
            }))
          }}
        />
      </fieldset>

      <p role="status">{busy ? '処理中です…' : message}</p>

      <fieldset disabled={busy}>
        <legend>プレビュー・印刷</legend>

        <div className="actions">
          <button
            type="button"
            onClick={() => setPreviewType('career')}
            aria-pressed={previewType === 'career'}
          >
            職務経歴書を表示
          </button>

          <button
            type="button"
            onClick={() => setPreviewType('resume')}
            aria-pressed={previewType === 'resume'}
          >
            履歴書を表示
          </button>

          <button type="button" onClick={() => window.print()}>
            表示中の書類を印刷・PDF保存
          </button>
        </div>
      </fieldset>

      {previewType === 'career' ? (
        <CareerPreview
          fullName={application.profile.fullName}
          documentDate={application.documentDate}
          content={application.careerHistory}
        />
      ) : (
        <ResumePreview
          profile={application.profile}
          content={application.resume}
          documentDate={application.documentDate}
        />
      )}
    </main>
  )
}