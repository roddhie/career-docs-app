// 履歴書に記載する年月付きの1行。
// 年・月は空欄や編集中の入力も扱えるように文字列で保持する。
export type DatedEntry = {
  id: string
  year: string
  month: string
  description: string
}

export type ContactAddress = {
  postalCode: string
  address: string
  addressKana: string
}

// 共通プロフィールとして登録し、企業別書類の作成時にコピーする。
export type PersonalProfile = {
  fullName: string
  fullNameKana: string
  birthDate: string
  gender: string
  phone: string
  email: string
  currentAddress: ContactAddress
  contactAddress: ContactAddress
  useCurrentAddressForContact: boolean
  education: DatedEntry[]
  employment: DatedEntry[]
  qualifications: DatedEntry[]

  // 保存フォルダからの相対パス。写真未登録の場合はnull。
  photoPath: string | null
}

export type ResumeContent = {
  motivation: string
  personalRequests: string
}

export type SkillEntry = {
  id: string
  category: string
  technology: string
  experience: string
  description: string
}

export type ProjectEntry = {
  id: string
  name: string
  startDate: string
  endDate: string
  ongoing: boolean
  overview: string
  responsibilities: string
  achievements: string
  technologies: string
  role: string
  teamSize: string
}

export type CareerEntry = {
  id: string
  companyName: string
  startDate: string
  endDate: string
  ongoing: boolean
  employmentType: string
  businessDescription: string
  projects: ProjectEntry[]
}

export type CareerHistoryContent = {
  summary: string
  skills: SkillEntry[]
  careers: CareerEntry[]
  selfPromotion: string
}

export type CareerSectionId =
  | 'summary'
  | 'skills'
  | 'careers'
  | 'selfPromotion'

export type DocumentLayout = {
  resumeTemplate: 'mhlw-a4'
  resumeTemplateVersion: 1
  careerTemplate: 'standard-a4'
  careerTemplateVersion: 1

  // この配列の順番で職務経歴書の各セクションを表示する。
  careerSectionOrder: CareerSectionId[]

  // 指定したセクション・職歴・プロジェクトの直前で改ページする。
  pageBreakBeforeSectionIds: CareerSectionId[]
  pageBreakBeforeCareerIds: string[]
  pageBreakBeforeProjectIds: string[]
}

// 共通プロフィールを保存するprofile.jsonの形式。
export type ProfileFile = {
  schemaVersion: 1
  updatedAt: string
  profile: PersonalProfile
}

// 応募先ごとに保存するJSONの形式。
export type ApplicationDocument = {
  schemaVersion: 1
  id: string
  companyName: string
  jobTitle: string
  createdAt: string
  updatedAt: string
  documentDate: string
  status: 'draft' | 'submitted'

  // 作成時の共通プロフィールを複製して保持する。
  profile: PersonalProfile
  resume: ResumeContent
  careerHistory: CareerHistoryContent
  layout: DocumentLayout
}