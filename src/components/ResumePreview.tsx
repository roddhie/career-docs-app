import type {
  DatedEntry,
  PersonalProfile,
  ResumeContent,
} from '../types/documents'
import './ResumePreview.css'

type ResumePreviewProps = {
  profile: PersonalProfile
  content: ResumeContent
  documentDate: string
  photoUrl: string | null
}

type HistoryTableProps = {
  title: string
  entries: DatedEntry[]
  rowCount: number
}

function formatDate(value: string): string {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function getAge(birthDate: string, documentDate: string): string {
  if (!birthDate || !documentDate) return ''

  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number)
  const [year, month, day] = documentDate.split('-').map(Number)
  const beforeBirthday =
    month < birthMonth || (month === birthMonth && day < birthDay)

  return String(year - birthYear - (beforeBirthday ? 1 : 0))
}

function HistoryTable({
  title,
  entries,
  rowCount,
}: HistoryTableProps) {
  return (
    <table className="resume-table">
      <colgroup>
        <col className="resume-year" />
        <col className="resume-month" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">年</th>
          <th scope="col">月</th>
          <th scope="col">{title}</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, index) => {
          const entry = entries[index]

          return (
            <tr key={entry?.id ?? `blank-${index}`}>
              <td>{entry?.year}</td>
              <td>{entry?.month}</td>
              <td>{entry?.description}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function ResumePreview({
  profile,
  content,
  documentDate,
  photoUrl,
}: ResumePreviewProps) {
  const history: DatedEntry[] = [
    { id: 'heading-education', year: '', month: '', description: '学歴' },
    ...profile.education,
    { id: 'heading-employment', year: '', month: '', description: '職歴' },
    ...profile.employment,
    { id: 'history-end', year: '', month: '', description: '以上' },
  ]

  // 行を切り捨てて印刷することを防ぐ。
  if (history.length > 24 || profile.qualifications.length > 8) {
    return (
      <article className="resume-document" role="alert">
        <p>
          履歴書の行数上限を超えています。
          学歴・職歴は見出しを含め24行、免許・資格は8行以内にしてください。
        </p>
      </article>
    )
  }

  const contactAddress = profile.useCurrentAddressForContact
    ? '同上'
    : `〒${profile.contactAddress.postalCode} ${profile.contactAddress.address}`

  return (
    <article className="resume-document">
      <section className="resume-page">
        <div className="resume-page-body resume-page-body-first">
          <header className="resume-header">
            <h1>履歴書</h1>
            <p>{formatDate(documentDate)}現在</p>
          </header>

          <div className="resume-personal">
            <div className="resume-name-area">
              <div className="resume-field">
                <span>ふりがな</span>
                <p>{profile.fullNameKana}</p>
              </div>
              <div className="resume-field resume-dotted-divider">
                <span>氏名</span>
                <p className="resume-name">{profile.fullName}</p>
              </div>
              <div className="resume-field">
                <p>
                  {formatDate(profile.birthDate)}生
                  （満{getAge(profile.birthDate, documentDate)}歳）
                </p>
                <p className="resume-dotted-divider">性別（任意）：{profile.gender}</p>
              </div>
            </div>

            <div className={`resume-photo${photoUrl ? ' has-photo' : ''}`}>
              {photoUrl ? (
                <img src={photoUrl} alt="証明写真" />
              ) : (
                '写真貼付欄'
              )}
            </div>
          </div>

          <div className="resume-address">
            <div className="resume-address-cell">
              <span>ふりがな</span>
              <p>{profile.currentAddress.addressKana}</p>
            </div>

            <div className="resume-address-cell resume-address-right">
              <span>電話</span>
              <p>{profile.phone}</p>
            </div>

            <div className="resume-address-divider resume-dotted-divider" aria-hidden="true" />

            <div className="resume-address-cell">
              <span>現住所{'\u3000'}〒{profile.currentAddress.postalCode}</span>
              <p>{profile.currentAddress.address}</p>
            </div>

            <div className="resume-address-cell resume-address-right">
              <span>メール</span>
              <p>{profile.email}</p>
            </div>
          </div>

          <div className="resume-field resume-contact">
            <span>連絡先（現住所以外に連絡を希望する場合）</span>
            <p>
              {!profile.useCurrentAddressForContact &&
                profile.contactAddress.addressKana}
            </p>
            <p className={profile.useCurrentAddressForContact ? undefined : 'resume-dotted-divider'}>
              {contactAddress}
            </p>
          </div>

          <HistoryTable
            title="学歴・職歴（各別にまとめて書く）"
            entries={history.slice(0, 15)}
            rowCount={15}
          />
        </div>

        <p className="resume-note">※性別欄の記載は任意です。</p>
      </section>

      <section className="resume-page">
        <div className="resume-page-body">
          <HistoryTable
            title="学歴・職歴（各別にまとめて書く）"
            entries={history.slice(15)}
            rowCount={9}
          />

          <HistoryTable
            title="免許・資格"
            entries={profile.qualifications}
            rowCount={8}
          />

          <div className="resume-text-box resume-motivation">
            <span>志望の動機、特技、好きな学科、アピールポイントなど</span>
            <p>{content.motivation}</p>
          </div>

          <div className="resume-text-box resume-requests">
            <span>
              本人希望記入欄（給料・職種・勤務時間・勤務地などの希望）
            </span>
            <p>{content.personalRequests}</p>
          </div>
        </div>
      </section>
    </article>
  )
}
