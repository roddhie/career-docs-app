import type { SkillColumnWidths } from '../types/documents'

export const defaultSkillColumnWidths: SkillColumnWidths = [15, 15, 10, 60]
export const minSkillColumnWidth = 8

export function isSkillColumnWidths(value: unknown): value is SkillColumnWidths {
  return (
    Array.isArray(value) &&
    value.length === defaultSkillColumnWidths.length &&
    value.every((width) => Number.isInteger(width) && width >= minSkillColumnWidth) &&
    value.reduce((total, width) => total + width, 0) === 100
  )
}
