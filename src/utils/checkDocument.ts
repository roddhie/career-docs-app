import type {
  ApplicationDocument,
  DatedEntry,
} from '../types/documents'

export type DocumentCheckResult = {
  errors: string[]
  warnings: string[]
}

function isValidMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])

  return year >= 1 && month >= 1 && month <= 12
}

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!isValidMonth(`${match[1]}-${match[2]}`)) {
    return false
  }

  const leapYear =
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0)

  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return day >= 1 && day <= daysInMonth[month - 1]
}

export function checkDocument(
  application: ApplicationDocument,
  documentType: 'resume' | 'career',
): DocumentCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const { profile, resume, careerHistory } = application

  function warnIfEmpty(value: string, label: string) {
    if (!value.trim()) {
      warnings.push(`${label}が未入力です。`)
    }
  }

  function checkDate(value: string, label: string) {
    if (!value.trim()) {
      warnings.push(`${label}が未入力です。`)
    } else if (!isValidDate(value)) {
      errors.push(`${label}を正しい日付で入力してください。`)
    }
  }

  function checkEntries(entries: DatedEntry[], label: string) {
    entries.forEach((entry, index) => {
      const name = `${label}の${index + 1}行目`
      const year = entry.year.trim()
      const month = entry.month.trim()

      // 「現在に至る」など、年と月が両方空欄の行は許可する。
      if (year || month) {
        if (
          !/^\d{4}$/.test(year) ||
          Number(year) < 1 ||
          !/^\d{1,2}$/.test(month) ||
          Number(month) < 1 ||
          Number(month) > 12
        ) {
          errors.push(
            `${name}の年月を確認してください。` +
              '西暦4桁・月1〜12、または年と月の両方を空欄にしてください。',
          )
        }
      }

      warnIfEmpty(entry.description, `${name}の内容`)
    })
  }

  function checkPeriod(
    startDate: string,
    endDate: string,
    ongoing: boolean,
    label: string,
  ) {
    if (!startDate) {
      warnings.push(`${label}の開始年月が未入力です。`)
    } else if (!isValidMonth(startDate)) {
      errors.push(`${label}の開始年月が正しくありません。`)
    }

    // 在籍中・参画中の場合、入力欄に残っている終了年月は使わない。
    if (ongoing) return

    if (!endDate) {
      warnings.push(`${label}の終了年月が未入力です。`)
    } else if (!isValidMonth(endDate)) {
      errors.push(`${label}の終了年月が正しくありません。`)
    }

    if (
      isValidMonth(startDate) &&
      isValidMonth(endDate) &&
      startDate > endDate
    ) {
      errors.push(`${label}の終了年月が開始年月より前です。`)
    }
  }

  warnIfEmpty(application.companyName, '応募先企業名')
  warnIfEmpty(profile.fullName, '氏名')
  checkDate(application.documentDate, '書類の日付')

  if (documentType === 'resume') {
    warnIfEmpty(profile.fullNameKana, '氏名のふりがな')
    warnIfEmpty(profile.currentAddress.address, '現住所')
    checkDate(profile.birthDate, '生年月日')

    if (
      isValidDate(profile.birthDate) &&
      isValidDate(application.documentDate) &&
      profile.birthDate > application.documentDate
    ) {
      errors.push('生年月日が書類の日付より後になっています。')
    }

    if (!profile.phone.trim() && !profile.email.trim()) {
      warnings.push('電話番号とメールアドレスが両方未入力です。')
    }

    if (
      !profile.useCurrentAddressForContact &&
      !profile.contactAddress.address.trim()
    ) {
      warnings.push('別の連絡先を選択していますが、住所が未入力です。')
    }

    if (profile.education.length + profile.employment.length > 19) {
      errors.push('履歴書の学歴・職歴は合計19行以内にしてください。')
    }

    if (profile.qualifications.length > 6) {
      errors.push('履歴書の免許・資格は6行以内にしてください。')
    }

    checkEntries(profile.education, '学歴')
    checkEntries(profile.employment, '職歴')
    checkEntries(profile.qualifications, '免許・資格')

    warnIfEmpty(resume.motivation, '志望動機・アピールポイント')
    warnIfEmpty(resume.personalRequests, '本人希望欄')
  } else {
    warnIfEmpty(careerHistory.summary, '職務要約')
    warnIfEmpty(careerHistory.selfPromotion, '自己PR')

    if (careerHistory.careers.length === 0) {
      warnings.push('職務経歴が登録されていません。')
    }

    careerHistory.skills.forEach((skill, index) => {
      warnIfEmpty(skill.technology, `技術・スキル${index + 1}の技術名`)
    })

    careerHistory.careers.forEach((career, index) => {
      const label = `職歴${index + 1}`

      warnIfEmpty(career.companyName, `${label}の会社名`)
      checkPeriod(
        career.startDate,
        career.endDate,
        career.ongoing,
        label,
      )

      career.projects.forEach((project, projectIndex) => {
        const projectLabel =
          `${label}のプロジェクト${projectIndex + 1}`

        warnIfEmpty(project.name, `${projectLabel}の名前`)
        checkPeriod(
          project.startDate,
          project.endDate,
          project.ongoing,
          projectLabel,
        )
      })
    })
  }

  return { errors, warnings }
}