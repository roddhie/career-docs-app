import type { ApplicationDocument } from '../types/documents'
import { sampleCareer } from './sampleCareer'
import { sampleProfile, sampleResume } from './sampleResume'

export function createSampleApplication(): ApplicationDocument {
  const now = new Date()
  const timestamp = now.toISOString()

  // 書類の日付は、利用者のPCのローカル日付を使用する。
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    companyName: '株式会社応募先サンプル',
    jobTitle: 'フロントエンドエンジニア',
    createdAt: timestamp,
    updatedAt: timestamp,
    documentDate: `${year}-${month}-${day}`,
    status: 'draft',
    profile: structuredClone(sampleProfile),
    resume: structuredClone(sampleResume),
    careerHistory: structuredClone(sampleCareer),
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