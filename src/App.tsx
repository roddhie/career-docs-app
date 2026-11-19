import { useEffect, useRef, useState } from 'react'
import type {
  ApplicationDocument,
  ProfileFile,
} from './types/documents'
import { createSampleApplication } from './data/createSampleApplication'
import { isApplicationDocument } from './utils/validateApplication'
import CareerPreview from './components/CareerPreview'
import { CareerLayoutEditor } from './components/CareerLayoutEditor'
import ResumePreview from './components/ResumePreview'
import ResumeEditor from './components/ResumeEditor'
import { CareerEditor } from './components/CareerEditor'
import { createApplicationFromProfile } from './data/createApplicationFromProfile'
import { isProfileFile } from './utils/validateProfileFile'
import { checkDocument } from './utils/checkDocument'

type WritableFile = {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
  abort: () => Promise<void>
}

type LocalFileHandle = {
  kind: 'file'
  name: string
  getFile: () => Promise<File>
  createWritable: () => Promise<WritableFile>
}

type LocalDirectoryHandle = {
  kind: 'directory'
  name: string
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<LocalFileHandle>
  values: () => AsyncIterableIterator<
    LocalFileHandle | LocalDirectoryHandle
  >
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: {
    mode: 'readwrite'
  }) => Promise<LocalDirectoryHandle>
}

type EditorTab = 'basic' | 'resume' | 'career' | 'preview'

type DocumentFileItem = {
  fileName: string
  label: string
}

async function listDocumentFiles(
  directory: LocalDirectoryHandle,
): Promise<DocumentFileItem[]> {
  const items: DocumentFileItem[] = []

  for await (const entry of directory.values()) {
    if (entry.kind !== 'file') continue

    const isDocumentFile =
      entry.name === 'application.json' ||
      /^application-[a-zA-Z0-9-]+\.json$/.test(entry.name)

    if (!isDocumentFile) continue

    let label = `${entry.name}（読込不可）`

    try {
      const file = await entry.getFile()
      const data: unknown = JSON.parse(await file.text())

      if (isApplicationDocument(data)) {
        label =
          `${data.companyName || '企業名未入力'}` +
          ` ／ ${data.jobTitle || '職種未入力'}` +
          ` ／ ${entry.name}`
      }
    } catch {
      // 読めないファイルも一覧に残し、
      // 読込操作時にエラーを表示する。
    }

    items.push({
      fileName: entry.name,
      label,
    })
  }

  return items.sort((a, b) => a.label.localeCompare(b.label, 'ja'))
}

const editorTabs: { id: EditorTab; label: string }[] = [
  { id: 'basic', label: '基本情報' },
  { id: 'resume', label: '履歴書' },
  { id: 'career', label: '職務経歴書' },
  { id: 'preview', label: 'プレビュー' },
]

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'AbortError':
        return '操作をキャンセルしました。'
      case 'NotAllowedError':
        return 'フォルダへのアクセスが許可されていません。保存先を選び直してください。'
      case 'NotFoundError':
        return '対象のファイルが見つかりません。書類一覧を更新してください。'
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
  const [application, setApplication] =  useState<ApplicationDocument>(createSampleApplication)

  const [directory, setDirectory] =  useState<LocalDirectoryHandle | null>(null)

  const [previewType, setPreviewType] =  useState<'career' | 'resume'>('career')

  const [activeTab, setActiveTab] = useState<EditorTab>('basic')

  const [documentFiles, setDocumentFiles] = useState<DocumentFileItem[]>([])

  // 現在編集中の書類の保存先。複製直後は未保存なのでnull。
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)

  // 一覧で選択した「次に読み込む書類」。
  const [selectedFileName, setSelectedFileName] = useState('')

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
    const files = await listDocumentFiles(selected)

    setDirectory(selected)
    setDocumentFiles(files)
    setSelectedFileName(files[0]?.fileName ?? '')

    // 別のフォルダを選んだので、
    // 現在の入力内容と保存済みファイルの対応を解除する。
    setCurrentFileName(null)
    setDirty(true)

    setMessage(
      `保存先「${selected.name}」を選択しました。` +
        '既存の書類は一覧から選んで「読み込む」を押してください。',
    )
  }

  async function refreshDocumentFiles() {
    if (!directory) return

    const files = await listDocumentFiles(directory)
    setDocumentFiles(files)

    setSelectedFileName((current) =>
      files.some((item) => item.fileName === current)
        ? current
        : files[0]?.fileName ?? '',
    )

    setMessage('書類一覧を更新しました。入力内容は変更していません。')
  }

  async function saveApplication() {
    if (!directory) return

    // 外部から読み込んだIDに、パスとして使えない文字が
    // 含まれている場合は新しいIDを割り当てる。
    const documentId = /^[a-zA-Z0-9-]+$/.test(application.id)
      ? application.id
      : crypto.randomUUID()

    const targetFileName =
      currentFileName ?? `application-${documentId}.json`

    let exists = false

    try {
      await directory.getFileHandle(targetFileName)
      exists = true
    } catch (error) {
      if (
        !(error instanceof DOMException &&
          error.name === 'NotFoundError')
      ) {
        throw error
      }
    }

    if (
      exists &&
      !window.confirm(
        `${targetFileName}を現在の内容で上書きしますか？`,
      )
    ) {
      setMessage('保存をキャンセルしました。')
      return
    }

    const savedApplication: ApplicationDocument = {
      ...application,
      id: documentId,
      updatedAt: new Date().toISOString(),
    }

    const handle = await directory.getFileHandle(targetFileName, {
      create: true,
    })
    const writable = await handle.createWritable()

    try {
      await writable.write(JSON.stringify(savedApplication, null, 2))
      await writable.close()
    } catch (error) {
      try {
        await writable.abort()
      } catch {
        // 元の書き込みエラーを表示する。
      }
      throw error
    }

    setApplication(savedApplication)
    setCurrentFileName(targetFileName)
    setSelectedFileName(targetFileName)
    setDirty(false)

    // 保存に成功した後、一覧の更新だけが失敗した場合は
    // 保存失敗とは区別して案内する。
    try {
      const files = await listDocumentFiles(directory)
      setDocumentFiles(files)
      setMessage(`${targetFileName}を保存しました。`)
    } catch {
      setMessage(
        `${targetFileName}は保存済みです。` +
          '一覧の取得に失敗したため「一覧を更新」を押してください。',
      )
    }
  }

  async function loadApplication() {
    if (!directory || !selectedFileName) return

    if (
      dirty &&
      !window.confirm(
        '未保存の入力内容を破棄して、選択した書類を読み込みますか？',
      )
    ) {
      setMessage('読込をキャンセルしました。')
      return
    }

    const handle = await directory.getFileHandle(selectedFileName)
    const file = await handle.getFile()
    const data: unknown = JSON.parse(await file.text())

    if (!isApplicationDocument(data)) {
      throw new Error(
        '対応していない書類データです。入力内容は保持しています。',
      )
    }

    setApplication(data)
    setCurrentFileName(selectedFileName)
    setDirty(false)
    setMessage(`${selectedFileName}を読み込みました。`)
  }

  function editApplication(
    update: (current: ApplicationDocument) => ApplicationDocument,
  ) {
    if (operationRunning.current) return

    setApplication(update)
    setDirty(true)
    setMessage('書類を変更しました。保存してください。')
  }

  function duplicateApplication() {
    if (operationRunning.current) return

    if (
      dirty &&
      !window.confirm(
        '現在の入力内容を複製します。' +
          '元の書類への未保存の変更は、元ファイルには保存されません。' +
          '続けますか？',
      )
    ) {
      return
    }

    const companyName = window.prompt('複製先の応募企業名を入力してください。')

    if (companyName === null) return

    if (!companyName.trim()) {
      setMessage('複製先の応募企業名を入力してください。')
      return
    }

    const now = new Date()
    const timestamp = now.toISOString()
    const documentDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')

    const duplicated: ApplicationDocument = {
      ...structuredClone(application),
      id: crypto.randomUUID(),
      companyName: companyName.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      documentDate,
      status: 'draft',
    }

    setApplication(duplicated)
    setCurrentFileName(null)
    setSelectedFileName('')
    setDirty(true)
    setActiveTab('basic')

    setMessage(
      '別企業用に複製しました。内容を確認して保存してください。' +
        '志望動機など、元の企業向けの文章もコピーされています。',
    )
  }

    async function saveCommonProfile() {
    if (!directory) return

    const confirmed = window.confirm(
      '編集中の書類の氏名・住所・連絡先・学歴・職歴・資格などを、' +
        '共通プロフィールとして保存します。' +
        '既存のprofile.jsonがある場合は上書きします。よろしいですか？',
    )

    if (!confirmed) {
      setMessage('共通プロフィールの保存をキャンセルしました。')
      return
    }

    const profileFile: ProfileFile = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      profile: structuredClone(application.profile),
    }

    const handle = await directory.getFileHandle('profile.json', {
      create: true,
    })
    const writable = await handle.createWritable()

    try {
      await writable.write(JSON.stringify(profileFile, null, 2))
      await writable.close()
    } catch (error) {
      try {
        await writable.abort()
      } catch {
        // 元の書き込みエラーを表示する。
      }

      throw error
    }

    // 企業別書類を保存したわけではないため、
    // dirty（書類の未保存状態）は変更しない。
    setMessage(
      '共通プロフィールを保存しました。' +
        '企業別書類の保存状態は変更していません。',
    )
  }

  async function createFromCommonProfile() {
    if (!directory) return

    let profileFile: ProfileFile

    try {
      const handle = await directory.getFileHandle('profile.json')
      const file = await handle.getFile()
      const data: unknown = JSON.parse(await file.text())

      if (!isProfileFile(data)) {
        throw new Error(
          '共通プロフィールの形式が正しくありません。' +
            '現在の入力内容は保持しています。',
        )
      }

      profileFile = data
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'NotFoundError'
      ) {
        throw new Error(
          'profile.jsonがありません。' +
            '先に「現在のプロフィールを共通用に保存」を押してください。',
        )
      }

      throw error
    }

    if (
      dirty &&
      !window.confirm(
        '未保存の入力内容を破棄して、新しい書類を作成しますか？' +
          '残したい内容がある場合は、キャンセルして先に書類を保存してください。',
      )
    ) {
      setMessage('新しい書類の作成をキャンセルしました。')
      return
    }

    const companyName = window.prompt('応募先企業名を入力してください。')

    if (companyName === null) {
      setMessage('新しい書類の作成をキャンセルしました。')
      return
    }

    if (!companyName.trim()) {
      setMessage('応募先企業名を入力してください。')
      return
    }

    const created = createApplicationFromProfile(
      profileFile.profile,
      companyName.trim(),
    )

    setApplication(created)
    setCurrentFileName(null)
    setSelectedFileName('')
    setDirty(true)
    setActiveTab('basic')

    setMessage(
      '共通プロフィールから新しい書類を作成しました。' +
        '応募職種・志望動機・職務経歴書を入力して保存してください。',
    )
  }

  const documentCheck = checkDocument(application, previewType)

  function printCurrentDocument() {
    if (operationRunning.current) return

    const result = checkDocument(application, previewType)

    if (result.errors.length > 0) {
      setMessage('印刷前に、プレビューに表示されたエラーを修正してください。')
      return
    }

    window.print()
  }

  return (
    <main data-active-tab={activeTab}>
      <h1>履歴書・職務経歴書の作成</h1>

      {!supported && (
        <p role="alert">
          このブラウザはフォルダ選択に対応していません。
          ChromeでローカルURLを開いてください。
        </p>
      )}

      <fieldset disabled={busy}>
        <legend>書類の管理・保存</legend>

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
            編集中の書類を保存
          </button>

          <button
            type="button"
            onClick={duplicateApplication}
          >
            別企業用に複製
          </button>
        </div>

        <p>保存先：{directory?.name ?? '未選択'}</p>
        <p>
          編集中：{application.companyName || '企業名未入力'}
        </p>
        <p>
          保存ファイル：{currentFileName ?? '未保存の新しい書類'}
        </p>
        <p>
          {dirty
            ? '未保存の変更があります'
            : '保存済みデータと一致しています'}
        </p>

        <label>
          読み込む書類
          <select
            value={selectedFileName}
            disabled={!directory}
            onChange={(event) =>
              setSelectedFileName(event.target.value)
            }
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              margin: '8px 0 16px',
              font: 'inherit',
            }}
          >
            <option value="">書類を選択してください</option>

            {documentFiles.map((item) => (
              <option key={item.fileName} value={item.fileName}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="actions">
          <button
            type="button"
            disabled={!directory || !selectedFileName}
            onClick={() => void runOperation(loadApplication)}
          >
            選択した書類を読み込む
          </button>

          <button
            type="button"
            disabled={!directory}
            onClick={() => void runOperation(refreshDocumentFiles)}
          >
            一覧を更新
          </button>
        </div>

        <p>
          一覧で選択しただけでは、編集中の書類は切り替わりません。
          「選択した書類を読み込む」を押してください。
        </p>
      </fieldset>

      <p role="status">{busy ? '処理中です…' : message}</p>

      <nav className="editor-tabs" aria-label="編集画面の切り替え">
        {editorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={busy}
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

            {activeTab === 'basic' && (
        <>
          <fieldset disabled={busy}>
            <legend>共通プロフィール</legend>

            <p>
              氏名・住所・連絡先・学歴・職歴・資格などを、
              次の応募先にも使えるプロフィールとして保存できます。
              学歴・職歴・資格は「履歴書」タブで編集してください。
            </p>

            <div className="actions">
              <button
                type="button"
                disabled={!directory}
                onClick={() => void runOperation(saveCommonProfile)}
              >
                現在のプロフィールを共通用に保存
              </button>

              <button
                type="button"
                disabled={!directory}
                onClick={() =>
                  void runOperation(createFromCommonProfile)
                }
              >
                共通プロフィールから新規作成
              </button>
            </div>

            <p>
              共通プロフィールの保存先は、選択中のフォルダ内の
              profile.jsonです。既存の企業別書類は自動変更されません。
            </p>
          </fieldset>

          <ResumeEditor
            application={application}
            disabled={busy}
            section="basic"
            onChange={editApplication}
          />
        </>
      )}

      {activeTab === 'resume' && (
        <ResumeEditor
          application={application}
          disabled={busy}
          section="resume"
          onChange={editApplication}
        />
      )}

      {activeTab === 'career' && (
        <>
          <CareerEditor
            application={application}
            disabled={busy}
            onChange={editApplication}
          />

          <CareerLayoutEditor
            application={application}
            disabled={busy}
            onChange={editApplication}
          />
        </>
      )}

      {activeTab === 'preview' && (
        <fieldset disabled={busy}>
          <legend>プレビュー・印刷</legend>

                    <p>
            印刷対象：
            {previewType === 'resume' ? '履歴書' : '職務経歴書'}
            {' ／ '}
            {application.companyName || '企業名未入力'}
          </p>

          {documentCheck.errors.length > 0 && (
            <div className="document-check document-check-error">
              <h3>印刷前に修正してください</h3>
              <ul>
                {documentCheck.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {documentCheck.warnings.length > 0 && (
            <div className="document-check document-check-warning">
              <h3>未入力の確認事項</h3>
              <p>
                意図した空欄であれば、そのまま印刷できます。
              </p>
              <ul>
                {documentCheck.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {documentCheck.errors.length === 0 &&
            documentCheck.warnings.length === 0 && (
              <p>自動チェックの対象項目に問題は見つかりませんでした。</p>
            )}

          {dirty && (
            <p>
              未保存の変更があります。PDFには現在の画面の内容が反映されます。
              再編集できるよう、JSONも保存してください。
            </p>
          )}

          <p>
            印刷プレビューでA4・倍率100%を確認し、
            ヘッダーとフッターをオフにしてください。
            文字の欠け・重なり・空白ページを確認し、
            履歴書は2ページに収まっていることを確認してください。
          </p>

          <div className="actions preview-actions">
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

            <button
              type="button"
              disabled={documentCheck.errors.length > 0}
              onClick={printCurrentDocument}
            >
              表示中の書類を印刷・PDF保存
            </button>
          </div>
        </fieldset>
      )}

      {previewType === 'career' ? (
        <CareerPreview
          fullName={application.profile.fullName}
          documentDate={application.documentDate}
          content={application.careerHistory}
          layout={application.layout}
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