import type { ProfileFile } from '../types/documents'
import { createSampleApplication } from '../data/createSampleApplication'
import { isApplicationDocument } from './validateApplication'

export function isProfileFile(value: unknown): value is ProfileFile {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  if (
    !('schemaVersion' in value) ||
    value.schemaVersion !== 1 ||
    !('updatedAt' in value) ||
    typeof value.updatedAt !== 'string' ||
    !('profile' in value)
  ) {
    return false
  }

  // プロフィール部分は、既存の書類チェックと同じ条件で検証する。
  return isApplicationDocument({
    ...createSampleApplication(),
    profile: value.profile,
  })
}