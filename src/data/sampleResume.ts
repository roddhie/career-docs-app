import type {
  PersonalProfile,
  ResumeContent,
} from '../types/documents'

export const sampleProfile: PersonalProfile = {
  fullName: '山田 太郎',
  fullNameKana: 'やまだ たろう',
  birthDate: '1995-04-10',
  gender: '',
  phone: '000-0000-0000',
  email: 'sample@example.com',
  currentAddress: {
    postalCode: '000-0000',
    address: 'サンプル県サンプル市1-2-3',
    addressKana: 'さんぷるけん さんぷるし',
  },
  contactAddress: {
    postalCode: '',
    address: '',
    addressKana: '',
  },
  useCurrentAddressForContact: true,
  education: [
    {
      id: 'education-001',
      year: '2014',
      month: '4',
      description: 'サンプル大学 情報学部 入学',
    },
    {
      id: 'education-002',
      year: '2018',
      month: '3',
      description: 'サンプル大学 情報学部 卒業',
    },
  ],
  employment: [
    {
      id: 'employment-001',
      year: '2018',
      month: '4',
      description: '株式会社サンプル開発 入社',
    },
    {
      id: 'employment-002',
      year: '',
      month: '',
      description: '現在に至る',
    },
  ],
  qualifications: [
    {
      id: 'qualification-001',
      year: '2020',
      month: '10',
      description: '基本情報技術者試験 合格',
    },
  ],
  photoPath: null,
}

export const sampleResume: ResumeContent = {
  motivation:
    'これまでの画面開発の経験を活かし、利用者にとって使いやすい' +
    'Webサービスの開発に携わりたいと考え、志望いたしました。',
  personalRequests: '貴社の規定に従います。',
}