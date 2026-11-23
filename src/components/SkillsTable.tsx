import { useLayoutEffect, useRef } from 'react'
import type { SkillEntry } from '../types/documents'
import './SkillsTable.css'

const fields = [
  { key: 'category', label: '分類', width: 15 },
  { key: 'technology', label: '技術', width: 15 },
  { key: 'experience', label: '経験', width: 10 },
  { key: 'description', label: '対応できる内容', width: 60 },
] as const

type Editing = {
  onChange: (id: string, patch: Partial<SkillEntry>) => void
  onMove: (id: string, direction: -1 | 1) => void
  onRemove: (id: string) => void
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

export default function SkillsTable({ skills, editing }: {
  skills: SkillEntry[]
  editing?: Editing
}) {
  return (
    <table className={`career-skills-table${editing ? ' skills-table-editable' : ''}`}>
      <colgroup>
        {editing && <col className="skill-action-column" />}
        {fields.map(({ key, width }) => (
          <col key={key} style={{
            width: editing ? `calc(var(--skill-fields-width) * ${width / 100})` : `${width}%`,
          }} />
        ))}
        {editing && <col className="skill-action-column" />}
      </colgroup>
      <thead>
        <tr>
          {editing && <th className="skill-action-cell" scope="col" aria-label="行移動" />}
          {fields.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}
          {editing && <th className="skill-action-cell skill-delete-cell" scope="col" aria-label="削除" />}
        </tr>
      </thead>
      {skills.map((skill, index) => (
        <tbody key={skill.id}>
          <tr>
            {editing && (
              <td className="skill-action-cell">
                <div className="skill-move-buttons">
                  <button
                    type="button"
                    aria-label={`技術・スキル${index + 1}を上へ移動`}
                    title="上へ移動"
                    disabled={index === 0}
                    onClick={() => editing.onMove(skill.id, -1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
                  </button>
                  <button
                    type="button"
                    aria-label={`技術・スキル${index + 1}を下へ移動`}
                    title="下へ移動"
                    disabled={index === skills.length - 1}
                    onClick={() => editing.onMove(skill.id, 1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6" /></svg>
                  </button>
                </div>
              </td>
            )}
            {fields.map(({ key, label }) => (
              <td key={key} className={editing ? 'skill-input-cell' : undefined}>
                {editing ? (
                  <SkillInput
                    value={skill[key]}
                    label={`技術・スキル${index + 1}：${label}`}
                    onChange={(value) => editing.onChange(skill.id, { [key]: value })}
                  />
                ) : skill[key]}
              </td>
            ))}
            {editing && (
              <td className="skill-action-cell skill-delete-cell">
                <button
                  type="button"
                  aria-label={`技術・スキル${index + 1}を削除`}
                  title="削除"
                  onClick={() => editing.onRemove(skill.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18M9 6V3h6v3m4 0-1 15H6L5 6m5 4v7m4-7v7" />
                  </svg>
                </button>
              </td>
            )}
          </tr>
        </tbody>
      ))}
    </table>
  )
}
