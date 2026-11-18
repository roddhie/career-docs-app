import { useState } from 'react'
import CareerPreview from './components/CareerPreview'
import { sampleCareer } from './data/sampleCareer'
import ResumePreview from './components/ResumePreview'
import { sampleProfile, sampleResume } from './data/sampleResume'

type Profile = {
  schemaVersion: 1
  name: string
  summary: string
}

type WritableFile = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
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

const fileName = 'storage-test.json'

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const profile = value as Record<string, unknown>

  return (
    profile.schemaVersion === 1 &&
    typeof profile.name === 'string' &&
    typeof profile.summary === 'string'
  )
}

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

function App() {
  const [previewType, setPreviewType] =  useState<'career' | 'resume'>('career')
  const [directory, setDirectory] = useState<LocalDirectoryHandle | null>(null)

  const [profile, setProfile] = useState<Profile>({
    schemaVersion: 1,
    name: '山田 太郎（架空）',
    summary: 'Webアプリケーションの画面開発を担当しました。',
  })

  const [message, setMessage] = useState('保存先を選択してください。')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(true)

  const pickerWindow = window as DirectoryPickerWindow
  const supported = typeof pickerWindow.showDirectoryPicker === 'function'

  async function runOperation(operation: () => Promise<void>) {
    setBusy(true)

    try {
      await operation()
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
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
    setMessage(`保存先「${selected.name}」を選択しました。`)
  }

  async function saveProfile() {
    if (!directory) return

    const handle = await directory.getFileHandle(fileName, {
      create: true,
    })

    const writable = await handle.createWritable()
    await writable.write(JSON.stringify(profile, null, 2))
    await writable.close()

    setDirty(false)
    setMessage(`${fileName}を保存しました。`)
  }

  async function loadProfile() {
    if (!directory) return

    if (
      dirty &&
      !window.confirm('現在の入力内容を、保存済みデータに置き換えますか？')
    ) {
      setMessage('読込をキャンセルしました。')
      return
    }

    const handle = await directory.getFileHandle(fileName)
    const file = await handle.getFile()
    const data: unknown = JSON.parse(await file.text())

    if (!isProfile(data)) {
      throw new Error(
        '対応していないデータ形式です。入力内容は保持しています。',
      )
    }

    setProfile(data)
    setDirty(false)
    setMessage(`${fileName}を読み込みました。`)
  }

  function updateField(field: 'name' | 'summary', value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setDirty(true)
    setMessage('入力内容を変更しました。保存してください。')
  }

  return (
    <main>
      <h1>書類データの保存確認</h1>
      <p>架空の名前・職務要約を使って保存と読込を確認します。</p>

      {!supported && (
        <p role="alert">
          このブラウザはフォルダ選択に対応していません。
          ChromeでローカルURLを開いてください。
        </p>
      )}

      <fieldset disabled={busy}>
        <legend>保存先</legend>
        <button
          type="button"
          disabled={!supported}
          onClick={() => void runOperation(selectDirectory)}
        >
          保存フォルダを選択
        </button>
        <p>選択中のフォルダ：{directory?.name ?? '未選択'}</p>
      </fieldset>

      <fieldset disabled={busy}>
        <legend>プロフィール</legend>

        <label htmlFor="name">名前</label>
        <input
          id="name"
          value={profile.name}
          onChange={(event) => updateField('name', event.target.value)}
        />

        <label htmlFor="summary">職務要約</label>
        <textarea
          id="summary"
          rows={5}
          value={profile.summary}
          onChange={(event) => updateField('summary', event.target.value)}
        />

        <p>{dirty ? '未保存の入力内容があります' : '保存済みデータと一致しています'}</p>

        <div className="actions">
          <button
            type="button"
            disabled={!directory}
            onClick={() => void runOperation(saveProfile)}
          >
            JSONを保存
          </button>
          <button
            type="button"
            disabled={!directory}
            onClick={() => void runOperation(loadProfile)}
          >
            JSONを読み込む
          </button>
        </div>
      </fieldset>

      <p role="status">{busy ? '処理中です…' : message}</p>

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

      {previewType === 'career' ? (
        <CareerPreview
          fullName="山田 太郎（架空）"
          documentDate="2026-11-18"
          content={sampleCareer}
        />
      ) : (
        <ResumePreview
          profile={sampleProfile}
          content={sampleResume}
          documentDate="2026-11-18"
        />
      )}
    </main>
  )
}

export default App