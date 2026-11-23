import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { SkillEntry } from '../types/documents'
import './SkillsTable.css'

const fields = [
  { key: 'category', label: '分類' },
  { key: 'technology', label: '技術' },
  { key: 'experience', label: '経験' },
  { key: 'description', label: '対応できる内容' },
] as const

type Props = {
  skills: SkillEntry[]
  onChange?: (id: string, patch: Partial<SkillEntry>) => void
  renderActions?: (skill: SkillEntry, index: number) => ReactNode
}

function SkillInput({ value, label, onChange }: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [value])

  return <textarea ref={ref} aria-label={label} rows={1} value={value}
    wrap="soft" onChange={(event) => onChange(event.target.value)} />
}

export default function SkillsTable({ skills, onChange, renderActions }: Props) {
  return (
    <table className="career-skills-table">
      <colgroup>
        <col style={{ width: '15%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '60%' }} />
      </colgroup>
      <thead><tr>{fields.map(({ key, label }) =>
        <th key={key} scope="col">{label}</th>,
      )}</tr></thead>
      {skills.map((skill, index) => (
        <tbody key={skill.id}>
          <tr>{fields.map(({ key, label }) => (
            <td key={key} className={onChange ? 'skill-input-cell' : undefined}>
              {onChange ? <SkillInput value={skill[key]}
                label={`技術・スキル${index + 1}：${label}`}
                onChange={(value) => onChange(skill.id, { [key]: value })} />
                : skill[key]}
            </td>
          ))}</tr>
          {renderActions && <tr className="skill-actions-row"><td colSpan={4}>
            {renderActions(skill, index)}
          </td></tr>}
        </tbody>
      ))}
    </table>
  )
}
