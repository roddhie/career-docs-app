import type {
  ApplicationDocument,
  PersonalProfile,
} from '../types/documents'

export function createApplicationFromProfile(
  profile: PersonalProfile,
  companyName: string,
): ApplicationDocument {
  const now = new Date()
  const timestamp = now.toISOString()

  const documentDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    companyName,
    jobTitle: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    documentDate,
    status: 'draft',

    // 企業別書類が独立した内容を保持するようにコピーする。
    profile: structuredClone(profile),

    resume: {
      motivation: '',
      personalRequests: '',
    },

    careerHistory: {
      summary: '',
      skills: [],
      careers: [],
      selfPromotion: '',
    },

    layout: {
      resumeTemplate: 'mhlw-a4',
      resumeTemplateVersion: 1,
      careerTemplate: 'standard-a4',
      careerTemplateVersion: 1,
      careerSectionOrder: [
        'summary',
        'skills',
        'careers',
        'selfPromotion',
      ],
      pageBreakBeforeSectionIds: [],
      pageBreakBeforeCareerIds: [],
      pageBreakBeforeProjectIds: [],
    },
  }
}