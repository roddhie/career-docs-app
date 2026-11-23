import type {
  ApplicationDocument,
  ContactAddress,
  DatedEntry,
  PersonalProfile,
} from '../types/documents'
import './ResumeEditor.css'

type ResumeEditorProps = {
  application: ApplicationDocument
  disabled: boolean
  section: 'resume' | 'basic'
  onChange: (
    update: (current: ApplicationDocument) => ApplicationDocument,
  ) => void
}

type EntryEditorProps = {
  title: string
  entries: DatedEntry[]
  maxRows: number
  onChange: (entries: DatedEntry[]) => void
}

type AddressEditorProps = {
  title: string
  address: ContactAddress
  onChange: (address: ContactAddress) => void
}

const personalFields: {
  key:
    | 'fullName'
    | 'fullNameKana'
    | 'birthDate'
    | 'gender'
    | 'phone'
    | 'email'
  label: string
  type: string
}[] = [
  { key: 'fullName', label: '氏名', type: 'text' },
  { key: 'fullNameKana', label: 'ふりがな', type: 'text' },
  { key: 'birthDate', label: '生年月日', type: 'date' },
  { key: 'gender', label: '性別（任意・空欄可）', type: 'text' },
  { key: 'phone', label: '電話番号', type: 'tel' },
  { key: 'email', label: 'メールアドレス', type: 'email' },
]

const addressFields: {
  key: keyof ContactAddress
  label: string
}[] = [
  { key: 'postalCode', label: '郵便番号' },
  { key: 'address', label: '住所' },
  { key: 'addressKana', label: '住所のふりがな' },
]

function AddressEditor({
  title,
  address,
  onChange,
}: AddressEditorProps) {
  return (
    <div>
      <h3>{title}</h3>

      {addressFields.map((field) => (
        <label key={field.key}>
          {field.label}
          <input
            value={address[field.key]}
            onChange={(event) =>
              onChange({
                ...address,
                [field.key]: event.target.value,
              })
            }
          />
        </label>
      ))}
    </div>
  )
}

function EntryEditor({
  title,
  entries,
  maxRows,
  onChange,
}: EntryEditorProps) {
  function addEntry() {
    if (entries.length >= maxRows) return

    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        year: '',
        month: '',
        description: '',
      },
    ])
  }

  function updateEntry(
    index: number,
    field: 'year' | 'month' | 'description',
    value: string,
  ) {
    onChange(
      entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    )
  }

  function removeEntry(index: number) {
    if (!window.confirm(`${title}の${index + 1}行目を削除しますか？`)) {
      return
    }

    onChange(entries.filter((_, entryIndex) => entryIndex !== index))
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= entries.length) return

    const reordered = [...entries]
    const [entry] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, entry)
    onChange(reordered)
  }

  return (
    <section className="entry-editor">
      <h3>{title}</h3>

      {entries.map((entry, index) => (
        <fieldset key={entry.id} className="entry-row">
          <legend>{title} {index + 1}行目</legend>

          <div className="entry-date">
            <label>
              年（西暦）
              <input
                inputMode="numeric"
                maxLength={4}
                value={entry.year}
                onChange={(event) =>
                  updateEntry(index, 'year', event.target.value)
                }
              />
            </label>

            <label>
              月
              <input
                inputMode="numeric"
                maxLength={2}
                value={entry.month}
                onChange={(event) =>
                  updateEntry(index, 'month', event.target.value)
                }
              />
            </label>
          </div>

          <label>
            内容
            <input
              value={entry.description}
              onChange={(event) =>
                updateEntry(index, 'description', event.target.value)
              }
            />
          </label>

          <div className="actions">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => moveEntry(index, -1)}
            >
              上へ
            </button>

            <button
              type="button"
              disabled={index === entries.length - 1}
              onClick={() => moveEntry(index, 1)}
            >
              下へ
            </button>

            <button type="button" onClick={() => removeEntry(index)}>
              削除
            </button>
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        disabled={entries.length >= maxRows}
        onClick={addEntry}
      >
        {title}を追加
      </button>
    </section>
  )
}

export default function ResumeEditor({
  application,
  disabled,
  section,
  onChange,
}: ResumeEditorProps) {
  const profile = application.profile
  const historyCount = profile.education.length + profile.employment.length

  function updateProfile(patch: Partial<PersonalProfile>) {
    onChange((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...patch,
      },
    }))
  }

  return (
    <fieldset className="document-editor" disabled={disabled}>
      <legend>
        {section === 'basic' ? '応募先・基本情報' : '履歴書の編集'}
      </legend>

      {section === 'basic' && (
        <>
      <label>
        応募先企業
        <input
          value={application.companyName}
          onChange={(event) => {
            const value = event.target.value
            onChange((current) => ({ ...current, companyName: value }))
          }}
        />
      </label>

      <label>
        応募職種
        <input
          value={application.jobTitle}
          onChange={(event) => {
            const value = event.target.value
            onChange((current) => ({ ...current, jobTitle: value }))
          }}
        />
      </label>

      <label>
        書類の日付
        <input
          type="date"
          value={application.documentDate}
          onChange={(event) => {
            const value = event.target.value
            onChange((current) => ({ ...current, documentDate: value }))
          }}
        />
      </label>

      <h3>基本情報</h3>

      {personalFields.map((field) => (
        <label key={field.key}>
          {field.label}
          <input
            type={field.type}
            value={profile[field.key]}
            onChange={(event) =>
              updateProfile({ [field.key]: event.target.value })
            }
          />
        </label>
      ))}

      <AddressEditor
        title="現住所"
        address={profile.currentAddress}
        onChange={(address) => updateProfile({ currentAddress: address })}
      />

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={profile.useCurrentAddressForContact}
          onChange={(event) =>
            updateProfile({
              useCurrentAddressForContact: event.target.checked,
            })
          }
        />
        連絡先は現住所と同じ
      </label>

      {!profile.useCurrentAddressForContact && (
        <AddressEditor
          title="別の連絡先"
          address={profile.contactAddress}
          onChange={(address) =>
            updateProfile({ contactAddress: address })
          }
        />
      )}
        </>
      )}

      {section === 'resume' && (
        <>
      <p>
        学歴・職歴は合計21行まで入力できます。
        「学歴」「職歴」「以上」は印刷時に自動で追加されます。
        現在 {historyCount} / 21行です。
      </p>
      {historyCount > 21 && (
        <p role="alert">学歴・職歴の行数を21行以内に調整してください。</p>
      )}

      <EntryEditor
        title="学歴"
        entries={profile.education}
        maxRows={21 - profile.employment.length}
        onChange={(entries) => updateProfile({ education: entries })}
      />

      <EntryEditor
        title="職歴"
        entries={profile.employment}
        maxRows={21 - profile.education.length}
        onChange={(entries) => updateProfile({ employment: entries })}
      />

      <p>
        「現在に至る」など年月を付けない内容は、年・月を空欄にできます。
      </p>

      <EntryEditor
        title="免許・資格"
        entries={profile.qualifications}
        maxRows={8}
        onChange={(entries) => updateProfile({ qualifications: entries })}
      />

      {profile.qualifications.length > 8 && (
        <p role="alert">免許・資格の行数を8行以内に調整してください。</p>
      )}

      <h3>志望動機・本人希望</h3>

      <label className="resume-text-field">
        志望の動機、特技、アピールポイントなど
        <textarea
          rows={6}
          value={application.resume.motivation}
          onChange={(event) => {
            const value = event.target.value
            onChange((current) => ({
              ...current,
              resume: { ...current.resume, motivation: value },
            }))
          }}
        />
      </label>

      <label className="resume-text-field">
        本人希望記入欄
        <textarea
          rows={4}
          value={application.resume.personalRequests}
          onChange={(event) => {
            const value = event.target.value
            onChange((current) => ({
              ...current,
              resume: { ...current.resume, personalRequests: value },
            }))
          }}
        />
      </label>

        </>
      )}
    </fieldset>
  )
}
