import type { ApplicationDocument } from '../types/documents'

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasStrings(value: JsonObject, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string')
}

function isArrayOf(
  value: unknown,
  validate: (item: unknown) => boolean,
): boolean {
  return Array.isArray(value) && value.every(validate)
}

function isString(value: unknown): boolean {
  return typeof value === 'string'
}

function isDatedEntry(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, ['id', 'year', 'month', 'description'])
  )
}

function isAddress(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, ['postalCode', 'address', 'addressKana'])
  )
}

function isProfile(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, [
      'fullName',
      'fullNameKana',
      'birthDate',
      'gender',
      'phone',
      'email',
    ]) &&
    isAddress(value.currentAddress) &&
    isAddress(value.contactAddress) &&
    typeof value.useCurrentAddressForContact === 'boolean' &&
    isArrayOf(value.education, isDatedEntry) &&
    isArrayOf(value.employment, isDatedEntry) &&
    isArrayOf(value.qualifications, isDatedEntry) &&
    (value.photoPath === null || typeof value.photoPath === 'string')
  )
}

function isSkill(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, [
      'id',
      'category',
      'technology',
      'experience',
      'description',
    ])
  )
}

function isProject(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, [
      'id',
      'name',
      'startDate',
      'endDate',
      'overview',
      'responsibilities',
      'achievements',
      'technologies',
      'role',
      'teamSize',
    ]) &&
    typeof value.ongoing === 'boolean'
  )
}

function isCareer(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, [
      'id',
      'companyName',
      'startDate',
      'endDate',
      'employmentType',
      'businessDescription',
    ]) &&
    typeof value.ongoing === 'boolean' &&
    isArrayOf(value.projects, isProject)
  )
}

function isCareerHistory(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStrings(value, ['summary', 'selfPromotion']) &&
    isArrayOf(value.skills, isSkill) &&
    isArrayOf(value.careers, isCareer)
  )
}

function isSectionId(value: unknown): boolean {
  return (
    value === 'summary' ||
    value === 'skills' ||
    value === 'careers' ||
    value === 'selfPromotion'
  )
}

function isLayout(value: unknown): boolean {
  if (!isObject(value)) return false

  const order = value.careerSectionOrder

  return (
    value.resumeTemplate === 'mhlw-a4' &&
    value.resumeTemplateVersion === 1 &&
    value.careerTemplate === 'standard-a4' &&
    value.careerTemplateVersion === 1 &&
    Array.isArray(order) &&
    order.length === 4 &&
    order.every(isSectionId) &&
    new Set(order).size === 4 &&
    isArrayOf(value.pageBreakBeforeSectionIds, isSectionId) &&
    isArrayOf(value.pageBreakBeforeCareerIds, isString) &&
    isArrayOf(value.pageBreakBeforeProjectIds, isString)
  )
}

export function isApplicationDocument(
  value: unknown,
): value is ApplicationDocument {
  return (
    isObject(value) &&
    value.schemaVersion === 1 &&
    hasStrings(value, [
      'id',
      'companyName',
      'jobTitle',
      'createdAt',
      'updatedAt',
      'documentDate',
    ]) &&
    (value.status === 'draft' || value.status === 'submitted') &&
    isProfile(value.profile) &&
    isObject(value.resume) &&
    hasStrings(value.resume, ['motivation', 'personalRequests']) &&
    isCareerHistory(value.careerHistory) &&
    isLayout(value.layout)
  )
}